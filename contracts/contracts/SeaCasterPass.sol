// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title SeaCasterPass
 * @notice Unified ERC1155 for Season Pass, Rod Parts, and Tournament Tickets
 * 
 * Token IDs:
 * - 1: Season Pass (soulbound, 60-day expiry)
 * - 100-500: Premium Rod Parts (soulbound, milestone rewards)
 * - 1000-1003: Tournament Tickets (transferable)
 * - 2000+: Loot drops (transferable, dynamic)
 */
contract SeaCasterPass is ERC1155, ERC1155Supply, Ownable {
    // Token ID constants
    uint256 public constant SEASON_PASS = 1;
    uint256 public constant PIRATE_HANDLE = 100;
    uint256 public constant PIRATE_ROD_BODY = 200;
    uint256 public constant PIRATE_HOOK = 300;
    uint256 public constant PIRATE_REEL = 400;
    uint256 public constant PIRATE_ANIMATION = 500;
    uint256 public constant DAILY_TICKET = 1000;
    uint256 public constant WEEKLY_TICKET = 1001;
    uint256 public constant BOSS_TICKET = 1002;
    uint256 public constant CHAMPIONSHIP_TICKET = 1003;

    // Season Pass price: $9.99 USDC (6 decimals)
    uint256 public passPrice = 9_990_000;
    
    // Season Pass duration: 60 days
    uint256 public passDuration = 60 days;
    
    // USDC token address
    IERC20 public immutable usdc;
    
    // Season Pass expiry tracking
    mapping(address => uint256) public passExpiry;
    
    // Soulbound token IDs (non-transferable)
    mapping(uint256 => bool) public isSoulbound;
    
    // Premium part milestone requirements
    mapping(uint256 => uint256) public partMilestone;
    
    // Events
    event SeasonPassPurchased(address indexed player, uint256 expiry);
    event PremiumPartMinted(address indexed player, uint256 tokenId, uint256 milestone);
    event TicketMinted(address indexed player, uint256 tokenId, uint256 amount);
    event LootDropped(address indexed player, uint256 tokenId, uint256 amount);

    constructor(address _usdc) ERC1155("https://api.seacaster.app/metadata/{id}.json") Ownable(msg.sender) {
        usdc = IERC20(_usdc);
        
        // Set soulbound tokens
        isSoulbound[SEASON_PASS] = true;
        isSoulbound[PIRATE_HANDLE] = true;
        isSoulbound[PIRATE_ROD_BODY] = true;
        isSoulbound[PIRATE_HOOK] = true;
        isSoulbound[PIRATE_REEL] = true;
        isSoulbound[PIRATE_ANIMATION] = true;
        
        // Set milestone requirements
        partMilestone[PIRATE_HANDLE] = 10;      // Level 10
        partMilestone[PIRATE_ROD_BODY] = 20;    // Level 20
        partMilestone[PIRATE_HOOK] = 30;        // Level 30
        partMilestone[PIRATE_REEL] = 40;        // Level 40
        partMilestone[PIRATE_ANIMATION] = 50;   // Level 50
    }

    /// @notice Purchase a 60-day Season Pass
    function purchasePass() external {
        require(usdc.transferFrom(msg.sender, owner(), passPrice), "USDC transfer failed");
        
        uint256 newExpiry = block.timestamp + passDuration;
        
        // Extend if already has pass, otherwise set new expiry
        if (passExpiry[msg.sender] > block.timestamp) {
            passExpiry[msg.sender] += passDuration;
        } else {
            passExpiry[msg.sender] = newExpiry;
            _mint(msg.sender, SEASON_PASS, 1, "");
        }
        
        emit SeasonPassPurchased(msg.sender, passExpiry[msg.sender]);
    }

    /// @notice Check if player has active pass
    function hasActivePass(address player) public view returns (bool) {
        return passExpiry[player] > block.timestamp;
    }

    /// @notice Get remaining pass time in seconds
    function getPassTimeRemaining(address player) external view returns (uint256) {
        if (passExpiry[player] <= block.timestamp) return 0;
        return passExpiry[player] - block.timestamp;
    }

    /// @notice Mint premium rod part (backend calls after milestone)
    function mintPremiumPart(address player, uint256 tokenId, uint256 milestone) external onlyOwner {
        require(isSoulbound[tokenId], "Not a premium part");
        require(partMilestone[tokenId] == milestone, "Wrong milestone");
        require(balanceOf(player, tokenId) == 0, "Already owned");
        
        _mint(player, tokenId, 1, "");
        emit PremiumPartMinted(player, tokenId, milestone);
    }

    /// @notice Mint tournament ticket (backend rewards)
    function mintTicket(address player, uint256 tokenId) external onlyOwner {
        require(tokenId >= DAILY_TICKET && tokenId <= CHAMPIONSHIP_TICKET, "Invalid ticket ID");
        
        _mint(player, tokenId, 1, "");
        emit TicketMinted(player, tokenId, 1);
    }

    /// @notice Batch mint tickets
    function mintTicketBatch(address player, uint256[] calldata tokenIds, uint256[] calldata amounts) external onlyOwner {
        _mintBatch(player, tokenIds, amounts, "");
    }

    /// @notice Mint loot drop (backend RNG)
    function mintLoot(address player, uint256 tokenId, uint256 amount) external onlyOwner {
        require(tokenId >= 2000, "Invalid loot ID");
        
        _mint(player, tokenId, amount, "");
        emit LootDropped(player, tokenId, amount);
    }

    /// @notice Burn ticket when used for tournament entry
    function burnTicket(address player, uint256 tokenId) external onlyOwner {
        require(tokenId >= DAILY_TICKET && tokenId <= CHAMPIONSHIP_TICKET, "Invalid ticket ID");
        require(balanceOf(player, tokenId) > 0, "No ticket to burn");
        
        _burn(player, tokenId, 1);
    }

    /// @notice Update pass price (owner only)
    function setPassPrice(uint256 newPrice) external onlyOwner {
        passPrice = newPrice;
    }

    /// @notice Update metadata URI (owner only)
    function setURI(string memory newuri) external onlyOwner {
        _setURI(newuri);
    }

    /// @notice Override transfer to enforce soulbound
    function _update(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory values
    ) internal override(ERC1155, ERC1155Supply) {
        // Allow minting (from == address(0)) and burning (to == address(0))
        if (from != address(0) && to != address(0)) {
            for (uint256 i = 0; i < ids.length; i++) {
                require(!isSoulbound[ids[i]], "Token is soulbound");
            }
        }
        super._update(from, to, ids, values);
    }
}
