# Documentación — Module 05 NFT Marketplace

Índice de la carpeta `doc/`. Módulo **cerrado** (fases 0–8 + demo Next.js).

| Documento | Contenido |
|-----------|-----------|
| [PLANIFICACION.md](./PLANIFICACION.md) | Objetivo, alcance, arquitectura, fases TDD, aceptación |
| [diagrama-flujo.md](./diagrama-flujo.md) | Flujos de listado, cancelación, compra y royalties |
| [diagrama-clases.md](./diagrama-clases.md) | UML de contratos, mocks, tests y demo |
| [flujograma.md](./flujograma.md) | Flujograma operativo, payouts, reentrancy, pipeline |
| [SWC-AUDIT.md](./SWC-AUDIT.md) | Matriz SWC-100–136 + campañas de ataque |
| [GAS.md](./GAS.md) | Baseline / post-opt gas + tradeoffs |
| [DECISIONES-Y-LOGICA.md](./DECISIONES-Y-LOGICA.md) | Decisiones técnicas, lógica del protocolo y mejoras de gas posibles |
| [DEPLOY.md](./DEPLOY.md) | Anvil + forge script + frontend |
| [SOCIAL.md](./SOCIAL.md) | Borradores LinkedIn / X + capturas |

**Contratos:** `src/NFTMarketplace.sol`, `src/mocks/DemoERC721.sol`  
**Tests:** `forge test` → 25 tests (unit + royalty + attack + fuzz)  
**UI:** `frontend/` → tres zonas (En venta · Crear NFT · Poner a la venta) · http://127.0.0.1:3000 · `/ayuda`  
**Guía deploy:** [DEPLOY.md](./DEPLOY.md)
