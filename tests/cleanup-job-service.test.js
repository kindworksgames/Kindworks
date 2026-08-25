import test from "node:test";
import assert from "node:assert/strict";
import { COMMONS_RUBBISH_JOB } from "../src/data/cleanupJobs.js";
import { createFreshGameState, GameStateService, upgradeGameState, validateGameState } from "../src/state/GameState.js";
import { SaveRepository } from "../src/state/SaveRepository.js";
import { CleanupJobService, calculateCleanupReward } from "../src/systems/CleanupJobService.js";
import { MemoryStorage } from "./helpers/MemoryStorage.js";

function runtime({ repository = null, now = () => 1000 } = {}) {
  const storage = new MemoryStorage();
  const saveRepository = repository || new SaveRepository(storage);
  const gameState = new GameStateService(createFreshGameState({ now: 0 }));
  const cleanup = new CleanupJobService(gameState, saveRepository, { now });
  return { storage, repository: saveRepository, gameState, cleanup };
}

function begin(cleanup) {
  return cleanup.begin(COMMONS_RUBBISH_JOB.id, {
    returnPosition: { x: 1738, y: 1340 },
    returnFacing: "up",
  });
}

test("creates the one authored rubbish target and exact six-item snapshot", () => {
  const { cleanup, gameState, repository } = runtime();
  assert.equal(cleanup.isAvailable(COMMONS_RUBBISH_JOB.id), true);
  const result = begin(cleanup);
  assert.equal(result.ok, true);
  assert.equal(result.session.id, "cleanup-000001");
  assert.equal(result.session.assignedLevel, 1);
  assert.deepEqual(result.session.itemIds, COMMONS_RUBBISH_JOB.items.map((item) => item.id));
  assert.equal(gameState.getSnapshot().player.scene, "WasteCollectionScene");
  assert.deepEqual(repository.load().state.progress.cleanup.activeSession, result.session);
});

test("requires every snapshotted piece before committing the target", () => {
  const { cleanup, gameState } = runtime();
  const session = begin(cleanup).session;
  const before = gameState.getSnapshot();
  const result = cleanup.complete(session.id, { collectedItemIds: session.itemIds.slice(0, 5) });
  assert.equal(result.ok, false);
  assert.equal(result.code, "incomplete-job");
  assert.equal(result.percent, 83);
  assert.deepEqual(gameState.getSnapshot(), before);
});

test("completes once, awards the exact Level 1 reward, and reloads the clean target", () => {
  const { cleanup, gameState, repository } = runtime();
  const session = begin(cleanup).session;
  const result = cleanup.complete(session.id, { collectedItemIds: session.itemIds });
  assert.equal(result.ok, true);
  assert.equal(result.rewardCoins, 100);
  assert.equal(result.balance, 200);
  assert.equal(result.nextLevel, 2);
  const state = gameState.getSnapshot();
  assert.equal(state.progress.completedJobCount, 1);
  assert.equal(state.progress.cleanup.targets[COMMONS_RUBBISH_JOB.id].status, "completed");
  assert.equal(state.progress.cleanup.activeSession, null);
  assert.deepEqual(state.progress.cleanup.progress.waste.best["1"], { stars: 3, percent: 100 });
  assert.equal(state.economy.ledger.at(-1).kind, "job-reward");
  assert.equal(state.economy.ledger.at(-1).targetId, COMMONS_RUBBISH_JOB.id);
  assert.equal(state.economy.ledger.at(-1).sessionId, session.id);
  const reloaded = repository.load().state;
  assert.equal(reloaded.economy.coins, 200);
  assert.equal(reloaded.progress.cleanup.targets[COMMONS_RUBBISH_JOB.id].status, "completed");
});

test("duplicate completion and a cleaned target can never pay twice", () => {
  const { cleanup, gameState } = runtime();
  const session = begin(cleanup).session;
  assert.equal(cleanup.complete(session.id, { collectedItemIds: session.itemIds }).ok, true);
  const duplicate = cleanup.complete(session.id, { collectedItemIds: session.itemIds });
  assert.equal(duplicate.ok, true);
  assert.equal(duplicate.duplicate, true);
  assert.equal(gameState.getSnapshot().economy.coins, 200);
  const replay = begin(cleanup);
  assert.equal(replay.code, "target-clean");
  assert.equal(gameState.getSnapshot().economy.ledger.filter((entry) => entry.kind === "job-reward").length, 1);
});

test("safe exit cancels the session without cleaning or awarding coins", () => {
  const { cleanup, gameState, repository } = runtime();
  const session = begin(cleanup).session;
  const result = cleanup.cancel(session.id);
  assert.equal(result.ok, true);
  const state = gameState.getSnapshot();
  assert.equal(state.player.scene, "TownScene");
  assert.equal(state.economy.coins, 100);
  assert.equal(state.progress.completedJobCount, 0);
  assert.equal(state.progress.cleanup.targets[COMMONS_RUBBISH_JOB.id].status, "available");
  assert.equal(repository.load().state.progress.cleanup.history.at(-1).status, "cancelled");
});

test("persistence failure restores the exact pre-completion checkpoint", () => {
  const { cleanup, gameState } = runtime();
  const session = begin(cleanup).session;
  const before = gameState.getSnapshot();
  cleanup.repository = { save: () => ({ ok: false, status: "write-failed", reason: "disk full" }) };
  const result = cleanup.complete(session.id, { collectedItemIds: session.itemIds });
  assert.equal(result.code, "persistence-failed");
  assert.equal(result.rollbackOk, true);
  assert.deepEqual(gameState.getSnapshot(), before);
});

test("schema-2 saves gain fresh cleanup state without losing prior progress", () => {
  const oldState = createFreshGameState({ now: 0 });
  oldState.schemaVersion = 2;
  oldState.progress.completedJobCount = 17;
  delete oldState.progress.cleanup;
  const upgraded = upgradeGameState(oldState, { now: 1000 });
  assert.equal(upgraded.schemaVersion, 16);
  assert.equal(upgraded.progress.completedJobCount, 17);
  assert.equal(upgraded.progress.cleanup.targets[COMMONS_RUBBISH_JOB.id].status, "available");
  assert.equal(validateGameState(upgraded).ok, true);
});

test("rejects a cleanup session whose supposedly exact item snapshot is altered", () => {
  const { cleanup, gameState } = runtime();
  begin(cleanup);
  const state = gameState.getSnapshot();
  state.progress.cleanup.activeSession.itemIds[0] = "not-the-authored-bottle";
  const validation = validateGameState(state);
  assert.equal(validation.ok, false);
  assert.ok(validation.errors.includes("Active cleanup item snapshot is invalid."));
});

test("reward calculation preserves the legacy percentage and level-bonus rules", () => {
  assert.equal(calculateCleanupReward(49, 1), 0);
  assert.equal(calculateCleanupReward(50, 1), 50);
  assert.equal(calculateCleanupReward(100, 1), 100);
  assert.equal(calculateCleanupReward(100, 51), 105);
  assert.equal(calculateCleanupReward(100, 750), 170);
});
