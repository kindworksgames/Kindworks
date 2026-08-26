import test from "node:test";
import assert from "node:assert/strict";
import { COIN_PACKS, KINDLY_CLUB_TIERS, COMMERCE_POLICY } from "../src/data/commerce.js";
import { createFreshGameState, GameStateService, upgradeGameState, validateGameState } from "../src/state/GameState.js";
import { commerceCatalogParity, projectLegacyCommerce, validateCommerceState } from "../src/state/commerceState.js";
import { SaveRepository } from "../src/state/SaveRepository.js";
import { CommerceService } from "../src/systems/CommerceService.js";
import { EconomyService } from "../src/systems/EconomyService.js";
import { MemoryStorage } from "./helpers/MemoryStorage.js";

const NOW = Date.parse("2026-04-10T12:00:00.000Z");

function wallet(state, coins, version = state.commerce.walletVersion + 1) {
  return {
    coins: state.economy.coins + coins,
    lifetimeCoinsEarned: state.economy.lifetimeCoinsEarned + coins,
    lifetimeCoinsSpent: state.economy.lifetimeCoinsSpent,
    version,
  };
}

function verified(envelope, { kind, productId }) {
  const payload = envelope?.payload;
  const id = payload?.productId || payload?.packId || payload?.tierId;
  return payload?.kind === kind && id === productId
    ? { ok: true, payload: structuredClone(payload) }
    : { ok: false, code: "bad-test-receipt", message: "Receipt mismatch." };
}

function runtime({ repository = new SaveRepository(new MemoryStorage()), billing = null } = {}) {
  const gameState = new GameStateService(createFreshGameState({ now: NOW }));
  const economy = new EconomyService(gameState, repository, { now: () => NOW });
  const commerce = new CommerceService(gameState, repository, { economy, billing, verifyReceipt: verified, now: () => NOW, environment: "test" });
  return { gameState, economy, commerce, repository };
}

function coinReceipt(gameState, packId = "coins-1000", transactionId = "tx-1") {
  const pack = COIN_PACKS.find((entry) => entry.id === packId);
  const state = gameState.getSnapshot();
  return { payload: { kind: "coin-pack", productId: pack.id, packId: pack.id, transactionId, coins: pack.coins, wallet: wallet(state, pack.coins), verifiedAt: new Date(NOW).toISOString() } };
}

function subscriptionReceipt(gameState, tierId = "kindlyclub-creator", period = 1) {
  const tier = KINDLY_CLUB_TIERS.find((entry) => entry.id === tierId);
  const state = gameState.getSnapshot();
  return { payload: {
    kind: "subscription", productId: tier.id, tierId: tier.id, subscriptionId: "sub-1",
    currentPeriodStart: new Date(NOW + (period - 1) * 31 * 86_400_000).toISOString(),
    currentPeriodEnd: new Date(NOW + period * 31 * 86_400_000).toISOString(),
    coins: tier.monthlyCoins, giftItemId: tier.monthlyGiftItem, wallet: wallet(state, tier.monthlyCoins), verifiedAt: new Date(NOW).toISOString(),
  } };
}

test("pins all six original coin packs, three KindlyClub tiers, and safety policy", () => {
  assert.deepEqual(COIN_PACKS.map(({ id, coins, displayPrice }) => [id, coins, displayPrice]), [
    ["coins-1000", 1_000, "£0.99"], ["coins-3000", 3_000, "£2.49"], ["coins-6000", 6_000, "£4.79"],
    ["coins-13000", 13_000, "£9.99"], ["coins-27500", 27_500, "£19.99"], ["coins-80000", 80_000, "£49.99"],
  ]);
  assert.deepEqual(KINDLY_CLUB_TIERS.map(({ id, monthlyCoins, monthlyGiftItem }) => [id, monthlyCoins, monthlyGiftItem]), [
    ["kindlyclub", 2_000, null], ["kindlyclub-creator", 5_000, "record-player"], ["kindlyclub-champion", 10_000, "kindly-heart-planter"],
  ]);
  assert.deepEqual(commerceCatalogParity(), { coinPacks: 6, kindlyClubTiers: 3 });
  assert.equal(COMMERCE_POLICY.serverVerifiedReceiptsOnly, true);
  assert.equal(COMMERCE_POLICY.collectsDateOfBirth, false);
  assert.equal(COMMERCE_POLICY.personalizedAdvertising, false);
});

test("web builds refuse checkout without an adult confirmation or connected server wallet", async () => {
  const { commerce } = runtime();
  assert.equal((await commerce.purchaseCoinPack("coins-1000")).code, "adult-confirmation-required");
  assert.equal((await commerce.purchaseCoinPack("coins-1000", { adultConfirmed: true })).code, "billing-not-connected");
  assert.equal((await commerce.purchaseSubscription("kindlyclub", { adultConfirmed: true })).requiresBilling, true);
  assert.equal(commerce.authority().serverWallet, false);
});

test("a server-verified coin pack applies the authoritative wallet exactly once", async () => {
  let gameState;
  const billing = { walletAuthority: "server", purchaseCoinPack: async () => coinReceipt(gameState) };
  const setup = runtime({ billing });
  gameState = setup.gameState;
  const paid = await setup.commerce.purchaseCoinPack("coins-1000", { adultConfirmed: true });
  assert.equal(paid.code, "coin-pack-credited");
  assert.equal(setup.gameState.getSnapshot().economy.coins, 1_100);
  assert.equal(setup.gameState.getSnapshot().commerce.walletVersion, 1);
  assert.equal(setup.gameState.getSnapshot().commerce.processedTransactions[0], "tx-1");
  assert.equal(setup.gameState.getSnapshot().economy.ledger.at(-1).verifiedBy, "server");
  const duplicate = setup.commerce.applyCoinPayload("coins-1000", coinReceipt(setup.gameState).payload);
  assert.equal(duplicate.duplicate, true);
  assert.equal(setup.gameState.getSnapshot().economy.coins, 1_100);
});

test("tampered pack amounts, stale wallets, and local-only billing are refused", async () => {
  let gameState;
  const billing = { walletAuthority: "local", purchaseCoinPack: async () => coinReceipt(gameState) };
  const setup = runtime({ billing });
  gameState = setup.gameState;
  assert.equal((await setup.commerce.purchaseCoinPack("coins-1000", { adultConfirmed: true })).code, "billing-not-connected");
  const receipt = coinReceipt(gameState);
  receipt.payload.coins = 80_000;
  assert.equal(setup.commerce.applyCoinPayload("coins-1000", receipt.payload).code, "coin-receipt-mismatch");
  const stale = coinReceipt(gameState, "coins-1000", "tx-stale");
  stale.payload.wallet.version = 0;
  assert.equal(setup.commerce.applyCoinPayload("coins-1000", stale.payload).code, "stale-server-wallet");
  assert.equal(gameState.getSnapshot().economy.coins, 100);
});

test("failed persistence rolls a verified coin purchase back completely", async () => {
  const failed = { save: () => ({ ok: false, status: "write-failed" }) };
  let gameState;
  const billing = { walletAuthority: "server", purchaseCoinPack: async () => coinReceipt(gameState) };
  const setup = runtime({ repository: failed, billing });
  gameState = setup.gameState;
  const before = gameState.getSnapshot();
  const result = await setup.commerce.purchaseCoinPack("coins-1000", { adultConfirmed: true });
  assert.equal(result.code, "persistence-failed");
  assert.deepEqual(gameState.getSnapshot(), before);
});

test("verified membership grants monthly coins and the exact gift once per period", async () => {
  let gameState;
  const billing = { walletAuthority: "server", purchaseSubscription: async () => subscriptionReceipt(gameState) };
  const setup = runtime({ billing });
  gameState = setup.gameState;
  const result = await setup.commerce.purchaseSubscription("kindlyclub-creator", { adultConfirmed: true });
  assert.equal(result.code, "membership-benefits-granted");
  let state = gameState.getSnapshot();
  assert.equal(state.economy.coins, 5_100);
  assert.equal(state.inventory.furniture["record-player"], 1);
  assert.equal(state.commerce.kindlyClub.status, "active");
  assert.equal(setup.commerce.getSnapshot().kindlyClub.active, true);
  const duplicate = setup.commerce.applySubscriptionPayload("kindlyclub-creator", subscriptionReceipt(gameState).payload);
  assert.equal(duplicate.duplicate, true);
  state = gameState.getSnapshot();
  assert.equal(state.economy.coins, 5_100);
  assert.equal(state.inventory.furniture["record-player"], 1);
});

test("purchase restoration replays verified receipts without duplicating grants", async () => {
  let gameState;
  let receipt;
  const billing = { walletAuthority: "server", restorePurchases: async () => ({ receipts: [receipt] }) };
  const setup = runtime({ billing });
  gameState = setup.gameState;
  receipt = coinReceipt(gameState, "coins-3000", "restore-1");
  const restored = await setup.commerce.restorePurchases({ adultConfirmed: true });
  assert.equal(restored.ok, true);
  assert.equal(restored.restored, 1);
  assert.equal(gameState.getSnapshot().economy.coins, 3_100);
  const again = await setup.commerce.restorePurchases({ adultConfirmed: true });
  assert.equal(again.duplicates, 1);
  assert.equal(gameState.getSnapshot().economy.coins, 3_100);
  assert.ok(gameState.getSnapshot().commerce.lastRestoreAt);
});

test("legacy commerce histories and verified membership project without replaying benefits", () => {
  const legacy = { economy: {
    processedCoinTransactions: ["old-tx", "old-tx"],
    processedKindlyPeriods: ["sub-old::2026-03-01T00:00:00.000Z"],
    kindlyClub: { tierId: "kindlyclub", status: "active", subscriptionId: "sub-old", currentPeriodStart: "2026-03-01T00:00:00.000Z", currentPeriodEnd: "2026-05-01T00:00:00.000Z", lastVerifiedAt: NOW, verifiedBy: "server" },
  } };
  const commerce = projectLegacyCommerce(legacy);
  assert.deepEqual(commerce.processedTransactions, ["old-tx"]);
  assert.equal(commerce.kindlyClub.tierId, "kindlyclub");
  assert.equal(validateCommerceState(commerce).ok, true);
});

test("schema-35 saves gain the commerce domain without changing wallet or inventory", () => {
  const old = createFreshGameState({ now: NOW });
  old.schemaVersion = 35;
  delete old.commerce;
  const before = { economy: structuredClone(old.economy), inventory: structuredClone(old.inventory) };
  const upgraded = upgradeGameState(old, { now: NOW });
  assert.equal(upgraded.schemaVersion, 37);
  assert.deepEqual(upgraded.economy, before.economy);
  assert.deepEqual(upgraded.inventory, before.inventory);
  assert.equal(validateGameState(upgraded).ok, true);
});
