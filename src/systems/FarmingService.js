import {
  ALLOTMENT_CONFIG,
  FARMING_CROPS,
  LAWN_CONFIG,
  LAWN_PLOTS,
  ORCHARD_CONFIG,
  absoluteWorldMinute,
  lawnNeedsCare,
} from "../data/farming.js";
import { WEATHER_KINDS, getWeatherForDay } from "../data/worldSimulation.js";
import { COIN_LEDGER_LIMIT } from "../state/economyState.js";
import { InventoryService } from "./InventoryService.js";

function weatherMinutes(from, to, property) {
  let cursor = Math.max(0, Number(from) || 0);
  const end = Math.max(cursor, Number(to) || cursor);
  let total = 0;
  while (cursor < end) {
    const day = Math.floor(cursor / 1440) + 1;
    const dayEnd = day * 1440;
    const span = Math.min(end, dayEnd) - cursor;
    total += span * (Number(getWeatherForDay(day)?.[property]) || Number(WEATHER_KINDS.clear[property]) || 1);
    cursor += span;
  }
  return total;
}

function appendLedger(state, now, details) {
  const id = `coin-${String(state.economy.nextTransactionId).padStart(6, "0")}`;
  state.economy.nextTransactionId += 1;
  const entry = { id, itemId: null, quantity: null, shopId: null, balance: state.economy.coins, occurredAt: new Date(now).toISOString(), ...details };
  state.economy.ledger.push(entry);
  state.economy.ledger = state.economy.ledger.slice(-COIN_LEDGER_LIMIT);
  return entry;
}

export class FarmingService {
  constructor(gameState, repository, { now = () => Date.now() } = {}) {
    this.gameState = gameState;
    this.repository = repository;
    this.now = now;
    this.inventory = new InventoryService();
    this.listeners = new Set();
  }

  subscribe(listener) {
    if (typeof listener !== "function") throw new TypeError("A farming listener must be a function.");
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(result) {
    const snapshot = this.getSnapshot();
    for (const listener of this.listeners) listener(snapshot, result);
  }

  getSnapshot() {
    return structuredClone(this.gameState.getSnapshot().farming);
  }

  resolveInto(state) {
    const farming = state.farming;
    const from = farming.lastResolvedAbsoluteMinute;
    const to = absoluteWorldMinute(state.world);
    if (to <= from) return 0;
    const growthMinutes = weatherMinutes(from, to, "growth");
    const weedMinutes = weatherMinutes(from, to, "weeds");
    for (const bed of farming.allotment.beds) {
      if (bed.status !== "growing") continue;
      const crop = FARMING_CROPS[bed.cropId];
      bed.growthMinutes = Math.min(crop.growMinutes, bed.growthMinutes + growthMinutes);
      if (bed.growthMinutes >= crop.growMinutes) bed.status = "ready";
    }
    const tree = farming.orchard.trees[0];
    if (tree.availableFruit < ORCHARD_CONFIG.maxFruit) {
      tree.fruitProgressMinutes = Math.min(ORCHARD_CONFIG.productionMinutes, tree.fruitProgressMinutes + growthMinutes);
      if (tree.fruitProgressMinutes >= ORCHARD_CONFIG.productionMinutes) tree.availableFruit = 1;
    }
    for (const plot of LAWN_PLOTS) {
      const lawn = farming.lawns[plot.id];
      lawn.grassHeight = Math.min(100, lawn.grassHeight + LAWN_CONFIG.baseGrassPerDay * plot.growthRate * (growthMinutes / 1440));
      lawn.weedPressure = Math.min(100, lawn.weedPressure + LAWN_CONFIG.baseWeedsPerDay * plot.weedRate * (weedMinutes / 1440));
    }
    farming.lastResolvedAbsoluteMinute = to;
    return to - from;
  }

  commit(mutator, { persist = true } = {}) {
    const checkpoint = this.gameState.getSnapshot();
    const working = structuredClone(checkpoint);
    this.resolveInto(working);
    const mutation = mutator(working);
    if (!mutation.ok) return mutation;
    working.updatedAt = new Date(this.now()).toISOString();
    const replaced = this.gameState.replace(working);
    if (!replaced.ok) return { ok: false, code: "state-validation", errors: replaced.errors };
    const saved = persist ? this.repository.save(working, { now: this.now() }) : { ok: true, status: "deferred" };
    if (!saved.ok) {
      const rollback = this.gameState.replace(checkpoint);
      return { ok: false, code: "persistence-failed", message: "The farming change could not be saved, so the previous state was restored.", save: saved, rollbackOk: rollback.ok };
    }
    const result = { ...mutation, state: this.gameState.getSnapshot(), save: saved };
    this.emit(result);
    return result;
  }

  refresh({ persist = false } = {}) {
    const before = this.gameState.getSnapshot().farming.lastResolvedAbsoluteMinute;
    const now = absoluteWorldMinute(this.gameState.getSnapshot().world);
    if (now <= before) return { ok: true, code: "already-current", advancedMinutes: 0 };
    return this.commit((state) => ({ ok: true, code: "farming-refreshed", advancedMinutes: absoluteWorldMinute(state.world) - before }), { persist });
  }

  quantity(itemId) {
    return this.inventory.quantity(this.gameState.getSnapshot().inventory, itemId);
  }

  purchaseSeed(cropId) {
    const crop = FARMING_CROPS[cropId];
    if (!crop) return { ok: false, code: "unknown-crop", message: "Choose a valid crop." };
    return this.commit((state) => {
      if (state.economy.coins < crop.seedPrice) return { ok: false, code: "insufficient-funds", message: "Not enough KindlyCoins.", required: crop.seedPrice, available: state.economy.coins };
      const added = this.inventory.add(state.inventory, crop.seedId, 1);
      if (!added.ok) return added;
      state.economy.coins -= crop.seedPrice;
      state.economy.lifetimeCoinsSpent += crop.seedPrice;
      const ledger = appendLedger(state, this.now(), { amount: -crop.seedPrice, kind: "farming-seed-purchase", reason: `Bought ${crop.label} seeds`, itemId: crop.seedId, quantity: 1 });
      return { ok: true, code: "seed-purchased", cropId, cost: crop.seedPrice, ledger };
    });
  }

  plant(bedId, cropId) {
    const crop = FARMING_CROPS[cropId];
    if (!crop) return { ok: false, code: "unknown-crop", message: "Choose a valid crop." };
    return this.commit((state) => {
      const bed = state.farming.allotment.beds.find((entry) => entry.id === bedId);
      if (!bed) return { ok: false, code: "unknown-bed", message: "That allotment bed does not exist." };
      if (!bed.unlocked) return { ok: false, code: "bed-locked", message: "Unlock this bed before planting." };
      if (bed.status !== "empty") return { ok: false, code: "bed-occupied", message: "This bed is already growing something." };
      const removed = this.inventory.remove(state.inventory, crop.seedId, 1);
      if (!removed.ok) return { ...removed, message: `Buy ${crop.label.toLowerCase()} seeds before planting.` };
      Object.assign(bed, { cropId, status: "growing", growthMinutes: 0 });
      const ledger = appendLedger(state, this.now(), { amount: 0, kind: "consume", reason: `Planted ${crop.seedLabel}`, itemId: crop.seedId, quantity: 1, bedId });
      return { ok: true, code: "crop-planted", bedId, cropId, ledger };
    });
  }

  harvest(bedId) {
    return this.commit((state) => {
      const bed = state.farming.allotment.beds.find((entry) => entry.id === bedId);
      const crop = FARMING_CROPS[bed?.cropId];
      if (!bed || !crop || bed.status !== "ready") return { ok: false, code: "crop-not-ready", message: "This crop is not ready to harvest." };
      const added = this.inventory.add(state.inventory, crop.produceId, crop.harvestYield);
      if (!added.ok) return added;
      bed.harvests += 1;
      bed.totalHarvested += crop.harvestYield;
      Object.assign(bed, { cropId: null, status: "empty", growthMinutes: 0 });
      return { ok: true, code: "crop-harvested", bedId, cropId: crop.id, itemId: crop.produceId, quantity: crop.harvestYield };
    });
  }

  unlockBed(bedId) {
    return this.commit((state) => {
      const index = state.farming.allotment.beds.findIndex((entry) => entry.id === bedId);
      const bed = state.farming.allotment.beds[index];
      if (!bed) return { ok: false, code: "unknown-bed", message: "That allotment bed does not exist." };
      if (bed.unlocked) return { ok: false, code: "already-unlocked", message: "This bed is already unlocked." };
      const cost = ALLOTMENT_CONFIG.bedUnlockCosts[index];
      if (state.economy.coins < cost) return { ok: false, code: "insufficient-funds", message: "Not enough KindlyCoins.", required: cost, available: state.economy.coins };
      state.economy.coins -= cost;
      state.economy.lifetimeCoinsSpent += cost;
      bed.unlocked = true;
      state.farming.allotment.unlockedBeds += 1;
      const ledger = appendLedger(state, this.now(), { amount: -cost, kind: "allotment-bed-unlock", reason: `Unlocked allotment bed ${index + 1}`, targetId: bedId });
      return { ok: true, code: "bed-unlocked", bedId, cost, ledger };
    });
  }

  harvestApple() {
    return this.commit((state) => {
      const tree = state.farming.orchard.trees[0];
      if (tree.availableFruit < 1) return { ok: false, code: "fruit-not-ready", message: "This tree is still producing its next apple." };
      const added = this.inventory.add(state.inventory, "orchard-apple", ORCHARD_CONFIG.harvestYield);
      if (!added.ok) return added;
      tree.availableFruit = 0;
      tree.fruitProgressMinutes = 0;
      tree.harvests += 1;
      tree.totalHarvested += ORCHARD_CONFIG.harvestYield;
      return { ok: true, code: "apple-harvested", itemId: "orchard-apple", quantity: ORCHARD_CONFIG.harvestYield };
    });
  }

  completeLawnJob(lawnId) {
    return this.commit((state) => {
      const lawn = state.farming.lawns[lawnId];
      const plot = LAWN_PLOTS.find((entry) => entry.id === lawnId);
      if (!lawn || !plot) return { ok: false, code: "unknown-lawn", message: "That lawn does not exist." };
      if (!lawnNeedsCare(lawn)) return { ok: false, code: "lawn-tidy", message: "This lawn does not need care yet." };
      if (state.economy.coins + LAWN_CONFIG.rewardCoins > Number.MAX_SAFE_INTEGER) return { ok: false, code: "balance-overflow", message: "Coin balance limit reached." };
      const completedAt = new Date(this.now()).toISOString();
      lawn.grassHeight = LAWN_CONFIG.freshlyCutHeight;
      lawn.weedPressure = LAWN_CONFIG.freshlyWeededPressure;
      lawn.completedJobs += 1;
      lawn.lastCompletedAt = completedAt;
      state.economy.coins += LAWN_CONFIG.rewardCoins;
      state.economy.lifetimeCoinsEarned += LAWN_CONFIG.rewardCoins;
      state.progress.completedJobCount += 1;
      const ledger = appendLedger(state, this.now(), { amount: LAWN_CONFIG.rewardCoins, kind: "job-reward", reason: `Cared for ${plot.title}`, jobType: "lawn", targetId: lawnId });
      return { ok: true, code: "lawn-completed", lawnId, rewardCoins: LAWN_CONFIG.rewardCoins, balance: state.economy.coins, ledger };
    });
  }

  getDiagnostics() {
    const state = this.gameState.getSnapshot();
    return {
      readyBeds: state.farming.allotment.beds.filter((bed) => bed.status === "ready").length,
      growingBeds: state.farming.allotment.beds.filter((bed) => bed.status === "growing").length,
      unlockedBeds: state.farming.allotment.unlockedBeds,
      applesReady: state.farming.orchard.trees[0].availableFruit,
      activeLawnJobs: LAWN_PLOTS.filter((plot) => lawnNeedsCare(state.farming.lawns[plot.id])).length,
      lastResolvedAbsoluteMinute: state.farming.lastResolvedAbsoluteMinute,
      weatherIntegrated: true,
    };
  }
}
