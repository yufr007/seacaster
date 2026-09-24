# SeaCaster Premium Immersion Pass 2 — Design

## Intent

Advance the existing mobile-first SeaCaster V2 from a polished prototype toward a premium cartoon fishing lifestyle game without changing fishing reward probabilities, authenticated progression authority, Base identity/economy boundaries, contracts, purchase prices, or the four existing progression gates.

The player should feel that their hand controls the rod, the rod controls the line, the line lands at a readable spot, and each unlocked berth is a genuinely different place to spend time rather than a background swap.

## Product principles

- **World first, HUD second.** Keep the center and lower-middle playfield clear except for transient cast/reel feedback.
- **Physical continuity.** The swipe preview, rod bend, bait flight, splash, bobber, line tension, fish breach, and landing celebration must read as one continuous action.
- **Lifestyle progression.** Pier, inlet, fishing boat, and yacht keep identical catch odds while changing framing, props, motion, ambience, and visual status.
- **Cartoon premium, not realism.** Rounded silhouettes, exaggerated readable motion, warm materials, selective highlights, and strong depth layers. Do not chase photoreal water or dense PBR scenes.
- **Mobile budget.** Reuse low-poly geometry, procedural materials and object pooling/ref animation. No new runtime dependency and no per-frame React state updates.
- **Accessible fallback.** Reduced-motion and illustrated low-power modes remain functional. Touch casting stays primary with tap/Space alternatives.

## Interaction upgrades

### Cast intent

While an eligible player drags upward, render a world-space dotted trajectory from the rod tip toward the exact predicted landing point. A soft landing ring grows with cast charge. The rod preloads against the swipe. Releasing uses the same pure target calculation as the preview so the preview never lies.

Trajectory preview is cosmetic and deterministic. It does not influence fish selection, timing windows, rewards, or bait value.

### Camera identity

Each berth receives a portrait/landscape camera profile:

- Driftwood Pier: grounded shoulder-level view with the deck and bait chest readable.
- Willow Inlet: slightly lower, closer framing to make banks/reeds enclose the player.
- Little Skipper: wider horizon, mild boat motion and more open water.
- Sunseeker Yacht: elevated framing exposing the premium deck/cabin while retaining the cast landing zone.

Camera changes interpolate rather than jump and never alter game logic.

## Living world upgrades

- Passing sailboat gains a readable wake.
- Lighthouse lamp pulses at night/dusk.
- River gains sparse fireflies/dragonflies and reed motion.
- Open-water scenes gain occasional distant fish breaches and wake rings.
- Boat/yacht receive subtle shared hull motion; pier/river stay grounded.
- Density remains low enough that the rod, bobber and catch are always the focal hierarchy.

## Platform identity upgrades

- Pier: rope coil, mooring cleat, bucket, lantern, bait chest.
- River: reeds, lilies, smooth stone bank, small wooden landing, fireflies at low light.
- Boat: painted hull, bench/cooler, small pennant, cleats, compact working-deck feel.
- Yacht: cream/turquoise palette, teak deck, cabin/windscreen, cushions and polished rail treatment.

Use stylized geometry and existing art. No purchasable advantage is attached to a berth.

## Sound direction

Keep procedural Web Audio and opt-in sound. Differentiate ambience without external samples:

- Pier: sparse wood creak.
- River: softer water with occasional chirp/plop.
- Boat: hull creak/rope tick and slightly wider surf.
- Yacht: subdued hull movement with brighter bell/fixture tick.

Cast, splash, hook, reel and catch cues remain event-driven and never block gameplay.

## Test boundaries

Pure world math covers cast target and camera profiles first. Existing world/domain tests continue to validate platform gates and cast gestures. Browser tests validate that the preview appears during a genuine upward touch gesture, the target remains consistent through cast, all four environments render, and mobile HUD bounds remain usable. GitHub Actions remains the authoritative rendered-browser gate in this environment.

## Explicit non-goals

No React Native migration, native app shell, new token, B20 asset, contract deployment, payment change, catch-odds change, marketplace change, tournament change, GPS permission, weather API, licensed audio pack, or photorealistic asset pipeline in this pass.
