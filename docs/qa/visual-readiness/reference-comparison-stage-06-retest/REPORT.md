# Stage 6 Independent Reference-Comparison Retest

**Date:** 2026-08-30  
**Branch:** `phase-2-ui-simplification`  
**Verdict:** **STAGE 6 PASS**

## Decision

The repaired reference-image and visual-regression comparison workflow is approved for Stage 6. It detected every controlled visual displacement, returned to the accepted baseline after every restoration, and produced no repeat-to-repeat pixel noise in the tested deterministic states.

This was an independent adversarial retest. The repair summary was not used as evidence. The running game, capture contracts, approved baseline manifest, comparator, browser runtime, and production build were inspected and exercised directly.

## Test method

For each representative case, the retest:

1. Opened the capture route in three independent Playwright Chromium browser contexts.
2. Used the contract viewport, locale, timezone, device scale, reduced-motion setting, fixture, seed, scene, and readiness assertion.
3. Compared all three captures with the approved baseline using the unchanged production policy.
4. Compared repeat 2 and repeat 3 with repeat 1 using a zero-tolerance policy.
5. Opened a separate clean context and captured a pristine image.
6. Applied a controlled `translateX(12px)` displacement to a visible scene surface.
7. Confirmed that the normal comparison policy rejected the displaced image.
8. Restored the exact previous inline transform.
9. Confirmed that the restored image was pixel-identical to the cycle's pristine image and accepted against the approved baseline.
10. Re-hashed the baseline manifest and all ten approved images to prove that the test did not alter them.

The normal comparison limits were not weakened:

- Per-channel noise threshold: `8`
- Maximum changed-pixel ratio: `0.25%`
- Maximum mean absolute error: `0.65`
- Repeat/restoration verification: zero changed pixels and zero mean absolute error

## Coverage and measured evidence

| Case | Coverage | Viewport | Independent repeats | Repeat noise | Controlled displacement | Displacement MAE | Exact restoration |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Town | Town, mobile | 568×320 | 3 | 0 pixels | 58.1850% changed | 17.2840 | 0 pixels changed |
| Town | Town, tablet | 1024×768 | 3 | 0 pixels | 28.4007% changed | 8.7955 | 0 pixels changed |
| House Interior | Interior, tablet | 1024×768 | 3 | 0 pixels | 7.8804% changed | 2.6227 | 0 pixels changed |
| Lawn Care | Mini-game, mobile | 568×320 | 3 | 0 pixels | 29.8905% changed | 5.1436 | 0 pixels changed |
| Playground Power Wash | Mini-game, tablet | 1024×768 | 3 | 0 pixels | 59.4859% changed | 16.3770 | 0 pixels changed |
| Corner Café | UI/service screen, mobile | 844×390 | 3 | 0 pixels | 59.6634% changed | 45.9163 | 0 pixels changed |

All 18 independent repeat captures were identical within each case. All six deliberate displacements exceeded the normal comparison limits and returned `visual-difference`. All six restored captures were byte-render-equivalent at the pixel level to their corresponding pristine cycle capture.

Five cases matched their approved baseline with zero changed pixels. Corner Café had a stable 100-pixel difference from its approved baseline (`0.03038%`, MAE `0.01807`), below the unchanged `0.25%` and `0.65` limits. The same 100 pixels occurred in every independent capture, so this was stable accepted rendering variation rather than nondeterministic noise. Restoration was still exact against the cycle-pristine capture.

## Reference overlay and association checks

The dedicated reference workflow also passed:

- Side-by-side mode rendered two correctly associated panels.
- Difference mode published measured metrics: `14.67%` changed pixels and MAE `3.15` for the live/reference example.
- An unrelated Village Grocer reference was rejected for the Fishing scene.
- Overlay captures excluded development guides as required by the capture mode.

## Baseline integrity

The aggregate digest of the manifest plus all ten approved baselines was identical before and after testing:

`1917f3ec953f439dcd1ecda87f342d0dad6f5813147a36713a1052a552ab25c1`

No approval command ran and no baseline was replaced.

## Verification results

- Independent browser retest: **6/6 PASS**
- Repeat determinism: **18/18 captures, zero repeat noise**
- Controlled displacement detection: **6/6 PASS**
- Exact restoration: **6/6 PASS**
- Reference overlay/difference/association check: **PASS**
- Focused automated tests: **7/7 PASS**
- Production build and post-build guards: **PASS**
- Development-only production-surface exclusion: **PASS**
- Approved baseline integrity: **PASS**

## Evidence locations

- Machine-readable result: `artifacts/visual-regression/stage-06-independent-retest/RESULT.json`
- Per-case repeats, displaced captures, restored captures, and heatmaps: `artifacts/visual-regression/stage-06-independent-retest/<capture-id>/`
- Reference overlay evidence: `artifacts/visual-regression/reference-overlay/`
- Approved baseline manifest: `docs/qa/visual-readiness/phase-01/BASELINE_MANIFEST.json`

The artifact directory is intentionally ignored by Git so routine verification does not add generated captures to production source control.

## Test-harness correction observed during the retest

The first adversarial run targeted `#game canvas` for Lawn Care. Lawn Care is rendered through the visible DOM board `#lawn-board`, so moving the hidden/non-visible Phaser canvas correctly produced no pixel change. The stimulus selector was corrected to the actual rendered board, then the entire six-case suite was rerun from the beginning. The corrected Lawn Care displacement changed `29.8905%` of pixels and restoration returned to zero difference.

This was a test-stimulus correction, not a product or comparator failure.

## Limitations and remaining risk

- Device coverage is browser emulation at exact CSS viewports, not physical-phone screenshot capture.
- This retest proves deterministic behavior in the project's supported Chromium capture environment. It does not assert pixel identity across different browser engines, GPU drivers, operating systems, or font-rendering stacks.
- The workflow intentionally tolerates very small stable rendering differences through the documented policy. Meaningful 12-pixel movements were detected by a wide margin in every tested category.

These limitations do not block Stage 6 because the workflow's approved baseline environment is explicitly the deterministic Playwright Chromium capture environment.

## Final verdict

**STAGE 6 PASS — APPROVED.** The tool reliably detects meaningful visual differences, restores to the accepted baseline after controlled changes, preserves immutable baselines, and does not produce excessive nondeterministic noise in the tested town, interior, mini-game, UI, mobile, and tablet cases.
