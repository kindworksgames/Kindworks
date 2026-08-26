import { HOMEOWNER_GIFT_TIER_LABELS } from "../data/homeownerGifts.js";
import { houseInteriorMetadata } from "../data/homeInteriors.js";
import { ITEM_CATALOG } from "../data/items.js";

export class HomeownerGiftController {
  constructor(service, {
    onModalChange = () => {},
    canOpen = () => true,
    onUseItem = () => ({ ok: true }),
  } = {}) {
    this.service = service;
    this.onModalChange = onModalChange;
    this.canOpen = canOpen;
    this.onUseItem = onUseItem;
    this.current = null;
    this.phase = "message";
    this.previousFocus = null;
    this.panel = document.querySelector("#homeowner-gift-panel");
    this.owner = document.querySelector("#homeowner-gift-owner");
    this.home = document.querySelector("#homeowner-gift-home");
    this.message = document.querySelector("#homeowner-gift-message");
    this.present = document.querySelector("#homeowner-gift-present");
    this.icon = document.querySelector("#homeowner-gift-icon");
    this.name = document.querySelector("#homeowner-gift-name");
    this.value = document.querySelector("#homeowner-gift-value");
    this.tier = document.querySelector("#homeowner-gift-tier");
    this.status = document.querySelector("#homeowner-gift-status");
    this.continueButton = document.querySelector("#homeowner-gift-continue");
    this.keepButton = document.querySelector("#homeowner-gift-keep");
    this.useButton = document.querySelector("#homeowner-gift-use");
    this.onContinue = () => this.reveal();
    this.onKeep = () => this.finish(false);
    this.onUse = () => this.finish(true);
    this.onKeyDown = (event) => this.handleKeyDown(event);
    this.continueButton?.addEventListener("click", this.onContinue);
    this.keepButton?.addEventListener("click", this.onKeep);
    this.useButton?.addEventListener("click", this.onUse);
    this.panel?.addEventListener("keydown", this.onKeyDown);
    this.unsubscribe = this.service.gameState.subscribe(() => setTimeout(() => this.maybeOpen(), 0));
    this.poll = window.setInterval(() => this.maybeOpen(), 500);
  }

  maybeOpen() {
    if (!this.panel || this.current || !this.canOpen()) return false;
    const record = this.service.getNext();
    if (!record) return false;
    this.current = record;
    this.phase = "message";
    this.previousFocus = document.activeElement;
    this.owner.textContent = record.ownerName;
    this.home.textContent = `${houseInteriorMetadata(record.houseId).name} · Day ${record.day}`;
    this.message.textContent = record.dialogue;
    this.icon.textContent = record.itemIcon;
    this.name.textContent = record.itemName;
    this.value.textContent = `Worth 🪙 ${record.price.toLocaleString()}`;
    this.tier.textContent = HOMEOWNER_GIFT_TIER_LABELS[record.tier] || "Neighbour gift";
    this.tier.dataset.tier = record.tier;
    this.status.textContent = record.fullCare ? "A special thank-you for caring for this home inside and out." : "The gift is already saved safely in your inventory.";
    this.status.dataset.status = "neutral";
    this.continueButton.textContent = `See ${record.ownerName}’s gift`;
    const item = ITEM_CATALOG[record.itemId];
    this.useButton.textContent = item?.category === "equipment" ? "Equip now" : item?.category === "furniture" ? "Furnish now" : "Place now";
    this.panel.dataset.phase = "message";
    this.panel.classList.remove("hidden");
    this.panel.setAttribute("aria-hidden", "false");
    document.body.dataset.homeownerGift = record.id;
    this.onModalChange(true);
    requestAnimationFrame(() => this.continueButton?.focus?.({ preventScroll: true }));
    return true;
  }

  reveal() {
    if (!this.current) return { ok: false, code: "no-homeowner-gift" };
    this.phase = "gift";
    this.panel.dataset.phase = "gift";
    if (!window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) {
      try { navigator.vibrate?.([22, 35, 55]); } catch { /* Haptics are optional. */ }
    }
    requestAnimationFrame(() => this.keepButton?.focus?.({ preventScroll: true }));
    return { ok: true, code: "homeowner-gift-revealed" };
  }

  finish(useNow) {
    if (!this.current) return { ok: false, code: "no-homeowner-gift" };
    if (this.phase !== "gift") return this.reveal();
    const record = this.current;
    const result = this.service.acknowledge(record.id);
    if (!result.ok) {
      this.status.textContent = result.message || "The gift is still waiting safely. Please try again.";
      this.status.dataset.status = "error";
      return result;
    }
    this.current = null;
    this.panel.classList.add("hidden");
    this.panel.setAttribute("aria-hidden", "true");
    this.panel.dataset.phase = "message";
    document.body.dataset.homeownerGift = "none";
    this.onModalChange(false);
    if (useNow) this.onUseItem(ITEM_CATALOG[record.itemId], record);
    else this.previousFocus?.focus?.({ preventScroll: true });
    this.previousFocus = null;
    setTimeout(() => this.maybeOpen(), 180);
    return result;
  }

  handleKeyDown(event) {
    if (!this.current) return;
    if (event.key === "Escape") {
      event.preventDefault();
      if (this.phase === "message") this.reveal();
      else this.finish(false);
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = this.phase === "message" ? [this.continueButton] : [this.keepButton, this.useButton];
    const available = focusable.filter(Boolean);
    if (!available.length) return;
    event.preventDefault();
    const currentIndex = available.indexOf(document.activeElement);
    const direction = event.shiftKey ? -1 : 1;
    available[(currentIndex + direction + available.length) % available.length].focus?.({ preventScroll: true });
  }

  getDiagnostics() {
    return {
      open: Boolean(this.current),
      phase: this.phase,
      current: this.current ? structuredClone(this.current) : null,
      accessibleDialog: this.panel?.getAttribute("role") === "dialog",
      focusTrap: true,
      keyboardDismissKeepsGift: true,
      twoStageReveal: true,
    };
  }
}
