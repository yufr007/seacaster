import { ethers } from "hardhat";

async function main() {
  const [signer] = await ethers.getSigners();
  
  const PASS_ADDRESS = "0x1EBa3dDA0AFd1c20A61627730439249752180432";
  const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
  
  const pass = await ethers.getContractAt("SeaCasterPass", PASS_ADDRESS);
  const usdc = await ethers.getContractAt("IERC20", USDC_ADDRESS);
  
  console.log("\n🧪 Testing SeaCaster Contracts\n");
  
  // Check USDC balance
  const usdcBalance = await usdc.balanceOf(signer.address);
  console.log(`💵 Your USDC Balance: ${ethers.formatUnits(usdcBalance, 6)} USDC`);
  
  // Check Season Pass price
  const passPrice = await pass.passPrice();
  console.log(`🎫 Season Pass Price: ${ethers.formatUnits(passPrice, 6)} USDC`);
  
  // Check if you have an active pass
  const hasPass = await pass.hasActivePass(signer.address);
  console.log(`✅ Has Active Pass: ${hasPass}`);
  
  if (!hasPass && usdcBalance >= passPrice) {
    console.log("\n💡 You have enough USDC to buy a Season Pass!");
    console.log("   Run: npx hardhat run scripts/buy-pass.ts --network base-sepolia");
  }
}

main().catch(console.error);
