# SeaCaster V2 implementation record

Date: 2026-09-10. Original baseline: fd98acb17ff3d31fe618fddae039718cb9bbaa7f. Work branch: revamp/base-app-v2. Review: PR #10. Main remains unchanged until review.

## Direction

Preserve the fishing identity, React/Vite/TypeScript, existing artwork, R3F and Base. Replace Farcaster/FID assumptions. There are no live users or database migration obligations. No native client, Unity port, fungible token, B20 integration, paid-entry competitions or marketplace is added.

## Implemented

- Pure, shared fish catalogue, tackle, progression, daily rewards and fixed-step reeling rules with fourteen domain tests.
- React game shell, R3F ocean/pier/rod presentation, cast/bite/reel/catch flow, collection, tackle, settings, low-power illustration and optional audio cues.
- Base Account and injected wallet connection; exact server-issued SIWE messages, one-use nonces, HttpOnly sessions and wallet identity checks.
- One Express/PostgreSQL API. Server-selected catches, timing/input validation, row-locked mutations, repeat-safe catch completion, and a real free leaderboard.
- Guest saves remain browser-local and never become authenticated online progress.
- Chain-confirmed purchase UI and SeaCasterAssetsV2 for thirty-day pass expiry and transferable ERC-1155 cosmetic ownership. No fabricated deployment address or optimistic entitlement grant.
- Strict TypeScript, production build, PostgreSQL API test, four browser tests, four contract tests, CI and single-service deployment instructions.
- Replaced stale Farcaster source, prompt dumps, cached build material, old API/contracts and conflicting architecture instructions. Original art remains in public/assets; the former implementation remains in Git history.

## Visual corrections verified

Actual CI screenshots exposed and drove fixes for intrinsic image overflow in the catch modal and rod framing outside the portrait viewport. The line now follows the actual rod tip rather than a fixed desktop-only coordinate. The browser regression waits for the real catch animation to finish, verifies image bounds, then clicks through catch collection and reload persistence.

Five original fish images contained baked checkerboards rather than transparency: sardine, mackerel, seabass, cod and leviathan. They were cleaned, cropped and normalized to a maximum 512-pixel dimension without generating replacement artwork. The full illustrated card assets were preserved. scripts/normalize_fish_art.py records the repeatable process and leaves already-transparent inputs unchanged. Five regression tests verify real RGBA PNGs with transparent borders. The temporary write-enabled normalization workflow was removed after the binary assets were committed.

## Evidence

On d174e0777904a6890cf9075f96f41c41a21a5f66, Actions run 34410591829 passed fourteen domain tests, strict TypeScript, production build, the real-PostgreSQL API integration test, four contract tests and all four browser tests. The five subsequent sprite tests were demonstrated failing against original assets and passing against normalized assets locally. Check the PR's latest Actions run for verification of the final artwork-inclusive candidate; do not infer that a later commit was tested from an earlier result.

Desktop/mobile CI screenshots were retrieved and inspected. An additional isolated-browser pass checked all fifteen fish-art containers at desktop and mobile dimensions; this is layout verification, not a substitute for full gameplay or actual-phone tests.

## Open release checks

See docs/RELEASE.md. Source implementation does not constitute deployment, live Base Account transaction testing, independent contract review, real-device performance measurement or final product acceptance. Fresh image generation was unavailable; existing production artwork was reused and corrected. Builder Codes, gas sponsorship, Base notifications and optional collectible catches are not implemented in this pass.

## Environment

Local source/domain-test execution is available, but local outbound DNS prevents a complete dependency install and the local browser's navigation policy prevents a full localhost playtest. Dependency-aware build/API/contract/browser verification therefore runs through the repository's GitHub Actions. Actual CI screenshots and traces were downloaded and inspected; local isolated DOM rendering was used only for layout reproduction.
