import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createFreshGameState, GameStateService, validateGameState } from "../src/state/GameState.js";
import { normalizeOnboardingCreatorDraft } from "../src/state/onboardingState.js";
import { SaveRepository } from "../src/state/SaveRepository.js";
import { EconomyService } from "../src/systems/EconomyService.js";
import { OnboardingService } from "../src/systems/OnboardingService.js";
import { CustomResidentService } from "../src/systems/CustomResidentService.js";
import { MemoryStorage } from "./helpers/MemoryStorage.js";

const root = new URL("../", import.meta.url);
const readText = async (path) => readFile(new URL(path, root), "utf8");
const NOW = new Date("2026-08-29T12:00:00Z").getTime();

function draft(overrides = {}) {
  return {
    name: "Mae",
    skin: "warm",
    hair: 2,
    hairColor: "auburn",
    accessory: "badge",
    outfit: 4,
    bodyBuild: "average",
    hobbies: ["gardening", "helping"],
    home: { wallColor: "sage", roofStyle: "hip", roofColor: "forest" },
    ...overrides,
  };
}

function runtime(repository = new SaveRepository(new MemoryStorage())) {
  const gameState = new GameStateService(createFreshGameState({ now: NOW }));
  const economy = new EconomyService(gameState, repository, { now: () => NOW });
  const onboarding = new OnboardingService(gameState, repository, { economy, now: () => NOW });
  const resident = new CustomResidentService(gameState, repository, { now: () => NOW });
  return { gameState, onboarding, resident, repository };
}

test("persists and restores an incomplete three-page resident and home draft", () => {
  const { gameState, onboarding, repository } = runtime();
  onboarding.saveTownName("Stage Five Test");
  const saved = onboarding.saveCreatorDraft(2, draft());
  assert.equal(saved.ok, true);
  assert.equal(saved.code, "creator-draft-saved");
  assert.equal(saved.state.creatorStep, 2);
  assert.deepEqual(saved.state.creatorDraft, normalizeOnboardingCreatorDraft(draft()));
  const reloaded = repository.load();
  assert.equal(reloaded.ok, true);
  assert.equal(reloaded.state.onboarding.creatorStep, 2);
  assert.deepEqual(reloaded.state.onboarding.creatorDraft, normalizeOnboardingCreatorDraft(draft()));
  assert.equal(validateGameState(gameState.getSnapshot()).ok, true);
});

test("completed resident setup clears only the incomplete creator checkpoint", () => {
  const { gameState, onboarding, resident } = runtime();
  onboarding.saveTownName("Stage Five Test");
  onboarding.saveCreatorDraft(2, draft());
  assert.equal(resident.saveProfile(draft()).code, "resident-created");
  const completed = onboarding.syncSetupFromResident();
  assert.equal(completed.ok, true);
  assert.equal(completed.state.complete, true);
  assert.equal(completed.state.creatorStep, 0);
  assert.equal(completed.state.creatorDraft, null);
  assert.equal(gameState.getSnapshot().customResident.profile.name, "Mae");
});

test("a failed creator-draft save rolls the checkpoint back", () => {
  const storage = new MemoryStorage();
  const repository = new SaveRepository(storage);
  const { gameState, onboarding } = runtime(repository);
  onboarding.saveTownName("Stage Five Test");
  const before = gameState.getSnapshot();
  repository.save = () => ({ ok: false, status: "write-failed" });
  const failed = onboarding.saveCreatorDraft(1, draft());
  assert.equal(failed.code, "persistence-failed");
  assert.deepEqual(gameState.getSnapshot(), before);
});

test("mandatory setup cannot close and boot routes a named incomplete save back to its creator draft", async () => {
  const [onboardingController, residentController, main] = await Promise.all([
    readText("src/ui/OnboardingController.js"),
    readText("src/ui/CustomResidentController.js"),
    readText("src/main.js"),
  ]);
  assert.match(onboardingController, /!this\.service\.getSnapshot\(\)\.complete/);
  assert.match(onboardingController, /this\.closeButton\?\.classList\.toggle\("hidden", !state\.complete\)/);
  assert.match(onboardingController, /state\.townNamed && !state\.complete[\s\S]*openResidentCreator/);
  assert.match(onboardingController, /returnToCreator[\s\S]*openResidentCreator/);
  assert.match(residentController, /this\.onboardingRequired/);
  assert.match(residentController, /if \(!force && this\.onboardingRequired/);
  assert.match(residentController, /saveOnboardingDraft/);
  assert.match(residentController, /creatorStep/);
  assert.match(main, /saveCreatorDraft/);
  assert.match(main, /persistOnboardingDraft/);
});
