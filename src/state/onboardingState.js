export const ONBOARDING_STATE_SCHEMA_VERSION = 1;
export const ONBOARDING_GAME_KEYS = Object.freeze(["lawn", "waste", "river"]);
export const ONBOARDING_TRACKED_GAME_KEYS = Object.freeze([...ONBOARDING_GAME_KEYS, "beach", "playground"]);
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

export function createFreshOnboardingState({ now = Date.now() } = {}) {
  return {
    schemaVersion: ONBOARDING_STATE_SCHEMA_VERSION,
    townNamed: false,
    complete: false,
    tutorialSeen: blankTracking(),
    tried: blankTracking(),
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
  for (const key of ONBOARDING_TRACKED_GAME_KEYS) {
    fresh.tutorialSeen[key] = Boolean(raw.tutorialSeen?.[key]);
    fresh.tried[key] = Boolean(raw.tried?.[key]) || fresh.tutorialSeen[key];
  }
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
    tutorialSeen: legacy?.onboarding?.tutorialSeen,
    tried: legacy?.onboarding?.tried,
    starterGrantClaimed: true,
    loginRewards: legacy?.economy?.loginRewards,
    firstRestorationGiftGranted: legacy?.onboarding?.firstRestorationGiftGranted,
  }, { state, now });
  for (const key of ONBOARDING_TRACKED_GAME_KEYS) {
    const completed = Number(legacy?.miniGameProgress?.[key]?.completed) > 0;
    if (completed) projected.tutorialSeen[key] = projected.tried[key] = true;
  }
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
  if (validateTownName(state?.identity?.townName).ok !== true) errors.push("Onboarding town name is invalid.");
  for (const key of ONBOARDING_TRACKED_GAME_KEYS) {
    if (typeof value.tutorialSeen?.[key] !== "boolean" || typeof value.tried?.[key] !== "boolean") errors.push(`Onboarding tracking for ${key} is invalid.`);
    if (value.tutorialSeen?.[key] && !value.tried?.[key]) errors.push(`Onboarding tutorial ${key} must also be marked tried.`);
  }
  const login = value.loginRewards;
  if (!login || login.schemaVersion !== LOGIN_REWARD_CONFIG.schemaVersion) errors.push("Login reward state is invalid.");
  else {
    for (const key of ["signupDay", "lastLoginDay", "lastRewardDay"]) if (!Number.isFinite(loginDayOrdinal(login[key]))) errors.push(`Login reward ${key} is invalid.`);
    for (const key of ["signedUpAt", "lastLoginAt", "loginDays", "dailyClaims", "returnBonuses", "trustedTimeUnixMs"]) if (!Number.isFinite(login[key]) || login[key] < 0) errors.push(`Login reward ${key} is invalid.`);
  }
  return { ok: errors.length === 0, errors };
}
