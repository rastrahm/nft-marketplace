# Optimización de gas — NFTMarketplace

Regenerar:

```bash
export PATH="$HOME/.foundry/bin:$PATH"
forge test --match-contract 'NFTMarketplacePhase1Test|NFTMarketplaceRoyaltyTest' --gas-report
forge snapshot --match-contract 'NFTMarketplacePhase1Test|NFTMarketplaceRoyaltyTest|ReentrancyAttackTest'
```

**Fecha baseline pre-opt:** 2026-08-29 (antes Fase 8)  
**Fecha post-opt:** 2026-08-29 (Fase 8)  
**Snapshot:** `.gas-snapshot`

---

## Comparativa (unit + royalty)

| Métrica | Antes | Después | Δ |
|---------|-------|---------|---|
| Deployment Cost | 754 103 | 703 173 | **−50 930** (−6.8%) |
| Deployment Size | 3 372 B | 3 235 B | **−137 B** |
| `listItem` avg | 131 387 | 94 456 | **−36 931** (−28%) |
| `listItem` max | 152 687 | 108 370 | **−44 317** |
| `cancelListing` avg | 54 309 | 44 213 | **−10 096** (−19%) |
| `buyItem` avg | 99 277 | 94 775 | **−4 502** (−4.5%) |
| `buyItem` max | 150 015 | 147 324 | **−2 691** |
| `getListing` | 9 319 | 4 924 | **−4 395** (−47%) |

---

## Funciones principales (post Fase 8)

| Función | Min | Avg | Median | Max | # Calls | Notas |
|---------|-----|-----|--------|-----|---------|-------|
| `listItem` | 22 119 | 94 456 | 108 370 | 108 370 | 12 | Cold path ~108k (2 SSTORE + escrow) |
| `cancelListing` | 26 740 | 44 213 | 44 224 | 61 666 | 4 | `delete` refund + transfer |
| `buyItem` | 26 694 | 94 775 | 107 349 | 147 324 | 7 | Max con path royalty + 3 payouts |
| `getListing` | 4 924 | 4 924 | 4 924 | 4 924 | 4 | 2 cold SLOADs |

---

## Optimizaciones aplicadas

| Cambio | Ahorro esperado | Seguridad |
|--------|-----------------|-----------|
| `Listing { seller, price }` (2 slots vs 4) | ~2× SSTORE/SLOAD/`delete` en list/cancel/buy | Claves del mapping ya identifican nft/tokenId |
| `ReentrancyGuard` **transient** (EIP-1153) | Evita SSTORE permanente del lock en buy/cancel | Equivalente funcional; requiere Cancun (`foundry.toml`) |
| `unchecked` en `msg.value - price` y `remaining - royalty` | Menos overflow checks tras invariantes | Solo tras `msg.value >= price` y cap de royalty |
| `!= 0` vs `> 0` en montos de pago | Micro-ahorro | Equivalente para `uint256` |
| Constante `_BPS_DENOMINATOR` | Claridad / possible fold | Sin cambio semántico |

---

## Tradeoffs aceptados

| Decisión | Por qué |
|----------|---------|
| No empaquetar `price` en `uint96` | Evita nuevo error/`bound` y mantiene precios `uint256` del plan |
| `try/catch` en `supportsInterface` | Seguridad ante tokens no-ERC165 > gas del try |
| Varios `.call{value}` en buy | Claridad CEI + fallos explícitos; pull-payments fuera de alcance |
| Guard custom transient vs OZ | Cumple `.cursorrules` (“custom transient or state-based”) + Cancun |
| `feeBps` sin cap on-chain | Deploy responsible; `price - fee` checked previene underflow si fee > price |

---

## Seguridad vs gas

| Suite | Rol |
|-------|-----|
| `test/attack/ReentrancyAttack.t.sol` | SWC-107 post-transient guard |
| `test/fuzz/NFTMarketplace.fuzz.t.sol` | 1000 runs price/fee/royalty |
| `test/unit/NFTMarketplace.royalty.t.sol` | Split + cap ERC-2981 |

Suite completa Fase 8: **25 tests** verdes (unit + royalty + attack + fuzz).

Ver [`SWC-AUDIT.md`](./SWC-AUDIT.md).
