import { LAZY_SCENE_KEYS } from "../../scenes/lazyScenes.js";
import { CANONICAL_LANDSCAPE, HUD_SAFE_AREA } from "../scale/scaleSystem.js";
import {
  SCENE_LAYOUT_SCHEMA_VERSION,
  createSceneLayout,
  resolveSceneLayoutDepth,
  sceneLayoutCatalogueDigest,
  validateSceneLayoutCatalogue,
} from "./sceneLayoutContracts.js";
import { FISHING_SCENE_LAYOUT } from "./fishingSceneLayout.js";

export const PRODUCTION_SCENE_IDS = Object.freeze(["BootScene", "TownScene", ...LAZY_SCENE_KEYS]);

const HUD_SELECTORS = Object.freeze({
  TownScene: "#town-menu-panel",
  HouseInteriorScene: "#home-interior-hud",
  VillageGrocerScene: "#grocer-hud",
  PawsWondersScene: "#paws-hud",
  HarbourGeneralScene: "#harbour-hud",
  BakeryScene: "#bakery-hud",
  CafeScene: "#cafe-hud",
  MorningMugScene: "#morning-mug-hud",
  RiversideKitchenScene: "#riverside-kitchen-hud",
  SouthShoreScoopsScene: "#south-shore-scoops-hud",
  RiverClearoutScene: "#river-hud",
  HouseRescueScene: "#house-rescue-hud",
  WasteCollectionScene: "#waste-campaign-hud",
  LawnCareScene: "#lawn-care-hud",
  BeachCleanupScene: "#beach-cleanup-hud",
  PlaygroundPowerwashScene: "#powerwash-hud",
  FishingScene: "#fishing-hud",
});

const slug = (sceneId) => sceneId.replace(/Scene$/, "").replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
const point = (x, y) => ({ x, y });

export const TOWN_DEPTH_POLICY_IDS = Object.freeze({
  PLAYER: "depth.town.player", PLAYER_SHADOW: "depth.town.player-shadow", NPC: "depth.town.npc", ANIMAL_FOLLOWER: "depth.town.animal-follower",
  PLACED_OBJECT: "depth.town.placed-object", PLACED_OBJECT_PREVIEW: "depth.town.placed-object-preview", COLLECTION_TRUCK: "depth.town.collection-truck",
  COLLECTION_LABEL: "depth.town.collection-label", COLLECTION_WORKER: "depth.town.collection-worker", COLLECTION_BIN: "depth.town.collection-bin",
});

const TOWN_DEPTH_POLICIES = Object.freeze([
  { id: TOWN_DEPTH_POLICY_IDS.PLAYER, layer: "character", base: 200, yDivisor: 10 },
  { id: TOWN_DEPTH_POLICY_IDS.PLAYER_SHADOW, layer: "character-shadow", base: 190, yDivisor: 10 },
  { id: TOWN_DEPTH_POLICY_IDS.NPC, layer: "character", base: 185, yDivisor: 10 },
  { id: TOWN_DEPTH_POLICY_IDS.ANIMAL_FOLLOWER, layer: "character", base: 300, yDivisor: 10 },
  { id: TOWN_DEPTH_POLICY_IDS.PLACED_OBJECT, layer: "placed-prop", base: 112, yDivisor: 10 },
  { id: TOWN_DEPTH_POLICY_IDS.PLACED_OBJECT_PREVIEW, layer: "editor-preview", base: 520, yDivisor: 10 },
  { id: TOWN_DEPTH_POLICY_IDS.COLLECTION_TRUCK, layer: "vehicle", base: 178, yDivisor: 10 },
  { id: TOWN_DEPTH_POLICY_IDS.COLLECTION_LABEL, layer: "hud-label", base: 440, yDivisor: 10 },
  { id: TOWN_DEPTH_POLICY_IDS.COLLECTION_WORKER, layer: "character", base: 184, yDivisor: 10 },
  { id: TOWN_DEPTH_POLICY_IDS.COLLECTION_BIN, layer: "placed-prop", base: 182, yDivisor: 10 },
]);

export function createSceneSurfaceLayout(sceneId, { hudSelector = HUD_SELECTORS[sceneId] } = {}) {
  const name = slug(sceneId);
  const safeAreaId = `safe-area.scene.${name}`;
  return createSceneLayout({
    schemaVersion: SCENE_LAYOUT_SCHEMA_VERSION,
    id: `layout.scene.${name}`,
    sceneId,
    revision: 1,
    layoutKind: "legacy-boundary",
    canonicalSize: { width: CANONICAL_LANDSCAPE.width, height: CANONICAL_LANDSCAPE.height },
    grid: { size: 8, origin: point(0, 0) },
    prefabs: [], instances: [], zones: [], sockets: [], entrances: [],
    collisionReferences: [], navigationReferences: [], interactionReferences: [], depthPolicies: sceneId === "TownScene" ? TOWN_DEPTH_POLICIES : [],
    safeAreas: [{
      id: safeAreaId,
      geometry: { x: HUD_SAFE_AREA.canonicalInset, y: HUD_SAFE_AREA.canonicalInset, width: CANONICAL_LANDSCAPE.width - HUD_SAFE_AREA.canonicalInset * 2, height: CANONICAL_LANDSCAPE.height - HUD_SAFE_AREA.canonicalInset * 2 },
      cssEnvironmentInsets: HUD_SAFE_AREA.useCssEnvironmentInsets,
      minimumTouchTargetCssPixels: HUD_SAFE_AREA.minimumTouchTargetCssPixels,
    }],
    surfaces: [
      { id: `surface.scene.${name}.canvas`, selector: "#game", required: true, visualOffset: point(0, 0), responsiveAnchor: { mode: "canonical" }, migrationStatus: "data-driven-boundary" },
      ...(hudSelector ? [{ id: `surface.scene.${name}.hud`, selector: hudSelector, required: false, visualOffset: point(0, 0), responsiveAnchor: { mode: "safe-area", safeAreaId, edge: "top" }, migrationStatus: "data-driven-boundary" }] : []),
    ],
    responsiveRules: { scaleMode: "fit", preserveAspectRatio: true, profileId: CANONICAL_LANDSCAPE.id },
  });
}

const GLOBAL_SURFACES = Object.freeze([
  ["town-menu", "#town-menu-panel"], ["onboarding", "#onboarding-panel"], ["impact", "#impact-panel"],
  ["npc-story", "#npc-story-panel"], ["placed-object", "#placed-object-panel"], ["homeowner-gift", "#homeowner-gift-panel"],
  ["save", "#save-panel"], ["economy", "#economy-panel"], ["shop", "#shop-panel"], ["custom-resident", "#custom-resident-panel"],
  ["farming", "#farming-panel"], ["animal-friends", "#animal-friends-panel"], ["world-lighting", "#world-lighting-overlay"],
]);

export const GLOBAL_UI_LAYOUT = createSceneLayout({
  schemaVersion: SCENE_LAYOUT_SCHEMA_VERSION,
  id: "layout.global.ui-surfaces",
  sceneId: "GlobalUiSurfaces",
  revision: 1,
  layoutKind: "global-ui",
  canonicalSize: { width: CANONICAL_LANDSCAPE.width, height: CANONICAL_LANDSCAPE.height },
  grid: { size: 8, origin: point(0, 0) },
  prefabs: [], instances: [], zones: [], sockets: [], entrances: [], collisionReferences: [], navigationReferences: [], interactionReferences: [], depthPolicies: [],
  safeAreas: [{ id: "safe-area.global.ui", geometry: { x: HUD_SAFE_AREA.canonicalInset, y: HUD_SAFE_AREA.canonicalInset, width: CANONICAL_LANDSCAPE.width - HUD_SAFE_AREA.canonicalInset * 2, height: CANONICAL_LANDSCAPE.height - HUD_SAFE_AREA.canonicalInset * 2 }, cssEnvironmentInsets: true, minimumTouchTargetCssPixels: HUD_SAFE_AREA.minimumTouchTargetCssPixels }],
  surfaces: GLOBAL_SURFACES.map(([id, selector]) => ({ id: `surface.global.${id}`, selector, required: false, visualOffset: point(0, 0), responsiveAnchor: { mode: "safe-area", safeAreaId: "safe-area.global.ui", edge: "center" }, migrationStatus: "data-driven-boundary" })),
  responsiveRules: { scaleMode: "fit", preserveAspectRatio: true, profileId: CANONICAL_LANDSCAPE.id },
});

const LEGACY_SCENE_LAYOUTS = PRODUCTION_SCENE_IDS
  .filter((sceneId) => sceneId !== "FishingScene")
  .map((sceneId) => createSceneSurfaceLayout(sceneId));

export const SCENE_LAYOUT_CATALOGUE = Object.freeze([...LEGACY_SCENE_LAYOUTS, FISHING_SCENE_LAYOUT, GLOBAL_UI_LAYOUT]);
export const SCENE_LAYOUT_CATALOGUE_DIGEST = sceneLayoutCatalogueDigest(SCENE_LAYOUT_CATALOGUE);
export const SCENE_LAYOUT_PRODUCTION_SIGNATURE = "kw-scene-layouts:layout.scene.boot@1|layout.scene.town@1|layout.scene.house-interior@1|layout.scene.village-grocer@1|layout.scene.paws-wonders@1|layout.scene.harbour-general@1|layout.scene.bakery@1|layout.scene.cafe@1|layout.scene.morning-mug@1|layout.scene.riverside-kitchen@1|layout.scene.south-shore-scoops@1|layout.scene.river-clearout@1|layout.scene.house-rescue@1|layout.scene.waste-collection@1|layout.scene.lawn-care@1|layout.scene.beach-cleanup@1|layout.scene.playground-powerwash@1|layout.scene.fishing@1|layout.global.ui-surfaces@1";
const expectedProductionSignature = `kw-scene-layouts:${SCENE_LAYOUT_CATALOGUE.map(({ id, revision }) => `${id}@${revision}`).join("|")}`;
if (SCENE_LAYOUT_PRODUCTION_SIGNATURE !== expectedProductionSignature) throw new Error("[stale-scene-layout-signature] Update the checked production signature after validating the catalogue change.");

const catalogueValidation = validateSceneLayoutCatalogue(SCENE_LAYOUT_CATALOGUE, { requiredSceneIds: PRODUCTION_SCENE_IDS });
if (!catalogueValidation.ok) throw new AggregateError(catalogueValidation.errors.map((entry) => new Error(`[${entry.code}] ${entry.path}: ${entry.message}`)), "Invalid scene-layout catalogue");

const BY_SCENE = new Map(SCENE_LAYOUT_CATALOGUE.map((layout) => [layout.sceneId, layout]));
export function getSceneLayout(sceneId) { return BY_SCENE.get(sceneId) || null; }
export function requireSceneLayout(sceneId) { const layout = getSceneLayout(sceneId); if (!layout) throw new Error(`[missing-scene-layout] No scene-layout definition for ${sceneId}.`); return layout; }
export function resolveTownSceneDepth(policyId, y, offset = 0) { return resolveSceneLayoutDepth(requireSceneLayout("TownScene"), policyId, y, offset); }
