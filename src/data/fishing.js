import { ITEM_CATALOG } from "./items.js";

export const FISHING_STATE_SCHEMA_VERSION = 2;

export const FISHING_CONFIG = Object.freeze({
  dailyCasts: 5,
  castAnimationMs: 620,
  biteDelayMinMs: 850,
  biteDelayMaxMs: 1750,
  biteWindowMs: 1800,
  reelAnimationMs: 760,
  excellentWindowFraction: 0.2,
  maxInventoryPerFish: 99,
  maxAquariumPerSpecies: 99,
});

export const TARGETING_CONFIG = Object.freeze({
  zonesPerSession: 3,
  zoneRadiusMin: 76,
  zoneRadiusMax: 104,
  emptyWaitMinMs: 1050,
  emptyWaitMaxMs: 1900,
  waterArea: Object.freeze({ x: 120, y: 135, width: 1040, height: 405 }),
});

export const FISHING_SPOTS = Object.freeze([
  Object.freeze({
    id: "fishing-commons", pondId: "commons-pond", type: "fishing", title: "Commons Pond Fishing", shortTitle: "Commons Pond", icon: "🎣",
    world: Object.freeze({ x: 1270, y: 1115, radius: 110 }), waterBody: "Willow Commons Pond",
    description: "A calm beginner-friendly pond with plenty of minnows and an occasional trout.",
    catchTable: Object.freeze([Object.freeze({ itemId: "river-minnows", weight: 78 }), Object.freeze({ itemId: "river-trout", weight: 22 })]),
  }),
  Object.freeze({
    id: "fishing-reedbank", pondId: "reedbank-pond", type: "fishing", title: "Reedbank Ornamental Pond Fishing", shortTitle: "Reedbank Pond", icon: "🎣",
    world: Object.freeze({ x: 2220, y: 2470, radius: 125 }), waterBody: "Reedbank Wetland",
    description: "Seven species live here, including rare ornamental fish found nowhere else in town.",
    catchTable: Object.freeze([
      Object.freeze({ itemId: "reedbank-roach", weight: 28 }), Object.freeze({ itemId: "lily-perch", weight: 21 }),
      Object.freeze({ itemId: "golden-tench", weight: 14 }), Object.freeze({ itemId: "pond-goldfish", weight: 16 }),
      Object.freeze({ itemId: "reedbank-koi", weight: 10 }), Object.freeze({ itemId: "pond-angelfish", weight: 7 }),
      Object.freeze({ itemId: "oranda-goldfish", weight: 4 }),
    ]),
  }),
  Object.freeze({
    id: "fishing-harbour", type: "fishing", title: "South Harbour Fishing", shortTitle: "South Harbour", icon: "🎣",
    world: Object.freeze({ x: 3645, y: 2585, radius: 115 }), waterBody: "South Harbour",
    description: "A saltwater-facing pier where sardines are common and river fish sometimes reach the estuary.",
    catchTable: Object.freeze([
      Object.freeze({ itemId: "fresh-sardines", weight: 70 }), Object.freeze({ itemId: "river-minnows", weight: 15 }),
      Object.freeze({ itemId: "river-trout", weight: 15 }),
    ]),
  }),
]);

export const FISHING_SPOT_BY_ID = Object.freeze(Object.fromEntries(FISHING_SPOTS.map((spot) => [spot.id, spot])));

export const REEDBANK_EDIBLE_FISH_IDS = Object.freeze(["reedbank-roach", "lily-perch", "golden-tench"]);
export const ORNAMENTAL_FISH_IDS = Object.freeze(["pond-goldfish", "reedbank-koi", "pond-angelfish", "oranda-goldfish"]);
export const FISHING_CATCH_IDS = Object.freeze([...new Set(FISHING_SPOTS.flatMap((spot) => spot.catchTable.map((entry) => entry.itemId)))]);

export const FISH_RARITY = Object.freeze({
  "river-minnows": "common", "fresh-sardines": "common", "river-trout": "rare",
  "reedbank-roach": "common", "lily-perch": "uncommon", "golden-tench": "rare",
  "pond-goldfish": "uncommon", "reedbank-koi": "rare", "pond-angelfish": "rare", "oranda-goldfish": "legendary",
});

export const MAGNET_FISHING_CONFIG = Object.freeze({
  schemaVersion: 2,
  dailyCasts: 5,
  castAnimationMs: 920,
  sinkAnimationMs: 720,
  settleAnimationMs: 360,
  reelAnimationMs: 980,
  rarePityPulls: 12,
  treasurePityPulls: 40,
  recentFindLimit: 12,
});

export const MAGNET_FISHING_SPOT = Object.freeze({
  id: "magnet-mill-bridge", type: "magnet-fishing", title: "Mill Bridge Magnet Fishing", shortTitle: "Mill Bridge", icon: "🧲",
  bridgeId: "bridge-02", world: Object.freeze({ x: 2570, y: 950, radius: 112 }), waterBody: "Mill Reach",
  description: "Cast a recovery magnet from Mill Bridge, let it settle, then pull it back for a named find and coin reward.",
});

const magnetRows = [
  ["rusty-can", "Rusty Food Can", "🥫", "common", 28, 12, "A corroded can removed from the riverbed."],
  ["old-bolt", "Old Iron Bolt", "🔩", "common", 23, 18, "A heavy iron bolt from long-forgotten repairs."],
  ["bent-cutlery", "Bent Cutlery", "🍴", "common", 18, 22, "Discarded metal cutlery caught beneath the bridge."],
  ["lost-key", "Lost Brass Key", "🔑", "uncommon", 13, 40, "A weathered key with no known lock."],
  ["bicycle-bell", "Vintage Bicycle Bell", "🔔", "uncommon", 9, 65, "A little bell that still gives a cheerful ring."],
  ["brass-locket", "Engraved Brass Locket", "📿", "rare", 5, 140, "A carefully engraved keepsake recovered from the silt."],
  ["sealed-coin-tin", "Sealed Coin Tin", "🪙", "treasure", 3, 350, "A watertight tin containing old Willowmere coins."],
  ["willowmere-medallion", "Willowmere River Medallion", "🏅", "legendary", 1, 800, "A legendary civic medallion, polished clean by the current."],
];

export const MAGNET_RECOVERY_CATALOG = Object.freeze(Object.fromEntries(magnetRows.map(([id, name, icon, rarity, weight, coins, description]) => [id, Object.freeze({ id, name, icon, rarity, weight, coins, description })])));
export const MAGNET_RECOVERY_IDS = Object.freeze(Object.keys(MAGNET_RECOVERY_CATALOG));
export const MAGNET_RARITY_ORDER = Object.freeze({ common: 0, uncommon: 1, rare: 2, treasure: 3, legendary: 4 });

export function pointInWater(point) {
  const { x, y, width, height } = TARGETING_CONFIG.waterArea;
  return Number.isFinite(point?.x) && Number.isFinite(point?.y) && point.x >= x && point.x <= x + width && point.y >= y && point.y <= y + height;
}

export function generateHiddenZones(random = Math.random) {
  const { waterArea: area } = TARGETING_CONFIG;
  const zones = [];
  for (let index = 0; index < TARGETING_CONFIG.zonesPerSession; index += 1) {
    let candidate;
    for (let attempt = 0; attempt < 40; attempt += 1) {
      const radius = TARGETING_CONFIG.zoneRadiusMin + random() * (TARGETING_CONFIG.zoneRadiusMax - TARGETING_CONFIG.zoneRadiusMin);
      const margin = radius + 8;
      const x = area.x + margin + random() * Math.max(1, area.width - margin * 2);
      const y = area.y + margin + random() * Math.max(1, area.height - margin * 2);
      candidate = { id: `hidden-zone-${index + 1}`, x, y, radius };
      if (!zones.some((zone) => Math.hypot(zone.x - x, zone.y - y) < (zone.radius + radius) * 0.72)) break;
    }
    zones.push(Object.freeze(candidate));
  }
  return zones;
}

export function hiddenZoneAt(zones, point) {
  return zones.find((zone) => Math.hypot(point.x - zone.x, point.y - zone.y) <= zone.radius) || null;
}

export function chooseFishingCatch(spot, quality, random = Math.random) {
  const adjusted = spot.catchTable.map((entry) => {
    const rarity = FISH_RARITY[entry.itemId];
    const legendary = rarity === "legendary";
    const premium = entry.itemId === "river-trout" || rarity === "rare";
    const uncommon = rarity === "uncommon";
    const common = entry.itemId === "river-minnows" || rarity === "common";
    const multiplier = legendary ? 0.3 + quality * 2.15 : premium ? 0.65 + quality * 1.45 : uncommon ? 0.9 + quality * 0.35 : common ? 1.18 - quality * 0.3 : 1;
    return { ...entry, adjustedWeight: entry.weight * multiplier };
  });
  const total = adjusted.reduce((sum, entry) => sum + entry.adjustedWeight, 0);
  let roll = random() * total;
  for (const entry of adjusted) {
    roll -= entry.adjustedWeight;
    if (roll <= 0) return entry.itemId;
  }
  return adjusted.at(-1)?.itemId || null;
}

export function chooseMagnetRecovery(progress, random = Math.random, forcedId = null) {
  if (forcedId && MAGNET_RECOVERY_CATALOG[forcedId]) return MAGNET_RECOVERY_CATALOG[forcedId];
  const treasurePity = progress.pullsWithoutTreasure >= MAGNET_FISHING_CONFIG.treasurePityPulls - 1;
  const rarePity = progress.pullsWithoutRare >= MAGNET_FISHING_CONFIG.rarePityPulls - 1;
  let pool = Object.values(MAGNET_RECOVERY_CATALOG);
  if (treasurePity) pool = pool.filter((item) => MAGNET_RARITY_ORDER[item.rarity] >= MAGNET_RARITY_ORDER.treasure);
  else if (rarePity) pool = pool.filter((item) => MAGNET_RARITY_ORDER[item.rarity] >= MAGNET_RARITY_ORDER.rare);
  const total = pool.reduce((sum, item) => sum + item.weight, 0);
  let roll = random() * total;
  for (const item of pool) {
    roll -= item.weight;
    if (roll <= 0) return item;
  }
  return pool.at(-1);
}

export function fishingItem(itemId) {
  return ITEM_CATALOG[itemId] ? { ...ITEM_CATALOG[itemId], rarity: FISH_RARITY[itemId] || "common" } : null;
}
