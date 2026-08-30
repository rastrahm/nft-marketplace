import { BrowserProvider, Contract, JsonRpcProvider, type Signer } from "ethers";
import marketplaceAbiJson from "../../abi/NFTMarketplace.json";
import demoNftAbiJson from "../../abi/DemoERC721.json";
import type { PublicEnv } from "./env";

/** ABI del marketplace (artifact Foundry). */
export const marketplaceAbi = marketplaceAbiJson.abi;

/** ABI del NFT demo. */
export const demoNftAbi = demoNftAbiJson.abi;

/**
 * Provider de solo lectura hacia el RPC configurado.
 * @param {string} rpcUrl
 * @returns {JsonRpcProvider}
 */
export function createReadProvider(rpcUrl: string): JsonRpcProvider {
  return new JsonRpcProvider(rpcUrl);
}

/**
 * Contratos de lectura (sin signer).
 * @param {PublicEnv} env
 * @param {JsonRpcProvider} [provider]
 */
export function createReadContracts(env: PublicEnv, provider?: JsonRpcProvider) {
  const p = provider ?? createReadProvider(env.NEXT_PUBLIC_RPC_URL);
  return {
    provider: p,
    marketplace: new Contract(env.NEXT_PUBLIC_MARKETPLACE_ADDRESS, marketplaceAbi, p),
    nft: new Contract(env.NEXT_PUBLIC_NFT_ADDRESS, demoNftAbi, p),
  };
}

/**
 * Contratos conectados a un signer (wallet).
 * @param {PublicEnv} env
 * @param {Signer} signer
 */
export function createWriteContracts(env: PublicEnv, signer: Signer) {
  return {
    marketplace: new Contract(env.NEXT_PUBLIC_MARKETPLACE_ADDRESS, marketplaceAbi, signer),
    nft: new Contract(env.NEXT_PUBLIC_NFT_ADDRESS, demoNftAbi, signer),
  };
}

/**
 * Obtiene BrowserProvider desde `window.ethereum`.
 * @throws {Error} Si no hay wallet inyectada.
 * @returns {BrowserProvider}
 */
export function getBrowserProvider(): BrowserProvider {
  const eth = typeof window !== "undefined" ? window.ethereum : undefined;
  if (!eth) {
    throw new Error("No hay wallet inyectada (instala MetaMask u otra).");
  }
  return new BrowserProvider(eth);
}

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on?: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
    };
  }
}
