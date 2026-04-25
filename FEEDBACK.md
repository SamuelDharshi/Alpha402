# FEEDBACK — Uniswap Developer Platform
> Required for prize eligibility per Uniswap Foundation track rules.

## What We Built
Alpha402 integrates Uniswap's infrastructure to enable an autonomous multi-agent DeFi trading system. The Intel Agent monitors ETH/USDC price feeds, the Commander Agent parses natural-language strategies using Groq AI, and the Execution Agent routes approved trades through the Uniswap ecosystem.

## What Worked Well

### Uniswap v4 Hook Architecture (Excellent)
The hook permission system (`beforeSwap` / `afterSwap`) is a genuinely powerful design. Being able to gate a swap at the protocol level — enforcing position limits and gas ceilings set in our `StrategyVault` — is exactly the "agent-enforced" DeFi primitive we needed. The `Hooks.Permissions` struct made it easy to declare which callbacks we needed.

### `PoolKey` and `PoolId` types
Clean API. Deriving a stable `PoolId` from a `PoolKey` using the library is straightforward and predictable.

### Uniswap AI GitHub repo
The `uniswap-ai` repo gave us a useful mental model for how Uniswap expects agents to interact with their protocol.

## Pain Points & Bugs

### 1. Hook Address Mining (Biggest Friction)
**Issue:** Uniswap v4 hooks must be deployed at addresses where specific bits are set. The `HookMiner` utility works in Foundry but there is no Hardhat-compatible equivalent we could find.  
**Impact:** We had to skip deploying `TradeDeskHook.sol` in our Hardhat-based setup and move the file out of the build directory. This cost ~3 hours.  
**Request:** An `@uniswap/v4-deploy-helpers` npm package with a Hardhat/ethers.js compatible `findSalt()` function would unblock dozens of hackathon teams.

### 2. `@uniswap/v4-core` npm vs Foundry lib mismatch
**Issue:** The Solidity source imports (`@uniswap/v4-core/src/...`) work fine in Foundry. But when using Hardhat, the npm package does not expose the same internal paths.  
**Impact:** Hardhat cannot resolve `@uniswap/v4-periphery/src/base/hooks/BaseHook.sol` via npm.  
**Request:** Re-export the core Solidity types under a stable public path in the npm package, similar to how OpenZeppelin structures their contracts.

### 3. No Testnet Pool Manager Address in Docs
**Issue:** The Unichain testnet `PoolManager` address is not listed anywhere in the official documentation. We found a placeholder in a GitHub comment (`0x0000...44444444`), which turned out to be incorrect.  
**Request:** A dedicated "Contract Addresses" page per network (mainnet, Sepolia, Unichain testnet) in the developer docs.

### 4. Swap API Rate Limits Not Documented
**Issue:** The Uniswap Swap API returned `429 Too Many Requests` during testing, with no documentation of rate limits or backoff strategy.  
**Request:** Document rate limits and provide a sandbox/test API key for hackathon teams.

## Feature Requests

1. **Agent-specific webhook:** A Uniswap webhook that fires when a price crosses a threshold on-chain — would let Intel Agent remove the polling loop entirely.
2. **`FEEDBACK.md` requirement announced earlier:** The requirement to include this file was mentioned in the track description but not on the submission portal — nearly missed it.

## Overall Rating: 7/10
The v4 hook architecture is genuinely exciting. The main developer-experience gap is the mismatch between Foundry-first development and npm/Hardhat toolchains.
