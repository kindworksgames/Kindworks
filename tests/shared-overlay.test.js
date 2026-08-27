import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { SHARED_UI_COPY } from "../src/ui/SharedOverlayController.js";

const root = new URL("../", import.meta.url);
const readText = async (path) => readFile(new URL(path, root), "utf8");

test("keeps shared loading and recovery copy short and action-oriented", () => {
  assert.equal(SHARED_UI_COPY.loading, "Loading…");
  assert.equal(SHARED_UI_COPY.loadError, "That area couldn’t open. Try again.");
  assert.ok(SHARED_UI_COPY.loadError.split(/\s+/).length < 8);
});

test("wires shared loading, error recovery, safe areas and reduced motion", async () => {
  const [main, lazyScenes, styles, labels] = await Promise.all([
    readText("src/main.js"),
    readText("src/scenes/lazyScenes.js"),
    readText("src/style.css"),
    readText("src/assets/spriteAiLabels.js"),
  ]);
  assert.match(main, /new SharedOverlayController\(\)\.start\(\)/);
  assert.match(lazyScenes, /sharedOverlay\?\.showLoading/);
  assert.match(lazyScenes, /sharedOverlay\?\.showLoadError/);
  assert.match(lazyScenes, /sharedOverlay\?\.hideLoading/);
  assert.match(styles, /\.kw-loading-state/);
  assert.match(styles, /\.kw-global-toast/);
  assert.match(styles, /env\(safe-area-inset-bottom\)/);
  assert.match(styles, /prefers-reduced-motion: reduce/);
  assert.ok(labels.includes("[class*='toast']"), "dynamic shared notifications remain in the Sprite AI inventory");
});
