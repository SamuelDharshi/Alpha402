'use client'
import { useTradeDeskStore } from '@/lib/store'

export default function ConnectionStatus() {
  const isConnected = useTradeDeskStore(state => state.isConnected)
  return (
    <div className="flex items-center gap-1.5">
      <span style={{
        width: 6, height: 6, borderRadius: '50%',
        background: isConnected ? '#10B981' : '#EF4444',
        boxShadow: isConnected ? '0 0 6px #10B981' : 'none',
        display: 'inline-block',
      }} />
      <span className="font-mono text-xs text-ink-tertiary">
        {isConnected ? 'AGENTS LIVE' : 'OFFLINE'}
      </span>
    </div>
  )
}
