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
    onSaved = () => {},
    onSaveOnboardingDraft = () => ({ ok: true }),
    onReturnToTownName = () => ({ ok: false }),
  } = {}) {
    this.service = service;
    this.onModalChange = onModalChange;
    this.onLocate = onLocate;
    this.onStartControl = onStartControl;
    this.onEndControl = onEndControl;
    this.onSaved = onSaved;
    this.onSaveOnboardingDraft = onSaveOnboardingDraft;
    this.onReturnToTownName = onReturnToTownName;
    this.openButton = document.querySelector("#custom-resident-button");
    this.panel = document.querySelector("#custom-resident-panel");
    this.closeButton = document.querySelector("#custom-resident-close");
    this.form = document.querySelector("#custom-resident-form");
    this.nameInput = document.querySelector("#resident-name");
    this.nameError = document.querySelector("#resident-name-error");
    this.hobbyGrid = document.querySelector("#resident-hobbies");
    this.hobbyCount = document.querySelector("#resident-hobby-count");
    this.submitButton = document.querySelector("#custom-resident-save");
    this.backButton = document.querySelector("#custom-resident-back");
    this.nextButton = document.querySelector("#custom-resident-next");
    this.stepStatus = document.querySelector("#resident-step-status");
    this.stepPanels = [...document.querySelectorAll("[data-resident-step]")];
    this.stepDots = [...document.querySelectorAll(".resident-step-dots i")];
    this.step = 0;
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
    this.onboardingRequired = false;
    this.draftSaveTimer = null;

    this.onOpenClick = () => this.open();
    this.onCloseClick = () => this.close();
    this.onSubmit = (event) => {
      event.preventDefault();
      if (this.step < 2) this.nextStep();
      else this.save();
    };
    this.onFormInput = () => {
      this.clearError();
      this.renderPreview();
      this.saveOnboardingDraft();
    };
    this.onHobbyChange = (event) => this.handleHobbyChange(event);
    this.onLocateClick = () => this.locate();
    this.onControlClick = () => this.startControl();
    this.onReturnClick = () => this.endControl();
    this.onHomeRedesignClick = () => this.redesignHome();
    this.onHomeUpgradeClick = () => this.upgradeHome();
    this.onBackClick = () => this.previousStep();
    this.onNextClick = () => this.nextStep();
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
    this.backButton?.addEventListener("click", this.onBackClick);
    this.nextButton?.addEventListener("click", this.onNextClick);
    document.addEventListener("keydown", this.onKeyDown);
    this.unsubscribe = service.subscribe(() => this.render());
    this.populateForm();
    this.setStep(0, { focus: false });
    this.render();
  }

  isOpen() {
    return Boolean(this.panel && !this.panel.classList.contains("hidden"));
  }

  populateForm(profileOverride = null) {
    const state = this.service.getSnapshot();
    const profile = profileOverride || state.profile || {
      name: "", skin: "warm", hair: 0, hairColor: "dark-brown", accessory: "none", outfit: 0, bodyBuild: "average", hobbies: [],
    };
    const home = profileOverride?.home || state.home;
    if (this.nameInput) this.nameInput.value = profile.name;
    for (const [name, value] of Object.entries({
      skin: profile.skin,
      hair: profile.hair,
      hairColor: profile.hairColor,
      accessory: profile.accessory,
      outfit: profile.outfit,
      bodyBuild: profile.bodyBuild,
      wallColor: home.wallColor,
      roofStyle: home.roofStyle,
      roofColor: home.roofColor,
    })) {
      const field = this.form?.elements?.namedItem(name);
      if (field) field.value = String(value);
    }
    for (const input of this.hobbyGrid?.querySelectorAll('input[name="hobby"]') || []) input.checked = profile.hobbies.includes(input.value);
    this.renderPreview();
  }

  saveOnboardingDraft({ immediate = false } = {}) {
    if (!this.onboardingRequired || this.service.getSnapshot().created) return { ok: true, code: "creator-draft-not-required" };
    if (this.draftSaveTimer) {
      clearTimeout(this.draftSaveTimer);
      this.draftSaveTimer = null;
    }
    const save = () => {
      this.draftSaveTimer = null;
      return this.onSaveOnboardingDraft(this.step, this.readDraft());
    };
    if (immediate) return save();
    this.draftSaveTimer = setTimeout(save, 180);
    return { ok: true, code: "creator-draft-pending" };
  }

  persistOnboardingDraft(options = {}) {
    return this.saveOnboardingDraft({ ...options, immediate: true });
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
    this.saveOnboardingDraft();
  }

  render() {
    const state = this.service.getSnapshot();
    if (this.openButton) {
      this.openButton.textContent = state.created ? `💚 ${state.profile.name}` : "💚 Create resident";
      this.openButton.setAttribute("aria-label", state.created ? `Open ${state.profile.name}'s resident profile` : "Create your personal resident");
    }
    if (this.submitButton) this.submitButton.textContent = state.created ? "Save changes" : "Create resident & home";
    if (this.controlButton) this.controlButton.disabled = state.controlling;
    this.controlBanner?.classList.toggle("hidden", !state.controlling);
    this.controlBanner?.setAttribute("aria-hidden", state.controlling ? "false" : "true");
    if (this.controlBannerName) this.controlBannerName.textContent = state.profile?.name || "Your resident";
    if (this.form) this.renderHomeProgression(this.service.getHomeProgression(this.readDraft().home));
    this.renderStep();
  }

  setStep(step, { focus = true } = {}) {
    this.step = Math.max(0, Math.min(2, Number(step) || 0));
    this.renderStep();
    if (!focus) return this.step;
    const active = this.stepPanels.find((panel) => Number(panel.dataset.residentStep) === this.step);
    const target = active?.querySelector("input:not([disabled]), select:not([disabled]), button:not([disabled])")
      || (this.step === 2 ? this.submitButton : this.nextButton);
    target?.focus?.({ preventScroll: true });
    return this.step;
  }

  renderStep() {
    const labels = ["Appearance", "Hobbies", "Your house"];
    this.panel?.setAttribute("data-resident-step", String(this.step));
    for (const panel of this.stepPanels) {
      const active = Number(panel.dataset.residentStep) === this.step;
      panel.hidden = !active;
      panel.setAttribute("aria-hidden", String(!active));
    }
    this.stepDots.forEach((dot, index) => dot.classList.toggle("active", index === this.step));
    if (this.stepStatus) this.stepStatus.textContent = `Step ${this.step + 1} of 3 · ${labels[this.step]}`;
    if (this.backButton) {
      this.backButton.hidden = this.step === 0 && !this.onboardingRequired;
      this.backButton.textContent = this.step === 0 && this.onboardingRequired ? "Back: Town name" : "Back";
    }
    if (this.nextButton) {
      this.nextButton.hidden = this.step === 2;
      this.nextButton.textContent = this.step === 0 ? "Next: Hobbies" : "Next: Your house";
    }
    if (this.submitButton) this.submitButton.hidden = this.step !== 2;
    const created = this.service.getSnapshot().created;
    for (const button of [this.locateButton, this.controlButton]) button?.classList.toggle("hidden", !created || this.step !== 2);
  }

  nextStep() {
    if (this.step === 0 && !String(this.nameInput?.value || "").trim()) {
      this.nameInput?.setAttribute("aria-invalid", "true");
      if (this.nameError) {
        this.nameError.hidden = false;
        this.nameError.textContent = "Enter a name for your resident.";
      }
      this.showStatus("Add a resident name before choosing hobbies.", "error");
      this.nameInput?.focus?.({ preventScroll: true });
      return { ok: false, code: "resident-name-required" };
    }
    this.clearError();
    this.showStatus(this.step === 0 ? "Now choose up to three hobbies." : "Now design their starter home.", "neutral");
    const step = this.setStep(this.step + 1);
    const saved = this.persistOnboardingDraft();
    return saved.ok ? { ok: true, step } : saved;
  }

  previousStep() {
    if (this.step === 0 && this.onboardingRequired) {
      const saved = this.persistOnboardingDraft();
      if (!saved.ok) return saved;
      return this.returnToTownName();
    }
    this.clearError();
    this.showStatus(this.step === 2 ? "Review hobbies or continue to the home when ready." : "Adjust the resident's appearance.", "neutral");
    const step = this.setStep(this.step - 1);
    const saved = this.persistOnboardingDraft();
    return saved.ok ? { ok: true, step } : saved;
  }

  open({ onboarding = false, creatorStep = 0, creatorDraft = null } = {}) {
    if (!this.panel) return { ok: false };
    this.previousFocus = document.activeElement;
    this.onboardingRequired = Boolean(onboarding && !this.service.getSnapshot().created);
    this.panel.dataset.onboardingRequired = String(this.onboardingRequired);
    if (this.closeButton) this.closeButton.hidden = this.onboardingRequired;
    this.populateForm(creatorDraft);
    this.clearError();
    this.showStatus(this.service.getSnapshot().created
      ? "Edit the resident, redesign the home, or buy its next permanent upgrade."
      : creatorDraft ? "Your setup was restored. Continue where you stopped." : "Every option and the starter cottage are free.", "neutral");
    this.panel.classList.remove("hidden");
    this.panel.setAttribute("aria-hidden", "false");
    this.onModalChange(true);
    if (creatorDraft) this.setStep(creatorStep);
    else this.setStep(0);
    return { ok: true };
  }

  close({ force = false } = {}) {
    if (!this.isOpen()) return { ok: false };
    if (!force && this.onboardingRequired && !this.service.getSnapshot().created) {
      this.showStatus("Finish creating your resident and home before exploring town.", "error");
      return { ok: false, code: "setup-required" };
    }
    if (this.draftSaveTimer) {
      clearTimeout(this.draftSaveTimer);
      this.draftSaveTimer = null;
    }
    this.panel.classList.add("hidden");
    this.panel.setAttribute("aria-hidden", "true");
    this.onModalChange(false);
    const target = this.previousFocus?.isConnected ? this.previousFocus : this.openButton;
    target?.focus?.({ preventScroll: true });
    return { ok: true };
  }

  returnToTownName() {
    if (!this.onboardingRequired) return { ok: false, code: "town-name-return-unavailable" };
    const closed = this.close({ force: true });
    if (!closed.ok) return closed;
    return this.onReturnToTownName();
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
    const onboardingResult = this.onSaved(result);
    if (onboardingResult?.ok !== false && this.service.getSnapshot().created) {
      this.onboardingRequired = false;
      this.panel.dataset.onboardingRequired = "false";
      if (this.closeButton) this.closeButton.hidden = false;
      if (this.draftSaveTimer) {
        clearTimeout(this.draftSaveTimer);
        this.draftSaveTimer = null;
      }
      this.renderStep();
    }
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
    return [...(this.panel?.querySelectorAll('button:not([disabled]):not(.hidden), input:not([disabled]), select:not([disabled])') || [])]
      .filter((element) => !element.hidden && !element.closest("[hidden]"));
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
    return { open: this.isOpen(), onboardingRequired: this.onboardingRequired, creatorStep: this.step, creatorSteps: 3, hobbyOptions: Object.keys(CUSTOM_RESIDENT_HOBBIES).length, ...this.service.getDiagnostics() };
  }
}
