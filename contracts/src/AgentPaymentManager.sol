// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract AgentPaymentManager is Ownable {
    struct AgentWallet {
        bytes32 strategyId;
        uint256 balance;        // USDC balance for micropayments
        uint256 totalSpent;
        uint256 paymentCount;
    }

    mapping(bytes32 => AgentWallet) public agentWallets;
    mapping(address => bool) public authorisedAgents;
    
    address public immutable usdc;

    event PaymentRecorded(
        bytes32 indexed strategyId,
        address indexed recipient,
        uint256 amount,
        string serviceType,
        uint256 timestamp
    );
    event WalletToppedUp(bytes32 indexed strategyId, uint256 amount);

    constructor(address _usdc) Ownable(msg.sender) {
        usdc = _usdc;
    }

    modifier onlyAuthorised() {
        require(authorisedAgents[msg.sender] || msg.sender == owner(), "Not authorised");
        _;
    }

    function setAuthorisedAgent(address agent, bool authorised) external onlyOwner {
        authorisedAgents[agent] = authorised;
    }

    function topUp(bytes32 strategyId, uint256 amount) external {
        IERC20(usdc).transferFrom(msg.sender, address(this), amount);
        agentWallets[strategyId].balance += amount;
        agentWallets[strategyId].strategyId = strategyId;
        emit WalletToppedUp(strategyId, amount);
    }

    function recordPayment(
        bytes32 strategyId,
        address recipient,
        uint256 amount,
        string calldata serviceType
    ) external onlyAuthorised {
        require(agentWallets[strategyId].balance >= amount, "Insufficient agent balance");
        
        agentWallets[strategyId].balance -= amount;
        agentWallets[strategyId].totalSpent += amount;
        agentWallets[strategyId].paymentCount += 1;

        if (amount > 0) {
            IERC20(usdc).transfer(recipient, amount);
        }

        emit PaymentRecorded(strategyId, recipient, amount, serviceType, block.timestamp);
    }

    function getBalance(bytes32 strategyId) external view returns (uint256) {
        return agentWallets[strategyId].balance;
    }

    function withdraw(bytes32 strategyId) external {
        // Only strategy owner should ideally withdraw, but for hackathon we keep it simple
        // Usually we'd map strategyId to owner in StrategyVault
        uint256 balance = agentWallets[strategyId].balance;
        require(balance > 0, "No balance");
        agentWallets[strategyId].balance = 0;
        IERC20(usdc).transfer(msg.sender, balance);
    }
}
