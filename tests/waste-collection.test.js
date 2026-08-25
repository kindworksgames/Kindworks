import test from "node:test";
import assert from "node:assert/strict";
import {
  WASTE_BUILD_VERSION,
  WASTE_CERTIFIED_SOLUTIONS,
  WASTE_PAYLOAD_SHA256,
  WASTE_RUBBISH_CATALOG,
  WASTE_SOURCE_SHA256,
  WASTE_TOTAL_LEVELS,
  WASTE_TRAY_LIMIT,
  WasteCollectionEngine,
  validateWasteCatalogue,
  verifyWasteSolution,
  wasteLevelSummary,
  wasteTileExposed,
} from "../src/data/wasteCollection.js";
import { COMMONS_RUBBISH_JOB } from "../src/data/cleanupJobs.js";
import { createFreshGameState, GameStateService, upgradeGameState, validateGameState } from "../src/state/GameState.js";
import { SaveRepository } from "../src/state/SaveRepository.js";
import { projectLegacyCleanup } from "../src/state/cleanupState.js";
import { CleanupJobService } from "../src/systems/CleanupJobService.js";
import { MemoryStorage } from "./helpers/MemoryStorage.js";

function runtime({ repository = null, state = null, now = () => 1000 } = {}) {
  const storage = new MemoryStorage();
  const saveRepository = repository || new SaveRepository(storage);
  const gameState = new GameStateService(state || createFreshGameState({ now: 0 }));
  const cleanup = new CleanupJobService(gameState, saveRepository, { now });
  return { storage, repository: saveRepository, gameState, cleanup };
}

test("extracts the complete protected Waste Collection catalogue with stable provenance", () => {
  assert.equal(WASTE_BUILD_VERSION, "72.0.1-phase19-embedded-landscape");
  assert.equal(WASTE_TOTAL_LEVELS, 750);
  assert.equal(WASTE_TRAY_LIMIT, 5);
  assert.equal(WASTE_RUBBISH_CATALOG.length, 40);
  assert.equal(Object.keys(WASTE_CERTIFIED_SOLUTIONS).length, 750);
  assert.match(WASTE_SOURCE_SHA256, /^[a-f0-9]{64}$/);
  assert.match(WASTE_PAYLOAD_SHA256, /^[a-f0-9]{64}$/);
  assert.deepEqual(wasteLevelSummary(1), { level: 1, tileCount: 30, typeCount: 10, layers: 2, sourceLevel: 1, checkpoint: true, difficulty: 40 });
  assert.deepEqual(wasteLevelSummary(750), { level: 750, tileCount: 138, typeCount: 16, layers: 8, sourceLevel: 735, checkpoint: true, difficulty: 85 });
});

test("all 750 authored boards validate and every original five-slot certificate clears", () => {
  const validation = validateWasteCatalogue({ verifySolutions: true });
  assert.deepEqual(validation, { ok: true, errors: [], levels: 750, rubbishTypes: 40, certifiedSolutions: 750 });
  assert.equal(verifyWasteSolution(1).ok, true);
  assert.equal(verifyWasteSolution(750).ok, true);
});

test("the engine only exposes uncovered cards and clears sorted triples automatically", () => {
  const engine = new WasteCollectionEngine(1);
  const covered = engine.tiles.find((tile) => !wasteTileExposed(engine.tiles, tile));
  assert.ok(covered);
  assert.equal(engine.select(covered.id).code, "tile-blocked");
  for (const tileId of WASTE_CERTIFIED_SOLUTIONS[1].slice(0, 3)) assert.equal(engine.select(tileId).ok, true);
  assert.equal(engine.moves, 3);
  assert.equal(engine.matches, 1);
  assert.equal(engine.tray.length, 0);
});

test("a selected campaign level persists exact card, tray, and return state", () => {
  const first = runtime();
  const started = first.cleanup.beginCampaign(25, { returnPosition: { x: 1700, y: 1340 }, returnFacing: "left" });
  assert.equal(started.ok, true);
  const engine = new WasteCollectionEngine(25);
  const selected = first.cleanup.selectCampaignTile(started.session.id, engine.exposedIds()[0]);
  assert.equal(selected.ok, true);
  const saved = first.repository.load().state;
  const resumed = runtime({ state: saved });
  const active = resumed.cleanup.getActiveSession();
  assert.equal(active.assignedLevel, 25);
  assert.equal(active.moves, 1);
  assert.equal(active.removedIds.length, 1);
  assert.deepEqual(active.returnPosition, { x: 1700, y: 1340 });
  assert.equal(validateGameState(resumed.gameState.getSnapshot()).ok, true);
});

test("a Level 750 certified clear pays the exact first-clear reward once", () => {
  const { cleanup, gameState } = runtime();
  const first = cleanup.beginCampaign(750);
  const result = cleanup.completeCertifiedCampaign(first.session.id);
  assert.equal(result.ok, true);
  assert.deepEqual(result.result, { level: 750, stars: 3, percent: 100, moves: 138, matches: 46, firstClear: true, rewardCoins: 170 });
  assert.equal(gameState.getSnapshot().economy.coins, 270);
  assert.equal(gameState.getSnapshot().economy.ledger.at(-1).kind, "campaign-first-clear");
  assert.deepEqual(cleanup.getCampaignSnapshot().best["750"], { stars: 3, percent: 100 });
  assert.equal(cleanup.getCampaignSnapshot().completed, 1);
  const replay = cleanup.beginCampaign(750);
  const replayed = cleanup.completeCertifiedCampaign(replay.session.id);
  assert.equal(replayed.result.firstClear, false);
  assert.equal(replayed.result.rewardCoins, 0);
  assert.equal(gameState.getSnapshot().economy.coins, 270);
  assert.equal(gameState.getSnapshot().economy.ledger.filter((entry) => entry.kind === "campaign-first-clear").length, 1);
});

test("the Milestone 6 town occurrence remains atomic and makes Level 1 a no-pay replay", () => {
  const { cleanup, gameState } = runtime();
  const town = cleanup.begin(COMMONS_RUBBISH_JOB.id).session;
  assert.equal(cleanup.complete(town.id, { collectedItemIds: town.itemIds }).rewardCoins, 100);
  assert.equal(cleanup.getCampaignSnapshot().nextLevel, 2);
  const campaign = cleanup.beginCampaign(1);
  const replay = cleanup.completeCertifiedCampaign(campaign.session.id);
  assert.equal(replay.result.firstClear, false);
  assert.equal(replay.result.rewardCoins, 0);
  assert.equal(gameState.getSnapshot().economy.coins, 200);
  assert.equal(gameState.getSnapshot().progress.completedJobCount, 1);
});

test("a campaign persistence failure restores the exact pre-clear attempt and wallet", () => {
  let shouldFail = false;
  const repository = { save: () => shouldFail ? { ok: false, status: "write-failed" } : { ok: true, status: "saved" } };
  const { cleanup, gameState } = runtime({ repository });
  const session = cleanup.beginCampaign(10).session;
  const before = gameState.getSnapshot();
  shouldFail = true;
  const failed = cleanup.completeCertifiedCampaign(session.id);
  assert.equal(failed.code, "persistence-failed");
  assert.deepEqual(gameState.getSnapshot(), before);
  shouldFail = false;
  assert.equal(cleanup.completeCertifiedCampaign(session.id).ok, true);
  assert.equal(gameState.getSnapshot().economy.coins, 200);
});

test("schema 13 saves gain normalized Waste Collection campaign state", () => {
  const old = createFreshGameState({ now: 0 });
  old.schemaVersion = 13;
  old.progress.cleanup.schemaVersion = 1;
  old.progress.cleanup.progress.waste.best["1"] = { stars: 3, percent: 100 };
  old.progress.cleanup.progress.waste.completed = 1;
  old.progress.cleanup.progress.waste.nextLevel = 2;
  const upgraded = upgradeGameState(old, { now: 0 });
  assert.equal(upgraded.schemaVersion, 16);
  assert.equal(upgraded.progress.cleanup.schemaVersion, 2);
  assert.equal(upgraded.progress.cleanup.progress.waste.completed, 1);
  assert.equal(validateGameState(upgraded).ok, true);
});

test("original miniGames progress projects into the Phaser Waste Collection campaign", () => {
  const projected = projectLegacyCleanup({ miniGames: { progress: { waste: { nextLevel: 43, completed: 2, best: { 1: { stars: 3, percent: 100 }, 42: { stars: 2, percent: 86 } } } } } });
  assert.equal(projected.progress.waste.nextLevel, 43);
  assert.equal(projected.progress.waste.completed, 2);
  assert.deepEqual(projected.progress.waste.best["42"], { stars: 2, percent: 86 });
  assert.equal(projected.targets[COMMONS_RUBBISH_JOB.id].status, "available");
});
