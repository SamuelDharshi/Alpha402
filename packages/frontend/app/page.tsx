import TradingFloor from '@/components/scene/TradingFloor'
import ConnectionStatus from '@/components/ui/ConnectionStatus'
import Link from 'next/link'

const sponsors = ['Uniswap', '0G Labs', 'Gensyn', 'KeeperHub']

const problems = [
  { num: '01', title: '6 browser tabs', desc: 'Monitoring Uniswap, Dexscreener, GMX, Aave, X, and your portfolio tracker simultaneously.' },
  { num: '02', title: '3am price alerts', desc: 'Waking up to a missed entry. The trigger fired. You were asleep. The trade is gone.' },
  { num: '03', title: 'Manual execution, MEV\'d', desc: 'You finally execute. Your transaction is public. A bot sandwiches you before confirmation.' },
]

const crew = [
  { id: 'commander', color: '#1E6FFF', label: 'CMD', title: 'Commander', role: 'Parses your plain English strategy and coordinates the entire crew.', cap: 'GPT-4o strategy parsing + A2A orchestration' },
  { id: 'intel', color: '#00F5FF', label: 'INTEL', title: 'Intel Agent', role: 'Watches price feeds 24/7 and fires when your trigger condition is met.', cap: 'DexScreener API via x402 micropayments' },
  { id: 'risk', color: '#F59E0B', label: 'RISK', title: 'Risk Agent', role: 'Scores every trade proposal using Gensyn decentralized inference.', cap: 'Gensyn sealed inference + DAG memory' },
  { id: 'execution', color: '#00FF88', label: 'EXEC', title: 'Execution Agent', role: 'Routes approved trades through KeeperHub with MEV protection.', cap: 'KeeperHub x402 + Uniswap v4 hooks' },
]

const steps = [
  { agent: 'CMD', step: '01', title: 'Type a strategy', desc: 'Message the Telegram bot in plain English' },
  { agent: 'INTEL', step: '02', title: 'Intel watches 24/7', desc: 'Price feeds polled every 10 seconds via x402' },
  { agent: 'RISK', step: '03', title: 'Risk scores the trade', desc: 'Gensyn inference with DAG memory context' },
  { agent: 'EXEC', step: '04', title: 'Execution fires', desc: 'KeeperHub routes with retry + MEV protection' },
]

export default function Home() {
  return (
    <div className="bg-bg-primary min-h-screen">
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-3 border-b border-blue-muted bg-bg-primary bg-opacity-90 backdrop-blur">
        <span className="font-mono text-sm font-bold text-ink-primary tracking-widest">TRADEDESK</span>
        <div className="flex items-center gap-4">
          <ConnectionStatus />
          <Link href="/dashboard" className="font-mono text-xs text-ink-secondary hover:text-ink-primary border border-blue-muted px-3 py-1.5 rounded hover:border-blue-base transition-colors">
            Dashboard →
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="flex h-screen pt-12">
        {/* 3D scene left */}
        <div className="hidden md:block w-3/5 h-full">
          <TradingFloor className="w-full h-full" autoRotate={true} />
        </div>

        {/* Hero text right */}
        <div className="w-full md:w-2/5 flex flex-col justify-center px-8 md:px-12">
          <div className="inline-flex items-center gap-2 mb-6">
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 6px #10B981', display: 'inline-block' }} />
            <span className="font-mono text-xs text-ink-tertiary tracking-widest">
              LIVE ON UNICHAIN · ETHGLOBAL OPEN AGENTS 2026
            </span>
          </div>
          <h1 className="font-sans text-4xl md:text-5xl font-bold text-ink-primary leading-tight mb-6">
            Your autonomous<br />
            trading crew.<br />
            <span style={{ color: '#1E6FFF' }}>One message.</span>
          </h1>
          <p className="text-ink-secondary text-base leading-relaxed mb-8 max-w-sm">
            Deploy a team of AI agents that watches the market,
            manages risk, and executes trades on Uniswap v4 —
            while you sleep.
          </p>
          <div className="flex gap-3 mb-10 flex-wrap">
            <a href="https://t.me/your_bot" target="_blank" rel="noopener"
              className="font-mono text-sm px-5 py-2.5 rounded border border-blue-base text-ink-primary hover:bg-blue-dim transition-colors">
              Open Telegram Bot
            </a>
            <Link href="/dashboard"
              className="font-mono text-sm px-5 py-2.5 rounded bg-blue-base text-white hover:opacity-90 transition-opacity">
              View Dashboard →
            </Link>
          </div>
          <div className="flex gap-4 flex-wrap">
            {sponsors.map(s => (
              <span key={s} className="font-mono text-xs text-ink-tertiary border border-blue-dim px-2 py-1 rounded">
                {s}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* THE PROBLEM */}
      <section className="px-8 py-20 max-w-5xl mx-auto">
        <p className="font-mono text-xs text-ink-tertiary mb-6 tracking-widest">THE PROBLEM</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {problems.map(p => (
            <div key={p.num} className="bg-bg-secondary border border-blue-dim rounded-lg p-6 hover:border-blue-muted transition-colors">
              <div className="font-mono text-3xl font-bold text-ink-tertiary mb-3">{p.num}</div>
              <div className="font-sans text-base font-semibold text-ink-primary mb-2">{p.title}</div>
              <div className="text-ink-secondary text-sm leading-relaxed">{p.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* THE CREW */}
      <section className="px-8 py-10 max-w-5xl mx-auto">
        <p className="font-mono text-xs text-ink-tertiary mb-6 tracking-widest">THE CREW</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {crew.map(agent => (
            <div key={agent.id} className="bg-bg-secondary rounded-lg p-5 hover:bg-bg-tertiary transition-colors"
              style={{ borderLeft: `3px solid ${agent.color}` }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded"
                  style={{ background: `${agent.color}22`, color: agent.color }}>
                  {agent.label}
                </span>
                <span className="font-sans font-semibold text-ink-primary">{agent.title}</span>
              </div>
              <p className="text-ink-secondary text-sm mb-2">{agent.role}</p>
              <p className="font-mono text-xs text-ink-tertiary">{agent.cap}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="px-8 py-10 pb-24 max-w-5xl mx-auto">
        <p className="font-mono text-xs text-ink-tertiary mb-8 tracking-widest">HOW IT WORKS</p>
        <div className="flex flex-col md:flex-row gap-0 relative">
          {steps.map((step, i) => (
            <div key={i} className="flex-1 flex flex-col md:flex-row items-start md:items-stretch">
              <div className="bg-bg-secondary border border-blue-dim rounded-lg p-5 flex-1 hover:border-blue-muted transition-colors">
                <div className="font-mono text-xs text-ink-tertiary mb-1">{step.step}</div>
                <div className="font-mono text-xs font-bold text-ink-mono mb-2">[{step.agent}]</div>
                <div className="font-sans font-semibold text-ink-primary text-sm mb-1">{step.title}</div>
                <div className="text-ink-secondary text-xs">{step.desc}</div>
              </div>
              {i < steps.length - 1 && (
                <div className="hidden md:flex items-center px-2">
                  <span className="text-blue-muted text-lg">→</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
