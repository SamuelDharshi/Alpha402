"use client";

import React from 'react';
import { TradingFloor } from '@/components/scene/TradingFloor';
import { useTradeDesk, AgentRole } from '@/lib/useTradeDesk';
import { cn } from '@/lib/utils';
import { Activity, Database, CreditCard, Terminal } from 'lucide-react';

const AGENT_THEMES: Record<AgentRole, { color: string, bg: string, text: string }> = {
  COMMANDER: { color: 'border-blue-base', bg: 'bg-blue-dim/20', text: 'text-blue-base' },
  INTEL: { color: 'border-neon-cyan', bg: 'bg-neon-cyan/5', text: 'text-neon-cyan' },
  RISK: { color: 'border-status-warning', bg: 'bg-status-warning/5', text: 'text-status-warning' },
  EXECUTION: { color: 'border-neon-green', bg: 'bg-neon-green/5', text: 'text-neon-green' },
};

export default function AgentsPage() {
  const { agentStatuses, messages, payments } = useTradeDesk();

  const getAgentStats = (role: AgentRole) => {
    const agentMessages = messages.filter(m => m.sender === role || m.receiver === role);
    const agentPayments = payments.filter(p => p.from === role);
    const totalSpent = agentPayments.reduce((acc, p) => acc + parseFloat(p.amount), 0);
    
    return {
      messagesCount: agentMessages.length,
      x402Spent: `$${totalSpent.toFixed(4)}`,
      lastAction: agentMessages[0]?.type || 'IDLE',
      status: agentStatuses[role] || 'IDLE'
    };
  };

  return (
    <div className="flex flex-col min-h-screen bg-background-primary">
      {/* Top Half: Hero Scene */}
      <div className="h-[45vh] border-b border-background-tertiary relative">
        <TradingFloor />
        <div className="absolute top-8 left-8 z-10">
          <h1 className="text-3xl font-bold tracking-tighter uppercase italic text-text-primary">Mission Control</h1>
          <p className="text-[10px] font-mono text-text-tertiary uppercase tracking-[0.3em]">Operational Unit Status · Live Overview</p>
        </div>
      </div>

      {/* Bottom Half: Agent Grid */}
      <div className="flex-1 p-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-full">
          {(['COMMANDER', 'INTEL', 'RISK', 'EXECUTION'] as AgentRole[]).map((role) => {
            const stats = getAgentStats(role);
            const theme = AGENT_THEMES[role];
            
            return (
              <div key={role} className={cn("glass-panel flex flex-col border-t-2", theme.color)}>
                <div className={cn("p-4 border-b border-background-tertiary flex items-center justify-between", theme.bg)}>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary">Agent Designation</span>
                    <h3 className={cn("text-lg font-bold tracking-tight", theme.text)}>{role}</h3>
                  </div>
                  <div className={cn(
                    "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border",
                    stats.status === 'ACTIVE' ? "bg-status-success/10 border-status-success text-status-success" : "bg-background-tertiary border-background-tertiary text-text-tertiary"
                  )}>
                    {stats.status}
                  </div>
                </div>

                <div className="p-6 space-y-6 flex-1">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded bg-background-secondary border border-background-tertiary text-text-secondary">
                      <Terminal size={16} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] text-text-tertiary uppercase font-bold">Last Protocol</span>
                      <span className="text-xs font-mono text-text-primary truncate max-w-[140px]">{stats.lastAction}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded bg-background-secondary border border-background-tertiary text-text-secondary">
                      <Activity size={16} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] text-text-tertiary uppercase font-bold">A2A Traffic</span>
                      <span className="text-xs font-mono text-text-primary">{stats.messagesCount} Messages</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded bg-background-secondary border border-background-tertiary text-text-secondary">
                      <CreditCard size={16} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] text-text-tertiary uppercase font-bold">x402 Expenditure</span>
                      <span className="text-xs font-mono text-neon-yellow">{stats.x402Spent}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded bg-background-secondary border border-background-tertiary text-text-secondary">
                      <Database size={16} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] text-text-tertiary uppercase font-bold">0G Data Proofs</span>
                      <span className="text-xs font-mono text-text-mono">Verified</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-background-secondary/30 border-t border-background-tertiary">
                  <div className="h-8 flex items-end gap-1 px-2">
                    {/* Activity sparkline mock */}
                    {Array.from({ length: 20 }).map((_, i) => (
                      <div 
                        key={i} 
                        className={cn("flex-1", stats.status === 'ACTIVE' ? theme.text.replace('text-', 'bg-') : "bg-background-tertiary")}
                        style={{ height: `${Math.random() * 100}%`, opacity: 0.3 + (i / 20) * 0.7 }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
