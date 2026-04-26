"use client";

import React from 'react';
import { StrategyCard } from '@/components/strategy/StrategyCard';
import { useAlphaStore } from '@/lib/store';
import { ShieldAlert, Plus, Layers, Search } from 'lucide-react';

export default function StrategiesPage() {
  const { strategies } = useAlphaStore();

  return (
    <div className="min-h-screen bg-background-primary flex flex-col">
      {/* Hero Header */}
      <div className="p-12 border-b border-background-tertiary bg-background-secondary/20">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-end gap-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-dim border border-blue-muted rounded w-fit">
              <Layers size={14} className="text-blue-base" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-blue-base">Fleet Management</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight">Your deployed strategies</h1>
            <p className="text-text-secondary text-sm max-w-md">
              Manage your autonomous trading agents. Pause, modify, or terminate operations across all Unichain pools.
            </p>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold uppercase text-text-tertiary">Active Crew</span>
              <span className="text-2xl font-mono font-bold text-status-success">{strategies.filter(s => s.status === 'ACTIVE').length} / {strategies.length}</span>
            </div>
            <div className="flex flex-col items-end border-l border-background-tertiary pl-6">
              <span className="text-[10px] font-bold uppercase text-text-tertiary">Total Volume</span>
              <span className="text-2xl font-mono font-bold text-text-primary">$2,410.52</span>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="sticky top-0 z-20 px-12 py-4 border-b border-background-tertiary bg-background-primary/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" size={16} />
            <input 
              type="text" 
              placeholder="Search by intent, token or ID..." 
              className="w-full bg-background-secondary border border-background-tertiary rounded py-2 pl-10 pr-4 text-xs font-mono focus:outline-none focus:border-blue-base/50 transition-colors"
            />
          </div>
          
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-4 py-2 border border-status-danger/30 text-status-danger text-xs font-bold uppercase hover:bg-status-danger/10 transition-colors rounded">
              <ShieldAlert size={16} />
              Emergency Stop
            </button>
            <button className="flex items-center gap-2 px-6 py-2 bg-blue-base text-white text-xs font-bold uppercase hover:bg-blue-bright transition-colors rounded">
              <Plus size={16} />
              New Intent
            </button>
          </div>
        </div>
      </div>

      {/* Strategy Grid */}
      <div className="flex-1 p-12 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {strategies.length === 0 ? (
            <div className="py-32 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 rounded-full bg-background-secondary border border-dashed border-background-tertiary flex items-center justify-center text-text-tertiary mb-6">
                <Plus size={40} />
              </div>
              <h2 className="text-xl font-bold mb-2">No strategies deployed</h2>
              <p className="text-text-tertiary text-sm max-w-xs mb-8">
                Your agent crew is idling. Send a trading intent via the Telegram bot to get started.
              </p>
              <button className="px-8 py-3 bg-blue-base text-white font-bold rounded">
                Open Commander Interface
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {strategies.map((strategy) => (
                <StrategyCard key={strategy.id} strategy={strategy} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
