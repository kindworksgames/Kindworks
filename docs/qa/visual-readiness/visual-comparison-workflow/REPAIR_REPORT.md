# Reference-comparison workflow repair report

Date: 2026-08-30  
Branch: `phase-2-ui-simplification`  
Baseline start: `3387bcb48964c41edbdc26f4257d2990fcdaf8d5`

## Result

The workflow was repaired from a checksum-only archive check into a deterministic, browser-operated visual regression system. Capture, review, comparison, and approval are now separate operations. The runtime fails closed, the comparison produces measurements and heatmaps, and baselines cannot be silently replaced.

## Original findings

| Finding | Status | Repair and evidence |
| --- | --- | --- |
| VC-001 baseline verifier did not capture the running game | FIXED | `visual:compare` launches Chromium, enters each real scene, validates its runtime descriptor, captures it, and compares decoded pixels. |
| VC-002 artwork bytes were omitted from the old fingerprint | FIXED | Live decoded-pixel comparison is authoritative; checksums remain only immutable-baseline integrity checks. |
| VC-003 unknown scenarios/wrong viewports reported ready | FIXED | Contract lookup and exact viewport validation fail closed with `unknown-capture-case` or `viewport-mismatch`. |
| VC-004 Town readiness was premature and animated | FIXED | Fixed seed, camera, fade completion, service pause, normalized NPC/animal phases and positions, scene freeze; repeated capture proved 0 changed pixels. |
| VC-005 wrong references/aspect ratios were accepted | FIXED | Scene/state-bound reference contract rejects unrelated filenames, formats, dimensions, and non-16:9 references. |
| VC-006 Difference was only a blend mode | FIXED | Absolute RGBA heatmap plus changed pixels, ratio, MAE, and maximum channel delta in browser and file comparator. |
| VC-007 limited state/category coverage | PARTIALLY FIXED | Ten deterministic cases cover six representative scene families and five supported profiles. Complete every-state coverage remains future expansion, not falsely claimed. |
| VC-008 debug UI and naming were manual | FIXED | Capture-safe development UI exclusion plus deterministic filenames and JSON evidence. |
| VC-009 approval provenance was weak | FIXED | Single-case approval requires named reviewer and candidate hash token; manifest records full provenance. |
| VC-010 broad source fingerprint created false positives | FIXED | Source fingerprint is informational; the live visual gate decides pass/fail. |
| VC-011 device/camera/state were not contracts | FIXED | Versioned case contracts include profile, viewport, scene, state, readiness, camera centre/zoom, seed, and policy. |
| VC-012 only emulated device evidence | DOCUMENTED LIMITATION | Automated evidence is Chromium emulation. Physical iOS/Android visual confirmation remains a release-device task. |

## Thresholds

No threshold was weakened. The case policy remains channel delta 8, maximum changed pixels 0.25%, and maximum MAE 0.65. Old timing-dependent baselines were replaced through the explicit reviewer/token approval path only after stable state capture and visual review.

## Demonstrated categories and profiles

- World: Town at all five profiles.
- Interior: House Interior at 1024×768.
- Shop: Village Grocer at 844×390, with the actual selected-product panel ready.
- Restaurant: Corner Café at 844×390, with the level-selection state ready.
- Cleanup: Lawn Care at 568×320.
- Special renderer: Playground Power Wash at 1024×768, after approved artwork loading completes.

Reference-mode evidence exercises Fishing overlay, side-by-side, measured difference, and wrong-reference rejection at 1280×720.

## Remaining risk

This repaired gate is representative, not exhaustive. Additional interiors, shops, popups, HUD variants, clean/dirty states, day/night states, and every minigame should be added as separate deterministic capture contracts when their approved references exist. Physical-device rendering is not proven by headless Chromium emulation.

## Verification evidence

- `visual:compare`: PASS, 10/10 cases; 0 failures; baselines unchanged during the verification run.
- Repeated deterministic capture: PASS, 0 changed pixels and MAE 0 for both the Grocer state and normalized Town state.
- `visual:reference:check`: PASS; two-panel side-by-side rendered, measured difference published (14.67% changed, MAE 3.15), unrelated Grocer reference rejected.
- Focused visual workflow tests: PASS, 7/7.
- Production build and post-build validators: PASS, including immutable baseline-contract verification and production-surface exclusion.
- Direct production-bundle search: PASS; capture globals, comparison surface, and Fishing reference contract are absent.
- Complete repository test run: 791/792 PASS. The one failure is the pre-existing gameplay-geometry isolation test for standing points overlapping declared shop obstacles (`tests/gameplay-geometry-isolation-independent-retest.test.js:208`); it is unrelated to visual comparison and was not hidden or changed in this repair.
