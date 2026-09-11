# SeaCaster V2 release

## Deployment shape

SeaCaster is one Vercel project. Vite/R3F is served through Vercel's global delivery network and `api/handler.ts` mounts the existing server-authoritative Express game API as a Node Function in `iad1` (US East). A fresh Supabase Postgres project in `us-east-1` stores authenticated progress, SIWE nonces and sessions. Base stores purchased pass expiry and cosmetic balances.

There is no production Docker service or standalone API host.

## Environment

Build-time public variables:

- `VITE_CHAIN_ID` — `84532` for Base Sepolia, `8453` for Base mainnet.
- `VITE_RPC_URL` — public/browser-scoped RPC endpoint only.
- `VITE_SEACASTER_ASSETS` — deployed V2 contract address; empty disables checkout.

Vercel Function variables:

- `APP_ORIGIN` — exact HTTPS production origin, no path.
- `CHAIN_ID` — must match the frontend.
- `RPC_URL` — server RPC on the same Base chain.
- `DATABASE_URL` — server-only Supabase **transaction-pooler** connection string (port 6543 / SSL).
- `NODE_ENV=production`.

Never put a signer, RPC secret or database credential in a `VITE_` variable.

## Supabase

Create a fresh SeaCaster project in `us-east-1`; do not reuse the inactive Tokyo prototype. Apply `backend/sql/schema.sql` to the fresh database before enabling online saves.

The authoritative tables have Row Level Security enabled and browser roles revoked. They are accessed only by the Vercel API using the server-only pooled database credential. The game intentionally keeps its viem SIWE flow rather than depending on Supabase Web3 Auth because Base Account can use smart-account signature validation paths that must be tested explicitly.

After applying the schema, run Supabase security and performance advisors and resolve all material findings before launch.

## Vercel

Connect `yufr007/seacaster` to one Vercel project. Preview deployments should follow pull requests; production should follow the final release branch/main after approval. The repo's `vercel.json` fixes trusted API compute in `iad1`, keeps the Vite SPA fallback and serves immutable art/model assets with long-lived cache headers.

For local guest development:

```bash
npm ci
cp .env.example .env
npm run dev
```

For full deployed-style local development, use `vercel dev` after pulling the Vercel environment.

## Contracts and monetization

`SeaCasterAssetsV2` uses a six-decimal ERC-20 selected at deployment. The intended token is official USDC on the selected chain; independently verify its current address before deployment. Current prices are 9.99 units for 30 days of Sea Pass and 4.99 units for the Golden Tide Rod (token ID 101). Sales can be paused; treasury and payment token are immutable after deployment.

The pass extends from the later of now or the existing expiry. Pass access is not an NFT balance. Cosmetics transfer through standard ERC-1155 calls; there is no in-game trading market. The Golden Tide Rod gives no XP or catch advantage.

```bash
cd contracts
npm ci
npm test
cp .env.example .env
# Fill the actual token, treasury, owner, metadata URI and deployment signer locally.
npm run deploy:sepolia
```

Deployment writes `deployments/v2-84532.json`. Configure that address in the frontend, rebuild, and verify token/chain/metadata/owner/treasury on the explorer. The script refuses mainnet unless `CONFIRM_MAINNET` is exactly `DEPLOY_SEACASTER_V2`.

## Release gates

- [ ] Domain, deployment, strict TypeScript, build, PostgreSQL API, contract and browser checks pass on the exact candidate commit.
- [ ] Supabase `us-east-1` project exists, schema is applied, advisors are clean and the Vercel transaction-pooler connection succeeds.
- [ ] Vercel preview is healthy: `/api/health`, guest play, SIWE online save and leaderboard all work on the deployed origin.
- [ ] Inspect desktop/mobile rendered screenshots and recorded interaction, not only exit codes.
- [ ] Test Base App in-app browser, Safari/iPhone and Android: cold load, sustained frame time, touch controls, background/resume and low-power mode.
- [ ] Exercise Base Account sign-in with both deployed and counterfactual smart accounts; invalid, expired and replayed signatures must fail.
- [ ] Exercise wallet switch/disconnect, denied signatures, wrong networks, insufficient funds, rejected approval, reverted purchase, pass expiry and cosmetic transfer on Base Sepolia.
- [ ] Host valid ERC-1155 metadata and confirm commercial rights for every shipped visual/audio asset.
- [ ] Verify official USDC address, treasury, owner and deployed contract; independently review contracts before accepting mainnet payments.
- [ ] Register the production standard web app with Base.dev and satisfy current listing requirements.

## Evidence and limitations

CI stores screenshots, traces and the production build as workflow artifacts. API tests use real PostgreSQL, row locking and real EOA signatures in a disposable database. Browser tests drive actual controls rather than mutating production game state. Authored WebGL rendering and fishing simulation are both tested, but CI's SwiftShader timing is diagnostic—not a physical-phone benchmark.

The transcript validator rejects fabricated catch payloads and duplicate settlement but is not human-attestation. Guest saves never enter the online leaderboard or economy. No cash-prize competition or tradeable catch reward is enabled in this release.
