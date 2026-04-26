"use client";

import React, { useState } from 'react';
import { WalletGate } from '@/components/auth/WalletGate';
import dynamic from 'next/dynamic';
const TradingFloor = dynamic(() => import('@/components/scene/TradingFloor').then(mod => mod.TradingFloor), { ssr: false });
import { AgentActivityFeed } from '@/components/agent-log/AgentActivityFeed';
import { X402PaymentFeed } from '@/components/payments/x402PaymentFeed';
import { PriceChart } from '@/components/charts/PriceChart';
import { useAlphaStore } from '@/lib/store';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Activity, 
  TrendingUp, 
  History, 
  ShieldCheck,
  Plus,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const { strategies, isConnected } = useAlphaStore();
  const [activeTab, setActiveTab] = useState<'LOG' | 'PAYMENTS' | 'CHART'>('LOG');

  return (
    <WalletGate>
      <div className="flex h-screen bg-background-primary overflow-hidden">
        {/* LEFT SIDEBAR (280px) */}
        <aside className="w-[280px] border-r border-background-tertiary flex flex-col bg-background-secondary/30">
          <div className="p-6 border-b border-background-tertiary flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-base rounded flex items-center justify-center font-bold text-white italic">A</div>
              <h1 className="font-bold text-sm tracking-tight uppercase">Alpha402</h1>
            </div>
            <div className={cn(
              "w-2 h-2 rounded-full",
              isConnected ? "bg-status-success" : "bg-status-danger"
            )} />
          </div>

          <div className="p-6 flex-1 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary">Active Strategies</h2>
              <span className="px-1.5 py-0.5 bg-blue-dim text-blue-base text-[10px] font-bold rounded border border-blue-muted">
                {strategies.length}
              </span>
            </div>

            <div className="space-y-4">
              {strategies.map(s => (
                <div key={s.id} className="p-3 rounded border border-background-tertiary bg-background-primary/50 hover:border-blue-base/30 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-status-success animate-pulse" />
                    <span className="text-[10px] font-mono text-text-tertiary truncate">{s.lastTriggered}</span>
                  </div>
                  <p className="text-[11px] font-mono text-text-mono line-clamp-2 italic">
                    &quot;{s.input}&quot;
                  </p>
                </div>
              ))}
            </div>

            <button className="w-full mt-6 py-3 border border-dashed border-background-tertiary hover:border-blue-base/50 transition-colors rounded text-[10px] font-bold uppercase tracking-widest text-text-tertiary flex items-center justify-center gap-2 group">
              <Plus size={14} className="group-hover:text-blue-base transition-colors" />
              New Strategy
            </button>
          </div>

          <div className="p-6 border-t border-background-tertiary bg-background-secondary/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-dim border border-blue-muted" />
              <div className="flex flex-col">
                <span className="text-xs font-bold truncate">0x71C...3E2B</span>
                <span className="text-[10px] text-text-tertiary">Unichain Testnet</span>
              </div>
            </div>
          </div>
        </aside>

        {/* CENTER PANEL (flex) */}
        <main className="flex-1 flex flex-col min-w-0 border-r border-background-tertiary">
          {/* Top Half: Miniaturized 3D Scene */}
          <div className="h-[40%] relative border-b border-background-tertiary">
            <TradingFloor miniaturized />
            <div className="absolute top-4 left-4 z-10 flex gap-2">
              <div className="px-3 py-1.5 glass-panel text-[10px] font-bold uppercase tracking-widest text-blue-base flex items-center gap-2 neon-border">
                <Activity size={12} />
                Live Floor
              </div>
            </div>
          </div>

          {/* Bottom Half: Agent Feed / Tabs */}
          <div className="flex-1 flex flex-col overflow-hidden bg-background-primary">
            <div className="flex border-b border-background-tertiary bg-background-secondary/30">
              {[
                { id: 'LOG', label: 'Agent Log', icon: <MessageSquare size={14} /> },
                { id: 'PAYMENTS', label: 'x402 Payments', icon: <History size={14} /> },
                { id: 'CHART', label: 'Price Chart', icon: <TrendingUp size={14} /> }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'LOG' | 'PAYMENTS' | 'CHART')}
                  className={cn(
                    "flex items-center gap-2 px-6 py-3 text-[10px] font-bold uppercase tracking-widest transition-all border-r border-background-tertiary",
                    activeTab === tab.id 
                      ? "text-blue-base bg-background-primary border-b border-b-blue-base" 
                      : "text-text-tertiary hover:text-text-secondary"
                  )}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-hidden">
              {activeTab === 'LOG' && <AgentActivityFeed />}
              {activeTab === 'PAYMENTS' && <X402PaymentFeed />}
              {activeTab === 'CHART' && <PriceChart />}
            </div>
          </div>
        </main>

        {/* RIGHT PANEL (320px) */}
        <aside className="w-[320px] flex flex-col bg-background-secondary/30">
          {/* Open Positions */}
          <div className="flex-1 flex flex-col border-b border-background-tertiary">
            <div className="p-4 border-b border-background-tertiary flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LayoutDashboard size={16} className="text-blue-base" />
                <h2 className="text-xs font-bold uppercase tracking-widest">Open Positions</h2>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-[11px] font-mono">
                <thead>
                  <tr className="border-b border-background-tertiary text-text-tertiary text-left uppercase">
                    <th className="px-4 py-2 font-medium">Asset</th>
                    <th className="px-4 py-2 font-medium">Size</th>
                    <th className="px-4 py-2 font-medium text-right">P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { asset: 'WETH', size: '0.50', pnl: '+$42.31', positive: true },
                    { asset: 'USDC', size: '1,200', pnl: '-$2.15', positive: false },
                  ].map((pos, i) => (
                    <tr key={i} className="border-b border-background-tertiary/50 hover:bg-background-secondary/50">
                      <td className="px-4 py-3 font-bold">{pos.asset}</td>
                      <td className="px-4 py-3 text-text-secondary">{pos.size}</td>
                      <td className={cn("px-4 py-3 text-right font-bold", pos.positive ? "text-status-success" : "text-status-danger")}>
                        {pos.pnl}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Risk Summary */}
          <div className="p-4 border-b border-background-tertiary">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary mb-4 flex items-center gap-2">
              <ShieldCheck size={12} className="text-status-warning" />
              Risk Exposure
            </h2>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-text-secondary">Current Utilization</span>
                  <span className="text-text-primary">42%</span>
                </div>
                <div className="w-full h-1 bg-background-tertiary rounded-full overflow-hidden">
                  <div className="w-[42%] h-full bg-blue-base" />
                </div>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-text-secondary">Global Stop-Loss</span>
                <span className="text-status-danger">15%</span>
              </div>
            </div>
          </div>

          {/* Recent Tx History */}
          <div className="flex-[0.6] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-background-tertiary flex items-center justify-between">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary">Recent Transactions</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center justify-between text-[11px] font-mono">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-status-success" />
                    <span className="text-text-secondary">Swap ETH → USDC</span>
                  </div>
                  <ExternalLink size={10} className="text-text-tertiary hover:text-blue-base cursor-pointer" />
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </WalletGate>
  );
}
