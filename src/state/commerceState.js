import { COMMERCE_POLICY, COIN_PACK_BY_ID, KINDLY_CLUB_TIER_BY_ID } from "../data/commerce.js";

export const COMMERCE_SCHEMA_VERSION = 1;
const STATUSES = new Set(["inactive", "active", "expired", "cancelled"]);
const VERIFIED_BY = new Set(["server", "signed-receipt"]);

function cleanIds(values, limit) {
  const output = [];
  for (const value of Array.isArray(values) ? values : []) {
    const id = String(value || "").trim().slice(0, 240);
    if (id && !output.includes(id)) output.push(id);
  }
  return output.slice(-limit);
}

function iso(value) {
  if (value === null || value === undefined || value === "") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function createFreshCommerceState() {
  return {
    schemaVersion: COMMERCE_SCHEMA_VERSION,
    walletVersion: 0,
    processedTransactions: [],
    processedPeriods: [],
    kindlyClub: {
      tierId: null,
      status: "inactive",
      subscriptionId: null,
      currentPeriodStart: null,
      currentPeriodEnd: null,
      lastVerifiedAt: null,
      verifiedBy: null,
    },
    lastRestoreAt: null,
  };
}

export function normalizeCommerceState(raw) {
  const state = createFreshCommerceState();
  if (!raw || typeof raw !== "object") return state;
  state.walletVersion = Math.max(0, Math.floor(Number(raw.walletVersion) || 0));
  state.processedTransactions = cleanIds(raw.processedTransactions, COMMERCE_POLICY.processedTransactionLimit);
  state.processedPeriods = cleanIds(raw.processedPeriods, COMMERCE_POLICY.processedPeriodLimit);
  const club = raw.kindlyClub && typeof raw.kindlyClub === "object" ? raw.kindlyClub : {};
  state.kindlyClub.tierId = KINDLY_CLUB_TIER_BY_ID[club.tierId] ? club.tierId : null;
  state.kindlyClub.status = STATUSES.has(club.status) ? club.status : "inactive";
  state.kindlyClub.subscriptionId = club.subscriptionId ? String(club.subscriptionId).trim().slice(0, 240) : null;
  state.kindlyClub.currentPeriodStart = iso(club.currentPeriodStart);
  state.kindlyClub.currentPeriodEnd = iso(club.currentPeriodEnd);
  state.kindlyClub.lastVerifiedAt = iso(club.lastVerifiedAt);
  state.kindlyClub.verifiedBy = VERIFIED_BY.has(club.verifiedBy) ? club.verifiedBy : null;
  state.lastRestoreAt = iso(raw.lastRestoreAt);
  if (state.kindlyClub.status === "active" && (!state.kindlyClub.tierId || !state.kindlyClub.subscriptionId || !state.kindlyClub.currentPeriodStart || !state.kindlyClub.currentPeriodEnd || !state.kindlyClub.verifiedBy)) state.kindlyClub.status = "inactive";
  return state;
}

export function projectLegacyCommerce(legacy) {
  const economy = legacy?.economy && typeof legacy.economy === "object" ? legacy.economy : {};
  return normalizeCommerceState({
    processedTransactions: economy.processedCoinTransactions,
    processedPeriods: economy.processedKindlyPeriods,
    kindlyClub: economy.kindlyClub,
  });
}

export function validateCommerceState(commerce) {
  const errors = [];
  if (!commerce || typeof commerce !== "object") return { ok: false, errors: ["Commerce state is missing."] };
  if (commerce.schemaVersion !== COMMERCE_SCHEMA_VERSION) errors.push("Commerce schema version is unsupported.");
  if (!Number.isSafeInteger(commerce.walletVersion) || commerce.walletVersion < 0) errors.push("Commerce wallet version is invalid.");
  for (const [field, limit] of [["processedTransactions", COMMERCE_POLICY.processedTransactionLimit], ["processedPeriods", COMMERCE_POLICY.processedPeriodLimit]]) {
    const values = commerce[field];
    if (!Array.isArray(values) || values.length > limit || new Set(values).size !== values.length || values.some((id) => typeof id !== "string" || !id.trim())) errors.push(`${field} is invalid.`);
  }
  const club = commerce.kindlyClub;
  if (!club || typeof club !== "object") errors.push("KindlyClub state is missing.");
  else {
    if (club.tierId && !KINDLY_CLUB_TIER_BY_ID[club.tierId]) errors.push("KindlyClub tier is unknown.");
    if (!STATUSES.has(club.status)) errors.push("KindlyClub status is invalid.");
    if (club.status === "active" && (!club.tierId || !club.subscriptionId || !iso(club.currentPeriodStart) || !iso(club.currentPeriodEnd) || !VERIFIED_BY.has(club.verifiedBy))) errors.push("Active KindlyClub membership is not server verified.");
    if (club.currentPeriodStart && club.currentPeriodEnd && Date.parse(club.currentPeriodEnd) <= Date.parse(club.currentPeriodStart)) errors.push("KindlyClub period is invalid.");
  }
  return { ok: errors.length === 0, errors };
}

export function commerceCatalogParity() {
  return { coinPacks: Object.keys(COIN_PACK_BY_ID).length, kindlyClubTiers: Object.keys(KINDLY_CLUB_TIER_BY_ID).length };
}
