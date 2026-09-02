import { validateVisualManifestStructure } from "../validateVisualManifest.js";
import {
  PHASE_8A_ASSET_IDS,
  PHASE_8A_PACKAGE_ID,
  PHASE_8A_PACKAGE_SCHEMA_VERSION,
  PHASE_8A_VERTICAL_SLICE_PACKAGE,
  phase8AGameplayGeometrySignature,
} from "./phase8aVerticalSlicePackage.js";
import { PHASE_8A_RUNTIME_DEFINITIONS } from "../generated/phase8aVerticalSliceRuntime.js";

const finding = (code, message, path, data = {}) => Object.freeze({
  code, message, path, assetId: data.assetId ?? null, expected: data.expected ?? null,
  actual: data.actual ?? null, affectedScenes: Object.freeze([...(data.affectedScenes || [])]),
  remediation: data.remediation ?? "Correct the Phase 8A contract and run phase8a:check again.",
});
const requiredAssetFields = Object.freeze([
  "semanticId", "familyId", "categoryContractId", "gameplayPurpose", "intendedScenes", "output", "camera", "masterScale",
  "anchor", "geometry", "states", "variants", "layers", "directions", "animations", "expectedFilenames", "filenameStem",
  "promptPackage", "forbiddenOutput", "validation", "scenePlacement", "prefabId", "stateMapId", "placeholder",
]);
const TOKEN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const OUTPUT_TYPES = new Set(["single-image", "tileset", "spritesheet", "atlas", "layer-set", "nine-slice", "effect-sheet", "audio"]);
const CATEGORY_IDS = new Set(["category.terrain", "category.building", "category.vegetation", "category.prop", "category.character", "category.animal", "category.ui", "category.minigame"]);
const closedKeys = (value, allowed, path, errors, asset) => {
  for (const key of Object.keys(value || {})) if (!allowed.includes(key)) errors.push(finding("unknown-contract-field", `${path}.${key} is not defined by Phase 8A schema v${PHASE_8A_PACKAGE_SCHEMA_VERSION}.`, `${path}.${key}`, { assetId: asset?.semanticId, expected: allowed, actual: key, affectedScenes: asset?.intendedScenes }));
};
const duplicates = (values = []) => values.filter((value, index) => values.indexOf(value) !== index);
const sameMembers = (left = [], right = []) => left.length === right.length && left.every((value) => right.includes(value));

function hasPositiveCanvas(output) {
  return Number.isInteger(output?.canvas?.width) && output.canvas.width > 0
    && Number.isInteger(output?.canvas?.height) && output.canvas.height > 0;
}

export function validatePhase8APackage({
  packageDefinition = PHASE_8A_VERTICAL_SLICE_PACKAGE,
  runtimeDefinitions = PHASE_8A_RUNTIME_DEFINITIONS,
  visualManifest = null,
} = {}) {
  const errors = [];
  if (packageDefinition?.schemaVersion !== PHASE_8A_PACKAGE_SCHEMA_VERSION) errors.push(finding("invalid-package-version", `Expected Phase 8A schema ${PHASE_8A_PACKAGE_SCHEMA_VERSION}.`, "schemaVersion"));
  if (packageDefinition?.id !== PHASE_8A_PACKAGE_ID) errors.push(finding("invalid-package-id", `Expected package id ${PHASE_8A_PACKAGE_ID}.`, "id"));
  if (packageDefinition?.integration?.massGenerationPermitted !== false) errors.push(finding("mass-generation-not-blocked", "Phase 8A must explicitly prohibit mass generation.", "integration.massGenerationPermitted"));

  const families = new Map();
  for (const [index, family] of (packageDefinition?.familyContracts || []).entries()) {
    if (!family?.id) errors.push(finding("missing-family-id", "Every family contract needs an id.", `familyContracts[${index}]`));
    else if (families.has(family.id)) errors.push(finding("duplicate-family-id", `Duplicate family ${family.id}.`, `familyContracts[${index}].id`));
    else families.set(family.id, family);
    for (const field of ["categoryContractId", "purpose", "projection", "scaleRule", "anchorRule", "shadowRule"]) if (!family?.[field]) errors.push(finding("incomplete-family-contract", `${family?.id || index} is missing ${field}.`, `familyContracts[${index}].${field}`));
  }

  const assets = new Map();
  for (const [index, asset] of (packageDefinition?.assets || []).entries()) {
    const path = `assets[${index}]`;
    closedKeys(asset, ["schemaVersion", "semanticId", "version", "familyId", "categoryContractId", "gameplayPurpose", "intendedScenes", "output", "camera", "masterScale", "anchor", "geometry", "sockets", "states", "variants", "layers", "directions", "animations", "artRules", "expectedFilenames", "filenameStem", "promptPackage", "forbiddenOutput", "validation", "accessibility", "dependencies", "scenePlacement", "prefabId", "stateMapId", "placeholder", "productionStatus", "provenance"], path, errors, asset);
    for (const field of requiredAssetFields) if (asset?.[field] === undefined || asset?.[field] === null || asset?.[field] === "") errors.push(finding("incomplete-asset-contract", `${asset?.semanticId || index} is missing ${field}.`, `${path}.${field}`));
    if (!asset?.semanticId) continue;
    if (asset.schemaVersion !== PHASE_8A_PACKAGE_SCHEMA_VERSION) errors.push(finding("invalid-asset-version", `${asset.semanticId} must use Phase 8A schema ${PHASE_8A_PACKAGE_SCHEMA_VERSION}.`, `${path}.schemaVersion`, { assetId: asset.semanticId, expected: PHASE_8A_PACKAGE_SCHEMA_VERSION, actual: asset.schemaVersion, affectedScenes: asset.intendedScenes }));
    if (assets.has(asset.semanticId)) errors.push(finding("duplicate-semantic-id", `Duplicate semantic asset ${asset.semanticId}.`, `${path}.semanticId`));
    else assets.set(asset.semanticId, asset);
    if (!families.has(asset.familyId)) errors.push(finding("unknown-family", `${asset.semanticId} references ${asset.familyId}.`, `${path}.familyId`));
    else if (families.get(asset.familyId).categoryContractId !== asset.categoryContractId) errors.push(finding("family-category-contract-mismatch", `${asset.semanticId} category disagrees with ${asset.familyId}.`, `${path}.categoryContractId`, { assetId: asset.semanticId, expected: families.get(asset.familyId).categoryContractId, actual: asset.categoryContractId, affectedScenes: asset.intendedScenes }));
    if (!CATEGORY_IDS.has(asset.categoryContractId)) errors.push(finding("unknown-category-contract", `${asset.semanticId} references unsupported ${asset.categoryContractId}.`, `${path}.categoryContractId`, { assetId: asset.semanticId, expected: [...CATEGORY_IDS], actual: asset.categoryContractId, affectedScenes: asset.intendedScenes }));
    if (!hasPositiveCanvas(asset.output)) errors.push(finding("invalid-canvas", `${asset.semanticId} requires positive integer canvas dimensions.`, `${path}.output.canvas`));
    closedKeys(asset.output, ["type", "format", "canvas", "alpha", "colourMode", "bitDepth", "pixelArt", "textureFiltering", "smoothing", "trimFrames", "spriteSheet", "atlas"], `${path}.output`, errors, asset);
    if (!OUTPUT_TYPES.has(asset.output?.type)) errors.push(finding("invalid-output-type", `${asset.semanticId} has unsupported output type ${asset.output?.type}.`, `${path}.output.type`, { assetId: asset.semanticId, expected: [...OUTPUT_TYPES], actual: asset.output?.type, affectedScenes: asset.intendedScenes }));
    if (asset.output?.format !== "png" || asset.output?.bitDepth !== 8 || !["RGB", "RGBA"].includes(asset.output?.colourMode) || asset.output?.alpha !== (asset.output?.colourMode === "RGBA")) errors.push(finding("invalid-output-format", `${asset.semanticId} requires an 8-bit PNG RGB/RGBA contract consistent with alpha.`, `${path}.output`, { assetId: asset.semanticId, expected: "PNG, 8-bit, RGB/RGBA consistent with alpha", actual: { format: asset.output?.format, bitDepth: asset.output?.bitDepth, colourMode: asset.output?.colourMode, alpha: asset.output?.alpha }, affectedScenes: asset.intendedScenes }));
    if (asset.output?.pixelArt !== true || asset.output?.textureFiltering !== "nearest" || asset.output?.smoothing !== false || asset.output?.trimFrames !== false || asset.validation?.requireNearestNeighbour !== true || asset.validation?.requireUntrimmedFrames !== true) errors.push(finding("invalid-pixel-export-policy", `${asset.semanticId} must use nearest-neighbour, untrimmed pixel-art output.`, `${path}.output`, { assetId: asset.semanticId, expected: "pixelArt=true, textureFiltering=nearest, smoothing=false, trimFrames=false", actual: asset.output, affectedScenes: asset.intendedScenes }));
    if (!(asset.masterScale?.nativePixelsPerLogicalUnit > 0) || !(asset.masterScale?.logicalDisplay?.width > 0) || !(asset.masterScale?.logicalDisplay?.height > 0) || !asset.masterScale?.scalePolicy) errors.push(finding("invalid-scale-contract", `${asset.semanticId} has incomplete scale metadata.`, `${path}.masterScale`, { assetId: asset.semanticId, expected: "positive native scale and logical display", actual: asset.masterScale, affectedScenes: asset.intendedScenes }));
    const normalized = asset.anchor?.normalized;
    if (!Number.isFinite(normalized?.x) || !Number.isFinite(normalized?.y) || normalized.x < 0 || normalized.x > 1 || normalized.y < 0 || normalized.y > 1) errors.push(finding("invalid-origin", `${asset.semanticId} origin must be normalized inside the canvas.`, `${path}.anchor.normalized`, { assetId: asset.semanticId, expected: "x/y in 0..1", actual: normalized, affectedScenes: asset.intendedScenes }));
    if (asset.anchor?.groundContact && (!Number.isFinite(asset.anchor.groundContact.x) || !Number.isFinite(asset.anchor.groundContact.y))) errors.push(finding("invalid-ground-contact", `${asset.semanticId} ground contact requires finite coordinates.`, `${path}.anchor.groundContact`, { assetId: asset.semanticId, expected: "finite x/y", actual: asset.anchor.groundContact, affectedScenes: asset.intendedScenes }));
    for (const channel of ["visual", "collision", "navigation", "interaction", "touch"]) if (!Object.prototype.hasOwnProperty.call(asset.geometry || {}, channel)) errors.push(finding("missing-geometry-channel", `${asset.semanticId} must explicitly declare ${channel} geometry.`, `${path}.geometry.${channel}`, { assetId: asset.semanticId, affectedScenes: asset.intendedScenes }));
    if (!(asset.geometry?.visual?.width > 0) || !(asset.geometry?.visual?.height > 0)) errors.push(finding("invalid-visual-bounds", `${asset.semanticId} visual geometry must be positive.`, `${path}.geometry.visual`, { assetId: asset.semanticId, actual: asset.geometry?.visual, affectedScenes: asset.intendedScenes }));
    const geometrySignature = phase8AGameplayGeometrySignature(asset.geometry);
    if (asset.validation?.gameplayGeometrySignature !== geometrySignature) errors.push(finding("gameplay-geometry-signature-mismatch", `${asset.semanticId} gameplay geometry differs from its protected signature.`, `${path}.validation.gameplayGeometrySignature`, { assetId: asset.semanticId, expected: geometrySignature, actual: asset.validation?.gameplayGeometrySignature, affectedScenes: asset.intendedScenes, remediation: "Restore collision, navigation, interaction, and touch geometry; visual replacement may not alter gameplay geometry." }));
    if (asset.output?.spriteSheet) {
      const sheet = asset.output.spriteSheet;
      closedKeys(sheet, ["frameWidth", "frameHeight", "columns", "rows", "padding", "spacing", "frameCount", "frameOrder", "actions", "directions"], `${path}.output.spriteSheet`, errors, asset);
      const gridWidth = sheet.padding * 2 + sheet.frameWidth * sheet.columns + sheet.spacing * Math.max(0, sheet.columns - 1);
      const gridHeight = sheet.padding * 2 + sheet.frameHeight * sheet.rows + sheet.spacing * Math.max(0, sheet.rows - 1);
      if (gridWidth !== asset.output.canvas.width || gridHeight !== asset.output.canvas.height) errors.push(finding("invalid-sheet-grid", `${asset.semanticId} sheet grid does not match its canvas.`, `${path}.output.spriteSheet`, { assetId: asset.semanticId, expected: asset.output.canvas, actual: { width: gridWidth, height: gridHeight }, affectedScenes: asset.intendedScenes }));
      if (sheet.frameCount !== sheet.columns * sheet.rows || sheet.frameOrder?.length !== sheet.frameCount) errors.push(finding("invalid-frame-count", `${asset.semanticId} frame count/order is incomplete.`, `${path}.output.spriteSheet.frameOrder`));
      if (duplicates(sheet.frameOrder).length) errors.push(finding("duplicate-frame-name", `${asset.semanticId} frame order contains duplicates.`, `${path}.output.spriteSheet.frameOrder`, { assetId: asset.semanticId, actual: duplicates(sheet.frameOrder), affectedScenes: asset.intendedScenes }));
      if (!sameMembers(sheet.directions, asset.directions)) errors.push(finding("sheet-direction-mismatch", `${asset.semanticId} sheet directions disagree with the contract.`, `${path}.output.spriteSheet.directions`, { assetId: asset.semanticId, expected: asset.directions, actual: sheet.directions, affectedScenes: asset.intendedScenes }));
    } else if (asset.output?.type === "spritesheet" || asset.output?.type === "effect-sheet") errors.push(finding("missing-sheet-contract", `${asset.semanticId} requires sprite-sheet metadata.`, `${path}.output.spriteSheet`, { assetId: asset.semanticId, affectedScenes: asset.intendedScenes }));
    if (duplicates(asset.states).length || asset.states.some((value) => !TOKEN.test(value))) errors.push(finding("invalid-states", `${asset.semanticId} states must be unique kebab-case tokens.`, `${path}.states`, { assetId: asset.semanticId, actual: asset.states, affectedScenes: asset.intendedScenes }));
    if (duplicates(asset.variants).length || asset.variants.some((value) => !TOKEN.test(value))) errors.push(finding("invalid-variants", `${asset.semanticId} variants must be unique kebab-case tokens.`, `${path}.variants`, { assetId: asset.semanticId, actual: asset.variants, affectedScenes: asset.intendedScenes }));
    if (duplicates(asset.directions).length || asset.directions.some((value) => !TOKEN.test(value))) errors.push(finding("invalid-directions", `${asset.semanticId} directions must be unique kebab-case tokens.`, `${path}.directions`, { assetId: asset.semanticId, actual: asset.directions, affectedScenes: asset.intendedScenes }));
    if (!sameMembers(asset.states, asset.validation?.requireStateNames)) errors.push(finding("missing-required-state", `${asset.semanticId} states do not match requireStateNames.`, `${path}.validation.requireStateNames`, { assetId: asset.semanticId, expected: asset.validation?.requireStateNames, actual: asset.states, affectedScenes: asset.intendedScenes }));
    if (!sameMembers(asset.directions, asset.validation?.requireDirections)) errors.push(finding("missing-required-direction", `${asset.semanticId} directions do not match requireDirections.`, `${path}.validation.requireDirections`, { assetId: asset.semanticId, expected: asset.validation?.requireDirections, actual: asset.directions, affectedScenes: asset.intendedScenes }));
    const animationIds = new Set(), frameCount = asset.output?.spriteSheet?.frameCount || 1;
    for (const [animationIndex, animation] of asset.animations.entries()) {
      if (!animation.id || animationIds.has(animation.id)) errors.push(finding("duplicate-animation-id", `${asset.semanticId} animation ID is missing or duplicated.`, `${path}.animations[${animationIndex}].id`, { assetId: asset.semanticId, actual: animation.id, affectedScenes: asset.intendedScenes }));
      animationIds.add(animation.id);
      if (!animation.action || !asset.output?.spriteSheet?.actions?.includes(animation.action)) errors.push(finding("invalid-animation-action", `${asset.semanticId}.${animation.id} action is not declared by the sheet.`, `${path}.animations[${animationIndex}].action`, { assetId: asset.semanticId, expected: asset.output?.spriteSheet?.actions, actual: animation.action, affectedScenes: asset.intendedScenes }));
      if (animation.direction && !asset.directions.includes(animation.direction)) errors.push(finding("invalid-animation-direction", `${asset.semanticId}.${animation.id} direction is not declared.`, `${path}.animations[${animationIndex}].direction`, { assetId: asset.semanticId, expected: asset.directions, actual: animation.direction, affectedScenes: asset.intendedScenes }));
      if (!Number.isFinite(animation.frameRate) || animation.frameRate <= 0 || animation.frameRate > 60) errors.push(finding("invalid-frame-rate", `${asset.semanticId}.${animation.id} frame rate must be within 1..60.`, `${path}.animations[${animationIndex}].frameRate`, { assetId: asset.semanticId, expected: "1..60", actual: animation.frameRate, affectedScenes: asset.intendedScenes }));
      if (!Number.isInteger(animation.repeat) || animation.repeat < -1) errors.push(finding("invalid-loop-policy", `${asset.semanticId}.${animation.id} repeat must be -1 or non-negative.`, `${path}.animations[${animationIndex}].repeat`, { assetId: asset.semanticId, expected: "integer >= -1", actual: animation.repeat, affectedScenes: asset.intendedScenes }));
      if (!Array.isArray(animation.frames) || animation.frames.length === 0 || animation.frames.some((frame) => !Number.isInteger(frame) || frame < 0 || frame >= frameCount)) errors.push(finding("invalid-animation-frame", `${asset.semanticId}.${animation.id} contains an invalid frame.`, `${path}.animations[${animationIndex}].frames`, { assetId: asset.semanticId, expected: `0..${frameCount - 1}`, actual: animation.frames, affectedScenes: asset.intendedScenes }));
    }
    if (!Array.isArray(asset.states) || asset.states.length === 0) errors.push(finding("missing-states", `${asset.semanticId} needs at least one state.`, `${path}.states`));
    if (!Array.isArray(asset.layers) || asset.layers.length === 0) errors.push(finding("missing-layers", `${asset.semanticId} needs at least one layer.`, `${path}.layers`));
    if (!Array.isArray(asset.scenePlacement) || asset.scenePlacement.length === 0) errors.push(finding("missing-scene-placement", `${asset.semanticId} has no scene destination.`, `${path}.scenePlacement`));
    if (!asset.promptPackage?.positivePrompt || !asset.promptPackage?.negativePrompt || !asset.promptPackage?.deliveryInstruction) errors.push(finding("incomplete-generator-prompt", `${asset.semanticId} lacks a complete generator-neutral prompt package.`, `${path}.promptPackage`));
    if (!Array.isArray(asset.forbiddenOutput) || asset.forbiddenOutput.length < 6) errors.push(finding("incomplete-forbidden-output", `${asset.semanticId} needs a complete forbidden-output list.`, `${path}.forbiddenOutput`));
    if (!Array.isArray(asset.validation?.checklist) || asset.validation.checklist.length < 7) errors.push(finding("incomplete-validation-checklist", `${asset.semanticId} needs the automated validation checklist.`, `${path}.validation.checklist`));
    if (!(asset.validation?.maximumRuntimeBytes > 0) || !asset.validation?.maximumVisibleBounds || !asset.validation?.maximumTransparentPadding) errors.push(finding("incomplete-file-constraints", `${asset.semanticId} needs byte, visible-bounds, and padding constraints.`, `${path}.validation`, { assetId: asset.semanticId, affectedScenes: asset.intendedScenes }));
    if (["top", "right", "bottom", "left"].some((edge) => !Number.isInteger(asset.validation?.maximumTransparentPadding?.[edge]) || asset.validation.maximumTransparentPadding[edge] < 0)) errors.push(finding("invalid-padding-contract", `${asset.semanticId} padding limits must be non-negative integers.`, `${path}.validation.maximumTransparentPadding`, { assetId: asset.semanticId, expected: "non-negative top/right/bottom/left", actual: asset.validation?.maximumTransparentPadding, affectedScenes: asset.intendedScenes }));
    const bounds = asset.validation?.maximumVisibleBounds;
    if (!bounds || !["x", "y", "width", "height"].every((key) => Number.isInteger(bounds[key])) || bounds.width <= 0 || bounds.height <= 0 || bounds.x < 0 || bounds.y < 0 || bounds.x + bounds.width > asset.output.canvas.width || bounds.y + bounds.height > asset.output.canvas.height) errors.push(finding("invalid-visible-bounds-contract", `${asset.semanticId} maximum visible bounds must fit its canvas.`, `${path}.validation.maximumVisibleBounds`, { assetId: asset.semanticId, expected: asset.output.canvas, actual: bounds, affectedScenes: asset.intendedScenes }));
    if (!asset.expectedFilenames?.staging?.startsWith("artwork/staging/phase-8a/") || !asset.expectedFilenames?.master?.startsWith("artwork/masters/phase-8a/") || !asset.expectedFilenames?.runtime?.startsWith("public/assets/runtime/phase-8a/")) errors.push(finding("invalid-output-path", `${asset.semanticId} must use separated staging, master, and runtime paths.`, `${path}.expectedFilenames`));
    for (const [roleName, filename] of Object.entries(asset.expectedFilenames || {})) if (!filename.split("/").at(-1)?.startsWith(`${asset.filenameStem}.`)) errors.push(finding("filename-contract-mismatch", `${asset.semanticId} ${roleName} filename must begin with ${asset.filenameStem}.`, `${path}.expectedFilenames.${roleName}`, { assetId: asset.semanticId, expected: `${asset.filenameStem}.*`, actual: filename, affectedScenes: asset.intendedScenes }));
    if (asset.categoryContractId === "category.ui" && (!asset.accessibility?.labelKey || !(asset.accessibility?.minimumRenderedSize?.width >= 44) || !(asset.accessibility?.minimumRenderedSize?.height >= 44) || !(asset.accessibility?.minimumContrastRatio >= 3))) errors.push(finding("missing-accessibility-contract", `${asset.semanticId} requires touch/readability metadata.`, `${path}.accessibility`, { assetId: asset.semanticId, actual: asset.accessibility, affectedScenes: asset.intendedScenes }));
    if (asset.productionStatus !== "specified" || asset.provenance?.generatedArtworkPresent !== false) errors.push(finding("unexpected-generation-status", `${asset.semanticId} must remain specified with no generated artwork in Phase 8A.`, `${path}.productionStatus`));
  }

  const requiredIds = Object.values(PHASE_8A_ASSET_IDS);
  for (const id of requiredIds) if (!assets.has(id)) errors.push(finding("missing-slice-asset", `Required slice asset ${id} is absent.`, "assets"));
  if (assets.size !== requiredIds.length) errors.push(finding("unexpected-slice-asset-count", `Expected exactly ${requiredIds.length} Phase 8A assets; received ${assets.size}.`, "assets"));

  const waveByAsset = new Map();
  for (const [index, wave] of (packageDefinition?.dependencyOrder || []).entries()) for (const assetId of wave.assetIds || []) {
    if (waveByAsset.has(assetId)) errors.push(finding("duplicate-production-order-entry", `${assetId} is listed in more than one wave.`, `dependencyOrder[${index}].assetIds`));
    waveByAsset.set(assetId, wave.wave);
  }
  for (const [id, asset] of assets) {
    if (!waveByAsset.has(id)) errors.push(finding("missing-production-order-entry", `${id} is not in the dependency-ordered production list.`, "dependencyOrder"));
    for (const dependency of asset.dependencies || []) {
      if (!assets.has(dependency)) errors.push(finding("missing-asset-dependency", `${id} depends on unknown ${dependency}.`, `assets.${id}.dependencies`));
      else if ((waveByAsset.get(dependency) || Infinity) > (waveByAsset.get(id) || -Infinity)) errors.push(finding("invalid-dependency-order", `${dependency} must be approved before ${id}.`, "dependencyOrder"));
    }
  }

  const runtimeAssets = new Map((runtimeDefinitions?.assets || []).map((asset) => [asset.id, asset]));
  const prefabs = new Map((runtimeDefinitions?.prefabs || []).map((prefab) => [prefab.id, prefab]));
  const states = new Map((runtimeDefinitions?.visualStates || []).map((state) => [state.id, state]));
  const instances = new Map((runtimeDefinitions?.sceneInstances || []).map((instance) => [`${instance.layoutId}:${instance.id}`, instance]));
  const animations = new Map((runtimeDefinitions?.animations || []).map((animation) => [animation.id, animation]));
  for (const [id, asset] of assets) {
    const runtimeAsset = runtimeAssets.get(id);
    if (!runtimeAsset || runtimeAsset.source?.owner !== "Phase8AVerticalSlicePlaceholder") errors.push(finding("missing-placeholder-integration", `${id} has no central-registry placeholder.`, `runtime.assets.${id}`));
    const prefab = prefabs.get(asset.prefabId);
    if (!prefab || !(prefab.layers || []).some((layer) => layer.assetId === id)) errors.push(finding("missing-prefab-integration", `${id} is not connected to ${asset.prefabId}.`, `runtime.prefabs.${asset.prefabId}`));
    const stateMap = states.get(asset.stateMapId);
    if (!stateMap) errors.push(finding("missing-state-map", `${id} has no ${asset.stateMapId}.`, `runtime.visualStates.${asset.stateMapId}`));
    else for (const state of asset.states) if (!stateMap.states?.[state]) errors.push(finding("missing-runtime-state", `${id}.${state} is not resolvable.`, `runtime.visualStates.${asset.stateMapId}.states.${state}`));
    for (const placement of asset.scenePlacement) if (!instances.has(`${placement.layoutId}:${placement.instanceId}`)) errors.push(finding("missing-runtime-placement", `${id} placement ${placement.instanceId} is not registered.`, `runtime.sceneInstances.${placement.instanceId}`));
    for (const animation of asset.animations) if (![...animations.keys()].some((idValue) => idValue === `animation.phase-8a.${id}.${animation.id}`)) errors.push(finding("missing-runtime-animation", `${id}.${animation.id} is not registered.`, "runtime.animations"));
  }

  const transition = packageDefinition?.transition;
  if (transition?.interaction?.targetId !== "lawn-house-6" || transition?.rewardContract?.visualLayerMayMutateReward !== false || transition?.afterVisualState?.growth?.currentValue !== 5 || transition?.afterVisualState?.weeds?.currentValue !== 3) errors.push(finding("invalid-protected-transition", "The lawn interaction/reward transition does not preserve the protected gameplay contract.", "transition"));

  if (visualManifest) {
    const manifestResult = validateVisualManifestStructure(visualManifest);
    if (!manifestResult.ok) errors.push(...manifestResult.errors.map((entry) => finding(`visual-manifest-${entry.code}`, entry.message, entry.path)));
    for (const id of assets.keys()) if (!manifestResult.indexes.assets.has(id)) errors.push(finding("asset-absent-from-central-manifest", `${id} is not present in KINDWORKS_VISUAL_MANIFEST.`, "visualManifest.assets"));
  }

  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors), counts: Object.freeze({ families: families.size, assets: assets.size, prefabs: prefabs.size, states: states.size, animations: animations.size, placements: instances.size, waves: packageDefinition?.dependencyOrder?.length || 0 }) });
}
