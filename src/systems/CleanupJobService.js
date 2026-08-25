import { CLEANUP_JOBS, TOTAL_CLEANUP_LEVELS } from "../data/cleanupJobs.js";
import {
  CLEANUP_HISTORY_LIMIT,
  PROCESSED_CLEANUP_SESSION_LIMIT,
} from "../state/cleanupState.js";
import { COIN_LEDGER_LIMIT } from "../state/economyState.js";

export const MIN_CLEANUP_REWARD_PERCENT = 50;
export const MAX_CLEANUP_REWARD_COINS = 170;

export function calculateCleanupReward(percentValue, levelValue = 1) {
  const percent = Math.max(0, Math.min(100, Number(percentValue) || 0));
  if (percent < MIN_CLEANUP_REWARD_PERCENT) return 0;
  const level = Math.max(1, Math.min(TOTAL_CLEANUP_LEVELS, Math.floor(Number(levelValue) || 1)));
  const levelBonus = Math.min(70, Math.floor((level - 1) / 50) * 5);
  return Math.min(MAX_CLEANUP_REWARD_COINS, Math.round(percent) + levelBonus);
}

function validReturnPosition(position, fallback) {
  return position && Number.isFinite(position.x) && Number.isFinite(position.y)
    ? { x: Number(position.x), y: Number(position.y) }
    : { ...fallback };
}

export class CleanupJobService {
  constructor(gameState, repository, { now = () => Date.now(), jobs = CLEANUP_JOBS } = {}) {
    this.gameState = gameState;
    this.repository = repository;
    this.now = now;
    this.jobs = jobs;
  }

  commit(mutator) {
    const checkpoint = this.gameState.getSnapshot();
    const working = structuredClone(checkpoint);
    const mutation = mutator(working);
    if (!mutation.ok) return mutation;
    working.updatedAt = new Date(this.now()).toISOString();
    const replaced = this.gameState.replace(working);
    if (!replaced.ok) return { ok: false, code: "state-validation", errors: replaced.errors };
    const saved = this.repository.save(working, { now: this.now() });
    if (!saved.ok) {
      const rollback = this.gameState.replace(checkpoint);
      return {
        ok: false,
        code: "persistence-failed",
        message: "The cleanup change could not be saved, so the previous town state was restored.",
        save: saved,
        rollbackOk: rollback.ok,
      };
    }
    return { ...mutation, state: this.gameState.getSnapshot(), save: saved };
  }

  getJob(targetId) {
    const job = this.jobs[targetId];
    return job ? structuredClone(job) : null;
  }

  getActiveSession() {
    return this.gameState.getSnapshot().progress.cleanup.activeSession;
  }

  getTargetState(targetId) {
    const target = this.gameState.getSnapshot().progress.cleanup.targets[targetId];
    return target ? structuredClone(target) : null;
  }

  isAvailable(targetId) {
    return Boolean(this.jobs[targetId] && this.getTargetState(targetId)?.status === "available");
  }

  begin(targetId, { returnPosition = null, returnFacing = "down" } = {}) {
    const job = this.jobs[targetId];
    if (!job) return { ok: false, code: "unknown-target", message: "That cleanup target does not exist." };
    return this.commit((state) => {
      const cleanup = state.progress.cleanup;
      if (cleanup.activeSession) return { ok: false, code: "session-active", message: "A cleanup job is already active." };
      if (cleanup.targets[targetId]?.status !== "available") return { ok: false, code: "target-clean", message: `${job.title} is already clean.` };
      const session = {
        id: `cleanup-${String(cleanup.nextSessionId).padStart(6, "0")}`,
        targetId,
        jobId: job.jobId,
        jobType: job.jobType,
        gameKey: job.gameKey,
        title: job.title,
        assignedLevel: cleanup.progress.waste.nextLevel,
        status: "playing",
        startedAt: new Date(this.now()).toISOString(),
        itemIds: job.items.map((item) => item.id),
        returnPosition: validReturnPosition(returnPosition, job.world.approach),
        returnFacing: ["up", "down", "left", "right"].includes(returnFacing) ? returnFacing : "down",
      };
      cleanup.nextSessionId += 1;
      cleanup.activeSession = session;
      state.player.scene = "WasteCollectionScene";
      return { ok: true, code: "cleanup-started", session: structuredClone(session), job: structuredClone(job) };
    });
  }

  complete(sessionId, { collectedItemIds = [] } = {}) {
    const snapshot = this.gameState.getSnapshot();
    const cleanup = snapshot.progress.cleanup;
    if (cleanup.processedSessionIds.includes(sessionId)) {
      const history = cleanup.history.find((entry) => entry.sessionId === sessionId && entry.status === "completed") || null;
      return { ok: true, code: "already-completed", duplicate: true, history: structuredClone(history) };
    }
    const active = cleanup.activeSession;
    if (!active || active.id !== sessionId) return { ok: false, code: "unknown-session", message: "That cleanup session is no longer active." };
    const job = this.jobs[active.targetId];
    if (!job) return { ok: false, code: "unknown-target", message: "The cleanup target no longer exists." };
    const expected = new Set(active.itemIds);
    const collected = [...new Set(collectedItemIds.filter((id) => expected.has(id)))];
    const percent = Math.round((collected.length / expected.size) * 100);
    if (collected.length !== expected.size) {
      return {
        ok: false,
        code: "incomplete-job",
        message: `Collect all ${expected.size} pieces before finishing the job.`,
        collected: collected.length,
        total: expected.size,
        percent,
      };
    }

    return this.commit((state) => {
      const nextCleanup = state.progress.cleanup;
      const session = nextCleanup.activeSession;
      if (!session || session.id !== sessionId) return { ok: false, code: "unknown-session", message: "That cleanup session is no longer active." };
      if (nextCleanup.targets[session.targetId]?.status !== "available") return { ok: false, code: "target-clean", message: "This cleanup target has already been completed." };
      const completedAt = new Date(this.now()).toISOString();
      const stars = 3;
      const rewardCoins = calculateCleanupReward(100, session.assignedLevel);
      if (state.economy.coins + rewardCoins > Number.MAX_SAFE_INTEGER) return { ok: false, code: "balance-overflow", message: "Coin balance limit reached." };

      const transactionId = `coin-${String(state.economy.nextTransactionId).padStart(6, "0")}`;
      state.economy.nextTransactionId += 1;
      state.economy.coins += rewardCoins;
      state.economy.lifetimeCoinsEarned += rewardCoins;
      state.economy.ledger.push({
        id: transactionId,
        amount: rewardCoins,
        kind: "job-reward",
        reason: `Cleaned ${job.title}`,
        itemId: null,
        quantity: null,
        sessionId,
        jobId: job.jobId,
        jobType: job.jobType,
        targetId: job.id,
        level: session.assignedLevel,
        percent: 100,
        stars,
        occurredAt: completedAt,
      });
      state.economy.ledger = state.economy.ledger.slice(-COIN_LEDGER_LIMIT);

      nextCleanup.targets[session.targetId] = {
        status: "completed",
        completedAt,
        completionPercent: 100,
        rewardCoins,
      };
      const progress = nextCleanup.progress.waste;
      const previous = progress.best[String(session.assignedLevel)] || { stars: 0, percent: 0 };
      progress.best[String(session.assignedLevel)] = {
        stars: Math.max(previous.stars, stars),
        percent: Math.max(previous.percent, 100),
      };
      progress.completed = Math.max(progress.completed, Object.keys(progress.best).length);
      progress.nextLevel = session.assignedLevel >= TOTAL_CLEANUP_LEVELS ? 1 : session.assignedLevel + 1;
      state.progress.completedJobCount += 1;
      nextCleanup.processedSessionIds.push(sessionId);
      nextCleanup.processedSessionIds = nextCleanup.processedSessionIds.slice(-PROCESSED_CLEANUP_SESSION_LIMIT);
      nextCleanup.history.push({
        sessionId,
        targetId: session.targetId,
        jobId: session.jobId,
        jobType: session.jobType,
        assignedLevel: session.assignedLevel,
        status: "completed",
        percent: 100,
        stars,
        rewardCoins,
        endedAt: completedAt,
      });
      nextCleanup.history = nextCleanup.history.slice(-CLEANUP_HISTORY_LIMIT);
      nextCleanup.activeSession = null;
      state.player = {
        scene: "TownScene",
        x: session.returnPosition.x,
        y: session.returnPosition.y,
        facing: session.returnFacing,
      };
      return {
        ok: true,
        code: "cleanup-completed",
        sessionId,
        targetId: session.targetId,
        percent: 100,
        stars,
        rewardCoins,
        balance: state.economy.coins,
        completedJobCount: state.progress.completedJobCount,
        nextLevel: progress.nextLevel,
        ledger: structuredClone(state.economy.ledger.at(-1)),
      };
    });
  }

  cancel(sessionId) {
    return this.commit((state) => {
      const cleanup = state.progress.cleanup;
      const session = cleanup.activeSession;
      if (!session || session.id !== sessionId) return { ok: false, code: "unknown-session", message: "That cleanup session is no longer active." };
      const endedAt = new Date(this.now()).toISOString();
      cleanup.history.push({
        sessionId,
        targetId: session.targetId,
        jobId: session.jobId,
        jobType: session.jobType,
        assignedLevel: session.assignedLevel,
        status: "cancelled",
        percent: 0,
        stars: 0,
        rewardCoins: 0,
        endedAt,
      });
      cleanup.history = cleanup.history.slice(-CLEANUP_HISTORY_LIMIT);
      cleanup.activeSession = null;
      state.player = {
        scene: "TownScene",
        x: session.returnPosition.x,
        y: session.returnPosition.y,
        facing: session.returnFacing,
      };
      return { ok: true, code: "cleanup-cancelled", sessionId, targetId: session.targetId };
    });
  }

  getDiagnostics() {
    const state = this.gameState.getSnapshot();
    const cleanup = state.progress.cleanup;
    return {
      activeSession: structuredClone(cleanup.activeSession),
      target: structuredClone(cleanup.targets[Object.keys(this.jobs)[0]]),
      wasteProgress: structuredClone(cleanup.progress.waste),
      completedJobCount: state.progress.completedJobCount,
      historyEntries: cleanup.history.length,
      processedSessions: cleanup.processedSessionIds.length,
      totalLevels: TOTAL_CLEANUP_LEVELS,
    };
  }
}
