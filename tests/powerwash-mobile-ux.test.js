import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const readText = async (path) => readFile(new URL(path, root), "utf8");

test("uses the protected Power Washing artwork as the full-screen interface", async () => {
  const [markup, styles, renderer] = await Promise.all([readText("index.html"), readText("src/style.css"), readText("src/rendering/LegacyPowerwashRenderer.js")]);
  assert.match(markup, /id="powerwash-board" class="powerwash-board"[^>]*width="1536" height="1024"/);
  assert.match(styles, /\.powerwash-hud \{ position: fixed;[^\n]*inset: 0;[^\n]*background: #07142b/);
  assert.match(styles, /\.powerwash-board-frame \{[^\n]*width: min\(100vw, 150dvh\);[^\n]*aspect-ratio: 3 \/ 2/);
  assert.match(styles, /\.powerwash-board \{ position: absolute; inset: 0; display: block; width: 100%; height: 100%/);
  assert.match(renderer, /this\.drawIntegratedTools\(context, state\);\s*this\.drawNozzle\(context, active, state\);/);
  assert.match(renderer, /POWERWASH_INTEGRATED_TOOL_RECTS/);
});

test("opens the current Power Washing job directly without player-facing campaign diagnostics", async () => {
  const [markup, scene] = await Promise.all([readText("index.html"), readText("src/scenes/PlaygroundPowerwashScene.js")]);
  for (const removed of ["powerwash-picker", "powerwash-level-select", "powerwash-level-start", "powerwash-replay", "powerwash-next", "powerwash-result-tolerance", "powerwash-result-strokes", "powerwash-reward", "powerwash-clean", "powerwash-water", "powerwash-soap", "powerwash-balance", "powerwash-level-name"]) assert.doesNotMatch(markup, new RegExp(`id="${removed}"`), removed);
  for (const removedCopy of ["MILESTONE 20", "ORIGINAL 750-LEVEL CAMPAIGN", "Restore 750 playgrounds", "rinse strength", "Next playground"]) assert.ok(!markup.includes(removedCopy), removedCopy);
  assert.match(scene, /else this\.startLevel\(this\.entryData\.requestedLevel \|\| this\.entryData\.level \|\| this\.powerwash\.getCampaignSnapshot\(\)\.nextLevel\)/);
  assert.match(markup, /id="powerwash-return" type="button">Continue<\/button>/);
});

test("keeps all four protected modes as image-aligned buttons instead of a side rail", async () => {
  const [markup, styles, scene, renderer, manifest] = await Promise.all([readText("index.html"), readText("src/style.css"), readText("src/scenes/PlaygroundPowerwashScene.js"), readText("src/rendering/LegacyPowerwashRenderer.js"), readText("public/assets/powerwash/manifest.json")]);
  for (const [id, label] of [["powerwash-soap-tool", "Use soap"], ["powerwash-precision", "Use precision nozzle"], ["powerwash-standard", "Use standard nozzle"], ["powerwash-wide", "Use wide nozzle"]]) assert.match(markup, new RegExp(`id="${id}"[^>]*aria-label="${label}"`), id);
  assert.match(markup, /id="powerwash-retry" class="powerwash-integrated-retry hidden"[^>]*>↻<\/button>/);
  assert.match(styles, /\.powerwash-integrated-tool \{ position: absolute;[^\n]*opacity: 0;[^\n]*pointer-events: auto/);
  assert.doesNotMatch(markup, /class="powerwash-side"/);
  for (const tool of ["precision", "standard", "wide"]) assert.ok(manifest.includes(`tool-${tool}.png`), tool);
  assert.match(renderer, /this\.toolArtwork\[nozzle\]/);
  for (const copy of ["Wash at least 97% clean.", "Drag to wash. Soap dark stains first.", "Playground restarted.", "Playground saved.", "Tap Confirm Exit to leave this attempt."]) assert.ok(scene.includes(copy), copy);
  assert.match(scene, /buttons\.retry\.classList\.toggle\("hidden", state\.strokes === 0\)/);
  assert.doesNotMatch(scene, /key === this\.lastSprayCell/);
  assert.match(scene, /this\.powerwash\.sprayPath\(session\.id, from, cell, elapsedMs, \{ autoComplete: false, visualSegment:/);
  assert.match(scene, /LegacyPowerwashRenderer/);
  assert.match(scene, /this\.powerwash\.completeVisual\(session\.id, visualPercent\)/);
  assert.match(scene, /this\.powerwash\.recoverSupplies\(session\.id, elapsed\)/);
});
