# KindWorks Visual Readiness

This folder contains evidence and decisions for the incremental visual-readiness refactor. It is intentionally separate from the functional pre-visual QA series in `docs/qa/pre-visual-refactor/`.

## Status

> Gameplay-geometry isolation audit (2026-08-30): **FAIL**. Texture/frame dimensions are not read by core gameplay and the Fishing pilot is safely isolated, but NPC navigation, five ground-animal routes, animal alpha gating, house collision scaling, and three shop-interior geometry models still couple gameplay to presentation or omit required obstacle checks. See `gameplay-geometry-isolation-audit/REPORT.md`, `COVERAGE_MATRIX.md`, and `EVIDENCE.json`.

> Independent scene-layout coverage re-audit (2026-08-30): **STAGE 3 NOT APPROVED**. The migrated Fishing pilot preserves protected geometry, but only 1 of 17 important player-visible scenes has object-level layout data; important Town, interior, shop, restaurant, and cleanup placement remains embedded in production code. See `scene-layout-coverage-reaudit/REPORT.md`, `SCENE_CATEGORY_COVERAGE_MATRIX.md`, and `EVIDENCE.json`. This supersedes the earlier architecture-repair readiness claim for full scene-layout coverage.

> Scene-layout architecture audit history (2026-08-30): the original audit found a **FAIL / REPAIR REQUIRED** baseline and its initial repair established a valid incremental runtime foundation. See `scene-layout-architecture-audit/REPORT.md` and `scene-layout-architecture-audit/REPAIR_REPORT.md`.

> Independent asset-contract Stage 2 retest (2026-08-30): **NOT COMPLETE**. The existing project gates pass, but the adversarial 165-case suite found validator false negatives and one false positive. See `asset-contract-stage-2-independent-retest/REPORT.md` and `EVIDENCE.json`. This finding supersedes earlier asset-contract enforcement completion claims until repaired and independently rerun.

| Phase | Purpose | Status |
| --- | --- | --- |
| 0 | Repository-specific visual audit and migration plan | PASS — audit complete; baseline risks documented |
| 1 | Regression safety: deterministic fixture, smoke tests and visual baselines | PASS |
| 2 | Contracts, semantic registry and legacy compatibility | PASS — one-asset proof complete |
| 3 | Visual factories and prefab renderer pilot | PASS — complete Town-bin family migrated |
| 4 | Data-driven layout and Reference Overlay Mode pilot | PASS — Fishing scene migrated and verified |
| 5 | Measured scale, depth, geometry and calibration scene | PASS — pilot and representative scene verified |
| 6 | Generator-neutral artwork production and integration | PASS — staged sample integrated; invalid fixtures rejected |
| 7 | Development Asset Lab and scene visual QA tools | PASS — all registered assets inspectable; production excluded |
| 8 | Remaining incremental renderer and replacement work | NOT STARTED |

The Phase 0 pass does **not** by itself certify full HTML/Phaser gameplay parity. Its original Stage 2 blockers were repaired during the later pre-visual QA sequence. See `phase-01/REPORT.md` for the current regression-safety gate and its explicit remaining constraints.

## Phase 0 documents

- `phase-00/REPORT.md` — executive result and evidence
- `phase-00/VISUAL_SURFACE_INVENTORY.md` — every player-visible and development surface
- `phase-00/CURRENT_ARCHITECTURE_MAP.md` — how rendering currently works
- `phase-00/RAW_ASSET_KEY_REPORT.md` — raw files, keys, generated textures and labels
- `phase-00/HARD_CODED_VISUAL_HOTSPOTS.md` — migration coupling and priority
- `phase-00/HTML_PHASER_PARITY_RISKS.md` — source-of-truth risks
- `phase-00/PROTECTED_CONTRACTS.md` — save and gameplay boundaries
- `phase-00/MIGRATION_PLAN_AND_ACCEPTANCE_TESTS.md` — repository-specific Phases 1–8

## Phase 1 documents

- `phase-01/REPORT.md` — implementation, evidence and acceptance gate
- `phase-01/PRE_EXISTING_FAILURES.md` — constraints kept separate from regressions
- `phase-01/BASELINE_MANIFEST.json` — baseline dimensions, hashes, coverage and visual-source fingerprint
- `phase-01/baselines/` — ten representative rendered baselines

## Phase 2 documents

- `phase-02/REPORT.md` — contracts, registry architecture, one-asset replacement proof, verification and remaining legacy use

## Phase 3 documents

- `phase-03/REPORT.md` — Town-bin prefab/factory pilot, exact behaviour proof, responsive screenshot review and remaining legacy use

## Phase 4 documents

- `phase-04/REPORT.md` — Fishing scene-layout pilot, Reference Overlay Mode, locked-geometry proof, responsive checks and remaining legacy use
- `phase-04/evidence/` — ordinary Fishing, overlay and layout-only movement captures

## Phase 5 documents

- `phase-05/SCALE_SYSTEM.md` — canonical resolution, measured scale, depth, occlusion, shadows, geometry, viewports and calibration route
- `phase-05/REPORT.md` — implementation, runtime evidence, acceptance proof and remaining legacy use
- `phase-05/PRE_EXISTING_FAILURES.md` — long-session risk kept separate from Phase 5 regressions
- `phase-05/evidence/` — calibration and representative Town captures

## Phase 6 documents

- `phase-06/ARTWORK_PIPELINE.md` — generator-neutral specification, staging/master/runtime flow and validation rules
- `phase-06/REPORT.md` — implementation, negative-fixture proof, runtime evidence and acceptance gate
- `phase-06/evidence/` — live Fishing and reference-overlay captures using the generated runtime pack

## Phase 7 documents

- `phase-07/ASSET_LAB_GUIDE.md` — development routes, controls, overlay colours and production safety
- `phase-07/REPORT.md` — implementation, runtime coverage, production proof and acceptance gate
- `phase-07/evidence/` — exported native preview and registry contact sheet
