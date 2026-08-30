import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { MAGNET_TARGETING_CONFIG, TARGETING_CONFIG } from "../src/data/fishing.js";
import { createVisualRegressionFixtureState } from "../src/qa/visualRegressionFixtures.js";
import {
  FISHING_LAYOUT_INSTANCE_IDS,
  FISHING_LAYOUT_SOCKET_IDS,
  FISHING_LAYOUT_ZONE_IDS,
  FISHING_SCENE_LAYOUT,
} from "../src/visual/layouts/fishingSceneLayout.js";
import {
  exportSceneLayout,
  getSceneLayoutInstance,
  getSceneLayoutSocket,
  getSceneLayoutZone,
  moveSceneLayoutInstance,
  validateSceneLayout,
} from "../src/visual/layouts/sceneLayoutContracts.js";

const root = resolve(import.meta.dirname, "..");
const digest = (value) => createHash("sha256").update(JSON.stringify(value)).digest("hex");

test("Fishing is a complete versioned canonical scene layout", () => {
  const validation = validateSceneLayout(FISHING_SCENE_LAYOUT);
  assert.equal(validation.ok, true, JSON.stringify(validation.errors, null, 2));
  assert.equal(FISHING_SCENE_LAYOUT.schemaVersion, 2);
  assert.equal(FISHING_SCENE_LAYOUT.revision, 1);
  assert.equal(FISHING_SCENE_LAYOUT.sceneId, "FishingScene");
  assert.deepEqual(FISHING_SCENE_LAYOUT.canonicalSize, { width: 1280, height: 720 });
  assert.equal(FISHING_SCENE_LAYOUT.grid.size, 8);
  assert.equal(FISHING_SCENE_LAYOUT.instances.length, 12);
  assert.ok(FISHING_SCENE_LAYOUT.instances.every((entry) => entry.id && entry.prefabId && entry.visual && entry.responsiveAnchor));
  assert.equal(FISHING_SCENE_LAYOUT.entrances.length, 2);
  assert.ok(FISHING_SCENE_LAYOUT.sockets.some(({ id }) => id === FISHING_LAYOUT_SOCKET_IDS.EXIT));
  assert.ok(FISHING_SCENE_LAYOUT.safeAreas.length > 0);
});

test("extracted baseline preserves all protected Fishing coordinates", () => {
  const background = getSceneLayoutInstance(FISHING_SCENE_LAYOUT, FISHING_LAYOUT_INSTANCE_IDS.BACKGROUND);
  assert.deepEqual(background.visual.position, { x: 640, y: 360 });
  assert.deepEqual(background.visual.bounds, { width: 1280, height: 720 });
  assert.deepEqual(getSceneLayoutZone(FISHING_SCENE_LAYOUT, FISHING_LAYOUT_ZONE_IDS.FISH_WATER).geometry, TARGETING_CONFIG.waterArea);
  assert.deepEqual(getSceneLayoutZone(FISHING_SCENE_LAYOUT, FISHING_LAYOUT_ZONE_IDS.MAGNET_WATER).geometry, MAGNET_TARGETING_CONFIG.waterArea);
  assert.deepEqual(getSceneLayoutSocket(FISHING_SCENE_LAYOUT, FISHING_LAYOUT_SOCKET_IDS.FISH_ROD_GRIP).position, { x: 334, y: 517 });
  assert.deepEqual(getSceneLayoutSocket(FISHING_SCENE_LAYOUT, FISHING_LAYOUT_SOCKET_IDS.FISH_ROD_IDLE_TIP).position, { x: 825, y: 149 });
  assert.deepEqual(getSceneLayoutSocket(FISHING_SCENE_LAYOUT, FISHING_LAYOUT_SOCKET_IDS.MAGNET_ROPE_START).position, { x: 114, y: 588 });
  assert.deepEqual(getSceneLayoutSocket(FISHING_SCENE_LAYOUT, FISHING_LAYOUT_SOCKET_IDS.MAGNET_REST).position, { x: 235, y: 542 });
  assert.deepEqual(getSceneLayoutZone(FISHING_SCENE_LAYOUT, FISHING_LAYOUT_ZONE_IDS.DOCK).geometry, { x: 465, y: 500, width: 350, height: 220 });
  assert.deepEqual(getSceneLayoutZone(FISHING_SCENE_LAYOUT, FISHING_LAYOUT_ZONE_IDS.BRIDGE).geometry, { x: 0, y: 520, width: 1280, height: 200 });
});

test("one object moves through layout data only while gameplay geometry stays byte-identical", () => {
  const geometryBefore = digest({
    zones: FISHING_SCENE_LAYOUT.zones,
    sockets: FISHING_SCENE_LAYOUT.sockets,
    collisions: FISHING_SCENE_LAYOUT.collisionReferences,
    navigation: FISHING_SCENE_LAYOUT.navigationReferences,
    interactions: FISHING_SCENE_LAYOUT.interactionReferences,
  });
  const result = moveSceneLayoutInstance(FISHING_SCENE_LAYOUT, FISHING_LAYOUT_INSTANCE_IDS.BACKGROUND, { x: 649, y: 367 }, { gridSize: 8 });
  assert.equal(result.ok, true);
  assert.deepEqual(result.position, { x: 648, y: 368 });
  assert.deepEqual(getSceneLayoutInstance(result.layout, FISHING_LAYOUT_INSTANCE_IDS.BACKGROUND).visual.position, { x: 648, y: 368 });
  assert.deepEqual(getSceneLayoutInstance(FISHING_SCENE_LAYOUT, FISHING_LAYOUT_INSTANCE_IDS.BACKGROUND).visual.position, { x: 640, y: 360 });
  assert.equal(digest({
    zones: result.layout.zones,
    sockets: result.layout.sockets,
    collisions: result.layout.collisionReferences,
    navigation: result.layout.navigationReferences,
    interactions: result.layout.interactionReferences,
  }), geometryBefore);
  const locked = moveSceneLayoutInstance(FISHING_SCENE_LAYOUT, FISHING_LAYOUT_INSTANCE_IDS.BACKGROUND, { x: 648, y: 368 }, { layer: "gameplay" });
  assert.deepEqual({ ok: locked.ok, code: locked.code }, { ok: false, code: "gameplay-geometry-locked" });
});

test("layout validation rejects duplicate IDs and required out-of-bounds elements", () => {
  const duplicate = structuredClone(FISHING_SCENE_LAYOUT);
  duplicate.instances[1].id = duplicate.instances[0].id;
  const duplicateResult = validateSceneLayout(duplicate);
  assert.equal(duplicateResult.ok, false);
  assert.ok(duplicateResult.errors.some(({ code }) => code === "duplicate-layout-id"));

  const outOfBounds = structuredClone(FISHING_SCENE_LAYOUT);
  outOfBounds.instances.find(({ id }) => id === FISHING_LAYOUT_INSTANCE_IDS.TITLE).visual.position.x = -1;
  const outOfBoundsResult = validateSceneLayout(outOfBounds);
  assert.equal(outOfBoundsResult.ok, false);
  assert.ok(outOfBoundsResult.errors.some(({ code }) => code === "required-instance-out-of-bounds"));
});

test("validated export is stable and contains semantic layout sections", () => {
  const result = exportSceneLayout(FISHING_SCENE_LAYOUT);
  assert.equal(result.ok, true);
  const exported = JSON.parse(result.json);
  assert.equal(exported.id, "layout.scene.fishing");
  assert.deepEqual(Object.keys(exported).filter((key) => ["instances", "zones", "sockets", "entrances", "collisionReferences", "navigationReferences", "interactionReferences"].includes(key)).sort(), [
    "collisionReferences", "entrances", "instances", "interactionReferences", "navigationReferences", "sockets", "zones",
  ]);
});

test("FishingScene consumes semantic layout locations instead of duplicate rig and zone constants", async () => {
  const source = await readFile(resolve(root, "src/scenes/FishingScene.js"), "utf8");
  assert.match(source, /this\.layoutSocket\(FISHING_LAYOUT_SOCKET_IDS\.FISH_ROD_GRIP\)/);
  assert.match(source, /this\.layoutZone\(fishingWaterZoneId\(this\.mode\)\)/);
  assert.match(source, /applyLayoutVisualPosition/);
  assert.doesNotMatch(source, /const ROOM|const FISH_RIG|const MAGNET_RIG/);
  assert.doesNotMatch(source, /TARGETING_CONFIG\.waterArea|MAGNET_TARGETING_CONFIG\.waterArea/);
});

test("Reference Overlay Mode contains the required tools and is guarded from production", async () => {
  const [overlay, scene, main, productionAudit] = await Promise.all([
    readFile(resolve(root, "src/visual/dev/ReferenceOverlayController.js"), "utf8"),
    readFile(resolve(root, "src/scenes/FishingScene.js"), "utf8"),
    readFile(resolve(root, "src/main.js"), "utf8"),
    readFile(resolve(root, "scripts/verify-production-surface.mjs"), "utf8"),
  ]);
  for (const marker of ["Load supplied reference image", "Reference opacity", "Live", "Reference", "Split", "Difference", "Move visual", "Export validated JSON", "Origins + bounds", "Geometry + sockets", "Safe areas", "Gameplay geometry is locked"]) {
    assert.match(overlay, new RegExp(marker.replace(/[+]/g, "\\+")));
  }
  assert.match(scene, /if \(!import\.meta\.env\.DEV \|\| this\.qaMode !== "reference-overlay"\) return;/);
  assert.match(scene, /import\("\.\.\/visual\/dev\/ReferenceOverlayController\.js"\)/);
  assert.match(main, /const referenceOverlayQa = import\.meta\.env\.DEV/);
  for (const marker of ["ReferenceOverlayController", "kw-reference-overlay", "referenceOverlayReady"]) assert.match(productionAudit, new RegExp(marker));
});

test("layout resolution and visual movement cannot mutate the protected save fixture", () => {
  const state = createVisualRegressionFixtureState();
  const before = digest(state);
  getSceneLayoutSocket(FISHING_SCENE_LAYOUT, FISHING_LAYOUT_SOCKET_IDS.FISH_DEFAULT_TARGET);
  moveSceneLayoutInstance(FISHING_SCENE_LAYOUT, FISHING_LAYOUT_INSTANCE_IDS.BACKGROUND, { x: 648, y: 360 });
  assert.equal(digest(state), before);
  assert.equal(state.schemaVersion, 37);
  assert.equal(state.economy.coins, 12_500);
});
