import { ethers } from 'ethers';
import crypto from 'node:crypto';
import { AgentBus } from '../../bus/index.js';
import { Strategy } from '@tradedesk/shared';

const IS_MOCK = process.env.MOCK_MODE === 'true';

export class IntelAgent {
  private bus: AgentBus;
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private paymentManager!: ethers.Contract;
  private activeWatches: Map<string, ReturnType<typeof setInterval>> = new Map();

  constructor(bus: AgentBus) {
    this.bus = bus;
    this.provider = new ethers.JsonRpcProvider(
      process.env.UNICHAIN_RPC_URL || 'https://rpc-testnet.unichain.org',
      undefined,
      { staticNetwork: true }
    );

    const pk = process.env.PRIVATE_KEY;
    this.wallet = pk
      ? new ethers.Wallet(pk, this.provider)
      : ethers.Wallet.createRandom().connect(this.provider);

    if (!pk) {
      console.warn('[Intel] ⚠️  No PRIVATE_KEY — using ephemeral wallet (on-chain payments disabled)');
    }

    const pmAddress = process.env.AGENT_PAYMENT_MANAGER_ADDRESS;
    if (pmAddress) {
      const pmABI = ['function recordPayment(bytes32, address, uint256, string) external'];
      this.paymentManager = new ethers.Contract(pmAddress, pmABI, this.wallet);
    }
  }

  async init() {
    this.bus.on('INTEL_WATCHING', (msg) => this.watchStrategy(msg.payload.strategy));
    console.log('[Intel] Online and monitoring feeds...');
  }

  private async watchStrategy(strategy: Strategy) {
    console.log(`[Intel] Starting price monitor for strategy ${strategy.id.slice(0, 10)}...`);

    // Use the dynamic threshold and condition from the AI-parsed strategy
    const threshold = strategy.triggerValue;
    const condition = strategy.triggerCondition;

    const interval = setInterval(async () => {
      try {
        const price = await this.fetchPrice(strategy.id);
        await this.simulateX402Payment(strategy.id);

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
    }, IS_MOCK ? 3000 : 10000); // faster ticks in mock mode

    this.activeWatches.set(strategy.id, interval);
  }

  private async fetchPrice(_strategyId: string): Promise<number> {
    if (IS_MOCK) {
      // Simulate price gradually falling so the trigger fires within ~3 ticks
      const mockPrices = [3050, 3010, 2988];
      const idx = Math.floor(Date.now() / 3000) % mockPrices.length;
      return mockPrices[idx];
    }

    // Live: try DexScreener public API (no auth needed)
    try {
      const res = await fetch(
        'https://api.dexscreener.com/latest/dex/pairs/ethereum/0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640'
      );
      const json = (await res.json()) as any;
      const price = parseFloat(json?.pair?.priceUsd ?? '0');
      if (price > 0) return price;
    } catch {
      console.warn('[Intel] DexScreener unreachable — using fallback price');
    }

    return 3001; // default safe fallback
  }

  private async simulateX402Payment(strategyId: string) {
    const costUsdc = 0.001;
    console.log(`[x402] Intel: paying $${costUsdc} USDC for price data (simulated)`);

    if (this.paymentManager && process.env.PRIVATE_KEY) {
      try {
        const amountMicro = 1000n; // 0.001 USDC in 6 decimals
        await this.paymentManager.recordPayment(
          strategyId,
          this.wallet.address,
          amountMicro,
          'intel_data'
        );
      } catch {
        // Expected to fail in test if contract not deployed
      }
    }
  }
}
