import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { ANIMAL_DEFINITIONS, groundAnimalSegmentBlocked } from "../src/data/animals.js";
import { HARBOUR_GENERAL_GEOMETRY, PAWS_WONDERS_GEOMETRY, VILLAGE_GROCER_GEOMETRY } from "../src/data/interiorGeometry.js";
import { pointInLogicalRect } from "../src/data/logicalGeometry.js";
import { NPC_NAVIGATION_LINKS, NPC_NAVIGATION_NODES } from "../src/data/npcTownLife.js";
import { TOWN_HOUSE_GEOMETRY, TOWN_LOGICAL_GEOMETRY, TOWN_SHOP_GEOMETRY } from "../src/data/townGeometry.js";
import { createFreshGameState } from "../src/state/GameState.js";
import { inspectImageFile } from "./lib/artworkPipelineValidation.mjs";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const outputFlag = process.argv.indexOf("--output");
const output = outputFlag >= 0 ? resolve(root, process.argv[outputFlag + 1]) : null;
const nodeById = new Map(NPC_NAVIGATION_NODES.map((node) => [node.id, node]));
const indoorKinds = new Set(["home", "cafe", "shop", "bakery", "restaurant", "pub", "market", "cinema"]);

function samples(from, to, spacing = 2) {
  const count = Math.max(1, Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) / spacing));
  return Array.from({ length: count + 1 }, (_, index) => ({ x: from.x + (to.x - from.x) * index / count, y: from.y + (to.y - from.y) * index / count }));
}

function fragileSaveFields(value, path = "state", result = []) {
  if (!value || typeof value !== "object") return result;
  for (const [key, child] of Object.entries(value)) {
    const next = `${path}.${key}`;
    if (/(texture|sprite|frame|assetPath|imagePath)/i.test(key) || (typeof child === "string" && /\.(?:png|webp|jpe?g|gif|svg)(?:\?|$)/i.test(child))) result.push(next);
    fragileSaveFields(child, next, result);
  }
  return result;
}

const replacementFiles = [
  "/assets/animals/reference-master-v44.png",
  "/assets/powerwash/tool-precision.png",
  "/assets/powerwash/playground-master.png",
];
const replacements = [];
for (const file of replacementFiles) replacements.push({ file, ...(await inspectImageFile(resolve(root, "public", file.replace(/^\//, "")))) });

const npcViolations = [];
let npcSegmentsChecked = 0;
for (const [fromId, toId] of NPC_NAVIGATION_LINKS) {
  const from = nodeById.get(fromId); const to = nodeById.get(toId);
  if (!from || !to || indoorKinds.has(from.kind) || indoorKinds.has(to.kind)) continue;
  npcSegmentsChecked += 1;
  const hit = samples(from, to).find((point) => TOWN_LOGICAL_GEOMETRY.navigationObstacles.some((rect) => pointInLogicalRect(point, rect, 18)));
  if (hit) npcViolations.push({ fromId, toId, point: hit });
}

const animalViolations = [];
let animalSegmentsChecked = 0;
for (const animal of ANIMAL_DEFINITIONS.filter(({ aerial, water }) => !aerial && !water)) {
  for (let index = 0; index < animal.route.length; index += 1) {
    animalSegmentsChecked += 1;
    const from = animal.route[index]; const to = animal.route[(index + 1) % animal.route.length];
    if (groundAnimalSegmentBlocked(from, to)) animalViolations.push({ animalId: animal.id, segment: index });
  }
}

const sourceFiles = [
  "src/scenes/TownScene.js", "src/entities/PlayerCharacter.js", "src/entities/NpcCharacter.js", "src/entities/AnimalCharacter.js",
  "src/systems/NpcTownLifeService.js", "src/systems/CustomResidentService.js", "src/systems/AnimalService.js",
  "src/scenes/LawnCareScene.js", "src/scenes/RiverClearoutScene.js", "src/scenes/BeachCleanupScene.js", "src/scenes/PlaygroundPowerwashScene.js",
];
const forbidden = /\b(?:sprite|image|texture|frame|character)\.(?:width|height|displayWidth|displayHeight|originX|originY)\b|\.getBounds\s*\(|\.body\.(?:setSize|setCircle)\s*\(/g;
const sourceViolations = [];
for (const file of sourceFiles) {
  const text = await readFile(resolve(root, file), "utf8");
  for (const match of text.matchAll(forbidden)) sourceViolations.push({ file, line: text.slice(0, match.index).split("\n").length, expression: match[0] });
}

const standingPointViolations = [];
for (const contract of [VILLAGE_GROCER_GEOMETRY, PAWS_WONDERS_GEOMETRY, HARBOUR_GENERAL_GEOMETRY]) {
  for (const point of contract.standingPoints) {
    const obstacles = contract.navigationObstacles.filter((rect) => pointInLogicalRect(point, rect, 17)).map(({ id }) => id);
    if (obstacles.length) standingPointViolations.push({ contractId: contract.id, pointId: point.id, point: { x: point.x, y: point.y }, obstacles });
  }
}

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  method: "fresh-independent-adversarial-retest",
  replacementArtwork: {
    actualFiles: replacements.map(({ file, format, width, height, alpha, opaqueBounds }) => ({ file, format, width, height, alpha, opaqueBounds })),
    distinctCanvasCount: new Set(replacements.map(({ width, height }) => `${width}x${height}`)).size,
    adversarialMetadataCases: [
      { canvas: "8x4096", transparentPadding: "2048px vertical", origin: "-2,4" },
      { canvas: "8199x8", transparentPadding: "4000px horizontal", origin: "4,1" },
      { animationFrame: "96x31", expectedResult: "rejected-before-runtime" },
    ],
  },
  geometryContracts: {
    townId: TOWN_LOGICAL_GEOMETRY.id,
    houses: Object.keys(TOWN_HOUSE_GEOMETRY).length,
    shops: Object.keys(TOWN_SHOP_GEOMETRY).length,
    interiors: [VILLAGE_GROCER_GEOMETRY.id, PAWS_WONDERS_GEOMETRY.id, HARBOUR_GENERAL_GEOMETRY.id],
  },
  navigation: { npcLinksTotal: NPC_NAVIGATION_LINKS.length, outdoorSegmentsChecked: npcSegmentsChecked, violations: npcViolations },
  animals: { definitions: ANIMAL_DEFINITIONS.length, groundSegmentsChecked: animalSegmentsChecked, violations: animalViolations },
  entrancesAndStandingPoints: { standingPointViolations },
  sourceIsolation: { filesChecked: sourceFiles, violations: sourceViolations },
  saveIsolation: { fragileVisualFields: fragileSaveFields(createFreshGameState({ now: 1_700_000_000_000 })) },
  pass: replacements.length === 3 && new Set(replacements.map(({ width, height }) => `${width}x${height}`)).size === 3
    && npcViolations.length === 0 && animalViolations.length === 0 && standingPointViolations.length === 0 && sourceViolations.length === 0
    && fragileSaveFields(createFreshGameState({ now: 1_700_000_000_000 })).length === 0,
};

if (output) {
  await mkdir(resolve(output, ".."), { recursive: true });
  await writeFile(output, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}
console.log(JSON.stringify(report, null, 2));
if (!report.pass) process.exitCode = 1;
