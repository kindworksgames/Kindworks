import test from "node:test";
import assert from "node:assert/strict";
import {
  ANIMAL_DEFINITIONS,
  ANIMAL_SPECIES,
  RARE_ANIMAL_ENCOUNTERS,
  SHOP_PET_DEFINITIONS,
  WATER_SPECIES,
  WILDLIFE_DEFINITIONS,
  WILDLIFE_ROTATION,
  speciesFor,
  worldAnimalPresentations,
} from "../src/data/animals.js";
import { FARMING_CROPS, ORCHARD_CONFIG } from "../src/data/farming.js";
import { FISHING_SPOTS } from "../src/data/fishing.js";
import { ITEM_CATALOG } from "../src/data/items.js";
import { NPC_NARRATIVE_PROFILES } from "../src/data/npcNarratives.js";
import {
  NPC_HOME_DEFINITIONS,
  NPC_NAVIGATION_LINKS,
  NPC_NAVIGATION_NODES,
  NPC_RESIDENTS,
} from "../src/data/npcTownLife.js";
import { RIVER_PATH } from "../src/data/town.js";
import { createFreshGameState, GameStateService, validateGameState } from "../src/state/GameState.js";
import { SaveRepository } from "../src/state/SaveRepository.js";
import { advanceWorldState } from "../src/state/worldState.js";
import { AnimalService } from "../src/systems/AnimalService.js";
import { FarmingService } from "../src/systems/FarmingService.js";
import { NavigationGraph } from "../src/systems/NavigationGraph.js";
import { MemoryStorage } from "./helpers/MemoryStorage.js";

function distanceToSegment(point, start, end) {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const lengthSquared = dx * dx + dy * dy;
  const amount = lengthSquared
    ? Math.max(0, Math.min(1, ((point.x - start[0]) * dx + (point.y - start[1]) * dy) / lengthSquared))
    : 0;
  return Math.hypot(point.x - (start[0] + dx * amount), point.y - (start[1] + dy * amount));
}

function distanceToRiver(point) {
  let best = Number.POSITIVE_INFINITY;
  for (let index = 1; index < RIVER_PATH.length; index += 1) {
    best = Math.min(best, distanceToSegment(point, RIVER_PATH[index - 1], RIVER_PATH[index]));
  }
  return best;
}

function fundedRuntime(coins = 50_000) {
  const state = createFreshGameState({ now: 0 });
  state.economy.coins = coins;
  state.economy.lifetimeCoinsEarned += coins - 100;
  const storage = new MemoryStorage();
  const repository = new SaveRepository(storage);
  const gameState = new GameStateService(state);
  return {
    gameState,
    repository,
    farming: new FarmingService(gameState, repository, { now: () => 1_000 }),
    animals: new AnimalService(gameState, repository, { now: () => 1_000, random: () => 0 }),
  };
}

test("Stage 6 accounts for every stable NPC identity, household, destination and narrative", () => {
  const graph = new NavigationGraph(NPC_NAVIGATION_NODES, NPC_NAVIGATION_LINKS);
  const homeIds = new Set(NPC_HOME_DEFINITIONS.map(([id]) => id));
  const residentIds = new Set();
  const residentNames = new Set();

  assert.equal(NPC_RESIDENTS.length, 35);
  assert.equal(NPC_HOME_DEFINITIONS.length, 19);
  assert.equal(Object.keys(NPC_NARRATIVE_PROFILES).length, 35);
  assert.equal(graph.validate().ok, true);

  for (const resident of NPC_RESIDENTS) {
    assert.equal(residentIds.has(resident.id), false, `duplicate resident id ${resident.id}`);
    assert.equal(residentNames.has(resident.name), false, `duplicate resident name ${resident.name}`);
    residentIds.add(resident.id);
    residentNames.add(resident.name);
    assert.equal(homeIds.has(resident.homeNodeId), true, `${resident.name} must own a real home`);
    assert.equal(graph.hasNode(resident.workNodeId), true, `${resident.name} must have a real workplace`);
    assert.ok(graph.findPath(resident.homeNodeId, resident.workNodeId).length > 0, `${resident.name} must reach work`);
    for (const destination of resident.preferred) {
      assert.ok(graph.findPath(resident.homeNodeId, destination).length > 0, `${resident.name} must reach ${destination}`);
    }
    const narrative = NPC_NARRATIVE_PROFILES[resident.name];
    assert.ok(narrative, `${resident.name} must have an authored narrative`);
    assert.equal(narrative.arc.length, 4, `${resident.name} must have four story stages`);
    for (const friendName of Object.keys(narrative.bonds)) {
      assert.equal(NPC_NARRATIVE_PROFILES[friendName] !== undefined, true, `${resident.name}'s bond must name a resident`);
    }
  }
});

test("Stage 6 exhaustively validates animal identities, diets, habitats and acquisition sources", () => {
  assert.equal(Object.keys(ANIMAL_SPECIES).length, 37);
  assert.equal(ANIMAL_DEFINITIONS.length, 56);
  assert.equal(WILDLIFE_DEFINITIONS.length, 45);
  assert.equal(SHOP_PET_DEFINITIONS.length, 11);
  assert.equal(new Set(ANIMAL_DEFINITIONS.map(({ id }) => id)).size, ANIMAL_DEFINITIONS.length);
  assert.equal(Object.keys(RARE_ANIMAL_ENCOUNTERS).length, 5);

  const fishSources = new Set(FISHING_SPOTS.flatMap((spot) => spot.catchTable.map(({ itemId }) => itemId)));
  for (const definition of ANIMAL_DEFINITIONS) {
    const species = speciesFor(definition);
    assert.ok(species, `${definition.id} must reference a species`);
    assert.ok(definition.route.length >= 5, `${definition.id} must have a movement route`);
    assert.ok(species.accepted.length > 0, `${definition.id} must accept at least one food`);
    assert.ok(species.favorites.length > 0, `${definition.id} must have at least one favourite`);
    for (const itemId of species.accepted) {
      const item = ITEM_CATALOG[itemId];
      assert.ok(item, `${definition.id} references missing food ${itemId}`);
      assert.equal(
        Boolean(item.retailer || item.farmingOnly || item.fishingOnly || fishSources.has(itemId)),
        true,
        `${itemId} must have a shop, farm or fishing acquisition route`,
      );
    }
    if (WATER_SPECIES.has(definition.species) && !definition.shopPet) {
      assert.equal(definition.route.every((point) => distanceToRiver(point) < 1.5), true, `${definition.id} must stay on the river path`);
    }
  }
});

test("Stage 6 deterministic wildlife sampling covers every regular species and respects the wild map cap", () => {
  const state = createFreshGameState({ now: 0 });
  const regularSpecies = new Set(WILDLIFE_DEFINITIONS.filter((definition) => !speciesFor(definition).rare).map(({ species }) => species));
  const observed = new Map();
  let maximumVisibleWildlife = 0;

  for (let day = 1; day <= 180; day += 1) {
    for (let clockMinutes = 0; clockMinutes < 1440; clockMinutes += 30) {
      const world = { ...state.world, day, clockMinutes };
      const visible = worldAnimalPresentations(state.animals, world, state).filter((entry) => entry.visible && !entry.resident.adopted);
      maximumVisibleWildlife = Math.max(maximumVisibleWildlife, visible.length);
      for (const entry of visible) observed.set(entry.definition.species, (observed.get(entry.definition.species) || 0) + 1);
    }
  }

  assert.equal(maximumVisibleWildlife, WILDLIFE_ROTATION.maxVisible);
  assert.equal([...regularSpecies].every((species) => observed.has(species)), true);
  assert.ok(observed.get("cat") > observed.get("turtle"), "high-weight common species should appear more often than low-weight species");
});

test("Stage 6 runs every crop through purchase, six-bed planting, growth, harvest and persisted feeding", () => {
  const { gameState, repository, farming, animals } = fundedRuntime();
  const beds = gameState.getSnapshot().farming.allotment.beds;

  for (const bed of beds.slice(1)) assert.equal(farming.unlockBed(bed.id).ok, true, bed.id);
  const cropIds = Object.keys(FARMING_CROPS);
  for (let index = 0; index < beds.length; index += 1) {
    const cropId = cropIds[index % cropIds.length];
    assert.equal(farming.purchaseSeed(cropId).ok, true, cropId);
    assert.equal(farming.plant(beds[index].id, cropId).ok, true, beds[index].id);
  }

  const advanced = gameState.getSnapshot();
  advanced.world = advanceWorldState(advanced.world, 2_000, { now: 60_000 }).world;
  assert.equal(gameState.replace(advanced).ok, true);
  assert.equal(farming.refresh({ persist: true }).ok, true);
  assert.equal(gameState.getSnapshot().farming.allotment.beds.every((bed) => bed.status === "ready"), true);

  for (const bed of beds) assert.equal(farming.harvest(bed.id).ok, true, bed.id);
  const harvested = gameState.getSnapshot();
  assert.equal(harvested.inventory.consumables["allotment-carrot"], FARMING_CROPS.carrot.harvestYield * 2);
  assert.equal(harvested.inventory.consumables["fresh-greens"], FARMING_CROPS["fresh-greens"].harvestYield * 2);
  assert.equal(harvested.inventory.consumables["wild-berries"], FARMING_CROPS["wild-berries"].harvestYield * 2);

  const rabbit = harvested.animals.residents["animal-rabbit-1"];
  Object.assign(rabbit, { adopted: true, active: true, trust: 70 });
  harvested.animals.activeAnimalId = rabbit.id;
  assert.equal(gameState.replace(harvested).ok, true);
  assert.equal(animals.feed(rabbit.id, "allotment-carrot").ok, true);
  assert.equal(repository.load().state.inventory.consumables["allotment-carrot"], FARMING_CROPS.carrot.harvestYield * 2 - 1);
  assert.equal(validateGameState(repository.load().state).ok, true);
});

test("Stage 6 preserves one-fruit-per-tree harvesting across save and reload", () => {
  const { gameState, repository, farming } = fundedRuntime();
  assert.equal(farming.harvestApple("apple-tree-1").ok, true);
  assert.equal(farming.harvestApple("apple-tree-1").code, "fruit-not-ready");
  assert.equal(repository.load().state.inventory.consumables["orchard-apple"], ORCHARD_CONFIG.harvestYield);

  const advanced = gameState.getSnapshot();
  // Calendar time is weather-weighted by the farming model, so a full game day
  // guarantees at least one 720-growth-minute production cycle.
  advanced.world = advanceWorldState(advanced.world, 1_440, { now: 70_000 }).world;
  assert.equal(gameState.replace(advanced).ok, true);
  assert.equal(farming.refresh({ persist: true }).ok, true);
  assert.equal(farming.harvestApple("apple-tree-1").ok, true);
  assert.equal(repository.load().state.inventory.consumables["orchard-apple"], ORCHARD_CONFIG.harvestYield * 2);
});
