# Planning — Module 05: Gas-Optimized NFT Marketplace

**Status:** ✅ Closed (phases **0–8** + Next.js demo with light/dark theme).

## 1. Project goal

**Escrow**-based NFT marketplace with Foundry and Solidity `0.8.24`:

- **Fixed-price** sales (native ETH).
- **ERC-2981 royalties** when the NFT supports them.
- **Protocol fee** sent to a fee vault.
- Security: **CEI**, **transient ReentrancyGuard** (EIP-1153) and **custom errors**.
- Next.js demo UI (list / cancel / buy + light/dark theme).

---

## 2. Scope

### Included

| Area | Description |
|------|-------------|
| Listing | Escrow via `safeTransferFrom` after `approve` |
| Purchase | Atomic payment: fee + royalty + seller; NFT to the buyer |
| Cancellation | Only the listing's seller gets the NFT back |
| Royalties | `supportsInterface(IERC2981)` → `royaltyInfo`; otherwise net to the seller (minus fee) |
| Fees | `feeBps` / `feeRecipient` (immutables) |
| Security | CEI + transient guard on `buyItem` / `cancelListing`; `.call{value}` |
| Tests | Unit/e2e, royalty, SWC-107 attack, fuzz (`bound`) — **25 tests** |
| Gas | 2-slot listing + transient guard — see [GAS-EN.md](./GAS-EN.md) |
| Frontend | Next.js 15 demo — see [DEPLOY-EN.md](./DEPLOY-EN.md) |

### Not included

- Offers / bidding (auctions).
- ERC-20 payments.
- Batch listings.
- Off-chain indexing / subgraph.

---

## 3. Tech stack

| Component | Choice |
|-----------|--------|
| Compiler | `pragma solidity 0.8.24;` (exact) |
| EVM | Cancun (`foundry.toml`) — transient storage |
| Framework | Foundry (`forge` / fuzz ≥ 1000) |
| Standards | `IERC721`, `IERC2981`, `IERC165` |
| Libraries | OpenZeppelin Contracts v5.2, forge-std |
| ETH | `.call{value: amount}("")` — never `transfer`/`send` |
| UI | Next.js 15, ethers v6, Zod, Vitest · Node ≥ 20 |

---

## 4. Architecture

```
05-nft-marketplace/
├── doc/                              # This documentation
├── src/
│   ├── NFTMarketplace.sol            # Escrow + list/cancel/buy
│   ├── interfaces/INFTMarketplace.sol
│   ├── utils/ReentrancyGuard.sol     # EIP-1153 transient
│   └── mocks/DemoERC721.sol          # Demo NFT (deploy / UI)
├── test/
│   ├── NFTMarketplace.t.sol          # Unit + e2e
│   ├── unit/NFTMarketplace.royalty.t.sol
│   ├── attack/                       # MaliciousActor + ReentrancyAttack
│   ├── fuzz/NFTMarketplace.fuzz.t.sol
│   └── mocks/                        # MockERC721, MockERC721Royalty
├── script/Deploy.s.sol               # Anvil: DemoERC721 + marketplace
├── frontend/                         # Next.js App Router + theme
├── foundry.toml
└── remappings.txt
```

### Roles

| Actor | Responsibility |
|-------|----------------|
| **Seller** | Lists / cancels; receives the net payment |
| **Buyer** | `msg.value >= price`; receives the NFT |
| **Royalty receiver** | Royalty if the collection supports ERC-2981 |
| **Fee recipient** | Protocol fee |
| **Marketplace** | Holds the NFT, validates state, splits ETH, emits events |

---

## 5. Data model

```solidity
struct Listing {
    address seller;
    uint256 price; // wei — nft/tokenId live in the mapping key (2 slots)
}
```

- Mapping: `_listings[nftAddress][tokenId] → Listing`.
- Active: `seller != address(0)`.
- CEI: `delete` the listing **before** transfers / `.call`.

---

## 6. On-chain API

| Function | Visibility | Description |
|----------|------------|-------------|
| `constructor(feeBps, feeRecipient)` | — | Sets fee and vault |
| `listItem(nft, tokenId, price)` | external | Escrows the NFT + creates the listing |
| `cancelListing(nft, tokenId)` | external nonReentrant | Returns the NFT to the seller |
| `buyItem(nft, tokenId)` | external payable nonReentrant | Purchase + payment split |
| `getListing(nft, tokenId)` | view | Reads `{seller, price}` |

> `updateListing` was **not** implemented (left as optional, out of the closing scope).

### Custom errors

`ItemNotForSale` · `PriceNotMet` · `NotItemOwner` · `TransferFailed` · `ZeroPrice`

### Events

`ItemListed` · `ItemCanceled` · `ItemBought`

---

## 7. Payout logic (purchase)

1. `protocolFee = price * feeBps / 10_000`
2. If `supportsInterface(IERC2981)` → `royaltyInfo(tokenId, price)`
3. Cap: `royaltyAmount ≤ price - protocolFee`
4. `sellerProceeds = price - protocolFee - royaltyAmount`
5. Effects: `delete _listings[...]`
6. Interactions: NFT → buyer · fee · royalty · seller · refund of excess

---

## 8. Implementation phases (TDD)

| Phase | Deliverable | Status |
|-------|-------------|--------|
| **0** | Foundry scaffold + docs | ✅ |
| **1** | Failing tests: list / cancel / buy | ✅ |
| **2** | `listItem` + escrow | ✅ |
| **3** | `cancelListing` + ReentrancyGuard | ✅ |
| **4** | `buyItem` without royalty | ✅ |
| **5** | ERC-2981 path | ✅ |
| **6** | SWC-107 attack suite + `SWC-AUDIT-EN.md` | ✅ |
| **7** | Fuzz `price` / `feeBps` / royalty | ✅ |
| **8** | Gas + NatSpec + `GAS-EN.md` | ✅ |
| **UI** | Next.js demo + light/dark theme | ✅ |

---

## 9. Test plan (completed)

| Suite | Location | Coverage |
|-------|----------|----------|
| Unit / e2e | `test/NFTMarketplace.t.sol` | List→Cancel→Relist→Buy, reverts |
| Royalty | `test/unit/NFTMarketplace.royalty.t.sol` | Fee/royalty/seller + cap |
| Attack | `test/attack/ReentrancyAttack.t.sol` | Seller/buyer reentrancy |
| Fuzz | `test/fuzz/NFTMarketplace.fuzz.t.sol` | 1000 runs each |
| UI | `frontend` Vitest | Theme + env |

---

## 10. Acceptance criteria

- [x] Foundry scaffold (`0.8.24`, fuzz 1000)
- [x] TDD list/cancel/buy
- [x] Escrow `safeTransferFrom` + `ItemListed`
- [x] `cancelListing` CEI + `nonReentrant`
- [x] `buyItem` fee/seller + refund of excess
- [x] ERC-2981 + cap
- [x] SWC-107 attack suite
- [x] Fuzz with `bound()`
- [x] Gas opt + `.gas-snapshot` + NatSpec
- [x] Custom errors / `.call{value}` / fixed pragma
- [x] Demo frontend (Anvil deploy + theme)

---

## 11. Related documents

| Document | Content |
|----------|---------|
| [README.md](./README.md) | `doc/` index |
| [diagrama-flujo-EN.md](./diagrama-flujo-EN.md) | Business flows |
| [diagrama-clases-EN.md](./diagrama-clases-EN.md) | UML of contracts / tests / demo |
| [flujograma-EN.md](./flujograma-EN.md) | Operations + payouts + pipeline |
| [SWC-AUDIT-EN.md](./SWC-AUDIT-EN.md) | SWC-100–136 |
| [GAS-EN.md](./GAS-EN.md) | Gas report and tradeoffs |
| [DEPLOY-EN.md](./DEPLOY-EN.md) | Anvil + UI |

---

## 12. Risks and mitigations

| Risk | Mitigation |
|------|------------|
| Reentrancy on ETH payments | CEI + transient ReentrancyGuard |
| Royalty > remainder | Capped to `price - fee` |
| NFT without approval | `approve` + `safeTransferFrom` on list |
| Recipient rejects ETH | `TransferFailed()`; participants must be able to receive ETH |
| Deploy fee BPS | Trust in the constructor; fuzzing bounds the scenarios |
