import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const readText = async (path) => readFile(new URL(path, root), "utf8");

test("keeps Morning Mug trays, workbench and feedback inside short landscape phones", async () => {
  const [markup, styles] = await Promise.all([readText("index.html"), readText("src/style.css")]);
  assert.match(markup, /id="morning-mug-exit"[^>]*aria-label="Save the Morning Mug shift and exit"[^>]*>Save &amp; Exit<\/button>/);
  assert.match(markup, /class="morning-mug-worktop"/);
  assert.match(styles, /#morning-mug-hud button, #morning-mug-hud select \{ min-height: var\(--kw-touch-min, 44px\)/);
  assert.match(styles, /#morning-mug-hud\[data-morning-mug-view="shift"\] \{[\s\S]*?position: fixed;[\s\S]*?pointer-events: none;[\s\S]*?background: transparent;/);
  assert.match(styles, /#morning-mug-hud\[data-morning-mug-view="shift"\] \.cafe-orders \{ display: none; \}/);
  assert.match(styles, /#morning-mug-hud\[data-morning-mug-view="shift"\] \.cafe-step-list \{[\s\S]*?display: flex;[\s\S]*?overflow-x: auto;/);
});

test("preserves resumable Save & Exit while using contextual drink actions", async () => {
  const scene = await readText("src/scenes/MorningMugScene.js");
  for (const copy of ["Choose a coffee shift.", "Choose a drink. Follow the highlight.", "Drink cleared. Start again.", "Turn your device sideways to play."]) assert.ok(scene.includes(copy), copy);
  assert.match(scene, /this\.onExit = \(\) => this\.returnToTown\(false\)/);
  assert.match(scene, /const suspended = this\.morningMug\.suspend\(\)/);
  assert.match(scene, /const activeAppliance = this\.morningMug\.activeAppliance\(\)/);
  assert.match(scene, /!activeAppliance && tray\.stepIndex < 1/);
  assert.match(scene, /this\.serveButton\.classList\.toggle\("hidden", !canServe\)/);
  assert.match(scene, /this\.nextButton\.classList\.toggle\("hidden", !result\.won\)/);
});

test("retains the protected 150-shift Morning Mug first-clear engine", async () => {
  const [data, service] = await Promise.all([readText("src/data/morningMug.js"), readText("src/systems/MorningMugService.js")]);
  assert.match(data, /levelCount:\s*150/);
  assert.match(service, /firstClear/);
  assert.match(service, /kind: "morning-mug-first-clear"/);
});
