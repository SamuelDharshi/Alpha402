/**
 * 0G Storage integration — 0G Labs decentralised storage network
 * 
 * Uses @0glabs/0g-ts-sdk for uploads and retrieval.
 * Falls back to logging if SDK/network unavailable (dev mode).
 * 
 * 0G Storage docs: https://docs.0g.ai
 * Testnet RPC:     https://evmrpc-test.0g.ai
 */

import { ethers } from 'ethers';

// Conditional import so the app doesn't crash if SDK isn't available
let MemData: any = null;
let Indexer: any = null;
try {
  const sdk = await import('@0glabs/0g-ts-sdk');
  MemData = sdk.MemData ?? null;
  Indexer = sdk.Indexer ?? null;
} catch {
  // SDK not installed or incompatible — will use mock
}

export class ZeroGStorage {
  private rpc: string;
  private storageUrl: string;
  private indexerUrl: string;
  private provider: ethers.JsonRpcProvider | null = null;
  private signer: ethers.Wallet | null = null;
  private sdkAvailable = false;

  constructor() {
    this.rpc        = process.env.ZEROG_RPC_URL      || 'https://evmrpc-test.0g.ai';
    this.storageUrl = process.env.ZEROG_STORAGE_URL  || 'https://storage-testnet.0g.ai';
    this.indexerUrl = process.env.ZEROG_INDEXER_URL  || 'https://indexer-storage-testnet-standard.0g.ai';
  }

  async init() {
    this.sdkAvailable = !!MemData && !!Indexer;

    if (this.sdkAvailable && process.env.PRIVATE_KEY) {
      this.provider = new ethers.JsonRpcProvider(this.rpc);
      this.signer   = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
      console.log(`[0G] Connected to 0G Storage testnet (${this.rpc})`);
    } else {
      console.log(`[0G] Running in log-only mode (SDK or PRIVATE_KEY missing)`);
    }
  }

  async uploadJSON(data: object): Promise<string> {
    // BigInt-safe serializer
    const json = JSON.stringify(data, (_key, value) =>
      typeof value === 'bigint' ? value.toString() + 'n' : value
    );
    const bytes = Buffer.from(json, 'utf-8');

    // Try real 0G upload
    if (this.sdkAvailable && this.signer && Indexer && MemData) {
      try {
        const file = new MemData(bytes);
        const [tree, err] = await file.merkleTree();
        if (err) throw err;

        const rootHash = tree.rootHash();

        const indexer = new Indexer(this.indexerUrl);
        const [tx, uploadErr] = await indexer.upload(file, this.rpc, this.signer);
        if (uploadErr) throw uploadErr;

        console.log(`[0G] ✅ Uploaded ${bytes.length}B to 0G Storage | root: ${rootHash.slice(0, 12)}... | tx: ${tx}`);
        return `0g://${rootHash}`;
      } catch (err) {
        console.warn(`[0G] Upload failed, using CID fallback:`, (err as Error).message);
      }
    }

    // Log-only fallback
    const cid = `0g-${Math.random().toString(36).substring(2, 10)}`;
    console.log(`[0G] Logged ${bytes.length}B (CID: ${cid})`);
    return cid;
  }

  async downloadJSON(cid: string): Promise<any> {
    if (!cid.startsWith('0g://')) {
      console.log(`[0G] CID ${cid} is a log-only entry, no real data stored`);
      return null;
    }

    if (this.sdkAvailable && Indexer) {
      try {
        const rootHash = cid.replace('0g://', '');
        const indexer  = new Indexer(this.indexerUrl);
        const [data, err] = await indexer.download(rootHash, this.storageUrl, false);
        if (err) throw err;

        return JSON.parse(data.toString('utf-8'));
      } catch (err) {
        console.warn(`[0G] Download failed:`, (err as Error).message);
      }
    }

    return null;
  }
}
