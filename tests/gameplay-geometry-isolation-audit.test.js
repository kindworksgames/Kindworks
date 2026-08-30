import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";

import { ANIMAL_DEFINITIONS, groundAnimalSegmentBlocked } from "../src/data/animals.js";
import { NPC_NAVIGATION_LINKS, NPC_NAVIGATION_NODES } from "../src/data/npcTownLife.js";
import { HOUSES, RIVER_PATH, SHOPS } from "../src/data/town.js";
import { TOWN_HOUSE_GEOMETRY, TOWN_LOGICAL_GEOMETRY, TOWN_SHOP_GEOMETRY } from "../src/data/townGeometry.js";
import { HARBOUR_GENERAL_GEOMETRY, PAWS_WONDERS_GEOMETRY, VILLAGE_GROCER_GEOMETRY } from "../src/data/interiorGeometry.js";
import { npcNavigationEdgeBlockedByPlacements, validateTownPlacement } from "../src/data/townPlacement.js";
import { createFreshGameState } from "../src/state/GameState.js";
import { FISHING_LAYOUT_INSTANCE_IDS, FISHING_SCENE_LAYOUT } from "../src/visual/layouts/fishingSceneLayout.js";
import { SceneLayoutRuntime } from "../src/visual/layouts/SceneLayoutRuntime.js";

const root = resolve(import.meta.dirname, "..");

function distanceToSegment(point, start, end) {
  const dx = end.x - start.x; const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  const amount = lengthSquared ? Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared)) : 0;
  return Math.hypot(point.x - (start.x + dx * amount), point.y - (start.y + dy * amount));
}

function distanceToPolyline(point, polyline) {
  let best = Infinity;
  for (let index = 1; index < polyline.length; index += 1) best = Math.min(best, distanceToSegment(point, { x: polyline[index - 1][0], y: polyline[index - 1][1] }, { x: polyline[index][0], y: polyline[index][1] }));
  return best;
}

function samples(from, to, spacing = 4) {
  const count = Math.max(1, Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) / spacing));
  return Array.from({ length: count + 1 }, (_, index) => ({ x: from.x + (to.x - from.x) * index / count, y: from.y + (to.y - from.y) * index / count }));
}

const blockedForGroundAnimal = (point) => distanceToPolyline(point, RIVER_PATH) < 96 || TOWN_LOGICAL_GEOMETRY.navigationObstacles.some((rect) => point.x >= rect.x - 18 && point.x <= rect.x + rect.width + 18 && point.y >= rect.y - 18 && point.y <= rect.y + rect.height + 18);

function fragileSaveFields(value, path = "state", results = []) {
  if (!value || typeof value !== "object") return results;
  for (const [key, child] of Object.entries(value)) {
    const childPath = `${path}.${key}`;
    if (/(texture(Key)?|sprite(Key)?|frame(Name)?|asset(Path)?|image(Path)?)/i.test(key)) results.push(childPath);
    if (typeof child === "string" && /\.(png|webp|jpe?g|gif|svg)(\?|$)/i.test(child)) results.push(childPath);
    fragileSaveFields(child, childPath, results);
  }
  return results;
}

function fakeVisual(canvas) {
  return {
    canvas, body: { x: 10, y: 20, width: 30, height: 40 }, interaction: { x: 12, y: 22, radius: 44 }, navigation: { x: 14, y: 24, radius: 28 },
    setPosition(x, y) { this.x = x; this.y = y; return this; }, setOrigin(x, y) { this.origin = { x, y }; return this; }, setScale() { return this; }, setRotation() { return this; }, setFlipX() { return this; }, setFlipY() { return this; }, setDepth() { return this; }, setVisible() { return this; }, setAlpha() { return this; }, setTint() { return this; }, setData() { return this; },
  };
}

test("controlled replacement canvases, padding, origin metadata, and optional fallback do not move Fishing gameplay geometry", () => {
  const fixtures = [
    fakeVisual({ width: 32, height: 32, padding: 0, authoredOrigin: { x: 0, y: 0 } }),
    fakeVisual({ width: 2048, height: 1024, padding: 128, authoredOrigin: { x: 1, y: 1 } }),
    fakeVisual({ width: 1, height: 1, fallback: true, authoredOrigin: { x: 0.5, y: 0.5 } }),
  ];
  const before = fixtures.map(({ body, interaction, navigation }) => structuredClone({ body, interaction, navigation }));
  for (const fixture of fixtures) new SceneLayoutRuntime({}, FISHING_SCENE_LAYOUT).register(FISHING_LAYOUT_INSTANCE_IDS.BACKGROUND, fixture);
  for (const [index, fixture] of fixtures.entries()) {
    assert.deepEqual({ x: fixture.x, y: fixture.y, origin: fixture.origin }, { x: 640, y: 360, origin: { x: 0.5, y: 0.5 } });
    assert.deepEqual({ body: fixture.body, interaction: fixture.interaction, navigation: fixture.navigation }, before[index]);
  }
});

test("fresh saves contain no texture path, sprite key, or frame-name identity", () => {
  assert.deepEqual(fragileSaveFields(createFreshGameState({ now: 1_700_000_000_000 })), []);
});

test("town placement rejects every sampled NPC navigation corridor", () => {
  const nodes = new Map(NPC_NAVIGATION_NODES.map((node) => [node.id, node]));
  let witness = null;
  for (const [fromId, toId] of NPC_NAVIGATION_LINKS) {
    const from = nodes.get(fromId); const to = nodes.get(toId);
    for (let step = 2; step <= 8; step += 1) {
      const amount = step / 10; const x = Math.round(from.x + (to.x - from.x) * amount); const y = Math.round(from.y + (to.y - from.y) * amount);
      const result = validateTownPlacement("town-planter", x, y);
      if (result.ok) { witness = { fromId, toId, x, y, footprint: result.footprint }; break; }
    }
    if (witness) break;
  }
  assert.equal(witness, null);
  assert.equal(validateTownPlacement("town-planter", 405, 1155).code, "navigation-corridor");
});

test("NPC path planning dynamically blocks legacy placed-object route edges", async () => {
  const nodes = new Map(NPC_NAVIGATION_NODES.map((node) => [node.id, node]));
  assert.equal(npcNavigationEdgeBlockedByPlacements(nodes.get("market1"), nodes.get("market2"), [{ itemId: "town-planter", x: 405, y: 1155 }]), true);
  const source = await readFile(resolve(root, "src/systems/NpcTownLifeService.js"), "utf8");
  assert.match(source, /routeFor\(startNodeId, targetNodeId/);
  assert.match(source, /blockedEdge: \(from, to\) => npcNavigationEdgeBlockedByPlacements/);
  assert.match(source, /remainingRouteBlocked\(resident/);
});

test("all generated ground-animal route segments avoid logical buildings and river space", () => {
  const violations = [];
  for (const animal of ANIMAL_DEFINITIONS.filter((entry) => !entry.aerial && !entry.water)) {
    for (let index = 0; index < animal.route.length; index += 1) {
      const from = animal.route[index]; const to = animal.route[(index + 1) % animal.route.length];
      if (samples(from, to).some(blockedForGroundAnimal) || groundAnimalSegmentBlocked(from, to)) violations.push({ animalId: animal.id, segment: index });
    }
  }
  assert.deepEqual(violations, []);
});

test("town animal interaction eligibility is semantic and independent of rendered alpha", async () => {
  const source = await readFile(resolve(root, "src/scenes/TownScene.js"), "utf8");
  assert.match(source, /interaction\.enabled = presentation\.interactionReady/);
  assert.doesNotMatch(source, /interaction\.enabled\s*=.*character\.alpha/);
});

test("house and shop visual replacement metadata cannot alter logical collisions or interactions", async () => {
  const source = await readFile(resolve(root, "src/scenes/TownScene.js"), "utf8");
  assert.match(source, /const width = house\.width \* scale;/);
  assert.match(source, /TOWN_HOUSE_GEOMETRY\[house\.id\]\?\.collision/);
  assert.match(source, /TOWN_SHOP_GEOMETRY\[shop\.title\]\?\.collision/);
  const before = structuredClone(TOWN_HOUSE_GEOMETRY["house-20"].collision);
  const oversizedReplacement = { width: 4096, height: 4096, transparentPadding: 512, origin: { x: 1, y: 1 } };
  oversizedReplacement.width = 8192;
  assert.deepEqual(TOWN_HOUSE_GEOMETRY["house-20"].collision, before);
  assert.notDeepEqual(TOWN_SHOP_GEOMETRY["Paws & Wonders"].interactionZone, TOWN_SHOP_GEOMETRY["Paws & Wonders"].collision);
});

test("shop interiors consume independent collision, interaction, standing and touch geometry", async () => {
  for (const file of ["VillageGrocerScene.js", "PawsWondersScene.js", "HarbourGeneralScene.js"]) {
    const source = await readFile(resolve(root, `src/scenes/${file}`), "utf8");
    assert.match(source, /_GEOMETRY\.collisions/);
    assert.match(source, /add\.zone\(touch\.x/);
    assert.match(source, /circleTouchesRect\(x, y, PLAYER_RADIUS, rect\)/);
  }
  for (const geometry of [VILLAGE_GROCER_GEOMETRY, PAWS_WONDERS_GEOMETRY, HARBOUR_GENERAL_GEOMETRY]) {
    assert.ok(geometry.collisions.length > 0);
    assert.ok(geometry.interactionZones.length > 0);
    assert.equal(geometry.interactionZones.length, geometry.touchTargets.length);
    assert.equal(geometry.interactionZones.length, geometry.standingPoints.filter((point) => !point.id.includes("checkout")).length);
  }
});

test("geometry debug overlay is development-gated and production scenes expose contracts", async () => {
  const [main, overlay] = await Promise.all([
    readFile(resolve(root, "src/main.js"), "utf8"),
    readFile(resolve(root, "src/visual/dev/GameplayGeometryDebugOverlay.js"), "utf8"),
  ]);
  assert.match(main, /const geometryQa = import\.meta\.env\.DEV && qaMode === "geometry"/);
  assert.match(main, /if \(geometryQa\) \{\s*import\("\.\/visual\/dev\/GameplayGeometryDebugOverlay\.js"\)/);
  for (const group of ["collisions", "navigationObstacles", "interactionZones", "touchTargets", "triggerRegions", "occlusionZones", "spawnPoints", "standingPoints"]) assert.match(overlay, new RegExp(group));
});

test("narrow-phone House Interior actions retain the 44 CSS-pixel touch contract", async () => {
  const css = await readFile(resolve(root, "src/style.css"), "utf8");
  assert.doesNotMatch(css, /home-interior-actions button[^}]*min-height:\s*40px/);
  assert.match(css, /home-interior-actions button[^}]*min-height:\s*44px/);
});

test("character hit targets are explicit containers and no production scene uses texture-sized physics bodies", async () => {
  const sceneNames = (await readdir(resolve(root, "src/scenes"))).filter((name) => name.endsWith(".js"));
  const [player, npc, animal, sceneSources] = await Promise.all([
    readFile(resolve(root, "src/entities/PlayerCharacter.js"), "utf8"),
    readFile(resolve(root, "src/entities/NpcCharacter.js"), "utf8"),
    readFile(resolve(root, "src/entities/AnimalCharacter.js"), "utf8"),
    Promise.all(sceneNames.map((name) => readFile(resolve(root, "src/scenes", name), "utf8"))),
  ]);
  assert.match(npc, /setSize\(42, 66\)\.setInteractive/);
  assert.match(animal, /setSize\(52, 54\)\.setInteractive/);
  assert.match(player, /super\(scene, x, y,/);
  assert.doesNotMatch(sceneSources.join("\n"), /physics\.(?:add|world)|\.setBody\s*\(|\.body\.(?:set|setSize|setCircle)\s*\(/);
});
