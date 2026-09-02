import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import sharp from "sharp";

import { ApprovedSceneVisualRuntime } from "../src/visual/renderers/ApprovedSceneVisualRuntime.js";
import { PhaserPrefabRenderer } from "../src/visual/renderers/PhaserPrefabRenderer.js";
import { VISUAL_ASSET_KINDS } from "../src/visual/contracts.js";
import { APPROVED_WORLD_LAWN_REPEAT_MODE, createTownApprovedSceneBindings } from "../src/presentation/TownApprovedSceneBindings.js";
import { LAWN_PLOTS } from "../src/data/farming.js";
import { HOUSES, ROADS, TOWN_REFERENCE_LAYOUT, WORLD } from "../src/data/town.js";
import { PHASE_8A_ASSET_IDS, PHASE_8A_VERTICAL_SLICE_PACKAGE } from "../src/visual/verticalSlice/phase8aVerticalSlicePackage.js";

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

function harness({ textureKey = "approved.v1", assetKind = VISUAL_ASSET_KINDS.IMAGE, binding = { mode: "static" }, placementResolver } = {}) {
  const objects = [], shutdown = [];
  const asset = { id: "prop.test", kind: assetKind, runtime: { textureKey }, technical: { width: 64, height: 64, nativePixelsPerLogicalUnit: 1 } };
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

  const mounted = harness({ assetKind: VISUAL_ASSET_KINDS.SPRITESHEET, binding: { mode: "repeat" }, placementResolver: () => [northRoad] });
  assert.equal(mounted.objects.length, 1);
  assert.equal(mounted.objects[0].frame, 0);
  assert.deepEqual(mounted.objects[0].tileArea, { width: 298, height: 92 });
  assert.equal(mounted.objects[0].rotation, 0);
  mounted.shutdown[0]();
  assert.equal(mounted.objects[0].destroyed, true);
});

test("approved road artwork is confined to authored road strokes and never covers the map", () => {
  const bindings = createTownApprovedSceneBindings({});
  const worldOrigin = { x: 1880, y: 0 };
  const placements = bindings.placementResolver(
    { id: "instance.phase-8a.town.terrain.road", position: { x: 640, y: 548 }, worldOrigin },
    { mode: "repeat", repeat: "road-surface-autotile" },
  );
  const expectedSegments = ROADS.reduce((count, road) => count + road.points.length - 1, 0);
  assert.equal(placements.length, expectedSegments);
  assert.ok(placements.every((placement) => placement.depth === 10.25));
  assert.ok(
    placements.every((placement) => placement.frame === 0),
    "all road pieces must share one asphalt colour",
  );
  assert.ok(placements.every((placement) => placement.tileArea.width < WORLD.width && placement.tileArea.height <= 76));
  assert.ok(placements.every((placement) => ROADS.some((road) => placement.id.startsWith(`${road.id}:road-`))));
  assert.equal(placements.some((placement) => placement.id.startsWith("commons-")), false, "paths must remain independent from road artwork");

  const northSegment = placements.find((placement) => placement.id === "north-road:road-segment-1");
  assert.deepEqual(northSegment.position, { x: 325 - worldOrigin.x, y: 530 });
  assert.deepEqual(northSegment.tileArea, { width: 314, height: 76 });
  assert.equal(northSegment.rotation, 0);

  assert.equal(placements.some((placement) => placement.id.includes(":road-node-")), false, "junction overlays must not darken the shared asphalt surface");
});

test("approved lawn art clips to each authored yard and resolves all growth thresholds", () => {
  const target = LAWN_PLOTS.find(({ id }) => id === "lawn-house-6");
  const lawns = { [target.id]: { grassHeight: 5, weedPressure: 0 } };
  const bindings = createTownApprovedSceneBindings({ gameState: { getSnapshot: () => ({ farming: { lawns } }) } });
  const binding = {
    mode: "repeat",
    repeat: APPROVED_WORLD_LAWN_REPEAT_MODE,
    protectedWorldObjectId: target.id,
    protectedWorldYard: target.yard,
    visualLayerRole: "growth",
  };
  const instance = {
    id: `instance.test.${target.id}.growth`,
    prefabId: "prefab.test.lawn-growth",
    position: { x: target.yard.x, y: target.yard.y },
    worldOrigin: { x: 0, y: 0 },
    binding,
  };
  const [placement] = bindings.placementResolver(instance, binding);
  assert.deepEqual(placement.position, {
    x: target.yard.x + target.yard.width / 2,
    y: target.yard.y + target.yard.height / 2,
  });
  assert.deepEqual(placement.tileArea, { width: target.yard.width, height: target.yard.height });
  assert.equal(placement.depth, 19);
  assert.equal(bindings.stateResolver(instance, placement), "fresh-cut");
  lawns[target.id].grassHeight = 20;
  assert.equal(bindings.stateResolver(instance, placement), "growing");
  lawns[target.id].grassHeight = 45;
  assert.equal(bindings.stateResolver(instance, placement), "long");
  lawns[target.id].grassHeight = 70;
  assert.equal(bindings.stateResolver(instance, placement), "job-ready");
});

test("approved lawn repeat binding rejects a missing protected yard", () => {
  const bindings = createTownApprovedSceneBindings({});
  assert.throws(
    () => bindings.placementResolver(
      { id: "instance.test.lawn", position: { x: 0, y: 0 }, worldOrigin: { x: 0, y: 0 } },
      { mode: "repeat", repeat: APPROVED_WORLD_LAWN_REPEAT_MODE, protectedWorldObjectId: "missing" },
    ),
    /requires a valid protectedWorldYard/,
  );
});

test("a layered visual state changes the overlay frame without frame-switching its static base", () => {
  const created = [];
  const scene = {
    add: {
      tileSprite(_x, _y, width, height, key, frame) {
        const object = displayObject(key, frame);
        object.tileArea = { width, height };
        created.push(object);
        return object;
      },
    },
  };
  const base = { id: "terrain.test.base", kind: VISUAL_ASSET_KINDS.IMAGE, runtime: { textureKey: "base" }, technical: { width: 64, height: 64, nativePixelsPerLogicalUnit: 1 } };
  const overlay = { id: "terrain.test.overlay", kind: VISUAL_ASSET_KINDS.SPRITESHEET, runtime: { textureKey: "overlay" }, technical: { width: 256, height: 64, frameWidth: 64, frameHeight: 64, nativePixelsPerLogicalUnit: 1 } };
  const prefab = {
    id: "prefab.test.layered-lawn",
    layers: [
      { id: "background-base", assetId: base.id, role: "background" },
      { id: "growth-overlay", assetId: overlay.id, role: "main" },
    ],
    origin: { x: 0.5, y: 0.5 }, groundContactAnchor: { x: 0, y: 0 },
    scalePolicy: { mode: "fixed-logical-footprint", x: 1, y: 1 },
    depthPolicy: { base: 19 }, geometry: { visual: { kind: "rectangle", x: 0, y: 0, width: 64, height: 64 } },
  };
  const registry = { getPrefab: () => prefab, getAsset: (id) => id === base.id ? base : overlay, getVisualState: () => null };
  const renderer = new PhaserPrefabRenderer(scene, registry);
  const resolved = renderer.resolve(prefab.id);
  renderer.createDisplayLayer(resolved, resolved.layers[0], { frame: 3, tileArea: { width: 310, height: 340 } });
  renderer.createDisplayLayer(resolved, resolved.layers[1], { frame: 3, tileArea: { width: 310, height: 340 } });
  assert.equal(created[0].frame, null);
  assert.equal(created[1].frame, 3);
  assert.deepEqual(created.map(({ tileArea }) => tileArea), [{ width: 310, height: 340 }, { width: 310, height: 340 }]);
});

test("approved lawn runtime bytes keep an opaque 256px base and progressively denser transparent overlays", async () => {
  const base = PHASE_8A_VERTICAL_SLICE_PACKAGE.assets.find(({ semanticId }) => semanticId === PHASE_8A_ASSET_IDS.LAWN_BASE);
  const overlay = PHASE_8A_VERTICAL_SLICE_PACKAGE.assets.find(({ semanticId }) => semanticId === PHASE_8A_ASSET_IDS.LAWN);
  const baseBytes = await readFile(new URL(`../${base.expectedFilenames.runtime}`, import.meta.url));
  const overlayBytes = await readFile(new URL(`../${overlay.expectedFilenames.runtime}`, import.meta.url));
  const baseMetadata = await sharp(baseBytes).metadata();
  assert.deepEqual({ width: baseMetadata.width, height: baseMetadata.height, hasAlpha: baseMetadata.hasAlpha }, { width: 256, height: 256, hasAlpha: false });

  const { data, info } = await sharp(overlayBytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  assert.deepEqual({ width: info.width, height: info.height, channels: info.channels }, { width: 1024, height: 256, channels: 4 });
  const alphaTotals = [0, 1, 2, 3].map((frame) => {
    let total = 0;
    for (let y = 0; y < 256; y += 1) for (let x = frame * 256; x < (frame + 1) * 256; x += 1) total += data[(y * info.width + x) * 4 + 3];
    return total;
  });
  assert.equal(alphaTotals[0], 0, "fresh-cut overlay must expose only the striped base");
  assert.ok(alphaTotals[1] > 0);
  assert.ok(alphaTotals[2] > alphaTotals[1]);
  assert.ok(alphaTotals[3] > alphaTotals[2]);
});

test("normal Town and Lawn scenes install the production bootstrap without slice-specific IDs", async () => {
  for (const file of ["src/scenes/TownScene.js", "src/scenes/LawnCareScene.js"]) {
    const source = await readFile(new URL(`../${file}`, import.meta.url), "utf8");
    assert.match(source, /preloadApprovedSceneVisuals\(this\)/);
    assert.match(source, /mountApprovedSceneVisuals\(this/);
    assert.doesNotMatch(source, /terrain\.town\.slice|phase-8a|PHASE_8A/);
  }
});
