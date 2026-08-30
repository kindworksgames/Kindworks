import {
  VISUAL_ASSET_KINDS, VISUAL_ASSET_REQUIREDNESS, VISUAL_CACHE_SCOPES,
  VISUAL_DEFINITION_SCHEMA_VERSION, VISUAL_MAX_TEXTURE_DIMENSION,
  VISUAL_REGISTRY_SCHEMA_VERSION, VISUAL_RENDER_TARGETS,
} from "./contracts.js";

const ID = /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/;
const IMAGE_FORMATS = new Set(["png", "webp"]);
const AUDIO_FORMATS = new Set(["mp3", "ogg", "wav"]);
const REQUIREDNESS = new Set(Object.values(VISUAL_ASSET_REQUIREDNESS));
const CACHE_SCOPES = new Set(Object.values(VISUAL_CACHE_SCOPES));
const detail = (code, message, path, data = {}) => Object.freeze({
  code, message, path, assetId: data.assetId ?? null, manifestEntry: data.manifestEntry ?? path,
  expected: data.expected ?? null, actual: data.actual ?? null,
  affectedScenes: Object.freeze([...(data.affectedScenes || [])]),
});
const record = (list, code, message, path, data) => list.push(detail(code, message, path, data));

function indexUnique(entries, section, errors) {
  const index = new Map();
  for (const [position, entry] of (entries || []).entries()) {
    const path = `${section}[${position}]`;
    if (!entry?.id || typeof entry.id !== "string" || !ID.test(entry.id)) {
      record(errors, "invalid-id", `${section} entry requires a stable lowercase semantic id.`, path, { expected: ID.source, actual: entry?.id });
      continue;
    }
    if (index.has(entry.id)) record(errors, "duplicate-id", `Duplicate semantic id ${entry.id}.`, path, { actual: entry.id });
    else index.set(entry.id, entry);
    if (entry.schemaVersion !== VISUAL_DEFINITION_SCHEMA_VERSION) record(errors, "invalid-definition-version", `${entry.id} has an unsupported definition schema.`, path, { expected: VISUAL_DEFINITION_SCHEMA_VERSION, actual: entry.schemaVersion });
  }
  return index;
}

const scenesForAsset = (manifest, assetId) => [...new Set((manifest.scenePacks || []).filter((pack) => pack.assetIds?.includes(assetId)).map((pack) => pack.sceneId))];
const runtimeKeys = (asset) => [asset.runtime?.textureKey, asset.runtime?.nativeImageKey, asset.runtime?.audioKey, asset.runtime?.atlasKey].filter(Boolean);
function generatedKeys(asset) {
  const pattern = asset.runtime?.textureKeyPattern;
  if (!pattern) return new Set();
  return new Set((asset.technical?.directions || [""]).flatMap((direction) =>
    Array.from({ length: Number(asset.technical?.framesPerDirection || 0) }, (_, frame) =>
      pattern.replace("{direction}", direction).replace("{frame}", String(frame)))));
}

function validateLegacy(entries, targetIndex, section, errors) {
  const seen = new Set();
  for (const [position, entry] of (entries || []).entries()) {
    const path = `legacyCompatibility.${section}[${position}]`;
    if (!entry?.legacyKey) record(errors, "invalid-legacy-key", "Legacy mapping requires a key.", path);
    else if (seen.has(entry.legacyKey)) record(errors, "duplicate-legacy-key", `Duplicate legacy key ${entry.legacyKey}.`, path, { actual: entry.legacyKey });
    else seen.add(entry.legacyKey);
    if (!targetIndex.has(entry?.semanticId)) record(errors, "invalid-legacy-reference", `Legacy key ${entry?.legacyKey || "<missing>"} references an unknown semantic id.`, path, { expected: "registered semantic id", actual: entry?.semanticId });
  }
}

export function validateVisualManifestStructure(manifest) {
  const errors = [], warnings = [];
  if (manifest?.schemaVersion !== VISUAL_REGISTRY_SCHEMA_VERSION) record(errors, "invalid-registry-version", "Unsupported visual registry schema.", "schemaVersion", { expected: VISUAL_REGISTRY_SCHEMA_VERSION, actual: manifest?.schemaVersion });
  if (!Number.isInteger(manifest?.revision) || manifest.revision < 1) record(errors, "invalid-manifest-revision", "Manifest requires a positive revision.", "revision", { expected: "positive integer", actual: manifest?.revision });
  const assets = indexUnique(manifest?.assets, "assets", errors);
  const prefabs = indexUnique(manifest?.prefabs, "prefabs", errors);
  const instances = indexUnique(manifest?.sceneInstances, "sceneInstances", errors);
  const states = indexUnique(manifest?.visualStates, "visualStates", errors);
  const animations = indexUnique(manifest?.animations, "animations", errors);
  const scenePacks = indexUnique(manifest?.scenePacks, "scenePacks", errors);
  const allIds = new Map();
  for (const [section, index] of Object.entries({ assets, prefabs, instances, states, animations, scenePacks })) for (const id of index.keys()) {
    if (allIds.has(id)) record(errors, "duplicate-semantic-id", `Semantic id ${id} is shared by ${allIds.get(id)} and ${section}.`, `${section}.${id}`, { actual: id });
    else allIds.set(id, section);
  }

  const cacheOwners = new Map();
  for (const [id, asset] of assets) {
    const path = `assets.${id}`, affectedScenes = scenesForAsset(manifest, id);
    const base = { assetId: id, manifestEntry: path, affectedScenes };
    if (!Object.values(VISUAL_ASSET_KINDS).includes(asset.kind)) record(errors, "invalid-asset-kind", `${id} has an unsupported kind.`, `${path}.kind`, { ...base, expected: Object.values(VISUAL_ASSET_KINDS), actual: asset.kind });
    if (!REQUIREDNESS.has(asset.requiredness)) record(errors, "missing-requiredness", `${id} must declare requiredness.`, `${path}.requiredness`, { ...base, expected: [...REQUIREDNESS], actual: asset.requiredness });
    if (!CACHE_SCOPES.has(asset.lifecycle?.scope)) record(errors, "invalid-cache-scope", `${id} must declare a lifecycle scope.`, `${path}.lifecycle.scope`, { ...base, expected: [...CACHE_SCOPES], actual: asset.lifecycle?.scope });
    if (asset.source?.kind === "file") {
      if (!asset.source.file?.startsWith("/assets/")) record(errors, "invalid-file-path", `${id} requires an absolute public asset path.`, `${path}.source.file`, { ...base, expected: "/assets/...", actual: asset.source?.file });
      const formats = asset.kind === VISUAL_ASSET_KINDS.AUDIO ? AUDIO_FORMATS : IMAGE_FORMATS;
      if (!formats.has(asset.source.format)) record(errors, "unsupported-format", `${id} declares an unsupported format.`, `${path}.source.format`, { ...base, expected: [...formats], actual: asset.source.format });
      if (asset.kind !== VISUAL_ASSET_KINDS.AUDIO) for (const name of ["width", "height"]) {
        const maximum = asset.validation?.maximumDimension || VISUAL_MAX_TEXTURE_DIMENSION;
        if (!(asset.technical?.[name] > 0) || asset.technical[name] > maximum) record(errors, "invalid-dimensions", `${id} has an invalid ${name}.`, `${path}.technical.${name}`, { ...base, expected: `1..${maximum}`, actual: asset.technical?.[name] });
      }
      if (!/^[a-f0-9]{64}$/.test(asset.cache?.contentSha256 || "")) record(errors, "missing-content-fingerprint", `${id} requires a SHA-256 fingerprint.`, `${path}.cache.contentSha256`, { ...base, expected: "64 lowercase hex characters", actual: asset.cache?.contentSha256 });
      if (!(asset.validation?.maximumRuntimeBytes > 0)) record(errors, "missing-texture-budget", `${id} requires a runtime byte budget.`, `${path}.validation.maximumRuntimeBytes`, base);
    }
    if (asset.kind === VISUAL_ASSET_KINDS.SPRITESHEET) {
      const { width, height, frameWidth, frameHeight } = asset.technical || {};
      if (!(frameWidth > 0) || !(frameHeight > 0) || width % frameWidth || height % frameHeight) record(errors, "invalid-spritesheet-grid", `${id} frame dimensions must divide its canvas exactly.`, `${path}.technical`, { ...base, expected: `${width}x${height} divisible by frame dimensions`, actual: `${frameWidth}x${frameHeight}` });
    }
    if (asset.kind === VISUAL_ASSET_KINDS.ATLAS) {
      if (!asset.source?.atlasFile?.endsWith(".json") || !asset.runtime?.textureKey || !/^[a-f0-9]{64}$/.test(asset.source?.atlasSha256 || "") || !Array.isArray(asset.technical?.frameNames) || asset.technical.frameNames.length === 0) record(errors, "invalid-atlas-contract", `${id} requires image, exact atlas JSON fingerprint, frame names, and texture key.`, path, { ...base, expected: "atlasFile + atlasSha256 + frameNames + textureKey", actual: asset });
    }
    if (asset.source?.kind === "file" && asset.runtime?.renderTarget === VISUAL_RENDER_TARGETS.PHASER && runtimeKeys(asset).length === 0) record(errors, "missing-runtime-key", `${id} requires a runtime cache key.`, `${path}.runtime`, base);
    for (const key of runtimeKeys(asset)) {
      if (cacheOwners.has(key)) record(errors, "duplicate-cache-key", `${id} and ${cacheOwners.get(key)} share cache key ${key}.`, `${path}.runtime`, { ...base, expected: "globally unique cache key", actual: key });
      else cacheOwners.set(key, id);
    }
  }

  const animationKeys = new Map();
  for (const [id, animation] of animations) {
    const path = `animations.${id}`, asset = assets.get(animation.assetId);
    if (!asset) record(errors, "invalid-animation-asset", `${id} references an unknown asset.`, `${path}.assetId`, { expected: "registered asset", actual: animation.assetId });
    if (!animation.runtimeKey) record(errors, "missing-animation-cache-key", `${id} requires a runtime key.`, `${path}.runtimeKey`);
    else if (animationKeys.has(animation.runtimeKey)) record(errors, "duplicate-animation-cache-key", `${id} shares animation key ${animation.runtimeKey}.`, `${path}.runtimeKey`, { expected: "globally unique animation key", actual: animation.runtimeKey });
    else animationKeys.set(animation.runtimeKey, id);
    if (!Array.isArray(animation.frames) || animation.frames.length === 0) record(errors, "invalid-animation-frames", `${id} requires frames.`, `${path}.frames`);
    const generated = asset?.kind === VISUAL_ASSET_KINDS.GENERATED_TEXTURE_FAMILY ? generatedKeys(asset) : null;
    const sheetFrames = asset?.kind === VISUAL_ASSET_KINDS.SPRITESHEET ? (asset.technical.width / asset.technical.frameWidth) * (asset.technical.height / asset.technical.frameHeight) : null;
    for (const [position, frame] of (animation.frames || []).entries()) {
      if (generated && !generated.has(frame.textureKey)) record(errors, "missing-animation-frame", `${id} references missing generated frame ${frame.textureKey}.`, `${path}.frames[${position}]`, { assetId: animation.assetId, expected: [...generated], actual: frame.textureKey, affectedScenes: scenesForAsset(manifest, animation.assetId) });
      if (sheetFrames != null && (!Number.isInteger(frame.frame) || frame.frame < 0 || frame.frame >= sheetFrames)) record(errors, "missing-animation-frame", `${id} references an out-of-range sheet frame.`, `${path}.frames[${position}]`, { assetId: animation.assetId, expected: `0..${sheetFrames - 1}`, actual: frame.frame });
      if (asset?.kind === VISUAL_ASSET_KINDS.ATLAS && !asset.technical.frameNames.includes(frame.frameName ?? frame.frame)) record(errors, "missing-animation-frame", `${id} references a missing atlas frame.`, `${path}.frames[${position}]`, { assetId: animation.assetId, expected: asset.technical.frameNames, actual: frame.frameName ?? frame.frame, affectedScenes: scenesForAsset(manifest, animation.assetId) });
    }
  }

  for (const [id, prefab] of prefabs) {
    for (const layer of prefab.layers || []) if (!assets.has(layer.assetId)) record(errors, "invalid-asset-reference", `${id} layer references unknown asset ${layer.assetId}.`, `prefabs.${id}.layers`);
    if (prefab.family === "town-bin") {
      for (const field of ["variant", "scalePolicy", "groundContactAnchor", "origin", "depthPolicy", "shadowPolicy", "geometry", "sockets", "proceduralRecipe"]) if (prefab[field] == null) record(errors, "incomplete-family-prefab", `${id} is missing ${field}.`, `prefabs.${id}.${field}`);
      for (const role of ["background", "main", "foreground"]) if (!(prefab.layers || []).some((layer) => layer.role === role)) record(errors, "missing-family-layer", `${id} has no ${role} layer.`, `prefabs.${id}.layers`);
      for (const socket of ["ground", "collectorGrip", "statusBadge", "warningBadge"]) if (!prefab.sockets?.[socket]) record(errors, "missing-family-socket", `${id} has no ${socket} socket.`, `prefabs.${id}.sockets`);
    }
  }
  for (const [id, instance] of instances) {
    if (!prefabs.has(instance.prefabId)) record(errors, "invalid-prefab-reference", `${id} references unknown prefab ${instance.prefabId}.`, `sceneInstances.${id}.prefabId`);
    if (!states.has(instance.stateId)) record(errors, "invalid-state-reference", `${id} references unknown state ${instance.stateId}.`, `sceneInstances.${id}.stateId`);
  }
  for (const [id, state] of states) {
    if (!state.states?.[state.defaultState]) record(errors, "invalid-default-state", `${id} default state is not defined.`, `visualStates.${id}.defaultState`);
    for (const [name, value] of Object.entries(state.states || {})) if (!prefabs.has(value.prefabId)) record(errors, "invalid-state-prefab", `${id}.${name} references unknown prefab.`, `visualStates.${id}.states.${name}`);
  }
  for (const [id, pack] of scenePacks) {
    if (!pack.sceneId) record(errors, "missing-pack-scene", `${id} requires a scene id.`, `scenePacks.${id}.sceneId`);
    for (const assetId of pack.assetIds || []) if (!assets.has(assetId)) record(errors, "invalid-pack-asset", `${id} references unknown asset ${assetId}.`, `scenePacks.${id}.assetIds`);
    for (const animationId of pack.animationIds || []) if (!animations.has(animationId)) record(errors, "invalid-pack-animation", `${id} references unknown animation ${animationId}.`, `scenePacks.${id}.animationIds`);
  }
  validateLegacy(manifest?.legacyCompatibility?.textureKeys, assets, "textureKeys", errors);
  validateLegacy(manifest?.legacyCompatibility?.animationKeys, animations, "animationKeys", errors);
  for (const env of ["development", "production"]) if (!assets.has(manifest?.fallbacks?.[env]?.assetId)) record(errors, "invalid-fallback-reference", `${env} fallback references an unknown asset.`, `fallbacks.${env}.assetId`);
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors), warnings: Object.freeze(warnings), indexes: Object.freeze({ assets, prefabs, instances, states, animations, scenePacks }) });
}

const normalizeInspection = (value) => typeof value === "boolean" ? { exists: value } : value || { exists: false };
export async function validateVisualManifestFiles(manifest, inspectFile) {
  const structure = validateVisualManifestStructure(manifest);
  const errors = [...structure.errors], warnings = [...structure.warnings];
  for (const asset of manifest?.assets || []) {
    if (asset.source?.kind !== "file") continue;
    const base = { assetId: asset.id, manifestEntry: `assets.${asset.id}`, affectedScenes: scenesForAsset(manifest, asset.id) };
    const inspected = normalizeInspection(await inspectFile(asset.source.file, asset));
    if (!inspected.exists) {
      const optional = asset.requiredness === VISUAL_ASSET_REQUIREDNESS.OPTIONAL;
      record(optional ? warnings : errors, optional ? "missing-optional-asset-file" : "missing-asset-file", `${asset.id} references a missing ${asset.requiredness} file.`, `assets.${asset.id}.source.file`, { ...base, expected: "existing exact-case file", actual: asset.source.file });
      continue;
    }
    if (inspected.exactCase === false) record(errors, "path-case-mismatch", `${asset.id} path casing does not match the repository.`, `assets.${asset.id}.source.file`, { ...base, expected: inspected.canonicalPath || "exact filesystem case", actual: asset.source.file });
    if (inspected.format && inspected.format !== asset.source.format) record(errors, "file-format-mismatch", `${asset.id} bytes do not match its declared format.`, `assets.${asset.id}.source.format`, { ...base, expected: asset.source.format, actual: inspected.format });
    if (Object.prototype.hasOwnProperty.call(inspected, "format") && inspected.width == null && asset.kind !== VISUAL_ASSET_KINDS.AUDIO) record(errors, "corrupt-or-unsupported-file", `${asset.id} could not be decoded.`, `assets.${asset.id}.source.file`, { ...base, expected: `decodable ${asset.source.format}`, actual: inspected.format || "unknown" });
    if (inspected.width != null && (inspected.width !== asset.technical?.width || inspected.height !== asset.technical?.height)) record(errors, "dimension-mismatch", `${asset.id} dimensions do not match its contract.`, `assets.${asset.id}.technical`, { ...base, expected: `${asset.technical?.width}x${asset.technical?.height}`, actual: `${inspected.width}x${inspected.height}` });
    if (inspected.alpha != null && inspected.alpha !== asset.technical?.alpha) record(errors, "alpha-mismatch", `${asset.id} alpha does not match its contract.`, `assets.${asset.id}.technical.alpha`, { ...base, expected: asset.technical?.alpha, actual: inspected.alpha });
    if (inspected.bytes > asset.validation?.maximumRuntimeBytes) record(errors, "texture-budget-exceeded", `${asset.id} exceeds its byte budget.`, `assets.${asset.id}.validation.maximumRuntimeBytes`, { ...base, expected: `<=${asset.validation.maximumRuntimeBytes}`, actual: inspected.bytes });
    if (inspected.sha256 && inspected.sha256 !== asset.cache?.contentSha256) record(errors, "content-fingerprint-mismatch", `${asset.id} content fingerprint changed.`, `assets.${asset.id}.cache.contentSha256`, { ...base, expected: asset.cache?.contentSha256, actual: inspected.sha256 });
    if (asset.kind === VISUAL_ASSET_KINDS.ATLAS) {
      const atlas = normalizeInspection(await inspectFile(asset.source.atlasFile, { ...asset, kind: "atlas-data" }));
      if (!atlas.exists) record(errors, "missing-atlas-data", `${asset.id} is missing atlas data.`, `assets.${asset.id}.source.atlasFile`, { ...base, expected: "existing exact-case JSON", actual: asset.source.atlasFile });
      else {
        if (atlas.exactCase === false) record(errors, "path-case-mismatch", `${asset.id} atlas-data path casing does not match.`, `assets.${asset.id}.source.atlasFile`, { ...base, expected: atlas.canonicalPath, actual: asset.source.atlasFile });
        if (atlas.sha256 && atlas.sha256 !== asset.source.atlasSha256) record(errors, "content-fingerprint-mismatch", `${asset.id} atlas-data fingerprint changed.`, `assets.${asset.id}.source.atlasSha256`, { ...base, expected: asset.source.atlasSha256, actual: atlas.sha256 });
        const declared = new Set(asset.technical?.frameNames || []);
        for (const frame of atlas.frames || []) declared.delete(frame);
        if (declared.size) record(errors, "missing-atlas-frame", `${asset.id} atlas data omits declared frames.`, `assets.${asset.id}.technical.frameNames`, { ...base, expected: [...asset.technical.frameNames], actual: atlas.frames || [] });
      }
    }
  }
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors), warnings: Object.freeze(warnings), indexes: structure.indexes });
}
