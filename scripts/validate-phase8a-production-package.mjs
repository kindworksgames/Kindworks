import { access, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { KINDWORKS_VISUAL_MANIFEST } from "../src/visual/visualManifest.js";
import { createPhase8AAssetLabManifest } from "../src/visual/dev/phase8aAssetLabManifest.js";
import { PHASE_8A_RUNTIME_DEFINITIONS as GENERATED_PHASE_8A_RUNTIME_DEFINITIONS } from "../src/visual/generated/phase8aVerticalSliceRuntime.js";
import { PHASE_8A_VERTICAL_SLICE_PACKAGE } from "../src/visual/verticalSlice/phase8aVerticalSlicePackage.js";
import { validatePhase8APackage } from "../src/visual/verticalSlice/validatePhase8APackage.js";
import {
  renderPhase8ADependencyOrder,
  renderPhase8APackageJson,
  renderPhase8APromptBook,
  renderPhase8ARuntimeModule,
} from "./lib/phase8aProductionPackageRenderer.mjs";
import { readPhase8BApprovals, validatePhase8BCandidate } from "./lib/phase8bCandidateWorkflow.mjs";

const root = resolve(fileURLToPath(new URL("../", import.meta.url)));
const result = validatePhase8APackage({ runtimeDefinitions: GENERATED_PHASE_8A_RUNTIME_DEFINITIONS, visualManifest: createPhase8AAssetLabManifest(KINDWORKS_VISUAL_MANIFEST) });
const errors = [...result.errors];

const approvals = await readPhase8BApprovals(root);
let stagedCandidates = 0;
for (const asset of PHASE_8A_VERTICAL_SLICE_PACKAGE.assets) {
  const candidate = await validatePhase8BCandidate(asset, root, { requireFile: false, approvals });
  if (candidate.record) {
    stagedCandidates += 1;
    errors.push(...candidate.errors.map((entry) => ({ ...entry, message: `Staged candidate is invalid: ${entry.message}` })));
  }
  for (const kind of ["master", "runtime"]) {
    const path = asset.expectedFilenames[kind];
    try {
      const bytes = await readFile(resolve(root, path));
      const sha256 = createHash("sha256").update(bytes).digest("hex");
      const approval = approvals.assets.find((entry) => entry.semanticId === asset.semanticId && entry.candidateSha256 === sha256);
      if (!approval) errors.push({ code: "unapproved-artwork-promoted", message: `${asset.semanticId} exists at ${path} without a matching explicit approval record.`, path });
    } catch (error) {
      if (error?.code !== "ENOENT") errors.push({ code: "artwork-read-failed", message: `${asset.semanticId} could not be read at ${path}.`, path });
    }
  }
}

for (const sceneFile of ["src/scenes/TownScene.js", "src/scenes/LawnCareScene.js"]) {
  const source = await readFile(resolve(root, sceneFile), "utf8");
  if (/phase-8a|PHASE_8A|verticalSlice/i.test(source)) errors.push({ code: "scene-specific-phase8a-coupling", message: `${sceneFile} directly references the production package.`, path: sceneFile });
}

const generatedOutputs = [
  ["artwork/production/phase-8a/vertical-slice-production-package.v1.json", renderPhase8APackageJson(PHASE_8A_VERTICAL_SLICE_PACKAGE)],
  ["artwork/production/phase-8a/GENERATOR_PROMPTS.md", renderPhase8APromptBook(PHASE_8A_VERTICAL_SLICE_PACKAGE)],
  ["artwork/production/phase-8a/DEPENDENCY_ORDER.md", renderPhase8ADependencyOrder(PHASE_8A_VERTICAL_SLICE_PACKAGE)],
  ["src/visual/generated/phase8aVerticalSliceRuntime.js", renderPhase8ARuntimeModule(PHASE_8A_VERTICAL_SLICE_PACKAGE)],
];
for (const [path, expected] of generatedOutputs) {
  const actual = await readFile(resolve(root, path), "utf8").catch(() => "");
  if (actual !== expected) errors.push({ code: "stale-production-package-output", message: `${path} is missing or stale; run npm run phase8a:export.`, path });
}

if (errors.length) {
  for (const error of errors) console.error(`${error.code}: ${error.message} (${error.path})`);
  process.exitCode = 1;
} else {
  console.log(`Phase 8A package: PASS — ${result.counts.assets} assets, ${result.counts.families} family contracts, ${result.counts.prefabs} prefabs, ${result.counts.states} state maps, ${result.counts.animations} animations, ${result.counts.placements} stable placements, ${result.counts.waves} dependency waves.`);
  console.log(`${stagedCandidates} staging candidate(s) accepted for review; approved master/runtime files require matching human approval records.`);
  console.log("TownScene and LawnCareScene contain no Phase 8A asset coupling; replacement remains registry/manifest-only.");
}
