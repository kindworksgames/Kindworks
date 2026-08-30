# KindWorks Stage 7 Independent Device and Performance Retest

Date: 2026-08-30  
Branch: `phase-2-ui-simplification`  
Retest type: independent post-repair verification against development and production builds

## Verdict

**STAGE 7 NOT APPROVED — serious production performance risk remains.**

The supported viewport matrix is functionally sound in browser emulation: gameplay canvases remain contained, input mapping stays aligned with the scaled canvases, required mini-game controls remain reachable, orientation gates work, pixel smoothing is disabled, and repeated scene transitions do not retain scenes, timers or particles.

Stage 7 cannot be approved because the production Town p95 frame-time target still fails in all three normal runs and the synthetic 4× CPU profile averages 46.37 ms per frame (about 21.6 FPS). Physical-device low-end performance, safe-area and long-session certification also remain absent.

## Independent method

- Rebuilt the production package from the current working tree.
- Reran the seven-profile browser matrix from a fresh audit process.
- Reran all 10 immutable visual comparisons without replacing baselines.
- Operated the production build in the in-app browser at phone and tablet sizes.
- Completed the production first-session flow through town naming, resident appearance, hobbies and house design on the 568×320 profile.
- Opened and operated the production Town menu and Willowmere Shop.
- Tested production scaling/input mapping at 568×320, 667×375, 844×390, 960×600, 1024×768 and 1180×820.
- Reran 21 scene transitions plus the audit soak.
- Ran an uncontended production Town benchmark: three independent 30-second samples normally and three at synthetic 4× CPU after five-second warm-ups.
- Reran focused geometry, responsive and visual-comparison regression tests.

Browser emulation is explicitly not physical-device certification.

## Device matrix

The automated matrix opened Town, House Interior, Lawn Care, Corner Café and Playground Power Wash at every profile.

| Profile | Canvas/playfield | Required controls | Input mapping | Runtime/resources | Result |
| --- | --- | --- | --- | --- | --- |
| 568×320 small phone | Contained | No audited gameplay control outside viewport or below 44×44 | Exact audit mapping: 640×360; Power Wash 768×512 | No errors | **PASS WITH FINDINGS** |
| 667×375 standard phone | Contained | Same | Exact | No errors | **FAIL — performance** |
| 844×390 wide phone | Contained and letterboxed | Same | Exact | No errors | **PASS WITH FINDINGS** |
| 960×600 small tablet | Contained | Same | Exact | No errors | **PASS WITH FINDINGS** |
| 1024×768 4:3 tablet | Contained; 96 px vertical letterbox | Same | Exact | No errors | **PASS WITH FINDINGS** |
| 1180×820 large tablet | Contained and centred | Same | Exact | No errors | **PASS WITH FINDINGS** |
| 1366×768 desktop QA | Contained | Same | Exact | No errors | **PASS WITH FINDINGS** |

Across the 35 representative scene/profile combinations:

- zero uncontained canvases or playfields;
- zero audited gameplay controls outside the viewport;
- zero audited gameplay controls below 44×44;
- zero application, page or failed-resource errors;
- every canvas used `image-rendering: pixelated`;
- every tested canvas centre mapped to its logical centre.

## Critical production flows

### First session

At 568×320, the production build completed:

1. town naming;
2. appearance selection;
3. hobby selection;
4. house design;
5. resident/home creation;
6. return to the active Town tutorial.

The multi-step resident card is taller than the phone viewport, but it has a working touch scrollport. The Back/Next controls were initially below the visible fold and became reachable by an actual touch-scroll gesture. Validation correctly blocked progression when the resident name was empty.

### Town, menu and shop

- Town HUD remained inside the safe viewport at phone/tablet profiles.
- Town Menu opened, paused the Town and exposed all intended primary destinations.
- Willowmere Shop opened in the production build and remained contained at 568×320 and 1024×768.
- The phone shop uses a vertically scrollable category rail; Decorations and Furniture were initially below the fold but became visible and actionable after a touch-scroll.
- Shop search/sort and some category controls are below the preferred 44 px touch height at some profiles. This did not block the tested flow, but remains a medium usability defect.

## Scaling, input and pixel presentation

- Phaser remains configured at the canonical 1280×720 logical surface with FIT scaling.
- Production centre mapping deviations observed during manual inspection were at most 0.63 logical pixels and resulted from fractional CSS canvas dimensions; no actionable pointer offset was observed.
- `image-rendering: pixelated`, Phaser pixel-art mode and rounded camera pixels are active in development and production.
- All required profiles use fractional scale factors. Smoothing is disabled, but uneven physical pixel columns remain possible on real displays. This is a visual-quality/device-review risk, not evidence that input or gameplay geometry moved.
- The deterministic comparison suite passed 10/10 across Town, interior, shop, restaurant, Lawn Care and Power Wash. Baselines were not modified.

## Performance

Final uncontended production measurement, 667×375 at DPR 2:

| Profile | Aggregate mean | Worst-run p95 | Approx. mean FPS | Target result |
| --- | ---: | ---: | ---: | --- |
| Normal | 21.36 ms | 34.00 ms | 46.8 | Mean **PASS**; every-run p95 **FAIL** |
| Synthetic 4× CPU | 46.37 ms | 64.90 ms | 21.6 | **FAIL** |

Normal independent runs:

- 20.32 ms mean / 33.40 ms p95;
- 21.65 ms mean / 33.50 ms p95;
- 22.21 ms mean / 34.00 ms p95.

Synthetic 4× CPU runs:

- 46.69 ms mean / 64.90 ms p95;
- 46.02 ms mean / 52.10 ms p95;
- 46.39 ms mean / 64.80 ms p95.

No console error or failed resource occurred in any production sample. The mean is substantially improved from the original audit, but the documented `p95 <= 33.34 ms in every normal run` gate is not met. The constrained result is also below the required 30 FPS mean.

## Memory and cleanup

- Twenty-one repeated transitions ended in one intended Fishing scene with nine children, zero scene timers and zero particles.
- Post-transition Fishing: 16.62 ms mean / 18.60 ms p95, no frame above 33.34 ms.
- Fifteen-second post-stress soak used heap: 129,817,148 → 128,248,472 bytes, a decrease of about 1.50 MiB.
- Scene, texture, canvas, timer and particle counts remained stable during the soak.
- Fishing background was requested three times across three entries. No retained-texture leak was observed, but repeat delivery remains a low-severity efficiency issue.
- A 30–60 minute physical-device soak and OS memory-pressure recovery remain untested.

## Findings

### S7-001 — Town constrained performance remains below release target

- **Severity:** High
- **Status:** Confirmed
- **Evidence:** synthetic 4× CPU mean 46.37 ms (about 21.6 FPS), p95 up to 64.90 ms.
- **Impact:** likely jank on lower-end or thermally constrained hardware.
- **Required before approval:** renderer/draw-call profiling and a physical minimum-device run sustaining the agreed frame target without removing gameplay or required visuals.

### S7-002 — Normal Town tail latency still misses the gate

- **Severity:** High
- **Status:** Confirmed
- **Evidence:** all three normal production p95 values exceed the exact 33.34 ms gate; worst run is 34.00 ms.
- **Impact:** regular missed 30 FPS frame deadlines despite a healthy average.
- **Required before approval:** reduce remaining static-vector/draw overhead and verify three fresh production samples with every-run p95 at or below the existing threshold.

### S7-003 — Some production shop controls are below preferred mobile touch size

- **Severity:** Medium
- **Status:** Confirmed manually in production
- **Affected:** phone search/sort controls and some category controls at the 960×600 layout.
- **Impact:** usable in testing, but less reliable for fingers and not covered by the gameplay-control-only automated selector.
- **Required:** extend the automated touch-target audit to shop inputs/tabs and make effective targets at least 44×44 without reducing the shop's playable/product area.

### S7-004 — Essential House/Café text remains very small

- **Severity:** Medium
- **Status:** Confirmed by the fresh matrix
- **Evidence:** House Interior has eight 8 px text items at 568×320 and 667×375; Café retains 9 px text.
- **Impact:** readability/accessibility risk on phones.

### S7-005 — Physical device certification remains blocked

- **Severity:** Medium release risk
- **Status:** Untested, not a confirmed code defect
- **Required:** notched iPhone, older iPhone/home indicator, Android cut-out phone and 4:3 tablet; real pinch/multi-touch, background/resume, thermal soak and memory pressure.

### S7-006 — Fractional scaling needs art-direction review on devices

- **Severity:** Low observation
- **Status:** Confirmed architecture characteristic
- **Evidence:** all requested viewports produce fractional FIT scale factors.
- **Impact:** pixel smoothing is disabled, but uneven pixel widths can occur. Input mapping and logical geometry remained correct.

## Verification results

| Verification | Result |
| --- | --- |
| Production build and post-build validators | **PASS** |
| Seven-profile responsive matrix | **PASS functionally** |
| Orientation cases | **PASS — 3/3** |
| Visual comparison | **PASS — 10/10**, baselines unchanged |
| Focused post-repair tests | **PASS — 22/22** |
| Production first-session flow at 568×320 | **PASS** |
| Production Town/Menu/Shop phone-tablet flow | **PASS WITH TOUCH-SIZE FINDING** |
| Input mapping | **PASS** |
| Transition/short-soak cleanup | **PASS** |
| Production runtime/resource errors | **PASS — none** |
| Normal production mean target | **PASS** |
| Normal production every-run p95 target | **FAIL** |
| Synthetic constrained performance | **FAIL** |
| Physical-device certification | **BLOCKED / NOT TESTED** |

## Evidence

- `artifacts/visual-readiness-mobile-audit/RESULT.json`
- `artifacts/visual-readiness-mobile-audit/PRODUCTION_TOWN.json`
- `artifacts/visual-readiness-mobile-audit/screenshots/`
- `artifacts/visual-regression/SUMMARY.json`

## Approval gate

Stage 7 may be approved only after `S7-001` and `S7-002` pass their existing production gates and the result is confirmed on the agreed physical minimum device. The responsive and interaction matrix does not currently contain a critical functional blocker, but that does not override the unresolved high-severity performance result.

