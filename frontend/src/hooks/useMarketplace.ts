"use client";

import { useCallback, useEffect, useState } from "react";
import type { Signer } from "ethers";
import {
  createReadContracts,
  createWriteContracts,
} from "@/lib/contracts";
import { formatContractError } from "@/lib/errors";
import type { PublicEnv } from "@/lib/env";
import { parseEthInput } from "@/lib/format";

export type MarketSnapshot = {
  feeBps: bigint;
  feeRecipient: string;
  nftName: string;
  nftSymbol: string;
};

/** Listing activo en el catálogo de ventas. */
export type CatalogListing = {
  tokenId: bigint;
  seller: string;
  price: bigint;
};

/** NFT en custodia de la wallet (no en escrow). */
export type OwnedToken = {
  tokenId: bigint;
};

const ZERO = "0x0000000000000000000000000000000000000000";
/** Rango de IDs a escanear en la demo (deploy 1–3 + mint manual). */
const SCAN_MAX_TOKEN_ID = 64n;

/**
 * Lectura/escritura del marketplace + DemoERC721.
 * @param {PublicEnv | null} env
 * @param {string | null} address
 * @param {Signer | null} signer
 */
export function useMarketplace(
  env: PublicEnv | null,
  address: string | null,
  signer: Signer | null,
) {
  const [snap, setSnap] = useState<MarketSnapshot>({
    feeBps: 0n,
    feeRecipient: ZERO,
    nftName: "—",
    nftSymbol: "—",
  });
  const [catalog, setCatalog] = useState<CatalogListing[]>([]);
  const [owned, setOwned] = useState<OwnedToken[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const refreshMeta = useCallback(async () => {
    if (!env) return;
    const { marketplace, nft } = createReadContracts(env);
    const [feeBps, feeRecipient, nftName, nftSymbol] = await Promise.all([
      marketplace.feeBps() as Promise<bigint>,
      marketplace.feeRecipient() as Promise<string>,
      nft.name() as Promise<string>,
      nft.symbol() as Promise<string>,
    ]);
    setSnap({ feeBps, feeRecipient, nftName, nftSymbol });
  }, [env]);

  /**
   * Catálogo: eventos ItemListed + verificación getListing (solo activos).
   */
  const refreshCatalog = useCallback(async () => {
    if (!env) return;
    const { marketplace } = createReadContracts(env);
    const nftAddr = env.NEXT_PUBLIC_NFT_ADDRESS.toLowerCase();

    const listed = await marketplace.queryFilter(marketplace.filters.ItemListed());
    const candidates = new Set<bigint>();
    for (const ev of listed) {
      const args = (ev as { args?: { nftAddress?: string; tokenId?: bigint } }).args;
      if (!args?.nftAddress || args.tokenId == null) continue;
      if (args.nftAddress.toLowerCase() !== nftAddr) continue;
      candidates.add(args.tokenId);
    }
    // Fallback demo: sondear 1..N por si Anvil reinició logs o no hay eventos aún
    for (let i = 1n; i <= SCAN_MAX_TOKEN_ID; i++) candidates.add(i);

    const rows = await Promise.all(
      [...candidates].map(async (tokenId) => {
        const row = (await marketplace.getListing(env.NEXT_PUBLIC_NFT_ADDRESS, tokenId)) as {
          seller: string;
          price: bigint;
        };
        if (row.seller === ZERO) return null;
        return { tokenId, seller: row.seller, price: row.price } satisfies CatalogListing;
      }),
    );

    setCatalog(
      rows
        .filter((r): r is CatalogListing => r != null)
        .sort((a, b) => (a.tokenId < b.tokenId ? -1 : a.tokenId > b.tokenId ? 1 : 0)),
    );
  }, [env]);

  /**
   * NFTs que la wallet conectada posee (ownerOf), no los del escrow.
   */
  const refreshOwned = useCallback(async () => {
    if (!env || !address) {
      setOwned([]);
      return;
    }
    const { nft } = createReadContracts(env);
    const found: OwnedToken[] = [];
    const checks = Array.from({ length: Number(SCAN_MAX_TOKEN_ID) }, (_, i) => BigInt(i + 1));
    await Promise.all(
      checks.map(async (tokenId) => {
        try {
          const owner = ((await nft.ownerOf(tokenId)) as string).toLowerCase();
          if (owner === address.toLowerCase()) found.push({ tokenId });
        } catch {
          /* token inexistente */
        }
      }),
    );
    found.sort((a, b) => (a.tokenId < b.tokenId ? -1 : a.tokenId > b.tokenId ? 1 : 0));
    setOwned(found);
  }, [env, address]);

  const refreshAll = useCallback(async () => {
    await Promise.all([refreshMeta(), refreshCatalog(), refreshOwned()]);
  }, [refreshMeta, refreshCatalog, refreshOwned]);

  useEffect(() => {
    void refreshAll().catch((err) => setError(formatContractError(err)));
  }, [refreshAll]);

  const run = useCallback(
    async (label: string, fn: () => Promise<void>) => {
      if (!env || !signer) {
        setError("Conecta la wallet primero");
        return;
      }
      setBusy(true);
      setError(null);
      setStatus(null);
      try {
        await fn();
        setStatus(label);
        await refreshAll();
      } catch (err) {
        setError(formatContractError(err));
      } finally {
        setBusy(false);
      }
    },
    [env, signer, refreshAll],
  );

  /**
   * Sugiere el próximo tokenId libre para mintear.
   */
  const suggestMintId = useCallback(async (): Promise<string> => {
    if (!env) return "10";
    const { nft } = createReadContracts(env);
    for (let i = 10n; i <= SCAN_MAX_TOKEN_ID; i++) {
      try {
        await nft.ownerOf(i);
      } catch {
        return i.toString();
      }
    }
    return (SCAN_MAX_TOKEN_ID + 1n).toString();
  }, [env]);

  const mintDemo = (tokenId: string) =>
    run("NFT minteado — ya podés ponerlo a la venta abajo", async () => {
      if (!address) throw new Error("Sin address");
      const id = BigInt(tokenId);
      const { nft: nftRead } = createReadContracts(env!);
      try {
        const owner = (await nftRead.ownerOf(id)) as string;
        throw new Error(
          `Token #${tokenId} ya existe (owner ${owner.slice(0, 10)}…). Pedí otro ID (botón “Sugerir ID”).`,
        );
      } catch (err) {
        if (err instanceof Error && err.message.includes("ya existe")) throw err;
      }
      const { nft } = createWriteContracts(env!, signer!);
      const tx = await nft.mint(address, id);
      await tx.wait();
    });

  const listItem = (tokenId: string, priceEth: string) =>
    run("Publicado en el catálogo de ventas", async () => {
      if (!address) throw new Error("Sin address");
      const id = BigInt(tokenId);
      const price = parseEthInput(priceEth);
      if (price <= 0n) throw new Error("El precio debe ser > 0");
      const { nft: nftRead } = createReadContracts(env!);
      let owner: string;
      try {
        owner = (await nftRead.ownerOf(id)) as string;
      } catch {
        throw new Error(`Token #${tokenId} no existe. Mintealo en “Crear NFT” primero.`);
      }
      if (owner.toLowerCase() !== address.toLowerCase()) {
        throw new Error(
          `No sos el owner (#${tokenId}). Conectá la wallet dueña o minteá uno nuevo.`,
        );
      }
      const { marketplace, nft } = createWriteContracts(env!, signer!);
      setStatus("1/2 · Aprobá el NFT en la wallet…");
      const approveTx = await nft.approve(env!.NEXT_PUBLIC_MARKETPLACE_ADDRESS, id);
      await approveTx.wait();
      setStatus("2/2 · Confirmá el listado en la wallet…");
      const listTx = await marketplace.listItem(env!.NEXT_PUBLIC_NFT_ADDRESS, id, price);
      await listTx.wait();
    });

  const cancelListing = (tokenId: string) =>
    run("Listing cancelado — NFT vuelto a tu wallet", async () => {
      const { marketplace } = createWriteContracts(env!, signer!);
      const tx = await marketplace.cancelListing(
        env!.NEXT_PUBLIC_NFT_ADDRESS,
        BigInt(tokenId),
      );
      await tx.wait();
    });

  const buyItem = (tokenId: string, priceWei: bigint) =>
    run("Compra confirmada", async () => {
      if (priceWei <= 0n) throw new Error("Precio inválido");
      const { marketplace } = createWriteContracts(env!, signer!);
      const tx = await marketplace.buyItem(
        env!.NEXT_PUBLIC_NFT_ADDRESS,
        BigInt(tokenId),
        { value: priceWei },
      );
      await tx.wait();
    });

  return {
    snap,
    catalog,
    owned,
    busy,
    error,
    status,
    refreshAll,
    suggestMintId,
    mintDemo,
    listItem,
    cancelListing,
    buyItem,
  };
}
