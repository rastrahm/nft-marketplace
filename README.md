# 05 — Gas-Optimized NFT Marketplace

Marketplace NFT con **escrow**, ventas a precio fijo, royalties **ERC-2981**, fee de protocolo y patrones seguros (CEI + ReentrancyGuard). Solidity `0.8.24` + Foundry.

**Estado:** Fases **0–6** ✅ (incluye attack suite SWC-107 + `doc/SWC-AUDIT.md`). Fases 7–8 pendientes.

---

## Stack

| Capa | Tecnología |
|------|------------|
| Contratos | Solidity `0.8.24` |
| Tooling | Foundry (`forge` / `cast` / `anvil`) |
| Librerías | OpenZeppelin Contracts v5.2, forge-std |
| Estándares | ERC-721, ERC-165, ERC-2981 |

---

## Documentación

| Doc | Descripción |
|-----|-------------|
| [doc/PLANIFICACION.md](./doc/PLANIFICACION.md) | Plan, fases TDD y criterios de aceptación |
| [doc/diagrama-flujo.md](./doc/diagrama-flujo.md) | Diagrama de flujo de procesos |
| [doc/diagrama-clases.md](./doc/diagrama-clases.md) | Diagrama de clases |
| [doc/flujograma.md](./doc/flujograma.md) | Flujograma operativo y payouts |
| [doc/SWC-AUDIT.md](./doc/SWC-AUDIT.md) | Auditoría SWC + mapeo a tests de ataque |

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
src/                 # Contratos (NFTMarketplace en fases siguientes)
test/                # Unit, fuzz y seguridad
test/mocks/          # MockERC721, MockERC721Royalty, MaliciousActor
script/              # Scripts de deploy
doc/                 # Planificación y diagramas
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
```
