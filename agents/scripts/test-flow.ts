import { AgentBus } from '../src/bus/index.js';
import { ZeroGStorage } from '../src/storage/zeroG.js';
import { CommanderAgent } from '../src/agents/commander/index.js';
import { IntelAgent } from '../src/agents/intel/index.js';
import { RiskAgent } from '../src/agents/risk/index.js';
import { ExecutionAgent } from '../src/agents/execution/index.js';
import * as dotenv from 'dotenv';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
dotenv.config({ path: resolve(__dirname, '../../../.env') });

async function runTestFlow() {
  console.log('🚀 Starting Alpha402 End-to-End Test Flow...');
  
  const zeroG = new ZeroGStorage();
  const bus = new AgentBus(zeroG);

  const commander = new CommanderAgent(bus);
  const intel = new IntelAgent(bus);
  const risk = new RiskAgent(bus);
  const execution = new ExecutionAgent(bus);

  await commander.init();
  await intel.init();
  await risk.init();
  await execution.init();

  console.log('\n--- STEP 1: Sending user intent to Commander ---');
  const userPrompt = "Buy ETH when it dips below $3000. Max 0.5 ETH. Stop loss 5%.";
  const userId = "test_user_678";
  
  const strategy = await commander.parseStrategy(userPrompt, userId);
  console.log('✅ Commander finished parsing. Intel should now be watching...');

  // The rest happens asynchronously via the bus. 
  // We'll listen for the final execution message to exit.
  bus.on('EXECUTION_CONFIRMED', (msg) => {
    console.log('\n🎉 TEST SUCCESSFUL! Trade executed.');
    console.log('Transaction Hash:', msg.payload.txHash);
    process.exit(0);
  });

  bus.on('RISK_REJECTED', (msg) => {
    console.log('\n⚠️ TEST ENDED: Risk Agent rejected trade.');
    console.log('Reason:', msg.payload.reasoning);
    process.exit(0);
  });
  
  // Timeout if nothing happens
  setTimeout(() => {
    console.log('\n❌ TEST TIMEOUT');
    process.exit(1);
  }, 60000);
}

runTestFlow().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
