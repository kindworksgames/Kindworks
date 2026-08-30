# Phase 6 — Generator-Neutral Artwork Production and Integration

Date: 2026-08-30  
Branch: `phase-2-ui-simplification`  
Starting commit: `3387bcb48964c41edbdc26f4257d2990fcdaf8d5`  
Pilot asset: `scene.fishing.reedbank.background`

## Verdict

**PHASE 6 PASS.**

KindWorks now has a versioned, generator-neutral artwork specification, staged/master/runtime separation, legal workflow transitions, binary metadata validation, deliberate negative fixtures and deterministic runtime-pack generation. The valid sample reaches the existing Fishing scene through its semantic ID without editing `FishingScene` or changing gameplay.

The sample is a byte-identical copy of the already-approved Reedbank background. No new or replacement artwork is being approved by this proof.

## Implementation

- Complete JSON asset specification with the requested production, art, geometry, animation and provenance fields.
- Safe status flow from specification through verification, including revision loops.
- Separate versioned staging, source/master and optimized runtime locations.
- Native PNG and WebP header inspection for dimensions and alpha.
- Exact filename, format, unique-ID, file, state/layer, frame-grid, frame-count, action/direction, atlas, anchor/socket, art-bible, geometry, dependency, fallback, texture-budget, orphan and generated-pack checks.
- Explicit rejection of smoothing and automatic frame trimming.
- Deterministic pack generator; hand edits or stale output fail post-build.
- Runtime registry consumes the generated Fishing pack and versioned runtime file.
- Credential/cache paths are excluded from version control.

## Deliberate validation proof

| Fixture | Defect | Required rejection | Result |
| --- | --- | --- | --- |
| Valid Reedbank | 720×405 opaque WebP, 320,228 B | Accept | PASS |
| Invalid size | Declares 721×405 | `dimension-mismatch` | REJECTED correctly |
| Invalid frame | Two grid cells, one frame-order entry | `frame-count-mismatch` | REJECTED correctly |
| Invalid alpha | Requires alpha from opaque WebP | `alpha-mismatch` | REJECTED correctly |
| Invalid state | Adds `dirty` without aligned layer | `missing-layer-state` | REJECTED correctly |
| Invalid ID | Provider/display label used as ID | `invalid-semantic-id` | REJECTED correctly |
| Duplicate ID | Repeats semantic identity | `duplicate-semantic-id` | REJECTED correctly |

## Runtime proof

The generated module selects:

`/assets/runtime/scene/fishing/fishing-reedbank-background.v1.webp`

The central visual registry reads that generated entry. `FishingScene` still contains only the semantic call:

`queuePhaserAsset(this, VISUAL_ASSET_IDS.FISHING_REEDBANK_BACKGROUND)`

It contains no staging, master, runtime filename or provider reference. The development Fishing route reached `FishingScene`, reported its reference overlay ready, displayed the approved artwork rather than a fallback and logged no warning/error. At 568×320 the 1280×720 pixel-art canvas fitted to 568×319.5 with no warning/error.

Evidence:

- [Integrated live Fishing](evidence/fishing-generated-pack-live-1280x720.jpg)
- [Integrated reference overlay](evidence/fishing-generated-pack-overlay-1280x720.jpg)

## Acceptance gate

| Requirement | Evidence | Result |
| --- | --- | --- |
| Valid staged sample reaches game without scene edit | Generated pack → semantic registry → unchanged Fishing semantic loader; live browser proof | PASS |
| Invalid size fails correctly | Three file roles report `dimension-mismatch` | PASS |
| Invalid frame fails correctly | `frame-count-mismatch` | PASS |
| Invalid alpha fails correctly | `alpha-mismatch` | PASS |
| Invalid state fails correctly | `missing-layer-state` | PASS |
| Invalid ID fails correctly | `invalid-semantic-id`; duplicate identity independently rejected | PASS |
| No direct overwrite | Three distinct paths and versioned runtime filename | PASS |
| Generator-neutral/no secrets | Stable semantic IDs, provider-neutral pack, ignored credential/cache paths | PASS |
| No smoothing/trimming | Specification plus validator and tests | PASS |
| Loader packs generated from manifest | Deterministic generated-module equality and post-build check | PASS |
| Saves/gameplay unchanged | Protected schema-37 digest and complete regression/parity suite | PASS |

## Verification

| Check | Result |
| --- | --- |
| Phase 2 + Phase 6 focused tests | PASS — 16/16 |
| Artwork pipeline validator | PASS — 1 valid sample, 6 invalid samples rejected |
| Visual registry | PASS — 15 assets, 7 files, 6 prefabs, 4 packs |
| Complete automated suite | PASS — 693/693 |
| Minigame parity | PASS — 14 games, 75 comparisons, 105,795 generated instances |
| Differential HTML parity | PASS — 13 activities, 5,850 levels, 19 domains, 85 exact rules |
| Production build | PASS — 196 modules, 19 lazy chunks |
| Production surface | PASS — 24 development-only markers absent |
| Performance budget | PASS — initial 3,078,837 B; Phaser 1,374,829 B; total JS 4,851,558 B |
| Visual baselines | PASS — 10 images, 6 families, 5 profiles, 72 source files |
| Browser runtime | PASS — Fishing 1280×720 and 568×320; no warning/error |

## Remaining scope

- Only one deliberately safe asset uses the Phase 6 production workflow. Other registered and legacy assets remain in their documented prior-phase state.
- No external generator was invoked and no provider integration or credentials were added.
- Atlas parsing is validated at the specification-agreement level; no current pilot atlas exists to inspect.
- Browser testing is emulation, not physical-device testing.
- The pre-existing extended Town clone-memory risk recorded in Phase 5 is unchanged and outside this artwork-pipeline scope.

## Files changed for Phase 6

- `.gitignore`
- `artwork/README.md`
- `artwork/specifications/kindworks-artwork-manifest.v1.json`
- `artwork/staging/scene/fishing/reedbank-background/v1/`
- `artwork/masters/scene/fishing/reedbank-background/v1/`
- `artwork/fixtures/invalid/`
- `public/assets/runtime/scene/fishing/`
- `src/visual/artwork/artworkWorkflow.js`
- `src/visual/generated/artworkRuntimePacks.js`
- `src/visual/visualManifest.js`
- `src/visual/index.js`
- `scripts/lib/artworkPipelineValidation.mjs`
- `scripts/lib/artworkRuntimePackGenerator.mjs`
- `scripts/generate-artwork-runtime-packs.mjs`
- `scripts/validate-artwork-pipeline.mjs`
- `tests/visual-readiness-phase-6.test.js`
- `package.json`
- `docs/qa/visual-readiness/phase-06/`
- `docs/qa/visual-readiness/README.md`

Pre-existing dirty-worktree changes were preserved. No commit or push was performed.
