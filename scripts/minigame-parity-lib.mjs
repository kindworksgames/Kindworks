import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import {
  CAFE_APPLIANCES, CAFE_CHAPTERS, CAFE_CONFIG, CAFE_INGREDIENTS, CAFE_LEVELS, CAFE_RECIPES,
  cafeFirstClearCoins,
} from "../src/data/cafe.js";
import {
  MORNING_MUG_APPLIANCES, MORNING_MUG_CHAPTERS, MORNING_MUG_CONFIG, MORNING_MUG_INGREDIENTS,
  MORNING_MUG_LEVELS, MORNING_MUG_RECIPES,
  morningMugFirstClearCoins,
} from "../src/data/morningMug.js";
import {
  RIVERSIDE_KITCHEN_APPLIANCES, RIVERSIDE_KITCHEN_CHAPTERS, RIVERSIDE_KITCHEN_CONFIG,
  RIVERSIDE_KITCHEN_INGREDIENTS, RIVERSIDE_KITCHEN_LEVELS, RIVERSIDE_KITCHEN_RECIPES,
  riversideKitchenFirstClearCoins,
} from "../src/data/riversideKitchen.js";
import {
  BAKERY_APPLIANCES, BAKERY_CHAPTERS, BAKERY_CONFIG, BAKERY_FAMILY_RECIPES,
  BAKERY_INGREDIENTS, BAKERY_LEVELS, BAKERY_RECIPES,
  bakeryFirstClearCoins,
} from "../src/data/bakery.js";
import * as scoops from "../src/data/southShoreScoops.js";
import {
  BEACH_TOTAL_LEVELS, beachDifficulty, generateBeachLevel, validateBeachCatalogue,
} from "../src/data/beachCleanup.js";
import {
  HOUSE_RESCUE_CATEGORIES, HOUSE_RESCUE_ITEMS, HOUSE_RESCUE_TOTAL_LEVELS, houseRescueLevel,
  validateHouseRescueCatalogue,
} from "../src/data/houseRescue.js";
import {
  POWERWASH_MINIMUM_CLEAN_PERCENT, POWERWASH_NOZZLES, POWERWASH_REWARD_CAP,
  POWERWASH_SOAP_TOOL, POWERWASH_TOTAL_LEVELS, calculatePowerwashNativeReward,
  powerwashDifficulty, validatePowerwashCatalogue,
} from "../src/data/playgroundPowerwash.js";
import { validateWasteCatalogue } from "../src/data/wasteCollection.js";
import { validateLawnCatalogue } from "../src/data/lawnCare.js";
import { validateRiverCatalogue } from "../src/data/riverClearout.js";
import {
  HARBOUR_GENERAL, HARBOUR_GENERAL_CATALOG, HARBOUR_GENERAL_CONFIG, validateHarbourGeneralCatalogue,
} from "../src/data/harbourGeneral.js";
import {
  FISHING_CONFIG, FISHING_SPOTS, FISH_RARITY, MAGNET_FISHING_CONFIG, MAGNET_FISHING_SPOT,
  MAGNET_RARITY_ORDER, MAGNET_RECOVERY_CATALOG, MAGNET_TARGETING_CONFIG, TARGETING_CONFIG,
  chooseFishingCatch, chooseMagnetRecovery,
} from "../src/data/fishing.js";
import { projectRoot, protectedSourcePath } from "./parity-audit-lib.mjs";

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  return value;
}

function hash(value) {
  return createHash("sha256").update(JSON.stringify(canonical(plain(value)))).digest("hex");
}

function sourceSlice(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  if (start < 0 || end < 0) throw new Error(`Unable to extract protected source between ${startMarker} and ${endMarker}.`);
  return source.slice(start, end);
}

function evaluateSlice(source, startMarker, endMarker, names, globals = {}) {
  const context = vm.createContext({ ...globals });
  const expose = names.map((name) => `${JSON.stringify(name)}:${name}`).join(",");
  vm.runInContext(`${sourceSlice(source, startMarker, endMarker)}\n;globalThis.__parity={${expose}};`, context, {
    filename: "protected-kindworks-source.js",
    timeout: 30_000,
  });
  return plain(context.__parity);
}

function normalizeBakeryCatalog(catalog) {
  return Object.fromEntries(Object.entries(plain(catalog)).map(([id, entry]) => {
    const { id: _id, kind: _kind, ...legacyShape } = entry;
    return [id, legacyShape];
  }));
}

function normalizeHouseCategories(categories) {
  return Object.fromEntries(Object.entries(plain(categories)).map(([id, entry]) => [id, {
    label: entry.label, icon: entry.icon, color: entry.color,
  }]));
}

function without(object, keys) {
  return Object.fromEntries(Object.entries(plain(object)).filter(([key]) => !keys.includes(key)));
}

function compare(checks, game, subject, legacy, phaser, count = 1) {
  const legacyValue = plain(legacy);
  const phaserValue = plain(phaser);
  const legacyHash = hash(legacyValue);
  const phaserHash = hash(phaserValue);
  checks.push({ game, subject, ok: legacyHash === phaserHash, count, legacyHash, phaserHash });
}

function payload(source, name) {
  const match = source.match(new RegExp(`const\\s+${name}\\s*=\\s*"([^"]+)"`));
  if (!match) throw new Error(`Protected source is missing ${name}.`);
  return Buffer.from(match[1], "base64").toString("utf8");
}

function objectFreezeValue(source, name) {
  const marker = new RegExp(`\\b(?:const|let)\\s+${name}\\s*=\\s*Object\\.freeze\\(`, "g");
  const match = marker.exec(source);
  if (!match) throw new Error(`Protected source is missing ${name}.`);
  const start = match.index + match[0].length;
  let depth = 1;
  let quote = null;
  let escaped = false;
  for (let index = start; index < source.length; index += 1) {
    const character = source[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === quote) quote = null;
      continue;
    }
    if (["\"", "'", "`"].includes(character)) { quote = character; continue; }
    if (character === "(") depth += 1;
    else if (character === ")") {
      depth -= 1;
      if (depth === 0) return plain(vm.runInNewContext(`Object.freeze(${source.slice(start, index)})`, {}, { timeout: 5_000 }));
    }
  }
  throw new Error(`Protected source has an unterminated ${name}.`);
}

function normalizeFishingSpot(spot) {
  return {
    id: spot.id,
    pondId: spot.pondId || null,
    type: spot.type,
    title: spot.title,
    icon: spot.icon,
    waterBody: spot.waterBody,
    catchTable: spot.catchTable,
  };
}

function normalizeMagnetSpot(spot) {
  return {
    id: spot.id, type: spot.type, title: spot.title, icon: spot.icon,
    bridgeId: spot.bridgeId, waterBody: spot.waterBody,
  };
}

function normalizeHarbourProduct(item) {
  return {
    id: item.id, name: item.name, icon: item.icon, category: item.category,
    wholesale: item.wholesale, price: item.price, baseDemand: item.baseDemand,
    weather: item.weather, wardrobe: item.wardrobe || null, description: item.description,
  };
}

function seededRandom(seedValue) {
  let seed = seedValue >>> 0;
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function legacyFishingChoice(spot, quality, random) {
  const adjusted = spot.catchTable.map((entry) => {
    const rarity = FISH_RARITY[entry.itemId];
    const legendary = rarity === "legendary";
    const premium = entry.itemId === "river-trout" || rarity === "rare";
    const uncommon = rarity === "uncommon";
    const common = entry.itemId === "river-minnows" || rarity === "common";
    const multiplier = legendary ? 0.3 + quality * 2.15 : premium ? 0.65 + quality * 1.45 : uncommon ? 0.9 + quality * 0.35 : common ? 1.18 - quality * 0.3 : 1;
    return { ...entry, adjustedWeight: entry.weight * multiplier };
  });
  let roll = random() * adjusted.reduce((sum, entry) => sum + entry.adjustedWeight, 0);
  for (const entry of adjusted) { roll -= entry.adjustedWeight; if (roll <= 0) return entry.itemId; }
  return adjusted.at(-1)?.itemId || null;
}

function legacyMagnetChoice(progress, random, catalog) {
  const treasurePity = progress.pullsWithoutTreasure >= MAGNET_FISHING_CONFIG.treasurePityPulls - 1;
  const rarePity = progress.pullsWithoutRare >= MAGNET_FISHING_CONFIG.rarePityPulls - 1;
  let pool = Object.values(catalog);
  if (treasurePity) pool = pool.filter((item) => MAGNET_RARITY_ORDER[item.rarity] >= MAGNET_RARITY_ORDER.treasure);
  else if (rarePity) pool = pool.filter((item) => MAGNET_RARITY_ORDER[item.rarity] >= MAGNET_RARITY_ORDER.rare);
  let roll = random() * pool.reduce((sum, item) => sum + item.weight, 0);
  for (const item of pool) { roll -= item.weight; if (roll <= 0) return item.id; }
  return pool.at(-1)?.id || "rusty-can";
}

function legacyRestaurants(source) {
  return evaluateSlice(source, "let CAFE_CONFIG=", "function freshCafeProgress", [
    "CAFE_CONFIG", "CAFE_INGREDIENTS", "CAFE_APPLIANCES", "CAFE_RECIPES", "CAFE_CHAPTERS", "CAFE_LEVELS",
    "MUG_CONFIG", "MUG_INGREDIENTS", "MUG_APPLIANCES", "MUG_RECIPES", "MUG_CHAPTERS", "MUG_LEVELS",
    "RIVERSIDE_CONFIG", "RIVERSIDE_INGREDIENTS", "RIVERSIDE_APPLIANCES", "RIVERSIDE_RECIPES", "RIVERSIDE_CHAPTERS", "RIVERSIDE_LEVELS",
  ]);
}

function legacyBakery(source) {
  return evaluateSlice(source, "const BAKERY_CONFIG=", "function freshBakeryProgress", [
    "BAKERY_CONFIG", "BAKERY_INGREDIENTS", "BAKERY_APPLIANCES", "BAKERY_RECIPES",
    "BAKERY_FAMILY_RECIPES", "BAKERY_CHAPTERS", "BAKERY_LEVELS",
  ]);
}

function legacyScoops(source) {
  return evaluateSlice(source, "const SCOOPS_CONFIG=", "function freshScoopsProgress", [
    "SCOOPS_CONFIG", "SCOOPS_REWARD_CONFIG", "SCOOPS_RESTORATION_MILESTONES", "SCOOPS_PARTS",
    "SCOOPS_FLAVOURS", "SCOOPS_SAUCES", "SCOOPS_TOPPINGS", "SCOOPS_ALL_FAMILIES",
    "SCOOPS_CHAPTER_THEMES", "SCOOPS_THEME_FAMILIES", "SCOOPS_TOUR_NAMES", "SCOOPS_CHAPTERS",
    "SCOOPS_FAMILY_RANK", "SCOOPS_FAMILY_UNLOCK", "SCOOPS_CUSTOMER_NAMES", "SCOOPS_LEVELS",
  ]);
}

function legacyHouseRescue(source) {
  return evaluateSlice(source, "const HOUSE_RESCUE_CONFIG=", "let houseRescueHomes=", [
    "HOUSE_RESCUE_CONFIG", "HOUSE_RESCUE_LEVELS", "HOUSE_RESCUE_CATEGORIES", "HOUSE_RESCUE_ITEMS",
  ]);
}

function legacyBeach(source) {
  const embedded = payload(source, "EMBEDDED_BEACH_CLEANUP_HTML_B64");
  const context = vm.createContext({
    TOTAL_LEVELS: 750,
    TILE: { BOARDWALK: 0, SAND: 1, RAKED: 2, UMBRELLA: 3, CHAIR: 4, TIDE: 5 },
  });
  vm.runInContext(`${sourceSlice(embedded, "function mulberry32", "function currentHeldDir")}
    ;globalThis.__parity={
      difficulties:Array.from({length:TOTAL_LEVELS},(_,index)=>difficultyForLevel(index+1)),
      levels:Array.from({length:TOTAL_LEVELS},(_,index)=>generateLevel(index+1))
    };`, context, { filename: "protected-beach-source.js", timeout: 30_000 });
  return plain(context.__parity);
}

function legacyPowerwash(source) {
  const embedded = payload(source, "EMBEDDED_POWERWASH_HTML_B64");
  const context = vm.createContext({ performance: { now: () => 0 } });
  vm.runInContext(`${sourceSlice(embedded, "const NOZZLES=", "function mobileBoardFocusMode")}
    ;globalThis.__parity={NOZZLES,SOAP_TOOL,difficulties:Array.from({length:750},(_,index)=>difficulty(index+1))};`,
  context, { filename: "protected-powerwash-source.js", timeout: 30_000 });
  return plain(context.__parity);
}

function validatorCheck(checks, game, result, count) {
  const issues = result.issues || result.errors || [];
  checks.push({ game, subject: "complete-catalogue-validation", ok: result.ok === true || result.valid === true, count, issues });
}

export async function runMinigameParityAudit() {
  const source = await readFile(protectedSourcePath, "utf8");
  const checks = [];

  const restaurants = legacyRestaurants(source);
  const restaurantPairs = [
    ["corner-cafe", "CAFE", [CAFE_CONFIG, CAFE_INGREDIENTS, CAFE_APPLIANCES, CAFE_RECIPES, CAFE_CHAPTERS, CAFE_LEVELS]],
    ["morning-mug", "MUG", [MORNING_MUG_CONFIG, MORNING_MUG_INGREDIENTS, MORNING_MUG_APPLIANCES, MORNING_MUG_RECIPES, MORNING_MUG_CHAPTERS, MORNING_MUG_LEVELS]],
    ["riverside-kitchen", "RIVERSIDE", [RIVERSIDE_KITCHEN_CONFIG, RIVERSIDE_KITCHEN_INGREDIENTS, RIVERSIDE_KITCHEN_APPLIANCES, RIVERSIDE_KITCHEN_RECIPES, RIVERSIDE_KITCHEN_CHAPTERS, RIVERSIDE_KITCHEN_LEVELS]],
  ];
  for (const [game, prefix, phaserValues] of restaurantPairs) {
    ["CONFIG", "INGREDIENTS", "APPLIANCES", "RECIPES", "CHAPTERS", "LEVELS"].forEach((suffix, index) => {
      compare(checks, game, suffix.toLowerCase(), restaurants[`${prefix}_${suffix}`], phaserValues[index], suffix === "LEVELS" ? phaserValues[index].length : 1);
    });
  }
  const cafeRewardCases = Array.from({ length: 150 }, (_, index) => [index + 1, 0, 1, 2, 3].slice(1).map((stars) => CAFE_CONFIG.firstClearBaseCoins + (index + 1) * CAFE_CONFIG.firstClearLevelCoins + stars * CAFE_CONFIG.starCoins));
  compare(checks, "corner-cafe", "first-clear-rewards", cafeRewardCases, Array.from({ length: 150 }, (_, index) => [0, 1, 2, 3].map((stars) => cafeFirstClearCoins(index + 1, stars))), 600);
  const mugRewardCases = Array.from({ length: 150 }, (_, index) => [0, 1, 2, 3].map((stars) => Math.min(MORNING_MUG_CONFIG.firstClearMaxCoins, MORNING_MUG_CONFIG.firstClearBaseCoins + (index + 1) * MORNING_MUG_CONFIG.firstClearLevelCoins + stars * MORNING_MUG_CONFIG.starCoins)));
  compare(checks, "morning-mug", "first-clear-rewards", mugRewardCases, Array.from({ length: 150 }, (_, index) => [0, 1, 2, 3].map((stars) => morningMugFirstClearCoins(index + 1, stars))), 600);
  const riversideRewardCases = Array.from({ length: 150 }, (_, index) => [0, 1, 2, 3].map((stars) => Math.min(RIVERSIDE_KITCHEN_CONFIG.firstClearMaxCoins, RIVERSIDE_KITCHEN_CONFIG.firstClearBaseCoins + (index + 1) * RIVERSIDE_KITCHEN_CONFIG.firstClearLevelCoins + stars * RIVERSIDE_KITCHEN_CONFIG.starCoins)));
  compare(checks, "riverside-kitchen", "first-clear-rewards", riversideRewardCases, Array.from({ length: 150 }, (_, index) => [0, 1, 2, 3].map((stars) => riversideKitchenFirstClearCoins(index + 1, stars))), 600);

  const bakery = legacyBakery(source);
  compare(checks, "little-bakery", "config", bakery.BAKERY_CONFIG, BAKERY_CONFIG);
  compare(checks, "little-bakery", "ingredients", bakery.BAKERY_INGREDIENTS, normalizeBakeryCatalog(BAKERY_INGREDIENTS));
  compare(checks, "little-bakery", "appliances", bakery.BAKERY_APPLIANCES, normalizeBakeryCatalog(BAKERY_APPLIANCES));
  compare(checks, "little-bakery", "recipes", bakery.BAKERY_RECIPES, BAKERY_RECIPES);
  compare(checks, "little-bakery", "families", bakery.BAKERY_FAMILY_RECIPES, BAKERY_FAMILY_RECIPES);
  compare(checks, "little-bakery", "chapters", bakery.BAKERY_CHAPTERS, BAKERY_CHAPTERS);
  compare(checks, "little-bakery", "levels", bakery.BAKERY_LEVELS, BAKERY_LEVELS, BAKERY_LEVELS.length);
  const bakeryRewards = Array.from({ length: 150 }, (_, index) => [0, 1, 2, 3].map((stars) => {
    const progress = Math.round(index * BAKERY_CONFIG.firstClearCampaignCoins / (BAKERY_CONFIG.levelCount - 1));
    return Math.min(BAKERY_CONFIG.firstClearMaxCoins, BAKERY_CONFIG.firstClearBaseCoins + progress + stars * BAKERY_CONFIG.starCoins);
  }));
  compare(checks, "little-bakery", "first-clear-rewards", bakeryRewards, Array.from({ length: 150 }, (_, index) => [0, 1, 2, 3].map((stars) => bakeryFirstClearCoins(index + 1, stars))), 600);

  const legacyIceCream = legacyScoops(source);
  const scoopPairs = [
    ["config", legacyIceCream.SCOOPS_CONFIG, without(scoops.SOUTH_SHORE_SCOOPS_CONFIG, ["maxBuildParts"])],
    ["rewards", legacyIceCream.SCOOPS_REWARD_CONFIG, scoops.SOUTH_SHORE_SCOOPS_REWARD_CONFIG],
    ["restoration", legacyIceCream.SCOOPS_RESTORATION_MILESTONES, scoops.SOUTH_SHORE_SCOOPS_RESTORATION_MILESTONES],
    ["parts", legacyIceCream.SCOOPS_PARTS, scoops.SOUTH_SHORE_SCOOPS_PARTS],
    ["flavours", legacyIceCream.SCOOPS_FLAVOURS, scoops.SOUTH_SHORE_SCOOPS_FLAVOURS],
    ["sauces", legacyIceCream.SCOOPS_SAUCES, scoops.SOUTH_SHORE_SCOOPS_SAUCES],
    ["toppings", legacyIceCream.SCOOPS_TOPPINGS, scoops.SOUTH_SHORE_SCOOPS_TOPPINGS],
    ["families", legacyIceCream.SCOOPS_ALL_FAMILIES, scoops.SOUTH_SHORE_SCOOPS_ALL_FAMILIES],
    ["chapter-themes", legacyIceCream.SCOOPS_CHAPTER_THEMES, scoops.SOUTH_SHORE_SCOOPS_CHAPTER_THEMES],
    ["theme-families", legacyIceCream.SCOOPS_THEME_FAMILIES, scoops.SOUTH_SHORE_SCOOPS_THEME_FAMILIES],
    ["tour-names", legacyIceCream.SCOOPS_TOUR_NAMES, scoops.SOUTH_SHORE_SCOOPS_TOUR_NAMES],
    ["chapters", legacyIceCream.SCOOPS_CHAPTERS, scoops.SOUTH_SHORE_SCOOPS_CHAPTERS],
    ["family-rank", legacyIceCream.SCOOPS_FAMILY_RANK, scoops.SOUTH_SHORE_SCOOPS_FAMILY_RANK],
    ["family-unlock", legacyIceCream.SCOOPS_FAMILY_UNLOCK, scoops.SOUTH_SHORE_SCOOPS_FAMILY_UNLOCK],
    ["customers", legacyIceCream.SCOOPS_CUSTOMER_NAMES, scoops.SOUTH_SHORE_SCOOPS_CUSTOMER_NAMES],
    ["levels", legacyIceCream.SCOOPS_LEVELS, scoops.SOUTH_SHORE_SCOOPS_LEVELS, scoops.SOUTH_SHORE_SCOOPS_LEVELS.length],
  ];
  for (const [subject, legacy, phaser, count = 1] of scoopPairs) compare(checks, "south-shore-scoops", subject, legacy, phaser, count);
  const scoopsRewards = Array.from({ length: 750 }, (_, index) => Array.from({ length: 101 }, (_unused, accuracy) => {
    if (accuracy < legacyIceCream.SCOOPS_CONFIG.passingAccuracy) return 0;
    const base = legacyIceCream.SCOOPS_REWARD_CONFIG.minimum + Math.round((accuracy - legacyIceCream.SCOOPS_CONFIG.passingAccuracy) * legacyIceCream.SCOOPS_REWARD_CONFIG.accuracyStep);
    const levelBonus = Math.min(legacyIceCream.SCOOPS_REWARD_CONFIG.maxLevelBonus, Math.floor(index / legacyIceCream.SCOOPS_REWARD_CONFIG.levelStepEvery) * legacyIceCream.SCOOPS_REWARD_CONFIG.levelStepCoins);
    return Math.min(legacyIceCream.SCOOPS_REWARD_CONFIG.maximum, base + levelBonus);
  }));
  compare(checks, "south-shore-scoops", "first-clear-rewards", scoopsRewards, Array.from({ length: 750 }, (_, index) => Array.from({ length: 101 }, (_unused, accuracy) => scoops.southShoreScoopsFirstClearCoins(accuracy, index + 1))), 75_750);

  const beach = legacyBeach(source);
  const phaserBeachDifficulty = [];
  const phaserBeachLevels = [];
  for (let level = 1; level <= BEACH_TOTAL_LEVELS; level += 1) {
    phaserBeachDifficulty.push(without(beachDifficulty(level), ["level"]));
    phaserBeachLevels.push(generateBeachLevel(level).rows);
  }
  compare(checks, "beach-cleanup", "difficulty-all-levels", beach.difficulties, phaserBeachDifficulty, BEACH_TOTAL_LEVELS);
  compare(checks, "beach-cleanup", "generated-boards-all-levels", beach.levels, phaserBeachLevels, BEACH_TOTAL_LEVELS);

  const house = legacyHouseRescue(source);
  const phaserHouseLevels = Array.from({ length: HOUSE_RESCUE_TOTAL_LEVELS }, (_, index) => houseRescueLevel(index + 1));
  compare(checks, "house-rescue", "levels", house.HOUSE_RESCUE_LEVELS, phaserHouseLevels, HOUSE_RESCUE_TOTAL_LEVELS);
  compare(checks, "house-rescue", "rubbish-items", house.HOUSE_RESCUE_ITEMS, HOUSE_RESCUE_ITEMS);
  compare(checks, "house-rescue", "categories", normalizeHouseCategories(house.HOUSE_RESCUE_CATEGORIES), normalizeHouseCategories(HOUSE_RESCUE_CATEGORIES));

  const powerwash = legacyPowerwash(source);
  const legacyPowerDifficulty = [];
  const phaserPowerDifficulty = [];
  for (let level = 1; level <= POWERWASH_TOTAL_LEVELS; level += 1) {
    const legacy = powerwash.difficulties[level - 1];
    legacyPowerDifficulty.push(legacy);
    const current = plain(powerwashDifficulty(level));
    phaserPowerDifficulty.push(Object.fromEntries(Object.keys(legacy).map((key) => [key, current[key]])));
  }
  compare(checks, "playground-power-wash", "difficulty-all-levels", legacyPowerDifficulty, phaserPowerDifficulty, POWERWASH_TOTAL_LEVELS);
  compare(checks, "playground-power-wash", "nozzles", powerwash.NOZZLES, POWERWASH_NOZZLES);
  compare(checks, "playground-power-wash", "soap", powerwash.SOAP_TOOL, POWERWASH_SOAP_TOOL);
  const legacyRewards = Array.from({ length: POWERWASH_TOTAL_LEVELS }, (_, index) => Math.min(POWERWASH_REWARD_CAP, Math.round(100 + (index + 1) * (20 / 24))));
  compare(checks, "playground-power-wash", "native-rewards-all-levels", legacyRewards, legacyRewards.map((_value, index) => calculatePowerwashNativeReward(index + 1)), POWERWASH_TOTAL_LEVELS);
  compare(checks, "playground-power-wash", "completion-threshold", 97, POWERWASH_MINIMUM_CLEAN_PERCENT);

  validatorCheck(checks, "waste-collection", validateWasteCatalogue({ verifySolutions: true }), 750);
  validatorCheck(checks, "lawn-care", validateLawnCatalogue({ verifySolutions: true }), 750);
  validatorCheck(checks, "river-clear-out", validateRiverCatalogue(), 750);
  validatorCheck(checks, "beach-cleanup", validateBeachCatalogue({ verifyLevels: true }), 750);
  validatorCheck(checks, "house-rescue", validateHouseRescueCatalogue(), 750);
  validatorCheck(checks, "playground-power-wash", validatePowerwashCatalogue(), 750);

  const legacyFishingConfig = objectFreezeValue(source, "FISHING_CONFIG");
  const legacyFishingTargeting = objectFreezeValue(source, "FISHING_TARGETING_CONFIG");
  const legacyFishingSpots = objectFreezeValue(source, "FISHING_SPOTS");
  const legacyMagnetConfig = objectFreezeValue(source, "MAGNET_FISHING_CONFIG");
  const legacyMagnetTargeting = objectFreezeValue(source, "MAGNET_TARGETING_CONFIG");
  const legacyMagnetSpot = objectFreezeValue(source, "MAGNET_FISHING_BRIDGE");
  const legacyMagnetCatalog = objectFreezeValue(source, "MAGNET_RECOVERY_CATALOG");
  const legacyMagnetRarity = objectFreezeValue(source, "MAGNET_RARITY_ORDER");
  compare(checks, "fishing", "config", legacyFishingConfig, FISHING_CONFIG);
  compare(checks, "fishing", "spots-and-catch-tables", legacyFishingSpots.map(normalizeFishingSpot), FISHING_SPOTS.map(normalizeFishingSpot), legacyFishingSpots.length);
  checks.push({
    game: "fishing", subject: "responsive-targeting-adapter", count: 1,
    ok: legacyFishingTargeting.zonesPerSession === TARGETING_CONFIG.zonesPerSession
      && legacyFishingTargeting.emptyWaitMinMs === TARGETING_CONFIG.emptyWaitMinMs
      && legacyFishingTargeting.emptyWaitMaxMs === TARGETING_CONFIG.emptyWaitMaxMs
      && TARGETING_CONFIG.zoneRadiusMin >= legacyFishingTargeting.zoneRadiusMin
      && TARGETING_CONFIG.zoneRadiusMax >= legacyFishingTargeting.zoneRadiusMax,
  });
  const legacyFishDraws = [];
  const phaserFishDraws = [];
  for (const spot of FISHING_SPOTS) for (const quality of [0, 0.25, 0.5, 0.75, 1]) {
    const oracleRandom = seededRandom(0xface000 + legacyFishDraws.length);
    const phaserRandom = seededRandom(0xface000 + legacyFishDraws.length);
    for (let draw = 0; draw < 1_000; draw += 1) {
      legacyFishDraws.push(legacyFishingChoice(spot, quality, oracleRandom));
      phaserFishDraws.push(chooseFishingCatch(spot, quality, phaserRandom));
    }
  }
  compare(checks, "fishing", "seeded-catch-selection", legacyFishDraws, phaserFishDraws, legacyFishDraws.length);

  compare(checks, "magnet-fishing", "config", legacyMagnetConfig, without(MAGNET_FISHING_CONFIG, ["schemaVersion"]));
  compare(checks, "magnet-fishing", "spot", normalizeMagnetSpot(legacyMagnetSpot), normalizeMagnetSpot(MAGNET_FISHING_SPOT));
  compare(checks, "magnet-fishing", "rarity-order", legacyMagnetRarity, MAGNET_RARITY_ORDER);
  const legacyMagnetCatalogWithoutColor = Object.fromEntries(Object.entries(legacyMagnetCatalog).map(([id, item]) => [id, without(item, ["color"])]));
  compare(checks, "magnet-fishing", "recovery-catalog", legacyMagnetCatalogWithoutColor, MAGNET_RECOVERY_CATALOG, Object.keys(legacyMagnetCatalog).length);
  checks.push({
    game: "magnet-fishing", subject: "responsive-targeting-adapter", count: 1,
    ok: legacyMagnetTargeting.zonesPerSession === MAGNET_TARGETING_CONFIG.zonesPerSession
      && MAGNET_TARGETING_CONFIG.zoneRadiusMin >= legacyMagnetTargeting.zoneRadiusMin
      && MAGNET_TARGETING_CONFIG.zoneRadiusMax >= legacyMagnetTargeting.zoneRadiusMax,
  });
  const legacyMagnetDraws = [];
  const phaserMagnetDraws = [];
  const pityStates = [
    { pullsWithoutRare: 0, pullsWithoutTreasure: 0 },
    { pullsWithoutRare: 11, pullsWithoutTreasure: 11 },
    { pullsWithoutRare: 39, pullsWithoutTreasure: 39 },
  ];
  for (let stateIndex = 0; stateIndex < pityStates.length; stateIndex += 1) {
    const oracleRandom = seededRandom(0xcafe00 + stateIndex);
    const phaserRandom = seededRandom(0xcafe00 + stateIndex);
    for (let draw = 0; draw < 1_000; draw += 1) {
      legacyMagnetDraws.push(legacyMagnetChoice(pityStates[stateIndex], oracleRandom, legacyMagnetCatalog));
      phaserMagnetDraws.push(chooseMagnetRecovery(pityStates[stateIndex], phaserRandom).id);
    }
  }
  compare(checks, "magnet-fishing", "seeded-recovery-and-pity-selection", legacyMagnetDraws, phaserMagnetDraws, legacyMagnetDraws.length);

  const legacyHarbourConfig = objectFreezeValue(source, "HARBOUR_GENERAL_CONFIG");
  const legacyHarbourCatalog = objectFreezeValue(source, "HARBOUR_GENERAL_CATALOG");
  compare(checks, "harbour-general", "config", legacyHarbourConfig, {
    schemaVersion: HARBOUR_GENERAL_CONFIG.schemaVersion,
    deedPrice: HARBOUR_GENERAL.deedPrice,
    slotCount: HARBOUR_GENERAL_CONFIG.slotCount,
    caseSize: HARBOUR_GENERAL_CONFIG.caseSize,
    maxPerItem: HARBOUR_GENERAL_CONFIG.maxPerItem,
    historyLimit: HARBOUR_GENERAL_CONFIG.historyLimit,
    open: HARBOUR_GENERAL.open,
    close: HARBOUR_GENERAL.close,
  });
  compare(checks, "harbour-general", "products-prices-and-demand", legacyHarbourCatalog.map(normalizeHarbourProduct), Object.values(HARBOUR_GENERAL_CATALOG).map(normalizeHarbourProduct), legacyHarbourCatalog.length);
  validatorCheck(checks, "harbour-general", validateHarbourGeneralCatalogue(), legacyHarbourCatalog.length);

  const failures = checks.filter((check) => !check.ok);
  return {
    ok: failures.length === 0,
    source: protectedSourcePath.slice(projectRoot.length + 1),
    sourceSha256: createHash("sha256").update(source).digest("hex"),
    games: [...new Set(checks.map((check) => check.game))],
    checks,
    failures,
    comparedLevelInstances: checks.filter((check) => check.count > 1).reduce((sum, check) => sum + check.count, 0),
  };
}
