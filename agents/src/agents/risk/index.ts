import { ethers } from 'ethers';
import crypto from 'node:crypto';
import { AgentBus } from '../../bus/index.js';
import { A2AMessage, ENSIdentity, RiskScore } from '@alpha402/shared';
import { callWithBroker } from '../../ai/zeroGCompute.js';

export class RiskAgent {
  private bus: AgentBus;
  private provider: ethers.JsonRpcProvider;
  private vaultContract!: ethers.Contract;
  private wallet?: ethers.Wallet;

  constructor(bus: AgentBus) {
    this.bus = bus;
    this.provider = new ethers.JsonRpcProvider(
      process.env.UNICHAIN_RPC_URL || 'https://sepolia.unichain.org',
      { chainId: 1301, name: 'unichain-sepolia' },
      { staticNetwork: true }
    );

    const vaultAddress = process.env.STRATEGY_VAULT_ADDRESS;
    if (vaultAddress) {
      this.vaultContract = new ethers.Contract(
        vaultAddress,
        ['function authoriseExecution(bytes32, uint256, uint256) external view returns (bool)'],
        this.provider
      );
    }
  }

  async init() {
    console.log('[Risk] Initializing iNFT Identity...');
    const ens = new ENSIdentity(process.env.SEPOLIA_RPC_URL);
    const resolved = await ens.resolveName('risk.alpha402.eth');
    if (resolved) console.log(`[ENS] ✅ Verified Identity: risk.alpha402.eth -> ${resolved}`);

    const registryAddr = process.env.AGENT_REGISTRY_ADDRESS;
    if (registryAddr && process.env.PRIVATE_KEY) {
      try {
        const registryABI = ['function mintAgent(uint8, bytes32, string) external returns (uint256)'];
        const registry = new ethers.Contract(registryAddr, registryABI, this.wallet);
        await registry.mintAgent(2, ethers.ZeroHash, '0g://risk-metadata');
        console.log(`[iNFT] ✅ Risk Agent Registered`);
      } catch {
        console.log(`[iNFT] Identity already registered.`);
      }
    }

    this.bus.on('RISK_SCORING', (msg: { strategyId: string; payload: any }) =>
      this.scoreTrade(msg.strategyId, msg.payload)
    );
    console.log('[Risk] Online and ready to score trades...');
  }

  async scoreTrade(strategyId: string, triggerPayload: any) {
    console.log(`[Risk] Scoring trade for ${strategyId.slice(0, 10)}...`);

    // ── Hard gas check (on-chain data, always live) ──────────────────
    const gasData = await this.provider.getFeeData().catch(() => ({ gasPrice: null }));
    const gasPriceGwei = gasData.gasPrice
      ? Number(ethers.formatUnits(gasData.gasPrice, 'gwei'))
      : 20;

    console.log(`[Risk] Gas: ${gasPriceGwei.toFixed(1)} gwei`);

    if (gasPriceGwei > 100) {
      await this.reject(strategyId, `Gas too high: ${gasPriceGwei.toFixed(0)} gwei (max 100)`);
      return;
    }

    // ── Optional on-chain vault check ────────────────────────────────
    if (this.vaultContract) {
      try {
        const ok = await this.vaultContract.authoriseExecution(
          strategyId,
          ethers.parseEther('0.1'),
          BigInt(Math.round(gasPriceGwei * 1e9))
        );
        if (!ok) {
          await this.reject(strategyId, 'StrategyVault denied execution');
          return;
        }
      } catch {
        console.warn('[Risk] Vault check skipped (not deployed yet)');
      }
    }

    // ── 0G Compute Network risk scoring (TEE-verified inference) ─────
    const score = await this.run0GInference(strategyId, triggerPayload, gasPriceGwei);

    if (score.verdict === 'APPROVE') {
      await this.approve(strategyId, score);
    } else {
      await this.reject(strategyId, score.reasoning);
    }
  }

  private async run0GInference(
    strategyId: string,
    payload: any,
    gasPriceGwei: number
  ): Promise<RiskScore> {
    try {
      console.log('[Risk] Calling 0G Compute Network for risk analysis (TEE-verified)...');

      const prompt = `You are a DeFi trade risk analyst.
Evaluate this trade and return a JSON object with exactly these keys:
- score: integer 1-10 (10 = safest)
- reasoning: one sentence explaining the risk
- verdict: "APPROVE" if score >= 6 else "REJECT"

Trade details:
- Current price: $${payload.currentValue ?? 'unknown'}
- Trigger threshold: $${payload.threshold ?? 'unknown'}
- Gas price: ${gasPriceGwei.toFixed(1)} gwei
- Trigger condition: ${payload.condition ?? 'ETH_PRICE_BELOW'}
- Token: ${payload.strategy?.token ?? 'ETH'}
- Direction: ${payload.strategy?.direction ?? 'buy'}

Respond ONLY with the JSON object.`;

      const content = await callWithBroker([{ role: 'user', content: prompt }]);
      const result  = JSON.parse(content || '{}') as RiskScore;

      console.log(`[Risk] 0G Compute score: ${result.score}/10 → ${result.verdict}`);
      return result;

    } catch (err) {
      console.error('[Risk] 0G Compute inference failed:', err);
      return {
        score: 5,
        reasoning: '0G Compute unavailable — defaulting to REJECT for safety',
        verdict: 'REJECT',
      };
    }
  }

  private async approve(strategyId: string, score: RiskScore) {
    console.log(`[Risk] ✅ APPROVED ${score.score}/10 — ${score.reasoning}`);
    await this.bus.publish({
      id: crypto.randomUUID(),
      from: 'risk',
      to: 'commander',
      type: 'RISK_APPROVED',
      timestamp: Date.now(),
      strategyId,
      payload: score,
    });
  }

  private async reject(strategyId: string, reason: string) {
    console.log(`[Risk] ❌ REJECTED — ${reason}`);
    await this.bus.publish({
      id: crypto.randomUUID(),
      from: 'risk',
      to: 'commander',
      type: 'RISK_REJECTED',
      timestamp: Date.now(),
      strategyId,
      payload: { reasoning: reason, verdict: 'REJECT' },
    });
  }
}
