import { ethers } from "hardhat";

async function main() {
  const SMART_WALLET = "0x6ADef5fC93160A7d4F64c274946F52a573DC9b92"; // mimmo.base.eth

  const contracts = [
    { name: "MockUSDC", address: "0x0Cb77646C49a01a1053bAf01072954e69ce55965" },
    { name: "SeaCasterPass", address: "0x6E1A9f233A4128d0386Ac8cD6A53844787891971" },
    { name: "TournamentEscrow", address: "0x9465e54e3287ea00E4cF243f86FB927849e780e3" },
    { name: "Marketplace", address: "0x47DD58c99EE81910f4631Df3aF8Cc8FbfBb25Baf" }
  ];

  console.log(`\n🔐 Transferring ownership to Smart Wallet: ${SMART_WALLET}\n`);

  for (const contract of contracts) {
    try {
      const instance = await ethers.getContractAt("Ownable", contract.address);
      const currentOwner = await instance.owner();
      
      if (currentOwner.toLowerCase() === SMART_WALLET.toLowerCase()) {
        console.log(`✅ ${contract.name}: Already owned by Smart Wallet`);
        continue;
      }

      console.log(`   ${contract.name}: Transferring from ${currentOwner}...`);
      const tx = await instance.transferOwnership(SMART_WALLET);
      await tx.wait();
      console.log(`✅ ${contract.name}: Ownership transferred!`);
    } catch (error) {
      console.error(`❌ ${contract.name}: Failed -`, error);
    }
  }

  console.log("\n🎉 Ownership transfer complete!");
}

main().catch(console.error);
