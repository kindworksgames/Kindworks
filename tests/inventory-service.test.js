import test from "node:test";
import assert from "node:assert/strict";
import { INVENTORY_STACK_LIMIT } from "../src/data/items.js";
import { createFreshInventoryState } from "../src/state/economyState.js";
import { InventoryService } from "../src/systems/InventoryService.js";

test("adds stackable items and removes them without negative quantities", () => {
  const inventory = createFreshInventoryState();
  const service = new InventoryService();
  assert.equal(service.add(inventory, "mixed-seeds", 3).after, 3);
  assert.equal(service.add(inventory, "mixed-seeds", 2).after, 5);
  assert.equal(service.remove(inventory, "mixed-seeds", 4).after, 1);
  assert.equal(service.remove(inventory, "mixed-seeds", 2).code, "insufficient-quantity");
  assert.equal(inventory.consumables["mixed-seeds"], 1);
});

test("rejects unknown, non-inventory, over-capacity, and duplicate unique items", () => {
  const inventory = createFreshInventoryState();
  const service = new InventoryService();
  assert.equal(service.add(inventory, "missing-item").code, "unknown-item");
  assert.equal(service.add(inventory, "pond-goldfish").code, "not-inventory-item");
  assert.equal(service.add(inventory, "mixed-seeds", INVENTORY_STACK_LIMIT + 1).code, "capacity");
  assert.equal(service.add(inventory, "starter-mower").code, "capacity");
  assert.equal(service.remove(inventory, "starter-mower").code, "protected-starter");
});
