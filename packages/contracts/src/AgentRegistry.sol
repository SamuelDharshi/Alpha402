// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AgentRegistry is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    enum AgentType { COMMANDER, INTEL, RISK, EXECUTION }

    struct AgentMetadata {
        AgentType agentType;
        bytes32 strategyId;
        uint256 deployedAt;
        string zeroGCID;
    }

    mapping(uint256 => AgentMetadata) public agents;

    event AgentMinted(uint256 indexed tokenId, AgentType agentType, bytes32 indexed strategyId, string cid);
    event CIDUpdated(uint256 indexed tokenId, string newCID);

    constructor() ERC721("TradeDesk Agent", "TDAGENT") Ownable(msg.sender) {}

    function mintAgent(
        AgentType agentType,
        bytes32 strategyId,
        string calldata cid
    ) external onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);
        
        agents[tokenId] = AgentMetadata({
            agentType: agentType,
            strategyId: strategyId,
            deployedAt: block.timestamp,
            zeroGCID: cid
        });

        // In a real app, you'd construct a URI based on the metadata or the CID
        _setTokenURI(tokenId, string(abi.encodePacked("ipfs://", cid)));

        emit AgentMinted(tokenId, agentType, strategyId, cid);
        return tokenId;
    }

    function updateCID(uint256 tokenId, string calldata newCID) external onlyOwner {
        require(_ownerOf(tokenId) != address(0), "Nonexistent token");
        agents[tokenId].zeroGCID = newCID;
        _setTokenURI(tokenId, string(abi.encodePacked("ipfs://", newCID)));
        emit CIDUpdated(tokenId, newCID);
    }
    
    function getAgent(uint256 tokenId) external view returns (AgentMetadata memory) {
        return agents[tokenId];
    }
}
