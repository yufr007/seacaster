// scripts/purchase-pass.ts
import { ethers } from "hardhat";

async function main() {
  const USDC_ADDRESS = "0x0Cb77646C49a01a1053bAf01072954e69ce55965";
  const SEACASTER_PASS_ADDRESS = "0x6E1A9f233A4128d0386Ac8cD6A53844787891971";
  const SMART_WALLET = "0x6ADef5fC93160A7d4F64c274946F52a573DC9b92";

  const [deployer] = await ethers.getSigners();
  
  console.log("🎣 Purchasing Season Pass for Smart Wallet...\n");

  // Get contract instances
  const usdc = await ethers.getContractAt("MockUSDC", USDC_ADDRESS);
  const seaCasterPass = await ethers.getContractAt("SeaCasterPass", SEACASTER_PASS_ADDRESS);

  // Step 1: Approve USDC
  console.log("1/3 Approving USDC...");
  const approveTx = await usdc.approve(SEACASTER_PASS_ADDRESS, 10_000_000n);
  await approveTx.wait();
  console.log("   ✅ USDC approved");

  // Step 2: Purchase pass (as deployer, then we can test with Smart Wallet later)
  console.log("2/3 Purchasing Season Pass...");
  const purchaseTx = await seaCasterPass.purchasePass();
  await purchaseTx.wait();
  console.log("   ✅ Season Pass purchased!");

  // Step 3: Check if pass is active
  console.log("3/3 Verifying pass...");
  const hasPass = await seaCasterPass.hasActivePass(deployer.address);
  const timeRemaining = await seaCasterPass.getPassTimeRemaining(deployer.address);
  
  console.log(`   ✅ Has active pass: ${hasPass}`);
  console.log(`   ✅ Time remaining: ${timeRemaining} seconds (${Number(timeRemaining) / 86400} days)`);
  
  // Check balance of Season Pass token (ID 1)
  const balance = await seaCasterPass.balanceOf(deployer.address, 1);
  console.log(`   ✅ Season Pass balance: ${balance}`);
}

main().catch(console.error);
