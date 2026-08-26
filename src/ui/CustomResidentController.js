import {
  CUSTOM_RESIDENT_APPEARANCE,
  CUSTOM_RESIDENT_HOBBIES,
  PERSONAL_HOME_OPTIONS,
  personalHomeLevel,
} from "../data/customResident.js";

function cssColor(number) {
  return `#${Number(number).toString(16).padStart(6, "0")}`;
}

export class CustomResidentController {
  constructor(service, {
    onModalChange = () => {},
    onLocate = () => ({ ok: false }),
    onStartControl = () => ({ ok: false }),
    onEndControl = () => ({ ok: false }),
  } = {}) {
    this.service = service;
    this.onModalChange = onModalChange;
    this.onLocate = onLocate;
    this.onStartControl = onStartControl;
    this.onEndControl = onEndControl;
    this.openButton = document.querySelector("#custom-resident-button");
    this.panel = document.querySelector("#custom-resident-panel");
    this.closeButton = document.querySelector("#custom-resident-close");
    this.form = document.querySelector("#custom-resident-form");
    this.nameInput = document.querySelector("#resident-name");
    this.nameError = document.querySelector("#resident-name-error");
    this.hobbyGrid = document.querySelector("#resident-hobbies");
    this.hobbyCount = document.querySelector("#resident-hobby-count");
    this.submitButton = document.querySelector("#custom-resident-save");
    this.locateButton = document.querySelector("#custom-resident-locate");
    this.controlButton = document.querySelector("#custom-resident-control");
    this.status = document.querySelector("#custom-resident-status");
    this.preview = document.querySelector("#custom-resident-preview");
    this.previewName = document.querySelector("#custom-resident-preview-name");
    this.previewSummary = document.querySelector("#custom-resident-preview-summary");
    this.homePreview = document.querySelector("#personal-home-preview");
    this.homePreviewLabel = document.querySelector("#personal-home-preview-label");
    this.homeDesignLegend = document.querySelector("#personal-home-design-legend");
    this.homeProgression = document.querySelector("#personal-home-progression");
    this.homeLevels = document.querySelector("#personal-home-levels");
    this.homeCapacity = document.querySelector("#personal-home-capacity");
    this.homeBalance = document.querySelector("#personal-home-balance");
    this.homeQuote = document.querySelector("#personal-home-quote");
    this.homeRedesignButton = document.querySelector("#personal-home-redesign");
    this.homeUpgradeButton = document.querySelector("#personal-home-upgrade");
    this.controlBanner = document.querySelector("#resident-control-banner");
    this.controlBannerName = document.querySelector("#resident-control-name");
    this.returnButton = document.querySelector("#resident-control-return");
    this.previousFocus = null;

    this.onOpenClick = () => this.open();
    this.onCloseClick = () => this.close();
    this.onSubmit = (event) => { event.preventDefault(); this.save(); };
    this.onFormInput = () => { this.clearError(); this.renderPreview(); };
    this.onHobbyChange = (event) => this.handleHobbyChange(event);
    this.onLocateClick = () => this.locate();
    this.onControlClick = () => this.startControl();
    this.onReturnClick = () => this.endControl();
    this.onHomeRedesignClick = () => this.redesignHome();
    this.onHomeUpgradeClick = () => this.upgradeHome();
    this.onKeyDown = (event) => this.handleKeyDown(event);
    this.openButton?.addEventListener("click", this.onOpenClick);
    this.closeButton?.addEventListener("click", this.onCloseClick);
    this.form?.addEventListener("submit", this.onSubmit);
    this.form?.addEventListener("input", this.onFormInput);
    this.hobbyGrid?.addEventListener("change", this.onHobbyChange);
    this.locateButton?.addEventListener("click", this.onLocateClick);
    this.controlButton?.addEventListener("click", this.onControlClick);
    this.returnButton?.addEventListener("click", this.onReturnClick);
    this.homeRedesignButton?.addEventListener("click", this.onHomeRedesignClick);
    this.homeUpgradeButton?.addEventListener("click", this.onHomeUpgradeClick);
    document.addEventListener("keydown", this.onKeyDown);
    this.unsubscribe = service.subscribe(() => this.render());
    this.populateForm();
    this.render();
  }

  isOpen() {
    return Boolean(this.panel && !this.panel.classList.contains("hidden"));
  }

  populateForm() {
    const state = this.service.getSnapshot();
    const profile = state.profile || {
      name: "", skin: "warm", hair: 0, hairColor: "dark-brown", accessory: "none", outfit: 0, bodyBuild: "average", hobbies: [],
    };
    if (this.nameInput) this.nameInput.value = profile.name;
    for (const [name, value] of Object.entries({
      skin: profile.skin,
      hair: profile.hair,
      hairColor: profile.hairColor,
      accessory: profile.accessory,
      outfit: profile.outfit,
      bodyBuild: profile.bodyBuild,
      wallColor: state.home.wallColor,
      roofStyle: state.home.roofStyle,
      roofColor: state.home.roofColor,
    })) {
      const field = this.form?.elements?.namedItem(name);
      if (field) field.value = String(value);
    }
    for (const input of this.hobbyGrid?.querySelectorAll('input[name="hobby"]') || []) input.checked = profile.hobbies.includes(input.value);
    this.renderPreview();
  }

  readDraft() {
    const data = new FormData(this.form);
    return {
      name: data.get("name"),
      skin: data.get("skin"),
      hair: Number(data.get("hair")),
      hairColor: data.get("hairColor"),
      accessory: data.get("accessory"),
      outfit: Number(data.get("outfit")),
      bodyBuild: data.get("bodyBuild"),
      hobbies: data.getAll("hobby"),
      home: {
        wallColor: data.get("wallColor"),
        roofStyle: data.get("roofStyle"),
        roofColor: data.get("roofColor"),
      },
    };
  }

  renderPreview() {
    if (!this.form) return;
    const draft = this.readDraft();
    const outfit = CUSTOM_RESIDENT_APPEARANCE.outfit[draft.outfit] || CUSTOM_RESIDENT_APPEARANCE.outfit[0];
    this.preview?.style.setProperty("--resident-skin", cssColor(CUSTOM_RESIDENT_APPEARANCE.skin[draft.skin]?.color || CUSTOM_RESIDENT_APPEARANCE.skin.warm.color));
    this.preview?.style.setProperty("--resident-hair", cssColor(CUSTOM_RESIDENT_APPEARANCE.hairColor[draft.hairColor]?.color || CUSTOM_RESIDENT_APPEARANCE.hairColor["dark-brown"].color));
    this.preview?.style.setProperty("--resident-shirt", cssColor(outfit.shirt));
    this.preview?.setAttribute("data-hair", String(draft.hair));
    this.preview?.setAttribute("data-accessory", draft.accessory || "none");
    this.preview?.setAttribute("data-build", draft.bodyBuild || "average");
    if (this.previewName) this.previewName.textContent = String(draft.name || "Your resident").trim() || "Your resident";
    const hobbyLabels = draft.hobbies.map((id) => CUSTOM_RESIDENT_HOBBIES[id]).filter(Boolean);
    if (this.previewSummary) this.previewSummary.textContent = hobbyLabels.length
      ? hobbyLabels.map((hobby) => `${hobby.icon} ${hobby.label}`).join(" · ")
      : "Choose up to three hobbies";
    this.homePreview?.style.setProperty("--home-wall", cssColor(PERSONAL_HOME_OPTIONS.wallPalette[draft.home.wallColor] || PERSONAL_HOME_OPTIONS.wallPalette.cream));
    this.homePreview?.style.setProperty("--home-roof", cssColor(PERSONAL_HOME_OPTIONS.roofPalette[draft.home.roofColor] || PERSONAL_HOME_OPTIONS.roofPalette.terracotta));
    this.homePreview?.setAttribute("data-roof", draft.home.roofStyle || "gable");
    const progression = this.service.getHomeProgression(draft.home);
    this.homePreview?.setAttribute("data-level", String(progression.home.level));
    if (this.homePreviewLabel) this.homePreviewLabel.textContent = `Level ${progression.home.level} · ${progression.name} · South Shore`;
    if (this.hobbyCount) this.hobbyCount.textContent = `${draft.hobbies.length} / 3 selected`;
    this.renderHomeProgression(progression);
  }

  renderHomeProgression(progression = this.service.getHomeProgression(this.readDraft().home)) {
    this.homeProgression?.classList.toggle("hidden", !progression.created);
    if (this.homeDesignLegend) this.homeDesignLegend.textContent = progression.created ? "Personal-home design & progression" : "Starter-home design";
    if (!progression.created) return;
    if (this.homeLevels) {
      this.homeLevels.innerHTML = progression.levels.map((level) => {
        const classes = [level.current ? "current" : "", level.complete ? "complete" : "", level.locked ? "locked" : ""].filter(Boolean).join(" ");
        const cost = level.level === 1 ? "Included" : `🪙 ${level.cost.toLocaleString()}`;
        return `<span class="personal-home-level ${classes}"><strong>Level ${level.level}</strong>${level.name}<small>${cost} · 🐾 ${level.capacity}</small></span>`;
      }).join("");
    }
    if (this.homeCapacity) this.homeCapacity.textContent = `🐾 Room for ${progression.capacity} companion${progression.capacity === 1 ? "" : "s"}`;
    if (this.homeBalance) this.homeBalance.textContent = `🪙 ${progression.coins.toLocaleString()}`;
    const quote = progression.redesign;
    if (this.homeQuote) this.homeQuote.textContent = quote.cost
      ? `${quote.changes.map((change) => `${change.label} 🪙 ${change.cost.toLocaleString()}`).join(" · ")} · Total 🪙 ${quote.cost.toLocaleString()}${quote.affordable ? "" : ` · Need ${quote.shortfall.toLocaleString()} more`}`
      : "Your current design is already saved.";
    if (this.homeRedesignButton) {
      this.homeRedesignButton.disabled = !quote.cost || !quote.affordable;
      this.homeRedesignButton.textContent = quote.cost
        ? `${quote.affordable ? "Buy redesign" : "Need more coins"} — 🪙 ${quote.cost.toLocaleString()}`
        : "Design already saved";
    }
    if (this.homeUpgradeButton) {
      const next = progression.nextUpgrade;
      this.homeUpgradeButton.disabled = !next || !next.affordable;
      this.homeUpgradeButton.textContent = next
        ? `${next.affordable ? `Upgrade to Level ${next.level}` : "Need more coins"} — 🪙 ${next.cost.toLocaleString()}`
        : "✓ Fully upgraded";
    }
  }

  handleHobbyChange(event) {
    const checked = [...(this.hobbyGrid?.querySelectorAll('input[name="hobby"]:checked') || [])];
    if (checked.length > 3) {
      event.target.checked = false;
      this.showStatus("Choose up to three hobbies.", "error");
    }
    this.renderPreview();
  }

  render() {
    const state = this.service.getSnapshot();
    if (this.openButton) {
      this.openButton.textContent = state.created ? `💚 ${state.profile.name}` : "💚 Create resident";
      this.openButton.setAttribute("aria-label", state.created ? `Open ${state.profile.name}'s resident profile` : "Create your personal resident");
    }
    if (this.submitButton) this.submitButton.textContent = state.created ? "Save changes" : "Create resident & home";
    for (const button of [this.locateButton, this.controlButton]) button?.classList.toggle("hidden", !state.created);
    if (this.controlButton) this.controlButton.disabled = state.controlling;
    this.controlBanner?.classList.toggle("hidden", !state.controlling);
    this.controlBanner?.setAttribute("aria-hidden", state.controlling ? "false" : "true");
    if (this.controlBannerName) this.controlBannerName.textContent = state.profile?.name || "Your resident";
    if (this.form) this.renderHomeProgression(this.service.getHomeProgression(this.readDraft().home));
  }

  open() {
    if (!this.panel) return { ok: false };
    this.previousFocus = document.activeElement;
    this.populateForm();
    this.clearError();
    this.showStatus(this.service.getSnapshot().created ? "Edit the resident, redesign the home, or buy its next permanent upgrade." : "Every option and the starter cottage are free.", "neutral");
    this.panel.classList.remove("hidden");
    this.panel.setAttribute("aria-hidden", "false");
    this.onModalChange(true);
    this.nameInput?.focus({ preventScroll: true });
    return { ok: true };
  }

  close() {
    if (!this.isOpen()) return { ok: false };
    this.panel.classList.add("hidden");
    this.panel.setAttribute("aria-hidden", "true");
    this.onModalChange(false);
    const target = this.previousFocus?.isConnected ? this.previousFocus : this.openButton;
    target?.focus?.({ preventScroll: true });
    return { ok: true };
  }

  clearError() {
    if (this.nameInput) this.nameInput.setAttribute("aria-invalid", "false");
    if (this.nameError) { this.nameError.hidden = true; this.nameError.textContent = ""; }
  }

  showStatus(message, status = "neutral") {
    if (!this.status) return;
    this.status.textContent = message;
    this.status.dataset.status = status;
  }

  save() {
    const result = this.service.saveProfile(this.readDraft());
    if (!result.ok) {
      if (result.field === "name") {
        this.nameInput?.setAttribute("aria-invalid", "true");
        if (this.nameError) { this.nameError.hidden = false; this.nameError.textContent = result.message; }
        this.nameInput?.focus();
      }
      this.showStatus(result.message || "Your resident could not be saved.", "error");
      return result;
    }
    this.populateForm();
    this.showStatus(result.code === "resident-created" ? `Welcome to town, ${result.state.profile.name}! Meadowlight House is ready.` : `${result.state.profile.name}'s resident profile was saved. Home changes use the redesign or upgrade buttons.`, "success");
    this.submitButton?.focus({ preventScroll: true });
    return result;
  }

  redesignHome() {
    const result = this.service.redesignHome(this.readDraft().home);
    if (!result.ok) {
      this.showStatus(result.message || "The home redesign could not be completed.", "error");
      this.renderHomeProgression();
      return result;
    }
    this.populateForm();
    this.render();
    this.showStatus(result.unchanged ? "That home design is already saved." : `Home redesign saved for 🪙 ${result.cost.toLocaleString()}.`, "success");
    this.homeRedesignButton?.focus({ preventScroll: true });
    return result;
  }

  upgradeHome() {
    const result = this.service.upgradeHome(this.readDraft().home);
    if (!result.ok) {
      this.showStatus(result.message || "The home upgrade could not be completed.", "error");
      this.renderHomeProgression();
      return result;
    }
    this.populateForm();
    this.render();
    const level = personalHomeLevel(result.toLevel);
    this.showStatus(`Meadowlight House is now Level ${level.level}: ${level.name}, with room for ${level.capacity} companions.`, "success");
    this.homeUpgradeButton?.focus({ preventScroll: true });
    return result;
  }

  locate() {
    this.close();
    const result = this.onLocate();
    if (!result?.ok) this.showStatus(result?.message || "The resident could not be located.", "error");
    return result;
  }

  startControl() {
    this.close();
    return this.onStartControl();
  }

  endControl() {
    return this.onEndControl();
  }

  focusableElements() {
    return [...(this.panel?.querySelectorAll('button:not([disabled]):not(.hidden), input:not([disabled]), select:not([disabled])') || [])];
  }

  handleKeyDown(event) {
    if (!this.isOpen()) return;
    if (event.key === "Escape") { event.preventDefault(); this.close(); return; }
    if (event.key !== "Tab") return;
    const focusable = this.focusableElements();
    if (!focusable.length) return;
    const current = focusable.indexOf(document.activeElement);
    const next = event.shiftKey ? (current <= 0 ? focusable.length - 1 : current - 1) : (current + 1) % focusable.length;
    event.preventDefault();
    focusable[next]?.focus();
  }

  getDiagnostics() {
    return { open: this.isOpen(), hobbyOptions: Object.keys(CUSTOM_RESIDENT_HOBBIES).length, ...this.service.getDiagnostics() };
  }
}
