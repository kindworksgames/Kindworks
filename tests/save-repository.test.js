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
import { MemoryStorage } from "./helpers/MemoryStorage.js";

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

test("backs up the last valid save before replacing it", () => {
  const storage = new MemoryStorage();
  const repository = new SaveRepository(storage);
  const first = createFreshGameState({ now: 0 });
  repository.save(first, { now: 1000 });
  const firstRaw = storage.getItem(PHASER_SAVE_KEY);
  const second = structuredClone(first);
  second.world.day = 2;
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
