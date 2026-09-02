import {
  VISUAL_ASSET_KINDS,
  VISUAL_ASSET_REQUIREDNESS,
  VISUAL_CACHE_SCOPES,
  VISUAL_DEFINITION_SCHEMA_VERSION,
  VISUAL_FALLBACK_MODES,
  VISUAL_REGISTRY_SCHEMA_VERSION,
  VISUAL_RENDER_TARGETS,
  createRectGeometry,
  createVisualGeometry,
} from "./contracts.js";
import {
  TOWN_BIN_ASSET_DEFINITIONS,
  TOWN_BIN_PREFAB_DEFINITIONS,
  TOWN_BIN_SCENE_PACK,
  TOWN_BIN_STATE_DEFINITIONS,
} from "./prefabs/townBinPrefabs.js";
import {
  ARTWORK_RUNTIME_ASSETS,
  ARTWORK_RUNTIME_PACKS,
} from "./generated/artworkRuntimePacks.js";
import { createPhase8BApprovedManifest } from "./phase8bApprovedManifest.js";

export const VISUAL_ASSET_IDS = Object.freeze({
  ANIMAL_REFERENCE_SHEET: "character.animal.reference-sheet",
  RESIDENT_GENERATED_FRAMES: "character.resident.generated-frames",
  FISHING_REEDBANK_BACKGROUND: "scene.fishing.reedbank.background",
  POWERWASH_PLAYGROUND_MASTER: "minigame.powerwash.playground.master",
  POWERWASH_PLAYGROUND_DIRT: "minigame.powerwash.playground.dirt-mask",
  POWERWASH_TOOL_PRECISION: "minigame.powerwash.tool.precision",
  POWERWASH_TOOL_STANDARD: "minigame.powerwash.tool.standard",
  POWERWASH_TOOL_WIDE: "minigame.powerwash.tool.wide",
  TOWN_RIVER_WATER_TILE: "terrain.town.river.water-tile",
  DEVELOPMENT_FALLBACK: "system.fallback.development",
  PRODUCTION_FALLBACK: "system.fallback.production",
});

export const VISUAL_PREFAB_IDS = Object.freeze({
  FISHING_REEDBANK_BACKGROUND: "prefab.scene.fishing.reedbank.background",
});

export const VISUAL_SCENE_INSTANCE_IDS = Object.freeze({
  FISHING_REEDBANK_BACKGROUND: "instance.fishing.reedbank.background.main",
});

export const VISUAL_STATE_IDS = Object.freeze({
  FISHING_REEDBANK_BACKGROUND: "state.fishing.reedbank.background",
});

export const VISUAL_ANIMATION_IDS = Object.freeze({
  RESIDENT_WALK_DOWN: "animation.character.resident.walk.down",
  RESIDENT_WALK_LEFT: "animation.character.resident.walk.left",
  RESIDENT_WALK_RIGHT: "animation.character.resident.walk.right",
  RESIDENT_WALK_UP: "animation.character.resident.walk.up",
});

const fishingRuntimeAsset = ARTWORK_RUNTIME_ASSETS[VISUAL_ASSET_IDS.FISHING_REEDBANK_BACKGROUND];
const fishingRuntimePack = ARTWORK_RUNTIME_PACKS["pack.scene.fishing"];
if (!fishingRuntimeAsset || !fishingRuntimePack) throw new Error("Generated Fishing artwork pack is missing.");

const definition = (value) => Object.freeze({ schemaVersion: VISUAL_DEFINITION_SCHEMA_VERSION, ...value });
const source = (file, format) => Object.freeze({ kind: "file", file, format });
const technical = (value) => Object.freeze({ pixelArt: true, alpha: true, ...value });
const filePolicy = (sha256, { requiredness = VISUAL_ASSET_REQUIREDNESS.REQUIRED, scope = VISUAL_CACHE_SCOPES.SHARED, maximumRuntimeBytes = 3_000_000 } = {}) => Object.freeze({
  requiredness,
  lifecycle: Object.freeze({ scope, unload: scope === VISUAL_CACHE_SCOPES.SCENE ? "on-last-scene-release" : "retain-until-game-destroy" }),
  cache: Object.freeze({ version: sha256.slice(0, 12), contentSha256: sha256 }),
  validation: Object.freeze({ maximumRuntimeBytes, maximumDimension: 4096 }),
});

const assets = Object.freeze([
  definition({
    id: VISUAL_ASSET_IDS.ANIMAL_REFERENCE_SHEET,
    kind: VISUAL_ASSET_KINDS.SPRITESHEET,
    source: source("/assets/animals/reference-master-v44.png", "png"),
    runtime: Object.freeze({ renderTarget: VISUAL_RENDER_TARGETS.PHASER, textureKey: "animal-reference-master-v44" }),
    technical: technical({ width: 384, height: 512, frameWidth: 64, frameHeight: 64 }),
    ...filePolicy("c7a8db375596b9e8ec614b4756c839958612c28bf462641806fc505348bcbae6", { maximumRuntimeBytes: 200_000 }),
    status: "legacy-registered",
  }),
  definition({
    id: VISUAL_ASSET_IDS.RESIDENT_GENERATED_FRAMES,
    kind: VISUAL_ASSET_KINDS.GENERATED_TEXTURE_FAMILY,
    source: Object.freeze({ kind: "generated", owner: "PlayerCharacter.createPlayerAssets" }),
    runtime: Object.freeze({ renderTarget: VISUAL_RENDER_TARGETS.PHASER, textureKeyPattern: "resident-{direction}-{frame}" }),
    technical: technical({ width: 44, height: 60, directions: Object.freeze(["down", "left", "right", "up"]), framesPerDirection: 4 }),
    requiredness: VISUAL_ASSET_REQUIREDNESS.REQUIRED,
    lifecycle: Object.freeze({ scope: VISUAL_CACHE_SCOPES.SHARED, unload: "retain-until-game-destroy" }),
    status: "legacy-registered",
  }),
  definition({
    id: VISUAL_ASSET_IDS.FISHING_REEDBANK_BACKGROUND,
    kind: VISUAL_ASSET_KINDS.IMAGE,
    source: Object.freeze(fishingRuntimeAsset.source),
    runtime: Object.freeze({ renderTarget: VISUAL_RENDER_TARGETS.PHASER, textureKey: "kw.asset.scene.fishing.reedbank.background" }),
    technical: technical(fishingRuntimeAsset.technical),
    ...filePolicy(fishingRuntimeAsset.provenance.sourceSha256, { scope: VISUAL_CACHE_SCOPES.SCENE, maximumRuntimeBytes: 500_000 }),
    status: "artwork-pipeline-verified",
    provenance: Object.freeze(fishingRuntimeAsset.provenance),
    comparison: Object.freeze({
      previousSource: "/assets/legacy-reference/fishing.webp",
      previousLabel: "Approved pre-pipeline runtime",
    }),
  }),
  definition({
    id: VISUAL_ASSET_IDS.POWERWASH_PLAYGROUND_MASTER,
    kind: VISUAL_ASSET_KINDS.IMAGE,
    source: source("/assets/powerwash/playground-master.png", "png"),
    runtime: Object.freeze({ renderTarget: VISUAL_RENDER_TARGETS.CANVAS, nativeImageKey: "POWERWASH_MASTER_ART" }),
    technical: technical({ width: 1536, height: 1024, alpha: false, dimensionSensitive: true }),
    ...filePolicy("0679fe2c14f28b750f61415641b73e6d17d1f35cbaadfc1a470a011d3cdd0f24", { maximumRuntimeBytes: 3_000_000 }),
    status: "legacy-registered",
  }),
  definition({
    id: VISUAL_ASSET_IDS.POWERWASH_PLAYGROUND_DIRT,
    kind: VISUAL_ASSET_KINDS.IMAGE,
    source: source("/assets/powerwash/playground-reference-dirt.png", "png"),
    runtime: Object.freeze({ renderTarget: VISUAL_RENDER_TARGETS.CANVAS, nativeImageKey: "POWERWASH_REFERENCE_DIRT_ART" }),
    technical: technical({ width: 1536, height: 1024, dimensionSensitive: true, functionalMask: true }),
    ...filePolicy("5db4c213d34d1e435f74f03a49590f766e172f01d8ac97703dc090ded7d36736", { requiredness: VISUAL_ASSET_REQUIREDNESS.GAMEPLAY_CRITICAL, maximumRuntimeBytes: 2_500_000 }),
    status: "legacy-registered",
  }),
  definition({
    id: VISUAL_ASSET_IDS.TOWN_RIVER_WATER_TILE,
    kind: VISUAL_ASSET_KINDS.IMAGE,
    source: source("/assets/runtime/phase-8a/town-river-water-tile.v1.png", "png"),
    runtime: Object.freeze({ renderTarget: VISUAL_RENDER_TARGETS.PHASER, textureKey: "kw.terrain.town.river.water-tile" }),
    technical: technical({ width: 1254, height: 1254, alpha: false, nativePixelsPerLogicalUnit: 1 }),
    ...filePolicy("2b65053ca85ca46cfa7ed82a877a3389cf1cb29edad096af05be338b9956f7c3", { scope: VISUAL_CACHE_SCOPES.SCENE, maximumRuntimeBytes: 3_000_000 }),
    status: "human-approved-runtime",
    productionContractId: "terrain.river-water-tiles",
    provenance: Object.freeze({
      reviewer: "youyoulu",
      approvedAt: "2026-09-01",
      masterPath: "artwork/masters/phase-8a/town-river-water/v1/town-river-water-tile.v1.png",
      referencePath: "artwork/masters/phase-8a/town-river-reference/v1/town-river-curved-reference.v1.png",
    }),
  }),
  ...[
    [VISUAL_ASSET_IDS.POWERWASH_TOOL_PRECISION, "precision", 80, 101, "d9e75832314fee928b606021986d0d24bf903f51f6d43d6e3beefb083cb16f61"],
    [VISUAL_ASSET_IDS.POWERWASH_TOOL_STANDARD, "standard", 77, 102, "97f9dca3ecc229ba147cbc9e1bc44049c1a3946efd09812ebe03bec07dbe6290"],
    [VISUAL_ASSET_IDS.POWERWASH_TOOL_WIDE, "wide", 84, 102, "1e56931d3e0b759317dfcab7612a6abe535f812094ce5e507d684a7d11d87ceb"],
  ].map(([id, tool, width, height, sha256]) => definition({
    id,
    kind: VISUAL_ASSET_KINDS.IMAGE,
    source: source(`/assets/powerwash/tool-${tool}.png`, "png"),
    runtime: Object.freeze({ renderTarget: VISUAL_RENDER_TARGETS.CANVAS, nativeImageKey: `POWERWASH_UI_${tool.toUpperCase()}_ART` }),
    technical: technical({ width, height }),
    ...filePolicy(sha256, { maximumRuntimeBytes: 100_000 }),
    status: "legacy-registered",
  })),
  definition({
    id: VISUAL_ASSET_IDS.DEVELOPMENT_FALLBACK,
    kind: VISUAL_ASSET_KINDS.GENERATED_FALLBACK,
    source: Object.freeze({ kind: "generated", owner: "VisualRegistry" }),
    runtime: Object.freeze({ renderTarget: VISUAL_RENDER_TARGETS.PHASER, textureKey: "kw.fallback.development" }),
    technical: technical({ width: 64, height: 64, presentation: "magenta-checker-with-cross" }),
    requiredness: VISUAL_ASSET_REQUIREDNESS.OPTIONAL,
    lifecycle: Object.freeze({ scope: VISUAL_CACHE_SCOPES.SHARED, unload: "retain-until-game-destroy" }),
    status: "system",
  }),
  definition({
    id: VISUAL_ASSET_IDS.PRODUCTION_FALLBACK,
    kind: VISUAL_ASSET_KINDS.GENERATED_FALLBACK,
    source: Object.freeze({ kind: "generated", owner: "VisualRegistry" }),
    runtime: Object.freeze({ renderTarget: VISUAL_RENDER_TARGETS.PHASER, textureKey: "kw.fallback.production" }),
    technical: technical({ width: 32, height: 32, presentation: "neutral-missing-asset-marker" }),
    requiredness: VISUAL_ASSET_REQUIREDNESS.OPTIONAL,
    lifecycle: Object.freeze({ scope: VISUAL_CACHE_SCOPES.SHARED, unload: "retain-until-game-destroy" }),
    status: "system",
  }),
  ...TOWN_BIN_ASSET_DEFINITIONS,
]);

const residentAnimation = (id, direction) => definition({
  id,
  assetId: VISUAL_ASSET_IDS.RESIDENT_GENERATED_FRAMES,
  runtimeKey: `resident-walk-${direction}`,
  frames: Object.freeze(Array.from({ length: 4 }, (_, frame) => Object.freeze({ textureKey: `resident-${direction}-${frame}` }))),
  frameRate: 9,
  repeat: -1,
  status: "legacy-registered",
});

const BASE_KINDWORKS_VISUAL_MANIFEST = Object.freeze({
  schemaVersion: VISUAL_REGISTRY_SCHEMA_VERSION,
  id: "kindworks.visual-registry",
  revision: 2,
  nonRuntimeFiles: Object.freeze([
    "/assets/legacy-reference/fishing.webp",
    "/assets/legacy-reference/harbour-general.webp",
    "/assets/legacy-reference/magnet-fishing.webp",
    "/assets/legacy-reference/manifest.json",
    "/assets/powerwash/manifest.json",
  ]),
  assets,
  prefabs: Object.freeze([
    definition({
      id: VISUAL_PREFAB_IDS.FISHING_REEDBANK_BACKGROUND,
      renderer: VISUAL_RENDER_TARGETS.PHASER,
      layers: Object.freeze([Object.freeze({ id: "background", assetId: VISUAL_ASSET_IDS.FISHING_REEDBANK_BACKGROUND, depth: 1, alpha: 1, tint: null })]),
      anchor: Object.freeze({ originX: 0.5, originY: 0.5 }),
      sockets: Object.freeze({ sceneCenter: Object.freeze({ x: 640, y: 360 }) }),
      geometry: createVisualGeometry({ visual: createRectGeometry(0, 0, 1280, 720) }),
    }),
    ...TOWN_BIN_PREFAB_DEFINITIONS,
  ]),
  sceneInstances: Object.freeze([
    definition({
      id: VISUAL_SCENE_INSTANCE_IDS.FISHING_REEDBANK_BACKGROUND,
      sceneId: "FishingScene",
      prefabId: VISUAL_PREFAB_IDS.FISHING_REEDBANK_BACKGROUND,
      stateId: VISUAL_STATE_IDS.FISHING_REEDBANK_BACKGROUND,
      position: Object.freeze({ x: 640, y: 360 }),
      scale: Object.freeze({ x: 1, y: 1 }),
      depth: 1,
    }),
  ]),
  visualStates: Object.freeze([
    definition({
      id: VISUAL_STATE_IDS.FISHING_REEDBANK_BACKGROUND,
      defaultState: "default",
      states: Object.freeze({ default: Object.freeze({ prefabId: VISUAL_PREFAB_IDS.FISHING_REEDBANK_BACKGROUND }) }),
    }),
    ...TOWN_BIN_STATE_DEFINITIONS,
  ]),
  animations: Object.freeze([
    residentAnimation(VISUAL_ANIMATION_IDS.RESIDENT_WALK_DOWN, "down"),
    residentAnimation(VISUAL_ANIMATION_IDS.RESIDENT_WALK_LEFT, "left"),
    residentAnimation(VISUAL_ANIMATION_IDS.RESIDENT_WALK_RIGHT, "right"),
    residentAnimation(VISUAL_ANIMATION_IDS.RESIDENT_WALK_UP, "up"),
  ]),
  scenePacks: Object.freeze([
    definition({ id: "pack.scene.boot", sceneId: "BootScene", assetIds: Object.freeze([VISUAL_ASSET_IDS.ANIMAL_REFERENCE_SHEET, VISUAL_ASSET_IDS.RESIDENT_GENERATED_FRAMES]), animationIds: Object.freeze(Object.values(VISUAL_ANIMATION_IDS)) }),
    definition({ id: fishingRuntimePack.id, sceneId: fishingRuntimePack.sceneIds[0], assetIds: Object.freeze(fishingRuntimePack.assetIds), animationIds: Object.freeze([]) }),
    definition({ id: "pack.scene.powerwash", sceneId: "PlaygroundPowerwashScene", assetIds: Object.freeze([VISUAL_ASSET_IDS.POWERWASH_PLAYGROUND_MASTER, VISUAL_ASSET_IDS.POWERWASH_PLAYGROUND_DIRT, VISUAL_ASSET_IDS.POWERWASH_TOOL_PRECISION, VISUAL_ASSET_IDS.POWERWASH_TOOL_STANDARD, VISUAL_ASSET_IDS.POWERWASH_TOOL_WIDE]), animationIds: Object.freeze([]) }),
    definition({ id: "pack.scene.town.river", sceneId: "TownScene", assetIds: Object.freeze([VISUAL_ASSET_IDS.TOWN_RIVER_WATER_TILE]), animationIds: Object.freeze([]) }),
    TOWN_BIN_SCENE_PACK,
  ]),
  legacyCompatibility: Object.freeze({
    textureKeys: Object.freeze([
      Object.freeze({ legacyKey: "legacy-fishing", semanticId: VISUAL_ASSET_IDS.FISHING_REEDBANK_BACKGROUND }),
      Object.freeze({ legacyKey: "animal-reference-master-v44", semanticId: VISUAL_ASSET_IDS.ANIMAL_REFERENCE_SHEET }),
    ]),
    animationKeys: Object.freeze(Object.values(VISUAL_ANIMATION_IDS).map((semanticId) => {
      const animation = [
        [VISUAL_ANIMATION_IDS.RESIDENT_WALK_DOWN, "resident-walk-down"],
        [VISUAL_ANIMATION_IDS.RESIDENT_WALK_LEFT, "resident-walk-left"],
        [VISUAL_ANIMATION_IDS.RESIDENT_WALK_RIGHT, "resident-walk-right"],
        [VISUAL_ANIMATION_IDS.RESIDENT_WALK_UP, "resident-walk-up"],
      ].find(([id]) => id === semanticId);
      return Object.freeze({ legacyKey: animation[1], semanticId });
    })),
    unmappedPolicy: "pass-through",
  }),
  fallbacks: Object.freeze({
    development: Object.freeze({ mode: VISUAL_FALLBACK_MODES.DEVELOPMENT, assetId: VISUAL_ASSET_IDS.DEVELOPMENT_FALLBACK, report: "console-error-and-memory-log" }),
    production: Object.freeze({ mode: VISUAL_FALLBACK_MODES.PRODUCTION, assetId: VISUAL_ASSET_IDS.PRODUCTION_FALLBACK, report: "console-error-and-memory-log" }),
  }),
});

export const KINDWORKS_VISUAL_MANIFEST = createPhase8BApprovedManifest(BASE_KINDWORKS_VISUAL_MANIFEST);
