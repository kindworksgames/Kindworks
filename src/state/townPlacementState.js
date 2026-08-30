import { ITEM_CATALOG, inventoryLimitFor } from "../data/items.js";
import {
  TOWN_PLACEMENT_LIMIT,
  TOWN_PLACEMENT_SCHEMA_VERSION,
  normalizeTownRotation,
  placementBehaviorHooks,
  validateTownPlacement,
} from "../data/townPlacement.js";

function safeInteger(value, minimum = 0, maximum = Number.MAX_SAFE_INTEGER) {
  const number = Math.floor(Number(value));
  return Number.isFinite(number) ? Math.max(minimum, Math.min(maximum, number)) : minimum;
}

function safeTimestamp(value, fallback) {
  const number = Number(value);
  if (Number.isFinite(number) && number >= 0) return number;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizePlacedObject(raw, item, { now = Date.now() } = {}) {
  const hooks = placementBehaviorHooks(item, raw);
  return {
    id: String(raw.id),
    itemId: item.id,
    type: item.placeableType || "decoration",
    x: Number(raw.x),
    y: Number(raw.y),
    rotation: normalizeTownRotation(raw.rotation),
    placedAt: safeTimestamp(raw.placedAt, now),
    placedGameMinute: safeInteger(raw.placedGameMinute),
    binCapacity: item.effect?.npcBin ? safeInteger(raw.binCapacity || item.effect.binCapacity, 1, 9999) : 0,
    binFill: item.effect?.npcBin ? safeInteger(raw.binFill, 0, safeInteger(raw.binCapacity || item.effect.binCapacity, 1, 9999)) : 0,
    binFullSince: item.effect?.npcBin && raw.binFill >= (raw.binCapacity || item.effect.binCapacity) ? safeInteger(raw.binFullSince) : 0,
    lastEmptiedDay: item.effect?.npcBin ? safeInteger(raw.lastEmptiedDay) : 0,
    collections: item.effect?.npcBin ? safeInteger(raw.collections) : 0,
    tipped: item.effect?.npcBin ? Boolean(raw.tipped) : false,
    tippedAt: item.effect?.npcBin ? safeInteger(raw.tippedAt) : 0,
    tippedByNpcId: item.effect?.npcBin && typeof raw.tippedByNpcId === "string" ? raw.tippedByNpcId : null,
    spillIds: item.effect?.npcBin && Array.isArray(raw.spillIds) ? raw.spillIds.filter((id) => typeof id === "string").slice(0, 6) : [],
    hooks,
  };
}

function serialFromId(id) {
  const match = String(id || "").match(/(\d+)$/);
  return match ? safeInteger(match[1]) : 0;
}

export function createFreshTownPlacementState() {
  return {
    schemaVersion: TOWN_PLACEMENT_SCHEMA_VERSION,
    nextSerial: 1,
    objects: [],
    importReport: { accepted: 0, returnedToInventory: {}, rejectedUnknown: 0 },
  };
}

export function sanitizeTownPlacementState(raw, { inventory = null, now = Date.now() } = {}) {
  const sourceObjects = Array.isArray(raw) ? raw : Array.isArray(raw?.objects) ? raw.objects : [];
  const accepted = [];
  const seen = new Set();
  const returnedToInventory = {};
  let rejectedUnknown = 0;
  for (const source of sourceObjects) {
    const item = ITEM_CATALOG[source?.itemId];
    const id = typeof source?.id === "string" ? source.id.trim() : "";
    const validIdentity = item?.category === "placeable" && id && !seen.has(id) && Number.isFinite(Number(source.x)) && Number.isFinite(Number(source.y));
    if (!validIdentity) {
      if (item?.category === "placeable") returnedToInventory[item.id] = (returnedToInventory[item.id] || 0) + 1;
      else rejectedUnknown += 1;
      continue;
    }
    if (accepted.length >= TOWN_PLACEMENT_LIMIT) {
      returnedToInventory[item.id] = (returnedToInventory[item.id] || 0) + 1;
      continue;
    }
    // Previously valid saved placements are grandfathered on resident walking
    // corridors. Runtime navigation detours around them, while new placements
    // are prevented from creating another obstruction.
    const placement = validateTownPlacement(item.id, source.x, source.y, { objects: accepted, allowNavigationCorridor: true });
    if (!placement.ok) {
      returnedToInventory[item.id] = (returnedToInventory[item.id] || 0) + 1;
      continue;
    }
    seen.add(id);
    accepted.push(normalizePlacedObject(source, item, { now }));
  }
  if (inventory?.placeables && typeof inventory.placeables === "object") {
    for (const [itemId, quantity] of Object.entries(returnedToInventory)) {
      const item = ITEM_CATALOG[itemId];
      inventory.placeables[itemId] = Math.min(inventoryLimitFor(item), safeInteger(inventory.placeables[itemId]) + quantity);
    }
  }
  const largestSerial = accepted.reduce((largest, object) => Math.max(largest, serialFromId(object.id)), 0);
  return {
    schemaVersion: TOWN_PLACEMENT_SCHEMA_VERSION,
    nextSerial: Math.max(largestSerial + 1, safeInteger(raw?.nextSerial, 1)),
    objects: accepted,
    importReport: { accepted: accepted.length, returnedToInventory, rejectedUnknown },
  };
}

export function projectLegacyTownPlacement(legacy, inventory, options = {}) {
  return sanitizeTownPlacementState(legacy?.economy?.placedObjects, { ...options, inventory });
}

export function normalizeTownPlacementState(raw, options = {}) {
  return sanitizeTownPlacementState(raw, options);
}

export function validateTownPlacementState(state) {
  const errors = [];
  if (!state || typeof state !== "object") return { ok: false, errors: ["Town placement state is missing."] };
  if (state.schemaVersion !== TOWN_PLACEMENT_SCHEMA_VERSION) errors.push("Town placement schema version is unsupported.");
  if (!Number.isSafeInteger(state.nextSerial) || state.nextSerial < 1) errors.push("Town placement serial is invalid.");
  if (!Array.isArray(state.objects) || state.objects.length > TOWN_PLACEMENT_LIMIT) errors.push(`Town placements must be an array of at most ${TOWN_PLACEMENT_LIMIT} objects.`);
  const seen = new Set();
  const accepted = [];
  for (const object of Array.isArray(state.objects) ? state.objects : []) {
    const item = ITEM_CATALOG[object?.itemId];
    if (!object || typeof object.id !== "string" || !object.id || seen.has(object.id)) {
      errors.push("Town placements contain a missing or duplicate object id.");
      continue;
    }
    seen.add(object.id);
    if (!item || item.category !== "placeable") {
      errors.push(`${object.id} references an unknown placeable item.`);
      continue;
    }
    if (object.type !== item.placeableType || !Number.isFinite(object.rotation) || normalizeTownRotation(object.rotation) !== object.rotation) errors.push(`${object.id} has invalid type or rotation data.`);
    const placement = validateTownPlacement(item.id, object.x, object.y, { objects: accepted, allowNavigationCorridor: true });
    if (!placement.ok) errors.push(`${object.id} is not in a valid town position (${placement.code}).`);
    const expectedHooks = placementBehaviorHooks(item, object);
    if (JSON.stringify(object.hooks) !== JSON.stringify(expectedHooks)) errors.push(`${object.id} has stale behaviour hooks.`);
    if (item.effect?.npcBin && (!Number.isInteger(object.binFill) || object.binFill < 0 || object.binFill > object.binCapacity)) errors.push(`${object.id} has invalid bin contents.`);
    if (item.effect?.npcBin && (![object.binFullSince, object.lastEmptiedDay, object.collections].every(Number.isInteger) || object.binFullSince < 0 || object.lastEmptiedDay < 0 || object.collections < 0)) errors.push(`${object.id} has invalid collection history.`);
    accepted.push(object);
  }
  if (!state.importReport || typeof state.importReport !== "object" || !state.importReport.returnedToInventory || typeof state.importReport.returnedToInventory !== "object") errors.push("Town placement import report is invalid.");
  return { ok: errors.length === 0, errors };
}
