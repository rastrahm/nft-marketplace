"use client";

import { useEffect, useMemo, useState } from "react";
import { safeParsePublicEnv, type PublicEnv } from "@/lib/env";
import { useWallet } from "@/hooks/useWallet";
import { useMarketplace } from "@/hooks/useMarketplace";
import { formatEth, shortAddress } from "@/lib/format";
import { AppToolbar } from "@/components/AppToolbar";

/**
 * Demo UI separada: catálogo de ventas · crear NFT · poner a la venta.
 * @returns {JSX.Element}
 */
export function MarketplaceApp() {
  const envResult = useMemo(() => safeParsePublicEnv(), []);
  const env: PublicEnv | null = envResult.success ? envResult.data : null;

  const wallet = useWallet(env);
  const market = useMarketplace(env, wallet.address, wallet.signer);

  const [mintId, setMintId] = useState("10");
  const [sellTokenId, setSellTokenId] = useState("");
  const [sellPrice, setSellPrice] = useState("0.1");

  useEffect(() => {
    if (market.owned.length === 0) return;
    const ids = market.owned.map((o) => o.tokenId.toString());
    if (!sellTokenId || !ids.includes(sellTokenId)) {
      setSellTokenId(ids[0]);
    }
  }, [market.owned, sellTokenId]);

  if (!envResult.success || !env) {
    return (
      <div className="app-grid">
        <AppToolbar />
        <section className="panel" role="alert">
          <h2 className="panel-title">Falta configuración</h2>
          <p className="muted">
            Copia <code>.env.example</code> → <code>.env.local</code> con las
            addresses del deploy Anvil. Ver <a href="/ayuda">/ayuda</a>.
          </p>
          <pre className="error-box">
            {envResult.success ? "Env incompleto" : envResult.error.message}
          </pre>
        </section>
      </div>
    );
  }

  const feePct = Number(market.snap.feeBps) / 100;
  const isSeller = (seller: string) =>
    !!wallet.address && seller.toLowerCase() === wallet.address.toLowerCase();

  return (
    <div className="app-grid">
      <header className="hero">
        <AppToolbar />
        <p className="brand">Escrow Market</p>
        <h1 className="headline">NFT Marketplace</h1>
        <p className="lede">
          Catálogo de ventas abajo. Crear un NFT y publicarlo son pasos separados.
        </p>
        <div className="cta-row">
          {!wallet.address ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => void wallet.connect()}
              disabled={wallet.connecting}
            >
              {wallet.connecting ? "Conectando…" : "Conectar wallet"}
            </button>
          ) : (
            <>
              <span className="pill" data-testid="wallet-address">
                {shortAddress(wallet.address)}
              </span>
              <button type="button" className="btn btn-ghost" onClick={wallet.disconnect}>
                Desconectar
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                disabled={market.busy}
                onClick={() => void market.refreshAll()}
              >
                Actualizar
              </button>
            </>
          )}
        </div>
        {(wallet.error || wallet.wrongChain) && (
          <p className="warn" role="status">
            {wallet.wrongChain
              ? `Red incorrecta (esperada ${env.NEXT_PUBLIC_CHAIN_ID})`
              : wallet.error}
          </p>
        )}
      </header>

      <section className="panel" aria-label="Protocolo">
        <h2 className="panel-title">Protocolo</h2>
        <dl className="stats">
          <div>
            <dt>Colección demo</dt>
            <dd data-testid="nft-name">
              {market.snap.nftName} ({market.snap.nftSymbol})
            </dd>
          </div>
          <div>
            <dt>Fee protocolo</dt>
            <dd data-testid="fee-bps">{feePct.toFixed(2)}%</dd>
          </div>
          <div>
            <dt>Fee recipient</dt>
            <dd data-testid="fee-recipient">{shortAddress(market.snap.feeRecipient)}</dd>
          </div>
          <div>
            <dt>Marketplace</dt>
            <dd>{shortAddress(env.NEXT_PUBLIC_MARKETPLACE_ADDRESS)}</dd>
          </div>
        </dl>
      </section>

      {(market.error || market.status) && (
        <section className="panel panel-feedback" aria-live="polite">
          {market.status && (
            <p className="muted tiny" role="status" style={{ marginTop: 0 }}>
              {market.status}
            </p>
          )}
          {market.error && (
            <pre className="error-box" role="alert" style={{ marginTop: market.status ? undefined : 0 }}>
              {market.error}
            </pre>
          )}
        </section>
      )}

      {/* ——— 1. VENTAS ——— */}
      <section className="panel" aria-label="En venta">
        <h2 className="panel-title">1 · En venta</h2>
        <p className="muted tiny section-lead">
          Tokens con listing activo en el marketplace. Comprá desde acá; si sos el
          seller, podés cancelar.
        </p>
        {market.catalog.length === 0 ? (
          <p className="empty-state" data-testid="catalog-empty">
            Nadie publicó aún. Creá un NFT (sección 2) y publicalo (sección 3).
          </p>
        ) : (
          <ul className="catalog" data-testid="catalog-list">
            {market.catalog.map((row) => (
              <li key={row.tokenId.toString()} className="catalog-row">
                <div className="catalog-meta">
                  <span className="catalog-id">#{row.tokenId.toString()}</span>
                  <span className="catalog-price">{formatEth(row.price)}</span>
                  <span className="catalog-seller muted tiny">
                    Seller {shortAddress(row.seller)}
                    {isSeller(row.seller) ? " · vos" : ""}
                  </span>
                </div>
                <div className="catalog-actions">
                  {isSeller(row.seller) ? (
                    <button
                      type="button"
                      className="btn"
                      disabled={market.busy || !wallet.address}
                      onClick={() => void market.cancelListing(row.tokenId.toString())}
                    >
                      Cancelar venta
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={market.busy || !wallet.address}
                      onClick={() =>
                        void market.buyItem(row.tokenId.toString(), row.price)
                      }
                    >
                      Comprar
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ——— 2. CREAR NFT ——— */}
      <section className="panel" aria-label="Crear NFT">
        <h2 className="panel-title">2 · Crear NFT (mintear)</h2>
        <p className="muted tiny section-lead">
          Solo genera el token en tu wallet. No lo pone a la venta. El deploy ya dejó
          #1–#3 en Anvil #0 (<code>0xf39F…2266</code>).
        </p>
        <label className="field">
          Nuevo token ID
          <input
            aria-label="Nuevo token ID"
            inputMode="numeric"
            value={mintId}
            onChange={(e) => setMintId(e.target.value)}
            placeholder="10"
          />
        </label>
        <div className="actions">
          <button
            type="button"
            className="btn btn-ghost"
            disabled={market.busy}
            onClick={() =>
              void market.suggestMintId().then((id) => setMintId(id))
            }
          >
            Sugerir ID libre
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={market.busy || !wallet.address}
            onClick={() => void market.mintDemo(mintId)}
          >
            Mintear a mi wallet
          </button>
        </div>
      </section>

      {/* ——— 3. PONER A LA VENTA ——— */}
      <section className="panel" aria-label="Poner a la venta">
        <h2 className="panel-title">3 · Poner a la venta</h2>
        <p className="muted tiny section-lead">
          Elegí un NFT que ya tengas en la wallet. Van dos firmas: approve + listar.
          Después aparece en “En venta”.
        </p>

        {!wallet.address ? (
          <p className="empty-state">Conectá la wallet para ver tus NFTs.</p>
        ) : market.owned.length === 0 ? (
          <p className="empty-state" data-testid="owned-empty">
            No tenés NFTs en esta wallet. Minteá en la sección 2, o importá Anvil #0
            para usar #1–#3.
          </p>
        ) : (
          <>
            <p className="muted tiny" data-testid="owned-count">
              En tu wallet:{" "}
              {market.owned.map((o) => `#${o.tokenId.toString()}`).join(", ")}
            </p>
            <label className="field">
              Token a vender
              <select
                aria-label="Token a vender"
                value={sellTokenId}
                onChange={(e) => setSellTokenId(e.target.value)}
              >
                {market.owned.map((o) => (
                  <option key={o.tokenId.toString()} value={o.tokenId.toString()}>
                    #{o.tokenId.toString()}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              Precio (ETH)
              <input
                aria-label="Precio en ETH"
                inputMode="decimal"
                value={sellPrice}
                onChange={(e) => setSellPrice(e.target.value)}
                placeholder="0.1"
              />
            </label>
            <div className="actions">
              <button
                type="button"
                className="btn btn-primary"
                disabled={market.busy || !sellTokenId}
                onClick={() => void market.listItem(sellTokenId, sellPrice)}
              >
                Publicar en el mercado
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
