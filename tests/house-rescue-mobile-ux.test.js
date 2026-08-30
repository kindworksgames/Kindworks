import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const readText = async (path) => readFile(new URL(path, root), "utf8");

test("uses the full landscape room with contextual compact physical bins", async () => {
  const [markup, styles, scene] = await Promise.all([readText("index.html"), readText("src/style.css"), readText("src/scenes/HouseRescueScene.js")]);
  assert.match(markup, /id="house-rescue-exit"[^>]*aria-label="Save House Rescue and exit safely"[^>]*>Exit<\/button>/);
  for (const label of ["KW-HOUSE-RESCUE-BIN-ORGANIC", "KW-HOUSE-RESCUE-BIN-RECYCLING", "KW-HOUSE-RESCUE-BIN-GARBAGE"]) assert.ok(markup.includes(label), label);
  assert.match(styles, /House Rescue full-room fidelity recovery/);
  assert.match(styles, /body\[data-game-scene="HouseRescueScene"\] \.house-rescue-sort-floor,[\s\S]*?position: absolute !important;[\s\S]*?inset: 0 !important;/);
  assert.match(styles, /\.house-rescue-bins\.is-open \{ pointer-events: auto; opacity: 1; transform: none; \}/);
  assert.match(styles, /\.house-rescue-bins button \{[\s\S]*?width: 44px;[\s\S]*?min-height: 44px !important;/);
  assert.match(styles, /data-house-rescue-bin="organic"\][\s\S]*?--bin-colour: #579b55/);
  assert.match(styles, /data-house-rescue-bin="recycle"\][\s\S]*?--bin-colour: #438dcc/);
  assert.match(styles, /data-house-rescue-bin="garbage"\][\s\S]*?--bin-colour: #555d5f/);
  assert.match(styles, /\.house-rescue-hud button, \.house-rescue-hud select \{ min-height: var\(--kw-touch-min\)/);
  assert.doesNotMatch(styles, /\.house-rescue-item\.compact-slot-1 \{ left:/);
  assert.match(scene, /data-house-room-layout=/);
  assert.match(scene, /KW-HOUSE-RESCUE-ZONE-/);
  assert.match(scene, /this\.bins\?\.classList\.toggle\("is-open", Boolean\(this\.selectedItemId\)\)/);
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
