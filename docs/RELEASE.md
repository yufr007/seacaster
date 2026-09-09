# SeaCaster V2 release

## Deployment shape

One Node 22 service serves the built Vite app and /api. PostgreSQL stores wallet-authenticated progress and sessions. Base stores purchased pass expiry and cosmetic balances. HTTPS and a single public origin are required for production cookies and origin checks. The UI should not be deployed as a static-only site while claiming online saving works.

## Environment

Build-time public variables: VITE_CHAIN_ID (84532 for Sepolia, 8453 for Base), VITE_RPC_URL (public/browser-scoped endpoint only), VITE_SEACASTER_ASSETS (the V2 deployed address, not a legacy address). Rebuild after changing these.

Server-only variables: APP_ORIGIN (exact HTTPS public origin, no path), CHAIN_ID (must match frontend), RPC_URL (same chain), DATABASE_URL, NODE_ENV=production, PORT. Set TRUST_PROXY=1 only behind exactly one trusted reverse proxy. Never put a signer, private RPC secret or database credential in a VITE_ variable.

The schema is a fresh V2 database. No production data migration is required or implemented. Use a new database rather than applying this schema to the abandoned prototype schema.

## Run a release candidate

```bash
npm install
npm test
npm run build
NODE_ENV=production APP_ORIGIN=https://your-actual-domain.example CHAIN_ID=84532 RPC_URL=$YOUR_SEPOLIA_RPC DATABASE_URL=$YOUR_DATABASE_URL npm start
```

The Dockerfile is an alternative packaging of the same service, not a second architecture. Configure TLS at your hosting platform/reverse proxy. Supply public build variables as build arguments; server values are runtime secrets.

## Contracts and monetization

SeaCasterAssetsV2 uses a six-decimal ERC-20 selected at deployment. The intended token is official USDC on the selected chain: independently verify its current address before deployment. Prices are fixed in this V2 implementation: 9.99 units for 30 days of Sea Pass, 4.99 units for the Golden Tide Rod (token ID 101). Sales can be paused; metadata URI is owner-controlled. Treasury and token are immutable. Set OWNER and TREASURY deliberately; do not default them to arbitrary wallet addresses.

The pass extends from the later of now or the existing expiry. Pass access is not an NFT balance. Cosmetics transfer through standard ERC-1155 calls; there is no in-game trading market. The Golden Tide Rod gives no XP or catch advantage. Earned gold rods are a separate progression item.

```bash
cd contracts
npm install
npm test
cp .env.example .env
# Fill the actual token, treasury, owner, metadata URI and deployment signer locally.
npm run deploy:sepolia
```

Deployment writes deployments/v2-84532.json. Configure its address in the frontend, rebuild, and verify token/chain/metadata/owner/treasury in the deployed bytecode and explorer. The script refuses mainnet unless CONFIRM_MAINNET is exactly DEPLOY_SEACASTER_V2. No script is run automatically by CI.

## Release gates

- [ ] All domain, strict TypeScript, build, PostgreSQL API, contract and browser checks pass on the exact candidate commit.
- [ ] Inspect desktop and mobile screenshots, not just test exit codes. Approve the visual/gameplay quality explicitly.
- [ ] Test the actual Base App in-app browser, Safari/iPhone and an Android phone. Measure cold load, sustained frame time, touch controls, background/resume and low-power mode.
- [ ] Exercise Base Account sign-in with deployed and counterfactual smart accounts; invalid, expired and replayed signatures must fail. CI's API fixture verifies real EOA signatures, not live Base smart accounts.
- [ ] Exercise wallet switch/disconnect, denied signatures, wrong networks, insufficient funds, rejected approval, reverted purchase, pass expiry and cosmetic transfer on Base Sepolia.
- [ ] Host valid ERC-1155 metadata and confirm all existing art/audio rights for commercial use.
- [ ] Verify the intended USDC address, treasury, owner and deployed contract; independently review contracts before taking mainnet payments.
- [ ] Configure production origin/database/RPC, verify health and an end-to-end online saved catch after deployment.
- [ ] Register the deployed standard web app with Base.dev and verify its current listing/notification/attribution requirements against official Base documentation.

Source completion is not a claim that these external checks were performed. Builder Code attribution and Base notifications are not implemented in this pass; neither is needed for the core fishing loop, but listing-specific requirements must be checked before release.

## Evidence and limitations

CI stores screenshots, traces, generated lockfiles and the build as short-lived workflow artifacts. Domain tests run without dependencies. API tests use real PostgreSQL, row locking, real EOA signatures and a disposable database. Browser tests drive actual controls rather than mutating game state. Live wallet transaction tests, real-device performance and visual sign-off are separate gates.

The transcript validator is not a human-attestation or anti-bot system. That distinction is why the current leaderboard is free and there are no cash prizes or tradeable catch rewards. Guest saves never enter the online economy or leaderboard.
