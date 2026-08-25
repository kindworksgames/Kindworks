import { CAFE_CONFIG, CAFE_STATE_SCHEMA_VERSION } from "../data/cafe.js";

function whole(value, minimum = 0, maximum = Number.MAX_SAFE_INTEGER) {
  const number = Math.floor(Number(value));
  return Number.isFinite(number) ? Math.max(minimum, Math.min(maximum, number)) : minimum;
}

export function createFreshCafeState() {
  return {
    schemaVersion: CAFE_STATE_SCHEMA_VERSION,
    unlockedLevel: 1,
    completed: {},
    best: {},
    totalStars: 0,
    shifts: 0,
    lifetimeServed: 0,
    lifetimeCoins: 0,
    lastLevel: null,
    lastOutcome: null,
  };
}

export function normalizeCafeState(value) {
  const fresh = createFreshCafeState();
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const completed = {};
  const best = {};
  for (let level = 1; level <= CAFE_CONFIG.levelCount; level += 1) {
    if (source.completed?.[level]) completed[level] = true;
    const record = source.best?.[level];
    if (record && typeof record === "object") {
      best[level] = {
        score: whole(record.score, 0, 100),
        stars: whole(record.stars, 0, 3),
        served: whole(record.served),
        accuracy: whole(record.accuracy, 0, 100),
      };
    }
  }
  let contiguousClear = 0;
  while (contiguousClear < CAFE_CONFIG.levelCount && completed[contiguousClear + 1]) contiguousClear += 1;
  const lastLevel = source.lastLevel === null || source.lastLevel === undefined ? null : whole(source.lastLevel, 1, CAFE_CONFIG.levelCount);
  const lastOutcome = ["won", "lost"].includes(source.lastOutcome) ? source.lastOutcome : null;
  return {
    ...fresh,
    unlockedLevel: Math.max(whole(source.unlockedLevel, 1, CAFE_CONFIG.levelCount), Math.min(CAFE_CONFIG.levelCount, contiguousClear + 1)),
    completed,
    best,
    totalStars: Object.values(best).reduce((sum, record) => sum + record.stars, 0),
    shifts: whole(source.shifts),
    lifetimeServed: whole(source.lifetimeServed ?? source.served),
    lifetimeCoins: whole(source.lifetimeCoins ?? source.totalCoinsEarned),
    lastLevel,
    lastOutcome,
  };
}

export function projectLegacyCafe(value) {
  return normalizeCafeState(value);
}

export function validateCafeState(value) {
  const errors = [];
  if (!value || typeof value !== "object" || Array.isArray(value)) return { ok: false, errors: ["Cafe state is missing."] };
  if (value.schemaVersion !== CAFE_STATE_SCHEMA_VERSION) errors.push("Cafe state schema version is unsupported.");
  if (!Number.isInteger(value.unlockedLevel) || value.unlockedLevel < 1 || value.unlockedLevel > CAFE_CONFIG.levelCount) errors.push("Cafe unlocked level is invalid.");
  for (const key of ["totalStars", "shifts", "lifetimeServed", "lifetimeCoins"]) if (!Number.isSafeInteger(value[key]) || value[key] < 0) errors.push(`Cafe ${key} is invalid.`);
  if (!value.completed || typeof value.completed !== "object" || Array.isArray(value.completed)) errors.push("Cafe completed-level records are invalid.");
  if (!value.best || typeof value.best !== "object" || Array.isArray(value.best)) errors.push("Cafe best-score records are invalid.");
  let starTotal = 0;
  for (const [key, record] of Object.entries(value.best || {})) {
    const level = Number(key);
    if (!Number.isInteger(level) || level < 1 || level > CAFE_CONFIG.levelCount || !record || typeof record !== "object") { errors.push("Cafe best-score level is invalid."); continue; }
    if (!Number.isInteger(record.score) || record.score < 0 || record.score > 100 || !Number.isInteger(record.stars) || record.stars < 0 || record.stars > 3 || !Number.isInteger(record.served) || record.served < 0 || !Number.isInteger(record.accuracy) || record.accuracy < 0 || record.accuracy > 100) errors.push(`Cafe best score for level ${level} is invalid.`);
    starTotal += Number(record.stars) || 0;
  }
  for (const [key, completed] of Object.entries(value.completed || {})) {
    const level = Number(key);
    if (!Number.isInteger(level) || level < 1 || level > CAFE_CONFIG.levelCount || completed !== true) errors.push("Cafe completed-level entry is invalid.");
  }
  if (starTotal !== value.totalStars) errors.push("Cafe total stars do not match best scores.");
  if (value.lastLevel !== null && (!Number.isInteger(value.lastLevel) || value.lastLevel < 1 || value.lastLevel > CAFE_CONFIG.levelCount)) errors.push("Cafe last level is invalid.");
  if (value.lastOutcome !== null && !["won", "lost"].includes(value.lastOutcome)) errors.push("Cafe last outcome is invalid.");
  return { ok: errors.length === 0, errors };
}

