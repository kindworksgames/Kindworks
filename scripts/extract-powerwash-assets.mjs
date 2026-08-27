import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = resolve(root, "kindworks_little_bakery_v65_house_rescue_reintegrated_fixed.html");
const outputDirectory = resolve(root, "public/assets/powerwash");
const expected = Object.freeze({
  POWERWASH_MASTER_ART: "0679fe2c14f28b750f61415641b73e6d17d1f35cbaadfc1a470a011d3cdd0f24",
  POWERWASH_REFERENCE_DIRT_ART: "5db4c213d34d1e435f74f03a49590f766e172f01d8ac97703dc090ded7d36736",
});

function sha256(buffer) { return createHash("sha256").update(buffer).digest("hex"); }

const source = await readFile(sourcePath, "utf8");
const payloadBase64 = source.match(/const EMBEDDED_POWERWASH_HTML_B64="([^"]+)"/)?.[1];
if (!payloadBase64) throw new Error("The protected embedded Power Washing payload was not found.");
const payload = Buffer.from(payloadBase64, "base64").toString("utf8");
await mkdir(outputDirectory, { recursive: true });

const manifest = {};
for (const [constant, expectedHash] of Object.entries(expected)) {
  const encoded = payload.match(new RegExp(`const ${constant}='data:image/png;base64,([^']+)'`))?.[1];
  if (!encoded) throw new Error(`${constant} is missing from the protected payload.`);
  const buffer = Buffer.from(encoded, "base64");
  const actualHash = sha256(buffer);
  if (actualHash !== expectedHash) throw new Error(`${constant} hash mismatch: ${actualHash}`);
  const filename = constant === "POWERWASH_MASTER_ART" ? "playground-master.png" : "playground-reference-dirt.png";
  await writeFile(resolve(outputDirectory, filename), buffer);
  manifest[constant] = { filename, sha256: actualHash, bytes: buffer.length };
}

await writeFile(resolve(outputDirectory, "manifest.json"), `${JSON.stringify({ source: "protected-legacy-html", assets: manifest }, null, 2)}\n`);
console.log(JSON.stringify(manifest, null, 2));
