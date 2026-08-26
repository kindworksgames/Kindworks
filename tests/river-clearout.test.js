import test from "node:test";
import assert from "node:assert/strict";
import {
  RIVER_LEVELS,
  RIVER_RULES,
  RIVER_TOTAL_LEVELS,
  RiverClearoutEngine,
  RiverLevelSolver,
  getRiverCatalogueFingerprint,
  validateRiverCatalogue,
} from "../src/data/riverClearout.js";
import { createFreshGameState, GameStateService, upgradeGameState, validateGameState } from "../src/state/GameState.js";
import { projectLegacyRiver } from "../src/state/riverState.js";
import { SaveRepository } from "../src/state/SaveRepository.js";
import { calculateCleanupReward } from "../src/systems/CleanupJobService.js";
import { RiverClearoutService } from "../src/systems/RiverClearoutService.js";
import { MemoryStorage } from "./helpers/MemoryStorage.js";

function runtime({ state = createFreshGameState({ now: 0 }), repository = new SaveRepository(new MemoryStorage()) } = {}) {
  const gameState = new GameStateService(state);
  const river = new RiverClearoutService(gameState, repository, { now: () => 1000 });
  return { gameState, river, repository };
}

async function completeLevelOne(river) {
  assert.equal(river.startLevel(1, { autoFall: false }).ok, true);
  const certified = await river.certifiedPath({ threeStars: true, beamWidth: 250 });
  assert.equal(certified.ok, true);
  assert.equal(certified.achievement.percent, 100);
  return river.playPath(certified.path);
}

test("pins the original exact 750-level River Clear-Out catalogue", () => {
  const validation = validateRiverCatalogue();
  assert.equal(RIVER_LEVELS.count(), 750);
  assert.equal(RIVER_TOTAL_LEVELS, 750);
  assert.equal(validation.valid, true, validation.errors.join("\n"));
  assert.equal(validation.fingerprint, "fnv1a-cea61399");
  assert.equal(getRiverCatalogueFingerprint(), "fnv1a-cea61399");
  assert.equal(validation.packedBytes, 149989);
  assert.equal(validation.rulesFingerprint, "KW-RIVER-1.6-10x16-900-550-50-80-U5-R8-K9-FINITE-LJSTABLE-GENTLE50-TRANS60-GRAVITY-CASCADE");
  assert.deepEqual(RIVER_LEVELS.packedData()[0], { id: 1, n: "River Challenge 001", b: "7XXX/5XXXXX/X2X2X3/XX1X1XX3/XX1X1XXX2/X4X2XX/4XX2XX", q: "IILJJOLTOT", s3: 10, d: 58, band: "Early Challenge", src: 9 });
  assert.equal(RIVER_LEVELS.packedData().at(-1).id, 750);
  assert.equal(RIVER_LEVELS.packedData().at(-1).q, "OSTTSTTOOZLOITZZJTZZJLTOOOLTO");
});

test("all 750 hydrated levels are deterministic, settled, finite, and immediately playable", () => {
  let previousDifficulty = -Infinity;
  for (let id = 1; id <= RIVER_TOTAL_LEVELS; id += 1) {
    const level = RIVER_LEVELS.get(id);
    assert.equal(level.id, id);
    assert.equal(level.width, 10);
    assert.equal(level.height, 16);
    assert.equal(level.board.length, 16);
    assert.ok(level.board.every((row) => row.length === 10));
    assert.ok(level.queue.length > 0);
    assert.ok(level.queue.every((piece) => Object.hasOwn(RIVER_LEVELS.shapes, piece)));
    assert.ok(level.difficultyScore >= previousDifficulty);
    previousDifficulty = level.difficultyScore;
    const engine = new RiverClearoutEngine(level, RIVER_LEVELS.shapes, RIVER_LEVELS.icons);
    assert.ok(engine.current, `Level ${id} did not spawn its first finite-queue piece.`);
    for (let row = 0; row < level.height - 1; row += 1) {
      for (let column = 0; column < level.width; column += 1) {
        if (engine.board[row][column] && !engine.board[row][column].rock) assert.ok(engine.board[row + 1][column], `Level ${id} has unsupported starting rubbish.`);
      }
    }
  }
  const original = JSON.stringify(RIVER_LEVELS.get(417));
  RIVER_LEVELS.clearCache();
  assert.equal(JSON.stringify(RIVER_LEVELS.get(417)), original);
});

test("the first 60 levels retain the exact gentle transition and heavy-rubbish handoff", () => {
  assert.deepEqual([RIVER_LEVELS.get(1).fallIntervalMs, RIVER_LEVELS.get(1).lockDelayMs, RIVER_LEVELS.get(1).maxUndos, RIVER_LEVELS.get(1).difficultyScore], [1400, 1000, 10, 10]);
  assert.deepEqual([RIVER_LEVELS.get(50).fallIntervalMs, RIVER_LEVELS.get(50).lockDelayMs, RIVER_LEVELS.get(50).maxUndos], [1100, 800, 7]);
  assert.equal(RIVER_LEVELS.get(55).board.some((row) => row.includes("H")), false);
  assert.equal(RIVER_LEVELS.get(56).board.some((row) => row.includes("H")), true);
  assert.deepEqual([RIVER_LEVELS.get(60).fallIntervalMs, RIVER_LEVELS.get(60).lockDelayMs, RIVER_LEVELS.get(60).twoStarMinimum], [975, 650, 79]);
  assert.deepEqual([RIVER_LEVELS.get(61).fallIntervalMs, RIVER_LEVELS.get(61).lockDelayMs, RIVER_LEVELS.get(61).maxUndos, RIVER_LEVELS.get(61).twoStarMinimum], [900, 550, 5, 80]);
  assert.deepEqual(validateRiverCatalogue().difficulty, { first: 10, transition: 63, finale: 88 });
});

test("representative challenges across the campaign retain certified reachable one-star solutions", async () => {
  for (const id of [1, 10, 25, 50, 56, 61, 100, 250, 500, 750]) {
    const solved = await new RiverLevelSolver(RIVER_LEVELS.get(id)).solveAsync({ beamWidth: 250, stopAtOneStar: true, sliceMs: 8 });
    assert.ok(solved.achievements.one, `Level ${id} lost its certified one-star route.`);
    assert.ok(solved.achievements.one.percent >= RIVER_LEVELS.get(id).oneStarMinimum);
  }
});

test("L and J pieces keep stable clockwise rotations and heavy rows weaken before clearing", () => {
  const base = RIVER_LEVELS.get(61);
  for (const type of ["L", "J"]) {
    const level = { ...base, board: Array(16).fill(".........."), queue: [type] };
    const engine = new RiverClearoutEngine(level, RIVER_LEVELS.shapes, RIVER_LEVELS.icons);
    const start = JSON.stringify(engine.current.shape);
    const position = [engine.current.x, engine.current.y];
    for (let turn = 0; turn < 4; turn += 1) assert.equal(engine.rotate().rotated, true);
    assert.equal(JSON.stringify(engine.current.shape), start);
    assert.deepEqual([engine.current.x, engine.current.y], position);
  }
  const engine = new RiverClearoutEngine({ ...base, board: Array(16).fill(".........."), queue: ["O"] }, RIVER_LEVELS.shapes, RIVER_LEVELS.icons);
  engine.board[15] = Array.from({ length: 10 }, (_, index) => index === 0 ? { original: true, heavy: true, hp: 2 } : { original: false });
  assert.equal(engine.clearLines(), 1);
  assert.equal(engine.board[15][0].hp, 1);
  assert.equal(engine.board[15][0].heavy, false);
  engine.board[15] = engine.board[15].map((cell) => cell || { original: false });
  assert.equal(engine.clearLines(), 1);
  assert.ok(engine.board[15].every((cell) => cell === null));
});

test("fresh Milestone 15 state is valid and every river level is selectable", () => {
  const state = createFreshGameState({ now: 0 });
  assert.equal(state.schemaVersion, 23);
  assert.equal(state.river.nextLevel, 1);
  assert.equal(state.river.completed, 0);
  assert.equal(validateGameState(state).ok, true);
  const { river } = runtime({ state });
  assert.equal(river.startLevel(750, { autoFall: false }).session.level.id, 750);
});

test("a certified first clear saves stars, restoration points, next level and the exact town reward", async () => {
  const { gameState, river, repository } = runtime();
  const result = await completeLevelOne(river);
  assert.equal(result.ok, true);
  assert.equal(result.result.won, true);
  assert.equal(result.result.stars, 3);
  assert.equal(result.result.percent, 100);
  assert.equal(result.result.firstClear, true);
  assert.equal(result.result.coins, calculateCleanupReward(100, 1));
  const state = gameState.getSnapshot();
  assert.equal(state.economy.coins, 200);
  assert.deepEqual(state.river.best[1], { stars: 3, bestPercent: 100, bestPieces: 5 });
  assert.equal(state.river.completed, 1);
  assert.equal(state.river.nextLevel, 2);
  assert.equal(state.river.totalStars, 3);
  assert.equal(state.river.restorationPoints, 400);
  assert.equal(state.economy.ledger.at(-1).kind, "river-clearout-first-clear");
  assert.equal(repository.load().state.river.completed, 1);
});

test("replaying a cleared river level never pays its first-clear reward twice", async () => {
  const { gameState, river } = runtime();
  await completeLevelOne(river);
  const replay = await completeLevelOne(river);
  assert.equal(replay.result.firstClear, false);
  assert.equal(replay.result.coins, 0);
  assert.equal(gameState.getSnapshot().economy.coins, 200);
  assert.equal(gameState.getSnapshot().river.completed, 1);
  assert.equal(gameState.getSnapshot().river.attempts, 2);
});

test("a failed river attempt changes no durable campaign progress", () => {
  const { gameState, river } = runtime();
  river.startLevel(1, { autoFall: false });
  const before = gameState.getSnapshot();
  const result = river.finishSession("blocked");
  assert.equal(result.result.won, false);
  assert.deepEqual(gameState.getSnapshot(), before);
  assert.equal(gameState.getSnapshot().economy.coins, 100);
});

test("safe cancellation abandons only the transient falling-piece board", () => {
  const { gameState, river } = runtime();
  river.startLevel(56, { autoFall: false, returnPosition: { x: 2365, y: 1240 }, returnFacing: "left" });
  river.moveHorizontal(-1);
  river.rotate();
  const before = gameState.getSnapshot();
  const cancelled = river.cancel();
  assert.equal(cancelled.ok, true);
  assert.deepEqual(cancelled.session.returnPosition, { x: 2365, y: 1240 });
  assert.equal(river.getActiveSession(), null);
  assert.deepEqual(gameState.getSnapshot(), before);
});

test("a save failure rolls back coins and progress and leaves the final placement retryable", async () => {
  let shouldFail = true;
  const repository = { save: () => shouldFail ? { ok: false, status: "write-failed" } : { ok: true, status: "saved" } };
  const { gameState, river } = runtime({ repository });
  river.startLevel(1, { autoFall: false });
  const certified = await river.certifiedPath({ threeStars: true, beamWidth: 250 });
  const failed = river.playPath(certified.path);
  assert.equal(failed.code, "persistence-failed");
  assert.equal(gameState.getSnapshot().economy.coins, 100);
  assert.equal(gameState.getSnapshot().river.completed, 0);
  assert.equal(river.getActiveSession().finished, false);
  shouldFail = false;
  const retry = river.hardDrop();
  assert.equal(retry.ok, true);
  assert.equal(retry.result.firstClear, true);
  assert.equal(gameState.getSnapshot().economy.coins, 200);
});

test("legacy river progress projects without relocking the 750-level campaign", () => {
  const projected = projectLegacyRiver({ miniGames: { progress: { river: { nextLevel: 43, completed: 2, best: { 1: { stars: 3, percent: 100, pieces: 5 }, 42: { stars: 2, percent: 84 } } } } } });
  assert.equal(projected.nextLevel, 43);
  assert.equal(projected.completed, 2);
  assert.deepEqual(projected.best[1], { stars: 3, bestPercent: 100, bestPieces: 5 });
  assert.equal(projected.totalStars, 5);
  assert.equal(projected.restorationPoints, 684);
});

test("schema 11 saves gain river progress while preserving the café milestone", () => {
  const old = createFreshGameState({ now: 0 });
  delete old.river;
  old.schemaVersion = 11;
  old.cafe.completed[1] = true;
  old.cafe.best[1] = { score: 95, stars: 3, served: 3, accuracy: 100 };
  old.cafe.totalStars = 3;
  const upgraded = upgradeGameState(old, { now: 0 });
  assert.equal(upgraded.schemaVersion, 23);
  assert.equal(upgraded.river.nextLevel, 1);
  assert.equal(upgraded.cafe.completed[1], true);
  assert.equal(validateGameState(upgraded).ok, true);
});
