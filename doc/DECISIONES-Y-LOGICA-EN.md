# Technical decisions, logic and gas — NFTMarketplace

A document aimed at **understanding the design** of module 05: what was chosen, why, how the protocol flows and what could still be optimized for gas.

Main contract: `src/NFTMarketplace.sol`  
Companions: [`GAS-EN.md`](./GAS-EN.md) · [`SWC-AUDIT-EN.md`](./SWC-AUDIT-EN.md) · [`flujograma-EN.md`](./flujograma-EN.md)

---

## 1. Protocol logic

### Mental model

The marketplace is a **fixed-price escrow**:

1. The seller deposits the NFT into the contract (`listItem`).
2. While the listing exists, the contract owns the NFT.
3. The buyer pays ETH (`buyItem`); the contract splits fee / royalty / seller and delivers the NFT.
4. The seller can withdraw the NFT without a sale (`cancelListing`).

There are no offers, auctions or deferred payments (pull-payments): all the ETH is pushed within the same purchase transaction.

### `listItem` flow

```
Checks
  price != 0
  ownerOf(tokenId) == msg.sender
Effects
  _listings[nft][tokenId] = { seller: msg.sender, price }
Interactions
  safeTransferFrom(seller → marketplace)
Event
  ItemListed
```

- The NFT enters escrow **after** the listing is written (the effects→interaction order prevents a listing without custody if the transfer reverts).
- `onERC721Received` on the marketplace allows `safeTransferFrom`.

### `cancelListing` flow

```
Checks
  listing exists (seller != address(0))
  msg.sender == seller
Effects  (CEI)
  delete _listings[nft][tokenId]
Interactions
  safeTransferFrom(marketplace → seller)
```

Protected with `nonReentrant` (the seller's `onERC721Received` callback could try to reenter).

### `buyItem` flow

```
Checks
  listing exists
  msg.value >= price
Effects  (CEI)
  delete listing
  compute: protocolFee, royalty, sellerProceeds
Interactions
  1. safeTransferFrom(marketplace → buyer)   // NFT first
  2. _pay(feeRecipient, protocolFee)        // if > 0
  3. _pay(royaltyReceiver, royaltyAmount)   // if > 0
  4. _pay(seller, sellerProceeds)
  5. _pay(buyer, msg.value - price)         // refund of excess
```

Deliberate order:

| Step | Reason |
|------|--------|
| `delete` before anything else | If something external fails later, no reusable ghost listing remains |
| NFT to the buyer before ETH | The buyer is already the owner if a later payment fails… **but** if any `_pay` fails, the whole tx reverts (including the NFT transfer). Consistent state. |
| Fee → royalty → seller | Fee and royalty are the split's "obligations"; the seller gets the rest |
| Refund at the end | Only the excess over `price`; the split is computed on `price`, not on `msg.value` |

### Payment split (`_calculatePayments`)

```
protocolFee = price * feeBps / 10_000
remaining   = price - protocolFee          // checked (fee cannot exceed price)

if the NFT supports ERC-2981:
  (receiver, amount) = royaltyInfo(tokenId, price)
  amount = min(amount, remaining)          // on-chain cap
  if receiver == 0 or amount == 0 → no royalty

sellerProceeds = remaining - royaltyAmount // unchecked (already capped)
```

- Royalties are **voluntary** (only if `supportsInterface(IERC2981)`).
- `try/catch` on `supportsInterface`: an NFT without ERC-165 does not break the purchase; it is treated as "no royalty".

### Security invariants

| Invariant | How it is guaranteed |
|-----------|----------------------|
| One listed token = one listing | Unique `(nft, tokenId)` mapping |
| No reentry on buy/cancel | CEI + transient `ReentrancyGuard` |
| ETH only leaves through known paths | No admin `withdraw`; only `_pay` in `buyItem` |
| A failed payment leaves no half-done state | `.call` + `TransferFailed` revert → full rollback |
| Seller cannot be tricked with price 0 | `ZeroPrice` |

---

## 2. Technical decisions (and why)

### Architecture

| Decision | Discarded alternative | Why |
|----------|-----------------------|-----|
| **Escrow** (NFT held by the contract) | Only `approve` + atomic `transferFrom` on buy | Escrow simplifies cancellation and avoids the "approve without list" race; the module requires explicit custody |
| Fixed price in native ETH | ERC-20 / WETH | Module scope; smaller surface (no buyer allowances) |
| Fee + royalty in the same tx | Pull-payments (claim) | Teaching clarity and simple CEI; tradeoff: DoS if a recipient rejects ETH (SWC-113, informational) |
| **Immutable** `feeBps` / `feeRecipient` | `Ownable` + setters | Less gas and less governance surface; fee "fixed at deploy" |
| Custom errors | `require` with strings | Smaller bytecode / cheaper reverts (module rule) |
| Fixed pragma `0.8.24` | `^0.8.x` | SWC-103; reproducible builds |

### Storage and API

| Decision | Why |
|----------|-----|
| `Listing { seller, price }` (2 slots) | `nft`/`tokenId` are already in the mapping key; duplicating them meant 4 slots and dead gas |
| Nested mapping `_listings[nft][tokenId]` | O(1) lookup; no on-chain arrays (avoids SWC-128) |
| No `updateListing` in the current core | Fewer paths; changing the price = cancel + re-list (explicit) |

### Security

| Decision | Why |
|----------|-----|
| CEI in `cancel` / `buy` | Removes the listing before NFT / ETH callbacks |
| Custom **transient** `nonReentrant` (EIP-1153) | Meets `.cursorrules`; cheaper than a lock in permanent storage |
| `.call{value}` (not `transfer`/`send`) | Avoids the 2300 gas limit; explicit success check |
| Royalty capped to `remaining` | Avoids underflow / negative seller proceeds |
| Auth via `msg.sender` (never `tx.origin`) | SWC-115 N/A |

### ERC-2981 royalties

| Decision | Why |
|----------|-----|
| Query `supportsInterface` before `royaltyInfo` | Do not assume every ERC-721 is 2981 |
| `try/catch` | Non-ERC165 or reverting tokens do not break the market |
| Royalty on `price` (not on `remaining`) | Aligned with the standard's `royaltyInfo(salePrice)`; then capped to the post-fee net |

### Stack / tooling

| Decision | Why |
|----------|-----|
| Foundry + Cancun | Transient storage + fuzz 1000 |
| OpenZeppelin only as IERC* interfaces | Own marketplace; no inheriting an OZ marketplace |
| Separate Next.js demo | Contract testable without UI; the UI consumes the ABI |

---

## 3. Can gas be improved further?

Yes. The current state is **fine for the module's scope** (clarity + security first). Below: real improvements vs micro-optimizations, with their tradeoffs.

### Already applied (post Phase 8 baseline)

See the numbers in [`GAS-EN.md`](./GAS-EN.md): `listItem` ≈ **−28%**, `getListing` ≈ **−47%**, deploy ≈ **−6.8%**.

### High-impact improvements (intentionally not done)

| Idea | Expected saving | Tradeoff / risk |
|------|-----------------|-----------------|
| **`price` as `uint96`** (or `uint128`) + packing with `seller` into **1 slot** | ~1 fewer SSTORE/SLOAD/`delete` on list/buy/cancel (~5–20k depending on cold/warm path) | Max price ~7.9×10²⁸ wei (`uint96`); overflow must be validated on listing; changes ABI/tests |
| **Pull-payments** (internal balances + `withdraw`) | Fewer external `.call`s in `buyItem`; cheaper buy and resistant to recipient DoS | More complexity, more storage, claim UX; departs from the current push design |
| **Operator listing** (only `isApprovedForAll` + transfer on buy, no escrow) | Much cheaper `listItem` (no `safeTransferFrom`) | Loses custody; different cancel/list races; not the module's model |
| Cache "supports 2981" per collection | Avoids `supportsInterface` + possible `royaltyInfo` on every buy | Per-collection storage; stale if the NFT changes (rare); more surface |
| Pack the fee: `feeBps` as `uint16` immutable is already cheap | Marginal | Low ROI |

### Minor / micro improvements

| Idea | Note |
|------|------|
| Calldata instead of memory where applicable | Almost no arrays here; no impact |
| Custom errors already used | OK |
| Avoid `Listing memory` and read fields individually | Sometimes saves gas; sometimes hurts readability; measure with `--gas-report` |
| `unchecked` on `protocolFee` mul/div | Only if `price * feeBps` is proven not to overflow (e.g. capped feeBps and bounded price) |
| Assembly in `_pay` | Micro; worse auditability |
| Remove `try/catch` and assume ERC-165 | Saves gas on the happy path; **breaks** purchases of "dirty" NFTs |

### What **not** to touch without need

- Removing `nonReentrant` "because CEI is already there": the NFT callback (`onERC721Received`) and the seller's `receive` are real vectors; the `test/attack` suite proves it.
- Accumulating ETH in the contract "to save calls": introduces SWC-105 / a poorly designed withdraw.
- Loops over all listings: gas DoS (SWC-128).

### Recommended order for a "Phase 9 gas"

1. Measure again (`forge test --gas-report` + snapshot).
2. Try packing `seller + uint96 price` on a branch and compare `listItem` / `buyItem`.
3. Only if the product requires it: pull-payments (security/UX, not just gas).
4. Do not optimize `supportsInterface` until real collection profiles are available.

---

## 4. Quick code ↔ decision map

| Code piece | Role |
|------------|------|
| `mapping(...) _listings` | Sale state; key = item identity |
| `listItem` | Escrow in |
| `cancelListing` | Escrow out (seller) |
| `buyItem` | Escrow out (buyer) + ETH split |
| `_calculatePayments` | Fee → royalty cap → seller |
| `_supportsERC2981` | Safe royalty detection |
| `_pay` | The only exit door for ETH |
| `ReentrancyGuard` (transient) | Cheap lock on buy/cancel |
| `onERC721Received` | Enables escrow via `safeTransferFrom` |

---

## 5. Demo UI (how it shows up in the frontend)

The demo does **not** change the contract: it only organizes the UX.

| UI zone | On-chain actions |
|---------|------------------|
| For sale | `getListing` / events → `buyItem` or `cancelListing` |
| Create NFT | `DemoERC721.mint` |
| Put up for sale | `approve` + `listItem` (two txs) |

An empty catalog at the start is normal (there are no listings until something is published).  
Operational details: [`DEPLOY-EN.md`](./DEPLOY-EN.md) · help: `/ayuda`.

---

## 6. One-sentence summary

**CEI escrow + push fee/royalty + minimal storage (2 slots) + transient guard**: gas has already dropped measurably; the next serious step would be packing into 1 slot or changing the payment model (pull), both with explicit product/security tradeoffs.
