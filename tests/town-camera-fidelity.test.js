import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readText = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("town defaults to a free-browse camera and only controls the owned resident explicitly", async () => {
  const [town, camera] = await Promise.all([
    readText("src/scenes/TownScene.js"),
    readText("src/systems/TownCameraController.js"),
  ]);
  assert.match(town, /this\.player\.setVisible\(false\)/);
  assert.match(town, /this\.movement\.setEnabled\(false\)/);
  assert.match(town, /this\.townBrowseMode = true/);
  assert.match(town, /browseSelectAt\(x, y\)/);
  assert.match(town, /startCustomResidentControl\(\)/);
  assert.match(town, /dataset\.townMode = controlling \? "resident-control" : "browse"/);
  assert.match(camera, /this\.pointers\.size === 2/);
  assert.match(camera, /this\.camera\.setScroll\(this\.drag\.scrollX - dx \/ this\.camera\.zoom/);
  assert.match(camera, /this\.onBrowseMove\(\)/);
  assert.match(camera, /this\.onBrowseTap\(world\.x, world\.y\)/);
  assert.match(camera, /distance \/ this\.pinch\.distance/);
  assert.match(camera, /"arrowleft" \|\| key === "a"/);
});

test("town interface removes redundant title and zoom buttons while retaining gesture guidance", async () => {
  const [markup, styles] = await Promise.all([readText("index.html"), readText("src/style.css")]);
  assert.doesNotMatch(markup, /id=["']zoom-(?:in|out)["']/);
  assert.doesNotMatch(markup, /class=["'][^"']*town-title/);
  assert.match(markup, /Drag to explore · Pinch to zoom · Tap a place or resident/);
  assert.match(styles, /body\[data-game-scene="TownScene"\] #game canvas[\s\S]*?touch-action:\s*none/);
});
