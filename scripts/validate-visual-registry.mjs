import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { KINDWORKS_VISUAL_MANIFEST } from "../src/visual/visualManifest.js";
import { validateVisualManifestFiles } from "../src/visual/validateVisualManifest.js";
import { auditRuntimeAssetCoverage, createRuntimeAssetInspector } from "./lib/runtimeAssetValidation.mjs";

const root = resolve(fileURLToPath(new URL("../", import.meta.url)));
const result = await validateVisualManifestFiles(KINDWORKS_VISUAL_MANIFEST, createRuntimeAssetInspector(root));
const coverage = await auditRuntimeAssetCoverage(root, KINDWORKS_VISUAL_MANIFEST);
if (!result.ok) {
  for (const finding of result.errors) console.error(`${finding.code}: ${finding.message} [asset=${finding.assetId || "n/a"} expected=${JSON.stringify(finding.expected)} actual=${JSON.stringify(finding.actual)} scenes=${finding.affectedScenes.join(",") || "none"}] (${finding.path})`);
  process.exitCode = 1;
} else {
  const fileAssets = KINDWORKS_VISUAL_MANIFEST.assets.filter((asset) => asset.source.kind === "file").length;
  for (const warning of result.warnings) console.warn(`${warning.code}: ${warning.message} (${warning.path})`);
  if (coverage.orphaned.length) {
    console.error(`orphaned-runtime-files: ${coverage.orphaned.join(", ")}`);
    process.exitCode = 1;
  }
  if (coverage.unusedEntries.length) {
    console.error(`unused-manifest-entries: ${coverage.unusedEntries.join(", ")}`);
    process.exitCode = 1;
  }
  for (const duplicate of coverage.duplicateContent) console.warn(`duplicate-asset-content: ${duplicate.paths.join(" = ")}`);
  if (!process.exitCode) console.log(`Visual registry valid: ${KINDWORKS_VISUAL_MANIFEST.assets.length} assets (${fileAssets} files), ${KINDWORKS_VISUAL_MANIFEST.prefabs.length} prefab, ${KINDWORKS_VISUAL_MANIFEST.sceneInstances.length} scene instance, ${KINDWORKS_VISUAL_MANIFEST.animations.length} animations, ${KINDWORKS_VISUAL_MANIFEST.scenePacks.length} scene packs; 0 orphan files and 0 unused entries.`);
}
