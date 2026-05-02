/**
 * Alpha402 — Direct Contract Deploy (bypasses Forge sandbox)
 *
 * Deploys all 4 contracts directly via ethers.js to Sepolia.
 * Updates .env with real addresses after successful deployment.
 *
 * Usage: node agents/deploy-contracts.mjs
 */

import { ethers } from 'ethers';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync } from 'fs';
import dotenv from 'dotenv';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT  = join(__dir, '..');
dotenv.config({ path: join(ROOT, '.env') });

const SEPOLIA_RPC = process.env.SEPOLIA_RPC_URL ?? 'https://ethereum-sepolia-rpc.publicnode.com';
const PRIVATE_KEY = process.env.PRIVATE_KEY?.startsWith('0x')
  ? process.env.PRIVATE_KEY
  : `0x${process.env.PRIVATE_KEY}`;

const provider = new ethers.JsonRpcProvider(
  SEPOLIA_RPC,
  { chainId: 11155111, name: 'sepolia' },
  { staticNetwork: true }
);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

function loadArtifact(name) {
  const path = join(ROOT, 'contracts', 'out', `${name}.sol`, `${name}.json`);
  const artifact = JSON.parse(readFileSync(path, 'utf8'));
  return {
    abi:      artifact.abi,
    bytecode: artifact.bytecode?.object ?? artifact.bytecode,
  };
}

async function deploy(name, ...args) {
  const { abi, bytecode } = loadArtifact(name);
  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  const contract = await factory.deploy(...args, { gasLimit: 3_000_000 });
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  return { contract, address };
}

async function main() {
  const address = await wallet.getAddress();
  const balance = await provider.getBalance(address);
  console.log(`\n🔗 Deployer: ${address}`);
  console.log(`💰 Balance:  ${ethers.formatEther(balance)} ETH (Sepolia)`);

  if (balance < ethers.parseEther('0.05')) {
    console.error('❌ Need at least 0.05 ETH for deployment. Get from https://sepoliafaucet.com');
    process.exit(1);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Deploying Alpha402 Contracts to Sepolia');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 1. StrategyVault
  process.stdout.write('  [1/4] StrategyVault... ');
  const { address: vaultAddr } = await deploy('StrategyVault');
  console.log(`✅ ${vaultAddr}`);

  // 2. AgentPaymentManager
  process.stdout.write('  [2/4] AgentPaymentManager... ');
  const USDC_SEPOLIA = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238';
  const { address: paymentsAddr } = await deploy('AgentPaymentManager', USDC_SEPOLIA);
  console.log(`✅ ${paymentsAddr}`);

  // 3. AgentRegistry
  process.stdout.write('  [3/4] AgentRegistry... ');
  const { contract: registry, address: registryAddr } = await deploy('AgentRegistry');
  console.log(`✅ ${registryAddr}`);

  // 4. Alpha402Hook (Uniswap v4 PoolManager on Sepolia)
  process.stdout.write('  [4/4] Alpha402Hook... ');
  const V4_POOL_MANAGER = '0x8C4BcBE6b9eF47855f97E675296FA3F6fafa5F1A';
  const { address: hookAddr } = await deploy('Alpha402Hook', V4_POOL_MANAGER, vaultAddr);
  console.log(`✅ ${hookAddr}`);

  // Authorise agent wallet in registry
  console.log('\n  Authorising agent wallet in AgentRegistry...');
  const authTx = await registry.authoriseAgent(address, { gasLimit: 80_000 });
  await authTx.wait();
  console.log(`  ✅ ${address} authorised for iNFT self-registration`);

  // Update .env
  console.log('\n  Updating .env with new contract addresses...');
  let env = readFileSync(join(ROOT, '.env'), 'utf8');
  env = env.replace(/STRATEGY_VAULT_ADDRESS=.*/,         `STRATEGY_VAULT_ADDRESS=${vaultAddr}`);
  env = env.replace(/AGENT_PAYMENT_MANAGER_ADDRESS=.*/,  `AGENT_PAYMENT_MANAGER_ADDRESS=${paymentsAddr}`);
  env = env.replace(/AGENT_REGISTRY_ADDRESS=.*/,         `AGENT_REGISTRY_ADDRESS=${registryAddr}`);
  env = env.replace(/ALPHA402_HOOK_ADDRESS=.*/,          `ALPHA402_HOOK_ADDRESS=${hookAddr}`);
  writeFileSync(join(ROOT, '.env'), env);
  console.log('  ✅ .env updated');

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ ALL CONTRACTS DEPLOYED');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  StrategyVault:        ${vaultAddr}`);
  console.log(`  AgentPaymentManager:  ${paymentsAddr}`);
  console.log(`  AgentRegistry:        ${registryAddr}`);
  console.log(`  Alpha402Hook:         ${hookAddr}`);
  console.log(`\n  Verify on Etherscan:`);
  console.log(`    https://sepolia.etherscan.io/address/${vaultAddr}`);
  console.log(`\n  Next step: node agents/test-e2e.mjs\n`);
}

main().catch(err => {
  console.error('\n❌ Deploy failed:', err.message);
  process.exit(1);
});
