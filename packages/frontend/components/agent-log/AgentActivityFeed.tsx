'use client'
import { useEffect, useRef } from 'react'
import { useTradeDeskStore } from '@/lib/store'
import type { A2AMessage } from '@/lib/types'
import { AGENT_COLORS } from '@/lib/types'
import { useState } from 'react'

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString('en-US', { hour12: false })
}

function getRowColor(msg: A2AMessage): string {
  if (msg.type === 'RISK_REJECTED') return 'rgba(239,68,68,0.08)'
  if (msg.type === 'EXECUTION_CONFIRMED') return 'rgba(0,255,136,0.05)'
  return 'transparent'
}

function getTextColor(agentId: string): string {
  return AGENT_COLORS[agentId as keyof typeof AGENT_COLORS] || '#8892A4'
}

export default function AgentActivityFeed() {
  const messages = useTradeDeskStore(state => state.messages)
  const bottomRef = useRef<HTMLDivElement>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  return (
    <div className="h-full overflow-y-auto bg-bg-primary border border-blue-muted rounded">
      <div className="sticky top-0 bg-bg-secondary border-b border-blue-muted px-3 py-2 flex justify-between items-center">
        <span className="font-mono text-xs text-ink-mono">AGENT LOG</span>
        <span className="font-mono text-xs text-ink-tertiary">{messages.length} events</span>
      </div>
      <div className="p-1">
        {messages.length === 0 && (
          <div className="text-center py-8 font-mono text-xs text-ink-tertiary animate-pulse">
            Waiting for agent activity...
          </div>
        )}
        {messages.map(msg => (
          <div key={msg.id}>
            <div
              className="flex items-center gap-2 px-2 py-1 rounded cursor-pointer hover:bg-blue-dim transition-colors"
              style={{ background: getRowColor(msg) }}
              onClick={() => setExpanded(expanded === msg.id ? null : msg.id)}
            >
              <span className="font-mono text-xs text-ink-tertiary shrink-0 w-16">
                {formatTime(msg.timestamp)}
              </span>
              <span className="font-mono text-xs font-bold shrink-0 w-10" style={{ color: getTextColor(msg.from) }}>
                {msg.from.slice(0, 4).toUpperCase()}
              </span>
              <span className="font-mono text-xs text-ink-tertiary shrink-0">→</span>
              <span className="font-mono text-xs shrink-0 w-10" style={{ color: getTextColor(msg.to as string) }}>
                {String(msg.to).slice(0, 4).toUpperCase()}
              </span>
              <span className="font-mono text-xs text-ink-secondary flex-1 truncate">{msg.type}</span>
              {msg.x402Cost && (
                <span className="font-mono text-xs text-neon-cyan shrink-0">
                  ▶ ${msg.x402Cost.toFixed(4)}
                </span>
              )}
              {msg.type === 'RISK_APPROVED' && <span className="text-status-success text-xs">✓</span>}
              {msg.type === 'RISK_REJECTED' && <span className="text-status-danger text-xs">✗</span>}
              {msg.type === 'EXECUTION_CONFIRMED' && <span className="text-xs">✅</span>}
            </div>
            {expanded === msg.id && (
              <div className="mx-2 mb-1 p-2 bg-bg-secondary rounded border border-blue-dim">
                <pre className="font-mono text-xs text-ink-secondary overflow-x-auto whitespace-pre-wrap break-all">
                  {JSON.stringify(msg.payload, null, 2)}
                </pre>
                {msg.zeroGCID && (
                  <div className="mt-1 font-mono text-xs text-ink-tertiary">
                    0G CID: <span className="text-ink-mono">{msg.zeroGCID}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
