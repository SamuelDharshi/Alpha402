"use client";

import React from 'react';
import { useAlphaStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

type AgentId = 'COMMANDER' | 'INTEL' | 'RISK' | 'EXECUTION';

interface AgentCardProps {
  agentId: AgentId;
  label: string;
  role: string;
  accentClass: string;    // text color  e.g. "text-blue-base"
  dotClass: string;       // dot color   e.g. "bg-blue-base"
  borderClass: string;    // border color e.g. "border-blue-base"
}

const STATUS_LABEL: Record<string, string> = {
  IDLE:     'IDLE',
  THINKING: 'THINKING',
  ACTIVE:   'ACTIVE',
};

const STATUS_DOT: Record<string, string> = {
  IDLE:     'bg-text-tertiary',
  THINKING: 'bg-status-warning',
  ACTIVE:   'bg-status-success',
};

const STATUS_TEXT: Record<string, string> = {
  IDLE:     'text-text-tertiary',
  THINKING: 'text-status-warning',
  ACTIVE:   'text-status-success',
};

export function AgentCard({
  agentId, label, role, accentClass, dotClass, borderClass,
}: AgentCardProps) {
  const agentState = useAlphaStore(
    (s) => s.agentStates[agentId] ?? s.agentStates[agentId.toLowerCase()] ?? { status: 'IDLE' }
  );

  const status = agentState.status ?? 'IDLE';
  const isActive = status === 'ACTIVE';
  const isThinking = status === 'THINKING';

  return (
    <div
      className={cn(
        'relative flex items-center gap-3 p-3 rounded border transition-all duration-300',
        'bg-background-primary/50 hover:bg-background-secondary/50',
        borderClass,
        isActive ? 'shadow-[0_0_12px_0px_rgba(0,255,136,0.15)]' : 'border-opacity-30',
      )}
    >
      {/* Agent colour tag */}
      <div
        className={cn(
          'w-8 h-8 rounded flex items-center justify-center text-[10px] font-black flex-shrink-0',
          'bg-background-tertiary border',
          borderClass,
          accentClass,
        )}
      >
        {label.slice(0, 3)}
      </div>

      {/* Name + role */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={cn('text-[11px] font-bold tracking-wider', accentClass)}>
            {label}
          </span>

          {/* Animated status dot */}
          <AnimatePresence mode="wait">
            <motion.span
              key={status}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={cn(
                'w-1.5 h-1.5 rounded-full flex-shrink-0',
                STATUS_DOT[status],
                (isActive || isThinking) && 'animate-pulse',
              )}
            />
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between mt-0.5">
          <span className="text-[9px] text-text-tertiary uppercase tracking-widest truncate">
            {role}
          </span>
          <AnimatePresence mode="wait">
            <motion.span
              key={status}
              initial={{ opacity: 0, x: 4 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -4 }}
              transition={{ duration: 0.15 }}
              className={cn('text-[9px] font-bold uppercase tracking-widest ml-2 flex-shrink-0', STATUS_TEXT[status])}
            >
              {STATUS_LABEL[status]}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>

      {/* Right-edge accent line when active */}
      {isActive && (
        <motion.div
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          exit={{ scaleY: 0 }}
          className={cn('absolute right-0 top-0 bottom-0 w-0.5 rounded-r', dotClass)}
        />
      )}
    </div>
  );
}
