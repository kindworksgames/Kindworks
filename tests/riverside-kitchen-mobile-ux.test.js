import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const readText = async (path) => readFile(new URL(path, root), "utf8");

test("keeps Riverside Kitchen trays, exact-heat workbench and feedback inside short landscape phones", async () => {
  const [markup, styles] = await Promise.all([readText("index.html"), readText("src/style.css")]);
  assert.match(markup, /id="riverside-kitchen-exit"[^>]*aria-label="Save the Riverside Kitchen shift and exit"[^>]*>Save &amp; Exit<\/button>/);
  assert.match(markup, /class="riverside-kitchen-worktop"/);
  assert.match(styles, /#riverside-kitchen-hud button, #riverside-kitchen-hud select \{ min-height: var\(--kw-touch-min, 44px\)/);
  assert.match(styles, /#riverside-kitchen-hud\[data-riverside-kitchen-view="shift"\] \{[\s\S]*?position: fixed;[\s\S]*?pointer-events: none;[\s\S]*?background: transparent;/);
  assert.match(styles, /#riverside-kitchen-hud\[data-riverside-kitchen-view="shift"\] \.cafe-orders \{ display: none; \}/);
  assert.match(styles, /#riverside-kitchen-hud\[data-riverside-kitchen-view="shift"\] \.cafe-step-list \{[\s\S]*?display: flex;[\s\S]*?overflow-x: auto;/);
  assert.match(styles, /#riverside-kitchen-hud \.cafe-result-actions button\.hidden \{ display: none; \}/);
});

test("preserves resumable Save & Exit and exact-heat states while using contextual meal actions", async () => {
  const scene = await readText("src/scenes/RiversideKitchenScene.js");
  for (const copy of ["Choose a restaurant shift.", "Choose a meal. Follow the highlight.", "burnt. Tap to clear it.", "Turn your device sideways to play."]) assert.ok(scene.includes(copy), copy);
  assert.match(scene, /this\.onExit = \(\) => this\.returnToTown\(false\)/);
  assert.match(scene, /const suspended = this\.riversideKitchen\.suspend\(\)/);
  assert.match(scene, /this\.undoButton\.classList\.toggle\("hidden", !canRevise \|\| tray\.stepIndex < 1\)/);
  assert.match(scene, /this\.serveButton\.classList\.toggle\("hidden", !canServe\)/);
  assert.match(scene, /this\.nextButton\.classList\.toggle\("hidden", !result\.won\)/);
  for (const stationState of ["working", "ready", "burnt"]) assert.ok(scene.includes(`stationState === "${stationState}"`), stationState);
});

test("retains the protected 150-shift Riverside Kitchen first-clear engine", async () => {
  const [data, service] = await Promise.all([readText("src/data/riversideKitchen.js"), readText("src/systems/RiversideKitchenService.js")]);
  assert.match(data, /levelCount:\s*150/);
  for (const station of ["panLow", "panMedium", "panHigh", "potSimmer", "potBoil", "grillMedium", "grillHigh", "ovenRoast"]) assert.ok(data.includes(`${station}:`), station);
  assert.match(service, /firstClear/);
  assert.match(service, /kind: "riverside-kitchen-first-clear"/);
});
