import { LAWN_TOTAL_LEVELS, getLawnLevel, lawnCellKey } from "../data/lawnCare.js";
import { LAWN_PLOTS } from "../data/farming.js";

export const LAWN_CARE_SCHEMA_VERSION = 1;
export const LAWN_CARE_HISTORY_LIMIT = 120;
export const PROCESSED_LAWN_SESSION_LIMIT = 300;

const DIRECTIONS = new Set(["U", "D", "L", "R"]);
const RETURN_DIRECTIONS = new Set(["up", "down", "left", "right"]);
const LAWN_IDS = new Set(LAWN_PLOTS.map((plot) => plot.id));

function whole(value, minimum = 0, maximum = Number.MAX_SAFE_INTEGER, fallback = minimum) {
  const number = Math.floor(Number(value));
  return Number.isFinite(number) ? Math.max(minimum, Math.min(maximum, number)) : fallback;
}

function iso(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function normalizeProgress(value) {
  const progress = { nextLevel: whole(value?.nextLevel, 1, LAWN_TOTAL_LEVELS, 1), completed: 0, best: {} };
  if (value?.best && typeof value.best === "object" && !Array.isArray(value.best)) {
    for (const [levelKey, result] of Object.entries(value.best)) {
      const level = Number(levelKey);
      if (!Number.isInteger(level) || level < 1 || level > LAWN_TOTAL_LEVELS || !result || typeof result !== "object") continue;
      progress.best[String(level)] = {
        stars: whole(result.stars, 0, 3),
        percent: whole(result.percent, 0, 100),
      };
    }
  }
  progress.completed = Object.values(progress.best).filter((result) => result.percent >= 50).length;
  return progress;
}

function normalizeFrame(level, value) {
  if (!value || typeof value !== "object") return null;
  const row = whole(value.row, 0, level.height - 1, level.start[0]);
  const col = whole(value.col, 0, level.width - 1, level.start[1]);
  if (!level.indexByCell.has(lawnCellKey(row, col))) return null;
  const cutCells = [...new Set((Array.isArray(value.cutCells) ? value.cutCells : [])
    .map(String)
    .filter((cell) => level.indexByCell.has(cell)))];
  const current = lawnCellKey(row, col);
  if (!cutCells.includes(current)) cutCells.push(current);
  return {
    row,
    col,
    facing: DIRECTIONS.has(value.facing) ? value.facing : "U",
    cutCells,
    moves: whole(value.moves, 0, level.canonicalSolution.length + 2),
  };
}

function normalizeSession(value) {
  if (!value || typeof value !== "object" || typeof value.id !== "string") return null;
  const assignedLevel = whole(value.assignedLevel, 1, LAWN_TOTAL_LEVELS, 1);
  const level = getLawnLevel(assignedLevel);
  const frame = normalizeFrame(level, value);
  if (!frame) return null;
  const mode = value.mode === "town-job" ? "town-job" : "campaign";
  const targetId = mode === "town-job" && LAWN_IDS.has(value.targetId) ? value.targetId : null;
  if (mode === "town-job" && !targetId) return null;
  const returnPosition = value.returnPosition && Number.isFinite(value.returnPosition.x) && Number.isFinite(value.returnPosition.y)
    ? { x: Number(value.returnPosition.x), y: Number(value.returnPosition.y) }
    : { x: 305, y: 530 };
  return {
    id: value.id,
    mode,
    targetId,
    assignedLevel,
    status: value.status === "failed" ? "failed" : "playing",
    startedAt: iso(value.startedAt) || new Date(0).toISOString(),
    ...frame,
    undoStack: (Array.isArray(value.undoStack) ? value.undoStack : []).map((entry) => normalizeFrame(level, entry)).filter(Boolean).slice(-5),
    lawnStart: mode === "town-job" ? {
      grassHeight: Math.max(0, Math.min(100, Number(value.lawnStart?.grassHeight) || 0)),
      weedPressure: Math.max(0, Math.min(100, Number(value.lawnStart?.weedPressure) || 0)),
    } : null,
    returnPosition,
    returnFacing: RETURN_DIRECTIONS.has(value.returnFacing) ? value.returnFacing : "down",
  };
}

export function createFreshLawnCareState() {
  return {
    schemaVersion: LAWN_CARE_SCHEMA_VERSION,
    nextSessionId: 1,
    processedSessionIds: [],
    history: [],
    progress: { nextLevel: 1, completed: 0, best: {} },
    activeSession: null,
  };
}

export function normalizeLawnCareState(value) {
  const fresh = createFreshLawnCareState();
  if (!value || typeof value !== "object" || Array.isArray(value)) return fresh;
  return {
    schemaVersion: LAWN_CARE_SCHEMA_VERSION,
    nextSessionId: whole(value.nextSessionId, 1),
    processedSessionIds: [...new Set((Array.isArray(value.processedSessionIds) ? value.processedSessionIds : []).filter((id) => typeof id === "string"))].slice(-PROCESSED_LAWN_SESSION_LIMIT),
    history: (Array.isArray(value.history) ? value.history : []).filter((entry) => entry && typeof entry === "object").slice(-LAWN_CARE_HISTORY_LIMIT),
    progress: normalizeProgress(value.progress),
    activeSession: normalizeSession(value.activeSession),
  };
}

export function projectLegacyLawnCare(legacy, currentValue = null) {
  const current = normalizeLawnCareState(currentValue);
  const source = legacy?.miniGames?.progress?.lawn || legacy?.miniGameProgress?.lawn || legacy?.progress?.lawn;
  if (!source || typeof source !== "object") return current;
  const projected = normalizeProgress(source);
  for (const [level, result] of Object.entries(projected.best)) {
    const old = current.progress.best[level] || { stars: 0, percent: 0 };
    current.progress.best[level] = { stars: Math.max(old.stars, result.stars), percent: Math.max(old.percent, result.percent) };
  }
  current.progress.completed = Object.values(current.progress.best).filter((result) => result.percent >= 50).length;
  if (current.progress.completed === projected.completed) current.progress.nextLevel = projected.nextLevel;
  return current;
}

export function validateLawnCareState(value) {
  const errors = [];
  if (!value || typeof value !== "object" || Array.isArray(value)) return { ok: false, errors: ["Lawn Care state is missing."] };
  if (value.schemaVersion !== LAWN_CARE_SCHEMA_VERSION) errors.push("Lawn Care schema version is unsupported.");
  if (!Number.isSafeInteger(value.nextSessionId) || value.nextSessionId < 1) errors.push("Lawn Care next-session id is invalid.");
  if (!Array.isArray(value.processedSessionIds) || value.processedSessionIds.length > PROCESSED_LAWN_SESSION_LIMIT || new Set(value.processedSessionIds).size !== value.processedSessionIds.length) errors.push("Processed Lawn Care sessions are invalid.");
  if (!Array.isArray(value.history) || value.history.length > LAWN_CARE_HISTORY_LIMIT) errors.push("Lawn Care history is invalid.");
  const progress = value.progress;
  if (!progress || !Number.isInteger(progress.nextLevel) || progress.nextLevel < 1 || progress.nextLevel > LAWN_TOTAL_LEVELS) errors.push("Lawn Care next level is invalid.");
  if (!progress || !Number.isInteger(progress.completed) || progress.completed < 0 || progress.completed > LAWN_TOTAL_LEVELS) errors.push("Lawn Care completion count is invalid.");
  if (!progress?.best || typeof progress.best !== "object" || Array.isArray(progress.best)) errors.push("Lawn Care best results are invalid.");
  for (const [level, result] of Object.entries(progress?.best || {})) {
    const parsed = Number(level);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > LAWN_TOTAL_LEVELS || !result || !Number.isInteger(result.stars) || result.stars < 0 || result.stars > 3 || !Number.isInteger(result.percent) || result.percent < 0 || result.percent > 100) errors.push(`Lawn Care Level ${level} best result is invalid.`);
  }
  const completed = Object.values(progress?.best || {}).filter((result) => result.percent >= 50).length;
  if (progress && progress.completed !== completed) errors.push("Lawn Care completion count does not match its best results.");
  if (value.activeSession !== null) {
    const normalized = normalizeSession(value.activeSession);
    if (!normalized || JSON.stringify(normalized) !== JSON.stringify(value.activeSession)) errors.push("Active Lawn Care session is invalid.");
  }
  return { ok: errors.length === 0, errors };
}
