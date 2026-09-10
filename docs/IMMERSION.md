# SeaCaster: a little life on the water

Approved brief: mobile-first cartoon fishing lifestyle, a start screen and harbour dashboard, physical swipe casts, expressive rod/bait/fish, living water, distant life, device-local day/night, sound, and progressive fishing platforms. Continue the existing React/Vite/R3F game and verified Base boundaries. No native client, engine migration, contract/economy redesign, or new infrastructure.

## Experience and visual specification

A single living toy-box world underpins three surfaces: title screen, harbour home, and fishing. Chunky sun-warmed timber, teal paint, coral trim, mint water, cream paper, navy type and gold CTA buttons. The title invites entry; the harbour shows real progress and the next berth; fishing collapses chrome to the edges. Existing fish portraits are retained. Original procedural 3D scenery is an intentional execution choice: an image-generation tool is not exposed in this session; no claim of generated concept art or photo-real assets.

Signature moments: cast from a flexing rod along a visible arc; a red-and-cream float bobs, dips and throws rings; fish circle, tug and leap toward the deck before the journal reveal. A physical bait chest opens an accessible selector. Distant sailboats, gulls, island vegetation, drifting clouds and warm lanterns give the scene life without taking over the playfield.

Four progress berths: Driftwood Pier (start), Willow Inlet (3 catches), Little Skipper (10), Sunseeker Yacht (30). Progress unlocks environments, not paid power. Selection is checked in shared rules and the existing authenticated mutation transaction. Guest and online progress remain separate. No new tables or purchase contract changes.

The sky follows device-local time (no GPS prompt, no astronomical sunrise claim); Moonlit Cove remains the existing optional cosmetic override. Sound is opt-in, generated with Web Audio (surf, breeze, cast, splash, reel, gulls and reward), with separate ambience/effect levels and suspension in background. Low-power and reduced-motion modes remain usable; tap/keyboard casting supplements swipe.

## Implementation and verification

1. Test platform unlock/selection and save recovery, gesture cancellation/threshold/aim, daylight wrapping and cast arc endpoints before implementation.
2. Extend existing profile/REST selection path. Preserve fishing RNG, prices, replay integration and all chain code.
3. Compose title/harbour/platform UI, in-world bait interaction, input and audio independently of simulation.
4. Replace the presentation scene with shared stylized world components and phase-driven animation. Animate refs, not React state, in the render loop; cap DPR and pause hidden canvases.
5. Verify core flows, real touch swipes, cancel/multitouch, unlocked platforms, day/night, sound/persistence, viewport bounds, WebGL fallback and existing auth/economy regressions. Capture mobile/desktop screenshots and short rendered animation evidence.
6. Remove the temporary dependency-snapshot workflow, publish tested changes to the existing revamp branch, and update PR #10. No mainnet deployment or merge is implicit.
