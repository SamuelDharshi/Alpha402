import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
})

export const metadata: Metadata = {
  title: 'TradeDesk — Autonomous Trading Crew',
  description: 'Deploy a team of AI agents that watches the market, manages risk, and executes trades on Uniswap v4',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable}`}>
      <body className="bg-bg-primary text-ink-primary font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
