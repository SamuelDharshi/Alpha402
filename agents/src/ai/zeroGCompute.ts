/**
 * 0G Compute Network — AI Client
 *
 * Replaces Groq with decentralized, TEE-verified inference on 0G's GPU marketplace.
 * OpenAI-compatible API — drop-in replacement for the Groq SDK call.
 *
 * Setup (one-time CLI steps):
 *   npm install -g @0gfoundation/0g-compute-ts-sdk
 *   0g-compute-cli setup-network          → choose Galileo Testnet
 *   0g-compute-cli login                  → enter PRIVATE_KEY
 *   0g-compute-cli deposit --amount 3     → minimum 3 OG to create ledger
 *   0g-compute-cli inference list-providers
 *   0g-compute-cli transfer-fund --provider <ADDR> --amount 1
 *   0g-compute-cli inference get-secret  --provider <ADDR>
 *   → copy ZG_SERVICE_URL and ZG_API_SECRET into .env
 */

import { ethers } from 'ethers';
import OpenAI from 'openai';

let _apiClient: OpenAI | null = null;

// ── OpenAI-compatible client (simple, API-key mode) ──────────────────────────
export async function getZeroGClient(): Promise<OpenAI> {
  if (_apiClient) return _apiClient;

  const serviceUrl = process.env.ZG_SERVICE_URL;
  const apiSecret  = process.env.ZG_API_SECRET;

  if (serviceUrl && apiSecret) {
    _apiClient = new OpenAI({
      baseURL: `${serviceUrl}/v1/proxy`,
      apiKey:  apiSecret,
    });
    console.log('[0G Compute] ✅ Using API-key mode →', serviceUrl);
    return _apiClient;
  }

  // Fallback: try Groq if 0G is not yet configured
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    console.warn('[0G Compute] ⚠️  ZG_SERVICE_URL/ZG_API_SECRET not set — falling back to Groq.');
    console.warn('[0G Compute]    Run: 0g-compute-cli inference get-secret --provider <ADDR>');
    const { default: Groq } = await import('groq-sdk') as any;
    _apiClient = new Groq({ apiKey: groqKey }) as unknown as OpenAI;
    return _apiClient;
  }

  throw new Error(
    'No AI provider configured.\n' +
    '  Option A (0G Compute): Set ZG_SERVICE_URL and ZG_API_SECRET in .env\n' +
    '  Option B (Groq fallback): Set GROQ_API_KEY in .env'
  );
}

// ── Broker-mode: wallet-signed requests with TEE verification ─────────────────
export async function callWithBroker(
  messages: Array<{ role: string; content: string }>,
  systemPromptOverride?: string
): Promise<string> {
  const providerAddress = process.env.ZG_PROVIDER_ADDRESS;
  const privateKey      = process.env.PRIVATE_KEY;
  const rpcUrl          = process.env.ZG_RPC_URL || 'https://evmrpc-testnet.0g.ai';

  if (!providerAddress || !privateKey) {
    // Fall back to API-key mode
    const client = await getZeroGClient();
    const allMessages = systemPromptOverride
      ? [{ role: 'system' as const, content: systemPromptOverride }, ...messages]
      : messages;
    const res = await (client as OpenAI).chat.completions.create({
      model: process.env.ZG_MODEL || 'qwen/qwen-2.5-7b-instruct',
      messages: allMessages as any,
      response_format: { type: 'json_object' },
      temperature: 0,
    });
    return res.choices[0].message.content || '{}';
  }

  try {
    const { createZGComputeNetworkBroker } = await import('@0gfoundation/0g-compute-ts-sdk');
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet   = new ethers.Wallet(privateKey, provider);
    const broker   = await createZGComputeNetworkBroker(wallet);

    const { endpoint, model } = await broker.inference.getServiceMetadata(providerAddress);
    const headers             = await broker.inference.getRequestHeaders(providerAddress);

    const body = {
      model,
      messages: systemPromptOverride
        ? [{ role: 'system', content: systemPromptOverride }, ...messages]
        : messages,
      response_format: { type: 'json_object' },
      temperature: 0,
    };

    const response = await fetch(`${endpoint}/chat/completions`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body:    JSON.stringify(body),
    });

    const data   = await response.json() as any;
    const chatID = response.headers.get('ZG-Res-Key') || response.headers.get('zg-res-key') || data.id;

    // TEE signature verification — proves the model ran in a secure enclave
    if (chatID) {
      const valid = await broker.inference.processResponse(providerAddress, chatID);
      console.log(`[0G Compute] TEE verification: ${valid ? '✅ VALID' : '⚠️  signature mismatch'}`);
    }

    return data.choices?.[0]?.message?.content || '{}';

  } catch (err) {
    console.error('[0G Compute] Broker call failed, retrying with API-key mode:', (err as Error).message);
    // graceful fallback to API-key / Groq
    return callWithApiKey(messages, systemPromptOverride);
  }
}

async function callWithApiKey(
  messages: Array<{ role: string; content: string }>,
  systemPrompt?: string
): Promise<string> {
  const client = await getZeroGClient();
  const all = systemPrompt
    ? [{ role: 'system' as const, content: systemPrompt }, ...messages]
    : messages;
  const res = await (client as OpenAI).chat.completions.create({
    model: process.env.ZG_MODEL || 'qwen/qwen-2.5-7b-instruct',
    messages: all as any,
    response_format: { type: 'json_object' },
    temperature: 0,
  });
  return res.choices[0].message.content || '{}';
}
