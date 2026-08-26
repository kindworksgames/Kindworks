import test from "node:test";
import assert from "node:assert/strict";
import {
  LAWN_ENGINE_VERSION,
  LAWN_MOWER_PROFILES,
  LAWN_PAYLOAD_SHA256,
  LAWN_SOURCE_SHA256,
  LAWN_TOTAL_LEVELS,
  LawnCareEngine,
  getLawnLevel,
  lawnLevelSummary,
  validateLawnCatalogue,
  verifyLawnSolution,
} from "../src/data/lawnCare.js";
import { LAWN_CONFIG, LAWN_PLOTS } from "../src/data/farming.js";
import { createFreshGameState, GameStateService, upgradeGameState, validateGameState } from "../src/state/GameState.js";
import { projectLegacyLawnCare } from "../src/state/lawnCareState.js";
import { SaveRepository } from "../src/state/SaveRepository.js";
import { calculateLawnReward, LawnCareService } from "../src/systems/LawnCareService.js";
import { MemoryStorage } from "./helpers/MemoryStorage.js";

function runtime({ state = createFreshGameState({ now: 0 }), repository = new SaveRepository(new MemoryStorage()) } = {}) {
  const gameState = new GameStateService(state);
  const lawnCare = new LawnCareService(gameState, repository, { now: () => 1000 });
  return { gameState, lawnCare, repository };
}

test("pins all 750 protected Lawn Care levels and their stable provenance", () => {
  assert.equal(LAWN_ENGINE_VERSION, "11.0.0-pixel-garden-rebuild");
  assert.equal(LAWN_TOTAL_LEVELS, 750);
  assert.match(LAWN_SOURCE_SHA256, /^[a-f0-9]{64}$/);
  assert.match(LAWN_PAYLOAD_SHA256, /^[a-f0-9]{64}$/);
  assert.deepEqual(lawnLevelSummary(1), { level: 1, name: "Level 1", difficulty: "Medium", width: 7, height: 7, openCount: 14, optimalMoves: 9, moveLimit: 11, toughWeeds: 0, woodyWeeds: 0, checkpoint: true });
  assert.deepEqual(lawnLevelSummary(750), { level: 750, name: "Level 750", difficulty: "Expert", width: 11, height: 11, openCount: 48, optimalMoves: 25, moveLimit: 27, toughWeeds: 11, woodyWeeds: 7, checkpoint: true });
});

test("all original grids, families, weed bands and stored optimal routes validate", () => {
  const validation = validateLawnCatalogue({ verifySolutions: true });
  assert.equal(validation.ok, true, validation.issues.join("\n"));
  assert.equal(validation.levels, 750);
  assert.equal(validation.uniqueGrids, 750);
  assert.equal(validation.sourceIds, 750);
  assert.equal(validation.sourceFamilies, 750);
  assert.ok(validation.maxWeedComponent <= 6);
  assert.equal(verifyLawnSolution(1).ok, true);
  assert.equal(verifyLawnSolution(750).ok, true);
});

test("the mower slides to a hedge, cuts every crossed cell and keeps five undos", () => {
  const level = getLawnLevel(1);
  const engine = new LawnCareEngine(1);
  const firstDirection = level.canonicalSolution[0];
  const firstMove = level.moves.get(`${engine.row},${engine.col},${firstDirection}`);
  const moved = engine.move(firstDirection);
  assert.equal(moved.ok, true);
  assert.deepEqual([engine.row, engine.col], [firstMove.row, firstMove.col]);
  assert.deepEqual(moved.crossed, firstMove.crossed.map(([row, col]) => `${row},${col}`));
  for (const direction of level.canonicalSolution.slice(1, 6)) assert.equal(engine.move(direction).ok, true);
  assert.equal(engine.snapshot().undoStack.length, 5);
  for (let count = 0; count < 5; count += 1) assert.equal(engine.undo().ok, true);
  assert.equal(engine.undo().code, "nothing-to-undo");
});

test("move limits, star thresholds and mower upgrades preserve the original rules", () => {
  assert.deepEqual([new LawnCareEngine(1).moveLimit, new LawnCareEngine(750).moveLimit], [11, 27]);
  assert.equal(calculateLawnReward(49, 750), 0);
  assert.equal(calculateLawnReward(50, 1), 50);
  assert.equal(calculateLawnReward(100, 1), 100);
  assert.equal(calculateLawnReward(100, 750), 170);
  assert.ok(LAWN_MOWER_PROFILES["vintage-special-mower"].woody < LAWN_MOWER_PROFILES["starter-mower"].woody);
  for (const mower of Object.values(LAWN_MOWER_PROFILES)) {
    assert.equal(Object.hasOwn(mower, "moveLimit"), false);
    assert.equal(Object.hasOwn(mower, "fuel"), false);
  }
});

test("an exact Level 750 completion pays 170 first-clear coins once", () => {
  const { gameState, lawnCare } = runtime();
  const first = lawnCare.beginCampaign(750);
  const cleared = lawnCare.completeCertified(first.session.id);
  assert.equal(cleared.ok, true);
  assert.deepEqual(cleared.result, { level: 750, percent: 100, stars: 3, moves: 25, moveLimit: 27, optimalMoves: 25, rewardCoins: 170, firstClear: true });
  assert.equal(gameState.getSnapshot().economy.coins, 270);
  assert.equal(gameState.getSnapshot().economy.ledger.at(-1).kind, "campaign-first-clear");
  assert.deepEqual(lawnCare.getCampaignSnapshot().best["750"], { stars: 3, percent: 100 });
  const replay = lawnCare.beginCampaign(750);
  const replayed = lawnCare.completeCertified(replay.session.id);
  assert.equal(replayed.result.firstClear, false);
  assert.equal(replayed.result.rewardCoins, 0);
  assert.equal(gameState.getSnapshot().economy.coins, 270);
});

test("town jobs apply the exact proportional lawn effect and pay each new occurrence", () => {
  const { gameState, lawnCare } = runtime();
  const plot = LAWN_PLOTS[0];
  const initial = gameState.getSnapshot().farming.lawns[plot.id];
  assert.deepEqual([initial.grassHeight, initial.weedPressure], [82, 48]);
  const first = lawnCare.beginTownJob(plot.id, { returnPosition: { x: 305, y: 530 }, returnFacing: "left" });
  const cleared = lawnCare.completeCertified(first.session.id);
  assert.equal(cleared.rewardCoins, 100);
  assert.deepEqual(cleared.townEffect, { lawnId: plot.id, grassHeight: LAWN_CONFIG.freshlyCutHeight, weedPressure: LAWN_CONFIG.freshlyWeededPressure });
  assert.equal(gameState.getSnapshot().farming.lawns[plot.id].completedJobs, 1);
  assert.equal(gameState.getSnapshot().progress.completedJobCount, 1);
  const regrown = gameState.getSnapshot();
  regrown.farming.lawns[plot.id].grassHeight = 92;
  regrown.farming.lawns[plot.id].weedPressure = 58;
  assert.equal(gameState.replace(regrown).ok, true);
  const second = lawnCare.beginTownJob(plot.id);
  assert.equal(lawnCare.completeCertified(second.session.id).rewardCoins, 100);
  assert.equal(gameState.getSnapshot().economy.coins, 300);
  assert.equal(gameState.getSnapshot().farming.lawns[plot.id].completedJobs, 2);
});

test("an in-progress campaign reloads its board, undo stack and town return point", () => {
  const storage = new MemoryStorage();
  const repository = new SaveRepository(storage);
  const first = runtime({ repository });
  const started = first.lawnCare.beginCampaign(25, { returnPosition: { x: 1800, y: 1320 }, returnFacing: "right" });
  first.lawnCare.move(started.session.id, getLawnLevel(25).canonicalSolution[0]);
  const loaded = repository.load();
  assert.equal(loaded.ok, true);
  const resumed = runtime({ state: loaded.state, repository });
  const session = resumed.lawnCare.getActiveSession();
  assert.equal(session.assignedLevel, 25);
  assert.equal(session.moves, 1);
  assert.equal(session.undoStack.length, 1);
  assert.deepEqual(session.returnPosition, { x: 1800, y: 1320 });
  assert.equal(session.returnFacing, "right");
  assert.equal(validateGameState(resumed.gameState.getSnapshot()).ok, true);
});

test("a failed completion save restores the exact active attempt and wallet", () => {
  let shouldFail = false;
  const repository = { save: () => shouldFail ? { ok: false, status: "write-failed" } : { ok: true, status: "saved" } };
  const { gameState, lawnCare } = runtime({ repository });
  const session = lawnCare.beginCampaign(10).session;
  const before = gameState.getSnapshot();
  shouldFail = true;
  const failed = lawnCare.completeCertified(session.id);
  assert.equal(failed.code, "persistence-failed");
  assert.deepEqual(gameState.getSnapshot(), before);
  shouldFail = false;
  assert.equal(lawnCare.completeCertified(session.id).ok, true);
  assert.equal(gameState.getSnapshot().economy.coins, 200);
});

test("schema 14 saves and protected mini-game progress gain normalized Lawn Care state", () => {
  const old = createFreshGameState({ now: 0 });
  delete old.lawnCare;
  old.schemaVersion = 14;
  const upgraded = upgradeGameState(old, { now: 0 });
  assert.equal(upgraded.schemaVersion, 21);
  assert.equal(upgraded.lawnCare.progress.nextLevel, 1);
  assert.equal(validateGameState(upgraded).ok, true);
  const projected = projectLegacyLawnCare({ miniGames: { progress: { lawn: { nextLevel: 43, best: { 1: { stars: 3, percent: 100 }, 42: { stars: 2, percent: 86 } } } } } });
  assert.equal(projected.progress.nextLevel, 43);
  assert.equal(projected.progress.completed, 2);
  assert.deepEqual(projected.progress.best["42"], { stars: 2, percent: 86 });
});
