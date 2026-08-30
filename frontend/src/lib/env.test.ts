import { describe, expect, it } from "vitest";
import { parsePublicEnv, safeParsePublicEnv } from "@/lib/env";

describe("parsePublicEnv", () => {
  it("acepta un env válido", () => {
    const env = parsePublicEnv({
      NEXT_PUBLIC_RPC_URL: "http://127.0.0.1:8545",
      NEXT_PUBLIC_CHAIN_ID: "31337",
      NEXT_PUBLIC_MARKETPLACE_ADDRESS: "0x1111111111111111111111111111111111111111",
      NEXT_PUBLIC_NFT_ADDRESS: "0x2222222222222222222222222222222222222222",
    });
    expect(env.NEXT_PUBLIC_CHAIN_ID).toBe(31337);
  });

  it("safeParse falla con address inválida", () => {
    const result = safeParsePublicEnv({
      NEXT_PUBLIC_RPC_URL: "http://127.0.0.1:8545",
      NEXT_PUBLIC_CHAIN_ID: "31337",
      NEXT_PUBLIC_MARKETPLACE_ADDRESS: "not-an-address",
      NEXT_PUBLIC_NFT_ADDRESS: "0x2222222222222222222222222222222222222222",
    });
    expect(result.success).toBe(false);
  });
});
