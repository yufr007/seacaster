// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title Marketplace
 * @notice P2P trading for SeaCaster items with 10% protocol fee
 */
contract Marketplace is Ownable, ReentrancyGuard {
    IERC1155 public immutable seaCasterPass;
    IERC20 public immutable usdc;
    
    // Protocol fee: 10%
    uint256 public feeBps = 1000;
    
    struct Listing {
        address seller;
        uint256 tokenId;
        uint256 amount;
        uint256 pricePerUnit;
        bool active;
    }
    
    mapping(uint256 => Listing) public listings;
    uint256 public nextListingId = 1;
    
    // Events
    event Listed(uint256 indexed listingId, address indexed seller, uint256 tokenId, uint256 amount, uint256 pricePerUnit);
    event Purchased(uint256 indexed listingId, address indexed buyer, uint256 amount, uint256 totalPrice);
    event Cancelled(uint256 indexed listingId);
    event FeeUpdated(uint256 newFeeBps);

    constructor(address _seaCasterPass, address _usdc) Ownable(msg.sender) {
        seaCasterPass = IERC1155(_seaCasterPass);
        usdc = IERC20(_usdc);
    }

    /// @notice List items for sale
    function list(
        uint256 tokenId,
        uint256 amount,
        uint256 pricePerUnit
    ) external nonReentrant returns (uint256) {
        require(amount > 0, "Amount must be > 0");
        require(pricePerUnit > 0, "Price must be > 0");
        require(seaCasterPass.balanceOf(msg.sender, tokenId) >= amount, "Insufficient balance");
        require(seaCasterPass.isApprovedForAll(msg.sender, address(this)), "Not approved");
        
        uint256 listingId = nextListingId++;
        
        listings[listingId] = Listing({
            seller: msg.sender,
            tokenId: tokenId,
            amount: amount,
            pricePerUnit: pricePerUnit,
            active: true
        });
        
        // Transfer tokens to marketplace
        seaCasterPass.safeTransferFrom(msg.sender, address(this), tokenId, amount, "");
        
        emit Listed(listingId, msg.sender, tokenId, amount, pricePerUnit);
        return listingId;
    }

    /// @notice Buy listed items
    function buy(uint256 listingId, uint256 amount) external nonReentrant {
        Listing storage l = listings[listingId];
        require(l.active, "Listing not active");
        require(amount > 0 && amount <= l.amount, "Invalid amount");
        
        uint256 totalPrice = amount * l.pricePerUnit;
        uint256 fee = (totalPrice * feeBps) / 10000;
        uint256 sellerAmount = totalPrice - fee;
        
        // Transfer USDC from buyer
        require(usdc.transferFrom(msg.sender, l.seller, sellerAmount), "Seller payment failed");
        require(usdc.transferFrom(msg.sender, owner(), fee), "Fee payment failed");
        
        // Transfer tokens to buyer
        seaCasterPass.safeTransferFrom(address(this), msg.sender, l.tokenId, amount, "");
        
        // Update listing
        l.amount -= amount;
        if (l.amount == 0) {
            l.active = false;
        }
        
        emit Purchased(listingId, msg.sender, amount, totalPrice);
    }

    /// @notice Cancel listing and return tokens
    function cancel(uint256 listingId) external nonReentrant {
        Listing storage l = listings[listingId];
        require(l.active, "Listing not active");
        require(l.seller == msg.sender || msg.sender == owner(), "Not authorized");
        
        l.active = false;
        
        // Return tokens to seller
        seaCasterPass.safeTransferFrom(address(this), l.seller, l.tokenId, l.amount, "");
        
        emit Cancelled(listingId);
    }

    /// @notice Get listing info
    function getListing(uint256 listingId) external view returns (
        address seller,
        uint256 tokenId,
        uint256 amount,
        uint256 pricePerUnit,
        bool active
    ) {
        Listing storage l = listings[listingId];
        return (l.seller, l.tokenId, l.amount, l.pricePerUnit, l.active);
    }

    /// @notice Update fee (owner only, max 20%)
    function setFee(uint256 newFeeBps) external onlyOwner {
        require(newFeeBps <= 2000, "Max 20%");
        feeBps = newFeeBps;
        emit FeeUpdated(newFeeBps);
    }

    /// @notice Required for ERC1155 receiver
    function onERC1155Received(
        address,
        address,
        uint256,
        uint256,
        bytes calldata
    ) external pure returns (bytes4) {
        return this.onERC1155Received.selector;
    }

    function onERC1155BatchReceived(
        address,
        address,
        uint256[] calldata,
        uint256[] calldata,
        bytes calldata
    ) external pure returns (bytes4) {
        return this.onERC1155BatchReceived.selector;
    }
}
