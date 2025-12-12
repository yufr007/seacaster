# ===============================================
# SEACASTER - DEPLOYMENT & CONFIGURATION
# ===============================================

# ============ ROOT: .env.example ============
# Farcaster
FARCASTER_APP_ID=seacaster
NEXT_PUBLIC_APP_URL=https://seacaster.app

# Base Blockchain
NEXT_PUBLIC_BASE_RPC=https://mainnet.base.org
BASE_BUILDER_ADDRESS=0xYourDeployerWalletAddress
NEXT_PUBLIC_BASE_CHAIN_ID=8453

# Smart Contracts (deployed)
NEXT_PUBLIC_SEASON_PASS_ADDRESS=0x...SeasonPass...
NEXT_PUBLIC_TOURNAMENT_POOL_ADDRESS=0x...TournamentPool...
NEXT_PUBLIC_ROD_NFT_ADDRESS=0x...RodNFT...
NEXT_PUBLIC_USDC_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b1566dA1B0D

# Database
DATABASE_URL=postgresql://seacaster:password@localhost:5432/seacaster_dev
DIRECT_URL=postgresql://seacaster:password@localhost:5432/seacaster_dev

# Redis
REDIS_URL=redis://localhost:6379

# Backend
BACKEND_URL=http://localhost:3000
JWT_SECRET=your_jwt_secret_key_change_in_production
NODE_ENV=production

# AdMob
NEXT_PUBLIC_ADMOB_APP_ID=ca-app-pub-xxxxxxxxxxxxxxxx
NEXT_PUBLIC_ADMOB_REWARDED_UNIT=ca-app-pub-3940256099942544/5224354917

# Wallet Connect
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_wc_project_id

# Deployment
VERCEL_TOKEN=your_vercel_token
RAILWAY_TOKEN=your_railway_token

---

# ============ ROOT: README.md ============
# 🎣 SeaCaster - Production Farcaster Mini App

**A mobile-only competitive fishing game on Base with USDC tournaments, progression, and builder rewards.**

## 📋 Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 16+
- Redis 7+
- Yarn (workspaces)

### Installation

```bash
# Clone repo
git clone https://github.com/yourusername/seacaster.git
cd seacaster

# Install dependencies
yarn install

# Setup environment
cp .env.example .env.local

# Start local stack
docker-compose up -d
yarn db:seed
yarn dev
```

### Environment Setup

1. **Farcaster**: Register app at https://warpcast.com/~/developers
2. **Base RPC**: Use Ankr or Alchemy endpoints
3. **Database**: Configure PostgreSQL connection
4. **Smart Contracts**: Deploy to Base mainnet (see deployment section)

## 🏗️ Project Structure

```
/seacaster
├── apps/
│   ├── frontend/          # React 18 + Vite + PWA
│   └── backend/           # Express + GraphQL + Socket.IO
├── packages/
│   ├── contracts/         # Hardhat + Solidity
│   ├── ui/                # Shared components
│   └── config/            # ESLint, TypeScript config
├── docker-compose.yml     # Local dev stack
└── turbo.json             # Build orchestration
```

## 🚀 Deployment

### Frontend (Vercel)
```bash
yarn deploy:frontend
# Auto-deploys from main branch
```

### Backend (Railway)
```bash
yarn deploy:backend
# Requires RAILWAY_TOKEN in environment
```

### Smart Contracts (Base)
```bash
yarn deploy:contracts
# Deploys to Base mainnet
# Outputs contract addresses to .env
```

### Full CI/CD
- GitHub Actions for testing/linting
- Automatic Vercel deployments on main
- Railway auto-deploy on backend changes

## 🎮 Game Mechanics

- **30-second loops**: Cast → Wait → Catch → Reward
- **Rarity system**: 6 tiers (Common-Mythic) with XP rewards
- **Progression**: Levels 1-100, prestige per season
- **Tournaments**: Daily ($0.50) to Champ ($50) with USDC rewards
- **Season Pass**: $9.99 for unlimited casts + 2x XP

## 💰 Economics

**Year 1 Revenue Goal: $495K**

- Season Pass: $9.99 (60-day)
- Tournament fees: 10-20% house cut
- Marketplace: 10% trading fee
- AdMob: Rewarded video ads

See `docs/ECONOMICS.md` for full breakdown.

## 🔐 Security

- ✅ Server-side validation (FID-based identity)
- ✅ Rate limiting (3 casts/6hrs free)
- ✅ Contract verification on BaseScan
- ✅ Zod input validation + Prisma ORM
- ✅ CORS + CSP headers
- ✅ Audit logs for all transactions

## 🧪 Testing

```bash
# Unit tests
yarn test

# Integration tests
yarn test:integration

# E2E tests (Playwright)
yarn test:e2e

# Contract tests (Hardhat)
yarn test:contracts

# Coverage
yarn coverage
```

## 📊 Monitoring

- **Uptime**: Checkly (https://api.seacaster.app/health)
- **Errors**: Sentry integration
- **Performance**: Vercel Analytics
- **Database**: Supabase dashboard

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/amazing-feature`
2. Commit: `git commit -m 'Add amazing feature'`
3. Push: `git push origin feature/amazing-feature`
4. Open PR against `main`

## 📄 License

MIT

---

# ============ ROOT: turbo.json (EXTENDED) ============
{
  "$schema": "https://turbo.build/json-schema.json",
  "extends": ["//"],
  "globalDependencies": [
    "**/.env.local",
    "**/tsconfig.json"
  ],
  "globalEnv": [
    "NODE_ENV"
  ],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "build/**"],
      "cache": true
    },
    "dev": {
      "cache": false,
      "persistent": true,
      "dependsOn": []
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"],
      "cache": true
    },
    "lint": {
      "outputs": [],
      "cache": false
    },
    "type-check": {
      "outputs": [],
      "cache": true
    }
  },
  "tasks": {
    "lint:fix": {
      "outputs": ["dist/**"]
    },
    "deploy:frontend": {
      "cache": false,
      "dependsOn": ["build"]
    },
    "deploy:backend": {
      "cache": false,
      "dependsOn": ["build"]
    }
  }
}

---

# ============ APPS/FRONTEND: vite.config.ts ============
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'SeaCaster',
        short_name: 'SeaCaster',
        description: 'Competitive fishing game on Farcaster',
        theme_color: '#0A3A52',
        background_color: '#000',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,woff,woff2}']
      }
    })
  ],
  build: {
    target: 'esnext',
    minify: 'terser',
    sourcemap: false,
    outDir: 'dist'
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
      '/graphql': 'http://localhost:3000/graphql'
    }
  }
})

---

# ============ APPS/FRONTEND: tailwind.config.js ============
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        'ocean-dark': '#082f4b',
        'ocean-light': '#0a5a7f',
        'seacaster-blue': '#1e40af'
      },
      spacing: {
        'safe': 'env(safe-area-inset-bottom)'
      }
    }
  },
  plugins: []
}

---

# ============ APPS/FRONTEND: public/.well-known/farcaster.json ============
{
  "accountAssociation": {
    "header": "eyJma2N...",
    "payload": "eyJhZGRy...",
    "signature": "0x..."
  },
  "frame": {
    "version": "1",
    "name": "SeaCaster",
    "iconUrl": "https://seacaster.app/icon-200x200.png",
    "homeUrl": "https://seacaster.app",
    "imageUrl": "https://seacaster.app/og-1200x800.png",
    "buttonTitle": "🎣 Cast Line",
    "splashImageUrl": "https://seacaster.app/splash-200x200.png",
    "splashBackgroundColor": "#0A3A52",
    "webhookUrl": "https://api.seacaster.app/webhook",
    "baseBuilderAddress": "0xYourDeployerWalletAddress",
    "contractAddresses": {
      "seasonPass": "0xSeasonPassContractAddress",
      "tournamentPool": "0xTournamentPoolAddress",
      "rodNFT": "0xRodNFTAddress"
    }
  }
}

---

# ============ APPS/BACKEND: tsconfig.json ============
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ES2020",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}

---

# ============ PACKAGES/CONTRACTS: hardhat.config.ts ============
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    base: {
      url: process.env.NEXT_PUBLIC_BASE_RPC,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY!],
      chainId: 8453
    },
    baseTestnet: {
      url: "https://sepolia.base.org",
      accounts: [process.env.DEPLOYER_PRIVATE_KEY!],
      chainId: 84532
    }
  },
  etherscan: {
    apiKey: process.env.BASESCAN_API_KEY
  }
};

export default config;

---

# ============ PACKAGES/CONTRACTS: scripts/deploy.ts ============
import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying SeaCaster contracts...");

  const [deployer] = await ethers.getSigners();
  console.log(`Deploying with account: ${deployer.address}`);

  // Deploy TournamentPool
  const TournamentPool = await ethers.getContractFactory("TournamentPool");
  const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b1566dA1B0D";
  const tournament = await TournamentPool.deploy(USDC_ADDRESS);
  console.log(`✅ TournamentPool: ${await tournament.getAddress()}`);

  // Deploy SeasonPass
  const SeasonPass = await ethers.getContractFactory("SeasonPass");
  const pass = await SeasonPass.deploy();
  console.log(`✅ SeasonPass: ${await pass.getAddress()}`);

  // Deploy RodNFT
  const RodNFT = await ethers.getContractFactory("RodNFT");
  const rod = await RodNFT.deploy();
  console.log(`✅ RodNFT: ${await rod.getAddress()}`);

  // Update .env
  const fs = require("fs");
  const env = `
NEXT_PUBLIC_TOURNAMENT_POOL_ADDRESS=${await tournament.getAddress()}
NEXT_PUBLIC_SEASON_PASS_ADDRESS=${await pass.getAddress()}
NEXT_PUBLIC_ROD_NFT_ADDRESS=${await rod.getAddress()}
`;
  fs.appendFileSync(".env.local", env);
  console.log("✅ Contracts deployed and addresses saved to .env.local");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

---

# ============ GITHUB ACTIONS: .github/workflows/deploy.yml ============
name: Deploy SeaCaster

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'yarn'

      - run: yarn install

      - run: yarn lint

      - run: yarn type-check

      - run: yarn test

      - run: yarn test:contracts

  deploy-frontend:
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v3

      - uses: vercel/action@main
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: apps/frontend

  deploy-backend:
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Railway
        run: |
          npm i -g @railway/cli
          railway up --service backend
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}

---

# ============ DOCKER: docker-compose.yml (EXTENDED) ============
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: seacaster-db
    environment:
      POSTGRES_USER: seacaster
      POSTGRES_PASSWORD: seacaster_dev_pass
      POSTGRES_DB: seacaster_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U seacaster"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: seacaster-cache
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: seacaster-pgadmin
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@seacaster.local
      PGADMIN_DEFAULT_PASSWORD: admin
    ports:
      - "5050:80"
    depends_on:
      - postgres

volumes:
  postgres_data:

---

# ============ VERCEL: vercel.json ============
{
  "buildCommand": "yarn build",
  "outputDirectory": "apps/frontend/dist",
  "env": {
    "NEXT_PUBLIC_APP_URL": "https://seacaster.app",
    "NEXT_PUBLIC_BASE_RPC": "@base_rpc",
    "NEXT_PUBLIC_BASE_CHAIN_ID": "8453"
  },
  "envDescription": {
    "base_rpc": "Base Mainnet RPC URL"
  },
  "regions": ["sfo1"],
  "functions": {
    "api/**": {
      "memory": 3008,
      "maxDuration": 60
    }
  }
}

---

# ============ RAILWAY: railway.toml ============
[build]
builder = "dockerfile"
dockerfilePath = "Dockerfile.backend"

[deploy]
startCommand = "node dist/server.js"
numReplicas = 1

[env]
NODE_ENV = "production"