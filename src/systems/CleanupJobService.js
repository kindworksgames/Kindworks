import { CLEANUP_JOBS, TOTAL_CLEANUP_LEVELS } from "../data/cleanupJobs.js";
import {
  WASTE_CERTIFIED_SOLUTIONS,
  WASTE_TOTAL_LEVELS,
  WasteCollectionEngine,
  validateWasteCatalogue,
  verifyWasteSolution,
  wasteLevelSummary,
} from "../data/wasteCollection.js";
import {
  CLEANUP_HISTORY_LIMIT,
  PROCESSED_CLEANUP_SESSION_LIMIT,
} from "../state/cleanupState.js";
import { COIN_LEDGER_LIMIT } from "../state/economyState.js";
import { removeLandItemsInto } from "./LivingEnvironmentService.js";

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
  constructor(gameState, repository, { now = () => Date.now(), jobs = CLEANUP_JOBS, environment = null } = {}) {
    this.gameState = gameState;
    this.repository = repository;
    this.now = now;
    this.jobs = jobs;
    this.environment = environment;
    this.catalogueValidation = validateWasteCatalogue();
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
    const job = this.jobs[targetId] || this.environment?.getLandJob?.(targetId);
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
    if (this.jobs[targetId]) return this.getTargetState(targetId)?.status === "available";
    return Boolean(this.environment?.getLandJob?.(targetId));
  }

  begin(targetId, { returnPosition = null, returnFacing = "down" } = {}) {
    const job = this.getJob(targetId);
    if (!job) return { ok: false, code: "unknown-target", message: "That cleanup target does not exist." };
    return this.commit((state) => {
      const cleanup = state.progress.cleanup;
      if (cleanup.activeSession) return { ok: false, code: "session-active", message: "A cleanup job is already active." };
      const environmentJob = !this.jobs[targetId];
      if (!environmentJob && cleanup.targets[targetId]?.status !== "available") return { ok: false, code: "target-clean", message: `${job.title} is already clean.` };
      const session = {
        id: `cleanup-${String(cleanup.nextSessionId).padStart(6, "0")}`,
        targetId,
        jobId: job.jobId,
        jobType: job.jobType,
        gameKey: job.gameKey,
        title: job.title,
        mode: "town-job",
        assignedLevel: cleanup.progress.waste.nextLevel,
        status: "playing",
        startedAt: new Date(this.now()).toISOString(),
        itemIds: job.items.map((item) => item.id),
        environmentJob,
        returnPosition: validReturnPosition(returnPosition, job.world.approach),
        returnFacing: ["up", "down", "left", "right"].includes(returnFacing) ? returnFacing : "down",
      };
      cleanup.nextSessionId += 1;
      cleanup.activeSession = session;
      state.player.scene = "WasteCollectionScene";
      return { ok: true, code: "cleanup-started", session: structuredClone(session), job: structuredClone(job) };
    });
  }

  beginCampaign(levelValue, { returnPosition = null, returnFacing = "down" } = {}) {
    const level = Math.floor(Number(levelValue));
    if (!Number.isInteger(level) || level < 1 || level > WASTE_TOTAL_LEVELS) return { ok: false, code: "invalid-level", message: "Choose a Waste Collection level from 1 to 750." };
    const job = Object.values(this.jobs)[0];
    return this.commit((state) => {
      const cleanup = state.progress.cleanup;
      if (cleanup.activeSession) return { ok: false, code: "session-active", message: "A cleanup job is already active." };
      const session = {
        id: `cleanup-${String(cleanup.nextSessionId).padStart(6, "0")}`,
        mode: "campaign",
        targetId: job.id,
        jobId: job.jobId,
        jobType: job.jobType,
        gameKey: job.gameKey,
        title: "Waste Collection Campaign",
        assignedLevel: level,
        status: "playing",
        startedAt: new Date(this.now()).toISOString(),
        removedIds: [],
        tray: [],
        moves: 0,
        matches: 0,
        returnPosition: validReturnPosition(returnPosition, job.world.approach),
        returnFacing: ["up", "down", "left", "right"].includes(returnFacing) ? returnFacing : "down",
      };
      cleanup.nextSessionId += 1;
      cleanup.activeSession = session;
      state.player.scene = "WasteCollectionScene";
      return { ok: true, code: "waste-campaign-started", session: structuredClone(session), level: wasteLevelSummary(level) };
    });
  }

  getCampaignSnapshot() {
    const state = this.gameState.getSnapshot();
    const progress = state.progress.cleanup.progress.waste;
    return {
      ...structuredClone(progress),
      totalStars: Object.values(progress.best).reduce((sum, result) => sum + result.stars, 0),
      totalLevels: WASTE_TOTAL_LEVELS,
    };
  }

  getCampaignSessionState() {
    const active = this.getActiveSession();
    if (!active || active.mode !== "campaign") return null;
    return new WasteCollectionEngine(active.assignedLevel, {
      removedIds: active.removedIds,
      tray: active.tray,
      moves: active.moves,
      matches: active.matches,
      ended: active.status === "failed",
      won: false,
    }).snapshot();
  }

  applyCampaignWin(state, session, engine) {
    const cleanup = state.progress.cleanup;
    const progress = cleanup.progress.waste;
    const old = progress.best[String(session.assignedLevel)] || { stars: 0, percent: 0 };
    const firstClear = old.percent < MIN_CLEANUP_REWARD_PERCENT;
    const rewardCoins = firstClear ? calculateCleanupReward(100, session.assignedLevel) : 0;
    const completedAt = new Date(this.now()).toISOString();
    if (state.economy.coins + rewardCoins > Number.MAX_SAFE_INTEGER) return { ok: false, code: "balance-overflow", message: "Coin balance limit reached." };
    let ledger = null;
    if (rewardCoins > 0) {
      const transactionId = `coin-${String(state.economy.nextTransactionId).padStart(6, "0")}`;
      state.economy.nextTransactionId += 1;
      state.economy.coins += rewardCoins;
      state.economy.lifetimeCoinsEarned += rewardCoins;
      ledger = {
        id: transactionId,
        amount: rewardCoins,
        kind: "campaign-first-clear",
        reason: `Waste Collection Level ${session.assignedLevel} first clear`,
        itemId: null,
        quantity: null,
        sessionId: session.id,
        jobId: session.jobId,
        jobType: session.jobType,
        targetId: null,
        level: session.assignedLevel,
        percent: 100,
        stars: 3,
        occurredAt: completedAt,
      };
      state.economy.ledger.push(ledger);
      state.economy.ledger = state.economy.ledger.slice(-COIN_LEDGER_LIMIT);
    }
    progress.best[String(session.assignedLevel)] = { stars: Math.max(old.stars, 3), percent: 100 };
    progress.completed = Object.values(progress.best).filter((result) => result.percent >= MIN_CLEANUP_REWARD_PERCENT).length;
    progress.nextLevel = session.assignedLevel >= WASTE_TOTAL_LEVELS ? 1 : session.assignedLevel + 1;
    cleanup.processedSessionIds.push(session.id);
    cleanup.processedSessionIds = cleanup.processedSessionIds.slice(-PROCESSED_CLEANUP_SESSION_LIMIT);
    cleanup.history.push({
      sessionId: session.id,
      mode: "campaign",
      targetId: null,
      jobId: session.jobId,
      jobType: session.jobType,
      assignedLevel: session.assignedLevel,
      status: "completed",
      percent: 100,
      stars: 3,
      rewardCoins,
      firstClear,
      moves: engine.moves,
      matches: engine.matches,
      endedAt: completedAt,
    });
    cleanup.history = cleanup.history.slice(-CLEANUP_HISTORY_LIMIT);
    cleanup.activeSession = null;
    return {
      ok: true,
      code: "waste-campaign-completed",
      result: { level: session.assignedLevel, stars: 3, percent: 100, moves: engine.moves, matches: engine.matches, firstClear, rewardCoins },
      balance: state.economy.coins,
      nextLevel: progress.nextLevel,
      ledger: ledger ? structuredClone(ledger) : null,
    };
  }

  selectCampaignTile(sessionId, tileId) {
    return this.commit((state) => {
      const session = state.progress.cleanup.activeSession;
      if (!session || session.id !== sessionId || session.mode !== "campaign") return { ok: false, code: "unknown-session", message: "That Waste Collection campaign is no longer active." };
      if (session.status === "failed") return { ok: false, code: "attempt-ended", message: "The tray is full. Retry this level to continue." };
      const engine = new WasteCollectionEngine(session.assignedLevel, session);
      const selected = engine.select(tileId);
      if (!selected.ok) return selected;
      if (engine.won) return this.applyCampaignWin(state, session, engine);
      const snapshot = engine.snapshot();
      session.removedIds = snapshot.removedIds;
      session.tray = snapshot.tray;
      session.moves = snapshot.moves;
      session.matches = snapshot.matches;
      session.status = snapshot.ended ? "failed" : "playing";
      return { ...selected, campaignState: snapshot };
    });
  }

  restartCampaign(sessionId) {
    return this.commit((state) => {
      const session = state.progress.cleanup.activeSession;
      if (!session || session.id !== sessionId || session.mode !== "campaign") return { ok: false, code: "unknown-session", message: "That Waste Collection campaign is no longer active." };
      session.status = "playing";
      session.startedAt = new Date(this.now()).toISOString();
      session.removedIds = [];
      session.tray = [];
      session.moves = 0;
      session.matches = 0;
      return { ok: true, code: "waste-campaign-restarted", session: structuredClone(session) };
    });
  }

  completeCertifiedCampaign(sessionId) {
    return this.commit((state) => {
      const session = state.progress.cleanup.activeSession;
      if (!session || session.id !== sessionId || session.mode !== "campaign") return { ok: false, code: "unknown-session", message: "That Waste Collection campaign is no longer active." };
      const verification = verifyWasteSolution(session.assignedLevel);
      if (!verification.ok) return { ok: false, code: "certificate-failed", message: verification.reason };
      const engine = new WasteCollectionEngine(session.assignedLevel);
      for (const tileId of WASTE_CERTIFIED_SOLUTIONS[session.assignedLevel]) engine.select(tileId);
      return this.applyCampaignWin(state, session, engine);
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
    if (!active || active.id !== sessionId || active.mode === "campaign") return { ok: false, code: "unknown-session", message: "That cleanup session is no longer active." };
    const job = this.getJob(active.targetId);
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
      if (!session.environmentJob && nextCleanup.targets[session.targetId]?.status !== "available") return { ok: false, code: "target-clean", message: "This cleanup target has already been completed." };
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

      let environmentEffect = null;
      if (session.environmentJob) environmentEffect = removeLandItemsInto(state, session.itemIds);
      else nextCleanup.targets[session.targetId] = {
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
        environmentEffect,
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
        mode: session.mode || "town-job",
        targetId: session.mode === "campaign" ? null : session.targetId,
        jobId: session.jobId,
        jobType: session.jobType,
        assignedLevel: session.assignedLevel,
        status: "cancelled",
        percent: session.mode === "campaign" ? new WasteCollectionEngine(session.assignedLevel, session).snapshot().percent : 0,
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
      wasteProgress: this.getCampaignSnapshot(),
      completedJobCount: state.progress.completedJobCount,
      historyEntries: cleanup.history.length,
      processedSessions: cleanup.processedSessionIds.length,
      totalLevels: TOTAL_CLEANUP_LEVELS,
      catalogueValid: this.catalogueValidation.ok,
      rubbishTypes: 40,
      certifiedSolutions: WASTE_TOTAL_LEVELS,
      persistentEnvironmentJobs: this.environment?.getLandJobs?.().length || 0,
      build: "72.0.1-phase19-embedded-landscape",
    };
  }
}
