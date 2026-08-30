# 05 — Gas-Optimized NFT Marketplace

Marketplace NFT con **escrow**, ventas a precio fijo, royalties **ERC-2981**, fee de protocolo y patrones seguros (CEI + ReentrancyGuard). Solidity `0.8.24` + Foundry.

**Estado:** Fases **0–8** ✅ + **demo Next.js** (tema claro/oscuro). Gas: [`doc/GAS.md`](./doc/GAS.md) · Deploy UI: [`doc/DEPLOY.md`](./doc/DEPLOY.md).

---

## Stack

| Capa | Tecnología |
|------|------------|
| Contratos | Solidity `0.8.24` |
| Tooling | Foundry (`forge` / `cast` / `anvil`) |
| Librerías | OpenZeppelin Contracts v5.2, forge-std |
| Estándares | ERC-721, ERC-165, ERC-2981 |
| UI demo | Next.js 15, ethers v6, Zod, Vitest · tema claro/oscuro · `/ayuda` |

---

## Documentación

| Doc | Descripción |
|-----|-------------|
| [doc/PLANIFICACION.md](./doc/PLANIFICACION.md) | Plan, fases TDD y criterios de aceptación |
| [doc/diagrama-flujo.md](./doc/diagrama-flujo.md) | Diagrama de flujo de procesos |
| [doc/diagrama-clases.md](./doc/diagrama-clases.md) | Diagrama de clases |
| [doc/flujograma.md](./doc/flujograma.md) | Flujograma operativo y payouts |
| [doc/SWC-AUDIT.md](./doc/SWC-AUDIT.md) | Auditoría SWC + mapeo a tests de ataque |
| [doc/GAS.md](./doc/GAS.md) | Optimización de gas y snapshot |
| [doc/DEPLOY.md](./doc/DEPLOY.md) | Anvil + deploy + frontend |

---

## Demo UI

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

Tema claro/oscuro: botón en la barra superior (`localStorage`: `market-theme`).

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
