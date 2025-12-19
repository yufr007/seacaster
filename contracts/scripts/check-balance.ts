import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  
  if (!deployer) {
    console.error("❌ No signer. Set PRIVATE_KEY environment variable.");
    process.exit(1);
  }

  const balance = await ethers.provider.getBalance(deployer.address);
  const network = await ethers.provider.getNetwork();

  console.log("\n╔══════════════════════════════════════════════════════╗");
  console.log("║           WALLET STATUS                          ║");
  console.log("╚══════════════════════════════════════════════════════╝");
  console.log(`📍 Address: ${deployer.address}`);
  console.log(`🌐 Network: ${network.name} (Chain ${network.chainId})`);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH`);
  console.log("");

  if (balance === 0n) {
    console.log("⚠️  INSUFFICIENT FUNDS!");
    console.log("🔗 Get testnet ETH from:");
    console.log("   → https://portal.cdp.coinbase.com/products/faucet");
    console.log("   → https://www.alchemy.com/faucets/base-sepolia\n");
    process.exit(1);
  } else if (balance < ethers.parseEther("0.01")) {
    console.log("⚠️  Low balance. Recommended: Get more ETH.");
  } else {
    console.log("✅ Ready to deploy!\n");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
