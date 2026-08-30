# KindWorks final visual-readiness certification repair

Date: 2026-08-30  
Source backlog: `final-architecture-certification/REPORT.md`  
Scope: confirmed blocker, critical, high, and production-scale medium findings; no artwork approval, gameplay redesign, economy change, or save reset

## Result

The two critical defects and the production/runtime high-severity defects are repaired. The project now fails closed on validator discrepancies, can instantiate human-approved semantic Town/Lawn definitions during ordinary gameplay, passes the immutable visual baseline gate, and exposes read-only performance metrics only in an explicit instrumented test build.

Object-level layout extraction for the remaining 16 scene families is intentionally not represented as complete. It is a production migration programme, not a safe single-batch correction: moving thousands of presentation literals at once would violate the repository's one-family-at-a-time migration rule and make gameplay-geometry regressions harder to isolate. The generic production scene-instance path is now in place; further scene-family extraction must proceed behind the existing visual, geometry, save, and viewport gates.

No disposable proof received human approval. The final approval registry contains zero assets and all temporary staging/reference files were removed.

## Finding disposition

| Finding | Status | Correction and evidence |
|---|---|---|
| VR-CERT-001 — validator false results | **FIXED** | Full image decoding, audio signature inspection, exact-case traversal, closed metadata schemas, category/output rules, geometry/anchor/socket/layer/state checks, dependency/cycle checks and actionable diagnostics were added. The adversarial command now exits non-zero for any false positive, false negative, wrong reason or uncovered executable rule. Final evidence: **167/167**, 15 categories, eight output types, **134/134 executable error codes**, zero discrepancies. |
| VR-CERT-002 — approved slice absent from ordinary Town/Lawn | **FIXED** | `ApprovedSceneVisualRuntime` queues semantic scene packs, creates animations, resolves active scene instances through prefabs/states/bindings, locks gameplay geometry and cleans up on shutdown. Town actor/NPC/animal/state bindings and Lawn grid/mower/weed bindings live in presentation adapters rather than scene-specific asset code. The accessible DOM Lawn board resolves approved sheets semantically and rejects candidates. Tests prove manifest-only replacement preserves position/geometry and both normal scenes use the generic bootstrap without Phase 8A IDs. |
| VR-CERT-003 — important scene presentation remains hard-coded | **DEFERRED WITH JUSTIFICATION** | The generic path and protected migration gates are ready, but 16 scene families remain surface-layout-only. The certification itself prescribes one family at a time after the bootstrap. Mass-converting 7,770 occurrences in this repair would be an unsafe layout rewrite. This remains a mandatory wave-by-wave condition before mass artwork migration; it does not block intake of the bounded Town/Lawn slice. |
| VR-CERT-004 — production Town p95 | **FIXED** | Town advances NPC/municipal simulation on a bounded cadence using accumulated elapsed time. NPC/animal presentation is projected only when that simulation advances; off-camera NPC rendering is culled without changing routes or interaction positions. Dense touch devices use a stable 30 Hz render policy and cache only the non-interactive, sub-character static backdrop into two render tiles; live houses, lawns, characters, interactions and gameplay geometry remain separate. Across three independent 30-second production runs, mean frame time improved from **22.16 ms** to **17.36 ms** and worst-run p95 from **35.10 ms FAIL** to **33.30 ms PASS** at the unchanged 33.34 ms gate. The 4× constrained mean improved from **48.48 ms** to **34.63 ms**. No console/resource errors occurred, and the immutable visual gate passes 10/10. |
| VR-CERT-005 — documentation overstates readiness | **FIXED** | The runtime guide now distinguishes registration, candidate preview, human approval, production loading, instantiation and verified display. Historical workflow reports carry explicit clarification notes; the Phase 8B intake report records that runtime architecture is ready while real artwork remains 0/22 and unapproved. |
| VR-CERT-006 — permissive legacy pass-through | **FIXED** | Six known mappings remain explicit. Unknown keys are counted as migration debt, create a structured development warning, and are audited in production source. `audit-legacy-compatibility.mjs` is part of prebuild and CI; current result: six mappings, zero unknown literal bypasses. |
| VR-CERT-007 — production observability | **FIXED** | `TestMetricsBridge` exposes read-only FPS/texture/scene-child/timer/approved-visual counts only when compiled with `VITE_KW_TEST_METRICS=1`. Normal production contains zero bridge markers; the separate instrumented bundle contains one. There are no controls and no save/state mutation API. |
| VR-CERT-008 — low-risk debt | **DEFERRED WITH JUSTIFICATION** | Duplicate Fishing bytes are intentional reference provenance and remain a validator warning; Asset Lab facet polish and desktop-only 32 px controls do not threaten the controlled slice; the required-asset fallback remains safe and structured despite browser retry noise. None was hidden or reclassified as fixed. |

## Verification evidence

- Complete automated suite: **825/825 PASS**, 0 failed.
- Production build: **PASS**, including performance budget and 39-marker production-surface exclusion.
- Asset contracts: **PASS**, 15 categories and all 74 Phase 10 families.
- Adversarial validator: **167/167 PASS**; no false results or uncovered executable codes.
- Legacy audit: **PASS**, six explicit mappings and zero unknown literal production bypasses.
- Visual comparison: **10/10 PASS** against immutable baselines; baselines were not modified.
- Device matrix: **7/7 profiles PASS** (568×320, 667×375, 844×390, 960×600, 1024×768, 1180×820, 1366×768); 21 repeated transitions; no overflow, clipped controls, sub-44 required targets, runtime errors or failed resources in the normal matrix.
- Orientation: Lawn safely blocks portrait; River safely blocks landscape and runs in portrait.
- Context recovery: WebGL loss/restoration returned to active Town without state loss.
- Controlled replacement: fresh `prop.town.slice.rubbish-can` candidate validated from real bytes, used a data-only `(7,-5)` offset and explicit reference, rendered in live Town at desktop/phone/tablet, reloaded with identical geometry/placement/durable state, then was fully removed. No human approval was asserted.
- Production Town, authoritative three-run/30-second harness: mean **17.36 ms**; independent-run p95 values **18.50**, **18.60**, and **33.30 ms**; unchanged 33.34 ms target **PASS**; zero console/resource failures. The 4× CPU-constrained mean is **34.63 ms**, improved from 48.48 ms before repair.
- Production observability exclusion: normal bundle markers `0`; instrumented test bundle markers `1`.
- Save protection: controlled replacement reload plus the full fresh/legacy/mid-progress/completed/missing-asset regression matrix passed.

## Files changed by this repair

Validator and release gates:

- `scripts/lib/artworkPipelineValidation.mjs`
- `scripts/lib/assetContractCatalog.mjs`
- `scripts/audit-asset-contract-stage2.mjs`
- `scripts/audit-legacy-compatibility.mjs`
- `scripts/generate-artwork-runtime-packs.mjs`
- `artwork/specifications/kindworks-artwork-manifest.v1.json`
- `package.json`
- `.github/workflows/verify.yml`

Production semantic rendering:

- `src/visual/VisualRegistry.js`
- `src/visual/LegacyCompatibility.js`
- `src/visual/renderers/PhaserPrefabRenderer.js`
- `src/visual/renderers/ApprovedSceneVisualRuntime.js`
- `src/presentation/TownApprovedSceneBindings.js`
- `src/presentation/LawnApprovedSceneBindings.js`
- `src/presentation/LawnApprovedDomVisuals.js`
- `src/scenes/TownScene.js`
- `src/scenes/LawnCareScene.js`
- `src/style.css`
- `src/visual/verticalSlice/phase8aVerticalSlicePackage.js`
- generated Phase 8A/runtime-pack outputs

Performance and QA:

- `src/entities/NpcCharacter.js`
- `src/visual/renderers/VisualViewportCulling.js`
- `src/visual/ResponsiveFramePolicy.js`
- `src/qa/TestMetricsBridge.js`
- `src/qa/VisualCaptureRuntime.js`
- `scripts/build-test-metrics.mjs`
- `scripts/measure-production-town.mjs`
- `scripts/profile-town-breakdown.mjs`
- `scripts/verify-controlled-replacement-runtime.mjs`
- focused regression tests for each repaired path

Documentation:

- `src/visual/README.md`
- this report
- clarified Phase 8B and artwork-workflow reports

## Remaining risk and gate

- Real premium-slice artwork remains **0/22 approved**. This is a content/approval input, not a missing runtime path.
- Physical phones/tablets were unavailable; all device evidence is browser emulation and is labelled accordingly.
- Scene-family object-layout migration remains mandatory before mass generation. Each family must be migrated and certified independently.

**Decision: GO for human-reviewed generated-art intake for the bounded Town/Lawn vertical slice. NO-GO for mass artwork migration until the remaining scene families complete object-level layout extraction and their individual regression gates.**
