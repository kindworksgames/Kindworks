import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  applyArtworkFixtureMutation,
  validateArtworkManifest,
} from "./lib/artworkPipelineValidation.mjs";
import { renderArtworkRuntimePackModule } from "./lib/artworkRuntimePackGenerator.mjs";

const root = resolve(fileURLToPath(new URL("../", import.meta.url)));
const manifestPath = resolve(root, "artwork/specifications/kindworks-artwork-manifest.v1.json");
const generatedPath = resolve(root, "src/visual/generated/artworkRuntimePacks.js");
const contractCatalog = JSON.parse(await readFile(resolve(root, "artwork/contracts/asset-category-contracts.v2.json"), "utf8"));
const fixtureNames = (await readdir(resolve(root, "artwork/fixtures/invalid")))
  .filter((name) => name.endsWith(".json"))
  .map((name) => name.replace(/\.json$/, ""))
  .sort();
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const result = await validateArtworkManifest(manifest, { root, categoryContracts: contractCatalog.categoryContracts, familyAssignments: contractCatalog.familyAssignments });
const failures = [];

if (!result.ok) failures.push(...result.errors.map((finding) => `valid-sample:${finding.code}:${finding.message}`));

for (const fixtureName of fixtureNames) {
  const fixture = JSON.parse(await readFile(resolve(root, `artwork/fixtures/invalid/${fixtureName}.json`), "utf8"));
  const invalidManifest = applyArtworkFixtureMutation(manifest, fixture);
  const invalidResult = await validateArtworkManifest(invalidManifest, { root, categoryContracts: contractCatalog.categoryContracts, familyAssignments: contractCatalog.familyAssignments });
  const codes = new Set(invalidResult.errors.map(({ code }) => code));
  if (invalidResult.ok) failures.push(`${fixtureName}:invalid fixture was accepted`);
  for (const expected of fixture.expectedCodes) if (!codes.has(expected)) failures.push(`${fixtureName}:expected ${expected}, received ${[...codes].join(",") || "none"}`);
}

const expectedGenerated = renderArtworkRuntimePackModule(manifest);
const actualGenerated = await readFile(generatedPath, "utf8").catch(() => "");
if (actualGenerated !== expectedGenerated) failures.push("generated-runtime-pack:stale-or-missing");

if (failures.length) {
  failures.forEach((failure) => console.error(failure));
  process.exitCode = 1;
} else {
  const metadata = result.metadata.get(manifest.assets[0].semanticId);
  console.log(`Artwork pipeline: PASS — ${manifest.assets.length} valid staged sample; ${fixtureNames.length} invalid fixtures rejected.`);
  console.log(`Validated runtime: ${metadata.runtime.width}x${metadata.runtime.height} ${metadata.runtime.format}, alpha=${metadata.runtime.alpha}, ${metadata.runtime.bytes} bytes.`);
  console.log(`Generated packs are current: ${generatedPath.replace(`${root}/`, "")}.`);
}
