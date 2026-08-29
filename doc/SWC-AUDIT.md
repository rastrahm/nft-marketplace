# Auditoría SWC — NFTMarketplace

Verificación de `NFTMarketplace` contra el [SWC Registry](https://swcregistry.io/) (EIP-1470) y principios del monorepo (CEI, ReentrancyGuard custom, custom errors, ERC-2981, escrow seguro). Formato alineado con [`04-erc721/doc/SWC-AUDIT.md`](../../04-erc721/doc/SWC-AUDIT.md).

> **Nota:** El SWC Registry no se mantiene activamente desde ~2020. Complementar con [SCSVS](https://github.com/ComposableSecurity/SCSVS) y [EEA EthTrust](https://entethalliance.org/specs/ethtrust/).

**Contrato auditado:** `src/NFTMarketplace.sol` (+ `src/interfaces/INFTMarketplace.sol`, `src/utils/ReentrancyGuard.sol`)  
**Fecha:** 2026-08-29  
**Referencia tests:** `test/NFTMarketplace.t.sol`, `test/unit/`, `test/attack/`  
**Fase:** 6 (seguridad / reentrancy)

---

## Resumen ejecutivo

| Estado | Cantidad |
|--------|----------|
| ✅ Mitigado / No aplicable | 32 |
| ⚠️ Informativo (diseño / trust / DoS receptor) | 4 |
| ❌ Vulnerable | 0 |

**Conclusión:** Sin vulnerabilidades SWC explotables en el alcance del marketplace (list / cancel / buy + escrow + fee + ERC-2981). Riesgos informativos: DoS si seller/royalty/fee rechazan ETH, race de `approve` ERC-721 previo al list, trust en `feeBps`/`feeRecipient` del deploy, y royalty ERC-2981 voluntaria (capeada on-chain).

**Principios del suite verificados:**

| Principio | Estado |
|-----------|--------|
| CEI antes de transfers / `.call{value}` | ✅ `cancelListing` / `buyItem` |
| `ReentrancyGuard` custom en buy/cancel | ✅ + `test/attack/ReentrancyAttack.t.sol` |
| Custom errors (no `require` strings) | ✅ |
| Pragma fijo `0.8.24` | ✅ |
| ETH solo con `.call` + check success | ✅ `_pay` → `TransferFailed` |
| Escrow `safeTransferFrom` + `onERC721Received` | ✅ |
| ERC-2981 vía `supportsInterface` + cap | ✅ |

---

## Matriz completa SWC-100 — SWC-136

| ID | Título | Aplica | Estado | Evidencia en `NFTMarketplace` |
|----|--------|--------|--------|--------------------------------|
| SWC-100 | Function Default Visibility | Sí | ✅ | Visibilidad explícita en todas las funciones |
| SWC-101 | Integer Overflow and Underflow | Sí | ✅ | Solidity `0.8.24`; royalty capeada a `remaining`; fee `price * feeBps / 10_000` |
| SWC-102 | Outdated Compiler Version | Sí | ✅ | `pragma solidity 0.8.24` + `foundry.toml` |
| SWC-103 | Floating Pragma | Sí | ✅ | Pragma exacto (sin `^`) |
| SWC-104 | Unchecked Call Return Value | Sí | ✅ | `_pay` chequea success; OZ `safeTransferFrom` chequea receiver |
| SWC-105 | Unprotected Ether Withdrawal | Sí | ✅ | Sin withdraw admin; ETH solo se reparte en `buyItem` según listing |
| SWC-106 | Unprotected SELFDESTRUCT | No | N/A | Sin `selfdestruct` |
| SWC-107 | Reentrancy | Sí | ✅ | CEI + `nonReentrant` en `buyItem`/`cancelListing`; attack suite |
| SWC-108 | State Variable Default Visibility | Sí | ✅ | `_listings` private; immutables públicos explícitos |
| SWC-109 | Uninitialized Storage Pointer | No | N/A | Sin punteros storage legacy |
| SWC-110 | Assert Violation | No | N/A | Sin `assert` de producción |
| SWC-111 | Deprecated Solidity Functions | Sí | ✅ | Sin `suicide` / `throw` / `tx.origin` / `transfer`/`send` |
| SWC-112 | Delegatecall to Untrusted Callee | No | N/A | Sin `delegatecall` |
| SWC-113 | DoS with Failed Call | Sí | ⚠️ | Receptor que rechaza ETH → `TransferFailed` (tx revierte; listing intacto) |
| SWC-114 | Transaction Order Dependence | Sí | ⚠️ | Race de `approve` ERC-721 antes de `listItem` (estándar) |
| SWC-115 | Authorization through tx.origin | No | N/A | Auth por `msg.sender` (owner/seller); sin `tx.origin` |
| SWC-116 | Block values as a proxy for time | No | N/A | Sin lógica temporal on-chain |
| SWC-117 | Signature Malleability | No | N/A | Sin firmas / `ecrecover` / permit |
| SWC-118 | Incorrect Constructor Name | No | N/A | `constructor` 0.8+ |
| SWC-119 | Shadowing State Variables | Sí | ✅ | Sin shadowing con `ReentrancyGuard` / interfaz |
| SWC-120 | Weak Sources of Randomness | No | N/A | Sin RNG |
| SWC-121 | Missing Protection against Signature Replay | No | N/A | Sin firmas |
| SWC-122 | Lack of Proper Signature Verification | No | N/A | Sin verificación de firmas |
| SWC-123 | Requirement Violation | Sí | ✅ | Custom errors + unit + royalty + attack |
| SWC-124 | Write to Arbitrary Storage Location | No | N/A | Sin assembly de storage |
| SWC-125 | Incorrect Inheritance Order | Sí | ✅ | `INFTMarketplace, IERC721Receiver, ReentrancyGuard` |
| SWC-126 | Insufficient Gas Griefing | No | N/A | Sin relayers con stipend fijo |
| SWC-127 | Arbitrary Jump with Function Type Variable | No | N/A | Sin function types dinámicos |
| SWC-128 | DoS With Block Gas Limit | Sí | ✅ | Paths O(1); sin loops sobre listings |
| SWC-129 | Typographical Error | Sí | ✅ | Revisión + `forge build` / tests |
| SWC-130 | Right-To-Left-Override | No | N/A | ASCII |
| SWC-131 | Presence of unused variables | Sí | ✅ | Sin dead code material |
| SWC-132 | Unexpected Ether balance | Sí | ✅ | Marketplace no acumula ETH de ventas; refund de exceso en `buyItem` |
| SWC-133 | Hash Collisions (var-length args) | No | N/A | Sin hashing multi-dinámico propio |
| SWC-134 | Message call with hardcoded gas | No | N/A | `.call{value}` sin `{gas: …}` |
| SWC-135 | Code With No Effects | No | N/A | Sin no-ops relevantes |
| SWC-136 | Unencrypted Private Data On-Chain | Parcial | ✅ | Listings/precios públicos por diseño de marketplace |

---

## Riesgos informativos

### SWC-107 — Reentrancy (mitigado; evidenciado en Fase 6)

Vectores cubiertos:

| Vector | Callback | Función reentrada | Resultado esperado |
|--------|----------|-------------------|--------------------|
| Seller cobra venta | `receive` | `buyItem` / `cancelListing` | `TransferFailed` (guard → call false) |
| Buyer recibe NFT | `onERC721Received` | `buyItem` | `ReentrancyGuardReentrantCall` |
| Seller cancela | `onERC721Received` | `cancelListing` | `ReentrancyGuardReentrantCall` |

**Mitigación:** `delete` listing antes de interacciones + `nonReentrant`.

### SWC-113 — DoS por receptor que rechaza ETH

Si `seller`, `feeRecipient` o `royaltyReceiver` no pueden recibir ETH, `buyItem` revierte con `TransferFailed` y el listing permanece (estado consistente).

**Tratamiento v1:** By design; documentar que participantes deben poder recibir ETH nativo. Pull-payments quedarían fuera de alcance.

### SWC-114 — Front-running de `approve` (ERC-721)

Entre `approve(marketplace)` y `listItem`, un spender previo podría mover el token.

**Mitigación de producto:** preferir `setApprovalForAll` acotado al marketplace; list atómico tras approve; UI advierte revocar approvals viejos.

### Deploy trust — `feeBps` / `feeRecipient`

Fee y vault se fijan en el constructor (immutables). Un fee alto reduce el neto del seller; `feeRecipient` incorrecto desvía el protocolo fee.

**Tratamiento v1:** Documentar parámetros de deploy; validación/`Ownable` de fee queda fuera de alcance de este módulo.

### ERC-2981 voluntary + cap

Royalties solo si `supportsInterface(IERC2981)`; monto capeado a `price - protocolFee` para evitar underflow.

---

## Checklist principios monorepo

| Principio | ¿Cumple? | Notas |
|-----------|----------|--------|
| Custom errors | ✅ | `ItemNotForSale`, `PriceNotMet`, `NotItemOwner`, `TransferFailed`, `ZeroPrice` |
| CEI | ✅ | `buyItem` / `cancelListing` |
| ReentrancyGuard | ✅ | Custom state-based; attack suite |
| Safe ERC-721 escrow | ✅ | `safeTransferFrom` + receiver en marketplace |
| ETH `.call` checked | ✅ | `_pay` |
| NatSpec públicas/externas | ✅ | |
| Fuzz ≥ 1000 runs | ⏳ | Fase 7 |
| Invariantes | — | Opcional / fuera de fases 0–8 mínimas |

---

## Mapeo SWC → tests

| SWC | Test(s) |
|-----|---------|
| SWC-101 | Royalty cap `test_buyItem_capsRoyaltyToRemainingAfterFee`; fuzz en Fase 7 |
| SWC-103 | Compilador fijo (build) |
| SWC-104 | `_pay` + `test_Attack_*` (call false → `TransferFailed`) |
| SWC-107 | `test_Attack_SellerReenter*`, `test_Attack_BuyerReenter*`, `test_Attack_SellerReenterCancelOnERC721Received*` |
| SWC-113 | Documental; mismo path `TransferFailed` que ataques de payout |
| SWC-114 | Documental (approve race) |
| SWC-123 | unit + royalty + e2e + attack |
| SWC-132 | buy con excess refund (impl); unit con `value == price` |

---

## Campañas de ataque (Fase 6)

| ID | Nombre | Archivo |
|----|--------|---------|
| A1 | Seller reenter buy on payout | `test/attack/ReentrancyAttack.t.sol` |
| A2 | Seller reenter cancel on payout | idem |
| A3 | Buyer reenter buy on ERC721Received | idem |
| A4 | Seller reenter cancel on ERC721Received | idem |
| A5 | Control negativo (ataque off) | idem |

Actor: `test/attack/MaliciousActor.sol`.

---

## Referencias

- [SWC Registry](https://swcregistry.io/)
- [EIP-1470](https://eips.ethereum.org/EIPS/eip-1470)
- [EIP-721](https://eips.ethereum.org/EIPS/eip-721)
- [EIP-2981](https://eips.ethereum.org/EIPS/eip-2981)
- Plantilla monorepo: [`04-erc721/doc/SWC-AUDIT.md`](../../04-erc721/doc/SWC-AUDIT.md)
- Plan: [`PLANIFICACION.md`](./PLANIFICACION.md)
