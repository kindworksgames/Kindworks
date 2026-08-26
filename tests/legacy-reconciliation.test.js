import test from "node:test";
import assert from "node:assert/strict";
import { LEGACY_SAVE_KEY, PHASER_SAVE_KEY } from "../src/state/constants.js";
import { createGameStateFromLegacy, GameStateService, upgradeGameState, validateGameState } from "../src/state/GameState.js";
import { LegacySaveImporter } from "../src/state/LegacySaveImporter.js";
import {
  LEGACY_DOMAIN_OWNERS,
  canonicalizeLegacySave,
  validateLegacyReconciliationState,
} from "../src/state/legacyReconciliationState.js";
import { SaveRepository } from "../src/state/SaveRepository.js";
import { BakeryService } from "../src/systems/BakeryService.js";
import { queueHomeownerGiftInto } from "../src/systems/HomeownerGiftService.js";
import { legacyVersionFixtures, reconciliationV82 } from "./fixtures/legacy-saves.js";
import { MemoryStorage } from "./helpers/MemoryStorage.js";

const report = (version = 82) => ({ ok: true, sourceKey: `legacy-v${version}`, warnings: [] });

function completeBakeryShift(service, level = 1) {
  assert.equal(service.startLevel(level).ok, true);
  let result;
  while (!service.getActiveSession().finished) {
    for (const step of service.currentRecipe().steps) assert.equal(service.applyStep(step).ok, true);
    result = service.serveRecipe();
    assert.equal(result.ok, true);
  }
  return result;
}

test("every protected HTML save version from 12 through 82 inspects and reconciles into valid schema 37 state", () => {
  assert.equal(legacyVersionFixtures.length, 71);
  assert.deepEqual(legacyVersionFixtures.map((fixture) => fixture.version), Array.from({ length: 71 }, (_, index) => index + 12));
  for (const fixture of legacyVersionFixtures) {
    const raw = JSON.stringify(fixture);
    const storage = new MemoryStorage({ [LEGACY_SAVE_KEY]: raw });
    const importer = new LegacySaveImporter(storage);
    const inspected = importer.inspect();
    assert.equal(inspected.ok, true, `HTML save v${fixture.version} should inspect`);
    const state = importer.createImportedState(inspected.selected, { now: 1767225600000 });
    assert.equal(validateGameState(state).ok, true, `HTML save v${fixture.version} should reconcile`);
    assert.equal(state.schemaVersion, 37);
    assert.equal(state.legacyReconciliation.sourceVersion, fixture.version);
    assert.equal(state.legacyReconciliation.htmlKeysReadOnly, true);
    assert.equal(storage.getItem(LEGACY_SAVE_KEY), raw);
    assert.deepEqual(storage.writes, []);
    assert.deepEqual(storage.removals, []);
  }
});

test("the full v82 fixture reaches every final Phaser owner without losing balances or durable records", () => {
  const original = structuredClone(reconciliationV82);
  const state = createGameStateFromLegacy(reconciliationV82, report(), { now: 1767225600000 });
  assert.equal(validateGameState(state).ok, true);
  assert.deepEqual(reconciliationV82, original, "the source fixture must remain immutable");

  assert.deepEqual([state.economy.coins, state.economy.lifetimeCoinsEarned, state.economy.lifetimeCoinsSpent], [50_000, 62_000, 12_000]);
  assert.equal(state.inventory.equipment["swiftcut-mower"], 1);
  assert.equal(state.inventory.equipped.mower, "swiftcut-mower");
  assert.equal(state.inventory.consumables["carrot-seeds"], 7);
  assert.equal(state.townPlacement.objects[0].id, "legacy-planter-7");
  assert.deepEqual(state.farming.orchard.trees.map(({ id, x, y }) => ({ id, x, y })), [
    { id: "apple-tree-2", x: 444, y: 555 }, { id: "apple-tree-8", x: 777, y: 888 },
  ]);
  assert.equal(state.farming.allotment.beds[0].cropId, "fresh-greens");
  assert.equal(state.customResident.home.level, 3);
  assert.equal(state.homeInteriors.visits["house-20"].inspections, 2);
  assert.equal(state.homeInteriors.placements[0].itemId, "ornamental-fish-tank");
  assert.equal(Object.values(state.fishing.aquariumByItem).reduce((sum, count) => sum + count, 0), 3);
  assert.equal(state.animals.residents["animal-dog-1"].adopted, true);
  assert.equal(state.restorationMilestones.unlocked.commons, true);
  assert.equal(state.harbourGeneral.stock.newspaper, 12);
  assert.equal(state.homeownerGifts.history[0].eventId, "homeowner:legacy:gift-1");
  assert.equal(state.npcs.residents.find((resident) => resident.id === "npc-01").narrativeState.storyStage, 2);
  assert.equal(state.bakery.completed[1], true);
  assert.equal(state.southShoreScoops.completed[1], true);

  assert.deepEqual(state.legacyReconciliation.domainOwners, LEGACY_DOMAIN_OWNERS);
  assert.deepEqual(state.legacyReconciliation.duplicateProtection.campaignClaims.waste, { count: 2, ranges: [[1, 2]] });
  assert.deepEqual(state.legacyReconciliation.duplicateProtection.commerceFulfilmentIds, ["legacy-purchase-1", "legacy-subscription::2026-08"]);
  assert.equal(validateLegacyReconciliationState(state.legacyReconciliation, { source: state.source }).ok, true);
});

test("stable legacy aliases map deterministically while the retained source snapshot stays byte-for-byte equivalent", () => {
  const early = structuredClone(legacyVersionFixtures[3]);
  early.lawns = {
    "lawn-09": { grassHeight: 91, weedPressure: 19 },
    "lawn-11": { grassHeight: 42, weedPressure: 8 },
  };
  early.homeFurnitureState = {
    placements: [{ itemId: "cosy-sofa", rx: 0.4, ry: 0.5, rotation: 0 }],
    visits: { home20: { count: 3, inspections: 1, lastVisitedAt: 100, lastClean: true } },
  };
  early.houseRescue = { homes: { "house-19": { houseId: "house-19", dirty: false, completionCount: 2 } } };
  const source = structuredClone(early);
  const canonical = canonicalizeLegacySave(early);
  const state = createGameStateFromLegacy(early, report(15), { now: 1000 });

  assert.equal(canonical.legacy.lawns["lawn-11"].grassHeight, 91);
  assert.equal(canonical.legacy.lawns["lawn-09"].grassHeight, 42);
  assert.equal(canonical.legacy.homeFurniture.placements[0].id, "legacy-home-furniture-1");
  assert.equal(state.homeInteriors.visits["house-20"].count, 3);
  assert.equal(state.houseRescue.homes["house-20"].completionCount, 2);
  assert.ok(state.legacyReconciliation.stableIdMappings.some(({ from, to }) => from === "home20" && to === "house-20"));
  assert.deepEqual(state.legacySnapshot, source);
  assert.deepEqual(early, source);
});

test("legacy first clears, homeowner events, restoration gifts and commerce receipts cannot pay twice", () => {
  const state = createGameStateFromLegacy(reconciliationV82, report(), { now: 1767225600000 });
  const gameState = new GameStateService(state);
  const repository = new SaveRepository(new MemoryStorage());
  const bakery = new BakeryService(gameState, repository, { now: () => 1767225601000 });
  const beforeCoins = gameState.getSnapshot().economy.coins;
  const replay = completeBakeryShift(bakery, 1);
  assert.equal(replay.result.firstClear, false);
  assert.equal(replay.result.coins, 0);
  assert.equal(gameState.getSnapshot().economy.coins, beforeCoins);

  const beforeGift = structuredClone(gameState.getSnapshot());
  const duplicateGift = queueHomeownerGiftInto(beforeGift, {
    source: "house-rescue", houseId: "house-1", eventId: "homeowner:legacy:gift-1", forceTier: "exceptional", ignoreUnlock: true, now: 1767225602000,
  });
  assert.equal(duplicateGift.duplicate, true);
  assert.deepEqual(beforeGift, gameState.getSnapshot());
  assert.equal(state.restorationMilestones.firstRestorationGift.granted, true);
  assert.ok(state.commerce.processedTransactions.includes("legacy-purchase-1"));
  assert.ok(state.commerce.processedPeriods.includes("legacy-subscription::2026-08"));
});

test("reconciliation is deterministic, upgrades old Phaser imports, and never writes an HTML key", () => {
  const first = createGameStateFromLegacy(reconciliationV82, report(), { now: 1767225600000 });
  const second = createGameStateFromLegacy(reconciliationV82, report(), { now: 1767225600000 });
  assert.deepEqual(first.legacyReconciliation, second.legacyReconciliation);

  const schema36 = structuredClone(first);
  schema36.schemaVersion = 36;
  delete schema36.legacyReconciliation;
  const upgraded = upgradeGameState(schema36, { now: 1767225600000 });
  assert.equal(upgraded.schemaVersion, 37);
  assert.equal(upgraded.legacyReconciliation.sourceFingerprint, first.legacyReconciliation.sourceFingerprint);
  assert.equal(validateGameState(upgraded).ok, true);

  const legacyRaw = JSON.stringify(reconciliationV82);
  const storage = new MemoryStorage({ [LEGACY_SAVE_KEY]: legacyRaw });
  const saved = new SaveRepository(storage).save(first, { now: 1767225600000 });
  assert.equal(saved.ok, true);
  assert.equal(storage.getItem(LEGACY_SAVE_KEY), legacyRaw);
  assert.ok(storage.getItem(PHASER_SAVE_KEY));
  assert.ok(storage.writes.every(({ key }) => key !== LEGACY_SAVE_KEY));
  assert.ok(storage.removals.every((key) => key !== LEGACY_SAVE_KEY));
});
