import test from "node:test";
import assert from "node:assert/strict";
import {
  FISHING_CONFIG,
  FISHING_SPOTS,
  MAGNET_FISHING_CONFIG,
  MAGNET_RARITY_ORDER,
  MAGNET_RECOVERY_CATALOG,
  ORNAMENTAL_FISH_IDS,
  TARGETING_CONFIG,
} from "../src/data/fishing.js";
import { createFreshGameState, GameStateService, upgradeGameState, validateGameState } from "../src/state/GameState.js";
import { projectLegacyFishing } from "../src/state/fishingState.js";
import { normalizeWorldState } from "../src/state/worldState.js";
import { SaveRepository } from "../src/state/SaveRepository.js";
import { FishingService } from "../src/systems/FishingService.js";
import { MemoryStorage } from "./helpers/MemoryStorage.js";

function runtime({ state = createFreshGameState({ now: 0 }), repository = new SaveRepository(new MemoryStorage()), random = () => 0.25 } = {}) {
  const gameState = new GameStateService(state);
  const fishing = new FishingService(gameState, repository, { now: () => 1000, random });
  return { gameState, fishing, repository };
}

function beginAtHiddenZone(fishing, mode = "fish", spotId = "fishing-commons") {
  const begun = fishing.begin(mode, mode === "magnet" ? "magnet-mill-bridge" : spotId, { returnPosition: { x: 10, y: 20 }, returnFacing: "left" });
  assert.equal(begun.ok, true);
  const zone = begun.session.hiddenZones[0];
  assert.equal(fishing.cast({ x: zone.x, y: zone.y }).ok, true);
  assert.equal(fishing.signalReady().ok, true);
  return begun;
}

test("pins the original three fishing spots, catch tables, targeting and two five-cast limits", () => {
  assert.equal(FISHING_SPOTS.length, 3);
  assert.deepEqual(FISHING_SPOTS.map((spot) => spot.catchTable.reduce((sum, entry) => sum + entry.weight, 0)), [100, 100, 100]);
  assert.deepEqual(FISHING_SPOTS.map((spot) => spot.catchTable.length), [2, 7, 3]);
  assert.equal(TARGETING_CONFIG.zonesPerSession, 3);
  assert.equal(FISHING_CONFIG.dailyCasts, 5);
  assert.equal(MAGNET_FISHING_CONFIG.dailyCasts, 5);
  assert.equal(Object.keys(MAGNET_RECOVERY_CATALOG).length, 8);
});

test("fresh Milestone 12 state is valid with separate fish and magnet progress", () => {
  const state = createFreshGameState({ now: 0 });
  assert.equal(state.schemaVersion, 22);
  assert.equal(validateGameState(state).ok, true);
  assert.equal(state.fishing.castsToday, 0);
  assert.equal(state.fishing.magnet.castsToday, 0);
  assert.equal(Object.keys(state.fishing.caughtByItem).length, 10);
});

test("casts outside the water use nothing, while all fishing spots share five daily casts", () => {
  const { fishing } = runtime();
  assert.equal(fishing.begin("fish", "fishing-commons").ok, true);
  assert.equal(fishing.cast({ x: 0, y: 0 }).code, "outside-water");
  assert.equal(fishing.castsLeft("fish"), 5);
  for (let cast = 0; cast < 5; cast += 1) {
    const session = fishing.getActiveSession();
    const point = { x: TARGETING_CONFIG.waterArea.x + 5 + cast, y: TARGETING_CONFIG.waterArea.y + 5 };
    assert.equal(fishing.cast(point).ok, true);
    assert.equal(fishing.signalReady().ok, true);
  }
  assert.equal(fishing.castsLeft("fish"), 0);
  assert.equal(fishing.cast({ x: 200, y: 200 }).code, "daily-limit");
});

test("a timed fish catch enters inventory exactly once and updates streaks", () => {
  const { gameState, fishing, repository } = runtime();
  beginAtHiddenZone(fishing);
  const result = fishing.reelFish({ quality: 0.95, forcedItemId: "river-minnows" });
  assert.equal(result.code, "fish-caught");
  assert.equal(result.excellent, true);
  assert.equal(gameState.getSnapshot().inventory.consumables["river-minnows"], 1);
  assert.equal(gameState.getSnapshot().fishing.totalCaught, 1);
  assert.equal(gameState.getSnapshot().fishing.currentStreak, 1);
  assert.equal(fishing.reelFish({ forcedItemId: "river-minnows" }).code, "no-bite");
  assert.equal(repository.load().state.inventory.consumables["river-minnows"], 1);
});

test("ornamental Reedbank catches are recorded and safely released until the home aquarium milestone", () => {
  const { gameState, fishing } = runtime();
  beginAtHiddenZone(fishing, "fish", "fishing-reedbank");
  const result = fishing.reelFish({ forcedItemId: "reedbank-koi" });
  assert.equal(result.ok, true);
  assert.equal(result.disposition, "released-home-system-pending");
  assert.equal(gameState.getSnapshot().fishing.releasedByItem["reedbank-koi"], 1);
  assert.equal(gameState.getSnapshot().inventory.consumables["reedbank-koi"], undefined);
});

test("safe cancellation preserves a used cast but never grants a pending catch", () => {
  const { gameState, fishing } = runtime();
  const begun = fishing.begin("fish", "fishing-commons", { returnPosition: { x: 1270, y: 1180 }, returnFacing: "down" });
  const zone = begun.session.hiddenZones[0];
  fishing.cast(zone);
  const cancelled = fishing.cancel();
  assert.equal(cancelled.ok, true);
  assert.deepEqual(cancelled.session.returnPosition, { x: 1270, y: 1180 });
  assert.equal(gameState.getSnapshot().fishing.castsToday, 1);
  assert.equal(gameState.getSnapshot().fishing.totalCaught, 0);
});

test("magnet recovery records a named collection find and reconciled coin ledger once", () => {
  const { gameState, fishing, repository } = runtime();
  beginAtHiddenZone(fishing, "magnet");
  const result = fishing.retrieveMagnet({ forcedRecoveryId: "sealed-coin-tin" });
  assert.equal(result.code, "magnet-recovered");
  assert.equal(result.rewardCoins, 350);
  const state = gameState.getSnapshot();
  assert.equal(state.economy.coins, 450);
  assert.equal(state.economy.lifetimeCoinsEarned, 450);
  assert.equal(state.fishing.magnet.recoveredByItem["sealed-coin-tin"], 1);
  assert.equal(state.economy.ledger.at(-1).kind, "magnet-recovery");
  assert.equal(fishing.retrieveMagnet().code, "magnet-not-ready");
  assert.equal(repository.load().state.economy.coins, 450);
});

test("empty magnet water awards no coins and advances both pity counters", () => {
  const { gameState, fishing } = runtime();
  fishing.begin("magnet", "magnet-mill-bridge");
  fishing.cast({ x: TARGETING_CONFIG.waterArea.x + 2, y: TARGETING_CONFIG.waterArea.y + 2 });
  fishing.signalReady();
  const result = fishing.retrieveMagnet();
  assert.equal(result.code, "magnet-empty");
  assert.equal(result.rewardCoins, 0);
  assert.equal(gameState.getSnapshot().economy.coins, 100);
  assert.equal(gameState.getSnapshot().fishing.magnet.pullsWithoutRare, 1);
});

test("the twelfth dry pull guarantees rare-or-better and the fortieth guarantees treasure-or-better", () => {
  for (const [counter, value, minimum] of [["pullsWithoutRare", 11, "rare"], ["pullsWithoutTreasure", 39, "treasure"]]) {
    const state = createFreshGameState({ now: 0 });
    Object.assign(state.fishing.magnet, { totalCasts: value, totalPulls: value, [counter]: value });
    const { fishing } = runtime({ state, random: () => 0 });
    beginAtHiddenZone(fishing, "magnet");
    const result = fishing.retrieveMagnet();
    assert.equal(result.ok, true);
    assert.ok(MAGNET_RARITY_ORDER[result.recovery.rarity] >= MAGNET_RARITY_ORDER[minimum]);
  }
});

test("the two daily limits reset together on the next game day", () => {
  const state = createFreshGameState({ now: 0 });
  Object.assign(state.fishing, { castsToday: 5, totalCasts: 5 });
  Object.assign(state.fishing.magnet, { castsToday: 5, totalCasts: 5 });
  const { gameState, fishing } = runtime({ state });
  const next = gameState.getSnapshot();
  next.world = normalizeWorldState({ ...next.world, day: 2, clockMinutes: 420 }, { now: 2000 });
  assert.equal(gameState.replace(next).ok, true);
  assert.equal(fishing.refresh({ persist: false }).ok, true);
  assert.equal(fishing.castsLeft("fish"), 5);
  assert.equal(fishing.castsLeft("magnet"), 5);
});

test("persistence failure rolls a cast or reward back without duplication", () => {
  const castFailure = runtime({ repository: { save: () => ({ ok: false, status: "write-failed" }) } });
  const begun = castFailure.fishing.begin("fish", "fishing-commons");
  const result = castFailure.fishing.cast(begun.session.hiddenZones[0]);
  assert.equal(result.code, "persistence-failed");
  assert.equal(castFailure.gameState.getSnapshot().fishing.totalCasts, 0);
  assert.equal(castFailure.fishing.getActiveSession().phase, "idle");

  let saves = 0;
  const rewardFailure = runtime({ repository: { save: () => (++saves === 1 ? { ok: true, status: "saved" } : { ok: false, status: "write-failed" }) } });
  beginAtHiddenZone(rewardFailure.fishing);
  const before = rewardFailure.gameState.getSnapshot();
  const failedReward = rewardFailure.fishing.reelFish({ forcedItemId: "river-minnows" });
  assert.equal(failedReward.code, "persistence-failed");
  assert.deepEqual(rewardFailure.gameState.getSnapshot(), before);
});

test("legacy fishing and magnet records project into schema 9 without ornamental inventory leakage", () => {
  const world = createFreshGameState({ now: 0 }).world;
  const projected = projectLegacyFishing({
    day: 1, castsToday: 2, caughtToday: 1, totalCasts: 6, totalCaught: 4, currentStreak: 1, bestStreak: 3,
    caughtByItem: { "river-minnows": 2, "reedbank-koi": 1 }, aquariumByItem: { "reedbank-koi": 2 }, releasedByItem: { "reedbank-koi": 1 },
  }, {
    day: 1, castsToday: 1, pullsToday: 1, totalCasts: 3, totalPulls: 2, totalCoinsEarned: 30,
    recoveredByItem: { "old-bolt": 1 }, lastCatchId: "old-bolt", bestCatchId: "old-bolt",
  }, world);
  assert.equal(projected.caughtByItem["river-minnows"], 2);
  assert.equal(projected.releasedByItem["reedbank-koi"], 3);
  assert.equal(projected.magnet.lastCatchId, "old-bolt");
  assert.equal(Object.keys(projected.releasedByItem).length, ORNAMENTAL_FISH_IDS.length);
});

test("schema 8 saves gain fishing while preserving all prior milestone state", () => {
  const old = createFreshGameState({ now: 0 });
  delete old.fishing;
  old.schemaVersion = 8;
  old.identity.townName = "Angler's Rest";
  const upgraded = upgradeGameState(old, { now: 1000 });
  assert.equal(upgraded.schemaVersion, 22);
  assert.equal(upgraded.identity.townName, "Angler's Rest");
  assert.equal(upgraded.fishing.castsToday, 0);
  assert.equal(validateGameState(upgraded).ok, true);
});
