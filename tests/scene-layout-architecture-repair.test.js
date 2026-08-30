import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { FISHING_LAYOUT_INSTANCE_IDS, FISHING_SCENE_LAYOUT } from "../src/visual/layouts/fishingSceneLayout.js";
import { SceneLayoutRuntime } from "../src/visual/layouts/SceneLayoutRuntime.js";
import {
  PRODUCTION_SCENE_IDS,
  SCENE_LAYOUT_CATALOGUE,
  SCENE_LAYOUT_CATALOGUE_DIGEST,
  TOWN_DEPTH_POLICY_IDS,
  resolveTownSceneDepth,
} from "../src/visual/layouts/sceneLayoutCatalog.js";
import {
  offsetSceneLayoutInstance,
  resolveSceneLayoutInstance,
  sceneLayoutGeometryDigest,
  validateSceneLayout,
  validateSceneLayoutCatalogue,
} from "../src/visual/layouts/sceneLayoutContracts.js";

const root = resolve(import.meta.dirname, "..");
const geometryDigest = (layout) => sceneLayoutGeometryDigest({ zones: layout.zones, sockets: layout.sockets, collision: layout.collisionReferences, navigation: layout.navigationReferences, interaction: layout.interactionReferences });

function fakeObject({ x = 0, y = 0, depth = 0, textureWidth = 64, textureHeight = 64 } = {}) {
  return {
    x, y, depth, texture: { frame: { width: textureWidth, height: textureHeight } }, data: {}, destroyed: false,
    setPosition(nextX, nextY) { this.x = nextX; this.y = nextY; return this; },
    setOrigin(nextX, nextY) { this.origin = { x: nextX, y: nextY }; return this; },
    setScale(nextX, nextY = nextX) { this.scale = { x: nextX, y: nextY }; return this; },
    setRotation(value) { this.rotation = value; return this; }, setFlipX(value) { this.flipX = value; return this; }, setFlipY(value) { this.flipY = value; return this; },
    setDepth(value) { this.depth = value; return this; }, setVisible(value) { this.visible = value; return this; }, setAlpha(value) { this.alpha = value; return this; }, setTint(value) { this.tint = value; return this; },
    setData(key, value) { this.data[key] = value; return this; }, destroy() { this.destroyed = true; },
  };
}

test("catalogue provides one validated layout boundary for every production scene", () => {
  const result = validateSceneLayoutCatalogue(SCENE_LAYOUT_CATALOGUE, { requiredSceneIds: PRODUCTION_SCENE_IDS });
  assert.equal(result.ok, true, JSON.stringify(result.errors, null, 2));
  assert.equal(result.sceneIds.size, PRODUCTION_SCENE_IDS.length + 1);
  for (const sceneId of PRODUCTION_SCENE_IDS) assert.ok(result.sceneIds.has(sceneId), sceneId);
  assert.match(SCENE_LAYOUT_CATALOGUE_DIGEST, /^fnv1a32:[0-9a-f]{8}$/);
});

test("replacement sprites with different source canvases preserve logical placement and gameplay geometry", () => {
  const geometryBefore = geometryDigest(FISHING_SCENE_LAYOUT);
  const small = fakeObject({ textureWidth: 32, textureHeight: 32 });
  const large = fakeObject({ textureWidth: 1024, textureHeight: 1024 });
  new SceneLayoutRuntime({}, FISHING_SCENE_LAYOUT).register(FISHING_LAYOUT_INSTANCE_IDS.BACKGROUND, small);
  new SceneLayoutRuntime({}, FISHING_SCENE_LAYOUT).register(FISHING_LAYOUT_INSTANCE_IDS.BACKGROUND, large);
  assert.deepEqual({ x: small.x, y: small.y }, { x: 640, y: 360 });
  assert.deepEqual({ x: large.x, y: large.y }, { x: 640, y: 360 });
  assert.deepEqual(small.origin, large.origin);
  assert.equal(geometryDigest(FISHING_SCENE_LAYOUT), geometryBefore);
});

test("visual offsets move presentation only and cannot alter collision, navigation, or interaction geometry", () => {
  const before = geometryDigest(FISHING_SCENE_LAYOUT);
  const changed = offsetSceneLayoutInstance(FISHING_SCENE_LAYOUT, FISHING_LAYOUT_INSTANCE_IDS.BACKGROUND, { x: 16, y: -8 });
  assert.equal(changed.ok, true, JSON.stringify(changed.errors, null, 2));
  const instance = changed.layout.instances.find(({ id }) => id === FISHING_LAYOUT_INSTANCE_IDS.BACKGROUND);
  assert.deepEqual(instance.visual.position, { x: 640, y: 360 });
  assert.deepEqual(instance.visual.offset, { x: 16, y: -8 });
  assert.equal(geometryDigest(changed.layout), before);
  const object = fakeObject();
  new SceneLayoutRuntime({}, changed.layout).register(FISHING_LAYOUT_INSTANCE_IDS.BACKGROUND, object);
  assert.deepEqual({ x: object.x, y: object.y }, { x: 656, y: 352 });
});

test("invalid and duplicate references fail with actionable layout and scene diagnostics", () => {
  const invalid = structuredClone(FISHING_SCENE_LAYOUT);
  invalid.instances[0].prefabId = "prefab.does-not-exist";
  invalid.instances[1].id = invalid.instances[0].id;
  const result = validateSceneLayout(invalid);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some(({ code }) => code === "invalid-layout-prefab-reference"));
  assert.ok(result.errors.some(({ code }) => code === "duplicate-layout-id"));
  for (const finding of result.errors) {
    assert.equal(finding.layoutId, "layout.scene.fishing");
    assert.equal(finding.sceneId, "FishingScene");
    assert.ok(finding.path);
  }
});

test("locked gameplay geometry is immutable by value and layout objects are deeply frozen", () => {
  assert.equal(Object.isFrozen(FISHING_SCENE_LAYOUT.instances[0].visual.position), true);
  const invalid = structuredClone(FISHING_SCENE_LAYOUT);
  invalid.zones.find(({ id }) => id === "zone.fishing.water").geometry.x += 1;
  const result = validateSceneLayout(invalid);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some(({ code }) => code === "gameplay-geometry-digest-mismatch"));
});

test("runtime registration replaces a duplicate stable slot and restart begins clean", () => {
  const firstRuntime = new SceneLayoutRuntime({}, FISHING_SCENE_LAYOUT);
  const first = fakeObject(); const replacement = fakeObject();
  firstRuntime.register(FISHING_LAYOUT_INSTANCE_IDS.BACKGROUND, first, { slotId: "main" });
  firstRuntime.register(FISHING_LAYOUT_INSTANCE_IDS.BACKGROUND, replacement, { slotId: "main" });
  assert.equal(first.destroyed, true);
  assert.equal(firstRuntime.registeredCount(FISHING_LAYOUT_INSTANCE_IDS.BACKGROUND), 1);
  firstRuntime.shutdown();
  const restarted = new SceneLayoutRuntime({}, FISHING_SCENE_LAYOUT);
  restarted.register(FISHING_LAYOUT_INSTANCE_IDS.BACKGROUND, fakeObject(), { slotId: "main" });
  assert.equal(restarted.registeredCount(FISHING_LAYOUT_INSTANCE_IDS.BACKGROUND), 1);
});

test("moving player and NPC depth is deterministic and ordered by ground contact", () => {
  const playerNear = resolveTownSceneDepth(TOWN_DEPTH_POLICY_IDS.PLAYER, 100);
  const playerFar = resolveTownSceneDepth(TOWN_DEPTH_POLICY_IDS.PLAYER, 300);
  const npcNear = resolveTownSceneDepth(TOWN_DEPTH_POLICY_IDS.NPC, 100);
  const npcFar = resolveTownSceneDepth(TOWN_DEPTH_POLICY_IDS.NPC, 300);
  assert.ok(playerNear < playerFar);
  assert.ok(npcNear < npcFar);
  assert.equal(playerFar - playerNear, 20);
  assert.equal(npcFar - npcNear, 20);
});

test("layout variants and visual states resolve deterministically without mutating their source", () => {
  const definition = structuredClone(FISHING_SCENE_LAYOUT);
  const background = definition.instances.find(({ id }) => id === FISHING_LAYOUT_INSTANCE_IDS.BACKGROUND);
  background.variants = [{ id: "reedbank", visualOverrides: { tint: 0xffffff } }, { id: "harbour", visualOverrides: { tint: 0xaabbcc } }];
  background.states = [{ id: "clean", visualOverrides: { alpha: 1 } }, { id: "dirty", visualOverrides: { alpha: 0.6 } }];
  background.state = "clean";
  const validation = validateSceneLayout(definition);
  assert.equal(validation.ok, true, JSON.stringify(validation.errors, null, 2));
  const outputs = Array.from({ length: 5 }, () => resolveSceneLayoutInstance(definition, background.id, { variant: "harbour", state: "dirty" }));
  assert.ok(outputs.every((value) => JSON.stringify(value) === JSON.stringify(outputs[0])));
  assert.equal(outputs[0].visual.tint, 0xaabbcc);
  assert.equal(outputs[0].visual.alpha, 0.6);
  assert.equal(background.visual.tint, undefined);
});

test("normal verification proves development and production consume the same catalogue", async () => {
  const [main, packageJson, verifier] = await Promise.all([
    readFile(resolve(root, "src/main.js"), "utf8"),
    readFile(resolve(root, "package.json"), "utf8"),
    readFile(resolve(root, "scripts/verify-production-scene-layouts.mjs"), "utf8"),
  ]);
  assert.match(main, /SCENE_LAYOUT_CATALOGUE_DIGEST/);
  assert.match(packageJson, /verify-production-scene-layouts\.mjs/);
  assert.match(verifier, /SCENE_LAYOUT_CATALOGUE/);
  assert.match(verifier, /dist\/assets/);
});
