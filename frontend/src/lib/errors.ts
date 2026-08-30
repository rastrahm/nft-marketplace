/**
 * Extrae mensaje legible de errores ethers / wallet.
 * @param {unknown} err
 * @returns {string}
 */
export function formatContractError(err: unknown): string {
  if (err instanceof Error) {
    const nested = err as Error & {
      shortMessage?: string;
      reason?: string;
      data?: { message?: string };
    };
    if (nested.shortMessage) return nested.shortMessage;
    if (nested.reason) return nested.reason;
    if (nested.data?.message) return nested.data.message;
    return nested.message;
  }
  return String(err);
}
