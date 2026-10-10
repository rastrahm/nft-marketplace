# SWC audit — NFTMarketplace

Verification of `NFTMarketplace` against the [SWC Registry](https://swcregistry.io/) (EIP-1470) and the monorepo principles (CEI, custom ReentrancyGuard, custom errors, ERC-2981, secure escrow). Format aligned with [`04-erc721/doc/SWC-AUDIT-EN.md`](../../04-erc721/doc/SWC-AUDIT-EN.md).

> **Note:** The SWC Registry has not been actively maintained since ~2020. Complement it with [SCSVS](https://github.com/ComposableSecurity/SCSVS) and [EEA EthTrust](https://entethalliance.org/specs/ethtrust/).

**Audited contract:** `src/NFTMarketplace.sol` (+ `src/interfaces/INFTMarketplace.sol`, `src/utils/ReentrancyGuard.sol` transient EIP-1153)  
**Date:** 2026-08-30 (docs updated after the demo UI)  
**Test references:** `test/NFTMarketplace.t.sol`, `test/unit/`, `test/attack/`, `test/fuzz/`  
**Phase:** 8 + demo frontend ✅  
**Gas:** [`GAS-EN.md`](./GAS-EN.md) · **UI deploy:** [`DEPLOY-EN.md`](./DEPLOY-EN.md)

---

## Executive summary

| Status | Count |
|--------|-------|
| ✅ Mitigated / Not applicable | 32 |
| ⚠️ Informational (design / trust / recipient DoS) | 4 |
| ❌ Vulnerable | 0 |

**Conclusion:** No exploitable SWC vulnerabilities within the marketplace scope (list / cancel / buy + escrow + fee + ERC-2981). Informational risks: DoS if seller/royalty/fee reject ETH, ERC-721 `approve` race before listing, trust in the deployed `feeBps`/`feeRecipient`, and voluntary ERC-2981 royalty (capped on-chain).

**Suite principles verified:**

| Principle | Status |
|-----------|--------|
| CEI before transfers / `.call{value}` | ✅ `cancelListing` / `buyItem` |
| **Transient** `ReentrancyGuard` (EIP-1153) | ✅ + `test/attack/ReentrancyAttack.t.sol` |
| Custom errors (no `require` strings) | ✅ |
| Fixed pragma `0.8.24` | ✅ |
| ETH only via `.call` + success check | ✅ `_pay` → `TransferFailed` |
| Escrow `safeTransferFrom` + `onERC721Received` | ✅ |
| ERC-2981 via `supportsInterface` + cap | ✅ |

---

## Full matrix SWC-100 — SWC-136

| ID | Title | Applies | Status | Evidence in `NFTMarketplace` |
|----|-------|---------|--------|------------------------------|
| SWC-100 | Function Default Visibility | Yes | ✅ | Explicit visibility on every function |
| SWC-101 | Integer Overflow and Underflow | Yes | ✅ | Solidity `0.8.24`; royalty capped to `remaining`; fee `price * feeBps / 10_000` |
| SWC-102 | Outdated Compiler Version | Yes | ✅ | `pragma solidity 0.8.24` + `foundry.toml` |
| SWC-103 | Floating Pragma | Yes | ✅ | Exact pragma (no `^`) |
| SWC-104 | Unchecked Call Return Value | Yes | ✅ | `_pay` checks success; OZ `safeTransferFrom` checks the receiver |
| SWC-105 | Unprotected Ether Withdrawal | Yes | ✅ | No admin withdraw; ETH is only split in `buyItem` according to the listing |
| SWC-106 | Unprotected SELFDESTRUCT | No | N/A | No `selfdestruct` |
| SWC-107 | Reentrancy | Yes | ✅ | CEI + `nonReentrant` on `buyItem`/`cancelListing`; attack suite |
| SWC-108 | State Variable Default Visibility | Yes | ✅ | `_listings` private; explicit public immutables |
| SWC-109 | Uninitialized Storage Pointer | No | N/A | No legacy storage pointers |
| SWC-110 | Assert Violation | No | N/A | No production `assert` |
| SWC-111 | Deprecated Solidity Functions | Yes | ✅ | No `suicide` / `throw` / `tx.origin` / `transfer`/`send` |
| SWC-112 | Delegatecall to Untrusted Callee | No | N/A | No `delegatecall` |
| SWC-113 | DoS with Failed Call | Yes | ⚠️ | Recipient rejecting ETH → `TransferFailed` (tx reverts; listing intact) |
| SWC-114 | Transaction Order Dependence | Yes | ⚠️ | ERC-721 `approve` race before `listItem` (standard) |
| SWC-115 | Authorization through tx.origin | No | N/A | Auth via `msg.sender` (owner/seller); no `tx.origin` |
| SWC-116 | Block values as a proxy for time | No | N/A | No on-chain time logic |
| SWC-117 | Signature Malleability | No | N/A | No signatures / `ecrecover` / permit |
| SWC-118 | Incorrect Constructor Name | No | N/A | 0.8+ `constructor` |
| SWC-119 | Shadowing State Variables | Yes | ✅ | No shadowing with `ReentrancyGuard` / interface |
| SWC-120 | Weak Sources of Randomness | No | N/A | No RNG |
| SWC-121 | Missing Protection against Signature Replay | No | N/A | No signatures |
| SWC-122 | Lack of Proper Signature Verification | No | N/A | No signature verification |
| SWC-123 | Requirement Violation | Yes | ✅ | Custom errors + unit + royalty + attack |
| SWC-124 | Write to Arbitrary Storage Location | No | N/A | No storage assembly |
| SWC-125 | Incorrect Inheritance Order | Yes | ✅ | `INFTMarketplace, IERC721Receiver, ReentrancyGuard` |
| SWC-126 | Insufficient Gas Griefing | No | N/A | No relayers with a fixed stipend |
| SWC-127 | Arbitrary Jump with Function Type Variable | No | N/A | No dynamic function types |
| SWC-128 | DoS With Block Gas Limit | Yes | ✅ | O(1) paths; no loops over listings |
| SWC-129 | Typographical Error | Yes | ✅ | Review + `forge build` / tests |
| SWC-130 | Right-To-Left-Override | No | N/A | ASCII |
| SWC-131 | Presence of unused variables | Yes | ✅ | No material dead code |
| SWC-132 | Unexpected Ether balance | Yes | ✅ | Marketplace does not accumulate sale ETH; excess refund in `buyItem` |
| SWC-133 | Hash Collisions (var-length args) | No | N/A | No custom multi-dynamic hashing |
| SWC-134 | Message call with hardcoded gas | No | N/A | `.call{value}` without `{gas: …}` |
| SWC-135 | Code With No Effects | No | N/A | No relevant no-ops |
| SWC-136 | Unencrypted Private Data On-Chain | Partial | ✅ | Listings/prices are public by marketplace design |

---

## Informational risks

### SWC-107 — Reentrancy (mitigated; evidenced in Phase 6)

Covered vectors:

| Vector | Callback | Reentered function | Expected result |
|--------|----------|--------------------|-----------------|
| Seller collects the sale | `receive` | `buyItem` / `cancelListing` | `TransferFailed` (guard → call false) |
| Buyer receives the NFT | `onERC721Received` | `buyItem` | `ReentrancyGuardReentrantCall` |
| Seller cancels | `onERC721Received` | `cancelListing` | `ReentrancyGuardReentrantCall` |

**Mitigation:** `delete` the listing before interactions + `nonReentrant`.

### SWC-113 — DoS by a recipient rejecting ETH

If `seller`, `feeRecipient` or `royaltyReceiver` cannot receive ETH, `buyItem` reverts with `TransferFailed` and the listing remains (consistent state).

**v1 treatment:** By design; document that participants must be able to receive native ETH. Pull-payments would be out of scope.

### SWC-114 — `approve` front-running (ERC-721)

Between `approve(marketplace)` and `listItem`, a previous spender could move the token.

**Product mitigation:** prefer `setApprovalForAll` scoped to the marketplace; atomic list right after approve; the UI warns users to revoke old approvals.

### Deploy trust — `feeBps` / `feeRecipient`

Fee and vault are set in the constructor (immutables). A high fee reduces the seller's net; a wrong `feeRecipient` diverts the protocol fee.

**v1 treatment:** Document the deploy parameters; fee validation/`Ownable` is out of this module's scope.

### Voluntary ERC-2981 + cap

Royalties only if `supportsInterface(IERC2981)`; amount capped to `price - protocolFee` to avoid underflow.

---

## Monorepo principles checklist

| Principle | Met? | Notes |
|-----------|------|-------|
| Custom errors | ✅ | `ItemNotForSale`, `PriceNotMet`, `NotItemOwner`, `TransferFailed`, `ZeroPrice` |
| CEI | ✅ | `buyItem` / `cancelListing` |
| ReentrancyGuard | ✅ | Custom **transient** (Cancun); attack suite |
| Safe ERC-721 escrow | ✅ | `safeTransferFrom` + receiver on the marketplace |
| ETH `.call` checked | ✅ | `_pay` |
| NatSpec on public/external | ✅ | |
| Fuzz ≥ 1000 runs | ✅ | `test/fuzz/NFTMarketplace.fuzz.t.sol` |
| Invariants | — | Optional / outside the minimal phases 0–8 |

---

## SWC → tests mapping

| SWC | Test(s) |
|-----|---------|
| SWC-101 | Royalty cap `test_buyItem_capsRoyaltyToRemainingAfterFee`; `test/fuzz/NFTMarketplace.fuzz.t.sol` |
| SWC-103 | Fixed compiler (build) |
| SWC-104 | `_pay` + `test_Attack_*` (call false → `TransferFailed`) |
| SWC-107 | `test_Attack_SellerReenter*`, `test_Attack_BuyerReenter*`, `test_Attack_SellerReenterCancelOnERC721Received*` |
| SWC-113 | Documentary; same `TransferFailed` path as the payout attacks |
| SWC-114 | Documentary (approve race) |
| SWC-123 | unit + royalty + e2e + attack |
| SWC-132 | buy with excess refund (impl); unit with `value == price` |

---

## Attack campaigns (Phase 6)

| ID | Name | File |
|----|------|------|
| A1 | Seller reenter buy on payout | `test/attack/ReentrancyAttack.t.sol` |
| A2 | Seller reenter cancel on payout | same |
| A3 | Buyer reenter buy on ERC721Received | same |
| A4 | Seller reenter cancel on ERC721Received | same |
| A5 | Negative control (attack off) | same |

Actor: `test/attack/MaliciousActor.sol`.

---

## References

- [SWC Registry](https://swcregistry.io/)
- [EIP-1470](https://eips.ethereum.org/EIPS/eip-1470)
- [EIP-721](https://eips.ethereum.org/EIPS/eip-721)
- [EIP-2981](https://eips.ethereum.org/EIPS/eip-2981)
- Monorepo template: [`04-erc721/doc/SWC-AUDIT-EN.md`](../../04-erc721/doc/SWC-AUDIT-EN.md)
- Campaigns: see the "Attack campaigns" section above
- Gas: [`GAS-EN.md`](./GAS-EN.md)
- Deploy / UI: [`DEPLOY-EN.md`](./DEPLOY-EN.md)
- Plan: [`PLANIFICACION-EN.md`](./PLANIFICACION-EN.md)
- Index: [`README.md`](./README.md)
