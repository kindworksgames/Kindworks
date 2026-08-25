export class SaveStatusController {
  constructor(runtime, { onModalChange = () => {} } = {}) {
    this.runtime = runtime;
    this.onModalChange = onModalChange;
    this.button = document.querySelector("#save-status-button");
    this.panel = document.querySelector("#save-panel");
    this.title = document.querySelector("#save-panel-title");
    this.message = document.querySelector("#save-panel-message");
    this.details = document.querySelector("#save-panel-details");
    this.primary = document.querySelector("#save-panel-primary");
    this.closeButton = document.querySelector("#save-panel-close");
    this.previousFocus = null;
    this.onOpen = () => this.open();
    this.onClose = () => this.close();
    this.onPrimary = () => this.createSafeSave();
    this.onKeyDown = (event) => {
      if (this.panel?.classList.contains("hidden")) return;
      if (event.key === "Escape") this.close();
      if (event.key === "Tab") {
        const focusable = [this.closeButton, this.primary]
          .filter((element) => element && !element.classList.contains("hidden"));
        if (!focusable.length) return;
        const current = focusable.indexOf(document.activeElement);
        const next = event.shiftKey
          ? (current <= 0 ? focusable.length - 1 : current - 1)
          : (current + 1) % focusable.length;
        event.preventDefault();
        focusable[next].focus();
      }
    };
    this.button?.addEventListener("click", this.onOpen);
    this.closeButton?.addEventListener("click", this.onClose);
    this.primary?.addEventListener("click", this.onPrimary);
    document.addEventListener("keydown", this.onKeyDown);
    this.render();
  }

  getStatus() {
    const diagnostics = this.runtime.repository.getDiagnostics();
    const legacy = this.runtime.legacyInspection.selected;
    return {
      ...diagnostics,
      legacyAvailable: Boolean(legacy),
      legacyVersion: legacy?.legacyVersion ?? null,
      legacySourceKey: legacy?.sourceKey ?? null,
      stateSource: this.runtime.gameState.getSnapshot().source.kind,
    };
  }

  render() {
    const status = this.getStatus();
    const game = document.querySelector("#game");
    if (game) {
      game.dataset.saveStatus = status.hasCurrent ? "healthy" : status.hasRecovery ? "attention" : "not-started";
      game.dataset.saveSchema = "1";
      game.dataset.legacyDetected = String(status.legacyAvailable);
      game.dataset.legacyUntouched = "true";
    }
    if (this.button) {
      this.button.textContent = status.hasCurrent ? "✓ Save healthy" : status.legacyAvailable ? `Legacy save v${status.legacyVersion} found` : "Save not started";
      this.button.dataset.status = status.hasCurrent ? "healthy" : status.legacyAvailable ? "legacy" : "new";
    }
    if (!this.title || !this.message || !this.details || !this.primary) return;
    if (status.hasCurrent) {
      this.title.textContent = "Your Phaser save is healthy";
      this.message.textContent = "Kindworks is using its separate Phaser save area. The original HTML save remains untouched.";
      this.details.textContent = status.hasBackup ? "A verified backup is also available." : "The first verified backup will be created before a later save replaces this one.";
      this.primary.classList.add("hidden");
    } else if (status.legacyAvailable) {
      this.title.textContent = "A legacy Kindworks save was found";
      this.message.textContent = `Version ${status.legacyVersion} can be copied into the new Phaser save area. This will not edit or delete the original HTML save.`;
      this.details.textContent = "The complete legacy snapshot is preserved for later economy, inventory, NPC, animal and progression migrations.";
      this.primary.textContent = "Create safe Phaser copy";
      this.primary.classList.remove("hidden");
    } else {
      this.title.textContent = "Safe saves are ready";
      this.message.textContent = "No legacy save was found for this web address. You can create a new Phaser save without affecting the original HTML game.";
      this.details.textContent = "The new save uses a checked, versioned envelope with separate backup and recovery storage.";
      this.primary.textContent = "Create new Phaser save";
      this.primary.classList.remove("hidden");
    }
  }

  open() {
    if (!this.panel) return;
    this.previousFocus = document.activeElement;
    this.render();
    this.panel.classList.remove("hidden");
    this.panel.setAttribute("aria-hidden", "false");
    this.onModalChange(true);
    this.closeButton?.focus({ preventScroll: true });
  }

  close() {
    if (!this.panel) return;
    this.panel.classList.add("hidden");
    this.panel.setAttribute("aria-hidden", "true");
    this.onModalChange(false);
    this.previousFocus?.focus?.({ preventScroll: true });
  }

  createSafeSave() {
    const selected = this.runtime.legacyInspection.selected;
    const state = selected
      ? this.runtime.legacyImporter.createImportedState(selected)
      : this.runtime.gameState.getSnapshot();
    const replaced = this.runtime.gameState.replace(state);
    const result = replaced.ok ? this.runtime.repository.save(state) : replaced;
    if (!result.ok) {
      this.title.textContent = "The save was not created";
      this.message.textContent = "Kindworks kept the existing data unchanged.";
      this.details.textContent = result.reason || result.errors?.join(" ") || "Storage is unavailable in this browser.";
      return result;
    }
    this.render();
    return result;
  }

  destroy() {
    this.button?.removeEventListener("click", this.onOpen);
    this.closeButton?.removeEventListener("click", this.onClose);
    this.primary?.removeEventListener("click", this.onPrimary);
    document.removeEventListener("keydown", this.onKeyDown);
  }
}
