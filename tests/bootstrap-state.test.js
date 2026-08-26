import test from "node:test";
import assert from "node:assert/strict";
import {
  LEGACY_SAVE_KEY,
  PHASER_BACKUP_KEY,
  PHASER_SAVE_KEY,
} from "../src/state/constants.js";
import { createFreshGameState } from "../src/state/GameState.js";
import { checksumValue } from "../src/state/checksum.js";
import { bootstrapState } from "../src/state/bootstrapState.js";
import { MemoryStorage } from "./helpers/MemoryStorage.js";

test("atomically upgrades a Milestone 3 save while preserving its envelope as backup", () => {
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
  const oldRaw = JSON.stringify({ ...body, checksum: checksumValue(body) });
  const legacyRaw = JSON.stringify({ version: 82, marker: "untouched" });
  const storage = new MemoryStorage({ [PHASER_SAVE_KEY]: oldRaw, [LEGACY_SAVE_KEY]: legacyRaw });
  const runtime = bootstrapState(storage, { now: 2000 });
  assert.equal(runtime.loaded.migrated, true);
  assert.equal(runtime.gameState.getSnapshot().schemaVersion, 29);
  assert.equal(JSON.parse(storage.getItem(PHASER_SAVE_KEY)).schemaVersion, 29);
  assert.equal(storage.getItem(PHASER_BACKUP_KEY), oldRaw);
  assert.equal(storage.getItem(LEGACY_SAVE_KEY), legacyRaw);
});
