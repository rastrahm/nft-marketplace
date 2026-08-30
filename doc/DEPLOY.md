# Deploy local — demo Next.js

## 1. Anvil

```bash
export PATH="$HOME/.foundry/bin:$PATH"
anvil
```

## 2. Deploy contratos

En otra terminal, desde la raíz del módulo:

```bash
export PATH="$HOME/.foundry/bin:$PATH"
forge script script/Deploy.s.sol:Deploy --rpc-url http://127.0.0.1:8545 --broadcast
```

Anotá las addresses de `DemoERC721` y `NFTMarketplace` del log.

## 3. Frontend

```bash
cd frontend
cp .env.example .env.local
# Editá NEXT_PUBLIC_MARKETPLACE_ADDRESS y NEXT_PUBLIC_NFT_ADDRESS
npm install
npm run dev
```

Abrí http://localhost:3000 · MetaMask → red Anvil `31337` · importá la private key de la cuenta #0 de Anvil.

## 4. Tema

El botón **Claro / Oscuro** en la barra superior persiste en `localStorage` (`market-theme`).
