import {
  VISUAL_ASSET_KINDS,
  VISUAL_ASSET_REQUIREDNESS,
  VISUAL_CACHE_SCOPES,
  VISUAL_DEFINITION_SCHEMA_VERSION,
  VISUAL_RENDER_TARGETS,
  createCircleGeometry,
  createRectGeometry,
  createVisualGeometry,
} from "../contracts.js";
import { DEPTH_LAYER_IDS, SHADOW_POLICY_IDS } from "../scale/scaleSystem.js";

export const TOWN_BIN_VARIANTS = Object.freeze({
  SMALL: "small",
  PARK: "park",
  RECYCLING: "recycling",
  COMMERCIAL: "commercial",
  PUBLIC: "public",
});

export const TOWN_BIN_ASSET_IDS = Object.freeze({
  SMALL: "prop.town-bin.small",
  PARK: "prop.town-bin.park",
  RECYCLING: "prop.town-bin.recycling",
  COMMERCIAL: "prop.town-bin.commercial",
  PUBLIC: "prop.town-bin.public",
});

export const TOWN_BIN_PREFAB_IDS = Object.freeze({
  SMALL: "prefab.prop.town-bin.small",
  PARK: "prefab.prop.town-bin.park",
  RECYCLING: "prefab.prop.town-bin.recycling",
  COMMERCIAL: "prefab.prop.town-bin.commercial",
  PUBLIC: "prefab.prop.town-bin.public",
});

export const TOWN_BIN_STATE_IDS = Object.freeze({
  SMALL: "state.prop.town-bin.small",
  PARK: "state.prop.town-bin.park",
  RECYCLING: "state.prop.town-bin.recycling",
  COMMERCIAL: "state.prop.town-bin.commercial",
  PUBLIC: "state.prop.town-bin.public",
});

export const TOWN_BIN_ITEM_VARIANTS = Object.freeze({
  "small-town-bin": TOWN_BIN_VARIANTS.SMALL,
  "park-bin": TOWN_BIN_VARIANTS.PARK,
  "recycling-bin": TOWN_BIN_VARIANTS.RECYCLING,
  "commercial-bin": TOWN_BIN_VARIANTS.COMMERCIAL,
  "__qa-town-bin": TOWN_BIN_VARIANTS.SMALL,
});

const definition = (value) => Object.freeze({ schemaVersion: VISUAL_DEFINITION_SCHEMA_VERSION, ...value });
const freezeGeometry = (value) => Object.freeze(value);
const placedGeometry = createVisualGeometry({
  visual: createRectGeometry(-27, -23, 54, 54),
  collision: createCircleGeometry(0, 0, 20.16),
  navigation: freezeGeometry({ wildlife: createCircleGeometry(0, 0, 42), rubbishExclusion: createCircleGeometry(0, 0, 46) }),
  interaction: freezeGeometry({ proximity: createCircleGeometry(0, 0, 76) }),
  touch: createRectGeometry(-28, -28, 56, 56),
});
const publicGeometry = createVisualGeometry({
  visual: createRectGeometry(-20, -45, 56, 70),
  interaction: freezeGeometry({ proximity: createCircleGeometry(0, 0, 72) }),
  touch: createRectGeometry(-28, -35, 56, 70),
});

const variants = Object.freeze([
  Object.freeze({ key: "SMALL", variant: TOWN_BIN_VARIANTS.SMALL, width: 29, bodyColor: 0x315c43, mark: null }),
  Object.freeze({ key: "PARK", variant: TOWN_BIN_VARIANTS.PARK, width: 29, bodyColor: 0x315c43, mark: null }),
  Object.freeze({ key: "RECYCLING", variant: TOWN_BIN_VARIANTS.RECYCLING, width: 29, bodyColor: 0x428667, mark: "recycling-ring" }),
  Object.freeze({ key: "COMMERCIAL", variant: TOWN_BIN_VARIANTS.COMMERCIAL, width: 42, bodyColor: 0x59615d, mark: null }),
  Object.freeze({ key: "PUBLIC", variant: TOWN_BIN_VARIANTS.PUBLIC, width: 25, bodyColor: 0x426b58, mark: null }),
]);

export const TOWN_BIN_ASSET_DEFINITIONS = Object.freeze(variants.map(({ key, variant, width }) => definition({
  id: TOWN_BIN_ASSET_IDS[key],
  kind: VISUAL_ASSET_KINDS.PROCEDURAL,
  source: Object.freeze({ kind: "generated", owner: "TownBinVisualFactory", recipe: `town-bin:${variant}` }),
  runtime: Object.freeze({ renderTarget: VISUAL_RENDER_TARGETS.PHASER, textureKey: `kw.asset.prop.town-bin.${variant}` }),
  technical: Object.freeze({ pixelArt: true, alpha: true, width: width + 12, height: 54, nativePixelsPerLogicalUnit: 1 }),
  requiredness: VISUAL_ASSET_REQUIREDNESS.REQUIRED,
  lifecycle: Object.freeze({ scope: VISUAL_CACHE_SCOPES.SHARED, unload: "retain-until-game-destroy" }),
  status: "prefab-migrated",
})));

function stateDefinition(key) {
  const prefabId = TOWN_BIN_PREFAB_IDS[key];
  return definition({
    id: TOWN_BIN_STATE_IDS[key],
    defaultState: "normal",
    states: Object.freeze({
      normal: Object.freeze({ prefabId, modifier: Object.freeze({ tipped: false, full: false, carried: false }) }),
      full: Object.freeze({ prefabId, modifier: Object.freeze({ tipped: false, full: true, carried: false }) }),
      tipped: Object.freeze({ prefabId, modifier: Object.freeze({ tipped: true, full: false, carried: false }) }),
      carried: Object.freeze({ prefabId, modifier: Object.freeze({ tipped: false, full: false, carried: true }) }),
    }),
  });
}

export const TOWN_BIN_PREFAB_DEFINITIONS = Object.freeze(variants.map(({ key, variant, width, bodyColor, mark }) => {
  const isPublic = variant === TOWN_BIN_VARIANTS.PUBLIC;
  return definition({
    id: TOWN_BIN_PREFAB_IDS[key],
    family: "town-bin",
    variant,
    renderer: VISUAL_RENDER_TARGETS.PHASER,
    layers: Object.freeze([
      Object.freeze({ id: "shadow", assetId: TOWN_BIN_ASSET_IDS[key], role: "background", optional: false }),
      Object.freeze({ id: "body", assetId: TOWN_BIN_ASSET_IDS[key], role: "main", optional: false }),
      Object.freeze({ id: "mark", assetId: TOWN_BIN_ASSET_IDS[key], role: "foreground", optional: true }),
      Object.freeze({ id: "status", assetId: TOWN_BIN_ASSET_IDS[key], role: "foreground", optional: true }),
    ]),
    scalePolicy: Object.freeze({ mode: "fixed", x: 1, y: 1, imageFit: "contain-within-visual-bounds" }),
    groundContactAnchor: Object.freeze({ x: 0, y: isPublic ? 20 : 23 }),
    origin: Object.freeze({ x: 0.5, y: 1 }),
    anchor: Object.freeze({ originX: 0.5, originY: 1 }),
    depthPolicy: Object.freeze({
      mode: "world-y",
      divisor: 10,
      layers: Object.freeze({
        placed: DEPTH_LAYER_IDS.GROUND_SORTED,
        public: DEPTH_LAYER_IDS.GROUND_SORTED,
        collection: DEPTH_LAYER_IDS.GROUND_SORTED,
        preview: DEPTH_LAYER_IDS.PLACEMENT_PREVIEW,
      }),
      bases: Object.freeze({ placed: 200, preview: 520, public: 200, collection: 200 }),
    }),
    shadowPolicy: Object.freeze({ mode: SHADOW_POLICY_IDS.CUSTOM, enabled: true, color: 0x294637, alpha: 0.2, x: isPublic ? 0 : -width / 2 - 6, y: isPublic ? 14 : 17, width: isPublic ? 34 : width + 12, height: isPublic ? 13 : 14 }),
    animation: null,
    sockets: Object.freeze({
      ground: Object.freeze({ x: 0, y: isPublic ? 20 : 23 }),
      collectorGrip: Object.freeze({ x: 0, y: -8 }),
      statusBadge: Object.freeze({ x: 0, y: -36 }),
      warningBadge: Object.freeze({ x: 18, y: -23 }),
    }),
    geometry: isPublic ? publicGeometry : placedGeometry,
    proceduralRecipe: Object.freeze({
      placed: Object.freeze({
        shadow: Object.freeze({ x: -width / 2 - 6, y: 17, width: width + 12, height: 14, color: 0x294637, alpha: 0.2 }),
        lid: Object.freeze({ x: -width / 2 - 3, y: -23, width: width + 6, height: 9, radius: 3, color: 0x273a31 }),
        body: Object.freeze({ x: -width / 2, y: -16, width, height: 39, radius: 5, color: bodyColor }),
        recyclingMark: mark === "recycling-ring" ? Object.freeze({ x: 0, y: 1, radius: 8, width: 3, color: 0xf5f1dc }) : null,
      }),
      public: Object.freeze({
        shadow: Object.freeze({ x: 0, y: 14, width: 34, height: 13, color: 0x20382c, alpha: 0.25 }),
        body: Object.freeze({ x: 0, y: 0, tippedX: 8, tippedY: 9, width: 25, height: 33, color: 0x426b58, tippedColor: 0x8b6f54, strokeWidth: 3, strokeColor: 0x294637 }),
        lid: Object.freeze({ x: 0, y: -18, tippedX: -3, tippedY: 0, width: 31, height: 7, color: 0x294637 }),
        fillLabel: Object.freeze({ x: 0, y: -36, color: "#294637", fontFamily: "system-ui", fontSize: "10px", fontStyle: "bold", backgroundColor: "rgba(255,253,241,.92)", padding: Object.freeze({ x: 4, y: 2 }) }),
        warning: Object.freeze({ x: 18, y: -23, fontSize: "14px", tippedText: "⚠️", fullText: "🚫" }),
        tippedRotation: Math.PI / 2.5,
      }),
      collection: Object.freeze({
        shadow: Object.freeze({ x: -18, y: 16, width: 36, height: 12, color: 0x294637, alpha: 0.2 }),
        lid: Object.freeze({ x: -16, y: -22, width: 32, height: 8, radius: 3, color: 0x294637 }),
        body: Object.freeze({ x: -13, y: -15, width: 26, height: 35, radius: 5, color: 0x426b58 }),
        mark: Object.freeze({ x: 0, y: 1, radius: 5, color: 0xe7e3cf, alpha: 0.9 }),
      }),
    }),
  });
}));

export const TOWN_BIN_STATE_DEFINITIONS = Object.freeze(variants.map(({ key }) => stateDefinition(key)));

export const TOWN_BIN_SCENE_PACK = definition({
  id: "pack.family.town-bins",
  sceneId: "TownScene",
  assetIds: Object.freeze(Object.values(TOWN_BIN_ASSET_IDS)),
  animationIds: Object.freeze([]),
});

export function townBinVariantForItem(itemId) {
  return TOWN_BIN_ITEM_VARIANTS[itemId] || null;
}

export function townBinPrefabIdForVariant(variant) {
  const key = Object.entries(TOWN_BIN_VARIANTS).find(([, value]) => value === variant)?.[0];
  return key ? TOWN_BIN_PREFAB_IDS[key] : null;
}

export function townBinStateIdForVariant(variant) {
  const key = Object.entries(TOWN_BIN_VARIANTS).find(([, value]) => value === variant)?.[0];
  return key ? TOWN_BIN_STATE_IDS[key] : null;
}
