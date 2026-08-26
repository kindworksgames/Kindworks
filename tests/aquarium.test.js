import test from "node:test";
import assert from "node:assert/strict";
import { AQUARIUM_CONFIG, AQUARIUM_SPECIES, FISH_TANK_ITEM_ID } from "../src/data/aquarium.js";
import { FISHING_CONFIG, ORNAMENTAL_FISH_IDS } from "../src/data/fishing.js";
import { findSafeFurniturePlacement } from "../src/data/homeInteriors.js";
import { createFreshGameState, GameStateService, upgradeGameState, validateGameState } from "../src/state/GameState.js";
import {
  aquariumDisplayFish,
  aquariumSnapshot,
  routeOrnamentalCatchInto,
} from "../src/state/aquariumState.js";
import { AquariumService } from "../src/systems/AquariumService.js";
import { FishingService } from "../src/systems/FishingService.js";
import { HomeInteriorService } from "../src/systems/HomeInteriorService.js";
import { SaveRepository } from "../src/state/SaveRepository.js";
import { MemoryStorage } from "./helpers/MemoryStorage.js";

function withPlacedTank() {
  const state = createFreshGameState({ now: 0 });
  state.homeInteriors.placements.push({ id: "home-furniture-1", itemId: FISH_TANK_ITEM_ID, rx: 0.78, ry: 0.72, rotation: 0, placedAt: 1 });
  state.homeInteriors.nextPlacementId = 2;
  return state;
}

function runtime({ state = createFreshGameState({ now: 0 }), repository = new SaveRepository(new MemoryStorage()), random = () => 0.25 } = {}) {
  const gameState = new GameStateService(state);
  const aquarium = new AquariumService(gameState, repository, { now: () => 1000 });
  const fishing = new FishingService(gameState, repository, { now: () => 1000, random, aquarium });
  const home = new HomeInteriorService(gameState, repository, { now: () => 1000, aquarium });
  return { gameState, aquarium, fishing, home, repository };
}

function beginReedbankCatch(fishing) {
  const begun = fishing.begin("fish", "fishing-reedbank", { returnPosition: { x: 10, y: 20 }, returnFacing: "left" });
  assert.equal(begun.ok, true);
  const zone = begun.session.hiddenZones[0];
  assert.equal(fishing.cast({ x: zone.x, y: zone.y }).ok, true);
  assert.equal(fishing.signalReady().ok, true);
}

test("pins the original four aquarium species, distinct art and 99-per-species capacity", () => {
  assert.deepEqual(AQUARIUM_SPECIES.map((species) => species.id), ORNAMENTAL_FISH_IDS);
  assert.deepEqual(AQUARIUM_SPECIES.map((species) => species.name), ["Goldfish", "Koi", "Angelfish", "Oranda Goldfish"]);
  assert.equal(new Set(AQUARIUM_SPECIES.map((species) => species.art)).size, 4);
  assert.equal(AQUARIUM_SPECIES.at(-1).rarity, "legendary");
  assert.equal(AQUARIUM_CONFIG.maxPerSpecies, 99);
  assert.equal(FISHING_CONFIG.maxAquariumPerSpecies, 99);
});

test("fresh schema 33 state has a valid empty unowned aquarium", () => {
  const state = createFreshGameState({ now: 0 });
  const aquarium = aquariumSnapshot(state);
  assert.equal(state.schemaVersion, 35);
  assert.equal(validateGameState(state).ok, true);
  assert.equal(aquarium.owned, false);
  assert.equal(aquarium.placed, false);
  assert.equal(aquarium.totalFish, 0);
  assert.deepEqual(state.fishing.aquariumByItem, Object.fromEntries(ORNAMENTAL_FISH_IDS.map((id) => [id, 0])));
});

test("a Reedbank ornamental catch enters a placed tank and never ordinary inventory", () => {
  const { gameState, fishing } = runtime({ state: withPlacedTank() });
  beginReedbankCatch(fishing);
  const result = fishing.reelFish({ forcedItemId: "reedbank-koi" });
  assert.equal(result.ok, true);
  assert.equal(result.disposition, "aquarium");
  assert.equal(result.aquarium.totalFish, 1);
  assert.equal(result.aquarium.species[0].name, "Koi");
  const state = gameState.getSnapshot();
  assert.equal(state.fishing.aquariumByItem["reedbank-koi"], 1);
  assert.equal(state.fishing.caughtByItem["reedbank-koi"], 1);
  assert.equal(state.inventory.consumables["reedbank-koi"], undefined);
});

test("a Reedbank ornamental catch is safely released when no tank is placed", () => {
  const { gameState, fishing } = runtime();
  beginReedbankCatch(fishing);
  const result = fishing.reelFish({ forcedItemId: "pond-goldfish" });
  assert.equal(result.disposition, "released-no-tank");
  assert.equal(result.aquarium.totalFish, 0);
  assert.equal(gameState.getSnapshot().fishing.releasedByItem["pond-goldfish"], 1);
});

test("a full species section safely releases the next fish without exceeding 99", () => {
  const state = withPlacedTank();
  state.fishing.aquariumByItem["pond-angelfish"] = 99;
  const routed = routeOrnamentalCatchInto(state, "pond-angelfish");
  assert.equal(routed.disposition, "released-full");
  assert.equal(state.fishing.aquariumByItem["pond-angelfish"], 99);
  assert.equal(state.fishing.releasedByItem["pond-angelfish"], 1);
});

test("the home display cycles species fairly and limits the animated tank to eight fish", () => {
  const state = withPlacedTank();
  Object.assign(state.fishing.aquariumByItem, { "pond-goldfish": 4, "reedbank-koi": 2, "pond-angelfish": 1, "oranda-goldfish": 1 });
  assert.deepEqual(aquariumDisplayFish(state, 8), [
    "pond-goldfish", "reedbank-koi", "pond-angelfish", "oranda-goldfish",
    "pond-goldfish", "reedbank-koi", "pond-goldfish", "pond-goldfish",
  ]);
});

test("an occupied tank cannot be stored, while the saved room remains unchanged", () => {
  const state = withPlacedTank();
  state.fishing.aquariumByItem["oranda-goldfish"] = 1;
  const { gameState, home } = runtime({ state });
  const before = gameState.getSnapshot();
  const result = home.store("home-furniture-1");
  assert.equal(result.code, "aquarium-occupied");
  assert.match(result.message, /cannot be stored/i);
  assert.deepEqual(gameState.getSnapshot(), before);
});

test("an occupied tank can still be moved safely inside the home", () => {
  const state = withPlacedTank();
  state.customResident.profile = { name: "Meadow", skin: "warm", hair: 1, hairColor: "dark-brown", accessory: "badge", outfit: 1, bodyBuild: "average", hobbies: ["nature"] };
  state.fishing.aquariumByItem["pond-goldfish"] = 2;
  const { gameState, home } = runtime({ state });
  const safe = findSafeFurniturePlacement(gameState.getSnapshot(), { id: "home-furniture-1", itemId: FISH_TANK_ITEM_ID, rx: 0.25, ry: 0.72, rotation: 0 });
  assert.ok(safe);
  assert.equal(home.beginPlacement(FISH_TANK_ITEM_ID, { existingPlacementId: "home-furniture-1" }).ok, true);
  assert.equal(home.preview(safe.rx, safe.ry).ok, true);
  assert.equal(home.confirmPlacement().code, "furniture-moved");
  assert.equal(gameState.getSnapshot().fishing.aquariumByItem["pond-goldfish"], 2);
});

test("aquarium catches persist across a full repository reload", () => {
  const storage = new MemoryStorage();
  const repository = new SaveRepository(storage);
  const first = runtime({ state: withPlacedTank(), repository });
  beginReedbankCatch(first.fishing);
  assert.equal(first.fishing.reelFish({ forcedItemId: "oranda-goldfish" }).disposition, "aquarium");
  const loaded = repository.load();
  assert.equal(loaded.ok, true);
  const reloaded = new GameStateService(loaded.state);
  assert.equal(aquariumSnapshot(reloaded.getSnapshot()).species.find((species) => species.id === "oranda-goldfish").count, 1);
});

test("a failed catch save rolls back the aquarium and all catch counters", () => {
  let saves = 0;
  const repository = { save: () => (++saves === 1 ? { ok: true, status: "saved" } : { ok: false, status: "write-failed" }) };
  const { gameState, fishing } = runtime({ state: withPlacedTank(), repository });
  beginReedbankCatch(fishing);
  const before = gameState.getSnapshot();
  const result = fishing.reelFish({ forcedItemId: "reedbank-koi" });
  assert.equal(result.code, "persistence-failed");
  assert.deepEqual(gameState.getSnapshot(), before);
});

test("schema 29 legacy saves retain housed fish, but safely release fish without a placed tank", () => {
  const housed = withPlacedTank();
  housed.schemaVersion = 29;
  housed.source = { kind: "legacy-import", legacyVersion: 82, legacySourceKey: "legacy", importedAt: housed.updatedAt, warnings: [] };
  housed.legacySnapshot = { version: 82, fishing: { totalCasts: 4, totalCaught: 3, caughtByItem: { "reedbank-koi": 3 }, aquariumByItem: { "reedbank-koi": 2 }, releasedByItem: { "reedbank-koi": 1 } }, magnetFishing: {} };
  const originalSnapshot = structuredClone(housed.legacySnapshot);
  const upgradedHoused = upgradeGameState(housed, { now: 1000 });
  assert.equal(upgradedHoused.schemaVersion, 35);
  assert.equal(upgradedHoused.fishing.aquariumByItem["reedbank-koi"], 2);
  assert.equal(upgradedHoused.fishing.releasedByItem["reedbank-koi"], 1);
  assert.deepEqual(upgradedHoused.legacySnapshot, originalSnapshot);
  assert.equal(validateGameState(upgradedHoused).ok, true);

  const unhoused = createFreshGameState({ now: 0 });
  unhoused.schemaVersion = 29;
  unhoused.source = { kind: "legacy-import", legacyVersion: 82, legacySourceKey: "legacy", importedAt: unhoused.updatedAt, warnings: [] };
  unhoused.legacySnapshot = structuredClone(originalSnapshot);
  unhoused.inventory.consumables["pond-goldfish"] = 2;
  const upgradedUnhoused = upgradeGameState(unhoused, { now: 1000 });
  assert.equal(upgradedUnhoused.fishing.aquariumByItem["reedbank-koi"], 0);
  assert.equal(upgradedUnhoused.fishing.releasedByItem["reedbank-koi"], 3);
  assert.equal(upgradedUnhoused.fishing.releasedByItem["pond-goldfish"], 2);
  assert.equal(upgradedUnhoused.inventory.consumables["pond-goldfish"], undefined);
  assert.equal(upgradedUnhoused.economy.ledger.some((entry) => entry.kind === "aquarium-safe-release"), true);
  assert.equal(upgradedUnhoused.economy.ledger.some((entry) => entry.kind === "legacy-ornamental-fish-release"), true);
  assert.equal(validateGameState(upgradedUnhoused).ok, true);
});

test("aquarium diagnostics report integrated housing, capacity and inventory safety", () => {
  const state = withPlacedTank();
  state.fishing.aquariumByItem["pond-goldfish"] = 2;
  const { aquarium } = runtime({ state });
  const diagnostics = aquarium.getDiagnostics();
  assert.equal(diagnostics.integrated, true);
  assert.equal(diagnostics.tankPlaced, true);
  assert.equal(diagnostics.totalFish, 2);
  assert.equal(diagnostics.maxPerSpecies, 99);
  assert.equal(diagnostics.safeReleaseWithoutTank, true);
  assert.equal(diagnostics.consumableInventoryLeak, false);
});
