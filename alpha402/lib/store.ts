import { create } from 'zustand';
import { A2AMessage, AgentState, Strategy, x402Payment } from './types';

// Module-level ws ref so any action can use the live socket
let _ws: WebSocket | null = null;

interface AlphaStoreState {
  messages: A2AMessage[];
  strategies: Strategy[];
  payments: x402Payment[];
  agentStates: Record<string, AgentState>;
  activeBeams: { id: string; sender: string; receiver: string }[];
  isConnected: boolean;

  addMessage: (msg: A2AMessage) => void;
  addPayment: (payment: x402Payment) => void;
  updateAgentStatus: (id: string, status: 'IDLE' | 'THINKING' | 'ACTIVE') => void;
  addBeam: (sender: string, receiver: string) => void;
  removeBeam: (id: string) => void;
  setConnected: (connected: boolean) => void;
  connect: () => void;
  sendCommand: (payload: object) => boolean;
}

export const useAlphaStore = create<AlphaStoreState>((set, get) => ({
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
  agentStates: {
    commander: { status: 'IDLE' },
    intel: { status: 'IDLE' },
    risk: { status: 'IDLE' },
    execution: { status: 'IDLE' },
    COMMANDER: { status: 'IDLE' },
    INTEL: { status: 'IDLE' },
    RISK: { status: 'IDLE' },
    EXECUTION: { status: 'IDLE' },
  },
  activeBeams: [],
  isConnected: false,

  addMessage: (msg) => set((state) => ({ 
    messages: [msg, ...state.messages].slice(0, 200) 
  })),

  addPayment: (payment) => set((state) => ({ 
    payments: [payment, ...state.payments] 
  })),

  updateAgentStatus: (id, status) => set((state) => ({
    agentStates: { 
      ...state.agentStates, 
      [id]: { ...state.agentStates[id], status, lastActive: Date.now() },
      [id.toLowerCase()]: { ...state.agentStates[id.toLowerCase()], status, lastActive: Date.now() },
      [id.toUpperCase()]: { ...state.agentStates[id.toUpperCase()], status, lastActive: Date.now() }
    }
  })),

  addBeam: (sender, receiver) => {
    const id = Math.random().toString(36).substring(7);
    set(state => ({
      activeBeams: [...state.activeBeams, { id, sender, receiver }]
    }));
    setTimeout(() => get().removeBeam(id), 4000);
  },

  removeBeam: (id) => set(state => ({
    activeBeams: state.activeBeams.filter(b => b.id !== id)
  })),

  setConnected: (connected) => set({ isConnected: connected }),

  connect: () => {
    if (typeof window === 'undefined') return;
    // Don't open a second socket if one is already open
    if (_ws && (_ws.readyState === WebSocket.OPEN || _ws.readyState === WebSocket.CONNECTING)) return;

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
    const ws = new WebSocket(wsUrl);
    _ws = ws;

    ws.onopen = () => {
      console.log('[Alpha402] WS connected ✅');
      set({ isConnected: true });
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        console.log('[Alpha402 WS] raw msg:', msg.type, msg.data?.type ?? '');

        if (msg.type === 'A2A_MESSAGE' && msg.data) {
          const raw = msg.data;
          // Backend uses: from, to, type, timestamp, strategyId, payload
          const sender   = (raw.from   || 'commander').toLowerCase();
          const receiver = (raw.to     || 'user').toLowerCase();
          const transformed: A2AMessage = {
            id:        raw.id || Math.random().toString(),
            sender,
            receiver,
            type:      raw.type || 'UNKNOWN',
            content:   raw.content || raw.type || '',
            timestamp: raw.timestamp || Date.now(),
            payload:   raw.payload,
          };
          if (get().messages.some(m => m.id === transformed.id)) return;
          console.log('[Alpha402 WS] addMessage:', transformed.type, 'from', sender, 'payload:', raw.payload);
          get().addMessage(transformed);
          get().updateAgentStatus(sender, 'ACTIVE');
          get().addBeam(sender, receiver);
          
          if (raw.type === 'STRATEGY_PARSED' && raw.payload?.strategy) {
            const s = raw.payload.strategy;
            set(state => {
              // Check if strategy already exists
              if (state.strategies.some(st => st.id === s.id)) return state;
              
              const newStrategy: Strategy = {
                id: s.id || Math.random().toString(),
                input: s.naturalLanguageInput || raw.payload?.input || 'Strategy',
                status: 'ACTIVE',
                params: {
                  token: s.token || 'ETH',
                  trigger: `${s.triggerCondition?.includes('BELOW') ? '<' : '>'} $${s.triggerValue}`,
                  maxPosition: `${(Number(s.maxPositionWei) / 1e18).toFixed(2)} ${s.token || 'ETH'}`,
                  stopLoss: `${(s.stopLossPercent / 100).toFixed(0)}%`,
                  maxGas: `${s.maxGasGwei} gwei`
                },
                pnl: '+$0.00',
                lastTriggered: 'Just now'
              };
              return { strategies: [newStrategy, ...state.strategies] };
            });
          }

          setTimeout(() => get().updateAgentStatus(sender, 'IDLE'), 5000);
        }

        if (msg.type === 'HISTORY' && Array.isArray(msg.data)) {
          console.log('[Alpha402 WS] HISTORY:', msg.data.length, 'messages');
          const transformed: A2AMessage[] = msg.data.map((raw: Record<string, unknown>) => ({
            id:        String(raw.id || Math.random().toString()),
            sender:    String(raw.from || 'commander').toLowerCase(),
            receiver:  String(raw.to   || 'user').toLowerCase(),
            type:      String(raw.type || 'UNKNOWN'),
            content:   String(raw.content || raw.type || ''),
            timestamp: (typeof raw.timestamp === 'number' || typeof raw.timestamp === 'string') ? raw.timestamp : Date.now(),
            payload:   raw.payload as Record<string, unknown> | undefined,
          }));
          // Add all history messages (newest last → store prepends, so reverse first)
          transformed.forEach(m => get().addMessage(m));
        }

        if (msg.type === 'X402_PAYMENT') {
          get().addPayment(msg.payload || msg.data);
        }

        if (msg.type === 'AGENT_STATUS') {
          get().updateAgentStatus(msg.role, msg.status);
        }

        if (msg.type === 'PONG') {
          console.log('[Alpha402] WS heartbeat OK');
        }
      } catch (err) {
        console.error('Failed to parse WS message', err);
      }
    };

    ws.onclose = () => {
      console.log('[Alpha402] WS disconnected — retrying in 3s');
      _ws = null;
      set({ isConnected: false });
      setTimeout(() => get().connect(), 3000);
    };

    ws.onerror = () => {
      console.warn('[Alpha402] WS connection failed — backend may still be starting');
    };
  },

  sendCommand: (payload: object): boolean => {
    if (!_ws || _ws.readyState !== WebSocket.OPEN) {
      console.warn('[Alpha402] WS not open — cannot send command');
      return false;
    }
    _ws.send(JSON.stringify(payload));
    return true;
  },
}));

export const useTradeDesk = useAlphaStore;
export const useTradeDeskStore = useAlphaStore;
