import { ethers } from 'ethers';
import crypto from 'node:crypto';
import { AgentBus } from '../../bus/index.js';
import { RiskScore } from '@alpha402/shared';

export class RiskAgent {
  private bus: AgentBus;
  private provider: ethers.JsonRpcProvider;
  private vaultContract!: ethers.Contract;

  constructor(bus: AgentBus) {
    this.bus = bus;
    this.provider = new ethers.JsonRpcProvider(
      process.env.UNICHAIN_RPC_URL || 'https://rpc-testnet.unichain.org',
      undefined,
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
    this.bus.on('RISK_SCORING', (msg) => this.scoreTrade(msg.strategyId, msg.payload));
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

    // ── Groq LLM risk scoring (free tier, replaces Gensyn) ──────────
    const score = await this.runGroqInference(strategyId, triggerPayload, gasPriceGwei);

    if (score.verdict === 'APPROVE') {
      await this.approve(strategyId, score);
    } else {
      await this.reject(strategyId, score.reasoning);
    }
  }

  private async runGroqInference(
    strategyId: string,
    payload: any,
    gasPriceGwei: number
  ): Promise<RiskScore> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      // No key → conservative approve (gas already checked above)
      console.warn('[Risk] GROQ_API_KEY not set — auto-approving (gas passed)');
      return {
        score: 7,
        reasoning: 'Groq key not configured — auto-approved because hard limits passed.',
        verdict: 'APPROVE',
      };
    }

    try {
      const { Groq } = await import('groq-sdk');
      const groq = new Groq({ apiKey });

      console.log('[Risk] Calling Groq for risk inference...');

      const prompt = `You are a DeFi trade risk analyst.
Evaluate this trade and return a JSON object with exactly these keys:
- score: integer 1-10 (10 = safest)
- reasoning: one sentence
- verdict: "APPROVE" if score >= 6 else "REJECT"

Trade details:
- Current ETH price: $${payload.currentValue ?? 'unknown'}
- Trigger threshold: $${payload.threshold ?? 'unknown'}
- Gas price: ${gasPriceGwei.toFixed(1)} gwei
- Trigger condition: ${payload.condition ?? 'ETH_PRICE_BELOW'}
- x402 data cost: $${payload.dataCostUsd ?? 0.001}

Respond ONLY with the JSON object.`;

      const response = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}') as RiskScore;
      console.log(`[Risk] Groq score: ${result.score}/10 → ${result.verdict}`);
      return result;
    } catch (err) {
      console.error('[Risk] Groq inference failed:', err);
      return {
        score: 5,
        reasoning: 'Groq unavailable — defaulting to REJECT for safety',
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
