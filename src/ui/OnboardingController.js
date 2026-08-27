import { LOGIN_REWARD_CONFIG, ONBOARDING_GAME_KEYS } from "../state/onboardingState.js";

const JOB_LABELS = Object.freeze({ lawn: "Lawn Care", waste: "Waste Collection", river: "River Clear-Out" });

export class OnboardingController {
  constructor(service, {
    onModalChange = () => {},
    canOpen = () => true,
    onCreateResident = () => ({ ok: false }),
    onFindJob = () => ({ ok: false }),
  } = {}) {
    this.service = service;
    this.onModalChange = onModalChange;
    this.canOpen = canOpen;
    this.onCreateResident = onCreateResident;
    this.onFindJob = onFindJob;
    this.panel = document.querySelector("#onboarding-panel");
    this.openButton = document.querySelector("#onboarding-button");
    this.closeButton = document.querySelector("#onboarding-close");
    this.form = document.querySelector("#onboarding-town-form");
    this.input = document.querySelector("#onboarding-town-name");
    this.error = document.querySelector("#onboarding-town-error");
    this.title = document.querySelector("#onboarding-title");
    this.description = document.querySelector("#onboarding-description");
    this.setupSteps = document.querySelector("#onboarding-setup-steps");
    this.residentButton = document.querySelector("#onboarding-create-resident");
    this.rewardSummary = document.querySelector("#onboarding-reward-summary");
    this.rewardHistory = document.querySelector("#onboarding-reward-history");
    this.checklist = document.querySelector("#first-session-checklist");
    this.checklistItems = document.querySelector("#first-session-items");
    this.findButton = document.querySelector("#first-session-find");
    this.toast = document.querySelector("#login-reward-toast");
    this.toastText = document.querySelector("#login-reward-toast-text");
    this.toastClose = document.querySelector("#login-reward-toast-close");
    this.townLabel = document.querySelector("#town-name-label");
    this.previousFocus = null;
    this.townTextTemplates = new WeakMap();
    this.townAttributeTemplates = new WeakMap();

    this.openButton?.addEventListener("click", () => this.open());
    this.closeButton?.addEventListener("click", () => this.close());
    this.form?.addEventListener("submit", (event) => { event.preventDefault(); this.saveTownName(); });
    this.input?.addEventListener("input", () => this.clearError());
    this.residentButton?.addEventListener("click", () => this.openResidentCreator());
    this.findButton?.addEventListener("click", () => this.findNextJob());
    this.toastClose?.addEventListener("click", () => this.hideRewardToast());
    this.unsubscribe = this.service.subscribe(() => this.render());
    this.render();
  }

  isOpen() {
    return Boolean(this.panel && !this.panel.classList.contains("hidden"));
  }

  open() {
    if (!this.panel || !this.canOpen()) return { ok: false, code: "onboarding-unavailable" };
    this.previousFocus = document.activeElement;
    this.render();
    this.panel.classList.remove("hidden");
    this.panel.setAttribute("aria-hidden", "false");
    this.onModalChange(true);
    const state = this.service.getSnapshot();
    (state.townNamed ? this.residentButton : this.input)?.focus?.({ preventScroll: true });
    if (!state.townNamed) this.input?.select?.();
    return { ok: true };
  }

  close({ force = false } = {}) {
    if (!this.isOpen()) return { ok: false };
    if (!force && !this.service.getSnapshot().townNamed) return { ok: false, code: "town-name-required" };
    this.panel.classList.add("hidden");
    this.panel.setAttribute("aria-hidden", "true");
    this.onModalChange(false);
    this.previousFocus?.focus?.({ preventScroll: true });
    return { ok: true };
  }

  startFirstRun() {
    const state = this.service.getSnapshot();
    if (state.complete || !this.canOpen()) return false;
    return this.open().ok;
  }

  clearError() {
    this.input?.setAttribute("aria-invalid", "false");
    if (this.error) { this.error.hidden = true; this.error.textContent = ""; }
  }

  saveTownName() {
    const result = this.service.saveTownName(this.input?.value);
    if (!result.ok) {
      this.input?.setAttribute("aria-invalid", "true");
      if (this.error) { this.error.hidden = false; this.error.textContent = result.message; }
      this.input?.focus();
      return result;
    }
    this.clearError();
    this.render();
    this.residentButton?.focus?.({ preventScroll: true });
    return result;
  }

  openResidentCreator() {
    const state = this.service.getSnapshot();
    if (!state.townNamed) return this.input?.focus?.();
    this.close({ force: true });
    return this.onCreateResident();
  }

  notifyResidentSaved() {
    const result = this.service.syncSetupFromResident();
    this.render();
    return result;
  }

  findNextJob() {
    const key = this.service.getSnapshot().nextJob;
    if (!key) return { ok: true, code: "checklist-complete" };
    const result = this.onFindJob(key);
    if (result?.ok) this.findButton.textContent = `${JOB_LABELS[key]} highlighted`;
    return result;
  }

  showRewardResult(result) {
    if (!result?.ok || !result.total || !this.toast || !this.toastText) return false;
    this.toastText.textContent = result.returnBonus
      ? `Welcome back! +${result.returnBonus} return bonus and +${result.daily} daily coins.`
      : `Daily login reward: +${result.daily} KindlyCoins.`;
    this.toast.classList.remove("hidden");
    this.toast.setAttribute("aria-hidden", "false");
    return true;
  }

  hideRewardToast() {
    this.toast?.classList.add("hidden");
    this.toast?.setAttribute("aria-hidden", "true");
  }

  async processLogin() {
    const result = await this.service.requestLoginRewards();
    this.showRewardResult(result);
    this.render();
    return result;
  }

  applyTownIdentity(name) {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (node.parentElement?.closest("script, style")) continue;
      if (!this.townTextTemplates.has(node) && String(node.nodeValue || "").includes("Willowmere")) this.townTextTemplates.set(node, String(node.nodeValue || ""));
      const template = this.townTextTemplates.get(node);
      if (template) node.nodeValue = template.replaceAll("Willowmere", name);
    }
    for (const element of document.body.querySelectorAll("[title], [aria-label], [placeholder]")) {
      let templates = this.townAttributeTemplates.get(element);
      if (!templates) { templates = {}; this.townAttributeTemplates.set(element, templates); }
      for (const attribute of ["title", "aria-label", "placeholder"]) {
        const value = element.getAttribute(attribute);
        if (value?.includes("Willowmere") && templates[attribute] === undefined) templates[attribute] = value;
        if (templates[attribute]) element.setAttribute(attribute, templates[attribute].replaceAll("Willowmere", name));
      }
    }
  }

  render() {
    const state = this.service.getSnapshot();
    if (this.townLabel) this.townLabel.textContent = state.townName;
    document.title = `KindWorks — ${state.townName} Living Town`;
    if (this.openButton) this.openButton.textContent = state.complete ? "🎁 Welcome" : "🏡 Welcome";
    if (this.input && document.activeElement !== this.input) this.input.value = state.townName;
    this.form?.classList.toggle("hidden", state.townNamed);
    this.residentButton?.classList.toggle("hidden", !state.townNamed || state.residentCreated);
    this.closeButton?.classList.toggle("hidden", !state.townNamed);
    if (this.title) this.title.textContent = !state.townNamed ? "Name your town" : !state.residentCreated ? `Welcome to ${state.townName}` : `${state.townName} is yours`;
    if (this.description) this.description.textContent = !state.townNamed
      ? "Choose the name that will appear throughout your living town."
      : !state.residentCreated
        ? "Now create one resident and choose their included starter cottage."
        : "Your resident and home are ready. Restore the town through your first three jobs.";
    if (this.setupSteps) this.setupSteps.innerHTML = [
      [state.townNamed, "Town named"],
      [state.residentCreated, "Resident created"],
      [state.homeSelected, "Starter home selected"],
    ].map(([done, label]) => `<li class="${done ? "done" : ""}"><span>${done ? "✓" : "○"}</span>${label}</li>`).join("");
    if (this.rewardSummary) this.rewardSummary.textContent = `Starter gift: +${LOGIN_REWARD_CONFIG.starterCoins} coins · Daily: +${LOGIN_REWARD_CONFIG.dailyCoins} · Return after ${LOGIN_REWARD_CONFIG.returnAfterDays} days: +${LOGIN_REWARD_CONFIG.returnBonusCoins}`;
    if (this.rewardHistory) this.rewardHistory.textContent = `${state.loginRewards.loginDays} login day${state.loginRewards.loginDays === 1 ? "" : "s"} · ${state.loginRewards.dailyClaims} daily reward${state.loginRewards.dailyClaims === 1 ? "" : "s"} · ${state.loginRewards.returnBonuses} return bonus${state.loginRewards.returnBonuses === 1 ? "" : "es"}`;

    const showChecklist = state.complete && !state.checklistComplete;
    this.checklist?.classList.toggle("hidden", !showChecklist);
    this.checklist?.setAttribute("aria-hidden", showChecklist ? "false" : "true");
    if (this.checklistItems) this.checklistItems.innerHTML = ONBOARDING_GAME_KEYS.map((key) => `<li class="${state.tried[key] ? "done" : ""}"><span>${state.tried[key] ? "✓" : "○"}</span>${JOB_LABELS[key]}</li>`).join("");
    if (this.findButton) {
      this.findButton.disabled = !state.nextJob;
      this.findButton.textContent = state.nextJob ? `Find ${JOB_LABELS[state.nextJob]}` : "All three tried";
    }
    this.applyTownIdentity(state.townName);
  }

  getDiagnostics() {
    return { open: this.isOpen(), ...this.service.getDiagnostics() };
  }
}
