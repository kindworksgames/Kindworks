import test from "node:test";
import assert from "node:assert/strict";
import { EQUIPMENT_UPGRADE_ORDERS, ITEM_CATALOG, inventoryLimitFor } from "../src/data/items.js";
import { FRESH_MARKET, SHOP_DEFINITIONS, VILLAGE_GROCER, WILLOWMERE_SHOP, validateShopDefinitions } from "../src/data/shops.js";
import { createFreshGameState, GameStateService, upgradeGameState, validateGameState } from "../src/state/GameState.js";
import { SaveRepository } from "../src/state/SaveRepository.js";
import { EconomyService } from "../src/systems/EconomyService.js";
import { ShopService } from "../src/systems/ShopService.js";
import { MemoryStorage } from "./helpers/MemoryStorage.js";

function runtime(repository = new SaveRepository(new MemoryStorage()), state = createFreshGameState({ now: 0 })) {
  const gameState = new GameStateService(state);
  const economy = new EconomyService(gameState, repository, { now: () => 1000 });
  const shops = new ShopService(economy);
  return { gameState, economy, shops, repository };
}

function addPerfectLawns(gameState, count) {
  const state = gameState.getSnapshot();
  state.lawnCare.progress.best = Object.fromEntries(Array.from({ length: count }, (_, index) => [String(index + 1), { stars: 3, percent: 100 }]));
  state.lawnCare.progress.completed = count;
  state.lawnCare.progress.nextLevel = Math.min(750, count + 1);
  assert.equal(gameState.replace(state).ok, true);
}

function fundState(state, coins) {
  state.economy.lifetimeCoinsEarned += coins - state.economy.coins;
  state.economy.coins = coins;
  return state;
}

test("pins all three legacy shops, their categories and their exact ordinary stock", () => {
  const validation = validateShopDefinitions();
  assert.equal(validation.ok, true, validation.errors.join("\n"));
  assert.deepEqual(Object.keys(SHOP_DEFINITIONS), ["willowmere-shop", "town-grocer", "fresh-market"]);
  assert.deepEqual(WILLOWMERE_SHOP.groups, ["Mowers", "Vacuums", "Trees", "Seating", "Bins", "Decorations", "Furniture"]);
  assert.deepEqual(VILLAGE_GROCER.groups, ["Farming", "Animal Treats"]);
  assert.equal(WILLOWMERE_SHOP.itemIds.length, 51);
  assert.equal(VILLAGE_GROCER.itemIds.length, 9);
  assert.ok(VILLAGE_GROCER.itemIds.includes("orchard-apple-sapling"));
  assert.deepEqual(FRESH_MARKET.itemIds, [
    "river-minnows",
    "fresh-sardines",
    "river-trout",
    "pond-pellets",
    "chicken-pieces",
    "beef-strips",
    "prepared-meat",
  ]);
  const owners = new Map();
  for (const shop of Object.values(SHOP_DEFINITIONS)) for (const id of shop.itemIds) owners.set(id, [...(owners.get(id) || []), shop.id]);
  assert.ok([...owners.values()].every((locations) => locations.length === 1));
});

test("pins exact equipment prices, effects, upgrade lines and unlock conditions", () => {
  assert.deepEqual(EQUIPMENT_UPGRADE_ORDERS.mower.map((id) => ITEM_CATALOG[id].price), [0, 2000, 7500, 12000, 20000, 30000]);
  assert.deepEqual(EQUIPMENT_UPGRADE_ORDERS.mower.map((id) => ITEM_CATALOG[id].effect.mowerSpeedMultiplier), [1, 1.05, 1.1, 1.25, 1.45, 1.65]);
  assert.deepEqual(EQUIPMENT_UPGRADE_ORDERS.vacuum.map((id) => ITEM_CATALOG[id].price), [0, 5000, 15000, 35000, 70000]);
  assert.deepEqual(EQUIPMENT_UPGRADE_ORDERS.vacuum.map((id) => ITEM_CATALOG[id].effect.vacuumPower), [1, 2, 3, 4, 5]);
  assert.deepEqual(EQUIPMENT_UPGRADE_ORDERS.vacuum.map((id) => ITEM_CATALOG[id].effect.vacuumRadius), [36, 40, 44, 48, 52]);
  assert.deepEqual(EQUIPMENT_UPGRADE_ORDERS.vacuum.map((id) => ITEM_CATALOG[id].effect.vacuumSpeedMultiplier), [1, 1.08, 1.16, 1.25, 1.35]);
  assert.deepEqual(Object.fromEntries(Object.values(ITEM_CATALOG).filter((item) => item.unlock).map((item) => [item.id, item.unlock])), {
    "cherry-compact-mower": { game: "lawn", perfects: 3 },
    "classic-yellow-mower": { game: "lawn", perfects: 8 },
    "swiftcut-mower": { game: "lawn", perfects: 15 },
    "meadow-pro-mower": { game: "lawn", perfects: 30 },
    "vintage-special-mower": { game: "lawn", perfects: 50 },
    "willow-tree": { game: "river", perfects: 1 },
    "flowering-cherry": { game: "lawn", perfects: 5 },
    "apple-tree": { game: "waste", perfects: 2 },
    "flowering-tree": { game: "lawn", perfects: 10 },
    "grand-oak": { game: "lawn", perfects: 20 },
    "iron-bench": { game: "waste", perfects: 3 },
    "riverside-bench": { game: "river", perfects: 2 },
    "picnic-table": { game: "waste", perfects: 4 },
    "recycling-bin": { game: "waste", perfects: 5 },
    "commercial-bin": { game: "waste", perfects: 10 },
    "small-fountain": { game: "river", perfects: 5 },
    "town-clock": { game: "waste", perfects: 15 },
    "premium-picnic-area": { game: "waste", perfects: 10 },
    "grand-fountain": { game: "river", perfects: 12 },
    "willowmere-gazebo": { game: "lawn", perfects: 40 },
    "town-centre-monument": { game: "waste", perfects: 30 },
  });
});

test("shows exact prices, affordability, and owned quantities", () => {
  const { shops } = runtime();
  const catalogue = shops.getCatalogue("fresh-market");
  assert.equal(catalogue.ok, true);
  assert.equal(catalogue.products.length, 7);
  const pellets = shops.getProduct("fresh-market", "pond-pellets");
  assert.equal(pellets.item.price, 80);
  assert.equal(pellets.owned, 0);
  assert.equal(pellets.affordable, true);
  const minnows = shops.getProduct("fresh-market", "river-minnows");
  assert.equal(minnows.affordable, false);
  assert.equal(minnows.shortfall, 40);
});

test("locked stock reports exact progress and becomes purchasable only after its perfect-job condition", () => {
  const { gameState, economy, shops } = runtime();
  assert.equal(economy.credit(5000, { reason: "Milestone 24 fixture" }).ok, true);
  let mower = shops.getProduct("willowmere-shop", "cherry-compact-mower");
  assert.equal(mower.unlocked, false);
  assert.deepEqual(mower.unlock, { unlocked: false, game: "lawn", progress: 0, required: 3 });
  assert.equal(shops.purchase("willowmere-shop", "cherry-compact-mower").code, "locked");
  addPerfectLawns(gameState, 3);
  mower = shops.getProduct("willowmere-shop", "cherry-compact-mower");
  assert.equal(mower.unlocked, true);
  assert.equal(shops.purchase("willowmere-shop", "cherry-compact-mower").cost, 2000);
});

test("equipment upgrades apply only the best lower-tier 50-percent credit and equip atomically", () => {
  const { gameState, economy, shops, repository } = runtime();
  assert.equal(economy.credit(20000, { reason: "Milestone 24 fixture" }).ok, true);
  addPerfectLawns(gameState, 8);
  assert.equal(shops.purchase("willowmere-shop", "cherry-compact-mower").cost, 2000);
  const quote = shops.getProduct("willowmere-shop", "classic-yellow-mower").quote;
  assert.deepEqual(quote, { listPrice: 7500, upgradeCredit: 1000, cost: 6500, quantity: 1 });
  const purchase = shops.purchase("willowmere-shop", "classic-yellow-mower");
  assert.equal(purchase.cost, 6500);
  assert.equal(purchase.ledger.unitPrice, 7500);
  assert.equal(purchase.ledger.listPrice, 7500);
  assert.equal(purchase.ledger.upgradeCredit, 1000);
  const equipped = shops.equip("willowmere-shop", "classic-yellow-mower");
  assert.equal(equipped.ok, true);
  assert.equal(equipped.previousItemId, "starter-mower");
  assert.equal(equipped.ledger.kind, "equip");
  assert.equal(repository.load().state.inventory.equipped.mower, "classic-yellow-mower");
});

test("completes an affordable purchase and reloads balance, inventory, and retailer ledger metadata", () => {
  const storage = new MemoryStorage();
  const repository = new SaveRepository(storage);
  const { shops } = runtime(repository);
  const result = shops.purchase("fresh-market", "pond-pellets");
  assert.equal(result.ok, true);
  assert.equal(result.cost, 80);
  assert.equal(result.after, 20);
  assert.equal(result.ledger.shopId, "fresh-market");
  assert.equal(result.ledger.reason, "Bought Pond Pellets at Fresh Market");
  const reloaded = repository.load().state;
  assert.equal(reloaded.economy.coins, 20);
  assert.equal(reloaded.inventory.consumables["pond-pellets"], 1);
});

test("reports an exact shortfall and changes nothing for an unaffordable purchase", () => {
  const storage = new MemoryStorage();
  const { gameState, shops } = runtime(new SaveRepository(storage));
  const before = gameState.getSnapshot();
  const result = shops.purchase("fresh-market", "river-minnows");
  assert.equal(result.code, "insufficient-funds");
  assert.equal(result.required, 140);
  assert.equal(result.available, 100);
  assert.deepEqual(gameState.getSnapshot(), before);
  assert.equal(storage.writes.length, 0);
});

test("rejects unknown shops and products not stocked by the retailer", () => {
  const { shops } = runtime();
  assert.equal(shops.getCatalogue("missing-shop").code, "unknown-shop");
  assert.equal(shops.purchase("fresh-market", "mixed-seeds").code, "not-sold-here");
  assert.equal(shops.purchase("town-grocer", "pond-pellets").code, "not-sold-here");
  assert.equal(shops.purchase("willowmere-shop", "carrot-seeds").code, "not-sold-here");
  assert.equal(shops.purchase("missing-shop", "pond-pellets").code, "unknown-shop");
});

test("inventory enforces 99 fish and seed stacks, one of each tool, and unique furniture", () => {
  const state = fundState(createFreshGameState({ now: 0 }), 200000);
  state.inventory.consumables["river-minnows"] = 98;
  state.inventory.consumables["carrot-seeds"] = 98;
  const { gameState, shops } = runtime(new SaveRepository(new MemoryStorage()), state);
  assert.equal(inventoryLimitFor(ITEM_CATALOG["river-minnows"]), 99);
  assert.equal(shops.purchase("fresh-market", "river-minnows").ok, true);
  assert.equal(shops.purchase("fresh-market", "river-minnows").code, "capacity");
  assert.equal(shops.purchase("town-grocer", "carrot-seeds").ok, true);
  assert.equal(shops.purchase("town-grocer", "carrot-seeds").code, "capacity");
  addPerfectLawns(gameState, 3);
  assert.equal(shops.purchase("willowmere-shop", "cherry-compact-mower").ok, true);
  assert.equal(shops.purchase("willowmere-shop", "cherry-compact-mower").code, "capacity");
  assert.equal(shops.purchase("willowmere-shop", "ornamental-fish-tank").ok, true);
  assert.equal(shops.purchase("willowmere-shop", "ornamental-fish-tank").code, "capacity");
});

test("consumable use is persisted and recorded without changing the coin reconciliation", () => {
  const storage = new MemoryStorage();
  const { economy, repository } = runtime(new SaveRepository(storage));
  assert.equal(economy.grantItem("mixed-seeds", 2).ok, true);
  const used = economy.consumeItem("mixed-seeds", 1, { reason: "Used with the robins" });
  assert.equal(used.ok, true);
  assert.equal(used.ledger.kind, "consume");
  assert.equal(used.ledger.amount, 0);
  const saved = repository.load().state;
  assert.equal(saved.inventory.consumables["mixed-seeds"], 1);
  assert.equal(saved.economy.ledger.at(-1).reason, "Used with the robins");
  assert.equal(saved.economy.lifetimeCoinsEarned - saved.economy.lifetimeCoinsSpent, saved.economy.coins);
});

test("full inventory and persistence failure both leave coins unchanged", () => {
  const first = runtime();
  const full = first.gameState.getSnapshot();
  full.inventory.consumables["pond-pellets"] = 9999;
  assert.equal(first.gameState.replace(full).ok, true);
  const capacityResult = first.shops.purchase("fresh-market", "pond-pellets");
  assert.equal(capacityResult.code, "capacity");
  assert.equal(first.gameState.getSnapshot().economy.coins, 100);

  const failed = runtime({ save: () => ({ ok: false, status: "write-failed" }) });
  const before = failed.gameState.getSnapshot();
  const persistenceResult = failed.shops.purchase("fresh-market", "pond-pellets");
  assert.equal(persistenceResult.code, "persistence-failed");
  assert.deepEqual(failed.gameState.getSnapshot(), before);
});

test("a failed equipment purchase or equip restores the exact wallet, inventory, history and loadout", () => {
  const state = fundState(createFreshGameState({ now: 0 }), 10000);
  state.lawnCare.progress.best = Object.fromEntries(Array.from({ length: 3 }, (_, index) => [String(index + 1), { stars: 3, percent: 100 }]));
  state.lawnCare.progress.completed = 3;
  state.lawnCare.progress.nextLevel = 4;
  const failedPurchase = runtime({ save: () => ({ ok: false, status: "write-failed" }) }, state);
  const beforePurchase = failedPurchase.gameState.getSnapshot();
  assert.equal(failedPurchase.shops.purchase("willowmere-shop", "cherry-compact-mower").code, "persistence-failed");
  assert.deepEqual(failedPurchase.gameState.getSnapshot(), beforePurchase);

  state.inventory.equipment["cherry-compact-mower"] = 1;
  const failedEquip = runtime({ save: () => ({ ok: false, status: "write-failed" }) }, state);
  const beforeEquip = failedEquip.gameState.getSnapshot();
  assert.equal(failedEquip.shops.equip("willowmere-shop", "cherry-compact-mower").code, "persistence-failed");
  assert.deepEqual(failedEquip.gameState.getSnapshot(), beforeEquip);
});

test("schema 20 saves convert existing inventory safely while preserving equipment and transaction history", () => {
  const old = createFreshGameState({ now: 0 });
  old.schemaVersion = 20;
  old.inventory.equipment["cherry-compact-mower"] = 1;
  old.inventory.equipped.mower = "cherry-compact-mower";
  old.inventory.consumables["river-minnows"] = 140;
  old.inventory.consumables["retired-snack"] = 7;
  old.inventory.unresolvedLegacy.push({ id: "old-planter", bucket: "placeables", quantity: 2 });
  old.economy.ledger.at(-1).shopId = "town-grocer";
  old.economy.ledger.at(-1).upgradeCredit = 250;
  const upgraded = upgradeGameState(old, { now: 1000 });
  assert.equal(upgraded.schemaVersion, 32);
  assert.equal(upgraded.inventory.consumables["river-minnows"], 99);
  assert.equal(upgraded.inventory.consumables["retired-snack"], undefined);
  assert.equal(upgraded.inventory.equipment["cherry-compact-mower"], 1);
  assert.equal(upgraded.inventory.equipped.mower, "cherry-compact-mower");
  assert.deepEqual(upgraded.inventory.unresolvedLegacy, [
    { id: "retired-snack", bucket: "consumables", quantity: 7 },
    { id: "old-planter", bucket: "placeables", quantity: 2 },
  ]);
  assert.equal(upgraded.economy.ledger.at(-1).shopId, "town-grocer");
  assert.equal(upgraded.economy.ledger.at(-1).upgradeCredit, 250);
  assert.equal(validateGameState(upgraded).ok, true);
});
