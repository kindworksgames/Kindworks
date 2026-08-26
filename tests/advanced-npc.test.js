import test from "node:test";
import assert from "node:assert/strict";
import { NPC_FRIEND_PAIRS, NPC_PUBLIC_BINS, NPC_RESIDENTS } from "../src/data/npcTownLife.js";
import { createFreshGameState, GameStateService, upgradeGameState, validateGameState } from "../src/state/GameState.js";
import { createFreshNpcState, projectLegacyNpcState, validateNpcState } from "../src/state/npcState.js";
import { normalizeTownPlacementState } from "../src/state/townPlacementState.js";
import { advanceWorldState } from "../src/state/worldState.js";
import { placeNpcLandLitterInto, createBinSpillInto } from "../src/systems/LivingEnvironmentService.js";
import { NpcTownLifeService } from "../src/systems/NpcTownLifeService.js";

class Repository {
  constructor(ok = true) { this.ok = ok; this.saves = []; }
  save(state) { if (!this.ok) return { ok: false, status: "write-failed" }; this.saves.push(structuredClone(state)); return { ok: true, status: "saved" }; }
}

function advance(gameState, minutes) {
  const next = gameState.getSnapshot();
  next.world = advanceWorldState(next.world, minutes, { now: minutes * 1000 }).world;
  assert.equal(gameState.replace(next).ok, true);
}

function carrying(resident, target) {
  Object.assign(resident, {
    carryItem: "cup", carryLabel: "takeaway cup", carryStage: "empty", carryOriginBusinessId: "shop1",
    carryGameMinutes: 30, carryStageDurationGameMinutes: 8, pendingCarryLitter: false, intent: "dispose", binTarget: target,
  });
}

test("Milestone 28 preserves all 35 original social traits, friendships and five public bins", () => {
  assert.equal(NPC_RESIDENTS.length, 35);
  assert.equal(NPC_FRIEND_PAIRS.length, 67);
  assert.deepEqual(NPC_PUBLIC_BINS.map(({ id, x, y, capacity, initialFill }) => ({ id, x, y, capacity, initialFill })), [
    { id: "bin-02", x: 970, y: 1180, capacity: 12, initialFill: 3 },
    { id: "bin-09", x: 3260, y: 1120, capacity: 12, initialFill: 6 },
    { id: "bin-05", x: 2200, y: 1340, capacity: 12, initialFill: 9 },
    { id: "bin-13", x: 880, y: 2115, capacity: 12, initialFill: 4 },
    { id: "bin-17", x: 3980, y: 2440, capacity: 12, initialFill: 7 },
  ]);
  assert.deepEqual([...NPC_RESIDENTS.find((resident) => resident.name === "Maya").friendNames].sort(), ["Ava", "Ella", "Grace", "Sam"].sort());
  assert.deepEqual(NPC_RESIDENTS.find((resident) => resident.name === "Alfie").tidiness, 0.89);
});

test("fresh residents have bounded needs and symmetric persistent relationship scores", () => {
  const state = createFreshNpcState({ day: 1, clockMinutes: 360 });
  const maya = state.residents[0];
  const ava = state.residents[2];
  assert.deepEqual(maya.needs, { hunger: 24, social: 22, recreation: 18, errands: 12, rest: 18 });
  assert.equal(maya.relationships[ava.id], 35);
  assert.equal(ava.relationships[maya.id], 35);
  assert.equal(Object.keys(maya.relationships).length, 34);
  assert.equal(validateNpcState(state, { day: 1, clockMinutes: 360 }).ok, true);
});

test("legacy advanced residents, public bins and community counters import into the current schema", () => {
  const legacy = {
    npcs: [{ id: "npc-01", currentNodeId: "shop1", targetNodeId: "shop1", route: ["shop1"], routeIndex: 0, x: 305, y: 1120,
      actionState: "SHOPPING", activity: "Buying lunch", visible: false, needs: { hunger: 77 }, relationships: { "npc-03": 52 }, carryItem: "cup", carryLabel: "coffee cup", carryStage: "empty", litterDrops: 4 }],
    socialRestorationRuntime: { publicBins: [{ id: "bin-02", nodeId: "public-bin-02", capacity: 12, fill: 11, tipped: true, spillIds: ["spill-old-1"] }], npcBinTipEvents: 3, npcCommunityCareEvents: 9 },
  };
  const projected = projectLegacyNpcState(legacy, { day: 2, clockMinutes: 600 });
  assert.equal(projected.residents[0].currentNodeId, "shop1");
  assert.equal(projected.residents[0].carryItem, "cup");
  assert.equal(projected.residents[0].relationships["npc-03"], 52);
  assert.equal(projected.publicBins[0].fill, 11);
  assert.equal(projected.publicBins[0].tipped, true);
  assert.equal(projected.socialRuntime.binTipEvents, 3);
  const old = createFreshGameState({ now: 0 });
  old.schemaVersion = 24;
  const upgraded = upgradeGameState(old, { now: 0 });
  assert.equal(upgraded.schemaVersion, 29);
  assert.equal(validateGameState(upgraded).ok, true);
});

test("residents dispose into the exact persistent public bin and player-placed bin", () => {
  const publicState = createFreshGameState({ now: 0 });
  const maya = publicState.npcs.residents[0];
  Object.assign(maya, { currentNodeId: "public-bin-02", targetNodeId: "public-bin-02", route: ["public-bin-02"], routeIndex: 0, x: 970, y: 1180, visible: true, phase: "leisure" });
  carrying(maya, { type: "public", id: "bin-02", nodeId: "public-bin-02" });
  const publicGame = new GameStateService(publicState);
  const publicService = new NpcTownLifeService(publicGame, new Repository());
  advance(publicGame, 1);
  assert.equal(publicService.syncState({ persist: true }).ok, true);
  const publicAfter = publicGame.getSnapshot();
  assert.equal(publicAfter.npcs.publicBins[0].fill, 4);
  assert.equal(publicAfter.npcs.residents[0].responsibleDisposals, 1);

  const placedState = createFreshGameState({ now: 0 });
  placedState.townPlacement = normalizeTownPlacementState({ objects: [{ id: "placed-bin-1", itemId: "small-town-bin", x: 2800, y: 200, rotation: 0, binFill: 2 }] });
  const leo = placedState.npcs.residents[1];
  Object.assign(leo, { currentNodeId: "orchard", targetNodeId: "orchard", route: ["orchard"], routeIndex: 0, x: 3060, y: 280, visible: true, phase: "leisure" });
  carrying(leo, { type: "placed", id: "placed-bin-1", nodeId: "orchard" });
  const placedGame = new GameStateService(placedState);
  const placedService = new NpcTownLifeService(placedGame, new Repository());
  advance(placedGame, 1);
  assert.equal(placedService.syncState({ persist: true }).ok, true);
  const placedAfter = placedGame.getSnapshot();
  assert.equal(placedAfter.townPlacement.objects[0].binFill, 3);
  assert.equal(placedAfter.npcs.socialRuntime.placedBinDisposals, 1);
});

test("resident conversations are mutual and improve both relationship scores", () => {
  const state = createFreshGameState({ now: 0 });
  for (const resident of state.npcs.residents) resident.needs.social = 0;
  for (const id of ["npc-01", "npc-03"]) {
    const resident = state.npcs.residents.find((entry) => entry.id === id);
    Object.assign(resident, { currentNodeId: "square", targetNodeId: "square", route: ["square"], routeIndex: 0, x: 555, y: 1370, visible: true, phase: "leisure" });
    resident.needs.social = 100;
  }
  const gameState = new GameStateService(state);
  const service = new NpcTownLifeService(gameState, new Repository());
  for (let attempt = 0; attempt < 30 && !gameState.getSnapshot().npcs.residents[0].partnerId; attempt += 1) {
    advance(gameState, 10);
    service.syncState();
  }
  assert.equal(gameState.getSnapshot().npcs.residents[0].partnerId, "npc-03");
  advance(gameState, 30);
  service.syncState();
  const after = gameState.getSnapshot().npcs;
  assert.equal(after.residents[0].partnerId, null);
  assert.ok(after.residents[0].relationships["npc-03"] > 35);
  assert.equal(after.residents[0].relationships["npc-03"], after.residents[2].relationships["npc-01"]);
  assert.ok(after.conversationHistory.length >= 1);
});

test("NPC litter and tipped-bin spills enter the exact persistent environment model", () => {
  const state = createFreshGameState({ now: 0 });
  const anchor = state.environment.land.items.find((item) => !item.active && item.zone === "street");
  const dropped = placeNpcLandLitterInto(state, { x: anchor.x, y: anchor.y, type: "cup", npcId: "npc-30", npcName: "Alfie" });
  assert.equal(dropped.id, anchor.id);
  assert.equal(dropped.sourceNpcId, "npc-30");
  const spills = createBinSpillInto(state, { binId: "bin-02", x: 970, y: 1180, npcId: "npc-30", npcName: "Alfie", count: 4 });
  assert.equal(spills.length, 4);
  assert.equal(spills.every((item) => item.active && item.dynamicSpill && item.source === "bin-tip:npc-30"), true);
  assert.equal(validateGameState(state).ok, true);
});

test("failed NPC persistence rolls public-bin and resident changes back atomically", () => {
  const state = createFreshGameState({ now: 0 });
  const maya = state.npcs.residents[0];
  Object.assign(maya, { currentNodeId: "public-bin-02", targetNodeId: "public-bin-02", route: ["public-bin-02"], routeIndex: 0, x: 970, y: 1180, visible: true, phase: "leisure" });
  carrying(maya, { type: "public", id: "bin-02", nodeId: "public-bin-02" });
  const gameState = new GameStateService(state);
  const service = new NpcTownLifeService(gameState, new Repository(false));
  advance(gameState, 1);
  const before = gameState.getSnapshot();
  const result = service.syncState({ persist: true });
  assert.equal(result.status, "persistence-failed");
  assert.equal(result.rollbackOk, true);
  assert.deepEqual(gameState.getSnapshot(), before);
});
