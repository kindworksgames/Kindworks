export const SCALE_SYSTEM_SCHEMA_VERSION = 1;

export const CANONICAL_LANDSCAPE = Object.freeze({
  id: "kindworks-landscape-1280x720",
  width: 1280,
  height: 720,
  aspectRatio: 16 / 9,
});

export const LOGICAL_WORLD = Object.freeze({
  unit: "phaser-world-unit",
  canonicalPixelsPerUnit: 1,
  fineGrid: 8,
  layoutModule: 32,
  townSize: Object.freeze({ width: 4200, height: 2800 }),
});

export const NATIVE_PIXEL_DENSITY = Object.freeze({
  baselinePixelsPerLogicalUnit: 1,
  supportedIntegerDensities: Object.freeze([1, 2, 4]),
  filtering: "nearest-neighbour",
  roundDisplayPixels: true,
  rule: "Native file dimensions never determine collision or world footprint; every prefab declares logical visual bounds.",
});

export const RESIDENT_MEASURING_REFERENCE = Object.freeze({
  id: "resident.player",
  nativeSize: Object.freeze({ width: 40, height: 54 }),
  logicalDisplaySize: Object.freeze({ width: 40, height: 54 }),
  origin: Object.freeze({ x: 0.5, y: 0.88 }),
  groundContactOffset: Object.freeze({ x: 0, y: 0 }),
  shadow: Object.freeze({ width: 31, height: 12, offsetX: 0, offsetY: 18 }),
  residentHeightUnits: 1,
});

export const NPC_MEASUREMENT = Object.freeze({
  interactiveSize: Object.freeze({ width: 42, height: 66 }),
  coreGroundContactOffset: Object.freeze({ x: 0, y: 19 }),
  shadow: Object.freeze({ width: 29, height: 11, offsetX: 0, offsetY: 19 }),
});

export const DEPTH_LAYER_IDS = Object.freeze({
  TERRAIN: "terrain",
  WATER_AND_BANKS: "water-and-banks",
  ROADS_AND_PATHS: "roads-and-paths",
  GROUND_DETAILS: "ground-details",
  BUILDINGS: "buildings",
  GROUND_SORTED: "ground-sorted",
  FOREGROUND: "foreground",
  INTERACTION_GUIDES: "interaction-guides",
  PLACEMENT_PREVIEW: "placement-preview",
  HUD: "hud",
});

export const DEPTH_LAYERS = Object.freeze({
  [DEPTH_LAYER_IDS.TERRAIN]: Object.freeze({ id: DEPTH_LAYER_IDS.TERRAIN, base: 0, ySorted: false }),
  [DEPTH_LAYER_IDS.WATER_AND_BANKS]: Object.freeze({ id: DEPTH_LAYER_IDS.WATER_AND_BANKS, base: 4, ySorted: false }),
  [DEPTH_LAYER_IDS.ROADS_AND_PATHS]: Object.freeze({ id: DEPTH_LAYER_IDS.ROADS_AND_PATHS, base: 10, ySorted: false }),
  [DEPTH_LAYER_IDS.GROUND_DETAILS]: Object.freeze({ id: DEPTH_LAYER_IDS.GROUND_DETAILS, base: 20, ySorted: false }),
  [DEPTH_LAYER_IDS.BUILDINGS]: Object.freeze({ id: DEPTH_LAYER_IDS.BUILDINGS, base: 60, ySorted: false }),
  [DEPTH_LAYER_IDS.GROUND_SORTED]: Object.freeze({ id: DEPTH_LAYER_IDS.GROUND_SORTED, base: 200, divisor: 10, ySorted: true }),
  [DEPTH_LAYER_IDS.FOREGROUND]: Object.freeze({ id: DEPTH_LAYER_IDS.FOREGROUND, base: 490, ySorted: false }),
  [DEPTH_LAYER_IDS.INTERACTION_GUIDES]: Object.freeze({ id: DEPTH_LAYER_IDS.INTERACTION_GUIDES, base: 475, ySorted: false }),
  [DEPTH_LAYER_IDS.PLACEMENT_PREVIEW]: Object.freeze({ id: DEPTH_LAYER_IDS.PLACEMENT_PREVIEW, base: 520, ySorted: true, divisor: 10 }),
  [DEPTH_LAYER_IDS.HUD]: Object.freeze({ id: DEPTH_LAYER_IDS.HUD, base: 1000, ySorted: false }),
});

export const SHADOW_POLICY_IDS = Object.freeze({
  SHARED: "shared-ground-shadow",
  CUSTOM: "custom-authored-shadow",
  NONE: "no-shadow",
});

export const OCCLUSION_RULES = Object.freeze({
  background: "Render below the owning prefab's main layer.",
  groundSorted: "Compare ground-contact world Y inside the shared ground-sorted band.",
  foreground: "Render above ground-sorted residents only when the authored foreground mask requires it.",
  ui: "HUD and development guides never participate in world Y-sorting.",
});

export const SUPPORTED_LANDSCAPE_VIEWPORTS = Object.freeze([
  Object.freeze({ id: "narrow-phone", width: 568, height: 320, family: "phone" }),
  Object.freeze({ id: "modern-phone", width: 844, height: 390, family: "phone" }),
  Object.freeze({ id: "tablet-4x3", width: 1024, height: 768, family: "tablet" }),
  Object.freeze({ id: "reference", width: 1280, height: 720, family: "desktop" }),
  Object.freeze({ id: "desktop", width: 1366, height: 768, family: "desktop" }),
]);

export const HUD_SAFE_AREA = Object.freeze({
  canonicalInset: 16,
  minimumCssInset: 4,
  minimumTouchTargetCssPixels: 44,
  useCssEnvironmentInsets: true,
});

export const MEASURED_WORLD_REFERENCES = Object.freeze({
  town: Object.freeze({ width: 4200, height: 2800, minimumZoom: 0.28, maximumZoom: 1.3, narrowPhoneInitialZoom: 0.3, standardInitialZoom: 0.39 }),
  roadWidths: Object.freeze({ minimum: 50, maximum: 76, edgeAddition: 16 }),
  pathWidths: Object.freeze({ minimum: 25, maximum: 26, edgeAddition: 8 }),
  river: Object.freeze({ waterWidth: 188, bankWidth: 226 }),
  houses: Object.freeze({ compact: Object.freeze({ width: 190, height: 140 }), standard: Object.freeze({ width: 195, height: 145 }), personalScaleRange: Object.freeze({ minimum: 0.68, maximum: 1.22 }) }),
  lawn: Object.freeze({ compactYard: Object.freeze({ width: 300, height: 290 }), standardNorthYard: Object.freeze({ width: 310, height: 340 }), standardSouthYard: Object.freeze({ width: 310, height: 410 }) }),
  tree: Object.freeze({ visualBounds: Object.freeze({ x: -43, y: -62, width: 87, height: 97 }), groundContactOffset: Object.freeze({ x: 0, y: 33 }), placeableFootprintRadius: 50 }),
  bench: Object.freeze({ visualWidth: 80, visualHeight: 50, placeableFootprintRadius: 42 }),
  bin: Object.freeze({ visualWidth: 54, visualHeight: 54, placeableFootprintRadius: 28 }),
  door: Object.freeze({ designWidth: 34, designHeight: 49, standardDisplayWidth: 34, standardDisplayHeight: 61 }),
});

function finite(value, fallback = 0) {
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}

export function resolveCameraFit(viewport, canonical = CANONICAL_LANDSCAPE) {
  const width = Math.max(1, finite(viewport?.width, canonical.width));
  const height = Math.max(1, finite(viewport?.height, canonical.height));
  const scale = Math.min(width / canonical.width, height / canonical.height);
  const displayWidth = canonical.width * scale;
  const displayHeight = canonical.height * scale;
  return Object.freeze({
    scale,
    displayWidth,
    displayHeight,
    offsetX: (width - displayWidth) / 2,
    offsetY: (height - displayHeight) / 2,
    letterboxX: Math.max(0, (width - displayWidth) / 2),
    letterboxY: Math.max(0, (height - displayHeight) / 2),
  });
}

export function resolveDisplayMetrics({ logicalBounds, scalePolicy = {}, technical = {} }) {
  if (!logicalBounds || !(finite(logicalBounds.width) > 0) || !(finite(logicalBounds.height) > 0)) {
    throw new TypeError("Logical visual bounds with positive width and height are required.");
  }
  const scaleX = finite(scalePolicy.x, 1) || 1;
  const scaleY = finite(scalePolicy.y, 1) || 1;
  const nativePixelsPerLogicalUnit = finite(technical.nativePixelsPerLogicalUnit, NATIVE_PIXEL_DENSITY.baselinePixelsPerLogicalUnit) || 1;
  return Object.freeze({
    width: logicalBounds.width * scaleX,
    height: logicalBounds.height * scaleY,
    offsetX: finite(logicalBounds.x),
    offsetY: finite(logicalBounds.y),
    nativePixelsPerLogicalUnit,
    nativeWidth: finite(technical.width, logicalBounds.width * nativePixelsPerLogicalUnit),
    nativeHeight: finite(technical.height, logicalBounds.height * nativePixelsPerLogicalUnit),
    sourceDimensionsAffectLogicalFootprint: false,
  });
}

export function resolvePrefabDisplayMetrics(prefab, asset = null) {
  return resolveDisplayMetrics({
    logicalBounds: prefab?.geometry?.visual,
    scalePolicy: prefab?.scalePolicy,
    technical: asset?.technical,
  });
}

export function groundContactWorldPosition(position, anchor = null) {
  return Object.freeze({
    x: finite(position?.x) + finite(anchor?.x),
    y: finite(position?.y) + finite(anchor?.y),
  });
}

export function resolveGroundDepth(layerId, groundY, overrides = {}) {
  const layer = DEPTH_LAYERS[layerId];
  if (!layer) throw new Error(`Unknown depth layer: ${layerId}`);
  const base = finite(overrides.base, layer.base);
  const divisor = finite(overrides.divisor, layer.divisor || 0);
  const offset = finite(overrides.offset);
  return base + offset + (layer.ySorted && divisor ? finite(groundY) / divisor : 0);
}

export function compareGroundOrder(firstGroundY, secondGroundY) {
  if (finite(firstGroundY) === finite(secondGroundY)) return "same-ground-line";
  return finite(firstGroundY) < finite(secondGroundY) ? "behind" : "in-front";
}

export function resolveHudSafeArea(viewport, environmentInsets = {}) {
  const width = Math.max(1, finite(viewport?.width, CANONICAL_LANDSCAPE.width));
  const height = Math.max(1, finite(viewport?.height, CANONICAL_LANDSCAPE.height));
  const inset = (name) => Math.max(HUD_SAFE_AREA.minimumCssInset, finite(environmentInsets?.[name]));
  return Object.freeze({
    x: inset("left"),
    y: inset("top"),
    width: Math.max(0, width - inset("left") - inset("right")),
    height: Math.max(0, height - inset("top") - inset("bottom")),
    minimumTouchTarget: HUD_SAFE_AREA.minimumTouchTargetCssPixels,
  });
}

export function validateScaleSystem() {
  const errors = [];
  if (CANONICAL_LANDSCAPE.width / CANONICAL_LANDSCAPE.height !== CANONICAL_LANDSCAPE.aspectRatio) errors.push("canonical-aspect-ratio-mismatch");
  if (RESIDENT_MEASURING_REFERENCE.nativeSize.width !== RESIDENT_MEASURING_REFERENCE.logicalDisplaySize.width) errors.push("resident-width-density-mismatch");
  if (RESIDENT_MEASURING_REFERENCE.nativeSize.height !== RESIDENT_MEASURING_REFERENCE.logicalDisplaySize.height) errors.push("resident-height-density-mismatch");
  if (SUPPORTED_LANDSCAPE_VIEWPORTS.some(({ width, height }) => width <= height)) errors.push("non-landscape-supported-profile");
  if (new Set(SUPPORTED_LANDSCAPE_VIEWPORTS.map(({ id }) => id)).size !== SUPPORTED_LANDSCAPE_VIEWPORTS.length) errors.push("duplicate-viewport-profile");
  if (HUD_SAFE_AREA.minimumTouchTargetCssPixels < 44) errors.push("touch-target-below-contract");
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors) });
}
