# KindWorks Visual-Readiness Architecture QA Baseline

**Audit date:** 2026-08-30  
**Repository:** `/Users/youyoulu/Documents/GitHub/Kindworks`  
**Branch:** `phase-2-ui-simplification`  
**Starting commit:** `3387bcb48964c41edbdc26f4257d2990fcdaf8d5`  
**Audit type:** Read-only architecture, build, test, parity, browser-runtime and tooling baseline  
**Production code changed by this audit:** No  

## Baseline decision

The current game is a functioning Phaser 4.2.1/Vite 8.2.2 application with a substantial automated gameplay/parity suite and a real, validated visual-readiness foundation. The production build, 716 automated tests, exhaustive minigame parity validation, differential HTML parity validation, visual-registry validation, scene-layout validation, scale validation, artwork-pipeline validation, production-surface validation and existing screenshot-baseline validation all pass.

The architecture is **not yet a complete artwork-replacement layer for the whole game**. The semantic runtime registry currently owns 15 assets, six prefabs, one production scene instance, four animations and four scene packs. Only Fishing has a complete extracted scene layout, and town bins are the only fully migrated reusable prop family. Most of Town, shops, interiors, characters, animals, restaurant presentation and minigame boards still create visuals, sizes and geometry directly in scene/entity/UI code or CSS.

This is a verified baseline, not a visual-readiness completion claim.

## Scope and evidence rules

- Existing Phase 0–10 documents were used as leads, then checked against the current repository.
- Code existence was not treated as runtime proof.
- Browser checks used the Codex in-app Chromium browser against both Vite development and production-preview builds.
- Browser sizes were emulated CSS viewports, not physical devices.
- The real user save was not modified by QA fixtures. Visual-regression and fidelity routes use isolated storage.
- The repository was already heavily modified and contained many untracked files before this audit. Those changes were preserved.
- No artwork was generated and no production visual architecture was changed.

# A. Project and system map

## A1. Package, build and boot

| Concern | Verified implementation |
| --- | --- |
| Package | `kindworks@0.1.0`, private ESM package |
| Runtime dependency | `phaser@4.2.1` |
| Build dependency | `vite@8.2.2` |
| HTML shell | `index.html` |
| JavaScript entry | `src/main.js` |
| CSS entries | `src/style.css`, `src/shop-reference.css` |
| Initial Phaser scenes | `BootScene`, `TownScene` |
| Lazy scene catalogue | `src/scenes/lazyScenes.js` with 16 production scenes |
| Canonical canvas | 1280×720, `Phaser.Scale.FIT`, `CENTER_BOTH` |
| Pixel policy | `pixelArt: true`, `roundPixels: true`, nearest-neighbour production contract |
| Town world | 4200×2800 logical units |
| Production build | `pnpm run build` → `dist/` |
| Development server | `pnpm run dev` / Vite |

Execution path:

```text
index.html + CSS
        |
src/main.js
        |
        +-- bootstrap schema-37 save/runtime services
        +-- create semantic VisualRegistry
        +-- create Phaser.Game(1280x720, FIT, CENTER_BOTH)
        +-- BootScene
        |     +-- animal reference spritesheet
        |     +-- generated resident textures/animations
        |     +-- interrupted-activity recovery
        |
        +-- TownScene
              +-- code-drawn world and entities
              +-- DOM HUD/controllers
              +-- 16 lazy scenes
```

## A2. Scene inventory

There are 18 production scene classes: two initial scenes and 16 lazy scenes. `ScaleCalibrationScene` is a nineteenth scene file but is development-only. `AssetLabScene` lives under `src/visual/dev/` and is also development-only.

| Scene | Source | Normal role and route | Render path | Current baseline evidence |
| --- | --- | --- | --- | --- |
| `BootScene` | `src/scenes/BootScene.js` | Application start → Town or interrupted activity | Phaser loader/generated textures | Build and automated recovery tests pass |
| `TownScene` | `src/scenes/TownScene.js` | Main world hub; enters all connected content | Procedural Phaser + entities + DOM | Live 1280×720 pass; no console errors |
| `HouseInteriorScene` | `src/scenes/HouseInteriorScene.js` | Town house ↔ Town | Phaser room + DOM placement UI | Live 1024×768 pass |
| `VillageGrocerScene` | `src/scenes/VillageGrocerScene.js` | Town Grocer ↔ Town | Phaser shop + DOM purchase panel | Live 844×390 pass |
| `PawsWondersScene` | `src/scenes/PawsWondersScene.js` | Town pet shop ↔ Town | Phaser fixtures/animals + DOM | Registration and service tests pass; not live-smoked in this audit |
| `HarbourGeneralScene` | `src/scenes/HarbourGeneralScene.js` | Town shop ↔ Town | Procedural Phaser + DOM management | Registration, catalogue and business tests pass |
| `BakeryScene` | `src/scenes/BakeryScene.js` | Town Little Bakery ↔ Town | Shared restaurant renderer + DOM | Registration and full service tests pass |
| `CafeScene` | `src/scenes/CafeScene.js` | Town Corner Café ↔ Town | Shared restaurant renderer + DOM | Live 844×390 level-entry pass; service tests pass |
| `MorningMugScene` | `src/scenes/MorningMugScene.js` | Town Morning Mug ↔ Town | Shared restaurant renderer + DOM | Registration and full service tests pass |
| `RiversideKitchenScene` | `src/scenes/RiversideKitchenScene.js` | Town kitchen ↔ Town | Shared restaurant renderer + DOM | Registration and full service tests pass |
| `SouthShoreScoopsScene` | `src/scenes/SouthShoreScoopsScene.js` | Town ice-cream venue ↔ Town | Bespoke Phaser/DOM presentation | Registration, label and 750-shift tests pass |
| `RiverClearoutScene` | `src/scenes/RiverClearoutScene.js` | Town river job ↔ Town | Phaser board + DOM | 750-level, portrait, input and reward tests pass |
| `HouseRescueScene` | `src/scenes/HouseRescueScene.js` | Dirty house job ↔ Town | Phaser room/sort/vacuum + DOM | 750-level and completion tests pass |
| `WasteCollectionScene` | `src/scenes/WasteCollectionScene.js` | Town cleanup job ↔ Town | Phaser card board + DOM | 750-board and interaction tests pass |
| `LawnCareScene` | `src/scenes/LawnCareScene.js` | Lawn job ↔ Town | Phaser board + DOM controls | Live 568×320 pass; 750-level tests pass |
| `BeachCleanupScene` | `src/scenes/BeachCleanupScene.js` | South Shore job ↔ Town | Phaser board + DOM | 750-level, swipe and rake-pattern tests pass |
| `PlaygroundPowerwashScene` | `src/scenes/PlaygroundPowerwashScene.js` | Commons job ↔ Town | Phaser shell + custom canvas renderer | Live 1024×768 pass; 750-level/mask tests pass |
| `FishingScene` | `src/scenes/FishingScene.js` | Three fishing spots/magnet mode ↔ Town | Registry bitmap + Phaser rig + DOM | Layout/reference-overlay and service tests pass |

Development scenes/tools:

| Tool | Source | Route | Live result |
| --- | --- | --- | --- |
| Asset Lab | `src/visual/dev/AssetLabScene.js` | `?qa=asset-lab` | PASS: 37 development-visible records, 0 warnings |
| Scale Calibration | `src/scenes/ScaleCalibrationScene.js` | `?qa=scale-calibration` | PASS: canonical, depth and geometry markers present |
| Reference Overlay | `src/visual/dev/ReferenceOverlayController.js` | `?qa=reference-overlay` | PASS: Fishing layout schema 1 validated |
| Scene QA Overlay | `src/visual/dev/SceneQaOverlayController.js` | `?qa=scene-visual` | PASS: Town, reference profile, 0 fallback warnings |
| Fidelity activity selector | `src/qa/FidelityQaHarness.js` | `?qa=fidelity` | PASS: 17 isolated activities enumerated |

The production preview was opened with `?qa=asset-lab`. It remained in `TownScene`, exposed no Asset Lab UI, and did not define `window.__KINDWORKS_PHASER_GAME__`. This confirms the development route is excluded at the application boundary.

## A3. Mini-game and business inventory

The isolated fidelity catalogue exposes 17 activities:

1. Lawn Care.
2. River Clear-Out.
3. Waste Collection.
4. House Rescue.
5. Beach Cleanup.
6. Playground Power Wash.
7. Fishing.
8. Magnet Fishing.
9. Little Bakery.
10. Corner Café.
11. Morning Mug.
12. Riverside Kitchen.
13. South Shore Scoops.
14. House Interiors.
15. Village Grocer.
16. Fresh Market.
17. Harbour General.

The exhaustive minigame parity validator treats 14 gameplay/business families as protected comparisons and validates 5,850 campaign levels plus seeded fishing/magnet selections and Harbour General catalogue rules.

## A4. World areas, interiors and overlays

Town/world data accounts for:

- ten named districts: North Cottages, Old Market, Willow Commons, Willow Cottages, High Street, East Cottages, South Meadow, Willow Allotments, Reedbank and South Shore;
- roads, paths, river, banks, rocks, bridges, ponds, beach, harbour, woodland boundary and lawns;
- 19 physical house plots plus the stable personal-home identity;
- restaurant/shop exteriors and the active Grocer, Fresh Market, Paws & Wonders and Harbour General interiors;
- farming/allotment/orchard, NPC routes, wildlife, pets, municipal collection, litter/pollution, restoration, fishing and placement systems.

`index.html` currently contains 610 IDs. Major player-facing DOM surface families are:

- town HUD/menu, current interaction, placement, owned-resident control and onboarding;
- wallet/economy, inventory, shop, save status and shared loading/error surfaces;
- custom resident and home setup/progression;
- farming, animal friends, pet follower management, restoration, gifts, narrative and impact;
- Village Grocer, Paws & Wonders, Harbour General and Home Interior HUD/panels;
- picker/gameplay/result shells for Bakery, Café, Morning Mug, Riverside Kitchen and Scoops;
- gameplay/result shells for River, Waste, Lawn, Beach, House Rescue and Power Wash;
- Fishing and shared cleanup surfaces;
- the global landscape/portrait orientation barrier.

Controller ownership is centralized by purpose under `src/ui/`, including `ResponsiveShellController`, `SharedOverlayController`, `InteractionFeedbackController`, `TownMenuController`, `ShopController`, `EconomyHudController`, `SaveStatusController`, `OnboardingController`, `NpcNarrativeController`, `FarmingController`, `AnimalFriendsController`, `RestorationMilestoneController`, `HomeownerGiftController`, `CustomResidentController`, `ImpactController` and `RestaurantPresentation`.

## A5. Save/load and persistent-state contract

| Contract | Verified owner |
| --- | --- |
| Current schema | 37 (`src/state/constants.js`) |
| Current key | `kindworks_phaser_v1` |
| Backup key | `kindworks_phaser_v1_backup` |
| Recovery key | `kindworks_phaser_v1_recovery` |
| Envelope | format, schema, timestamp, app version, cloned data and checksum |
| Validation | `validateSaveEnvelope` + `validateGameState` |
| Recovery order | current → backup → recovery |
| Legacy import | versions 12–82; protected HTML keys are read, never overwritten |
| Normalization | supported old Phaser schemas are upgraded to schema 37 |
| Browser persistence | `localStorage`; fidelity and visual QA use an isolated namespace |

Protected contracts for all later visual work:

- save keys, envelope format, checksum, backup/recovery and schema migration;
- stable player, NPC, animal, house, item, level and scene identities;
- 5,850 campaign levels, unlock bands, recipes, rewards and completion rules;
- coins, inventory ownership, shop prices, placement transforms and equipment effects;
- NPC routes/schedules/stories, animal habitat/rarity/feeding/pet state and farming timers;
- house dirt, lawn growth, pollution/restoration, day/weather and apple/crop state;
- collision, navigation, interaction and touch geometry;
- town/minigame entry, return location, interrupted-activity recovery and reward idempotency.

# B. Commands executed and results

| Command/check | Result | Evidence |
| --- | --- | --- |
| `pnpm list --depth 0` | PASS after read-only access to pnpm metadata | Phaser 4.2.1 and Vite 8.2.2 installed; two packages total |
| `pnpm run build` | PASS | 196 modules; Vite production build completed in 813 ms |
| Post-build performance budget | PASS | initial app 3,078,966 B; Phaser 1,374,829 B; total JS 4,851,687 B; 19 lazy chunks |
| Production surface validator | PASS | 30 development-only markers absent from production JS |
| Visual registry validator | PASS | 15 assets, 7 files, 6 prefabs, 1 scene instance, 4 animations, 4 packs |
| Scene layout validator | PASS | one Fishing layout, 12 stable instances, 6 named zones |
| Scale validator | PASS | 1280×720, five supported profiles, ten calibration specimens |
| Artwork pipeline validator | PASS | one valid sample accepted; six invalid fixtures rejected |
| Phase 8A validator | PASS structurally | 22 contract-only assets; no generated runtime slice art present |
| Phase 10 plan validator | PASS structurally; execution BLOCKED | 74 families, 18/18 scenes assigned; Phase 8B remains 0/22 approved assets |
| Screenshot-baseline verifier | PASS | 10 images, six scene families, five profiles, 80 source files fingerprinted |
| `pnpm test` | PASS | 716 passed; zero failed/skipped/todo; 66.38 seconds |
| `pnpm run parity:differential` | PASS | 13 activities, 5,850 levels, 19 shared domains, 85 exact rules |
| `pnpm run parity:minigames` | PASS | 14 games, 75 comparisons, 105,795 validated/simulated instances |
| Type check | NOT CONFIGURED | No TypeScript/jsconfig type-check script or configuration found |
| Lint | NOT CONFIGURED | No ESLint/Biome lint script or configuration found |
| Automated browser/E2E suite | NOT CONFIGURED | No Playwright/Cypress/Vitest browser configuration found |

The first sandboxed `pnpm list` attempt could not open pnpm's external SQLite store. Re-running the same read-only command with permission to access pnpm metadata passed. This was an audit-environment limitation, not a project failure.

## B1. Live browser matrix

| Build | Route/scene | Viewport | Result | Objective evidence |
| --- | --- | ---: | --- | --- |
| Development | Town visual fixture | 1280×720 | PASS | `TownScene`; 1280×720 canvas; ready markers; no console warnings/errors |
| Development | Lawn Care | 568×320 | PASS | complete root fit; no scroll overflow; Exit/Undo/Hint are 44 px high |
| Development | Corner Café entry | 844×390 | PASS/PARTIAL | `CafeScene`; no overflow; this baseline covers entry, not an active full shift |
| Development | Power Wash | 1024×768 | PASS | `PlaygroundPowerwashScene`; custom 1536×1024 canvas visible; tools and exit reachable |
| Development | House Interior | 1024×768 | PASS | correct `HouseInteriorScene` body marker; exit and furnishing controls reachable |
| Development | Village Grocer | 844×390 | PASS | correct scene marker; purchase surfaces and 44 px exit reachable; no overflow |
| Development | Asset Lab | 1280×720 | PASS | ready; 37 development-visible assets; 0 warnings; all inspectability counts present |
| Development | Scale Calibration | 1280×720 | PASS | ready; canonical scale, logical/native tree and depth relation exposed |
| Development | Reference Overlay | 1280×720 | PASS | Fishing layout valid; geometry lock and overlay tools visible |
| Development | Scene QA Overlay | 1280×720 | PASS | Town/reference profile; six semantic objects; zero fallback warnings |
| Production preview | `?qa=asset-lab` | 1280×720 | PASS | remained `TownScene`; no dev global; no Asset Lab UI; no console errors |

No browser-tab warning or error entries were captured from the representative visual routes or production preview. No missing-texture/fallback marker appeared in those routes. After the audit repeatedly opened fidelity activities without completing their normal exit flow, the Vite server forwarded one warning: `Multiple interrupted activities were found. Resuming Playground Power Wash; 4 older checkpoint(s) remain preserved.` This was created in the isolated fidelity namespace by the audit sequence, not in the production save; it demonstrates that interrupted-activity conflict detection is active and is not classified as a production defect. The browser tool did not provide a HAR/failed-request API, so resource evidence is console state, successful ready markers, loaded dimensions and repository file validators—not a complete network trace.

Existing baseline screenshots are under `docs/qa/visual-readiness/phase-01/baselines/` and are indexed by `docs/qa/visual-readiness/phase-01/BASELINE_MANIFEST.json`:

- Town at 568×320, 844×390, 1024×768, 1280×720 and 1366×768.
- House Interior at 1024×768.
- Village Grocer at 844×390.
- Corner Café at 844×390.
- Lawn Care at 568×320.
- Power Wash at 1024×768.

# C. Visual architecture inventory and dependency map

## C1. Current render back ends

| Back end | Artwork loading | Placement | Functional geometry | Principal users |
| --- | --- | --- | --- | --- |
| Phaser procedural | Scene/entity code | Scene/entity literals and data catalogues | Frequently co-located with visuals | Town, NPCs, animals, shops, most minigames |
| Phaser semantic registry | `VisualRegistry` + manifest/packs | prefab/instance/layout data | separate visual/collision/navigation/interaction/touch fields | Fishing background and town-bin pilot |
| Generated Phaser textures | `PlayerCharacter.createPlayerAssets` | entity code | entity code | player/resident walking frames |
| Raw Phaser spritesheet | Boot loader / registry record | animal entity logic | entity/habitat logic | animal reference sheet |
| DOM/CSS | `index.html`, controllers, two stylesheets | DOM structure + CSS selectors/media rules | DOM hit targets and controller logic | HUDs, dialogs, menus, shops and minigame rails |
| Custom canvas | native `Image` + `LegacyPowerwashRenderer` | renderer constants and scene sizing | dirt mask, wash interpolation and completion | Power Wash |

## C2. Semantic visual foundation

Source-of-truth files:

- contracts/schema: `src/visual/contracts.js`;
- registry/runtime resolution: `src/visual/VisualRegistry.js`;
- legacy aliases: `src/visual/LegacyCompatibility.js`;
- production manifest: `src/visual/visualManifest.js`;
- registry validation: `src/visual/validateVisualManifest.js`;
- generated runtime pack: `src/visual/generated/artworkRuntimePacks.js`;
- pilot prefabs/factory: `src/visual/prefabs/townBinPrefabs.js`, `src/visual/renderers/TownBinVisualFactory.js`;
- generic Phaser prefab renderer: `src/visual/renderers/PhaserPrefabRenderer.js`;
- layout contracts: `src/visual/layouts/sceneLayoutContracts.js`;
- only extracted production layout: `src/visual/layouts/fishingSceneLayout.js`;
- scale/depth/safe-area contract: `src/visual/scale/scaleSystem.js`;
- artwork workflow and generated pack scripts: `src/visual/artwork/`, `scripts/validate-artwork-pipeline.mjs`, `scripts/generate-artwork-runtime-packs.mjs`.

Production registry scope is intentionally small:

- 15 asset definitions (seven file-backed);
- six prefabs;
- one stable production scene instance;
- four resident walk animations;
- four scene packs;
- two texture-key aliases plus four animation-key aliases;
- unmapped legacy keys pass through;
- visible magenta development fallback and transparent safe production fallback, both recorded as failures.

The Asset Lab extends this manifest with 22 Phase 8A contract placeholders and therefore displays 37 records in development. Those placeholder definitions are not approved production artwork and are not in the production manifest.

## C3. Ownership map

```text
Persistent state (GameState schema 37)
        |
        +-- domain services: authoritative rules, rewards, progression, timers
        |
        +-- Town/NPC/animal/farming data catalogues
        |       +-- collisions: town.js, townPlacement.js, scene/entity code
        |       +-- navigation: npcTownLife.js -> NavigationGraph
        |       +-- interactions: scene definitions -> InteractionSystem
        |
        +-- scene snapshots / controller updates
                |
                +-- procedural Phaser renderer
                +-- DOM/CSS renderer
                +-- Power Wash canvas renderer
                +-- semantic registry/prefab/layout pilot
```

| Dependency | Current source(s) | Gameplay-to-visual coupling |
| --- | --- | --- |
| Artwork files/keys | `visualManifest.js`, Boot loader, generated pack, Power Wash renderer | mostly centralized only for registered pilot assets |
| Visual placement | `TownScene`, each minigame scene, entity classes, `RestaurantPresentation`, CSS | high; numerous direct literals |
| Collision | `src/data/town.js`, `townPlacement.js`, scene/entity code, house-rescue geometry | partly data-driven, not uniformly prefab-owned |
| Interaction areas | `TownScene` interactables, `InteractionSystem`, scene buttons/zones, DOM hit targets | high; scene-local radii/rectangles remain common |
| NPC navigation | `src/data/npcTownLife.js`, `NavigationGraph`, `NpcTownLifeService`, `CustomResidentService` | route graph is independent; presentation still uses route/activity values directly |
| Animal movement/habitat | `animals.js`, `AnimalService`, `AnimalCharacter` | behavior data is external; visual depth/alpha/anatomy is entity-local |
| Responsive scale | Phaser FIT/CENTER, `ResponsiveShellController`, `scaleSystem.js`, 88 CSS media rules | three overlapping systems; tested but distributed |
| UI layout | `index.html`, UI controllers, `style.css`, `shop-reference.css` | large global cascade and scene-specific selectors |
| Persistent state | `GameState`, `SaveRepository`, domain services | well separated from artwork; protected by extensive tests |

# D. Hard-coded dependency inventory

## D1. Active file-backed visual sources

| Semantic identity | Current source | Technical dependency |
| --- | --- | --- |
| Animal reference sheet | `/assets/animals/reference-master-v44.png` | 384×512 sheet; 64×64 frames |
| Fishing background | `/assets/runtime/scene/fishing/fishing-reedbank-background.v1.webp` | 720×405; no alpha; registry-owned |
| Previous Fishing comparison | `/assets/legacy-reference/fishing.webp` | Asset Lab comparison only |
| Power Wash master | `/assets/powerwash/playground-master.png` | 1536×1024, opaque, dimension-sensitive |
| Power Wash dirt mask | `/assets/powerwash/playground-reference-dirt.png` | 1536×1024 functional mask |
| Precision tool | `/assets/powerwash/tool-precision.png` | 80×101 |
| Standard tool | `/assets/powerwash/tool-standard.png` | 77×102 |
| Wide tool | `/assets/powerwash/tool-wide.png` | 84×102 |

Generated player texture keys remain `resident-{direction}-{frame}` with four directions and four frames each; public animation keys remain `resident-walk-{direction}` at 9 fps, repeat `-1`.

Runtime loading sites found by repository scan:

- `src/scenes/BootScene.js`: raw animal spritesheet load;
- `src/entities/PlayerCharacter.js`: generated textures;
- `src/visual/VisualRegistry.js`: semantic file loading and generated fallbacks;
- `src/visual/dev/AssetLabScene.js`: development inspection loads;
- `src/scenes/PlaygroundPowerwashScene.js` and `src/rendering/LegacyPowerwashRenderer.js`: native image/canvas path;
- `src/visual/dev/ReferenceOverlayController.js`: developer-supplied reference image.

No production atlas loader was found. The current animation registry covers resident walking only.

## D2. Canonical hard-coded visual contracts

The following values are intentionally centralized and should be treated as contracts, not removed as arbitrary magic numbers:

- canonical landscape 1280×720;
- world unit 1 px/unit, grid 8, layout module 32;
- supported viewports 568×320, 844×390, 1024×768, 1280×720 and 1366×768;
- player 40×54 with origin `(0.5, 0.88)`;
- minimum touch target 44 CSS px;
- depth bands: terrain 0, water/banks 4, roads 10, details 20, buildings 60, Y-sorted world 200, foreground 490, interaction 475, placement 520 and HUD 1000;
- Town zoom approximately 0.28–1.3;
- river water/bank widths 188/226;
- road 50–76 plus edge, paths 25–26 plus edge;
- logical prefab reference sizes for houses, lawns, tree, bench, bin and door in `scaleSystem.js`.

## D3. Hotspot counts

Counts below are reproducible `rg` heuristic counts. They identify files requiring manual extraction; they are not a claim that every matched number is wrong.

### Direct visual-construction/state calls

| File | Matches |
| --- | ---: |
| `src/scenes/TownScene.js` | 116 |
| `src/scenes/HarbourGeneralScene.js` | 40 |
| `src/ui/RestaurantPresentation.js` | 39 |
| `src/scenes/PawsWondersScene.js` | 35 |
| `src/scenes/FishingScene.js` | 29 |
| `src/scenes/ScaleCalibrationScene.js` | 21 |
| `src/scenes/VillageGrocerScene.js` | 21 |
| `src/entities/AnimalCharacter.js` | 12 |
| `src/scenes/HouseInteriorScene.js` | 10 |
| `src/entities/NpcCharacter.js` | 6 |
| `src/scenes/WasteCollectionScene.js` | 6 |
| Other scene/entity files | 1–5 each |

### Geometry/collision/interaction vocabulary

| File | Matches |
| --- | ---: |
| `src/scenes/TownScene.js` | 544 |
| `src/data/town.js` | 95 |
| `src/scenes/FishingScene.js` | 93 |
| `src/rendering/LegacyPowerwashRenderer.js` | 90 |
| `src/scenes/ScaleCalibrationScene.js` | 88 |
| `src/scenes/HouseInteriorScene.js` | 60 |
| `src/scenes/HarbourGeneralScene.js` | 59 |
| `src/scenes/PawsWondersScene.js` | 51 |
| `src/data/animals.js` | 48 |
| `src/data/riverClearout.js`, `VillageGrocerScene` | 46 each |
| `src/data/houseRescueGeometry.js` | 45 |
| `src/data/townPlacement.js` | 42 |
| Other data/scene/entity files | 7–23 each |

### DOM/CSS

- 610 HTML IDs.
- 83 `@media` rules in `style.css` and five in `shop-reference.css`.
- 816 `!important` declarations in `style.css`.
- DOM layout, visual styling, visibility, responsive behavior and scene state are therefore tightly coupled through the global cascade.

## D4. Where gameplay still depends on visual properties

Confirmed coupling requiring special protection:

1. Power Wash uses pixel-aligned art/masks for hit detection and completion residue. Replacing dimensions or trimming art can alter gameplay.
2. Town building/house visuals, collision rectangles, interaction radii and landmark placement are often calculated in the same scene methods.
3. NPC/animal entity code combines visual depth, alpha, shadow/ripple and pose with movement/habitat state.
4. House Interior and town placement use persisted coordinates plus visual bounds and collision rules.
5. Waste cards, restaurant stations, Fishing cast rig and cleanup boards use display coordinates as input/hit geometry.
6. DOM controls rely on global CSS size/position for touch reachability and can diverge from the scaled Phaser canvas.

The pilot prefab system correctly separates visual, collision, navigation, interaction and touch geometry. That separation has not yet been propagated to most production families.

# E. Existing failures, warnings and confirmed risks

## E1. Confirmed defects in this audit

No new runtime P0–P2 defect was reproduced in the tested routes. Build, tests, parity, live readiness markers and console checks passed.

## E2. Confirmed architecture and coverage gaps

| ID | Priority | Finding | Evidence | Consequence |
| --- | --- | --- | --- | --- |
| VR-BL-001 | High | Semantic registry coverage is incomplete | 15 production assets, six prefabs, one scene instance, four packs versus 18 production scenes and hundreds of drawn/DOM objects | Most artwork cannot yet be replaced by manifest change alone |
| VR-BL-002 | High | Only Fishing has a complete extracted production scene layout | layout validator reports one layout/12 instances | Scene-wide artwork/layout replacement still requires scene edits elsewhere |
| VR-BL-003 | High | Screenshot coverage is narrow | ten baselines cover six scene families; 18 production scenes exist | Visual regressions in restaurants, River, Waste, Beach, Paws, Harbour, Fishing and results/modals may escape |
| VR-BL-004 | High | Baseline verification is structural, not an automated pixel-diff review | validator checks manifest/fingerprint/file dimensions/checksums | It detects changed baseline inputs/files, but does not decide whether a new rendering differs acceptably |
| VR-BL-005 | High | Phase 8B/9 production art gates remain blocked | 0/22 approved vertical-slice runtime assets | The premium slice and measured production art bible are not proven |
| VR-BL-006 | High | Power Wash artwork is functional geometry | 1536×1024 master/dirt mask and custom canvas renderer | Incorrect art replacement can change hit detection/completion |
| VR-BL-007 | Medium | No automated browser/E2E runner | no Playwright/Cypress config; browser checks are manual | scene transitions and visual readiness are not continuously exercised in CI-like runs |
| VR-BL-008 | Medium | No lint or type-check command | package/config inspection | static interface drift and unsafe refactors rely on tests/build only |
| VR-BL-009 | Medium | CSS architecture is highly coupled | 610 IDs, 88 media rules, 816 `!important` declarations | visual migration can create hidden breakpoint regressions |
| VR-BL-010 | Medium | Existing restaurant screenshot covers entry rather than full active shift | live Café fixture showed level-entry controls | station/customer/order visual regressions need a deterministic active-shift baseline |
| VR-BL-011 | Medium | Production missing-art fallback is transparent | registry production fallback contract | crashes are avoided, but missing art can be visually silent unless logs are collected |
| VR-BL-012 | Medium | Browser resource evidence is not a complete network trace | no HAR/failed-request capture available in the browser tool | missing-resource proof depends on validators, ready markers and console logs |
| VR-BL-013 | Observation | Initial JS remains large despite passing its explicit budget | 4.85 MB total JS, 3.08 MB initial app | mobile startup should remain monitored during asset migration |
| VR-BL-014 | Observation | Current evidence is emulation only | in-app Chromium viewport overrides | physical touch, memory pressure, notches and OS orientation behavior remain unproven |

## E3. Pre-existing worktree state

The audit began on a dirty working tree with many modified and untracked production, test, report and visual-readiness files. This report does not attribute those changes to this audit, revert them or certify that they form a clean commit. A clean review/commit boundary is required before large migration batches.

# F. Testing and tooling gaps

1. Add deterministic browser screenshot capture for every production scene family, active gameplay state, result state, important modal and orientation barrier.
2. Add perceptual pixel-diff thresholds and an explicit human approval workflow; keep baseline refresh separate from test execution.
3. Add automated console and failed-resource collection, including production preview.
4. Add full active-shift fixtures for all five restaurant games.
5. Add deterministic state fixtures for dirty/clean houses, four lawn states, restoration states, animal/follower states, farming stages and day/night/weather.
6. Add layout/registry coverage validation that reports every production scene object still using raw visual keys or direct construction.
7. Add linting and a JavaScript type-check strategy before broad registry/factory API changes.
8. Add memory/listener/timer regression checks across repeated scene entry/exit.
9. Add physical-device checks for at least one narrow phone and one tablet, including orientation interruption and safe areas.
10. Add a build artifact inventory for oversized images/atlases and duplicate runtime assets before mass art integration.

# G. Prioritized risks

## G1. Highest risk

1. **Functional-pixel coupling in Power Wash.** Its art, dirt mask, wash progress and completion logic must be migrated as one validated family.
2. **TownScene concentration.** It is the largest visual and geometry hotspot and owns the central player experience.
3. **False confidence from partial semantic coverage.** The registry is valid, but most objects do not use it yet.
4. **Partial visual regression coverage.** Six represented families are not enough for 18 production scenes and all their states.
5. **No approved premium slice.** The architecture cannot be called production-art proven until Phase 8B passes with compliant assets.

## G2. Medium risk

1. CSS cascade changes can affect multiple scenes and break small-phone touch layout.
2. Restaurant scenes share presentation code, so one change can regress five games.
3. Player/NPC/animal visuals use three different rendering strategies.
4. Transparent production fallback prevents a crash but can conceal a missing visual.
5. Large initial JS and future asset volume can create mobile startup/memory pressure.

## G3. Lower risk but required discipline

1. Keep stable semantic IDs independent of filenames and generator names.
2. Keep source/master, staged, approved and runtime artwork separate.
3. Do not allow art dimensions to redefine collision or interaction geometry.
4. Do not update screenshot baselines in the same unreviewed operation that changes visuals.

# H. Recommended order for the following QA stages

## Stage 1 — Clean reproducible audit boundary

- Record or commit the intended current working tree.
- Re-run the exact baseline commands from this report.
- Preserve this report's branch, commit and dirty-tree note for comparison.

**Gate:** same 716 tests, build/postbuild and both parity validators pass from an attributable revision.

## Stage 2 — Complete browser coverage and visual baselines

- Add deterministic active states for all 18 production scenes and major modal/result states.
- Capture all five supported profiles where the scene supports landscape; capture the River portrait contract separately.
- Add console/resource checks and pixel-diff reporting.

**Gate:** every production scene family has a reproducible browser route and reviewed baseline.

## Stage 3 — Semantic coverage audit

- Produce an automated registry/layout/prefab coverage report for every production visual instance.
- Classify each remaining object as semantic, legacy-bridged, procedural, DOM/CSS or custom canvas.
- Fail on undocumented raw production keys.

**Gate:** every visual dependency has an owner and migration wave.

## Stage 4 — Geometry separation QA

- Verify visual, collision, navigation, interaction and touch bounds separately for Town, interiors and each minigame.
- Compare serialized geometry before and after any extraction.

**Gate:** replacement source dimensions cannot change gameplay geometry.

## Stage 5 — Family-by-family renderer migration

- Continue from town bins to other low-risk props, vegetation, buildings, NPCs/animals and UI.
- Migrate one coherent family per verified batch.

**Gate per family:** manifest-only artwork replacement, no scene gameplay edit, screenshot match and interaction/save parity.

## Stage 6 — Complex renderer QA

- Treat Power Wash, restaurant presentation, Fishing rigs and House Rescue as specialized families.
- Validate masks, station targets, animation callbacks and completion behavior with both pixel and gameplay tests.

**Gate:** functional rendering metrics remain numerically identical.

## Stage 7 — Premium slice and art-bible proof

- Do not proceed until all 22 Phase 8A assets are supplied, staged, validated and approved.
- Complete Phase 8B and then derive Phase 9 measurements from accepted runtime pixels.

**Gate:** 22/22 slice assets integrated with no fallback and all slice gameplay/viewport checks passing.

## Stage 8 — Mobile and performance certification

- Test physical narrow phone/tablet devices, orientation interruptions, notches, memory, startup and long sessions.
- Track asset budgets and scene-transition memory over repeated cycles.

**Gate:** no P0/P1 regression, no missing resource, touch/safe-area pass, and performance remains within agreed budgets.

## Reproduction commands

```sh
pnpm list --depth 0
pnpm run build
pnpm test
pnpm run parity:differential
pnpm run parity:minigames
pnpm run dev
```

Development visual routes:

```text
?qa=visual-regression&scenario=town
?qa=visual-regression&scenario=house-interior
?qa=visual-regression&scenario=village-grocer
?qa=visual-regression&scenario=corner-cafe
?qa=visual-regression&scenario=lawn-care
?qa=visual-regression&scenario=powerwash
?qa=asset-lab
?qa=scale-calibration
?qa=reference-overlay
?qa=scene-visual
?qa=fidelity
```

## Final baseline verdict

**BASELINE VERIFIED — VISUAL-READINESS ARCHITECTURE IS FUNCTIONAL BUT INCOMPLETE.**

The project is safe to continue auditing and incrementally migrating because gameplay, parity, saves, build validation and the pilot semantic systems are protected. It is not safe to assume that arbitrary placeholder art can be replaced game-wide without scene changes. The next required step is complete deterministic browser/screenshot coverage, followed by a semantic coverage audit and family-by-family geometry separation.
