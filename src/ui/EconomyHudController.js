import { INVENTORY_BUCKETS, ITEM_CATALOG, ITEM_IDS } from "../data/items.js";

const BUCKET_LABELS = Object.freeze({
  equipment: "Tools",
  placeables: "Town items",
  consumables: "Food & supplies",
  furniture: "Furniture",
});

function formatCoins(value) {
  return new Intl.NumberFormat("en-GB").format(value);
}

export class EconomyHudController {
  constructor(runtime, { onModalChange = () => {} } = {}) {
    this.runtime = runtime;
    this.onModalChange = onModalChange;
    this.coinButton = document.querySelector("#coin-status-button");
    this.inventoryButton = document.querySelector("#inventory-button");
    this.panel = document.querySelector("#economy-panel");
    this.closeButton = document.querySelector("#economy-panel-close");
    this.walletTab = document.querySelector("#economy-wallet-tab");
    this.inventoryTab = document.querySelector("#economy-inventory-tab");
    this.walletView = document.querySelector("#economy-wallet-view");
    this.inventoryView = document.querySelector("#economy-inventory-view");
    this.balance = document.querySelector("#economy-balance");
    this.lifetime = document.querySelector("#economy-lifetime");
    this.ledger = document.querySelector("#economy-ledger");
    this.inventoryGroups = document.querySelector("#inventory-groups");
    this.catalogueStatus = document.querySelector("#catalogue-status");
    this.previousFocus = null;
    this.activeView = "inventory";

    this.onCoinOpen = () => this.open("wallet");
    this.onInventoryOpen = () => this.open("inventory");
    this.onClose = () => this.close();
    this.onWalletTab = () => this.showView("wallet");
    this.onInventoryTab = () => this.showView("inventory");
    this.onKeyDown = (event) => this.handleKeyDown(event);
    this.coinButton?.addEventListener("click", this.onCoinOpen);
    this.inventoryButton?.addEventListener("click", this.onInventoryOpen);
    this.closeButton?.addEventListener("click", this.onClose);
    this.walletTab?.addEventListener("click", this.onWalletTab);
    this.inventoryTab?.addEventListener("click", this.onInventoryTab);
    document.addEventListener("keydown", this.onKeyDown);
    this.unsubscribe = runtime.gameState.subscribe(() => this.render());
    this.render();
  }

  ownedEntries(inventory, bucket) {
    return Object.entries(inventory[bucket] || {})
      .filter(([, quantity]) => quantity > 0)
      .map(([id, quantity]) => ({ item: ITEM_CATALOG[id], quantity }))
      .filter(({ item }) => item)
      .sort((a, b) => a.item.name.localeCompare(b.item.name));
  }

  renderInventory(inventory) {
    if (!this.inventoryGroups) return;
    this.inventoryGroups.replaceChildren();
    for (const bucket of INVENTORY_BUCKETS) {
      const entries = this.ownedEntries(inventory, bucket);
      const section = document.createElement("section");
      section.className = "inventory-group";
      const heading = document.createElement("h3");
      heading.textContent = `${BUCKET_LABELS[bucket]} · ${entries.length}`;
      section.append(heading);
      if (!entries.length) {
        const empty = document.createElement("p");
        empty.className = "inventory-empty";
        empty.textContent = "Nothing here yet.";
        section.append(empty);
      } else {
        const list = document.createElement("ul");
        for (const { item, quantity } of entries) {
          const entry = document.createElement("li");
          const icon = document.createElement("span");
          icon.className = "inventory-item-icon";
          icon.setAttribute("aria-hidden", "true");
          icon.textContent = item.icon;
          const name = document.createElement("span");
          name.textContent = item.name;
          const count = document.createElement("strong");
          count.textContent = `×${quantity}`;
          entry.append(icon, name, count);
          list.append(entry);
        }
        section.append(list);
      }
      this.inventoryGroups.append(section);
    }
  }

  renderLedger(economy) {
    if (!this.ledger) return;
    this.ledger.replaceChildren();
    const entries = economy.ledger.slice(-8).reverse();
    for (const entry of entries) {
      const row = document.createElement("li");
      const reason = document.createElement("span");
      reason.textContent = entry.reason;
      const amount = document.createElement("strong");
      amount.className = entry.amount >= 0 ? "coin-positive" : "coin-negative";
      amount.textContent = `${entry.amount >= 0 ? "+" : "−"}${formatCoins(Math.abs(entry.amount))}`;
      row.append(reason, amount);
      this.ledger.append(row);
    }
  }

  render() {
    const state = this.runtime.gameState.getSnapshot();
    const ownedTypes = INVENTORY_BUCKETS.reduce((total, bucket) => total + Object.keys(state.inventory[bucket]).length, 0);
    const ownedUnits = INVENTORY_BUCKETS.reduce((total, bucket) => total + Object.values(state.inventory[bucket]).reduce((sum, quantity) => sum + quantity, 0), 0);
    if (this.coinButton) {
      this.coinButton.textContent = `🪙 ${formatCoins(state.economy.coins)}`;
      this.coinButton.setAttribute("aria-label", `${formatCoins(state.economy.coins)} KindlyCoins. Open wallet.`);
    }
    if (this.inventoryButton) {
      this.inventoryButton.textContent = `🎒 ${ownedUnits}`;
      this.inventoryButton.setAttribute("aria-label", `${ownedUnits} owned items across ${ownedTypes} types. Open inventory.`);
    }
    if (this.balance) this.balance.textContent = formatCoins(state.economy.coins);
    if (this.lifetime) this.lifetime.textContent = `${formatCoins(state.economy.lifetimeCoinsEarned)} earned · ${formatCoins(state.economy.lifetimeCoinsSpent)} spent`;
    if (this.catalogueStatus) this.catalogueStatus.textContent = `${ITEM_IDS.length} legacy item definitions ready · ${ownedTypes} types currently owned`;
    this.renderLedger(state.economy);
    this.renderInventory(state.inventory);
  }

  showView(view) {
    this.activeView = view === "wallet" ? "wallet" : "inventory";
    const walletActive = this.activeView === "wallet";
    this.walletTab?.setAttribute("aria-selected", String(walletActive));
    this.inventoryTab?.setAttribute("aria-selected", String(!walletActive));
    this.walletTab?.setAttribute("tabindex", walletActive ? "0" : "-1");
    this.inventoryTab?.setAttribute("tabindex", walletActive ? "-1" : "0");
    this.walletView?.classList.toggle("hidden", !walletActive);
    this.inventoryView?.classList.toggle("hidden", walletActive);
  }

  open(view = "inventory") {
    if (!this.panel) return;
    this.previousFocus = document.activeElement;
    this.render();
    this.showView(view);
    this.panel.classList.remove("hidden");
    this.panel.setAttribute("aria-hidden", "false");
    this.onModalChange(true);
    this.closeButton?.focus({ preventScroll: true });
  }

  close() {
    if (!this.panel || this.panel.classList.contains("hidden")) return;
    this.panel.classList.add("hidden");
    this.panel.setAttribute("aria-hidden", "true");
    this.onModalChange(false);
    this.previousFocus?.focus?.({ preventScroll: true });
  }

  handleKeyDown(event) {
    if (!this.panel || this.panel.classList.contains("hidden")) return;
    if (event.key === "Escape") {
      event.preventDefault();
      this.close();
      return;
    }
    if ((event.key === "ArrowLeft" || event.key === "ArrowRight") && [this.walletTab, this.inventoryTab].includes(document.activeElement)) {
      event.preventDefault();
      const view = this.activeView === "wallet" ? "inventory" : "wallet";
      this.showView(view);
      (view === "wallet" ? this.walletTab : this.inventoryTab)?.focus();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = [this.closeButton, this.walletTab, this.inventoryTab].filter(Boolean);
    const current = focusable.indexOf(document.activeElement);
    const next = event.shiftKey
      ? (current <= 0 ? focusable.length - 1 : current - 1)
      : (current + 1) % focusable.length;
    event.preventDefault();
    focusable[next].focus();
  }

  destroy() {
    this.coinButton?.removeEventListener("click", this.onCoinOpen);
    this.inventoryButton?.removeEventListener("click", this.onInventoryOpen);
    this.closeButton?.removeEventListener("click", this.onClose);
    this.walletTab?.removeEventListener("click", this.onWalletTab);
    this.inventoryTab?.removeEventListener("click", this.onInventoryTab);
    document.removeEventListener("keydown", this.onKeyDown);
    this.unsubscribe?.();
  }
}
