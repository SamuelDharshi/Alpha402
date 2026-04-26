import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log("\n═══════════════════════════════════════");
  console.log("  TradeDesk Contract Deployment");
  console.log("═══════════════════════════════════════");
  console.log(`  Deployer : ${deployer.address}`);
  console.log(`  Balance  : ${ethers.formatEther(balance)} ETH`);
  console.log("═══════════════════════════════════════\n");

  if (balance === 0n) {
    throw new Error(
      "Deployer wallet has 0 ETH on Sepolia!\n" +
      "Get free testnet ETH from: https://sepoliafaucet.com"
    );
  }

  // ── 1. StrategyVault ──────────────────────────────────────────────
  console.log("Deploying StrategyVault...");
  const StrategyVault = await ethers.getContractFactory("StrategyVault");
  const vault = await StrategyVault.deploy();
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log(`  ✅ StrategyVault:        ${vaultAddress}`);

  // ── 2. AgentPaymentManager ────────────────────────────────────────
  // Sepolia Circle USDC: 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238
  const USDC_SEPOLIA = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";
  console.log("\nDeploying AgentPaymentManager...");
  const AgentPaymentManager = await ethers.getContractFactory("AgentPaymentManager");
  const paymentManager = await AgentPaymentManager.deploy(USDC_SEPOLIA);
  await paymentManager.waitForDeployment();
  const pmAddress = await paymentManager.getAddress();
  console.log(`  ✅ AgentPaymentManager:  ${pmAddress}`);

  // ── 3. AgentRegistry ─────────────────────────────────────────────
  console.log("\nDeploying AgentRegistry...");
  const AgentRegistry = await ethers.getContractFactory("AgentRegistry");
  const registry = await AgentRegistry.deploy();
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log(`  ✅ AgentRegistry:        ${registryAddress}`);

  // ── Save results ──────────────────────────────────────────────────
  const deployment = {
    network: "sepolia",
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      STRATEGY_VAULT_ADDRESS: vaultAddress,
      AGENT_PAYMENT_MANAGER_ADDRESS: pmAddress,
      AGENT_REGISTRY_ADDRESS: registryAddress,
    },
  };

  const outDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, "sepolia.json"),
    JSON.stringify(deployment, null, 2)
  );

  console.log("\n═══════════════════════════════════════");
  console.log("  COPY THESE INTO YOUR ROOT .env FILE:");
  console.log("═══════════════════════════════════════");
  console.log(`STRATEGY_VAULT_ADDRESS=${vaultAddress}`);
  console.log(`AGENT_PAYMENT_MANAGER_ADDRESS=${pmAddress}`);
  console.log(`AGENT_REGISTRY_ADDRESS=${registryAddress}`);
  console.log("TRADE_DESK_HOOK_ADDRESS=              ← skip for now (v4 needs address mining)");
  console.log("═══════════════════════════════════════\n");
  console.log("Results also saved to packages/contracts/deployments/sepolia.json");
}

main().catch((err) => {
  console.error("\n❌ Deployment failed:", err.message);
  process.exit(1);
});
