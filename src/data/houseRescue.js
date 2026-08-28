import {
  buildHouseRescueGeometry,
  houseRescueGeometryBlocked,
  houseRescuePointInZones,
  houseRescueReachablePoints,
  houseRescueVacuumStart,
} from "./houseRescueGeometry.js";

export const HOUSE_RESCUE_STATE_SCHEMA_VERSION = 1;
export const HOUSE_RESCUE_TOTAL_LEVELS = 750;

export const HOUSE_RESCUE_RULES = Object.freeze({
  maxDirtyHomes: 5,
  completionCoverage: 0.95,
  baseCoins: 60,
  accuracyCoins: 40,
  maxCoins: 170,
  levelBonusEvery: 50,
  levelBonusCoins: 5,
  maxLevelBonusCoins: 70,
  respawnMinDays: 3,
  respawnMaxDays: 6,
  visibleItemsPerWave: 9,
  correctScore: 2,
  wrongScore: -1,
  vacuumRadius: 7.2,
  vacuumPower: 1,
  initialDirty: Object.freeze(["house-1", "house-6", "house-11", "house-16"]),
});

// Exterior dirt is derived from the existing save fields, so old saves gain the
// visual progression without a schema migration or a new reward-bearing state.
export function houseExteriorDirtStage(home, worldDay = 1) {
  if (!home || home.houseId === "house-20") return 0;
  if (home.dirty) return 3;
  const due = Math.max(0, Math.floor(Number(home.nextDirtyDay) || 0));
  if (!due) return 0;
  const day = Math.max(1, Math.floor(Number(worldDay) || 1));
  const completed = Math.max(0, Math.floor(Number(home.lastCompletedDay) || 0));
  const cleanDay = completed || Math.max(1, due - HOUSE_RESCUE_RULES.respawnMaxDays);
  const duration = Math.max(1, due - cleanDay);
  const progress = Math.max(0, Math.min(1, (day - cleanDay) / duration));
  return progress >= 2 / 3 ? 2 : progress >= 1 / 3 ? 1 : 0;
}

export const HOUSE_RESCUE_CATEGORIES = Object.freeze({
  organic: Object.freeze({ id: "organic", label: "Organic", icon: "🌿", color: "#4d934f" }),
  recycle: Object.freeze({ id: "recycle", label: "Recycling", icon: "♻️", color: "#4389c7" }),
  garbage: Object.freeze({ id: "garbage", label: "Garbage", icon: "🗑️", color: "#333a3d" }),
});

export const HOUSE_RESCUE_ITEMS = Object.freeze([
  Object.freeze({ id: "apple-core", category: "organic", label: "Apple core", icon: "🍎" }),
  Object.freeze({ id: "banana-peel", category: "organic", label: "Banana peel", icon: "🍌" }),
  Object.freeze({ id: "food-scraps", category: "organic", label: "Food scraps", icon: "🥬" }),
  Object.freeze({ id: "eggshell", category: "organic", label: "Eggshells", icon: "🥚" }),
  Object.freeze({ id: "carrot-top", category: "organic", label: "Carrot top", icon: "🥕" }),
  Object.freeze({ id: "drink-can", category: "recycle", label: "Empty can", icon: "🥫" }),
  Object.freeze({ id: "plastic-bottle", category: "recycle", label: "Plastic bottle", icon: "🧴" }),
  Object.freeze({ id: "glass-bottle", category: "recycle", label: "Glass bottle", icon: "🍾" }),
  Object.freeze({ id: "newspaper", category: "recycle", label: "Newspaper", icon: "📰" }),
  Object.freeze({ id: "cardboard", category: "recycle", label: "Cardboard", icon: "📦" }),
  Object.freeze({ id: "dirty-tissue", category: "garbage", label: "Dirty tissue", icon: "🧻" }),
  Object.freeze({ id: "greasy-wrapper", category: "garbage", label: "Greasy wrapper", icon: "🍬" }),
  Object.freeze({ id: "broken-mug", category: "garbage", label: "Broken mug", icon: "☕" }),
  Object.freeze({ id: "used-sponge", category: "garbage", label: "Used sponge", icon: "🧽" }),
  Object.freeze({ id: "plastic-fork", category: "garbage", label: "Plastic fork", icon: "🍴" }),
]);

const ITEMS_BY_CATEGORY = Object.freeze(Object.fromEntries(
  Object.keys(HOUSE_RESCUE_CATEGORIES).map((category) => [category, HOUSE_RESCUE_ITEMS.filter((item) => item.category === category)]),
));

function clampLevel(value) {
  const number = Math.floor(Number(value));
  return Number.isFinite(number) ? Math.max(1, Math.min(HOUSE_RESCUE_TOTAL_LEVELS, number)) : 1;
}

function hashUnit(key, index = 0) {
  let hash = 2166136261;
  const text = `${key}:${index}`;
  for (let cursor = 0; cursor < text.length; cursor += 1) {
    hash ^= text.charCodeAt(cursor);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967296;
}

const RESCUE_GEOMETRY_CACHE = new Map();
const RESCUE_REACHABLE_CACHE = new Map();
const RESCUE_ITEM_CACHE = new Map();
const RESCUE_DIRT_CACHE = new Map();

function geometryFor(houseId) {
  if (!RESCUE_GEOMETRY_CACHE.has(houseId)) RESCUE_GEOMETRY_CACHE.set(houseId, buildHouseRescueGeometry(houseId));
  return RESCUE_GEOMETRY_CACHE.get(houseId);
}

function reachableFor(houseId, geometry) {
  if (!RESCUE_REACHABLE_CACHE.has(houseId)) {
    const start = houseRescueVacuumStart(geometry);
    RESCUE_REACHABLE_CACHE.set(houseId, { start, points: houseRescueReachablePoints(geometry, start) });
  }
  return RESCUE_REACHABLE_CACHE.get(houseId);
}

export function houseRescueLevel(value) {
  const level = clampLevel(value);
  const index = level - 1;
  const progress = index / Math.max(1, HOUSE_RESCUE_TOTAL_LEVELS - 1);
  const itemTier = Math.min(7, Math.floor(index / 94));
  const itemCount = 9 + itemTier * 3;
  const maxStainStrength = Math.min(5, 1 + Math.floor(index / 150));
  const dirtCount = Math.min(270, 180 + Math.floor(index / 25) * 3);
  const itemSpacing = Number((48 - progress * 7).toFixed(3));
  const label = maxStainStrength === 1 ? "light stains"
    : maxStainStrength === 2 ? "set-in stains"
      : maxStainStrength === 3 ? "stubborn stains"
        : maxStainStrength === 4 ? "deep grime" : "very deep grime";
  return Object.freeze({ level, itemCount, maxStainStrength, dirtCount, itemSpacing, difficultyIndex: level, label });
}

export function houseRescueLevelBonus(level) {
  const steps = Math.floor((clampLevel(level) - 1) / HOUSE_RESCUE_RULES.levelBonusEvery);
  return Math.min(HOUSE_RESCUE_RULES.maxLevelBonusCoins, steps * HOUSE_RESCUE_RULES.levelBonusCoins);
}

export function houseRescueStars(mistakes) {
  const count = Math.max(0, Math.floor(Number(mistakes) || 0));
  return count <= 1 ? 3 : count <= 4 ? 2 : 1;
}

export function houseRescueReward(level, correct, mistakes) {
  const sorted = Math.max(0, Math.floor(Number(correct) || 0));
  const errors = Math.max(0, Math.floor(Number(mistakes) || 0));
  const accuracy = sorted / Math.max(1, sorted + errors);
  return Math.min(
    HOUSE_RESCUE_RULES.maxCoins,
    HOUSE_RESCUE_RULES.baseCoins + Math.round(HOUSE_RESCUE_RULES.accuracyCoins * accuracy) + houseRescueLevelBonus(level),
  );
}

export function generateHouseRescueItems({ houseId, jobSerial = 1, level = 1 }) {
  const config = houseRescueLevel(level);
  const cacheKey = `${houseId}:${Math.max(1, Math.floor(Number(jobSerial) || 1))}:${config.level}`;
  if (RESCUE_ITEM_CACHE.has(cacheKey)) return RESCUE_ITEM_CACHE.get(cacheKey);
  const geometry = geometryFor(houseId);
  const categories = Object.keys(HOUSE_RESCUE_CATEGORIES);
  const points = [];
  const minimumSpacing = Math.max(5.2, config.itemSpacing / 7.2);
  for (let waveStart = 0; waveStart < config.itemCount; waveStart += HOUSE_RESCUE_RULES.visibleItemsPerWave) {
    const waveCount = Math.min(HOUSE_RESCUE_RULES.visibleItemsPerWave, config.itemCount - waveStart);
    const wavePoints = [];
    for (let offset = 0; offset < waveCount; offset += 1) {
      const index = waveStart + offset;
      let selected = null;
      for (let attempt = 0; attempt < 700 && !selected; attempt += 1) {
        const zone = geometry.spawnZones[(index + attempt) % geometry.spawnZones.length];
        const margin = Math.max(2.2, minimumSpacing * 0.42);
        const x = zone.x + margin + hashUnit(`${houseId}:${jobSerial}:${config.level}:safe-item-x:${attempt}`, index * 431 + attempt) * Math.max(0.1, zone.w - margin * 2);
        const y = zone.y + margin + hashUnit(`${houseId}:${jobSerial}:${config.level}:safe-item-y:${attempt}`, index * 433 + attempt) * Math.max(0.1, zone.h - margin * 2);
        const safe = !houseRescueGeometryBlocked(geometry, x, y, minimumSpacing * 0.42) && wavePoints.every((point) => Math.hypot(point.x - x, point.y - y) >= minimumSpacing);
        if (safe) selected = { x, y };
      }
      if (!selected) {
        const candidates = [];
        for (let y = 7; y <= 89; y += minimumSpacing * 0.72) for (let x = 6; x <= 94; x += minimumSpacing * 0.75) candidates.push({ x, y });
        selected = candidates.find((point) => !houseRescueGeometryBlocked(geometry, point.x, point.y, minimumSpacing * 0.4) && wavePoints.every((other) => Math.hypot(other.x - point.x, other.y - point.y) >= minimumSpacing));
      }
      if (!selected) throw new Error(`House Rescue could not create a safe rubbish wave for ${houseId} at level ${config.level}.`);
      wavePoints.push(selected);
    }
    points.push(...wavePoints);
  }
  const generated = points.map((point, index) => {
    const category = categories[index % categories.length];
    const definitions = ITEMS_BY_CATEGORY[category];
    const offset = Math.floor(hashUnit(`${houseId}:${jobSerial}:${config.level}:${category}`, 17) * definitions.length);
    const definition = definitions[(Math.floor(index / 3) + offset) % definitions.length];
    return Object.freeze({
      id: `rescue-item-${index + 1}`,
      defId: definition.id,
      category,
      label: definition.label,
      icon: definition.icon,
      wave: Math.floor(index / HOUSE_RESCUE_RULES.visibleItemsPerWave),
      x: Number(point.x.toFixed(3)),
      y: Number(point.y.toFixed(3)),
      sorted: false,
    });
  });
  const result = Object.freeze(generated);
  RESCUE_ITEM_CACHE.set(cacheKey, result);
  return result;
}

export function generateHouseRescueDirt({ houseId, jobSerial = 1, level = 1 }) {
  const config = houseRescueLevel(level);
  const cacheKey = `${houseId}:${Math.max(1, Math.floor(Number(jobSerial) || 1))}:${config.level}`;
  if (RESCUE_DIRT_CACHE.has(cacheKey)) return RESCUE_DIRT_CACHE.get(cacheKey);
  const geometry = geometryFor(houseId);
  const reachable = reachableFor(houseId, geometry).points;
  if (!reachable.length) throw new Error(`House Rescue could not find reachable floor space for ${houseId}.`);
  const generated = Array.from({ length: config.dirtCount }, (_, index) => {
    const zone = geometry.floorZones[index % geometry.floorZones.length];
    const pool = reachable.filter((point) => houseRescuePointInZones(point.x, point.y, [zone], 0.6));
    const source = pool.length ? pool : reachable;
    const anchor = source[Math.floor(hashUnit(`${houseId}:${jobSerial}:${config.level}:dirt-anchor`, index * 61) * source.length) % source.length];
    const angle = hashUnit(`${houseId}:${jobSerial}:${config.level}:dirt-angle`, index * 67) * Math.PI * 2;
    const distance = hashUnit(`${houseId}:${jobSerial}:${config.level}:dirt-jitter`, index * 71) * 1.55;
    const jitter = { x: anchor.x + Math.cos(angle) * distance, y: anchor.y + Math.sin(angle) * distance };
    const point = houseRescueGeometryBlocked(geometry, jitter.x, jitter.y, 0.7) ? anchor : jitter;
    let strength = 1 + Math.floor(hashUnit(`${houseId}:${jobSerial}:${config.level}:dirt-strength`, index * 73) * config.maxStainStrength);
    if (index < config.maxStainStrength) strength = index + 1;
    return Object.freeze({ id: `stain-${index + 1}`, x: Number(point.x.toFixed(3)), y: Number(point.y.toFixed(3)), strength, remaining: strength });
  });
  const result = Object.freeze(generated);
  RESCUE_DIRT_CACHE.set(cacheKey, result);
  return result;
}

export function houseRescueCoverage(dirt) {
  let total = 0;
  let removed = 0;
  for (const stain of Array.isArray(dirt) ? dirt : []) {
    const strength = Math.max(1, Math.floor(Number(stain.strength) || 1));
    const remaining = Math.max(0, Math.min(strength, Number(stain.remaining) || 0));
    total += strength;
    removed += strength - remaining;
  }
  return total ? removed / total : 0;
}

export function validateHouseRescueCatalogue() {
  const errors = [];
  let previous = null;
  const generatorProbeLevels = new Set([1, 25, 26, 94, 95, 150, 151, 600, 601, 658, 659, HOUSE_RESCUE_TOTAL_LEVELS]);
  for (let level = 1; level <= HOUSE_RESCUE_TOTAL_LEVELS; level += 1) {
    const config = houseRescueLevel(level);
    if (config.level !== level) errors.push(`Level ${level} identity changed.`);
    if (config.itemCount < 9 || config.itemCount > 30 || config.itemCount % 3) errors.push(`Level ${level} item count is invalid.`);
    if (config.maxStainStrength < 1 || config.maxStainStrength > 5) errors.push(`Level ${level} stain strength is invalid.`);
    if (config.dirtCount < 180 || config.dirtCount > 270) errors.push(`Level ${level} dirt count is invalid.`);
    if (previous && (config.itemCount < previous.itemCount || config.maxStainStrength < previous.maxStainStrength || config.dirtCount < previous.dirtCount || config.itemSpacing >= previous.itemSpacing)) errors.push(`Level ${level} does not increase difficulty.`);
    if (generatorProbeLevels.has(level)) {
      const items = generateHouseRescueItems({ houseId: "house-1", jobSerial: 1, level });
      const dirt = generateHouseRescueDirt({ houseId: "house-1", jobSerial: 1, level });
      if (items.length !== config.itemCount || dirt.length !== config.dirtCount) errors.push(`Level ${level} generation count changed.`);
      if (items.some((item) => ITEMS_BY_CATEGORY[item.category]?.every((definition) => definition.id !== item.defId))) errors.push(`Level ${level} has a category mismatch.`);
    }
    previous = config;
  }
  return Object.freeze({
    valid: errors.length === 0,
    errors,
    totalLevels: HOUSE_RESCUE_TOTAL_LEVELS,
    first: houseRescueLevel(1),
    last: houseRescueLevel(HOUSE_RESCUE_TOTAL_LEVELS),
    categories: Object.keys(HOUSE_RESCUE_CATEGORIES),
    rewardRange: [HOUSE_RESCUE_RULES.baseCoins, HOUSE_RESCUE_RULES.maxCoins],
    score: { correct: HOUSE_RESCUE_RULES.correctScore, wrong: HOUSE_RESCUE_RULES.wrongScore },
  });
}
