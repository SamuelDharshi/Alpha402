// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AgentRegistry
 * @notice ERC-721 registry for Alpha402 AI agents (iNFT concept, ERC-7857 inspired).
 *
 * Each agent mints its own identity token on startup. The deployer (owner) can
 * also mint on behalf of any agent, and can update the 0G Storage CID at any time.
 *
 * Mint rules:
 *   - Owner can mint any agent type at any time.
 *   - Any authorised agent address can self-mint its own type once.
 *   - Duplicate agent types cannot be minted (one iNFT per agent type).
 */
contract AgentRegistry is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    enum AgentType { COMMANDER, INTEL, RISK, EXECUTION }

    struct AgentMetadata {
        AgentType agentType;
        bytes32   strategyId;
        uint256   deployedAt;
        string    zeroGCID;
    }

    /// tokenId → metadata
    mapping(uint256   => AgentMetadata) public agents;
    /// agentType → already minted?
    mapping(uint8     => bool)          public typeMinted;
    /// authorised agent addresses that may self-mint
    mapping(address   => bool)          public authorisedAgents;

    event AgentMinted(uint256 indexed tokenId, AgentType agentType, bytes32 indexed strategyId, string cid);
    event CIDUpdated(uint256 indexed tokenId, string newCID);
    event AgentAuthorised(address indexed agent);

    constructor() ERC721("Alpha402 Agent", "A402A") Ownable(msg.sender) {}

    // ── Authorisation ────────────────────────────────────────────────────────

    /** Owner registers an agent wallet address as allowed to self-mint */
    function authoriseAgent(address agent) external onlyOwner {
        authorisedAgents[agent] = true;
        emit AgentAuthorised(agent);
    }

    // ── Minting ──────────────────────────────────────────────────────────────

    /**
     * Mint an iNFT for an agent.
     * - Owner may call this any time.
     * - Authorised agent wallets may call this for themselves.
     * - Each AgentType can only be minted once (idempotent on retry).
     */
    function mintAgent(
        AgentType agentType,
        bytes32   strategyId,
        string calldata cid
    ) external returns (uint256) {
        bool isOwner  = msg.sender == owner();
        bool isAgent  = authorisedAgents[msg.sender];
        require(isOwner || isAgent, "AgentRegistry: not authorised");

        // Idempotent: return 0 if already minted so agents don't revert on restart
        if (typeMinted[uint8(agentType)]) return 0;
        typeMinted[uint8(agentType)] = true;

        uint256 tokenId = _nextTokenId++;
        _safeMint(isOwner ? msg.sender : msg.sender, tokenId);

        agents[tokenId] = AgentMetadata({
            agentType:   agentType,
            strategyId:  strategyId,
            deployedAt:  block.timestamp,
            zeroGCID:    cid
        });

        // URI points to 0G Storage CID (or ipfs:// for compatibility)
        string memory prefix = bytes(cid).length > 0 && bytes(cid)[0] == '0'
            ? ""      // already prefixed with 0g://
            : "ipfs://";
        _setTokenURI(tokenId, string(abi.encodePacked(prefix, cid)));

        emit AgentMinted(tokenId, agentType, strategyId, cid);
        return tokenId;
    }

    /** Update the 0G Storage CID for an agent token (owner only) */
    function updateCID(uint256 tokenId, string calldata newCID) external onlyOwner {
        require(_ownerOf(tokenId) != address(0), "Nonexistent token");
        agents[tokenId].zeroGCID = newCID;
        _setTokenURI(tokenId, string(abi.encodePacked("0g://", newCID)));
        emit CIDUpdated(tokenId, newCID);
    }

    /** View metadata for any agent token */
    function getAgent(uint256 tokenId) external view returns (AgentMetadata memory) {
        return agents[tokenId];
    }

    /** Check if an agent type has been minted */
    function isTypeMinted(AgentType agentType) external view returns (bool) {
        return typeMinted[uint8(agentType)];
    }
}
