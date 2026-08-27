import {
  RIVERSIDE_KITCHEN_APPLIANCES,
  RIVERSIDE_KITCHEN_CONFIG,
  RIVERSIDE_KITCHEN_INGREDIENTS,
  RIVERSIDE_KITCHEN_LEVELS,
  RIVERSIDE_KITCHEN_RECIPES,
  riversideKitchenFirstClearCoins,
  riversideKitchenLevel,
  riversideKitchenStep,
} from "../data/riversideKitchen.js";
import { NPC_RESIDENTS } from "../data/npcTownLife.js";
import { COIN_LEDGER_LIMIT } from "../state/economyState.js";
import { normalizeRiversideKitchenActiveShift } from "../state/riversideKitchenState.js";
import {
  applyRecipeStep,
  recipeForOrder,
  recipeOrderScore,
  resetRecipePreparation,
  undoRecipeStep,
} from "./RecipeOrderService.js";
import {
  activeApplianceForTray,
  advanceRestaurantAppliances,
  applianceFor,
  cancelRestaurantTrayAppliances,
  clearRestaurantAppliance,
  createRestaurantAppliances,
  startRestaurantAppliance,
} from "./RestaurantApplianceRuntime.js";

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

export class RiversideKitchenService {
  constructor(gameState, repository, { now = () => Date.now() } = {}) {
    this.gameState = gameState;
    this.repository = repository;
    this.now = now;
    this.activeSession = normalizeRiversideKitchenActiveShift(this.getSnapshot().activeShift);
    this.nextSessionId = Math.max(1, this.getSnapshot().shifts + 1);
    this.lastCheckpointSecond = Math.floor(this.activeSession?.elapsed || 0);
    this.listeners = new Set();
  }

  subscribe(listener) {
    if (typeof listener !== "function") throw new TypeError("A Riverside Kitchen listener must be a function.");
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(result) {
    const snapshot = this.getSnapshot();
    for (const listener of this.listeners) listener(snapshot, result);
  }

  getSnapshot() { return structuredClone(this.gameState.getSnapshot().riversideKitchen); }
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
      return { ok: false, code: "persistence-failed", message: "The Riverside Kitchen save failed, so the shift, progress and coins were restored safely.", save: saved, rollbackOk: rollback.ok };
    }
    const result = { ...mutation, state: this.gameState.getSnapshot(), save: saved };
    this.emit(result);
    return result;
  }

  persistActiveSession() {
    const activeShift = this.activeSession && !this.activeSession.finished ? structuredClone(this.activeSession) : null;
    const persisted = this.commit((state) => {
      state.riversideKitchen.activeShift = activeShift;
      return { ok: true, code: activeShift ? "riverside-kitchen-shift-checkpointed" : "riverside-kitchen-shift-cleared" };
    });
    if (persisted.ok) this.lastCheckpointSecond = Math.floor(this.activeSession?.elapsed || 0);
    return persisted;
  }

  restorePersistedSession() {
    if (this.activeSession && !this.activeSession.finished) return { ok: true, code: "riverside-kitchen-shift-already-active", session: this.getActiveSession(), expectedStep: this.expectedStep() };
    const restored = normalizeRiversideKitchenActiveShift(this.getSnapshot().activeShift);
    if (!restored) return { ok: false, code: "no-saved-shift", message: "No Riverside Kitchen shift is waiting to resume." };
    this.activeSession = restored;
    this.lastCheckpointSecond = Math.floor(restored.elapsed);
    return { ok: true, code: "riverside-kitchen-shift-resumed", session: this.getActiveSession(), expectedStep: this.expectedStep() };
  }

  startLevel(number = 1, { returnPosition, returnFacing = "down", instantOrders = false } = {}) {
    if (this.activeSession && !this.activeSession.finished) return { ok: false, code: "shift-active", message: "Resume or save and exit the current Riverside Kitchen shift first." };
    if (this.getSnapshot().activeShift) return { ok: false, code: "resume-available", message: "A saved Riverside Kitchen shift is ready to resume." };
    const level = riversideKitchenLevel(number);
    const progress = this.getSnapshot();
    if (level.level > progress.unlockedLevel) return { ok: false, code: "level-locked", message: "Complete the previous Riverside Kitchen shift first." };
    const names = NPC_RESIDENTS.map((resident) => resident.name);
    const orders = level.orders.map((customerOrder, index) => ({
      id: `riverside-kitchen-order-${index + 1}`,
      at: instantOrders ? 0 : customerOrder.at,
      recipes: [...customerOrder.recipes],
      customerName: names[(level.level * 3 + (index + 1) * 7) % names.length] || `Diner ${index + 1}`,
      maxPatience: level.patience + Math.max(0, customerOrder.recipes.length - 1) * 12,
      patience: level.patience + Math.max(0, customerOrder.recipes.length - 1) * 12,
      status: "waiting",
    }));
    this.activeSession = {
      id: `riverside-kitchen-shift-${String(this.nextSessionId).padStart(4, "0")}`,
      level,
      orders,
      spawnIndex: 0,
      activeOrderIds: [],
      trays: Array.from({ length: RIVERSIDE_KITCHEN_CONFIG.trayCount }, (_, index) => emptyTray(index)),
      appliances: createRestaurantAppliances(RIVERSIDE_KITCHEN_APPLIANCES, null, RIVERSIDE_KITCHEN_CONFIG.trayCount),
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
    const persisted = this.persistActiveSession();
    if (!persisted.ok) { this.activeSession = null; return persisted; }
    return { ok: true, code: "riverside-kitchen-shift-started", session: this.getActiveSession(), expectedStep: this.expectedStep(), save: persisted.save };
  }

  spawnOrders() {
    const session = this.activeSession;
    if (!session || session.finished) return 0;
    let spawned = 0;
    while (session.spawnIndex < session.orders.length && session.orders[session.spawnIndex].at <= session.elapsed && session.activeOrderIds.length < RIVERSIDE_KITCHEN_CONFIG.maxCustomers) {
      const customerOrder = session.orders[session.spawnIndex];
      customerOrder.status = "active";
      session.activeOrderIds.push(customerOrder.id);
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

  orderById(id) { return this.activeSession?.orders.find((customerOrder) => customerOrder.id === id) || null; }
  activeOrders() { return (this.activeSession?.activeOrderIds || []).map((id) => this.orderById(id)).filter(Boolean); }
  tray(index = this.activeSession?.activeTray) { return this.activeSession?.trays?.[index] || null; }
  orderForTray(tray = this.tray()) { return tray?.orderId ? this.orderById(tray.orderId) : null; }
  currentRecipe(tray = this.tray()) { return recipeForOrder(this.orderForTray(tray), tray?.recipeIndex || 0, RIVERSIDE_KITCHEN_RECIPES); }
  expectedStep(tray = this.tray()) { return this.currentRecipe(tray)?.steps?.[tray?.stepIndex || 0] || null; }
  appliance(id) { return structuredClone(applianceFor(this.activeSession, id)); }
  activeAppliance(trayIndex = this.activeSession?.activeTray) { return structuredClone(activeApplianceForTray(this.activeSession, trayIndex)); }

  persistMutation(checkpoint, result) {
    const saved = this.persistActiveSession();
    if (!saved.ok) { this.activeSession = checkpoint; return saved; }
    return { ...result, save: saved.save };
  }

  useAppliance(stepId, trayIndex = this.activeSession?.activeTray, { durationScale = 1 } = {}) {
    const session = this.activeSession;
    const tray = this.tray(trayIndex);
    const definition = RIVERSIDE_KITCHEN_APPLIANCES[stepId];
    const appliance = applianceFor(session, stepId);
    if (!session || session.finished || !tray?.orderId) return { ok: false, code: "no-active-preparation", message: "Choose an active diner tray first." };
    const checkpoint = structuredClone(session);
    if (!definition || !appliance) return this.recordMistake("Choose a valid Riverside Kitchen station.", tray);
    if (appliance.status === "burnt") {
      clearRestaurantAppliance(appliance);
      session.waste += 1;
      session.mistakes += 1;
      return this.persistMutation(checkpoint, { ok: false, code: "station-burnt", message: `${definition.name} burnt. Cleared—cook that step again.`, expectedStep: this.expectedStep(tray), waste: session.waste, mistakes: session.mistakes });
    }
    if (appliance.status === "cooking") return { ok: false, code: "station-cooking", message: `${definition.name} is still cooking.` };
    if (appliance.status === "ready") {
      const owner = this.tray(appliance.trayIndex);
      if (!owner?.orderId || this.expectedStep(owner) !== stepId) {
        clearRestaurantAppliance(appliance);
        session.waste += 1;
        return this.persistMutation(checkpoint, { ok: false, code: "station-orphaned", message: `${definition.name} no longer matches that tray, so it was cleared.`, waste: session.waste });
      }
      session.activeTray = owner.index;
      const recipe = this.currentRecipe(owner);
      const result = applyRecipeStep(owner, recipe, stepId, riversideKitchenStep);
      if (!result.ok) { this.activeSession = checkpoint; return result; }
      clearRestaurantAppliance(appliance);
      return this.persistMutation(checkpoint, { ...result, code: "appliance-collected", applianceId: stepId, recipe, recipeId: this.orderForTray(owner).recipes[owner.recipeIndex], tray: structuredClone(owner), session: this.getActiveSession() });
    }
    const expected = this.expectedStep(tray);
    if (expected !== stepId) { this.activeSession = checkpoint; return this.recordMistake(expected ? `That meal needs ${riversideKitchenStep(expected).name} next.` : "Finish the prepared meal first.", this.tray(trayIndex)); }
    if (!startRestaurantAppliance(session, RIVERSIDE_KITCHEN_APPLIANCES, stepId, tray.index, durationScale)) return { ok: false, code: "station-unavailable", message: `${definition.name} is unavailable.` };
    return this.persistMutation(checkpoint, { ok: true, code: "appliance-started", applianceId: stepId, appliance: this.appliance(stepId), tray: structuredClone(tray) });
  }

  selectTray(index) {
    const session = this.activeSession;
    const tray = session?.trays?.[Number(index)];
    if (!session || session.finished || !tray?.orderId) return { ok: false, code: "tray-unavailable", message: "Choose an occupied meal preparation tray." };
    const checkpoint = structuredClone(session);
    session.activeTray = tray.index;
    return this.persistMutation(checkpoint, { ok: true, code: "tray-selected", tray: structuredClone(tray), order: structuredClone(this.orderForTray(tray)), expectedStep: this.expectedStep(tray) });
  }

  recordMistake(message, tray = this.tray()) {
    const session = this.activeSession;
    if (!session || session.finished) return { ok: false, code: "no-active-shift", message: "Start a Riverside Kitchen shift first." };
    const checkpoint = structuredClone(session);
    session.mistakes += 1;
    const customerOrder = this.orderForTray(tray);
    if (customerOrder) customerOrder.patience = Math.max(-RIVERSIDE_KITCHEN_CONFIG.graceSeconds, customerOrder.patience - 1.5);
    const saved = this.persistActiveSession();
    if (!saved.ok) { this.activeSession = checkpoint; return saved; }
    return { ok: false, code: "wrong-step", message, expectedStep: this.expectedStep(tray), mistakes: session.mistakes, save: saved.save };
  }

  recordBurn(trayIndex = this.activeSession?.activeTray) {
    const session = this.activeSession;
    const tray = this.tray(trayIndex);
    if (!session || session.finished || !tray?.orderId) return { ok: false, code: "no-active-preparation", message: "Choose an active diner tray first." };
    const checkpoint = structuredClone(session);
    session.activeTray = tray.index;
    session.waste += 1;
    session.mistakes += 1;
    return this.persistMutation(checkpoint, {
      ok: false,
      code: "station-burnt",
      message: "That component burnt. Clear the station and cook it again.",
      expectedStep: this.expectedStep(tray),
      waste: session.waste,
      mistakes: session.mistakes,
    });
  }

  applyStep(stepId, trayIndex = this.activeSession?.activeTray) {
    const session = this.activeSession;
    const tray = this.tray(trayIndex);
    if (!session || session.finished || !tray?.orderId) return { ok: false, code: "no-active-preparation", message: "Choose an active diner tray first." };
    const checkpoint = structuredClone(session);
    session.activeTray = tray.index;
    const recipe = this.currentRecipe(tray);
    const result = applyRecipeStep(tray, recipe, stepId, riversideKitchenStep);
    if (!result.ok && result.code === "unknown-step") { this.activeSession = checkpoint; return this.recordMistake("Choose a valid Riverside Kitchen ingredient, heat setting or station.", this.tray(trayIndex)); }
    if (!result.ok && result.code === "wrong-step") { this.activeSession = checkpoint; return this.recordMistake(`That meal needs ${riversideKitchenStep(result.expectedStep).name} next.`, this.tray(trayIndex)); }
    if (!result.ok) return result;
    return this.persistMutation(checkpoint, { ...result, recipe, recipeId: this.orderForTray(tray).recipes[tray.recipeIndex], tray: structuredClone(tray), session: this.getActiveSession() });
  }

  undoStep(trayIndex = this.activeSession?.activeTray) {
    const tray = this.tray(trayIndex);
    if (!tray?.orderId) return { ok: false, code: "no-active-preparation", message: "Choose an active diner tray first." };
    const checkpoint = structuredClone(this.activeSession);
    if (cancelRestaurantTrayAppliances(this.activeSession, tray.index)) return this.persistMutation(checkpoint, { ok: true, code: "appliance-cancelled", message: "The active station was stopped.", expectedStep: this.expectedStep(tray), tray: structuredClone(tray) });
    const result = undoRecipeStep(tray);
    return result.ok ? this.persistMutation(checkpoint, { ...result, expectedStep: this.expectedStep(tray), tray: structuredClone(tray) }) : result;
  }

  discardTray(trayIndex = this.activeSession?.activeTray) {
    const session = this.activeSession;
    const tray = this.tray(trayIndex);
    if (!session || session.finished || !tray?.orderId) return { ok: false, code: "no-active-preparation", message: "Choose an active diner tray first." };
    const checkpoint = structuredClone(session);
    const cancelled = cancelRestaurantTrayAppliances(session, tray.index);
    if (!resetRecipePreparation(tray) && tray.completedRecipes.length === 0 && !cancelled) return { ok: false, code: "nothing-to-discard", message: "The tray is already empty." };
    tray.recipeIndex = 0;
    tray.completedRecipes = [];
    session.waste += 1;
    session.mistakes += 1;
    return this.persistMutation(checkpoint, { ok: true, code: "tray-discarded", waste: session.waste, expectedStep: this.expectedStep(tray) });
  }

  serveActive(trayIndex = this.activeSession?.activeTray) {
    const session = this.activeSession;
    const tray = this.tray(trayIndex);
    const customerOrder = this.orderForTray(tray);
    const recipe = this.currentRecipe(tray);
    if (!session || session.finished || !tray || !customerOrder || !recipe) return { ok: false, code: "no-active-preparation", message: "Choose an active diner tray first." };
    session.activeTray = tray.index;
    if (tray.stepIndex !== recipe.steps.length) return this.recordMistake(`${recipe.name} still needs ${riversideKitchenStep(this.expectedStep(tray)).name}.`, tray);
    const checkpoint = structuredClone(session);
    tray.completedRecipes.push(customerOrder.recipes[tray.recipeIndex]);
    tray.recipeIndex += 1;
    resetRecipePreparation(tray);
    if (tray.recipeIndex < customerOrder.recipes.length) return this.persistMutation(checkpoint, { ok: true, code: "meal-added", message: `${recipe.name} added to the order.`, nextRecipe: this.currentRecipe(tray), tray: structuredClone(tray) });
    const happiness = Math.max(0, Math.min(1, customerOrder.patience / customerOrder.maxPatience));
    session.happiness.push(happiness);
    session.served += 1;
    session.streak += 1;
    session.bestStreak = Math.max(session.bestStreak, session.streak);
    customerOrder.status = "served";
    session.activeOrderIds = session.activeOrderIds.filter((id) => id !== customerOrder.id);
    cancelRestaurantTrayAppliances(session, tray.index);
    Object.assign(tray, emptyTray(tray.index));
    this.spawnOrders();
    const nextTray = session.trays.find((candidate) => candidate.orderId);
    if (nextTray) session.activeTray = nextTray.index;
    if (session.served >= session.level.target && session.spawnIndex >= session.orders.length && session.activeOrderIds.length === 0) {
      const finished = this.finishSession();
      if (finished.ok) return { ...finished, code: "riverside-kitchen-shift-complete", customerName: customerOrder.customerName, customerOutcome: "loved" };
      this.activeSession = checkpoint;
      return finished;
    }
    return this.persistMutation(checkpoint, { ok: true, code: "diner-served", customerName: customerOrder.customerName, customerOutcome: "loved", served: session.served, nextCustomer: this.orderForTray(this.tray())?.customerName || null, session: this.getActiveSession() });
  }

  tick(seconds) {
    const session = this.activeSession;
    if (!session || session.finished) return { ok: false, code: "no-active-shift" };
    const checkpoint = structuredClone(session);
    const delta = Math.max(0, Math.min(1, Number(seconds) || 0));
    session.elapsed = Math.min(session.level.duration, session.elapsed + delta);
    const spawned = this.spawnOrders();
    const applianceChanges = advanceRestaurantAppliances(session, delta);
    if (applianceChanges.some((change) => change.status === "burnt")) session.streak = 0;
    for (const customerOrder of this.activeOrders()) {
      customerOrder.patience -= delta;
      if (customerOrder.patience <= -RIVERSIDE_KITCHEN_CONFIG.graceSeconds) {
        session.missed += 1;
        session.streak = 0;
        session.failureReason = `${customerOrder.customerName} left before the meal was ready.`;
        const finished = this.finishSession({ failureReason: session.failureReason });
        if (!finished.ok) this.activeSession = checkpoint;
        return finished;
      }
    }
    if (session.elapsed >= session.level.duration) {
      session.missed += session.level.target - session.served;
      session.streak = 0;
      session.failureReason = "The Riverside Kitchen shift timer ended.";
      const finished = this.finishSession({ failureReason: session.failureReason });
      if (!finished.ok) this.activeSession = checkpoint;
      return finished;
    }
    if (applianceChanges.length || Math.floor(session.elapsed) > this.lastCheckpointSecond) {
      const saved = this.persistActiveSession();
      if (!saved.ok) { this.activeSession = checkpoint; return saved; }
    }
    return { ok: true, code: "riverside-kitchen-tick", remaining: session.level.duration - session.elapsed, spawned, activeOrders: session.activeOrderIds.length, applianceChanges };
  }

  finishSession({ failureReason = null } = {}) {
    const session = this.activeSession;
    if (!session || session.finished) return { ok: false, code: "shift-already-finished", message: "This Riverside Kitchen shift is already finished." };
    const result = recipeOrderScore(session);
    if (failureReason) result.failureReason = failureReason;
    const transaction = this.commit((state) => {
      const progress = state.riversideKitchen;
      const level = session.level.level;
      const firstClear = result.won && !progress.completed[level];
      let coins = 0;
      let ledger = null;
      if (result.won) {
        const previous = progress.best[level];
        if (!previous || result.score > previous.score) progress.best[level] = { score: result.score, stars: result.stars, served: result.served, accuracy: result.accuracy };
        progress.completed[level] = true;
        progress.unlockedLevel = Math.max(progress.unlockedLevel, Math.min(RIVERSIDE_KITCHEN_CONFIG.levelCount, level + 1));
        if (firstClear) {
          coins = riversideKitchenFirstClearCoins(level, result.stars);
          if (state.economy.coins + coins > Number.MAX_SAFE_INTEGER) return { ok: false, code: "balance-overflow", message: "Coin balance limit reached." };
          state.economy.coins += coins;
          state.economy.lifetimeCoinsEarned += coins;
          progress.lifetimeCoins += coins;
          ledger = appendLedger(state, this.now(), { amount: coins, kind: "riverside-kitchen-first-clear", reason: `Riverside Kitchen Level ${level} first clear`, level, score: result.score, stars: result.stars, served: result.served, venue: "riverside" });
        }
      }
      progress.shifts += 1;
      progress.lifetimeServed += result.served;
      progress.totalStars = Object.values(progress.best).reduce((sum, record) => sum + record.stars, 0);
      progress.lastLevel = level;
      progress.lastOutcome = result.won ? "won" : "lost";
      progress.activeShift = null;
      return { ok: true, code: result.won ? "riverside-kitchen-result-won" : "riverside-kitchen-result-lost", result: { ...result, coins, firstClear }, coins, firstClear, ledger };
    });
    if (!transaction.ok) return transaction;
    session.finished = true;
    session.result = transaction.result;
    return transaction;
  }

  suspend() {
    if (!this.activeSession || this.activeSession.finished) return { ok: false, code: "no-active-shift", message: "No active Riverside Kitchen shift needs saving." };
    const session = this.getActiveSession();
    const persisted = this.persistActiveSession();
    if (!persisted.ok) return persisted;
    this.activeSession = null;
    return { ok: true, code: "riverside-kitchen-shift-suspended", session, save: persisted.save };
  }

  cancel() {
    if (!this.activeSession && !this.getSnapshot().activeShift) return { ok: false, code: "no-active-shift", message: "No Riverside Kitchen shift is open." };
    const session = this.getActiveSession() || normalizeRiversideKitchenActiveShift(this.getSnapshot().activeShift);
    const checkpoint = this.activeSession;
    this.activeSession = null;
    const cleared = this.persistActiveSession();
    if (!cleared.ok) { this.activeSession = checkpoint; return cleared; }
    return { ok: true, code: "riverside-kitchen-shift-cancelled", session, save: cleared.save };
  }

  getDiagnostics() {
    const state = this.getSnapshot();
    const active = this.activeSession || normalizeRiversideKitchenActiveShift(state.activeShift);
    return {
      levels: RIVERSIDE_KITCHEN_LEVELS.length,
      recipes: Object.keys(RIVERSIDE_KITCHEN_RECIPES).length,
      ingredients: Object.keys(RIVERSIDE_KITCHEN_INGREDIENTS).length,
      appliances: Object.keys(RIVERSIDE_KITCHEN_APPLIANCES).length,
      trays: RIVERSIDE_KITCHEN_CONFIG.trayCount,
      unlockedLevel: state.unlockedLevel,
      completedLevels: Object.keys(state.completed).length,
      totalStars: state.totalStars,
      lifetimeServed: state.lifetimeServed,
      activeSession: Boolean(this.activeSession && !this.activeSession.finished),
      activeAppliances: Object.values(active?.appliances || {}).filter((appliance) => appliance.status !== "idle").length,
      resumableSession: Boolean(active && !active.finished),
      resumableLevel: active?.level.level || null,
    };
  }
}
