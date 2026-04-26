"use client";

import React from 'react';
import { useAlphaStore } from '@/lib/store';
import { Strategy } from '@/lib/types';
import { Play, Pause, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StrategyCardProps {
  strategy: Strategy;
}

export const StrategyCard = ({ strategy }: StrategyCardProps) => {
  const { messages } = useAlphaStore();
  const isActive = strategy.status === 'ACTIVE';
  
  // Filter last 3 messages for this strategy (simplified logic)
  const strategyMessages = messages.slice(0, 3);

  return (
    <div className="glass-panel hover:border-blue-base/30 transition-all group overflow-hidden">
      <div className="p-4 border-b border-background-tertiary">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-2 h-2 rounded-full",
              isActive ? "bg-status-success animate-pulse" : "bg-text-tertiary"
            )} />
            <span className={cn(
              "text-[10px] font-bold uppercase tracking-widest",
              isActive ? "text-status-success" : "text-text-tertiary"
            )}>
              {strategy.status}
            </span>
          </div>
          <span className={cn(
            "text-xs font-mono font-bold",
            strategy.pnl.startsWith('+') ? "text-status-success" : "text-status-danger"
          )}>
            P&L: {strategy.pnl}
          </span>
        </div>
        
        <p className="text-sm font-mono text-text-mono mb-4 italic leading-relaxed">
          &quot;{strategy.input}&quot;
        </p>

        <div className="grid grid-cols-2 gap-y-2 text-[11px]">
          <div className="flex flex-col">
            <span className="text-text-tertiary uppercase text-[9px]">Token</span>
            <span className="text-text-primary">{strategy.params.token}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-text-tertiary uppercase text-[9px]">Trigger</span>
            <span className="text-text-primary">{strategy.params.trigger}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-text-tertiary uppercase text-[9px]">Max Position</span>
            <span className="text-text-primary">{strategy.params.maxPosition}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-text-tertiary uppercase text-[9px]">Stop Loss</span>
            <span className="text-status-danger">{strategy.params.stopLoss}</span>
          </div>
        </div>
      </div>

      <div className="p-3 bg-background-secondary/30">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] text-text-tertiary uppercase">Recent Activity</span>
          <span className="text-[9px] text-text-tertiary uppercase">{strategy.lastTriggered}</span>
        </div>
        <div className="space-y-1">
          {strategyMessages.map((msg, i) => (
            <div key={i} className="flex items-center gap-2 text-[10px] font-mono">
              <span className="text-blue-base w-4 opacity-50">#{i+1}</span>
              <span className="text-text-secondary truncate">{msg.type}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="p-3 border-t border-background-tertiary bg-background-secondary/50 flex gap-2">
        <button className="flex-1 py-1.5 rounded bg-blue-dim border border-blue-muted hover:bg-blue-muted transition-colors text-[10px] font-bold uppercase flex items-center justify-center gap-2">
          {isActive ? <Pause size={12} /> : <Play size={12} />}
          {isActive ? 'Pause' : 'Resume'}
        </button>
        <button className="px-3 py-1.5 rounded border border-status-danger/30 hover:bg-status-danger/10 transition-colors text-[10px] font-bold uppercase text-status-danger">
          <AlertTriangle size={12} />
        </button>
      </div>
    </div>
  );
};
