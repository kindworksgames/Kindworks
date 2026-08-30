import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { setRuntimeSceneMarkers } from "../src/ui/runtimeSceneMarkers.js";

const root = new URL("../", import.meta.url);
const readText = (path) => readFile(new URL(path, root), "utf8");

test("production-facing copy contains no migration tracking or legacy diagnostics", async () => {
  const paths = [
    "index.html",
    "src/data/homeInteriors.js",
    "src/state/SaveRepository.js",
    "src/ui/EconomyHudController.js",
    "src/ui/SaveStatusController.js",
    "src/ui/ShopController.js",
    "src/scenes/BakeryScene.js",
    "src/scenes/BeachCleanupScene.js",
    "src/scenes/CafeScene.js",
    "src/scenes/FishingScene.js",
    "src/scenes/HouseInteriorScene.js",
    "src/scenes/HouseRescueScene.js",
    "src/scenes/LawnCareScene.js",
    "src/scenes/MorningMugScene.js",
    "src/scenes/PlaygroundPowerwashScene.js",
    "src/scenes/RiverClearoutScene.js",
    "src/scenes/RiversideKitchenScene.js",
    "src/scenes/SouthShoreScoopsScene.js",
    "src/scenes/WasteCollectionScene.js",
  ];
  const sources = await Promise.all(paths.map(readText));
  const playerCopy = sources.join("\n");
  for (const forbidden of [
    /\bMILESTONES?\s+\d+/i,
    /VERTICAL SLICE/i,
    /legacy item definitions/i,
    /Phaser save/i,
    /original HTML game/i,
    /approved legacy artwork/i,
    /save atomically/i,
    /safely rolls back/i,
  ]) {
    assert.doesNotMatch(playerCopy, forbidden, `Player-facing source must not contain ${forbidden}`);
  }
});

test("Town location status reports the place without exposing raw world coordinates", async () => {
  const source = await readText("src/scenes/TownScene.js");
  const start = source.indexOf("  updateStatus() {");
  const end = source.indexOf("\n  refreshAnimalPresentations", start);
  assert.ok(start >= 0 && end > start);
  const method = source.slice(start, end);
  const assignment = method.match(/status\.textContent\s*=\s*[^;]+;/)?.[0] || "";
  assert.equal(assignment, "status.textContent = `${prefix}${label}`;");
  assert.doesNotMatch(assignment, /Math\.round|position\.x|position\.y|\d+\s*,\s*\d+/);
});

test("runtime scene markers stay synchronized through House Interior re-entry", () => {
  const rootElement = { dataset: {} };
  const documentObject = {
    body: { dataset: {} },
    querySelector(selector) { return selector === "#game" ? rootElement : null; },
  };
  for (const scene of ["TownScene", "HouseInteriorScene", "TownScene", "HouseInteriorScene"]) {
    const result = setRuntimeSceneMarkers(documentObject, scene);
    assert.deepEqual(result, { bodyScene: scene, rootScene: scene });
  }
});

test("House Interior applies the shared marker synchronization at scene entry", async () => {
  const source = await readText("src/scenes/HouseInteriorScene.js");
  assert.match(source, /setSceneInterface\(\)\s*\{\s*setRuntimeSceneMarkers\(document, this\.scene\.key\)/s);
});
