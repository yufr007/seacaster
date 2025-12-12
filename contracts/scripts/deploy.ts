// scripts/deploy.ts
import { ethers } from "hardhat";
import * as fs from "fs";

async function main() {
    console.log("🎣 Deploying SeaCaster Contracts to Base Sepolia...\n");

    // Get deployer from Hardhat (uses PRIVATE_KEY from env)
    const [deployer] = await ethers.getSigners();
    console.log(`Deployer: ${deployer.address}`);

    const balance = await ethers.provider.getBalance(deployer.address);
    console.log(`Balance: ${ethers.formatEther(balance)} ETH\n`);

    if (balance < ethers.parseEther("0.005")) {
        throw new Error("❌ Insufficient ETH. Need at least 0.005 ETH for deployment");
    }

    // Deploy MockUSDC
    console.log("1/4 Deploying MockUSDC...");
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const mockUSDC = await MockUSDC.deploy();
    await mockUSDC.waitForDeployment();
    const usdcAddress = await mockUSDC.getAddress();
    console.log(`   ✅ MockUSDC: ${usdcAddress}`);

    // Deploy SeaCasterPass
    console.log("2/4 Deploying SeaCasterPass...");
    const SeaCasterPass = await ethers.getContractFactory("SeaCasterPass");
    const seaCasterPass = await SeaCasterPass.deploy(usdcAddress);
    await seaCasterPass.waitForDeployment();
    const seaCasterPassAddress = await seaCasterPass.getAddress();
    console.log(`   ✅ SeaCasterPass: ${seaCasterPassAddress}`);

    // Deploy TournamentEscrow
    console.log("3/4 Deploying TournamentEscrow...");
    const TournamentEscrow = await ethers.getContractFactory("TournamentEscrow");
    const tournamentEscrow = await TournamentEscrow.deploy(usdcAddress, seaCasterPassAddress);
    await tournamentEscrow.waitForDeployment();
    const tournamentEscrowAddress = await tournamentEscrow.getAddress();
    console.log(`   ✅ TournamentEscrow: ${tournamentEscrowAddress}`);

    // Deploy Marketplace
    console.log("4/4 Deploying Marketplace...");
    const Marketplace = await ethers.getContractFactory("Marketplace");
    const marketplace = await Marketplace.deploy(seaCasterPassAddress, usdcAddress);
    await marketplace.waitForDeployment();
    const marketplaceAddress = await marketplace.getAddress();
    console.log(`   ✅ Marketplace: ${marketplaceAddress}`);

    // Summary
    const deployment = {
        network: "base-sepolia",
        chainId: 84532,
        deployer: deployer.address,
        timestamp: new Date().toISOString(),
        contracts: {
            MockUSDC: usdcAddress,
            SeaCasterPass: seaCasterPassAddress,
            TournamentEscrow: tournamentEscrowAddress,
            Marketplace: marketplaceAddress
        }
    };

    console.log("\n📄 DEPLOYMENT SUMMARY:");
    console.log("─".repeat(50));
    console.log(JSON.stringify(deployment, null, 2));
    console.log("─".repeat(50));

    // Save to file
    const deploymentsDir = "./deployments";
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir);
    }
    fs.writeFileSync(
        `${deploymentsDir}/base-sepolia.json`,
        JSON.stringify(deployment, null, 2)
    );
    console.log("\n✅ Saved to deployments/base-sepolia.json");

    // Verification commands
    console.log("\n📋 VERIFY COMMANDS (wait 30 seconds then run):");
    console.log(`npx hardhat verify --network base-sepolia ${usdcAddress}`);
    console.log(`npx hardhat verify --network base-sepolia ${seaCasterPassAddress} "${usdcAddress}"`);
    console.log(`npx hardhat verify --network base-sepolia ${tournamentEscrowAddress} "${usdcAddress}" "${seaCasterPassAddress}"`);
    console.log(`npx hardhat verify --network base-sepolia ${marketplaceAddress} "${seaCasterPassAddress}" "${usdcAddress}"`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
