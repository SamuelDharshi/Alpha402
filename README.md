# Alpha402

Alpha402 is a multi-agent autonomous DeFi trading system.

## Architecture

Alpha402 consists of 4 specialized agents:
- **Commander**: Parses user intent and coordinates the crew.
- **Intel**: Monitors price feeds and identifies triggers.
- **Risk**: Scores trades using Gensyn inference and on-chain limits.
- **Execution**: Executes trades on Uniswap v4 via KeeperHub.

All agents communicate via a shared **Agent Bus** and persist their history to **0G Storage**.

## Quickstart

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   Copy `.env.example` to `.env` and fill in the required keys.
   ```bash
   cp .env.example .env
   ```

3. **Deploy Smart Contracts**:
   ```bash
   cd packages/contracts
   forge script script/Deploy.s.sol --rpc-url $UNICHAIN_RPC_URL --broadcast
   ```

4. **Start the Agent System**:
   ```bash
   npm run dev:agents
   ```

5. **Start the Telegram Bot**:
   ```bash
   npm run dev:bot
   ```

6. **Start the Frontend Dashboard**:
   ```bash
   npm run dev
   ```

## Tech Stack
- **Runtime**: Node.js 20 + tsx
- **Language**: TypeScript 5
- **Contracts**: Solidity 0.8.24 (Foundry)
- **Agents**: OpenAI SDK, Ethers.js
- **Storage**: 0G Labs SDK
- **Inference**: Gensyn RPC
- **Execution**: KeeperHub API
- **Telegram**: grammy SDK
- **Frontend**: Next.js 14, Three.js, R3F

## License
MIT
