# Phase 5 — Scale, Depth and Geometry System

Date: 2026-08-29  
Branch: `phase-2-ui-simplification`  
Starting commit: `3387bcb48964c41edbdc26f4257d2990fcdaf8d5`  
Scope: Town-bin pilot family and Fishing representative scene only

## Verdict

**PHASE 5 PASS.**

The scale system is based on measurements from the current Phaser configuration, Town data, generated player texture, resident entities, existing houses, roads, paths, river, lawns and pilot-bin prefabs. It does not infer gameplay geometry from replacement image dimensions and does not resize the world.

No save schema, coordinates, rewards, progression, economy, inventory, NPC, pet, level, input or completion rule was intentionally changed.

## What was implemented

- A versioned canonical 1280×720, 1-unit/1-canonical-pixel contract.
- Native-density and logical-display policies supporting reviewed 1×/2×/4× sources.
- Measured player/NPC, Town surface and object references.
- Named depth layers and ground-contact Y sorting.
- Explicit background/foreground occlusion and three shadow policies.
- Independent visual, collision, navigation, interaction and touch geometry.
- Executable supported viewports, camera-fit maths, HUD safe areas and 44 CSS-pixel minimum touch targets.
- A permanent development-only calibration scene.
- Ground-contact depth and logical-size adoption for the complete Town-bin pilot.
- Scale metadata added to Fishing without moving any Fishing zone, socket or gameplay geometry.
- A post-build scale validator.

## Runtime evidence

The calibration route reached `ScaleCalibrationScene` with `data-scale-calibration-ready=true` and no runtime warnings, errors or failed resources in the fresh browser session.

| Viewport | Phaser buffer | CSS canvas | Filtering | Overflow/usability |
| --- | ---: | ---: | --- | --- |
| 568×320 | 1280×720 | 568×319.5 | nearest + rounded | Complete fitted scene |
| 844×390 | 1280×720 | 693.333×390 | nearest + rounded | Centred, complete |
| 1024×768 | 1280×720 | 1024×576 | nearest + rounded | Centred, complete |
| 1280×720 | 1280×720 | 1280×720 | nearest + rounded | Exact canonical |
| 1366×768 | 1280×720 | 1365.333×768 | nearest + rounded | Centred, complete |

Runtime metadata reported the oversized tree source as 4096×4096 and its logical display as 87×97. The scene also reported the initial player/bin relationship as `behind`, with player depth 253.00 and bin depth 255.80 from their ground-contact values.

Evidence:

- [Canonical calibration](evidence/scale-calibration-1280x720.jpg)
- [Narrow-phone calibration](evidence/scale-calibration-568x320.jpg)
- [Tablet calibration](evidence/scale-calibration-1024x768.jpg)
- [Town regression](evidence/town-regression-1280x720.jpg)

The Town deterministic regression route returned `TownScene`, ready, at 1280×720 with no initial browser warning/error. Fishing’s protected baseline and all exact zones/sockets remained unchanged; its existing Phase 4 ordinary-Fishing evidence remains applicable. An extended Town idle later exposed a pre-existing development-browser clone-memory failure; it is separated in `PRE_EXISTING_FAILURES.md` and was not caused or repaired by this phase.

## Acceptance proof

| Gate | Proof | Result |
| --- | --- | --- |
| Oversized replacement does not expand collision | 4096 house resolves to 195×145 and byte-equal standard collision/navigation; 4096 tree resolves to 87×97 with radius-50 footprint | PASS |
| Player sorts in front and behind | Ground-order tests verify 520 is behind and 600 is in front of the bin’s ground Y 558; computed depths cross bin depth correctly; live scene reports the behind case | PASS |
| Interaction points remain correct | Pilot bin remains 56×56 interactive, footprint 28, interaction radius 76 and touch 56×56; Fishing protected zones/sockets exact | PASS |
| Pixel filtering/scaling follows rules | Phaser configuration pinned; all five live profiles report `nearest-rounded` and a 1280×720 render buffer | PASS |
| All landscape profiles usable | Five live emulated profiles fitted and remained complete | PASS |
| Gameplay unchanged | Full movement/interaction/reward/save suites, save digest and HTML parity validators pass | PASS |

## Verification

Final counts are recorded after the complete suite and production build below. Browser testing is Chromium viewport emulation, not physical-device testing.

| Check | Result |
| --- | --- |
| Phase 3–5 focused tests | PASS — 21/21 |
| Scale-system validator | PASS — 1280×720, 5 profiles, 10 specimens |
| Complete automated suite | PASS — 685/685 |
| Minigame parity | PASS — 14 games, 75 comparisons, 105,795 generated instances |
| Differential HTML parity | PASS — 13 activities, 5,850 levels, 19 domains, 85 exact rules |
| Production build | PASS — 194 modules, 19 lazy chunks |
| Production surface | PASS — 24 development-only markers absent |
| Performance budget | PASS — initial 3,077,389 B; Phaser 1,374,829 B; total JS 4,850,110 B |
| Visual baselines | PASS — 10 images, 6 families, 5 profiles, 70 source files |
| Runtime calibration/Town smoke | PASS — calibration and initial Town load clean; documented pre-existing extended-idle risk remains |

## Protected behaviour and remaining legacy use

- Only Town bins use the new prefab ground-depth implementation. Other visual families retain the Phase 0 hard-coded hotspots until their approved migration phase.
- Only Fishing records the scale profile in a data-driven scene layout. Its procedural renderer remains legacy-compatible.
- Buildings and trees are calibration fixtures, not production migrations; their current collision/navigation code remains untouched.
- Town’s existing camera zoom rules are documented and preserved, not replaced.
- Physical phone/tablet testing remains unavailable; responsive evidence is browser emulation.
- A long-running development Town tab eventually exhausted clone memory in existing per-frame snapshot diagnostics. Phase 5 did not touch that path; the issue is documented separately and remains for the appropriate performance repair scope.

## Files changed for Phase 5

- `src/visual/scale/scaleSystem.js`
- `src/visual/scale/calibrationFixtures.js`
- `src/scenes/ScaleCalibrationScene.js`
- `src/visual/prefabs/townBinPrefabs.js`
- `src/visual/renderers/PhaserPrefabRenderer.js`
- `src/visual/layouts/fishingSceneLayout.js`
- `src/visual/index.js`
- `src/main.js`
- `scripts/validate-scale-system.mjs`
- `scripts/verify-production-surface.mjs`
- `tests/visual-readiness-phase-3.test.js`
- `tests/visual-readiness-phase-5.test.js`
- `package.json`
- `docs/qa/visual-readiness/phase-05/`
- `docs/qa/visual-readiness/README.md`

Pre-existing dirty-worktree changes were preserved. No artwork was generated, moved, renamed, deleted or overwritten. No commit or push was performed.
