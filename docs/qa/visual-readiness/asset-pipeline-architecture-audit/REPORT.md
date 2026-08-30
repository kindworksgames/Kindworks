# KindWorks Asset-Loading and Manifest Architecture Audit

Date: 2026-08-30  
Branch: `phase-2-ui-simplification`  
Starting commit: `3387bcb48964c41edbdc26f4257d2990fcdaf8d5`  
Phaser: `4.2.1`  
Build system: Vite `8.2.2`  
Audit mode: read-only-first; no production source was changed

Supporting machine-readable evidence: [TARGETED_TEST_RESULTS.json](./TARGETED_TEST_RESULTS.json)

## Verdict

**NOT READY FOR LARGE-SCALE ARTWORK REPLACEMENT.**

The repository contains a sound pilot architecture: stable semantic IDs, a versioned registry, a production-art staging validator, safe fallbacks, a prefab renderer, the town-bin pilot, Fishing manifest integration, and a development Asset Lab. Those pieces work for the surfaces already migrated.

They do not yet control most of the game. Only **6 of 74 planned asset families (8.1%)** have any representation in the production runtime manifest, and only **2 of 73 art-bearing families (2.7%)** are fully controlled by the manifest and a compatible renderer/factory. Of the seven image files currently used by gameplay, all seven are described in the registry, but only Fishing is actually loaded through it: **1 of 7 (14.3%)**.

The most serious confirmed risks are:

1. The runtime validator accepts an incompatible file with the wrong format, dimensions, alpha expectations, sprite frame size, or animation frame references.
2. Duplicate Phaser texture/cache keys are not detected and can silently resolve to whichever asset entered the global cache first.
3. Incorrect path casing passed the repository validator on this Mac but failed in the production HTTP preview.
4. Animal, resident, and Power Wash artwork is registered but still loaded or addressed directly by gameplay code.
5. Scene packs are descriptive data only; no production loader executes them, and the only lookup returns the first matching pack.

No current valid asset failed to load during this audit. This is an architecture-readiness failure, not a claim that the present build is broken.

## Scope and method

The audit covered:

- `src/visual/visualManifest.js`, `VisualRegistry`, contracts, compatibility mappings, prefabs, renderers, layouts, generated runtime packs, Asset Lab, Reference Overlay, and scale tools;
- the generator-neutral artwork specification and its staging/master/runtime validation;
- Phase 8A contract-only assets and the 74-family Phase 10 plan;
- all physical files under `public/assets` and artwork production directories;
- every source-level direct file path, texture key, animation key, Canvas `Image`, Phaser loader call, CSS image reference, and procedural visual family found by repository search;
- development and production browser loading, Asset Lab reload, Fishing re-entry, console diagnostics, correct asset URLs, and a deliberately wrong-case production URL.

No asset was moved, renamed, replaced, or deleted. Negative manifest tests used cloned in-memory manifests. The production build regenerated ignored `dist/` output only.

## Current architecture map

| Layer | Source of truth | Current role | Audit result |
|---|---|---|---|
| Runtime semantic registry | `src/visual/visualManifest.js` | 15 assets, 6 prefabs, 1 stable instance, 4 animations, 4 scene packs | Structurally valid but narrow and technically under-validated |
| Runtime resolver/loader | `src/visual/VisualRegistry.js` | Semantic lookup, URL construction, Phaser image/sheet queueing, failure log and fallback | Works for Fishing; not used by most production visuals |
| Legacy bridge | `src/visual/LegacyCompatibility.js` | Maps two texture keys and four resident animations; passes unknown keys through | Useful transition aid, but pass-through permits indefinite raw-key usage |
| Family renderer | `src/visual/renderers/PhaserPrefabRenderer.js` and `TownBinVisualFactory.js` | Resolves prefab state, geometry, depth and replacement image | Working pilot for bins only |
| Artwork production spec | `artwork/specifications/kindworks-artwork-manifest.v1.json` | Rich generator-neutral file, workflow, canvas, frame, state, geometry and provenance contract | Strong, but currently contains one runtime-ready asset |
| Runtime pack generator | `scripts/lib/artworkRuntimePackGenerator.mjs` | Generates semantic runtime metadata from approved artwork | Deterministic and working for Fishing |
| Phase 8A package | `artwork/production/phase-8a/vertical-slice-production-package.v1.json` | 22 complete contracts shown as placeholders in Asset Lab | Contract-only; none is approved runtime artwork |
| Phase 10 plan | `artwork/production/phase-10/production-migration-plan.v1.json` | 74 deduplicated production families, assigned to all 18 production scenes | Complete plan, not implementation coverage |
| Legacy sidecar manifests | `public/assets/powerwash/manifest.json`, `public/assets/legacy-reference/manifest.json` | Extraction provenance and checksums | Competing descriptive sources; not runtime-loaded manifests |
| Direct/procedural systems | Town, restaurants, interiors, minigames, player/NPC/animal renderers | Phaser Graphics, DOM/CSS, emoji, generated textures and direct files | Majority of the visible game bypasses semantic replacement |

### Important execution facts

- `VisualRegistry` validates structure in its constructor, builds indexes, and records runtime failures (`src/visual/VisualRegistry.js:8-23`, `42-46`).
- `queuePhaserAsset` supports only image and spritesheet kinds. If a texture key already exists, it returns immediately without confirming which semantic asset owns it (`src/visual/VisualRegistry.js:70-94`).
- A load error is reported and a fallback is generated under the requested key (`src/visual/VisualRegistry.js:82-89`). Development uses a visible 64-pixel checker; production uses a transparent 2-pixel texture (`src/visual/VisualRegistry.js:53-67`).
- File validation for the runtime registry checks only whether a path can be accessed (`src/visual/validateVisualManifest.js:93-100`).
- The richer artwork validator does inspect bytes, dimensions, alpha, frame grids, animations, geometry, file locations and runtime byte budgets (`scripts/lib/artworkPipelineValidation.mjs:38-184`).
- The build runs both validators, but only the one Fishing production asset is connected from the rich artwork manifest into the runtime pack (`package.json:8-20`).
- `getScenePackByScene` returns only the first matching pack (`src/visual/VisualRegistry.js:31`), and repository search found no production caller. Scenes still choose what to preload themselves.

## Physical asset inventory

| File group | Files | Registry status | Runtime loading |
|---|---:|---|---|
| Animal reference sheet | 1 PNG, 384×512, alpha | Registered as `character.animal.reference-sheet` | Direct `BootScene` spritesheet load; consumers use raw key/path |
| Fishing runtime | 1 WebP, 720×405 | Fully registered, generated pack and prefab | Loaded through `VisualRegistry` |
| Fishing comparison copy | 1 byte-identical WebP, 720×405 | Comparison metadata only | Asset Lab/reference comparison |
| Other legacy references | 2 WebP files | Not primary semantic assets | Harbour and magnet reference files are not runtime manifest entries |
| Power Wash | 5 PNG files | All five registered with dimensions and native Canvas keys | Direct `new Image()` loader with literal filenames |
| Approved Phase 8A output | 0 | 22 placeholder contracts only | Not integrated, correctly blocked |
| Audio | 0 | No runtime asset kind or loader contract | Not present |

The only duplicate file content is intentional: the Fishing runtime WebP and its previous-reference WebP have the same SHA-256. No validator currently reports duplicate content across the repository.

## Manifest coverage

Four percentages are reported because a single number would hide material differences:

| Measure | Coverage | Meaning |
|---|---:|---|
| Planned-family semantic coverage | **6/74 = 8.1%** | `system.visual-fallbacks`, bins, resident base, animal identities, Power Wash, and Fishing have some runtime semantic representation |
| Fully manifest/factory-controlled art families | **2/73 = 2.7%** | Bins and Fishing can be replaced without scene/gameplay edits; system fallback is excluded from the art-family denominator |
| Current gameplay image loads controlled by registry | **1/7 = 14.3%** | Fishing uses the registry; animal and five Power Wash files bypass it |
| Physical image files present as primary registry sources | **7/10 = 70.0%** | Three legacy reference images are comparison/extraction files rather than primary sources |

## Category coverage matrix

`PASS` means artwork in the category is presently replaceable through semantic data without gameplay edits. `PARTIAL` means contracts or a pilot exist but live production use still bypasses them. `FAIL` means the category is predominantly direct or procedural and has no production replacement path.

| Category | Status | Current evidence and limitation |
|---|---|---|
| World terrain | **FAIL** | Town terrain is drawn with Phaser Graphics and hard-coded geometry; Phase 8A terrain entries are development placeholders only. |
| Grass and lawn states | **FAIL** | Town and Lawn Care draw states procedurally; four-state Phase 8A contracts are not runtime art. |
| Roads, pavements, bridges, rivers, ponds, beaches, shorelines | **FAIL** | Town draw layers own shapes, colours, rocks and water directly; no production tileset/atlas registry. |
| Houses and buildings | **FAIL** | House forms, sizes, condition overlays and shop exteriors are scene/data-driven drawing, not asset-prefab data. |
| Interiors | **FAIL** | House rescue and home interiors use DOM/CSS/graphics with fixed composition; no runtime interior pack. |
| Shops and venues | **FAIL** | Shop presentation is DOM/CSS or procedural Phaser graphics; reference images are intentionally not runtime art. |
| Landmarks | **FAIL** | Procedural world assemblies and restoration layers; only Phase 10 planning entries exist. |
| Trees, crops, flowers, fences, decorations | **FAIL** | Procedural shapes/text/emoji dominate; Phase 8A candidates are contract-only. |
| Rubbish, dirt, stains, cleanliness states | **PARTIAL** | Town bins are a complete pilot; Power Wash dirt mask is registered but direct-loaded; other rubbish/dirt visuals are procedural. |
| Player characters | **PARTIAL** | Stable generated-family and animation IDs exist, but `PlayerCharacter` creates and uses raw `resident-*` texture/animation keys. |
| NPCs | **FAIL** | `NpcCharacter` constructs bodies, hair, labels, expressions and props procedurally; no production character prefab path. |
| Animals and pets | **PARTIAL** | The sheet has a semantic entry and frame metadata, but Boot and all consumers use the legacy key/path directly. |
| Tools, vehicles and equipment | **PARTIAL** | Three Power Wash tool files are described in the registry but direct-loaded; municipal vehicle and other tools are procedural. |
| Shop and inventory items | **FAIL** | Item identity is strong in gameplay data, but visual presentation is emoji/CSS/graphics rather than a visual manifest. |
| Mini-game artwork | **PARTIAL** | Fishing is integrated; Power Wash is described but bypassed; remaining minigames are procedural/DOM. |
| UI components | **FAIL** | UI is primarily `index.html`, CSS and Phaser graphics; no runtime nine-slice or component asset registry. |
| Icons | **FAIL** | Emoji, text and CSS are used directly; Phase 10 icon-atlas plan is not implemented. |
| Particles and effects | **FAIL** | Procedural effects and DOM transitions have no semantic effect atlas/recipe registry. |
| Animation spritesheets and atlases | **PARTIAL** | Image/spritesheet and four animations are modeled; runtime atlas loading is absent, and current resident/animal use bypasses central resolution. |
| Audio | **FAIL / NOT PRESENT** | No audio files share the manifest. The runtime contracts have no audio kind, loading, validation, fallback or lifecycle policy. |

## Requirement-by-requirement result

| # | Requirement | Result | Evidence |
|---:|---|---|---|
| 1 | Assets registered through manifest rather than directly | **PARTIAL** | 15 central records; only Fishing and bins are fully controlled. Direct animal, resident and Power Wash paths remain. |
| 2 | Stable IDs independent of filenames | **PARTIAL** | Semantic IDs are stable in the registry/artwork spec; unmigrated systems use filenames, cache keys, CSS URLs, emoji or procedural labels. |
| 3 | Centralized file paths | **PARTIAL** | Seven primary paths are centralized, but animal and Power Wash loaders duplicate path ownership. |
| 4 | Declarable technical and presentation metadata | **PARTIAL** | Rich artwork spec supports format, canvas, alpha, anchors, states, directions, frames and geometry; the runtime manifest does not enforce most of it. |
| 5 | Required and optional assets distinguished | **FAIL** | Layer `optional` exists for the bin prefab, but file validation and runtime loading do not model requiredness. A missing file marked optional failed exactly like a required file. |
| 6 | Duplicate IDs and missing IDs detected | **PARTIAL** | Semantic duplicate and reference checks pass; duplicate runtime texture/animation keys are not checked. |
| 7 | Unused, orphaned and duplicate assets detected | **PARTIAL** | Artwork entries require scene assignment and unique output filenames. There is no repository file-to-manifest orphan scan, no unused runtime-key scan, and no duplicate-content scan. |
| 8 | Variants and fallbacks supported safely | **PARTIAL** | Visual states and bin variants work. Fallback is environment-aware, but required/optional/functional-mask policy is absent. |
| 9 | Replacement without scene/gameplay edits | **FAIL overall** | Proven for Fishing and bins only. Registered animal and Power Wash replacement still requires editing direct loaders/consumers. |
| 10 | Safe lifecycle and unload | **PARTIAL** | Fishing re-entry passed. Textures remain in Phaser's global cache; no owner, refcount, release policy, shared-pack protection or cache budget exists. |
| 11 | Loading order without hidden dependencies | **FAIL** | Scene packs are not executed by production loading, and lookup returns the first match. Boot and Power Wash have their own loaders. |
| 12 | Cache-key collisions prevented | **FAIL** | Two unique assets with the same `runtime.textureKey` passed validation. `queuePhaserAsset` silently accepts an existing key. |
| 13 | Manifest validated before runtime | **PARTIAL** | Structure and file existence run in postbuild. Byte-level validation applies only to one artwork-spec asset, not every runtime record. |
| 14 | Failed assets produce useful diagnostics | **PARTIAL** | Semantic Phaser load failures produce code, asset, scene and path in console/memory. Direct loaders have separate messages; malformed technical properties are not diagnosed. |
| 15 | Fallback preserves gameplay without hiding important errors | **PARTIAL** | Development fallback is visible. Production fallback prevents crashes but is transparent and can conceal a missing required/functional visual while only logging it. |
| 16 | Production paths resolve correctly | **PASS for current lowercase paths** | Production preview loaded Fishing 720×405 and Power Wash 1536×1024 with no errors. Vite `BASE_URL` joining works at root deployment. Non-root deployment is not configured/tested. |
| 17 | Cross-platform case safety | **FAIL** | Upper-case Fishing path passed local file access validation but production HTTP returned the app shell, not the image. |
| 18 | Images, sheets, atlases, animations and static files handled consistently | **PARTIAL** | Static image/sheet queueing exists. Native Canvas images bypass it; runtime atlas/audio kinds are absent; animation frame ownership is not verified. |
| 19 | Large or invalid textures prevented | **PARTIAL** | Artwork validator enforces size/alpha/runtime bytes for approved staged art. Runtime registry accepts mismatched dimensions and has no global texture-dimension/GPU-budget check. |
| 20 | Versioning and cache invalidation | **PARTIAL** | Schema, manifest revision, asset version, provenance hash and Fishing `v1` filename exist. Most public files are unhashed, and `assetUrl` adds no fingerprint/query. |

## Targeted test results and reproduction

### Automated validation

| Test | Result | Reproduction/evidence |
|---|---|---|
| Existing visual-readiness tests | **PASS** | Run the seven targeted `visual-readiness-phase-*` test files; 52/52 passed. |
| Registry validation | **PASS** | `pnpm run visual:registry:check` → 15 assets, 7 files, 6 prefabs, 1 instance, 4 animations, 4 packs. |
| Artwork pipeline | **PASS** | `pnpm run artwork:check` → valid Fishing sample accepted, six invalid fixtures rejected. |
| Phase 8A contracts | **PASS, contract-only** | `pnpm run phase8a:check` → 22 assets and no generated runtime files. |
| Phase 10 structural plan | **PASS, execution blocked** | `pnpm run phase10:check` → 74 families/18 scenes; Phase 8B remains 0/22. |
| Production build | **PASS** | `pnpm run build` completed 196 modules and all postbuild validators. |

### Required negative cases

The in-memory mutation procedure was: `structuredClone(KINDWORKS_VISUAL_MANIFEST)`, change one tested field, then call `validateVisualManifestStructure` or `validateVisualManifestFiles` using the same repository-root file resolver as the build script.

| Case | Expected | Actual | Result |
|---|---|---|---|
| Valid asset | Accept | Accepted; current files and references valid | **PASS** |
| Missing required asset | Reject | `missing-asset-file` | **PASS** |
| Missing optional asset | Allow declared optional fallback/diagnostic | `optional: true` ignored; `missing-asset-file` | **FAIL** |
| Duplicate semantic ID | Reject | `duplicate-id`/`duplicate-semantic-id` | **PASS** |
| Duplicate Phaser texture key | Reject | Two unique semantic IDs sharing the Fishing texture key passed with zero errors | **FAIL** |
| Incorrect case | Reject | Validator accepted upper-case path; production preview returned application HTML | **FAIL** |
| Unsupported format | Reject | Changing Fishing's declared format to `gif` passed runtime validation | **FAIL runtime; PASS artwork pipeline** |
| Corrupt image | Reject | Runtime checks existence only. Byte inspector returned `width:null`, `height:null`, `alpha:null`; artwork validation would reject dimensions/format | **PARTIAL** |
| Incorrect dimensions | Reject | Changing technical size to 1×1 passed runtime validation | **FAIL runtime; PASS artwork pipeline** |
| Incorrect sprite frame size | Reject | Changing animal frame width from 64 to 63 passed runtime validation | **FAIL runtime; PASS artwork pipeline** |
| Missing animation frame | Reject | Adding `resident-down-999` to an animation passed runtime validation | **FAIL runtime; PASS artwork contract logic** |
| Replacement with different visible bounds | Reject or require explicit compatibility | Fishing accepted the 1536×1024 Power Wash master in place of its 720×405 contract | **FAIL** |
| Failed preload then scene entry | Diagnose and continue safely | Mocked Phaser `loaderror` recorded `runtime-load-failed` and created development fallback under requested key | **PARTIAL**: safe for Phaser assets, not direct/native loaders or required masks |
| Reload/revisit | No duplicate loads or errors | Asset Lab reloaded twice; Fishing entered, exited and re-entered; zero new asset errors | **PASS for tested pilot** |
| Production resolution | Correct URLs work | Fishing and Power Wash files returned correct dimensions; production Town launched without console errors | **PASS** |

### Browser evidence

- Development Asset Lab: `http://127.0.0.1:5174/?qa=asset-lab`; 37 entries (15 runtime + 22 Phase 8A placeholders), zero warnings, two successful reloads.
- Development Fishing: entered through isolated Fidelity QA controls, exited to Town, and entered again. Both entries reached `FishingScene`, showed no broken DOM images, and added no asset errors.
- Production preview: `http://127.0.0.1:4175/`; `TownScene` active with no console warning/error.
- Correct Fishing URL returned a 720×405 WebP. Correct Power Wash URL returned a 1536×1024 PNG.
- Wrong-case Fishing URL returned the KindWorks application index page instead of an image. This proves the local `access()` check is not an adequate case validator.

Browser work used emulation on this Mac. This audit did not claim physical-device asset-cache or GPU-memory testing.

## Direct references that bypass the runtime manifest

### File/path ownership bypasses

| File | Direct dependency | Why it bypasses replacement |
|---|---|---|
| `src/data/animals.js:26-27` | Hard-coded `animal-reference-master-v44` key and `/assets/animals/reference-master-v44.png` | Duplicates both runtime key and path outside the registry |
| `src/scenes/BootScene.js:10-13` | Direct `this.load.spritesheet(...)` | Registry pack and semantic ID are not used |
| `src/ui/AnimalFriendsController.js:10-14` | CSS `background-image:url(ANIMAL_REFERENCE_SHEET_PATH)` | Browser CSS path bypasses Phaser/registry failure and version handling |
| `src/scenes/PlaygroundPowerwashScene.js:37-56` | Native `Image`, `BASE_URL`, and five literal filenames | All five assets are registered but the registry cannot replace/load them |

### Raw cache-key and animation ownership bypasses

| File | Direct dependency |
|---|---|
| `src/entities/PlayerCharacter.js:81-105`, `110-130` | Generates and consumes `resident-{direction}-{frame}` and `resident-walk-{direction}` directly |
| `src/entities/AnimalCharacter.js:22-30` | Tests and renders `ANIMAL_REFERENCE_TEXTURE_KEY` directly |
| `src/scenes/PawsWondersScene.js:107-127` | Renders the raw animal sheet key directly |
| `src/scenes/HouseInteriorScene.js:261-265` | Renders the raw animal sheet key directly |

### Procedural visual surfaces outside the asset system

These are not raw-file bugs, but they are replacement blockers. Repository scanning found 297 production visual API/hard-coded presentation occurrences across scenes, entities, rendering and UI, including:

- Town terrain, roads, river banks, water, rocks, beaches, forest, ponds, houses, shops, lawns, trees, landmarks, dirt and grime in `src/scenes/TownScene.js`;
- NPC anatomy and activity props in `src/entities/NpcCharacter.js`;
- most animals when the reference sheet is absent in `src/entities/AnimalCharacter.js`;
- all restaurant shells, customers, appliances and products in `src/ui/RestaurantPresentation.js`;
- Lawn Care, River Clear-Out, Waste Collection, House Rescue and Beach Cleanup board art in their scene classes;
- shop/interior presentation in DOM/CSS and emoji.

These should become semantic procedural recipes or file-backed prefabs incrementally. They should not be mass-rewritten.

## Severity-ranked findings

There are **0 blocker**, **0 critical**, **5 high**, **6 medium**, and **1 low** findings. The current build runs; high severity reflects risk to the upcoming large artwork migration.

| ID | Severity | Finding | Evidence | Consequence |
|---|---|---|---|---|
| KW-APA-001 | **High** | Runtime replacement coverage is extremely low | 2/73 complete art families; 1/7 gameplay file loads through registry | Bulk replacement would require scene/gameplay edits and could destabilize behaviour |
| KW-APA-002 | **High** | Runtime manifest accepts technically incompatible files | Format, 1×1 size, 63-pixel sheet frame and 1536×1024 Fishing replacement all passed | Distortion, invalid frames, masks and interaction visuals can reach production |
| KW-APA-003 | **High** | Duplicate Phaser cache and animation keys are not detected | Duplicate `runtime.textureKey` passed; existing key causes early return | Wrong artwork may silently appear under another semantic identity |
| KW-APA-004 | **High** | File path case is not validated exactly | Wrong-case path passed validation, failed production HTTP | Cross-platform production-only missing assets |
| KW-APA-005 | **High** | Scene packs are not executable loading contracts | No production caller; first-match lookup only; Boot/Power Wash direct loaders | Hidden load order and incomplete preload as packs expand |
| KW-APA-006 | **Medium** | Required/optional/functional visual policy is absent | Optional missing file treated as required; powerwash dirt mask has no runtime criticality behavior | Either harmless optional files block builds or essential art becomes invisible |
| KW-APA-007 | **Medium** | Production fallback can hide required failures | Transparent 2×2 replacement under requested key | Game continues without an essential object/mask while only console/memory records failure |
| KW-APA-008 | **Medium** | No cache ownership, lifecycle or unload budget | Global cache persistence; no retain/release; pilot revisit merely stayed stable | Memory growth and unsafe unload become likely as 74 families arrive |
| KW-APA-009 | **Medium** | No complete orphan, unused-key or duplicate-content report | Three legacy refs outside primary registry; duplicate Fishing bytes not reported | Repository bloat and stale assets can accumulate unnoticed |
| KW-APA-010 | **Medium** | Public-asset cache invalidation is incomplete | Only Fishing uses a versioned filename; no manifest hash/query in `assetUrl` | Devices/CDNs can retain stale art after replacement |
| KW-APA-011 | **Medium** | Media loaders are inconsistent | Phaser image/sheet, Canvas `Image`, CSS URL and procedural texture paths differ; no runtime atlas/audio support | Every asset type behaves differently under failures, base URLs and cleanup |
| KW-APA-012 | **Low** | Sidecar manifests compete with the semantic registry | Power Wash and legacy-reference JSON are extraction/checksum records only | Maintainers may update one source and assume runtime behavior changed |

## Concrete repair specification

Repairs must preserve gameplay state, coordinates, collision, navigation, interaction and save schemas. Apply them incrementally, with Fishing and bins retained as known-good controls.

### Repair 1 — Make the runtime asset contract technically complete

Extend runtime asset definitions with:

- `requiredness`: `required`, `optional`, or `gameplay-critical`;
- exact byte format, canvas dimensions, alpha, maximum bytes and maximum GPU dimensions;
- frame width/height, rows/columns, frame count/order and atlas schema;
- a unique explicit runtime cache key for every loadable asset/animation;
- content fingerprint/version and cache policy;
- allowed fallback and scene-recovery behavior;
- load owner/share policy and unload policy.

Generate these runtime fields from approved artwork contracts where available. Keep legacy definitions compatible through a schema migration adapter.

### Repair 2 — Strengthen build validation

Add validation for:

1. duplicate `textureKey`, `textureKeyPattern` expansion, `runtimeKey`, native Canvas key and DOM asset key;
2. exact path-component case by walking directory entries rather than relying on `access()`;
3. bytes versus extension/declared format;
4. actual width, height and alpha versus runtime metadata;
5. frame divisibility, frame count/order and every animation frame;
6. unsupported runtime kinds and formats;
7. texture dimension/byte budgets;
8. every manifest file versus actual `public/assets` files, including unused/orphaned and duplicate SHA-256 groups;
9. duplicate scene-pack ownership or explicit multi-pack ordering;
10. requiredness/fallback compatibility, especially functional masks.

The build must fail before Vite packaging on any required incompatibility.

### Repair 3 — Execute scene packs

Create a small `SceneAssetPackLoader` that:

- resolves all packs for a scene, not the first one;
- orders explicit dependencies deterministically;
- queues Phaser, Canvas and DOM/CSS-compatible assets through registry adapters;
- creates registered animations after textures load;
- emits a structured pack result with required/optional failures;
- retains shared packs and releases scene-owned resources according to policy;
- refuses scene entry when a gameplay-critical visual such as a functional mask is missing, while offering a safe return path.

### Repair 4 — Remove current direct loaders in bounded pilots

In this order:

1. Boot/animal sheet: load through `pack.scene.boot`; resolve semantic texture ID in AnimalCharacter, Paws & Wonders, House Interior and Animal Friends CSS helper.
2. Resident generated frames: move texture/animation generation behind a registered procedural provider; PlayerCharacter resolves semantic animation/state, not raw strings.
3. Power Wash: add a registry-backed Canvas image adapter and load all five assets through `pack.scene.powerwash`. Mark the dirt mask `gameplay-critical` and preserve exact 1536×1024 functional geometry.

Do not migrate unrelated scene art in these fixes.

### Repair 5 — Make fallback behavior explicit

- Development required asset: visible checker plus structured error.
- Production decorative optional asset: safe omission plus structured warning.
- Production required non-functional asset: safe placeholder with visible QA telemetry.
- Production gameplay-critical asset/mask: do not enter active gameplay; show one safe error and return control without modifying rewards or saves.
- Never substitute a fallback under a colliding key until ownership is proven.

### Repair 6 — Add lifecycle and cache invalidation

- Namespace/cache keys from semantic IDs and validate uniqueness.
- Track `packId`, owner scene, shared count, loaded fingerprint and byte estimate.
- Reuse an asset only when its semantic ID and fingerprint match the cached owner.
- Release scene-owned resources on shutdown; retain shared Boot/UI assets.
- Use content-hashed runtime filenames or a provenance-SHA query produced by the runtime pack generator.
- Add a production base-path test for both `/` and one non-root Vite base.

### Repair 7 — Expand coverage wave by wave

Follow the existing 74-family Phase 10 dependency order. For each family:

1. register its semantic asset/prefab/state/pack contract;
2. add approved placeholder/procedural compatibility without moving coordinates;
3. remove direct paths/keys from only that family's production consumers;
4. prove manifest-only replacement and baseline geometry;
5. update the computed coverage report;
6. proceed only after build, runtime, revisit, save and supported-viewport checks pass.

## Tests required during repair

Add permanent automated tests for all of the following:

1. valid PNG, WebP, spritesheet and atlas acceptance;
2. missing required versus missing optional versus missing gameplay-critical assets;
3. duplicate semantic ID, texture key, animation key, generated key expansion and native-image key;
4. exact path-case failure using a repository walker that behaves consistently on case-insensitive hosts;
5. extension/byte mismatch, unsupported format and corrupt/truncated bytes;
6. wrong dimensions, alpha, byte budget and GPU-dimension budget;
7. non-divisible sprite sheet, wrong frame count/order, missing animation frame and atlas mismatch;
8. replacement with larger transparent padding preserving logical geometry;
9. incompatible aspect/canvas replacement rejected before runtime;
10. required Phaser preload failure, required Canvas image failure and optional failure followed by safe scene behavior;
11. two packs for one scene with deterministic dependency order;
12. repeated entry/exit for Fishing, Power Wash, Town and one restaurant, asserting stable cache ownership/listener counts;
13. shared asset retained while another owning scene remains active;
14. scene-owned asset released according to policy;
15. orphan file, unused manifest entry and duplicate-content reporting;
16. manifest fingerprint/cache-busting change after registry-only replacement;
17. production resolution at root and non-root base paths;
18. development fallback visibility, production optional omission and production critical recovery;
19. Asset Lab inspection of every runtime entry without separate asset lists;
20. build failure whenever generated runtime packs are stale.

## Repair acceptance gate

Do not begin mass artwork production until all of these are true:

- every current gameplay image load is registry-controlled;
- duplicate runtime keys and incorrect path case fail in CI/build;
- technical file metadata is byte-validated for every runtime asset, not only Fishing;
- required, optional and gameplay-critical behavior is executable and tested;
- scene packs drive loading for Boot, Fishing, Power Wash and Town-bin pilots;
- Power Wash's functional dirt mask cannot silently fall back;
- repeated scene entry/exit proves stable cache ownership;
- replacement URLs have deterministic cache invalidation;
- computed planned-family coverage is updated automatically;
- no save, reward, geometry, input or completion rule changes.

## Final assessment

The design direction is correct, and the strongest pieces—the artwork specification, generated pack, Fishing integration, bin factory and Asset Lab—should be retained. The repair should connect those pieces into one enforced runtime path before more art is generated. At present, the system can safely demonstrate the process; it cannot yet guarantee it across the full game.
