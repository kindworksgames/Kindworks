import test from "node:test";
import assert from "node:assert/strict";
import {
  HOMEOWNER_GIFT_CONFIG,
  homeownerGiftTierForItem,
  homeownerGiftTierFromRoll,
} from "../src/data/homeownerGifts.js";
import { LAWN_PLOTS } from "../src/data/farming.js";
import { ITEM_CATALOG, inventoryBucketFor } from "../src/data/items.js";
import { createFreshGameState, GameStateService, upgradeGameState, validateGameState } from "../src/state/GameState.js";
import { normalizeHomeownerGiftState } from "../src/state/homeownerGiftState.js";
import { SaveRepository } from "../src/state/SaveRepository.js";
import { HomeownerGiftService, chooseHomeownerGiftItem, queueHomeownerGiftInto } from "../src/systems/HomeownerGiftService.js";
import { HouseRescueService } from "../src/systems/HouseRescueService.js";
import { LawnCareService } from "../src/systems/LawnCareService.js";
import { MemoryStorage } from "./helpers/MemoryStorage.js";

function runtime({ state = createFreshGameState({ now: 0 }), repository = new SaveRepository(new MemoryStorage()), now = () => 1000 } = {}) {
  const gameState = new GameStateService(state);
  return {
    gameState,
    gifts: new HomeownerGiftService(gameState, repository, { now }),
    houseRescue: new HouseRescueService(gameState, repository, { now }),
    lawnCare: new LawnCareService(gameState, repository, { now }),
    repository,
  };
}

function guaranteedGift(state, options = {}) {
  return queueHomeownerGiftInto(state, {
    source: "house-rescue",
    houseId: "house-1",
    eventId: "homeowner:test:gift-1",
    forceTier: "thoughtful",
    ignoreUnlock: true,
    now: 1000,
    ...options,
  });
}

test("pins the original homeowner gift odds, care windows, limits and exact price tiers", () => {
  assert.equal(HOMEOWNER_GIFT_CONFIG.householdCooldownDays, 7);
  assert.equal(HOMEOWNER_GIFT_CONFIG.fullCareWindowDays, 7);
  assert.equal(HOMEOWNER_GIFT_CONFIG.minimumLawnPercent, 80);
  assert.equal(HOMEOWNER_GIFT_CONFIG.pityAfterMisses, 15);
  assert.deepEqual(HOMEOWNER_GIFT_CONFIG.priceTiers, {
    small: [1, 1800], thoughtful: [1801, 5000], rare: [5001, 15000], exceptional: [15001, Number.MAX_SAFE_INTEGER],
  });
  assert.equal(Object.values(HOMEOWNER_GIFT_CONFIG.odds.normal).reduce((sum, chance) => sum + chance, 0), 0.08);
  assert.ok(Math.abs(Object.values(HOMEOWNER_GIFT_CONFIG.odds.fullCare).reduce((sum, chance) => sum + chance, 0) - 0.1) < Number.EPSILON);
  assert.ok(Math.abs(HOMEOWNER_GIFT_CONFIG.odds.normal.rare + HOMEOWNER_GIFT_CONFIG.odds.normal.exceptional - 0.01) < Number.EPSILON);
  assert.equal(homeownerGiftTierForItem({ price: 1800 }), "small");
  assert.equal(homeownerGiftTierForItem({ price: 1801 }), "thoughtful");
  assert.equal(homeownerGiftTierForItem({ price: 5001 }), "rare");
  assert.equal(homeownerGiftTierForItem({ price: 15001 }), "exceptional");
  assert.deepEqual([homeownerGiftTierFromRoll(0), homeownerGiftTierFromRoll(0.001), homeownerGiftTierFromRoll(0.01), homeownerGiftTierFromRoll(0.03), homeownerGiftTierFromRoll(0.08)], ["exceptional", "rare", "thoughtful", "small", null]);
});

test("fresh schema 33 state has a valid empty homeowner gift domain", () => {
  const state = createFreshGameState({ now: 0 });
  assert.equal(state.schemaVersion, 35);
  assert.equal(validateGameState(state).ok, true);
  assert.deepEqual(state.homeownerGifts, {
    format: 2, misses: 0, totalGifts: 0, totalGiftValueReceived: 0, households: {}, processedEventIds: [], history: [], queue: [],
  });
});

test("lawn work below 80 percent is ineligible and remains safely retryable", () => {
  const state = createFreshGameState({ now: 0 });
  const result = queueHomeownerGiftInto(state, { source: "lawn", houseId: "house-1", eventId: "homeowner:lawn:low", percent: 79, forceTier: "small", now: 1000 });
  assert.equal(result.eligible, false);
  assert.match(result.reason, /80%/);
  assert.equal(state.homeownerGifts.processedEventIds.includes("homeowner:lawn:low"), false);
  assert.deepEqual(state.homeownerGifts.households, {});
});

test("one eligible care event is processed once and a duplicate cannot change pity or inventory", () => {
  const state = createFreshGameState({ now: 0 });
  const first = queueHomeownerGiftInto(state, { source: "house-rescue", houseId: "house-1", eventId: "homeowner:duplicate", forceRoll: 0.99, now: 1000 });
  assert.equal(first.gift, false);
  assert.equal(state.homeownerGifts.misses, 1);
  const before = structuredClone(state);
  const duplicate = queueHomeownerGiftInto(state, { source: "house-rescue", houseId: "house-1", eventId: "homeowner:duplicate", forceTier: "exceptional", now: 2000 });
  assert.equal(duplicate.duplicate, true);
  assert.deepEqual(state, before);
});

test("inside-and-out care within seven days uses full-care rules and household cooldown", () => {
  const state = createFreshGameState({ now: 0 });
  const lawn = queueHomeownerGiftInto(state, { source: "lawn", houseId: "house-1", eventId: "homeowner:lawn:first", percent: 100, forceRoll: 0.99, now: 1000 });
  assert.equal(lawn.fullCare, false);
  state.world.day = 3;
  const rescue = queueHomeownerGiftInto(state, { source: "house-rescue", houseId: "house-1", eventId: "homeowner:rescue:full", forceTier: "small", ignoreUnlock: true, now: 2000 });
  assert.equal(rescue.gift, true);
  assert.equal(rescue.record.fullCare, true);
  assert.match(rescue.record.dialogue, /home|garden|inside and out/i);
  state.world.day = 5;
  const coolingDown = queueHomeownerGiftInto(state, { source: "lawn", houseId: "house-1", eventId: "homeowner:lawn:cooldown", percent: 100, forceTier: "small", now: 3000 });
  assert.equal(coolingDown.cooldown, true);
  assert.equal(state.homeownerGifts.households.home01.lastLawnDay, 5);
  assert.equal(state.homeownerGifts.households.home01.lastGiftDay, 3);
  state.world.day = 10;
  const ready = queueHomeownerGiftInto(state, { source: "lawn", houseId: "house-1", eventId: "homeowner:lawn:ready", percent: 100, forceTier: "small", ignoreUnlock: true, now: 4000 });
  assert.equal(ready.gift, true);
});

test("the sixteenth eligible chance is guaranteed after fifteen misses", () => {
  const state = createFreshGameState({ now: 0 });
  state.homeownerGifts.misses = 15;
  const result = queueHomeownerGiftInto(state, { source: "house-rescue", houseId: "house-1", eventId: "homeowner:pity", forceRoll: 0.99, ignoreUnlock: true, now: 1000 });
  assert.equal(result.record.pity, true);
  assert.equal(result.gift, true);
  assert.equal(result.record.tier, "small");
  assert.equal(state.homeownerGifts.misses, 0);
});

test("gift selection excludes protected stock, respects themes and downgrades unavailable tiers", () => {
  const state = createFreshGameState({ now: 0 });
  const lawn = chooseHomeownerGiftItem(state, "thoughtful", "lawn", false, "selection:lawn", { ignoreUnlock: true });
  assert.ok(lawn.item.slot === "mower" || lawn.item.category === "placeable");
  const rescue = chooseHomeownerGiftItem(state, "thoughtful", "house-rescue", false, "selection:rescue", { ignoreUnlock: true });
  assert.ok(rescue.item.slot === "vacuum" || rescue.item.category === "furniture");
  for (const id of ["record-player", "starter-mower", "starter-vacuum", "ornamental-fish-tank", "kindly-heart-planter", "__qa-young-tree"]) {
    assert.notEqual(lawn.item.id, id);
    assert.notEqual(rescue.item.id, id);
  }
  const exceptional = chooseHomeownerGiftItem(state, "exceptional", "house-rescue", false, "selection:exceptional", { ignoreUnlock: true });
  assert.ok(exceptional);
  assert.ok(["exceptional", "rare", "thoughtful", "small"].includes(exceptional.tier));
});

test("a full delivery queue is retryable and does not consume the event", () => {
  const state = createFreshGameState({ now: 0 });
  state.homeownerGifts.queue = Array.from({ length: HOMEOWNER_GIFT_CONFIG.queueLimit }, (_, index) => ({ id: `waiting-${index}` }));
  const result = queueHomeownerGiftInto(state, { source: "house-rescue", houseId: "house-1", eventId: "homeowner:queue-full", forceTier: "small", now: 1000 });
  assert.equal(result.queueFull, true);
  assert.equal(result.retryable, true);
  assert.equal(state.homeownerGifts.processedEventIds.includes("homeowner:queue-full"), false);
});

test("grant, queue, history, household and zero-value ledger update as one mutation", () => {
  const state = createFreshGameState({ now: 0 });
  const beforeTransaction = state.economy.nextTransactionId;
  const result = guaranteedGift(state);
  assert.equal(result.gift, true);
  const bucket = inventoryBucketFor(result.item);
  assert.equal(state.inventory[bucket][result.item.id], 1);
  assert.equal(state.homeownerGifts.queue.length, 1);
  assert.equal(state.homeownerGifts.history.length, 1);
  assert.equal(state.homeownerGifts.totalGifts, 1);
  assert.equal(state.homeownerGifts.totalGiftValueReceived, result.item.price);
  assert.equal(state.homeownerGifts.households.home01.giftsGiven, 1);
  assert.equal(state.economy.nextTransactionId, beforeTransaction + 1);
  assert.equal(state.economy.ledger.at(-1).kind, "homeowner-gift");
  assert.equal(state.economy.ledger.at(-1).amount, 0);
  assert.equal(state.economy.coins, 100);
  assert.equal(validateGameState(state).ok, true);
});

test("acknowledgement removes only the queue entry and keeps the owned item", () => {
  const state = createFreshGameState({ now: 0 });
  const queued = guaranteedGift(state);
  const { gameState, gifts } = runtime({ state });
  const result = gifts.acknowledge(queued.record.id);
  assert.equal(result.ok, true);
  const saved = gameState.getSnapshot();
  assert.equal(saved.homeownerGifts.queue.length, 0);
  assert.equal(saved.homeownerGifts.history[0].revealed, true);
  assert.equal(saved.inventory[inventoryBucketFor(queued.item)][queued.item.id], 1);
});

test("a failed acknowledgement save restores the exact waiting gift", () => {
  const state = createFreshGameState({ now: 0 });
  const queued = guaranteedGift(state);
  const { gameState, gifts } = runtime({ state, repository: { save: () => ({ ok: false, status: "write-failed" }) } });
  const before = gameState.getSnapshot();
  const result = gifts.acknowledge(queued.record.id);
  assert.equal(result.code, "persistence-failed");
  assert.deepEqual(gameState.getSnapshot(), before);
});

test("schema 30 legacy cooldowns and waiting gifts convert without touching the snapshot", () => {
  const old = createFreshGameState({ now: 0 });
  old.schemaVersion = 30;
  old.source = { kind: "legacy-import", legacyVersion: 82, legacySourceKey: "legacy", importedAt: old.updatedAt, warnings: [] };
  old.inventory.furniture["cosy-sofa"] = 1;
  old.legacySnapshot = {
    version: 82,
    homeownerGifts: {
      format: 2,
      misses: 7,
      totalGifts: 1,
      totalGiftValueReceived: 2400,
      households: { home01: { lastGiftDay: 12, lastLawnDay: 10, lastHouseDay: 12, giftsGiven: 1 } },
      processedEventIds: ["legacy:gift:1"],
      history: [{ id: "legacy-gift-1", eventId: "legacy:gift:1", source: "house-rescue", houseId: "house-01", ownerId: "npc-01", ownerName: "Maya", itemId: "cosy-sofa", rolledTier: "thoughtful", day: 12, at: 1000, dialogue: "Thank you.", revealed: false }],
      queue: [{ id: "legacy-gift-1", eventId: "legacy:gift:1", source: "house-rescue", houseId: "house-01", ownerId: "npc-01", ownerName: "Maya", itemId: "cosy-sofa", rolledTier: "thoughtful", day: 12, at: 1000, dialogue: "Thank you.", revealed: false }],
    },
  };
  const snapshot = structuredClone(old.legacySnapshot);
  const upgraded = upgradeGameState(old, { now: 2000 });
  assert.equal(upgraded.schemaVersion, 35);
  assert.equal(upgraded.homeownerGifts.misses, 7);
  assert.equal(upgraded.homeownerGifts.households.home01.lastGiftDay, 12);
  assert.equal(upgraded.homeownerGifts.queue[0].houseId, "house-1");
  assert.equal(upgraded.homeownerGifts.queue[0].itemName, ITEM_CATALOG["cosy-sofa"].name);
  assert.deepEqual(upgraded.legacySnapshot, snapshot);
  assert.equal(validateGameState(upgraded).ok, true);
});

test("legacy waiting gifts without matching owned inventory are safely dropped", () => {
  const state = createFreshGameState({ now: 0 });
  const raw = guaranteedGift(state);
  state.inventory[inventoryBucketFor(raw.item)][raw.item.id] = 0;
  const normalized = normalizeHomeownerGiftState(state.homeownerGifts, state.inventory);
  assert.equal(normalized.history.length, 1);
  assert.equal(normalized.queue.length, 0);
});

test("House Rescue queues its guaranteed homeowner gift in the same successful save", () => {
  const state = createFreshGameState({ now: 0 });
  state.homeownerGifts.misses = 15;
  const { gameState, houseRescue } = runtime({ state });
  assert.equal(houseRescue.startLevel(1, { houseId: "house-1" }).ok, true);
  const result = houseRescue.qaComplete();
  assert.equal(result.ok, true);
  assert.equal(result.homeownerGift.gift, true);
  assert.equal(result.homeownerGift.record.pity, true);
  assert.equal(result.homeownerGift.record.eventId, "homeowner:house-rescue:house-1:1");
  assert.equal(gameState.getSnapshot().homeownerGifts.queue.length, 1);
});

test("a 100-percent town lawn queues its guaranteed homeowner gift in the same save", () => {
  const state = createFreshGameState({ now: 0 });
  state.homeownerGifts.misses = 15;
  const { gameState, lawnCare } = runtime({ state });
  const plot = LAWN_PLOTS[0];
  const begun = lawnCare.beginTownJob(plot.id);
  assert.equal(begun.ok, true);
  const result = lawnCare.completeCertified(begun.session.id);
  assert.equal(result.ok, true);
  assert.equal(result.homeownerGift.gift, true);
  assert.equal(result.homeownerGift.record.source, "lawn");
  assert.equal(result.homeownerGift.record.houseId, "house-1");
  assert.equal(result.homeownerGift.record.eventId, `homeowner:lawn:${begun.session.id}`);
  assert.equal(gameState.getSnapshot().homeownerGifts.queue.length, 1);
});

test("a failed House Rescue completion rolls its guaranteed gift and every job change back", () => {
  let fail = false;
  const repository = { save: () => fail ? { ok: false, status: "write-failed" } : { ok: true, status: "saved" } };
  const state = createFreshGameState({ now: 0 });
  state.homeownerGifts.misses = 15;
  const { gameState, houseRescue } = runtime({ state, repository });
  houseRescue.startLevel(1, { houseId: "house-1" });
  const before = gameState.getSnapshot();
  fail = true;
  const result = houseRescue.qaComplete();
  assert.equal(result.code, "persistence-failed");
  assert.deepEqual(gameState.getSnapshot(), before);
});

test("a failed town-lawn completion rolls its guaranteed gift and every lawn change back", () => {
  let fail = false;
  const repository = { save: () => fail ? { ok: false, status: "write-failed" } : { ok: true, status: "saved" } };
  const state = createFreshGameState({ now: 0 });
  state.homeownerGifts.misses = 15;
  const { gameState, lawnCare } = runtime({ state, repository });
  const begun = lawnCare.beginTownJob(LAWN_PLOTS[0].id);
  const before = gameState.getSnapshot();
  fail = true;
  const result = lawnCare.completeCertified(begun.session.id);
  assert.equal(result.code, "persistence-failed");
  assert.deepEqual(gameState.getSnapshot(), before);
});
