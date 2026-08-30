import { MAGNET_TARGETING_CONFIG, TARGETING_CONFIG } from "../../data/fishing.js";
import { VISUAL_PREFAB_IDS } from "../visualManifest.js";
import { SCENE_LAYOUT_SCHEMA_VERSION, createSceneLayout, sceneLayoutGeometryDigest } from "./sceneLayoutContracts.js";
import {
  CANONICAL_LANDSCAPE,
  HUD_SAFE_AREA,
  LOGICAL_WORLD,
  NATIVE_PIXEL_DENSITY,
  SCALE_SYSTEM_SCHEMA_VERSION,
} from "../scale/scaleSystem.js";

export const FISHING_LAYOUT_ID = "layout.scene.fishing";

export const FISHING_LAYOUT_PREFAB_IDS = Object.freeze({
  BACKGROUND: "layout-prefab.scene.fishing.background",
  ENVIRONMENT: "layout-prefab.scene.fishing.environment",
  LOCATION_LABEL: "layout-prefab.scene.fishing.location-label",
  PLAYER_MARKER: "layout-prefab.scene.fishing.player-marker",
  TOOL_MARKER: "layout-prefab.scene.fishing.tool-marker",
  AIM: "layout-prefab.scene.fishing.aim",
  LIVE_RIG: "layout-prefab.scene.fishing.live-rig",
  BOBBER: "layout-prefab.scene.fishing.bobber",
  RESULT: "layout-prefab.scene.fishing.result",
});

export const FISHING_LAYOUT_INSTANCE_IDS = Object.freeze({
  BACKGROUND: "instance.fishing.reedbank.background.main",
  ENVIRONMENT: "instance.fishing.environment.live",
  TITLE: "instance.fishing.location.title",
  WATER_BODY: "instance.fishing.location.water-body",
  FISH_PLAYER: "instance.fishing.player.bank",
  FISH_TOOL: "instance.fishing.tool.bank",
  MAGNET_PLAYER: "instance.magnet-fishing.player.bridge",
  MAGNET_TOOL: "instance.magnet-fishing.tool.bridge",
  AIM: "instance.fishing.aim.live",
  LIVE_RIG: "instance.fishing.rig.live",
  BOBBER: "instance.fishing.bobber.live",
  RESULT: "instance.fishing.result.live",
});

export const FISHING_LAYOUT_ZONE_IDS = Object.freeze({
  CANVAS: "zone.fishing.canonical-canvas",
  FISH_WATER: "zone.fishing.water",
  MAGNET_WATER: "zone.magnet-fishing.water",
  SHORE: "zone.fishing.shore",
  DOCK: "zone.fishing.dock",
  BRIDGE: "zone.magnet-fishing.bridge",
});

export const FISHING_LAYOUT_SOCKET_IDS = Object.freeze({
  FISH_DEFAULT_TARGET: "socket.fishing.default-target",
  FISH_ROD_GRIP: "socket.fishing.rod-grip",
  FISH_ROD_IDLE_TIP: "socket.fishing.rod-idle-tip",
  FISH_STATION: "socket.fishing.station",
  MAGNET_DEFAULT_TARGET: "socket.magnet-fishing.default-target",
  MAGNET_ROPE_START: "socket.magnet-fishing.rope-start",
  MAGNET_REST: "socket.magnet-fishing.rest",
  MAGNET_STATION: "socket.magnet-fishing.station",
  EXIT: "socket.fishing.exit",
});

const rect = (x, y, width, height) => Object.freeze({ x, y, width, height });
const point = (x, y) => Object.freeze({ x, y });
const visual = (x, y, width, height, origin = point(0.5, 0.5), depth = 1) => Object.freeze({
  position: point(x, y), origin, depth, bounds: Object.freeze({ width, height }),
});
const anchor = (mode = "canonical", extra = {}) => Object.freeze({ mode, ...extra });
const prefab = (id, renderer, extra = {}) => Object.freeze({ id, renderer, ...extra });
const instance = (id, prefabId, data) => Object.freeze({
  id, prefabId, required: true, facing: "down", variant: "default", gameplayGeometryLocked: true,
  responsiveAnchor: anchor(), gameplayGeometryRefs: Object.freeze([]), ...data,
});

const fishWater = TARGETING_CONFIG.waterArea;
const magnetWater = MAGNET_TARGETING_CONFIG.waterArea;
const fishWaterGeometry = rect(fishWater.x, fishWater.y, fishWater.width, fishWater.height);
const magnetWaterGeometry = rect(magnetWater.x, magnetWater.y, magnetWater.width, magnetWater.height);
const bridgeGeometry = rect(0, 520, 1280, 200);
const fishingSafeAreaId = "safe-area.fishing.gameplay";

export const FISHING_SCENE_LAYOUT = createSceneLayout(Object.freeze({
  schemaVersion: SCENE_LAYOUT_SCHEMA_VERSION,
  id: FISHING_LAYOUT_ID,
  sceneId: "FishingScene",
  revision: 1,
  canonicalSize: Object.freeze({ width: CANONICAL_LANDSCAPE.width, height: CANONICAL_LANDSCAPE.height }),
  scaleSystem: Object.freeze({
    schemaVersion: SCALE_SYSTEM_SCHEMA_VERSION,
    profileId: CANONICAL_LANDSCAPE.id,
    logicalUnit: LOGICAL_WORLD.unit,
    canonicalPixelsPerUnit: LOGICAL_WORLD.canonicalPixelsPerUnit,
    nativePixelsPerLogicalUnit: NATIVE_PIXEL_DENSITY.baselinePixelsPerLogicalUnit,
    pixelFiltering: NATIVE_PIXEL_DENSITY.filtering,
    depthMode: "fixed-scene-composition",
  }),
  grid: Object.freeze({ size: 8, origin: point(0, 0) }),
  prefabs: Object.freeze([
    prefab(FISHING_LAYOUT_PREFAB_IDS.BACKGROUND, "registry", { registryPrefabId: VISUAL_PREFAB_IDS.FISHING_REEDBANK_BACKGROUND }),
    prefab(FISHING_LAYOUT_PREFAB_IDS.ENVIRONMENT, "legacy-procedural", { owner: "FishingScene.drawScene" }),
    prefab(FISHING_LAYOUT_PREFAB_IDS.LOCATION_LABEL, "legacy-procedural", { owner: "FishingScene.drawScene" }),
    prefab(FISHING_LAYOUT_PREFAB_IDS.PLAYER_MARKER, "legacy-procedural", { owner: "FishingScene.drawFishingBank/drawBridge" }),
    prefab(FISHING_LAYOUT_PREFAB_IDS.TOOL_MARKER, "legacy-procedural", { owner: "FishingScene.drawFishingBank/drawBridge" }),
    prefab(FISHING_LAYOUT_PREFAB_IDS.AIM, "runtime", { owner: "FishingScene.setTarget" }),
    prefab(FISHING_LAYOUT_PREFAB_IDS.LIVE_RIG, "runtime", { owner: "FishingScene.drawActiveRig" }),
    prefab(FISHING_LAYOUT_PREFAB_IDS.BOBBER, "runtime", { owner: "FishingScene.drawActiveRig" }),
    prefab(FISHING_LAYOUT_PREFAB_IDS.RESULT, "runtime", { owner: "FishingScene.showResult" }),
  ]),
  instances: Object.freeze([
    instance(FISHING_LAYOUT_INSTANCE_IDS.BACKGROUND, FISHING_LAYOUT_PREFAB_IDS.BACKGROUND, {
      variant: "reedbank", visual: visual(640, 360, 1280, 720, point(0.5, 0.5), 1), allowVisualOverflow: true, gameplayGeometryRefs: Object.freeze([]),
    }),
    instance(FISHING_LAYOUT_INSTANCE_IDS.ENVIRONMENT, FISHING_LAYOUT_PREFAB_IDS.ENVIRONMENT, {
      variant: "spot-dependent", visual: visual(0, 0, 1280, 720, point(0, 0), 2), gameplayGeometryRefs: Object.freeze(["interaction.fishing.water", "interaction.magnet-fishing.water"]),
    }),
    instance(FISHING_LAYOUT_INSTANCE_IDS.TITLE, FISHING_LAYOUT_PREFAB_IDS.LOCATION_LABEL, {
      variant: "title", visual: visual(34, 28, 356, 54, point(0, 0), 10),
    }),
    instance(FISHING_LAYOUT_INSTANCE_IDS.WATER_BODY, FISHING_LAYOUT_PREFAB_IDS.LOCATION_LABEL, {
      variant: "water-body", visual: visual(36, 86, 360, 24, point(0, 0), 10),
    }),
    instance(FISHING_LAYOUT_INSTANCE_IDS.FISH_PLAYER, FISHING_LAYOUT_PREFAB_IDS.PLAYER_MARKER, {
      variant: "bank-angler", visual: visual(410, 610, 70, 70, point(0.5, 0.5), 15), activeWhen: Object.freeze({ all: Object.freeze([Object.freeze({ field: "mode", equals: "fish" }), Object.freeze({ field: "proceduralOnly", equals: true })]) }), gameplayGeometryRefs: Object.freeze([FISHING_LAYOUT_SOCKET_IDS.FISH_STATION]),
    }),
    instance(FISHING_LAYOUT_INSTANCE_IDS.FISH_TOOL, FISHING_LAYOUT_PREFAB_IDS.TOOL_MARKER, {
      variant: "bank-rod", visual: Object.freeze({ ...visual(390, 562, 60, 60, point(0.5, 0.5), 16), rotation: -24 * Math.PI / 180 }), activeWhen: Object.freeze({ all: Object.freeze([Object.freeze({ field: "mode", equals: "fish" }), Object.freeze({ field: "proceduralOnly", equals: true })]) }), gameplayGeometryRefs: Object.freeze([FISHING_LAYOUT_SOCKET_IDS.FISH_ROD_GRIP]),
    }),
    instance(FISHING_LAYOUT_INSTANCE_IDS.MAGNET_PLAYER, FISHING_LAYOUT_PREFAB_IDS.PLAYER_MARKER, {
      variant: "bridge-angler", visual: visual(155, 575, 70, 70, point(0.5, 0.5), 15), activeWhen: Object.freeze({ all: Object.freeze([Object.freeze({ field: "mode", equals: "magnet" })]) }), gameplayGeometryRefs: Object.freeze([FISHING_LAYOUT_SOCKET_IDS.MAGNET_STATION]),
    }),
    instance(FISHING_LAYOUT_INSTANCE_IDS.MAGNET_TOOL, FISHING_LAYOUT_PREFAB_IDS.TOOL_MARKER, {
      variant: "bridge-rope", visual: visual(210, 574, 37, 37, point(0.5, 0.5), 16), activeWhen: Object.freeze({ all: Object.freeze([Object.freeze({ field: "mode", equals: "magnet" })]) }), gameplayGeometryRefs: Object.freeze([FISHING_LAYOUT_SOCKET_IDS.MAGNET_ROPE_START]),
    }),
    instance(FISHING_LAYOUT_INSTANCE_IDS.AIM, FISHING_LAYOUT_PREFAB_IDS.AIM, {
      variant: "runtime-target", visual: visual(764.8, 345.6, 56, 56, point(0.5, 0.5), 20), gameplayGeometryRefs: Object.freeze(["interaction.fishing.water"]),
    }),
    instance(FISHING_LAYOUT_INSTANCE_IDS.LIVE_RIG, FISHING_LAYOUT_PREFAB_IDS.LIVE_RIG, {
      variant: "mode-dependent", visual: visual(334, 517, 768, 432, point(0, 1), 25), gameplayGeometryRefs: Object.freeze([FISHING_LAYOUT_SOCKET_IDS.FISH_ROD_GRIP, FISHING_LAYOUT_SOCKET_IDS.MAGNET_ROPE_START]),
    }),
    instance(FISHING_LAYOUT_INSTANCE_IDS.BOBBER, FISHING_LAYOUT_PREFAB_IDS.BOBBER, {
      variant: "fish", visual: visual(764.8, 345.6, 38, 38, point(0.5, 0.5), 29), gameplayGeometryRefs: Object.freeze(["interaction.fishing.water"]),
    }),
    instance(FISHING_LAYOUT_INSTANCE_IDS.RESULT, FISHING_LAYOUT_PREFAB_IDS.RESULT, {
      variant: "mode-dependent", visual: visual(764.8, 325.6, 58, 58, point(0.5, 0.5), 30), gameplayGeometryRefs: Object.freeze(["interaction.fishing.water"]),
    }),
  ]),
  zones: Object.freeze([
    Object.freeze({ id: FISHING_LAYOUT_ZONE_IDS.CANVAS, name: "Canonical gameplay viewport", kind: "canvas", geometry: rect(0, 0, 1280, 720), required: true }),
    Object.freeze({ id: FISHING_LAYOUT_ZONE_IDS.FISH_WATER, name: "Fishing cast water", kind: "interaction", geometry: fishWaterGeometry, required: true, sourceOfTruth: "TARGETING_CONFIG.waterArea" }),
    Object.freeze({ id: FISHING_LAYOUT_ZONE_IDS.MAGNET_WATER, name: "Magnet cast water", kind: "interaction", geometry: magnetWaterGeometry, required: true, sourceOfTruth: "MAGNET_TARGETING_CONFIG.waterArea" }),
    Object.freeze({ id: FISHING_LAYOUT_ZONE_IDS.SHORE, name: "Fishing shore", kind: "visual", geometry: rect(0, 540, 1280, 180), required: true }),
    Object.freeze({ id: FISHING_LAYOUT_ZONE_IDS.DOCK, name: "Fishing dock", kind: "visual", geometry: rect(465, 500, 350, 220), required: true }),
    Object.freeze({ id: FISHING_LAYOUT_ZONE_IDS.BRIDGE, name: "Magnet bridge", kind: "visual", geometry: bridgeGeometry, required: true, sourceOfTruth: "FishingScene.drawBridge" }),
  ]),
  sockets: Object.freeze([
    Object.freeze({ id: FISHING_LAYOUT_SOCKET_IDS.FISH_DEFAULT_TARGET, name: "Default cast target", position: point(764.8, 345.6), zoneId: FISHING_LAYOUT_ZONE_IDS.FISH_WATER, required: true }),
    Object.freeze({ id: FISHING_LAYOUT_SOCKET_IDS.FISH_ROD_GRIP, name: "Rod grip", position: point(334, 517), required: true }),
    Object.freeze({ id: FISHING_LAYOUT_SOCKET_IDS.FISH_ROD_IDLE_TIP, name: "Idle rod tip", position: point(825, 149), required: true }),
    Object.freeze({ id: FISHING_LAYOUT_SOCKET_IDS.FISH_STATION, name: "Angler bank station", position: point(410, 610), zoneId: FISHING_LAYOUT_ZONE_IDS.SHORE, required: true }),
    Object.freeze({ id: FISHING_LAYOUT_SOCKET_IDS.MAGNET_DEFAULT_TARGET, name: "Default magnet target", position: point(785.92, 314.76), zoneId: FISHING_LAYOUT_ZONE_IDS.MAGNET_WATER, required: true }),
    Object.freeze({ id: FISHING_LAYOUT_SOCKET_IDS.MAGNET_ROPE_START, name: "Bridge rope start", position: point(114, 588), zoneId: FISHING_LAYOUT_ZONE_IDS.BRIDGE, required: true }),
    Object.freeze({ id: FISHING_LAYOUT_SOCKET_IDS.MAGNET_REST, name: "Resting magnet", position: point(235, 542), zoneId: FISHING_LAYOUT_ZONE_IDS.BRIDGE, required: true }),
    Object.freeze({ id: FISHING_LAYOUT_SOCKET_IDS.MAGNET_STATION, name: "Magnet angler station", position: point(155, 575), zoneId: FISHING_LAYOUT_ZONE_IDS.BRIDGE, required: true }),
    Object.freeze({ id: FISHING_LAYOUT_SOCKET_IDS.EXIT, name: "Exit control", position: point(1248, 32), required: true, responsiveAnchor: anchor("safe-area", { safeAreaId: fishingSafeAreaId, edge: "top-right" }) }),
  ]),
  entrances: Object.freeze([
    Object.freeze({ id: "entrance.fishing.activity", name: "Activity entry", socketId: FISHING_LAYOUT_SOCKET_IDS.FISH_STATION, variants: Object.freeze({ fish: FISHING_LAYOUT_SOCKET_IDS.FISH_STATION, magnet: FISHING_LAYOUT_SOCKET_IDS.MAGNET_STATION }) }),
    Object.freeze({ id: "entrance.fishing.return-town", name: "Return to saved town position", socketId: FISHING_LAYOUT_SOCKET_IDS.EXIT, destinationSceneId: "TownScene", destinationPosition: "session.returnPosition" }),
  ]),
  collisionReferences: Object.freeze([
    Object.freeze({ id: "collision.fishing.water-boundary", zoneId: FISHING_LAYOUT_ZONE_IDS.FISH_WATER, gameplayCritical: true, locked: true, geometryDigest: sceneLayoutGeometryDigest(fishWaterGeometry), sourceOfTruth: "TARGETING_CONFIG.waterArea" }),
    Object.freeze({ id: "collision.magnet-fishing.water-boundary", zoneId: FISHING_LAYOUT_ZONE_IDS.MAGNET_WATER, gameplayCritical: true, locked: true, geometryDigest: sceneLayoutGeometryDigest(magnetWaterGeometry), sourceOfTruth: "MAGNET_TARGETING_CONFIG.waterArea" }),
  ]),
  navigationReferences: Object.freeze([
    Object.freeze({ id: "navigation.fishing.water-obstacle", zoneId: FISHING_LAYOUT_ZONE_IDS.FISH_WATER, gameplayCritical: true, locked: true, geometryDigest: sceneLayoutGeometryDigest(fishWaterGeometry), sourceOfTruth: "TARGETING_CONFIG.waterArea", appliesTo: "scene-presentation-only" }),
    Object.freeze({ id: "navigation.magnet-fishing.bridge", zoneId: FISHING_LAYOUT_ZONE_IDS.BRIDGE, gameplayCritical: true, locked: true, geometryDigest: sceneLayoutGeometryDigest(bridgeGeometry), sourceOfTruth: "FishingScene.drawBridge", appliesTo: "fixed-station" }),
  ]),
  interactionReferences: Object.freeze([
    Object.freeze({ id: "interaction.fishing.water", zoneId: FISHING_LAYOUT_ZONE_IDS.FISH_WATER, gameplayCritical: true, locked: true, geometryDigest: sceneLayoutGeometryDigest(fishWaterGeometry), sourceOfTruth: "TARGETING_CONFIG.waterArea", handler: "FishingScene.setTarget" }),
    Object.freeze({ id: "interaction.magnet-fishing.water", zoneId: FISHING_LAYOUT_ZONE_IDS.MAGNET_WATER, gameplayCritical: true, locked: true, geometryDigest: sceneLayoutGeometryDigest(magnetWaterGeometry), sourceOfTruth: "MAGNET_TARGETING_CONFIG.waterArea", handler: "FishingScene.setTarget" }),
  ]),
  safeAreas: Object.freeze([
    Object.freeze({ id: fishingSafeAreaId, geometry: rect(HUD_SAFE_AREA.canonicalInset, HUD_SAFE_AREA.canonicalInset, CANONICAL_LANDSCAPE.width - HUD_SAFE_AREA.canonicalInset * 2, CANONICAL_LANDSCAPE.height - HUD_SAFE_AREA.canonicalInset * 2), cssEnvironmentInsets: HUD_SAFE_AREA.useCssEnvironmentInsets, minimumTouchTargetCssPixels: HUD_SAFE_AREA.minimumTouchTargetCssPixels }),
  ]),
  surfaces: Object.freeze([
    Object.freeze({ id: "surface.scene.fishing.canvas", selector: "#game", required: true, visualOffset: point(0, 0), responsiveAnchor: anchor(), migrationStatus: "data-driven" }),
    Object.freeze({ id: "surface.scene.fishing.hud", selector: "#fishing-hud", required: false, visualOffset: point(0, 0), responsiveAnchor: anchor("safe-area", { safeAreaId: fishingSafeAreaId, edge: "top" }), migrationStatus: "data-driven" }),
  ]),
  depthPolicies: Object.freeze([]),
  responsiveRules: Object.freeze({
    scaleMode: "fit",
    preserveAspectRatio: true,
    scaleSystemProfileId: CANONICAL_LANDSCAPE.id,
    canonicalViewport: "zone.fishing.canonical-canvas",
    hudAnchors: Object.freeze({ exit: FISHING_LAYOUT_SOCKET_IDS.EXIT }),
  }),
  presentation: Object.freeze({
    waterCornerRadius: 26,
    topBandHeight: 134,
    waveRows: 6,
    wave: Object.freeze({ startX: 155, alternateOffsetX: 55, endX: 1115, thirdOffsetX: 42, startY: 195, rowGap: 54 }),
    dock: Object.freeze({ boardStartX: 476, boardStartY: 508, boardWidth: 328, boardHeight: 21, boardGapY: 30, endY: 720 }),
    bridge: Object.freeze({ boardStartX: 7, boardStartY: 532, boardWidth: 75, boardHeight: 180, boardGapX: 92, railY: 515, railHeight: 15 }),
    reeds: Object.freeze([point(180, 230), point(320, 410), point(930, 230), point(1040, 440), point(720, 300)]),
    resultOffsetY: -20,
    resultLiftOffsetY: 58,
    resultBounceY: 22,
  }),
  rig: Object.freeze({
    fish: Object.freeze({ castBlend: 0.76, targetOffsetY: -146, waterTipBounds: Object.freeze({ minX: 128, maxX: 1102, minY: 85, maxY: 402 }), liftBlend: 0.12, liftOffsetY: -60, liftTipBounds: Object.freeze({ minX: 124, maxX: 1048, minY: 75, maxY: 320 }) }),
    magnet: Object.freeze({ bedOffset: 72, castArc: 190, reelArc: 64 }),
  }),
}));

export function fishingWaterZoneId(mode) {
  return mode === "magnet" ? FISHING_LAYOUT_ZONE_IDS.MAGNET_WATER : FISHING_LAYOUT_ZONE_IDS.FISH_WATER;
}

export function fishingDefaultTargetSocketId(mode) {
  return mode === "magnet" ? FISHING_LAYOUT_SOCKET_IDS.MAGNET_DEFAULT_TARGET : FISHING_LAYOUT_SOCKET_IDS.FISH_DEFAULT_TARGET;
}
