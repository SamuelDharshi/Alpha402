import React from "react"
import type { Metadata } from 'next'
import { Instrument_Sans, Instrument_Serif, JetBrains_Mono, Orbitron, Bebas_Neue, Comic_Neue, Dancing_Script, Space_Grotesk } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { WsInitializer } from '@/components/providers/WsInitializer'
import './globals.css'

const instrumentSans = Instrument_Sans({ 
  subsets: ["latin"],
  variable: '--font-instrument'
});

const instrumentSerif = Instrument_Serif({ 
  subsets: ["latin"],
  weight: "400",
  variable: '--font-instrument-serif'
});

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ["latin"],
  variable: '--font-jetbrains'
});

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: '--font-orbitron',
  weight: ["700", "800", "900"],
});

const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  variable: '--font-bebas',
  weight: "400",
});

const comicNeue = Comic_Neue({
  subsets: ["latin"],
  variable: '--font-comic',
  weight: ["400", "700"],
});

const dancingScript = Dancing_Script({
  subsets: ["latin"],
  variable: '--font-dancing',
  weight: ["700"],
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: '--font-space',
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: 'Alpha402 — Autonomous DeFi Trading Crew',
  description: 'Your autonomous trading crew deployed in one message. Multi-agent AI system that watches, reasons, and executes on-chain 24/7 via Telegram.',
  generator: 'alpha402',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className={`${instrumentSans.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable} ${orbitron.variable} ${bebasNeue.variable} ${comicNeue.variable} ${dancingScript.variable} ${spaceGrotesk.variable} font-sans antialiased`}>
        {/* WsInitializer auto-connects to ws://localhost:3001 (agent bus) */}
        <WsInitializer />
        {children}
        <Analytics />
      </body>
    </html>
  )
}
