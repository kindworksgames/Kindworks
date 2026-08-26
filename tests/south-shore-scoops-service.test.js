import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  SOUTH_SHORE_SCOOPS_ALL_FAMILIES,
  SOUTH_SHORE_SCOOPS_CHAPTERS,
  SOUTH_SHORE_SCOOPS_CONFIG,
  SOUTH_SHORE_SCOOPS_CUSTOMER_NAMES,
  SOUTH_SHORE_SCOOPS_FAMILY_UNLOCK,
  SOUTH_SHORE_SCOOPS_LEVELS,
  SOUTH_SHORE_SCOOPS_PARTS,
  SOUTH_SHORE_SCOOPS_PART_UNLOCKS,
  SOUTH_SHORE_SCOOPS_RESTORATION_MILESTONES,
  southShoreScoopsFirstClearCoins,
  southShoreScoopsOrderText,
  southShoreScoopsTwoItemQuota,
} from "../src/data/southShoreScoops.js";
import { createFreshGameState, GameStateService, upgradeGameState, validateGameState } from "../src/state/GameState.js";
import { projectLegacySouthShoreScoops } from "../src/state/southShoreScoopsState.js";
import { SaveRepository } from "../src/state/SaveRepository.js";
import { SouthShoreScoopsService } from "../src/systems/SouthShoreScoopsService.js";
import { MemoryStorage } from "./helpers/MemoryStorage.js";

const LEVEL_CATALOGUE_HASH = "fc5cc5998ae39ec2dc41f69cb0b2a81df793e0b7a321f04df2512f75830e96b7";
const PART_CATALOGUE_HASH = "8b47e7e1319cdd2453e39e57b03eefa8e4fff35758de4487d9c31e2e660bfc93";
const FAMILY_UNLOCK_HASH = "a52c1efd30b2ed33bfa0c7e8e84513a4b85cd8e9ac66e15306c54e38eda63c5d";

function runtime({ state = createFreshGameState({ now: 0 }), repository = new SaveRepository(new MemoryStorage()) } = {}) {
  const gameState = new GameStateService(state);
  const scoops = new SouthShoreScoopsService(gameState, repository, { now: () => 1000 });
  return { gameState, scoops, repository };
}

function buildCurrentItem(scoops) {
  const item = scoops.expectedItem();
  assert.ok(item);
  for (const part of item.parts) assert.equal(scoops.addPart(part).ok, true);
  return item;
}

function serveCurrentOrder(scoops) {
  const order = scoops.currentOrder();
  assert.ok(order);
  for (let itemIndex = 0; itemIndex < order.items.length; itemIndex += 1) {
    buildCurrentItem(scoops);
    if (itemIndex < order.items.length - 1) assert.equal(scoops.addCurrentToTray().ok, true);
  }
  return scoops.serveCurrent();
}

function missCurrentOrder(scoops) {
  let last;
  for (let second = 0; second < 60 && !last?.missedCustomer && !last?.result; second += 1) last = scoops.tick(1);
  assert.ok(last?.missedCustomer || last?.result);
  return last;
}

test("pins the exact protected 750-shift Scoops catalogue, parts and unlock map", () => {
  assert.equal(SOUTH_SHORE_SCOOPS_CONFIG.schemaVersion, 3);
  assert.equal(SOUTH_SHORE_SCOOPS_CONFIG.levelCount, 750);
  assert.equal(SOUTH_SHORE_SCOOPS_CONFIG.maxVisibleQueue, 3);
  assert.equal(SOUTH_SHORE_SCOOPS_CONFIG.passingAccuracy, 60);
  assert.equal(SOUTH_SHORE_SCOOPS_LEVELS.length, 750);
  assert.equal(SOUTH_SHORE_SCOOPS_CHAPTERS.length, 75);
  assert.equal(new Set(SOUTH_SHORE_SCOOPS_CHAPTERS).size, 75);
  assert.equal(SOUTH_SHORE_SCOOPS_ALL_FAMILIES.length, 19);
  assert.equal(Object.keys(SOUTH_SHORE_SCOOPS_PARTS).length, 24);
  assert.equal(SOUTH_SHORE_SCOOPS_CUSTOMER_NAMES.length, 48);
  assert.equal(createHash("sha256").update(JSON.stringify(SOUTH_SHORE_SCOOPS_LEVELS)).digest("hex"), LEVEL_CATALOGUE_HASH);
  assert.equal(createHash("sha256").update(JSON.stringify(SOUTH_SHORE_SCOOPS_PARTS)).digest("hex"), PART_CATALOGUE_HASH);
  assert.equal(createHash("sha256").update(JSON.stringify(SOUTH_SHORE_SCOOPS_FAMILY_UNLOCK)).digest("hex"), FAMILY_UNLOCK_HASH);
  assert.equal(SOUTH_SHORE_SCOOPS_LEVELS[0].name, "Boardwalk Beginnings · Beach Counter Basics 01");
  assert.equal(SOUTH_SHORE_SCOOPS_LEVELS[749].name, "Master Counter · Grand Finale 10");
});

test("all 750 deterministic shifts are unique, finishable and obey the original difficulty curve", () => {
  const plans = new Set();
  const families = new Set();
  let totalItems = 0;
  for (const level of SOUTH_SHORE_SCOOPS_LEVELS) {
    assert.equal(level.chapter, Math.floor((level.level - 1) / 10) + 1);
    assert.equal(level.queueCap, 1);
    assert.equal(level.orders.length, level.target);
    assert.ok(level.target >= 4 && level.target <= 12);
    assert.ok(level.patience >= 26 && level.patience <= 50);
    assert.equal(level.difficulty.score, level.level);
    assert.equal(level.difficulty.sequential, true);
    assert.equal(level.difficulty.twoItemQuota, southShoreScoopsTwoItemQuota(level.level, level.target));
    const orderPlans = new Set();
    let twoItemCount = 0;
    for (const order of level.orders) {
      assert.ok(order.items.length >= 1 && order.items.length <= 2);
      if (order.items.length === 2) twoItemCount += 1;
      const signature = order.items.map((item) => item.parts.join(">")).join("+");
      assert.equal(orderPlans.has(signature), false);
      orderPlans.add(signature);
      for (const item of order.items) {
        totalItems += 1;
        families.add(item.family);
        assert.ok(level.level >= SOUTH_SHORE_SCOOPS_FAMILY_UNLOCK[item.family]);
        assert.ok(item.parts.length >= 1 && item.parts.length <= SOUTH_SHORE_SCOOPS_CONFIG.maxBuildParts);
        assert.equal(new Set(item.parts).size, item.parts.length);
        for (const part of item.parts) assert.ok(SOUTH_SHORE_SCOOPS_PARTS[part]);
      }
      assert.match(southShoreScoopsOrderText(order), /order:/);
    }
    assert.equal(twoItemCount, level.difficulty.twoItemQuota);
    const plan = level.orders.map((order) => order.items.map((item) => item.parts.join(">")).join("+")).join("|");
    assert.equal(plans.has(plan), false);
    plans.add(plan);
  }
  assert.equal(plans.size, 750);
  assert.deepEqual(families, new Set(SOUTH_SHORE_SCOOPS_ALL_FAMILIES));
  assert.equal(totalItems, 9426);
  assert.equal(SOUTH_SHORE_SCOOPS_LEVELS.findIndex((level) => level.orders.some((order) => order.items.length === 2)), 7);
  assert.equal(SOUTH_SHORE_SCOOPS_LEVELS[0].target, 4);
  assert.equal(SOUTH_SHORE_SCOOPS_LEVELS[25].target, 5);
  assert.equal(SOUTH_SHORE_SCOOPS_LEVELS[700].target, 12);
});

test("ingredient and product unlocks expose every original family and part", () => {
  assert.deepEqual(SOUTH_SHORE_SCOOPS_FAMILY_UNLOCK, { singleCone: 1, cup: 1, doubleCone: 2, tripleCone: 3, sauceCone: 4, toppedCup: 5, waffle: 7, sundae: 9, marshmallowSundae: 10, milkshake: 11, shavedIce: 12, lolly: 13, lemonade: 14, deluxeCone: 16, loadedCup: 20, waffleDeluxe: 24, megaSundae: 30, festivalSundae: 38, grandFinale: 45 });
  assert.equal(Object.keys(SOUTH_SHORE_SCOOPS_PART_UNLOCKS).length, 24);
  assert.ok(Object.values(SOUTH_SHORE_SCOOPS_PART_UNLOCKS).every((level) => level >= 1 && level <= 45));
  assert.equal(SOUTH_SHORE_SCOOPS_PART_UNLOCKS.cone, 1);
  assert.equal(SOUTH_SHORE_SCOOPS_PART_UNLOCKS.cherry, 9);
  assert.equal(SOUTH_SHORE_SCOOPS_PART_UNLOCKS.lolly, 22);
});

test("fresh Milestone 23 state is valid and separate from every earlier food venue", () => {
  const state = createFreshGameState({ now: 0 });
  assert.equal(state.schemaVersion, 34);
  assert.equal(state.southShoreScoops.unlockedLevel, 1);
  assert.equal(state.southShoreScoops.activeShift, null);
  assert.equal(state.bakery.unlockedLevel, 1);
  assert.equal(state.cafe.unlockedLevel, 1);
  assert.equal(state.morningMug.unlockedLevel, 1);
  assert.equal(state.riversideKitchen.unlockedLevel, 1);
  assert.equal(validateGameState(state).ok, true);
});

test("a shift checkpoints immediately with one active and three visible customers", () => {
  const { gameState, scoops, repository } = runtime();
  assert.equal(scoops.startLevel(2).code, "level-locked");
  const started = scoops.startLevel(1, { returnPosition: { x: 3560, y: 2265 }, returnFacing: "down" });
  assert.equal(started.ok, true);
  assert.equal(started.session.activeOrderIds.length, 1);
  assert.equal(started.session.spawnIndex, 1);
  assert.equal(scoops.visibleQueue().length, 3);
  assert.deepEqual(started.session.returnPosition, { x: 3560, y: 2265 });
  assert.equal(gameState.getSnapshot().southShoreScoops.activeShift.level.level, 1);
  assert.equal(repository.load().state.southShoreScoops.activeShift.activeOrderIds.length, 1);
});

test("picture construction supports wrong checks, undo, discard and exact sequential service", () => {
  const { scoops } = runtime();
  scoops.startLevel(1);
  const expected = scoops.nextExpectedPart();
  const wrong = Object.keys(SOUTH_SHORE_SCOOPS_PARTS).find((id) => id !== expected);
  assert.equal(scoops.addPart(wrong).ok, true);
  assert.equal(scoops.serveCurrent().code, "wrong-build");
  assert.equal(scoops.getActiveSession().mistakes, 1);
  assert.equal(scoops.getActiveSession().waste, 1);
  assert.equal(scoops.addPart(expected).ok, true);
  assert.equal(scoops.undoPart().removed, expected);
  scoops.addPart(expected);
  assert.equal(scoops.discardPreparation().ok, true);
  assert.equal(scoops.getActiveSession().waste, 2);
  const firstCustomer = scoops.currentOrder().customerName;
  const served = serveCurrentOrder(scoops);
  assert.equal(served.ok, true);
  assert.equal(served.customerName, firstCustomer);
  assert.equal(scoops.getActiveSession().served, 1);
  assert.equal(scoops.getActiveSession().activeOrderIds.length, 1);
  assert.equal(scoops.visibleQueue().length, 3);
});

test("Level 8 begins exact two-item trays and preserves the first completed item", () => {
  const state = createFreshGameState({ now: 0 });
  state.southShoreScoops.unlockedLevel = 8;
  state.southShoreScoops.selectedLevel = 8;
  const { scoops } = runtime({ state });
  assert.equal(scoops.startLevel(8).ok, true);
  assert.equal(scoops.currentOrder().items.length, 2);
  const first = buildCurrentItem(scoops);
  const tray = scoops.addCurrentToTray();
  assert.equal(tray.ok, true);
  assert.deepEqual(tray.tray[0], first.parts);
  assert.deepEqual(scoops.getActiveSession().work[scoops.currentOrder().id].tray[0], first.parts);
  buildCurrentItem(scoops);
  assert.equal(scoops.serveCurrent().ok, true);
});

test("Save & exit and a complete reload resume the exact customer, tray, build and patience", () => {
  const storage = new MemoryStorage();
  const repository = new SaveRepository(storage);
  const first = runtime({ repository });
  first.scoops.startLevel(1, { returnPosition: { x: 3560, y: 2265 } });
  const expected = first.scoops.expectedItem().parts;
  first.scoops.addPart(expected[0]);
  first.scoops.addPart(expected[1]);
  first.scoops.tick(1);
  const before = first.scoops.getActiveSession();
  assert.equal(first.scoops.suspend().ok, true);
  assert.equal(first.scoops.getActiveSession(), null);

  const second = runtime({ state: repository.load().state, repository });
  const resumed = second.scoops.restorePersistedSession();
  assert.equal(resumed.ok, true);
  assert.equal(resumed.session.level.level, 1);
  assert.equal(resumed.session.selectedOrderId, before.selectedOrderId);
  assert.equal(resumed.session.orders[0].patience, before.orders[0].patience);
  assert.deepEqual(resumed.session.work[before.selectedOrderId], before.work[before.selectedOrderId]);
  assert.deepEqual(resumed.session.returnPosition, { x: 3560, y: 2265 });
  assert.equal(second.gameState.getSnapshot().southShoreScoops.completed[1], undefined);
});

test("the original 60% rule passes three of four customers and fails two of four", () => {
  const passing = runtime();
  passing.scoops.startLevel(1);
  missCurrentOrder(passing.scoops);
  let passResult;
  for (let index = 0; index < 3; index += 1) passResult = serveCurrentOrder(passing.scoops);
  assert.equal(passResult.result.accuracy, 75);
  assert.equal(passResult.result.won, true);
  assert.equal(passResult.result.stars, 1);
  assert.equal(passing.gameState.getSnapshot().southShoreScoops.unlockedLevel, 2);

  const failing = runtime();
  failing.scoops.startLevel(1);
  missCurrentOrder(failing.scoops);
  missCurrentOrder(failing.scoops);
  serveCurrentOrder(failing.scoops);
  const failResult = serveCurrentOrder(failing.scoops);
  assert.equal(failResult.result.accuracy, 50);
  assert.equal(failResult.result.won, false);
  assert.equal(failResult.result.stars, 0);
  assert.equal(failing.gameState.getSnapshot().southShoreScoops.unlockedLevel, 1);
  assert.equal(failing.gameState.getSnapshot().economy.coins, 100);
});

test("a perfect first clear pays the original accuracy reward once and no replay coins", () => {
  const { gameState, scoops, repository } = runtime();
  assert.equal(scoops.startLevel(1).ok, true);
  let result;
  for (let index = 0; index < 4; index += 1) result = serveCurrentOrder(scoops);
  assert.equal(result.result.won, true);
  assert.equal(result.result.accuracy, 100);
  assert.equal(result.result.stars, 3);
  assert.equal(result.result.firstClear, true);
  assert.equal(result.result.coins, southShoreScoopsFirstClearCoins(100, 1));
  assert.equal(result.result.coins, 30);
  assert.equal(gameState.getSnapshot().economy.coins, 130);
  assert.equal(repository.load().state.southShoreScoops.completed[1], true);
  assert.equal(gameState.getSnapshot().economy.ledger.at(-1).kind, "south-shore-scoops-first-clear");
  assert.equal(gameState.getSnapshot().economy.ledger.at(-1).venue, "scoops");

  assert.equal(scoops.startLevel(1).ok, true);
  for (let index = 0; index < 4; index += 1) result = serveCurrentOrder(scoops);
  assert.equal(result.result.firstClear, false);
  assert.equal(result.result.coins, 0);
  assert.equal(gameState.getSnapshot().economy.coins, 130);
});

test("rewards stay capped at 45 coins and the perfect campaign remains below 30,000", () => {
  assert.equal(southShoreScoopsFirstClearCoins(59, 750), 0);
  assert.equal(southShoreScoopsFirstClearCoins(60, 1), 18);
  assert.equal(southShoreScoopsFirstClearCoins(100, 750), 45);
  assert.ok(SOUTH_SHORE_SCOOPS_LEVELS.reduce((sum, level) => sum + southShoreScoopsFirstClearCoins(100, level.level), 0) <= 30000);
});

test("the tenth distinct first clear activates the first persistent South Shore restoration tier", () => {
  const state = createFreshGameState({ now: 0 });
  state.southShoreScoops.unlockedLevel = 10;
  state.southShoreScoops.selectedLevel = 10;
  for (let level = 1; level <= 9; level += 1) state.southShoreScoops.completed[level] = true;
  const { gameState, scoops } = runtime({ state });
  scoops.startLevel(10);
  let result;
  for (let index = 0; index < SOUTH_SHORE_SCOOPS_LEVELS[9].target; index += 1) result = serveCurrentOrder(scoops);
  assert.equal(result.result.won, true);
  assert.equal(result.result.restorationTier, 1);
  assert.equal(gameState.getSnapshot().southShoreScoops.restorationTier, 1);
  assert.equal(scoops.getDiagnostics().nextRestorationAt, 35);
  assert.deepEqual(SOUTH_SHORE_SCOOPS_RESTORATION_MILESTONES, [10, 35, 75, 120, 200, 300, 425, 550, 650, 750]);
});

test("a failed final save restores the exact final build and cannot duplicate coins", () => {
  const storage = new MemoryStorage();
  const realRepository = new SaveRepository(storage);
  let failCompletion = true;
  const repository = {
    save(state, options) {
      if (failCompletion && state.southShoreScoops.completed[1]) return { ok: false, status: "write-failed" };
      return realRepository.save(state, options);
    },
  };
  const { gameState, scoops } = runtime({ repository });
  scoops.startLevel(1);
  for (let index = 0; index < 3; index += 1) assert.equal(serveCurrentOrder(scoops).ok, true);
  buildCurrentItem(scoops);
  const finalParts = [...scoops.work().build];
  const failed = scoops.serveCurrent();
  assert.equal(failed.code, "persistence-failed");
  assert.equal(gameState.getSnapshot().economy.coins, 100);
  assert.equal(gameState.getSnapshot().southShoreScoops.unlockedLevel, 1);
  assert.deepEqual(scoops.work().build, finalParts);
  failCompletion = false;
  const retry = scoops.serveCurrent();
  assert.equal(retry.ok, true);
  assert.equal(retry.result.firstClear, true);
  assert.equal(gameState.getSnapshot().economy.coins, 130);
});

test("legacy Scoops progress imports the 150-level pilot and unlocks Level 151", () => {
  const projected = projectLegacySouthShoreScoops({
    schemaVersion: 3,
    unlockedLevel: 150,
    selectedLevel: 150,
    completed: { 1: true, 150: true },
    best: { 1: { score: 302, stars: 3, accuracy: 100, served: 4 }, 150: { score: 418, stars: 2, accuracy: 83, served: 5 } },
    shifts: 176,
    lifetimeServed: 842,
  });
  assert.equal(projected.unlockedLevel, 151);
  assert.equal(projected.totalStars, 5);
  assert.equal(projected.shifts, 176);
  assert.equal(projected.lifetimeServed, 842);
  assert.equal(projected.activeShift, null);
});

test("schema 19 saves gain Scoops while preserving the complete Riverside Kitchen domain", () => {
  const old = createFreshGameState({ now: 0 });
  delete old.southShoreScoops;
  old.schemaVersion = 19;
  old.riversideKitchen.completed[1] = true;
  old.riversideKitchen.best[1] = { score: 100, stars: 3, served: 3, accuracy: 100 };
  old.riversideKitchen.totalStars = 3;
  const upgraded = upgradeGameState(old, { now: 0 });
  assert.equal(upgraded.schemaVersion, 34);
  assert.equal(upgraded.southShoreScoops.unlockedLevel, 1);
  assert.deepEqual(upgraded.riversideKitchen.best[1], { score: 100, stars: 3, served: 3, accuracy: 100 });
  assert.equal(validateGameState(upgraded).ok, true);
});
