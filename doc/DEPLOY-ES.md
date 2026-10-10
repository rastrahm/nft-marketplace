# Deploy local — demo Next.js

Guía para ver el marketplace con Anvil + UI (tema claro/oscuro).

La interfaz está separada en **tres zonas**:

| Zona | Qué hace |
|------|----------|
| **1 · En venta** | Catálogo de listings activos (comprar / cancelar) |
| **2 · Crear NFT** | Solo mintear a tu wallet (no publica) |
| **3 · Poner a la venta** | Elegir NFT propio + precio → approve + `listItem` |

Manual in-app: **http://127.0.0.1:3000/ayuda**

**Requisitos:** Foundry (`~/.foundry/bin` en `PATH`) · Node.js **≥ 20.19** · MetaMask (u otra wallet).

---

## 1. Anvil

```bash
export PATH="$HOME/.foundry/bin:$PATH"
anvil --host 127.0.0.1 --port 8545
```

Chain ID: **31337**. Dejá esta terminal abierta.

### Cuenta #0 (demo)

| Campo | Valor |
|-------|-------|
| Address | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` |
| Private key | `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` |

Importala en MetaMask (red local) si querés operar los tokens **1, 2, 3** del deploy.

---

## 2. Deploy contratos

Otra terminal, desde la raíz del módulo:

```bash
export PATH="$HOME/.foundry/bin:$PATH"
forge script script/Deploy.s.sol:Deploy --rpc-url http://127.0.0.1:8545 --broadcast
```

El script despliega:

- `DemoERC721` (“Demo Market NFT” / `DMNFT`)
- `NFTMarketplace` con `feeBps = 250` (2.5%)
- Mintea tokens **1, 2, 3** a la cuenta #0

Anotá del log:

```
DemoERC721     0x...
NFTMarketplace 0x...
```

> Con Anvil limpio (primer deploy), suelen ser  
> NFT `0x5FbDB2315678afecb367f032d93F642f64180aa3` ·  
> Market `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512`.

---

## 3. Frontend

```bash
cd frontend
cp .env.example .env.local
```

Editá `.env.local`:

```env
NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545
NEXT_PUBLIC_CHAIN_ID=31337
NEXT_PUBLIC_MARKETPLACE_ADDRESS=0x...   # NFTMarketplace del log
NEXT_PUBLIC_NFT_ADDRESS=0x...           # DemoERC721 del log
```

```bash
# Node ≥ 20
export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh" && nvm use 20
npm install
npm run dev -- --hostname 127.0.0.1 --port 3000
```

Abrí **http://127.0.0.1:3000**

### MetaMask

1. Red: RPC `http://127.0.0.1:8545`, chain **31337**, símbolo ETH.  
2. Importá la private key de la cuenta #0 (opcional pero útil).  
3. En la UI: **Conectar wallet**.  
4. Si reiniciaste Anvil: MetaMask → Settings → Advanced → **Reset account**.

### Flujo sugerido (UI en 3 zonas)

**Camino A — tokens del deploy (Anvil #0)**

1. Conectá cuenta #0.  
2. Zona **3**: deberías ver `#1`, `#2`, `#3` → elegí uno, precio `0.1` → **Publicar** (2 firmas: NFT approve + market).  
3. Zona **1**: aparece el listing.  
4. Otra cuenta Anvil → **Comprar**.

**Camino B — mintear con tu wallet**

1. Zona **2**: **Sugerir ID libre** (p.ej. 10) → **Mintear a mi wallet**.  
2. Zona **3**: ese token + precio → **Publicar**.  
3. Zona **1**: comprar desde otra cuenta.

> No uses “Mintear” sobre IDs 1–3: ya existen y el contrato revierte.

---

## 4. Tema claro / oscuro

- Botón **Claro / Oscuro** en la barra superior (también en `/ayuda`).  
- Persistencia: `localStorage` clave `market-theme`.  
- Script en `layout` evita flash al cargar.

---

## 5. Tests UI

```bash
cd frontend
nvm use 20
npm test
```

---

## 6. Detener el entorno

```bash
# matar procesos en 3000 (Next) y 8545 (Anvil)
fuser -k 3000/tcp 8545/tcp
```

O cerrá las terminales de `anvil` y `npm run dev`.
