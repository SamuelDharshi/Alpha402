/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bot, 
  Terminal, 
  ShieldCheck, 
  Zap, 
  MessageSquare, 
  Cpu, 
  Database, 
  Repeat, 
  ExternalLink, 
  ChevronRight,
  LayoutGrid,
  Activity,
  Code2,
  Globe
} from 'lucide-react';

const AGENTS = [
  {
    role: "Commander",
    description: "Parses Telegram intent using Llama 3.1. Translates natural language into executable strategy blueprints.",
    icon: MessageSquare,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
  },
  {
    role: "Intel",
    description: "Monitors cross-chain price feeds. Manages data costs via x402 and provides real-time alpha.",
    icon: Cpu,
    color: "text-purple-400",
    bg: "bg-purple-400/10",
  },
  {
    role: "Risk",
    description: "Scores trades using verifable inference. Evaluates slippage, volatility, and wallet exposure.",
    icon: ShieldCheck,
    color: "text-cyan-400",
    bg: "bg-cyan-400/10",
  },
  {
    role: "Execution",
    description: "Settles on Uniswap v4. Uses KeeperHub for guaranteed execution with private routing.",
    icon: Zap,
    color: "text-amber-400",
    bg: "bg-amber-400/10",
  },
];

const LOGS = [
  "[SYSTEM] Commander Agent initialized.",
  "[USER] 'Buy 0.5 ETH if price < $3000'",
  "[INTEL] Price scan: ETH @ $2985 (Source: Uniswap v3)",
  "[RISK] Analyzing volatility index... Score: 0.82 (Safe)",
  "[RISK] Verified on Gensyn AXL mesh.",
  "[EXECUTION] Submitting via KeeperHub Sepolia...",
  "[EXECUTION] Tx Hash: 0x4a2...9f10 (Success)",
  "[0G] Persistent audit trail saved to log #8821",
];

export default function App() {
  const [activeLogOffset, setActiveLogOffset] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveLogOffset((prev) => (prev + 1) % LOGS.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-cyan-500/30">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-500/10 rounded-full blur-[120px]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 border-b border-slate-800/50 backdrop-blur-md sticky top-0">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-cyan-500 flex items-center justify-center rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.5)]">
              <span className="font-bold text-slate-950 text-lg italic">a</span>
            </div>
            <span className="font-bold text-xl tracking-tight text-white uppercase italic">Alpha402</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#agents" className="hover:text-cyan-400 transition-colors">Agents</a>
            <a href="#stack" className="hover:text-cyan-400 transition-colors">Stack</a>
            <a href="#audit" className="hover:text-cyan-400 transition-colors">Audit Trail</a>
          </div>
          <button className="bg-slate-100 text-slate-950 px-4 py-2 rounded-full text-sm font-semibold hover:bg-white transition-all transform active:scale-95 shadow-sm">
            Launch Crew
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-24 pb-20 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-xs font-mono text-cyan-400 mb-6 tracking-wider">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
              ACTIVE ON SEPOLIA // ETHGLOBAL OPEN AGENTS
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">
              Your autonomous trading crew, <br className="hidden md:block" /> deployed in one message.
            </h1>
            <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
              Alpha402 collapse natural language intent into on-chain strategy. A crew of specialised AI agents handles intelligence, risk, and execution 24/7.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button className="w-full sm:w-auto bg-cyan-500 text-slate-950 px-8 py-4 rounded-xl text-lg font-bold hover:bg-cyan-400 transition-all flex items-center justify-center gap-2 group shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                Deploy with Telegram <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="w-full sm:w-auto bg-slate-900 border border-slate-800 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                <Code2 className="w-5 h-5" /> View Docs
              </button>
            </div>
          </motion.div>
          
          {/* Hero Audit Preview */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="mt-20 max-w-4xl mx-auto bg-slate-900/50 border border-slate-800 rounded-2xl p-4 md:p-6 backdrop-blur-xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-800">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/50" />
                <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
              </div>
              <div className="flex items-center gap-4 text-[10px] font-mono text-slate-500 tracking-widest uppercase">
                <span>Network: Gensyn P2P</span>
                <span>Storage: 0G Labs</span>
                <span>Execution: KeeperHub</span>
              </div>
            </div>
            <div className="font-mono text-left space-y-2 h-40 md:h-48 overflow-hidden text-sm relative">
              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-900 to-transparent pointer-events-none" />
              <AnimatePresence mode="popLayout">
                {LOGS.slice(0, activeLogOffset + 1).map((log, i) => (
                  <motion.div
                    key={`${i}-${log}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={`flex gap-3 ${i === activeLogOffset ? 'text-cyan-400' : 'text-slate-500'}`}
                  >
                    <span className="text-slate-700 select-none">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
                    <span>{log}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Tech Stack Bar */}
      <section id="stack" className="relative z-10 py-12 border-y border-slate-900 bg-slate-950">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-10 italic">Built for the Open Agents Ecosystem</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 opacity-60">
            <div className="flex flex-col items-center gap-2 group cursor-default grayscale hover:grayscale-0 transition-all">
              <LayoutGrid className="w-6 h-6 text-slate-400 group-hover:text-pink-500 transition-colors" />
              <span className="text-sm font-bold tracking-tighter text-slate-300">UNISWAP V4</span>
            </div>
            <div className="flex flex-col items-center gap-2 group cursor-default grayscale hover:grayscale-0 transition-all">
              <Database className="w-6 h-6 text-slate-400 group-hover:text-blue-500 transition-colors" />
              <span className="text-sm font-bold tracking-tighter text-slate-300">0G LABS STORAGE</span>
            </div>
            <div className="flex flex-col items-center gap-2 group cursor-default grayscale hover:grayscale-0 transition-all">
              <Repeat className="w-6 h-6 text-slate-400 group-hover:text-purple-500 transition-colors" />
              <span className="text-sm font-bold tracking-tighter text-slate-300">GENSYN AXL</span>
            </div>
            <div className="flex flex-col items-center gap-2 group cursor-default grayscale hover:grayscale-0 transition-all">
              <Globe className="w-6 h-6 text-slate-400 group-hover:text-green-500 transition-colors" />
              <span className="text-sm font-bold tracking-tighter text-slate-300">KEEPERHUB</span>
            </div>
          </div>
        </div>
      </section>

      {/* Agents Grid */}
      <section id="agents" className="relative z-10 py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div className="max-w-xl">
              <h2 className="text-4xl font-bold tracking-tight text-white mb-4 italic uppercase">The Specialized Crew</h2>
              <p className="text-slate-400 text-lg leading-relaxed">
                4 agents. 1 goal. Alpha402 isn't just one bot—it's a multi-agent system that coordinates specialized roles over the Gensyn AXL mesh.
              </p>
            </div>
            <div className="flex items-center gap-2 text-cyan-400 font-mono text-sm">
              <Activity className="w-4 h-4 animate-pulse" /> Agent State: Synced
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {AGENTS.map((agent, i) => (
              <motion.div
                key={agent.role}
                whileHover={{ y: -5 }}
                className="group relative bg-slate-900/40 border border-slate-800 rounded-2xl p-6 hover:bg-slate-900/60 transition-all overflow-hidden"
              >
                <div className={`w-12 h-12 ${agent.bg} ${agent.color} rounded-xl flex items-center justify-center mb-6`}>
                  <agent.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3 tracking-tight">{agent.role} Agent</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">
                  {agent.description}
                </p>
                <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-600 uppercase">Operational</span>
                  <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-cyan-500 transition-colors" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works - Horizontal Scroll / Steps */}
      <section className="relative z-10 py-24 bg-slate-950/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4 italic uppercase">Delegation, not Automation.</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">From human language to on-chain settlement. Transparent, verifiable, and fast.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 text-left relative">
            <div className="hidden lg:block absolute top-10 left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent" />
            
            <div className="relative group">
              <div className="w-10 h-10 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center text-cyan-400 font-mono mb-6 group-hover:border-cyan-500/50 transition-colors">1</div>
              <h3 className="text-xl font-bold text-white mb-4">Express Intent</h3>
              <p className="text-slate-400 text-sm italic">"Buy ETH when it dips below $3,000. Maximum 0.5 ETH position size."</p>
            </div>

            <div className="relative group">
              <div className="w-10 h-10 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center text-cyan-400 font-mono mb-6 group-hover:border-cyan-500/50 transition-colors">2</div>
              <h3 className="text-xl font-bold text-white mb-4">Agent Reasoning</h3>
              <p className="text-slate-400 text-sm leading-relaxed">Commander blueprints the strategy. Intel watches feeds. Risk verifies the inference on 0G Compute.</p>
            </div>

            <div className="relative group">
              <div className="w-10 h-10 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center text-cyan-400 font-mono mb-6 group-hover:border-cyan-500/50 transition-colors">3</div>
              <h3 className="text-xl font-bold text-white mb-4">Reliable Settlement</h3>
              <p className="text-slate-400 text-sm leading-relaxed">Execution settles via Uniswap, powered by KeeperHub persistence. Audit trail logs directly to 0G Storage.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 px-6 border-t border-slate-900 mt-12 bg-slate-950">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-slate-100 flex items-center justify-center rounded text-slate-900 font-bold overflow-hidden">
                a
              </div>
              <span className="font-bold text-lg tracking-tight text-white uppercase italic">Alpha402</span>
            </div>
            <p className="text-slate-500 text-sm max-w-[240px] text-center md:text-left">
              Built for ETHGlobal Open Agents 2026. Powered by AI Agents, decentralized storage, and on-chain execution.
            </p>
          </div>
          
          <div className="flex gap-12">
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Connect</span>
              <a href="#" className="text-slate-400 hover:text-white transition-colors text-sm">Telegram Agent</a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors text-sm">Twitter / X</a>
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Legal</span>
              <a href="#" className="text-slate-400 hover:text-white transition-colors text-sm">Privacy</a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors text-sm">Terms</a>
            </div>
          </div>
          
          <div className="flex flex-col items-center md:items-end gap-2">
            <div className="flex items-center gap-4 mb-2">
              <a href="#" className="text-slate-400 hover:text-white transition-colors"><MessageSquare className="w-5 h-5" /></a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors"><Bot className="w-5 h-5" /></a>
            </div>
            <span className="text-[10px] font-mono text-slate-700">VERSION 1.0.0-ALPHA-402</span>
          </div>
        </div>
        <div className="max-w-7xl mx-auto text-center mt-12 pt-8 border-t border-slate-900/50">
          <p className="text-slate-700 text-[10px] uppercase font-mono tracking-widest">© 2026 ALPHA402 AGENTIC CREW // DECENTRALIZED TRADING EXPERIMENT</p>
        </div>
      </footer>
    </div>
  );
}
