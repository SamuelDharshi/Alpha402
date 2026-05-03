// Inlined from shared/ — avoids file: dependency for Render deploy
import { ethers } from 'ethers';

export interface Strategy {
  id: string;
  owner: string;
  maxPositionWei: bigint;
  stopLossPercent: number;
  maxGasGwei: number;
  triggerCondition: string;
  triggerValue: number;
  active: boolean;
  naturalLanguageInput: string;
  parsedAt: number;
  direction: 'buy' | 'sell';
  token: string;
  zeroGCID?: string;
  onChainId?: string;
}

export type AgentRole = 'commander' | 'intel' | 'risk' | 'execution';

export type MessageType =
  | 'STRATEGY_PARSED'
  | 'INTEL_WATCHING'
  | 'TRIGGER_FIRED'
  | 'RISK_SCORING'
  | 'RISK_APPROVED'
  | 'RISK_REJECTED'
  | 'EXECUTION_SUBMITTED'
  | 'EXECUTION_CONFIRMED'
  | 'EXECUTION_FAILED'
  | 'EMERGENCY_STOP';

export interface A2AMessage {
  id: string;
  from: AgentRole;
  to: AgentRole | 'user';
  type: MessageType;
  timestamp: number;
  strategyId: string;
  payload: Record<string, any>;
  x402Cost?: number;
  zeroGCID?: string;
  zeroGTxn?: string;
}

export interface RiskScore {
  score: number;
  reasoning: string;
  verdict: 'APPROVE' | 'REJECT';
}

export interface ExecutionResult {
  txHash: string;
  status: 'CONFIRMED' | 'FAILED';
  gasUsed?: bigint;
}

const SEPOLIA = ethers.Network.from(11155111);

export class ENSIdentity {
  private provider: ethers.JsonRpcProvider | null = null;

  constructor(rpcUrl?: string) {
    if (rpcUrl) {
      try {
        this.provider = new ethers.JsonRpcProvider(rpcUrl, SEPOLIA, { staticNetwork: SEPOLIA });
      } catch { /* silent */ }
    }
  }

  async resolveName(name: string): Promise<string | null> {
    try { return this.provider ? await this.provider.resolveName(name) : null; } catch { return null; }
  }

  async lookupAddress(address: string): Promise<string | null> {
    try { return this.provider ? await this.provider.lookupAddress(address) : null; } catch { return null; }
  }

  /** 
   * Verifies that a given address owns the expected agent ENS name.
   * This turns ENS from a cosmetic label into a functional security layer.
   */
  async verifyAgent(agentId: string, address: string): Promise<boolean> {
    const expectedName = this.getAgentName(agentId);
    const resolvedAddress = await this.resolveName(expectedName);
    
    if (!resolvedAddress) return false;
    return resolvedAddress.toLowerCase() === address.toLowerCase();
  }

  getAgentName(agentId: string): string {
    return `${agentId.toLowerCase()}.alpha402.eth`;
  }
}
