export class TownMenuController {
  constructor({ documentObject = document, onModalChange = () => {}, canOpen = () => true } = {}) {
    this.document = documentObject;
    this.onModalChange = onModalChange;
    this.canOpen = canOpen;
    this.button = this.document.querySelector("#town-menu-button");
    this.panel = this.document.querySelector("#town-menu-panel");
    this.closeButton = this.document.querySelector("#town-menu-close");
    this.previousFocus = null;
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.button?.addEventListener("click", () => this.toggle());
    this.closeButton?.addEventListener("click", () => this.close());
    // Close in the capture phase so the selected destination can open in the
    // normal bubble phase without the town-menu pause reason blocking it.
    this.panel?.addEventListener("click", (event) => {
      if (event.target.closest?.(".town-menu-actions button")) this.close({ restoreFocus: false });
    }, true);
    this.document.addEventListener("keydown", this.handleKeyDown);
  }

  isOpen() { return Boolean(this.panel && !this.panel.classList.contains("hidden")); }

  open() {
    if (!this.panel || !this.button || !this.canOpen()) return { ok: false, code: "town-menu-unavailable" };
    this.previousFocus = this.document.activeElement;
    this.panel.classList.remove("hidden");
    this.panel.setAttribute("aria-hidden", "false");
    this.button.setAttribute("aria-expanded", "true");
    this.document.body.dataset.townMenuOpen = "true";
    this.onModalChange(true);
    this.closeButton?.focus?.({ preventScroll: true });
    return { ok: true };
  }

  close({ restoreFocus = true } = {}) {
    if (!this.isOpen()) return { ok: false, code: "town-menu-closed" };
    this.panel.classList.add("hidden");
    this.panel.setAttribute("aria-hidden", "true");
    this.button?.setAttribute("aria-expanded", "false");
    this.document.body.dataset.townMenuOpen = "false";
    this.onModalChange(false);
    if (restoreFocus) this.previousFocus?.focus?.({ preventScroll: true });
    return { ok: true };
  }

  toggle() { return this.isOpen() ? this.close() : this.open(); }

  handleKeyDown(event) {
    if (event.key === "Escape" && this.isOpen()) {
      event.preventDefault();
      this.close();
      return;
    }
    if (event.key === "Tab" && this.isOpen()) {
      const focusable = [this.closeButton, ...this.panel.querySelectorAll(".town-menu-actions button")]
        .filter((element) => element && !element.disabled && element.getAttribute("aria-hidden") !== "true");
      if (!focusable.length) return;
      const current = focusable.indexOf(this.document.activeElement);
      const next = event.shiftKey
        ? (current <= 0 ? focusable.length - 1 : current - 1)
        : (current + 1) % focusable.length;
      event.preventDefault();
      focusable[next].focus?.({ preventScroll: true });
    }
  }

  getDiagnostics() {
    return { open: this.isOpen(), secondaryActions: this.panel?.querySelectorAll?.(".town-menu-actions button")?.length || 0 };
  }
}
