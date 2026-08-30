import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { createVisualRegressionFixtureState } from "../src/qa/visualRegressionFixtures.js";
import {
  ARTWORK_WORKFLOW_STATUSES,
  canTransitionArtworkStatus,
  transitionArtworkStatus,
  validateArtworkWorkflowHistory,
} from "../src/visual/artwork/artworkWorkflow.js";
import {
  ARTWORK_RUNTIME_ASSETS,
  ARTWORK_RUNTIME_PACKS,
} from "../src/visual/generated/artworkRuntimePacks.js";
import { KINDWORKS_VISUAL_MANIFEST, VISUAL_ASSET_IDS } from "../src/visual/visualManifest.js";
import {
  applyArtworkFixtureMutation,
  validateArtworkManifest,
} from "../scripts/lib/artworkPipelineValidation.mjs";
import { renderArtworkRuntimePackModule } from "../scripts/lib/artworkRuntimePackGenerator.mjs";

const root = resolve(import.meta.dirname, "..");
const manifestPath = resolve(root, "artwork/specifications/kindworks-artwork-manifest.v1.json");
const digest = (value) => createHash("sha256").update(typeof value === "string" ? value : JSON.stringify(value)).digest("hex");
const readJson = async (file) => JSON.parse(await readFile(resolve(root, file), "utf8"));

test("artwork specification contains the complete generator-neutral production contract", async () => {
  const manifest = await readJson("artwork/specifications/kindworks-artwork-manifest.v1.json");
  assert.equal(manifest.schemaVersion, 2);
  assert.deepEqual(manifest.workflowStatuses, ARTWORK_WORKFLOW_STATUSES);
  assert.equal(manifest.artBibleVersion, "KindWorks Visual Style Bible v4");
  assert.equal(manifest.assets.length, 1);
  const asset = manifest.assets[0];
  for (const field of ["semanticId", "familyId", "category", "categoryContractId", "gameplayPurpose", "intendedScenes", "output", "camera", "masterScale", "anchor", "sockets", "geometry", "states", "variants", "directions", "layers", "animations", "artRules", "expectedFilenames", "filenameStem", "forbiddenOutput", "validation", "productionStatus", "workflow", "provenance", "version"]) assert.ok(asset[field] != null, field);
  assert.equal(manifest.contractPolicy.allowUncontractedAssets, false);
  assert.deepEqual(manifest.contractPolicy.requiredSemanticIds, [asset.semanticId]);
  assert.equal(asset.output.smoothing, false);
  assert.equal(asset.output.trimFrames, false);
  assert.doesNotMatch(asset.semanticId, /chatgpt|sprite.?ai|midjourney|dall.?e/i);
  assert.doesNotMatch(Object.values(asset.expectedFilenames).join(" "), /chatgpt|sprite.?ai|midjourney|dall.?e/i);
  assert.equal(asset.geometry.collision, null);
  assert.equal(asset.geometry.navigation, null);
  assert.equal(asset.geometry.interaction, null);
  assert.equal(asset.geometry.touch, null);
});

test("valid staged, master and runtime sample passes exact file validation", async () => {
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const validation = await validateArtworkManifest(manifest, { root });
  assert.equal(validation.ok, true, validation.errors.map(({ code }) => code).join(","));
  const asset = manifest.assets[0];
  const metadata = validation.metadata.get(asset.semanticId);
  for (const role of ["staging", "master", "runtime"]) {
    assert.deepEqual({ width: metadata[role].width, height: metadata[role].height, format: metadata[role].format, alpha: metadata[role].alpha }, { width: 720, height: 405, format: "webp", alpha: false });
    assert.equal(metadata[role].sha256, asset.provenance.sourceSha256);
  }
  assert.ok(metadata.runtime.bytes <= asset.validation.maximumRuntimeBytes);
});

test("every committed invalid contract mutation fails for its documented reason", async () => {
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const catalog = await readJson("artwork/contracts/asset-category-contracts.v2.json");
  const names = (await readdir(resolve(root, "artwork/fixtures/invalid"))).filter((name) => name.endsWith(".json")).map((name) => name.replace(/\.json$/, "")).sort();
  assert.ok(names.length >= 18);
  for (const name of names) {
    const fixture = await readJson(`artwork/fixtures/invalid/${name}.json`);
    const result = await validateArtworkManifest(applyArtworkFixtureMutation(manifest, fixture), { root, categoryContracts: catalog.categoryContracts, familyAssignments: catalog.familyAssignments });
    assert.equal(result.ok, false, name);
    const codes = new Set(result.errors.map(({ code }) => code));
    for (const expected of fixture.expectedCodes) assert.equal(codes.has(expected), true, `${name}:${expected}:${[...codes].join(",")}`);
  }
});

test("workflow permits review revision or approval but rejects unsafe skips", () => {
  assert.equal(canTransitionArtworkStatus("review", "revision"), true);
  assert.equal(canTransitionArtworkStatus("review", "approval"), true);
  assert.equal(canTransitionArtworkStatus("generated", "integrated"), false);
  assert.throws(() => transitionArtworkStatus({ currentStatus: "generated", history: [{ status: "specified" }, { status: "generation-ready" }, { status: "generated" }] }, "integrated"), /Invalid artwork workflow transition/);
  assert.deepEqual(validateArtworkWorkflowHistory({ currentStatus: "approval", history: [{ status: "specified" }, { status: "generation-ready" }, { status: "generated" }, { status: "review" }, { status: "approval" }] }), []);
});

test("generated runtime pack is deterministic and agrees with the semantic registry", async () => {
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const generated = await readFile(resolve(root, "src/visual/generated/artworkRuntimePacks.js"), "utf8");
  assert.equal(generated, renderArtworkRuntimePackModule(manifest));
  const id = VISUAL_ASSET_IDS.FISHING_REEDBANK_BACKGROUND;
  assert.equal(ARTWORK_RUNTIME_ASSETS[id].source.file, "/assets/runtime/scene/fishing/fishing-reedbank-background.v1.webp");
  assert.deepEqual(ARTWORK_RUNTIME_PACKS["pack.scene.fishing"].assetIds, [id]);
  assert.equal(ARTWORK_RUNTIME_PACKS["pack.scene.fishing"].sceneIds[0], "FishingScene");
  const registryAsset = KINDWORKS_VISUAL_MANIFEST.assets.find((asset) => asset.id === id);
  assert.equal(registryAsset.source.file, ARTWORK_RUNTIME_ASSETS[id].source.file);
  assert.equal(registryAsset.status, "artwork-pipeline-verified");
  assert.deepEqual(registryAsset.technical.width, 720);
  assert.deepEqual(registryAsset.technical.height, 405);
});

test("valid staged sample reaches Fishing through registry data without a scene-code path", async () => {
  const fishingScene = await readFile(resolve(root, "src/scenes/FishingScene.js"), "utf8");
  assert.match(fishingScene, /queueScenePacks\(this, this\.scene\.key\)/);
  assert.doesNotMatch(fishingScene, /assets\/runtime|fishing-reedbank-background\.v1|artwork\/staging|artwork\/masters/);
  assert.equal(KINDWORKS_VISUAL_MANIFEST.scenePacks.find(({ id }) => id === "pack.scene.fishing").assetIds[0], VISUAL_ASSET_IDS.FISHING_REEDBANK_BACKGROUND);
});

test("artwork production cannot mutate the protected schema-37 save fixture", async () => {
  const state = createVisualRegressionFixtureState();
  const before = digest(state);
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  await validateArtworkManifest(manifest, { root });
  renderArtworkRuntimePackModule(manifest);
  assert.equal(digest(state), before);
  assert.equal(state.schemaVersion, 37);
  assert.equal(state.economy.coins, 12_500);
});

test("repository ignores artwork credentials but keeps specifications and staged candidates", async () => {
  const ignore = await readFile(resolve(root, ".gitignore"), "utf8");
  assert.match(ignore, /artwork\/\.credentials\//);
  assert.match(ignore, /artwork\/\.secrets\//);
  assert.doesNotMatch(ignore, /^artwork\/staging\/$/m);
  const readme = await readFile(resolve(root, "artwork/README.md"), "utf8");
  assert.match(readme, /credentials, API keys, cookies.*outside this repository/i);
});
