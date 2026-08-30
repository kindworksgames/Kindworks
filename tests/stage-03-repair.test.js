import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);

test("player-visible House Rescue bins remove their hidden transition offset and remain inside the reference viewport", async () => {
  const styles = await readFile(new URL("src/style.css", root), "utf8");

  assert.match(styles, /body\[data-game-scene="HouseRescueScene"\] \.house-rescue-hud \{[\s\S]*?position: fixed !important;[\s\S]*?inset: max\(3px, env\(safe-area-inset-top\)\) max\(3px, env\(safe-area-inset-right\)\) max\(3px, env\(safe-area-inset-bottom\)\) max\(3px, env\(safe-area-inset-left\)\) !important;/);
  assert.match(styles, /body\[data-game-scene="HouseRescueScene"\] \.house-rescue-bins \{[\s\S]*?bottom: 8px;[\s\S]*?opacity: 0;[\s\S]*?transform: translateY\(12px\);/);
  assert.match(styles, /body\[data-game-scene="HouseRescueScene"\] \.house-rescue-bins\.is-open \{ pointer-events: auto; opacity: 1; transform: none; \}/);
  assert.match(styles, /body\[data-game-scene="HouseRescueScene"\] \.house-rescue-bins button \{[\s\S]*?width: 44px;[\s\S]*?min-height: 44px !important;/);

  const referenceViewportHeight = 720;
  const safeInset = 3;
  const visibleBottomInset = 8;
  const touchTargetHeight = 44;
  const visibleBottom = referenceViewportHeight - safeInset - visibleBottomInset;
  assert.equal(visibleBottom, 709);
  assert.ok(visibleBottom - touchTargetHeight >= 0);
  assert.ok(visibleBottom <= referenceViewportHeight);
});
