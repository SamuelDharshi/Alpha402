'use client'
import TradingFloor from '@/components/scene/TradingFloor'
import { useTradeDeskStore } from '@/lib/store'
import ConnectionStatus from '@/components/ui/ConnectionStatus'
import Link from 'next/link'
import { AGENT_COLORS } from '@/lib/types'
import type { AgentId } from '@/lib/types'

export default function AgentsPage() {
  const agentStates = useTradeDeskStore(state => state.agentStates)

  return (
    <div className="min-h-screen bg-bg-primary">
      <nav className="flex items-center justify-between px-6 py-3 border-b border-blue-muted bg-bg-secondary">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-mono text-sm font-bold text-ink-primary">TRADEDESK</Link>
          <span className="font-mono text-xs text-blue-bright">/ Agents</span>
        </div>
        <ConnectionStatus />
      </nav>

      {/* 3D Scene */}
      <div className="w-full" style={{ height: '45vh' }}>
        <TradingFloor className="w-full h-full" autoRotate={true} />
      </div>

      {/* Agent grid */}
      <div className="px-6 py-8">
        <p className="font-mono text-xs text-ink-tertiary mb-6 tracking-widest">MISSION CONTROL</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {(Object.entries(agentStates) as [AgentId, typeof agentStates[AgentId]][]).map(([id, agent]) => {
            const color = AGENT_COLORS[id]
            return (
              <div key={id} className="bg-bg-secondary rounded-lg p-5 border border-blue-dim hover:border-blue-muted transition-colors"
                style={{ borderTop: `2px solid ${color}` }}>
                <div className="flex items-center gap-2 mb-3">
                  <span style={{ width:8, height:8, borderRadius:'50%', background: color, boxShadow: `0 0 8px ${color}`, display:'inline-block' }} />
                  <span className="font-mono text-sm font-bold text-ink-primary uppercase">{id}</span>
                  <span className="font-mono text-xs ml-auto px-1.5 py-0.5 rounded"
                    style={{ background: `${color}22`, color }}>
                    {agent.status}
                  </span>
                </div>
                <p className="font-mono text-xs text-ink-secondary mb-4 truncate">{agent.lastAction}</p>
                <div className="space-y-2">
                  {[
                    { label: 'Messages', value: String(agent.messagesThisSession) },
                    { label: 'x402 spent', value: `$${agent.x402SpentThisSession.toFixed(4)}` },
                    { label: '0G CIDs', value: String(agent.zeroCIDsLogged) },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between">
                      <span className="font-mono text-xs text-ink-tertiary">{label}</span>
                      <span className="font-mono text-xs text-ink-primary">{value}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-blue-dim">
                  <span className="font-mono text-xs text-ink-tertiary">{agent.ensName}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
