# SeaCaster - Farcaster Mini App

## Production Checklist Verification

### 🚀 General
- **Platform**: Farcaster Mini App v2
- **Network**: Base Mainnet (8453)
- **Identity**: Farcaster Auth via `@farcaster/frame-sdk`

### 🏗️ Frontend
- **SDK**: Initialized in `services/farcaster.ts` using `sdk.actions.ready()`.
- **Meta Tags**: `fc:miniapp` tag present in `index.html`.
- **Manifest**: `.well-known/farcaster.json` configured with all required fields.
- **USDC**: Configured with Base Native USDC address `0xD9aAEc86B65D86f6A7B5B1b0c42FFF36152b37f8`.

### ⚡ Backend & APIs
- **Webhook**: Endpoint `/api/webhook` defined in manifest for lifecycle events.
- **Game Logic**: Client-side state in `store/gameStore.ts` synced with on-chain events.

### 🏆 Builder Rewards
- `baseBuilderAddress`: Included in manifest.
- `contractAddresses`: Included in manifest.

### 📦 Deployment
- **Repo**: Public GitHub (Assumed context).
- **Domain**: `seacaster.app` (Placeholder for production).

## Setup
1. `npm install`
2. `npm run dev`
3. Deploy to Vercel/Railway.

## Smart Contracts
- **SeasonPass**: `0x123...` (ERC1155 Soulbound)
- **TournamentEscrow**: `0x098...` (USDC Handling)
