import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const readText = async (path) => readFile(new URL(path, root), "utf8");

test("keeps Fishing and Magnet Fishing controls in a safe landscape side rail", async () => {
  const [markup, styles] = await Promise.all([readText("index.html"), readText("src/style.css")]);
  assert.match(markup, /id="fishing-exit"[^>]*aria-label="Exit Fishing safely"[^>]*>Exit<\/button>/);
  assert.match(markup, /<span>Casts<strong id="fishing-casts">5 \/ 5<\/strong><\/span>/);
  assert.match(markup, /id="fishing-reel" class="hidden"/);
  assert.match(markup, /id="fishing-last-result" class="fishing-last-result hidden"/);
  assert.match(styles, /\.fishing-hud \{[\s\S]*?position: fixed;[\s\S]*?right: max\(16px, env\(safe-area-inset-right\)\);/);
  assert.match(styles, /@media \(max-width: 900px\) and \(orientation: landscape\) \{[\s\S]*?width: clamp\(172px, 23vw, 220px\);/);
  assert.match(styles, /\.fishing-hud-header button \{ min-height: var\(--kw-touch-min, 44px\)/);
  assert.match(styles, /\.fishing-actions \{ display: grid; grid-template-columns: 1fr;/);
  assert.match(styles, /\.fishing-actions button \{ min-height: var\(--kw-touch-min, 44px\)/);
});

test("uses contextual actions, short prompts and a guarded in-progress exit", async () => {
  const scene = await readText("src/scenes/FishingScene.js");
  for (const copy of [
    "Tap water to cast.",
    "Tap water to place the magnet.",
    "Watch for a bite.",
    "Riverbed contact! Pull now.",
    "Bite! Reel now.",
    "Leave this cast? Tap Confirm Exit.",
  ]) assert.ok(scene.includes(copy), copy);
  assert.match(scene, /this\.castButton\.classList\.toggle\("hidden", !\["idle", "success", "miss"\]\.includes\(this\.phase\)\)/);
  assert.match(scene, /this\.reelButton\.classList\.toggle\("hidden", !\["bite", "ready"\]\.includes\(this\.phase\)\)/);
  assert.match(scene, /const castInProgress = \["casting", "bite", "ready", "reeling"\]\.includes\(this\.phase\)/);
  assert.match(scene, /this\.exitButton\.textContent = "Confirm Exit"/);
  assert.match(scene, /landscapeMessage\.textContent = "Turn your device sideways to play\."/);
});

test("does not change protected fishing data or reward formulas", async () => {
  const data = await readText("src/data/fishing.js");
  const service = await readText("src/systems/FishingService.js");
  assert.match(data, /dailyCasts: 5/);
  assert.match(data, /\["sealed-coin-tin", "Sealed Coin Tin", "🪙", "treasure", 3, 350,/);
  assert.match(service, /kind: "magnet-recovery"/);
});
