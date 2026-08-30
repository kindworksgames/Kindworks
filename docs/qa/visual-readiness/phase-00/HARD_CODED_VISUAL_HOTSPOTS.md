# Hard-Coded Visual Hotspots

## Method

The ranking combines source size, counts of coordinate-like assignments, Phaser visual calls, DOM templates, CSS selectors and functional coupling. Counts are heuristic hotspot indicators, not claims that every number is a visual constant.

## Ranked hotspots

| Rank | File/system | Indicators | Coupling | Migration treatment |
| ---: | --- | --- | --- | --- |
| 1 | `src/style.css` | 7,351 lines; ~1,533 coordinate-like declarations; scene/media/safe-area overrides | Layout, visibility, scene state, orientation and visual style share one cascade | Inventory tokens/selectors first; add adapter classes; no mass rewrite |
| 2 | `src/scenes/TownScene.js` | 3,036 lines; ~221 Phaser visual calls; ~84 coordinate hits | Terrain, buildings, landmarks, visual states, interactions and decoration are co-located | Extract selectors and recipes in small families while preserving `town.js` coordinates |
| 3 | `src/data/town.js` | ~358 coordinate/geometry values | Authored world/collision/interaction positions are gameplay-relevant | Treat as protected layout input; registry references it rather than copying values |
| 4 | `src/shop-reference.css` | 1,070 lines; ~150 coordinate-like declarations | Overrides shared and scene-specific shop composition | Merge only at token/adapter layer after screenshot baselines |
| 5 | `src/data/legacyVisualStates.js` | 78 visual-definition entries/indicators | Semantic states exist but mix colors, icons and geometry | Split state selection from renderer recipes without changing thresholds |
| 6 | `src/scenes/HarbourGeneralScene.js` | ~102 Phaser visual calls | Shop-management gameplay, shelves and art geometry share scene code | Introduce shop prefab roles; retain service callbacks and zones |
| 7 | `src/ui/RestaurantPresentation.js` | ~76 Phaser visual calls; shared by multiple venues | Valuable shared renderer but recipe, station and scene styling are intertwined | Add registry-backed roles behind the existing API |
| 8 | `src/scenes/PawsWondersScene.js` | ~80 Phaser visual calls | Species fixtures, shop layout, pet selection and raw animal frames | Extract fixtures/prefabs; preserve animal service and selection IDs |
| 9 | `src/scenes/FishingScene.js` | ~50 visual calls; active bitmap plus procedural cast/magnet layers | Input/cast timing, line geometry and art are adjacent | Preserve state machine; move only presentation construction |
| 10 | `src/data/villageGrocer.js` / `src/data/harbourGeneral.js` | ~64 / ~56 layout or display values | Shop product positions and gameplay catalogue presentation | Reference from layout registry; do not duplicate product IDs/prices |
| 11 | `src/scenes/VillageGrocerScene.js` | ~40 Phaser visual calls | Store room and purchase UI | Use shop-interior recipe plus existing transaction service |
| 12 | `src/entities/NpcCharacter.js` | ~32 visual calls, hard-coded pose anatomy and prop text | Identity/routes are external but pose rendering is internal | Stable NPC prefab roles; activity selector adapter |
| 13 | `src/entities/AnimalCharacter.js` | ~31 visual calls, raw/procedural dual path | Species, water/aerial/follower state affect geometry/alpha/depth | Registry variants must preserve state-driven behavior |
| 14 | `src/scenes/HouseInteriorScene.js` | Phaser geometry plus DOM furniture controls | Room plan, placement geometry and persistent coordinates interact | Preserve room and furniture placement coordinates; visual factory only |
| 15 | `src/scenes/WasteCollectionScene.js` | Phaser board plus multiple DOM templates | Card layout, hit areas, tray and gameplay solver share IDs | Stable card prefab with unchanged board positions and legal moves |
| 16 | `src/rendering/LegacyPowerwashRenderer.js` | Custom canvases, masks and image layers | Visual pixels participate in hit detection/progress | Dedicated adapter; mask and completion parity are mandatory |
| 17 | `src/ui/EconomyHudController.js` / `ShopController.js` | Dozens of DOM templates | Currency, item and purchase state mixed with markup | Shared DOM component adapter; service outputs remain authoritative |
| 18 | Remaining minigame scenes | Repeated scene-local coordinates/Graphics calls | Each board has unique functional geometry | Migrate one game at a time with golden geometry/state tests |

## Cross-cutting hard-coded categories

### Coordinates and responsive layout

- Town world and collision rectangles in `src/data/town.js`.
- Town feature geometry and decorations in `TownScene.js`.
- Each minigame’s board/station/item positions inside its scene.
- CSS absolute positioning and responsive overrides.
- Power-wash mask and canvas dimensions.

Rule: Phase 1–8 must reference existing values or mechanically relocate them to a registry. It must not “improve” coordinates without a separately approved layout phase.

### Scale, origin and depth

- Player origin `(0.5, 0.88)` and entity-specific origins.
- Y-derived Town depth formulas such as base depth plus `y / 10` or `y / 100`.
- Animal directional negative scale, state alpha, shadow/ripple scale and follower depth.
- Numerous fixed scene labels/markers with high overlay depth.

Rule: prefab recipes must record origin, scale and depth policy, not merely the texture key.

### Collision, interaction and hit areas

- Entity `setSize` and `setInteractive` calls.
- Town interaction zones and authored collision rectangles.
- Board-card, station, appliance and shop fixture zones.
- Power-wash mask/hit alignment.

Rule: artwork bounds must never become gameplay collision by accident. Interaction and collision geometry remain explicit protected fields.

### Tint, alpha and state effects

- Animal relocation/follower/water/aerial alpha and shadows.
- Town window glow, pollution rings, restoration overlays and item stains.
- Selection/disabled/success/failure states in DOM CSS.
- Restaurant and minigame state feedback.

Rule: central recipes can own presentation values only after state selectors have unit coverage.

### Animation and timing

- Resident walk frames/rate.
- NPC and animal procedural movement offsets.
- Fishing cast/reel presentation tied to the gameplay state machine.
- Power-wash interpolation and mist.
- Restaurant appliance/order transitions.

Rule: visual animation timing may be separated, but callbacks, completion gates and state-transition timing are protected unless a dedicated gameplay change is approved.

## Hotspot acceptance tests

For every migrated hotspot:

1. Compare a serialized pre/post semantic layout snapshot: identity, x/y, scale, origin, depth policy, collision and interaction rectangles.
2. Run the existing service/state tests.
3. Enter, interact, exit and re-enter the affected scene.
4. Verify save/load with existing and fresh schema-37 fixtures.
5. Capture the smallest phone, modern phone, tablet and 1280×720 reference.
6. Check missing texture, console, listener and resource errors.
7. Prove compatibility aliases resolve every legacy key still in use.

