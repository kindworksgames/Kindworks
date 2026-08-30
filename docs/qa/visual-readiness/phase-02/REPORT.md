# Phase 2 — Contracts, Semantic Asset Registry and Legacy Compatibility

Date: 2026-08-29  
Branch: `phase-2-ui-simplification`  
Starting commit: `3387bcb48964c41edbdc26f4257d2990fcdaf8d5`  
Scope: visual identity and compatibility foundation; no gameplay redesign and one registry-migrated file asset

## Verdict

**PHASE 2 PASS.**

KindWorks now has a versioned semantic visual registry beside the existing render paths. The registry describes the seven active file-backed assets in their current locations, generated resident frames, four existing resident animations, one stable Fishing scene instance/prefab/state, three scene asset packs, geometry contracts, legacy mappings and two environment-specific fallbacks.

Only the Reedbank Fishing background was moved behind the registry load/render contract. The animal sheet, resident generation and Power Wash canvas assets are registered but remain on their existing loading paths for later incremental phases.

## Assumptions and protected boundaries

- Phase 0's architecture map and Phase 1's regression report were re-read and checked against the repository before editing.
- Schema-37 state, `kindworks_phaser_v1`, gameplay services, level data, rewards, progression, inventory, NPCs, pets, authored coordinates, collision and Power Wash masks remain protected.
- A registry entry may change a file, technical visual metadata or renderer recipe; it must not write gameplay or save state.
- The existing Phaser, DOM and custom-canvas renderers remain supported. Phase 2 does not force a renderer rewrite.
- A development fallback may be conspicuous. A production fallback must remain safe and non-crashing while still recording the failure.

## Implemented architecture

```text
src/visual/contracts.js
       │ schema versions, renderer/asset/geometry/fallback contracts
       ▼
src/visual/visualManifest.js
       │ semantic assets, instances, prefabs, state maps, animations,
       │ anchors/sockets/geometry, scene packs, compatibility, fallbacks
       ▼
src/visual/validateVisualManifest.js ── build/test validation
       │
       ▼
src/visual/VisualRegistry.js ── runtime lookup, Phaser queueing,
       │                         identity tags, failure recording, fallbacks
       └── LegacyCompatibility.js ── legacy key → semantic identity/runtime key
```

The top-level registry schema and every definition currently use version 1. Semantic IDs are independent of filenames and image-generator names.

## Source-of-truth coverage introduced

| Contract | Phase 2 implementation |
| --- | --- |
| Semantic asset IDs | Ten stable IDs: seven file-backed, generated resident family, two generated fallbacks |
| Stable scene-instance IDs | `instance.fishing.reedbank.background.main` |
| Files and technical metadata | Current file, format, render target, dimensions, alpha/pixel-art, frames or mask sensitivity |
| Visual prefab/recipe | `prefab.scene.fishing.reedbank.background` with one asset layer |
| Visual-state mapping | Stable Fishing background state with validated default prefab |
| Animation definitions | Four existing resident walk definitions, four frames, 9 fps, repeat −1 |
| Anchors and sockets | 0.5/0.5 origin and 640/360 `sceneCenter` socket |
| Geometry | Separate visual/collision/navigation/interaction/touch slots; Fishing background preserves 1280×720 visual bounds and null functional geometry |
| Scene packs | Boot, Fishing and Playground Power Wash dependencies |
| Fallbacks | Visible magenta checker in development; transparent safe texture in production; both log to memory and reporter |

## Registered active files

| Semantic ID | Existing file | Status |
| --- | --- | --- |
| `character.animal.reference-sheet` | `/assets/animals/reference-master-v44.png` | Registered; legacy loader retained |
| `scene.fishing.reedbank.background` | `/assets/legacy-reference/fishing.webp` | Registry migrated |
| `minigame.powerwash.playground.master` | `/assets/powerwash/playground-master.png` | Registered; canvas loader retained |
| `minigame.powerwash.playground.dirt-mask` | `/assets/powerwash/playground-reference-dirt.png` | Registered; functional canvas mask retained |
| `minigame.powerwash.tool.precision` | `/assets/powerwash/tool-precision.png` | Registered; canvas loader retained |
| `minigame.powerwash.tool.standard` | `/assets/powerwash/tool-standard.png` | Registered; canvas loader retained |
| `minigame.powerwash.tool.wide` | `/assets/powerwash/tool-wide.png` | Registered; canvas loader retained |

No production file was moved, renamed, deleted or overwritten.

## One-asset migration proof

The low-risk proof is `scene.fishing.reedbank.background`.

1. `FishingScene` no longer contains `/assets/legacy-reference/fishing.webp` or calls `this.load.image` directly.
2. It asks `VisualRegistry.queuePhaserAsset` for the semantic ID and tags the created display object with the stable instance and prefab IDs.
3. The automated replacement proof clones the manifest and changes only that asset's file to the existing `/assets/legacy-reference/magnet-fishing.webp`.
4. The altered manifest validates, the resolved URL changes, and the stable runtime texture key remains `kw.asset.scene.fishing.reedbank.background`.
5. The scene source remains unchanged in that proof. The production manifest continues to select the approved Fishing file.

This proves future replacement of the migrated asset is a manifest-only operation; the one-time scene integration performed in this phase is complete.

## Compatibility and failure proof

- `legacy-fishing` resolves to the stable semantic texture key.
- Existing unmigrated current keys such as `resident-down-0` pass through unchanged.
- Existing resident animation keys resolve unchanged.
- Duplicate IDs are rejected within a definition collection and across collections.
- Duplicate legacy keys, missing files, unknown assets, invalid prefabs/states/animations/packs and invalid fallbacks are rejected.
- A runtime unknown or failed asset returns a conspicuous generated development texture or transparent production texture and records a structured failure without touching persistent state.
- `npm run visual:registry:check` is included in `postbuild`, so a missing registered file blocks a production build.

## Runtime and regression evidence

| Check | Result |
| --- | --- |
| Phase 2 focused tests | PASS — 8/8 |
| Complete automated suite | PASS — 664/664 |
| Minigame parity | PASS — 14 games, 75 comparisons, 105,795 generated instances |
| Differential HTML parity | PASS — 13 activities, 5,850 levels, 19 shared domains, 85 exact rules |
| Visual-registry validator | PASS — 10 assets, 7 files, 1 prefab, 1 scene instance, 4 animations, 3 packs |
| Production build | PASS — 187 modules, 19 lazy chunks |
| Performance budget | PASS — initial app 3,041,704 B; Phaser 1,374,829 B; total JS 4,810,787 B |
| Production-surface audit | PASS — 18 development-only markers absent |
| Phase 1 visual baselines | PASS — 10 images, 6 families, 5 landscape profiles, 61 tracked source files |
| Live Fishing scene | PASS — 1280×720, protected Reedbank background visible, no page overflow |
| Browser console | PASS — no warning/error during Fishing and ten baseline routes |

The browser evidence is emulation, not a physical device test. All ten baseline routes reached the expected scene at 568×320, 844×390, 1024×768, 1280×720 or 1366×768 with no page overflow. Five non-Town baseline files remained byte-identical; the animated Town captures received reviewed current-frame hashes.

The save/gameplay proof uses the deterministic schema-37 Phase 1 fixture. Registry construction, asset lookup and compatibility resolution leave its serialized digest, 12,500 coins, inventory and equipped mower unchanged. The complete gameplay and parity suites provide the connected regression evidence.

## Acceptance gate

| Requirement | Evidence | Result |
| --- | --- | --- |
| Replace one asset through only a registry entry | Automated valid alternate-file manifest proof | PASS |
| Scene needs no gameplay edit for replacement | Fishing source contains semantic load/identity only; no raw file/direct loader | PASS |
| Unmigrated legacy keys still work | Pass-through tests plus unchanged Boot/player/Power Wash paths | PASS |
| Duplicate and missing entries fail | Deliberate invalid-manifest tests and build validator | PASS |
| Saves/gameplay remain unchanged | Fixture digest, 664 tests, two parity validators | PASS |

## Remaining legacy usage

This is expected incremental debt, not a failed Phase 2 gate:

1. `BootScene` still directly loads the registered animal spritesheet using `ANIMAL_REFERENCE_TEXTURE_KEY` and `ANIMAL_REFERENCE_SHEET_PATH`.
2. `PlayerCharacter.createPlayerAssets` still generates resident textures and registers the four animations directly. The registry mirrors the exact current keys, four frames, 9 fps and repeat behavior but is not yet their runtime creator.
3. `PlaygroundPowerwashScene` still loads five registered files with native `Image` objects. This remains deliberate because master/dirt dimensions are functional and require the later canvas adapter phase.
4. DOM/CSS/procedural Phaser visuals, emoji placeholders, South Shore Scoops' separate manifest and `legacyVisualStates.js` are not migrated in this one-asset proof.
5. Most scene-instance, prefab, state and geometry records remain to be added scene-family by scene-family. Phase 2 establishes and validates the contract rather than pretending coverage is complete.

## Files changed for Phase 2

- `src/visual/contracts.js`
- `src/visual/visualManifest.js`
- `src/visual/validateVisualManifest.js`
- `src/visual/LegacyCompatibility.js`
- `src/visual/VisualRegistry.js`
- `src/visual/index.js`
- `src/main.js`
- `src/scenes/FishingScene.js`
- `scripts/validate-visual-registry.mjs`
- `tests/visual-readiness-phase-2.test.js`
- `package.json`
- `docs/qa/visual-readiness/phase-02/REPORT.md`
- `docs/qa/visual-readiness/README.md`
- `docs/qa/visual-readiness/phase-01/BASELINE_MANIFEST.json`
- `docs/qa/visual-readiness/phase-01/baselines/*` (reviewed recapture required by the Phase 1 fingerprint gate)

Pre-existing dirty-worktree changes were preserved. No commit or push was performed as part of this request.

