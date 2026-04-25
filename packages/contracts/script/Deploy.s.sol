// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/StrategyVault.sol";
import "../src/AgentPaymentManager.sol";
import "../src/AgentRegistry.sol";
import "../src/TradeDeskHook.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";

/// @notice Deploys the 4 core contracts to Sepolia testnet.
contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        // Sepolia USDC (Circle's official test token)
        address usdcAddress = 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238;

        // Mock PoolManager for testing (since real v4 might not be on your specific RPC)
        address poolManager = 0x0000000000044444444444444444444444444444;

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

        // 4. TradeDeskHook — Uniswap v4 hook for strategy enforcement
        TradeDeskHook hook = new TradeDeskHook(IPoolManager(poolManager), address(vault));
        console.log("TRADE_DESK_HOOK_ADDRESS:", address(hook));

        vm.stopBroadcast();

        // Write addresses to a JSON file so npm scripts can read them
        string memory json = "deployment";
        vm.serializeAddress(json, "StrategyVault", address(vault));
        vm.serializeAddress(json, "AgentPaymentManager", address(paymentManager));
        vm.serializeAddress(json, "AgentRegistry", address(registry));
        vm.serializeAddress(json, "TradeDeskHook", address(hook));
        string memory finalJson = vm.serializeAddress(json, "USDC", usdcAddress);

        vm.writeFile("deployments/sepolia.json", finalJson);
        console.log("---");
        console.log("Deployment saved to deployments/sepolia.json");
        console.log("Copy the addresses above into your .env file.");
    }
}
