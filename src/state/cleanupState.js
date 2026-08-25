import { CLEANUP_JOBS, COMMONS_RUBBISH_JOB, TOTAL_CLEANUP_LEVELS } from "../data/cleanupJobs.js";

export const CLEANUP_SCHEMA_VERSION = 1;
export const CLEANUP_HISTORY_LIMIT = 100;
export const PROCESSED_CLEANUP_SESSION_LIMIT = 300;

function freshTargetState() {
  return {
    status: "available",
    completedAt: null,
    completionPercent: 0,
    rewardCoins: 0,
  };
}

export function createFreshCleanupState() {
  return {
    schemaVersion: CLEANUP_SCHEMA_VERSION,
    nextSessionId: 1,
    activeSession: null,
    processedSessionIds: [],
    history: [],
    targets: Object.fromEntries(Object.keys(CLEANUP_JOBS).map((id) => [id, freshTargetState()])),
    progress: {
      waste: { nextLevel: 1, completed: 0, best: {} },
    },
  };
}

export function normalizeCleanupState(value) {
  const fresh = createFreshCleanupState();
  if (!value || typeof value !== "object" || Array.isArray(value)) return fresh;
  const next = structuredClone(fresh);
  next.nextSessionId = Number.isSafeInteger(value.nextSessionId) && value.nextSessionId > 0 ? value.nextSessionId : 1;
  next.activeSession = value.activeSession && typeof value.activeSession === "object" ? structuredClone(value.activeSession) : null;
  next.processedSessionIds = Array.isArray(value.processedSessionIds)
    ? [...new Set(value.processedSessionIds.filter((id) => typeof id === "string" && id).slice(-PROCESSED_CLEANUP_SESSION_LIMIT))]
    : [];
  next.history = Array.isArray(value.history)
    ? value.history.filter((entry) => entry && typeof entry === "object").slice(-CLEANUP_HISTORY_LIMIT).map((entry) => structuredClone(entry))
    : [];
  for (const id of Object.keys(CLEANUP_JOBS)) {
    const source = value.targets?.[id];
    if (!source || typeof source !== "object") continue;
    const completed = source.status === "completed";
    next.targets[id] = {
      status: completed ? "completed" : "available",
      completedAt: completed && !Number.isNaN(new Date(source.completedAt).getTime()) ? new Date(source.completedAt).toISOString() : null,
      completionPercent: completed ? 100 : 0,
      rewardCoins: completed && Number.isSafeInteger(source.rewardCoins) && source.rewardCoins >= 0 ? source.rewardCoins : 0,
    };
  }
  const waste = value.progress?.waste;
  if (waste && typeof waste === "object") {
    next.progress.waste.nextLevel = Number.isInteger(waste.nextLevel)
      ? Math.max(1, Math.min(TOTAL_CLEANUP_LEVELS, waste.nextLevel))
      : 1;
    next.progress.waste.completed = Number.isInteger(waste.completed)
      ? Math.max(0, Math.min(TOTAL_CLEANUP_LEVELS, waste.completed))
      : 0;
    if (waste.best && typeof waste.best === "object" && !Array.isArray(waste.best)) {
      next.progress.waste.best = {};
      for (const [level, result] of Object.entries(waste.best)) {
        const parsed = Number(level);
        if (!Number.isInteger(parsed) || parsed < 1 || parsed > TOTAL_CLEANUP_LEVELS || !result || typeof result !== "object") continue;
        next.progress.waste.best[String(parsed)] = {
          stars: Math.max(0, Math.min(3, Math.floor(Number(result.stars) || 0))),
          percent: Math.max(0, Math.min(100, Math.round(Number(result.percent) || 0))),
        };
      }
    }
  }
  return next;
}

export function validateCleanupState(cleanup) {
  const errors = [];
  if (!cleanup || typeof cleanup !== "object" || Array.isArray(cleanup)) return { ok: false, errors: ["Cleanup state is missing."] };
  if (cleanup.schemaVersion !== CLEANUP_SCHEMA_VERSION) errors.push("Cleanup schema version is unsupported.");
  if (!Number.isSafeInteger(cleanup.nextSessionId) || cleanup.nextSessionId < 1) errors.push("Cleanup next-session id is invalid.");
  if (!Array.isArray(cleanup.processedSessionIds) || cleanup.processedSessionIds.length > PROCESSED_CLEANUP_SESSION_LIMIT || new Set(cleanup.processedSessionIds).size !== cleanup.processedSessionIds.length) errors.push("Processed cleanup sessions are invalid.");
  if (!Array.isArray(cleanup.history) || cleanup.history.length > CLEANUP_HISTORY_LIMIT) errors.push("Cleanup history is invalid.");
  for (const id of Object.keys(CLEANUP_JOBS)) {
    const target = cleanup.targets?.[id];
    if (!target || !["available", "completed"].includes(target.status)) errors.push(`${id} cleanup target is invalid.`);
    else if (target.status === "completed" && (target.completionPercent !== 100 || Number.isNaN(new Date(target.completedAt).getTime()) || !Number.isSafeInteger(target.rewardCoins) || target.rewardCoins < 0)) errors.push(`${id} completion record is invalid.`);
  }
  const progress = cleanup.progress?.waste;
  if (!progress || !Number.isInteger(progress.nextLevel) || progress.nextLevel < 1 || progress.nextLevel > TOTAL_CLEANUP_LEVELS) errors.push("Waste Collection next level is invalid.");
  if (!progress || !Number.isInteger(progress.completed) || progress.completed < 0 || progress.completed > TOTAL_CLEANUP_LEVELS) errors.push("Waste Collection completion count is invalid.");
  if (!progress?.best || typeof progress.best !== "object" || Array.isArray(progress.best)) errors.push("Waste Collection best results are invalid.");
  const session = cleanup.activeSession;
  if (session !== null) {
    if (!session || typeof session !== "object" || typeof session.id !== "string") errors.push("Active cleanup session is invalid.");
    else {
      if (session.targetId !== COMMONS_RUBBISH_JOB.id || session.jobId !== COMMONS_RUBBISH_JOB.jobId || session.jobType !== "waste") errors.push("Active cleanup session target is invalid.");
      if (!Number.isInteger(session.assignedLevel) || session.assignedLevel < 1 || session.assignedLevel > TOTAL_CLEANUP_LEVELS) errors.push("Active cleanup level is invalid.");
      const expectedIds = new Set(COMMONS_RUBBISH_JOB.items.map((item) => item.id));
      if (!Array.isArray(session.itemIds) || session.itemIds.length !== expectedIds.size || new Set(session.itemIds).size !== session.itemIds.length || session.itemIds.some((id) => !expectedIds.has(id))) errors.push("Active cleanup item snapshot is invalid.");
      if (!session.returnPosition || !Number.isFinite(session.returnPosition.x) || !Number.isFinite(session.returnPosition.y)) errors.push("Active cleanup return position is invalid.");
      if (!["up", "down", "left", "right"].includes(session.returnFacing)) errors.push("Active cleanup return direction is invalid.");
      if (session.status !== "playing" || Number.isNaN(new Date(session.startedAt).getTime())) errors.push("Active cleanup session lifecycle is invalid.");
    }
  }
  return { ok: errors.length === 0, errors };
}
