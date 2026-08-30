export const SCENE_LAYOUT_SCHEMA_VERSION = 2;

export const SCENE_LAYOUT_ANCHOR_MODES = Object.freeze({ CANONICAL: "canonical", SAFE_AREA: "safe-area", ZONE: "zone" });

const ANCHOR_EDGES = new Set(["top", "top-left", "top-right", "left", "right", "bottom", "bottom-left", "bottom-right", "center"]);
const ROOT_FIELDS = new Set(["schemaVersion", "id", "sceneId", "revision", "layoutKind", "canonicalSize", "scaleSystem", "grid", "prefabs", "instances", "zones", "sockets", "entrances", "collisionReferences", "navigationReferences", "interactionReferences", "safeAreas", "surfaces", "depthPolicies", "responsiveRules", "presentation", "rig"]);
const PREFAB_FIELDS = new Set(["id", "renderer", "registryPrefabId", "owner", "description"]);
const INSTANCE_FIELDS = new Set(["id", "prefabId", "required", "facing", "variant", "state", "variants", "states", "visual", "gameplayGeometryLocked", "gameplayGeometryRefs", "responsiveAnchor", "activeWhen", "parentId", "repeat", "debugLabel", "allowOutOfBounds", "allowVisualOverflow"]);
const VISUAL_FIELDS = new Set(["position", "offset", "origin", "scale", "rotation", "flipX", "flipY", "depth", "layerId", "depthOffset", "visible", "tint", "alpha", "animation", "bounds", "visibleBounds", "shadowPolicy"]);
const ENTRY_FIELDS = Object.freeze({
  zones: new Set(["id", "name", "kind", "geometry", "required", "allowOutOfBounds", "sourceOfTruth"]),
  sockets: new Set(["id", "name", "position", "zoneId", "required", "allowOutOfBounds", "responsiveAnchor"]),
  entrances: new Set(["id", "name", "socketId", "variants", "destinationSceneId", "destinationPosition"]),
  geometry: new Set(["id", "zoneId", "gameplayCritical", "locked", "geometryDigest", "sourceOfTruth", "appliesTo", "handler"]),
  safeAreas: new Set(["id", "geometry", "cssEnvironmentInsets", "minimumTouchTargetCssPixels"]),
  surfaces: new Set(["id", "selector", "required", "visualOffset", "responsiveAnchor", "migrationStatus", "debugLabel"]),
  depthPolicies: new Set(["id", "layer", "base", "yDivisor", "offset", "minimum", "maximum"]),
});

const clone = (value) => structuredClone(value);

function deepFreeze(value, seen = new WeakSet()) {
  if (!value || typeof value !== "object" || seen.has(value)) return value;
  seen.add(value);
  for (const child of Object.values(value)) deepFreeze(child, seen);
  return Object.freeze(value);
}

function shown(value) {
  if (typeof value === "undefined") return "undefined";
  if (typeof value === "function") return `[function ${value.name || "anonymous"}]`;
  try { return JSON.stringify(value); } catch { return String(value); }
}

function addError(errors, layout, code, path, message, expected, actual) {
  errors.push(Object.freeze({ code, path, message, layoutId: layout?.id || "<unknown>", sceneId: layout?.sceneId || "<unknown>", ...(expected === undefined ? {} : { expected }), ...(actual === undefined ? {} : { actual: shown(actual) }) }));
}

function unknownFields(value, allowed, path, layout, errors) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return;
  for (const key of Object.keys(value)) if (!allowed.has(key)) addError(errors, layout, "unknown-layout-field", `${path}.${key}`, `Unsupported field ${path}.${key}.`, [...allowed].sort().join(", "), key);
}

function serializable(value, path, layout, errors, seen = new WeakSet()) {
  if (["function", "symbol", "bigint", "undefined"].includes(typeof value)) return addError(errors, layout, "non-serializable-layout-value", path, `${path} must contain deterministic JSON data.`, "JSON-compatible value", value);
  if (typeof value === "number" && !Number.isFinite(value)) return addError(errors, layout, "non-finite-layout-number", path, `${path} must be finite.`, "finite number", value);
  if (!value || typeof value !== "object") return;
  if (seen.has(value)) return addError(errors, layout, "cyclic-layout-data", path, `${path} contains a cycle.`, "acyclic data", value);
  seen.add(value);
  if (!Array.isArray(value) && ![Object.prototype, null].includes(Object.getPrototypeOf(value))) addError(errors, layout, "non-plain-layout-object", path, `${path} must use plain objects.`, "plain object", value?.constructor?.name);
  for (const [key, child] of Object.entries(value)) serializable(child, `${path}.${key}`, layout, errors, seen);
  seen.delete(value);
}

function indexEntries(entries, section, errors, allIds, layout) {
  const index = new Map();
  if (entries !== undefined && !Array.isArray(entries)) {
    addError(errors, layout, "invalid-layout-section", section, `${section} must be an array.`, "array", entries);
    return index;
  }
  for (const [position, entry] of (entries || []).entries()) {
    const path = `${section}[${position}].id`;
    if (typeof entry?.id !== "string" || !entry.id) { addError(errors, layout, "invalid-layout-id", path, `${section} entry requires a stable id.`, "non-empty string", entry?.id); continue; }
    if (index.has(entry.id)) addError(errors, layout, "duplicate-layout-id", path, `Duplicate ${section} id ${entry.id}.`, "unique id", entry.id);
    else index.set(entry.id, entry);
    if (allIds.has(entry.id)) addError(errors, layout, "duplicate-stable-id", path, `${entry.id} is shared by ${allIds.get(entry.id)} and ${section}.`, "unique id across layout", entry.id);
    else allIds.set(entry.id, section);
  }
  return index;
}

const finitePoint = (value) => Number.isFinite(value?.x) && Number.isFinite(value?.y);
const normalizedPoint = (value) => finitePoint(value) && value.x >= 0 && value.x <= 1 && value.y >= 0 && value.y <= 1;
const positiveSize = (value) => Number.isFinite(value?.width) && value.width > 0 && Number.isFinite(value?.height) && value.height > 0;
const finiteRect = (value) => finitePoint(value) && positiveSize(value);
const pointInside = (value, size) => finitePoint(value) && value.x >= 0 && value.x <= size.width && value.y >= 0 && value.y <= size.height;
const rectInside = (value, size) => finiteRect(value) && value.x >= 0 && value.y >= 0 && value.x + value.width <= size.width && value.y + value.height <= size.height;

function stableValue(value) {
  if (Array.isArray(value)) return `[${value.map(stableValue).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableValue(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}

export function sceneLayoutGeometryDigest(value) {
  let hash = 0x811c9dc5;
  for (const character of stableValue(value)) { hash ^= character.charCodeAt(0); hash = Math.imul(hash, 0x01000193) >>> 0; }
  return `fnv1a32:${hash.toString(16).padStart(8, "0")}`;
}

function validateAnchor(anchor, path, layout, errors, indexes) {
  if (!anchor || !Object.values(SCENE_LAYOUT_ANCHOR_MODES).includes(anchor.mode)) return addError(errors, layout, "invalid-responsive-anchor", path, `${path} requires a supported responsive anchor.`, Object.values(SCENE_LAYOUT_ANCHOR_MODES).join(" | "), anchor?.mode);
  unknownFields(anchor, new Set(["mode", "zoneId", "safeAreaId", "edge", "offset"]), path, layout, errors);
  if (anchor.mode === SCENE_LAYOUT_ANCHOR_MODES.ZONE && !indexes.zones.has(anchor.zoneId)) addError(errors, layout, "invalid-anchor-zone", `${path}.zoneId`, `${path} references unknown zone ${anchor.zoneId}.`, "known zone id", anchor.zoneId);
  if (anchor.mode === SCENE_LAYOUT_ANCHOR_MODES.SAFE_AREA) {
    if (!indexes.safeAreas.has(anchor.safeAreaId)) addError(errors, layout, "invalid-anchor-safe-area", `${path}.safeAreaId`, `${path} references unknown safe area ${anchor.safeAreaId}.`, "known safe-area id", anchor.safeAreaId);
    if (!ANCHOR_EDGES.has(anchor.edge)) addError(errors, layout, "invalid-safe-area-edge", `${path}.edge`, `${path} has unsupported edge ${anchor.edge}.`, [...ANCHOR_EDGES].join(" | "), anchor.edge);
  }
  if (anchor.offset !== undefined && !finitePoint(anchor.offset)) addError(errors, layout, "invalid-anchor-offset", `${path}.offset`, `${path}.offset must be finite.`, "finite point", anchor.offset);
}

function validateVisual(visual, path, layout, errors, canonical, options = {}) {
  if (!visual || typeof visual !== "object" || Array.isArray(visual)) return addError(errors, layout, "invalid-instance-visual", path, `${path} must be an object.`, "visual object", visual);
  unknownFields(visual, VISUAL_FIELDS, path, layout, errors);
  if (!finitePoint(visual.position)) addError(errors, layout, "invalid-instance-position", `${path}.position`, `${path}.position must be finite.`, "finite point", visual.position);
  if (visual.offset !== undefined && !finitePoint(visual.offset)) addError(errors, layout, "invalid-visual-offset", `${path}.offset`, `${path}.offset must be finite.`, "finite point", visual.offset);
  if (!normalizedPoint(visual.origin)) addError(errors, layout, "invalid-instance-origin", `${path}.origin`, `${path}.origin must be normalized.`, "x/y within 0..1", visual.origin);
  const display = finitePoint(visual.position) ? { x: visual.position.x + (visual.offset?.x || 0), y: visual.position.y + (visual.offset?.y || 0) } : null;
  if (display && options.required && !options.allowOutOfBounds && !pointInside(display, canonical)) addError(errors, layout, "required-instance-out-of-bounds", `${path}.position`, `${path} is outside the canonical viewport.`, "point inside viewport", display);
  if (visual.scale !== undefined && !((Number.isFinite(visual.scale) && visual.scale > 0) || (finitePoint(visual.scale) && visual.scale.x > 0 && visual.scale.y > 0))) addError(errors, layout, "invalid-visual-scale", `${path}.scale`, `${path}.scale must be positive.`, "positive scalar or point", visual.scale);
  if (visual.rotation !== undefined && !Number.isFinite(visual.rotation)) addError(errors, layout, "invalid-visual-rotation", `${path}.rotation`, `${path}.rotation must be finite radians.`, "finite number", visual.rotation);
  for (const key of ["flipX", "flipY", "visible"]) if (visual[key] !== undefined && typeof visual[key] !== "boolean") addError(errors, layout, `invalid-visual-${key.toLowerCase()}`, `${path}.${key}`, `${path}.${key} must be boolean.`, "boolean", visual[key]);
  if (visual.depth !== undefined && !Number.isFinite(visual.depth)) addError(errors, layout, "invalid-visual-depth", `${path}.depth`, `${path}.depth must be finite.`, "finite number", visual.depth);
  if (visual.layerId !== undefined && typeof visual.layerId !== "string") addError(errors, layout, "invalid-visual-layer", `${path}.layerId`, `${path}.layerId must be a string.`, "depth policy id", visual.layerId);
  if (visual.depth !== undefined && visual.layerId !== undefined) addError(errors, layout, "conflicting-depth-fields", path, `${path} cannot define depth and layerId together.`, "one depth source", visual);
  if (visual.depthOffset !== undefined && !Number.isFinite(visual.depthOffset)) addError(errors, layout, "invalid-depth-offset", `${path}.depthOffset`, `${path}.depthOffset must be finite.`, "finite number", visual.depthOffset);
  if (visual.alpha !== undefined && (!Number.isFinite(visual.alpha) || visual.alpha < 0 || visual.alpha > 1)) addError(errors, layout, "invalid-visual-alpha", `${path}.alpha`, `${path}.alpha must be 0..1.`, "0..1", visual.alpha);
  if (visual.tint !== undefined && (!Number.isInteger(visual.tint) || visual.tint < 0 || visual.tint > 0xffffff)) addError(errors, layout, "invalid-visual-tint", `${path}.tint`, `${path}.tint must be a 24-bit integer.`, "0..16777215", visual.tint);
  if (visual.animation !== undefined && visual.animation !== null && typeof visual.animation !== "string") addError(errors, layout, "invalid-visual-animation", `${path}.animation`, `${path}.animation must be a string or null.`, "string|null", visual.animation);
  for (const key of ["bounds", "visibleBounds"]) if (visual[key] !== undefined && !positiveSize(visual[key])) addError(errors, layout, `invalid-visual-${key.toLowerCase()}`, `${path}.${key}`, `${path}.${key} requires positive dimensions.`, "positive size", visual[key]);
  const bounds = visual.visibleBounds || visual.bounds;
  if (options.required && !options.allowVisualOverflow && display && normalizedPoint(visual.origin) && positiveSize(bounds)) {
    const scale = typeof visual.scale === "number" ? { x: visual.scale, y: visual.scale } : (visual.scale || { x: 1, y: 1 });
    const actual = { x: display.x - bounds.width * scale.x * visual.origin.x, y: display.y - bounds.height * scale.y * visual.origin.y, width: bounds.width * scale.x, height: bounds.height * scale.y };
    if (!rectInside(actual, canonical)) addError(errors, layout, "required-visual-bounds-out-of-bounds", path, `${path} visible bounds exceed the canonical viewport.`, "bounds inside viewport", actual);
  }
}

function validateCondition(condition, path, layout, errors) {
  if (condition === undefined) return;
  unknownFields(condition, new Set(["all", "any"]), path, layout, errors);
  const group = condition?.all || condition?.any;
  if (!Array.isArray(group) || !group.length) return addError(errors, layout, "invalid-layout-condition", path, `${path} requires a non-empty all or any group.`, "deterministic clause array", condition);
  for (const [index, clause] of group.entries()) {
    const clausePath = `${path}[${index}]`;
    unknownFields(clause, new Set(["field", "equals", "in"]), clausePath, layout, errors);
    if (typeof clause?.field !== "string") addError(errors, layout, "invalid-layout-condition-field", `${clausePath}.field`, `${clausePath}.field must be a string.`, "string", clause?.field);
    if (!("equals" in (clause || {})) && !Array.isArray(clause?.in)) addError(errors, layout, "invalid-layout-condition-value", clausePath, `${clausePath} needs equals or in.`, "equals or in", clause);
  }
}

function validateVariants(entries, path, layout, errors, canonical) {
  if (entries === undefined) return new Set();
  if (!Array.isArray(entries)) { addError(errors, layout, "invalid-layout-variant-collection", path, `${path} must be an array.`, "array", entries); return new Set(); }
  const ids = new Set();
  for (const [index, entry] of entries.entries()) {
    const entryPath = `${path}[${index}]`;
    unknownFields(entry, new Set(["id", "visualOverrides"]), entryPath, layout, errors);
    if (typeof entry?.id !== "string" || !entry.id) addError(errors, layout, "invalid-layout-variant-id", `${entryPath}.id`, `${entryPath} requires an id.`, "non-empty string", entry?.id);
    else if (ids.has(entry.id)) addError(errors, layout, "duplicate-layout-variant", `${entryPath}.id`, `${entry.id} is duplicated.`, "unique id", entry.id);
    else ids.add(entry.id);
    if (entry?.visualOverrides) validateVisual({ position: { x: 0, y: 0 }, origin: { x: 0, y: 0 }, ...entry.visualOverrides }, `${entryPath}.visualOverrides`, layout, errors, canonical, {});
  }
  return ids;
}

export function validateSceneLayout(layout) {
  const errors = [];
  serializable(layout, "layout", layout, errors);
  unknownFields(layout, ROOT_FIELDS, "layout", layout, errors);
  if (layout?.schemaVersion !== SCENE_LAYOUT_SCHEMA_VERSION) addError(errors, layout, "invalid-layout-version", "schemaVersion", `Expected schema ${SCENE_LAYOUT_SCHEMA_VERSION}.`, SCENE_LAYOUT_SCHEMA_VERSION, layout?.schemaVersion);
  if (typeof layout?.id !== "string" || !layout.id) addError(errors, layout, "invalid-layout-root-id", "id", "Layout requires a stable id.", "non-empty string", layout?.id);
  if (typeof layout?.sceneId !== "string" || !layout.sceneId) addError(errors, layout, "invalid-layout-scene", "sceneId", "Layout requires a sceneId.", "non-empty string", layout?.sceneId);
  if (!Number.isInteger(layout?.revision) || layout.revision < 1) addError(errors, layout, "invalid-layout-revision", "revision", "Revision must be positive.", "positive integer", layout?.revision);
  if (!positiveSize(layout?.canonicalSize)) addError(errors, layout, "invalid-canonical-size", "canonicalSize", "Canonical size must be positive.", "positive size", layout?.canonicalSize);
  const canonical = positiveSize(layout?.canonicalSize) ? layout.canonicalSize : { width: 0, height: 0 };
  const allIds = new Map();
  const indexes = Object.fromEntries(["prefabs", "instances", "zones", "sockets", "entrances", "collisionReferences", "navigationReferences", "interactionReferences", "safeAreas", "surfaces", "depthPolicies"].map((section) => [section, indexEntries(layout?.[section], section, errors, allIds, layout)]));

  for (const [id, prefab] of indexes.prefabs) {
    unknownFields(prefab, PREFAB_FIELDS, `prefabs.${id}`, layout, errors);
    if (!["registry", "legacy-procedural", "runtime"].includes(prefab.renderer)) addError(errors, layout, "invalid-layout-prefab-renderer", `prefabs.${id}.renderer`, `${id} has an unsupported renderer.`, "registry | legacy-procedural | runtime", prefab.renderer);
    if (prefab.renderer === "registry" && !prefab.registryPrefabId) addError(errors, layout, "missing-registry-prefab-reference", `prefabs.${id}.registryPrefabId`, `${id} requires registryPrefabId.`, "registry prefab id", prefab.registryPrefabId);
  }
  for (const [id, instance] of indexes.instances) {
    unknownFields(instance, INSTANCE_FIELDS, `instances.${id}`, layout, errors);
    if (!indexes.prefabs.has(instance.prefabId)) addError(errors, layout, "invalid-layout-prefab-reference", `instances.${id}.prefabId`, `${id} references unknown prefab ${instance.prefabId}.`, "known prefab id", instance.prefabId);
    validateVisual(instance.visual, `instances.${id}.visual`, layout, errors, canonical, { required: instance.required !== false, allowOutOfBounds: instance.allowOutOfBounds, allowVisualOverflow: instance.allowVisualOverflow });
    validateAnchor(instance.responsiveAnchor, `instances.${id}.responsiveAnchor`, layout, errors, indexes);
    validateCondition(instance.activeWhen, `instances.${id}.activeWhen`, layout, errors);
    const variants = validateVariants(instance.variants, `instances.${id}.variants`, layout, errors, canonical);
    const states = validateVariants(instance.states, `instances.${id}.states`, layout, errors, canonical);
    if (variants.size && !variants.has(instance.variant)) addError(errors, layout, "invalid-default-variant", `instances.${id}.variant`, `${instance.variant} is not a declared variant.`, "declared variant", instance.variant);
    if (states.size && !states.has(instance.state)) addError(errors, layout, "invalid-default-state", `instances.${id}.state`, `${instance.state} is not a declared state.`, "declared state", instance.state);
    if (instance.parentId && !indexes.instances.has(instance.parentId)) addError(errors, layout, "invalid-layout-parent", `instances.${id}.parentId`, `${id} references unknown parent ${instance.parentId}.`, "known instance id", instance.parentId);
    if (instance.repeat !== undefined) {
      unknownFields(instance.repeat, new Set(["count", "idPattern", "offset"]), `instances.${id}.repeat`, layout, errors);
      if (!Number.isInteger(instance.repeat?.count) || instance.repeat.count < 1 || instance.repeat.count > 1000) addError(errors, layout, "invalid-layout-repeat", `instances.${id}.repeat.count`, `${id} repeat count must be 1..1000.`, "integer 1..1000", instance.repeat?.count);
      if (typeof instance.repeat?.idPattern !== "string" || !instance.repeat.idPattern.includes("{index}")) addError(errors, layout, "invalid-layout-repeat-pattern", `instances.${id}.repeat.idPattern`, `${id} repeat idPattern must include {index}.`, "pattern containing {index}", instance.repeat?.idPattern);
      if (instance.repeat?.offset !== undefined && !finitePoint(instance.repeat.offset)) addError(errors, layout, "invalid-layout-repeat-offset", `instances.${id}.repeat.offset`, `${id} repeat offset must be finite.`, "finite point", instance.repeat?.offset);
    }
    for (const reference of instance.gameplayGeometryRefs || []) if (![indexes.collisionReferences, indexes.navigationReferences, indexes.interactionReferences, indexes.sockets, indexes.zones].some((index) => index.has(reference))) addError(errors, layout, "invalid-instance-geometry-reference", `instances.${id}.gameplayGeometryRefs`, `${id} references unknown geometry ${reference}.`, "known geometry id", reference);
  }
  for (const [id, instance] of indexes.instances) {
    const visited = new Set([id]); let parentId = instance.parentId;
    while (parentId) { if (visited.has(parentId)) { addError(errors, layout, "cyclic-layout-parent", `instances.${id}.parentId`, `${id} has a parent cycle.`, "acyclic parent chain", parentId); break; } visited.add(parentId); parentId = indexes.instances.get(parentId)?.parentId; }
  }
  for (const [id, zone] of indexes.zones) {
    unknownFields(zone, ENTRY_FIELDS.zones, `zones.${id}`, layout, errors);
    if (!finiteRect(zone.geometry)) addError(errors, layout, "invalid-zone-geometry", `zones.${id}.geometry`, `${id} needs a positive rectangle.`, "positive rect", zone.geometry);
    else if (zone.required !== false && !zone.allowOutOfBounds && !rectInside(zone.geometry, canonical)) addError(errors, layout, "required-zone-out-of-bounds", `zones.${id}.geometry`, `${id} exceeds the viewport.`, "rect inside viewport", zone.geometry);
  }
  for (const [id, socket] of indexes.sockets) {
    unknownFields(socket, ENTRY_FIELDS.sockets, `sockets.${id}`, layout, errors);
    if (!finitePoint(socket.position)) addError(errors, layout, "invalid-socket-position", `sockets.${id}.position`, `${id} needs a finite position.`, "finite point", socket.position);
    else if (socket.required !== false && !socket.allowOutOfBounds && !pointInside(socket.position, canonical)) addError(errors, layout, "required-socket-out-of-bounds", `sockets.${id}.position`, `${id} is outside the viewport.`, "point inside viewport", socket.position);
    if (socket.zoneId && !indexes.zones.has(socket.zoneId)) addError(errors, layout, "invalid-socket-zone", `sockets.${id}.zoneId`, `${id} references unknown zone ${socket.zoneId}.`, "known zone id", socket.zoneId);
    if (socket.responsiveAnchor) validateAnchor(socket.responsiveAnchor, `sockets.${id}.responsiveAnchor`, layout, errors, indexes);
  }
  for (const [id, entrance] of indexes.entrances) { unknownFields(entrance, ENTRY_FIELDS.entrances, `entrances.${id}`, layout, errors); if (!indexes.sockets.has(entrance.socketId)) addError(errors, layout, "invalid-entrance-socket", `entrances.${id}.socketId`, `${id} references unknown socket ${entrance.socketId}.`, "known socket id", entrance.socketId); }
  for (const section of ["collisionReferences", "navigationReferences", "interactionReferences"]) for (const [id, reference] of indexes[section]) {
    unknownFields(reference, ENTRY_FIELDS.geometry, `${section}.${id}`, layout, errors);
    const zone = indexes.zones.get(reference.zoneId);
    if (!zone) addError(errors, layout, "invalid-geometry-zone", `${section}.${id}.zoneId`, `${id} references unknown zone ${reference.zoneId}.`, "known zone id", reference.zoneId);
    if (reference.gameplayCritical) {
      if (reference.locked !== true) addError(errors, layout, "unlocked-gameplay-geometry", `${section}.${id}.locked`, `${id} must be locked.`, true, reference.locked);
      if (typeof reference.sourceOfTruth !== "string" || !reference.sourceOfTruth) addError(errors, layout, "missing-geometry-authority", `${section}.${id}.sourceOfTruth`, `${id} requires a sourceOfTruth.`, "authoritative gameplay path", reference.sourceOfTruth);
      const digest = zone ? sceneLayoutGeometryDigest(zone.geometry) : null;
      if (!reference.geometryDigest || reference.geometryDigest !== digest) addError(errors, layout, "gameplay-geometry-digest-mismatch", `${section}.${id}.geometryDigest`, `${id} does not match locked geometry.`, digest, reference.geometryDigest);
    }
  }
  for (const [id, area] of indexes.safeAreas) { unknownFields(area, ENTRY_FIELDS.safeAreas, `safeAreas.${id}`, layout, errors); if (!rectInside(area.geometry, canonical)) addError(errors, layout, "invalid-safe-area", `safeAreas.${id}.geometry`, `${id} must fit inside the viewport.`, "rect inside viewport", area.geometry); }
  for (const [id, surface] of indexes.surfaces) {
    unknownFields(surface, ENTRY_FIELDS.surfaces, `surfaces.${id}`, layout, errors);
    if (typeof surface.selector !== "string" || !surface.selector) addError(errors, layout, "invalid-layout-surface-selector", `surfaces.${id}.selector`, `${id} needs a selector.`, "non-empty CSS selector", surface.selector);
    if (surface.visualOffset !== undefined && !finitePoint(surface.visualOffset)) addError(errors, layout, "invalid-surface-offset", `surfaces.${id}.visualOffset`, `${id} offset must be finite.`, "finite point", surface.visualOffset);
    validateAnchor(surface.responsiveAnchor, `surfaces.${id}.responsiveAnchor`, layout, errors, indexes);
  }
  for (const [id, policy] of indexes.depthPolicies) {
    unknownFields(policy, ENTRY_FIELDS.depthPolicies, `depthPolicies.${id}`, layout, errors);
    if (typeof policy.layer !== "string" || !policy.layer) addError(errors, layout, "invalid-depth-policy-layer", `depthPolicies.${id}.layer`, `${id} needs a named layer.`, "non-empty string", policy.layer);
    if (!Number.isFinite(policy.base)) addError(errors, layout, "invalid-depth-policy-base", `depthPolicies.${id}.base`, `${id} base must be finite.`, "finite number", policy.base);
    if (policy.yDivisor !== undefined && (!Number.isFinite(policy.yDivisor) || policy.yDivisor <= 0)) addError(errors, layout, "invalid-depth-policy-divisor", `depthPolicies.${id}.yDivisor`, `${id} divisor must be positive.`, "positive number", policy.yDivisor);
  }
  for (const [id, instance] of indexes.instances) if (instance.visual?.layerId && !indexes.depthPolicies.has(instance.visual.layerId)) addError(errors, layout, "invalid-instance-depth-policy", `instances.${id}.visual.layerId`, `${id} references unknown policy ${instance.visual.layerId}.`, "known depth policy", instance.visual.layerId);

  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors), indexes: Object.freeze(indexes) });
}

export function formatSceneLayoutError(entry) { return `[${entry.code}] ${entry.layoutId}/${entry.sceneId} ${entry.path}: ${entry.message}${entry.expected ? ` Expected ${entry.expected}; received ${entry.actual}.` : ""}`; }

export function createSceneLayout(definition) {
  const result = validateSceneLayout(definition);
  if (!result.ok) throw new AggregateError(result.errors.map((entry) => new Error(formatSceneLayoutError(entry))), `Invalid scene layout ${definition?.id || "<unknown>"}`);
  return deepFreeze(clone(definition));
}

function required(index, id, kind, layout) { const value = index.get(id); if (!value) throw new Error(`[unknown-layout-reference] ${layout?.id || "<unknown>"}/${layout?.sceneId || "<unknown>"}: Unknown ${kind} ${id}.`); return value; }
export const getSceneLayoutInstance = (layout, id) => required(validateSceneLayout(layout).indexes.instances, id, "instance", layout);
export const getSceneLayoutZone = (layout, id) => required(validateSceneLayout(layout).indexes.zones, id, "zone", layout);
export const getSceneLayoutSocket = (layout, id) => required(validateSceneLayout(layout).indexes.sockets, id, "socket", layout);

const snap = (value, grid) => Math.round(value / grid) * grid;
const findVariant = (entries, id) => (entries || []).find((entry) => entry.id === id);

export function resolveSceneLayoutInstance(layout, instanceId, { variant, state, context = {} } = {}) {
  const instance = getSceneLayoutInstance(layout, instanceId);
  const match = (clause) => clause.in ? clause.in.includes(context[clause.field]) : context[clause.field] === clause.equals;
  const active = !instance.activeWhen || (instance.activeWhen.all ? instance.activeWhen.all.every(match) : instance.activeWhen.any.some(match));
  const variantId = variant ?? instance.variant; const stateId = state ?? instance.state;
  const variantEntry = findVariant(instance.variants, variantId); const stateEntry = findVariant(instance.states, stateId);
  if (instance.variants?.length && !variantEntry) throw new Error(`[unknown-layout-variant] ${layout.id}/${instanceId}: Unknown variant ${variantId}.`);
  if (instance.states?.length && !stateEntry) throw new Error(`[unknown-layout-state] ${layout.id}/${instanceId}: Unknown state ${stateId}.`);
  return deepFreeze({ id: instance.id, prefabId: instance.prefabId, active, variant: variantId, state: stateId, visual: { ...clone(instance.visual), ...clone(variantEntry?.visualOverrides || {}), ...clone(stateEntry?.visualOverrides || {}) }, responsiveAnchor: clone(instance.responsiveAnchor), gameplayGeometryRefs: clone(instance.gameplayGeometryRefs || []) });
}

export function moveSceneLayoutInstance(layout, instanceId, position, { gridSize = layout?.grid?.size || 1, layer = "visual" } = {}) {
  const result = validateSceneLayout(layout); if (!result.ok) return { ok: false, code: "invalid-source-layout", errors: result.errors };
  const instance = result.indexes.instances.get(instanceId); if (!instance) return { ok: false, code: "unknown-layout-instance", instanceId };
  if (layer !== "visual") return { ok: false, code: instance.gameplayGeometryLocked ? "gameplay-geometry-locked" : "unsupported-layout-layer", instanceId };
  if (!finitePoint(position)) return { ok: false, code: "invalid-visual-position", instanceId };
  const next = clone(layout); const target = next.instances.find(({ id }) => id === instanceId); target.visual.position = { x: snap(position.x, gridSize), y: snap(position.y, gridSize) };
  const validation = validateSceneLayout(next); return validation.ok ? { ok: true, code: "visual-instance-moved", layout: createSceneLayout(next), position: clone(target.visual.position) } : { ok: false, code: "invalid-layout-change", errors: validation.errors };
}

export function offsetSceneLayoutInstance(layout, instanceId, offset, { gridSize = layout?.grid?.size || 1 } = {}) {
  const result = validateSceneLayout(layout); if (!result.ok) return { ok: false, code: "invalid-source-layout", errors: result.errors };
  if (!result.indexes.instances.has(instanceId)) return { ok: false, code: "unknown-layout-instance", instanceId };
  if (!finitePoint(offset)) return { ok: false, code: "invalid-visual-offset", instanceId };
  const next = clone(layout); const target = next.instances.find(({ id }) => id === instanceId); target.visual.offset = { x: snap(offset.x, gridSize), y: snap(offset.y, gridSize) };
  const validation = validateSceneLayout(next); return validation.ok ? { ok: true, code: "visual-instance-offset", layout: createSceneLayout(next), offset: clone(target.visual.offset) } : { ok: false, code: "invalid-layout-change", errors: validation.errors };
}

export function resolveSceneLayoutDepth(layout, policyId, y, extra = 0) {
  const policy = required(validateSceneLayout(layout).indexes.depthPolicies, policyId, "depth policy", layout);
  const value = policy.base + (policy.yDivisor ? y / policy.yDivisor : 0) + (policy.offset || 0) + extra;
  return Math.max(policy.minimum ?? -Infinity, Math.min(policy.maximum ?? Infinity, value));
}

export function validateSceneLayoutCatalogue(layouts, { requiredSceneIds = [], knownRegistryPrefabIds } = {}) {
  const errors = []; const layoutIds = new Map(); const sceneIds = new Map(); const stableIds = new Map();
  for (const [index, layout] of (layouts || []).entries()) {
    const validation = validateSceneLayout(layout); errors.push(...validation.errors);
    for (const [kind, id, map] of [["layout", layout?.id, layoutIds], ["scene", layout?.sceneId, sceneIds]]) {
      if (id && map.has(id)) addError(errors, layout, `duplicate-catalogue-${kind}`, `catalogue[${index}]`, `Duplicate ${kind} id ${id}.`, "unique id", id); else if (id) map.set(id, index);
    }
    for (const section of ["prefabs", "instances", "zones", "sockets", "entrances", "surfaces", "depthPolicies"]) for (const entry of layout?.[section] || []) {
      if (stableIds.has(entry.id)) addError(errors, layout, "duplicate-catalogue-stable-id", `${section}.${entry.id}`, `${entry.id} is also declared in ${stableIds.get(entry.id)}.`, "globally unique id", entry.id); else stableIds.set(entry.id, layout.id);
    }
    if (knownRegistryPrefabIds) for (const prefab of layout?.prefabs || []) if (prefab.renderer === "registry" && !knownRegistryPrefabIds.has(prefab.registryPrefabId)) addError(errors, layout, "unknown-registry-prefab", `prefabs.${prefab.id}.registryPrefabId`, `${prefab.id} references unregistered prefab ${prefab.registryPrefabId}.`, "known registry prefab", prefab.registryPrefabId);
  }
  for (const sceneId of requiredSceneIds) if (!sceneIds.has(sceneId)) addError(errors, null, "missing-scene-layout", `catalogue.scene.${sceneId}`, `Required scene ${sceneId} has no layout.`, "scene layout", sceneId);
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors), layoutIds, sceneIds, stableIds });
}

export const sceneLayoutCatalogueDigest = (layouts) => sceneLayoutGeometryDigest((layouts || []).map((layout) => ({ id: layout.id, sceneId: layout.sceneId, revision: layout.revision, value: layout })));

export function exportSceneLayout(layout) { const result = validateSceneLayout(layout); return result.ok ? { ok: true, code: "scene-layout-exported", json: `${JSON.stringify(layout, null, 2)}\n` } : { ok: false, code: "invalid-layout-export", errors: result.errors }; }
