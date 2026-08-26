import test from "node:test";
import assert from "node:assert/strict";
import { ITEM_CATALOG } from "../src/data/items.js";
import { VILLAGE_GROCER } from "../src/data/shops.js";
import {
  VILLAGE_GROCER_DISPLAYS,
  VILLAGE_GROCER_DISPLAY_IDS,
  VILLAGE_GROCER_FIXTURES,
  validateVillageGrocerInterior,
} from "../src/data/villageGrocer.js";
import { createFreshGameState, GameStateService } from "../src/state/GameState.js";
import { SaveRepository } from "../src/state/SaveRepository.js";
import { EconomyService } from "../src/systems/EconomyService.js";
import { FarmingService } from "../src/systems/FarmingService.js";
import { ShopService } from "../src/systems/ShopService.js";
import { MemoryStorage } from "./helpers/MemoryStorage.js";

test("Village Grocer pins the nine original physical product displays", () => {
  const validation = validateVillageGrocerInterior();
  assert.equal(validation.ok, true, validation.errors.join("\n"));
  assert.equal(validation.productCount, 9);
  assert.deepEqual(VILLAGE_GROCER_DISPLAYS.map((display) => display.id), VILLAGE_GROCER_DISPLAY_IDS);
  assert.deepEqual(validation.groups, {
    allotmentSeeds: ["carrot-seeds", "fresh-greens-seeds", "wild-berry-starters"],
    appleSaplings: ["orchard-apple-sapling"],
    animalFood: ["mixed-seeds", "sunflower-seeds", "mealworms", "fresh-greens", "wild-berries"],
  });
  assert.equal(VILLAGE_GROCER_DISPLAYS.find((display) => display.id === "orchard-apple-sapling").fixture, "islandA");
  assert.ok(VILLAGE_GROCER_DISPLAYS.every((display) => ITEM_CATALOG[display.id].retailer === VILLAGE_GROCER.id));
  assert.deepEqual(Object.keys(VILLAGE_GROCER_FIXTURES), ["shelf", "islandA", "islandB", "counter"]);
});

test("Grocer sapling checkout uses the farming transaction and never creates a stray consumable", () => {
  const state = createFreshGameState({ now: 0 });
  state.economy.coins = 3000;
  state.economy.lifetimeCoinsEarned = 3000;
  const gameState = new GameStateService(state);
  const repository = new SaveRepository(new MemoryStorage());
  const economy = new EconomyService(gameState, repository, { now: () => 1000 });
  const farming = new FarmingService(gameState, repository, { now: () => 1000 });
  const shops = new ShopService(economy, { farming });
  const before = shops.getProduct("town-grocer", "orchard-apple-sapling");
  assert.equal(before.owned, 0);
  assert.equal(before.limit, 24);
  assert.equal(before.canBuy, true);
  const purchased = shops.purchase("town-grocer", "orchard-apple-sapling");
  assert.equal(purchased.ok, true);
  assert.equal(purchased.after, 200);
  const snapshot = gameState.getSnapshot();
  assert.equal(snapshot.farming.orchard.purchasedSaplings, 1);
  assert.equal(snapshot.inventory.consumables["orchard-apple-sapling"] || 0, 0);
  assert.equal(snapshot.economy.ledger.at(-1).shopId, "town-grocer");
});
