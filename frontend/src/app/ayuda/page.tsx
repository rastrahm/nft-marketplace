"use client";

import { AppToolbar } from "@/components/AppToolbar";

/**
 * Manual in-app: setup Anvil + flujo list/cancel/buy.
 * @returns {JSX.Element}
 */
export default function AyudaPage() {
  return (
    <div className="app-grid help-manual">
      <header className="hero">
        <AppToolbar showHome />
        <p className="brand">Ayuda</p>
        <h1 className="headline">Cómo usar la demo</h1>
      </header>

      <section className="panel">
        <h2 className="panel-title">Setup local</h2>
        <ol className="help-list">
          <li>
            Arrancá <strong>Anvil</strong>: <code>anvil</code>
          </li>
          <li>
            Deploy:{" "}
            <code>
              forge script script/Deploy.s.sol:Deploy --rpc-url http://127.0.0.1:8545
              --broadcast
            </code>
          </li>
          <li>
            Copiá las addresses a <code>frontend/.env.local</code> (desde{" "}
            <code>.env.example</code>).
          </li>
          <li>
            <code>cd frontend && npm run dev</code> → importá la cuenta Anvil #0 en
            MetaMask (chain 31337).
          </li>
        </ol>
      </section>

      <section className="panel">
        <h2 className="panel-title">Flujo</h2>
        <dl className="help-dl">
          <div>
            <dt>Mintear demo</dt>
            <dd>Crea un token en DemoERC721 a tu wallet (solo entornos locales).</dd>
          </div>
          <div>
            <dt>Listar</dt>
            <dd>Aprueba el marketplace y deja el NFT en escrow con un precio en ETH.</dd>
          </div>
          <div>
            <dt>Cancelar</dt>
            <dd>Solo el seller recupera el NFT y borra el listing.</dd>
          </div>
          <div>
            <dt>Comprar</dt>
            <dd>
              Pagás el precio; el protocolo cobra fee BPS y el resto va al seller
              (royalties ERC-2981 si el NFT las soporta).
            </dd>
          </div>
          <div>
            <dt>Tema claro / oscuro</dt>
            <dd>
              Usá el botón de la barra superior. La preferencia se guarda en{" "}
              <code>localStorage</code>.
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
