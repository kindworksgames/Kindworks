import {
  SOUTH_SHORE_SCOOPS_CONFIG,
  SOUTH_SHORE_SCOOPS_PARTS,
  SOUTH_SHORE_SCOOPS_RESTORATION_MILESTONES,
  SOUTH_SHORE_SCOOPS_STATE_SCHEMA_VERSION,
  southShoreScoopsLevel,
} from "../data/southShoreScoops.js";

function whole(value, minimum = 0, maximum = Number.MAX_SAFE_INTEGER) {
  const number = Math.floor(Number(value));
  return Number.isFinite(number) ? Math.max(minimum, Math.min(maximum, number)) : minimum;
}

function decimal(value, minimum, maximum, fallback = minimum) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(minimum, Math.min(maximum, number)) : fallback;
}

function sameParts(left, right) {
  return Array.isArray(left) && left.length === right.length && left.every((id, index) => id === right[index]);
}

function normalizeActiveShift(value) {
  if (!value || typeof value !== "object" || Array.isArray(value) || value.finished) return null;
  const level = southShoreScoopsLevel(value.level?.level ?? value.level);
  const sourceOrders = Array.isArray(value.orders) ? value.orders : [];
  if (sourceOrders.length !== level.orders.length) return null;
  const orders = level.orders.map((authored, index) => {
    const source = sourceOrders[index] || {};
    const maxPatience = decimal(source.maxPatience, 1, level.patience, level.patience);
    return {
      id: authored.id,
      number: authored.number,
      customerName: authored.customerName,
      avatar: authored.avatar,
      items: authored.items.map((item) => ({ ...item, parts: [...item.parts] })),
      maxPatience,
      patience: decimal(source.patience, 0, maxPatience, maxPatience),
      status: ["waiting", "active", "served", "missed"].includes(source.status) ? source.status : "waiting",
    };
  });
  const orderIds = new Set(orders.map((order) => order.id));
  const activeOrderIds = [...new Set((Array.isArray(value.activeOrderIds) ? value.activeOrderIds : []).filter((id) => orderIds.has(id)))].slice(0, level.queueCap);
  const selectedOrderId = activeOrderIds.includes(value.selectedOrderId) ? value.selectedOrderId : activeOrderIds[0] || null;
  const work = {};
  for (const orderId of activeOrderIds) {
    const order = orders.find((candidate) => candidate.id === orderId);
    const sourceWork = value.work?.[orderId] || {};
    const tray = [];
    for (const parts of Array.isArray(sourceWork.tray) ? sourceWork.tray : []) {
      const expected = order.items[tray.length]?.parts;
      if (!expected || tray.length >= order.items.length - 1 || !sameParts(parts, expected)) break;
      tray.push([...parts]);
    }
    const build = (Array.isArray(sourceWork.build) ? sourceWork.build : [])
      .filter((id) => SOUTH_SHORE_SCOOPS_PARTS[id])
      .slice(0, SOUTH_SHORE_SCOOPS_CONFIG.maxBuildParts);
    work[orderId] = { build, tray };
  }
  const processed = whole(value.processed, 0, level.target);
  const served = whole(value.served, 0, processed);
  const missed = whole(value.missed, 0, processed - served);
  const spawnIndex = whole(value.spawnIndex, activeOrderIds.length, level.target);
  if (processed < level.target && (activeOrderIds.length !== 1 || spawnIndex !== processed + activeOrderIds.length)) return null;
  if (processed !== served + missed) return null;
  return {
    id: String(value.id || `south-shore-scoops-shift-${level.level}`).slice(0, 100),
    level,
    orders,
    spawnIndex,
    activeOrderIds,
    selectedOrderId,
    work,
    elapsed: decimal(value.elapsed, 0, Number.MAX_SAFE_INTEGER, 0),
    served,
    missed,
    mistakes: whole(value.mistakes, 0),
    waste: whole(value.waste, 0),
    processed,
    score: whole(value.score, 0),
    happiness: (Array.isArray(value.happiness) ? value.happiness : []).map((entry) => whole(entry, 0, 100)).slice(0, processed),
    finished: false,
    result: null,
    returnPosition: Number.isFinite(value.returnPosition?.x) && Number.isFinite(value.returnPosition?.y)
      ? { x: Number(value.returnPosition.x), y: Number(value.returnPosition.y) }
      : null,
    returnFacing: ["up", "down", "left", "right"].includes(value.returnFacing) ? value.returnFacing : "down",
  };
}

export function createFreshSouthShoreScoopsState() {
  return {
    schemaVersion: SOUTH_SHORE_SCOOPS_STATE_SCHEMA_VERSION,
    unlockedLevel: 1,
    selectedLevel: 1,
    completed: {},
    best: {},
    totalStars: 0,
    shifts: 0,
    lifetimeServed: 0,
    lifetimeCoins: 0,
    restorationTier: 0,
    lastLevel: null,
    lastOutcome: null,
    activeShift: null,
  };
}

export function normalizeSouthShoreScoopsState(value) {
  const fresh = createFreshSouthShoreScoopsState();
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  fresh.unlockedLevel = whole(source.unlockedLevel, 1, SOUTH_SHORE_SCOOPS_CONFIG.levelCount);
  for (const [key, completed] of Object.entries(source.completed || {})) {
    const level = whole(key, 0, SOUTH_SHORE_SCOOPS_CONFIG.levelCount);
    if (level >= 1 && completed) fresh.completed[level] = true;
  }
  for (const [key, record] of Object.entries(source.best || {})) {
    const level = whole(key, 0, SOUTH_SHORE_SCOOPS_CONFIG.levelCount);
    if (level < 1 || !record || typeof record !== "object") continue;
    fresh.best[level] = {
      score: whole(record.score, 0),
      stars: whole(record.stars, 0, 3),
      accuracy: whole(record.accuracy, 0, 100),
      served: whole(record.served, 0, southShoreScoopsLevel(level).target),
    };
  }
  if (fresh.completed[fresh.unlockedLevel] && fresh.unlockedLevel < SOUTH_SHORE_SCOOPS_CONFIG.levelCount) fresh.unlockedLevel += 1;
  fresh.selectedLevel = whole(source.selectedLevel, 1, fresh.unlockedLevel);
  fresh.totalStars = Object.values(fresh.best).reduce((sum, record) => sum + record.stars, 0);
  fresh.shifts = whole(source.shifts, 0);
  fresh.lifetimeServed = whole(source.lifetimeServed, 0);
  fresh.lifetimeCoins = whole(source.lifetimeCoins, 0);
  const completedCount = Object.keys(fresh.completed).length;
  fresh.restorationTier = SOUTH_SHORE_SCOOPS_RESTORATION_MILESTONES.filter((required) => completedCount >= required).length;
  fresh.lastLevel = source.lastLevel == null ? null : whole(source.lastLevel, 1, SOUTH_SHORE_SCOOPS_CONFIG.levelCount);
  fresh.lastOutcome = ["won", "lost"].includes(source.lastOutcome) ? source.lastOutcome : null;
  fresh.activeShift = normalizeActiveShift(source.activeShift);
  return fresh;
}

export function projectLegacySouthShoreScoops(value) {
  const projected = normalizeSouthShoreScoopsState(value);
  projected.activeShift = null;
  return projected;
}

export function validateSouthShoreScoopsState(value) {
  const errors = [];
  if (!value || typeof value !== "object" || Array.isArray(value)) return { ok: false, errors: ["South Shore Scoops state must be an object."] };
  if (value.schemaVersion !== SOUTH_SHORE_SCOOPS_STATE_SCHEMA_VERSION) errors.push("South Shore Scoops state schema version is unsupported.");
  if (!Number.isInteger(value.unlockedLevel) || value.unlockedLevel < 1 || value.unlockedLevel > SOUTH_SHORE_SCOOPS_CONFIG.levelCount) errors.push("South Shore Scoops unlocked level is invalid.");
  if (!Number.isInteger(value.selectedLevel) || value.selectedLevel < 1 || value.selectedLevel > value.unlockedLevel) errors.push("South Shore Scoops selected level is invalid.");
  for (const key of ["totalStars", "shifts", "lifetimeServed", "lifetimeCoins", "restorationTier"]) if (!Number.isSafeInteger(value[key]) || value[key] < 0) errors.push(`South Shore Scoops ${key} is invalid.`);
  if (value.restorationTier > SOUTH_SHORE_SCOOPS_RESTORATION_MILESTONES.length) errors.push("South Shore Scoops restoration tier is invalid.");
  if (!value.completed || typeof value.completed !== "object" || Array.isArray(value.completed)) errors.push("South Shore Scoops completed-level records are invalid.");
  if (!value.best || typeof value.best !== "object" || Array.isArray(value.best)) errors.push("South Shore Scoops best-score records are invalid.");
  let starTotal = 0;
  for (const [key, record] of Object.entries(value.best || {})) {
    const level = Number(key);
    if (!Number.isInteger(level) || level < 1 || level > SOUTH_SHORE_SCOOPS_CONFIG.levelCount || !record || typeof record !== "object") { errors.push("South Shore Scoops best-score level is invalid."); continue; }
    if (!Number.isSafeInteger(record.score) || record.score < 0 || !Number.isInteger(record.stars) || record.stars < 0 || record.stars > 3 || !Number.isInteger(record.served) || record.served < 0 || record.served > southShoreScoopsLevel(level).target || !Number.isInteger(record.accuracy) || record.accuracy < 0 || record.accuracy > 100) errors.push(`South Shore Scoops best score for level ${level} is invalid.`);
    starTotal += Number(record.stars) || 0;
  }
  for (const [key, completed] of Object.entries(value.completed || {})) {
    const level = Number(key);
    if (!Number.isInteger(level) || level < 1 || level > SOUTH_SHORE_SCOOPS_CONFIG.levelCount || completed !== true) errors.push("South Shore Scoops completed-level record is invalid.");
  }
  if (starTotal !== value.totalStars) errors.push("South Shore Scoops total stars do not match best scores.");
  const restorationTier = SOUTH_SHORE_SCOOPS_RESTORATION_MILESTONES.filter((required) => Object.keys(value.completed || {}).length >= required).length;
  if (restorationTier !== value.restorationTier) errors.push("South Shore Scoops restoration tier does not match completed shifts.");
  if (value.lastLevel !== null && (!Number.isInteger(value.lastLevel) || value.lastLevel < 1 || value.lastLevel > SOUTH_SHORE_SCOOPS_CONFIG.levelCount)) errors.push("South Shore Scoops last level is invalid.");
  if (value.lastOutcome !== null && !["won", "lost"].includes(value.lastOutcome)) errors.push("South Shore Scoops last outcome is invalid.");
  if (value.activeShift !== null && !normalizeActiveShift(value.activeShift)) errors.push("South Shore Scoops resumable shift is invalid.");
  return { ok: errors.length === 0, errors };
}

export function normalizeSouthShoreScoopsActiveShift(value) {
  return normalizeActiveShift(value);
}
