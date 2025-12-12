// ABIs for SeaCaster Smart Contracts (Base Sepolia Testnet)

// ERC20 ABI for USDC
export const ERC20_ABI = [
  {
    "constant": true,
    "inputs": [{ "name": "_owner", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "name": "balance", "type": "uint256" }],
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [{ "name": "_spender", "type": "address" }, { "name": "_value", "type": "uint256" }],
    "name": "approve",
    "outputs": [{ "name": "", "type": "bool" }],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [{ "name": "_owner", "type": "address" }, { "name": "_spender", "type": "address" }],
    "name": "allowance",
    "outputs": [{ "name": "", "type": "uint256" }],
    "type": "function"
  }
] as const;

export const SEASON_PASS_ABI = [
  {
    "inputs": [],
    "name": "purchasePass",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "user", "type": "address" }],
    "name": "hasActivePass",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "user", "type": "address" }],
    "name": "passExpiry",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "PASS_PRICE",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export const TOURNAMENT_POOL_ABI = [
  {
    "inputs": [{ "internalType": "uint256", "name": "tournamentId", "type": "uint256" }],
    "name": "enterTournament",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "tournamentId", "type": "uint256" }],
    "name": "getTournament",
    "outputs": [
      {
        "components": [
          { "internalType": "uint256", "name": "id", "type": "uint256" },
          { "internalType": "uint256", "name": "entryFee", "type": "uint256" },
          { "internalType": "uint256", "name": "prizePool", "type": "uint256" },
          { "internalType": "uint256", "name": "maxParticipants", "type": "uint256" },
          { "internalType": "uint256", "name": "currentParticipants", "type": "uint256" },
          { "internalType": "string", "name": "distribution", "type": "string" },
          { "internalType": "enum TournamentPool.TournamentStatus", "name": "status", "type": "uint8" }
        ],
        "internalType": "struct TournamentPool.Tournament",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "tournamentId", "type": "uint256" },
      { "internalType": "address", "name": "player", "type": "address" }
    ],
    "name": "hasEntered",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export const ROD_NFT_ABI = [
  {
    "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }],
    "name": "getRodsByOwner",
    "outputs": [{ "internalType": "uint256[]", "name": "", "type": "uint256[]" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }],
    "name": "getRodMetadata",
    "outputs": [
      { "internalType": "uint256", "name": "level", "type": "uint256" },
      { "internalType": "string", "name": "name", "type": "string" },
      { "internalType": "string", "name": "rarity", "type": "string" },
      { "internalType": "string", "name": "perk", "type": "string" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export const CONTRACT_ADDRESSES = {
  // Base Sepolia Testnet USDC (MockUSDC Deployed)
  USDC: '0x0Cb77646C49a01a1053bAf01072954e69ce55965',

  // Deployed Contracts
  SEASON_PASS: '0x6E1A9f233A4128d0386Ac8cD6A53844787891971',
  TOURNAMENT: '0x9465e54e3287ea00E4cF243f86FB927849e780e3',
  ROD_NFT: '0x0000000000000000000000000000000000000000' // Not used yet
} as const;

// Helper to check if contracts are deployed
export const isContractsDeployed = () => {
  return CONTRACT_ADDRESSES.SEASON_PASS !== '0x0000000000000000000000000000000000000000';
};