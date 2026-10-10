# Local deploy — Next.js demo

Guide to see the marketplace running with Anvil + UI (light/dark theme).

The interface is split into **three zones**:

| Zone | What it does |
|------|--------------|
| **1 · For sale** (*En venta*) | Catalog of active listings (buy / cancel) |
| **2 · Create NFT** (*Crear NFT*) | Only mints to your wallet (does not publish) |
| **3 · Put up for sale** (*Poner a la venta*) | Pick an owned NFT + price → approve + `listItem` |

> The demo UI is in Spanish; the original labels are shown in *italics*.

In-app manual: **http://127.0.0.1:3000/ayuda**

**Requirements:** Foundry (`~/.foundry/bin` in `PATH`) · Node.js **≥ 20.19** · MetaMask (or another wallet).

---

## 1. Anvil

```bash
export PATH="$HOME/.foundry/bin:$PATH"
anvil --host 127.0.0.1 --port 8545
```

Chain ID: **31337**. Keep this terminal open.

### Account #0 (demo)

| Field | Value |
|-------|-------|
| Address | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` |
| Private key | `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` |

Import it into MetaMask (local network) if you want to operate tokens **1, 2, 3** from the deploy.

---

## 2. Deploy contracts

In another terminal, from the module root:

```bash
export PATH="$HOME/.foundry/bin:$PATH"
forge script script/Deploy.s.sol:Deploy --rpc-url http://127.0.0.1:8545 --broadcast
```

The script deploys:

- `DemoERC721` ("Demo Market NFT" / `DMNFT`)
- `NFTMarketplace` with `feeBps = 250` (2.5%)
- Mints tokens **1, 2, 3** to account #0

Note down from the log:

```
DemoERC721     0x...
NFTMarketplace 0x...
```

> On a clean Anvil (first deploy), they are usually  
> NFT `0x5FbDB2315678afecb367f032d93F642f64180aa3` ·  
> Market `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512`.

---

## 3. Frontend

```bash
cd frontend
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545
NEXT_PUBLIC_CHAIN_ID=31337
NEXT_PUBLIC_MARKETPLACE_ADDRESS=0x...   # NFTMarketplace from the log
NEXT_PUBLIC_NFT_ADDRESS=0x...           # DemoERC721 from the log
```

```bash
# Node ≥ 20
export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh" && nvm use 20
npm install
npm run dev -- --hostname 127.0.0.1 --port 3000
```

Open **http://127.0.0.1:3000**

### MetaMask

1. Network: RPC `http://127.0.0.1:8545`, chain **31337**, symbol ETH.  
2. Import account #0's private key (optional but useful).  
3. In the UI: **Connect wallet** (*Conectar wallet*).  
4. If you restarted Anvil: MetaMask → Settings → Advanced → **Reset account**.

### Suggested flow (3-zone UI)

**Path A — deploy tokens (Anvil #0)**

1. Connect account #0.  
2. Zone **3**: you should see `#1`, `#2`, `#3` → pick one, price `0.1` → **Publish** (*Publicar en el mercado*) (2 signatures: NFT approve + market).  
3. Zone **1**: the listing appears.  
4. Another Anvil account → **Buy** (*Comprar*).

**Path B — mint with your wallet**

1. Zone **2**: **Suggest free ID** (*Sugerir ID libre*) (e.g. 10) → **Mint to my wallet** (*Mintear a mi wallet*).  
2. Zone **3**: that token + price → **Publish**.  
3. Zone **1**: buy from another account.

> Do not use "Mint" on IDs 1–3: they already exist and the contract reverts.

---

## 4. Light / dark theme

- **Light / Dark** button (*Claro / Oscuro*) in the top bar (also on `/ayuda`).  
- Persistence: `localStorage` key `market-theme`.  
- A script in `layout` avoids a flash on load.

---

## 5. UI tests

```bash
cd frontend
nvm use 20
npm test
```

---

## 6. Stop the environment

```bash
# kill processes on 3000 (Next) and 8545 (Anvil)
fuser -k 3000/tcp 8545/tcp
```

Or close the `anvil` and `npm run dev` terminals.
