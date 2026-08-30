import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import {
  ANIMAL_DEFINITIONS,
  ANIMAL_REFERENCE_FRAMES,
  ANIMAL_REFERENCE_SHEET_PATH,
  ANIMAL_VISUAL_FIDELITY_VERSION,
  animalReferenceFrame,
} from "../src/data/animals.js";

const root = new URL("../", import.meta.url);

test("the exact protected v44 animal reference sheet is recovered intact", async () => {
  const image = await readFile(new URL(`public${ANIMAL_REFERENCE_SHEET_PATH}`, root));
  assert.equal(image.readUInt32BE(16), 384);
  assert.equal(image.readUInt32BE(20), 512);
  assert.equal(createHash("sha256").update(image).digest("hex"), "c7a8db375596b9e8ec614b4756c839958612c28bf462641806fc505348bcbae6");
  assert.equal(ANIMAL_VISUAL_FIDELITY_VERSION, "v44-reference-master");
  assert.equal(Object.keys(ANIMAL_REFERENCE_FRAMES).length, 43);
});

test("every migrated animal identity resolves to an authored reference frame", () => {
  for (const definition of ANIMAL_DEFINITIONS) assert.ok(Number.isInteger(animalReferenceFrame(definition)), `${definition.id} has no exact reference frame`);
});

test("town, Paws & Wonders and the personal home use the shared legacy artwork", async () => {
  const [main, town, friends, styles, boot, character, paws, home] = await Promise.all([
    readFile(new URL("src/main.js", root), "utf8"),
    readFile(new URL("src/scenes/TownScene.js", root), "utf8"),
    readFile(new URL("src/ui/AnimalFriendsController.js", root), "utf8"),
    readFile(new URL("src/style.css", root), "utf8"),
    readFile(new URL("src/scenes/BootScene.js", root), "utf8"),
    readFile(new URL("src/entities/AnimalCharacter.js", root), "utf8"),
    readFile(new URL("src/scenes/PawsWondersScene.js", root), "utf8"),
    readFile(new URL("src/scenes/HouseInteriorScene.js", root), "utf8"),
  ]);
  assert.match(boot, /queueScenePacks\(this, this\.scene\.key\)/);
  assert.doesNotMatch(boot, /load\.spritesheet\(/);
  assert.match(character, /animalReferenceFrame\(definition\)/);
  assert.match(paws, /animalReferenceFrame\(ANIMAL_BY_ID\[item\.animalId\]\)/);
  assert.match(home, /animalReferenceFrame\(ANIMAL_BY_ID\[occupant\.id\]\)/);
  assert.match(main, /"animal-fidelity"/);
  assert.match(town, /const animalQa = \["animals", "animal-fidelity"\]/);
  assert.match(town, /animalQaArea === "paws"/);
  assert.match(friends, /\["animals", "animal-fidelity"\]/);
  assert.match(friends, /animal-reference-thumb/);
  assert.match(styles, /background-size: 600% 800%/);
});
