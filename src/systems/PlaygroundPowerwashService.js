import {
  POWERWASH_BUILD_VERSION,
  POWERWASH_MINIMUM_CLEAN_PERCENT,
  POWERWASH_REWARD_CAP,
  POWERWASH_TOTAL_LEVELS,
  PlaygroundPowerwashEngine,
  calculatePowerwashNativeReward,
  validatePowerwashCatalogue,
} from "../data/playgroundPowerwash.js";
import {
  POWERWASH_HISTORY_LIMIT,
  PROCESSED_POWERWASH_SESSION_LIMIT,
  powerwashDirtyInterval,
} from "../state/playgroundPowerwashState.js";
import { COIN_LEDGER_LIMIT } from "../state/economyState.js";
import { registerRestorationCleanupInto } from "../state/restorationMilestoneState.js";

export function calculatePowerwashCampaignReward(levelValue) {
  const level = Math.max(1, Math.min(POWERWASH_TOTAL_LEVELS, Math.floor(Number(levelValue) || 1)));
  return Math.min(POWERWASH_REWARD_CAP, 100 + Math.min(70, Math.floor((level - 1) / 50) * 5));
}

function returnPosition(value) {
  return value && Number.isFinite(value.x) && Number.isFinite(value.y) ? { x: Number(value.x), y: Number(value.y) } : { x: 1940, y: 1180 };
}

function engineFields(engine) {
  const state = engine.snapshot();
  return {
    normal: state.normal,
    resistant: state.resistant,
    soaped: state.soaped,
    water: state.water,
    soap: state.soap,
    toolMode: state.toolMode,
    nozzle: state.nozzle,
    strokes: state.strokes,
    soapWarnings: state.soapWarnings,
    won: false,
    rawPercentAtCompletion: 0,
  };
}

export class PlaygroundPowerwashService {
  constructor(gameState, repository, { now = () => Date.now() } = {}) {
    this.gameState = gameState;
    this.repository = repository;
    this.now = now;
    this.catalogueValidation = validatePowerwashCatalogue();
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
      return { ok: false, code: "persistence-failed", message: "The Power Wash change could not be saved, so the previous state was restored.", save: saved, rollbackOk: rollback.ok };
    }
    return { ...mutation, state: this.gameState.getSnapshot(), save: saved };
  }

  getSnapshot() { return structuredClone(this.gameState.getSnapshot().playgroundPowerwash); }
  getActiveSession() { return this.getSnapshot().activeSession; }
  getPlaygroundSnapshot() { return this.getSnapshot().playground; }
  isTownJobAvailable() { return this.getPlaygroundSnapshot().dirty; }
  getCampaignSnapshot() {
    const progress = this.getSnapshot().progress;
    return { ...progress, totalStars: Object.values(progress.best).reduce((sum, result) => sum + result.stars, 0), totalLevels: POWERWASH_TOTAL_LEVELS };
  }
  getSessionState() { const session = this.getActiveSession(); return session ? new PlaygroundPowerwashEngine(session.assignedLevel, session).snapshot() : null; }

  refresh() {
    const snapshot = this.gameState.getSnapshot();
    const playground = snapshot.playgroundPowerwash.playground;
    if (playground.dirty || snapshot.world.day < playground.nextDirtyDay) return { ok: true, changed: false, playground: structuredClone(playground) };
    return this.commit((state) => {
      const target = state.playgroundPowerwash.playground;
      target.dirty = true;
      target.dirtySinceDay = target.nextDirtyDay;
      return { ok: true, code: "playground-dirtied", changed: true, playground: structuredClone(target) };
    });
  }

  beginCampaign(levelValue, options = {}) {
    const level = Math.floor(Number(levelValue));
    if (!Number.isInteger(level) || level < 1 || level > POWERWASH_TOTAL_LEVELS) return { ok: false, code: "invalid-level", message: "Choose a Playground Power Wash level from 1 to 750." };
    return this.beginSession({ mode: "campaign", level, ...options });
  }

  beginTownJob(options = {}) {
    if (!this.isTownJobAvailable()) return { ok: false, code: "playground-clean", message: "The Commons Playground is already clean." };
    return this.beginSession({ mode: "town-job", level: this.getCampaignSnapshot().nextLevel, ...options });
  }

  beginSession({ mode, level, returnPosition: position = null, returnFacing = "up" }) {
    return this.commit((state) => {
      if (state.playgroundPowerwash.activeSession) return { ok: false, code: "session-active", message: "A Playground Power Wash attempt is already active." };
      if (mode === "town-job" && !state.playgroundPowerwash.playground.dirty) return { ok: false, code: "playground-clean", message: "The Commons Playground is already clean." };
      const engine = new PlaygroundPowerwashEngine(level);
      const session = {
        id: `powerwash-${String(state.playgroundPowerwash.nextSessionId).padStart(6, "0")}`,
        mode,
        targetId: mode === "town-job" ? "commons-playground" : null,
        assignedLevel: level,
        status: "playing",
        startedAt: new Date(this.now()).toISOString(),
        ...engineFields(engine),
        returnPosition: returnPosition(position),
        returnFacing: ["up", "down", "left", "right"].includes(returnFacing) ? returnFacing : "up",
      };
      state.playgroundPowerwash.nextSessionId += 1;
      state.playgroundPowerwash.activeSession = session;
      state.player.scene = "PlaygroundPowerwashScene";
      return { ok: true, code: mode === "town-job" ? "powerwash-job-started" : "powerwash-campaign-started", session: structuredClone(session) };
    });
  }

  selectTool(sessionId, tool, nozzle = "precision") {
    return this.commit((state) => {
      const session = state.playgroundPowerwash.activeSession;
      if (!session || session.id !== sessionId) return { ok: false, code: "unknown-session", message: "That Power Wash attempt is no longer active." };
      const engine = new PlaygroundPowerwashEngine(session.assignedLevel, session);
      engine.selectTool(tool, nozzle);
      Object.assign(session, engineFields(engine));
      return { ok: true, code: "powerwash-tool-selected", powerwashState: engine.snapshot() };
    });
  }

  spray(sessionId, row, col) {
    return this.commit((state) => {
      const session = state.playgroundPowerwash.activeSession;
      if (!session || session.id !== sessionId) return { ok: false, code: "unknown-session", message: "That Power Wash attempt is no longer active." };
      const engine = new PlaygroundPowerwashEngine(session.assignedLevel, session);
      const sprayed = engine.sprayAt(row, col);
      if (!sprayed.ok) return sprayed;
      Object.assign(session, engineFields(engine));
      if (!engine.won) return { ...sprayed, powerwashState: engine.snapshot() };
      return this.applyWin(state, session, engine);
    });
  }

  restart(sessionId) {
    return this.commit((state) => {
      const session = state.playgroundPowerwash.activeSession;
      if (!session || session.id !== sessionId) return { ok: false, code: "unknown-session", message: "That Power Wash attempt is no longer active." };
      Object.assign(session, engineFields(new PlaygroundPowerwashEngine(session.assignedLevel)), { startedAt: new Date(this.now()).toISOString() });
      return { ok: true, code: "powerwash-restarted", session: structuredClone(session) };
    });
  }

  completeCertified(sessionId) {
    return this.commit((state) => {
      const session = state.playgroundPowerwash.activeSession;
      if (!session || session.id !== sessionId) return { ok: false, code: "unknown-session", message: "That Power Wash attempt is no longer active." };
      const engine = new PlaygroundPowerwashEngine(session.assignedLevel, session);
      engine.forceClean();
      return this.applyWin(state, session, engine);
    });
  }

  applyWin(state, session, engine) {
    if (state.playgroundPowerwash.processedSessionIds.includes(session.id)) return { ok: false, code: "duplicate-session", message: "That Power Wash result was already saved." };
    const completedAt = new Date(this.now()).toISOString();
    const progress = state.playgroundPowerwash.progress;
    const old = progress.best[String(session.assignedLevel)] || { stars: 0, percent: 0 };
    const firstClear = old.percent < POWERWASH_MINIMUM_CLEAN_PERCENT;
    const rewardCoins = session.mode === "campaign"
      ? (firstClear ? calculatePowerwashCampaignReward(session.assignedLevel) : 0)
      : calculatePowerwashNativeReward(session.assignedLevel);
    if (state.economy.coins + rewardCoins > Number.MAX_SAFE_INTEGER) return { ok: false, code: "balance-overflow", message: "Coin balance limit reached." };
    if (rewardCoins > 0) {
      const id = `coin-${String(state.economy.nextTransactionId).padStart(6, "0")}`;
      state.economy.nextTransactionId += 1;
      state.economy.coins += rewardCoins;
      state.economy.lifetimeCoinsEarned += rewardCoins;
      state.economy.ledger.push({
        id,
        amount: rewardCoins,
        kind: session.mode === "campaign" ? "campaign-first-clear" : "cleanup-job",
        reason: session.mode === "campaign" ? `Playground Power Wash Level ${session.assignedLevel} first clear` : "Commons Playground power wash",
        itemId: null,
        quantity: null,
        sessionId: session.id,
        jobType: "playground",
        targetId: session.targetId,
        level: session.assignedLevel,
        percent: 100,
        stars: 3,
        occurredAt: completedAt,
      });
      state.economy.ledger = state.economy.ledger.slice(-COIN_LEDGER_LIMIT);
    }
    progress.best[String(session.assignedLevel)] = { stars: 3, percent: 100 };
    progress.completed = Object.values(progress.best).filter((result) => result.percent >= POWERWASH_MINIMUM_CLEAN_PERCENT).length;
    progress.nextLevel = session.assignedLevel >= POWERWASH_TOTAL_LEVELS ? 1 : session.assignedLevel + 1;
    let townEffect = null;
    if (session.mode === "town-job") {
      const playground = state.playgroundPowerwash.playground;
      playground.dirty = false;
      playground.lastCleanedDay = state.world.day;
      playground.dirtySinceDay = 0;
      playground.cleanings += 1;
      playground.attempts += 1;
      playground.lastCompletionPercent = 100;
      playground.lastRewardCoins = rewardCoins;
      playground.nextDirtyDay = state.world.day + powerwashDirtyInterval(state.world.day, playground.cleanings);
      state.progress.completedJobCount += 1;
      townEffect = { targetId: "commons-playground", grimeRemoved: true, nextDirtyDay: playground.nextDirtyDay, intervalDays: playground.nextDirtyDay - state.world.day };
    }
    state.playgroundPowerwash.processedSessionIds.push(session.id);
    state.playgroundPowerwash.processedSessionIds = state.playgroundPowerwash.processedSessionIds.slice(-PROCESSED_POWERWASH_SESSION_LIMIT);
    const result = {
      level: session.assignedLevel,
      percent: 100,
      rawPercent: engine.rawPercentAtCompletion || 100,
      stars: 3,
      strokes: engine.strokes,
      rewardCoins,
      firstClear,
      nativeReward: calculatePowerwashNativeReward(session.assignedLevel),
    };
    state.playgroundPowerwash.history.push({ sessionId: session.id, mode: session.mode, targetId: session.targetId, status: "completed", ...result, endedAt: completedAt });
    state.playgroundPowerwash.history = state.playgroundPowerwash.history.slice(-POWERWASH_HISTORY_LIMIT);
    state.playgroundPowerwash.activeSession = null;
    const restoration = session.mode === "town-job" ? registerRestorationCleanupInto(state, {
      eventId: session.id,
      jobType: "playground",
      percent: result.percent,
      worldPosition: { x: 1940, y: 1090 },
      occurredAt: completedAt,
    }) : null;
    return { ok: true, code: session.mode === "town-job" ? "powerwash-job-completed" : "powerwash-campaign-completed", result, rewardCoins, firstClear, townEffect, restoration, balance: state.economy.coins, nextLevel: progress.nextLevel };
  }

  cancel(sessionId) {
    return this.commit((state) => {
      const session = state.playgroundPowerwash.activeSession;
      if (!session || session.id !== sessionId) return { ok: false, code: "unknown-session", message: "That Power Wash attempt is no longer active." };
      state.playgroundPowerwash.history.push({ sessionId: session.id, mode: session.mode, targetId: session.targetId, assignedLevel: session.assignedLevel, status: "cancelled", endedAt: new Date(this.now()).toISOString() });
      state.playgroundPowerwash.history = state.playgroundPowerwash.history.slice(-POWERWASH_HISTORY_LIMIT);
      if (session.mode === "town-job") state.playgroundPowerwash.playground.attempts += 1;
      state.playgroundPowerwash.activeSession = null;
      return { ok: true, code: "powerwash-cancelled", session: structuredClone(session) };
    });
  }

  getDiagnostics() {
    const snapshot = this.getSnapshot();
    return {
      version: POWERWASH_BUILD_VERSION,
      totalLevels: POWERWASH_TOTAL_LEVELS,
      catalogueValid: this.catalogueValidation.ok,
      completed: snapshot.progress.completed,
      nextLevel: snapshot.progress.nextLevel,
      playgroundDirty: snapshot.playground.dirty,
      cleanings: snapshot.playground.cleanings,
      nextDirtyDay: snapshot.playground.nextDirtyDay,
      activeSession: snapshot.activeSession?.id || null,
    };
  }
}
