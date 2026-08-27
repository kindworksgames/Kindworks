# Milestone 45 — performance and Sprite AI asset labels

## Outcome

Milestone 45 makes the Milestone 44 release candidate lighter to start and gives
every rendered visual a stable audit label before final art production begins.
The protected HTML source remains read-only. This milestone does not replace the
current placeholder artwork and does not call Sprite AI.

## Loading and build contract

Only `BootScene` and `TownScene` are registered in the initial Phaser game
configuration. The other 16 scenes are loaded on demand when the player enters
an activity, home or shop. An interrupted saved Waste Collection, Lawn Care,
Beach Cleanup or Playground Power Wash session still resumes through the same
lazy loader and falls back safely to town if a scene module cannot load.

Phaser is emitted as a separate, cacheable `phaser-engine` chunk. Every lazy
scene is emitted as its own production chunk, source maps remain disabled, and
`scripts/verify-performance-budget.mjs` enforces these raw-byte ceilings:

- initial application chunk: 3,100,000 bytes;
- Phaser engine chunk: 1,500,000 bytes;
- each lazy scene chunk: 80,000 bytes;
- all production JavaScript: 5,000,000 bytes;
- at least 12 lazy chunks (the current build emits 16).

`pnpm build` runs this verification automatically through `postbuild` and writes
the detailed machine-readable result to `dist/performance-budget.json`.

## Sprite AI label contract

Labels are metadata for the future art inventory; they are not visible captions
and do not alter gameplay. Every Phaser display object receives:

- `spriteAiAssetId` — a stable namespaced identifier;
- `spriteAiAssetLabel` — a human-readable description;
- `spriteAiAssetKind` — sprite, character, text, vector placeholder, object
  group, or another concrete visual kind.

Semantic identities override generic labels for the player, each named NPC and
each named animal. All 16 generated player walk frames are separately recorded
by direction and frame. The scene plugin labels rectangles, circles, ellipses,
graphics layers, text, sprites, containers and their children as they enter a
scene, including objects created later during play.

Every HTML control or visual candidate receives:

- `data-sprite-ai-label` — a stable ID derived first from its element ID, then
  its data identity, accessible label or semantic text;
- `data-sprite-ai-kind` — button, control, icon, portrait, panel, HUD,
  notification, game canvas, image, control group or visual.

The initial document and all dynamically inserted descendants are covered by a
mutation observer. This includes every fixed button in `index.html` and the
data-driven buttons rebuilt by shops, inventory, recipes, trays, residents,
animals, commerce and all mini-games. The observer also labels images, SVGs,
the Phaser canvas, icons, portraits, avatars, panels, cards, HUDs, banners,
toasts, controls, stages, floors, counters and fixtures.

## Inventory and completeness audit

The browser exposes a read-only `window.KindWorksSpriteAI` helper:

- `KindWorksSpriteAI.audit()` reports DOM and Phaser totals and any unlabelled
  candidates in every instantiated scene;
- `KindWorksSpriteAI.inventory()` returns the accumulated structured inventory;
- `KindWorksSpriteAI.toJSON()` returns the same inventory as formatted JSON;
- `KindWorksSpriteAI.download()` downloads
  `kindworks-sprite-ai-inventory.json` for the later Sprite AI production pass.

Because activity scenes are now lazy, the accumulated inventory grows as a QA
session visits them. The final art inventory pass must visit Town, every shop,
every home view and all 13 activities in their representative states before
downloading the JSON. Shared controls deliberately reuse a label; state-specific
or data-specific controls use their stable IDs and remain separate.

The document publishes `data-sprite-ai-dom-total`,
`data-sprite-ai-dom-labelled` and `data-sprite-ai-dom-complete` for automation.
The required release result is zero missing DOM candidates and zero missing
Phaser display objects.

## Verification

The Milestone 45 tests lock the 16-scene lazy catalogue, prevent those scenes
from returning to the eager entry point, verify fixed and data-driven label
derivation, enforce the visual selector surface, and pin every performance
ceiling. The production build, full repository suite, protected-source checksum
and desktop/mobile live audit remain required release gates.

The completed production build passes with a 2,984,883-byte initial application
chunk, a 1,374,829-byte Phaser engine chunk, 16 lazy scene chunks between 11.61
and 19.38 kB, and 4,608,532 bytes of JavaScript in total. All 444 automated
tests pass. Live Town QA labels all 351 DOM candidates and all 1,189 Phaser
objects; lazy-loaded Fishing labels all 10 of its Phaser objects and returns
safely to Town. Desktop 1,280×720, landscape 844×390 and portrait 390×844 have
no page overflow, the portrait movement controls remain 48 pixels, zoom controls
remain 52 pixels, and the console is clean.

The protected HTML and Desktop source retain SHA-256
`0b85bd71385b83e7a13676f7593ce376245959fa4ebf1a6b9a0e6765297aa5a5`.
