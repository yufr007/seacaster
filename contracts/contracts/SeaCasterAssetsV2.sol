// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import {ERC1155} from '@openzeppelin/contracts/token/ERC1155/ERC1155.sol';
import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import {IERC20Metadata} from '@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol';
import {SafeERC20} from '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import {Ownable} from '@openzeppelin/contracts/access/Ownable.sol';
import {Ownable2Step} from '@openzeppelin/contracts/access/Ownable2Step.sol';
import {ReentrancyGuard} from '@openzeppelin/contracts/utils/ReentrancyGuard.sol';
/// @notice Paid access and cosmetic ownership only. No catch RNG, cash prizes or fungible game token.
contract SeaCasterAssetsV2 is ERC1155, Ownable2Step, ReentrancyGuard {
    using SafeERC20 for IERC20;
    IERC20 public immutable paymentToken;
    address public immutable treasury;
    uint256 public constant PASS_PRICE = 9_990_000;
    uint256 public constant COSMETIC_PRICE = 4_990_000;
    uint256 public constant GOLDEN_TIDE_ROD = 101;
    mapping(address => uint256) public passExpiry;
    bool public salesEnabled = true;
    error InvalidConfiguration();
    error SalesPaused();
    error PriceMismatch();
    error UnknownItem();
    error AlreadyOwned();
    event PassPurchased(address indexed player, uint256 expiresAt, uint256 paid);
    event CosmeticPurchased(address indexed player, uint256 indexed id, uint256 paid);
    event SalesStatusChanged(bool enabled);
    constructor(address token, address treasury_, address owner_, string memory metadataURI) ERC1155(metadataURI) Ownable(owner_) {
        if (token == address(0) || treasury_ == address(0) || bytes(metadataURI).length == 0) revert InvalidConfiguration();
        if (IERC20Metadata(token).decimals() != 6) revert InvalidConfiguration();
        paymentToken = IERC20(token); treasury = treasury_;
    }
    function hasActivePass(address player) external view returns (bool) { return passExpiry[player] > block.timestamp; }
    function purchasePass(uint256 expectedPrice) external nonReentrant {
        if (!salesEnabled) revert SalesPaused();
        if (expectedPrice != PASS_PRICE) revert PriceMismatch();
        uint256 starts = passExpiry[msg.sender] > block.timestamp ? passExpiry[msg.sender] : block.timestamp;
        passExpiry[msg.sender] = starts + 30 days;
        paymentToken.safeTransferFrom(msg.sender, treasury, PASS_PRICE);
        emit PassPurchased(msg.sender, passExpiry[msg.sender], PASS_PRICE);
    }
    function buyCosmetic(uint256 id, uint256 expectedPrice) external nonReentrant {
        if (!salesEnabled) revert SalesPaused();
        if (id != GOLDEN_TIDE_ROD) revert UnknownItem();
        if (expectedPrice != COSMETIC_PRICE) revert PriceMismatch();
        if (balanceOf(msg.sender, id) != 0) revert AlreadyOwned();
        paymentToken.safeTransferFrom(msg.sender, treasury, COSMETIC_PRICE);
        _mint(msg.sender, id, 1, '');
        emit CosmeticPurchased(msg.sender, id, COSMETIC_PRICE);
    }
    function setSalesEnabled(bool enabled) external onlyOwner { salesEnabled = enabled; emit SalesStatusChanged(enabled); }
    function setURI(string calldata metadataURI) external onlyOwner {
        if (bytes(metadataURI).length == 0) revert InvalidConfiguration();
        _setURI(metadataURI);
    }
}
