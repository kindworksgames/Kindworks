import {
  VISUAL_ASSET_KINDS,
  VISUAL_ASSET_REQUIREDNESS,
  VISUAL_CACHE_SCOPES,
  VISUAL_DEFINITION_SCHEMA_VERSION,
  VISUAL_REGISTRY_SCHEMA_VERSION,
} from "./contracts.js";

const ID = /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/;
const REQUIREDNESS = new Set(Object.values(VISUAL_ASSET_REQUIREDNESS));
const CACHE_SCOPES = new Set(Object.values(VISUAL_CACHE_SCOPES));

const finding = (code, message, path, expected = null, actual = null) => Object.freeze({
  code,
  message,
  path,
  assetId: path.startsWith("assets.") ? path.split(".")[1] : null,
  manifestEntry: path,
  expected,
  actual,
  affectedScenes: Object.freeze([]),
});

function indexSection(entries, section, errors, globalIds) {
  const index = new Map();
  for (const [position, entry] of (entries || []).entries()) {
    const path = `${section}[${position}]`;
    if (!entry?.id || !ID.test(entry.id)) {
      errors.push(finding("invalid-id", `${section} entry requires a stable semantic id.`, path, ID.source, entry?.id));
      continue;
    }
    if (index.has(entry.id) || globalIds.has(entry.id)) {
      errors.push(finding("duplicate-semantic-id", `Duplicate semantic id ${entry.id}.`, path, "globally unique id", entry.id));
      continue;
    }
    if (entry.schemaVersion !== VISUAL_DEFINITION_SCHEMA_VERSION) {
      errors.push(finding("invalid-definition-version", `${entry.id} has an unsupported schema version.`, path, VISUAL_DEFINITION_SCHEMA_VERSION, entry.schemaVersion));
    }
    index.set(entry.id, entry);
    globalIds.add(entry.id);
  }
  return index;
}

/**
 * Lightweight startup guard. Deep file, case, format, dimension, atlas and
 * orphan checks run in scripts/validate-visual-registry.mjs before builds.
 */
export function validateVisualManifestRuntime(manifest) {
  const errors = [];
  const globalIds = new Set();
  if (manifest?.schemaVersion !== VISUAL_REGISTRY_SCHEMA_VERSION) {
    errors.push(finding("invalid-registry-version", "Unsupported visual registry schema.", "schemaVersion", VISUAL_REGISTRY_SCHEMA_VERSION, manifest?.schemaVersion));
  }
  const assets = indexSection(manifest?.assets, "assets", errors, globalIds);
  const prefabs = indexSection(manifest?.prefabs, "prefabs", errors, globalIds);
  const instances = indexSection(manifest?.sceneInstances, "sceneInstances", errors, globalIds);
  const states = indexSection(manifest?.visualStates, "visualStates", errors, globalIds);
  const animations = indexSection(manifest?.animations, "animations", errors, globalIds);
  const scenePacks = indexSection(manifest?.scenePacks, "scenePacks", errors, globalIds);

  const cacheKeys = new Map();
  for (const [id, asset] of assets) {
    const path = `assets.${id}`;
    if (!Object.values(VISUAL_ASSET_KINDS).includes(asset.kind)) errors.push(finding("invalid-asset-kind", `${id} has an unsupported kind.`, `${path}.kind`, Object.values(VISUAL_ASSET_KINDS), asset.kind));
    if (!REQUIREDNESS.has(asset.requiredness)) errors.push(finding("missing-requiredness", `${id} must declare requiredness.`, `${path}.requiredness`, [...REQUIREDNESS], asset.requiredness));
    if (!CACHE_SCOPES.has(asset.lifecycle?.scope)) errors.push(finding("invalid-cache-scope", `${id} must declare lifecycle scope.`, `${path}.lifecycle.scope`, [...CACHE_SCOPES], asset.lifecycle?.scope));
    for (const key of [asset.runtime?.textureKey, asset.runtime?.nativeImageKey, asset.runtime?.audioKey, asset.runtime?.atlasKey].filter(Boolean)) {
      if (cacheKeys.has(key)) errors.push(finding("duplicate-cache-key", `${id} and ${cacheKeys.get(key)} share cache key ${key}.`, `${path}.runtime`, "globally unique cache key", key));
      else cacheKeys.set(key, id);
    }
  }

  const animationKeys = new Map();
  for (const [id, animation] of animations) {
    if (!assets.has(animation.assetId)) errors.push(finding("invalid-animation-asset", `${id} references an unknown asset.`, `animations.${id}.assetId`, "registered asset", animation.assetId));
    if (!animation.runtimeKey || animationKeys.has(animation.runtimeKey)) errors.push(finding("duplicate-animation-cache-key", `${id} requires a unique animation cache key.`, `animations.${id}.runtimeKey`, "unique key", animation.runtimeKey));
    else animationKeys.set(animation.runtimeKey, id);
    if (!Array.isArray(animation.frames) || animation.frames.length === 0) errors.push(finding("invalid-animation-frames", `${id} requires animation frames.`, `animations.${id}.frames`, "non-empty array", animation.frames));
  }
  for (const [id, prefab] of prefabs) for (const layer of prefab.layers || []) {
    if (!assets.has(layer.assetId)) errors.push(finding("invalid-asset-reference", `${id} references unknown asset ${layer.assetId}.`, `prefabs.${id}.layers`, "registered asset", layer.assetId));
  }
  for (const [id, instance] of instances) {
    if (!prefabs.has(instance.prefabId)) errors.push(finding("invalid-prefab-reference", `${id} references an unknown prefab.`, `sceneInstances.${id}.prefabId`, "registered prefab", instance.prefabId));
    if (!states.has(instance.stateId)) errors.push(finding("invalid-state-reference", `${id} references an unknown state.`, `sceneInstances.${id}.stateId`, "registered state", instance.stateId));
  }
  for (const [id, state] of states) {
    if (!state.states?.[state.defaultState]) errors.push(finding("invalid-default-state", `${id} has an invalid default state.`, `visualStates.${id}.defaultState`, "defined state", state.defaultState));
    for (const [name, value] of Object.entries(state.states || {})) if (!prefabs.has(value.prefabId)) errors.push(finding("invalid-state-prefab", `${id}.${name} references an unknown prefab.`, `visualStates.${id}.states.${name}`, "registered prefab", value.prefabId));
  }
  for (const [id, pack] of scenePacks) {
    for (const assetId of pack.assetIds || []) if (!assets.has(assetId)) errors.push(finding("invalid-pack-asset", `${id} references unknown asset ${assetId}.`, `scenePacks.${id}.assetIds`, "registered asset", assetId));
    for (const animationId of pack.animationIds || []) if (!animations.has(animationId)) errors.push(finding("invalid-pack-animation", `${id} references unknown animation ${animationId}.`, `scenePacks.${id}.animationIds`, "registered animation", animationId));
  }
  for (const environment of ["development", "production"]) {
    const assetId = manifest?.fallbacks?.[environment]?.assetId;
    if (!assets.has(assetId)) errors.push(finding("invalid-fallback-reference", `${environment} fallback references an unknown asset.`, `fallbacks.${environment}.assetId`, "registered asset", assetId));
  }
  return Object.freeze({
    ok: errors.length === 0,
    errors: Object.freeze(errors),
    warnings: Object.freeze([]),
    indexes: Object.freeze({ assets, prefabs, instances, states, animations, scenePacks }),
  });
}
