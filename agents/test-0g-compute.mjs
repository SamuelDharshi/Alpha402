/**
 * Live test for 0G Compute Network integration.
 * Tests both API-key mode (simple) and broker mode (TEE-verified).
 * Run: node test-0g-compute.mjs
 */
import OpenAI from 'openai';
import { readFileSync } from 'fs';

// Parse .env manually (no dotenv dependency)
const envFile = readFileSync('../.env', 'utf-8');
const env = Object.fromEntries(
  envFile.split('\n')
    .filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => { const [k, ...v] = l.split('='); return [k.trim(), v.join('=').trim()]; })
);

const ZG_SERVICE_URL     = env.ZG_SERVICE_URL;
const ZG_API_SECRET      = env.ZG_API_SECRET;
const ZG_MODEL           = env.ZG_MODEL || 'qwen/qwen-2.5-7b-instruct';
const ZG_PROVIDER_ADDRESS = env.ZG_PROVIDER_ADDRESS;
const PRIVATE_KEY        = env.PRIVATE_KEY;
const ZG_RPC_URL         = env.ZG_RPC_URL || 'https://evmrpc-testnet.0g.ai';

console.log('=== 0G Compute Network Integration Test ===\n');
console.log('ZG_SERVICE_URL:     ', ZG_SERVICE_URL || '❌ NOT SET');
console.log('ZG_API_SECRET:      ', ZG_API_SECRET ? `✅ set (${ZG_API_SECRET.slice(0,15)}...)` : '❌ NOT SET');
console.log('ZG_MODEL:           ', ZG_MODEL);
console.log('ZG_PROVIDER_ADDRESS:', ZG_PROVIDER_ADDRESS || '❌ NOT SET');
console.log('');

// ── TEST 1: API-key mode (OpenAI SDK) ────────────────────────────────────────
console.log('--- Test 1: API-key mode (docs Step 4) ---');
if (!ZG_SERVICE_URL || !ZG_API_SECRET) {
  console.error('❌ SKIP: ZG_SERVICE_URL or ZG_API_SECRET not set in .env');
} else {
  try {
    const client = new OpenAI({
      baseURL: `${ZG_SERVICE_URL}/v1/proxy`,
      apiKey:  ZG_API_SECRET,
    });

    const res = await client.chat.completions.create({
      model: ZG_MODEL,
      messages: [{ role: 'user', content: 'Reply with exactly this JSON: {"status":"ok","source":"0g-compute"}' }],
      response_format: { type: 'json_object' },
      temperature: 0,
      max_tokens: 30,
    });

    const content = res.choices[0].message.content;
    console.log('✅ Response:', content);
    console.log('✅ Model used:', res.model);
    console.log('✅ Usage:', JSON.stringify(res.usage));
  } catch (err) {
    console.error('❌ API-key mode failed:', err.message);
    if (err.status) console.error('   HTTP status:', err.status);
    if (err.error) console.error('   Error body:', JSON.stringify(err.error));
  }
}

console.log('');

// ── TEST 2: Broker mode (wallet-signed, TEE-verified) ────────────────────────
console.log('--- Test 2: Broker mode (wallet-signed TEE inference) ---');
if (!PRIVATE_KEY || !ZG_PROVIDER_ADDRESS) {
  console.error('❌ SKIP: PRIVATE_KEY or ZG_PROVIDER_ADDRESS not set');
} else {
  try {
    const { ethers } = await import('ethers');
    const { createZGComputeNetworkBroker } = await import('@0gfoundation/0g-compute-ts-sdk');

    const provider = new ethers.JsonRpcProvider(ZG_RPC_URL);
    const wallet   = new ethers.Wallet(PRIVATE_KEY, provider);

    console.log('  Wallet address:', wallet.address);
    console.log('  Creating broker...');
    const broker = await createZGComputeNetworkBroker(wallet);

    console.log('  Getting service metadata for provider:', ZG_PROVIDER_ADDRESS);
    const { endpoint, model } = await broker.inference.getServiceMetadata(ZG_PROVIDER_ADDRESS);
    console.log('  ✅ Endpoint:', endpoint);
    console.log('  ✅ Model:', model);

    const headers = await broker.inference.getRequestHeaders(ZG_PROVIDER_ADDRESS);
    console.log('  ✅ Got request headers');

    const response = await fetch(`${endpoint}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'Reply with exactly: {"tee":"verified"}' }],
        response_format: { type: 'json_object' },
        temperature: 0,
        max_tokens: 20,
      }),
    });

    const data   = await response.json();
    const chatID = response.headers.get('ZG-Res-Key') || response.headers.get('zg-res-key') || data.id;
    console.log('  Response content:', data.choices?.[0]?.message?.content);

    if (chatID) {
      const valid = await broker.inference.processResponse(ZG_PROVIDER_ADDRESS, chatID);
      console.log(`  TEE Verification: ${valid ? '✅ VALID signature' : '⚠️  signature mismatch'}`);
    }

  } catch (err) {
    console.error('❌ Broker mode failed:', err.message);
  }
}

console.log('\n=== Test Complete ===');
