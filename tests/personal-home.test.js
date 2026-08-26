import test from "node:test";
import assert from "node:assert/strict";
import {
  PERSONAL_HOME_HOUSE_ID,
  PERSONAL_HOME_LEVELS,
  PERSONAL_HOME_NODE_ID,
  PERSONAL_HOME_REDESIGN_BASE_COSTS,
  PERSONAL_HOME_REDESIGN_LEVEL_MULTIPLIERS,
  personalHomeCapacity,
  personalHomeRedesignQuote,
} from "../src/data/customResident.js";
import { HOUSES } from "../src/data/town.js";
import { createFreshGameState, GameStateService, upgradeGameState, validateGameState } from "../src/state/GameState.js";
import { CUSTOM_RESIDENT_STATE_SCHEMA_VERSION, validateCustomResidentState } from "../src/state/customResidentState.js";
import { CustomResidentService } from "../src/systems/CustomResidentService.js";

class Repository {
  constructor(ok = true) {
    this.ok = ok;
    this.saves = [];
  }

  save(state) {
    if (!this.ok) return { ok: false, status: "fixture-failure" };
    this.saves.push(structuredClone(state));
    return { ok: true, status: "saved" };
  }
}

function residentDraft(home = {}) {
  return {
    name: "Meadow",
    skin: "warm",
    hair: 1,
    hairColor: "dark-brown",
    accessory: "badge",
    outfit: 1,
    bodyBuild: "average",
    hobbies: ["gardening", "nature", "helping"],
    home: { wallColor: "cream", roofStyle: "gable", roofColor: "terracotta", ...home },
  };
}

function runtime({ coins = 200_000, repository = new Repository() } = {}) {
  const state = createFreshGameState({ now: 0 });
  state.economy.coins = coins;
  state.economy.lifetimeCoinsEarned = coins;
  const gameState = new GameStateService(state);
  const service = new CustomResidentService(gameState, repository, { now: () => 1000 });
  assert.equal(service.saveProfile(residentDraft()).ok, true);
  return { gameState, service, repository };
}

test("Milestone 31 pins the four original levels, prices, scales and capacities", () => {
  assert.deepEqual(
    PERSONAL_HOME_LEVELS.map(({ level, name, scale, cost, capacity }) => [level, name, scale, cost, capacity]),
    [
      [1, "Small Starter Cottage", 0.68, 0, 1],
      [2, "Family Cottage", 0.86, 15_000, 2],
      [3, "Spacious Home", 1.04, 40_000, 3],
      [4, "Grand Home", 1.22, 90_000, 5],
    ],
  );
  assert.deepEqual(PERSONAL_HOME_REDESIGN_BASE_COSTS, { wallColor: 600, roofColor: 900, roofStyle: 2_200 });
  assert.deepEqual(PERSONAL_HOME_REDESIGN_LEVEL_MULTIPLIERS, [1, 1.35, 1.75, 2.25]);
  assert.deepEqual(PERSONAL_HOME_LEVELS.map((level) => personalHomeCapacity(level.level)), [1, 2, 3, 5]);
});

test("the town resolves the temporary render alias to house-20 while retaining 19 physical cottages", () => {
  assert.equal(HOUSES.length, 19);
  assert.equal(HOUSES.some((house) => house.id === "house-19"), false);
  assert.equal(HOUSES.at(-1).id, PERSONAL_HOME_HOUSE_ID);
  const state = createFreshGameState({ now: 0 });
  assert.equal(state.customResident.home.nodeId, PERSONAL_HOME_NODE_ID);
  assert.equal(state.customResident.home.houseId, PERSONAL_HOME_HOUSE_ID);
  assert.equal(state.customResident.schemaVersion, CUSTOM_RESIDENT_STATE_SCHEMA_VERSION);
  assert.equal(Object.keys(state.houseRescue.homes).length, 19);
  assert.equal(state.houseRescue.homes[PERSONAL_HOME_HOUSE_ID].dirty, false);
});

test("redesign quotes preserve the original per-level rounding to the nearest 50 coins", () => {
  const target = { level: 1, wallColor: "sage", roofColor: "forest", roofStyle: "gambrel" };
  const costs = PERSONAL_HOME_LEVELS.map(({ level }) => personalHomeRedesignQuote(
    { level, wallColor: "cream", roofColor: "terracotta", roofStyle: "gable" },
    { ...target, level },
    100_000,
  ));
  assert.deepEqual(costs.map((quote) => quote.changes.map((change) => change.cost)), [
    [600, 900, 2_200],
    [800, 1_200, 2_950],
    [1_050, 1_600, 3_850],
    [1_350, 2_050, 4_950],
  ]);
  assert.deepEqual(costs.map((quote) => quote.cost), [3_700, 4_950, 6_500, 8_350]);
});

test("the included first design is free and later profile edits cannot bypass paid home changes", () => {
  const { service } = runtime();
  assert.equal(service.getHomeProgression().home.level, 1);
  assert.equal(service.getHomeProgression().capacity, 1);
  assert.equal(service.upgradeHome({ wallColor: "sage", roofStyle: "hip", roofColor: "forest" }).ok, true);
  const upgraded = service.getHomeProgression().home;
  assert.deepEqual({ level: upgraded.level, wallColor: upgraded.wallColor, roofStyle: upgraded.roofStyle, roofColor: upgraded.roofColor }, { level: 2, wallColor: "sage", roofStyle: "hip", roofColor: "forest" });
  const profileEdit = service.saveProfile(residentDraft({ wallColor: "lavender", roofStyle: "gambrel", roofColor: "gold" }));
  assert.equal(profileEdit.ok, true);
  assert.deepEqual(service.getHomeProgression().home, upgraded);
});

test("a redesign debits once, records every priced change, and persists the exact design", () => {
  const { gameState, service, repository } = runtime();
  const quote = service.quoteHomeRedesign({ wallColor: "sage", roofStyle: "gambrel", roofColor: "forest" });
  assert.equal(quote.cost, 3_700);
  const result = service.redesignHome(quote.to);
  assert.equal(result.ok, true);
  assert.equal(result.code, "home-redesigned");
  const state = gameState.getSnapshot();
  assert.equal(state.economy.coins, 196_300);
  assert.equal(state.economy.lifetimeCoinsSpent, 3_700);
  assert.deepEqual(state.customResident.home, result.home);
  assert.equal(result.ledger.kind, "personal-home-redesign");
  assert.equal(result.ledger.balance, 196_300);
  assert.deepEqual(result.ledger.changes.map(({ key, cost }) => [key, cost]), [["wallColor", 600], ["roofColor", 900], ["roofStyle", 2_200]]);
  assert.deepEqual(repository.saves.at(-1).customResident.home, result.home);
  assert.equal(service.redesignHome(result.home).code, "design-unchanged");
  assert.equal(gameState.getSnapshot().economy.ledger.filter((entry) => entry.kind === "personal-home-redesign").length, 1);
});

test("all three paid upgrades are sequential, atomic and increase capacity to five", () => {
  const { gameState, service } = runtime();
  const results = [
    service.upgradeHome({ wallColor: "sage" }),
    service.upgradeHome({ roofColor: "forest" }),
    service.upgradeHome({ roofStyle: "gambrel" }),
  ];
  assert.deepEqual(results.map((result) => [result.cost, result.toLevel, result.capacity]), [[15_000, 2, 2], [40_000, 3, 3], [90_000, 4, 5]]);
  const state = gameState.getSnapshot();
  assert.equal(state.customResident.home.level, 4);
  assert.equal(state.economy.coins, 55_000);
  assert.equal(state.economy.lifetimeCoinsSpent, 145_000);
  assert.equal(service.getHomeProgression().capacity, 5);
  assert.equal(service.getHomeProgression().nextUpgrade, null);
  assert.equal(service.upgradeHome().code, "fully-upgraded");
  assert.deepEqual(state.economy.ledger.filter((entry) => entry.kind === "personal-home-upgrade").map((entry) => [entry.fromLevel, entry.toLevel, entry.fromCapacity, entry.toCapacity]), [[1, 2, 1, 2], [2, 3, 2, 3], [3, 4, 3, 5]]);
});

test("insufficient funds cannot change the home, balance or transaction ledger", () => {
  const { gameState, service } = runtime({ coins: 100 });
  const before = gameState.getSnapshot();
  const redesign = service.redesignHome({ wallColor: "sage" });
  assert.equal(redesign.code, "insufficient-funds");
  assert.equal(redesign.required, 600);
  assert.equal(service.upgradeHome().code, "insufficient-funds");
  assert.deepEqual(gameState.getSnapshot(), before);
});

test("a failed home save rolls the full home, economy and ledger checkpoint back", () => {
  const repository = new Repository(true);
  const { gameState, service } = runtime({ repository });
  const before = gameState.getSnapshot();
  repository.ok = false;
  const upgrade = service.upgradeHome({ wallColor: "rose" });
  assert.equal(upgrade.code, "persistence-failed");
  assert.deepEqual(gameState.getSnapshot(), before);
  const redesign = service.redesignHome({ roofColor: "navy" });
  assert.equal(redesign.code, "persistence-failed");
  assert.deepEqual(gameState.getSnapshot(), before);
});

test("schema 27 and legacy HTML homes convert to schema 28 without losing progress", () => {
  const old = createFreshGameState({ now: 0 });
  old.schemaVersion = 27;
  old.customResident.schemaVersion = 1;
  old.customResident.home.level = 3;
  old.customResident.home.wallColor = "lavender";
  old.houseRescue.homes["house-19"] = { ...old.houseRescue.homes["house-20"], houseId: "house-19" };
  delete old.houseRescue.homes["house-20"];
  const upgraded = upgradeGameState(old, { now: 1000 });
  assert.equal(upgraded.schemaVersion, 28);
  assert.equal(upgraded.customResident.schemaVersion, 2);
  assert.equal(upgraded.customResident.home.level, 3);
  assert.equal(upgraded.customResident.home.wallColor, "lavender");
  assert.equal(upgraded.houseRescue.homes["house-19"], undefined);
  assert.equal(upgraded.houseRescue.homes["house-20"].dirty, false);
  assert.equal(validateGameState(upgraded).ok, true);

  const imported = createFreshGameState({ now: 0 });
  imported.schemaVersion = 27;
  imported.source = { kind: "legacy-import", legacyVersion: 82, legacySourceKey: "kindworks_living_town_v38", importedAt: imported.updatedAt, warnings: [] };
  imported.legacySnapshot = {
    version: 82,
    playerSetup: { home: { level: 4, wallColor: "sky", roofStyle: "hip", roofColor: "plum" } },
    economy: { kindlyClub: { creatorProfile: residentDraft() } },
  };
  imported.customResident.profile = null;
  imported.customResident.home.level = 1;
  const converted = upgradeGameState(imported, { now: 1000 });
  assert.equal(converted.customResident.profile.name, "Meadow");
  assert.deepEqual({ level: converted.customResident.home.level, wallColor: converted.customResident.home.wallColor, roofStyle: converted.customResident.home.roofStyle, roofColor: converted.customResident.home.roofColor }, { level: 4, wallColor: "sky", roofStyle: "hip", roofColor: "plum" });
  assert.equal(validateGameState(converted).ok, true);
});

test("validation rejects spoofed home identities and out-of-range progression", () => {
  const state = createFreshGameState({ now: 0 }).customResident;
  state.home.houseId = "house-19";
  state.home.level = 5;
  const validation = validateCustomResidentState(state);
  assert.equal(validation.ok, false);
  assert.ok(validation.errors.includes("Personal-home assignment or design is invalid."));
});
