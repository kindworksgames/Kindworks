# Phase 4 — Fishing Data Layout and Reference Overlay Mode

Date: 2026-08-29  
Branch: `phase-2-ui-simplification`  
Starting commit: `3387bcb48964c41edbdc26f4257d2990fcdaf8d5`  
Pilot: `FishingScene` only  
Scope: layout extraction and development tooling; no gameplay, economy, progression, save or artwork redesign

## Verdict

**PHASE 4 PASS.**

Fishing is the one representative scene migrated in this phase. Its existing 1280×720 appearance and coordinates are reproduced from a versioned scene-layout definition. Fishing rules, Magnet Fishing rules, five-cast limits, target validation, reward delivery, aquarium/inventory delivery, return-to-town state and schema-37 saves remain unchanged.

The development build now has a Reference Overlay Mode for Fishing. It can load the registered reference or a supplied PNG/JPEG/WebP, fit it to the canonical viewport, change opacity, switch among live/overlay/reference/split/difference modes, select and grid-snap visual instances, display the requested geometry layers and export validated JSON. The entire editor is removed from production output.

## Assumptions and protected boundaries

- Phase 3 was read first and its acceptance gate remained PASS.
- `src/data/fishing.js` remains authoritative for playable water and catch data. The layout records the same geometry and validator tests pin exact equality.
- Visual position and gameplay geometry are deliberately separate. Editor movement can alter only `instance.visual.position`.
- Collision, navigation and interaction references marked `gameplayCritical` must also be `locked: true` or validation fails.
- This phase does not migrate Town, interiors, shops, restaurants or any other minigame.
- Browser evidence is Chromium viewport emulation, not physical-device certification.

## Repository-specific architecture

```text
fishingSceneLayout.js
  schema 1 / revision 1 / canonical 1280×720
  9 layout-prefab roles
  12 stable visual instances
  6 named zones
  9 semantic sockets
  2 entrances
  locked collision/navigation/interaction references
  safe area + responsive rules + procedural presentation values
             │
             ▼
sceneLayoutContracts.js
  validate / index / resolve / grid-snap visual move / validated export
             │
             ▼
FishingScene
  asks for water, rod grip, idle tip, magnet rest, rope start,
  dock, bridge, player station and target by semantic ID
             │
             ├──────── production: normal Fishing renderer
             │
             └──────── development only: dynamic import
                         ReferenceOverlayController
```

The procedural Fishing roles are explicitly identified as `legacy-procedural` layout prefabs. The recovered Reedbank background points to the existing central registry prefab. This is an honest compatibility boundary: Phase 4 centralizes placement without pretending every Fishing drawing has already completed the Phase 3 visual-factory migration.

## Extracted baseline

| Contract | Preserved value |
| --- | --- |
| Canonical scene | 1280×720 |
| Reedbank background | centre 640,360; 1280×720; origin 0.5/0.5; depth 1 |
| Fishing water | 120,135; 1040×405 |
| Magnet water | 32,139; 1216×338 |
| Rod grip | 334,517 |
| Idle rod tip | 825,149 |
| Magnet rope start | 114,588 |
| Resting magnet | 235,542 |
| Fishing dock | 465,500; 350×220 |
| Magnet bridge | 0,520; 1280×200 |
| Fish station | 410,610 |
| Magnet station | 155,575 |
| Safe gameplay area | 16,16; 1248×688 |

The prior local `ROOM`, `FISH_RIG`, `MAGNET_RIG` and repeated water-area reads were removed from `FishingScene`. The scene now resolves those semantic zones and sockets from the layout. Presentation-only wave, board, reed, result-offset and rig-pose values also live in the layout.

## Reference Overlay Mode

Development route: `?qa=reference-overlay`

The route uses the existing isolated Fidelity QA storage, opens Reedbank Fishing and never touches production save storage. Available controls:

- Live, overlay, reference-only, split and difference comparison modes.
- 0–100% opacity.
- Local PNG, JPEG or WebP reference input, fitted to 1280×720.
- Stable-instance selector, X/Y input, drag/nudge and 8-pixel snap.
- Grid, origins, visual bounds, ground contacts, sockets, collision references, navigation references, interaction references and safe areas.
- Validated JSON export.
- Explicit gameplay-geometry lock.

The controller is loaded by a dynamic import inside an `import.meta.env.DEV` branch. The production-surface audit now fails if `ReferenceOverlayController`, `kw-reference-overlay` or `referenceOverlayReady` appears in a production JavaScript bundle. All three were absent from the final build.

## Acceptance proof

### Object moved through layout data only

The registered Reedbank background began at 640,360. Entering 649,367 snapped its visual position to 648,368. The live rendered background moved; the water, target, sockets, collisions, navigation and interactions did not. Reset returned the inputs and the rendered background to 640,360.

The unit proof clones the layout, performs the same move and confirms a byte-identical digest for zones, sockets, collision references, navigation references and interaction references. An attempted gameplay-layer move returns `gameplay-geometry-locked`.

Evidence: [layout-only movement](evidence/fishing-layout-only-move-1280x720.jpg)

### Baseline reproduction

The ordinary Fidelity QA route was opened after extraction with the overlay module absent. Reedbank retained the full-screen reference, exact rod base/tip presentation, HUD position and cast interaction. Magnet Fishing retained the bridge, water, rope start/rest position and cast/sink sequence.

Evidence: [ordinary Fishing regression capture](evidence/fishing-regression-1280x720.jpg)

### Accurate overlay and geometry distinction

At 1280×720 the registered reference filled the canonical viewport exactly. Overlay, split and difference modes were operated. The editor drew the 8-pixel grid, safe-area frame, selected visual bounds/origin/ground contact, all semantic sockets and separately coloured locked collision/navigation/interaction rectangles.

Evidence: [reference overlay](evidence/fishing-reference-overlay-1280x720.jpg)

### Validator failures

Automated tests prove:

- a duplicate stable instance ID fails with `duplicate-layout-id`;
- a required visual origin outside the canonical viewport fails with `required-instance-out-of-bounds`;
- unknown prefab, zone, socket and gameplay-geometry references are rejected by the validator paths;
- gameplay-critical references must be locked;
- invalid data cannot be exported.

### Interactions and saves

- Normal Fishing at 568×320 accepted one touch-style Cast and changed casts from 5/5 to 4/5 while entering `casting`.
- Magnet Fishing at 844×390 accepted one touch-style Cast and changed casts from 5/5 to 4/5 while entering `casting`.
- The complete Fishing service suite passed reward-once, rollback, cancellation, aquarium/inventory delivery, save migration and reload tests.
- The protected schema-37 fixture has the same digest before and after layout resolution and movement.
- HTML/Phaser parity retained all 14 games, 75 comparisons and 105,795 generated instances; Fishing and Magnet Fishing targeting/catch/pity comparisons passed.

## Responsive evidence

Ordinary Fishing was operated at all five Phase 1 landscape profiles:

| Viewport | Canvas/HUD result | Page overflow | Interaction |
| --- | --- | --- | --- |
| 568×320 | complete canvas; HUD inside 562×314 | none | Fishing cast PASS |
| 844×390 | fitted canvas; HUD inside 838×384 | none | Magnet cast PASS |
| 1024×768 | 1024×576 fitted canvas; HUD in safe viewport | none | layout PASS |
| 1280×720 | exact canonical canvas | none | layout + overlay PASS |
| 1366×768 | 1365×768 fitted canvas | none | layout PASS |

Reference Overlay Mode was additionally inspected at 568×320 and 1280×720. On the narrow profile its fixed panel remained within the viewport and used its own vertical scrolling for the lower editor controls.

## Verification

| Check | Result |
| --- | --- |
| Phase 4 + Fishing focused tests | PASS — 28/28 |
| Complete automated suite | PASS — 678/678 |
| Scene-layout validator | PASS — 1 layout, 12 instances, 6 zones |
| Visual registry | PASS — 15 assets, 6 prefabs, 1 scene instance, 4 animations, 4 packs |
| Minigame parity | PASS — 14 games, 75 comparisons, 105,795 instances |
| Differential HTML parity | PASS — 13 activities, 5,850 levels, 19 domains, 85 exact rules |
| Production build | PASS — 192 modules, 19 lazy chunks |
| Production-surface audit | PASS — 21 development-only markers absent |
| Performance budget | PASS — initial 3,067,999 B; Phaser 1,374,829 B; total JS 4,840,720 B |
| Stored visual baselines | PASS — 10 images, 6 families, 5 profiles, 67 source files |
| Runtime console/resource smoke | PASS — no new error, warning or failed resource observed |

## Acceptance gate

| Requirement | Evidence | Result |
| --- | --- | --- |
| One object moves by layout data only | 640,360 → snapped 648,368 → reset; immutable geometry digest | PASS |
| Scene reproduces baseline | ordinary Fishing and Magnet routes reviewed; exact coordinate tests | PASS |
| Reference overlays accurately | canonical fit plus live/overlay/reference/split/difference runtime checks | PASS |
| Visual placement differs from gameplay geometry | separate `visual.position`; locked geometry collections and editor guide colours | PASS |
| Duplicate/out-of-bounds elements detected | negative validator tests and postbuild validator | PASS |
| Interactions and saves intact | live casts, 678 tests, fixture digest, parity suites | PASS |
| Tool cannot appear in production | dynamic DEV import plus 21-marker production audit | PASS |

## Remaining legacy usage

- Fishing procedural environment, angler/tool emoji, aim, rig, bobber and result are named layout-prefab roles but still render through their existing scene methods. Phase 4 centralizes their placement; it does not claim they are full semantic render-factory migrations.
- Only Fishing has a scene-layout source of truth. Other scenes retain the hard-coded hotspots listed in Phase 0.
- DOM Fishing HUD placement remains in the existing responsive CSS. The layout records the semantic Exit safe-area anchor but does not replace the global responsive shell.
- Reference Overlay Mode is intentionally a development tool; it is not a player-facing layout editor and has not been physically device-tested.
- Supplied-image input and validated export are implemented and statically/unit validated. Browser automation operated the registered protected reference; it did not select an arbitrary user desktop file through the native chooser.

## Files changed for Phase 4

- `src/visual/layouts/sceneLayoutContracts.js`
- `src/visual/layouts/fishingSceneLayout.js`
- `src/visual/dev/ReferenceOverlayController.js`
- `src/visual/index.js`
- `src/scenes/FishingScene.js`
- `src/main.js`
- `scripts/validate-scene-layouts.mjs`
- `scripts/verify-production-surface.mjs`
- `package.json`
- `tests/visual-readiness-phase-4.test.js`
- `tests/fishing-mobile-ux.test.js`
- `tests/milestone-46-differential-parity.test.js`
- `docs/qa/visual-readiness/phase-01/BASELINE_MANIFEST.json`
- `docs/qa/visual-readiness/phase-04/REPORT.md`
- `docs/qa/visual-readiness/phase-04/evidence/`
- `docs/qa/visual-readiness/README.md`

Pre-existing dirty-worktree changes were preserved. No artwork was generated, moved, renamed, deleted or overwritten. No commit or push was performed.
