# KindWorks visual comparison workflow

This workflow is the authoritative visual-regression gate. The older checksum-only verifier remains an integrity check; it does not claim that the running game matches an approved screenshot.

## Contracts and deterministic capture

Capture cases live in `src/qa/visualComparisonContracts.js`. Each case fixes the scene, state, device profile, viewport, camera centre/zoom, random seed, readiness condition, and comparison policy. Runtime preparation is development-only and fails closed on an unknown case, wrong viewport, wrong scene, missing texture, incomplete state, unsettled fade, or changed camera.

The ten representative cases cover world, interior, shop, restaurant, cleanup, and special-renderer scenes at 568×320, 844×390, 1024×768, 1280×720, and 1366×768. Captures use the isolated QA save, a fixed clock, a seeded random source, fixed camera contracts, completed asset/font readiness, normalized town NPC/animal presentation phases, and paused scene time. Debug-only panels are hidden with `visibility`, so their removal cannot reflow the game.

## Capture and compare

1. Install dependencies and the pinned Playwright Chromium browser.
2. Run `pnpm run visual:compare` for the complete gate, or append `-- --case town--reference` for one case.
3. Review `artifacts/visual-regression/current`, `differences`, and `SUMMARY.json`.
4. A failed comparison remains failed. Correct state, alignment, timing, or the game; do not raise thresholds to hide the problem.

Ordinary capture and compare commands never write under `docs/.../baselines`.

## Baseline approval

Approval is deliberately separate and single-case only:

1. Run `pnpm run visual:capture -- --case <capture-id>`.
2. Review the candidate and heatmap.
3. Read the candidate SHA-256 token reported by an approval attempt without a token.
4. Run `pnpm run visual:approve -- --case <capture-id> --reviewer <name> --token <12-character-token>`.

There is no approve-all or silent update flag. Missing reviewer, missing/wrong token, unknown case, mismatched scene, or mismatched viewport aborts without changing the baseline. Approval records reviewer, time, full candidate hash, and token in `BASELINE_MANIFEST.json`.

## Adding a capture case

1. Add a unique case to `VISUAL_CAPTURE_CASES` with an existing fixed profile.
2. Add an explicit activity entry mapping in `VisualCaptureRuntime.js` if it is not the town.
3. Add a state-specific readiness selector. Never substitute a delay.
4. Capture twice and require zero changed pixels between repeated candidates before approval.
5. Review the image, approve that one case, and add the baseline association to `BASELINE_MANIFEST.json`.
6. Add the scene family to the unit or browser coverage if it is new.

## Adding an approved design reference

1. Add a stable reference ID to `src/visual/dev/referenceComparison.js`.
2. Declare the owning scene/state, canonical size, accepted formats, required source aspect ratio, filename association, fit, and alignment.
3. Pass only that reference ID from the owning scene to `ReferenceOverlayController`.
4. Add positive association plus wrong-scene and wrong-aspect tests.
5. Run `pnpm run visual:reference:check` and review the side-by-side and difference evidence.

The reference tool rejects an unrelated filename or wrong aspect ratio rather than stretching it. Difference mode is an absolute RGBA heatmap and reports changed-pixel ratio, mean absolute error, and maximum channel delta.

## Evidence and production safety

Generated evidence is intentionally ignored under `artifacts/visual-regression`. CI uploads it on success or failure. The production build guard verifies that capture runtime, overlay controls, Asset Lab, and QA globals are excluded from shipped JavaScript.
