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

const definition = (value) => Object.freeze({ schemaVersion: VISUAL_DEFINITION_SCHEMA_VERSION, ...value });

function shape(value) {
  if (!value) return null;
  return value.kind === "circle"
    ? createCircleGeometry(value.x, value.y, value.radius)
    : createRectGeometry(value.x, value.y, value.width, value.height);
}

function geometry(value) {
  return createVisualGeometry({
    visual: shape(value.visual), collision: shape(value.collision), navigation: shape(value.navigation),
    interaction: shape(value.interaction), touch: shape(value.touch),
  });
}

const role = (id) => id.includes("shadow") ? "background" : id.includes("foreground") || id.includes("canopy") ? "foreground" : "main";

/** Builds the lightweight production registry from a generated, prompt-free input. */
export function buildPhase8ARuntimeDefinitions(input) {
  const assets = input.assets.map((asset) => definition({
    id: asset.id,
    kind: VISUAL_ASSET_KINDS.PROCEDURAL,
    source: Object.freeze({ kind: "generated", owner: "Phase8AVerticalSlicePlaceholder", expectedRuntimeFile: asset.file }),
    runtime: Object.freeze({ renderTarget: VISUAL_RENDER_TARGETS.PHASER, textureKey: `kw.phase8a.${asset.id}` }),
    technical: Object.freeze({ pixelArt: true, alpha: asset.alpha, width: asset.width, height: asset.height, nativePixelsPerLogicalUnit: 1, frameWidth: asset.frameWidth, frameHeight: asset.frameHeight, directions: Object.freeze(asset.directions) }),
    requiredness: VISUAL_ASSET_REQUIREDNESS.REQUIRED,
    lifecycle: Object.freeze({ scope: VISUAL_CACHE_SCOPES.SCENE, unload: "on-last-scene-release" }),
    status: "phase-8a-specified-placeholder",
    productionContractId: asset.id,
  }));
  const byId = new Map(input.assets.map((asset) => [asset.id, asset]));
  const groups = new Map();
  for (const asset of input.assets) groups.set(asset.prefabId, [...(groups.get(asset.prefabId) || []), asset]);
  const prefabs = [...groups.entries()].map(([prefabId, members]) => {
    const primary = members.find((asset) => asset.geometry.collision || asset.geometry.interaction) || members[0];
    const terrain = primary.family.includes("terrain") || primary.family.includes("lawn-minigame");
    return definition({
      id: prefabId,
      family: primary.family,
      variant: "phase-8a-premium-slice",
      renderer: VISUAL_RENDER_TARGETS.PHASER,
      layers: Object.freeze(members.flatMap((asset) => asset.layers.map((id) => Object.freeze({ id, assetId: asset.id, role: role(id), optional: false })))),
      scalePolicy: Object.freeze({ mode: "fixed-logical-footprint", x: 1, y: 1, imageFit: "contain-within-visual-bounds" }),
      groundContactAnchor: Object.freeze({ x: 0, y: 0 }),
      origin: Object.freeze(primary.origin),
      depthPolicy: Object.freeze({ mode: "world-y", layerId: terrain ? DEPTH_LAYER_IDS.GROUND_DETAILS : DEPTH_LAYER_IDS.GROUND_SORTED, base: terrain ? 20 : 200, divisor: terrain ? 0 : 10 }),
      shadowPolicy: Object.freeze({ mode: primary.shadow || SHADOW_POLICY_IDS.NONE, enabled: members.some((member) => member.layers.some((id) => id.includes("shadow"))) }),
      animation: null,
      sockets: Object.freeze(primary.sockets),
      geometry: geometry(primary.geometry),
      productionContractId: primary.id,
    });
  });
  const visualStates = [...groups.entries()].map(([prefabId, members]) => {
    const primary = members[0];
    const names = [...new Set(members.flatMap((asset) => asset.states))];
    return definition({ id: primary.stateMapId, defaultState: names[0], states: Object.freeze(Object.fromEntries(names.map((name, frame) => [name, Object.freeze({ prefabId, modifier: Object.freeze({ frame, placeholder: true }) })]))) });
  });
  const animations = input.assets.flatMap((asset) => asset.animations.map((animation) => definition({
    id: `animation.phase-8a.${asset.id}.${animation.id}`,
    assetId: asset.id,
    runtimeKey: `kw.phase8a.animation.${asset.id}.${animation.id}`,
    frames: Object.freeze(animation.frames.map((frame) => Object.freeze({ textureKey: `kw.phase8a.${asset.id}`, frame }))),
    frameRate: animation.frameRate,
    repeat: animation.repeat,
    status: "phase-8a-specified-placeholder",
  })));
  const placementKeys = new Set();
  const sceneInstances = [];
  for (const asset of input.assets) for (const placement of asset.placements) {
    const key = `${placement.layoutId}:${placement.id}`;
    if (placementKeys.has(key)) continue;
    placementKeys.add(key);
    sceneInstances.push(definition({
      id: placement.id, sceneId: placement.sceneId, prefabId: asset.prefabId, stateId: asset.stateMapId,
      position: Object.freeze(placement.position), scale: Object.freeze({ x: 1, y: 1 }),
      depth: placement.sceneId === "TownScene" ? 200 + placement.position.y / 10 : 20,
      worldOrigin: Object.freeze(placement.worldOrigin || { x: 0, y: 0 }),
      visualOffset: Object.freeze({ x: 0, y: 0 }),
      binding: Object.freeze({
        mode: placement.dynamicPosition ? "dynamic" : placement.repeat ? "repeat" : placement.contextualOnly ? "contextual" : placement.visibleAfter ? "event" : placement.presentationOnly ? "presentation-only" : placement.safeAreaBindings ? "responsive" : "static",
        repeat: placement.repeat || null,
        dynamicPosition: placement.dynamicPosition || null,
        dynamicFacing: placement.dynamicFacing || null,
        visibleAfter: placement.visibleAfter || null,
        gameplayOwner: placement.gameplayOwner || null,
        protectedWorldObjectId: placement.protectedWorldObjectId || null,
        protectedWorldPosition: placement.protectedWorldPosition || null,
        protectedWorldYard: placement.protectedWorldYard || null,
        protectedWorldRiver: placement.protectedWorldRiver || null,
        protectedWorldRoadId: placement.protectedWorldRoadId || null,
        protectedGate: placement.protectedGate || null,
        npcIdentityBinding: placement.npcIdentityBinding || null,
        speciesBinding: placement.speciesBinding || null,
        socketBinding: placement.socketBinding || null,
        safeAreaBindings: placement.safeAreaBindings || null,
        minimumCssTouchTarget: placement.minimumCssTouchTarget || null,
        presentationOnly: placement.presentationOnly === true,
        visualLayerRole: placement.visualLayerRole || null,
      }),
      layoutId: placement.layoutId, gameplayGeometryLocked: true, activation: "prepared-not-active-until-phase-8b",
    }));
  }
  const animationIds = (sceneId) => animations.filter((animation) => byId.get(animation.assetId)?.scenes.includes(sceneId)).map(({ id }) => id);
  const assetIds = (sceneId) => input.assets.filter((asset) => asset.scenes.includes(sceneId)).map(({ id }) => id);
  const scenePacks = ["TownScene", "LawnCareScene"].map((sceneId) => definition({
    id: sceneId === "TownScene" ? "pack.phase-8a.town-block" : "pack.phase-8a.lawn-care",
    sceneId, assetIds: Object.freeze(assetIds(sceneId)), animationIds: Object.freeze(animationIds(sceneId)), activation: "prepared-not-active-until-phase-8b",
  }));
  return Object.freeze({ assets: Object.freeze(assets), prefabs: Object.freeze(prefabs), visualStates: Object.freeze(visualStates), animations: Object.freeze(animations), sceneInstances: Object.freeze(sceneInstances), scenePacks: Object.freeze(scenePacks) });
}
