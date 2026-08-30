# KindWorks runtime visual asset contract

'visualManifest.js' is the runtime source of truth for file-backed visual assets. Gameplay and scene code must refer to semantic IDs from that module; it must not own public paths, Phaser cache keys, filenames, image constructors, or sprite-frame key patterns.

## Required fields

Every file asset declares:

- a stable semantic ID;
- requiredness: required, optional, or gameplay-critical;
- centralized source path and byte format;
- runtime render target and a globally unique cache key;
- exact dimensions, alpha behavior, sheet/atlas metadata where applicable;
- a SHA-256 content fingerprint and URL cache version;
- maximum runtime bytes and maximum texture dimension;
- shared or scene lifecycle ownership.

Gameplay-critical assets do not continue through a silent substitute. Native Canvas packs reject entry when a critical mask is absent or incompatible. Required images receive a visible, non-transparent production-safe marker and a structured failure. Optional assets warn and may use a declared fallback.

## Loading

- Phaser scenes call VisualRegistry.queueScenePacks(scene).
- Canvas renderers call VisualRegistry.loadNativeScenePacks(sceneId).
- DOM presentation calls VisualRegistry.assetUrl(semanticId).
- Generated textures and animations resolve keys through getGeneratedTextureKey and getAnimationKey.

Scene packs are executable and all packs for a scene are loaded. Scene-scoped Phaser assets are reference-counted and removed on the last scene release; shared assets are retained deliberately.

## Approved scene-instance runtime

Human-approved Phase 8B definitions are merged into the same registry as existing assets. `TownScene` and `LawnCareScene` queue their semantic scene packs during preload and mount active `phase-8b-approved` instances through `ApprovedSceneVisualRuntime`. The runtime reads prefabs, states, animation metadata, stable placements and scene-specific presentation bindings; it never creates or writes gameplay geometry or save state.

The Lawn board remains an accessible DOM grid, so its approved board, weed and mower sheets are resolved semantically by `LawnApprovedDomVisuals` and applied as presentation-only CSS variables. Candidate or merely technically valid artwork is excluded. A normal gameplay scene never names a Phase 8A semantic ID or filename.

## Compatibility

`LegacyCompatibility` remains temporary and maps the six explicitly known pre-registry animal, Fishing, and resident keys. An unknown legacy key is still returned unchanged to avoid breaking an existing consumer, but it is recorded as migration debt and emits a structured development diagnostic. `scripts/audit-legacy-compatibility.mjs` fails the build/CI if a production literal bypasses the explicit map. The deprecated animal path/key exports in `data/animals.js` exist only for old tests and external compatibility; production consumers no longer import them.

The JSON files under public/assets/powerwash and public/assets/legacy-reference are extraction/comparison provenance only. They explicitly identify visualManifest.js as the runtime source of truth.

## Validation

pnpm run visual:registry:check validates structure plus physical bytes before production:

- semantic and cache-key uniqueness;
- references, requiredness, lifecycle, states and animations;
- exact path case;
- supported format and decodability;
- dimensions, alpha, frame grid, atlas data and frame names;
- SHA-256 fingerprints, byte budgets and maximum dimensions;
- orphan files, unused entries and duplicate content.

Diagnostics include the asset ID, manifest entry, expected contract, actual value, and affected scenes. The duplicate Fishing comparison/runtime bytes are intentional and reported as a warning.

The adversarial validator is a release gate, not an informational report. It fully decodes images/audio and exits non-zero for a false positive, false negative, incorrect reason, or uncovered executable rule. The current gate exercises all 15 categories, eight output types and every executable validation code.

Normal production excludes all test globals. Performance investigations use the separate `build:test-metrics` bundle, enabled only by the compile-time `VITE_KW_TEST_METRICS=1` flag; its bridge exposes read-only counts and cannot mutate scenes or saves.

## Dense-touch rendering policy

`ResponsiveFramePolicy.js` selects a stable 30 Hz Phaser render cadence only on touch devices with a device pixel ratio above 1. Gameplay simulation remains elapsed-time based. In Town, those devices also cache the immutable, non-interactive backdrop below character depth into two render tiles. Houses, lawn state, characters, interactions, navigation, collision geometry, approved semantic visuals and all persistent state remain live and separate. Desktop and non-touch development continue at 60 Hz.

The production performance gate is the three-run harness in `scripts/measure-production-town.mjs`; its every-run p95 threshold remains 33.34 ms. The visual-comparison gate must pass without updating baselines whenever this policy or the Town cache changes.

No asset-pipeline API reads or writes save data.
