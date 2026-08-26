import {
  HARBOUR_GENERAL,
  HARBOUR_GENERAL_CATALOG,
  HARBOUR_GENERAL_CONFIG,
  HARBOUR_GENERAL_ITEM_IDS,
  HARBOUR_GENERAL_STARTER_SLOTS,
  createInitialHarbourWardrobe,
  harbourDemand,
  validateHarbourGeneralCatalogue,
} from "../data/harbourGeneral.js";
import { COIN_LEDGER_LIMIT } from "../state/economyState.js";
import { normalizeHarbourGeneralState } from "../state/harbourGeneralState.js";

function absoluteMinute(world) {
  return Math.max(0, (Number(world?.day || 1) - 1) * 1440 + Number(world?.clockMinutes || 0));
}

function hourOpen(clockMinutes) {
  const hour = Number(clockMinutes || 0) / 60;
  return hour >= HARBOUR_GENERAL.open && hour < HARBOUR_GENERAL.close;
}

function ensureWardrobe(resident) {
  const initial = createInitialHarbourWardrobe(resident.id);
  const source = resident.weatherWardrobe && typeof resident.weatherWardrobe === "object" ? resident.weatherWardrobe : {};
  resident.weatherWardrobe = Object.fromEntries(Object.keys(initial).map((key) => [key, Boolean(source[key] ?? initial[key])]));
  return resident.weatherWardrobe;
}

function appendLedger(state, timestamp, details) {
  const serial = state.economy.nextTransactionId;
  const entry = {
    id: `coin-${String(serial).padStart(6, "0")}`,
    itemId: null,
    quantity: null,
    shopId: HARBOUR_GENERAL.id,
    balance: state.economy.coins,
    occurredAt: new Date(timestamp).toISOString(),
    ...details,
  };
  state.economy.nextTransactionId += 1;
  state.economy.ledger.push(entry);
  state.economy.ledger = state.economy.ledger.slice(-COIN_LEDGER_LIMIT);
  return entry;
}

export class HarbourGeneralService {
  constructor(gameState, repository, { now = () => Date.now(), random = () => Math.random() } = {}) {
    this.gameState = gameState;
    this.repository = repository;
    this.now = now;
    this.random = random;
    this.listeners = new Set();
    this.lastResult = { ok: true, code: "ready" };
  }

  subscribe(listener) {
    if (typeof listener !== "function") return () => {};
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(result) {
    const snapshot = this.getSnapshot();
    for (const listener of this.listeners) listener(snapshot, result);
  }

  getSnapshot(stateOverride = null) {
    const state = stateOverride || this.gameState.getSnapshot();
    return normalizeHarbourGeneralState(state.harbourGeneral);
  }

  getCatalogue() {
    const state = this.gameState.getSnapshot();
    const business = this.getSnapshot(state);
    return {
      ok: true,
      shop: HARBOUR_GENERAL,
      balance: state.economy.coins,
      weather: state.world.weather?.current?.kind || "clear",
      state: business,
      products: HARBOUR_GENERAL_ITEM_IDS.map((id) => ({
        ...HARBOUR_GENERAL_CATALOG[id],
        stock: business.stock[id],
        displayedAt: business.slots.indexOf(id),
        demand: harbourDemand(id, state.world.weather?.current?.kind || "clear"),
      })),
    };
  }

  commit(mutator, failureMessage) {
    const checkpoint = this.gameState.getSnapshot();
    const working = structuredClone(checkpoint);
    working.harbourGeneral = normalizeHarbourGeneralState(working.harbourGeneral);
    const mutation = mutator(working);
    if (!mutation.ok) return mutation;
    working.updatedAt = new Date(this.now()).toISOString();
    const replaced = this.gameState.replace(working);
    if (!replaced.ok) return { ok: false, code: "state-validation", errors: replaced.errors };
    const saved = this.repository.save(working, { now: this.now() });
    if (!saved.ok) {
      const rollback = this.gameState.replace(checkpoint);
      return { ok: false, code: "persistence-failed", message: failureMessage, save: saved, rollbackOk: rollback.ok };
    }
    const result = { ...mutation, state: this.getSnapshot(), save: saved };
    this.lastResult = result;
    this.emit(result);
    return result;
  }

  purchaseDeed() {
    const current = this.gameState.getSnapshot();
    if (current.harbourGeneral?.owned) return { ok: false, code: "already-owned", message: "Harbour General is already yours." };
    if (current.economy.coins < HARBOUR_GENERAL.deedPrice) return { ok: false, code: "insufficient-funds", message: `You need ${(HARBOUR_GENERAL.deedPrice - current.economy.coins).toLocaleString()} more coins to buy Harbour General.`, required: HARBOUR_GENERAL.deedPrice, available: current.economy.coins };
    return this.commit((state) => {
      const business = normalizeHarbourGeneralState(state.harbourGeneral);
      if (business.owned) return { ok: false, code: "already-owned", message: "Harbour General is already yours." };
      if (state.economy.coins < HARBOUR_GENERAL.deedPrice) return { ok: false, code: "insufficient-funds", message: "There are not enough coins for the deed." };
      state.economy.coins -= HARBOUR_GENERAL.deedPrice;
      state.economy.lifetimeCoinsSpent += HARBOUR_GENERAL.deedPrice;
      business.owned = true;
      business.purchasedDay = state.world.day;
      business.slots = [...HARBOUR_GENERAL_STARTER_SLOTS];
      for (const id of HARBOUR_GENERAL_STARTER_SLOTS) business.stock[id] = HARBOUR_GENERAL_CONFIG.caseSize;
      state.harbourGeneral = business;
      const ledger = appendLedger(state, this.now(), { amount: -HARBOUR_GENERAL.deedPrice, kind: "harbour-general-deed", reason: "Purchased the Harbour General deed", business: HARBOUR_GENERAL.name });
      return { ok: true, code: "harbour-general-purchased", cost: HARBOUR_GENERAL.deedPrice, starterStock: true, ledger };
    }, "The shop purchase could not be saved, so no coins were spent.");
  }

  assignSlot(slot, itemId) {
    const item = HARBOUR_GENERAL_CATALOG[itemId];
    const index = Math.max(0, Math.min(HARBOUR_GENERAL_CONFIG.slotCount - 1, Math.floor(Number(slot) || 0)));
    if (!item) return { ok: false, code: "unknown-stock", message: "That stock item is unavailable." };
    return this.commit((state) => {
      const business = normalizeHarbourGeneralState(state.harbourGeneral);
      if (!business.owned) return { ok: false, code: "not-owned", message: "Buy Harbour General first." };
      const previousIndex = business.slots.indexOf(itemId);
      if (previousIndex >= 0 && previousIndex !== index) business.slots[previousIndex] = business.slots[index] || null;
      business.slots[index] = itemId;
      state.harbourGeneral = business;
      return { ok: true, code: "display-assigned", slot: index, itemId, swappedFrom: previousIndex >= 0 && previousIndex !== index ? previousIndex : null };
    }, "That display change could not be saved.");
  }

  clearSlot(slot) {
    const index = Math.max(0, Math.min(HARBOUR_GENERAL_CONFIG.slotCount - 1, Math.floor(Number(slot) || 0)));
    return this.commit((state) => {
      const business = normalizeHarbourGeneralState(state.harbourGeneral);
      if (!business.owned) return { ok: false, code: "not-owned", message: "Buy Harbour General first." };
      if (!business.slots[index]) return { ok: false, code: "already-empty", message: "This display is already empty." };
      business.slots[index] = null;
      state.harbourGeneral = business;
      return { ok: true, code: "display-cleared", slot: index };
    }, "That display change could not be saved.");
  }

  restock(itemId) {
    const item = HARBOUR_GENERAL_CATALOG[itemId];
    if (!item) return { ok: false, code: "unknown-stock", message: "Choose an item for this display first." };
    const current = this.gameState.getSnapshot();
    const business = this.getSnapshot(current);
    const quantity = Math.min(HARBOUR_GENERAL_CONFIG.caseSize, HARBOUR_GENERAL_CONFIG.maxPerItem - business.stock[itemId]);
    const cost = quantity * item.wholesale;
    if (!business.owned) return { ok: false, code: "not-owned", message: "Buy Harbour General first." };
    if (quantity < 1) return { ok: false, code: "stock-full", message: `${item.name} stock is already full.` };
    if (current.economy.coins < cost) return { ok: false, code: "insufficient-funds", message: `You need ${(cost - current.economy.coins).toLocaleString()} more coins for this case.`, required: cost, available: current.economy.coins };
    return this.commit((state) => {
      const next = normalizeHarbourGeneralState(state.harbourGeneral);
      const amount = Math.min(HARBOUR_GENERAL_CONFIG.caseSize, HARBOUR_GENERAL_CONFIG.maxPerItem - next.stock[itemId]);
      const total = amount * item.wholesale;
      if (amount < 1) return { ok: false, code: "stock-full", message: `${item.name} stock is already full.` };
      if (state.economy.coins < total) return { ok: false, code: "insufficient-funds", message: "There are not enough coins for this case." };
      state.economy.coins -= total;
      state.economy.lifetimeCoinsSpent += total;
      next.stock[itemId] += amount;
      next.lifetimeStockSpend += total;
      state.harbourGeneral = next;
      const ledger = appendLedger(state, this.now(), { amount: -total, kind: "harbour-general-stock", reason: `Restocked ${amount} ${item.name}`, itemId, quantity: amount, immediate: true });
      return { ok: true, code: "stock-restocked", itemId, quantity: amount, cost: total, immediate: true, ledger };
    }, "The restock could not be saved, so no coins were spent.");
  }

  collectTill() {
    const amount = this.getSnapshot().tillCoins;
    if (!amount) return { ok: false, code: "till-empty", message: "The till is empty." };
    return this.commit((state) => {
      const business = normalizeHarbourGeneralState(state.harbourGeneral);
      const coins = business.tillCoins;
      if (!coins) return { ok: false, code: "till-empty", message: "The till is empty." };
      business.tillCoins = 0;
      state.harbourGeneral = business;
      state.economy.coins += coins;
      state.economy.lifetimeCoinsEarned += coins;
      const ledger = appendLedger(state, this.now(), { amount: coins, kind: "harbour-general-till", reason: "Collected Harbour General in-person sales", inPersonSales: true });
      return { ok: true, code: "till-collected", coins, ledger };
    }, "The till collection could not be saved, so the sale coins remain safely in the till.");
  }

  shoppingSchedule(state, resident) {
    const business = normalizeHarbourGeneralState(state?.harbourGeneral);
    if (!business.owned || !hourOpen(state?.world?.clockMinutes) || resident.id === "npc-19") return null;
    if (Number(resident.needs?.errands || 0) < HARBOUR_GENERAL_CONFIG.shoppingNeedThreshold) return null;
    if (absoluteMinute(state.world) - Number(resident.lastActivityFloorAt || 0) < HARBOUR_GENERAL_CONFIG.purchaseCooldownGameMinutes) return null;
    return { phase: "leisure", targetNodeId: HARBOUR_GENERAL.legacyNodeId, activity: "Shopping at Harbour General", actionState: "SHOPPING", forceVisible: true };
  }

  resolveNpcPurchaseInto(state, resident, { random = this.random } = {}) {
    const business = normalizeHarbourGeneralState(state?.harbourGeneral);
    if (!business.owned || !hourOpen(state?.world?.clockMinutes)) return { ok: false, code: "closed" };
    const wardrobe = ensureWardrobe(resident);
    const candidates = business.slots.map((id) => HARBOUR_GENERAL_CATALOG[id]).filter((item) => item && business.stock[item.id] > 0 && (!item.wardrobe || !wardrobe[item.wardrobe]));
    if (!candidates.length) {
      business.lostSales += 1;
      state.harbourGeneral = business;
      resident.lastActivityFloorAt = absoluteMinute(state.world);
      return { ok: false, code: "no-stock" };
    }
    if (random() > 1 - HARBOUR_GENERAL_CONFIG.browseChance) {
      state.harbourGeneral = business;
      resident.lastActivityFloorAt = absoluteMinute(state.world);
      return { ok: false, code: "browsed" };
    }
    const weather = state.world.weather?.current?.kind || "clear";
    const total = candidates.reduce((sum, item) => sum + harbourDemand(item, weather), 0);
    let roll = random() * total;
    let chosen = candidates[0];
    for (const item of candidates) {
      roll -= harbourDemand(item, weather);
      if (roll <= 0) { chosen = item; break; }
    }
    business.stock[chosen.id] -= 1;
    business.tillCoins += chosen.price;
    business.lifetimeGross += chosen.price;
    business.lifetimeSales += 1;
    business.salesByItem[chosen.id] += 1;
    business.recentSales.unshift({ npcId: resident.id, npcName: resident.name || resident.id, itemId: chosen.id, day: state.world.day, price: chosen.price, weather });
    business.recentSales = business.recentSales.slice(0, HARBOUR_GENERAL_CONFIG.historyLimit);
    if (chosen.wardrobe) wardrobe[chosen.wardrobe] = true;
    resident.lastHarbourPurchaseId = chosen.id;
    resident.lastHarbourPurchaseDay = state.world.day;
    resident.lastActivityFloorAt = absoluteMinute(state.world);
    resident.needs.errands = Math.max(0, Number(resident.needs.errands || 0) - 82);
    resident.carryItem = "bag";
    resident.carryLabel = chosen.name;
    resident.carryStage = "full";
    resident.carryOriginBusinessId = HARBOUR_GENERAL.id;
    resident.carryGameMinutes = 0;
    resident.carryStageDurationGameMinutes = 15 + random() * 45;
    resident.activity = `Bought ${chosen.name} at Harbour General`;
    state.harbourGeneral = business;
    return { ok: true, code: "npc-sale", npcId: resident.id, itemId: chosen.id, name: chosen.name, price: chosen.price, weather, delivery: false };
  }

  getDiagnostics() {
    const catalogue = validateHarbourGeneralCatalogue();
    const state = this.getSnapshot();
    return {
      version: "1.0.0-milestone-37",
      valid: catalogue.ok,
      errors: catalogue.errors,
      owned: state.owned,
      deedPrice: HARBOUR_GENERAL.deedPrice,
      products: catalogue.products,
      weatherProducts: catalogue.weather,
      everydayProducts: catalogue.everyday,
      slots: state.slots.length,
      assignedSlots: state.slots.filter(Boolean).length,
      totalStock: Object.values(state.stock).reduce((sum, quantity) => sum + quantity, 0),
      tillCoins: state.tillCoins,
      lifetimeGross: state.lifetimeGross,
      lifetimeStockSpend: state.lifetimeStockSpend,
      lifetimeSales: state.lifetimeSales,
      lostSales: state.lostSales,
      immediateWholesaleRestocking: true,
      customerDeliverySystem: false,
      inPersonNpcPurchases: true,
      weatherWardrobesPersistent: true,
      atomicPersistence: true,
      lastResult: { ...this.lastResult },
    };
  }
}
