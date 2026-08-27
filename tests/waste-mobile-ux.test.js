import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const readText = async (path) => readFile(new URL(path, root), "utf8");

test("keeps the Waste Collection board, tray, controls, and status inside short landscape screens", async () => {
  const [markup, styles] = await Promise.all([readText("index.html"), readText("src/style.css")]);
  assert.match(markup, /id="waste-campaign-exit"[^>]*>Exit<\/button>/);
  assert.match(markup, /id="waste-hint"[^>]*>💡 Hint<\/button>/);
  assert.match(markup, /id="waste-retry"[^>]*>↻ Restart<\/button>/);
  assert.match(styles, /\.waste-campaign-hud \{[\s\S]*grid-template-rows: auto minmax\(0, 1fr\) auto/);
  assert.match(styles, /\.waste-campaign-gameplay \{[\s\S]*grid-template: auto minmax\(0, 1fr\) \/ minmax\(0, 1fr\) 144px/);
  assert.match(styles, /\.waste-card \{[^\n]*min-width: var\(--kw-touch-min\) !important; min-height: var\(--kw-touch-min\) !important/);
  assert.match(styles, /\.waste-campaign-actions button \{ min-width: var\(--kw-touch-min\); min-height: var\(--kw-touch-min\); \}/);
});

test("uses short contextual Waste copy and reveals only currently useful actions", async () => {
  const [markup, styles, scene] = await Promise.all([readText("index.html"), readText("src/style.css"), readText("src/scenes/WasteCollectionScene.js")]);
  assert.match(markup, /Match rubbish in threes/);
  assert.match(markup, /Pick uncovered cards\. Keep the five-slot tray open\./);
  for (const copy of ["Choose a level.", "Tray full. Try another order.", "Level saved.", "Everything is collected.", "Tap Confirm Exit to leave this attempt."]) assert.ok(scene.includes(copy), copy);
  assert.match(scene, /buttons\.retry\.classList\.toggle\("hidden", this\.session\.moves === 0\)/);
  assert.match(scene, /finish\.classList\.toggle\("hidden", count !== total\)/);
  assert.match(styles, /\.cleanup-item-list button\.collected \{\s*display: none;/);
  assert.match(styles, /\.cleanup-finish\.hidden \{ display: none; \}/);
});
