# SeaCaster V2 implementation record

Date: 2026-09-10. Original baseline: fd98acb17ff3d31fe618fddae039718cb9bbaa7f. Work branch: revamp/base-app-v2. Main remains unchanged until review.

## Direction

Preserve the fishing identity, React/Vite/TypeScript, existing artwork, R3F and Base. Replace Farcaster/FID assumptions. There are no live users or database migration obligations. No native client, Unity port, fungible token, B20 integration, paid-entry competitions or marketplace is added.

## Implemented

- Pure, shared fish catalogue, tackle, progression, daily rewards and fixed-step reeling rules with fourteen domain tests.
- React game shell, R3F ocean/pier/rod presentation, cast/bite/reel/catch flow, collection, tackle, settings, low-power illustration and optional audio cues.
- Base Account and injected wallet connection; exact server-issued SIWE messages, one-use nonces, HttpOnly sessions and wallet identity checks.
- One Express/PostgreSQL API. Server-selected catches, timing/input validation, row-locked mutations, repeat-safe catch completion, and a real free leaderboard.
- Guest saves remain browser-local and never become authenticated online progress.
- Chain-confirmed purchase UI and SeaCasterAssetsV2 for thirty-day pass expiry and transferable ERC-1155 cosmetic ownership. No fabricated deployment address or optimistic entitlement grant.
- Strict TypeScript, production build, PostgreSQL API test, browser tests, contract tests, CI and single-service deployment instructions.
- Replaced stale Farcaster source, prompt dumps, cached build material, old API/contracts and conflicting architecture instructions. Original art remains in public/assets; the former implementation remains in Git history.

## Evidence so far

The fourteen domain tests pass locally and in GitHub Actions. The V2 production build and real-PostgreSQL API test have passed in Actions. The four contract tests compile and pass. Final candidate results and browser evidence must be checked on the PR/Actions run, not inferred from this document.

## Open release checks

See docs/RELEASE.md. Source implementation does not constitute deployment, live Base Account transaction testing, independent contract review, real-device performance measurement or visual acceptance. Fresh image generation was unavailable here; existing production artwork is reused. Builder Codes, Base notifications and optional collectible catches are not implemented in this pass.

## Environment

Local source/domain-test execution is available, but local outbound DNS prevents a complete dependency install. Dependency-aware build/API/contract/browser verification therefore runs through the repository's GitHub Actions. This distinction must remain explicit in the handoff.
