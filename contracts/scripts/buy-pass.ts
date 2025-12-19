import { ethers } from "hardhat";

async function main() {
  const [signer] = await ethers.getSigners();
  
  const PASS_ADDRESS = "0x1EBa3dDA0AFd1c20A61627730439249752180432";
  const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
  
  const pass = await ethers.getContractAt("SeaCasterPass", PASS_ADDRESS);
  const usdc = await ethers.getContractAt("IERC20", USDC_ADDRESS);
  
  console.log("\n🎫 Purchasing Season Pass...\n");
  
  // Approve USDC
  const passPrice = await pass.passPrice();
  console.log(`1️⃣ Approving ${ethers.formatUnits(passPrice, 6)} USDC...`);
  const approveTx = await usdc.approve(PASS_ADDRESS, passPrice);
  await approveTx.wait();
  console.log("   ✅ Approved");
  
  // Purchase pass
  console.log("2️⃣ Purchasing pass...");
  const purchaseTx = await pass.purchasePass();
  await purchaseTx.wait();
  console.log("   ✅ Purchased!");
  
  // Check expiry
  const expiry = await pass.passExpiry(signer.address);
  const expiryDate = new Date(Number(expiry) * 1000);
  console.log(`\n🎉 Season Pass Active Until: ${expiryDate.toLocaleString()}`);
}

main().catch(console.error);
