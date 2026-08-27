import {
  POWERWASH_CANVAS,
  POWERWASH_MINIMUM_CLEAN_PERCENT,
  POWERWASH_NOZZLES,
  POWERWASH_TOTAL_LEVELS,
  PlaygroundPowerwashEngine,
} from "../data/playgroundPowerwash.js";

export const PLAYGROUND_POWERWASH_SCHEMA_VERSION = 1;
export const POWERWASH_HISTORY_LIMIT = 120;
export const PROCESSED_POWERWASH_SESSION_LIMIT = 300;
export const POWERWASH_VISUAL_POINT_LIMIT = 60000;

function normalizeVisualCheckpoint(value) {
  const paths = [];
  let points = 0;
  for (const path of Array.isArray(value?.paths) ? value.paths : []) {
    const toolMode = path?.toolMode === "soap" ? "soap" : "water";
    const nozzle = Object.hasOwn(POWERWASH_NOZZLES, path?.nozzle) ? path.nozzle : "precision";
    const cleanPoints = [];
    for (const point of Array.isArray(path?.points) ? path.points : []) {
      if (!Array.isArray(point) || point.length !== 2 || !Number.isFinite(point[0]) || !Number.isFinite(point[1])) continue;
      cleanPoints.push([
        Math.max(0, Math.min(POWERWASH_CANVAS.width, Math.round(point[0] * 100) / 100)),
        Math.max(0, Math.min(POWERWASH_CANVAS.height, Math.round(point[1] * 100) / 100)),
      ]);
      points += 1;
      if (points >= POWERWASH_VISUAL_POINT_LIMIT) break;
    }
    if (cleanPoints.length >= 2) paths.push({ toolMode, nozzle, points: cleanPoints });
    if (points >= POWERWASH_VISUAL_POINT_LIMIT) break;
  }
  return { revision: 1, paths };
}

function whole(value, minimum = 0, maximum = Number.MAX_SAFE_INTEGER, fallback = minimum) {
  const number = Math.floor(Number(value));
  return Number.isFinite(number) ? Math.max(minimum, Math.min(maximum, number)) : fallback;
}

function iso(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function normalizeProgress(value) {
  const best = {};
  for (const [key, result] of Object.entries(value?.best && typeof value.best === "object" ? value.best : {})) {
    const level = Number(key);
    if (!Number.isInteger(level) || level < 1 || level > POWERWASH_TOTAL_LEVELS || !result || typeof result !== "object") continue;
    best[String(level)] = { stars: whole(result.stars, 0, 3), percent: whole(result.percent, 0, 100) };
  }
  return {
    nextLevel: whole(value?.nextLevel, 1, POWERWASH_TOTAL_LEVELS, 1),
    completed: Object.values(best).filter((result) => result.percent >= POWERWASH_MINIMUM_CLEAN_PERCENT).length,
    best,
  };
}

export function powerwashDirtyInterval(dayValue = 1, cleaningsValue = 0) {
  const day = Math.max(1, Math.floor(Number(dayValue) || 1));
  const cleanings = Math.max(0, Math.floor(Number(cleaningsValue) || 0));
  let seed = (Math.imul(day, 1103515245) + Math.imul(cleanings + 1, 12345) + 0x51f15e) >>> 0;
  seed ^= seed >>> 16;
  seed = Math.imul(seed, 0x7feb352d);
  seed ^= seed >>> 15;
  return 2 + ((seed >>> 0) % 2);
}

function normalizePlayground(value) {
  const dirty = value?.dirty !== false;
  const lastCleanedDay = whole(value?.lastCleanedDay, 1, Number.MAX_SAFE_INTEGER, 1);
  const cleanings = whole(value?.cleanings);
  const minimumNextDay = lastCleanedDay + 2;
  return {
    dirty,
    lastCleanedDay,
    nextDirtyDay: whole(value?.nextDirtyDay, minimumNextDay, Number.MAX_SAFE_INTEGER, lastCleanedDay + powerwashDirtyInterval(lastCleanedDay, cleanings)),
    dirtySinceDay: dirty ? whole(value?.dirtySinceDay, 1, Number.MAX_SAFE_INTEGER, 1) : 0,
    cleanings,
    attempts: whole(value?.attempts),
    lastCompletionPercent: whole(value?.lastCompletionPercent, 0, 100),
    lastRewardCoins: whole(value?.lastRewardCoins, 0, 170),
  };
}

function normalizeSession(value) {
  if (!value || typeof value !== "object" || typeof value.id !== "string") return null;
  const assignedLevel = whole(value.assignedLevel, 1, POWERWASH_TOTAL_LEVELS, 1);
  const engine = new PlaygroundPowerwashEngine(assignedLevel, value).snapshot();
  const mode = value.mode === "town-job" ? "town-job" : "campaign";
  return {
    id: value.id,
    mode,
    targetId: mode === "town-job" ? "commons-playground" : null,
    assignedLevel,
    status: "playing",
    startedAt: iso(value.startedAt) || new Date(0).toISOString(),
    normal: engine.normal,
    resistant: engine.resistant,
    soaped: engine.soaped,
    water: engine.water,
    soap: engine.soap,
    toolMode: engine.toolMode,
    nozzle: Object.hasOwn(POWERWASH_NOZZLES, engine.nozzle) ? engine.nozzle : "precision",
    strokes: engine.strokes,
    soapWarnings: engine.soapWarnings,
    won: false,
    rawPercentAtCompletion: 0,
    visualCheckpoint: normalizeVisualCheckpoint(value.visualCheckpoint),
    returnPosition: value.returnPosition && Number.isFinite(value.returnPosition.x) && Number.isFinite(value.returnPosition.y)
      ? { x: Number(value.returnPosition.x), y: Number(value.returnPosition.y) }
      : { x: 1940, y: 1180 },
    returnFacing: ["up", "down", "left", "right"].includes(value.returnFacing) ? value.returnFacing : "up",
  };
}

export function createFreshPlaygroundPowerwashState() {
  return {
    schemaVersion: PLAYGROUND_POWERWASH_SCHEMA_VERSION,
    nextSessionId: 1,
    processedSessionIds: [],
    history: [],
    progress: { nextLevel: 1, completed: 0, best: {} },
    playground: {
      dirty: true,
      lastCleanedDay: 1,
      nextDirtyDay: 1 + powerwashDirtyInterval(1, 0),
      dirtySinceDay: 1,
      cleanings: 0,
      attempts: 0,
      lastCompletionPercent: 0,
      lastRewardCoins: 0,
    },
    activeSession: null,
  };
}

export function normalizePlaygroundPowerwashState(value) {
  const fresh = createFreshPlaygroundPowerwashState();
  if (!value || typeof value !== "object" || Array.isArray(value)) return fresh;
  return {
    schemaVersion: PLAYGROUND_POWERWASH_SCHEMA_VERSION,
    nextSessionId: whole(value.nextSessionId, 1),
    processedSessionIds: [...new Set((Array.isArray(value.processedSessionIds) ? value.processedSessionIds : []).filter((id) => typeof id === "string"))].slice(-PROCESSED_POWERWASH_SESSION_LIMIT),
    history: (Array.isArray(value.history) ? value.history : []).filter((entry) => entry && typeof entry === "object").slice(-POWERWASH_HISTORY_LIMIT).map((entry) => structuredClone(entry)),
    progress: normalizeProgress(value.progress),
    playground: normalizePlayground(value.playground),
    activeSession: normalizeSession(value.activeSession),
  };
}

export function projectLegacyPlaygroundPowerwash(legacy, currentValue = null) {
  const current = normalizePlaygroundPowerwashState(currentValue);
  const progressSource = legacy?.miniGames?.progress?.playground || legacy?.miniGameProgress?.playground || legacy?.progress?.playground;
  if (progressSource && typeof progressSource === "object") {
    const projected = normalizeProgress(progressSource);
    for (const [level, result] of Object.entries(projected.best)) {
      const old = current.progress.best[level] || { stars: 0, percent: 0 };
      current.progress.best[level] = { stars: Math.max(old.stars, result.stars), percent: Math.max(old.percent, result.percent) };
    }
    current.progress.completed = Object.values(current.progress.best).filter((result) => result.percent >= POWERWASH_MINIMUM_CLEAN_PERCENT).length;
    if (current.progress.completed === projected.completed) current.progress.nextLevel = projected.nextLevel;
  }
  const playgroundSource = legacy?.playgroundCleanup || legacy?.playgroundPowerwashing;
  if (playgroundSource && typeof playgroundSource === "object") current.playground = normalizePlayground(playgroundSource);
  return current;
}

export function validatePlaygroundPowerwashState(value) {
  const errors = [];
  if (!value || typeof value !== "object" || Array.isArray(value)) return { ok: false, errors: ["Playground Power Wash state is missing."] };
  if (value.schemaVersion !== PLAYGROUND_POWERWASH_SCHEMA_VERSION) errors.push("Playground Power Wash schema version is unsupported.");
  if (!Number.isSafeInteger(value.nextSessionId) || value.nextSessionId < 1) errors.push("Playground Power Wash next-session id is invalid.");
  if (!Array.isArray(value.processedSessionIds) || value.processedSessionIds.length > PROCESSED_POWERWASH_SESSION_LIMIT || new Set(value.processedSessionIds).size !== value.processedSessionIds.length) errors.push("Processed Playground Power Wash sessions are invalid.");
  if (!Array.isArray(value.history) || value.history.length > POWERWASH_HISTORY_LIMIT) errors.push("Playground Power Wash history is invalid.");
  if (JSON.stringify(normalizeProgress(value.progress)) !== JSON.stringify(value.progress)) errors.push("Playground Power Wash campaign progress is invalid.");
  if (JSON.stringify(normalizePlayground(value.playground)) !== JSON.stringify(value.playground)) errors.push("Commons Playground cleanup state is invalid.");
  if (value.activeSession !== null && JSON.stringify(normalizeSession(value.activeSession)) !== JSON.stringify(value.activeSession)) errors.push("Active Playground Power Wash session is invalid.");
  return { ok: errors.length === 0, errors };
}
