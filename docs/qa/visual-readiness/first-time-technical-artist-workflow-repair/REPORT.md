# KindWorks first-time technical-artist workflow repair

> Production-integration clarification (2026-08-30): this report proved staging, review, promotion metadata and development scene preview. Normal Town/Lawn instantiation was added and independently verified later in `final-architecture-certification/REPAIR_REPORT.md`. “Connect through manifest” below must not be read as proof that the earlier build displayed approved pixels in ordinary gameplay.

Date: 2026-08-30  
Branch and starting commit: `phase-2-ui-simplification@3387bcb`  
Source defect list: `first-time-technical-artist-proof-workflow/REPORT.md`  
Scope: repair the candidate-intake architecture and repeat the twelve-step workflow with six fresh controlled technical assets. No final artwork was generated or approved.

## Verdict

**READY FOR HUMAN-REVIEWED VERTICAL-SLICE INTAKE, WITH HUMAN ART APPROVAL STILL REQUIRED.**

All eight confirmed workflow findings are fixed. A newly supplied file can now be validated from its actual bytes, found and inspected in the Asset Lab, overlaid in its real destination scene, adjusted through data, compared with an explicitly assigned reference, checked at phone and tablet sizes, and promoted into the normal semantic manifest without editing a scene or gameplay class.

The six disposable proofs were intentionally not approved as production art. The approval tool correctly held the gate: technical validity is not visual approval. Exact proof bytes and temporary candidate/reference records were removed after testing. The approval registry and generated runtime index are clean and empty.

## Repair outcomes

| Finding | Status | Repair and proof |
| --- | --- | --- |
| PROOF-001 — no staging intake | **FIXED** | `assetlab:prepare` validates the selected file's real bytes and generates a development candidate index. All six fresh proofs appeared in the Asset Lab. |
| PROOF-002 — false-positive validation | **FIXED** | Candidate validation now checks existence, case, PNG structure, format, dimensions, alpha, colour mode, byte budget, frame grid and digest. A deliberately changed 8×8 bin failed with the expected 192×80 and three-frame diagnostics. |
| PROOF-003 — staging forbidden by Phase 8A gate | **FIXED** | The gate permits technically valid review candidates while continuing to reject invalid staging and every unapproved master/runtime file. A clean production build passed after the proof. |
| PROOF-004 — manual manifest promotion | **FIXED** | `assetlab:approve` performs a two-step, exact-SHA human gate, copies bytes atomically, records provenance, and regenerates only approved semantic definitions for the ordinary visual manifest. No scene class is named by the promotion layer. |
| PROOF-005 — fallback animation warnings | **FIXED** | Asset Lab playback is enabled only when the loaded source has compatible frame coverage. The four-frame NPC walk-up preview scrubbed through all four candidate frames with no missing-frame warning. |
| PROOF-006 — placement not executable in a scene | **FIXED** | Development-only candidate preview loads the contract into its declared scene with stable instance/prefab IDs, logical placement, data-only visual offset, contract scale/origin/animation, locked geometry and disabled input. It worked in Town and Lawn Care. |
| PROOF-007 — tests stopped at contract boundary | **FIXED** | New tests exercise real bytes, invalid bytes, candidate index merging, scene preview isolation, approval policy, production exclusion, and save/geometry protection. Browser QA exercised the actual Phaser texture in its destination scenes. |
| PROOF-008 — no reference assignment | **FIXED** | `assetlab:reference` records an explicit semantic-ID association after path and dimension validation. The reference comparison loaded side-by-side in the Asset Lab; references remain development-only. |

## Fresh controlled proof set

These files were deliberately simple technical fixtures, not production-art proposals.

| Role | Semantic ID | Contract exercised | Runtime result |
| --- | --- | --- | --- |
| Static environmental asset | `prop.town.slice.rubbish-can` | Static RGBA PNG, Town placement and prop geometry | Valid candidate; Asset Lab and Town preview passed |
| Multi-state asset | `prop.town.slice.public-bin` | Three-frame state sheet, prop prefab and stable placement | Valid candidate; invalid 8×8 replacement rejected correctly |
| Directional animated character | `character.npc.slice.resident-a` | Four-direction, four-frame-per-direction sheet | Valid; walk-up frames 1–4 previewed without warnings |
| Building / large object | `building.town.slice.house-6-bay-cottage` | Four visual states, fixed logical footprint | Valid; real-scene preview preserved contract geometry |
| Mini-game asset | `minigame.lawn.slice.mower` | Directional Lawn Care spritesheet | Valid; Lawn Care preview passed at 568×320 |
| UI asset | `ui.town.slice.lawn-interaction` | Static UI control contract and mobile inspection | Valid; Asset Lab passed at 568×320 |

## Repeated twelve-step workflow

| Step | Result | Evidence |
| ---: | --- | --- |
| 1. Read contract | **PASS** | All six semantic IDs resolved to Phase 8A contracts with exact files, dimensions, geometry, usage and scene destinations. |
| 2. Prepare replacement | **PASS** | One command created six exact-contract controlled PNGs and references. This command is explicitly proof-only and does not create approved art. |
| 3. Put it in staging | **PASS** | Files used their contract-owned `artwork/staging/phase-8a/...` paths. |
| 4. Validate | **PASS** | `assetlab:prepare` inspected actual bytes and emitted candidate SHA-256 metadata. The controlled invalid bin was rejected for the correct reasons. |
| 5. Find it in Asset Lab | **PASS** | All six records displayed `valid` and `human-review-required`; candidate metadata replaced only development presentation data. |
| 6. Connect through manifest | **PASS** | The candidate index connects review bytes without touching production; the approval generator connects only exact human-approved digests to the normal semantic manifest. |
| 7. Adjust through layout data | **PASS** | The Town prop used `x:+3`, `y:-2` from the candidate override JSON. Its logical placement and geometry signature did not change. |
| 8. View in real scene | **PASS** | Town candidate preview reported `TownScene`, ready state, stable placement and disabled input. Lawn preview reported `LawnCareScene`. |
| 9. Compare with reference | **PASS** | Explicit, dimension-matched reference loaded in the comparison view. The association was not inferred from a filename. |
| 10. Test geometry, interaction and animation | **PASS for the controlled workflow** | Preview object is non-interactive and has no physics body; contract geometry is visualized separately. NPC animation frames and overlays were inspected. Existing comprehensive geometry tests remained green. |
| 11. Save and reload | **PASS** | The preview controller contains no save/repository/game-state mutation path. Save and visual-refactor regression tests remained green. A fresh browser route produced the same contract placement. |
| 12. Phone and tablet | **PASS, browser-emulated** | Asset Lab and Lawn preview passed at 568×320; Asset Lab and Town preview passed at 1024×768. Physical devices were not available. |

Routine artwork replacement required **zero edits** to `TownScene`, `LawnCareScene`, any minigame engine, save schema, economy, progression, reward, collision or navigation implementation. The only runtime entry-point change is a development-only QA route that loads the shared candidate-preview controller.

## Human approval and production safety

- Technical validation never implies visual approval.
- Running approval without reviewer, exact digest token and literal `APPROVE` performs no mutation and prints the exact second command required.
- Approved bytes are copied atomically and cannot silently overwrite different runtime bytes.
- The approval record stores semantic ID, candidate digest, reviewer and time.
- Build-time generation verifies that runtime bytes still match the approved digest.
- With zero approvals, the generated approval index has zero assets and adds no artwork payload.
- Candidate and reference web routes exist only in Vite development mode, are confined to the expected directories and use `no-store`.
- Production verification found all 39 development-only markers absent from built JavaScript.
- Temporary proof assets were removed; no candidate, reference, layout override or approval record remains.

## Browser evidence

Browser automation operated the rebuilt Phaser app, not a standalone mock-up.

- NPC candidate, 1024×768: valid, human-review-required, four animation frames, no fallback warnings.
- UI candidate, 568×320: document matched the viewport and did not overflow.
- Town candidate, 1024×768: `TownScene`, candidate ready, geometry signature `d9604aa9`, input disabled, placement `2403,468` plus visual-only offset `3,-2`.
- Lawn candidate, 568×320: `LawnCareScene`, candidate ready, input disabled, narrow-phone responsive profile.
- Candidate/reference comparison: explicit reference association and side-by-side view loaded successfully.
- A prepared candidate produced no candidate error. If the preview remains open after its disposable file is deliberately cleaned, it now changes to the explicit `unavailable` state instead of reporting a false runtime failure. The separate already-documented interrupted-QA-checkpoint warning remains.

Screenshots:

1. [NPC candidate in Asset Lab at tablet size](./screenshots/01-asset-lab-npc-candidate-tablet.png)
2. [UI candidate in Asset Lab at narrow-phone size](./screenshots/02-asset-lab-ui-candidate-phone.png)
3. [Town real-scene candidate preview](./screenshots/03-town-candidate-preview-tablet.png)
4. [Lawn Care real-scene candidate preview](./screenshots/04-lawn-candidate-preview-phone.png)
5. [Candidate/reference comparison](./screenshots/05-candidate-reference-comparison.png)

## Automated verification

### Complete suite

- `pnpm test`: **811/811 PASS**, 0 failed, 0 skipped, 0 cancelled.
- Targeted candidate, Asset Lab and Phase 7 suite: **24/24 PASS**.

### Production build

- Production build: **PASS**, 203 modules transformed.
- Performance budget: **PASS**.
- Production surface: **PASS**; 39 development-only markers absent.
- Asset contracts: **PASS**; 15 supported categories, all 74 Phase 10 families covered.
- Visual registry: **PASS**; one pre-existing duplicate-content notice remains for the legacy/runtime Fishing image.
- Scene layouts: **PASS**; 19 layouts covering 18 production scenes.
- Scale system: **PASS**; five supported profiles.
- Artwork pipeline: **PASS**; its existing controlled valid sample passes and 19 invalid fixtures are rejected.
- Phase 8A package: **PASS**; clean state contains zero review candidates and requires approval records for runtime files.
- Phase 10 production execution remains intentionally **BLOCKED** at 0/22 approved production assets. This is not a repair regression; no real artwork received human approval in this exercise.

## Files changed for this repair

Candidate workflow and promotion:

- `scripts/lib/phase8bCandidateWorkflow.mjs`
- `scripts/prepare-asset-lab-candidate.mjs`
- `scripts/approve-artwork-candidate.mjs`
- `scripts/set-candidate-layout-offset.mjs`
- `scripts/set-candidate-reference.mjs`
- `scripts/create-phase8b-controlled-proof.mjs`
- `scripts/generate-phase8b-approved-index.mjs`
- `scripts/validate-phase8a-production-package.mjs`
- `package.json`

Runtime and development tooling:

- `src/visual/dev/assetLabCatalog.js`
- `src/visual/dev/AssetLabScene.js`
- `src/visual/dev/Phase8BCandidatePreviewController.js`
- `src/visual/dev/SceneQaOverlayController.js`
- `src/visual/generated/assetLabCandidateIndex.js`
- `src/visual/generated/phase8bApprovedAssetIndex.js`
- `src/visual/phase8bApprovedManifest.js`
- `src/visual/visualManifest.js`
- `src/main.js`
- `vite.config.js`
- `scripts/verify-production-surface.mjs`

Policy/data and documentation:

- `artwork/approvals/phase8b-approved-assets.v1.json`
- `artwork/candidates/scene-layout-overrides.v1.json`
- `artwork/candidates/reference-associations.v1.json`
- `artwork/README.md`
- `artwork/CONTRACT_AUTHORING.md`
- `docs/qa/visual-readiness/phase-07/ASSET_LAB_GUIDE.md`

Tests:

- `tests/phase8b-artist-workflow-repair.test.js`
- `tests/asset-lab-production-repair.test.js`
- `tests/visual-readiness-phase-7.test.js`

No production scene class was changed for ordinary artwork replacement.

## Remaining constraints and risks

1. **Human visual review remains mandatory.** The approval command was proved to hold its gate and its generated-manifest path is tested, but these deliberately crude fixtures were correctly not promoted.
2. **Physical-device certification remains outstanding.** Phone and tablet evidence is browser emulation only.
3. **Phase 8B production artwork remains 0/22.** This task repaired intake; it did not create or approve the premium slice.
4. **The existing Fishing duplicate-content notice remains:** the legacy reference and runtime image have identical bytes. It is recorded by validation and is unrelated to this workflow.
5. **The existing interrupted-QA-checkpoint warning remains** in the fresh browser run. It predates this repair and did not affect candidate inspection.

## Final readiness decision

The architectural obstacles identified by the first-time artist proof are repaired. A technical artist can now complete the full pre-approval replacement workflow using semantic contracts, real-byte validation, the manifest-derived Asset Lab, data-only placement, real-scene preview, reference comparison and responsive checks without rewriting gameplay.

The system is therefore **ready to accept the genuine premium vertical-slice candidates for human review**. It is not yet a claim that production art is integrated: that next status requires actual compliant artwork, explicit visual approval, promotion, and the same regression matrix.
