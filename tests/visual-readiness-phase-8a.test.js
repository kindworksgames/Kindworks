import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { LAWN_CONFIG, LAWN_PLOTS } from "../src/data/farming.js";
import { HOUSES, TOWN_REFERENCE_LAYOUT } from "../src/data/town.js";
import { createVisualRegressionFixtureState } from "../src/qa/visualRegressionFixtures.js";
import { createVisualRegistry } from "../src/visual/VisualRegistry.js";
import { PhaserPrefabRenderer } from "../src/visual/renderers/PhaserPrefabRenderer.js";
import { KINDWORKS_VISUAL_MANIFEST } from "../src/visual/visualManifest.js";
import { createPhase8AAssetLabManifest } from "../src/visual/dev/phase8aAssetLabManifest.js";
import {
  PHASE_8A_ASSET_IDS,
  PHASE_8A_VERTICAL_SLICE_PACKAGE,
  WORLD_LAWN_GROWTH_STATES,
  WORLD_LAWN_WEED_STATES,
} from "../src/visual/verticalSlice/phase8aVerticalSlicePackage.js";
import { PHASE_8A_RUNTIME_DEFINITIONS } from "../src/visual/generated/phase8aVerticalSliceRuntime.js";
import { PHASE_8B_APPROVED_ASSET_INDEX } from "../src/visual/generated/phase8bApprovedAssetIndex.js";
import { validatePhase8APackage } from "../src/visual/verticalSlice/validatePhase8APackage.js";

const root = resolve(import.meta.dirname, "..");
const source = (path) => readFile(resolve(root, path), "utf8");
const digest = (value) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const phase8aManifest = () => createPhase8AAssetLabManifest(KINDWORKS_VISUAL_MANIFEST);

test("Phase 8A production package is complete and centrally registered", () => {
  const result = validatePhase8APackage({ visualManifest: phase8aManifest() });
  assert.equal(result.ok, true, result.errors.map(({ code, message }) => `${code}: ${message}`).join("\n"));
  assert.deepEqual(result.counts, { families: 9, assets: 24, prefabs: 21, states: 21, animations: 13, placements: 59, waves: 6 });
  assert.equal(PHASE_8A_VERTICAL_SLICE_PACKAGE.integration.massGenerationPermitted, false);
  assert.equal(PHASE_8A_VERTICAL_SLICE_PACKAGE.status, "production-package-ready-no-artwork-generated");
});

test("every requested slice role has a semantic contract, prompt, fallback, validation, prefab, and destination", () => {
  assert.equal(PHASE_8A_VERTICAL_SLICE_PACKAGE.assets.length, Object.keys(PHASE_8A_ASSET_IDS).length);
  for (const asset of PHASE_8A_VERTICAL_SLICE_PACKAGE.assets) {
    assert.ok(asset.semanticId);
    assert.ok(asset.familyId);
    assert.ok(asset.output.canvas.width > 0 && asset.output.canvas.height > 0);
    assert.ok(asset.promptPackage.positivePrompt.includes(`${asset.output.canvas.width}×${asset.output.canvas.height}px`));
    assert.ok(asset.promptPackage.negativePrompt.length > 100);
    assert.ok(asset.forbiddenOutput.length >= 6);
    assert.ok(asset.validation.checklist.length >= 7);
    assert.ok(asset.scenePlacement.length >= 1);
    assert.ok(asset.prefabId && asset.stateMapId);
    assert.equal(asset.placeholder.mode, "semantic-registry-generated-fallback");
    assert.equal(asset.productionStatus, "specified");
    assert.equal(asset.provenance.generatedArtworkPresent, false);
  }
});

test("invalid Phase 8A contracts fail for the documented reasons", () => {
  const duplicate = structuredClone(PHASE_8A_VERTICAL_SLICE_PACKAGE);
  duplicate.assets.push(structuredClone(duplicate.assets[0]));
  let result = validatePhase8APackage({ packageDefinition: duplicate });
  assert.ok(result.errors.some(({ code }) => code === "duplicate-semantic-id"));

  const promptless = structuredClone(PHASE_8A_VERTICAL_SLICE_PACKAGE);
  delete promptless.assets[0].promptPackage.positivePrompt;
  result = validatePhase8APackage({ packageDefinition: promptless });
  assert.ok(result.errors.some(({ code }) => code === "incomplete-generator-prompt"));

  const malformedSheet = structuredClone(PHASE_8A_VERTICAL_SLICE_PACKAGE);
  malformedSheet.assets.find(({ semanticId }) => semanticId === PHASE_8A_ASSET_IDS.PLAYER).output.canvas.width += 1;
  result = validatePhase8APackage({ packageDefinition: malformedSheet });
  assert.ok(result.errors.some(({ code }) => code === "invalid-sheet-grid"));

  const missingPlacement = structuredClone(PHASE_8A_VERTICAL_SLICE_PACKAGE);
  missingPlacement.assets[0].scenePlacement = [];
  result = validatePhase8APackage({ packageDefinition: missingPlacement });
  assert.ok(result.errors.some(({ code }) => code === "missing-scene-placement"));

  const playerMutation = (mutate) => {
    const value = structuredClone(PHASE_8A_VERTICAL_SLICE_PACKAGE);
    mutate(value.assets.find(({ semanticId }) => semanticId === PHASE_8A_ASSET_IDS.PLAYER));
    return validatePhase8APackage({ packageDefinition: value });
  };
  result = playerMutation((asset) => { asset.directions = asset.directions.slice(0, 3); });
  assert.ok(result.errors.some(({ code }) => code === "missing-required-direction"));
  result = playerMutation((asset) => { asset.states = []; });
  assert.ok(result.errors.some(({ code }) => code === "missing-required-state"));
  result = playerMutation((asset) => { asset.animations[0].frameRate = 0; });
  assert.ok(result.errors.some(({ code }) => code === "invalid-frame-rate"));
  result = playerMutation((asset) => { asset.variants.push(asset.variants[0]); });
  assert.ok(result.errors.some(({ code }) => code === "invalid-variants"));
  result = playerMutation((asset) => { asset.anchor.normalized.x = 2; });
  assert.ok(result.errors.some(({ code }) => code === "invalid-origin"));
  result = playerMutation((asset) => { asset.output.format = "gif"; });
  assert.ok(result.errors.some(({ code }) => code === "invalid-output-format"));
  result = playerMutation((asset) => { asset.output.textureFiltering = "linear"; });
  assert.ok(result.errors.some(({ code }) => code === "invalid-pixel-export-policy"));
  result = playerMutation((asset) => { asset.validation.maximumTransparentPadding.left = -1; });
  assert.ok(result.errors.some(({ code }) => code === "incomplete-file-constraints") || result.errors.some(({ code }) => code === "invalid-padding-contract"));
});

test("dependency order approves foundations before dependent variants", () => {
  const waves = new Map(PHASE_8A_VERTICAL_SLICE_PACKAGE.dependencyOrder.flatMap(({ wave, assetIds }) => assetIds.map((id) => [id, wave])));
  for (const asset of PHASE_8A_VERTICAL_SLICE_PACKAGE.assets) for (const dependency of asset.dependencies) assert.ok(waves.get(dependency) <= waves.get(asset.semanticId), `${dependency} must precede ${asset.semanticId}`);
  assert.equal(waves.get(PHASE_8A_ASSET_IDS.GRASS), 1);
  assert.equal(waves.get(PHASE_8A_ASSET_IDS.LAWN_CONTROLS), 6);
});

test("the selected town block and lawn transition use protected repository identities", () => {
  const house = HOUSES.find(({ id }) => id === "house-6");
  const lawn = LAWN_PLOTS.find(({ id }) => id === "lawn-house-6");
  assert.deepEqual({ x: house.x, y: house.y, width: house.width, height: house.height, architectureKit: house.architectureKit }, { x: 2158, y: 215, width: 195, height: 145, architectureKit: "bay-cottage" });
  assert.deepEqual(lawn.yard, { x: 2100, y: 150, width: 310, height: 340 });
  assert.equal(TOWN_REFERENCE_LAYOUT.river.waterWidth, 188);
  assert.equal(TOWN_REFERENCE_LAYOUT.river.bankWidth, 226);
  assert.equal(PHASE_8A_VERTICAL_SLICE_PACKAGE.transition.interaction.targetId, lawn.id);
  assert.equal(PHASE_8A_VERTICAL_SLICE_PACKAGE.transition.afterVisualState.growth.currentValue, LAWN_CONFIG.freshlyCutHeight);
  assert.equal(PHASE_8A_VERTICAL_SLICE_PACKAGE.transition.afterVisualState.weeds.currentValue, LAWN_CONFIG.freshlyWeededPressure);
  assert.equal(PHASE_8A_VERTICAL_SLICE_PACKAGE.transition.rewardContract.visualLayerMayMutateReward, false);
});

test("world lawn art separates growth from weeds and covers every active authored yard", () => {
  const base = PHASE_8A_VERTICAL_SLICE_PACKAGE.assets.find(({ semanticId }) => semanticId === PHASE_8A_ASSET_IDS.LAWN_BASE);
  const growth = PHASE_8A_VERTICAL_SLICE_PACKAGE.assets.find(({ semanticId }) => semanticId === PHASE_8A_ASSET_IDS.LAWN);
  const weeds = PHASE_8A_VERTICAL_SLICE_PACKAGE.assets.find(({ semanticId }) => semanticId === PHASE_8A_ASSET_IDS.WORLD_LAWN_WEEDS);
  const active = LAWN_PLOTS.filter(({ active }) => active);
  const activeIds = active.map(({ id }) => id).sort();

  assert.equal(base.output.type, "single-image");
  assert.deepEqual(base.output.canvas, { width: 256, height: 256 });
  assert.equal(base.output.alpha, false);
  assert.deepEqual(base.states, WORLD_LAWN_GROWTH_STATES);
  assert.equal(base.prefabId, growth.prefabId);
  assert.equal(base.stateMapId, growth.stateMapId);
  assert.deepEqual(base.layers.map(({ id }) => id), ["background-base"]);
  assert.deepEqual(growth.layers.map(({ id }) => id), ["growth-overlay"]);
  assert.deepEqual(growth.states, WORLD_LAWN_GROWTH_STATES);
  assert.deepEqual(weeds.states, WORLD_LAWN_WEED_STATES);
  assert.deepEqual(growth.output.spriteSheet.frameOrder, WORLD_LAWN_GROWTH_STATES);
  assert.deepEqual(weeds.output.spriteSheet.frameOrder, WORLD_LAWN_WEED_STATES);
  assert.equal(growth.output.spriteSheet.frameWidth, 256);
  assert.equal(growth.output.spriteSheet.frameHeight, 256);
  assert.equal(weeds.output.spriteSheet.frameWidth, 64);
  assert.equal(weeds.output.spriteSheet.frameHeight, 64);
  assert.equal(growth.geometry.collision, null);
  assert.equal(growth.geometry.navigation, null);
  assert.equal(growth.geometry.interaction, null);
  assert.equal(growth.geometry.touch, null);
  assert.equal(weeds.geometry.collision, null);
  assert.equal(weeds.geometry.navigation, null);
  assert.equal(weeds.geometry.interaction, null);
  assert.equal(weeds.geometry.touch, null);
  assert.deepEqual(base.scenePlacement.map(({ protectedWorldObjectId }) => protectedWorldObjectId).sort(), activeIds);
  assert.deepEqual(growth.scenePlacement.map(({ protectedWorldObjectId }) => protectedWorldObjectId).sort(), activeIds);
  assert.deepEqual(weeds.scenePlacement.map(({ protectedWorldObjectId }) => protectedWorldObjectId).sort(), activeIds);
  assert.equal(new Set(growth.scenePlacement.map(({ yardGeometryFamily }) => yardGeometryFamily)).size, 4);
  assert.ok(growth.forbiddenOutput.some((rule) => rule.includes("opaque background")));
  assert.match(growth.promptPackage.positivePrompt, /severely overgrown/);
  assert.match(weeds.promptPackage.positivePrompt, /weedPressure 0–17/);
  assert.equal(LAWN_CONFIG.jobGrassThreshold, 70);
  assert.equal(LAWN_CONFIG.jobWeedThreshold, 38);
});

test("all approved assets and remaining placeholders resolve through shared factories", () => {
  const registry = createVisualRegistry({ manifest: phase8aManifest(), reporter: { error() {} } });
  const renderer = new PhaserPrefabRenderer(null, registry);
  const approvedIds = new Set(PHASE_8B_APPROVED_ASSET_INDEX.assets.map(({ id }) => id));
  for (const asset of PHASE_8A_VERTICAL_SLICE_PACKAGE.assets) {
    assert.equal(
      registry.getAsset(asset.semanticId).source.owner,
      approvedIds.has(asset.semanticId) ? "Phase8BApprovedArtwork" : "Phase8AVerticalSlicePlaceholder",
    );
    const stateMap = registry.getVisualState(asset.stateMapId);
    for (const stateName of asset.states) {
      const resolved = renderer.resolve(asset.prefabId, asset.stateMapId, stateName);
      assert.ok(resolved.layers.some(({ asset: layerAsset }) => layerAsset.id === asset.semanticId));
      assert.ok(resolved.prefab.geometry.visual);
      assert.equal(resolved.stateName, stateName);
    }
  }
  for (const animation of PHASE_8A_RUNTIME_DEFINITIONS.animations) assert.ok(registry.getAnimation(animation.id));
});

test("an approved replacement changes central asset metadata without scene gameplay edits", async () => {
  const townBefore = await source("src/scenes/TownScene.js");
  const lawnBefore = await source("src/scenes/LawnCareScene.js");
  const replacementManifest = structuredClone(phase8aManifest());
  const target = replacementManifest.assets.find(({ id }) => id === PHASE_8A_ASSET_IDS.DECORATION);
  target.kind = "image";
  target.source = { kind: "file", file: "/assets/runtime/phase-8a/flower-planter.v1.png", format: "png" };
  target.cache = { version: "approved-test", contentSha256: "a".repeat(64) };
  target.validation = { maximumRuntimeBytes: 100_000, maximumDimension: 4096 };
  target.status = "runtime-ready";
  const result = validatePhase8APackage({ visualManifest: replacementManifest });
  assert.equal(result.ok, true, result.errors.map(({ code }) => code).join(", "));
  assert.equal(await source("src/scenes/TownScene.js"), townBefore);
  assert.equal(await source("src/scenes/LawnCareScene.js"), lawnBefore);
  assert.doesNotMatch(townBefore, /phase-8a|PHASE_8A|verticalSlice/i);
  assert.doesNotMatch(lawnBefore, /phase-8a|PHASE_8A|verticalSlice/i);
});

test("Phase 8A package and validation do not mutate saves or gameplay data", () => {
  const fixture = createVisualRegressionFixtureState();
  const before = digest(fixture);
  validatePhase8APackage({ visualManifest: phase8aManifest() });
  assert.equal(digest(fixture), before);
  assert.equal(fixture.schemaVersion, 37);
  assert.equal(fixture.economy.coins, 12_500);
});
