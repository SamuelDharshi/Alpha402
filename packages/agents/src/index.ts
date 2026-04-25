import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../../../.env') });

import { AgentBus } from './bus/index.js';

// Catch unhandled errors that cause the "Disconnected" loop
process.on('unhandledRejection', (reason) => {
  console.error('\n🔥 [FATAL] Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('\n🔥 [FATAL] Uncaught Exception:', err.message);
  process.exit(1);
});
import { ZeroGStorage } from './storage/zeroG.js';
import { CommanderAgent } from './agents/commander/index.js';
import { IntelAgent } from './agents/intel/index.js';
import { RiskAgent } from './agents/risk/index.js';
import { ExecutionAgent } from './agents/execution/index.js';
import { startWSServer } from './ws/server.js';

// Guard required keys
if (!process.env.GROQ_API_KEY) {
  console.error('\n❌ GROQ_API_KEY missing — get a free key at https://console.groq.com/\n');
  process.exit(1);
}

async function main() {
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║  🤖 Alpha402 — Multi-Agent DeFi System            ║');
  console.log('║  AI:       Groq (llama-3.1-8b-instant)            ║');
  console.log('║  Storage:  0G Decentralised Storage               ║');
  console.log('║  Comms:    Gensyn AXL (P2P mesh, if running)      ║');
  console.log('║  Exec:     KeeperHub (guaranteed execution)        ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  // 0G Storage — decentralised message persistence
  const zeroG = new ZeroGStorage();
  await zeroG.init();

  // Bus with AXL P2P transport (falls back to EventEmitter if AXL not running)
  const bus = new AgentBus(zeroG, 'commander');
  await bus.connectAXL();

  const commander = new CommanderAgent(bus);
  const intel     = new IntelAgent(bus);
  const risk      = new RiskAgent(bus);
  const execution = new ExecutionAgent(bus);

  await commander.init();
  await intel.init();
  await risk.init();
  await execution.init();

  startWSServer(bus, commander);

  console.log('\n✅ All 4 agents online');
  console.log(`📡 AXL P2P mesh: ${bus.isAXLActive() ? '🟢 ACTIVE' : '🟡 Fallback (EventEmitter)'}`);
  console.log('🌐 WebSocket dashboard: ws://localhost:3001');
  console.log('📦 Contracts on Sepolia:');
  console.log(`   Vault:    ${process.env.STRATEGY_VAULT_ADDRESS}`);
  console.log(`   Payments: ${process.env.AGENT_PAYMENT_MANAGER_ADDRESS}`);
  console.log('\n⏳ Ready — send a strategy from the dashboard or Telegram.\n');

  process.on('SIGINT', () => {
    console.log('\n[Alpha402] Shutting down...');
    process.exit(0);
  });
}

main().catch((err) => {
  console.error('\n[Alpha402] Fatal error:', err.message);
  process.exit(1);
});
