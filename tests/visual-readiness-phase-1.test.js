import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { COMMONS_RUBBISH_JOB } from "../src/data/cleanupJobs.js";
import { cardinalDirection } from "../src/input/mobileGestures.js";
import { createFidelityStorage } from "../src/qa/fidelityContract.js";
import {
  VISUAL_REGRESSION_SCENARIOS,
  VISUAL_REGRESSION_VIEWPORTS,
  createVisualRegressionFixtureState,
  seedVisualRegressionStorage,
} from "../src/qa/visualRegressionFixtures.js";
import { validateGameState, GameStateService } from "../src/state/GameState.js";
import { SaveRepository } from "../src/state/SaveRepository.js";
import { CleanupJobService } from "../src/systems/CleanupJobService.js";
import { InteractionSystem } from "../src/systems/InteractionSystem.js";
import { NpcTownLifeService } from "../src/systems/NpcTownLifeService.js";
import { RestorationMilestoneService } from "../src/systems/RestorationMilestoneService.js";
import { shouldPauseForOrientation } from "../src/ui/ResponsiveShellController.js";
import { MemoryStorage } from "./helpers/MemoryStorage.js";

const root = new URL("../", import.meta.url);
const readText = (path) => readFile(new URL(path, root), "utf8");
const digest = (value) => createHash("sha256").update(JSON.stringify(value)).digest("hex");

test("defines supported landscape phone, tablet, reference and desktop profiles", () => {
  assert.deepEqual(VISUAL_REGRESSION_VIEWPORTS.map(({ width, height }) => `${width}x${height}`), [
    "568x320", "844x390", "1024x768", "1280x720", "1366x768",
  ]);
  assert.deepEqual(new Set(VISUAL_REGRESSION_VIEWPORTS.map(({ family }) => family)), new Set(["phone", "tablet", "desktop"]));
  for (const profile of VISUAL_REGRESSION_VIEWPORTS) {
    assert.ok(profile.width > profile.height, profile.id);
    assert.equal(shouldPauseForOrientation({ width: profile.width, height: profile.height, sceneKey: "TownScene" }), false, profile.id);
  }
});

test("maps every major visual family to a valid deterministic baseline scenario", async () => {
  const lazyScenes = await readText("src/scenes/lazyScenes.js");
  assert.deepEqual(VISUAL_REGRESSION_SCENARIOS.map(({ family }) => family), [
    "world", "interior", "shop", "restaurant", "cleanup", "special-renderer",
  ]);
  assert.equal(new Set(VISUAL_REGRESSION_SCENARIOS.map(({ id }) => id)).size, VISUAL_REGRESSION_SCENARIOS.length);
  for (const scenario of VISUAL_REGRESSION_SCENARIOS) {
    assert.ok(VISUAL_REGRESSION_VIEWPORTS.some(({ id }) => id === scenario.viewportId), scenario.id);
    if (scenario.scene !== "TownScene") assert.match(lazyScenes, new RegExp(`\\b${scenario.scene}\\b`), scenario.scene);
  }
});

test("creates a schema-valid, deterministic and representative safe save", () => {
  const first = createVisualRegressionFixtureState();
  const second = createVisualRegressionFixtureState();
  assert.equal(validateGameState(first).ok, true);
  assert.equal(digest(first), digest(second));
  assert.equal(first.schemaVersion, 37);
  assert.equal(first.economy.coins, 12_500);
  assert.equal(first.inventory.equipped.mower, "swiftcut-mower");
  assert.equal(first.animals.activeAnimalId, "animal-dog-1");
  assert.equal(first.animals.residents["animal-dog-1"].adopted, true);
  assert.equal(first.npcs.residents.find(({ id }) => id === "npc-01").narrativeState.storyStage, 1);
  assert.equal(first.restorationMilestones.unlocked.commons, true);
  assert.equal(first.onboarding.complete, true);
  assert.equal(first.cafe.unlockedLevel, 4);
});

test("seeds and reloads only the isolated QA namespace", () => {
  const backing = new MemoryStorage({ unrelated: "preserve-me" });
  const isolated = createFidelityStorage(backing, "kindworks:visual-regression:");
  assert.equal(seedVisualRegressionStorage(isolated).ok, true);
  const loaded = new SaveRepository(isolated).load();
  assert.equal(loaded.ok, true);
  assert.equal(loaded.state.identity.townName, "Regression Willow");
  assert.equal(loaded.state.economy.coins, 12_500);
  assert.equal(backing.getItem("unrelated"), "preserve-me");
  assert.equal(backing.getItem("kindworks_phaser_v1"), null);
});

test("smokes scene transition, interaction, completion reward, duplicate prevention and reload", () => {
  const storage = new MemoryStorage();
  const repository = new SaveRepository(storage);
  const gameState = new GameStateService(createVisualRegressionFixtureState());
  const cleanup = new CleanupJobService(gameState, repository, { now: () => 1_767_268_800_000 });
  const interaction = new InteractionSystem({
    interactables: [{ id: "commons-job", x: 0, y: 0, radius: 60, onActivate: () => cleanup.begin(COMMONS_RUBBISH_JOB.id) }],
  });

  interaction.update(0, 0);
  const started = interaction.activateCurrent();
  assert.equal(started.ok, true);
  assert.equal(gameState.getSnapshot().player.scene, "WasteCollectionScene");
  const beforeReward = gameState.getSnapshot().economy.coins;
  const completed = cleanup.complete(started.session.id, { collectedItemIds: started.session.itemIds });
  assert.equal(completed.ok, true);
  assert.equal(gameState.getSnapshot().player.scene, "TownScene");
  assert.equal(gameState.getSnapshot().economy.coins, beforeReward + completed.rewardCoins);
  assert.equal(cleanup.complete(started.session.id, { collectedItemIds: started.session.itemIds }).duplicate, true);
  assert.equal(gameState.getSnapshot().economy.coins, beforeReward + completed.rewardCoins);
  assert.equal(repository.load().state.economy.coins, beforeReward + completed.rewardCoins);
});

test("smokes deterministic NPC movement without mutating reward or inventory domains", () => {
  const gameState = new GameStateService(createVisualRegressionFixtureState());
  const repository = { save: () => ({ ok: true }) };
  const service = new NpcTownLifeService(gameState, repository, { now: () => 1_000 });
  const beforeState = gameState.getSnapshot();
  const beforeNpc = service.getResidents().find(({ id }) => id === "npc-01");
  service.update(1_000, { day: 1, clockMinutes: 480, weather: beforeState.world.weather });
  const afterNpc = service.getResidents().find(({ id }) => id === "npc-01");
  const afterState = gameState.getSnapshot();
  assert.notDeepEqual({ x: afterNpc.x, y: afterNpc.y }, { x: beforeNpc.x, y: beforeNpc.y });
  assert.deepEqual(afterState.economy, beforeState.economy);
  assert.deepEqual(afterState.inventory, beforeState.inventory);
});

test("smokes player cardinal movement inputs and restoration-state persistence", () => {
  assert.equal(cardinalDirection(80, 6, 24), "R");
  assert.equal(cardinalDirection(-80, 6, 24), "L");
  assert.equal(cardinalDirection(4, -80, 24), "U");
  assert.equal(cardinalDirection(4, 80, 24), "D");

  const storage = new MemoryStorage();
  const repository = new SaveRepository(storage);
  const gameState = new GameStateService(createVisualRegressionFixtureState());
  const restoration = new RestorationMilestoneService(gameState, repository, { now: () => 1_767_268_800_000 });
  assert.equal(restoration.unlockForQa("highstreet", { revealed: true }).ok, true);
  const reloaded = repository.load();
  assert.equal(reloaded.ok, true);
  assert.equal(reloaded.state.restorationMilestones.unlocked.highstreet, true);
  assert.equal(reloaded.state.restorationMilestones.revealed.highstreet, true);
});

test("keeps the visual-regression route development-only and hidden from normal players", async () => {
  const main = await readText("src/main.js");
  assert.match(main, /const visualRegressionQa = import\.meta\.env\.DEV && qaMode === "visual-regression"/);
  assert.match(main, /if \(visualRegressionQa\) seedVisualRegressionStorage\(runtimeStorage\)/);
  assert.match(main, /else if \(!visualRegressionQa && !scaleCalibrationQa\) fidelityHarness\.mountPanel\(\)/);
  assert.match(main, /dataset\.visualRegressionReady/);
});
