import test from "node:test";
import assert from "node:assert/strict";
import {
  LIGHTING_CONFIG,
  WORLD_TIME_CONFIG,
  formatWorldClock,
  getLightingForMinutes,
  getSeasonForDay,
  getWeatherForDay,
} from "../src/data/worldSimulation.js";
import { createFreshGameState, GameStateService, upgradeGameState, validateGameState } from "../src/state/GameState.js";
import { advanceWorldState, validateWorldState } from "../src/state/worldState.js";
import { WorldSimulationService } from "../src/systems/WorldSimulationService.js";

class RecordingRepository {
  constructor() {
    this.saves = [];
  }

  save(state, options) {
    this.saves.push({ state: structuredClone(state), options });
    return { ok: true, status: "saved" };
  }
}

test("keeps the legacy 24-real-minute day and 28-day seasons", () => {
  assert.equal(WORLD_TIME_CONFIG.gameMinutesPerRealSecond, 1);
  assert.equal(WORLD_TIME_CONFIG.startMinute, 420);
  assert.deepEqual(getSeasonForDay(1), { id: "spring", index: 0, dayInSeason: 1 });
  assert.deepEqual(getSeasonForDay(29), { id: "summer", index: 1, dayInSeason: 1 });
  assert.deepEqual(getSeasonForDay(85), { id: "winter", index: 3, dayInSeason: 1 });
});

test("produces deterministic daily weather with complete farming and movement signals", () => {
  const first = getWeatherForDay(42);
  const second = getWeatherForDay(42);
  assert.deepEqual(first, second);
  assert.ok(["clear", "rain", "windy", "snow"].includes(first.kind));
  assert.equal(first.day, 42);
  assert.equal(typeof first.temperatureC, "number");
  assert.equal(typeof first.growth, "number");
  assert.equal(typeof first.weeds, "number");
  assert.equal(typeof first.windAngle, "number");
});

test("matches the original dawn, day, dusk, and night lighting curve", () => {
  assert.equal(getLightingForMinutes(4 * 60).phase, "night");
  assert.equal(getLightingForMinutes(6 * 60).phase, "dawn");
  assert.equal(getLightingForMinutes(7 * 60).phase, "day");
  assert.equal(getLightingForMinutes(19 * 60).phase, "dusk");
  assert.equal(getLightingForMinutes(20 * 60).phase, "night");
  assert.equal(getLightingForMinutes(4 * 60).overlayAlpha, LIGHTING_CONFIG.maxOverlayAlpha);
  assert.equal(formatWorldClock(425), "07:05");
});

test("advances across days in one aggregate operation and keeps bounded weather history", () => {
  const state = createFreshGameState({ now: 0 });
  const result = advanceWorldState(state.world, 35 * 1440 + 90, { now: 1000 });
  assert.equal(result.world.day, 36);
  assert.equal(result.world.clockMinutes, 510);
  assert.equal(result.world.weather.current.day, 36);
  assert.equal(result.world.weather.history.length, 32);
  assert.equal(validateWorldState(result.world).ok, true);
});

test("upgrades schema 3 saves with a simulation timestamp without losing time", () => {
  const oldState = createFreshGameState({ now: 0 });
  oldState.schemaVersion = 3;
  oldState.world = { day: 9, clockMinutes: 1337 };
  const upgraded = upgradeGameState(oldState, { now: 5000 });
  assert.equal(upgraded.schemaVersion, 11);
  assert.equal(upgraded.world.day, 9);
  assert.equal(upgraded.world.clockMinutes, 1337);
  assert.equal(upgraded.world.simulation.lastResolvedAt, new Date(5000).toISOString());
  assert.equal(validateGameState(upgraded).ok, true);
});

test("ticks one game minute per real second and saves at the configured interval", () => {
  let now = 0;
  const gameState = new GameStateService(createFreshGameState({ now }));
  const repository = new RecordingRepository();
  const service = new WorldSimulationService(gameState, repository, { now: () => now, saveEveryGameMinutes: 5 });
  for (let index = 0; index < 5; index += 1) {
    now += 1000;
    service.tick(1000, { now });
  }
  assert.equal(gameState.getSnapshot().world.clockMinutes, 425);
  assert.equal(repository.saves.length, 1);
});

test("explicit pause reasons stop time and resume without treating menu time as offline", () => {
  let now = 0;
  const gameState = new GameStateService(createFreshGameState({ now }));
  const service = new WorldSimulationService(gameState, new RecordingRepository(), { now: () => now });
  service.pause("modal", { now });
  now = 120000;
  assert.equal(service.tick(1000, { now }).status, "paused");
  service.resume("modal", { now, resolveOffline: false });
  assert.equal(gameState.getSnapshot().world.clockMinutes, 420);
  now += 1000;
  service.tick(1000, { now });
  assert.equal(gameState.getSnapshot().world.clockMinutes, 421);
});

test("offline return is aggregated, capped to three game days, and persisted once", () => {
  let now = 0;
  const gameState = new GameStateService(createFreshGameState({ now }));
  const repository = new RecordingRepository();
  const service = new WorldSimulationService(gameState, repository, { now: () => now });
  now = 24 * 60 * 60 * 1000;
  const result = service.resolveOffline({ now, persist: true });
  assert.equal(result.requestedGameMinutes, 86400);
  assert.equal(result.advancedGameMinutes, WORLD_TIME_CONFIG.maxOfflineGameMinutes);
  assert.equal(result.capped, true);
  assert.equal(gameState.getSnapshot().world.day, 4);
  assert.equal(gameState.getSnapshot().world.clockMinutes, 420);
  assert.equal(gameState.getSnapshot().world.simulation.lastOfflineWasCapped, true);
  assert.equal(repository.saves.length, 1);
});
