import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { beachRakeGroovePaths, renderBeachRakeGrooves } from "../src/ui/BeachRakePattern.js";

const root = new URL("../", import.meta.url);
const readText = async (path) => readFile(new URL(path, root), "utf8");

test("keeps Beach Cleanup swipe-first with no visible direction pad", async () => {
  const [markup, styles] = await Promise.all([readText("index.html"), readText("src/style.css")]);
  assert.doesNotMatch(markup, /class="beach-controls"|id="beach-(?:up|down|left|right)"/);
  assert.match(markup, /class="beach-secondary-actions"[\s\S]*id="beach-undo" class="hidden"[^>]*>↶ Undo<\/button>/);
  assert.match(markup, /class="beach-secondary-actions"[\s\S]*<details class="beach-challenges">/);
  assert.match(styles, /\.beach-cleanup-hud \{[^\n]*grid-template-rows: auto minmax\(0, 1fr\) auto/);
  assert.match(styles, /\.beach-play-area \{ grid-template-columns: minmax\(0, 1fr\) 148px/);
  assert.doesNotMatch(styles, /\.beach-controls/);
  assert.match(styles, /\.beach-board \{[^\n]*touch-action: none/);
  assert.match(styles, /\.beach-cleanup-hud button, \.beach-cleanup-hud select, \.beach-challenges summary \{ min-height: var\(--kw-touch-min\)/);
  assert.match(styles, /\.beach-challenges\[open\] > div \{ display: grid; \}/);
});

test("uses short contextual Beach Cleanup actions while preserving optional challenges", async () => {
  const [markup, scene] = await Promise.all([readText("index.html"), readText("src/scenes/BeachCleanupScene.js")]);
  for (const challenge of ["noUndo", "underMoves", "cleanSweep"]) assert.match(markup, new RegExp(`data-beach-challenge="${challenge}"`));
  assert.match(markup, /id="beach-retry" class="hidden"[^>]*>Restart<\/button>/);
  assert.match(markup, /id="beach-hint"[^>]*>Hint<\/button>/);
  for (const copy of ["Rake the beach and find every item.", "Rake every tile. Find every item.", "Item found!", "Run undone.", "Beach restarted.", "Beach saved.", "Tap Confirm Exit to leave this attempt."]) assert.ok(scene.includes(copy), copy);
  assert.match(scene, /batchId: this\.pointerStart\.runId/);
  assert.match(scene, /buttons\.undo\.classList\.toggle\("hidden", !session\.undoStack\.length\)/);
  assert.match(scene, /buttons\.retry\.classList\.toggle\("hidden", state\.moves === 0\)/);
});

test("renders the protected five-groove rake paths instead of a generic stripe fill", async () => {
  const [scene, renderer, styles] = await Promise.all([readText("src/scenes/BeachCleanupScene.js"), readText("src/ui/BeachRakePattern.js"), readText("src/style.css")]);
  assert.match(scene, /renderBeachRakeGrooves\(state\.rakePatterns\[key\] \|\| "h"\)/);
  assert.match(scene, /data-rake-pattern=/);
  assert.match(renderer, /\["h", "v"\]\.includes\(pattern\)/);
  assert.match(renderer, /pattern === "nw"/);
  assert.match(renderer, /pattern === "ne"/);
  assert.match(renderer, /pattern === "sw"/);
  assert.match(renderer, /class="beach-rake-grooves rake-\$\{pattern\}"/);
  assert.match(styles, /\.beach-cell\.sand, \.beach-cell\.raked \{ background: linear-gradient/);
  assert.match(styles, /\.beach-rake-grooves path\.soft/);
  assert.doesNotMatch(styles, /\.beach-cell\.raked \{ background: repeating-linear-gradient/);
  for (const pattern of ["h", "v", "ne", "nw", "se", "sw"]) {
    const paths = beachRakeGroovePaths(pattern);
    assert.equal(paths.length, 5);
    assert.equal(paths.filter(({ tone }) => tone === "main").length, 3);
    assert.equal(paths.filter(({ tone }) => tone === "soft").length, 2);
    assert.match(renderBeachRakeGrooves(pattern), new RegExp(`rake-${pattern}`));
  }
  assert.deepEqual(beachRakeGroovePaths("invalid"), []);
});
