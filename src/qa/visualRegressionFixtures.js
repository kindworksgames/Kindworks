import { createFreshGameState, validateGameState } from "../state/GameState.js";
import { PHASER_SAVE_KEY } from "../state/constants.js";
import { createSaveEnvelope } from "../state/SaveRepository.js";

export const VISUAL_REGRESSION_FIXTURE_VERSION = 1;
export const VISUAL_REGRESSION_FIXED_NOW = Date.UTC(2026, 0, 1, 12, 0, 0);

export const VISUAL_REGRESSION_VIEWPORTS = Object.freeze([
  Object.freeze({ id: "narrow-phone", width: 568, height: 320, family: "phone" }),
  Object.freeze({ id: "modern-phone", width: 844, height: 390, family: "phone" }),
  Object.freeze({ id: "tablet-4x3", width: 1024, height: 768, family: "tablet" }),
  Object.freeze({ id: "reference", width: 1280, height: 720, family: "desktop" }),
  Object.freeze({ id: "desktop", width: 1366, height: 768, family: "desktop" }),
]);

export const VISUAL_REGRESSION_SCENARIOS = Object.freeze([
  Object.freeze({ id: "town", family: "world", scene: "TownScene", activityId: null, level: null, viewportId: "reference" }),
  Object.freeze({ id: "house-interior", family: "interior", scene: "HouseInteriorScene", activityId: "house-interior", level: null, viewportId: "tablet-4x3" }),
  Object.freeze({ id: "village-grocer", family: "shop", scene: "VillageGrocerScene", activityId: "village-grocer", level: null, viewportId: "modern-phone" }),
  Object.freeze({ id: "corner-cafe", family: "restaurant", scene: "CafeScene", activityId: "cafe", level: 1, viewportId: "modern-phone" }),
  Object.freeze({ id: "lawn-care", family: "cleanup", scene: "LawnCareScene", activityId: "lawn", level: 1, viewportId: "narrow-phone" }),
  Object.freeze({ id: "powerwash", family: "special-renderer", scene: "PlaygroundPowerwashScene", activityId: "powerwash", level: 1, viewportId: "tablet-4x3" }),
]);

const PROFILE = Object.freeze({
  name: "Meadow",
  skin: "warm",
  hair: 1,
  hairColor: "dark-brown",
  accessory: "badge",
  outfit: 1,
  bodyBuild: "average",
  hobbies: Object.freeze(["gardening", "nature", "helping"]),
});

export function createVisualRegressionFixtureState() {
  const state = createFreshGameState({ now: VISUAL_REGRESSION_FIXED_NOW });
  const timestamp = new Date(VISUAL_REGRESSION_FIXED_NOW).toISOString();

  state.identity.townName = "Regression Willow";
  state.createdAt = timestamp;
  state.updatedAt = timestamp;
  state.world.clockMinutes = 660;
  state.player.scene = "TownScene";
  state.player.x = 1_570;
  state.player.y = 1_215;
  state.player.facing = "down";

  state.economy.coins = 12_500;
  state.economy.lifetimeCoinsEarned = 12_500;
  state.economy.lifetimeCoinsSpent = 0;
  state.economy.ledger[0] = {
    ...state.economy.ledger[0],
    amount: 12_500,
    reason: "Visual regression fixture",
    occurredAt: timestamp,
  };
  state.inventory.equipment["swiftcut-mower"] = 1;
  state.inventory.placeables["town-planter"] = 2;
  state.inventory.consumables["fresh-greens"] = 3;
  state.inventory.furniture["cosy-sofa"] = 1;
  state.inventory.equipped.mower = "swiftcut-mower";

  state.onboarding.townNamed = true;
  state.onboarding.complete = true;
  state.onboarding.creatorStep = 0;
  state.onboarding.creatorDraft = null;
  for (const key of Object.keys(state.onboarding.tutorialSeen)) state.onboarding.tutorialSeen[key] = true;
  for (const key of Object.keys(state.onboarding.tried)) state.onboarding.tried[key] = true;
  state.onboarding.journey.moved = true;
  state.onboarding.journey.metResident = true;
  state.onboarding.journey.completed.lawn = true;
  state.onboarding.journey.completed.waste = true;
  state.onboarding.journey.completed.river = true;
  state.onboarding.journey.freePlay = true;

  state.customResident.profile = structuredClone(PROFILE);
  state.customResident.home.level = 2;
  state.customResident.home.wallColor = "sage";
  state.customResident.location = { x: 1_620, y: 1_245, facing: "down" };

  const resident = state.npcs.residents.find(({ id }) => id === "npc-01");
  resident.narrativeState.storyStage = 1;
  resident.narrativeState.selectionCount = 2;
  resident.narrativeState.selectedDays = [1];
  resident.narrativeState.stageHistory = [{ stage: 1, day: 1, reason: "Visual regression fixture" }];
  resident.narrativeState.stageAdvancedAtDay = 1;
  resident.narrativeState.stageAdvanceCount = 1;
  resident.relationships["npc-kindly-member"] = 42;

  const pet = state.animals.residents["animal-dog-1"];
  pet.trust = 100;
  pet.adopted = true;
  pet.active = true;
  pet.purchasedDay = 1;
  state.animals.activeAnimalId = pet.id;

  for (const id of ["wake", "commons"]) {
    state.restorationMilestones.unlocked[id] = true;
    state.restorationMilestones.revealed[id] = true;
    state.restorationMilestones.unlockDay[id] = 1;
  }
  state.restorationMilestones.lastUnlockedId = "commons";
  state.restorationMilestones.counters.totalAccepted = 8;
  state.restorationMilestones.counters.cleanupByType.lawn = 3;
  state.restorationMilestones.counters.cleanupByType.waste = 3;
  state.restorationMilestones.counters.cleanupByType.river = 2;
  state.restorationMilestones.counters.zones.commons = 3;

  state.progress.completedJobCount = 8;
  state.progress.cleanup.progress.waste.nextLevel = 4;
  state.lawnCare.progress.nextLevel = 4;
  state.river.nextLevel = 4;
  state.houseRescue.unlockedLevel = 4;
  state.houseRescue.selectedLevel = 4;
  state.beachCleanup.progress.nextLevel = 4;
  state.playgroundPowerwash.progress.nextLevel = 4;
  state.bakery.unlockedLevel = 4;
  state.cafe.unlockedLevel = 4;
  state.morningMug.unlockedLevel = 4;
  state.riversideKitchen.unlockedLevel = 4;
  state.southShoreScoops.unlockedLevel = 4;
  state.southShoreScoops.selectedLevel = 4;

  state.farming.allotment.unlockedBeds = 2;
  state.farming.allotment.beds[1].unlocked = true;
  state.farming.allotment.beds[0].cropId = "carrot";
  state.farming.allotment.beds[0].status = "growing";
  state.farming.allotment.beds[0].growthMinutes = 45;

  const validation = validateGameState(state);
  if (!validation.ok) throw new Error(`Invalid visual regression fixture: ${validation.errors.join(" ")}`);
  return state;
}

export function createVisualRegressionSaveEnvelope() {
  return createSaveEnvelope(createVisualRegressionFixtureState(), {
    now: VISUAL_REGRESSION_FIXED_NOW,
  });
}

export function seedVisualRegressionStorage(storage) {
  if (!storage || typeof storage.setItem !== "function") throw new TypeError("A Storage-compatible object is required.");
  const envelope = createVisualRegressionSaveEnvelope();
  storage.setItem(PHASER_SAVE_KEY, JSON.stringify(envelope));
  return { ok: true, fixtureVersion: VISUAL_REGRESSION_FIXTURE_VERSION, key: PHASER_SAVE_KEY };
}

export function getVisualRegressionScenario(id) {
  return VISUAL_REGRESSION_SCENARIOS.find((scenario) => scenario.id === id) || null;
}
