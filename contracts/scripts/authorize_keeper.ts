import { ethers } from "hardhat";

async function main() {
  const vaultAddress = "0xf840458FF5d911701a2092c693B0442E4B33089C";
  const [deployer] = await ethers.getSigners();

  console.log("Using deployer:", deployer.address);

  const abi = [
    "function setAuthorizedExecutor(address executor, bool authorized) external",
    "function authorizedExecutors(address) view returns (bool)"
  ];

  const vault = new ethers.Contract(vaultAddress, abi, deployer);

  // Address from KEEPERHUB_PRIVATE_KEY in .env
  const keeperHubAddress1 = ethers.getAddress("0xb951f95ae5d629b3495b17eb76eb813a8fcd33f9");
  // Official KeeperHub worker address on Sepolia
  const keeperHubAddress2 = ethers.getAddress("0x6f4ba69ab7753239a5135a9029a1288b8d624a66");

  console.log(`Authorizing KeeperHub Address 1: ${keeperHubAddress1}`);
  let tx = await (vault as any).setAuthorizedExecutor(keeperHubAddress1, true);
  await tx.wait();
  console.log("✅ Authorized Address 1");

  console.log(`Authorizing KeeperHub Address 2: ${keeperHubAddress2}`);
  tx = await (vault as any).setAuthorizedExecutor(keeperHubAddress2, true);
  await tx.wait();
  console.log("✅ Authorized Address 2");

  console.log("\nAll KeeperHub executors authorized!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
