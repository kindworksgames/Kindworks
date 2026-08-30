import { itemUseDestinationFor, placeableFootprintFor } from "../data/items.js";
import { VILLAGE_GROCER_DISPLAYS } from "../data/villageGrocer.js";
import { aquariumSnapshot } from "../state/aquariumState.js";

function formatCoins(value) {
  return new Intl.NumberFormat("en-GB").format(value);
}

function unlockLabel(unlock) {
  if (!unlock || unlock.unlocked) return "Available";
  const game = { lawn: "Lawn Care", river: "River Clear-Out", waste: "Waste Collection" }[unlock.game] || unlock.game;
  return `🔒 ${unlock.progress}/${unlock.required} perfect ${game} jobs`;
}

const GROUP_ICONS = Object.freeze({
  Mowers: "🚜", Vacuums: "🧹", Trees: "🌳", Seating: "🪑", Bins: "🗑️", Decorations: "🌼", Furniture: "🛋️",
  Farming: "🥕", "Animal Treats": "🐾",
});

const VILLAGE_GROCER_SHELVES = Object.freeze([
  Object.freeze({ id: "seeds", label: "Seeds", itemIds: Object.freeze(["carrot-seeds", "fresh-greens-seeds", "wild-berry-starters"]) }),
  Object.freeze({ id: "saplings", label: "Saplings", itemIds: Object.freeze(["orchard-apple-sapling"]) }),
  Object.freeze({ id: "garden-goods", label: "Garden Goods", itemIds: Object.freeze(["mixed-seeds", "sunflower-seeds", "mealworms", "fresh-greens", "wild-berries"]) }),
]);

const VILLAGE_GROCER_COPY_COUNTS = new Map(VILLAGE_GROCER_DISPLAYS.map((display) => [display.id, display.count]));

const FRESH_MARKET_COUNTERS = Object.freeze([
  Object.freeze({ id: "fish-on-ice", label: "Fish on Ice", itemIds: Object.freeze(["river-minnows", "fresh-sardines", "river-trout"]) }),
  Object.freeze({ id: "butcher-counter", label: "Butcher Counter", itemIds: Object.freeze(["chicken-pieces", "beef-strips", "prepared-meat"]) }),
  Object.freeze({ id: "pond-food", label: "Pond Food", itemIds: Object.freeze(["pond-pellets"]) }),
]);

const FRESH_MARKET_COPY_COUNTS = Object.freeze({
  "river-minnows": 12,
  "fresh-sardines": 9,
  "river-trout": 7,
  "chicken-pieces": 10,
  "beef-strips": 9,
  "prepared-meat": 12,
  "pond-pellets": 7,
});

export class ShopController {
  constructor(shopService, runtime, { onModalChange = () => {}, onPlaceItem = () => ({ ok: false }), defaultShopId = "willowmere-shop" } = {}) {
    this.shopService = shopService;
    this.runtime = runtime;
    this.onModalChange = onModalChange;
    this.defaultShopId = defaultShopId;
    this.onPlaceItem = onPlaceItem;
    this.openButton = document.querySelector("#shop-button");
    this.panel = document.querySelector("#shop-panel");
    this.closeButton = document.querySelector("#shop-panel-close");
    this.title = document.querySelector("#shop-panel-title");
    this.description = document.querySelector("#shop-panel-description");
    this.catalogueTitle = document.querySelector("#shop-catalogue-title");
    this.groupTabs = document.querySelector("#shop-group-tabs");
    this.balance = document.querySelector("#shop-balance");
    this.productList = document.querySelector("#shop-product-list");
    this.searchInput = document.querySelector("#shop-search");
    this.sortSelect = document.querySelector("#shop-sort");
    this.emptyMessage = document.querySelector("#shop-empty");
    this.detailIcon = document.querySelector("#shop-detail-icon");
    this.detailName = document.querySelector("#shop-detail-name");
    this.detailDescription = document.querySelector("#shop-detail-description");
    this.detailPrice = document.querySelector("#shop-detail-price");
    this.detailOwned = document.querySelector("#shop-detail-owned");
    this.buyButton = document.querySelector("#shop-buy-button");
    this.placeButton = document.querySelector("#shop-place-button");
    this.placementPreview = document.querySelector("#shop-placement-preview");
    this.message = document.querySelector("#shop-message");
    this.activeShopId = null;
    this.activeGroup = null;
    this.selectedItemId = null;
    this.previousFocus = null;
    this.searchQuery = "";
    this.sortMode = "name";

    this.onOpen = () => this.open(this.defaultShopId);
    this.onClose = () => this.close();
    this.onBuy = () => this.activateSelected();
    this.onPlace = () => this.activatePlacement();
    this.onProductClick = (event) => {
      const button = event.target.closest?.("[data-shop-item]");
      if (button) this.selectItem(button.dataset.shopItem);
    };
    this.onGroupClick = (event) => {
      const button = event.target.closest?.("[data-shop-group]");
      if (button) this.selectGroup(button.dataset.shopGroup, { focus: true });
    };
    this.onSearch = () => { this.searchQuery = this.searchInput?.value.trim().toLocaleLowerCase() || ""; this.render(); };
    this.onSort = () => { this.sortMode = this.sortSelect?.value || "name"; this.render(); };
    this.onKeyDown = (event) => this.handleKeyDown(event);
    this.openButton?.addEventListener("click", this.onOpen);
    this.closeButton?.addEventListener("click", this.onClose);
    this.buyButton?.addEventListener("click", this.onBuy);
    this.placeButton?.addEventListener("click", this.onPlace);
    this.productList?.addEventListener("click", this.onProductClick);
    this.groupTabs?.addEventListener("click", this.onGroupClick);
    this.searchInput?.addEventListener("input", this.onSearch);
    this.sortSelect?.addEventListener("change", this.onSort);
    document.addEventListener("keydown", this.onKeyDown);
    this.unsubscribe = runtime.gameState.subscribe(() => {
      if (this.isOpen()) this.render();
    });
  }

  isOpen() {
    return Boolean(this.panel && !this.panel.classList.contains("hidden"));
  }

  open(shopId, { group = null, itemId = null } = {}) {
    const shop = this.shopService.getShop(shopId);
    if (!shop || !this.panel) return { ok: false, code: "unknown-shop", message: `Unknown shop: ${shopId}` };
    this.previousFocus = document.activeElement;
    this.panel.dataset.shopId = shopId;
    this.activeShopId = shopId;
    this.activeGroup = shop.groups.includes(group) ? group : shop.groups.includes(this.activeGroup) ? this.activeGroup : shop.groups[0];
    const catalogue = this.shopService.getCatalogue(shopId, { group: this.activeGroup });
    this.selectedItemId = catalogue.products.some((product) => product.item.id === itemId)
      ? itemId
      : catalogue.products.some((product) => product.item.id === this.selectedItemId)
      ? this.selectedItemId
      : catalogue.products[0]?.item.id || null;
    this.clearMessage();
    this.render();
    this.panel.classList.remove("hidden");
    this.panel.setAttribute("aria-hidden", "false");
    this.onModalChange(true);
    this.closeButton?.focus({ preventScroll: true });
    return { ok: true, shopId, activeGroup: this.activeGroup };
  }

  close() {
    if (!this.isOpen()) return { ok: false, code: "not-open" };
    this.panel.classList.add("hidden");
    this.panel.setAttribute("aria-hidden", "true");
    this.onModalChange(false);
    const interactionButton = document.querySelector("#interaction-action");
    const previousIsUsable = this.previousFocus && this.previousFocus !== document.body && this.previousFocus.isConnected && !this.panel.contains(this.previousFocus);
    const returnTarget = previousIsUsable ? this.previousFocus : interactionButton;
    returnTarget?.focus?.({ preventScroll: true });
    requestAnimationFrame(() => returnTarget?.focus?.({ preventScroll: true }));
    return { ok: true, shopId: this.activeShopId };
  }

  clearMessage() {
    if (!this.message) return;
    this.message.textContent = "Select an item to see its exact price, unlock and inventory limit.";
    this.message.dataset.status = "neutral";
  }

  showMessage(text, status) {
    if (!this.message) return;
    this.message.textContent = text;
    this.message.dataset.status = status;
  }

  selectGroup(group, { focus = false } = {}) {
    const shop = this.shopService.getShop(this.activeShopId);
    if (!shop?.groups.includes(group)) return { ok: false, code: "unknown-group" };
    this.activeGroup = group;
    const catalogue = this.shopService.getCatalogue(this.activeShopId, { group });
    this.selectedItemId = catalogue.products[0]?.item.id || null;
    this.render();
    this.clearMessage();
    if (focus) this.groupTabs?.querySelector(`[data-shop-group="${group}"]`)?.focus();
    return { ok: true, group };
  }

  selectItem(itemId, { focus = false } = {}) {
    const product = this.shopService.getProduct(this.activeShopId, itemId);
    if (!product.ok) return product;
    this.activeGroup = product.item.shopGroup;
    this.selectedItemId = itemId;
    this.render();
    this.clearMessage();
    if (focus) this.productList?.querySelector(`[data-shop-item="${itemId}"]`)?.focus();
    return product;
  }

  renderGroups(catalogue) {
    if (!this.groupTabs) return;
    this.groupTabs.replaceChildren();
    for (const group of catalogue.groups) {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.shopGroup = group;
      button.setAttribute("role", "tab");
      button.setAttribute("aria-selected", String(group === catalogue.activeGroup));
      const icon = document.createElement("span");
      icon.className = "shop-group-icon";
      icon.setAttribute("aria-hidden", "true");
      icon.dataset.assetLabel = `KW-SHOP-CATEGORY-${group.toUpperCase().replaceAll(" ", "-")}`;
      icon.textContent = GROUP_ICONS[group] || "🛍️";
      const label = document.createElement("span");
      label.textContent = group;
      button.append(icon, label);
      this.groupTabs.append(button);
    }
  }

  visibleProducts(catalogue) {
    const filtered = catalogue.products.filter((product) => {
      if (!this.searchQuery) return true;
      return `${product.item.name} ${product.item.description || ""}`.toLocaleLowerCase().includes(this.searchQuery);
    });
    if (["town-grocer", "fresh-market"].includes(this.activeShopId)) return filtered;
    return filtered.sort((left, right) => {
      if (this.sortMode === "price-low") return left.quote.cost - right.quote.cost || left.item.name.localeCompare(right.item.name);
      if (this.sortMode === "price-high") return right.quote.cost - left.quote.cost || left.item.name.localeCompare(right.item.name);
      return left.item.name.localeCompare(right.item.name);
    });
  }

  renderProducts(products) {
    if (!this.productList) return;
    this.productList.replaceChildren();
    this.emptyMessage?.classList.toggle("hidden", products.length > 0);
    for (const product of products) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "shop-product";
      button.dataset.shopItem = product.item.id;
      button.dataset.affordable = String(product.affordable);
      button.dataset.locked = String(!product.unlocked);
      button.setAttribute("aria-pressed", String(product.item.id === this.selectedItemId));
      const icon = document.createElement("span");
      icon.className = "shop-product-icon";
      icon.setAttribute("aria-hidden", "true");
      icon.dataset.assetLabel = `KW-SHOP-PRODUCT-${product.item.id.toUpperCase()}`;
      icon.textContent = product.item.icon;
      const copy = document.createElement("span");
      copy.className = "shop-product-copy";
      const name = document.createElement("strong");
      name.textContent = product.item.name;
      const meta = document.createElement("small");
      const price = product.quote.upgradeCredit ? `${formatCoins(product.quote.cost)} upgrade` : formatCoins(product.item.price);
      meta.textContent = product.unlocked ? `🪙 ${price} · ${product.owned} owned` : unlockLabel(product.unlock);
      copy.append(name, meta);
      button.append(icon, copy);
      this.productList.append(button);
    }
  }

  renderVillageGrocer(products) {
    if (!this.productList) return;
    this.productList.replaceChildren();
    const productsById = new Map(products.map((product) => [product.item.id, product]));
    for (const shelfData of VILLAGE_GROCER_SHELVES) {
      const shelf = document.createElement("section");
      shelf.className = `grocer-shop-shelf grocer-shop-shelf-${shelfData.id}`;
      shelf.dataset.grocerShelf = shelfData.id;
      shelf.dataset.assetLabel = `KW-GROCER-SHELF-${shelfData.id.toUpperCase()}`;
      shelf.dataset.spriteAiLabel = `grocer.shelf.${shelfData.id}`;
      shelf.dataset.spriteAiKind = "shop-fixture";
      const heading = document.createElement("h3");
      heading.textContent = shelfData.label;
      const stock = document.createElement("div");
      stock.className = "grocer-shop-stock";
      for (const itemId of shelfData.itemIds) {
        const product = productsById.get(itemId);
        if (!product) continue;
        const button = document.createElement("button");
        button.type = "button";
        button.className = "shop-product grocer-shop-product";
        button.dataset.shopItem = product.item.id;
        button.dataset.affordable = String(product.affordable);
        button.dataset.locked = String(!product.unlocked);
        button.dataset.assetLabel = `KW-GROCER-PRODUCT-${product.item.id.toUpperCase()}`;
        button.dataset.spriteAiLabel = `grocer.product.${product.item.id}`;
        button.dataset.spriteAiKind = "interactive-shop-product";
        button.setAttribute("aria-pressed", String(product.item.id === this.selectedItemId));
        button.setAttribute("aria-label", `${product.item.name}, ${formatCoins(product.item.price)} coins, ${product.owned} owned`);
        const copies = document.createElement("span");
        copies.className = "grocer-stock-copies";
        copies.setAttribute("aria-hidden", "true");
        const copyCount = Math.max(1, Math.min(10, VILLAGE_GROCER_COPY_COUNTS.get(itemId) || 1));
        for (let index = 0; index < copyCount; index += 1) {
          const copy = document.createElement("span");
          copy.className = "grocer-stock-copy";
          copy.dataset.assetLabel = `KW-GROCER-${product.item.id.toUpperCase()}-${index + 1}`;
          copy.dataset.spriteAiLabel = `grocer.stock.${product.item.id}.${index + 1}`;
          copy.dataset.spriteAiKind = "shop-stock-sprite";
          copy.textContent = product.item.icon;
          copies.append(copy);
        }
        const name = document.createElement("strong");
        name.className = "sr-only";
        name.textContent = product.item.name;
        button.append(copies, name);
        stock.append(button);
      }
      shelf.append(heading, stock);
      this.productList.append(shelf);
    }
    const roomDetails = document.createElement("div");
    roomDetails.className = "grocer-shop-room-details";
    roomDetails.setAttribute("aria-hidden", "true");
    roomDetails.innerHTML = [
      '<span class="grocer-crates" data-asset-label="KW-GROCER-WOODEN-CRATES" data-sprite-ai-label="grocer.fixture.wooden-crates" data-sprite-ai-kind="shop-fixture">▤</span>',
      '<span class="grocer-rug" data-asset-label="KW-GROCER-ENTRY-RUG" data-sprite-ai-label="grocer.fixture.entry-rug" data-sprite-ai-kind="shop-fixture"></span>',
      '<span class="grocer-counter" data-asset-label="KW-GROCER-CHECKOUT-COUNTER" data-sprite-ai-label="grocer.fixture.checkout-counter" data-sprite-ai-kind="shop-fixture">▰</span>',
      '<span class="grocer-clerk" data-asset-label="KW-GROCER-CLERK-MARA" data-sprite-ai-label="grocer.character.clerk-mara" data-sprite-ai-kind="shop-character">🧑🏾‍🌾</span>',
    ].join("");
    this.productList.append(roomDetails);
    this.emptyMessage?.classList.toggle("hidden", products.length > 0);
  }

  renderFreshMarket(products) {
    if (!this.productList) return;
    this.productList.replaceChildren();
    const productsById = new Map(products.map((product) => [product.item.id, product]));
    for (const counterData of FRESH_MARKET_COUNTERS) {
      const counter = document.createElement("section");
      counter.className = `fresh-market-counter fresh-market-${counterData.id}`;
      counter.dataset.marketCounter = counterData.id;
      counter.dataset.assetLabel = `KW-FRESH-MARKET-${counterData.id.toUpperCase()}`;
      counter.dataset.spriteAiLabel = `fresh-market.counter.${counterData.id}`;
      counter.dataset.spriteAiKind = "shop-fixture";
      const heading = document.createElement("h3");
      heading.textContent = counterData.label;
      const stock = document.createElement("div");
      stock.className = "fresh-market-stock";
      for (const itemId of counterData.itemIds) {
        const product = productsById.get(itemId);
        if (!product) continue;
        const button = document.createElement("button");
        button.type = "button";
        button.className = "shop-product fresh-market-product";
        button.dataset.shopItem = product.item.id;
        button.dataset.affordable = String(product.affordable);
        button.dataset.locked = String(!product.unlocked);
        button.dataset.assetLabel = `KW-FRESH-MARKET-PRODUCT-${product.item.id.toUpperCase()}`;
        button.dataset.spriteAiLabel = `fresh-market.product.${product.item.id}`;
        button.dataset.spriteAiKind = "interactive-shop-product";
        button.setAttribute("aria-pressed", String(product.item.id === this.selectedItemId));
        button.setAttribute("aria-label", `${product.item.name}, ${formatCoins(product.item.price)} coins, ${product.owned} owned`);
        const copies = document.createElement("span");
        copies.className = "fresh-market-copies";
        copies.setAttribute("aria-hidden", "true");
        for (let index = 0; index < FRESH_MARKET_COPY_COUNTS[itemId]; index += 1) {
          const copy = document.createElement("span");
          copy.className = "fresh-market-copy";
          copy.dataset.assetLabel = `KW-FRESH-MARKET-${product.item.id.toUpperCase()}-${index + 1}`;
          copy.dataset.spriteAiLabel = `fresh-market.stock.${product.item.id}.${index + 1}`;
          copy.dataset.spriteAiKind = "market-food-sprite";
          copy.textContent = product.item.icon;
          copies.append(copy);
        }
        const name = document.createElement("strong");
        name.className = "sr-only";
        name.textContent = product.item.name;
        button.append(copies, name);
        stock.append(button);
      }
      counter.append(heading, stock);
      this.productList.append(counter);
    }
    const roomDetails = document.createElement("div");
    roomDetails.className = "fresh-market-room-details";
    roomDetails.setAttribute("aria-hidden", "true");
    roomDetails.innerHTML = [
      '<span class="fresh-market-worker worker-fish" data-asset-label="KW-FRESH-MARKET-FISHMONGER" data-sprite-ai-label="fresh-market.character.fishmonger" data-sprite-ai-kind="shop-character">🧑🏻‍🍳</span>',
      '<span class="fresh-market-worker worker-butcher" data-asset-label="KW-FRESH-MARKET-BUTCHER" data-sprite-ai-label="fresh-market.character.butcher" data-sprite-ai-kind="shop-character">🧑🏽‍🍳</span>',
      '<span class="fresh-market-customer" data-asset-label="KW-FRESH-MARKET-CUSTOMER" data-sprite-ai-label="fresh-market.character.customer" data-sprite-ai-kind="shop-character">🧑🏾</span>',
      '<span class="fresh-market-checkout" data-asset-label="KW-FRESH-MARKET-CHECKOUT" data-sprite-ai-label="fresh-market.fixture.checkout" data-sprite-ai-kind="shop-fixture"><i>▦</i></span>',
      '<span class="fresh-market-entry-mat" data-asset-label="KW-FRESH-MARKET-ENTRY-MAT" data-sprite-ai-label="fresh-market.fixture.entry-mat" data-sprite-ai-kind="shop-fixture">🐟</span>',
    ].join("");
    this.productList.append(roomDetails);
    this.emptyMessage?.classList.toggle("hidden", products.length > 0);
  }

  renderDetail(product) {
    if (!product?.ok) return;
    if (this.detailIcon) this.detailIcon.textContent = product.item.icon;
    if (this.detailIcon) this.detailIcon.dataset.assetLabel = `KW-SHOP-DETAIL-${product.item.id.toUpperCase()}`;
    if (this.detailIcon) this.detailIcon.dataset.spriteAiLabel = `${this.activeShopId === "town-grocer" ? "grocer" : "shop"}.detail.${product.item.id}`;
    if (this.detailIcon) this.detailIcon.dataset.spriteAiKind = "selected-product-art";
    if (this.detailName) this.detailName.textContent = product.item.name;
    if (this.detailDescription) {
      const base = product.item.description || `${product.item.shopGroup} stock available in Willowmere.`;
      const aquarium = product.item.aquarium ? aquariumSnapshot(this.runtime.gameState.getSnapshot()) : null;
      const aquariumStatus = !aquarium ? "" : aquarium.placed
        ? ` ${aquarium.totalFish} ornamental fish currently live in your placed home aquarium.`
        : aquarium.owned
          ? " You own the tank; place it inside your resident's home before fishing."
          : " It keeps ornamental pond catches safely in your resident's home.";
      this.detailDescription.textContent = `${base}${aquariumStatus}`;
    }
    if (this.detailPrice) this.detailPrice.textContent = product.quote.upgradeCredit
      ? `🪙 ${formatCoins(product.quote.cost)} (${formatCoins(product.quote.upgradeCredit)} upgrade credit)`
      : `🪙 ${formatCoins(product.item.price)}`;
    if (this.detailOwned) this.detailOwned.textContent = `${formatCoins(product.owned)} / ${formatCoins(product.limit)} owned`;
    const placeable = product.item.category === "placeable";
    const directlyPlaceable = placeable || product.item.category === "furniture" || product.item.farmingKind === "sapling";
    const destination = itemUseDestinationFor(product.item);
    if (this.placementPreview) {
      this.placementPreview.classList.toggle("hidden", !destination);
      if (placeable) {
        const diameter = placeableFootprintFor(product.item) * 2;
        const interaction = product.item.effect?.npcBin ? "Residents can use it as a public bin." : product.item.effect?.npcDestination ? "Residents can visit this object." : "Blocks wildlife and rubbish spawning safely.";
        this.placementPreview.textContent = `Town preview · ${diameter}×${diameter} footprint · rotates 90° · ${interaction}`;
      } else if (destination) this.placementPreview.textContent = `${destination.label} · ${destination.detail}`;
    }
    if (this.placeButton) {
      const placeFromHere = this.activeShopId !== "town-grocer";
      this.placeButton.classList.toggle("hidden", !placeFromHere || !directlyPlaceable || product.owned < 1);
      this.placeButton.disabled = !placeFromHere || !directlyPlaceable || product.owned < 1;
      this.placeButton.textContent = directlyPlaceable ? `${destination.label}: ${product.item.name}` : "Use owned item";
    }
    if (!this.buyButton) return;
    const equipment = product.item.category === "equipment";
    if (!product.unlocked) {
      this.buyButton.disabled = true;
      this.buyButton.textContent = unlockLabel(product.unlock);
    } else if (equipment && product.equipped) {
      this.buyButton.disabled = true;
      this.buyButton.textContent = "Equipped";
    } else if (equipment && product.owned > 0) {
      this.buyButton.disabled = false;
      this.buyButton.textContent = `Equip ${product.item.name}`;
    } else if (product.remainingCapacity < 1) {
      this.buyButton.disabled = true;
      this.buyButton.textContent = "Inventory limit reached";
    } else {
      this.buyButton.disabled = false;
      this.buyButton.textContent = `Buy 1 for 🪙 ${formatCoins(product.quote.cost)}`;
    }
    this.buyButton.dataset.affordable = String(product.affordable);
    this.buyButton.setAttribute("aria-describedby", "shop-message");
  }

  render() {
    const catalogue = this.shopService.getCatalogue(this.activeShopId, { group: this.activeGroup });
    if (!catalogue.ok) return catalogue;
    this.activeGroup = catalogue.activeGroup;
    const isVillageGrocer = this.activeShopId === "town-grocer";
    const isFreshMarket = this.activeShopId === "fresh-market";
    const isReferenceShop = isVillageGrocer || isFreshMarket;
    const allProducts = isReferenceShop
      ? catalogue.shop.itemIds.map((itemId) => this.shopService.getProduct(this.activeShopId, itemId)).filter((product) => product.ok)
      : catalogue.products;
    if (!allProducts.some((product) => product.item.id === this.selectedItemId)) this.selectedItemId = allProducts[0]?.item.id || null;
    if (this.title) this.title.textContent = isReferenceShop ? catalogue.shop.name : `${catalogue.shop.icon} ${catalogue.shop.name}`;
    if (this.description) this.description.textContent = catalogue.shop.description;
    if (this.catalogueTitle) this.catalogueTitle.textContent = catalogue.activeGroup;
    if (this.balance) this.balance.textContent = formatCoins(catalogue.balance);
    if (this.searchInput && this.searchInput.value !== this.searchQuery) this.searchInput.value = this.searchQuery;
    if (this.sortSelect && this.sortSelect.value !== this.sortMode) this.sortSelect.value = this.sortMode;
    this.renderGroups(catalogue);
    const visible = this.visibleProducts({ ...catalogue, products: allProducts });
    if (!visible.some((product) => product.item.id === this.selectedItemId)) this.selectedItemId = visible[0]?.item.id || allProducts[0]?.item.id || null;
    if (isVillageGrocer) this.renderVillageGrocer(visible);
    else if (isFreshMarket) this.renderFreshMarket(visible);
    else this.renderProducts(visible);
    const product = this.shopService.getProduct(this.activeShopId, this.selectedItemId);
    this.renderDetail(product);
    return catalogue;
  }

  activateSelected() {
    const product = this.shopService.getProduct(this.activeShopId, this.selectedItemId);
    if (!product.ok) {
      this.showMessage(product.message, "error");
      return product;
    }
    const equipping = product.item.category === "equipment" && product.owned > 0;
    const result = equipping
      ? this.shopService.equip(this.activeShopId, this.selectedItemId)
      : this.shopService.purchase(this.activeShopId, this.selectedItemId, 1);
    this.render();
    if (result.ok && equipping) {
      this.showMessage(`${product.item.icon} ${product.item.name} is now equipped. The matching game uses its exact tool effect.`, "success");
    } else if (result.ok) {
      const credit = result.upgradeCredit ? ` after ${formatCoins(result.upgradeCredit)} upgrade credit` : "";
      this.showMessage(`${product.item.icon} ${product.item.name} added for 🪙 ${formatCoins(result.cost)}${credit} · 🪙 ${formatCoins(result.after)} left`, "success");
    } else if (result.code === "insufficient-funds") {
      this.showMessage(`You need 🪙 ${formatCoins(result.required - result.available)} more for ${product.item.name}.`, "error");
    } else {
      this.showMessage(result.message || "The action was not completed. No coins or inventory were changed.", "error");
    }
    this.buyButton?.focus({ preventScroll: true });
    return result;
  }

  activatePlacement() {
    const product = this.shopService.getProduct(this.activeShopId, this.selectedItemId);
    const directlyPlaceable = product.ok && (product.item.category === "placeable" || product.item.category === "furniture" || product.item.farmingKind === "sapling");
    if (!product.ok || !directlyPlaceable || product.owned < 1) {
      const result = { ok: false, code: "not-owned", message: "Buy or own this item before placing it in its correct location." };
      this.showMessage(result.message, "error");
      return result;
    }
    this.close();
    return this.onPlaceItem(product.item);
  }

  focusableElements() {
    return [this.closeButton, ...(this.groupTabs?.querySelectorAll("button") || []), this.searchInput, this.sortSelect, ...(this.productList?.querySelectorAll("button") || []), this.buyButton, this.placeButton]
      .filter((element) => element && !element.disabled);
  }

  handleKeyDown(event) {
    if (!this.isOpen()) return;
    if (event.key === "Escape") {
      event.preventDefault();
      this.close();
      return;
    }
    const groupButtons = [...(this.groupTabs?.querySelectorAll("button") || [])];
    const groupIndex = groupButtons.indexOf(document.activeElement);
    if (groupIndex >= 0 && ["ArrowLeft", "ArrowRight"].includes(event.key)) {
      event.preventDefault();
      const next = (groupIndex + (event.key === "ArrowLeft" ? -1 : 1) + groupButtons.length) % groupButtons.length;
      this.selectGroup(groupButtons[next].dataset.shopGroup, { focus: true });
      return;
    }
    const productButtons = [...(this.productList?.querySelectorAll("button") || [])];
    const productIndex = productButtons.indexOf(document.activeElement);
    if (productIndex >= 0 && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
      event.preventDefault();
      const direction = ["ArrowUp", "ArrowLeft"].includes(event.key) ? -1 : 1;
      const next = (productIndex + direction + productButtons.length) % productButtons.length;
      this.selectItem(productButtons[next].dataset.shopItem, { focus: true });
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = this.focusableElements();
    const current = focusable.indexOf(document.activeElement);
    const next = event.shiftKey ? (current <= 0 ? focusable.length - 1 : current - 1) : (current + 1) % focusable.length;
    event.preventDefault();
    focusable[next]?.focus();
  }

  getDiagnostics() {
    const catalogue = this.activeShopId ? this.shopService.getCatalogue(this.activeShopId, { group: this.activeGroup }) : null;
    return {
      open: this.isOpen(),
      shopId: this.activeShopId,
      activeGroup: this.activeGroup,
      selectedItemId: this.selectedItemId,
      productCount: catalogue?.products?.length || 0,
      shopCount: Object.keys(this.shopService.shops).length,
    };
  }

  destroy() {
    this.openButton?.removeEventListener("click", this.onOpen);
    this.closeButton?.removeEventListener("click", this.onClose);
    this.buyButton?.removeEventListener("click", this.onBuy);
    this.placeButton?.removeEventListener("click", this.onPlace);
    this.productList?.removeEventListener("click", this.onProductClick);
    this.groupTabs?.removeEventListener("click", this.onGroupClick);
    this.searchInput?.removeEventListener("input", this.onSearch);
    this.sortSelect?.removeEventListener("change", this.onSort);
    document.removeEventListener("keydown", this.onKeyDown);
    this.unsubscribe?.();
  }
}
