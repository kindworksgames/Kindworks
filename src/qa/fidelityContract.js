export const FIDELITY_CONTRACT_VERSION = 1;
export const FIDELITY_SOURCE_FILE = "kindworks_little_bakery_v65_house_rescue_reintegrated_fixed.html";
export const FIDELITY_SOURCE_SHA256 = "0b85bd71385b83e7a13676f7593ce376245959fa4ebf1a6b9a0e6765297aa5a5";
export const FIDELITY_STORAGE_NAMESPACE = "kindworks:phase-3-fidelity:";

export const FIDELITY_VIEWPORTS = Object.freeze([
  Object.freeze({ id: "small-phone", width: 568, height: 320, orientation: "landscape" }),
  Object.freeze({ id: "phone-667", width: 667, height: 375, orientation: "landscape" }),
  Object.freeze({ id: "phone-736", width: 736, height: 414, orientation: "landscape" }),
  Object.freeze({ id: "wide-phone", width: 812, height: 375, orientation: "landscape" }),
  Object.freeze({ id: "modern-phone", width: 844, height: 390, orientation: "landscape" }),
  Object.freeze({ id: "tablet", width: 1024, height: 768, orientation: "landscape" }),
  Object.freeze({ id: "large-tablet", width: 1180, height: 820, orientation: "landscape" }),
  Object.freeze({ id: "legacy-reference", width: 1280, height: 720, orientation: "landscape" }),
  Object.freeze({ id: "desktop-qa", width: 1366, height: 768, orientation: "landscape" }),
  Object.freeze({ id: "portrait-gate", width: 390, height: 844, orientation: "portrait" }),
]);

export const FIDELITY_EVIDENCE_KINDS = Object.freeze([
  "rule-and-data",
  "input-and-gesture",
  "art-asset",
  "procedural-visual",
  "composition-and-depth",
  "animation-and-timing",
  "feedback-and-game-feel",
  "text-and-tutorial",
  "audio-and-haptics",
  "success-failure-restart-exit",
  "save-reward-and-town-return",
]);

export const FIDELITY_STATUSES = Object.freeze([
  "unverified",
  "confirmed-gap",
  "exact",
  "adapted-approved",
  "not-applicable",
]);

const CAMPAIGN_750_LEVELS = Object.freeze([1, 2, 10, 11, 20, 50, 100, 150, 250, 500, 749, 750]);
const CAMPAIGN_150_LEVELS = Object.freeze([1, 2, 10, 11, 20, 50, 100, 149, 150]);
const GAMEPLAY_CHECKPOINTS = Object.freeze([
  "entry",
  "picker-or-introduction",
  "initial-play-state",
  "first-valid-input",
  "invalid-input-feedback",
  "mid-progress",
  "near-completion",
  "success-and-reward",
  "failure-and-recovery",
  "restart",
  "safe-exit",
  "reload-resume",
  "orientation-change",
  "return-to-town",
]);

function activity(id, title, scene, levels, options = {}) {
  return Object.freeze({
    id,
    title,
    scene,
    levels,
    representativeLevels: levels === 750 ? CAMPAIGN_750_LEVELS : levels === 150 ? CAMPAIGN_150_LEVELS : Object.freeze([]),
    orientation: options.orientation || "landscape",
    checkpoints: options.checkpoints || GAMEPLAY_CHECKPOINTS,
    legacyAnchors: Object.freeze(options.legacyAnchors || []),
    phaserOwners: Object.freeze(options.phaserOwners || []),
  });
}

export const FIDELITY_ACTIVITIES = Object.freeze([
  activity("lawn", "Lawn Care", "LawnCareScene", 750, { legacyAnchors: ["openLawnCare", "renderLawnCare"], phaserOwners: ["src/scenes/LawnCareScene.js", "src/systems/LawnCareService.js"] }),
  activity("river", "River Clear-Out", "RiverClearoutScene", 750, { orientation: "portrait", legacyAnchors: ["openRiverGame", "renderRiverGame"], phaserOwners: ["src/scenes/RiverClearoutScene.js", "src/systems/RiverClearoutService.js"] }),
  activity("waste", "Waste Collection", "WasteCollectionScene", 750, { legacyAnchors: ["openWasteGame", "renderWasteGame"], phaserOwners: ["src/scenes/WasteCollectionScene.js", "src/systems/CleanupJobService.js"] }),
  activity("house-rescue", "House Rescue", "HouseRescueScene", 750, { legacyAnchors: ["openHouseRescue", "validateHouseRescue"], phaserOwners: ["src/scenes/HouseRescueScene.js", "src/systems/HouseRescueService.js"] }),
  activity("beach", "Beach Cleanup", "BeachCleanupScene", 750, { legacyAnchors: ["openBeachCleanup", "renderBeachCleanup"], phaserOwners: ["src/scenes/BeachCleanupScene.js", "src/systems/BeachCleanupService.js", "src/ui/BeachRakePattern.js"] }),
  activity("powerwash", "Playground Power Wash", "PlaygroundPowerwashScene", 750, { legacyAnchors: ["openPlaygroundPowerWash", "renderPlaygroundPowerWash"], phaserOwners: ["src/scenes/PlaygroundPowerwashScene.js", "src/systems/PlaygroundPowerwashService.js"] }),
  activity("fishing", "Fishing", "FishingScene", 0, { legacyAnchors: ["openFishing", "renderFishing"], phaserOwners: ["src/scenes/FishingScene.js", "src/systems/FishingService.js"] }),
  activity("magnet", "Magnet Fishing", "FishingScene", 0, { legacyAnchors: ["openMagnetFishing", "renderMagnetFishing"], phaserOwners: ["src/scenes/FishingScene.js", "src/systems/FishingService.js"] }),
  activity("bakery", "Little Bakery", "BakeryScene", 150, { legacyAnchors: ["openBakery", "renderBakery"], phaserOwners: ["src/scenes/BakeryScene.js", "src/systems/BakeryService.js"] }),
  activity("cafe", "Corner Café", "CafeScene", 150, { legacyAnchors: ["openCafe", "renderCafe"], phaserOwners: ["src/scenes/CafeScene.js", "src/systems/CafeService.js"] }),
  activity("morning-mug", "Morning Mug", "MorningMugScene", 150, { legacyAnchors: ["openMorningMug", "renderMorningMug"], phaserOwners: ["src/scenes/MorningMugScene.js", "src/systems/MorningMugService.js"] }),
  activity("riverside-kitchen", "Riverside Kitchen", "RiversideKitchenScene", 150, { legacyAnchors: ["openRiversideKitchen", "renderRiversideKitchen"], phaserOwners: ["src/scenes/RiversideKitchenScene.js", "src/systems/RiversideKitchenService.js"] }),
  activity("scoops", "South Shore Scoops", "SouthShoreScoopsScene", 750, { legacyAnchors: ["openScoops", "renderScoops"], phaserOwners: ["src/scenes/SouthShoreScoopsScene.js", "src/systems/SouthShoreScoopsService.js"] }),
  activity("house-interior", "House Interiors", "HouseInteriorScene", 0, { legacyAnchors: ["openHouseInterior", "renderHouseInterior"], phaserOwners: ["src/scenes/HouseInteriorScene.js", "src/systems/HomeInteriorService.js"] }),
  activity("village-grocer", "Village Grocer", "VillageGrocerScene", 0, { legacyAnchors: ["openShop", "shop-02"], phaserOwners: ["src/scenes/VillageGrocerScene.js", "src/systems/ShopService.js"] }),
]);

export const FIDELITY_TOWN_SYSTEMS = Object.freeze([
  "town-map-and-navigation",
  "player-camera-and-collisions",
  "npcs-schedules-thoughts-and-stories",
  "animals-wildlife-pets-and-followers",
  "farming-allotment-and-orchard",
  "shops-inventory-equipment-and-commerce",
  "homes-furniture-aquarium-and-gifts",
  "restoration-impact-and-world-change",
  "world-time-weather-seasons-and-environment",
  "onboarding-dialogue-hud-and-shared-overlays",
]);

export function getFidelityContract() {
  return structuredClone({
    version: FIDELITY_CONTRACT_VERSION,
    source: { file: FIDELITY_SOURCE_FILE, sha256: FIDELITY_SOURCE_SHA256, immutable: true },
    isolatedStorageNamespace: FIDELITY_STORAGE_NAMESPACE,
    viewports: FIDELITY_VIEWPORTS,
    evidenceKinds: FIDELITY_EVIDENCE_KINDS,
    statuses: FIDELITY_STATUSES,
    activities: FIDELITY_ACTIVITIES,
    townSystems: FIDELITY_TOWN_SYSTEMS,
    acceptance: {
      allowedFinalStatuses: ["exact", "adapted-approved", "not-applicable"],
      requiresObservedLegacyEvidence: true,
      requiresObservedPhaserEvidence: true,
      requiresPhoneAndTabletEvidence: true,
      requiresSaveRewardRegression: true,
      productionSaveMutationAllowed: false,
    },
  });
}

export function createFidelityStorage(storage, prefix = FIDELITY_STORAGE_NAMESPACE) {
  if (!storage || typeof storage.getItem !== "function") throw new TypeError("A Storage-compatible object is required.");
  const fullKey = (key) => `${prefix}${String(key)}`;
  const knownKeys = new Set();
  const ownedKeys = () => {
    const discovered = typeof storage.key === "function"
      ? Array.from({ length: Number(storage.length) || 0 }, (_value, index) => storage.key(index))
        .filter((key) => typeof key === "string" && key.startsWith(prefix))
      : [];
    return [...new Set([...discovered, ...knownKeys])];
  };
  return Object.freeze({
    get length() { return ownedKeys().length; },
    key(index) {
      const key = ownedKeys()[Number(index) || 0];
      return key ? key.slice(prefix.length) : null;
    },
    getItem(key) { return storage.getItem(fullKey(key)); },
    setItem(key, value) { const target = fullKey(key); knownKeys.add(target); storage.setItem(target, String(value)); },
    removeItem(key) { const target = fullKey(key); knownKeys.delete(target); storage.removeItem(target); },
    clear() { for (const key of ownedKeys()) { storage.removeItem(key); knownKeys.delete(key); } },
  });
}

export function prepareFidelityLevel(state, activityId, levelValue) {
  const activity = FIDELITY_ACTIVITIES.find(({ id }) => id === activityId);
  if (!activity) throw new RangeError(`Unknown fidelity activity: ${activityId}`);
  if (!activity.levels) return state;
  const level = Math.floor(Number(levelValue));
  if (!Number.isInteger(level) || level < 1 || level > activity.levels) throw new RangeError(`${activity.title} level must be between 1 and ${activity.levels}.`);
  const next = structuredClone(state);
  if (activityId === "waste") { next.progress.cleanup.progress.waste.nextLevel = level; next.progress.cleanup.activeSession = null; }
  if (activityId === "lawn") { next.lawnCare.progress.nextLevel = level; next.lawnCare.activeSession = null; }
  if (activityId === "river") { next.river.nextLevel = level; next.river.active = null; }
  if (activityId === "house-rescue") { next.houseRescue.unlockedLevel = level; next.houseRescue.selectedLevel = level; next.houseRescue.active = null; }
  if (activityId === "beach") { next.beachCleanup.progress.nextLevel = level; next.beachCleanup.activeSession = null; }
  if (activityId === "powerwash") { next.playgroundPowerwash.progress.nextLevel = level; next.playgroundPowerwash.activeSession = null; }
  if (activityId === "bakery") { next.bakery.unlockedLevel = level; next.bakery.activeShift = null; }
  if (activityId === "cafe") { next.cafe.unlockedLevel = level; next.cafe.activeShift = null; }
  if (activityId === "morning-mug") { next.morningMug.unlockedLevel = level; next.morningMug.activeShift = null; }
  if (activityId === "riverside-kitchen") { next.riversideKitchen.unlockedLevel = level; next.riversideKitchen.activeShift = null; }
  if (activityId === "scoops") { next.southShoreScoops.unlockedLevel = level; next.southShoreScoops.selectedLevel = level; next.southShoreScoops.activeShift = null; }
  return next;
}
