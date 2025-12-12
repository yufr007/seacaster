# SeaCaster Base Sepolia Deployment Guide

## 🚀 Quick Start Deployment

### Prerequisites
1. **Base Sepolia ETH** (~0.01 ETH for gas)
   - Get from: https://sepoliafaucet.com or https://www.alchemy.com/faucets/base-sepolia
2. **Private Key** for deployer wallet: `0x6ADef5fC93160A7d4F64c274946F52a573DC9b92`
3. **BaseScan API Key** from https://basescan.org/myapikey

### Step 1: Environment Setup

Create `.env` file in `contracts/` directory:

```bash
PRIVATE_KEY=your_private_key_without_0x_prefix
BASESCAN_API_KEY=your_basescan_api_key
BASE_SEPOLIA_RPC=https://sepolia.base.org
```

### Step 2: Install Dependencies

```bash
cd c:\Users\chris\Documents\SeaCaster\contracts
npm install
```

### Step 3: Deploy Contracts

```bash
npx hardhat run scripts/deploy.ts --network base-sepolia
```

**Expected Output:**
```
✅ MockUSDC deployed to: 0x...
✅ SeaCasterPass deployed to: 0x...
✅ TournamentEscrow deployed to: 0x...
✅ Marketplace deployed to: 0x...
📄 Deployment info saved to: deployments/base-sepolia.json
```

**⚠️ SAVE ALL ADDRESSES** - You'll need them for frontend/backend configuration!

### Step 4: Verify Contracts

Wait 30 seconds for block confirmation, then run:

```bash
# Get addresses from previous output or deployments/base-sepolia.json

npx hardhat verify --network base-sepolia <SeaCasterPass> <MockUSDC>

npx hardhat verify --network base-sepolia <TournamentEscrow> <MockUSDC> <SeaCasterPass>

npx hardhat verify --network base-sepolia <Marketplace> <SeaCasterPass> <MockUSDC>
```

Check verification status on BaseScan:
- https://sepolia.basescan.org/address/<YourContractAddress>

---

## 🧪 Testnet Verification Checklist

### 1. Get Test USDC

Use the MockUSDC faucet:

```bash
# Using cast (Foundry)
cast send <MockUSDC_Address> "mint(address,uint256)" YOUR_WALLET 1000000000 --rpc-url https://sepolia.base.org --private-key $PRIVATE_KEY

# Or call directly on BaseScan
# Navigate to Contract > Write > mint(to, amount)
# Enter: YOUR_WALLET, 1000000000 (1000 USDC with 6 decimals)
```

### 2. Test Season Pass Purchase

```bash
# Approve USDC
cast send <MockUSDC> "approve(address,uint256)" <SeaCasterPass> 10000000 --rpc-url https://sepolia.base.org --private-key $PRIVATE_KEY

# Purchase pass
cast send <SeaCasterPass> "purchasePass()" --rpc-url https://sepolia.base.org --private-key $PRIVATE_KEY

# Verify purchase
cast call <SeaCasterPass> "hasActivePass(address)" YOUR_WALLET --rpc-url https://sepolia.base.org
# Should return: true (0x0000000000000000000000000000000000000000000000000000000000000001)
```

### 3. Test Premium Rod Part Minting

```bash
# Mint Pirate Handle (Level 10 milestone)
cast send <SeaCasterPass> "mintPremiumPart(address,uint256,uint256)" YOUR_WALLET 100 10 --rpc-url https://sepolia.base.org --private-key $PRIVATE_KEY

# Check balance
cast call <SeaCasterPass> "balanceOf(address,uint256)" YOUR_WALLET 100 --rpc-url https://sepolia.base.org
# Should return: 1
```

### 4. Test Tournament Ticket

```bash
# Mint Daily Tournament Ticket
cast send <SeaCasterPass> "mintTicket(address,uint256)" YOUR_WALLET 1000 --rpc-url https://sepolia.base.org --private-key $PRIVATE_KEY

# Create tournament
cast send <TournamentEscrow> "createTournament(uint256,uint256,uint256,uint256,string)" 1 500000 1000 60 "90/10" --rpc-url https://sepolia.base.org --private-key $PRIVATE_KEY

# Enter with ticket
cast send <TournamentEscrow> "enterTournament(uint256,bool)" 1 true --rpc-url https://sepolia.base.org --private-key $PRIVATE_KEY
```

### 5. Test Marketplace

```bash
# Approve marketplace
cast send <SeaCasterPass> "setApprovalForAll(address,bool)" <Marketplace> true --rpc-url https://sepolia.base.org --private-key $PRIVATE_KEY

# List tournament ticket (if you have extra)
cast send <Marketplace> "list(uint256,uint256,uint256)" 1000 1 750000 --rpc-url https://sepolia.base.org --private-key $PRIVATE_KEY

# View listing
cast call <Marketplace> "getListing(uint256)" 1 --rpc-url https://sepolia.base.org
```

---

## 📦 Token ID Reference

| Token | ID | Type | Transferable |
|-------|---|----|--------------|
| Season Pass | 1 | ERC1155 | ❌ Soulbound |
| Pirate Handle | 100 | ERC1155 | ❌ Soulbound |
| Pirate Rod Body | 200 | ERC1155 | ❌ Soulbound |
| Pirate Hook | 300 | ERC1155 | ❌ Soulbound |
| Pirate Reel | 400 | ERC1155 | ❌ Soulbound |
| Pirate Animation | 500 | ERC1155 | ❌ Soulbound |
| Daily Ticket | 1000 | ERC1155 | ✅ Yes |
| Weekly Ticket | 1001 | ERC1155 | ✅ Yes |
| Boss Ticket | 1002 | ERC1155 | ✅ Yes |
| Championship Ticket | 1003 | ERC1155 | ✅ Yes |

---

## 🔗 Frontend Integration

After deployment, update `contracts/abis.ts`:

```typescript
export const CONTRACT_ADDRESSES = {
  USDC: '0x...', // MockUSDC address
  SEACASTER_PASS: '0x...', // From deployment output
  TOURNAMENT_ESCROW: '0x...', 
  MARKETPLACE: '0x...'
} as const;

export const TOKEN_IDS = {
  SEASON_PASS: 1,
  PIRATE: {
    HANDLE: 100,
    ROD_BODY: 200,
    HOOK: 300,
    REEL: 400,
    ANIMATION: 500
  },
  TICKETS: {
    DAILY: 1000,
    WEEKLY: 1001,
    BOSS: 1002,
    CHAMPIONSHIP: 1003
  }
} as const;
```

---

## ⚠️ Troubleshooting

**"Insufficient funds"**
- Get more Base Sepolia ETH from faucet
- Each deployment costs ~0.005 ETH

**"Nonce too high"**
- Wait 30 seconds and retry
- Or reset MetaMask account (Settings > Advanced > Reset Account)

**Verification fails**
- Wait 60 seconds after deployment
- Ensure constructor arguments match deployment
- Check BaseScan API key is valid

**Hardhat crashes on Windows**
- Use WSL: `wsl` then navigate to project
- Or deploy from Linux/Mac
- Contracts are valid - it's an environment issue

---

## ✅ Deployment Complete Checklist

- [ ] All 4 contracts deployed
- [ ] All contracts verified on BaseScan (green checkmark)
- [ ] Test USDC minted to deployer
- [ ] Season Pass purchase tested
- [ ] Rod part minting tested
- [ ] Tournament ticket minting tested
- [ ] Marketplace listing tested
- [ ] Frontend addresses updated
- [ ] Farcaster manifest updated with contract addresses

**Once all checked, you're ready for beta testing!** 🎣
