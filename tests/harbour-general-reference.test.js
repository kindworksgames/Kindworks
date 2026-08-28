import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { HARBOUR_GENERAL_CONFIG, HARBOUR_GENERAL_INTERIOR, HARBOUR_GENERAL_ITEM_IDS } from "../src/data/harbourGeneral.js";

const root = new URL("../", import.meta.url);

test("Harbour General uses the reference-led full shop composition without a pasted bitmap", async () => {
  const [scene, html, css] = await Promise.all([
    readFile(new URL("src/scenes/HarbourGeneralScene.js", root), "utf8"),
    readFile(new URL("index.html", root), "utf8"),
    readFile(new URL("src/style.css", root), "utf8"),
  ]);

  assert.doesNotMatch(scene, /load\.image\([^\n]*harbour|harbour-general\.webp|legacy-harbour-general/);
  for (const required of [
    "harbour-general.floor.mint-checker-and-wood-wall",
    "harbour-general.fixture.harbour-view-window",
    "harbour-general.fixture.stockroom-door",
    "harbour-general.fixture.checkout-register",
    "harbour-general.panel.selected-product",
    "harbour-general.control.restock",
    "harbour-general.control.place-on-shelf",
  ]) assert.match(scene, new RegExp(required.replaceAll(".", "\\.")));

  assert.match(html, /harbour-hud-title/);
  assert.match(html, /id="harbour-balance"/);
  assert.match(html, /id="harbour-today-sales"/);
  assert.match(html, /data-sprite-ai-label="harbour-general\.header\.shop-sign"/);
  assert.match(css, /grid-template-columns:\s*minmax\(0, 1fr\) auto auto auto auto/);
  assert.match(css, /body\[data-game-scene="HarbourGeneralScene"\]/);
});

test("Harbour General keeps six physical displays, all products, and reference proportions", () => {
  assert.equal(HARBOUR_GENERAL_ITEM_IDS.length, 17);
  assert.equal(HARBOUR_GENERAL_INTERIOR.slots.length, HARBOUR_GENERAL_CONFIG.slotCount);
  assert.equal(HARBOUR_GENERAL_CONFIG.slotCount, 6);
  assert.equal(HARBOUR_GENERAL_INTERIOR.room.width, 928);
  assert.ok(HARBOUR_GENERAL_INTERIOR.room.width / 1280 > 0.7);
  assert.ok(HARBOUR_GENERAL_INTERIOR.counter.x + HARBOUR_GENERAL_INTERIOR.counter.width < HARBOUR_GENERAL_INTERIOR.room.x + HARBOUR_GENERAL_INTERIOR.room.width);
  assert.deepEqual(HARBOUR_GENERAL_INTERIOR.slots.map(({ slot }) => slot), [0, 1, 2, 3, 4, 5]);
  assert.ok(HARBOUR_GENERAL_INTERIOR.slots.every(({ x, width }) => x >= HARBOUR_GENERAL_INTERIOR.room.x && x + width <= HARBOUR_GENERAL_INTERIOR.room.x + HARBOUR_GENERAL_INTERIOR.room.width));
});
