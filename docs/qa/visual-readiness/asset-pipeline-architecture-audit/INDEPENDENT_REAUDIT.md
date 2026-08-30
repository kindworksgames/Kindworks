# Independent Asset-Loading and Manifest Re-audit

Date: 2026-08-30  
Branch: `phase-2-ui-simplification`  
Starting commit: `3387bcb48964c41edbdc26f4257d2990fcdaf8d5`  
Mode: independent implementation audit; the repair summary was not used as proof  
Production-code changes: none

Machine-readable evidence: [INDEPENDENT_REAUDIT_EVIDENCE.json](./INDEPENDENT_REAUDIT_EVIDENCE.json)

## Verdict

**STAGE 1 IS NOT COMPLETE — HIGH-SEVERITY ASSET-PIPELINE REPAIRS REMAIN.**

The repaired build is healthy with its current valid files: all 728 tests pass, both root and `/kindworks/` production builds launch, and Boot, Fishing, Fishing re-entry, and Power Wash were operated through the real browser. File-byte, exact-case, size, alpha, format, fingerprint, budget, orphan, and explicit-key checks also pass.

However, five independently reproduced high-severity requirements still fail. The green suite does not catch them because its loader tests use a fake Phaser scene and its collision checks cover only explicit keys. A controlled production run with one required asset removed also proved that the shipped game can continue into `TownScene` without showing the player an error.

No blocker or critical defect was reproduced in the present valid build. The high-severity failures are sufficient to deny the requested completion gate.

## Independent execution evidence

| Gate | Result | Evidence |
|---|---|---|
| Existing focused asset/visual-readiness tests | **PASS** | 50/50 tests passed |
| Complete automated suite | **PASS** | 728/728 tests passed |
| Physical runtime registry validation | **PASS** | 15 assets, seven files, six prefabs, one instance, four animations, four packs; zero orphan or unused entries |
| Root production build and post-build validators | **PASS** | Vite transformed 193 modules; all post-build gates passed |
| Non-root production package | **PASS** | Built with `base=/kindworks/`; `TownScene` launched at `/kindworks/`; two canvases rendered with no overflow |
| Valid Boot animal sheet in production | **PASS** | Town launched and animal-reference consumers rendered |
| Valid Fishing Phaser image | **PASS** | `FishingScene` rendered the 720×405 Reedbank artwork through the real Phaser loader |
| Fishing exit/re-entry | **PASS** | First and second entry both reached `FishingScene`; no duplicate canvas or broken DOM image appeared |
| Valid Power Wash native pack | **PASS** | `PlaygroundPowerwashScene` reached `playing` with the approved master, mask, and three tool images |
| Controlled missing required production asset | **FAIL** | Removing only the animal sheet from a disposable production copy still entered `TownScene` with no visible error |
| Case-sensitive path validation | **PASS validator / environment-limited runtime** | Exact path-component mutation is rejected. This Mac's case-insensitive filesystem served a wrong-case URL as 200, so an actual Linux HTTP reproduction remains a CI/device gate |

The missing-file experiment changed only a disposable build under `/private/tmp`; the file was restored immediately. Repository assets were not moved or altered.

## Severity-ranked findings

### IAR-APA-001 — High — Existing Phaser cache contents are trusted without proving ownership

**Reproduction**

1. Construct the real registry.
2. Pre-populate a fake Phaser texture cache with the Fishing runtime key.
3. Queue the Fishing scene pack.
4. Observe zero queued loads and zero registry failures.

**Expected:** the registry must prove that the cached texture belongs to the same semantic asset and fingerprint, or reject it as a collision.  
**Actual:** [`queuePhaserAsset`](../../../../src/visual/VisualRegistry.js) claims the key in its private map first, then returns as soon as `scene.textures.exists(key)` is true. A texture inserted outside this registry has no verifiable owner but is silently adopted.

Relevant implementation: `src/visual/VisualRegistry.js:99-107` and `151-155`.

**Consequence:** an earlier scene, plugin, legacy loader, or future generated asset can cause the wrong pixels to render under a valid semantic identity.

**Required repair/test:** attach semantic ID and fingerprint metadata to loaded cache entries, or refuse pre-existing unowned keys. Add a real Phaser-cache test that inserts a different texture under the target key before pack loading.

### IAR-APA-002 — High — Generated texture-key expansions are absent from global collision validation

**Reproduction:** change the animal sheet's explicit texture key to `resident-down-0`, which is produced by the resident generated-family pattern. The deep validator returns `ok: true` with no cache-key finding.

**Expected:** every expanded generated key must participate in the same global namespace as image, sheet, atlas, audio, and native-image keys.  
**Actual:** `generatedKeys()` exists, but generated expansions are used only to validate animation membership. Only explicit keys from `runtimeKeys()` enter the cache-owner map.

Relevant implementation: `src/visual/validateVisualManifest.js:35-41`, `71-100`, and `111-115`; the lightweight startup validator similarly checks only explicit keys in `src/visual/validateVisualManifestRuntime.js:64-71`.

**Consequence:** approved generated frames can overwrite or be overwritten by a file-backed asset without a build failure.

**Required repair/test:** expand every deterministic pattern during validation, reject expansion duplicates within the family, and insert all expanded keys into the global cache-key index. Repeat the same check in the startup guard or consume a validated generated artifact.

### IAR-APA-003 — High — Required and gameplay-critical Phaser failures still enter the game behind a fallback

**Production reproduction:** remove `character.animal.reference-sheet` from a disposable non-root production package and load it from a fresh origin. The request fails, yet `TownScene` starts and no player-visible error is shown.

**In-memory critical reproduction:** mark Fishing gameplay-critical and emit Phaser `loaderror`. The registry records a failure, installs the production fallback under the requested key, and emits no blocking pack result.

**Expected:** optional decoration may omit/fallback; required assets must provide a visible safe recovery state; gameplay-critical assets must prevent active scene entry.  
**Actual:** the Phaser `loaderror` branch ignores `requiredness` and always substitutes a texture for non-audio assets (`src/visual/VisualRegistry.js:156-161`). `queueScenePacks()` returns pack definitions, not an awaitable success/failure result (`172-179`).

**Consequence:** required artwork can be absent in production while the game appears to work, and a future functional Phaser mask/board can start without its contract.

**Required repair/test:** return a structured, awaitable pack result; gate scene creation by requiredness; permit optional omission; provide one visible recovery action for required failures; block gameplay-critical entry. Add an actual browser negative test using a disposable production asset, not only a fake loader event.

### IAR-APA-004 — High — Spritesheet validation checks divisibility, not the authored frame contract

**Reproduction:** change the real 384×512 animal sheet from 64×64 frames to 128×64 frames. The image still divides evenly, so deep file validation passes. That declares only 24 frames while production animal data consumes indexes through 42.

**Expected:** the manifest must own and validate frame count/order/names used by every consumer.  
**Actual:** the manifest owns width/height/frame width/frame height, while the actual identity-to-frame mapping remains a separate source in `src/data/animals.js:30-45`. There is no animal animation entry tying those indexes back to the sheet contract.

**Consequence:** technically divisible replacement sheets can pass the build but silently remove or remap species and pet appearances.

**Required repair/test:** declare frame count and stable identity/frame order centrally, validate all consumer frame references against it, and eliminate or generate the duplicate map. Add the 128×64 mutation as a permanent failing fixture.

### IAR-APA-005 — High — Power Wash begins mutable gameplay before its gameplay-critical art is ready

**Trace:** `PlaygroundPowerwashScene.create()` binds input, starts or resumes a session, and exposes the gameplay surface immediately. The asynchronous native pack finishes later. A critical failure is caught locally and falls back to `drawBoard()` while the active session already exists.

Relevant implementation: `src/scenes/PlaygroundPowerwashScene.js:19-35` and `38-57`; critical native rejection originates in `src/visual/VisualRegistry.js:212-222`.

**Expected:** the critical master dirt mask must be validated before session creation, input binding, resource use, or completion logic becomes active.  
**Actual:** the scene can mutate an attempt before the critical visual contract resolves.

**Consequence:** a missing functional dirt mask can leave a persisted active attempt or accept input without the authoritative visual surface. This contradicts the pipeline's stated no-state-mutation failure policy.

**Required repair/test:** split preload/readiness from gameplay activation; start/resume the service session only after the critical pack resolves; on failure return safely without touching attempts, rewards, or saves. Add a real scene test with the critical dirt image rejected.

### IAR-APA-006 — Medium — Optional Canvas assets reject the complete native pack

**Reproduction:** mark the Power Wash precision tool optional and fail only that image. `loadNativeScenePacks()` still throws and rejects the whole pack.

**Expected:** optional assets warn and omit or use their declared optional fallback.  
**Actual:** every native failure is thrown; only a `gameplayCritical` property differs (`src/visual/VisualRegistry.js:217-222`).

**Required repair/test:** branch on all three requiredness policies and test optional, required, and gameplay-critical Canvas failures independently.

### IAR-APA-007 — Medium — A duplicate legacy animal path remains outside the source of truth

`src/data/animals.js:28-29` still exports the raw animal cache key and file path. Production rendering no longer imports them, but the test suite does. The source-bypass regression test scans only eight hand-picked consumer files, so it passes while this duplicate path exists (`tests/asset-pipeline-repair.test.js:169-176`).

**Consequence:** the next replacement can update the registry while a fidelity test or future consumer continues following the deprecated path.

**Required repair/test:** derive compatibility exports from the manifest or remove them after all callers migrate. Replace the fixed file list with a repository-wide production-source scan plus a narrow documented allowlist for development tools.

### IAR-APA-008 — Medium — Negative loader coverage is mostly simulated, not Phaser-executed

The current tests use `fakeScene()` for image, spritesheet, atlas, audio, cache, lifecycle, and `loaderror` behavior (`tests/asset-pipeline-repair.test.js:124-145`). Atlas/audio entries and files are synthetic. This proves registry method selection, not Phaser parsing/cache semantics.

The independent browser checks prove current valid image and Canvas paths, but the controlled missing-required production run exposed behavior the green fake-loader suite did not reject.

**Required repair/test:** add a small browser integration fixture that loads valid and invalid image/sheet/atlas assets through Phaser.Loader, verifies cache identity and frames, exercises revisit/unload, and runs once against a production package at `/` and `/kindworks/`.

## Partial-migration and duplicate-source assessment

The repair centralized all seven image files currently loaded by gameplay. That is a real improvement, but it is not the same as whole-game replacement readiness.

- The runtime manifest contains 15 assets: seven files, one generated resident family, two fallbacks, and five procedural bins.
- The approved production plan contains 74 asset families.
- Only six planned families have some current runtime representation: fallbacks, bins, resident base, animal identity sheet, Power Wash, and Fishing/magnet.
- Only bins and Fishing are fully replaceable through prefab/manifest data without editing their scene presentation code.
- Terrain, roads, river, houses, venues, NPC construction, most animals, UI, interiors, and most minigames remain procedural or DOM/CSS-owned.

This remains a **high migration-readiness gap**, not a defect in current gameplay. It means the system is a functioning pilot, not yet a complete visual replacement boundary.

The sidecar Power Wash and legacy-reference JSON files correctly identify themselves as provenance-only; they are not runtime sources of truth. The deprecated animal constants are the remaining direct duplicate identified in production source.

## Requirement matrix after re-audit

| Requirement | Result |
|---|---|
| Stable semantic IDs | **PASS for registered assets; PARTIAL whole game** |
| Centralized current gameplay file paths | **PASS**, with one unused deprecated animal-path export |
| Required/optional/gameplay-critical declarations | **PASS schema; FAIL runtime enforcement** |
| Duplicate semantic and explicit cache keys | **PASS** |
| Generated cache-key collisions | **FAIL** |
| Foreign/pre-existing Phaser cache collisions | **FAIL** |
| Exact path case validation | **PASS** |
| Byte format, corrupt file, dimensions, alpha, fingerprint, and budgets | **PASS** |
| Spritesheet grid divisibility | **PASS** |
| Complete spritesheet frame identity/order | **FAIL** |
| Atlas/audio contracts | **PASS structurally; PARTIAL because Phaser loading is fake-tested only** |
| Scene-pack execution for current valid files | **PASS** |
| Scene-pack blocking/recovery result | **FAIL** |
| Optional native behavior | **FAIL** |
| Required fallback transparency to player | **FAIL** |
| Gameplay-critical Power Wash activation order | **FAIL** |
| Root production paths | **PASS** |
| Non-root `/kindworks/` production paths | **PASS** |
| Orphan, unused, and duplicate-content reporting | **PASS** |
| Asset replacement without scene edits | **PASS for Fishing/bins; PARTIAL whole game** |
| Replacement artwork isolated from gameplay geometry | **PASS for migrated pilots; PARTIAL whole game** |
| Save/gameplay mutation from validation alone | **PASS** |

## Required repair order

1. Block foreign cache adoption and validate generated-key expansions.
2. Implement an awaitable scene-pack result with enforced optional/required/critical policies.
3. Gate Power Wash session creation and input on critical pack readiness.
4. Centralize and validate the animal frame identity/order contract.
5. Replace fixed-list source scans and fake-only loader tests with repository-wide and browser-Phaser integration coverage.
6. Continue the existing 74-family migration waves; do not call whole-game artwork replacement ready before those families cross the semantic boundary.

## Completion gate

Stage 1 can be re-evaluated after `IAR-APA-001` through `IAR-APA-005` have permanent regression tests and pass in both root and non-root production packages. `IAR-APA-006` through `IAR-APA-008` should be repaired in the same bounded asset-pipeline batch because they exercise the same loader and test boundary.

Final result: **NOT COMPLETE — HIGH-SEVERITY REQUIREMENTS FAIL WITH REPRODUCIBLE EVIDENCE.**
