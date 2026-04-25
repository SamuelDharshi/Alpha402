export type AgentId = 'commander' | 'intel' | 'risk' | 'execution'
export type AgentStatus = 'ACTIVE' | 'IDLE' | 'THINKING' | 'ERROR'

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
  | 'EMERGENCY_STOP'
  | 'OVERRIDE_APPLIED'

export interface A2AMessage {
  id: string
  from: AgentId
  to: AgentId | 'user'
  type: MessageType
  timestamp: number
  strategyId: string
  payload: Record<string, unknown>
  x402Cost?: number
  zeroGCID?: string
}

export interface Strategy {
  id: string
  owner: string
  naturalLanguageInput: string
  token: string
  direction: 'buy' | 'sell'
  triggerCondition: string
  triggerValue: number
  maxPositionEth: number
  stopLossPercent: number
  maxGasGwei: number
  active: boolean
  parsedAt: number
  zeroGCID?: string
  pnlPercent?: number
  ensName?: string
}

export interface PaymentEvent {
  id: string
  agent: AgentId
  service: string
  amountUSDC: number
  timestamp: number
  strategyId: string
  txHash?: string
}

export interface AgentState {
  id: AgentId
  status: AgentStatus
  lastAction: string
  lastMessageAt: number
  messagesThisSession: number
  x402SpentThisSession: number
  zeroCIDsLogged: number
  ensName: string
}

export type WSMessageType = 'A2A_MESSAGE' | 'X402_PAYMENT' | 'TX_CONFIRMED' | 'AGENT_STATUS' | 'OVERRIDE_APPLIED'

export interface WSMessage {
  type: WSMessageType
  data: A2AMessage | PaymentEvent | AgentState | Record<string, unknown>
  timestamp: number
}

export const AGENT_COLORS: Record<AgentId, string> = {
  commander: '#1E6FFF',
  intel: '#00F5FF',
  risk: '#F59E0B',
  execution: '#00FF88',
}

export const AGENT_POSITIONS: Record<AgentId, [number, number, number]> = {
  commander: [0, 0, 0],
  intel: [-3, 0, 3],
  risk: [3, 0, 3],
  execution: [0, 0, -3],
}
