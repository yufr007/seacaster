# 🚀 SeaCaster Deployment Strategy

**Status:** Pre-Production  
**Target Network:** Base Mainnet (chainId: 8453)  
**Last Updated:** December 6, 2025

---

## 📋 Wallet Addresses

| Role | Address | Type |
|------|---------|------|
| **EOA Deployer** | `0xa98b74fa85C3cD4c3E214beBac8E4511A964c1f0` | Externally Owned Account |
| **Smart Wallet** | `0x6ADef5fC93160A7d4F64c274946F52a573DC9b92` | Final Contract Owner |
| **USDC (Base)** | `0x833589fCD6eDb6E08f4c7C32D4f71b1566469C18` | Native Base USDC |

---

## 🔄 Ownership Transfer Flow

### Step 1: Deploy Contracts (EOA)
```bash
# Deploy with EOA for full control during initial setup
cd contracts
doppler run -- npx hardhat run scripts/deploy.ts --network base-mainnet
```

**Contracts to Deploy:**
1. `SeaCasterPass.sol` - ERC-1155 Season Pass + Rod Parts
2. `TournamentEscrow.sol` - Tournament prize pool management
3. `Marketplace.sol` - P2P trading with 10% fee

### Step 2: Verify Contracts on BaseScan
```bash
doppler run -- npx hardhat verify --network base-mainnet <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

### Step 3: Configure Contracts
```solidity
// Set marketplace as approved operator for SeaCasterPass
seaCasterPass.setApprovalForAll(marketplaceAddress, true);

// Set escrow parameters
tournamentEscrow.setHouseFeeRecipient(smartWalletAddress);
```

### Step 4: Transfer Ownership to Smart Wallet
```solidity
// Transfer ownership of each contract
seaCasterPass.transferOwnership(0x6ADef5fC93160A7d4F64c274946F52a573DC9b92);
tournamentEscrow.transferOwnership(0x6ADef5fC93160A7d4F64c274946F52a573DC9b92);
marketplace.transferOwnership(0x6ADef5fC93160A7d4F64c274946F52a573DC9b92);
```

### Step 5: Accept Ownership (Smart Wallet)
Smart wallet accepts ownership via Coinbase Wallet interface.

---

## 🔐 Security Considerations

### Private Key Management
- ❌ **NEVER** store private keys in code/Git
- ✅ Use Doppler for `BASE_DEPLOYER_PRIVATE_KEY`
- ✅ Rotate EOA private key after mainnet deployment
- ✅ Document all access in audit log

### Access Control Checklist
- [ ] Only smart wallet can withdraw house fees
- [ ] Only smart wallet can pause contracts (emergency)
- [ ] Only smart wallet can update marketplace fees
- [ ] Tournament settlement requires owner signature

### Key Rotation Plan
| Timeline | Action |
|----------|--------|
| Week 1 | Deploy with EOA |
| Week 1 | Transfer to smart wallet |
| Week 2 | Rotate EOA private key in Doppler |
| Monthly | Review access logs |

---

## 📦 Testnet Deployment (Current)

**Network:** Base Sepolia (chainId: 84532)

| Contract | Address |
|----------|---------|
| MockUSDC | `0x0Cb77646C49a01a1053bAf01072954e69ce55965` |
| SeaCasterPass | `0x6E1A9f233A4128d0386Ac8cD6A53844787891971` |
| TournamentEscrow | `0x9465e54e3287ea00E4cF243f86FB927849e780e3` |
| Marketplace | `0x47DD58c99EE81910f4631Df3aF8Cc8FbfBb25Baf` |

---

## 🎯 Mainnet Launch Checklist

### Pre-Deploy
- [ ] Fund EOA with 0.5 ETH on Base Mainnet
- [ ] Verify Doppler secrets are production-ready
- [ ] Final code audit completed
- [ ] Emergency pause functions tested

### Deploy
- [ ] Deploy SeaCasterPass
- [ ] Deploy TournamentEscrow
- [ ] Deploy Marketplace
- [ ] Verify all on BaseScan

### Post-Deploy
- [ ] Transfer ownership to smart wallet
- [ ] Update Farcaster manifest with mainnet addresses
- [ ] Update frontend constants
- [ ] Rotate EOA private key
- [ ] Monitor first transactions

---

## 📡 Builder Rewards Configuration

For Farcaster builder rewards, ensure manifest includes:

```json
{
  "baseBuilderAddress": "0x6ADef5fC93160A7d4F64c274946F52a573DC9b92",
  "contracts": {
    "SeaCasterPass": "0x...",
    "TournamentEscrow": "0x...",
    "Marketplace": "0x..."
  }
}
```

**Compliance:**
- All transactions attributed to builder FID
- Public GitHub repo for contracts
- Deploy by Monday UTC 12:00 for weekly rewards
