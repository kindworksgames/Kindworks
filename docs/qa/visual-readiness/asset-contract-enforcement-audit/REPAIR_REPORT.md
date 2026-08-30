# KindWorks Asset-Contract Enforcement Repair Report

Date: 2026-08-30  
Authoritative defects: `REPORT.md` in this directory  
Branch: `phase-2-ui-simplification`  
Starting commit: `3387bcb48964c41edbdc26f4257d2990fcdaf8d5`  
Gameplay/save contract: unchanged; save schema remains 37

## Result

The asset handoff now has one closed schema-v2 vocabulary, 15 machine-readable category contracts, and a validated one-to-one assignment for all 74 Phase 10 families. Production leaf contracts must name both their family and category; a mismatched or unknown family fails before pack generation. Phase 8A uses the same output/category vocabulary and protects artwork-independent gameplay geometry with a signature.

The system supports full, single-asset, category, and Git-changed validation. The full gate runs before Vite, in the normal post-build checks, and in the repository verification workflow. The current library passes. Nineteen committed mutation descriptors are rejected for their exact documented reasons and cannot be shipped as runtime content.

This repair does **not** fabricate a palette, outline width, material grammar, shadow construction, or texture-density thresholds. Those measured art-style values remain deliberately blocked until the approved Phase 8B slice exists and Phase 9 is completed. Technical pixel rules—format, bit depth, colour mode, alpha, filtering, dimensions, bounds, padding, frame grids and byte budgets—are enforced now.

## Finding disposition

| Finding | Status | Repair and evidence |
| --- | --- | --- |
| KW-AC-001 | **FIXED** | `asset-category-contracts.v2.json` contains 15 closed category templates and 74/74 unique Phase 10 family assignments. Production assets must name a registered family whose category matches; missing, orphaned, duplicate, unknown, and mismatched mappings fail. Families explicitly remain `productionReady:false` until approved leaf values exist, preventing uncontracted generation rather than pretending the art is ready. |
| KW-AC-002 | **FIXED** | Phase 8A now enforces schema version, closed fields, PNG RGB/RGBA output, filtering/trim, canvas and sheet geometry, normalized origin, logical scale, five geometry channels, state/direction sets, variants, animation semantics, file naming, bounds/padding, UI metadata, and protected gameplay geometry. Its adversarial tests pass. |
| KW-AC-003 | **FIXED** | Required states/directions are exact, tokens and IDs are unique, sheet actions/directions/frame order are checked, animation frames must exist, rates are 1–60, and repeat is `-1` or non-negative. |
| KW-AC-004 | **FIXED** | Atlas contracts declare JSON filename, names/count, and no-trim/no-rotation policy. Intake parses real atlas JSON; validates exact names/count, rectangles against the image canvas, transforms, animation membership, safe path, and filename agreement. Real temporary atlas bytes pass; a trimmed frame fails. |
| KW-AC-005 | **BLOCKED** | Technical constraints are fixed: byte inspection enforces PNG/WebP format, RGB/RGBA and 8-bit mode, alpha, exact dimensions, opaque bounds, transparent padding, nearest filtering and budgets. Style constraints (measured palette, outline, material, shadow, lighting and texture density) cannot be truthfully locked before Phase 8B/9; the manifest retains `generationBlockedUntilArtBibleLocked:true`. |
| KW-AC-006 | **FIXED** | Output types are normalized (`spritesheet`, not `sprite-sheet`), schema version is 2, family/category links are executable in both production and Phase 8A, and generated catalog/package freshness is checked. Unknown fields fail instead of creating a competing source of truth. |
| KW-AC-007 | **FIXED** | Production contracts store a SHA-256 digest of collision/navigation/interaction/touch geometry; Phase 8A stores an equivalent deterministic signature. Measured opaque bounds are checked separately from gameplay geometry. Artwork changes cannot silently resize gameplay. |
| KW-AC-008 | **FIXED** | Filename stems, versioned staging/master/runtime roots, format extensions, exact atlas data filename, unique state/variant/direction tokens, and duplicate output ownership are enforced. |
| KW-AC-009 | **FIXED** | `assets:validate`, `--asset`, `--category`, and `assets:validate:changed` are available. Contract-infrastructure changes safely expand changed validation to every asset. `prebuild` and `.github/workflows/verify.yml` run the full release gate. |
| KW-AC-010 | **FIXED** | UI category contracts require semantic label, minimum rendered size, contrast target, safe content insets, and localization expansion metadata. Phase 8A UI contracts enforce a 44×44 minimum and contrast of at least 3:1. |
| KW-AC-011 | **FIXED** | Audio has a closed MP3/OGG/WAV contract with channels, sample rate, duration, loop policy, LUFS target, byte budget, paths and fallback. Header bytes and format are checked; visual-only fields and animations are rejected. Runtime atlas/audio loader coverage remains in the existing asset-pipeline suite. |
| KW-AC-012 | **FIXED** | Findings carry code, message, field path, semantic ID, schema version, expected/actual values, affected scenes and remediation. File-access failures distinguish missing, corrupt/unsupported and unreadable content. |

## Contract and validation coverage

| Surface | Result |
| --- | --- |
| Supported category contracts | **15/15** |
| Phase 10 family assignments | **74/74**, unique and category-checked |
| Current semantic contracts selected by full validation | **23**: one approved production sample plus 22 Phase 8A contracts |
| Invalid mutation descriptors | **19/19 rejected** |
| Current runtime registry | **15 assets, seven files; zero orphan files, zero unused entries** |
| Supported output contracts | static image, tileset, sprite sheet, atlas, layer set, nine-slice, effect sheet, audio |
| Validation modes | one asset, one category, changed assets, full project |

## Legacy-library result

The existing asset library passes the validator. One non-failing duplicate-content warning remains: the approved Fishing runtime image is byte-identical to its protected legacy-reference copy. This is intentional provenance/reference duplication, not a validator defect or an orphan, and neither copy was deleted.

Phase 8A still contains 0/22 approved generated files. Phase 10 therefore reports production execution **BLOCKED** while its structural contract plan passes. This is an honest production-status block, not a failure of the repaired validator.

## Verification evidence

| Gate | Result |
| --- | --- |
| Full asset contracts | **PASS — 15 categories, 74/74 families, 23 semantic contracts** |
| Artwork intake | **PASS — one valid staged/master/runtime sample; 19 invalid mutations rejected** |
| Phase 8A | **PASS — 22 contracts, nine families, 20 prefabs, 20 state maps, 13 animations, 22 placements** |
| Focused repair tests | **PASS — 34/34**, followed by atlas/audio/family additions passing |
| Complete automated suite | **PASS — 734/734** |
| Production build | **PASS — 193 modules** |
| Post-build release validators | **PASS** — performance, production surface, registry, layouts, scale, artwork, Phase 8A, Phase 10 structure, visual baselines |
| Visual regression baselines | **PASS — 10 images, six scene families, five profiles, 81 tracked visual files** |
| Type check | **NOT CONFIGURED** — JavaScript project has no TypeScript/type-check script |
| Lint | **NOT CONFIGURED** — no lint configuration/script exists |

## Files added or materially changed by this repair

- `artwork/contracts/asset-category-contracts.v2.json`
- `artwork/specifications/kindworks-artwork-manifest.v1.json`
- `artwork/fixtures/invalid/*.json`
- `artwork/CONTRACT_AUTHORING.md`
- `artwork/README.md`
- `scripts/lib/assetContractCatalog.mjs`
- `scripts/lib/artworkPipelineValidation.mjs`
- `scripts/export-asset-contract-catalog.mjs`
- `scripts/validate-asset-contracts.mjs`
- `scripts/validate-artwork-pipeline.mjs`
- `scripts/generate-artwork-runtime-packs.mjs`
- `scripts/validate-phase10-production-plan.mjs`
- `scripts/verify-production-surface.mjs`
- `src/visual/artwork/artworkWorkflow.js`
- `src/visual/verticalSlice/phase8aVerticalSlicePackage.js`
- `src/visual/verticalSlice/validatePhase8APackage.js`
- generated Phase 8A/package and artwork runtime outputs
- `tests/asset-contract-enforcement.test.js`
- `tests/visual-readiness-phase-6.test.js`
- `tests/visual-readiness-phase-8a.test.js`
- `.github/workflows/verify.yml`
- `package.json`
- `docs/qa/visual-readiness/phase-01/BASELINE_MANIFEST.json`
- `docs/qa/visual-readiness/phase-06/ARTWORK_PIPELINE.md`

## Remaining risk and next gate

The validator is ready for exact technical asset intake. Production art generation remains blocked only where truthful measured style values do not yet exist. Complete Phase 8B with approved vertical-slice pixels, then run Phase 9 to replace the style block with measured palette, contrast, outline, lighting, shadow, material and texture constraints. Do not waive those values or mass-generate before that gate.
