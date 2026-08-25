import test from "node:test";
import assert from "node:assert/strict";
import {
  BAKERY_APPLIANCES,
  BAKERY_CHAPTERS,
  BAKERY_CONFIG,
  BAKERY_INGREDIENTS,
  BAKERY_LEVELS,
  BAKERY_RECIPES,
  bakeryFirstClearCoins,
} from "../src/data/bakery.js";
import { createFreshGameState, GameStateService, upgradeGameState, validateGameState } from "../src/state/GameState.js";
import { projectLegacyBakery } from "../src/state/bakeryState.js";
import { SaveRepository } from "../src/state/SaveRepository.js";
import { BakeryService } from "../src/systems/BakeryService.js";
import { MemoryStorage } from "./helpers/MemoryStorage.js";

function runtime({ state = createFreshGameState({ now: 0 }), repository = new SaveRepository(new MemoryStorage()) } = {}) {
  const gameState = new GameStateService(state);
  const bakery = new BakeryService(gameState, repository, { now: () => 1000 });
  return { gameState, bakery, repository };
}

function completeShift(bakery, level = 1) {
  assert.equal(bakery.startLevel(level).ok, true);
  let last;
  while (!bakery.getActiveSession().finished) {
    const recipe = bakery.currentRecipe();
    for (const step of recipe.steps) assert.equal(bakery.applyStep(step).ok, true);
    last = bakery.serveRecipe();
    assert.equal(last.ok, true);
  }
  return last;
}

test("pins the original complete bakery catalogue and 150-shift campaign", () => {
  assert.equal(BAKERY_CONFIG.levelCount, 150);
  assert.equal(BAKERY_CHAPTERS.length, 15);
  assert.equal(BAKERY_LEVELS.length, 150);
  assert.equal(Object.keys(BAKERY_RECIPES).length, 24);
  assert.equal(Object.keys(BAKERY_INGREDIENTS).length, 50);
  assert.equal(Object.keys(BAKERY_APPLIANCES).length, 7);
  assert.deepEqual(BAKERY_LEVELS.slice(0, 5).map((level) => [level.target, level.orders.flatMap((order) => order.recipes).length]), [[3, 3], [3, 3], [3, 3], [3, 3], [3, 3]]);
  assert.equal(new Set(BAKERY_LEVELS.map((level) => level.name)).size, 150);
  assert.ok(BAKERY_LEVELS.every((level) => level.orders.length === level.target && level.maxMisses === 0));
});

test("fresh Milestone 13 state is valid and begins at bakery level one", () => {
  const state = createFreshGameState({ now: 0 });
  assert.equal(state.schemaVersion, 12);
  assert.equal(state.bakery.unlockedLevel, 1);
  assert.equal(state.bakery.totalStars, 0);
  assert.equal(validateGameState(state).ok, true);
});

test("locked shifts cannot start and level one assigns a named customer", () => {
  const { bakery } = runtime();
  assert.equal(bakery.startLevel(2).code, "level-locked");
  const started = bakery.startLevel(1, { returnPosition: { x: 805, y: 1180 }, returnFacing: "left" });
  assert.equal(started.ok, true);
  assert.equal(started.session.orders.length, 3);
  assert.equal(typeof started.session.orders[0].customerName, "string");
  assert.deepEqual(started.session.returnPosition, { x: 805, y: 1180 });
});

test("the play loop accepts only the exact highlighted recipe sequence", () => {
  const { bakery } = runtime();
  bakery.startLevel(1);
  const recipe = bakery.currentRecipe();
  const wrong = recipe.steps[0] === "butter" ? "breadDough" : "butter";
  const rejected = bakery.applyStep(wrong);
  assert.equal(rejected.code, "wrong-step");
  assert.equal(bakery.getActiveSession().mistakes, 1);
  for (const step of recipe.steps) assert.equal(bakery.applyStep(step).ok, true);
  assert.equal(bakery.getActiveSession().stepIndex, recipe.steps.length);
  assert.equal(bakery.serveRecipe().code, "customer-served");
});

test("undo and discard modify only the active preparation and count waste honestly", () => {
  const { bakery } = runtime();
  bakery.startLevel(1);
  const first = bakery.expectedStep();
  bakery.applyStep(first);
  assert.equal(bakery.undoStep().removed, first);
  bakery.applyStep(first);
  const discarded = bakery.discardRecipe();
  assert.equal(discarded.ok, true);
  assert.equal(bakery.getActiveSession().waste, 1);
  assert.equal(bakery.getActiveSession().mistakes, 1);
  assert.equal(bakery.getActiveSession().stepIndex, 0);
});

test("a perfect first clear serves all customers, unlocks level two and pays once", () => {
  const { gameState, bakery, repository } = runtime();
  const result = completeShift(bakery);
  assert.equal(result.code, "bakery-shift-complete");
  assert.equal(result.result.won, true);
  assert.equal(result.result.stars, 3);
  assert.equal(result.result.firstClear, true);
  assert.equal(result.result.coins, bakeryFirstClearCoins(1, 3));
  const state = gameState.getSnapshot();
  assert.equal(state.bakery.unlockedLevel, 2);
  assert.equal(state.bakery.completed[1], true);
  assert.equal(state.bakery.lifetimeServed, 3);
  assert.equal(state.economy.coins, 180);
  assert.equal(state.economy.ledger.at(-1).kind, "little-bakery-first-clear");
  assert.equal(repository.load().state.bakery.unlockedLevel, 2);
});

test("replaying a cleared shift can improve its best score but never pays again", () => {
  const { gameState, bakery } = runtime();
  completeShift(bakery);
  const before = gameState.getSnapshot().economy.coins;
  const replay = completeShift(bakery);
  assert.equal(replay.result.firstClear, false);
  assert.equal(replay.result.coins, 0);
  assert.equal(gameState.getSnapshot().economy.coins, before);
  assert.equal(gameState.getSnapshot().bakery.shifts, 2);
});

test("a customer leaving ends the no-miss shift with no unlock or reward", () => {
  const { gameState, bakery } = runtime();
  bakery.startLevel(1);
  let result;
  for (let second = 0; second < 200 && !bakery.getActiveSession().finished; second += 1) result = bakery.tick(1);
  assert.equal(result.result.won, false);
  assert.equal(result.result.coins, 0);
  assert.equal(gameState.getSnapshot().bakery.unlockedLevel, 1);
  assert.equal(gameState.getSnapshot().economy.coins, 100);
  assert.equal(gameState.getSnapshot().bakery.lastOutcome, "lost");
});

test("safe cancellation abandons transient recipe work without changing durable progress", () => {
  const { gameState, bakery } = runtime();
  bakery.startLevel(1);
  bakery.applyStep(bakery.expectedStep());
  const before = gameState.getSnapshot();
  assert.equal(bakery.cancel().ok, true);
  assert.deepEqual(gameState.getSnapshot(), before);
  assert.equal(bakery.getActiveSession(), null);
});

test("a save failure restores coins, unlocks and bakery progress without duplication", () => {
  let shouldFail = true;
  const repository = { save: () => shouldFail ? { ok: false, status: "write-failed" } : { ok: true, status: "saved" } };
  const { gameState, bakery } = runtime({ repository });
  bakery.startLevel(1);
  let result;
  for (let order = 0; order < 3; order += 1) {
    for (const step of bakery.currentRecipe().steps) bakery.applyStep(step);
    result = bakery.serveRecipe();
  }
  assert.equal(result.code, "persistence-failed");
  assert.equal(gameState.getSnapshot().economy.coins, 100);
  assert.equal(gameState.getSnapshot().bakery.unlockedLevel, 1);
  assert.equal(gameState.getSnapshot().bakery.shifts, 0);
  assert.equal(bakery.getActiveSession().finished, false);
  assert.equal(bakery.currentRecipe().steps.length, bakery.getActiveSession().stepIndex);
  shouldFail = false;
  const retry = bakery.serveRecipe();
  assert.equal(retry.ok, true);
  assert.equal(retry.result.firstClear, true);
  assert.equal(gameState.getSnapshot().economy.coins, 180);
});

test("legacy bakery progress projects into the persistent Phaser campaign", () => {
  const projected = projectLegacyBakery({
    unlockedLevel: 3,
    completed: { 1: true, 2: true },
    best: { 1: { score: 91, stars: 3, served: 3, accuracy: 100 }, 2: { score: 79, stars: 2, served: 3, accuracy: 88 } },
    shifts: 4,
  });
  assert.equal(projected.unlockedLevel, 3);
  assert.equal(projected.totalStars, 5);
  assert.equal(projected.shifts, 4);
});

test("schema 9 saves gain bakery progress while preserving all prior milestones", () => {
  const old = createFreshGameState({ now: 0 });
  delete old.bakery;
  old.schemaVersion = 9;
  old.identity.townName = "Baker's Hollow";
  const upgraded = upgradeGameState(old, { now: 1000 });
  assert.equal(upgraded.schemaVersion, 12);
  assert.equal(upgraded.identity.townName, "Baker's Hollow");
  assert.equal(upgraded.bakery.unlockedLevel, 1);
  assert.equal(validateGameState(upgraded).ok, true);
});
