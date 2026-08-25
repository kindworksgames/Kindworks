import { ITEM_CATALOG } from "./items.js";

export const FRESH_MARKET = Object.freeze({
  id: "fresh-market",
  legacyShopId: "shop-10",
  name: "Fresh Market",
  icon: "🐟",
  description: "Fresh fish, meat and pond food for water animals and meat-eating companions.",
  itemIds: Object.freeze([
    "river-minnows",
    "fresh-sardines",
    "river-trout",
    "pond-pellets",
    "chicken-pieces",
    "beef-strips",
    "prepared-meat",
  ]),
  door: Object.freeze({ x: 3185, y: 1095 }),
  approach: Object.freeze({ x: 3185, y: 1132 }),
  interactionRadius: 96,
});

export const SHOP_DEFINITIONS = Object.freeze({
  [FRESH_MARKET.id]: FRESH_MARKET,
});

export function validateShopDefinitions(shops = SHOP_DEFINITIONS, catalog = ITEM_CATALOG) {
  const errors = [];
  const seenItems = new Set();
  for (const [id, shop] of Object.entries(shops)) {
    if (shop.id !== id) errors.push(`${id} has a mismatched shop id.`);
    if (!shop.name || !shop.icon || !shop.description) errors.push(`${id} is missing display metadata.`);
    if (!Array.isArray(shop.itemIds) || !shop.itemIds.length) errors.push(`${id} has no catalogue items.`);
    for (const itemId of shop.itemIds || []) {
      const item = catalog[itemId];
      if (!item) errors.push(`${id} references unknown item ${itemId}.`);
      else {
        if (item.retailer !== id) errors.push(`${itemId} belongs to ${item.retailer || "no retailer"}, not ${id}.`);
        if (item.category !== "consumable" || item.price < 1 || item.qaOnly || item.fishingOnly || item.subscriptionOnly) errors.push(`${itemId} is not ordinary released shop stock.`);
      }
      const pair = `${id}:${itemId}`;
      if (seenItems.has(pair)) errors.push(`${id} contains duplicate stock ${itemId}.`);
      seenItems.add(pair);
    }
  }
  return { ok: errors.length === 0, errors };
}
