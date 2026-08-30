# Planificación — Module 05: Gas-Optimized NFT Marketplace

**Estado:** ✅ Cerrado (fases **0–8** + demo Next.js con tema claro/oscuro).

## 1. Objetivo del proyecto

Marketplace NFT basado en **escrow** con Foundry y Solidity `0.8.24`:

- Ventas a **precio fijo** (ETH nativo).
- **Royalties ERC-2981** cuando el NFT las soporte.
- **Fee de protocolo** hacia un fee vault.
- Seguridad: **CEI**, **ReentrancyGuard transient** (EIP-1153) y **custom errors**.
- Demo UI Next.js (list / cancel / buy + tema claro/oscuro).

---

## 2. Alcance

### Incluye

| Área | Descripción |
|------|-------------|
| Listado | Escrow vía `safeTransferFrom` tras `approve` |
| Compra | Pago atómico: fee + royalty + seller; NFT al buyer |
| Cancelación | Solo el seller del listing recupera el NFT |
| Royalties | `supportsInterface(IERC2981)` → `royaltyInfo`; si no, neto al seller (menos fee) |
| Fees | `feeBps` / `feeRecipient` (immutables) |
| Seguridad | CEI + guard transient en `buyItem` / `cancelListing`; `.call{value}` |
| Tests | Unit/e2e, royalty, attack SWC-107, fuzz (`bound`) — **25 tests** |
| Gas | Listing 2 slots + guard transient — ver [GAS.md](./GAS.md) |
| Frontend | Next.js 15 demo — ver [DEPLOY.md](./DEPLOY.md) |

### No incluye

- Ofertas / bidding (auctions).
- Pagos en ERC-20.
- Batch listings.
- Indexación off-chain / subgraph.

---

## 3. Stack técnico

| Componente | Elección |
|------------|----------|
| Compilador | `pragma solidity 0.8.24;` (exacto) |
| EVM | Cancun (`foundry.toml`) — transient storage |
| Framework | Foundry (`forge` / fuzz ≥ 1000) |
| Estándares | `IERC721`, `IERC2981`, `IERC165` |
| Librerías | OpenZeppelin Contracts v5.2, forge-std |
| ETH | `.call{value: amount}("")` — nunca `transfer`/`send` |
| UI | Next.js 15, ethers v6, Zod, Vitest · Node ≥ 20 |

---

## 4. Arquitectura

```
05-nft-marketplace/
├── doc/                              # Esta documentación
├── src/
│   ├── NFTMarketplace.sol            # Escrow + list/cancel/buy
│   ├── interfaces/INFTMarketplace.sol
│   ├── utils/ReentrancyGuard.sol     # EIP-1153 transient
│   └── mocks/DemoERC721.sol          # NFT demo (deploy / UI)
├── test/
│   ├── NFTMarketplace.t.sol          # Unit + e2e
│   ├── unit/NFTMarketplace.royalty.t.sol
│   ├── attack/                       # MaliciousActor + ReentrancyAttack
│   ├── fuzz/NFTMarketplace.fuzz.t.sol
│   └── mocks/                        # MockERC721, MockERC721Royalty
├── script/Deploy.s.sol               # Anvil: DemoERC721 + marketplace
├── frontend/                         # Next.js App Router + tema
├── foundry.toml
└── remappings.txt
```

### Roles

| Actor | Responsabilidad |
|-------|-----------------|
| **Seller** | Lista / cancela; recibe pago neto |
| **Buyer** | `msg.value >= price`; recibe el NFT |
| **Royalty receiver** | Royalty si la colección soporta ERC-2981 |
| **Fee recipient** | Fee de protocolo |
| **Marketplace** | Custodia NFT, valida estado, reparte ETH, emite eventos |

---

## 5. Modelo de datos

```solidity
struct Listing {
    address seller;
    uint256 price; // wei — nft/tokenId viven en la clave del mapping (2 slots)
}
```

- Mapping: `_listings[nftAddress][tokenId] → Listing`.
- Activo: `seller != address(0)`.
- CEI: `delete` listing **antes** de transfers / `.call`.

---

## 6. API on-chain

| Función | Visibilidad | Descripción |
|---------|-------------|-------------|
| `constructor(feeBps, feeRecipient)` | — | Configura fee y vault |
| `listItem(nft, tokenId, price)` | external | Escrow NFT + crea listing |
| `cancelListing(nft, tokenId)` | external nonReentrant | Devuelve NFT al seller |
| `buyItem(nft, tokenId)` | external payable nonReentrant | Compra + split de pagos |
| `getListing(nft, tokenId)` | view | Lee `{seller, price}` |

> `updateListing` **no** se implementó (quedó opcional fuera del cierre).

### Errores custom

`ItemNotForSale` · `PriceNotMet` · `NotItemOwner` · `TransferFailed` · `ZeroPrice`

### Eventos

`ItemListed` · `ItemCanceled` · `ItemBought`

---

## 7. Lógica de payout (compra)

1. `protocolFee = price * feeBps / 10_000`
2. Si `supportsInterface(IERC2981)` → `royaltyInfo(tokenId, price)`
3. Cap: `royaltyAmount ≤ price - protocolFee`
4. `sellerProceeds = price - protocolFee - royaltyAmount`
5. Effects: `delete _listings[...]`
6. Interactions: NFT → buyer · fee · royalty · seller · refund exceso

---

## 8. Fases de implementación (TDD)

| Fase | Entregable | Estado |
|------|------------|--------|
| **0** | Scaffold Foundry + docs | ✅ |
| **1** | Tests falling: list / cancel / buy | ✅ |
| **2** | `listItem` + escrow | ✅ |
| **3** | `cancelListing` + ReentrancyGuard | ✅ |
| **4** | `buyItem` sin royalty | ✅ |
| **5** | ERC-2981 path | ✅ |
| **6** | Attack suite SWC-107 + `SWC-AUDIT.md` | ✅ |
| **7** | Fuzz `price` / `feeBps` / royalty | ✅ |
| **8** | Gas + NatSpec + `GAS.md` | ✅ |
| **UI** | Demo Next.js + tema claro/oscuro | ✅ |

---

## 9. Plan de pruebas (cumplido)

| Suite | Ubicación | Cobertura |
|-------|-----------|-----------|
| Unit / e2e | `test/NFTMarketplace.t.sol` | List→Cancel→Relist→Buy, reverts |
| Royalty | `test/unit/NFTMarketplace.royalty.t.sol` | Fee/royalty/seller + cap |
| Attack | `test/attack/ReentrancyAttack.t.sol` | Seller/buyer reentrancy |
| Fuzz | `test/fuzz/NFTMarketplace.fuzz.t.sol` | 1000 runs c/u |
| UI | `frontend` Vitest | Theme + env |

---

## 10. Criterios de aceptación

- [x] Scaffold Foundry (`0.8.24`, fuzz 1000)
- [x] TDD list/cancel/buy
- [x] Escrow `safeTransferFrom` + `ItemListed`
- [x] `cancelListing` CEI + `nonReentrant`
- [x] `buyItem` fee/seller + refund exceso
- [x] ERC-2981 + cap
- [x] Attack suite SWC-107
- [x] Fuzz con `bound()`
- [x] Gas opt + `.gas-snapshot` + NatSpec
- [x] Custom errors / `.call{value}` / pragma fijo
- [x] Demo frontend (deploy Anvil + tema)

---

## 11. Documentos relacionados

| Documento | Contenido |
|-----------|-----------|
| [README.md](./README.md) | Índice de `doc/` |
| [diagrama-flujo.md](./diagrama-flujo.md) | Flujos de negocio |
| [diagrama-clases.md](./diagrama-clases.md) | UML contratos / tests / demo |
| [flujograma.md](./flujograma.md) | Operativo + payouts + pipeline |
| [SWC-AUDIT.md](./SWC-AUDIT.md) | SWC-100–136 |
| [GAS.md](./GAS.md) | Gas report y tradeoffs |
| [DEPLOY.md](./DEPLOY.md) | Anvil + UI |

---

## 12. Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Reentrancy en pagos ETH | CEI + ReentrancyGuard transient |
| Royalty > remanente | Cap a `price - fee` |
| NFT sin approval | `approve` + `safeTransferFrom` en list |
| Receptor rechaza ETH | `TransferFailed()`; participantes deben poder recibir ETH |
| Fee BPS de deploy | Trust en constructor; fuzz acota escenarios |
