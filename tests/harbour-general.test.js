import test from "node:test";
import assert from "node:assert/strict";
import {
  HARBOUR_GENERAL,
  HARBOUR_GENERAL_CATALOG,
  HARBOUR_GENERAL_CONFIG,
  HARBOUR_GENERAL_ITEM_IDS,
  HARBOUR_GENERAL_STARTER_SLOTS,
  harbourDemand,
  validateHarbourGeneralCatalogue,
} from "../src/data/harbourGeneral.js";
import { createFreshGameState, GameStateService, upgradeGameState, validateGameState } from "../src/state/GameState.js";
import { validateHarbourGeneralState } from "../src/state/harbourGeneralState.js";
import { SaveRepository } from "../src/state/SaveRepository.js";
import { HarbourGeneralService } from "../src/systems/HarbourGeneralService.js";
import { NpcTownLifeService } from "../src/systems/NpcTownLifeService.js";
import { MemoryStorage } from "./helpers/MemoryStorage.js";

function runtime({ state = createFreshGameState({ now: 0 }), repository = new SaveRepository(new MemoryStorage()), random = () => 0 } = {}) {
  const gameState = new GameStateService(state);
  const harbourGeneral = new HarbourGeneralService(gameState, repository, { now: () => 1000, random });
  return { gameState, harbourGeneral, repository };
}

function ownedState({ coins = 20_000, weather = "clear", clockMinutes = 10 * 60 } = {}) {
  const state = createFreshGameState({ now: 0 });
  state.economy.coins = coins;
  state.economy.lifetimeCoinsEarned = coins;
  state.world.clockMinutes = clockMinutes;
  state.world.weather.current.kind = weather;
  state.harbourGeneral.owned = true;
  state.harbourGeneral.purchasedDay = state.world.day;
  state.harbourGeneral.slots = [...HARBOUR_GENERAL_STARTER_SLOTS];
  for (const id of HARBOUR_GENERAL_STARTER_SLOTS) state.harbourGeneral.stock[id] = HARBOUR_GENERAL_CONFIG.caseSize;
  return state;
}

test("pins the complete original Harbour General catalogue and operating rules", () => {
  const validation = validateHarbourGeneralCatalogue();
  assert.equal(validation.ok, true);
  assert.equal(validation.products, 17);
  assert.equal(validation.weather, 7);
  assert.equal(validation.everyday, 10);
  assert.equal(HARBOUR_GENERAL.deedPrice, 5000);
  assert.equal(HARBOUR_GENERAL.open, 7);
  assert.equal(HARBOUR_GENERAL.close, 21);
  assert.equal(HARBOUR_GENERAL_CONFIG.slotCount, 6);
  assert.equal(HARBOUR_GENERAL_CONFIG.caseSize, 4);
  assert.equal(HARBOUR_GENERAL_CONFIG.maxPerItem, 24);
  assert.deepEqual(HARBOUR_GENERAL_ITEM_IDS, [
    "umbrella", "raincoat", "winter-jacket", "gloves", "scarf", "wool-hat", "bottled-water", "snack-bar", "tissues",
    "batteries", "newspaper", "sunscreen", "rain-boots", "torch", "postcards", "small-toy", "beach-towel",
  ]);
  assert.deepEqual([HARBOUR_GENERAL_CATALOG.umbrella.wholesale, HARBOUR_GENERAL_CATALOG.umbrella.price], [120, 190]);
  assert.deepEqual([HARBOUR_GENERAL_CATALOG["beach-towel"].wholesale, HARBOUR_GENERAL_CATALOG["beach-towel"].price], [75, 135]);
});

test("fresh schema 33 saves contain a valid unowned Harbour General domain", () => {
  const state = createFreshGameState({ now: 0 });
  assert.equal(state.schemaVersion, 34);
  assert.equal(state.harbourGeneral.owned, false);
  assert.deepEqual(state.harbourGeneral.slots, Array(6).fill(null));
  assert.equal(Object.keys(state.harbourGeneral.stock).length, 17);
  assert.equal(validateHarbourGeneralState(state.harbourGeneral).ok, true);
  assert.equal(validateGameState(state).ok, true);
});

test("buying the 5,000-coin deed grants the six original displays with four items each", () => {
  const state = createFreshGameState({ now: 0 });
  state.economy.coins = 6000;
  state.economy.lifetimeCoinsEarned = 6000;
  const { gameState, harbourGeneral } = runtime({ state });
  const result = harbourGeneral.purchaseDeed();
  const saved = gameState.getSnapshot();
  assert.equal(result.code, "harbour-general-purchased");
  assert.equal(saved.economy.coins, 1000);
  assert.equal(saved.economy.lifetimeCoinsSpent, 5000);
  assert.equal(saved.harbourGeneral.owned, true);
  assert.deepEqual(saved.harbourGeneral.slots, HARBOUR_GENERAL_STARTER_SLOTS);
  assert.deepEqual(saved.harbourGeneral.slots.map((id) => saved.harbourGeneral.stock[id]), [4, 4, 4, 4, 4, 4]);
  assert.equal(saved.economy.ledger.at(-1).kind, "harbour-general-deed");
});

test("a deed purchase is refused without enough coins and rolls back completely if saving fails", () => {
  const poor = createFreshGameState({ now: 0 });
  poor.economy.coins = 4999;
  poor.economy.lifetimeCoinsEarned = 4999;
  const insufficient = runtime({ state: poor });
  const beforePoor = insufficient.gameState.getSnapshot();
  assert.equal(insufficient.harbourGeneral.purchaseDeed().code, "insufficient-funds");
  assert.deepEqual(insufficient.gameState.getSnapshot(), beforePoor);

  const state = createFreshGameState({ now: 0 });
  state.economy.coins = 5000;
  state.economy.lifetimeCoinsEarned = 5000;
  const failed = runtime({ state, repository: { save: () => ({ ok: false, status: "write-failed" }) } });
  const beforeFailure = failed.gameState.getSnapshot();
  assert.equal(failed.harbourGeneral.purchaseDeed().code, "persistence-failed");
  assert.deepEqual(failed.gameState.getSnapshot(), beforeFailure);
});

test("display assignment swaps duplicate products and clearing a display never deletes stock", () => {
  const { gameState, harbourGeneral } = runtime({ state: ownedState() });
  assert.equal(harbourGeneral.assignSlot(5, "umbrella").code, "display-assigned");
  let state = gameState.getSnapshot();
  assert.equal(state.harbourGeneral.slots[5], "umbrella");
  assert.equal(state.harbourGeneral.slots[0], "newspaper");
  assert.equal(new Set(state.harbourGeneral.slots.filter(Boolean)).size, 6);
  assert.equal(harbourGeneral.clearSlot(5).code, "display-cleared");
  state = gameState.getSnapshot();
  assert.equal(state.harbourGeneral.slots[5], null);
  assert.equal(state.harbourGeneral.stock.umbrella, 4);
});

test("restocking is immediate in cases of four, charges wholesale, and never exceeds 24", () => {
  const state = ownedState();
  state.harbourGeneral.stock.umbrella = 22;
  const { gameState, harbourGeneral } = runtime({ state });
  const result = harbourGeneral.restock("umbrella");
  const saved = gameState.getSnapshot();
  assert.equal(result.code, "stock-restocked");
  assert.equal(result.quantity, 2);
  assert.equal(result.cost, 240);
  assert.equal(result.immediate, true);
  assert.equal(saved.harbourGeneral.stock.umbrella, 24);
  assert.equal(saved.harbourGeneral.lifetimeStockSpend, 240);
  assert.equal(harbourGeneral.restock("umbrella").code, "stock-full");
});

test("failed or unaffordable restocking cannot spend coins or change stock", () => {
  const poor = ownedState({ coins: 119 });
  poor.harbourGeneral.stock.umbrella = 0;
  const insufficient = runtime({ state: poor });
  const beforePoor = insufficient.gameState.getSnapshot();
  assert.equal(insufficient.harbourGeneral.restock("umbrella").code, "insufficient-funds");
  assert.deepEqual(insufficient.gameState.getSnapshot(), beforePoor);

  const failed = runtime({ state: ownedState(), repository: { save: () => ({ ok: false, status: "write-failed" }) } });
  const beforeFailure = failed.gameState.getSnapshot();
  assert.equal(failed.harbourGeneral.restock("umbrella").code, "persistence-failed");
  assert.deepEqual(failed.gameState.getSnapshot(), beforeFailure);
});

test("weather multipliers reproduce the original demand model", () => {
  assert.equal(harbourDemand("umbrella", "clear"), 0.55);
  assert.ok(Math.abs(harbourDemand("umbrella", "rain") - 3.3) < Number.EPSILON * 4);
  assert.ok(Math.abs(harbourDemand("winter-jacket", "snow") - 1.8) < Number.EPSILON * 4);
  assert.equal(harbourDemand("scarf", "windy"), 1.5);
  assert.equal(harbourDemand("sunscreen", "clear"), 2.2);
  assert.equal(harbourDemand("beach-towel", "rain"), 0.65);
});

test("an in-person NPC sale reduces live stock, fills the till, records stats, and grants wardrobe ownership", () => {
  const state = ownedState({ weather: "rain" });
  state.harbourGeneral.slots = ["umbrella", null, null, null, null, null];
  state.harbourGeneral.stock.umbrella = 2;
  const { harbourGeneral } = runtime({ state });
  const working = state;
  const resident = working.npcs.residents[0];
  resident.weatherWardrobe.umbrella = false;
  resident.needs.errands = 90;
  const result = harbourGeneral.resolveNpcPurchaseInto(working, resident, { random: () => 0 });
  assert.equal(result.code, "npc-sale");
  assert.equal(result.delivery, false);
  assert.equal(working.harbourGeneral.stock.umbrella, 1);
  assert.equal(working.harbourGeneral.tillCoins, 190);
  assert.equal(working.harbourGeneral.lifetimeGross, 190);
  assert.equal(working.harbourGeneral.lifetimeSales, 1);
  assert.equal(working.harbourGeneral.salesByItem.umbrella, 1);
  assert.equal(working.harbourGeneral.recentSales[0].npcId, resident.id);
  assert.equal(resident.weatherWardrobe.umbrella, true);
  assert.equal(resident.carryItem, "bag");
  assert.equal(resident.carryOriginBusinessId, HARBOUR_GENERAL.id);
});

test("NPCs do not rebuy owned wardrobe items and the business tracks the missed sale", () => {
  const state = ownedState({ weather: "rain" });
  state.harbourGeneral.slots = ["umbrella", null, null, null, null, null];
  const resident = state.npcs.residents[0];
  resident.weatherWardrobe.umbrella = true;
  const { harbourGeneral } = runtime({ state });
  const result = harbourGeneral.resolveNpcPurchaseInto(state, resident, { random: () => 0 });
  assert.equal(result.code, "no-stock");
  assert.equal(state.harbourGeneral.stock.umbrella, 4);
  assert.equal(state.harbourGeneral.lostSales, 1);
});

test("eligible residents physically route to Harbour General only during opening hours", () => {
  const state = ownedState({ clockMinutes: 10 * 60 });
  const resident = state.npcs.residents[0];
  resident.needs.errands = 90;
  resident.lastActivityFloorAt = 0;
  const gameState = new GameStateService(state);
  const repository = { save: () => ({ ok: true, status: "saved" }) };
  const harbourGeneral = new HarbourGeneralService(gameState, repository, { now: () => 1000, random: () => 0 });
  const npcTownLife = new NpcTownLifeService(gameState, repository, { now: () => 1000, harbourGeneral });
  assert.deepEqual(harbourGeneral.shoppingSchedule(state, resident), {
    phase: "leisure",
    targetNodeId: HARBOUR_GENERAL.legacyNodeId,
    activity: "Shopping at Harbour General",
    actionState: "SHOPPING",
    forceVisible: true,
  });
  npcTownLife.update(1000, state.world);
  const routed = npcTownLife.getResidents().find((entry) => entry.id === resident.id);
  assert.equal(routed.targetNodeId, HARBOUR_GENERAL.legacyNodeId);
  assert.equal(routed.visible, true);

  state.world.clockMinutes = 21 * 60;
  assert.equal(harbourGeneral.shoppingSchedule(state, resident), null);
});

test("collecting the till transfers every sale coin atomically and survives a repository reload", () => {
  const storage = new MemoryStorage();
  const repository = new SaveRepository(storage);
  const state = ownedState({ coins: 250 });
  state.harbourGeneral.tillCoins = 410;
  const { gameState, harbourGeneral } = runtime({ state, repository });
  const result = harbourGeneral.collectTill();
  assert.equal(result.code, "till-collected");
  assert.equal(gameState.getSnapshot().economy.coins, 660);
  assert.equal(gameState.getSnapshot().harbourGeneral.tillCoins, 0);
  const loaded = repository.load();
  assert.equal(loaded.ok, true);
  assert.equal(loaded.state.economy.coins, 660);
  assert.equal(loaded.state.harbourGeneral.tillCoins, 0);

  const failedState = ownedState({ coins: 250 });
  failedState.harbourGeneral.tillCoins = 410;
  const failed = runtime({ state: failedState, repository: { save: () => ({ ok: false, status: "write-failed" }) } });
  const before = failed.gameState.getSnapshot();
  assert.equal(failed.harbourGeneral.collectTill().code, "persistence-failed");
  assert.deepEqual(failed.gameState.getSnapshot(), before);
});

test("schema 32 and legacy saves upgrade safely without mutating the retained legacy snapshot", () => {
  const prior = createFreshGameState({ now: 0 });
  prior.schemaVersion = 32;
  delete prior.harbourGeneral;
  for (const resident of prior.npcs.residents) {
    delete resident.weatherWardrobe;
    delete resident.lastHarbourPurchaseId;
    delete resident.lastHarbourPurchaseDay;
  }
  const upgraded = upgradeGameState(prior, { now: 1000 });
  assert.equal(upgraded.schemaVersion, 34);
  assert.equal(upgraded.harbourGeneral.owned, false);
  assert.equal(typeof upgraded.npcs.residents[0].weatherWardrobe.umbrella, "boolean");
  assert.equal(validateGameState(upgraded).ok, true);

  const legacy = createFreshGameState({ now: 0 });
  legacy.schemaVersion = 32;
  legacy.source = { kind: "legacy-import", legacyVersion: 65, legacySourceKey: "kindworks", importedAt: legacy.updatedAt, warnings: [] };
  legacy.legacySnapshot = { harbourGeneral: { owned: true, slots: ["umbrella", "umbrella", "torch"], stock: { umbrella: 99, torch: 3 }, tillCoins: 75, lifetimeSales: 2 } };
  const retained = structuredClone(legacy.legacySnapshot);
  const imported = upgradeGameState(legacy, { now: 1000 });
  assert.equal(imported.harbourGeneral.owned, true);
  assert.deepEqual(imported.harbourGeneral.slots, ["umbrella", null, "torch", null, null, null]);
  assert.equal(imported.harbourGeneral.stock.umbrella, 24);
  assert.equal(imported.harbourGeneral.tillCoins, 75);
  assert.deepEqual(imported.legacySnapshot, retained);
  assert.equal(validateGameState(imported).ok, true);
});

test("Harbour General diagnostics expose the complete Phase 37 contract", () => {
  const { harbourGeneral } = runtime({ state: ownedState() });
  const diagnostics = harbourGeneral.getDiagnostics();
  assert.equal(diagnostics.version, "1.0.0-milestone-37");
  assert.equal(diagnostics.valid, true);
  assert.equal(diagnostics.products, 17);
  assert.equal(diagnostics.slots, 6);
  assert.equal(diagnostics.assignedSlots, 6);
  assert.equal(diagnostics.totalStock, 24);
  assert.equal(diagnostics.immediateWholesaleRestocking, true);
  assert.equal(diagnostics.customerDeliverySystem, false);
  assert.equal(diagnostics.inPersonNpcPurchases, true);
  assert.equal(diagnostics.weatherWardrobesPersistent, true);
  assert.equal(diagnostics.atomicPersistence, true);
});
