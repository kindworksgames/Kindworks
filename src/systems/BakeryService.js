import {
  BAKERY_APPLIANCES,
  BAKERY_CONFIG,
  BAKERY_INGREDIENTS,
  BAKERY_LEVELS,
  BAKERY_RECIPES,
  bakeryFirstClearCoins,
  bakeryLevel,
  bakeryResultForSession,
  bakeryStep,
} from "../data/bakery.js";
import { NPC_RESIDENTS } from "../data/npcTownLife.js";
import { COIN_LEDGER_LIMIT } from "../state/economyState.js";

function appendLedger(state, now, details) {
  const id = `coin-${String(state.economy.nextTransactionId).padStart(6, "0")}`;
  state.economy.nextTransactionId += 1;
  const entry = { id, itemId: null, quantity: null, occurredAt: new Date(now).toISOString(), ...details };
  state.economy.ledger.push(entry);
  state.economy.ledger = state.economy.ledger.slice(-COIN_LEDGER_LIMIT);
  return entry;
}

export class BakeryService {
  constructor(gameState, repository, { now = () => Date.now() } = {}) {
    this.gameState = gameState;
    this.repository = repository;
    this.now = now;
    this.activeSession = null;
    this.nextSessionId = 1;
    this.listeners = new Set();
  }

  subscribe(listener) {
    if (typeof listener !== "function") throw new TypeError("A bakery listener must be a function.");
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(result) {
    const snapshot = this.getSnapshot();
    for (const listener of this.listeners) listener(snapshot, result);
  }

  getSnapshot() {
    return structuredClone(this.gameState.getSnapshot().bakery);
  }

  getActiveSession() {
    return this.activeSession ? structuredClone(this.activeSession) : null;
  }

  currentOrder(session = this.activeSession) {
    return session?.orders?.[session.orderIndex] || null;
  }

  currentRecipe(session = this.activeSession) {
    const order = this.currentOrder(session);
    return order ? BAKERY_RECIPES[order.recipes[session.recipeIndex]] || null : null;
  }

  expectedStep(session = this.activeSession) {
    return this.currentRecipe(session)?.steps?.[session.stepIndex] || null;
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
      return { ok: false, code: "persistence-failed", message: "The bakery result could not be saved, so progress and coins were restored safely.", save: saved, rollbackOk: rollback.ok };
    }
    const result = { ...mutation, state: this.gameState.getSnapshot(), save: saved };
    this.emit(result);
    return result;
  }

  startLevel(number = 1, { returnPosition, returnFacing = "down" } = {}) {
    if (this.activeSession && !this.activeSession.finished) return { ok: false, code: "shift-active", message: "Finish or safely exit the current bakery shift first." };
    const level = bakeryLevel(number);
    const progress = this.getSnapshot();
    if (level.level > progress.unlockedLevel) return { ok: false, code: "level-locked", message: "Complete the previous bakery shift first." };
    const names = NPC_RESIDENTS.map((resident) => resident.name);
    const orders = level.orders.map((order, index) => ({
      recipes: [...order.recipes],
      customerName: names[(level.level + (index + 1) * 3) % names.length] || `Customer ${index + 1}`,
      maxPatience: level.patience + Math.max(0, order.recipes.length - 1) * 12,
    }));
    const id = `bakery-shift-${String(this.nextSessionId).padStart(4, "0")}`;
    this.nextSessionId += 1;
    this.activeSession = {
      id,
      level,
      orders,
      orderIndex: 0,
      recipeIndex: 0,
      stepIndex: 0,
      completedSteps: [],
      elapsed: 0,
      currentPatience: orders[0].maxPatience,
      served: 0,
      missed: 0,
      mistakes: 0,
      waste: 0,
      streak: 0,
      bestStreak: 0,
      happiness: [],
      finished: false,
      result: null,
      returnPosition: { x: Number(returnPosition?.x) || 805, y: Number(returnPosition?.y) || 1180 },
      returnFacing,
    };
    return { ok: true, code: "bakery-shift-started", session: this.getActiveSession(), expectedStep: this.expectedStep() };
  }

  recordMistake(message) {
    const session = this.activeSession;
    if (!session || session.finished) return { ok: false, code: "no-active-shift", message: "Start a bakery shift first." };
    session.mistakes += 1;
    session.currentPatience = Math.max(-BAKERY_CONFIG.graceSeconds, session.currentPatience - 1.5);
    return { ok: false, code: "wrong-step", message, expectedStep: this.expectedStep(), mistakes: session.mistakes };
  }

  applyStep(stepId) {
    const session = this.activeSession;
    if (!session || session.finished) return { ok: false, code: "no-active-shift", message: "Start a bakery shift first." };
    const expected = this.expectedStep();
    if (!expected) return { ok: false, code: "recipe-ready", message: "This product is ready to finish and serve." };
    if (!bakeryStep(stepId)) return this.recordMistake("Choose a valid ingredient or bakery station.");
    if (stepId !== expected) return this.recordMistake(`That order needs ${bakeryStep(expected).name} next.`);
    session.completedSteps.push(stepId);
    session.stepIndex += 1;
    const recipe = this.currentRecipe();
    const complete = session.stepIndex === recipe.steps.length;
    return {
      ok: true,
      code: complete ? "recipe-complete" : "step-complete",
      stepId,
      step: bakeryStep(stepId),
      recipeId: this.currentOrder().recipes[session.recipeIndex],
      recipe,
      complete,
      expectedStep: this.expectedStep(),
      session: this.getActiveSession(),
    };
  }

  undoStep() {
    const session = this.activeSession;
    if (!session || session.finished) return { ok: false, code: "no-active-shift", message: "Start a bakery shift first." };
    if (session.stepIndex < 1) return { ok: false, code: "nothing-to-undo", message: "There is nothing to undo." };
    const removed = session.completedSteps.pop();
    session.stepIndex -= 1;
    return { ok: true, code: "step-undone", removed, expectedStep: this.expectedStep() };
  }

  discardRecipe() {
    const session = this.activeSession;
    if (!session || session.finished) return { ok: false, code: "no-active-shift", message: "Start a bakery shift first." };
    if (session.stepIndex < 1) return { ok: false, code: "nothing-to-discard", message: "The preparation is already empty." };
    session.waste += 1;
    session.mistakes += 1;
    session.stepIndex = 0;
    session.completedSteps = [];
    return { ok: true, code: "recipe-discarded", waste: session.waste, expectedStep: this.expectedStep() };
  }

  serveRecipe() {
    const session = this.activeSession;
    const recipe = this.currentRecipe();
    if (!session || session.finished || !recipe) return { ok: false, code: "no-active-shift", message: "Start a bakery shift first." };
    if (session.stepIndex !== recipe.steps.length) return this.recordMistake(`${recipe.name} still needs ${bakeryStep(this.expectedStep()).name}.`);
    const checkpoint = {
      recipeIndex: session.recipeIndex,
      stepIndex: session.stepIndex,
      completedSteps: [...session.completedSteps],
      happiness: [...session.happiness],
      served: session.served,
      streak: session.streak,
      bestStreak: session.bestStreak,
      orderIndex: session.orderIndex,
      currentPatience: session.currentPatience,
    };
    const order = this.currentOrder();
    session.recipeIndex += 1;
    session.stepIndex = 0;
    session.completedSteps = [];
    if (session.recipeIndex < order.recipes.length) {
      return { ok: true, code: "dish-added", message: `${recipe.name} added to the order.`, nextRecipe: this.currentRecipe(), expectedStep: this.expectedStep() };
    }
    const happiness = Math.max(0, Math.min(1, session.currentPatience / order.maxPatience));
    session.happiness.push(happiness);
    session.served += 1;
    session.streak += 1;
    session.bestStreak = Math.max(session.bestStreak, session.streak);
    const customerName = order.customerName;
    session.orderIndex += 1;
    session.recipeIndex = 0;
    if (session.orderIndex >= session.orders.length) {
      const finished = this.finishSession();
      if (finished.ok) return { ...finished, code: "bakery-shift-complete", customerName, customerOutcome: "loved" };
      Object.assign(session, checkpoint);
      return finished;
    }
    session.currentPatience = this.currentOrder().maxPatience;
    return { ok: true, code: "customer-served", customerName, customerOutcome: "loved", served: session.served, nextCustomer: this.currentOrder().customerName, expectedStep: this.expectedStep() };
  }

  tick(seconds) {
    const session = this.activeSession;
    if (!session || session.finished) return { ok: false, code: "no-active-shift" };
    const delta = Math.max(0, Math.min(1, Number(seconds) || 0));
    session.elapsed = Math.min(session.level.duration, session.elapsed + delta);
    session.currentPatience -= delta;
    if (session.currentPatience <= -BAKERY_CONFIG.graceSeconds) {
      session.missed += 1;
      session.streak = 0;
      return this.finishSession({ failureReason: `${this.currentOrder().customerName} left before the order was ready.` });
    }
    if (session.elapsed >= session.level.duration) {
      session.missed += session.level.target - session.served;
      session.streak = 0;
      return this.finishSession({ failureReason: "The bakery shift timer ended." });
    }
    return { ok: true, code: "bakery-tick", remaining: session.level.duration - session.elapsed, patience: session.currentPatience };
  }

  finishSession({ failureReason = null } = {}) {
    const session = this.activeSession;
    if (!session || session.finished) return { ok: false, code: "shift-already-finished", message: "This bakery shift is already finished." };
    const result = bakeryResultForSession(session);
    if (failureReason) result.failureReason = failureReason;
    const transaction = this.commit((state) => {
      const progress = state.bakery;
      const level = session.level.level;
      const firstClear = result.won && !progress.completed[level];
      let coins = 0;
      let ledger = null;
      if (result.won) {
        const previous = progress.best[level];
        if (!previous || result.score > previous.score) progress.best[level] = { score: result.score, stars: result.stars, served: result.served, accuracy: result.accuracy };
        progress.completed[level] = true;
        progress.unlockedLevel = Math.max(progress.unlockedLevel, Math.min(BAKERY_CONFIG.levelCount, level + 1));
        if (firstClear) {
          coins = bakeryFirstClearCoins(level, result.stars);
          if (state.economy.coins + coins > Number.MAX_SAFE_INTEGER) return { ok: false, code: "balance-overflow", message: "Coin balance limit reached." };
          state.economy.coins += coins;
          state.economy.lifetimeCoinsEarned += coins;
          progress.lifetimeCoins += coins;
          ledger = appendLedger(state, this.now(), { amount: coins, kind: "little-bakery-first-clear", reason: `Little Bakery Level ${level} first clear`, level, score: result.score, stars: result.stars, served: result.served });
        }
      }
      progress.shifts += 1;
      progress.lifetimeServed += result.served;
      progress.totalStars = Object.values(progress.best).reduce((sum, record) => sum + record.stars, 0);
      progress.lastLevel = level;
      progress.lastOutcome = result.won ? "won" : "lost";
      return { ok: true, code: result.won ? "bakery-result-won" : "bakery-result-lost", result: { ...result, coins, firstClear }, coins, firstClear, ledger };
    });
    if (!transaction.ok) return transaction;
    session.finished = true;
    session.result = transaction.result;
    return { ...transaction, session: this.getActiveSession() };
  }

  cancel() {
    if (!this.activeSession) return { ok: false, code: "no-active-shift", message: "No bakery shift is open." };
    const session = this.getActiveSession();
    this.activeSession = null;
    return { ok: true, code: "bakery-shift-cancelled", session };
  }

  getDiagnostics() {
    const state = this.getSnapshot();
    return {
      levels: BAKERY_LEVELS.length,
      recipes: Object.keys(BAKERY_RECIPES).length,
      ingredients: Object.keys(BAKERY_INGREDIENTS).length,
      appliances: Object.keys(BAKERY_APPLIANCES).length,
      unlockedLevel: state.unlockedLevel,
      completedLevels: Object.keys(state.completed).length,
      totalStars: state.totalStars,
      lifetimeServed: state.lifetimeServed,
      lifetimeCoins: state.lifetimeCoins,
      activeLevel: this.activeSession?.level.level || null,
      activeCustomer: this.currentOrder()?.customerName || null,
      activeExpectedStep: this.expectedStep(),
      firstClearRewards: true,
      customerOutcomes: true,
      fullCampaignCatalogue: true,
    };
  }
}
