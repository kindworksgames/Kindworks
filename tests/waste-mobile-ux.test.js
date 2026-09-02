import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  WASTE_TOTAL_LEVELS,
  WASTE_WORLD,
  decodeWasteLevel,
  wasteTileExposed,
} from "../src/data/wasteCollection.js";
import {
  computeWasteBoardBounds,
  fitWasteBoardToViewport,
  fitWasteCardLayout,
  wasteRenderedCardExposed,
} from "../src/ui/WasteCardLayout.js";
import { WASTE_PARK_BACKDROP_VERSION, wasteParkBackdropDataUrl } from "../src/ui/WasteParkBackdrop.js";

const root = new URL("../", import.meta.url);
const readText = async (path) => readFile(new URL(path, root), "utf8");

test("uses the HTML-authored full-park Waste Collection composition on short landscape screens", async () => {
  const [markup, styles] = await Promise.all([readText("index.html"), readText("src/style.css")]);
  assert.match(markup, /id="waste-campaign-exit"[^>]*>Exit<\/button>/);
  assert.match(markup, /id="waste-hint"[^>]*>💡 Hint<\/button>/);
  assert.match(markup, /id="waste-retry"[^>]*>↻ Restart<\/button>/);
  assert.match(markup, /id="waste-board-stage" class="waste-board-stage"/);
  assert.match(markup, /<details class="waste-campaign-menu">/);
  assert.match(styles, /HTML-authored Waste Collection board/);
  assert.match(styles, /background: var\(--waste-park-art\) 0 0 \/ 1080px 840px no-repeat/);
  assert.match(styles, /grid-template-columns: repeat\(7, minmax\(0, 1fr\)\)/);
  assert.match(styles, /\.waste-card\.blocked \{ opacity: \.88 !important; filter: brightness\(\.61\) saturate\(\.7\) !important; \}/);
});

test("uses short contextual Waste copy and reveals only currently useful actions", async () => {
  const [markup, styles, scene] = await Promise.all([readText("index.html"), readText("src/style.css"), readText("src/scenes/WasteCollectionScene.js")]);
  assert.match(markup, /Match cards in threes/);
  assert.doesNotMatch(markup, /id="waste-campaign-picker"|id="waste-level-select"|id="waste-level-start"/);
  assert.doesNotMatch(markup, /id="waste-result-percent"|id="waste-result-moves"|id="waste-result-matches"|id="waste-replay"|id="waste-next"/);
  assert.match(scene, /const level = this\.entryData\.level \|\| this\.cleanup\.getCampaignSnapshot\(\)\.nextLevel;/);
  for (const copy of ["Tray full. Try another order.", "Level saved.", "Everything is collected.", "Tap Confirm Exit to leave this attempt."]) assert.ok(scene.includes(copy), copy);
  assert.match(scene, /buttons\.retry\.classList\.toggle\("hidden", this\.session\.moves === 0\)/);
  assert.match(styles, /\.cleanup-item-list button\.collected \{\s*display: none;/);
});

test("preserves HTML-authored position, rotation, layer, and crop translation", () => {
  const tiles = [
    { id: 4, x: 400, y: 330, layer: 1, rotation: -4, removed: false },
    { id: 5, x: 500, y: 430, layer: 3, rotation: 7, removed: false },
    { id: 6, x: 0, y: 0, layer: 0, rotation: 0, removed: true },
  ];
  const bounds = computeWasteBoardBounds(tiles, WASTE_WORLD);
  assert.deepEqual(bounds, { left: 376, top: 306, width: 236, height: 248 });
  const layout = fitWasteCardLayout(tiles, WASTE_WORLD);
  assert.deepEqual(layout.cards, [
    { id: 4, x: 24, y: 24, width: 88, height: 100, layer: 1, rotation: -4 },
    { id: 5, x: 124, y: 124, width: 88, height: 100, layer: 3, rotation: 7 },
  ]);
  assert.equal(layout.scale, 1);
});

test("fits the complete authored board crop without stretching or redistributing cards", () => {
  const bounds = { left: 100, top: 80, width: 800, height: 600 };
  assert.deepEqual(fitWasteBoardToViewport(bounds, 1280, 720), { scale: 0.9, width: 720, height: 540 });
  assert.deepEqual(fitWasteBoardToViewport(bounds, 568, 252), { scale: 0.42, width: 336, height: 252 });
});

test("visible overlap and engine overlap agree for every card across all 750 authored levels", () => {
  let checkedCards = 0;
  for (let level = 1; level <= WASTE_TOTAL_LEVELS; level += 1) {
    const tiles = decodeWasteLevel(level);
    const layout = fitWasteCardLayout(tiles, WASTE_WORLD);
    const renderedById = new Map(layout.cards.map((card) => [card.id, card]));
    assert.equal(layout.cards.length, tiles.length, `Level ${level} card count`);
    for (const tile of tiles) {
      const rendered = renderedById.get(tile.id);
      assert.ok(rendered, `Level ${level} card ${tile.id} rendered`);
      assert.equal(rendered.x + layout.bounds.left, tile.x, `Level ${level} card ${tile.id} x`);
      assert.equal(rendered.y + layout.bounds.top, tile.y, `Level ${level} card ${tile.id} y`);
      assert.equal(rendered.rotation, tile.rotation, `Level ${level} card ${tile.id} rotation`);
      assert.equal(rendered.layer, tile.layer, `Level ${level} card ${tile.id} layer`);
      assert.equal(wasteRenderedCardExposed(layout.cards, rendered), wasteTileExposed(tiles, tile), `Level ${level} card ${tile.id} exposure parity`);
      checkedCards += 1;
    }
  }
  assert.equal(checkedCards, 74151);
});

test("scene uses authored fitting, park composition, rotation, dynamic capacity, and interaction motion", async () => {
  const scene = await readText("src/scenes/WasteCollectionScene.js");
  assert.match(scene, /fitWasteCardLayout\(remainingTiles, WASTE_WORLD\)/);
  assert.doesNotMatch(scene, /scatterWasteCardLayout/);
  assert.match(scene, /dataset\.authoredX = String\(tile\.x\)/);
  assert.match(scene, /style\.backgroundPosition = "0px 0px"/);
  assert.match(scene, /style\.setProperty\("--card-rotation", `\$\{tile\.rotation\}deg`\)/);
  assert.match(scene, /for \(let index = 0; index < WASTE_SLOT_CONFIG\.max; index \+= 1\)/);
  assert.match(scene, /animateCardToTray/);
  assert.match(scene, /animateTrayMatch/);
  assert.match(scene, /--grime-opacity/);
  assert.match(scene, /--clean-overlay-opacity/);
  assert.match(scene, /duration: reduced \? 1 : 190/);
  assert.match(scene, /duration: reduced \? 1 : 210/);
  assert.match(scene, /this\.campaignHud\.scrollTop = 0/);
});

test("park backdrop is deterministic, code-native, and matches the original logical board", () => {
  assert.equal(WASTE_PARK_BACKDROP_VERSION, "72.0.1-html-authored-park");
  const first = wasteParkBackdropDataUrl();
  assert.equal(first, wasteParkBackdropDataUrl());
  assert.match(decodeURIComponent(first), /viewBox="0 0 1080 840"/);
  assert.match(decodeURIComponent(first), /shape-rendering="crispEdges"/);
});
