"use client";

import { useEffect } from 'react';
import { useAlphaStore } from '@/lib/store';

/**
 * Invisible component that auto-connects the agent WebSocket
 * (ws://localhost:3001) when the app first loads.
 * Must be inside Web3Provider in the layout.
 */
export function WsInitializer() {
  const connect = useAlphaStore(s => s.connect);
  useEffect(() => {
    connect();
  }, [connect]);
  return null;
}
