import { SHADOW_POLICY_IDS } from "../scale/scaleSystem.js";

export const PHASE_8A_PACKAGE_SCHEMA_VERSION = 2;
export const PHASE_8A_PACKAGE_ID = "kindworks.phase-8a.premium-vertical-slice";
export const PHASE_8A_TOWN_LAYOUT_ID = "layout.phase-8a.town-block.house-6";
export const PHASE_8A_LAWN_LAYOUT_ID = "layout.phase-8a.lawn-care.representative";

const ART_BIBLE = "KindWorks Visual Style Bible v4";
const TOWN_SCENE = "TownScene";
const LAWN_SCENE = "LawnCareScene";
const freeze = (value) => Object.freeze(value);
const rect = (x, y, width, height) => freeze({ kind: "rectangle", x, y, width, height });
const circle = (x, y, radius) => freeze({ kind: "circle", x, y, radius });
const point = (x, y) => freeze({ x, y });
export const phase8AGameplayGeometrySignature = (geometry) => {
  const value = JSON.stringify(Object.fromEntries(["collision", "navigation", "interaction", "touch"].map((key) => [key, geometry?.[key] ?? null])));
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
};

const COMMON_FORBIDDEN = freeze([
  "provider watermark, signature, logo, caption, or embedded text",
  "photorealism, vector-soft edges, antialiasing, blur, or resampling noise",
  "automatic trimming, cropped canvas, changed frame order, or unequal frame alignment",
  "unrequested UI, characters, props, scenery, shadows, or background colour",
  "perspective, scale, palette, outline, or lighting that conflicts with the KindWorks Visual Style Bible v4",
]);

const COMMON_CHECKS = freeze([
  "semantic ID is unique and matches the approved manifest entry",
  "filename and file format exactly match the contract",
  "canvas, frame grid, frame count, alpha mode, and untrimmed alignment are exact",
  "nearest-neighbour sampling is preserved and no smoothing metadata is introduced",
  "ground anchor, sockets, visual bounds, and gameplay geometry remain independently addressable",
  "all required states, layers, directions, and animation frames are present",
  "texture budget, scene-pack dependency, fallback, and orphan-reference checks pass",
]);

const FAMILY_CONTRACTS = freeze([
  freeze({ id: "family.town-terrain.slice", categoryContractId: "category.terrain", purpose: "Seamless, top-down Willowmere terrain surfaces.", projection: "top-down orthographic", scaleRule: "64 logical-unit tile on an untrimmed 64px canvas", anchorRule: "top-left tile origin", shadowRule: SHADOW_POLICY_IDS.NONE }),
  freeze({ id: "family.house-exterior.slice", categoryContractId: "category.building", purpose: "State-aligned cottage exterior with protected door and footprint.", projection: "three-quarter top-down town exterior", scaleRule: "256×192 logical canvas; visible cottage remains aligned across states", anchorRule: "ground contact at canvas (128,176)", shadowRule: SHADOW_POLICY_IDS.CUSTOM }),
  freeze({ id: "family.world-lawn.slice", categoryContractId: "category.terrain", purpose: "Four state-aligned lawn surfaces for the authored house-6 yard.", projection: "top-down orthographic", scaleRule: "320×352 canvas mapped to the protected 310×340 yard", anchorRule: "canvas centre", shadowRule: SHADOW_POLICY_IDS.NONE }),
  freeze({ id: "family.layered-tree.slice", categoryContractId: "category.vegetation", purpose: "Occluding tree split into shadow, trunk/body, and foreground canopy.", projection: "three-quarter top-down town prop", scaleRule: "128×160 aligned canvases; 87×97 logical visual target", anchorRule: "ground contact at canvas (64,144)", shadowRule: SHADOW_POLICY_IDS.CUSTOM }),
  freeze({ id: "family.small-town-prop.slice", categoryContractId: "category.prop", purpose: "Compact, ground-anchored town props with independent interaction footprints.", projection: "three-quarter top-down town prop", scaleRule: "declared logical footprint, never inferred from PNG dimensions", anchorRule: "bottom-centre ground contact", shadowRule: SHADOW_POLICY_IDS.CUSTOM }),
  freeze({ id: "family.resident-character.slice", categoryContractId: "category.character", purpose: "Player and NPC directional walk sheets sharing one stable frame grid.", projection: "three-quarter top-down resident", scaleRule: "64×64 frame; character displays at 40×54 logical units", anchorRule: "ground contact at frame (32,56)", shadowRule: SHADOW_POLICY_IDS.SHARED }),
  freeze({ id: "family.animal-character.slice", categoryContractId: "category.animal", purpose: "Directional companion animal sheet.", projection: "three-quarter top-down animal", scaleRule: "48×40 frame; animal displays at 36×30 logical units", anchorRule: "ground contact at frame (24,35)", shadowRule: SHADOW_POLICY_IDS.SHARED }),
  freeze({ id: "family.feedback-ui.slice", categoryContractId: "category.ui", purpose: "Small touch-readable interaction and reward feedback, never a persistent HUD.", projection: "screen-facing pixel UI", scaleRule: "native-size within declared 64px frame", anchorRule: "centre", shadowRule: SHADOW_POLICY_IDS.NONE }),
  freeze({ id: "family.lawn-minigame.slice", categoryContractId: "category.minigame", purpose: "Full-board Lawn Care tiles, mower, weeds, and three essential controls.", projection: "top-down orthographic board", scaleRule: "64px untrimmed cells aligned to the existing DOM grid", anchorRule: "cell centre", shadowRule: SHADOW_POLICY_IDS.NONE }),
]);

const outputImage = (width, height, alpha = true) => freeze({
  type: "single-image", format: "png", canvas: freeze({ width, height }), alpha,
  colourMode: alpha ? "RGBA" : "RGB", bitDepth: 8, pixelArt: true, textureFiltering: "nearest",
  smoothing: false, trimFrames: false, spriteSheet: null, atlas: null,
});

const outputSheet = (frameWidth, frameHeight, columns, rows, frameOrder, alpha = true) => freeze({
  type: "spritesheet", format: "png",
  canvas: freeze({ width: frameWidth * columns, height: frameHeight * rows }), alpha,
  colourMode: alpha ? "RGBA" : "RGB", bitDepth: 8, pixelArt: true, textureFiltering: "nearest",
  smoothing: false, trimFrames: false, atlas: null,
  spriteSheet: freeze({ frameWidth, frameHeight, columns, rows, padding: 0, spacing: 0, frameCount: columns * rows, frameOrder: freeze(frameOrder), actions: freeze([]), directions: freeze([]) }),
});

const runtimeFilename = (slug) => `public/assets/runtime/phase-8a/${slug}.v1.png`;
const stagedFilename = (slug) => `artwork/staging/phase-8a/${slug}/v1/${slug}.v1.png`;
const masterFilename = (slug) => `artwork/masters/phase-8a/${slug}/v1/${slug}.v1.png`;

function makeAsset({
  semanticId, slug, familyId, purpose, scenes, output, perspective, logicalDisplay, anchor,
  geometry, states = ["default"], layers = ["main"], directions = [], animations = [], sockets = [],
  prompt, forbidden = [], dependencies = [], placements, prefabId, stateMapId, maximumRuntimeBytes = 350000,
}) {
  const negative = [...COMMON_FORBIDDEN, ...forbidden];
  const categoryContractId = ({
    "family.town-terrain.slice": "category.terrain",
    "family.house-exterior.slice": "category.building",
    "family.world-lawn.slice": "category.terrain",
    "family.layered-tree.slice": "category.vegetation",
    "family.small-town-prop.slice": "category.prop",
    "family.resident-character.slice": "category.character",
    "family.animal-character.slice": "category.animal",
    "family.feedback-ui.slice": "category.ui",
    "family.lawn-minigame.slice": "category.minigame",
  })[familyId];
  const normalizedAnimations = animations.map((animation) => freeze({
    ...animation,
    action: animation.action || String(animation.id).split("-")[0],
    direction: animation.direction || directions.find((direction) => String(animation.id).endsWith(`-${direction}`)) || null,
  }));
  const normalizedOutput = output.spriteSheet ? freeze({
    ...output,
    spriteSheet: freeze({
      ...output.spriteSheet,
      actions: freeze([...new Set(normalizedAnimations.map(({ action }) => action).filter(Boolean).concat(states))]),
      directions: freeze(directions),
    }),
  }) : output;
  return freeze({
    schemaVersion: PHASE_8A_PACKAGE_SCHEMA_VERSION,
    semanticId,
    version: "1.0.0",
    familyId,
    categoryContractId,
    gameplayPurpose: purpose,
    intendedScenes: freeze(scenes),
    output: normalizedOutput,
    camera: freeze({ projection: perspective, viewDirection: "south-facing map view", cameraMotion: "none authored into asset" }),
    masterScale: freeze({ nativePixelsPerLogicalUnit: 1, logicalDisplay: freeze(logicalDisplay), scalePolicy: "fit-declared-logical-bounds-never-source-size" }),
    anchor: freeze(anchor),
    geometry: freeze(geometry),
    sockets: freeze(sockets),
    states: freeze(states),
    variants: freeze(states),
    layers: freeze(layers.map((id, order) => freeze({ id, order, states: freeze(states), canvasAlignment: normalizedOutput.spriteSheet ? "frame-grid" : "full-canvas" }))),
    directions: freeze(directions),
    animations: freeze(normalizedAnimations),
    artRules: freeze({ artBibleVersion: ART_BIBLE, palette: "Willowmere natural greens, river blues, warm timber, cream highlights", outline: "consistent dark pixel outline with crisp pixel clusters", lighting: "soft daylight from upper-left", shadow: "follow the family shadow contract", texture: "pixel-authored clusters; no photographic noise" }),
    expectedFilenames: freeze({ staging: stagedFilename(slug), master: masterFilename(slug), runtime: runtimeFilename(slug) }),
    filenameStem: slug,
    promptPackage: freeze({
      providerNeutral: true,
      positivePrompt: `Create one production-ready KindWorks pixel-art asset for ${purpose} ${prompt} Use ${ART_BIBLE}. Exact output: ${output.canvas.width}×${output.canvas.height}px ${output.format.toUpperCase()}, ${output.alpha ? "transparent alpha" : "fully opaque"}, untrimmed, nearest-neighbour pixel art. Preserve the declared camera, scale, anchor, state alignment, frame order, and empty padding. No presentation mockup.`,
      negativePrompt: negative.join("; "),
      deliveryInstruction: `Return only ${slug}.v1.png plus provenance metadata; do not composite it into a screenshot or rename it.`,
    }),
    forbiddenOutput: freeze(negative),
    validation: freeze({
      checklist: COMMON_CHECKS,
      requireExactDimensions: true,
      requireAlpha: output.alpha,
      requireUntrimmedFrames: true,
      requireNearestNeighbour: true,
      requireFrameCount: output.spriteSheet?.frameCount || 1,
      requireStateNames: freeze(states),
      requireDirections: freeze(directions),
      maximumTransparentPadding: freeze({ top: output.canvas.height, right: output.canvas.width, bottom: output.canvas.height, left: output.canvas.width }),
      maximumVisibleBounds: freeze({ x: 0, y: 0, width: output.canvas.width, height: output.canvas.height }),
      gameplayGeometrySignature: phase8AGameplayGeometrySignature(geometry),
      maximumRuntimeBytes,
      fallbackSemanticId: "system.fallback.production",
    }),
    accessibility: categoryContractId === "category.ui" ? freeze({
      labelKey: `asset.${semanticId}`,
      minimumRenderedSize: freeze({ width: 44, height: 44 }),
      minimumContrastRatio: 3,
      safeContentInsets: freeze({ top: 4, right: 4, bottom: 4, left: 4 }),
      localizationExpansionPercent: 30,
    }) : null,
    dependencies: freeze(dependencies),
    scenePlacement: freeze(placements),
    prefabId,
    stateMapId,
    placeholder: freeze({ mode: "semantic-registry-generated-fallback", development: "labelled checker placeholder in Asset Lab", production: "transparent safe fallback with recorded registry failure" }),
    productionStatus: "specified",
    provenance: freeze({ provider: "generator-neutral", specificationVersion: PHASE_8A_PACKAGE_SCHEMA_VERSION, artBibleVersion: ART_BIBLE, generatedArtworkPresent: false }),
  });
}

const townPlacement = (instanceId, x, y, extra = {}) => freeze({ layoutId: PHASE_8A_TOWN_LAYOUT_ID, sceneId: TOWN_SCENE, instanceId, position: point(x, y), worldOrigin: point(1880, 0), gameplayGeometryLocked: true, ...extra });
const lawnPlacement = (instanceId, x, y, extra = {}) => freeze({ layoutId: PHASE_8A_LAWN_LAYOUT_ID, sceneId: LAWN_SCENE, instanceId, position: point(x, y), gameplayGeometryLocked: true, ...extra });

export const PHASE_8A_ASSET_IDS = freeze({
  GRASS: "terrain.town.slice.grass", PAVEMENT: "terrain.town.slice.pavement", ROAD: "terrain.town.slice.road", RIVER_EDGE: "terrain.town.slice.river-edge",
  HOUSE: "building.town.slice.house-6-bay-cottage", LAWN: "terrain.town.slice.lawn-house-6",
  TREE_SHADOW: "prop.town.slice.large-oak.shadow", TREE_TRUNK: "prop.town.slice.large-oak.trunk", TREE_CANOPY: "prop.town.slice.large-oak.canopy",
  BIN: "prop.town.slice.public-bin", FENCE: "prop.town.slice.white-fence", RUBBISH: "prop.town.slice.rubbish-can", DECORATION: "prop.town.slice.flower-planter",
  PLAYER: "character.player.slice.resident", NPC: "character.npc.slice.resident-a", ANIMAL: "character.animal.slice.dog",
  INTERACTION: "ui.town.slice.lawn-interaction", REWARD: "ui.town.slice.coin-reward-burst",
  LAWN_TILES: "minigame.lawn.slice.board-tiles", LAWN_WEEDS: "minigame.lawn.slice.weed-tiles", LAWN_MOWER: "minigame.lawn.slice.mower", LAWN_CONTROLS: "ui.lawn.slice.controls",
});

const characterFrameOrder = freeze(["down-0", "down-1", "down-2", "down-3", "left-0", "left-1", "left-2", "left-3", "right-0", "right-1", "right-2", "right-3", "up-0", "up-1", "up-2", "up-3"]);
const fourDirections = freeze(["down", "left", "right", "up"]);
const residentAnimations = fourDirections.map((direction, row) => freeze({ id: `walk-${direction}`, action: "walk", direction, frames: freeze([0, 1, 2, 3].map((column) => row * 4 + column)), frameRate: 9, repeat: -1 }));
const dogAnimations = fourDirections.map((direction, row) => freeze({ id: `walk-${direction}`, action: "walk", direction, frames: freeze([0, 1, 2, 3].map((column) => row * 4 + column)), frameRate: 8, repeat: -1 }));

const assets = freeze([
  makeAsset({ semanticId: PHASE_8A_ASSET_IDS.GRASS, slug: "town-grass-tile", familyId: "family.town-terrain.slice", purpose: "seamless grass foundation for the representative town block", scenes: [TOWN_SCENE], output: outputImage(64, 64, false), perspective: "top-down orthographic", logicalDisplay: { width: 64, height: 64 }, anchor: { name: "tile-top-left", normalized: point(0, 0), groundContact: null }, geometry: { visual: rect(0, 0, 64, 64), collision: null, navigation: null, interaction: null, touch: null }, prompt: "A quiet mid-green village lawn tile with restrained natural pixel variation; edges must tile seamlessly on all four sides.", forbidden: ["flowers, paths, stones, objects, baked shadows, or visible seams"], placements: [townPlacement("instance.phase-8a.town.terrain.grass", 0, 0, { repeat: "cover-town-ground" })], prefabId: "prefab.phase-8a.terrain.grass", stateMapId: "state.phase-8a.terrain.grass", maximumRuntimeBytes: 30000 }),
  makeAsset({ semanticId: PHASE_8A_ASSET_IDS.PAVEMENT, slug: "town-pavement-tile", familyId: "family.town-terrain.slice", purpose: "pavement edge between the house lawn and north road", scenes: [TOWN_SCENE], output: outputImage(64, 64, false), perspective: "top-down orthographic", logicalDisplay: { width: 64, height: 64 }, anchor: { name: "tile-top-left", normalized: point(0, 0), groundContact: null }, geometry: { visual: rect(0, 0, 64, 64), collision: null, navigation: null, interaction: null, touch: null }, prompt: "Warm pale Willowmere paving stones with a readable 32-unit rhythm and fully seamless edges.", forbidden: ["road markings, grass border, objects, baked characters, or perspective tilt"], dependencies: [PHASE_8A_ASSET_IDS.GRASS], placements: [townPlacement("instance.phase-8a.town.terrain.pavement", 640, 493, { repeat: "horizontal-strip" })], prefabId: "prefab.phase-8a.terrain.pavement", stateMapId: "state.phase-8a.terrain.pavement", maximumRuntimeBytes: 35000 }),
  makeAsset({ semanticId: PHASE_8A_ASSET_IDS.ROAD, slug: "town-road-tile", familyId: "family.town-terrain.slice", purpose: "north-road surface under the slice", scenes: [TOWN_SCENE], output: outputImage(64, 64, false), perspective: "top-down orthographic", logicalDisplay: { width: 64, height: 64 }, anchor: { name: "tile-top-left", normalized: point(0, 0), groundContact: null }, geometry: { visual: rect(0, 0, 64, 64), collision: null, navigation: null, interaction: null, touch: null }, prompt: "Muted blue-grey village road surface, fine pixel aggregate, seamless, with no baked curb or markings.", forbidden: ["vehicles, curb, crossing, centre line, puddles, or debris"], dependencies: [PHASE_8A_ASSET_IDS.PAVEMENT], placements: [townPlacement("instance.phase-8a.town.terrain.road", 640, 548, { repeat: "horizontal-strip", protectedWorldRoadId: "north-road" })], prefabId: "prefab.phase-8a.terrain.road", stateMapId: "state.phase-8a.terrain.road", maximumRuntimeBytes: 30000 }),
  makeAsset({ semanticId: PHASE_8A_ASSET_IDS.RIVER_EDGE, slug: "town-river-edge-sheet", familyId: "family.town-terrain.slice", purpose: "tree-free Willow River banks and water edge beside the block", scenes: [TOWN_SCENE], output: outputSheet(128, 64, 4, 1, ["west-straight", "east-straight", "west-transition", "east-transition"], true), perspective: "top-down orthographic", logicalDisplay: { width: 128, height: 64 }, anchor: { name: "tile-top-left", normalized: point(0, 0), groundContact: null }, geometry: { visual: rect(0, 0, 128, 64), collision: rect(20, 0, 88, 64), navigation: rect(20, 0, 88, 64), interaction: null, touch: null }, states: ["west-straight", "east-straight", "west-transition", "east-transition"], prompt: "Four horizontal frames in the exact order specified: west straight bank, east straight bank, west transition, east transition. Blue flowing water meets a narrow stone-and-earth bank; stones remain on land at the water edge, never floating in the river.", forbidden: ["trees, bridge, floating rocks, boats, characters, mirrored labels, or water wider than the declared protected geometry"], dependencies: [PHASE_8A_ASSET_IDS.GRASS], placements: [townPlacement("instance.phase-8a.town.terrain.river-edge", 670, 360, { repeat: "vertical-banks", protectedWorldRiver: { centreX: 2555, waterWidth: 188, bankWidth: 226 } })], prefabId: "prefab.phase-8a.terrain.river-edge", stateMapId: "state.phase-8a.terrain.river-edge", maximumRuntimeBytes: 120000 }),
  makeAsset({ semanticId: PHASE_8A_ASSET_IDS.HOUSE, slug: "house-6-bay-cottage-states", familyId: "family.house-exterior.slice", purpose: "house-6 bay-cottage exterior with clean, dirty, job-ready, and upgraded visual states", scenes: [TOWN_SCENE], output: outputSheet(256, 192, 4, 1, ["clean", "weathered", "job-ready", "upgraded"], true), perspective: "three-quarter top-down town exterior", logicalDisplay: { width: 256, height: 192 }, anchor: { name: "front-door-ground", normalized: point(0.5, 0.916667), groundContact: point(0, 0) }, geometry: { visual: rect(-128, -176, 256, 192), collision: rect(-97.5, -115, 195, 110), navigation: rect(-103, -120, 206, 120), interaction: circle(0, -7, 92), touch: rect(-110, -130, 220, 145) }, states: ["clean", "weathered", "job-ready", "upgraded"], sockets: [{ id: "door", logical: point(0, -6) }, { id: "approach", logical: point(0, 25) }, { id: "roof-status", logical: point(0, -150) }], prompt: "One bay cottage kept pixel-perfect in the same position across four horizontal frames: cared-for clean, time-weathered, visibly job-ready but still habitable, and tasteful upgraded. The front door socket and building footprint cannot move between frames.", forbidden: ["interior cutaway, people, lawn, fence, separate environment background, moved door, frame-to-frame silhouette drift, or destructive damage"], dependencies: [PHASE_8A_ASSET_IDS.GRASS, PHASE_8A_ASSET_IDS.PAVEMENT], placements: [townPlacement("instance.phase-8a.town.house-6", 278, 391, { protectedWorldObjectId: "house-6", protectedWorldPosition: point(2158, 391) })], prefabId: "prefab.phase-8a.house-6", stateMapId: "state.phase-8a.house-6", maximumRuntimeBytes: 360000 }),
  makeAsset({ semanticId: PHASE_8A_ASSET_IDS.LAWN, slug: "lawn-house-6-growth-states", familyId: "family.world-lawn.slice", purpose: "the authored house-6 lawn in all four growth states", scenes: [TOWN_SCENE], output: outputSheet(320, 352, 4, 1, ["fresh-cut", "growing", "long", "job-ready"], true), perspective: "top-down orthographic", logicalDisplay: { width: 320, height: 352 }, anchor: { name: "yard-centre", normalized: point(0.5, 0.5), groundContact: null }, geometry: { visual: rect(-160, -176, 320, 352), collision: null, navigation: null, interaction: circle(0, 95, 105), touch: rect(-155, -170, 310, 340) }, states: ["fresh-cut", "growing", "long", "job-ready"], sockets: [{ id: "job-entry", logical: point(0, 95) }, { id: "gate-south", logical: point(0, 170) }], prompt: "Four horizontally aligned versions of the exact same 310×340 house yard: freshly cut below 20 grass height, growing 20–44, long 45–69, and overgrown job-ready at 70+. Preserve every boundary and gate opening; only grass height, density, weeds, and small flowers change.", forbidden: ["house, road, mower, person, text, status badge, moved yard boundary, or changed gate position"], dependencies: [PHASE_8A_ASSET_IDS.GRASS], placements: [townPlacement("instance.phase-8a.town.lawn-house-6", 375, 320, { protectedWorldObjectId: "lawn-house-6", protectedWorldYard: { x: 2100, y: 150, width: 310, height: 340 } })], prefabId: "prefab.phase-8a.lawn-house-6", stateMapId: "state.phase-8a.lawn-house-6", maximumRuntimeBytes: 460000 }),
  makeAsset({ semanticId: PHASE_8A_ASSET_IDS.TREE_SHADOW, slug: "large-oak-shadow", familyId: "family.layered-tree.slice", purpose: "separate ground shadow for the large occluding oak", scenes: [TOWN_SCENE], output: outputImage(128, 160, true), perspective: "three-quarter top-down town prop", logicalDisplay: { width: 128, height: 160 }, anchor: { name: "tree-ground", normalized: point(0.5, 0.9), groundContact: point(0, 0) }, geometry: { visual: rect(-64, -144, 128, 160), collision: null, navigation: null, interaction: null, touch: null }, layers: ["shadow"], prompt: "Only the soft pixel-art ground shadow of a large oak, aligned to ground contact (64,144); all other pixels fully transparent.", forbidden: ["trunk, foliage, grass, opaque background, hard black ellipse, or shifted anchor"], dependencies: [PHASE_8A_ASSET_IDS.GRASS], placements: [townPlacement("instance.phase-8a.town.large-oak", 1000, 250, { layerRole: "shadow", protectedWorldPosition: point(2880, 250) })], prefabId: "prefab.phase-8a.large-oak", stateMapId: "state.phase-8a.large-oak", maximumRuntimeBytes: 60000 }),
  makeAsset({ semanticId: PHASE_8A_ASSET_IDS.TREE_TRUNK, slug: "large-oak-trunk", familyId: "family.layered-tree.slice", purpose: "large-oak trunk and lower body used for collision and Y-sort", scenes: [TOWN_SCENE], output: outputImage(128, 160, true), perspective: "three-quarter top-down town prop", logicalDisplay: { width: 128, height: 160 }, anchor: { name: "tree-ground", normalized: point(0.5, 0.9), groundContact: point(0, 0) }, geometry: { visual: rect(-43, -62, 87, 97), collision: circle(0, 0, 22), navigation: circle(0, 0, 50), interaction: circle(0, 0, 72), touch: rect(-44, -62, 88, 100) }, layers: ["trunk"], sockets: [{ id: "ground", logical: point(0, 0) }, { id: "canopy", logical: point(0, -62) }], prompt: "Only the oak trunk, roots, and low branches needed below the canopy; align with the shared 128×160 tree canvas and ground contact (64,144).", forbidden: ["full canopy, ground shadow, fruit, sign, character, or opaque background"], dependencies: [PHASE_8A_ASSET_IDS.TREE_SHADOW], placements: [townPlacement("instance.phase-8a.town.large-oak", 1000, 250, { layerRole: "main", protectedWorldPosition: point(2880, 250) })], prefabId: "prefab.phase-8a.large-oak", stateMapId: "state.phase-8a.large-oak", maximumRuntimeBytes: 90000 }),
  makeAsset({ semanticId: PHASE_8A_ASSET_IDS.TREE_CANOPY, slug: "large-oak-canopy", familyId: "family.layered-tree.slice", purpose: "foreground canopy that correctly occludes residents behind the large oak", scenes: [TOWN_SCENE], output: outputImage(128, 160, true), perspective: "three-quarter top-down town prop", logicalDisplay: { width: 128, height: 160 }, anchor: { name: "tree-ground", normalized: point(0.5, 0.9), groundContact: point(0, 0) }, geometry: { visual: rect(-64, -144, 128, 160), collision: null, navigation: null, interaction: null, touch: null }, layers: ["foreground-canopy"], prompt: "Only a lush rounded large-oak canopy, aligned with the shared tree canvas. Lower canopy pixels must naturally pass in front of a resident walking behind the trunk while leaving the ground-contact region transparent.", forbidden: ["trunk, roots, ground shadow, background, rectangular foliage mass, or missing lower occlusion fringe"], dependencies: [PHASE_8A_ASSET_IDS.TREE_TRUNK], placements: [townPlacement("instance.phase-8a.town.large-oak", 1000, 250, { layerRole: "foreground", protectedWorldPosition: point(2880, 250) })], prefabId: "prefab.phase-8a.large-oak", stateMapId: "state.phase-8a.large-oak", maximumRuntimeBytes: 120000 }),
  makeAsset({ semanticId: PHASE_8A_ASSET_IDS.BIN, slug: "public-bin-states", familyId: "family.small-town-prop.slice", purpose: "compact public bin for the town block", scenes: [TOWN_SCENE], output: outputSheet(64, 80, 3, 1, ["normal", "full", "tipped"], true), perspective: "three-quarter top-down town prop", logicalDisplay: { width: 56, height: 70 }, anchor: { name: "bin-ground", normalized: point(0.5, 0.875), groundContact: point(0, 0) }, geometry: { visual: rect(-20, -45, 56, 70), collision: circle(0, 0, 18), navigation: circle(0, 0, 28), interaction: circle(0, 0, 72), touch: rect(-28, -35, 56, 70) }, states: ["normal", "full", "tipped"], sockets: [{ id: "status", logical: point(0, -42) }], prompt: "Three horizontally aligned frames of the same small dark-green Willowmere public bin with a tiny clear litter emblem: normal, visibly full, and tipped. Preserve its model, scale, ground contact, and canvas position across every state.", forbidden: ["oversized wheelie bin, text label, recycling brand, loose rubbish outside the full-state boundary, missing state, or changed ground contact"], dependencies: [PHASE_8A_ASSET_IDS.PAVEMENT], placements: [townPlacement("instance.phase-8a.town.public-bin", 470, 480)], prefabId: "prefab.phase-8a.public-bin", stateMapId: "state.phase-8a.public-bin", maximumRuntimeBytes: 150000 }),
  makeAsset({ semanticId: PHASE_8A_ASSET_IDS.FENCE, slug: "white-fence-segment", familyId: "family.small-town-prop.slice", purpose: "house-6 white picket fence segment with gate socket", scenes: [TOWN_SCENE], output: outputSheet(128, 64, 2, 1, ["straight", "gate"], true), perspective: "three-quarter top-down town prop", logicalDisplay: { width: 128, height: 64 }, anchor: { name: "fence-ground", normalized: point(0.5, 0.875), groundContact: point(0, 0) }, geometry: { visual: rect(-64, -56, 128, 64), collision: rect(-64, -10, 128, 16), navigation: rect(-64, -12, 128, 20), interaction: null, touch: null }, states: ["straight", "gate"], sockets: [{ id: "segment-left", logical: point(-64, 0) }, { id: "segment-right", logical: point(64, 0) }, { id: "gate-centre", logical: point(0, 0) }], prompt: "Two horizontal frames: a 128-unit white picket fence and a matching centred gate. Keep posts, baseline, endpoints, and ground contact identical so segments join without seams.", forbidden: ["lawn, house, flowers, perspective mismatch, open gate animation, or nonmatching endpoints"], dependencies: [PHASE_8A_ASSET_IDS.LAWN], placements: [townPlacement("instance.phase-8a.town.house-6-fence", 375, 475, { repeat: "yard-boundary", protectedGate: "south" })], prefabId: "prefab.phase-8a.white-fence", stateMapId: "state.phase-8a.white-fence", maximumRuntimeBytes: 90000 }),
  makeAsset({ semanticId: PHASE_8A_ASSET_IDS.RUBBISH, slug: "rubbish-crushed-can", familyId: "family.small-town-prop.slice", purpose: "one collectable rubbish item near the public bin", scenes: [TOWN_SCENE], output: outputImage(64, 64, true), perspective: "three-quarter top-down town prop", logicalDisplay: { width: 34, height: 28 }, anchor: { name: "rubbish-ground", normalized: point(0.5, 0.75), groundContact: point(0, 0) }, geometry: { visual: rect(-17, -22, 34, 28), collision: null, navigation: null, interaction: circle(0, 0, 54), touch: rect(-24, -24, 48, 48) }, states: ["present", "collected"], prompt: "A single clearly readable but small crushed drinks can, isolated on transparency, suitable for a town cleanup interaction.", forbidden: ["card background, label, multiple rubbish items, bin, hand cursor, or giant scale"], dependencies: [PHASE_8A_ASSET_IDS.BIN], placements: [townPlacement("instance.phase-8a.town.rubbish-can", 520, 470)], prefabId: "prefab.phase-8a.rubbish-can", stateMapId: "state.phase-8a.rubbish-can", maximumRuntimeBytes: 35000 }),
  makeAsset({ semanticId: PHASE_8A_ASSET_IDS.DECORATION, slug: "flower-planter", familyId: "family.small-town-prop.slice", purpose: "small flower planter decoration beside house-6", scenes: [TOWN_SCENE], output: outputImage(64, 64, true), perspective: "three-quarter top-down town prop", logicalDisplay: { width: 48, height: 48 }, anchor: { name: "planter-ground", normalized: point(0.5, 0.875), groundContact: point(0, 0) }, geometry: { visual: rect(-24, -42, 48, 48), collision: circle(0, 0, 14), navigation: circle(0, 0, 20), interaction: circle(0, 0, 56), touch: rect(-24, -36, 48, 48) }, prompt: "A compact warm-stone planter with restrained mixed cottage flowers, readable at 48 logical pixels and isolated on transparency.", forbidden: ["large garden bed, sign, text, person, background, or flowers beyond the 64px canvas"], dependencies: [PHASE_8A_ASSET_IDS.LAWN], placements: [townPlacement("instance.phase-8a.town.flower-planter", 250, 440)], prefabId: "prefab.phase-8a.flower-planter", stateMapId: "state.phase-8a.flower-planter", maximumRuntimeBytes: 50000 }),
  makeAsset({ semanticId: PHASE_8A_ASSET_IDS.PLAYER, slug: "player-resident-walk", familyId: "family.resident-character.slice", purpose: "controllable player resident for the premium slice", scenes: [TOWN_SCENE, LAWN_SCENE], output: outputSheet(64, 64, 4, 4, characterFrameOrder, true), perspective: "three-quarter top-down resident", logicalDisplay: { width: 40, height: 54 }, anchor: { name: "resident-feet", normalized: point(0.5, 0.875), groundContact: point(0, 0) }, geometry: { visual: rect(-20, -54, 40, 54), collision: circle(0, 0, 16), navigation: circle(0, 0, 16), interaction: circle(0, 0, 60), touch: rect(-24, -54, 48, 60) }, directions: fourDirections, animations: residentAnimations, sockets: [{ id: "right-hand", logical: point(12, -28) }, { id: "left-hand", logical: point(-12, -28) }, { id: "head", logical: point(0, -50) }], prompt: "A friendly customizable KindWorks resident. Four rows down, left, right, up; four columns idle-contact, passing, idle-contact, passing. Keep anatomy, clothing, hair, palette, feet, and hand sockets aligned across all 16 frames.", forbidden: ["weapons, tool baked into hand, cast shadow, frame labels, inconsistent clothing, missing direction, mirrored asymmetric details, or cropped hair"], dependencies: [PHASE_8A_ASSET_IDS.GRASS], placements: [townPlacement("instance.phase-8a.town.player", 520, 470, { dynamicPosition: "active Town resident", dynamicFacing: "active facing" }), lawnPlacement("instance.phase-8a.lawn.player-reference", 112, 628, { presentationOnly: true })], prefabId: "prefab.phase-8a.player", stateMapId: "state.phase-8a.player", maximumRuntimeBytes: 280000 }),
  makeAsset({ semanticId: PHASE_8A_ASSET_IDS.NPC, slug: "npc-resident-a-walk", familyId: "family.resident-character.slice", purpose: "one independently moving town NPC", scenes: [TOWN_SCENE], output: outputSheet(64, 64, 4, 4, characterFrameOrder, true), perspective: "three-quarter top-down resident", logicalDisplay: { width: 42, height: 66 }, anchor: { name: "resident-feet", normalized: point(0.5, 0.875), groundContact: point(0, 0) }, geometry: { visual: rect(-21, -66, 42, 66), collision: circle(0, 0, 16), navigation: circle(0, 0, 16), interaction: circle(0, 0, 74), touch: rect(-24, -58, 48, 66) }, directions: fourDirections, animations: residentAnimations, sockets: [{ id: "thought", logical: point(0, -64) }, { id: "gift", logical: point(13, -30) }], prompt: "A distinct adult Willowmere NPC using the exact same four-direction, four-frame grid and foot alignment as the player while remaining visibly a different person.", forbidden: ["player duplicate, name text, speech bubble, gift baked into sprite, shadow, missing direction, or frame-to-frame costume changes"], dependencies: [PHASE_8A_ASSET_IDS.PLAYER], placements: [townPlacement("instance.phase-8a.town.npc-resident-a", 440, 470, { npcIdentityBinding: "existing-resident-fixture" })], prefabId: "prefab.phase-8a.npc-resident-a", stateMapId: "state.phase-8a.npc-resident-a", maximumRuntimeBytes: 280000 }),
  makeAsset({ semanticId: PHASE_8A_ASSET_IDS.ANIMAL, slug: "animal-dog-walk", familyId: "family.animal-character.slice", purpose: "one roaming and follow-capable dog", scenes: [TOWN_SCENE], output: outputSheet(48, 40, 4, 4, characterFrameOrder, true), perspective: "three-quarter top-down animal", logicalDisplay: { width: 36, height: 30 }, anchor: { name: "animal-feet", normalized: point(0.5, 0.875), groundContact: point(0, 0) }, geometry: { visual: rect(-18, -30, 36, 30), collision: circle(0, 0, 12), navigation: circle(0, 0, 12), interaction: circle(0, 0, 70), touch: rect(-24, -34, 48, 48) }, directions: fourDirections, animations: dogAnimations, sockets: [{ id: "food", logical: point(15, -12) }, { id: "friendship", logical: point(0, -34) }], prompt: "A friendly medium-small Willowmere dog in four directional rows and four walk frames per row, aligned to the declared feet, food, and friendship sockets.", forbidden: ["collar text, food bowl, owner, speech bubble, shadow, missing tail motion, or inconsistent markings between frames"], dependencies: [PHASE_8A_ASSET_IDS.PLAYER], placements: [townPlacement("instance.phase-8a.town.animal-dog", 910, 330, { speciesBinding: "dog" })], prefabId: "prefab.phase-8a.animal-dog", stateMapId: "state.phase-8a.animal-dog", maximumRuntimeBytes: 210000 }),
  makeAsset({ semanticId: PHASE_8A_ASSET_IDS.INTERACTION, slug: "lawn-interaction-prompt", familyId: "family.feedback-ui.slice", purpose: "contextual lawn-job interaction prompt", scenes: [TOWN_SCENE], output: outputSheet(64, 64, 2, 1, ["available", "pressed"], true), perspective: "screen-facing pixel UI", logicalDisplay: { width: 52, height: 52 }, anchor: { name: "prompt-centre", normalized: point(0.5, 0.5), groundContact: null }, geometry: { visual: rect(-26, -26, 52, 52), collision: null, navigation: null, interaction: null, touch: rect(-32, -32, 64, 64) }, states: ["available", "pressed"], prompt: "Two frames of a compact contextual action badge: available and visibly pressed. Use a simple mower/grass action symbol with no words; readable at phone landscape size.", forbidden: ["long text, permanent HUD panel, coin amount, level number, hand cursor, or more than one action"], dependencies: [PHASE_8A_ASSET_IDS.LAWN], placements: [townPlacement("instance.phase-8a.town.lawn-interaction", 375, 405, { socketBinding: "job-entry", contextualOnly: true })], prefabId: "prefab.phase-8a.lawn-interaction", stateMapId: "state.phase-8a.lawn-interaction", maximumRuntimeBytes: 50000 }),
  makeAsset({ semanticId: PHASE_8A_ASSET_IDS.REWARD, slug: "coin-reward-burst", familyId: "family.feedback-ui.slice", purpose: "short saved-reward confirmation after the lawn state transition", scenes: [TOWN_SCENE, LAWN_SCENE], output: outputSheet(64, 64, 6, 1, ["burst-0", "burst-1", "burst-2", "burst-3", "burst-4", "burst-5"], true), perspective: "screen-facing pixel UI", logicalDisplay: { width: 64, height: 64 }, anchor: { name: "burst-centre", normalized: point(0.5, 0.5), groundContact: null }, geometry: { visual: rect(-32, -32, 64, 64), collision: null, navigation: null, interaction: null, touch: null }, states: ["rewarded"], animations: [{ id: "reward-burst", frames: [0, 1, 2, 3, 4, 5], frameRate: 12, repeat: 0 }], prompt: "Six-frame restrained golden coin sparkle burst, expanding and settling without text. Frame zero starts small; final frame fades cleanly to transparency.", forbidden: ["coin value, currency grant logic, chest, button, confetti filling the canvas, endless loop, or opaque background"], dependencies: [PHASE_8A_ASSET_IDS.INTERACTION], placements: [townPlacement("instance.phase-8a.town.lawn-reward", 375, 405, { visibleAfter: "transition.phase-8a.lawn-house-6.complete" }), lawnPlacement("instance.phase-8a.lawn.reward", 640, 360, { visibleAfter: "LawnCareService.applyResult.ok" })], prefabId: "prefab.phase-8a.coin-reward", stateMapId: "state.phase-8a.coin-reward", maximumRuntimeBytes: 110000 }),
  makeAsset({ semanticId: PHASE_8A_ASSET_IDS.LAWN_TILES, slug: "lawn-care-board-tiles", familyId: "family.lawn-minigame.slice", purpose: "full-screen Lawn Care board surface states", scenes: [LAWN_SCENE], output: outputSheet(64, 64, 4, 1, ["tall", "cut-vertical", "cut-horizontal", "hedge"], false), perspective: "top-down orthographic board", logicalDisplay: { width: 64, height: 64 }, anchor: { name: "cell-centre", normalized: point(0.5, 0.5), groundContact: null }, geometry: { visual: rect(-32, -32, 64, 64), collision: null, navigation: null, interaction: rect(-32, -32, 64, 64), touch: rect(-32, -32, 64, 64) }, states: ["tall", "cut-vertical", "cut-horizontal", "hedge"], prompt: "Four seamless board cells in exact order: tall grass, vertically raked cut lines, horizontally raked cut lines, and impassable hedge. All cells share edges, lighting, scale, and camera.", forbidden: ["mower, weeds, UI, labels, perspective tilt, mismatched tile edges, or ambiguous cut direction"], dependencies: [PHASE_8A_ASSET_IDS.GRASS], placements: [lawnPlacement("instance.phase-8a.lawn.board-tiles", 640, 340, { repeat: "existing-level-grid", gameplayOwner: "LawnCareEngine" })], prefabId: "prefab.phase-8a.lawn-board-tiles", stateMapId: "state.phase-8a.lawn-board-tiles", maximumRuntimeBytes: 120000 }),
  makeAsset({ semanticId: PHASE_8A_ASSET_IDS.LAWN_WEEDS, slug: "lawn-care-weed-tiles", familyId: "family.lawn-minigame.slice", purpose: "three readable Lawn Care weed types", scenes: [LAWN_SCENE], output: outputSheet(64, 64, 3, 1, ["normal", "tough", "woody"], true), perspective: "top-down orthographic board", logicalDisplay: { width: 64, height: 64 }, anchor: { name: "cell-centre", normalized: point(0.5, 0.5), groundContact: null }, geometry: { visual: rect(-32, -32, 64, 64), collision: null, navigation: null, interaction: null, touch: null }, states: ["normal", "tough", "woody"], prompt: "Three transparent overlays in exact order: normal weed, tougher leafy weed, and woody obstruction. Each is unmistakable without a text label and remains centred in a 64px lawn cell.", forbidden: ["grass background, card, label, mower, duplicated plant, or shifted baseline"], dependencies: [PHASE_8A_ASSET_IDS.LAWN_TILES], placements: [lawnPlacement("instance.phase-8a.lawn.weed-tiles", 640, 340, { repeat: "level-weed-cells", gameplayOwner: "LAWN_WEED_TYPES" })], prefabId: "prefab.phase-8a.lawn-weed-tiles", stateMapId: "state.phase-8a.lawn-weed-tiles", maximumRuntimeBytes: 80000 }),
  makeAsset({ semanticId: PHASE_8A_ASSET_IDS.LAWN_MOWER, slug: "lawn-care-mower", familyId: "family.lawn-minigame.slice", purpose: "directional mower token for the Lawn Care board", scenes: [LAWN_SCENE], output: outputSheet(64, 64, 4, 1, ["down", "left", "right", "up"], true), perspective: "top-down orthographic board", logicalDisplay: { width: 56, height: 56 }, anchor: { name: "cell-centre", normalized: point(0.5, 0.5), groundContact: null }, geometry: { visual: rect(-28, -28, 56, 56), collision: rect(-24, -24, 48, 48), navigation: rect(-24, -24, 48, 48), interaction: null, touch: rect(-32, -32, 64, 64) }, directions: fourDirections, states: fourDirections, prompt: "The same compact green mower in four exact directional frames down, left, right, up, centred within a 64px board cell. Direction must remain obvious at narrow-phone scale.", forbidden: ["operator, joystick, direction button, text, grass background, cast shadow outside cell, or inconsistent mower model"], dependencies: [PHASE_8A_ASSET_IDS.LAWN_TILES], placements: [lawnPlacement("instance.phase-8a.lawn.mower", 640, 340, { dynamicPosition: "LawnCareEngine row/column", dynamicFacing: "session.facing" })], prefabId: "prefab.phase-8a.lawn-mower", stateMapId: "state.phase-8a.lawn-mower", maximumRuntimeBytes: 90000 }),
  makeAsset({ semanticId: PHASE_8A_ASSET_IDS.LAWN_CONTROLS, slug: "lawn-care-essential-controls", familyId: "family.lawn-minigame.slice", purpose: "only the exit, undo, and hint icons required by the representative screen", scenes: [LAWN_SCENE], output: outputSheet(64, 64, 3, 1, ["exit", "undo", "hint"], true), perspective: "screen-facing pixel UI", logicalDisplay: { width: 52, height: 52 }, anchor: { name: "control-centre", normalized: point(0.5, 0.5), groundContact: null }, geometry: { visual: rect(-26, -26, 52, 52), collision: null, navigation: null, interaction: null, touch: rect(-32, -32, 64, 64) }, states: ["exit", "undo", "hint"], prompt: "Three compact, coherent pixel UI icons in order: close/exit, undo, and hint. No text. Each icon is centred with clear normal-state contrast and space for runtime pressed/disabled tint.", forbidden: ["movement arrows, reset, level, timer, served counter, status bar, text labels, or decorative panel wider than one cell"], dependencies: [PHASE_8A_ASSET_IDS.LAWN_TILES], placements: [lawnPlacement("instance.phase-8a.lawn.controls", 640, 680, { safeAreaBindings: ["top-right:exit", "bottom-centre:undo,hint"], minimumCssTouchTarget: 44 })], prefabId: "prefab.phase-8a.lawn-controls", stateMapId: "state.phase-8a.lawn-controls", maximumRuntimeBytes: 70000 }),
]);

const byId = new Map(assets.map((asset) => [asset.semanticId, asset]));

export const PHASE_8A_VERTICAL_SLICE_PACKAGE = freeze({
  schemaVersion: PHASE_8A_PACKAGE_SCHEMA_VERSION,
  id: PHASE_8A_PACKAGE_ID,
  revision: 1,
  status: "production-package-ready-no-artwork-generated",
  artBibleVersion: ART_BIBLE,
  scope: freeze({ townWorldOrigin: point(1880, 0), townCanonicalSize: freeze({ width: 1280, height: 720 }), representativeHouseId: "house-6", representativeLawnId: "lawn-house-6", representativeLawnLevel: 1 }),
  familyContracts: FAMILY_CONTRACTS,
  assets,
  layouts: freeze([
    freeze({ id: PHASE_8A_TOWN_LAYOUT_ID, sceneId: TOWN_SCENE, canonicalSize: freeze({ width: 1280, height: 720 }), worldOrigin: point(1880, 0), sourceOfTruth: "src/data/town.js house-6, north-road, RIVER_PATH, TOWN_REFERENCE_LAYOUT", activation: "prepared-not-active-until-phase-8b" }),
    freeze({ id: PHASE_8A_LAWN_LAYOUT_ID, sceneId: LAWN_SCENE, canonicalSize: freeze({ width: 1280, height: 720 }), sourceOfTruth: "src/scenes/LawnCareScene.js and src/data/lawnCare.js", activation: "prepared-not-active-until-phase-8b" }),
  ]),
  transition: freeze({
    id: "transition.phase-8a.lawn-house-6.complete",
    interaction: freeze({ sceneId: TOWN_SCENE, targetId: "lawn-house-6", entryOwner: "TownScene.startLawnCare", radius: 105 }),
    activity: freeze({ sceneId: LAWN_SCENE, gameplayOwner: "LawnCareEngine", completionOwner: "LawnCareService.applyResult", minimumRewardPercentOwner: "MIN_LAWN_REWARD_PERCENT" }),
    beforeVisualState: freeze({ stateMapId: "state.phase-8a.lawn-house-6", state: "job-ready", grassHeightRange: freeze({ minimum: 70, maximum: 100 }) }),
    afterVisualState: freeze({ stateMapId: "state.phase-8a.lawn-house-6", state: "fresh-cut", grassHeightOwner: "LAWN_CONFIG.freshlyCutHeight", currentValue: 5 }),
    rewardContract: freeze({ owner: "LawnCareService.applyResult/calculateLawnReward", delivery: "existing economy ledger only", duplicateProtection: "lawnCare.processedSessionIds", visualLayerMayMutateReward: false }),
    saveContract: freeze({ preservedFields: ["farming.lawns.lawn-house-6", "lawnCare", "economy.coins", "economy.ledger"], visualDefinitionsPersisted: false }),
  }),
  dependencyOrder: freeze([
    freeze({ wave: 1, name: "foundation-and-calibration", assetIds: freeze([PHASE_8A_ASSET_IDS.GRASS, PHASE_8A_ASSET_IDS.PAVEMENT, PHASE_8A_ASSET_IDS.ROAD]) }),
    freeze({ wave: 2, name: "river-and-world-footprints", assetIds: freeze([PHASE_8A_ASSET_IDS.RIVER_EDGE, PHASE_8A_ASSET_IDS.LAWN, PHASE_8A_ASSET_IDS.HOUSE]) }),
    freeze({ wave: 3, name: "occlusion-and-props", assetIds: freeze([PHASE_8A_ASSET_IDS.TREE_SHADOW, PHASE_8A_ASSET_IDS.TREE_TRUNK, PHASE_8A_ASSET_IDS.TREE_CANOPY, PHASE_8A_ASSET_IDS.FENCE, PHASE_8A_ASSET_IDS.BIN, PHASE_8A_ASSET_IDS.RUBBISH, PHASE_8A_ASSET_IDS.DECORATION]) }),
    freeze({ wave: 4, name: "characters-and-animal", assetIds: freeze([PHASE_8A_ASSET_IDS.PLAYER, PHASE_8A_ASSET_IDS.NPC, PHASE_8A_ASSET_IDS.ANIMAL]) }),
    freeze({ wave: 5, name: "interaction-and-reward", assetIds: freeze([PHASE_8A_ASSET_IDS.INTERACTION, PHASE_8A_ASSET_IDS.REWARD]) }),
    freeze({ wave: 6, name: "lawn-care-screen", assetIds: freeze([PHASE_8A_ASSET_IDS.LAWN_TILES, PHASE_8A_ASSET_IDS.LAWN_WEEDS, PHASE_8A_ASSET_IDS.LAWN_MOWER, PHASE_8A_ASSET_IDS.LAWN_CONTROLS]) }),
  ]),
  integration: freeze({
    registrySource: "createPhase8AAssetLabManifest(KINDWORKS_VISUAL_MANIFEST)",
    renderer: "PhaserPrefabRenderer",
    inspection: "AssetLabScene",
    replacementRule: "Change only the central semantic asset source/kind/runtime metadata after staged approval; scene gameplay files remain unchanged.",
    placeholdersActiveInRegistry: true,
    liveSceneActivationDeferredTo: "Phase 8B approved vertical-slice integration",
    massGenerationPermitted: false,
  }),
});

export function getPhase8AAssetContract(semanticId) {
  return byId.get(semanticId) || null;
}
