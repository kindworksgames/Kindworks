import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { createVisualRegressionFixtureState } from "../src/qa/visualRegressionFixtures.js";
import { VisualRegistry } from "../src/visual/VisualRegistry.js";
import {
  KINDWORKS_VISUAL_MANIFEST,
  VISUAL_ASSET_IDS,
  VISUAL_SCENE_INSTANCE_IDS,
} from "../src/visual/visualManifest.js";
import {
  validateVisualManifestFiles,
  validateVisualManifestStructure,
} from "../src/visual/validateVisualManifest.js";

const root = resolve(import.meta.dirname, "..");
const digest = (value) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const cloneManifest = () => structuredClone(KINDWORKS_VISUAL_MANIFEST);
const fileExists = async (file) => {
  try { await access(resolve(root, "public", file.replace(/^\//, ""))); return true; }
  catch { return false; }
};

test("validates all registered current files and cross-definition references", async () => {
  const result = await validateVisualManifestFiles(KINDWORKS_VISUAL_MANIFEST, fileExists);
  assert.equal(result.ok, true, JSON.stringify(result.errors, null, 2));
  assert.equal(KINDWORKS_VISUAL_MANIFEST.schemaVersion, 1);
  assert.equal(KINDWORKS_VISUAL_MANIFEST.assets.filter((asset) => asset.source.kind === "file").length, 7);
  assert.equal(KINDWORKS_VISUAL_MANIFEST.animations.length, 4);
  assert.deepEqual(new Set(KINDWORKS_VISUAL_MANIFEST.scenePacks.map((pack) => pack.sceneId)), new Set(["BootScene", "FishingScene", "PlaygroundPowerwashScene", "TownScene"]));
});

test("fails duplicate semantic IDs and missing referenced files", async () => {
  const duplicate = cloneManifest();
  duplicate.assets.push(structuredClone(duplicate.assets[0]));
  const duplicateResult = validateVisualManifestStructure(duplicate);
  assert.equal(duplicateResult.ok, false);
  assert.ok(duplicateResult.errors.some((finding) => finding.code === "duplicate-id"));

  const crossSectionDuplicate = cloneManifest();
  crossSectionDuplicate.prefabs[0].id = crossSectionDuplicate.assets[0].id;
  const crossSectionResult = validateVisualManifestStructure(crossSectionDuplicate);
  assert.equal(crossSectionResult.ok, false);
  assert.ok(crossSectionResult.errors.some((finding) => finding.code === "duplicate-semantic-id"));

  const missing = cloneManifest();
  missing.assets.find((asset) => asset.id === VISUAL_ASSET_IDS.FISHING_REEDBANK_BACKGROUND).source.file = "/assets/does-not-exist/fishing.webp";
  const missingResult = await validateVisualManifestFiles(missing, fileExists);
  assert.equal(missingResult.ok, false);
  assert.ok(missingResult.errors.some((finding) => finding.code === "missing-asset-file"));
});

test("fails invalid visual-state and animation references", () => {
  const invalid = cloneManifest();
  invalid.sceneInstances[0].stateId = "state.missing";
  invalid.animations[0].assetId = "asset.missing";
  invalid.scenePacks[0].animationIds.push("animation.missing");
  const result = validateVisualManifestStructure(invalid);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((finding) => finding.code === "invalid-state-reference"));
  assert.ok(result.errors.some((finding) => finding.code === "invalid-animation-asset"));
  assert.ok(result.errors.some((finding) => finding.code === "invalid-pack-animation"));
});

test("proves the fishing artwork file is replaceable by registry-only change", async () => {
  const original = new VisualRegistry({ manifest: KINDWORKS_VISUAL_MANIFEST });
  const replacementManifest = cloneManifest();
  replacementManifest.assets.find((asset) => asset.id === VISUAL_ASSET_IDS.FISHING_REEDBANK_BACKGROUND).source.file = "/assets/legacy-reference/magnet-fishing.webp";
  const replacementValidation = await validateVisualManifestFiles(replacementManifest, fileExists);
  assert.equal(replacementValidation.ok, true, JSON.stringify(replacementValidation.errors, null, 2));
  const replacement = new VisualRegistry({ manifest: replacementManifest });
  assert.notEqual(original.assetUrl(VISUAL_ASSET_IDS.FISHING_REEDBANK_BACKGROUND), replacement.assetUrl(VISUAL_ASSET_IDS.FISHING_REEDBANK_BACKGROUND));
  assert.equal(original.getAsset(VISUAL_ASSET_IDS.FISHING_REEDBANK_BACKGROUND).runtime.textureKey, replacement.getAsset(VISUAL_ASSET_IDS.FISHING_REEDBANK_BACKGROUND).runtime.textureKey);

  const sceneSource = await readFile(resolve(root, "src/scenes/FishingScene.js"), "utf8");
  assert.match(sceneSource, /queueScenePacks\(this, this\.scene\.key\)/);
  assert.match(sceneSource, /getTextureKey\(VISUAL_ASSET_IDS\.FISHING_REEDBANK_BACKGROUND\)/);
  assert.match(sceneSource, /tagSceneInstance\(background, VISUAL_SCENE_INSTANCE_IDS\.FISHING_REEDBANK_BACKGROUND\)/);
  assert.doesNotMatch(sceneSource, /legacy-reference\/fishing\.webp/);
  assert.doesNotMatch(sceneSource, /this\.load\.image\(/);
});

test("maps migrated legacy keys and passes unmigrated current keys through unchanged", () => {
  const registry = new VisualRegistry({ reporter: { error() {} } });
  assert.equal(registry.resolveLegacyTextureKey("legacy-fishing"), "kw.asset.scene.fishing.reedbank.background");
  assert.equal(registry.resolveLegacyTextureKey("resident-down-0"), "resident-down-0");
  assert.equal(registry.resolveLegacyAnimationKey("resident-walk-up"), "resident-walk-up");
  assert.equal(registry.resolveLegacyAnimationKey("unmigrated-animation"), "unmigrated-animation");
  assert.deepEqual(registry.getLegacyMigrationDebt(), [
    { kind: "texture", key: "resident-down-0", count: 1 },
    { kind: "animation", key: "unmigrated-animation", count: 1 },
  ]);
  assert.equal(registry.getFailures().filter(({ code }) => code === "unknown-legacy-pass-through").length, 2);
});

test("production keeps compatibility without exposing development warnings", () => {
  const registry = new VisualRegistry({ environment: "production", reporter: { error() {} } });
  assert.equal(registry.resolveLegacyTextureKey("still-unmigrated"), "still-unmigrated");
  assert.deepEqual(registry.getLegacyMigrationDebt(), [{ kind: "texture", key: "still-unmigrated", count: 1 }]);
  assert.equal(registry.getFailures().length, 0);
});

test("uses visible development and safe production fallbacks while recording failures", () => {
  const makeScene = () => {
    const textureKeys = new Set();
    return {
      scene: { key: "FallbackProofScene" },
      textures: {
        exists: (key) => textureKeys.has(key),
        createCanvas: (key) => {
          textureKeys.add(key);
          return { context: { fillStyle: "", strokeStyle: "", lineWidth: 0, fillRect() {}, clearRect() {}, beginPath() {}, moveTo() {}, lineTo() {}, stroke() {} }, refresh() {} };
        },
      },
    };
  };
  const messages = [];
  const reporter = { error: (...args) => messages.push(args) };
  const development = new VisualRegistry({ environment: "development", reporter });
  assert.equal(development.queuePhaserAsset(makeScene(), "missing.asset"), "kw.fallback.development");
  assert.equal(development.getFailures()[0].code, "unknown-asset");
  const production = new VisualRegistry({ environment: "production", reporter });
  assert.equal(production.queuePhaserAsset(makeScene(), "missing.asset"), "kw.fallback.production");
  assert.equal(production.getFailures()[0].sceneId, "FallbackProofScene");
  assert.equal(messages.length, 2);
});

test("exposes stable scene-instance, prefab, anchor, socket and geometry contracts", () => {
  const registry = new VisualRegistry();
  const instance = registry.getSceneInstance(VISUAL_SCENE_INSTANCE_IDS.FISHING_REEDBANK_BACKGROUND);
  const prefab = registry.getPrefab(instance.prefabId);
  assert.equal(instance.sceneId, "FishingScene");
  assert.deepEqual(instance.position, { x: 640, y: 360 });
  assert.deepEqual(prefab.anchor, { originX: 0.5, originY: 0.5 });
  assert.deepEqual(prefab.sockets.sceneCenter, { x: 640, y: 360 });
  assert.deepEqual(prefab.geometry.visual, { schemaVersion: 1, kind: "rectangle", x: 0, y: 0, width: 1280, height: 720 });
  assert.equal(prefab.geometry.collision, null);
  assert.equal(prefab.geometry.navigation, null);
  assert.equal(prefab.geometry.interaction, null);
  assert.equal(prefab.geometry.touch, null);
});

test("does not mutate protected save or gameplay fixture state", () => {
  const state = createVisualRegressionFixtureState();
  const before = digest(state);
  const registry = new VisualRegistry();
  registry.getAsset(VISUAL_ASSET_IDS.FISHING_REEDBANK_BACKGROUND);
  registry.resolveLegacyTextureKey("legacy-fishing");
  assert.equal(digest(state), before);
  assert.equal(state.schemaVersion, 37);
  assert.equal(state.economy.coins, 12_500);
  assert.equal(state.inventory.equipped.mower, "swiftcut-mower");
});
