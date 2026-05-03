"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useAlphaStore } from '@/lib/store';
import { A2AMessage, AgentRole } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Terminal } from 'lucide-react';
import { cn } from '@/lib/utils';

const AGENT_TEXT_COLORS: Record<AgentRole, string> = {
  COMMANDER: 'text-blue-base',
  INTEL: 'text-neon-cyan',
  RISK: 'text-status-warning',
  EXECUTION: 'text-neon-green',
  USER: 'text-text-primary',
};

const getAgentColorClass = (agent: string) => {
  const key = agent.toUpperCase() as AgentRole;
  return AGENT_TEXT_COLORS[key] ?? 'text-text-primary';
};

const LogRow = ({ msg }: { msg: A2AMessage }) => {
  const [expanded, setExpanded] = useState(false);
  
  const isRejected = msg.type === 'RISK_REJECTED';
  const isApproved = msg.type === 'RISK_APPROVED';
  
  return (
    <div className={cn(
      "border-b border-background-tertiary transition-colors",
      isRejected ? "bg-status-danger/10" : "hover:bg-background-secondary/50"
    )}>
      <div 
        className="flex items-center gap-4 px-4 py-2 cursor-pointer font-mono text-[13px]"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="text-text-tertiary">[{new Date(msg.timestamp).toLocaleTimeString([], { hour12: false })}]</span>
        <span className={cn("font-bold w-16", getAgentColorClass(msg.sender))}>{msg.sender}</span>
        <span className="text-text-secondary">→</span>
        <span className={cn("font-bold w-16", getAgentColorClass(msg.receiver))}>{msg.receiver}</span>
        <span className={cn(
          "flex-1 truncate",
          isRejected ? "text-status-danger" : isApproved ? "text-status-success" : "text-text-mono"
        )}>
          {msg.type} {msg.content}
        </span>
        {msg.zeroGTxn && (
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-500/20 text-[9px] text-blue-400 font-bold border border-blue-500/30">
            0G AUDIT
          </div>
        )}
        {expanded ? <ChevronUp size={14} className="text-text-tertiary" /> : <ChevronDown size={14} className="text-text-tertiary" />}
      </div>
      
      <AnimatePresence>
        {expanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-background-primary/50"
          >
            <pre className="p-4 text-[11px] text-text-tertiary whitespace-pre-wrap font-mono">
              {JSON.stringify(msg.payload || msg, null, 2)}
            </pre>
            {(msg.zeroGCID || msg.zeroGTxn) && (
              <div className="px-4 pb-4 flex flex-col gap-1 border-t border-background-tertiary pt-2 mt-[-8px]">
                <div className="text-[10px] uppercase font-bold text-blue-base opacity-70">0G Audit Trail</div>
                {msg.zeroGCID && <div className="text-[10px] font-mono text-text-tertiary">CID: <span className="text-text-secondary">{msg.zeroGCID}</span></div>}
                {msg.zeroGTxn && (
                  <div className="text-[10px] font-mono text-text-tertiary">
                    TXN: <a href={`https://chainscan-galileo.0g.ai/tx/${msg.zeroGTxn}`} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">
                      {msg.zeroGTxn.slice(0, 24)}...
                    </a>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const AgentActivityFeed = () => {
  const { messages } = useAlphaStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full glass-panel overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-background-tertiary bg-background-secondary/50">
        <div className="flex items-center gap-2">
          <Terminal size={16} className="text-blue-base" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-text-secondary">Agent Activity Log</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-status-success animate-pulse" />
          <span className="text-[10px] text-text-tertiary uppercase">Live Connection</span>
        </div>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-text-tertiary gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-base"></div>
            <span className="text-[11px] font-mono">WAITING FOR AGENT BROADCAST...</span>
          </div>
        ) : (
          messages.map((msg) => (
            <LogRow key={msg.id} msg={msg} />
          ))
        )}
      </div>
    </div>
  );
};
