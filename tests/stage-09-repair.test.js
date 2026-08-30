import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { runHouseRescueQaCompletion } from "../src/qa/houseRescueQaCompletion.js";

const root = new URL("../", import.meta.url);
const readText = async (path) => readFile(new URL(path, root), "utf8");

test("Stage 9 constrains Animal Friends desktop columns into real scrollports", async () => {
  const styles = await readText("src/style.css");
  assert.match(styles, /\.animal-friends-card \{[\s\S]*?display: grid;[\s\S]*?grid-template-rows: auto minmax\(0, 1fr\) auto;[\s\S]*?height: min\(690px, calc\(100dvh - clamp\(24px, 6vw, 68px\)\)\);/);
  assert.match(styles, /\.animal-friends-layout \{[^\n]*min-height: 0;[^\n]*overflow: hidden;/);
  assert.match(styles, /\.animal-friends-list \{[^\n]*min-height: 0;[^\n]*overflow: auto;/);
  assert.match(styles, /\.animal-detail \{[^\n]*min-height: 0;[^\n]*overflow: auto;/);
  assert.match(styles, /@media \(max-width: 720px\)[\s\S]*?\.animal-friends-card \{[^\n]*display: block;[^\n]*height: auto;[^\n]*max-height: 91dvh;/);
});

test("Stage 9 preserves the 44-pixel effective minimum for shop exits", async () => {
  const [styles, shopStyles] = await Promise.all([readText("src/style.css"), readText("src/shop-reference.css")]);
  assert.match(styles, /\.harbour-hud #harbour-exit \{[\s\S]*?width: clamp\(var\(--kw-touch-min, 44px\), 7dvh, 60px\);/);
  assert.match(shopStyles, /data-shop-id="fresh-market"\] \.shop-panel-close \{[\s\S]*?width: clamp\(var\(--kw-touch-min, 44px\), 6\.5dvh, 66px\);[\s\S]*?height: clamp\(var\(--kw-touch-min, 44px\), 6\.5dvh, 66px\);/);
  assert.match(shopStyles, /data-shop-id="town-grocer"\] \.shop-panel-close \{[\s\S]*?width: clamp\(var\(--kw-touch-min, 44px\), 6\.5dvh, 64px\);[\s\S]*?height: clamp\(var\(--kw-touch-min, 44px\), 6\.5dvh, 64px\);/);
});

test("Stage 9 fails House Rescue certified completion closed before service mutation", async () => {
  const scene = await readText("src/scenes/HouseRescueScene.js");
  assert.match(scene, /runHouseRescueQaCompletion\(\{[\s\S]*?qaMode: this\.qaMode,[\s\S]*?houseRescue: this\.houseRescue/);

  let serviceCalls = 0;
  let resultCalls = 0;
  const messages = [];
  const completed = runHouseRescueQaCompletion({
    qaMode: false,
    houseRescue: { qaComplete: () => { serviceCalls += 1; return { ok: true, result: {} }; } },
    setMessage: (...args) => messages.push(args),
    showResult: () => { resultCalls += 1; },
  });
  assert.equal(completed, false);
  assert.equal(serviceCalls, 0);
  assert.equal(resultCalls, 0);
  assert.deepEqual(messages, [["Certified QA completion is unavailable.", "error"]]);
});

test("Stage 9 retains House Rescue completion in explicit QA mode", () => {
  const result = { coins: 10 };
  let shown = null;
  const completed = runHouseRescueQaCompletion({
    qaMode: true,
    houseRescue: { qaComplete: () => ({ ok: true, result }) },
    setMessage: () => {},
    showResult: (value) => { shown = value; },
  });
  assert.equal(completed, true);
  assert.equal(shown, result);
});

test("Stage 9 keeps Town steady-state work domain-scoped and cadence-bound", async () => {
  const [town, gameState, npcLife, animalService] = await Promise.all([
    readText("src/scenes/TownScene.js"),
    readText("src/state/GameState.js"),
    readText("src/systems/NpcTownLifeService.js"),
    readText("src/systems/AnimalService.js"),
  ]);

  assert.match(gameState, /getDomainSnapshot\(domain\)/);
  assert.match(gameState, /getDomainsSnapshot\(\.\.\.domains\)/);
  assert.match(town, /this\.cachedWorldSnapshot = this\.gameState\?\.getDomainSnapshot\("world"\) \|\| this\.cachedWorldSnapshot;/);
  assert.match(town, /const currentWorld = this\.cachedWorldSnapshot;/);
  assert.doesNotMatch(town, /update\(_time, delta\)[\s\S]*?const currentWorld = this\.gameState\?\.getDomainSnapshot\("world"\);/);
  assert.match(town, /if \(this\.stateSyncElapsed >= 250\) \{[\s\S]*?refreshPublicBins\?\.\(\);[\s\S]*?renderNpcPublicBins\(\);/);
  assert.match(npcLife, /getPresentationResidents\(\)/);
  assert.match(animalService, /getDomainsSnapshot\("animals", "world", "environment", "townPlacement"\)/);
});

test("Stage 9 caches the expensive Town woodland without moving it", async () => {
  const town = await readText("src/scenes/TownScene.js");
  assert.match(town, /const useCachedWoodland = window\.innerWidth > 600;/);
  assert.match(town, /generateTexture\(textureKey, Math\.ceil\(px\(textureWidth\)\), Math\.ceil\(px\(textureHeight\)\)\)/);
  assert.match(town, /\.setOrigin\(groundX \/ textureWidth, groundY \/ textureHeight\)[\s\S]*?\.setScale\(scale \/ textureRenderScale\)[\s\S]*?\.setDepth\(16\)/);
  assert.match(town, /if \(!useCachedWoodland\) \{[\s\S]*?const forest = this\.add\.graphics\(\)\.setDepth\(16\);/);
  assert.match(town, /captureStaticTownVisibilityIndex\(\)/);
  assert.match(town, /const view = camera\.worldView;[\s\S]*?entry\.object\.visible = entry\.right >= left/);
});
