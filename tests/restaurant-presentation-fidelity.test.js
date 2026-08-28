import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const readText = async (path) => readFile(new URL(path, root), "utf8");

test("replaces restaurant placeholder rooms with the protected top-down presentation foundation", async () => {
  const presentation = await readText("src/ui/RestaurantPresentation.js");
  for (const label of [
    "CUSTOMERS", "DINING ROOM", "ORDER COUNTER", "PREP BENCH",
    "DRINK COUNTER", "PLATING PASS", "BARISTA KITCHEN", "RESTAURANT KITCHEN",
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
  assert.match(presentation, /function semanticSlot/);
  assert.match(presentation, /label\(scene, 140, 23/);
  for (const slot of ["DINING-TABLE-", "ORDER-TICKET-", "PREP-TRAY-", "KITCHEN-STATION-", "KITCHEN-SINK", "KITCHEN-FRIDGE"]) assert.ok(presentation.includes(slot), slot);
  assert.match(presentation, /if \(orders\[index\]\) pixelPerson/);
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

test("South Shore Scoops uses a code-built seaside service counter instead of the reference bitmap", async () => {
  const [presentation, scene] = await Promise.all([
    readText("src/ui/RestaurantPresentation.js"),
    readText("src/scenes/SouthShoreScoopsScene.js"),
  ]);
  for (const label of ["SOUTH SHORE SCOOPS", "CONTAINERS", "CUPS & DRINKS", "FLAVOURS", "SAUCES & EXTRAS", "CURRENT ORDER", "BUILD MAT", "SERVING TRAY"]) {
    assert.ok(presentation.includes(label), label);
  }
  assert.match(presentation, /function drawScoopsProduct/);
  assert.match(presentation, /fillTriangle/);
  assert.match(presentation, /SCOOP_COLOURS/);
  assert.match(presentation, /KW-SCOOPS-SEASIDE-COUNTER-PROCEDURAL-V2/);
  for (const slot of ["CUSTOMER-WINDOW", "CONTAINER-AREA", "DRINK-AREA", "FLAVOUR-TUBS", "SAUCES-EXTRAS", "ORDER-CARD", "BUILD-MAT", "SERVING-TRAY"]) assert.ok(presentation.includes(slot), slot);
  assert.doesNotMatch(presentation, /South Shore Scoops seaside dessert counter\.png/);
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

test("restaurant reference layouts keep interaction labels and responsive in-world controls", async () => {
  const [markup, styles, cafe, bakery, mug, riverside, scoops] = await Promise.all([
    readText("index.html"), readText("src/style.css"), readText("src/scenes/CafeScene.js"),
    readText("src/scenes/BakeryScene.js"), readText("src/scenes/MorningMugScene.js"),
    readText("src/scenes/RiversideKitchenScene.js"), readText("src/scenes/SouthShoreScoopsScene.js"),
  ]);
  for (const id of ["cafe-live-stars", "bakery-live-stars", "morning-mug-live-stars", "riverside-kitchen-live-stars", "south-shore-scoops-live-stars"]) assert.ok(markup.includes(id), id);
  for (const [source, label] of [[cafe, "KW-CAFE-STEP-"], [bakery, "KW-BAKERY-STEP-"], [mug, "KW-MUG-STEP-"], [riverside, "KW-RIVERSIDE-STEP-"], [scoops, "KW-SCOOPS-PART-"]]) assert.ok(source.includes(label), label);
  assert.match(styles, /Restaurant reference-layout fidelity recovery/);
  assert.match(styles, /Final cascade guard/);
  assert.match(styles, /grid-template-columns: repeat\(4, minmax\(42px, 1fr\)\) !important/);
  assert.match(styles, /grid-template-columns: repeat\(6, minmax\(42px, 1fr\)\) !important/);
  assert.match(styles, /top: 49% !important;[\s\S]*?right: 24% !important;[\s\S]*?bottom: 17% !important/);
});

test("restaurant visual polish keeps the illustrated fixtures as the interaction surface", async () => {
  const [styles, presentation] = await Promise.all([
    readText("src/style.css"),
    readText("src/ui/RestaurantPresentation.js"),
  ]);
  assert.match(styles, /Shared restaurant presentation polish/);
  assert.match(styles, /background: transparent !important;[\s\S]*?text-shadow: 0 1px #fffaf0 !important/);
  assert.match(styles, /Final restaurant header placement guard/);
  assert.match(styles, /left: clamp\(190px, 22vw, 282px\) !important/);
  assert.match(styles, /South Shore Scoops reference-composition pass/);
  assert.doesNotMatch(styles, /On phones narrower than 701px the existing compact rail/);
  for (const fixture of ["MENU-BOARD", "HANGING-ANCHOR-SIGN", "MILKSHAKE-MACHINE", "LEMONADE-MACHINE", "SERVE-BUTTON"]) {
    assert.ok(presentation.includes(`"${fixture}"`), fixture);
  }
  assert.match(presentation, /semanticSlot\(scene, `KW-SCOOPS-\$\{id\}`/);
});

test("active restaurant shifts are full-screen without served, time or cream edge bars", async () => {
  const styles = await readText("src/style.css");
  assert.match(styles, /Restaurant full-screen presentation/);
  assert.ok(styles.lastIndexOf("Restaurant full-screen presentation — final cascade guard") > styles.lastIndexOf("Final restaurant header placement guard"));
  assert.match(styles, /Served\/time remain[\s\S]*?no longer persistent visual furniture/);
  assert.match(styles, /bakery-shift-heading,[\s\S]*?cafe-shift-heading,[\s\S]*?scoops-shift-heading \{[\s\S]*?display: none !important;/);
  assert.match(styles, /bakery-hud-header, \.cafe-hud-header\) \{[\s\S]*?background: transparent !important;[\s\S]*?box-shadow: none !important;/);
  assert.match(styles, /scoops-status \{[\s\S]*?width: fit-content !important;[\s\S]*?background: rgb\(41 34 56 \/ 82%\) !important;/);
});
