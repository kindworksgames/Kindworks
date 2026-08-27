import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const readText = async (path) => readFile(new URL(path, root), "utf8");

test("keeps Beach Cleanup play, walking controls, and feedback inside every landscape shell", async () => {
  const [markup, styles] = await Promise.all([readText("index.html"), readText("src/style.css")]);
  assert.match(markup, /class="beach-controls"[^>]*>[\s\S]*id="beach-up"[\s\S]*id="beach-undo" class="hidden"[\s\S]*id="beach-right"/);
  assert.match(markup, /class="beach-secondary-actions"[\s\S]*<details class="beach-challenges">/);
  assert.match(styles, /\.beach-cleanup-hud \{[^\n]*grid-template-rows: auto minmax\(0, 1fr\) auto/);
  assert.match(styles, /\.beach-play-area \{ grid-template-columns: minmax\(0, 1fr\) 148px/);
  assert.match(styles, /\.beach-controls \{ display: grid; grid-template-columns: repeat\(3/);
  assert.match(styles, /\.beach-cleanup-hud button, \.beach-cleanup-hud select, \.beach-challenges summary \{ min-height: var\(--kw-touch-min\)/);
  assert.match(styles, /\.beach-challenges\[open\] > div \{ display: grid; \}/);
});

test("uses short contextual Beach Cleanup actions while preserving optional challenges", async () => {
  const [markup, scene] = await Promise.all([readText("index.html"), readText("src/scenes/BeachCleanupScene.js")]);
  for (const challenge of ["noUndo", "underMoves", "cleanSweep"]) assert.match(markup, new RegExp(`data-beach-challenge="${challenge}"`));
  assert.match(markup, /id="beach-retry" class="hidden"[^>]*>Restart<\/button>/);
  assert.match(markup, /id="beach-hint"[^>]*>Hint<\/button>/);
  for (const copy of ["Rake the beach and find every item.", "Rake every tile. Find every item.", "Item found!", "Step undone.", "Beach restarted.", "Beach saved.", "Tap Confirm Exit to leave this attempt."]) assert.ok(scene.includes(copy), copy);
  assert.match(scene, /buttons\.undo\.classList\.toggle\("hidden", !session\.undoStack\.length\)/);
  assert.match(scene, /buttons\.retry\.classList\.toggle\("hidden", state\.moves === 0\)/);
});
