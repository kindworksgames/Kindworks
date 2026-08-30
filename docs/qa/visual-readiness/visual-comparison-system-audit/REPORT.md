# KindWorks Visual-Comparison System Audit

Date: 2026-08-30  
Branch: `phase-2-ui-simplification`  
Commit inspected: `3387bcb48964c41edbdc26f4257d2990fcdaf8d5`  
Audit scope: deterministic scene captures, approved-reference alignment, difference review, responsive/state coverage, and baseline governance  
Repository changes made by this audit: documentation and captured evidence only; no production or gameplay code changed

## Verdict

**FAIL — THE CURRENT SYSTEM IS USEFUL FOR MANUAL REVIEW, BUT IS NOT RELIABLE ENOUGH TO APPROVE VISUAL CHANGES AUTOMATICALLY.**

The project has two useful but separate foundations:

1. A development-only `visual-regression` route with a schema-valid fixed save, five viewport profiles, six representative scene scenarios, fixed world time, paused simulation services, and ten stored baseline screenshots.
2. A development-only Fishing Reference Overlay with opacity, live/reference/overlay/split/difference modes, grid and geometry guides, coordinate editing, and validated layout export.

The first system reliably reproduces four tested static scenes byte-for-byte. The second is a helpful manual Fishing layout aid. Neither system currently performs a fresh automated screenshot comparison against an approved reference. The baseline verifier checks stored-file integrity and a source-code fingerprint; it does not capture the current game, compare pixels, apply thresholds, or prove that the correct scene/state/reference was used.

This creates both serious false-negative and false-positive risks. A same-path runtime image replacement is not included in the source fingerprint and can change the game while the baseline check still passes. Conversely, nonvisual source edits can invalidate the broad fingerprint. Town also reports ready before its initial visual transition is settled and retains animated elements after settling.

## Systems audited

### Stored visual-regression baseline path

```text
?qa=visual-regression&scenario=<id>
  -> visualRegressionFixtures.js seeds isolated schema-37 state
  -> main.js opens one of six representative scenarios
  -> browser/operator waits for data-visual-regression-ready="true"
  -> screenshot is captured manually
  -> BASELINE_MANIFEST.json records name/dimensions/hash/coverage
  -> verify-visual-regression-baselines.mjs verifies stored evidence and source fingerprint
```

Strengths:

- isolated save namespace;
- fixed game date/time and fixed player/state fixture;
- world, NPC and municipal simulation paused;
- five executable landscape viewport profiles;
- expected scene IDs are present in scenario data;
- fidelity control panel is absent from baseline-route captures;
- exact stored screenshot hashes and dimensions are protected;
- development route and tools are excluded from production.

Critical limitation: the verification path ends at stored-file/source integrity. There is no repository command that launches the current build, captures the requested state, checks the actual scene and viewport, and compares the new pixels to the approved baseline.

### Reference Overlay path

```text
?qa=reference-overlay
  -> isolated Fidelity QA state opens Fishing level 1
  -> FishingScene dynamically loads ReferenceOverlayController in development
  -> registered Fishing texture or local PNG/JPEG/WebP becomes overlay
  -> controller stretches image to canonical 1280x720
  -> operator selects live/overlay/reference/split/difference and guides
```

Strengths:

- canonical Fishing coordinate system;
- opacity adjustment;
- live/reference/overlay modes;
- split wipe;
- grid, origin, visual bounds, safe area, socket, collision, navigation and interaction guides;
- stable instance selection and snapped visual movement;
- validated data export;
- gameplay geometry lock;
- production exclusion.

Critical limitations:

- Fishing only;
- no approved-reference manifest lookup or reference checksum;
- the default comparison source is the same registered runtime artwork used by Fishing;
- arbitrary local images are accepted without scene, state, dimension or aspect-ratio validation;
- `Difference` is a Phaser blend mode, not a measured image diff;
- no threshold, mask, heat-map statistics or pass/fail result;
- captured screenshots include the editor panel and guides.

## Commands and runtime checks

| Check | Result |
| --- | --- |
| `pnpm run visual:baseline:check` | PASS — 10 stored images, 6 families, 5 profiles, 85 source files |
| Phase 1 + Phase 4 focused tests | PASS — 16/16 |
| Development preview | PASS — Vite served locally |
| Representative route readiness | PASS for valid tested scenarios |
| Console warnings/errors during final browser checks | 0 |
| Physical phone/tablet | NOT TESTED — all responsive evidence is Chromium emulation |

The passing commands do not invalidate the findings below; they test fixture, manifest, source-fingerprint and static tool contracts rather than fresh rendered-image equivalence.

## Capability matrix

| Capability | Status | Evidence and reliability assessment |
| --- | --- | --- |
| Deterministic scene screenshots | **PARTIAL** | Interior, shop, restaurant entry, Lawn Care and Power Wash repeated byte-for-byte. Town did not. No automated capture command exists. |
| Correct reference-image selection | **FAIL** | Reference Overlay has no approved-reference lookup/checksum and accepts any local image. |
| Viewport matching | **PARTIAL** | Baseline manifest records dimensions, but the route reports ready at an incorrect viewport. |
| Aspect-ratio matching | **FAIL** | An 844x390 Grocer image was stretched to 1280x720 and reported successful. |
| Reference/implementation alignment | **PARTIAL** | Fishing canonical fit is exact when the correct 1280x720 input is supplied; no alignment transform, crop policy or mismatch validation exists. |
| Opacity blending | **PASS (Fishing only)** | 0–100% controller works. |
| Side-by-side comparison | **PARTIAL** | `Split` is a half-width wipe/crop, not an independent side-by-side capture. |
| Difference visualization | **FAIL** | Blend-mode output is not a trustworthy pixel-difference image and provides no measurements or pass/fail result. |
| Guide lines and safe areas | **PASS (Fishing only)** | Grid, safe area, bounds, origins, sockets and logical geometry render. |
| Scale/coordinate inspection | **PASS (Fishing only)** | Canonical coordinates, snapped X/Y movement and bounds are inspectable. |
| Device presets | **PARTIAL** | Five profiles exist as data; the route/overlay neither selects nor enforces them. |
| Scene-state selection | **FAIL** | Scenario IDs select only six fixed entry states. |
| Day/night selection | **FAIL** | Fixture fixes 11:00; no named day/night variants exist. |
| Clean/dirty/upgrade selection | **FAIL** | No capture-state matrix or query contract exists. |
| Stable camera | **PARTIAL** | Tested camera framing was stable after startup, but the camera position/zoom is not declared or verified in baseline metadata. |
| Stable random seed/animation clock | **PARTIAL** | Save and service clocks are fixed/paused; Phaser tweens, animation frames and Town decorative movement are not frozen or stepped. |
| Hide debug UI from captures | **PARTIAL** | Baseline route hides fidelity tools. Reference Overlay captures include its panel/guides; `Hide editor` hides guides, not the panel. |
| Repeatable naming/storage | **PARTIAL** | Existing files follow a good convention, but capture tooling does not enforce file type, name or destination. |
| Baseline approval/versioning | **PARTIAL** | Manifest has schema version, timestamps, hashes and a review note; no reviewer/approval state, commit/browser/capture version, reference hash or protected approval workflow. |
| Difference thresholds | **FAIL** | No threshold implementation exists. |
| Harmless-noise handling | **FAIL** | No dynamic masks, animation freeze, perceptual metric or per-scene threshold exists. |
| Production exclusion | **PASS** | DEV guards and production-surface checks cover the QA tools. |

## Representative runtime coverage

| Surface | Viewport | Runtime result | Comparison result | Coverage limitation |
| --- | ---: | --- | --- | --- |
| Town + HUD | 1280x720 | Correct `TownScene`; exact viewport; no overflow; debug panel absent | Animated; not byte-stable; ready signal is premature | Only fixed day/time; no modal/result/state matrix |
| House Interior | 1024x768 | Correct scene; exact viewport; no overflow | Two captures and approved baseline were byte-identical | One home/state/profile only |
| Village Grocer shop | 844x390 | Correct scene; exact viewport; no overflow | Two captures and approved baseline were byte-identical | One selected product/state only |
| Corner Cafe | 844x390 | Correct scene; exact viewport; no overflow | Two captures and approved baseline were byte-identical | Entry screen, not an active customer/order shift |
| Lawn Care minigame | 568x320 | Correct scene; exact viewport; no overflow | Two captures and approved baseline were byte-identical | Level 1 entry only; no success/failure/pause |
| Power Wash | 1024x768 | Correct scene; exact viewport; no overflow | Two captures and approved baseline were byte-identical | Level 1 entry only; no wash/completion state |
| Town Menu popup | 844x390 | Popup opened through real Town HUD control | No approved baseline; background animation changed 0.4196% of pixels above 8/channel | Popup/HUD states are not first-class scenarios |
| Fishing Reference Overlay | 1280x720 | Live/overlay/reference/split/difference all operated | Manual modes visible; difference result not quantitative | Fishing only; editor/panel included |
| Mobile emulation | 568x320 and 844x390 | Correct dimensions, no page overflow | Static tested scenes were exact | Not a physical device; scenario viewport not enforced |
| Tablet emulation | 1024x768 | Correct dimensions, no page overflow | Static tested scenes were exact | Not a physical device |

## Measured screenshot determinism

The following measurements use decoded RGB images. `>8` and `>20` mean the percentage of pixels whose largest channel difference exceeds that value.

| Pair | Exact changed | Pixels >8 | Pixels >20 | Mean absolute channel difference | Interpretation |
| --- | ---: | ---: | ---: | ---: | --- |
| Town, 350 ms apart immediately after current ready workflow | 99.9382% | 93.5940% | 59.7050% | 15.6743 | Initial scene transition is still settling after readiness. |
| Town, 350 ms apart after an additional 2 s settle | 1.6139% | 0.5704% | 0.2185% | 0.1393 | Camera/layout stable; moving decorative/world pixels remain. |
| Approved Town baseline vs post-settle live capture | 1.6673% | 0.5831% | 0.2314% | 0.1426 | Mostly dynamic-object noise; no automated mask exists. |
| Town Menu popup, 350 ms apart | 1.6260% | 0.4196% | 0.0969% | 0.0842 | Popup is stable, but animated Town remains behind it. |
| House Interior repeat | 0% | 0% | 0% | 0 | Byte-identical. |
| Village Grocer repeat | 0% | 0% | 0% | 0 | Byte-identical. |
| Corner Cafe repeat | 0% | 0% | 0% | 0 | Byte-identical entry state. |
| Lawn Care repeat | 0% | 0% | 0% | 0 | Byte-identical entry state. |
| Power Wash repeat | 0% | 0% | 0% | 0 | Byte-identical entry state. |

These results show why one global percentage threshold would be unsafe. A threshold loose enough for Town could miss a small but important icon, button, interaction marker or character change. Dynamic regions must be frozen or explicitly masked, and structural/perceptual thresholds must be scene-specific.

## Confirmed findings

### VC-001 — Critical — baseline verification never compares the current render

**Reproduction:** run `pnpm run visual:baseline:check`. The script reads stored screenshots, verifies their hashes/dimensions, and computes a source fingerprint. It never launches the game or captures a new image. The command passed while the current Town render differed from its approved baseline.

**Expected:** normal verification should capture the current deterministic scene and compare it with the approved baseline.

**Actual:** it proves only that approved evidence files and tracked source text have not changed.

**Impact:** a runtime visual regression can pass the named visual-baseline check.

**Repair:** add a browser capture runner that validates route, scene, state and viewport; emits current/diff artifacts; and fails from measured comparison results.

### VC-002 — Critical — artwork bytes are excluded from the visual source fingerprint

**Evidence:** manifest `sourceRoots` cover HTML/JS/CSS/JSON paths. The fingerprint walker includes only `.js`, `.css`, `.html` and `.json`. Runtime PNG/JPEG/WebP/atlas-image bytes under `public/assets` are absent.

**Expected:** changing approved runtime artwork in place must invalidate or fail comparison.

**Actual:** same-path artwork replacement can alter the game without altering stored baseline hashes or the source fingerprint.

**Impact:** the exact workflow the visual-readiness architecture is preparing for can bypass the current visual gate.

**Repair:** use the semantic asset manifest to include content hashes for every referenced runtime texture/atlas, while still performing a live rendered comparison.

### VC-003 — High — invalid scenario and viewport requests fail open

**Reproductions:** 

- `?qa=visual-regression&scenario=not-a-real-scene` reported `scenario=unknown`, `ready=true`, and rendered `TownScene`.
- `scenario=house-interior` at 568x320 reported `ready=true`, even though its declared profile is 1024x768.

**Expected:** unknown scenario, wrong scene, wrong state and wrong viewport fail closed before capture.

**Actual:** readiness is true without validating the requested capture contract.

**Impact:** a mislabeled screenshot can be stored or compared against the wrong baseline.

**Repair:** publish a signed capture descriptor in the DOM and assert exact scenario ID, scene key, viewport/profile, state ID, camera state, fixture version and orientation before capture.

### VC-004 — High — Town readiness is premature and animation is not controlled

**Evidence:** the route sets Town ready by a 900 ms timer. A capture taken 500 ms after that signal changed across 93.594% of pixels above 8/channel over the next 350 ms. After an additional 2 s, residual movement still changed 0.5704% above 8/channel.

**Expected:** ready means assets, fonts, layout, camera, transitions, tweens and selected animation frame are capture-stable.

**Actual:** it means a timer elapsed or an activity-open promise succeeded.

**Repair:** implement scene-owned `awaitVisualIdle()` gates; disable or deterministically step animations/tweens; wait for fonts/assets/camera; freeze decorative movement or publish masks.

### VC-005 — High — reference identity, dimension and aspect contracts are not enforced

**Reproduction:** upload the approved 844x390 Grocer baseline to the 1280x720 Fishing overlay. The tool accepted it, stretched it, and reported: `fitted to 1280×720.`

**Expected:** a Fishing comparison accepts only an approved Fishing reference whose scene/state/version/dimensions/aspect contract matches, unless the operator explicitly chooses a documented alignment transform.

**Actual:** any PNG/JPEG/WebP is accepted and forcibly stretched.

**Impact:** apparent alignment can be meaningless; proportions can be distorted without warning.

**Repair:** add an approved-reference manifest with scene/state/profile/hash/canonical size and fit policy; reject mismatches by default; expose explicit contain/cover/crop/offset/scale controls as review metadata.

### VC-006 — High — `Difference` is not an auditable difference result

**Evidence:** the controller sets Phaser `BlendModes.DIFFERENCE` on an overlay image. It does not compute a current/reference pixel buffer, threshold it, mask dynamic regions, calculate statistics or export a heat map. The captured Difference view remained visually dominated by the normal reference image and editor UI.

**Expected:** repeatable difference image plus numerical measurements and documented pass/fail thresholds.

**Actual:** renderer-dependent live blending with no acceptance semantics.

**Repair:** perform an offscreen or post-capture decoded-pixel comparison; export raw diff, amplified heat map, metrics and ignored-region overlays; retain blend mode only as a convenience preview.

### VC-007 — High — coverage omits most scenes and important states

There are six scenario IDs for an 18-scene game. No first-class baselines exist for River, Waste, Beach, Fishing, Magnet Fishing, House Rescue, Bakery, Morning Mug, Riverside Kitchen, Scoops, Paws, Harbour General, active restaurant shifts, result/failure/retry states, loading/error states, dialogue, tutorial, rotate barrier, inventory, pet screens, or other important overlays.

Day/night, clean/dirty, all four lawn-growth states, building upgrades and restoration states are not selectable capture dimensions. The tested Cafe screenshot is an entry screen rather than an active service loop.

**Repair:** create a declarative capture matrix from the complete scene/screen inventory, including state fixtures and named overlays. Require every production scene dependency/state to be assigned or explicitly exempted.

### VC-008 — Medium — capture hygiene and naming are manual

Baseline routes correctly omit the fidelity panel. Reference Overlay screenshots include the 350 px editor panel, guides and game HUD; the `Hide editor` button hides guides but not the panel. There is no capture action that atomically hides QA surfaces, waits one frame, captures, and restores them.

The browser capture surface returns JPEG bytes; no repository tool enforces that the filename extension, scenario, profile and storage location match those bytes.

**Repair:** add a capture-safe mode/data attribute that hides all QA UI without changing gameplay layout, and a single naming/storage encoder that derives extension and paths from actual output format.

### VC-009 — Medium — baseline approval and provenance are insufficient

The manifest has `version`, `capturedAt`, `lastReviewedAt`, hashes and a free-text review note. It does not record approval status/reviewer, source commit, browser/OS/render backend, fixture/capture-tool versions, reference-image hash, state ID, camera descriptor, tolerance policy, masks or superseded-baseline lineage.

**Repair:** introduce append-only baseline revisions and an explicit `candidate -> reviewed -> approved` workflow. Baseline refresh and test execution must be separate commands; tests must never auto-approve.

### VC-010 — Medium — broad source fingerprint creates avoidable false positives

Entire scene/UI/entity directories are fingerprinted. A nonvisual logic/comment change can require baseline review, while actual image bytes are omitted. This is both noisy and incomplete.

**Repair:** replace the broad text fingerprint with dependency-derived hashes: scene bundle/layout/style/font/semantic asset bytes/capture fixture/camera contract, plus the live pixel comparison.

### VC-011 — Medium — device, camera and state metadata are not capture contracts

Five profiles exist, but the overlay has no device selector and the baseline route does not enforce a profile. The manifest does not record camera scroll/zoom/bounds or safe-area insets. No day/night, clean/dirty or upgrade selector exists.

**Repair:** make `captureId` resolve an immutable scene-state-camera-device descriptor and expose that descriptor in captured metadata.

### VC-012 — Low — physical-device rendering remains unverified

All mobile/tablet evidence is in-app Chromium emulation. This is valid responsive-layout evidence but does not prove native safe areas, device pixel ratio behaviour, font rasterization, GPU blend mode consistency or OS orientation transitions.

## False-positive risks

1. **Town animation and water/NPC motion:** a strict whole-frame threshold rejects harmless movement.
2. **Premature readiness:** the initial Town fade/tint transition changes almost the whole frame.
3. **JPEG/GPU/font rasterization:** low-amplitude differences can vary by browser/OS even when layout is unchanged.
4. **Broad source fingerprint:** changes that do not alter pixels still force review.
5. **One global threshold:** the Town noise floor is much higher than static scenes.
6. **Mismatched viewport/state/reference:** a huge diff can reflect a test setup error rather than a product regression.

## False-negative risks

1. Runtime image replacement under the same path is not fingerprinted.
2. No live render is captured by the verifier.
3. Twelve of eighteen scenes and most overlay/result states have no baseline scenario.
4. A broad percentage threshold could miss a small but important control or icon.
5. The route accepts unknown scenarios and wrong viewport sizes as ready.
6. Fishing compares by default against its registered runtime image rather than an independently approved reference revision.
7. DOM and canvas layers are not compared separately, making small UI failures hard to localize.

## Repair specification

### Wave 1 — fail-closed capture contracts

1. Define versioned `VisualCaptureCase` data with capture ID, scene, fixture/state, viewport/profile, orientation, camera scroll/zoom, expected DOM marker, reference ID, settle strategy, masks and comparison policy.
2. Reject unknown capture IDs, wrong scenes, wrong viewports, wrong state IDs and missing references.
3. Replace timer readiness with scene-owned readiness that waits for assets, fonts, layout, camera and transitions.
4. Expose an immutable capture descriptor and checksum in the DOM for the runner to verify.

Acceptance tests:

- unknown scenario fails;
- wrong viewport fails;
- wrong scene/state/reference fails;
- capture cannot occur before visual idle;
- debug tools are hidden without changing game layout.

### Wave 2 — deterministic capture runner

1. Add one repository command that starts or targets a preview, applies the exact viewport, opens each capture case, validates the descriptor, captures in a declared format, and stores candidate/current images separately from approved baselines.
2. Freeze or deterministically step Phaser animations/tweens and DOM animations.
3. Pin random seeds, camera state, device scale, reduced motion, fonts and render backend where practical.
4. Record console/resource failures with each capture.

Acceptance tests:

- static cases are byte-identical across fresh runs;
- dynamic cases reproduce within their declared masks/thresholds;
- current and baseline files cannot be confused or overwritten by normal test runs.

### Wave 3 — real image comparison

1. Decode current/reference images to a consistent colour space.
2. Compare dimensions before pixels.
3. Produce exact diff, amplified heat map, changed-pixel counts, per-channel MAE/RMS, bounding regions and optional structural/perceptual metrics.
4. Support reviewed dynamic masks and separate DOM/canvas regions.
5. Use per-case policies rather than one global tolerance.
6. Always fail large structural shifts, missing controls and unexpected blank/transparent regions.

Acceptance tests:

- one-pixel translations, missing buttons, clipped text and changed safe-area placement fail;
- approved moving-water/NPC masks do not fail;
- a small but critical UI-region change cannot hide beneath a whole-screen percentage threshold.

### Wave 4 — approved-reference and overlay repair

1. Create a reference manifest with independent reference IDs, scene/state/profile, size/aspect, checksum, provenance and approval revision.
2. Validate supplied references before loading.
3. Add explicit alignment transforms and persist them as review metadata.
4. Replace Difference preview with the same comparator used in CI; retain opacity/split for interactive diagnosis.
5. Generalize the overlay adapter beyond Fishing without coupling gameplay scenes to files.
6. Add a capture-safe toggle that hides panel/guides/HUD selectively.

Acceptance tests:

- wrong scene/aspect/reference is rejected;
- approved reference aligns without implicit stretching;
- exported diff metrics match offline/CI metrics;
- tools remain absent from production.

### Wave 5 — coverage and approval governance

1. Derive capture cases from the complete scene/screen inventory.
2. Add active, result, failure, pause, popup, tutorial, day/night, dirty/clean, growth and upgrade states.
3. Cover narrow phone, modern phone, tablet and canonical desktop where each surface is supported.
4. Add candidate/review/approve commands and immutable revision history.
5. Record reviewer, commit, environment, fixture, capture tool, reference and tolerance/mask versions.
6. Keep baseline approval separate from code changes and automated test runs.

## Recommended gate after repair

The visual-comparison system should be approved only when all of the following are true:

- every production scene/screen and required state has a declared capture case or documented exemption;
- every case fails closed on wrong scene, state, viewport, camera or reference;
- current renders are captured automatically;
- runtime artwork bytes are dependency-hashed;
- static cases are reproducible and dynamic cases use explicit masks/stepped animation;
- real diff artifacts and metrics are emitted;
- thresholds are per-case and validated against deliberate regressions;
- debug UI is excluded from production captures;
- candidate and approved baselines cannot be silently conflated;
- physical phone/tablet spot checks complement emulation for final approval.

## Evidence index

- Machine-readable results: [EVIDENCE.json](EVIDENCE.json)
- Captures and generated diagnostic differences: [screenshots](screenshots/)
- Premature Town comparison: [town baseline vs immediate live diff](screenshots/town__baseline-vs-live__diff-amplified.png)
- Post-settle Town noise: [town baseline vs stabilized live diff](screenshots/town__baseline-vs-post-stabilization__diff-amplified.png)
- Fishing difference-mode capture: [difference view](screenshots/fishing-reference-overlay__difference__1280x720.jpg)
- Rejected-by-design case that the current tool accepted: [wrong-aspect Grocer reference stretched into Fishing](screenshots/fishing-reference-overlay__mismatched-reference__1280x720.jpg)
- Popup drift diagnostic: [Town Menu repeat diff](screenshots/town-menu-popup__capture-a-vs-b__diff-amplified.png)

