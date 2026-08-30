import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { isWithinCameraMargin } from "../src/visual/renderers/VisualViewportCulling.js";
import { renderFrameTarget } from "../src/visual/ResponsiveFramePolicy.js";

test("off-camera NPC presentation work is culled with a stable safety margin", () => {
  const view = { x: 100, y: 100, right: 500, bottom: 400 };
  assert.equal(isWithinCameraMargin({ x: 120, y: 120 }, view), true);
  assert.equal(isWithinCameraMargin({ x: -79, y: 120 }, view), true);
  assert.equal(isWithinCameraMargin({ x: -81, y: 120 }, view), false);
  assert.equal(isWithinCameraMargin({ x: 120, y: 581 }, view), false);
});

test("Town batches simulation without changing accumulated elapsed time", async () => {
  const source = await readFile(new URL("../src/scenes/TownScene.js", import.meta.url), "utf8");
  assert.match(source, /this\.npcSimulationElapsed \+= delta/);
  assert.match(source, /const simulationDelta = this\.npcSimulationElapsed/);
  assert.match(source, /this\.npcTownLife\?\.update\(simulationDelta/);
  assert.doesNotMatch(source, /this\.npcTownLife\?\.update\(delta,/);
});

test("dense touch displays use a stable render cadence without changing desktop timing", () => {
  assert.equal(renderFrameTarget({ touchPoints: 5, devicePixelRatio: 2 }), 30);
  assert.equal(renderFrameTarget({ touchPoints: 1, devicePixelRatio: 1 }), 60);
  assert.equal(renderFrameTarget({ touchPoints: 0, devicePixelRatio: 2 }), 60);
});

test("dense-touch Town caches only non-interactive background presentation", async () => {
  const source = await readFile(new URL("../src/scenes/TownScene.js", import.meta.url), "utf8");
  assert.match(source, /cacheStaticTownBackdrop\(\)/);
  assert.match(source, /object\.depth <= 30/);
  assert.match(source, /object\.type !== "Zone"/);
  assert.match(source, /!object\.input\?\.enabled/);
  assert.match(source, /HOUSES\.forEach/);
  assert.ok(source.indexOf("this.cacheStaticTownBackdrop();") < source.indexOf("HOUSES.forEach"));
});
