// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/StrategyVault.sol";
import "../src/AgentPaymentManager.sol";
import "../src/AgentRegistry.sol";
import "../src/Alpha402Hook.sol";
import {IPoolManager} from "v4-core/interfaces/IPoolManager.sol";

/// @notice Deploys the 4 core contracts to Sepolia testnet.
contract DeployScript is Script {
    function run() external {
        string memory pkStr = vm.envString("PRIVATE_KEY");
        // Add 0x prefix if missing (forge needs it for key parsing)
        bytes memory pkBytes = bytes(pkStr);
        uint256 deployerPrivateKey;
        if (pkBytes.length >= 2 && pkBytes[0] == '0' && (pkBytes[1] == 'x' || pkBytes[1] == 'X')) {
            deployerPrivateKey = vm.parseUint(pkStr);
        } else {
            deployerPrivateKey = vm.parseUint(string(abi.encodePacked("0x", pkStr)));
        }

        // Sepolia USDC (Circle's official test token)
        address usdcAddress = 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238;

        // Uniswap v4 PoolManager on Sepolia (official deployment)
        address poolManager = 0x8C4BcBE6b9eF47855f97E675296FA3F6fafa5F1A;

        vm.startBroadcast(deployerPrivateKey);

        // 1. StrategyVault — holds user strategy parameters on-chain
        StrategyVault vault = new StrategyVault();
        console.log("StrategyVault:", address(vault));

        // 2. AgentPaymentManager — x402 payment accounting
        AgentPaymentManager paymentManager = new AgentPaymentManager(usdcAddress);
        console.log("AgentPaymentManager:", address(paymentManager));

        // 3. AgentRegistry — iNFT agent identity store
        AgentRegistry registry = new AgentRegistry();
        console.log("AgentRegistry:", address(registry));

        // 4. Alpha402Hook — Uniswap v4 hook for strategy enforcement
        Alpha402Hook hook = new Alpha402Hook(IPoolManager(poolManager), address(vault));
        console.log("ALPHA402_HOOK_ADDRESS:", address(hook));

        // 5. Authorise agent wallets for self-registration (set AGENT_WALLET in env)
        address agentWallet = vm.envOr("AGENT_WALLET", address(0));
        if (agentWallet != address(0)) {
            registry.authoriseAgent(agentWallet);
            console.log("Authorised agent wallet:", agentWallet);
        }

        vm.stopBroadcast();

        // Write addresses to a JSON file so npm scripts can read them
        string memory json = "deployment";
        vm.serializeAddress(json, "StrategyVault", address(vault));
        vm.serializeAddress(json, "AgentPaymentManager", address(paymentManager));
        vm.serializeAddress(json, "AgentRegistry", address(registry));
        vm.serializeAddress(json, "Alpha402Hook", address(hook));
        string memory finalJson = vm.serializeAddress(json, "USDC", usdcAddress);

        vm.writeFile("deployments/sepolia.json", finalJson);
        console.log("---");
        console.log("Deployment saved to deployments/sepolia.json");
        console.log("Copy the addresses above into your .env file.");
    }
}
