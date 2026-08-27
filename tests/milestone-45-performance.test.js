import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  SPRITE_AI_DOM_SELECTOR,
  SPRITE_AI_LABEL_ATTRIBUTE,
  SpriteAiInventory,
  describeSpriteAiDomElement,
  spriteAiSlug,
} from "../src/assets/spriteAiLabels.js";
import { LAZY_SCENE_KEYS, LAZY_SCENE_LOADERS } from "../src/scenes/lazyScenes.js";
import { PERFORMANCE_BUDGET } from "../scripts/verify-performance-budget.mjs";

class FakeElement {
  constructor({ tagName = "BUTTON", id = "", text = "", attributes = {} } = {}) {
    this.tagName = tagName;
    this.id = id;
    this.textContent = text;
    this.values = new Map(Object.entries(attributes));
    this.attributes = [...this.values].map(([name, value]) => ({ name, value }));
  }

  getAttribute(name) { return this.values.get(name) || null; }

  setAttribute(name, value) {
    this.values.set(name, String(value));
    this.attributes = [...this.values].map(([attributeName, attributeValue]) => ({ name: attributeName, value: attributeValue }));
  }

  closest() { return null; }
}

test("Milestone 45 gives stable labels to fixed and data-driven controls", () => {
  const fixed = new FakeElement({ id: "economy-inventory-tab", text: "🎒 Inventory" });
  const dynamic = new FakeElement({ text: "Sugar", attributes: { "data-bakery-step": "sugar" } });
  assert.deepEqual(describeSpriteAiDomElement(fixed), {
    id: "ui.button.economy-inventory-tab",
    label: "🎒 Inventory",
    kind: "button",
    source: "dom",
    replacement: "sprite-ai",
  });
  assert.equal(describeSpriteAiDomElement(dynamic).id, "ui.button.bakery-step-sugar");
});

test("Milestone 45 DOM inventory annotates every supplied candidate", () => {
  const inventory = new SpriteAiInventory();
  const button = new FakeElement({ id: "town-placement-confirm", text: "Place" });
  const record = inventory.labelDomElement(button);
  assert.equal(button.getAttribute(SPRITE_AI_LABEL_ATTRIBUTE), "ui.button.town-placement-confirm");
  assert.equal(button.getAttribute("data-sprite-ai-kind"), "button");
  assert.equal(record.label, "Place");
  assert.equal(inventory.snapshot().assetCount, 1);
});

test("Milestone 45 selector covers controls, art, panels and scene surfaces", () => {
  for (const required of ["button", "input", "select", "canvas", "img", "svg", "icon", "portrait", "panel", "hud", "stage", "floor", "fixture"]) {
    assert.match(SPRITE_AI_DOM_SELECTOR, new RegExp(required));
  }
  assert.equal(spriteAiSlug("Paws & Wonders — Habitat"), "paws-and-wonders-habitat");
});

test("Milestone 45 lazy scene catalogue covers every non-town Phaser scene", () => {
  assert.deepEqual(LAZY_SCENE_KEYS, [
    "HouseInteriorScene", "VillageGrocerScene", "PawsWondersScene", "HarbourGeneralScene",
    "BakeryScene", "CafeScene", "MorningMugScene", "RiversideKitchenScene", "SouthShoreScoopsScene",
    "RiverClearoutScene", "HouseRescueScene", "WasteCollectionScene", "LawnCareScene", "BeachCleanupScene",
    "PlaygroundPowerwashScene", "FishingScene",
  ]);
  assert.equal(Object.values(LAZY_SCENE_LOADERS).every((loader) => typeof loader === "function"), true);
});

test("Milestone 45 entry point eagerly registers only Boot and Town", async () => {
  const source = await readFile(new URL("../src/main.js", import.meta.url), "utf8");
  assert.match(source, /scene: \[BootScene, TownScene\]/);
  for (const key of LAZY_SCENE_KEYS) assert.doesNotMatch(source, new RegExp(`import \\{ ${key} \\}`));
});

test("Milestone 45 keeps explicit production performance ceilings", () => {
  assert.equal(PERFORMANCE_BUDGET.minimumLazyChunks, 12);
  assert.ok(PERFORMANCE_BUDGET.initialApplicationBytes <= 3_100_000);
  assert.ok(PERFORMANCE_BUDGET.phaserEngineBytes <= 1_500_000);
  assert.ok(PERFORMANCE_BUDGET.lazySceneBytes <= 80_000);
  assert.ok(PERFORMANCE_BUDGET.totalJavaScriptBytes <= 5_000_000);
});
