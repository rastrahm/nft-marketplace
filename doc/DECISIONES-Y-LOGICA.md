# Decisiones técnicas, lógica y gas — NFTMarketplace

Documento orientado a **entender el diseño** del módulo 05: qué se eligió, por qué, cómo fluye el protocolo y qué aún se podría optimizar en gas.

Contrato principal: `src/NFTMarketplace.sol`  
Complementos: [`GAS.md`](./GAS.md) · [`SWC-AUDIT.md`](./SWC-AUDIT.md) · [`flujograma.md`](./flujograma.md)

---

## 1. Lógica que sigue el protocolo

### Modelo mental

El marketplace es un **escrow de precio fijo**:

1. El seller deposita el NFT en el contrato (`listItem`).
2. Mientras el listing exista, el contrato es el owner del NFT.
3. El buyer paga ETH (`buyItem`); el contrato reparte fee / royalty / seller y entrega el NFT.
4. El seller puede retirar el NFT sin venta (`cancelListing`).

No hay ofertas, subastas ni pagos diferidos (pull-payments): todo el ETH se empuja en la misma transacción de compra.

### Flujo `listItem`

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

- El NFT entra al escrow **después** de escribir el listing (el orden effects→interaction evita listar sin custodia si el transfer revierte).
- `onERC721Received` en el marketplace permite `safeTransferFrom`.

### Flujo `cancelListing`

```
Checks
  listing existe (seller != address(0))
  msg.sender == seller
Effects  (CEI)
  delete _listings[nft][tokenId]
Interactions
  safeTransferFrom(marketplace → seller)
```

Protegido con `nonReentrant` (callback `onERC721Received` del seller podría intentar reentrar).

### Flujo `buyItem`

```
Checks
  listing existe
  msg.value >= price
Effects  (CEI)
  delete listing
  calcular: protocolFee, royalty, sellerProceeds
Interactions
  1. safeTransferFrom(marketplace → buyer)   // NFT primero
  2. _pay(feeRecipient, protocolFee)        // si > 0
  3. _pay(royaltyReceiver, royaltyAmount)   // si > 0
  4. _pay(seller, sellerProceeds)
  5. _pay(buyer, msg.value - price)         // refund exceso
```

Orden deliberado:

| Paso | Motivo |
|------|--------|
| `delete` antes de todo | Si algo externo falla después, no queda listing fantasma reutilizable |
| NFT al buyer antes de ETH | El buyer ya es owner si un pago posterior falla… **pero** si un `_pay` falla, toda la tx revierte (incluido el transfer NFT). Estado consistente. |
| Fee → royalty → seller | Fee y royalty son “obligaciones” del split; el seller recibe el resto |
| Refund al final | Solo el exceso sobre `price`; el split se calcula sobre `price`, no sobre `msg.value` |

### Split de pagos (`_calculatePayments`)

```
protocolFee = price * feeBps / 10_000
remaining   = price - protocolFee          // checked (fee no puede superar price)

si NFT soporta ERC-2981:
  (receiver, amount) = royaltyInfo(tokenId, price)
  amount = min(amount, remaining)          // cap on-chain
  si receiver == 0 o amount == 0 → sin royalty

sellerProceeds = remaining - royaltyAmount // unchecked (ya capeado)
```

- Royalties son **voluntarias** (solo si `supportsInterface(IERC2981)`).
- `try/catch` en `supportsInterface`: un NFT sin ERC-165 no tumba la compra; se trata como “sin royalty”.

### Invariantes de seguridad

| Invariante | Cómo se garantiza |
|------------|-------------------|
| Un token listado = un listing | Mapping único `(nft, tokenId)` |
| No reentrada en buy/cancel | CEI + `ReentrancyGuard` transient |
| ETH solo sale por rutas conocidas | Sin `withdraw` admin; solo `_pay` en `buyItem` |
| Fallo de pago no deja estado a medias | `.call` + revert `TransferFailed` → rollback completo |
| Seller no puede ser engañado con price 0 | `ZeroPrice` |

---

## 2. Decisiones técnicas (y por qué)

### Arquitectura

| Decisión | Alternativa descartada | Por qué |
|----------|------------------------|---------|
| **Escrow** (NFT en el contrato) | Solo `approve` + `transferFrom` atómico en buy | Escrow simplifica cancelación y evita race “approve sin list”; el módulo pide custodia explícita |
| Precio fijo en ETH nativo | ERC-20 / WETH | Alcance del módulo; menos superficie (sin allowances del buyer) |
| Fee + royalty en la misma tx | Pull-payments (claim) | Claridad pedagógica y CEI simple; tradeoff: DoS si un receptor rechaza ETH (SWC-113 informativo) |
| `feeBps` / `feeRecipient` **immutables** | `Ownable` + setters | Menos gas y menos superficie de gobernanza; fee “fijo al deploy” |
| Custom errors | `require` con strings | Menos bytecode / reverts más baratos (regla del módulo) |
| Pragma fijo `0.8.24` | `^0.8.x` | SWC-103; builds reproducibles |

### Storage y API

| Decisión | Por qué |
|----------|---------|
| `Listing { seller, price }` (2 slots) | `nft`/`tokenId` ya están en la clave del mapping; duplicarlos era 4 slots y gas muerto |
| Mapping anidado `_listings[nft][tokenId]` | Lookup O(1); sin arrays on-chain (evita SWC-128) |
| Sin `updateListing` en el core actual | Menos paths; cambiar precio = cancel + re-list (explícito) |

### Seguridad

| Decisión | Por qué |
|----------|---------|
| CEI en `cancel` / `buy` | Elimina listing antes de callbacks NFT / ETH |
| `nonReentrant` custom **transient** (EIP-1153) | Cumple `.cursorrules`; más barato que lock en storage permanente |
| `.call{value}` (no `transfer`/`send`) | Evita límite 2300 gas; chequeo explícito de success |
| Cap de royalty a `remaining` | Evita underflow / seller con proceeds negativos |
| Auth por `msg.sender` (nunca `tx.origin`) | SWC-115 N/A |

### Royalties ERC-2981

| Decisión | Por qué |
|----------|---------|
| Consultar `supportsInterface` antes de `royaltyInfo` | No asumir que todo ERC-721 es 2981 |
| `try/catch` | Tokens no-ERC165 o que revierten no rompen el mercado |
| Royalty sobre `price` (no sobre `remaining`) | Alineado con `royaltyInfo(salePrice)` del estándar; luego se capa al neto post-fee |

### Stack / tooling

| Decisión | Por qué |
|----------|---------|
| Foundry + Cancun | Transient storage + fuzz 1000 |
| OpenZeppelin solo como interfaces IERC* | Marketplace propio; no heredar marketplace OZ |
| Demo Next.js separada | Contrato testeable sin UI; UI consume ABI |

---

## 3. ¿Se puede mejorar más el gas?

Sí. Lo actual está **bien para el alcance del módulo** (claridad + seguridad primero). Abajo: mejoras reales vs micro-optimizaciones, con tradeoffs.

### Ya aplicado (baseline post Fase 8)

Ver números en [`GAS.md`](./GAS.md): `listItem` ≈ **−28%**, `getListing` ≈ **−47%**, deploy ≈ **−6.8%**.

### Mejoras con impacto real (no hechas a propósito)

| Idea | Ahorro esperado | Tradeoff / riesgo |
|------|-----------------|-------------------|
| **`price` como `uint96`** (o `uint128`) + packing con `seller` en **1 slot** | ~1 SSTORE/SLOAD/`delete` menos en list/buy/cancel (~5–20k según path frío/caliente) | Precio máximo ~7.9×10²⁸ wei (`uint96`); hay que validar overflow al listar; cambia ABI/tests |
| **Pull-payments** (balances internos + `withdraw`) | Menos `.call` externos en `buyItem`; buy más barato y resistente a DoS de receptor | Más complejidad, más storage, UX de claim; sale del diseño push actual |
| **Operator listing** (solo `isApprovedForAll` + transfer en buy, sin escrow) | `listItem` mucho más barato (sin `safeTransferFrom`) | Pierde custodia; cancel/list races distintas; no es el modelo del módulo |
| Cachear “soporta 2981” por colección | Evita `supportsInterface` + posible `royaltyInfo` en cada buy | Storage por colección; stale si el NFT cambia (raro); más superficie |
| Empaquetar fee: `feeBps` en `uint16` immutable ya es barato | Marginal | Poco ROI |

### Mejoras menores / micro

| Idea | Nota |
|------|------|
| Calldata en vez de memory donde aplique | Aquí casi no hay arrays; impacto nulo |
| Custom errors ya usados | OK |
| Evitar `Listing memory` y leer campos sueltos | A veces ahorra; a veces empeora legibilidad; medir con `--gas-report` |
| `unchecked` en `protocolFee` mul/div | Solo si se prueba que `price * feeBps` no overflow (p.ej. feeBps capped y price acotado) |
| Assembly en `_pay` | Micro; peor auditabilidad |
| Quitar `try/catch` y asumir ERC-165 | Ahorra gas en el happy path; **rompe** compras de NFTs “sucios” |

### Qué **no** conviene tocar sin necesidad

- Quitar `nonReentrant` “porque ya hay CEI”: el NFT callback (`onERC721Received`) y el `receive` del seller son vectores reales; la suite `test/attack` lo demuestra.
- Acumular ETH en el contrato “para ahorrar calls”: introduce SWC-105 / withdraw mal diseñado.
- Loops sobre todos los listings: gas DoS (SWC-128).

### Orden recomendado si se quisiera una “Fase 9 gas”

1. Medir de nuevo (`forge test --gas-report` + snapshot).
2. Probar packing `seller + uint96 price` en un branch y comparar `listItem` / `buyItem`.
3. Solo si el producto lo pide: pull-payments (seguridad/UX, no solo gas).
4. No optimizar `supportsInterface` hasta ver perfiles reales de colecciones.

---

## 4. Mapa rápido código ↔ decisión

| Pieza en código | Rol |
|-----------------|-----|
| `mapping(...) _listings` | Estado de venta; clave = identidad del ítem |
| `listItem` | Escrow in |
| `cancelListing` | Escrow out (seller) |
| `buyItem` | Escrow out (buyer) + split ETH |
| `_calculatePayments` | Fee → royalty cap → seller |
| `_supportsERC2981` | Detección segura de royalties |
| `_pay` | Única puerta de salida de ETH |
| `ReentrancyGuard` (transient) | Lock barato en buy/cancel |
| `onERC721Received` | Habilita escrow con `safeTransferFrom` |

---

## 5. UI demo (cómo se refleja en el front)

La demo **no** cambia el contrato: solo ordena la UX.

| Zona UI | Acciones on-chain |
|---------|-------------------|
| En venta | `getListing` / eventos → `buyItem` o `cancelListing` |
| Crear NFT | `DemoERC721.mint` |
| Poner a la venta | `approve` + `listItem` (dos txs) |

Catálogo vacío al inicio es normal (no hay listings hasta publicar).  
Detalle operativo: [`DEPLOY.md`](./DEPLOY.md) · ayuda: `/ayuda`.

---

## 6. Resumen en una frase

**Escrow CEI + fee/royalty push + storage mínimo (2 slots) + guard transient**: el gas ya bajó de forma medible; el siguiente salto serio sería packing a 1 slot o cambiar el modelo de pagos (pull), ambos con tradeoffs de producto/seguridad explícitos.
