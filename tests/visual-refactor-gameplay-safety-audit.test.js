import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";

import { LEGACY_SAVE_KEY } from "../src/state/constants.js";
import { LegacySaveImporter } from "../src/state/LegacySaveImporter.js";
import { SaveRepository } from "../src/state/SaveRepository.js";
import { VisualRegistry } from "../src/visual/VisualRegistry.js";
import { KINDWORKS_VISUAL_MANIFEST, VISUAL_ASSET_IDS } from "../src/visual/visualManifest.js";
import { FISHING_LAYOUT_INSTANCE_IDS, FISHING_SCENE_LAYOUT } from "../src/visual/layouts/fishingSceneLayout.js";
import { moveSceneLayoutInstance } from "../src/visual/layouts/sceneLayoutContracts.js";
import { createVisualRegressionFixtureState } from "../src/qa/visualRegressionFixtures.js";
import { legacyFixtures, reconciliationV82 } from "./fixtures/legacy-saves.js";
import { MemoryStorage } from "./helpers/MemoryStorage.js";

const NOW = Date.UTC(2026, 7, 30, 12, 0, 0);
const digest = (value) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const clone = (value) => structuredClone(value);

const protectedDomains = [
  "source", "identity", "world", "player", "progress", "economy", "inventory", "townPlacement",
  "npcs", "municipalCollection", "restorationMilestones", "onboarding", "commerce", "customResident",
  "homeInteriors", "farming", "environment", "animals", "fishing", "bakery", "cafe", "river",
  "houseRescue", "lawnCare", "beachCleanup", "playgroundPowerwash", "morningMug", "riversideKitchen",
  "southShoreScoops", "homeownerGifts", "harbourGeneral", "legacyReconciliation", "legacySnapshot",
];

function gameplayProjection(state) {
  return Object.fromEntries(protectedDomains.map((domain) => [domain, clone(state[domain])]));
}

function importLegacy(value) {
  const storage = new MemoryStorage({ [LEGACY_SAVE_KEY]: JSON.stringify(value) });
  const importer = new LegacySaveImporter(storage);
  const inspection = importer.inspect();
  assert.equal(inspection.ok, true);
  return { storage, state: importer.createImportedState(inspection.selected, { now: NOW }) };
}

function scanVisualImplementationDetails(value) {
  const findings = [];
  const implementationKeys = /^(?:textureKey|atlasKey|audioKey|frameName|animationKey|spriteKey|assetPath|filePath|filename|displayWidth|displayHeight|canvasWidth|canvasHeight|originX|originY|visualOffset|prefabId|layoutId)$/i;
  const rawAssetValue = /(?:^|\/)assets\/|\.(?:png|webp|jpe?g|gif|svg|atlas)(?:\?|$)/i;
  const visit = (entry, path = "") => {
    if (typeof entry === "string" && rawAssetValue.test(entry)) findings.push({ path, kind: "raw-asset-value", value: entry });
    if (!entry || typeof entry !== "object") return;
    for (const [key, child] of Object.entries(entry)) {
      const childPath = path ? `${path}.${key}` : key;
      if (implementationKeys.test(key)) findings.push({ path: childPath, kind: "implementation-key" });
      visit(child, childPath);
    }
  };
  visit(value);
  return findings;
}

function fakePhaserScene(sceneKey = "FishingScene") {
  const textureKeys = new Set();
  const handlers = new Map();
  return {
    scene: { key: sceneKey },
    textures: {
      exists: (key) => textureKeys.has(key),
      createCanvas(key) {
        textureKeys.add(key);
        return {
          context: {
            fillStyle: "", strokeStyle: "", lineWidth: 0,
            fillRect() {}, clearRect() {}, beginPath() {}, moveTo() {}, lineTo() {}, stroke() {},
          },
          refresh() {},
        };
      },
      remove: (key) => textureKeys.delete(key),
    },
    cache: { audio: { exists: () => false, remove() {} } },
    load: {
      image() {}, spritesheet() {}, atlas() {}, audio() {},
      on(event, handler) { handlers.set(event, handler); },
      off(event) { handlers.delete(event); },
    },
    events: { once() {} },
    emitLoadError(key) { handlers.get("loaderror")?.({ key }); },
    hasTexture: (key) => textureKeys.has(key),
  };
}

test("fresh and representative migrated saves contain no artwork implementation details", () => {
  const fresh = createVisualRegressionFixtureState();
  const imported = importLegacy(reconciliationV82).state;
  assert.deepEqual(scanVisualImplementationDetails(fresh), []);
  assert.deepEqual(scanVisualImplementationDetails(imported), []);
});

test("older save gameplay domains survive artwork substitution, layout change, restart and reload exactly", () => {
  const { storage, state: imported } = importLegacy(reconciliationV82);
  const repository = new SaveRepository(storage);
  assert.equal(repository.save(imported, { now: NOW }).ok, true);
  const before = gameplayProjection(repository.load().state);
  const beforeDigest = digest(before);

  const replacementManifest = clone(KINDWORKS_VISUAL_MANIFEST);
  const replacement = replacementManifest.assets.find(({ id }) => id === VISUAL_ASSET_IDS.FISHING_REEDBANK_BACKGROUND);
  replacement.source.file = "/assets/powerwash/tool-precision.png";
  replacement.source.format = "png";
  replacement.technical.width = 80;
  replacement.technical.height = 101;
  replacement.cache.version = "save-safety-replacement";
  replacement.cache.contentSha256 = "a".repeat(64);
  const registry = new VisualRegistry({ manifest: replacementManifest, reporter: { error() {} } });
  assert.equal(registry.getTextureKey(VISUAL_ASSET_IDS.FISHING_REEDBANK_BACKGROUND), "kw.asset.scene.fishing.reedbank.background");

  const moved = moveSceneLayoutInstance(FISHING_SCENE_LAYOUT, FISHING_LAYOUT_INSTANCE_IDS.BACKGROUND, { x: 648, y: 368 });
  assert.equal(moved.ok, true);
  assert.deepEqual(FISHING_SCENE_LAYOUT.instances.find(({ id }) => id === FISHING_LAYOUT_INSTANCE_IDS.BACKGROUND).visual.position, { x: 640, y: 360 });

  const restartedRepository = new SaveRepository(storage);
  const after = gameplayProjection(restartedRepository.load().state);
  assert.equal(digest(after), beforeDigest);
  assert.deepEqual(after, before);
});

test("missing optional or required Phaser artwork records a fallback without writing save data", () => {
  const storage = new MemoryStorage();
  const repository = new SaveRepository(storage);
  const state = createVisualRegressionFixtureState();
  assert.equal(repository.save(state, { now: NOW }).ok, true);
  const rawBefore = storage.getItem("kindworks_phaser_v1");

  const optionalRegistry = new VisualRegistry({ environment: "production", reporter: { error() {} } });
  const optionalScene = fakePhaserScene("TownScene");
  assert.equal(optionalRegistry.queuePhaserAsset(optionalScene, "missing.optional.asset"), "kw.fallback.production");
  assert.equal(optionalRegistry.getFailures()[0].code, "unknown-asset");
  assert.equal(storage.getItem("kindworks_phaser_v1"), rawBefore);

  const requiredRegistry = new VisualRegistry({ environment: "production", reporter: { error() {} } });
  const requiredScene = fakePhaserScene("FishingScene");
  const key = requiredRegistry.queuePhaserAsset(requiredScene, VISUAL_ASSET_IDS.FISHING_REEDBANK_BACKGROUND);
  requiredScene.emitLoadError(key);
  assert.equal(requiredRegistry.getFailures().some(({ code }) => code === "runtime-load-failed"), true);
  assert.equal(requiredScene.hasTexture(key), true, "required visual falls back under its stable texture key");
  assert.equal(storage.getItem("kindworks_phaser_v1"), rawBefore);
  assert.equal(digest(gameplayProjection(repository.load().state)), digest(gameplayProjection(state)));
});

test("missing gameplay-critical native artwork fails closed without overwriting the verified save", async () => {
  const storage = new MemoryStorage();
  const repository = new SaveRepository(storage);
  const state = createVisualRegressionFixtureState();
  assert.equal(repository.save(state, { now: NOW }).ok, true);
  const rawBefore = storage.getItem("kindworks_phaser_v1");

  class FailingImage {
    addEventListener(type, callback) { this[type] = callback; }
    set src(_value) { queueMicrotask(() => this.error()); }
  }
  const criticalOnlyManifest = clone(KINDWORKS_VISUAL_MANIFEST);
  const powerwashPack = criticalOnlyManifest.scenePacks.find(({ sceneId }) => sceneId === "PlaygroundPowerwashScene");
  powerwashPack.assetIds = [VISUAL_ASSET_IDS.POWERWASH_PLAYGROUND_DIRT];
  const registry = new VisualRegistry({ manifest: criticalOnlyManifest, environment: "production", reporter: { error() {} } });
  await assert.rejects(
    () => registry.loadNativeScenePacks("PlaygroundPowerwashScene", { ImageCtor: FailingImage }),
    /failed to load/,
  );
  assert.equal(registry.getFailures().some(({ code, requiredness }) => code === "runtime-native-load-failed" && requiredness === "gameplay-critical"), true);
  assert.equal(storage.getItem("kindworks_phaser_v1"), rawBefore);
  assert.equal(digest(gameplayProjection(repository.load().state)), digest(gameplayProjection(state)));
});

test("current progressed save is identical after manifest/layout resolution and repository restart", () => {
  const state = createVisualRegressionFixtureState();
  const storage = new MemoryStorage();
  const repository = new SaveRepository(storage);
  assert.equal(repository.save(state, { now: NOW }).ok, true);
  const before = gameplayProjection(repository.load().state);
  const registry = new VisualRegistry({ reporter: { error() {} } });
  registry.getAsset(VISUAL_ASSET_IDS.FISHING_REEDBANK_BACKGROUND);
  moveSceneLayoutInstance(FISHING_SCENE_LAYOUT, FISHING_LAYOUT_INSTANCE_IDS.BACKGROUND, { x: 656, y: 360 });
  const after = gameplayProjection(new SaveRepository(storage).load().state);
  assert.deepEqual(after, before);
});

test("representative v82 fixture preserves important progression state across import and reload", () => {
  const { storage, state } = importLegacy(legacyFixtures.currentV82);
  const repository = new SaveRepository(storage);
  assert.equal(repository.save(state, { now: NOW }).ok, true);
  const reloaded = repository.load().state;
  assert.equal(reloaded.identity.townName, "Test Willow");
  assert.equal(reloaded.world.day, 42);
  assert.equal(reloaded.world.clockMinutes, 905);
  assert.equal(reloaded.progress.completedJobCount, 71);
  assert.equal(reloaded.economy.coins, 24_800);
  assert.equal(reloaded.southShoreScoops.unlockedLevel, 12);
  assert.deepEqual(reloaded.legacySnapshot, legacyFixtures.currentV82);
});
