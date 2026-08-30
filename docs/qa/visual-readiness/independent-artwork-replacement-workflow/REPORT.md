# Independent artwork replacement workflow verification

> Production-integration clarification (2026-08-30): this report covers the pre-approval candidate workflow. It did not prove ordinary production Town/Lawn instantiation. That missing runtime path was subsequently implemented and verified in `final-architecture-certification/REPAIR_REPORT.md`; human approval is still mandatory before real pixels enter production.

Date: 2026-08-30  
Branch and commit inspected: `phase-2-ui-simplification@3387bcb`  
Method: fresh repository inspection, fresh disposable asset, command-line validation, running Phaser/Asset Lab inspection through browser control, replacement with a second file, save/geometry regressions, production build, and exact cleanup.

## Verdict

**PASS — the ordinary pre-approval artwork replacement workflow works without gameplay-code changes or game-state damage.**

A previously unused `prop.town.slice.flower-planter` contract completed the required lifecycle twice. Both byte-distinct candidates were validated, registered in the development candidate index, previewed in Asset Lab, positioned through data, compared with an explicit reference, loaded into the real Town scene, checked at desktop and narrow-phone sizes, and removed. The second replacement retained the same logical placement and gameplay-geometry signature.

Production promotion was deliberately not performed because the disposable technical image did not receive human visual approval. That is a justified approval boundary, not a failure of ordinary artwork replacement. The approval path was exercised up to its exact digest gate and correctly made no master/runtime change.

## Test asset and untouched baseline

Semantic ID: `prop.town.slice.flower-planter`

Contract inspected directly from the runtime source of truth:

- 64×64, 8-bit RGBA PNG
- nearest-neighbour pixel art, untrimmed
- logical display size 48×48
- origin `(0.5, 0.875)`
- collision radius 14, navigation radius 20, interaction radius 56
- stable instance `instance.phase-8a.town.flower-planter`
- destination `TownScene`
- protected geometry signature `e5a75e71`
- staging, master and runtime paths were all absent before the test
- approval registry, layout overrides, reference associations and candidate index were empty

Protected state/source hashes were recorded before the workflow and matched exactly after cleanup:

| File | Before and after SHA-256 |
| --- | --- |
| `src/state/GameState.js` | `79db19426e2698c1642d8172e4675ff74e0d664d91f99b22b3ca389e90099ced` |
| `src/state/SaveRepository.js` | `a7a2f90659b610c529ac507f654b37ca6da44b0748d82cf76fdf86d4dd8b3c45` |
| `src/qa/visualRegressionFixtures.js` | `e5d269ecd52bef552c76e519ad901a6bd399869b9901406a31d51484a3294fed` |
| `tests/fixtures/legacy-saves.js` | `a5ff70d79530da2e66991852a7d78b506bc65ff9f149763ff82c180b9b684cb9` |

## Workflow evidence

| Stage | Result | Independent evidence |
| --- | --- | --- |
| Inspect contract | **PASS** | Exact file, canvas, alpha, logical scale, origin, geometry, destination and instance data were read from `phase8aVerticalSlicePackage.js` and the exported production package. |
| Prepare candidate A | **PASS** | Fresh 64×64 RGBA file created at the contract staging path. SHA-256: `3a891971449c3a8ae5c9ad199babe3f045a5adb4fd3e93963d211d6f1b5bff86`. |
| Validate actual bytes | **PASS** | Candidate preparation reported `VALID`, named the real staging file and exact digest, and retained `human-review-required`. |
| Register | **PASS** | Generated candidate index contained the semantic ID, source URL, digest, contract metadata, stable placement, reference and data-only offset. No scene class was edited. |
| Position | **PASS** | Offset `(7,-5)` was added through `scene-layout-overrides.v1.json`, then resolved in Town to `x=2137, y=435`. |
| Assign and compare reference | **PASS** | A separate exact-size reference was accepted only from `artwork/references/`; Asset Lab enabled and opened its comparison control. |
| Asset Lab preview | **PASS** | Asset Lab showed `VALID · human-review-required · image`, the candidate development URL, `TownScene` usage, and the exact digest in metadata. Geometry overlays remained available. |
| Real-scene preview | **PASS** | Phaser reported candidate ready in `TownScene`, asset ID `prop.town.slice.flower-planter`, geometry `e5a75e71`, input disabled, and the expected placement. No runtime errors. |
| Responsive test | **PASS, emulated** | Town preview fit 568×320 exactly with no document overflow; canonical 1280×720 and 1024×768 Asset Lab inspection also passed. |
| Replace again | **PASS** | Candidate B overwrote only staging bytes and produced new SHA-256 `bfdcb7aa089e20e2da384e30ecd848589d820c05f08fbf67e709f0bf50f58878`. Re-prepare refreshed the Asset Lab digest. |
| Replacement invariants | **PASS** | Candidate B retained geometry `e5a75e71`, placement `2137,435`, visual offset `(7,-5)`, Town destination and disabled input. No console errors. |
| Save/geometry regression | **PASS** | 20/20 focused tests passed for differently sized art, padding/origin changes, NPC and animal routes, entrances, touch targets, Lawn reward/save invariance, fresh/old/completed saves, and asset failure safety. |
| Staged production build | **PASS** | Build accepted one technically valid review candidate, excluded it from production, reported zero approved runtime assets, and confirmed all 39 development-only markers absent. |
| Human approval gate | **PASS, held** | Approval command named candidate B's exact token and refused promotion without reviewer plus literal confirmation. No master, runtime or approval record was created. |
| Remove | **PASS** | Candidate index was cleared; staging and reference files were deleted; offset and reference records were reset. Asset Lab returned to the explicit placeholder and the scene preview returned `unavailable` without a console error. |
| Clean production build | **PASS** | Final build passed with zero staging candidates and zero approved runtime assets. |

## Game-state and gameplay protection

- No gameplay scene, engine, state service, save schema, economy, reward, progression, collision, navigation or interaction source was edited during the workflow.
- The candidate preview creates a development-only, non-interactive visual object with no physics body; geometry remains sourced from the stable contract.
- Candidate A and candidate B resolved the identical geometry signature and logical placement despite different visible pixels.
- Fresh, mid-progress, completed and older-save regression fixtures remained compatible.
- Missing optional/required artwork tests confirmed that a visual load failure cannot overwrite a healthy save.
- The final approval registry remained `{ "assets": [] }`; master/runtime paths never existed.

## Remaining exceptions

### EX-01 — Human production approval was not exercised

**Classification: justified special case.**

Technical validity cannot stand in for a human art-direction decision. The controlled image was intentionally disposable and was not approved as KindWorks production art. The tooling proved the exact-digest approval boundary and normal semantic registration path structurally, but the real master/runtime copy must wait for a named human reviewer.

### EX-02 — Candidate removal is not atomic

**Classification: architectural tooling defect, low severity.**

`assetlab:prepare --clear` clears only the generated candidate index. Complete rejection/removal still required four explicit operations: clear the index, delete staging bytes, delete the reference, and remove the semantic ID from both reference and layout-override JSON. These steps succeeded, but they are unnecessarily error-prone.

Recommended repair: add `assetlab:reject --asset <id> --confirm REJECT` that validates the exact target, atomically removes its candidate-index entry/reference/layout override, deletes only its contracted staging file, never touches approved master/runtime files, and reports every action. Preserve an option to retain staging bytes during revision.

### EX-03 — Approval-token discovery is reported as a package-script failure

**Classification: architectural tooling/UX defect, low severity.**

The first approval command correctly withheld promotion and printed the token, but exits with status 2, so the package runner adds an alarming lifecycle-failure message. The safety behavior is correct; the user-facing result is misleading.

Recommended repair: provide a read-only `assetlab:approval-token` command that exits successfully, while keeping `assetlab:approve` fail-closed when required confirmation is absent.

### EX-04 — Candidate scene preview disables gameplay input

**Classification: justified special case.**

Pre-approval artwork is displayed as a non-interactive overlay in the real destination scene. This prevents unreviewed pixels from intercepting input or mutating physics/save state. Collision, navigation, interaction and touch contracts are tested and visualized separately. Interactive production verification appropriately occurs after human promotion.

### EX-05 — Physical devices were unavailable

**Classification: test-environment limitation, not an architecture defect.**

Responsive testing used browser-emulated 568×320, 1024×768 and canonical 1280×720 layouts. No physical phone/tablet claim is made.

### EX-06 — Existing interrupted-activity warning

**Classification: pre-existing observation, outside this workflow.**

The isolated QA runtime repeatedly warned that four older activity checkpoints remain while Playground Power Wash is resumed. It produced no candidate-preview error and did not affect the replacement test, but should remain tracked with save/recovery QA rather than being attributed to artwork replacement.

## Final determination

The success criterion is met for routine pre-approval replacement: a compliant new asset was validated, previewed, registered, positioned, compared, tested, replaced a second time, and removed without rewriting gameplay logic or damaging state.

The two justified boundaries—human production approval and input-disabled pre-approval preview—protect the game rather than obstruct normal artwork work. The remaining real defects are low-severity tooling friction around atomic rejection and approval-token discovery; neither blocks the premium vertical-slice intake, but both should be repaired before large-batch artist onboarding.
