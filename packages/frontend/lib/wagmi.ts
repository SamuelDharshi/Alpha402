import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { sepolia } from 'wagmi/chains'
import { defineChain } from 'viem'

export const unichainTestnet = defineChain({
  id: 1301,
  name: 'Unichain Testnet',
  nativeCurrency: { decimals: 18, name: 'Ether', symbol: 'ETH' },
  rpcUrls: {
    default: { http: ['https://sepolia.unichain.org'] },
  },
  blockExplorers: {
    default: { name: 'Uniscan', url: 'https://sepolia.uniscan.xyz' },
  },
  testnet: true,
})

export const wagmiConfig = getDefaultConfig({
  appName: 'TradeDesk',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_ID || 'placeholder',
  chains: [unichainTestnet, sepolia],
  ssr: true,
})
