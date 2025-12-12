import { ethers } from "hardhat";

async function main() {
  const USDC_ADDRESS = "0x0Cb77646C49a01a1053bAf01072954e69ce55965";
  const RECIPIENT = "0x6ADef5fC93160A7d4F64c274946F52a573DC9b92";
  const AMOUNT = 1000_000_000n; // 1000 USDC (6 decimals)

  const [signer] = await ethers.getSigners();
  console.log(`Minting from: ${signer.address}`);

  const usdc = await ethers.getContractAt("MockUSDC", USDC_ADDRESS);
  
  console.log(`Minting ${AMOUNT} USDC to ${RECIPIENT}...`);
  const tx = await usdc.mint(RECIPIENT, AMOUNT);
  await tx.wait();
  
  const balance = await usdc.balanceOf(RECIPIENT);
  console.log(`✅ New balance: ${balance} (${Number(balance) / 1_000_000} USDC)`);
}

main().catch(console.error);
