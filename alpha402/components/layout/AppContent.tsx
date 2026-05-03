"use client";

import React, { useEffect } from 'react';
import { useAlphaStore } from '@/lib/store';

interface AppContentProps {
  children: React.ReactNode;
}

export function AppContent({ children }: AppContentProps) {
  const connect = useAlphaStore(state => state.connect);

  useEffect(() => {
    connect();
  }, [connect]);

  return <>{children}</>;
}
