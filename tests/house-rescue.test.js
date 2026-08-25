import test from "node:test";
import assert from "node:assert/strict";
import {
  HOUSE_RESCUE_CATEGORIES,
  HOUSE_RESCUE_ITEMS,
  HOUSE_RESCUE_RULES,
  HOUSE_RESCUE_TOTAL_LEVELS,
  generateHouseRescueDirt,
  generateHouseRescueItems,
  houseRescueLevel,
  houseRescueReward,
  houseRescueStars,
  validateHouseRescueCatalogue,
} from "../src/data/houseRescue.js";
import { createFreshGameState, GameStateService, upgradeGameState, validateGameState } from "../src/state/GameState.js";
import { projectLegacyHouseRescue } from "../src/state/houseRescueState.js";
import { SaveRepository } from "../src/state/SaveRepository.js";
import { HouseRescueService } from "../src/systems/HouseRescueService.js";
import { MemoryStorage } from "./helpers/MemoryStorage.js";

function runtime({ state = createFreshGameState({ now: 0 }), repository = new SaveRepository(new MemoryStorage()) } = {}) {
  const gameState = new GameStateService(state);
  const houseRescue = new HouseRescueService(gameState, repository, { now: () => 1000 });
  return { gameState, houseRescue, repository };
}

function sortAll(houseRescue) {
  let session = houseRescue.getActiveSession();
  while (session?.phase === "sorting") {
    const wave = session.items.find((item) => !item.sorted)?.wave;
    const item = session.items.find((entry) => !entry.sorted && entry.wave === wave);
    const result = houseRescue.sortItem(item.id, item.category);
    assert.equal(result.ok, true);
    session = houseRescue.getActiveSession();
  }
  return session;
}

test("pins the original House Rescue rules, catalogue and endpoints", () => {
  const validation = validateHouseRescueCatalogue();
  assert.equal(validation.valid, true, validation.errors.join("\n"));
  assert.equal(HOUSE_RESCUE_TOTAL_LEVELS, 750);
  assert.deepEqual(validation.categories, ["organic", "recycle", "garbage"]);
  assert.deepEqual(validation.rewardRange, [60, 170]);
  assert.equal(HOUSE_RESCUE_ITEMS.length, 15);
  assert.deepEqual(houseRescueLevel(1), { level: 1, itemCount: 9, maxStainStrength: 1, dirtCount: 180, itemSpacing: 48, difficultyIndex: 1, label: "light stains" });
  assert.deepEqual(houseRescueLevel(750), { level: 750, itemCount: 30, maxStainStrength: 5, dirtCount: 267, itemSpacing: 41, difficultyIndex: 750, label: "very deep grime" });
});

test("all 750 levels deterministically preserve scaling, balanced categories and safe visual waves", () => {
  let previous = null;
  for (let level = 1; level <= HOUSE_RESCUE_TOTAL_LEVELS; level += 1) {
    const config = houseRescueLevel(level);
    const items = generateHouseRescueItems({ houseId: "house-1", jobSerial: 3, level });
    const dirt = generateHouseRescueDirt({ houseId: "house-1", jobSerial: 3, level });
    assert.equal(items.length, config.itemCount);
    assert.equal(dirt.length, config.dirtCount);
    assert.deepEqual(items, generateHouseRescueItems({ houseId: "house-1", jobSerial: 3, level }));
    assert.deepEqual(dirt, generateHouseRescueDirt({ houseId: "house-1", jobSerial: 3, level }));
    assert.ok(items.every((item) => HOUSE_RESCUE_CATEGORIES[item.category] && item.x >= 0 && item.x <= 75 && item.y >= 0 && item.y <= 100));
    for (const wave of new Set(items.map((item) => item.wave))) {
      const visible = items.filter((item) => item.wave === wave);
      assert.ok(visible.length <= HOUSE_RESCUE_RULES.visibleItemsPerWave);
      const counts = Object.fromEntries(Object.keys(HOUSE_RESCUE_CATEGORIES).map((category) => [category, visible.filter((item) => item.category === category).length]));
      assert.ok(Math.max(...Object.values(counts)) - Math.min(...Object.values(counts)) <= 1);
    }
    assert.ok(dirt.every((stain) => stain.strength >= 1 && stain.strength <= config.maxStainStrength && stain.remaining === stain.strength));
    if (previous) {
      assert.ok(config.itemCount >= previous.itemCount);
      assert.ok(config.maxStainStrength >= previous.maxStainStrength);
      assert.ok(config.dirtCount >= previous.dirtCount);
      assert.ok(config.itemSpacing < previous.itemSpacing);
    }
    previous = config;
  }
});

test("the exact original tier boundaries increase rubbish, stain strength and dirt", () => {
  assert.deepEqual([houseRescueLevel(94).itemCount, houseRescueLevel(95).itemCount], [9, 12]);
  assert.deepEqual([houseRescueLevel(150).maxStainStrength, houseRescueLevel(151).maxStainStrength], [1, 2]);
  assert.deepEqual([houseRescueLevel(25).dirtCount, houseRescueLevel(26).dirtCount], [180, 183]);
  assert.deepEqual([houseRescueLevel(658).itemCount, houseRescueLevel(659).itemCount], [27, 30]);
  assert.deepEqual([houseRescueLevel(600).maxStainStrength, houseRescueLevel(601).maxStainStrength], [4, 5]);
});

test("fresh Milestone 16 state tracks all homes, four original dirty cottages and a protected personal home", () => {
  const state = createFreshGameState({ now: 0 });
  assert.equal(state.schemaVersion, 14);
  assert.equal(validateGameState(state).ok, true);
  assert.equal(Object.keys(state.houseRescue.homes).length, 19);
  assert.deepEqual(Object.values(state.houseRescue.homes).filter((home) => home.dirty).map((home) => home.houseId), ["house-1", "house-6", "house-11", "house-16"]);
  assert.equal(state.houseRescue.homes["house-19"].dirty, false);
  assert.equal(state.houseRescue.unlockedLevel, 1);
});

test("sorting is wave-bound, awards +2, charges −1, and unlocks vacuum only when complete", () => {
  const { houseRescue } = runtime();
  assert.equal(houseRescue.startLevel(1, { houseId: "house-1" }).ok, true);
  let session = houseRescue.getActiveSession();
  const first = session.items[0];
  const wrongCategory = Object.keys(HOUSE_RESCUE_CATEGORIES).find((category) => category !== first.category);
  let result = houseRescue.sortItem(first.id, wrongCategory);
  assert.equal(result.correct, false);
  assert.equal(result.session.score, -1);
  assert.equal(result.session.mistakes, 1);
  result = houseRescue.sortItem(first.id, first.category);
  assert.equal(result.correct, true);
  assert.equal(result.session.score, 1);
  assert.equal(houseRescue.sortItem("rescue-item-10", "organic").ok, false);
  session = sortAll(houseRescue);
  assert.equal(session.phase, "vacuum");
  assert.equal(session.correct, 9);
  assert.equal(session.score, 17);
});

test("the original stars and accuracy-plus-level reward formulas are exact", () => {
  assert.deepEqual([houseRescueStars(0), houseRescueStars(1), houseRescueStars(2), houseRescueStars(4), houseRescueStars(5)], [3, 3, 2, 2, 1]);
  assert.equal(houseRescueReward(1, 9, 0), 100);
  assert.equal(houseRescueReward(1, 9, 1), 96);
  assert.equal(houseRescueReward(51, 9, 0), 105);
  assert.equal(houseRescueReward(750, 30, 0), 170);
});

test("a perfect completion saves the home, campaign best, next level and one reconciled reward", () => {
  const { gameState, houseRescue, repository } = runtime();
  houseRescue.startLevel(1, { houseId: "house-1", returnPosition: { x: 305, y: 420 }, returnFacing: "left" });
  const result = houseRescue.qaComplete();
  assert.equal(result.ok, true);
  assert.equal(result.result.stars, 3);
  assert.equal(result.result.coins, 100);
  assert.equal(result.result.completionCoverage, 1);
  const state = gameState.getSnapshot();
  assert.equal(state.economy.coins, 200);
  assert.equal(state.economy.lifetimeCoinsEarned - state.economy.lifetimeCoinsSpent, state.economy.coins);
  assert.equal(state.economy.ledger.at(-1).kind, "house-rescue-job-reward");
  assert.deepEqual(state.houseRescue.best[1], { score: 18, stars: 3, mistakes: 0, completed: 1 });
  assert.equal(state.houseRescue.unlockedLevel, 2);
  assert.equal(state.houseRescue.completed, 1);
  assert.equal(state.houseRescue.active, null);
  assert.equal(state.houseRescue.homes["house-1"].dirty, false);
  assert.ok(state.houseRescue.homes["house-1"].nextDirtyDay >= 4 && state.houseRescue.homes["house-1"].nextDirtyDay <= 7);
  assert.equal(repository.load().state.houseRescue.completed, 1);
});

test("a dirty home cannot pay twice and another campaign level stays locked", () => {
  const { gameState, houseRescue } = runtime();
  assert.equal(houseRescue.startLevel(2, { houseId: "house-1" }).code, "level-locked");
  houseRescue.startLevel(1, { houseId: "house-1" });
  houseRescue.qaComplete();
  assert.equal(houseRescue.startLevel(1, { houseId: "house-1" }).code, "home-clean");
  assert.equal(gameState.getSnapshot().economy.coins, 200);
});

test("an in-progress sort and vacuum session reloads from the shared save", () => {
  const storage = new MemoryStorage();
  const repository = new SaveRepository(storage);
  const first = runtime({ repository });
  first.houseRescue.startLevel(1, { houseId: "house-1", returnPosition: { x: 300, y: 400 } });
  const item = first.houseRescue.getActiveSession().items[0];
  first.houseRescue.sortItem(item.id, item.category);
  const loaded = repository.load();
  const resumed = runtime({ state: loaded.state, repository });
  assert.equal(resumed.houseRescue.getActiveSession().correct, 1);
  assert.deepEqual(resumed.houseRescue.getActiveSession().returnPosition, { x: 300, y: 400 });
  assert.equal(resumed.houseRescue.startLevel(1, { houseId: "house-1" }).code, "house-rescue-resumed");
});

test("vacuum movement cleans swept reachable layers and requires 95 percent coverage", () => {
  const { houseRescue } = runtime();
  houseRescue.startLevel(1, { houseId: "house-1" });
  sortAll(houseRescue);
  const before = houseRescue.getActiveSession().dirt.reduce((sum, stain) => sum + stain.remaining, 0);
  const result = houseRescue.moveVacuum(74, 8);
  assert.equal(result.ok, true);
  assert.ok(result.cleanedLayers > 0);
  assert.ok(result.coverage > 0 && result.coverage < 0.95);
  const after = houseRescue.getActiveSession().dirt.reduce((sum, stain) => sum + stain.remaining, 0);
  assert.equal(after, before - result.cleanedLayers);
});

test("a persistence failure restores the exact pre-completion home, coins and active session", () => {
  let shouldFail = false;
  const repository = { save: () => shouldFail ? { ok: false, status: "write-failed" } : { ok: true, status: "saved" } };
  const { gameState, houseRescue } = runtime({ repository });
  houseRescue.startLevel(1, { houseId: "house-1" });
  sortAll(houseRescue);
  const before = gameState.getSnapshot();
  shouldFail = true;
  const failed = houseRescue.qaComplete();
  assert.equal(failed.code, "persistence-failed");
  assert.deepEqual(gameState.getSnapshot(), before);
  assert.equal(gameState.getSnapshot().economy.coins, 100);
  assert.equal(houseRescue.getActiveSession().phase, "vacuum");
  shouldFail = false;
  const retry = houseRescue.qaComplete();
  assert.equal(retry.ok, true);
  assert.equal(gameState.getSnapshot().economy.coins, 200);
});

test("completed homes respawn deterministically after three to six world days without exceeding five jobs", () => {
  const { gameState, houseRescue } = runtime();
  houseRescue.startLevel(1, { houseId: "house-1" });
  houseRescue.qaComplete();
  const dueDay = gameState.getSnapshot().houseRescue.homes["house-1"].nextDirtyDay;
  const next = gameState.getSnapshot();
  assert.ok(dueDay - next.world.day >= 3 && dueDay - next.world.day <= 6);
  next.houseRescue.homes["house-1"].nextDirtyDay = next.world.day;
  for (const home of Object.values(next.houseRescue.homes)) {
    if (home.houseId !== "house-1" && !home.dirty && home.nextDirtyDay > 0) home.nextDirtyDay = next.world.day + 10;
  }
  assert.equal(gameState.replace(next).ok, true);
  const refreshed = houseRescue.refreshJobs();
  assert.equal(refreshed.ok, true);
  assert.equal(gameState.getSnapshot().houseRescue.homes["house-1"].dirty, true);
  assert.ok(houseRescue.dirtyHomes().length <= HOUSE_RESCUE_RULES.maxDirtyHomes);
});

test("original zero-padded HTML House Rescue progress projects into current house identities", () => {
  const projected = projectLegacyHouseRescue({ houseRescue: { progression: { selectedLevel: 5, unlockedLevel: 6, best: { 5: { score: 22, stars: 2, mistakes: 3, completed: 2 } } }, homes: { "house-01": { dirty: false, jobSerial: 4, completionCount: 3, bestStars: 3 }, "house-06": { dirty: true, jobSerial: 2 } } } }, { day: 42 });
  assert.equal(projected.unlockedLevel, 6);
  assert.deepEqual(projected.best[5], { score: 22, stars: 2, mistakes: 3, completed: 2 });
  assert.equal(projected.homes["house-1"].jobSerial, 4);
  assert.equal(projected.homes["house-6"].dirty, true);
  assert.equal(projected.homes["house-19"].dirty, false);
});

test("schema 12 saves gain House Rescue while preserving the River campaign", () => {
  const old = createFreshGameState({ now: 0 });
  delete old.houseRescue;
  old.schemaVersion = 12;
  old.river.best[1] = { stars: 3, bestPercent: 100, bestPieces: 5 };
  old.river.completed = 1;
  old.river.totalStars = 3;
  old.river.restorationPoints = 400;
  const upgraded = upgradeGameState(old, { now: 0 });
  assert.equal(upgraded.schemaVersion, 14);
  assert.equal(upgraded.river.completed, 1);
  assert.equal(upgraded.houseRescue.unlockedLevel, 1);
  assert.equal(validateGameState(upgraded).ok, true);
});
