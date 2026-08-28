import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const projectRoot = path.resolve(import.meta.dirname, "..");
const sourcePath = path.join(projectRoot, "kindworks_little_bakery_v65_house_rescue_reintegrated_fixed.html");
const outputDirectory = path.join(projectRoot, "public", "assets", "legacy-reference");
const source = await readFile(sourcePath, "utf8");

const harbour = source.match(/\.harbourCard\{[^}]*url\("data:image\/webp;base64,([A-Za-z0-9+/=]+)"\)/s)?.[1];
const fishingBlock = source.slice(source.indexOf("FISHING_REFERENCE_ART"), source.indexOf("FISHING_REFERENCE_ART") + 1_000_000);
const fish = fishingBlock.match(/fish:\s*"data:image\/webp;base64,([A-Za-z0-9+/=]+)"/)?.[1];
const magnet = fishingBlock.match(/magnet:\s*"data:image\/webp;base64,([A-Za-z0-9+/=]+)"/)?.[1];

const assets = {
  harbourGeneral: { filename: "harbour-general.webp", encoded: harbour },
  fishing: { filename: "fishing.webp", encoded: fish },
  magnetFishing: { filename: "magnet-fishing.webp", encoded: magnet },
};

await mkdir(outputDirectory, { recursive: true });
const manifest = { source: path.basename(sourcePath), assets: {} };
for (const [id, asset] of Object.entries(assets)) {
  if (!asset.encoded) throw new Error(`${id} was not found in the protected HTML.`);
  const buffer = Buffer.from(asset.encoded, "base64");
  if (buffer.subarray(0, 4).toString("ascii") !== "RIFF" || buffer.subarray(8, 12).toString("ascii") !== "WEBP") {
    throw new Error(`${id} is not a valid WebP image.`);
  }
  const sha256 = createHash("sha256").update(buffer).digest("hex");
  await writeFile(path.join(outputDirectory, asset.filename), buffer);
  manifest.assets[id] = { filename: asset.filename, sha256, bytes: buffer.length };
}
await writeFile(path.join(outputDirectory, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify(manifest, null, 2));
