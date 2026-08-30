import test from "node:test";
import assert from "node:assert/strict";
import {
  PHASER_BACKUP_KEY,
  PHASER_RECOVERY_KEY,
  PHASER_SAVE_KEY,
} from "../src/state/constants.js";
import { bootstrapState } from "../src/state/bootstrapState.js";
import { createFreshGameState, GameStateService } from "../src/state/GameState.js";
import { createSaveEnvelope, SaveRepository } from "../src/state/SaveRepository.js";
import { SaveStatusController } from "../src/ui/SaveStatusController.js";
import { MemoryStorage } from "./helpers/MemoryStorage.js";

const NOW = Date.UTC(2026, 7, 29, 16, 0, 0);

function resetController(runtime, { onNewGame = () => {}, now = () => NOW } = {}) {
  const controller = Object.create(SaveStatusController.prototype);
  Object.assign(controller, {
    runtime,
    onNewGame,
    now,
    resetArmed: false,
    resetArmedAt: 0,
    title: { textContent: "" },
    message: { textContent: "" },
    details: { textContent: "" },
  });
  return controller;
}

test("S8-REC-001 repairs every audited missing additive field without hiding corrupt required data", () => {
  const deletions = [
    ["world", "weather", "history"],
    ["world", "simulation", "lastOfflineWasCapped"],
    ["progress", "cleanup", "history"],
    ["economy", "ledger"],
    ["inventory", "unresolvedLegacy"],
    ["townPlacement", "importReport"],
    ["npcs", "conversationHistory"],
    ["restorationMilestones", "processedEventIds"],
    ["onboarding", "creatorDraft"],
    ["homeInteriors", "visits"],
    ["farming", "allotment", "beds"],
    ["animals", "departureEvents"],
    ["fishing", "magnet", "recentFinds"],
    ["bakery", "lastOutcome"],
    ["cafe", "lastOutcome"],
    ["river", "lastOutcome"],
    ["houseRescue", "active"],
    ["lawnCare", "activeSession"],
    ["beachCleanup", "activeSession"],
    ["playgroundPowerwash", "activeSession"],
    ["morningMug", "activeShift"],
    ["riversideKitchen", "activeShift"],
    ["southShoreScoops", "activeShift"],
    ["homeownerGifts", "queue"],
    ["harbourGeneral", "recentSales"],
  ];

  for (const path of deletions) {
    const state = createFreshGameState({ now: NOW });
    state.identity.townName = "Repair Willow";
    state.economy.coins = 4321;
    state.economy.lifetimeCoinsEarned = 4321;
    let owner = state;
    for (const key of path.slice(0, -1)) owner = owner[key];
    delete owner[path.at(-1)];
    const storage = new MemoryStorage({ [PHASER_SAVE_KEY]: JSON.stringify(createSaveEnvelope(state, { now: NOW })) });
    const runtime = bootstrapState(storage, { now: NOW + 1 });
    assert.equal(runtime.loaded.ok, true, path.join("."));
    assert.equal(runtime.gameState.getSnapshot().identity.townName, "Repair Willow");
    assert.equal(runtime.gameState.getSnapshot().economy.coins, 4321);
    assert.equal(new SaveRepository(storage).load().ok, true);
  }

  const corrupt = createFreshGameState({ now: NOW });
  corrupt.player.x = "not-a-coordinate";
  const corruptStorage = new MemoryStorage({ [PHASER_SAVE_KEY]: JSON.stringify(createSaveEnvelope(corrupt, { now: NOW })) });
  assert.equal(new SaveRepository(corruptStorage).load().ok, false, "present corrupt required data still fails closed");
});

test("S8-REC-001 loads a valid recovery candidate, persists it as current and preserves an older valid recovery from corrupt overwrite", () => {
  const recoveredState = createFreshGameState({ now: NOW });
  recoveredState.identity.townName = "Recovered Willow";
  recoveredState.economy.coins = 777;
  recoveredState.economy.lifetimeCoinsEarned = 777;
  const recoveryRaw = JSON.stringify({
    format: 1,
    capturedAt: new Date(NOW).toISOString(),
    sourceKey: PHASER_SAVE_KEY,
    reason: "simulated interrupted write",
    raw: JSON.stringify(createSaveEnvelope(recoveredState, { now: NOW })),
  });
  const storage = new MemoryStorage({ [PHASER_RECOVERY_KEY]: recoveryRaw });
  const runtime = bootstrapState(storage, { now: NOW + 1 });
  assert.equal(runtime.loaded.ok, true);
  assert.equal(runtime.loaded.status, "recovered-recovery");
  assert.equal(runtime.loaded.recoveredPersisted, true);
  assert.equal(runtime.gameState.getSnapshot().identity.townName, "Recovered Willow");
  assert.ok(storage.getItem(PHASER_SAVE_KEY));

  const repository = new SaveRepository(storage);
  storage.setItem(PHASER_SAVE_KEY, "{corrupt");
  repository.load();
  assert.equal(storage.getItem(PHASER_RECOVERY_KEY), recoveryRaw, "a valid recovery is not replaced by an invalid current payload");
});

test("S8-RESET-001 requires confirmation, preserves the old save as backup and starts a valid fresh state once", () => {
  const previous = createFreshGameState({ now: NOW - 1000 });
  previous.identity.townName = "Established Willow";
  previous.economy.coins = 900;
  previous.economy.lifetimeCoinsEarned = 900;
  const storage = new MemoryStorage();
  const repository = new SaveRepository(storage);
  assert.equal(repository.save(previous, { now: NOW - 1000 }).ok, true);
  const originalRaw = storage.getItem(PHASER_SAVE_KEY);
  const gameState = new GameStateService(previous);
  let newGameCalls = 0;
  let clock = NOW;
  const controller = resetController({
    repository,
    gameState,
    legacyInspection: { selected: null },
  }, { onNewGame: () => { newGameCalls += 1; }, now: () => clock });
  controller.getStatus = () => ({ hasCurrent: true });
  controller.render = () => {};

  assert.equal(controller.runPrimaryAction().code, "new-game-confirmation-required");
  assert.equal(controller.runPrimaryAction().code, "new-game-confirmation-delay", "a rapid double-tap cannot confirm reset");
  assert.equal(gameState.getSnapshot().identity.townName, "Established Willow");
  assert.equal(storage.getItem(PHASER_SAVE_KEY), originalRaw);
  clock += 800;
  const reset = controller.runPrimaryAction();
  assert.equal(reset.ok, true);
  assert.equal(reset.code, "new-game-started");
  assert.equal(newGameCalls, 1);
  assert.equal(gameState.getSnapshot().identity.townName, "Willowmere");
  assert.equal(gameState.getSnapshot().economy.coins, 100);
  assert.equal(storage.getItem(PHASER_BACKUP_KEY), originalRaw);
  assert.equal(new SaveRepository(storage).load().state.identity.townName, "Willowmere");
});

test("S8-RESET-001 leaves live and persisted progress unchanged when the reset save fails", () => {
  const previous = createFreshGameState({ now: NOW });
  previous.identity.townName = "Keep This Town";
  const gameState = new GameStateService(previous);
  const controller = resetController({
    gameState,
    legacyInspection: { selected: null },
    repository: { save: () => ({ ok: false, status: "write-failed", reason: "simulated failure" }) },
  });
  controller.resetArmed = true;
  const result = controller.startNewGame();
  assert.equal(result.ok, false);
  assert.equal(gameState.getSnapshot().identity.townName, "Keep This Town");
  assert.equal(controller.message.textContent, "Your current progress is unchanged.");
});
