import {
  SOUTH_SHORE_SCOOPS_ALL_FAMILIES,
  SOUTH_SHORE_SCOOPS_CONFIG,
  SOUTH_SHORE_SCOOPS_LEVELS,
  SOUTH_SHORE_SCOOPS_PARTS,
  SOUTH_SHORE_SCOOPS_PART_UNLOCKS,
  SOUTH_SHORE_SCOOPS_RESTORATION_MILESTONES,
  southShoreScoopsAvailableParts,
  southShoreScoopsFirstClearCoins,
  southShoreScoopsLevel,
  southShoreScoopsPart,
  southShoreScoopsResult,
  southShoreScoopsUnlockedFamilies,
} from "../data/southShoreScoops.js";
import { COIN_LEDGER_LIMIT } from "../state/economyState.js";
import { normalizeSouthShoreScoopsActiveShift } from "../state/southShoreScoopsState.js";

function appendLedger(state, now, details) {
  const id = `coin-${String(state.economy.nextTransactionId).padStart(6, "0")}`;
  state.economy.nextTransactionId += 1;
  const entry = { id, itemId: null, quantity: null, occurredAt: new Date(now).toISOString(), ...details };
  state.economy.ledger.push(entry);
  state.economy.ledger = state.economy.ledger.slice(-COIN_LEDGER_LIMIT);
  return entry;
}

function sameParts(left, right) {
  return Array.isArray(left) && left.length === right.length && left.every((id, index) => id === right[index]);
}

function copyOrder(order, patience) {
  return {
    id: order.id,
    number: order.number,
    customerName: order.customerName,
    avatar: order.avatar,
    items: order.items.map((item) => ({ ...item, parts: [...item.parts] })),
    maxPatience: patience,
    patience,
    status: "waiting",
  };
}

export class SouthShoreScoopsService {
  constructor(gameState, repository, { now = () => Date.now() } = {}) {
    this.gameState = gameState;
    this.repository = repository;
    this.now = now;
    this.activeSession = normalizeSouthShoreScoopsActiveShift(this.getSnapshot().activeShift);
    this.nextSessionId = Math.max(1, this.getSnapshot().shifts + 1);
    this.lastCheckpointSecond = Math.floor(this.activeSession?.elapsed || 0);
    this.listeners = new Set();
  }

  subscribe(listener) {
    if (typeof listener !== "function") throw new TypeError("A South Shore Scoops listener must be a function.");
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(result) {
    const snapshot = this.getSnapshot();
    for (const listener of this.listeners) listener(snapshot, result);
  }

  getSnapshot() { return structuredClone(this.gameState.getSnapshot().southShoreScoops); }
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
      return { ok: false, code: "persistence-failed", message: "The South Shore Scoops save failed, so the shift, progress and coins were restored safely.", save: saved, rollbackOk: rollback.ok };
    }
    const result = { ...mutation, state: this.gameState.getSnapshot(), save: saved };
    this.emit(result);
    return result;
  }

  persistActiveSession() {
    const activeShift = this.activeSession && !this.activeSession.finished ? structuredClone(this.activeSession) : null;
    const persisted = this.commit((state) => {
      state.southShoreScoops.activeShift = activeShift;
      return { ok: true, code: activeShift ? "south-shore-scoops-shift-checkpointed" : "south-shore-scoops-shift-cleared" };
    });
    if (persisted.ok) this.lastCheckpointSecond = Math.floor(this.activeSession?.elapsed || 0);
    return persisted;
  }

  restorePersistedSession() {
    if (this.activeSession && !this.activeSession.finished) return { ok: true, code: "south-shore-scoops-shift-already-active", session: this.getActiveSession(), expectedPart: this.nextExpectedPart() };
    const restored = normalizeSouthShoreScoopsActiveShift(this.getSnapshot().activeShift);
    if (!restored) return { ok: false, code: "no-saved-shift", message: "No South Shore Scoops shift is waiting to resume." };
    this.activeSession = restored;
    this.lastCheckpointSecond = Math.floor(restored.elapsed);
    return { ok: true, code: "south-shore-scoops-shift-resumed", session: this.getActiveSession(), expectedPart: this.nextExpectedPart() };
  }

  startLevel(number = 1, { returnPosition, returnFacing = "down" } = {}) {
    if (this.activeSession && !this.activeSession.finished) return { ok: false, code: "shift-active", message: "Resume or save and exit the current South Shore Scoops shift first." };
    if (this.getSnapshot().activeShift) return { ok: false, code: "resume-available", message: "A saved South Shore Scoops shift is ready to resume." };
    const level = southShoreScoopsLevel(number);
    const progress = this.getSnapshot();
    if (level.level > progress.unlockedLevel) return { ok: false, code: "level-locked", message: "Complete the previous South Shore Scoops shift first." };
    const orders = level.orders.map((order) => copyOrder(order, level.patience));
    this.activeSession = {
      id: `south-shore-scoops-shift-${String(this.nextSessionId).padStart(4, "0")}`,
      level,
      orders,
      spawnIndex: 0,
      activeOrderIds: [],
      selectedOrderId: null,
      work: {},
      elapsed: 0,
      served: 0,
      missed: 0,
      mistakes: 0,
      waste: 0,
      processed: 0,
      score: 0,
      happiness: [],
      finished: false,
      result: null,
      returnPosition: returnPosition ? { x: Number(returnPosition.x), y: Number(returnPosition.y) } : null,
      returnFacing,
    };
    this.nextSessionId += 1;
    this.fillQueue();
    const persisted = this.persistActiveSession();
    if (!persisted.ok) { this.activeSession = null; return persisted; }
    return { ok: true, code: "south-shore-scoops-shift-started", session: this.getActiveSession(), expectedPart: this.nextExpectedPart(), save: persisted.save };
  }

  fillQueue() {
    const session = this.activeSession;
    if (!session || session.finished) return 0;
    let spawned = 0;
    while (session.activeOrderIds.length < session.level.queueCap && session.spawnIndex < session.orders.length) {
      const order = session.orders[session.spawnIndex];
      order.status = "active";
      session.activeOrderIds.push(order.id);
      session.work[order.id] = session.work[order.id] || { build: [], tray: [] };
      session.spawnIndex += 1;
      spawned += 1;
    }
    session.selectedOrderId = session.activeOrderIds[0] || null;
    return spawned;
  }

  orderById(id) { return this.activeSession?.orders.find((order) => order.id === id) || null; }
  activeOrders() { return (this.activeSession?.activeOrderIds || []).map((id) => this.orderById(id)).filter(Boolean); }
  currentOrder() { return this.orderById(this.activeSession?.selectedOrderId) || this.activeOrders()[0] || null; }
  work(order = this.currentOrder()) { return order ? this.activeSession?.work?.[order.id] || null : null; }
  expectedItem(order = this.currentOrder()) { const work = this.work(order); return order && work ? order.items[work.tray.length] || null : null; }

  nextExpectedPart(order = this.currentOrder()) {
    const work = this.work(order);
    const expected = this.expectedItem(order);
    if (!work || !expected) return null;
    for (let index = 0; index < work.build.length; index += 1) if (work.build[index] !== expected.parts[index]) return null;
    return expected.parts[work.build.length] || null;
  }

  previewOrders() {
    const session = this.activeSession;
    if (!session) return [];
    return session.orders.slice(session.spawnIndex, session.spawnIndex + Math.max(0, SOUTH_SHORE_SCOOPS_CONFIG.maxVisibleQueue - 1)).map((order) => structuredClone(order));
  }

  visibleQueue() {
    return [...this.activeOrders(), ...this.previewOrders()].slice(0, SOUTH_SHORE_SCOOPS_CONFIG.maxVisibleQueue);
  }

  persistMutation(checkpoint, result) {
    const saved = this.persistActiveSession();
    if (!saved.ok) { this.activeSession = checkpoint; return saved; }
    return { ...result, save: saved.save, session: this.getActiveSession() };
  }

  addPart(id) {
    const session = this.activeSession;
    const order = this.currentOrder();
    const work = this.work(order);
    const part = southShoreScoopsPart(id);
    if (!session || session.finished || !order || !work) return { ok: false, code: "no-active-preparation", message: "Start a South Shore Scoops shift first." };
    if (!part) return { ok: false, code: "unknown-part", message: "Choose a valid Scoops container, flavour, finish or extra." };
    if (work.build.length >= SOUTH_SHORE_SCOOPS_CONFIG.maxBuildParts) return { ok: false, code: "item-full", message: "That item is full. Undo or discard it." };
    const checkpoint = structuredClone(session);
    work.build.push(id);
    session.score = Math.max(0, session.score + 1);
    return this.persistMutation(checkpoint, { ok: true, code: "scoops-part-added", part, expectedPart: this.nextExpectedPart(), build: [...work.build] });
  }

  undoPart() {
    const work = this.work();
    if (!work?.build.length) return { ok: false, code: "nothing-to-undo", message: "The current item has no part to remove." };
    const checkpoint = structuredClone(this.activeSession);
    const removed = work.build.pop();
    return this.persistMutation(checkpoint, { ok: true, code: "scoops-part-undone", removed, part: southShoreScoopsPart(removed), expectedPart: this.nextExpectedPart(), build: [...work.build] });
  }

  discardPreparation() {
    const session = this.activeSession;
    const work = this.work();
    if (!session || session.finished || !work || (!work.build.length && !work.tray.length)) return { ok: false, code: "nothing-to-discard", message: "The preparation area is already empty." };
    const checkpoint = structuredClone(session);
    work.build = [];
    work.tray = [];
    session.waste += 1;
    session.score = Math.max(0, session.score - 5);
    return this.persistMutation(checkpoint, { ok: true, code: "scoops-preparation-discarded", waste: session.waste, score: session.score, expectedPart: this.nextExpectedPart() });
  }

  rejectBuild(checkpoint, order, work, message, scorePenalty = 8) {
    const session = this.activeSession;
    session.mistakes += 1;
    session.waste += 1;
    session.score = Math.max(0, session.score - scorePenalty);
    order.patience = Math.max(1, order.patience - order.maxPatience * 0.1);
    work.build = [];
    const saved = this.persistActiveSession();
    if (!saved.ok) { this.activeSession = checkpoint; return saved; }
    return { ok: false, code: "wrong-build", wrong: true, message, mistakes: session.mistakes, waste: session.waste, expectedPart: this.nextExpectedPart(), save: saved.save };
  }

  addCurrentToTray() {
    const session = this.activeSession;
    const order = this.currentOrder();
    const work = this.work(order);
    if (!session || session.finished || !order || !work) return { ok: false, code: "no-active-preparation", message: "Start a South Shore Scoops shift first." };
    if (!work.build.length) return { ok: false, code: "empty-build", message: "Build the highlighted picture first." };
    const checkpoint = structuredClone(session);
    const expected = order.items[work.tray.length];
    if (!expected || !sameParts(work.build, expected.parts)) return this.rejectBuild(checkpoint, order, work, "That first item did not match the picture. Try it again.");
    if (work.tray.length >= order.items.length - 1) return { ok: false, code: "tray-ready", message: "The tray is ready to serve." };
    work.tray.push([...work.build]);
    work.build = [];
    session.score += 10;
    return this.persistMutation(checkpoint, { ok: true, code: "scoops-item-added-to-tray", tray: structuredClone(work.tray), expectedItem: structuredClone(this.expectedItem(order)), expectedPart: this.nextExpectedPart() });
  }

  removeCurrentOrder(outcome) {
    const session = this.activeSession;
    const order = this.currentOrder();
    if (!session || !order) return null;
    order.status = outcome;
    session.activeOrderIds = session.activeOrderIds.filter((id) => id !== order.id);
    delete session.work[order.id];
    session.selectedOrderId = null;
    session.processed += 1;
    this.fillQueue();
    return order;
  }

  serveCurrent() {
    const session = this.activeSession;
    const order = this.currentOrder();
    const work = this.work(order);
    if (!session || session.finished || !order || !work) return { ok: false, code: "no-active-preparation", message: "Start a South Shore Scoops shift first." };
    const checkpoint = structuredClone(session);
    const expected = order.items[work.tray.length];
    const exact = Boolean(expected) && sameParts(work.build, expected.parts);
    const complete = exact && work.tray.length === order.items.length - 1;
    if (!complete) {
      work.tray = [];
      return this.rejectBuild(checkpoint, order, work, "Not quite — compare every picture and try again.", 12);
    }
    const happiness = Math.round(Math.max(0, Math.min(1, order.patience / order.maxPatience)) * 100);
    session.happiness.push(happiness);
    session.served += 1;
    session.score += 50 + Math.round(order.patience / order.maxPatience * 25) + order.items.length * 10;
    const customerName = order.customerName;
    this.removeCurrentOrder("served");
    if (session.processed >= session.level.target) {
      const finished = this.finishSession();
      if (!finished.ok) this.activeSession = checkpoint;
      return finished.ok ? { ...finished, code: "south-shore-scoops-shift-complete", customerName, customerOutcome: "loved" } : finished;
    }
    return this.persistMutation(checkpoint, { ok: true, code: "scoops-customer-served", customerName, customerOutcome: "loved", served: session.served, nextCustomer: this.currentOrder()?.customerName || null, expectedPart: this.nextExpectedPart() });
  }

  tick(seconds) {
    const session = this.activeSession;
    const order = this.currentOrder();
    if (!session || session.finished || !order) return { ok: false, code: "no-active-shift" };
    const checkpoint = structuredClone(session);
    const delta = Math.max(0, Math.min(1, Number(seconds) || 0));
    session.elapsed += delta;
    order.patience = Math.max(0, order.patience - delta);
    let missedCustomer = null;
    if (order.patience <= 0) {
      missedCustomer = order.customerName;
      session.missed += 1;
      session.happiness.push(0);
      this.removeCurrentOrder("missed");
      if (session.processed >= session.level.target) {
        const finished = this.finishSession();
        if (!finished.ok) this.activeSession = checkpoint;
        return finished.ok ? { ...finished, code: "south-shore-scoops-shift-complete", missedCustomer } : finished;
      }
    }
    if (missedCustomer || Math.floor(session.elapsed) > this.lastCheckpointSecond) {
      const saved = this.persistActiveSession();
      if (!saved.ok) { this.activeSession = checkpoint; return saved; }
    }
    return { ok: true, code: "south-shore-scoops-tick", missedCustomer, activeOrders: session.activeOrderIds.length, visibleCustomers: this.visibleQueue().length, patience: this.currentOrder()?.patience ?? 0 };
  }

  finishSession() {
    const session = this.activeSession;
    if (!session || session.finished) return { ok: false, code: "shift-already-finished", message: "This South Shore Scoops shift is already finished." };
    const result = southShoreScoopsResult(session);
    const transaction = this.commit((state) => {
      const progress = state.southShoreScoops;
      const level = session.level.level;
      const firstClear = result.won && !progress.completed[level];
      let coins = 0;
      let ledger = null;
      if (result.won) {
        const previous = progress.best[level];
        if (!previous || result.score > previous.score) progress.best[level] = { score: result.score, stars: result.stars, accuracy: result.accuracy, served: result.served };
        progress.completed[level] = true;
        progress.unlockedLevel = Math.max(progress.unlockedLevel, Math.min(SOUTH_SHORE_SCOOPS_CONFIG.levelCount, level + 1));
        if (firstClear) {
          coins = southShoreScoopsFirstClearCoins(result.accuracy, level);
          if (state.economy.coins + coins > Number.MAX_SAFE_INTEGER) return { ok: false, code: "balance-overflow", message: "Coin balance limit reached." };
          state.economy.coins += coins;
          state.economy.lifetimeCoinsEarned += coins;
          progress.lifetimeCoins += coins;
          ledger = appendLedger(state, this.now(), { amount: coins, kind: "south-shore-scoops-first-clear", reason: `South Shore Scoops Level ${level} first clear`, level, accuracy: result.accuracy, stars: result.stars, served: result.served, venue: "scoops" });
        }
      }
      progress.shifts += 1;
      progress.lifetimeServed += result.served;
      progress.selectedLevel = Math.min(progress.unlockedLevel, level + (result.won ? 1 : 0));
      progress.totalStars = Object.values(progress.best).reduce((sum, record) => sum + record.stars, 0);
      progress.restorationTier = SOUTH_SHORE_SCOOPS_RESTORATION_MILESTONES.filter((required) => Object.keys(progress.completed).length >= required).length;
      progress.lastLevel = level;
      progress.lastOutcome = result.won ? "won" : "lost";
      progress.activeShift = null;
      return { ok: true, code: result.won ? "south-shore-scoops-result-won" : "south-shore-scoops-result-lost", result: { ...result, coins, firstClear, restorationTier: progress.restorationTier }, coins, firstClear, ledger };
    });
    if (!transaction.ok) return transaction;
    session.finished = true;
    session.result = transaction.result;
    return transaction;
  }

  suspend() {
    if (!this.activeSession || this.activeSession.finished) return { ok: false, code: "no-active-shift", message: "No active South Shore Scoops shift needs saving." };
    const session = this.getActiveSession();
    const persisted = this.persistActiveSession();
    if (!persisted.ok) return persisted;
    this.activeSession = null;
    return { ok: true, code: "south-shore-scoops-shift-suspended", session, save: persisted.save };
  }

  cancel() {
    if (!this.activeSession && !this.getSnapshot().activeShift) return { ok: false, code: "no-active-shift", message: "No South Shore Scoops shift is open." };
    const session = this.getActiveSession() || normalizeSouthShoreScoopsActiveShift(this.getSnapshot().activeShift);
    const checkpoint = this.activeSession;
    this.activeSession = null;
    const cleared = this.persistActiveSession();
    if (!cleared.ok) { this.activeSession = checkpoint; return cleared; }
    return { ok: true, code: "south-shore-scoops-shift-cancelled", session, save: cleared.save };
  }

  getDiagnostics() {
    const state = this.getSnapshot();
    const active = this.activeSession || normalizeSouthShoreScoopsActiveShift(state.activeShift);
    const completedLevels = Object.keys(state.completed).length;
    return {
      levels: SOUTH_SHORE_SCOOPS_LEVELS.length,
      chapters: 75,
      productFamilies: SOUTH_SHORE_SCOOPS_ALL_FAMILIES.length,
      parts: Object.keys(SOUTH_SHORE_SCOOPS_PARTS).length,
      unlockedFamilies: southShoreScoopsUnlockedFamilies(state.unlockedLevel).length,
      unlockedParts: Object.values(SOUTH_SHORE_SCOOPS_PART_UNLOCKS).filter((level) => level <= state.unlockedLevel).length,
      maxVisibleCustomers: SOUTH_SHORE_SCOOPS_CONFIG.maxVisibleQueue,
      activeCustomerCap: 1,
      passingAccuracy: SOUTH_SHORE_SCOOPS_CONFIG.passingAccuracy,
      unlockedLevel: state.unlockedLevel,
      completedLevels,
      totalStars: state.totalStars,
      lifetimeServed: state.lifetimeServed,
      restorationTier: state.restorationTier,
      nextRestorationAt: SOUTH_SHORE_SCOOPS_RESTORATION_MILESTONES[state.restorationTier] || null,
      activeSession: Boolean(this.activeSession && !this.activeSession.finished),
      resumableSession: Boolean(active && !active.finished),
      resumableLevel: active?.level.level || null,
      availableParts: southShoreScoopsAvailableParts(active?.level.level || state.unlockedLevel).length,
    };
  }
}
