import {
  LAWN_MOWER_PROFILES,
  LAWN_TOTAL_LEVELS,
  LawnCareEngine,
  getLawnLevel,
  lawnLevelSummary,
  validateLawnCatalogue,
  verifyLawnSolution,
} from "../data/lawnCare.js";
import { LAWN_CONFIG, LAWN_PLOTS, lawnNeedsCare } from "../data/farming.js";
import {
  LAWN_CARE_HISTORY_LIMIT,
  PROCESSED_LAWN_SESSION_LIMIT,
} from "../state/lawnCareState.js";
import { COIN_LEDGER_LIMIT } from "../state/economyState.js";
import { registerRestorationCleanupInto } from "../state/restorationMilestoneState.js";

export const MIN_LAWN_REWARD_PERCENT = 50;
export const MAX_LAWN_REWARD_COINS = 170;

export function calculateLawnReward(percentValue, levelValue = 1) {
  const percent = Math.max(0, Math.min(100, Number(percentValue) || 0));
  if (percent < MIN_LAWN_REWARD_PERCENT) return 0;
  const level = Math.max(1, Math.min(LAWN_TOTAL_LEVELS, Math.floor(Number(levelValue) || 1)));
  const bonus = Math.min(70, Math.floor((level - 1) / 50) * 5);
  return Math.min(MAX_LAWN_REWARD_COINS, Math.round(percent) + bonus);
}

function validReturnPosition(position, fallback) {
  return position && Number.isFinite(position.x) && Number.isFinite(position.y)
    ? { x: Number(position.x), y: Number(position.y) }
    : { ...fallback };
}

function engineFields(engine) {
  const snapshot = engine.snapshot();
  return {
    row: snapshot.row,
    col: snapshot.col,
    facing: snapshot.facing,
    cutCells: snapshot.cutCells,
    moves: snapshot.moves,
    undoStack: snapshot.undoStack,
  };
}

export class LawnCareService {
  constructor(gameState, repository, { now = () => Date.now() } = {}) {
    this.gameState = gameState;
    this.repository = repository;
    this.now = now;
    this.listeners = new Set();
    this.catalogueValidation = validateLawnCatalogue({ verifySolutions: false });
  }

  subscribe(listener) {
    if (typeof listener !== "function") throw new TypeError("A Lawn Care listener must be a function.");
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(result) {
    const snapshot = this.getSnapshot();
    for (const listener of this.listeners) listener(snapshot, result);
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
        message: "The Lawn Care change could not be saved, so the previous state was restored.",
        save: saved,
        rollbackOk: rollback.ok,
      };
    }
    const result = { ...mutation, state: this.gameState.getSnapshot(), save: saved };
    this.emit(result);
    return result;
  }

  getSnapshot() {
    return structuredClone(this.gameState.getSnapshot().lawnCare);
  }

  getActiveSession() {
    return this.getSnapshot().activeSession;
  }

  getCampaignSnapshot() {
    const progress = this.getSnapshot().progress;
    return {
      ...progress,
      totalStars: Object.values(progress.best).reduce((sum, result) => sum + result.stars, 0),
      totalLevels: LAWN_TOTAL_LEVELS,
    };
  }

  getMowerLoadout() {
    const inventory = this.gameState.getSnapshot().inventory;
    const mowerId = inventory.equipped?.mower || "starter-mower";
    return {
      mowerId,
      ...(LAWN_MOWER_PROFILES[mowerId] || LAWN_MOWER_PROFILES["starter-mower"]),
    };
  }

  beginCampaign(levelValue, { returnPosition = null, returnFacing = "down" } = {}) {
    const level = Math.floor(Number(levelValue));
    if (!Number.isInteger(level) || level < 1 || level > LAWN_TOTAL_LEVELS) return { ok: false, code: "invalid-level", message: "Choose a Lawn Care level from 1 to 750." };
    return this.beginSession({ mode: "campaign", targetId: null, level, returnPosition, returnFacing });
  }

  beginTownJob(targetId, { returnPosition = null, returnFacing = "down" } = {}) {
    const plot = LAWN_PLOTS.find((entry) => entry.id === targetId);
    const lawn = this.gameState.getSnapshot().farming.lawns[targetId];
    if (!plot || !lawn) return { ok: false, code: "unknown-lawn", message: "That lawn does not exist." };
    if (!lawnNeedsCare(lawn)) return { ok: false, code: "lawn-tidy", message: "This lawn does not need care yet." };
    const level = this.getSnapshot().progress.nextLevel;
    return this.beginSession({ mode: "town-job", targetId, level, returnPosition, returnFacing });
  }

  beginSession({ mode, targetId, level, returnPosition, returnFacing }) {
    const plot = LAWN_PLOTS.find((entry) => entry.id === targetId);
    return this.commit((state) => {
      if (state.lawnCare.activeSession) return { ok: false, code: "session-active", message: "A Lawn Care attempt is already active." };
      const lawn = targetId ? state.farming.lawns[targetId] : null;
      if (mode === "town-job" && (!lawn || !lawnNeedsCare(lawn))) return { ok: false, code: "lawn-tidy", message: "This lawn no longer needs care." };
      const engine = new LawnCareEngine(level);
      const session = {
        id: `lawn-${String(state.lawnCare.nextSessionId).padStart(6, "0")}`,
        mode,
        targetId,
        assignedLevel: level,
        status: "playing",
        startedAt: new Date(this.now()).toISOString(),
        ...engineFields(engine),
        lawnStart: mode === "town-job" ? { grassHeight: lawn.grassHeight, weedPressure: lawn.weedPressure } : null,
        returnPosition: validReturnPosition(returnPosition, plot ? { x: plot.x, y: plot.y + 140 } : { x: 305, y: 530 }),
        returnFacing: ["up", "down", "left", "right"].includes(returnFacing) ? returnFacing : "down",
      };
      state.lawnCare.nextSessionId += 1;
      state.lawnCare.activeSession = session;
      state.player.scene = "LawnCareScene";
      return { ok: true, code: mode === "campaign" ? "lawn-campaign-started" : "lawn-job-started", session: structuredClone(session), level: lawnLevelSummary(level) };
    });
  }

  getSessionState() {
    const session = this.getActiveSession();
    if (!session) return null;
    return new LawnCareEngine(session.assignedLevel, session).snapshot();
  }

  move(sessionId, direction) {
    return this.commit((state) => {
      const session = state.lawnCare.activeSession;
      if (!session || session.id !== sessionId) return { ok: false, code: "unknown-session", message: "That Lawn Care attempt is no longer active." };
      if (session.status === "failed") return { ok: false, code: "attempt-ended", message: "Retry this level before mowing again." };
      const engine = new LawnCareEngine(session.assignedLevel, session);
      const moved = engine.move(direction);
      if (!moved.ok) return moved;
      Object.assign(session, engineFields(engine));
      if (!engine.ended) return { ...moved, session: structuredClone(session), lawnState: engine.snapshot() };
      if (engine.stars < 1) {
        session.status = "failed";
        return { ...moved, code: "lawn-attempt-failed", failed: true, result: this.resultFromEngine(engine), session: structuredClone(session) };
      }
      return this.applyResult(state, session, engine);
    });
  }

  undo(sessionId) {
    return this.commit((state) => {
      const session = state.lawnCare.activeSession;
      if (!session || session.id !== sessionId) return { ok: false, code: "unknown-session", message: "That Lawn Care attempt is no longer active." };
      const engine = new LawnCareEngine(session.assignedLevel, session);
      const undone = engine.undo();
      if (!undone.ok) return undone;
      Object.assign(session, engineFields(engine));
      session.status = "playing";
      return { ...undone, session: structuredClone(session), lawnState: engine.snapshot() };
    });
  }

  hint(sessionId, maxStates = 250000) {
    const session = this.getActiveSession();
    if (!session || session.id !== sessionId) return { ok: false, code: "unknown-session", message: "That Lawn Care attempt is no longer active." };
    const engine = new LawnCareEngine(session.assignedLevel, session);
    const hint = engine.hint(maxStates);
    return {
      ok: hint.status === "solved",
      code: hint.status === "solved" ? "lawn-hint" : `lawn-hint-${hint.status}`,
      direction: hint.path[0] || null,
      remainingMoves: hint.path.length,
      states: hint.states,
      message: hint.status === "solved" && hint.path.length ? `Try ${hint.path[0]} next. ${hint.path.length} optimal swipes remain.` : hint.status === "solved" ? "The lawn is already fully cut." : "No certified finishing route remains from here.",
    };
  }

  restart(sessionId) {
    return this.commit((state) => {
      const session = state.lawnCare.activeSession;
      if (!session || session.id !== sessionId) return { ok: false, code: "unknown-session", message: "That Lawn Care attempt is no longer active." };
      const engine = new LawnCareEngine(session.assignedLevel);
      Object.assign(session, engineFields(engine), { status: "playing", startedAt: new Date(this.now()).toISOString() });
      return { ok: true, code: "lawn-restarted", session: structuredClone(session), lawnState: engine.snapshot() };
    });
  }

  completeCertified(sessionId) {
    return this.commit((state) => {
      const session = state.lawnCare.activeSession;
      if (!session || session.id !== sessionId) return { ok: false, code: "unknown-session", message: "That Lawn Care attempt is no longer active." };
      const verification = verifyLawnSolution(session.assignedLevel);
      if (!verification.ok) return { ok: false, code: "certificate-failed", message: verification.reason };
      const engine = new LawnCareEngine(session.assignedLevel);
      for (const direction of getLawnLevel(session.assignedLevel).canonicalSolution) engine.move(direction);
      return this.applyResult(state, session, engine);
    });
  }

  resultFromEngine(engine) {
    return {
      level: engine.level.id,
      percent: engine.percent,
      stars: engine.stars,
      moves: engine.moves,
      moveLimit: engine.moveLimit,
      optimalMoves: engine.level.canonicalSolution.length,
    };
  }

  appendLedger(state, { amount, kind, reason, session, result, targetId }) {
    const id = `coin-${String(state.economy.nextTransactionId).padStart(6, "0")}`;
    state.economy.nextTransactionId += 1;
    const ledger = {
      id,
      amount,
      kind,
      reason,
      itemId: null,
      quantity: null,
      sessionId: session.id,
      jobType: "lawn",
      targetId,
      level: session.assignedLevel,
      percent: result.percent,
      stars: result.stars,
      occurredAt: new Date(this.now()).toISOString(),
    };
    state.economy.ledger.push(ledger);
    state.economy.ledger = state.economy.ledger.slice(-COIN_LEDGER_LIMIT);
    return ledger;
  }

  applyResult(state, session, engine) {
    const lawnCare = state.lawnCare;
    const result = this.resultFromEngine(engine);
    const completedAt = new Date(this.now()).toISOString();
    let firstClear = false;
    let rewardCoins = calculateLawnReward(result.percent, session.assignedLevel);
    let townEffect = null;
    if (session.mode === "campaign") {
      const old = lawnCare.progress.best[String(session.assignedLevel)] || { stars: 0, percent: 0 };
      firstClear = old.percent < MIN_LAWN_REWARD_PERCENT;
      if (!firstClear) rewardCoins = 0;
      lawnCare.progress.best[String(session.assignedLevel)] = {
        stars: Math.max(old.stars, result.stars),
        percent: Math.max(old.percent, result.percent),
      };
      lawnCare.progress.completed = Object.values(lawnCare.progress.best).filter((entry) => entry.percent >= MIN_LAWN_REWARD_PERCENT).length;
      lawnCare.progress.nextLevel = session.assignedLevel >= LAWN_TOTAL_LEVELS ? 1 : session.assignedLevel + 1;
    } else {
      const lawn = state.farming.lawns[session.targetId];
      if (!lawn) return { ok: false, code: "unknown-lawn", message: "The town lawn is no longer available." };
      const portion = result.percent / 100;
      lawn.grassHeight = LAWN_CONFIG.freshlyCutHeight + (Math.max(LAWN_CONFIG.freshlyCutHeight, session.lawnStart.grassHeight) - LAWN_CONFIG.freshlyCutHeight) * (1 - portion);
      lawn.weedPressure = LAWN_CONFIG.freshlyWeededPressure + (Math.max(LAWN_CONFIG.freshlyWeededPressure, session.lawnStart.weedPressure) - LAWN_CONFIG.freshlyWeededPressure) * (1 - portion);
      lawn.completedJobs += 1;
      lawn.lastCompletedAt = completedAt;
      state.progress.completedJobCount += 1;
      townEffect = { lawnId: session.targetId, grassHeight: lawn.grassHeight, weedPressure: lawn.weedPressure };
    }
    if (state.economy.coins + rewardCoins > Number.MAX_SAFE_INTEGER) return { ok: false, code: "balance-overflow", message: "Coin balance limit reached." };
    let ledger = null;
    if (rewardCoins > 0) {
      state.economy.coins += rewardCoins;
      state.economy.lifetimeCoinsEarned += rewardCoins;
      ledger = this.appendLedger(state, {
        amount: rewardCoins,
        kind: session.mode === "campaign" ? "campaign-first-clear" : "job-reward",
        reason: session.mode === "campaign" ? `Lawn Care Level ${session.assignedLevel} first clear` : `Mowed ${LAWN_PLOTS.find((plot) => plot.id === session.targetId)?.title || "town lawn"}`,
        session,
        result,
        targetId: session.mode === "campaign" ? null : session.targetId,
      });
    }
    lawnCare.processedSessionIds.push(session.id);
    lawnCare.processedSessionIds = lawnCare.processedSessionIds.slice(-PROCESSED_LAWN_SESSION_LIMIT);
    lawnCare.history.push({
      sessionId: session.id,
      mode: session.mode,
      targetId: session.targetId,
      assignedLevel: session.assignedLevel,
      status: "completed",
      percent: result.percent,
      stars: result.stars,
      rewardCoins,
      firstClear,
      moves: result.moves,
      endedAt: completedAt,
    });
    lawnCare.history = lawnCare.history.slice(-LAWN_CARE_HISTORY_LIMIT);
    lawnCare.activeSession = null;
    const plot = LAWN_PLOTS.find((entry) => entry.id === session.targetId);
    const restoration = session.mode === "town-job" ? registerRestorationCleanupInto(state, {
      eventId: session.id,
      jobType: "lawn",
      percent: result.percent,
      worldPosition: plot ? { x: plot.x, y: plot.y } : session.returnPosition,
      occurredAt: completedAt,
    }) : null;
    return {
      ok: true,
      code: session.mode === "campaign" ? "lawn-campaign-completed" : "lawn-job-completed",
      result: { ...result, rewardCoins, firstClear },
      rewardCoins,
      firstClear,
      balance: state.economy.coins,
      nextLevel: lawnCare.progress.nextLevel,
      townEffect,
      ledger: ledger ? structuredClone(ledger) : null,
      restoration,
    };
  }

  cancel(sessionId = null) {
    return this.commit((state) => {
      const session = state.lawnCare.activeSession;
      if (!session || (sessionId && session.id !== sessionId)) return { ok: false, code: "unknown-session", message: "There is no matching Lawn Care attempt." };
      state.lawnCare.history.push({
        sessionId: session.id,
        mode: session.mode,
        targetId: session.targetId,
        assignedLevel: session.assignedLevel,
        status: "cancelled",
        percent: new LawnCareEngine(session.assignedLevel, session).percent,
        stars: 0,
        rewardCoins: 0,
        firstClear: false,
        moves: session.moves,
        endedAt: new Date(this.now()).toISOString(),
      });
      state.lawnCare.history = state.lawnCare.history.slice(-LAWN_CARE_HISTORY_LIMIT);
      state.lawnCare.activeSession = null;
      state.player.scene = "TownScene";
      return { ok: true, code: "lawn-cancelled", session: structuredClone(session) };
    });
  }

  getDiagnostics() {
    const state = this.getSnapshot();
    return {
      catalogueValid: this.catalogueValidation.ok,
      catalogueIssues: [...this.catalogueValidation.issues],
      totalLevels: LAWN_TOTAL_LEVELS,
      progress: this.getCampaignSnapshot(),
      activeSession: state.activeSession,
      mower: this.getMowerLoadout(),
      townJobs: LAWN_PLOTS.filter((plot) => lawnNeedsCare(this.gameState.getSnapshot().farming.lawns[plot.id])).map((plot) => plot.id),
    };
  }
}
