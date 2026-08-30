import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { ANIMAL_DEFINITIONS, groundAnimalSegmentBlocked } from "../src/data/animals.js";
import { HARBOUR_GENERAL_GEOMETRY, PAWS_WONDERS_GEOMETRY, VILLAGE_GROCER_GEOMETRY } from "../src/data/interiorGeometry.js";
import { getLawnLevel, LawnCareEngine } from "../src/data/lawnCare.js";
import { circleTouchesLogicalRect, pointInLogicalRect } from "../src/data/logicalGeometry.js";
import { NPC_NAVIGATION_LINKS, NPC_NAVIGATION_NODES, NPC_RESIDENTS } from "../src/data/npcTownLife.js";
import { HOUSES, SHOPS } from "../src/data/town.js";
import { TOWN_HOUSE_GEOMETRY, TOWN_LOGICAL_GEOMETRY, TOWN_SHOP_GEOMETRY } from "../src/data/townGeometry.js";
import { npcNavigationDetour, npcNavigationEdgeBlockedByPlacements } from "../src/data/townPlacement.js";
import { createFreshGameState, GameStateService } from "../src/state/GameState.js";
import { LawnCareService } from "../src/systems/LawnCareService.js";
import { NavigationGraph } from "../src/systems/NavigationGraph.js";
import { NpcTownLifeService } from "../src/systems/NpcTownLifeService.js";
import { VisualRegistry } from "../src/visual/VisualRegistry.js";
import { PHASE_8A_ASSET_IDS, PHASE_8A_VERTICAL_SLICE_PACKAGE } from "../src/visual/verticalSlice/phase8aVerticalSlicePackage.js";
import { validatePhase8APackage } from "../src/visual/verticalSlice/validatePhase8APackage.js";
import { PhaserPrefabRenderer } from "../src/visual/renderers/PhaserPrefabRenderer.js";
import { resolvePrefabDisplayMetrics } from "../src/visual/scale/scaleSystem.js";
import { KINDWORKS_VISUAL_MANIFEST, VISUAL_ASSET_IDS, VISUAL_PREFAB_IDS } from "../src/visual/visualManifest.js";
import { inspectImageFile } from "../scripts/lib/artworkPipelineValidation.mjs";

const projectRoot = resolve(import.meta.dirname, "..");
const digest = (value) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const clone = (value) => structuredClone(value);

function geometrySnapshot() {
  return clone({
    town: TOWN_LOGICAL_GEOMETRY,
    houses: TOWN_HOUSE_GEOMETRY,
    shops: TOWN_SHOP_GEOMETRY,
    interiors: [VILLAGE_GROCER_GEOMETRY, PAWS_WONDERS_GEOMETRY, HARBOUR_GENERAL_GEOMETRY],
  });
}

function fakePhaserScene(registry) {
  const images = [];
  const scene = {
    registry: { get: (key) => key === "visualRegistry" ? registry : null },
    add: {
      image(x, y, key) {
        const image = {
          x, y, key, origin: null, display: null, data: {},
          setOrigin(originX, originY) { this.origin = { x: originX, y: originY }; return this; },
          setDisplaySize(width, height) { this.display = { width, height }; return this; },
          setData(keyName, value) { this.data[keyName] = value; return this; },
        };
        images.push(image);
        return image;
      },
    },
  };
  return { scene, images };
}

function replacementManifest({ sourceFile, format, width, height }) {
  const manifest = clone(KINDWORKS_VISUAL_MANIFEST);
  const asset = manifest.assets.find(({ id }) => id === VISUAL_ASSET_IDS.FISHING_REEDBANK_BACKGROUND);
  asset.source.file = sourceFile;
  asset.source.format = format;
  asset.technical.width = width;
  asset.technical.height = height;
  asset.cache.version = `geometry-retest-${width}x${height}`;
  asset.cache.contentSha256 = `${String(width).padStart(8, "0")}${String(height).padStart(8, "0")}`.padEnd(64, "0");
  return manifest;
}

function sampleSegment(from, to, spacing = 2) {
  const steps = Math.max(1, Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) / spacing));
  return Array.from({ length: steps + 1 }, (_, index) => ({
    x: from.x + (to.x - from.x) * index / steps,
    y: from.y + (to.y - from.y) * index / steps,
  }));
}

function gameplayDigest(state) {
  return digest({
    schemaVersion: state.schemaVersion,
    player: state.player,
    progress: state.progress,
    economy: state.economy,
    inventory: state.inventory,
    townPlacement: state.townPlacement,
    npcs: state.npcs,
    animals: state.animals,
    farming: state.farming,
    lawnCare: state.lawnCare,
  });
}

test("real replacement image files with radically different canvases retain prefab and gameplay geometry", async () => {
  const candidates = [
    "/assets/animals/reference-master-v44.png",
    "/assets/powerwash/tool-precision.png",
    "/assets/powerwash/playground-master.png",
  ];
  const beforeGeometry = geometrySnapshot();
  const beforeGeometryDigest = digest(beforeGeometry);
  const rendered = [];

  for (const sourceFile of candidates) {
    const absolute = resolve(projectRoot, "public", sourceFile.replace(/^\//, ""));
    const inspected = await inspectImageFile(absolute);
    assert.ok(inspected.width > 0 && inspected.height > 0, sourceFile);
    const registry = new VisualRegistry({
      manifest: replacementManifest({ sourceFile, format: inspected.format, width: inspected.width, height: inspected.height }),
      reporter: { error() {} },
    });
    const { scene } = fakePhaserScene(registry);
    const renderer = new PhaserPrefabRenderer(scene, registry);
    const resolved = renderer.resolve(VISUAL_PREFAB_IDS.FISHING_REEDBANK_BACKGROUND);
    const display = resolvePrefabDisplayMetrics(resolved.prefab, resolved.layers[0].asset);
    rendered.push({ sourceFile, native: { width: inspected.width, height: inspected.height }, display: { width: display.width, height: display.height }, origin: resolved.origin });
    assert.deepEqual({ width: display.width, height: display.height }, { width: 1280, height: 720 });
    assert.deepEqual(resolved.origin, { x: 0.5, y: 0.5 });
    assert.equal(resolved.collisionFootprint, null);
    assert.equal(resolved.navigationFootprint, null);
    assert.equal(resolved.interactionZone, null);
  }

  assert.ok(new Set(rendered.map(({ native }) => `${native.width}x${native.height}`)).size >= 3);
  assert.equal(digest(geometrySnapshot()), beforeGeometryDigest);
});

test("invalid animation-frame dimensions are rejected before runtime without mutating logical geometry", () => {
  const packageDefinition = clone(PHASE_8A_VERTICAL_SLICE_PACKAGE);
  const npc = packageDefinition.assets.find(({ semanticId }) => semanticId === PHASE_8A_ASSET_IDS.NPC);
  const before = digest(npc.geometry);
  npc.output.spriteSheet.frameWidth = 96;
  npc.output.spriteSheet.frameHeight = 31;
  const result = validatePhase8APackage({ packageDefinition });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some(({ code }) => ["invalid-sheet-grid", "runtime-asset-drift"].includes(code)), JSON.stringify(result.errors, null, 2));
  assert.equal(digest(npc.geometry), before);
});

test("transparent padding and authored-origin changes remain visual metadata, not gameplay geometry", () => {
  const prefab = clone(KINDWORKS_VISUAL_MANIFEST.prefabs.find(({ id }) => id === VISUAL_PREFAB_IDS.FISHING_REEDBANK_BACKGROUND));
  const protectedGeometry = digest(prefab.geometry);
  const adversarialArtwork = [
    { canvas: { width: 1, height: 4096 }, transparentPadding: { left: 0, right: 0, top: 2048, bottom: 2048 }, authoredOrigin: { x: -2, y: 4 } },
    { canvas: { width: 8192, height: 8 }, transparentPadding: { left: 4000, right: 4000, top: 0, bottom: 0 }, authoredOrigin: { x: 1, y: 1 } },
  ];
  for (const artwork of adversarialArtwork) {
    artwork.canvas.width += 7;
    artwork.authoredOrigin.x += 3;
    assert.equal(digest(prefab.geometry), protectedGeometry);
  }
});

test("all outdoor NPC graph links remain clear and legacy placements produce deterministic safe detours", () => {
  const nodeById = new Map(NPC_NAVIGATION_NODES.map((node) => [node.id, node]));
  const indoorKinds = new Set(["home", "cafe", "shop", "bakery", "restaurant", "pub", "market", "cinema"]);
  let checked = 0;
  for (const [fromId, toId] of NPC_NAVIGATION_LINKS) {
    const from = nodeById.get(fromId); const to = nodeById.get(toId);
    assert.ok(from && to, `${fromId} -> ${toId}`);
    if (indoorKinds.has(from.kind) || indoorKinds.has(to.kind)) continue;
    const blocked = sampleSegment(from, to).some((point) => TOWN_LOGICAL_GEOMETRY.navigationObstacles.some((rect) => pointInLogicalRect(point, rect, 18)));
    assert.equal(blocked, false, `${fromId} -> ${toId}`);
    checked += 1;
  }
  assert.ok(checked > 80);

  const graph = new NavigationGraph(NPC_NAVIGATION_NODES, NPC_NAVIGATION_LINKS);
  const blocker = { itemId: "town-planter", x: 405, y: 1155 };
  const from = graph.getNode("market1"); const to = graph.getNode("market2");
  assert.equal(npcNavigationEdgeBlockedByPlacements(from, to, [blocker]), true);
  const first = npcNavigationDetour(from, to, [blocker], "independent-retest");
  const second = npcNavigationDetour(from, to, [blocker], "independent-retest");
  assert.deepEqual(first, second);
  assert.ok(first.length >= 2);
  assert.ok(first.every((point) => Math.hypot(point.x - blocker.x, point.y - blocker.y) > 50));
});

test("live NPC service route and saved graph identity do not depend on replacement artwork", () => {
  const initial = createFreshGameState({ now: 1_700_000_000_000 });
  initial.townPlacement.objects = [{ id: "legacy-planter", itemId: "town-planter", x: 405, y: 1155, hooks: { playerCollision: { radius: 30 } } }];
  const state = { getSnapshot: () => clone(initial) };
  const service = new NpcTownLifeService(state, null);
  const resident = {
    ...clone(initial.npcs.residents[0]), id: NPC_RESIDENTS[0].id, x: 305, y: 1155,
    currentNodeId: "market1", targetNodeId: "market2", route: ["market1", "market2"], routeIndex: 1,
    phase: "commuting", visible: true,
  };
  const savedRoute = clone(resident.route);
  service.moveResident(resident, NPC_RESIDENTS[0], { targetNodeId: "market2", phase: "leisure", activity: "Retest" }, 110);
  assert.deepEqual(resident.route, savedRoute);
  assert.ok(Math.hypot(resident.x - 405, resident.y - 1155) > 50);
});

test("every ground-animal route remains clear and movement contracts stay independent of frames", () => {
  let segments = 0;
  for (const animal of ANIMAL_DEFINITIONS.filter(({ aerial, water }) => !aerial && !water)) {
    for (let index = 0; index < animal.route.length; index += 1) {
      const from = animal.route[index]; const to = animal.route[(index + 1) % animal.route.length];
      assert.equal(groundAnimalSegmentBlocked(from, to), false, `${animal.id}:${index}`);
      segments += 1;
    }
  }
  assert.ok(segments > 300);
});

test("house/shop entrances, standing points and interior touch targets stay outside collision geometry", () => {
  const standingPointViolations = [];
  for (const house of HOUSES) {
    const entry = TOWN_HOUSE_GEOMETRY[house.id];
    assert.equal(circleTouchesLogicalRect(entry.entrance.x, entry.entrance.y, 17, entry.collision), false, house.id);
    assert.equal(pointInLogicalRect(entry.standingPoint, entry.collision), false, house.id);
  }
  for (const shop of SHOPS) {
    const entry = TOWN_SHOP_GEOMETRY[shop.title];
    assert.equal(circleTouchesLogicalRect(entry.entrance.x, entry.entrance.y, 17, entry.collision), false, shop.title);
    assert.equal(pointInLogicalRect(entry.standingPoint, entry.collision), false, shop.title);
  }
  for (const contract of [VILLAGE_GROCER_GEOMETRY, PAWS_WONDERS_GEOMETRY, HARBOUR_GENERAL_GEOMETRY]) {
    assert.ok(contract.touchTargets.every(({ width, height, minCssPixels }) => width > 0 && height > 0 && minCssPixels >= 44));
    for (const point of contract.standingPoints) {
      const obstacles = contract.navigationObstacles.filter((rect) => pointInLogicalRect(point, rect, 17)).map(({ id }) => id);
      if (obstacles.length) standingPointViolations.push({ contractId: contract.id, pointId: point.id, obstacles });
    }
  }
  assert.deepEqual(standingPointViolations, []);
});

test("Lawn Care swipe outcome, completion reward and save digest are identical across registry replacements", () => {
  function run(manifest) {
    const visualRegistry = new VisualRegistry({ manifest, reporter: { error() {} } });
    const initial = createFreshGameState({ now: 1_700_000_000_000 });
    const state = new GameStateService(initial);
    const repository = { save: () => ({ ok: true }) };
    const service = new LawnCareService(state, repository, { now: () => 1_700_000_000_000 });
    const started = service.beginCampaign(1, { returnPosition: { x: 305, y: 530 }, returnFacing: "up" });
    assert.equal(started.ok, true);
    const sessionId = started.session.id;
    const solution = getLawnLevel(1).canonicalSolution;
    const engine = new LawnCareEngine(1);
    const firstMove = engine.move(solution[0]);
    assert.equal(firstMove.ok, true);
    const completed = service.completeCertified(sessionId);
    assert.equal(completed.ok, true);
    return {
      semanticTextureKey: visualRegistry.getTextureKey(VISUAL_ASSET_IDS.FISHING_REEDBANK_BACKGROUND),
      firstMove: { row: firstMove.row, col: firstMove.col, direction: firstMove.direction },
      result: completed.result,
      rewardCoins: completed.rewardCoins,
      stateDigest: gameplayDigest(state.getSnapshot()),
    };
  }

  const baseline = run(clone(KINDWORKS_VISUAL_MANIFEST));
  const replacement = run(replacementManifest({ sourceFile: "/assets/powerwash/tool-precision.png", format: "png", width: 80, height: 101 }));
  assert.deepEqual(replacement, baseline);
});

test("production gameplay sources do not derive geometry from texture/frame/render bounds", async () => {
  const files = [
    "src/scenes/TownScene.js", "src/entities/PlayerCharacter.js", "src/entities/NpcCharacter.js", "src/entities/AnimalCharacter.js",
    "src/systems/NpcTownLifeService.js", "src/systems/CustomResidentService.js", "src/systems/AnimalService.js",
    "src/scenes/LawnCareScene.js", "src/scenes/RiverClearoutScene.js", "src/scenes/BeachCleanupScene.js", "src/scenes/PlaygroundPowerwashScene.js",
  ];
  const sources = await Promise.all(files.map(async (file) => ({ file, text: await readFile(resolve(projectRoot, file), "utf8") })));
  const forbidden = /\b(?:sprite|image|texture|frame|character)\.(?:width|height|displayWidth|displayHeight|originX|originY)\b|\.getBounds\s*\(|\.body\.(?:setSize|setCircle)\s*\(/g;
  const violations = sources.flatMap(({ file, text }) => [...text.matchAll(forbidden)].map((match) => ({ file, match: match[0] })));
  assert.deepEqual(violations, []);
});
