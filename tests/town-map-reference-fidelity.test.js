import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { BRIDGES, RIVER_PATH, TOWN_REFERENCE_LAYOUT, WORLD } from "../src/data/town.js";

const readText = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("the approved Willowmere reference topology remains explicit and code-native", () => {
  assert.deepEqual(WORLD, { width: 4200, height: 2800 });
  assert.equal(BRIDGES.length, 3);
  assert.equal(TOWN_REFERENCE_LAYOUT.river.bridgeCount, BRIDGES.length);
  assert.equal(TOWN_REFERENCE_LAYOUT.river.treeFree, true);
  assert.ok(TOWN_REFERENCE_LAYOUT.river.bankWidth > TOWN_REFERENCE_LAYOUT.river.waterWidth);
  assert.ok(RIVER_PATH.at(0)[1] < 0 && RIVER_PATH.at(-1)[1] > WORLD.height);
  assert.deepEqual(TOWN_REFERENCE_LAYOUT.ponds.map(({ id, feature }) => [id, feature]), [
    ["commons-pond", "fountain"],
    ["reedbank-pond", "fishing-dock"],
  ]);
  assert.ok(TOWN_REFERENCE_LAYOUT.playground.width >= 350);
  assert.ok(TOWN_REFERENCE_LAYOUT.playground.height >= 300);
  assert.ok(TOWN_REFERENCE_LAYOUT.beach.shoreline.length >= 7);
});

test("woodland surrounds town without placing authored trees over the river", () => {
  const { riverClearCenterX, riverClearHalfWidth, interiorTrees } = TOWN_REFERENCE_LAYOUT.woodland;
  assert.ok(interiorTrees.length >= 20);
  for (const [x] of interiorTrees) {
    assert.ok(Math.abs(x - riverClearCenterX) >= riverClearHalfWidth, `tree at ${x} must remain clear of Willow River`);
  }
});

test("the Phaser town builds the reference with interactive drawing layers, not a pasted map image", async () => {
  const town = await readText("src/scenes/TownScene.js");
  for (const method of [
    "drawReferenceWaterways",
    "drawReferenceWoodland",
    "drawReferencePonds",
    "drawReferenceBeachDetails",
  ]) assert.match(town, new RegExp(`${method}\\(`));
  for (const label of [
    "world.willow-river.water",
    "world.willow-river.rock-banks",
    "world.woodland.perimeter",
    "world.commons.playground-layout",
    "world.commons.pond-fountain",
    "world.reedbank.fishing-dock",
    "world.south-shore.curved-beach",
    "world.south-shore.furniture-and-pier",
  ]) assert.ok(town.includes(label), label);
  assert.match(town, /bankOffset = river\.waterWidth \/ 2 \+ radius \* 0\.55 \+ 5/);
  assert.doesNotMatch(town, /spread \/ 2 \+ 3/);
  assert.doesNotMatch(town, /load\.image\([^\n]*(?:town|map)[^\n]*\)/i);
  assert.doesNotMatch(town, /Codex Image 19 Aug 2026/);
});
