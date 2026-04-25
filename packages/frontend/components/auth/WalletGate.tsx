'use client'
import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import TradingFloor from '@/components/scene/TradingFloor'

export default function WalletGate({ children }: { children: React.ReactNode }) {
  const { isConnected } = useAccount()

  if (isConnected) return <>{children}</>

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <div className="absolute inset-0 opacity-30 blur-sm">
        <TradingFloor className="w-full h-full" autoRotate={true} />
      </div>
      <div className="relative z-10 flex items-center justify-center h-full">
        <div className="bg-bg-secondary border border-blue-muted rounded-lg p-8 max-w-sm w-full mx-4 text-center"
          style={{ boxShadow: '0 0 40px rgba(30,111,255,0.2)' }}>
          <div className="w-12 h-12 rounded-full bg-blue-dim border border-blue-base flex items-center justify-center mx-auto mb-4">
            <span className="text-xl">⬡</span>
          </div>
          <h2 className="font-mono text-lg font-bold text-ink-primary mb-2">Connect Wallet</h2>
          <p className="text-ink-secondary text-sm mb-6">Connect to deploy your autonomous trading crew</p>
          <ConnectButton />
          <p className="font-mono text-xs text-ink-tertiary mt-4">
            Unichain Testnet · Sepolia
          </p>
        </div>
      </div>
    </div>
  )
}
