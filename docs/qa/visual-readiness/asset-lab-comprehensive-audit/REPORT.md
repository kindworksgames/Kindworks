# KindWorks Asset Lab comprehensive audit

Date: 2026-08-30  
Baseline: `phase-2-ui-simplification@3387bcb`  
Scope: read-only-first audit of the development Asset Lab; no production gameplay or visual implementation was changed.

## Verdict

**REPAIR REQUIRED BEFORE FULL ART PRODUCTION.**

The Asset Lab is a useful pilot inspection tool and is safely excluded from the production build. It can browse every entry in its current composed manifest, inspect the registered pilot assets, switch declared states/directions/layers, step animations, compare approved previous/current artwork, and show declared geometry overlays.

It is not yet a comprehensive production Asset Lab. Most importantly, 22 Phase 8A contract placeholders render the conspicuous missing-art fallback while the Lab reports **“Registry/runtime checks: valid”** and shows zero warnings. The tool also covers only 7 of 15 production contract categories and 5 of 18 planned production scene groups. Deep contract-validation results, missing/orphan status, atlas-frame inspection, actual opaque bounds, standing points, reliable large-library handling, and artist-friendly reload are absent.

No blocker was found in production exclusion. Three high-severity trust/coverage gaps and several medium usability/inspection gaps require repair.

## Method and evidence

The audit combined source tracing, automated tests, production-build checks, browser operation, full current-catalog traversal, selector traversal, and synthetic load testing.

- Inspected `src/visual/dev/AssetLabScene.js`, catalog composition, the production manifest, Phase 8A placeholders, prefab/animation registries, validation tools, tests, and the production-surface guard.
- Operated all 37 entries in the current development catalog.
- Selected 193 state, variant, animation, facing, and layer combinations.
- Exercised semantic-ID and filename search plus category, scene, status, family, and tag filtering.
- Tested a resident spritesheet, every public-bin state/layer, Fishing previous/current comparison, all 22 placeholders, and fallback behavior.
- Emulated desktop `1280x720`, narrow landscape phone `568x320`, and tablet `1024x768`. These are browser emulations, not physical-device tests.
- Tested a production build at `?qa=asset-lab`: no Asset Lab panel or readiness marker was present and the normal Town scene loaded.
- Benchmarked synthetic 1,000- and 5,000-entry catalogs and projected contact-sheet dimensions/memory.

Machine-readable counts and benchmark results are in [EVIDENCE.json](./EVIDENCE.json). Screenshots are under [screenshots](./screenshots/).

## Verified strengths

1. **Shared source:** the Lab catalog is generated from the shared visual manifest and Phase 8A manifest rather than a second hand-written preview list.
2. **Current-catalog browseability:** all 37 composed entries appeared, and every entry could be selected without a browser exception.
3. **Useful pilot controls:** semantic/filename search, category/scene/tag/status/family filters, state/variant/facing/animation selection, play/pause, frame stepping, playback speed, layer isolation, shadow toggle, native/gameplay scale, seven flat backgrounds, geometry overlays, and previous/current comparison are present.
4. **Declared geometry inspection:** origin, ground anchor, sockets, declared visual bounds, collision, navigation, interaction, and touch geometry are available where prefab data provides them.
5. **Production isolation:** the production build excludes the dev UI and ignores the Asset Lab query route.
6. **Automated baseline:** 26 targeted Asset Lab, contract, and asset-pipeline tests passed; the production build and 31-marker production-surface guard passed.

## Coverage summary

| Measure | Result | Assessment |
| --- | ---: | --- |
| Current composed-manifest entries | 37/37 selectable | PASS |
| File-backed current assets | 7 | Limited baseline |
| Contract placeholders | 22 | Present but incorrectly reported valid at runtime |
| Production contract categories represented | 7/15 (46.7%) | FAIL |
| Planned production scene groups represented | 5/18 (27.8%) | FAIL |
| Phase 10 production family IDs represented exactly | 0/74 | FAIL |
| Selector combinations exercised | 193 | PASS for current catalog |
| Placeholder fallbacks reported with warnings | 0/22 | FAIL |
| Production exclusion | 31/31 forbidden markers absent | PASS |

The `0/74` result does not mean those production artworks should already exist. It means the Asset Lab does not yet expose the locked production-plan family identities as contract-only, pending, generated, approved, or integrated records, so it cannot act as the complete production tracking and inspection surface requested.

## Severity-ranked findings

### ALAB-001 — HIGH — Placeholder/fallback artwork is presented as valid

**Reproduction:** open the Asset Lab, select any `phase-8a-specified-placeholder` asset such as the house slice placeholder. A magenta fallback renders, warning count remains zero, and the details panel says “Registry/runtime checks: valid.” This occurred for all 22 placeholders.

**Expected:** an explicit `PLACEHOLDER`, `MISSING EXPECTED RUNTIME ART`, or `FALLBACK ACTIVE` state, with the expected file and next production action.

**Actual:** the Lab conflates “the fallback rendered without crashing” with “the artwork is valid.”

**Risk:** an artist or reviewer can approve missing art accidentally. This is the most serious trust defect.

### ALAB-002 — HIGH — Production inventory coverage is incomplete

Only 7 of 15 asset-contract categories and 5 of 18 planned production scene groups are represented. Contract categories absent as first-class Lab facets are calibration, structure, vegetation, effect, vehicle, animal, interior, and audio. None of the 74 locked Phase 10 production family IDs is represented exactly.

**Risk:** “browse every manifest asset” passes only for the current pilot manifest, not the complete production inventory the visual-readiness architecture already defines.

### ALAB-003 — HIGH — Contract validator and missing/orphan results are not integrated

The repository has deeper command-line validators, but the Lab does not consume their per-asset results. It cannot filter by validation result, display contract errors, distinguish required/optional missing art, or identify orphaned files/entries. The false-valid placeholders demonstrate the gap.

**Risk:** runtime preview and actual production eligibility can disagree.

### ALAB-004 — MEDIUM — Spritesheet and atlas inspection is incomplete

Spritesheets can animate and step through configured animations, but there is no frame-grid/boundary overlay or arbitrary frame scrubber. Atlas loading is supported by the loader, but the current manifest contains no atlas and the UI has no atlas frame browser or selector. Atlas preview is therefore **BLOCKED/UNPROVEN**, not passed.

### ALAB-005 — MEDIUM — Visible bounds and standing points cannot be verified

“Visual bounds” shows declared prefab bounds or the complete technical frame, not the decoded non-transparent pixel bounds. Excess padding and shifted silhouettes can therefore remain hidden. Navigation obstacles are visible, but named standing points/destinations are not.

### ALAB-006 — MEDIUM — Animation controls lack restart and scrubbing

Play/pause, previous/next frame, and speed are present. There is no explicit restart control, timeline, range scrubber, frame number entry, or deterministic current-frame readout. This makes frame-order and contact-point inspection slower and less reliable.

### ALAB-007 — MEDIUM — Large-library architecture will not scale safely

The Lab eagerly preloads file-backed assets, creates one DOM option per catalog entry, and exports one monolithic contact-sheet canvas.

- 1,000-entry synthetic catalog: about 63 ms catalog construction in the recorded run; projected sheet `960x55,000`, about 211 MB RGBA, exceeding common browser canvas height limits.
- 5,000-entry synthetic catalog: about 1.15 seconds construction in the recorded run; projected sheet `960x275,000`, about 1.056 GB RGBA.

The list needs indexing/virtualization, preview-on-selection, and paginated contact-sheet export before the full production inventory arrives.

### ALAB-008 — MEDIUM — Narrow-phone preview is functional but not touch-friendly

At `568x320`, the panel occupies roughly 44% of the viewport, its content is 1,053 px tall within a 304 px scroll area, common buttons are about 30 px high, and checkbox hit areas are roughly 13 px wide. Controls fall below the project’s intended 44 px touch behavior and the actual asset preview becomes small.

No browser overflow or console error occurred. Physical-device accuracy remains untested.

### ALAB-009 — MEDIUM — Day/night and device previews are approximations

“Light” and “dark” are flat background colors; they do not apply the actual game lighting/tint/shadow pipeline. Viewport profiles draw frames inside the canonical preview but do not reflow the inspected scene, apply device safe areas, or reproduce the real responsive UI.

### ALAB-010 — LOW — No efficient changed-asset reload

There is no selected-asset cache release/reload, fingerprint refresh, or watcher status. A full page refresh is required after artwork changes.

### ALAB-011 — LOW — Metadata and usage provenance are too shallow

The details panel shows a concise status/source/scene-pack summary, not the full manifest and contract metadata. “Scenes using the asset” is inferred from scene packs and does not list actual layout instances, prefab consumers, legacy bridge consumers, or runtime owners.

## Invalid, missing, and category tests

- The command-line asset tests correctly reject controlled missing, duplicate, contract, and pipeline cases: 26/26 targeted tests passed.
- The Lab itself does **not** expose those validation results.
- The current manifest includes no atlas asset, so atlas inspection could not be honestly runtime-approved.
- The 22 Phase 8A missing-art placeholders were the principal runtime invalid/missing test. All showed the fallback but none produced an actionable Lab warning.
- Every category currently present in the composed manifest was browsed. Categories defined by the production contract system but absent from that manifest could not be previewed and are recorded as missing coverage rather than passed.

## Viewport and usability results

| Profile | Result | Evidence |
| --- | --- | --- |
| Desktop `1280x720` | PARTIAL PASS | Main tool usable; large scroll-heavy control panel; no console errors |
| Narrow phone `568x320` | FAIL usability gate | Preview squeezed; sub-44 px controls; 1,053 px panel content; no overflow/crash |
| Tablet `1024x768` | PARTIAL PASS | Usable, panel still scrolls; no console errors |
| Production build | PASS | Dev panel/marker absent; normal Town scene loaded |
| Physical phone/tablet | UNTESTED | Only browser emulation was available for this audit |

## Automated verification

Commands and outcomes:

- Targeted Asset Lab/contract/pipeline tests: **PASS, 26/26**.
- Production build: **PASS**.
- Production-surface verification: **PASS, 31 forbidden dev markers absent**.
- Browser console during full current-catalog traversal: **no runtime errors**, but this does not compensate for missing semantic warnings.

Existing Phase 7 tests are helpful but predominantly assert catalog/source markers. They do not prove deep validator integration, placeholder diagnostics, atlas controls, visible-pixel bounds, large-library behavior, or touch ergonomics.

## Required next action

Implement the trust and full-inventory repairs in [REPAIR_SPECIFICATION.md](./REPAIR_SPECIFICATION.md) before using the Asset Lab as the approval authority for generated artwork. Production exclusion is already strong and should remain protected by the existing build guard.
