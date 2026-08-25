import test from "node:test";
import assert from "node:assert/strict";
import { FRESH_MARKET, SHOP_DEFINITIONS, validateShopDefinitions } from "../src/data/shops.js";
import { createFreshGameState, GameStateService } from "../src/state/GameState.js";
import { SaveRepository } from "../src/state/SaveRepository.js";
import { EconomyService } from "../src/systems/EconomyService.js";
import { ShopService } from "../src/systems/ShopService.js";
import { MemoryStorage } from "./helpers/MemoryStorage.js";

function runtime(repository = new SaveRepository(new MemoryStorage())) {
  const gameState = new GameStateService(createFreshGameState({ now: 0 }));
  const economy = new EconomyService(gameState, repository, { now: () => 1000 });
  const shops = new ShopService(economy);
  return { gameState, economy, shops, repository };
}

test("extracts the exact seven-product Fresh Market catalogue", () => {
  assert.equal(validateShopDefinitions().ok, true);
  assert.deepEqual(Object.keys(SHOP_DEFINITIONS), ["fresh-market"]);
  assert.deepEqual(FRESH_MARKET.itemIds, [
    "river-minnows",
    "fresh-sardines",
    "river-trout",
    "pond-pellets",
    "chicken-pieces",
    "beef-strips",
    "prepared-meat",
  ]);
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
  assert.equal(shops.purchase("missing-shop", "pond-pellets").code, "unknown-shop");
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
