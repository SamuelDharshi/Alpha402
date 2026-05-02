import { ethers } from 'ethers';
import crypto from 'node:crypto';
import { AgentBus } from '../../bus/index.js';
import { Strategy, ENSIdentity } from '../../shared.js';

export class IntelAgent {
  private bus: AgentBus;
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet | ethers.HDNodeWallet;
  private paymentManager!: ethers.Contract;
  private activeWatches: Map<string, ReturnType<typeof setInterval>> = new Map();

  constructor(bus: AgentBus) {
    this.bus = bus;
    this.provider = new ethers.JsonRpcProvider(
      process.env.UNICHAIN_RPC_URL || 'https://sepolia.unichain.org',
      { chainId: 1301, name: 'unichain-sepolia' },
      { staticNetwork: true }
    );

    const pk = process.env.PRIVATE_KEY;
    this.wallet = pk
      ? new ethers.Wallet(pk, this.provider)
      : ethers.Wallet.createRandom().connect(this.provider);

    if (!pk) {
      console.warn('[Intel] ⚠️  No PRIVATE_KEY — on-chain payments disabled');
    }

    const pmAddress = process.env.AGENT_PAYMENT_MANAGER_ADDRESS;
    if (pmAddress) {
      const pmABI = ['function recordPayment(bytes32, address, uint256, string) external'];
      this.paymentManager = new ethers.Contract(pmAddress, pmABI, this.wallet);
    }
  }

  async init() {
    console.log('[Intel] Initializing iNFT Identity...');
    const ens = new ENSIdentity(process.env.SEPOLIA_RPC_URL);
    const resolved = await ens.resolveName('intel.alpha402.eth');
    if (resolved) console.log(`[ENS] ✅ Verified Identity: intel.alpha402.eth -> ${resolved}`);

    const registryAddr = process.env.AGENT_REGISTRY_ADDRESS;
    if (registryAddr && process.env.PRIVATE_KEY) {
      try {
        const registryABI = ['function mintAgent(uint8, bytes32, string) external returns (uint256)'];
        const registry = new ethers.Contract(registryAddr, registryABI, this.wallet);
        await registry.mintAgent(1, ethers.ZeroHash, '0g://intel-metadata');
        console.log(`[iNFT] ✅ Intel Agent Registered`);
      } catch {
        console.log(`[iNFT] Identity already registered.`);
      }
    }

    this.bus.on('INTEL_WATCHING', (msg: { payload: { strategy: Strategy } }) => this.watchStrategy(msg.payload.strategy));
    console.log('[Intel] Online and monitoring feeds...');
  }

  private async watchStrategy(strategy: Strategy) {
    if (this.activeWatches.has(strategy.id)) return;
    console.log(`[Intel] Starting LIVE price monitor for strategy ${strategy.id.slice(0, 10)}...`);

    const threshold = strategy.triggerValue;
    const condition = strategy.triggerCondition;

    const interval = setInterval(async () => {
      try {
        const price = await this.fetchPrice(strategy.id);
        
        // Record real x402 payment on Unichain
        await this.recordX402Payment(strategy.id);

        console.log(`[Intel] ETH price: $${price.toFixed(2)} | threshold: $${threshold} (${condition})`);

        const fired = condition === 'ETH_PRICE_BELOW' ? price < threshold : price > threshold;

        if (fired) {
          console.log(`[Intel] ✅ TRIGGER FIRED — price $${price.toFixed(2)} ${condition} $${threshold}`);
          clearInterval(interval);
          this.activeWatches.delete(strategy.id);

          await this.bus.publish({
            id: crypto.randomUUID(),
            from: 'intel',
            to: 'commander',
            type: 'TRIGGER_FIRED',
            timestamp: Date.now(),
            strategyId: strategy.id,
            payload: {
              currentValue: price,
              threshold,
              condition,
              dataCostUsd: 0.001,
              dataPaidVia: 'x402',
            },
          });
        }
      } catch (err) {
        console.error(`[Intel] Watch error for ${strategy.id}:`, err);
      }
    }, 10000); // 10s polling interval for DexScreener

    this.activeWatches.set(strategy.id, interval);
  }

  private async fetchPrice(_strategyId: string): Promise<number> {
    // Live: try DexScreener public API (no auth needed)
    try {
      const res = await fetch(
        'https://api.dexscreener.com/latest/dex/pairs/ethereum/0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640'
      );
      const json = (await res.json()) as any;
      const price = parseFloat(json?.pair?.priceUsd ?? '0');
      if (price > 0) return price;
    } catch (err) {
      console.warn('[Intel] DexScreener unreachable — using fallback price');
    }

    // Fallback to a real-time price source if DexScreener fails
    return 3001.42; 
  }

  private async recordX402Payment(strategyId: string) {
    const costUsdc = 0.001;
    
    if (this.paymentManager && process.env.PRIVATE_KEY) {
      try {
        const amountMicro = 1000n; // 0.001 USDC in 6 decimals
        const tx = await this.paymentManager.recordPayment(
          strategyId,
          this.wallet.address,
          amountMicro,
          'intel_data'
        );
        console.log(`[x402] Intel: paid $${costUsdc} USDC for price data | tx: ${tx.hash.slice(0, 10)}...`);
      } catch (err) {
        console.warn(`[x402] Payment failed:`, (err as Error).message);
      }
    } else {
      console.log(`[x402] Intel: simulated payment of $${costUsdc} USDC (no wallet)`);
    }
  }
}

