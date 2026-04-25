import { create } from 'zustand';

export type AgentRole = 'COMMANDER' | 'INTEL' | 'RISK' | 'EXECUTION';

export interface A2AMessage {
  id: string;
  sender: AgentRole;
  receiver: AgentRole;
  type: string;
  content: string;
  timestamp: string;
  payload?: Record<string, unknown>;
}

export interface x402Payment {
  id: string;
  from: string;
  to: string;
  amount: string;
  currency: string;
  timestamp: string;
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

interface TradeDeskState {
  messages: A2AMessage[];
  strategies: Strategy[];
  payments: x402Payment[];
  agentStatuses: Record<AgentRole, 'IDLE' | 'THINKING' | 'ACTIVE'>;
  isConnected: boolean;
  
  addMessage: (msg: A2AMessage) => void;
  addPayment: (payment: x402Payment) => void;
  updateAgentStatus: (role: AgentRole, status: 'IDLE' | 'THINKING' | 'ACTIVE') => void;
  setConnected: (connected: boolean) => void;
  connect: () => void;
}

export const useTradeDesk = create<TradeDeskState>((set, get) => ({
  messages: [],
  strategies: [
    {
      id: '1',
      input: "Buy 0.1 ETH if price drops below $2800, max gas 50 gwei",
      status: 'ACTIVE',
      params: {
        token: 'ETH',
        trigger: '< $2800',
        maxPosition: '0.1 ETH',
        stopLoss: '5%',
        maxGas: '50 gwei'
      },
      pnl: '+$12.50',
      lastTriggered: '2 mins ago'
    }
  ],
  payments: [],
  agentStatuses: {
    COMMANDER: 'IDLE',
    INTEL: 'IDLE',
    RISK: 'IDLE',
    EXECUTION: 'IDLE'
  },
  isConnected: false,

  addMessage: (msg) => set((state) => ({ 
    messages: [msg, ...state.messages].slice(0, 200) 
  })),

  addPayment: (payment) => set((state) => ({ 
    payments: [payment, ...state.payments] 
  })),

  updateAgentStatus: (role, status) => set((state) => ({
    agentStatuses: { ...state.agentStatuses, [role]: status }
  })),

  setConnected: (connected) => set({ isConnected: connected }),

  connect: () => {
    if (typeof window === 'undefined') return;
    
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('Connected to TradeDesk WebSocket');
      set({ isConnected: true });
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        
        if (msg.type === 'A2A_MESSAGE') {
          get().addMessage(msg.payload);
          get().updateAgentStatus(msg.payload.sender, 'ACTIVE');
          setTimeout(() => get().updateAgentStatus(msg.payload.sender, 'IDLE'), 2000);
        }
        
        if (msg.type === 'X402_PAYMENT') {
          get().addPayment(msg.payload);
        }
        
        if (msg.type === 'AGENT_STATUS') {
          get().updateAgentStatus(msg.role, msg.status);
        }
      } catch (err) {
        console.error('Failed to parse WS message', err);
      }
    };

    ws.onclose = () => {
      set({ isConnected: false });
      setTimeout(() => get().connect(), 3000);
    };
  }
}));
