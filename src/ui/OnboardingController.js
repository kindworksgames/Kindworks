import { LOGIN_REWARD_CONFIG } from "../state/onboardingState.js";

const JOB_LABELS = Object.freeze({ resident: "a neighbour", lawn: "Lawn Care", waste: "Waste Collection", river: "River Clear-Out" });

export function firstSessionStep(state) {
  if (!state?.complete || state.journey?.freePlay) return null;
  if (!state.journey?.moved) return { id: "move", number: 1, icon: "🧭", title: "Explore the town", detail: "Drag the map to look around.", action: null };
  if (!state.journey?.metResident) return { id: "resident", number: 2, icon: "💬", title: "Meet a neighbour", detail: "Say hello and hear their story.", action: "resident" };
  if (!state.journey?.completed?.lawn) return { id: "lawn", number: 3, icon: "🌱", title: state.tried?.lawn ? "Finish Lawn Care" : "Restore a lawn", detail: "Cut at least half of the grass.", action: "lawn" };
  if (!state.journey?.completed?.waste) return { id: "waste", number: 4, icon: "🪙", title: state.tried?.waste ? "Finish Waste Collection" : "Try another activity", detail: "Rewards buy useful town items.", action: "waste" };
  if (!state.journey?.completed?.river) return { id: "river", number: 5, icon: "🌊", title: state.tried?.river ? "Finish River Clear-Out" : "Restore the river", detail: "This job plays in portrait.", action: "river" };
  return { id: "free-play", number: 6, icon: "✨", title: "Free play unlocked", detail: "Explore, shop or choose any job.", action: "free-play" };
}

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
    this.setupProgress = document.querySelector("#onboarding-setup-progress");
    this.residentButton = document.querySelector("#onboarding-create-resident");
    this.rewardSummary = document.querySelector("#onboarding-reward-summary");
    this.rewardHistory = document.querySelector("#onboarding-reward-history");
    this.checklist = document.querySelector("#first-session-checklist");
    this.guideStep = document.querySelector("#first-session-step");
    this.guideIcon = document.querySelector("#first-session-icon");
    this.guideTitle = document.querySelector("#first-session-title");
    this.guideDetail = document.querySelector("#first-session-detail");
    this.findButton = document.querySelector("#first-session-find");
    this.toast = document.querySelector("#login-reward-toast");
    this.toastText = document.querySelector("#login-reward-toast-text");
    this.toastClose = document.querySelector("#login-reward-toast-close");
    this.townLabel = document.querySelector("#town-name-label");
    this.previousFocus = null;
    this.editingTownName = false;
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

  open({ editTownName = false } = {}) {
    if (!this.panel || !this.canOpen()) return { ok: false, code: "onboarding-unavailable" };
    this.previousFocus = document.activeElement;
    this.editingTownName = Boolean(editTownName);
    this.render();
    this.panel.classList.remove("hidden");
    this.panel.setAttribute("aria-hidden", "false");
    this.onModalChange(true);
    const state = this.service.getSnapshot();
    (this.editingTownName || !state.townNamed ? this.input : this.residentButton)?.focus?.({ preventScroll: true });
    if (this.editingTownName || !state.townNamed) this.input?.select?.();
    return { ok: true };
  }

  close({ force = false } = {}) {
    if (!this.isOpen()) return { ok: false };
    if (!force && !this.service.getSnapshot().complete) return { ok: false, code: "setup-required" };
    this.panel.classList.add("hidden");
    this.panel.setAttribute("aria-hidden", "true");
    this.onModalChange(false);
    this.editingTownName = false;
    this.previousFocus?.focus?.({ preventScroll: true });
    return { ok: true };
  }

  startFirstRun() {
    const state = this.service.getSnapshot();
    if (state.complete || !this.canOpen()) return false;
    if (state.townNamed && !state.complete) return Boolean(this.openResidentCreator()?.ok);
    return this.open().ok;
  }

  openTownNameEditor() {
    return this.open({ editTownName: true });
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
    const returnToCreator = this.editingTownName && !result.state.complete;
    this.editingTownName = false;
    this.render();
    if (returnToCreator) return this.openResidentCreator();
    this.residentButton?.focus?.({ preventScroll: true });
    return result;
  }

  openResidentCreator() {
    const state = this.service.getSnapshot();
    if (!state.townNamed) return this.input?.focus?.();
    this.close({ force: true });
    return this.onCreateResident({
      onboarding: !state.complete,
      creatorStep: state.creatorStep,
      creatorDraft: state.creatorDraft,
    });
  }

  notifyResidentSaved() {
    const result = this.service.syncSetupFromResident();
    this.render();
    return result;
  }

  findNextJob() {
    const step = firstSessionStep(this.service.getSnapshot());
    if (!step?.action) return { ok: false, code: "guide-action-unavailable" };
    if (step.action === "free-play") return this.service.finishFirstSession();
    const result = this.onFindJob(step.action);
    if (result?.ok && this.findButton) {
      this.findButton.disabled = true;
      this.findButton.textContent = "Opening…";
    }
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
    const showTownForm = !state.townNamed || this.editingTownName;
    this.form?.classList.toggle("hidden", !showTownForm);
    this.residentButton?.classList.toggle("hidden", showTownForm || !state.townNamed || state.residentCreated);
    this.closeButton?.classList.toggle("hidden", !state.complete);
    if (this.title) this.title.textContent = showTownForm ? (state.townNamed ? "Edit your town name" : "Name your town") : !state.residentCreated ? `Welcome to ${state.townName}` : `${state.townName} is yours`;
    if (this.description) this.description.textContent = showTownForm
      ? "Choose the name shown around your town."
      : !state.residentCreated
        ? "Create your resident and starter home."
        : "Your resident and home are ready.";
    if (this.setupProgress) this.setupProgress.textContent = showTownForm ? "STEP 1 OF 2 · NAME YOUR TOWN" : "STEP 2 OF 2 · CREATE YOUR RESIDENT";
    if (this.rewardSummary) this.rewardSummary.textContent = `Starter gift: +${LOGIN_REWARD_CONFIG.starterCoins} coins · Daily: +${LOGIN_REWARD_CONFIG.dailyCoins} · Return after ${LOGIN_REWARD_CONFIG.returnAfterDays} days: +${LOGIN_REWARD_CONFIG.returnBonusCoins}`;
    if (this.rewardHistory) this.rewardHistory.textContent = `${state.loginRewards.loginDays} login day${state.loginRewards.loginDays === 1 ? "" : "s"} · ${state.loginRewards.dailyClaims} daily reward${state.loginRewards.dailyClaims === 1 ? "" : "s"} · ${state.loginRewards.returnBonuses} return bonus${state.loginRewards.returnBonuses === 1 ? "" : "es"}`;

    const step = firstSessionStep(state);
    const showChecklist = Boolean(step);
    this.checklist?.classList.toggle("hidden", !showChecklist);
    this.checklist?.setAttribute("aria-hidden", showChecklist ? "false" : "true");
    if (this.checklist) this.checklist.setAttribute("aria-label", step ? `First session, step ${step.number} of 6: ${step.title}` : "First session complete");
    if (this.guideStep) this.guideStep.textContent = step ? `STEP ${step.number} OF 6` : "COMPLETE";
    if (this.guideIcon) this.guideIcon.textContent = step?.icon || "✨";
    if (this.guideTitle) this.guideTitle.textContent = step?.title || "First session complete";
    if (this.guideDetail) this.guideDetail.textContent = step?.detail || "Explore freely.";
    if (this.findButton) {
      this.findButton.classList.toggle("hidden", !step?.action);
      this.findButton.disabled = !step?.action;
      this.findButton.textContent = step?.action === "free-play" ? "Start free play" : step?.action === "resident" ? "Meet a neighbour" : step?.action ? `${state.tried?.[step.action] ? "Continue" : "Start"} ${JOB_LABELS[step.action]}` : "";
    }
    this.applyTownIdentity(state.townName);
  }

  getDiagnostics() {
    return { open: this.isOpen(), ...this.service.getDiagnostics() };
  }
}
