# Documentation — Module 05 NFT Marketplace

Index of the `doc/` folder. Module **closed** (phases 0–8 + Next.js demo).

| Document | Content |
|----------|---------|
| [PLANIFICACION-EN.md](./PLANIFICACION-EN.md) | Goal, scope, architecture, TDD phases, acceptance |
| [diagrama-flujo-EN.md](./diagrama-flujo-EN.md) | Listing, cancellation, purchase and royalty flows |
| [diagrama-clases-EN.md](./diagrama-clases-EN.md) | UML of contracts, mocks, tests and demo |
| [flujograma-EN.md](./flujograma-EN.md) | Operational flowchart, payouts, reentrancy, pipeline |
| [SWC-AUDIT-EN.md](./SWC-AUDIT-EN.md) | SWC-100–136 matrix + attack campaigns |
| [GAS-EN.md](./GAS-EN.md) | Baseline / post-opt gas + tradeoffs |
| [DECISIONES-Y-LOGICA-EN.md](./DECISIONES-Y-LOGICA-EN.md) | Technical decisions, protocol logic and possible gas improvements |
| [DEPLOY-EN.md](./DEPLOY-EN.md) | Anvil + forge script + frontend |
| [SOCIAL.md](./SOCIAL.md) | LinkedIn / X drafts + screenshots (Spanish, with an English LinkedIn version) |

**Contracts:** `src/NFTMarketplace.sol`, `src/mocks/DemoERC721.sol`  
**Tests:** `forge test` → 25 tests (unit + royalty + attack + fuzz)  
**UI:** `frontend/` → three zones (For sale · Create NFT · Put up for sale) · http://127.0.0.1:3000 · `/ayuda`  
**Deploy guide:** [DEPLOY-EN.md](./DEPLOY-EN.md)
