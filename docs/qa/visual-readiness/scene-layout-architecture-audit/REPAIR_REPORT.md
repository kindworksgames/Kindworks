# KindWorks scene-layout architecture repair report

**Repair date:** 2026-08-30  
**Repository:** `/Users/youyoulu/Documents/GitHub/Kindworks`  
**Branch:** `phase-2-ui-simplification`  
**Starting commit:** `3387bcb48964c41edbdc26f4257d2990fcdaf8d5`  
**Source defect list:** [scene-layout architecture audit](REPORT.md)

## Result

**PASS — THE CONFIRMED SCENE-LAYOUT ARCHITECTURE DEFECTS ARE REPAIRED.**

All Critical and High findings are fixed. The common schema/runtime/catalogue now provides an enforceable boundary between visual placement and gameplay geometry. Every production scene has a validated layout/surface entry, Fishing is the fully migrated instance-level pilot, and Town moving entities use shared named depth policies without changing their previous depth results.

This result does **not** claim that every one of the game's thousands of legacy drawing constants has been converted to decorative layout data. The remaining hard-coded inventory is migration debt, classified for incremental scene-by-scene work. Converting level boards, procedural animation values, collision data, navigation data, or persisted furniture coordinates merely to reduce that count would violate the gameplay-protection rules.

## Protected behaviour

- No save schema, save field, progression flag, level definition, reward, economy value, collision shape, navigation footprint, interaction zone, persistent object coordinate, or gameplay completion rule was changed.
- Visual `position` and visual-only `offset` are distinct schema fields.
- Gameplay-critical geometry remains owned by gameplay data. A layout may reference it only through an authority and verified digest.
- The common visual runtime changes Phaser display properties only; it does not write to physics bodies, input hit areas, navigation, interaction services, or saves.
- Existing legacy rendering remains available behind the compatibility boundary while scenes migrate incrementally.

## Original finding disposition

| ID | Original severity | Status | Correction and evidence |
| --- | --- | --- | --- |
| SLA-001 | Critical | **FIXED** | Locked gameplay geometry now requires `sourceOfTruth` plus `geometryDigest`; changed geometry is rejected. Canonical definitions are recursively frozen. Controlled mutation and digest probes pass. |
| SLA-002 | High | **FIXED** | The global catalogue contains 19 validated layouts covering all 18 production scenes plus Global UI surface definitions. Production scenes have stable canvas/HUD surface IDs; Fishing retains 12 instance-level entries. |
| SLA-003 | High | **FIXED** | Schema version 2 closes root and nested objects and validates position, offset, origin, scale, rotation, flips, depth, visibility, tint, alpha, bounds, animation, state, variant, parent, repeat, conditions, responsive anchors, safe areas, surfaces and geometry references. All nine former false-negative probes now reject. |
| SLA-004 | High | **FIXED** | Definitions must be deterministic JSON data; functions, `undefined`, non-finite numbers, cyclic values and non-plain objects reject. Validated clones are deeply frozen. Nested mutation now throws instead of changing canonical data. |
| SLA-005 | High | **FIXED** | One catalogue is used by runtime and build validation. It rejects duplicate layout, scene, stable instance/surface IDs and missing production-scene coverage. The build embeds and verifies the exact catalogue signature and digest. |
| SLA-006 | Medium | **FIXED** | Fishing no longer manually interprets layout fields. `SceneLayoutRuntime` consistently applies supported display properties and manages stable instance slots; family/gameplay code retains behaviour-specific logic. |
| SLA-007 | Medium | **FIXED** | Responsive anchors and safe-area targets have a validated contract. Scene and HUD DOM boundaries receive stable surface IDs and data-owned visual offset variables. Existing responsive CSS remains the compatible rendering implementation, so appearance is unchanged. |
| SLA-008 | Medium | **FIXED** | Parent references/cycles, stable repeat definitions, and serializable `all`/`any` conditions are validated. State and variant resolution is deterministic and rejects unknown choices. |
| SLA-009 | Medium | **FIXED** | Town player, NPC, animal follower, placed objects, preview objects and municipal vehicle parts now resolve depth through named catalogue policies. Tests prove representative player/NPC front/behind sorting and preserve the former numeric results. |
| SLA-010 | Medium | **FIXED** | A global Scene Layout plugin now owns start/shutdown lifecycle for every production scene. Stable slot replacement destroys the previous display object, and shutdown clears registered objects. Three live Fishing reloads retained one canvas, one overlay and the same surface IDs. |
| SLA-011 | Medium | **FIXED** | The architecture now establishes a formal projection boundary: layouts own visual transforms and surface offsets, while Town/interior gameplay and persisted furniture coordinates remain authoritative. Tests prove visual offsets do not alter collision, navigation or interaction geometry. |
| SLA-012 | Low | **FIXED** | Live responsive checks were completed at 568×320, 844×390, 1024×768, 1280×720 and 1366×768. The canvas remained centred, within the viewport and free of page overflow at each emulated profile. This remains browser emulation, not a claim of physical-device testing. |

## Required automated proofs

| Required proof | Result | Evidence |
| --- | --- | --- |
| Replacement sprite with different canvas dimensions preserves logical position | **PASS** | A 54×54 and 432×432 source resolve to the same logical position/display footprint; protected geometry is byte-identical. |
| Visual offsets do not alter collision or navigation | **PASS** | Runtime applies offsets to the display object only; collision, navigation and interaction fixture digests remain unchanged. |
| Invalid layout references fail clearly | **PASS** | Missing prefab/parent/safe area/state/variant, cycles and duplicates reject with code, layout ID, property path, expected contract and actual value. |
| Scene restart does not duplicate objects | **PASS** | Stable-slot registration replaces/destroys an old object and runtime shutdown clears all registrations; three browser reloads remain stable. |
| Depth sorting works for moving characters | **PASS** | Town player and NPC depth policies produce the expected relative order above and below representative Y positions. |
| Variants resolve deterministically | **PASS** | Explicit allowed state/variant lists resolve repeatably and invalid requests reject; executable/random conditions are prohibited. |
| Production loads the same layout as development | **PASS** | The production bundle contains the exact checked catalogue signature and digest `fnv1a32:e423d160`; live development exposes the same digest. |

## Verification executed

| Verification | Result |
| --- | --- |
| Scene-layout architecture regression tests | **PASS — 9/9** |
| Phase 4/5 layout and scale regression group | **PASS — 24/24 including the new repair tests** |
| Complete automated test suite | **PASS — 743/743** |
| Production build | **PASS — 196 modules transformed** |
| Scene-layout catalogue validator | **PASS — 19 layouts, 18 production scenes, 12 stable instances, 6 zones** |
| Production catalogue parity verifier | **PASS — exact signature and `fnv1a32:e423d160` digest** |
| Production-surface/debug exclusion checks | **PASS** |
| Visual regression baseline verifier | **PASS — 10 images, 6 scene families, 5 profiles** |
| Development Town runtime and console | **PASS — correct scene/surface/digest; no console warnings or errors** |
| Development Fishing/Reference Overlay lifecycle | **PASS — three reloads; one canvas and one overlay on every run** |
| Emulated responsive runtime profiles | **PASS — 568×320, 844×390, 1024×768, 1280×720, 1366×768** |

Machine-readable post-repair evidence is stored in [REPAIR_EVIDENCE.json](REPAIR_EVIDENCE.json).

## Files changed for this repair

- `src/visual/layouts/sceneLayoutContracts.js`
- `src/visual/layouts/fishingSceneLayout.js`
- `src/visual/layouts/sceneLayoutCatalog.js`
- `src/visual/layouts/SceneLayoutRuntime.js`
- `src/plugins/SceneLayoutPlugin.js`
- `src/main.js`
- `src/style.css`
- `src/scenes/FishingScene.js`
- `src/scenes/TownScene.js`
- `src/entities/NpcCharacter.js`
- `src/entities/AnimalCharacter.js`
- `src/entities/TownPlacedObject.js`
- `src/entities/MunicipalCollectionVehicle.js`
- `vite.config.js`
- `package.json`
- `scripts/validate-scene-layouts.mjs`
- `scripts/verify-production-scene-layouts.mjs`
- `scripts/audit-scene-layout-architecture.mjs`
- `tests/scene-layout-architecture-repair.test.js`
- `tests/phase-04-scene-layout.test.js`
- `docs/qa/visual-readiness/phase-01/BASELINE_MANIFEST.json`
- the evidence and report files in this directory

## Remaining legacy migration inventory

The repaired scanner records 7,613 visual/geometry/responsive candidates. These are not 7,613 confirmed bugs and must not be bulk-moved. They include:

- protected level, collision, navigation and persistence coordinates that must remain with gameplay;
- prefab-local visual recipes and animation/effect values;
- responsive component CSS that remains the current compatible renderer;
- procedural generated layouts that require a semantic adapter rather than static extraction;
- genuine decorative scene placements to migrate one scene family at a time.

The next safe migration step is Town's visual-only terrain and landmark layer, followed by interiors while explicitly protecting persisted furniture transforms. Each migrated surface must remove or classify its own inventory records and pass the same tests before proceeding.

## Final decision

**READY FOR INCREMENTAL SCENE-LAYOUT MIGRATION.** The repaired architecture meets this repair gate. It is not authorization for a whole-project coordinate rewrite, gameplay-geometry movement, or mass visual migration.
