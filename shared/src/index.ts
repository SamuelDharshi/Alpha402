export interface Strategy {
  id: string; // bytes32 hex
  owner: string;
  maxPositionWei: bigint;
  stopLossPercent: number; // bps
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
  zeroGCID?: string; // CID after persisting this message
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

export * from './ens.js';
