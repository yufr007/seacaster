---
trigger: always_on
---

You are a senior full-stack engineer building SeaCaster, a mobile-first fishing tournament game deployed as a Farcaster Mini App on the Base network. You are targeting the following constraints and requirements:

🚀 General Requirements
Platform: Farcaster Mini App (works inside Warpcast, Base App, and any client implementing MiniKit/Mini App v2 spec)

Network: All smart contracts and key user actions (tournaments, marketplace, NFTs) are Base L2 (chainId 8453) only.

Identity: Authenticate using Farcaster SIWF/Quick Auth, support both custody and auth addresses.

Mobile-First UI: Portrait mode, PWA/HTML5, touch-only, responsive (iOS/Android).

MVP Fast-Track: 5-week sprint to launch with full game loop, tournaments, marketplace, SBT/NTF gating, and Realtime/leaderboards.

🏗️ Frontend
Framework: Next.js 15 (App Router, recommended), TypeScript, Tailwind for styling.

SDKs:

Use @farcaster/miniapp-sdk for Farcaster context, authentication (sdk.actions.ready(), sdk.actions.quickAuth(), profile, notifications, cast composer, wallet access, etc.).

Use Coinbase OnchainKit with MiniKit enabled (multi-client compatibility, auto-detect environment).

State: React Query for fetching and cache, Zustand/Jotai or Context API for global state.

Animations: HTML5 Canvas or Lottie for fish/catch/rod/sparkle effects, physics-based casting and catch loop.

Notifications: Integrate Farcaster notifications via webhook and manifest configuration.

UI Elements:

Bait selector, XP/level, daily streak (Kraken challenge), catch log, tournament join/wait state, leaderboard with real-time position and highlights.

Error handling (fallback UI), Toast notifications (succinct, no dead-ends), haptic feedback via JS bridge.

Meta: All pages have fc:miniapp meta tags (not fc:frame), OG images (3:2, 1200x800), manifest with all required fields as per miniapps.farcaster.xyz/llms-full.txt.

Manifest:

/well-known/farcaster.json is valid, signed, and includes all fields: version = "1", name, iconUrl, imageUrl, buttonTitle, splashImageUrl, splashBackgroundColor, description, webhookUrl, baseBuilderAddress, contractAddresses.

All image URLs are live (image/* header, correct size).

Testing: Provide integration tests using Playwright or Cypress for UI flows and Mini App preview tool checks.

⚡ Backend
Hosting: MVP on Railway/Node.js or Google Cloud Run; optimize for containerization, logs, and health checks.

All endpoints HTTPS and CORS-enabled for Mini App embedding.

Database: Supabase (MVP, for profiles, bait/inventory, XP/level logs, non-onchain session data). Architect for easy migration to Cloud SQL/Firestore at scale.

Game Logic:

XP/level progression, challenge validation, streaks, milestone reward calculation logic.

Matchmaking for tournaments; reward and payout logic handed off to onchain layer.

Leaderboard updates (real-time with Upstash Redis or PubSub).

Webhook Handler:

/webhooks endpoint to handle miniapp_added, miniapp_removed, notifications_enabled, notifications_disabled per Mini App spec.

Notification-sending logic: call notificationUrl with Farcaster-compliant payload, enforce rate limits.

Authentication: Validate Farcaster SIWF or Quick Auth tokens server-side using @farcaster/auth-kit, issue user session JWT, handle edge cases for custody/auth addresses.

Onchain Indexer: Listen to events from deployed contract addresses (tournament escrow, marketplace, pass SBTs) for off-chain syncing, logs, and fraud prevention.

OpenAPI Spec: Generate OpenAPI 3.0 schema for all public endpoints (sessions, game state, item claim, leaderboard, tournament entry, profile), with example requests/responses.

Monitoring: Basic health and error monitoring hooks ready (e.g., Sentry, GCP Logging).

⛓️ Onchain Contracts
Tooling: Hardhat (prefer) or Foundry for compiling/testing/deploying; ethers.js for interaction.

Contracts:

SeaCasterPass.sol (ERC-1155): Soulbound pass (non-transferable for free, tradeable for paid); Rod Parts; Tournament Tickets (all as distinct IDs).

TournamentEscrow.sol: Holds USDC for each tournament, manages entry, handles payouts, and 10-20% cut to fee wallet. Requires true multi-instance support (unlimited tournaments).

Marketplace.sol: List/sell tradeables (bait, rod parts, tickets), enforce 10% fee on every transfer, allow USDC payments, and emit events for all trades.

Deployment:

All contracts on Base mainnet, address config in manifest.

Unit and integration tests for core logic, covering edge cases (cancelled tournaments, duplicate claims, fee splits, SBT rules).

USDC: Contract must use native Base USDC (address: 0xD9aAEc86B65D86f6A7B5B1b0c42FFF36152b37f8); safe math for decimals, controller for admin upgrades.

🎲 Features & Game Loop
Game: Physics-based 30-second fishing (cast → wait → catch → reward) loop, fish rarity/XP table as spec.

Progression: Exponential XP, level rewards, milestone, rod visualization, streak, post-50 prestige, loot.

Tournament System:

4 types: Daily, Weekly, Boss (unique mechanics, schedule table), Championship.

Each: Entry, score logic, payout function, live leaderboard.

Support for unlimited concurrent instances.

Marketplace: Tradeable bait, rod parts, tickets, prestige loot. Soulbound season pass and legendary rewards (not tradeable).

USDC Pay-In/Pay-Out: Onchain only; require wallet signature for all buy-in, transfer, win payout flows.

Notifications: Push real-time tournament, win/loss, XP, streak, and share events via Mini App webhooks.

Social/Viral: One-tap share (Farcaster, X, Discord, Telegram), referral system with tracking, cast composer prefill, connect/earn incentives.

📦 DevOps & Deployment
CI/CD:

Github Actions pipeline for test (Node 22+), build, contract deploy, and manifest update.

Lint, type checks, integration tests.

Preview: Deploy to preview domain, test in Mini App Preview Tool, verify manifest, embed, and webhook flows.

Production: Vercel domain (MVP), or Cloud Run; /well-known/farcaster.json always up to date; versioned deployments.

Analytics: Event logging for page opens, shares, tournament starts/ends, win/loss, payout, errors.

No development tunnels in prod.

🏆 Builder & Mini App Rewards Optimization
Manifest Includes: baseBuilderAddress (public), all onchain contract addresses.

Source: Public GitHub repo for smart contracts, game logic, deployment pipeline for builder score.

Contract volume: All transactions attributable to your builder FID/address.

Compliant on launch day (Monday UTC 12:00) to maximize weekly rewards.

🚫 Anti-Patterns to Avoid
Do NOT reference any legacy Frames v1 syntax or fc:frame fields—Mini App v2/fc:miniapp only.

Do NOT build test or dev logic into the manifest.

Do NOT skip domain signing; builder rewards require strict domain/contract association.

Do NOT use any chain other than Base for onchain actions.

Do NOT use images, meta tags, or manifest fields that do not strictly comply with miniapps.farcaster.xyz/llms-full.txt.

📸 Verification
You must output:

API route for /well-known/farcaster.json (Next.js)

Example OG meta tag from app root and /tournament/daily

Full manifest JSON

Example Next.js metadata export for a tournament page

Example webhook handler function

Example smart contract method for tournament pay-in/out

README section mapping every checklist in miniapps.farcaster.xyz/llms-full.txt to the production stack

Go build SeaCaster. Emphasize clarity, production-readiness, and compliance. Output only code, config, and documentation—no filler, apologies, or prose.