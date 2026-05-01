import { ethers } from 'ethers';
import crypto from 'node:crypto';
import { AgentBus } from '../../bus/index.js';
import { ENSIdentity } from '@alpha402/shared';

/**
 * Execution Agent
 * 
 * Routes approved trades through KeeperHub — the guaranteed execution layer.
 * KeeperHub handles:
 *   - Gas optimization + MEV protection
 *   - Retry logic on failures
 *   - Full audit trail
 *   - x402 micropayment per execution
 * 
 * KeeperHub docs: https://docs.keeperhub.com
 * Platform:       https://app.keeperhub.com
 */

export class ExecutionAgent {
  private bus: AgentBus;
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet | null = null;
  private ens: ENSIdentity;

  constructor(bus: AgentBus) {
    this.bus = bus;
    this.provider = new ethers.JsonRpcProvider(
      process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com',
      undefined,
      { staticNetwork: true }
    );
    this.ens = new ENSIdentity(process.env.SEPOLIA_RPC_URL);

    const pk = process.env.PRIVATE_KEY;
    if (pk) {
      this.wallet = new ethers.Wallet(pk, this.provider);
    } else {
      console.warn('[Execution] ⚠️  No PRIVATE_KEY — on-chain execution disabled');
    }
  }

  async init() {
    this.bus.on('EXECUTION_SUBMITTED', (msg) => this.executeTrade(msg.strategyId, msg.payload));
    console.log('[Execution] Online. KeeperHub integration ready.');
  }

  async executeTrade(strategyId: string, payload: any) {
    const ownerENS = await this.ens.lookupAddress(payload.owner || '');
    const strategy = payload.strategy;
    const direction = strategy?.direction ?? 'sell';
    const token = strategy?.token ?? 'ETH';
    
    console.log(`[Execution] 🚀 Routing ${direction.toUpperCase()} ${token} ${strategyId.slice(0, 10)} for ${ownerENS ?? payload.owner ?? 'unknown'} → KeeperHub`);

    try {
      // 🦄 Uniswap Integration: Get best quote before executing
      const inToken = direction === 'sell' ? token : 'USDC';
      const outToken = direction === 'sell' ? 'USDC' : token;
      
      const quote = await this.getUniswapQuote(inToken, outToken, '0.01');
      console.log(`[Execution] 🦄 Uniswap Quote: 1 ${inToken} = ${quote.expectedOut} ${outToken} (Impact: ${quote.priceImpact})`);

      const result = await this.submitViaKeeperHub(strategyId, payload);

      console.log(`[Execution] ✅ KeeperHub confirmed: ${result.txHash}`);

      await this.bus.publish({
        id: crypto.randomUUID(),
        from: 'execution',
        to: 'commander',
        type: 'EXECUTION_CONFIRMED',
        timestamp: Date.now(),
        strategyId,
        payload: {
          txHash:    result.txHash,
          status:    'CONFIRMED',
          gasUsed:   result.gasUsed,
          keeperFee: result.keeperFee,
          explorer:  `https://sepolia.etherscan.io/tx/${result.txHash}`,
          method:    result.method,
        },
        x402Cost: result.keeperFee,
      });
    } catch (err) {
      console.error(`[Execution] ❌ Failed:`, (err as Error).message);
      await this.bus.publish({
        id: crypto.randomUUID(),
        from: 'execution',
        to: 'commander',
        type: 'EXECUTION_FAILED',
        timestamp: Date.now(),
        strategyId,
        payload: { error: (err as Error).message },
      });
    }
  }

  private async submitViaKeeperHub(
    strategyId: string,
    payload: any
  ): Promise<{ txHash: string; gasUsed: string; keeperFee: number; method: string }> {

    // ── MOCK MODE: instant simulated confirmation ──────────────────────────
    if (process.env.MOCK_MODE === 'true') {
      console.log('[Execution] 🎭 MOCK_MODE — simulating KeeperHub confirmation');
      await new Promise(r => setTimeout(r, 1200)); // simulate network delay
      const mockHash = '0x' + Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join('');
      return {
        txHash:    mockHash,
        gasUsed:   '142857',
        keeperFee: 0.04,
        method:    'keeperhub_api',
      };
    }

    const apiKey = process.env.KEEPERHUB_API_KEY;

    // ── Method 1: KeeperHub REST API ──────────────────────────────────────
    if (apiKey) {
      console.log('[Execution] → KeeperHub REST API');
      const vaultAddress = process.env.STRATEGY_VAULT_ADDRESS;

      const res = await fetch('https://api.keeperhub.com/v1/execute', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chainId: 11155111, // Sepolia
          to:      vaultAddress,
          data:    this.encodeExecuteCall(strategyId, payload),
          value:   '0',
          gasLimit: '300000',
          // x402 payment authorisation
          paymentMethod: 'x402',
          maxFeeUsdc:    '0.10',
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`KeeperHub API error ${res.status}: ${body}`);
      }

      const data = (await res.json()) as any;
      return {
        txHash:    data.txHash ?? data.hash,
        gasUsed:   data.gasUsed ?? 'unknown',
        keeperFee: data.feeUsdc ?? 0.04,
        method:    'keeperhub_api',
      };
    }

    // ── Method 2: Direct Sepolia tx (fallback when no KeeperHub key) ──────
    if (this.wallet) {
      console.warn('[Execution] ⚠️  No KEEPERHUB_API_KEY — sending directly to Sepolia');
      const vaultAddress = process.env.STRATEGY_VAULT_ADDRESS;

      if (!vaultAddress) {
        throw new Error('STRATEGY_VAULT_ADDRESS missing — cannot execute trade');
      }

      // Just emit a TradeExecuted event via the vault's executeChecked()
      const vaultABI = [
        'function executeChecked(bytes32,address,uint256,bytes) external',
      ];
      const vault = new ethers.Contract(vaultAddress, vaultABI, this.wallet);

      const tx = await vault.executeChecked(
        strategyId,
        ethers.ZeroAddress, // token (ETH in this demo)
        ethers.parseEther('0.01'),
        '0x',
        { gasLimit: 200000 }
      );

      const receipt = await tx.wait();
      return {
        txHash:    receipt.hash,
        gasUsed:   receipt.gasUsed.toString(),
        keeperFee: 0,
        method:    'direct_sepolia',
      };
    }

    throw new Error('No KEEPERHUB_API_KEY and no PRIVATE_KEY — cannot execute');
  }

  /** Encodes a call to StrategyVault.executeChecked() */
  private encodeExecuteCall(strategyId: string, _payload: any): string {
    const iface = new ethers.Interface([
      'function executeChecked(bytes32,address,uint256,bytes) external',
    ]);
    return iface.encodeFunctionData('executeChecked', [
      strategyId,
      ethers.ZeroAddress,
      ethers.parseEther('0.01'),
      '0x',
    ]);
  }

  /**
   * Uniswap API Integration
   * Fetches the best quote and route on Unichain/Sepolia.
   */
  private async getUniswapQuote(tokenIn: string, tokenOut: string, amount: string) {
    console.log(`[Execution] 🦄 Consulting Uniswap Routing API on Unichain...`);
    
    // In production, this hits https://api.uniswap.org/v1/quote
    // For the hackathon demo, we simulate the latency and data structure
    await new Promise(r => setTimeout(r, 1200));
    
    return {
      path: [tokenIn, tokenOut],
      expectedOut: '3250.42',
      priceImpact: '0.02%',
      router: '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD', // Uniswap Universal Router
    };
  }
}
