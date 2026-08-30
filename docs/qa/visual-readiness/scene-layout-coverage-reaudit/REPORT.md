# Independent Scene-Layout Coverage Re-audit

Date: 2026-08-30  
Repository: `/Users/youyoulu/Documents/GitHub/Kindworks`  
Branch: `phase-2-ui-simplification`  
Starting commit: `3387bcb48964c41edbdc26f4257d2990fcdaf8d5`

## Verdict

**STAGE 3 NOT APPROVED — IMPORTANT SCENE PLACEMENT REMAINS UNDOCUMENTED.**

The repaired layout runtime is sound for the migrated Fishing pilot: visual offsets and origins remain presentation-only, protected gameplay geometry remains unchanged, incompatible dimensions are rejected by the asset contract, and transparent-padding violations are detected. That proof does not extend to the rest of the game.

Sixteen of the seventeen important player-visible Phaser scenes have only a canvas/HUD `legacy-boundary` catalogue entry with zero stable object instances. Only Fishing has object-level layout data, and Fishing is itself a partial pilot. A catalogue row is therefore not evidence that a scene's visual objects are data-driven.

No P0 or P1 gameplay regression was found during this audit. The non-approval is an architecture/readiness result: reference-driven visual placement cannot yet be performed safely and consistently across important scenes without editing production scene code, and several current data structures still combine visual placement with gameplay geometry.

## Independent method

This audit did not accept the repair summary as evidence. It:

1. Re-enumerated all registered production scenes and assigned each a scene category.
2. Compared the scene-layout catalogue with actual object-level layout instances and production consumers.
3. Scanned production scenes, the shared restaurant renderer, and global CSS for literal visual placement.
4. Inspected representative execution paths where visual data also creates collision, interaction, spawn, or navigation geometry.
5. Exercised replacements with deliberately different source dimensions, padding, and authored origins.
6. Ran targeted layout/asset tests, the complete automated suite, and the production build.
7. Operated representative world, interior, shop, restaurant, cleanup, power-wash, and Fishing scenes in the browser at supported landscape profiles.

The literal-placement counts are a conservative source heuristic. They include some legitimate dynamic gameplay geometry, so they are not treated as defects by count alone. The decisive tests are whether a stable object-level definition exists, whether production consumes it, and whether visual placement is separated from protected geometry.

## Coverage result

| Metric | Result |
| --- | ---: |
| Registered production scenes | 18 |
| Important player-visible scenes | 17 |
| Catalogue scene entries | 18 |
| Important scenes with object-level layout data | 1 |
| Important scenes with surface-only boundaries | 16 |
| Object-level important-scene coverage | **5.9%** |
| Direct literal placement occurrences in scene files | 711 |
| Literal placement occurrences in shared restaurant presentation | 276 |
| Global UI surfaces with only boundary metadata | 13 |
| Numeric CSS placement lines in the global stylesheet | 2,040 |

The full machine-readable results and representative source excerpts are in `EVIDENCE.json`. The scene-by-scene disposition is in `SCENE_CATEGORY_COVERAGE_MATRIX.md`.

## Findings

### SLC-R001 — High — Catalogue coverage is surface coverage, not scene-object coverage

**Confirmed.** `createSceneSurfaceLayout()` creates `layoutKind: "legacy-boundary"` entries with empty `prefabs`, `instances`, `zones`, `sockets`, entrances, and geometry references. It records the game canvas, an optional HUD selector, and safe-area metadata. The production catalogue contains these empty boundaries for every scene except Fishing.

The existing catalogue validator correctly proves that every registered scene has a catalogue row. It does not prove that the objects inside those scenes are described by layouts. Reporting 18/18 scene catalogue coverage as object-level migration coverage would therefore be a false positive.

Evidence: `src/visual/layouts/sceneLayoutCatalog.js:56-80`, `:104-115`; `EVIDENCE.json`.

Required repair: expose separate validator/report metrics for `surface-boundary coverage` and `object-level placement coverage`. An important scene must not be considered migrated until its required stable visual instances and exceptions are enumerated and its production renderer consumes them.

### SLC-R002 — High — Town visual placement can still move gameplay collision

**Confirmed.** Town house construction uses the same house-derived `x`, `y`, `width`, and `height` values to draw the house and then creates or replaces the building collision rectangle from those values. At `src/scenes/TownScene.js:1078-1081`, visual house dimensions directly determine collision geometry.

This is exactly the coupling the Stage 3 gate forbids. A reference-driven adjustment to the current house placement/dimensions is not guaranteed to be presentation-only. Town also contains 310 literal placement occurrences and zero object-level layout instances; its ten data-driven depth policies do not solve placement or geometry separation.

Required repair: introduce stable Town instances and explicit, independently validated visual, collision, navigation, and interaction references. Preserve current logical coordinates and gameplay geometry as the initial data. Artwork canvas bounds and visual offsets must not be allowed to rewrite those geometry records.

### SLC-R003 — High — Interior and shop data still mixes presentation with gameplay geometry

**Confirmed.** Village Grocer renders the room, fixtures, products, NPCs, and exit from interior data, then derives interactive product zones from the same rectangles and creates the player from the same interior spawn. See `src/scenes/VillageGrocerScene.js:58-94`, `:97-114`, and `:126-149`. Paws & Wonders, Harbour General, and House Interior use comparable scene-local or shared interior structures without object-level scene-layout definitions.

Data-driven source is helpful, but it is not sufficient when one edit can change both the display and interaction/navigation geometry. These systems need an explicit protected-geometry boundary, not merely relocation into a differently named object.

Required repair: migrate one interior/shop family at a time. Assign stable instance IDs, visual offsets, and prefab IDs while preserving separately named logical fixtures, movement bounds, spawn points, exits, and interaction zones. Document intentionally coupled stations where gameplay requires coupling.

### SLC-R004 — High — All restaurant scenes inherit one hard-coded presentation system

**Confirmed.** Bakery, Corner Café, Morning Mug, Riverside Kitchen, and South Shore Scoops each have zero layout instances. The first four share `src/ui/RestaurantPresentation.js`, which contains 276 literal placement occurrences and does not consume the scene-layout runtime. South Shore Scoops is also a surface-only scene.

This prevents reference-driven changes to room partitions, counters, tables, appliances, customer positions, order areas, and UI composition without editing renderer code.

Required repair: extract a versioned restaurant layout contract with common semantic stations plus venue variants. Keep order logic, customer state, pathing, and station-use geometry protected and separate from visual offsets.

### SLC-R005 — High — Cleanup/action scenes remain procedural boundaries

**Confirmed.** River Restoration, House Rescue, Waste Collection, Lawn Care, Beach Cleanup, and Playground Power Wash all have zero object-level layout instances. Their boards and presentation are created with scene constants and direct graphics calls. The audit found 58 direct literal placement occurrences across these scene files, in addition to generated board geometry.

Not every grid coordinate belongs in decorative layout data: board cells, dirt masks, movement grids, rake paths, and completion geometry are gameplay. The missing piece is a documented division between those protected structures and replaceable board frames, backgrounds, tools, props, HUD elements, and effects.

Required repair: define a per-minigame visual layout surface around existing gameplay boards. Preserve board dimensions, cell coordinates, masks, hit areas, and completion rules. Mark truly gameplay-derived visuals as explicit declared exceptions.

### SLC-R006 — Medium — Fishing is a valid but incomplete pilot

**Confirmed.** Fishing has twelve stable layout instances and is the only production scene that registers layout visuals. The origin/dimension/padding tests described below pass. The scene still contains 38 literal placement occurrences. Several are appropriately derived from layout presentation data or are dynamic cast/aim effects, but the remaining literals do not yet have a complete documented disposition.

Required repair: classify every remaining Fishing literal as layout-owned, prefab-internal, gameplay-derived, or dynamic/transient. Migrate stable presentation values and record justified exceptions. Keep dynamic line/cast geometry bound to gameplay state.

### SLC-R007 — Medium — Global UI is only tagged, not data-driven

**Confirmed.** Thirteen global panels are represented as DOM selector boundaries with zero object instances. The stylesheet contains 2,040 lines with numeric placement/sizing declarations. Many are legitimate responsive CSS, but there is no scene-by-scene inventory identifying which are approved responsive rules and which are undocumented one-off placement.

Required repair: inventory the global panels and reusable HUD families. Keep appropriate responsive CSS, but centralize safe areas, breakpoints, shared panel anchors, and touch-target rules and document remaining component-local exceptions.

### SLC-R008 — Medium — Scene surface ownership metadata remains stale after transitions

**Confirmed in live runtime.** After moving from Town to House Interior, Village Grocer, Corner Café, Lawn Care, Power Wash, and Fishing, hidden DOM panels retained prior `data-scene-layout-surface` ownership. Fishing showed both stale Town HUD ownership and stale Power Wash HUD ownership alongside its current surfaces.

This did not duplicate visible controls or change gameplay during the test, but it makes Reference Overlay/Scene QA surface reports unreliable and could allow scene-layout selectors or tools to target an inactive panel.

Reproduction: enter Town, then Power Wash, then `?qa=reference-overlay` Fishing; inspect elements carrying `data-scene-layout-surface`. Expected: only the current scene and global surfaces own current-scene metadata. Actual: inactive Town and Power Wash HUD nodes retain old ownership.

Required repair: clear scene-specific layout ownership and applied metadata during scene shutdown or before applying the next scene layout. Add a transition-cycle browser test.

### SLC-R009 — Pass, limited scope — Migrated replacement isolation works

**Passed for the migrated pilot/runtime only.** Controlled fixtures used source canvases of `32×32`, `512×256`, and `128×128`, authored origins of `(0,0)`, `(0.25,0.75)`, and `(1,1)`, and asymmetric opaque bounds. In all valid runtime cases:

- the logical position remained `(640,360)`;
- the layout-owned display origin remained deterministic;
- collision, navigation, and interaction geometry remained byte-identical;
- changing a layout visual origin changed only the display object;
- changing source dimensions without updating the asset contract was rejected;
- excessive transparent padding was rejected by the pixel validator.

This proves the architecture can enforce presentation-only replacement where it is actually used. It does not establish the same safety for the sixteen surface-only scenes.

## Runtime coverage

All runtime checks used browser emulation, not physical devices.

| Scene/category | Viewport | Result |
| --- | --- | --- |
| Town / world | 1280×720 | Loaded, correct scene marker, no viewport overflow |
| House Interior / interior | 1024×768 | Loaded and interactive surface visible; no viewport overflow |
| Village Grocer / shop | 844×390 | Loaded, product shop visible; no viewport overflow |
| Corner Café / restaurant | 844×390 | Loaded with entry modal; no viewport overflow |
| Lawn Care / cleanup | 568×320 | Full board visible; no viewport overflow |
| Playground Power Wash / action | 1024×768 | Game and wash canvas loaded; no viewport overflow |
| Fishing / object-layout pilot | 1280×720 | Reference Overlay loaded and aligned; no viewport overflow |

Fishing was reloaded three times. Each cycle retained exactly one Phaser game canvas, one reference overlay, and one current Fishing HUD surface. No console errors or warnings were recorded in the final Fishing check.

## Verification results

| Check | Result |
| --- | --- |
| Targeted scene-layout, re-audit, asset-contract, and asset-pipeline tests | **PASS — 31/31** |
| Complete automated suite | **PASS — 747/747** |
| Production build | **PASS — 196 modules transformed** |
| Post-build asset contracts | PASS |
| Post-build scale profiles | PASS — five profiles |
| Post-build visual baselines | PASS — 10 images, 6 families, 5 profiles |
| Production bundle digest | `fnv1a32:e423d160` |

The green suite proves no regression from this read-only-first audit and validates the existing pilot. It does not override the coverage findings because the current validators accept surface-only scene entries by design.

## Required remediation order

1. Correct coverage reporting so surface boundaries cannot be presented as object-level migration.
2. Separate Town houses/buildings/terrain visual placement from collision, navigation, interaction, and logical world data.
3. Migrate one representative shop/interior and add protected-geometry tests.
4. Extract the shared restaurant presentation into versioned semantic layouts with venue variants.
5. Define visual shells and explicit gameplay-derived exceptions for each cleanup minigame.
6. Finish and document the Fishing pilot's remaining literals.
7. Clean stale DOM surface ownership on scene transition.
8. Classify and centralize global responsive UI rules without moving gameplay boards.
9. Re-run this independent audit. Approval requires every important scene either to have object-level coverage or a reviewed, testable exception inventory, with replacement-isolation proof for each principal scene family.

## Audit changes

This audit intentionally did not alter production gameplay or presentation. It added only:

- `scripts/re-audit-scene-layout-coverage.mjs`
- `tests/scene-layout-coverage-reaudit.test.js`
- `docs/qa/visual-readiness/scene-layout-coverage-reaudit/EVIDENCE.json`
- this report and the coverage matrix

No save schema, progression, economy, coordinates, collisions, navigation, interactions, or production assets were changed.
