# Phase 7 — Asset Lab and Visual QA Tools

Date: 2026-08-30  
Branch: `phase-2-ui-simplification`  
Starting commit: `3387bcb48964c41edbdc26f4257d2990fcdaf8d5`

## Verdict

**PHASE 7 PASS.**

KindWorks now has a development-only Asset Lab backed directly by the production semantic registry, plus normal-scene visual QA overlays. No separate asset list was introduced. No gameplay, save, economy, progression, coordinate, level, input or completion contract changed.

## What was implemented

- Registry-derived asset catalogue, facets and inspection coverage.
- Search by semantic ID and filename.
- Category, scene, tag, status and asset-family filters.
- Neutral, grass, road, interior, water, light and dark preview backgrounds.
- Native-frame/native-image and intended logical gameplay-size modes.
- Calibration NPC, 100-unit ruler and selectable supported viewport frames.
- State, variant, animation and facing selectors.
- Pause/play, frame stepping and 0.25×–2× playback.
- Layer isolation and shadow toggle.
- Origin, ground contact, sockets, visual bounds, collision, navigation, interaction and touch overlays.
- Registry-declared previous/current comparison; Fishing is the current comparison proof.
- Development warning surface for registry, runtime and lab loading failures.
- PNG game-canvas screenshot and manifest-wide contact-sheet export.
- Scene QA toggles for semantic identities, depth, input/touch, collision/navigation, NPC paths/stations, safe areas, camera bounds, fallbacks, reference overlay and responsive profile.
- Explicit production-surface rejection markers for both tools.

The Asset Lab has a small adapter for assets whose real runtime target is Canvas rather than Phaser. It loads those file assets under lab-only preview keys. It does not change their manifest/runtime keys or production loading path.

## Runtime proof

The live Asset Lab reported 15 registry assets and no uninspectable entries. Browser control selected every asset and every available state, variant, animation, facing and layer option: **70 runtime inspections across 15 assets, with zero warnings**.

Representative operation:

| Profile | Route | Result |
| --- | --- | --- |
| 568×320 narrow phone | `?qa=asset-lab` | Ready; panel scrollable; no page overflow; canvas remained visible |
| 844×390 modern phone | `?qa=scene-visual` | Town ready; six migrated semantic objects exposed; zero fallback warnings |
| 1024×768 tablet | `?qa=asset-lab` | Previous/current Fishing comparison visible side-by-side; no overflow |
| 1280×720 reference | `?qa=asset-lab` | All filters and geometry controls available; Canvas-target Power Wash master loaded with zero console errors |

The normal-scene overlay identified the closest responsive profile, safe area, camera bounds and six currently migrated Town semantic instances. Unmigrated legacy objects remain visibly untagged rather than receiving fabricated IDs.

Exports produced:

- [Native asset capture](evidence/asset-lab-character-native-1280x720.png)
- [Registry contact sheet](evidence/asset-lab-contact-sheet.png)

The browser recorded a 16,380-byte screenshot PNG and a 135,620-byte contact sheet PNG. The final fresh Asset Lab and scene-QA sessions had no console warning or error.

## Acceptance gate

| Requirement | Proof | Result |
| --- | --- | --- |
| Every registered pilot asset inspectable without gameplay | Runtime loop selected all 15 manifest assets; no gameplay navigation | PASS |
| Every registered state and variant inspectable | Registry-derived selectors exercised all available options | PASS |
| Every registered direction and animation inspectable | Four resident facings and four registered walk animations exercised | PASS |
| Every registered layer inspectable | Layer selector derives all prefab layer IDs; runtime loop exercised each | PASS |
| Same source definitions as game | Catalogue consumes `visualRegistry.manifest`; source contains no semantic asset-ID list | PASS |
| Previous/current comparison | Fishing comparison sources come from registry metadata and render side-by-side | PASS |
| Missing/invalid warning | Registry failures plus lab load errors are surfaced per asset | PASS |
| Screenshot/contact-sheet export | Both exports created non-empty PNGs | PASS |
| Normal-scene QA toggles | Town runtime panel operated at 844×390 | PASS |
| Production excludes tools | Production remained 196 modules/19 lazy chunks; 30 forbidden development markers absent | PASS |
| Gameplay and saves unchanged | Protected schema-37 digest and full regression/parity suite pass | PASS |

## Verification

| Check | Result |
| --- | --- |
| Phase 2–7 focused tests | PASS — 37/37 |
| Complete automated suite | PASS — 701/701 |
| Registry-derived runtime inspection | PASS — 15 assets, 70 selections, zero warnings |
| Asset Lab exports | PASS — screenshot and contact sheet non-empty |
| Visual registry | PASS — 15 assets, 7 files, 6 prefabs, 4 animations, 4 packs |
| Scene layouts | PASS — 1 pilot, 12 instances, 6 zones |
| Scale system | PASS — 1280×720, 5 profiles, 10 specimens |
| Artwork pipeline | PASS — valid sample accepted, 6 invalid fixtures rejected |
| Production build | PASS — 196 modules, 19 lazy chunks |
| Production surface | PASS — 30 development-only markers absent |
| Performance budget | PASS — initial 3,078,966 B; Phaser 1,374,829 B; total JS 4,851,687 B |
| Visual comparison | PASS — 844×390 Town runtime visually identical to approved baseline; fingerprint reviewed |

## Remaining scope and risks

- The lab can only inspect assets that have entered the semantic registry. The remaining legacy raw assets are deliberately not mirrored in a second hand-written list; they will appear automatically as later families migrate.
- Previous/current comparison is available where the asset definition declares a previous source. Fishing is the current proof asset.
- NPC paths and station targets render when a scene object publishes those runtime metadata fields; remaining legacy NPC objects will gain richer overlays during their semantic migration.
- Browser responsive testing is viewport emulation, not physical-device testing.
- The pre-existing extended Town clone-memory risk remains unchanged and outside this visual-tooling phase.

## Phase 7 files

- `src/visual/dev/assetLabCatalog.js`
- `src/visual/dev/AssetLabScene.js`
- `src/visual/dev/SceneQaOverlayController.js`
- `src/visual/visualManifest.js`
- `src/main.js`
- `scripts/verify-production-surface.mjs`
- `tests/visual-readiness-phase-7.test.js`
- `docs/qa/visual-readiness/phase-01/BASELINE_MANIFEST.json`
- `docs/qa/visual-readiness/phase-07/`
- `docs/qa/visual-readiness/README.md`

Pre-existing dirty-worktree changes were preserved. No commit or push was performed.
