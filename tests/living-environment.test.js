import test from "node:test";
import assert from "node:assert/strict";
import { LAWN_PLOTS, absoluteWorldMinute } from "../src/data/farming.js";
import { BUSINESS_CATALOG, LAND_LITTER_ANCHORS, RIVER_SECTIONS, hashUnit } from "../src/data/livingEnvironment.js";
import { createFreshGameState, GameStateService, upgradeGameState, validateGameState } from "../src/state/GameState.js";
import { projectLegacyLivingEnvironment, validateLivingEnvironmentState } from "../src/state/livingEnvironmentState.js";
import { SaveRepository } from "../src/state/SaveRepository.js";
import { advanceWorldState } from "../src/state/worldState.js";
import { CleanupJobService } from "../src/systems/CleanupJobService.js";
import { FarmingService } from "../src/systems/FarmingService.js";
import { LivingEnvironmentService, maybeStartEnvironmentCalmInto, updateEnvironmentMetricsInto } from "../src/systems/LivingEnvironmentService.js";
import { RiverClearoutService } from "../src/systems/RiverClearoutService.js";
import { WorldSimulationService } from "../src/systems/WorldSimulationService.js";
import { MemoryStorage } from "./helpers/MemoryStorage.js";

function runtime({ state = createFreshGameState({ now: 0 }), repository = new SaveRepository(new MemoryStorage()) } = {}) {
  const gameState = new GameStateService(state);
  const environment = new LivingEnvironmentService(gameState, repository, { now: () => 1000 });
  const farming = new FarmingService(gameState, repository, { now: () => 1000 });
  return { gameState, environment, farming, repository };
}

function advance(runtimeValue, minutes) {
  const next = runtimeValue.gameState.getSnapshot();
  next.world = advanceWorldState(next.world, minutes, { now: minutes * 1000 }).world;
  runtimeValue.farming.resolveInto(next);
  runtimeValue.environment.advanceInto(next);
  assert.equal(runtimeValue.gameState.replace(next).ok, true);
  return next;
}

test("Milestone 27 creates the complete bounded living-town foundation", () => {
  const state = createFreshGameState({ now: 0 });
  assert.equal(state.schemaVersion, 24);
  assert.equal(LAWN_PLOTS.length, 20);
  assert.equal(LAWN_PLOTS.filter((plot) => plot.active).length, 19);
  assert.equal(LAWN_PLOTS.find((plot) => plot.legacyId === "lawn-19").active, false);
  assert.equal(LAWN_PLOTS.find((plot) => plot.legacyId === "lawn-20").homeNodeId, "home20");
  assert.equal(Object.keys(state.farming.lawns).length, 20);
  assert.equal(state.environment.land.items.length, LAND_LITTER_ANCHORS.length);
  assert.deepEqual(Object.fromEntries(["street", "park", "beach"].map((zone) => [zone, state.environment.land.items.filter((item) => item.active && item.zone === zone).length])), { street: 22, park: 8, beach: 8 });
  assert.equal(state.environment.river.items.length, 20);
  assert.deepEqual(RIVER_SECTIONS.map((section) => state.environment.river.items.filter((item) => item.sectionId === section.id).length), [4, 4, 4, 4, 4]);
  assert.equal(Object.keys(state.environment.businesses).length, BUSINESS_CATALOG.length);
  assert.equal(validateGameState(state).ok, true);
});

test("all authored lawns keep distinct soil, moisture, shade, care and weather-aware ecology", () => {
  const current = runtime();
  const before = current.gameState.getSnapshot();
  const first = before.farming.lawns["lawn-house-1"];
  const second = before.farming.lawns["lawn-house-2"];
  assert.notEqual(first.soilHealth, second.soilHealth);
  assert.notEqual(first.shade, second.shade);
  assert.notEqual(first.householdCare, second.householdCare);
  advance(current, 720);
  const after = current.gameState.getSnapshot();
  assert.ok(after.farming.lawns["lawn-house-1"].ecologyAgeGameMinutes >= 720);
  assert.notEqual(after.farming.lawns["lawn-house-1"].moisture, first.moisture);
  assert.notEqual(after.farming.lawns["lawn-house-1"].grassHeight - first.grassHeight, after.farming.lawns["lawn-house-2"].grassHeight - second.grassHeight);
});

test("a resident at home can perform the original bounded evening weeding without mowing", () => {
  const state = createFreshGameState({ now: 0 });
  const plot = LAWN_PLOTS.find((entry) => entry.active && hashUnit(`resident-care:${entry.id}:1`) < 0.08 + state.farming.lawns[entry.id].householdCare * 0.32);
  const lawn = state.farming.lawns[plot.id];
  lawn.weedPressure = 50;
  lawn.grassHeight = 35;
  const current = runtime({ state });
  advance(current, 720);
  const after = current.gameState.getSnapshot().farming.lawns[plot.id];
  assert.equal(after.lastResidentCareDay, 1);
  assert.ok(after.weedPressure < 50);
  assert.ok(after.grassHeight > 35);
});

test("world time advances farming and the living environment in one accepted state transaction", () => {
  const current = runtime();
  const world = new WorldSimulationService(current.gameState, current.repository, { now: () => 60_000 });
  world.addStateAdvancer((state) => current.farming.resolveInto(state));
  world.addStateAdvancer((state) => current.environment.advanceInto(state));
  const result = world.advance(60, { persist: true, now: 60_000 });
  assert.equal(result.ok, true);
  const state = current.gameState.getSnapshot();
  assert.equal(state.farming.lastResolvedAbsoluteMinute, absoluteWorldMinute(state.world));
  assert.equal(state.environment.lastResolvedAbsoluteMinute, absoluteWorldMinute(state.world));
  assert.equal(current.repository.load().state.environment.lastResolvedAbsoluteMinute, state.environment.lastResolvedAbsoluteMinute);
});

test("a local Waste Collection snapshot removes only its exact persistent land items", () => {
  const current = runtime();
  current.environment.refresh({ persist: false });
  const cleanup = new CleanupJobService(current.gameState, current.repository, { now: () => 1000, environment: current.environment });
  const job = current.environment.getLandJobs()[0];
  const activeBefore = current.gameState.getSnapshot().environment.land.items.filter((item) => item.active).map((item) => item.id);
  const started = cleanup.begin(job.id, { returnPosition: { x: 10, y: 20 } });
  assert.equal(started.ok, true);
  assert.deepEqual(started.session.itemIds, job.items.map((item) => item.id));
  const completed = cleanup.complete(started.session.id, { collectedItemIds: started.session.itemIds });
  assert.equal(completed.ok, true);
  const after = current.gameState.getSnapshot();
  for (const id of started.session.itemIds) assert.equal(after.environment.land.items.find((item) => item.id === id).active, false);
  assert.equal(after.environment.land.items.filter((item) => item.active).length, activeBefore.length - started.session.itemIds.length);
  assert.equal(current.repository.load().state.environment.land.items.filter((item) => item.active).length, activeBefore.length - started.session.itemIds.length);
});

test("light land litter follows wind and can transfer into the nearest river section", () => {
  const state = createFreshGameState({ now: 0 });
  for (const item of state.environment.land.items) {
    item.active = false;
    item.nextMoveAt = 999999;
  }
  const item = state.environment.land.items.find((entry) => entry.id === "litter-53");
  Object.assign(item, { active: true, x: 2490, y: 650, homeX: 2490, homeY: 650, type: "paper", source: "wind-test", nextMoveAt: 421 });
  let serial = 1;
  while (hashUnit(`land-river:${item.id}:${serial}`) >= 0.16) serial += 1;
  state.environment.eventSerial = serial;
  state.environment.land.nextWindShiftAt = 999999;
  state.environment.land.nextCaretakerSweepAt = 999999;
  state.environment.land.nextSpawnAt = { street: 999999, park: 999999, beach: 999999 };
  state.environment.river.nextSpawnAt = 999999;
  const current = runtime({ state });
  advance(current, 30);
  const after = current.gameState.getSnapshot().environment;
  assert.equal(after.land.items.find((entry) => entry.id === item.id).active, false);
  assert.equal(after.land.toRiverEvents, 1);
  assert.equal(after.river.items.some((entry) => entry.source === `land-transfer:${item.id}`), true);
});

test("river rubbish flows through authored snags, releases and can wash onto South Shore", () => {
  const state = createFreshGameState({ now: 0 });
  state.environment.land.items.forEach((item) => { item.active = false; item.nextMoveAt = 999999; });
  state.environment.land.nextSpawnAt = { street: 999999, park: 999999, beach: 999999 };
  state.environment.land.nextWindShiftAt = 999999;
  state.environment.land.nextCaretakerSweepAt = 999999;
  state.environment.river.nextSpawnAt = 999999;
  let snagSerial = 1;
  while (hashUnit(`river-snag:river-trash-${snagSerial}:river-01:0`) >= 0.23) snagSerial += 1;
  state.environment.river.items = [{
    id: `river-trash-${snagSerial}`, sectionId: "river-01", type: "cup", t: 0.8, offset: 0, flowSpeed: 4.8, status: "floating", stuckReason: null,
    passedTraps: [], source: "test", spawnedGameMinute: 0, ageGameMinutes: 0, stuckAgeGameMinutes: 0, releaseAfterGameMinutes: 0, bobPhase: 0, jamCount: 0,
  }];
  state.environment.river.nextSerial = snagSerial + 1;
  let current = runtime({ state });
  advance(current, 30);
  let river = current.gameState.getSnapshot().environment.river;
  assert.equal(river.items[0].status, "stuck");
  const releasedState = current.gameState.getSnapshot();
  releasedState.environment.river.items[0].releaseAfterGameMinutes = 1;
  current = runtime({ state: releasedState });
  advance(current, 30);
  river = current.gameState.getSnapshot().environment.river;
  assert.equal(river.items[0].status, "floating");
  assert.ok(river.releaseEvents >= 1);

  const shoreState = current.gameState.getSnapshot();
  let shoreSerial = 1;
  while (hashUnit(`river-shore:river-trash-${shoreSerial}`) >= 0.28) shoreSerial += 1;
  shoreState.environment.river.items = [{
    id: `river-trash-${shoreSerial}`, sectionId: "river-05", type: "bottle", t: 0.99, offset: 0, flowSpeed: 4.8, status: "floating", stuckReason: null,
    passedTraps: ["river-05:0", "river-05:1"], source: "test", spawnedGameMinute: 0, ageGameMinutes: 0, stuckAgeGameMinutes: 0, releaseAfterGameMinutes: 0, bobPhase: 0, jamCount: 0,
  }];
  shoreState.environment.river.nextSerial = Math.max(shoreState.environment.river.nextSerial, shoreSerial + 1);
  current = runtime({ state: shoreState });
  advance(current, 30);
  const shore = current.gameState.getSnapshot().environment;
  assert.equal(shore.river.items.length, 0);
  assert.equal(shore.river.washedAshore > 0, true);
  assert.equal(shore.land.items.some((entry) => entry.active && entry.source === "river-estuary"), true);
});

test("a successful authored River Clear-Out removes only the selected persistent river item", async () => {
  const current = runtime();
  current.environment.refresh({ persist: false });
  const job = current.environment.getRiverJob("river-01");
  const before = current.gameState.getSnapshot().environment.river.items.map((item) => item.id);
  const river = new RiverClearoutService(current.gameState, current.repository, { now: () => 1000, environment: current.environment });
  const started = river.startLevel(1, { environmentTargetId: job.id, autoFall: false });
  assert.equal(started.ok, true);
  assert.equal(started.session.mode, "town-job");
  const certificate = await river.certifiedPath({ threeStars: true, beamWidth: 250 });
  assert.equal(certificate.ok, true);
  const result = river.playPath(certificate.path);
  assert.equal(result.ok, true);
  assert.equal(result.environmentEffect.removed, 1);
  const after = current.gameState.getSnapshot().environment.river.items.map((item) => item.id);
  assert.equal(after.includes(job.itemIds[0]), false);
  assert.equal(after.length, before.length - 1);
  assert.equal(before.filter((id) => id !== job.itemIds[0]).every((id) => after.includes(id)), true);
  assert.equal(current.repository.load().state.environment.river.items.length, before.length - 1);
});

test("open businesses create local overflow and working caretakers remove bounded litter", () => {
  const state = createFreshGameState({ now: 0 });
  state.environment.land.items.forEach((item) => { item.active = false; item.nextMoveAt = 999999; });
  state.environment.land.nextSpawnAt = { street: 999999, park: 999999, beach: 999999 };
  state.environment.land.nextWindShiftAt = 999999;
  state.environment.land.nextCaretakerSweepAt = 999999;
  state.environment.river.nextSpawnAt = 999999;
  state.environment.businesses["corner-cafe"].waste = 100;
  let current = runtime({ state });
  advance(current, 30);
  let environment = current.gameState.getSnapshot().environment;
  assert.equal(environment.businessWasteEvents, 1);
  assert.equal(environment.land.items.some((item) => item.active && item.source === "business-overflow:corner-cafe"), true);

  const sweepState = current.gameState.getSnapshot();
  sweepState.environment.land.items.forEach((item) => { item.active = false; item.nextMoveAt = 999999; });
  const park = sweepState.environment.land.items.find((item) => item.id === "litter-09");
  Object.assign(park, { active: true, ageGameMinutes: 1000, x: 1175, y: 1185, source: "park-test" });
  const ruby = sweepState.npcs.residents.find((resident) => resident.id === "npc-13");
  Object.assign(ruby, { phase: "working", x: 1175, y: 1185, visible: true });
  let serial = 1;
  while (hashUnit(`caretaker-roll:npc-13:${serial}`) >= 0.72) serial += 1;
  sweepState.environment.eventSerial = serial;
  sweepState.environment.land.nextCaretakerSweepAt = absoluteWorldMinute(sweepState.world) + 1;
  current = runtime({ state: sweepState });
  advance(current, 30);
  environment = current.gameState.getSnapshot().environment;
  assert.equal(environment.land.items.find((item) => item.id === park.id).active, false);
  assert.ok(environment.land.caretakerRemovals >= 1);
});

test("complete restoration starts a three-day calm that pauses new environmental dirt and lawn growth", () => {
  const state = createFreshGameState({ now: 0 });
  state.environment.land.items.forEach((item) => { item.active = false; });
  state.environment.river.items = [];
  Object.values(state.environment.businesses).forEach((business) => { business.waste = 0; });
  for (const plot of LAWN_PLOTS) Object.assign(state.farming.lawns[plot.id], { grassHeight: 5, weedPressure: 3 });
  updateEnvironmentMetricsInto(state);
  const calm = maybeStartEnvironmentCalmInto(state);
  assert.equal(calm.started, true);
  assert.equal(state.environment.calm.untilGameMinute, absoluteWorldMinute(state.world) + 4320);
  const beforeGrass = state.farming.lawns["lawn-house-1"].grassHeight;
  const current = runtime({ state });
  advance(current, 120);
  const after = current.gameState.getSnapshot();
  assert.equal(after.environment.land.items.some((item) => item.active), false);
  assert.equal(after.environment.river.items.length, 0);
  assert.equal(after.farming.lawns["lawn-house-1"].grassHeight, beforeGrass);
  assert.equal(after.environment.cleanliness.band, "calm");
});

test("legacy lawns, litter, river runtime, businesses and calm convert without touching the snapshot", () => {
  const world = createFreshGameState({ now: 0 }).world;
  const legacy = {
    litter: [{ id: "litter-43", zone: "beach", x: 3500, y: 2500, type: "bag", source: "legacy-tide", ageGameMinutes: 90 }, { id: "spill-bin-square-17", zone: "street", x: 600, y: 1380, type: "cup", source: "bin-tip:npc-07", dynamicSpill: true }],
    riverGarbage: [{ id: "river-trash-0088", sectionId: "river-04", type: "can", t: 0.4, status: "stuck", stuckReason: "legacy reeds", passedTraps: [] }],
    riverRuntime: { nextSpawnAtGameMinute: 999, escapedToSea: 7, washedAshore: 4 },
    landRuntime: { nextSpawnAt: { street: 800, park: 900, beach: 700 }, nextWindShiftAt: 780, windAngle: 1.2, nextCaretakerSweepAt: 760, moveEvents: 3, toRiverEvents: 2 },
    businesses: { "little-bakery": { customers: 17, waste: 84, overflowEvents: 2 } },
    socialRestorationRuntime: { restorationCalmUntilGameMinute: 1200, restorationCommunitySweepEvents: 1, restorationPeakJobsSinceCalm: 8, restorationLastCalmStartGameMinute: 300 },
  };
  const original = structuredClone(legacy);
  const projected = projectLegacyLivingEnvironment(legacy, world);
  assert.equal(projected.land.items.find((item) => item.id === "litter-43").source, "legacy-tide");
  assert.equal(projected.land.items.find((item) => item.id === "spill-bin-square-17").dynamicSpill, true);
  assert.equal(projected.river.items[0].id, "river-trash-0088");
  assert.equal(projected.river.escapedToSea, 7);
  assert.equal(projected.businesses["little-bakery"].customers, 17);
  assert.equal(projected.calm.untilGameMinute, 1200);
  assert.equal(validateLivingEnvironmentState(projected, { ...world, day: 1, clockMinutes: 1200 }).ok, true);
  assert.deepEqual(legacy, original);
});

test("schema 23 saves gain the environment and failed writes roll environmental cleanup back", () => {
  const old = createFreshGameState({ now: 0 });
  delete old.environment;
  old.schemaVersion = 23;
  const upgraded = upgradeGameState(old, { now: 0 });
  assert.equal(upgraded.schemaVersion, 24);
  assert.equal(validateGameState(upgraded).ok, true);
  const repository = { save: () => ({ ok: false, status: "write-failed" }) };
  const current = runtime({ state: upgraded, repository });
  const before = current.gameState.getSnapshot();
  const itemId = before.environment.land.items.find((item) => item.active).id;
  const result = current.environment.removeLandItems([itemId]);
  assert.equal(result.code, "persistence-failed");
  assert.equal(result.rollbackOk, true);
  assert.deepEqual(current.gameState.getSnapshot(), before);
});
