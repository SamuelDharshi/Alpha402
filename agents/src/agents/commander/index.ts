import { ethers } from 'ethers';
import crypto from 'node:crypto';
import { AgentBus } from '../../bus/index.js';
import { Strategy, A2AMessage } from '@alpha402/shared';
import { callWithBroker } from '../../ai/zeroGCompute.js';

const SYSTEM_PROMPT =
  'You are a DeFi strategy parser. Extract from the user message: ' +
  'token (string), direction ("buy"|"sell"), triggerCondition ("ETH_PRICE_BELOW"|"ETH_PRICE_ABOVE"), ' +
  'triggerValue (number), maxPositionEth (number), stopLossPercent (number), maxGasGwei (number). ' +
  'Return ONLY a strict JSON object with those exact keys. Default asset is ETH if not mentioned. ' +
  'For "drops below" use ETH_PRICE_BELOW. For "goes above" / "rises above" use ETH_PRICE_ABOVE. ' +
  'If direction not specified and condition is BELOW use "buy". If ABOVE use "sell".';

export class CommanderAgent {
  private bus: AgentBus;
  private provider: ethers.JsonRpcProvider;
  private vaultContract: ethers.Contract;

  constructor(bus: AgentBus) {
    this.bus = bus;
    this.provider = new ethers.JsonRpcProvider(
      process.env.UNICHAIN_RPC_URL || 'https://rpc-testnet.unichain.org'
    );

    const vaultABI = [
      'function createStrategy(uint256, uint256, uint256) external payable returns (bytes32)',
      'event StrategyCreated(bytes32 indexed strategyId, address owner, uint256 maxPositionWei, uint256 stopLossPercent, uint256 maxGasGwei)',
    ];
    this.vaultContract = new ethers.Contract(
      process.env.STRATEGY_VAULT_ADDRESS || ethers.ZeroAddress,
      vaultABI,
      this.provider
    );
  }

  async init() {
    this.bus.on('TRIGGER_FIRED',      (msg: A2AMessage) => this.handleTriggerFired(msg));
    this.bus.on('RISK_APPROVED',      (msg: A2AMessage) => this.handleRiskApproved(msg));
    this.bus.on('RISK_REJECTED',      (msg: A2AMessage) => this.handleRiskRejected(msg));
    this.bus.on('EXECUTION_CONFIRMED',(msg: A2AMessage) => this.handleExecutionConfirmed(msg));
    console.log('[Commander] Online and listening...');
  }

  async parseStrategy(input: string, owner: string): Promise<Strategy> {
    try {
      console.log(`[Commander] Parsing intent for ${owner}: "${input}"`);
      console.log('[Commander] Calling 0G Compute Network (decentralized AI inference)...');

      const content = await callWithBroker(
        [{ role: 'user', content: input }],
        SYSTEM_PROMPT
      );

      const parsed = JSON.parse(content || '{}');
      console.log('[Commander] 0G Compute parsed:', parsed);

      const strategy: Strategy = {
        id: ethers.hexlify(ethers.randomBytes(32)),
        owner,
        maxPositionWei: ethers.parseEther(String(parsed.maxPositionEth ?? 0.1)),
        stopLossPercent: (parsed.stopLossPercent ?? 5) * 100,
        maxGasGwei: parsed.maxGasGwei ?? 50,
        triggerCondition: parsed.triggerCondition ?? 'ETH_PRICE_BELOW',
        triggerValue: Number(parsed.triggerValue ?? 3000),
        active: true,
        naturalLanguageInput: input,
        parsedAt: Date.now(),
        direction: (parsed.direction ?? 'buy').toLowerCase() as 'buy' | 'sell',
        token: parsed.token ?? 'ETH',
      };

      console.log('[Commander] Strategy created:', {
        id: strategy.id.slice(0, 10) + '...',
        direction: strategy.direction,
        token: strategy.token,
        condition: strategy.triggerCondition,
        triggerAt: '$' + strategy.triggerValue,
        maxPositionEth: ethers.formatEther(strategy.maxPositionWei),
      });

      await this.bus.publish({
        id: crypto.randomUUID(),
        from: 'commander',
        to: 'user',
        type: 'STRATEGY_PARSED',
        timestamp: Date.now(),
        strategyId: strategy.id,
        payload: { strategy },
      });

      await this.bus.publish({
        id: crypto.randomUUID(),
        from: 'commander',
        to: 'intel',
        type: 'INTEL_WATCHING',
        timestamp: Date.now(),
        strategyId: strategy.id,
        payload: { strategy },
      });

      return strategy;
    } catch (err) {
      console.error('[Commander] Error parsing strategy:', err);
      throw err;
    }
  }

  private async handleTriggerFired(msg: A2AMessage) {
    console.log(`[Commander] Trigger fired for ${msg.strategyId.slice(0,10)}. → Risk`);
    await this.bus.publish({
      id: crypto.randomUUID(),
      from: 'commander',
      to: 'risk',
      type: 'RISK_SCORING',
      timestamp: Date.now(),
      strategyId: msg.strategyId,
      payload: msg.payload,
    });
  }

  private async handleRiskApproved(msg: A2AMessage) {
    console.log(`[Commander] Risk APPROVED for ${msg.strategyId.slice(0,10)}. → Execution`);
    await this.bus.publish({
      id: crypto.randomUUID(),
      from: 'commander',
      to: 'execution',
      type: 'EXECUTION_SUBMITTED',
      timestamp: Date.now(),
      strategyId: msg.strategyId,
      payload: msg.payload,
    });
  }

  private async handleRiskRejected(msg: A2AMessage) {
    console.log(`[Commander] Risk REJECTED for ${msg.strategyId.slice(0,10)}: ${msg.payload.reasoning}`);
  }

  private async handleExecutionConfirmed(msg: A2AMessage) {
    console.log(`[Commander] Execution CONFIRMED. Tx: ${msg.payload.txHash}`);
  }
}
