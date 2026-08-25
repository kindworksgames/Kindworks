import test from "node:test";
import assert from "node:assert/strict";
import { createFreshGameState, GameStateService } from "../src/state/GameState.js";
import { SaveRepository } from "../src/state/SaveRepository.js";
import { COIN_LEDGER_LIMIT } from "../src/state/economyState.js";
import { EconomyService } from "../src/systems/EconomyService.js";
import { MemoryStorage } from "./helpers/MemoryStorage.js";

function runtime(repository = new SaveRepository(new MemoryStorage())) {
  const gameState = new GameStateService(createFreshGameState({ now: 0 }));
  const economy = new EconomyService(gameState, repository, { now: () => 1000 });
  return { gameState, economy, repository };
}

test("purchases at the exact catalogue price and persists balance plus inventory", () => {
  const { gameState, economy, repository } = runtime();
  const result = economy.purchase("mixed-seeds", 1);
  assert.equal(result.ok, true);
  assert.equal(result.cost, 60);
  assert.equal(result.after, 40);
  assert.equal(gameState.getSnapshot().inventory.consumables["mixed-seeds"], 1);
  assert.equal(gameState.getSnapshot().economy.lifetimeCoinsSpent, 60);
  assert.equal(repository.load().state.economy.coins, 40);
});

test("insufficient funds leave balance, inventory, ledger, and storage unchanged", () => {
  const storage = new MemoryStorage();
  const { gameState, economy } = runtime(new SaveRepository(storage));
  const before = gameState.getSnapshot();
  const result = economy.purchase("river-trout", 1);
  assert.equal(result.code, "insufficient-funds");
  assert.deepEqual(gameState.getSnapshot(), before);
  assert.equal(storage.writes.length, 0);
});

test("credits, debits, grants, and consumptions reconcile lifetime totals", () => {
  const { gameState, economy } = runtime();
  assert.equal(economy.credit(500, { reason: "QA reward" }).ok, true);
  assert.equal(economy.debit(125, { reason: "QA cost" }).ok, true);
  assert.equal(economy.grantItem("mixed-seeds", 4).ok, true);
  assert.equal(economy.consumeItem("mixed-seeds", 3).ok, true);
  const state = gameState.getSnapshot();
  assert.equal(state.economy.coins, 475);
  assert.equal(state.economy.lifetimeCoinsEarned - state.economy.lifetimeCoinsSpent, 475);
  assert.equal(state.inventory.consumables["mixed-seeds"], 1);
});

test("restores the exact checkpoint when persistence fails", () => {
  const failedRepository = { save: () => ({ ok: false, status: "write-failed", reason: "disk full" }) };
  const { gameState, economy } = runtime(failedRepository);
  const before = gameState.getSnapshot();
  const result = economy.purchase("mixed-seeds", 1);
  assert.equal(result.code, "persistence-failed");
  assert.equal(result.rollbackOk, true);
  assert.deepEqual(gameState.getSnapshot(), before);
});

test("bounds the development ledger and scene changes do not alter balances", () => {
  const repository = { save: () => ({ ok: true, status: "saved" }) };
  const { gameState, economy } = runtime(repository);
  for (let index = 0; index < COIN_LEDGER_LIMIT + 5; index += 1) assert.equal(economy.credit(1, { reason: `reward-${index}` }).ok, true);
  const balance = gameState.getSnapshot().economy.coins;
  assert.equal(gameState.getSnapshot().economy.ledger.length, COIN_LEDGER_LIMIT);
  gameState.updatePlayer({ scene: "BakeryScene", x: 640, y: 610, facing: "up" }, { now: 2000 });
  assert.equal(gameState.getSnapshot().economy.coins, balance);
});
