// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract StrategyVault is ReentrancyGuard, Ownable {
    struct Strategy {
        address owner;
        uint256 maxPositionWei;      // max ETH per trade
        uint256 stopLossPercent;     // in basis points (500 = 5%)
        uint256 maxGasGwei;          // gas ceiling
        bool active;
    }

    mapping(bytes32 => Strategy) public strategies;
    mapping(bytes32 => uint256) public strategyBalances;
    mapping(address => bool) public authorizedExecutors;

    event StrategyCreated(bytes32 indexed strategyId, address owner, uint256 maxPositionWei, uint256 stopLossPercent, uint256 maxGasGwei);
    event TradeExecuted(bytes32 indexed strategyId, address token, uint256 amount);
    event StrategyPaused(bytes32 indexed strategyId);
    event StrategyResumed(bytes32 indexed strategyId);
    event EmergencyStop(bytes32 indexed strategyId);
    event ExecutorSet(address indexed executor, bool authorized);

    constructor() Ownable(msg.sender) {}

    function setAuthorizedExecutor(address executor, bool authorized) external onlyOwner {
        authorizedExecutors[executor] = authorized;
        emit ExecutorSet(executor, authorized);
    }

    uint256 private _strategyNonce;

    function createStrategy(
        uint256 maxPositionWei,
        uint256 stopLossPercent,
        uint256 maxGasGwei
    ) external payable returns (bytes32 strategyId) {
        strategyId = keccak256(abi.encodePacked(msg.sender, block.timestamp, block.prevrandao, _strategyNonce++));
        
        strategies[strategyId] = Strategy({
            owner: msg.sender,
            maxPositionWei: maxPositionWei,
            stopLossPercent: stopLossPercent,
            maxGasGwei: maxGasGwei,
            active: true
        });

        if (msg.value > 0) {
            strategyBalances[strategyId] = msg.value;
        }

        emit StrategyCreated(strategyId, msg.sender, maxPositionWei, stopLossPercent, maxGasGwei);
    }

    function authoriseExecution(
        bytes32 strategyId,
        uint256 amount,
        uint256 gasPrice
    ) external view returns (bool) {
        Strategy memory strategy = strategies[strategyId];
        if (!strategy.active) return false;
        if (amount > strategy.maxPositionWei) return false;
        if (gasPrice > strategy.maxGasGwei * 1e9) return false;
        return true;
    }

    function executeChecked(
        bytes32 strategyId,
        address token,
        uint256 amount,
        bytes calldata swapData
    ) external nonReentrant {
        Strategy storage strategy = strategies[strategyId];
        require(strategy.active, "Strategy not active");
        require(
            msg.sender == strategy.owner || 
            msg.sender == owner() || 
            authorizedExecutors[msg.sender], 
            "Not authorised"
        );
        require(amount <= strategy.maxPositionWei, "Exceeds max position");
        require(tx.gasprice <= strategy.maxGasGwei * 1e9, "Gas too high");

        // Logic for execution...
        // In a real hook-based system, the hook calls authorizeExecution.
        // This function could be used for direct execution if needed.
        
        emit TradeExecuted(strategyId, token, amount);
    }

    function pauseStrategy(bytes32 strategyId) external {
        require(strategies[strategyId].owner == msg.sender, "Not owner");
        strategies[strategyId].active = false;
        emit StrategyPaused(strategyId);
    }

    function resumeStrategy(bytes32 strategyId) external {
        require(strategies[strategyId].owner == msg.sender, "Not owner");
        strategies[strategyId].active = true;
        emit StrategyResumed(strategyId);
    }

    function emergencyStop(bytes32 strategyId) external {
        require(strategies[strategyId].owner == msg.sender || msg.sender == owner(), "Not authorised");
        strategies[strategyId].active = false;
        
        uint256 balance = strategyBalances[strategyId];
        if (balance > 0) {
            strategyBalances[strategyId] = 0;
            payable(strategies[strategyId].owner).transfer(balance);
        }
        
        emit EmergencyStop(strategyId);
    }

    receive() external payable {}
}
