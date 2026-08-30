import { formatEther, parseEther } from "ethers";

/**
 * Acorta una address para UI.
 * @param {string} address
 * @returns {string}
 */
export function shortAddress(address: string): string {
  if (address.length < 10) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/**
 * Formatea wei (bigint o string) a ETH legible.
 * @param {bigint | string} wei
 * @returns {string}
 */
export function formatEth(wei: bigint | string): string {
  return `${formatEther(wei)} ETH`;
}

/**
 * Parsea input de usuario (ETH) a wei.
 * @param {string} eth
 * @returns {bigint}
 */
export function parseEthInput(eth: string): bigint {
  return parseEther(eth.trim() || "0");
}
