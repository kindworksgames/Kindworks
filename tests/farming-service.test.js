import test from "node:test";
import assert from "node:assert/strict";
import { FARMING_CROPS, LAWN_CONFIG, ORCHARD_CONFIG } from "../src/data/farming.js";
import { getWeatherForDay } from "../src/data/worldSimulation.js";
import { createFreshGameState, GameStateService, upgradeGameState, validateGameState } from "../src/state/GameState.js";
import { SaveRepository } from "../src/state/SaveRepository.js";
import { createFreshFarmingState } from "../src/state/farmingState.js";
import { advanceWorldState, normalizeWorldState } from "../src/state/worldState.js";
import { FarmingService } from "../src/systems/FarmingService.js";
import { MemoryStorage } from "./helpers/MemoryStorage.js";

function runtime({ repository = new SaveRepository(new MemoryStorage()), state = createFreshGameState({ now: 0 }) } = {}) {
  const gameState = new GameStateService(state);
  const farming = new FarmingService(gameState, repository, { now: () => 1000 });
  return { gameState, farming, repository };
}

function stateAtDay(day) {
  const state = createFreshGameState({ now: 0 });
  state.world = normalizeWorldState({ day, clockMinutes: 0, simulation: { lastResolvedAt: new Date(0).toISOString() } }, { now: 0 });
  state.farming = createFreshFarmingState(state.world);
  return state;
}

test("fresh Milestone 10 state has six beds, one starter seed, one ripe apple and one lawn job", () => {
  const state = createFreshGameState({ now: 0 });
  assert.equal(validateGameState(state).ok, true);
  assert.equal(state.schemaVersion, 22);
  assert.equal(state.farming.allotment.beds.length, 6);
  assert.equal(state.farming.allotment.unlockedBeds, 1);
  assert.equal(state.inventory.consumables["carrot-seeds"], 1);
  assert.equal(state.farming.orchard.trees[0].availableFruit, 1);
  const { farming } = runtime({ state });
  assert.equal(farming.getDiagnostics().activeLawnJobs, 1);
});

test("seed purchase and planting are atomic across coins, inventory and a bed", () => {
  const { gameState, farming, repository } = runtime();
  assert.equal(farming.purchaseSeed("carrot").ok, true);
  assert.equal(gameState.getSnapshot().economy.coins, 70);
  assert.equal(gameState.getSnapshot().inventory.consumables["carrot-seeds"], 2);
  const planted = farming.plant("allotment-bed-1", "carrot");
  assert.equal(planted.ok, true);
  assert.equal(planted.ledger.kind, "consume");
  assert.equal(planted.ledger.itemId, "carrot-seeds");
  assert.equal(planted.ledger.balance, 70);
  const state = gameState.getSnapshot();
  assert.equal(state.inventory.consumables["carrot-seeds"], 1);
  assert.equal(state.farming.allotment.beds[0].status, "growing");
  assert.equal(repository.load().state.farming.allotment.beds[0].cropId, "carrot");
  assert.equal(repository.load().state.economy.ledger.at(-1).reason, "Planted Carrot Seeds");
});

test("rain advances a planted crop faster than clear weather for the same game time", () => {
  let rainDay = 1;
  let clearDay = 1;
  while (getWeatherForDay(rainDay).kind !== "rain") rainDay += 1;
  while (getWeatherForDay(clearDay).kind !== "clear") clearDay += 1;
  const rain = runtime({ state: stateAtDay(rainDay) });
  const clear = runtime({ state: stateAtDay(clearDay) });
  assert.equal(rain.farming.plant("allotment-bed-1", "carrot").ok, true);
  assert.equal(clear.farming.plant("allotment-bed-1", "carrot").ok, true);
  for (const current of [rain, clear]) {
    const state = current.gameState.getSnapshot();
    state.world = advanceWorldState(state.world, 60, { now: 60_000 }).world;
    assert.equal(current.gameState.replace(state).ok, true);
    assert.equal(current.farming.refresh({ persist: false }).ok, true);
  }
  const rainGrowth = rain.gameState.getSnapshot().farming.allotment.beds[0].growthMinutes;
  const clearGrowth = clear.gameState.getSnapshot().farming.allotment.beds[0].growthMinutes;
  assert.ok(rainGrowth > clearGrowth);
  assert.equal(rainGrowth, 60 * getWeatherForDay(rainDay).growth);
});

test("a ready crop harvest adds the original yield and resets only its own bed", () => {
  const { gameState, farming } = runtime();
  const state = gameState.getSnapshot();
  state.farming.allotment.beds[0] = { ...state.farming.allotment.beds[0], cropId: "carrot", status: "ready", growthMinutes: FARMING_CROPS.carrot.growMinutes };
  assert.equal(gameState.replace(state).ok, true);
  const result = farming.harvest("allotment-bed-1");
  assert.equal(result.ok, true);
  assert.equal(result.quantity, 6);
  assert.equal(gameState.getSnapshot().inventory.consumables["allotment-carrot"], 6);
  assert.equal(gameState.getSnapshot().farming.allotment.beds[0].status, "empty");
  assert.equal(gameState.getSnapshot().farming.allotment.beds[1].status, "empty");
});

test("orchard harvest collects exactly one apple and cannot duplicate before regrowth", () => {
  const { gameState, farming } = runtime();
  assert.equal(farming.harvestApple().ok, true);
  assert.equal(gameState.getSnapshot().inventory.consumables["orchard-apple"], 1);
  assert.equal(gameState.getSnapshot().farming.orchard.trees[0].fruitProgressMinutes, 0);
  assert.equal(farming.harvestApple().code, "fruit-not-ready");
  assert.equal(gameState.getSnapshot().inventory.consumables["orchard-apple"], 1);
  assert.equal(ORCHARD_CONFIG.productionMinutes, 720);
});

test("lawn care pays once, records the job and regrows from the freshly cut state", () => {
  const { gameState, farming } = runtime();
  const result = farming.completeLawnJob("lawn-house-1");
  assert.equal(result.ok, true);
  assert.equal(result.rewardCoins, 100);
  assert.equal(gameState.getSnapshot().economy.coins, 200);
  assert.equal(gameState.getSnapshot().progress.completedJobCount, 1);
  assert.equal(gameState.getSnapshot().farming.lawns["lawn-house-1"].grassHeight, LAWN_CONFIG.freshlyCutHeight);
  assert.equal(farming.completeLawnJob("lawn-house-1").code, "lawn-tidy");
  assert.equal(gameState.getSnapshot().economy.coins, 200);
});

test("a save failure rolls a farming transaction back completely", () => {
  const repository = { save: () => ({ ok: false, status: "write-failed" }) };
  const { gameState, farming } = runtime({ repository });
  const before = gameState.getSnapshot();
  const result = farming.completeLawnJob("lawn-house-1");
  assert.equal(result.code, "persistence-failed");
  assert.equal(result.rollbackOk, true);
  assert.deepEqual(gameState.getSnapshot(), before);
});

test("schema 6 saves gain farming without losing the preceding milestone systems", () => {
  const old = createFreshGameState({ now: 0 });
  delete old.farming;
  old.schemaVersion = 6;
  old.identity.townName = "Keeperton";
  const upgraded = upgradeGameState(old, { now: 1000 });
  assert.equal(upgraded.schemaVersion, 22);
  assert.equal(upgraded.identity.townName, "Keeperton");
  assert.equal(upgraded.farming.allotment.beds.length, 6);
  assert.equal(validateGameState(upgraded).ok, true);
});
