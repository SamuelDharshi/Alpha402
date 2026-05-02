/**
 * 0G Compute Network — AI Client
 *
 * Uses the OpenAI-compatible API endpoint from 0G's decentralized GPU marketplace.
 * SDK docs: https://docs.0g.ai
 *
 * Credentials setup (one-time):
 *   npm install -g @0gfoundation/0g-compute-ts-sdk
 *   0g-compute-cli setup-network          ← choose Galileo Testnet
 *   0g-compute-cli login
 *   0g-compute-cli deposit --amount 3
 *   0g-compute-cli inference list-providers
 *   export PROVIDER=0xa48f01287233509FD694a22Bf840225062E67836
 *   0g-compute-cli transfer-fund --provider $PROVIDER --amount 1
 *   0g-compute-cli inference acknowledge-provider --provider $PROVIDER
 *   0g-compute-cli inference get-secret --provider $PROVIDER
 *   → paste ZG_SERVICE_URL and ZG_API_SECRET into .env
 *
 * Priority order:
 *   1. 0G API-key mode   (ZG_SERVICE_URL + ZG_API_SECRET) — ✅ LIVE and working
 *   2. Groq fallback     (GROQ_API_KEY)                  — only if 0G unreachable
 */

import OpenAI from 'openai';

// ── Types ────────────────────────────────────────────────────────────────────
type Message = { role: 'system' | 'user' | 'assistant'; content: string };

// Singleton — one client per process lifetime
let _client: OpenAI | null  = null;
let _isZeroG               = false;

// ── Client factory ────────────────────────────────────────────────────────────
async function getClient(): Promise<{ client: OpenAI; isZeroG: boolean }> {
  if (_client) return { client: _client, isZeroG: _isZeroG };

  const serviceUrl = process.env.ZG_SERVICE_URL;
  const apiSecret  = process.env.ZG_API_SECRET;

  // ── Primary: 0G Compute Network (OpenAI-compatible, docs Step 4) ────────────
  if (serviceUrl && apiSecret) {
    _client  = new OpenAI({ baseURL: `${serviceUrl}/v1/proxy`, apiKey: apiSecret });
    _isZeroG = true;
    console.log('[0G Compute] ✅ Using 0G Compute Network (API-key mode)');
    console.log('[0G Compute]    Provider:', serviceUrl);
    console.log('[0G Compute]    Model:   ', process.env.ZG_MODEL || 'qwen/qwen-2.5-7b-instruct');
    return { client: _client, isZeroG: true };
  }

  // ── Fallback: Groq (centralized, only if 0G not configured) ─────────────────
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    console.warn('[0G Compute] ⚠️  ZG_SERVICE_URL/ZG_API_SECRET not set — using Groq fallback.');
    console.warn('[0G Compute]    To fix: 0g-compute-cli inference get-secret --provider <ADDR>');
    const { default: Groq } = await import('groq-sdk') as any;
    _client  = new Groq({ apiKey: groqKey }) as unknown as OpenAI;
    _isZeroG = false;
    return { client: _client, isZeroG: false };
  }

  throw new Error(
    '[0G Compute] No AI provider configured.\n' +
    '  Option A — 0G Compute: set ZG_SERVICE_URL and ZG_API_SECRET in .env\n' +
    '  Option B — Groq backup: set GROQ_API_KEY in .env'
  );
}

// ── Main inference function ───────────────────────────────────────────────────
/**
 * Call the 0G Compute Network for AI inference.
 * Falls back to Groq if 0G is not configured.
 * Optionally attempts TEE signature verification via the broker SDK
 * (requires a funded ledger; degrades gracefully if unavailable).
 */
export async function callWithBroker(
  messages: Message[],
  systemPromptOverride?: string
): Promise<string> {
  const allMessages: Message[] = systemPromptOverride
    ? [{ role: 'system', content: systemPromptOverride }, ...messages]
    : messages;

  const { client, isZeroG } = await getClient();

  // Pick correct model — Groq and 0G use different model IDs
  const model = isZeroG
    ? (process.env.ZG_MODEL || 'qwen/qwen-2.5-7b-instruct')
    : 'llama-3.1-8b-instant';

  const res = await client.chat.completions.create({
    model,
    messages: allMessages as any,
    response_format: { type: 'json_object' },
    temperature: 0,
  });

  const content = res.choices[0].message.content || '{}';

  if (isZeroG) {
    console.log(`[0G Compute] ✅ Inference complete — ${res.usage?.total_tokens ?? '?'} tokens`);

    // ── Optional: TEE verification via broker SDK ─────────────────────────────
    // The broker SDK verifies the response signature from the provider's TEE enclave.
    // This requires the ledger/sub-account to be funded AND the provider acknowledged.
    // If it fails (e.g. SDK bug, network issue), we still return the valid response.
    const providerAddress = process.env.ZG_PROVIDER_ADDRESS;
    const privateKey      = process.env.PRIVATE_KEY;
    const rpcUrl          = process.env.ZG_RPC_URL || 'https://evmrpc-testnet.0g.ai';

    if (providerAddress && privateKey && res.id) {
      try {
        const { ethers }                      = await import('ethers');
        const { createZGComputeNetworkBroker } = await import('@0gfoundation/0g-compute-ts-sdk');

        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const wallet   = new ethers.Wallet(privateKey, provider);
        const broker   = await createZGComputeNetworkBroker(wallet as any);

        const valid = await broker.inference.processResponse(providerAddress, res.id);
        console.log(`[0G Compute] TEE: ${valid ? '✅ signature verified' : '⚠️  signature mismatch'}`);
      } catch (err) {
        // Non-fatal — API-key mode inference already succeeded
        console.warn(`[0G Compute] TEE verification skipped: ${(err as Error).message.split('\n')[0]}`);
      }
    }
  }

  return content;
}

// Convenience export for modules that need the raw client
export { getClient as getZeroGClient };
