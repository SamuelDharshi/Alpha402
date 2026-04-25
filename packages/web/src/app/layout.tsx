import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"], 
  variable: "--font-inter",
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ["latin"], 
  variable: "--font-jetbrains-mono",
  display: 'swap',
});

export const metadata: Metadata = {
  title: "TradeDesk | Autonomous Trading Crew",
  description: "Deploy a team of AI agents that watches the market, manages risk, and executes trades on Uniswap v4.",
};

import { Web3Provider } from "@/components/providers/Web3Provider";
import { AppContent } from "@/components/layout/AppContent";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans bg-background-primary text-text-primary antialiased`}>
        <Web3Provider>
          <AppContent>
            {children}
          </AppContent>
        </Web3Provider>
      </body>
    </html>
  );
}
