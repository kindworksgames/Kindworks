import { PARITY_ACTIVITIES, PARITY_SOURCE_FILE, PARITY_SOURCE_SHA256 } from "./parityCertification.js";

export const DIFFERENTIAL_PARITY_VERSION = 1;
export const DIFFERENTIAL_PARITY_MILESTONE = 46;

const activityRows = [
  ["waste", "Waste Collection", "WASTE_BUILD_VERSION", "src/data/wasteCollection.js", "src/systems/CleanupJobService.js", "src/state/cleanupState.js", "tests/waste-collection.test.js", ["WASTE_TOTAL_LEVELS", "validateWasteCatalogue", "completeCertifiedCampaign"]],
  ["lawn", "Lawn Care", "11.0.0-pixel-garden-rebuild", "src/data/lawnCare.js", "src/systems/LawnCareService.js", "src/state/lawnCareState.js", "tests/lawn-care.test.js", ["LAWN_TOTAL_LEVELS", "validateLawnCatalogue", "completeCertified"]],
  ["river", "River Clear-Out", "RIVER_BUILD_VERSION", "src/data/riverClearout.js", "src/systems/RiverClearoutService.js", "src/state/riverState.js", "tests/river-clearout.test.js", ["KindworkLevels", "CoreRules", "validateRiverCatalogue"]],
  ["house-rescue", "House Rescue", "HOUSE_RESCUE_CONFIG", "src/data/houseRescue.js", "src/systems/HouseRescueService.js", "src/state/houseRescueState.js", "tests/house-rescue.test.js", ["generateHouseRescueItems", "generateHouseRescueDirt", "validateHouseRescue"]],
  ["beach", "Beach Cleanup", "EMBEDDED_BEACH_CLEANUP_HTML_B64", "src/data/beachCleanup.js", "src/systems/BeachCleanupService.js", "src/state/beachCleanupState.js", "tests/beach-cleanup.test.js", ["BEACH_TOTAL_LEVELS", "validateBeachCatalogue", "beachCertifiedRoute"]],
  ["powerwash", "Playground Power Wash", "PLAYGROUND_CLEANUP_CONFIG", "src/data/playgroundPowerwash.js", "src/systems/PlaygroundPowerwashService.js", "src/state/playgroundPowerwashState.js", "tests/playground-powerwash.test.js", ["POWERWASH_TOTAL_LEVELS", "validatePowerwashCatalogue", "POWERWASH_MINIMUM_CLEAN_PERCENT"]],
  ["bakery", "Little Bakery", "BAKERY_CONFIG", "src/data/bakery.js", "src/systems/BakeryService.js", "src/state/bakeryState.js", "tests/bakery-service.test.js", ["BAKERY_RECIPES", "BAKERY_LEVELS", "bakeryFirstClearCoins"]],
  ["cafe", "Corner Café", "CAFE_CONFIG", "src/data/cafe.js", "src/systems/CafeService.js", "src/state/cafeState.js", "tests/cafe-service.test.js", ["CAFE_RECIPES", "CAFE_LEVELS", "cafeFirstClearCoins"]],
  ["morning-mug", "Morning Mug Coffee", "MUG_CONFIG", "src/data/morningMug.js", "src/systems/MorningMugService.js", "src/state/morningMugState.js", "tests/morning-mug-service.test.js", ["MORNING_MUG_RECIPES", "MORNING_MUG_LEVELS", "morningMugFirstClearCoins"]],
  ["riverside-kitchen", "Riverside Kitchen", "RIVERSIDE_CONFIG", "src/data/riversideKitchen.js", "src/systems/RiversideKitchenService.js", "src/state/riversideKitchenState.js", "tests/riverside-kitchen-service.test.js", ["RIVERSIDE_KITCHEN_RECIPES", "RIVERSIDE_KITCHEN_LEVELS", "riversideKitchenFirstClearCoins"]],
  ["scoops", "South Shore Scoops", "SCOOPS_CONFIG", "src/data/southShoreScoops.js", "src/systems/SouthShoreScoopsService.js", "src/state/southShoreScoopsState.js", "tests/south-shore-scoops-service.test.js", ["SOUTH_SHORE_SCOOPS_REWARD_CONFIG", "SOUTH_SHORE_SCOOPS_LEVELS", "southShoreScoopsFirstClearCoins"]],
  ["fishing", "Fishing", "FISHING_CONFIG", "src/data/fishing.js", "src/systems/FishingService.js", "src/state/fishingState.js", "tests/fishing-service.test.js", ["FISHING_SPOTS", "chooseFishingCatch", "reelFish"]],
  ["magnet", "Magnet Fishing", "MAGNET_FISHING_CONFIG", "src/data/fishing.js", "src/systems/FishingService.js", "src/state/fishingState.js", "tests/fishing-service.test.js", ["MAGNET_RECOVERY_CATALOG", "chooseMagnetRecovery", "retrieveMagnet"]],
];

export const DIFFERENTIAL_ACTIVITY_CONTRACTS = Object.freeze(activityRows.map(([id, title, sourceAnchor, dataOwner, serviceOwner, stateOwner, testOwner, sourceMarkers]) => {
  const certified = PARITY_ACTIVITIES.find((activity) => activity.id === id);
  return Object.freeze({
    id,
    title,
    levels: certified?.levels ?? 0,
    scene: certified?.scene ?? null,
    mobileOrientation: certified?.mobileOrientation ?? null,
    sourceAnchor,
    sourceMarkers: Object.freeze(sourceMarkers),
    owners: Object.freeze({ data: dataOwner, service: serviceOwner, state: stateOwner, scene: `src/scenes/${certified?.scene}.js` }),
    testOwner,
    requiredChecks: Object.freeze(["catalogue", "rules", "boundaries", "failure", "resume", "first-clear", "replay", "legacy-import", "orientation"]),
  });
}));

const sharedRows = [
  ["world-layout", "Town map, buildings, roads, bridges and districts", ["TownLayout", "HouseKit", "RiverVisual", "BridgeArt", "RiverBridge", "Camera", "getState", "version"], ["src/data/town.js", "src/scenes/TownScene.js"], ["tests/parity-certification.test.js", "tests/interaction-system.test.js"]],
  ["movement-navigation", "Player movement, collision, interaction and walk mode", ["WalkMode", "Collision", "Navigation"], ["src/systems/MovementController.js", "src/systems/NavigationGraph.js", "src/systems/InteractionSystem.js"], ["tests/interaction-system.test.js", "tests/release-candidate.test.js"]],
  ["living-world", "Clock, weather, litter, river flow, lawns and businesses", ["LivingTown", "Weather", "RiverGarbage", "Litter", "Environment", "TownClock"], ["src/systems/WorldSimulationService.js", "src/systems/LivingEnvironmentService.js"], ["tests/world-simulation.test.js", "tests/living-environment.test.js"]],
  ["residents", "Residents, schedules, needs, relationships and navigation", ["Npc", "NPC", "Resident"], ["src/systems/NpcTownLifeService.js", "src/data/npcTownLife.js"], ["tests/npc-town-life.test.js", "tests/advanced-npc.test.js"]],
  ["narratives", "Resident stories, thoughts and progression", ["Narrative", "Thought", "Story"], ["src/systems/NpcNarrativeService.js", "src/data/npcNarratives.js"], ["tests/npc-narratives.test.js"]],
  ["animals", "Wildlife, diets, friendship, adoption and Paws & Wonders", ["Animal", "Companion", "Diet", "PetShop", "ForestBorder", "SouthMeadow", "RareWaterVisitor"], ["src/systems/AnimalService.js", "src/systems/PawsWondersService.js"], ["tests/animal-service.test.js", "tests/wildlife-system.test.js", "tests/paws-wonders.test.js"]],
  ["economy-inventory-shops", "Coins, ordinary shops, inventory and equipment", ["Economy", "Shop", "Inventory", "Equipment", "Equipped", "PerfectCounts", "WasteCollectionSlots", "PurchasedWasteBin"], ["src/systems/EconomyService.js", "src/systems/InventoryService.js", "src/systems/ShopService.js"], ["tests/economy-service.test.js", "tests/inventory-service.test.js", "tests/shop-service.test.js", "tests/item-catalog.test.js"]],
  ["town-placement", "Town objects, placement, movement and storage", ["PlacedTownObjects", "Place", "Placement"], ["src/systems/TownPlacementService.js", "src/data/townPlacement.js"], ["tests/town-placement.test.js"]],
  ["farming", "Village Grocer, allotment and orchard", ["Farming", "Allotment", "Orchard", "Carrot", "Apple", "Crop", "MarketInterior", "MarketProduct", "TopDownMarket"], ["src/systems/FarmingService.js", "src/data/farming.js"], ["tests/farming-service.test.js", "tests/village-grocer.test.js"]],
  ["municipal-collection", "Weekly bin collection", ["GarbageCollection", "SparseStarterFixtures"], ["src/systems/MunicipalCollectionService.js", "src/data/municipalCollection.js"], ["tests/municipal-collection.test.js"]],
  ["restoration", "Eight-stage restoration, gifts, festival and cinema", ["Restoration", "Milestone", "Impact"], ["src/systems/RestorationMilestoneService.js", "src/systems/ImpactProjectService.js"], ["tests/restoration-milestones.test.js", "tests/impact-projects.test.js"]],
  ["homes", "Personal home, interiors and furniture", ["PersonalHome", "HouseInterior", "HomeFurniture"], ["src/systems/CustomResidentService.js", "src/systems/HomeInteriorService.js"], ["tests/personal-home.test.js", "tests/home-interiors.test.js"]],
  ["homeowner-gifts", "Homeowner gift probabilities, queue and use", ["HomeownerGift"], ["src/systems/HomeownerGiftService.js", "src/data/homeownerGifts.js"], ["tests/homeowner-gifts.test.js"]],
  ["aquarium", "Fish tank ownership, stocking and display", ["Aquarium", "FishTank"], ["src/systems/AquariumService.js", "src/data/aquarium.js"], ["tests/aquarium.test.js"]],
  ["harbour-general", "Harbour General ownership, stock and sales", ["HarbourGeneral"], ["src/systems/HarbourGeneralService.js", "src/data/harbourGeneral.js"], ["tests/harbour-general.test.js"]],
  ["onboarding", "Town identity, custom resident and first-session rewards", ["PlayerSetup", "Onboarding"], ["src/systems/OnboardingService.js", "src/systems/CustomResidentService.js"], ["tests/onboarding-rewards.test.js", "tests/custom-resident.test.js"]],
  ["commerce", "Verified purchases, subscriptions and trusted time", ["Commerce", "CoinPack", "Kindly", "Subscription"], ["src/systems/CommerceService.js", "src/systems/CommerceReceiptVerifier.js"], ["tests/commerce.test.js"]],
  ["save-reconciliation", "Save, backup, recovery and protected HTML import", ["MiniGameRecovery", "CampaignState"], ["src/state/SaveRepository.js", "src/state/LegacySaveImporter.js", "src/state/legacyReconciliationState.js"], ["tests/save-repository.test.js", "tests/legacy-save-importer.test.js", "tests/legacy-reconciliation.test.js"]],
  ["cleanup-integration", "Recurring town jobs and campaign bridge", ["MiniGame", "Campaign"], ["src/systems/CleanupJobService.js", "src/data/cleanupJobs.js"], ["tests/cleanup-job-service.test.js"]],
];

export const DIFFERENTIAL_SHARED_DOMAINS = Object.freeze(sharedRows.map(([id, title, legacyApiTokens, owners, tests]) => Object.freeze({
  id,
  title,
  legacyApiTokens: Object.freeze(legacyApiTokens),
  owners: Object.freeze(owners),
  tests: Object.freeze(tests),
})));

export const DIFFERENTIAL_RULE_PROBES = Object.freeze([
  ["CAFE_CONFIG", "src/data/cafe.js", "CAFE_CONFIG", ["levelCount", "trayCount", "maxCustomers", "graceSeconds", "firstClearBaseCoins", "firstClearLevelCoins", "starCoins"]],
  ["MUG_CONFIG", "src/data/morningMug.js", "MORNING_MUG_CONFIG", ["levelCount", "trayCount", "maxCustomers", "graceSeconds", "firstClearBaseCoins", "firstClearLevelCoins", "starCoins", "firstClearMaxCoins"]],
  ["RIVERSIDE_CONFIG", "src/data/riversideKitchen.js", "RIVERSIDE_KITCHEN_CONFIG", ["levelCount", "trayCount", "maxCustomers", "graceSeconds", "firstClearBaseCoins", "firstClearLevelCoins", "starCoins", "firstClearMaxCoins"]],
  ["BAKERY_CONFIG", "src/data/bakery.js", "BAKERY_CONFIG", ["levelCount", "levelsPerChapter", "trayCount", "maxCustomers", "graceSeconds", "firstClearBaseCoins", "firstClearCampaignCoins", "starCoins", "firstClearMaxCoins"]],
  ["SCOOPS_CONFIG", "src/data/southShoreScoops.js", "SOUTH_SHORE_SCOOPS_CONFIG", ["schemaVersion", "levelCount", "levelsPerChapter", "maxCustomers", "passingAccuracy", "sequentialService", "maxVisibleQueue"]],
  ["SCOOPS_REWARD_CONFIG", "src/data/southShoreScoops.js", "SOUTH_SHORE_SCOOPS_REWARD_CONFIG", ["minimum", "maximum", "accuracyStep", "levelStepEvery", "levelStepCoins", "maxLevelBonus"]],
  ["HOUSE_RESCUE_CONFIG", "src/data/houseRescue.js", "HOUSE_RESCUE_RULES", ["maxDirtyHomes", "completionCoverage", "baseCoins", "accuracyCoins", "respawnMinDays", "respawnMaxDays", "visibleItemsPerWave"]],
  ["FISHING_CONFIG", "src/data/fishing.js", "FISHING_CONFIG", ["dailyCasts", "castAnimationMs", "biteDelayMinMs", "biteDelayMaxMs", "biteWindowMs", "reelAnimationMs", "excellentWindowFraction", "maxInventoryPerFish", "maxAquariumPerSpecies"]],
  ["MAGNET_FISHING_CONFIG", "src/data/fishing.js", "MAGNET_FISHING_CONFIG", ["dailyCasts", "castAnimationMs", "sinkAnimationMs", "settleAnimationMs", "reelAnimationMs", "cleanupGraceGameMinutes", "rarePityPulls", "treasurePityPulls", "recentFindLimit"]],
  ["HARBOUR_GENERAL_CONFIG", "src/data/harbourGeneral.js", "HARBOUR_GENERAL_CONFIG", ["schemaVersion", "slotCount", "caseSize", "maxPerItem", "historyLimit"]],
  ["HARBOUR_GENERAL_CONFIG", "src/data/harbourGeneral.js", "HARBOUR_GENERAL", ["deedPrice", "open", "close"]],
  ["HOMEOWNER_GIFT_CONFIG", "src/data/homeownerGifts.js", "HOMEOWNER_GIFT_CONFIG", ["householdCooldownDays", "fullCareWindowDays", "pityAfterMisses", "processedLimit", "historyLimit", "queueLimit", "minimumLawnPercent"]],
].map(([sourceConstant, modulePath, exportName, properties]) => Object.freeze({ sourceConstant, modulePath, exportName, properties: Object.freeze(properties) })));

export const DIFFERENTIAL_MANUAL_GATES = Object.freeze([
  "sprite-art appearance after final Sprite AI assets replace placeholders",
  "animation feel and audio timing",
  "device-specific touch ergonomics on physical phones and tablets",
  "pixel-level composition where Phaser intentionally replaces legacy DOM/canvas rendering",
]);

export function legacyApiDomain(apiKey) {
  const activityTokens = [
    ["magnet", ["Magnet"]],
    ["fishing", ["Fishing"]],
    ["house-rescue", ["HouseRescue"]],
    ["powerwash", ["Playground", "Powerwash"]],
    ["morning-mug", ["MorningMug", "MugLevel"]],
    ["riverside-kitchen", ["Riverside"]],
    ["scoops", ["SouthShoreScoops", "Scoops"]],
    ["bakery", ["LittleBakery", "Bakery"]],
    ["cafe", ["CornerCafe", "Cafe"]],
    ["lawn", ["Lawn", "Mower"]],
    ["waste", ["WasteCollection"]],
    ["river", ["RiverClearout"]],
    ["beach", ["Beach"]],
  ];
  for (const [id, tokens] of activityTokens) if (tokens.some((token) => apiKey.toLowerCase().includes(token.toLowerCase()))) return id;
  const matches = DIFFERENTIAL_SHARED_DOMAINS.filter((domain) => domain.legacyApiTokens.some((token) => apiKey.toLowerCase().includes(token.toLowerCase())));
  return matches[0]?.id || null;
}

export function getDifferentialParityCertification() {
  const issues = [];
  if (DIFFERENTIAL_ACTIVITY_CONTRACTS.length !== PARITY_ACTIVITIES.length) issues.push("Every certified activity needs one differential contract.");
  if (new Set(DIFFERENTIAL_ACTIVITY_CONTRACTS.map(({ id }) => id)).size !== PARITY_ACTIVITIES.length) issues.push("Differential activity IDs must be unique.");
  if (DIFFERENTIAL_SHARED_DOMAINS.length < 19) issues.push("The shared-system inventory is incomplete.");
  if (DIFFERENTIAL_RULE_PROBES.length < 11) issues.push("The protected-source rule probe set is incomplete.");
  return {
    milestone: DIFFERENTIAL_PARITY_MILESTONE,
    version: DIFFERENTIAL_PARITY_VERSION,
    ok: issues.length === 0,
    issues,
    source: { file: PARITY_SOURCE_FILE, sha256: PARITY_SOURCE_SHA256, readOnly: true },
    scope: {
      activities: DIFFERENTIAL_ACTIVITY_CONTRACTS.length,
      campaignLevels: DIFFERENTIAL_ACTIVITY_CONTRACTS.reduce((sum, activity) => sum + activity.levels, 0),
      sharedDomains: DIFFERENTIAL_SHARED_DOMAINS.length,
      exactRuleProbes: DIFFERENTIAL_RULE_PROBES.length,
    },
    claim: "Behavioral, content, progression and save parity; rendering implementation is intentionally not source-identical.",
    automatedEvidence: ["protected-source checksum", "legacy public API inventory", "source-to-Phaser rule probes", "exhaustive campaign tests", "state/reward/replay/resume tests", "save reconciliation"],
    manualGates: [...DIFFERENTIAL_MANUAL_GATES],
  };
}
