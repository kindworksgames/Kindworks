import {
  CUSTOM_RESIDENT_APPEARANCE,
  CUSTOM_RESIDENT_HOBBIES,
  CUSTOM_RESIDENT_ID,
  PERSONAL_HOME_HOUSE_ID,
  PERSONAL_HOME_LEVELS,
  PERSONAL_HOME_NAME,
  PERSONAL_HOME_NODE_ID,
  PERSONAL_HOME_OPTIONS,
} from "../data/customResident.js";

export const CUSTOM_RESIDENT_STATE_SCHEMA_VERSION = 2;
export const PERSONAL_HOME_POSITION = Object.freeze({ x: 3875, y: 1620 });
const DIRECTIONS = new Set(["up", "down", "left", "right"]);

export function validateResidentName(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return { ok: false, name: "", reason: "Enter a name for your resident." };
  if (/[^\p{L}\p{N} '’\-]/u.test(raw)) return { ok: false, name: "", reason: "Use only letters, numbers, spaces, apostrophes or hyphens." };
  const name = raw.replace(/\s+/g, " ").slice(0, 18);
  if (!/[\p{L}\p{N}]/u.test(name)) return { ok: false, name: "", reason: "Include at least one letter or number." };
  return { ok: true, name, reason: "" };
}

function allowedKey(catalogue, value, fallback) {
  return Object.prototype.hasOwnProperty.call(catalogue, value) ? value : fallback;
}

export function normalizeCustomResidentProfile(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const name = validateResidentName(raw.name);
  if (!name.ok) return null;
  const hair = Math.max(0, Math.min(3, Math.floor(Number(raw.hair) || 0)));
  const outfit = Math.max(0, Math.min(5, Math.floor(Number(raw.outfit) || 0)));
  const hobbies = [...new Set(Array.isArray(raw.hobbies) ? raw.hobbies : [])]
    .filter((id) => Object.prototype.hasOwnProperty.call(CUSTOM_RESIDENT_HOBBIES, id))
    .slice(0, 3);
  return {
    name: name.name,
    skin: allowedKey(CUSTOM_RESIDENT_APPEARANCE.skin, raw.skin, "warm"),
    hair,
    hairColor: allowedKey(CUSTOM_RESIDENT_APPEARANCE.hairColor, raw.hairColor, "dark-brown"),
    accessory: allowedKey(CUSTOM_RESIDENT_APPEARANCE.accessory, raw.accessory, "none"),
    outfit,
    bodyBuild: allowedKey(CUSTOM_RESIDENT_APPEARANCE.bodyBuild, raw.bodyBuild, "average"),
    hobbies,
  };
}

export function normalizePersonalHome(raw = {}) {
  const level = Math.max(1, Math.min(PERSONAL_HOME_LEVELS.length, Math.floor(Number(raw.level) || 1)));
  return {
    nodeId: PERSONAL_HOME_NODE_ID,
    houseId: PERSONAL_HOME_HOUSE_ID,
    name: PERSONAL_HOME_NAME,
    level,
    wallColor: allowedKey(PERSONAL_HOME_OPTIONS.wallColor, raw.wallColor, "cream"),
    roofStyle: allowedKey(PERSONAL_HOME_OPTIONS.roofStyle, raw.roofStyle, "gable"),
    roofColor: allowedKey(PERSONAL_HOME_OPTIONS.roofColor, raw.roofColor, "terracotta"),
  };
}

export function createFreshCustomResidentState() {
  return {
    schemaVersion: CUSTOM_RESIDENT_STATE_SCHEMA_VERSION,
    residentId: CUSTOM_RESIDENT_ID,
    profile: null,
    home: normalizePersonalHome(),
    location: { ...PERSONAL_HOME_POSITION, facing: "down" },
  };
}

export function normalizeCustomResidentState(value) {
  const fresh = createFreshCustomResidentState();
  if (!value || typeof value !== "object" || Array.isArray(value)) return fresh;
  return {
    schemaVersion: CUSTOM_RESIDENT_STATE_SCHEMA_VERSION,
    residentId: CUSTOM_RESIDENT_ID,
    profile: normalizeCustomResidentProfile(value.profile),
    home: normalizePersonalHome(value.home),
    location: {
      x: Number.isFinite(value.location?.x) ? Math.max(0, Math.min(4400, Number(value.location.x))) : fresh.location.x,
      y: Number.isFinite(value.location?.y) ? Math.max(0, Math.min(2900, Number(value.location.y))) : fresh.location.y,
      facing: DIRECTIONS.has(value.location?.facing) ? value.location.facing : fresh.location.facing,
    },
  };
}

export function projectLegacyCustomResident(legacy) {
  const profile = legacy?.economy?.kindlyClub?.creatorProfile;
  const home = legacy?.playerSetup?.home || profile?.home;
  return normalizeCustomResidentState({ profile, home });
}

export function validateCustomResidentState(value) {
  const errors = [];
  if (!value || typeof value !== "object" || Array.isArray(value)) return { ok: false, errors: ["Custom-resident state must be an object."] };
  if (value.schemaVersion !== CUSTOM_RESIDENT_STATE_SCHEMA_VERSION) errors.push("Custom-resident schema version is invalid.");
  if (value.residentId !== CUSTOM_RESIDENT_ID) errors.push("Custom-resident identity is invalid.");
  if (value.profile) {
    const normalized = normalizeCustomResidentProfile(value.profile);
    if (!normalized || JSON.stringify(normalized) !== JSON.stringify(value.profile)) errors.push("Custom-resident profile is invalid.");
  }
  const normalizedHome = normalizePersonalHome(value.home);
  if (JSON.stringify(normalizedHome) !== JSON.stringify(value.home)) errors.push("Personal-home assignment or design is invalid.");
  if (!Number.isFinite(value.location?.x) || !Number.isFinite(value.location?.y)
    || value.location.x < 0 || value.location.x > 4400 || value.location.y < 0 || value.location.y > 2900) errors.push("Custom-resident location is invalid.");
  if (!DIRECTIONS.has(value.location?.facing)) errors.push("Custom-resident facing direction is invalid.");
  return { ok: errors.length === 0, errors };
}
