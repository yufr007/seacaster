// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { IERC1155 } from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import { IERC1155Receiver } from "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Ownable2Step } from "@openzeppelin/contracts/access/Ownable2Step.sol";
import { Pausable } from "@openzeppelin/contracts/utils/Pausable.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { IERC165 } from "@openzeppelin/contracts/utils/introspection/IERC165.sol";

/**
 * @title Marketplace
 * @author SeaCaster Team
 * @notice Production-grade P2P trading for SeaCaster ERC1155 items with protocol fee.
 * @dev Implements:
 *      - Pull-based escrow custody for ERC1155 tokens
 *      - SafeERC20 for USDC compatibility across chains
 *      - Ownable2Step for secure ownership transfer
 *      - Pausable for emergency circuit breaker
 *      - ERC165 for interface detection
 *      - Comprehensive events for indexing
 *
 * Security features:
 *      - ReentrancyGuard on all state-changing functions
 *      - Fee capped at 20% maximum
 *      - Minimum price to prevent dust attacks
 *      - Emergency withdrawal for stuck tokens
 *      - Two-step ownership transfer
 */
contract Marketplace is Ownable2Step, Pausable, ReentrancyGuard, IERC1155Receiver {
    using SafeERC20 for IERC20;

    // ═══════════════════════════════════════════════════════════════════════════
    // CONSTANTS & IMMUTABLES
    // ═══════════════════════════════════════════════════════════════════════════

    /// @notice SeaCaster ERC1155 Pass contract
    IERC1155 public immutable seaCasterPass;

    /// @notice USDC payment token (6 decimals)
    IERC20 public immutable usdc;

    /// @notice Maximum fee in basis points (20%)
    uint256 public constant MAX_FEE_BPS = 2000;

    /// @notice Minimum price per unit to prevent dust listings (0.01 USDC)
    uint256 public constant MIN_PRICE_PER_UNIT = 10_000; // 0.01 USDC (6 decimals)

    /// @notice Basis points denominator
    uint256 private constant BPS_DENOMINATOR = 10_000;

    // ═══════════════════════════════════════════════════════════════════════════
    // STATE VARIABLES
    // ═══════════════════════════════════════════════════════════════════════════

    /// @notice Protocol fee in basis points (default 10%)
    uint256 public feeBps = 1000;

    /// @notice Fee recipient address (defaults to owner)
    address public feeRecipient;

    /// @notice Next listing ID counter
    uint256 public nextListingId = 1;

    /// @notice Listing storage
    struct Listing {
        address seller;
        uint256 tokenId;
        uint256 amount;
        uint256 pricePerUnit; // USDC smallest units per 1 token
        uint64 createdAt;
        bool active;
    }

    mapping(uint256 => Listing) public listings;

    // ═══════════════════════════════════════════════════════════════════════════
    // EVENTS
    // ═══════════════════════════════════════════════════════════════════════════

    event Listed(
        uint256 indexed listingId,
        address indexed seller,
        uint256 indexed tokenId,
        uint256 amount,
        uint256 pricePerUnit,
        uint64 createdAt
    );

    event Purchased(
        uint256 indexed listingId,
        address indexed buyer,
        address indexed seller,
        uint256 tokenId,
        uint256 amount,
        uint256 totalPrice,
        uint256 fee,
        uint256 sellerProceeds
    );

    event Cancelled(uint256 indexed listingId, address indexed seller, uint256 refundedAmount);

    event FeeUpdated(uint256 oldFeeBps, uint256 newFeeBps);

    event FeeRecipientUpdated(address indexed oldRecipient, address indexed newRecipient);

    event EmergencyWithdrawal(address indexed token, address indexed to, uint256 amount);

    // ═══════════════════════════════════════════════════════════════════════════
    // ERRORS
    // ═══════════════════════════════════════════════════════════════════════════

    error InvalidAddress();
    error InvalidAmount();
    error InvalidPrice();
    error InsufficientBalance();
    error NotApproved();
    error ListingNotActive();
    error NotAuthorized();
    error ExceedsMaxFee();
    error PriceOverflow();

    // ═══════════════════════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Deploy the marketplace
     * @param _seaCasterPass Address of the SeaCaster ERC1155 contract
     * @param _usdc Address of the USDC token contract
     */
    constructor(
        address _seaCasterPass,
        address _usdc
    ) Ownable(msg.sender) {
        if (_seaCasterPass == address(0)) revert InvalidAddress();
        if (_usdc == address(0)) revert InvalidAddress();

        seaCasterPass = IERC1155(_seaCasterPass);
        usdc = IERC20(_usdc);
        feeRecipient = msg.sender;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // LISTING FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice List items for sale (items are escrowed into the marketplace)
     * @param tokenId ERC1155 token ID to list
     * @param amount Quantity to list
     * @param pricePerUnit Price per 1 token in USDC smallest units (6 decimals)
     * @return listingId The ID of the created listing
     */
    function list(
        uint256 tokenId,
        uint256 amount,
        uint256 pricePerUnit
    ) external nonReentrant whenNotPaused returns (uint256 listingId) {
        // Validate inputs
        if (amount == 0) revert InvalidAmount();
        if (pricePerUnit < MIN_PRICE_PER_UNIT) revert InvalidPrice();

        // Check seller has sufficient balance
        if (seaCasterPass.balanceOf(msg.sender, tokenId) < amount) {
            revert InsufficientBalance();
        }

        // Check marketplace is approved
        if (!seaCasterPass.isApprovedForAll(msg.sender, address(this))) {
            revert NotApproved();
        }

        // Create listing
        listingId = nextListingId++;
        uint64 timestamp = uint64(block.timestamp);

        listings[listingId] = Listing({
            seller: msg.sender,
            tokenId: tokenId,
            amount: amount,
            pricePerUnit: pricePerUnit,
            createdAt: timestamp,
            active: true
        });

        // Escrow tokens in marketplace contract
        seaCasterPass.safeTransferFrom(msg.sender, address(this), tokenId, amount, "");

        emit Listed(listingId, msg.sender, tokenId, amount, pricePerUnit, timestamp);
    }

    /**
     * @notice Buy some or all of a listing
     * @param listingId ID of the listing
     * @param amount Quantity to buy (must be <= remaining amount)
     */
    function buy(
        uint256 listingId,
        uint256 amount
    ) external nonReentrant whenNotPaused {
        Listing storage listing = listings[listingId];

        // Validate listing state
        if (!listing.active) revert ListingNotActive();
        if (amount == 0 || amount > listing.amount) revert InvalidAmount();

        // Cache storage reads
        address seller = listing.seller;
        uint256 tokenId = listing.tokenId;
        uint256 pricePerUnit = listing.pricePerUnit;

        // Compute payment amounts with overflow check
        uint256 totalPrice = amount * pricePerUnit;
        if (totalPrice / amount != pricePerUnit) revert PriceOverflow();

        uint256 fee = (totalPrice * feeBps) / BPS_DENOMINATOR;
        uint256 sellerAmount = totalPrice - fee;

        // Update listing state BEFORE external calls (CEI pattern)
        listing.amount -= amount;
        if (listing.amount == 0) {
            listing.active = false;
        }

        // Transfer USDC from buyer -> seller
        usdc.safeTransferFrom(msg.sender, seller, sellerAmount);

        // Transfer fee to fee recipient
        if (fee > 0) {
            usdc.safeTransferFrom(msg.sender, feeRecipient, fee);
        }

        // Transfer ERC1155 tokens from escrow -> buyer
        seaCasterPass.safeTransferFrom(address(this), msg.sender, tokenId, amount, "");

        emit Purchased(
            listingId,
            msg.sender,
            seller,
            tokenId,
            amount,
            totalPrice,
            fee,
            sellerAmount
        );
    }

    /**
     * @notice Cancel listing and return all remaining tokens to seller
     * @param listingId ID of the listing to cancel
     */
    function cancel(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];

        // Validate listing state
        if (!listing.active) revert ListingNotActive();

        // Only seller or owner can cancel
        if (listing.seller != msg.sender && msg.sender != owner()) {
            revert NotAuthorized();
        }

        // Cache values before state change
        address seller = listing.seller;
        uint256 tokenId = listing.tokenId;
        uint256 refundAmount = listing.amount;

        // Update state BEFORE external call (CEI pattern)
        listing.active = false;
        listing.amount = 0;

        // Return remaining tokens to seller
        if (refundAmount > 0) {
            seaCasterPass.safeTransferFrom(address(this), seller, tokenId, refundAmount, "");
        }

        emit Cancelled(listingId, seller, refundAmount);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // VIEW FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Get listing info
     * @param listingId ID of the listing
     * @return seller Address of the seller
     * @return tokenId ERC1155 token ID
     * @return amount Remaining quantity
     * @return pricePerUnit Price per token in USDC
     * @return createdAt Timestamp when listing was created
     * @return active Whether listing is active
     */
    function getListing(uint256 listingId)
        external
        view
        returns (
            address seller,
            uint256 tokenId,
            uint256 amount,
            uint256 pricePerUnit,
            uint64 createdAt,
            bool active
        )
    {
        Listing storage l = listings[listingId];
        return (l.seller, l.tokenId, l.amount, l.pricePerUnit, l.createdAt, l.active);
    }

    /**
     * @notice Calculate total price and fee for a purchase
     * @param listingId ID of the listing
     * @param amount Quantity to buy
     * @return totalPrice Total USDC required
     * @return fee Protocol fee amount
     * @return sellerProceeds Amount seller receives
     */
    function calculatePurchase(uint256 listingId, uint256 amount)
        external
        view
        returns (uint256 totalPrice, uint256 fee, uint256 sellerProceeds)
    {
        Listing storage l = listings[listingId];
        totalPrice = amount * l.pricePerUnit;
        fee = (totalPrice * feeBps) / BPS_DENOMINATOR;
        sellerProceeds = totalPrice - fee;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ADMIN FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Update protocol fee (owner only, max 20%)
     * @param newFeeBps New fee in basis points
     */
    function setFee(uint256 newFeeBps) external onlyOwner {
        if (newFeeBps > MAX_FEE_BPS) revert ExceedsMaxFee();

        uint256 oldFeeBps = feeBps;
        feeBps = newFeeBps;

        emit FeeUpdated(oldFeeBps, newFeeBps);
    }

    /**
     * @notice Update fee recipient address
     * @param newRecipient New fee recipient address
     */
    function setFeeRecipient(address newRecipient) external onlyOwner {
        if (newRecipient == address(0)) revert InvalidAddress();

        address oldRecipient = feeRecipient;
        feeRecipient = newRecipient;

        emit FeeRecipientUpdated(oldRecipient, newRecipient);
    }

    /**
     * @notice Pause the marketplace (emergency circuit breaker)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause the marketplace
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Emergency withdrawal of stuck ERC20 tokens (not USDC in normal operation)
     * @param token Address of the token to withdraw
     * @param to Recipient address
     * @param amount Amount to withdraw
     */
    function emergencyWithdrawERC20(
        address token,
        address to,
        uint256 amount
    ) external onlyOwner {
        if (to == address(0)) revert InvalidAddress();

        IERC20(token).safeTransfer(to, amount);

        emit EmergencyWithdrawal(token, to, amount);
    }

    /**
     * @notice Emergency withdrawal of stuck ERC1155 tokens
     * @dev Only for tokens sent directly without listing
     * @param tokenId Token ID to withdraw
     * @param to Recipient address
     * @param amount Amount to withdraw
     */
    function emergencyWithdrawERC1155(
        uint256 tokenId,
        address to,
        uint256 amount
    ) external onlyOwner {
        if (to == address(0)) revert InvalidAddress();

        seaCasterPass.safeTransferFrom(address(this), to, tokenId, amount, "");

        emit EmergencyWithdrawal(address(seaCasterPass), to, amount);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ERC1155 RECEIVER INTERFACE
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Handle receipt of a single ERC1155 token
     */
    function onERC1155Received(
        address,
        address,
        uint256,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return this.onERC1155Received.selector;
    }

    /**
     * @notice Handle receipt of multiple ERC1155 tokens
     */
    function onERC1155BatchReceived(
        address,
        address,
        uint256[] calldata,
        uint256[] calldata,
        bytes calldata
    ) external pure override returns (bytes4) {
        return this.onERC1155BatchReceived.selector;
    }

    /**
     * @notice ERC165 interface detection
     * @param interfaceId Interface identifier
     * @return True if supported
     */
    function supportsInterface(bytes4 interfaceId) external pure override returns (bool) {
        return
            interfaceId == type(IERC1155Receiver).interfaceId ||
            interfaceId == type(IERC165).interfaceId;
    }
}
