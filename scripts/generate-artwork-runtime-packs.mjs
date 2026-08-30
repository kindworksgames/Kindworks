import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validateArtworkManifest } from "./lib/artworkPipelineValidation.mjs";
import { renderArtworkRuntimePackModule } from "./lib/artworkRuntimePackGenerator.mjs";

const root = resolve(fileURLToPath(new URL("../", import.meta.url)));
const manifestPath = resolve(root, "artwork/specifications/kindworks-artwork-manifest.v1.json");
const outputPath = resolve(root, "src/visual/generated/artworkRuntimePacks.js");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const contractCatalog = JSON.parse(await readFile(resolve(root, "artwork/contracts/asset-category-contracts.v2.json"), "utf8"));
const validation = await validateArtworkManifest(manifest, { root, categoryContracts: contractCatalog.categoryContracts, familyAssignments: contractCatalog.familyAssignments });
if (!validation.ok) {
  for (const finding of validation.errors) console.error(`${finding.code}: ${finding.message} (${finding.path})`);
  process.exitCode = 1;
} else {
  await writeFile(outputPath, renderArtworkRuntimePackModule(manifest), "utf8");
  console.log(`Generated runtime artwork packs: ${manifest.assets.length} validated asset specification(s).`);
}
