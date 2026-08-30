import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { PHASE_8A_VERTICAL_SLICE_PACKAGE } from "../src/visual/verticalSlice/phase8aVerticalSlicePackage.js";
import { buildPhase8BCandidateIndex, renderPhase8BCandidateIndex } from "./lib/phase8bCandidateWorkflow.mjs";

const root = resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);
const valueAfter = (flag) => { const index = args.indexOf(flag); return index >= 0 ? args[index + 1] : null; };
const requestedAsset = valueAfter("--asset");
const all = args.includes("--all");
const clear = args.includes("--clear");
if (!requestedAsset && !all && !clear) throw new Error("Choose --asset <semantic-id>, --all, or --clear.");
if (requestedAsset && !PHASE_8A_VERTICAL_SLICE_PACKAGE.assets.some(({ semanticId }) => semanticId === requestedAsset)) throw new Error(`Unknown Phase 8B candidate contract: ${requestedAsset}`);

const selectedAssetIds = clear ? [] : requestedAsset ? [requestedAsset] : PHASE_8A_VERTICAL_SLICE_PACKAGE.assets.map(({ semanticId }) => semanticId);
if (clear) {
  const output = resolve(root, "src/visual/generated/assetLabCandidateIndex.js");
  await writeFile(output, renderPhase8BCandidateIndex({ schemaVersion: 1, packageId: PHASE_8A_VERTICAL_SLICE_PACKAGE.id, packageRevision: PHASE_8A_VERTICAL_SLICE_PACKAGE.revision, assets: {}, validation: { ok: true, findings: [] } }), "utf8");
  console.log("Asset Lab candidate index cleared. Staging bytes were not deleted.");
  process.exit(0);
}
const index = await buildPhase8BCandidateIndex(PHASE_8A_VERTICAL_SLICE_PACKAGE, root, { selectedAssetIds, requireSelected: true });
const output = resolve(root, "src/visual/generated/assetLabCandidateIndex.js");
await mkdir(resolve(root, "src/visual/generated"), { recursive: true });
await writeFile(output, renderPhase8BCandidateIndex(index), "utf8");

const selectedRecords = selectedAssetIds.map((id) => index.assets[id]).filter(Boolean);
for (const record of selectedRecords) console.log(`${record.semanticId}: ${record.validationStatus.toUpperCase()} — ${record.sourcePath} sha256=${record.candidateSha256} approval=${record.approvalStatus}`);
for (const item of index.validation.findings) {
  console.error(`${item.code}: ${item.message} [${item.path}]`);
  console.error(`  expected=${JSON.stringify(item.expected)} actual=${JSON.stringify(item.actual)}`);
}
if (!index.validation.ok) process.exitCode = 1;
else console.log(`Asset Lab candidate preparation: PASS — ${selectedRecords.length} selected candidate(s) validated from real staging bytes; human visual approval remains required.`);
