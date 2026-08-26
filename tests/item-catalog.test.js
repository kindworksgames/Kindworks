import test from "node:test";
import assert from "node:assert/strict";
import {
  INVENTORY_STACK_LIMIT,
  CATALOGUE_SIZE,
  ITEM_CATALOG,
  ITEM_IDS,
  LEGACY_CATALOGUE_SIZE,
  validateItemCatalog,
} from "../src/data/items.js";

test("preserves all 76 legacy items and adds the six farming inventory items", () => {
  assert.equal(validateItemCatalog().ok, true);
  assert.equal(LEGACY_CATALOGUE_SIZE, 76);
  assert.equal(ITEM_IDS.length, CATALOGUE_SIZE);
  assert.equal(CATALOGUE_SIZE, 82);
  assert.equal(new Set(ITEM_IDS).size, ITEM_IDS.length);
  assert.equal(ITEM_CATALOG["mixed-seeds"].price, 60);
  assert.equal(ITEM_CATALOG["ornamental-fish-tank"].unique, true);
  assert.equal(ITEM_CATALOG["starter-mower"].ownedByDefault, true);
  assert.equal(ITEM_CATALOG["carrot-seeds"].price, 30);
  assert.equal(ITEM_CATALOG["orchard-apple"].farmingOnly, true);
  assert.equal(ITEM_CATALOG["orchard-apple-sapling"].price, 2800);
  assert.equal(INVENTORY_STACK_LIMIT, 9999);
});

test("catalogue data is frozen against accidental mutation", () => {
  assert.equal(Object.isFrozen(ITEM_CATALOG), true);
  assert.equal(Object.isFrozen(ITEM_CATALOG["mixed-seeds"]), true);
  assert.throws(() => { ITEM_CATALOG["mixed-seeds"].price = 1; }, TypeError);
});
