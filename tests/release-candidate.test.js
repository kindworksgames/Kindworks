import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  RELEASE_CANDIDATE_ACTIVITY_CHECKPOINTS,
  RELEASE_CANDIDATE_JOURNEYS,
  RELEASE_CANDIDATE_MIN_TOUCH_TARGET,
  RELEASE_CANDIDATE_VIEWPORTS,
  getReleaseCandidateCertification,
} from "../src/data/releaseCandidate.js";
import { bootstrapState } from "../src/state/bootstrapState.js";
import { LEGACY_SAVE_KEY, PHASER_SAVE_KEY } from "../src/state/constants.js";
import { SaveRepository } from "../src/state/SaveRepository.js";
import { EconomyService } from "../src/systems/EconomyService.js";
import { OnboardingService } from "../src/systems/OnboardingService.js";
import { CustomResidentService } from "../src/systems/CustomResidentService.js";
import { MemoryStorage } from "./helpers/MemoryStorage.js";
import { reconciliationV82 } from "./fixtures/legacy-saves.js";

const root = new URL("../", import.meta.url);
const readText = async (path) => readFile(new URL(path, root), "utf8");
const NOW = Date.UTC(2026, 7, 27, 12, 0, 0);
const PROFILE = Object.freeze({
  name: "Meadow", skin: "warm", hair: 1, hairColor: "dark-brown", accessory: "badge", outfit: 1, bodyBuild: "average",
  hobbies: ["gardening", "nature", "helping"], home: { wallColor: "sage", roofStyle: "gable", roofColor: "terracotta" },
});

test("publishes a deterministic twelve-journey release-candidate contract", () => {
  const first = getReleaseCandidateCertification();
  const second = getReleaseCandidateCertification();
  assert.deepEqual(first, second);
  assert.equal(first.ok, true);
  assert.deepEqual(first.issues, []);
  assert.equal(first.milestone, 44);
  assert.equal(first.journeyCount, 12);
  assert.equal(RELEASE_CANDIDATE_JOURNEYS.every(({ checkpoints }) => checkpoints.length >= 5), true);
  assert.equal(first.saveNamespacesSeparate, true);
  assert.deepEqual(first.legacyVersions, { first: 12, last: 82, count: 71 });
});

test("covers early, middle and final campaign play plus both fishing modes", () => {
  assert.equal(RELEASE_CANDIDATE_ACTIVITY_CHECKPOINTS.length, 35);
  assert.equal(RELEASE_CANDIDATE_ACTIVITY_CHECKPOINTS.filter(({ level }) => level === 1).length, 11);
  assert.equal(RELEASE_CANDIDATE_ACTIVITY_CHECKPOINTS.filter(({ level }) => level === 750).length, 7);
  assert.equal(RELEASE_CANDIDATE_ACTIVITY_CHECKPOINTS.filter(({ level }) => level === 150).length, 4);
  assert.deepEqual(RELEASE_CANDIDATE_ACTIVITY_CHECKPOINTS.filter(({ mode }) => mode).map(({ mode }) => mode), ["fishing", "magnet"]);
});

test("completes a fresh player setup, first-job checklist, save and reload journey", () => {
  const storage = new MemoryStorage();
  const runtime = bootstrapState(storage, { now: NOW });
  const economy = new EconomyService(runtime.gameState, runtime.repository, { now: () => NOW });
  const onboarding = new OnboardingService(runtime.gameState, runtime.repository, { economy, now: () => NOW });
  const resident = new CustomResidentService(runtime.gameState, runtime.repository, { now: () => NOW });

  assert.equal(onboarding.getSnapshot().starterGrantClaimed, true);
  assert.equal(onboarding.getSnapshot().coins, 100);
  assert.equal(onboarding.saveTownName("Release Willow").ok, true);
  assert.equal(resident.saveProfile(PROFILE).ok, true);
  assert.equal(onboarding.syncSetupFromResident().ok, true);
  for (const gameKey of ["lawn", "waste", "river"]) assert.equal(onboarding.recordTutorial(gameKey).ok, true);

  const beforeReload = runtime.gameState.getSnapshot();
  const reloaded = bootstrapState(storage, { now: NOW + 1 });
  const afterReload = reloaded.gameState.getSnapshot();
  assert.equal(reloaded.loaded.ok, true);
  assert.equal(afterReload.identity.townName, "Release Willow");
  assert.equal(afterReload.customResident.profile.name, "Meadow");
  assert.equal(afterReload.onboarding.complete, true);
  assert.deepEqual(afterReload.onboarding.tried, beforeReload.onboarding.tried);
  assert.equal(afterReload.economy.coins, beforeReload.economy.coins);
});

test("copies a dense protected HTML save, reconciles it, reloads it and leaves the source untouched", () => {
  const legacyRaw = JSON.stringify(reconciliationV82);
  const storage = new MemoryStorage({ [LEGACY_SAVE_KEY]: legacyRaw });
  const runtime = bootstrapState(storage, { now: NOW });
  assert.equal(runtime.legacyInspection.ok, true);
  const imported = runtime.legacyImporter.createImportedState(runtime.legacyInspection.selected, { now: NOW });
  assert.equal(runtime.gameState.replace(imported).ok, true);
  assert.equal(runtime.repository.save(imported, { now: NOW }).ok, true);

  const reloaded = bootstrapState(storage, { now: NOW + 1 });
  const state = reloaded.gameState.getSnapshot();
  assert.equal(reloaded.loaded.ok, true);
  assert.equal(state.source.kind, "legacy-import");
  assert.equal(state.source.legacyVersion, 82);
  assert.equal(state.legacyReconciliation?.sourceVersion, 82);
  assert.equal(state.legacyReconciliation?.htmlKeysReadOnly, true);
  assert.equal(state.identity.townName, "Reconciled Willow");
  assert.equal(state.economy.coins, 50_000);
  assert.equal(state.customResident.home.level, 3);
  assert.equal(state.fishing.aquariumByItem["pond-goldfish"], 2);
  assert.equal(storage.getItem(LEGACY_SAVE_KEY), legacyRaw);
  assert.notEqual(PHASER_SAVE_KEY, LEGACY_SAVE_KEY);
});

test("recovers the last verified checkpoint when the current Phaser save is damaged", () => {
  const storage = new MemoryStorage();
  const runtime = bootstrapState(storage, { now: NOW });
  assert.equal(runtime.repository.save(runtime.gameState.getSnapshot(), { now: NOW }).ok, true);
  const economy = new EconomyService(runtime.gameState, runtime.repository, { now: () => NOW + 1 });
  assert.equal(economy.credit(25, { reason: "Release-candidate reload checkpoint" }).ok, true);
  storage.setItem(PHASER_SAVE_KEY, "{damaged");

  const recovered = new SaveRepository(storage).load();
  assert.equal(recovered.ok, true);
  assert.equal(recovered.recovered, true);
  assert.equal(recovered.state.economy.coins, 100);
});

test("pins desktop and both mobile viewport gates with 44-pixel touch controls", () => {
  assert.deepEqual(RELEASE_CANDIDATE_VIEWPORTS.map(({ width, height }) => `${width}x${height}`), ["1280x720", "844x390", "390x844"]);
  assert.equal(RELEASE_CANDIDATE_MIN_TOUCH_TARGET, 44);
  assert.equal(RELEASE_CANDIDATE_VIEWPORTS.filter(({ minimumTouchTarget }) => minimumTouchTarget === 44).length, 2);
  assert.equal(RELEASE_CANDIDATE_VIEWPORTS.every(({ allowedPageOverflow }) => allowedPageOverflow === 0), true);
});

test("keeps the release-candidate browser route read-only and production-excluded", async () => {
  const main = await readText("src/main.js");
  assert.match(main, /qaMode === "release-candidate"/);
  assert.match(main, /dataset\.releaseCandidateReady/);
  assert.match(main, /dataset\.releaseCandidateCheckpoints/);
  assert.match(main, /const readOnlyQa = import\.meta\.env\.DEV/);
  assert.match(main, /if \(!readOnlyQa\) onboardingController\.processLogin\(\)/);
  const routeBlock = main.match(/if \(import\.meta\.env\.DEV && qaMode === "release-candidate"\) \{([\s\S]*?)\n\}/)?.[1] || "";
  assert.doesNotMatch(routeBlock, /save|update|create|grant|credit|debit|purchase|processLogin/i);
});

test("keeps every player-facing journey owner and mobile safety rule in the shipped interface", async () => {
  const [main, lazyScenes, movement, markup, styles] = await Promise.all([readText("src/main.js"), readText("src/scenes/lazyScenes.js"), readText("src/systems/MovementController.js"), readText("index.html"), readText("src/style.css")]);
  const sceneWiring = `${main}\n${lazyScenes}`;
  for (const required of ["save-status-button", "onboarding-button", "shop-button", "inventory-button", "impact-button", "npc-stories-button"]) {
    assert.match(markup, new RegExp(`id=["']${required}["']`), required);
  }
  assert.doesNotMatch(markup, /id=["']zoom-(?:in|out)["']/);
  assert.doesNotMatch(markup, /class=["'][^"']*town-title/);
  assert.doesNotMatch(markup, /class=["'][^"']*touch-controls|data-move=/);
  assert.match(movement, /bindSwipeControls/);
  assert.match(movement, /addEventListener\("pointerup", this\.onSwipePointerUp\)/);
  for (const scene of ["TownScene", "HouseInteriorScene", "VillageGrocerScene", "PawsWondersScene", "HarbourGeneralScene", "FishingScene"]) {
    assert.match(sceneWiring, new RegExp(`\\b${scene}\\b`), scene);
  }
  assert.match(styles, /min-height:\s*44px/);
  assert.ok(!styles.includes('body[data-game-scene="RiverClearoutScene"] .landscape-required'));
});
