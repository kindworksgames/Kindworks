import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import {
  BEACH_BUILD_VERSION,
  BEACH_PAYLOAD_SHA256,
  BEACH_SOURCE_SHA256,
  BEACH_TOTAL_LEVELS,
  BeachCleanupEngine,
  beachCertifiedRoute,
  beachLevelSummary,
  generateBeachLevel,
  validateBeachCatalogue,
  verifyBeachLevel,
} from "../src/data/beachCleanup.js";
import { createFreshGameState, GameStateService, upgradeGameState, validateGameState } from "../src/state/GameState.js";
import { projectLegacyBeachCleanup } from "../src/state/beachCleanupState.js";
import { SaveRepository } from "../src/state/SaveRepository.js";
import { BeachCleanupService, calculateBeachCampaignReward } from "../src/systems/BeachCleanupService.js";
import { MemoryStorage } from "./helpers/MemoryStorage.js";

function runtime({ state = createFreshGameState({ now: 0 }), repository = new SaveRepository(new MemoryStorage()), now = () => 1000 } = {}) {
  const gameState = new GameStateService(state);
  const beachCleanup = new BeachCleanupService(gameState, repository, { now });
  return { gameState, beachCleanup, repository };
}

test("pins the protected Beach Cleanup build, hashes and all 750 deterministic levels", async () => {
  assert.equal(BEACH_BUILD_VERSION, "1.0.0-kindworks-integrated");
  assert.equal(BEACH_TOTAL_LEVELS, 750);
  assert.equal(BEACH_SOURCE_SHA256, "0b85bd71385b83e7a13676f7593ce376245959fa4ebf1a6b9a0e6765297aa5a5");
  assert.equal(BEACH_PAYLOAD_SHA256, "a933de6e550e08a8aecd240b5f19ab9514b90e44bc73bec54c9ce725bbf478bd");
  const source = await readFile(new URL("../kindworks_little_bakery_v65_house_rescue_reintegrated_fixed.html", import.meta.url));
  assert.equal(createHash("sha256").update(source).digest("hex"), BEACH_SOURCE_SHA256);
  const payload = source.toString("utf8").match(/const EMBEDDED_BEACH_CLEANUP_HTML_B64="([^"]+)"/)?.[1];
  assert.ok(payload);
  assert.equal(createHash("sha256").update(Buffer.from(payload, "base64")).digest("hex"), BEACH_PAYLOAD_SHA256);
  assert.deepEqual(beachLevelSummary(1), { level: 1, width: 7, height: 7, sand: 24, rubbish: 1, umbrellas: 1, chairs: 0, tides: 0, moveLimit: 37 });
  assert.deepEqual(beachLevelSummary(750), { level: 750, width: 15, height: 13, sand: 132, rubbish: 50, umbrellas: 4, chairs: 3, tides: 4, moveLimit: 183 });
  assert.deepEqual(generateBeachLevel(1).rows, ["#######", "#.....#", "#.....#", "#.....#", "#....R#", "P....U#", "#######"]);
  assert.deepEqual(generateBeachLevel(750).rows, generateBeachLevel(750).rows);
  assert.equal(validateBeachCatalogue().ok, true);
});

test("representative early, middle and final beaches retain certified complete walks", () => {
  for (const level of [1, 125, 375, 625, 750]) {
    const verification = verifyBeachLevel(level);
    assert.equal(verification.ok, true, `Level ${level} failed its certified route`);
  }
});

test("walking rakes the tile being left, reveals rubbish, caps rewards and supports undo", () => {
  const engine = new BeachCleanupEngine(1);
  assert.equal(engine.move("R").ok, true);
  const raked = engine.move("U");
  assert.equal(raked.ok, true);
  assert.equal(raked.state.rakedCells.includes("5,1"), true);
  assert.equal(engine.undo().ok, true);
  assert.equal(engine.snapshot().rakedCells.includes("5,1"), false);
  const certified = new BeachCleanupEngine(750);
  for (const direction of beachCertifiedRoute(750)) { if (certified.won) break; assert.equal(certified.move(direction).ok, true); }
  assert.equal(certified.won, true);
  assert.equal(certified.snapshot().collectedRubbish, 50);
  assert.ok(certified.earnedCoins > 0 && certified.earnedCoins <= 170);
});

test("campaign first clears use the shared level formula and replays never pay twice", () => {
  assert.equal(calculateBeachCampaignReward(1), 100);
  assert.equal(calculateBeachCampaignReward(750), 170);
  const { gameState, beachCleanup } = runtime();
  const first = beachCleanup.beginCampaign(750);
  const cleared = beachCleanup.completeCertified(first.session.id);
  assert.equal(cleared.ok, true);
  assert.equal(cleared.result.rewardCoins, 170);
  assert.equal(cleared.result.firstClear, true);
  assert.equal(gameState.getSnapshot().economy.coins, 270);
  assert.equal(gameState.getSnapshot().economy.ledger.at(-1).kind, "campaign-first-clear");
  const replay = beachCleanup.beginCampaign(750);
  const replayed = beachCleanup.completeCertified(replay.session.id);
  assert.equal(replayed.result.firstClear, false);
  assert.equal(replayed.result.rewardCoins, 0);
  assert.equal(gameState.getSnapshot().economy.coins, 270);
});

test("a South Shore job banks native finds, removes town litter and later regenerates", () => {
  let clock = 1000;
  const { gameState, beachCleanup } = runtime({ now: () => clock });
  const started = beachCleanup.beginTownJob({ returnPosition: { x: 3220, y: 2320 }, returnFacing: "left" });
  const cleared = beachCleanup.completeCertified(started.session.id);
  assert.equal(cleared.ok, true);
  assert.ok(cleared.rewardCoins > 0 && cleared.rewardCoins <= 170);
  assert.deepEqual(cleared.townEffect.targetId, "south-shore");
  let state = gameState.getSnapshot();
  assert.equal(state.beachCleanup.southShore.dirty, false);
  assert.equal(state.beachCleanup.southShore.litterCount, 0);
  assert.equal(state.progress.completedJobCount, 1);
  state.beachCleanup.southShore.nextDirtyDay = state.world.day;
  assert.equal(gameState.replace(state).ok, true);
  clock += 1000;
  const refreshed = beachCleanup.refresh();
  assert.equal(refreshed.changed, true);
  assert.equal(beachCleanup.getSouthShoreSnapshot().dirty, true);
  assert.ok(beachCleanup.getSouthShoreSnapshot().litterCount >= 8);
});

test("an in-progress beach and its return point survive a safe reload", () => {
  const storage = new MemoryStorage();
  const repository = new SaveRepository(storage);
  const first = runtime({ repository });
  const started = first.beachCleanup.beginCampaign(25, { returnPosition: { x: 3200, y: 2310 }, returnFacing: "right" });
  assert.equal(first.beachCleanup.move(started.session.id, "R").ok, true);
  const loaded = repository.load();
  assert.equal(loaded.ok, true);
  const resumed = runtime({ state: loaded.state, repository });
  const session = resumed.beachCleanup.getActiveSession();
  assert.equal(session.assignedLevel, 25);
  assert.equal(session.moves, 1);
  assert.equal(session.undoStack.length, 1);
  assert.deepEqual(session.returnPosition, { x: 3200, y: 2310 });
  assert.equal(session.returnFacing, "right");
  assert.equal(validateGameState(resumed.gameState.getSnapshot()).ok, true);
});

test("schema 15 saves and original beach progress upgrade through schema 19", () => {
  const old = createFreshGameState({ now: 0 });
  delete old.beachCleanup;
  old.schemaVersion = 15;
  const upgraded = upgradeGameState(old, { now: 0 });
  assert.equal(upgraded.schemaVersion, 32);
  assert.equal(upgraded.beachCleanup.progress.nextLevel, 1);
  assert.equal(validateGameState(upgraded).ok, true);
  const projected = projectLegacyBeachCleanup({ miniGames: { progress: { beach: { nextLevel: 44, best: { 1: { stars: 3, percent: 100 }, 43: { stars: 3, percent: 100 } } } } }, environment: { beachLitter: 7 } });
  assert.equal(projected.progress.nextLevel, 44);
  assert.equal(projected.progress.completed, 2);
  assert.equal(projected.southShore.litterCount, 7);
});

test("a Beach Cleanup save failure restores the exact active attempt and wallet", () => {
  let fail = false;
  const repository = { save: () => fail ? { ok: false, status: "write-failed" } : { ok: true, status: "saved" } };
  const { gameState, beachCleanup } = runtime({ repository });
  const session = beachCleanup.beginCampaign(10).session;
  const before = gameState.getSnapshot();
  fail = true;
  const result = beachCleanup.completeCertified(session.id);
  assert.equal(result.code, "persistence-failed");
  assert.deepEqual(gameState.getSnapshot(), before);
});
