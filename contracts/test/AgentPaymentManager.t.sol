// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/AgentPaymentManager.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockUSDC is ERC20 {
    constructor() ERC20("Mock USDC", "USDC") {
        _mint(msg.sender, 1000000 * 10**6);
    }
    function decimals() public pure override returns (uint8) {
        return 6;
    }
}

contract AgentPaymentManagerTest is Test {
    AgentPaymentManager public pm;
    MockUSDC public usdc;
    address public owner = address(0x1);
    address public agent = address(0x2);
    address public provider = address(0x3);
    bytes32 public strategyId = keccak256("strat1");

    function setUp() public {
        usdc = new MockUSDC();
        pm = new AgentPaymentManager(address(usdc));
        pm.setAuthorisedAgent(agent, true);
        
        usdc.transfer(agent, 100 * 10**6);
    }

    function test_TopUpAndPay() public {
        vm.startPrank(agent);
        uint256 amount = 10 * 10**6;
        usdc.approve(address(pm), amount);
        pm.topUp(strategyId, amount);
        
        assertEq(pm.getBalance(strategyId), amount);

        uint256 payAmount = 1 * 10**6;
        pm.recordPayment(strategyId, provider, payAmount, "intel_data");
        
        assertEq(pm.getBalance(strategyId), amount - payAmount);
        assertEq(usdc.balanceOf(provider), payAmount);
        vm.stopPrank();
    }
}
