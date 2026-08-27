import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const readText = async (path) => readFile(new URL(path, root), "utf8");

test("keeps the Scoops queue, picture board and feedback inside short landscape phones", async () => {
  const [markup, styles] = await Promise.all([readText("index.html"), readText("src/style.css")]);
  assert.match(markup, /id="south-shore-scoops-exit"[^>]*aria-label="Save the South Shore Scoops shift and exit"[^>]*>Save &amp; Exit<\/button>/);
  assert.match(markup, /class="south-shore-scoops-worktop"/);
  assert.match(styles, /#south-shore-scoops-hud button, #south-shore-scoops-hud select \{ min-height: var\(--kw-touch-min, 44px\)/);
  assert.match(styles, /#south-shore-scoops-hud\[data-scoops-view="shift"\] \{[\s\S]*?position: fixed;[\s\S]*?pointer-events: none;[\s\S]*?background: transparent;/);
  assert.match(styles, /#south-shore-scoops-hud\[data-scoops-view="shift"\] \.scoops-part-list \{[\s\S]*?display: flex;[\s\S]*?overflow-x: auto;/);
  assert.match(styles, /#south-shore-scoops-hud \.scoops-result-actions button\.hidden \{ display: none; \}/);
});

test("preserves resumable picture orders while revealing only contextual Scoops actions", async () => {
  const scene = await readText("src/scenes/SouthShoreScoopsScene.js");
  for (const copy of ["Choose a beach-counter shift.", "Match the picture, then serve.", "Order cleared. Start again.", "Turn your device sideways to play."]) assert.ok(scene.includes(copy), copy);
  assert.match(scene, /this\.onExit = \(\) => this\.returnToTown\(false\)/);
  assert.match(scene, /const suspended = this\.scoops\.suspend\(\)/);
  assert.match(scene, /this\.undoButton\.classList\.toggle\("hidden", !canUndo\)/);
  assert.match(scene, /this\.addTrayButton\.classList\.toggle\("hidden", !canAddTray\)/);
  assert.match(scene, /this\.serveButton\.classList\.toggle\("hidden", !canServe\)/);
  assert.match(scene, /this\.nextButton\.classList\.toggle\("hidden", !result\.won\)/);
  assert.match(scene, /guided && left === expectedPart/);
  assert.match(scene, /if \(guided\) this\.partList\.scrollLeft = 0/);
  assert.match(scene, /animateScoopsDeparture\(this\)/);
  assert.match(scene, /this\.time\.delayedCall\(360/);
});

test("retains the protected 750-shift, 60-percent and first-clear Scoops engine", async () => {
  const [data, service] = await Promise.all([readText("src/data/southShoreScoops.js"), readText("src/systems/SouthShoreScoopsService.js")]);
  assert.match(data, /levelCount:\s*750/);
  assert.match(data, /passingAccuracy:\s*60/);
  assert.match(service, /firstClear/);
  assert.match(service, /kind: "south-shore-scoops-first-clear"/);
  assert.match(service, /progress\.restorationTier/);
});
