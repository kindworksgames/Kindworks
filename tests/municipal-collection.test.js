import test from "node:test";
import assert from "node:assert/strict";
import {
  MUNICIPAL_COLLECTION_CONFIG,
  MUNICIPAL_COLLECTOR,
  buildMunicipalVehicleNetwork,
  municipalShortestPath,
  municipalVehicleAllowedAt,
  nextMunicipalCollectionDay,
  planMunicipalCollectionStops,
} from "../src/data/municipalCollection.js";
import { NPC_PUBLIC_BINS } from "../src/data/npcTownLife.js";
import { createFreshGameState, GameStateService, upgradeGameState, validateGameState } from "../src/state/GameState.js";
import {
  createFreshMunicipalCollectionState,
  projectLegacyMunicipalCollection,
  validateMunicipalCollectionState,
} from "../src/state/municipalCollectionState.js";
import { normalizeTownPlacementState } from "../src/state/townPlacementState.js";
import { advanceWorldState } from "../src/state/worldState.js";
import { MunicipalCollectionService } from "../src/systems/MunicipalCollectionService.js";
import { TownPlacementService } from "../src/systems/TownPlacementService.js";
import { createBinSpillInto } from "../src/systems/LivingEnvironmentService.js";

class Repository {
  constructor(ok = true) { this.ok = ok; this.saves = []; }
  save(state) {
    if (!this.ok) return { ok: false, status: "fixture-failure" };
    this.saves.push(structuredClone(state));
    return { ok: true, status: "saved" };
  }
}

function collectionDayState() {
  const state = createFreshGameState({ now: 0 });
  state.world = advanceWorldState(state.world, 6 * 1440, { now: 7000 }).world;
  state.municipalCollection = createFreshMunicipalCollectionState(state.world);
  return state;
}

test("Milestone 29 pins Gavin, the seven-day 07:00 schedule and the street-only vehicle graph", () => {
  assert.deepEqual(MUNICIPAL_COLLECTOR, { id: "municipal-collector", name: "Gavin", role: "Bin collector", vehicle: "Willowmere recycling lorry" });
  assert.equal(MUNICIPAL_COLLECTION_CONFIG.intervalDays, 7);
  assert.equal(MUNICIPAL_COLLECTION_CONFIG.startMinute, 420);
  assert.equal(nextMunicipalCollectionDay(1), 7);
  assert.equal(nextMunicipalCollectionDay(7), 7);
  assert.equal(nextMunicipalCollectionDay(8), 14);
  const network = buildMunicipalVehicleNetwork();
  assert.ok(network.nodes.size > 0);
  assert.ok(network.segments.every((segment) => [...MUNICIPAL_COLLECTION_CONFIG.allowedRoadIds, ...MUNICIPAL_COLLECTION_CONFIG.allowedBridgeIds].includes(segment.sourceId)));
  for (const segment of network.segments) {
    const a = network.nodes.get(segment.a);
    const b = network.nodes.get(segment.b);
    for (let sample = 0; sample <= 8; sample += 1) {
      const ratio = sample / 8;
      assert.equal(municipalVehicleAllowedAt(a.x + (b.x - a.x) * ratio, a.y + (b.y - a.y) * ratio, 1), true);
    }
  }
});

test("all five authored bins receive a reachable route while Gavin may walk beyond the kerb", () => {
  const records = NPC_PUBLIC_BINS.map((bin) => ({ identity: `public:${bin.id}`, type: "public", id: bin.id, nodeId: bin.nodeId, label: `${bin.district} bin`, x: bin.x, y: bin.y, rotation: 0 }));
  const plan = planMunicipalCollectionStops(records);
  assert.equal(plan.stops.length, 5);
  assert.deepEqual(new Set(plan.stops.map((stop) => stop.identity)), new Set(records.map((record) => record.identity)));
  assert.ok(plan.stops.every((stop) => municipalShortestPath(plan.network, plan.network.depotId, stop.roadNodeId).ids.length > 0));
  assert.ok(plan.stops.some((stop) => Math.hypot(stop.originalX - stop.roadX, stop.originalY - stop.roadY) > 400));
});

test("a forced weekly route empties every public bin and schedules exactly seven days later", () => {
  const gameState = new GameStateService(collectionDayState());
  const repository = new Repository();
  const service = new MunicipalCollectionService(gameState, repository, { now: () => 7000 });
  const started = service.start({ force: true, persist: true });
  assert.equal(started.ok, true);
  assert.equal(started.stops, 5);
  assert.equal(service.getDiagnostics().streetOnlyVehicleGraph, true);
  const completed = service.runToCompletion({ secondsPerStep: 1 });
  assert.equal(completed.ok, true);
  const state = gameState.getSnapshot();
  assert.equal(state.municipalCollection.active, false);
  assert.equal(state.municipalCollection.lastCompletedDay, 7);
  assert.equal(state.municipalCollection.nextServiceDay, 14);
  assert.equal(state.municipalCollection.binsEmptied, 5);
  assert.equal(state.municipalCollection.load, 29);
  assert.ok(state.npcs.publicBins.every((bin) => bin.fill === 0 && bin.lastEmptiedDay === 7 && bin.collections === 1));
  assert.ok(repository.saves.some((save) => save.municipalCollection.active));
  assert.equal(validateGameState(state).ok, true);
});

test("player-placed bins are locked, emptied, and returned to their exact transform", () => {
  const state = collectionDayState();
  state.townPlacement = normalizeTownPlacementState({ objects: [{ id: "placed-bin-7", itemId: "small-town-bin", x: 2800.25, y: 200.75, rotation: Math.PI / 2, binFill: 5 }] });
  const gameState = new GameStateService(state);
  const repository = new Repository();
  const collection = new MunicipalCollectionService(gameState, repository, { now: () => 7000 });
  const placement = new TownPlacementService(gameState, repository, { now: () => 7000 });
  assert.equal(collection.start({ force: true }).stops, 6);
  assert.equal(placement.move("placed-bin-7").code, "collection-locked");
  assert.equal(placement.store("placed-bin-7").code, "collection-locked");
  assert.equal(collection.runToCompletion({ secondsPerStep: 1 }).ok, true);
  const bin = gameState.getSnapshot().townPlacement.objects[0];
  assert.deepEqual({ x: bin.x, y: bin.y, rotation: bin.rotation }, { x: 2800.25, y: 200.75, rotation: Math.PI / 2 });
  assert.equal(bin.binFill, 0);
  assert.equal(bin.lastEmptiedDay, 7);
  assert.equal(bin.collections, 1);
  assert.equal(placement.move("placed-bin-7").ok, true);
});

test("an active route survives a mid-route service reload", () => {
  const gameState = new GameStateService(collectionDayState());
  const repository = new Repository();
  const first = new MunicipalCollectionService(gameState, repository, { now: () => 7000 });
  first.start({ force: true });
  for (let index = 0; index < 12; index += 1) first.update(1000);
  const saved = gameState.getSnapshot().municipalCollection;
  assert.equal(saved.active, true);
  const resumed = new MunicipalCollectionService(gameState, repository, { now: () => 8000 });
  assert.equal(resumed.getSnapshot().active, true);
  assert.equal(resumed.getSnapshot().stopIndex, saved.stopIndex);
  assert.equal(resumed.runToCompletion({ secondsPerStep: 1 }).ok, true);
});

test("Gavin rights a tipped bin and removes its exact persistent spill before collection", () => {
  const state = collectionDayState();
  const spills = createBinSpillInto(state, { binId: "bin-02", x: 970, y: 1180, npcId: "npc-30", npcName: "Alfie", count: 3 });
  const bin = state.npcs.publicBins.find((entry) => entry.id === "bin-02");
  Object.assign(bin, { tipped: true, tippedAt: 9100, tippedByNpcId: "npc-30", spillIds: spills.map((item) => item.id) });
  const gameState = new GameStateService(state);
  const service = new MunicipalCollectionService(gameState, new Repository(), { now: () => 7000 });
  assert.equal(service.runToCompletion({ secondsPerStep: 1 }).ok, true);
  const after = gameState.getSnapshot();
  const collected = after.npcs.publicBins.find((entry) => entry.id === "bin-02");
  assert.equal(collected.tipped, false);
  assert.deepEqual(collected.spillIds, []);
  assert.equal(spills.some((spill) => after.environment.land.items.find((item) => item.id === spill.id)?.active), false);
});

test("legacy collection progress and schema 25 saves migrate without losing prior state", () => {
  const legacy = { garbageCollection: { schemaVersion: 2, active: false, phase: "complete", nextServiceDay: 21, lastCompletedDay: 14, collectionsCompleted: 2, binsEmptied: 5, load: 31, lastEvent: "Collection complete" } };
  const projected = projectLegacyMunicipalCollection(legacy, { day: 15, clockMinutes: 600 });
  assert.equal(projected.nextServiceDay, 21);
  assert.equal(projected.lastCompletedDay, 14);
  assert.equal(projected.collectionsCompleted, 2);
  assert.equal(validateMunicipalCollectionState(projected).ok, true);
  const old = createFreshGameState({ now: 0 });
  delete old.municipalCollection;
  old.schemaVersion = 25;
  old.economy.coins = 4321;
  old.economy.lifetimeCoinsEarned = 4321;
  const upgraded = upgradeGameState(old, { now: 1000 });
  assert.equal(upgraded.schemaVersion, 32);
  assert.equal(upgraded.economy.coins, 4321);
  assert.equal(upgraded.municipalCollection.nextServiceDay, 7);
  assert.equal(validateGameState(upgraded).ok, true);
});

test("a failed route-start save restores the complete pre-collection state", () => {
  const gameState = new GameStateService(collectionDayState());
  const service = new MunicipalCollectionService(gameState, new Repository(false), { now: () => 7000 });
  const before = gameState.getSnapshot();
  const result = service.start({ force: true, persist: true });
  assert.equal(result.status, "persistence-failed");
  assert.equal(result.rollbackOk, true);
  assert.deepEqual(gameState.getSnapshot(), before);
  assert.equal(service.getSnapshot().active, false);
});
