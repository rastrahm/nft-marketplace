# Planificación — Module 05: Gas-Optimized NFT Marketplace

## 1. Objetivo del proyecto

Construir un marketplace NFT basado en **escrow** con Foundry y Solidity `0.8.24`, que soporte:

- Ventas a **precio fijo** (ETH nativo).
- Aplicación de **royalties ERC-2981** cuando el NFT las soporte.
- **Fee de protocolo** hacia un fee vault.
- Manejo seguro de estado: **CEI**, **ReentrancyGuard** y **custom errors**.

---

## 2. Alcance

### Incluye

| Área | Descripción |
|------|-------------|
| Listado | El seller deposita el NFT en el marketplace (`safeTransferFrom`) o aprueba al operador |
| Compra | Pago atómico: fee + royalty + seller; transferencia del NFT al buyer |
| Cancelación | Solo el owner del listing puede recuperar el NFT |
| Royalties | Query `IERC165` → `IERC2981.royaltyInfo`; si no aplica, 100 % neto al seller |
| Fees | Fee en basis points hacia `feeRecipient` |
| Seguridad | CEI, ReentrancyGuard en `buyItem` / `cancelListing`, `.call{value}` |
| Tests | Unitarios e2e, reentrancy malicioso, fuzz de precios y fee BPS |

### No incluye (fuera de alcance de este módulo)

- Ofertas / bidding (auctions).
- Pagos en ERC-20.
- Batch listings.
- Frontend / indexación off-chain.

---

## 3. Stack técnico

| Componente | Elección |
|------------|----------|
| Compilador | `pragma solidity 0.8.24;` (exacto) |
| Framework | Foundry (`forge`, `forge test`, gas reports) |
| Estándares | `IERC721`, `IERC2981`, `IERC165` |
| Librerías | OpenZeppelin Contracts v5.x (interfaces / mocks de test) |
| ETH | `.call{value: amount}("")` — nunca `transfer`/`send` |

---

## 4. Arquitectura propuesta

```
05-nft-marketplace/
├── doc/                          # Planificación y diagramas
├── src/
│   ├── NFTMarketplace.sol        # Contrato principal (escrow + ventas)
│   └── interfaces/               # (opcional) wrappers locales
├── test/
│   ├── NFTMarketplace.t.sol      # Unit + e2e + royalties + fees
│   ├── NFTMarketplace.fuzz.t.sol # Fuzz precios / fee BPS
│   └── mocks/
│       ├── MockERC721Royalty.sol # NFT con ERC-2981
│       ├── MockERC721.sol        # NFT sin royalties
│       └── MaliciousActor.sol    # Reentrancy vía fallback/receive
├── script/                       # Deploy (opcional)
├── foundry.toml
└── remappings.txt
```

### Roles

| Actor | Responsabilidad |
|-------|-----------------|
| **Seller** | Lista / cancela; recibe pago neto |
| **Buyer** | Envía `msg.value >= price`; recibe el NFT |
| **Royalty receiver** | Recibe royalty si el collection soporta ERC-2981 |
| **Fee recipient** | Recibe el fee de protocolo |
| **Marketplace** | Custodia NFT, valida estado, reparte ETH, emite eventos |

---

## 5. Modelo de datos

```solidity
struct Listing {
    address seller;
    address nftAddress;
    uint256 tokenId;
    uint256 price; // wei
}
```

- Clave de mapping: `listings[nftAddress][tokenId] → Listing`.
- Listing activo: `seller != address(0)` (o `price > 0` según diseño).
- Al comprar/cancelar: **borrar storage antes** de transferencias externas (CEI).

---

## 6. Funciones públicas previstas

| Función | Visibilidad | Descripción |
|---------|-------------|-------------|
| `constructor(feeBps, feeRecipient)` | — | Configura fee y vault |
| `listItem(nft, tokenId, price)` | external | Escrow NFT + crea listing |
| `cancelListing(nft, tokenId)` | external nonReentrant | Devuelve NFT al seller |
| `buyItem(nft, tokenId)` | external payable nonReentrant | Compra + split de pagos |
| `updateListing(nft, tokenId, newPrice)` | external | (opcional) actualiza precio |
| `getListing(nft, tokenId)` | view | Lectura del listing |

### Errores custom

- `ItemNotForSale()`
- `PriceNotMet()`
- `NotItemOwner()`
- `TransferFailed()`
- `ZeroPrice()`

---

## 7. Lógica de payout (compra)

Orden de cálculo (sobre `price`):

1. `protocolFee = price * feeBps / 10_000`
2. Si `supportsInterface(IERC2981)` → `(receiver, royaltyAmount) = royaltyInfo(tokenId, price)`
3. Cap de seguridad: royalty no debe superar el remanente tras el fee (o política documentada).
4. `sellerProceeds = price - protocolFee - royaltyAmount`
5. Efectos: `delete listings[...]`
6. Interacciones:
   - Transferir NFT al buyer
   - `.call` fee → `feeRecipient`
   - `.call` royalty → `receiver` (si > 0)
   - `.call` neto → `seller`
7. Refund de exceso de `msg.value` si aplica (opcional documentado)

---

## 8. Fases de implementación (TDD)

| Fase | Entregable | Criterio de done |
|------|------------|------------------|
| **0** | Scaffold Foundry + docs | `forge init` / `foundry.toml` con fuzz ≥ 1000 |
| **1** | Tests falling: list / cancel / buy | Tests rojos definidos |
| **2** | `listItem` + escrow | NFT en marketplace; evento `ItemListed` |
| **3** | `cancelListing` + guard | Solo seller; NFT vuelve; reentrancy protected |
| **4** | `buyItem` sin royalty | Fee + seller; CEI; NFT al buyer |
| **5** | ERC-2981 path | Split fee / royalty / seller verificado en balances |
| **6** | Seguridad | `MaliciousActor` no reentra con éxito |
| **7** | Fuzz | `bound(price)`, `bound(feeBps)` sin overflow / zero-price |
| **8** | Gas / cleanup | `forge snapshot`; NatSpec completo |

---

## 9. Plan de pruebas

### Unitarios / e2e

1. List → Cancel → Re-list → Buy.
2. Compra con NFT ERC-2981: balances de fee, royalty y seller.
3. Compra sin ERC-2981: 100 % neto (menos fee) al seller.
4. Reverts: `ZeroPrice`, `ItemNotForSale`, `PriceNotMet`, `NotItemOwner`.

### Seguridad

- Buyer/seller malicioso con `receive`/`fallback` que reentra `buyItem` o `cancelListing` → debe revertir por ReentrancyGuard.

### Fuzz

- `price ∈ [1, type(uint128).max]` (o rango acotado).
- `feeBps ∈ [0, 1000]` (ej. máx 10 %).
- Asegurar que suma de payouts ≤ `price` y sin underflow.

---

## 10. Criterios de aceptación

- [ ] `pragma solidity 0.8.24;` en todos los contratos.
- [ ] Escrow o approval validado antes de compra atómica.
- [ ] CEI en `buyItem` y `cancelListing`.
- [ ] ReentrancyGuard en esas dos funciones.
- [ ] Detección ERC-2981 vía `supportsInterface`.
- [ ] Pagos solo con `.call{value}("")`.
- [ ] Custom errors (sin strings en `require`).
- [ ] Tests e2e, reentrancy y fuzz pasando con `forge test`.

---

## 11. Diagramas relacionados

| Documento | Contenido |
|-----------|-----------|
| [diagrama-flujo.md](./diagrama-flujo.md) | Flujo de procesos de negocio (list / buy / cancel / royalties) |
| [diagrama-clases.md](./diagrama-clases.md) | Estructura de contratos, structs e interfaces |
| [flujograma.md](./flujograma.md) | Flujograma detallado de decisión y payouts |

---

## 12. Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Reentrancy en pagos ETH | CEI + ReentrancyGuard |
| Royalty > precio | Cap / validación antes de restar |
| NFT sin approval / no escrow | `safeTransferFrom` en list o check `getApproved` / `isApprovedForAll` |
| Fee BPS inválido | Bound en constructor / fuzz |
| Contratos que rechazan ETH | `TransferFailed()`; documentar que sellers/royalty deben poder recibir ETH |
