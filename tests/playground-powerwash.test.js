import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import {
  POWERWASH_BUILD_VERSION,
  POWERWASH_CANVAS,
  POWERWASH_GRID,
  POWERWASH_MASTER_ART_SHA256,
  POWERWASH_MINIMUM_CLEAN_PERCENT,
  POWERWASH_NOZZLES,
  POWERWASH_PAYLOAD_SHA256,
  POWERWASH_REFERENCE_DIRT_SHA256,
  POWERWASH_SIMULATION_REVISION,
  POWERWASH_SOURCE_SHA256,
  POWERWASH_TOTAL_LEVELS,
  POWERWASH_VISUAL_REVISION,
  PlaygroundPowerwashEngine,
  calculatePowerwashNativeReward,
  generatePowerwashLevel,
  powerwashDifficulty,
  validatePowerwashCatalogue,
} from "../src/data/playgroundPowerwash.js";
import { createFreshGameState, GameStateService, upgradeGameState, validateGameState } from "../src/state/GameState.js";
import { powerwashDirtyInterval, projectLegacyPlaygroundPowerwash } from "../src/state/playgroundPowerwashState.js";
import { SaveRepository } from "../src/state/SaveRepository.js";
import { advanceWorldState } from "../src/state/worldState.js";
import { PlaygroundPowerwashService, calculatePowerwashCampaignReward } from "../src/systems/PlaygroundPowerwashService.js";
import { LEGACY_POWERWASH_RENDER_REVISION } from "../src/rendering/LegacyPowerwashRenderer.js";
import { MemoryStorage } from "./helpers/MemoryStorage.js";

function runtime({ state = createFreshGameState({ now: 0 }), repository = new SaveRepository(new MemoryStorage()), now = () => 1000 } = {}) {
  const gameState = new GameStateService(state);
  const powerwash = new PlaygroundPowerwashService(gameState, repository, { now });
  return { gameState, powerwash, repository };
}

function sha256(value) { return createHash("sha256").update(value).digest("hex"); }

test("pins the protected Playground Power Wash source, actual payload and approved artwork", async () => {
  assert.equal(POWERWASH_BUILD_VERSION, "1.1.0-kindworks-soap-restored");
  assert.equal(POWERWASH_VISUAL_REVISION, "v33-pixel-soap-stains");
  assert.equal(POWERWASH_TOTAL_LEVELS, 750);
  const source = await readFile(new URL("../kindworks_little_bakery_v65_house_rescue_reintegrated_fixed.html", import.meta.url));
  assert.equal(sha256(source), POWERWASH_SOURCE_SHA256);
  const payloadBase64 = source.toString("utf8").match(/const EMBEDDED_POWERWASH_HTML_B64="([^"]+)"/)?.[1];
  assert.ok(payloadBase64);
  const payload = Buffer.from(payloadBase64, "base64");
  assert.equal(sha256(payload), POWERWASH_PAYLOAD_SHA256);
  assert.equal(payload.length, 6_259_867);
  const html = payload.toString("utf8");
  assert.match(html, /POWERWASH_BUILD_VERSION='1\.1\.0-kindworks-soap-restored'/);
  assert.match(html, /POWERWASH_VISUAL_REVISION='v33-pixel-soap-stains'/);
  for (const [name, expected] of [["POWERWASH_MASTER_ART", POWERWASH_MASTER_ART_SHA256], ["POWERWASH_REFERENCE_DIRT_ART", POWERWASH_REFERENCE_DIRT_SHA256]]) {
    const encoded = html.match(new RegExp(`const ${name}='data:image/png;base64,([^']+)'`))?.[1];
    assert.ok(encoded, `${name} is embedded`);
    assert.equal(sha256(Buffer.from(encoded, "base64")), expected);
  }
  assert.deepEqual(POWERWASH_CANVAS, { width: 1536, height: 1024, wash: { x: 54, y: 117, width: 1428, height: 706 } });
  const [master, dirt] = await Promise.all([
    readFile(new URL("../public/assets/powerwash/playground-master.png", import.meta.url)),
    readFile(new URL("../public/assets/powerwash/playground-reference-dirt.png", import.meta.url)),
  ]);
  assert.equal(sha256(master), POWERWASH_MASTER_ART_SHA256);
  assert.equal(sha256(dirt), POWERWASH_REFERENCE_DIRT_SHA256);
});

test("recreates all 750 deterministic difficulty levels and exact tool constants", () => {
  assert.equal(POWERWASH_SIMULATION_REVISION, "phase-3-continuous-spray-v1");
  assert.deepEqual(POWERWASH_NOZZLES.precision, { radius: 0.64, drain: 8.5, power: 1.15, label: "Precision" });
  assert.deepEqual(POWERWASH_NOZZLES.standard, { radius: 1, drain: 12, power: 1, label: "Standard" });
  assert.deepEqual(POWERWASH_NOZZLES.wide, { radius: 1.48, drain: 17, power: 0.82, label: "Wide" });
  assert.deepEqual(powerwashDifficulty(1), { level: 1, t: 0, blobs: 4, grit: 40, baseRadius: 48, regen: 6, stainOpacity: 0.34, cleanStrength: 1, drainMult: 0.9, resistantStainCount: 5 });
  const finalDifficulty = powerwashDifficulty(750);
  assert.deepEqual({ ...finalDifficulty, drainMult: Number(finalDifficulty.drainMult.toFixed(2)) }, { level: 750, t: 1, blobs: 300, grit: 6000, baseRadius: 28, regen: 2.8, stainOpacity: 0.52, cleanStrength: 0.38, drainMult: 1.45, resistantStainCount: 10 });
  assert.equal(generatePowerwashLevel(375).fingerprint, generatePowerwashLevel(375).fingerprint);
  assert.notEqual(generatePowerwashLevel(1).fingerprint, generatePowerwashLevel(750).fingerprint);
  assert.deepEqual(validatePowerwashCatalogue(), { ok: true, issues: [], levels: 750, uniqueLevels: 750, version: POWERWASH_BUILD_VERSION, visualRevision: POWERWASH_VISUAL_REVISION });
});

test("continuous spraying interpolates movement and keeps cleaning a stationary resistant cell", () => {
  const engine = new PlaygroundPowerwashEngine(750);
  engine.selectTool("water", "precision");
  const normalIndex = engine.snapshot().normal[0][0];
  const row = Math.floor(normalIndex / POWERWASH_GRID.columns);
  const col = normalIndex % POWERWASH_GRID.columns;
  const before = new Map(engine.snapshot().normal).get(normalIndex);
  engine.spraySegment(row, col, row, col, { deltaMs: 55 });
  const first = new Map(engine.snapshot().normal).get(normalIndex) || 0;
  engine.spraySegment(row, col, row, col, { deltaMs: 55 });
  const second = new Map(engine.snapshot().normal).get(normalIndex) || 0;
  assert.ok(first < before);
  assert.ok(second < first);

  const midpoint = row * POWERWASH_GRID.columns + Math.min(POWERWASH_GRID.columns - 1, col + 5);
  const path = new PlaygroundPowerwashEngine(1, { normal: [[normalIndex, 1], [midpoint, 1]], resistant: [], water: 100, soap: 100 });
  path.selectTool("water", "standard");
  const result = path.spraySegment(row, col, row, Math.min(POWERWASH_GRID.columns - 1, col + 5), { deltaMs: 180 });
  assert.ok(result.samples > 2);
  assert.ok((new Map(path.snapshot().normal).get(midpoint) || 0) < 1);
});

test("full-resolution completion defers the grid tolerance to the approved pixel mask", () => {
  const engine = new PlaygroundPowerwashEngine(1);
  const dirty = engine.snapshot().normal[0][0];
  const row = Math.floor(dirty / POWERWASH_GRID.columns);
  const col = dirty % POWERWASH_GRID.columns;
  const deferred = engine.spraySegment(row, col, row, col, { deltaMs: 180, autoComplete: false });
  assert.equal(deferred.ok, true);
  assert.equal(engine.snapshot().won, false);

  const { gameState, powerwash } = runtime();
  const started = powerwash.beginCampaign(1);
  assert.equal(powerwash.completeVisual(started.session.id, 96).code, "not-clean-enough");
  assert.equal(powerwash.getActiveSession().id, started.session.id);
  const completed = powerwash.completeVisual(started.session.id, 97);
  assert.equal(completed.ok, true);
  assert.equal(completed.result.rawPercent, 97);
  assert.equal(completed.result.percent, 100);
  assert.equal(gameState.getSnapshot().economy.coins, 200);
});

test("ports the protected layered dirt, radial wash, foam, wetness, mist and wand renderer", async () => {
  assert.equal(LEGACY_POWERWASH_RENDER_REVISION, "phase-3-full-resolution-layers-v1");
  const renderer = await readFile(new URL("../src/rendering/LegacyPowerwashRenderer.js", import.meta.url), "utf8");
  for (const contract of ["restoreFullyDirtyReference", "addBalancedDirtCoverage", "addLevelDirtDetail", "addSoapRequiredStains", "destination-out", "createRadialGradient", "spawnMist", "drawNozzle"]) assert.match(renderer, new RegExp(contract));
});

test("water and soap recover by elapsed idle time without switching tools", () => {
  const engine = new PlaygroundPowerwashEngine(750, { water: 0, soap: 0 });
  const recovered = engine.recover(1000);
  assert.equal(recovered.changed, true);
  assert.equal(engine.snapshot().water, 2.8);
  assert.equal(engine.snapshot().soap, 2.02);
});

test("soap-resistant stains ignore plain water, then release after soap and rinsing", () => {
  const engine = new PlaygroundPowerwashEngine(1);
  const index = engine.snapshot().resistant[0];
  const row = Math.floor(index / 48);
  const col = index % 48;
  engine.selectTool("water", "precision");
  engine.sprayAt(row, col);
  assert.equal(engine.snapshot().resistant.includes(index), true);
  engine.selectTool("soap");
  assert.equal(engine.sprayAt(row, col).ok, true);
  assert.equal(engine.snapshot().soaped.includes(index), true);
  engine.selectTool("water", "precision");
  assert.equal(engine.sprayAt(row, col).ok, true);
  assert.equal(engine.snapshot().resistant.includes(index), false);
});

test("the original 97-percent tolerance clears all remaining residue and caps native rewards", () => {
  const engine = new PlaygroundPowerwashEngine(750);
  assert.equal(engine.finish(96), false);
  assert.equal(engine.finish(POWERWASH_MINIMUM_CLEAN_PERCENT), true);
  const finished = engine.snapshot();
  assert.equal(finished.won, true);
  assert.equal(finished.percent, 100);
  assert.equal(finished.rawPercentAtCompletion, 97);
  assert.equal(finished.remainingDirtyCells, 0);
  assert.equal(calculatePowerwashNativeReward(1), 101);
  assert.equal(calculatePowerwashNativeReward(750), 170);
});

test("Level 750 first clear pays 170 coins once and a campaign replay pays zero", () => {
  assert.equal(calculatePowerwashCampaignReward(1), 100);
  assert.equal(calculatePowerwashCampaignReward(750), 170);
  const { gameState, powerwash } = runtime();
  const first = powerwash.beginCampaign(750);
  const cleared = powerwash.completeCertified(first.session.id);
  assert.equal(cleared.result.rewardCoins, 170);
  assert.equal(cleared.result.firstClear, true);
  assert.equal(gameState.getSnapshot().economy.coins, 270);
  assert.equal(gameState.getSnapshot().economy.ledger.at(-1).kind, "campaign-first-clear");
  const replay = powerwash.beginCampaign(750);
  const replayed = powerwash.completeCertified(replay.session.id);
  assert.equal(replayed.result.rewardCoins, 0);
  assert.equal(replayed.result.firstClear, false);
  assert.equal(gameState.getSnapshot().economy.coins, 270);
});

test("a Commons Playground job pays its native reward, cleans town and returns after two or three days", () => {
  const { gameState, powerwash } = runtime();
  const started = powerwash.beginTownJob({ returnPosition: { x: 1940, y: 1180 }, returnFacing: "left" });
  const cleared = powerwash.completeCertified(started.session.id);
  assert.equal(cleared.result.rewardCoins, 101);
  assert.equal(cleared.townEffect.targetId, "commons-playground");
  let state = gameState.getSnapshot();
  assert.equal(state.playgroundPowerwash.playground.dirty, false);
  assert.equal(state.progress.completedJobCount, 1);
  assert.ok([2, 3].includes(cleared.townEffect.intervalDays));
  state.world = advanceWorldState(state.world, cleared.townEffect.intervalDays * 1440, { now: 2000 }).world;
  assert.equal(gameState.replace(state).ok, true);
  assert.equal(powerwash.refresh().changed, true);
  assert.equal(powerwash.getPlaygroundSnapshot().dirty, true);
  assert.ok([2, 3].includes(powerwashDirtyInterval(20, 5)));
});

test("an exact active washer, supplies, tool and return point survive a safe reload", () => {
  const storage = new MemoryStorage();
  const repository = new SaveRepository(storage);
  const first = runtime({ repository });
  const started = first.powerwash.beginCampaign(375, { returnPosition: { x: 1900, y: 1170 }, returnFacing: "right" });
  first.powerwash.selectTool(started.session.id, "soap");
  const stain = first.powerwash.getSessionState().resistant[0];
  first.powerwash.spray(started.session.id, Math.floor(stain / 48), stain % 48);
  const loaded = repository.load();
  assert.equal(loaded.ok, true);
  const resumed = runtime({ state: loaded.state, repository });
  const session = resumed.powerwash.getActiveSession();
  assert.equal(session.assignedLevel, 375);
  assert.equal(session.toolMode, "soap");
  assert.ok(session.soap < 100);
  assert.ok(session.soaped.length > 0);
  assert.deepEqual(session.returnPosition, { x: 1900, y: 1170 });
  assert.equal(session.returnFacing, "right");
  assert.equal(validateGameState(resumed.gameState.getSnapshot()).ok, true);
});

test("schema 16 and legacy playground data upgrade to schema 19 while failed saves roll back exactly", () => {
  const old = createFreshGameState({ now: 0 });
  delete old.playgroundPowerwash;
  old.schemaVersion = 16;
  const upgraded = upgradeGameState(old, { now: 0 });
  assert.equal(upgraded.schemaVersion, 37);
  assert.equal(upgraded.playgroundPowerwash.playground.dirty, true);
  const legacy = projectLegacyPlaygroundPowerwash({ miniGames: { progress: { playground: { nextLevel: 4, best: { 3: { stars: 3, percent: 100 } } } } }, playgroundPowerwashing: { dirty: false, lastCleanedDay: 5, nextDirtyDay: 8, cleanings: 2 } });
  assert.equal(legacy.progress.completed, 1);
  assert.equal(legacy.progress.nextLevel, 4);
  assert.equal(legacy.playground.dirty, false);
  const gameState = new GameStateService(createFreshGameState({ now: 0 }));
  const before = gameState.getSnapshot();
  const failingRepository = { save: () => ({ ok: false, status: "write-failed" }) };
  const powerwash = new PlaygroundPowerwashService(gameState, failingRepository, { now: () => 1000 });
  const result = powerwash.beginCampaign(1);
  assert.equal(result.code, "persistence-failed");
  assert.deepEqual(gameState.getSnapshot(), before);
});
