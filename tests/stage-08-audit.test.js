import test from "node:test";
import assert from "node:assert/strict";
import {
  GAME_STATE_SCHEMA_VERSION,
  LEGACY_SAVE_KEY,
  PHASER_BACKUP_KEY,
  PHASER_RECOVERY_KEY,
  PHASER_SAVE_FORMAT,
  PHASER_SAVE_KEY,
  SUPPORTED_GAME_STATE_SCHEMA_VERSIONS,
} from "../src/state/constants.js";
import { checksumValue } from "../src/state/checksum.js";
import { bootstrapState } from "../src/state/bootstrapState.js";
import { createFreshGameState, GameStateService, validateGameState } from "../src/state/GameState.js";
import { LegacySaveImporter } from "../src/state/LegacySaveImporter.js";
import { SaveRepository } from "../src/state/SaveRepository.js";
import { SaveStatusController } from "../src/ui/SaveStatusController.js";
import { legacyFixtures, legacyVersionFixtures } from "./fixtures/legacy-saves.js";
import { MemoryStorage } from "./helpers/MemoryStorage.js";

const NOW = Date.UTC(2026, 7, 29, 12, 0, 0);

function envelopeFor(data, schemaVersion = data.schemaVersion, now = NOW) {
  const body = {
    format: PHASER_SAVE_FORMAT,
    schemaVersion,
    writtenAt: new Date(now).toISOString(),
    appVersion: "0.1.0-stage-08-audit",
    data: structuredClone(data),
  };
  return JSON.stringify({ ...body, checksum: checksumValue(body) });
}

test("Stage 8 data-validates every supported Phaser schema and every legacy HTML version", () => {
  assert.deepEqual(SUPPORTED_GAME_STATE_SCHEMA_VERSIONS, Array.from({ length: GAME_STATE_SCHEMA_VERSION }, (_, index) => index + 1));

  for (const schemaVersion of SUPPORTED_GAME_STATE_SCHEMA_VERSIONS) {
    const state = createFreshGameState({ now: NOW });
    state.schemaVersion = schemaVersion;
    state.identity.townName = `Schema ${schemaVersion}`;
    state.player.x = 1000 + schemaVersion;
    const storage = new MemoryStorage({ [PHASER_SAVE_KEY]: envelopeFor(state, schemaVersion) });
    const loaded = new SaveRepository(storage).load();
    assert.equal(loaded.ok, true, `Phaser schema ${schemaVersion}`);
    assert.equal(loaded.state.schemaVersion, GAME_STATE_SCHEMA_VERSION, `Phaser schema ${schemaVersion} upgrades`);
    assert.equal(loaded.state.identity.townName, `Schema ${schemaVersion}`, `Phaser schema ${schemaVersion} preserves identity`);
    assert.equal(loaded.state.player.x, 1000 + schemaVersion, `Phaser schema ${schemaVersion} preserves position`);
  }

  assert.equal(legacyVersionFixtures.length, 71);
  for (const fixture of legacyVersionFixtures) {
    const legacyRaw = JSON.stringify(fixture);
    const storage = new MemoryStorage({ [LEGACY_SAVE_KEY]: legacyRaw });
    const importer = new LegacySaveImporter(storage);
    const inspection = importer.inspect();
    assert.equal(inspection.ok, true, `legacy v${fixture.version} inspection`);
    const imported = importer.createImportedState(inspection.selected, { now: NOW });
    assert.equal(validateGameState(imported).ok, true, `legacy v${fixture.version} imported state`);
    const repository = new SaveRepository(storage);
    assert.equal(repository.save(imported, { now: NOW }).ok, true, `legacy v${fixture.version} save`);
    assert.equal(repository.load().ok, true, `legacy v${fixture.version} reload`);
    assert.equal(storage.getItem(LEGACY_SAVE_KEY), legacyRaw, `legacy v${fixture.version} source remains untouched`);
  }
});

test("Stage 8 preserves a dense maximum-progression legacy fixture across import, save and reload", () => {
  const legacyRaw = JSON.stringify(legacyFixtures.completedV82);
  const storage = new MemoryStorage({ [LEGACY_SAVE_KEY]: legacyRaw });
  const importer = new LegacySaveImporter(storage);
  const inspection = importer.inspect();
  assert.equal(inspection.ok, true);
  const imported = importer.createImportedState(inspection.selected, { now: NOW });
  assert.equal(validateGameState(imported).ok, true);
  const repository = new SaveRepository(storage);
  assert.equal(repository.save(imported, { now: NOW }).ok, true);
  const reloaded = repository.load();
  assert.equal(reloaded.ok, true);
  assert.equal(reloaded.state.identity.townName, "QA Completion");
  assert.equal(reloaded.state.economy.coins, 999999);
  assert.equal(reloaded.state.progress.completedJobCount, 1500);
  assert.equal(storage.getItem(LEGACY_SAVE_KEY), legacyRaw);
});

test("Stage 8 recovers a corrupt current save from the last verified backup without duplication", () => {
  const storage = new MemoryStorage();
  const repository = new SaveRepository(storage);
  const first = createFreshGameState({ now: NOW });
  first.economy.coins = 777;
  first.economy.lifetimeCoinsEarned = 777;
  first.inventory.consumables["orchard-apple"] = 3;
  assert.equal(repository.save(first, { now: NOW }).ok, true);

  const second = structuredClone(first);
  second.economy.coins = 888;
  second.economy.lifetimeCoinsEarned = 888;
  second.inventory.consumables["orchard-apple"] = 4;
  second.updatedAt = new Date(NOW + 1).toISOString();
  assert.equal(repository.save(second, { now: NOW + 1 }).ok, true);
  assert.ok(storage.getItem(PHASER_BACKUP_KEY));
  storage.setItem(PHASER_SAVE_KEY, "{corrupt");

  const recovered = bootstrapState(storage, { now: NOW + 2 });
  assert.equal(recovered.loaded.ok, true);
  assert.equal(recovered.loaded.recovered, true);
  assert.equal(recovered.gameState.getSnapshot().economy.coins, 777);
  assert.equal(recovered.gameState.getSnapshot().inventory.consumables["orchard-apple"], 3);
  assert.ok(storage.getItem(PHASER_RECOVERY_KEY));
});

test("Stage 8 repair S8-REC-001: a missing defaultable current field is normalized without losing progress", () => {
  const progressed = createFreshGameState({ now: NOW });
  progressed.identity.townName = "Do Not Lose Me";
  progressed.economy.coins = 54321;
  progressed.economy.lifetimeCoinsEarned = 54321;
  progressed.inventory.consumables["orchard-apple"] = 9;
  delete progressed.world.weather.history;

  const storage = new MemoryStorage({ [PHASER_SAVE_KEY]: envelopeFor(progressed) });
  const runtime = bootstrapState(storage, { now: NOW + 1 });

  assert.equal(runtime.loaded.ok, true);
  assert.equal(runtime.loaded.needsMigration, true);
  assert.equal(runtime.loaded.migrated, true);
  assert.equal(runtime.gameState.getSnapshot().identity.townName, "Do Not Lose Me");
  assert.equal(runtime.gameState.getSnapshot().economy.coins, 54321);
  assert.equal(runtime.gameState.getSnapshot().inventory.consumables["orchard-apple"], 9);
  assert.ok(runtime.gameState.getSnapshot().world.weather.history.length >= 1);
  assert.equal(new SaveRepository(storage).load().ok, true);
});

test("Stage 8 repair S8-MIG-001: a failed legacy-import write keeps the existing live state", () => {
  const storage = new MemoryStorage({ [LEGACY_SAVE_KEY]: JSON.stringify(legacyFixtures.currentV82) });
  const importer = new LegacySaveImporter(storage);
  const inspection = importer.inspect();
  const gameState = new GameStateService(createFreshGameState({ now: NOW }));
  const controller = Object.create(SaveStatusController.prototype);
  controller.runtime = {
    legacyInspection: inspection,
    legacyImporter: importer,
    gameState,
    repository: { save: () => ({ ok: false, status: "write-failed", reason: "simulated storage failure" }) },
  };
  controller.title = { textContent: "" };
  controller.message = { textContent: "" };
  controller.details = { textContent: "" };

  const result = controller.createSafeSave();
  assert.equal(result.ok, false);
  assert.equal(controller.message.textContent, "Kindworks kept the existing data unchanged.");
  assert.equal(gameState.getSnapshot().source.kind, "new");
  assert.equal(gameState.getSnapshot().identity.townName, "Willowmere");
  assert.equal(new SaveRepository(storage).load().ok, false);
});
