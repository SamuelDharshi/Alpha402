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

const config = getDefaultConfig({
  appName: 'Alpha402',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_ID || '732e4d29e7127e7f7b3e3e3e3e3e3e3e',
  chains: [unichainTestnet, mainnet, sepolia],
  ssr: true,
  transports: {
    [unichainTestnet.id]: http(),
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
});

const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false);
  
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

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
