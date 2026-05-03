"use client";

import React from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import TradingFloor from '@/components/scene/TradingFloor';
import { Shield } from 'lucide-react';

export const WalletGate = ({ children }: { children: React.ReactNode }) => {
  const { isConnected } = useAccount();

  if (isConnected) return <>{children}</>;

  return (
    <div className="relative w-full h-screen overflow-hidden bg-background-primary">
      {/* Background Scene (Blurred) */}
      <div className="absolute inset-0 opacity-40 blur-sm pointer-events-none">
        <TradingFloor miniaturized />
      </div>

      {/* Connection Modal */}
      <div className="absolute inset-0 flex items-center justify-center z-10 p-6">
        <div className="max-w-md w-full glass-panel p-8 text-center neon-border animate-in fade-in zoom-in duration-500">
          <div className="mb-6 inline-flex p-4 rounded-full bg-blue-dim border border-blue-muted text-blue-base">
            <Shield size={40} />
          </div>
          
          <h1 className="text-2xl font-bold mb-2 tracking-tight">Mission Control Locked</h1>
          <p className="text-text-secondary text-sm mb-8 leading-relaxed">
            Connect your wallet to deploy your trading crew and access the Alpha402 autonomous dashboard.
          </p>
          
          <div className="flex justify-center">
            <ConnectButton label="Authenticate System" />
          </div>
          
          <div className="mt-10 pt-6 border-t border-background-tertiary">
            <div className="flex justify-center gap-6 opacity-30 grayscale contrast-125">
              <span className="text-[10px] font-bold uppercase tracking-widest">Unichain</span>
              <span className="text-[10px] font-bold uppercase tracking-widest">0G Storage</span>
              <span className="text-[10px] font-bold uppercase tracking-widest">Gensyn</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
