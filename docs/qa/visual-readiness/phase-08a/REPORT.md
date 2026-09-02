# Phase 8A — Premium Vertical-Slice Production Package

Date: 2026-08-30; lawn contract corrected 2026-09-01
Verdict: **PASS — production package ready; artwork generation and live replacement have not begun**

## Outcome

Phase 8A defines one deliberately bounded premium slice. It does not generate artwork, replace current visuals, change gameplay, or activate a second town renderer.

The representative town block is the real `house-6` block beside Willowmere's north road and river:

- canonical slice: 1280×720;
- world origin: `(1880, 0)`;
- protected house: `house-6`, bay-cottage kit, current world position `(2158, 215)`;
- protected yard: `(2100, 150, 310, 340)`;
- protected lawn: `lawn-house-6`;
- river: 188-unit water width inside a 226-unit bank width;
- representative activity: Lawn Care level 1 and the existing town-job completion path.

The package contains 23 semantic asset contracts, nine family contracts, 21 prefabs, 21 state maps, 13 animations, 59 stable placements, and six dependency waves. The additional lawn placement coverage is deliberate: reusable growth and weed layers are independently bound to all 19 active authored lawns.

## Production outputs

- Machine-readable package: `artwork/production/phase-8a/vertical-slice-production-package.v1.json`
- Generator-ready prompt book: `artwork/production/phase-8a/GENERATOR_PROMPTS.md`
- Dependency/approval order: `artwork/production/phase-8a/DEPENDENCY_ORDER.md`
- Code source of truth: `src/visual/verticalSlice/phase8aVerticalSlicePackage.js`
- Package validator: `src/visual/verticalSlice/validatePhase8APackage.js`
- Repository check: `scripts/validate-phase8a-production-package.mjs`

The JSON and both Markdown handoff files are generated deterministically from the code source of truth. The validator fails if any output is missing or stale.

## Complete slice inventory

| Wave | Semantic ID | Exact output | Required states / frames | Destination |
| ---: | --- | --- | --- | --- |
| 1 | `terrain.town.slice.grass` | 64×64 PNG | default seamless tile | Town block foundation |
| 1 | `terrain.town.slice.pavement` | 64×64 PNG | default seamless tile | House/road pavement strip |
| 1 | `terrain.town.slice.road` | 64×64 PNG | default seamless tile | North Road surface |
| 2 | `terrain.town.slice.river-edge` | 512×64 PNG; 4×1, 128×64 frames | west/east straight and transitions | Willow River edge |
| 2 | `terrain.town.lawn.growth-overlay` | 256×64 RGBA PNG; 4×1, 64×64 frames | fresh-cut 0–19, growing 20–44, long 45–69, job-ready 70–100 | Seamlessly tiled and clipped to all 19 active authored yards |
| 2 | `terrain.town.lawn.weed-overlay` | 256×64 RGBA PNG; 4×1, 64×64 frames | none 0–17, light 18–37, job-ready 38–54, heavy 55–100 | Independent overlay clipped to the same 19 yards |
| 2 | `building.town.slice.house-6-bay-cottage` | 1024×192 PNG; 4×1, 256×192 frames | clean, weathered, job-ready, upgraded | Protected house-6 exterior |
| 3 | `prop.town.slice.large-oak.shadow` | 128×160 PNG | shadow layer | Large oak background layer |
| 3 | `prop.town.slice.large-oak.trunk` | 128×160 PNG | trunk/body layer | Large oak Y-sort/collision layer |
| 3 | `prop.town.slice.large-oak.canopy` | 128×160 PNG | foreground canopy | Large oak occlusion layer |
| 3 | `prop.town.slice.white-fence` | 256×64 PNG; 2×1 | straight, gate | House-6 yard boundary |
| 3 | `prop.town.slice.public-bin` | 192×80 PNG; 3×1 | normal, full, tipped | Pavement prop |
| 3 | `prop.town.slice.rubbish-can` | 64×64 PNG | present, collected | Cleanup interaction prop |
| 3 | `prop.town.slice.flower-planter` | 64×64 PNG | default | Small town decoration |
| 4 | `character.player.slice.resident` | 256×256 PNG; 4×4, 64×64 frames | four directions × four walk frames | Town player / Lawn reference |
| 4 | `character.npc.slice.resident-a` | 256×256 PNG; 4×4, 64×64 frames | four directions × four walk frames | Town NPC |
| 4 | `character.animal.slice.dog` | 192×160 PNG; 4×4, 48×40 frames | four directions × four walk frames | Town animal |
| 5 | `ui.town.slice.lawn-interaction` | 128×64 PNG; 2×1 | available, pressed | Contextual lawn action |
| 5 | `ui.town.slice.coin-reward-burst` | 384×64 PNG; 6×1 | six-frame one-shot | Saved reward feedback |
| 6 | `minigame.lawn.slice.board-tiles` | 256×64 PNG; 4×1 | tall, cut vertical, cut horizontal, hedge | Lawn Care board |
| 6 | `minigame.lawn.slice.weed-tiles` | 192×64 PNG; 3×1 | normal, tough, woody | Lawn Care overlays |
| 6 | `minigame.lawn.slice.mower` | 256×64 PNG; 4×1 | down, left, right, up | Lawn Care mower |
| 6 | `ui.lawn.slice.controls` | 192×64 PNG; 3×1 | exit, undo, hint only | Lawn Care safe-area controls |

Every row has its complete family, perspective, logical scale, anchor, geometry, sockets, state/layer/direction/animation requirements, filenames, prompt, negative prompt, checks, placement, prefab, and fallback in the production JSON and prompt book.

## Protected interaction and state transition

The slice observes the existing gameplay path:

1. `TownScene.startLawnCare` targets `lawn-house-6`.
2. `LawnCareEngine` owns movement, board rules, success, and failure.
3. `LawnCareService.applyResult` owns completion, `calculateLawnReward`, first-clear/job reward rules, and duplicate protection through `processedSessionIds`.
4. The saved lawn moves from job-ready (`grassHeight >= 70` or `weedPressure >= 38`) toward freshly cut (`LAWN_CONFIG.freshlyCutHeight`, currently 5) and freshly weeded (`LAWN_CONFIG.freshlyWeededPressure`, currently 3) according to the existing completion percentage.
5. The visual state mapper observes the saved state. It cannot write coins, rewards, progress, or save fields.

Grass height and weed pressure are separate visual inputs. Growth artwork must not contain weeds or flowers. Weed artwork is transparent and may contain sparse yellow weed flowers only in the job-ready and heavy frames, matching the current Phaser thresholds. Both sheets are 64px seamless overlays; the authored `LAWN_PLOTS[*].yard` rectangles own clipping, while existing lawn interaction, fence, gate, path, collision, and navigation geometry remain independent.

No reward formula, completion rule, level data, input, economy path, or save schema was changed.

## Architecture-receipt proof

- All 23 assets are present as clearly labelled generated placeholders in the Phase 8A manifest extension, which uses the same schema and runtime registry as `KINDWORKS_VISUAL_MANIFEST`.
- All 21 prefabs resolve through the existing `PhaserPrefabRenderer`.
- Every declared state resolves through a semantic state map.
- All 13 directional/reward animations are registered.
- Town and Lawn Care scene packs contain their complete dependencies.
- All placements use stable instance IDs and declare locked gameplay geometry.
- The development Asset Lab merges that extension into the real `VisualRegistry`, so every placeholder is inspectable without normal gameplay while the production manifest and startup bundle remain unchanged.
- A regression test changes the flower-planter from a placeholder to an image by changing central manifest metadata only; `TownScene.js` and `LawnCareScene.js` remain byte-identical.
- The validator rejects direct Phase 8A coupling in those scene files.

Live display of the premium slice is intentionally deferred to **Phase 8B**, after approved files exist. That later activation is one generic layout/prefab-renderer integration, not scene-specific gameplay rewrites.

## Automated protection

`npm run phase8a:check` validates:

- unique package, family, semantic, prefab, state, animation, and instance identities;
- all mandatory fields for every asset;
- exact dimensions, frame grids, counts, and order;
- prompts, negative prompts, filenames, fallbacks, validation checklists, and scene placements;
- complete dependency order;
- registry placeholder, prefab, state, animation, and scene-pack integration;
- protected lawn target, fresh-cut value, reward ownership, and no visual reward mutation;
- no prematurely generated artwork;
- generated JSON/Markdown handoff freshness;
- no Phase 8A-specific coupling in gameplay scenes.

Targeted tests also prove invalid duplicate IDs, incomplete prompts, malformed sheets, and missing placements fail for the expected reason.

## Verification evidence

- Full automated regression: **709/709 passed**.
- Focused Phase 2, Phase 7, and Phase 8A regression: **24/24 passed**.
- Production build: **PASS**, 196 modules transformed; initial application remains 3,078,966 bytes and Phaser remains 1,374,829 bytes.
- Production exclusion: **PASS**, all 30 development-only markers absent and the base production registry remains 15 assets.
- Phase 8A validator: **PASS**, including generated-handoff freshness and rejection fixtures.
- Development Asset Lab: **PASS**, 37 total registry entries (15 production entries plus 22 Phase 8A placeholders); the public-bin placeholder exposes normal, full, and tipped states.
- Browser emulation: **PASS** at 568×320, 844×390, and 1024×768 with no document overflow and no console warnings or errors.
- Existing town fixture: **PASS** at 844×390 after visual review; Phase 8A does not alter the running town presentation.
- Save/gameplay mutation: **none**; tests preserve the protected schema-37 fixture, and no gameplay scene is coupled to a Phase 8A ID.

## Acceptance gate

| Requirement | Result |
| --- | --- |
| Complete contract for every slice asset | PASS — 22/22 |
| Placeholder/existing-art fallback | PASS — 22/22 registry placeholders plus development/production fallback policy |
| Automated validation rule | PASS — 22/22 plus package-level validator |
| Intended scene destination and prefab | PASS — 22/22 |
| Generator-ready prompt and forbidden output | PASS — 22/22 |
| Dependency-ordered production list | PASS — six approval waves |
| Receive replacement without per-asset scene gameplay edits | PASS — manifest-only replacement test |
| No mass generation | PASS — no expected artwork file exists |

**Phase 8A verdict: PASS.** This verdict covers production readiness only. It does not claim that premium artwork has been generated, approved, integrated, or visually verified in live gameplay.
