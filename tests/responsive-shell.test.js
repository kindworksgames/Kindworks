import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  LANDSCAPE_MESSAGE,
  PORTRAIT_SUPPORTED_SCENES,
  ResponsiveShellController,
  shouldPauseForPortrait,
} from "../src/ui/ResponsiveShellController.js";

const root = new URL("../", import.meta.url);
const readText = async (path) => readFile(new URL(path, root), "utf8");

test("pauses every gameplay scene in portrait except River Clear-Out", () => {
  assert.equal(shouldPauseForPortrait({ width: 390, height: 844, sceneKey: "TownScene" }), true);
  assert.equal(shouldPauseForPortrait({ width: 390, height: 844, sceneKey: "BakeryScene" }), true);
  assert.equal(shouldPauseForPortrait({ width: 390, height: 844, sceneKey: "RiverClearoutScene" }), false);
  assert.deepEqual([...PORTRAIT_SUPPORTED_SCENES], ["RiverClearoutScene"]);
});

test("keeps all certified landscape viewports playable", () => {
  for (const [width, height] of [[568, 320], [667, 375], [736, 414], [812, 375], [844, 390], [1024, 768], [1180, 820], [1280, 720], [1366, 768]]) {
    assert.equal(shouldPauseForPortrait({ width, height, sceneKey: "TownScene" }), false, `${width}x${height}`);
  }
  assert.equal(shouldPauseForPortrait({ width: 720, height: 720, sceneKey: "TownScene" }), false);
  assert.equal(shouldPauseForPortrait({ width: 390, height: 844, sceneKey: "BootScene" }), false);
});

test("ships one short rotate message and wires the global safe shell", async () => {
  const [markup, styles, main] = await Promise.all([readText("index.html"), readText("src/style.css"), readText("src/main.js")]);
  assert.equal(LANDSCAPE_MESSAGE, "Turn your device sideways to play.");
  assert.match(markup, /<p id="landscape-required-message">Turn your device sideways to play\.<\/p>/);
  assert.doesNotMatch(markup, /landscape-required-title/);
  assert.ok(styles.includes('body[data-orientation-blocked="true"] .landscape-required'));
  assert.match(main, /new ResponsiveShellController\(game/);
  assert.match(main, /game\.registry\.set\("responsiveShell", responsiveShell\)/);
});

test("freezes and wakes the live game plus all world systems without duplicating transitions", () => {
  const calls = [];
  const windowObject = new EventTarget();
  windowObject.innerWidth = 390;
  windowObject.innerHeight = 844;
  const message = { textContent: "old copy" };
  const documentObject = {
    documentElement: { clientWidth: 390, clientHeight: 844 },
    activeElement: { blur: () => calls.push("blur") },
    body: { dataset: { gameScene: "TownScene" } },
    querySelector: (selector) => selector === "#landscape-required-message" ? message : null,
  };
  const game = {
    loop: { sleep: () => calls.push("sleep"), wake: () => calls.push("wake") },
    scale: { refresh: () => calls.push("refresh") },
    scene: { getScenes: () => [] },
  };
  const service = (name) => ({ setPaused: (reason, paused) => calls.push(`${name}:${reason}:${paused}`) });
  const controller = new ResponsiveShellController(game, {
    windowObject,
    documentObject,
    worldSimulation: service("world"),
    npcTownLife: service("npc"),
    municipalCollection: service("collection"),
  });

  controller.start();
  controller.update();
  assert.equal(documentObject.body.dataset.orientationBlocked, "true");
  assert.equal(message.textContent, LANDSCAPE_MESSAGE);
  assert.equal(calls.filter((call) => call === "sleep").length, 1);

  windowObject.innerWidth = 844;
  windowObject.innerHeight = 390;
  controller.update();
  assert.equal(documentObject.body.dataset.orientationBlocked, "false");
  assert.equal(calls.filter((call) => call === "wake").length, 1);
  assert.equal(calls.filter((call) => call === "refresh").length, 1);
  assert.ok(calls.includes("world:orientation:true"));
  assert.ok(calls.includes("world:orientation:false"));
  assert.ok(calls.includes("npc:orientation:true"));
  assert.ok(calls.includes("collection:orientation:false"));
  controller.destroy();
});
