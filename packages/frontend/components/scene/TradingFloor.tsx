'use client'
import dynamic from 'next/dynamic'
import { Suspense } from 'react'

const TradingFloorCanvas = dynamic(
  () => import('./TradingFloorCanvas'),
  { ssr: false }
)

interface TradingFloorProps {
  className?: string
  autoRotate?: boolean
  compact?: boolean  // true = smaller scene for dashboard
}

export default function TradingFloor({ className, autoRotate = true, compact = false }: TradingFloorProps) {
  return (
    <div className={className} style={{ background: '#080C14' }}>
      <Suspense fallback={
        <div className="w-full h-full flex items-center justify-center">
          <span className="font-mono text-ink-mono text-sm animate-pulse">
            [ INITIALIZING TRADING FLOOR ]
          </span>
        </div>
      }>
        <TradingFloorCanvas autoRotate={autoRotate} compact={compact} />
      </Suspense>
    </div>
  )
}
