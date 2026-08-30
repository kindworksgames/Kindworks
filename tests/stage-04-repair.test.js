import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const readText = async (path) => readFile(new URL(path, root), "utf8");

test("Little Bakery keeps its launch label and selected level in sync without leaking listeners", async () => {
  const scene = await readText("src/scenes/BakeryScene.js");

  assert.match(scene, /this\.onStart = \(\) => this\.startLevel\(Number\(this\.levelSelect\?\.value \|\| 1\)\)/);
  assert.match(scene, /this\.onLevelChange = \(\) => \{ if \(this\.startButton\) this\.startButton\.textContent = `Open for Level \$\{Number\(this\.levelSelect\?\.value \|\| 1\)\}`; \}/);
  assert.match(scene, /this\.levelSelect\?\.addEventListener\("change", this\.onLevelChange\)/);
  assert.match(scene, /this\.levelSelect\?\.removeEventListener\("change", this\.onLevelChange\)/);
});
