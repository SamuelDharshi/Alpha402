# Alpha402 — Product Requirements Document

> **Hackathon:** ETHGlobal Open Agents · April 24 – May 6, 2026  
> **Prize Pool:** $50,000+ · Sponsors: Uniswap Foundation, 0G Labs, Gensyn, KeeperHub  
> **Version:** 1.0 · Status: Live

---

## Table of Contents

1. [Project Vision](#1-project-vision)
2. [Judge Alignment Strategy](#2-judge-alignment-strategy)
3. [The Problem We're Solving](#3-the-problem-were-solving)
4. [Product Overview](#4-product-overview)
5. [Architecture Overview](#5-architecture-overview)
6. [Repository Structure](#6-repository-structure)
7. [Frontend — `packages/agents/dashboard/`](#7-frontend--frontend)
8. [Smart Contracts — `packages/contracts/`](#8-smart-contracts--contracts)
9. [Agent System — `packages/agents/`](#9-agent-system--agents)
10. [Telegram Bot — `packages/bot/`](#10-telegram-bot--bot)

---

## 1. Project Vision

### Tagline
**"Your autonomous trading crew, deployed in one message."**

### One-liner
Alpha402 is a multi-agent autonomous trading system that lets DeFi traders define strategies in plain English via Telegram, while a crew of specialised AI agents — Commander, Intel, Risk, and Execution — watches, reasons, and executes on-chain 24/7 without human babysitting.

### Core Thesis
The critical UX gap in DeFi today is not a lack of tools — it's a lack of *delegation*. Traders are overwhelmed managing strategies across 6 tabs, setting dumb price alerts, and manually executing trades at 3am with sweaty hands. Alpha402 closes that gap by collapsing natural language → strategy → live execution → audit trail into a single Telegram thread powered by a self-funding agent economy running on x402.

---

## 2. Judge Alignment Strategy

### What ETHGlobal Open Agents Judges Look For

| Signal | How Alpha402 Delivers It |
|--------|---------------------------|
| **Real-world UX problem** | DeFi traders manually babysit positions across multiple tabs |
| **Not just infrastructure** | Alpha402 is a complete product a non-developer would use tomorrow |
| **Multi-agent collaboration** | 4 specialised agents with explicit A2A communication via Gensyn AXL |
| **x402 agentic payments** | Intel Agent pays for data; Execution Agent pays KeeperHub per tx |
| **Agent-to-agent communication** | Agents pass JSON messages via P2P mesh; logs on 0G storage |
| **Sponsor depth** | All 4 sponsor tracks targeted: Uniswap, 0G Labs, Gensyn, KeeperHub |

---

## 4. Product Overview

### User Flow

1. User types in Telegram: "Buy ETH when it dips below $3,000. Max 0.5 ETH."
2. **Commander Agent** parses intent using Groq AI → structured Strategy.
3. **Intel Agent** monitors price feeds (logs data cost via x402).
4. **Risk Agent** scores the trade using Groq LLM (Gensyn track).
5. **Execution Agent** submits via **KeeperHub** (guaranteed execution).
6. **Telegram reply** with Tx hash and explorer link.

---

## 5. Architecture Overview

- **AI**: Groq (Llama 3.1) for inference.
- **Storage**: 0G Storage for persistent audit trails.
- **P2P Comms**: Gensyn AXL for agent-to-agent messaging.
- **Execution**: KeeperHub for transaction reliability on Sepolia.
- **Contracts**: Hardhat-based on Sepolia testnet.
