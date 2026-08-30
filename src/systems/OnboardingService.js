import {
  LOGIN_REWARD_CONFIG,
  ONBOARDING_GAME_KEYS,
  ONBOARDING_TRACKED_GAME_KEYS,
  localLoginDayKey,
  loginDayOrdinal,
  normalizeOnboardingCreatorDraft,
  normalizeOnboardingJourneyState,
  onboardingChecklistComplete,
  validateTownName,
} from "../state/onboardingState.js";

export class OnboardingService {
  constructor(gameState, repository, {
    economy,
    now = () => Date.now(),
    trustedTimeProvider = null,
    requireTrustedTime = false,
  } = {}) {
    if (!economy) throw new TypeError("Onboarding requires the coin economy.");
    this.gameState = gameState;
    this.repository = repository;
    this.economy = economy;
    this.now = now;
    this.trustedTimeProvider = trustedTimeProvider;
    this.requireTrustedTime = Boolean(requireTrustedTime);
    this.lastRewardResult = null;
  }

  subscribe(listener) {
    return this.gameState.subscribe(() => listener(this.getSnapshot()));
  }

  getSnapshot() {
    const state = this.gameState.getSnapshot();
    const onboarding = structuredClone(state.onboarding);
    onboarding.townName = state.identity.townName;
    onboarding.residentCreated = Boolean(state.customResident?.profile);
    onboarding.homeSelected = Boolean(state.customResident?.profile && state.customResident?.home?.houseId);
    onboarding.complete = onboarding.townNamed && onboarding.residentCreated && onboarding.homeSelected;
    onboarding.journey = normalizeOnboardingJourneyState(onboarding.journey, { state, onboarding });
    onboarding.checklistComplete = onboardingChecklistComplete(onboarding);
    onboarding.nextJob = ONBOARDING_GAME_KEYS.find((key) => !onboarding.tried[key]) || null;
    onboarding.firstRestorationGiftGranted = Boolean(state.restorationMilestones?.firstRestorationGift?.granted);
    onboarding.coins = state.economy.coins;
    return onboarding;
  }

  commit(mutator, failureMessage = "That onboarding change could not be saved, so it was not kept.") {
    const checkpoint = this.gameState.getSnapshot();
    const working = structuredClone(checkpoint);
    const mutation = mutator(working);
    if (!mutation.ok) return mutation;
    working.updatedAt = new Date(this.now()).toISOString();
    const replaced = this.gameState.replace(working);
    if (!replaced.ok) return { ok: false, code: "state-validation", errors: replaced.errors };
    const save = this.repository.save(working, { now: this.now() });
    if (!save.ok) {
      const rollback = this.gameState.replace(checkpoint);
      return { ok: false, code: "persistence-failed", message: failureMessage, save, rollbackOk: rollback.ok };
    }
    return { ...mutation, state: this.getSnapshot(), save };
  }

  saveTownName(value) {
    const checked = validateTownName(value);
    if (!checked.ok) return { ok: false, code: "invalid-town-name", field: "townName", message: checked.reason };
    return this.commit((state) => {
      state.identity.townName = checked.name;
      state.onboarding.townNamed = true;
      state.onboarding.complete = Boolean(state.customResident?.profile && state.customResident?.home?.houseId);
      return { ok: true, code: "town-named", townName: checked.name };
    }, "Your town name could not be saved, so the previous name was kept.");
  }

  saveCreatorDraft(step, value) {
    const current = this.getSnapshot();
    if (!current.townNamed) return { ok: false, code: "town-name-required", message: "Name your town before creating its resident." };
    if (current.complete) return { ok: true, code: "setup-already-complete", duplicate: true, state: current };
    const creatorDraft = normalizeOnboardingCreatorDraft(value);
    if (!creatorDraft) return { ok: false, code: "creator-draft-required", message: "The resident choices could not be read." };
    const creatorStep = Math.max(0, Math.min(2, Math.floor(Number(step) || 0)));
    if (creatorStep > 0 && !/[\p{L}\p{N}]/u.test(creatorDraft.name)) {
      return { ok: false, code: "resident-name-required", message: "Enter a resident name before continuing." };
    }
    if (current.creatorStep === creatorStep && JSON.stringify(current.creatorDraft) === JSON.stringify(creatorDraft)) {
      return { ok: true, code: "creator-draft-unchanged", duplicate: true, state: current };
    }
    return this.commit((state) => {
      state.onboarding.creatorStep = creatorStep;
      state.onboarding.creatorDraft = creatorDraft;
      return { ok: true, code: "creator-draft-saved", creatorStep };
    }, "Your resident choices could not be saved. Keep this page open and try again.");
  }

  syncSetupFromResident() {
    const snapshot = this.gameState.getSnapshot();
    const complete = Boolean(snapshot.onboarding.townNamed && snapshot.customResident?.profile && snapshot.customResident?.home?.houseId);
    const checkpointCleared = snapshot.onboarding.creatorStep === 0 && snapshot.onboarding.creatorDraft === null;
    if (snapshot.onboarding.complete === complete && (!complete || checkpointCleared)) return { ok: true, code: "setup-unchanged", duplicate: true, state: this.getSnapshot() };
    return this.commit((state) => {
      state.onboarding.complete = complete;
      if (complete) {
        state.onboarding.creatorStep = 0;
        state.onboarding.creatorDraft = null;
      }
      return { ok: true, code: complete ? "setup-complete" : "setup-incomplete" };
    }, "Your completed welcome setup could not be saved.");
  }

  recordTutorial(gameKey) {
    if (!ONBOARDING_TRACKED_GAME_KEYS.includes(gameKey)) return { ok: false, code: "unknown-tutorial", message: "That tutorial is not part of onboarding." };
    const current = this.gameState.getSnapshot().onboarding;
    if (current.tutorialSeen[gameKey] && current.tried[gameKey]) return { ok: true, code: "tutorial-already-recorded", duplicate: true, state: this.getSnapshot() };
    return this.commit((state) => {
      state.onboarding.tutorialSeen[gameKey] = true;
      state.onboarding.tried[gameKey] = true;
      return { ok: true, code: "tutorial-recorded", gameKey };
    }, "The tutorial marker could not be saved. You can still play safely.");
  }

  recordJourneyStep(step) {
    if (!["moved", "metResident"].includes(step)) return { ok: false, code: "unknown-journey-step", message: "That first-session step is not tracked." };
    const current = this.getSnapshot();
    if (current.journey[step]) return { ok: true, code: "journey-step-already-recorded", duplicate: true, state: current };
    return this.commit((state) => {
      state.onboarding.journey = normalizeOnboardingJourneyState(state.onboarding.journey, { state, onboarding: state.onboarding });
      state.onboarding.journey[step] = true;
      return { ok: true, code: "journey-step-recorded", step };
    }, "Your first-session progress could not be saved. You can keep playing safely.");
  }

  recordJobCompleted(gameKey) {
    if (!ONBOARDING_GAME_KEYS.includes(gameKey)) return { ok: false, code: "unknown-first-job", message: "That job is not part of the first-session journey." };
    const current = this.getSnapshot();
    if (current.journey.completed[gameKey]) return { ok: true, code: "first-job-already-completed", duplicate: true, state: current };
    return this.commit((state) => {
      state.onboarding.journey = normalizeOnboardingJourneyState(state.onboarding.journey, { state, onboarding: state.onboarding });
      state.onboarding.tutorialSeen[gameKey] = true;
      state.onboarding.tried[gameKey] = true;
      state.onboarding.journey.completed[gameKey] = true;
      return { ok: true, code: "first-job-completed", gameKey };
    }, "Your completed first job could not be added to the guide. The game reward remains safe.");
  }

  finishFirstSession() {
    const current = this.getSnapshot();
    if (!ONBOARDING_GAME_KEYS.every((key) => current.journey.completed[key])) return { ok: false, code: "first-session-incomplete", message: "Complete the three first jobs before entering free play." };
    if (current.journey.freePlay) return { ok: true, code: "free-play-already-open", duplicate: true, state: current };
    return this.commit((state) => {
      state.onboarding.journey = normalizeOnboardingJourneyState(state.onboarding.journey, { state, onboarding: state.onboarding });
      state.onboarding.journey.freePlay = true;
      return { ok: true, code: "free-play-open" };
    }, "Free-play progress could not be saved. Your completed jobs remain safe.");
  }

  processLoginRewards(unixMs = this.now(), { trusted = false, receiptId = null } = {}) {
    const at = Number(unixMs);
    if (!Number.isFinite(at) || at <= 0) return { ok: false, code: "invalid-time", message: "A valid login time is required." };
    if (this.requireTrustedTime && !trusted) return { ok: false, code: "trusted-time-required", requiresTrustedTime: true, message: "Trusted login-reward time is not connected in this build." };
    if (trusted && !String(receiptId || "").trim()) return { ok: false, code: "invalid-trusted-receipt", message: "Trusted time receipt is incomplete." };
    const before = this.gameState.getSnapshot().onboarding.loginRewards;
    if (trusted && (String(receiptId) === before.lastTrustedTimeReceiptId || at <= before.trustedTimeUnixMs)) {
      return { ok: true, code: "trusted-time-duplicate", duplicate: true, daily: 0, returnBonus: 0, total: 0, trustedTime: true, state: this.getSnapshot() };
    }
    const result = this.economy.commit((state) => {
      const login = state.onboarding.loginRewards;
      const today = localLoginDayKey(at);
      const todayOrdinal = loginDayOrdinal(today);
      const lastOrdinal = loginDayOrdinal(login.lastLoginDay);
      const dayGap = Number.isFinite(todayOrdinal) && Number.isFinite(lastOrdinal) ? todayOrdinal - lastOrdinal : 0;
      if (trusted) {
        login.trustedTimeUnixMs = at;
        login.lastTrustedTimeReceiptId = String(receiptId).trim().slice(0, 160);
      }
      if (dayGap <= 0) {
        login.lastLoginAt = Math.max(login.lastLoginAt || 0, at);
        return { ok: true, code: "login-duplicate", duplicate: true, clockRollback: dayGap < 0, daily: 0, returnBonus: 0, total: 0, daysSinceLastLogin: dayGap };
      }
      let daily = 0;
      let returnBonus = 0;
      if (login.lastRewardDay !== today) {
        daily = LOGIN_REWARD_CONFIG.dailyCoins;
        state.economy.coins += daily;
        state.economy.lifetimeCoinsEarned += daily;
        this.economy.appendLedger(state, { amount: daily, kind: "daily-login", reason: "Daily login reward", day: today, daysSinceLastLogin: dayGap, trustedTime: trusted });
        login.lastRewardDay = today;
        login.dailyClaims += 1;
      }
      if (dayGap >= LOGIN_REWARD_CONFIG.returnAfterDays && login.lastReturnBonusDay !== today) {
        returnBonus = LOGIN_REWARD_CONFIG.returnBonusCoins;
        state.economy.coins += returnBonus;
        state.economy.lifetimeCoinsEarned += returnBonus;
        this.economy.appendLedger(state, { amount: returnBonus, kind: "return-bonus", reason: "Welcome back reward", day: today, daysSinceLastLogin: dayGap, trustedTime: trusted });
        login.lastReturnBonusDay = today;
        login.returnBonuses += 1;
      }
      login.lastLoginDay = today;
      login.lastLoginAt = at;
      login.loginDays += 1;
      return { ok: true, code: "login-reward-processed", duplicate: false, clockRollback: false, daily, returnBonus, total: daily + returnBonus, daysSinceLastLogin: dayGap };
    });
    this.lastRewardResult = result.ok ? { ...result, trustedTime: trusted, receiptId: trusted ? String(receiptId) : null } : result;
    return this.lastRewardResult;
  }

  async requestLoginRewards() {
    if (!this.trustedTimeProvider) {
      if (this.requireTrustedTime) return this.processLoginRewards(this.now(), { trusted: false });
      return this.processLoginRewards(this.now(), { trusted: false });
    }
    let receipt;
    try {
      receipt = await this.trustedTimeProvider();
    } catch (error) {
      return { ok: false, code: "trusted-time-unavailable", message: String(error) };
    }
    if (!receipt || receipt.verified !== true) return { ok: false, code: "unverified-trusted-time", message: "The trusted time receipt could not be verified." };
    return this.processLoginRewards(receipt.unixMs, { trusted: true, receiptId: receipt.receiptId });
  }

  getDiagnostics() {
    const state = this.getSnapshot();
    return {
      schemaVersion: state.schemaVersion,
      townNamed: state.townNamed,
      residentCreated: state.residentCreated,
      homeSelected: state.homeSelected,
      complete: state.complete,
      checklistComplete: state.checklistComplete,
      nextJob: state.nextJob,
      starterGrantClaimed: state.starterGrantClaimed,
      firstRestorationGiftGranted: state.firstRestorationGiftGranted,
      loginDays: state.loginRewards.loginDays,
      dailyClaims: state.loginRewards.dailyClaims,
      returnBonuses: state.loginRewards.returnBonuses,
      trustedTimeRequired: this.requireTrustedTime,
      lastRewardResult: this.lastRewardResult,
    };
  }
}
