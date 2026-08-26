import { RESTORATION_MILESTONES } from "../data/restorationMilestones.js";

export class RestorationMilestoneController {
  constructor(service, {
    onModalChange = () => {},
    canOpen = () => true,
    onFocus = () => {},
    onReaction = () => {},
  } = {}) {
    this.service = service;
    this.onModalChange = onModalChange;
    this.canOpen = canOpen;
    this.onFocus = onFocus;
    this.onReaction = onReaction;
    this.openId = null;
    this.panel = document.querySelector("#restoration-milestone-reveal");
    this.icon = document.querySelector("#restoration-milestone-icon");
    this.title = document.querySelector("#restoration-milestone-title");
    this.text = document.querySelector("#restoration-milestone-text");
    this.change = document.querySelector("#restoration-milestone-change");
    this.gift = document.querySelector("#restoration-milestone-gift");
    this.dismissButton = document.querySelector("#restoration-milestone-dismiss");
    this.onDismiss = () => this.dismiss();
    this.onKeyDown = (event) => {
      if (!this.openId) return;
      if (event.key === "Escape") {
        event.preventDefault();
        this.dismiss();
      } else if (event.key === "Tab") {
        event.preventDefault();
        this.dismissButton?.focus?.({ preventScroll: true });
      }
    };
    this.dismissButton?.addEventListener("click", this.onDismiss);
    this.panel?.addEventListener("keydown", this.onKeyDown);
    this.unsubscribe = this.service.gameState.subscribe(() => setTimeout(() => this.maybeOpen(), 0));
  }

  maybeOpen() {
    if (!this.panel || this.openId || !this.canOpen()) return false;
    const snapshot = this.service.getSnapshot();
    const id = snapshot.pending[0];
    const definition = RESTORATION_MILESTONES[id];
    if (!definition) return false;
    this.openId = id;
    this.icon.textContent = definition.icon;
    this.title.textContent = definition.title;
    this.text.textContent = definition.text;
    this.change.textContent = definition.change;
    this.gift.classList.toggle("hidden", id !== "wake" || !snapshot.firstRestorationGift.granted);
    this.panel.classList.remove("hidden");
    this.panel.setAttribute("aria-hidden", "false");
    document.body.dataset.restorationReveal = id;
    this.onModalChange(true);
    this.onFocus(definition.focus, id);
    this.onReaction(id, definition.focus);
    this.playChime(id);
    if (!window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) {
      try {
        navigator.vibrate?.([28, 45, 70]);
      } catch {
        // Haptics are optional and may be blocked by the browser or device policy.
      }
    }
    requestAnimationFrame(() => this.dismissButton?.focus?.({ preventScroll: true }));
    return true;
  }

  dismiss() {
    if (!this.openId) return { ok: false, code: "no-restoration-reveal" };
    const id = this.openId;
    const result = this.service.markRevealed(id);
    if (!result.ok) return result;
    this.openId = null;
    this.panel.classList.add("hidden");
    this.panel.setAttribute("aria-hidden", "true");
    document.body.dataset.restorationReveal = "none";
    this.onModalChange(false);
    setTimeout(() => this.maybeOpen(), 180);
    return result;
  }

  playChime(id) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return false;
    try {
      const context = new AudioContextClass();
      const gain = context.createGain();
      gain.gain.setValueAtTime(0.0001, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.075, context.currentTime + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.85);
      gain.connect(context.destination);
      const notes = id === "festival" ? [523.25, 659.25, 783.99, 1046.5] : [392, 523.25, 659.25];
      notes.forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        oscillator.type = "triangle";
        oscillator.frequency.setValueAtTime(frequency, context.currentTime + index * 0.1);
        oscillator.connect(gain);
        oscillator.start(context.currentTime + index * 0.1);
        oscillator.stop(context.currentTime + 0.72 + index * 0.1);
      });
      setTimeout(() => context.close?.(), 1300);
      return true;
    } catch {
      return false;
    }
  }

  getDiagnostics() {
    return {
      open: Boolean(this.openId),
      current: this.openId,
      accessibleDialog: Boolean(this.panel?.getAttribute("role") === "dialog"),
      revealAnimation: true,
      restorationChime: true,
      residentReaction: true,
    };
  }
}
