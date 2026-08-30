import { mkdir, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import sharp from "sharp";

import { PHASE_8A_ASSET_IDS, PHASE_8A_VERTICAL_SLICE_PACKAGE } from "../src/visual/verticalSlice/phase8aVerticalSlicePackage.js";

const root = resolve(import.meta.dirname, "..");
const selected = [
  PHASE_8A_ASSET_IDS.RUBBISH,
  PHASE_8A_ASSET_IDS.BIN,
  PHASE_8A_ASSET_IDS.NPC,
  PHASE_8A_ASSET_IDS.HOUSE,
  PHASE_8A_ASSET_IDS.LAWN_MOWER,
  PHASE_8A_ASSET_IDS.INTERACTION,
];
const clean = process.argv.includes("--clean");

for (const semanticId of selected) {
  const asset = PHASE_8A_VERTICAL_SLICE_PACKAGE.assets.find((entry) => entry.semanticId === semanticId);
  const file = resolve(root, asset.expectedFilenames.staging);
  const referenceFile = resolve(root, `artwork/references/phase8b-controlled-proof/${asset.filenameStem}.reference.v1.png`);
  if (clean) { await rm(file, { force: true }); await rm(referenceFile, { force: true }); continue; }
  const { width, height } = asset.output.canvas;
  const alpha = asset.output.alpha;
  const channels = alpha ? 4 : 3;
  const pixels = Buffer.alloc(width * height * channels, 0);
  const frameWidth = asset.output.spriteSheet?.frameWidth || width;
  const frameHeight = asset.output.spriteSheet?.frameHeight || height;
  const columns = asset.output.spriteSheet?.columns || 1;
  const rows = asset.output.spriteSheet?.rows || 1;
  for (let row = 0; row < rows; row += 1) for (let column = 0; column < columns; column += 1) {
    const frame = row * columns + column;
    const color = [45 + frame * 29 % 180, 90 + frame * 41 % 150, 125 + frame * 23 % 120];
    for (let y = row * frameHeight + 5; y < (row + 1) * frameHeight - 5; y += 1) for (let x = column * frameWidth + 5; x < (column + 1) * frameWidth - 5; x += 1) {
      const offset = (y * width + x) * channels;
      pixels[offset] = color[0]; pixels[offset + 1] = color[1]; pixels[offset + 2] = color[2];
      if (alpha) pixels[offset + 3] = 255;
    }
  }
  await mkdir(dirname(file), { recursive: true });
  await sharp(pixels, { raw: { width, height, channels } }).png({ palette: false }).toFile(file);
  await mkdir(dirname(referenceFile), { recursive: true });
  await sharp(pixels, { raw: { width, height, channels } }).tint("#88aacc").png({ palette: false }).toFile(referenceFile);
  console.log(`${semanticId}: controlled proof created at ${asset.expectedFilenames.staging}`);
}

if (clean) console.log("Controlled Phase 8B proof bytes removed; contracts and approved artwork were untouched.");
