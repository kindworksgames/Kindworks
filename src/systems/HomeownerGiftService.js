import {
  HOMEOWNER_GIFT_CONFIG,
  HOMEOWNER_GIFT_TIERS,
  homeownerGiftDialogue,
  homeownerGiftTierForItem,
  homeownerGiftTierFromRoll,
  seededHomeownerGiftUnit,
} from "../data/homeownerGifts.js";
import { houseHomeNodeId, houseInteriorMetadata, residentDefinitionsForHouse } from "../data/homeInteriors.js";
import { ITEM_CATALOG, inventoryBucketFor, inventoryLimitFor } from "../data/items.js";
import { HOUSES } from "../data/town.js";
import { COIN_LEDGER_LIMIT } from "../state/economyState.js";
import { createFreshHomeownerGiftHousehold, createFreshHomeownerGiftState } from "../state/homeownerGiftState.js";
import { InventoryService } from "./InventoryService.js";
import { itemUnlockState } from "./ShopService.js";

const PERSONAL_HOUSE_ID = "house-20";
const inventoryService = new InventoryService();

function safeEventId(value) {
  return String(value || "").trim().replace(/[^A-Za-z0-9:_-]/g, "-").slice(0, 160);
}

function houseById(value) {
  const number = Number(String(value || "").match(/(\d+)$/)?.[1]);
  return HOUSES.find((house) => Number(house.id.split("-")[1]) === number) || null;
}

function quantity(state, item) {
  const bucket = inventoryBucketFor(item);
  return bucket ? Math.max(0, Math.floor(Number(state.inventory?.[bucket]?.[item.id]) || 0)) : 0;
}

function homeownerGiftItemAllowed(state, item, { ignoreUnlock = false } = {}) {
  if (!item || item.qaOnly || item.subscriptionOnly || item.ownedByDefault || item.aquarium) return false;
  if (HOMEOWNER_GIFT_CONFIG.excludedItemIds.includes(item.id)) return false;
  if (!Number.isFinite(Number(item.price)) || Number(item.price) <= 0) return false;
  if (!["equipment", "placeable", "furniture"].includes(item.category)) return false;
  if (!ignoreUnlock && !itemUnlockState(state, item).unlocked) return false;
  return quantity(state, item) < inventoryLimitFor(item);
}

function homeownerGiftThemeMatches(item, source, fullCare) {
  if (fullCare) return true;
  if (source === "lawn") return item.slot === "mower" || item.category === "placeable";
  return item.slot === "vacuum" || item.category === "furniture";
}

export function chooseHomeownerGiftItem(state, rolledTier, source, fullCare, eventId, { ignoreUnlock = false } = {}) {
  const start = HOMEOWNER_GIFT_TIERS.indexOf(rolledTier);
  for (let index = start; index >= 0; index -= 1) {
    const tier = HOMEOWNER_GIFT_TIERS[index];
    const all = Object.values(ITEM_CATALOG)
      .filter((item) => homeownerGiftItemAllowed(state, item, { ignoreUnlock }) && homeownerGiftTierForItem(item) === tier)
      .sort((a, b) => a.id.localeCompare(b.id));
    const themed = all.filter((item) => homeownerGiftThemeMatches(item, source, fullCare));
    const pool = themed.length ? themed : all;
    if (pool.length) {
      const pick = Math.min(pool.length - 1, Math.floor(seededHomeownerGiftUnit(`${eventId}:gift-item:${tier}`, index + 17) * pool.length));
      return { item: pool[pick], tier, downgraded: tier !== rolledTier };
    }
  }
  return null;
}

function ownerForHouse(house, eventId) {
  const residents = residentDefinitionsForHouse(house).slice().sort((a, b) => a.id.localeCompare(b.id));
  if (!residents.length) return null;
  const index = Math.min(residents.length - 1, Math.floor(seededHomeownerGiftUnit(`${eventId}:owner`, Number(house.id.split("-")[1])) * residents.length));
  return residents[index];
}

function rememberEvent(gifts, eventId) {
  if (!eventId || gifts.processedEventIds.includes(eventId)) return false;
  gifts.processedEventIds.push(eventId);
  gifts.processedEventIds = gifts.processedEventIds.slice(-HOMEOWNER_GIFT_CONFIG.processedLimit);
  return true;
}

function appendGiftLedger(state, record, occurredAt) {
  const id = `coin-${String(state.economy.nextTransactionId).padStart(6, "0")}`;
  state.economy.nextTransactionId += 1;
  state.economy.ledger.push({
    id,
    amount: 0,
    kind: "homeowner-gift",
    reason: `${record.ownerName}'s gratitude gift`,
    itemId: record.itemId,
    quantity: 1,
    eventId: record.eventId,
    source: record.source,
    houseId: record.houseId,
    homeNodeId: record.homeNodeId,
    ownerId: record.ownerId,
    itemValue: record.price,
    tier: record.tier,
    rolledTier: record.rolledTier,
    fullCare: record.fullCare,
    pity: record.pity,
    occurredAt,
  });
  state.economy.ledger = state.economy.ledger.slice(-COIN_LEDGER_LIMIT);
  return id;
}

export function queueHomeownerGiftInto(state, {
  source,
  houseId,
  eventId,
  percent = 100,
  forceRoll = null,
  forceTier = null,
  ignoreCooldown = false,
  ignoreUnlock = false,
  now = Date.now(),
} = {}) {
  if (!state?.homeownerGifts) state.homeownerGifts = createFreshHomeownerGiftState();
  const gifts = state.homeownerGifts;
  const house = houseById(houseId);
  if (!house || house.id === PERSONAL_HOUSE_ID || !["lawn", "house-rescue"].includes(source)) return { ok: true, eligible: false, reason: "No NPC-owned household is eligible." };
  if (source === "lawn" && Number(percent) < HOMEOWNER_GIFT_CONFIG.minimumLawnPercent) return { ok: true, eligible: false, reason: `Lawn gifts require at least ${HOMEOWNER_GIFT_CONFIG.minimumLawnPercent}% completion.` };
  const normalizedEventId = safeEventId(eventId);
  const owner = ownerForHouse(house, normalizedEventId || "gift");
  if (!owner) return { ok: true, eligible: false, reason: "This household has no NPC owner." };
  if (!normalizedEventId || gifts.processedEventIds.includes(normalizedEventId)) return { ok: true, duplicate: true, eligible: false, eventId: normalizedEventId };
  if (gifts.queue.length >= HOMEOWNER_GIFT_CONFIG.queueLimit) return { ok: true, eligible: true, gift: false, queueFull: true, retryable: true, reason: "Open your waiting neighbour gifts before receiving another.", eventId: normalizedEventId, ownerId: owner.id };
  if (!rememberEvent(gifts, normalizedEventId)) return { ok: true, duplicate: true, eligible: false, eventId: normalizedEventId };

  const worldDay = Math.max(1, Math.floor(Number(state.world?.day) || 1));
  const homeNodeId = houseHomeNodeId(house);
  const household = { ...createFreshHomeownerGiftHousehold(), ...(gifts.households[homeNodeId] || {}) };
  const otherDay = source === "lawn" ? household.lastHouseDay : household.lastLawnDay;
  const fullCare = worldDay - otherDay >= 0 && worldDay - otherDay <= HOMEOWNER_GIFT_CONFIG.fullCareWindowDays;
  if (source === "lawn") household.lastLawnDay = worldDay;
  else household.lastHouseDay = worldDay;
  gifts.households[homeNodeId] = household;
  if (!ignoreCooldown && worldDay - household.lastGiftDay < HOMEOWNER_GIFT_CONFIG.householdCooldownDays) return { ok: true, eligible: true, gift: false, cooldown: true, eventId: normalizedEventId, homeNodeId, ownerId: owner.id, fullCare };

  const pity = gifts.misses >= HOMEOWNER_GIFT_CONFIG.pityAfterMisses;
  const roll = forceRoll === null
    ? seededHomeownerGiftUnit(`${normalizedEventId}:gift-roll`, gifts.totalGifts + gifts.misses + 1)
    : Math.max(0, Math.min(0.999999999, Number(forceRoll) || 0));
  const rolledTier = HOMEOWNER_GIFT_TIERS.includes(forceTier) ? forceTier : homeownerGiftTierFromRoll(roll, fullCare, pity);
  if (!rolledTier) {
    gifts.misses = Math.min(HOMEOWNER_GIFT_CONFIG.pityAfterMisses, gifts.misses + 1);
    return { ok: true, eligible: true, gift: false, eventId: normalizedEventId, homeNodeId, ownerId: owner.id, fullCare, pity, roll };
  }
  const selected = chooseHomeownerGiftItem(state, rolledTier, source, fullCare, normalizedEventId, { ignoreUnlock });
  if (!selected) {
    gifts.misses = Math.min(HOMEOWNER_GIFT_CONFIG.pityAfterMisses, gifts.misses + 1);
    return { ok: true, eligible: true, gift: false, noEligibleItem: true, eventId: normalizedEventId, homeNodeId, ownerId: owner.id, fullCare, pity, roll, rolledTier };
  }
  const granted = inventoryService.add(state.inventory, selected.item.id, 1);
  if (!granted.ok) {
    gifts.misses = Math.min(HOMEOWNER_GIFT_CONFIG.pityAfterMisses, gifts.misses + 1);
    return { ok: true, eligible: true, gift: false, grantFailed: true, reason: granted.message, eventId: normalizedEventId, homeNodeId, ownerId: owner.id, fullCare, pity, roll, rolledTier };
  }
  const timestamp = Math.max(0, Math.floor(Number(now) || 0));
  const record = {
    id: `neighbour-gift-${timestamp}-${gifts.totalGifts + 1}`,
    eventId: normalizedEventId,
    source,
    houseId: house.id,
    homeNodeId,
    ownerId: owner.id,
    ownerName: owner.name,
    itemId: selected.item.id,
    itemName: selected.item.name,
    itemIcon: selected.item.icon,
    tier: selected.tier,
    rolledTier,
    price: Number(selected.item.price) || 0,
    fullCare,
    pity,
    day: worldDay,
    at: timestamp,
    dialogue: homeownerGiftDialogue(source, fullCare, rolledTier, normalizedEventId),
    revealed: false,
  };
  gifts.misses = 0;
  gifts.totalGifts += 1;
  gifts.totalGiftValueReceived += record.price;
  household.lastGiftDay = worldDay;
  household.giftsGiven = Math.max(0, Number(household.giftsGiven) || 0) + 1;
  gifts.queue.push(record);
  gifts.history.push({ ...record });
  gifts.history = gifts.history.slice(-HOMEOWNER_GIFT_CONFIG.historyLimit);
  const occurredAt = new Date(timestamp).toISOString();
  const ledgerId = appendGiftLedger(state, record, occurredAt);
  return { ok: true, eligible: true, gift: true, record: structuredClone(record), item: structuredClone(selected.item), downgraded: selected.downgraded, roll, ledgerId };
}

export class HomeownerGiftService {
  constructor(gameState, repository, { now = () => Date.now() } = {}) {
    this.gameState = gameState;
    this.repository = repository;
    this.now = now;
  }

  getSnapshot() {
    return structuredClone(this.gameState.getSnapshot().homeownerGifts);
  }

  getNext() {
    return this.getSnapshot().queue[0] || null;
  }

  commit(mutator) {
    const checkpoint = this.gameState.getSnapshot();
    const working = structuredClone(checkpoint);
    const mutation = mutator(working);
    if (!mutation.ok) return mutation;
    working.updatedAt = new Date(this.now()).toISOString();
    const replaced = this.gameState.replace(working);
    if (!replaced.ok) return { ok: false, code: "state-validation", errors: replaced.errors, message: replaced.errors.join(" ") };
    const saved = this.repository.save(working, { now: this.now() });
    if (!saved.ok) {
      const rollback = this.gameState.replace(checkpoint);
      return { ok: false, code: "persistence-failed", message: "The neighbour gift could not be saved, so it is still waiting safely.", save: saved, rollbackOk: rollback.ok };
    }
    return { ...mutation, state: this.gameState.getSnapshot(), save: saved };
  }

  queueForQa({ houseId = "house-1", source = "house-rescue", tier = "thoughtful" } = {}) {
    return this.commit((state) => queueHomeownerGiftInto(state, {
      source,
      houseId,
      eventId: `homeowner:qa:${source}:${houseId}:${this.now()}`,
      percent: 100,
      forceTier: tier,
      ignoreCooldown: true,
      ignoreUnlock: true,
      now: this.now(),
    }));
  }

  acknowledge(recordId = null) {
    return this.commit((state) => {
      const queued = state.homeownerGifts.queue[0];
      if (!queued || (recordId && queued.id !== recordId)) return { ok: false, code: "gift-unavailable", message: "That neighbour gift is no longer waiting." };
      const history = state.homeownerGifts.history.find((record) => record.id === queued.id);
      if (!history) return { ok: false, code: "gift-history-missing", message: "The gift record is incomplete and was left safely unchanged." };
      history.revealed = true;
      state.homeownerGifts.queue.shift();
      return { ok: true, code: "homeowner-gift-acknowledged", record: structuredClone({ ...queued, revealed: true }) };
    });
  }

  getDiagnostics() {
    const gifts = this.getSnapshot();
    return {
      format: gifts.format,
      misses: gifts.misses,
      pityAfterMisses: HOMEOWNER_GIFT_CONFIG.pityAfterMisses,
      totalGifts: gifts.totalGifts,
      totalGiftValueReceived: gifts.totalGiftValueReceived,
      queued: gifts.queue.length,
      history: gifts.history.length,
      processedEvents: gifts.processedEventIds.length,
      householdCooldownDays: HOMEOWNER_GIFT_CONFIG.householdCooldownDays,
      fullCareWindowDays: HOMEOWNER_GIFT_CONFIG.fullCareWindowDays,
      minimumLawnPercent: HOMEOWNER_GIFT_CONFIG.minimumLawnPercent,
      expensiveGiftChance: HOMEOWNER_GIFT_CONFIG.odds.normal.rare + HOMEOWNER_GIFT_CONFIG.odds.normal.exceptional,
      next: gifts.queue[0] || null,
      homes: Object.entries(gifts.households).map(([homeNodeId, household]) => {
        const number = Number(homeNodeId.match(/(\d+)$/)?.[1]);
        const house = HOUSES.find((entry) => Number(entry.id.split("-")[1]) === number);
        return { homeNodeId, homeName: houseInteriorMetadata(house?.id).name, ...household };
      }),
    };
  }
}
