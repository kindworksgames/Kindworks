import test from "node:test";
import assert from "node:assert/strict";
import {
  NPC_NAVIGATION_LINKS,
  NPC_NAVIGATION_NODES,
  NPC_RESIDENTS,
  NPC_TOWN_LIFE_CONFIG,
} from "../src/data/npcTownLife.js";
import { getWeatherForDay } from "../src/data/worldSimulation.js";
import { createFreshGameState, GameStateService, upgradeGameState, validateGameState } from "../src/state/GameState.js";
import { createFreshNpcState, validateNpcState } from "../src/state/npcState.js";
import { advanceWorldState } from "../src/state/worldState.js";
import { NavigationGraph } from "../src/systems/NavigationGraph.js";
import { NpcTownLifeService, getNpcSchedule } from "../src/systems/NpcTownLifeService.js";

class RecordingRepository {
  constructor() {
    this.saves = [];
  }

  save(state) {
    this.saves.push(structuredClone(state));
    return { ok: true, status: "saved" };
  }
}

function world(day, clockMinutes, weatherKind = null) {
  const weather = getWeatherForDay(day);
  return {
    day,
    clockMinutes,
    weather: { current: weatherKind ? { ...weather, kind: weatherKind } : weather },
  };
}

test("migrates the complete basic resident catalogue and connected authored graph", () => {
  const graph = new NavigationGraph(NPC_NAVIGATION_NODES, NPC_NAVIGATION_LINKS);
  const validation = graph.validate();
  assert.equal(NPC_RESIDENTS.length, 35);
  assert.equal(NPC_TOWN_LIFE_CONFIG.residentCount, 35);
  assert.equal(validation.ok, true);
  assert.equal(validation.nodeCount, 128);
  assert.equal(validation.linkCount, 133);
  assert.equal(new Set(NPC_RESIDENTS.map((resident) => resident.name)).size, 35);
  for (const resident of NPC_RESIDENTS) {
    assert.ok(graph.findPath(resident.homeNodeId, resident.workNodeId).length > 0, `${resident.name} must reach work`);
    for (const destination of resident.preferred) assert.equal(graph.hasNode(destination), true, `${resident.name} leisure destination must exist`);
  }
});

test("shortest paths stay on bidirectional authored links", () => {
  const graph = new NavigationGraph(NPC_NAVIGATION_NODES, NPC_NAVIGATION_LINKS);
  const path = graph.findPath("home01", "harbour2");
  assert.equal(path[0], "home01");
  assert.equal(path.at(-1), "harbour2");
  for (let index = 1; index < path.length; index += 1) assert.equal(graph.areLinked(path[index - 1], path[index]), true);
  assert.deepEqual(graph.findPath("missing", "home01"), []);
});

test("basic schedules cover home, work, leisure, sleep, and midnight wrapping", () => {
  const maya = NPC_RESIDENTS.find((resident) => resident.name === "Maya");
  assert.equal(getNpcSchedule(maya, 1, 6.5 * 60).phase, "home");
  assert.equal(getNpcSchedule(maya, 1, 8 * 60).phase, "working");
  assert.equal(getNpcSchedule(maya, 1, 18 * 60).phase, "leisure");
  assert.equal(getNpcSchedule(maya, 1, 23 * 60).phase, "sleeping");

  const chloe = NPC_RESIDENTS.find((resident) => resident.name === "Chloe");
  assert.equal(getNpcSchedule(chloe, 1, 23 * 60).phase, "working");
  assert.equal(getNpcSchedule(chloe, 1, 30).phase, "home");
  assert.equal(getNpcSchedule(chloe, 1, 2 * 60).phase, "sleeping");
});

test("fresh NPC state contains every stable identity and validates", () => {
  const state = createFreshNpcState();
  assert.equal(validateNpcState(state).ok, true);
  assert.equal(state.residents.length, 35);
  assert.deepEqual(state.residents.slice(0, 3).map((resident) => resident.id), ["npc-01", "npc-02", "npc-03"]);
  assert.equal(state.residents.every((resident) => resident.currentNodeId.startsWith("home")), true);
});

test("schema 4 saves gain NPC town life without losing existing state", () => {
  const oldState = createFreshGameState({ now: 0 });
  delete oldState.npcs;
  oldState.schemaVersion = 4;
  oldState.world = advanceWorldState(oldState.world, 11 * 1440, { now: 500 }).world;
  const upgraded = upgradeGameState(oldState, { now: 1000 });
  assert.equal(upgraded.schemaVersion, 24);
  assert.equal(upgraded.world.day, 12);
  assert.equal(upgraded.npcs.residents.length, 35);
  assert.equal(validateGameState(upgraded).ok, true);
});

test("residents leave home, follow routes, and enter their workplace", () => {
  let now = 0;
  const gameState = new GameStateService(createFreshGameState({ now }));
  const repository = new RecordingRepository();
  const service = new NpcTownLifeService(gameState, repository, { now: () => now });
  const mayaStart = service.getResidents().find((resident) => resident.name === "Maya");
  for (let minute = 450; minute <= 720; minute += 1) {
    now += 1000;
    service.update(1000, world(1, minute));
  }
  const maya = service.getResidents().find((resident) => resident.name === "Maya");
  assert.equal(mayaStart.currentNodeId, "home01");
  assert.equal(maya.currentNodeId, "shop1");
  assert.equal(maya.phase, "working");
  assert.equal(maya.visible, false);
  assert.ok(repository.saves.length > 0);
});

test("rain and snow apply the original safe walking-speed multipliers", () => {
  const makeService = () => {
    const gameState = new GameStateService(createFreshGameState({ now: 0 }));
    return new NpcTownLifeService(gameState, { save: () => ({ ok: true }) }, { now: () => 1000 });
  };
  const clear = makeService();
  const snow = makeService();
  clear.update(1000, world(1, 480, "clear"));
  snow.update(1000, world(1, 480, "snow"));
  const clearMaya = clear.getResidents().find((resident) => resident.name === "Maya");
  const snowMaya = snow.getResidents().find((resident) => resident.name === "Maya");
  const home = NPC_NAVIGATION_NODES.find((node) => node.id === "home01");
  assert.ok(Math.hypot(clearMaya.x - home.x, clearMaya.y - home.y) > Math.hypot(snowMaya.x - home.x, snowMaya.y - home.y));
});

test("modal and background pause reasons freeze resident movement", () => {
  const gameState = new GameStateService(createFreshGameState({ now: 0 }));
  const service = new NpcTownLifeService(gameState, { save: () => ({ ok: true }) }, { now: () => 1000 });
  service.update(1000, world(1, 480));
  const before = service.getResidents().find((resident) => resident.name === "Maya");
  service.setPaused("modal", true);
  const paused = service.update(1000, world(1, 481));
  const during = service.getResidents().find((resident) => resident.name === "Maya");
  assert.equal(paused.status, "paused");
  assert.deepEqual({ x: during.x, y: during.y }, { x: before.x, y: before.y });
  service.setPaused("modal", false);
  service.update(1000, world(1, 482));
  const after = service.getResidents().find((resident) => resident.name === "Maya");
  assert.notDeepEqual({ x: after.x, y: after.y }, { x: during.x, y: during.y });
});

test("a full simulated day leaves all 35 residents in valid locations and phases", () => {
  let now = 0;
  const gameState = new GameStateService(createFreshGameState({ now }));
  const service = new NpcTownLifeService(gameState, { save: () => ({ ok: true }) }, { now: () => now });
  for (let minute = 0; minute < 1440; minute += 1) {
    now += 1000;
    service.update(1000, world(1, minute));
  }
  const sync = service.syncState();
  const diagnostics = service.getDiagnostics();
  assert.equal(sync.ok, true);
  assert.equal(validateNpcState(gameState.getSnapshot().npcs).ok, true);
  assert.equal(diagnostics.residentCount, 35);
  assert.equal(diagnostics.graph.ok, true);
  assert.equal(diagnostics.allHomesReachWork, true);
  assert.equal(Object.values(diagnostics.phaseCounts).reduce((sum, count) => sum + count, 0), 35);
});
