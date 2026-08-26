import {
  MORNING_MUG_CONFIG,
  MORNING_MUG_RECIPES,
  MORNING_MUG_STATE_SCHEMA_VERSION,
  morningMugLevel,
} from "../data/morningMug.js";

function whole(value, minimum = 0, maximum = Number.MAX_SAFE_INTEGER) {
  const number = Math.floor(Number(value));
  return Number.isFinite(number) ? Math.max(minimum, Math.min(maximum, number)) : minimum;
}

function decimal(value, minimum, maximum, fallback = minimum) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(minimum, Math.min(maximum, number)) : fallback;
}

function normalizeActiveShift(value) {
  if (!value || typeof value !== "object" || Array.isArray(value) || value.finished) return null;
  const level = morningMugLevel(value.level?.level ?? value.level);
  const sourceOrders = Array.isArray(value.orders) ? value.orders : [];
  if (sourceOrders.length !== level.orders.length) return null;
  const orders = level.orders.map((authored, index) => {
    const source = sourceOrders[index] || {};
    const maxPatience = decimal(source.maxPatience, 1, level.patience + 24, level.patience + Math.max(0, authored.recipes.length - 1) * 12);
    return {
      id: `morning-mug-order-${index + 1}`,
      at: decimal(source.at, 0, level.duration, authored.at),
      recipes: [...authored.recipes],
      customerName: String(source.customerName || `Customer ${index + 1}`).slice(0, 60),
      maxPatience,
      patience: decimal(source.patience, -MORNING_MUG_CONFIG.graceSeconds, maxPatience, maxPatience),
      status: ["waiting", "active", "served"].includes(source.status) ? source.status : "waiting",
    };
  });
  const orderIds = new Set(orders.map((entry) => entry.id));
  const activeOrderIds = [...new Set((Array.isArray(value.activeOrderIds) ? value.activeOrderIds : []).filter((id) => orderIds.has(id)))];
  const usedOrderIds = new Set();
  const trays = Array.from({ length: MORNING_MUG_CONFIG.trayCount }, (_, index) => {
    const source = Array.isArray(value.trays) ? value.trays[index] || {} : {};
    const orderId = activeOrderIds.includes(source.orderId) && !usedOrderIds.has(source.orderId) ? source.orderId : null;
    if (orderId) usedOrderIds.add(orderId);
    const customerOrder = orders.find((entry) => entry.id === orderId);
    const recipeIndex = customerOrder ? whole(source.recipeIndex, 0, Math.max(0, customerOrder.recipes.length - 1)) : 0;
    const recipe = customerOrder ? MORNING_MUG_RECIPES[customerOrder.recipes[recipeIndex]] : null;
    const stepIndex = recipe ? whole(source.stepIndex, 0, recipe.steps.length) : 0;
    return {
      index,
      orderId,
      recipeIndex,
      stepIndex,
      completedSteps: recipe ? [...recipe.steps.slice(0, stepIndex)] : [],
      completedRecipes: customerOrder ? [...customerOrder.recipes.slice(0, recipeIndex)] : [],
    };
  });
  return {
    id: String(value.id || `morning-mug-shift-${level.level}`).slice(0, 80),
    level,
    orders,
    spawnIndex: whole(value.spawnIndex, 0, orders.length),
    activeOrderIds,
    trays,
    activeTray: whole(value.activeTray, 0, MORNING_MUG_CONFIG.trayCount - 1),
    elapsed: decimal(value.elapsed, 0, level.duration, 0),
    served: whole(value.served, 0, level.target),
    missed: whole(value.missed, 0, level.target),
    mistakes: whole(value.mistakes),
    waste: whole(value.waste),
    streak: whole(value.streak),
    bestStreak: whole(value.bestStreak),
    happiness: (Array.isArray(value.happiness) ? value.happiness : []).slice(0, level.target).map((entry) => decimal(entry, 0, 1, 0)),
    finished: false,
    result: null,
    failureReason: null,
    returnPosition: value.returnPosition && Number.isFinite(Number(value.returnPosition.x)) && Number.isFinite(Number(value.returnPosition.y))
      ? { x: Number(value.returnPosition.x), y: Number(value.returnPosition.y) }
      : null,
    returnFacing: ["up", "down", "left", "right"].includes(value.returnFacing) ? value.returnFacing : "down",
  };
}

export function createFreshMorningMugState() {
  return {
    schemaVersion: MORNING_MUG_STATE_SCHEMA_VERSION,
    unlockedLevel: 1,
    completed: {},
    best: {},
    totalStars: 0,
    shifts: 0,
    lifetimeServed: 0,
    lifetimeCoins: 0,
    lastLevel: null,
    lastOutcome: null,
    activeShift: null,
  };
}

export function normalizeMorningMugState(value) {
  const fresh = createFreshMorningMugState();
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const completed = {};
  const best = {};
  for (let level = 1; level <= MORNING_MUG_CONFIG.levelCount; level += 1) {
    if (source.completed?.[level]) completed[level] = true;
    const record = source.best?.[level];
    if (record && typeof record === "object") {
      best[level] = {
        score: whole(record.score, 0, 100),
        stars: whole(record.stars, 0, 3),
        served: whole(record.served),
        accuracy: whole(record.accuracy, 0, 100),
      };
    }
  }
  let contiguousClear = 0;
  while (contiguousClear < MORNING_MUG_CONFIG.levelCount && completed[contiguousClear + 1]) contiguousClear += 1;
  const pilotUnlock = whole(source.unlockedLevel, 1, MORNING_MUG_CONFIG.levelCount) === 20 && completed[20] ? 21 : 1;
  const lastLevel = source.lastLevel === null || source.lastLevel === undefined ? null : whole(source.lastLevel, 1, MORNING_MUG_CONFIG.levelCount);
  const lastOutcome = ["won", "lost"].includes(source.lastOutcome) ? source.lastOutcome : null;
  return {
    ...fresh,
    unlockedLevel: Math.max(whole(source.unlockedLevel, 1, MORNING_MUG_CONFIG.levelCount), Math.min(MORNING_MUG_CONFIG.levelCount, contiguousClear + 1), pilotUnlock),
    completed,
    best,
    totalStars: Object.values(best).reduce((sum, record) => sum + record.stars, 0),
    shifts: whole(source.shifts),
    lifetimeServed: whole(source.lifetimeServed ?? source.served),
    lifetimeCoins: whole(source.lifetimeCoins ?? source.totalCoinsEarned),
    lastLevel,
    lastOutcome,
    activeShift: normalizeActiveShift(source.activeShift),
  };
}

export function projectLegacyMorningMug(value) {
  return normalizeMorningMugState(value);
}

export function validateMorningMugState(value) {
  const errors = [];
  if (!value || typeof value !== "object" || Array.isArray(value)) return { ok: false, errors: ["Morning Mug state is missing."] };
  if (value.schemaVersion !== MORNING_MUG_STATE_SCHEMA_VERSION) errors.push("Morning Mug state schema version is unsupported.");
  if (!Number.isInteger(value.unlockedLevel) || value.unlockedLevel < 1 || value.unlockedLevel > MORNING_MUG_CONFIG.levelCount) errors.push("Morning Mug unlocked level is invalid.");
  for (const key of ["totalStars", "shifts", "lifetimeServed", "lifetimeCoins"]) if (!Number.isSafeInteger(value[key]) || value[key] < 0) errors.push(`Morning Mug ${key} is invalid.`);
  if (!value.completed || typeof value.completed !== "object" || Array.isArray(value.completed)) errors.push("Morning Mug completed-level records are invalid.");
  if (!value.best || typeof value.best !== "object" || Array.isArray(value.best)) errors.push("Morning Mug best-score records are invalid.");
  let starTotal = 0;
  for (const [key, record] of Object.entries(value.best || {})) {
    const level = Number(key);
    if (!Number.isInteger(level) || level < 1 || level > MORNING_MUG_CONFIG.levelCount || !record || typeof record !== "object") { errors.push("Morning Mug best-score level is invalid."); continue; }
    if (!Number.isInteger(record.score) || record.score < 0 || record.score > 100 || !Number.isInteger(record.stars) || record.stars < 0 || record.stars > 3 || !Number.isInteger(record.served) || record.served < 0 || !Number.isInteger(record.accuracy) || record.accuracy < 0 || record.accuracy > 100) errors.push(`Morning Mug best score for level ${level} is invalid.`);
    starTotal += Number(record.stars) || 0;
  }
  for (const [key, completed] of Object.entries(value.completed || {})) {
    const level = Number(key);
    if (!Number.isInteger(level) || level < 1 || level > MORNING_MUG_CONFIG.levelCount || completed !== true) errors.push("Morning Mug completed-level record is invalid.");
  }
  if (starTotal !== value.totalStars) errors.push("Morning Mug total stars do not match best scores.");
  if (value.lastLevel !== null && (!Number.isInteger(value.lastLevel) || value.lastLevel < 1 || value.lastLevel > MORNING_MUG_CONFIG.levelCount)) errors.push("Morning Mug last level is invalid.");
  if (value.lastOutcome !== null && !["won", "lost"].includes(value.lastOutcome)) errors.push("Morning Mug last outcome is invalid.");
  if (value.activeShift !== null && !normalizeActiveShift(value.activeShift)) errors.push("Morning Mug resumable shift is invalid.");
  return { ok: errors.length === 0, errors };
}

export function normalizeMorningMugActiveShift(value) {
  return normalizeActiveShift(value);
}
