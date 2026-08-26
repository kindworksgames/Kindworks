import { legacyIntegritySeal } from "../../src/state/checksum.js";

function seal(value) {
  const fixture = structuredClone(value);
  fixture.integritySeal = legacyIntegritySeal(fixture);
  return fixture;
}

function economy(coins, spent = 0) {
  return {
    schemaVersion: 7,
    coins,
    lifetimeCoinsEarned: coins + spent,
    lifetimeCoinsSpent: spent,
    telemetry: {},
    ledger: [],
    inventory: {
      equipment: { "starter-mower": 1, "starter-vacuum": 1 },
      placeables: {},
      consumables: {},
      furniture: {},
    },
    equipped: { mower: "starter-mower", vacuum: "starter-vacuum" },
    placedObjects: [],
  };
}

function legacy(version, overrides = {}, { sealed = false } = {}) {
  const fixture = {
    version,
    savedAt: 1767225600000,
    worldDay: Math.max(1, Math.floor(version / 4)),
    worldClockMinutes: 510,
    completedJobCount: Math.max(0, version - 12),
    npcs: [],
    lawns: {},
    litter: [],
    riverGarbage: [],
    ...overrides,
  };
  return sealed ? seal(fixture) : fixture;
}

export const legacyFixtures = Object.freeze({
  newPlayerV12: legacy(12, { worldDay: 1, completedJobCount: 0 }),
  earlyV23: legacy(23, { economy: economy(100) }),
  midV38: legacy(38, { economy: economy(850, 250), milestones: { unlocked: { village: true } } }),
  farmingV60: legacy(60, { economy: economy(3200, 900), farmingFoundation: { schemaVersion: 3 } }),
  lateV75: legacy(75, { economy: economy(12400, 4600), weather: { schemaVersion: 1, kind: "rain" }, harbourGeneral: { schemaVersion: 1 } }),
  currentV82: legacy(82, {
    worldDay: 42,
    worldClockMinutes: 905,
    completedJobCount: 71,
    playerSetup: { townName: "Test Willow", townNamed: true, complete: true },
    economy: economy(24800, 9200),
    animals: { animals: [], activeAnimalId: null },
    npcNarratives: {},
    southShoreScoops: { unlockedLevel: 12 },
  }, { sealed: true }),
  completedV82: legacy(82, {
    worldDay: 280,
    worldClockMinutes: 1200,
    completedJobCount: 1500,
    playerSetup: { townName: "QA Completion", townNamed: true, complete: true },
    economy: economy(999999, 250000),
    animals: { animals: [], activeAnimalId: null },
    miniGames: { progress: {}, active: null, recovery: null, history: [] },
  }, { sealed: true }),
  partialV82: legacy(82, { worldDay: 7, economy: economy(300) }, { sealed: true }),
});

export const legacyVersionFixtures = Object.freeze(Array.from(
  { length: 82 - 12 + 1 },
  (_, index) => {
    const version = index + 12;
    return legacy(version, version >= 23 ? { economy: economy(100 + version) } : {});
  },
));

export const reconciliationV82 = seal(legacy(82, {
  worldDay: 42,
  worldClockMinutes: 905,
  completedJobCount: 71,
  playerSetup: {
    townName: "Reconciled Willow",
    townNamed: true,
    complete: true,
    home: { level: 3, wallColor: "sage", roofStyle: "hip", roofColor: "slate" },
  },
  economy: {
    ...economy(50_000, 12_000),
    ledger: [{ id: "legacy-ledger-1", amount: -800, kind: "purchase", reason: "Town planter", itemId: "town-planter", quantity: 1, balance: 50_000, at: 1767225600000 }],
    inventory: {
      equipment: { "starter-mower": 1, "starter-vacuum": 1, "swiftcut-mower": 1 },
      placeables: { "town-planter": 2 },
      consumables: { "carrot-seeds": 7, "mixed-seeds": 3 },
      furniture: { "cosy-sofa": 1 },
    },
    equipped: { mower: "swiftcut-mower", vacuum: "starter-vacuum" },
    placedObjects: [{ id: "legacy-planter-7", itemId: "town-planter", x: 123.25, y: 105.75, rotation: 1.234, placedAt: 1767225600000 }],
    kindlyClub: { creatorProfile: { name: "Robin", skin: "warm", hair: 1, hairColor: "dark-brown", accessory: "none", outfit: 2, bodyBuild: "average", hobbies: ["gardening"] } },
    processedCoinTransactions: ["legacy-purchase-1"],
    processedKindlyPeriods: ["legacy-subscription::2026-08"],
  },
  farmingFoundation: {
    schemaVersion: 3,
    orchard: { treeSerial: 8, purchasedSaplings: 1, slots: [
      { id: "apple-tree-2", treeType: "apple", x: 444, y: 555, status: "mature", availableFruit: 1, harvests: 3 },
      { id: "apple-tree-8", treeType: "apple", x: 777, y: 888, status: "growing", plantedAtGameMinute: 0, maturesAtGameMinute: 60_000 },
    ] },
    allotment: { beds: [{ unlocked: true, cropId: "fresh-greens", status: "ready", harvests: 2 }] },
    seedInventory: { "carrot-seeds": 7, "fresh-greens-seeds": 4, "wild-berry-starters": 2 },
  },
  homeFurniture: {
    serial: 9,
    placements: [{ id: "home-furniture-9", itemId: "ornamental-fish-tank", rx: 0.5, ry: 0.5, rotation: 0, placedAt: 1767225600000 }],
    visits: { home20: { count: 4, inspections: 2, lastVisitedAt: 1767225600000, lastClean: true } },
  },
  fishing: {
    day: 42, castsToday: 2, caughtToday: 2, totalCasts: 20, totalCaught: 15, currentStreak: 2, bestStreak: 5,
    caughtByItem: { "river-minnows": 8, "pond-goldfish": 2 },
    aquariumByItem: { "pond-goldfish": 2, "reedbank-koi": 1, "pond-angelfish": 0, "oranda-goldfish": 0 },
    releasedByItem: { "pond-goldfish": 1 },
  },
  animals: {
    activeAnimalId: "animal-dog-1",
    animals: [{ id: "animal-dog-1", name: "Bramble", adopted: true, active: true, friendliness: 80, lastFedDay: 40 }],
  },
  milestones: {
    unlocked: { wake: true, commons: true }, revealed: { wake: true, commons: true }, unlockDay: { wake: 9, commons: 12 },
    counters: { totalAccepted: 12, cleanupByType: { lawn: 5, river: 3, waste: 4 }, perfectByType: { lawn: 2, river: 1, waste: 4 }, zones: { commons: 3, highstreet: 0, station: 0, shore: 0 } },
  },
  onboarding: { tutorialSeen: { lawn: true }, tried: { lawn: true }, firstRestorationGiftGranted: true },
  homeownerGifts: {
    format: 2, misses: 3, totalGifts: 1, totalGiftValueReceived: 800,
    households: { home01: { lastGiftDay: 40, lastLawnDay: 39, lastHouseDay: 40, giftsGiven: 1 } },
    processedEventIds: ["homeowner:legacy:gift-1"],
    history: [{ id: "gift-legacy-1", eventId: "homeowner:legacy:gift-1", source: "house-rescue", houseId: "house-1", ownerId: "npc-01", ownerName: "Maya", itemId: "town-planter", rolledTier: "small", fullCare: true, pity: false, day: 40, at: 1767225600000, dialogue: "Thank you for helping our home.", revealed: true }],
    queue: [],
  },
  harbourGeneral: {
    schemaVersion: 1, owned: true, purchasedDay: 20, slots: ["umbrella", "newspaper", "tissues", null, null, null],
    stock: { umbrella: 8, newspaper: 12, tissues: 4 }, tillCoins: 750, lifetimeGross: 2400, lifetimeStockSpend: 1200, lifetimeSales: 18, lostSales: 2,
    salesByItem: { umbrella: 3, newspaper: 10, tissues: 5 }, recentSales: [{ npcId: "npc-01", npcName: "Maya", itemId: "umbrella", day: 41, price: 190, weather: "rain" }],
  },
  npcNarratives: {
    "npc-01": { schemaVersion: 3, storyStage: 2, storyFlags: { cafeOpened: true }, selectionCount: 5, selectedDays: [2, 3, 5], stageAdvancedAtDay: 5, lastSelectedDay: 5, lastThoughtId: "maya-legacy-thought", lastThoughtText: "A preserved thought about the café.", lastThoughtCategory: "story", recentThoughtIds: ["maya-legacy-thought"] },
  },
  miniGames: { progress: {
    waste: { nextLevel: 3, completed: 2, best: { 1: { stars: 3, percent: 100 }, 2: { stars: 2, percent: 80 } } },
    lawn: { nextLevel: 2, completed: 1, best: { 1: { stars: 3, percent: 100 } } },
    river: { nextLevel: 2, completed: 1, best: { 1: { stars: 3, percent: 100 } } },
    beach: { nextLevel: 2, completed: 1, best: { 1: { stars: 3, percent: 100 } } },
    playground: { nextLevel: 2, completed: 1, best: { 1: { stars: 3, percent: 100 } } },
  } },
  bakery: { unlockedLevel: 2, completed: { 1: true }, best: { 1: { score: 95, stars: 3, served: 4, accuracy: 100 } } },
  cafe: { unlockedLevel: 2, completed: { 1: true }, best: { 1: { score: 90, stars: 3, served: 4, accuracy: 100 } } },
  morningMug: { unlockedLevel: 2, completed: { 1: true }, best: { 1: { score: 90, stars: 3, served: 4, accuracy: 100 } } },
  riversideKitchen: { unlockedLevel: 2, completed: { 1: true }, best: { 1: { score: 90, stars: 3, served: 4, accuracy: 100 } } },
  southShoreScoops: { unlockedLevel: 2, completed: { 1: true }, best: { 1: { score: 1000, stars: 3, served: 4, accuracy: 100 } } },
}));

export function invalidSealFixture() {
  const value = structuredClone(legacyFixtures.currentV82);
  value.worldDay += 1;
  return value;
}
