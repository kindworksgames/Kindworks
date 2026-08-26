import test from "node:test";
import assert from "node:assert/strict";
import {
  CAFE_APPLIANCES,
  CAFE_CHAPTERS,
  CAFE_CONFIG,
  CAFE_INGREDIENTS,
  CAFE_LEVELS,
  CAFE_RECIPES,
  cafeFirstClearCoins,
} from "../src/data/cafe.js";
import { createFreshGameState, GameStateService, upgradeGameState, validateGameState } from "../src/state/GameState.js";
import { projectLegacyCafe } from "../src/state/cafeState.js";
import { SaveRepository } from "../src/state/SaveRepository.js";
import { CafeService } from "../src/systems/CafeService.js";
import { MemoryStorage } from "./helpers/MemoryStorage.js";

function runtime({ state = createFreshGameState({ now: 0 }), repository = new SaveRepository(new MemoryStorage()) } = {}) {
  const gameState = new GameStateService(state);
  const cafe = new CafeService(gameState, repository, { now: () => 1000 });
  return { gameState, cafe, repository };
}

function completeShift(cafe, level = 1) {
  assert.equal(cafe.startLevel(level, { instantOrders: true }).ok, true);
  let last;
  while (!cafe.getActiveSession().finished) {
    const tray = cafe.getActiveSession().trays.find((candidate) => candidate.orderId);
    assert.ok(tray);
    cafe.selectTray(tray.index);
    const recipe = cafe.currentRecipe();
    for (const step of recipe.steps) assert.equal(cafe.applyStep(step).ok, true);
    last = cafe.serveActive();
    assert.equal(last.ok, true);
  }
  return last;
}

test("pins the original complete Corner Café catalogue and campaign", () => {
  assert.equal(CAFE_CONFIG.levelCount, 150);
  assert.equal(CAFE_CHAPTERS.length, 15);
  assert.equal(CAFE_LEVELS.length, 150);
  assert.equal(Object.keys(CAFE_RECIPES).length, 64);
  assert.equal(Object.keys(CAFE_INGREDIENTS).length, 75);
  assert.equal(Object.keys(CAFE_APPLIANCES).length, 13);
  assert.equal(CAFE_CONFIG.trayCount, 3);
  assert.deepEqual(CAFE_LEVELS[0].orders.map((order) => order.recipes), [["tea"], ["teaMilk"], ["butteredToast"]]);
  assert.equal(new Set(CAFE_LEVELS.map((level) => level.orders.map((order) => order.recipes.join("+")).join("|"))).size, 150);
  assert.ok(CAFE_LEVELS.every((level) => level.orders.length === level.target && level.maxMisses === 0));
});

test("fresh Milestone 14 state is valid and begins at café level one", () => {
  const state = createFreshGameState({ now: 0 });
  assert.equal(state.schemaVersion, 22);
  assert.equal(state.cafe.unlockedLevel, 1);
  assert.equal(state.cafe.totalStars, 0);
  assert.equal(validateGameState(state).ok, true);
});

test("the first café shift starts with one arrived customer and three preparation trays", () => {
  const { cafe } = runtime();
  assert.equal(cafe.startLevel(2).code, "level-locked");
  const started = cafe.startLevel(1, { returnPosition: { x: 560, y: 980 }, returnFacing: "left" });
  assert.equal(started.ok, true);
  assert.equal(started.session.activeOrderIds.length, 1);
  assert.equal(started.session.trays.length, 3);
  assert.equal(started.session.trays[0].orderId, "cafe-order-1");
  assert.deepEqual(started.session.returnPosition, { x: 560, y: 980 });
});

test("new café orders arrive on the original level schedule and auto-claim free trays", () => {
  const { cafe } = runtime();
  cafe.startLevel(1);
  for (let second = 0; second < 18; second += 1) cafe.tick(1);
  const session = cafe.getActiveSession();
  assert.equal(session.activeOrderIds.length, 2);
  assert.equal(session.trays.filter((tray) => tray.orderId).length, 2);
  assert.equal(cafe.activeOrders()[1].customerName.length > 0, true);
});

test("café trays reuse the shared exact recipe-step validation", () => {
  const { cafe } = runtime();
  cafe.startLevel(1, { instantOrders: true });
  const recipe = cafe.currentRecipe();
  const wrong = recipe.steps[0] === "milk" ? "tea" : "milk";
  assert.equal(cafe.applyStep(wrong).code, "wrong-step");
  assert.equal(cafe.getActiveSession().mistakes, 1);
  for (const step of recipe.steps) assert.equal(cafe.applyStep(step).ok, true);
  assert.equal(cafe.serveActive().code, "customer-served");
});

test("undo and discard are isolated to the selected café tray", () => {
  const { cafe } = runtime();
  cafe.startLevel(1, { instantOrders: true });
  const first = cafe.expectedStep();
  cafe.applyStep(first);
  assert.equal(cafe.undoStep().removed, first);
  cafe.applyStep(first);
  const discarded = cafe.discardTray();
  assert.equal(discarded.ok, true);
  assert.equal(cafe.getActiveSession().waste, 1);
  assert.equal(cafe.getActiveSession().trays[1].stepIndex, 0);
});

test("a perfect first clear unlocks level two and pays the exact original reward once", () => {
  const { gameState, cafe, repository } = runtime();
  const result = completeShift(cafe);
  assert.equal(result.result.won, true);
  assert.equal(result.result.stars, 3);
  assert.equal(result.result.firstClear, true);
  assert.equal(result.result.coins, cafeFirstClearCoins(1, 3));
  assert.equal(result.result.coins, 59);
  const state = gameState.getSnapshot();
  assert.equal(state.economy.coins, 159);
  assert.equal(state.cafe.unlockedLevel, 2);
  assert.equal(state.cafe.lifetimeServed, 3);
  assert.equal(repository.load().state.cafe.completed[1], true);
  assert.equal(state.economy.ledger.at(-1).kind, "corner-cafe-first-clear");
});

test("replaying a cleared café shift never pays first-clear coins twice", () => {
  const { gameState, cafe } = runtime();
  completeShift(cafe);
  cafe.cancel();
  const replay = completeShift(cafe);
  assert.equal(replay.result.firstClear, false);
  assert.equal(replay.result.coins, 0);
  assert.equal(gameState.getSnapshot().economy.coins, 159);
});

test("one customer leaving immediately ends the no-miss café shift", () => {
  const { gameState, cafe } = runtime();
  cafe.startLevel(1);
  let last;
  for (let second = 0; second < 100 && !cafe.getActiveSession().finished; second += 1) last = cafe.tick(1);
  assert.equal(last.result.won, false);
  assert.match(last.result.failureReason, /left/);
  assert.equal(gameState.getSnapshot().cafe.unlockedLevel, 1);
  assert.equal(gameState.getSnapshot().economy.coins, 100);
});

test("safe café cancellation abandons only transient tray work", () => {
  const { gameState, cafe } = runtime();
  cafe.startLevel(1, { instantOrders: true });
  cafe.applyStep(cafe.expectedStep());
  const cancelled = cafe.cancel();
  assert.equal(cancelled.ok, true);
  assert.equal(cafe.getActiveSession(), null);
  assert.equal(gameState.getSnapshot().cafe.shifts, 0);
});

test("a café save failure restores progress and leaves the prepared final order retryable", () => {
  let shouldFail = true;
  const repository = { save: () => shouldFail ? { ok: false, status: "write-failed" } : { ok: true, status: "saved" } };
  const { gameState, cafe } = runtime({ repository });
  cafe.startLevel(1, { instantOrders: true });
  let result;
  while (cafe.getActiveSession().served < 3) {
    const tray = cafe.getActiveSession().trays.find((candidate) => candidate.orderId);
    cafe.selectTray(tray.index);
    for (const step of cafe.currentRecipe().steps) cafe.applyStep(step);
    result = cafe.serveActive();
    if (!result.ok) break;
  }
  assert.equal(result.code, "persistence-failed");
  assert.equal(gameState.getSnapshot().economy.coins, 100);
  assert.equal(gameState.getSnapshot().cafe.unlockedLevel, 1);
  assert.equal(cafe.currentRecipe().steps.length, cafe.tray().stepIndex);
  shouldFail = false;
  const retry = cafe.serveActive();
  assert.equal(retry.ok, true);
  assert.equal(retry.result.firstClear, true);
  assert.equal(gameState.getSnapshot().economy.coins, 159);
});

test("legacy café progress projects into the persistent Phaser campaign", () => {
  const projected = projectLegacyCafe({
    unlockedLevel: 3,
    completed: { 1: true, 2: true },
    best: { 1: { score: 94, stars: 3, served: 3, accuracy: 100 }, 2: { score: 80, stars: 2, served: 3, accuracy: 90 } },
    shifts: 5,
  });
  assert.equal(projected.unlockedLevel, 3);
  assert.equal(projected.totalStars, 5);
  assert.equal(projected.shifts, 5);
});

test("schema 10 saves gain café progress while preserving the bakery milestone", () => {
  const old = createFreshGameState({ now: 0 });
  delete old.cafe;
  old.schemaVersion = 10;
  old.bakery.completed[1] = true;
  old.bakery.best[1] = { score: 95, stars: 3, served: 3, accuracy: 100 };
  old.bakery.totalStars = 3;
  const upgraded = upgradeGameState(old, { now: 0 });
  assert.equal(upgraded.schemaVersion, 22);
  assert.equal(upgraded.cafe.unlockedLevel, 1);
  assert.equal(upgraded.bakery.completed[1], true);
  assert.equal(validateGameState(upgraded).ok, true);
});
