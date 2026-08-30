# KindWorks Asset Lab Stage 5 independent artist-workflow test

Date: 2026-08-30  
Starting branch and commit: `phase-2-ui-simplification@3387bcb`  
Role simulated: technical artist integrating a generated asset for the first time  
Repository changes during test: documentation and screenshots only; no gameplay code changed

## Verdict

**STAGE 5 NOT APPROVED — FIRST-TIME CANDIDATE INTAKE REPAIR REQUIRED.**

The repaired Asset Lab is reliable for inspecting already registered runtime assets and contract-only placeholders. It is not yet a complete first-time generated-asset workflow. A file placed in `artwork/staging/` cannot be discovered or previewed in the Lab without manual runtime promotion and a source-code manifest change. In addition, the existing fully validated Fishing sample appears with `contract: null`, while the animated resident pixels and the resident production contract/geometry appear as separate records.

No temporary fixture remains. The test did not modify gameplay, saves, scenes, progression, economy, or runtime artwork.

## Eleven-step workflow result

| # | Workflow step | Result | Evidence |
| ---: | --- | --- | --- |
| 1 | Select a test contract | **PASS** | Selected `scene.fishing.reedbank.background`, the only complete file-backed controlled production-pipeline sample. Contract requires one default state, 720×405 WebP, no alpha, nearest filtering, `FishingScene`. |
| 2 | Add or use a controlled test asset | **PASS WITH LIMITATION** | Used the repository's deliberate Fishing staging/master/runtime fixture. All three files have SHA-256 `ade1c03c8ae32dad0b98ded9c1d6e485cf9422560777f5d8f3a41c6189b8c5bb`. Repository documentation explicitly says this is approved existing art, not newly generated art. |
| 3 | Validate it | **PASS** | Single-asset validation reported 15 supported categories, 74/74 production families, and one selected semantic asset. |
| 4 | Find it in Asset Lab | **PASS** | Semantic-ID search returned exactly `scene.fishing.reedbank.background`; preview loaded without fallback, warning, or console error. |
| 5 | Inspect metadata | **FAIL** | Runtime source, dimensions, texture key, prefab, scene pack, instance, and legacy key are visible. However, `contract` and `productionFamily` are both `null`, and the category is inferred as `scene` rather than the registered `category.minigame`. The generator indexes Phase 8A leaf contracts but not the production artwork manifest's leaf contracts. |
| 6 | Preview all required states, frames, and directions | **PARTIAL** | Fishing's only required state (`default`) previewed correctly; it has no frames or directions by contract. As a stronger animation check, `character.resident.generated-frames` successfully previewed 4 directions × 4 frames, restart, play, pause, and scrub. That runtime record has no production contract, prefab, or geometry. The matching `character.player.slice.resident` contract has the required 16-frame/4-direction specification but only a fallback placeholder. No single record can inspect candidate pixels plus their full contract. |
| 7 | Inspect origins and geometry overlays | **PARTIAL** | Fishing displayed canvas, frame, opaque, origin, ground, socket, and declared visual overlays. The Phase 8A player contract displayed collision, navigation, interaction, touch, anchor, and socket geometry around a fallback. The real animated resident pixels cannot be viewed with that contract geometry because they are a separate record. |
| 8 | Test game scale and multiple devices | **PASS, EMULATED** | Native and gameplay size both worked. Browser emulation passed at 1280×720, 568×320, and 1024×768 with no document overflow. Narrow-phone controls measured 44 px high. Expanded metadata makes the 568×320 panel 3,010 px tall inside a 308 px scroll area; collapse restores a preview-first view. No physical device was available. |
| 9 | Identify scenes using it | **PASS** | Fishing usage correctly lists `FishingScene`, `pack.scene.fishing`, `prefab.scene.fishing.reedbank.background`, `instance.fishing.reedbank.background.main`, and legacy key `legacy-fishing`. |
| 10 | Report a deliberately invalid variant | **PARTIAL** | An isolated copy with a deliberately changed 719×405 contract was correctly rejected with `invalid-visible-bounds-contract` and three `dimension-mismatch` findings naming staging, master, and runtime paths. The Asset Lab itself cannot ingest or display this staged invalid candidate; only the command-line validator reports it. |
| 11 | Remove temporary fixture | **PASS** | The fixture existed only under `/tmp/kindworks-assetlab-stage5.zYbLRQ`; that exact directory was deleted and its absence verified. Repository staging/master/runtime files were not altered. |

## Confirmed findings

### ALAB-ST5-001 — HIGH — No staging-candidate intake path

**Reproduction**

1. Put a generated candidate at the contract's `artwork/staging/...` path.
2. Validate the candidate.
3. Open the Asset Lab and search for it.

**Expected:** a reviewed staging candidate can be discovered and previewed through its semantic contract without copying it into `public/assets/runtime/` or editing gameplay/source manifests.

**Actual:** the Lab catalog is composed from the runtime visual manifest plus contract-only production records. There is no import/preview command, generated candidate manifest, or temporary staging loader. `assetlab:generate` does not register a staged candidate.

**Impact:** the actual first-time artist workflow stops between validation and Lab review. The artist must manually alter runtime-facing source data before approval, contrary to the documented staging-first workflow.

### ALAB-ST5-002 — HIGH — Production leaf contracts are absent from runtime records

The controlled Fishing record reports:

```json
{
  "semanticId": "scene.fishing.reedbank.background",
  "category": "scene",
  "contract": null,
  "productionFamily": null
}
```

The leaf contract exists in `artwork/specifications/kindworks-artwork-manifest.v1.json` and assigns `category.minigame` and `minigame.fishing-magnet-pack`. `generate-asset-lab-production-index.mjs` currently exports Phase 8A leaf contracts only.

**Impact:** an artist cannot confirm that the runtime pixels being reviewed satisfy the exact production contract shown in the same record.

### ALAB-ST5-003 — HIGH — Pixels, directional contract, and geometry cannot be inspected together

- `character.resident.generated-frames` supplies working pixels and four directional animations but has `contract: null`, `prefab: null`, and no collision/interaction geometry.
- `character.player.slice.resident` supplies the exact 4×4 contract, anchor, sockets, collision, navigation, interaction, touch geometry, scene usage, and expected filenames, but displays only the fallback placeholder.

**Impact:** the technical artist cannot prove that a newly supplied resident sheet aligns with its actual gameplay geometry and sockets before integration.

### ALAB-ST5-004 — MEDIUM — Invalid staged candidates are not visible in the Lab

The binary/contract validator is actionable and correctly rejects the deliberately invalid 719×405 variant. The generated Lab validation index validates the runtime visual manifest, not staged candidate records. Therefore the invalid variant cannot be selected, visually diagnosed, or compared with the approved version in the Lab.

### ALAB-ST5-005 — LOW — First-time instructions are incomplete

The documentation explains validation and workflow states but does not give an executable, safe path from:

`validated staging candidate → Asset Lab preview → review decision → runtime-ready promotion`.

The controls themselves are understandable once an asset is registered. The missing intake step is the confusing part.

### ALAB-ST5-006 — LOW — Phone metadata review is very scroll-heavy

At 568×320 the panel remains safe and touch targets meet 44 px, but expanded metadata produces 3,010 px of panel content inside a 308 px viewport. The collapse control makes asset inspection usable, but metadata comparison is realistically a tablet/desktop activity.

## What worked reliably

- Semantic ID and filename search.
- Runtime image lazy loading and selected-asset reload.
- Valid/approved status for the original controlled sample.
- Previous/current comparison support.
- Native and intended gameplay scale.
- All 12 geometry-overlay toggles.
- Four-direction resident animation with four deterministic frames per direction.
- Restart, play, pause, frame stepping, scrubbing, and readout.
- Scene pack, prefab, instance, and legacy-key usage lookup.
- Narrow-phone and tablet browser-emulated layouts without document overflow.
- Actionable binary-validation failure messages.
- Exact temporary-fixture cleanup.

## Required repair before Stage 5 can pass

1. Generate a development-only candidate index from validated staging records, keyed by stable semantic ID and contract version.
2. Let the Asset Lab choose `staging`, `approved/current`, and optionally `previous` sources without copying staging bytes into production runtime paths.
3. Export leaf contracts from both the production artwork manifest and Phase 8A package into the shared Asset Lab production index.
4. Merge a candidate's contract, prefab, geometry, animation, usage, and validation results into one record.
5. Display staged invalid candidates as blocked records with their exact validator findings; do not attempt to load invalid bytes as approved runtime art.
6. Provide one documented command such as `assetlab:prepare --asset <semantic-id>` that validates, regenerates the candidate index, and explains the next review step.
7. Add an automated end-to-end fixture proving a 4-direction spritesheet can move from staging validation to Lab preview and then be removed without touching gameplay code or the production manifest.

## Evidence

- Machine-readable results: [EVIDENCE.json](./EVIDENCE.json)
- Screenshots: [screenshots](./screenshots/)

Screenshot notes:

1. `01-controlled-fishing-metadata.png` — controlled Fishing runtime record.
2. `02-fishing-game-scale-overlays.png` — intended scale and overlays.
3. `03-fishing-native-scale.png` — native-size preview.
4. `04-fishing-narrow-phone-open.png` — 568×320 controls.
5. `05-fishing-narrow-phone-collapsed.png` — preview-first narrow phone.
6. `06-fishing-tablet.png` — 1024×768 tablet.
7. `07-resident-four-direction-frame-preview.png` — resident frame 4/4, up direction.
8. `08-player-contract-geometry-placeholder.png` — geometry around the Phase 8A fallback.
9. `09-fishing-metadata-panel.png` — usage/diagnostics panel and scene preview.

## Final decision

The existing Lab repair remains valuable and its earlier runtime-manifest tests still pass. This independent first-time artist workflow exposes an additional architectural gap that those tests did not cover.

**Stage 5 must remain NOT APPROVED until ALAB-ST5-001 through ALAB-ST5-003 are repaired and this exact workflow is repeated with one real staged directional spritesheet.**
