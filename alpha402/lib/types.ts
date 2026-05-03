export type AgentId = 'commander' | 'intel' | 'risk' | 'execution' | 'user';
export type AgentRole = 'COMMANDER' | 'INTEL' | 'RISK' | 'EXECUTION' | 'USER';

export const AGENT_POSITIONS: Record<string, [number, number, number]> = {
  commander: [0, 0, 0],
  intel: [-3, 0, 3],
  risk: [3, 0, 3],
  execution: [0, 0, -3],
  user: [0, 0, 0],
  COMMANDER: [0, 0, 0],
  INTEL: [-3, 0, 3],
  RISK: [3, 0, 3],
  EXECUTION: [0, 0, -3],
  USER: [0, 0, 0],
};

export const AGENT_COLORS: Record<string, string> = {
  commander: '#1E6FFF',
  intel: '#00F5FF',
  risk: '#F59E0B',
  execution: '#00FF88',
  user: '#FFFFFF',
  COMMANDER: '#1E6FFF',
  INTEL: '#00F5FF',
  RISK: '#F59E0B',
  EXECUTION: '#00FF88',
  USER: '#FFFFFF',
};

export interface A2AMessage {
  id: string;
  sender: string;
  receiver: string;
  type: string;
  content: string;
  timestamp: number | string;
  payload?: Record<string, unknown>;
}

export interface AgentState {
  status: 'IDLE' | 'THINKING' | 'ACTIVE';
  lastActive?: number;
}

export interface Strategy {
  id: string;
  input: string;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  params: {
    token: string;
    trigger: string;
    maxPosition: string;
    stopLoss: string;
    maxGas: string;
  };
  pnl: string;
  lastTriggered: string;
  cid?: string;
}

export interface x402Payment {
  id: string;
  from: string;
  to: string;
  amount: string;
  currency: string;
  timestamp: string;
}
