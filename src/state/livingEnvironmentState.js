import {
  BUSINESS_CATALOG,
  ENVIRONMENT_LIMITS,
  LAND_LITTER_ANCHORS,
  LAND_LITTER_CONFIG,
  LAND_LITTER_TYPES,
  LIVING_ENVIRONMENT_SCHEMA_VERSION,
  RIVER_GARBAGE_CONFIG,
  RIVER_GARBAGE_TYPES,
  RIVER_SECTIONS,
  hashUnit,
  seededBetween,
} from "../data/livingEnvironment.js";
import { absoluteWorldMinute } from "../data/farming.js";

function bounded(value, minimum, maximum, fallback = minimum) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(minimum, Math.min(maximum, number)) : fallback;
}

function whole(value, minimum = 0, maximum = Number.MAX_SAFE_INTEGER, fallback = minimum) {
  return Math.floor(bounded(value, minimum, maximum, fallback));
}

function landItem(anchor, now, active = false) {
  return {
    id: anchor.id,
    zone: anchor.zone,
    x: anchor.x,
    y: anchor.y,
    homeX: anchor.x,
    homeY: anchor.y,
    type: anchor.type,
    active,
    spawnedGameMinute: active ? now : 0,
    ageGameMinutes: active ? 180 + hashUnit(`restoration-age:${anchor.id}`) * 1260 : 0,
    nextMoveAt: active ? now + 35 + hashUnit(`restoration-move:${anchor.id}`) * 95 : 0,
    movedCount: 0,
    source: active ? "restoration-start" : "none",
    sourceNpcId: null,
    sourceNpcName: null,
    cleanupGraceUntil: 0,
  };
}

function initialLand(now) {
  const wanted = { street: 22, park: 8, beach: 18 };
  const used = { street: 0, park: 0, beach: 0 };
  return LAND_LITTER_ANCHORS.map((anchor) => {
    const active = used[anchor.zone] < Math.min(wanted[anchor.zone], LAND_LITTER_CONFIG.zoneCaps[anchor.zone]);
    used[anchor.zone] += active ? 1 : 0;
    return landItem(anchor, now, active);
  });
}

function riverItem(serial, sectionId, index, now) {
  const types = RIVER_GARBAGE_TYPES;
  const sectionIndex = RIVER_SECTIONS.findIndex((entry) => entry.id === sectionId);
  const status = index === 0 || (index === 2 && sectionIndex % 2 === 0) ? "stuck" : "floating";
  return {
    id: `river-trash-${String(serial).padStart(4, "0")}`,
    sectionId,
    type: types[(sectionIndex * 3 + index) % types.length],
    t: 0.14 + index * 0.2,
    offset: -55 + hashUnit(`river-offset:${sectionId}:${index}`) * 110,
    flowSpeed: seededBetween(`river-speed:${sectionId}:${index}`, RIVER_GARBAGE_CONFIG.minFlowWorldUnitsPerGameMinute, RIVER_GARBAGE_CONFIG.maxFlowWorldUnitsPerGameMinute),
    status,
    stuckReason: status === "stuck" ? "old accumulated debris" : null,
    passedTraps: [],
    source: "restoration-start",
    spawnedGameMinute: now,
    ageGameMinutes: 0,
    stuckAgeGameMinutes: 0,
    releaseAfterGameMinutes: status === "stuck" ? seededBetween(`river-release:${sectionId}:${index}`, 220, 640) : 0,
    bobPhase: hashUnit(`river-bob:${sectionId}:${index}`) * Math.PI * 2,
    jamCount: 0,
  };
}

function initialRiver(now) {
  const items = [];
  let serial = 1;
  for (const section of RIVER_SECTIONS) for (let index = 0; index < 4; index += 1) items.push(riverItem(serial++, section.id, index, now));
  return { items, nextSerial: serial };
}

export function createFreshLivingEnvironmentState(world) {
  const now = absoluteWorldMinute(world);
  const river = initialRiver(now);
  return {
    schemaVersion: LIVING_ENVIRONMENT_SCHEMA_VERSION,
    lastResolvedAbsoluteMinute: now,
    eventSerial: 1,
    land: {
      items: initialLand(now),
      nextSpawnAt: {
        street: now + seededBetween("land-spawn:street:opening", LAND_LITTER_CONFIG.spawnMin.street, LAND_LITTER_CONFIG.spawnMax.street),
        park: now + seededBetween("land-spawn:park:opening", LAND_LITTER_CONFIG.spawnMin.park, LAND_LITTER_CONFIG.spawnMax.park),
        beach: now + seededBetween("land-spawn:beach:opening", LAND_LITTER_CONFIG.spawnMin.beach, LAND_LITTER_CONFIG.spawnMax.beach),
      },
      windAngle: -0.45,
      nextWindShiftAt: now + seededBetween("wind-shift:opening", LAND_LITTER_CONFIG.windShiftMinGameMinutes, LAND_LITTER_CONFIG.windShiftMaxGameMinutes),
      nextCaretakerSweepAt: now + seededBetween("caretaker:opening", LAND_LITTER_CONFIG.caretakerSweepMinGameMinutes, LAND_LITTER_CONFIG.caretakerSweepMaxGameMinutes),
      moveEvents: 0,
      toRiverEvents: 0,
      tideOutEvents: 0,
      caretakerRemovals: 0,
      ambientSpawns: 0,
    },
    river: {
      ...river,
      nextSpawnAt: now + seededBetween("river-spawn:opening", RIVER_GARBAGE_CONFIG.autoSpawnMinGameMinutes, RIVER_GARBAGE_CONFIG.autoSpawnMaxGameMinutes),
      escapedToSea: 0,
      washedAshore: 0,
      snagEvents: river.items.filter((item) => item.status === "stuck").length,
      releaseEvents: 0,
      spawnEvents: river.items.length,
    },
    businesses: Object.fromEntries(BUSINESS_CATALOG.map((business, index) => [business.id, {
      customers: 0,
      waste: seededBetween(`restoration-business:${business.id}:${index}`, 64, 94),
      overflowEvents: 0,
      lastCustomerGameMinute: 0,
      lastOverflowGameMinute: null,
    }])),
    businessWasteEvents: 0,
    businessOverflowEvents: 0,
    calm: {
      untilGameMinute: 0,
      communitySweepEvents: 0,
      peakJobsSinceCalm: 0,
      lastStartedAtGameMinute: 0,
    },
    cleanliness: {
      score: 0,
      band: "restoration-needed",
      land: 0,
      river: 0,
      lawns: 0,
      businesses: 0,
      activeJobs: 0,
      updatedAtGameMinute: now,
    },
  };
}

function normalizeLandItem(value, anchor, now) {
  const source = value && typeof value === "object" ? value : {};
  const zone = ["street", "park", "beach"].includes(source.zone) ? source.zone : anchor.zone;
  return {
    id: anchor.id,
    zone,
    x: bounded(source.x, 0, 4200, anchor.x),
    y: bounded(source.y, 0, 2800, anchor.y),
    homeX: bounded(source.homeX, 0, 4200, anchor.x),
    homeY: bounded(source.homeY, 0, 2800, anchor.y),
    type: LAND_LITTER_TYPES.includes(source.type) ? source.type : anchor.type,
    active: Boolean(source.active),
    spawnedGameMinute: bounded(source.spawnedGameMinute, 0, now, 0),
    ageGameMinutes: bounded(source.ageGameMinutes, 0, Number.MAX_SAFE_INTEGER, 0),
    nextMoveAt: bounded(source.nextMoveAt, 0, Number.MAX_SAFE_INTEGER, 0),
    movedCount: whole(source.movedCount),
    source: String(source.source || "none").slice(0, 100),
    sourceNpcId: source.sourceNpcId ? String(source.sourceNpcId).slice(0, 50) : null,
    sourceNpcName: source.sourceNpcName ? String(source.sourceNpcName).slice(0, 80) : null,
    cleanupGraceUntil: bounded(source.cleanupGraceUntil, 0, Number.MAX_SAFE_INTEGER, 0),
  };
}

function normalizeDynamicLandItem(value, index, now) {
  const source = value && typeof value === "object" ? value : {};
  const zone = ["street", "park", "beach"].includes(source.zone) ? source.zone : "street";
  const x = bounded(source.x, 0, 4200, 100 + index * 5);
  const y = bounded(source.y, 0, 2800, 100 + index * 5);
  return {
    id: /^spill-[A-Za-z0-9_-]+$/.test(source.id || "") ? source.id : `spill-legacy-${index + 1}`,
    zone, x, y,
    homeX: bounded(source.homeX, 0, 4200, x), homeY: bounded(source.homeY, 0, 2800, y),
    type: LAND_LITTER_TYPES.includes(source.type) ? source.type : "wrapper",
    dynamicSpill: true, active: source.active !== false,
    spawnedGameMinute: bounded(source.spawnedGameMinute, 0, now, 0), ageGameMinutes: bounded(source.ageGameMinutes, 0, Number.MAX_SAFE_INTEGER, 0),
    nextMoveAt: bounded(source.nextMoveAt, 0, Number.MAX_SAFE_INTEGER, 0), movedCount: whole(source.movedCount),
    source: String(source.source || "legacy-bin-spill").slice(0, 100), sourceNpcId: source.sourceNpcId ? String(source.sourceNpcId).slice(0, 50) : null,
    sourceNpcName: source.sourceNpcName ? String(source.sourceNpcName).slice(0, 80) : null, cleanupGraceUntil: bounded(source.cleanupGraceUntil, 0, Number.MAX_SAFE_INTEGER, 0),
  };
}

function normalizeRiverItem(value, index, now) {
  const section = RIVER_SECTIONS.find((entry) => entry.id === value?.sectionId) || RIVER_SECTIONS[0];
  const status = value?.status === "stuck" ? "stuck" : "floating";
  return {
    id: /^river-trash-\d+$/.test(value?.id || "") ? value.id : `river-trash-${String(index + 1).padStart(4, "0")}`,
    sectionId: section.id,
    type: RIVER_GARBAGE_TYPES.includes(value?.type) ? value.type : RIVER_GARBAGE_TYPES[index % RIVER_GARBAGE_TYPES.length],
    t: bounded(value?.t, 0, 1, 0.2),
    offset: bounded(value?.offset, -90, 90, 0),
    flowSpeed: bounded(value?.flowSpeed, RIVER_GARBAGE_CONFIG.minFlowWorldUnitsPerGameMinute, RIVER_GARBAGE_CONFIG.maxFlowWorldUnitsPerGameMinute, 3.5),
    status,
    stuckReason: status === "stuck" ? String(value?.stuckReason || "river debris snag").slice(0, 120) : null,
    passedTraps: Array.isArray(value?.passedTraps) ? [...new Set(value.passedTraps.map(String))].slice(0, 12) : [],
    source: String(value?.source || "legacy-river").slice(0, 100),
    spawnedGameMinute: bounded(value?.spawnedGameMinute, 0, now, 0),
    ageGameMinutes: bounded(value?.ageGameMinutes, 0, Number.MAX_SAFE_INTEGER, 0),
    stuckAgeGameMinutes: bounded(value?.stuckAgeGameMinutes ?? value?.stuckGameMinutes, 0, Number.MAX_SAFE_INTEGER, 0),
    releaseAfterGameMinutes: bounded(value?.releaseAfterGameMinutes ?? value?.releaseDurationGameMinutes, 0, 5000, status === "stuck" ? 420 : 0),
    bobPhase: bounded(value?.bobPhase, 0, Math.PI * 2, 0),
    jamCount: whole(value?.jamCount, 0, 100),
  };
}

export function normalizeLivingEnvironmentState(value, world) {
  const fresh = createFreshLivingEnvironmentState(world);
  const now = absoluteWorldMinute(world);
  if (!value || typeof value !== "object" || Array.isArray(value)) return fresh;
  const next = structuredClone(fresh);
  next.lastResolvedAbsoluteMinute = whole(value.lastResolvedAbsoluteMinute, 0, now, now);
  next.eventSerial = whole(value.eventSerial, 1, Number.MAX_SAFE_INTEGER, 1);
  const landById = new Map((Array.isArray(value.land?.items) ? value.land.items : []).map((item) => [item?.id, item]));
  next.land.items = LAND_LITTER_ANCHORS.map((anchor) => normalizeLandItem(landById.get(anchor.id), anchor, now));
  const dynamic = (Array.isArray(value.land?.items) ? value.land.items : []).filter((item) => /^spill-[A-Za-z0-9_-]+$/.test(item?.id || "")).slice(0, LAND_LITTER_CONFIG.maxTotal);
  next.land.items.push(...dynamic.map((item, index) => normalizeDynamicLandItem(item, index, now)));
  for (const zone of ["street", "park", "beach"]) next.land.nextSpawnAt[zone] = bounded(value.land?.nextSpawnAt?.[zone], 0, Number.MAX_SAFE_INTEGER, fresh.land.nextSpawnAt[zone]);
  next.land.windAngle = bounded(value.land?.windAngle, -Math.PI, Math.PI, fresh.land.windAngle);
  next.land.nextWindShiftAt = bounded(value.land?.nextWindShiftAt, 0, Number.MAX_SAFE_INTEGER, fresh.land.nextWindShiftAt);
  next.land.nextCaretakerSweepAt = bounded(value.land?.nextCaretakerSweepAt, 0, Number.MAX_SAFE_INTEGER, fresh.land.nextCaretakerSweepAt);
  for (const key of ["moveEvents", "toRiverEvents", "tideOutEvents", "caretakerRemovals", "ambientSpawns"]) next.land[key] = whole(value.land?.[key]);
  const riverValues = Array.isArray(value.river?.items) ? value.river.items.slice(0, RIVER_GARBAGE_CONFIG.maxTotal) : [];
  next.river.items = riverValues.map((item, index) => normalizeRiverItem(item, index, now));
  const seen = new Set();
  next.river.items = next.river.items.filter((item) => !seen.has(item.id) && seen.add(item.id));
  const largestSerial = next.river.items.reduce((largest, item) => Math.max(largest, whole(item.id.match(/(\d+)$/)?.[1])), 0);
  next.river.nextSerial = Math.max(largestSerial + 1, whole(value.river?.nextSerial, 1));
  next.river.nextSpawnAt = bounded(value.river?.nextSpawnAt, 0, Number.MAX_SAFE_INTEGER, fresh.river.nextSpawnAt);
  for (const key of ["escapedToSea", "washedAshore", "snagEvents", "releaseEvents", "spawnEvents"]) next.river[key] = whole(value.river?.[key]);
  for (const business of BUSINESS_CATALOG) {
    const source = value.businesses?.[business.id] || {};
    next.businesses[business.id] = {
      customers: whole(source.customers),
      waste: bounded(source.waste, 0, 140, fresh.businesses[business.id].waste),
      overflowEvents: whole(source.overflowEvents),
      lastCustomerGameMinute: bounded(source.lastCustomerGameMinute, 0, Number.MAX_SAFE_INTEGER, 0),
      lastOverflowGameMinute: Number.isFinite(Number(source.lastOverflowGameMinute)) ? Math.max(0, Number(source.lastOverflowGameMinute)) : null,
    };
  }
  next.businessWasteEvents = whole(value.businessWasteEvents);
  next.businessOverflowEvents = whole(value.businessOverflowEvents);
  next.calm.untilGameMinute = bounded(value.calm?.untilGameMinute, 0, Number.MAX_SAFE_INTEGER, 0);
  next.calm.communitySweepEvents = whole(value.calm?.communitySweepEvents);
  next.calm.peakJobsSinceCalm = whole(value.calm?.peakJobsSinceCalm);
  next.calm.lastStartedAtGameMinute = bounded(value.calm?.lastStartedAtGameMinute, 0, Number.MAX_SAFE_INTEGER, 0);
  const score = bounded(value.cleanliness?.score, 0, 100, 0);
  next.cleanliness = {
    score,
    band: ["restoration-needed", "recovering", "cared-for", "calm"].includes(value.cleanliness?.band) ? value.cleanliness.band : "restoration-needed",
    land: bounded(value.cleanliness?.land, 0, 100, 0), river: bounded(value.cleanliness?.river, 0, 100, 0),
    lawns: bounded(value.cleanliness?.lawns, 0, 100, 0), businesses: bounded(value.cleanliness?.businesses, 0, 100, 0),
    activeJobs: whole(value.cleanliness?.activeJobs), updatedAtGameMinute: bounded(value.cleanliness?.updatedAtGameMinute, 0, now, now),
  };
  return next;
}

export function projectLegacyLivingEnvironment(legacy, world) {
  const fresh = createFreshLivingEnvironmentState(world);
  if (!legacy || typeof legacy !== "object") return fresh;
  const source = structuredClone(fresh);
  const litterById = new Map((Array.isArray(legacy.litter) ? legacy.litter : []).map((item) => [item?.id, item]));
  source.land.items = source.land.items.map((item) => {
    const saved = litterById.get(item.id);
    return saved ? { ...item, ...saved, active: true } : { ...item, active: false, source: "none", ageGameMinutes: 0 };
  });
  source.land.items.push(...(Array.isArray(legacy.litter) ? legacy.litter.filter((item) => /^spill-[A-Za-z0-9_-]+$/.test(item?.id || "")).map((item) => ({ ...item, active: true, dynamicSpill: true })) : []));
  const land = legacy.landRuntime || {};
  source.land.nextSpawnAt = { ...source.land.nextSpawnAt, ...(land.nextSpawnAt || {}) };
  source.land.nextWindShiftAt = land.nextWindShiftAt;
  source.land.windAngle = land.windAngle;
  source.land.nextCaretakerSweepAt = land.nextCaretakerSweepAt;
  source.land.moveEvents = land.moveEvents;
  source.land.toRiverEvents = land.toRiverEvents;
  source.land.tideOutEvents = land.tideOutEvents;
  source.land.caretakerRemovals = land.caretakerRemovals;
  source.land.ambientSpawns = land.ambientSpawns;
  if (Array.isArray(legacy.riverGarbage)) source.river.items = legacy.riverGarbage;
  const river = legacy.riverRuntime || {};
  source.river.nextSpawnAt = river.nextSpawnAtGameMinute;
  source.river.escapedToSea = river.escapedToSea;
  source.river.washedAshore = river.washedAshore;
  source.river.snagEvents = river.snagEvents;
  source.river.releaseEvents = river.releaseEvents;
  source.river.spawnEvents = river.spawnEvents;
  source.businesses = { ...source.businesses, ...(legacy.businesses || {}) };
  const calm = legacy.socialRestorationRuntime || {};
  source.calm = {
    untilGameMinute: calm.restorationCalmUntilGameMinute,
    communitySweepEvents: calm.restorationCommunitySweepEvents,
    peakJobsSinceCalm: calm.restorationPeakJobsSinceCalm,
    lastStartedAtGameMinute: calm.restorationLastCalmStartGameMinute,
  };
  return normalizeLivingEnvironmentState(source, world);
}

export function validateLivingEnvironmentState(value, world) {
  const errors = [];
  if (!value || typeof value !== "object" || Array.isArray(value)) return { ok: false, errors: ["Living environment state is missing."] };
  if (value.schemaVersion !== LIVING_ENVIRONMENT_SCHEMA_VERSION) errors.push("Living environment schema version is unsupported.");
  const now = absoluteWorldMinute(world);
  if (!Number.isInteger(value.lastResolvedAbsoluteMinute) || value.lastResolvedAbsoluteMinute < 0 || value.lastResolvedAbsoluteMinute > now) errors.push("Living environment resolution time is invalid.");
  if (!Array.isArray(value.land?.items) || value.land.items.length < LAND_LITTER_ANCHORS.length || value.land.items.length > LAND_LITTER_ANCHORS.length + LAND_LITTER_CONFIG.maxTotal) errors.push("Land litter anchors are incomplete or unbounded.");
  else {
    const ids = new Set();
    const counts = { street: 0, park: 0, beach: 0 };
    for (const item of value.land.items) {
      if (!(LAND_LITTER_ANCHORS.some((anchor) => anchor.id === item?.id) || /^spill-[A-Za-z0-9_-]+$/.test(item?.id || "")) || ids.has(item.id)) errors.push("Land litter identities are invalid or duplicated.");
      ids.add(item?.id);
      if (!LAND_LITTER_TYPES.includes(item?.type) || !["street", "park", "beach"].includes(item?.zone) || !Number.isFinite(item?.x) || !Number.isFinite(item?.y) || typeof item?.active !== "boolean") errors.push(`${item?.id || "Land litter"} is invalid.`);
      if (item?.active) counts[item.zone] += 1;
    }
    if (Object.values(counts).reduce((sum, count) => sum + count, 0) > LAND_LITTER_CONFIG.maxTotal || Object.entries(counts).some(([zone, count]) => count > LAND_LITTER_CONFIG.zoneCaps[zone])) errors.push("Land litter exceeds its bounded capacity.");
  }
  if (!Array.isArray(value.river?.items) || value.river.items.length > RIVER_GARBAGE_CONFIG.maxTotal) errors.push("River rubbish exceeds its bounded capacity.");
  else {
    const ids = new Set();
    const counts = Object.fromEntries(RIVER_SECTIONS.map((section) => [section.id, 0]));
    for (const item of value.river.items) {
      if (!/^river-trash-\d+$/.test(item?.id || "") || ids.has(item.id) || !counts.hasOwnProperty(item.sectionId) || !RIVER_GARBAGE_TYPES.includes(item.type) || !["floating", "stuck"].includes(item.status) || !Number.isFinite(item.t) || item.t < 0 || item.t > 1) errors.push(`${item?.id || "River rubbish"} is invalid.`);
      ids.add(item?.id);
      if (counts.hasOwnProperty(item?.sectionId)) counts[item.sectionId] += 1;
    }
    if (Object.entries(counts).some(([id, count]) => count > (id === "river-05" ? RIVER_GARBAGE_CONFIG.lowerRiverMaxPerSection : RIVER_GARBAGE_CONFIG.maxPerSection))) errors.push("A river section exceeds its rubbish capacity.");
  }
  if (!value.businesses || BUSINESS_CATALOG.some((business) => !Number.isFinite(value.businesses[business.id]?.waste) || value.businesses[business.id].waste < 0 || value.businesses[business.id].waste > 140)) errors.push("Business waste state is invalid.");
  if (!Number.isFinite(value.cleanliness?.score) || value.cleanliness.score < 0 || value.cleanliness.score > 100) errors.push("Town cleanliness score is invalid.");
  if (!Number.isFinite(value.calm?.untilGameMinute) || value.calm.untilGameMinute < 0) errors.push("Town calm state is invalid.");
  if (value.calm?.untilGameMinute > now + ENVIRONMENT_LIMITS.postRestorationCalmMinutes * 2) errors.push("Town calm window exceeds its safe bound.");
  return { ok: errors.length === 0, errors };
}
