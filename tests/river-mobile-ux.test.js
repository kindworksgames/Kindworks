import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const readText = async (path) => readFile(new URL(path, root), "utf8");

test("makes River Clear-Out a portrait-only activity with a board-first shell", async () => {
  const [shell, styles] = await Promise.all([readText("src/ui/ResponsiveShellController.js"), readText("src/style.css")]);
  assert.match(shell, /PORTRAIT_ONLY_SCENES = new Set\(\["RiverClearoutScene"\]\)/);
  assert.match(shell, /Turn your device upright to play\./);
  assert.match(styles, /@media \(max-width: 900px\) and \(orientation: portrait\)/);
  assert.match(styles, /\.river-play-area \{ grid-template: minmax\(0, 1fr\) auto \/ minmax\(0, 1fr\)/);
  assert.match(styles, /\.river-board \{ width: auto; height: 100%; max-width: 100%; max-height: 100%; justify-self: center; \}/);
  assert.match(styles, /\.river-picker,\s*\.river-gameplay,\s*\.river-result \{ grid-row: 2; \}/);
  assert.match(styles, /\.river-status \{ grid-row: 3; \}/);
});

test("keeps portrait River controls finger-sized and its repeated feedback short", async () => {
  const [markup, styles, scene] = await Promise.all([readText("index.html"), readText("src/style.css"), readText("src/scenes/RiverClearoutScene.js")]);
  assert.match(markup, /id="river-exit"[^>]*>Exit<\/button>/);
  assert.match(markup, /id="river-undo"[^>]*aria-label="Undo last river move"[^>]*>↶<\/button>/);
  assert.match(markup, /id="river-result-undo"[^>]*>↶ Undo last<\/button>/);
  assert.match(markup, /Restore 750 river stretches/);
  assert.match(markup, /Place recovery shapes to clear rubbish\. First clears earn coins\./);
  assert.match(styles, /\.river-controls button \{ min-height: var\(--kw-touch-min\)/);
  assert.match(styles, /\.river-hud-header button \{ min-width: var\(--kw-touch-min\); min-height: var\(--kw-touch-min\)/);
  assert.match(styles, /@media \(max-width: 360px\) and \(orientation: portrait\)/);
  assert.match(styles, /\.river-side-panel \{ grid-template-columns: 44px 68px 92px 78px; \}/);
  assert.match(scene, /textContent = "Confirm Exit"/);
  for (const copy of ["Choose a river level.", "Clear rows. Recover at least 50%.", "River saved.", "Try another placement."]) assert.ok(scene.includes(copy), copy);
  assert.match(scene, /Hint 1 · Try the/);
  assert.match(scene, /Hint 2 · Aim for column/);
  assert.match(scene, /Hint 3 · Column/);
});
