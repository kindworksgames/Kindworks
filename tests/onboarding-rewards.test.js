import test from "node:test";
import assert from "node:assert/strict";
import { createFreshGameState, GameStateService, upgradeGameState, validateGameState } from "../src/state/GameState.js";
import { SaveRepository } from "../src/state/SaveRepository.js";
import {
  LOGIN_REWARD_CONFIG,
  createFreshOnboardingState,
  validateTownName,
} from "../src/state/onboardingState.js";
import { EconomyService } from "../src/systems/EconomyService.js";
import { OnboardingService } from "../src/systems/OnboardingService.js";
import { CustomResidentService } from "../src/systems/CustomResidentService.js";
import { MemoryStorage } from "./helpers/MemoryStorage.js";

const DAY = 86_400_000;
const START = new Date("2026-01-10T12:00:00").getTime();

function runtime({ repository = new SaveRepository(new MemoryStorage()), now = START, requireTrustedTime = false, trustedTimeProvider = null } = {}) {
  const clock = { value: now };
  const gameState = new GameStateService(createFreshGameState({ now }));
  const economy = new EconomyService(gameState, repository, { now: () => clock.value });
  const onboarding = new OnboardingService(gameState, repository, { economy, now: () => clock.value, requireTrustedTime, trustedTimeProvider });
  return { clock, gameState, economy, onboarding, repository };
}

function residentDraft() {
  return {
    name: "Mae", skin: "warm", hair: 0, hairColor: "dark-brown", accessory: "badge", outfit: 0,
    bodyBuild: "average", hobbies: ["helping"], home: { wallColor: "cream", roofStyle: "gable", roofColor: "terracotta" },
  };
}

test("pins the original town-name and login-reward contract", () => {
  assert.deepEqual(LOGIN_REWARD_CONFIG, { schemaVersion: 1, starterCoins: 100, dailyCoins: 10, returnBonusCoins: 50, returnAfterDays: 3 });
  assert.equal(validateTownName("").reason, "Enter a name for your town.");
  assert.equal(validateTownName("<bad>").ok, false);
  assert.equal(validateTownName("---").ok, false);
  assert.deepEqual(validateTownName("  Zoë’s   Haven  "), { ok: true, name: "Zoë’s Haven", reason: "" });
  assert.equal(validateTownName("123456789012345678901234567890").name.length, 24);
});

test("fresh players receive exactly one 100-coin starter grant and begin setup safely", () => {
  const state = createFreshGameState({ now: START });
  assert.equal(state.economy.coins, 100);
  assert.equal(state.economy.ledger.filter((entry) => entry.kind === "starter-grant").length, 1);
  assert.equal(state.onboarding.starterGrantClaimed, true);
  assert.equal(state.onboarding.townNamed, false);
  assert.equal(state.onboarding.complete, false);
  assert.deepEqual(state.onboarding.loginRewards, createFreshOnboardingState({ now: START }).loginRewards);
});

test("town naming is normalized, persisted atomically, and invalid input cannot mutate state", () => {
  const { gameState, onboarding, repository } = runtime();
  const invalidBefore = gameState.getSnapshot();
  assert.equal(onboarding.saveTownName("<>no").code, "invalid-town-name");
  assert.deepEqual(gameState.getSnapshot(), invalidBefore);
  const result = onboarding.saveTownName("  Alder   & Brook  ");
  assert.equal(result.code, "invalid-town-name");
  const saved = onboarding.saveTownName("  Alder   Brook  ");
  assert.equal(saved.ok, true);
  assert.equal(saved.townName, "Alder Brook");
  assert.equal(repository.load().state.identity.townName, "Alder Brook");
});

test("resident creation and starter-home selection complete the setup without a second resident", () => {
  const { gameState, onboarding, repository } = runtime();
  onboarding.saveTownName("Meadow Bay");
  const residents = new CustomResidentService(gameState, repository, { now: () => START });
  assert.equal(residents.saveProfile(residentDraft()).code, "resident-created");
  const completed = onboarding.syncSetupFromResident();
  assert.equal(completed.code, "setup-complete");
  assert.equal(completed.state.residentCreated, true);
  assert.equal(completed.state.homeSelected, true);
  assert.equal(completed.state.complete, true);
  assert.equal(residents.saveProfile({ ...residentDraft(), name: "Mina" }).code, "profile-updated");
  assert.equal(gameState.getSnapshot().customResident.residentId, "npc-kindly-member");
});

test("the Lawn, Waste, and River tutorials are tracked once and form the first-job checklist", () => {
  const { onboarding } = runtime();
  assert.equal(onboarding.recordTutorial("lawn").code, "tutorial-recorded");
  assert.equal(onboarding.recordTutorial("lawn").duplicate, true);
  onboarding.recordTutorial("waste");
  assert.equal(onboarding.getSnapshot().nextJob, "river");
  onboarding.recordTutorial("river");
  assert.equal(onboarding.getSnapshot().checklistComplete, true);
  assert.equal(onboarding.recordTutorial("unknown").code, "unknown-tutorial");
});

test("same-day launches never duplicate the daily reward", () => {
  const { gameState, onboarding } = runtime();
  const first = onboarding.processLoginRewards(START + 60_000);
  const second = onboarding.processLoginRewards(START + 120_000);
  assert.equal(first.duplicate, true);
  assert.equal(second.duplicate, true);
  assert.equal(gameState.getSnapshot().economy.coins, 100);
  assert.equal(gameState.getSnapshot().onboarding.loginRewards.dailyClaims, 0);
});

test("a new local day pays 10 coins once and a three-day return pays 60 total", () => {
  const { gameState, onboarding } = runtime();
  const daily = onboarding.processLoginRewards(START + DAY);
  assert.deepEqual({ daily: daily.daily, returnBonus: daily.returnBonus, total: daily.total }, { daily: 10, returnBonus: 0, total: 10 });
  assert.equal(onboarding.processLoginRewards(START + DAY + 1000).total, 0);
  const returnVisit = onboarding.processLoginRewards(START + 4 * DAY);
  assert.deepEqual({ daily: returnVisit.daily, returnBonus: returnVisit.returnBonus, total: returnVisit.total }, { daily: 10, returnBonus: 50, total: 60 });
  assert.equal(gameState.getSnapshot().economy.coins, 170);
  assert.deepEqual(gameState.getSnapshot().economy.ledger.slice(-3).map((entry) => entry.kind), ["daily-login", "daily-login", "return-bonus"]);
});

test("clock rollback is detected and never moves the durable login day backwards", () => {
  const { gameState, onboarding } = runtime();
  onboarding.processLoginRewards(START + DAY);
  const lastDay = gameState.getSnapshot().onboarding.loginRewards.lastLoginDay;
  const rollback = onboarding.processLoginRewards(START - DAY);
  assert.equal(rollback.clockRollback, true);
  assert.equal(rollback.total, 0);
  assert.equal(gameState.getSnapshot().onboarding.loginRewards.lastLoginDay, lastDay);
  assert.equal(gameState.getSnapshot().economy.coins, 110);
});

test("failed persistence rolls back reward balance, ledger, and claim markers together", () => {
  const failedRepository = { save: () => ({ ok: false, status: "write-failed" }) };
  const { gameState, onboarding } = runtime({ repository: failedRepository });
  const before = gameState.getSnapshot();
  const result = onboarding.processLoginRewards(START + DAY);
  assert.equal(result.code, "persistence-failed");
  assert.deepEqual(gameState.getSnapshot(), before);
});

test("production rewards require verified trusted time and reject duplicate receipts", async () => {
  let receipt = { verified: true, unixMs: START + DAY, receiptId: "receipt-1" };
  const { gameState, onboarding } = runtime({ requireTrustedTime: true, trustedTimeProvider: async () => receipt });
  assert.equal(onboarding.processLoginRewards(START + DAY).code, "trusted-time-required");
  const paid = await onboarding.requestLoginRewards();
  assert.equal(paid.total, 10);
  const duplicate = await onboarding.requestLoginRewards();
  assert.equal(duplicate.code, "trusted-time-duplicate");
  receipt = { verified: false, unixMs: START + 4 * DAY, receiptId: "receipt-2" };
  assert.equal((await onboarding.requestLoginRewards()).code, "unverified-trusted-time");
  assert.equal(gameState.getSnapshot().economy.coins, 110);
});

test("schema-34 saves gain onboarding without replaying starter or login rewards", () => {
  const oldState = createFreshGameState({ now: START });
  oldState.schemaVersion = 34;
  delete oldState.onboarding;
  const upgraded = upgradeGameState(oldState, { now: START + DAY });
  assert.equal(upgraded.schemaVersion, 37);
  assert.equal(upgraded.economy.coins, 100);
  assert.equal(upgraded.onboarding.loginRewards.dailyClaims, 0);
  assert.equal(validateGameState(upgraded).ok, true);
});
