"use client";

import React from 'react';
import '@rainbow-me/rainbowkit/styles.css';
import {
  getDefaultConfig,
  RainbowKitProvider,
  darkTheme,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider, http } from 'wagmi';
import {
  mainnet,
  sepolia,
} from 'wagmi/chains';
import {
  QueryClientProvider,
  QueryClient,
} from "@tanstack/react-query";
import type { Config } from 'wagmi';

// Custom Unichain Testnet definition
const unichainTestnet = {
  id: 1301,
  name: 'Unichain Testnet',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc-testnet.unichain.org'] },
  },
  blockExplorers: {
    default: { name: 'Uniscan', url: 'https://uniscan.org' },
  },
  testnet: true,
} as const;

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false);
  const [config, setConfig] = React.useState<Config | null>(null);
  const [queryClient, setQueryClient] = React.useState<QueryClient | null>(null);
  
  React.useEffect(() => {
    setConfig(
      getDefaultConfig({
        appName: 'Alpha402',
        projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_ID || 'b56e18d47c72ab683b10817fe9485684',
        chains: [unichainTestnet, mainnet, sepolia],
        ssr: false, // Turn off SSR for Wagmi
        transports: {
          [unichainTestnet.id]: http(),
          [mainnet.id]: http(),
          [sepolia.id]: http(),
        },
      })
    );
    setQueryClient(new QueryClient());
    setMounted(true);
  }, []);

  if (!mounted || !config || !queryClient) return null;

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider 
          theme={darkTheme({
            accentColor: '#1E6FFF',
            accentColorForeground: 'white',
            borderRadius: 'small',
            fontStack: 'system',
            overlayBlur: 'small',
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
