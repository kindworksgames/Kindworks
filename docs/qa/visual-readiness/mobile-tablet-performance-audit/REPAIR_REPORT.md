# KindWorks Responsive and Performance Repair Report

> Independent retest update (2026-08-30): Stage 7 remains **not approved** because normal production p95 and constrained-performance gates still fail. See `INDEPENDENT_RETEST.md` for the fresh device matrix and final evidence.

Date: 2026-08-30  
Branch: `phase-2-ui-simplification`  
Source audit: `docs/qa/visual-readiness/mobile-tablet-performance-audit/REPORT.md`

## Result

**CONDITIONAL PASS — both confirmed high-severity defects were repaired materially, but low-end physical-device certification and one strict frame-tail target remain open.**

No blocker or critical defect was present in the source audit. `VR-MOB-002` is fixed and independently regression-tested. `VR-MOB-001` is substantially improved: normal production rendering now meets the mean-frame target and is more than twice as fast as the audited baseline, but the conservative worst-run p95 is 33.5 ms against the exact 33.34 ms gate. The synthetic 4× CPU profile improved by 62.8% but remains below a 30 FPS mean. It is therefore recorded as **PARTIALLY FIXED**, not falsely closed.

The changes preserve gameplay, saves, object coordinates, collision geometry and the approved visual baselines.

## Finding status

| Finding | Severity | Status | Evidence |
| --- | --- | --- | --- |
| VR-MOB-001 — Town steady rendering below mobile-safe target | High | **PARTIALLY FIXED** | Three independent 30-second production samples after five-second warm-up: 20.42 ms aggregate mean; worst-run p95 33.5 ms; no console/resource errors. Normal mean gate passes, exact p95 gate misses by 0.16 ms. Synthetic 4× CPU mean is 45.90 ms. |
| VR-MOB-002 — 16 shop standing points overlap obstacles | High | **FIXED** | Standing points are resolved from logical fixture geometry with deterministic clearance and room-bound validation. The complete geometry-isolation suite and full project suite pass. |
| VR-MOB-003 through VR-MOB-006 | Medium | **Not changed in this high-severity repair** | Formal-profile completeness, small House/Café copy, fullscreen product decision and physical-device certification remain separately documented. |
| VR-MOB-007 and VR-MOB-008 | Low | **Not changed** | Fishing reload delivery and duplicate archival/runtime content remain non-blocking observations. |

## Corrections

### Town steady-state rendering

- Replaced repeated full-save cloning in frame-time paths with domain-scoped snapshots.
- Added shallow presentation-only NPC snapshots and reused one custom-resident snapshot per frame.
- Reduced public-bin presentation refreshes to a bounded 250 ms cadence.
- Avoided rewriting unchanged NPC, animal and DOM status text.
- Converted the largest static woodland vector workload into a cached nearest-neighbour texture on applicable profiles while retaining the exact narrow-phone baseline path.
- Cached additional safe static decorative vector groups on phone/tablet profiles.
- Added presentation-only camera culling for static Town visuals on constrained profiles. Bounds inspection is isolated in the visual renderer and does not participate in collision, navigation, interactions or saving.
- Kept terrain, river and pond geometry on their established paths where caching changed visual output.
- Upgraded the production benchmark from a short probe to three independent 30-second samples for each CPU profile.

### Shop interaction standing points

- Compute every display standing point before display decoration is created.
- Resolve a candidate against explicit logical fixture obstacles and room bounds.
- Maintain 17 logical units of character clearance and an 18-unit obstacle-edge gap.
- Preserve display art, room fixtures, collision rectangles and interaction identities.

## Before and after performance

Production Vite preview, Playwright Chromium headless, 667×375, DPR 2. Current measurement uses three independent 30-second runs after a five-second warm-up. Aggregate p95 is conservatively reported as the worst individual run.

| Profile | Audited mean | Repaired mean | Improvement | Audited p95 | Repaired worst-run p95 | Approx. repaired FPS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Normal | 44.66 ms | **20.42 ms** | **54.3% less frame time** | 51.90 ms | **33.50 ms** | 49.0 |
| Synthetic 4× CPU | 123.26 ms | **45.90 ms** | **62.8% less frame time** | 135.10 ms | **65.10 ms** | 21.8 |

Target evaluation from the measurement artifact:

- mean frame time ≤33.34 ms: **PASS**;
- every normal run p95 ≤33.34 ms: **FAIL by 0.16 ms**;
- no runtime or resource errors: **PASS**.

The synthetic 4× CPU throttle is retained as an aggressive regression signal, not represented as a named physical handset. A representative low-end phone must still confirm the release threshold.

## Responsive and transition verification

The final browser audit covered 568×320, 667×375, 844×390, 960×600, 1024×768, 1180×820 and 1366×768.

Across Town, House Interior, Lawn Care, Corner Café and Playground Power Wash at all seven profiles:

- zero controls outside the viewport;
- zero player controls below 44×44 CSS pixels;
- zero uncontained canvases or playfields;
- zero console, page or failed-resource errors;
- landscape orientation gate passed for Lawn Care;
- portrait-only orientation gate passed for River Clear-Out.

Twenty-one repeated scene transitions finished with one intended active scene, nine display children, zero scene timers and zero particles. The post-transition Fishing frame result was 16.60 ms mean / 18.4 ms p95. The short post-stress soak showed a +382,312-byte used-heap delta (about 0.36 MB) with no scene, object or timer growth.

## Regression evidence

| Check | Result |
| --- | --- |
| Production build and post-build validators | **PASS** — 201 modules; production debug-surface exclusion passed |
| Complete automated suite | **PASS — 794/794** |
| Geometry isolation / Stage 9 focused tests | **PASS** |
| Immutable visual comparisons | **PASS — 10/10** across Town, interior, shop, restaurant and cleanup families |
| Seven-profile browser audit | **PASS for containment, touch target and runtime-error checks** |
| Repeated scene transitions | **PASS — 21 cycles, no retained-scene/timer/particle growth** |
| Production Town benchmark | **Mean gate PASS; exact p95 gate PARTIAL** |
| Save/gameplay contracts | **PASS through full suite; no schema or gameplay rule changed** |

The build continues to report one pre-existing exact duplicate-content warning between the protected legacy Fishing reference and the runtime Fishing background. Phase 10 production-art execution remains separately blocked because no Phase 8B artwork has been approved; neither is a regression from this repair.

## Files changed for this repair

- `src/data/interiorGeometry.js`
- `src/state/GameState.js`
- `src/systems/CustomResidentService.js`
- `src/systems/AnimalService.js`
- `src/systems/NpcTownLifeService.js`
- `src/entities/NpcCharacter.js`
- `src/entities/AnimalCharacter.js`
- `src/scenes/TownScene.js`
- `src/visual/renderers/VisualViewportCulling.js`
- `scripts/measure-production-town.mjs`
- `tests/stage-09-repair.test.js`
- `package.json`
- `docs/qa/visual-readiness/mobile-tablet-performance-audit/REPORT.md`
- this report

## Evidence files

- `artifacts/visual-readiness-mobile-audit/PRODUCTION_TOWN.json`
- `artifacts/visual-readiness-mobile-audit/RESULT.json`
- `artifacts/visual-regression/SUMMARY.json`
- `artifacts/visual-readiness-mobile-audit/screenshots/`

## Remaining release conditions

1. Profile the remaining p95 spikes and bring every normal production run to p95 ≤33.34 ms without removing gameplay or visual content.
2. Confirm the agreed minimum-device performance threshold on physical hardware; the synthetic 4× CPU result is not a substitute.
3. Complete the already-recorded physical notch, real multi-touch, background/resume, thermal and 30–60 minute soak checks.
4. Address the medium readability and formal-profile findings in their own scoped repair rather than mixing them into renderer optimization.
