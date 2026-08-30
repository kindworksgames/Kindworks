import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { ANIMAL_DEFINITIONS, groundAnimalSegmentBlocked } from "../src/data/animals.js";
import { HARBOUR_GENERAL_GEOMETRY, PAWS_WONDERS_GEOMETRY, VILLAGE_GROCER_GEOMETRY } from "../src/data/interiorGeometry.js";
import { validateLogicalGeometryContract } from "../src/data/logicalGeometry.js";
import { NPC_NAVIGATION_LINKS, NPC_NAVIGATION_NODES, NPC_RESIDENTS } from "../src/data/npcTownLife.js";
import { TOWN_HOUSE_GEOMETRY, TOWN_LOGICAL_GEOMETRY, TOWN_SHOP_GEOMETRY } from "../src/data/townGeometry.js";
import { npcNavigationDetour, npcNavigationEdgeBlockedByPlacements, validateTownPlacement } from "../src/data/townPlacement.js";
import { createFreshGameState } from "../src/state/GameState.js";
import { sanitizeTownPlacementState, validateTownPlacementState } from "../src/state/townPlacementState.js";
import { NavigationGraph } from "../src/systems/NavigationGraph.js";
import { NpcTownLifeService } from "../src/systems/NpcTownLifeService.js";

const root = resolve(import.meta.dirname, "..");

function gameplayDigest(state) {
  return JSON.stringify({
    schemaVersion: state.schemaVersion, economy: state.economy, inventory: state.inventory,
    progress: state.progress, npcs: state.npcs, animals: state.animals, farming: state.farming,
    townPlacement: state.townPlacement,
  });
}

test("replacement artwork dimensions, padding, origin, silhouette and animation frames cannot mutate town geometry", () => {
  const before = structuredClone({
    house: TOWN_HOUSE_GEOMETRY["house-20"],
    shop: TOWN_SHOP_GEOMETRY["Paws & Wonders"],
    world: TOWN_LOGICAL_GEOMETRY.worldBounds,
  });
  const replacements = [
    { canvas: [16, 16], padding: 0, origin: [0, 0], frames: 1 },
    { canvas: [8192, 4096], padding: 1024, origin: [1, 1], frames: 64 },
    { canvas: [1, 1], padding: 0, origin: [.5, .9], frames: 8, optionalFallback: true },
  ];
  for (const replacement of replacements) {
    replacement.canvas[0] *= 2;
    replacement.frames += 1;
    assert.deepEqual(TOWN_HOUSE_GEOMETRY["house-20"], before.house);
    assert.deepEqual(TOWN_SHOP_GEOMETRY["Paws & Wonders"], before.shop);
    assert.deepEqual(TOWN_LOGICAL_GEOMETRY.worldBounds, before.world);
  }
});

test("interior collisions, triggers, standing points and touch targets survive adversarial visual replacement", () => {
  for (const contract of [VILLAGE_GROCER_GEOMETRY, PAWS_WONDERS_GEOMETRY, HARBOUR_GENERAL_GEOMETRY]) {
    const before = structuredClone({
      collisions: contract.collisions, triggers: contract.triggerRegions, standing: contract.standingPoints,
      touch: contract.touchTargets, spawn: contract.spawnPoints, camera: contract.cameraBounds,
    });
    const replacement = { width: 4096, height: 8, alphaPadding: 1600, origin: { x: -2, y: 4 }, frames: Array(99).fill(0) };
    replacement.origin.x = 99;
    assert.deepEqual({
      collisions: contract.collisions, triggers: contract.triggerRegions, standing: contract.standingPoints,
      touch: contract.touchTargets, spawn: contract.spawnPoints, camera: contract.cameraBounds,
    }, before);
    assert.ok(contract.touchTargets.every((target) => target.minCssPixels >= 44));
  }
});

test("legacy placed objects block their navigation edge and receive a deterministic logical detour", () => {
  const graph = new NavigationGraph(NPC_NAVIGATION_NODES, NPC_NAVIGATION_LINKS);
  const blocker = { itemId: "town-planter", x: 405, y: 1155 };
  const from = graph.getNode("market1");
  const to = graph.getNode("market2");
  assert.equal(npcNavigationEdgeBlockedByPlacements(from, to, [blocker]), true);
  const first = npcNavigationDetour(from, to, [blocker], "npc-01:market2");
  const second = npcNavigationDetour(from, to, [blocker], "npc-01:market2");
  assert.equal(first.length, 2);
  assert.deepEqual(first, second, "the same save and resident must resolve the same route");
  assert.ok(first.every((point) => Math.hypot(point.x - blocker.x, point.y - blocker.y) > 50));
  assert.equal(validateTownPlacement("town-planter", blocker.x, blocker.y).code, "navigation-corridor");
});

test("the live NPC movement service follows the logical detour without changing its saved graph route", () => {
  const state = createFreshGameState({ now: 1_700_000_000_000 });
  state.townPlacement.objects = [{ id: "legacy-planter", itemId: "town-planter", x: 405, y: 1155, hooks: { playerCollision: { radius: 30 } } }];
  const service = new NpcTownLifeService({ getSnapshot: () => structuredClone(state) }, null);
  const resident = {
    ...structuredClone(state.npcs.residents[0]), id: NPC_RESIDENTS[0].id,
    x: 305, y: 1155, currentNodeId: "market1", targetNodeId: "market2",
    route: ["market1", "market2"], routeIndex: 1, phase: "commuting", visible: true,
  };
  const schedule = { targetNodeId: "market2", phase: "leisure", activity: "Testing a safe route" };
  service.moveResident(resident, NPC_RESIDENTS[0], schedule, 110);
  assert.equal(resident.routeIndex, 1);
  assert.ok(Math.hypot(resident.x - 405, resident.y - 1155) > 50, "movement must stay outside the planter footprint and corridor clearance");
  assert.deepEqual(resident.route, ["market1", "market2"], "presentation-safe detours must not rewrite persistent graph identity");
  service.moveResident(resident, NPC_RESIDENTS[0], schedule, 1000);
  assert.equal(resident.currentNodeId, "market2");
  assert.equal(resident.routeIndex, 0);
  assert.equal(resident.phase, "leisure");
});

test("an old route-blocking placement survives normalization while an identical new placement is refused", () => {
  const normalized = sanitizeTownPlacementState({
    schemaVersion: 1,
    nextSerial: 2,
    objects: [{ id: "town-object-1", itemId: "town-planter", x: 405, y: 1155, rotation: 0, placedAt: 1, placedGameMinute: 1 }],
  }, { now: 1 });
  assert.equal(normalized.objects.length, 1);
  assert.equal(normalized.objects[0].x, 405);
  assert.equal(normalized.objects[0].y, 1155);
  assert.equal(validateTownPlacementState(normalized).ok, true);
  assert.equal(validateTownPlacement("town-planter", 405, 1155).code, "navigation-corridor");
});

test("all static NPC edges and all ground-animal animation routes remain clear", () => {
  const nodes = new Map(NPC_NAVIGATION_NODES.map((node) => [node.id, node]));
  const obstacleHit = (from, to) => TOWN_LOGICAL_GEOMETRY.navigationObstacles.some((rect) => {
    const distance = Math.hypot(to.x - from.x, to.y - from.y);
    const samples = Math.max(1, Math.ceil(distance / 4));
    return Array.from({ length: samples + 1 }, (_, index) => ({ x: from.x + (to.x - from.x) * index / samples, y: from.y + (to.y - from.y) * index / samples }))
      .some((point) => point.x >= rect.x - 18 && point.x <= rect.x + rect.width + 18 && point.y >= rect.y - 18 && point.y <= rect.y + rect.height + 18);
  });
  const indoor = new Set(["home", "cafe", "shop", "bakery", "restaurant", "pub", "market", "cinema"]);
  for (const [fromId, toId] of NPC_NAVIGATION_LINKS) {
    const from = nodes.get(fromId); const to = nodes.get(toId);
    if (!indoor.has(from.kind) && !indoor.has(to.kind)) assert.equal(obstacleHit(from, to), false, `${fromId} → ${toId}`);
  }
  for (const definition of ANIMAL_DEFINITIONS.filter((entry) => !entry.aerial && !entry.water)) {
    definition.route.forEach((from, index) => assert.equal(groundAnimalSegmentBlocked(from, definition.route[(index + 1) % definition.route.length]), false, `${definition.id}:${index}`));
  }
});

test("geometry repairs preserve the save/progression contract", () => {
  const before = createFreshGameState({ now: 1_700_000_000_000 });
  const digest = gameplayDigest(before);
  for (const contract of [TOWN_LOGICAL_GEOMETRY, VILLAGE_GROCER_GEOMETRY, PAWS_WONDERS_GEOMETRY, HARBOUR_GENERAL_GEOMETRY]) assert.equal(validateLogicalGeometryContract(contract).ok, true);
  assert.equal(gameplayDigest(before), digest);
});

test("decorative interior artwork is non-interactive and dedicated logical hit zones own taps", async () => {
  for (const file of ["VillageGrocerScene.js", "PawsWondersScene.js", "HarbourGeneralScene.js"]) {
    const source = await readFile(resolve(root, "src/scenes", file), "utf8");
    assert.match(source, /const hitTarget = this\.add\.zone\(touch\.x/);
    assert.doesNotMatch(source, /const zone =[^;]+\.setInteractive/);
  }
});

test("camera, world, spawn and trigger consumers use logical contracts", async () => {
  const [town, grocer, paws, harbour] = await Promise.all(["TownScene.js", "VillageGrocerScene.js", "PawsWondersScene.js", "HarbourGeneralScene.js"].map((file) => readFile(resolve(root, "src/scenes", file), "utf8")));
  assert.match(town, /const cameraBounds = TOWN_LOGICAL_GEOMETRY\.cameraBounds/);
  assert.match(town, /const bounds = TOWN_LOGICAL_GEOMETRY\.worldBounds/);
  assert.match(town, /TOWN_LOGICAL_GEOMETRY\.spawnPoints\[0\]/);
  for (const source of [grocer, paws, harbour]) {
    assert.match(source, /_GEOMETRY\.spawnPoints\[0\]/);
    assert.match(source, /_GEOMETRY\.triggerRegions\[0\]/);
    assert.match(source, /_GEOMETRY\.worldBounds/);
  }
});
