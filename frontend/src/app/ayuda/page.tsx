"use client";

import { AppToolbar } from "@/components/AppToolbar";

/**
 * Manual in-app: setup Anvil + tres zonas de la UI + problemas comunes.
 * @returns {JSX.Element}
 */
export default function AyudaPage() {
  return (
    <div className="app-grid help-manual">
      <header className="hero">
        <AppToolbar showHome />
        <p className="brand">Ayuda</p>
        <h1 className="headline">Cómo usar la demo</h1>
        <p className="lede">
          La UI está partida en tres zonas a propósito: catálogo, crear NFT y
          publicar. No son el mismo botón.
        </p>
      </header>

      <section className="panel">
        <h2 className="panel-title">Setup local</h2>
        <ol className="help-list">
          <li>
            Arrancá <strong>Anvil</strong>:{" "}
            <code>anvil --host 127.0.0.1 --port 8545</code> (chain <strong>31337</strong>).
          </li>
          <li>
            Deploy desde la raíz del módulo:{" "}
            <code>
              forge script script/Deploy.s.sol:Deploy --rpc-url http://127.0.0.1:8545
              --broadcast
            </code>
          </li>
          <li>
            Copiá las addresses del log a <code>frontend/.env.local</code> (partí de{" "}
            <code>.env.example</code>).
          </li>
          <li>
            <code>cd frontend && npm run dev</code> →{" "}
            <a href="http://127.0.0.1:3000">http://127.0.0.1:3000</a>
          </li>
          <li>
            MetaMask: red Anvil (RPC <code>http://127.0.0.1:8545</code>). Para tokens
            del deploy (#1–#3), importá Anvil #0 (
            <code>0xf39F…2266</code> / key en <code>doc/DEPLOY.md</code>).
          </li>
        </ol>
      </section>

      <section className="panel">
        <h2 className="panel-title">Tres zonas (no mezclar)</h2>
        <dl className="help-dl">
          <div>
            <dt>1 · En venta</dt>
            <dd>
              Catálogo de listings <strong>activos</strong>. Acá comprás (otra
              wallet) o cancelás si sos el seller. Si está vacío, nadie publicó
              todavía — no es un error.
            </dd>
          </div>
          <div>
            <dt>2 · Crear NFT</dt>
            <dd>
              Solo mintea un token a <em>tu</em> wallet. No lo pone a la venta.
              Usá <strong>Sugerir ID libre</strong> (p.ej. 10+). Los IDs 1–3 ya
              existen tras el deploy; re-mintearlos revierte.
            </dd>
          </div>
          <div>
            <dt>3 · Poner a la venta</dt>
            <dd>
              Lista los NFTs que ya tenés en la wallet, elegís precio y
              publicás. MetaMask pedirá <strong>dos</strong> firmas seguidas:
              (1) <code>approve</code> al marketplace en el contrato NFT, (2){" "}
              <code>listItem</code> en el marketplace. Después el ítem aparece
              en la zona 1.
            </dd>
          </div>
        </dl>
      </section>

      <section className="panel">
        <h2 className="panel-title">Flujo recomendado</h2>
        <ol className="help-list">
          <li>Conectá wallet (Anvil #0 o la tuya).</li>
          <li>
            Zona 2: mintear un ID nuevo <strong>o</strong> usá #1–#3 con Anvil #0
            (ya minteados).
          </li>
          <li>Zona 3: elegir token → precio (p.ej. 0.1 ETH) → Publicar → confirmar las 2 txs.</li>
          <li>Zona 1: el listing aparece. Con otra cuenta Anvil → Comprar.</li>
          <li>Fee de protocolo (p.ej. 2.5%) va a <code>feeRecipient</code>; el resto al seller.</li>
        </ol>
      </section>

      <section className="panel">
        <h2 className="panel-title">Problemas comunes</h2>
        <dl className="help-dl">
          <div>
            <dt>“Token ya existe”</dt>
            <dd>Elegí otro ID en zona 2 (Sugerir ID libre). No mintees 1–3 de nuevo.</dd>
          </div>
          <div>
            <dt>“No sos el owner”</dt>
            <dd>
              La wallet conectada no posee ese token. Importá Anvil #0 o minteá a
              la cuenta actual.
            </dd>
          </div>
          <div>
            <dt>Catálogo vacío / “sin NFTs en wallet”</dt>
            <dd>
              Esperado al inicio. Publicá desde zona 3. Si Anvil se reinició,
              volvé a deployar y actualizá <code>.env.local</code>.
            </dd>
          </div>
          <div>
            <dt>MetaMask solo deja Cancelar / nonce raro</dt>
            <dd>
              Settings → Advanced → <strong>Reset account</strong> en la red
              Anvil (reiniciar Anvil invalida nonces viejos).
            </dd>
          </div>
          <div>
            <dt>Dos popups al publicar</dt>
            <dd>
              Normal: primero interactuás con <code>0x5FbD…</code> (NFT /
              approve), después con el marketplace.
            </dd>
          </div>
        </dl>
      </section>

      <section className="panel">
        <h2 className="panel-title">Extra</h2>
        <dl className="help-dl">
          <div>
            <dt>Tema claro / oscuro</dt>
            <dd>
              Botón de la barra superior; se guarda en{" "}
              <code>localStorage</code> (<code>market-theme</code>).
            </dd>
          </div>
          <div>
            <dt>Docs del repo</dt>
            <dd>
              Setup completo: <code>doc/DEPLOY.md</code>. Decisiones del
              contrato: <code>doc/DECISIONES-Y-LOGICA.md</code>.
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
