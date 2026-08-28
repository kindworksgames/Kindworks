import test from "node:test";
import assert from "node:assert/strict";
import { ITEM_CATALOG, EQUIPMENT_UPGRADE_ORDERS, inventoryBucketFor, itemUseDestinationFor } from "../src/data/items.js";
import { SHOP_DEFINITIONS } from "../src/data/shops.js";
import { findSafeFurniturePlacement } from "../src/data/homeInteriors.js";
import { getLawnLevel, lawnTravelPlan } from "../src/data/lawnCare.js";
import { createFreshGameState, GameStateService, validateGameState } from "../src/state/GameState.js";
import { SaveRepository } from "../src/state/SaveRepository.js";
import { EconomyService } from "../src/systems/EconomyService.js";
import { CustomResidentService } from "../src/systems/CustomResidentService.js";
import { FarmingService } from "../src/systems/FarmingService.js";
import { HomeInteriorService } from "../src/systems/HomeInteriorService.js";
import { HouseRescueService } from "../src/systems/HouseRescueService.js";
import { LawnCareService } from "../src/systems/LawnCareService.js";
import { ShopService } from "../src/systems/ShopService.js";
import { TownPlacementService } from "../src/systems/TownPlacementService.js";
import { MemoryStorage } from "./helpers/MemoryStorage.js";

const STOCK = Object.values(SHOP_DEFINITIONS).flatMap((shop) => shop.itemIds.map((itemId) => ({ shopId: shop.id, itemId })));

function fullyUnlockedState() {
  const state = createFreshGameState({ now: 0 });
  state.economy.coins = 5_000_000;
  state.economy.lifetimeCoinsEarned += state.economy.coins - 100;
  state.lawnCare.progress.best = Object.fromEntries(Array.from({ length: 50 }, (_, index) => [String(index + 1), { stars: 3, percent: 100 }]));
  state.lawnCare.progress.completed = 50;
  state.lawnCare.progress.nextLevel = 51;
  state.river.best = Object.fromEntries(Array.from({ length: 12 }, (_, index) => [String(index + 1), { stars: 3, bestPercent: 100, bestPieces: 5 }]));
  state.river.completed = 12;
  state.river.totalStars = 36;
  state.river.restorationPoints = 4800;
  state.progress.cleanup.progress.waste.best = Object.fromEntries(Array.from({ length: 30 }, (_, index) => [String(index + 1), { percent: 100, stars: 3 }]));
  state.progress.cleanup.progress.waste.completed = 30;
  state.progress.cleanup.progress.waste.nextLevel = 31;
  return state;
}

function runtime(state = fullyUnlockedState()) {
  const repository = new SaveRepository(new MemoryStorage());
  const gameState = new GameStateService(state);
  const economy = new EconomyService(gameState, repository, { now: () => 1000 });
  const farming = new FarmingService(gameState, repository, { now: () => 1000 });
  const shops = new ShopService(economy, { farming });
  return { repository, gameState, economy, farming, shops };
}

function firstSafeTownPoint(placement, itemId) {
  for (let y = 80; y <= 1820; y += 55) {
    for (let x = 80; x <= 4920; x += 55) {
      const result = placement.validate(itemId, x, y);
      if (result.ok) return result;
    }
  }
  return null;
}

function firstSafeOrchardPoint(farming) {
  for (let y = 80; y <= 1820; y += 55) {
    for (let x = 80; x <= 4920; x += 55) {
      const result = farming.validateAppleTreePlacement(x, y);
      if (result.ok) return result;
    }
  }
  return null;
}

test("every one of the 67 released shop products has one explicit gameplay destination", () => {
  assert.equal(STOCK.length, 67);
  assert.equal(new Set(STOCK.map(({ itemId }) => itemId)).size, STOCK.length);
  const destinations = Object.fromEntries(STOCK.map(({ itemId }) => [itemId, itemUseDestinationFor(ITEM_CATALOG[itemId])?.id]));
  assert.equal(Object.values(destinations).every(Boolean), true);
  assert.deepEqual(Object.values(destinations).reduce((counts, destination) => ({ ...counts, [destination]: (counts[destination] || 0) + 1 }), {}), {
    "lawn-care": 5,
    "house-rescue": 4,
    town: 32,
    "personal-home": 10,
    allotments: 3,
    "town-orchard": 1,
    "animal-friends": 12,
  });
});

test("all 67 products purchase successfully and survive a save reload in their protected inventory domain", () => {
  const { repository, gameState, shops } = runtime();
  const expected = new Map();
  for (const { shopId, itemId } of STOCK) {
    const before = shops.getProduct(shopId, itemId);
    assert.equal(before.ok, true, itemId);
    assert.equal(before.unlocked, true, itemId);
    assert.equal(before.canBuy, true, itemId);
    const bought = shops.purchase(shopId, itemId);
    assert.equal(bought.ok, true, `${itemId}: ${bought.message || bought.code}`);
    const state = gameState.getSnapshot();
    if (itemId === "orchard-apple-sapling") assert.equal(state.farming.orchard.purchasedSaplings, 1);
    else {
      const quantity = before.owned + 1;
      expected.set(itemId, quantity);
      assert.equal(state.inventory[inventoryBucketFor(ITEM_CATALOG[itemId])][itemId], quantity, itemId);
    }
  }
  const loaded = repository.load();
  assert.equal(loaded.ok, true);
  assert.equal(validateGameState(loaded.state).ok, true);
  assert.equal(loaded.state.farming.orchard.purchasedSaplings, 1);
  for (const { itemId } of STOCK.filter(({ itemId }) => itemId !== "orchard-apple-sapling")) {
    assert.equal(loaded.state.inventory[inventoryBucketFor(ITEM_CATALOG[itemId])][itemId], expected.get(itemId), itemId);
  }
});

test("every released town product can be placed, saved, and removed from carried inventory", () => {
  const { repository, gameState, shops } = runtime();
  const placement = new TownPlacementService(gameState, repository, { now: () => 2000 });
  const products = STOCK.filter(({ itemId }) => ITEM_CATALOG[itemId].category === "placeable");
  assert.equal(products.length, 32);
  for (const { shopId, itemId } of products) {
    assert.equal(shops.purchase(shopId, itemId).ok, true, itemId);
    const point = firstSafeTownPoint(placement, itemId);
    assert.ok(point, `${itemId} should have a valid town position`);
    assert.equal(placement.begin(itemId, { previewX: point.x, previewY: point.y }).ok, true, itemId);
    assert.equal(placement.preview(point.x, point.y).ok, true, itemId);
    const placed = placement.confirm();
    assert.equal(placed.ok, true, `${itemId}: ${placed.message || placed.code}`);
    assert.equal(placed.object.itemId, itemId);
    assert.equal(gameState.getSnapshot().inventory.placeables[itemId] || 0, 0);
  }
  const saved = repository.load().state;
  assert.equal(saved.townPlacement.objects.length, 32);
  assert.deepEqual(new Set(saved.townPlacement.objects.map((object) => object.itemId)), new Set(products.map(({ itemId }) => itemId)));
});

test("every furniture product can be purchased and placed inside the personal resident home", () => {
  const { repository, gameState, shops } = runtime();
  const resident = new CustomResidentService(gameState, repository, { now: () => 2500 });
  assert.equal(resident.saveProfile({
    name: "Meadow", skin: "warm", hair: 1, hairColor: "dark-brown", accessory: "badge", outfit: 1, bodyBuild: "average",
    hobbies: ["gardening", "reading", "helping"], home: { wallColor: "sage", roofStyle: "gable", roofColor: "terracotta" },
  }).ok, true);
  const homes = new HomeInteriorService(gameState, repository, { now: () => 3000, customResident: resident });
  const products = STOCK.filter(({ itemId }) => ITEM_CATALOG[itemId].category === "furniture");
  assert.equal(products.length, 10);
  for (const { shopId, itemId } of products) {
    assert.equal(shops.purchase(shopId, itemId).ok, true, itemId);
    const safe = findSafeFurniturePlacement(gameState.getSnapshot(), { id: `preview-${itemId}`, itemId, rx: 0.5, ry: 0.5, rotation: 0 });
    assert.ok(safe, `${itemId} should have a valid personal-home position`);
    assert.equal(homes.beginPlacement(itemId).ok, true, itemId);
    assert.equal(homes.preview(safe.rx, safe.ry).ok, true, itemId);
    const placed = homes.confirmPlacement();
    assert.equal(placed.ok, true, `${itemId}: ${placed.message || placed.code}`);
    assert.equal(placed.placement.itemId, itemId);
    assert.equal(gameState.getSnapshot().inventory.furniture[itemId] || 0, 0);
  }
  assert.equal(repository.load().state.homeInteriors.placements.length, 10);
});

test("the Village Grocer sapling remains inventory-visible farming stock until planted in town", () => {
  const { gameState, farming, shops } = runtime();
  assert.equal(shops.purchase("town-grocer", "orchard-apple-sapling").ok, true);
  assert.equal(gameState.getSnapshot().farming.orchard.purchasedSaplings, 1);
  const point = firstSafeOrchardPoint(farming);
  assert.ok(point);
  assert.equal(farming.beginAppleTreePlacement({ previewX: point.x, previewY: point.y }).ok, true);
  assert.equal(farming.previewAppleTreePlacement(point.x, point.y).ok, true);
  const planted = farming.confirmAppleTreePlacement();
  assert.equal(planted.ok, true);
  assert.equal(gameState.getSnapshot().farming.orchard.purchasedSaplings, 0);
  assert.equal(gameState.getSnapshot().farming.orchard.trees.some((tree) => tree.id === planted.tree.id), true);
});

test("every mower and vacuum upgrade equips into its game and provides a strictly stronger real effect", () => {
  const lawnLevel = getLawnLevel(750);
  const resistantCell = [...lawnLevel.weeds.entries()].find(([, kind]) => kind === "woody")?.[0];
  assert.ok(resistantCell);
  const mowerDurations = [];
  for (const itemId of EQUIPMENT_UPGRADE_ORDERS.mower) {
    const state = fullyUnlockedState();
    state.inventory.equipment[itemId] = 1;
    state.inventory.equipped.mower = itemId;
    const gameState = new GameStateService(state);
    const lawn = new LawnCareService(gameState, new SaveRepository(new MemoryStorage()));
    const loadout = lawn.getMowerLoadout();
    assert.equal(loadout.mowerId, itemId);
    mowerDurations.push(lawnTravelPlan(750, [resistantCell], "R", loadout)[0].durationMs);
  }
  assert.equal(mowerDurations.every((duration, index) => index === 0 || duration < mowerDurations[index - 1]), true);

  const vacuumEffects = [];
  for (const itemId of EQUIPMENT_UPGRADE_ORDERS.vacuum) {
    const state = fullyUnlockedState();
    state.inventory.equipment[itemId] = 1;
    state.inventory.equipped.vacuum = itemId;
    const gameState = new GameStateService(state);
    const rescue = new HouseRescueService(gameState, new SaveRepository(new MemoryStorage()));
    const loadout = rescue.getVacuumLoadout();
    assert.equal(loadout.itemId, itemId);
    vacuumEffects.push([loadout.power, loadout.radius, loadout.speedMultiplier]);
  }
  for (let index = 1; index < vacuumEffects.length; index += 1) {
    assert.ok(vacuumEffects[index][0] > vacuumEffects[index - 1][0]);
    assert.ok(vacuumEffects[index][1] > vacuumEffects[index - 1][1]);
    assert.ok(vacuumEffects[index][2] > vacuumEffects[index - 1][2]);
  }
});
