import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fitWasteCardLayout, scatterWasteCardLayout } from "../src/ui/WasteCardLayout.js";

const root = new URL("../", import.meta.url);
const readText = async (path) => readFile(new URL(path, root), "utf8");

test("uses the reference-led full-park Waste Collection composition on short landscape screens", async () => {
  const [markup, styles] = await Promise.all([readText("index.html"), readText("src/style.css")]);
  assert.match(markup, /id="waste-campaign-exit"[^>]*>Exit<\/button>/);
  assert.match(markup, /id="waste-hint"[^>]*>💡 Hint<\/button>/);
  assert.match(markup, /id="waste-retry"[^>]*>↻ Restart<\/button>/);
  assert.match(markup, /<details class="waste-campaign-menu">/);
  assert.match(markup, /id="waste-campaign-level">Level 1 \/ 750/);
  assert.doesNotMatch(markup, /class="waste-campaign-actions"/);
  assert.match(styles, /Waste Collection reference-led park composition/);
  assert.match(styles, /grid-template: minmax\(0, 1fr\) clamp\(40px, 10vh, 78px\) \/ minmax\(0, 1fr\)/);
  assert.match(styles, /\.waste-card small \{ display: none !important; \}/);
  assert.match(styles, /\.waste-campaign-menu:not\(\[open\]\) > div \{ display: none !important; \}/);
  assert.match(styles, /\.waste-card:not\(\.blocked\) \.waste-card-hit \{[^\n]*width: max\(100%, var\(--kw-touch-min\)\); height: max\(100%, var\(--kw-touch-min\)\)/);
});

test("uses short contextual Waste copy and reveals only currently useful actions", async () => {
  const [markup, styles, scene] = await Promise.all([readText("index.html"), readText("src/style.css"), readText("src/scenes/WasteCollectionScene.js")]);
  assert.match(markup, /Match cards in threes/);
  assert.doesNotMatch(markup, /id="waste-campaign-picker"|id="waste-level-select"|id="waste-level-start"/);
  assert.doesNotMatch(markup, /id="waste-result-percent"|id="waste-result-moves"|id="waste-result-matches"|id="waste-replay"|id="waste-next"/);
  assert.match(scene, /const level = this\.entryData\.level \|\| this\.cleanup\.getCampaignSnapshot\(\)\.nextLevel;[\s\S]*this\.startCampaignLevel\(level\)/);
  for (const copy of ["Tray full. Try another order.", "Level saved.", "Everything is collected.", "Tap Confirm Exit to leave this attempt."]) assert.ok(scene.includes(copy), copy);
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
  assert.match(scene, /className = "waste-card-hit"/);
  assert.match(styles, /@media \(pointer: coarse\) \{ \.waste-card:not\(\.blocked\) \.waste-card-hit/);
});

test("scatters visual cards across the park while keeping ids, order, and engine coordinates untouched", async () => {
  const world = { width: 1080, height: 840, cardWidth: 88, cardHeight: 100 };
  const tiles = Array.from({ length: 24 }, (_, id) => ({ id, typeId: id % 8, layer: id % 3, x: 400 + (id % 4) * 10, y: 330 + (id % 5) * 10, removed: false }));
  const layout = scatterWasteCardLayout(tiles, world);
  assert.deepEqual(layout.cards.map(({ id }) => id), tiles.map(({ id }) => id));
  assert.equal(new Set(layout.cards.map(({ x, y }) => `${x.toFixed(3)}:${y.toFixed(3)}`)).size, tiles.length);
  assert.ok(Math.max(...layout.cards.map((card) => card.x + card.width)) - Math.min(...layout.cards.map((card) => card.x)) > world.width * 0.75);
  assert.ok(Math.max(...layout.cards.map((card) => card.y + card.height)) - Math.min(...layout.cards.map((card) => card.y)) > world.height * 0.7);
  assert.deepEqual(tiles[0], { id: 0, typeId: 0, layer: 0, x: 400, y: 330, removed: false });

  const scene = await readText("src/scenes/WasteCollectionScene.js");
  assert.match(scene, /scatterWasteCardLayout\(remainingTiles, WASTE_WORLD\)/);
  assert.match(scene, /dataset\.assetLabel = `KW-WASTE-CARD-/);
  assert.match(scene, /\(isExposed \? 10000 : 10\) \+ tile\.layer \* 150 \+ tile\.id/);
  assert.doesNotMatch(scene, /document\.createElement\("small"\)/);
  assert.match(scene, /for \(let index = 0; index < 5; index \+= 1\)/);
});
