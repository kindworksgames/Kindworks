import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { ApprovedSceneVisualRuntime } from "../src/visual/renderers/ApprovedSceneVisualRuntime.js";
import { VISUAL_ASSET_KINDS } from "../src/visual/contracts.js";
import { createTownApprovedSceneBindings } from "../src/presentation/TownApprovedSceneBindings.js";
import { HOUSES, TOWN_REFERENCE_LAYOUT, WORLD } from "../src/data/town.js";

function displayObject(key, frame = null) {
  const data = new Map();
  return {
    key, frame, x: 0, y: 0, visible: true, destroyed: false,
    setOrigin() { return this; }, setDisplaySize(width, height) { this.display = { width, height }; return this; },
    setPosition(x, y) { this.x = x; this.y = y; return this; }, setDepth(value) { this.depth = value; return this; },
    setVisible(value) { this.visible = value; return this; }, disableInteractive() { this.interactive = false; return this; },
    setRotation(value) { this.rotation = value; return this; },
    setData(value, next) { if (typeof value === "string") data.set(value, next); else for (const [name, item] of Object.entries(value)) data.set(name, item); return this; },
    getData(name) { return data.get(name); }, setFrame(value) { this.frame = value; return this; },
    destroy() { this.destroyed = true; }, play(keyValue) { this.animation = keyValue; return this; },
    anims: { currentAnim: null },
  };
}

function harness({ textureKey = "approved.v1", binding = { mode: "static" }, placementResolver } = {}) {
  const objects = [], shutdown = [];
  const asset = { id: "prop.test", kind: VISUAL_ASSET_KINDS.IMAGE, runtime: { textureKey }, technical: { width: 64, height: 64, nativePixelsPerLogicalUnit: 1 } };
  const prefab = { id: "prefab.test", layers: [{ id: "main", assetId: asset.id, role: "main" }], origin: { x: 0.5, y: 1 }, groundContactAnchor: { x: 0, y: 0 }, scalePolicy: { mode: "fixed-logical-footprint", x: 1, y: 1 }, depthPolicy: { base: 100, divisor: 10 }, geometry: { visual: { kind: "rectangle", x: -32, y: -64, width: 64, height: 64 }, collision: { kind: "circle", radius: 10 } } };
  const state = { id: "state.test", defaultState: "normal", states: { normal: { prefabId: prefab.id, modifier: { frame: 0 } } } };
  const instance = { id: "instance.test", sceneId: "TownScene", prefabId: prefab.id, stateId: state.id, position: { x: 20, y: 30 }, worldOrigin: { x: 100, y: 200 }, visualOffset: { x: 2, y: -3 }, binding, activation: "phase-8b-approved", gameplayGeometryLocked: true };
  const failures = [];
  const registry = {
    getSceneInstancesByScene: () => [instance], createSceneAnimations() {}, getVisualState: () => state,
    getPrefab: () => prefab, getAsset: () => asset, getAnimationsByAsset: () => [],
    tagSceneInstance(object) { object.setData("visualInstanceId", instance.id); },
    recordFailure(code, message, context) { failures.push({ code, message, context }); },
  };
  const scene = {
    scene: { key: "TownScene" }, registry: { get: () => registry },
    add: {
      image(_x, _y, key) { const object = displayObject(key); objects.push(object); return object; },
      sprite(_x, _y, key, frame) { const object = displayObject(key, frame); objects.push(object); return object; },
      tileSprite(_x, _y, width, height, key, frame) { const object = displayObject(key, frame); object.tileArea = { width, height }; objects.push(object); return object; },
    },
    events: { once(name, callback) { if (name === "shutdown") shutdown.push(callback); } },
  };
  const runtime = new ApprovedSceneVisualRuntime(scene, { registry, bindings: { placementResolver } }).mount();
  return { runtime, objects, failures, shutdown, prefab };
}

test("ordinary approved instance mounts from semantic manifest data and cleans up", () => {
  const { runtime, objects, shutdown } = harness();
  assert.equal(objects.length, 1);
  assert.equal(objects[0].key, "approved.v1");
  assert.deepEqual({ x: objects[0].x, y: objects[0].y }, { x: 122, y: 227 });
  assert.equal(objects[0].getData("gameplayGeometryLocked"), true);
  shutdown[0]();
  assert.equal(objects[0].destroyed, true);
  assert.equal(runtime.records.size, 0);
});

test("manifest-only texture replacement changes rendered artwork without changing geometry", () => {
  const first = harness({ textureKey: "approved.v1" });
  const second = harness({ textureKey: "approved.v2" });
  assert.equal(first.objects[0].key, "approved.v1");
  assert.equal(second.objects[0].key, "approved.v2");
  assert.deepEqual(first.prefab.geometry, second.prefab.geometry);
  assert.deepEqual({ x: first.objects[0].x, y: first.objects[0].y }, { x: second.objects[0].x, y: second.objects[0].y });
});

test("dynamic bindings refresh presentation without writing gameplay geometry", () => {
  let x = 5;
  const { runtime, objects, prefab } = harness({ binding: { mode: "dynamic" }, placementResolver: () => ({ position: { x, y: 8 }, visible: true }) });
  const geometryBefore = structuredClone(prefab.geometry);
  x = 55;
  runtime.refresh();
  assert.equal(objects[0].x, 157);
  assert.deepEqual(prefab.geometry, geometryBefore);
});

test("unbound non-static instances fail visibly rather than disappearing silently", () => {
  const { objects, failures } = harness({ binding: { mode: "repeat" } });
  assert.equal(objects.length, 0);
  assert.equal(failures[0]?.code, "scene-instance-binding-required");
});

test("approved town grass uses one world-sized terrain tile below roads and rivers", () => {
  const bindings = createTownApprovedSceneBindings({});
  const worldOrigin = { x: 1880, y: 0 };
  const [placement] = bindings.placementResolver(
    { id: "instance.test.grass", position: { x: 0, y: 0 }, worldOrigin },
    { mode: "repeat", repeat: "cover-town-ground" },
  );
  assert.deepEqual(placement.position, { x: -1880, y: 0 });
  assert.deepEqual(placement.tileArea, { width: WORLD.width, height: WORLD.height });
  assert.equal(placement.depth, 0);
  assert.deepEqual({ x: worldOrigin.x + placement.position.x, y: worldOrigin.y + placement.position.y }, { x: 0, y: 0 });

  const { objects } = harness({
    binding: { mode: "repeat" },
    placementResolver: () => placement,
  });
  assert.equal(objects.length, 1);
  assert.deepEqual(objects[0].tileArea, { width: WORLD.width, height: WORLD.height });
  assert.equal(objects[0].depth, 0);
  assert.equal(objects[0].getData("semanticTileArea").width, WORLD.width);
});

test("approved pavement replaces every authored road verge and footpath without changing their geometry", () => {
  const bindings = createTownApprovedSceneBindings({});
  const worldOrigin = { x: 1880, y: 0 };
  const placements = bindings.placementResolver(
    { id: "instance.phase-8a.town.terrain.pavement", position: { x: 640, y: 493 }, worldOrigin },
    { mode: "repeat", repeat: "surface-autotile" },
  );
  assert.ok(placements.length > 50);
  assert.ok(placements.every((placement) => placement.tileArea.width < WORLD.width && placement.tileArea.height < WORLD.height));
  const routePlacements = placements.filter((placement) => /:segment-\d+$/.test(placement.id));
  assert.ok(routePlacements.every((placement) => placement.depth === 9 && placement.frame === 0));
  assert.equal(placements.some((placement) => /:join-\d+$/.test(placement.id)), false, "square route joins must not return");
  const northRoad = placements.find((placement) => placement.id === "north-road:segment-1");
  assert.deepEqual(northRoad.position, { x: 325 - worldOrigin.x, y: 530 });
  assert.deepEqual(northRoad.tileArea, { width: 298, height: 92 });
  assert.equal(northRoad.rotation, 0);
  assert.deepEqual({ x: worldOrigin.x + northRoad.position.x, y: worldOrigin.y + northRoad.position.y }, { x: 325, y: 530 });

  const houseWalks = placements.filter((placement) => placement.id.includes(":front-walk:"));
  assert.equal(houseWalks.length, HOUSES.length);
  assert.ok(houseWalks.every((placement) => placement.depth === 22 && placement.tileArea.width === TOWN_REFERENCE_LAYOUT.pavement.houseWalkWidth));
  const firstHouseWalk = houseWalks.find((placement) => placement.id === "house-1:front-walk:centre");
  assert.deepEqual(firstHouseWalk.tileArea, { width: 34, height: 132 });
  assert.deepEqual({ x: worldOrigin.x + firstHouseWalk.position.x, y: firstHouseWalk.position.y }, { x: 305.5, y: 426 });
  const lowerHouseWalk = houseWalks.find((placement) => placement.id === "house-7:front-walk:centre");
  assert.deepEqual(lowerHouseWalk.tileArea, { width: 34, height: 97 });
  assert.deepEqual({ x: worldOrigin.x + lowerHouseWalk.position.x, y: lowerHouseWalk.position.y }, { x: 305.5, y: 1631.5 });

  const commercial = placements.filter((placement) => TOWN_REFERENCE_LAYOUT.pavement.commercialAreas.some((area) => placement.id.startsWith(`${area.id}:`)));
  const expectedCommercialPlacements = TOWN_REFERENCE_LAYOUT.pavement.commercialAreas
    .reduce((count, area) => count + (area.transition === "none" ? 1 : 9), 0);
  assert.equal(commercial.length, expectedCommercialPlacements);
  assert.deepEqual([...new Set(commercial.map((placement) => placement.frame))].sort((a, b) => a - b), [0, 1, 2, 3, 4, 5, 6, 7, 8]);
  assert.ok(commercial.every((placement) => placement.depth === 8));
  const shoreCafe = commercial.filter((placement) => placement.id.startsWith("south-shore-cafe-forecourt:"));
  assert.equal(shoreCafe.length, 1);
  assert.equal(shoreCafe[0].frame, 0, "the beach café must not bake a grass transition into its paved pad");

  const mounted = harness({ binding: { mode: "repeat" }, placementResolver: () => [northRoad] });
  assert.equal(mounted.objects.length, 1);
  assert.equal(mounted.objects[0].frame, 0);
  assert.deepEqual(mounted.objects[0].tileArea, { width: 298, height: 92 });
  assert.equal(mounted.objects[0].rotation, 0);
  mounted.shutdown[0]();
  assert.equal(mounted.objects[0].destroyed, true);
});

test("normal Town and Lawn scenes install the production bootstrap without slice-specific IDs", async () => {
  for (const file of ["src/scenes/TownScene.js", "src/scenes/LawnCareScene.js"]) {
    const source = await readFile(new URL(`../${file}`, import.meta.url), "utf8");
    assert.match(source, /preloadApprovedSceneVisuals\(this\)/);
    assert.match(source, /mountApprovedSceneVisuals\(this/);
    assert.doesNotMatch(source, /terrain\.town\.slice|phase-8a|PHASE_8A/);
  }
});
