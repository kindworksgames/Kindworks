import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";

import { LEGACY_SAVE_KEY, PHASER_SAVE_KEY } from "../src/state/constants.js";
import { createFreshGameState, validateGameState } from "../src/state/GameState.js";
import { LegacySaveImporter } from "../src/state/LegacySaveImporter.js";
import { SaveRepository } from "../src/state/SaveRepository.js";
import { createVisualRegressionFixtureState } from "../src/qa/visualRegressionFixtures.js";
import { VisualRegistry } from "../src/visual/VisualRegistry.js";
import { KINDWORKS_VISUAL_MANIFEST, VISUAL_ASSET_IDS } from "../src/visual/visualManifest.js";
import { FISHING_LAYOUT_INSTANCE_IDS, FISHING_SCENE_LAYOUT } from "../src/visual/layouts/fishingSceneLayout.js";
import { moveSceneLayoutInstance } from "../src/visual/layouts/sceneLayoutContracts.js";
import { legacyFixtures } from "./fixtures/legacy-saves.js";
import { MemoryStorage } from "./helpers/MemoryStorage.js";

const NOW = Date.UTC(2026, 7, 30, 18, 0, 0);
const clone = (value) => structuredClone(value);
const digest = (value) => createHash("sha256").update(JSON.stringify(value)).digest("hex");

function importLegacy(source) {
  const raw = JSON.stringify(source);
  const storage = new MemoryStorage({ [LEGACY_SAVE_KEY]: raw });
  const importer = new LegacySaveImporter(storage);
  const inspection = importer.inspect();
  assert.equal(inspection.ok, true);
  const state = importer.createImportedState(inspection.selected, { now: NOW });
  assert.equal(validateGameState(state).ok, true);
  return { raw, storage, state };
}

function fakeScene(sceneId) {
  const textures = new Set();
  const listeners = new Map();
  return {
    scene: { key: sceneId },
    textures: {
      exists: (key) => textures.has(key),
      createCanvas(key) {
        textures.add(key);
        return {
          context: {
            fillStyle: "", strokeStyle: "", lineWidth: 0,
            fillRect() {}, beginPath() {}, moveTo() {}, lineTo() {}, stroke() {},
          },
          refresh() {},
        };
      },
      remove: (key) => textures.delete(key),
    },
    cache: { audio: { exists: () => false, remove() {} } },
    load: {
      image() {}, spritesheet() {}, atlas() {}, audio() {},
      on(type, handler) { listeners.set(type, handler); },
      off(type) { listeners.delete(type); },
    },
    events: { once() {} },
    fail(key) { listeners.get("loaderror")?.({ key }); },
    hasTexture: (key) => textures.has(key),
  };
}

function exerciseVisualReplacementWithoutSaveAccess() {
  const manifest = clone(KINDWORKS_VISUAL_MANIFEST);
  const replacement = manifest.assets.find(({ id }) => id === VISUAL_ASSET_IDS.FISHING_REEDBANK_BACKGROUND);
  replacement.source.file = "/assets/powerwash/tool-wide.png";
  replacement.source.format = "png";
  replacement.technical.width = 84;
  replacement.technical.height = 102;
  replacement.technical.origin = { x: 0.17, y: 0.91 };
  replacement.cache.version = "independent-stage-8-replacement";
  replacement.cache.contentSha256 = "8".repeat(64);
  const registry = new VisualRegistry({ manifest, environment: "production", reporter: { error() {} } });
  assert.equal(registry.getTextureKey(VISUAL_ASSET_IDS.FISHING_REEDBANK_BACKGROUND), "kw.asset.scene.fishing.reedbank.background");

  const moved = moveSceneLayoutInstance(FISHING_SCENE_LAYOUT, FISHING_LAYOUT_INSTANCE_IDS.BACKGROUND, { x: 672, y: 384 });
  assert.equal(moved.ok, true);
  assert.notDeepEqual(moved.layout.instances.find(({ id }) => id === FISHING_LAYOUT_INSTANCE_IDS.BACKGROUND).visual.position, FISHING_SCENE_LAYOUT.instances.find(({ id }) => id === FISHING_LAYOUT_INSTANCE_IDS.BACKGROUND).visual.position);
}

function assertRoundTripUnaffected(label, state, storage = new MemoryStorage()) {
  const repository = new SaveRepository(storage);
  assert.equal(repository.save(state, { now: NOW }).ok, true, `${label}: initial save`);
  const rawBefore = storage.getItem(PHASER_SAVE_KEY);
  const stateBefore = repository.load().state;
  const beforeDigest = digest(stateBefore);

  exerciseVisualReplacementWithoutSaveAccess();

  assert.equal(storage.getItem(PHASER_SAVE_KEY), rawBefore, `${label}: visual work cannot write storage`);
  const reloaded = new SaveRepository(storage).load();
  assert.equal(reloaded.ok, true, `${label}: reload`);
  assert.equal(digest(reloaded.state), beforeDigest, `${label}: state digest`);
  assert.deepEqual(reloaded.state, stateBefore, `${label}: exact state`);
}

test("independent Stage 8 matrix preserves fresh, mid-progress and completed saves across visual replacement", () => {
  const fresh = createFreshGameState({ now: NOW });
  const mid = createVisualRegressionFixtureState();
  const completed = importLegacy(legacyFixtures.completedV82);

  assertRoundTripUnaffected("fresh", fresh);
  assertRoundTripUnaffected("mid-progress", mid);
  assertRoundTripUnaffected("completed-v82", completed.state, completed.storage);
  assert.equal(completed.storage.getItem(LEGACY_SAVE_KEY), completed.raw, "completed legacy source stays byte-identical");
});

test("independent Stage 8 matrix keeps representative older saves compatible", () => {
  for (const fixtureName of ["newPlayerV12", "midV38", "farmingV60", "lateV75", "currentV82"]) {
    const imported = importLegacy(legacyFixtures[fixtureName]);
    assertRoundTripUnaffected(fixtureName, imported.state, imported.storage);
    assert.equal(imported.storage.getItem(LEGACY_SAVE_KEY), imported.raw, `${fixtureName}: source retained`);
  }
});

test("independent Stage 8 asset failures cannot reset, duplicate, corrupt or alter a healthy save", async () => {
  const storage = new MemoryStorage();
  const repository = new SaveRepository(storage);
  const state = createVisualRegressionFixtureState();
  assert.equal(repository.save(state, { now: NOW }).ok, true);
  const rawBefore = storage.getItem(PHASER_SAVE_KEY);
  const stateBefore = repository.load().state;

  const optionalRegistry = new VisualRegistry({ environment: "production", reporter: { error() {} } });
  const optionalScene = fakeScene("TownScene");
  optionalRegistry.queuePhaserAsset(optionalScene, "optional.asset.deliberately.missing");
  assert.equal(optionalRegistry.getFailures().at(-1).code, "unknown-asset");

  const requiredRegistry = new VisualRegistry({ environment: "production", reporter: { error() {} } });
  const requiredScene = fakeScene("FishingScene");
  const requiredKey = requiredRegistry.queuePhaserAsset(requiredScene, VISUAL_ASSET_IDS.FISHING_REEDBANK_BACKGROUND);
  requiredScene.fail(requiredKey);
  assert.equal(requiredRegistry.getFailures().some(({ code }) => code === "runtime-load-failed"), true);
  assert.equal(requiredScene.hasTexture(requiredKey), true, "stable-key fallback is present");

  class FailingImage {
    addEventListener(type, handler) { this[type] = handler; }
    set src(_value) { queueMicrotask(() => this.error()); }
  }
  const criticalManifest = clone(KINDWORKS_VISUAL_MANIFEST);
  criticalManifest.scenePacks.find(({ sceneId }) => sceneId === "PlaygroundPowerwashScene").assetIds = [VISUAL_ASSET_IDS.POWERWASH_PLAYGROUND_DIRT];
  const criticalRegistry = new VisualRegistry({ manifest: criticalManifest, environment: "production", reporter: { error() {} } });
  await assert.rejects(() => criticalRegistry.loadNativeScenePacks("PlaygroundPowerwashScene", { ImageCtor: FailingImage }), (error) => error.gameplayCritical === true);

  assert.equal(storage.getItem(PHASER_SAVE_KEY), rawBefore, "all asset failures leave raw save untouched");
  const after = new SaveRepository(storage).load();
  assert.equal(after.ok, true);
  assert.deepEqual(after.state, stateBefore);
  assert.equal(after.state.economy.coins, stateBefore.economy.coins);
  assert.equal(after.state.economy.ledger.length, stateBefore.economy.ledger.length);
  assert.deepEqual(after.state.inventory, stateBefore.inventory);
  assert.deepEqual(after.state.progress, stateBefore.progress);
});

test("independent Stage 8 completed content cannot receive duplicate rewards after visual-only work", () => {
  const imported = importLegacy(legacyFixtures.completedV82);
  const repository = new SaveRepository(imported.storage);
  assert.equal(repository.save(imported.state, { now: NOW }).ok, true);
  const before = repository.load().state;
  const protectedOutcome = {
    coins: before.economy.coins,
    ledger: clone(before.economy.ledger),
    completedJobs: before.progress.completedJobCount,
    cleanup: clone(before.progress.cleanup),
    lawn: clone(before.lawnCare.progress),
    river: clone(before.river),
    house: clone(before.houseRescue),
    beach: clone(before.beachCleanup.progress),
    powerwash: clone(before.playgroundPowerwash.progress),
    bakery: clone(before.bakery),
    cafe: clone(before.cafe),
    morningMug: clone(before.morningMug),
    riversideKitchen: clone(before.riversideKitchen),
    scoops: clone(before.southShoreScoops),
  };

  exerciseVisualReplacementWithoutSaveAccess();
  const after = new SaveRepository(imported.storage).load().state;
  assert.deepEqual({
    coins: after.economy.coins,
    ledger: after.economy.ledger,
    completedJobs: after.progress.completedJobCount,
    cleanup: after.progress.cleanup,
    lawn: after.lawnCare.progress,
    river: after.river,
    house: after.houseRescue,
    beach: after.beachCleanup.progress,
    powerwash: after.playgroundPowerwash.progress,
    bakery: after.bakery,
    cafe: after.cafe,
    morningMug: after.morningMug,
    riversideKitchen: after.riversideKitchen,
    scoops: after.southShoreScoops,
  }, protectedOutcome);
});
