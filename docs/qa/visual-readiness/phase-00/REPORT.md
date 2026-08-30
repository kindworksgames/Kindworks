# Phase 0 — Visual Readiness Audit

Date: 2026-08-29  
Branch: `phase-2-ui-simplification`  
Audited commit: `3387bcb48964c41edbdc26f4257d2990fcdaf8d5`  
Scope: audit only; no production refactor

## Verdict

**PHASE 0 PASS — the visual surface is accounted for and the implementation plan is repository-specific.**

This is not a claim that the Phaser build has complete functional or visual parity with the legacy HTML. The audit found a workable but highly coupled hybrid presentation layer. Visual implementation may begin only through the compatibility-first sequence in `MIGRATION_PLAN_AND_ACCEPTANCE_TESTS.md`; it must not bypass the protected contracts or treat the current Phaser drawings as authoritative when the HTML disagrees.

Separate functional gate: pre-visual Stage 2 remains **NOT READY — REPAIR REQUIRED** because `S2-F01` (P2 player-facing migration/developer copy) and `S2-F02` (P3 stale House Interior root marker) are confirmed and unrepaired. Those are not silently folded into this audit.

## Baseline

- Active entry point: `src/main.js`.
- Phaser scenes: `BootScene` and `TownScene` are eager; 16 scenes are loaded through `src/scenes/lazyScenes.js`.
- Rendering base: 1280×720, Phaser `FIT`, `CENTER_BOTH`, pixel-art and rounded-pixel settings.
- Package/build: Phaser `^4.2.1`, Vite `^8.2.2`.
- Latest repository HTML source of truth: `kindworks_little_bakery_v65_house_rescue_reintegrated_fixed.html`.
- Protected HTML SHA-256: `0b85bd71385b83e7a13676f7593ce376245959fa4ebf1a6b9a0e6765297aa5a5`.
- HTML size: 17,324,288 bytes / 13,382 lines.
- Save schema: 37; primary key `kindworks_phaser_v1`, with backup and recovery keys.

## Verification run

| Check | Result | Evidence |
| --- | --- | --- |
| Dependency presence | PASS | Installed lockfile/dependencies resolved with bundled Node runtime |
| Automated tests | PASS | 611 passed, 0 failed, 0 skipped |
| Minigame parity validator | PASS | 14 games, 75 comparisons, 105,795 generated level instances |
| Differential parity validator | PASS | 13 activities, 5,850 levels, 19 shared domains, 85 exact rules |
| Production build | PASS | Vite built 178 modules; 19 lazy chunks |
| Performance budget | PASS | Initial app 3,040,719 B; Phaser 1,374,829 B; total JS 4,812,437 B |
| Type checking | NOT CONFIGURED | No repository script/configured gate |
| Linting | NOT CONFIGURED | No repository script/configured gate |
| Runtime console | PASS WITH TEST WARNING | No exception/resource failure; isolated QA checkpoints emitted one interrupted-activity warning |
| Sprite-label coverage smoke | PASS FOR PRESENCE | River sample: DOM 404/404, Phaser 9/9; semantic stability remains a Phase 1 risk |

The test warning came from deliberately opening several isolated QA activities and is not evidence of a production save defect.

## Representative runtime evidence

The runtime was operated at the following emulated viewports. This is browser emulation, not physical-device certification.

| Surface | Viewport | Result |
| --- | ---: | --- |
| Town | 568×320, 844×390, 1024×768, 1280×720 | Rendered and usable; FIT/letterboxing observed where expected |
| Lawn Care | 568×320 | Board-only composition rendered |
| Corner Café | 844×390 | Restaurant entry/picker rendered |
| House Rescue | 1024×768 | Interior board rendered |
| Playground Power Wash | 1024×768 | Layered custom-canvas surface rendered |
| Village Grocer | 844×390 | Shop layout and shared panel rendered |
| River Restoration | 844×390 landscape | Rotate-upright gate rendered and gameplay paused |
| River Restoration | 390×844 portrait | Gameplay rendered in allowed orientation |

Evidence is stored under `evidence/runtime/`. Runtime coverage is representative; full surface accountability comes from the scene, DOM, data and controller inventory plus the existing scene-screen coverage matrix.

## Primary findings

### R0-01 — Hybrid presentation architecture (High)

The player-visible game is split across Phaser display objects, a 8,421-line CSS/DOM interface, generated textures, raw raster images, emoji/text placeholders and a custom layered Canvas renderer. No single asset manifest or visual factory owns the complete presentation contract.

### R0-02 — CSS is an implicit layout/state engine (High)

`src/style.css` and `src/shop-reference.css` contain 87 media rules, 171 safe-area references, 742 scene-specific selector references and 855 `!important` declarations. Moving a visual without mapping its DOM and CSS state can change unrelated scenes.

### R0-03 — Town is the largest coupled surface (High)

`TownScene.js` procedurally draws terrain, river, rocks, roads, houses, shops, landmarks, restoration states, farming, environmental dirt, NPC/animal layers and many decorative placeholders. Layout data exists in `src/data/town.js`, but visual geometry and state selection remain embedded in scene code.

### R0-04 — Labels exist, but are not yet a stable production manifest (High)

The Sprite AI labelling system reaches the sampled DOM and Phaser objects, but fallback IDs can derive from text, element order or occurrence suffixes. A wording change or display-list ordering change can therefore rename an asset identity. Phase 1 must freeze stable semantic IDs before art replacement.

### R0-05 — Power Wash is a separate renderer (High)

Playground Power Wash uses raw images and `LegacyPowerwashRenderer`, with layered canvases and dirt masks. It cannot safely migrate through the same path as ordinary Phaser sprites without preserving mask dimensions, interpolation and completion logic.

### R0-06 — Current Phaser visuals are not a safe universal art baseline (High)

Automated parity validates many rules and generated levels, not pixel-level layout/art equivalence. Existing fidelity audits and the legacy HTML remain necessary references for restaurants, shops, town, house interiors and minigames.

### R0-07 — Visual state and gameplay state are partially entangled (Medium–High)

Dirty/clean houses, lawn job readiness, crop/orchard stages, pollution, restoration tiers, NPC activities and animal presentation are selected directly from persistent or simulation state inside render methods. The selectors must be extracted without changing the underlying state or thresholds.

### R0-08 — Raw asset coverage is very small (Medium)

Only the animal reference sheet, fishing background and power-wash image set are active raw assets. Most visible content is procedural or DOM/CSS. Generated-art replacement will therefore require semantic recipes and placeholders, not just filename substitution.

## Acceptance-gate proof

- All 18 Phaser scenes are listed in the surface inventory.
- All 73 major DOM sections/asides/dialogs/nav surfaces are classified.
- All 10 authored town districts, 12 shop/venue exteriors, 19 house interiors and all discovered minigames are mapped.
- All raw raster loads, generated player textures, the Sprite AI registries and the custom canvas renderer are recorded.
- Hard-coded geometry, state selectors, responsive shell, camera and CSS coupling are ranked by actual source file.
- Persistent gameplay/save domains and coordinate contracts are explicitly protected.
- Phases 1–8 name concrete files and measurable tests in this repository.

## Files added by Phase 0

Only documentation and runtime evidence under `docs/qa/visual-readiness/` were added. Production code, gameplay data, saves and existing artwork were not modified.

