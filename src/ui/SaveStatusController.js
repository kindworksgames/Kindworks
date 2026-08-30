import { createFreshGameState, validateGameState } from "../state/GameState.js";

const NEW_GAME_CONFIRMATION_DELAY_MS = 700;

export class SaveStatusController {
  constructor(runtime, { onModalChange = () => {}, onNewGame = () => {}, now = () => Date.now() } = {}) {
    this.runtime = runtime;
    this.onModalChange = onModalChange;
    this.onNewGame = onNewGame;
    this.now = now;
    this.resetArmed = false;
    this.resetArmedAt = 0;
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
    this.onPrimary = () => this.runPrimaryAction();
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
    if (import.meta.env.DEV && game) {
      game.dataset.saveStatus = status.hasCurrent ? "healthy" : status.hasRecovery ? "attention" : "not-started";
      game.dataset.saveSchema = "2";
      game.dataset.legacyDetected = String(status.legacyAvailable);
      game.dataset.legacyUntouched = "true";
    }
    if (this.button) {
      this.button.textContent = status.hasCurrent ? "✓ Saved" : status.legacyAvailable ? "⚠ Save" : "Save";
      this.button.setAttribute("aria-label", status.hasCurrent
        ? "Save healthy. Open save details."
        : status.legacyAvailable
          ? `Legacy save version ${status.legacyVersion} found. Open save details.`
          : "Save not started. Open save details.");
      this.button.dataset.status = status.hasCurrent ? "healthy" : status.legacyAvailable ? "legacy" : "new";
    }
    if (!this.title || !this.message || !this.details || !this.primary) return;
    if (status.hasCurrent) {
      this.title.textContent = "Your save is healthy";
      this.message.textContent = "Your Willowmere progress is safely stored on this device.";
      this.details.textContent = this.resetArmed
        ? "Your current progress will remain available as the verified backup. Choose confirm only if you want to begin again."
        : status.hasBackup ? "A verified backup is also available." : "The first verified backup will be created before a later save replaces this one.";
      this.primary.textContent = this.resetArmed ? "Confirm new game" : "Start new game";
      this.primary.dataset.action = this.resetArmed ? "confirm-new-game" : "arm-new-game";
      this.primary.classList.remove("hidden");
    } else if (status.legacyAvailable) {
      this.title.textContent = "Earlier KindWorks progress found";
      this.message.textContent = "You can bring your earlier progress into this version of KindWorks.";
      this.details.textContent = "Your original progress will remain available as a backup.";
      this.primary.textContent = "Bring progress across";
      this.primary.classList.remove("hidden");
    } else {
      this.title.textContent = "Safe saves are ready";
      this.message.textContent = "No earlier progress was found on this device. You can start a new Willowmere save.";
      this.details.textContent = "A backup will be kept automatically as you play.";
      this.primary.textContent = "Start a new save";
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
    this.resetArmed = false;
    this.resetArmedAt = 0;
    this.panel.classList.add("hidden");
    this.panel.setAttribute("aria-hidden", "true");
    this.onModalChange(false);
    this.previousFocus?.focus?.({ preventScroll: true });
  }

  runPrimaryAction() {
    const status = this.getStatus();
    if (!status.hasCurrent) return this.createSafeSave();
    if (!this.resetArmed) {
      this.resetArmed = true;
      this.resetArmedAt = this.now();
      this.render();
      return { ok: false, code: "new-game-confirmation-required" };
    }
    if (this.now() - this.resetArmedAt < NEW_GAME_CONFIRMATION_DELAY_MS) return { ok: false, code: "new-game-confirmation-delay" };
    return this.startNewGame();
  }

  createSafeSave() {
    const selected = this.runtime.legacyInspection.selected;
    const state = selected
      ? this.runtime.legacyImporter.createImportedState(selected)
      : this.runtime.gameState.getSnapshot();
    const validation = validateGameState(state);
    const result = validation.ok ? this.runtime.repository.save(state) : validation;
    if (!result.ok) {
      this.title.textContent = "The save was not created";
      this.message.textContent = "Kindworks kept the existing data unchanged.";
      this.details.textContent = result.reason || result.errors?.join(" ") || "Storage is unavailable in this browser.";
      return result;
    }
    const replaced = this.runtime.gameState.replace(state);
    if (!replaced.ok) return replaced;
    this.render();
    return result;
  }

  startNewGame() {
    const checkpoint = this.runtime.gameState.getSnapshot();
    const fresh = createFreshGameState({ now: this.now() });
    const saved = this.runtime.repository.save(fresh, { now: this.now() });
    if (!saved.ok) {
      this.title.textContent = "The new game was not started";
      this.message.textContent = "Your current progress is unchanged.";
      this.details.textContent = saved.reason || saved.errors?.join(" ") || "Storage is unavailable in this browser.";
      return saved;
    }
    const replaced = this.runtime.gameState.replace(fresh);
    if (!replaced.ok) {
      this.runtime.repository.save(checkpoint, { now: this.now() });
      return replaced;
    }
    this.resetArmed = false;
    this.resetArmedAt = 0;
    this.render();
    this.onNewGame({ save: saved, state: this.runtime.gameState.getSnapshot() });
    return { ...saved, code: "new-game-started" };
  }

  destroy() {
    this.button?.removeEventListener("click", this.onOpen);
    this.closeButton?.removeEventListener("click", this.onClose);
    this.primary?.removeEventListener("click", this.onPrimary);
    document.removeEventListener("keydown", this.onKeyDown);
  }
}
