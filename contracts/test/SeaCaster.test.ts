import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("SeaCaster Contracts", function () {
  async function deployFixture() {
    const [owner, player1, player2, player3] = await ethers.getSigners();

    // Deploy Mock USDC
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const usdc = await MockERC20.deploy("USDC", "USDC");

    // Deploy Contracts
    const TournamentPool = await ethers.getContractFactory("TournamentPool");
    const pool = await TournamentPool.deploy(await usdc.getAddress());

    const SeasonPass = await ethers.getContractFactory("SeasonPass");
    const pass = await SeasonPass.deploy(await usdc.getAddress(), "https://api.seacaster.app/pass/");

    const RodNFT = await ethers.getContractFactory("RodNFT");
    const rodNFT = await RodNFT.deploy("https://api.seacaster.app/rods/");

    // Setup: Mint USDC to players
    await usdc.mint(player1.address, ethers.parseUnits("1000", 6));
    await usdc.mint(player2.address, ethers.parseUnits("1000", 6));
    await usdc.mint(player3.address, ethers.parseUnits("1000", 6));

    // Approve
    await usdc.connect(player1).approve(await pool.getAddress(), ethers.MaxUint256);
    await usdc.connect(player1).approve(await pass.getAddress(), ethers.MaxUint256);
    await usdc.connect(player2).approve(await pool.getAddress(), ethers.MaxUint256);
    await usdc.connect(player3).approve(await pool.getAddress(), ethers.MaxUint256);

    return { pool, pass, rodNFT, usdc, owner, player1, player2, player3 };
  }

  describe("SeasonPass", function () {
    it("Should allow purchase with USDC", async function () {
      const { pass, usdc, player1, owner } = await loadFixture(deployFixture);

      const balanceBefore = await usdc.balanceOf(player1.address);
      await pass.connect(player1).purchasePass();

      expect(await pass.hasActivePass(player1.address)).to.be.true;
      expect(await usdc.balanceOf(player1.address)).to.equal(balanceBefore - ethers.parseUnits("9.99", 6));
      expect(await usdc.balanceOf(owner.address)).to.equal(ethers.parseUnits("9.99", 6));
    });

    it("Should prevent double purchase", async function () {
      const { pass, player1 } = await loadFixture(deployFixture);

      await pass.connect(player1).purchasePass();
      await expect(pass.connect(player1).purchasePass()).to.be.revertedWith(
        "SeaCasterPass: Already has active pass"
      );
    });

    it("Should expire after 30 days", async function () {
      const { pass, player1 } = await loadFixture(deployFixture);

      await pass.connect(player1).purchasePass();
      expect(await pass.hasActivePass(player1.address)).to.be.true;

      // Fast forward 30 days + 1 second
      await time.increase(30 * 24 * 60 * 60 + 1);

      expect(await pass.hasActivePass(player1.address)).to.be.false;
    });

    it("Should fail transfer (Soulbound)", async function () {
      const { pass, player1, player2 } = await loadFixture(deployFixture);
      await pass.connect(player1).purchasePass();

      await expect(
        pass.connect(player1).safeTransferFrom(player1.address, player2.address, 1, 1, "0x")
      ).to.be.revertedWith("SeaCasterPass: Soulbound token - transfers are disabled");
    });

    it("Should allow burning expired pass", async function () {
      const { pass, player1 } = await loadFixture(deployFixture);

      await pass.connect(player1).purchasePass();
      await time.increase(31 * 24 * 60 * 60);

      await pass.burnExpiredPass(player1.address);
      expect(await pass.balanceOf(player1.address, 1)).to.equal(0);
    });
  });

  describe("TournamentPool", function () {
    it("Should create tournament", async function () {
      const { pool } = await loadFixture(deployFixture);

      const tId = 1;
      const fee = ethers.parseUnits("2", 6);

      await pool.createTournament(tId, fee, 100, "90/10");

      const t = await pool.getTournament(tId);
      expect(t.entryFee).to.equal(fee);
      expect(t.maxParticipants).to.equal(100);
    });

    it("Should allow entry and track participants", async function () {
      const { pool, player1 } = await loadFixture(deployFixture);

      const tId = 1;
      const fee = ethers.parseUnits("2", 6);

      await pool.createTournament(tId, fee, 100, "90/10");
      await pool.connect(player1).enterTournament(tId);

      const t = await pool.getTournament(tId);
      expect(t.currentParticipants).to.equal(1);
      expect(t.prizePool).to.equal(fee);
      expect(await pool.hasEntered(tId, player1.address)).to.be.true;
    });

    it("Should prevent double entry", async function () {
      const { pool, player1 } = await loadFixture(deployFixture);

      const tId = 1;
      await pool.createTournament(tId, ethers.parseUnits("2", 6), 100, "90/10");
      await pool.connect(player1).enterTournament(tId);

      await expect(pool.connect(player1).enterTournament(tId)).to.be.revertedWith(
        "TournamentPool: Already entered"
      );
    });

    it("Should enforce max participants", async function () {
      const { pool, player1, player2, player3 } = await loadFixture(deployFixture);

      const tId = 1;
      await pool.createTournament(tId, ethers.parseUnits("1", 6), 2, "90/10");

      await pool.connect(player1).enterTournament(tId);
      await pool.connect(player2).enterTournament(tId);

      await expect(pool.connect(player3).enterTournament(tId)).to.be.revertedWith(
        "TournamentPool: Tournament full"
      );
    });

    it("Should settle tournament with 90/10 split correctly", async function () {
      const { pool, usdc, player1, player2, owner } = await loadFixture(deployFixture);

      const tId = 1;
      const fee = ethers.parseUnits("100", 6);
      await pool.createTournament(tId, fee, 10, "90/10");

      await pool.connect(player1).enterTournament(tId);
      await pool.connect(player2).enterTournament(tId);

      // Total pool: 200 USDC
      // House cut (10%): 20 USDC
      // Net pool: 180 USDC
      // Winner gets 90 USDC (50%), 2nd gets 54 USDC (30%), 3rd gets 36 USDC (20%)

      const payout1 = ethers.parseUnits("90", 6);
      const payout2 = ethers.parseUnits("90", 6);

      await pool.settleTournament(tId, [player1.address, player2.address], [payout1, payout2]);

      // Check house cut was accumulated
      expect(await pool.accumulatedHouseCut()).to.equal(ethers.parseUnits("20", 6));

      // Withdraw house cut
      const ownerBalanceBefore = await usdc.balanceOf(owner.address);
      await pool.withdrawHouseCut();
      expect(await usdc.balanceOf(owner.address)).to.equal(ownerBalanceBefore + ethers.parseUnits("20", 6));
    });

    it("Should settle tournament with 80/20 split correctly", async function () {
      const { pool, player1 } = await loadFixture(deployFixture);

      const tId = 1;
      const fee = ethers.parseUnits("100", 6);
      await pool.createTournament(tId, fee, 10, "80/20");

      await pool.connect(player1).enterTournament(tId);

      // Total pool: 100 USDC
      // House cut (20%): 20 USDC
      // Net pool: 80 USDC

      await pool.settleTournament(tId, [player1.address], [ethers.parseUnits("80", 6)]);

      expect(await pool.accumulatedHouseCut()).to.equal(ethers.parseUnits("20", 6));
    });

    it("Should prevent settlement exceeding available pool", async function () {
      const { pool, player1 } = await loadFixture(deployFixture);

      const tId = 1;
      await pool.createTournament(tId, ethers.parseUnits("100", 6), 10, "90/10");
      await pool.connect(player1).enterTournament(tId);

      // Try to payout more than net pool (90 USDC available, trying 100)
      await expect(
        pool.settleTournament(tId, [player1.address], [ethers.parseUnits("100", 6)])
      ).to.be.revertedWith("TournamentPool: Payouts exceed available pool");
    });
  });

  describe("RodNFT", function () {
    it("Should mint rod parts at milestone levels", async function () {
      const { rodNFT, owner, player1 } = await loadFixture(deployFixture);

      await rodNFT.connect(owner).mintRodPart(player1.address, 10);
      await rodNFT.connect(owner).mintRodPart(player1.address, 20);

      expect(await rodNFT.balanceOf(player1.address)).to.equal(2);
    });

    it("Should reject invalid milestone levels", async function () {
      const { rodNFT, owner, player1 } = await loadFixture(deployFixture);

      await expect(rodNFT.connect(owner).mintRodPart(player1.address, 15)).to.be.revertedWith(
        "RodNFT: Invalid milestone level"
      );
    });

    it("Should return correct metadata", async function () {
      const { rodNFT, owner, player1 } = await loadFixture(deployFixture);

      await rodNFT.connect(owner).mintRodPart(player1.address, 10);

      const [level, name, rarity, perk] = await rodNFT.getRodMetadata(1);
      expect(level).to.equal(10);
      expect(name).to.equal("Fiberglass Rod");
      expect(rarity).to.equal("Uncommon");
      expect(perk).to.equal("+5% XP");
    });

    it("Should fail transfer (Soulbound)", async function () {
      const { rodNFT, owner, player1, player2 } = await loadFixture(deployFixture);

      await rodNFT.connect(owner).mintRodPart(player1.address, 10);

      await expect(
        rodNFT.connect(player1).transferFrom(player1.address, player2.address, 1)
      ).to.be.revertedWith("RodNFT: Soulbound token - transfers are disabled");
    });

    it("Should get all rods by owner", async function () {
      const { rodNFT, owner, player1 } = await loadFixture(deployFixture);

      await rodNFT.connect(owner).mintRodPart(player1.address, 10);
      await rodNFT.connect(owner).mintRodPart(player1.address, 20);
      await rodNFT.connect(owner).mintRodPart(player1.address, 50);

      const rods = await rodNFT.getRodsByOwner(player1.address);
      expect(rods.length).to.equal(3);
    });
  });
});