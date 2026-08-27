import {
  FISHING_CATCH_IDS,
  FISHING_CONFIG,
  FISHING_STATE_SCHEMA_VERSION,
  MAGNET_FISHING_CONFIG,
  MAGNET_RARITY_ORDER,
  MAGNET_RECOVERY_CATALOG,
  MAGNET_RECOVERY_IDS,
  ORNAMENTAL_FISH_IDS,
} from "../data/fishing.js";

function whole(value, minimum = 0, maximum = Number.MAX_SAFE_INTEGER, fallback = minimum) {
  const number = Math.floor(Number(value));
  return Number.isFinite(number) ? Math.max(minimum, Math.min(maximum, number)) : fallback;
}

function countsFor(ids, value, maximum = Number.MAX_SAFE_INTEGER) {
  return Object.fromEntries(ids.map((id) => [id, whole(value?.[id], 0, maximum)]));
}

export function createFreshFishingState(world) {
  return {
    schemaVersion: FISHING_STATE_SCHEMA_VERSION,
    day: whole(world?.day, 1),
    castsToday: 0,
    caughtToday: 0,
    totalCasts: 0,
    totalCaught: 0,
    currentStreak: 0,
    bestStreak: 0,
    caughtByItem: countsFor(FISHING_CATCH_IDS),
    aquariumByItem: countsFor(ORNAMENTAL_FISH_IDS, null, FISHING_CONFIG.maxAquariumPerSpecies),
    releasedByItem: countsFor(ORNAMENTAL_FISH_IDS),
    magnet: {
      schemaVersion: MAGNET_FISHING_CONFIG.schemaVersion,
      day: whole(world?.day, 1),
      castsToday: 0,
      pullsToday: 0,
      totalCasts: 0,
      totalPulls: 0,
      bestPullStreak: 0,
      currentPullStreak: 0,
      totalCoinsEarned: 0,
      riverItemsRemoved: 0,
      rareFinds: 0,
      treasureFinds: 0,
      legendaryFinds: 0,
      pullsWithoutRare: 0,
      pullsWithoutTreasure: 0,
      lastCatchId: null,
      bestCatchId: null,
      recoveredByItem: countsFor(MAGNET_RECOVERY_IDS),
      recentFinds: [],
    },
  };
}

function normalizeMagnet(value, world) {
  const fresh = createFreshFishingState(world).magnet;
  const source = value && typeof value === "object" ? value : {};
  const day = whole(source.day, 1, world.day, world.day);
  const totalCasts = whole(source.totalCasts);
  const totalPulls = whole(source.totalPulls, 0, totalCasts);
  const castsToday = whole(source.castsToday, 0, Math.min(FISHING_CONFIG.dailyCasts, totalCasts));
  const pullsToday = whole(source.pullsToday, 0, Math.min(castsToday, totalPulls));
  const recoveredByItem = countsFor(MAGNET_RECOVERY_IDS, source.recoveredByItem, totalPulls);
  const recentFinds = (Array.isArray(source.recentFinds) ? source.recentFinds : [])
    .filter((entry) => MAGNET_RECOVERY_CATALOG[entry?.catchId])
    .slice(-Math.min(MAGNET_FISHING_CONFIG.recentFindLimit, totalPulls))
    .map((entry) => ({
      catchId: entry.catchId,
      day: whole(entry.day, 1, world.day),
      coins: whole(entry.coins),
      at: whole(entry.at),
      riverItemId: typeof entry.riverItemId === "string" ? entry.riverItemId : null,
      riverSectionId: MAGNET_FISHING_CONFIG.targetRiverSections.includes(entry.riverSectionId) ? entry.riverSectionId : null,
    }));
  const currentPullStreak = whole(source.currentPullStreak, 0, pullsToday);
  const rareFinds = whole(source.rareFinds, 0, totalPulls);
  const treasureFinds = whole(source.treasureFinds, 0, rareFinds);
  return {
    ...fresh,
    day,
    castsToday,
    pullsToday,
    totalCasts,
    totalPulls,
    bestPullStreak: Math.max(currentPullStreak, whole(source.bestPullStreak, 0, totalPulls)),
    currentPullStreak,
    totalCoinsEarned: totalPulls ? whole(source.totalCoinsEarned) : 0,
    riverItemsRemoved: whole(source.riverItemsRemoved, 0, totalPulls),
    rareFinds,
    treasureFinds,
    legendaryFinds: whole(source.legendaryFinds, 0, treasureFinds),
    pullsWithoutRare: whole(source.pullsWithoutRare, 0, Math.min(totalPulls, MAGNET_FISHING_CONFIG.rarePityPulls)),
    pullsWithoutTreasure: whole(source.pullsWithoutTreasure, 0, Math.min(totalPulls, MAGNET_FISHING_CONFIG.treasurePityPulls)),
    lastCatchId: totalPulls && MAGNET_RECOVERY_CATALOG[source.lastCatchId] ? source.lastCatchId : null,
    bestCatchId: totalPulls && MAGNET_RECOVERY_CATALOG[source.bestCatchId] ? source.bestCatchId : null,
    recoveredByItem,
    recentFinds,
  };
}

export function normalizeFishingState(value, world) {
  const fresh = createFreshFishingState(world);
  if (!value || typeof value !== "object" || Array.isArray(value)) return fresh;
  const totalCasts = whole(value.totalCasts);
  const totalCaught = whole(value.totalCaught, 0, totalCasts);
  const castsToday = whole(value.castsToday, 0, Math.min(FISHING_CONFIG.dailyCasts, totalCasts));
  const caughtToday = whole(value.caughtToday, 0, Math.min(castsToday, totalCaught));
  const currentStreak = whole(value.currentStreak, 0, caughtToday);
  return {
    schemaVersion: FISHING_STATE_SCHEMA_VERSION,
    day: whole(value.day, 1, world.day, world.day),
    castsToday,
    caughtToday,
    totalCasts,
    totalCaught,
    currentStreak,
    bestStreak: Math.max(currentStreak, whole(value.bestStreak, 0, totalCaught)),
    caughtByItem: countsFor(FISHING_CATCH_IDS, value.caughtByItem, totalCaught),
    aquariumByItem: countsFor(ORNAMENTAL_FISH_IDS, value.aquariumByItem, FISHING_CONFIG.maxAquariumPerSpecies),
    releasedByItem: countsFor(ORNAMENTAL_FISH_IDS, value.releasedByItem),
    magnet: normalizeMagnet(value.magnet, world),
  };
}

export function projectLegacyFishing(fishing, magnetFishing, world) {
  return normalizeFishingState({ ...fishing, magnet: magnetFishing }, world);
}

export function validateFishingState(value, world) {
  const errors = [];
  if (!value || typeof value !== "object" || Array.isArray(value)) return { ok: false, errors: ["Fishing state is missing."] };
  if (value.schemaVersion !== FISHING_STATE_SCHEMA_VERSION) errors.push("Fishing state schema version is unsupported.");
  if (!Number.isInteger(value.day) || value.day < 1 || value.day > world.day) errors.push("Fishing progress day is invalid.");
  for (const key of ["castsToday", "caughtToday", "totalCasts", "totalCaught", "currentStreak", "bestStreak"]) if (!Number.isInteger(value[key]) || value[key] < 0) errors.push(`Fishing ${key} is invalid.`);
  if (value.castsToday > FISHING_CONFIG.dailyCasts || value.caughtToday > value.castsToday || value.totalCaught > value.totalCasts || value.currentStreak > value.caughtToday || value.bestStreak < value.currentStreak) errors.push("Fishing progress counters are inconsistent.");
  for (const id of FISHING_CATCH_IDS) if (!Number.isInteger(value.caughtByItem?.[id]) || value.caughtByItem[id] < 0) errors.push(`${id} catch count is invalid.`);
  for (const id of ORNAMENTAL_FISH_IDS) {
    if (!Number.isInteger(value.aquariumByItem?.[id]) || value.aquariumByItem[id] < 0 || value.aquariumByItem[id] > FISHING_CONFIG.maxAquariumPerSpecies) errors.push(`${id} aquarium count is invalid.`);
    if (!Number.isInteger(value.releasedByItem?.[id]) || value.releasedByItem[id] < 0) errors.push(`${id} release count is invalid.`);
  }
  const magnet = value.magnet;
  if (!magnet || magnet.schemaVersion !== MAGNET_FISHING_CONFIG.schemaVersion) errors.push("Magnet-fishing state is invalid.");
  else {
    if (!Number.isInteger(magnet.day) || magnet.day < 1 || magnet.day > world.day) errors.push("Magnet-fishing progress day is invalid.");
    for (const key of ["castsToday", "pullsToday", "totalCasts", "totalPulls", "bestPullStreak", "currentPullStreak", "totalCoinsEarned", "riverItemsRemoved", "rareFinds", "treasureFinds", "legendaryFinds", "pullsWithoutRare", "pullsWithoutTreasure"]) if (!Number.isInteger(magnet[key]) || magnet[key] < 0) errors.push(`Magnet-fishing ${key} is invalid.`);
    if (magnet.castsToday > MAGNET_FISHING_CONFIG.dailyCasts || magnet.pullsToday > magnet.castsToday || magnet.totalPulls > magnet.totalCasts || magnet.currentPullStreak > magnet.pullsToday || magnet.bestPullStreak < magnet.currentPullStreak || magnet.treasureFinds > magnet.rareFinds || magnet.legendaryFinds > magnet.treasureFinds) errors.push("Magnet-fishing counters are inconsistent.");
    for (const id of MAGNET_RECOVERY_IDS) if (!Number.isInteger(magnet.recoveredByItem?.[id]) || magnet.recoveredByItem[id] < 0) errors.push(`${id} recovery count is invalid.`);
    if (!Array.isArray(magnet.recentFinds) || magnet.recentFinds.length > MAGNET_FISHING_CONFIG.recentFindLimit || magnet.recentFinds.some((entry) => !MAGNET_RECOVERY_CATALOG[entry.catchId] || (entry.riverItemId !== null && typeof entry.riverItemId !== "string") || (entry.riverSectionId !== null && !MAGNET_FISHING_CONFIG.targetRiverSections.includes(entry.riverSectionId)))) errors.push("Recent magnet finds are invalid.");
    if (magnet.lastCatchId !== null && !MAGNET_RECOVERY_CATALOG[magnet.lastCatchId]) errors.push("Last magnet find is invalid.");
    if (magnet.bestCatchId !== null && !MAGNET_RECOVERY_CATALOG[magnet.bestCatchId]) errors.push("Best magnet find is invalid.");
    if (magnet.bestCatchId && MAGNET_RARITY_ORDER[MAGNET_RECOVERY_CATALOG[magnet.bestCatchId].rarity] < 0) errors.push("Best magnet rarity is invalid.");
  }
  return { ok: errors.length === 0, errors };
}
