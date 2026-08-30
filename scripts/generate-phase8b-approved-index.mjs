import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { PHASE_8A_VERTICAL_SLICE_PACKAGE } from "../src/visual/verticalSlice/phase8aVerticalSlicePackage.js";
import { PHASE_8A_RUNTIME_DEFINITIONS } from "../src/visual/generated/phase8aVerticalSliceRuntime.js";
import { VISUAL_ASSET_KINDS } from "../src/visual/contracts.js";
import { PHASE_8B_APPROVAL_FILE, readPhase8BApprovals } from "./lib/phase8bCandidateWorkflow.mjs";

const root = resolve(import.meta.dirname, "..");
const approvals = await readPhase8BApprovals(root);
const approvalsById = {};
for (const approval of approvals.assets) {
  const contract = PHASE_8A_VERTICAL_SLICE_PACKAGE.assets.find(({ semanticId }) => semanticId === approval.semanticId);
  if (!contract) throw new Error(`${PHASE_8B_APPROVAL_FILE} references unknown asset ${approval.semanticId}.`);
  const bytes = await readFile(resolve(root, contract.expectedFilenames.runtime));
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  if (sha256 !== approval.candidateSha256) throw new Error(`${approval.semanticId} runtime bytes do not match the human-approved digest.`);
  approvalsById[approval.semanticId] = Object.freeze({
    ...approval,
    runtimeUrl: `/${contract.expectedFilenames.runtime.replace(/^public\//, "")}`,
  });
}
const approvedIds = new Set(Object.keys(approvalsById));
const assets = PHASE_8A_RUNTIME_DEFINITIONS.assets.filter(({ id }) => approvedIds.has(id)).map((asset) => {
  const approval = approvalsById[asset.id];
  return Object.freeze({
    ...asset,
    kind: asset.technical?.frameWidth ? VISUAL_ASSET_KINDS.SPRITESHEET : VISUAL_ASSET_KINDS.IMAGE,
    source: Object.freeze({ kind: "file", file: approval.runtimeUrl, format: "png", owner: "Phase8BApprovedArtwork" }),
    cache: Object.freeze({ version: approval.candidateSha256.slice(0, 12), contentSha256: approval.candidateSha256 }),
    status: "phase-8b-approved-runtime",
    provenance: approval,
  });
});
const prefabs = PHASE_8A_RUNTIME_DEFINITIONS.prefabs.filter((prefab) => prefab.layers.every(({ assetId }) => approvedIds.has(assetId)));
const prefabIds = new Set(prefabs.map(({ id }) => id));
const visualStates = PHASE_8A_RUNTIME_DEFINITIONS.visualStates.filter((state) => Object.values(state.states).every(({ prefabId }) => prefabIds.has(prefabId)));
const stateIds = new Set(visualStates.map(({ id }) => id));
const animations = PHASE_8A_RUNTIME_DEFINITIONS.animations.filter(({ assetId }) => approvedIds.has(assetId));
const animationIds = new Set(animations.map(({ id }) => id));
const sceneInstances = PHASE_8A_RUNTIME_DEFINITIONS.sceneInstances
  .filter(({ prefabId, stateId }) => prefabIds.has(prefabId) && stateIds.has(stateId))
  .map((instance) => Object.freeze({ ...instance, activation: "phase-8b-approved" }));
const scenePacks = PHASE_8A_RUNTIME_DEFINITIONS.scenePacks.map((pack) => ({
  ...pack,
  assetIds: pack.assetIds.filter((id) => approvedIds.has(id)),
  animationIds: pack.animationIds.filter((id) => animationIds.has(id)),
  activation: "phase-8b-approved",
})).filter((pack) => pack.assetIds.length);
const index = { schemaVersion: 1, assets, prefabs, visualStates, animations, sceneInstances, scenePacks };
const output = `// Generated from artwork/approvals/phase8b-approved-assets.v1.json. Do not hand-edit.\nexport const PHASE_8B_APPROVED_ASSET_INDEX = Object.freeze(${JSON.stringify(index, null, 2)});\n`;
await writeFile(resolve(root, "src/visual/generated/phase8bApprovedAssetIndex.js"), output, "utf8");
console.log(`Phase 8B approved index: ${assets.length} approved runtime asset(s).`);
