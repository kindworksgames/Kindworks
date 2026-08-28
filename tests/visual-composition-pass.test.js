import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const readText = async (path) => readFile(new URL(path, root), "utf8");

test("Waste Collection and Lawn Care use full-canvas landscape compositions", async () => {
  const styles = await readText("src/style.css");
  assert.match(styles, /Waste Collection reference-led park composition/);
  assert.match(styles, /WasteCollectionScene[\s\S]*?waste-campaign-hud:not\(\.hidden\)[\s\S]*?width: auto !important/);
  assert.match(styles, /WasteCollectionScene[\s\S]*?waste-board-viewport[\s\S]*?grid-row: 1 !important/);
  assert.match(styles, /WasteCollectionScene[\s\S]*?waste-tray-wrap[\s\S]*?width: min\(76%, 650px\) !important/);
  assert.match(styles, /Lawn Care full-canvas visual composition/);
  assert.match(styles, /LawnCareScene[\s\S]*?lawn-care-hud:not\(\.hidden\)[\s\S]*?width: auto !important/);
  assert.match(styles, /lawn-board[\s\S]*?height: 100% !important/);
});

test("Fishing removes unrelated town chrome and keeps a compact active panel", async () => {
  const styles = await readText("src/style.css");
  assert.match(styles, /Fishing keeps the water and animated cast as the focus/);
  assert.match(styles, /FishingScene"\] \.town-hud \{ display: none !important; \}/);
  assert.match(styles, /FishingScene"\] \.fishing-hud \{ width: min\(250px/);
  assert.match(styles, /FishingScene"\] \.fishing-catch-list \{ display: none !important; \}/);
});

test("home-interior visual scaling preserves one shared forward and inverse transform", async () => {
  const [scene, styles] = await Promise.all([
    readText("src/scenes/HouseInteriorScene.js"),
    readText("src/style.css"),
  ]);
  assert.match(scene, /const VIEW = Object\.freeze\(\{ x: -175, y: 0, scale: 1\.3 \}\)/);
  assert.match(scene, /x: VIEW\.x \+ item\.x \* VIEW\.scale/);
  assert.match(scene, /x: \(pointer\.x - VIEW\.x\) \/ VIEW\.scale/);
  assert.match(styles, /Home interiors give the room priority/);
  assert.match(styles, /home-interior-sidebar:has\(\.home-furniture-tray\.open, \.home-furniture-placement:not\(\.hidden\)\)/);
});
