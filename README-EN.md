# 05 — Gas-Optimized NFT Marketplace

NFT marketplace with **escrow**, fixed-price sales, **ERC-2981** royalties, protocol fee and secure patterns (CEI + ReentrancyGuard). Solidity `0.8.24` + Foundry.

**Status:** Phases **0–8** ✅ + **Next.js demo** (light/dark theme). Gas: [`doc/GAS-EN.md`](./doc/GAS-EN.md) · UI deploy: [`doc/DEPLOY-EN.md`](./doc/DEPLOY-EN.md).

---

## Stack

| Layer | Technology |
|-------|------------|
| Contracts | Solidity `0.8.24` |
| Tooling | Foundry (`forge` / `cast` / `anvil`) |
| Libraries | OpenZeppelin Contracts v5.2, forge-std |
| Standards | ERC-721, ERC-165, ERC-2981 |
| Demo UI | Next.js 15 · 3 zones (catalog / mint / sell) · theme · `/ayuda` |

---

## Documentation

| Doc | Description |
|-----|-------------|
| [doc/README.md](./doc/README.md) | Documentation index |
| [doc/PLANIFICACION-EN.md](./doc/PLANIFICACION-EN.md) | Plan, TDD phases and acceptance criteria |
| [doc/diagrama-flujo-EN.md](./doc/diagrama-flujo-EN.md) | Process flow diagram |
| [doc/diagrama-clases-EN.md](./doc/diagrama-clases-EN.md) | Class diagram |
| [doc/flujograma-EN.md](./doc/flujograma-EN.md) | Operational flowchart and payouts |
| [doc/SWC-AUDIT-EN.md](./doc/SWC-AUDIT-EN.md) | SWC audit + mapping to attack tests |
| [doc/GAS-EN.md](./doc/GAS-EN.md) | Gas optimization and snapshot |
| [doc/DEPLOY-EN.md](./doc/DEPLOY-EN.md) | Anvil + deploy + frontend |

---

## Demo UI

Three zones in `frontend/`:

1. **For sale** — listings catalog (buy / cancel)  
2. **Create NFT** — mint to your wallet (does not publish)  
3. **Put up for sale** — publish (approve + `listItem`, 2 signatures)

```shell
# Terminal 1
anvil

# Terminal 2
forge script script/Deploy.s.sol:Deploy --rpc-url http://127.0.0.1:8545 --broadcast

# Terminal 3
cd frontend && cp .env.example .env.local
# fill in the deployed addresses
npm install && npm run dev
```

Details: [`doc/DEPLOY-EN.md`](./doc/DEPLOY-EN.md) · in-app help: `/ayuda`.  
Light/dark theme: top bar (`localStorage`: `market-theme`).

> The demo UI itself is in Spanish.

---

## Setup

```shell
# Use the real Foundry (not the npm package "forge")
export PATH="$HOME/.foundry/bin:$PATH"

forge install foundry-rs/forge-std@v1.16.2 --no-git
forge install OpenZeppelin/openzeppelin-contracts@v5.2.0 --no-git

forge build
forge test
```

---

## Structure

```
src/                 # NFTMarketplace + DemoERC721
test/                # Unit, fuzz, attack
script/Deploy.s.sol  # Local deploy for the demo
frontend/            # Next.js App Router
doc/                 # Plan, SWC, gas, deploy
lib/                 # Dependencies (gitignored)
```

---

## Useful commands

```shell
forge build
forge test
forge test --fuzz-runs 1000
forge fmt
forge snapshot
cd frontend && npm test && npm run dev
```
