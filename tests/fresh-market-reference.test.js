import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { FRESH_MARKET } from "../src/data/shops.js";
import { createFreshGameState, GameStateService } from "../src/state/GameState.js";
import { SaveRepository } from "../src/state/SaveRepository.js";
import { EconomyService } from "../src/systems/EconomyService.js";
import { ShopService } from "../src/systems/ShopService.js";
import { MemoryStorage } from "./helpers/MemoryStorage.js";

test("every Fresh Market counter product can be purchased and survives the shared save", () => {
  const state = createFreshGameState({ now: 0 });
  state.economy.coins = 100000;
  state.economy.lifetimeCoinsEarned = 100000;
  const gameState = new GameStateService(state);
  const repository = new SaveRepository(new MemoryStorage());
  const economy = new EconomyService(gameState, repository, { now: () => 3000 });
  const shops = new ShopService(economy);
  const before = new Map(FRESH_MARKET.itemIds.map((itemId) => [itemId, shops.getProduct("fresh-market", itemId).owned]));
  for (const itemId of FRESH_MARKET.itemIds) {
    const result = shops.purchase("fresh-market", itemId);
    assert.equal(result.ok, true, `${itemId}: ${result.message || result.code}`);
    assert.equal(shops.getProduct("fresh-market", itemId).owned, before.get(itemId) + 1, itemId);
  }
  const persisted = repository.load();
  assert.equal(persisted.ok, true);
  assert.equal(persisted.state.economy.ledger.slice(-7).every(({ shopId }) => shopId === "fresh-market"), true);
  for (const itemId of FRESH_MARKET.itemIds) assert.equal(persisted.state.inventory.consumables[itemId], before.get(itemId) + 1, itemId);
});

test("Fresh Market uses labelled code-native fish, butcher and pond-food counters", async () => {
  const [controller, styles] = await Promise.all([
    readFile(new URL("../src/ui/ShopController.js", import.meta.url), "utf8"),
    readFile(new URL("../src/shop-reference.css", import.meta.url), "utf8"),
  ]);
  assert.match(controller, /FRESH_MARKET_COUNTERS/);
  assert.match(controller, /label: "Fish on Ice"/);
  assert.match(controller, /label: "Butcher Counter"/);
  assert.match(controller, /label: "Pond Food"/);
  assert.match(controller, /dataset\.spriteAiLabel = `fresh-market\.product\./);
  assert.match(controller, /fresh-market\.fixture\.checkout/);
  assert.match(styles, /\.shop-panel\[data-shop-id="fresh-market"\] \.shop-panel-body/);
  assert.match(styles, /grid-template-columns: minmax\(0, 72%\) minmax\(190px, 28%\)/);
  assert.doesNotMatch(styles, /Pixel Fresh Market Shop Interface\.png/);
});
