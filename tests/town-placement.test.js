import test from "node:test";
import assert from "node:assert/strict";
import { ITEM_CATALOG, placeableFootprintFor } from "../src/data/items.js";
import {
  PLACEABLE_ITEM_IDS,
  RELEASED_PLACEABLE_ITEM_IDS,
  TOWN_PLACEMENT_LIMIT,
  placementBehaviorHooks,
  townPlacementCatalogueSummary,
  validateTownPlacement,
} from "../src/data/townPlacement.js";
import { createFreshGameState, GameStateService, upgradeGameState, validateGameState } from "../src/state/GameState.js";
import { SaveRepository } from "../src/state/SaveRepository.js";
import { projectLegacyTownPlacement, validateTownPlacementState } from "../src/state/townPlacementState.js";
import { TownPlacementService } from "../src/systems/TownPlacementService.js";
import { MemoryStorage } from "./helpers/MemoryStorage.js";

function runtime({ state = createFreshGameState({ now: 0 }), repository = new SaveRepository(new MemoryStorage()) } = {}) {
  const gameState = new GameStateService(state);
  const placement = new TownPlacementService(gameState, repository, { now: () => 1000 });
  return { gameState, placement, repository };
}

function ownedState(itemId, quantity = 1) {
  const state = createFreshGameState({ now: 0 });
  state.inventory.placeables[itemId] = quantity;
  return state;
}

test("pins all 35 original placeables, 32 released products and the safe 500-object limit", () => {
  const summary = townPlacementCatalogueSummary();
  assert.equal(summary.totalDefinitions, 35);
  assert.equal(summary.releasedDefinitions, 32);
  assert.equal(TOWN_PLACEMENT_LIMIT, 500);
  assert.equal(PLACEABLE_ITEM_IDS.length, 35);
  assert.equal(RELEASED_PLACEABLE_ITEM_IDS.length, 32);
  assert.ok(PLACEABLE_ITEM_IDS.every((id) => ITEM_CATALOG[id].category === "placeable"));
  assert.deepEqual(
    PLACEABLE_ITEM_IDS.map((id) => placeableFootprintFor(ITEM_CATALOG[id])).filter((size, index, sizes) => sizes.indexOf(size) === index).sort((a, b) => a - b),
    [28, 30, 38, 42, 50, 52, 58, 60, 72, 78],
  );
});

test("rejects roads, water, buildings, entrances and overlapping town objects", () => {
  assert.equal(validateTownPlacement("town-planter", 1000, 530).code, "road");
  assert.equal(validateTownPlacement("town-planter", 2500, 1300).code, "water");
  assert.equal(validateTownPlacement("town-planter", 300, 300).code, "building");
  const entrance = validateTownPlacement("town-planter", 305, 404);
  assert.equal(entrance.code, "entrance");
  assert.equal(validateTownPlacement("town-planter", 140, 100, {
    objects: [{ id: "placed-1", itemId: "town-planter", x: 100, y: 100 }],
  }).code, "object-overlap");
  assert.equal(validateTownPlacement("town-planter", 100, 100).ok, true);
});

test("places and rotates atomically, then reloads the exact position and rotation", () => {
  const storage = new MemoryStorage();
  const repository = new SaveRepository(storage);
  const { gameState, placement } = runtime({ state: ownedState("town-planter"), repository });
  assert.equal(placement.begin("town-planter", { previewX: 123.25, previewY: 105.75 }).ok, true);
  assert.equal(placement.preview(123.25, 105.75).ok, true);
  assert.equal(placement.rotate().rotation, Math.PI / 2);
  const placed = placement.confirm();
  assert.equal(placed.ok, true);
  assert.equal(placed.code, "object-placed");
  assert.equal(gameState.getSnapshot().inventory.placeables["town-planter"] || 0, 0);
  assert.deepEqual(
    { x: placed.object.x, y: placed.object.y, rotation: placed.object.rotation },
    { x: 123.25, y: 105.75, rotation: Math.PI / 2 },
  );
  const loaded = repository.load();
  assert.equal(loaded.ok, true);
  assert.deepEqual(
    loaded.state.townPlacement.objects.map(({ x, y, rotation }) => ({ x, y, rotation })),
    [{ x: 123.25, y: 105.75, rotation: Math.PI / 2 }],
  );
  assert.equal(validateGameState(loaded.state).ok, true);
});

test("moves without changing inventory and stores the exact object back into inventory", () => {
  const { gameState, placement } = runtime({ state: ownedState("town-planter") });
  placement.begin("town-planter", { previewX: 100, previewY: 100 });
  assert.equal(placement.confirm().ok, true);
  const objectId = gameState.getSnapshot().townPlacement.objects[0].id;
  assert.equal(placement.move(objectId).ok, true);
  assert.deepEqual(
    { x: placement.getSnapshot().active.previewX, y: placement.getSnapshot().active.previewY },
    { x: 100, y: 100 },
  );
  assert.equal(placement.preview(220, 100).ok, true);
  placement.rotate();
  const moved = placement.confirm();
  assert.equal(moved.code, "object-moved");
  assert.deepEqual(
    { x: moved.object.x, y: moved.object.y, rotation: moved.object.rotation },
    { x: 220, y: 100, rotation: Math.PI / 2 },
  );
  assert.equal(gameState.getSnapshot().inventory.placeables["town-planter"] || 0, 0);
  const stored = placement.store(objectId);
  assert.equal(stored.code, "object-stored");
  assert.equal(gameState.getSnapshot().townPlacement.objects.length, 0);
  assert.equal(gameState.getSnapshot().inventory.placeables["town-planter"], 1);
});

test("an invalid position never consumes inventory", () => {
  const { gameState, placement } = runtime({ state: ownedState("town-planter") });
  placement.begin("town-planter", { previewX: 2500, previewY: 1300 });
  assert.equal(placement.preview(2500, 1300).code, "water");
  const result = placement.confirm();
  assert.equal(result.ok, false);
  assert.equal(result.code, "water");
  assert.equal(gameState.getSnapshot().inventory.placeables["town-planter"], 1);
  assert.equal(gameState.getSnapshot().townPlacement.objects.length, 0);
});

test("a failed save restores the previous town, inventory and ledger exactly", () => {
  const failingRepository = { save: () => ({ ok: false, status: "fixture-failure" }) };
  const { gameState, placement } = runtime({ state: ownedState("town-planter"), repository: failingRepository });
  const checkpoint = gameState.getSnapshot();
  placement.begin("town-planter", { previewX: 100, previewY: 100 });
  const result = placement.confirm();
  assert.equal(result.ok, false);
  assert.equal(result.code, "persistence-failed");
  assert.equal(result.rollbackOk, true);
  assert.deepEqual(gameState.getSnapshot(), checkpoint);
});

test("legacy placements keep valid exact transforms and safely return rejected known items", () => {
  const inventory = createFreshGameState({ now: 0 }).inventory;
  const legacy = { economy: { placedObjects: [
    { id: "legacy-7", itemId: "town-planter", x: 123.25, y: 105.75, rotation: 1.234 },
    { id: "legacy-7", itemId: "town-planter", x: 220, y: 100, rotation: 0 },
    { id: "legacy-water", itemId: "small-town-bin", x: 2500, y: 1300, rotation: 0 },
    { id: "legacy-unknown", itemId: "future-statue", x: 100, y: 200, rotation: 0 },
  ] } };
  const projected = projectLegacyTownPlacement(legacy, inventory, { now: 1000 });
  assert.equal(validateTownPlacementState(projected).ok, true);
  assert.equal(projected.objects.length, 1);
  assert.deepEqual(
    { id: projected.objects[0].id, x: projected.objects[0].x, y: projected.objects[0].y, rotation: projected.objects[0].rotation },
    { id: "legacy-7", x: 123.25, y: 105.75, rotation: 1.234 },
  );
  assert.deepEqual(projected.importReport.returnedToInventory, { "town-planter": 1, "small-town-bin": 1 });
  assert.equal(projected.importReport.rejectedUnknown, 1);
  assert.equal(inventory.placeables["town-planter"], 1);
  assert.equal(inventory.placeables["small-town-bin"], 1);
});

test("every object exposes stable NPC, wildlife, rubbish and collision behaviour hooks", () => {
  const bench = placementBehaviorHooks(ITEM_CATALOG["wooden-bench"], { id: "placed-1" });
  const bin = placementBehaviorHooks(ITEM_CATALOG["small-town-bin"], { id: "placed-2" });
  const lamp = placementBehaviorHooks(ITEM_CATALOG["lamp-post"], { id: "placed-3" });
  assert.equal(bench.npcDestination, true);
  assert.equal(bin.npcBin, true);
  assert.equal(bin.capacity, 8);
  assert.equal(lamp.nightGlow, true);
  for (const hooks of [bench, bin, lamp]) {
    assert.ok(hooks.wildlifeObstacle.radius > 0);
    assert.ok(hooks.rubbishExclusion.radius > 0);
    assert.ok(hooks.playerCollision.radius > 0);
  }
});

test("schema 21 saves gain a valid empty placement domain without losing prior progress", () => {
  const old = createFreshGameState({ now: 0 });
  delete old.townPlacement;
  old.schemaVersion = 21;
  old.economy.coins = 4321;
  old.economy.lifetimeCoinsEarned = 4321;
  const upgraded = upgradeGameState(old, { now: 1000 });
  assert.equal(upgraded.schemaVersion, 35);
  assert.equal(upgraded.economy.coins, 4321);
  assert.equal(upgraded.townPlacement.objects.length, 0);
  assert.equal(validateGameState(upgraded).ok, true);
});
