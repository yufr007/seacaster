// scripts/deploy.ts
// Production deployment script for SeaCaster smart contracts
// Run with: npx hardhat run scripts/deploy.ts --network base

import { ethers, run } from "hardhat";

// Network-specific USDC addresses
const USDC_ADDRESSES: Record<string, string> = {
    base: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",       // Base Mainnet
    baseSepolia: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // Base Sepolia
    localhost: "0x0000000000000000000000000000000000000000",   // Local mock
};

async function main() {
    const [deployer] = await ethers.getSigners();
    const network = await ethers.provider.getNetwork();
    const networkName = network.name === "unknown" ? "localhost" : network.name;

    console.log("╔══════════════════════════════════════════════════════════╗");
    console.log("║         SeaCaster Smart Contract Deployment              ║");
    console.log("╚══════════════════════════════════════════════════════════╝");
    console.log("");
    console.log(`🌐 Network: ${networkName} (Chain ID: ${network.chainId})`);
    console.log(`👤 Deployer: ${deployer.address}`);

    const balance = await ethers.provider.getBalance(deployer.address);
    console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH`);
    console.log("");

    // Get USDC address for network
    const usdcAddress = USDC_ADDRESSES[networkName];
    if (!usdcAddress || usdcAddress === "0x0000000000000000000000000000000000000000") {
        console.log("⚠️  Warning: Using zero address for USDC (local testing only)");
    }
    console.log(`💵 USDC: ${usdcAddress}`);
    console.log("");

    // ─────────────────────────────────────────────────────────────────
    // 1. Deploy SeaCasterPass
    // ─────────────────────────────────────────────────────────────────
    console.log("📦 Deploying SeaCasterPass...");
    const SeaCasterPass = await ethers.getContractFactory("SeaCasterPass");
    const seaCasterPass = await SeaCasterPass.deploy(usdcAddress);
    await seaCasterPass.waitForDeployment();
    const passAddress = await seaCasterPass.getAddress();
    console.log(`   ✅ SeaCasterPass: ${passAddress}`);

    // ─────────────────────────────────────────────────────────────────
    // 2. Deploy TournamentEscrow
    // ─────────────────────────────────────────────────────────────────
    console.log("📦 Deploying TournamentEscrow...");
    const TournamentEscrow = await ethers.getContractFactory("TournamentEscrow");
    const tournamentEscrow = await TournamentEscrow.deploy(usdcAddress, passAddress);
    await tournamentEscrow.waitForDeployment();
    const escrowAddress = await tournamentEscrow.getAddress();
    console.log(`   ✅ TournamentEscrow: ${escrowAddress}`);

    // ─────────────────────────────────────────────────────────────────
    // 3. Deploy Marketplace
    // ─────────────────────────────────────────────────────────────────
    console.log("📦 Deploying Marketplace...");
    const Marketplace = await ethers.getContractFactory("Marketplace");
    const marketplace = await Marketplace.deploy(passAddress, usdcAddress);
    await marketplace.waitForDeployment();
    const marketplaceAddress = await marketplace.getAddress();
    console.log(`   ✅ Marketplace: ${marketplaceAddress}`);

    console.log("");
    console.log("─────────────────────────────────────────────────────────────");
    console.log("📋 DEPLOYMENT SUMMARY");
    console.log("─────────────────────────────────────────────────────────────");
    console.log(`   SeaCasterPass:    ${passAddress}`);
    console.log(`   TournamentEscrow: ${escrowAddress}`);
    console.log(`   Marketplace:      ${marketplaceAddress}`);
    console.log("─────────────────────────────────────────────────────────────");
    console.log("");

    // ─────────────────────────────────────────────────────────────────
    // 4. Verify on Block Explorer (skip for localhost)
    // ─────────────────────────────────────────────────────────────────
    if (networkName !== "localhost" && networkName !== "hardhat") {
        console.log("🔍 Verifying contracts on BaseScan...");
        console.log("   (waiting 30s for block explorer indexing...)");
        await new Promise((r) => setTimeout(r, 30000));

        try {
            await run("verify:verify", {
                address: passAddress,
                constructorArguments: [usdcAddress],
            });
            console.log("   ✅ SeaCasterPass verified");
        } catch (e: any) {
            console.log(`   ⚠️  SeaCasterPass: ${e.message.substring(0, 60)}...`);
        }

        try {
            await run("verify:verify", {
                address: escrowAddress,
                constructorArguments: [usdcAddress, passAddress],
            });
            console.log("   ✅ TournamentEscrow verified");
        } catch (e: any) {
            console.log(`   ⚠️  TournamentEscrow: ${e.message.substring(0, 60)}...`);
        }

        try {
            await run("verify:verify", {
                address: marketplaceAddress,
                constructorArguments: [passAddress, usdcAddress],
            });
            console.log("   ✅ Marketplace verified");
        } catch (e: any) {
            console.log(`   ⚠️  Marketplace: ${e.message.substring(0, 60)}...`);
        }
    }

    console.log("");
    console.log("╔══════════════════════════════════════════════════════════╗");
    console.log("║             🎉 DEPLOYMENT COMPLETE! 🎉                   ║");
    console.log("╚══════════════════════════════════════════════════════════╝");
    console.log("");

    // Output addresses as JSON for easy frontend integration
    const addresses = {
        network: networkName,
        chainId: Number(network.chainId),
        usdc: usdcAddress,
        seaCasterPass: passAddress,
        tournamentEscrow: escrowAddress,
        marketplace: marketplaceAddress,
        deployedAt: new Date().toISOString(),
        deployer: deployer.address,
    };

    console.log("📄 Contract Addresses (JSON):");
    console.log(JSON.stringify(addresses, null, 2));

    return addresses;
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });
