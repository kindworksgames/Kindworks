import {
  CUSTOM_RESIDENT_APPEARANCE,
  CUSTOM_RESIDENT_HOBBIES,
  PERSONAL_HOME_OPTIONS,
} from "../data/customResident.js";

export const ONBOARDING_STATE_SCHEMA_VERSION = 1;
export const ONBOARDING_GAME_KEYS = Object.freeze(["lawn", "waste", "river"]);
export const ONBOARDING_TRACKED_GAME_KEYS = Object.freeze([...ONBOARDING_GAME_KEYS, "beach", "playground"]);
export const ONBOARDING_JOURNEY_STEPS = Object.freeze(["moved", "metResident", "freePlay"]);
export const LOGIN_REWARD_CONFIG = Object.freeze({
  schemaVersion: 1,
  starterCoins: 100,
  dailyCoins: 10,
  returnBonusCoins: 50,
  returnAfterDays: 3,
});

function whole(value, minimum = 0) {
  const number = Math.floor(Number(value));
  return Number.isFinite(number) ? Math.max(minimum, number) : minimum;
}

function allowedKey(catalogue, value, fallback) {
  return Object.prototype.hasOwnProperty.call(catalogue, value) ? value : fallback;
}

function validDraftName(value) {
  return /[\p{L}\p{N}]/u.test(String(value || ""));
}

export function normalizeOnboardingCreatorDraft(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const name = String(value.name ?? "").replace(/[\u0000-\u001f\u007f]/g, "").slice(0, 18);
  const hair = Math.max(0, Math.min(3, Math.floor(Number(value.hair) || 0)));
  const outfit = Math.max(0, Math.min(5, Math.floor(Number(value.outfit) || 0)));
  const hobbies = [...new Set(Array.isArray(value.hobbies) ? value.hobbies : [])]
    .filter((id) => Object.prototype.hasOwnProperty.call(CUSTOM_RESIDENT_HOBBIES, id))
    .slice(0, 3);
  return {
    name,
    skin: allowedKey(CUSTOM_RESIDENT_APPEARANCE.skin, value.skin, "warm"),
    hair,
    hairColor: allowedKey(CUSTOM_RESIDENT_APPEARANCE.hairColor, value.hairColor, "dark-brown"),
    accessory: allowedKey(CUSTOM_RESIDENT_APPEARANCE.accessory, value.accessory, "none"),
    outfit,
    bodyBuild: allowedKey(CUSTOM_RESIDENT_APPEARANCE.bodyBuild, value.bodyBuild, "average"),
    hobbies,
    home: {
      wallColor: allowedKey(PERSONAL_HOME_OPTIONS.wallColor, value.home?.wallColor, "cream"),
      roofStyle: allowedKey(PERSONAL_HOME_OPTIONS.roofStyle, value.home?.roofStyle, "gable"),
      roofColor: allowedKey(PERSONAL_HOME_OPTIONS.roofColor, value.home?.roofColor, "terracotta"),
    },
  };
}

function normalizeCreatorStep(value, draft) {
  const step = Math.max(0, Math.min(2, Math.floor(Number(value) || 0)));
  return step > 0 && !validDraftName(draft?.name) ? 0 : step;
}

function legacyCreatorStep(value) {
  const step = Math.max(0, Math.min(4, Math.floor(Number(value) || 0)));
  if (step <= 1) return 0;
  if (step === 2) return 1;
  return 2;
}

export function validateTownName(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return { ok: false, name: "", reason: "Enter a name for your town." };
  if (/[^\p{L}\p{N} '’\-]/u.test(raw)) return { ok: false, name: "", reason: "Use only letters, numbers, spaces, apostrophes or hyphens." };
  const name = raw.replace(/\s+/g, " ").slice(0, 24);
  if (!/[\p{L}\p{N}]/u.test(name)) return { ok: false, name: "", reason: "Include at least one letter or number." };
  return { ok: true, name, reason: "" };
}

export function sanitizeTownName(value) {
  const result = validateTownName(value);
  return result.ok ? result.name : "Willowmere";
}

export function localLoginDayKey(ms = Date.now()) {
  const value = Number(ms);
  const date = new Date(Number.isFinite(value) ? value : Date.now());
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function loginDayOrdinal(dayKey) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dayKey || ""));
  if (!match) return Number.NaN;
  return Math.floor(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) / 86_400_000);
}

export function createFreshLoginRewardState({ now = Date.now() } = {}) {
  const at = Number(now) || Date.now();
  const day = localLoginDayKey(at);
  return {
    schemaVersion: LOGIN_REWARD_CONFIG.schemaVersion,
    signedUpAt: at,
    signupDay: day,
    lastLoginDay: day,
    lastLoginAt: at,
    lastRewardDay: day,
    loginDays: 1,
    dailyClaims: 0,
    returnBonuses: 0,
    lastReturnBonusDay: null,
    trustedTimeUnixMs: 0,
    lastTrustedTimeReceiptId: null,
  };
}

export function normalizeLoginRewardState(raw, { now = Date.now() } = {}) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return createFreshLoginRewardState({ now });
  const validDay = (value) => Number.isFinite(loginDayOrdinal(value));
  const signedUpAt = whole(raw.signedUpAt || now);
  const today = localLoginDayKey(now);
  return {
    schemaVersion: LOGIN_REWARD_CONFIG.schemaVersion,
    signedUpAt,
    signupDay: validDay(raw.signupDay) ? raw.signupDay : localLoginDayKey(signedUpAt),
    lastLoginDay: validDay(raw.lastLoginDay) ? raw.lastLoginDay : today,
    lastLoginAt: whole(raw.lastLoginAt || signedUpAt),
    lastRewardDay: validDay(raw.lastRewardDay) ? raw.lastRewardDay : today,
    loginDays: whole(raw.loginDays, 1),
    dailyClaims: whole(raw.dailyClaims),
    returnBonuses: whole(raw.returnBonuses),
    lastReturnBonusDay: validDay(raw.lastReturnBonusDay) ? raw.lastReturnBonusDay : null,
    trustedTimeUnixMs: whole(raw.trustedTimeUnixMs),
    lastTrustedTimeReceiptId: raw.lastTrustedTimeReceiptId ? String(raw.lastTrustedTimeReceiptId).slice(0, 160) : null,
  };
}

function blankTracking() {
  return Object.fromEntries(ONBOARDING_TRACKED_GAME_KEYS.map((key) => [key, false]));
}

function blankCompletedJobs() {
  return Object.fromEntries(ONBOARDING_GAME_KEYS.map((key) => [key, false]));
}

export function normalizeOnboardingJourneyState(value, { state = null, onboarding = null } = {}) {
  const raw = value && typeof value === "object" && !Array.isArray(value) ? value : null;
  const progressed = ONBOARDING_GAME_KEYS.some((key) => Boolean(onboarding?.tried?.[key]));
  const completed = blankCompletedJobs();
  const derived = {
    lawn: Number(state?.lawnCare?.progress?.completed || 0) > 0,
    waste: Number(state?.progress?.cleanup?.progress?.waste?.completed || 0) > 0,
    river: Number(state?.river?.progress?.completed || 0) > 0,
  };
  for (const key of ONBOARDING_GAME_KEYS) completed[key] = Boolean(raw?.completed?.[key] || derived[key]);
  const allCompleted = ONBOARDING_GAME_KEYS.every((key) => completed[key]);
  return {
    moved: raw ? Boolean(raw.moved) : progressed,
    metResident: raw ? Boolean(raw.metResident) : progressed,
    completed,
    freePlay: Boolean(raw?.freePlay || (!raw && allCompleted)),
  };
}

export function createFreshOnboardingState({ now = Date.now() } = {}) {
  return {
    schemaVersion: ONBOARDING_STATE_SCHEMA_VERSION,
    townNamed: false,
    complete: false,
    creatorStep: 0,
    creatorDraft: null,
    tutorialSeen: blankTracking(),
    tried: blankTracking(),
    journey: normalizeOnboardingJourneyState(null),
    starterGrantClaimed: true,
    loginRewards: createFreshLoginRewardState({ now }),
    firstRestorationGiftGranted: false,
  };
}

export function normalizeOnboardingState(value, { state = null, now = Date.now() } = {}) {
  const fresh = createFreshOnboardingState({ now });
  const raw = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const residentCreated = Boolean(state?.customResident?.profile);
  const townNamed = raw.townNamed === undefined
    ? residentCreated || sanitizeTownName(state?.identity?.townName) !== "Willowmere"
    : Boolean(raw.townNamed);
  fresh.townNamed = townNamed;
  fresh.complete = residentCreated && townNamed;
  if (townNamed && !residentCreated) {
    fresh.creatorDraft = normalizeOnboardingCreatorDraft(raw.creatorDraft);
    fresh.creatorStep = normalizeCreatorStep(raw.creatorStep, fresh.creatorDraft);
  }
  for (const key of ONBOARDING_TRACKED_GAME_KEYS) {
    fresh.tutorialSeen[key] = Boolean(raw.tutorialSeen?.[key]);
    fresh.tried[key] = Boolean(raw.tried?.[key]) || fresh.tutorialSeen[key];
  }
  fresh.journey = normalizeOnboardingJourneyState(raw.journey, { state, onboarding: fresh });
  fresh.starterGrantClaimed = raw.starterGrantClaimed === undefined
    ? Boolean(state?.economy?.ledger?.some((entry) => entry.kind === "starter-grant"))
    : Boolean(raw.starterGrantClaimed);
  fresh.loginRewards = normalizeLoginRewardState(raw.loginRewards, { now });
  fresh.firstRestorationGiftGranted = Boolean(
    raw.firstRestorationGiftGranted || state?.restorationMilestones?.firstRestorationGift?.granted,
  );
  return fresh;
}

export function projectLegacyOnboarding(legacy, state, { now = Date.now() } = {}) {
  const setup = legacy?.playerSetup || {};
  const projected = normalizeOnboardingState({
    townNamed: setup.townNamed,
    complete: setup.complete,
    creatorStep: legacyCreatorStep(setup.creatorStep),
    creatorDraft: setup.creatorDraft,
    tutorialSeen: legacy?.onboarding?.tutorialSeen,
    tried: legacy?.onboarding?.tried,
    starterGrantClaimed: true,
    loginRewards: legacy?.economy?.loginRewards,
    firstRestorationGiftGranted: legacy?.onboarding?.firstRestorationGiftGranted,
  }, { state, now });
  for (const key of ONBOARDING_TRACKED_GAME_KEYS) {
    const completed = Number((legacy?.miniGames?.progress || legacy?.miniGameProgress)?.[key]?.completed) > 0;
    if (completed) projected.tutorialSeen[key] = projected.tried[key] = true;
  }
  projected.journey = normalizeOnboardingJourneyState(null, { state, onboarding: projected });
  return projected;
}

export function onboardingChecklistComplete(value) {
  return ONBOARDING_GAME_KEYS.every((key) => Boolean(value?.tried?.[key]));
}

export function validateOnboardingState(value, state = null) {
  const errors = [];
  if (!value || typeof value !== "object" || Array.isArray(value)) return { ok: false, errors: ["Onboarding state is missing."] };
  if (value.schemaVersion !== ONBOARDING_STATE_SCHEMA_VERSION) errors.push("Onboarding schema version is invalid.");
  if (typeof value.townNamed !== "boolean" || typeof value.complete !== "boolean") errors.push("Onboarding setup flags are invalid.");
  if (value.complete && (!value.townNamed || !state?.customResident?.profile)) errors.push("Completed onboarding requires a named town and resident.");
  if (!Number.isInteger(value.creatorStep) || value.creatorStep < 0 || value.creatorStep > 2) errors.push("Onboarding creator step is invalid.");
  const creatorDraft = normalizeOnboardingCreatorDraft(value.creatorDraft);
  if (value.creatorDraft !== null && JSON.stringify(creatorDraft) !== JSON.stringify(value.creatorDraft)) errors.push("Onboarding creator draft is invalid.");
  if (value.complete && (value.creatorStep !== 0 || value.creatorDraft !== null)) errors.push("Completed onboarding cannot retain a creator checkpoint.");
  if (value.creatorStep > 0 && !validDraftName(creatorDraft?.name)) errors.push("Advanced onboarding creator steps require a resident name.");
  if (validateTownName(state?.identity?.townName).ok !== true) errors.push("Onboarding town name is invalid.");
  for (const key of ONBOARDING_TRACKED_GAME_KEYS) {
    if (typeof value.tutorialSeen?.[key] !== "boolean" || typeof value.tried?.[key] !== "boolean") errors.push(`Onboarding tracking for ${key} is invalid.`);
    if (value.tutorialSeen?.[key] && !value.tried?.[key]) errors.push(`Onboarding tutorial ${key} must also be marked tried.`);
  }
  const journey = normalizeOnboardingJourneyState(value.journey, { state, onboarding: value });
  for (const step of ONBOARDING_JOURNEY_STEPS) {
    if (value.journey && typeof value.journey[step] !== "boolean") errors.push(`Onboarding journey step ${step} is invalid.`);
  }
  for (const key of ONBOARDING_GAME_KEYS) {
    if (value.journey?.completed && typeof value.journey.completed[key] !== "boolean") errors.push(`Onboarding completed-job marker ${key} is invalid.`);
  }
  if (journey.freePlay && !ONBOARDING_GAME_KEYS.every((key) => journey.completed[key])) errors.push("Free play requires all three first jobs to be completed.");
  const login = value.loginRewards;
  if (!login || login.schemaVersion !== LOGIN_REWARD_CONFIG.schemaVersion) errors.push("Login reward state is invalid.");
  else {
    for (const key of ["signupDay", "lastLoginDay", "lastRewardDay"]) if (!Number.isFinite(loginDayOrdinal(login[key]))) errors.push(`Login reward ${key} is invalid.`);
    for (const key of ["signedUpAt", "lastLoginAt", "loginDays", "dailyClaims", "returnBonuses", "trustedTimeUnixMs"]) if (!Number.isFinite(login[key]) || login[key] < 0) errors.push(`Login reward ${key} is invalid.`);
  }
  return { ok: errors.length === 0, errors };
}
