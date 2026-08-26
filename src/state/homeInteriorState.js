import { HOME_FURNITURE_LIMIT, HOME_INTERIOR_STATE_SCHEMA_VERSION, snapFurnitureRotation } from "../data/homeInteriors.js";
import { ITEM_CATALOG } from "../data/items.js";
import { HOUSES } from "../data/town.js";

function whole(value, minimum = 0, maximum = Number.MAX_SAFE_INTEGER) {
  const number = Math.floor(Number(value));
  return Number.isFinite(number) ? Math.max(minimum, Math.min(maximum, number)) : minimum;
}

export function createFreshHomeInteriorState() {
  return { schemaVersion: HOME_INTERIOR_STATE_SCHEMA_VERSION, placements: [], nextPlacementId: 1, visits: {} };
}

export function normalizeHomeInteriorState(value) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const placements = [];
  const ids = new Set();
  let aquariumSeen = false;
  let maxSerial = 0;
  for (const saved of Array.isArray(source.placements) ? source.placements : []) {
    const item = ITEM_CATALOG[saved?.itemId];
    const id = String(saved?.id || "").trim();
    if (!item?.indoorSize || item.category !== "furniture" || !id || ids.has(id) || placements.length >= HOME_FURNITURE_LIMIT || (item.aquarium && aquariumSeen)) continue;
    ids.add(id);
    if (item.aquarium) aquariumSeen = true;
    maxSerial = Math.max(maxSerial, whole(id.replace(/\D/g, "")));
    placements.push({
      id,
      itemId: item.id,
      rx: Math.max(0.04, Math.min(0.96, Number(saved.rx) || 0.5)),
      ry: Math.max(0.04, Math.min(0.96, Number(saved.ry) || 0.5)),
      rotation: snapFurnitureRotation(saved.rotation),
      placedAt: Math.max(0, Number(saved.placedAt) || 0),
    });
  }
  const visits = {};
  for (const [houseId, visit] of Object.entries(source.visits || {})) {
    if (!HOUSES.some((house) => house.id === houseId) || !visit || typeof visit !== "object") continue;
    visits[houseId] = {
      count: whole(visit.count, 0),
      inspections: whole(visit.inspections, 0),
      lastVisitedAt: Math.max(0, Number(visit.lastVisitedAt) || 0),
      lastClean: Boolean(visit.lastClean),
    };
  }
  return {
    schemaVersion: HOME_INTERIOR_STATE_SCHEMA_VERSION,
    placements,
    nextPlacementId: Math.max(whole(source.nextPlacementId, 1), whole(source.serial, 0) + 1, maxSerial + 1),
    visits,
  };
}

export function projectLegacyHomeInteriors(legacy) {
  return normalizeHomeInteriorState(legacy?.homeFurniture || legacy?.homeFurnitureState);
}

export function validateHomeInteriorState(value) {
  const errors = [];
  if (!value || typeof value !== "object" || Array.isArray(value)) return { ok: false, errors: ["Home-interior state is missing."] };
  if (value.schemaVersion !== HOME_INTERIOR_STATE_SCHEMA_VERSION) errors.push("Home-interior schema version is unsupported.");
  if (!Array.isArray(value.placements) || value.placements.length > HOME_FURNITURE_LIMIT) errors.push("Home furniture placements are invalid or exceed the 60-item limit.");
  const ids = new Set();
  let aquariumCount = 0;
  for (const placement of Array.isArray(value.placements) ? value.placements : []) {
    const item = ITEM_CATALOG[placement?.itemId];
    if (!item?.indoorSize || item.category !== "furniture") errors.push(`${placement?.id || "Furniture"} uses an unknown furniture product.`);
    if (!placement?.id || ids.has(placement.id)) errors.push("Home furniture placement IDs must be unique.");
    ids.add(placement?.id);
    if (item?.aquarium) aquariumCount += 1;
    if (!Number.isFinite(placement?.rx) || placement.rx < 0.04 || placement.rx > 0.96 || !Number.isFinite(placement?.ry) || placement.ry < 0.04 || placement.ry > 0.96) errors.push(`${placement?.id || "Furniture"} has an invalid position.`);
    if (snapFurnitureRotation(placement?.rotation) !== placement?.rotation) errors.push(`${placement?.id || "Furniture"} has an invalid rotation.`);
    if (!Number.isFinite(placement?.placedAt) || placement.placedAt < 0) errors.push(`${placement?.id || "Furniture"} has an invalid placement time.`);
  }
  if (aquariumCount > 1) errors.push("Only one ornamental fish tank may be placed.");
  if (!Number.isSafeInteger(value.nextPlacementId) || value.nextPlacementId < 1) errors.push("The next furniture placement ID is invalid.");
  if (!value.visits || typeof value.visits !== "object" || Array.isArray(value.visits)) errors.push("Home visit records are invalid.");
  for (const [houseId, visit] of Object.entries(value.visits || {})) {
    if (!HOUSES.some((house) => house.id === houseId) || !Number.isSafeInteger(visit?.count) || visit.count < 0 || !Number.isSafeInteger(visit?.inspections) || visit.inspections < 0 || !Number.isFinite(visit?.lastVisitedAt) || visit.lastVisitedAt < 0 || typeof visit?.lastClean !== "boolean") errors.push(`${houseId} has an invalid home visit record.`);
  }
  return { ok: errors.length === 0, errors };
}
