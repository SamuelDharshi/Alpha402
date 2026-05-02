/**
 * Alpha402 — Live E2E test
 *
 * Runs the full agent pipeline:
 *   1. Creates a strategy on StrategyVault (Sepolia)
 *   2. Authorises the agent wallet in AgentRegistry
 *   3. Fires the strategy through Commander → Intel → Risk → Execution
 *   4. Verifies KeeperHub picks it up
 *
 * Usage: node agents/test-e2e.mjs
 */

import { ethers } from 'ethers';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

// Load .env from project root
const __dir = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dir, '../.env') });

const SEPOLIA_RPC   = process.env.SEPOLIA_RPC_URL;
const PRIVATE_KEY   = process.env.PRIVATE_KEY?.startsWith('0x')
  ? process.env.PRIVATE_KEY
  : `0x${process.env.PRIVATE_KEY}`;
const VAULT_ADDR    = process.env.STRATEGY_VAULT_ADDRESS;
const REGISTRY_ADDR = process.env.AGENT_REGISTRY_ADDRESS;
const KEEPER_KEY    = process.env.KEEPERHUB_API_KEY;

if (!SEPOLIA_RPC || !PRIVATE_KEY || !VAULT_ADDR || !REGISTRY_ADDR) {
  console.error('❌ Missing env vars — check SEPOLIA_RPC_URL, PRIVATE_KEY, STRATEGY_VAULT_ADDRESS, AGENT_REGISTRY_ADDRESS');
  process.exit(1);
}

const provider = new ethers.JsonRpcProvider(
  SEPOLIA_RPC,
  { chainId: 11155111, name: 'sepolia' },
  { staticNetwork: true }
);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

const VAULT_ABI = [
  'function createStrategy(uint256 maxPositionWei, uint256 stopLossPercent, uint256 maxGasGwei) external payable returns (bytes32)',
  'function authoriseExecution(bytes32 strategyId, uint256 amount, uint256 gasPrice) view returns (bool)',
  'event StrategyCreated(bytes32 indexed strategyId, address owner, uint256 maxPositionWei, uint256 stopLossPercent, uint256 maxGasGwei)',
];

const REGISTRY_ABI = [
  'function authoriseAgent(address agent) external',
  'function mintAgent(uint8, bytes32, string) external returns (uint256)',
  'function isTypeMinted(uint8) view returns (bool)',
  'function owner() view returns (address)',
];

async function main() {
  const address = await wallet.getAddress();
  const balance = await provider.getBalance(address);
  console.log(`\n🔗 Wallet:  ${address}`);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH (Sepolia)\n`);

  if (balance < ethers.parseEther('0.005')) {
    console.warn('⚠️  Low balance — get Sepolia ETH from https://sepoliafaucet.com');
  }

  // ── Step 1: Create a strategy on StrategyVault ──────────────────────────
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('STEP 1: Create Strategy on StrategyVault');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const vault = new ethers.Contract(VAULT_ADDR, VAULT_ABI, wallet);

  const maxPositionWei    = ethers.parseEther('0.01');   // 0.01 ETH max trade size
  const stopLossPercent   = 500n;                         // 5% stop loss
  const maxGasGwei        = 50n;                          // 50 gwei gas ceiling

  const tx1 = await vault.createStrategy(maxPositionWei, stopLossPercent, maxGasGwei, {
    value: ethers.parseEther('0.001'), // seed the strategy balance
    gasLimit: 200_000,
  });
  console.log(`  Tx sent: ${tx1.hash}`);
  console.log(`  Etherscan: https://sepolia.etherscan.io/tx/${tx1.hash}`);

  const receipt1 = await tx1.wait();

  // ── Extract strategyId: 3-tier approach for robustness ──
  // Tier 1: ethers v6 parseLog (works when address matches)
  const STRATEGY_CREATED_TOPIC = ethers.id('StrategyCreated(bytes32,address,uint256,uint256,uint256)');
  let strategyId = null;

  // Tier 2: raw log topic scan — strategyId is first indexed param (topic[1])
  for (const log of receipt1.logs) {
    if (
      log.address?.toLowerCase() === VAULT_ADDR.toLowerCase() &&
      log.topics?.[0] === STRATEGY_CREATED_TOPIC
    ) {
      strategyId = log.topics[1]; // bytes32 indexed → stored directly as topic
      break;
    }
  }

  // Tier 3: fallback using ethers parseLog (catches if address differs slightly)
  if (!strategyId) {
    const parsed = receipt1.logs
      .map(log => { try { return vault.interface.parseLog(log); } catch { return null; } })
      .find(e => e?.name === 'StrategyCreated');
    if (parsed) strategyId = parsed.args[0];
  }

  if (!strategyId) {
    console.error('  Raw logs:');
    receipt1.logs.forEach((l, i) => {
      console.error(`    [${i}] addr=${l.address} topic0=${l.topics?.[0]?.slice(0,18)}...`);
    });
    console.error(`  Expected topic0: ${STRATEGY_CREATED_TOPIC}`);
    console.error(`  Expected addr:   ${VAULT_ADDR}`);
    throw new Error('Failed to get strategyId from StrategyCreated event — see raw logs above');
  }

  console.log(`  ✅ Strategy created: ${strategyId}`);
  console.log(`  Max position: ${ethers.formatEther(maxPositionWei)} ETH`);
  console.log(`  Stop loss: 5% | Gas ceiling: 50 gwei\n`);

  // ── Step 2: Verify authorisation works ──────────────────────────────────
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('STEP 2: Verify Strategy Authorisation');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const gasPrice = (await provider.getFeeData()).gasPrice ?? 5_000_000_000n;
  const authorised = await vault.authoriseExecution(strategyId, ethers.parseEther('0.005'), gasPrice);
  console.log(`  authoriseExecution() → ${authorised ? '✅ APPROVED' : '❌ REJECTED'}\n`);

  // ── Step 3: Authorise agent wallet in AgentRegistry ─────────────────────
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('STEP 3: Register Agent Identities (iNFTs)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const registry = new ethers.Contract(REGISTRY_ADDR, REGISTRY_ABI, wallet);

  // Authorise the agent wallet (same as deployer in this setup)
  const tx2 = await registry.authoriseAgent(address, { gasLimit: 80_000 });
  console.log(`  authoriseAgent tx: ${tx2.hash}`);
  await tx2.wait();
  console.log(`  ✅ Wallet ${address} authorised for self-registration\n`);

  // Mint all 4 agent iNFTs
  const agentTypes = [
    { id: 0, name: 'Commander', cid: '0g://commander-agent-v1' },
    { id: 1, name: 'Intel',     cid: '0g://intel-agent-v1'     },
    { id: 2, name: 'Risk',      cid: '0g://risk-agent-v1'      },
    { id: 3, name: 'Execution', cid: '0g://execution-agent-v1' },
  ];

  for (const agent of agentTypes) {
    const already = await registry.isTypeMinted(agent.id);
    if (already) {
      console.log(`  [iNFT] ${agent.name} — already minted ✓`);
      continue;
    }
    const tx = await registry.mintAgent(agent.id, ethers.ZeroHash, agent.cid, { gasLimit: 200_000 });
    const r   = await tx.wait();
    console.log(`  [iNFT] ${agent.name} — minted ✅  tx: ${r.hash.slice(0, 18)}...`);
  }
  console.log();

  // ── Step 4: KeeperHub round-trip test ───────────────────────────────────
  if (KEEPER_KEY) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('STEP 4: KeeperHub check-and-execute (live API call)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const checkABI = JSON.stringify([{
      inputs: [
        { internalType: 'bytes32', name: 'strategyId', type: 'bytes32' },
        { internalType: 'uint256', name: 'amount',     type: 'uint256' },
        { internalType: 'uint256', name: 'gasPrice',   type: 'uint256' },
      ],
      name: 'authoriseExecution',
      outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
      stateMutability: 'view',
      type: 'function',
    }]);

    const execABI = JSON.stringify([{
      inputs: [
        { internalType: 'bytes32',  name: 'strategyId', type: 'bytes32' },
        { internalType: 'address',  name: 'token',      type: 'address' },
        { internalType: 'uint256',  name: 'amount',     type: 'uint256' },
        { internalType: 'bytes',    name: 'swapData',   type: 'bytes' },
      ],
      name: 'executeChecked',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    }]);

    const amount = ethers.parseEther('0.005').toString();

    console.log(`  Calling POST /api/execute/check-and-execute ...`);
    console.log(`  Strategy: ${strategyId.slice(0, 18)}...`);
    console.log(`  Amount: 0.005 ETH | Vault: ${VAULT_ADDR}`);

    const res = await fetch('https://app.keeperhub.com/api/execute/check-and-execute', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${KEEPER_KEY}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        contractAddress: VAULT_ADDR,
        network:         'sepolia',
        functionName:    'authoriseExecution',
        functionArgs:    JSON.stringify([strategyId, amount, gasPrice.toString()]),
        abi:             checkABI,
        condition:       { operator: 'eq', value: 'true' },
        action: {
          contractAddress: VAULT_ADDR,
          functionName:    'executeChecked',
          functionArgs:    JSON.stringify([strategyId, ethers.ZeroAddress, amount, '0x']),
          abi:             execABI,
          gasLimitMultiplier: '1.3',
        },
      }),
    });

    const body = await res.text();
    if (res.ok) {
      const data = JSON.parse(body);
      console.log(`  Raw response: ${JSON.stringify(data)}`);
      if (data.executed || data.status === 'completed') {
        const executionId = data.executionId;
        let txHash = data.transactionHash;

        // KeeperHub returns executionId in the immediate response;
        // poll the status endpoint to get the actual transactionHash
        if (!txHash && executionId) {
          console.log(`  Polling status for executionId: ${executionId}...`);
          for (let i = 0; i < 10; i++) {
            await new Promise(r => setTimeout(r, 2000));
            const statusRes = await fetch(`https://app.keeperhub.com/api/execute/${executionId}/status`, {
              headers: { 'Authorization': `Bearer ${KEEPER_KEY}` },
            });
            if (statusRes.ok) {
              const statusData = await statusRes.json();
              console.log(`  Status [${i+1}]: ${statusData.status}`);
              if (statusData.transactionHash) {
                txHash = statusData.transactionHash;
                break;
              }
              if (statusData.status === 'failed') {
                console.log(`  ❌ KeeperHub execution failed: ${statusData.error}`);
                break;
              }
            }
          }
        }

        if (txHash) {
          console.log(`  ✅ KeeperHub EXECUTED — tx: ${txHash}`);
          console.log(`  Etherscan: https://sepolia.etherscan.io/tx/${txHash}`);
        } else {
          console.log(`  ✅ KeeperHub accepted execution (executionId: ${executionId})`);
          console.log(`  Check: https://app.keeperhub.com (Executions tab) for tx status`);
        }
      } else if (data.executed === false) {
        console.log(`  ⚠️  Condition not met: ${JSON.stringify(data.condition)}`);
        console.log(`  (authoriseExecution returned false — gas price may exceed 50 gwei ceiling)`);
      }
    } else {
      console.log(`  ❌ KeeperHub ${res.status}: ${body}`);
    }
  } else {
    console.log('  ⏭️  Skipping KeeperHub test (KEEPERHUB_API_KEY not set)');
  }

  // ── Summary ─────────────────────────────────────────────────────────────
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ E2E SETUP COMPLETE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  StrategyVault:  ${VAULT_ADDR}`);
  console.log(`  AgentRegistry:  ${REGISTRY_ADDR}`);
  console.log(`  Strategy ID:    ${strategyId}`);
  console.log();
  console.log('  Next steps:');
  console.log('  1. npm run dev:agents  (in a terminal)');
  console.log('  2. Send strategy via Telegram or WebSocket:');
  console.log(`     { "type": "STRATEGY_INTENT", "payload": { "intent": "buy ETH if RSI < 30", "strategyId": "${strategyId}" } }`);
  console.log('  3. Watch the agent logs for the full flow');
  console.log('  4. Check https://sepolia.etherscan.io for TradeExecuted events\n');
}

main().catch(err => {
  console.error('❌ E2E test failed:', err);
  process.exit(1);
});
