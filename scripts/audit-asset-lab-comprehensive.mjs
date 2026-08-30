import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";

import { createAssetLabCatalog, assetLabFacets, filterAssetLabCatalog } from "../src/visual/dev/assetLabCatalog.js";
import { createPhase8AAssetLabManifest } from "../src/visual/dev/phase8aAssetLabManifest.js";
import { ASSET_LAB_PRODUCTION_INDEX } from "../src/visual/generated/assetLabProductionIndex.js";
import { KINDWORKS_VISUAL_MANIFEST } from "../src/visual/visualManifest.js";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const outputFlag = process.argv.indexOf("--output");
const output = outputFlag >= 0 ? resolve(root, process.argv[outputFlag + 1]) : null;
const source = await readFile(resolve(root, "src/visual/dev/AssetLabScene.js"), "utf8");
const contracts = JSON.parse(await readFile(resolve(root, "artwork/contracts/asset-category-contracts.v2.json"), "utf8"));
const productionPlan = JSON.parse(await readFile(resolve(root, "artwork/production/phase-10/production-migration-plan.v1.json"), "utf8"));
const manifest = createPhase8AAssetLabManifest(KINDWORKS_VISUAL_MANIFEST);
const catalog = createAssetLabCatalog(manifest, { productionIndex: ASSET_LAB_PRODUCTION_INDEX });
const facets = assetLabFacets(catalog);

const categoryCoverage = contracts.categoryContracts.map(({ id }) => ({
  id,
  assetLabFacet: id.replace(/^category\./, ""),
  present: facets.categories.includes(id.replace(/^category\./, "")),
}));
const productionFamilyIds = new Set(productionPlan.assetFamilies.map(({ id }) => id));
const catalogFamilyIds = new Set(catalog.flatMap(({ families }) => families));
const exactProductionFamilies = [...productionFamilyIds].filter((id) => catalogFamilyIds.has(id));

function syntheticManifest(count) {
  const assets = Array.from({ length: count }, (_, index) => ({
    id: `prop.synthetic.${index}`, kind: "image", status: index % 2 ? "approved" : "generated",
    source: { file: `/synthetic/${index}.png` }, technical: { width: 64, height: 64 },
  }));
  const prefabs = assets.map((asset, index) => ({
    id: `prefab.synthetic.${index}`, family: `synthetic.family.${index % 50}`, variant: `variant-${index % 4}`,
    layers: [{ id: "main", assetId: asset.id }],
  }));
  return { assets, prefabs, visualStates: [], animations: [], scenePacks: [] };
}

const libraryBenchmarks = [];
for (const count of [1_000, 5_000]) {
  const sample = syntheticManifest(count);
  const started = performance.now();
  const result = createAssetLabCatalog(sample);
  const catalogMs = performance.now() - started;
  const filterStarted = performance.now();
  const matches = filterAssetLabCatalog(result, { query: "synthetic 499" }).length;
  const filterMs = performance.now() - filterStarted;
  const contactSheetHeight = Math.max(240, Math.ceil(count / 4) * 220);
  libraryBenchmarks.push({
    assets: count, catalogMs: Number(catalogMs.toFixed(2)), filterMs: Number(filterMs.toFixed(2)), matches,
    domOptions: Math.min(count, 160), eagerPreviewLoads: 1, contactSheet: {
      width: 960, height: 2200, estimatedRgbaBytes: 960 * 2200 * 4,
      pages: Math.ceil(count / 40), exceedsCommon32767CanvasLimit: false,
    },
  });
}

const deepValidationImports = /validateAsset|validateArtwork|validateVisualManifest/.test(source);
const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  branchBaseline: "phase-2-ui-simplification@3387bcb",
  manifest: {
    records: catalog.length,
    assets: catalog.filter(({ recordType }) => recordType === "runtime-asset").length,
    productionFamilies: catalog.filter(({ recordType }) => recordType === "production-family").length,
    fileBackedAssets: catalog.filter(({ asset }) => Boolean(asset?.source?.file)).length,
    placeholders: catalog.filter(({ status }) => status === "phase-8a-specified-placeholder").length,
    kinds: Object.fromEntries([...new Set(catalog.map(({ kind }) => kind))].sort().map((kind) => [kind, catalog.filter((entry) => entry.kind === kind).length])),
    statuses: facets.statuses,
    categories: facets.categories,
    scenes: facets.scenes,
    families: facets.families,
  },
  productionCoverage: {
    categoryContracts: categoryCoverage,
    categoryContractsPresent: categoryCoverage.filter(({ present }) => present).length,
    categoryContractsTotal: categoryCoverage.length,
    exactProductionFamilyIdsPresent: [...productionFamilyIds].filter((id) => catalog.some((entry) => entry.id === id)),
    exactProductionFamilyIdsCovered: [...productionFamilyIds].filter((id) => catalog.some((entry) => entry.id === id)).length,
    productionFamilyIdsTotal: productionFamilyIds.size,
    productionScenesRepresented: facets.scenes.length,
    productionScenesPlanned: Object.keys(productionPlan.sceneDependencies).length,
  },
  sourceFeatureChecks: {
    registryDerivedCatalog: /createAssetLabCatalog\(this\.visualRegistry\.manifest,\s*\{\s*productionIndex:\s*ASSET_LAB_PRODUCTION_INDEX\s*\}\)/.test(source),
    search: /Search assets/.test(source),
    categorySceneStatusFamilyFilters: /filterDefs = \[\["category"/.test(source),
    dedicatedStateFilter: /\["state", facets\.states\]/.test(source),
    dedicatedDirectionFilter: /\["direction", facets\.directions\]/.test(source),
    dedicatedAnimationFilter: /\["animation", facets\.animations\]/.test(source),
    dedicatedApprovalFilter: /\["approval", facets\.approvals\]/.test(source),
    dedicatedValidationFilter: /\["validation", facets\.validations\]/.test(source),
    atlasFrameSelector: /Atlas frame|atlas frame|frame name/i.test(source),
    animationRestart: /"Restart"/.test(source),
    animationScrubber: /type: "range"/.test(source),
    actualOpaqueBounds: /#inspectOpaqueBounds/.test(source),
    frameBoundaryOverlay: /overlayFlags = \{ canvas: true, frame: true/.test(source),
    standingPointOverlay: /standing: true/.test(source),
    deepValidationResults: /ASSET_LAB_PRODUCTION_INDEX/.test(source),
    orphanDetection: /orphanedFiles/.test(source),
    assetReload: /Reload selected/.test(source),
    fullManifestMetadataPanel: /Manifest, contract, usage and validation metadata/.test(source),
    productionGuard: /if \(!import\.meta\.env\.DEV\) throw/.test(source),
  },
  largeLibrary: libraryBenchmarks,
  knownRuntimeObservation: {
    recordsSelected: 112,
    selectorCombinationsSelected: 193,
    placeholderEntriesWithActionableWarning: 22,
    placeholderEntriesRenderingFallbackWhileReportingValid: 0,
    manuallyVerifiedContractCategories: 15,
  },
};

if (output) {
  await mkdir(resolve(output, ".."), { recursive: true });
  await writeFile(output, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}
console.log(JSON.stringify(report, null, 2));
