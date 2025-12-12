# 🚀 Base Sepolia Deployment - Quick Start

## ✅ Prerequisites Complete

- [x] Doppler configured with all secrets
- [x] CDP SDK credentials ready
- [x] Contracts compiled
- [x] WSL Ubuntu environment

---

## 📦 Step 1: Install CDP SDK

```bash
cd /mnt/c/Users/chris/Documents/SeaCaster/contracts
npm install @coinbase/coinbase-sdk
```

---

## 🔗 Step 2: Link Directory to Doppler

```bash
cd /mnt/c/Users/chris/Documents/SeaCaster/contracts

# Link to Doppler project
doppler setup --no-interactive --project seacaster --config dev
```

---

## 🏗️ Step 3: Compile Contracts

```bash
# Compile with Doppler secrets
doppler run -- npx hardhat compile
```

**Expected:** `Compiled 5 Solidity files successfully`

---

## 💰 Step 4: Fund Deployer Wallet

**Get Base Sepolia ETH:**
1. Go to https://sepoliafaucet.com
2. Connect wallet or enter address (will be shown on first deploy attempt)
3. Request 0.05 ETH

---

## 🚀 Step 5: Deploy to Base Sepolia

```bash
# Deploy using CDP SDK
doppler run -- npx ts-node scripts/deploy-cdp.ts
```

**Expected Output:**
```
🎣 Deploying SeaCaster Contracts via CDP SDK...
💵 USDC Address: 0x036CbD53842c5426634e7929541eC2318f3dCF7e
🏗️  Builder: mimmo.base.eth

✅ Created new wallet
📝 Deployer address: 0x...
💰 Balance: 0.05 ETH

📦 Deploying MockUSDC...
✅ MockUSDC deployed to: 0x...

📦 Deploying SeaCasterPass...
✅ SeaCasterPass deployed to: 0x...

📦 Deploying TournamentEscrow...
✅ TournamentEscrow deployed to: 0x...

📦 Deploying Marketplace...
✅ Marketplace deployed to: 0x...

🎉 Deployment Complete!
```

---

## 🔍 Step 6: Verify Contracts on BaseScan

```bash
# Verify SeaCasterPass
doppler run -- npx hardhat verify --network base-sepolia <SeaCasterPass_Address> <USDC_Address>

# Verify TournamentEscrow
doppler run -- npx hardhat verify --network base-sepolia <TournamentEscrow_Address> <USDC_Address> <SeaCasterPass_Address>

# Verify Marketplace
doppler run -- npx hardhat verify --network base-sepolia <Marketplace_Address> <SeaCasterPass_Address> <USDC_Address>
```

---

## ✅ Deployment Checklist

- [ ] CDP SDK installed
- [ ] Doppler linked to contracts directory
- [ ] Contracts compiled
- [ ] Wallet funded with testnet ETH
- [ ] Contracts deployed
- [ ] Deployment saved to `deployments/base-sepolia.json`
- [ ] Contracts verified on BaseScan
- [ ] Frontend updated with addresses

---

## 🎯 One-Command Deploy

```bash
cd /mnt/c/Users/chris/Documents/SeaCaster/contracts && \
npm install @coinbase/coinbase-sdk && \
doppler setup --no-interactive --project seacaster --config dev && \
doppler run -- npx hardhat compile && \
doppler run -- npx ts-node scripts/deploy-cdp.ts
```

---

## 📊 Post-Deployment

**Update frontend:**
```typescript
// constants.ts
export const CONTRACT_ADDRESSES = {
  USDC: '0x...',  // From deployment output
  SEACASTER_PASS: '0x...',
  TOURNAMENT_ESCROW: '0x...',
  MARKETPLACE: '0x...'
};
```

**Update Farcaster manifest:**
```json
{
  "baseBuilderAddress": "mimmo.base.eth",
  "contractAddresses": {
    "seaCasterPass": "0x...",
    "marketplace": "0x...",
    "tournamentEscrow": "0x..."
  }
}
```

---

## 🚀 Ready to Deploy!

All prerequisites met. Run the deploy command when ready! 🎣
