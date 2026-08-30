import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { VisualRegistry } from "../src/visual/VisualRegistry.js";
import { VISUAL_ASSET_REQUIREDNESS } from "../src/visual/contracts.js";
import { KINDWORKS_VISUAL_MANIFEST, VISUAL_ASSET_IDS } from "../src/visual/visualManifest.js";
import { validateVisualManifestFiles, validateVisualManifestStructure } from "../src/visual/validateVisualManifest.js";
import { auditRuntimeAssetCoverage, createRuntimeAssetInspector } from "../scripts/lib/runtimeAssetValidation.mjs";
import { createVisualRegressionFixtureState } from "../src/qa/visualRegressionFixtures.js";

const root = resolve(import.meta.dirname, "..");
const clone = () => structuredClone(KINDWORKS_VISUAL_MANIFEST);
const fishing = (manifest) => manifest.assets.find((asset) => asset.id === VISUAL_ASSET_IDS.FISHING_REEDBANK_BACKGROUND);
const metadata = (overrides = {}) => ({ exists: true, exactCase: true, format: "webp", width: 720, height: 405, alpha: false, bytes: 200_000, sha256: fishing(KINDWORKS_VISUAL_MANIFEST).cache.contentSha256, ...overrides });

test("runtime file validation inspects exact bytes, case, dimensions, alpha, budget and fingerprint", async () => {
  const result = await validateVisualManifestFiles(KINDWORKS_VISUAL_MANIFEST, createRuntimeAssetInspector(root));
  assert.equal(result.ok, true, JSON.stringify(result.errors, null, 2));
  for (const asset of KINDWORKS_VISUAL_MANIFEST.assets.filter(({ source }) => source.kind === "file")) {
    assert.match(asset.id, /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/);
    assert.ok(asset.requiredness);
    assert.match(asset.cache.contentSha256, /^[a-f0-9]{64}$/);
    assert.ok(asset.validation.maximumRuntimeBytes > 0);
  }
});

test("optional missing files warn while required and gameplay-critical files fail", async () => {
  const optional = clone();
  fishing(optional).requiredness = VISUAL_ASSET_REQUIREDNESS.OPTIONAL;
  const optionalResult = await validateVisualManifestFiles(optional, async (path) => path.includes("fishing-reedbank") ? false : true);
  assert.equal(optionalResult.ok, true);
  assert.ok(optionalResult.warnings.some(({ code }) => code === "missing-optional-asset-file"));
  for (const requiredness of [VISUAL_ASSET_REQUIREDNESS.REQUIRED, VISUAL_ASSET_REQUIREDNESS.GAMEPLAY_CRITICAL]) {
    const manifest = clone(); fishing(manifest).requiredness = requiredness;
    const result = await validateVisualManifestFiles(manifest, async (path) => path.includes("fishing-reedbank") ? false : true);
    assert.equal(result.ok, false);
    assert.ok(result.errors.some(({ code, assetId, affectedScenes }) => code === "missing-asset-file" && assetId === VISUAL_ASSET_IDS.FISHING_REEDBANK_BACKGROUND && affectedScenes.includes("FishingScene")));
  }
});

test("duplicate texture and animation cache keys fail before runtime", () => {
  const manifest = clone();
  manifest.assets.find(({ id }) => id === VISUAL_ASSET_IDS.ANIMAL_REFERENCE_SHEET).runtime.textureKey = fishing(manifest).runtime.textureKey;
  manifest.animations[1].runtimeKey = manifest.animations[0].runtimeKey;
  const result = validateVisualManifestStructure(manifest);
  assert.ok(result.errors.some(({ code }) => code === "duplicate-cache-key"));
  assert.ok(result.errors.some(({ code }) => code === "duplicate-animation-cache-key"));
});

test("unsupported formats, oversized declarations and invalid spritesheet grids fail", () => {
  const manifest = clone();
  fishing(manifest).source.format = "gif";
  fishing(manifest).technical.width = 8192;
  manifest.assets.find(({ id }) => id === VISUAL_ASSET_IDS.ANIMAL_REFERENCE_SHEET).technical.frameWidth = 63;
  const codes = new Set(validateVisualManifestStructure(manifest).errors.map(({ code }) => code));
  assert.ok(codes.has("unsupported-format"));
  assert.ok(codes.has("invalid-dimensions"));
  assert.ok(codes.has("invalid-spritesheet-grid"));
});

test("corrupt, wrong-case, wrong-size, wrong-alpha, stale and over-budget files fail precisely", async () => {
  const cases = [
    [{ format: "unknown", width: null, height: null }, "corrupt-or-unsupported-file"],
    [{ exactCase: false, canonicalPath: "/assets/runtime/scene/fishing/fishing-reedbank-background.v1.webp" }, "path-case-mismatch"],
    [{ width: 1536, height: 1024 }, "dimension-mismatch"],
    [{ alpha: true }, "alpha-mismatch"],
    [{ sha256: "0".repeat(64) }, "content-fingerprint-mismatch"],
    [{ bytes: 999_999_999 }, "texture-budget-exceeded"],
  ];
  for (const [mutation, expected] of cases) {
    const result = await validateVisualManifestFiles(KINDWORKS_VISUAL_MANIFEST, async (path) => path.includes("fishing-reedbank") ? metadata(mutation) : true);
    assert.equal(result.ok, false, expected);
    assert.ok(result.errors.some(({ code, assetId, expected: contract, actual, affectedScenes }) => code === expected && assetId === VISUAL_ASSET_IDS.FISHING_REEDBANK_BACKGROUND && contract != null && actual != null && affectedScenes.includes("FishingScene")), expected);
  }
});

test("missing generated animation frames fail with the owning asset and scene", () => {
  const manifest = clone();
  manifest.animations[0].frames.push({ textureKey: "resident-down-999" });
  const result = validateVisualManifestStructure(manifest);
  const failure = result.errors.find(({ code }) => code === "missing-animation-frame");
  assert.equal(failure.assetId, VISUAL_ASSET_IDS.RESIDENT_GENERATED_FRAMES);
  assert.ok(failure.affectedScenes.includes("BootScene"));
});

test("atlas and audio contracts validate and use their matching Phaser loaders", async () => {
  const manifest = clone();
  manifest.assets.push({
    schemaVersion: 1, id: "qa.atlas.sample", kind: "atlas", requiredness: "required",
    source: { kind: "file", file: "/assets/qa/sample.png", format: "png", atlasFile: "/assets/qa/sample.json", atlasSha256: "b".repeat(64) },
    runtime: { renderTarget: "phaser", textureKey: "qa.atlas.sample" },
    technical: { pixelArt: true, alpha: true, width: 64, height: 32, frameNames: ["idle-0", "idle-1"] },
    lifecycle: { scope: "scene", unload: "on-last-scene-release" },
    cache: { version: "a", contentSha256: "a".repeat(64) },
    validation: { maximumRuntimeBytes: 10_000, maximumDimension: 4096 },
  });
  manifest.assets.push({
    schemaVersion: 1, id: "qa.audio.sample", kind: "audio", requiredness: "optional",
    source: { kind: "file", file: "/assets/qa/sample.ogg", format: "ogg" },
    runtime: { renderTarget: "phaser", audioKey: "qa.audio.sample" },
    technical: {}, lifecycle: { scope: "scene", unload: "on-last-scene-release" },
    cache: { version: "c", contentSha256: "c".repeat(64) },
    validation: { maximumRuntimeBytes: 10_000, maximumDimension: 4096 },
  });
  manifest.animations.push({ schemaVersion: 1, id: "qa.animation.atlas", assetId: "qa.atlas.sample", runtimeKey: "qa.animation.atlas", frames: [{ frameName: "idle-0" }, { frameName: "idle-1" }], frameRate: 4, repeat: -1 });
  manifest.scenePacks.push({ schemaVersion: 1, id: "pack.scene.qa-assets", sceneId: "QaAssetScene", assetIds: ["qa.atlas.sample", "qa.audio.sample"], animationIds: ["qa.animation.atlas"] });
  const validation = await validateVisualManifestFiles(manifest, async (path) => {
    if (path.endsWith("sample.png")) return { exists: true, exactCase: true, format: "png", width: 64, height: 32, alpha: true, bytes: 100, sha256: "a".repeat(64) };
    if (path.endsWith("sample.json")) return { exists: true, exactCase: true, format: "json", frames: ["idle-0", "idle-1"], bytes: 100, sha256: "b".repeat(64) };
    if (path.endsWith("sample.ogg")) return { exists: true, exactCase: true, format: "ogg", bytes: 100, sha256: "c".repeat(64) };
    return true;
  });
  assert.equal(validation.ok, true, JSON.stringify(validation.errors, null, 2));
  const registry = new VisualRegistry({ manifest });
  const scene = fakeScene("QaAssetScene");
  registry.queueScenePacks(scene);
  assert.deepEqual(scene.queued.map(([kind]) => kind), ["atlas", "audio"]);
  manifest.animations.at(-1).frames[1].frameName = "missing";
  assert.ok(validateVisualManifestStructure(manifest).errors.some(({ code }) => code === "missing-animation-frame"));
});

function fakeScene(key = "FishingScene") {
  const keys = new Set(), removed = [], queued = [], eventHandlers = new Map();
  return {
    removed, queued,
    scene: { key },
    textures: { exists: (value) => keys.has(value), createCanvas: (value) => { keys.add(value); return { context: { fillStyle: "", strokeStyle: "", lineWidth: 0, fillRect() {}, beginPath() {}, moveTo() {}, lineTo() {}, stroke() {} }, refresh() {} }; }, remove: (value) => { removed.push(value); keys.delete(value); } },
    cache: { audio: { exists: () => false } },
    load: { on(event, handler) { eventHandlers.set(event, handler); }, off() {}, image: (...args) => queued.push(["image", ...args]), spritesheet: (...args) => queued.push(["spritesheet", ...args]), atlas: (...args) => queued.push(["atlas", ...args]), audio: (...args) => queued.push(["audio", ...args]) },
    events: { once(event, handler) { if (!eventHandlers.has(event)) eventHandlers.set(event, handler); } },
    fire(event) { eventHandlers.get(event)?.(); },
  };
}

test("scene packs execute, use fingerprinted URLs, and scene-scoped assets release safely", () => {
  const registry = new VisualRegistry({ baseUrl: "/kindworks/" });
  const scene = fakeScene();
  const packs = registry.queueScenePacks(scene);
  assert.equal(packs.length, 1);
  assert.equal(scene.queued[0][0], "image");
  assert.match(scene.queued[0][2], /^\/kindworks\/assets\/runtime\/scene\/fishing\/.*\?v=ade1c03c8ae3$/);
  scene.fire("shutdown");
  assert.deepEqual(scene.removed, [registry.getTextureKey(VISUAL_ASSET_IDS.FISHING_REEDBANK_BACKGROUND)]);
});

test("native Canvas pack resolves all Power Wash assets semantically and rejects incompatible dimensions", async () => {
  class FakeImage {
    addEventListener(type, callback) { this[type] = callback; }
    set src(value) { this.url = value; this.naturalWidth = value.includes("playground") ? 1536 : value.includes("precision") ? 80 : value.includes("standard") ? 77 : 84; this.naturalHeight = value.includes("master") || value.includes("dirt") ? 1024 : value.includes("precision") ? 101 : 102; queueMicrotask(() => this.load()); }
  }
  const registry = new VisualRegistry();
  const assets = await registry.loadNativeScenePacks("PlaygroundPowerwashScene", { ImageCtor: FakeImage });
  assert.equal(assets.size, 5);
  class WrongImage extends FakeImage { set src(value) { this.url = value; this.naturalWidth = 1; this.naturalHeight = 1; queueMicrotask(() => this.load()); } }
  const fresh = new VisualRegistry({ reporter: { error() {} } });
  await assert.rejects(() => fresh.loadNativeAsset(VISUAL_ASSET_IDS.POWERWASH_PLAYGROUND_MASTER, { sceneId: "PlaygroundPowerwashScene", ImageCtor: WrongImage }), /expected 1536x1024/);
  assert.equal(fresh.getFailures()[0].code, "runtime-dimension-mismatch");
});

test("all present runtime files are declared or explicitly documented and duplicate bytes are reported", async () => {
  const audit = await auditRuntimeAssetCoverage(root, KINDWORKS_VISUAL_MANIFEST);
  assert.deepEqual(audit.orphaned, []);
  assert.deepEqual(audit.unusedEntries, []);
  assert.ok(audit.duplicateContent.some(({ paths }) => paths.includes("/assets/legacy-reference/fishing.webp") && paths.includes("/assets/runtime/scene/fishing/fishing-reedbank-background.v1.webp")));
});

test("production consumers contain no direct runtime file paths or loader calls", async () => {
  const files = ["src/scenes/BootScene.js", "src/scenes/FishingScene.js", "src/scenes/PlaygroundPowerwashScene.js", "src/entities/PlayerCharacter.js", "src/entities/AnimalCharacter.js", "src/scenes/PawsWondersScene.js", "src/scenes/HouseInteriorScene.js", "src/ui/AnimalFriendsController.js"];
  for (const file of files) {
    const source = await readFile(resolve(root, file), "utf8");
    assert.doesNotMatch(source, /\/assets\/(animals|powerwash|runtime)/, file);
    assert.doesNotMatch(source, /load\.(?:image|spritesheet|atlas|audio)\(/, file);
    assert.doesNotMatch(source, /new Image\(/, file);
  }
});

test("asset failure and replacement operations cannot mutate protected save state", async () => {
  const save = createVisualRegressionFixtureState(), before = createHash("sha256").update(JSON.stringify(save)).digest("hex");
  const registry = new VisualRegistry({ reporter: { error() {} } });
  registry.queuePhaserAsset(fakeScene("TownScene"), "missing.asset");
  await validateVisualManifestFiles(KINDWORKS_VISUAL_MANIFEST, async () => false);
  assert.equal(createHash("sha256").update(JSON.stringify(save)).digest("hex"), before);
  assert.equal(save.schemaVersion, 37);
});
