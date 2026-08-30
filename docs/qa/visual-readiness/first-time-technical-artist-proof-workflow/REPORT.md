# KindWorks first-time technical-artist proof workflow

Date: 2026-08-30  
Branch and starting commit: `phase-2-ui-simplification@3387bcb`  
Scope: six controlled proof assets; no final artwork generation and no gameplay redesign

## Verdict

**NOT READY FOR THE TRUE VERTICAL SLICE — CANDIDATE INTAKE AND PROMOTION REPAIRS ARE REQUIRED.**

The architecture works for artwork that is already promoted into the runtime semantic manifest. The existing Fishing background completed validation, Asset Lab inspection, real-scene/reference comparison, responsive inspection, and regression checks without a scene-code edit.

The workflow fails for newly supplied artwork. Five exact-contract PNGs were placed at their approved Phase 8A staging paths, but the Asset Lab continued to show procedural placeholders, no real scene consumed the files, and `assets:validate --asset` reported PASS even before those candidate files existed. The stricter Phase 8A gate and production build then rejected the same files as `artwork-generated-too-early`. There is no documented or executable artist-facing bridge from validated staging bytes to reviewable Asset Lab candidate to approved runtime asset.

No gameplay code, scene class, save schema, economy, progression, level data, collision, navigation, or interaction code was edited during this proof.

## Selected controlled assets

| Role | Semantic ID | Contract | Proof policy | Result |
| --- | --- | --- | --- | --- |
| Static environmental prop | `prop.town.slice.flower-planter` | 64×64 RGBA PNG, one state, TownScene | Disposable exact-contract staging PNG | **BLOCKED:** placeholder only |
| Multi-state environment | `terrain.town.slice.lawn-house-6` | 1280×352 RGBA sheet, 4× 320×352 states | Disposable exact-contract staging PNG | **BLOCKED:** placeholder only |
| Directional animated animal | `character.animal.slice.dog` | 192×160 RGBA sheet, 4×4 frames, four directions, 8 fps | Disposable exact-contract staging PNG | **BLOCKED:** placeholder only; fallback frame warnings |
| Building / large object | `building.town.slice.house-6-bay-cottage` | 1024×192 RGBA sheet, four 256×192 states | Disposable exact-contract staging PNG | **BLOCKED:** placeholder only |
| Mini-game asset | `scene.fishing.reedbank.background` | 720×405 WebP, opaque, FishingScene | Existing approved controlled pipeline sample | **PASS** |
| UI asset | `ui.lawn.slice.controls` | 192×64 RGBA sheet, exit/undo/hint frames | Disposable exact-contract staging PNG | **BLOCKED:** placeholder only |

The disposable PNGs were deliberately simple technical blocks, not proposed production art. File inspection confirmed their exact dimensions, 8-bit RGBA mode, alpha support, and small file sizes. They were removed after the proof, together with their empty proof directories.

## Twelve-step workflow results

| Step | Fishing approved sample | Five new staged proofs |
| ---: | --- | --- |
| 1. Read contract | **PASS** | **PASS** — complete Phase 8A leaf contracts, geometry, states, placements, prompts and filenames exist |
| 2. Prepare compliant replacement | **PASS** — repository-controlled approved sample | **PASS** — exact dimensions/frame grids prepared; technical placeholders only |
| 3. Place in approved location | **PASS** | **PASS** — exact `artwork/staging/phase-8a/.../v1/...` paths |
| 4. Run validation | **PASS** with real file validation | **FAIL / false positive** — `assets:validate --asset` validates the Phase 8A contract package, not the candidate bytes |
| 5. Inspect in Asset Lab | **PASS** — `VALID · approved · image` | **FAIL** — all five remained `PLACEHOLDER · not-generated · procedural` |
| 6. Connect through manifest | **PASS** — semantic runtime manifest already contains it | **BLOCKED** — no staging-candidate manifest/import/promotion command |
| 7. Place through scene layout | **PASS** — existing semantic Fishing instance | **BLOCKED** — Phase 8A placements are contract-only and explicitly not coupled to TownScene/LawnCareScene |
| 8. View in real scene | **PASS** — real FishingScene exercised by reference verifier | **BLOCKED** — staged bytes never loaded by Phaser |
| 9. Compare with reference | **PASS** — side-by-side and difference modes | **BLOCKED** — no candidate source or approved reference association in runtime |
| 10. Test geometry/animation | **PASS for applicable Fishing background plus connected geometry regressions** | **PARTIAL contracts only** — logical geometry tests pass, but the actual candidate pixels never meet those contracts in Phaser |
| 11. Save/reload | **PASS** — independent visual-refactor save matrix | **UNPROVEN for actual replacement** — files were not connected; absence trivially left saves unchanged |
| 12. Phone/tablet | **PASS, browser-emulated** at 568×320 and 1024×768 | **PARTIAL** — Asset Lab itself fits, but only fallbacks are displayed |

## Runtime and device evidence

- At 568×320, the Asset Lab document remained exactly 568 px wide with no document overflow. The dog record still showed `FALLBACK/PLACEHOLDER ACTIVE`.
- At 1024×768, the approved Fishing record rendered as `VALID · approved · image`, with no document overflow.
- Selecting the dog contract's `walk-up` animation exposed a `Frame 1/1` fallback. Phaser logged missing-frame warnings for frames 12, 13, 14 and 15 because animation metadata was applied to a one-frame procedural placeholder.
- The reference verifier opened the real FishingScene, rendered two side-by-side panels, calculated a 14.67% changed-pixel ratio and 3.15 MAE, and correctly rejected an unrelated reference.
- Browser emulation was used. No physical phone or tablet was available, so this is not physical-device certification.

Screenshots:

1. [Dog staging file remains a fallback at 568×320](./screenshots/01-dog-staging-invisible-narrow-phone.png)
2. [Approved Fishing sample in the Asset Lab at 1024×768](./screenshots/02-fishing-integrated-tablet.png)

## Validation and build evidence

### Candidate validation contradiction

Each of the following commands reported PASS for the selected asset:

- `assets:validate -- --asset prop.town.slice.flower-planter`
- `assets:validate -- --asset terrain.town.slice.lawn-house-6`
- `assets:validate -- --asset character.animal.slice.dog`
- `assets:validate -- --asset building.town.slice.house-6-bay-cottage`
- `assets:validate -- --asset ui.lawn.slice.controls`
- `assets:validate -- --asset scene.fishing.reedbank.background`

The first five also reported PASS before a candidate file existed. That is contract validation, not candidate validation.

With the five files present, `phase8a:check` and the production post-build gate rejected all five as `artwork-generated-too-early`. This protects the contract-only Phase 8A milestone, but it leaves no approved Phase 8B artist intake path.

### Regression suite

Targeted Node tests: **61/61 PASS** across asset-contract enforcement, Asset Lab production behavior, artwork pipeline, Phase 7, Phase 8A, gameplay geometry isolation, and independent save compatibility.

The tests prove the existing logical geometry and saves are robust. They do not prove that the five staging candidates can be reviewed or integrated, because none of those bytes entered Phaser.

### Production build

- With the disposable staging files present: Vite compilation succeeded, but the post-build Phase 8A gate failed for all five files.
- After exact cleanup: `phase8a:check` passed and the complete production build passed.
- Production surface verification confirmed 35 development-only markers are absent from production JavaScript.
- Post-build still reports the existing Phase 10 execution status as blocked because Phase 8B has 0/22 approved runtime assets. This is pre-existing and consistent with the proof result.

## Time and friction

| Activity | Approximate observed time | Friction |
| --- | ---: | --- |
| Prepare five exact-contract PNGs | 0.33 s automated generation, plus contract review | Low technical cost; still manual because no repository candidate-prep command exists |
| Run six selected-asset validators | 2.7 s | Fast but misleading for Phase 8A staging bytes |
| Regenerate Asset Lab production index | 0.8 s | Index carries expected staging paths but does not inspect or load candidates |
| Inspect six Asset Lab records | 4.5 s after UI setup | Five fallbacks; no staging/current source selector |
| Targeted regression tests | 1.12 s test duration | Good, but candidate-pixel path is absent from coverage |
| Reference comparison | 8.8 s | Reliable for already-integrated Fishing; local server needs network-bind permission in the sandbox |
| Clean production build | 2.8 s | Passed after candidate cleanup |

Fresh shells also required the bundled Node runtime to be added to `PATH`; otherwise project scripts failed with `node: command not found`. This is environment/setup friction, not a Phaser architecture defect, but the artist onboarding documentation should mention the required runtime setup.

## Confirmed bugs and architecture leaks

### PROOF-001 — HIGH — No reviewable staging-candidate intake

The generated Asset Lab index knows the contract's expected staging path, but the Lab catalog does not load or even mark a file newly present there. Routine intake stops before visual review.

### PROOF-002 — HIGH — Selected-asset validation can falsely imply candidate acceptance

For Phase 8A semantic IDs, `assets:validate --asset` validates definitions and reports PASS without checking whether the candidate file exists or matches its bytes. A first-time artist can reasonably misread this as candidate approval.

### PROOF-003 — HIGH — Phase 8A and build policy prohibit the only documented staging location

The stricter gate rejects any Phase 8A staging, master or runtime bytes as `artwork-generated-too-early`. That was correct for the contract-only planning milestone, but Phase 8B has no successor intake/promotion state or command.

### PROOF-004 — HIGH — Routine promotion requires source-manifest work

The approved Fishing sample works because it is already represented in the source artwork manifest, generated runtime pack, semantic visual manifest, prefab, scene pack, and layout. There is no artist-facing promotion tool that performs this safely. Completing the other five paths would require manual source-manifest/generated-pack edits, even though no gameplay-class rewrite should be necessary.

### PROOF-005 — HIGH — Contract-only animation metadata is applied to a one-frame fallback

The dog record advertises four directions and four frames per direction, but previewing it applies frames 12–15 to a one-frame procedural fallback, producing runtime warnings. The Lab should either render an animation-aware placeholder or keep animation controls visibly disabled until compatible candidate/runtime pixels exist.

### PROOF-006 — HIGH — Phase 8A placement is not an executable real-scene placement path

The package contains stable layout IDs and coordinates, but the validator explicitly confirms TownScene and LawnCareScene contain no Phase 8A asset coupling. Consequently an artist cannot prove layout, collision, navigation, interaction, or responsive behavior using actual replacement pixels.

### PROOF-007 — MEDIUM — Save/geometry tests stop at the contract boundary

The existing regression suite strongly protects logical geometry and save state, but it substitutes registry metadata in unit tests. It does not perform the complete staging-candidate → Phaser texture → real-scene → reload journey for a new asset.

### PROOF-008 — MEDIUM — References are not yet assigned to these proof destinations

Fishing has a deterministic reference association. The five Phase 8A proof records do not yet expose an approved reference/source comparison in their destination scenes.

## Unexpected manual work and missing tools

- Manually created exact canvas/frame-grid proof bytes.
- Manually inspected PNG mode and dimensions because the selected Phase 8A validator did not inspect candidate bytes.
- Manually regenerated the Asset Lab index; this still did not ingest the files.
- Would have needed manual source-manifest edits and runtime promotion to continue, which was intentionally not done.
- No `assetlab:prepare --asset <id>` or equivalent command.
- No development-only staging/current/previous source selector.
- No candidate index with byte-validation results.
- No atomic approve/promote/reject command with provenance and rollback.
- No end-to-end browser test for a newly staged directional sheet.
- Artist setup docs do not explain the bundled Node runtime requirement.

## Files and systems edited

Gameplay code edits: **none**.  
Scene class edits: **none**.  
Unrelated production-system edits: **none**.  
Persistent-state edits: **none**.

Temporary files created and then removed:

- `artwork/staging/phase-8a/flower-planter/v1/flower-planter.v1.png`
- `artwork/staging/phase-8a/lawn-house-6-growth-states/v1/lawn-house-6-growth-states.v1.png`
- `artwork/staging/phase-8a/animal-dog-walk/v1/animal-dog-walk.v1.png`
- `artwork/staging/phase-8a/house-6-bay-cottage-states/v1/house-6-bay-cottage-states.v1.png`
- `artwork/staging/phase-8a/lawn-care-essential-controls/v1/lawn-care-essential-controls.v1.png`

Retained evidence from this audit only:

- This report
- Two screenshots under `screenshots/`

The Asset Lab production index was regenerated through the repository command. No hand-edited asset registry, manifest, layout, scene or gameplay file was introduced.

## Required fixes before the true vertical slice

1. Add a development-only candidate index keyed by semantic ID, contract version and candidate digest.
2. Make a candidate-prep command validate the actual staging bytes, not just the contract, and clearly distinguish `contract valid` from `candidate valid`.
3. Add Asset Lab source selection for `staging candidate`, `approved/current`, and `previous` without copying unapproved bytes into production runtime locations.
4. Merge candidate pixels, contract, prefab, animation, geometry, usage, layout and validator findings into one Asset Lab record.
5. Replace the Phase 8A `artwork-generated-too-early` dead end with an explicit Phase 8B workflow state that allows reviewed staging candidates while still preventing unapproved runtime promotion.
6. Add an atomic approve/reject/promote command that updates source-of-truth manifests, generates runtime packs, records provenance, and never edits gameplay or scene classes.
7. Render animation-compatible fallbacks or disable animation playback when fallback frame coverage is insufficient.
8. Add a development-only real-scene candidate override so layout, geometry, animation, reference comparison and device checks can occur before approval.
9. Add one end-to-end test covering a new 4-direction sheet from staging through validation, Asset Lab, real scene, save/reload, phone/tablet, rejection/approval and exact cleanup.
10. Document the complete first-time artist setup, Node runtime, candidate lifecycle, promotion, rollback and failure recovery.

## Final readiness decision

The semantic contracts, logical geometry isolation, save protection, Asset Lab for existing runtime assets, production exclusion, and deterministic Fishing reference workflow are useful and testable foundations.

However, the requested routine replacement workflow fails its defining criterion: five newly prepared compliant assets could not be inspected in the Asset Lab or real game without proceeding to manual source-manifest/runtime integration. The architecture is therefore **not ready for the true premium vertical slice** until the candidate intake, review, promotion and real-scene preview path is implemented and this exact six-category proof is repeated.
