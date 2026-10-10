# Borradores redes — Escrow Market (módulo 05)

Links (reemplazá el de “artículo” si publicás en Medium/Hashnode/Mirror):

- **Repo / write-up:** https://github.com/rastrahm/nft-marketplace  
- **GitLab:** https://gitlab.com/rastrahm/nft-marketplace  
- **Capturas:** `doc/assets/ui-dark.png`, `ui-light.png`, `ui-ayuda.png`

> Si tenés un post largo aparte, poné esa URL donde diga “artículo”.

---

## LinkedIn (tono humano)

Cerré otro módulo de mi suite de smart contracts: un **NFT marketplace con escrow** en Solidity 0.8.24 + Foundry.

No es solo “listar y comprar”. Me importaba que el dinero y el NFT se muevan bien bajo presión:

- escrow con `safeTransferFrom`
- fee de protocolo + royalties ERC-2981 (con cap para no romper la cuenta)
- CEI + ReentrancyGuard transient (Cancun)
- tests unitarios, fuzz (1000 runs) y una suite de ataques de reentrancy (SWC-107)
- y una demo Next.js con tema claro/oscuro para poder mostrarlo sin Anvil a ciegas

Gas: bajé bastante el costo de `listItem` empaquetando el listing en 2 slots y sacando el SSTORE del lock.

Si te interesa el detalle (diagramas, auditoría SWC, gas y deploy local), dejé todo en el repo:

https://github.com/rastrahm/nft-marketplace

¿Qué parte te gustaría que profundice en un próximo post: seguridad, gas o la UI?

\#Solidity \#Foundry \#Web3 \#NFT \#SmartContracts \#Ethereum \#OpenZeppelin

**Imágenes sugeridas:** `ui-dark.png` + `ui-light.png` (antes/después del toggle) o una sola full-page.

---

## LinkedIn (English)

I just wrapped up another module of my smart contracts suite: an **escrow-based NFT marketplace** built with Solidity 0.8.24 + Foundry.

It's not just "list and buy." What I cared about was making sure the money and the NFT move correctly under pressure:

- Escrow via `safeTransferFrom`
- Protocol fee + ERC-2981 royalties (capped so the math never breaks)
- CEI + transient ReentrancyGuard (Cancun / EIP-1153)
- Unit tests, fuzzing (1,000 runs), and a reentrancy attack suite (SWC-107)
- A Next.js demo with light/dark theme, so you can actually see it working instead of poking at Anvil blindly

Gas: I cut the cost of `listItem` significantly (~28%) by packing the listing into 2 storage slots and removing the lock's permanent SSTORE.

If you're interested in the details (diagrams, SWC audit, gas report, and local deploy), everything is in the repo:

🔗 GitHub: https://github.com/rastrahm/nft-marketplace
🔗 GitLab: https://gitlab.com/rastrahm/nft-marketplace

Which part would you like me to dig into in a future post: security, gas, or the UI?

\#Solidity \#Foundry \#Web3 \#NFT \#SmartContracts \#Ethereum \#OpenZeppelin \#Blockchain \#DeFi

---

## X / Twitter — versión corta (1 post)

Cerré un NFT marketplace con escrow en Solidity + Foundry:

escrow on-chain, fee + ERC-2981, CEI + reentrancy guard, fuzz y demo Next.js (claro/oscuro).

Repo / docs:
https://github.com/rastrahm/nft-marketplace

\#Solidity \#Foundry \#Web3 \#NFT

---

## X — hilo (opcional, más humano)

**1/**
Terminé el módulo 05 de mi suite: marketplace NFT con escrow.

No quería un “hello world” de listing. Quería algo que aguante reentrancy, royalties raras y precios fuzzed.

**2/**
Stack: Solidity 0.8.24, Foundry, OZ v5.
Flujo: list → cancel → buy.
En el buy se parte el ETH: fee de protocolo + royalty (si hay ERC-2981) + seller.

**3/**
Seguridad: Checks-Effects-Interactions + ReentrancyGuard con storage transient (Cancun).
Hay tests donde un seller malicioso intenta reentrar desde el `receive`. Spoiler: no pasa.

**4/**
También metí demo UI en Next.js porque a veces el contrato se entiende mejor cuando lo ves:
conectar wallet, listar, cancelar, comprar… y toggle claro/oscuro.

**5/**
Todo el write-up (plan, diagramas, SWC, gas, deploy):
https://github.com/rastrahm/nft-marketplace

Si lo corrés en local: Anvil + un `forge script` y listo.

---

## Notas para publicar

1. El entorno local está arriba: http://127.0.0.1:3000 (Anvil + Next) para que saques más capturas con MetaMask si querés.  
2. Pegá 1–2 imágenes; en LinkedIn funcionan mejor oscuro + claro.  
3. Si publicás un artículo largo, cambiá el link del repo por esa URL y dejá el repo como “código”.
