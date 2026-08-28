import {
  RIVER_LEVELS,
  RIVER_RULES,
  RIVER_TOTAL_LEVELS,
  RiverClearoutEngine,
  RiverLevelSolver,
  validateRiverCatalogue,
} from "../data/riverClearout.js";
import { COIN_LEDGER_LIMIT } from "../state/economyState.js";
import { calculateCleanupReward } from "./CleanupJobService.js";
import { removeRiverItemsInto } from "./LivingEnvironmentService.js";
import { registerRestorationCleanupInto } from "../state/restorationMilestoneState.js";

function appendLedger(state, now, details) {
  const id = `coin-${String(state.economy.nextTransactionId).padStart(6, "0")}`;
  state.economy.nextTransactionId += 1;
  const entry = { id, itemId: null, quantity: null, occurredAt: new Date(now).toISOString(), ...details };
  state.economy.ledger.push(entry);
  state.economy.ledger = state.economy.ledger.slice(-COIN_LEDGER_LIMIT);
  return entry;
}

function validPosition(position) {
  return position && Number.isFinite(position.x) && Number.isFinite(position.y)
    ? { x: Number(position.x), y: Number(position.y) }
    : null;
}

function cloneEngineState(engine) {
  return {
    board: engine.cloneBoard(),
    current: engine.clonePiece(),
    queueIndex: engine.queueIndex,
    rowsCleared: engine.rowsCleared,
    piecesPlaced: engine.piecesPlaced,
    gameOver: engine.gameOver,
    lastBlockedPiece: engine.lastBlockedPiece,
    undoHistory: structuredClone(engine.undoHistory),
    assistanceTier: engine.assistanceTier,
    lastCascadeWaves: engine.lastCascadeWaves,
    lastGravityMoves: engine.lastGravityMoves,
  };
}

function restoreEngineState(engine, checkpoint) {
  Object.assign(engine, structuredClone(checkpoint));
}

export class RiverClearoutService {
  constructor(gameState, repository, { now = () => Date.now(), environment = null } = {}) {
    this.gameState = gameState;
    this.repository = repository;
    this.now = now;
    this.environment = environment;
    this.activeSession = null;
    this.nextSessionId = 1;
    this.listeners = new Set();
    this.catalogueValidation = validateRiverCatalogue();
  }

  subscribe(listener) {
    if (typeof listener !== "function") throw new TypeError("A river listener must be a function.");
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(result) {
    const snapshot = this.getActiveSession();
    for (const listener of this.listeners) listener(snapshot, result);
  }

  getSnapshot() { return structuredClone(this.gameState.getSnapshot().river); }

  getActiveSession() {
    const session = this.activeSession;
    if (!session) return null;
    const engine = session.engine;
    const ghostY = engine.current ? engine.ghostY() : null;
    return structuredClone({
      id: session.id,
      level: session.level,
      board: engine.cloneBoard(),
      current: engine.clonePiece(),
      ghostY,
      queueIndex: engine.queueIndex,
      piecesLeft: engine.piecesLeft(),
      piecesPlaced: engine.piecesPlaced,
      rowsCleared: engine.rowsCleared,
      percent: engine.percent(),
      stars: engine.stars(),
      starCap: engine.starCap(),
      assistanceTier: engine.assistanceTier,
      remaining: engine.countOriginal(),
      undosRemaining: Math.max(0, session.level.maxUndos - engine.undoHistory.length),
      preview: engine.preview(RIVER_RULES.queue.previewCount),
      finished: session.finished,
      result: session.result,
      returnPosition: session.returnPosition,
      returnFacing: session.returnFacing,
      autoFall: session.autoFall,
      mode: session.mode,
      environmentTargetId: session.environmentTargetId,
      environmentItemIds: session.environmentItemIds,
      canUndo: engine.undoHistory.length > 0,
    });
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
      return { ok: false, code: "persistence-failed", message: "The river result could not be saved, so progress and coins were restored safely.", save: saved, rollbackOk: rollback.ok };
    }
    const result = { ...mutation, state: this.gameState.getSnapshot(), save: saved };
    this.emit(result);
    return result;
  }

  startLevel(number = this.getSnapshot().nextLevel, { returnPosition = null, returnFacing = "down", autoFall = true, environmentTargetId = null } = {}) {
    if (this.activeSession && !this.activeSession.finished) return { ok: false, code: "river-level-active", message: "Finish or safely exit the current river level first." };
    const levelNumber = Math.max(1, Math.min(RIVER_TOTAL_LEVELS, Math.floor(Number(number) || 1)));
    const level = RIVER_LEVELS.get(levelNumber);
    const engine = new RiverClearoutEngine(level, RIVER_LEVELS.shapes, RIVER_LEVELS.icons);
    const environmentJob = environmentTargetId ? this.environment?.getRiverJob?.(environmentTargetId) : null;
    this.activeSession = {
      id: `river-level-${String(this.nextSessionId).padStart(4, "0")}`,
      level,
      engine,
      fallAccumulator: 0,
      lockAccumulator: 0,
      finished: false,
      result: null,
      returnPosition: validPosition(returnPosition),
      returnFacing: ["up", "down", "left", "right"].includes(returnFacing) ? returnFacing : "down",
      autoFall: Boolean(autoFall),
      mode: environmentJob ? "town-job" : "campaign",
      environmentTargetId: environmentJob?.id || null,
      environmentItemIds: environmentJob?.itemIds || [],
    };
    this.nextSessionId += 1;
    const result = { ok: true, code: "river-level-started", session: this.getActiveSession() };
    this.emit(result);
    return result;
  }

  markInputReset() {
    const session = this.activeSession;
    const current = session?.engine.current;
    if (!current) return;
    if (session.engine.isGrounded() && current.lockResets < session.level.maxLockResets) {
      current.lockResets += 1;
      session.lockAccumulator = 0;
    }
  }

  resolveEngineResult(engineResult, checkpoint = null) {
    if (!engineResult?.ended) {
      const result = { ok: true, code: "river-action", engineResult, session: this.getActiveSession() };
      this.emit(result);
      return result;
    }
    const finished = this.finishSession(engineResult.ended);
    if (!finished.ok && finished.code === "persistence-failed" && checkpoint) {
      restoreEngineState(this.activeSession.engine, checkpoint);
      this.activeSession.finished = false;
      this.activeSession.result = null;
    }
    return finished;
  }

  moveHorizontal(direction) {
    const session = this.activeSession;
    if (!session || session.finished) return { ok: false, code: "no-active-river-level" };
    const moved = session.engine.move(direction < 0 ? -1 : 1, 0);
    if (moved.moved) this.markInputReset();
    return this.resolveEngineResult(moved);
  }

  softDrop() {
    const session = this.activeSession;
    if (!session || session.finished) return { ok: false, code: "no-active-river-level" };
    const moved = session.engine.move(0, 1);
    if (moved.moved) session.lockAccumulator = 0;
    return this.resolveEngineResult(moved);
  }

  rotate() {
    const session = this.activeSession;
    if (!session || session.finished) return { ok: false, code: "no-active-river-level" };
    const rotated = session.engine.rotate();
    if (rotated.rotated) this.markInputReset();
    return this.resolveEngineResult(rotated);
  }

  hardDrop() {
    const session = this.activeSession;
    if (!session || session.finished) return { ok: false, code: "no-active-river-level" };
    const checkpoint = cloneEngineState(session.engine);
    return this.resolveEngineResult(session.engine.hardDrop(), checkpoint);
  }

  undo() {
    const session = this.activeSession;
    if (!session) return { ok: false, code: "no-active-river-level" };
    if (session.finished) return this.undoFinishedResult();
    const undone = session.engine.undo();
    if (!undone) return { ok: false, code: "nothing-to-undo", message: "No more placed pieces can be recovered." };
    session.fallAccumulator = 0;
    session.lockAccumulator = 0;
    const result = { ok: true, code: "river-undo", session: this.getActiveSession() };
    this.emit(result);
    return result;
  }

  undoFinishedResult() {
    const session = this.activeSession;
    if (!session?.finished || !session.engine.undoHistory.length) return { ok: false, code: "nothing-to-undo", message: "No finished placement can be recovered." };
    const durableBeforeUndo = this.gameState.getSnapshot();
    if (session.result?.won && session.durableCheckpoint) {
      const restored = this.gameState.replace(session.durableCheckpoint);
      if (!restored.ok) return { ok: false, code: "state-validation", errors: restored.errors };
      const saved = this.repository.save(session.durableCheckpoint, { now: this.now() });
      if (!saved.ok) {
        this.gameState.replace(durableBeforeUndo);
        return { ok: false, code: "persistence-failed", message: "The finished river result could not be reopened safely.", save: saved };
      }
    }
    if (!session.engine.undo()) {
      if (session.result?.won && session.durableCheckpoint) this.gameState.replace(durableBeforeUndo);
      return { ok: false, code: "nothing-to-undo", message: "No finished placement can be recovered." };
    }
    session.finished = false;
    session.result = null;
    session.durableCheckpoint = null;
    session.fallAccumulator = 0;
    session.lockAccumulator = 0;
    const result = { ok: true, code: "river-result-undo", session: this.getActiveSession() };
    this.emit(result);
    return result;
  }

  hint() {
    const session = this.activeSession;
    if (!session || session.finished) return { ok: false, code: "no-active-river-level" };
    const hint = session.engine.hint();
    return hint ? { ok: true, code: "river-hint", hint } : { ok: false, code: "no-river-hint" };
  }

  tick(seconds) {
    const session = this.activeSession;
    if (!session || session.finished) return { ok: false, code: "no-active-river-level" };
    if (!session.autoFall) return { ok: true, code: "river-tick-paused" };
    const milliseconds = Math.max(0, Math.min(1000, (Number(seconds) || 0) * 1000));
    session.fallAccumulator += milliseconds;
    if (session.engine.isGrounded()) {
      session.lockAccumulator += milliseconds;
      if (session.lockAccumulator >= session.level.lockDelayMs) {
        const checkpoint = cloneEngineState(session.engine);
        session.lockAccumulator = 0;
        return this.resolveEngineResult(session.engine.lockPiece(), checkpoint);
      }
    }
    if (session.fallAccumulator >= session.level.fallIntervalMs) {
      session.fallAccumulator %= session.level.fallIntervalMs;
      const moved = session.engine.move(0, 1);
      if (moved.moved) session.lockAccumulator = 0;
    }
    return { ok: true, code: "river-tick", session: this.getActiveSession() };
  }

  async certifiedPath({ threeStars = false, beamWidth = 250 } = {}) {
    const session = this.activeSession;
    if (!session || session.finished) return { ok: false, code: "no-active-river-level" };
    const solver = new RiverLevelSolver(session.level);
    const solved = await solver.solveAsync({ beamWidth, stopAtOneStar: !threeStars, stopAtThreeStar: threeStars, sliceMs: 8 });
    const achievement = threeStars ? solved.achievements.three : solved.achievements.one;
    return achievement ? { ok: true, code: "river-certified-path", path: achievement.path, achievement, diagnostics: solved.diagnostics } : { ok: false, code: "river-solver-incomplete", solved };
  }

  playPath(path) {
    if (!Array.isArray(path)) return { ok: false, code: "invalid-river-path" };
    let result = { ok: true, code: "river-path-empty" };
    for (const placement of path) {
      for (const action of String(placement.actions || "")) {
        result = action === "L" ? this.moveHorizontal(-1) : action === "R" ? this.moveHorizontal(1) : action === "D" ? this.softDrop() : action === "T" ? this.rotate() : result;
        if (!result.ok) return result;
      }
      result = this.hardDrop();
      if (!result.ok || this.activeSession?.finished) return result;
    }
    return result;
  }

  finishSession(reason) {
    const session = this.activeSession;
    if (!session || session.finished) return { ok: false, code: "river-level-already-finished" };
    const result = session.engine.finish(reason);
    const won = result.stars >= 1 && result.percent >= session.level.oneStarMinimum;
    if (!won) {
      session.finished = true;
      session.result = { ...result, won: false, coins: 0, firstClear: false };
      const outcome = { ok: true, code: "river-result-lost", result: session.result, coins: 0, firstClear: false };
      this.emit(outcome);
      return outcome;
    }

    const durableCheckpoint = this.gameState.getSnapshot();
    const transaction = this.commit((state) => {
      const progress = state.river;
      const level = session.level.id;
      const previous = progress.best[level] || { stars: 0, bestPercent: 0, bestPieces: null };
      const firstClear = previous.bestPercent < session.level.oneStarMinimum;
      const bestPercent = Math.max(previous.bestPercent, result.percent);
      const stars = Math.max(previous.stars, result.stars);
      const bestPieces = result.percent === 100
        ? Math.min(previous.bestPieces ?? Number.MAX_SAFE_INTEGER, result.pieces)
        : previous.bestPieces;
      progress.best[level] = { stars, bestPercent, bestPieces: bestPieces === Number.MAX_SAFE_INTEGER ? null : bestPieces };
      progress.completed = Object.values(progress.best).filter((record) => record.stars >= 1 && record.bestPercent >= 50).length;
      progress.nextLevel = level >= RIVER_TOTAL_LEVELS ? 1 : level + 1;
      progress.totalStars = Object.values(progress.best).reduce((sum, record) => sum + record.stars, 0);
      progress.restorationPoints = Object.values(progress.best).reduce((sum, record) => sum + record.stars * 100 + record.bestPercent, 0);
      progress.attempts += 1;
      progress.lifetimePieces += result.pieces;
      progress.lifetimeRows += result.rows;
      progress.lastLevel = level;
      progress.lastOutcome = "won";
      let coins = 0;
      let ledger = null;
      if (firstClear) {
        coins = calculateCleanupReward(result.percent, level);
        if (state.economy.coins + coins > Number.MAX_SAFE_INTEGER) return { ok: false, code: "balance-overflow", message: "Coin balance limit reached." };
        state.economy.coins += coins;
        state.economy.lifetimeCoinsEarned += coins;
        ledger = appendLedger(state, this.now(), { amount: coins, kind: "river-clearout-first-clear", reason: `River Clear-Out Level ${level} first clear`, level, percent: result.percent, stars: result.stars, pieces: result.pieces });
      }
      const environmentEffect = session.mode === "town-job" ? removeRiverItemsInto(state, session.environmentItemIds) : null;
      if (environmentEffect?.removed) state.progress.completedJobCount += 1;
      const environmentJob = session.environmentTargetId ? this.environment?.getRiverJob?.(session.environmentTargetId) : null;
      const restoration = environmentEffect?.removed ? registerRestorationCleanupInto(state, {
        eventId: session.id,
        jobType: "river",
        percent: result.percent,
        worldPosition: environmentJob?.position || session.returnPosition,
        occurredAt: new Date(this.now()).toISOString(),
      }) : null;
      return { ok: true, code: "river-result-won", result: { ...result, won: true, coins, firstClear }, coins, firstClear, ledger, environmentEffect, restoration };
    });
    if (!transaction.ok) return transaction;
    session.finished = true;
    session.result = transaction.result;
    session.durableCheckpoint = durableCheckpoint;
    return transaction;
  }

  cancel() {
    if (!this.activeSession) return { ok: false, code: "no-active-river-level" };
    const session = this.getActiveSession();
    this.activeSession = null;
    return { ok: true, code: "river-level-cancelled", session };
  }

  getDiagnostics() {
    const state = this.getSnapshot();
    return {
      catalogueValid: this.catalogueValidation.valid,
      totalLevels: this.catalogueValidation.totalLevels,
      catalogueFingerprint: this.catalogueValidation.fingerprint,
      rulesFingerprint: this.catalogueValidation.rulesFingerprint,
      firstHeavyLevel: this.catalogueValidation.firstHeavyLevel,
      unsupportedStartingCells: this.catalogueValidation.unsupportedStartingCells,
      difficulty: this.catalogueValidation.difficulty,
      nextLevel: state.nextLevel,
      completed: state.completed,
      totalStars: state.totalStars,
      activeSession: Boolean(this.activeSession && !this.activeSession.finished),
      persistentEnvironmentConnected: Boolean(this.environment),
    };
  }
}
