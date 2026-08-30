import { INVENTORY_BUCKETS, ITEM_CATALOG, itemUseDestinationFor } from "../data/items.js";

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
  constructor(runtime, { onModalChange = () => {}, economy = null, aquarium = null, onUseConsumable = () => ({ ok: false }), onPlaceable = () => ({ ok: false }) } = {}) {
    this.runtime = runtime;
    this.onModalChange = onModalChange;
    this.economy = economy;
    this.aquarium = aquarium;
    this.onUseConsumable = onUseConsumable;
    this.onPlaceable = onPlaceable;
    this.coinButton = document.querySelector("#coin-status-button");
    this.inventoryButton = document.querySelector("#inventory-button");
    this.panel = document.querySelector("#economy-panel");
    this.closeButton = document.querySelector("#economy-panel-close");
    this.walletTab = document.querySelector("#economy-wallet-tab");
    this.inventoryTab = document.querySelector("#economy-inventory-tab");
    this.commerceTab = document.querySelector("#economy-commerce-tab");
    this.walletView = document.querySelector("#economy-wallet-view");
    this.inventoryView = document.querySelector("#economy-inventory-view");
    this.commerceView = document.querySelector("#commerce-view");
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
    this.onCommerceTab = () => this.showView("commerce");
    this.onInventoryClick = (event) => this.handleInventoryClick(event);
    this.onKeyDown = (event) => this.handleKeyDown(event);
    this.coinButton?.addEventListener("click", this.onCoinOpen);
    this.inventoryButton?.addEventListener("click", this.onInventoryOpen);
    this.closeButton?.addEventListener("click", this.onClose);
    this.walletTab?.addEventListener("click", this.onWalletTab);
    this.inventoryTab?.addEventListener("click", this.onInventoryTab);
    this.commerceTab?.addEventListener("click", this.onCommerceTab);
    this.inventoryGroups?.addEventListener("click", this.onInventoryClick);
    document.addEventListener("keydown", this.onKeyDown);
    this.unsubscribe = runtime.gameState.subscribe(() => this.render());
    this.render();
  }

  ownedEntries(state, bucket) {
    const quantities = { ...(state.inventory?.[bucket] || {}) };
    if (bucket === "consumables" && state.farming?.orchard?.purchasedSaplings > 0) {
      quantities["orchard-apple-sapling"] = state.farming.orchard.purchasedSaplings;
    }
    return Object.entries(quantities)
      .filter(([, quantity]) => quantity > 0)
      .map(([id, quantity]) => ({ item: ITEM_CATALOG[id], quantity }))
      .filter(({ item }) => item)
      .sort((a, b) => a.item.name.localeCompare(b.item.name));
  }

  renderInventory(state, aquarium = null) {
    if (!this.inventoryGroups) return;
    this.inventoryGroups.replaceChildren();
    for (const bucket of INVENTORY_BUCKETS) {
      const entries = this.ownedEntries(state, bucket);
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
          const action = document.createElement("span");
          action.className = "inventory-item-action";
          if (item.category === "equipment") {
            const equipped = state.inventory.equipped?.[item.slot] === item.id;
            if (equipped) action.textContent = "Equipped";
            else {
              const button = document.createElement("button");
              button.type = "button";
              button.dataset.equipItem = item.id;
              button.textContent = "Equip";
              action.append(button);
            }
          } else if (item.category === "consumable") {
            const button = document.createElement("button");
            button.type = "button";
            button.dataset.useItem = item.id;
            button.textContent = itemUseDestinationFor(item)?.label || "Use item";
            action.append(button);
          } else if (item.category === "placeable") {
            const button = document.createElement("button");
            button.type = "button";
            button.dataset.placeItem = item.id;
            button.textContent = "Place in town";
            action.append(button);
          } else if (item.category === "furniture") {
            const button = document.createElement("button");
            button.type = "button";
            button.dataset.placeItem = item.id;
            button.textContent = "Furnish home";
            action.append(button);
          } else action.textContent = `×${quantity}`;
          const count = document.createElement("strong");
          count.textContent = item.category === "equipment" ? "" : `×${quantity}`;
          entry.append(icon, name, count, action);
          list.append(entry);
        }
        section.append(list);
      }
      this.inventoryGroups.append(section);
    }
    if (aquarium?.owned) {
      const section = document.createElement("section");
      section.className = "inventory-group inventory-aquarium";
      const heading = document.createElement("h3");
      heading.textContent = `Home aquarium · ${aquarium.species.length}`;
      section.append(heading);
      if (!aquarium.species.length) {
        const empty = document.createElement("p");
        empty.className = "inventory-empty";
        empty.textContent = aquarium.placed ? "The tank is placed and ready for ornamental Reedbank catches." : "Place the tank in your resident's home before fishing to keep ornamental catches.";
        section.append(empty);
      } else {
        const list = document.createElement("ul");
        for (const species of aquarium.species) {
          const entry = document.createElement("li");
          const icon = document.createElement("span");
          icon.className = "inventory-item-icon";
          icon.setAttribute("aria-hidden", "true");
          icon.textContent = species.icon;
          const name = document.createElement("span");
          name.textContent = species.name;
          const count = document.createElement("strong");
          count.textContent = `×${species.count}`;
          const location = document.createElement("span");
          location.className = "inventory-item-action";
          location.textContent = aquarium.placed ? "At home" : "Safely released";
          entry.append(icon, name, count, location);
          list.append(entry);
        }
        section.append(list);
      }
      const summary = document.createElement("p");
      summary.className = "inventory-empty";
      summary.textContent = aquarium.placed ? `${aquarium.totalFish} fish at home` : "Place tank at home";
      section.append(summary);
      this.inventoryGroups.append(section);
    }
  }

  handleInventoryClick(event) {
    const equip = event.target.closest?.("[data-equip-item]");
    if (equip) {
      const result = this.economy?.equip?.(equip.dataset.equipItem, { reason: `Equipped ${ITEM_CATALOG[equip.dataset.equipItem]?.name || "tool"} from inventory` });
      if (!result?.ok && this.catalogueStatus) this.catalogueStatus.textContent = result?.message || "The tool change was not saved.";
      this.render();
      return result;
    }
    const use = event.target.closest?.("[data-use-item]");
    if (use) {
      const item = ITEM_CATALOG[use.dataset.useItem];
      this.close();
      return this.onUseConsumable(item);
    }
    const place = event.target.closest?.("[data-place-item]");
    if (place) {
      const item = ITEM_CATALOG[place.dataset.placeItem];
      this.close();
      return this.onPlaceable(item);
    }
    return null;
  }

  renderLedger(economy) {
    if (!this.ledger) return;
    this.ledger.replaceChildren();
    const entries = economy.ledger.slice(-16).reverse();
    for (const entry of entries) {
      const row = document.createElement("li");
      const reason = document.createElement("span");
      const item = ITEM_CATALOG[entry.itemId];
      reason.textContent = `${entry.reason}${item ? ` · ${item.icon}` : ""}`;
      const amount = document.createElement("strong");
      amount.className = entry.amount >= 0 ? "coin-positive" : "coin-negative";
      amount.textContent = `${entry.amount >= 0 ? "+" : "−"}${formatCoins(Math.abs(entry.amount))}`;
      row.append(reason, amount);
      this.ledger.append(row);
    }
  }

  render() {
    const state = this.runtime.gameState.getSnapshot();
    const aquarium = this.aquarium?.getSnapshot?.() || null;
    const saplings = Number(state.farming?.orchard?.purchasedSaplings) || 0;
    const saplingAlreadyInInventory = Number(state.inventory.consumables?.["orchard-apple-sapling"]) || 0;
    const ownedTypes = INVENTORY_BUCKETS.reduce((total, bucket) => total + Object.keys(state.inventory[bucket]).length, 0) + (saplings > 0 && saplingAlreadyInInventory < 1 ? 1 : 0);
    const ownedUnits = INVENTORY_BUCKETS.reduce((total, bucket) => total + Object.values(state.inventory[bucket]).reduce((sum, quantity) => sum + quantity, 0), 0) + saplings;
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
    if (this.catalogueStatus) this.catalogueStatus.textContent = `${ownedTypes} item types owned${aquarium?.owned ? ` · ${aquarium.totalFish} aquarium fish` : ""}`;
    this.renderLedger(state.economy);
    this.renderInventory(state, aquarium);
  }

  showView(view) {
    this.activeView = ["wallet", "inventory", "commerce"].includes(view) ? view : "inventory";
    const walletActive = this.activeView === "wallet";
    const inventoryActive = this.activeView === "inventory";
    const commerceActive = this.activeView === "commerce";
    this.walletTab?.setAttribute("aria-selected", String(walletActive));
    this.inventoryTab?.setAttribute("aria-selected", String(inventoryActive));
    this.commerceTab?.setAttribute("aria-selected", String(commerceActive));
    this.walletTab?.setAttribute("tabindex", walletActive ? "0" : "-1");
    this.inventoryTab?.setAttribute("tabindex", inventoryActive ? "0" : "-1");
    this.commerceTab?.setAttribute("tabindex", commerceActive ? "0" : "-1");
    this.walletView?.classList.toggle("hidden", !walletActive);
    this.inventoryView?.classList.toggle("hidden", !inventoryActive);
    this.commerceView?.classList.toggle("hidden", !commerceActive);
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
    const tabs = [this.walletTab, this.inventoryTab, this.commerceTab].filter(Boolean);
    if ((event.key === "ArrowLeft" || event.key === "ArrowRight") && tabs.includes(document.activeElement)) {
      event.preventDefault();
      const views = ["wallet", "inventory", "commerce"];
      const offset = event.key === "ArrowRight" ? 1 : -1;
      const view = views[(views.indexOf(this.activeView) + offset + views.length) % views.length];
      this.showView(view);
      ({ wallet: this.walletTab, inventory: this.inventoryTab, commerce: this.commerceTab }[view])?.focus();
      return;
    }
    if (event.key !== "Tab") return;
    const inventoryActions = this.activeView === "inventory" ? [...(this.inventoryGroups?.querySelectorAll("button") || [])] : [];
    const commerceActions = this.activeView === "commerce" ? [...(this.commerceView?.querySelectorAll("button, input") || [])] : [];
    const focusable = [this.closeButton, ...tabs, ...inventoryActions, ...commerceActions].filter((element) => element && !element.disabled);
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
    this.commerceTab?.removeEventListener("click", this.onCommerceTab);
    this.inventoryGroups?.removeEventListener("click", this.onInventoryClick);
    document.removeEventListener("keydown", this.onKeyDown);
    this.unsubscribe?.();
  }
}
