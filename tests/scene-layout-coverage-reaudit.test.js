import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { FISHING_LAYOUT_INSTANCE_IDS, FISHING_SCENE_LAYOUT } from "../src/visual/layouts/fishingSceneLayout.js";
import { PRODUCTION_SCENE_IDS, SCENE_LAYOUT_CATALOGUE } from "../src/visual/layouts/sceneLayoutCatalog.js";
import { SceneLayoutRuntime } from "../src/visual/layouts/SceneLayoutRuntime.js";
import { createSceneLayout, sceneLayoutGeometryDigest } from "../src/visual/layouts/sceneLayoutContracts.js";
import { KINDWORKS_VISUAL_MANIFEST, VISUAL_ASSET_IDS } from "../src/visual/visualManifest.js";
import { validateVisualManifestFiles } from "../src/visual/validateVisualManifest.js";

const root = resolve(import.meta.dirname, "..");

function fakeDisplay({ width, height, authoredOrigin, opaqueBounds }) {
  return {
    x: -1, y: -1,
    sourceCanvas: { width, height }, authoredOrigin, opaqueBounds,
    body: { x: 101, y: 202, width: 33, height: 44 },
    navigation: { x: 7, y: 8, radius: 9 },
    interaction: { x: 11, y: 12, radius: 13 },
    setPosition(x, y) { this.x = x; this.y = y; return this; },
    setOrigin(x, y) { this.origin = { x, y }; return this; },
    setScale(x, y = x) { this.scale = { x, y }; return this; },
    setRotation(value) { this.rotation = value; return this; },
    setFlipX(value) { this.flipX = value; return this; },
    setFlipY(value) { this.flipY = value; return this; },
    setDepth(value) { this.depth = value; return this; },
    setVisible(value) { this.visible = value; return this; },
    setAlpha(value) { this.alpha = value; return this; },
    setTint(value) { this.tint = value; return this; },
    setData() { return this; },
  };
}

const protectedGeometry = (layout) => sceneLayoutGeometryDigest({
  zones: layout.zones,
  collision: layout.collisionReferences,
  navigation: layout.navigationReferences,
  interaction: layout.interactionReferences,
});

test("catalogue-name coverage is not mistaken for object-level placement coverage", async () => {
  const byScene = new Map(SCENE_LAYOUT_CATALOGUE.map((layout) => [layout.sceneId, layout]));
  assert.ok(PRODUCTION_SCENE_IDS.every((sceneId) => byScene.has(sceneId)));
  const important = PRODUCTION_SCENE_IDS.filter((sceneId) => sceneId !== "BootScene");
  const objectLevel = important.filter((sceneId) => byScene.get(sceneId).instances.length > 0);
  assert.deepEqual(objectLevel, ["FishingScene"]);

  const consumers = [];
  for (const sceneId of important) {
    const fileName = sceneId.replace("VillageGrocerScene", "VillageGrocerScene");
    const source = await readFile(resolve(root, `src/scenes/${fileName}.js`), "utf8");
    if (/sceneLayouts\?*\.register|registerLayoutVisual/.test(source)) consumers.push(sceneId);
  }
  assert.deepEqual(consumers, ["FishingScene"]);
});

test("different dimensions and authored origins cannot move protected gameplay geometry", () => {
  const before = protectedGeometry(FISHING_SCENE_LAYOUT);
  const fixtures = [
    fakeDisplay({ width: 32, height: 32, authoredOrigin: { x: 0, y: 0 }, opaqueBounds: { x: 0, y: 0, width: 32, height: 32 } }),
    fakeDisplay({ width: 512, height: 256, authoredOrigin: { x: 0.25, y: 0.75 }, opaqueBounds: { x: 0, y: 0, width: 512, height: 256 } }),
    fakeDisplay({ width: 128, height: 128, authoredOrigin: { x: 1, y: 1 }, opaqueBounds: { x: 24, y: 8, width: 88, height: 104 } }),
  ];
  const geometryBefore = fixtures.map(({ body, navigation, interaction }) => structuredClone({ body, navigation, interaction }));
  for (const fixture of fixtures) new SceneLayoutRuntime({}, FISHING_SCENE_LAYOUT).register(FISHING_LAYOUT_INSTANCE_IDS.BACKGROUND, fixture);
  for (const [index, fixture] of fixtures.entries()) {
    assert.deepEqual({ x: fixture.x, y: fixture.y }, { x: 640, y: 360 });
    assert.deepEqual(fixture.origin, { x: 0.5, y: 0.5 });
    assert.deepEqual({ body: fixture.body, navigation: fixture.navigation, interaction: fixture.interaction }, geometryBefore[index]);
  }
  assert.equal(protectedGeometry(FISHING_SCENE_LAYOUT), before);
});

test("a valid origin layout change remains presentation-only", () => {
  const changed = structuredClone(FISHING_SCENE_LAYOUT);
  const background = changed.instances.find(({ id }) => id === FISHING_LAYOUT_INSTANCE_IDS.BACKGROUND);
  background.visual.origin = { x: 0.25, y: 0.75 };
  const layout = createSceneLayout(changed);
  const object = fakeDisplay({ width: 1280, height: 720, authoredOrigin: { x: 0.5, y: 0.5 }, opaqueBounds: { x: 0, y: 0, width: 1280, height: 720 } });
  const geometry = structuredClone({ body: object.body, navigation: object.navigation, interaction: object.interaction });
  new SceneLayoutRuntime({}, layout).register(FISHING_LAYOUT_INSTANCE_IDS.BACKGROUND, object);
  assert.deepEqual(object.origin, { x: 0.25, y: 0.75 });
  assert.deepEqual({ body: object.body, navigation: object.navigation, interaction: object.interaction }, geometry);
  assert.equal(protectedGeometry(layout), protectedGeometry(FISHING_SCENE_LAYOUT));
});

test("dimension-changing replacement is rejected unless its manifest contract is updated", async () => {
  const manifest = structuredClone(KINDWORKS_VISUAL_MANIFEST);
  const id = VISUAL_ASSET_IDS.FISHING_REEDBANK_BACKGROUND;
  const asset = manifest.assets.find((entry) => entry.id === id);
  const result = await validateVisualManifestFiles(manifest, async (path) => path === asset.source.file ? {
    exists: true,
    exactCase: true,
    format: asset.source.format,
    width: asset.technical.width + 64,
    height: asset.technical.height + 32,
    alpha: asset.technical.alpha,
    bytes: 100,
    sha256: asset.cache.contentSha256,
  } : true);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((entry) => entry.code === "dimension-mismatch" && entry.assetId === id));
});

