import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const readText = async (path) => readFile(new URL(path, root), "utf8");

test("Wave 7 keeps every shared Town and home action at the 44-pixel touch minimum", async () => {
  const styles = await readText("src/style.css");
  for (const selector of [
    ".interaction-prompt button",
    ".grocer-hud button",
    ".paws-hud button",
    ".harbour-hud button",
    ".home-interior-header button",
    ".home-interior-actions button",
    ".home-furniture-placement button",
    ".shop-panel-close",
    ".shop-group-tabs button",
    ".shop-buy-button",
    ".shop-place-button",
    ".inventory-item-action button",
  ]) assert.match(styles, new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(styles, /min-height:\s*var\(--kw-touch-min, 44px\)/);
});

test("Wave 7 fits the complete Level 1 Cafe and Kitchen worktops on the smallest phone", async () => {
  const styles = await readText("src/style.css");
  assert.match(styles, /max-width:\s*620px[\s\S]*#cafe-hud\[data-cafe-view="shift"\][\s\S]*flex-basis:\s*54px/);
  assert.match(styles, /max-width:\s*620px[\s\S]*#riverside-kitchen-hud\[data-riverside-kitchen-view="shift"\][\s\S]*flex-basis:\s*62px/);
});

test("Wave 7 clips the dormant landscape shell safely behind the rotate-device state", async () => {
  const styles = await readText("src/style.css");
  const bodyStart = styles.indexOf("\nbody {");
  const shellStart = styles.indexOf("\n.game-shell {", bodyStart);
  const shell = styles.slice(shellStart, styles.indexOf("\n}", shellStart));
  assert.match(shell, /box-sizing:\s*border-box/);
  assert.match(shell, /max-width:\s*100vw/);
  assert.match(shell, /max-height:\s*100dvh/);
  assert.match(shell, /overflow:\s*hidden/);
});

test("Wave 7 removes the superseded camera-only onboarding helper", async () => {
  const town = await readText("src/scenes/TownScene.js");
  assert.doesNotMatch(town, /focusOnboardingJob\s*\(/);
  assert.match(town, /startOnboardingJob\s*\(/);
});
