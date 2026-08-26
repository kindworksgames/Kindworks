import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  RIVERSIDE_KITCHEN_APPLIANCES,
  RIVERSIDE_KITCHEN_CHAPTERS,
  RIVERSIDE_KITCHEN_CONFIG,
  RIVERSIDE_KITCHEN_INGREDIENTS,
  RIVERSIDE_KITCHEN_LEVELS,
  RIVERSIDE_KITCHEN_RECIPES,
  riversideKitchenFirstClearCoins,
} from "../src/data/riversideKitchen.js";
import { createFreshGameState, GameStateService, upgradeGameState, validateGameState } from "../src/state/GameState.js";
import { projectLegacyRiversideKitchen } from "../src/state/riversideKitchenState.js";
import { SaveRepository } from "../src/state/SaveRepository.js";
import { RiversideKitchenService } from "../src/systems/RiversideKitchenService.js";
import { MemoryStorage } from "./helpers/MemoryStorage.js";

const LEVEL_CATALOGUE_HASH = "2d8ce55dcf3d337548d0f878170e8b5e4310214a20431e5fee63272b24e1e5ce";
const RECIPE_CATALOGUE_HASH = "27f05b0070b521cc3d08d74403968fa7d6d982ab3a1bc6911b2f68b76c5fdd9a";

function runtime({ state = createFreshGameState({ now: 0 }), repository = new SaveRepository(new MemoryStorage()) } = {}) {
  const gameState = new GameStateService(state);
  const riversideKitchen = new RiversideKitchenService(gameState, repository, { now: () => 1000 });
  return { gameState, riversideKitchen, repository };
}

function completeShift(riversideKitchen, level = 1) {
  assert.equal(riversideKitchen.startLevel(level, { instantOrders: true }).ok, true);
  let last;
  while (!riversideKitchen.getActiveSession().finished) {
    const tray = riversideKitchen.getActiveSession().trays.find((candidate) => candidate.orderId);
    assert.ok(tray);
    assert.equal(riversideKitchen.selectTray(tray.index).ok, true);
    const recipe = riversideKitchen.currentRecipe();
    for (const step of recipe.steps) assert.equal(riversideKitchen.applyStep(step).ok, true);
    last = riversideKitchen.serveActive();
    assert.equal(last.ok, true);
  }
  return last;
}

test("pins the exact protected Riverside Kitchen catalogue, recipes and deterministic campaign", () => {
  assert.equal(RIVERSIDE_KITCHEN_CONFIG.levelCount, 150);
  assert.equal(RIVERSIDE_KITCHEN_CHAPTERS.length, 15);
  assert.equal(RIVERSIDE_KITCHEN_LEVELS.length, 150);
  assert.equal(Object.keys(RIVERSIDE_KITCHEN_RECIPES).length, 32);
  assert.equal(Object.keys(RIVERSIDE_KITCHEN_INGREDIENTS).length, 58);
  assert.equal(Object.keys(RIVERSIDE_KITCHEN_APPLIANCES).length, 9);
  assert.equal(RIVERSIDE_KITCHEN_CONFIG.trayCount, 3);
  assert.equal(createHash("sha256").update(JSON.stringify(RIVERSIDE_KITCHEN_LEVELS)).digest("hex"), LEVEL_CATALOGUE_HASH);
  assert.equal(createHash("sha256").update(JSON.stringify(RIVERSIDE_KITCHEN_RECIPES)).digest("hex"), RECIPE_CATALOGUE_HASH);
  assert.deepEqual(RIVERSIDE_KITCHEN_LEVELS[0].orders.map((order) => order.recipes), [["burger"], ["burger"], ["burger"]]);
  assert.equal(RIVERSIDE_KITCHEN_LEVELS[19].name, "Kitchen Master");
  assert.equal(RIVERSIDE_KITCHEN_LEVELS[149].name, "Kitchen Mastery · Chapter Challenge");
});

test("all 150 shifts satisfy the original chapters, timing and diner difficulty tiers", () => {
  const usedRecipes = new Set();
  const plans = new Set();
  for (const level of RIVERSIDE_KITCHEN_LEVELS) {
    assert.equal(level.chapter, Math.floor((level.level - 1) / 10) + 1);
    assert.equal(level.orders.length, level.target);
    assert.equal(level.maxMisses, 0);
    assert.ok(level.target >= 3 && level.target <= 6);
    const mealCount = level.orders.reduce((sum, order) => sum + order.recipes.length, 0);
    if (level.level >= 21 && level.level <= 40) assert.ok(level.target === 5 && mealCount >= 6 && mealCount <= 7);
    if (level.level >= 41 && level.level <= 100) assert.ok(level.target === 6 && mealCount >= 8 && mealCount <= 10);
    if (level.level >= 101) assert.ok(level.target === 6 && mealCount >= 11 && mealCount <= 12);
    const dinerOrders = new Set();
    for (const order of level.orders) {
      assert.ok(order.at < level.duration);
      assert.ok(order.recipes.length >= 1 && order.recipes.length <= 3);
      const signature = order.recipes.join("+");
      if (level.level > 20) assert.equal(dinerOrders.has(signature), false);
      dinerOrders.add(signature);
      for (const recipe of order.recipes) { assert.ok(RIVERSIDE_KITCHEN_RECIPES[recipe]); usedRecipes.add(recipe); }
    }
    const plan = level.orders.map((order) => order.recipes.join("+")).join("|");
    assert.equal(plans.has(plan), false);
    plans.add(plan);
  }
  assert.equal(usedRecipes.size, 32);
  assert.equal(plans.size, 150);
  assert.equal(new Set(Object.values(RIVERSIDE_KITCHEN_RECIPES).map((recipe) => recipe.steps.join(">"))).size, 32);
});

test("every ingredient and all nine preparation and exact-heat stations are used", () => {
  const sequence = Object.values(RIVERSIDE_KITCHEN_RECIPES).flatMap((recipe) => recipe.steps);
  const usedIngredients = new Set(sequence.filter((step) => RIVERSIDE_KITCHEN_INGREDIENTS[step]));
  const usedAppliances = new Set(sequence.filter((step) => RIVERSIDE_KITCHEN_APPLIANCES[step]));
  assert.equal(usedIngredients.size, 58);
  assert.deepEqual(usedAppliances, new Set(["panMedium", "potBoil", "potSimmer", "prepBoard", "panLow", "grillMedium", "grillHigh", "panHigh", "ovenRoast"]));
  assert.deepEqual(RIVERSIDE_KITCHEN_RECIPES.burger.steps, ["plate", "bunBottom", "beefPatty", "panMedium", "lettuce", "tomato", "ketchup", "bunTop"]);
  assert.ok(RIVERSIDE_KITCHEN_RECIPES.roastDinner.steps.includes("ovenRoast"));
  assert.ok(RIVERSIDE_KITCHEN_RECIPES.soup.steps.includes("potSimmer"));
});

test("fresh Milestone 22 state is valid and separate from Café and Morning Mug", () => {
  const state = createFreshGameState({ now: 0 });
  assert.equal(state.schemaVersion, 28);
  assert.equal(state.riversideKitchen.unlockedLevel, 1);
  assert.equal(state.riversideKitchen.activeShift, null);
  assert.equal(state.cafe.unlockedLevel, 1);
  assert.equal(state.morningMug.unlockedLevel, 1);
  assert.equal(validateGameState(state).ok, true);
});

test("a shift starts with three meal trays and creates an immediate resumable checkpoint", () => {
  const { gameState, riversideKitchen, repository } = runtime();
  assert.equal(riversideKitchen.startLevel(2).code, "level-locked");
  const started = riversideKitchen.startLevel(1, { returnPosition: { x: 2900, y: 805 }, returnFacing: "down" });
  assert.equal(started.ok, true);
  assert.equal(started.session.activeOrderIds.length, 1);
  assert.equal(started.session.trays.length, 3);
  assert.equal(started.session.trays[0].orderId, "riverside-kitchen-order-1");
  assert.deepEqual(started.session.returnPosition, { x: 2900, y: 805 });
  assert.equal(gameState.getSnapshot().riversideKitchen.activeShift.level.level, 1);
  assert.equal(repository.load().state.riversideKitchen.activeShift.level.level, 1);
});

test("meal trays enforce plating, preparation and the exact heat setting", () => {
  const { riversideKitchen } = runtime();
  riversideKitchen.startLevel(1, { instantOrders: true });
  assert.equal(riversideKitchen.expectedStep(), "plate");
  assert.equal(riversideKitchen.applyStep("bowl").code, "wrong-step");
  assert.equal(riversideKitchen.getActiveSession().mistakes, 1);
  for (const step of ["plate", "bunBottom", "beefPatty"]) assert.equal(riversideKitchen.applyStep(step).ok, true);
  assert.equal(riversideKitchen.expectedStep(), "panMedium");
  assert.equal(riversideKitchen.applyStep("panHigh").code, "wrong-step");
  assert.equal(riversideKitchen.expectedStep(), "panMedium");
  const burnt = riversideKitchen.recordBurn();
  assert.equal(burnt.code, "station-burnt");
  assert.equal(burnt.waste, 1);
  assert.equal(burnt.mistakes, 3);
  assert.equal(riversideKitchen.expectedStep(), "panMedium");
  for (const step of RIVERSIDE_KITCHEN_RECIPES.burger.steps.slice(3)) assert.equal(riversideKitchen.applyStep(step).ok, true);
  assert.equal(riversideKitchen.serveActive().code, "diner-served");
});

test("undo and discard are isolated to the selected Riverside Kitchen tray", () => {
  const { riversideKitchen } = runtime();
  riversideKitchen.startLevel(1, { instantOrders: true });
  const first = riversideKitchen.expectedStep();
  riversideKitchen.applyStep(first);
  assert.equal(riversideKitchen.undoStep().removed, first);
  riversideKitchen.applyStep(first);
  const discarded = riversideKitchen.discardTray();
  assert.equal(discarded.ok, true);
  assert.equal(riversideKitchen.getActiveSession().waste, 1);
  assert.equal(riversideKitchen.getActiveSession().trays[1].stepIndex, 0);
});

test("Save & exit and a complete reload resume the exact unfinished meal", () => {
  const storage = new MemoryStorage();
  const repository = new SaveRepository(storage);
  const first = runtime({ repository });
  first.riversideKitchen.startLevel(1, { instantOrders: true, returnPosition: { x: 2900, y: 805 } });
  first.riversideKitchen.applyStep("plate");
  first.riversideKitchen.applyStep("bunBottom");
  first.riversideKitchen.applyStep("beefPatty");
  first.riversideKitchen.tick(1);
  const before = first.riversideKitchen.getActiveSession();
  assert.equal(first.riversideKitchen.suspend().ok, true);
  assert.equal(first.riversideKitchen.getActiveSession(), null);

  const second = runtime({ state: repository.load().state, repository });
  const resumed = second.riversideKitchen.restorePersistedSession();
  assert.equal(resumed.ok, true);
  assert.equal(resumed.session.level.level, 1);
  assert.equal(resumed.session.elapsed, before.elapsed);
  assert.equal(resumed.expectedStep, "panMedium");
  assert.deepEqual(resumed.session.returnPosition, { x: 2900, y: 805 });
  assert.equal(second.gameState.getSnapshot().riversideKitchen.completed[1], undefined);
});

test("a perfect first clear pays the exact original reward once and leaves other venues unchanged", () => {
  const { gameState, riversideKitchen, repository } = runtime();
  const result = completeShift(riversideKitchen);
  assert.equal(result.result.won, true);
  assert.equal(result.result.stars, 3);
  assert.equal(result.result.firstClear, true);
  assert.equal(result.result.coins, riversideKitchenFirstClearCoins(1, 3));
  assert.equal(result.result.coins, 81);
  const state = gameState.getSnapshot();
  assert.equal(state.economy.coins, 181);
  assert.equal(state.riversideKitchen.unlockedLevel, 2);
  assert.equal(state.riversideKitchen.lifetimeServed, 3);
  assert.equal(state.riversideKitchen.activeShift, null);
  assert.equal(state.cafe.unlockedLevel, 1);
  assert.equal(state.morningMug.unlockedLevel, 1);
  assert.equal(repository.load().state.riversideKitchen.completed[1], true);
  assert.equal(state.economy.ledger.at(-1).kind, "riverside-kitchen-first-clear");

  const replay = completeShift(riversideKitchen);
  assert.equal(replay.result.firstClear, false);
  assert.equal(replay.result.coins, 0);
  assert.equal(gameState.getSnapshot().economy.coins, 181);
});

test("one diner leaving immediately ends the no-miss shift with no unlock or reward", () => {
  const { gameState, riversideKitchen } = runtime();
  riversideKitchen.startLevel(1);
  let last;
  for (let second = 0; second < 180 && !riversideKitchen.getActiveSession().finished; second += 1) last = riversideKitchen.tick(1);
  assert.equal(last.result.won, false);
  assert.match(last.result.failureReason, /left/);
  assert.equal(gameState.getSnapshot().riversideKitchen.unlockedLevel, 1);
  assert.equal(gameState.getSnapshot().economy.coins, 100);
  assert.equal(gameState.getSnapshot().riversideKitchen.activeShift, null);
});

test("a failed final save restores the plated meal and cannot duplicate coins", () => {
  const storage = new MemoryStorage();
  const realRepository = new SaveRepository(storage);
  let failCompletion = true;
  const repository = {
    save(state, options) {
      if (failCompletion && state.riversideKitchen.completed[1]) return { ok: false, status: "write-failed" };
      return realRepository.save(state, options);
    },
  };
  const { gameState, riversideKitchen } = runtime({ repository });
  riversideKitchen.startLevel(1, { instantOrders: true });
  let result;
  while (riversideKitchen.getActiveSession().served < 3) {
    const tray = riversideKitchen.getActiveSession().trays.find((candidate) => candidate.orderId);
    riversideKitchen.selectTray(tray.index);
    for (const step of riversideKitchen.currentRecipe().steps.slice(riversideKitchen.tray().stepIndex)) riversideKitchen.applyStep(step);
    result = riversideKitchen.serveActive();
    if (!result.ok) break;
  }
  assert.equal(result.code, "persistence-failed");
  assert.equal(gameState.getSnapshot().economy.coins, 100);
  assert.equal(gameState.getSnapshot().riversideKitchen.unlockedLevel, 1);
  assert.equal(riversideKitchen.currentRecipe().steps.length, riversideKitchen.tray().stepIndex);
  failCompletion = false;
  const retry = riversideKitchen.serveActive();
  assert.equal(retry.ok, true);
  assert.equal(retry.result.firstClear, true);
  assert.equal(gameState.getSnapshot().economy.coins, 181);
});

test("legacy Riverside Kitchen progress, including the completed pilot, projects separately", () => {
  const projected = projectLegacyRiversideKitchen({
    unlockedLevel: 20,
    completed: { 1: true, 20: true },
    best: { 1: { score: 95, stars: 3, served: 3, accuracy: 100 }, 20: { score: 84, stars: 2, served: 5, accuracy: 90 } },
    shifts: 27,
  });
  assert.equal(projected.unlockedLevel, 21);
  assert.equal(projected.totalStars, 5);
  assert.equal(projected.shifts, 27);
  assert.equal(projected.activeShift, null);
});

test("schema 18 saves gain Riverside Kitchen while preserving Milestone 21", () => {
  const old = createFreshGameState({ now: 0 });
  delete old.riversideKitchen;
  old.schemaVersion = 18;
  old.morningMug.completed[1] = true;
  old.morningMug.best[1] = { score: 100, stars: 3, served: 3, accuracy: 100 };
  old.morningMug.totalStars = 3;
  const upgraded = upgradeGameState(old, { now: 0 });
  assert.equal(upgraded.schemaVersion, 28);
  assert.equal(upgraded.riversideKitchen.unlockedLevel, 1);
  assert.deepEqual(upgraded.morningMug.best[1], { score: 100, stars: 3, served: 3, accuracy: 100 });
  assert.equal(validateGameState(upgraded).ok, true);
});
