# KeeperHub Builder Feedback — Alpha402
> Submitted for the $500 Builder Feedback Bounty

## Integration Summary
Alpha402's Execution Agent uses KeeperHub as its guaranteed execution layer. After the Risk Agent approves a trade (via Groq AI scoring), the Execution Agent calls KeeperHub's REST API with the encoded `StrategyVault.executeChecked()` calldata and x402 payment authorisation. KeeperHub handles gas optimisation, retry logic, and MEV protection.

## What Worked Well

### Concept (10/10)
The positioning of KeeperHub as the "execution reliability layer" is exactly what autonomous agents need. A raw `ethers.js` `sendTransaction` call has no retry logic, no MEV protection, and no audit trail. KeeperHub solves all three. The value proposition is immediately clear to any agent builder.

### MCP server integration
The fact that KeeperHub ships an MCP server is a strong DX win for teams using Claude/Cursor. We could call KeeperHub tools directly from the IDE during testing without writing a single HTTP call manually.

## Pain Points & Bugs

### 1. No Testnet Sandbox / Free Tier for API Key
**Issue:** To get a `KEEPERHUB_API_KEY`, you must create an account on `app.keeperhub.com`. The signup flow doesn't offer a "testnet only" tier that bypasses billing setup.  
**Impact:** For hackathon teams without a credit card or company billing, this is a blocker. We had to implement a direct-Sepolia fallback (`ethers.js`) so the pipeline could be demonstrated without the key.  
**Request:** A free testnet-only API key (rate-limited to 50 tx/day) that does not require billing setup. This would dramatically lower the barrier for hackathon adoption.

### 2. API Response Shape Not Documented
**Issue:** The `POST /v1/execute` endpoint docs show a request body but not the response schema. We had to guess that the response contains `txHash` or `hash`.  
**Reproducible:** Call `POST /v1/execute` and inspect the raw response — the docs at `https://docs.keeperhub.com/api` do not show an example response body.  
**Request:** Add a response JSON schema + example to every endpoint in the API docs.

### 3. x402 Payment Flow Not Described End-to-End
**Issue:** KeeperHub supports x402 micropayments, but the docs don't show the full flow: how to pre-authorise, what the payment header looks like, and how to verify it was deducted.  
**Impact:** We set `paymentMethod: 'x402'` in our request body based on inference, not documentation. No way to confirm it worked.  
**Request:** An end-to-end x402 tutorial ("Fund wallet → Call execute with x402 → Verify deduction") would make this a uniquely compelling story for agent builders.

### 4. No Webhook / Callback for Execution Confirmation
**Issue:** After calling `/v1/execute`, the only way to know the tx was confirmed is to poll or subscribe to the RPC. KeeperHub has the confirmed status but doesn't push it back.  
**Request:** An optional `callbackUrl` field in the request body that KeeperHub POSTs to when the transaction is included in a block.

### 5. CLI Documentation Gap
**Issue:** The CLI docs (`https://docs.keeperhub.com/cli`) show installation but no working examples for common use cases (execute tx, check status, set gas limit).  
**Request:** A "5 commands to know" quick-reference page.

## Feature Requests

1. **KeeperHub npm SDK:** An `@keeperhub/sdk` TypeScript package that wraps the REST API. Currently we had to write our own `fetch` wrapper.
2. **Sepolia faucet integration:** When a Para wallet has 0 ETH, link directly to a faucet in the dashboard.
3. **Agent identity support:** Allow an agent to register an identity (e.g. via iNFT / ERC-7857) and inherit execution permissions from it.

## Summary
KeeperHub is solving a real and important problem. The biggest adoption barrier for hackathon teams is the lack of a free testnet tier — this alone likely cost you 30% of potential integrations this weekend.
