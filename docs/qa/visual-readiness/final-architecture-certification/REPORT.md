# KindWorks Visual-Readiness Architecture — Final Adversarial Certification

> **Superseded finding status (2026-08-30):** confirmed repairs and independent rerun evidence are recorded in [`REPAIR_REPORT.md`](./REPAIR_REPORT.md). This report remains the immutable pre-repair certification baseline.

**Audit date:** 2026-08-30  
**Branch:** `phase-2-ui-simplification`  
**Starting commit:** `3387bcb`  
**Decision:** **NO-GO FOR THE CONTROLLED REAL-ART VERTICAL SLICE**  
**Mass artwork generation:** not assessed as ready and remains prohibited.

## A. Executive readiness verdict

KindWorks has a substantial visual-readiness foundation: the production build succeeds, 811 automated tests pass, save and gameplay isolation checks pass, deterministic screenshot comparison works, development tools are absent from production, and the emulated landscape viewport matrix is usable.

It is not yet safe to begin the controlled real-art vertical slice. Two independently reproduced critical defects remain:

1. The asset-contract validator accepted 34 deliberately invalid contracts/files and rejected one valid interlaced PNG. The accepted invalid inputs include corrupt image/audio bytes, wrong-case paths, malformed geometry/anchors/sockets/layers, missing tileset and nine-slice metadata, and missing category-required metadata. The adversarial audit exits successfully and is not a failing CI gate.
2. Approved Phase 8B Town/Lawn assets can be merged into the semantic manifest, but normal Town and Lawn Care gameplay does not load or instantiate their scene packs/scene instances. The only complete runtime consumers are the Fishing pilot, Power Wash native-Canvas loading, and the Town-bin pilot. The Phase 8B candidate seen in Town is mounted by a development-only preview controller, not by the production scene path.

The architecture is therefore a useful partial framework, not yet a certified production intake path.

## Scope and evidence discipline

- The audit inspected the current implementation instead of relying on prior PASS reports.
- No production gameplay repair was made.
- A controlled disposable Phase 8B candidate was created, validated, referenced, offset through data, inspected in Asset Lab, previewed in Town, then fully removed. Candidate indexes, reference associations, and layout overrides were returned to their empty baseline.
- Browser results are Chromium emulation, not physical-device testing.
- The repository was already heavily modified/untracked. Existing user work was preserved.

## B. Subsystem certification matrix

| # | Subsystem | Status | Fresh evidence |
|---:|---|---|---|
| 1 | Asset manifests and stable IDs | **PARTIAL** | Central registry validates 15 runtime assets; file paths are centralized for registered assets. Most production families remain contract-only; legacy unknown keys pass through. |
| 2 | Asset contracts | **FAIL — CRITICAL** | Adversarial audit: 129/165 pass, 34 false negatives, 1 false positive, 1 wrong-reason rejection. |
| 3 | Validators | **FAIL — CRITICAL** | Normal full-project validation passes existing files but does not reject all malformed contracts or corrupt bytes. Adversarial audit is not a failing build/CI gate. |
| 4 | Static assets | **PARTIAL** | Seven file-backed runtime assets are deeply validated; most planned production art is absent by design. One duplicate-content warning remains for Fishing reference/runtime bytes. |
| 5 | Atlases and spritesheets | **PARTIAL** | Loader/contract support and ordinary negative tests exist, but category-specific and corrupt-byte loopholes remain. |
| 6 | Animations, directions, states | **PARTIAL** | Semantic definitions exist and Asset Lab can inspect them; production slice animations are not consumed by normal Town/Lawn runtime. |
| 7 | Scene-layout data | **FAIL — HIGH** | 19/19 layouts exist, but only 1/17 important player-visible scenes is object-level data-driven (5.9%). |
| 8 | Visual versus logical coordinates | **PARTIAL** | Pilot separation probes pass; 7,770 hard-coded visual occurrences remain and 16 important scenes are surface-only. |
| 9 | Collision isolation | **PASS for tested systems** | Differently sized/padded/origin-shifted replacement metadata preserved tested logical geometry; no automatic physics-body dependency found. |
| 10 | Interaction-zone isolation | **PASS for tested systems** | Explicit touch/interaction zones remained stable in representative shops, minigames, entities, and pilot prefabs. |
| 11 | NPC/animal navigation isolation | **PASS** | 104 outdoor NPC segments and 481 animal ground segments passed; no obstacle/water violations found. |
| 12 | Input and touch targets | **PASS in emulation** | Seven landscape profiles had zero player controls outside viewport and zero player controls below 44 CSS px. |
| 13 | Asset Lab | **PASS with low-risk usability debt** | 112 records, 74 families, 15 category contracts, candidate metadata/geometry/reference inspection and production exclusion verified. Tag facets are noisy and desktop-only controls use 32 px heights. |
| 14 | Reference-image comparison | **PASS** | Six repeated adversarial cases had 0.000000% repeat noise and detected controlled displacements; authoritative 10-case comparison passed without replacing baselines. |
| 15 | Mobile/tablet responsiveness | **PASS in emulation** | 568×320, 667×375, 844×390, 960×600, 1024×768, 1180×820, and 1366×768 passed containment/overflow checks. |
| 16 | Pixel-art rendering | **PASS** | Phaser `pixelArt`, `roundPixels`, CSS `image-rendering: pixelated`, FIT scaling, and fixed logical footprint tests pass. |
| 17 | Performance and memory | **FAIL — HIGH** | Production Town mean frame target passed, but every-run p95 target failed (34.2–35.1 ms); 4× CPU throttle averaged 50.9 ms. |
| 18 | Production builds | **PARTIAL** | Build and surface guard pass; development tools are excluded. Normal approved-slice scene consumption is missing. |
| 19 | Save compatibility | **PASS** | Fresh/older/mid/completed saves, missing optional/required art, layout changes, replacement metadata, rewards, and reload tests pass. No fragile visual fields found. |
| 20 | Cross-system gameplay regression | **PASS** | 811/811 tests; parity audit covers 13 activities, 5,850 levels, and 19 shared domains. |
| 21 | Developer documentation | **FAIL — HIGH** | Some documents claim promoted art enters the normal manifest without scene changes, while the normal Town/Lawn render path does not consume those instances. Earlier validator-readiness claims conflict with the new negative evidence. |
| 22 | Failure and fallback behaviour | **PASS with low-risk debt** | Required Fishing art failure stayed in scene with visible fallback and preserved schema-37 save; gameplay-critical native art fails closed. Failed Fishing load was requested three times. |
| 23 | End-to-end replacement workflow | **FAIL — CRITICAL** | Staging through dev preview works; approved normal-game rendering for the target Town/Lawn slice is not implemented. |
| 24 | Readiness for real-art vertical slice | **FAIL** | Critical validator and production-consumer defects remain. |

## C. Commands executed and results

| Verification | Result |
|---|---|
| `pnpm test` | **PASS — 811/811**, 0 failed, 73.4 s |
| `pnpm build` | **PASS**; Vite 8.2.2, 203 modules; production guards and post-build validators passed |
| Type check | **NOT CONFIGURED** as a package script |
| Lint | **NOT CONFIGURED** as a package script |
| `pnpm parity:differential` | **PASS**; 13 activities, 5,850 levels, 19 shared domains, 85 exact rules |
| `pnpm parity:minigames` | **PASS** (exit 0) |
| `node scripts/audit-asset-contract-stage2.mjs` | **FAIL AS CERTIFICATION EVIDENCE**; 34 false negatives, 1 false positive, 1 wrong reason; script itself exited 0 |
| `node scripts/audit-scene-layout-architecture.mjs` | 19 scenes/layouts; 5,418 hard-coded records; 7,770 occurrences; separation probes pass |
| `node scripts/re-audit-scene-layout-coverage.mjs` | 1/17 object-level scenes; 5.9%; 736 direct scene literals; 276 shared restaurant literals |
| `node scripts/audit-gameplay-geometry-isolation.mjs` | **PASS for tested isolation**; no automatic physics bodies, navigation violations, or fragile save fields |
| `node scripts/retest-gameplay-geometry-isolation.mjs` | **PASS** with different canvas sizes, padding, origin, and frame metadata |
| `node scripts/audit-asset-lab-comprehensive.mjs` | 112 records; 37 runtime/dev assets; 74 families; 22 placeholders; 15/15 category contracts represented |
| `pnpm qa:mobile` | **PASS functional matrix**; 7 profiles, 21 transitions, context recovery, failed-asset fallback |
| `pnpm performance:town` | **FAIL p95 target**; normal mean 23.01 ms, p95 34.2–35.1 ms; 4× mean 50.91 ms |
| `pnpm visual:stage6:retest` | **PASS 6/6**; exact repeat and restore, every displacement detected |
| `pnpm visual:compare` | **PASS 10/10**; baselines not modified |
| Controlled Phase 8B candidate | **PARTIAL**; validation/Lab/reference/offset/dev Town preview pass, production scene consumption absent; temporary files removed |
| Production `?qa=asset-lab` probe | **PASS exclusion**; no Asset Lab panel/toggle and no development game global |

Runtime evidence:

- `artifacts/visual-readiness-mobile-audit/RESULT.json`
- `artifacts/visual-readiness-mobile-audit/PRODUCTION_TOWN.json`
- `docs/qa/visual-readiness/asset-contract-stage-2-independent-retest/EVIDENCE.json`
- `docs/qa/visual-readiness/gameplay-geometry-isolation-audit/EVIDENCE.json`
- `docs/qa/visual-readiness/gameplay-geometry-isolation-independent-retest/EVIDENCE.json`
- `docs/qa/visual-readiness/reference-comparison-stage-6-independent-retest/EVIDENCE.json`

## D. Remaining findings by severity

### VR-CERT-001 — Asset-contract validator accepts invalid production inputs

**Severity:** CRITICAL  
**Status:** CONFIRMED

The fresh adversarial contract audit produced:

- total cases: 165;
- passed: 129;
- false negatives: 34;
- false positives: 1;
- wrong-reason rejection: 1.

Material false negatives include:

- corrupt header-only PNG;
- PNG with invalid CRC;
- corrupt header-only alpha WebP;
- random bytes named as OGG;
- incorrect filesystem case on case-insensitive macOS;
- unknown geometry shape;
- out-of-canvas ground contact;
- invalid socket ID;
- invalid/duplicate layer mappings;
- missing/duplicate/circular dependencies;
- unknown scene pack;
- invalid filename stem;
- contradictory alpha/exact-size/untrimmed policy;
- invalid runtime budget;
- missing executable tileset, layered-set, nine-slice, and effect metadata;
- missing category-required metadata for system fallback, terrain, effect, building, character, animal, interior, and minigame contracts.

The validator also rejected a valid Adam7 interlaced RGBA PNG as uninspectable. The normal project validator passes because current content does not exercise these holes, and the adversarial script does not fail the command when discrepancies remain.

**Required repair:** close every schema/binary loophole, add the cases to normal automated tests, and make the adversarial validator return non-zero for any false negative, false positive, wrong reason, or uncovered rule. Use full byte decoding/parsing rather than trusting extensions or headers, and perform exact directory-entry case checks.

### VR-CERT-002 — Approved vertical-slice assets do not enter normal Town/Lawn rendering

**Severity:** CRITICAL  
**Status:** CONFIRMED

`generate-phase8b-approved-index.mjs` can generate assets, prefabs, states, animations, scene instances, and scene packs. `createPhase8BApprovedManifest()` merges them into the central manifest.

The production execution path stops there:

- `BootScene` calls `queueScenePacks()` only for Boot.
- `FishingScene` queues and explicitly creates its semantic background.
- `PlaygroundPowerwashScene` calls the native-Canvas pack loader.
- `TownScene` and `LawnCareScene` do not queue approved packs.
- No normal production scene enumerates approved `sceneInstances`.
- `PhaserPrefabRenderer` is used by the Town-bin factory, not as a generic Town/Lawn scene-instance renderer.
- `Phase8BCandidatePreviewController` mounts the controlled candidate only under the development-only `qa=candidate-preview` path.

Therefore a human-approved asset may be registered correctly and still never appear in normal gameplay.

**Required repair:** add a production-safe scene-instance bootstrap for the controlled Town/Lawn slice. It must queue the scene packs in preload, create animations, instantiate validated active instances from layout/prefab/state data, resolve gameplay state without copying gameplay rules, preserve locked logical geometry, clean up on shutdown, and prove manifest-only replacement in a production build. Add an end-to-end test with a controlled approved fixture that asserts the semantic asset appears in ordinary Town/Lawn gameplay with no QA query and no scene code edit.

### VR-CERT-003 — Important scene presentation remains hard-coded

**Severity:** HIGH  
**Status:** CONFIRMED

- object-level data-driven coverage: 1/17 important player-visible scenes (5.9%);
- surface-only important scenes: 16;
- hard-coded visual records: 5,418;
- hard-coded occurrences: 7,770;
- direct scene placement literals: 736;
- shared restaurant placement literals: 276;
- global CSS placement lines: 2,040.

This does not presently change gameplay geometry, but it means routine art/layout integration still requires scene/CSS edits across most of the game.

**Required repair before mass migration:** migrate one scene family at a time after the vertical-slice production bootstrap works. Keep gameplay level coordinates separate; move only presentation recipes, visual offsets, state maps, and responsive anchors.

### VR-CERT-004 — Production Town misses the p95 frame target

**Severity:** HIGH  
**Status:** CONFIRMED

At 667×375, DPR 2, production preview, three independent 30-second runs:

- mean frame time: 23.01 ms (target passed);
- p95 per run: 34.2, 34.8, and 35.1 ms (33.34 ms target failed);
- maximum: 184.1 ms;
- 4× CPU throttle mean: 50.91 ms with 1,633/1,769 frames over 33 ms.

There were no runtime errors or failed requests.

**Required repair:** profile Town update/render/DOM work, reduce unnecessary per-frame allocations and duplicate scene objects, then rerun the identical three-run production harness. Do not relax the threshold.

### VR-CERT-005 — Documentation overstates production integration/readiness

**Severity:** HIGH  
**Status:** CONFIRMED

Several reports describe candidate promotion as entering the normal manifest without scene edits. That is true only for registration; it is not true for normal Town/Lawn rendering. Earlier contract reports also describe exact technical intake as ready, while the fresh adversarial audit demonstrates 34 accepted invalid cases.

**Required repair:** update the artist workflow, Phase 8B intake, architecture maps, and acceptance gates to distinguish registration, development preview, production loading, production instantiation, and verified gameplay display.

### VR-CERT-006 — Legacy compatibility can hide new bypasses

**Severity:** MEDIUM  
**Status:** CONFIRMED

`LegacyCompatibility` deliberately passes unknown keys through. The documented animal path export is test/external compatibility only, but the permissive policy can allow future scene-specific raw keys to evade migration accounting.

**Required repair:** retain compatibility for explicitly known legacy consumers, but warn and count unknown pass-throughs in development/CI. Add a migration debt report and prevent new unknown keys in changed production files.

### VR-CERT-007 — Production performance observability is incomplete

**Severity:** MEDIUM  
**Status:** CONFIRMED

The production performance harness records browser frames and memory, but Phaser scene child/timer/texture fields are null because production correctly excludes the development game global. This is safe for players but limits leak diagnosis.

**Required repair:** add an opt-in test-build-only metrics bridge that is excluded from normal production output, or collect equivalent data through an instrumented test bundle.

### VR-CERT-008 — Low-risk tooling/content debt

**Severity:** LOW

- exact duplicate Fishing bytes are retained in legacy reference and runtime locations;
- Asset Lab tag facets expose noisy generic words and numbers;
- desktop Asset Lab controls are 32 px high (mobile/coarse-pointer controls are 44 px);
- a failed Fishing asset generated three failed requests before settling on fallback.

## E. Architecture coverage

| Measure | Coverage |
|---|---:|
| Automated gameplay tests | 811/811 = **100% passing** |
| Production scenes assigned to production families | 18/18 = **100% planned** |
| Production families assigned to category contracts | 74/74 = **100% declared** |
| Supported category contracts represented in Asset Lab | 15/15 = **100% represented** |
| Adversarial contract cases correctly handled | 129/165 = **78.2%** |
| Important scenes with object-level data-driven layout | 1/17 = **5.9%** |
| Fully semantic/prefab-replaceable established art families | 2/73 = **2.7%** (Fishing and Town bins; system fallback excluded) |
| Phase 8A approved runtime slice assets | 0/22 = **0%** (expected input absent) |
| Landscape viewport profiles passing functional containment | 7/7 = **100% emulated** |
| Authoritative visual baseline cases | 10/10 = **100% passing** |
| Adversarial reference-comparison cases | 6/6 = **100% passing** |

Planning and contract declarations are broad; actual production migration and enforceable intake are not.

## F. Scenes and categories not fully migrated

### Object-level migrated pilots

- Fishing: validated layout and semantic background pilot.
- Town bins: family-specific semantic prefab/factory pilot.

### Surface-only or scene-specific presentation remains

- Town (apart from bins and shared character/navigation contracts);
- House Interior;
- Village Grocer;
- Paws & Wonders;
- Harbour General;
- Little Bakery;
- Corner Café;
- Morning Mug;
- Riverside Kitchen;
- South Shore Scoops;
- River Clear-Out;
- House Rescue;
- Waste Collection;
- Lawn Care;
- Beach Cleanup;
- Playground Power Wash (semantic file loading exists, presentation is still scene/Canvas specific).

Boot is an orchestration/loader scene and is not an art-layout migration target.

### Asset categories

All 15 categories have category-level contracts and production-wave assignments. Most category content remains contract-only rather than runtime-integrated: terrain/structures, vegetation, buildings/landmarks, population rigs, animals, UI families, interiors, effects, vehicles, audio, and most minigame packs. Current file-backed semantic runtime coverage is concentrated in the animal reference sheet, Fishing background, and Power Wash files; other current presentation is procedural, generated, legacy, or scene/CSS-defined.

## G. Known limitations

- No physical iOS or Android device was available; mobile results are browser emulation.
- No package-script lint or static type-check gate exists.
- No production artwork was approved, so human visual-quality review and approved-byte promotion were not performed.
- Long-term GPU/thermal behaviour and true low-memory mobile context loss were not physically measured.
- The working tree contains extensive pre-existing changes and untracked audit/artwork material.

## H. Risks before artwork generation

1. Invalid generated assets may pass validation and enter review.
2. A candidate may look correct in Asset Lab/dev Town preview yet be absent from the production game.
3. Scene-specific hard-coded placement may force last-minute scene/CSS edits, causing visual drift.
4. Production Town frame spikes may worsen when layered premium art is added.
5. Documentation may lead an artist to mistake manifest registration for successful gameplay integration.
6. Permissive legacy-key pass-through may allow new bypasses.

## I. Exact remediation order

1. **Repair the contract validator and its CI gate.** Resolve all 36 discrepancies in the fresh evidence set and require the adversarial suite to fail CI on any discrepancy.
2. **Implement the approved Town/Lawn production scene-instance path.** Prove ordinary production gameplay displays a controlled approved fixture through manifest/prefab/layout data only.
3. **Add one production end-to-end vertical-slice readiness test.** It must cover approval digest, build, preload, instantiation, state transition, replacement, geometry, save/reload, shutdown/re-entry, and phone/tablet screenshots without QA overlays.
4. **Meet the production Town p95 budget** using the existing threshold and repeat protocol.
5. **Correct documentation and acceptance gates** so registration, preview, production loading, and production display are separate verifiable stages.
6. **Harden legacy compatibility and observability.**
7. **Repeat this certification.** Only then accept real generated pixels for the controlled slice.

## J. GO / NO-GO

### **NO-GO — CONTROLLED REAL-ART VERTICAL SLICE**

Reason: two critical defects remain: unenforced asset contracts and a missing normal-game Town/Lawn approved-asset consumption path. High-severity scene-layout coverage and production p95 performance issues further increase integration risk.

The next authorized work should be architecture repair and re-certification, not artwork generation or approval.
