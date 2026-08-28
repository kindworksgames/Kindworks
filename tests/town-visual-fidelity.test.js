import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { HOUSES, PATHS, SHOPS } from "../src/data/town.js";
import { LAWN_PLOTS } from "../src/data/farming.js";
import { buildHouseInteriorLayout } from "../src/data/homeInteriors.js";
import { createFreshGameState } from "../src/state/GameState.js";
import {
  ANIMAL_ANATOMY_VISUALS,
  CROP_STAGE_VISUALS,
  HOUSE_ARCHITECTURE_KITS,
  NPC_ACTIVITY_VISUALS,
  ORCHARD_STAGE_VISUALS,
  SHOP_VISUAL_STATES,
  WORLD_VISUAL_ASSETS,
  npcActivityVisual,
  houseArchitectureKit,
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

test("all protected house identities, lawns and five architecture assignments stay attached to their original plots", () => {
  const expected = {
    "house-1": [208, 215, "starter-cottage"], "house-2": [598, 215, "bay-cottage"], "house-3": [988, 215, "cross-gable"],
    "house-4": [1378, 215, "two-storey"], "house-5": [1768, 215, "grand-veranda"], "house-6": [2158, 215, "bay-cottage"],
    "house-7": [208, 1680, "cross-gable"], "house-8": [598, 1680, "starter-cottage"], "house-9": [1768, 1680, "two-storey"],
    "house-10": [2790, 1680, "grand-veranda"], "house-11": [988, 1680, "bay-cottage"], "house-12": [1378, 1680, "cross-gable"],
    "house-13": [2790, 1280, "starter-cottage"], "house-14": [3120, 1280, "two-storey"], "house-15": [3450, 1280, "grand-veranda"],
    "house-16": [3780, 1280, "bay-cottage"], "house-17": [3120, 1680, "cross-gable"], "house-18": [3450, 1680, "two-storey"],
    "house-20": [3780, 1680, "starter-cottage"],
  };
  assert.equal(HOUSES.length, 19);
  assert.deepEqual(Object.fromEntries(HOUSES.map((house) => [house.id, [house.x, house.y, house.architectureKit]])), expected);
  for (const plot of LAWN_PLOTS.filter((entry) => entry.active)) {
    const house = HOUSES.find((entry) => entry.id === plot.houseSourceId);
    assert.ok(house, `${plot.id} must reference a physical house`);
    assert.equal(plot.homeNodeId, `home${String(Number(house.id.split("-")[1])).padStart(2, "0")}`);
    assert.ok(plot.x >= house.yard.x && plot.x <= house.yard.x + house.yard.width);
    assert.ok(plot.y >= house.yard.y && plot.y <= house.yard.y + house.yard.height);
  }
});

test("each recovered exterior kit has a distinct silhouette and controls its NPC interior footprint", () => {
  const state = createFreshGameState({ now: 0 });
  assert.deepEqual(HOUSE_ARCHITECTURE_KITS.map(({ id }) => id), ["starter-cottage", "bay-cottage", "cross-gable", "two-storey", "grand-veranda"]);
  assert.equal(new Set(HOUSE_ARCHITECTURE_KITS.map((kit) => `${kit.roofShape.right - kit.roofShape.left}:${kit.roofShape.topY}:${kit.body.w}:${kit.body.h}`)).size, 5);
  assert.equal(new Set(HOUSE_ARCHITECTURE_KITS.map((kit) => `${kit.interior.width}x${kit.interior.height}`)).size, 5);
  for (const house of HOUSES.filter(({ id }) => id !== "house-20")) {
    const kit = houseArchitectureKit(house.architectureKit);
    const layout = buildHouseInteriorLayout(state, house.id);
    assert.deepEqual([layout.w, layout.h, layout.level], [kit.interior.width, kit.interior.height, kit.interior.level]);
  }
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
  assert.match(town, /houseDirtStage/);
  assert.match(town, /lawnStage/);
  assert.ok((town.match(/refreshJobs/g) || []).length >= 2);
  assert.match(npc, /npcActivityVisual/);
  assert.match(animal, /ANIMAL_ANATOMY_VISUALS/);
  assert.match(animal, /animal-anatomy/);
});
