import { ITEM_CATALOG, inventoryBucketFor, inventoryLimitFor } from "../data/items.js";

function positiveQuantity(value) {
  const quantity = Number(value);
  return Number.isSafeInteger(quantity) && quantity > 0 ? quantity : null;
}

export class InventoryService {
  constructor(catalog = ITEM_CATALOG) {
    this.catalog = catalog;
  }

  quantity(inventory, itemId) {
    const item = this.catalog[itemId];
    const bucket = inventoryBucketFor(item);
    return bucket ? Number(inventory?.[bucket]?.[itemId]) || 0 : 0;
  }

  add(inventory, itemId, requestedQuantity = 1) {
    const item = this.catalog[itemId];
    if (!item) return { ok: false, code: "unknown-item", message: `Unknown item: ${itemId}` };
    const bucket = inventoryBucketFor(item);
    if (!bucket) return { ok: false, code: "not-inventory-item", message: `${item.name} is stored outside the player inventory.` };
    const quantity = positiveQuantity(requestedQuantity);
    if (!quantity) return { ok: false, code: "invalid-quantity", message: "Quantity must be a positive whole number." };
    const before = this.quantity(inventory, itemId);
    const limit = inventoryLimitFor(item);
    if (before + quantity > limit) return { ok: false, code: "capacity", message: `${item.name} is at its inventory limit.`, before, limit };
    inventory[bucket][itemId] = before + quantity;
    return { ok: true, code: "added", itemId, bucket, quantity, before, after: before + quantity };
  }

  remove(inventory, itemId, requestedQuantity = 1) {
    const item = this.catalog[itemId];
    if (!item) return { ok: false, code: "unknown-item", message: `Unknown item: ${itemId}` };
    const bucket = inventoryBucketFor(item);
    if (!bucket) return { ok: false, code: "not-inventory-item", message: `${item.name} is stored outside the player inventory.` };
    const quantity = positiveQuantity(requestedQuantity);
    if (!quantity) return { ok: false, code: "invalid-quantity", message: "Quantity must be a positive whole number." };
    const before = this.quantity(inventory, itemId);
    if (before < quantity) return { ok: false, code: "insufficient-quantity", message: `Not enough ${item.name} is owned.`, before };
    if (item.ownedByDefault && before - quantity < 1) return { ok: false, code: "protected-starter", message: `${item.name} is a permanent starter tool.`, before };
    const after = before - quantity;
    if (after) inventory[bucket][itemId] = after;
    else delete inventory[bucket][itemId];
    return { ok: true, code: "removed", itemId, bucket, quantity, before, after };
  }
}
