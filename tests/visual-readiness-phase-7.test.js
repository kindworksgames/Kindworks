import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createVisualRegressionFixtureState } from "../src/qa/visualRegressionFixtures.js";
import { KINDWORKS_VISUAL_MANIFEST } from "../src/visual/visualManifest.js";
import { assetLabCoverage, assetLabFacets, createAssetLabCatalog, filterAssetLabCatalog } from "../src/visual/dev/assetLabCatalog.js";

const root = resolve(import.meta.dirname, "..");
const source = (path) => readFile(resolve(root, path), "utf8");
const digest = (value) => createHash("sha256").update(JSON.stringify(value)).digest("hex");

test("Asset Lab inventory is generated from the shared runtime manifest", () => {
  const catalog = createAssetLabCatalog(KINDWORKS_VISUAL_MANIFEST);
  assert.equal(catalog.length, KINDWORKS_VISUAL_MANIFEST.assets.length);
  assert.deepEqual(catalog.map(({ id }) => id), KINDWORKS_VISUAL_MANIFEST.assets.map(({ id }) => id));
  assert.equal(assetLabCoverage(catalog).uninspectable.length, 0);
  for (const entry of catalog) {
    assert.ok(entry.category);
    assert.ok(entry.status);
    assert.ok(entry.families.length);
    assert.ok(Array.isArray(entry.states));
    assert.ok(Array.isArray(entry.animations));
    assert.ok(Array.isArray(entry.layers));
  }
});

test("search and all requested registry-backed filters resolve real entries", () => {
  const catalog = createAssetLabCatalog(KINDWORKS_VISUAL_MANIFEST);
  const facets = assetLabFacets(catalog);
  assert.ok(facets.categories.includes("prop"));
  assert.ok(facets.scenes.includes("TownScene"));
  assert.ok(facets.statuses.includes("prefab-migrated"));
  assert.ok(facets.families.includes("town-bin"));
  assert.ok(filterAssetLabCatalog(catalog, { query: "fishing-reedbank-background" }).some(({ id }) => id === "scene.fishing.reedbank.background"));
  assert.ok(filterAssetLabCatalog(catalog, { category: "prop", scene: "TownScene", family: "town-bin", status: "prefab-migrated" }).length >= 5);
  assert.ok(filterAssetLabCatalog(catalog, { tag: "recycling" }).some(({ id }) => id === "prop.town-bin.recycling"));
});

test("every registered pilot state, direction, layer and animation is represented", () => {
  const catalog = createAssetLabCatalog(KINDWORKS_VISUAL_MANIFEST);
  const stateCount = KINDWORKS_VISUAL_MANIFEST.visualStates.reduce((total, map) => total + Object.keys(map.states || {}).length, 0);
  const animationCount = KINDWORKS_VISUAL_MANIFEST.animations.length;
  const pilotLayers = KINDWORKS_VISUAL_MANIFEST.prefabs.reduce((total, prefab) => total + (prefab.layers || []).length, 0);
  const representedStates = new Set(catalog.flatMap((entry) => entry.states.map((state) => `${state.mapId}:${state.name}:${state.prefabId}`)));
  const representedLayers = new Set(catalog.flatMap((entry) => entry.layers.map((layer) => `${layer.prefabId}:${layer.id}:${layer.assetId}`)));
  assert.equal(representedStates.size, stateCount);
  assert.equal(catalog.reduce((total, entry) => total + entry.animations.length, 0), animationCount);
  assert.equal(representedLayers.size, pilotLayers);
  const resident = catalog.find(({ id }) => id === "character.resident.generated-frames");
  assert.deepEqual(resident.directions, ["down", "left", "right", "up"]);
  assert.equal(resident.animations.length, 4);
  const publicBin = catalog.find(({ id }) => id === "prop.town-bin.public");
  assert.deepEqual(publicBin.stateNames, ["normal", "full", "tipped", "carried"]);
});

test("Asset Lab provides the requested inspection and bounded export controls", async () => {
  const scene = await source("src/visual/dev/AssetLabScene.js");
  for (const marker of ["neutral", "grass", "road", "interior", "water", "light", "dark", "Actual/native", "Gameplay size", "Preview zoom", "World lighting preview", "Calibration NPC", "Visual state", "Visual variant", "Animation", "Facing", "Static or atlas frame", "Pause", "Restart", "Frame ▶", "Animation frame scrubber", "Playback speed", "Layer isolation", "Shadows", "canvas", "frame", "opaque", "origin", "ground", "sockets", "standing", "bounds", "collision", "navigation", "interaction", "touch", "Previous ↔ current", "Viewport frame", "Reload selected", "Export screenshot", "Export contact sheet", "assetLabWarnings"]) assert.match(scene, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(scene, /createAssetLabCatalog\(this\.visualRegistry\.manifest, \{[\s\S]*productionIndex: ASSET_LAB_PRODUCTION_INDEX,[\s\S]*candidateIndex: ASSET_LAB_CANDIDATE_INDEX/);
  assert.match(scene, /CONTACT_SHEET_PAGE_SIZE/);
  assert.doesNotMatch(scene, /VISUAL_ASSET_IDS|TOWN_BIN_ASSET_IDS/);
});

test("normal-scene visual QA exposes all required overlays", async () => {
  const overlay = await source("src/visual/dev/SceneQaOverlayController.js");
  for (const marker of ["Instance + prefab IDs", "Depth + Y-sort", "Interaction + touch", "Collision", "Navigation", "NPC paths + stations", "Safe areas + profile", "Camera bounds", "Missing fallbacks", "Reference overlay", "sceneQaProfile", "sceneQaFallbacks"]) assert.match(overlay, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});

test("development routes are lazy and production surface explicitly rejects them", async () => {
  const main = await source("src/main.js");
  const production = await source("scripts/verify-production-surface.mjs");
  assert.match(main, /import\.meta\.env\.DEV && qaMode === "asset-lab"/);
  assert.match(main, /import\("\.\/visual\/dev\/AssetLabScene\.js"\)/);
  assert.match(main, /import\("\.\/visual\/dev\/SceneQaOverlayController\.js"\)/);
  for (const marker of ["AssetLabScene", "kw-asset-lab", "assetLabReady", "SceneQaOverlayController", "kw-scene-qa", "sceneQaReady"]) assert.match(production, new RegExp(marker));
});

test("Asset Lab previous/current source is registry metadata rather than a tool-side list", () => {
  const asset = KINDWORKS_VISUAL_MANIFEST.assets.find(({ id }) => id === "scene.fishing.reedbank.background");
  assert.equal(asset.comparison.previousSource, "/assets/legacy-reference/fishing.webp");
  const catalog = createAssetLabCatalog(KINDWORKS_VISUAL_MANIFEST);
  assert.equal(catalog.find(({ id }) => id === asset.id).comparison.previousSource, asset.comparison.previousSource);
});

test("Phase 7 development inspection does not mutate the protected save fixture", () => {
  const state = createVisualRegressionFixtureState();
  const before = digest(state);
  createAssetLabCatalog(KINDWORKS_VISUAL_MANIFEST);
  filterAssetLabCatalog(createAssetLabCatalog(KINDWORKS_VISUAL_MANIFEST), { query: "town" });
  assert.equal(digest(state), before);
  assert.equal(state.schemaVersion, 37);
  assert.equal(state.economy.coins, 12_500);
});
