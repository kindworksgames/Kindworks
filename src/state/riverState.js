import { RIVER_STATE_SCHEMA_VERSION, RIVER_TOTAL_LEVELS } from "../data/riverClearout.js";

function whole(value, minimum = 0, maximum = Number.MAX_SAFE_INTEGER) {
  const number = Math.floor(Number(value));
  return Number.isFinite(number) ? Math.max(minimum, Math.min(maximum, number)) : minimum;
}

function legacyRiverSource(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value.miniGames?.progress?.river ?? value.river ?? value;
}

export function createFreshRiverState() {
  return {
    schemaVersion: RIVER_STATE_SCHEMA_VERSION,
    nextLevel: 1,
    completed: 0,
    best: {},
    totalStars: 0,
    restorationPoints: 0,
    attempts: 0,
    lifetimePieces: 0,
    lifetimeRows: 0,
    lastLevel: null,
    lastOutcome: null,
  };
}

export function normalizeRiverState(value) {
  const fresh = createFreshRiverState();
  const source = legacyRiverSource(value);
  const best = {};
  for (const [key, record] of Object.entries(source.best || {})) {
    const level = Number(key);
    if (!Number.isInteger(level) || level < 1 || level > RIVER_TOTAL_LEVELS || !record || typeof record !== "object") continue;
    const bestPercent = whole(record.bestPercent ?? record.percent, 0, 100);
    const bestPiecesValue = record.bestPieces ?? record.pieces;
    best[level] = {
      stars: whole(record.stars, 0, 3),
      bestPercent,
      bestPieces: bestPiecesValue === null || bestPiecesValue === undefined ? null : whole(bestPiecesValue),
    };
  }
  const records = Object.values(best);
  const completedFromRecords = records.filter((record) => record.bestPercent >= 50 && record.stars >= 1).length;
  return {
    ...fresh,
    nextLevel: whole(source.nextLevel, 1, RIVER_TOTAL_LEVELS),
    completed: Math.max(completedFromRecords, whole(source.completed, 0, RIVER_TOTAL_LEVELS)),
    best,
    totalStars: records.reduce((sum, record) => sum + record.stars, 0),
    restorationPoints: records.reduce((sum, record) => sum + record.stars * 100 + record.bestPercent, 0),
    attempts: whole(source.attempts),
    lifetimePieces: whole(source.lifetimePieces ?? source.piecesPlaced),
    lifetimeRows: whole(source.lifetimeRows ?? source.rowsCleared),
    lastLevel: source.lastLevel === null || source.lastLevel === undefined ? null : whole(source.lastLevel, 1, RIVER_TOTAL_LEVELS),
    lastOutcome: ["won", "lost"].includes(source.lastOutcome) ? source.lastOutcome : null,
  };
}

export function projectLegacyRiver(value) {
  return normalizeRiverState(value);
}

export function validateRiverState(value) {
  const errors = [];
  if (!value || typeof value !== "object" || Array.isArray(value)) return { ok: false, errors: ["River state is missing."] };
  if (value.schemaVersion !== RIVER_STATE_SCHEMA_VERSION) errors.push("River state schema version is unsupported.");
  if (!Number.isInteger(value.nextLevel) || value.nextLevel < 1 || value.nextLevel > RIVER_TOTAL_LEVELS) errors.push("River next level is invalid.");
  for (const key of ["completed", "totalStars", "restorationPoints", "attempts", "lifetimePieces", "lifetimeRows"]) {
    if (!Number.isSafeInteger(value[key]) || value[key] < 0) errors.push(`River ${key} is invalid.`);
  }
  if (!value.best || typeof value.best !== "object" || Array.isArray(value.best)) errors.push("River best-result records are invalid.");
  let stars = 0;
  let restorationPoints = 0;
  for (const [key, record] of Object.entries(value.best || {})) {
    const level = Number(key);
    if (!Number.isInteger(level) || level < 1 || level > RIVER_TOTAL_LEVELS || !record || typeof record !== "object") {
      errors.push("River best-result level is invalid.");
      continue;
    }
    if (!Number.isInteger(record.stars) || record.stars < 0 || record.stars > 3) errors.push(`River stars for level ${level} are invalid.`);
    if (!Number.isInteger(record.bestPercent) || record.bestPercent < 0 || record.bestPercent > 100) errors.push(`River percentage for level ${level} is invalid.`);
    if (record.bestPieces !== null && (!Number.isSafeInteger(record.bestPieces) || record.bestPieces < 0)) errors.push(`River piece count for level ${level} is invalid.`);
    stars += Number(record.stars) || 0;
    restorationPoints += (Number(record.stars) || 0) * 100 + (Number(record.bestPercent) || 0);
  }
  if (stars !== value.totalStars) errors.push("River total stars do not match best results.");
  if (restorationPoints !== value.restorationPoints) errors.push("River restoration points do not match best results.");
  if (value.completed > RIVER_TOTAL_LEVELS) errors.push("River completed-level count is invalid.");
  if (value.lastLevel !== null && (!Number.isInteger(value.lastLevel) || value.lastLevel < 1 || value.lastLevel > RIVER_TOTAL_LEVELS)) errors.push("River last level is invalid.");
  if (value.lastOutcome !== null && !["won", "lost"].includes(value.lastOutcome)) errors.push("River last outcome is invalid.");
  return { ok: errors.length === 0, errors };
}
