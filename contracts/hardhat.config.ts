import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

// Helper to format private key (with or without 0x prefix)
function getAccounts(): string[] {
  const pk = process.env.PRIVATE_KEY;
  if (!pk) {
    console.warn("⚠️ PRIVATE_KEY not set - deployment will fail");
    return [];
  }
  // Ensure key has 0x prefix
  const formattedKey = pk.startsWith("0x") ? pk : `0x${pk}`;
  // Validate length (should be 66 chars with 0x prefix)
  if (formattedKey.length !== 66) {
    console.warn(`⚠️ PRIVATE_KEY invalid length: ${formattedKey.length} (expected 66)`);
  }
  return [formattedKey];
}

const accounts = getAccounts();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    "base-sepolia": {
      url: process.env.RPC_BASE_URL || "https://sepolia.base.org",
      chainId: 84532,
      accounts: accounts
    },
    "base": {
      url: "https://mainnet.base.org",
      chainId: 8453,
      accounts: accounts
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || "",
    customChains: [
      {
        network: "base-sepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api.etherscan.io/v2/api?chainid=84532",
          browserURL: "https://sepolia.basescan.org"
        }
      },
      {
        network: "base",
        chainId: 8453,
        urls: {
          apiURL: "https://api.etherscan.io/v2/api?chainid=8453",
          browserURL: "https://basescan.org"
        }
      }
    ]
  },
  sourcify: {
    enabled: false
  }
};

export default config;
