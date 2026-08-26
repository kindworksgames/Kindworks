import { PLAYER_START, WORLD } from "../data/town.js";
import { GAME_STATE_SCHEMA_VERSION } from "./constants.js";
import {
  createFreshEconomyState,
  createFreshInventoryState,
  normalizeInventoryState,
  projectLegacyEconomy,
  projectLegacyInventory,
  validateEconomyState,
  validateInventoryState,
} from "./economyState.js";
import { createFreshCleanupState, normalizeCleanupState, projectLegacyCleanup, validateCleanupState } from "./cleanupState.js";
import { createFreshWorldState, normalizeWorldState, validateWorldState } from "./worldState.js";
import { createFreshNpcState, normalizeNpcState, projectLegacyNpcState, validateNpcState } from "./npcState.js";
import {
  createFreshCustomResidentState,
  normalizeCustomResidentState,
  normalizePersonalHome,
  projectLegacyCustomResident,
  validateCustomResidentState,
} from "./customResidentState.js";
import {
  createFreshFarmingState,
  normalizeFarmingState,
  projectLegacyFarming,
  validateFarmingState,
} from "./farmingState.js";
import {
  createFreshAnimalState,
  normalizeAnimalState,
  projectLegacyAnimals,
  validateAnimalState,
} from "./animalState.js";
import {
  createFreshFishingState,
  normalizeFishingState,
  projectLegacyFishing,
  validateFishingState,
} from "./fishingState.js";
import {
  createFreshBakeryState,
  normalizeBakeryState,
  projectLegacyBakery,
  validateBakeryState,
} from "./bakeryState.js";
import {
  createFreshCafeState,
  normalizeCafeState,
  projectLegacyCafe,
  validateCafeState,
} from "./cafeState.js";
import {
  createFreshRiverState,
  normalizeRiverState,
  projectLegacyRiver,
  validateRiverState,
} from "./riverState.js";
import {
  createFreshHouseRescueState,
  normalizeHouseRescueState,
  projectLegacyHouseRescue,
  validateHouseRescueState,
} from "./houseRescueState.js";
import {
  createFreshLawnCareState,
  normalizeLawnCareState,
  projectLegacyLawnCare,
  validateLawnCareState,
} from "./lawnCareState.js";
import {
  createFreshBeachCleanupState,
  normalizeBeachCleanupState,
  projectLegacyBeachCleanup,
  validateBeachCleanupState,
} from "./beachCleanupState.js";
import {
  createFreshPlaygroundPowerwashState,
  normalizePlaygroundPowerwashState,
  projectLegacyPlaygroundPowerwash,
  validatePlaygroundPowerwashState,
} from "./playgroundPowerwashState.js";
import {
  createFreshMorningMugState,
  normalizeMorningMugState,
  projectLegacyMorningMug,
  validateMorningMugState,
} from "./morningMugState.js";
import {
  createFreshRiversideKitchenState,
  normalizeRiversideKitchenState,
  projectLegacyRiversideKitchen,
  validateRiversideKitchenState,
} from "./riversideKitchenState.js";
import {
  createFreshSouthShoreScoopsState,
  normalizeSouthShoreScoopsState,
  projectLegacySouthShoreScoops,
  validateSouthShoreScoopsState,
} from "./southShoreScoopsState.js";
import {
  createFreshTownPlacementState,
  normalizeTownPlacementState,
  projectLegacyTownPlacement,
  validateTownPlacementState,
} from "./townPlacementState.js";
import {
  createFreshLivingEnvironmentState,
  normalizeLivingEnvironmentState,
  projectLegacyLivingEnvironment,
  validateLivingEnvironmentState,
} from "./livingEnvironmentState.js";
import {
  createFreshMunicipalCollectionState,
  normalizeMunicipalCollectionState,
  projectLegacyMunicipalCollection,
  validateMunicipalCollectionState,
} from "./municipalCollectionState.js";
import {
  createFreshRestorationMilestoneState,
  normalizeRestorationMilestoneState,
  projectLegacyRestorationMilestoneState,
  validateRestorationMilestoneState,
} from "./restorationMilestoneState.js";
import {
  createFreshHomeInteriorState,
  normalizeHomeInteriorState,
  projectLegacyHomeInteriors,
  validateHomeInteriorState,
} from "./homeInteriorState.js";
import { reconcileAquariumHousingInto, validateAquariumHousing } from "./aquariumState.js";
import {
  createFreshHomeownerGiftState,
  normalizeHomeownerGiftState,
  projectLegacyHomeownerGiftState,
  validateHomeownerGiftState,
} from "./homeownerGiftState.js";

const DIRECTIONS = new Set(["up", "down", "left", "right"]);

function isoTime(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function safeTownName(value) {
  const name = String(value || "Willowmere")
    .replace(/[^\p{L}\p{N} '’\-]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 24);
  return name || "Willowmere";
}

function safeInteger(value, minimum = 0, maximum = Number.MAX_SAFE_INTEGER) {
  const number = Math.floor(Number(value));
  return Number.isFinite(number) ? Math.max(minimum, Math.min(maximum, number)) : minimum;
}

export function createFreshGameState({ now = Date.now() } = {}) {
  const timestamp = isoTime(now) || new Date(0).toISOString();
  const world = createFreshWorldState({ now });
  return {
    schemaVersion: GAME_STATE_SCHEMA_VERSION,
    createdAt: timestamp,
    updatedAt: timestamp,
    source: {
      kind: "new",
      legacyVersion: null,
      legacySourceKey: null,
      importedAt: null,
      warnings: [],
    },
    identity: { townName: "Willowmere" },
    world,
    player: {
      scene: "TownScene",
      x: PLAYER_START.x,
      y: PLAYER_START.y,
      facing: "down",
    },
    progress: { completedJobCount: 0, cleanup: createFreshCleanupState() },
    economy: createFreshEconomyState({ now }),
    inventory: createFreshInventoryState(),
    townPlacement: createFreshTownPlacementState(),
    npcs: createFreshNpcState(world),
    municipalCollection: createFreshMunicipalCollectionState(world),
    restorationMilestones: createFreshRestorationMilestoneState(),
    customResident: createFreshCustomResidentState(),
    homeInteriors: createFreshHomeInteriorState(),
    farming: createFreshFarmingState(world),
    environment: createFreshLivingEnvironmentState(world),
    animals: createFreshAnimalState(world),
    fishing: createFreshFishingState(world),
    bakery: createFreshBakeryState(),
    cafe: createFreshCafeState(),
    river: createFreshRiverState(),
    houseRescue: createFreshHouseRescueState({ worldDay: world.day }),
    lawnCare: createFreshLawnCareState(),
    beachCleanup: createFreshBeachCleanupState(),
    playgroundPowerwash: createFreshPlaygroundPowerwashState(),
    morningMug: createFreshMorningMugState(),
    riversideKitchen: createFreshRiversideKitchenState(),
    southShoreScoops: createFreshSouthShoreScoopsState(),
    homeownerGifts: createFreshHomeownerGiftState(),
    legacySnapshot: null,
  };
}

export function createGameStateFromLegacy(legacy, report, { now = Date.now() } = {}) {
  if (!legacy || typeof legacy !== "object") throw new TypeError("A parsed legacy save is required.");
  if (!report?.ok) throw new TypeError("A successful legacy validation report is required.");
  const state = createFreshGameState({ now });
  state.source = {
    kind: "legacy-import",
    legacyVersion: Number(legacy.version),
    legacySourceKey: report.sourceKey,
    importedAt: state.updatedAt,
    warnings: [...(report.warnings || [])],
  };
  state.identity.townName = safeTownName(legacy.playerSetup?.townName);
  state.world.day = safeInteger(legacy.worldDay, 1);
  state.world.clockMinutes = safeInteger(legacy.worldClockMinutes, 0, 1439);
  state.world = normalizeWorldState(state.world, { now });
  state.progress.completedJobCount = safeInteger(legacy.completedJobCount, 0);
  state.progress.cleanup = projectLegacyCleanup(legacy, state.progress.cleanup);
  state.economy = projectLegacyEconomy(legacy.economy, { now });
  state.inventory = projectLegacyInventory({
    ...(legacy.economy?.inventory || {}),
    equipped: legacy.economy?.equipped,
  });
  state.townPlacement = projectLegacyTownPlacement(legacy, state.inventory, { now });
  state.npcs = projectLegacyNpcState(legacy, state.world);
  state.municipalCollection = projectLegacyMunicipalCollection(legacy, state.world);
  state.customResident = projectLegacyCustomResident(legacy);
  state.homeInteriors = projectLegacyHomeInteriors(legacy);
  state.farming = projectLegacyFarming(legacy, state.world);
  state.environment = projectLegacyLivingEnvironment(legacy, state.world);
  state.animals = projectLegacyAnimals(legacy.animals, state.world);
  state.fishing = projectLegacyFishing(legacy.fishing, legacy.magnetFishing, state.world);
  state.bakery = projectLegacyBakery(legacy.bakery);
  state.cafe = projectLegacyCafe(legacy.cafe);
  state.river = projectLegacyRiver(legacy);
  state.houseRescue = projectLegacyHouseRescue(legacy, state.world);
  state.lawnCare = projectLegacyLawnCare(legacy);
  state.beachCleanup = projectLegacyBeachCleanup(legacy);
  state.playgroundPowerwash = projectLegacyPlaygroundPowerwash(legacy);
  state.morningMug = projectLegacyMorningMug(legacy.morningMug);
  state.riversideKitchen = projectLegacyRiversideKitchen(legacy.riversideKitchen);
  state.southShoreScoops = projectLegacySouthShoreScoops(legacy.southShoreScoops ?? legacy.scoops);
  state.homeownerGifts = projectLegacyHomeownerGiftState(legacy, state.inventory);
  state.restorationMilestones = projectLegacyRestorationMilestoneState(legacy, state);
  const legacySeeds = legacy.farmingFoundation?.seedInventory || {};
  for (const id of ["carrot-seeds", "fresh-greens-seeds", "wild-berry-starters"]) {
    const quantity = safeInteger(legacySeeds[id], 0, 99);
    if (quantity) state.inventory.consumables[id] = quantity;
  }
  const legacyCarrots = safeInteger(legacy.allotment?.carrots, 0, 99);
  const legacyApples = safeInteger(legacy.orchard?.apples, 0, 99);
  if (legacyCarrots) state.inventory.consumables["allotment-carrot"] = legacyCarrots;
  if (legacyApples) state.inventory.consumables["orchard-apple"] = legacyApples;
  reconcileAquariumHousingInto(state, { reason: "A placed home fish tank was not available during legacy import", now });
  state.legacySnapshot = structuredClone(legacy);
  return state;
}

export function upgradeGameState(value, { now = Date.now() } = {}) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const state = structuredClone(value);
  if (state.schemaVersion === 1) {
    const legacyEconomy = state.legacySnapshot?.economy;
    state.economy = legacyEconomy
      ? projectLegacyEconomy(legacyEconomy, { now })
      : createFreshEconomyState({ now });
    state.inventory = legacyEconomy
      ? projectLegacyInventory({ ...(legacyEconomy.inventory || {}), equipped: legacyEconomy.equipped })
      : createFreshInventoryState();
    state.schemaVersion = 2;
  }
  if (state.schemaVersion === 2) {
    if (!state.progress || typeof state.progress !== "object") state.progress = { completedJobCount: 0 };
    state.progress.cleanup = normalizeCleanupState(state.progress.cleanup);
    state.schemaVersion = 3;
  }
  if (state.schemaVersion === 3) {
    state.world = normalizeWorldState(state.world, { now });
    state.schemaVersion = 4;
  }
  if (state.schemaVersion === 4) {
    state.npcs = normalizeNpcState(state.npcs);
    state.schemaVersion = 5;
  }
  if (state.schemaVersion === 5) {
    state.customResident = normalizeCustomResidentState(state.customResident);
    state.schemaVersion = 6;
  }
  if (state.schemaVersion === 6) {
    state.farming = normalizeFarmingState(state.farming, state.world);
    if (!state.inventory?.consumables?.["carrot-seeds"] && !state.farming.allotment.beds.some((bed) => bed.cropId)) state.inventory.consumables["carrot-seeds"] = 1;
    state.schemaVersion = 7;
  }
  if (state.schemaVersion === 7) {
    state.animals = normalizeAnimalState(state.animals, state.world);
    state.schemaVersion = 8;
  }
  if (state.schemaVersion === 8) {
    state.fishing = normalizeFishingState(state.fishing, state.world);
    state.schemaVersion = 9;
  }
  if (state.schemaVersion === 9) {
    state.bakery = normalizeBakeryState(state.bakery);
    state.schemaVersion = 10;
  }
  if (state.schemaVersion === 10) {
    state.cafe = normalizeCafeState(state.cafe);
    state.schemaVersion = 11;
  }
  if (state.schemaVersion === 11) {
    state.river = normalizeRiverState(state.river ?? state.legacySnapshot);
    state.schemaVersion = 12;
  }
  if (state.schemaVersion === 12) {
    state.houseRescue = normalizeHouseRescueState(state.houseRescue ?? state.legacySnapshot, { worldDay: state.world?.day });
    state.schemaVersion = 13;
  }
  if (state.schemaVersion === 13) {
    state.progress.cleanup = state.source?.kind === "legacy-import"
      ? projectLegacyCleanup(state.legacySnapshot, state.progress.cleanup)
      : normalizeCleanupState(state.progress.cleanup);
    state.schemaVersion = 14;
  }
  if (state.schemaVersion === 14) {
    state.lawnCare = state.source?.kind === "legacy-import"
      ? projectLegacyLawnCare(state.legacySnapshot, state.lawnCare)
      : normalizeLawnCareState(state.lawnCare);
    state.schemaVersion = 15;
  }
  if (state.schemaVersion === 15) {
    state.beachCleanup = state.source?.kind === "legacy-import"
      ? projectLegacyBeachCleanup(state.legacySnapshot, state.beachCleanup)
      : normalizeBeachCleanupState(state.beachCleanup);
    state.schemaVersion = 16;
  }
  if (state.schemaVersion === 16) {
    state.playgroundPowerwash = state.source?.kind === "legacy-import"
      ? projectLegacyPlaygroundPowerwash(state.legacySnapshot, state.playgroundPowerwash)
      : normalizePlaygroundPowerwashState(state.playgroundPowerwash);
    state.schemaVersion = 17;
  }
  if (state.schemaVersion === 17) {
    state.morningMug = state.source?.kind === "legacy-import"
      ? projectLegacyMorningMug(state.legacySnapshot?.morningMug ?? state.morningMug)
      : normalizeMorningMugState(state.morningMug);
    state.schemaVersion = 18;
  }
  if (state.schemaVersion === 18) {
    state.riversideKitchen = state.source?.kind === "legacy-import"
      ? projectLegacyRiversideKitchen(state.legacySnapshot?.riversideKitchen ?? state.riversideKitchen)
      : normalizeRiversideKitchenState(state.riversideKitchen);
    state.schemaVersion = 19;
  }
  if (state.schemaVersion === 19) {
    state.southShoreScoops = state.source?.kind === "legacy-import"
      ? projectLegacySouthShoreScoops(state.legacySnapshot?.southShoreScoops ?? state.legacySnapshot?.scoops ?? state.southShoreScoops)
      : normalizeSouthShoreScoopsState(state.southShoreScoops);
    state.schemaVersion = 20;
  }
  if (state.schemaVersion === 20) {
    state.inventory = normalizeInventoryState(state.inventory);
    state.schemaVersion = 21;
  }
  if (state.schemaVersion === 21) {
    state.townPlacement = state.source?.kind === "legacy-import"
      ? projectLegacyTownPlacement(state.legacySnapshot, state.inventory, { now })
      : normalizeTownPlacementState(state.townPlacement, { inventory: state.inventory, now });
    state.schemaVersion = 22;
  }
  if (state.schemaVersion === 22) {
    const currentFarming = normalizeFarmingState(state.farming, state.world);
    if (state.source?.kind === "legacy-import") {
      const importedFarming = projectLegacyFarming(state.legacySnapshot, state.world);
      if (importedFarming.orchard.trees.length > currentFarming.orchard.trees.length || importedFarming.orchard.purchasedSaplings > 0) {
        currentFarming.orchard = importedFarming.orchard;
      }
    }
    state.farming = currentFarming;
    state.schemaVersion = 23;
  }
  if (state.schemaVersion === 23) {
    state.farming = normalizeFarmingState(state.farming, state.world);
    state.environment = state.source?.kind === "legacy-import"
      ? projectLegacyLivingEnvironment(state.legacySnapshot, state.world)
      : normalizeLivingEnvironmentState(state.environment, state.world);
    state.schemaVersion = 24;
  }
  if (state.schemaVersion === 24) {
    state.npcs = state.source?.kind === "legacy-import"
      ? projectLegacyNpcState(state.legacySnapshot, state.world)
      : normalizeNpcState(state.npcs, state.world);
    state.schemaVersion = 25;
  }
  if (state.schemaVersion === 25) {
    state.townPlacement = normalizeTownPlacementState(state.townPlacement, { inventory: state.inventory, now });
    state.npcs = normalizeNpcState(state.npcs, state.world);
    state.municipalCollection = state.source?.kind === "legacy-import"
      ? projectLegacyMunicipalCollection(state.legacySnapshot, state.world)
      : normalizeMunicipalCollectionState(state.municipalCollection, state.world);
    state.schemaVersion = 26;
  }
  if (state.schemaVersion === 26) {
    state.restorationMilestones = state.source?.kind === "legacy-import"
      ? projectLegacyRestorationMilestoneState(state.legacySnapshot, state)
      : normalizeRestorationMilestoneState(state.restorationMilestones);
    state.schemaVersion = 27;
  }
  if (state.schemaVersion === 27) {
    const currentResident = normalizeCustomResidentState(state.customResident);
    if (state.source?.kind === "legacy-import") {
      const projected = projectLegacyCustomResident(state.legacySnapshot);
      if (!currentResident.profile && projected.profile) currentResident.profile = projected.profile;
      const legacyHome = state.legacySnapshot?.playerSetup?.home
        || state.legacySnapshot?.economy?.kindlyClub?.creatorProfile?.home;
      if (legacyHome && typeof legacyHome === "object") currentResident.home = normalizePersonalHome(legacyHome);
    }
    state.customResident = currentResident;
    // Replace the old temporary house-19 render alias with the original
    // house-20 identity while preserving all real neighbour-home records.
    state.houseRescue = normalizeHouseRescueState(state.houseRescue, { worldDay: state.world?.day });
    state.schemaVersion = 28;
  }
  if (state.schemaVersion === 28) {
    state.homeInteriors = state.source?.kind === "legacy-import"
      ? projectLegacyHomeInteriors(state.legacySnapshot)
      : normalizeHomeInteriorState(state.homeInteriors);
    state.schemaVersion = 29;
  }
  if (state.schemaVersion === 29) {
    state.fishing = state.source?.kind === "legacy-import"
      ? projectLegacyFishing(state.legacySnapshot?.fishing, state.legacySnapshot?.magnetFishing, state.world)
      : normalizeFishingState(state.fishing, state.world);
    reconcileAquariumHousingInto(state, { reason: "A placed home fish tank was not available after the Milestone 33 save upgrade", now });
    state.schemaVersion = 30;
  }
  if (state.schemaVersion === 30) {
    state.homeownerGifts = state.source?.kind === "legacy-import"
      ? projectLegacyHomeownerGiftState(state.legacySnapshot, state.inventory)
      : normalizeHomeownerGiftState(state.homeownerGifts, state.inventory);
    state.schemaVersion = 31;
  }
  return state;
}

export function validateGameState(value) {
  const errors = [];
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ok: false, errors: ["Game state must be an object."] };
  }
  if (value.schemaVersion !== GAME_STATE_SCHEMA_VERSION) errors.push("Unsupported game-state schema version.");
  if (!isoTime(value.createdAt)) errors.push("createdAt must be an ISO-compatible timestamp.");
  if (!isoTime(value.updatedAt)) errors.push("updatedAt must be an ISO-compatible timestamp.");
  if (!value.source || !["new", "legacy-import"].includes(value.source.kind)) errors.push("State source is invalid.");
  if (!value.identity || typeof value.identity.townName !== "string" || !value.identity.townName.trim()) errors.push("Town name is missing.");
  errors.push(...validateWorldState(value.world).errors);
  if (!value.player || !Number.isFinite(value.player.x) || !Number.isFinite(value.player.y)) errors.push("Player position is invalid.");
  else if (value.player.x < 0 || value.player.x > WORLD.width || value.player.y < 0 || value.player.y > WORLD.height) errors.push("Player position is outside the authored world.");
  if (!DIRECTIONS.has(value.player?.facing)) errors.push("Player facing direction is invalid.");
  if (typeof value.player?.scene !== "string" || !value.player.scene) errors.push("Player scene is missing.");
  if (!Number.isInteger(value.progress?.completedJobCount) || value.progress.completedJobCount < 0) errors.push("Completed-job count is invalid.");
  errors.push(...validateCleanupState(value.progress?.cleanup).errors);
  const activeCleanup = value.progress?.cleanup?.activeSession;
  if (activeCleanup?.environmentJob) {
    const activeLandIds = new Set((value.environment?.land?.items || []).filter((item) => item.active).map((item) => item.id));
    if (!activeCleanup.itemIds?.includes(activeCleanup.targetId) || activeCleanup.itemIds?.some((id) => !activeLandIds.has(id))) errors.push("Active environmental cleanup no longer matches persistent land litter.");
  }
  errors.push(...validateEconomyState(value.economy).errors);
  errors.push(...validateInventoryState(value.inventory).errors);
  errors.push(...validateTownPlacementState(value.townPlacement).errors);
  errors.push(...validateNpcState(value.npcs, value.world).errors);
  errors.push(...validateMunicipalCollectionState(value.municipalCollection).errors);
  errors.push(...validateRestorationMilestoneState(value.restorationMilestones).errors);
  errors.push(...validateCustomResidentState(value.customResident).errors);
  errors.push(...validateHomeInteriorState(value.homeInteriors).errors);
  errors.push(...validateFarmingState(value.farming, value.world).errors);
  errors.push(...validateLivingEnvironmentState(value.environment, value.world).errors);
  errors.push(...validateAnimalState(value.animals, value.world).errors);
  errors.push(...validateFishingState(value.fishing, value.world).errors);
  errors.push(...validateAquariumHousing(value).errors);
  errors.push(...validateHomeownerGiftState(value.homeownerGifts, value.inventory).errors);
  errors.push(...validateBakeryState(value.bakery).errors);
  errors.push(...validateCafeState(value.cafe).errors);
  errors.push(...validateRiverState(value.river).errors);
  errors.push(...validateHouseRescueState(value.houseRescue).errors);
  errors.push(...validateLawnCareState(value.lawnCare).errors);
  errors.push(...validateBeachCleanupState(value.beachCleanup).errors);
  errors.push(...validatePlaygroundPowerwashState(value.playgroundPowerwash).errors);
  errors.push(...validateMorningMugState(value.morningMug).errors);
  errors.push(...validateRiversideKitchenState(value.riversideKitchen).errors);
  errors.push(...validateSouthShoreScoopsState(value.southShoreScoops).errors);
  if (value.source?.kind === "legacy-import") {
    if (!Number.isInteger(value.source.legacyVersion)) errors.push("Imported legacy version is missing.");
    if (typeof value.source.legacySourceKey !== "string") errors.push("Imported legacy source key is missing.");
    if (!value.legacySnapshot || typeof value.legacySnapshot !== "object") errors.push("Imported legacy snapshot is missing.");
  }
  return { ok: errors.length === 0, errors };
}

export class GameStateService {
  constructor(initialState = createFreshGameState()) {
    const upgraded = upgradeGameState(initialState);
    const validation = validateGameState(upgraded);
    if (!validation.ok) throw new TypeError(validation.errors.join(" "));
    this.state = structuredClone(upgraded);
    this.listeners = new Set();
  }

  getSnapshot() {
    return structuredClone(this.state);
  }

  replace(nextState) {
    const validation = validateGameState(nextState);
    if (!validation.ok) return validation;
    this.state = structuredClone(nextState);
    const snapshot = this.getSnapshot();
    for (const listener of this.listeners) listener(snapshot);
    return { ok: true, state: snapshot };
  }

  subscribe(listener) {
    if (typeof listener !== "function") throw new TypeError("A state listener must be a function.");
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  updatePlayer({ scene, x, y, facing }, { now = Date.now() } = {}) {
    const next = this.getSnapshot();
    if (typeof scene === "string" && scene) next.player.scene = scene;
    if (Number.isFinite(x)) next.player.x = Number(x);
    if (Number.isFinite(y)) next.player.y = Number(y);
    if (DIRECTIONS.has(facing)) next.player.facing = facing;
    next.updatedAt = isoTime(now) || next.updatedAt;
    return this.replace(next);
  }
}
