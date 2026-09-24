const { expect } = require('chai');
const { ethers, network } = require('hardhat');
describe('SeaCasterAssetsV2', function () {
  async function fixture() {
    const [owner, player, treasury, recipient] = await ethers.getSigners();
    const token = await (await ethers.getContractFactory('TestUSDC')).deploy();
    const assets = await (await ethers.getContractFactory('SeaCasterAssetsV2')).deploy(await token.getAddress(), treasury.address, owner.address, 'https://example.invalid/items/{id}.json');
    await token.mint(player.address, 100_000_000n);
    return { owner, player, treasury, recipient, token, assets };
  }
  it('requires payment and gives no pass merely for holding a cosmetic', async function () {
    const { player, token, assets } = await fixture();
    await expect(assets.connect(player).purchasePass(9_990_000n)).to.be.reverted;
    expect(await assets.hasActivePass(player.address)).to.equal(false);
    await token.connect(player).approve(await assets.getAddress(), 4_990_000n);
    await assets.connect(player).buyCosmetic(101, 4_990_000n);
    expect(await assets.balanceOf(player.address, 101)).to.equal(1n);
    expect(await assets.hasActivePass(player.address)).to.equal(false);
  });
  it('sends exact payment to treasury, expires the pass, and extends existing time', async function () {
    const { player, treasury, token, assets } = await fixture();
    await token.connect(player).approve(await assets.getAddress(), 19_980_000n);
    await assets.connect(player).purchasePass(9_990_000n);
    const first = await assets.passExpiry(player.address);
    expect(await assets.hasActivePass(player.address)).to.equal(true);
    await assets.connect(player).purchasePass(9_990_000n);
    expect(await assets.passExpiry(player.address)).to.equal(first + 30n * 86400n);
    expect(await token.balanceOf(treasury.address)).to.equal(19_980_000n);
    await network.provider.send('evm_setNextBlockTimestamp', [Number(first + 30n * 86400n)]);
    await network.provider.send('evm_mine');
    expect(await assets.hasActivePass(player.address)).to.equal(false);
  });
  it('supports actual cosmetic transfers and rejects duplicate or unknown purchases', async function () {
    const { player, recipient, token, assets } = await fixture();
    await token.connect(player).approve(await assets.getAddress(), 20_000_000n);
    await assets.connect(player).buyCosmetic(101, 4_990_000n);
    await expect(assets.connect(player).buyCosmetic(101, 4_990_000n)).to.be.revertedWithCustomError(assets, 'AlreadyOwned');
    await expect(assets.connect(player).buyCosmetic(102, 4_990_000n)).to.be.revertedWithCustomError(assets, 'UnknownItem');
    await assets.connect(player).safeTransferFrom(player.address, recipient.address, 101, 1, '0x');
    expect(await assets.balanceOf(player.address, 101)).to.equal(0n);
    expect(await assets.balanceOf(recipient.address, 101)).to.equal(1n);
  });
  it('rejects wrong quotes and unauthorized administration, and can pause sales', async function () {
    const { owner, player, token, assets } = await fixture();
    await token.connect(player).approve(await assets.getAddress(), 20_000_000n);
    await expect(assets.connect(player).purchasePass(1)).to.be.revertedWithCustomError(assets, 'PriceMismatch');
    await expect(assets.connect(player).setSalesEnabled(false)).to.be.revertedWithCustomError(assets, 'OwnableUnauthorizedAccount');
    await assets.connect(owner).setSalesEnabled(false);
    await expect(assets.connect(player).purchasePass(9_990_000n)).to.be.revertedWithCustomError(assets, 'SalesPaused');
    expect(await token.balanceOf(player.address)).to.equal(100_000_000n);
  });
});
