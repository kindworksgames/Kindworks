import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { extname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { ANIMAL_DEFINITIONS, groundAnimalSegmentBlocked } from "../src/data/animals.js";
import { createFreshGameState } from "../src/state/GameState.js";
import { NPC_NAVIGATION_LINKS, NPC_NAVIGATION_NODES } from "../src/data/npcTownLife.js";
import { COLLISION_RECTS, HOUSES, RIVER_PATH, SHOPS, WORLD } from "../src/data/town.js";
import { validateTownPlacement } from "../src/data/townPlacement.js";
import { TOWN_LOGICAL_GEOMETRY } from "../src/data/townGeometry.js";
import { HARBOUR_GENERAL_GEOMETRY, PAWS_WONDERS_GEOMETRY, VILLAGE_GROCER_GEOMETRY } from "../src/data/interiorGeometry.js";

const projectRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const outputFlag = process.argv.indexOf("--output");
const outputPath = outputFlag >= 0 ? resolve(projectRoot, process.argv[outputFlag + 1]) : null;

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return [".js", ".mjs", ".css", ".html"].includes(extname(entry.name)) ? [path] : [];
  }));
  return nested.flat();
}

function lineMatches(text, regex, file) {
  return text.split("\n").flatMap((line, index) => regex.test(line) ? [{ file, line: index + 1, text: line.trim() }] : []);
}

function distanceToSegment(point, start, end) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  const amount = lengthSquared ? Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared)) : 0;
  return Math.hypot(point.x - (start.x + dx * amount), point.y - (start.y + dy * amount));
}

function distanceToPolyline(point, polyline) {
  let best = Infinity;
  for (let index = 1; index < polyline.length; index += 1) {
    best = Math.min(best, distanceToSegment(point, { x: polyline[index - 1][0], y: polyline[index - 1][1] }, { x: polyline[index][0], y: polyline[index][1] }));
  }
  return best;
}

function pointInRect(point, rect, margin = 0) {
  return point.x >= rect.x - margin && point.x <= rect.x + rect.width + margin && point.y >= rect.y - margin && point.y <= rect.y + rect.height + margin;
}

function sampleSegment(start, end, spacing = 4) {
  const count = Math.max(1, Math.ceil(Math.hypot(end.x - start.x, end.y - start.y) / spacing));
  return Array.from({ length: count + 1 }, (_, index) => ({
    x: start.x + (end.x - start.x) * index / count,
    y: start.y + (end.y - start.y) * index / count,
  }));
}

function firstSegmentViolation(start, end, { includeRiver = true } = {}) {
  for (const point of sampleSegment(start, end)) {
    const rect = TOWN_LOGICAL_GEOMETRY.navigationObstacles.find((candidate) => pointInRect(point, candidate, 18));
    if (rect) return { type: "building", obstacleId: rect.id || rect.name || "building", point };
    if (includeRiver && distanceToPolyline(point, RIVER_PATH) < 96) {
      const onBridge = COLLISION_RECTS.slice(0, 4).every((rect) => !pointInRect(point, rect));
      if (!onBridge) return { type: "river", point };
    }
  }
  return null;
}

function recursiveFragileSaveFields(value, path = "state", results = []) {
  if (!value || typeof value !== "object") return results;
  for (const [key, child] of Object.entries(value)) {
    const childPath = `${path}.${key}`;
    if (/(texture(Key)?|sprite(Key)?|frame(Name)?|asset(Path)?|image(Path)?)/i.test(key)) results.push({ path: childPath, value: child });
    if (typeof child === "string" && /\.(png|webp|jpe?g|gif|svg)(\?|$)/i.test(child)) results.push({ path: childPath, value: child });
    recursiveFragileSaveFields(child, childPath, results);
  }
  return results;
}

const files = await sourceFiles(resolve(projectRoot, "src"));
const patterns = {
  spriteIntrinsicDimensions: /\b(?:sprite|image|character|object)\.(?:width|height)\b/,
  displayDimensions: /\bdisplay(?:Width|Height)\b/,
  getBounds: /\.getBounds\s*\(/,
  originReads: /\.(?:originX|originY)\b/,
  alphaOrVisibilityGameplay: /(?:enabled|blocked|interactive|collision|radius|target|position).*\b(?:alpha|visible)|\b(?:alpha|visible).*?(?:enabled|blocked|interactive|collision|radius|target|position)/i,
  automaticPhysicsBodies: /\bphysics\.(?:add|world)|\.setBody\s*\(|\.body\.(?:set|setSize|setCircle)\s*\(/,
  explicitHitGeometry: /\.setSize\s*\(|\.setInteractive\s*\(/,
};

const sourceScan = Object.fromEntries(Object.keys(patterns).map((key) => [key, []]));
const interactiveCalls = [];
for (const path of files) {
  const text = await readFile(path, "utf8");
  const file = relative(projectRoot, path);
  for (const [key, regex] of Object.entries(patterns)) sourceScan[key].push(...lineMatches(text, regex, file));
  interactiveCalls.push(...lineMatches(text, /\.setInteractive\s*\(/, file));
}

const nodeById = new Map(NPC_NAVIGATION_NODES.map((node) => [node.id, node]));
const npcStaticViolations = NPC_NAVIGATION_LINKS.flatMap(([fromId, toId]) => {
  const from = nodeById.get(fromId);
  const to = nodeById.get(toId);
  if (!from || !to || [from.kind, to.kind].some((kind) => ["home", "cafe", "shop", "bakery", "restaurant", "pub", "market", "cinema"].includes(kind))) return [];
  const violation = firstSegmentViolation(from, to);
  return violation ? [{ fromId, toId, ...violation }] : [];
});

let placedObjectRouteWitness = null;
for (const [fromId, toId] of NPC_NAVIGATION_LINKS) {
  const from = nodeById.get(fromId);
  const to = nodeById.get(toId);
  if (!from || !to) continue;
  for (let step = 2; step <= 8; step += 1) {
    const amount = step / 10;
    const x = Math.round(from.x + (to.x - from.x) * amount);
    const y = Math.round(from.y + (to.y - from.y) * amount);
    const placement = validateTownPlacement("town-planter", x, y);
    if (placement.ok) {
      placedObjectRouteWitness = { fromId, toId, x, y, itemId: "town-planter", footprint: placement.footprint, distanceToNpcRoute: 0 };
      break;
    }
  }
  if (placedObjectRouteWitness) break;
}

const animalRouteViolations = ANIMAL_DEFINITIONS.flatMap((definition) => {
  if (definition.aerial || definition.water) return [];
  return definition.route.flatMap((from, index) => {
    const to = definition.route[(index + 1) % definition.route.length];
    const violation = groundAnimalSegmentBlocked(from, to) ? firstSegmentViolation(from, to) || { type: "logical-obstacle" } : null;
    return violation ? [{ animalId: definition.id, species: definition.species, segment: index, from, to, ...violation }] : [];
  });
});

const waterRouteViolations = ANIMAL_DEFINITIONS.filter((definition) => definition.water).flatMap((definition) => definition.route.flatMap((point, index) => {
  const distance = distanceToPolyline(point, RIVER_PATH);
  return distance > 2 ? [{ animalId: definition.id, species: definition.species, pointIndex: index, point, distance }] : [];
}));

const state = createFreshGameState({ now: 1_700_000_000_000 });
const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  repository: { root: projectRoot },
  sourceScan: Object.fromEntries(Object.entries(sourceScan).map(([key, values]) => [key, { count: values.length, matches: values.slice(0, 80) }])),
  interactiveCalls: { count: interactiveCalls.length, matches: interactiveCalls },
  navigation: {
    npcNodes: NPC_NAVIGATION_NODES.length,
    npcLinks: NPC_NAVIGATION_LINKS.length,
    staticSegmentViolations: npcStaticViolations,
    placedObjectRouteWitness,
    npcMovementUsesDynamicObstacleHook: (await readFile(resolve(projectRoot, "src/systems/NpcTownLifeService.js"), "utf8")).includes("npcNavigationEdgeBlockedByPlacements"),
  },
  animals: {
    definitions: ANIMAL_DEFINITIONS.length,
    sampledGroundSegments: ANIMAL_DEFINITIONS.filter((definition) => !definition.aerial && !definition.water).reduce((sum, definition) => sum + definition.route.length, 0),
    groundSegmentViolations: animalRouteViolations,
    waterRouteViolations,
  },
  save: { fragileVisualFields: recursiveFragileSaveFields(state) },
  geometryContracts: {
    town: TOWN_LOGICAL_GEOMETRY.id,
    interiors: [VILLAGE_GROCER_GEOMETRY.id, PAWS_WONDERS_GEOMETRY.id, HARBOUR_GENERAL_GEOMETRY.id],
    stableLogicalUnits: [TOWN_LOGICAL_GEOMETRY, VILLAGE_GROCER_GEOMETRY, PAWS_WONDERS_GEOMETRY, HARBOUR_GENERAL_GEOMETRY].every((entry) => entry.units === "logical-pixels"),
  },
  world: { width: WORLD.width, height: WORLD.height, cameraContractSource: "src/data/townGeometry.js" },
};

if (outputPath) {
  await mkdir(resolve(outputPath, ".."), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}

console.log(JSON.stringify(report, null, 2));
