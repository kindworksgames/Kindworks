import {
  MUNICIPAL_COLLECTION_CONFIG,
  MUNICIPAL_COLLECTION_PHASES,
  MUNICIPAL_COLLECTION_SCHEMA_VERSION,
  MUNICIPAL_DEPOT,
  municipalVehicleAllowedAt,
  nextMunicipalCollectionDay,
} from "../data/municipalCollection.js";

const PHASES = new Set(MUNICIPAL_COLLECTION_PHASES);

function number(value, minimum = 0, maximum = Number.MAX_SAFE_INTEGER, fallback = minimum) {
  const candidate = Number(value);
  return Number.isFinite(candidate) ? Math.max(minimum, Math.min(maximum, candidate)) : fallback;
}

function whole(value, minimum = 0, maximum = Number.MAX_SAFE_INTEGER, fallback = minimum) {
  return Math.floor(number(value, minimum, maximum, fallback));
}

function point(value, fallback) {
  return {
    x: number(value?.x, 0, 4200, fallback.x),
    y: number(value?.y, 0, 2800, fallback.y),
  };
}

export function createFreshMunicipalCollectionState(world = { day: 1 }) {
  return {
    schemaVersion: MUNICIPAL_COLLECTION_SCHEMA_VERSION,
    active: false,
    phase: "waiting",
    phaseTimer: 0,
    nextServiceDay: nextMunicipalCollectionDay(world?.day),
    lastCompletedDay: 0,
    collectionsCompleted: 0,
    startedDay: 0,
    startedMinute: 0,
    completedAtGameMinute: 0,
    stops: [],
    stopIndex: 0,
    binsEmptied: 0,
    totalBins: 0,
    load: 0,
    completedIdentities: [],
    drivePath: [],
    drivePathIndex: 0,
    truck: { x: MUNICIPAL_DEPOT.x, y: MUNICIPAL_DEPOT.y, headingX: 1, headingY: 0 },
    collector: { x: MUNICIPAL_DEPOT.x - 40, y: MUNICIPAL_DEPOT.y, visible: false, onTruck: true, walkPhase: 0 },
    activeBin: null,
    lastEvent: "Waiting for the weekly collection day",
  };
}

function normalizeStop(value) {
  const identity = typeof value?.identity === "string" ? value.identity.slice(0, 140) : "";
  const type = value?.type === "public" || value?.type === "placed" ? value.type : null;
  const id = typeof value?.id === "string" ? value.id.slice(0, 100) : "";
  if (!identity || !type || !id || identity !== `${type}:${id}`) return null;
  const originalX = number(value.originalX, 0, 4200, NaN);
  const originalY = number(value.originalY, 0, 2800, NaN);
  const roadX = number(value.roadX, 0, 4200, NaN);
  const roadY = number(value.roadY, 0, 2800, NaN);
  if (![originalX, originalY, roadX, roadY].every(Number.isFinite)) return null;
  return {
    identity,
    type,
    id,
    nodeId: typeof value.nodeId === "string" ? value.nodeId.slice(0, 100) : null,
    label: String(value.label || (type === "public" ? "Public bin" : "Placed bin")).slice(0, 100),
    itemId: typeof value.itemId === "string" ? value.itemId.slice(0, 100) : null,
    roadNodeId: typeof value.roadNodeId === "string" ? value.roadNodeId.slice(0, 100) : null,
    roadX,
    roadY,
    originalX,
    originalY,
    originalRotation: number(value.originalRotation, -Math.PI * 2, Math.PI * 2, 0),
    completed: Boolean(value.completed),
  };
}

function normalizeActiveBin(value, stops) {
  if (!value || typeof value !== "object") return null;
  const stop = stops.find((entry) => entry.identity === value.identity);
  if (!stop) return null;
  return {
    identity: stop.identity,
    type: stop.type,
    id: stop.id,
    itemId: stop.itemId,
    originalX: stop.originalX,
    originalY: stop.originalY,
    originalRotation: stop.originalRotation,
    x: number(value.x, 0, 4200, stop.originalX),
    y: number(value.y, 0, 2800, stop.originalY),
    rotation: number(value.rotation, -Math.PI * 2, Math.PI * 2, stop.originalRotation),
    emittedFill: whole(value.emittedFill, 0, 9999),
    emptied: Boolean(value.emptied),
  };
}

export function normalizeMunicipalCollectionState(value, world = { day: 1 }) {
  const fresh = createFreshMunicipalCollectionState(world);
  if (!value || typeof value !== "object" || Array.isArray(value)) return fresh;
  const active = Boolean(value.active);
  const stops = active && Array.isArray(value.stops) ? value.stops.map(normalizeStop).filter(Boolean).slice(0, 120) : [];
  if (active && !stops.length) return fresh;
  const rawTruck = point(value.truck, fresh.truck);
  const truck = municipalVehicleAllowedAt(rawTruck.x, rawTruck.y)
    ? { ...rawTruck, headingX: number(value.truck?.headingX, -1, 1, 1), headingY: number(value.truck?.headingY, -1, 1, 0) }
    : { ...fresh.truck };
  const collectorPoint = point(value.collector, truck);
  const drivePath = active && Array.isArray(value.drivePath)
    ? value.drivePath.map((entry) => point(entry, truck)).filter((entry) => municipalVehicleAllowedAt(entry.x, entry.y)).slice(0, 256)
    : [];
  const phase = active ? (PHASES.has(value.phase) ? value.phase : "driving") : value.phase === "complete" ? "complete" : "waiting";
  const completedIdentities = [...new Set(Array.isArray(value.completedIdentities)
    ? value.completedIdentities.filter((identity) => stops.some((stop) => stop.identity === identity))
    : [])];
  return {
    ...fresh,
    active,
    phase,
    phaseTimer: number(value.phaseTimer, 0, 60),
    nextServiceDay: Math.max(MUNICIPAL_COLLECTION_CONFIG.firstCollectionDay, whole(value.nextServiceDay, 0, Number.MAX_SAFE_INTEGER, fresh.nextServiceDay)),
    lastCompletedDay: whole(value.lastCompletedDay),
    collectionsCompleted: whole(value.collectionsCompleted),
    startedDay: whole(value.startedDay),
    startedMinute: whole(value.startedMinute, 0, 1439),
    completedAtGameMinute: whole(value.completedAtGameMinute),
    stops,
    stopIndex: active ? whole(value.stopIndex, 0, Math.max(0, stops.length - 1)) : 0,
    binsEmptied: whole(value.binsEmptied, 0, active ? stops.length : 120),
    totalBins: active ? stops.length : whole(value.totalBins),
    load: number(value.load),
    completedIdentities,
    drivePath,
    drivePathIndex: drivePath.length ? whole(value.drivePathIndex, 0, drivePath.length - 1) : 0,
    truck,
    collector: {
      ...collectorPoint,
      visible: active && value.collector?.visible !== false,
      onTruck: !active || Boolean(value.collector?.onTruck),
      walkPhase: number(value.collector?.walkPhase, 0, Number.MAX_SAFE_INTEGER),
    },
    activeBin: active ? normalizeActiveBin(value.activeBin, stops) : null,
    lastEvent: String(value.lastEvent || fresh.lastEvent).slice(0, 180),
  };
}

export function projectLegacyMunicipalCollection(legacy, world = { day: 1 }) {
  const source = legacy?.garbageCollection;
  if (!source || typeof source !== "object") return createFreshMunicipalCollectionState(world);
  return normalizeMunicipalCollectionState(source, world);
}

export function validateMunicipalCollectionState(value) {
  const errors = [];
  if (!value || typeof value !== "object" || Array.isArray(value)) return { ok: false, errors: ["Municipal collection state must be an object."] };
  if (value.schemaVersion !== MUNICIPAL_COLLECTION_SCHEMA_VERSION) errors.push("Municipal collection schema version is invalid.");
  if (typeof value.active !== "boolean" || !PHASES.has(value.phase)) errors.push("Municipal collection phase is invalid.");
  if (!Number.isInteger(value.nextServiceDay) || value.nextServiceDay < MUNICIPAL_COLLECTION_CONFIG.firstCollectionDay) errors.push("Next municipal collection day is invalid.");
  if (!Array.isArray(value.stops) || value.stops.length > 120) errors.push("Municipal collection stops are invalid.");
  const identities = new Set();
  for (const stop of Array.isArray(value.stops) ? value.stops : []) {
    if (!stop?.identity || stop.identity !== `${stop.type}:${stop.id}` || identities.has(stop.identity)) errors.push("Municipal collection contains an invalid or duplicate stop.");
    identities.add(stop?.identity);
    if (![stop?.roadX, stop?.roadY, stop?.originalX, stop?.originalY, stop?.originalRotation].every(Number.isFinite)) errors.push(`${stop?.identity || "Collection stop"} has an invalid exact transform.`);
  }
  if (value.active && (!value.stops.length || !Number.isInteger(value.stopIndex) || value.stopIndex < 0 || value.stopIndex >= value.stops.length)) errors.push("Active municipal collection has no current stop.");
  if (!value.active && value.activeBin !== null) errors.push("Inactive municipal collection cannot retain a lifted bin.");
  if (!value.truck || !Number.isFinite(value.truck.x) || !Number.isFinite(value.truck.y) || !municipalVehicleAllowedAt(value.truck.x, value.truck.y)) errors.push("Municipal lorry is outside the street-and-bridge network.");
  if (!value.collector || !Number.isFinite(value.collector.x) || !Number.isFinite(value.collector.y) || typeof value.collector.visible !== "boolean") errors.push("Municipal collector state is invalid.");
  if (!Array.isArray(value.drivePath) || value.drivePath.some((entry) => !municipalVehicleAllowedAt(entry.x, entry.y))) errors.push("Municipal lorry path leaves the street-and-bridge network.");
  if (value.activeBin && !identities.has(value.activeBin.identity)) errors.push("Lifted bin is not part of the current collection route.");
  return { ok: errors.length === 0, errors };
}
