import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { beachRakeGroovePaths, renderBeachRakeGrooves } from "../src/ui/BeachRakePattern.js";

const root = new URL("../", import.meta.url);
const readText = async (path) => readFile(new URL(path, root), "utf8");

test("keeps Beach Cleanup swipe-first with no visible direction pad", async () => {
  const [markup, styles] = await Promise.all([readText("index.html"), readText("src/style.css")]);
  assert.doesNotMatch(markup, /class="beach-controls"|id="beach-(?:up|down|left|right)"/);
  assert.match(markup, /class="beach-primary-actions"[\s\S]*id="beach-undo" class="hidden"[^>]*>↶ <span>Undo<\/span><\/button>/);
  assert.match(markup, /<details class="beach-menu">[\s\S]*<details class="beach-challenges">/);
  assert.match(styles, /\.beach-cleanup-hud \{[^\n]*grid-template-rows: auto minmax\(0, 1fr\)/);
  assert.match(styles, /\.beach-play-area \{[^\n]*grid-template-columns: minmax\(0, 1fr\) clamp\(92px, 13vw, 168px\)/);
  assert.doesNotMatch(styles, /\.beach-controls/);
  assert.match(styles, /\.beach-board \{[^\n]*touch-action: none/);
  assert.match(styles, /\.beach-cleanup-hud button, \.beach-cleanup-hud summary \{ min-height: var\(--kw-touch-min\)/);
  assert.match(styles, /\.beach-challenges\[open\] > div \{ display: grid; \}/);
});

test("uses short contextual Beach Cleanup actions while preserving optional challenges", async () => {
  const [markup, scene] = await Promise.all([readText("index.html"), readText("src/scenes/BeachCleanupScene.js")]);
  for (const challenge of ["noUndo", "underMoves", "cleanSweep"]) assert.match(markup, new RegExp(`data-beach-challenge="${challenge}"`));
  assert.match(markup, /id="beach-retry" class="hidden"[^>]*>↻ <span>Reset<\/span><\/button>/);
  assert.match(markup, /id="beach-hint"[^>]*>Hint<\/button>/);
  assert.doesNotMatch(markup, /id="beach-raked"|class="beach-heading"|class="beach-secondary-actions"/);
  assert.doesNotMatch(markup, /id="beach-picker"|id="beach-level-select"|id="beach-level-start"/);
  assert.doesNotMatch(markup, /id="beach-result-raked"|id="beach-result-found"|id="beach-result-moves"|id="beach-replay"|id="beach-next"/);
  assert.match(scene, /this\.startLevel\(this\.entryData\.level \|\| this\.beachCleanup\.getCampaignSnapshot\(\)\.nextLevel\)/);
  for (const copy of ["Find every hidden item.", "Swipe to rake the sand.", "Run undone.", "Beach restarted.", "Beach saved.", "Tap Confirm Exit to leave this attempt."]) assert.ok(scene.includes(copy), copy);
  assert.match(scene, /batchId: this\.pointerStart\.runId/);
  assert.match(scene, /querySelector\("\.beach-menu"\)\?\.removeAttribute\("open"\)/);
  assert.match(scene, /buttons\.undo\.classList\.toggle\("hidden", !session\.undoStack\.length\)/);
  assert.match(scene, /buttons\.retry\.classList\.toggle\("hidden", state\.moves === 0\)/);
});

test("keeps the armed Beach Cleanup exit confirmation visible and resets it safely", async () => {
  const scene = await readText("src/scenes/BeachCleanupScene.js");
  assert.match(scene, /this\.onExit = \(\) => \{ const exited = this\.requestExit\(\); if \(exited\) this\.closeMenu\(\); else this\.menu\?\.setAttribute\("open", ""\); return exited; \}/);
  assert.doesNotMatch(scene, /this\.onExit = \(\) => \{ this\.closeMenu\(\); return this\.requestExit\(\); \}/);
  assert.match(scene, /this\.buttons\.exit\.setAttribute\("aria-label", "Confirm exit Beach Cleanup"\)/);
  assert.match(scene, /const armedUntil = this\.exitArmedUntil;[\s\S]*this\.exitArmedUntil !== armedUntil[\s\S]*this\.exitArmedUntil = 0/);
  assert.match(scene, /this\.time\.delayedCall\(3000,[\s\S]*this\.buttons\.exit\.textContent = "Exit";[\s\S]*"Exit Beach Cleanup safely"/);
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
  assert.match(styles, /\.beach-cell\.sand, \.beach-cell\.raked, \.beach-cell\.obstacle \{ background:/);
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

test("rebuilds the Beach Cleanup reference layout from interactive code", async () => {
  const [markup, scene, styles] = await Promise.all([readText("index.html"), readText("src/scenes/BeachCleanupScene.js"), readText("src/style.css")]);
  for (const label of ["KW-BEACH-BOARDWALK-FRAME", "KW-BEACH-SAND-BOARD", "KW-BEACH-SHORE-WATER"]) assert.match(markup, new RegExp(`data-asset-label="${label}"`));
  assert.match(markup, /id="beach-level"/);
  assert.match(markup, /id="beach-balance"/);
  assert.match(markup, /class="beach-side"[\s\S]*id="beach-found"/);
  assert.match(scene, /beachObstacleMarkup/);
  assert.match(scene, /beachPlayerMarkup/);
  assert.match(scene, /KW-BEACH-L-RAKE/);
  assert.match(scene, /\[BEACH_TILE\.sand, BEACH_TILE\.rubbish\]\.includes\(tile\) \? "Unraked sand"/);
  assert.doesNotMatch(scene, /tile === BEACH_TILE\.rubbish && !collected\.has\(key\) \? "·"/);
  assert.match(styles, /\.beach-obstacle\.umbrella/);
  assert.match(styles, /\.beach-obstacle\.chair/);
  assert.match(styles, /\.beach-player-icon/);
  assert.match(styles, /\.beach-rake-tool/);
  assert.match(styles, /\.beach-water/);
  assert.doesNotMatch(scene, /\.load\.image\([^\n]*(?:Pixel Beach Cleanup|Boardwalk and L-shaped Rake)/i);
});
