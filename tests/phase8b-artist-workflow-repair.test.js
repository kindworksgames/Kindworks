import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import sharp from "sharp";

import { KINDWORKS_VISUAL_MANIFEST } from "../src/visual/visualManifest.js";
import { createPhase8AAssetLabManifest } from "../src/visual/dev/phase8aAssetLabManifest.js";
import { createAssetLabCatalog } from "../src/visual/dev/assetLabCatalog.js";
import { PHASE_8B_APPROVED_ASSET_INDEX } from "../src/visual/generated/phase8bApprovedAssetIndex.js";
import { PHASE_8A_ASSET_IDS, PHASE_8A_VERTICAL_SLICE_PACKAGE } from "../src/visual/verticalSlice/phase8aVerticalSlicePackage.js";
import { buildPhase8BCandidateIndex, validatePhase8BCandidate } from "../scripts/lib/phase8bCandidateWorkflow.mjs";

const root = resolve(import.meta.dirname, "..");
const source = (path) => readFile(resolve(root, path), "utf8");

test("candidate intake validates real bytes rather than contract metadata alone", async () => {
  const temporary = await mkdtemp(resolve(tmpdir(), "kw-phase8b-"));
  try {
    const asset = structuredClone(PHASE_8A_VERTICAL_SLICE_PACKAGE.assets.find(({ semanticId }) => semanticId === PHASE_8A_ASSET_IDS.GRASS));
    asset.expectedFilenames.staging = "artwork/staging/proof.png";
    let result = await validatePhase8BCandidate(asset, temporary, { requireFile: true });
    assert.equal(result.ok, false);
    assert.equal(result.errors[0].code, "missing-candidate-file");
    const file = resolve(temporary, asset.expectedFilenames.staging);
    await mkdir(dirname(file), { recursive: true });
    await sharp({ create: { width: 32, height: 32, channels: 3, background: "#55aa55" } }).png().toFile(file);
    result = await validatePhase8BCandidate(asset, temporary, { requireFile: true });
    assert.equal(result.ok, false);
    assert.ok(result.errors.some(({ code }) => code === "candidate-dimension-mismatch"));
    await sharp({ create: { width: 64, height: 64, channels: 3, background: "#55aa55" } }).png().toFile(file);
    result = await validatePhase8BCandidate(asset, temporary, { requireFile: true });
    assert.equal(result.ok, true, result.errors.map(({ code }) => code).join(", "));
    assert.equal(result.record.approvalStatus, "human-review-required");
  } finally { await rm(temporary, { recursive: true, force: true }); }
});

test("prepared candidates replace only Asset Lab presentation metadata", async () => {
  const temporary = await mkdtemp(resolve(tmpdir(), "kw-phase8b-index-"));
  try {
    const packageDefinition = structuredClone(PHASE_8A_VERTICAL_SLICE_PACKAGE);
    const asset = packageDefinition.assets.find(({ semanticId }) => semanticId === PHASE_8A_ASSET_IDS.BIN);
    asset.expectedFilenames.staging = "artwork/staging/bin.png";
    const file = resolve(temporary, asset.expectedFilenames.staging);
    await mkdir(dirname(file), { recursive: true });
    await sharp({ create: { width: asset.output.canvas.width, height: asset.output.canvas.height, channels: 4, background: { r: 30, g: 120, b: 70, alpha: 1 } } }).png().toFile(file);
    const index = await buildPhase8BCandidateIndex(packageDefinition, temporary, { selectedAssetIds: [asset.semanticId], requireSelected: true });
    assert.equal(index.validation.ok, true);
    const manifest = createPhase8AAssetLabManifest(KINDWORKS_VISUAL_MANIFEST);
    const entry = createAssetLabCatalog(manifest, { candidateIndex: index }).find(({ id }) => id === asset.semanticId);
    assert.equal(entry.asset.source.owner, "Phase8BCandidateWorkflow");
    assert.equal(entry.asset.source.file, index.assets[asset.semanticId].sourceUrl);
    assert.equal(entry.validationStatus, "valid");
    assert.equal(entry.approvalStatus, "human-review-required");
    assert.equal(manifest.assets.find(({ id }) => id === asset.semanticId).source.owner, "Phase8AVerticalSlicePlaceholder");
  } finally { await rm(temporary, { recursive: true, force: true }); }
});

test("candidate preview cannot mutate input or gameplay geometry", async () => {
  const preview = await source("src/visual/dev/Phase8BCandidatePreviewController.js");
  for (const marker of ["disableInteractive", "gameplayGeometryLocked", "candidateGeometrySignature", "developmentOnly"]) assert.match(preview, new RegExp(marker));
  assert.doesNotMatch(preview, /setInteractive|physics\.add|repository\.save|gameState\./);
  const main = await source("src/main.js");
  assert.match(main, /import\.meta\.env\.DEV && qaMode === "candidate-preview"/);
  assert.match(main, /candidatePreviewReady = candidateUnavailable \? "unavailable" : "failed"/);
  assert.match(main, /Candidate preview is unavailable until the selected asset is prepared/);
});

test("promotion and preview retain an explicit human gate and production exclusion", async () => {
  const approval = await source("scripts/approve-artwork-candidate.mjs");
  for (const marker of ["--reviewer", "--token", "--confirm", 'confirm !== "APPROVE"', "Refusing to overwrite", "candidateSha256"]) assert.match(approval, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  const vite = await source("vite.config.js");
  assert.match(vite, /apply: "serve"/);
  assert.match(vite, /artwork\/staging/);
  const packageJson = JSON.parse(await source("package.json"));
  assert.ok(packageJson.scripts["assetlab:prepare"]);
  assert.ok(packageJson.scripts["assetlab:approve"]);
  assert.ok(packageJson.scripts["assetlab:place"]);
  assert.ok(packageJson.scripts["assetlab:reference"]);
  assert.match(packageJson.scripts.prebuild, /generate-phase8b-approved-index/);
});

test("human approval feeds the normal semantic manifest without scene edits", async () => {
  const manifest = await source("src/visual/phase8bApprovedManifest.js");
  const generator = await source("scripts/generate-phase8b-approved-index.mjs");
  const approval = await source("scripts/approve-artwork-candidate.mjs");
  assert.match(manifest, /PHASE_8B_APPROVED_ASSET_INDEX/);
  assert.match(generator, /Phase8BApprovedArtwork/);
  assert.match(generator, /runtime bytes do not match the human-approved digest/);
  assert.match(approval, /generate-phase8b-approved-index/);
  assert.doesNotMatch(manifest, /TownScene|LawnCareScene/);
});

test("approved runtime assets retain their production byte budgets", () => {
  for (const asset of PHASE_8B_APPROVED_ASSET_INDEX.assets) {
    const contract = PHASE_8A_VERTICAL_SLICE_PACKAGE.assets.find(({ semanticId }) => semanticId === asset.id);
    assert.ok(contract, `${asset.id} must retain a Phase 8A contract`);
    assert.equal(asset.validation.maximumRuntimeBytes, contract.validation.maximumRuntimeBytes);
    assert.equal(asset.validation.maximumDimension, 4096);
  }
});

test("Asset Lab placeholders do not duplicate approved runtime definitions", () => {
  const manifest = createPhase8AAssetLabManifest(KINDWORKS_VISUAL_MANIFEST);
  for (const section of ["assets", "prefabs", "sceneInstances", "visualStates", "animations", "scenePacks"]) {
    const ids = manifest[section].map(({ id }) => id);
    assert.equal(new Set(ids).size, ids.length, `${section} must retain unique semantic IDs`);
  }
  for (const approved of PHASE_8B_APPROVED_ASSET_INDEX.assets) {
    assert.equal(manifest.assets.find(({ id }) => id === approved.id)?.source?.owner, "Phase8BApprovedArtwork");
  }
  const townPack = manifest.scenePacks.find(({ id }) => id === "pack.phase-8a.town-block");
  assert.ok(townPack.assetIds.includes(PHASE_8A_ASSET_IDS.GRASS));
  assert.ok(townPack.assetIds.includes(PHASE_8A_ASSET_IDS.HOUSE));
});

test("candidate references are explicit, validated, and development-only", async () => {
  const workflow = await source("scripts/lib/phase8bCandidateWorkflow.mjs");
  const setter = await source("scripts/set-candidate-reference.mjs");
  const vite = await source("vite.config.js");
  assert.match(workflow, /candidate-reference-dimension-mismatch/);
  assert.match(workflow, /referenceStatus/);
  assert.match(setter, /artwork\/references\//);
  assert.match(vite, /__kindworks-candidate-reference/);
  assert.match(vite, /apply: "serve"/);
});

test("Phase 8A gate accepts review staging but blocks unapproved promotion", async () => {
  const validator = await source("scripts/validate-phase8a-production-package.mjs");
  assert.match(validator, /validatePhase8BCandidate/);
  assert.match(validator, /unapproved-artwork-promoted/);
  assert.doesNotMatch(validator, /for \(const path of Object\.values\(asset\.expectedFilenames\)\)/);
});
