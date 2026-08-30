export const ASSET_CONTRACT_SCHEMA_VERSION = 2;

export const ASSET_OUTPUT_TYPES = Object.freeze([
  "single-image",
  "tileset",
  "spritesheet",
  "atlas",
  "layer-set",
  "nine-slice",
  "effect-sheet",
  "audio",
]);

export const IMAGE_FORMATS = Object.freeze(["png", "webp"]);
export const AUDIO_FORMATS = Object.freeze(["mp3", "ogg", "wav"]);

const contract = (id, description, values = {}) => Object.freeze({
  schemaVersion: ASSET_CONTRACT_SCHEMA_VERSION,
  id,
  description,
  allowedOutputTypes: Object.freeze(values.allowedOutputTypes || ["single-image"]),
  allowedFormats: Object.freeze(values.allowedFormats || IMAGE_FORMATS),
  requiresPerspective: values.requiresPerspective !== false,
  requiresScale: values.requiresScale !== false,
  requiresGeometry: values.requiresGeometry !== false,
  requiresStates: values.requiresStates !== false,
  requiresVariants: values.requiresVariants === true,
  requiresDirections: values.requiresDirections === true,
  requiresAnimationContract: values.requiresAnimationContract === true,
  requiresTransparencyContract: values.requiresTransparencyContract !== false,
  requiresAccessibilityMetadata: values.requiresAccessibilityMetadata === true,
  requiredMetadata: Object.freeze(values.requiredMetadata || []),
});

export const ASSET_CATEGORY_CONTRACTS = Object.freeze([
  contract("category.calibration", "Scale rulers, calibration specimens, and non-player production references.", { allowedOutputTypes: ["single-image", "layer-set"], requiredMetadata: ["masterScale", "anchor"] }),
  contract("category.system-fallback", "Visible development and safe production missing-asset fallbacks.", { allowedOutputTypes: ["single-image"], requiredMetadata: ["fallbackPolicy"] }),
  contract("category.terrain", "Terrain, roads, paths, banks, water, shorelines, and repeatable transitions.", { allowedOutputTypes: ["tileset", "spritesheet", "atlas", "layer-set", "single-image"], requiredMetadata: ["tileGrid", "seamPolicy", "perspective", "scale"] }),
  contract("category.structure", "Bridges, docks, fences, gates, and other modular world structures.", { allowedOutputTypes: ["spritesheet", "atlas", "layer-set", "single-image"], requiresVariants: true, requiredMetadata: ["anchor", "sockets", "geometry"] }),
  contract("category.vegetation", "Trees, crops, grass growth, shrubs, flowers, and harvestable plants.", { allowedOutputTypes: ["spritesheet", "atlas", "layer-set", "single-image"], requiresVariants: true, requiredMetadata: ["growthStates", "groundContact", "shadowPolicy"] }),
  contract("category.prop", "Reusable world props, furniture, rubbish, bins, decorations, tools, and equipment.", { allowedOutputTypes: ["single-image", "spritesheet", "atlas", "layer-set"], requiresVariants: true, requiredMetadata: ["groundContact", "geometry", "shadowPolicy"] }),
  contract("category.effect", "Environment, interaction, reward, dirt, stain, and restoration effects.", { allowedOutputTypes: ["effect-sheet", "spritesheet", "atlas", "layer-set", "single-image"], requiresAnimationContract: true, requiredMetadata: ["blendPolicy", "lifetime", "stateMapping"] }),
  contract("category.vehicle", "Vehicles and mobile equipment with direction and movement presentation.", { allowedOutputTypes: ["spritesheet", "atlas", "layer-set"], requiresVariants: true, requiresDirections: true, requiresAnimationContract: true, requiredMetadata: ["directions", "groundContact", "geometry"] }),
  contract("category.building", "House, shop, venue, and landmark exteriors with aligned condition or upgrade states.", { allowedOutputTypes: ["spritesheet", "atlas", "layer-set", "single-image"], requiresVariants: true, requiredMetadata: ["stateAlignment", "doorSockets", "geometry", "shadowPolicy"] }),
  contract("category.character", "Player and NPC rigs, appearance components, clothing, expressions, and actions.", { allowedOutputTypes: ["spritesheet", "atlas", "layer-set"], requiresVariants: true, requiresDirections: true, requiresAnimationContract: true, requiredMetadata: ["rig", "directions", "groundContact", "frameOrder"] }),
  contract("category.animal", "Wildlife, companion, pet-shop, and aquarium animal rigs.", { allowedOutputTypes: ["spritesheet", "atlas", "layer-set"], requiresVariants: true, requiresDirections: true, requiresAnimationContract: true, requiredMetadata: ["rig", "habitatPresentation", "groundContact", "frameOrder"] }),
  contract("category.ui", "Buttons, panels, dialogs, icons, cards, counters, and player feedback.", { allowedOutputTypes: ["single-image", "spritesheet", "atlas", "nine-slice", "effect-sheet"], requiresVariants: true, requiresAccessibilityMetadata: true, requiredMetadata: ["intendedDisplaySize", "safeContentInsets", "accessibility"] }),
  contract("category.interior", "Room construction, furniture, appliances, counters, stations, and interior overlays.", { allowedOutputTypes: ["tileset", "single-image", "spritesheet", "atlas", "layer-set"], requiresVariants: true, requiredMetadata: ["roomGrid", "anchor", "sockets", "geometry"] }),
  contract("category.minigame", "Minigame-specific boards, actors, tools, stations, objects, masks, and feedback.", { allowedOutputTypes: ["single-image", "tileset", "spritesheet", "atlas", "layer-set", "nine-slice", "effect-sheet"], requiresVariants: true, requiredMetadata: ["minigameId", "playfieldScale", "geometry", "stateMapping"] }),
  contract("category.audio", "Music, ambience, voice, and interaction sound effects.", { allowedOutputTypes: ["audio"], allowedFormats: AUDIO_FORMATS, requiresPerspective: false, requiresScale: false, requiresGeometry: false, requiresStates: false, requiresTransparencyContract: false, requiredMetadata: ["channels", "sampleRate", "duration", "loopPolicy", "loudnessTarget"] }),
]);

const FAMILY_PREFIX_CATEGORY = Object.freeze({
  foundation: "category.calibration",
  system: "category.system-fallback",
  terrain: "category.terrain",
  structure: "category.structure",
  vegetation: "category.vegetation",
  prop: "category.prop",
  rubbish: "category.prop",
  effects: "category.effect",
  vehicle: "category.vehicle",
  building: "category.building",
  landmark: "category.building",
  character: "category.character",
  animal: "category.animal",
  ui: "category.ui",
  interior: "category.interior",
  minigame: "category.minigame",
  audio: "category.audio",
});

export function categoryContractIdForFamily(familyId) {
  return FAMILY_PREFIX_CATEGORY[String(familyId || "").split(".")[0]] || null;
}

const closedKeys = (value, allowed, path, errors) => {
  for (const key of Object.keys(value || {})) if (!allowed.includes(key)) errors.push({
    code: "unknown-contract-field",
    message: `${path}.${key} is not part of asset-contract schema v${ASSET_CONTRACT_SCHEMA_VERSION}.`,
    path: `${path}.${key}`,
    expected: allowed,
    actual: key,
    remediation: "Remove the field or add it through a reviewed schema-version change.",
  });
};

const CATEGORY_ID_PATTERN = /^category\.[a-z0-9]+(?:-[a-z0-9]+)*$/;
const METADATA_TOKEN_PATTERN = /^[a-z][A-Za-z0-9]*$/;

export function buildPhase10FamilyContractAssignments(plan) {
  return Object.freeze((plan.assetFamilies || []).map((family) => Object.freeze({
    schemaVersion: ASSET_CONTRACT_SCHEMA_VERSION,
    familyId: family.id,
    categoryContractId: categoryContractIdForFamily(family.id),
    strategies: Object.freeze([...(family.strategies || [])]),
    scenes: Object.freeze([...(family.scenes || [])]),
    productionReady: false,
    readinessReason: "Leaf asset contracts and approved Phase 9 art-bible values are required before generation.",
  })));
}

export function validateAssetCategoryCatalog({ categoryContracts = ASSET_CATEGORY_CONTRACTS, familyAssignments = [], phase10Plan = null } = {}) {
  const errors = [];
  const categoryById = new Map();
  for (const [index, entry] of categoryContracts.entries()) {
    const path = `categoryContracts[${index}]`;
    closedKeys(entry, ["schemaVersion", "id", "description", "allowedOutputTypes", "allowedFormats", "requiresPerspective", "requiresScale", "requiresGeometry", "requiresStates", "requiresVariants", "requiresDirections", "requiresAnimationContract", "requiresTransparencyContract", "requiresAccessibilityMetadata", "requiredMetadata"], path, errors);
    if (entry.schemaVersion !== ASSET_CONTRACT_SCHEMA_VERSION) errors.push({ code: "invalid-category-contract-version", message: `${entry.id || path} must use schema v${ASSET_CONTRACT_SCHEMA_VERSION}.`, path: `${path}.schemaVersion`, expected: ASSET_CONTRACT_SCHEMA_VERSION, actual: entry.schemaVersion });
    if (!CATEGORY_ID_PATTERN.test(String(entry.id || ""))) errors.push({ code: "invalid-category-contract-id", message: `${entry.id || path} must be a stable category.* token.`, path: `${path}.id`, expected: CATEGORY_ID_PATTERN.source, actual: entry.id });
    if (!entry.id || categoryById.has(entry.id)) errors.push({ code: "duplicate-category-contract", message: `${entry.id || path} is missing or duplicated.`, path: `${path}.id`, expected: "unique category contract ID", actual: entry.id });
    else categoryById.set(entry.id, entry);
    for (const type of entry.allowedOutputTypes || []) if (!ASSET_OUTPUT_TYPES.includes(type)) errors.push({ code: "unsupported-category-output-type", message: `${entry.id} allows unknown output type ${type}.`, path: `${path}.allowedOutputTypes`, expected: ASSET_OUTPUT_TYPES, actual: type });
    for (const format of entry.allowedFormats || []) if (![...IMAGE_FORMATS, ...AUDIO_FORMATS].includes(format)) errors.push({ code: "unsupported-category-format", message: `${entry.id} allows unsupported format ${format}.`, path: `${path}.allowedFormats`, expected: [...IMAGE_FORMATS, ...AUDIO_FORMATS], actual: format });
    for (const key of ["requiresPerspective", "requiresScale", "requiresGeometry", "requiresStates", "requiresVariants", "requiresDirections", "requiresAnimationContract", "requiresTransparencyContract", "requiresAccessibilityMetadata"]) if (typeof entry[key] !== "boolean") errors.push({ code: "invalid-category-requirement", message: `${entry.id} ${key} must be boolean.`, path: `${path}.${key}`, expected: "boolean", actual: entry[key] });
    if (!Array.isArray(entry.requiredMetadata) || new Set(entry.requiredMetadata).size !== entry.requiredMetadata.length || entry.requiredMetadata.some((value) => !METADATA_TOKEN_PATTERN.test(String(value)))) errors.push({ code: "invalid-required-metadata", message: `${entry.id} required metadata must be a unique array of metadata tokens.`, path: `${path}.requiredMetadata`, expected: "unique metadata-token string array", actual: entry.requiredMetadata });
  }

  const assignmentByFamily = new Map();
  for (const [index, entry] of familyAssignments.entries()) {
    const path = `familyAssignments[${index}]`;
    closedKeys(entry, ["schemaVersion", "familyId", "categoryContractId", "strategies", "scenes", "productionReady", "readinessReason"], path, errors);
    if (entry.schemaVersion !== ASSET_CONTRACT_SCHEMA_VERSION) errors.push({ code: "invalid-family-contract-version", message: `${entry.familyId || path} must use schema v${ASSET_CONTRACT_SCHEMA_VERSION}.`, path: `${path}.schemaVersion`, expected: ASSET_CONTRACT_SCHEMA_VERSION, actual: entry.schemaVersion });
    if (!entry.familyId || assignmentByFamily.has(entry.familyId)) errors.push({ code: "duplicate-family-contract", message: `${entry.familyId || path} is missing or duplicated.`, path: `${path}.familyId`, expected: "unique Phase 10 family ID", actual: entry.familyId });
    else assignmentByFamily.set(entry.familyId, entry);
    if (!categoryById.has(entry.categoryContractId)) errors.push({ code: "missing-category-contract", message: `${entry.familyId} references unknown ${entry.categoryContractId}.`, path: `${path}.categoryContractId`, expected: [...categoryById.keys()], actual: entry.categoryContractId });
    if (typeof entry.productionReady !== "boolean" || (!entry.productionReady && !entry.readinessReason)) errors.push({ code: "invalid-family-readiness", message: `${entry.familyId} must explicitly declare readiness and the blocking reason.`, path: `${path}.productionReady`, expected: "boolean plus reason when false", actual: entry.productionReady });
  }

  if (phase10Plan) {
    const planIds = new Set((phase10Plan.assetFamilies || []).map(({ id }) => id));
    for (const id of planIds) if (!assignmentByFamily.has(id)) errors.push({ code: "missing-family-contract", message: `${id} has no machine-readable category contract assignment.`, path: "familyAssignments", expected: "one assignment", actual: "missing" });
    for (const id of assignmentByFamily.keys()) if (!planIds.has(id)) errors.push({ code: "orphan-family-contract", message: `${id} is not a Phase 10 family.`, path: `familyAssignments.${id}`, expected: "registered Phase 10 family", actual: id });
  }
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors), indexes: Object.freeze({ categoryById, assignmentByFamily }) });
}

export function renderAssetContractCatalog(plan) {
  return `${JSON.stringify({
    schemaVersion: ASSET_CONTRACT_SCHEMA_VERSION,
    id: "kindworks.asset-category-contracts",
    categoryContracts: ASSET_CATEGORY_CONTRACTS,
    familyAssignments: buildPhase10FamilyContractAssignments(plan),
  }, null, 2)}\n`;
}
