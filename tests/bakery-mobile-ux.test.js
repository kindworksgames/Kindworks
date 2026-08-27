import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const readText = async (path) => readFile(new URL(path, root), "utf8");

test("keeps the Little Bakery workbench and feedback inside short landscape phones", async () => {
  const [markup, styles] = await Promise.all([readText("index.html"), readText("src/style.css")]);
  assert.match(markup, /id="bakery-exit"[^>]*aria-label="Exit Little Bakery safely"[^>]*>Exit<\/button>/);
  assert.match(markup, /class="bakery-worktop"/);
  assert.match(markup, /id="bakery-orders"/);
  assert.match(markup, /id="bakery-trays"/);
  assert.match(styles, /\.bakery-hud button, \.bakery-hud select \{ min-height: var\(--kw-touch-min, 44px\)/);
  assert.match(styles, /@media \(max-width: 900px\) and \(max-height: 650px\) and \(orientation: landscape\)/);
  assert.match(styles, /\.bakery-hud\[data-bakery-view="shift"\] \{[\s\S]*?position: fixed;[\s\S]*?pointer-events: none;[\s\S]*?background: transparent;/);
  assert.match(styles, /\.bakery-hud\[data-bakery-view="shift"\] \.bakery-step-list \{[\s\S]*?display: flex;[\s\S]*?overflow-x: auto;/);
  assert.match(styles, /\.bakery-hud\[data-bakery-view="shift"\] \.bakery-status \{[\s\S]*?min-height: 44px;[\s\S]*?max-height: 44px;/);
});

test("uses contextual Bakery actions and short action-led prompts", async () => {
  const scene = await readText("src/scenes/BakeryScene.js");
  for (const copy of [
    "Choose a bakery shift.",
    "Follow the highlight.",
    "This tray was cleared.",
    "Leave this shift? Tap Confirm Exit.",
    "Turn your device sideways to play.",
  ]) assert.ok(scene.includes(copy), copy);
  assert.match(scene, /this\.hud\.dataset\.bakeryView = "shift"/);
  assert.match(scene, /this\.hud\.dataset\.bakeryView = "result"/);
  assert.match(scene, /this\.undoButton\.classList\.toggle\("hidden", !canRevise\)/);
  assert.match(scene, /this\.discardButton\.classList\.toggle\("hidden", !canRevise\)/);
  assert.match(scene, /this\.serveButton\.classList\.toggle\("hidden", !canServe\)/);
  assert.match(scene, /this\.bakery\.selectTray/);
  assert.match(scene, /session\.trays\.map/);
  assert.match(scene, /instantOrders: this\.fidelityQa/);
});

test("retains the protected 150-shift Bakery campaign and first-clear reward engine", async () => {
  const [data, service] = await Promise.all([readText("src/data/bakery.js"), readText("src/systems/BakeryService.js")]);
  assert.match(data, /levelCount: 150/);
  assert.match(service, /firstClear/);
  assert.match(service, /kind: "little-bakery-first-clear"/);
});
