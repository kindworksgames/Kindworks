import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import sharp from "sharp";

const FRAME_SIZE = 64;
const COLUMNS = 4;
const ROWS = 4;
const KERB_DEPTH = 9;
const ROAD_EDGE = 19;

const FRAME_ORDER = Object.freeze([
  "surface-a",
  "surface-b",
  "surface-c",
  "surface-d",
  "kerb-north",
  "kerb-east",
  "kerb-south",
  "kerb-west",
  "rounded-corner-north-east",
  "rounded-corner-south-east",
  "rounded-corner-south-west",
  "rounded-corner-north-west",
  "pavement-transition-north",
  "pavement-transition-east",
  "pavement-transition-south",
  "pavement-transition-west",
]);

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index]?.replace(/^--/, "");
    const value = argv[index + 1];
    if (!key || !value) throw new Error(`Expected --name value arguments; received ${argv.join(" ")}`);
    parsed[key] = value;
  }
  for (const required of ["source", "grass", "pavement", "output", "preview"]) {
    if (!parsed[required]) throw new Error(`Missing required --${required} argument.`);
  }
  return parsed;
}

function pixelIndex(x, y) {
  return (y * FRAME_SIZE + x) * 3;
}

function copyPixel(target, targetX, targetY, source, sourceX = targetX, sourceY = targetY) {
  const targetIndex = pixelIndex(targetX, targetY);
  const sourceIndex = pixelIndex(sourceX, sourceY);
  source.copy(target, targetIndex, sourceIndex, sourceIndex + 3);
}

function makeSeamless(input) {
  const output = Buffer.from(input);
  const band = 4;
  for (let distance = 0; distance < band; distance += 1) {
    for (let y = 0; y < FRAME_SIZE; y += 1) {
      const left = pixelIndex(distance, y);
      const right = pixelIndex(FRAME_SIZE - 1 - distance, y);
      for (let channel = 0; channel < 3; channel += 1) {
        const average = Math.round((input[left + channel] + input[right + channel]) / 2);
        output[left + channel] = average;
        output[right + channel] = average;
      }
    }
  }
  const verticalInput = Buffer.from(output);
  for (let distance = 0; distance < band; distance += 1) {
    for (let x = 0; x < FRAME_SIZE; x += 1) {
      const top = pixelIndex(x, distance);
      const bottom = pixelIndex(x, FRAME_SIZE - 1 - distance);
      for (let channel = 0; channel < 3; channel += 1) {
        const average = Math.round((verticalInput[top + channel] + verticalInput[bottom + channel]) / 2);
        output[top + channel] = average;
        output[bottom + channel] = average;
      }
    }
  }
  return output;
}

function makeSurfaceVariant(road, variant) {
  const output = Buffer.from(road);
  for (let y = 5 + variant; y < FRAME_SIZE; y += 13) {
    for (let x = 7 + variant * 3; x < FRAME_SIZE; x += 17) {
      const index = pixelIndex(x, y);
      const delta = variant % 2 === 0 ? 5 : -4;
      for (let channel = 0; channel < 3; channel += 1) {
        output[index + channel] = Math.max(0, Math.min(255, output[index + channel] + delta));
      }
    }
  }
  return makeSeamless(output);
}

function kerbSourceCoordinate(edge, x, y) {
  switch (edge) {
    case "north": return { x, y: Math.min(FRAME_SIZE - 1, y + 16) };
    case "east": return { x: Math.max(0, x - 16), y };
    case "south": return { x, y: Math.max(0, y - 16) };
    case "west": return { x: Math.min(FRAME_SIZE - 1, x + 16), y };
    default: throw new Error(`Unknown edge ${edge}.`);
  }
}

function isRoadSide(edge, x, y) {
  if (edge === "north") return y >= ROAD_EDGE;
  if (edge === "east") return x < FRAME_SIZE - ROAD_EDGE;
  if (edge === "south") return y < FRAME_SIZE - ROAD_EDGE;
  return x >= ROAD_EDGE;
}

function isKerbBand(edge, x, y) {
  if (edge === "north") return y >= ROAD_EDGE - KERB_DEPTH && y < ROAD_EDGE;
  if (edge === "east") return x >= FRAME_SIZE - ROAD_EDGE && x < FRAME_SIZE - ROAD_EDGE + KERB_DEPTH;
  if (edge === "south") return y >= FRAME_SIZE - ROAD_EDGE && y < FRAME_SIZE - ROAD_EDGE + KERB_DEPTH;
  return x >= ROAD_EDGE - KERB_DEPTH && x < ROAD_EDGE;
}

function makeKerb(edge, road, pavement, grass) {
  const output = Buffer.from(grass);
  for (let y = 0; y < FRAME_SIZE; y += 1) {
    for (let x = 0; x < FRAME_SIZE; x += 1) {
      if (isRoadSide(edge, x, y)) copyPixel(output, x, y, road);
      else if (isKerbBand(edge, x, y)) {
        const source = kerbSourceCoordinate(edge, x, y);
        copyPixel(output, x, y, pavement, source.x, source.y);
      }
    }
  }
  return output;
}

function cornerTransform(corner, x, y) {
  if (corner === "north-east") return { x, y };
  if (corner === "south-east") return { x: y, y: FRAME_SIZE - 1 - x };
  if (corner === "south-west") return { x: FRAME_SIZE - 1 - x, y: FRAME_SIZE - 1 - y };
  return { x: FRAME_SIZE - 1 - y, y: x };
}

function makeRoundedCorner(corner, road, pavement, grass) {
  const output = Buffer.from(grass);
  const centreX = FRAME_SIZE - ROAD_EDGE;
  const centreY = ROAD_EDGE;
  const roadRadius = 37;
  const kerbRadius = roadRadius + KERB_DEPTH;
  for (let y = 0; y < FRAME_SIZE; y += 1) {
    for (let x = 0; x < FRAME_SIZE; x += 1) {
      const transformed = cornerTransform(corner, x, y);
      const dx = transformed.x - centreX;
      const dy = transformed.y - centreY;
      const radius = Math.sqrt(dx * dx + dy * dy);
      const roadConnector = transformed.x <= centreX || transformed.y >= centreY;
      if (roadConnector || radius <= roadRadius) copyPixel(output, x, y, road);
      else if (radius <= kerbRadius) copyPixel(output, x, y, pavement);
    }
  }
  return output;
}

function makePavementTransition(edge, road, pavement) {
  const output = Buffer.from(road);
  const threshold = 24;
  for (let y = 0; y < FRAME_SIZE; y += 1) {
    for (let x = 0; x < FRAME_SIZE; x += 1) {
      const pavementSide = edge === "north" ? y < threshold
        : edge === "east" ? x >= FRAME_SIZE - threshold
          : edge === "south" ? y >= FRAME_SIZE - threshold
            : x < threshold;
      if (pavementSide) copyPixel(output, x, y, pavement);
    }
  }
  return output;
}

async function loadFrame(file, extraction = null) {
  let pipeline = sharp(file);
  if (extraction) pipeline = pipeline.extract(extraction);
  return pipeline.resize(FRAME_SIZE, FRAME_SIZE, { fit: "fill", kernel: "nearest" }).removeAlpha().raw().toBuffer();
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const metadata = await sharp(args.source).metadata();
  const sourceCellWidth = Math.floor(metadata.width / 4);
  const sourceCellHeight = Math.floor(metadata.height / 4);
  const road = makeSeamless(await loadFrame(args.source, {
    left: Math.floor((sourceCellWidth - Math.min(sourceCellWidth, sourceCellHeight)) / 2),
    top: Math.floor((sourceCellHeight - Math.min(sourceCellWidth, sourceCellHeight)) / 2),
    width: Math.min(sourceCellWidth, sourceCellHeight),
    height: Math.min(sourceCellWidth, sourceCellHeight),
  }));
  const grass = await loadFrame(args.grass);
  const pavement = await loadFrame(args.pavement, { left: 0, top: 0, width: 64, height: 64 });
  const frames = [
    ...[0, 1, 2, 3].map((variant) => makeSurfaceVariant(road, variant)),
    ...["north", "east", "south", "west"].map((edge) => makeKerb(edge, road, pavement, grass)),
    ...["north-east", "south-east", "south-west", "north-west"].map((corner) => makeRoundedCorner(corner, road, pavement, grass)),
    ...["north", "east", "south", "west"].map((edge) => makePavementTransition(edge, road, pavement)),
  ];
  assert.equal(frames.length, COLUMNS * ROWS);
  const sheetWidth = FRAME_SIZE * COLUMNS;
  const sheetHeight = FRAME_SIZE * ROWS;
  const sheet = Buffer.alloc(sheetWidth * sheetHeight * 3);
  frames.forEach((frame, index) => {
    const column = index % COLUMNS;
    const row = Math.floor(index / COLUMNS);
    for (let y = 0; y < FRAME_SIZE; y += 1) {
      const sourceOffset = y * FRAME_SIZE * 3;
      const destinationOffset = ((row * FRAME_SIZE + y) * sheetWidth + column * FRAME_SIZE) * 3;
      frame.copy(sheet, destinationOffset, sourceOffset, sourceOffset + FRAME_SIZE * 3);
    }
  });
  await fs.mkdir(path.dirname(args.output), { recursive: true });
  await sharp(sheet, { raw: { width: sheetWidth, height: sheetHeight, channels: 3 } })
    .png({ compressionLevel: 9, palette: false })
    .toFile(args.output);
  await fs.mkdir(path.dirname(args.preview), { recursive: true });
  await sharp(args.output).resize(1024, 1024, { kernel: "nearest" }).png().toFile(args.preview);
  const outputMetadata = await sharp(args.output).metadata();
  assert.deepEqual({ width: outputMetadata.width, height: outputMetadata.height, channels: outputMetadata.channels, hasAlpha: outputMetadata.hasAlpha }, { width: 256, height: 256, channels: 3, hasAlpha: false });
  process.stdout.write(`${JSON.stringify({ output: args.output, preview: args.preview, frameOrder: FRAME_ORDER, validation: { exactCanvas: "256x256 RGB", frameGrid: "4x4 of 64x64", nearestNeighbour: true } }, null, 2)}\n`);
}

await main();
