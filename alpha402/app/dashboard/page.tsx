"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useAlphaStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { PipelineGraph } from '@/components/dashboard/PipelineGraph';
import {
  ExternalLink, Send, Activity,
  ArrowLeft, CheckCircle2, Clock, Wifi, WifiOff,
} from 'lucide-react';
// Heroicons
import { BoltIcon, EyeIcon, ShieldCheckIcon, ArrowRightCircleIcon } from '@heroicons/react/24/solid';
// Phosphor Icons  
import { Bell, ArrowFatLineRight, ChartBar, ArrowSquareOut } from '@phosphor-icons/react';
// React Icons
import { SiEthereum } from 'react-icons/si';
import { TbAlertTriangle } from 'react-icons/tb';

// (FlowGraph replaced by PipelineGraph in separate file)
function _unused() {
  const agentStates = useAlphaStore(s => s.agentStates);
  const activeBeams  = useAlphaStore(s => s.activeBeams);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 50);
    return () => clearInterval(id);
  }, []);

  const isActive = (id: string) => {
    const s = agentStates[id.toUpperCase()]?.status ?? agentStates[id.toLowerCase()]?.status;
    return s === 'ACTIVE' || s === 'THINKING';
  };

  const isEdgeActive = (a: AgentId, b: AgentId) =>
    activeBeams.some(beam =>
      (beam.sender.toUpperCase() === a && beam.receiver.toUpperCase() === b) ||
      (beam.sender.toUpperCase() === b && beam.receiver.toUpperCase() === a)
    );

  const offset = (tick * 2) % 20;

  return (
    <svg viewBox="0 0 600 420" className="w-full h-full" style={{ overflow: 'visible' }}>
      <defs>
        {Object.entries(NODES).map(([id, n]) => (
          <radialGradient key={id} id={`glow-${id}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={n.color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={n.color} stopOpacity="0" />
          </radialGradient>
        ))}
        <filter id="blur-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="rgba(255,255,255,0.2)" />
        </marker>
      </defs>

      {/* Background pulse rings on active nodes */}
      {(Object.entries(NODES) as [AgentId, typeof NODES[AgentId]][]).map(([id, n]) =>
        isActive(id) ? (
          <circle key={`ring-${id}`} cx={n.x} cy={n.y} r={52 + (tick % 30)}
            fill="none" stroke={n.color} strokeWidth="1"
            opacity={1 - (tick % 30) / 30} />
        ) : null
      )}

      {/* Edges */}
      {EDGES.map(([a, b]) => {
        const na = NODES[a]; const nb = NODES[b];
        const active = isEdgeActive(a, b);
        return (
          <g key={`${a}-${b}`}>
            {/* Base line */}
            <line x1={na.x} y1={na.y} x2={nb.x} y2={nb.y}
              stroke="rgba(255,255,255,0.08)" strokeWidth="1.5"
              strokeDasharray="6 6"
              markerEnd="url(#arrowhead)"
            />
            {/* Active animated line */}
            {active && (
              <line x1={na.x} y1={na.y} x2={nb.x} y2={nb.y}
                stroke={na.color} strokeWidth="2"
                strokeDasharray="8 12"
                strokeDashoffset={-offset}
                opacity="0.9"
                filter="url(#blur-glow)"
              />
            )}
            {/* Traveling packet dot */}
            {active && (() => {
              const t = ((tick * 2) % 100) / 100;
              const px = na.x + (nb.x - na.x) * t;
              const py = na.y + (nb.y - na.y) * t;
              return <circle cx={px} cy={py} r="4" fill={na.color} opacity="0.9" filter="url(#blur-glow)" />;
            })()}
          </g>
        );
      })}

      {/* Nodes */}
      {(Object.entries(NODES) as [AgentId, typeof NODES[AgentId]][]).map(([id, n]) => {
        const active = isActive(id);
        return (
          <g key={id} transform={`translate(${n.x},${n.y})`}>
            {/* Glow behind */}
            {active && (
              <ellipse rx="70" ry="50" fill={`url(#glow-${id})`} />
            )}
            {/* Card background */}
            <rect x="-60" y="-32" width="120" height="64" rx="10"
              fill="#0D1220"
              stroke={active ? n.color : 'rgba(255,255,255,0.1)'}
              strokeWidth={active ? 1.5 : 1}
            />
            {/* Status dot */}
            <circle cx="-42" cy="-12" r="4"
              fill={active ? n.color : 'rgba(255,255,255,0.2)'}
              opacity={active ? 1 : 0.4}>
              {active && <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" />}
            </circle>
            {/* Label */}
            <text x="0" y="-8" textAnchor="middle" fill={active ? n.color : 'rgba(255,255,255,0.7)'}
              fontSize="10" fontFamily="JetBrains Mono, monospace" fontWeight="700" letterSpacing="2">
              {n.label}
            </text>
            {/* Sub label */}
            <text x="0" y="10" textAnchor="middle" fill="rgba(255,255,255,0.35)"
              fontSize="8" fontFamily="JetBrains Mono, monospace">
              {active ? 'processing...' : n.sub}
            </text>
            {/* Status chip */}
            <rect x="-28" y="18" width="56" height="14" rx="7"
              fill={active ? n.color + '22' : 'rgba(255,255,255,0.04)'}
              stroke={active ? n.color + '60' : 'rgba(255,255,255,0.06)'}
              strokeWidth="1"
            />
            <text x="0" y="28" textAnchor="middle"
              fill={active ? n.color : 'rgba(255,255,255,0.25)'}
              fontSize="7" fontFamily="JetBrains Mono, monospace" fontWeight="600">
              {active ? 'ACTIVE' : 'IDLE'}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Activity Feed (left) ──────────────────────────────────────────────────────
const AGENT_COLORS: Record<string, string> = {
  commander: '#1E6FFF', intel: '#00F5FF', risk: '#F59E0B', execution: '#00FF88',
};

// Icon component per message type
function MsgIcon({ type }: { type: string }) {
  const base = 'flex-shrink-0';
  switch (type) {
    case 'STRATEGY_PARSED':     return <BoltIcon      className={`${base} w-3.5 h-3.5 text-blue-400`} />;
    case 'INTEL_WATCHING':      return <EyeIcon        className={`${base} w-3.5 h-3.5 text-cyan-400`} />;
    case 'TRIGGER_FIRED':       return <Bell           className={`${base} w-3.5 h-3.5 text-yellow-400`} weight="fill" />;
    case 'RISK_APPROVED':       return <ShieldCheckIcon className={`${base} w-3.5 h-3.5 text-emerald-400`} />;
    case 'RISK_REJECTED':       return <TbAlertTriangle className={`${base} w-3.5 h-3.5 text-red-400`} />;
    case 'RISK_SCORING':        return <ChartBar       className={`${base} w-3.5 h-3.5 text-amber-400`} weight="fill" />;
    case 'EXECUTION_CONFIRMED': return <SiEthereum     className={`${base} w-3.5 h-3.5 text-emerald-400`} />;
    case 'EXECUTION_SUBMITTED': return <ArrowFatLineRight className={`${base} w-3.5 h-3.5 text-emerald-300`} weight="fill" />;
    case 'EXECUTION_FAILED':    return <TbAlertTriangle className={`${base} w-3.5 h-3.5 text-red-500`} />;
    case 'PRICE_CHECK':         return <ChartBar       className={`${base} w-3.5 h-3.5 text-cyan-300`} weight="duotone" />;
    default:                    return <ArrowRightCircleIcon className={`${base} w-3.5 h-3.5 text-white/30`} />;
  }
}

function ActivityFeed() {
  const messages  = useAlphaStore(s => s.messages);
  const isConnected = useAlphaStore(s => s.isConnected);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between flex-shrink-0">
        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-white/40">Agent Live Feed</span>
        <div className="flex items-center gap-1.5">
          {isConnected
            ? <><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /><span className="text-[9px] text-emerald-400 font-mono">LIVE</span></>
            : <><span className="w-1.5 h-1.5 rounded-full bg-red-400" /><span className="text-[9px] text-red-400 font-mono">OFFLINE</span></>
          }
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 opacity-40">
            <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center">
              <Activity size={14} className="text-white/50" />
            </div>
            <p className="text-[10px] font-mono text-white/40 text-center leading-relaxed">
              Send an intent via<br />
              <a href="https://t.me/Alpha402bot" target="_blank" rel="noreferrer" className="text-blue-400 underline">@Alpha402bot</a><br />
              to see agents fire
            </p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const color = AGENT_COLORS[msg.sender?.toLowerCase()] ?? '#888';
            const isTx  = msg.type === 'EXECUTION_CONFIRMED';
            const txHash = (msg.payload as any)?.txHash;
            return (
              <div key={msg.id ?? i}
                className={cn(
                  'rounded-lg p-2.5 border text-[10px] font-mono transition-all',
                  isTx
                    ? 'bg-emerald-400/10 border-emerald-400/30'
                    : 'bg-white/3 border-white/5 hover:bg-white/5'
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <MsgIcon type={msg.type} />
                  <span className="font-bold" style={{ color }}>{msg.sender?.toUpperCase()}</span>
                  <span className="text-white/20">→</span>
                  <span className="text-white/40">{msg.receiver?.toUpperCase()}</span>
                  <span className="ml-auto text-white/20 text-[9px]">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
                <div className="text-white/50 truncate">{msg.type} {msg.content && `— ${msg.content}`}</div>
                {isTx && txHash && (
                  <a
                    href={`https://sepolia.etherscan.io/tx/${txHash}`}
                    target="_blank" rel="noreferrer"
                    className="mt-1.5 flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    <CheckCircle2 size={10} />
                    <span className="truncate">{txHash.slice(0, 20)}...</span>
                    <ExternalLink size={9} className="flex-shrink-0" />
                  </a>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── Right Control Panel ───────────────────────────────────────────────────────
function ControlPanel() {
  const { strategies, isConnected, sendCommand, messages } = useAlphaStore();
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const txMsgs = messages.filter(
    m => m.type === 'EXECUTION_CONFIRMED' && (m.payload as any)?.txHash?.startsWith?.('0x')
  ).slice(0, 5);

  const send = () => {
    if (!input.trim() || sending) return;
    if (!isConnected) {
      setFeedback('⚠ Backend offline');
      setTimeout(() => setFeedback(null), 3000);
      return;
    }
    const ok = sendCommand({ type: 'PARSE_STRATEGY', input: input.trim(), owner: 'dashboard_user' });
    if (ok) {
      setFeedback('✓ Dispatched to Commander');
      setInput('');
      setSending(true);
      setTimeout(() => { setSending(false); setFeedback(null); }, 3000);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5 flex-shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-white/40">Control Panel</span>
          <a href="/" className="text-[9px] font-mono text-white/30 hover:text-white/60 flex items-center gap-1 transition-colors">
            <ArrowLeft size={9} /> Landing
          </a>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* WS status */}
        <div className="mx-3 mt-3 p-2.5 rounded-lg border border-white/5 bg-white/3">
          <div className="flex items-center gap-2">
            {isConnected
              ? <Wifi size={12} className="text-emerald-400" />
              : <WifiOff size={12} className="text-red-400" />}
            <span className="text-[10px] font-mono text-white/50">
              {isConnected ? 'ws://localhost:3001 — connected' : 'Agent bus offline'}
            </span>
          </div>
        </div>

        {/* Telegram */}
        <div className="mx-3 mt-3 p-2.5 rounded-lg border border-blue-500/20 bg-blue-500/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-[9px] font-bold">T</div>
              <div>
                <p className="text-[10px] font-bold text-blue-400">@Alpha402bot</p>
                <p className="text-[9px] text-white/30">Telegram connected</p>
              </div>
            </div>
            <CheckCircle2 size={13} className="text-emerald-400" />
          </div>
        </div>

        {/* Strategy dispatch */}
        <div className="mx-3 mt-4">
          <p className="text-[9px] font-mono font-bold uppercase tracking-widest text-white/30 mb-2">Dispatch Strategy</p>
          <div className="rounded-lg border border-white/8 bg-white/3 overflow-hidden">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
              placeholder={isConnected ? 'e.g. buy ETH when price drops below $2500' : 'Backend offline...'}
              disabled={!isConnected}
              rows={3}
              className="w-full bg-transparent p-3 text-[11px] font-mono text-white/70 placeholder-white/20 outline-none resize-none disabled:opacity-30"
            />
            <div className="flex items-center justify-between px-3 py-2 border-t border-white/5">
              <span className="text-[9px] text-white/20 font-mono">Enter to send</span>
              <button
                onClick={send}
                disabled={!input.trim() || !isConnected || sending}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest transition-all',
                  input.trim() && isConnected && !sending
                    ? 'bg-blue-500 text-white hover:bg-blue-400'
                    : 'bg-white/5 text-white/20 cursor-not-allowed'
                )}
              >
                <Send size={10} />
                {sending ? 'Sent ✓' : 'Deploy'}
              </button>
            </div>
          </div>
          {feedback && (
            <p className={cn('mt-1.5 text-[10px] font-mono', feedback.startsWith('✓') ? 'text-emerald-400' : 'text-amber-400')}>
              {feedback}
            </p>
          )}
        </div>

        {/* Active strategies */}
        <div className="mx-3 mt-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[9px] font-mono font-bold uppercase tracking-widest text-white/30">Active Strategies</p>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-500/20">
              {strategies.length}
            </span>
          </div>
          <div className="space-y-1.5">
            {strategies.slice(0, 3).map(s => (
              <div key={s.id} className="p-2.5 rounded-lg border border-white/5 bg-white/3 text-[10px] font-mono">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-white/30">{s.lastTriggered}</span>
                </div>
                <p className="text-white/60 line-clamp-1 italic">&quot;{s.input}&quot;</p>
              </div>
            ))}
          </div>
        </div>

        {/* Confirmed transactions */}
        <div className="mx-3 mt-4 mb-4">
          <p className="text-[9px] font-mono font-bold uppercase tracking-widest text-white/30 mb-2">Confirmed Txns</p>
          {txMsgs.length === 0 ? (
            <div className="p-3 rounded-lg border border-dashed border-white/8 text-center">
              <Clock size={14} className="mx-auto mb-1 text-white/20" />
              <p className="text-[9px] font-mono text-white/20">Waiting for first execution</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {txMsgs.map((m, i) => {
                const hash = (m.payload as any)?.txHash;
                return (
                  <a key={i} href={`https://sepolia.etherscan.io/tx/${hash}`} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 p-2.5 rounded-lg border border-emerald-400/15 bg-emerald-400/5 hover:bg-emerald-400/10 transition-colors"
                  >
                    <CheckCircle2 size={11} className="text-emerald-400 flex-shrink-0" />
                    <span className="text-[10px] font-mono text-emerald-400/80 truncate flex-1">{hash?.slice(0, 18)}...</span>
                    <ExternalLink size={9} className="text-emerald-400/50 flex-shrink-0" />
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Dashboard Page ────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const isConnected = useAlphaStore(s => s.isConnected);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#070B13', color: '#F0F4FF' }}>

      {/* LEFT — Activity feed */}
      <aside className="w-[280px] flex-shrink-0 border-r border-white/5 flex flex-col">
        <ActivityFeed />
      </aside>

      {/* CENTER — Agent flow graph */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-white/5 flex-shrink-0">
          <div>
            <h1 className="text-sm font-bold tracking-tight" style={{ fontFamily: 'var(--font-jetbrains), monospace' }}>
              Alpha402 — Mission Control
            </h1>
            <p className="text-[10px] text-white/30 font-mono">Autonomous DeFi Agent Crew · Sepolia Testnet</p>
          </div>
          <div className="flex items-center gap-3">
            <div className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-mono font-bold border',
              isConnected
                ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-400'
                : 'border-red-400/30 bg-red-400/10 text-red-400'
            )}>
              <span className={cn('w-1.5 h-1.5 rounded-full', isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400')} />
              {isConnected ? 'AGENT BUS LIVE' : 'DISCONNECTED'}
            </div>
            <a href="https://sepolia.etherscan.io/address/0xf1649100d6A99F68337BbCEE16a70Baf640F72CF"
              target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 text-[10px] font-mono text-white/40 hover:text-white/70 transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              StrategyVault · Sepolia
              <ExternalLink size={9} />
            </a>
          </div>
        </div>

        {/* Graph canvas */}
        <div className="flex-1 flex items-center justify-center p-8 relative">
          {/* Subtle grid */}
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }} />

          {/* Glow blobs */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10 pointer-events-none"
            style={{ background: 'radial-gradient(circle, #1E6FFF 0%, transparent 70%)' }} />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full opacity-10 pointer-events-none"
            style={{ background: 'radial-gradient(circle, #00FF88 0%, transparent 70%)' }} />

          {/* Pipeline flow graph */}
          <div className="relative w-full max-w-[600px] h-[590px]">
            <PipelineGraph />
          </div>
        </div>

        {/* Bottom legend */}
        <div className="px-6 py-3 border-t border-white/5 flex items-center gap-6 flex-shrink-0">
          {[
            { color: '#1E6FFF', label: 'Commander' },
            { color: '#00F5FF', label: 'Intel' },
            { color: '#F59E0B', label: 'Risk' },
            { color: '#00FF88', label: 'Execution' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: item.color }} />
              <span className="text-[9px] font-mono text-white/40">{item.label}</span>
            </div>
          ))}
          <div className="ml-auto flex items-center gap-1.5 text-[9px] font-mono text-white/20">
            <span className="w-6 h-px border-t border-dashed border-white/20" />
            inactive edge
            <span className="w-6 h-px" style={{ borderTop: '1px solid #1E6FFF' }} />
            active data flow
          </div>
        </div>
      </main>

      {/* RIGHT — Controls */}
      <aside className="w-[280px] flex-shrink-0 border-l border-white/5 flex flex-col">
        <ControlPanel />
      </aside>
    </div>
  );
}
