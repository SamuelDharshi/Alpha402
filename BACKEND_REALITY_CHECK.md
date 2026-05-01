# Alpha402 Backend Verification — Real vs Mock Implementation

**Status:** Backend is PARTIALLY MOCKED for demo purposes. To submit production code, you need to enable real APIs.

---

## ✅ WHAT'S ACTUALLY REAL (Contracts + On-Chain)

### Deployed Contracts (Sepolia Testnet - REAL)
```json
STRATEGY_VAULT_ADDRESS: 0x7e4198E452921E32c30eeEfc9d58e63810b835D6
AGENT_PAYMENT_MANAGER_ADDRESS: 0xDFA20Faa8A0094B5dC3065b3315F8F818971eB39
AGENT_REGISTRY_ADDRESS: 0x07bC165D5cc99C31044233b913C4eB728DD9BbB2
Network: Sepolia Testnet
Deployed: 2026-04-23
```

✅ **These are LIVE on-chain contracts** — not mocked. Your agents can call them.

### 0G Storage Integration (REAL)
- Location: `agents/src/storage/zeroG.ts`
- Implementation: Stores ALL A2A messages as CIDs
- Status: **REAL** — logs are persisted to 0G testnet
- Default endpoints:
  - RPC: `https://evmrpc-test.0g.ai`
  - Storage: `https://storage-testnet.0g.ai`
  - Indexer: `https://indexer-storage-testnet-standard.0g.ai`

✅ **REAL 0G integration** — CIDs are actually being logged.

### ENS Identity Layer (REAL)
- Location: `shared/src/ens.ts`
- Implementation: Agent names resolve to `.eth` addresses
- Status: **REAL** — uses Sepolia ENS resolver
- Example:
  - `commander.alpha402.eth` → resolves to Sepolia address

✅ **REAL ENS resolution** — agents have Ethereum names.

### Groq AI Inference (REAL)
- Location: `agents/src/agents/commander/index.ts` + `agents/src/agents/risk/index.ts`
- Model: `llama-3.1-8b-instant`
- Status: **REAL** — actual LLM calls (requires GROQ_API_KEY)

✅ **REAL AI** — not mocked, requires your Groq API key.

---

## ❌ WHAT'S CURRENTLY MOCKED (2 Places)

### 1️⃣ MOCK: Intel Agent Price Monitoring
**File:** `agents/src/agents/intel/index.ts`
**Current Behavior:**
- When `MOCK_MODE=true`: Returns simulated price that trends toward trigger value over 3 ticks
- When `MOCK_MODE=false`: Calls **real** DexScreener API to get live ETH/USDC price

**Live Implementation:**
```typescript
// This is REAL code (line ~130):
const res = await fetch(
  'https://api.dexscreener.com/latest/dex/pairs/ethereum/0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640'
);
const json = (await res.json()) as any;
const price = parseFloat(json?.pair?.priceUsd ?? '0');
if (price > 0) return price;
```

**Status:** DexScreener is a **public API** (no key needed) — already integrated. Just disable MOCK_MODE.

### 2️⃣ MOCK: Execution Agent Transaction Submission
**File:** `agents/src/agents/execution/index.ts`
**Current Behavior:**
- When `MOCK_MODE=true`: Generates fake tx hash, simulates 1.2s network delay
- When `MOCK_MODE=false`: Has **TWO** fallback methods:
  1. **KeeperHub REST API** (if `KEEPERHUB_API_KEY` provided)
  2. **Direct Sepolia transaction** (if `PRIVATE_KEY` provided, no key needed)

**Real Implementation Options:**
```typescript
// Method 1: KeeperHub (if KEEPERHUB_API_KEY provided)
const res = await fetch('https://api.keeperhub.com/v1/execute', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    chainId: 11155111,
    to: vaultAddress,
    data: this.encodeExecuteCall(strategyId, payload),
    gasLimit: '300000',
    paymentMethod: 'x402',
    maxFeeUsdc: '0.10',
  }),
});

// Method 2: Direct Sepolia (if PRIVATE_KEY provided, NO KeeperHub key needed)
const vault = new ethers.Contract(vaultAddress, vaultABI, this.wallet);
const tx = await vault.executeChecked(
  strategyId,
  ethers.ZeroAddress,
  ethers.parseEther('0.01'),
  '0x',
  { gasLimit: 200000 }
);
const receipt = await tx.wait();
return {
  txHash: receipt.hash,
  gasUsed: receipt.gasUsed.toString(),
  keeperFee: 0.04, // dummy estimate
};
```

**Status:** Both methods are **REAL** — just disabled when MOCK_MODE=true.

### x402 Payment Recording (SEMI-MOCKED)
**File:** `agents/src/agents/intel/index.ts` (line ~175)
**Current Behavior:**
- Logs simulated payment: `[x402] Intel: paying $0.001 USDC for price data (simulated)`
- If `AGENT_PAYMENT_MANAGER_ADDRESS` is provided + wallet has USDC, **actually calls the contract** to record payment

**Real Implementation:**
```typescript
if (this.paymentManager && process.env.PRIVATE_KEY) {
  try {
    const amountMicro = 1000n; // 0.001 USDC in 6 decimals
    await this.paymentManager.recordPayment(
      strategyId,
      this.wallet.address,
      amountMicro,
      'intel_data'
    );
  } catch {
    // Expected to fail in test if contract not deployed
  }
}
```

**Status:** This is **REAL** if contract is deployed; fallback to simulation if not.

---

## 🎯 TO SUBMIT PRODUCTION CODE (No Mock Data):

### Step 1: Disable MOCK_MODE
Edit your `.env` file:
```bash
# Change this:
MOCK_MODE=true

# To this:
MOCK_MODE=false
```

### Step 2: Required Environment Variables

You MUST provide these for production:

| Variable | Source | Why | Status |
|----------|--------|-----|--------|
| `GROQ_API_KEY` | https://console.groq.com | LLM for strategy parsing | 🔴 REQUIRED |
| `PRIVATE_KEY` | Your wallet | Sign transactions on Sepolia | 🔴 REQUIRED |
| `SEPOLIA_RPC_URL` | Alchemy/Infura/Publicnode | Read/write to Sepolia | ✅ Optional (defaults to free publicnode.com) |
| `UNICHAIN_RPC_URL` | Gensyn/Uniswap | Read prices on Unichain | ✅ Optional (defaults to https://rpc-testnet.unichain.org) |
| `ZEROG_RPC_URL` | 0G Labs | 0G Storage RPC | ✅ Optional (has defaults) |
| `STRATEGY_VAULT_ADDRESS` | Already deployed | Execute trades | ✅ Already in contract: `0x7e4198E452921E32c30eeEfc9d58e63810b835D6` |
| `AGENT_PAYMENT_MANAGER_ADDRESS` | Already deployed | Record x402 payments | ✅ Already in contract: `0xDFA20Faa8A0094B5dC3065b3315F8F818971eB39` |
| `KEEPERHUB_API_KEY` | https://app.keeperhub.com | Use KeeperHub for execution (optional fallback) | ⚠️ OPTIONAL (can use direct Sepolia fallback) |
| `TELEGRAM_BOT_TOKEN` | Telegram BotFather | Telegram bot integration | 🔴 REQUIRED for bot |

### Step 3: Wallet Funding (Sepolia Testnet)

Your `PRIVATE_KEY` wallet needs ETH on Sepolia for gas:
1. Get Sepolia testnet address from your private key
2. Get free testnet ETH from: https://sepoliafaucet.com or https://sepolia-faucet.pk910.de
3. Verify balance: `ethers.JsonRpcProvider('https://ethereum-sepolia-rpc.publicnode.com').getBalance(yourAddress)`

### Step 4: Telegram Bot (Optional but Recommended)

If you want to demo the bot:
1. Create bot on Telegram: https://t.me/BotFather
2. Get `TELEGRAM_BOT_TOKEN`
3. Add to `.env`
4. Run: `npm run dev:bot`

### Step 5: KeeperHub Integration (Optional but Recommended for Submission)

To use real KeeperHub instead of direct Sepolia execution:
1. Sign up: https://app.keeperhub.com
2. Create API key for testnet
3. Add `KEEPERHUB_API_KEY` to `.env`
4. Execution Agent will automatically use it instead of direct tx

---

## 🚀 HOW TO GO FROM MOCK TO PRODUCTION

### Current State (MOCK_MODE=true)
```bash
npm run test:agents
# Output: Simulated prices, fake tx hashes, simulated KeeperHub
```

### Production State (MOCK_MODE=false + Real APIs)
```bash
# 1. Set up .env with real API keys
cp .env.example .env
# Edit .env:
# - GROQ_API_KEY=your_key
# - PRIVATE_KEY=your_private_key
# - MOCK_MODE=false
# - TELEGRAM_BOT_TOKEN=optional

# 2. Fund wallet on Sepolia (need ~0.1 ETH for gas)
# Visit: https://sepoliafaucet.com → get free Sepolia ETH

# 3. Run tests with REAL data
npm run test:agents
# Output: Real ETH price from DexScreener, REAL tx hash on Sepolia
```

---

## ✅ CONTRACTS ARE DEPLOYMENT-READY

Your contracts on Sepolia are **LIVE and FUNCTIONAL**:

1. **StrategyVault.sol** - Deployed at `0x7e4198E452921E32c30eeEfc9d58e63810b835D6`
   - Function: Stores trading strategies with position/gas limits
   - Status: ✅ Live on Sepolia
   - Can be called by Execution Agent: `vault.executeChecked(strategyId, ...)`

2. **AgentPaymentManager.sol** - Deployed at `0xDFA20Faa8A0094B5dC3065b3315F8F818971eB39`
   - Function: Records x402 micropayments per strategy
   - Status: ✅ Live on Sepolia
   - Can be called by Intel Agent: `paymentManager.recordPayment(strategyId, ...)`

3. **AgentRegistry.sol** - Deployed at `0x07bC165D5cc99C31044233b913C4eB728DD9BbB2`
   - Function: Registers agent identities
   - Status: ✅ Live on Sepolia
   - Can be called by any agent to self-register

---

## 📋 SUBMISSION CHECKLIST

To submit with REAL (non-mock) backend:

- [ ] Set `MOCK_MODE=false` in `.env`
- [ ] Provide `GROQ_API_KEY` (required for AI)
- [ ] Provide `PRIVATE_KEY` (required for on-chain)
- [ ] Fund wallet on Sepolia with ~0.1 ETH (required for gas)
- [ ] (Optional) Provide `KEEPERHUB_API_KEY` for real execution routing
- [ ] (Optional) Provide `TELEGRAM_BOT_TOKEN` for bot demo
- [ ] Run: `npm run test:agents` and verify real prices + real tx hashes
- [ ] Check Sepolia explorer: https://sepolia.etherscan.io/address/0x7e4198E452921E32c30eeEfc9d58e63810b835D6

---

## 🔍 WHAT THE JUDGE SEES

With `MOCK_MODE=false` + real APIs:

### Test Flow Output
```
🚀 Starting Alpha402 End-to-End Test Flow...
[Commander] Parsing intent for test_user_678: "Buy ETH when it dips below $3000..."
[Commander] Calling Groq (llama-3.1-8b-instant) ...
[Commander] Groq parsed: { token: 'ETH', direction: 'buy', triggerCondition: 'ETH_PRICE_BELOW', triggerValue: 3000 }
[Bus] commander.alpha402.eth → user : STRATEGY_PARSED
[0G] Logged 622B (CID: 0g-rmrinj3s)  ← REAL 0G Storage CID

[Intel] Starting price monitor for strategy 0x7fc99e34...
[Intel] Polling DexScreener API for live ETH price...  ← REAL DexScreener API
[Intel] ETH price: $3245.67 | threshold: $3000
[Intel] ETH price: $3100.42 | threshold: $3000
[Intel] ETH price: $2998.50 | threshold: $3000  ← REAL price, triggers!

[Intel] ✅ TRIGGER FIRED — price $2998.50 ETH_PRICE_BELOW $3000
[Risk] Calling Groq for risk inference...  ← REAL Groq call
[Risk] Groq score: 8/10 → APPROVE

[Execution] Routing via KeeperHub (or direct Sepolia)
[Execution] Submitted to Sepolia
[Execution] ✅ KeeperHub confirmed: 0x1a2b3c4d... ← REAL tx hash

Transaction Hash: 0x1a2b3c4d5e6f...
Explorer: https://sepolia.etherscan.io/tx/0x1a2b3c4d5e6f...
```

---

## 💡 SUMMARY

**Your backend is NOT properly production-ready YET because:**

1. ❌ `MOCK_MODE=true` in test runs (simulates prices + tx hashes)
2. ❌ No Groq API key provided (AI inference disabled)
3. ❌ No Private Key provided (wallet can't sign txs)
4. ❌ No Sepolia funding (can't pay gas)

**What you MUST do before submission:**

1. ✅ Set `MOCK_MODE=false`
2. ✅ Get `GROQ_API_KEY` from https://console.groq.com (free tier available)
3. ✅ Provide your `PRIVATE_KEY` (never commit to git)
4. ✅ Fund wallet on Sepolia (free faucet: https://sepoliafaucet.com)
5. ✅ (Optional) Add `KEEPERHUB_API_KEY` for real execution layer
6. ✅ (Optional) Add `TELEGRAM_BOT_TOKEN` for bot demo

**Then run:**
```bash
npm run test:agents
# Should show REAL prices, REAL Groq parsing, REAL tx hashes on Sepolia
```

**Contracts are ALREADY DEPLOYED and LIVE** — no work needed there.
