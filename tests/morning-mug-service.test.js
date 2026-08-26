import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  MORNING_MUG_APPLIANCES,
  MORNING_MUG_CHAPTERS,
  MORNING_MUG_CONFIG,
  MORNING_MUG_INGREDIENTS,
  MORNING_MUG_LEVELS,
  MORNING_MUG_RECIPES,
  morningMugFirstClearCoins,
} from "../src/data/morningMug.js";
import { createFreshGameState, GameStateService, upgradeGameState, validateGameState } from "../src/state/GameState.js";
import { projectLegacyMorningMug } from "../src/state/morningMugState.js";
import { SaveRepository } from "../src/state/SaveRepository.js";
import { MorningMugService } from "../src/systems/MorningMugService.js";
import { MemoryStorage } from "./helpers/MemoryStorage.js";

const LEVEL_CATALOGUE_HASH = "b79e265b92ae47f33afe5d43bfdaffa1165379e5eb054839c5b73cdc6ae00382";
const RECIPE_CATALOGUE_HASH = "1bea0c80efc64fffff6c85fea161ba39e9b576111ee101ec55cc93e9fb5faa53";

function runtime({ state = createFreshGameState({ now: 0 }), repository = new SaveRepository(new MemoryStorage()) } = {}) {
  const gameState = new GameStateService(state);
  const morningMug = new MorningMugService(gameState, repository, { now: () => 1000 });
  return { gameState, morningMug, repository };
}

function completeShift(morningMug, level = 1) {
  assert.equal(morningMug.startLevel(level, { instantOrders: true }).ok, true);
  let last;
  while (!morningMug.getActiveSession().finished) {
    const tray = morningMug.getActiveSession().trays.find((candidate) => candidate.orderId);
    assert.ok(tray);
    assert.equal(morningMug.selectTray(tray.index).ok, true);
    const recipe = morningMug.currentRecipe();
    for (const step of recipe.steps) assert.equal(morningMug.applyStep(step).ok, true);
    last = morningMug.serveActive();
    assert.equal(last.ok, true);
  }
  return last;
}

test("pins the exact protected Morning Mug catalogue, recipes and deterministic campaign", () => {
  assert.equal(MORNING_MUG_CONFIG.levelCount, 150);
  assert.equal(MORNING_MUG_CHAPTERS.length, 15);
  assert.equal(MORNING_MUG_LEVELS.length, 150);
  assert.equal(Object.keys(MORNING_MUG_RECIPES).length, 54);
  assert.equal(Object.keys(MORNING_MUG_INGREDIENTS).length, 28);
  assert.equal(Object.keys(MORNING_MUG_APPLIANCES).length, 5);
  assert.equal(MORNING_MUG_CONFIG.trayCount, 3);
  assert.equal(createHash("sha256").update(JSON.stringify(MORNING_MUG_LEVELS)).digest("hex"), LEVEL_CATALOGUE_HASH);
  assert.equal(createHash("sha256").update(JSON.stringify(MORNING_MUG_RECIPES)).digest("hex"), RECIPE_CATALOGUE_HASH);
  assert.deepEqual(MORNING_MUG_LEVELS[0].orders.map((order) => order.recipes), [["espressoSmall"], ["espressoSmall"], ["espressoSmall"]]);
  assert.equal(MORNING_MUG_LEVELS[19].name, "Morning Mug Master");
  assert.equal(MORNING_MUG_LEVELS[149].name, "Morning Mug Mastery · Chapter Challenge");
});

test("all 150 shifts satisfy the original chapter, order, timing and difficulty rules", () => {
  const usedRecipes = new Set();
  const plans = new Set();
  for (const level of MORNING_MUG_LEVELS) {
    assert.equal(level.chapter, Math.floor((level.level - 1) / 10) + 1);
    assert.equal(level.orders.length, level.target);
    assert.equal(level.maxMisses, 0);
    assert.ok(level.target >= 3 && level.target <= 6);
    const drinkCount = level.orders.reduce((sum, order) => sum + order.recipes.length, 0);
    if (level.level >= 21 && level.level <= 40) assert.ok(level.target === 5 && drinkCount >= 6 && drinkCount <= 7);
    if (level.level >= 41 && level.level <= 100) assert.ok(level.target === 6 && drinkCount >= 8 && drinkCount <= 10);
    if (level.level >= 101) assert.ok(level.target === 6 && drinkCount >= 11 && drinkCount <= 12);
    const customerOrders = new Set();
    for (const order of level.orders) {
      assert.ok(order.at < level.duration);
      assert.ok(order.recipes.length >= 1 && order.recipes.length <= 3);
      const signature = order.recipes.join("+");
      if (level.level > 20) assert.equal(customerOrders.has(signature), false);
      customerOrders.add(signature);
      for (const recipe of order.recipes) { assert.ok(MORNING_MUG_RECIPES[recipe]); usedRecipes.add(recipe); }
    }
    const plan = level.orders.map((order) => order.recipes.join("+")).join("|");
    assert.equal(plans.has(plan), false);
    plans.add(plan);
  }
  assert.equal(usedRecipes.size, 54);
  assert.equal(plans.size, 150);
  assert.equal(new Set(Object.values(MORNING_MUG_RECIPES).map((recipe) => recipe.steps.join(">"))).size, 54);
  assert.deepEqual(new Set(Object.values(MORNING_MUG_RECIPES).flatMap((recipe) => recipe.steps).filter((step) => ["smallCup", "mediumCup", "largeCup", "coldCup"].includes(step))), new Set(["smallCup", "mediumCup", "largeCup", "coldCup"]));
});

test("fresh Milestone 21 state is valid and keeps Morning Mug separate from Corner Café", () => {
  const state = createFreshGameState({ now: 0 });
  assert.equal(state.schemaVersion, 34);
  assert.equal(state.morningMug.unlockedLevel, 1);
  assert.equal(state.morningMug.activeShift, null);
  assert.equal(state.cafe.unlockedLevel, 1);
  assert.equal(validateGameState(state).ok, true);
});

test("a shift starts with three drink trays and creates an immediate resumable checkpoint", () => {
  const { gameState, morningMug, repository } = runtime();
  assert.equal(morningMug.startLevel(2).code, "level-locked");
  const started = morningMug.startLevel(1, { returnPosition: { x: 3460, y: 805 }, returnFacing: "down" });
  assert.equal(started.ok, true);
  assert.equal(started.session.activeOrderIds.length, 1);
  assert.equal(started.session.trays.length, 3);
  assert.equal(started.session.trays[0].orderId, "morning-mug-order-1");
  assert.deepEqual(started.session.returnPosition, { x: 3460, y: 805 });
  assert.equal(gameState.getSnapshot().morningMug.activeShift.level.level, 1);
  assert.equal(repository.load().state.morningMug.activeShift.level.level, 1);
});

test("drink trays enforce every exact ingredient and barista-station step", () => {
  const { morningMug } = runtime();
  morningMug.startLevel(1, { instantOrders: true });
  assert.equal(morningMug.expectedStep(), "smallCup");
  assert.equal(morningMug.applyStep("mediumCup").code, "wrong-step");
  assert.equal(morningMug.getActiveSession().mistakes, 1);
  for (const step of MORNING_MUG_RECIPES.espressoSmall.steps) assert.equal(morningMug.applyStep(step).ok, true);
  assert.equal(morningMug.serveActive().code, "customer-served");
});

test("undo and discard are isolated to the selected Morning Mug tray", () => {
  const { morningMug } = runtime();
  morningMug.startLevel(1, { instantOrders: true });
  const first = morningMug.expectedStep();
  morningMug.applyStep(first);
  assert.equal(morningMug.undoStep().removed, first);
  morningMug.applyStep(first);
  const discarded = morningMug.discardTray();
  assert.equal(discarded.ok, true);
  assert.equal(morningMug.getActiveSession().waste, 1);
  assert.equal(morningMug.getActiveSession().trays[1].stepIndex, 0);
});

test("Save & exit and a complete service reload resume the exact unfinished drink", () => {
  const storage = new MemoryStorage();
  const repository = new SaveRepository(storage);
  const first = runtime({ repository });
  first.morningMug.startLevel(1, { instantOrders: true, returnPosition: { x: 3460, y: 805 } });
  first.morningMug.applyStep("smallCup");
  first.morningMug.applyStep("coffeeBeans");
  first.morningMug.tick(1);
  const before = first.morningMug.getActiveSession();
  assert.equal(first.morningMug.suspend().ok, true);
  assert.equal(first.morningMug.getActiveSession(), null);

  const reloadedState = repository.load().state;
  const second = runtime({ state: reloadedState, repository });
  const resumed = second.morningMug.restorePersistedSession();
  assert.equal(resumed.ok, true);
  assert.equal(resumed.session.level.level, 1);
  assert.equal(resumed.session.elapsed, before.elapsed);
  assert.equal(resumed.expectedStep, "grinder");
  assert.deepEqual(resumed.session.returnPosition, { x: 3460, y: 805 });
  assert.equal(second.gameState.getSnapshot().morningMug.completed[1], undefined);
});

test("a perfect first clear pays the exact original reward once and never affects café progress", () => {
  const { gameState, morningMug, repository } = runtime();
  const result = completeShift(morningMug);
  assert.equal(result.result.won, true);
  assert.equal(result.result.stars, 3);
  assert.equal(result.result.firstClear, true);
  assert.equal(result.result.coins, morningMugFirstClearCoins(1, 3));
  assert.equal(result.result.coins, 62);
  const state = gameState.getSnapshot();
  assert.equal(state.economy.coins, 162);
  assert.equal(state.morningMug.unlockedLevel, 2);
  assert.equal(state.morningMug.lifetimeServed, 3);
  assert.equal(state.morningMug.activeShift, null);
  assert.equal(state.cafe.unlockedLevel, 1);
  assert.equal(repository.load().state.morningMug.completed[1], true);
  assert.equal(state.economy.ledger.at(-1).kind, "morning-mug-first-clear");

  const replay = completeShift(morningMug);
  assert.equal(replay.result.firstClear, false);
  assert.equal(replay.result.coins, 0);
  assert.equal(gameState.getSnapshot().economy.coins, 162);
});

test("one customer leaving immediately ends the no-miss shift with no unlock or reward", () => {
  const { gameState, morningMug } = runtime();
  morningMug.startLevel(1);
  let last;
  for (let second = 0; second < 140 && !morningMug.getActiveSession().finished; second += 1) last = morningMug.tick(1);
  assert.equal(last.result.won, false);
  assert.match(last.result.failureReason, /left/);
  assert.equal(gameState.getSnapshot().morningMug.unlockedLevel, 1);
  assert.equal(gameState.getSnapshot().economy.coins, 100);
  assert.equal(gameState.getSnapshot().morningMug.activeShift, null);
});

test("a failed final save restores the prepared order and cannot duplicate coins", () => {
  const storage = new MemoryStorage();
  const realRepository = new SaveRepository(storage);
  let failCompletion = true;
  const repository = {
    save(state, options) {
      if (failCompletion && state.morningMug.completed[1]) return { ok: false, status: "write-failed" };
      return realRepository.save(state, options);
    },
  };
  const { gameState, morningMug } = runtime({ repository });
  morningMug.startLevel(1, { instantOrders: true });
  let result;
  while (morningMug.getActiveSession().served < 3) {
    const tray = morningMug.getActiveSession().trays.find((candidate) => candidate.orderId);
    morningMug.selectTray(tray.index);
    for (const step of morningMug.currentRecipe().steps.slice(morningMug.tray().stepIndex)) morningMug.applyStep(step);
    result = morningMug.serveActive();
    if (!result.ok) break;
  }
  assert.equal(result.code, "persistence-failed");
  assert.equal(gameState.getSnapshot().economy.coins, 100);
  assert.equal(gameState.getSnapshot().morningMug.unlockedLevel, 1);
  assert.equal(morningMug.currentRecipe().steps.length, morningMug.tray().stepIndex);
  failCompletion = false;
  const retry = morningMug.serveActive();
  assert.equal(retry.ok, true);
  assert.equal(retry.result.firstClear, true);
  assert.equal(gameState.getSnapshot().economy.coins, 162);
});

test("legacy Morning Mug progress, including the completed pilot, projects separately", () => {
  const projected = projectLegacyMorningMug({
    unlockedLevel: 20,
    completed: { 1: true, 20: true },
    best: { 1: { score: 94, stars: 3, served: 3, accuracy: 100 }, 20: { score: 80, stars: 2, served: 5, accuracy: 90 } },
    shifts: 25,
  });
  assert.equal(projected.unlockedLevel, 21);
  assert.equal(projected.totalStars, 5);
  assert.equal(projected.shifts, 25);
  assert.equal(projected.activeShift, null);
});

test("schema 17 saves gain Morning Mug while preserving every prior milestone", () => {
  const old = createFreshGameState({ now: 0 });
  delete old.morningMug;
  old.schemaVersion = 17;
  old.playgroundPowerwash.progress.best[1] = { stars: 3, percent: 100 };
  old.playgroundPowerwash.progress.completed = 1;
  const upgraded = upgradeGameState(old, { now: 0 });
  assert.equal(upgraded.schemaVersion, 34);
  assert.equal(upgraded.morningMug.unlockedLevel, 1);
  assert.deepEqual(upgraded.playgroundPowerwash.progress.best[1], { stars: 3, percent: 100 });
  assert.equal(validateGameState(upgraded).ok, true);
});
