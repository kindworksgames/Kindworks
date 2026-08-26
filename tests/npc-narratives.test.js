import test from "node:test";
import assert from "node:assert/strict";
import { NPC_RESIDENTS } from "../src/data/npcTownLife.js";
import { NPC_HOME_NARRATIVES, NPC_NARRATIVE_PROFILES } from "../src/data/npcNarratives.js";
import { createFreshGameState, createGameStateFromLegacy, GameStateService, upgradeGameState, validateGameState } from "../src/state/GameState.js";
import { validateNpcNarrativeState } from "../src/state/npcNarrativeState.js";
import { normalizeWorldState } from "../src/state/worldState.js";
import { NpcNarrativeService } from "../src/systems/NpcNarrativeService.js";
import { legacyFixtures } from "./fixtures/legacy-saves.js";

const repository = (ok = true) => ({ save: () => ({ ok, status: ok ? "saved" : "failed" }) });
const setup = (state = createFreshGameState({ now: 0 }), saved = true) => {
  const gameState = new GameStateService(state);
  return { gameState, service: new NpcNarrativeService(gameState, repository(saved), { now: () => 1000 }) };
};
const moveToDay = (gameState, day) => {
  const state = gameState.getSnapshot();
  state.world.day = day;
  state.world = normalizeWorldState(state.world, { now: day * 1000 });
  assert.equal(gameState.replace(state).ok, true);
  return gameState.getSnapshot();
};
const unlockThrough = (state, finalId) => {
  const order = ["wake", "commons", "highstreet", "river", "station", "shore", "green", "festival"];
  for (const id of order.slice(0, order.indexOf(finalId) + 1)) { state.restorationMilestones.unlocked[id] = true; state.restorationMilestones.unlockDay[id] = state.world.day; }
  state.restorationMilestones.lastUnlockedId = finalId;
};

test("Milestone 39 preserves all 35 authored four-stage resident arcs and 19 home stories", () => {
  assert.equal(NPC_RESIDENTS.length, 35);
  assert.equal(Object.keys(NPC_NARRATIVE_PROFILES).length, 35);
  assert.equal(Object.keys(NPC_HOME_NARRATIVES).length, 19);
  assert.equal(Object.values(NPC_NARRATIVE_PROFILES).reduce((sum, profile) => sum + profile.arc.length, 0), 140);
  for (const resident of NPC_RESIDENTS) {
    const profile = NPC_NARRATIVE_PROFILES[resident.name];
    assert.equal(profile.arc.length, 4, resident.name);
    assert.ok(profile.traits.length >= 2, resident.name);
    assert.ok(Object.keys(profile.bonds).length >= 2, resident.name);
    assert.ok(NPC_HOME_NARRATIVES[resident.homeNodeId], resident.homeNodeId);
  }
});

test("fresh residents contain valid bounded persistent narrative history", () => {
  const state = createFreshGameState({ now: 0 });
  assert.equal(state.schemaVersion, 35);
  assert.equal(validateGameState(state).ok, true);
  for (const resident of state.npcs.residents) {
    assert.equal(validateNpcNarrativeState(resident.narrativeState).ok, true);
    assert.equal(resident.narrativeState.storyStage, 0);
    assert.deepEqual(resident.narrativeState.recentThoughtIds, []);
  }
});

test("contextual thoughts are deterministic, saved deliberately and do not immediately repeat", () => {
  const { service, gameState } = setup();
  const first = service.selectThought("npc-01");
  const second = service.selectThought("npc-01");
  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.notEqual(first.thought.id, second.thought.id);
  const saved = gameState.getSnapshot().npcs.residents[0].narrativeState;
  assert.equal(saved.selectionCount, 2);
  assert.equal(saved.recentThoughtIds.length, 2);
  assert.equal(saved.lastThoughtText, second.thought.text);
  assert.match(second.thought.text, /Willowmere|town|Café|home|Morningbell|day|weather|Maya|neighbour/i);
});

test("story gates require durable selections, routines, jobs, relationships and restorations", () => {
  const { service, gameState } = setup();
  assert.equal(service.selectThought("npc-01").progression.advanced, false);
  let state = moveToDay(gameState, 2);
  state.npcs.residents[0].completedActivities = 2;
  gameState.replace(state);
  assert.equal(service.selectThought("npc-01").progression.stage, 1);

  state = gameState.getSnapshot();
  state = moveToDay(gameState, 3);
  state.progress.completedJobCount = 6;
  unlockThrough(state, "highstreet");
  state.npcs.residents[0].completedActivities = 8;
  state.npcs.residents[0].relationships["npc-06"] = 45;
  gameState.replace(state);
  assert.equal(service.selectThought("npc-01").progression.advanced, false);
  assert.equal(service.selectThought("npc-01").progression.stage, 2);

  state = gameState.getSnapshot();
  state.progress.completedJobCount = 18;
  state.npcs.residents[0].completedActivities = 18;
  unlockThrough(state, "green");
  state.world.day = 4;
  state.world = normalizeWorldState(state.world, { now: 4000 });
  gameState.replace(state);
  service.selectThought("npc-01");
  state = moveToDay(gameState, 5);
  service.selectThought("npc-01");
  const complete = service.selectThought("npc-01");
  assert.equal(complete.progression.stage, 3);
  assert.equal(service.getStory("npc-01").narrative.stageHistory.length, 3);
  assert.equal(service.getStory("npc-01").narrative.storyCompletedDay, 5);
});

test("thoughts can reference completed work, restored places and reopened businesses", () => {
  const state = createFreshGameState({ now: 0 });
  state.progress.completedJobCount = 22;
  unlockThrough(state, "station");
  const { service } = setup(state);
  const maya = service.residentRecord("npc-01", state);
  const henry = service.residentRecord("npc-20", state);
  const mayaCategories = new Set(service.candidates(maya, state).candidates.map((entry) => entry.category));
  const henryCandidates = service.candidates(henry, state).candidates;
  assert.equal(mayaCategories.has("jobs"), true);
  assert.equal(mayaCategories.has("restoration"), true);
  assert.equal(henryCandidates.some((entry) => entry.category === "business" && /reopened/.test(entry.text)), true);
});

test("legacy version-82 narrative records and schema-33 saves convert without changing their source", () => {
  const legacy = structuredClone(legacyFixtures.currentV82);
  legacy.npcNarratives["npc-01"] = { schemaVersion: 3, storyStage: 2, selectionCount: 6, selectedDays: [2, 4, 6], stageAdvancedAtDay: 6,
    lastThoughtId: "legacy-thought", lastThoughtText: "A preserved thought from Willowmere.", recentThoughtIds: ["legacy-thought"] };
  const imported = createGameStateFromLegacy(legacy, { ok: true, sourceKey: "legacy-narrative", warnings: [] }, { now: 1000 });
  assert.equal(imported.npcs.residents[0].narrativeState.storyStage, 2);
  assert.equal(imported.npcs.residents[0].narrativeState.lastThoughtText, "A preserved thought from Willowmere.");
  assert.deepEqual(imported.legacySnapshot.npcNarratives["npc-01"], legacy.npcNarratives["npc-01"]);
  const old = createFreshGameState({ now: 0 });
  old.schemaVersion = 33;
  delete old.npcs.residents[0].narrativeState;
  const upgraded = upgradeGameState(old);
  assert.equal(upgraded.schemaVersion, 35);
  assert.equal(validateNpcNarrativeState(upgraded.npcs.residents[0].narrativeState).ok, true);
});

test("a failed story save restores the exact resident narrative", () => {
  const { service, gameState } = setup(createFreshGameState({ now: 0 }), false);
  const before = gameState.getSnapshot().npcs.residents[0].narrativeState;
  const result = service.selectThought("npc-01");
  assert.equal(result.ok, false);
  assert.equal(result.code, "persistence-failed");
  assert.deepEqual(gameState.getSnapshot().npcs.residents[0].narrativeState, before);
});

test("diagnostics expose complete authored coverage and bounded persistence", () => {
  const { service } = setup();
  assert.deepEqual(service.getDiagnostics(), {
    version: "3.0.0-milestone-39", enabled: true, residentCount: 35, profileCount: 35, homeStoryCount: 19,
    chapterCount: 140, completedStories: 0, persistentHistory: true, deterministicThoughts: true, recentThoughtLimit: 6,
    profileIssues: [], valid: true, lastResult: { ok: true, code: "ready" },
  });
});
