import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { WORLD, ROADS, PATHS, TOWN_REFERENCE_LAYOUT, HOUSES } from "../src/data/town.js";
import { PERSONAL_HOME_LEVELS } from "../src/data/customResident.js";
import { createVisualRegressionFixtureState, VISUAL_REGRESSION_VIEWPORTS } from "../src/qa/visualRegressionFixtures.js";
import { VisualRegistry } from "../src/visual/VisualRegistry.js";
import { FISHING_SCENE_LAYOUT } from "../src/visual/layouts/fishingSceneLayout.js";
import { SCALE_CALIBRATION_OBJECTS, validateCalibrationFixtures } from "../src/visual/scale/calibrationFixtures.js";
import {
  CANONICAL_LANDSCAPE,
  DEPTH_LAYER_IDS,
  HUD_SAFE_AREA,
  LOGICAL_WORLD,
  MEASURED_WORLD_REFERENCES,
  NATIVE_PIXEL_DENSITY,
  RESIDENT_MEASURING_REFERENCE,
  SUPPORTED_LANDSCAPE_VIEWPORTS,
  compareGroundOrder,
  groundContactWorldPosition,
  resolveCameraFit,
  resolveDisplayMetrics,
  resolveGroundDepth,
  resolveHudSafeArea,
  validateScaleSystem,
} from "../src/visual/scale/scaleSystem.js";
import { TownBinVisualFactory } from "../src/visual/renderers/TownBinVisualFactory.js";

const root = resolve(import.meta.dirname, "..");
const digest = (value) => createHash("sha256").update(JSON.stringify(value)).digest("hex");

class FakeDisplayObject {
  constructor(kind, args = []) { this.kind = kind; this.args = args; this.children = []; this.data = {}; this.commands = []; }
  add(value) { this.children.push(...(Array.isArray(value) ? value : [value])); return this; }
  addAt(value, index) { this.children.splice(index, 0, value); return this; }
  setAlpha(value) { this.alpha = value; return this; }
  setDepth(value) { this.depth = value; return this; }
  setDisplaySize(width, height) { this.displaySize = { width, height }; return this; }
  setInteractive() { this.interactive = true; this.input = {}; return this; }
  setOrigin(x, y = x) { this.origin = { x, y }; return this; }
  setRotation(value) { this.rotation = value; return this; }
  setSize(width, height) { this.size = { width, height }; return this; }
  setVisible(value) { this.visible = value; return this; }
  setData(key, value) { this.data[key] = value; return this; }
  on() { return this; }
  fillStyle(...args) { this.commands.push(["fillStyle", ...args]); return this; }
  fillEllipse(...args) { this.commands.push(["fillEllipse", ...args]); return this; }
  fillRoundedRect(...args) { this.commands.push(["fillRoundedRect", ...args]); return this; }
  fillCircle(...args) { this.commands.push(["fillCircle", ...args]); return this; }
  lineStyle(...args) { this.commands.push(["lineStyle", ...args]); return this; }
  strokeCircle(...args) { this.commands.push(["strokeCircle", ...args]); return this; }
}

function fakeScene() {
  const registry = new VisualRegistry();
  const create = (kind, ...args) => new FakeDisplayObject(kind, args);
  return {
    registry: { get: (key) => key === "visualRegistry" ? registry : null },
    add: {
      container: (...args) => create("container", ...args), graphics: (...args) => create("graphics", ...args),
      ellipse: (...args) => create("ellipse", ...args), rectangle: (...args) => create("rectangle", ...args),
      text: (...args) => create("text", ...args), image: (...args) => create("image", ...args),
    },
  };
}

test("scale system is versioned and derived from the current Phaser world", async () => {
  assert.deepEqual(validateScaleSystem(), { ok: true, errors: [] });
  assert.deepEqual(validateCalibrationFixtures(), { ok: true, errors: [] });
  assert.deepEqual(CANONICAL_LANDSCAPE, { id: "kindworks-landscape-1280x720", width: 1280, height: 720, aspectRatio: 16 / 9 });
  assert.deepEqual(LOGICAL_WORLD.townSize, WORLD);
  assert.equal(LOGICAL_WORLD.canonicalPixelsPerUnit, 1);
  assert.equal(RESIDENT_MEASURING_REFERENCE.nativeSize.width, 40);
  assert.equal(RESIDENT_MEASURING_REFERENCE.nativeSize.height, 54);
  assert.deepEqual(MEASURED_WORLD_REFERENCES.river, { waterWidth: TOWN_REFERENCE_LAYOUT.river.waterWidth, bankWidth: TOWN_REFERENCE_LAYOUT.river.bankWidth });
  assert.deepEqual(MEASURED_WORLD_REFERENCES.roadWidths, { minimum: Math.min(...ROADS.map(({ width }) => width)), maximum: Math.max(...ROADS.map(({ width }) => width)), edgeAddition: 16 });
  assert.deepEqual(MEASURED_WORLD_REFERENCES.pathWidths, { minimum: Math.min(...PATHS.map(({ width }) => width)), maximum: Math.max(...PATHS.map(({ width }) => width)), edgeAddition: 8 });
  assert.deepEqual(MEASURED_WORLD_REFERENCES.houses.compact, { width: Math.min(...HOUSES.map(({ width }) => width)), height: Math.min(...HOUSES.map(({ height }) => height)) });
  assert.deepEqual(MEASURED_WORLD_REFERENCES.houses.standard, { width: Math.max(...HOUSES.map(({ width }) => width)), height: Math.max(...HOUSES.map(({ height }) => height)) });
  assert.deepEqual(MEASURED_WORLD_REFERENCES.houses.personalScaleRange, { minimum: Math.min(...PERSONAL_HOME_LEVELS.map(({ scale }) => scale)), maximum: Math.max(...PERSONAL_HOME_LEVELS.map(({ scale }) => scale)) });

  const [main, player] = await Promise.all([
    readFile(resolve(root, "src/main.js"), "utf8"),
    readFile(resolve(root, "src/entities/PlayerCharacter.js"), "utf8"),
  ]);
  assert.match(main, /width: 1280[\s\S]*height: 720[\s\S]*pixelArt: true[\s\S]*roundPixels: true[\s\S]*mode: Phaser\.Scale\.FIT/);
  assert.match(player, /generateTexture\(key, 40, 54\)/);
  assert.match(player, /setOrigin\(0\.5, 0\.88\)/);
});

test("camera-fit contract reproduces the five measured browser profiles", () => {
  assert.deepEqual(SUPPORTED_LANDSCAPE_VIEWPORTS, VISUAL_REGRESSION_VIEWPORTS);
  const expected = {
    "narrow-phone": { width: 568, height: 319.5, x: 0, y: 0.25 },
    "modern-phone": { width: 693.3333333333334, height: 390, x: 75.33333333333331, y: 0 },
    "tablet-4x3": { width: 1024, height: 576, x: 0, y: 96 },
    reference: { width: 1280, height: 720, x: 0, y: 0 },
    desktop: { width: 1365.3333333333333, height: 768, x: 0.33333333333337123, y: 0 },
  };
  for (const viewport of SUPPORTED_LANDSCAPE_VIEWPORTS) {
    const fit = resolveCameraFit(viewport);
    assert.ok(Math.abs(fit.displayWidth - expected[viewport.id].width) < 0.001);
    assert.ok(Math.abs(fit.displayHeight - expected[viewport.id].height) < 0.001);
    assert.ok(Math.abs(fit.offsetX - expected[viewport.id].x) < 0.001);
    assert.ok(Math.abs(fit.offsetY - expected[viewport.id].y) < 0.001);
  }
  assert.deepEqual(resolveHudSafeArea({ width: 568, height: 320 }), { x: 4, y: 4, width: 560, height: 312, minimumTouchTarget: 44 });
  assert.equal(HUD_SAFE_AREA.minimumTouchTargetCssPixels, 44);
});

test("oversized replacement art cannot expand logical or gameplay geometry", () => {
  const baseline = resolveDisplayMetrics({ logicalBounds: SCALE_CALIBRATION_OBJECTS.standardHouse.visual, technical: SCALE_CALIBRATION_OBJECTS.standardHouse.technical });
  const oversized = resolveDisplayMetrics({ logicalBounds: SCALE_CALIBRATION_OBJECTS.oversizedReplacementHouse.visual, technical: SCALE_CALIBRATION_OBJECTS.oversizedReplacementHouse.technical });
  assert.deepEqual({ width: oversized.width, height: oversized.height }, { width: baseline.width, height: baseline.height });
  assert.equal(oversized.nativeWidth, 4096);
  assert.equal(oversized.nativeHeight, 4096);
  assert.equal(oversized.sourceDimensionsAffectLogicalFootprint, false);
  assert.deepEqual(SCALE_CALIBRATION_OBJECTS.oversizedReplacementHouse.collision, SCALE_CALIBRATION_OBJECTS.standardHouse.collision);
  assert.deepEqual(SCALE_CALIBRATION_OBJECTS.oversizedReplacementHouse.navigation, SCALE_CALIBRATION_OBJECTS.standardHouse.navigation);

  const oversizedTree = resolveDisplayMetrics({ logicalBounds: SCALE_CALIBRATION_OBJECTS.tree.visual, technical: SCALE_CALIBRATION_OBJECTS.tree.technical });
  assert.deepEqual({ width: oversizedTree.width, height: oversizedTree.height }, { width: 87, height: 97 });
  assert.equal(oversizedTree.nativeWidth, 4096);
  assert.equal(SCALE_CALIBRATION_OBJECTS.tree.collision.radius, 50);
});

test("pilot bins and player sort from ground contact without changing interaction footprint", () => {
  const scene = fakeScene();
  const bin = new TownBinVisualFactory(scene).createPlacedObject({ id: "depth-bin", itemId: "small-town-bin", x: 660, y: 535, rotation: 0 });
  const binGround = groundContactWorldPosition({ x: 660, y: 535 }, SCALE_CALIBRATION_OBJECTS.bin.groundContact);
  assert.deepEqual(binGround, { x: 660, y: 558 });
  assert.equal(bin.depth, resolveGroundDepth(DEPTH_LAYER_IDS.GROUND_SORTED, binGround.y, { base: 200, divisor: 10 }));
  assert.equal(compareGroundOrder(520, binGround.y), "behind");
  assert.equal(compareGroundOrder(600, binGround.y), "in-front");
  assert.ok(resolveGroundDepth(DEPTH_LAYER_IDS.GROUND_SORTED, 520) < bin.depth);
  assert.ok(resolveGroundDepth(DEPTH_LAYER_IDS.GROUND_SORTED, 600) > bin.depth);
  assert.deepEqual(bin.size, { width: 56, height: 56 });
  assert.equal(bin.data.footprint, 28);
  assert.equal(SCALE_CALIBRATION_OBJECTS.bin.interaction.radius, 76);
  assert.deepEqual(SCALE_CALIBRATION_OBJECTS.bin.touch, { kind: "rectangle", x: -28, y: -28, width: 56, height: 56 });
});

test("Fishing representative layout adopts scale contract without moving gameplay geometry", () => {
  assert.equal(FISHING_SCENE_LAYOUT.scaleSystem.profileId, CANONICAL_LANDSCAPE.id);
  assert.equal(FISHING_SCENE_LAYOUT.scaleSystem.logicalUnit, "phaser-world-unit");
  assert.equal(FISHING_SCENE_LAYOUT.scaleSystem.nativePixelsPerLogicalUnit, NATIVE_PIXEL_DENSITY.baselinePixelsPerLogicalUnit);
  assert.deepEqual(FISHING_SCENE_LAYOUT.canonicalSize, { width: 1280, height: 720 });
  assert.deepEqual(FISHING_SCENE_LAYOUT.safeAreas[0].geometry, { x: 16, y: 16, width: 1248, height: 688 });
  assert.equal(FISHING_SCENE_LAYOUT.safeAreas[0].minimumTouchTargetCssPixels, 44);
  assert.deepEqual(FISHING_SCENE_LAYOUT.zones.find(({ id }) => id === "zone.fishing.water").geometry, { x: 120, y: 135, width: 1040, height: 405 });
});

test("calibration scene is permanent development tooling and excluded from production", async () => {
  const [scene, main, productionAudit] = await Promise.all([
    readFile(resolve(root, "src/scenes/ScaleCalibrationScene.js"), "utf8"),
    readFile(resolve(root, "src/main.js"), "utf8"),
    readFile(resolve(root, "scripts/verify-production-surface.mjs"), "utf8"),
  ]);
  for (const marker of ["PlayerCharacter", "NpcCharacter", "drawHouseReference", "drawTreeReference", "drawBenchReference", "drawDoorReference", "drawFenceReference", "TownBinVisualFactory", "SUPPORTED VIEWPORT FRAMES", "River", "Road", "Pavement/path", "Lawn sample", "geometryGuides"]) assert.match(scene, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(main, /import\.meta\.env\.DEV && qaMode === "scale-calibration"/);
  assert.match(main, /import\("\.\/scenes\/ScaleCalibrationScene\.js"\)/);
  for (const marker of ["ScaleCalibrationScene", "kw-scale-calibration", "scaleCalibrationReady"]) assert.match(productionAudit, new RegExp(marker));
});

test("scale resolution cannot mutate the protected schema-37 save fixture", () => {
  const state = createVisualRegressionFixtureState();
  const before = digest(state);
  resolveCameraFit(SUPPORTED_LANDSCAPE_VIEWPORTS[0]);
  resolveDisplayMetrics({ logicalBounds: SCALE_CALIBRATION_OBJECTS.tree.visual, technical: SCALE_CALIBRATION_OBJECTS.tree.technical });
  resolveGroundDepth(DEPTH_LAYER_IDS.GROUND_SORTED, 558);
  assert.equal(digest(state), before);
  assert.equal(state.schemaVersion, 37);
  assert.equal(state.economy.coins, 12_500);
});
