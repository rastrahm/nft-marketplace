# 05 — Gas-Optimized NFT Marketplace

Marketplace NFT con **escrow**, ventas a precio fijo, royalties **ERC-2981**, fee de protocolo y patrones seguros (CEI + ReentrancyGuard). Solidity `0.8.24` + Foundry.

**Estado:** Fases **0–8** ✅ + **demo Next.js** (tema claro/oscuro). Gas: [`doc/GAS-ES.md`](./doc/GAS-ES.md) · Deploy UI: [`doc/DEPLOY-ES.md`](./doc/DEPLOY-ES.md).

---

## Stack

| Capa | Tecnología |
|------|------------|
| Contratos | Solidity `0.8.24` |
| Tooling | Foundry (`forge` / `cast` / `anvil`) |
| Librerías | OpenZeppelin Contracts v5.2, forge-std |
| Estándares | ERC-721, ERC-165, ERC-2981 |
| UI demo | Next.js 15 · 3 zonas (catálogo / mintear / vender) · tema · `/ayuda` |

---

## Documentación

| Doc | Descripción |
|-----|-------------|
| [doc/README.md](./doc/README.md) | Índice de documentación |
| [doc/PLANIFICACION-ES.md](./doc/PLANIFICACION-ES.md) | Plan, fases TDD y criterios de aceptación |
| [doc/diagrama-flujo-ES.md](./doc/diagrama-flujo-ES.md) | Diagrama de flujo de procesos |
| [doc/diagrama-clases-ES.md](./doc/diagrama-clases-ES.md) | Diagrama de clases |
| [doc/flujograma-ES.md](./doc/flujograma-ES.md) | Flujograma operativo y payouts |
| [doc/SWC-AUDIT-ES.md](./doc/SWC-AUDIT-ES.md) | Auditoría SWC + mapeo a tests de ataque |
| [doc/GAS-ES.md](./doc/GAS-ES.md) | Optimización de gas y snapshot |
| [doc/DEPLOY-ES.md](./doc/DEPLOY-ES.md) | Anvil + deploy + frontend |

---

## Demo UI

Tres zonas en `frontend/`:

1. **En venta** — catálogo de listings (comprar / cancelar)  
2. **Crear NFT** — mintear a la wallet (no publica)  
3. **Poner a la venta** — publish (approve + `listItem`, 2 firmas)

```shell
# Terminal 1
anvil

# Terminal 2
forge script script/Deploy.s.sol:Deploy --rpc-url http://127.0.0.1:8545 --broadcast

# Terminal 3
cd frontend && cp .env.example .env.local
# completar addresses del deploy
npm install && npm run dev
```

Detalle: [`doc/DEPLOY-ES.md`](./doc/DEPLOY-ES.md) · ayuda in-app: `/ayuda`.  
Tema claro/oscuro: barra superior (`localStorage`: `market-theme`).

---

## Setup

```shell
# Usar Foundry real (no el paquete npm "forge")
export PATH="$HOME/.foundry/bin:$PATH"

forge install foundry-rs/forge-std@v1.16.2 --no-git
forge install OpenZeppelin/openzeppelin-contracts@v5.2.0 --no-git

forge build
forge test
```

---

## Estructura

```
src/                 # NFTMarketplace + DemoERC721
test/                # Unit, fuzz, attack
script/Deploy.s.sol  # Deploy local para la demo
frontend/            # Next.js App Router
doc/                 # Plan, SWC, gas, deploy
lib/                 # Dependencias (gitignored)
```

---

## Comandos útiles

```shell
forge build
forge test
forge test --fuzz-runs 1000
forge fmt
forge snapshot
cd frontend && npm test && npm run dev
```
