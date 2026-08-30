# Risk-Ranked Migration Plan and Phase 1–8 Acceptance Tests

## Repository-specific design principles

- Keep `GameStateService`, state normalizers/validators, domain services and level catalogues authoritative.
- Introduce `src/visual/` beside current code; do not rewrite scenes wholesale.
- Preserve `src/data/town.js` coordinates and existing collision/hit geometry.
- Put current keys and procedural drawings behind a compatibility layer before replacing anything.
- Support Phaser, DOM and the Power Wash canvas as explicit render targets.
- Stage generated assets under a non-production path; promotion requires validation and review.
- Migrate one coherent visual family/scene at a time and retain a measurable legacy-usage report.

## Risk order

1. **Identity stability:** freeze asset/prefab/animation IDs before filenames change.
2. **Compatibility:** route legacy keys and procedural fallbacks through a non-destructive resolver.
3. **State selectors:** separate dirty/clean/growth/upgrade/activity states without changing rules.
4. **Geometry:** centralize anchors/origins/layers while preserving current coordinates/hit areas.
5. **Shared UI:** consolidate tokens/components gradually without disturbing CSS scene visibility.
6. **Scene families:** migrate low-risk shops/interiors first, then restaurants/minigames, then Town.
7. **Special renderers:** handle Power Wash through a dedicated adapter.
8. **Removal:** delete legacy paths only when usage search, tests and runtime evidence prove zero use.

## Phase 1 — Stable identity and compatibility foundation

### Work

- Add `src/visual/AssetManifest.js`, `VisualIds.js`, `LegacyCompatibility.js` and validators.
- Convert Sprite AI fallback labels to explicit stable IDs for major player-visible roles.
- Register current raw files, generated resident keys and procedural fallbacks without moving files.
- Add a staging namespace/directory that cannot overwrite approved production assets.

### Acceptance tests

1. Every active raw load resolves through the compatibility resolver.
2. Existing texture and animation keys still work unchanged.
3. Two seeded clean runs produce identical semantic IDs after excluding timestamps/instance counts.
4. All 18 scenes and 73 major DOM surfaces have an explicit owner/role record.
5. Duplicate IDs, missing files and unknown variants fail validation.
6. Missing staged assets use the current visual fallback and do not alter state.
7. 611 baseline tests, minigame parity, differential parity and production build pass.
8. Schema-37 fresh/current/backup save fixtures load byte-equivalent gameplay state.
9. No production asset is renamed, moved, deleted or overwritten.

## Phase 2 — Animation registry and visual-state selectors

### Work

- Add `AnimationRegistry.js` and pure `VisualStateSelectors.js`.
- Register resident animations and semantic states for NPC activities, animals, crops, orchards, houses/lawns, pollution/restoration and day/weather.
- Keep `legacyVisualStates.js` as the adapter source until migrated.

### Acceptance tests

1. Selector tests cover every current state and boundary, including crop thresholds 0/.18/.48/.78/1.
2. Selectors accept snapshots and perform no state/service writes.
3. Resident animation IDs, frames, 9-fps default and repeat behavior remain compatible.
4. Dirty/clean house, lawn-ready, fruiting/picked, follower/water/aerial and restoration states match pre-phase snapshots.
5. No level/reward/save diff occurs in differential validation.
6. Enter/re-enter tests show no duplicate animations/listeners.
7. Runtime screenshots cover Town day/weather, dirty/clean house/lawn, farming and animals at phone/tablet/reference viewports.

## Phase 3 — Layout and prefab recipes

### Work

- Add `LayoutRegistry.js`, `PrefabRegistry.js`, schema definitions and geometry validators.
- Describe layers, anchors, scale, origins, depth, shadow, collision and interaction geometry.
- Reference existing `town.js`, scene geometry and South Shore manifest values rather than copying/changing coordinates.

### Acceptance tests

1. Pre/post serialized geometry snapshots match for every migrated object.
2. Collision rectangles, hit areas, station zones and placement coordinates are unchanged.
3. World objects retain Y-depth/occlusion behavior.
4. Trim/origin variants render on the same anchor within a defined pixel tolerance.
5. Touch targets remain reachable at 568×320, 844×390, 1024×768 and 1280×720.
6. No scene introduces an unregistered prefab or direct new production filename.
7. Missing variant falls back safely and visibly in development diagnostics only.

## Phase 4 — Renderer factories and shared UI adapter

### Work

- Add `VisualFactory.js`, Phaser renderer helpers, DOM component adapter and token layer.
- Wrap current shared overlays, shop cards, resource counters, dialog/panel/button states and restaurant presentation behind stable recipes.
- Keep existing DOM IDs/controller contracts during migration.

### Acceptance tests

1. Normal/pressed/disabled/selected states exist for each migrated interactive component.
2. DOM scene visibility and active-scene markers stay synchronized on enter/exit/re-entry.
3. No internal IDs, migration diagnostics or development controls are player-visible.
4. Orientation pause/resume preserves exact activity state and grants no duplicate reward.
5. Safe-area and focus/touch tests pass at required viewports.
6. Shared loading/error/confirmation/reward paths work with missing and slow assets.
7. CSS selector/legacy usage report decreases without breaking unmigrated scenes.

## Phase 5 — Incremental scene-family migration

### Work order

1. Standalone shop interiors: Village Grocer, Paws & Wonders, Harbour General.
2. House interiors and furniture placement.
3. Restaurants: Café, Bakery, Morning Mug, Riverside Kitchen, Scoops.
4. Waste, Lawn, Beach, River, House Rescue, Fishing/magnet fishing.
5. Town object families in bounded batches: terrain → buildings → landmarks → environment → NPCs/animals/placement.

### Acceptance tests per scene

1. Normal world entry and exit; direct QA entry only as secondary evidence.
2. Empty, partial, completed, locked, success, failure and error states as applicable.
3. Input, collision, rewards, save/reload and return location unchanged.
4. Legacy HTML comparison and relevant existing fidelity audit reviewed and cited.
5. Semantic inventory has no unlabeled player-visible role.
6. Screenshots at 568×320, 844×390, 1024×768 and 1280×720; River also 390×844 plus landscape gate.
7. Console/resource checks show no missing textures, duplicate listeners or stale scene objects.
8. Separate verified commit per complex minigame/venue family.

## Phase 6 — Generated-asset staging and review pipeline

### Work

- Add staged manifest records with provenance, prompt/version, intended semantic ID, dimensions, frame geometry and review status.
- Add validators and preview tooling outside the player UI.
- Promote only approved assets by manifest change; never by overwriting a production file.

### Acceptance tests

1. Staged, approved and rejected assets are physically/logically separated.
2. A staged asset cannot resolve in production without explicit approval metadata.
3. Hash, dimensions, transparency, frame count and atlas bounds validate.
4. Duplicate/ambiguous semantic IDs fail.
5. No secrets, credentials or generator tokens appear in repository history/files.
6. Promotion is reversible by one manifest change and preserves fallback.
7. Review sheet/preview shows anchor, collision, shadow and all state/animation variants.

## Phase 7 — Special renderer and full visual-state integration

### Work

- Adapt Power Wash without changing its mask/gameplay engine.
- Complete Town’s stateful layers, animated NPC/animal prefabs and responsive visual recipes.
- Remove only proven redundant CSS/procedural branches behind migrated families.

### Acceptance tests

1. Power-wash master dirt mask, hit alignment, interpolation, nozzle modes, resistance, pressure and 97→100 completion remain exact.
2. Replacement art and masks have verified pixel alignment at all supported scales.
3. Town day/night/weather, dirt/clean, grass growth, crop/orchard, pollution/restoration, NPC activity and animal states all render from semantic selectors.
4. 100 repeated scene entries/exits show no retained scene/listener/canvas growth beyond tolerance.
5. Busy Town and each minigame family meet the established performance budget without new frame-time spikes.
6. Legacy usage report names every remaining direct renderer/key and why it remains.

## Phase 8 — Final cutover, regression and visual-readiness certification

### Work

- Complete remaining manifest coverage and remove only unused compatibility paths.
- Run complete functional, save, responsive, performance and visual evidence suites.
- Produce the final asset inventory and remaining-debt register.

### Acceptance tests

1. Every player-visible scene/screen/panel has stable semantic manifest coverage.
2. Every production raw asset/key/animation is registered and referenced; no missing or orphan production asset remains without documentation.
3. No gameplay code imports raw art filenames directly outside approved adapters.
4. No visual renderer writes persistent gameplay state.
5. Full automated suite, parity validators, production build and performance budget pass.
6. Fresh, legacy-migrated, current, backup and recovery save journeys pass without state/economy/progression diff.
7. Required phone/tablet/reference viewports pass; physical-device results are explicitly distinguished from emulation.
8. All scenes pass entry/exit/re-entry, orientation, interruption and console/resource checks.
9. Before/after evidence and approvals exist for every migrated scene family.
10. No P0/P1 and no unresolved visual-refactor P2 remains.
11. Any retained legacy path has an owner, reason, test and removal/defer decision.

## Program gate

Phase 8 may declare **READY FOR LARGE-SCALE VISUAL REPLACEMENT** only when the complete functional pre-visual QA sequence also permits it. A Phase 0 audit pass alone is not that declaration.

