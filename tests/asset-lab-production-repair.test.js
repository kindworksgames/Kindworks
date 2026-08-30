import test from "node:test";
import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { KINDWORKS_VISUAL_MANIFEST } from "../src/visual/visualManifest.js";
import { createPhase8AAssetLabManifest } from "../src/visual/dev/phase8aAssetLabManifest.js";
import { ASSET_LAB_PRODUCTION_INDEX } from "../src/visual/generated/assetLabProductionIndex.js";
import { assetLabCoverage, assetLabFacets, createAssetLabCatalog, filterAssetLabCatalog } from "../src/visual/dev/assetLabCatalog.js";

const root = resolve(import.meta.dirname, "..");
const source = (path) => readFile(resolve(root, path), "utf8");
const fullCatalog = () => createAssetLabCatalog(createPhase8AAssetLabManifest(KINDWORKS_VISUAL_MANIFEST), { productionIndex: ASSET_LAB_PRODUCTION_INDEX });

test("production inventory is generated into one manifest-derived Asset Lab catalog", () => {
  const catalog = fullCatalog(), coverage = assetLabCoverage(catalog), facets = assetLabFacets(catalog);
  assert.equal(coverage.assets, 37);
  assert.equal(coverage.productionFamilies, 74);
  assert.equal(coverage.placeholders.length, 22);
  assert.equal(new Set(ASSET_LAB_PRODUCTION_INDEX.familyRecords.map(({ id }) => id)).size, 74);
  for (const contract of ASSET_LAB_PRODUCTION_INDEX.categoryContracts) assert.ok(facets.categories.includes(contract.id.replace(/^category\./, "")), contract.id);
  for (const sceneId of Object.keys(ASSET_LAB_PRODUCTION_INDEX.sceneDependencies)) assert.ok(facets.scenes.includes(sceneId), sceneId);
});

test("fallback placeholders can never report valid or approved", () => {
  const placeholders = fullCatalog().filter(({ validationStatus }) => validationStatus === "placeholder");
  assert.equal(placeholders.length, 22);
  for (const entry of placeholders) {
    assert.equal(entry.approvalStatus, "not-generated");
    assert.ok(entry.validationFindings.some(({ code }) => code === "placeholder-runtime-art-missing"));
    assert.ok(entry.expectedRuntimeFile);
  }
});

test("dedicated production filters and usage lookup are authoritative", () => {
  const catalog = fullCatalog(), facets = assetLabFacets(catalog);
  for (const key of ["states", "directions", "animations", "approvals", "validations"]) assert.ok(facets[key].length > 0, key);
  assert.ok(filterAssetLabCatalog(catalog, { validation: "placeholder" }).length === 22);
  assert.ok(filterAssetLabCatalog(catalog, { approval: "not-ready" }).length >= 74);
  assert.ok(filterAssetLabCatalog(catalog, { state: "full" }).some(({ id }) => id === "prop.town-bin.public"));
  assert.ok(filterAssetLabCatalog(catalog, { direction: "down" }).some(({ id }) => id === "character.resident.generated-frames"));
  assert.ok(filterAssetLabCatalog(catalog, { animation: "animation.character.resident.walk.down" }).some(({ id }) => id === "character.resident.generated-frames"));
  const fishing = catalog.find(({ id }) => id === "scene.fishing.reedbank.background");
  assert.ok(fishing.usages.scenePacks.some(({ sceneId }) => sceneId === "FishingScene"));
  assert.ok(fishing.usages.prefabs.includes("prefab.scene.fishing.reedbank.background"));
  assert.ok(fishing.usages.instances.some(({ id }) => id === "instance.fishing.reedbank.background.main"));
  assert.ok(fishing.usages.legacyKeys.includes("legacy-fishing"));
});

test("atlas and spritesheet frame metadata is exposed without a tool-side list", () => {
  const atlasAsset = { schemaVersion: 1, id: "ui.test.atlas", kind: "atlas", status: "approved", requiredness: "required", lifecycle: { scope: "shared" }, source: { kind: "file", file: "/assets/test.png", atlasFile: "/assets/test.json", format: "png" }, runtime: { textureKey: "test-atlas" }, technical: { width: 128, height: 64, frameNames: ["idle", "pressed"] } };
  const manifest = { assets: [atlasAsset], prefabs: [], visualStates: [], animations: [], scenePacks: [], sceneInstances: [], legacyCompatibility: {} };
  const [entry] = createAssetLabCatalog(manifest);
  assert.deepEqual(entry.frameNames, ["idle", "pressed"]);
  assert.equal(entry.kind, "atlas");
  const sheet = fullCatalog().find(({ id }) => id === "character.animal.reference-sheet");
  assert.equal((sheet.asset.technical.width / sheet.asset.technical.frameWidth) * (sheet.asset.technical.height / sheet.asset.technical.frameHeight), 48);
});

test("catalog construction and filtering remain interactive at 5000 records", () => {
  const count = 5000;
  const manifest = {
    assets: Array.from({ length: count }, (_, index) => ({ id: `prop.synthetic.${index}`, kind: "image", status: "approved", source: { kind: "generated" }, technical: { width: 64, height: 64 } })),
    prefabs: [], visualStates: [], animations: [], scenePacks: [], sceneInstances: [], legacyCompatibility: {},
  };
  const started = performance.now(), catalog = createAssetLabCatalog(manifest), createdMs = performance.now() - started;
  const filterStarted = performance.now(), result = filterAssetLabCatalog(catalog, { query: "synthetic.4999" }), filteredMs = performance.now() - filterStarted;
  assert.equal(result.length, 1);
  assert.ok(createdMs < 750, `catalog took ${createdMs.toFixed(1)} ms`);
  assert.ok(filteredMs < 100, `filter took ${filteredMs.toFixed(1)} ms`);
});

test("Asset Lab has lazy loading, bounded paging, actionable states, reload, and touch-safe controls", async () => {
  const scene = await source("src/visual/dev/AssetLabScene.js");
  const catalog = await source("src/visual/dev/assetLabCatalog.js");
  assert.doesNotMatch(scene, /for \(const entry of this\.catalog\)[\s\S]{0,200}queuePhaserAsset/);
  for (const marker of ["LIST_PAGE_SIZE", "CONTACT_SHEET_PAGE_SIZE", "FALLBACK/PLACEHOLDER ACTIVE", "assetLabValidationSummary", "assetLabValidation", "#ensureSelectedLoaded", "#reloadSelected", "#inspectOpaqueBounds", "#scrubAnimation", "resolveHudSafeArea", "minimumTouchTargetCssPixels", "Show all issues"]) assert.match(scene, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(catalog, /placeholder-runtime-art-missing/);
});

test("generated production index reports missing, duplicate, orphan and contract diagnostics", () => {
  const validation = ASSET_LAB_PRODUCTION_INDEX.validation;
  for (const key of ["findings", "orphanedFiles", "unusedEntries", "duplicateContent", "registeredFiles", "runtimeFiles"]) assert.ok(Array.isArray(validation[key]), key);
  assert.equal(validation.orphanedFiles.length, 0);
  assert.equal(validation.unusedEntries.length, 0);
  assert.ok(validation.findings.every(({ code, message, severity }) => code && message && ["error", "warning"].includes(severity)));
});

test("per-asset validator findings become actionable invalid catalog records", () => {
  const base = KINDWORKS_VISUAL_MANIFEST.assets.find(({ id }) => id === "scene.fishing.reedbank.background");
  const manifest = { ...KINDWORKS_VISUAL_MANIFEST, assets: [base], prefabs: [], sceneInstances: [], visualStates: [], animations: [], scenePacks: [], legacyCompatibility: {}, fallbacks: {} };
  const productionIndex = { categoryContracts: [], familyRecords: [], assetContracts: {}, validation: { findings: [{ severity: "error", code: "missing-asset-file", message: "Registered file is missing.", assetId: base.id, expected: base.source.file, actual: "missing" }] } };
  const [entry] = createAssetLabCatalog(manifest, { productionIndex });
  assert.equal(entry.validationStatus, "invalid");
  assert.equal(entry.validationFindings[0].code, "missing-asset-file");
  assert.equal(entry.validationFindings[0].expected, base.source.file);
});

test("production build guard covers every repaired development marker", async () => {
  const guard = await source("scripts/verify-production-surface.mjs");
  for (const marker of ["AssetLabScene", "kw-asset-lab", "assetLabReady", "assetLabValidationSummary", "ASSET_LAB_CANDIDATE_INDEX", "Phase8BCandidatePreviewController", "candidatePreviewReady", "__kindworks-candidate"]) assert.match(guard, new RegExp(marker));
});
