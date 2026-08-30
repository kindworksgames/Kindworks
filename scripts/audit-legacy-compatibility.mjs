import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { KINDWORKS_VISUAL_MANIFEST } from "../src/visual/visualManifest.js";

const root = resolve(import.meta.dirname, "..");
const files = [
  "src/scenes/FishingScene.js",
  "src/entities/PlayerCharacter.js",
  "src/entities/AnimalCharacter.js",
  "src/scenes/PawsWondersScene.js",
  "src/scenes/HouseInteriorScene.js",
];
const mapped = new Set([
  ...(KINDWORKS_VISUAL_MANIFEST.legacyCompatibility?.textureKeys || []).map(({ legacyKey }) => legacyKey),
  ...(KINDWORKS_VISUAL_MANIFEST.legacyCompatibility?.animationKeys || []).map(({ legacyKey }) => legacyKey),
]);
const findings = [];
for (const file of files) {
  const source = await readFile(resolve(root, file), "utf8");
  const pattern = /resolveLegacy(?:Texture|Animation)Key\(\s*["']([^"']+)["']\s*\)/g;
  for (const match of source.matchAll(pattern)) if (!mapped.has(match[1])) findings.push({ file, key: match[1] });
}
if (findings.length) {
  for (const finding of findings) console.error(`Unknown legacy key ${finding.key} in ${finding.file}`);
  process.exitCode = 1;
} else console.log(`Legacy compatibility audit: PASS — ${mapped.size} explicit mappings; no unknown literal bypasses.`);
