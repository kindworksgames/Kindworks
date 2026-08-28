import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const readText = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("town browsing exposes every saved allotment bed as a direct farming interaction", async () => {
  const town = await readText("src/scenes/TownScene.js");
  assert.match(town, /kind: "allotment-bed"/);
  assert.match(town, /openFarming\("allotment", bed\.id\)/);
  assert.match(town, /radius: Math\.hypot\(rect\.width \/ 2, rect\.height \/ 2\)/);
});

test("orchard town artwork follows growth and fruit state instead of a static tree emoji", async () => {
  const town = await readText("src/scenes/TownScene.js");
  assert.match(town, /tree\.status === "growing" \? 0\.72 \* Phaser\.Math\.Clamp\(progress, 0\.2, 0\.68\) : 0\.72/);
  assert.match(town, /if \(tree\.availableFruit > 0\)/);
  assert.match(town, /treeGraphics\.fillStyle\(0xc94d3f/);
});

test("production farming copy hides migration metadata and raw tree coordinates", async () => {
  const [html, controller] = await Promise.all([readText("index.html"), readText("src/ui/FarmingController.js")]);
  assert.doesNotMatch(html, /MILESTONE 26/);
  assert.doesNotMatch(controller, /Math\.round\(tree\.(?:x|y)\)/);
  assert.match(controller, /Harvest a ripe apple or plant an owned sapling\./);
});
