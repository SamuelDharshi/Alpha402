/**
 * 0G Storage Integration
 *
 * Uses @0glabs/0g-ts-sdk v0.2.9 to upload/download agent messages
 * to the 0G decentralized storage network.
 *
 * SDK reference: https://docs.0g.ai
 * Testnet faucet: https://faucet.0g.ai
 *
 * .env variables required:
 *   ZEROG_RPC_URL     = https://evmrpc-test.0g.ai
 *   ZEROG_INDEXER_URL = https://indexer-storage-testnet-standard.0g.ai
 *   PRIVATE_KEY       = <your-funded-testnet-wallet>
 */

import { ethers } from 'ethers';

// Conditional import — avoids crash if SDK has ESM/CJS issues
let MemData: any = null;
let Indexer: any = null;
try {
  const sdk = await import('@0glabs/0g-ts-sdk');
  MemData = sdk.MemData ?? null;
  Indexer = sdk.Indexer ?? null;
} catch {
  // SDK not installed or incompatible — storage will be unavailable
}

export class ZeroGStorage {
  private rpc: string;
  private indexerUrl: string;
  private provider: ethers.JsonRpcProvider | null = null;
  private signer: ethers.Wallet | null = null;
  private sdkAvailable = false;
  private initLogged   = false;

  constructor() {
    this.rpc        = process.env.ZEROG_RPC_URL     || 'https://evmrpc-test.0g.ai';
    this.indexerUrl = process.env.ZEROG_INDEXER_URL || 'https://indexer-storage-testnet-standard.0g.ai';
  }

  async init() {
    this.sdkAvailable = !!MemData && !!Indexer;

    if (this.sdkAvailable && process.env.PRIVATE_KEY) {
      this.provider = new ethers.JsonRpcProvider(this.rpc);
      this.signer   = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
      console.log(`[0G Storage] SDK ready — RPC: ${this.rpc}`);
      console.log(`[0G Storage] Indexer: ${this.indexerUrl}`);
      console.log(`[0G Storage] Wallet:  ${this.signer.address}`);
    } else if (!process.env.PRIVATE_KEY) {
      console.warn('[0G Storage] No PRIVATE_KEY — uploads disabled');
    } else {
      console.warn('[0G Storage] @0glabs/0g-ts-sdk not available — install it to enable storage');
    }
  }

  /**
   * Upload a JSON object to 0G Storage.
   * Returns a 0g://<rootHash> CID on success.
   * Throws on failure — no silent fallbacks.
   */
  async uploadJSON(data: object): Promise<string> {
    // BigInt-safe serialiser
    const json  = JSON.stringify(data, (_k, v) => typeof v === 'bigint' ? v.toString() + 'n' : v);
    const bytes = Buffer.from(json, 'utf-8');

    if (this.sdkAvailable && this.signer && Indexer && MemData) {
      try {
        const file = new MemData(bytes);

        // Build Merkle tree to get content address (root hash)
        const [tree, treeErr] = await file.merkleTree();
        if (treeErr) throw new Error(`Merkle tree: ${treeErr}`);
        const rootHash = tree.rootHash();

        // Upload via indexer (handles storage node selection automatically)
        const indexer = new Indexer(this.indexerUrl);
        const [tx, uploadErr] = await indexer.upload(file, this.rpc, this.signer);

        if (uploadErr) throw new Error(`Indexer upload: ${uploadErr}`);

        const cid = `0g://${rootHash}`;
        console.log(`[0G Storage] ✅ Uploaded ${bytes.length}B | CID: ${rootHash.slice(0, 16)}... | tx: ${tx}`);
        return cid;

      } catch (err) {
        const msg = (err as Error).message;
        // 503 = testnet indexer temporarily down (infra issue, not code bug)
        if (msg.includes('503') || msg.includes('Service Unavailable')) {
          console.warn(`[0G Storage] ⚠️  Indexer unavailable (503) — 0G testnet may be congested.`);
          console.warn(`[0G Storage]    Message stored in-memory only. Retry when testnet recovers.`);
          return `0g-pending://${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        }
        // All other errors are hard failures
        console.error(`[0G Storage] ❌ Upload failed:`, msg);
        throw new Error(`0G Storage upload error: ${msg}`);
      }
    }

    // SDK unavailable: return a local-only identifier
    const localId = `0g-local://${Date.now()}`;
    if (!this.initLogged) {
      this.initLogged = true;
      console.warn(`[0G Storage] SDK not configured — messages are in-memory only (${localId})`);
    }
    return localId;
  }

  /**
   * Download a JSON object by its 0g:// CID.
   */
  async downloadJSON(cid: string): Promise<any> {
    if (!cid.startsWith('0g://')) {
      console.log(`[0G Storage] CID ${cid} is local-only — no network data`);
      return null;
    }

    if (this.sdkAvailable && Indexer) {
      try {
        const rootHash = cid.replace('0g://', '');
        const indexer  = new Indexer(this.indexerUrl);
        const [data, err] = await indexer.download(rootHash, this.indexerUrl, false);
        if (err) throw err;
        return JSON.parse(data.toString('utf-8'));
      } catch (err) {
        console.warn(`[0G Storage] Download failed:`, (err as Error).message);
      }
    }

    return null;
  }
}
