import test from "node:test";
import assert from "node:assert/strict";
import {
  createFreshGameState,
  createGameStateFromLegacy,
  GameStateService,
  upgradeGameState,
  validateGameState,
} from "../src/state/GameState.js";
import { legacyFixtures } from "./fixtures/legacy-saves.js";

test("creates a valid deterministic fresh state", () => {
  const state = createFreshGameState({ now: 0 });
  assert.equal(validateGameState(state).ok, true);
  assert.equal(state.schemaVersion, 36);
  assert.equal(state.world.clockMinutes, 420);
  assert.equal(state.world.weather.current.day, 1);
  assert.equal(state.source.kind, "new");
  assert.equal(state.player.scene, "TownScene");
  assert.equal(state.legacySnapshot, null);
  assert.equal(state.economy.coins, 100);
  assert.deepEqual(state.inventory.equipment, { "starter-mower": 1, "starter-vacuum": 1 });
});

test("projects a legacy save without dropping its original snapshot", () => {
  const legacy = legacyFixtures.currentV82;
  const report = {
    ok: true,
    sourceKey: "kindworks_living_town_v38",
    warnings: [],
  };
  const state = createGameStateFromLegacy(legacy, report, { now: 1000 });
  assert.equal(validateGameState(state).ok, true);
  assert.equal(state.source.kind, "legacy-import");
  assert.equal(state.source.legacyVersion, 82);
  assert.equal(state.identity.townName, "Test Willow");
  assert.equal(state.world.day, 42);
  assert.equal(state.economy.coins, 24800);
  assert.equal(state.economy.lifetimeCoinsSpent, 9200);
  assert.equal(state.inventory.equipment["starter-mower"], 1);
  assert.deepEqual(state.legacySnapshot, legacy);
  assert.notEqual(state.legacySnapshot, legacy);
});

test("upgrades a Milestone 3 state without losing its existing fields", () => {
  const oldState = createFreshGameState({ now: 0 });
  delete oldState.economy;
  delete oldState.inventory;
  oldState.schemaVersion = 1;
  oldState.world.day = 9;
  const upgraded = upgradeGameState(oldState, { now: 1000 });
  assert.equal(upgraded.schemaVersion, 36);
  assert.equal(upgraded.world.day, 9);
  assert.equal(upgraded.economy.coins, 100);
  assert.equal(validateGameState(upgraded).ok, true);
});

test("projects known legacy inventory and retains unresolved records for later review", () => {
  const legacy = structuredClone(legacyFixtures.currentV82);
  legacy.economy.inventory.consumables["mixed-seeds"] = 7;
  legacy.economy.inventory.furniture["cosy-sofa"] = 2;
  legacy.economy.inventory.placeables["future-mystery-item"] = 4;
  const state = createGameStateFromLegacy(legacy, { ok: true, sourceKey: "legacy-test", warnings: [] }, { now: 1000 });
  assert.equal(state.inventory.consumables["mixed-seeds"], 7);
  assert.equal(state.inventory.furniture["cosy-sofa"], 2);
  assert.deepEqual(state.inventory.unresolvedLegacy, [{ id: "future-mystery-item", bucket: "placeables", quantity: 4 }]);
});

test("updates shared player state through one service", () => {
  const service = new GameStateService(createFreshGameState({ now: 0 }));
  const result = service.updatePlayer({ scene: "BakeryScene", x: 640, y: 610, facing: "up" }, { now: 5000 });
  assert.equal(result.ok, true);
  assert.deepEqual(service.getSnapshot().player, { scene: "BakeryScene", x: 640, y: 610, facing: "up" });
});

test("rejects malformed shared state", () => {
  const state = createFreshGameState();
  state.world.clockMinutes = 1440;
  state.player.facing = "sideways";
  const result = validateGameState(state);
  assert.equal(result.ok, false);
  assert.equal(result.errors.length, 2);
});
