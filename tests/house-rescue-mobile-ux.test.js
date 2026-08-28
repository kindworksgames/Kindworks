import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const readText = async (path) => readFile(new URL(path, root), "utf8");

test("keeps House Rescue play and touch controls inside the landscape safe viewport", async () => {
  const [markup, styles] = await Promise.all([readText("index.html"), readText("src/style.css")]);
  assert.match(markup, /id="house-rescue-exit"[^>]*aria-label="Save House Rescue and exit safely"[^>]*>Exit<\/button>/);
  assert.match(styles, /\.house-rescue-hud \{ position: fixed; inset: max\(4px, env\(safe-area-inset-top\)\)/);
  assert.match(styles, /\.house-rescue-hud \{[^\n]*grid-template-rows: auto minmax\(0, 1fr\) auto/);
  assert.match(styles, /\.house-rescue-sort-layout \{ grid-template-columns: minmax\(0, 1fr\) 136px; min-height: 0; height: 100%/);
  assert.match(styles, /\.house-rescue-sort-floor, \.house-rescue-vacuum-floor \{ width: 100%; height: 100%; min-height: 0/);
  assert.match(styles, /\.house-rescue-hud button, \.house-rescue-hud select \{ min-height: var\(--kw-touch-min\)/);
  assert.match(styles, /@media \(max-height: 430px\)[\s\S]*\.house-rescue-item \{ width: var\(--kw-touch-min\); min-height: var\(--kw-touch-min\) !important; \}[\s\S]*\.house-rescue-item small \{ display: none; \}/);
  assert.match(styles, /\.house-rescue-item\.compact-slot-1 \{ left: 10% !important; top: 36% !important; \}/);
  assert.match(styles, /body\[data-orientation-blocked="true"\] \.landscape-required \{[\s\S]*?transform: none;[\s\S]*?border: 0;/);
});

test("uses one result action and short contextual House Rescue feedback", async () => {
  const [markup, scene] = await Promise.all([readText("index.html"), readText("src/scenes/HouseRescueScene.js")]);
  assert.doesNotMatch(markup, /house-rescue-next-home/);
  assert.doesNotMatch(markup, /id="house-rescue-picker"|id="house-rescue-level-select"|id="house-rescue-start"/);
  assert.doesNotMatch(markup, /id="house-rescue-result-stars"|id="house-rescue-result-score"|id="house-rescue-result-accuracy"/);
  assert.match(markup, /class="house-rescue-result-actions"><button id="house-rescue-return"/);
  assert.match(scene, /this\.startLevel\(this\.entryData\.level \|\| progress\.selectedLevel\)/);
  for (const copy of ["Rescue resumed.", "Correct! +2.", "Wrong bin. −1. Try another.", "Sorting complete. Clean 95% of the floor.", "House saved. Reward added."]) assert.ok(scene.includes(copy), copy);
  assert.match(scene, /selected\. Choose a bin\./);
  assert.match(scene, /const active = this\.houseRescue\.getActiveSession\(\);[\s\S]*if \(active\) \{[\s\S]*this\.setMessage\("Rescue resumed\.", "success"\)/);
});

test("prevents a saved House Rescue from appearing inside a different cottage", async () => {
  const [interior, town] = await Promise.all([readText("src/scenes/HouseInteriorScene.js"), readText("src/scenes/TownScene.js")]);
  assert.match(interior, /activeRescue && activeRescue\.houseId !== this\.houseId/);
  assert.match(interior, /Resume at \$\{waitingName\} first\./);
  assert.match(interior, /this\.cleanButton\.disabled = rescueWaitingElsewhere/);
  assert.match(interior, /"Rescue saved elsewhere"/);
  assert.match(town, /qaParams\?\.get\("house"\)/);
});
