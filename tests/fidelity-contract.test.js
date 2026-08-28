import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { createFreshGameState } from "../src/state/GameState.js";
import {
  FIDELITY_ACTIVITIES,
  FIDELITY_SOURCE_SHA256,
  FIDELITY_VIEWPORTS,
  createFidelityStorage,
  getFidelityContract,
  prepareFidelityLevel,
} from "../src/qa/fidelityContract.js";
import { MemoryStorage } from "./helpers/MemoryStorage.js";

test("Phase 3 pins the immutable legacy source and complete viewport matrix", () => {
  const contract = getFidelityContract();
  assert.equal(contract.source.sha256, FIDELITY_SOURCE_SHA256);
  assert.equal(contract.source.immutable, true);
  assert.deepEqual(FIDELITY_VIEWPORTS.map(({ width, height }) => `${width}x${height}`), [
    "568x320", "667x375", "736x414", "812x375", "844x390", "1024x768", "1180x820", "1280x720", "1366x768", "390x844",
  ]);
  assert.equal(contract.acceptance.productionSaveMutationAllowed, false);
});

test("Phase 3 requires observable evidence for every migrated activity", () => {
  assert.equal(FIDELITY_ACTIVITIES.length, 17);
  for (const activity of FIDELITY_ACTIVITIES) {
    assert.ok(activity.legacyAnchors.length >= 2);
    assert.ok(activity.phaserOwners.length >= 2);
    assert.ok(activity.checkpoints.includes("initial-play-state"));
    assert.ok(activity.checkpoints.includes("success-and-reward"));
    assert.ok(activity.checkpoints.includes("reload-resume"));
  }
});

test("fidelity storage is isolated from production and legacy keys", () => {
  const storage = new MemoryStorage({ production: "keep", kindworks_living_town_v38: "legacy-keep" });
  const fidelity = createFidelityStorage(storage);
  fidelity.setItem("current", "qa-save");
  assert.equal(fidelity.getItem("current"), "qa-save");
  assert.equal(storage.getItem("production"), "keep");
  assert.equal(storage.getItem("kindworks_living_town_v38"), "legacy-keep");
  fidelity.clear();
  assert.equal(fidelity.getItem("current"), null);
  assert.equal(storage.getItem("production"), "keep");
  assert.equal(storage.getItem("kindworks_living_town_v38"), "legacy-keep");
});

test("the QA level selector prepares boundary levels without granting clears or rewards", () => {
  const fresh = createFreshGameState();
  const prepared = prepareFidelityLevel(fresh, "scoops", 750);
  assert.equal(prepared.southShoreScoops.unlockedLevel, 750);
  assert.equal(prepared.southShoreScoops.selectedLevel, 750);
  assert.deepEqual(prepared.southShoreScoops.completed, {});
  assert.equal(prepared.economy.coins, fresh.economy.coins);
  assert.deepEqual(prepared.economy.ledger, fresh.economy.ledger);
  assert.equal(fresh.southShoreScoops.unlockedLevel, 1);
});

test("the fidelity route provides browser-operable isolated activity controls", async () => {
  const [main, harness] = await Promise.all([
    readFile(new URL("../src/main.js", import.meta.url), "utf8"),
    readFile(new URL("../src/qa/FidelityQaHarness.js", import.meta.url), "utf8"),
  ]);
  assert.match(main, /if \(fidelityHarness\) \{[\s\S]*?fidelityHarness\.mountPanel\(\)/);
  assert.match(harness, /id = "fidelity-qa-panel"/);
  assert.match(harness, /id = "fidelity-qa-activity"/);
  assert.match(harness, /id = "fidelity-qa-level"/);
  assert.match(harness, /id = "fidelity-qa-open"/);
  assert.match(harness, /await this\.openActivity\(activity\.value, Number\(level\.value\) \|\| 1\)/);
});
