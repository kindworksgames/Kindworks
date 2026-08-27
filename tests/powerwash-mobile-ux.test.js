import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const readText = async (path) => readFile(new URL(path, root), "utf8");

test("keeps the entire Power Washing board, wand, tools, and status inside short landscape screens", async () => {
  const [markup, styles] = await Promise.all([readText("index.html"), readText("src/style.css")]);
  assert.match(markup, /id="powerwash-board" class="powerwash-board"[^>]*width="960" height="480"/);
  assert.match(markup, /class="powerwash-wand" data-sprite-ai-label="Power Wash — washer wand"/);
  assert.match(styles, /\.powerwash-board-frame \{[^\n]*aspect-ratio: 2 \/ 1/);
  assert.match(styles, /\.powerwash-board \{ position: absolute; inset: 0; display: block; width: 100%; height: 100%/);
  assert.match(styles, /\.powerwash-hud \{[^\n]*grid-template-rows: auto minmax\(0, 1fr\) auto/);
  assert.match(styles, /\.powerwash-play-area \{ grid-template-columns: minmax\(0, 1fr\) 148px/);
  assert.match(styles, /\.powerwash-side article:nth-child\(2\) \{[^\n]*grid-template-columns: repeat\(2/);
});

test("keeps all four protected Power Washing modes with short contextual controls and copy", async () => {
  const [markup, styles, scene] = await Promise.all([readText("index.html"), readText("src/style.css"), readText("src/scenes/PlaygroundPowerwashScene.js")]);
  for (const control of ["Soap", "Precision", "Standard", "Wide"]) assert.match(markup, new RegExp(`>${control}<\\/button>`), control);
  assert.match(markup, /id="powerwash-retry" class="hidden"[^>]*>↻ Restart<\/button>/);
  assert.match(styles, /\.powerwash-side article button \{ min-height: var\(--kw-touch-min\); \}/);
  for (const copy of ["Wash at least 97% clean.", "Drag to wash. Soap dark stains first.", "Playground restarted.", "Playground saved.", "Tap Confirm Exit to leave this attempt."]) assert.ok(scene.includes(copy), copy);
  assert.match(scene, /buttons\.retry\.classList\.toggle\("hidden", state\.strokes === 0\)/);
});
