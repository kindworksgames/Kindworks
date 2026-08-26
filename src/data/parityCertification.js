import { WORLD, HOUSES, SHOPS, LANDMARKS, ROADS, BRIDGES, DISTRICTS } from "./town.js";
import { NPC_RESIDENTS, NPC_PUBLIC_BINS } from "./npcTownLife.js";
import { ANIMAL_SPECIES, ANIMAL_DEFINITIONS } from "./animals.js";
import { PLACEABLE_ITEM_IDS, RELEASED_PLACEABLE_ITEM_IDS } from "./townPlacement.js";
import { RESTORATION_MILESTONE_ORDER } from "./restorationMilestones.js";
import { HOUSE_INTERIOR_THEMES } from "./homeInteriors.js";
import { PAWS_WONDERS_ITEM_IDS } from "./pawsWonders.js";
import { HARBOUR_GENERAL_ITEM_IDS } from "./harbourGeneral.js";
import { ALLOTMENT_CONFIG, FARMING_CROPS, LAWN_PLOTS, ORCHARD_CONFIG } from "./farming.js";
import { FISHING_SPOTS, FISHING_CATCH_IDS, MAGNET_RECOVERY_IDS, ORNAMENTAL_FISH_IDS } from "./fishing.js";
import { WASTE_TOTAL_LEVELS } from "./wasteCollection.js";
import { LAWN_TOTAL_LEVELS } from "./lawnCare.js";
import { RIVER_TOTAL_LEVELS } from "./riverClearout.js";
import { HOUSE_RESCUE_TOTAL_LEVELS } from "./houseRescue.js";
import { BEACH_TOTAL_LEVELS } from "./beachCleanup.js";
import { POWERWASH_TOTAL_LEVELS } from "./playgroundPowerwash.js";
import { BAKERY_LEVELS, BAKERY_RECIPES } from "./bakery.js";
import { CAFE_LEVELS, CAFE_RECIPES } from "./cafe.js";
import { MORNING_MUG_LEVELS, MORNING_MUG_RECIPES } from "./morningMug.js";
import { RIVERSIDE_KITCHEN_LEVELS, RIVERSIDE_KITCHEN_RECIPES } from "./riversideKitchen.js";
import { SOUTH_SHORE_SCOOPS_LEVELS, SOUTH_SHORE_SCOOPS_PARTS } from "./southShoreScoops.js";

export const PARITY_CERTIFICATION_VERSION = 1;
export const PARITY_SOURCE_FILE = "kindworks_little_bakery_v65_house_rescue_reintegrated_fixed.html";
export const PARITY_SOURCE_SHA256 = "0b85bd71385b83e7a13676f7593ce376245959fa4ebf1a6b9a0e6765297aa5a5";

export const PARITY_VIEWPORTS = Object.freeze([
  Object.freeze({ id: "desktop", width: 1280, height: 720, purpose: "complete town and desktop controls" }),
  Object.freeze({ id: "mobile-landscape", width: 844, height: 390, purpose: "all activities and landscape controls" }),
  Object.freeze({ id: "mobile-portrait", width: 390, height: 844, purpose: "town, River Clear-Out, and rotate-phone barriers" }),
]);

export const PARITY_ACTIVITIES = Object.freeze([
  ["waste", "Waste Collection", "WasteCollectionScene", "waste-campaign-hud", 750, "landscape"],
  ["lawn", "Lawn Care", "LawnCareScene", "lawn-care-hud", 750, "landscape"],
  ["river", "River Clear-Out", "RiverClearoutScene", "river-hud", 750, "portrait-supported"],
  ["house-rescue", "House Rescue", "HouseRescueScene", "house-rescue-hud", 750, "landscape"],
  ["beach", "Beach Cleanup", "BeachCleanupScene", "beach-cleanup-hud", 750, "landscape"],
  ["powerwash", "Playground Power Wash", "PlaygroundPowerwashScene", "powerwash-hud", 750, "landscape"],
  ["bakery", "Little Bakery", "BakeryScene", "bakery-hud", 150, "landscape"],
  ["cafe", "Corner Café", "CafeScene", "cafe-hud", 150, "landscape"],
  ["morning-mug", "Morning Mug Coffee", "MorningMugScene", "morning-mug-hud", 150, "landscape"],
  ["riverside-kitchen", "Riverside Kitchen", "RiversideKitchenScene", "riverside-kitchen-hud", 150, "landscape"],
  ["scoops", "South Shore Scoops", "SouthShoreScoopsScene", "south-shore-scoops-hud", 750, "landscape"],
  ["fishing", "Fishing", "FishingScene", "fishing-hud", 0, "landscape"],
  ["magnet", "Magnet Fishing", "FishingScene", "fishing-hud", 0, "landscape"],
].map(([id, title, scene, hudId, levels, mobileOrientation]) => Object.freeze({
  id,
  title,
  scene,
  hudId,
  levels,
  representativeLevels: levels ? Object.freeze([1, Math.ceil(levels / 2), levels]) : Object.freeze([]),
  mobileOrientation,
})));

export const PARITY_EXPECTED_COUNTS = Object.freeze({
  worldWidth: 4200,
  worldHeight: 2800,
  houses: 19,
  shops: 12,
  landmarks: 6,
  roads: 9,
  bridges: 3,
  districts: 10,
  residents: 35,
  publicBins: 5,
  animalSpecies: 37,
  animalIdentities: 56,
  placeables: 35,
  releasedPlaceables: 32,
  restorations: 8,
  interiorThemes: 6,
  pawsCompanions: 11,
  harbourProducts: 17,
  lawns: 20,
  allotmentBeds: 6,
  cropTypes: 3,
  orchardCapacity: 24,
  fishingSpots: 3,
  fishingCatchTypes: 10,
  ornamentalFish: 4,
  magnetFinds: 8,
  bakeryRecipes: 24,
  cafeRecipes: 64,
  morningMugRecipes: 54,
  riversideKitchenRecipes: 32,
  scoopsParts: 24,
  campaignLevels: 5850,
});

export function currentParityCounts() {
  return {
    worldWidth: WORLD.width,
    worldHeight: WORLD.height,
    houses: HOUSES.length,
    shops: SHOPS.length,
    landmarks: LANDMARKS.length,
    roads: ROADS.length,
    bridges: BRIDGES.length,
    districts: DISTRICTS.length,
    residents: NPC_RESIDENTS.length,
    publicBins: NPC_PUBLIC_BINS.length,
    animalSpecies: Object.keys(ANIMAL_SPECIES).length,
    animalIdentities: ANIMAL_DEFINITIONS.length,
    placeables: PLACEABLE_ITEM_IDS.length,
    releasedPlaceables: RELEASED_PLACEABLE_ITEM_IDS.length,
    restorations: RESTORATION_MILESTONE_ORDER.length,
    interiorThemes: HOUSE_INTERIOR_THEMES.length,
    pawsCompanions: PAWS_WONDERS_ITEM_IDS.length,
    harbourProducts: HARBOUR_GENERAL_ITEM_IDS.length,
    lawns: LAWN_PLOTS.length,
    allotmentBeds: ALLOTMENT_CONFIG.bedCount,
    cropTypes: Object.keys(FARMING_CROPS).length,
    orchardCapacity: ORCHARD_CONFIG.maxTrees,
    fishingSpots: FISHING_SPOTS.length,
    fishingCatchTypes: FISHING_CATCH_IDS.length,
    ornamentalFish: ORNAMENTAL_FISH_IDS.length,
    magnetFinds: MAGNET_RECOVERY_IDS.length,
    bakeryRecipes: Object.keys(BAKERY_RECIPES).length,
    cafeRecipes: Object.keys(CAFE_RECIPES).length,
    morningMugRecipes: Object.keys(MORNING_MUG_RECIPES).length,
    riversideKitchenRecipes: Object.keys(RIVERSIDE_KITCHEN_RECIPES).length,
    scoopsParts: Object.keys(SOUTH_SHORE_SCOOPS_PARTS).length,
    campaignLevels: PARITY_ACTIVITIES.reduce((total, activity) => total + activity.levels, 0),
  };
}

export function currentCampaignCounts() {
  return {
    waste: WASTE_TOTAL_LEVELS,
    lawn: LAWN_TOTAL_LEVELS,
    river: RIVER_TOTAL_LEVELS,
    "house-rescue": HOUSE_RESCUE_TOTAL_LEVELS,
    beach: BEACH_TOTAL_LEVELS,
    powerwash: POWERWASH_TOTAL_LEVELS,
    bakery: BAKERY_LEVELS.length,
    cafe: CAFE_LEVELS.length,
    "morning-mug": MORNING_MUG_LEVELS.length,
    "riverside-kitchen": RIVERSIDE_KITCHEN_LEVELS.length,
    scoops: SOUTH_SHORE_SCOOPS_LEVELS.length,
    fishing: 0,
    magnet: 0,
  };
}

export function getParityCertification() {
  const counts = currentParityCounts();
  const campaignCounts = currentCampaignCounts();
  const issues = [];
  for (const [key, expected] of Object.entries(PARITY_EXPECTED_COUNTS)) {
    if (counts[key] !== expected) issues.push(`${key} expected ${expected}, found ${counts[key]}`);
  }
  for (const activity of PARITY_ACTIVITIES) {
    if (campaignCounts[activity.id] !== activity.levels) issues.push(`${activity.title} expected ${activity.levels} levels, found ${campaignCounts[activity.id]}`);
  }
  const portraitActivities = PARITY_ACTIVITIES.filter((activity) => activity.mobileOrientation === "portrait-supported");
  if (portraitActivities.length !== 1 || portraitActivities[0].id !== "river") issues.push("River Clear-Out must be the only portrait-supported activity.");
  return {
    milestone: 43,
    schemaVersion: PARITY_CERTIFICATION_VERSION,
    source: { file: PARITY_SOURCE_FILE, sha256: PARITY_SOURCE_SHA256, readOnly: true },
    ok: issues.length === 0,
    issues,
    counts,
    campaignCounts,
    activities: PARITY_ACTIVITIES.map((activity) => ({ ...activity, representativeLevels: [...activity.representativeLevels] })),
    viewports: PARITY_VIEWPORTS.map((viewport) => ({ ...viewport })),
    rule: "All activities require mobile landscape except River Clear-Out.",
  };
}
