// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockUSDC
 * @notice Testnet USDC with public faucet
 */
contract MockUSDC is ERC20, Ownable {
    constructor() ERC20("USD Coin", "USDC") Ownable(msg.sender) {
        // Mint 1M USDC to deployer
        _mint(msg.sender, 1_000_000 * 10**6);
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    /// @notice Public faucet - anyone can mint testnet USDC
    function mint(address to, uint256 amount) external {
        require(amount <= 10_000 * 10**6, "Max 10k USDC per mint");
        _mint(to, amount);
    }

    /// @notice Owner can mint any amount
    function ownerMint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
