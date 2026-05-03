'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

// Load canvas-2D version (no Three.js — compatible with React 19)
const TradingFloorCanvas = dynamic(
  () => import('./TradingFloorCanvas'),
  { ssr: false }
);

export default function TradingFloor({ miniaturized = false }: { miniaturized?: boolean }) {
  return (
    <div className={`w-full h-full ${miniaturized ? 'min-h-0' : 'min-h-[600px] rounded-xl border border-white/5 shadow-2xl'} bg-[#080C14] overflow-hidden relative`}>
      <Suspense fallback={
        <div className="w-full h-full flex items-center justify-center text-cyan-500 font-mono text-xs animate-pulse">
          INITIALIZING ALPHA402 NEURAL LINK...
        </div>
      }>
        <TradingFloorCanvas compact={miniaturized} />
      </Suspense>

      {/* Decorative overlay */}
      <div className="absolute top-4 left-4 pointer-events-none">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
          <span className="text-[10px] font-mono text-cyan-500/70 tracking-widest uppercase">
            Alpha402 Live Environment
          </span>
        </div>
      </div>
    </div>
  );
}
