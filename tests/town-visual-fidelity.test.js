import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { HOUSES, PATHS, SHOPS } from "../src/data/town.js";
import {
  ANIMAL_ANATOMY_VISUALS,
  CROP_STAGE_VISUALS,
  HOUSE_ARCHITECTURE_KITS,
  NPC_ACTIVITY_VISUALS,
  ORCHARD_STAGE_VISUALS,
  SHOP_VISUAL_STATES,
  WORLD_VISUAL_ASSETS,
  npcActivityVisual,
} from "../src/data/legacyVisualStates.js";

const readText = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("legacy town visual catalogue covers authored world states", () => {
  assert.ok(PATHS.some(({ id }) => id === "mill-walk"));
  assert.equal(new Set(HOUSES.map(({ architectureKit }) => architectureKit)).size, HOUSE_ARCHITECTURE_KITS.length);
  assert.equal(CROP_STAGE_VISUALS.at(0).id, "seed");
  assert.equal(CROP_STAGE_VISUALS.at(-1).id, "ready");
  assert.deepEqual(ORCHARD_STAGE_VISUALS.map(({ id }) => id), ["sapling", "young", "mature", "fruiting", "picked"]);
  assert.ok(Object.keys(ANIMAL_ANATOMY_VISUALS).length >= 12);
  assert.ok(NPC_ACTIVITY_VISUALS.length >= 6);
  assert.equal(npcActivityVisual("watering the allotment").id, "watering");
  assert.equal(npcActivityVisual("anything", "HELPING").id, "helping");
  for (const entry of WORLD_VISUAL_ASSETS) assert.match(entry.assetId, /^world\./);
});

test("shop catalogue provides semantic merchandise for authored legacy venues", () => {
  for (const [title, visual] of Object.entries(SHOP_VISUAL_STATES)) {
    assert.ok(SHOPS.some((shop) => shop.title === title), `${title} must exist in town data`);
    assert.ok(visual.merchandise.length >= 2);
    assert.match(visual.assetId, /^shop\./);
  }
});

test("town renders the protected world visual language and semantic Sprite AI labels", async () => {
  const [town, npc, animal] = await Promise.all([
    readText("src/scenes/TownScene.js"),
    readText("src/entities/NpcCharacter.js"),
    readText("src/entities/AnimalCharacter.js"),
  ]);
  assert.match(town, /drawAmbientPondDucks/);
  assert.match(town, /world\.selection-highlight/);
  assert.match(town, /updateWorldObjectLighting/);
  assert.match(town, /world\.ground-stain/);
  assert.match(town, /world\.river-pollution/);
  assert.match(town, /cropStage/);
  assert.match(town, /orchardStage/);
  assert.match(npc, /npcActivityVisual/);
  assert.match(animal, /ANIMAL_ANATOMY_VISUALS/);
  assert.match(animal, /animal-anatomy/);
});
