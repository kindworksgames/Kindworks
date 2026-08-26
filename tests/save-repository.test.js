import test from "node:test";
import assert from "node:assert/strict";
import {
  LEGACY_SAVE_KEY,
  PHASER_BACKUP_KEY,
  PHASER_RECOVERY_KEY,
  PHASER_SAVE_KEY,
} from "../src/state/constants.js";
import { createFreshGameState } from "../src/state/GameState.js";
import { SaveRepository, validateSaveEnvelope } from "../src/state/SaveRepository.js";
import { checksumValue } from "../src/state/checksum.js";
import { MemoryStorage } from "./helpers/MemoryStorage.js";
import { advanceWorldState } from "../src/state/worldState.js";

test("writes and reloads a checksummed Phaser envelope", () => {
  const storage = new MemoryStorage();
  const repository = new SaveRepository(storage);
  const state = createFreshGameState({ now: 0 });
  const saved = repository.save(state, { now: 1000 });
  assert.equal(saved.ok, true);
  const envelope = JSON.parse(storage.getItem(PHASER_SAVE_KEY));
  assert.equal(validateSaveEnvelope(envelope).ok, true);
  assert.deepEqual(repository.load().state, state);
});

test("loads and upgrades a valid Milestone 3 schema-1 envelope", () => {
  const state = createFreshGameState({ now: 0 });
  delete state.economy;
  delete state.inventory;
  state.schemaVersion = 1;
  const body = {
    format: "kindworks-phaser",
    schemaVersion: 1,
    writtenAt: new Date(1000).toISOString(),
    appVersion: "0.1.0",
    data: state,
  };
  const storage = new MemoryStorage({ [PHASER_SAVE_KEY]: JSON.stringify({ ...body, checksum: checksumValue(body) }) });
  const loaded = new SaveRepository(storage).load();
  assert.equal(loaded.ok, true);
  assert.equal(loaded.needsMigration, true);
  assert.equal(loaded.state.schemaVersion, 35);
  assert.equal(loaded.state.economy.coins, 100);
});

test("backs up the last valid save before replacing it", () => {
  const storage = new MemoryStorage();
  const repository = new SaveRepository(storage);
  const first = createFreshGameState({ now: 0 });
  repository.save(first, { now: 1000 });
  const firstRaw = storage.getItem(PHASER_SAVE_KEY);
  const second = structuredClone(first);
  second.world = advanceWorldState(second.world, 1440, { now: 2000 }).world;
  second.updatedAt = new Date(2000).toISOString();
  repository.save(second, { now: 2000 });
  assert.equal(storage.getItem(PHASER_BACKUP_KEY), firstRaw);
  assert.equal(repository.load().state.world.day, 2);
});

test("recovers from backup and quarantines a corrupted current save", () => {
  const storage = new MemoryStorage();
  const repository = new SaveRepository(storage);
  const state = createFreshGameState({ now: 0 });
  repository.save(state, { now: 1000 });
  storage.setItem(PHASER_BACKUP_KEY, storage.getItem(PHASER_SAVE_KEY));
  storage.setItem(PHASER_SAVE_KEY, "{corrupt");
  const loaded = repository.load();
  assert.equal(loaded.ok, true);
  assert.equal(loaded.recovered, true);
  assert.equal(loaded.sourceKey, PHASER_BACKUP_KEY);
  assert.ok(storage.getItem(PHASER_RECOVERY_KEY));
});

test("refuses invalid state before touching storage", () => {
  const storage = new MemoryStorage();
  const repository = new SaveRepository(storage);
  const state = createFreshGameState();
  state.player.x = Number.NaN;
  const saved = repository.save(state);
  assert.equal(saved.ok, false);
  assert.equal(saved.status, "validation-failed");
  assert.equal(storage.writes.length, 0);
});

test("never writes to a legacy HTML save key", () => {
  const legacyRaw = JSON.stringify({ version: 82, marker: "untouched" });
  const storage = new MemoryStorage({ [LEGACY_SAVE_KEY]: legacyRaw });
  const repository = new SaveRepository(storage);
  repository.save(createFreshGameState(), { now: 1000 });
  assert.equal(storage.getItem(LEGACY_SAVE_KEY), legacyRaw);
  assert.equal(storage.writes.some(({ key }) => key.startsWith("kindworks_living_town")), false);
});
