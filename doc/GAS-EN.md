# Gas optimization — NFTMarketplace

Regenerate:

```bash
export PATH="$HOME/.foundry/bin:$PATH"
forge test --match-contract 'NFTMarketplacePhase1Test|NFTMarketplaceRoyaltyTest' --gas-report
forge snapshot --match-contract 'NFTMarketplacePhase1Test|NFTMarketplaceRoyaltyTest|ReentrancyAttackTest'
```

**Pre-opt baseline date:** 2026-08-29 (before Phase 8)  
**Post-opt date:** 2026-08-29 (Phase 8)  
**Snapshot:** `.gas-snapshot`

---

## Comparison (unit + royalty)

| Metric | Before | After | Δ |
|--------|--------|-------|---|
| Deployment Cost | 754 103 | 703 173 | **−50 930** (−6.8%) |
| Deployment Size | 3 372 B | 3 235 B | **−137 B** |
| `listItem` avg | 131 387 | 94 456 | **−36 931** (−28%) |
| `listItem` max | 152 687 | 108 370 | **−44 317** |
| `cancelListing` avg | 54 309 | 44 213 | **−10 096** (−19%) |
| `buyItem` avg | 99 277 | 94 775 | **−4 502** (−4.5%) |
| `buyItem` max | 150 015 | 147 324 | **−2 691** |
| `getListing` | 9 319 | 4 924 | **−4 395** (−47%) |

---

## Main functions (post Phase 8)

| Function | Min | Avg | Median | Max | # Calls | Notes |
|----------|-----|-----|--------|-----|---------|-------|
| `listItem` | 22 119 | 94 456 | 108 370 | 108 370 | 12 | Cold path ~108k (2 SSTORE + escrow) |
| `cancelListing` | 26 740 | 44 213 | 44 224 | 61 666 | 4 | `delete` refund + transfer |
| `buyItem` | 26 694 | 94 775 | 107 349 | 147 324 | 7 | Max on royalty path + 3 payouts |
| `getListing` | 4 924 | 4 924 | 4 924 | 4 924 | 4 | 2 cold SLOADs |

---

## Applied optimizations

| Change | Expected saving | Security |
|--------|-----------------|----------|
| `Listing { seller, price }` (2 slots vs 4) | ~2× fewer SSTORE/SLOAD/`delete` on list/cancel/buy | Mapping keys already identify nft/tokenId |
| **Transient** `ReentrancyGuard` (EIP-1153) | Avoids the lock's permanent SSTORE on buy/cancel | Functionally equivalent; requires Cancun (`foundry.toml`) |
| `unchecked` on `msg.value - price` and `remaining - royalty` | Fewer overflow checks after invariants hold | Only after `msg.value >= price` and the royalty cap |
| `!= 0` vs `> 0` on payment amounts | Micro-saving | Equivalent for `uint256` |
| `_BPS_DENOMINATOR` constant | Clarity / possible fold | No semantic change |

---

## Accepted tradeoffs

| Decision | Why |
|----------|-----|
| Not packing `price` into `uint96` | Avoids a new error/`bound` and keeps the plan's `uint256` prices |
| `try/catch` on `supportsInterface` | Safety against non-ERC165 tokens > cost of the try |
| Several `.call{value}` in buy | CEI clarity + explicit failures; pull-payments out of scope |
| Custom transient guard vs OZ | Meets `.cursorrules` ("custom transient or state-based") + Cancun |
| `feeBps` without an on-chain cap | Responsible deploy; checked `price - fee` prevents underflow if fee > price |

---

## Security vs gas

| Suite | Role |
|-------|------|
| `test/attack/ReentrancyAttack.t.sol` | SWC-107 after the transient guard |
| `test/fuzz/NFTMarketplace.fuzz.t.sol` | 1000 runs price/fee/royalty |
| `test/unit/NFTMarketplace.royalty.t.sol` | ERC-2981 split + cap |

Full suite: **25** green Foundry tests (unit + royalty + attack + fuzz) + frontend Vitest.  
Demo UI: [`DEPLOY-EN.md`](./DEPLOY-EN.md).

See [`SWC-AUDIT-EN.md`](./SWC-AUDIT-EN.md) · index [`README.md`](./README.md).
