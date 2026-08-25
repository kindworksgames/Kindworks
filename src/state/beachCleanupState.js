import { BEACH_RUBBISH_ITEMS, BEACH_TOTAL_LEVELS, BeachCleanupEngine, beachCellKey, generateBeachLevel } from "../data/beachCleanup.js";

export const BEACH_CLEANUP_SCHEMA_VERSION = 1;
export const BEACH_HISTORY_LIMIT = 120;
export const PROCESSED_BEACH_SESSION_LIMIT = 300;

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
    if (!Number.isInteger(level) || level < 1 || level > BEACH_TOTAL_LEVELS || !result || typeof result !== "object") continue;
    best[String(level)] = { stars: whole(result.stars, 0, 3), percent: whole(result.percent, 0, 100) };
  }
  return {
    nextLevel: whole(value?.nextLevel, 1, BEACH_TOTAL_LEVELS, 1),
    completed: Object.values(best).filter((result) => result.percent >= 50).length,
    best,
  };
}

function validCellList(value, level) {
  return [...new Set((Array.isArray(value) ? value : []).map(String).filter((key) => {
    const [row, col] = key.split(",").map(Number);
    return Number.isInteger(row) && Number.isInteger(col) && [".", "R"].includes(level.rows[row]?.[col]);
  }))];
}

function normalizeUndoFrame(value, level) {
  if (!value || typeof value !== "object") return null;
  const row = whole(value.row, 0, level.height - 1, level.start[0]);
  const col = whole(value.col, 0, level.width - 1, level.start[1]);
  if (["U", "C", "T"].includes(level.rows[row]?.[col])) return null;
  const rakedCells = validCellList(value.rakedCells, level);
  const collectedCells = validCellList(value.collectedCells, level).filter((key) => {
    const [itemRow, itemCol] = key.split(",").map(Number);
    return level.rows[itemRow]?.[itemCol] === "R";
  });
  return {
    row, col, rakedCells, collectedCells,
    collectedItems: (Array.isArray(value.collectedItems) ? value.collectedItems : []).slice(0, collectedCells.length).map((item, index) => ({ icon: String(item?.icon || "🧹"), name: String(item?.name || "Rubbish"), coins: whole(item?.coins, 0, 170), cell: collectedCells[index] })),
    earnedCoins: whole(value.earnedCoins, 0, 170), moves: whole(value.moves), undoUsed: Boolean(value.undoUsed), steppedOnRaked: Boolean(value.steppedOnRaked),
  };
}

function normalizeSession(value) {
  if (!value || typeof value !== "object" || typeof value.id !== "string") return null;
  const assignedLevel = whole(value.assignedLevel, 1, BEACH_TOTAL_LEVELS, 1);
  const level = generateBeachLevel(assignedLevel);
  const row = whole(value.row, 0, level.height - 1, level.start[0]);
  const col = whole(value.col, 0, level.width - 1, level.start[1]);
  if (["U", "C", "T"].includes(level.rows[row]?.[col])) return null;
  const rakedCells = validCellList(value.rakedCells, level);
  const collectedCells = validCellList(value.collectedCells, level).filter((key) => {
    const [itemRow, itemCol] = key.split(",").map(Number);
    return level.rows[itemRow]?.[itemCol] === "R";
  });
  const collectedItems = (Array.isArray(value.collectedItems) ? value.collectedItems : []).filter((item) => item && BEACH_RUBBISH_ITEMS.some((source) => source.name === item.name)).slice(0, collectedCells.length).map((item, index) => ({
    icon: String(item.icon || "🧹"), name: String(item.name), coins: whole(item.coins, 0, 170), cell: collectedCells[index],
  }));
  const mode = value.mode === "town-job" ? "town-job" : "campaign";
  const session = {
    id: value.id, mode, targetId: mode === "town-job" ? "south-shore" : null, assignedLevel,
    status: value.status === "failed" ? "failed" : "playing", startedAt: iso(value.startedAt) || new Date(0).toISOString(),
    row, col, rakedCells, collectedCells, collectedItems,
    earnedCoins: whole(value.earnedCoins, 0, 170), bonusCoins: whole(value.bonusCoins, 0, 100), moves: whole(value.moves),
    undoUsed: Boolean(value.undoUsed), steppedOnRaked: Boolean(value.steppedOnRaked),
    challenges: { noUndo: Boolean(value.challenges?.noUndo), underMoves: Boolean(value.challenges?.underMoves), cleanSweep: Boolean(value.challenges?.cleanSweep) },
    undoStack: (Array.isArray(value.undoStack) ? value.undoStack : []).map((frame) => normalizeUndoFrame(frame, level)).filter(Boolean).slice(-30), won: false,
    returnPosition: value.returnPosition && Number.isFinite(value.returnPosition.x) && Number.isFinite(value.returnPosition.y) ? { x: Number(value.returnPosition.x), y: Number(value.returnPosition.y) } : { x: 3220, y: 2350 },
    returnFacing: ["up", "down", "left", "right"].includes(value.returnFacing) ? value.returnFacing : "down",
  };
  const verified = new BeachCleanupEngine(assignedLevel, session).snapshot();
  return { ...session, row: verified.row, col: verified.col, rakedCells: verified.rakedCells, collectedCells: verified.collectedCells };
}

export function createFreshBeachCleanupState() {
  return {
    schemaVersion: BEACH_CLEANUP_SCHEMA_VERSION,
    nextSessionId: 1,
    processedSessionIds: [],
    history: [],
    progress: { nextLevel: 1, completed: 0, best: {} },
    southShore: { dirty: true, litterCount: 18, dirtySinceDay: 1, lastCleanedDay: 0, nextDirtyDay: 1, cleanings: 0, lastRewardCoins: 0 },
    activeSession: null,
  };
}

export function normalizeBeachCleanupState(value) {
  const fresh = createFreshBeachCleanupState();
  if (!value || typeof value !== "object" || Array.isArray(value)) return fresh;
  const dirty = value.southShore?.dirty !== false;
  return {
    schemaVersion: BEACH_CLEANUP_SCHEMA_VERSION,
    nextSessionId: whole(value.nextSessionId, 1),
    processedSessionIds: [...new Set((Array.isArray(value.processedSessionIds) ? value.processedSessionIds : []).filter((id) => typeof id === "string"))].slice(-PROCESSED_BEACH_SESSION_LIMIT),
    history: (Array.isArray(value.history) ? value.history : []).filter((entry) => entry && typeof entry === "object").slice(-BEACH_HISTORY_LIMIT).map((entry) => structuredClone(entry)),
    progress: normalizeProgress(value.progress),
    southShore: {
      dirty, litterCount: dirty ? whole(value.southShore?.litterCount, 1, 50, 18) : 0,
      dirtySinceDay: dirty ? whole(value.southShore?.dirtySinceDay, 1, Number.MAX_SAFE_INTEGER, 1) : 0,
      lastCleanedDay: whole(value.southShore?.lastCleanedDay), nextDirtyDay: whole(value.southShore?.nextDirtyDay, 1, Number.MAX_SAFE_INTEGER, 1),
      cleanings: whole(value.southShore?.cleanings), lastRewardCoins: whole(value.southShore?.lastRewardCoins, 0, 170),
    },
    activeSession: normalizeSession(value.activeSession),
  };
}

export function projectLegacyBeachCleanup(legacy, currentValue = null) {
  const current = normalizeBeachCleanupState(currentValue);
  const source = legacy?.miniGames?.progress?.beach || legacy?.miniGameProgress?.beach || legacy?.progress?.beach;
  if (source && typeof source === "object") {
    const projected = normalizeProgress(source);
    for (const [level, result] of Object.entries(projected.best)) {
      const old = current.progress.best[level] || { stars: 0, percent: 0 };
      current.progress.best[level] = { stars: Math.max(old.stars, result.stars), percent: Math.max(old.percent, result.percent) };
    }
    current.progress.completed = Object.values(current.progress.best).filter((result) => result.percent >= 50).length;
    if (current.progress.completed === projected.completed) current.progress.nextLevel = projected.nextLevel;
  }
  const beachLitter = Number(legacy?.environment?.beachLitter ?? legacy?.beachLitter);
  if (Number.isFinite(beachLitter)) { current.southShore.dirty = beachLitter > 0; current.southShore.litterCount = whole(beachLitter, 0, 50); }
  return current;
}

export function validateBeachCleanupState(value) {
  const errors = [];
  if (!value || typeof value !== "object" || Array.isArray(value)) return { ok: false, errors: ["Beach Cleanup state is missing."] };
  if (value.schemaVersion !== BEACH_CLEANUP_SCHEMA_VERSION) errors.push("Beach Cleanup schema version is unsupported.");
  if (!Number.isSafeInteger(value.nextSessionId) || value.nextSessionId < 1) errors.push("Beach Cleanup next-session id is invalid.");
  if (!Array.isArray(value.processedSessionIds) || value.processedSessionIds.length > PROCESSED_BEACH_SESSION_LIMIT || new Set(value.processedSessionIds).size !== value.processedSessionIds.length) errors.push("Processed Beach Cleanup sessions are invalid.");
  if (!Array.isArray(value.history) || value.history.length > BEACH_HISTORY_LIMIT) errors.push("Beach Cleanup history is invalid.");
  const normalizedProgress = normalizeProgress(value.progress);
  if (JSON.stringify(normalizedProgress) !== JSON.stringify(value.progress)) errors.push("Beach Cleanup campaign progress is invalid.");
  const shore = value.southShore;
  if (!shore || typeof shore.dirty !== "boolean" || !Number.isInteger(shore.litterCount) || shore.litterCount < 0 || shore.litterCount > 50 || (!shore.dirty && shore.litterCount !== 0)) errors.push("South Shore cleanup state is invalid.");
  if (value.activeSession !== null) {
    const normalized = normalizeSession(value.activeSession);
    if (!normalized || JSON.stringify(normalized) !== JSON.stringify(value.activeSession)) errors.push("Active Beach Cleanup session is invalid.");
  }
  return { ok: errors.length === 0, errors };
}
