# KindWorks Asset-Pipeline Repair Report

Date: 2026-08-30  
Authoritative defect source: REPORT.md in this directory  
Scope: runtime asset contracts, loading, validation, lifecycle, compatibility and current file-backed consumers  
Gameplay/save contract: unchanged; schema remains 37

## Result

All twelve confirmed asset-pipeline findings were reproduced or traced before repair. The repaired system validates the real repository bytes before production, executes scene packs, centrally resolves every currently used gameplay image, and has permanent negative tests for the failed audit cases.

Procedural drawings remain procedural until approved artwork exists. They do not contain file references to migrate and were deliberately not mass-rewritten.

## Finding disposition

| Finding | Status | Correction and evidence |
|---|---|---|
| KW-APA-001 | **FIXED** | All seven current gameplay file loads are manifest-controlled: animal sheet, Fishing, and five Power Wash files. Source tests reject direct asset paths, direct Phaser loaders, and native Image construction in their consumers. Future procedural families remain a documented production-wave backlog, not unregistered file loads. |
| KW-APA-002 | **FIXED** | Runtime validation now rejects unsupported/byte-mismatched formats, corrupt images, dimensions, alpha, sheet grids, missing frames, incompatible replacement bounds, budgets, and maximum dimensions. |
| KW-APA-003 | **FIXED** | Build-time duplicate texture/native/audio/atlas and animation keys fail. Runtime cache ownership also rejects an existing key with a different semantic ID or fingerprint. |
| KW-APA-004 | **FIXED** | The build inspector walks every path component using exact filesystem case. The former wrong-case Fishing reproduction now returns path-case-mismatch. |
| KW-APA-005 | **FIXED** | queueScenePacks and loadNativeScenePacks execute every pack belonging to a scene. Boot, Fishing and Power Wash use those contracts. |
| KW-APA-006 | **FIXED** | Every asset declares required, optional, or gameplay-critical policy. Missing optional files warn; required/critical files fail validation; critical Canvas failures reject loading. |
| KW-APA-007 | **FIXED** | Production fallback is now a visible neutral missing-asset marker, never a transparent 2×2 concealment. Structured diagnostics remain available. Critical masks throw rather than silently substitute. |
| KW-APA-008 | **FIXED** | Assets declare shared/scene ownership. Scene assets are retained once, reference-counted, and removed only on final scene release; shared assets remain intentionally resident. |
| KW-APA-009 | **FIXED** | The validator reports orphan physical files, missing declarations, unused entries, and duplicate content. Current result: no orphan files, no unused entries; one intentional Fishing comparison duplicate warning. |
| KW-APA-010 | **FIXED** | URLs include the manifest content version/fingerprint, including non-root base URLs. Replacement invalidates device/CDN caches without changing scene code. |
| KW-APA-011 | **FIXED** | One registry handles Phaser images, sheets, atlases, audio, Canvas native images, DOM URLs, generated texture keys, and animations. Atlas data/frame checks and matching loader tests are included. |
| KW-APA-012 | **FIXED** | Both public sidecar manifests now identify themselves as provenance-only and point to the runtime source of truth. |

## Direct-reference migration

- BootScene executes the Boot asset pack instead of loading the animal sheet directly.
- AnimalCharacter, PawsWondersScene, HouseInteriorScene, and the DOM animal panel resolve the sheet using its semantic ID.
- PlayerCharacter resolves generated frames and animations from registry definitions.
- FishingScene executes its scene pack.
- PlaygroundPowerwashScene receives all five native images from its scene pack, with dimension checks before renderer use.

The compatibility aliases remain tested during incremental migration. No file was moved, renamed, discarded, or overwritten.

## Permanent regression evidence

tests/asset-pipeline-repair.test.js covers real-file inspection; requiredness; duplicate IDs and cache keys; wrong case; corrupt files; technical contracts; atlas/audio; scene-pack execution; lifecycle; Canvas loading; orphan/unused/duplicate reporting; direct-reference prevention; and save-state non-mutation.

The existing Phase 2/3/6 and animal fidelity tests were updated only where they had asserted the superseded direct-loader implementation.

## Final verification

| Gate | Result |
|---|---|
| Focused asset-pipeline and Phase 8A tests | **PASS — 20/20** |
| Complete automated suite | **PASS — 728/728** |
| Minigame HTML parity | **PASS — 14 games, 75 comparisons, 105,795 generated level instances** |
| Differential HTML parity | **PASS — 13 activities, 5,850 levels, 19 shared domains, 85 exact rules** |
| Visual-registry physical-file validator | **PASS — 15 assets, seven files, zero orphan files, zero unused entries** |
| Production build and post-build gates | **PASS — 193 modules; performance, production-surface, registry, layout, scale, artwork, Phase 8A, Phase 10 structure, and stored visual baselines** |
| Performance budget | **PASS — 3,087,489-byte initial application; 1,374,829-byte Phaser engine; 19 non-entry chunks; 4,853,950 total JavaScript bytes** |
| Browser visual regression | **PASS — all ten stored scenarios across 568×320, 844×390, 1024×768, 1280×720, and 1366×768; correct scene/orientation, no page overflow, no warning/error logs** |
| Production-browser smoke | **PASS — TownScene loaded at 1280×720; no development markers, page overflow, warnings, or errors** |
| Save/gameplay compatibility | **PASS — schema remains 37; protected save digest, rewards, progression, and complete parity suites unchanged** |
| JavaScript syntax | **PASS — repaired runtime registry, deep validator, runtime validator, filesystem validator, and build script** |
| Type checking | **NOT CONFIGURED — repository contains no TypeScript configuration or type-check script** |
| Linting | **NOT CONFIGURED — repository contains no ESLint configuration or lint script** |

The baseline images themselves were not replaced. After visual review, only the tracked visual-source fingerprint and review note were advanced to cover the repaired source files.

The validator emits one non-failing duplicate-content warning because the approved Fishing runtime image and its protected legacy-reference copy intentionally have identical bytes. Both paths remain declared and neither was deleted.

## Files changed by this repair

- `src/visual/contracts.js`
- `src/visual/visualManifest.js`
- `src/visual/validateVisualManifest.js`
- `src/visual/validateVisualManifestRuntime.js`
- `src/visual/VisualRegistry.js`
- `src/visual/prefabs/townBinPrefabs.js`
- `src/visual/verticalSlice/phase8aRuntimeBuilder.js`
- `src/visual/README.md`
- `scripts/lib/runtimeAssetValidation.mjs`
- `scripts/validate-visual-registry.mjs`
- `src/scenes/BootScene.js`
- `src/scenes/FishingScene.js`
- `src/scenes/PlaygroundPowerwashScene.js`
- `src/scenes/PawsWondersScene.js`
- `src/scenes/HouseInteriorScene.js`
- `src/entities/AnimalCharacter.js`
- `src/entities/PlayerCharacter.js`
- `src/ui/AnimalFriendsController.js`
- `src/main.js`
- `src/data/animals.js`
- `public/assets/powerwash/manifest.json`
- `public/assets/legacy-reference/manifest.json`
- `vite.config.js`
- `tests/asset-pipeline-repair.test.js`
- `tests/animal-visual-fidelity.test.js`
- `tests/visual-readiness-phase-2.test.js`
- `tests/visual-readiness-phase-3.test.js`
- `tests/visual-readiness-phase-6.test.js`
- `tests/visual-readiness-phase-8a.test.js`
- `docs/qa/visual-readiness/phase-01/BASELINE_MANIFEST.json`
- `docs/qa/visual-readiness/asset-pipeline-architecture-audit/REPAIR_REPORT.md`

## Remaining risks

- Physical-device GPU memory behavior still requires later device testing as the 74 planned art families receive real artwork.
- Atlas/audio support is contract- and test-proven but the current game has no production atlas or audio file.
- The legacy bridge intentionally passes unknown keys until each procedural family receives approved production art. This is documented technical debt, not an unvalidated file path.
- The protected legacy Fishing reference intentionally duplicates the approved runtime bytes and remains a documented provenance copy.
