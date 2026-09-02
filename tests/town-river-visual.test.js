import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { BRIDGES, RIVER_PATH, RIVER_VISUAL_PATH, TOWN_REFERENCE_LAYOUT } from "../src/data/town.js";
import { KINDWORKS_VISUAL_MANIFEST, VISUAL_ASSET_IDS } from "../src/visual/visualManifest.js";

test("the approved river water is a semantic TownScene dependency", () => {
  const asset = KINDWORKS_VISUAL_MANIFEST.assets.find(({ id }) => id === VISUAL_ASSET_IDS.TOWN_RIVER_WATER_TILE);
  const pack = KINDWORKS_VISUAL_MANIFEST.scenePacks.find(({ id }) => id === "pack.scene.town.river");
  assert.equal(asset.source.file, "/assets/runtime/phase-8a/town-river-water-tile.v1.png");
  assert.equal(asset.technical.width, 1254);
  assert.equal(asset.technical.height, 1254);
  assert.equal(asset.technical.alpha, false);
  assert.deepEqual(pack.assetIds, [VISUAL_ASSET_IDS.TOWN_RIVER_WATER_TILE]);
});

test("the authored river is curved while remaining aligned at every bridge", () => {
  const xs = RIVER_VISUAL_PATH.map(([x]) => x);
  assert.ok(Math.max(...xs) - Math.min(...xs) >= 120, "river should have a visibly natural horizontal meander");
  for (const bridge of BRIDGES) {
    assert.ok(RIVER_VISUAL_PATH.some(([x, y]) => y === bridge.y && Math.abs(x - 2560) <= 5), `${bridge.id} must remain centred on the river crossing`);
  }
  assert.ok(TOWN_REFERENCE_LAYOUT.woodland.riverClearHalfWidth >= (Math.max(...xs) - Math.min(...xs)) / 2 + TOWN_REFERENCE_LAYOUT.river.bankWidth / 2);
  assert.equal(RIVER_PATH.length, 11, "visual work must not rewrite the protected gameplay river");
});

test("animated water is clipped by authored geometry and never derives gameplay from texture dimensions", async () => {
  const source = await readFile(new URL("../src/presentation/TownRiverVisual.js", import.meta.url), "utf8");
  assert.match(source, /context\.lineWidth = waterWidth \* RIVER_MASK_RESOLUTION/);
  assert.match(source, /water\.enableFilters\?\.\(\)/);
  assert.match(source, /if \(!water\.filters\?\.internal\)/);
  assert.match(source, /filters\.internal\.addMask\(RIVER_MASK_TEXTURE_KEY\)/);
  assert.doesNotMatch(source, /\.setMask\(/);
  assert.doesNotMatch(source, /filters\.external\.addMask/);
  assert.match(source, /tilePositionY -=/);
  assert.doesNotMatch(source, /texture\.(?:width|height)|displayWidth|displayHeight|getBounds\(/);
  assert.match(source, /excludeFromStaticTownBackdrop: true/);
});
