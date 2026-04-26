# Alpha402

Alpha402 is an autonomous multi-agent DeFi trading system built for the ETHGlobal Open Agents 2026 hackathon. It utilizes a crew of specialized AI agents to execute intent-based trading strategies on Uniswap v4 via Unichain, leveraging cutting-edge sponsor technologies for storage, communication, and execution.

## 🚀 Overview

The Alpha402 platform allows users to deploy a personalized fleet of AI agents using natural language. Instead of manually monitoring charts and worrying about MEV extraction, users simply message the Telegram bot (e.g., "Buy 1 ETH when the price dips below $3000"). The agent crew handles the rest: watching price feeds 24/7, scoring the risk of the trade, and executing the transaction securely.

### Core Features

- **Intent-Based Trading:** Define strategies in plain English via Telegram.
- **Multi-Agent Orchestration:** A specialized crew (Commander, Intel, Risk, Execution) handles parsing, monitoring, risk assessment, and execution.
- **DeFi Execution:** Integrates with Uniswap v4 hooks for precise trading.
- **Cyberpunk 3D Dashboard:** A visually stunning React Three Fiber (R3F) dashboard to monitor your agents' activity and x402 micropayments in real-time.

## 🛠️ Technology Stack

- **Frontend:** Next.js 14, TailwindCSS, React Three Fiber (R3F), Zustand
- **Backend/Agents:** Node.js, `tsx`, ethers.js, Groq SDK
- **Blockchain/Infrastructure:**
  - **Unichain:** Target network for low-latency DeFi execution.
  - **0G Storage:** Decentralized logging and state persistence for agents.
  - **Gensyn AXL:** P2P mesh communication layer between agents.
  - **KeeperHub:** Reliable, MEV-protected transaction execution.
  - **Uniswap v4:** Trading and liquidity hooks.

## 🤖 Multi-Agent Workflow Sequence

The system operates through a coordinated sequence of agent interactions:

```mermaid
sequenceDiagram
    actor User
    participant Bot as Telegram Bot
    participant CMD as Commander Agent
    participant INT as Intel Agent
    participant RSK as Risk Agent
    participant EXC as Execution Agent
    participant KH as KeeperHub / Chain

    User->>Bot: "Buy 1 ETH when price < $3000"
    Bot->>CMD: Forward intent
    CMD->>CMD: Parse intent into JSON Strategy
    CMD->>INT: Deploy monitoring task (Strategy ID)
    
    loop Every 10 Seconds
        INT->>INT: Poll DexScreener API (x402 payment)
    end
    
    Note over INT: Price drops below $3000
    INT->>CMD: Trigger Condition Met
    CMD->>RSK: Request Risk Score
    
    RSK->>RSK: Run decentralized inference (Gensyn)
    Note over RSK: Evaluates slippage, liquidity, MEV risk
    RSK-->>CMD: Risk Score: APPROVED
    
    CMD->>EXC: Execute Trade (Strategy ID)
    EXC->>KH: Submit signed transaction
    KH-->>EXC: Transaction Confirmed
    EXC-->>CMD: Execution Success
    CMD-->>Bot: "Trade executed successfully! P&L tracked."
    Bot-->>User: Notification sent
```

## 🏗️ Project Structure

- `frontend/`: The Next.js 14 Web3 dashboard with a fully interactive 3D command center.
- `agents/`: The backend agent crew logic, managing the AXL P2P mesh and LLM inference.
- `bot/`: The Telegram bot interface for interacting with the system.
- `contracts/`: Hardhat workspace for custom Uniswap v4 hooks and Alpha402 payment contracts.
- `shared/`: Shared TypeScript types, utility functions, and constants.

## 🏃 Getting Started

### Prerequisites
- Node.js (v20+)
- npm

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/SamuelDharshi/Alpha402.git
   cd Alpha402
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Fill in the required keys in .env
   ```

### Running the Project locally
The system is managed from the root directory using npm workspaces.

1. **Start the Agent Backend:**
   ```bash
   npm run dev:agents
   ```
   *(This starts the Commander, Intel, Risk, and Execution agents and exposes the WebSocket server on port 3001).*

2. **Start the Frontend Dashboard:**
   In a new terminal window:
   ```bash
   npm run dev
   ```
   *(The dashboard will be available at `http://localhost:3000`).*

3. **Start the Telegram Bot (Optional):**
   ```bash
   npm run dev:bot
   ```

## 📜 License
MIT
