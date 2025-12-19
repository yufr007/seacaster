// scripts/deploy-mainnet.ts
// Mainnet deployment script for SeaCaster contracts to Base L2

import { ethers } from "hardhat";

async function main() {
    console.log("🎣 Deploying SeaCaster Contracts to Base Mainnet...\n");

    const [deployer] = await ethers.getSigners();
    console.log("📝 Deployer address:", deployer.address);

    const balance = await deployer.provider.getBalance(deployer.address);
    console.log("💰 Balance:", ethers.formatEther(balance), "ETH\n");

    if (balance < ethers.parseEther("0.01")) {
        throw new Error("Insufficient balance! Need at least 0.01 ETH for deployment.");
    }

    // Base Mainnet USDC address
    const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
    console.log("💵 Using Base USDC:", USDC_ADDRESS);

    // 1. Deploy SeaCasterPass
    console.log("\n📦 Deploying SeaCasterPass...");
    const SeaCasterPass = await ethers.getContractFactory("SeaCasterPass");
    const seaCasterPass = await SeaCasterPass.deploy(USDC_ADDRESS);
    await seaCasterPass.waitForDeployment();
    const passAddress = await seaCasterPass.getAddress();
    console.log("✅ SeaCasterPass deployed to:", passAddress);

    // 2. Deploy TournamentEscrow
    console.log("\n📦 Deploying TournamentEscrow...");
    const TournamentEscrow = await ethers.getContractFactory("TournamentEscrow");
    const tournamentEscrow = await TournamentEscrow.deploy(USDC_ADDRESS, passAddress);
    await tournamentEscrow.waitForDeployment();
    const escrowAddress = await tournamentEscrow.getAddress();
    console.log("✅ TournamentEscrow deployed to:", escrowAddress);

    // 3. Deploy Marketplace
    console.log("\n📦 Deploying Marketplace...");
    const Marketplace = await ethers.getContractFactory("Marketplace");
    const marketplace = await Marketplace.deploy(passAddress, USDC_ADDRESS);
    await marketplace.waitForDeployment();
    const marketplaceAddress = await marketplace.getAddress();
    console.log("✅ Marketplace deployed to:", marketplaceAddress);

    // Summary
    console.log("\n" + "=".repeat(50));
    console.log("🎉 MAINNET DEPLOYMENT COMPLETE!");
    console.log("=".repeat(50));
    console.log("\nContract Addresses:");
    console.log(`  USDC (Native):      ${USDC_ADDRESS}`);
    console.log(`  SeaCasterPass:      ${passAddress}`);
    console.log(`  TournamentEscrow:   ${escrowAddress}`);
    console.log(`  Marketplace:        ${marketplaceAddress}`);

    console.log("\n📋 Update these in your .env and constants.ts:");
    console.log(`
export const CONTRACT_ADDRESSES = {
  USDC: '${USDC_ADDRESS}',
  SEASON_PASS: '${passAddress}',
  TOURNAMENT: '${escrowAddress}',
  MARKETPLACE: '${marketplaceAddress}',
};
  `);

    console.log("\n🔍 Verify contracts on BaseScan:");
    console.log(`npx hardhat verify --network base ${passAddress} ${USDC_ADDRESS}`);
    console.log(`npx hardhat verify --network base ${escrowAddress} ${USDC_ADDRESS} ${passAddress}`);
    console.log(`npx hardhat verify --network base ${marketplaceAddress} ${passAddress} ${USDC_ADDRESS}`);

    // Save deployment info
    const fs = await import('fs');
    const deploymentInfo = {
        network: "base-mainnet",
        chainId: 8453,
        deployedAt: new Date().toISOString(),
        deployer: deployer.address,
        contracts: {
            USDC: USDC_ADDRESS,
            SeaCasterPass: passAddress,
            TournamentEscrow: escrowAddress,
            Marketplace: marketplaceAddress,
        }
    };

    fs.writeFileSync(
        "./deployments/base-mainnet.json",
        JSON.stringify(deploymentInfo, null, 2)
    );
    console.log("\n💾 Deployment info saved to deployments/base-mainnet.json");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });
