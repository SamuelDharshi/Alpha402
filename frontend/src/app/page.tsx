"use client";

import React from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
const TradingFloor = dynamic(() => import('@/components/scene/TradingFloor'), { ssr: false });
import { motion } from 'framer-motion';
import { ArrowRight, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen flex overflow-hidden">
        {/* Left: 3D Scene (60%) */}
        <div className="hidden md:block md:w-3/5 h-full relative">
          <TradingFloor />
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-transparent to-background-primary" />
        </div>

        {/* Right: Hero Text (40%) */}
        <div className="w-full md:w-2/5 flex flex-col justify-center px-8 md:px-16 z-10 bg-background-primary/80 md:bg-transparent backdrop-blur-sm md:backdrop-blur-none">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center gap-2 mb-6">
              <span className="flex h-2 w-2 rounded-full bg-status-success animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-secondary">
                LIVE ON UNICHAIN · ETHGLOBAL OPEN AGENTS 2026
              </span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
              Your autonomous<br />
              <span className="text-blue-base">trading crew.</span><br />
              One message.
            </h1>

            <p className="text-text-secondary text-lg mb-10 leading-relaxed max-w-md">
              Deploy a team of AI agents that watches the market, manages risk, and executes trades on Uniswap v4 — while you sleep.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                href="https://t.me/Alpha402Bot" 
                target="_blank"
                className="px-8 py-4 bg-blue-base hover:bg-blue-bright transition-all text-white font-bold rounded flex items-center justify-center gap-2 group"
              >
                <Bot size={20} />
                Open Telegram Bot
              </Link>
              <Link 
                href="/dashboard" 
                className="px-8 py-4 border border-background-tertiary hover:border-blue-base/50 hover:bg-blue-dim/20 transition-all text-text-primary font-bold rounded flex items-center justify-center gap-2 group"
              >
                View Dashboard
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="mt-16 pt-8 border-t border-background-tertiary">
              <span className="text-[9px] font-bold uppercase tracking-widest text-text-tertiary block mb-4">Secured & Powered By</span>
              <div className="flex flex-wrap gap-8 items-center opacity-40 grayscale contrast-125">
                <span className="font-bold text-xl tracking-tighter">UNISWAP</span>
                <span className="font-bold text-xl tracking-tighter">0G STORAGE</span>
                <span className="font-bold text-xl tracking-tighter">GENSYN</span>
                <span className="font-bold text-xl tracking-tighter">KEEPERHUB</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Section 1: The Problem */}
      <section className="py-32 px-8 bg-background-secondary/30 relative">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { id: '01', title: '6 browser tabs', desc: 'No more juggling Dexscreener, Uniswap, and multiple Telegram groups.' },
              { id: '02', title: '3am price alerts', desc: 'Let your agents monitor volatility while you maintain a healthy sleep cycle.' },
              { id: '03', title: 'Manual execution', desc: 'Automate complex multi-step strategies with sub-second agent coordination.' }
            ].map((card) => (
              <div key={card.id} className="glass-panel p-8 border-l-4 border-l-blue-base/30">
                <span className="text-4xl font-mono font-bold text-blue-base/20 block mb-4">{card.id}</span>
                <h3 className="text-xl font-bold mb-3">{card.title}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 2: The Crew */}
      <section className="py-32 px-8 relative overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 italic">Meet the specialized crew</h2>
            <div className="w-24 h-1 bg-blue-base mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { name: 'Commander', color: 'border-blue-base', role: 'Strategic Director', cap: 'Translates natural language intents to actionable multi-agent plans.' },
              { name: 'Intel', color: 'border-neon-cyan', role: 'Market Analyst', cap: '24/7 scanning of Unichain pools and real-time volume spikes.' },
              { name: 'Risk', color: 'border-status-warning', role: 'Security Auditor', cap: 'Verifies rug-safety and calculates optimal position sizing.' },
              { name: 'Execution', color: 'border-neon-green', role: 'Operations Lead', cap: 'Fires atomic swaps via Uniswap v4 Hooks and KeeperHub.' }
            ].map((agent) => (
              <div key={agent.name} className={cn("glass-panel p-6 border-l-2", agent.color)}>
                <span className="inline-block px-2 py-1 bg-background-tertiary rounded text-[10px] font-bold uppercase tracking-widest text-text-mono mb-4">
                  {agent.name}
                </span>
                <h4 className="text-lg font-bold mb-2">{agent.role}</h4>
                <p className="text-text-secondary text-xs leading-relaxed">{agent.cap}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3: How It Works */}
      <section className="py-32 px-8 bg-background-tertiary/20">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-4 mb-20 overflow-x-auto pb-8">
            {[
              { step: '1', agent: 'CMD', text: 'You type a strategy in Telegram' },
              { step: '2', agent: 'INTEL', text: 'Intel Agent watches the market 24/7' },
              { step: '3', agent: 'RISK', text: 'Risk Agent scores every trade' },
              { step: '4', agent: 'EXEC', text: 'Execution Agent fires via KeeperHub' }
            ].map((item, i) => (
              <React.Fragment key={item.step}>
                <div className="flex-shrink-0 flex flex-col items-center gap-4 min-w-[200px]">
                  <div className="w-12 h-12 rounded-full bg-blue-dim border border-blue-muted flex items-center justify-center font-bold text-blue-base">
                    {item.step}
                  </div>
                  <div className="text-center">
                    <span className="block text-[10px] font-bold text-text-tertiary mb-1 uppercase tracking-widest">{item.agent}</span>
                    <p className="text-xs text-text-primary font-medium">{item.text}</p>
                  </div>
                </div>
                {i < 3 && (
                  <div className="hidden md:block flex-1 h-px bg-gradient-to-r from-blue-base/50 to-transparent" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-8 border-t border-background-tertiary text-center">
        <p className="text-[10px] font-mono text-text-tertiary uppercase tracking-[0.4em]">
          Alpha402 · Autonomous Trading System · 2026
        </p>
      </footer>
    </div>
  );
}
