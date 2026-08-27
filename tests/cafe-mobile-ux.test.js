import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const readText = async (path) => readFile(new URL(path, root), "utf8");

test("keeps the Corner Café queue, workbench and feedback inside short landscape phones", async () => {
  const [markup, styles] = await Promise.all([readText("index.html"), readText("src/style.css")]);
  assert.match(markup, /id="cafe-exit"[^>]*aria-label="Exit Corner Café safely"[^>]*>Exit<\/button>/);
  assert.match(markup, /class="cafe-worktop"/);
  assert.match(styles, /#cafe-hud button, #cafe-hud select \{ min-height: var\(--kw-touch-min, 44px\)/);
  assert.match(styles, /#cafe-hud\[data-cafe-view="shift"\] \{[\s\S]*?position: fixed;[\s\S]*?pointer-events: none;[\s\S]*?background: transparent;/);
  assert.match(styles, /#cafe-hud\[data-cafe-view="shift"\] \.cafe-orders \{ display: none; \}/);
  assert.match(styles, /#cafe-hud\[data-cafe-view="shift"\] \.cafe-step-list \{[\s\S]*?display: flex;[\s\S]*?overflow-x: auto;/);
  assert.match(styles, /#cafe-hud\[data-cafe-view="shift"\] \.cafe-status \{[\s\S]*?min-height: 44px;[\s\S]*?max-height: 44px;/);
});

test("uses one compact Café tray summary and only contextual preparation actions", async () => {
  const scene = await readText("src/scenes/CafeScene.js");
  for (const copy of [
    "Choose a café shift.",
    "Choose a tray. Follow the highlight.",
    "Tray cleared. Start again.",
    "Leave this shift? Tap Confirm Exit.",
    "Turn your device sideways to play.",
  ]) assert.ok(scene.includes(copy), copy);
  assert.match(scene, /\$\{item\.icon\} \$\{item\.name\} · \$\{patience\}%/);
  assert.match(scene, /this\.undoButton\.classList\.toggle\("hidden", !canRevise \|\| tray\.stepIndex < 1\)/);
  assert.match(scene, /this\.discardButton\.classList\.toggle\("hidden", !canRevise\)/);
  assert.match(scene, /this\.serveButton\.classList\.toggle\("hidden", !canServe\)/);
  assert.match(scene, /this\.nextButton\.classList\.toggle\("hidden", !result\.won\)/);
});

test("retains the protected 150-shift Café campaign and first-clear reward engine", async () => {
  const [data, service] = await Promise.all([readText("src/data/cafe.js"), readText("src/systems/CafeService.js")]);
  assert.match(data, /levelCount:\s*150/);
  assert.match(service, /firstClear/);
  assert.match(service, /kind: "corner-cafe-first-clear"/);
});
