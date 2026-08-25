import { ANIMAL_DEFINITIONS, ANIMAL_STATE_SCHEMA_VERSION, COMPANION_CARE_CONFIG } from "../data/animals.js";

function whole(value, minimum = 0, maximum = Number.MAX_SAFE_INTEGER, fallback = minimum) {
  const number = Math.floor(Number(value));
  return Number.isFinite(number) ? Math.max(minimum, Math.min(maximum, number)) : fallback;
}

function nullableMinute(value) {
  return value === null || value === undefined ? null : whole(value, 0);
}

function safeName(value, fallback) {
  const name = String(value || "").replace(/[^\p{L}\p{N} '’\-]/gu, "").replace(/\s+/g, " ").trim().slice(0, 24);
  return name || fallback;
}

function freshResident(definition, day) {
  return {
    id: definition.id,
    name: definition.name,
    trust: definition.initialTrust,
    adopted: false,
    active: false,
    failedRequests: 0,
    lastRequestDay: 0,
    lastGreetAbsoluteMinute: null,
    lastTreatDay: 0,
    lastFriendlinessDecayDay: day,
    lastCompanionCareDay: 0,
    eventCount: 0,
  };
}

export function createFreshAnimalState(world) {
  const day = whole(world?.day, 1);
  return {
    schemaVersion: ANIMAL_STATE_SCHEMA_VERSION,
    activeAnimalId: null,
    lastResolvedDay: day,
    departureEvents: 0,
    residents: Object.fromEntries(ANIMAL_DEFINITIONS.map((definition) => [definition.id, freshResident(definition, day)])),
  };
}

export function normalizeAnimalState(value, world) {
  const next = createFreshAnimalState(world);
  if (!value || typeof value !== "object" || Array.isArray(value)) return next;
  next.lastResolvedDay = whole(value.lastResolvedDay, 1, whole(world?.day, 1), whole(world?.day, 1));
  next.departureEvents = whole(value.departureEvents);
  for (const definition of ANIMAL_DEFINITIONS) {
    const source = value.residents?.[definition.id];
    if (!source || typeof source !== "object") continue;
    const resident = next.residents[definition.id];
    resident.name = safeName(source.name, definition.name);
    resident.adopted = Boolean(source.adopted);
    resident.trust = whole(source.trust, resident.adopted ? COMPANION_CARE_CONFIG.releaseThreshold : 0, 100, definition.initialTrust);
    resident.failedRequests = whole(source.failedRequests, 0, 99);
    resident.lastRequestDay = whole(source.lastRequestDay, 0, whole(world?.day, 1));
    resident.lastGreetAbsoluteMinute = nullableMinute(source.lastGreetAbsoluteMinute ?? source.lastGreetAt);
    resident.lastTreatDay = whole(source.lastTreatDay, 0, whole(world?.day, 1));
    resident.lastFriendlinessDecayDay = whole(source.lastFriendlinessDecayDay, 1, whole(world?.day, 1), next.lastResolvedDay);
    resident.lastCompanionCareDay = whole(source.lastCompanionCareDay, 0, whole(world?.day, 1));
    resident.eventCount = whole(source.eventCount);
  }
  const requestedActive = typeof value.activeAnimalId === "string" ? value.activeAnimalId : null;
  const fallbackActive = ANIMAL_DEFINITIONS.find(({ id }) => value.residents?.[id]?.active)?.id || null;
  const activeId = requestedActive || fallbackActive;
  if (activeId && next.residents[activeId]?.adopted) {
    next.activeAnimalId = activeId;
    next.residents[activeId].active = true;
  }
  return next;
}

export function projectLegacyAnimals(value, world) {
  if (!value || typeof value !== "object") return createFreshAnimalState(world);
  const residents = {};
  for (const entry of Array.isArray(value.animals) ? value.animals : []) {
    if (!entry || typeof entry !== "object" || typeof entry.id !== "string") continue;
    residents[entry.id] = entry;
  }
  return normalizeAnimalState({ ...value, residents }, world);
}

export function validateAnimalState(value, world) {
  const errors = [];
  if (!value || typeof value !== "object" || Array.isArray(value)) return { ok: false, errors: ["Animal state is missing."] };
  if (value.schemaVersion !== ANIMAL_STATE_SCHEMA_VERSION) errors.push("Animal state schema version is unsupported.");
  if (!Number.isInteger(value.lastResolvedDay) || value.lastResolvedDay < 1 || value.lastResolvedDay > world.day) errors.push("Animal care resolution day is invalid.");
  if (!Number.isInteger(value.departureEvents) || value.departureEvents < 0) errors.push("Animal departure count is invalid.");
  if (value.activeAnimalId !== null && !value.residents?.[value.activeAnimalId]?.adopted) errors.push("Active companion must be adopted.");
  let activeCount = 0;
  for (const definition of ANIMAL_DEFINITIONS) {
    const resident = value.residents?.[definition.id];
    if (!resident || resident.id !== definition.id || typeof resident.name !== "string" || !resident.name.trim()) {
      errors.push(`${definition.name} animal state is invalid.`);
      continue;
    }
    if (!Number.isInteger(resident.trust) || resident.trust < 0 || resident.trust > 100) errors.push(`${definition.name} trust is invalid.`);
    if (resident.adopted && resident.trust < COMPANION_CARE_CONFIG.releaseThreshold) errors.push(`${definition.name} adopted trust is below the release threshold.`);
    if (typeof resident.adopted !== "boolean" || typeof resident.active !== "boolean") errors.push(`${definition.name} companion flags are invalid.`);
    if (resident.active) {
      activeCount += 1;
      if (!resident.adopted || value.activeAnimalId !== definition.id) errors.push(`${definition.name} active state is inconsistent.`);
    }
    for (const key of ["failedRequests", "lastRequestDay", "lastTreatDay", "lastFriendlinessDecayDay", "lastCompanionCareDay", "eventCount"]) {
      if (!Number.isInteger(resident[key]) || resident[key] < 0) errors.push(`${definition.name} ${key} is invalid.`);
    }
    if (resident.lastGreetAbsoluteMinute !== null && (!Number.isInteger(resident.lastGreetAbsoluteMinute) || resident.lastGreetAbsoluteMinute < 0)) errors.push(`${definition.name} greeting time is invalid.`);
  }
  if (activeCount > 1 || (activeCount === 0) !== (value.activeAnimalId === null)) errors.push("Only one adopted animal can actively follow the player.");
  return { ok: errors.length === 0, errors };
}
