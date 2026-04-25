'use client'
import { useTradeDeskStore } from '@/lib/store'
import ConnectionStatus from '@/components/ui/ConnectionStatus'
import Link from 'next/link'

export default function StrategiesPage() {
  const strategies = useTradeDeskStore(state => state.strategies)
  const messages = useTradeDeskStore(state => state.messages)

  return (
    <div className="min-h-screen bg-bg-primary">
      <nav className="flex items-center justify-between px-6 py-3 border-b border-blue-muted bg-bg-secondary">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-mono text-sm font-bold text-ink-primary">TRADEDESK</Link>
          <span className="font-mono text-xs text-blue-bright">/ Strategies</span>
        </div>
        <ConnectionStatus />
      </nav>

      <div className="px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="font-mono text-xs text-ink-tertiary tracking-widest mb-1">DEPLOYED STRATEGIES</p>
            <span className="font-mono text-2xl font-bold text-ink-primary">{strategies.length}</span>
            <span className="font-mono text-sm text-ink-secondary ml-2">active</span>
          </div>
          <a href="https://t.me/your_bot" target="_blank"
            className="font-mono text-xs px-4 py-2 border border-blue-base text-ink-primary rounded hover:bg-blue-dim transition-colors">
            + New via Telegram
          </a>
        </div>

        {strategies.length === 0 ? (
          <div className="text-center py-24 border border-blue-dim rounded-lg bg-bg-secondary">
            <p className="font-mono text-sm text-ink-tertiary mb-2">No strategies deployed yet</p>
            <p className="font-mono text-xs text-ink-tertiary">
              Send <span className="text-ink-mono">/trade Buy ETH when it dips below $3000</span> to the Telegram bot
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {strategies.map(strategy => {
              const stratMessages = messages.filter(m => m.strategyId === strategy.id).slice(-3)
              return (
                <div key={strategy.id} className="bg-bg-secondary border border-blue-dim rounded-lg p-5 hover:border-blue-muted transition-colors">
                  {/* Status + ID */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs text-ink-tertiary">{strategy.id.slice(0, 16)}...</span>
                    <span className={`font-mono text-xs px-2 py-0.5 rounded ${
                      strategy.active ? 'bg-green-900/30 text-status-success' : 'bg-gray-900/30 text-ink-tertiary'
                    }`}>
                      {strategy.active ? 'ACTIVE' : 'PAUSED'}
                    </span>
                  </div>

                  {/* Natural language input */}
                  <div className="bg-bg-primary rounded p-3 mb-3">
                    <p className="font-mono text-xs text-ink-mono">"{strategy.naturalLanguageInput}"</p>
                  </div>

                  {/* Parsed params */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {[
                      ['Token', strategy.token],
                      ['Direction', strategy.direction?.toUpperCase()],
                      ['Max position', `${strategy.maxPositionEth} ETH`],
                      ['Stop loss', `${strategy.stopLossPercent}%`],
                      ['Trigger', `${strategy.triggerCondition} $${strategy.triggerValue}`],
                      ['Max gas', `${strategy.maxGasGwei} gwei`],
                    ].map(([label, value]) => (
                      <div key={label} className="bg-bg-primary rounded p-2">
                        <div className="font-mono text-xs text-ink-tertiary">{label}</div>
                        <div className="font-mono text-xs text-ink-primary">{value || '—'}</div>
                      </div>
                    ))}
                  </div>

                  {/* P&L */}
                  {strategy.pnlPercent !== undefined && (
                    <div className={`font-mono text-sm font-bold mb-3 ${
                      strategy.pnlPercent >= 0 ? 'text-status-success' : 'text-status-danger'
                    }`}>
                      {strategy.pnlPercent >= 0 ? '+' : ''}{strategy.pnlPercent.toFixed(2)}% P&L
                    </div>
                  )}

                  {/* Mini agent log */}
                  {stratMessages.length > 0 && (
                    <div className="bg-bg-primary rounded p-2 mb-3">
                      {stratMessages.map(m => (
                        <div key={m.id} className="font-mono text-xs text-ink-tertiary truncate">
                          {m.from.toUpperCase()} → {m.type}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 0G CID */}
                  {strategy.zeroGCID && (
                    <div className="font-mono text-xs text-ink-tertiary truncate mb-3">
                      0G: <span className="text-ink-mono">{strategy.zeroGCID.slice(0, 20)}...</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button className="font-mono text-xs px-3 py-1.5 border border-blue-muted rounded text-ink-secondary hover:text-ink-primary hover:border-blue-base transition-colors">
                      {strategy.active ? 'Pause' : 'Resume'}
                    </button>
                    <button className="font-mono text-xs px-3 py-1.5 border border-red-900/50 rounded text-status-danger hover:border-status-danger transition-colors">
                      Emergency Stop
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
