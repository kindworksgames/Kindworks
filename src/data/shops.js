import { ITEM_CATALOG } from "./items.js";

function itemIdsWhere(predicate) {
  return Object.freeze(Object.values(ITEM_CATALOG).filter(predicate).map((item) => item.id));
}

const ordinary = (item) => item.price > 0 && !item.qaOnly && !item.fishingOnly && !item.subscriptionOnly && !item.farmingOnly;

export const WILLOWMERE_SHOP = Object.freeze({
  id: "willowmere-shop",
  legacyShopId: "economy-panel",
  name: "Willowmere Shop",
  icon: "🛍️",
  description: "Tools, trees, seating, bins, decorations and furniture bought with ordinary in-game coins.",
  itemIds: itemIdsWhere((item) => ordinary(item) && ["equipment", "placeable", "furniture"].includes(item.category)),
  groups: Object.freeze(["Mowers", "Vacuums", "Trees", "Seating", "Bins", "Decorations", "Furniture"]),
  remote: true,
});

export const VILLAGE_GROCER = Object.freeze({
  id: "town-grocer",
  legacyShopId: "shop-02",
  name: "Village Grocer",
  icon: "🥕",
  description: "Seeds, produce and everyday animal foods from the original Village Grocer catalogue.",
  itemIds: itemIdsWhere((item) => ordinary(item) && item.retailer === "town-grocer"),
  groups: Object.freeze(["Farming", "Animal Treats"]),
  door: Object.freeze({ x: 555, y: 1120 }),
  approach: Object.freeze({ x: 555, y: 1142 }),
  interactionRadius: 92,
});

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
  groups: Object.freeze(["Animal Treats"]),
  door: Object.freeze({ x: 3185, y: 1095 }),
  approach: Object.freeze({ x: 3185, y: 1132 }),
  interactionRadius: 96,
});

export const SHOP_DEFINITIONS = Object.freeze({
  [WILLOWMERE_SHOP.id]: WILLOWMERE_SHOP,
  [VILLAGE_GROCER.id]: VILLAGE_GROCER,
  [FRESH_MARKET.id]: FRESH_MARKET,
});

export function validateShopDefinitions(shops = SHOP_DEFINITIONS, catalog = ITEM_CATALOG) {
  const errors = [];
  const stocked = new Map();
  for (const [id, shop] of Object.entries(shops)) {
    if (shop.id !== id) errors.push(`${id} has a mismatched shop id.`);
    if (!shop.name || !shop.icon || !shop.description) errors.push(`${id} is missing display metadata.`);
    if (!Array.isArray(shop.itemIds) || !shop.itemIds.length) errors.push(`${id} has no catalogue items.`);
    if (!Array.isArray(shop.groups) || !shop.groups.length) errors.push(`${id} has no shop categories.`);
    const local = new Set();
    for (const itemId of shop.itemIds || []) {
      const item = catalog[itemId];
      if (!item) errors.push(`${id} references unknown item ${itemId}.`);
      else {
        if (!ordinary(item)) errors.push(`${itemId} is not ordinary released shop stock.`);
        if (!shop.groups.includes(item.shopGroup)) errors.push(`${itemId} has no visible category in ${id}.`);
        if (item.retailer && item.retailer !== id) errors.push(`${itemId} belongs to ${item.retailer}, not ${id}.`);
        if (!item.retailer && id !== WILLOWMERE_SHOP.id) errors.push(`${itemId} must be sold by Willowmere Shop.`);
      }
      if (local.has(itemId)) errors.push(`${id} contains duplicate stock ${itemId}.`);
      local.add(itemId);
      if (!stocked.has(itemId)) stocked.set(itemId, []);
      stocked.get(itemId).push(id);
    }
  }
  for (const item of Object.values(catalog).filter(ordinary)) {
    if (["equipment", "placeable", "furniture"].includes(item.category) || item.retailer) {
      const expected = item.retailer || WILLOWMERE_SHOP.id;
      const locations = stocked.get(item.id) || [];
      if (locations.length !== 1 || locations[0] !== expected) errors.push(`${item.id} does not have one exact shop owner.`);
    }
  }
  return { ok: errors.length === 0, errors };
}
