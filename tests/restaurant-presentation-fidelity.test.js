import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const readText = async (path) => readFile(new URL(path, root), "utf8");

test("replaces restaurant placeholder rooms with the protected top-down presentation foundation", async () => {
  const presentation = await readText("src/ui/RestaurantPresentation.js");
  for (const label of [
    "CUSTOMER QUEUE", "DINING ROOM", "ORDER COUNTER · THREE TICKETS",
    "BAKERY BENCH · THREE PREP SPACES", "DRINK COUNTER · THREE TRAYS",
    "PLATING PASS · THREE TRAYS", "BARISTA STATIONS", "RESTAURANT KITCHEN",
  ]) assert.ok(presentation.includes(label), label);
  assert.match(presentation, /\[\[205, 215\], \[430, 215\], \[205, 405\], \[430, 405\], \[205, 585\], \[430, 585\]\]/);
  assert.match(presentation, /function pixelPerson/);
  assert.match(presentation, /function tableSet/);
  assert.match(presentation, /function appliance/);
  assert.match(presentation, /function ticket/);
  assert.match(presentation, /function tray/);
  assert.match(presentation, /function assetLabel/);
  for (const family of ["ROOM-PROCEDURAL-V1", "WORKER-PIXEL", "CUSTOMER-GROUP", "WORKER-PAYLOAD"]) assert.ok(presentation.includes(family), family);
  assert.match(presentation, /snapshot\.appliances/);
  assert.match(presentation, /APPLIANCE-\$\{String\(appliance\.id\)/);
});

test("all four indoor venues render individual customers, orders, trays and worker state", async () => {
  const scenes = [
    ["src/scenes/BakeryScene.js", "bakery"],
    ["src/scenes/CafeScene.js", "cafe"],
    ["src/scenes/MorningMugScene.js", "mug"],
    ["src/scenes/RiversideKitchenScene.js", "riverside"],
  ];
  for (const [path, venue] of scenes) {
    const scene = await readText(path);
    assert.ok(scene.includes(`createRestaurantPresentation(this, "${venue}")`), path);
    assert.match(scene, /updateRestaurantPresentation\(this, \{/);
    assert.match(scene, /orders: session\.activeOrderIds\.map/);
    assert.match(scene, /trays: session\.trays\.map/);
    assert.match(scene, /workerState:/);
    assert.match(scene, /expectedIcon:/);
    assert.doesNotMatch(scene, /🧑\s+×|🧑‍🍳💨|① ② ③/);
  }
});

test("South Shore Scoops restores a composed picture counter instead of token-only art", async () => {
  const [presentation, scene] = await Promise.all([
    readText("src/ui/RestaurantPresentation.js"),
    readText("src/scenes/SouthShoreScoopsScene.js"),
  ]);
  for (const label of ["1 · CONTAINERS", "2 · FLAVOURS", "3 · FINISHES", "4 · EXTRAS", "BUILD BOARD", "SELECTED ORDER"]) {
    assert.ok(presentation.includes(label), label);
  }
  assert.match(presentation, /function drawScoopsProduct/);
  assert.match(presentation, /fillTriangle/);
  assert.match(presentation, /SCOOP_COLOURS/);
  assert.match(presentation, /KW-SCOOPS-COUNTER-PROCEDURAL-V1/);
  assert.match(presentation, /KW-SCOOPS-BUILD-TRAY-SELECTED-PRODUCTS/);
  assert.match(presentation, /export function animateScoopsDeparture/);
  assert.match(presentation, /duration: 280/);
  assert.match(scene, /createScoopsPresentation\(this\)/);
  assert.match(scene, /buildParts: work\.build/);
  assert.match(scene, /trayItems: work\.tray/);
  assert.match(scene, /selectedParts: expectedItem\?\.parts/);
});

test("active restaurant HUDs use compact rails so the Phaser room stays visible", async () => {
  const styles = await readText("src/style.css");
  assert.match(styles, /Phase 3 — protected-HTML restaurant presentation recovery/);
  for (const scene of ["BakeryScene", "CafeScene", "MorningMugScene", "RiversideKitchenScene", "SouthShoreScoopsScene"]) {
    assert.ok(styles.includes(`body[data-game-scene="${scene}"]`), scene);
  }
  assert.match(styles, /pointer-events: none;[\s\S]*?background: transparent;[\s\S]*?box-shadow: none;/);
  assert.match(styles, /bottom: 48px;[\s\S]*?height: 62px;/);
  assert.match(styles, /min-height: 44px;[\s\S]*?max-height: 44px;/);
});
