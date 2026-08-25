import test from "node:test";
import assert from "node:assert/strict";
import {
  INVENTORY_STACK_LIMIT,
  ITEM_CATALOG,
  ITEM_IDS,
  LEGACY_CATALOGUE_SIZE,
  validateItemCatalog,
} from "../src/data/items.js";

test("extracts all 76 stable legacy item definitions", () => {
  assert.equal(validateItemCatalog().ok, true);
  assert.equal(ITEM_IDS.length, LEGACY_CATALOGUE_SIZE);
  assert.equal(new Set(ITEM_IDS).size, ITEM_IDS.length);
  assert.equal(ITEM_CATALOG["mixed-seeds"].price, 60);
  assert.equal(ITEM_CATALOG["ornamental-fish-tank"].unique, true);
  assert.equal(ITEM_CATALOG["starter-mower"].ownedByDefault, true);
  assert.equal(INVENTORY_STACK_LIMIT, 9999);
});

test("catalogue data is frozen against accidental mutation", () => {
  assert.equal(Object.isFrozen(ITEM_CATALOG), true);
  assert.equal(Object.isFrozen(ITEM_CATALOG["mixed-seeds"]), true);
  assert.throws(() => { ITEM_CATALOG["mixed-seeds"].price = 1; }, TypeError);
});
