/**
 * Live test for 0G Storage integration.
 * Run: node test-0g-storage.mjs
 */
import { readFileSync } from 'fs';
import { ethers } from 'ethers';
import { MemData, Indexer } from '@0glabs/0g-ts-sdk';

const envFile = readFileSync('../.env', 'utf-8');
const env = Object.fromEntries(
  envFile.split('\n')
    .filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => { const [k, ...v] = l.split('='); return [k.trim(), v.join('=').trim()]; })
);

const RPC          = env.ZEROG_RPC_URL || 'https://evmrpc-test.0g.ai';
const INDEXER_URL  = env.ZEROG_INDEXER_URL || 'https://indexer-storage-testnet-standard.0g.ai';
const PRIVATE_KEY  = env.PRIVATE_KEY;

console.log('=== 0G Storage Integration Test ===\n');
console.log('RPC:         ', RPC);
console.log('Indexer:     ', INDEXER_URL);
console.log('Private key: ', PRIVATE_KEY ? '✅ set' : '❌ NOT SET');

if (!PRIVATE_KEY) {
  console.error('ERROR: PRIVATE_KEY not set in .env'); process.exit(1);
}

const provider = new ethers.JsonRpcProvider(RPC);
const wallet   = new ethers.Wallet(PRIVATE_KEY, provider);
console.log('Wallet:      ', wallet.address);

// Build test payload
const testData = {
  type: 'AGENT_MESSAGE',
  from: 'intel',
  to: 'commander',
  timestamp: Date.now(),
  payload: { price: 3142.87, source: '0g-storage-test' },
};
const json  = JSON.stringify(testData);
const bytes = Buffer.from(json, 'utf-8');

console.log('\nUploading', bytes.length, 'bytes to 0G Storage...');

try {
  const file = new MemData(bytes);
  const [tree, treeErr] = await file.merkleTree();
  if (treeErr) throw treeErr;
  const rootHash = tree.rootHash();
  console.log('Root hash:', rootHash);

  const indexer = new Indexer(INDEXER_URL);
  const [tx, uploadErr] = await indexer.upload(file, RPC, wallet);
  if (uploadErr) throw uploadErr;

  const cid = `0g://${rootHash}`;
  console.log('\n✅ Upload SUCCESS');
  console.log('   CID:', cid);
  console.log('   TX: ', tx);
  console.log('\nPaste into .env if needed:\n  ZEROG_INDEXER_URL=' + INDEXER_URL);
} catch (err) {
  console.error('\n❌ Upload FAILED:', err.message || err);
  console.error('\nPossible causes:');
  console.error('  - Insufficient 0G testnet tokens (get from faucet.0g.ai)');
  console.error('  - RPC endpoint unreachable');
  console.error('  - Indexer URL unreachable:', INDEXER_URL);
}
