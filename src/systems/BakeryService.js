import {
  BAKERY_APPLIANCES,
  BAKERY_CONFIG,
  BAKERY_INGREDIENTS,
  BAKERY_LEVELS,
  BAKERY_RECIPES,
  bakeryFirstClearCoins,
  bakeryLevel,
  bakeryStep,
} from "../data/bakery.js";
import { NPC_RESIDENTS } from "../data/npcTownLife.js";
import { COIN_LEDGER_LIMIT } from "../state/economyState.js";
import {
  applyRecipeStep,
  recipeForOrder,
  recipeOrderScore,
  resetRecipePreparation,
  undoRecipeStep,
} from "./RecipeOrderService.js";

function appendLedger(state, now, details) {
  const id = `coin-${String(state.economy.nextTransactionId).padStart(6, "0")}`;
  state.economy.nextTransactionId += 1;
  const entry = { id, itemId: null, quantity: null, occurredAt: new Date(now).toISOString(), ...details };
  state.economy.ledger.push(entry);
  state.economy.ledger = state.economy.ledger.slice(-COIN_LEDGER_LIMIT);
  return entry;
}

function emptyTray(index) {
  return { index, orderId: null, recipeIndex: 0, stepIndex: 0, completedSteps: [], completedRecipes: [] };
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

  getSnapshot() { return structuredClone(this.gameState.getSnapshot().bakery); }
  getActiveSession() { return this.activeSession ? structuredClone(this.activeSession) : null; }

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

  startLevel(number = 1, { returnPosition, returnFacing = "down", instantOrders = false } = {}) {
    if (this.activeSession && !this.activeSession.finished) return { ok: false, code: "shift-active", message: "Finish or safely exit the current bakery shift first." };
    const level = bakeryLevel(number);
    const progress = this.getSnapshot();
    if (level.level > progress.unlockedLevel) return { ok: false, code: "level-locked", message: "Complete the previous bakery shift first." };
    const names = NPC_RESIDENTS.map((resident) => resident.name);
    const orders = level.orders.map((order, index) => ({
      id: `bakery-order-${index + 1}`,
      at: instantOrders ? 0 : order.at,
      recipes: [...order.recipes],
      customerName: names[(level.level + (index + 1) * 3) % names.length] || `Customer ${index + 1}`,
      maxPatience: level.patience + Math.max(0, order.recipes.length - 1) * 12,
      patience: level.patience + Math.max(0, order.recipes.length - 1) * 12,
      status: "waiting",
    }));
    this.activeSession = {
      id: `bakery-shift-${String(this.nextSessionId).padStart(4, "0")}`,
      level,
      orders,
      spawnIndex: 0,
      activeOrderIds: [],
      trays: Array.from({ length: BAKERY_CONFIG.trayCount }, (_, index) => emptyTray(index)),
      activeTray: 0,
      elapsed: 0,
      served: 0,
      missed: 0,
      mistakes: 0,
      waste: 0,
      streak: 0,
      bestStreak: 0,
      happiness: [],
      finished: false,
      result: null,
      failureReason: null,
      returnPosition: returnPosition ? { x: Number(returnPosition.x), y: Number(returnPosition.y) } : null,
      returnFacing,
    };
    this.nextSessionId += 1;
    this.spawnOrders();
    return { ok: true, code: "bakery-shift-started", session: this.getActiveSession(), expectedStep: this.expectedStep() };
  }

  spawnOrders() {
    const session = this.activeSession;
    if (!session || session.finished) return 0;
    let spawned = 0;
    while (session.spawnIndex < session.orders.length && session.orders[session.spawnIndex].at <= session.elapsed && session.activeOrderIds.length < BAKERY_CONFIG.maxCustomers) {
      const order = session.orders[session.spawnIndex];
      order.status = "active";
      session.activeOrderIds.push(order.id);
      session.spawnIndex += 1;
      spawned += 1;
    }
    for (const id of session.activeOrderIds) {
      if (session.trays.some((tray) => tray.orderId === id)) continue;
      const tray = session.trays.find((candidate) => !candidate.orderId);
      if (!tray) break;
      tray.orderId = id;
    }
    const firstOccupied = session.trays.find((tray) => tray.orderId);
    if (!session.trays[session.activeTray]?.orderId && firstOccupied) session.activeTray = firstOccupied.index;
    return spawned;
  }

  orderById(id) { return this.activeSession?.orders.find((order) => order.id === id) || null; }
  activeOrders() { return (this.activeSession?.activeOrderIds || []).map((id) => this.orderById(id)).filter(Boolean); }
  tray(index = this.activeSession?.activeTray) { return this.activeSession?.trays?.[index] || null; }
  orderForTray(tray = this.tray()) { return tray?.orderId ? this.orderById(tray.orderId) : null; }
  currentOrder() { return this.orderForTray(this.tray()); }
  currentRecipe(tray = this.tray()) { return recipeForOrder(this.orderForTray(tray), tray?.recipeIndex || 0, BAKERY_RECIPES); }
  expectedStep(tray = this.tray()) { return this.currentRecipe(tray)?.steps?.[tray?.stepIndex || 0] || null; }

  selectTray(index) {
    const session = this.activeSession;
    const tray = session?.trays?.[Number(index)];
    if (!session || session.finished || !tray?.orderId) return { ok: false, code: "tray-unavailable", message: "Choose an occupied preparation tray." };
    session.activeTray = tray.index;
    return { ok: true, code: "tray-selected", tray: structuredClone(tray), order: structuredClone(this.orderForTray(tray)), expectedStep: this.expectedStep(tray) };
  }

  recordMistake(message, tray = this.tray()) {
    const session = this.activeSession;
    if (!session || session.finished) return { ok: false, code: "no-active-shift", message: "Start a bakery shift first." };
    session.mistakes += 1;
    const order = this.orderForTray(tray);
    if (order) order.patience = Math.max(-BAKERY_CONFIG.graceSeconds, order.patience - 1.5);
    return { ok: false, code: "wrong-step", message, expectedStep: this.expectedStep(tray), mistakes: session.mistakes };
  }

  applyStep(stepId, trayIndex = this.activeSession?.activeTray) {
    const session = this.activeSession;
    const tray = this.tray(trayIndex);
    if (!session || session.finished || !tray?.orderId) return { ok: false, code: "no-active-preparation", message: "Choose an active customer tray first." };
    session.activeTray = tray.index;
    const recipe = this.currentRecipe(tray);
    const result = applyRecipeStep(tray, recipe, stepId, bakeryStep);
    if (!result.ok && result.code === "unknown-step") return this.recordMistake("Choose a valid bakery ingredient or kitchen station.", tray);
    if (!result.ok && result.code === "wrong-step") return this.recordMistake(`That dish needs ${bakeryStep(result.expectedStep).name} next.`, tray);
    if (!result.ok) return result;
    return { ...result, recipe, recipeId: this.orderForTray(tray).recipes[tray.recipeIndex], tray: structuredClone(tray), session: this.getActiveSession() };
  }

  undoStep(trayIndex = this.activeSession?.activeTray) {
    const tray = this.tray(trayIndex);
    if (!tray?.orderId) return { ok: false, code: "no-active-preparation", message: "Choose an active customer tray first." };
    const result = undoRecipeStep(tray);
    return result.ok ? { ...result, expectedStep: this.expectedStep(tray), tray: structuredClone(tray) } : result;
  }

  discardTray(trayIndex = this.activeSession?.activeTray) {
    const session = this.activeSession;
    const tray = this.tray(trayIndex);
    if (!session || session.finished || !tray?.orderId) return { ok: false, code: "no-active-preparation", message: "Choose an active customer tray first." };
    if (!resetRecipePreparation(tray) && tray.completedRecipes.length === 0) return { ok: false, code: "nothing-to-discard", message: "The tray is already empty." };
    tray.recipeIndex = 0;
    tray.completedRecipes = [];
    session.waste += 1;
    session.mistakes += 1;
    return { ok: true, code: "tray-discarded", waste: session.waste, expectedStep: this.expectedStep(tray) };
  }

  discardRecipe(trayIndex = this.activeSession?.activeTray) { return this.discardTray(trayIndex); }

  serveActive(trayIndex = this.activeSession?.activeTray) {
    const session = this.activeSession;
    const tray = this.tray(trayIndex);
    const order = this.orderForTray(tray);
    const recipe = this.currentRecipe(tray);
    if (!session || session.finished || !tray || !order || !recipe) return { ok: false, code: "no-active-preparation", message: "Choose an active customer tray first." };
    session.activeTray = tray.index;
    if (tray.stepIndex !== recipe.steps.length) return this.recordMistake(`${recipe.name} still needs ${bakeryStep(this.expectedStep(tray)).name}.`, tray);
    const checkpoint = structuredClone(session);
    tray.completedRecipes.push(order.recipes[tray.recipeIndex]);
    tray.recipeIndex += 1;
    resetRecipePreparation(tray);
    if (tray.recipeIndex < order.recipes.length) {
      return { ok: true, code: "dish-added", message: `${recipe.name} added to the order.`, nextRecipe: this.currentRecipe(tray), tray: structuredClone(tray) };
    }
    const happiness = Math.max(0, Math.min(1, order.patience / order.maxPatience));
    session.happiness.push(happiness);
    session.served += 1;
    session.streak += 1;
    session.bestStreak = Math.max(session.bestStreak, session.streak);
    order.status = "served";
    session.activeOrderIds = session.activeOrderIds.filter((id) => id !== order.id);
    Object.assign(tray, emptyTray(tray.index));
    this.spawnOrders();
    const nextTray = session.trays.find((candidate) => candidate.orderId);
    if (nextTray) session.activeTray = nextTray.index;
    if (session.served >= session.level.target && session.spawnIndex >= session.orders.length && session.activeOrderIds.length === 0) {
      const finished = this.finishSession();
      if (finished.ok) return { ...finished, code: "bakery-shift-complete", customerName: order.customerName, customerOutcome: "loved" };
      this.activeSession = checkpoint;
      return finished;
    }
    return { ok: true, code: "customer-served", customerName: order.customerName, customerOutcome: "loved", served: session.served, nextCustomer: this.orderForTray(this.tray())?.customerName || null, session: this.getActiveSession() };
  }

  serveRecipe(trayIndex = this.activeSession?.activeTray) { return this.serveActive(trayIndex); }

  tick(seconds) {
    const session = this.activeSession;
    if (!session || session.finished) return { ok: false, code: "no-active-shift" };
    const delta = Math.max(0, Math.min(1, Number(seconds) || 0));
    session.elapsed = Math.min(session.level.duration, session.elapsed + delta);
    const spawned = this.spawnOrders();
    for (const order of this.activeOrders()) {
      order.patience -= delta;
      if (order.patience <= -BAKERY_CONFIG.graceSeconds) {
        session.missed += 1;
        session.streak = 0;
        session.failureReason = `${order.customerName} left before the order was ready.`;
        return this.finishSession({ failureReason: session.failureReason });
      }
    }
    if (session.elapsed >= session.level.duration) {
      session.missed += session.level.target - session.served;
      session.streak = 0;
      session.failureReason = "The bakery shift timer ended.";
      return this.finishSession({ failureReason: session.failureReason });
    }
    return { ok: true, code: "bakery-tick", remaining: session.level.duration - session.elapsed, spawned, activeOrders: session.activeOrderIds.length };
  }

  finishSession({ failureReason = null } = {}) {
    const session = this.activeSession;
    if (!session || session.finished) return { ok: false, code: "shift-already-finished", message: "This bakery shift is already finished." };
    const result = recipeOrderScore(session);
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
          ledger = appendLedger(state, this.now(), { amount: coins, kind: "little-bakery-first-clear", reason: `Little Bakery Level ${level} first clear`, level, score: result.score, stars: result.stars, served: result.served, venue: "bakery" });
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
    return transaction;
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
      trays: BAKERY_CONFIG.trayCount,
      unlockedLevel: state.unlockedLevel,
      completedLevels: Object.keys(state.completed).length,
      totalStars: state.totalStars,
      lifetimeServed: state.lifetimeServed,
      activeSession: Boolean(this.activeSession && !this.activeSession.finished),
      activeOrders: this.activeSession?.activeOrderIds.length || 0,
    };
  }
}
