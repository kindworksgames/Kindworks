import { checksumValue } from "./checksum.js";

export const LEGACY_RECONCILIATION_SCHEMA_VERSION = 1;

export const LEGACY_DOMAIN_OWNERS = Object.freeze({
  economy: "economy",
  inventory: "inventory",
  objectPlacement: "townPlacement",
  cropsAndTrees: "farming",
  homesAndFurniture: "customResident + homeInteriors",
  aquarium: "fishing.aquariumByItem + homeInteriors",
  animalsAndPets: "animals",
  restoration: "restorationMilestones",
  businessStock: "harbourGeneral",
  gifts: "homeownerGifts",
  npcNarratives: "npcs.residents[].narrativeState",
  campaignProgress: "progress + game campaign states",
  duplicateRewards: "campaign completion + processed event histories",
});

const CAMPAIGN_FIELDS = Object.freeze({
  waste: ["progress", "cleanup", "progress", "waste", "best"],
  lawn: ["lawnCare", "progress", "best"],
  river: ["river", "best"],
  houseRescue: ["houseRescue", "best"],
  beach: ["beachCleanup", "progress", "best"],
  playground: ["playgroundPowerwash", "progress", "best"],
  bakery: ["bakery", "completed"],
  cafe: ["cafe", "completed"],
  morningMug: ["morningMug", "completed"],
  riversideKitchen: ["riversideKitchen", "completed"],
  southShoreScoops: ["southShoreScoops", "completed"],
});

const EARLY_LAWN_ID_MAP = Object.freeze({
  "lawn-09": "lawn-11",
  "lawn-10": "lawn-12",
  "lawn-11": "lawn-09",
  "lawn-12": "lawn-10",
});

const COUNT_KEYS = Object.freeze([
  "coinLedger", "inventoryItems", "unresolvedInventory", "townPlacements", "cropBeds", "orchardTrees",
  "furniturePlacements", "aquariumFish", "adoptedAnimals", "unlockedRestorations", "businessStock",
  "homeownerGifts", "narrativeStages",
]);

function whole(value, minimum = 0, maximum = Number.MAX_SAFE_INTEGER) {
  const number = Math.floor(Number(value));
  return Number.isFinite(number) ? Math.max(minimum, Math.min(maximum, number)) : minimum;
}

function objectAt(value, path) {
  return path.reduce((current, key) => current?.[key], value);
}

function completedLevelNumbers(state, path) {
  const records = objectAt(state, path);
  if (!records || typeof records !== "object" || Array.isArray(records)) return [];
  return Object.entries(records)
    .filter(([key, record]) => {
      const level = Number(key);
      if (!Number.isInteger(level) || level < 1) return false;
      if (record === true) return true;
      const percent = Number(record?.percent ?? record?.bestPercent);
      return Number.isFinite(percent) ? percent >= 50 : Boolean(record);
    })
    .map(([key]) => Number(key))
    .sort((a, b) => a - b);
}

function compressLevelRanges(levels) {
  const ranges = [];
  for (const level of levels) {
    const last = ranges.at(-1);
    if (last && level === last[1] + 1) last[1] = level;
    else if (!last || level > last[1]) ranges.push([level, level]);
  }
  return ranges;
}

function inventoryCount(inventory) {
  return ["equipment", "placeables", "consumables", "furniture"]
    .reduce((total, bucket) => total + Object.values(inventory?.[bucket] || {}).reduce((sum, value) => sum + whole(value), 0), 0);
}

function stableHomeId(value) {
  const match = String(value || "").match(/^(?:home|house-?)0*(\d+)$/i);
  if (!match) return String(value || "");
  const number = Number(match[1]);
  return `house-${number === 19 ? 20 : number}`;
}

export function canonicalizeLegacySave(value) {
  const legacy = structuredClone(value || {});
  const mappings = [];
  const version = whole(legacy.version);

  if (version <= 15 && legacy.lawns && typeof legacy.lawns === "object" && !Array.isArray(legacy.lawns)) {
    const remapped = {};
    for (const [id, lawn] of Object.entries(legacy.lawns)) {
      const targetId = EARLY_LAWN_ID_MAP[id] || id;
      remapped[targetId] = lawn;
      if (targetId !== id) mappings.push({ domain: "cropsAndTrees", from: id, to: targetId });
    }
    legacy.lawns = remapped;
  }

  const furniture = legacy.homeFurniture || legacy.homeFurnitureState;
  if (furniture && typeof furniture === "object") {
    if (legacy.homeFurnitureState && !legacy.homeFurniture) legacy.homeFurniture = furniture;
    if (Array.isArray(furniture.placements)) {
      furniture.placements = furniture.placements.map((placement, index) => {
        if (placement?.id) return placement;
        const id = `legacy-home-furniture-${index + 1}`;
        mappings.push({ domain: "homesAndFurniture", from: `(missing-${index + 1})`, to: id });
        return { ...placement, id };
      });
    }
    if (furniture.visits && typeof furniture.visits === "object" && !Array.isArray(furniture.visits)) {
      const visits = {};
      for (const [id, visit] of Object.entries(furniture.visits)) {
        const targetId = stableHomeId(id);
        visits[targetId] = visit;
        if (targetId !== id) mappings.push({ domain: "homesAndFurniture", from: id, to: targetId });
      }
      furniture.visits = visits;
    }
  }

  if (legacy.houseRescue?.homes?.["house-19"] && !legacy.houseRescue.homes["house-20"]) {
    legacy.houseRescue.homes["house-20"] = { ...legacy.houseRescue.homes["house-19"], houseId: "house-20" };
    delete legacy.houseRescue.homes["house-19"];
    mappings.push({ domain: "homesAndFurniture", from: "house-19", to: "house-20" });
  }

  const placements = legacy.economy?.placedObjects;
  if (Array.isArray(placements)) {
    legacy.economy.placedObjects = placements.map((placement, index) => {
      if (placement?.id) return placement;
      const id = `legacy-town-object-${index + 1}`;
      mappings.push({ domain: "objectPlacement", from: `(missing-${index + 1})`, to: id });
      return { ...placement, id };
    });
  }

  if (!legacy.southShoreScoops && legacy.scoops) {
    legacy.southShoreScoops = legacy.scoops;
    mappings.push({ domain: "campaignProgress", from: "scoops", to: "southShoreScoops" });
  }
  if (!legacy.miniGames && legacy.miniGameProgress) legacy.miniGames = { progress: legacy.miniGameProgress };
  else if (legacy.miniGames && !legacy.miniGames.progress && legacy.miniGameProgress) legacy.miniGames.progress = legacy.miniGameProgress;

  return { legacy, mappings };
}

export function createLegacyReconciliationState(legacy, state, {
  now = Date.now(),
  mappings = [],
  sourceVersion = null,
} = {}) {
  const campaignClaims = Object.fromEntries(Object.entries(CAMPAIGN_FIELDS).map(([key, path]) => {
    const levels = completedLevelNumbers(state, path);
    return [key, { count: levels.length, ranges: compressLevelRanges(levels) }];
  }));
  const adoptedAnimals = Object.values(state?.animals?.residents || {}).filter((resident) => resident.adopted).length;
  const narrativeStages = (state?.npcs?.residents || []).reduce((sum, resident) => sum + whole(resident?.narrativeState?.storyStage), 0);
  const aquariumFish = Object.values(state?.fishing?.aquariumByItem || {}).reduce((sum, value) => sum + whole(value), 0);
  const unlockedRestorations = Object.values(state?.restorationMilestones?.unlocked || {}).filter(Boolean).length;
  const businessStock = Object.values(state?.harbourGeneral?.stock || {}).reduce((sum, value) => sum + whole(value), 0);
  const sourceCopy = structuredClone(legacy || {});
  delete sourceCopy.integritySeal;

  return {
    schemaVersion: LEGACY_RECONCILIATION_SCHEMA_VERSION,
    sourceVersion: whole(legacy?.version ?? sourceVersion, 12, 82),
    sourceFingerprint: checksumValue(sourceCopy, "kw-legacy-reconciliation"),
    reconciledAt: new Date(now).toISOString(),
    htmlKeysReadOnly: true,
    domainOwners: { ...LEGACY_DOMAIN_OWNERS },
    stableIdMappings: mappings.map((entry) => ({ domain: entry.domain, from: String(entry.from), to: String(entry.to) })),
    counts: {
      coinLedger: state?.economy?.ledger?.length || 0,
      inventoryItems: inventoryCount(state?.inventory),
      unresolvedInventory: state?.inventory?.unresolvedLegacy?.length || 0,
      townPlacements: state?.townPlacement?.objects?.length || 0,
      cropBeds: state?.farming?.allotment?.beds?.filter((bed) => bed.cropId)?.length || 0,
      orchardTrees: state?.farming?.orchard?.trees?.length || 0,
      furniturePlacements: state?.homeInteriors?.placements?.length || 0,
      aquariumFish,
      adoptedAnimals,
      unlockedRestorations,
      businessStock,
      homeownerGifts: state?.homeownerGifts?.history?.length || 0,
      narrativeStages,
    },
    duplicateProtection: {
      campaignClaims,
      starterGrantClaimed: Boolean(state?.onboarding?.starterGrantClaimed),
      firstRestorationGiftGranted: Boolean(state?.restorationMilestones?.firstRestorationGift?.granted),
      homeownerGiftEventIds: [...(state?.homeownerGifts?.processedEventIds || [])],
      restorationEventIds: [...(state?.restorationMilestones?.processedEventIds || [])],
      commerceFulfilmentIds: [...new Set([
        ...(state?.commerce?.processedTransactions || []),
        ...(state?.commerce?.processedPeriods || []),
      ])],
    },
  };
}

export function validateLegacyReconciliationState(value, { source = null, legacySnapshot = null } = {}) {
  const errors = [];
  if (source?.kind === "new") {
    if (value !== null) errors.push("New games must not contain a legacy reconciliation record.");
    return { ok: errors.length === 0, errors };
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return { ok: false, errors: ["Imported games require a legacy reconciliation record."] };
  if (value.schemaVersion !== LEGACY_RECONCILIATION_SCHEMA_VERSION) errors.push("Legacy reconciliation schema version is invalid.");
  if (!Number.isInteger(value.sourceVersion) || value.sourceVersion < 12 || value.sourceVersion > 82) errors.push("Legacy reconciliation source version is invalid.");
  if (value.sourceVersion !== source?.legacyVersion) errors.push("Legacy reconciliation source version does not match the imported save.");
  if (!/^kw-legacy-reconciliation-[0-9a-f]{16}$/.test(value.sourceFingerprint || "")) errors.push("Legacy reconciliation fingerprint is invalid.");
  if (legacySnapshot && typeof legacySnapshot === "object") {
    const sourceCopy = structuredClone(legacySnapshot);
    delete sourceCopy.integritySeal;
    if (value.sourceFingerprint !== checksumValue(sourceCopy, "kw-legacy-reconciliation")) errors.push("Legacy reconciliation fingerprint does not match the retained source snapshot.");
  }
  if (Number.isNaN(new Date(value.reconciledAt).getTime())) errors.push("Legacy reconciliation time is invalid.");
  if (value.htmlKeysReadOnly !== true) errors.push("Legacy HTML save keys must remain read-only.");
  if (JSON.stringify(value.domainOwners) !== JSON.stringify(LEGACY_DOMAIN_OWNERS)) errors.push("Legacy domain ownership map is incomplete.");
  if (!Array.isArray(value.stableIdMappings) || value.stableIdMappings.some((entry) => !LEGACY_DOMAIN_OWNERS[entry?.domain] || !String(entry.from || "") || !String(entry.to || ""))) errors.push("Legacy stable-ID mappings are invalid.");
  if (!value.counts || COUNT_KEYS.some((key) => !Number.isSafeInteger(value.counts[key]) || value.counts[key] < 0)) errors.push("Legacy reconciliation counts are invalid.");
  const campaigns = value.duplicateProtection?.campaignClaims;
  if (!campaigns || Object.keys(CAMPAIGN_FIELDS).some((key) => !Array.isArray(campaigns[key]?.ranges) || !Number.isInteger(campaigns[key]?.count))) errors.push("Legacy campaign reward claims are incomplete.");
  else for (const claim of Object.values(campaigns)) {
    let previousEnd = 0;
    let count = 0;
    for (const range of claim.ranges) {
      if (!Array.isArray(range) || range.length !== 2 || !Number.isInteger(range[0]) || !Number.isInteger(range[1]) || range[0] < 1 || range[1] < range[0] || range[0] <= previousEnd) {
        errors.push("Legacy campaign reward ranges are invalid.");
        break;
      }
      count += range[1] - range[0] + 1;
      previousEnd = range[1];
    }
    if (count !== claim.count) errors.push("Legacy campaign reward count does not match its ranges.");
  }
  for (const key of ["homeownerGiftEventIds", "restorationEventIds", "commerceFulfilmentIds"]) {
    const ids = value.duplicateProtection?.[key];
    if (!Array.isArray(ids) || new Set(ids).size !== ids.length || ids.some((id) => typeof id !== "string" || !id)) errors.push(`Legacy ${key} replay protection is invalid.`);
  }
  for (const key of ["starterGrantClaimed", "firstRestorationGiftGranted"]) if (typeof value.duplicateProtection?.[key] !== "boolean") errors.push(`Legacy ${key} replay protection is invalid.`);
  return { ok: errors.length === 0, errors };
}
