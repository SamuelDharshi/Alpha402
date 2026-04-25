'use client'
import { create } from 'zustand'
import type { A2AMessage, Strategy, PaymentEvent, AgentState, AgentId, WSMessage } from './types'
import { AGENT_COLORS } from './types'

export interface MessageBeam {
  id: string
  from: AgentId
  to: AgentId
  color: string
  startTime: number
  duration: number
}

interface TradeDeskStore {
  // State
  messages: A2AMessage[]
  strategies: Strategy[]
  payments: PaymentEvent[]
  agentStates: Record<AgentId, AgentState>
  activeBeams: MessageBeam[]
  isConnected: boolean
  totalSessionCost: number

  // Actions
  connect: () => void
  disconnect: () => void
  addBeam: (beam: MessageBeam) => void
  removeBeam: (id: string) => void
  clearMessages: () => void
}

const defaultAgentState = (id: AgentId): AgentState => ({
  id,
  status: 'IDLE',
  lastAction: 'Waiting...',
  lastMessageAt: 0,
  messagesThisSession: 0,
  x402SpentThisSession: 0,
  zeroCIDsLogged: 0,
  ensName: `${id}.tradedesk.eth`,
})

export const useTradeDeskStore = create<TradeDeskStore>((set, get) => ({
  messages: [],
  strategies: [],
  payments: [],
  agentStates: {
    commander: defaultAgentState('commander'),
    intel: defaultAgentState('intel'),
    risk: defaultAgentState('risk'),
    execution: defaultAgentState('execution'),
  },
  activeBeams: [],
  isConnected: false,
  totalSessionCost: 0,

  connect: () => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001'

    try {
      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        set({ isConnected: true })
        console.log('[WS] Connected to TradeDesk agent system')
      }

      ws.onmessage = (event) => {
        try {
          const msg: WSMessage = JSON.parse(event.data)

          if (msg.type === 'A2A_MESSAGE') {
            const a2a = msg.data as A2AMessage
            set(state => ({
              messages: [...state.messages.slice(-199), a2a],
            }))

            // Create a beam if both from/to are valid agents
            const validAgents: AgentId[] = ['commander', 'intel', 'risk', 'execution']
            if (validAgents.includes(a2a.from) && validAgents.includes(a2a.to as AgentId)) {
              const beam: MessageBeam = {
                id: `${a2a.id}-beam`,
                from: a2a.from,
                to: a2a.to as AgentId,
                color: AGENT_COLORS[a2a.from],
                startTime: Date.now(),
                duration: 1500,
              }
              get().addBeam(beam)
              setTimeout(() => get().removeBeam(beam.id), beam.duration)
            }

            // Update agent state
            set(state => ({
              agentStates: {
                ...state.agentStates,
                [a2a.from]: {
                  ...state.agentStates[a2a.from],
                  status: 'ACTIVE',
                  lastAction: a2a.type,
                  lastMessageAt: a2a.timestamp,
                  messagesThisSession: state.agentStates[a2a.from].messagesThisSession + 1,
                  zeroCIDsLogged: a2a.zeroGCID
                    ? state.agentStates[a2a.from].zeroCIDsLogged + 1
                    : state.agentStates[a2a.from].zeroCIDsLogged,
                },
              },
            }))
          }

          if (msg.type === 'X402_PAYMENT') {
            const payment = msg.data as PaymentEvent
            set(state => ({
              payments: [...state.payments.slice(-99), payment],
              totalSessionCost: state.totalSessionCost + payment.amountUSDC,
              agentStates: {
                ...state.agentStates,
                [payment.agent]: {
                  ...state.agentStates[payment.agent],
                  x402SpentThisSession:
                    state.agentStates[payment.agent].x402SpentThisSession + payment.amountUSDC,
                },
              },
            }))
          }

          if (msg.type === 'AGENT_STATUS') {
            const status = msg.data as AgentState
            set(state => ({
              agentStates: {
                ...state.agentStates,
                [status.id]: status,
              },
            }))
          }

          if (msg.type === 'TX_CONFIRMED') {
            const data = msg.data as { strategyId: string; pnlPercent: number }
            set(state => ({
              strategies: state.strategies.map(s =>
                s.id === data.strategyId ? { ...s, pnlPercent: data.pnlPercent } : s
              ),
            }))
          }
        } catch (e) {
          console.error('[WS] Parse error:', e)
        }
      }

      ws.onclose = () => {
        set({ isConnected: false })
        console.log('[WS] Disconnected. Reconnecting in 3s...')
        setTimeout(() => get().connect(), 3000)
      }

      ws.onerror = (e) => {
        console.warn('[WS] Error (backend may be offline):', e)
        ws.close()
      }
    } catch (e) {
      console.warn('[WS] Could not connect:', e)
      setTimeout(() => get().connect(), 5000)
    }
  },

  disconnect: () => set({ isConnected: false }),

  addBeam: (beam) => set(state => ({
    activeBeams: [...state.activeBeams, beam],
  })),

  removeBeam: (id) => set(state => ({
    activeBeams: state.activeBeams.filter(b => b.id !== id),
  })),

  clearMessages: () => set({ messages: [] }),
}))
