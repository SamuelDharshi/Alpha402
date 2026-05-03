# Alpha402 — Autonomous DeFi Agent Crew

```text
       ___    __          __            __ __  ____ ___ 
      /   |  / /___  ____/ /_  ____ _  / // / / __ \__ \
     / /| | / / __ \/ __  / __ \/ __ `/ / // /_/ / / / __/
    / ___ |/ / /_/ / /_/ / / / / /_/ / /__  __/ /_/ / /_/ 
   /_/  |_/_/ .___/\__,_/_/ /_/\__,_/    /_/  \____/____/ 
           /_/                                            
```

> **Your autonomous trading crew, deployed in one message.**

[![ETHGlobal Open Agents](https://img.shields.io/badge/ETHGlobal-Open%20Agents%202026-blue?style=flat-square)](https://ethglobal.com/showcase/shawarma-orchestrate-rfyhe)
[![Sepolia](https://img.shields.io/badge/Network-Sepolia%20Testnet-purple?style=flat-square)](https://sepolia.etherscan.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

---

## 💡 The Idea

Alpha402 is a **multi-agent autonomous DeFi trading system** designed to remove the friction of manual trading. Instead of navigating complex DEX UIs or monitoring charts 24/7, you simply tell your "crew" what you want to achieve in plain English.

The system is powered by a specialized crew of four AI agents that communicate via a decentralized P2P mesh, reason using TEE-verified AI, persist their thoughts on decentralized storage, and execute trades through a fail-safe keeper network.

### Why Alpha402?
- **Intent-Based:** No complicated scripts. "Buy ETH if it hits $2400" is all you need.
- **Autonomous:** Once dispatched, the crew works 24/7.
- **Verifiable:** All AI reasoning is performed in TEEs (via 0G Compute) and logged on-chain (via 0G Storage).
- **Fail-Safe:** Execution is handled by KeeperHub, ensuring trades land even during gas spikes.

---

## 🏗️ Architecture & Flow

Alpha402 operates as a decentralized mesh of agents. Here is how the system components interact:

### 1. High-Level System Overview
```text
  ┌────────────────┐      ┌────────────────┐      ┌────────────────┐
  │  TELEGRAM BOT  │ ────▶│   COMMANDER    │ ────▶│   0G COMPUTE   │
  │  (User Intent) │      │  (Orchestrator)│      │  (AI Reasoning)│
  └────────────────┘      └───────┬────────┘      └────────────────┘
                                  │
                  ┌───────────────┴───────────────┐
                  ▼                               ▼
          ┌──────────────┐                ┌──────────────┐
          │    INTEL     │                │     RISK     │
          │  (x402 Feed) │                │  (TEE Scorer)│
          └───────┬──────┘                └───────┬──────┘
                  │                               │
                  └───────────────┬───────────────┘
                                  ▼
          ┌──────────────┐        │        ┌──────────────┐
          │  EXECUTION   │◀───────┘        │  0G STORAGE  │
          │ (KeeperHub)  │                 │ (Audit Log)  │
          └───────┬──────┘                 └──────────────┘
                  │
                  ▼
          ┌──────────────┐
          │  UNISWAP v4  │
          │ (On-Chain)   │
          └──────────────┘
```

### 2. Transaction Lifecycle (Sequence Diagram)

```mermaid
sequenceDiagram
    participant U as User (Telegram)
    participant C as Commander (0G AI)
    participant I as Intel (x402)
    participant R as Risk (0G TEE)
    participant E as Execution (KeeperHub)
    participant S as Storage (0G Storage)

    U->>C: "Buy ETH if < $2500"
    C->>S: Log Intent
    C->>I: Monitor Price Condition
    loop Watcher
        I->>I: Check x402 Price
    end
    I->>C: Condition Met!
    C->>R: Request Risk Score
    R->>R: Analyze Slippage/Gas
    R->>C: Risk Score: 95/100
    C->>E: Execute Strategy
    E->>S: Log Transaction
    E->>U: "Tx Confirmed! ✅"
```

---

## 🤖 The Agent Crew

Each agent in Alpha402 has a specific role, identity (ENS), and logic:

### 🎯 **Commander** (`commander.alpha402.eth`)
The brain of the operation. 
- **Role:** Receives natural language from Telegram.
- **Logic:** Uses **0G Compute** (Llama-3 via TEE) to parse "intent" into a structured `Strategy` object (Target, Trigger, Action).
- **Orchestration:** Dispatches tasks to Intel and Risk agents.

### 📡 **Intel** (`intel.alpha402.eth`)
The eyes of the operation.
- **Role:** Market monitoring.
- **Logic:** Connects to **x402 Protocol** micropayment feeds to get real-time price data.
- **Action:** Triggers the pipeline when the price condition defined by the Commander is met.

### 🛡️ **Risk** (`risk.alpha402.eth`)
The conscience of the operation.
- **Role:** Verification & Safety.
- **Logic:** Performs a final check right before execution. Verifies slippage, checks gas costs, and ensures the wallet has sufficient balance.
- **Scoring:** Returns a confidence score. If < 80%, the trade is aborted.

### ⚡ **Execution** (`execution.alpha402.eth`)
The hands of the operation.
- **Role:** On-chain settlement.
- **Logic:** Routes the trade through **KeeperHub** for guaranteed execution.
- **DEX:** Performs swaps using **Uniswap v4** hooks for optimized routing.

---

## 🌐 The Infrastructure (P2P Mesh)

Agents don't just talk; they form a resilient mesh using **Gensyn AXL**.

```text
          [COMMANDER]
         /   (AXL)   \
        /             \
  [INTEL] ---------- [RISK]
        \   (AXL)     /
         \           /
          [EXECUTION]
```

- **Gensyn AXL:** Provides an encrypted P2P communication layer.
- **0G Storage:** Every A2A (Agent-to-Agent) message is hashed and stored on 0G, providing a permanent, immutable audit trail of the crew's decision-making process.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js 20+**
- **pnpm 9+**
- **Environment Keys:** 0G API Key, Telegram Bot Token, Alchemy/Infura RPC URL.

### 1. Installation
```bash
git clone https://github.com/SamuelDharshi/Alpha402.git
cd Alpha402
pnpm install
```

### 2. Configuration
Copy `.env.example` to `.env` and fill in your keys:
```bash
cp .env.example .env
```
*Crucial keys: `TELEGRAM_BOT_TOKEN`, `ZG_API_KEY`, `SEPOLIA_RPC_URL`.*

### 3. Launching the System
Alpha402 requires three components to run in parallel:

```bash
# Terminal 1: The Agent Crew (The Backend)
npm run dev:agents

# Terminal 2: The Telegram Bot (The Interface)
npm run dev:bot

# Terminal 3: The Mission Control (The Dashboard)
npm run dev
```

---

## 🎮 How to Use

Once the system is running, follow these steps to deploy your first strategy:

1.  **Open Telegram:** Search for your bot (or `@Alpha402bot` if using the live demo).
2.  **Send Intent:** Type a command like:
    - `"Buy 0.1 ETH when the price drops below $2350"`
    - `"Sell my ETH if it goes above $2800"`
3.  **Confirm:** The Commander will reply with a structured summary of the strategy.
4.  **Monitor Dashboard:** Open `http://localhost:3000/dashboard`. You will see:
    -   **The Pipeline Graph:** Lights up as agents communicate.
    -   **Live Log:** See raw A2A messages being persisted to 0G Storage.
5.  **Execution:** Once the trigger hits, the Execution agent will post a transaction link to the chat.

---

## 🏗️ Hackathon Submission Coverage

### Sponsor Integrations
| Sponsor | Integration Detail |
|---|---|
| **0G Compute Network** | TEE-verified AI inference for Commander strategy parsing and Risk scoring |
| **0G Storage** | Every A2A message and strategy state persisted on-chain for audit trail |
| **Gensyn AXL** | P2P encrypted mesh for agent-to-agent communication |
| **KeeperHub** | Guaranteed execution with keeper bots — retries on gas spikes |
| **Uniswap v4** | DeFi execution layer with custom hooks for strategy enforcement |
| **ENS** | Agent identities: `commander.alpha402.eth`, `intel.alpha402.eth`, etc. |

### Links & Resources
- **Demo Video:** [🔴 Awaiting Link]
- **Live Dashboard:** [alpha402.vercel.app](https://alpha402.vercel.app/dashboard)
- **Smart Contracts:** [`0x7e4198E452921E32c30eeEfc9d58e63810b835D6`](https://sepolia.etherscan.io/address/0x7e4198E452921E32c30eeEfc9d58e63810b835D6)

---

## 📜 License
MIT © 2026 Samuel Dharshi
