// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/StrategyVault.sol";

contract StrategyVaultTest is Test {
    StrategyVault public vault;
    address public owner = address(0x1);
    address public user = address(0x2);

    function setUp() public {
        vault = new StrategyVault();
    }

    function test_CreateStrategy() public {
        vm.startPrank(user);
        uint256 maxPos = 1 ether;
        uint256 stopLoss = 500; // 5%
        uint256 maxGas = 50;

        bytes32 strategyId = vault.createStrategy{value: 1 ether}(maxPos, stopLoss, maxGas);
        
        (address sOwner, uint256 sMaxPos, uint256 sStopLoss, uint256 sMaxGas, bool active) = vault.strategies(strategyId);
        
        assertEq(sOwner, user);
        assertEq(sMaxPos, maxPos);
        assertEq(vault.strategyBalances(strategyId), 1 ether);
        assertTrue(active);
        vm.stopPrank();
    }

    function test_AuthoriseExecution() public {
        vm.startPrank(user);
        bytes32 strategyId = vault.createStrategy(1 ether, 500, 50);
        
        // Valid trade
        assertTrue(vault.authoriseExecution(strategyId, 0.5 ether, 10 gwei));
        
        // Exceeds max position
        assertFalse(vault.authoriseExecution(strategyId, 1.1 ether, 10 gwei));
        
        // Exceeds gas price
        assertFalse(vault.authoriseExecution(strategyId, 0.5 ether, 60 gwei));
        
        vm.stopPrank();
    }

    function test_EmergencyStop() public {
        vm.startPrank(user);
        bytes32 strategyId = vault.createStrategy{value: 1 ether}(1 ether, 500, 50);
        
        uint256 initialBalance = user.balance;
        vault.emergencyStop(strategyId);
        
        (, , , , bool active) = vault.strategies(strategyId);
        assertFalse(active);
        assertEq(user.balance, initialBalance + 1 ether);
        assertEq(vault.strategyBalances(strategyId), 0);
        vm.stopPrank();
    }
}
