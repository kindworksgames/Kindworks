import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const readText = async (path) => readFile(new URL(path, root), "utf8");

test("keeps the Lawn Care board, feedback and finger-sized controls in the short landscape shell", async () => {
  const styles = await readText("src/style.css");
  assert.match(styles, /\.lawn-care-hud \{[\s\S]*grid-template-rows: auto minmax\(0, 1fr\) auto/);
  assert.match(styles, /\.lawn-board \{ width: auto; height: 100%; max-width: 100%; max-height: 100%; \}/);
  assert.match(styles, /\.lawn-care-side button, \.lawn-care-controls button \{ min-height: var\(--kw-touch-min\); \}/);
  assert.match(styles, /grid-template-areas: "undo up \." "left down right"/);
  assert.match(styles, /\.lawn-board-viewport \{ min-height: 0; padding: 3px 3px 3px 144px; \}/);
  assert.match(styles, /\.lawn-care-status \{ min-height: 30px; max-height: 30px/);
});

test("uses short action-led Lawn Care feedback without changing validated game rules", async () => {
  const [markup, scene] = await Promise.all([readText("index.html"), readText("src/scenes/LawnCareScene.js")]);
  assert.match(markup, /id="lawn-care-exit"[^>]*>Exit<\/button>/);
  assert.match(markup, /id="lawn-undo"[^>]*aria-label="Undo last mower move"[^>]*>↶<\/button>/);
  for (const copy of ["Mow this lawn. Your result updates the town.", "Swipe to mow. Cut at least 50%.", "Lawn reset. Progress is safe.", "Result saved.", "Restart to try again."]) assert.match(scene, new RegExp(copy.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.doesNotMatch(scene, /LAWN_TOTAL_LEVELS\s*=/);
  assert.match(scene, /lawnTravelPlan/);
  assert.match(scene, /queuedDirection/);
  assert.match(scene, /Dead end\. Undo or restart this route\./);
});
