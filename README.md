# Alpha402 — Autonomous DeFi Agent Crew

> *Your autonomous trading crew, deployed in one message.*

[![ETHGlobal Open Agents](https://img.shields.io/badge/ETHGlobal-Open%20Agents%202026-blue?style=flat-square)](https://ethglobal.com/showcase/shawarma-orchestrate-rfyhe)
[![Sepolia](https://img.shields.io/badge/Network-Sepolia%20Testnet-purple?style=flat-square)](https://sepolia.etherscan.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

---

## What is Alpha402?

Alpha402 is a **multi-agent autonomous DeFi trading system** that watches markets, reasons about risk, and executes on-chain — triggered entirely by a single Telegram message.

You tell it what to do. It handles the rest, 24/7.

```
You: "buy ETH when it drops below $2500"
Alpha402: [watches] → [reasons] → [executes] → Tx confirmed ✅
```

---

## Architecture

```
Telegram Bot (@Alpha402bot)
        │
        ▼
┌───────────────┐
│   COMMANDER   │  Parses intent → builds strategy (0G AI)
└──────┬────────┘
       │
  ┌────┴────┐
  │         │
┌─▼──┐  ┌──▼──┐
│INTEL│  │RISK │  Watches price feeds (x402) + scores risk (0G TEE)
└─┬──┘  └──┬──┘
  └────┬───┘
       ▼
┌──────────────┐
│  CONSENSUS   │  Commander verdict — YES or NO
└──────┬───────┘
       ▼
┌──────────────┐
│  EXECUTION   │  KeeperHub → Uniswap v4 → on-chain tx
└──────────────┘
       │
       ▼
  Dashboard (localhost:3000/dashboard)
  Live pipeline visualization
```

---

## Sponsor Integrations

| Sponsor | Usage |
|---|---|
| **0G Compute Network** | TEE-verified AI inference for Commander strategy parsing and Risk scoring |
| **0G Storage** | Every A2A message persisted on-chain for audit trail and recovery |
| **Gensyn AXL** | P2P encrypted mesh for agent-to-agent communication (fallback: in-process EventEmitter) |
| **KeeperHub** | Guaranteed execution with keeper bots — retries on gas spikes |
| **Uniswap v4** | DeFi execution layer with hooks support |
| **ENS** | Agent identities: `commander.alpha402.eth`, `intel.alpha402.eth`, etc. |
| **x402 Protocol** | Micropayments for price data feeds consumed by Intel agent |

---

## Stack

- **Frontend**: Next.js 16, Tailwind CSS v4, Zustand, Space Grotesk / Bebas Neue
- **Backend**: Node.js, TypeScript, WebSocket (ws), tsx
- **AI**: 0G Compute Network (TEE-verified Llama inference)
- **Storage**: 0G Decentralised Storage
- **Blockchain**: Ethers.js, Sepolia testnet, Solidity contracts
- **Bot**: Grammy (Telegram Bot API)

---

## Live Demo

- **Dashboard**: [alpha402.vercel.app](https://alpha402.vercel.app/dashboard)
- **Landing**: [alpha402.vercel.app](https://alpha402.vercel.app)
- **Telegram Bot**: [@Alpha402bot](https://t.me/Alpha402bot)
- **StrategyVault Contract**: [`0x7e4198E452921E32c30eeEfc9d58e63810b835D6`](https://sepolia.etherscan.io/address/0x7e4198E452921E32c30eeEfc9d58e63810b835D6)
- **Confirmed tx**: [`0x5382e3de...`](https://sepolia.etherscan.io/tx/0x5382e3de24343205d834bbbba8b95ab569612bfc02607d4bdae245b5a4e27306)

---

## Repository Structure

```
Alpha402/
├── alpha402/          # Next.js frontend (dashboard + landing page)
│   ├── app/
│   │   ├── page.tsx           # Landing page
│   │   └── dashboard/page.tsx # Mission Control dashboard
│   ├── components/
│   │   ├── dashboard/PipelineGraph.tsx  # Live agent flow SVG
│   │   └── landing/                     # Hero, marquee, features
│   └── lib/
│       ├── store.ts           # Zustand store + WebSocket client
│       └── types.ts           # Shared type definitions
│
├── agents/            # Multi-agent backend (Node.js)
│   └── src/
│       ├── agents/            # Commander, Intel, Risk, Execution
│       ├── bus/               # AgentBus (EventEmitter + AXL P2P)
│       ├── ws/server.ts       # WebSocket dashboard bridge
│       └── index.ts           # Entrypoint — boots all 4 agents
│
├── bot/               # Telegram bot (Grammy)
│   └── src/index.ts
│
├── shared/            # Shared TypeScript types (A2AMessage, Strategy, etc.)
│
└── contracts/         # Solidity — StrategyVault, PaymentsProcessor
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- A Sepolia RPC endpoint (Alchemy/Infura)
- Telegram Bot Token (from @BotFather)
- 0G Compute API key

### 1. Clone & install

```bash
git clone https://github.com/SamuelDharshi/Alpha402.git
cd Alpha402
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Blockchain
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
PRIVATE_KEY=0x...

# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token

# 0G Network
ZERO_G_RPC_URL=https://evmrpc-test.0g.ai
ZERO_G_PRIVATE_KEY=0x...

# 0G Compute (AI inference)
ZG_COMPUTE_ENDPOINT=https://api.0g.ai
ZG_API_KEY=your_key

# Frontend
NEXT_PUBLIC_WS_URL=ws://localhost:3001
NEXT_PUBLIC_TELEGRAM_BOT_URL=https://t.me/Alpha402bot
```

### 3. Run locally

```bash
# Terminal 1 — Agent crew
npm run dev:agents

# Terminal 2 — Telegram bot
npm run dev:bot

# Terminal 3 — Dashboard
npm run dev
# → http://localhost:3000
```

### 4. Send your first intent

Open Telegram → [@Alpha402bot](https://t.me/Alpha402bot) → type:

```
buy ETH when it drops below $2500
```

Watch the dashboard pipeline light up in real-time.

---

## Dashboard Features

- **Live Pipeline Graph** — visualizes the exact agent workflow (USER INTENT → COMMANDER → INTEL + RISK → CONSENSUS → EXECUTION)
- **Agent Live Feed** — real-time A2A message log with typed icons (Heroicons / Phosphor / React Icons)
- **Control Panel** — dispatch strategies directly from the UI, view confirmed transactions with Etherscan links
- **WebSocket Bridge** — auto-reconnects to the agent bus on `ws://localhost:3001`

---

## Smart Contracts (Sepolia)

| Contract | Address |
|---|---|
| StrategyVault | `0x7e4198E452921E32c30eeEfc9d58e63810b835D6` |
| PaymentsProcessor | `0xDFA20Faa8A0094B5dC3065b3315F8F818971eB39` |

---

## Hackathon

Built for **ETHGlobal Open Agents 2026**.

Sponsor prize tracks targeted:
- 🥇 0G Network — AI + Storage integration
- 🥇 Gensyn — AXL P2P agent mesh
- 🥇 KeeperHub — guaranteed on-chain execution
- 🥇 Uniswap v4 — DeFi execution layer

---

## License

MIT © 2026 Samuel Dharshi
