# KindWorks Asset-Contract Enforcement Audit

Date: 2026-08-30  
Branch: `phase-2-ui-simplification`  
Starting commit: `3387bcb48964c41edbdc26f4257d2990fcdaf8d5`  
Mode: audit only; no production code or artwork changed  
Verdict: **NOT READY — CONTRACT ENFORCEMENT REPAIR REQUIRED BEFORE PRODUCTION ART INTAKE**

## Executive result

KindWorks has a sound architectural direction, but it does **not** yet provide an enforceable production asset contract for every asset category.

There are three separate contract surfaces:

1. `src/visual/visualManifest.js` is the live runtime registry. It contains 15 assets and has strong file, cache-key, atlas-reference, lifecycle, and fallback checks.
2. `artwork/specifications/kindworks-artwork-manifest.v1.json` is the generator-neutral production specification. It contains exactly one approved sample: the Fishing background.
3. `artwork/production/phase-8a/vertical-slice-production-package.v1.json` contains 22 detailed slice specifications across nine families. These are contract-only placeholders; Phase 8B has 0/22 approved assets.
4. `artwork/production/phase-10/production-migration-plan.v1.json` assigns all scenes and catalogues to 74 production families, but those entries are plans, not exact asset contracts.

The production-spec validator correctly rejects wrong dimensions, basic frame-count errors, undeclared frame directions, an empty state set, out-of-range anchors, alpha mismatch, byte-budget overflow, invalid semantic IDs, smoothing, unsupported file formats, and missing files. It does **not** enforce required named states/directions, transparent-padding limits, ID-derived filenames, duplicate variants, animation frame rate, atlas frame membership, colour mode, or whole-game contract completeness.

The Phase 8A report says that exact directions, states, origins, formats, frame rates, and validation rules are protected. Adversarial tests show that several of those fields are present but not executable: the Phase 8A validator accepted invalid origin, unsupported format, missing required direction, missing required state, duplicate variant, invalid frame rate, and excessive-padding fixtures.

The production art bible is explicitly blocked in `docs/qa/visual-readiness/phase-09/REPORT.md`. Therefore palette, outline, material, lighting, shadow, texture density, and final accessibility/readability constraints cannot yet be machine-enforced without inventing values.

## Authoritative surfaces inspected

| Surface | Purpose | Current coverage | Result |
| --- | --- | ---: | --- |
| `src/visual/contracts.js` | Runtime kinds, requiredness, lifecycle, geometry primitives | Global runtime primitives | PARTIAL |
| `src/visual/validateVisualManifest.js` | Runtime registry/file validation | 15 runtime assets, 4 scene packs | PASS for registered runtime scope |
| `scripts/lib/artworkPipelineValidation.mjs` | Generator-neutral production-file validation | 1 asset | PARTIAL |
| `artwork/specifications/kindworks-artwork-manifest.v1.json` | Production artwork source of truth | 1 Fishing sample | FAIL for whole-game coverage |
| `src/visual/verticalSlice/validatePhase8APackage.js` | Phase 8A contract and placeholder validation | 22 slice assets, 9 families | PARTIAL |
| `artwork/production/phase-8a/vertical-slice-production-package.v1.json` | Detailed vertical-slice handoff | 22 specified, 0 generated/approved | PARTIAL |
| `scripts/lib/phase10ProductionPlanValidation.mjs` | Whole-game production-plan coverage | 74 families, 18 scenes | PASS as a plan only |
| `artwork/production/phase-10/production-migration-plan.v1.json` | Dependency-ordered full-game catalogue | 74 families | FAIL as an exact contract catalogue |
| `docs/qa/visual-readiness/phase-09/REPORT.md` | Art-bible lock status | Phase 8B 0/22 | BLOCKED by design |

## Contract-field enforcement matrix

`Declared` means data can be written. `Enforced` means a deliberately invalid fixture is rejected for that exact reason before runtime.

| Contract field | Runtime registry | Production spec | Phase 8A | Result |
| --- | --- | --- | --- | --- |
| Stable asset ID | Enforced | Enforced | Enforced | PASS |
| Category/subtype | Asset kind enforced; category absent | Category required, value not enumerated | Family required; family shape shallow | PARTIAL |
| File format | PNG/WebP/audio enums enforced | PNG/WebP enum and bytes enforced | Present but value not validated | PARTIAL |
| Exact canvas width/height | Declared and file-checked | Declared and file-checked | Positive dimensions/grid checked | PASS within registered scope |
| Maximum visible/opaque bounds | Gameplay geometry separate | Visual logical bounds only | Declared geometry only | FAIL |
| Transparency | File alpha checked | File alpha checked | Checklist only; no candidate files yet | PARTIAL |
| Anchor/origin | Prefab-dependent | Normalized anchor range enforced | Present but numeric validity not enforced | PARTIAL |
| World scale / pixels per unit | Prefab/scale system | Required object, values not deeply validated | Present, values not deeply validated | PARTIAL |
| Perspective | Not a runtime file concern | Required prose, not enumerated | Family/asset prose, not validated | FAIL as enforceable contract |
| Facing directions | Generated keys/frame refs checked | Declared-use consistency only | `requireDirections` ignored | FAIL |
| Required states/variants | State-map references checked | Non-empty states and layer coverage only | `requireStateNames` ignored; variant schema absent | FAIL |
| Frame dimensions/count/order | Grid/range checks | Grid/count/order checks | Grid/count/order checks | PARTIAL; uniqueness/semantic order absent |
| Frame rate / loop | Stored but range/loop rules absent | Stored but not validated | Stored but not validated | FAIL |
| Padding/spacing/trim | No pixel-padding inspection | Trim false enforced; padding/spacing absent | Untrim checklist only | FAIL |
| Shadow policy | Prefab-specific | Required art-rule prose | Family rule present | FAIL as machine validation |
| Palette/colour constraints | Absent | Prose only; colour mode absent | Prompt prose only | FAIL; Phase 9 blocked |
| Texture filtering | Pixel-art intent present | `smoothing:false` enforced | `requireNearestNeighbour` ignored | PARTIAL |
| File-size limit | Enforced for registered file assets | Runtime export budget enforced | Budget declared, not file-tested in 8A | PARTIAL |
| Required metadata/provenance | Schema versions/fingerprints | Core provenance required | Production status/provenance shallow | PARTIAL |
| Collision/interaction references | Strong separation in prefabs | Five channels must exist; only visual size checked | Channels present; values shallow | PARTIAL |
| Accessibility/readability metadata | Not part of contracts | Absent | Absent | FAIL for UI assets |

## Asset-category coverage

Phase 10 assigns every known scene dependency to a wave, but a wave assignment is not an enforceable asset contract. A category is `PASS` only if all intended assets have exact, machine-validated contracts.

| Asset category | Existing exact specifications | Whole-category enforcement | Status |
| --- | --- | --- | --- |
| World terrain / grass / soil / lawn states | Phase 8A grass and four-state lawn | Other terrain and transition families remain Phase 10 plans | PARTIAL |
| Roads / pavement / paths | Phase 8A road and pavement samples | Topologies, markings, path transitions not contracted | PARTIAL |
| Bridges / rivers / ponds / beaches / shorelines | Phase 8A river-edge sample | Water, banks, ponds, docks, bridges, beach kits are plans | PARTIAL |
| Houses and buildings | One Phase 8A cottage with four states | Five house families/personal-home levels not contracted | PARTIAL |
| Interiors | None in production spec or Phase 8A | Ten Phase 10 families are planning entries only | FAIL |
| Shops and venues | None | Shopfronts and venue interiors are planning entries only | FAIL |
| Landmarks | None | Assemblies/restoration layers are planning entries only | FAIL |
| Trees / crops / flowers / fences / decorations | Phase 8A oak layers, fence, planter | Crops, full tree catalogue, transitions, landmarks incomplete | PARTIAL |
| Rubbish / dirt / stains / cleanliness states | Phase 8A rubbish can; runtime bin pilot | Shared rubbish, grime, masks, clean/dirty overlays incomplete | PARTIAL |
| Player characters | Phase 8A resident sheet contract | Appearance/clothing/expression families not contracted | PARTIAL |
| NPCs | One Phase 8A resident sheet contract | Population/identity/expressions not contracted | PARTIAL |
| Animals and pets | One Phase 8A dog; one runtime legacy sheet | 37 species/56 identities and rig variants not contracted | PARTIAL |
| Tools / vehicles / equipment | Runtime Power Wash tools; Phase 8A mower | General equipment and municipal vehicle families incomplete | PARTIAL |
| Shop and inventory items | None | Catalogue is mapped to waves, not leaf asset contracts | FAIL |
| Minigame artwork | Fishing sample, Power Wash runtime assets, Lawn Phase 8A | Remaining minigame packs have no exact contracts | PARTIAL |
| UI components / icons / panels | Two Phase 8A UI sheets | Full UI families and readability metadata not contracted | PARTIAL |
| Particles and visual effects | Phase 8A reward burst | Full environment/feedback effect families incomplete | PARTIAL |
| Sprite sheets / atlases | Basic sheet enforcement; runtime atlas references | Production atlas frame validation incomplete; schemas disagree on `spritesheet` vs `sprite-sheet` | PARTIAL |
| Audio | Runtime kind/format support exists, with zero registered audio contracts | Production artwork schema accepts only PNG/WebP | FAIL |

Complete whole-game enforceable family coverage is **0/74 Phase 10 families**. The 74/74 figure reported by `phase10:check` is planning/dependency coverage, not production-contract coverage. Phase 8A declaration coverage is 22/22 for the bounded slice, but enforcement is partial and artwork approval coverage is 0/22.

## Audit requirements

| # | Requirement | Status | Evidence |
| ---: | --- | --- | --- |
| 1 | Every category has an explicit contract | FAIL | Only one production-spec asset and 22 bounded slice specs; many categories are plan-only. |
| 2 | Contracts are machine-readable | PARTIAL | JSON/JS definitions exist, but no unified formal schema and much of Phase 10 is prose scope. |
| 3 | Schemas and documentation agree | FAIL | Phase 8A report overstates enforcement; output type vocabulary also differs (`sprite-sheet` vs `spritesheet`). |
| 4 | Validators enforce contracts, not existence only | PARTIAL | Strong file checks; nine adversarial semantic/visual contract cases were accepted. |
| 5 | Validation works before runtime | PARTIAL | Standalone commands and `postbuild` run before deployment; no prebuild gate and incomplete contract checks. |
| 6 | Errors are actionable | PARTIAL | Codes/path/asset ID exist; production errors lack expected/actual/affected-scene fields present in runtime diagnostics. |
| 7 | Batch validation | PASS | Full artwork manifest, runtime registry, Phase 8A package, and Phase 10 plan validate in batch. |
| 8 | Changed-only validation | FAIL | No changed-file/dependency-aware command or cache exists. |
| 9 | Normal verification/CI runs validation | PARTIAL | `postbuild` runs all validators; repository has no `.github` workflow or other CI configuration. |
| 10 | Sheets/atlases/directions/variants/states/alpha | FAIL | Basic grid/alpha checks pass; required sets, variants, rates, atlas membership, padding, and colour mode are incomplete. |
| 11 | Visual metadata separated from gameplay | PASS architecturally | Registry/prefab/layout geometry is separate; protected regression tests pass. |
| 12 | Visual replacement can preserve gameplay contract | PARTIAL | Fishing and bin proofs pass; no maximum-visible-bounds or geometry-digest gate covers all replacements. |

## Deliberately invalid fixture results

All mutations were in-memory or under `/private/tmp`. No invalid fixture or artwork was added to production content.

| Invalid fixture | Expected | Actual | Validator evidence |
| --- | --- | --- | --- |
| Wrong dimensions | Reject | REJECT | `dimension-mismatch` |
| Wrong frame count | Reject | REJECT | `frame-count-mismatch` |
| Direction used by frame but undeclared | Reject | REJECT | `unknown-frame-direction` |
| Required direction omitted but not referenced by a frame | Reject | **ACCEPT** | `validation.requireDirections` is ignored |
| Empty state set | Reject | REJECT | `missing-states` |
| Required named state omitted | Reject | **ACCEPT** | `validation.requireStateNames` is ignored |
| Incorrect normalized origin | Reject | REJECT in production spec | `invalid-anchor` |
| Incorrect Phase 8A origin | Reject | **ACCEPT** | Phase 8A validates presence, not numeric range |
| Non-transparent file where alpha required | Reject | REJECT | `alpha-mismatch` |
| Excess transparent padding | Reject | **ACCEPT** | No opaque-bounds/padding inspection |
| Oversized runtime file | Reject | REJECT | `texture-budget-exceeded` |
| Incorrect semantic ID | Reject | REJECT | `invalid-semantic-id` |
| Filename unrelated to semantic ID | Reject | **ACCEPT** structurally | Only root and extension are checked |
| Duplicate variant | Reject | **ACCEPT** | No variant schema |
| Animation frame rate `0` | Reject | **ACCEPT** | Frame-rate range not validated |
| Animation frame absent from declared atlas | Reject | **ACCEPT** in production spec | Runtime registry catches it later as `missing-animation-frame` |
| Linear/smoothed pixel filtering | Reject | REJECT | `smoothing-forbidden` |
| Unsupported GIF format | Reject | REJECT | `invalid-output-format` |
| Unsupported CMYK colour mode | Reject | **ACCEPT** | Colour mode/bit depth not inspected |
| Empty artwork manifest / missing whole-game contract | Reject | **ACCEPT** | No catalogue-to-contract completeness gate |
| Contract points to missing file | Reject | REJECT | `missing-artwork-file` |

The separate Phase 8A adversarial run also accepted missing required directions, missing required states, invalid frame rate, duplicate variant, excess padding, invalid origin, and unsupported format. It rejected a removed slice asset only because the package has a hard-coded 22-ID list.

## Severity-ranked findings

### KW-AC-001 — BLOCKER — Whole-game contract coverage is absent

- **Expected:** every Phase 10 family resolves to exact leaf contracts before generation.
- **Actual:** 74 families are assigned to waves, but none is a complete family-level production contract; the production manifest contains one sample.
- **Reproduction:** remove the sole production asset and run `validateArtworkManifest`; the empty manifest passes.
- **Risk:** generated content can enter an uncontracted category with no enforceable scale, states, frames, palette, geometry, or naming rules.

### KW-AC-002 — CRITICAL — Phase 8A validation checklist is declarative, not executable

- `requireDirections`, `requireStateNames`, `requireNearestNeighbour`, origin values, output format, frame rate, and padding rules are not enforced by `validatePhase8APackage`.
- Seven deliberately invalid Phase 8A mutations passed.
- The Phase 8A report's acceptance language is stronger than the validator's actual protection.

### KW-AC-003 — HIGH — Required animation/state/direction semantics are not enforced

- Production validation checks only used-frame consistency and non-empty state lists.
- It does not enforce complete directional sets, required named states, unique frame order, positive frame rates, loop policy, or duplicate animation IDs.

### KW-AC-004 — HIGH — Atlas production contracts are incomplete

- Runtime validation catches missing atlas frames.
- The generator-neutral production validator accepts an animation frame missing from the declared atlas metadata.
- Atlas JSON shape, frame rectangles, trim/rotation, padding, and source-image agreement are not validated during art intake.

### KW-AC-005 — HIGH — Pixel-content constraints are mostly prose

- No colour-mode/bit-depth/profile validation.
- No opaque-bounds or transparent-padding measurement.
- No palette, outline, material, shadow, texture-density, or contrast enforcement.
- Phase 9 correctly remains blocked, so final art-style values must not be fabricated.

### KW-AC-006 — HIGH — Competing schemas can drift

- Runtime, Phase 6 artwork, Phase 8A, and Phase 10 use separate validators and different vocabularies.
- Example: production uses `spritesheet`; Phase 8A uses `sprite-sheet`.
- No schema-composition test proves that a Phase 8A contract can be promoted into the production manifest without translation loss.

### KW-AC-007 — HIGH — Replacement bounds are not proven safe

- Gameplay geometry is architecturally separate, which is good.
- The validator does not compare measured opaque bounds against maximum visible bounds or assert a protected gameplay-geometry digest for every replacement.
- A technically correct canvas can contain artwork whose visible mass obscures interactions or shifts perceived contact.

### KW-AC-008 — MEDIUM — Filename and variant naming rules are unenforced

- Exact output roots/extensions and duplicate full paths are checked.
- Semantic-ID-to-filename convention, state/variant naming vocabulary, duplicate variants, and case normalization are not part of production validation.

### KW-AC-009 — MEDIUM — No incremental validation or CI gate

- Full batch commands exist and run in `postbuild`.
- There is no changed-asset command, dependency-aware validation cache, or repository CI workflow.

### KW-AC-010 — MEDIUM — UI accessibility metadata is absent

- UI contracts do not declare minimum rendered icon size, contrast target, safe text-free region, localization expansion allowance, or accessible semantic label.
- Touch geometry exists elsewhere, but it is not linked as a required UI-art contract.

### KW-AC-011 — MEDIUM — Audio is not supported by the production handoff schema

- The runtime registry supports MP3/OGG/WAV.
- The production artwork validator accepts only PNG/WebP and no production audio contract exists.

### KW-AC-012 — LOW — Production error diagnostics are less complete than runtime diagnostics

- Production errors contain code, message, path, and asset ID.
- They do not consistently include expected value, actual value, contract version, affected scene, and suggested remediation.

## Exact repair specification

1. **Create one versioned contract schema.** Define reusable base and category-specific schemas for image, tileset, sheet, atlas, layered set, nine-slice, font/UI, effect, and audio. Use one output-kind vocabulary across Phase 6, Phase 8A, runtime packs, and Phase 10.
2. **Turn Phase 10 coverage into an executable gate.** Every one of the 74 families must reference a contract template and an explicit leaf/variant inventory. Fail missing, orphaned, and duplicate ownership. An empty production manifest must fail once production intake is enabled.
3. **Promote Phase 8A checklist fields into validation.** Enforce exact required states, directions, layers, variants, output type/format, anchors, sockets, scale values, geometry shapes/bounds, nearest-neighbour setting, byte budgets, and state-to-frame mapping.
4. **Complete animation validation.** Require unique animation IDs/frame names, positive bounded frame rates, valid loop/repeat enum, non-empty frames, complete facing sets, exact frame order, padding/spacing, and untrimmed/rotation policy.
5. **Complete atlas validation at intake.** Parse atlas JSON; validate image fingerprint, frame names/count/rectangles, canvas bounds, trim/rotation flags, padding/spacing, duplicate frames, animation membership, and layer/state alignment.
6. **Add pixel inspection.** Decode PNG/WebP metadata and pixels to enforce RGB/RGBA colour mode and bit depth, alpha policy, fully opaque-background prohibition where required, maximum opaque bounds, maximum transparent margins, empty-frame rejection, and per-role byte/dimension budgets.
7. **Lock art-style values only after Phase 8B/9.** Once approved pixels exist, add machine-readable palette ramps, contrast thresholds, outline widths/colours, light direction, shadow profiles, texture/detail budgets, and material/state rules. Until then, keep production generation blocked.
8. **Protect gameplay geometry.** Each visual contract should reference stable geometry IDs. Record a digest of collision/navigation/interaction/touch geometry and fail an artwork-only replacement if the digest changes. Validate measured visible bounds separately.
9. **Add naming rules.** Derive expected filenames from semantic ID/version/role, enforce exact case, validate state/variant token vocabularies, and reject duplicate variants or aliases.
10. **Add UI and audio templates.** UI templates need intended rendered size, contrast/readability role, safe text area, nine-slice margins, accessible label key, and touch-geometry reference. Audio needs format, channels, sample rate, duration/loop points, loudness budget, byte budget, and fallback policy.
11. **Add the complete negative suite.** Commit mutation descriptors—not broken production files—for every fixture in this report. Tests must assert the exact error code and ensure valid neighbouring assets still pass.
12. **Support incremental and batch validation.** Add a changed-assets command using repository diff plus manifest dependency closure; retain the full batch command as the release gate.
13. **Move validation earlier.** Run schema/file/contract checks before runtime-pack generation and before Vite bundling. Add CI once the repository's CI provider is chosen; keep `postbuild` as a second release check.
14. **Improve diagnostics.** Every error must include semantic ID, contract/schema version, field path, expected, actual, affected scenes/packs, and a concise remediation.
15. **Update documentation claims.** Phase 8A should distinguish field presence from field enforcement until the repair passes the full adversarial suite.

## Verification executed

| Command/check | Result |
| --- | --- |
| `pnpm run artwork:check` | PASS — 1 valid sample, 6 committed invalid fixtures |
| `pnpm run phase8a:check` | PASS structurally — 22 contracts; 0 generated files |
| `pnpm run phase10:check` | PASS as plan; production execution BLOCKED |
| Focused asset/Phase 8A tests | PASS — 20/20 |
| Full automated suite | PASS — 728/728 |
| Production build and all `postbuild` validators | PASS |
| Adversarial production-contract fixtures | 12 expected rejections worked; 9 contract gaps were accepted |
| Adversarial Phase 8A fixtures | 1 baseline accepted; 1 missing asset rejected; 7 invalid contract values accepted |

The first production-build attempt was blocked by the local filesystem sandbox while Vite tried to write its temporary config. It passed unchanged after repository write permission was granted; this was an audit-environment issue, not a KindWorks defect.

## Final decision

The architecture is safe enough to continue **contract-repair work**, but not production artwork generation across the whole game. Do not treat the 74-family Phase 10 plan or the 22 Phase 8A field declarations as proof of full enforcement.

**Verdict: NOT READY — CONTRACT ENFORCEMENT REPAIR REQUIRED.**
