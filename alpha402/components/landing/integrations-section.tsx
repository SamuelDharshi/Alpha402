"use client";

import { useEffect, useState, useRef } from "react";

const integrations = [
  { name: "0G Storage", category: "Audit Trails" },
  { name: "Uniswap v4", category: "Liquidity" },
  { name: "Gensyn AXL", category: "P2P Comms" },
  { name: "KeeperHub", category: "Execution" },
  { name: "Groq AI", category: "Inference" },
  { name: "Sepolia", category: "Testnet" },
  { name: "0G Chain", category: "dAIOS" },
  { name: "AXL Mesh", category: "Discovery" },
  { name: "Hardhat", category: "Contracts" },
  { name: "Telegram", category: "Interface" },
  { name: "x402", category: "Payments" },
  { name: "Llama 3.1", category: "Brain" },
];

export function IntegrationsSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="integrations" ref={sectionRef} className="relative py-24 lg:py-32 overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Header */}
        <div
          className={`text-center max-w-3xl mx-auto mb-16 lg:mb-24 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-6">
            <span className="w-8 h-px bg-foreground/30" />
            Integrations
            <span className="w-8 h-px bg-foreground/30" />
          </span>
          <h2 className="text-4xl lg:text-6xl font-display tracking-tight mb-6">
            Works with everything
            <br />
            you already use.
          </h2>
          <p className="text-xl text-muted-foreground">
            200+ pre-built integrations. Connect your entire stack in minutes.
          </p>
        </div>

      </div>
      
      {/* Full-width marquees outside container */}
      <div className="w-full mb-6">
        <div className="flex gap-6 marquee">
          {[...Array(2)].map((_, setIndex) => (
            <div key={setIndex} className="flex gap-6 shrink-0">
              {integrations.map((integration) => (
                  <div 
                    key={`${integration.name}-${setIndex}`}
                    className="shrink-0 px-8 py-6 border border-foreground/10 hover:border-foreground/30 hover:bg-foreground/[0.02] transition-all duration-300 group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500" />
                    <div className="relative z-10">
                      <div className="text-lg font-medium group-hover:translate-x-1 transition-transform">
                        {integration.name}
                      </div>
                      <div className="text-sm text-muted-foreground">{integration.category}</div>
                    </div>
                  </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      
      {/* Reverse marquee */}
      <div className="w-full">
        <div className="flex gap-6 marquee-reverse">
          {[...Array(2)].map((_, setIndex) => (
            <div key={setIndex} className="flex gap-6 shrink-0">
              {[...integrations].reverse().map((integration) => (
                <div
                  key={`${integration.name}-reverse-${setIndex}`}
                  className="shrink-0 px-8 py-6 border border-foreground/10 hover:border-foreground/30 hover:bg-foreground/[0.02] transition-all duration-300 group relative overflow-hidden"
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500" />
                  <div className="relative z-10">
                    <div className="text-lg font-medium group-hover:translate-x-1 transition-transform">
                      {integration.name}
                    </div>
                    <div className="text-sm text-muted-foreground">{integration.category}</div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
