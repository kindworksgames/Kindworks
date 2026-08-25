import test from "node:test";
import assert from "node:assert/strict";
import {
  createFreshGameState,
  createGameStateFromLegacy,
  GameStateService,
  validateGameState,
} from "../src/state/GameState.js";
import { legacyFixtures } from "./fixtures/legacy-saves.js";

test("creates a valid deterministic fresh state", () => {
  const state = createFreshGameState({ now: 0 });
  assert.equal(validateGameState(state).ok, true);
  assert.equal(state.schemaVersion, 1);
  assert.equal(state.source.kind, "new");
  assert.equal(state.player.scene, "TownScene");
  assert.equal(state.legacySnapshot, null);
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
  assert.deepEqual(state.legacySnapshot, legacy);
  assert.notEqual(state.legacySnapshot, legacy);
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
