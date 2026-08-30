import { readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const FORBIDDEN_PRODUCTION_SURFACE_MARKERS = Object.freeze([
  "__KINDWORKS_PHASER_GAME__",
  "__KINDWORKS_PHASER__",
  "KindWorksSpriteAI",
  "milestone25Systems",
  "milestone26Systems",
  "milestone27Systems",
  "milestone28Systems",
  "milestone29Systems",
  "milestone30Systems",
  "townPlacementDefinitions",
  "npcResidents",
  "customResidentCreated",
  "environmentCleanliness",
  "beachCatalogueValid",
  "powerwashCatalogueValid",
  "spriteAiDomTotal",
  "spriteAiPhaserTotal",
  "saveSchema",
  "ReferenceOverlayController",
  "kw-reference-overlay",
  "referenceOverlayReady",
  "ScaleCalibrationScene",
  "kw-scale-calibration",
  "scaleCalibrationReady",
  "AssetLabScene",
  "kw-asset-lab",
  "assetLabReady",
  "assetLabValidationSummary",
  "assetLabValidation",
  "assetLabApproval",
  "ASSET_LAB_PRODUCTION_INDEX",
  "ASSET_LAB_CANDIDATE_INDEX",
  "Phase8BCandidatePreviewController",
  "candidatePreviewReady",
  "__kindworks-candidate",
  "SceneQaOverlayController",
  "kw-scene-qa",
  "sceneQaReady",
  "artwork/fixtures/invalid",
]);

export function auditProductionSurface(files, markers = FORBIDDEN_PRODUCTION_SURFACE_MARKERS) {
  const findings = [];
  for (const file of files) {
    for (const marker of markers) {
      if (file.content.includes(marker)) findings.push({ file: file.name, marker });
    }
  }
  return Object.freeze({ ok: findings.length === 0, findings: Object.freeze(findings) });
}

function loadProductionFiles(rootDirectory) {
  const assetsDirectory = resolve(rootDirectory, "dist/assets");
  return readdirSync(assetsDirectory)
    .filter((name) => name.endsWith(".js"))
    .map((name) => ({ name, content: readFileSync(resolve(assetsDirectory, name), "utf8") }));
}

function run() {
  const scriptDirectory = dirname(fileURLToPath(import.meta.url));
  const rootDirectory = resolve(scriptDirectory, "..");
  const result = auditProductionSurface(loadProductionFiles(rootDirectory));
  if (!result.ok) {
    console.error("Production surface: FAIL");
    for (const finding of result.findings) console.error(`- ${finding.marker} remains in ${finding.file}`);
    process.exitCode = 1;
    return;
  }
  console.log("Production surface: PASS");
  console.log(`${FORBIDDEN_PRODUCTION_SURFACE_MARKERS.length} development-only markers are absent from production JavaScript.`);
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) run();
