import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { PRODUCTION_SCENE_IDS, SCENE_LAYOUT_CATALOGUE, SCENE_LAYOUT_CATALOGUE_DIGEST, SCENE_LAYOUT_PRODUCTION_SIGNATURE } from "../src/visual/layouts/sceneLayoutCatalog.js";

const assets = resolve(new URL("../dist/assets", import.meta.url).pathname);
const files = (await readdir(assets)).filter((file) => file.endsWith(".js"));
const bundle = (await Promise.all(files.map((file) => readFile(join(assets, file), "utf8")))).join("\n");
const missing = [];
if (!bundle.includes(SCENE_LAYOUT_PRODUCTION_SIGNATURE)) missing.push("exact production catalogue signature");
for (const sceneId of PRODUCTION_SCENE_IDS) if (!bundle.includes(sceneId)) missing.push(`scene ${sceneId}`);
if (!bundle.includes("sceneLayoutCatalogueDigest")) missing.push("production catalogue digest marker");
if (missing.length) {
  console.error(`Production scene-layout verification failed: ${missing.join(", ")}`);
  process.exitCode = 1;
} else {
  console.log(`Production scene-layout bundle verified: ${SCENE_LAYOUT_CATALOGUE.length} layouts, ${PRODUCTION_SCENE_IDS.length} scenes, digest ${SCENE_LAYOUT_CATALOGUE_DIGEST}.`);
}
