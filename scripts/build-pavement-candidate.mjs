import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import sharp from "sharp";

const FRAME_SIZE = 64;
const SHEET_COLUMNS = 4;
const SHEET_ROWS = 4;
const EDGE_DEPTH = 18;
const SOIL = Object.freeze([166, 143, 89]);
const SOIL_LIGHT = Object.freeze([195, 172, 112]);

const FRAME_ORDER = Object.freeze([
  "centre",
  "grass-edge-north",
  "grass-edge-east",
  "grass-edge-south",
  "grass-edge-west",
  "grass-outer-corner-north-east",
  "grass-outer-corner-south-east",
  "grass-outer-corner-south-west",
  "grass-outer-corner-north-west",
  "grass-inner-corner-north-east",
  "grass-inner-corner-south-east",
  "grass-inner-corner-south-west",
  "grass-inner-corner-north-west",
  "grass-only",
  "isolated-paver-transition",
  "worn-grass-transition",
]);

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index]?.replace(/^--/, "");
    const value = argv[index + 1];
    if (!key || !value) throw new Error(`Expected --name value arguments; received ${argv.join(" ")}`);
    parsed[key] = value;
  }
  for (const required of ["source", "grass", "output", "sheet-preview", "assembly-preview"]) {
    if (!parsed[required]) throw new Error(`Missing required --${required} argument.`);
  }
  return parsed;
}

function pixelIndex(x, y, channels = 3) {
  return (y * FRAME_SIZE + x) * channels;
}

function makePavementSeamless(input) {
  const output = Buffer.from(input);
  const seamBand = 5;
  for (let distance = 0; distance < seamBand; distance += 1) {
    const left = distance;
    const right = FRAME_SIZE - 1 - distance;
    for (let y = 0; y < FRAME_SIZE; y += 1) {
      const leftIndex = pixelIndex(left, y);
      const rightIndex = pixelIndex(right, y);
      for (let channel = 0; channel < 3; channel += 1) {
        const average = Math.round((input[leftIndex + channel] + input[rightIndex + channel]) / 2);
        output[leftIndex + channel] = average;
        output[rightIndex + channel] = average;
      }
    }
  }
  const horizontalInput = Buffer.from(output);
  for (let distance = 0; distance < seamBand; distance += 1) {
    const top = distance;
    const bottom = FRAME_SIZE - 1 - distance;
    for (let x = 0; x < FRAME_SIZE; x += 1) {
      const topIndex = pixelIndex(x, top);
      const bottomIndex = pixelIndex(x, bottom);
      for (let channel = 0; channel < 3; channel += 1) {
        const average = Math.round((horizontalInput[topIndex + channel] + horizontalInput[bottomIndex + channel]) / 2);
        output[topIndex + channel] = average;
        output[bottomIndex + channel] = average;
      }
    }
  }
  return output;
}

function edgeNoise(value) {
  const periodic = [0, 1, 0, -1, 1, 0, 2, 0, -1, 0, 1, -2, 0, 1, 0, -1];
  return periodic[value % periodic.length];
}

function insideFrame(frameId, x, y) {
  const north = EDGE_DEPTH + edgeNoise(x);
  const south = FRAME_SIZE - EDGE_DEPTH + edgeNoise(x + 5);
  const west = EDGE_DEPTH + edgeNoise(y + 3);
  const east = FRAME_SIZE - EDGE_DEPTH + edgeNoise(y + 9);
  switch (frameId) {
    case "centre": return true;
    case "grass-edge-north": return y >= north;
    case "grass-edge-east": return x < east;
    case "grass-edge-south": return y < south;
    case "grass-edge-west": return x >= west;
    case "grass-outer-corner-north-east": return x < east && y >= north;
    case "grass-outer-corner-south-east": return x < east && y < south;
    case "grass-outer-corner-south-west": return x >= west && y < south;
    case "grass-outer-corner-north-west": return x >= west && y >= north;
    case "grass-inner-corner-north-east": return !(x >= east && y < north);
    case "grass-inner-corner-south-east": return !(x >= east && y >= south);
    case "grass-inner-corner-south-west": return !(x < west && y >= south);
    case "grass-inner-corner-north-west": return !(x < west && y < north);
    case "grass-only": return false;
    case "isolated-paver-transition": {
      const dx = Math.abs(x - 31.5);
      const dy = Math.abs(y - 31.5);
      return dx <= 17 + edgeNoise(y) && dy <= 14 + edgeNoise(x + 4);
    }
    case "worn-grass-transition": {
      const brokenEdge = y >= 40 + edgeNoise(x + 7);
      const loosePaverA = Math.abs(x - 15) <= 6 && Math.abs(y - 31) <= 4;
      const loosePaverB = Math.abs(x - 32) <= 5 && Math.abs(y - 27) <= 5;
      const loosePaverC = Math.abs(x - 49) <= 7 && Math.abs(y - 33) <= 4;
      return brokenEdge || loosePaverA || loosePaverB || loosePaverC;
    }
    default: throw new Error(`Unknown pavement frame ${frameId}.`);
  }
}

function isBoundary(frameId, x, y) {
  if (!insideFrame(frameId, x, y)) return 0;
  const neighbours = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  let outsideDistanceOne = false;
  let outsideDistanceTwo = false;
  for (const [dx, dy] of neighbours) {
    const x1 = x + dx;
    const y1 = y + dy;
    if (x1 >= 0 && x1 < FRAME_SIZE && y1 >= 0 && y1 < FRAME_SIZE && !insideFrame(frameId, x1, y1)) outsideDistanceOne = true;
    const x2 = x + dx * 2;
    const y2 = y + dy * 2;
    if (x2 >= 0 && x2 < FRAME_SIZE && y2 >= 0 && y2 < FRAME_SIZE && !insideFrame(frameId, x2, y2)) outsideDistanceTwo = true;
  }
  if (outsideDistanceOne) return 2;
  if (outsideDistanceTwo) return 1;
  return 0;
}

function buildFrame(frameId, pavement, grass) {
  const output = Buffer.from(grass);
  for (let y = 0; y < FRAME_SIZE; y += 1) {
    for (let x = 0; x < FRAME_SIZE; x += 1) {
      if (!insideFrame(frameId, x, y)) continue;
      const index = pixelIndex(x, y);
      const boundary = isBoundary(frameId, x, y);
      const source = boundary === 2 ? SOIL : boundary === 1 ? SOIL_LIGHT : pavement.subarray(index, index + 3);
      output[index] = source[0];
      output[index + 1] = source[1];
      output[index + 2] = source[2];
    }
  }
  return output;
}

async function writeRgb(buffer, width, height, outputPath) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await sharp(buffer, { raw: { width, height, channels: 3 } }).png({ compressionLevel: 9, palette: false }).toFile(outputPath);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const sourceSquare = await sharp(args.source)
    .resize(256, 256, { fit: "cover", kernel: "nearest" })
    .extract({ left: 96, top: 96, width: FRAME_SIZE, height: FRAME_SIZE })
    .removeAlpha()
    .raw()
    .toBuffer();
  const pavement = makePavementSeamless(sourceSquare);
  const grass = await sharp(args.grass)
    .resize(FRAME_SIZE, FRAME_SIZE, { fit: "fill", kernel: "nearest" })
    .removeAlpha()
    .raw()
    .toBuffer();

  const frames = FRAME_ORDER.map((frameId) => buildFrame(frameId, pavement, grass));
  assert.equal(frames.length, SHEET_COLUMNS * SHEET_ROWS, "Pavement sheet frame count must match the 4×4 contract.");
  assert.ok(frames[FRAME_ORDER.indexOf("grass-only")].equals(grass), "The grass-only frame must preserve the approved grass bytes exactly.");
  for (let y = 0; y < FRAME_SIZE; y += 1) {
    for (let channel = 0; channel < 3; channel += 1) {
      assert.equal(pavement[pixelIndex(0, y) + channel], pavement[pixelIndex(FRAME_SIZE - 1, y) + channel], `Pavement west/east seam mismatch at row ${y}.`);
    }
  }
  for (let x = 0; x < FRAME_SIZE; x += 1) {
    for (let channel = 0; channel < 3; channel += 1) {
      assert.equal(pavement[pixelIndex(x, 0) + channel], pavement[pixelIndex(x, FRAME_SIZE - 1) + channel], `Pavement north/south seam mismatch at column ${x}.`);
    }
  }
  const sheet = Buffer.alloc(FRAME_SIZE * SHEET_COLUMNS * FRAME_SIZE * SHEET_ROWS * 3);
  const sheetWidth = FRAME_SIZE * SHEET_COLUMNS;
  for (let frameIndex = 0; frameIndex < frames.length; frameIndex += 1) {
    const column = frameIndex % SHEET_COLUMNS;
    const row = Math.floor(frameIndex / SHEET_COLUMNS);
    for (let y = 0; y < FRAME_SIZE; y += 1) {
      const sourceOffset = y * FRAME_SIZE * 3;
      const destinationOffset = ((row * FRAME_SIZE + y) * sheetWidth + column * FRAME_SIZE) * 3;
      frames[frameIndex].copy(sheet, destinationOffset, sourceOffset, sourceOffset + FRAME_SIZE * 3);
    }
  }
  await writeRgb(sheet, sheetWidth, FRAME_SIZE * SHEET_ROWS, args.output);
  const metadata = await sharp(args.output).metadata();
  assert.equal(metadata.width, 256);
  assert.equal(metadata.height, 256);
  assert.equal(metadata.channels, 3);
  assert.equal(metadata.hasAlpha, false);
  await fs.mkdir(path.dirname(args["sheet-preview"]), { recursive: true });
  await sharp(args.output).resize(1024, 1024, { kernel: "nearest" }).png().toFile(args["sheet-preview"]);

  const assemblyColumns = 8;
  const assemblyRows = 6;
  const assembly = Buffer.alloc(assemblyColumns * FRAME_SIZE * assemblyRows * FRAME_SIZE * 3);
  for (let tileY = 0; tileY < assemblyRows; tileY += 1) {
    for (let tileX = 0; tileX < assemblyColumns; tileX += 1) {
      const isTop = tileY === 0;
      const isBottom = tileY === assemblyRows - 1;
      const isLeft = tileX === 0;
      const isRight = tileX === assemblyColumns - 1;
      let frameId = "centre";
      if (isTop && isLeft) frameId = "grass-outer-corner-north-west";
      else if (isTop && isRight) frameId = "grass-outer-corner-north-east";
      else if (isBottom && isLeft) frameId = "grass-outer-corner-south-west";
      else if (isBottom && isRight) frameId = "grass-outer-corner-south-east";
      else if (isTop) frameId = "grass-edge-north";
      else if (isBottom) frameId = "grass-edge-south";
      else if (isLeft) frameId = "grass-edge-west";
      else if (isRight) frameId = "grass-edge-east";
      const frame = frames[FRAME_ORDER.indexOf(frameId)];
      for (let y = 0; y < FRAME_SIZE; y += 1) {
        const sourceOffset = y * FRAME_SIZE * 3;
        const destinationOffset = (((tileY * FRAME_SIZE + y) * assemblyColumns * FRAME_SIZE) + tileX * FRAME_SIZE) * 3;
        frame.copy(assembly, destinationOffset, sourceOffset, sourceOffset + FRAME_SIZE * 3);
      }
    }
  }
  const assemblyPath = args["assembly-preview"];
  await fs.mkdir(path.dirname(assemblyPath), { recursive: true });
  await sharp(assembly, { raw: { width: assemblyColumns * FRAME_SIZE, height: assemblyRows * FRAME_SIZE, channels: 3 } })
    .resize(1024, 768, { kernel: "nearest" })
    .png()
    .toFile(assemblyPath);

  process.stdout.write(`${JSON.stringify({ output: args.output, frameOrder: FRAME_ORDER, validation: { exactCanvas: "256x256 RGB", grassOnlyMatchesApprovedTile: true, seamlessCentreEdges: true }, sheetPreview: args["sheet-preview"], assemblyPreview: assemblyPath }, null, 2)}\n`);
}

await main();
