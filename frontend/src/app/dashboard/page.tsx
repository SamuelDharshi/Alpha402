"use client";

import React, { useState } from 'react';
import { WalletGate } from '@/components/auth/WalletGate';
import { AgentActivityFeed } from '@/components/agent-log/AgentActivityFeed';
import { X402PaymentFeed } from '@/components/payments/x402PaymentFeed';
import { PriceChart } from '@/components/charts/PriceChart';
import { AgentCard } from '@/components/agents/AgentCard';
import { useAlphaStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  TrendingUp,
  History,
  ShieldCheck,
  Plus,
  ExternalLink,
  Cpu,
  Wifi,
  WifiOff,
  Activity,
  Send,
  Bot,
  Zap,
  BarChart2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Agent Monitoring Panel (replaces broken 3D canvas) ───────────────────────
const AGENTS = [
  { id: 'COMMANDER' as const, label: 'Commander', role: 'Strategic Director', icon: Bot,     accent: 'text-blue-base',       dot: 'bg-blue-base',       border: 'border-blue-base/40',   glow: 'shadow-blue-500/20' },
  { id: 'INTEL'     as const, label: 'Intel',     role: 'Market Analyst',     icon: Activity, accent: 'text-neon-cyan',       dot: 'bg-neon-cyan',       border: 'border-neon-cyan/40',   glow: 'shadow-cyan-400/20' },
  { id: 'RISK'      as const, label: 'Risk',      role: 'Security Auditor',   icon: ShieldCheck, accent: 'text-status-warning', dot: 'bg-status-warning',  border: 'border-yellow-500/40',  glow: 'shadow-yellow-400/20' },
  { id: 'EXECUTION' as const, label: 'Execution', role: 'Operations Lead',    icon: Zap,      accent: 'text-neon-green',     dot: 'bg-neon-green',      border: 'border-green-400/40',   glow: 'shadow-green-400/20' },
];

const STATUS_CONFIG = {
  IDLE:     { label: 'IDLE',     dotColor: 'bg-text-tertiary',    textColor: 'text-text-tertiary', pulse: false },
  THINKING: { label: 'THINKING', dotColor: 'bg-status-warning',   textColor: 'text-status-warning', pulse: true },
  ACTIVE:   { label: 'ACTIVE',   dotColor: 'bg-status-success',   textColor: 'text-status-success', pulse: true },
};

function AgentMonitorCard({ agent }: { agent: typeof AGENTS[0] }) {
  const agentState = useAlphaStore(s =>
    s.agentStates[agent.id] ?? s.agentStates[agent.id.toLowerCase()] ?? { status: 'IDLE' }
  );
  const messages = useAlphaStore(s => s.messages);
  const Icon = agent.icon;
  const status = (agentState.status as keyof typeof STATUS_CONFIG) ?? 'IDLE';
  const cfg = STATUS_CONFIG[status];
  const isActive = status === 'ACTIVE';
  const isThinking = status === 'THINKING';

  // Count messages from this agent
  const msgCount = messages.filter(m =>
    m.sender?.toUpperCase() === agent.id
  ).length;

  return (
    <motion.div
      layout
      className={cn(
        'relative flex flex-col gap-2 p-4 rounded-lg border bg-background-secondary/30 transition-all duration-300',
        agent.border,
        (isActive || isThinking) ? `shadow-lg ${agent.glow}` : '',
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn('p-1.5 rounded', 'bg-background-tertiary border', agent.border)}>
            <Icon size={14} className={agent.accent} />
          </div>
          <div>
            <p className={cn('text-[11px] font-bold tracking-wider', agent.accent)}>{agent.label}</p>
            <p className="text-[9px] text-text-tertiary uppercase tracking-widest">{agent.role}</p>
          </div>
        </div>

        {/* Status badge */}
        <div className="flex items-center gap-1.5">
          <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', cfg.dotColor, cfg.pulse && 'animate-pulse')} />
          <span className={cn('text-[9px] font-bold uppercase tracking-widest', cfg.textColor)}>
            {cfg.label}
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between pt-1 border-t border-background-tertiary/50">
        <span className="text-[9px] text-text-tertiary font-mono">Messages sent</span>
        <span className={cn('text-[11px] font-mono font-bold', agent.accent)}>{msgCount}</span>
      </div>

      {/* Active indicator line */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} exit={{ scaleX: 0 }}
            className={cn('absolute bottom-0 left-0 right-0 h-0.5 rounded-b-lg origin-left', agent.dot)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Strategy Input ─────────────────────────────────────────────────────────
function StrategyInput() {
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const { isConnected, sendCommand } = useAlphaStore();

  const send = () => {
    if (!input.trim() || sending) return;

    if (!isConnected) {
      setFeedback('⚠ Backend offline — is npm run dev:agents running?');
      setTimeout(() => setFeedback(null), 4000);
      return;
    }

    const ok = sendCommand({
      type: 'PARSE_STRATEGY',
      input: input.trim(),
      owner: 'dashboard_user',
    });

    if (ok) {
      setFeedback('✓ Strategy sent — Commander is parsing...');
      setInput('');
      setSending(true);
      setTimeout(() => { setSending(false); setFeedback(null); }, 3000);
    } else {
      setFeedback('✗ Failed to send — WebSocket not ready yet');
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  return (
    <div className="border-t border-background-tertiary bg-background-secondary/30">
      <div className="flex gap-2 items-center px-3 py-2.5">
        <Bot size={14} className={isConnected ? 'text-blue-base' : 'text-text-tertiary'} />
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder={isConnected
            ? 'Type a strategy… e.g. "Buy 0.1 ETH when price drops below $2800"'
            : 'Backend offline — start npm run dev:agents first'
          }
          disabled={!isConnected}
          className="flex-1 bg-transparent text-[11px] font-mono text-text-primary placeholder-text-tertiary outline-none disabled:opacity-40"
        />
        <button
          onClick={send}
          disabled={sending || !input.trim() || !isConnected}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest transition-all flex-shrink-0',
            input.trim() && !sending && isConnected
              ? 'bg-blue-base text-white hover:bg-blue-bright'
              : 'bg-background-tertiary text-text-tertiary cursor-not-allowed',
          )}
        >
          <Send size={11} />
          {sending ? 'Sent ✓' : 'Deploy'}
        </button>
      </div>
      {feedback && (
        <div className={cn(
          'px-3 pb-2 text-[10px] font-mono',
          feedback.startsWith('✓') ? 'text-status-success' : 'text-status-danger'
        )}>
          {feedback}
        </div>
      )}
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { strategies, isConnected } = useAlphaStore();
  const [activeTab, setActiveTab] = useState<'LOG' | 'PAYMENTS' | 'CHART'>('LOG');

  return (
    <WalletGate>
      <div className="flex h-screen bg-background-primary overflow-hidden">

        {/* ── LEFT SIDEBAR ──────────────────────────────────────── */}
        <aside className="w-[260px] border-r border-background-tertiary flex flex-col bg-background-secondary/20 flex-shrink-0">
          {/* Logo + connection */}
          <div className="p-4 border-b border-background-tertiary flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-blue-base rounded flex items-center justify-center font-bold text-white italic text-xs">A</div>
              <h1 className="font-bold text-xs tracking-widest uppercase">Alpha402</h1>
            </div>
            <div className="flex items-center gap-1.5">
              {isConnected
                ? <><Wifi size={12} className="text-status-success" /><span className="text-[9px] text-status-success uppercase font-bold">Live</span></>
                : <><WifiOff size={12} className="text-status-danger" /><span className="text-[9px] text-status-danger uppercase font-bold">Offline</span></>
              }
            </div>
          </div>

          {/* Agent crew */}
          <div className="p-3 border-b border-background-tertiary">
            <div className="flex items-center gap-1.5 mb-2">
              <Cpu size={10} className="text-text-tertiary" />
              <span className="text-[9px] font-bold uppercase tracking-widest text-text-tertiary">Agent Crew</span>
            </div>
            <div className="space-y-1.5">
              {AGENTS.map(a => (
                <AgentCard
                  key={a.id}
                  agentId={a.id}
                  label={a.label}
                  role={a.role}
                  accentClass={a.accent}
                  dotClass={a.dot}
                  borderClass={a.border}
                />
              ))}
            </div>
          </div>

          {/* Active strategies */}
          <div className="flex-1 overflow-y-auto p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-bold uppercase tracking-widest text-text-tertiary">Active Strategies</span>
              <span className="px-1.5 py-0.5 bg-blue-dim text-blue-base text-[9px] font-bold rounded border border-blue-muted">
                {strategies.length}
              </span>
            </div>
            <div className="space-y-2">
              {strategies.map(s => (
                <div key={s.id} className="p-2.5 rounded border border-background-tertiary bg-background-primary/50 hover:border-blue-base/30 transition-colors cursor-pointer">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-status-success animate-pulse flex-shrink-0" />
                    <span className="text-[9px] font-mono text-text-tertiary truncate">{s.lastTriggered}</span>
                  </div>
                  <p className="text-[10px] font-mono text-text-mono line-clamp-2 italic">&quot;{s.input}&quot;</p>
                </div>
              ))}
            </div>
            <button className="w-full mt-3 py-2 border border-dashed border-background-tertiary hover:border-blue-base/50 transition-colors rounded text-[9px] font-bold uppercase tracking-widest text-text-tertiary flex items-center justify-center gap-2">
              <Plus size={11} />
              New Strategy
            </button>
          </div>

          {/* Wallet footer */}
          <div className="p-3 border-t border-background-tertiary">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-dim border border-blue-muted flex-shrink-0" />
              <div>
                <p className="text-[10px] font-bold truncate">0x71C…3E2B</p>
                <p className="text-[9px] text-text-tertiary">Unichain Testnet</p>
              </div>
            </div>
          </div>
        </aside>

        {/* ── CENTER PANEL ──────────────────────────────────────── */}
        <main className="flex-1 flex flex-col min-w-0 border-r border-background-tertiary overflow-hidden">

          {/* Agent Monitor Grid (replaces broken 3D canvas) */}
          <div className="border-b border-background-tertiary bg-background-secondary/10">
            <div className="flex items-center justify-between px-4 py-2 border-b border-background-tertiary/50">
              <div className="flex items-center gap-2">
                <BarChart2 size={14} className="text-blue-base" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Mission Control — Live Agent Grid</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn('w-1.5 h-1.5 rounded-full', isConnected ? 'bg-status-success animate-pulse' : 'bg-status-danger')} />
                <span className="text-[9px] text-text-tertiary uppercase font-mono">
                  {isConnected ? 'WS Connected → ws://localhost:3001' : 'WS Disconnected'}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3 p-4">
              {AGENTS.map(agent => (
                <AgentMonitorCard key={agent.id} agent={agent} />
              ))}
            </div>
          </div>

          {/* Strategy input bar */}
          <StrategyInput />

          {/* Tabs */}
          <div className="flex border-b border-background-tertiary bg-background-secondary/20 flex-shrink-0">
            {[
              { id: 'LOG',      label: 'Agent Log',    icon: <MessageSquare size={13} /> },
              { id: 'PAYMENTS', label: 'x402 Payments', icon: <History size={13} /> },
              { id: 'CHART',    label: 'Price Chart',   icon: <TrendingUp size={13} /> },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'LOG' | 'PAYMENTS' | 'CHART')}
                className={cn(
                  'flex items-center gap-2 px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-all border-r border-background-tertiary',
                  activeTab === tab.id
                    ? 'text-blue-base bg-background-primary border-b-2 border-b-blue-base'
                    : 'text-text-tertiary hover:text-text-secondary',
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'LOG'      && <AgentActivityFeed />}
            {activeTab === 'PAYMENTS' && <X402PaymentFeed />}
            {activeTab === 'CHART'    && <PriceChart />}
          </div>
        </main>

        {/* ── RIGHT PANEL ───────────────────────────────────────── */}
        <aside className="w-[300px] flex flex-col bg-background-secondary/20 flex-shrink-0">
          {/* Open Positions */}
          <div className="flex-1 flex flex-col border-b border-background-tertiary overflow-hidden">
            <div className="p-3 border-b border-background-tertiary flex items-center gap-2">
              <TrendingUp size={14} className="text-blue-base" />
              <h2 className="text-[10px] font-bold uppercase tracking-widest">Open Positions</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-[11px] font-mono">
                <thead>
                  <tr className="border-b border-background-tertiary text-text-tertiary text-left uppercase">
                    <th className="px-3 py-2 font-medium text-[9px]">Asset</th>
                    <th className="px-3 py-2 font-medium text-[9px]">Size</th>
                    <th className="px-3 py-2 font-medium text-right text-[9px]">P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { asset: 'WETH', size: '0.50', pnl: '+$42.31', positive: true },
                    { asset: 'USDC', size: '1,200', pnl: '-$2.15', positive: false },
                  ].map((pos, i) => (
                    <tr key={i} className="border-b border-background-tertiary/50 hover:bg-background-secondary/50">
                      <td className="px-3 py-2.5 font-bold">{pos.asset}</td>
                      <td className="px-3 py-2.5 text-text-secondary">{pos.size}</td>
                      <td className={cn('px-3 py-2.5 text-right font-bold', pos.positive ? 'text-status-success' : 'text-status-danger')}>
                        {pos.pnl}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Risk Summary */}
          <div className="p-3 border-b border-background-tertiary">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck size={12} className="text-status-warning" />
              <h2 className="text-[9px] font-bold uppercase tracking-widest text-text-tertiary">Risk Exposure</h2>
            </div>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-[9px] mb-1">
                  <span className="text-text-secondary">Current Utilization</span>
                  <span className="text-text-primary font-mono">42%</span>
                </div>
                <div className="w-full h-1 bg-background-tertiary rounded-full overflow-hidden">
                  <div className="w-[42%] h-full bg-blue-base" />
                </div>
              </div>
              <div className="flex justify-between text-[9px]">
                <span className="text-text-secondary">Global Stop-Loss</span>
                <span className="text-status-danger font-mono font-bold">15%</span>
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-3 border-b border-background-tertiary">
              <h2 className="text-[9px] font-bold uppercase tracking-widest text-text-tertiary">Recent Transactions</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {[
                { hash: '0xf3a1…b9c2', label: 'Swap ETH → USDC', status: 'confirmed' },
                { hash: '0xa7d2…4e1f', label: 'Swap ETH → USDC', status: 'confirmed' },
                { hash: '0xc8b3…7a90', label: 'Swap ETH → USDC', status: 'confirmed' },
              ].map((tx, i) => (
                <div key={i} className="flex items-center justify-between text-[10px] font-mono p-2 rounded bg-background-tertiary/30 hover:bg-background-secondary/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-status-success flex-shrink-0" />
                    <span className="text-text-secondary">{tx.label}</span>
                  </div>
                  <a href={`https://uniscan.org/tx/${tx.hash}`} target="_blank" rel="noreferrer">
                    <ExternalLink size={10} className="text-text-tertiary hover:text-blue-base cursor-pointer" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </WalletGate>
  );
}
