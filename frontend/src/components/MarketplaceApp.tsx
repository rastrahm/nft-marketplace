"use client";

import { useMemo, useState } from "react";
import { safeParsePublicEnv, type PublicEnv } from "@/lib/env";
import { useWallet } from "@/hooks/useWallet";
import { useMarketplace } from "@/hooks/useMarketplace";
import { formatEth, shortAddress } from "@/lib/format";
import { AppToolbar } from "@/components/AppToolbar";

/**
 * Demo UI: conectar wallet, mintear demo NFT, listar, cancelar y comprar.
 * @returns {JSX.Element}
 */
export function MarketplaceApp() {
  const envResult = useMemo(() => safeParsePublicEnv(), []);
  const env: PublicEnv | null = envResult.success ? envResult.data : null;

  const wallet = useWallet(env);
  const market = useMarketplace(env, wallet.address, wallet.signer);

  const [tokenId, setTokenId] = useState("1");
  const [priceEth, setPriceEth] = useState("0.1");

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

  return (
    <div className="app-grid">
      <header className="hero">
        <AppToolbar />
        <p className="brand">Escrow Market</p>
        <h1 className="headline">NFT Marketplace</h1>
        <p className="lede">
          Listá, cancelá y comprá NFTs con fee de protocolo y escrow on-chain.
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

      <section className="panel" aria-label="Operar">
        <h2 className="panel-title">Operar</h2>
        <label className="field">
          Token ID
          <input
            aria-label="Token ID"
            inputMode="numeric"
            value={tokenId}
            onChange={(e) => setTokenId(e.target.value)}
            placeholder="1"
          />
        </label>
        <label className="field">
          Precio (ETH)
          <input
            aria-label="Precio en ETH"
            inputMode="decimal"
            value={priceEth}
            onChange={(e) => setPriceEth(e.target.value)}
            placeholder="0.1"
          />
        </label>
        <div className="actions">
          <button
            type="button"
            className="btn"
            disabled={market.busy || !wallet.address}
            onClick={() => void market.mintDemo(tokenId)}
          >
            Mintear demo
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={market.busy || !wallet.address}
            onClick={() => void market.listItem(tokenId, priceEth)}
          >
            Listar
          </button>
          <button
            type="button"
            className="btn"
            disabled={market.busy || !wallet.address}
            onClick={() => void market.cancelListing(tokenId)}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={market.busy || !wallet.address}
            onClick={() => void market.buyItem(tokenId, priceEth)}
          >
            Comprar
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={market.busy}
            onClick={() => void market.refreshListing(tokenId)}
          >
            Ver listing
          </button>
        </div>
        <p className="muted tiny" data-testid="listing-status">
          Listing #{tokenId}:{" "}
          {market.listing.active
            ? `${shortAddress(market.listing.seller)} · ${formatEth(market.listing.price)}`
            : "sin oferta activa"}
        </p>
        {market.status && (
          <p className="muted tiny" role="status">
            {market.status}
          </p>
        )}
        {market.error && (
          <pre className="error-box" role="alert">
            {market.error}
          </pre>
        )}
      </section>
    </div>
  );
}
