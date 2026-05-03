"use client";

import React from 'react';
import { useAlphaStore } from '@/lib/store';
import { CreditCard, ArrowRight } from 'lucide-react';

export const X402PaymentFeed = () => {
  const { payments } = useAlphaStore();
  
  const totalSpent = payments.reduce((acc, p) => acc + parseFloat(p.amount), 0);

  return (
    <div className="flex flex-col h-full glass-panel overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-background-tertiary bg-background-secondary/50">
        <div className="flex items-center gap-2">
          <CreditCard size={16} className="text-neon-yellow" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-text-secondary">x402 Payment Stream</h2>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto font-mono text-[11px]">
        {payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-text-tertiary gap-2">
            <span className="opacity-50">NO MICRO-PAYMENTS IN SESSION</span>
          </div>
        ) : (
          payments.map((p) => (
            <div key={p.id} className="flex items-center justify-between px-4 py-2 border-b border-background-tertiary hover:bg-background-secondary/30 transition-colors">
              <div className="flex items-center gap-2">
                <span className="text-text-mono bg-blue-dim/50 px-1 rounded">[x402]</span>
                <span className="text-text-secondary">{p.from}</span>
                <ArrowRight size={10} className="text-text-tertiary" />
                <span className="text-text-primary">{p.to}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-neon-yellow font-bold">${p.amount}</span>
                <span className="text-text-tertiary">{new Date(p.timestamp).toLocaleTimeString([], { hour12: false })}</span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="px-4 py-2 bg-background-secondary/80 border-t border-background-tertiary flex justify-between items-center">
        <span className="text-[10px] text-text-tertiary uppercase">Session Expenditure</span>
        <span className="text-xs font-bold text-neon-yellow">Total: ${totalSpent.toFixed(4)}</span>
      </div>
    </div>
  );
};
