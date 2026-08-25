function formatCoins(value) {
  return new Intl.NumberFormat("en-GB").format(value);
}

export class ShopController {
  constructor(shopService, runtime, { onModalChange = () => {} } = {}) {
    this.shopService = shopService;
    this.runtime = runtime;
    this.onModalChange = onModalChange;
    this.panel = document.querySelector("#shop-panel");
    this.closeButton = document.querySelector("#shop-panel-close");
    this.title = document.querySelector("#shop-panel-title");
    this.description = document.querySelector("#shop-panel-description");
    this.balance = document.querySelector("#shop-balance");
    this.productList = document.querySelector("#shop-product-list");
    this.detailIcon = document.querySelector("#shop-detail-icon");
    this.detailName = document.querySelector("#shop-detail-name");
    this.detailDescription = document.querySelector("#shop-detail-description");
    this.detailPrice = document.querySelector("#shop-detail-price");
    this.detailOwned = document.querySelector("#shop-detail-owned");
    this.buyButton = document.querySelector("#shop-buy-button");
    this.message = document.querySelector("#shop-message");
    this.activeShopId = null;
    this.selectedItemId = null;
    this.previousFocus = null;

    this.onClose = () => this.close();
    this.onBuy = () => this.buySelected();
    this.onProductClick = (event) => {
      const button = event.target.closest?.("[data-shop-item]");
      if (button) this.selectItem(button.dataset.shopItem);
    };
    this.onKeyDown = (event) => this.handleKeyDown(event);
    this.closeButton?.addEventListener("click", this.onClose);
    this.buyButton?.addEventListener("click", this.onBuy);
    this.productList?.addEventListener("click", this.onProductClick);
    document.addEventListener("keydown", this.onKeyDown);
    this.unsubscribe = runtime.gameState.subscribe(() => {
      if (!this.panel?.classList.contains("hidden")) this.render();
    });
  }

  isOpen() {
    return Boolean(this.panel && !this.panel.classList.contains("hidden"));
  }

  open(shopId) {
    const catalogue = this.shopService.getCatalogue(shopId);
    if (!catalogue.ok || !this.panel) return catalogue;
    this.previousFocus = document.activeElement;
    this.activeShopId = shopId;
    if (!catalogue.shop.itemIds.includes(this.selectedItemId)) this.selectedItemId = catalogue.shop.itemIds[0];
    this.clearMessage();
    this.render();
    this.panel.classList.remove("hidden");
    this.panel.setAttribute("aria-hidden", "false");
    this.onModalChange(true);
    this.closeButton?.focus({ preventScroll: true });
    return { ok: true, shopId };
  }

  close() {
    if (!this.isOpen()) return { ok: false, code: "not-open" };
    this.panel.classList.add("hidden");
    this.panel.setAttribute("aria-hidden", "true");
    this.onModalChange(false);
    const interactionButton = document.querySelector("#interaction-action");
    const previousIsUsable = this.previousFocus
      && this.previousFocus !== document.body
      && this.previousFocus.isConnected
      && !this.panel.contains(this.previousFocus);
    const returnTarget = previousIsUsable ? this.previousFocus : interactionButton;
    returnTarget?.focus?.({ preventScroll: true });
    requestAnimationFrame(() => returnTarget?.focus?.({ preventScroll: true }));
    return { ok: true, shopId: this.activeShopId };
  }

  clearMessage() {
    if (!this.message) return;
    this.message.textContent = "Select a product to see its price and owned quantity.";
    this.message.dataset.status = "neutral";
  }

  showMessage(text, status) {
    if (!this.message) return;
    this.message.textContent = text;
    this.message.dataset.status = status;
  }

  selectItem(itemId, { focus = false } = {}) {
    const product = this.shopService.getProduct(this.activeShopId, itemId);
    if (!product.ok) return product;
    this.selectedItemId = itemId;
    this.render();
    this.clearMessage();
    if (focus) this.productList?.querySelector(`[data-shop-item="${itemId}"]`)?.focus();
    return product;
  }

  renderProducts(catalogue) {
    if (!this.productList) return;
    this.productList.replaceChildren();
    for (const product of catalogue.products) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "shop-product";
      button.dataset.shopItem = product.item.id;
      button.dataset.affordable = String(product.affordable);
      button.setAttribute("aria-pressed", String(product.item.id === this.selectedItemId));
      const icon = document.createElement("span");
      icon.className = "shop-product-icon";
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = product.item.icon;
      const copy = document.createElement("span");
      copy.className = "shop-product-copy";
      const name = document.createElement("strong");
      name.textContent = product.item.name;
      const meta = document.createElement("small");
      meta.textContent = `🪙 ${formatCoins(product.item.price)} · ${product.owned} owned`;
      copy.append(name, meta);
      button.append(icon, copy);
      this.productList.append(button);
    }
  }

  renderDetail(product) {
    if (!product?.ok) return;
    if (this.detailIcon) this.detailIcon.textContent = product.item.icon;
    if (this.detailName) this.detailName.textContent = product.item.name;
    if (this.detailDescription) this.detailDescription.textContent = product.item.description || "Fresh Market stock.";
    if (this.detailPrice) this.detailPrice.textContent = `🪙 ${formatCoins(product.item.price)}`;
    if (this.detailOwned) this.detailOwned.textContent = `${formatCoins(product.owned)} owned`;
    if (this.buyButton) {
      this.buyButton.disabled = product.remainingCapacity < 1;
      this.buyButton.textContent = product.remainingCapacity < 1
        ? "Inventory limit reached"
        : `Buy 1 for 🪙 ${formatCoins(product.item.price)}`;
      this.buyButton.dataset.affordable = String(product.affordable);
      this.buyButton.setAttribute("aria-describedby", "shop-message");
    }
  }

  render() {
    const catalogue = this.shopService.getCatalogue(this.activeShopId);
    if (!catalogue.ok) return catalogue;
    if (this.title) this.title.textContent = `${catalogue.shop.icon} ${catalogue.shop.name}`;
    if (this.description) this.description.textContent = catalogue.shop.description;
    if (this.balance) this.balance.textContent = formatCoins(catalogue.balance);
    this.renderProducts(catalogue);
    const product = this.shopService.getProduct(this.activeShopId, this.selectedItemId);
    this.renderDetail(product);
    return catalogue;
  }

  buySelected() {
    const product = this.shopService.getProduct(this.activeShopId, this.selectedItemId);
    if (!product.ok) {
      this.showMessage(product.message, "error");
      return product;
    }
    const result = this.shopService.purchase(this.activeShopId, this.selectedItemId, 1);
    this.render();
    if (result.ok) {
      const owned = this.shopService.getProduct(this.activeShopId, this.selectedItemId).owned;
      this.showMessage(`${product.item.icon} ${product.item.name} added · ${owned} owned · 🪙 ${formatCoins(result.after)} left`, "success");
    } else if (result.code === "insufficient-funds") {
      this.showMessage(`You need 🪙 ${formatCoins(result.required - result.available)} more for ${product.item.name}.`, "error");
    } else {
      this.showMessage(result.message || "The purchase was not completed. No coins were spent.", "error");
    }
    this.buyButton?.focus({ preventScroll: true });
    return result;
  }

  focusableElements() {
    return [
      this.closeButton,
      ...(this.productList?.querySelectorAll("button") || []),
      this.buyButton,
    ].filter((element) => element && !element.disabled);
  }

  handleKeyDown(event) {
    if (!this.isOpen()) return;
    if (event.key === "Escape") {
      event.preventDefault();
      this.close();
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
    const next = event.shiftKey
      ? (current <= 0 ? focusable.length - 1 : current - 1)
      : (current + 1) % focusable.length;
    event.preventDefault();
    focusable[next]?.focus();
  }

  getDiagnostics() {
    const catalogue = this.activeShopId ? this.shopService.getCatalogue(this.activeShopId) : null;
    return {
      open: this.isOpen(),
      shopId: this.activeShopId,
      selectedItemId: this.selectedItemId,
      productCount: catalogue?.products?.length || 0,
    };
  }

  destroy() {
    this.closeButton?.removeEventListener("click", this.onClose);
    this.buyButton?.removeEventListener("click", this.onBuy);
    this.productList?.removeEventListener("click", this.onProductClick);
    document.removeEventListener("keydown", this.onKeyDown);
    this.unsubscribe?.();
  }
}
