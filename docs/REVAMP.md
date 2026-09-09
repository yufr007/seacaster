# SeaCaster V2 implementation plan

Date: 2026-09-10. Baseline: fd98acb17ff3d31fe618fddae039718cb9bbaa7f.

## Approved direction

Execute the supplied product-reboot plan: preserve the fishing identity, React/Vite/TypeScript, useful art, R3F, and Base; replace Farcaster/FID assumptions. No live users or database migration obligations. No native client, Unity port, fungible token, B20 integration, paid-entry competitions, or marketplace in this release.

## Product and boundaries

Instant guest fishing, a complete cast/bite/reel/reveal loop, persistent collection and progression, earned-currency tackle, free challenges, and a chain-backed Sea Pass/cosmetic checkout. The UI renders outcomes; the server owns authenticated progress; Base owns payments and purchased property. Guest saves never become economic authority. Unconfigured services must be honestly unavailable, not simulated purchases or fabricated leaderboards.

Keep the existing fish art and nautical identity. A restrained game-first viewport replaces dashboard-like chrome. Wallet connection is optional until saving online or purchasing. No new art-generation capability is available in this environment; use existing production assets, not generated placeholder graphics.

## Implementation tasks

- [ ] Establish baseline checks and remove stale build/context/Farcaster material.
- [ ] Extract tested shared fishing rules, catalog, progression, challenges, and save validation.
- [ ] Rebuild the React shell, interactive fishing loop, collection, tackle, settings, and chain-aware store.
- [ ] Add Base Account plus injected wallets, server-issued SIWE nonces, verified sessions, and wallet-switch invalidation.
- [ ] Simplify the API to one Express/PostgreSQL service with authoritative session/catch validation and idempotent mutations.
- [ ] Add tested V2 membership/ERC-1155 purchase contracts; no paid-entry escrow or automatic mainnet deployment.
- [ ] Add deterministic gameplay/security tests, mobile browser flow tests, CI, deployment configuration, and release documentation.
- [ ] Verify the final source, builds, tests, and browser evidence; report external credentials/deployment checks separately.

## Verification

Local dependency-free tests use Node's test runner. GitHub CI installs the actual dependencies, typechecks the frontend and API, compiles contracts, and runs gameplay/API/contract/browser tests. A successful build is not visual approval. No mainnet deployment, wallet transaction, Base.dev registration, or public production-readiness claim is implicit in source completion.

## Current evidence

The revamp branch initially equals main. The existing active fishing scene is React/Framer Motion; an alternate R3F scene exists. The client currently has a local premium setter and supplies catch attributes to the API. These are real boundaries to correct, not reasons to add microservices or speculative infrastructure.

## Environment

GitHub API reads are available. Local outbound DNS/network access is unavailable, so cloning and npm installation cannot be assumed. Source changes will be applied to this branch and verified through the strongest executable local and CI checks available.
