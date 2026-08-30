import assert from "node:assert/strict";
import test from "node:test";
import { runMinigameParityAudit } from "../scripts/minigame-parity-lib.mjs";

test("protected HTML and Phaser minigame catalogues remain exhaustively aligned", { timeout: 120_000 }, async () => {
  const report = await runMinigameParityAudit();
  assert.equal(report.ok, true, report.failures.map((failure) => `${failure.game}/${failure.subject}`).join(", "));
  assert.ok(report.games.length >= 10);
  assert.ok(report.comparedLevelInstances >= 5_000);
});

