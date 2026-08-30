# KindWorks Asset-Contract Stage 2 Independent Retest

Date: 2026-08-30  
Branch: `phase-2-ui-simplification`  
Commit inspected: `3387bcb48964c41edbdc26f4257d2990fcdaf8d5`  
Environment: macOS (`darwin`), Node.js 24.19.0  
Mode: independent adversarial retest; no validator or gameplay repair performed

## Verdict

**STAGE 2 NOT COMPLETE — ASSET-CONTRACT VALIDATOR REPAIR REQUIRED.**

The current repository and its existing tests pass, but the stricter independent gate does not. The test runner exercised all 15 declared category templates, all eight declared output types, and every one of the 111 executable error codes present in the category/production validators. Of 165 controlled cases:

- 129 behaved correctly;
- 34 invalid fixtures were accepted (false negatives);
- one valid fixture was rejected (false positive);
- one invalid fixture was rejected for a secondary, misleading reason rather than the contract defect.

The full machine-readable evidence is in `EVIDENCE.json`. Temporary invalid binary fixtures were created under the operating system temporary directory and deleted after each case. No deliberately invalid file was placed in staging, masters, runtime assets, or the production bundle.

## What passed

The following validation areas worked under controlled positive and negative tests:

- manifest, asset, workflow, and contract-policy versions;
- stable semantic IDs and duplicate semantic IDs;
- category/family mismatch and unsupported output/format combinations;
- positive canvas and scale metadata;
- RGB/RGBA/alpha consistency at contract level;
- normalized origin bounds;
- required state/direction lists, duplicate variants, and token syntax;
- sprite-sheet grid, frame count, duplicate frames, actions, directions, animation frame membership, rate, and repeat policy;
- structural atlas names/count and no-trim/no-rotation policy;
- real atlas JSON count, membership, rectangles, and transform checks;
- smoothing, trimming, nearest-neighbour, transparent-padding, visible-bounds, texture budget, and audio byte-budget checks in the supported byte paths;
- required geometry-channel presence and protected gameplay-geometry digest;
- UI accessibility minimums;
- fallback, dependency existence, provenance, scene assignment, production status, and duplicate output ownership;
- all existing 19 committed invalid descriptors;
- all 34 existing focused asset-contract/asset-pipeline tests;
- the existing production asset, runtime registry, Phase 8A package, and production build.

## Coverage reality

The validator reports 15 supported categories and 23 selected semantic contracts. Those 23 contracts actually instantiate only eight categories and two output types:

| Surface | Instantiated by current contracts | Declared but not represented by a current leaf contract |
| --- | --- | --- |
| Categories | minigame, terrain, building, vegetation, prop, character, animal, UI | calibration, system fallback, structure, effect, vehicle, interior, audio |
| Output types | single image (9), sprite sheet (14) | tileset, atlas, layer set, nine-slice, effect sheet, audio |

The independent runner generated controlled contracts for every missing category and output type. This proved that the generic schema can accept their names, but it also exposed missing category/output-specific enforcement. Running category validation for `category.audio` selected zero assets and still returned PASS. A zero-selection category run is therefore not proof that the category works.

## Category contract matrix

`PARTIAL` means the generic base contract works but at least one allowed output or category-specific requirement is not executable.

| Category | Valid specimen | Machine-readable category-specific enforcement | Result |
| --- | --- | --- | --- |
| Calibration | Accepted | Allows layer sets, but layer-set file/alignment contract is absent | PARTIAL |
| System fallback | Accepted | `fallbackPolicy` is named only in catalogue metadata | FAIL |
| Terrain | Accepted | `tileGrid` and `seamPolicy` are not leaf-schema fields; tileset metadata is absent | FAIL |
| Structure | Accepted | Allows layer sets without layer-set file/state contracts | FAIL |
| Vegetation | Accepted | Generic states/anchor/shadow exist; allowed layer-set path remains uncontracted | PARTIAL |
| Prop | Accepted | Generic prop path works; allowed layer-set path remains uncontracted | PARTIAL |
| Effect | Accepted | `blendPolicy`, `lifetime`, and `stateMapping` are not executable | FAIL |
| Vehicle | Accepted | Direction/animation basics work; allowed layer-set path remains uncontracted | PARTIAL |
| Building | Accepted | `stateAlignment` and named `doorSockets` are not enforced | FAIL |
| Character | Accepted | Directional sheet works; no machine-readable rig contract | FAIL |
| Animal | Accepted | Directional sheet works; rig and habitat presentation are not executable | FAIL |
| UI | Accepted | Accessibility basics work; nine-slice margins/safe centre are absent | FAIL |
| Interior | Accepted | `roomGrid` is absent; tileset/layer-set specifics are absent | FAIL |
| Minigame | Accepted | `minigameId` and `stateMapping` are absent; specialised outputs are incomplete | FAIL |
| Audio | Accepted structurally | Corrupt arbitrary bytes are accepted when the extension says OGG | FAIL |

No category satisfies the strict end-to-end Stage 2 gate across every output type it declares as supported.

## Output-type matrix

| Output type | Controlled valid fixture | Controlled invalid fixtures | Result |
| --- | --- | --- | --- |
| Single image | Accepted | Core dimensions/alpha/bounds work; corrupt byte and filesystem-case false negatives remain | PARTIAL |
| Tileset | Accepted without a tile grid | Missing tile size/grid/seam/transition metadata was accepted | FAIL |
| Sprite sheet | Accepted | Structural grid/animation checks work; underlying image-parser defects remain | PARTIAL |
| Atlas | Structural and real JSON fixtures accepted | Count/name/rectangle/trim tests reject correctly; underlying image-parser defects remain | PARTIAL |
| Layer set | Accepted without layer files | Missing layer file, order, state-canvas, and alpha-alignment contract was accepted | FAIL |
| Nine-slice | Accepted without margins | Missing inset/margin/safe-centre metadata was accepted | FAIL |
| Effect sheet | Accepted | Missing blend policy, lifetime, and state mapping was accepted | FAIL |
| Audio | Accepted structurally | Random non-OGG bytes in `.ogg` files were accepted | FAIL |

## Confirmed findings

### AC2-RT-001 — CRITICAL — Category `requiredMetadata` is declarative

The category catalogue lists requirements, but the production leaf schema does not map or enforce several of them. Controlled contracts lacking executable equivalents passed for system fallback, terrain, effect, building, character, animal, interior, and minigame categories.

Examples include terrain tile grids/seams, effect lifetime/blending, character/animal rigs, interior room grids, and minigame state mappings. The catalogue's `requiredMetadata` array is checked only for being a unique array; its values are not connected to asset validation.

### AC2-RT-002 — CRITICAL — Corrupt files can pass byte validation

Four invalid binary cases were accepted:

1. A header-only RGB PNG with no image chunks or pixels.
2. A PNG with a deliberately invalid IDAT CRC.
3. A VP8X WebP header with alpha/dimensions but no image payload.
4. Random text bytes stored under an `.ogg` filename.

The PNG inspector trusts header dimensions and does not verify CRCs. Alpha WebP visible bounds are not decoded. The audio inspector falls back to the declared extension when bytes have no recognised signature. These are false negatives, not merely missing style checks.

### AC2-RT-003 — HIGH — Specialised output schemas are missing

`tileset`, `layer-set`, and `nine-slice` are accepted output-type tokens, but the closed output schema has no fields for tile geometry, layer files/state alignment, or nine-slice margins. Effect sheets similarly lack executable blend/lifetime/state-mapping fields. Invalid incomplete specimens passed without errors.

### AC2-RT-004 — HIGH — Gameplay-geometry digest can protect invalid geometry

The digest detects a change from a stored value, but the geometry itself is not schema-validated beyond a positive visual width/height and the presence of five channels. A collision shape with an unknown kind, string coordinates, and negative size passed after its digest was recomputed. This can faithfully protect malformed geometry rather than proving valid geometry.

Related false negatives include out-of-canvas ground contact, invalid socket IDs, duplicate layer order, unknown layer state, and invalid layer alpha-alignment.

### AC2-RT-005 — HIGH — Dependency, scene-pack, and naming graphs are shallow

Duplicate dependencies, self-dependencies/cycles, and a nonexistent `pack.scene.*` ID passed. Filename stems with spaces/provider-style naming passed when paths merely began with the same text. The booleans `requireAlpha`, `requireExactDimensions`, and `requireUntrimmedFrames`, plus negative runtime budgets, are accepted without validating their contract semantics.

### AC2-RT-006 — HIGH — Current library coverage is overstated by the CLI

Seven of 15 categories and six of eight output types have no current leaf contract. A category command selecting zero assets exits successfully. The message “15 supported categories” means catalogue entries exist, not that every category has a passing production specimen and negative suite.

### AC2-RT-007 — MEDIUM — Valid interlaced RGBA PNG is rejected

A controlled valid interlaced PNG was rejected three times (staging/master/runtime) with `empty-or-uninspectable-alpha`. The message merges two different conditions: an empty alpha image and a parser limitation. Interlaced PNG is not forbidden by the schema or authoring guide, so this is a false positive and a misleading diagnostic.

### AC2-RT-008 — MEDIUM — Case validation is platform-dependent

On the case-insensitive macOS filesystem, files whose physical names were all-uppercase satisfied lowercase manifest paths. The production validator uses file access but does not compare the actual directory entry case. Such a candidate may pass locally and then fail on a case-sensitive deployment filesystem.

### AC2-RT-009 — MEDIUM — Category catalogue schema has loopholes

The catalogue accepted an unsupported image format, a non-boolean requirement flag, and a non-string `requiredMetadata` value. An invalid category ID was rejected only indirectly because family assignments then appeared missing; there is no direct category-ID syntax diagnostic.

## False-positive, false-negative, and messaging review

| Concern | Result |
| --- | --- |
| False negatives | **34 confirmed** |
| False positives | **1 confirmed** — valid interlaced RGBA PNG |
| Wrong/misleading reason | **1 confirmed** — invalid category ID reported as missing family-category links |
| Platform-sensitive parsing | **Confirmed** — exact filename case is not enforced on case-insensitive macOS volumes |
| Documentation-only rules | **Confirmed** — multiple `requiredMetadata` items and specialised output contracts have no executable leaf fields |
| Tests that bypass actual file loading | Existing structural tests are valid for structure but do not cover corrupt RGB PNG, CRC, alpha WebP, corrupt audio, or interlaced PNG |
| Production-only path check | Build resolves the current asset correctly; future wrong-case candidates can still pass locally |

## Existing gates versus independent result

| Gate | Result |
| --- | --- |
| Existing focused contract/pipeline tests | PASS — 34/34 |
| Existing full project tests | PASS — 734/734 |
| Existing full asset-contract CLI | PASS — 23 selected semantic contracts |
| Existing artwork pipeline | PASS — one production sample; 19 committed mutations rejected |
| Existing Phase 8A package | PASS structurally — 22 contract-only assets |
| Production build and post-build validators | PASS |
| Independent adversarial fixture matrix | **FAIL — 34 false negatives, one false positive, one wrong-reason failure** |

The existing library is not shown to contain a broken current asset. The failure is that the validator cannot reliably keep future invalid artwork out.

## Required repair before Stage 2 can pass

1. Map every category requirement to a closed, typed leaf schema and validate it; remove catalogue tokens that have no executable definition.
2. Add output-specific schemas for tilesets, layer sets, nine-slices, and effect sheets.
3. Use full PNG/WebP/audio decoding or strict format parsers that validate complete payloads, CRC/container integrity, dimensions, alpha, and decodable pixels/audio metadata.
4. Decide and document interlace support. Either support it correctly or reject it with a specific `unsupported-interlace` contract error before opaque-bounds inspection.
5. Validate geometry shape enums, numeric coordinates/sizes, bounds, ground contacts, socket IDs, layer order/state/alignment, and geometry references before hashing.
6. Validate dependency uniqueness, self/cycles, and scene-pack existence.
7. Enforce exact filename grammar and directory-entry case on all platforms.
8. Validate requirement booleans and positive byte budgets; do not allow contradictory declared policies.
9. Reject category validation when the selected category contains zero testable leaf contracts, or label it explicitly as `UNTESTED` rather than PASS.
10. Add at least one valid and a complete negative fixture set for every supported category/output type to the normal verification workflow.
11. Add the independent binary fixtures as generated temporary tests, never as production assets.
12. Rerun this exact 165-case suite and require zero false negatives, zero false positives, and zero wrong-reason outcomes.

## Evidence and reproducibility

- Audit runner: `scripts/audit-asset-contract-stage2.mjs`
- Machine-readable results: `docs/qa/visual-readiness/asset-contract-stage-2-independent-retest/EVIDENCE.json`
- The runner creates all binary fixtures under the system temporary directory and removes them in `finally` blocks.
- All 111 executable error-code paths from `artworkPipelineValidation.mjs` and `assetContractCatalog.mjs` are represented by an expected or observed fixture code.

Run:

```text
node scripts/audit-asset-contract-stage2.mjs
node --test tests/asset-contract-enforcement.test.js tests/asset-pipeline-repair.test.js tests/visual-readiness-phase-6.test.js tests/visual-readiness-phase-8a.test.js
pnpm run assets:validate
pnpm run artwork:check
pnpm run phase8a:check
pnpm test
pnpm run build
```

## Final gate

The requested acceptance condition is not met. Every supported category has a catalogue entry, but not every category has an executable, category-specific, negative-tested contract, and the validator does not reliably reject invalid files.

**Final verdict: STAGE 2 NOT COMPLETE.**
