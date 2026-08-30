import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { HARBOUR_GENERAL_CATALOG } from "../src/data/harbourGeneral.js";
import { PAWS_WONDERS_CATALOG } from "../src/data/pawsWonders.js";

const root = new URL("../", import.meta.url);

test("Stage 7 narrow DOM shops preserve 44px product targets", async () => {
  const css = await readFile(new URL("src/shop-reference.css", root), "utf8");
  assert.match(css, /@media \(max-width: 900px\) and \(max-height: 500px\) and \(orientation: landscape\)/);
  assert.match(css, /fresh-market-stock[\s\S]*grid-template-columns: repeat\(3, minmax\(44px, 1fr\)\)/);
  assert.match(css, /fresh-market-product[\s\S]*min-width: 44px;[\s\S]*min-height: 44px/);
  assert.match(css, /town-grocer[\s\S]*grid-template-rows: repeat\(3, minmax\(44px, 1fr\)\)/);
  assert.match(css, /grocer-shop-product[\s\S]*min-width: 44px;[\s\S]*min-height: 44px/);
  assert.match(css, /grocer-shop-room-details \{ display: none; \}/);
});

test("Stage 7 fixed-canvas shops expose narrow-landscape controls outside the scaled canvas", async () => {
  const [html, css, paws, harbour] = await Promise.all([
    readFile(new URL("index.html", root), "utf8"),
    readFile(new URL("src/style.css", root), "utf8"),
    readFile(new URL("src/scenes/PawsWondersScene.js", root), "utf8"),
    readFile(new URL("src/scenes/HarbourGeneralScene.js", root), "utf8"),
  ]);
  for (const id of [
    "paws-mobile-previous", "paws-mobile-next", "paws-mobile-adopt",
    "harbour-mobile-previous", "harbour-mobile-next", "harbour-mobile-slot",
    "harbour-mobile-restock", "harbour-mobile-place", "harbour-mobile-clear", "harbour-mobile-collect",
  ]) assert.match(html, new RegExp(`id="${id}"`));
  assert.match(css, /body\[data-game-scene="PawsWondersScene"\] \.paws-mobile-panel/);
  assert.match(css, /body\[data-game-scene="HarbourGeneralScene"\] \.harbour-mobile-panel/);
  assert.match(css, /min-width: 44px;[\s\S]*min-height: 44px/);
  assert.match(paws, /cycleCompanion\(direction\)/);
  assert.match(paws, /275, 56, 0x3d7a50/);
  assert.match(paws, /mobileAdopt\.disabled = !product\.canAdopt/);
  assert.match(harbour, /this\.mobileSlotSelect\?\.addEventListener\("change"/);
  assert.match(harbour, /this\.mobileRestockButton\.disabled = !\(assigned && quantity > 0 && catalogue\.balance >= caseCost\)/);
  assert.match(harbour, /987, 192, 56, "‹"[\s\S]*0x245f91, 56/);

  for (const [width, height] of [[1024, 768], [1280, 720]]) {
    const fitScale = Math.min(width / 1280, height / 720);
    assert.ok(56 * fitScale >= 44, `${width}x${height} canvas controls must remain at least 44 CSS pixels`);
  }
});

test("Stage 7 responsive repair does not alter protected adoption or wholesale values", () => {
  assert.equal(PAWS_WONDERS_CATALOG["pet-labrador"].price, 420);
  assert.equal(HARBOUR_GENERAL_CATALOG.umbrella.wholesale, 120);
  assert.equal(HARBOUR_GENERAL_CATALOG.umbrella.price, 190);
});
