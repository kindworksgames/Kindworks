import test from "node:test";
import assert from "node:assert/strict";
import { ANIMAL_BY_ID, SHOP_PET_DEFINITIONS, worldAnimalPresentations } from "../src/data/animals.js";
import {
  PAWS_WONDERS,
  PAWS_WONDERS_CATALOG,
  PAWS_WONDERS_DISPLAYS,
  PAWS_WONDERS_DINO_REQUIRED_MILESTONES,
  PAWS_WONDERS_ITEM_IDS,
  validatePawsWonders,
} from "../src/data/pawsWonders.js";
import { RESTORATION_MILESTONE_ORDER } from "../src/data/restorationMilestones.js";
import { createFreshGameState, GameStateService, validateGameState } from "../src/state/GameState.js";
import { SaveRepository } from "../src/state/SaveRepository.js";
import { PawsWondersService } from "../src/systems/PawsWondersService.js";
import { MemoryStorage } from "./helpers/MemoryStorage.js";

function fundedState(coins = 10_000, milestones = 0) {
  const state = createFreshGameState({ now: 0 });
  const increase = coins - state.economy.coins;
  state.economy.coins = coins;
  state.economy.lifetimeCoinsEarned += increase;
  for (const id of RESTORATION_MILESTONE_ORDER.slice(0, milestones)) {
    state.restorationMilestones.unlocked[id] = true;
    state.restorationMilestones.revealed[id] = true;
    state.restorationMilestones.unlockDay[id] = 1;
    state.restorationMilestones.lastUnlockedId = id;
  }
  return state;
}

function runtime({ state = fundedState(), repository = null, now = 1_000 } = {}) {
  const gameState = new GameStateService(state);
  const storage = new MemoryStorage();
  const saves = repository || new SaveRepository(storage);
  return { gameState, storage, repository: saves, paws: new PawsWondersService(gameState, saves, { now: () => now }) };
}

test("Milestone 36 preserves the exact eleven-companion Paws & Wonders catalogue", () => {
  assert.deepEqual(PAWS_WONDERS_ITEM_IDS, [
    "pet-labrador", "pet-spaniel", "pet-dachshund", "pet-corgi", "pet-border-collie", "pet-husky",
    "pet-chinchilla", "pet-meerkat", "pet-fennec", "pet-macaw", "pet-baby-triceratops",
  ]);
  assert.deepEqual(Object.values(PAWS_WONDERS_CATALOG).map(({ name, breed, price }) => [name, breed, price]), [
    ["Sunny", "Labrador", 420], ["Poppy", "Cocker Spaniel", 440], ["Pretzel", "Dachshund", 390],
    ["Biscuit", "Corgi", 450], ["Scout", "Border Collie", 480], ["Nova", "Husky", 520],
    ["Dusty", "Chinchilla", 560], ["Tango", "Meerkat", 620], ["Sahara", "Fennec Fox", 680],
    ["Rio", "Blue-and-gold Macaw", 720], ["Sprout", "Baby Triceratops", 1200],
  ]);
  assert.equal(SHOP_PET_DEFINITIONS.length, 11);
  assert.equal(new Set(Object.values(PAWS_WONDERS_CATALOG).map((item) => item.animalId)).size, 11);
  assert.equal(PAWS_WONDERS.legacyShopId, "shop-11");
  assert.equal(PAWS_WONDERS.legacyNodeId, "biz_arcade");
});

test("the top-down adoption room has eleven contained physical enclosures and Evie's stable assignment", () => {
  const validation = validatePawsWonders();
  assert.deepEqual(validation, { ok: true, errors: [], total: 11, dogs: 6, exotics: 4, featured: 1, topDown: true, physicalEnclosures: true, permanentAdoptions: true, unlimitedCompanions: true });
  assert.equal(PAWS_WONDERS_DISPLAYS.length, 11);
  assert.equal(PAWS_WONDERS_DISPLAYS.every((display) => display.displayKind === "pet"), true);
});

test("every catalogue identity keeps its permanent animal, diet and shop SKU", () => {
  for (const item of Object.values(PAWS_WONDERS_CATALOG)) {
    const animal = ANIMAL_BY_ID[item.animalId];
    assert.equal(animal.shopPet, true);
    assert.equal(animal.petShopSku, item.id);
    assert.ok(item.foodIds.length >= 2);
  }
});

test("Sprout remains locked until exactly three restoration milestones", () => {
  assert.equal(PAWS_WONDERS_DINO_REQUIRED_MILESTONES, 3);
  for (let milestones = 0; milestones < 3; milestones += 1) {
    const { paws } = runtime({ state: fundedState(10_000, milestones) });
    const quote = paws.getProduct("pet-baby-triceratops");
    assert.equal(quote.unlocked, false);
    assert.equal(paws.adopt("pet-baby-triceratops").code, "milestone-locked");
  }
  const { paws } = runtime({ state: fundedState(10_000, 3) });
  assert.equal(paws.getProduct("pet-baby-triceratops").unlocked, true);
  assert.equal(paws.adopt("pet-baby-triceratops").ok, true);
});

test("a permanent coin adoption is atomic and preserves the current follower", () => {
  const state = fundedState(2_000);
  state.animals.residents["animal-dog-1"].adopted = true;
  state.animals.residents["animal-dog-1"].trust = 100;
  state.animals.residents["animal-dog-1"].active = true;
  state.animals.activeAnimalId = "animal-dog-1";
  const { paws, gameState } = runtime({ state, now: 86_400_000 });
  const result = paws.adopt("pet-chinchilla");
  assert.equal(result.ok, true);
  assert.equal(result.cost, 560);
  assert.equal(result.activeAnimalId, "animal-dog-1");
  const saved = gameState.getSnapshot();
  assert.equal(saved.economy.coins, 1440);
  assert.equal(saved.economy.lifetimeCoinsSpent, 560);
  assert.equal(saved.economy.ledger.at(-1).kind, "paws-wonders-adoption");
  assert.equal(saved.economy.ledger.at(-1).animalId, "pet-chinchilla");
  assert.equal(saved.animals.residents["pet-chinchilla"].adopted, true);
  assert.equal(saved.animals.residents["pet-chinchilla"].trust, 100);
  assert.equal(saved.animals.residents["pet-chinchilla"].purchasedDay, 1);
  assert.equal(saved.animals.residents["pet-chinchilla"].active, false);
  assert.equal(saved.animals.residents["animal-dog-1"].active, true);
  assert.equal(validateGameState(saved).ok, true);
});

test("adopted shop companions persist, appear in South Meadow, and cannot be bought twice", () => {
  const { paws, repository, gameState } = runtime({ state: fundedState(2_000) });
  assert.equal(paws.adopt("pet-macaw").ok, true);
  assert.equal(paws.adopt("pet-macaw").code, "already-adopted");
  const loaded = repository.load();
  assert.equal(loaded.ok, true);
  assert.equal(loaded.state.animals.residents["pet-macaw"].adopted, true);
  const presentation = worldAnimalPresentations(gameState.getSnapshot().animals, gameState.getSnapshot().world).find((entry) => entry.id === "pet-macaw");
  assert.equal(presentation.visible, true);
  assert.equal(presentation.location, "south-meadow");
});

test("insufficient funds and failed persistence leave coins and adoption state unchanged", () => {
  const poor = runtime({ state: fundedState(100) });
  assert.equal(poor.paws.adopt("pet-labrador").code, "insufficient-funds");
  assert.equal(poor.gameState.getSnapshot().animals.residents["pet-dog-labrador"].adopted, false);
  const state = fundedState(2_000);
  const failing = runtime({ state, repository: { save: () => ({ ok: false, status: "fixture-failure" }) } });
  const before = failing.gameState.getSnapshot();
  const result = failing.paws.adopt("pet-labrador");
  assert.equal(result.code, "persistence-failed");
  assert.deepEqual(failing.gameState.getSnapshot(), before);
});

test("all eleven companions can be adopted without a family cap", () => {
  const { paws, gameState } = runtime({ state: fundedState(10_000, 3) });
  for (const itemId of PAWS_WONDERS_ITEM_IDS) assert.equal(paws.adopt(itemId).ok, true, itemId);
  const state = gameState.getSnapshot();
  assert.equal(SHOP_PET_DEFINITIONS.filter(({ id }) => state.animals.residents[id].adopted).length, 11);
  assert.equal(paws.getDiagnostics().adopted, 11);
});
