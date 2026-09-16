import { Interface } from "ethers";
import { marketplaceAbi, demoNftAbi } from "./contracts";

const marketplaceIface = new Interface(marketplaceAbi);
const nftIface = new Interface(demoNftAbi);

const HINTS: Record<string, string> = {
  ItemNotForSale:
    "No hay listing activo para ese token. Primero usá Listar (o Ver listing).",
  NotItemOwner:
    "No sos el owner del NFT. Importá la cuenta Anvil #0 (tokens 1–3 ya minteados) o Mintear un tokenId nuevo (p.ej. 10) y después Listar.",
  PriceNotMet: "ETH enviado menor al precio del listing.",
  ZeroPrice: "El precio debe ser mayor que 0.",
  TransferFailed: "Un receptor rechazó el ETH (seller / fee / royalty / refund).",
  ERC721InvalidSender:
    "Ese tokenId ya existe. No lo mintees de nuevo: usá Listar con la cuenta dueña, o elegí otro tokenId (p.ej. 10, 11…).",
  ERC721NonexistentToken:
    "Ese tokenId no existe. Mintealo primero o usá 1, 2 o 3 (ya creados en el deploy).",
  ERC721IncorrectOwner:
    "La wallet no es dueña de ese NFT (¿aprobaste desde otra cuenta?).",
  ERC721InsufficientApproval:
    "Falta approve / setApprovalForAll hacia el marketplace.",
};

/**
 * Intenta decodificar el selector de custom error desde data hex.
 * @param {string} data
 * @returns {string | null}
 */
function decodeErrorData(data: string): string | null {
  if (!data || data === "0x" || data.length < 10) return null;
  for (const iface of [marketplaceIface, nftIface]) {
    try {
      const parsed = iface.parseError(data);
      if (!parsed) continue;
      const hint = HINTS[parsed.name];
      const args =
        parsed.args.length > 0
          ? ` (${parsed.args.map((a) => String(a)).join(", ")})`
          : "";
      return hint
        ? `${parsed.name}: ${hint}`
        : `${parsed.name}${args}`;
    } catch {
      /* next iface */
    }
  }
  return null;
}

/**
 * Busca hex de revert en el árbol del error ethers.
 * @param {unknown} err
 * @returns {string | null}
 */
function extractRevertData(err: unknown): string | null {
  if (!err || typeof err !== "object") return null;
  const e = err as Record<string, unknown>;
  if (typeof e.data === "string" && e.data.startsWith("0x")) return e.data;
  if (e.data && typeof e.data === "object") {
    const d = e.data as Record<string, unknown>;
    if (typeof d.data === "string" && d.data.startsWith("0x")) return d.data;
  }
  if (typeof e.info === "object" && e.info) {
    const info = e.info as Record<string, unknown>;
    const errObj = info.error as Record<string, unknown> | undefined;
    if (errObj && typeof errObj.data === "string") return errObj.data;
  }
  if (e.error) return extractRevertData(e.error);
  if (typeof e.message === "string") {
    const m = e.message.match(/data="?(0x[0-9a-fA-F]+)"?/);
    if (m) return m[1];
  }
  return null;
}

/**
 * Extrae mensaje legible de errores ethers / wallet / custom errors.
 * @param {unknown} err
 * @returns {string}
 */
export function formatContractError(err: unknown): string {
  const data = extractRevertData(err);
  const decoded = data ? decodeErrorData(data) : null;
  if (decoded) return decoded;

  if (err instanceof Error) {
    const nested = err as Error & {
      shortMessage?: string;
      reason?: string;
      data?: { message?: string };
    };
    const raw =
      nested.shortMessage ||
      nested.reason ||
      nested.data?.message ||
      nested.message;
    if (raw.includes("unknown custom error") || raw.includes("execution reverted")) {
      return `${raw} — Tip: token 1–3 ya existen (deploy). Para Mintear usá otro ID (10+). Para Listar importá Anvil #0 o minteá a tu wallet. Cancelar/Comprar requieren listing activo.`;
    }
    return raw;
  }
  return String(err);
}
