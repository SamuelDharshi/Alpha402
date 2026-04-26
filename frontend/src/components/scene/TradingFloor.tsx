'use client'
import dynamic from 'next/dynamic'
import { Suspense } from 'react'

const TradingFloorCanvas = dynamic(
  () => import('./TradingFloorCanvas'),
  { ssr: false }
)

export default function TradingFloor() {
  return (
    <div className="w-full h-full min-h-[600px] bg-[#080C14] overflow-hidden rounded-xl border border-white/5 relative shadow-2xl">
      <Suspense fallback={
        <div className="w-full h-full flex items-center justify-center text-cyan-500 font-mono text-xs animate-pulse">
          INITIALIZING ALPHA402 NEURAL LINK...
        </div>
      }>
        <TradingFloorCanvas />
      </Suspense>
      
      {/* Decorative overlays */}
      <div className="absolute top-4 left-4 pointer-events-none">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
          <span className="text-[10px] font-mono text-cyan-500/70 tracking-widest uppercase">
            Alpha402 Live Environment
          </span>
        </div>
      </div>
    </div>
  )
}
