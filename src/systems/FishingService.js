import {
  FISHING_CONFIG,
  FISHING_SPOT_BY_ID,
  FISH_RARITY,
  MAGNET_FISHING_CONFIG,
  MAGNET_FISHING_SPOT,
  MAGNET_TARGETING_CONFIG,
  MAGNET_RARITY_ORDER,
  MAGNET_RECOVERY_CATALOG,
  ORNAMENTAL_FISH_IDS,
  TARGETING_CONFIG,
  chooseFishingCatch,
  chooseMagnetRecovery,
  fishingItem,
  generateHiddenZones,
  hiddenZoneAt,
  pointInWater,
  pointInMagnetWater,
} from "../data/fishing.js";
import { COIN_LEDGER_LIMIT } from "../state/economyState.js";
import { aquariumFishCount, aquariumSnapshot, placedFishTank, routeOrnamentalCatchInto } from "../state/aquariumState.js";
import { InventoryService } from "./InventoryService.js";
import { removeMagnetRiverItemInto } from "./LivingEnvironmentService.js";

function clampQuality(value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}

function appendLedger(state, now, details) {
  const id = `coin-${String(state.economy.nextTransactionId).padStart(6, "0")}`;
  state.economy.nextTransactionId += 1;
  const entry = { id, itemId: null, quantity: null, occurredAt: new Date(now).toISOString(), ...details };
  state.economy.ledger.push(entry);
  state.economy.ledger = state.economy.ledger.slice(-COIN_LEDGER_LIMIT);
  return entry;
}

function fishingCatchableEntries(state, spot, inventory) {
  const tankPlaced = Boolean(placedFishTank(state));
  return (spot?.catchTable || []).filter((entry) => {
    if (ORNAMENTAL_FISH_IDS.includes(entry.itemId)) {
      return !tankPlaced || aquariumFishCount(state, entry.itemId) < FISHING_CONFIG.maxAquariumPerSpecies;
    }
    return inventory.quantity(state.inventory, entry.itemId) < FISHING_CONFIG.maxInventoryPerFish;
  });
}

export class FishingService {
  constructor(gameState, repository, { now = () => Date.now(), random = Math.random, aquarium = null } = {}) {
    this.gameState = gameState;
    this.repository = repository;
    this.now = now;
    this.random = random;
    this.aquarium = aquarium;
    this.inventory = new InventoryService();
    this.listeners = new Set();
    this.activeSession = null;
    this.nextSessionId = 1;
  }

  subscribe(listener) {
    if (typeof listener !== "function") throw new TypeError("A fishing listener must be a function.");
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(result) {
    const snapshot = this.getSnapshot();
    for (const listener of this.listeners) listener(snapshot, result);
  }

  syncDayInto(state) {
    if (state.fishing.day !== state.world.day) {
      Object.assign(state.fishing, { day: state.world.day, castsToday: 0, caughtToday: 0, currentStreak: 0 });
    }
    if (state.fishing.magnet.day !== state.world.day) {
      Object.assign(state.fishing.magnet, { day: state.world.day, castsToday: 0, pullsToday: 0, currentPullStreak: 0 });
    }
  }

  commit(mutator, { persist = true } = {}) {
    const checkpoint = this.gameState.getSnapshot();
    const working = structuredClone(checkpoint);
    this.syncDayInto(working);
    const mutation = mutator(working);
    if (!mutation.ok) return mutation;
    working.updatedAt = new Date(this.now()).toISOString();
    const replaced = this.gameState.replace(working);
    if (!replaced.ok) return { ok: false, code: "state-validation", errors: replaced.errors };
    const saved = persist ? this.repository.save(working, { now: this.now() }) : { ok: true, status: "deferred" };
    if (!saved.ok) {
      const rollback = this.gameState.replace(checkpoint);
      return { ok: false, code: "persistence-failed", message: "The cast could not be saved, so its progress and rewards were restored safely.", rollbackOk: rollback.ok, save: saved };
    }
    const result = { ...mutation, state: this.gameState.getSnapshot(), save: saved };
    this.emit(result);
    return result;
  }

  refresh({ persist = false } = {}) {
    const state = this.gameState.getSnapshot();
    if (state.fishing.day === state.world.day && state.fishing.magnet.day === state.world.day) return { ok: true, code: "already-current" };
    return this.commit(() => ({ ok: true, code: "fishing-day-refreshed" }), { persist });
  }

  getSnapshot() {
    const state = this.gameState.getSnapshot();
    this.syncDayInto(state);
    return { ...structuredClone(state.fishing), aquarium: aquariumSnapshot(state) };
  }

  castsLeft(mode = "fish") {
    const fishing = this.getSnapshot();
    return mode === "magnet"
      ? Math.max(0, MAGNET_FISHING_CONFIG.dailyCasts - fishing.magnet.castsToday)
      : Math.max(0, FISHING_CONFIG.dailyCasts - fishing.castsToday);
  }

  begin(mode, spotId, { returnPosition, returnFacing = "down" } = {}) {
    if (this.activeSession) return { ok: false, code: "session-active", message: "Finish or safely exit the current fishing session first." };
    const fish = mode === "fish" && FISHING_SPOT_BY_ID[spotId];
    const magnet = mode === "magnet" && spotId === MAGNET_FISHING_SPOT.id;
    if (!fish && !magnet) return { ok: false, code: "unknown-spot", message: "Choose a marked Willowmere fishing spot." };
    this.refresh({ persist: true });
    if (this.castsLeft(mode) < 1) return { ok: false, code: "daily-limit", message: "All five casts are used. Return tomorrow." };
    const id = `fishing-session-${String(this.nextSessionId).padStart(4, "0")}`;
    this.nextSessionId += 1;
    this.activeSession = {
      id,
      mode,
      spotId,
      phase: "idle",
      target: null,
      zoneId: null,
      hiddenZones: generateHiddenZones(this.random, mode === "magnet" ? MAGNET_TARGETING_CONFIG : TARGETING_CONFIG),
      result: null,
      returnPosition: { x: Number(returnPosition?.x) || 640, y: Number(returnPosition?.y) || 610 },
      returnFacing,
    };
    return { ok: true, code: "fishing-started", session: this.getActiveSession(), castsLeft: this.castsLeft(mode) };
  }

  getActiveSession() {
    return this.activeSession ? structuredClone(this.activeSession) : null;
  }

  cast(point) {
    const session = this.activeSession;
    if (!session) return { ok: false, code: "no-session", message: "Open a fishing spot first." };
    if (!["idle", "success", "miss"].includes(session.phase)) return { ok: false, code: "cast-active", message: "Finish the current cast first." };
    const insideWater = session.mode === "magnet" ? pointInMagnetWater(point) : pointInWater(point);
    if (!insideWater) return { ok: false, code: "outside-water", message: "Choose a point inside the water. No cast was used." };
    if (session.mode === "fish") {
      const state = this.gameState.getSnapshot();
      const spot = FISHING_SPOT_BY_ID[session.spotId];
      if (!fishingCatchableEntries(state, spot, this.inventory).length) {
        return { ok: false, code: "storage-full", message: "All suitable fish storage is full." };
      }
    }
    const result = this.commit((state) => {
      const progress = session.mode === "magnet" ? state.fishing.magnet : state.fishing;
      const limit = session.mode === "magnet" ? MAGNET_FISHING_CONFIG.dailyCasts : FISHING_CONFIG.dailyCasts;
      if (progress.castsToday >= limit) return { ok: false, code: "daily-limit", message: "All five casts are used. Return tomorrow." };
      progress.castsToday += 1;
      progress.totalCasts += 1;
      return { ok: true, code: "cast-committed", castsLeft: limit - progress.castsToday };
    });
    if (!result.ok) return result;
    const zone = hiddenZoneAt(session.hiddenZones, point);
    Object.assign(session, { phase: session.mode === "magnet" ? "settling" : "waiting", target: { x: point.x, y: point.y }, zoneId: zone?.id || null, result: null });
    return { ...result, mode: session.mode, phase: session.phase, target: { ...session.target }, potentialCatch: Boolean(zone) };
  }

  signalReady() {
    const session = this.activeSession;
    if (!session || !["waiting", "settling"].includes(session.phase)) return { ok: false, code: "not-waiting", message: "Cast first." };
    if (session.mode === "magnet") {
      session.phase = "ready";
      return { ok: true, code: "magnet-ready", phase: "ready" };
    }
    if (!session.zoneId) return this.miss("empty");
    session.phase = "bite";
    return { ok: true, code: "fish-bite", phase: "bite" };
  }

  miss(kind = "late") {
    const session = this.activeSession;
    if (!session || session.mode !== "fish" || !["waiting", "bite"].includes(session.phase)) return { ok: false, code: "no-cast", message: "No active fishing cast can be missed." };
    const result = this.commit((state) => {
      state.fishing.currentStreak = 0;
      return { ok: true, code: "fishing-miss", missKind: kind, castsLeft: FISHING_CONFIG.dailyCasts - state.fishing.castsToday };
    });
    if (result.ok) Object.assign(session, { phase: "miss", result: kind });
    return result;
  }

  reelFish({ quality = 1, forcedItemId = null } = {}) {
    const session = this.activeSession;
    const spot = FISHING_SPOT_BY_ID[session?.spotId];
    if (!session || session.mode !== "fish" || session.phase !== "bite" || !spot) return { ok: false, code: "no-bite", message: "Wait for BITE before reeling in." };
    const safeQuality = clampQuality(quality);
    const before = this.gameState.getSnapshot();
    const catchTable = fishingCatchableEntries(before, spot, this.inventory);
    if (!catchTable.length) return { ok: false, code: "storage-full", message: "All suitable fish storage is full." };
    const availableSpot = { ...spot, catchTable };
    const forcedAllowed = availableSpot.catchTable.some((entry) => entry.itemId === forcedItemId) ? forcedItemId : null;
    const itemId = forcedAllowed || chooseFishingCatch(availableSpot, safeQuality, this.random);
    const item = fishingItem(itemId);
    const ornamental = ORNAMENTAL_FISH_IDS.includes(itemId);
    const result = this.commit((state) => {
      let aquariumRouting = null;
      if (!ornamental) {
        const added = this.inventory.add(state.inventory, itemId, 1);
        if (!added.ok) return { ...added, message: `${item.name} could not fit in your inventory. The fish was released safely.` };
      } else aquariumRouting = routeOrnamentalCatchInto(state, itemId);
      state.fishing.caughtToday += 1;
      state.fishing.totalCaught += 1;
      state.fishing.currentStreak += 1;
      state.fishing.bestStreak = Math.max(state.fishing.bestStreak, state.fishing.currentStreak);
      state.fishing.caughtByItem[itemId] += 1;
      return {
        ok: true,
        code: "fish-caught",
        itemId,
        item,
        quality: safeQuality,
        excellent: safeQuality >= 1 - FISHING_CONFIG.excellentWindowFraction,
        rarity: FISH_RARITY[itemId],
        disposition: ornamental ? aquariumRouting.disposition : "inventory",
        count: ornamental ? aquariumRouting.speciesCount : this.inventory.quantity(state.inventory, itemId),
        aquarium: aquariumSnapshot(state),
        castsLeft: FISHING_CONFIG.dailyCasts - state.fishing.castsToday,
      };
    });
    if (result.ok) Object.assign(session, { phase: "success", result: itemId });
    return result;
  }

  retrieveMagnet({ forcedRecoveryId = null } = {}) {
    const session = this.activeSession;
    if (!session || session.mode !== "magnet" || session.phase !== "ready") return { ok: false, code: "magnet-not-ready", message: "Let the magnet settle before retrieving it." };
    const hasItem = Boolean(session.zoneId) || Boolean(forcedRecoveryId && MAGNET_RECOVERY_CATALOG[forcedRecoveryId]);
    const current = this.gameState.getSnapshot().fishing.magnet;
    const recovery = hasItem ? chooseMagnetRecovery(current, this.random, forcedRecoveryId) : null;
    const result = this.commit((state) => {
      const progress = state.fishing.magnet;
      progress.pullsToday += 1;
      progress.totalPulls += 1;
      if (!recovery) {
        progress.currentPullStreak = 0;
        progress.pullsWithoutRare = Math.min(MAGNET_FISHING_CONFIG.rarePityPulls, progress.pullsWithoutRare + 1);
        progress.pullsWithoutTreasure = Math.min(MAGNET_FISHING_CONFIG.treasurePityPulls, progress.pullsWithoutTreasure + 1);
        return { ok: true, code: "magnet-empty", empty: true, rewardCoins: 0, castsLeft: MAGNET_FISHING_CONFIG.dailyCasts - progress.castsToday };
      }
      if (state.economy.coins + recovery.coins > Number.MAX_SAFE_INTEGER) return { ok: false, code: "balance-overflow", message: "Coin balance limit reached." };
      const { removedRiverGarbage } = removeMagnetRiverItemInto(state, {
        sectionIds: MAGNET_FISHING_CONFIG.targetRiverSections,
        graceGameMinutes: MAGNET_FISHING_CONFIG.cleanupGraceGameMinutes,
      });
      progress.currentPullStreak += 1;
      progress.bestPullStreak = Math.max(progress.bestPullStreak, progress.currentPullStreak);
      progress.totalCoinsEarned += recovery.coins;
      progress.riverItemsRemoved += removedRiverGarbage ? 1 : 0;
      progress.recoveredByItem[recovery.id] += 1;
      progress.lastCatchId = recovery.id;
      if (!progress.bestCatchId || recovery.coins > MAGNET_RECOVERY_CATALOG[progress.bestCatchId].coins) progress.bestCatchId = recovery.id;
      const rarityRank = MAGNET_RARITY_ORDER[recovery.rarity];
      if (rarityRank >= MAGNET_RARITY_ORDER.rare) { progress.rareFinds += 1; progress.pullsWithoutRare = 0; }
      else progress.pullsWithoutRare = Math.min(MAGNET_FISHING_CONFIG.rarePityPulls, progress.pullsWithoutRare + 1);
      if (rarityRank >= MAGNET_RARITY_ORDER.treasure) { progress.treasureFinds += 1; progress.pullsWithoutTreasure = 0; }
      else progress.pullsWithoutTreasure = Math.min(MAGNET_FISHING_CONFIG.treasurePityPulls, progress.pullsWithoutTreasure + 1);
      if (recovery.rarity === "legendary") progress.legendaryFinds += 1;
      progress.recentFinds.push({
        catchId: recovery.id,
        day: state.world.day,
        coins: recovery.coins,
        at: this.now(),
        riverItemId: removedRiverGarbage?.id || null,
        riverSectionId: removedRiverGarbage?.sectionId || null,
      });
      progress.recentFinds = progress.recentFinds.slice(-MAGNET_FISHING_CONFIG.recentFindLimit);
      state.economy.coins += recovery.coins;
      state.economy.lifetimeCoinsEarned += recovery.coins;
      const ledger = appendLedger(state, this.now(), {
        amount: recovery.coins,
        kind: "magnet-recovery",
        reason: `Recovered ${recovery.name}`,
        catchId: recovery.id,
        rarity: recovery.rarity,
        riverItemId: removedRiverGarbage?.id || null,
        riverSectionId: removedRiverGarbage?.sectionId || null,
      });
      return { ok: true, code: "magnet-recovered", empty: false, recovery: { ...recovery }, removedRiverGarbage, rewardCoins: recovery.coins, balance: state.economy.coins, ledger, castsLeft: MAGNET_FISHING_CONFIG.dailyCasts - progress.castsToday };
    });
    if (result.ok) Object.assign(session, { phase: result.empty ? "miss" : "success", result: recovery?.id || null });
    return result;
  }

  cancel() {
    if (!this.activeSession) return { ok: false, code: "no-session", message: "No fishing session is open." };
    const session = this.getActiveSession();
    this.activeSession = null;
    return { ok: true, code: "fishing-cancelled", session };
  }

  getDiagnostics() {
    const state = this.getSnapshot();
    return {
      fishingSpots: Object.keys(FISHING_SPOT_BY_ID).length,
      magnetSpots: 1,
      fishCastsLeft: Math.max(0, FISHING_CONFIG.dailyCasts - state.castsToday),
      magnetCastsLeft: Math.max(0, MAGNET_FISHING_CONFIG.dailyCasts - state.magnet.castsToday),
      totalFishCaught: state.totalCaught,
      totalMagnetPulls: state.magnet.totalPulls,
      magnetCoinsEarned: state.magnet.totalCoinsEarned,
      discoveries: Object.values(state.caughtByItem).filter((count) => count > 0).length,
      activeMode: this.activeSession?.mode || null,
      activePhase: this.activeSession?.phase || null,
      hiddenZonesPerSession: TARGETING_CONFIG.zonesPerSession,
      inventoryIntegrated: true,
      visibleRiverCleanupIntegrated: true,
      aquariumHomeDisplayIntegrated: true,
      aquarium: state.aquarium,
    };
  }
}
