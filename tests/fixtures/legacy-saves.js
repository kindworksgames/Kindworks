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

export function invalidSealFixture() {
  const value = structuredClone(legacyFixtures.currentV82);
  value.worldDay += 1;
  return value;
}
