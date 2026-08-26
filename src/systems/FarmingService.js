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
import { NPC_RESIDENTS } from "../data/npcTownLife.js";
import { validateTownPlacement } from "../data/townPlacement.js";
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

function hashUnit(text) {
  let hash = 2166136261 >>> 0;
  for (let index = 0; index < String(text).length; index += 1) {
    hash ^= String(text).charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

function residentAtHome(state, plot) {
  const residentIds = NPC_RESIDENTS.filter((entry) => entry.homeNodeId === plot.homeNodeId).map((entry) => entry.id);
  if (plot.legacyId === "lawn-20" && state.customResident?.created && (state.customResident.location?.phase === "home" || state.customResident.location?.nodeId === plot.homeNodeId)) return { custom: true };
  return state.npcs?.residents?.find((entry) => residentIds.includes(entry.id) && ["home", "sleeping"].includes(entry.phase)) || null;
}

export function resolveLawnEcology(state, from, to) {
  if (to <= from) return { growthEvents: 0, weedEvents: 0, residentCareEvents: 0 };
  let growthEvents = 0;
  let weedEvents = 0;
  let residentCareEvents = 0;
  for (const plot of LAWN_PLOTS) {
    if (!plot.active) continue;
    const lawn = state.farming.lawns[plot.id];
    let cursor = Math.max(from, Math.min(to, Number(state.environment?.calm?.untilGameMinute) || from));
    while (cursor < to) {
      const day = Math.floor(cursor / 1440) + 1;
      const boundary = Math.min(to, day * 1440);
      const minutes = boundary - cursor;
      const fraction = minutes / 1440;
      const weather = getWeatherForDay(day);
      const beforeGrass = lawn.grassHeight;
      const beforeWeeds = lawn.weedPressure;
      lawn.moisture = Math.max(4, Math.min(100, lawn.moisture + weather.rain * 58 * fraction - (18 - lawn.shade * 7) * weather.evaporation * fraction));
      const moistureFactor = 0.28 + 0.92 * Math.min(1, lawn.moisture / 62);
      const soilFactor = 0.72 + (lawn.soilHealth / 100) * 0.38;
      const shadeFactor = 1 - lawn.shade * 0.16;
      const crowding = 1 - Math.max(0, lawn.grassHeight - 78) / 170;
      const grassGain = LAWN_CONFIG.baseGrassPerDay * lawn.maintenanceCadence * lawn.growthRate * weather.growth * moistureFactor * soilFactor * shadeFactor * crowding * fraction;
      lawn.grassHeight = Math.max(0, Math.min(100, lawn.grassHeight + grassGain));
      const grassShelter = 0.45 + Math.min(1, lawn.grassHeight / 65) * 0.75;
      const careSuppression = 0.58 + (1 - lawn.householdCare) * 0.75;
      const weedCadence = 0.65 + lawn.maintenanceCadence * 0.35;
      const weedGain = LAWN_CONFIG.baseWeedsPerDay * weedCadence * lawn.weedSusceptibility * weather.weeds * moistureFactor * grassShelter * careSuppression * fraction;
      lawn.weedPressure = Math.max(0, Math.min(100, lawn.weedPressure + weedGain));
      lawn.ecologyAgeGameMinutes += minutes;
      if (lawn.grassHeight > beforeGrass) growthEvents += 1;
      if (lawn.weedPressure > beforeWeeds) weedEvents += 1;
      const careMinute = (day - 1) * 1440 + LAWN_CONFIG.residentCareHour * 60;
      const caregiver = residentAtHome(state, plot);
      if (cursor < careMinute && boundary >= careMinute && lawn.lastResidentCareDay < day && lawn.weedPressure >= 8 && caregiver) {
        lawn.lastResidentCareDay = day;
        const chance = 0.08 + lawn.householdCare * 0.32;
        if (hashUnit(`resident-care:${plot.id}:${day}`) < chance) {
          const reduction = LAWN_CONFIG.residentCareWeedReductionMin + hashUnit(`resident-care-reduction:${plot.id}:${day}`) * (LAWN_CONFIG.residentCareWeedReductionMax - LAWN_CONFIG.residentCareWeedReductionMin);
          lawn.weedPressure = Math.max(0, lawn.weedPressure - reduction);
          if (!caregiver.custom) {
            caregiver.residentLawnCareEvents = (caregiver.residentLawnCareEvents || 0) + 1;
            caregiver.communityCareEvents = (caregiver.communityCareEvents || 0) + 1;
            caregiver.activity = "Pulled weeds from the lawn at home";
            caregiver.actionState = "HELPING";
            caregiver.reactionIcon = "🌿";
            caregiver.reactionText = "Giving the lawn a little care";
            caregiver.reactionUntil = careMinute + 8;
          }
          residentCareEvents += 1;
        }
      }
      cursor = boundary;
    }
  }
  return { growthEvents, weedEvents, residentCareEvents };
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
    this.activeTreePlacement = null;
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
    for (const bed of farming.allotment.beds) {
      if (bed.status !== "growing") continue;
      const crop = FARMING_CROPS[bed.cropId];
      bed.growthMinutes = Math.min(crop.growMinutes, bed.growthMinutes + growthMinutes);
      if (bed.growthMinutes >= crop.growMinutes) bed.status = "ready";
    }
    for (const tree of farming.orchard.trees) {
      if (tree.status === "growing") {
        tree.growthMinutes = Math.min(ORCHARD_CONFIG.maturityMinutes, tree.growthMinutes + growthMinutes);
        if (tree.growthMinutes >= ORCHARD_CONFIG.maturityMinutes) {
          tree.status = "mature";
          tree.availableFruit = 1;
          tree.fruitProgressMinutes = ORCHARD_CONFIG.productionMinutes;
        }
        continue;
      }
      if (tree.availableFruit < ORCHARD_CONFIG.maxFruit) {
        tree.fruitProgressMinutes = Math.min(ORCHARD_CONFIG.productionMinutes, tree.fruitProgressMinutes + growthMinutes);
        if (tree.fruitProgressMinutes >= ORCHARD_CONFIG.productionMinutes) tree.availableFruit = 1;
      }
    }
    resolveLawnEcology(state, from, to);
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

  purchaseSapling() {
    return this.commit((state) => {
      const orchard = state.farming.orchard;
      if (orchard.trees.length + orchard.purchasedSaplings >= ORCHARD_CONFIG.maxTrees) {
        return { ok: false, code: "orchard-capacity", message: `The orchard already has all ${ORCHARD_CONFIG.maxTrees} tree places reserved.` };
      }
      if (state.economy.coins < ORCHARD_CONFIG.saplingPrice) {
        return { ok: false, code: "insufficient-funds", message: "Not enough KindlyCoins.", required: ORCHARD_CONFIG.saplingPrice, available: state.economy.coins };
      }
      state.economy.coins -= ORCHARD_CONFIG.saplingPrice;
      state.economy.lifetimeCoinsSpent += ORCHARD_CONFIG.saplingPrice;
      orchard.purchasedSaplings += 1;
      const ledger = appendLedger(state, this.now(), {
        amount: -ORCHARD_CONFIG.saplingPrice,
        kind: "farming-sapling-purchase",
        reason: "Bought Apple Sapling at Village Grocer",
        itemId: "orchard-apple-sapling",
        quantity: 1,
        shopId: "town-grocer",
      });
      return { ok: true, code: "sapling-purchased", cost: ORCHARD_CONFIG.saplingPrice, after: state.economy.coins, owned: orchard.purchasedSaplings, ledger };
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

  treeObjectsForPlacement(state = this.gameState.getSnapshot()) {
    return state.farming.orchard.trees.map((tree) => ({ id: `orchard-${tree.id}`, itemId: ORCHARD_CONFIG.placementItemId, x: tree.x, y: tree.y }));
  }

  validateAppleTreePlacement(x, y, state = this.gameState.getSnapshot()) {
    return validateTownPlacement(ORCHARD_CONFIG.placementItemId, x, y, {
      objects: [...(state.townPlacement?.objects || []), ...this.treeObjectsForPlacement(state)],
    });
  }

  getPlacementSnapshot() {
    const state = this.gameState.getSnapshot();
    const active = this.activeTreePlacement ? structuredClone(this.activeTreePlacement) : null;
    const validation = active && Number.isFinite(active.previewX) && Number.isFinite(active.previewY)
      ? this.validateAppleTreePlacement(active.previewX, active.previewY, state)
      : { ok: false, code: "preview-required", message: "Tap a clear open space in Willowmere." };
    return {
      active,
      validation,
      treeCount: state.farming.orchard.trees.length,
      purchasedSaplings: state.farming.orchard.purchasedSaplings,
      limit: ORCHARD_CONFIG.maxTrees,
    };
  }

  beginAppleTreePlacement({ previewX = null, previewY = null } = {}) {
    const state = this.gameState.getSnapshot();
    if (state.farming.orchard.purchasedSaplings < 1) return { ok: false, code: "no-sapling", message: "Buy an apple sapling at Village Grocer first." };
    if (state.farming.orchard.trees.length >= ORCHARD_CONFIG.maxTrees) return { ok: false, code: "orchard-capacity", message: `The orchard's ${ORCHARD_CONFIG.maxTrees}-tree limit has been reached.` };
    this.activeTreePlacement = {
      previewX: Number.isFinite(Number(previewX)) ? Number(previewX) : null,
      previewY: Number.isFinite(Number(previewY)) ? Number(previewY) : null,
      startedAt: this.now(),
    };
    const result = { ok: true, code: "sapling-placement-begun", placement: this.getPlacementSnapshot() };
    this.emit(result);
    return result;
  }

  previewAppleTreePlacement(x, y) {
    if (!this.activeTreePlacement) return { ok: false, code: "no-active-placement", message: "No apple sapling placement is active." };
    this.activeTreePlacement.previewX = Number(x);
    this.activeTreePlacement.previewY = Number(y);
    const validation = this.validateAppleTreePlacement(x, y);
    const result = { ...validation, code: validation.ok ? "sapling-preview-valid" : validation.code, placement: this.getPlacementSnapshot() };
    this.emit(result);
    return result;
  }

  cancelAppleTreePlacement() {
    if (!this.activeTreePlacement) return { ok: false, code: "no-active-placement", message: "No apple sapling placement is active." };
    const cancelled = structuredClone(this.activeTreePlacement);
    this.activeTreePlacement = null;
    const result = { ok: true, code: "sapling-placement-cancelled", cancelled };
    this.emit(result);
    return result;
  }

  confirmAppleTreePlacement() {
    if (!this.activeTreePlacement) return { ok: false, code: "no-active-placement", message: "No apple sapling placement is active." };
    const draft = structuredClone(this.activeTreePlacement);
    if (!Number.isFinite(draft.previewX) || !Number.isFinite(draft.previewY)) return { ok: false, code: "preview-required", message: "Tap a clear open space in Willowmere first." };
    const result = this.commit((state) => {
      const orchard = state.farming.orchard;
      if (orchard.purchasedSaplings < 1) return { ok: false, code: "no-sapling", message: "That sapling is no longer available." };
      if (orchard.trees.length >= ORCHARD_CONFIG.maxTrees) return { ok: false, code: "orchard-capacity", message: `The orchard's ${ORCHARD_CONFIG.maxTrees}-tree limit has been reached.` };
      const validation = this.validateAppleTreePlacement(draft.previewX, draft.previewY, state);
      if (!validation.ok) return validation;
      let serial = orchard.nextTreeSerial;
      const existing = new Set(orchard.trees.map((tree) => tree.id));
      while (existing.has(`apple-tree-${serial}`)) serial += 1;
      const tree = {
        id: `apple-tree-${serial}`,
        x: validation.x,
        y: validation.y,
        status: "growing",
        growthMinutes: 0,
        fruitProgressMinutes: 0,
        availableFruit: 0,
        harvests: 0,
        totalHarvested: 0,
        plantedAtGameMinute: absoluteWorldMinute(state.world),
      };
      orchard.nextTreeSerial = serial + 1;
      orchard.purchasedSaplings -= 1;
      orchard.trees.push(tree);
      const ledger = appendLedger(state, this.now(), {
        amount: 0,
        kind: "farming-sapling-placement",
        reason: "Planted Apple Sapling in Willowmere",
        itemId: "orchard-apple-sapling",
        quantity: 1,
        targetId: tree.id,
        x: tree.x,
        y: tree.y,
      });
      return { ok: true, code: "sapling-planted", tree: structuredClone(tree), ledger };
    });
    if (result.ok) {
      this.activeTreePlacement = null;
      this.emit(result);
    }
    return result;
  }

  harvestApple(treeId = null) {
    return this.commit((state) => {
      const tree = treeId
        ? state.farming.orchard.trees.find((entry) => entry.id === treeId)
        : state.farming.orchard.trees.find((entry) => entry.availableFruit > 0) || state.farming.orchard.trees[0];
      if (!tree) return { ok: false, code: "unknown-tree", message: "That apple tree does not exist." };
      if (tree.status !== "mature" || tree.availableFruit < 1) return { ok: false, code: "fruit-not-ready", message: "This tree is still growing or producing its next apple." };
      const added = this.inventory.add(state.inventory, "orchard-apple", ORCHARD_CONFIG.harvestYield);
      if (!added.ok) return added;
      tree.availableFruit = 0;
      tree.fruitProgressMinutes = 0;
      tree.harvests += 1;
      tree.totalHarvested += ORCHARD_CONFIG.harvestYield;
      return { ok: true, code: "apple-harvested", treeId: tree.id, itemId: "orchard-apple", quantity: ORCHARD_CONFIG.harvestYield };
    });
  }

  treeCollisionAt(x, y, radius = 17) {
    const tree = this.gameState.getSnapshot().farming.orchard.trees.find((entry) => Math.hypot(entry.x - x, entry.y - y) < 38 + radius);
    return tree ? { blocked: true, treeId: tree.id } : { blocked: false };
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
      lawn.moisture = Math.max(25, lawn.moisture);
      lawn.lastMowedDay = state.world.day;
      lawn.lastMowedGameMinute = absoluteWorldMinute(state.world);
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
    const trees = state.farming.orchard.trees;
    return {
      readyBeds: state.farming.allotment.beds.filter((bed) => bed.status === "ready").length,
      growingBeds: state.farming.allotment.beds.filter((bed) => bed.status === "growing").length,
      unlockedBeds: state.farming.allotment.unlockedBeds,
      applesReady: trees.reduce((total, tree) => total + tree.availableFruit, 0),
      orchardTrees: trees.length,
      matureTrees: trees.filter((tree) => tree.status === "mature").length,
      growingTrees: trees.filter((tree) => tree.status === "growing").length,
      purchasedSaplings: state.farming.orchard.purchasedSaplings,
      orchardCapacity: ORCHARD_CONFIG.maxTrees,
      activeTreePlacement: Boolean(this.activeTreePlacement),
      lawnProfileSlots: LAWN_PLOTS.length,
      authoredLawns: LAWN_PLOTS.filter((plot) => plot.active).length,
      activeLawnJobs: LAWN_PLOTS.filter((plot) => plot.active && lawnNeedsCare(state.farming.lawns[plot.id])).length,
      lastResolvedAbsoluteMinute: state.farming.lastResolvedAbsoluteMinute,
      weatherIntegrated: true,
      offlineProgression: true,
    };
  }
}
