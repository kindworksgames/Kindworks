import { ITEM_CATALOG, inventoryLimitFor } from "../data/items.js";
import { ORCHARD_CONFIG } from "../data/farming.js";
import { SHOP_DEFINITIONS } from "../data/shops.js";

export function perfectCountFor(state, game) {
  if (game === "lawn") return Object.values(state.lawnCare?.progress?.best || {}).filter((result) => Number(result?.percent) >= 100).length;
  if (game === "river") return Object.values(state.river?.best || {}).filter((result) => Number(result?.bestPercent) >= 100).length;
  if (game === "waste") return Object.values(state.progress?.cleanup?.progress?.waste?.best || {}).filter((result) => Number(result?.percent) >= 100).length;
  return 0;
}

export function itemUnlockState(state, item) {
  if (!item?.unlock) return { unlocked: true, game: null, progress: 0, required: 0 };
  const progress = perfectCountFor(state, item.unlock.game);
  return {
    unlocked: progress >= item.unlock.perfects,
    game: item.unlock.game,
    progress,
    required: item.unlock.perfects,
  };
}

export class ShopService {
  constructor(economy, { shops = SHOP_DEFINITIONS, catalog = ITEM_CATALOG, farming = null } = {}) {
    this.economy = economy;
    this.shops = shops;
    this.catalog = catalog;
    this.farming = farming;
  }

  getShop(shopId) {
    return this.shops[shopId] || null;
  }

  getProduct(shopId, itemId) {
    const shop = this.getShop(shopId);
    if (!shop) return { ok: false, code: "unknown-shop", message: `Unknown shop: ${shopId}` };
    if (!shop.itemIds.includes(itemId)) return { ok: false, code: "not-sold-here", message: "That item is not sold in this shop." };
    const item = this.catalog[itemId];
    if (!item) return { ok: false, code: "unknown-item", message: `Unknown item: ${itemId}` };
    const state = this.economy.gameState.getSnapshot();
    const orchardSapling = item.farmingKind === "sapling";
    const placedUniqueFurniture = item.unique
      ? state.homeInteriors?.placements?.filter((placement) => placement.itemId === itemId).length || 0
      : 0;
    const owned = orchardSapling ? state.farming.orchard.purchasedSaplings : this.economy.inventory.quantity(state.inventory, itemId) + placedUniqueFurniture;
    const limit = orchardSapling ? ORCHARD_CONFIG.maxTrees : inventoryLimitFor(item);
    const remainingCapacity = orchardSapling
      ? Math.max(0, ORCHARD_CONFIG.maxTrees - state.farming.orchard.trees.length - owned)
      : Math.max(0, limit - owned);
    const quote = this.economy.quotePurchase(itemId, 1, state);
    const unlock = itemUnlockState(state, item);
    const equipped = item.category === "equipment" && state.inventory.equipped?.[item.slot] === itemId;
    const shortfall = Math.max(0, quote.cost - state.economy.coins);
    return {
      ok: true,
      shopId,
      item,
      owned,
      limit,
      remainingCapacity,
      balance: state.economy.coins,
      affordable: shortfall === 0,
      shortfall,
      quote,
      unlock,
      unlocked: unlock.unlocked,
      equipped,
      canBuy: unlock.unlocked && shortfall === 0 && remainingCapacity > 0,
      availability: unlock.unlocked ? "available" : `Complete ${unlock.required} perfect ${unlock.game} jobs (${unlock.progress}/${unlock.required}).`,
    };
  }

  getCatalogue(shopId, { group = null } = {}) {
    const shop = this.getShop(shopId);
    if (!shop) return { ok: false, code: "unknown-shop", message: `Unknown shop: ${shopId}`, products: [] };
    const activeGroup = shop.groups.includes(group) ? group : shop.groups[0];
    const products = shop.itemIds
      .map((itemId) => this.getProduct(shopId, itemId))
      .filter((product) => product.ok && product.item.shopGroup === activeGroup);
    return { ok: true, shop, groups: shop.groups, activeGroup, products, balance: this.economy.gameState.getSnapshot().economy.coins };
  }

  purchase(shopId, itemId, quantity = 1) {
    const product = this.getProduct(shopId, itemId);
    if (!product.ok) return product;
    const shop = this.getShop(shopId);
    if (!product.unlocked) return { ok: false, code: "locked", message: product.availability, unlock: product.unlock, shopId, shopName: shop.name };
    const result = product.item.farmingKind === "sapling" && this.farming
      ? this.farming.purchaseSapling()
      : this.economy.purchase(itemId, quantity, {
      shopId,
      reason: `Bought ${product.item.name} at ${shop.name}`,
      });
    return { ...result, shopId, shopName: shop.name };
  }

  equip(shopId, itemId) {
    const product = this.getProduct(shopId, itemId);
    if (!product.ok) return product;
    const shop = this.getShop(shopId);
    const result = this.economy.equip(itemId, { shopId, reason: `Equipped ${product.item.name}` });
    return { ...result, shopId, shopName: shop.name };
  }
}
