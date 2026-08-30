import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { installTestMetricsBridge } from "../src/qa/TestMetricsBridge.js";

test("test metrics bridge is read-only, narrow, and removed on game destroy", () => {
  let destroy;
  const target = {};
  const game = {
    loop: { actualFps: 59.5 }, textures: { list: { a: {}, b: {} } },
    scene: { getScenes: () => [{ scene: { key: "TownScene" }, children: { list: [1, 2] }, time: { getAllEvents: () => [1] } }] },
    events: { once(name, callback) { if (name === "destroy") destroy = callback; } },
  };
  installTestMetricsBridge(game, target);
  assert.deepEqual(target.__KINDWORKS_TEST_METRICS__.snapshot(), { fps: 59.5, textures: 2, scenes: [{ key: "TownScene", children: 2, timers: 1, approvedVisuals: 0 }] });
  assert.equal("game" in target.__KINDWORKS_TEST_METRICS__, false);
  destroy();
  assert.equal(target.__KINDWORKS_TEST_METRICS__, undefined);
});

test("normal production exposure is guarded by a compile-time opt-in", async () => {
  const source = await readFile(new URL("../src/main.js", import.meta.url), "utf8");
  assert.match(source, /VITE_KW_TEST_METRICS === "1"/);
  assert.doesNotMatch(source, /__KINDWORKS_TEST_METRICS__/);
});
