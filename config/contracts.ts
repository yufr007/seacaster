// config/contracts.ts
// Auto-generated from deployment on 2025-12-18
// Network: Base Sepolia (chainId: 84532)

export const NETWORKS = {
    BASE_MAINNET: {
        chainId: 8453,
        name: "Base",
        rpcUrl: "https://mainnet.base.org",
        blockExplorer: "https://basescan.org",
        usdc: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    },
    BASE_SEPOLIA: {
        chainId: 84532,
        name: "Base Sepolia",
        rpcUrl: "https://sepolia.base.org",
        blockExplorer: "https://sepolia.basescan.org",
        usdc: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    },
} as const;

// Current active network
export const ACTIVE_NETWORK = NETWORKS.BASE_SEPOLIA;

// Deployed contract addresses
export const CONTRACTS = {
    // Base Sepolia (Testnet) - Deployed 2025-12-18
    "base-sepolia": {
        chainId: 84532,
        usdc: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
        seaCasterPass: "0x1EBa3dDA0AFd1c20A61627730439249752180432",
        tournamentEscrow: "0x8Dc5bEdC24315F9f18111843FCA7Ecf86Af73013",
        marketplace: "0xd4D0dcfe3424A7F55f850767f9A5B85f083F38E1",
        deployer: "0xa98b74fa85C3cD4c3E214beBac8E4511A964c1f0",
        verified: true,
        deployedAt: "2025-12-18T16:03:56.742Z",
    },
    // Base Mainnet - Not deployed yet
    "base": {
        chainId: 8453,
        usdc: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        seaCasterPass: "", // TODO: Deploy to mainnet
        tournamentEscrow: "",
        marketplace: "",
        deployer: "",
        verified: false,
        deployedAt: "",
    },
} as const;

// Get contracts for current network
export function getContracts(network: keyof typeof CONTRACTS = "base-sepolia") {
    return CONTRACTS[network];
}

// Token IDs for SeaCasterPass ERC1155
export const TOKEN_IDS = {
    SEASON_PASS: 1,
    PIRATE_HANDLE: 100,
    PIRATE_ROD_BODY: 200,
    PIRATE_HOOK: 300,
    PIRATE_REEL: 400,
    PIRATE_ANIMATION: 500,
    DAILY_TICKET: 1000,
    WEEKLY_TICKET: 1001,
    BOSS_TICKET: 1002,
    CHAMPIONSHIP_TICKET: 1003,
    LOOT_START: 2000, // Loot tokens start at 2000+
} as const;

// Tournament types (matches contract enum)
export const TOURNAMENT_TYPES = {
    DAILY: 0,
    WEEKLY: 1,
    BOSS: 2,
    CHAMPIONSHIP: 3,
} as const;

// Fee configuration
export const FEES = {
    MARKETPLACE_FEE_BPS: 1000, // 10%
    HOUSE_CUT_BPS: 1000, // 10%
    SEASON_PASS_PRICE: 9_990_000, // 9.99 USDC (6 decimals)
    DEFAULT_ENTRY_FEE: 500_000, // 0.50 USDC
} as const;

// BaseScan links
export function getBaseScanLink(address: string, network: "base" | "base-sepolia" = "base-sepolia") {
    const baseUrl = network === "base" ? "https://basescan.org" : "https://sepolia.basescan.org";
    return `${baseUrl}/address/${address}`;
}

export function getTxLink(txHash: string, network: "base" | "base-sepolia" = "base-sepolia") {
    const baseUrl = network === "base" ? "https://basescan.org" : "https://sepolia.basescan.org";
    return `${baseUrl}/tx/${txHash}`;
}
