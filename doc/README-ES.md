# Documentación — Module 05 NFT Marketplace

Índice de la carpeta `doc/`. Módulo **cerrado** (fases 0–8 + demo Next.js).

| Documento | Contenido |
|-----------|-----------|
| [PLANIFICACION-ES.md](./PLANIFICACION-ES.md) | Objetivo, alcance, arquitectura, fases TDD, aceptación |
| [diagrama-flujo-ES.md](./diagrama-flujo-ES.md) | Flujos de listado, cancelación, compra y royalties |
| [diagrama-clases-ES.md](./diagrama-clases-ES.md) | UML de contratos, mocks, tests y demo |
| [flujograma-ES.md](./flujograma-ES.md) | Flujograma operativo, payouts, reentrancy, pipeline |
| [SWC-AUDIT-ES.md](./SWC-AUDIT-ES.md) | Matriz SWC-100–136 + campañas de ataque |
| [GAS-ES.md](./GAS-ES.md) | Baseline / post-opt gas + tradeoffs |
| [DECISIONES-Y-LOGICA-ES.md](./DECISIONES-Y-LOGICA-ES.md) | Decisiones técnicas, lógica del protocolo y mejoras de gas posibles |
| [DEPLOY-ES.md](./DEPLOY-ES.md) | Anvil + forge script + frontend |
| [SOCIAL.md](./SOCIAL.md) | Borradores LinkedIn / X + capturas |

**Contratos:** `src/NFTMarketplace.sol`, `src/mocks/DemoERC721.sol`  
**Tests:** `forge test` → 25 tests (unit + royalty + attack + fuzz)  
**UI:** `frontend/` → tres zonas (En venta · Crear NFT · Poner a la venta) · http://127.0.0.1:3000 · `/ayuda`  
**Guía deploy:** [DEPLOY-ES.md](./DEPLOY-ES.md)
