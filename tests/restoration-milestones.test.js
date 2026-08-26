import test from "node:test";
import assert from "node:assert/strict";
import {
  FIRST_RESTORATION_GIFT_ITEM_ID,
  RESTORATION_MILESTONE_ORDER,
  RESTORATION_MILESTONES,
} from "../src/data/restorationMilestones.js";
import { NPC_SOCIAL_CONFIG } from "../src/data/npcTownLife.js";
import { inventoryLimitFor, ITEM_CATALOG } from "../src/data/items.js";
import {
  createFreshGameState,
  createGameStateFromLegacy,
  GameStateService,
  upgradeGameState,
  validateGameState,
} from "../src/state/GameState.js";
import { SaveRepository } from "../src/state/SaveRepository.js";
import {
  evaluateRestorationMilestonesInto,
  pendingRestorationMilestoneIds,
  registerRestorationCleanupInto,
  registerRestorationPlacementInto,
  restorationFestivalActive,
  restorationMilestoneCondition,
  restorationZoneForPosition,
  validateRestorationMilestoneState,
} from "../src/state/restorationMilestoneState.js";
import { RestorationMilestoneService } from "../src/systems/RestorationMilestoneService.js";
import { MemoryStorage } from "./helpers/MemoryStorage.js";
import { legacyFixtures } from "./fixtures/legacy-saves.js";

class Repository {
  constructor(ok = true) {
    this.ok = ok;
    this.saves = [];
  }

  save(state) {
    if (!this.ok) return { ok: false, status: "fixture-failure" };
    this.saves.push(structuredClone(state));
    return { ok: true, status: "saved" };
  }
}

function cleanup(state, eventId, jobType, worldPosition = { x: 300, y: 300 }, percent = 100) {
  return registerRestorationCleanupInto(state, {
    eventId,
    jobType,
    worldPosition,
    percent,
    occurredAt: "1970-01-01T00:00:01.000Z",
  });
}

test("Milestone 30 preserves the original eight restoration definitions and reveal focuses", () => {
  assert.deepEqual(RESTORATION_MILESTONE_ORDER, ["wake", "commons", "highstreet", "river", "station", "shore", "green", "festival"]);
  assert.deepEqual(
    RESTORATION_MILESTONE_ORDER.map((id) => [RESTORATION_MILESTONES[id].icon, RESTORATION_MILESTONES[id].title, RESTORATION_MILESTONES[id].focus]),
    [
      ["💦", "WILLOWMERE IS WAKING UP", { x: 550, y: 1020, zoom: 0.82 }],
      ["🌳", "WILLOW COMMONS REOPENS", { x: 1570, y: 1215, zoom: 0.76 }],
      ["🏘️", "HIGH STREET COMES BACK TO LIFE", { x: 3260, y: 600, zoom: 0.74 }],
      ["🐟", "THE RIVER RETURNS", { x: 2650, y: 1180, zoom: 0.73 }],
      ["🎬", "KINDWORKS CINEMA REOPENS", { x: 3890, y: 330, zoom: 0.78 }],
      ["🏖️", "SOUTH SHORE REOPENS", { x: 3720, y: 2440, zoom: 0.72 }],
      ["🌲", "WILLOWMERE IS GROWING GREENER", { x: 1570, y: 1215, zoom: 0.7 }],
      ["🎉", "THE WILLOWMERE FESTIVAL", { x: 1050, y: 1110, zoom: 0.6 }],
    ],
  );
  assert.ok(RESTORATION_MILESTONE_ORDER.every((id) => RESTORATION_MILESTONES[id].text && RESTORATION_MILESTONES[id].change && RESTORATION_MILESTONES[id].permanentChanges.length >= 2));
  assert.deepEqual(
    {
      river: NPC_SOCIAL_CONFIG.riverRestoredMultiplier,
      green: NPC_SOCIAL_CONFIG.greenTownMultiplier,
      festival: NPC_SOCIAL_CONFIG.festivalMultiplier,
    },
    { river: 0.18, green: 0.45, festival: 0.2 },
  );
});

test("restoration zones use the exact original Commons, High Street, Station and Shore bounds", () => {
  assert.equal(restorationZoneForPosition({ x: 1060, y: 950 }), "commons");
  assert.equal(restorationZoneForPosition({ x: 2080, y: 1480 }), "commons");
  assert.equal(restorationZoneForPosition({ x: 2760, y: 340 }), "highstreet");
  assert.equal(restorationZoneForPosition({ x: 3820, y: 1180 }), "highstreet");
  assert.equal(restorationZoneForPosition({ x: 3550, y: 650 }), "station");
  assert.equal(restorationZoneForPosition({ x: 3320, y: 2110 }), "shore");
  assert.equal(restorationZoneForPosition({ x: 1059, y: 950 }), "other");
});

test("the exact cleanup and placement gates unlock all eight milestones sequentially", () => {
  const state = createFreshGameState({ now: 0 });
  state.environment.river.items = [];
  const unlocked = [];
  const record = (result) => unlocked.push(...result.newlyUnlocked.map((entry) => entry.id));

  record(cleanup(state, "job-1", "lawn"));
  record(cleanup(state, "job-2", "waste"));
  record(cleanup(state, "job-3", "lawn"));
  record(cleanup(state, "job-4", "waste"));
  assert.deepEqual(unlocked, []);
  record(cleanup(state, "job-5", "lawn"));
  assert.deepEqual(unlocked, ["wake"]);

  record(cleanup(state, "job-6", "waste", { x: 1200, y: 1100 }));
  record(cleanup(state, "job-7", "lawn", { x: 1450, y: 1200 }));
  record(cleanup(state, "job-8", "waste", { x: 1800, y: 1300 }));
  assert.equal(unlocked.at(-1), "commons");

  record(cleanup(state, "job-9", "lawn", { x: 3000, y: 600 }));
  record(cleanup(state, "job-10", "waste"));
  record(cleanup(state, "job-11", "lawn"));
  record(cleanup(state, "job-12", "waste"));
  assert.equal(unlocked.at(-1), "highstreet");

  record(cleanup(state, "job-13", "river"));
  record(cleanup(state, "job-14", "river"));
  record(cleanup(state, "job-15", "river"));
  assert.equal(unlocked.at(-1), "river");

  record(cleanup(state, "job-16", "lawn"));
  record(cleanup(state, "job-17", "waste"));
  record(cleanup(state, "job-18", "lawn"));
  assert.equal(unlocked.at(-1), "station");

  record(cleanup(state, "job-19", "waste", { x: 3500, y: 2300 }));
  record(cleanup(state, "job-20", "lawn", { x: 3800, y: 2400 }));
  record(cleanup(state, "job-21", "waste"));
  record(cleanup(state, "job-22", "lawn"));
  assert.equal(unlocked.at(-1), "shore");

  state.townPlacement.objects = [
    { type: "tree" }, { type: "tree" }, { type: "tree" }, { type: "tree" },
    { type: "bin" }, { type: "bench" },
  ];
  record(registerRestorationPlacementInto(state, { eventId: "placement-green" }));
  assert.equal(unlocked.at(-1), "green");

  for (let index = 23; index <= 28; index += 1) record(cleanup(state, `job-${index}`, index % 2 ? "lawn" : "waste"));
  assert.deepEqual(unlocked, RESTORATION_MILESTONE_ORDER);
  assert.equal(state.restorationMilestones.counters.totalAccepted, 28);
  assert.equal(state.restorationMilestones.firstRestorationGift.granted, true);
  assert.equal(state.inventory.placeables[FIRST_RESTORATION_GIFT_ITEM_ID], 1);
  assert.equal(state.economy.ledger.filter((entry) => entry.kind === "first-restoration-gift").length, 1);
  assert.deepEqual(pendingRestorationMilestoneIds(state.restorationMilestones), RESTORATION_MILESTONE_ORDER);
  assert.equal(validateRestorationMilestoneState(state.restorationMilestones).ok, true);
});

test("one completion unlocks at most one restoration and duplicate completions never count twice", () => {
  const state = createFreshGameState({ now: 0 });
  state.restorationMilestones.counters.totalAccepted = 28;
  Object.assign(state.restorationMilestones.counters.cleanupByType, { lawn: 12, river: 8, waste: 8 });
  Object.assign(state.restorationMilestones.counters.zones, { commons: 3, highstreet: 1, station: 1, shore: 2 });
  state.environment.river.items = [];
  state.townPlacement.objects = [{ type: "tree" }, { type: "tree" }, { type: "tree" }, { type: "tree" }, { type: "bin" }, { type: "picnic" }];
  assert.deepEqual(evaluateRestorationMilestonesInto(state, { trigger: "any" }).map((entry) => entry.id), ["wake"]);
  assert.deepEqual(evaluateRestorationMilestonesInto(state, { trigger: "any" }).map((entry) => entry.id), ["commons"]);
  const first = cleanup(state, "unique-completion", "beach");
  const total = state.restorationMilestones.counters.totalAccepted;
  const duplicate = cleanup(state, "unique-completion", "beach");
  assert.equal(first.type, "waste");
  assert.equal(duplicate.duplicate, true);
  assert.equal(state.restorationMilestones.counters.totalAccepted, total);
});

test("alternate litter conditions and each physical Green requirement remain exact", () => {
  const state = createFreshGameState({ now: 0 });
  state.restorationMilestones.unlocked.wake = true;
  state.restorationMilestones.unlockDay.wake = 1;
  state.restorationMilestones.counters.totalAccepted = 8;
  state.environment.land.items = Array.from({ length: 5 }, (_, index) => ({ id: `park-${index}`, zone: "park", active: true }));
  assert.equal(restorationMilestoneCondition(state, "commons"), false);
  state.environment.land.items[0].active = false;
  assert.equal(restorationMilestoneCondition(state, "commons"), true);

  for (const id of ["commons", "highstreet", "river", "station", "shore"]) {
    state.restorationMilestones.unlocked[id] = true;
    state.restorationMilestones.unlockDay[id] = 1;
  }
  state.townPlacement.objects = [{ type: "tree" }, { type: "tree" }, { type: "tree" }, { type: "tree" }, { type: "bin" }];
  assert.equal(restorationMilestoneCondition(state, "green"), false);
  state.townPlacement.objects.push({ type: "picnic" });
  assert.equal(restorationMilestoneCondition(state, "green"), true);
});

test("the festival celebration lasts exactly one game day while its unlock stays permanent", () => {
  const gameState = new GameStateService(createFreshGameState({ now: 0 }));
  const service = new RestorationMilestoneService(gameState, new Repository(), { now: () => 1000 });
  assert.equal(service.unlockForQa("festival", { revealed: true }).ok, true);
  const unlocked = gameState.getSnapshot();
  assert.equal(unlocked.restorationMilestones.festivalUntilGameMinute, 1860);
  assert.equal(restorationFestivalActive(unlocked), true);
  const ended = structuredClone(unlocked);
  ended.world.day = 2;
  ended.world.clockMinutes = 420;
  assert.equal(restorationFestivalActive(ended), false);
  assert.equal(ended.restorationMilestones.unlocked.festival, true);
});

test("a temporarily full planter stack defers rather than loses the one-time restoration gift", () => {
  const state = createFreshGameState({ now: 0 });
  const limit = inventoryLimitFor(ITEM_CATALOG[FIRST_RESTORATION_GIFT_ITEM_ID]);
  state.inventory.placeables[FIRST_RESTORATION_GIFT_ITEM_ID] = limit;
  cleanup(state, "gift-1", "lawn");
  cleanup(state, "gift-2", "waste");
  cleanup(state, "gift-3", "lawn");
  cleanup(state, "gift-4", "waste");
  cleanup(state, "gift-5", "lawn");
  assert.equal(state.restorationMilestones.unlocked.wake, true);
  assert.equal(state.restorationMilestones.firstRestorationGift.granted, false);
  state.inventory.placeables[FIRST_RESTORATION_GIFT_ITEM_ID] = limit - 1;
  registerRestorationPlacementInto(state, { eventId: "gift-space-created", occurredAt: "1970-01-01T00:00:02.000Z" });
  assert.equal(state.inventory.placeables[FIRST_RESTORATION_GIFT_ITEM_ID], limit);
  assert.equal(state.restorationMilestones.firstRestorationGift.granted, true);
  registerRestorationPlacementInto(state, { eventId: "gift-no-duplicate", occurredAt: "1970-01-01T00:00:03.000Z" });
  assert.equal(state.inventory.placeables[FIRST_RESTORATION_GIFT_ITEM_ID], limit);
});

test("reveal state, gift state and all permanent unlocks survive a saved reload", () => {
  const storage = new MemoryStorage();
  const repository = new SaveRepository(storage);
  const gameState = new GameStateService(createFreshGameState({ now: 0 }));
  const service = new RestorationMilestoneService(gameState, repository, { now: () => 1000 });
  assert.equal(service.unlockForQa("festival", { revealed: false }).ok, true);
  assert.equal(service.markRevealed("festival").ok, true);
  const loaded = repository.load();
  assert.equal(loaded.ok, true);
  const restored = new GameStateService(loaded.state).getSnapshot();
  assert.deepEqual(RESTORATION_MILESTONE_ORDER.filter((id) => restored.restorationMilestones.unlocked[id]), RESTORATION_MILESTONE_ORDER);
  assert.equal(restored.restorationMilestones.revealed.festival, true);
  assert.equal(restored.restorationMilestones.firstRestorationGift.granted, true);
  assert.equal(restored.inventory.placeables[FIRST_RESTORATION_GIFT_ITEM_ID], 1);
  assert.equal(validateGameState(restored).ok, true);
});

test("original milestone saves and pre-v36 cleanup progress convert without losing their history", () => {
  const legacy = structuredClone(legacyFixtures.currentV82);
  legacy.milestones = {
    unlocked: { wake: true, commons: true, highstreet: true },
    revealed: { wake: true, commons: true },
    unlockDay: { wake: 9, commons: 12, highstreet: 15 },
    counters: {
      totalAccepted: 12,
      cleanupByType: { lawn: 5, river: 3, waste: 4 },
      perfectByType: { lawn: 2, river: 1, waste: 4 },
      zones: { commons: 3, highstreet: 1, station: 0, shore: 0 },
    },
    festivalUntilGameMinute: 0,
  };
  legacy.onboarding = { firstRestorationGiftGranted: true };
  legacy.economy.inventory.placeables["town-planter"] = 1;
  const imported = createGameStateFromLegacy(legacy, { ok: true, sourceKey: "legacy-restoration", warnings: [] }, { now: 1000 });
  assert.equal(imported.restorationMilestones.unlocked.highstreet, true);
  assert.equal(imported.restorationMilestones.revealed.commons, true);
  assert.equal(imported.restorationMilestones.unlockDay.wake, 9);
  assert.equal(imported.restorationMilestones.counters.totalAccepted, 12);
  assert.equal(imported.restorationMilestones.firstRestorationGift.granted, true);

  const old = structuredClone(legacyFixtures.currentV82);
  old.version = 35;
  delete old.milestones;
  delete old.onboarding;
  old.completedJobCount = 5;
  old.miniGameProgress = { lawn: { completed: 3 }, river: { completed: 0 }, waste: { completed: 2 } };
  const bootstrapped = createGameStateFromLegacy(old, { ok: true, sourceKey: "legacy-pre-v36", warnings: [] }, { now: 1000 });
  assert.equal(bootstrapped.restorationMilestones.unlocked.wake, true);
  assert.equal(bootstrapped.restorationMilestones.revealed.wake, true);
  assert.equal(bootstrapped.restorationMilestones.counters.totalAccepted, 5);
});

test("schema 26 upgrades add a valid restoration domain and failed saves roll back atomically", () => {
  const old = createFreshGameState({ now: 0 });
  delete old.restorationMilestones;
  old.schemaVersion = 26;
  old.economy.coins = 4321;
  old.economy.lifetimeCoinsEarned = 4321;
  const upgraded = upgradeGameState(old, { now: 1000 });
  assert.equal(upgraded.schemaVersion, 34);
  assert.equal(upgraded.economy.coins, 4321);
  assert.equal(validateRestorationMilestoneState(upgraded.restorationMilestones).ok, true);
  assert.equal(validateGameState(upgraded).ok, true);

  const gameState = new GameStateService(createFreshGameState({ now: 0 }));
  const service = new RestorationMilestoneService(gameState, new Repository(false), { now: () => 1000 });
  const before = gameState.getSnapshot();
  const failed = service.unlockForQa("wake");
  assert.equal(failed.code, "persistence-failed");
  assert.equal(failed.rollbackOk, true);
  assert.deepEqual(gameState.getSnapshot(), before);
});
