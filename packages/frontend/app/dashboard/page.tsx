'use client'
import { useState } from 'react'
import { useTradeDeskStore } from '@/lib/store'
import WalletGate from '@/components/auth/WalletGate'
import TradingFloor from '@/components/scene/TradingFloor'
import AgentActivityFeed from '@/components/agent-log/AgentActivityFeed'
import X402PaymentFeed from '@/components/payments/x402PaymentFeed'
import ConnectionStatus from '@/components/ui/ConnectionStatus'
import Link from 'next/link'

type Tab = 'log' | 'payments'

export default function DashboardPage() {
  const [tab, setTab] = useState<Tab>('log')
  const strategies = useTradeDeskStore(state => state.strategies)
  const agentStates = useTradeDeskStore(state => state.agentStates)
  const messages = useTradeDeskStore(state => state.messages)

  return (
    <WalletGate>
      <div className="h-screen bg-bg-primary flex flex-col overflow-hidden">
        {/* Top nav */}
        <nav className="flex items-center justify-between px-4 py-2 border-b border-blue-muted bg-bg-secondary shrink-0">
          <div className="flex items-center gap-4">
            <Link href="/" className="font-mono text-sm font-bold text-ink-primary tracking-widest">TRADEDESK</Link>
            <span className="text-ink-tertiary">|</span>
            <Link href="/agents" className="font-mono text-xs text-ink-secondary hover:text-ink-primary">Agents</Link>
            <Link href="/strategies" className="font-mono text-xs text-ink-secondary hover:text-ink-primary">Strategies</Link>
          </div>
          <ConnectionStatus />
        </nav>

        {/* Main 3-col layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* LEFT: Strategy sidebar */}
          <aside className="w-64 border-r border-blue-muted flex flex-col overflow-hidden bg-bg-secondary shrink-0">
            <div className="px-3 py-2 border-b border-blue-muted flex items-center justify-between">
              <span className="font-mono text-xs text-ink-mono">STRATEGIES</span>
              <span className="font-mono text-xs bg-blue-dim text-blue-bright px-1.5 py-0.5 rounded">
                {strategies.length}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {strategies.length === 0 ? (
                <div className="text-center py-6 font-mono text-xs text-ink-tertiary">
                  No strategies yet.<br />
                  <a href="https://t.me/your_bot" className="text-blue-bright hover:underline">
                    Open Telegram bot →
                  </a>
                </div>
              ) : strategies.map(s => (
                <div key={s.id} className="mb-2 p-2 bg-bg-primary rounded border border-blue-dim hover:border-blue-muted cursor-pointer">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span style={{ width:6, height:6, borderRadius:'50%', background: s.active ? '#10B981' : '#4B5563', display:'inline-block' }} />
                    <span className="font-mono text-xs text-ink-tertiary truncate">{s.id.slice(0,8)}...</span>
                  </div>
                  <p className="font-mono text-xs text-ink-secondary truncate">"{s.naturalLanguageInput}"</p>
                  {s.pnlPercent !== undefined && (
                    <span className={`font-mono text-xs ${s.pnlPercent >= 0 ? 'text-status-success' : 'text-status-danger'}`}>
                      {s.pnlPercent >= 0 ? '+' : ''}{s.pnlPercent.toFixed(2)}%
                    </span>
                  )}
                </div>
              ))}
            </div>
            <div className="p-2 border-t border-blue-muted">
              <a href="https://t.me/your_bot" target="_blank"
                className="block w-full font-mono text-xs text-center py-2 border border-blue-base text-ink-primary rounded hover:bg-blue-dim transition-colors">
                + New Strategy
              </a>
            </div>
          </aside>

          {/* CENTER */}
          <main className="flex-1 flex flex-col overflow-hidden">
            {/* 3D scene top */}
            <div className="h-48 border-b border-blue-muted shrink-0">
              <TradingFloor className="w-full h-full" compact={true} autoRotate={false} />
            </div>

            {/* Tabs + feeds bottom */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex gap-0 border-b border-blue-muted bg-bg-secondary shrink-0">
                {(['log', 'payments'] as Tab[]).map(t => (
                  <button key={t} onClick={() => setTab(t)}
                    className={`font-mono text-xs px-4 py-2 border-r border-blue-muted transition-colors ${
                      tab === t ? 'bg-blue-dim text-ink-primary' : 'text-ink-tertiary hover:text-ink-secondary'
                    }`}>
                    {t === 'log' ? 'Agent Log' : 'x402 Payments'}
                  </button>
                ))}
                <div className="flex-1" />
                <span className="font-mono text-xs text-ink-tertiary px-3 py-2">
                  {messages.length} events
                </span>
              </div>
              <div className="flex-1 overflow-hidden">
                {tab === 'log' ? <AgentActivityFeed /> : <X402PaymentFeed />}
              </div>
            </div>
          </main>

          {/* RIGHT: Agent status panel */}
          <aside className="w-72 border-l border-blue-muted flex flex-col bg-bg-secondary shrink-0 overflow-y-auto">
            <div className="px-3 py-2 border-b border-blue-muted">
              <span className="font-mono text-xs text-ink-mono">AGENT STATUS</span>
            </div>
            {Object.values(agentStates).map(agent => (
              <div key={agent.id} className="border-b border-blue-dim p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span style={{
                    width: 7, height: 7, borderRadius: '50%', display: 'inline-block',
                    background: agent.status === 'ACTIVE' ? '#10B981' : agent.status === 'THINKING' ? '#6366F1' : '#4B5563',
                    boxShadow: agent.status !== 'IDLE' ? '0 0 6px currentColor' : 'none',
                  }} />
                  <span className="font-mono text-xs font-bold text-ink-primary uppercase">{agent.id}</span>
                  <span className="font-mono text-xs text-ink-tertiary ml-auto">{agent.status}</span>
                </div>
                <p className="font-mono text-xs text-ink-secondary truncate mb-2">{agent.lastAction}</p>
                <div className="grid grid-cols-2 gap-1">
                  <div className="bg-bg-primary rounded p-1.5">
                    <div className="font-mono text-xs text-ink-tertiary">Messages</div>
                    <div className="font-mono text-sm text-ink-primary">{agent.messagesThisSession}</div>
                  </div>
                  <div className="bg-bg-primary rounded p-1.5">
                    <div className="font-mono text-xs text-ink-tertiary">x402 spent</div>
                    <div className="font-mono text-sm text-neon-cyan">${agent.x402SpentThisSession.toFixed(4)}</div>
                  </div>
                </div>
                <div className="mt-1 font-mono text-xs text-ink-tertiary truncate">
                  {agent.ensName}
                </div>
              </div>
            ))}
          </aside>
        </div>
      </div>
    </WalletGate>
  )
}
