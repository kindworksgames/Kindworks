import {
  HOMEOWNER_GIFT_CONFIG,
  HOMEOWNER_GIFT_DIALOGUE,
  HOMEOWNER_GIFT_TIERS,
  homeownerGiftTierForItem,
} from "../data/homeownerGifts.js";
import { houseHomeNodeId } from "../data/homeInteriors.js";
import { ITEM_CATALOG, inventoryBucketFor } from "../data/items.js";
import { HOUSES } from "../data/town.js";

const PERSONAL_HOUSE_ID = "house-20";
const NPC_HOUSES = HOUSES.filter((house) => house.id !== PERSONAL_HOUSE_ID);
const HOUSE_BY_NODE = new Map(NPC_HOUSES.map((house) => [houseHomeNodeId(house), house]));
const HOUSE_BY_NUMBER = new Map(NPC_HOUSES.map((house) => [Number(house.id.split("-")[1]), house]));

function whole(value, minimum = 0, maximum = Number.MAX_SAFE_INTEGER, fallback = minimum) {
  const number = Math.floor(Number(value));
  return Number.isFinite(number) ? Math.max(minimum, Math.min(maximum, number)) : fallback;
}

function finiteDay(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(-999, Math.floor(number)) : -999;
}

function safeText(value, maximum) {
  return String(value || "").trim().slice(0, maximum);
}

function safeEventId(value) {
  return safeText(value, 160).replace(/[^A-Za-z0-9:_-]/g, "-");
}

function normalizeHouseId(value) {
  const number = Number(String(value || "").match(/(\d+)$/)?.[1]);
  return HOUSE_BY_NUMBER.get(number)?.id || null;
}

function inventoryQuantity(inventory, item) {
  const bucket = inventoryBucketFor(item);
  return bucket ? whole(inventory?.[bucket]?.[item.id]) : 0;
}

export function createFreshHomeownerGiftState() {
  return {
    format: HOMEOWNER_GIFT_CONFIG.format,
    misses: 0,
    totalGifts: 0,
    totalGiftValueReceived: 0,
    households: {},
    processedEventIds: [],
    history: [],
    queue: [],
  };
}

export function createFreshHomeownerGiftHousehold() {
  return { lastGiftDay: -999, lastLawnDay: -999, lastHouseDay: -999, giftsGiven: 0 };
}

export function sanitizeHomeownerGiftRecord(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const item = ITEM_CATALOG[raw.itemId];
  const houseId = normalizeHouseId(raw.houseId);
  const house = HOUSES.find((entry) => entry.id === houseId);
  const eventId = safeEventId(raw.eventId);
  const id = safeText(raw.id, 160);
  const tier = homeownerGiftTierForItem(item);
  if (!item || !house || house.id === PERSONAL_HOUSE_ID || !eventId || !id || !tier) return null;
  return {
    id,
    eventId,
    source: raw.source === "lawn" ? "lawn" : "house-rescue",
    houseId: house.id,
    homeNodeId: houseHomeNodeId(house),
    ownerId: safeText(raw.ownerId, 80),
    ownerName: safeText(raw.ownerName, 40) || "A grateful neighbour",
    itemId: item.id,
    itemName: item.name,
    itemIcon: item.icon,
    tier,
    rolledTier: HOMEOWNER_GIFT_TIERS.includes(raw.rolledTier) ? raw.rolledTier : tier,
    price: whole(item.price),
    fullCare: Boolean(raw.fullCare),
    pity: Boolean(raw.pity),
    day: whole(raw.day, 1, Number.MAX_SAFE_INTEGER, 1),
    at: whole(raw.at),
    dialogue: safeText(raw.dialogue, 420) || HOMEOWNER_GIFT_DIALOGUE["house-rescue"][0],
    revealed: Boolean(raw.revealed),
  };
}

function normalizeUniqueRecords(raw, limit) {
  const ids = new Set();
  const events = new Set();
  return (Array.isArray(raw) ? raw : [])
    .map(sanitizeHomeownerGiftRecord)
    .filter((record) => {
      if (!record || ids.has(record.id) || events.has(record.eventId)) return false;
      ids.add(record.id);
      events.add(record.eventId);
      return true;
    })
    .slice(-limit);
}

export function normalizeHomeownerGiftState(value, inventory = null) {
  const fresh = createFreshHomeownerGiftState();
  if (!value || typeof value !== "object" || Array.isArray(value)) return fresh;
  fresh.misses = whole(value.misses, 0, HOMEOWNER_GIFT_CONFIG.pityAfterMisses);
  fresh.totalGifts = whole(value.totalGifts);
  fresh.totalGiftValueReceived = whole(value.totalGiftValueReceived);
  for (const [rawNodeId, rawHousehold] of Object.entries(value.households || {})) {
    const number = Number(String(rawNodeId).match(/(\d+)$/)?.[1]);
    const house = HOUSE_BY_NUMBER.get(number);
    if (!house || !rawHousehold || typeof rawHousehold !== "object" || Array.isArray(rawHousehold)) continue;
    fresh.households[houseHomeNodeId(house)] = {
      lastGiftDay: finiteDay(rawHousehold.lastGiftDay),
      lastLawnDay: finiteDay(rawHousehold.lastLawnDay),
      lastHouseDay: finiteDay(rawHousehold.lastHouseDay),
      giftsGiven: whole(rawHousehold.giftsGiven),
    };
  }
  fresh.processedEventIds = [...new Set((Array.isArray(value.processedEventIds) ? value.processedEventIds : [])
    .map(safeEventId)
    .filter(Boolean))].slice(-HOMEOWNER_GIFT_CONFIG.processedLimit);
  fresh.history = normalizeUniqueRecords(value.history, HOMEOWNER_GIFT_CONFIG.historyLimit);
  const historyIds = new Set(fresh.history.map((record) => record.id));
  const queuedIds = new Set();
  const queuedEvents = new Set();
  const queuedItemCounts = new Map();
  fresh.queue = (Array.isArray(value.queue) ? value.queue : [])
    .map(sanitizeHomeownerGiftRecord)
    .filter((record) => {
      if (!record || record.revealed || !historyIds.has(record.id) || queuedIds.has(record.id) || queuedEvents.has(record.eventId)) return false;
      if (inventory) {
        const item = ITEM_CATALOG[record.itemId];
        const used = queuedItemCounts.get(record.itemId) || 0;
        if (!item || used >= inventoryQuantity(inventory, item)) return false;
        queuedItemCounts.set(record.itemId, used + 1);
      }
      queuedIds.add(record.id);
      queuedEvents.add(record.eventId);
      return true;
    })
    .slice(-HOMEOWNER_GIFT_CONFIG.queueLimit);
  return fresh;
}

export function projectLegacyHomeownerGiftState(legacy, inventory) {
  return normalizeHomeownerGiftState(legacy?.homeownerGifts, inventory);
}

export function validateHomeownerGiftState(value, inventory) {
  const errors = [];
  if (!value || typeof value !== "object" || Array.isArray(value)) return { ok: false, errors: ["Homeowner gift state is missing."] };
  if (value.format !== HOMEOWNER_GIFT_CONFIG.format) errors.push("Homeowner gift format is unsupported.");
  if (!Number.isSafeInteger(value.misses) || value.misses < 0 || value.misses > HOMEOWNER_GIFT_CONFIG.pityAfterMisses) errors.push("Homeowner gift pity counter is invalid.");
  if (!Number.isSafeInteger(value.totalGifts) || value.totalGifts < 0) errors.push("Homeowner gift total is invalid.");
  if (!Number.isSafeInteger(value.totalGiftValueReceived) || value.totalGiftValueReceived < 0) errors.push("Homeowner gift value total is invalid.");
  if (!value.households || typeof value.households !== "object" || Array.isArray(value.households)) errors.push("Homeowner gift households are invalid.");
  else for (const [nodeId, household] of Object.entries(value.households)) {
    if (!HOUSE_BY_NODE.has(nodeId)) errors.push(`Unknown homeowner gift household: ${nodeId}.`);
    if (!household || !["lastGiftDay", "lastLawnDay", "lastHouseDay", "giftsGiven"].every((field) => Number.isSafeInteger(household[field]))) errors.push(`${nodeId} has invalid homeowner gift cooldown data.`);
    else if (household.giftsGiven < 0) errors.push(`${nodeId} has an invalid homeowner gift count.`);
  }
  if (!Array.isArray(value.processedEventIds) || value.processedEventIds.length > HOMEOWNER_GIFT_CONFIG.processedLimit || new Set(value.processedEventIds).size !== value.processedEventIds.length || value.processedEventIds.some((id) => !safeEventId(id) || safeEventId(id) !== id)) errors.push("Homeowner gift processed events are invalid.");
  if (!Array.isArray(value.history) || value.history.length > HOMEOWNER_GIFT_CONFIG.historyLimit) errors.push("Homeowner gift history is invalid.");
  if (!Array.isArray(value.queue) || value.queue.length > HOMEOWNER_GIFT_CONFIG.queueLimit) errors.push("Homeowner gift queue is invalid.");
  const history = Array.isArray(value.history) ? value.history : [];
  const queue = Array.isArray(value.queue) ? value.queue : [];
  const historyIds = new Set();
  const historyEvents = new Set();
  for (const record of history) {
    const sanitized = sanitizeHomeownerGiftRecord(record);
    if (!sanitized || JSON.stringify(sanitized) !== JSON.stringify(record)) errors.push("Homeowner gift history contains an invalid record.");
    if (record?.id && historyIds.has(record.id)) errors.push("Homeowner gift history contains a duplicate record id.");
    if (record?.eventId && historyEvents.has(record.eventId)) errors.push("Homeowner gift history contains a duplicate event.");
    historyIds.add(record?.id);
    historyEvents.add(record?.eventId);
  }
  const queueIds = new Set();
  const queueEvents = new Set();
  const queueItemCounts = new Map();
  for (const record of queue) {
    if (!historyIds.has(record?.id) || record?.revealed) errors.push("Queued homeowner gift does not match unrevealed history.");
    if (queueIds.has(record?.id) || queueEvents.has(record?.eventId)) errors.push("Homeowner gift queue contains a duplicate.");
    queueIds.add(record?.id);
    queueEvents.add(record?.eventId);
    queueItemCounts.set(record?.itemId, (queueItemCounts.get(record?.itemId) || 0) + 1);
  }
  for (const [itemId, count] of queueItemCounts) {
    const item = ITEM_CATALOG[itemId];
    if (!item || count > inventoryQuantity(inventory, item)) errors.push(`Queued homeowner gift ${itemId} is not present in inventory.`);
  }
  return { ok: errors.length === 0, errors };
}
