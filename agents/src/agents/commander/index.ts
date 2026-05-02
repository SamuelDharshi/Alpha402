import { ethers } from 'ethers';
import crypto from 'node:crypto';
import { AgentBus } from '../../bus/index.js';
import { Strategy, A2AMessage, ENSIdentity } from '@alpha402/shared';
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
  private wallet: ethers.Wallet | ethers.HDNodeWallet;
  private vaultContract: ethers.Contract | null = null;

  constructor(bus: AgentBus) {
    this.bus = bus;

    // Vault is on Sepolia — use Sepolia provider here
    this.provider = new ethers.JsonRpcProvider(
      process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com',
      { chainId: 11155111, name: 'sepolia' },
      { staticNetwork: true }
    );

    const pk = process.env.PRIVATE_KEY?.startsWith('0x')
      ? process.env.PRIVATE_KEY
      : `0x${process.env.PRIVATE_KEY}`;
    this.wallet = pk && pk !== '0xundefined'
      ? new ethers.Wallet(pk, this.provider)
      : ethers.Wallet.createRandom().connect(this.provider);

    const vaultAddress = process.env.STRATEGY_VAULT_ADDRESS;
    if (vaultAddress) {
      // ABI matches deployed StrategyVault.sol exactly
      const vaultABI = [
        'function createStrategy(uint256 maxPositionWei, uint256 stopLossPercent, uint256 maxGasGwei) external payable returns (bytes32)',
        'function authoriseExecution(bytes32, uint256, uint256) external view returns (bool)',
        'event StrategyCreated(bytes32 indexed strategyId, address owner, uint256 maxPositionWei, uint256 stopLossPercent, uint256 maxGasGwei)',
      ];
      this.vaultContract = new ethers.Contract(vaultAddress, vaultABI, this.wallet);
    }
  }

  async init() {
    console.log('[Commander] Initializing iNFT Identity...');
    
    // 1. ENS Resolution
    const ens = new ENSIdentity(process.env.SEPOLIA_RPC_URL);
    const resolved = await ens.resolveName('commander.alpha402.eth');
    if (resolved) {
      console.log(`[ENS] ✅ Verified Identity: commander.alpha402.eth -> ${resolved}`);
    } else {
      console.warn('[ENS] ⚠️  Name commander.alpha402.eth not resolved. Please register it.');
    }

    // 2. iNFT Registration in AgentRegistry (ERC-7857 concept)
    const registryAddr = process.env.AGENT_REGISTRY_ADDRESS;
    if (registryAddr && process.env.PRIVATE_KEY) {
      try {
        const registryABI = ['function mintAgent(uint8, bytes32, string) external returns (uint256)'];
        const registry = new ethers.Contract(registryAddr, registryABI, this.wallet);
        
        // Strategy ID is 0 for the generic agent identity NFT
        const tx = await registry.mintAgent(0, ethers.ZeroHash, '0g://commander-metadata');
        console.log(`[iNFT] ✅ Agent Registered as iNFT | tx: ${tx.hash.slice(0, 12)}...`);
      } catch (err) {
        console.log(`[iNFT] Identity already registered or registry unreachable.`);
      }
    }

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

      const maxPositionWei   = ethers.parseEther(String(parsed.maxPositionEth ?? 0.01));
      const stopLossPercent  = BigInt((parsed.stopLossPercent ?? 5) * 100); // basis points
      const maxGasGwei       = BigInt(parsed.maxGasGwei ?? 50);

      // ── Register strategy on-chain in StrategyVault ──────────────────────
      // This generates the real strategyId that KeeperHub will use
      let strategyId: string;
      if (this.vaultContract) {
        try {
          console.log('[Commander] Registering strategy on StrategyVault (Sepolia)...');
          const tx = await this.vaultContract.createStrategy(
            maxPositionWei,
            stopLossPercent,
            maxGasGwei,
            { gasLimit: 200_000 }
          );
          const receipt = await tx.wait();

          // Extract strategyId from StrategyCreated event
          const TOPIC = ethers.id('StrategyCreated(bytes32,address,uint256,uint256,uint256)');
          const vaultAddr = (process.env.STRATEGY_VAULT_ADDRESS ?? '').toLowerCase();
          const log = receipt.logs.find(
            (l: any) => l.address?.toLowerCase() === vaultAddr && l.topics?.[0] === TOPIC
          );
          strategyId = log ? log.topics[1] : ethers.hexlify(ethers.randomBytes(32));
          console.log(`[Commander] ✅ Strategy registered on-chain: ${strategyId.slice(0, 18)}... (tx: ${tx.hash.slice(0, 18)}...)`);
        } catch (err: any) {
          console.warn(`[Commander] ⚠️  Vault registration failed (${err.message?.slice(0, 60)}). Using local ID.`);
          strategyId = ethers.hexlify(ethers.randomBytes(32));
        }
      } else {
        strategyId = ethers.hexlify(ethers.randomBytes(32));
        console.warn('[Commander] ⚠️  STRATEGY_VAULT_ADDRESS not set — strategy NOT registered on-chain');
      }

      const strategy: Strategy = {
        id: strategyId,
        owner,
        maxPositionWei,
        stopLossPercent: Number(stopLossPercent),
        maxGasGwei:      Number(maxGasGwei),
        triggerCondition: parsed.triggerCondition ?? 'ETH_PRICE_BELOW',
        triggerValue: Number(parsed.triggerValue ?? 3000),
        active: true,
        naturalLanguageInput: input,
        parsedAt: Date.now(),
        direction: (parsed.direction ?? 'buy').toLowerCase() as 'buy' | 'sell',
        token: parsed.token ?? 'ETH',
      };

      console.log('[Commander] Strategy ready:', {
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
