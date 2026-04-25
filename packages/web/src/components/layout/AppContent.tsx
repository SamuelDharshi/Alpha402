"use client";

import React, { useEffect } from 'react';
import { useTradeDesk } from '@/lib/useTradeDesk';

interface AppContentProps {
  children: React.ReactNode;
}

export function AppContent({ children }: AppContentProps) {
  const connect = useTradeDesk(state => state.connect);

  useEffect(() => {
    connect();
  }, [connect]);

  return <>{children}</>;
}
