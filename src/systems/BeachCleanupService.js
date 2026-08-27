import { BEACH_REWARD_CAP, BEACH_TOTAL_LEVELS, BeachCleanupEngine, beachCertifiedRoute, validateBeachCatalogue } from "../data/beachCleanup.js";
import { BEACH_HISTORY_LIMIT, PROCESSED_BEACH_SESSION_LIMIT } from "../state/beachCleanupState.js";
import { COIN_LEDGER_LIMIT } from "../state/economyState.js";
import { registerRestorationCleanupInto } from "../state/restorationMilestoneState.js";

export function calculateBeachCampaignReward(levelValue) {
  const level = Math.max(1, Math.min(BEACH_TOTAL_LEVELS, Math.floor(Number(levelValue) || 1)));
  return Math.min(BEACH_REWARD_CAP, 100 + Math.min(70, Math.floor((level - 1) / 50) * 5));
}

function returnPosition(value) {
  return value && Number.isFinite(value.x) && Number.isFinite(value.y) ? { x: Number(value.x), y: Number(value.y) } : { x: 3220, y: 2350 };
}

function engineFields(engine) {
  const state = engine.snapshot();
  return {
    row: state.row, col: state.col, rakedCells: state.rakedCells, collectedCells: state.collectedCells,
    rakePatterns: state.rakePatterns, entryDirection: state.entryDirection,
    collectedItems: state.collectedItems, earnedCoins: state.earnedCoins, bonusCoins: state.bonusCoins,
    moves: state.moves, undoUsed: state.undoUsed, steppedOnRaked: state.steppedOnRaked,
    challenges: state.challenges, undoStack: state.undoStack, won: false,
  };
}

export class BeachCleanupService {
  constructor(gameState, repository, { now = () => Date.now() } = {}) {
    this.gameState = gameState;
    this.repository = repository;
    this.now = now;
    this.catalogueValidation = validateBeachCatalogue();
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
      return { ok: false, code: "persistence-failed", message: "The Beach Cleanup change could not be saved, so the previous state was restored.", save: saved, rollbackOk: rollback.ok };
    }
    return { ...mutation, state: this.gameState.getSnapshot(), save: saved };
  }

  getSnapshot() { return structuredClone(this.gameState.getSnapshot().beachCleanup); }
  getActiveSession() { return this.getSnapshot().activeSession; }
  getSouthShoreSnapshot() { return this.getSnapshot().southShore; }
  isTownJobAvailable() { return this.getSouthShoreSnapshot().dirty; }
  getCampaignSnapshot() {
    const progress = this.getSnapshot().progress;
    return { ...progress, totalStars: Object.values(progress.best).reduce((sum, result) => sum + result.stars, 0), totalLevels: BEACH_TOTAL_LEVELS };
  }
  getSessionState() { const session = this.getActiveSession(); return session ? new BeachCleanupEngine(session.assignedLevel, session).snapshot() : null; }

  refresh() {
    const snapshot = this.gameState.getSnapshot();
    const shore = snapshot.beachCleanup.southShore;
    if (shore.dirty || snapshot.world.day < shore.nextDirtyDay) return { ok: true, changed: false, shore: structuredClone(shore) };
    return this.commit((state) => {
      const target = state.beachCleanup.southShore;
      const seed = (state.world.day * 1103515245 + (target.cleanings + 1) * 12345) >>> 0;
      Object.assign(target, { dirty: true, litterCount: 8 + (seed % 11), dirtySinceDay: state.world.day });
      return { ok: true, code: "south-shore-dirtied", changed: true, shore: structuredClone(target) };
    });
  }

  beginCampaign(levelValue, options = {}) {
    const level = Math.floor(Number(levelValue));
    if (!Number.isInteger(level) || level < 1 || level > BEACH_TOTAL_LEVELS) return { ok: false, code: "invalid-level", message: "Choose a Beach Cleanup level from 1 to 750." };
    return this.beginSession({ mode: "campaign", level, ...options });
  }

  beginTownJob(options = {}) {
    if (!this.isTownJobAvailable()) return { ok: false, code: "beach-clean", message: "South Shore is already clean." };
    return this.beginSession({ mode: "town-job", level: this.getCampaignSnapshot().nextLevel, ...options });
  }

  beginSession({ mode, level, returnPosition: position = null, returnFacing = "down" }) {
    return this.commit((state) => {
      if (state.beachCleanup.activeSession) return { ok: false, code: "session-active", message: "A Beach Cleanup attempt is already active." };
      if (mode === "town-job" && !state.beachCleanup.southShore.dirty) return { ok: false, code: "beach-clean", message: "South Shore is already clean." };
      const engine = new BeachCleanupEngine(level);
      const session = {
        id: `beach-${String(state.beachCleanup.nextSessionId).padStart(6, "0")}`,
        mode, targetId: mode === "town-job" ? "south-shore" : null, assignedLevel: level, status: "playing",
        startedAt: new Date(this.now()).toISOString(), ...engineFields(engine), returnPosition: returnPosition(position),
        returnFacing: ["up", "down", "left", "right"].includes(returnFacing) ? returnFacing : "down",
      };
      state.beachCleanup.nextSessionId += 1;
      state.beachCleanup.activeSession = session;
      state.player.scene = "BeachCleanupScene";
      return { ok: true, code: mode === "town-job" ? "beach-job-started" : "beach-campaign-started", session: structuredClone(session) };
    });
  }

  move(sessionId, direction) {
    return this.commit((state) => {
      const session = state.beachCleanup.activeSession;
      if (!session || session.id !== sessionId) return { ok: false, code: "unknown-session", message: "That Beach Cleanup attempt is no longer active." };
      const engine = new BeachCleanupEngine(session.assignedLevel, session);
      const moved = engine.move(direction);
      if (!moved.ok) return moved;
      Object.assign(session, engineFields(engine));
      if (!engine.won) return { ...moved, beachState: engine.snapshot() };
      return this.applyWin(state, session, engine);
    });
  }

  undo(sessionId) {
    return this.commit((state) => {
      const session = state.beachCleanup.activeSession;
      if (!session || session.id !== sessionId) return { ok: false, code: "unknown-session", message: "That Beach Cleanup attempt is no longer active." };
      const engine = new BeachCleanupEngine(session.assignedLevel, session);
      const undone = engine.undo();
      if (!undone.ok) return undone;
      Object.assign(session, engineFields(engine));
      return { ...undone, beachState: engine.snapshot() };
    });
  }

  toggleChallenge(sessionId, challenge) {
    return this.commit((state) => {
      const session = state.beachCleanup.activeSession;
      if (!session || session.id !== sessionId) return { ok: false, code: "unknown-session", message: "That Beach Cleanup attempt is no longer active." };
      const engine = new BeachCleanupEngine(session.assignedLevel, session);
      const toggled = engine.toggleChallenge(challenge);
      if (!toggled.ok) return toggled;
      Object.assign(session, engineFields(engine));
      return { ...toggled, beachState: engine.snapshot() };
    });
  }

  restart(sessionId) {
    return this.commit((state) => {
      const session = state.beachCleanup.activeSession;
      if (!session || session.id !== sessionId) return { ok: false, code: "unknown-session", message: "That Beach Cleanup attempt is no longer active." };
      Object.assign(session, engineFields(new BeachCleanupEngine(session.assignedLevel)), { startedAt: new Date(this.now()).toISOString() });
      return { ok: true, code: "beach-restarted", session: structuredClone(session) };
    });
  }

  completeCertified(sessionId) {
    return this.commit((state) => {
      const session = state.beachCleanup.activeSession;
      if (!session || session.id !== sessionId) return { ok: false, code: "unknown-session", message: "That Beach Cleanup attempt is no longer active." };
      const engine = new BeachCleanupEngine(session.assignedLevel);
      for (const direction of beachCertifiedRoute(session.assignedLevel)) { if (engine.won) break; const moved = engine.move(direction); if (!moved.ok) return moved; }
      if (!engine.won) return { ok: false, code: "certificate-failed", message: "The protected beach certificate did not clear this level." };
      return this.applyWin(state, session, engine);
    });
  }

  applyWin(state, session, engine) {
    if (state.beachCleanup.processedSessionIds.includes(session.id)) return { ok: false, code: "duplicate-session", message: "That beach result was already saved." };
    const completedAt = new Date(this.now()).toISOString();
    const progress = state.beachCleanup.progress;
    const old = progress.best[String(session.assignedLevel)] || { stars: 0, percent: 0 };
    const firstClear = old.percent < 50;
    const rewardCoins = session.mode === "campaign" ? (firstClear ? calculateBeachCampaignReward(session.assignedLevel) : 0) : engine.earnedCoins;
    if (state.economy.coins + rewardCoins > Number.MAX_SAFE_INTEGER) return { ok: false, code: "balance-overflow", message: "Coin balance limit reached." };
    if (rewardCoins > 0) {
      const id = `coin-${String(state.economy.nextTransactionId).padStart(6, "0")}`;
      state.economy.nextTransactionId += 1; state.economy.coins += rewardCoins; state.economy.lifetimeCoinsEarned += rewardCoins;
      state.economy.ledger.push({ id, amount: rewardCoins, kind: session.mode === "campaign" ? "campaign-first-clear" : "cleanup-job", reason: session.mode === "campaign" ? `Beach Cleanup Level ${session.assignedLevel} first clear` : "South Shore Beach cleanup", itemId: null, quantity: null, sessionId: session.id, jobType: "beach", targetId: session.targetId, level: session.assignedLevel, percent: 100, stars: 3, occurredAt: completedAt });
      state.economy.ledger = state.economy.ledger.slice(-COIN_LEDGER_LIMIT);
    }
    progress.best[String(session.assignedLevel)] = { stars: 3, percent: 100 };
    progress.completed = Object.values(progress.best).filter((result) => result.percent >= 50).length;
    progress.nextLevel = session.assignedLevel >= BEACH_TOTAL_LEVELS ? 1 : session.assignedLevel + 1;
    let townEffect = null;
    if (session.mode === "town-job") {
      const shore = state.beachCleanup.southShore;
      shore.dirty = false; shore.litterCount = 0; shore.dirtySinceDay = 0; shore.lastCleanedDay = state.world.day; shore.cleanings += 1; shore.lastRewardCoins = rewardCoins;
      shore.nextDirtyDay = state.world.day + 3 + ((state.world.day * 31 + shore.cleanings * 17) % 3);
      state.progress.completedJobCount += 1;
      townEffect = { targetId: "south-shore", litterRemoved: true, nextDirtyDay: shore.nextDirtyDay };
    }
    state.beachCleanup.processedSessionIds.push(session.id);
    state.beachCleanup.processedSessionIds = state.beachCleanup.processedSessionIds.slice(-PROCESSED_BEACH_SESSION_LIMIT);
    const result = { level: session.assignedLevel, percent: 100, stars: 3, moves: engine.moves, earnedCoins: engine.earnedCoins, bonusCoins: engine.bonusCoins, rewardCoins, firstClear, collectedRubbish: engine.collectedCells.size, totalRubbish: engine.level.totalRubbish };
    state.beachCleanup.history.push({ sessionId: session.id, mode: session.mode, targetId: session.targetId, status: "completed", ...result, endedAt: completedAt });
    state.beachCleanup.history = state.beachCleanup.history.slice(-BEACH_HISTORY_LIMIT);
    state.beachCleanup.activeSession = null;
    const restoration = session.mode === "town-job" ? registerRestorationCleanupInto(state, {
      eventId: session.id,
      jobType: "beach",
      percent: result.percent,
      worldPosition: { x: 3720, y: 2440 },
      occurredAt: completedAt,
    }) : null;
    return { ok: true, code: session.mode === "town-job" ? "beach-job-completed" : "beach-campaign-completed", result, rewardCoins, firstClear, townEffect, restoration, balance: state.economy.coins, nextLevel: progress.nextLevel };
  }

  cancel(sessionId) {
    return this.commit((state) => {
      const session = state.beachCleanup.activeSession;
      if (!session || session.id !== sessionId) return { ok: false, code: "unknown-session", message: "That Beach Cleanup attempt is no longer active." };
      state.beachCleanup.history.push({ sessionId: session.id, mode: session.mode, targetId: session.targetId, assignedLevel: session.assignedLevel, status: "cancelled", endedAt: new Date(this.now()).toISOString() });
      state.beachCleanup.history = state.beachCleanup.history.slice(-BEACH_HISTORY_LIMIT); state.beachCleanup.activeSession = null;
      return { ok: true, code: "beach-cancelled", session: structuredClone(session) };
    });
  }

  getDiagnostics() {
    const snapshot = this.getSnapshot();
    return { version: "1.0.0-kindworks-integrated", totalLevels: BEACH_TOTAL_LEVELS, catalogueValid: this.catalogueValidation.ok, completed: snapshot.progress.completed, nextLevel: snapshot.progress.nextLevel, southShoreDirty: snapshot.southShore.dirty, litterCount: snapshot.southShore.litterCount, activeSession: snapshot.activeSession?.id || null };
  }
}
