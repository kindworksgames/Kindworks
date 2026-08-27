import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fitWasteCardLayout } from "../src/ui/WasteCardLayout.js";

const root = new URL("../", import.meta.url);
const readText = async (path) => readFile(new URL(path, root), "utf8");

test("keeps the Waste Collection board, tray, controls, and status inside short landscape screens", async () => {
  const [markup, styles] = await Promise.all([readText("index.html"), readText("src/style.css")]);
  assert.match(markup, /id="waste-campaign-exit"[^>]*>Exit<\/button>/);
  assert.match(markup, /id="waste-hint"[^>]*>💡 Hint<\/button>/);
  assert.match(markup, /id="waste-retry"[^>]*>↻ Restart<\/button>/);
  assert.match(styles, /\.waste-campaign-hud \{[\s\S]*grid-template-rows: auto minmax\(0, 1fr\) auto/);
  assert.match(styles, /\.waste-campaign-gameplay \{[\s\S]*grid-template: auto minmax\(0, 1fr\) \/ minmax\(0, 1fr\) 144px/);
  assert.match(styles, /\.waste-card:not\(\.blocked\) \.waste-card-hit \{[^\n]*width: max\(100%, var\(--kw-touch-min\)\); height: max\(100%, var\(--kw-touch-min\)\)/);
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

test("recenters and scales the remaining authored card bounds without changing their order", async () => {
  const world = { width: 1080, height: 840, cardWidth: 88, cardHeight: 100 };
  const tiles = [
    { id: 4, x: 400, y: 330, removed: false },
    { id: 5, x: 500, y: 430, removed: false },
    { id: 6, x: 0, y: 0, removed: true },
  ];
  const layout = fitWasteCardLayout(tiles, world);
  assert.equal(layout.cards.length, 2);
  assert.deepEqual(layout.cards.map(({ id }) => id), [4, 5]);
  assert.equal(layout.scale, 1.45);
  const minX = Math.min(...layout.cards.map((card) => card.x));
  const maxX = Math.max(...layout.cards.map((card) => card.x + card.width));
  assert.ok(Math.abs((minX + maxX) / 2 - world.width / 2) < 0.001);

  const [scene, styles] = await Promise.all([readText("src/scenes/WasteCollectionScene.js"), readText("src/style.css")]);
  assert.match(scene, /fitWasteCardLayout\(remainingTiles, WASTE_WORLD\)/);
  assert.match(scene, /className = "waste-card-hit"/);
  assert.match(styles, /@media \(pointer: coarse\) \{ \.waste-card:not\(\.blocked\) \.waste-card-hit/);
});
