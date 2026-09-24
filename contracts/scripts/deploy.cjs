const { ethers } = require('hardhat');
const { mkdir, writeFile } = require('node:fs/promises');
async function main() {
  const network = await ethers.provider.getNetwork();
  if (![8453n, 84532n].includes(network.chainId)) throw new Error('Choose Base or Base Sepolia.');
  if (network.chainId === 8453n && process.env.CONFIRM_MAINNET !== 'DEPLOY_SEACASTER_V2') throw new Error('Mainnet requires explicit CONFIRM_MAINNET=DEPLOY_SEACASTER_V2.');
  const token = process.env.PAYMENT_TOKEN, treasury = process.env.TREASURY, owner = process.env.OWNER, uri = process.env.METADATA_URI;
  if (![token, treasury, owner].every(v => v && ethers.isAddress(v) && v !== ethers.ZeroAddress) || !uri?.startsWith('https://')) throw new Error('Set PAYMENT_TOKEN, TREASURY, OWNER and an HTTPS METADATA_URI.');
  const deployed = await (await ethers.getContractFactory('SeaCasterAssetsV2')).deploy(token, treasury, owner, uri);
  await deployed.waitForDeployment();
  const address = await deployed.getAddress();
  await mkdir('deployments', { recursive: true });
  await writeFile(`deployments/v2-${network.chainId}.json`, JSON.stringify({ chainId: Number(network.chainId), address, paymentToken: token, treasury, owner, metadataURI: uri, transactionHash: deployed.deploymentTransaction().hash }, null, 2) + '\n');
  console.log('SeaCasterAssetsV2 deployed:', address);
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
