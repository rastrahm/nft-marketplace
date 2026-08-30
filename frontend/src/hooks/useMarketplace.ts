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

export type ListingView = {
  seller: string;
  price: bigint;
  active: boolean;
};

const ZERO = "0x0000000000000000000000000000000000000000";

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
  const [listing, setListing] = useState<ListingView>({
    seller: ZERO,
    price: 0n,
    active: false,
  });
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

  const refreshListing = useCallback(
    async (tokenId: string) => {
      if (!env) return;
      const id = BigInt(tokenId || "0");
      const { marketplace } = createReadContracts(env);
      const row = (await marketplace.getListing(env.NEXT_PUBLIC_NFT_ADDRESS, id)) as {
        seller: string;
        price: bigint;
      };
      setListing({
        seller: row.seller,
        price: row.price,
        active: row.seller !== ZERO,
      });
    },
    [env],
  );

  useEffect(() => {
    void refreshMeta().catch((err) => setError(formatContractError(err)));
  }, [refreshMeta]);

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
        await refreshMeta();
      } catch (err) {
        setError(formatContractError(err));
      } finally {
        setBusy(false);
      }
    },
    [env, signer, refreshMeta],
  );

  /**
   * Mintea un token demo a la wallet conectada.
   * @param {string} tokenId
   */
  const mintDemo = (tokenId: string) =>
    run("NFT minteado", async () => {
      if (!address) throw new Error("Sin address");
      const { nft } = createWriteContracts(env!, signer!);
      const tx = await nft.mint(address, BigInt(tokenId));
      await tx.wait();
    });

  /**
   * Aprueba y lista un NFT en escrow.
   * @param {string} tokenId
   * @param {string} priceEth
   */
  const listItem = (tokenId: string, priceEth: string) =>
    run("Listado creado", async () => {
      const id = BigInt(tokenId);
      const price = parseEthInput(priceEth);
      if (price <= 0n) throw new Error("El precio debe ser > 0");
      const { marketplace, nft } = createWriteContracts(env!, signer!);
      const approveTx = await nft.approve(env!.NEXT_PUBLIC_MARKETPLACE_ADDRESS, id);
      await approveTx.wait();
      const listTx = await marketplace.listItem(env!.NEXT_PUBLIC_NFT_ADDRESS, id, price);
      await listTx.wait();
      await refreshListing(tokenId);
    });

  /**
   * Cancela un listing propio.
   * @param {string} tokenId
   */
  const cancelListing = (tokenId: string) =>
    run("Listing cancelado", async () => {
      const { marketplace } = createWriteContracts(env!, signer!);
      const tx = await marketplace.cancelListing(
        env!.NEXT_PUBLIC_NFT_ADDRESS,
        BigInt(tokenId),
      );
      await tx.wait();
      await refreshListing(tokenId);
    });

  /**
   * Compra un listing pagando el precio en ETH.
   * @param {string} tokenId
   * @param {string} priceEth
   */
  const buyItem = (tokenId: string, priceEth: string) =>
    run("Compra confirmada", async () => {
      const price = parseEthInput(priceEth);
      const { marketplace } = createWriteContracts(env!, signer!);
      const tx = await marketplace.buyItem(
        env!.NEXT_PUBLIC_NFT_ADDRESS,
        BigInt(tokenId),
        { value: price },
      );
      await tx.wait();
      await refreshListing(tokenId);
    });

  return {
    snap,
    listing,
    busy,
    error,
    status,
    refreshMeta,
    refreshListing,
    mintDemo,
    listItem,
    cancelListing,
    buyItem,
  };
}
