# KindWorks Gameplay Geometry Isolation — Repair Report

**Repair date:** 2026-08-30  
**Branch:** `phase-2-ui-simplification`  
**Starting commit:** `3387bcb48964c41edbdc26f4257d2990fcdaf8d5`  
**Source defect list:** [REPORT.md](./REPORT.md)  
**Result:** **PASS — all seven confirmed functional findings are fixed and verified.**

This repair preserves the schema-37 save contract, level data, progression,
economy, rewards, map dimensions, authored object positions, and mini-game
difficulty. No artwork was generated or replaced.

## What changed

The repair introduces versioned logical-geometry contracts in stable world or
canonical-screen units. Visual objects may consume these contracts for
presentation, but texture dimensions, transparent padding, sprite origins,
animation frames, alpha, and display scale are no longer authoritative inputs
for the repaired gameplay areas.

The contracts explicitly cover:

- collision and navigation rectangles;
- interaction circles and dedicated touch rectangles;
- entrance triggers, standing points, and spawn points;
- camera and world boundaries;
- occlusion zones; and
- stable object IDs with schema validation and duplicate detection.

A development-only geometry overlay renders these groups in distinct colours
when the game is opened with `?qa=geometry`. It is loaded dynamically only in a
development build and toggles with `G`. The production-surface validator and a
production browser check prove that it is not shipped or exposed to players.

## Finding disposition

| Finding | Status | Root cause | Correction | Regression evidence |
| --- | --- | --- | --- | --- |
| GEO-01 | **FIXED** | `eastplaza3 → eastplazaside` crossed the Paws & Wonders navigation footprint. | Moved the authored side node to a collision-safe logical point while preserving the graph's 133 nodes and 138 links. Every outdoor link is now segment-validated at four-world-unit spacing. | Post-repair audit: `staticSegmentViolations: []`; full NPC simulation and navigation tests pass. |
| GEO-02 | **FIXED** | Placement validation and NPC routing did not share corridor geometry. | New placements are rejected within the 22-unit protected route clearance. Old saves remain valid: route planning blocks affected edges, selects an alternate graph path when available, and otherwise uses deterministic logical detour waypoints around the legacy object. Both normal and player-owned residents use the same policy. | Deterministic planter witness test, placement tests, NPC schedule/full-day simulations, save/reload tests. |
| GEO-03 | **FIXED** | Animal endpoints were repaired individually, but interpolated segments were not checked. | Ground route generation now requires complete segment clearance and uses a deterministic exhaustive fallback search. Water and aerial routes remain explicitly exempt. Protected rare-arrival endpoints remain exact. | 481/481 ground route segments pass; zero ground and water violations; all wildlife tests pass. |
| GEO-04 | **FIXED** | Town interaction read `character.alpha` during a visual fade. | Gameplay now receives semantic `interactionReady`; alpha follows presentation but is never read back to decide eligibility. | Source assertion, animal presentation tests, full animal/adoption suite. |
| GEO-05 | **FIXED** | The personal-house visual upgrade scale changed the collision rectangle. | Every house now has explicit collision, navigation, interaction, entrance, standing, and occlusion geometry independent of render scale or canvas size. | Adversarial `16×16`, `8192×4096`, padded, different-origin and 64-frame replacements leave geometry byte-equivalent. |
| GEO-06 | **FIXED** | Town shops and three shop interiors reused display rectangles for blocking and input. | Town shops, Village Grocer, Paws & Wonders, and Harbour General now consume separate visual, collision, navigation, interaction, touch, standing, spawn, trigger, camera, and occlusion definitions. Decorative display graphics are non-interactive; dedicated Phaser zones own taps. | Contract validation, static bypass checks, shop service tests, and browser selection/purchase at 568×320. |
| GEO-07 | **FIXED** | Narrow House Interior actions were 40 CSS pixels high. | The narrow-landscape action minimum is now 44 CSS pixels. | Automated CSS contract plus browser measurement: `Furnish home` is `233.9×44`, Exit is at least 44 high. |
| GEO-08 | **NOT A CONFIRMED DEFECT** | Restaurant games intentionally use direct-touch stations and a presentation-only worker. | No gameplay rule was changed. The existing direct-touch contract remains documented; station standing sockets are required only if walkable restaurant workers are approved later. | Stage remains an observation, not silently treated as repaired functionality. |

## Files changed by this repair

### Geometry and routing

- `src/data/logicalGeometry.js`
- `src/data/townGeometry.js`
- `src/data/interiorGeometry.js`
- `src/data/townPlacement.js`
- `src/data/npcTownLife.js`
- `src/data/animals.js`
- `src/state/townPlacementState.js`
- `src/systems/NavigationGraph.js`
- `src/systems/NpcTownLifeService.js`
- `src/systems/CustomResidentService.js`

### Runtime consumers and development inspection

- `src/scenes/TownScene.js`
- `src/scenes/VillageGrocerScene.js`
- `src/scenes/PawsWondersScene.js`
- `src/scenes/HarbourGeneralScene.js`
- `src/main.js`
- `src/visual/dev/GameplayGeometryDebugOverlay.js`
- `src/style.css`

### Validation, tests, and evidence

- `scripts/audit-gameplay-geometry-isolation.mjs`
- `tests/gameplay-geometry-isolation-audit.test.js`
- `tests/gameplay-geometry-repair.test.js`
- `docs/qa/visual-readiness/gameplay-geometry-isolation-audit/evidence/post-repair-audit.json`
- `docs/qa/visual-readiness/phase-01/BASELINE_MANIFEST.json`

## Automated verification

| Check | Result |
| --- | --- |
| Focused geometry/shop/NPC/animal/save suite | **PASS — 67/67** |
| Wildlife plus geometry regression after rare-route correction | **PASS — 32/32** |
| Full project suite | **PASS — 767/767**, 0 skipped, 0 failed |
| Production build | **PASS** |
| Asset contracts | **PASS — 15 categories, 74/74 production families** |
| Production-surface check | **PASS — 31 development markers absent** |
| Scene layouts | **PASS — 19 layouts covering 18 production scenes** |
| Visual-regression baselines | **PASS — 10 images, 6 families, 5 landscape profiles** |
| Whitespace/error check for repaired files | **PASS** |

The machine-readable post-repair audit records:

- 133 NPC nodes and 138 links;
- zero static NPC segment violations;
- dynamic placed-object avoidance enabled;
- 56 animal definitions and 481 sampled ground segments;
- zero ground-animal or water-route violations;
- no texture path, frame name, or other fragile visual identity in a fresh save;
- stable logical geometry contracts for Town and all three repaired interiors; and
- a `4200×2800` world/camera contract sourced from `townGeometry.js`.

## Browser-operated verification

Testing used the Codex in-app Chromium browser against local Vite development
and production previews. These are browser-emulated profiles, not physical
device tests.

| Profile / screen | Operation and evidence | Result |
| --- | --- | --- |
| 568×320 Town | Loaded `?qa=geometry`; one visible `1280×720` Phaser canvas fit to `568×319.5`; page and viewport both measured `568×320`; geometry contract was active. | **PASS**, no warning/error logs |
| 1024×768 Town | Canvas fit to `1024×576` and centred at y=96; page and viewport both measured `1024×768`. | **PASS**, no warning/error logs |
| 1024×768 Lawn Care | Opened through the isolated QA control; swipe moved the mower, changed cut progress from 7% to 29%, and consumed exactly one move. | **PASS**, no warning/error logs |
| 568×320 Lawn Care | Full board remained contained; Exit measured `44×44`; Undo and Hint measured `106×44`; no page overflow. | **PASS**, no warning/error logs |
| 568×320 Village Grocer | Product targets measured at least 44 CSS pixels; selected Greens Seeds and completed one isolated-save purchase. Balance changed 12,500 → 12,420 and ownership 0 → 1. | **PASS**, no warning/error logs |
| 568×320 House Interior | Exit measured at least 44 high and `Furnish home` measured approximately `233.9×44`; no overflow. | **PASS**, no warning/error logs |
| 844×390 production preview | Loaded a production build with `?qa=geometry`; `geometryDebug` was absent, no QA controls existed, no geometry-debug script was referenced, and page dimensions exactly matched the viewport. | **PASS**, no warning/error logs |

The isolated browser purchase changed only the dedicated development QA save.
It did not touch a normal player save.

## Compatibility and remaining risk

- Save schema and persisted fields are unchanged; geometry remains runtime/data
  configuration only.
- Existing authored coordinates and level layouts are unchanged except the one
  invalid NPC navigation node, which moved eight world units left/up to keep the
  original route outside Paws & Wonders.
- Existing legacy placed objects are not deleted or relocated. Deterministic
  detours protect those saves; new route-blocking placements are rejected.
- Automated and browser-emulated coverage is strong, but physical iOS/Android
  touch testing remains a release-device task.
- The build continues to report the already documented identical Fishing image
  bytes under legacy and runtime paths. This is an informational, pre-existing
  asset-pipeline notice and not a geometry regression.
- Phase 8B production artwork is still absent by design. The Phase 10 validator's
  production-art execution message remains unrelated to this repair.

## Final verdict

**READY FOR THE NEXT VISUAL-READINESS QA STAGE.** All confirmed P2 and P3
geometry-isolation findings are repaired, the complete regression suite and
production build pass, and replacement artwork can no longer alter the repaired
collisions, navigation, interactions, triggers, touch targets, or saved
progress through texture dimensions or presentation state.
