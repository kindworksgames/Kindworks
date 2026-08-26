import test from "node:test";
import assert from "node:assert/strict";
import {
  HOME_FURNITURE_LIMIT,
  HOUSE_INTERIOR_THEMES,
  buildHouseInteriorLayout,
  findSafeFurniturePlacement,
  houseHomeNodeId,
  validateFurniturePlacement,
} from "../src/data/homeInteriors.js";
import { ITEM_CATALOG } from "../src/data/items.js";
import { HOUSES } from "../src/data/town.js";
import { createFreshGameState, GameStateService, upgradeGameState, validateGameState } from "../src/state/GameState.js";
import { projectLegacyHomeInteriors, validateHomeInteriorState } from "../src/state/homeInteriorState.js";
import { CustomResidentService } from "../src/systems/CustomResidentService.js";
import { HomeInteriorService } from "../src/systems/HomeInteriorService.js";

class Repository {
  constructor(ok = true) { this.ok = ok; this.saves = []; }
  save(state) {
    if (!this.ok) return { ok: false, status: "fixture-failure" };
    this.saves.push(structuredClone(state));
    return { ok: true, status: "saved" };
  }
}

function profile() {
  return { name: "Meadow", skin: "warm", hair: 1, hairColor: "dark-brown", accessory: "badge", outfit: 1, bodyBuild: "average", hobbies: ["gardening", "reading", "helping"], home: { wallColor: "sage", roofStyle: "gable", roofColor: "terracotta" } };
}

function runtime({ repository = new Repository(), now = () => 1000 } = {}) {
  const gameState = new GameStateService(createFreshGameState({ now: 0 }));
  const resident = new CustomResidentService(gameState, new Repository(), { now });
  assert.equal(resident.saveProfile(profile()).ok, true);
  const service = new HomeInteriorService(gameState, repository, { now, customResident: resident });
  return { gameState, service, resident, repository };
}

function grant(gameState, itemId, quantity = 1) {
  const state = gameState.getSnapshot();
  state.inventory.furniture[itemId] = quantity;
  assert.equal(gameState.replace(state).ok, true);
}

function safePreview(service, itemId, preferred = { rx: 0.5, ry: 0.5, rotation: 0 }) {
  const state = service.gameState.getSnapshot();
  const safe = findSafeFurniturePlacement(state, { id: "preview", itemId, ...preferred });
  assert.ok(safe, `${itemId} should have a safe placement`);
  return safe;
}

test("pins all ten authored furniture products and the 60-placement boundary", () => {
  const expected = [
    ["cosy-sofa", "sofa", [0.20, 0.12], 2400], ["reading-armchair", "armchair", [0.11, 0.13], 1600],
    ["oak-coffee-table", "coffee-table", [0.14, 0.10], 1300], ["tall-bookshelf", "bookshelf", [0.09, 0.17], 2100],
    ["glow-floor-lamp", "floor-lamp", [0.075, 0.10], 1100], ["leafy-house-plant", "plant", [0.075, 0.10], 850],
    ["woven-home-rug", "woven-rug", [0.20, 0.16], 1400], ["record-player", "record-player", [0.11, 0.10], 2800],
    ["companion-basket", "companion-basket", [0.12, 0.11], 1800], ["ornamental-fish-tank", "fish-tank", [0.19, 0.13], 6500],
  ];
  assert.deepEqual(expected.map(([id]) => id), Object.values(ITEM_CATALOG).filter((item) => item.category === "furniture").map((item) => item.id));
  for (const [id, kind, size, price] of expected) assert.deepEqual([ITEM_CATALOG[id].indoorKind, ITEM_CATALOG[id].indoorSize, ITEM_CATALOG[id].price], [kind, size, price]);
  assert.equal(ITEM_CATALOG["woven-home-rug"].floorLayer, true);
  assert.equal(ITEM_CATALOG["ornamental-fish-tank"].aquarium, true);
  assert.equal(HOME_FURNITURE_LIMIT, 60);
});

test("builds all 19 bird's-eye interiors with walls, floors, doors, beds and household furniture", () => {
  const state = createFreshGameState({ now: 0 });
  assert.equal(HOUSES.length, 19);
  assert.equal(HOUSE_INTERIOR_THEMES.length, 6);
  for (const house of HOUSES) {
    const layout = buildHouseInteriorLayout(state, house.id);
    assert.ok(layout.w >= 620 && layout.h >= 390);
    assert.ok(layout.door.w > 0 && layout.door.h > 0);
    assert.ok(layout.furniture.some((item) => item.kind === "bed"));
    assert.ok(layout.furniture.some((item) => item.kind === "table"));
    assert.ok(layout.furniture.some((item) => item.kind === "kitchen"));
    assert.equal(houseHomeNodeId(house.id), house.id === "house-20" ? "home20" : `home${house.id.split("-")[1].padStart(2, "0")}`);
  }
});

test("derives live occupants from resident schedules and clean/dirty state from House Rescue", () => {
  const { service } = runtime();
  const neighbour = service.getInterior("house-1");
  assert.equal(neighbour.ok, true);
  assert.ok(neighbour.residents.length > 0);
  assert.equal(neighbour.occupants.length, neighbour.residents.length);
  assert.equal(neighbour.occupants.every((resident) => resident.actionState === "HOME"), true);
  assert.equal(neighbour.dirty, service.gameState.getSnapshot().houseRescue.homes["house-1"].dirty);
  const personal = service.getInterior("house-20");
  assert.equal(personal.clean, true);
  assert.equal(personal.occupants.some((resident) => resident.name === "Meadow"), true);
});

test("records home entry and inspection interactions through verified persistence", () => {
  const { service, repository } = runtime();
  const entered = service.enter("house-1");
  assert.equal(entered.ok, true);
  assert.equal(service.getSnapshot().visits["house-1"].count, 1);
  const inspected = service.inspect("house-1", "dining-table");
  assert.equal(inspected.ok, true);
  assert.equal(inspected.target.label, "Dining table");
  assert.match(inspected.target.detail, /household gathers/i);
  assert.equal(service.getSnapshot().visits["house-1"].inspections, 1);
  assert.ok(repository.saves.length >= 2);
});

test("places, rotates, moves and stores furniture atomically with inventory and ledger changes", () => {
  let clock = 1000;
  const { gameState, service } = runtime({ now: () => clock++ });
  grant(gameState, "reading-armchair", 1);
  assert.equal(service.beginPlacement("reading-armchair").ok, true);
  const safe = safePreview(service, "reading-armchair");
  assert.equal(service.preview(safe.rx, safe.ry).ok, true);
  assert.equal(service.rotate().ok, true);
  if (!service.lastResult.ok) service.rotate();
  const active = service.getSnapshot().activePlacement;
  const valid = validateFurniturePlacement(gameState.getSnapshot(), active.itemId, active.rx, active.ry, { rotation: active.rotation });
  if (!valid.ok) service.preview(safe.rx, safe.ry);
  const placed = service.confirmPlacement();
  assert.equal(placed.ok, true);
  assert.equal(gameState.getSnapshot().inventory.furniture["reading-armchair"], undefined);
  assert.equal(gameState.getSnapshot().economy.ledger.at(-1).kind, "home-furniture-place");
  const id = placed.placement.id;
  assert.equal(service.beginPlacement("reading-armchair", { existingPlacementId: id }).ok, true);
  const moveSafe = safePreview(service, "reading-armchair", { rx: 0.85, ry: 0.8, rotation: 0 });
  service.preview(moveSafe.rx, moveSafe.ry);
  assert.equal(service.confirmPlacement().code, "furniture-moved");
  assert.equal(gameState.getSnapshot().economy.ledger.at(-1).kind, "home-furniture-move");
  assert.equal(service.store(id).ok, true);
  assert.equal(gameState.getSnapshot().inventory.furniture["reading-armchair"], 1);
  assert.equal(gameState.getSnapshot().economy.ledger.at(-1).kind, "home-furniture-store");
});

test("floor rugs may overlap while solid furniture respects walls, doors, dividers and other objects", () => {
  const { gameState } = runtime();
  const rug = validateFurniturePlacement(gameState.getSnapshot(), "woven-home-rug", 0.5, 0.5);
  assert.equal(rug.ok, true);
  assert.equal(validateFurniturePlacement(gameState.getSnapshot(), "cosy-sofa", 0.01, 0.01).code, "outside-walls");
  assert.equal(validateFurniturePlacement(gameState.getSnapshot(), "cosy-sofa", 0.53, 0.88).code, "doorway-blocked");
  const safe = findSafeFurniturePlacement(gameState.getSnapshot(), { id: "preview", itemId: "cosy-sofa", rx: 0.5, ry: 0.5, rotation: 0 });
  const state = gameState.getSnapshot();
  state.homeInteriors.placements.push({ id: "home-furniture-1", itemId: "cosy-sofa", rx: safe.rx, ry: safe.ry, rotation: safe.rotation, placedAt: 1 });
  state.homeInteriors.nextPlacementId = 2;
  assert.equal(gameState.replace(state).ok, true);
  assert.equal(validateFurniturePlacement(gameState.getSnapshot(), "reading-armchair", safe.rx, safe.ry).code, "furniture-overlap");
  assert.equal(validateFurniturePlacement(gameState.getSnapshot(), "woven-home-rug", safe.rx, safe.ry).ok, true);
});

test("keeps the ornamental fish tank unique across inventory and placed furniture", () => {
  const { gameState, service } = runtime();
  grant(gameState, "ornamental-fish-tank", 1);
  service.beginPlacement("ornamental-fish-tank");
  const safe = safePreview(service, "ornamental-fish-tank");
  service.preview(safe.rx, safe.ry);
  assert.equal(service.confirmPlacement().ok, true);
  const state = gameState.getSnapshot();
  state.inventory.furniture["ornamental-fish-tank"] = 1;
  assert.equal(gameState.replace(state).ok, true);
  assert.equal(service.beginPlacement("ornamental-fish-tank").ok, true);
  assert.equal(service.preview(0.5, 0.5).code, "unique-furniture");
  service.cancelPlacement();
  assert.equal(service.store(state.homeInteriors.placements[0].id).ok, false, "invalid duplicate fixture remains blocked by inventory validation");
});

test("enforces the 60-placement cap and preserves rugs as valid floor-layer placements", () => {
  const { gameState, service } = runtime();
  const state = gameState.getSnapshot();
  state.homeInteriors.placements = Array.from({ length: 60 }, (_, index) => ({ id: `home-furniture-${index + 1}`, itemId: "woven-home-rug", rx: 0.5, ry: 0.5, rotation: 0, placedAt: index + 1 }));
  state.homeInteriors.nextPlacementId = 61;
  state.inventory.furniture["woven-home-rug"] = 1;
  assert.equal(gameState.replace(state).ok, true);
  assert.equal(validateHomeInteriorState(gameState.getSnapshot().homeInteriors).ok, true);
  assert.equal(service.beginPlacement("woven-home-rug").code, "limit-reached");
});

test("rolls back the exact room and inventory when a furniture save fails", () => {
  const failed = new Repository(false);
  const { gameState, service } = runtime({ repository: failed });
  grant(gameState, "leafy-house-plant", 1);
  const before = gameState.getSnapshot();
  service.beginPlacement("leafy-house-plant");
  const safe = safePreview(service, "leafy-house-plant");
  service.preview(safe.rx, safe.ry);
  const result = service.confirmPlacement();
  assert.equal(result.code, "persistence-failed");
  assert.deepEqual(gameState.getSnapshot(), before);
});

test("imports original HTML furniture positions, quarter-turns and serial safely", () => {
  const projected = projectLegacyHomeInteriors({ homeFurniture: { serial: 9, placements: [
    { id: "home-furniture-7", itemId: "cosy-sofa", rx: 0.24, ry: 0.71, rotation: 1.54, placedAt: 123 },
    { id: "home-furniture-8", itemId: "unknown-chair", rx: 0.5, ry: 0.5, rotation: 0, placedAt: 124 },
  ] } });
  assert.equal(projected.placements.length, 1);
  assert.equal(projected.placements[0].rotation, Math.PI / 2);
  assert.equal(projected.nextPlacementId, 10);
  assert.equal(validateHomeInteriorState(projected).ok, true);
});

test("upgrades schema 28 through schema 33 and projects legacy furniture without touching the snapshot", () => {
  const old = createFreshGameState({ now: 0 });
  old.schemaVersion = 28;
  delete old.homeInteriors;
  const upgraded = upgradeGameState(old, { now: 1000 });
  assert.equal(upgraded.schemaVersion, 37);
  assert.deepEqual(upgraded.homeInteriors.placements, []);
  assert.equal(validateGameState(upgraded).ok, true);
  const legacy = createFreshGameState({ now: 0 });
  legacy.schemaVersion = 28;
  legacy.source = { kind: "legacy-import", legacyVersion: 82, legacySourceKey: "legacy", importedAt: legacy.updatedAt, warnings: [] };
  legacy.legacySnapshot = { version: 82, homeFurniture: { placements: [{ id: "home-furniture-2", itemId: "woven-home-rug", rx: 0.5, ry: 0.5, rotation: 0, placedAt: 1 }], serial: 2 } };
  delete legacy.homeInteriors;
  const imported = upgradeGameState(legacy, { now: 1000 });
  assert.equal(imported.homeInteriors.placements[0].itemId, "woven-home-rug");
  assert.equal(imported.legacySnapshot.homeFurniture.serial, 2);
});
