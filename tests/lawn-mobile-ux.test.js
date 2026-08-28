import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const readText = async (path) => readFile(new URL(path, root), "utf8");

test("keeps Lawn Care swipe-first and makes the board the full visual surface", async () => {
  const [markup, styles] = await Promise.all([readText("index.html"), readText("src/style.css")]);
  assert.doesNotMatch(markup, /class="lawn-care-controls"|id="lawn-(?:up|down|left|right)"/);
  assert.doesNotMatch(styles, /grid-template-areas: "undo up/);
  assert.match(styles, /Lawn Care board-only composition/);
  assert.match(styles, /LawnCareScene"\] \.lawn-care-hud:not\(\.hidden\)[\s\S]*?width: 100vw !important;[\s\S]*?height: 100dvh !important/);
  assert.match(styles, /LawnCareScene"\] \.lawn-board \{[\s\S]*?width: 100% !important;[\s\S]*?height: 100% !important;[\s\S]*?aspect-ratio: auto !important/);
  assert.match(styles, /LawnCareScene"\] \.lawn-care-actions \{[\s\S]*?bottom: max\(7px, env\(safe-area-inset-bottom\)\) !important/);
  assert.match(styles, /LawnCareScene"\] \.lawn-care-actions button \{[\s\S]*?min-height: 44px !important/);
  assert.match(styles, /LawnCareScene"\] #lawn-care-exit \{[\s\S]*?top: max\(8px, env\(safe-area-inset-top\)\) !important;[\s\S]*?right: max\(8px, env\(safe-area-inset-right\)\) !important/);
});

test("uses short action-led Lawn Care feedback without changing validated game rules", async () => {
  const [markup, scene] = await Promise.all([readText("index.html"), readText("src/scenes/LawnCareScene.js")]);
  assert.match(markup, /id="lawn-care-exit"[^>]*>✕<\/button>/);
  assert.match(markup, /id="lawn-undo"[^>]*aria-label="Undo last mower swipe"[^>]*>↶ Undo<\/button>/);
  assert.match(scene, /textContent = "!"/);
  assert.match(scene, /setAttribute\("aria-label", "Confirm exit Lawn Care"\)/);
  for (const copy of ["Mow this lawn. Your result updates the town.", "Swipe to mow. Cut at least 50%.", "Lawn reset. Progress is safe.", "Result saved.", "Restart to try again."]) assert.match(scene, new RegExp(copy.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.doesNotMatch(scene, /LAWN_TOTAL_LEVELS\s*=/);
  assert.match(scene, /lawnTravelPlan/);
  assert.match(scene, /queuedDirection/);
  assert.match(scene, /Dead end\. Undo or restart this route\./);
});

test("enters the current Lawn Care job directly without a player level screen", async () => {
  const [markup, scene] = await Promise.all([readText("index.html"), readText("src/scenes/LawnCareScene.js")]);
  assert.doesNotMatch(markup, /id="lawn-care-picker"|id="lawn-level-select"|id="lawn-level-start"/);
  assert.doesNotMatch(markup, /MILESTONE 18 · ORIGINAL 750-LEVEL CAMPAIGN|id="lawn-level-name"|id="lawn-next"/);
  assert.match(scene, /if \(!this\.lawnCare\.getActiveSession\(\)\) this\.startLevel\(this\.entryData\.level \|\| this\.lawnCare\.getCampaignSnapshot\(\)\.nextLevel\)/);
  assert.match(markup, /id="lawn-replay" class="hidden"[^>]*>Try again<\/button>/);
  assert.match(markup, /id="lawn-return"[^>]*>Continue<\/button>/);
});

test("shows only Exit, Undo and Hint during active Lawn Care gameplay", async () => {
  const [markup, scene, styles] = await Promise.all([
    readText("index.html"),
    readText("src/scenes/LawnCareScene.js"),
    readText("src/style.css"),
  ]);
  for (const removedId of ["lawn-care-title", "lawn-care-balance", "lawn-level-name", "lawn-level-band", "lawn-progress", "lawn-moves", "lawn-mower", "lawn-retry"]) {
    assert.doesNotMatch(markup, new RegExp(`id="${removedId}"`));
  }
  assert.match(markup, /id="lawn-care-exit"[^>]*>✕<\/button>/);
  assert.match(markup, /class="lawn-care-actions"[\s\S]*id="lawn-undo"[\s\S]*id="lawn-hint"/);
  assert.match(markup, /id="lawn-care-status" class="sr-only"/);
  assert.doesNotMatch(scene, /setText\("#lawn-(?:care-balance|level-name|level-band|progress|moves|mower)"/);
  assert.match(styles, /lawn-care-result:not\(\.hidden\)[\s\S]*?position: absolute !important;[\s\S]*?place-items: center !important/);
});
