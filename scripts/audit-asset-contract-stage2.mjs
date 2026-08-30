import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { deflateSync } from "node:zlib";
import sharp from "sharp";
import {
  ASSET_CATEGORY_CONTRACTS,
  ASSET_OUTPUT_TYPES,
  validateAssetCategoryCatalog,
} from "./lib/assetContractCatalog.mjs";
import { validateArtworkManifest } from "./lib/artworkPipelineValidation.mjs";
import { PHASE_8A_VERTICAL_SLICE_PACKAGE } from "../src/visual/verticalSlice/phase8aVerticalSlicePackage.js";

const root = resolve(import.meta.dirname, "..");
const baseManifest = JSON.parse(await readFile(resolve(root, "artwork/specifications/kindworks-artwork-manifest.v1.json"), "utf8"));
const categoryCatalog = JSON.parse(await readFile(resolve(root, "artwork/contracts/asset-category-contracts.v2.json"), "utf8"));
const phase10Plan = JSON.parse(await readFile(resolve(root, "artwork/production/phase-10/production-migration-plan.v1.json"), "utf8"));
const baseAsset = baseManifest.assets[0];
const results = [];

const clone = (value) => structuredClone(value);
const geometryDigest = (geometry) => createHash("sha256").update(JSON.stringify(Object.fromEntries(
  ["collision", "navigation", "interaction", "touch"].map((key) => [key, geometry?.[key] ?? null]),
))).digest("hex");

const makeManifest = (asset) => {
  const manifest = clone(baseManifest);
  manifest.assets = [asset];
  manifest.contractPolicy.requiredSemanticIds = [asset.semanticId];
  return manifest;
};

const record = (id, group, expectation, result, expectedCode = null, note = "") => {
  const codes = result.errors.map(({ code }) => code);
  const accepted = result.ok;
  const passed = expectation === "accept"
    ? accepted
    : !accepted && (!expectedCode || codes.includes(expectedCode));
  const classification = passed
    ? "PASS"
    : expectation === "reject" && accepted
      ? "FALSE_NEGATIVE"
      : expectation === "accept" && !accepted
        ? "FALSE_POSITIVE"
        : "WRONG_REASON";
  results.push({
    id, group, expectation, expectedCode, accepted, classification, codes,
    messages: result.errors.map(({ code, message, path, expected, actual }) => ({ code, message, path, expected, actual })),
    note,
  });
};

const validate = (asset, options = {}) => validateArtworkManifest(makeManifest(asset), {
  validateFiles: false,
  categoryContracts: categoryCatalog.categoryContracts,
  ...options,
});

const token = (value) => String(value).replace(/^category\./, "").replace(/[^a-z0-9]+/g, "-");

function visualAsset(categoryContract, outputType = null) {
  const asset = clone(baseAsset);
  const suffix = token(categoryContract.id);
  asset.semanticId = `audit.${suffix}.valid`;
  asset.familyId = `audit.${suffix}`;
  asset.category = suffix;
  asset.categoryContractId = categoryContract.id;
  asset.intendedScenes = ["AuditScene"];
  asset.scenePackId = "pack.scene.audit";
  asset.filenameStem = `audit-${suffix}`;
  asset.expectedFilenames = {
    staging: `artwork/staging/audit-${suffix}.v1.png`,
    master: `artwork/masters/audit-${suffix}.v1.png`,
    runtime: `public/assets/runtime/audit-${suffix}.v1.png`,
  };
  asset.output.type = outputType || categoryContract.allowedOutputTypes[0];
  asset.output.format = "png";
  asset.output.canvas = { width: 4, height: 4 };
  asset.output.alpha = true;
  asset.output.colourMode = "RGBA";
  asset.output.bitDepth = 8;
  asset.output.spriteSheet = null;
  delete asset.output.atlas;
  asset.masterScale = { nativePixelsPerLogicalUnit: 1, logicalDisplay: { width: 4, height: 4 }, scalePolicy: "fixed-logical-footprint" };
  asset.anchor = { name: "ground-centre", normalized: { x: 0.5, y: 1 }, groundContact: { x: 2, y: 4 } };
  asset.sockets = [{ id: "interaction", logical: { x: 2, y: 2 } }];
  asset.geometry = {
    visual: { kind: "rectangle", x: 0, y: 0, width: 4, height: 4 },
    collision: null,
    navigation: null,
    interaction: null,
    touch: null,
  };
  asset.states = ["default"];
  asset.variants = ["default"];
  asset.directions = [];
  asset.layers = [{ id: "main", order: 0, states: ["default"], canvasAlignment: "full-canvas", alphaAlignment: "transparent-canvas" }];
  asset.animations = [];
  asset.validation.requireStateNames = ["default"];
  asset.validation.requireDirections = [];
  asset.validation.maximumVisibleBounds = { x: 0, y: 0, width: 4, height: 4 };
  asset.validation.maximumTransparentPadding = { top: 4, right: 4, bottom: 4, left: 4 };
  asset.validation.gameplayGeometrySha256 = geometryDigest(asset.geometry);
  asset.validation.maximumRuntimeBytes = 100_000;
  asset.validation.requireAlpha = asset.output.alpha;
  asset.categoryMetadata = {
    fallbackPolicy: "visible-safe-fallback",
    tileGrid: { width: 4, height: 4 },
    seamPolicy: "seamless",
    growthStates: ["default"],
    shadowPolicy: "none",
    blendPolicy: "normal",
    lifetime: 500,
    stateMapping: { default: "default" },
    stateAlignment: "full-canvas",
    doorSockets: ["interaction"],
    rig: "audit-rig-v1",
    habitatPresentation: "ground",
    frameOrder: ["default"],
    intendedDisplaySize: { width: 44, height: 44 },
    safeContentInsets: { top: 1, right: 1, bottom: 1, left: 1 },
    roomGrid: { width: 1, height: 1 },
    minigameId: "audit",
    playfieldScale: "logical-units",
  };
  if (categoryContract.requiresAccessibilityMetadata) {
    asset.accessibility = {
      labelKey: "audit.label",
      minimumRenderedSize: { width: 44, height: 44 },
      minimumContrastRatio: 3,
      safeContentInsets: { top: 1, right: 1, bottom: 1, left: 1 },
      localizationExpansionPercent: 30,
    };
  } else delete asset.accessibility;

  if (["spritesheet", "effect-sheet"].includes(asset.output.type)) {
    const directions = categoryContract.requiresDirections ? ["left", "right"] : [];
    const columns = directions.length || 1;
    const frames = directions.length ? directions.map((direction) => `move.${direction}`) : ["effect"];
    asset.output.spriteSheet = {
      frameWidth: 4,
      frameHeight: 4,
      columns,
      rows: 1,
      padding: 0,
      spacing: 0,
      actions: [directions.length ? "move" : "effect"],
      directions,
      frameOrder: frames,
    };
    asset.output.canvas.width = 4 * columns;
    asset.masterScale.logicalDisplay.width = 4 * columns;
    asset.validation.maximumVisibleBounds.width = 4 * columns;
    asset.geometry.visual.width = 4 * columns;
    asset.layers[0].canvasAlignment = "frame-grid";
    asset.directions = directions;
    asset.validation.requireDirections = directions;
    if (categoryContract.requiresAnimationContract) {
      asset.animations = frames.map((frame, index) => ({
        id: directions.length ? `move-${directions[index]}` : "effect",
        action: directions.length ? "move" : "effect",
        direction: directions[index] || null,
        frames: [frame],
        frameRate: 8,
        repeat: -1,
      }));
    }
    asset.validation.gameplayGeometrySha256 = geometryDigest(asset.geometry);
  }
  if (asset.output.type === "atlas") {
    asset.output.atlas = { dataFilename: `audit-${suffix}.v1.json`, frames: 1, frameNames: ["idle"], allowTrim: false, allowRotation: false };
    asset.expectedFilenames.atlas = `public/assets/runtime/audit-${suffix}.v1.json`;
    if (categoryContract.requiresAnimationContract) asset.animations = [{ id: "idle", action: "idle", direction: null, frames: ["idle"], frameRate: 8, repeat: -1 }];
  }
  if (asset.output.type === "tileset") asset.output.tileset = { tileWidth: 4, tileHeight: 4, columns: 1, rows: 1, seamPolicy: "seamless" };
  if (asset.output.type === "layer-set") asset.output.layerSet = { layerIds: ["main"], stateMapping: { default: "main" } };
  if (asset.output.type === "nine-slice") asset.output.nineSlice = { left: 1, right: 1, top: 1, bottom: 1, safeCenter: { x: 1, y: 1, width: 2, height: 2 } };
  if (asset.output.type === "effect-sheet") asset.output.effect = { blendPolicy: "normal", lifetimeMs: 500, stateMapping: { default: "effect" } };
  return asset;
}

function audioAsset() {
  const category = categoryCatalog.categoryContracts.find(({ id }) => id === "category.audio");
  const asset = visualAsset(category, "audio");
  asset.output = { type: "audio", format: "ogg", audio: { channels: 2, sampleRate: 48_000, durationMs: 1_000, loopPolicy: "once", loudnessTargetLufs: -16 } };
  asset.expectedFilenames = {
    staging: "artwork/staging/audit-audio.v1.ogg",
    master: "artwork/masters/audit-audio.v1.ogg",
    runtime: "public/assets/runtime/audit-audio.v1.ogg",
  };
  asset.filenameStem = "audit-audio";
  asset.states = [];
  asset.variants = [];
  asset.directions = [];
  asset.animations = [];
  delete asset.camera;
  delete asset.masterScale;
  delete asset.anchor;
  delete asset.sockets;
  delete asset.geometry;
  delete asset.layers;
  delete asset.artRules;
  delete asset.accessibility;
  return asset;
}

const getCategory = (id) => categoryCatalog.categoryContracts.find((entry) => entry.id === id);

// Baseline and every declared category.
record("baseline-production-contract", "valid", "accept", await validate(clone(baseAsset)));
for (const category of categoryCatalog.categoryContracts) {
  const asset = category.id === "category.audio"
    ? audioAsset()
    : visualAsset(category, category.requiresAnimationContract
      ? (category.allowedOutputTypes.includes("effect-sheet") && !category.requiresDirections ? "effect-sheet" : "spritesheet")
      : (category.allowedOutputTypes.includes("single-image") ? "single-image" : category.allowedOutputTypes[0]));
  record(`valid-${category.id}`, "category-valid", "accept", await validate(asset), null, category.description);
}

// Every declared output type has a controlled structurally valid specimen.
const outputCategory = {
  "single-image": "category.prop",
  tileset: "category.terrain",
  spritesheet: "category.prop",
  atlas: "category.prop",
  "layer-set": "category.prop",
  "nine-slice": "category.ui",
  "effect-sheet": "category.effect",
  audio: "category.audio",
};
for (const type of ASSET_OUTPUT_TYPES) {
  const category = getCategory(outputCategory[type]);
  const asset = type === "audio" ? audioAsset() : visualAsset(category, type);
  record(`valid-output-${type}`, "output-valid", "accept", await validate(asset));
}

async function mutationCase(id, group, expectedCode, mutate, { expectation = "reject", base = null, note = "" } = {}) {
  const asset = base ? clone(base) : visualAsset(getCategory("category.prop"), "single-image");
  mutate(asset);
  record(id, group, expectation, await validate(asset), expectedCode, note);
}

async function manifestCase(id, group, expectedCode, mutate, options = {}) {
  const asset = options.base ? clone(options.base) : visualAsset(getCategory("category.prop"), "single-image");
  const manifest = makeManifest(asset);
  mutate(manifest, asset);
  record(id, group, options.expectation || "reject", await validateArtworkManifest(manifest, {
    validateFiles: false,
    categoryContracts: categoryCatalog.categoryContracts,
    familyAssignments: options.familyAssignments || [],
  }), expectedCode, options.note || "");
}

await mutationCase("invalid-semantic-id", "identity", "invalid-semantic-id", (asset) => { asset.semanticId = "Provider FINAL Asset"; });
await mutationCase("unknown-category", "category", "unknown-category-contract", (asset) => { asset.categoryContractId = "category.missing"; });
await mutationCase("category-output-mismatch", "category", "category-output-mismatch", (asset) => { asset.output.type = "audio"; });
await mutationCase("unsupported-format", "format", "invalid-output-format", (asset) => { asset.output.format = "gif"; });
await mutationCase("zero-canvas", "dimensions", "invalid-canvas-size", (asset) => { asset.output.canvas.width = 0; });
await mutationCase("invalid-colour-mode", "colour", "invalid-colour-contract", (asset) => { asset.output.colourMode = "CMYK"; });
await mutationCase("invalid-anchor", "anchor", "invalid-anchor", (asset) => { asset.anchor.normalized.x = 1.1; });
await mutationCase("invalid-scale", "scale", "invalid-scale-contract", (asset) => { asset.masterScale.nativePixelsPerLogicalUnit = 0; });
await mutationCase("missing-required-state", "state", "missing-required-state", (asset) => { asset.states = []; });
await mutationCase("duplicate-variant", "variant", "duplicate-contract-token", (asset) => { asset.variants = ["default", "default"]; });
await mutationCase("missing-required-direction", "direction", "missing-required-direction", (asset) => { asset.directions = []; }, { base: visualAsset(getCategory("category.character"), "spritesheet") });
await mutationCase("invalid-frame-grid", "spritesheet", "invalid-frame-grid-metadata", (asset) => { asset.output.spriteSheet.frameWidth = 0; }, { base: visualAsset(getCategory("category.character"), "spritesheet") });
await mutationCase("wrong-frame-count", "spritesheet", "frame-count-mismatch", (asset) => { asset.output.spriteSheet.frameOrder.pop(); }, { base: visualAsset(getCategory("category.character"), "spritesheet") });
await mutationCase("duplicate-frame-name", "spritesheet", "duplicate-frame-name", (asset) => { asset.output.spriteSheet.frameOrder[1] = asset.output.spriteSheet.frameOrder[0]; }, { base: visualAsset(getCategory("category.character"), "spritesheet") });
await mutationCase("invalid-frame-rate", "animation", "invalid-frame-rate", (asset) => { asset.animations[0].frameRate = 0; }, { base: visualAsset(getCategory("category.character"), "spritesheet") });
await mutationCase("invalid-loop-policy", "animation", "invalid-loop-policy", (asset) => { asset.animations[0].repeat = -2; }, { base: visualAsset(getCategory("category.character"), "spritesheet") });
await mutationCase("empty-animation", "animation", "empty-animation", (asset) => { asset.animations[0].frames = []; }, { base: visualAsset(getCategory("category.character"), "spritesheet") });
await mutationCase("missing-animation-frame", "animation", "invalid-animation-frame", (asset) => { asset.animations[0].frames = ["move.missing"]; }, { base: visualAsset(getCategory("category.character"), "spritesheet") });
await mutationCase("smoothing-enabled", "pixel", "smoothing-forbidden", (asset) => { asset.output.smoothing = true; });
await mutationCase("trimming-enabled", "pixel", "frame-trimming-forbidden", (asset) => { asset.output.trimFrames = true; });
await mutationCase("linear-filtering", "pixel", "invalid-texture-filtering", (asset) => { asset.output.textureFiltering = "linear"; });
await mutationCase("missing-geometry-channel", "geometry", "missing-geometry-channel", (asset) => { delete asset.geometry.collision; asset.validation.gameplayGeometrySha256 = geometryDigest(asset.geometry); });
await mutationCase("invalid-visual-geometry", "geometry", "invalid-visual-geometry", (asset) => { asset.geometry.visual.width = 0; });
await mutationCase("gameplay-geometry-change", "geometry", "gameplay-geometry-digest-mismatch", (asset) => { asset.geometry.touch = { kind: "rectangle", x: 0, y: 0, width: 99, height: 99 }; });
await mutationCase("missing-accessibility", "accessibility", "missing-accessibility-contract", (asset) => { delete asset.accessibility; }, { base: visualAsset(getCategory("category.ui"), "single-image") });
await mutationCase("incomplete-art-rules", "style", "incomplete-art-rules", (asset) => { delete asset.artRules.palette; });
await mutationCase("unknown-field", "schema", "unknown-contract-field", (asset) => { asset.generatorHint = "loophole"; });
await mutationCase("duplicate-socket", "socket", "duplicate-socket-id", (asset) => { asset.sockets.push(clone(asset.sockets[0])); });
await mutationCase("invalid-socket", "socket", "invalid-socket", (asset) => { asset.sockets[0].logical.x = "left"; });
await mutationCase("missing-fallback", "fallback", "missing-fallback", (asset) => { asset.validation.fallbackSemanticId = "system.fallback.unknown"; });
await mutationCase("missing-dependency", "dependency", "missing-dependency", (asset) => { asset.dependencies = ["asset.missing"]; });
await mutationCase("invalid-scene-pack-prefix", "scene-pack", "orphaned-scene-pack", (asset) => { asset.scenePackId = "AuditScene"; });
await mutationCase("invalid-production-status", "workflow", "invalid-production-status", (asset) => { asset.productionStatus = "done"; });
await mutationCase("incomplete-provenance", "provenance", "incomplete-provenance", (asset) => { delete asset.provenance.assetVersion; });
await mutationCase("orphan-scene", "scene", "orphaned-artwork-entry", (asset) => { asset.intendedScenes = []; });
await mutationCase("invalid-padding-contract", "padding", "invalid-padding-contract", (asset) => { asset.validation.maximumTransparentPadding.left = -1; });
await mutationCase("invalid-visible-bounds", "bounds", "invalid-visible-bounds-contract", (asset) => { asset.validation.maximumVisibleBounds.width = 5; });
await mutationCase("invalid-output-type", "output", "invalid-output-type", (asset) => { asset.output.type = "movie"; });
await mutationCase("unexpected-frame-grid", "spritesheet", "unexpected-frame-grid", (asset) => { asset.output.spriteSheet = { rows: 1 }; });
await mutationCase("missing-frame-grid", "spritesheet", "missing-frame-grid", (asset) => { asset.output.type = "spritesheet"; asset.output.spriteSheet = null; });
await mutationCase("unknown-frame-action", "spritesheet", "unknown-frame-action", (asset) => { asset.output.spriteSheet.frameOrder[0] = "fly.left"; }, { base: visualAsset(getCategory("category.character"), "spritesheet") });
await mutationCase("unknown-frame-direction", "spritesheet", "unknown-frame-direction", (asset) => { asset.output.spriteSheet.frameOrder[0] = "move.up"; }, { base: visualAsset(getCategory("category.character"), "spritesheet") });
await mutationCase("atlas-frame-count-mismatch", "atlas", "atlas-frame-mismatch", (asset) => {
  asset.output.atlas = { dataFilename: "audit-character.v1.json", frames: 99, frameNames: [...asset.output.spriteSheet.frameOrder], allowTrim: false, allowRotation: false };
}, { base: visualAsset(getCategory("category.character"), "spritesheet") });
await mutationCase("atlas-invalid-frame-names", "atlas", "invalid-atlas-frame-names", (asset) => {
  asset.output.atlas = { dataFilename: "audit-character.v1.json", frames: 2, frameNames: ["move.left", "move.left"], allowTrim: false, allowRotation: false };
}, { base: visualAsset(getCategory("category.character"), "spritesheet") });
await mutationCase("atlas-missing-declared-frame", "atlas", "missing-atlas-frame", (asset) => {
  asset.output.atlas = { dataFilename: "audit-character.v1.json", frames: 2, frameNames: ["move.left", "idle"], allowTrim: false, allowRotation: false };
}, { base: visualAsset(getCategory("category.character"), "spritesheet") });
await mutationCase("atlas-unsafe-transform", "atlas", "unsafe-atlas-transform", (asset) => {
  asset.output.atlas = { dataFilename: "audit-character.v1.json", frames: 2, frameNames: [...asset.output.spriteSheet.frameOrder], allowTrim: true, allowRotation: false };
}, { base: visualAsset(getCategory("category.character"), "spritesheet") });
await mutationCase("duplicate-layer-id", "layer", "duplicate-layer-id", (asset) => { asset.layers.push(clone(asset.layers[0])); });
await mutationCase("invalid-layer-alignment", "layer", "invalid-layer-alignment", (asset) => { asset.layers[0].canvasAlignment = "cropped"; });
await mutationCase("missing-layer-state", "layer", "missing-layer-state", (asset) => { asset.states.push("dirty"); });
await mutationCase("invalid-animation-id", "animation", "invalid-animation", (asset) => { asset.animations[0].id = ""; }, { base: visualAsset(getCategory("category.character"), "spritesheet") });
await mutationCase("duplicate-animation-id", "animation", "duplicate-animation-id", (asset) => { asset.animations.push(clone(asset.animations[0])); }, { base: visualAsset(getCategory("category.character"), "spritesheet") });
await mutationCase("invalid-animation-action", "animation", "invalid-animation-action", (asset) => { asset.animations[0].action = "fly"; }, { base: visualAsset(getCategory("category.character"), "spritesheet") });
await mutationCase("invalid-animation-direction", "animation", "invalid-animation-direction", (asset) => { asset.animations[0].direction = "up"; }, { base: visualAsset(getCategory("category.character"), "spritesheet") });
await mutationCase("invalid-token", "token", "invalid-contract-token", (asset) => { asset.states = ["Default State"]; });
await mutationCase("category-variants-required", "category", "category-variants-required", (asset) => { asset.variants = []; });
await mutationCase("category-directions-required", "category", "category-directions-required", (asset) => { asset.directions = []; asset.validation.requireDirections = []; }, { base: visualAsset(getCategory("category.character"), "spritesheet") });
await mutationCase("category-animations-required", "category", "category-animations-required", (asset) => { asset.animations = []; }, { base: visualAsset(getCategory("category.effect"), "effect-sheet") });
await mutationCase("art-bible-version-mismatch", "style", "art-bible-version-mismatch", (asset) => { asset.artRules.artBibleVersion = "unapproved"; });
await manifestCase("invalid-artwork-schema", "manifest", "invalid-artwork-schema", (manifest) => { manifest.schemaVersion = 999; });
await manifestCase("workflow-status-order", "manifest", "workflow-status-contract-mismatch", (manifest) => { manifest.workflowStatuses.reverse(); });
await manifestCase("invalid-contract-policy", "manifest", "invalid-contract-policy", (manifest) => { manifest.contractPolicy.allowUncontractedAssets = true; });
await mutationCase("invalid-asset-contract-version", "schema", "invalid-asset-contract-version", (asset) => { asset.schemaVersion = 999; });
await mutationCase("missing-required-spec-field", "schema", "missing-spec-field", (asset) => { delete asset.gameplayPurpose; });
await manifestCase("duplicate-semantic-id", "identity", "duplicate-semantic-id", (manifest, asset) => { manifest.assets.push(clone(asset)); });
await manifestCase("missing-required-contract", "policy", "missing-required-contract", (manifest) => { manifest.assets = []; });
await manifestCase("unapproved-contract", "policy", "unapproved-contract", (manifest, asset) => {
  const extra = clone(asset); extra.semanticId = "audit.unapproved.extra"; manifest.assets.push(extra);
});
await manifestCase("duplicate-output-filename", "filename", "duplicate-output-filename", (manifest, asset) => {
  const extra = clone(asset); extra.semanticId = "audit.duplicate.filename"; manifest.contractPolicy.requiredSemanticIds.push(extra.semanticId); manifest.assets.push(extra);
});
await mutationCase("audio-animation-forbidden", "audio", "audio-animation-forbidden", (asset) => { asset.animations = [{ id: "sound", action: "play", frames: ["x"], frameRate: 1, repeat: 0 }]; }, { base: audioAsset() });

{
  const familyAssignments = categoryCatalog.familyAssignments;
  await manifestCase("unknown-family-contract", "family", "unknown-family-contract", (manifest, asset) => { asset.familyId = "family.missing"; }, { familyAssignments });
  await manifestCase("family-category-mismatch", "family", "family-category-contract-mismatch", (manifest, asset) => { asset.categoryContractId = "category.ui"; }, { base: clone(baseAsset), familyAssignments });
}

// Contract/schema loopholes: these are expected to be rejected by the documented contract but currently are not.
await mutationCase("geometry-unknown-shape", "loophole", "invalid-geometry-shape", (asset) => {
  asset.geometry.collision = { kind: "dragon", x: "far", width: -10 };
  asset.validation.gameplayGeometrySha256 = geometryDigest(asset.geometry);
}, { note: "The digest protects change, but the shape itself is not schema-validated." });
await mutationCase("ground-contact-outside-canvas", "loophole", "invalid-ground-anchor", (asset) => { asset.anchor.groundContact = { x: 999, y: -999 }; });
await mutationCase("socket-invalid-id", "loophole", "invalid-socket-id", (asset) => { asset.sockets[0].id = "Door Socket FINAL"; });
await mutationCase("layer-invalid-alpha-alignment", "loophole", "invalid-layer-alpha-alignment", (asset) => { asset.layers[0].alphaAlignment = "whatever"; });
await mutationCase("layer-unknown-state", "loophole", "unknown-layer-state", (asset) => { asset.layers[0].states.push("undeclared"); });
await mutationCase("layer-duplicate-order", "loophole", "duplicate-layer-order", (asset) => { asset.layers.push({ id: "second", order: 0, states: ["default"], canvasAlignment: "full-canvas", alphaAlignment: "transparent-canvas" }); });
await mutationCase("duplicate-dependency", "loophole", "duplicate-dependency", (asset) => { asset.dependencies = [asset.semanticId, asset.semanticId]; });
await mutationCase("self-dependency", "loophole", "dependency-cycle", (asset) => { asset.dependencies = [asset.semanticId]; });
await mutationCase("scene-pack-does-not-exist", "loophole", "unknown-scene-pack", (asset) => { asset.scenePackId = "pack.scene.does-not-exist"; });
await mutationCase("invalid-filename-stem", "loophole", "invalid-filename-stem", (asset) => {
  asset.filenameStem = "Provider FINAL";
  asset.expectedFilenames = {
    staging: "artwork/staging/Provider FINAL.anything.v1.png",
    master: "artwork/masters/Provider FINAL.anything.v1.png",
    runtime: "public/assets/runtime/Provider FINAL.anything.v1.png",
  };
});
await mutationCase("require-alpha-conflict", "loophole", "invalid-require-alpha", (asset) => { asset.validation.requireAlpha = false; });
await mutationCase("require-exact-dimensions-disabled", "loophole", "invalid-require-exact-dimensions", (asset) => { asset.validation.requireExactDimensions = false; });
await mutationCase("require-untrimmed-disabled", "loophole", "invalid-require-untrimmed", (asset) => { asset.validation.requireUntrimmedFrames = false; });
await mutationCase("invalid-runtime-budget", "loophole", "invalid-runtime-budget", (asset) => { asset.validation.maximumRuntimeBytes = -1; });

for (const [type, categoryId, reason] of [
  ["tileset", "category.terrain", "tile grid and seam policy"],
  ["layer-set", "category.prop", "layer file/state mapping"],
  ["nine-slice", "category.ui", "nine-slice margins and safe centre"],
]) {
  const asset = visualAsset(getCategory(categoryId), type);
  if (type === "tileset") delete asset.output.tileset;
  if (type === "layer-set") delete asset.output.layerSet;
  if (type === "nine-slice") delete asset.output.nineSlice;
  record(`missing-${type}-specific-contract`, "output-loophole", "reject", await validate(asset), `missing-${type}-metadata`, `No executable ${reason} field exists in schema v2.`);
}
await mutationCase("invalid-tileset-grid", "output", "invalid-tileset-grid", (asset) => { asset.output.tileset.columns = 2; }, { base: visualAsset(getCategory("category.terrain"), "tileset") });
const effectWithoutSemanticMetadata = visualAsset(getCategory("category.effect"), "effect-sheet");
delete effectWithoutSemanticMetadata.output.effect;
record("effect-missing-blend-lifetime", "output-loophole", "reject", await validate(effectWithoutSemanticMetadata), "missing-effect-metadata", "blendPolicy/lifetime/stateMapping exist only in category requiredMetadata prose.");

const categoryMetadataWithoutExecutableLeafFields = new Map([
  ["category.system-fallback", ["fallbackPolicy"]],
  ["category.terrain", ["tileGrid", "seamPolicy"]],
  ["category.effect", ["blendPolicy", "lifetime", "stateMapping"]],
  ["category.building", ["stateAlignment", "doorSockets"]],
  ["category.character", ["rig"]],
  ["category.animal", ["rig", "habitatPresentation"]],
  ["category.interior", ["roomGrid"]],
  ["category.minigame", ["minigameId", "stateMapping"]],
]);
for (const category of categoryCatalog.categoryContracts) {
  const missingExecutableFields = categoryMetadataWithoutExecutableLeafFields.get(category.id);
  if (!missingExecutableFields) continue;
  const asset = category.id === "category.audio" ? audioAsset() : visualAsset(category, category.requiresAnimationContract
    ? (category.requiresDirections ? "spritesheet" : "effect-sheet")
    : (category.allowedOutputTypes.includes("single-image") ? "single-image" : category.allowedOutputTypes[0]));
  for (const field of missingExecutableFields) delete asset.categoryMetadata?.[field];
  record(`required-metadata-${category.id}`, "required-metadata", "reject", await validate(asset), "missing-category-required-metadata", `Catalogue requires ${missingExecutableFields.join(", ")}, but schema v2 has no executable leaf field for these requirements.`);
}

// Catalogue-level schema probes.
const catalogBaseline = validateAssetCategoryCatalog({ categoryContracts: categoryCatalog.categoryContracts, familyAssignments: categoryCatalog.familyAssignments });
record("valid-category-catalog", "catalog", "accept", catalogBaseline);
for (const [id, expectedCode, mutate] of [
  ["catalog-duplicate-id", "duplicate-category-contract", (catalog) => catalog.categoryContracts.push(clone(catalog.categoryContracts[0]))],
  ["catalog-unsupported-output", "unsupported-category-output-type", (catalog) => catalog.categoryContracts[0].allowedOutputTypes.push("movie")],
  ["catalog-duplicate-required-metadata", "invalid-required-metadata", (catalog) => catalog.categoryContracts[0].requiredMetadata.push(catalog.categoryContracts[0].requiredMetadata[0])],
  ["catalog-unknown-field", "unknown-contract-field", (catalog) => { catalog.categoryContracts[0].generatorHint = true; }],
]) {
  const catalog = clone(categoryCatalog); mutate(catalog);
  record(id, "catalog", "reject", validateAssetCategoryCatalog({ categoryContracts: catalog.categoryContracts, familyAssignments: catalog.familyAssignments }), expectedCode);
}
{
  const catalog = clone(categoryCatalog); catalog.familyAssignments.pop();
  record("catalog-missing-family", "catalog", "reject", validateAssetCategoryCatalog({ categoryContracts: catalog.categoryContracts, familyAssignments: catalog.familyAssignments, phase10Plan }), "missing-family-contract");
}
{
  const catalog = clone(categoryCatalog); const orphan = clone(catalog.familyAssignments[0]); orphan.familyId = "audit.orphan-family"; catalog.familyAssignments.push(orphan);
  record("catalog-orphan-family", "catalog", "reject", validateAssetCategoryCatalog({ categoryContracts: catalog.categoryContracts, familyAssignments: catalog.familyAssignments, phase10Plan }), "orphan-family-contract");
}
for (const [id, expectedCode, mutate] of [
  ["catalog-invalid-version", "invalid-category-contract-version", (catalog) => { catalog.categoryContracts[0].schemaVersion = 999; }],
  ["catalog-duplicate-family", "duplicate-family-contract", (catalog) => catalog.familyAssignments.push(clone(catalog.familyAssignments[0]))],
  ["catalog-invalid-family-version", "invalid-family-contract-version", (catalog) => { catalog.familyAssignments[0].schemaVersion = 999; }],
  ["catalog-invalid-family-readiness", "invalid-family-readiness", (catalog) => { catalog.familyAssignments[0].productionReady = false; catalog.familyAssignments[0].readinessReason = ""; }],
]) {
  const catalog = clone(categoryCatalog); mutate(catalog);
  record(id, "catalog", "reject", validateAssetCategoryCatalog({ categoryContracts: catalog.categoryContracts, familyAssignments: catalog.familyAssignments }), expectedCode);
}
for (const [id, expectedCode, mutate] of [
  ["catalog-invalid-id-token", "invalid-category-contract-id", (catalog) => { catalog.categoryContracts[0].id = "Category FINAL"; }],
  ["catalog-invalid-format", "unsupported-category-format", (catalog) => { catalog.categoryContracts[0].allowedFormats = ["gif"]; }],
  ["catalog-nonboolean-requirement", "invalid-category-requirement", (catalog) => { catalog.categoryContracts[0].requiresScale = "sometimes"; }],
  ["catalog-nonstring-required-metadata", "invalid-required-metadata", (catalog) => { catalog.categoryContracts[0].requiredMetadata = [42]; }],
]) {
  const catalog = clone(categoryCatalog); mutate(catalog);
  record(id, "catalog-loophole", "reject", validateAssetCategoryCatalog({ categoryContracts: catalog.categoryContracts, familyAssignments: catalog.familyAssignments }), expectedCode);
}

// Binary fixtures are created only in a temporary audit root and removed after testing.
const crcTable = Array.from({ length: 256 }, (_, value) => {
  let crc = value;
  for (let bit = 0; bit < 8; bit += 1) crc = (crc & 1) ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  return crc >>> 0;
});
const crc32 = (buffer) => {
  let crc = 0xffffffff;
  for (const value of buffer) crc = crcTable[(crc ^ value) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
};
const pngChunk = (type, data, corruptCrc = false) => {
  const label = Buffer.from(type), length = Buffer.alloc(4), checksum = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  checksum.writeUInt32BE(corruptCrc ? 0 : crc32(Buffer.concat([label, data])));
  return Buffer.concat([length, label, data, checksum]);
};
const png = ({ width = 4, height = 4, alpha = true, opaqueX = 1, opaqueY = 1, interlace = 0, corruptIdatCrc = false, bitDepth = 8 } = {}) => {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0); header.writeUInt32BE(height, 4); header[8] = bitDepth; header[9] = alpha ? 6 : 2; header[12] = interlace;
  const channels = alpha ? 4 : 3, bytesPerSample = bitDepth / 8, rows = [];
  for (let y = 0; y < height; y += 1) {
    const row = Buffer.alloc(1 + width * channels * bytesPerSample); row[0] = 0;
    for (let x = 0; x < width; x += 1) {
      const index = 1 + x * channels * bytesPerSample;
      if (!alpha || (x === opaqueX && y === opaqueY)) {
        for (let channel = 0; channel < channels; channel += 1) {
          const value = channel === 3 && alpha ? 0xffff : 0xffff;
          if (bitDepth === 16) row.writeUInt16BE(value, index + channel * 2);
          else row[index + channel] = 255;
        }
      }
    }
    rows.push(row);
  }
  return Buffer.concat([
    Buffer.from("89504e470d0a1a0a", "hex"),
    pngChunk("IHDR", header),
    pngChunk("IDAT", deflateSync(Buffer.concat(rows)), corruptIdatCrc),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
};
const interlacedRgbaPng = ({ width = 4, height = 4, opaqueX = 1, opaqueY = 1 } = {}) => {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0); header.writeUInt32BE(height, 4); header[8] = 8; header[9] = 6; header[12] = 1;
  const passes = [
    [0, 0, 8, 8], [4, 0, 8, 8], [0, 4, 4, 8], [2, 0, 4, 4],
    [0, 2, 2, 4], [1, 0, 2, 2], [0, 1, 1, 2],
  ];
  const rows = [];
  for (const [startX, startY, stepX, stepY] of passes) {
    const xs = []; for (let x = startX; x < width; x += stepX) xs.push(x);
    if (!xs.length) continue;
    for (let y = startY; y < height; y += stepY) {
      const row = Buffer.alloc(1 + xs.length * 4); row[0] = 0;
      xs.forEach((x, index) => {
        if (x === opaqueX && y === opaqueY) row.set([255, 255, 255, 255], 1 + index * 4);
      });
      rows.push(row);
    }
  }
  return Buffer.concat([
    Buffer.from("89504e470d0a1a0a", "hex"),
    pngChunk("IHDR", header),
    pngChunk("IDAT", deflateSync(Buffer.concat(rows))),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
};
const headerOnlyRgbPng = (width = 4, height = 4) => {
  const buffer = Buffer.alloc(26);
  Buffer.from("89504e470d0a1a0a", "hex").copy(buffer, 0);
  buffer.writeUInt32BE(width, 16); buffer.writeUInt32BE(height, 20); buffer[24] = 8; buffer[25] = 2;
  return buffer;
};
const fakeAlphaWebp = (width = 4, height = 4) => {
  const buffer = Buffer.alloc(30);
  buffer.write("RIFF", 0, "ascii"); buffer.writeUInt32LE(22, 4); buffer.write("WEBP", 8, "ascii"); buffer.write("VP8X", 12, "ascii");
  buffer[20] = 0x10;
  const write24 = (offset, value) => { buffer[offset] = value & 255; buffer[offset + 1] = (value >>> 8) & 255; buffer[offset + 2] = (value >>> 16) & 255; };
  write24(24, width - 1); write24(27, height - 1);
  return buffer;
};

async function fileCase(id, expectation, expectedCode, asset, roleBuffers, note = "") {
  const temporaryRoot = await mkdtemp(join(tmpdir(), "kindworks-stage2-contract-"));
  try {
    for (const [role, buffer] of Object.entries(roleBuffers)) {
      const relative = asset.expectedFilenames[role];
      await mkdir(resolve(temporaryRoot, dirname(relative)), { recursive: true });
      await writeFile(resolve(temporaryRoot, relative), buffer);
    }
    const result = await validateArtworkManifest(makeManifest(asset), {
      root: temporaryRoot,
      validateFiles: true,
      categoryContracts: categoryCatalog.categoryContracts,
    });
    record(id, "binary", expectation, result, expectedCode, note);
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
}

function fileVisualAsset({ format = "png", alpha = true, width = 4, height = 4 } = {}) {
  const asset = visualAsset(getCategory("category.prop"), "single-image");
  asset.semanticId = `audit.binary.${format}`;
  asset.filenameStem = `audit-binary-${format}`;
  asset.output.format = format;
  asset.output.canvas = { width, height };
  asset.output.alpha = alpha;
  asset.validation.requireAlpha = alpha;
  asset.output.colourMode = alpha ? "RGBA" : "RGB";
  asset.validation.maximumVisibleBounds = { x: 0, y: 0, width, height };
  asset.validation.maximumTransparentPadding = { top: height, right: width, bottom: height, left: width };
  asset.expectedFilenames = {
    staging: `artwork/staging/${asset.filenameStem}.v1.${format}`,
    master: `artwork/masters/${asset.filenameStem}.v1.${format}`,
    runtime: `public/assets/runtime/${asset.filenameStem}.v1.${format}`,
  };
  return asset;
}
const roles = (buffer) => ({ staging: buffer, master: buffer, runtime: buffer });

await fileCase("valid-rgba-png", "accept", null, fileVisualAsset(), roles(png()));
await fileCase("valid-rgb-png", "accept", null, fileVisualAsset({ alpha: false }), roles(png({ alpha: false })));
await fileCase("empty-alpha-png", "reject", "empty-or-uninspectable-alpha", fileVisualAsset(), roles(png({ opaqueX: -1, opaqueY: -1 })));
await fileCase("wrong-pixel-dimensions", "reject", "dimension-mismatch", fileVisualAsset({ width: 5 }), roles(png()));
await fileCase("wrong-pixel-alpha", "reject", "alpha-mismatch", fileVisualAsset({ alpha: false }), roles(png()));
{
  const asset = fileVisualAsset(); delete asset.expectedFilenames.runtime;
  await fileCase("missing-required-file-path", "reject", "missing-required-file-path", asset, { staging: png(), master: png() });
}
{
  const asset = fileVisualAsset(); asset.expectedFilenames.runtime = "unsafe/audit-binary-png.v1.png";
  await fileCase("unsafe-output-location", "reject", "unsafe-output-location", asset, roles(png()));
}
{
  const asset = fileVisualAsset(); asset.expectedFilenames.runtime = "public/assets/runtime/audit-binary-png.v1.webp";
  await fileCase("filename-format-mismatch", "reject", "filename-format-mismatch", asset, roles(png()));
}
{
  const asset = fileVisualAsset(); asset.expectedFilenames.runtime = "public/assets/runtime/unrelated.v1.png";
  await fileCase("filename-contract-mismatch", "reject", "filename-contract-mismatch", asset, roles(png()));
}
{
  const asset = fileVisualAsset(); asset.validation.maximumTransparentPadding = { top: 0, right: 0, bottom: 0, left: 0 };
  await fileCase("excess-transparent-padding", "reject", "transparent-padding-exceeded", asset, roles(png()));
}
{
  const asset = fileVisualAsset(); asset.validation.maximumVisibleBounds = { x: 0, y: 0, width: 1, height: 1 };
  await fileCase("visible-pixels-outside-bounds", "reject", "visible-bounds-exceeded", asset, roles(png({ opaqueX: 2, opaqueY: 2 })));
}
{
  const asset = fileVisualAsset(); asset.validation.maximumRuntimeBytes = 1;
  await fileCase("runtime-texture-over-budget", "reject", "texture-budget-exceeded", asset, roles(png()));
}
await fileCase("corrupt-header-only-rgb-png", "reject", "corrupt-or-unsupported-image", fileVisualAsset({ alpha: false }), roles(headerOnlyRgbPng()), "Header-only RGB PNG has no chunks or pixels.");
await fileCase("corrupt-png-crc", "reject", "corrupt-or-unsupported-image", fileVisualAsset(), roles(png({ corruptIdatCrc: true })), "PNG chunk CRC is deliberately invalid.");
await fileCase("valid-interlaced-rgba-png", "accept", null, fileVisualAsset(), roles(interlacedRgbaPng()), "Valid Adam7-interlaced RGBA data exercises platform/parser parity.");
await fileCase("corrupt-alpha-webp-header-only", "reject", "corrupt-or-unsupported-image", fileVisualAsset({ format: "webp" }), roles(fakeAlphaWebp()), "VP8X header has no image payload; bounds and padding cannot be inspected.");
await fileCase("file-format-mismatch", "reject", "file-format-mismatch", fileVisualAsset(), roles(await sharp(png()).webp({ lossless: true }).toBuffer()));
{
  await fileCase("pixel-bit-depth-mismatch", "reject", "bit-depth-mismatch", fileVisualAsset(), roles(png({ bitDepth: 16 })));
}
{
  const asset = fileVisualAsset();
  await fileCase("staging-master-alignment", "reject", "stage-master-alignment-mismatch", asset, { staging: png(), master: png({ width: 5 }), runtime: png() });
}
{
  const asset = fileVisualAsset();
  await fileCase("master-runtime-alignment", "reject", "master-runtime-alignment-mismatch", asset, { staging: png(), master: png(), runtime: png({ width: 5 }) });
}
{
  const asset = audioAsset();
  await fileCase("corrupt-ogg-random-bytes", "reject", "file-format-mismatch", asset, roles(Buffer.from("this is not an ogg stream")), "The extension hint must not substitute for parsing bytes.");
}
{
  const asset = audioAsset(); asset.validation.maximumRuntimeBytes = 1;
  await fileCase("runtime-audio-over-budget", "reject", "audio-budget-exceeded", asset, roles(Buffer.from("OggS-valid-enough-for-header-probe")));
}

const atlasImage = png();
const validAtlas = () => ({ frames: { idle: { frame: { x: 0, y: 0, w: 4, h: 4 }, trimmed: false, rotated: false } } });
const atlasAsset = () => visualAsset(getCategory("category.prop"), "atlas");
await fileCase("valid-atlas-json", "accept", null, atlasAsset(), { ...roles(atlasImage), atlas: Buffer.from(JSON.stringify(validAtlas())) });
{
  const asset = atlasAsset(); delete asset.expectedFilenames.atlas;
  await fileCase("missing-atlas-data-path", "reject", "missing-atlas-data-path", asset, roles(atlasImage));
}
{
  const asset = atlasAsset(); asset.expectedFilenames.atlas = "unsafe/audit-prop.v1.json";
  await fileCase("unsafe-atlas-location", "reject", "unsafe-atlas-location", asset, { ...roles(atlasImage), atlas: Buffer.from(JSON.stringify(validAtlas())) });
}
{
  const asset = atlasAsset(); asset.expectedFilenames.atlas = "public/assets/runtime/wrong-name.v1.json";
  await fileCase("atlas-filename-mismatch", "reject", "atlas-filename-mismatch", asset, { ...roles(atlasImage), atlas: Buffer.from(JSON.stringify(validAtlas())) });
}
{
  const asset = atlasAsset(); const data = validAtlas(); data.frames.extra = { frame: { x: 0, y: 0, w: 1, h: 1 }, trimmed: false, rotated: false };
  await fileCase("atlas-file-frame-count", "reject", "atlas-file-frame-count-mismatch", asset, { ...roles(atlasImage), atlas: Buffer.from(JSON.stringify(data)) });
}
{
  const asset = atlasAsset(); const data = { frames: { other: { frame: { x: 0, y: 0, w: 4, h: 4 }, trimmed: false, rotated: false } } };
  await fileCase("atlas-file-missing-frame", "reject", "missing-atlas-file-frame", asset, { ...roles(atlasImage), atlas: Buffer.from(JSON.stringify(data)) });
}
{
  const asset = atlasAsset(); const data = validAtlas(); data.frames.idle.frame.w = 5;
  await fileCase("atlas-frame-out-of-bounds", "reject", "invalid-atlas-frame-rectangle", asset, { ...roles(atlasImage), atlas: Buffer.from(JSON.stringify(data)) });
}
{
  const asset = atlasAsset(); const data = validAtlas(); data.frames.idle.rotated = true;
  await fileCase("atlas-file-unsafe-transform", "reject", "unsafe-atlas-file-transform", asset, { ...roles(atlasImage), atlas: Buffer.from(JSON.stringify(data)) });
}

{
  const temporaryRoot = await mkdtemp(join(tmpdir(), "kindworks-stage2-case-"));
  try {
    const asset = fileVisualAsset();
    for (const relative of Object.values(asset.expectedFilenames)) {
      const directory = resolve(temporaryRoot, dirname(relative));
      await mkdir(directory, { recursive: true });
      const actualName = relative.split("/").at(-1).toUpperCase();
      await writeFile(resolve(directory, actualName), png());
    }
    const result = await validateArtworkManifest(makeManifest(asset), { root: temporaryRoot, validateFiles: true, categoryContracts: categoryCatalog.categoryContracts });
    record("incorrect-filesystem-case", "binary", "reject", result, "filename-case-mismatch", "On a case-insensitive macOS volume, access() resolves the wrong case unless the validator compares directory entries exactly.");
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
}

const validatorSources = await Promise.all([
  readFile(resolve(root, "scripts/lib/artworkPipelineValidation.mjs"), "utf8"),
  readFile(resolve(root, "scripts/lib/assetContractCatalog.mjs"), "utf8"),
]);
const executableErrorCodes = [...new Set([...validatorSources.join("\n").matchAll(/(?:error\(errors,|code:\s*)\s*"([^"]+)"/g)].map((match) => match[1]))].sort();
const fixtureCodes = new Set(results.flatMap(({ expectedCode, codes }) => [expectedCode, ...codes]).filter(Boolean));
const currentContracts = [...baseManifest.assets, ...PHASE_8A_VERTICAL_SLICE_PACKAGE.assets];
const countBy = (values) => Object.fromEntries([...new Set(values)].sort().map((value) => [value, values.filter((candidate) => candidate === value).length]));
const summary = {
  total: results.length,
  passed: results.filter(({ classification }) => classification === "PASS").length,
  falseNegatives: results.filter(({ classification }) => classification === "FALSE_NEGATIVE").length,
  falsePositives: results.filter(({ classification }) => classification === "FALSE_POSITIVE").length,
  wrongReason: results.filter(({ classification }) => classification === "WRONG_REASON").length,
  categoriesExercised: categoryCatalog.categoryContracts.length,
  outputTypesExercised: ASSET_OUTPUT_TYPES.length,
  executableErrorCodes: executableErrorCodes.length,
  executableErrorCodesCovered: executableErrorCodes.filter((code) => fixtureCodes.has(code)).length,
  currentLeafContracts: currentContracts.length,
  currentLeafCategories: countBy(currentContracts.map(({ categoryContractId }) => categoryContractId)),
  currentLeafOutputTypes: countBy(currentContracts.map(({ output }) => output.type)),
};
const evidence = {
  schemaVersion: 1,
  id: "kindworks.asset-contract-stage2-independent-retest",
  generatedAt: new Date().toISOString(),
  environment: { platform: process.platform, node: process.version },
  summary,
  results,
};
const outputPath = resolve(root, "docs/qa/visual-readiness/asset-contract-stage-2-independent-retest/EVIDENCE.json");
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(evidence, null, 2)}\n`);
console.log(JSON.stringify(summary));
console.log(`Evidence: ${outputPath}`);
if (summary.falseNegatives || summary.falsePositives || summary.wrongReason || summary.executableErrorCodesCovered !== summary.executableErrorCodes) process.exitCode = 2;
