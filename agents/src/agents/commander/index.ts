import { ethers } from 'ethers';
import crypto from 'node:crypto';
import { AgentBus } from '../../bus/index.js';
import { Strategy, A2AMessage } from '@alpha402/shared';

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
    this.bus.on('TRIGGER_FIRED', (msg) => this.handleTriggerFired(msg));
    this.bus.on('RISK_APPROVED',  (msg) => this.handleRiskApproved(msg));
    this.bus.on('RISK_REJECTED',  (msg) => this.handleRiskRejected(msg));
    this.bus.on('EXECUTION_CONFIRMED', (msg) => this.handleExecutionConfirmed(msg));
    console.log('[Commander] Online and listening...');
  }

  async parseStrategy(input: string, owner: string): Promise<Strategy> {
    console.log(`[Commander] Parsing intent: "${input}"`);

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error(
        'GROQ_API_KEY is missing. Get a free key at https://console.groq.com/ and add it to .env'
      );
    }

    // groq-sdk is API-compatible with openai — same request shape
    const { Groq } = await import('groq-sdk');
    const groq = new Groq({ apiKey });

    console.log('[Commander] Calling Groq (llama-3.1-8b-instant) ...');
    const response = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',          // free, fast, open-source weights
      messages: [
        {
          role: 'system',
          content:
            'You are a DeFi strategy parser. Extract from the user message: ' +
            'token (string), direction ("buy"|"sell"), triggerCondition ("ETH_PRICE_BELOW"|"ETH_PRICE_ABOVE"), ' +
            'triggerValue (number), maxPositionEth (number), stopLossPercent (number), maxGasGwei (number). ' +
            'Return ONLY a strict JSON object with those exact keys. Default asset is ETH if not mentioned.',
        },
        { role: 'user', content: input },
      ],
      response_format: { type: 'json_object' },
      temperature: 0,
    });

    const parsed = JSON.parse(response.choices[0].message.content || '{}');
    console.log('[Commander] Groq parsed:', parsed);

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
    };

    console.log('[Commander] Strategy created:', {
      id: strategy.id.slice(0, 10) + '...',
      maxPositionEth: ethers.formatEther(strategy.maxPositionWei),
      stopLoss: strategy.stopLossPercent / 100 + '%',
      maxGas: strategy.maxGasGwei + ' gwei',
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
