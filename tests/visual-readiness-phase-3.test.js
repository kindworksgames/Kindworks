import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { createVisualRegressionFixtureState } from "../src/qa/visualRegressionFixtures.js";
import { VisualRegistry } from "../src/visual/VisualRegistry.js";
import { VISUAL_ASSET_KINDS } from "../src/visual/contracts.js";
import {
  TOWN_BIN_ASSET_IDS,
  TOWN_BIN_ITEM_VARIANTS,
  TOWN_BIN_PREFAB_IDS,
  TOWN_BIN_STATE_IDS,
} from "../src/visual/prefabs/townBinPrefabs.js";
import { KINDWORKS_VISUAL_MANIFEST } from "../src/visual/visualManifest.js";
import { TownBinVisualFactory, resolveTownBinVisualContract } from "../src/visual/renderers/TownBinVisualFactory.js";
import { validateVisualManifestFiles, validateVisualManifestStructure } from "../src/visual/validateVisualManifest.js";

const root = resolve(import.meta.dirname, "..");
const digest = (value) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const fileExists = async (file) => {
  try { await access(resolve(root, "public", file.replace(/^\//, ""))); return true; }
  catch { return false; }
};

class FakeDisplayObject {
  constructor(kind, args = []) { this.kind = kind; this.args = args; this.children = []; this.data = {}; this.commands = []; }
  add(value) { this.children.push(...(Array.isArray(value) ? value : [value])); return this; }
  addAt(value, index) { this.children.splice(index, 0, value); return this; }
  setAlpha(value) { this.alpha = value; return this; }
  setDepth(value) { this.depth = value; return this; }
  setDisplaySize(width, height) { this.displaySize = { width, height }; return this; }
  setInteractive() { this.interactive = true; this.input = {}; return this; }
  setOrigin(x, y = x) { this.origin = { x, y }; return this; }
  setPosition(x, y) { this.x = x; this.y = y; return this; }
  setRotation(value) { this.rotation = value; return this; }
  setSize(width, height) { this.size = { width, height }; return this; }
  setStrokeStyle(...args) { this.strokeStyle = args; return this; }
  setVisible(value) { this.visible = value; return this; }
  setData(key, value) { this.data[key] = value; return this; }
  on(event, callback) { this.listener = { event, callback }; return this; }
  fillStyle(...args) { this.commands.push(["fillStyle", ...args]); return this; }
  fillEllipse(...args) { this.commands.push(["fillEllipse", ...args]); return this; }
  fillRoundedRect(...args) { this.commands.push(["fillRoundedRect", ...args]); return this; }
  fillCircle(...args) { this.commands.push(["fillCircle", ...args]); return this; }
  lineStyle(...args) { this.commands.push(["lineStyle", ...args]); return this; }
  strokeCircle(...args) { this.commands.push(["strokeCircle", ...args]); return this; }
}

function fakeScene(registry = new VisualRegistry()) {
  const made = [];
  const create = (kind, ...args) => { const object = new FakeDisplayObject(kind, args); made.push(object); return object; };
  return {
    made,
    registry: { get: (key) => key === "visualRegistry" ? registry : null },
    add: {
      container: (...args) => create("container", ...args),
      graphics: (...args) => create("graphics", ...args),
      ellipse: (...args) => create("ellipse", ...args),
      rectangle: (...args) => create("rectangle", ...args),
      text: (...args) => create("text", ...args),
      image: (...args) => create("image", ...args),
    },
  };
}

test("town bins expose complete family-specific visual contracts", () => {
  const registry = new VisualRegistry();
  assert.equal(Object.keys(TOWN_BIN_ITEM_VARIANTS).length, 5);
  for (const [key, prefabId] of Object.entries(TOWN_BIN_PREFAB_IDS)) {
    const prefab = registry.getPrefab(prefabId);
    const stateMap = registry.getVisualState(TOWN_BIN_STATE_IDS[key]);
    assert.equal(prefab.family, "town-bin");
    assert.ok(prefab.variant);
    assert.deepEqual(prefab.scalePolicy, { mode: "fixed", x: 1, y: 1, imageFit: "contain-within-visual-bounds" });
    assert.deepEqual(prefab.origin, { x: 0.5, y: 1 });
    assert.ok(prefab.groundContactAnchor);
    assert.ok(prefab.depthPolicy);
    assert.equal(prefab.shadowPolicy.mode, "custom-authored-shadow");
    assert.ok(prefab.shadowPolicy.enabled);
    assert.equal(prefab.animation, null);
    assert.ok(prefab.geometry.visual);
    assert.ok(prefab.geometry.interaction);
    assert.ok(prefab.geometry.touch);
    assert.ok(prefab.sockets.collectorGrip);
    assert.ok(prefab.layers.some((layer) => layer.role === "background"));
    assert.ok(prefab.layers.some((layer) => layer.role === "main"));
    assert.ok(prefab.layers.some((layer) => layer.role === "foreground"));
    assert.deepEqual(Object.keys(stateMap.states), ["normal", "full", "tipped", "carried"]);
  }
});

test("placed-bin factory preserves exact transforms, hit area and baseline draw commands", () => {
  const scene = fakeScene();
  const factory = new TownBinVisualFactory(scene);
  let selected = null;
  const object = { id: "placed-bin-1", itemId: "recycling-bin", x: 123.25, y: 105.75, rotation: Math.PI / 2 };
  const bin = factory.createPlacedObject(object, { onSelect: (id) => { selected = id; } });
  assert.deepEqual([bin.args[0], bin.args[1]], [123.25, 105.75]);
  assert.equal(bin.rotation, Math.PI / 2);
  assert.equal(bin.depth, 200 + (105.75 + 23) / 10);
  assert.deepEqual(bin.size, { width: 56, height: 56 });
  assert.equal(bin.data.placedObjectId, "placed-bin-1");
  assert.equal(bin.data.itemId, "recycling-bin");
  assert.equal(bin.data.footprint, 28);
  assert.equal(bin.data.visualPrefabId, TOWN_BIN_PREFAB_IDS.RECYCLING);
  assert.equal(bin.data.semanticAssetId, TOWN_BIN_ASSET_IDS.RECYCLING);
  assert.equal(bin.interactive, true);
  bin.listener.callback({ event: { stopPropagation() {} } });
  assert.equal(selected, "placed-bin-1");
  assert.deepEqual(bin.children[0].commands, [
    ["fillStyle", 0x294637, 0.2], ["fillEllipse", -20.5, 17, 41, 14],
    ["fillStyle", 0x273a31, 1], ["fillRoundedRect", -17.5, -23, 35, 9, 3],
    ["fillStyle", 0x428667, 1], ["fillRoundedRect", -14.5, -16, 29, 39, 5],
    ["lineStyle", 3, 0xf5f1dc, 1], ["strokeCircle", 0, 1, 8],
  ]);
});

test("preview, public status states and municipal carried bin retain baseline presentation", () => {
  const scene = fakeScene();
  const factory = new TownBinVisualFactory(scene);
  const preview = factory.createPlacedObject({ id: null, itemId: "commercial-bin", x: 100, y: 200, rotation: 0 }, { preview: true, valid: false });
  assert.equal(preview.depth, 520 + (200 + 23) / 10);
  assert.equal(preview.alpha, 0.7);
  assert.equal(preview.interactive, undefined);
  assert.deepEqual(preview.children[0].commands.slice(0, 2), [["lineStyle", 5, 0xb44f45, 0.95], ["strokeCircle", 0, 0, 28]]);

  const full = factory.createPublicBin({ id: "commons", x: 2200, y: 1340, fill: 8, capacity: 8, tipped: false });
  assert.equal(full.depth, 200 + (1340 + 20) / 10);
  assert.equal(full.data.collectionIdentity, "public:commons");
  assert.equal(full.data.visualState, "full");
  assert.equal(full.children.at(-1).args[2], "🚫");
  assert.equal(full.children.at(-2).args[2], "8/8");

  const tipped = factory.createPublicBin({ id: "station", x: 3000, y: 500, fill: 3, capacity: 8, tipped: true });
  assert.equal(tipped.data.visualState, "tipped");
  assert.equal(tipped.children[1].rotation, Math.PI / 2.5);
  assert.equal(tipped.children.at(-1).args[2], "⚠️");

  const carried = factory.createCollectionBin();
  assert.equal(carried.visible, false);
  assert.equal(carried.data.visualState, "carried");
  assert.deepEqual(carried.children[0].commands, [
    ["fillStyle", 0x294637, 0.2], ["fillEllipse", -18, 16, 36, 12],
    ["fillStyle", 0x294637, 1], ["fillRoundedRect", -16, -22, 32, 8, 3],
    ["fillStyle", 0x426b58, 1], ["fillRoundedRect", -13, -15, 26, 35, 5],
    ["fillStyle", 0xe7e3cf, 0.9], ["fillCircle", 0, 1, 5],
  ]);
});

test("bin artwork is replaceable by registry-only change without scene edits", async () => {
  const replacementManifest = structuredClone(KINDWORKS_VISUAL_MANIFEST);
  const replacement = replacementManifest.assets.find((asset) => asset.id === TOWN_BIN_ASSET_IDS.SMALL);
  replacement.kind = VISUAL_ASSET_KINDS.IMAGE;
  replacement.source = { kind: "file", file: "/assets/legacy-reference/fishing.webp", format: "webp" };
  replacement.technical = { ...replacement.technical, width: 720, height: 405 };
  replacement.cache = { version: "ade1c03c8ae3", contentSha256: "ade1c03c8ae32dad0b98ded9c1d6e485cf9422560777f5d8f3a41c6189b8c5bb" };
  replacement.validation = { maximumRuntimeBytes: 500_000, maximumDimension: 4096 };
  const validation = await validateVisualManifestFiles(replacementManifest, fileExists);
  assert.equal(validation.ok, true, JSON.stringify(validation.errors, null, 2));
  const original = resolveTownBinVisualContract(new VisualRegistry(), "small-town-bin");
  const changed = resolveTownBinVisualContract(new VisualRegistry({ manifest: replacementManifest }), "small-town-bin");
  assert.equal(original.layers.find((layer) => layer.role === "main").asset.kind, VISUAL_ASSET_KINDS.PROCEDURAL);
  assert.equal(changed.layers.find((layer) => layer.role === "main").asset.kind, VISUAL_ASSET_KINDS.IMAGE);
  assert.equal(original.prefab.id, changed.prefab.id);
  assert.equal(original.layers.find((layer) => layer.role === "main").asset.runtime.textureKey, changed.layers.find((layer) => layer.role === "main").asset.runtime.textureKey);
  const replacementScene = fakeScene(new VisualRegistry({ manifest: replacementManifest }));
  const replacementBin = new TownBinVisualFactory(replacementScene).createPlacedObject({ id: "replacement-proof", itemId: "small-town-bin", x: 100, y: 100, rotation: 0 });
  assert.equal(replacementBin.children[0].kind, "image");
  assert.equal(replacementBin.children[0].args[2], "kw.asset.prop.town-bin.small");

  const sources = await Promise.all([
    "src/entities/TownPlacedObject.js",
    "src/entities/MunicipalCollectionVehicle.js",
    "src/scenes/TownScene.js",
  ].map((file) => readFile(resolve(root, file), "utf8")));
  assert.match(sources[0], /getTownBinVisualFactory\(scene\)\.createPlacedObject/);
  assert.match(sources[1], /getTownBinVisualFactory\(scene\)\.createCollectionBin/);
  assert.match(sources[2], /townBinVisualFactory\.createPublicBin/);
  for (const source of sources) {
    assert.doesNotMatch(source, /drawBin|drawLiftedBin/);
    assert.doesNotMatch(source, /kw\.asset\.prop\.town-bin|prop\.town-bin\.(small|park|recycling|commercial|public)/);
  }
});

test("town-bin family validation rejects incomplete contracts", () => {
  const invalid = structuredClone(KINDWORKS_VISUAL_MANIFEST);
  delete invalid.prefabs.find((prefab) => prefab.id === TOWN_BIN_PREFAB_IDS.SMALL).sockets;
  const result = validateVisualManifestStructure(invalid);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((finding) => finding.code === "incomplete-family-prefab"));
  assert.ok(result.errors.some((finding) => finding.code === "missing-family-socket"));
});

test("visual resolution cannot mutate the protected save fixture", () => {
  const state = createVisualRegressionFixtureState();
  const before = digest(state);
  const registry = new VisualRegistry();
  for (const itemId of Object.keys(TOWN_BIN_ITEM_VARIANTS)) {
    for (const visualState of ["normal", "full", "tipped", "carried"]) {
      assert.ok(resolveTownBinVisualContract(registry, itemId, visualState));
    }
  }
  assert.equal(digest(state), before);
  assert.equal(state.schemaVersion, 37);
  assert.equal(state.economy.coins, 12_500);
});
