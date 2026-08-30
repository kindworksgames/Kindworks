# KindWorks Asset Lab repair and verification report

Date: 2026-08-30  
Starting baseline: `phase-2-ui-simplification@3387bcb`  
Scope: repair of every confirmed finding in the comprehensive Asset Lab audit.

## Result

**PASS — THE ASSET LAB IS READY TO SUPPORT PRODUCTION ARTWORK REVIEW.**

The tool is now an indexed, manifest-driven production inspection surface rather than a pilot gallery. It exposes every locked production asset family and category, consumes validator and usage data, refuses to describe fallback artwork as valid, supports detailed static and animated inspection, and stays absent from production builds.

This result applies to the Asset Lab architecture and the currently registered library. It does not mean that contract-only artwork has already been generated. Contract-only and Phase 8A placeholder records are deliberately shown as not ready until approved runtime artwork is integrated.

## What changed

- A generated production index now joins the runtime visual manifest, all 15 category contracts, all 74 Phase 10 production families, all 18 planned scene groups, Phase 8A asset contracts, deep validator findings, and runtime usage data.
- Catalog construction uses indexes and bounded result pages. The Lab lazily loads the selected preview instead of eagerly loading the whole library.
- Placeholder and fallback records use explicit `placeholder`, `contract-only`, `invalid`, and approval statuses with actionable messages and expected runtime paths.
- Search and filters cover semantic ID, filename, category, scene, family, tag, production status, visual state, direction, animation, approval, and validation status.
- Preview controls now support static images, spritesheets, atlas frame metadata, state/variant/facing selection, play/pause/restart, frame stepping, deterministic scrubbing, playback speed, native/gameplay size, and 0.25x–8x zoom.
- Overlays include canvas, frame, decoded opaque bounds, origin, ground contact, sockets, named standing points, declared bounds, collision, navigation, interaction, and touch geometry.
- Backgrounds include neutral, grass, road, interior, water, light, and dark; day, dusk, and night use the game's real lighting curve.
- Device frames include narrow phone, modern phone, tablet 4:3, reference, and desktop profiles with safe-area and minimum-touch information.
- The details panel exposes manifest, contract, prefab, instance, scene-pack, animation, legacy-key, usage, and validation provenance.
- Reload releases only the selected cache entry, displays a loading state, uses a cache-busted URL, and reports a failed reload without crashing or mutating gameplay state.
- Contact-sheet export is paginated at 40 records per page; the normal DOM list is capped at 160 records per page.
- The production guard now rejects 35 Asset Lab/tooling markers from the final bundle.

## Original findings

| ID | Original severity | Status | Repair and evidence |
| --- | --- | --- | --- |
| ALAB-001 | High | **FIXED** | All 22 Phase 8A placeholders report `placeholder` / `not-generated`, name the expected runtime file, and state that fallback art is not eligible for approval. See `02-placeholder-validation-diagnostics.png`. |
| ALAB-002 | High | **FIXED** | Generated discovery exposes 15/15 category contracts, 74/74 production families, and 18/18 planned scene groups without a hand-written Asset Lab list. The live catalog currently contains 112 records: 37 runtime records, 74 family records, and the audio category contract record. |
| ALAB-003 | High | **FIXED** | Per-asset validator findings, required/optional status, duplicate-content warnings, orphan/unused results, and production eligibility are indexed and filterable. The current full-library result is 0 invalid, 0 orphan, 0 unused, 22 placeholder, and 1 documented duplicate-content warning. |
| ALAB-004 | Medium | **FIXED** | Spritesheet frame selection/scrubbing and frame-boundary overlays are operational. Atlas records expose registered frame names and use the atlas loader path. No approved runtime atlas exists yet, so atlas metadata behavior is test-proven with controlled fixtures and current contract-only atlas families appear honestly as not ready. |
| ALAB-005 | Medium | **FIXED** | The Lab decodes the selected frame alpha data to draw actual opaque bounds and separately displays standing points and declared geometry. See `07-visible-bounds-overlays.png`. |
| ALAB-006 | Medium | **FIXED** | Added restart, range scrubber, deterministic frame readout, frame stepping, and speed controls. Representative resident animation was restarted and scrubbed through all four frames. |
| ALAB-007 | Medium | **FIXED** | Lazy loading, indexed facets, 160-record list pages, and 40-record contact-sheet pages replace eager/monolithic handling. A synthetic 5,000-record catalog built and filtered in 55 ms in the final targeted test run; contact sheets remain 960x2200 per page. |
| ALAB-008 | Medium | **FIXED** | Coarse-pointer/narrow-phone controls enforce a 44 px minimum, the long panel is independently scrollable, and a 44 px Lab toggle collapses it to restore the full preview. Browser-emulated evidence is in screenshots 04 and 05. Physical-device testing remains a release QA activity, not an Asset Lab code defect. |
| ALAB-009 | Medium | **FIXED** | Day/dusk/night uses KindWorks world-lighting values. Device presets display the canonical viewport and safe-area contract. This is an asset preview, not a replacement for full scene-responsive regression testing. |
| ALAB-010 | Low | **FIXED** | `Reload selected` destroys the selected preview, releases its texture, shows loading feedback, reloads with cache busting, and restores a valid/error state. Repeated reload of the approved Fishing background completed without a stuck loader or duplicate object. |
| ALAB-011 | Low | **FIXED** | Full metadata and usage lookup now reports scene packs, prefab consumers, layout instances, animation owners, legacy keys, runtime source, production contract, approval state, and validation findings. |

## Manual browser verification

The repaired development build was operated in the Codex in-app Chromium browser. These are browser-emulated profiles, not physical devices.

### Every production category

| Contract category | Representative record | Result |
| --- | --- | --- |
| calibration | `foundation.calibration-specimens` | Contract shown; not falsely previewed |
| system-fallback | `system.visual-fallbacks` | Contract shown; not falsely approved |
| terrain | `terrain.town.slice.grass` | Placeholder diagnostic and expected path shown |
| structure | `structure.bridge-kit` | Contract shown |
| vegetation | Phase 8A oak tree | Placeholder diagnostic shown |
| prop | `prop.town-bin.small` | Integrated interactive preview |
| effect | `effects.environment-atlas` | Contract-only atlas family shown |
| vehicle | `vehicle.municipal-collection-sheet` | Contract shown |
| building | Phase 8A house | Placeholder/state contract shown |
| character | `character.animal.reference-sheet` and resident sheet | Static-frame and directional animation previewed |
| animal | Phase 8A dog | Placeholder/animation contract shown |
| ui | Phase 8A interaction/reward UI | Placeholder contract shown |
| interior | `interior.room-construction-tiles` | Contract shown |
| minigame | `minigame.powerwash.playground.master` | Runtime preview and usage shown |
| audio | `category.audio` | Machine-readable category contract shown |

Additional operations passed: semantic/filename search, every dedicated filter, previous/current comparison, animation restart and frame scrub, native/gameplay scale, 4x zoom, day/night, decoded opaque bounds, all geometry overlays, global issue report, selected-asset reload, and metadata/usage expansion.

### Viewports

| Browser-emulated viewport | Result |
| --- | --- |
| 568x320 narrow landscape phone | PASS: no page overflow; 44 px controls; collapsible tool panel |
| 1024x768 tablet | PASS: complete preview and independently scrollable controls |
| 1280x720 development reference | PASS: complete inspection surface |

## Automated evidence

- Targeted Asset Lab, asset-contract, and asset-pipeline suite: **35/35 passed**.
- Core catalog performance: **5,000 records built and filtered in 55 ms** in the final targeted run.
- Full repository suite: **784/785 passed**. The one failing test is a pre-existing, unrelated gameplay-geometry fixture concerning Grocer/Paws/Harbour standing points; this repair did not modify those files or geometry definitions.
- Production build: **PASS** after review of the unchanged visual baselines.
- Production surface: **PASS — 35 development markers absent**.
- Full asset contracts, registry, scene-layout, scale, artwork pipeline, Phase 8A, and Phase 10 validators: **PASS**.

Machine-readable evidence is in [EVIDENCE_AFTER_REPAIR.json](./EVIDENCE_AFTER_REPAIR.json). Screenshots are in [screenshots-after-repair](./screenshots-after-repair/).

## Screenshot index

1. `01-desktop-manifest-discovery.png` — manifest-driven desktop surface.
2. `02-placeholder-validation-diagnostics.png` — missing production art cannot report valid.
3. `03-previous-current-comparison.png` — registry-driven comparison.
4. `04-narrow-phone-open-panel.png` — 568x320 controls.
5. `05-narrow-phone-collapsed-preview.png` — preview-first phone mode.
6. `06-tablet-preview.png` — 1024x768 tablet profile.
7. `07-visible-bounds-overlays.png` — decoded opaque and declared geometry overlays.
8. `08-contract-only-family.png` — production family without runtime art.
9. `09-production-build-no-asset-lab.png` — the same query route in the production build loads the game with no Lab UI or readiness marker.

## Remaining limitations and risks

- There is currently no approved runtime atlas in the library. Atlas loading, frame metadata, frame selection, validation, and production contracts are automated-test covered; a real atlas should be included in the first approved atlas integration review.
- Physical phone/tablet operation was not available. Browser emulation passed, but physical touch ergonomics should remain part of release-device QA.
- One duplicate-content warning remains by design: a protected legacy Fishing source and its approved runtime copy have identical bytes. It is visible to reviewers and is not treated as an orphan or silent duplicate ID.
- The Asset Lab is intentionally development-only and has no player-facing route.

## Files introduced or materially changed by this repair

- `scripts/generate-asset-lab-production-index.mjs`
- `src/visual/generated/assetLabProductionIndex.js` (generated)
- `src/visual/dev/assetLabCatalog.js`
- `src/visual/dev/AssetLabScene.js`
- `scripts/audit-asset-lab-comprehensive.mjs`
- `scripts/verify-production-surface.mjs`
- `tests/asset-lab-production-repair.test.js`
- `tests/visual-readiness-phase-7.test.js`
- `package.json`
- this repair report and its evidence files

No gameplay, progression, economy, save schema, level data, or production artwork was changed by the Asset Lab repair.
