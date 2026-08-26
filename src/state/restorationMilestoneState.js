import {
  FIRST_RESTORATION_GIFT_ITEM_ID,
  RESTORATION_MILESTONE_ORDER,
  RESTORATION_MILESTONE_SCHEMA_VERSION,
  RESTORATION_MILESTONES,
  RESTORATION_PROCESSED_EVENT_LIMIT,
} from "../data/restorationMilestones.js";
import { absoluteWorldMinute } from "../data/farming.js";
import { ITEM_CATALOG, inventoryLimitFor } from "../data/items.js";
import { COIN_LEDGER_LIMIT } from "./economyState.js";

const CLEANUP_TYPES = Object.freeze(["lawn", "river", "waste"]);
const RESTORATION_ZONES = Object.freeze(["commons", "highstreet", "station", "shore"]);

function whole(value, minimum = 0, maximum = Number.MAX_SAFE_INTEGER, fallback = minimum) {
  const number = Math.floor(Number(value));
  return Number.isFinite(number) ? Math.max(minimum, Math.min(maximum, number)) : fallback;
}

function safeEventId(value) {
  return String(value || "").replace(/[^A-Za-z0-9:_-]/g, "-").slice(0, 160);
}

export function createFreshRestorationMilestoneState() {
  return {
    schemaVersion: RESTORATION_MILESTONE_SCHEMA_VERSION,
    unlocked: {},
    revealed: {},
    unlockDay: {},
    counters: {
      totalAccepted: 0,
      cleanupByType: { lawn: 0, river: 0, waste: 0 },
      perfectByType: { lawn: 0, river: 0, waste: 0 },
      zones: { commons: 0, highstreet: 0, station: 0, shore: 0 },
    },
    festivalUntilGameMinute: 0,
    processedEventIds: [],
    firstRestorationGift: {
      granted: false,
      itemId: FIRST_RESTORATION_GIFT_ITEM_ID,
      quantity: 0,
      grantedAtDay: 0,
      ledgerId: null,
    },
    lastUnlockedId: null,
  };
}

export function normalizeRestorationMilestoneState(value) {
  const fresh = createFreshRestorationMilestoneState();
  if (!value || typeof value !== "object" || Array.isArray(value)) return fresh;
  let previousUnlocked = true;
  for (const id of RESTORATION_MILESTONE_ORDER) {
    const unlocked = previousUnlocked && Boolean(value.unlocked?.[id]);
    if (unlocked) {
      fresh.unlocked[id] = true;
      fresh.unlockDay[id] = whole(value.unlockDay?.[id], 1, Number.MAX_SAFE_INTEGER, 1);
      if (value.revealed?.[id]) fresh.revealed[id] = true;
    }
    previousUnlocked = unlocked;
  }
  const counters = value.counters || {};
  fresh.counters.totalAccepted = whole(counters.totalAccepted);
  for (const type of CLEANUP_TYPES) {
    fresh.counters.cleanupByType[type] = whole(counters.cleanupByType?.[type]);
    fresh.counters.perfectByType[type] = whole(counters.perfectByType?.[type], 0, fresh.counters.cleanupByType[type]);
  }
  for (const zone of RESTORATION_ZONES) fresh.counters.zones[zone] = whole(counters.zones?.[zone]);
  fresh.festivalUntilGameMinute = whole(value.festivalUntilGameMinute);
  fresh.processedEventIds = Array.isArray(value.processedEventIds)
    ? [...new Set(value.processedEventIds.map(safeEventId).filter(Boolean))].slice(-RESTORATION_PROCESSED_EVENT_LIMIT)
    : [];
  const gift = value.firstRestorationGift || {};
  fresh.firstRestorationGift = {
    granted: Boolean(gift.granted),
    itemId: FIRST_RESTORATION_GIFT_ITEM_ID,
    quantity: Boolean(gift.granted) ? whole(gift.quantity, 0, 1, 1) : 0,
    grantedAtDay: Boolean(gift.granted) ? whole(gift.grantedAtDay, 1, Number.MAX_SAFE_INTEGER, 1) : 0,
    ledgerId: typeof gift.ledgerId === "string" ? gift.ledgerId.slice(0, 80) : null,
  };
  fresh.lastUnlockedId = fresh.unlocked[value.lastUnlockedId] ? value.lastUnlockedId : RESTORATION_MILESTONE_ORDER.filter((id) => fresh.unlocked[id]).at(-1) || null;
  return fresh;
}

export function restorationZoneForPosition(position) {
  if (!position || !Number.isFinite(Number(position.x)) || !Number.isFinite(Number(position.y))) return "other";
  const x = Number(position.x);
  const y = Number(position.y);
  if (x >= 3550 && y <= 650) return "station";
  if (x >= 3320 && y >= 2110) return "shore";
  if (x >= 1060 && x <= 2080 && y >= 950 && y <= 1480) return "commons";
  if (x >= 2760 && x <= 3820 && y >= 340 && y <= 1180) return "highstreet";
  return "other";
}

export function restorationPhysicalCounts(state) {
  let trees = 0;
  let bins = 0;
  let seating = 0;
  const objects = state?.townPlacement?.objects || [];
  for (const object of objects) {
    if (object.type === "tree") trees += 1;
    if (object.type === "bin") bins += 1;
    if (object.type === "bench" || object.type === "picnic") seating += 1;
  }
  return { trees, bins, seating, placed: objects.length };
}

function activeParkLitter(state) {
  return (state?.environment?.land?.items || []).filter((item) => item.active && item.zone === "park").length;
}

function activeShoreLitter(state) {
  return (state?.environment?.land?.items || []).filter((item) => item.active && item.x >= 3320 && item.x <= 4180 && item.y >= 2110 && item.y <= 2780).length;
}

export function restorationMilestoneCondition(state, id) {
  const restoration = state?.restorationMilestones;
  if (!restoration) return false;
  const counters = restoration.counters;
  const physical = restorationPhysicalCounts(state);
  const cleanupTypes = Object.values(counters.cleanupByType).filter((count) => count > 0).length;
  const unlocked = (milestoneId) => Boolean(restoration.unlocked[milestoneId]);
  if (id === "wake") return counters.totalAccepted >= 5 && cleanupTypes >= 2;
  if (id === "commons") return unlocked("wake") && (counters.zones.commons >= 3 || (counters.totalAccepted >= 8 && activeParkLitter(state) <= 4));
  if (id === "highstreet") return unlocked("commons") && counters.zones.highstreet >= 1 && counters.totalAccepted >= 12;
  if (id === "river") return unlocked("highstreet") && counters.cleanupByType.river >= 3 && (state.environment?.river?.items || []).length <= 14;
  if (id === "station") return unlocked("river") && (counters.zones.station >= 1 || counters.totalAccepted >= 18);
  if (id === "shore") return unlocked("station") && ((counters.zones.shore >= 2 && counters.totalAccepted >= 22) || (counters.totalAccepted >= 26 && activeShoreLitter(state) <= 8));
  if (id === "green") return unlocked("shore") && physical.trees >= 4 && physical.bins >= 1 && physical.seating >= 1;
  if (id === "festival") return unlocked("green") && RESTORATION_MILESTONE_ORDER.slice(0, 7).every(unlocked) && counters.totalAccepted >= 28 && physical.placed >= 6;
  return false;
}

function appendGiftLedger(state, occurredAt) {
  const id = `coin-${String(state.economy.nextTransactionId).padStart(6, "0")}`;
  state.economy.nextTransactionId += 1;
  state.economy.ledger.push({
    id,
    amount: 0,
    kind: "first-restoration-gift",
    reason: "Willowmere restoration gift",
    itemId: FIRST_RESTORATION_GIFT_ITEM_ID,
    quantity: 1,
    milestoneId: "wake",
    occurredAt,
  });
  state.economy.ledger = state.economy.ledger.slice(-COIN_LEDGER_LIMIT);
  return id;
}

function grantFirstRestorationGiftInto(state, occurredAt) {
  const restoration = state.restorationMilestones;
  if (restoration.firstRestorationGift.granted) return { granted: false, duplicate: true };
  const item = ITEM_CATALOG[FIRST_RESTORATION_GIFT_ITEM_ID];
  const current = whole(state.inventory?.placeables?.[FIRST_RESTORATION_GIFT_ITEM_ID]);
  if (!item || current >= inventoryLimitFor(item)) return { granted: false, code: "gift-capacity" };
  state.inventory.placeables[FIRST_RESTORATION_GIFT_ITEM_ID] = current + 1;
  const ledgerId = appendGiftLedger(state, occurredAt);
  restoration.firstRestorationGift = {
    granted: true,
    itemId: FIRST_RESTORATION_GIFT_ITEM_ID,
    quantity: 1,
    grantedAtDay: whole(state.world?.day, 1),
    ledgerId,
  };
  return { granted: true, itemId: FIRST_RESTORATION_GIFT_ITEM_ID, quantity: 1, ledgerId };
}

export function unlockRestorationMilestoneInto(state, id, { revealed = false, occurredAt = null } = {}) {
  if (!state?.restorationMilestones || !RESTORATION_MILESTONES[id] || state.restorationMilestones.unlocked[id]) return { unlocked: false, duplicate: Boolean(state?.restorationMilestones?.unlocked?.[id]) };
  const index = RESTORATION_MILESTONE_ORDER.indexOf(id);
  if (index > 0 && !state.restorationMilestones.unlocked[RESTORATION_MILESTONE_ORDER[index - 1]]) return { unlocked: false, code: "prerequisite-locked" };
  state.restorationMilestones.unlocked[id] = true;
  state.restorationMilestones.unlockDay[id] = whole(state.world?.day, 1);
  if (revealed) state.restorationMilestones.revealed[id] = true;
  state.restorationMilestones.lastUnlockedId = id;
  if (id === "festival") state.restorationMilestones.festivalUntilGameMinute = Math.max(
    state.restorationMilestones.festivalUntilGameMinute,
    absoluteWorldMinute(state.world) + 1440,
  );
  const gift = id === "wake" ? grantFirstRestorationGiftInto(state, occurredAt || state.updatedAt || new Date(0).toISOString()) : null;
  return { unlocked: true, id, definition: RESTORATION_MILESTONES[id], gift };
}

export function evaluateRestorationMilestonesInto(state, { trigger = "any", maxUnlocks = 1, revealed = false, occurredAt = null } = {}) {
  const newlyUnlocked = [];
  if (state.restorationMilestones.unlocked.wake && !state.restorationMilestones.firstRestorationGift.granted) {
    grantFirstRestorationGiftInto(state, occurredAt || state.updatedAt || new Date(0).toISOString());
  }
  const limit = maxUnlocks === Infinity ? Infinity : Math.max(0, whole(maxUnlocks, 0, RESTORATION_MILESTONE_ORDER.length, 1));
  for (const id of RESTORATION_MILESTONE_ORDER) {
    if (newlyUnlocked.length >= limit) break;
    const allowed = trigger === "any" || trigger === "bootstrap"
      || (["wake", "commons", "highstreet", "river", "station", "shore"].includes(id) && trigger === "cleanup")
      || (id === "green" && trigger === "placement")
      || (id === "festival" && ["cleanup", "placement"].includes(trigger));
    if (!allowed || state.restorationMilestones.unlocked[id] || !restorationMilestoneCondition(state, id)) continue;
    const result = unlockRestorationMilestoneInto(state, id, { revealed, occurredAt });
    if (result.unlocked) newlyUnlocked.push(result);
  }
  return newlyUnlocked;
}

export function registerRestorationCleanupInto(state, event) {
  if (!state?.restorationMilestones || !event) return { accepted: false, code: "restoration-unavailable", newlyUnlocked: [] };
  const eventId = safeEventId(event.eventId);
  if (!eventId) return { accepted: false, code: "event-id-missing", newlyUnlocked: [] };
  if (state.restorationMilestones.processedEventIds.includes(eventId)) return { accepted: false, duplicate: true, eventId, newlyUnlocked: [] };
  const type = event.jobType === "beach" || event.jobType === "playground" ? "waste" : event.jobType;
  if (!CLEANUP_TYPES.includes(type)) return { accepted: false, code: "cleanup-type-unsupported", eventId, newlyUnlocked: [] };
  state.restorationMilestones.processedEventIds.push(eventId);
  state.restorationMilestones.processedEventIds = state.restorationMilestones.processedEventIds.slice(-RESTORATION_PROCESSED_EVENT_LIMIT);
  state.restorationMilestones.counters.totalAccepted += 1;
  state.restorationMilestones.counters.cleanupByType[type] += 1;
  if (Number(event.percent) >= 100) state.restorationMilestones.counters.perfectByType[type] += 1;
  const zone = restorationZoneForPosition(event.worldPosition);
  if (RESTORATION_ZONES.includes(zone)) state.restorationMilestones.counters.zones[zone] += 1;
  const newlyUnlocked = evaluateRestorationMilestonesInto(state, { trigger: "cleanup", maxUnlocks: 1, occurredAt: event.occurredAt });
  return { accepted: true, eventId, type, zone, newlyUnlocked };
}

export function registerRestorationPlacementInto(state, event) {
  if (!state?.restorationMilestones) return { accepted: false, code: "restoration-unavailable", newlyUnlocked: [] };
  const eventId = safeEventId(event?.eventId);
  if (eventId && state.restorationMilestones.processedEventIds.includes(eventId)) return { accepted: false, duplicate: true, eventId, newlyUnlocked: [] };
  if (eventId) {
    state.restorationMilestones.processedEventIds.push(eventId);
    state.restorationMilestones.processedEventIds = state.restorationMilestones.processedEventIds.slice(-RESTORATION_PROCESSED_EVENT_LIMIT);
  }
  const newlyUnlocked = evaluateRestorationMilestonesInto(state, { trigger: "placement", maxUnlocks: 1, occurredAt: event?.occurredAt });
  return { accepted: true, eventId: eventId || null, newlyUnlocked };
}

export function pendingRestorationMilestoneIds(restoration) {
  return RESTORATION_MILESTONE_ORDER.filter((id) => restoration?.unlocked?.[id] && !restoration?.revealed?.[id]);
}

export function restorationFestivalActive(state) {
  return Boolean(state?.restorationMilestones?.unlocked?.festival)
    && absoluteWorldMinute(state.world) < whole(state.restorationMilestones.festivalUntilGameMinute);
}

export function projectLegacyRestorationMilestoneState(legacy, state) {
  if (legacy?.milestones && typeof legacy.milestones === "object") {
    const restored = normalizeRestorationMilestoneState({
      ...legacy.milestones,
      firstRestorationGift: {
        granted: Boolean(legacy.onboarding?.firstRestorationGiftGranted),
        itemId: FIRST_RESTORATION_GIFT_ITEM_ID,
        quantity: legacy.onboarding?.firstRestorationGiftGranted ? 1 : 0,
        grantedAtDay: legacy.onboarding?.firstRestorationGiftGranted ? whole(legacy.worldDay, 1) : 0,
        ledgerId: null,
      },
    });
    return restored;
  }
  const restored = createFreshRestorationMilestoneState();
  restored.counters.totalAccepted = whole(legacy?.completedJobCount);
  const progress = legacy?.miniGames?.progress || legacy?.miniGameProgress || {};
  for (const type of CLEANUP_TYPES) {
    restored.counters.cleanupByType[type] = whole(progress?.[type]?.completed);
    const best = progress?.[type]?.best || progress?.[type]?.results || {};
    restored.counters.perfectByType[type] = Object.values(best).filter((record) => Number(record?.percent ?? record?.bestPercent) >= 100).length;
  }
  state.restorationMilestones = restored;
  evaluateRestorationMilestonesInto(state, { trigger: "bootstrap", maxUnlocks: Infinity, revealed: true, occurredAt: state.updatedAt });
  return state.restorationMilestones;
}

export function validateRestorationMilestoneState(value) {
  const errors = [];
  if (!value || typeof value !== "object" || Array.isArray(value)) return { ok: false, errors: ["Restoration milestone state must be an object."] };
  if (value.schemaVersion !== RESTORATION_MILESTONE_SCHEMA_VERSION) errors.push("Restoration milestone schema version is invalid.");
  let previousUnlocked = true;
  for (const id of RESTORATION_MILESTONE_ORDER) {
    if (value.unlocked?.[id] && !previousUnlocked) errors.push(`${id} is unlocked before its prerequisite.`);
    if (value.revealed?.[id] && !value.unlocked?.[id]) errors.push(`${id} is revealed before it is unlocked.`);
    if (value.unlocked?.[id] && !Number.isInteger(value.unlockDay?.[id])) errors.push(`${id} has no valid unlock day.`);
    previousUnlocked = Boolean(value.unlocked?.[id]);
  }
  if (!Number.isInteger(value.counters?.totalAccepted) || value.counters.totalAccepted < 0) errors.push("Restoration cleanup total is invalid.");
  for (const type of CLEANUP_TYPES) {
    if (!Number.isInteger(value.counters?.cleanupByType?.[type]) || value.counters.cleanupByType[type] < 0) errors.push(`${type} restoration count is invalid.`);
    if (!Number.isInteger(value.counters?.perfectByType?.[type]) || value.counters.perfectByType[type] < 0 || value.counters.perfectByType[type] > value.counters.cleanupByType[type]) errors.push(`${type} perfect restoration count is invalid.`);
  }
  for (const zone of RESTORATION_ZONES) if (!Number.isInteger(value.counters?.zones?.[zone]) || value.counters.zones[zone] < 0) errors.push(`${zone} restoration zone count is invalid.`);
  if (!Array.isArray(value.processedEventIds) || value.processedEventIds.length > RESTORATION_PROCESSED_EVENT_LIMIT || new Set(value.processedEventIds).size !== value.processedEventIds.length) errors.push("Restoration event history is invalid.");
  if (!value.firstRestorationGift || value.firstRestorationGift.itemId !== FIRST_RESTORATION_GIFT_ITEM_ID || typeof value.firstRestorationGift.granted !== "boolean") errors.push("First restoration gift state is invalid.");
  if (value.firstRestorationGift?.granted && !value.unlocked?.wake) errors.push("The first restoration gift exists before Wake.");
  if (!Number.isInteger(value.festivalUntilGameMinute) || value.festivalUntilGameMinute < 0) errors.push("Festival duration is invalid.");
  if (value.lastUnlockedId !== null && !RESTORATION_MILESTONES[value.lastUnlockedId]) errors.push("Last restoration milestone identity is invalid.");
  return { ok: errors.length === 0, errors };
}
