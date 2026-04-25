'use client'
import { useTradeDeskStore } from '@/lib/store'
import { AGENT_COLORS } from '@/lib/types'

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString('en-US', { hour12: false })
}

export default function X402PaymentFeed() {
  const payments = useTradeDeskStore(state => state.payments)
  const totalCost = useTradeDeskStore(state => state.totalSessionCost)

  return (
    <div className="h-full flex flex-col bg-bg-primary border border-blue-muted rounded">
      <div className="sticky top-0 bg-bg-secondary border-b border-blue-muted px-3 py-2 flex justify-between items-center">
        <span className="font-mono text-xs text-ink-mono">x402 PAYMENTS</span>
        <span className="font-mono text-xs text-neon-cyan">{payments.length} txs</span>
      </div>
      <div className="flex-1 overflow-y-auto p-1">
        {payments.length === 0 && (
          <div className="text-center py-8 font-mono text-xs text-ink-tertiary animate-pulse">
            No payments yet...
          </div>
        )}
        {payments.map(p => (
          <div key={p.id}
            className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-blue-dim transition-colors"
          >
            <span className="font-mono text-xs text-ink-tertiary shrink-0 w-16">
              {formatTime(p.timestamp)}
            </span>
            <span className="font-mono text-xs font-bold shrink-0"
              style={{ color: AGENT_COLORS[p.agent] }}>
              {p.agent.slice(0, 4).toUpperCase()}
            </span>
            <span className="font-mono text-xs text-ink-tertiary">→</span>
            <span className="font-mono text-xs text-ink-secondary flex-1 truncate">{p.service}</span>
            <span className="font-mono text-xs font-bold text-neon-green">
              ${p.amountUSDC.toFixed(4)}
            </span>
          </div>
        ))}
      </div>
      <div className="border-t border-blue-muted px-3 py-2 flex justify-between items-center bg-bg-secondary">
        <span className="font-mono text-xs text-ink-tertiary">Session total</span>
        <span className="font-mono text-sm font-bold text-neon-cyan">
          ${totalCost.toFixed(4)}
        </span>
      </div>
    </div>
  )
}
