import { ethers } from "hardhat";

async function main() {
  const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
  const YOUR_ADDRESS = "0xa98b74fa85C3cD4c3E214beBac8E4511A964c1f0";
  
  const usdc = await ethers.getContractAt("MockUSDC", USDC_ADDRESS);
  
  console.log("💵 Attempting to mint testnet USDC...\n");
  
  try {
    // Try to mint 100 USDC (6 decimals)
    const amount = ethers.parseUnits("100", 6);
    const tx = await usdc.mint(YOUR_ADDRESS, amount);
    await tx.wait();
    
    console.log("✅ Minted 100 USDC!");
    
    const balance = await usdc.balanceOf(YOUR_ADDRESS);
    console.log(`💰 New Balance: ${ethers.formatUnits(balance, 6)} USDC`);
  } catch (error: any) {
    console.log("⚠️ Mint failed (testnet USDC might be locked)");
    console.log("📍 Use Circle Faucet instead: https://faucet.circle.com/");
  }
}

main().catch(console.error);
