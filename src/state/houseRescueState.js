import { HOUSES } from "../data/town.js";
import { PERSONAL_HOME_RENDER_HOUSE_ID } from "../data/customResident.js";
import {
  HOUSE_RESCUE_RULES,
  HOUSE_RESCUE_STATE_SCHEMA_VERSION,
  HOUSE_RESCUE_TOTAL_LEVELS,
  generateHouseRescueDirt,
  generateHouseRescueItems,
  houseRescueCoverage,
  houseRescueLevel,
} from "../data/houseRescue.js";

function whole(value, minimum = 0, maximum = Number.MAX_SAFE_INTEGER) {
  const number = Math.floor(Number(value));
  return Number.isFinite(number) ? Math.max(minimum, Math.min(maximum, number)) : minimum;
}

function currentHouseId(value) {
  const match = String(value || "").match(/^house-0*(\d+)$/);
  return match ? `house-${Number(match[1])}` : String(value || "");
}

function freshHome(house, worldDay = 1) {
  const personal = house.id === PERSONAL_HOME_RENDER_HOUSE_ID;
  const initial = !personal && HOUSE_RESCUE_RULES.initialDirty.includes(house.id);
  const number = Number(house.id.split("-")[1]) || 1;
  return {
    houseId: house.id,
    dirty: initial,
    jobSerial: 1,
    completionCount: 0,
    lastCompletedDay: 0,
    nextDirtyDay: personal ? 0 : initial ? 0 : Math.max(worldDay, 1) + 1 + (number % 4),
    bestScore: null,
    bestStars: 0,
    lastScore: null,
    lastMistakes: 0,
    lastCoins: 0,
  };
}

export function createFreshHouseRescueState({ worldDay = 1 } = {}) {
  return {
    schemaVersion: HOUSE_RESCUE_STATE_SCHEMA_VERSION,
    selectedLevel: 1,
    unlockedLevel: 1,
    completed: 0,
    best: {},
    totalStars: 0,
    attempts: 0,
    lifetimeItemsSorted: 0,
    lifetimeStainLayers: 0,
    lastLevel: null,
    homes: Object.fromEntries(HOUSES.map((house) => [house.id, freshHome(house, worldDay)])),
    active: null,
  };
}

function legacySource(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value.houseRescue ?? value.houseRescueState ?? value.miniGames?.houseRescue ?? value;
}

function normalizeBest(source) {
  const best = {};
  for (const [key, value] of Object.entries(source || {}).slice(0, HOUSE_RESCUE_TOTAL_LEVELS)) {
    const level = Number(key);
    if (!Number.isInteger(level) || level < 1 || level > HOUSE_RESCUE_TOTAL_LEVELS || !value || typeof value !== "object") continue;
    best[level] = {
      score: Math.floor(Number(value.score) || 0),
      stars: whole(value.stars, 1, 3),
      mistakes: whole(value.mistakes, 0, 999),
      completed: whole(value.completed, 1),
    };
  }
  return best;
}

function normalizeHome(base, value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return base;
  return {
    ...base,
    dirty: base.houseId === PERSONAL_HOME_RENDER_HOUSE_ID ? false : Boolean(value.dirty),
    jobSerial: whole(value.jobSerial, 1),
    completionCount: whole(value.completionCount),
    lastCompletedDay: whole(value.lastCompletedDay),
    nextDirtyDay: base.houseId === PERSONAL_HOME_RENDER_HOUSE_ID ? 0 : whole(value.nextDirtyDay),
    bestScore: value.bestScore === null || value.bestScore === undefined ? null : Math.floor(Number(value.bestScore) || 0),
    bestStars: whole(value.bestStars, 0, 3),
    lastScore: value.lastScore === null || value.lastScore === undefined ? null : Math.floor(Number(value.lastScore) || 0),
    lastMistakes: whole(value.lastMistakes, 0, 999),
    lastCoins: whole(value.lastCoins, 0, HOUSE_RESCUE_RULES.maxCoins),
  };
}

function normalizeActive(value, homes, selectedLevel) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const houseId = currentHouseId(value.houseId);
  const home = homes[houseId];
  if (!home?.dirty || whole(value.jobSerial, 1) !== home.jobSerial) return null;
  const level = whole(value.level, 1, HOUSE_RESCUE_TOTAL_LEVELS) || selectedLevel;
  const generatedItems = generateHouseRescueItems({ houseId, jobSerial: home.jobSerial, level });
  const savedItems = new Map((Array.isArray(value.items) ? value.items : []).map((item) => [String(item?.id || ""), item]));
  const items = generatedItems.map((item) => ({ ...item, sorted: Boolean(savedItems.get(item.id)?.sorted) }));
  const correct = items.filter((item) => item.sorted).length;
  const mistakes = whole(value.mistakes, 0, 999);
  const generatedDirt = generateHouseRescueDirt({ houseId, jobSerial: home.jobSerial, level });
  const savedDirt = new Map((Array.isArray(value.dirt) ? value.dirt : []).map((stain) => [String(stain?.id || ""), stain]));
  const dirt = generatedDirt.map((stain) => {
    const saved = savedDirt.get(stain.id);
    return { ...stain, remaining: saved ? Math.max(0, Math.min(stain.strength, Number(saved.remaining ?? (saved.clean ? 0 : stain.strength)) || 0)) : stain.strength };
  });
  const phase = correct === items.length ? "vacuum" : "sorting";
  const vacuum = {
    x: Math.max(0, Math.min(100, Number(value.vacuum?.x) || 8)),
    y: Math.max(0, Math.min(100, Number(value.vacuum?.y) || 92)),
  };
  return {
    format: 1,
    id: `house-rescue-${houseId}-${home.jobSerial}-level-${level}`,
    houseId,
    jobSerial: home.jobSerial,
    level,
    phase,
    score: correct * HOUSE_RESCUE_RULES.correctScore + mistakes * HOUSE_RESCUE_RULES.wrongScore,
    mistakes,
    correct,
    items,
    dirt,
    vacuum,
    vacuumContacts: [],
    returnPosition: value.returnPosition && Number.isFinite(value.returnPosition.x) && Number.isFinite(value.returnPosition.y) ? { x: Number(value.returnPosition.x), y: Number(value.returnPosition.y) } : null,
    returnFacing: ["up", "down", "left", "right"].includes(value.returnFacing) ? value.returnFacing : "down",
    startedAt: whole(value.startedAt),
  };
}

export function normalizeHouseRescueState(value, { worldDay = 1 } = {}) {
  const fresh = createFreshHouseRescueState({ worldDay });
  const source = legacySource(value);
  const progression = source.progression && typeof source.progression === "object" ? source.progression : source;
  const best = normalizeBest(progression.best);
  const maxBest = Math.max(1, ...Object.keys(best).map(Number));
  const unlockedLevel = Math.max(maxBest, whole(progression.unlockedLevel, 1, HOUSE_RESCUE_TOTAL_LEVELS));
  const selectedLevel = Math.min(unlockedLevel, whole(progression.selectedLevel, 1, HOUSE_RESCUE_TOTAL_LEVELS));
  const savedHomes = source.homes && typeof source.homes === "object" ? source.homes : {};
  const homes = { ...fresh.homes };
  for (const [savedId, saved] of Object.entries(savedHomes)) {
    // Schema 27 temporarily rendered the personal house under house-19. It was
    // always clean, so normalize that alias into the stable house-20 record.
    const currentId = currentHouseId(savedId);
    const id = currentId === "house-19" ? PERSONAL_HOME_RENDER_HOUSE_ID : currentId;
    if (homes[id]) homes[id] = normalizeHome(homes[id], saved);
  }
  const records = Object.values(best);
  return {
    ...fresh,
    selectedLevel,
    unlockedLevel,
    completed: records.length,
    best,
    totalStars: records.reduce((sum, record) => sum + record.stars, 0),
    attempts: whole(source.attempts),
    lifetimeItemsSorted: whole(source.lifetimeItemsSorted),
    lifetimeStainLayers: whole(source.lifetimeStainLayers),
    lastLevel: source.lastLevel === null || source.lastLevel === undefined ? null : whole(source.lastLevel, 1, HOUSE_RESCUE_TOTAL_LEVELS),
    homes,
    active: normalizeActive(source.active, homes, selectedLevel),
  };
}

export function projectLegacyHouseRescue(value, world = {}) {
  return normalizeHouseRescueState(value, { worldDay: whole(world.day, 1) });
}

export function validateHouseRescueState(value) {
  const errors = [];
  if (!value || typeof value !== "object" || Array.isArray(value)) return { ok: false, errors: ["House Rescue state is missing."] };
  if (value.schemaVersion !== HOUSE_RESCUE_STATE_SCHEMA_VERSION) errors.push("House Rescue state schema version is unsupported.");
  for (const key of ["selectedLevel", "unlockedLevel"]) if (!Number.isInteger(value[key]) || value[key] < 1 || value[key] > HOUSE_RESCUE_TOTAL_LEVELS) errors.push(`House Rescue ${key} is invalid.`);
  if (value.selectedLevel > value.unlockedLevel) errors.push("House Rescue selected level is locked.");
  for (const key of ["completed", "totalStars", "attempts", "lifetimeItemsSorted", "lifetimeStainLayers"]) if (!Number.isSafeInteger(value[key]) || value[key] < 0) errors.push(`House Rescue ${key} is invalid.`);
  if (!value.best || typeof value.best !== "object" || Array.isArray(value.best)) errors.push("House Rescue best results are invalid.");
  let stars = 0;
  for (const [key, record] of Object.entries(value.best || {})) {
    const level = Number(key);
    if (!Number.isInteger(level) || level < 1 || level > HOUSE_RESCUE_TOTAL_LEVELS || !record || typeof record !== "object") { errors.push("House Rescue best-result level is invalid."); continue; }
    if (!Number.isInteger(record.stars) || record.stars < 1 || record.stars > 3) errors.push(`House Rescue Level ${level} stars are invalid.`);
    if (!Number.isInteger(record.score) || !Number.isInteger(record.mistakes) || record.mistakes < 0 || !Number.isInteger(record.completed) || record.completed < 1) errors.push(`House Rescue Level ${level} result is invalid.`);
    stars += Number(record.stars) || 0;
  }
  if (stars !== value.totalStars || Object.keys(value.best || {}).length !== value.completed) errors.push("House Rescue campaign totals do not match best results.");
  if (!value.homes || typeof value.homes !== "object" || Array.isArray(value.homes)) errors.push("House Rescue home records are invalid.");
  const dirty = [];
  for (const house of HOUSES) {
    const home = value.homes?.[house.id];
    if (!home || home.houseId !== house.id || !Number.isInteger(home.jobSerial) || home.jobSerial < 1 || !Number.isInteger(home.completionCount) || home.completionCount < 0) errors.push(`House Rescue state for ${house.id} is invalid.`);
    if (home?.dirty) dirty.push(house.id);
  }
  if (Object.keys(value.homes || {}).length !== HOUSES.length) errors.push("House Rescue must track every town house exactly once.");
  if (dirty.length > HOUSE_RESCUE_RULES.maxDirtyHomes) errors.push("House Rescue dirty-home limit is exceeded.");
  if (value.homes?.[PERSONAL_HOME_RENDER_HOUSE_ID]?.dirty) errors.push("The personal home cannot be a House Rescue job.");
  if (value.active) {
    const active = value.active;
    const home = value.homes?.[active.houseId];
    const config = houseRescueLevel(active.level);
    if (!home?.dirty || home.jobSerial !== active.jobSerial) errors.push("House Rescue active job does not match its home.");
    if (!["sorting", "vacuum"].includes(active.phase) || active.items?.length !== config.itemCount || active.dirt?.length !== config.dirtCount) errors.push("House Rescue active level shape is invalid.");
    if (active.correct !== active.items?.filter((item) => item.sorted).length || active.score !== active.correct * HOUSE_RESCUE_RULES.correctScore + active.mistakes * HOUSE_RESCUE_RULES.wrongScore) errors.push("House Rescue active score is inconsistent.");
    if (active.phase === "vacuum" && active.correct !== active.items.length) errors.push("House Rescue vacuuming began before sorting finished.");
    if (houseRescueCoverage(active.dirt) >= HOUSE_RESCUE_RULES.completionCoverage) errors.push("A completed House Rescue was left active.");
  }
  return { ok: errors.length === 0, errors };
}
