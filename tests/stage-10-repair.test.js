import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  auditProductionSurface,
  FORBIDDEN_PRODUCTION_SURFACE_MARKERS,
} from "../scripts/verify-production-surface.mjs";

const root = resolve(import.meta.dirname, "..");

test("production-surface audit rejects development globals and internal counters", () => {
  const result = auditProductionSurface([
    { name: "entry.js", content: "window.__KINDWORKS_PHASER__={};const saveSchema=2" },
  ]);

  assert.equal(result.ok, false);
  assert.deepEqual(result.findings, [
    { file: "entry.js", marker: "__KINDWORKS_PHASER__" },
    { file: "entry.js", marker: "saveSchema" },
  ]);
});

test("production-surface audit accepts player-facing production code", () => {
  const result = auditProductionSurface([
    { name: "entry.js", content: "startKindWorks({orientation:'landscape'})" },
  ]);

  assert.deepEqual(result, { ok: true, findings: [] });
});

test("development diagnostics are guarded at the application boundary", () => {
  const main = readFileSync(resolve(root, "src/main.js"), "utf8");
  assert.match(main, /if \(import\.meta\.env\.DEV\) installSpriteAiDomLabels\(document, window\);/);
  assert.match(main, /if \(import\.meta\.env\.DEV\) window\.__KINDWORKS_PHASER_GAME__ = game;/);
  assert.match(main, /if \(import\.meta\.env\.DEV\) window\.__KINDWORKS_PHASER__ = \{/);
  assert.equal(FORBIDDEN_PRODUCTION_SURFACE_MARKERS.length >= 10, true);
});
