import { ITEM_CATALOG, inventoryLimitFor } from "../data/items.js";
import { SHOP_DEFINITIONS } from "../data/shops.js";

export class ShopService {
  constructor(economy, { shops = SHOP_DEFINITIONS, catalog = ITEM_CATALOG } = {}) {
    this.economy = economy;
    this.shops = shops;
    this.catalog = catalog;
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
    const owned = this.economy.inventory.quantity(state.inventory, itemId);
    const limit = inventoryLimitFor(item);
    const shortfall = Math.max(0, item.price - state.economy.coins);
    return {
      ok: true,
      shopId,
      item,
      owned,
      limit,
      remainingCapacity: Math.max(0, limit - owned),
      balance: state.economy.coins,
      affordable: shortfall === 0,
      shortfall,
    };
  }

  getCatalogue(shopId) {
    const shop = this.getShop(shopId);
    if (!shop) return { ok: false, code: "unknown-shop", message: `Unknown shop: ${shopId}`, products: [] };
    const products = shop.itemIds.map((itemId) => this.getProduct(shopId, itemId)).filter((product) => product.ok);
    return { ok: true, shop, products, balance: this.economy.gameState.getSnapshot().economy.coins };
  }

  purchase(shopId, itemId, quantity = 1) {
    const product = this.getProduct(shopId, itemId);
    if (!product.ok) return product;
    const shop = this.getShop(shopId);
    const result = this.economy.purchase(itemId, quantity, {
      shopId,
      reason: `Bought ${product.item.name} at ${shop.name}`,
    });
    return result.ok
      ? { ...result, shopId, shopName: shop.name }
      : { ...result, shopId, shopName: shop.name };
  }
}
