# SeaCaster Premium Immersion Pass 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make SeaCaster's existing mobile-first fishing loop feel physically connected and make each progression berth feel like a distinct premium cartoon environment.

**Architecture:** Keep gameplay/economy state in the existing engine/server boundaries. Add deterministic world helpers for cast targeting and camera profiles, consume them from R3F components, and animate transient scene state through refs/useFrame. Extend procedural audio by berth without adding dependencies or samples.

**Tech Stack:** React 18, TypeScript, Vite, React Three Fiber, Drei, Three.js, Zustand, procedural Web Audio, Node test runner, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-10-premium-immersion-pass-2-design.md`

## Global Constraints

- No change to catch odds, reward values, bait economy, platform unlock thresholds, Base auth, contracts or payment prices.
- No new runtime dependency.
- No per-frame React state updates for scene animation.
- Preserve reduced-motion, illustrated low-power mode, tap-to-cast and keyboard casting.
- Keep all four existing platform IDs and persistence semantics stable.

---

### Task 1: Deterministic cast target and camera profiles

**Files:**
- Modify: `game/world.ts`
- Test: `tests/world.test.ts`

**Interfaces:**
- Produces: `castTarget(gesture: CastGesture): [number, number, number]`
- Produces: `cameraFrame(platform: PlatformId, portrait: boolean, home: boolean): { position: [number,number,number]; lookAt: [number,number,number]; fov: number }`

- [ ] Write tests proving cast target clamps to the same reachable water area and platform camera profiles are finite, distinct and portrait-safe.
- [ ] Run the tests and verify RED because both exports are missing.
- [ ] Implement the smallest pure helpers in `game/world.ts`.
- [ ] Run premium + existing world tests and verify GREEN.

### Task 2: Gesture trajectory and landing reticle

**Files:**
- Modify: `app/world/FishingRig.tsx`
- Modify: `app/world/types.ts` only if a new transient field is required.

**Interfaces:**
- Consumes: `castTarget`, existing `WorldMotion.charge/aim/power`.
- Produces: world-space trajectory beads and landing ring visible only while idle drag charge is meaningful.

- [ ] Use `castTarget` for both actual cast destination and preview destination.
- [ ] Add pooled/ref-animated trajectory beads and a soft landing ring; do not update React state per frame.
- [ ] Preserve current rod bend, cast arc, line and bobber behavior.
- [ ] Typecheck.

### Task 3: Platform-aware camera and world life

**Files:**
- Modify: `app/Scene.tsx`
- Modify: `app/world/Environment.tsx`

**Interfaces:**
- Consumes: `cameraFrame`, platform, sky, phase, existing motion ref.
- Produces: interpolated camera framing, sail wake, lighthouse pulse, sparse river fireflies and distant breach rings.

- [ ] Move camera framing to the pure profile helper and interpolate it in `useFrame`.
- [ ] Add low-density ambient elements with refs and reuse simple geometry/materials.
- [ ] Ensure reduced motion freezes decorative motion.
- [ ] Typecheck.

### Task 4: Make each berth visually ownable

**Files:**
- Modify: `app/world/Platform.tsx`
- Modify: `app/world/Props.tsx`

**Interfaces:**
- Consumes: stable `PlatformId` and current world clock/props.
- Produces: distinct working-deck props and boat/yacht silhouettes without economy changes.

- [ ] Add pier mooring/rope detail and retain bait chest readability.
- [ ] Add river landing treatment that works with the existing bank scene.
- [ ] Add compact boat working-deck props/pennant.
- [ ] Add yacht rails/cushions/cabin/windscreen/teak treatment.
- [ ] Reuse geometry; keep draw/object density bounded.
- [ ] Typecheck.

### Task 5: Berth-aware procedural ambience

**Files:**
- Modify: `app/audio.ts`
- Modify: `app/useSoundscape.ts`
- Modify: `App.tsx`

**Interfaces:**
- `useSoundscape` receives `platform: PlatformId` rather than a river boolean.
- `OceanAudio.environment(night, platform)` stores a berth profile and emits sparse procedural texture.

- [ ] Preserve opt-in/mute/visibility behavior.
- [ ] Add distinct sparse berth texture without external files.
- [ ] Typecheck and existing browser audio checks.

### Task 6: Rendered regression and PR handoff

**Files:**
- Create: `tests/e2e/premium.spec.ts`
- Reference: `docs/IMMERSION.md` (existing pass-1 experience contract)
- Create: `docs/superpowers/specs/2026-09-10-premium-immersion-pass-2-design.md`

**Interfaces:**
- Browser assertions use stable user-visible or test-id state; no private app-state injection for core casting.

- [ ] Add browser coverage for real-touch cast preview and representative platform frames.
- [ ] Run unit tests/typecheck/build locally.
- [ ] Commit to `revamp/base-app-v2` through GitHub.
- [ ] Wait for the exact commit CI run; inspect screenshots/video artifact.
- [ ] Fix regressions and repeat until all CI jobs pass.
- [ ] Update PR #10 summary with the exact verified head and remaining physical-device gates.
