import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { validateArtworkManifest } from "./lib/artworkPipelineValidation.mjs";
import { renderAssetContractCatalog, validateAssetCategoryCatalog } from "./lib/assetContractCatalog.mjs";
import { PHASE_8A_VERTICAL_SLICE_PACKAGE } from "../src/visual/verticalSlice/phase8aVerticalSlicePackage.js";
import { validatePhase8APackage } from "../src/visual/verticalSlice/validatePhase8APackage.js";

const run = promisify(execFile);
const root = resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);
const valueAfter = (flag) => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : null;
};
const requestedAsset = valueAfter("--asset");
const requestedCategory = valueAfter("--category");
const changed = args.includes("--changed") || valueAfter("--scope") === "changed";
const full = valueAfter("--scope") === "full" || (!requestedAsset && !requestedCategory && !changed);

const [manifestText, catalogText, planText] = await Promise.all([
  readFile(resolve(root, "artwork/specifications/kindworks-artwork-manifest.v1.json"), "utf8"),
  readFile(resolve(root, "artwork/contracts/asset-category-contracts.v2.json"), "utf8"),
  readFile(resolve(root, "artwork/production/phase-10/production-migration-plan.v1.json"), "utf8"),
]);
const manifest = JSON.parse(manifestText), catalog = JSON.parse(catalogText), plan = JSON.parse(planText);
const errors = [];
const catalogValidation = validateAssetCategoryCatalog({ categoryContracts: catalog.categoryContracts, familyAssignments: catalog.familyAssignments, phase10Plan: plan });
errors.push(...catalogValidation.errors);
if (catalogText !== renderAssetContractCatalog(plan)) errors.push({ code: "stale-contract-catalog", message: "The generated category-contract catalog is stale.", path: "artwork/contracts/asset-category-contracts.v2.json", remediation: "Run pnpm run assets:contracts:export." });

const allAssets = [
  ...manifest.assets.map((asset) => ({ ...asset, source: "production" })),
  ...PHASE_8A_VERTICAL_SLICE_PACKAGE.assets.map((asset) => ({ ...asset, source: "phase8a" })),
];
let selectedIds = new Set(allAssets.map(({ semanticId }) => semanticId));
let selectionLabel = "full project";

if (requestedAsset) {
  selectedIds = new Set([requestedAsset]);
  selectionLabel = `asset ${requestedAsset}`;
  if (!allAssets.some(({ semanticId }) => semanticId === requestedAsset)) errors.push({ code: "unknown-selected-asset", message: `No contract exists for ${requestedAsset}.`, path: "--asset", expected: allAssets.map(({ semanticId }) => semanticId), actual: requestedAsset, remediation: "Use a registered semantic asset ID." });
} else if (requestedCategory) {
  selectedIds = new Set(allAssets.filter(({ categoryContractId }) => categoryContractId === requestedCategory).map(({ semanticId }) => semanticId));
  selectionLabel = `category ${requestedCategory}`;
  if (!catalogValidation.indexes.categoryById.has(requestedCategory)) errors.push({ code: "unknown-selected-category", message: `No category contract exists for ${requestedCategory}.`, path: "--category", expected: [...catalogValidation.indexes.categoryById.keys()], actual: requestedCategory, remediation: "Use a registered category contract ID." });
} else if (changed) {
  const changedFiles = new Set();
  for (const commandArgs of [["diff", "--name-only"], ["diff", "--name-only", "--cached"], ["ls-files", "--others", "--exclude-standard"]]) {
    const { stdout = "" } = await run("git", commandArgs, { cwd: root }).catch(() => ({ stdout: "" }));
    stdout.split(/\r?\n/).filter(Boolean).forEach((file) => changedFiles.add(file));
  }
  const contractInfrastructureChanged = [...changedFiles].some((file) => /^(scripts\/.*asset|scripts\/.*artwork|src\/visual\/artwork|src\/visual\/verticalSlice|artwork\/contracts|artwork\/specifications|artwork\/production\/phase-(8a|10)|package\.json)/.test(file));
  selectedIds = contractInfrastructureChanged ? new Set(allAssets.map(({ semanticId }) => semanticId)) : new Set(allAssets.filter((asset) => Object.values(asset.expectedFilenames || {}).some((file) => changedFiles.has(file))).map(({ semanticId }) => semanticId));
  selectionLabel = `changed assets (${selectedIds.size}; ${changedFiles.size} changed files inspected)`;
}

const selectedProductionIds = new Set(manifest.assets.filter(({ semanticId }) => selectedIds.has(semanticId)).map(({ semanticId }) => semanticId));
const productionValidation = await validateArtworkManifest(manifest, {
  root,
  validateFiles: full || changed || selectedProductionIds.size > 0,
  selectedAssetIds: full ? null : selectedProductionIds,
  categoryContracts: catalog.categoryContracts,
  familyAssignments: catalog.familyAssignments,
});
errors.push(...productionValidation.errors);

const includesPhase8A = full || [...selectedIds].some((id) => PHASE_8A_VERTICAL_SLICE_PACKAGE.assets.some(({ semanticId }) => semanticId === id));
if (includesPhase8A) errors.push(...validatePhase8APackage().errors);

if (errors.length) {
  for (const finding of errors) {
    console.error(`${finding.code}: ${finding.message} [${finding.path || "unknown"}]`);
    if (finding.expected != null || finding.actual != null) console.error(`  expected=${JSON.stringify(finding.expected)} actual=${JSON.stringify(finding.actual)}`);
    if (finding.remediation) console.error(`  fix: ${finding.remediation}`);
  }
  process.exitCode = 1;
} else {
  console.log(`Asset contracts: PASS — ${selectionLabel}; ${catalog.categoryContracts.length} supported categories, ${catalog.familyAssignments.length}/74 Phase 10 families, ${selectedIds.size} selected semantic assets.`);
  if (!full && selectedIds.size === 0) console.log("No changed runtime artwork or contract infrastructure requires file validation.");
}
