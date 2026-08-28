import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";

const projectRoot = path.resolve(import.meta.dirname, "..");
const legacyPath = path.join(projectRoot, "kindworks_little_bakery_v65_house_rescue_reintegrated_fixed.html");
const outputPath = path.join(projectRoot, "public", "assets", "animals", "reference-master-v44.png");
const html = await readFile(legacyPath, "utf8");
const match = html.match(/const ANIMAL_REFERENCE_SHEET_SRC="data:image\/png;base64,([A-Za-z0-9+/=]+)";/);

if (!match) throw new Error("The v44 animal reference sheet was not found in the protected legacy HTML.");

const image = Buffer.from(match[1], "base64");
if (image.length < 1000 || image.subarray(1, 4).toString("ascii") !== "PNG") throw new Error("The recovered animal reference sheet is not a valid PNG.");
const digest = createHash("sha256").update(image).digest("hex");
if (digest !== "c7a8db375596b9e8ec614b4756c839958612c28bf462641806fc505348bcbae6") throw new Error("The protected v44 animal reference artwork changed unexpectedly.");

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, image);
console.log(`Recovered ${image.length.toLocaleString()} bytes to ${path.relative(projectRoot, outputPath)} (${digest.slice(0, 12)}…).`);
