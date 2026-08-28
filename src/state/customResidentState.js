import {
  CUSTOM_RESIDENT_APPEARANCE,
  CUSTOM_RESIDENT_AUTONOMY,
  CUSTOM_RESIDENT_HOBBIES,
  CUSTOM_RESIDENT_ID,
  PERSONAL_HOME_HOUSE_ID,
  PERSONAL_HOME_LEVELS,
  PERSONAL_HOME_NAME,
  PERSONAL_HOME_NODE_ID,
  PERSONAL_HOME_OPTIONS,
} from "../data/customResident.js";
import { NPC_NAVIGATION_NODES, NPC_RESIDENTS } from "../data/npcTownLife.js";

export const CUSTOM_RESIDENT_STATE_SCHEMA_VERSION = 3;
export const PERSONAL_HOME_POSITION = Object.freeze({ x: 3875, y: 1620 });
const DIRECTIONS = new Set(["up", "down", "left", "right"]);
const PHASES = new Set(["sleeping", "home", "commuting", "working", "leisure"]);
const NODE_IDS = new Set(NPC_NAVIGATION_NODES.map((node) => node.id));
const NPC_IDS = NPC_RESIDENTS.map((resident) => resident.id);

function bounded(value, minimum, maximum, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(minimum, Math.min(maximum, number)) : fallback;
}

function freshRelationships() {
  return Object.fromEntries(NPC_IDS.map((id) => [id, 12]));
}

export function createFreshCustomResidentAutonomy() {
  return {
    currentNodeId: PERSONAL_HOME_NODE_ID,
    targetNodeId: PERSONAL_HOME_NODE_ID,
    route: [PERSONAL_HOME_NODE_ID],
    routeIndex: 0,
    phase: "home",
    activity: `At home in ${PERSONAL_HOME_NAME}`,
    visible: false,
    needs: { hunger: 28, social: 24, recreation: 22, errands: 15, rest: 20 },
    relationships: freshRelationships(),
    conversations: 0,
    shoppingVisits: 0,
    communityCareEvents: 0,
    responsibleDisposals: 0,
    completedActivities: 0,
    lastConversationAt: 0,
    lastCommunityCareAt: 0,
    lastResolvedAbsoluteMinute: 0,
    eventSerial: 1,
  };
}

export function normalizeCustomResidentAutonomy(value) {
  const fresh = createFreshCustomResidentAutonomy();
  if (!value || typeof value !== "object" || Array.isArray(value)) return fresh;
  const currentNodeId = NODE_IDS.has(value.currentNodeId) ? value.currentNodeId : fresh.currentNodeId;
  const targetNodeId = NODE_IDS.has(value.targetNodeId) ? value.targetNodeId : currentNodeId;
  const route = Array.isArray(value.route) && value.route.length && value.route.every((id) => NODE_IDS.has(id))
    ? value.route.slice(0, 128)
    : [currentNodeId];
  return {
    currentNodeId,
    targetNodeId,
    route,
    routeIndex: Math.max(0, Math.min(route.length, Math.floor(Number(value.routeIndex) || 0))),
    phase: PHASES.has(value.phase) ? value.phase : fresh.phase,
    activity: String(value.activity || fresh.activity).slice(0, 120),
    visible: Boolean(value.visible),
    needs: Object.fromEntries(Object.keys(fresh.needs).map((key) => [key, bounded(value.needs?.[key], 0, 100, fresh.needs[key])])),
    relationships: Object.fromEntries(NPC_IDS.map((id) => [id, bounded(value.relationships?.[id], 0, 100, 12)])),
    conversations: Math.max(0, Math.floor(Number(value.conversations) || 0)),
    shoppingVisits: Math.max(0, Math.floor(Number(value.shoppingVisits) || 0)),
    communityCareEvents: Math.max(0, Math.floor(Number(value.communityCareEvents) || 0)),
    responsibleDisposals: Math.max(0, Math.floor(Number(value.responsibleDisposals) || 0)),
    completedActivities: Math.max(0, Math.floor(Number(value.completedActivities) || 0)),
    lastConversationAt: Math.max(0, Math.floor(Number(value.lastConversationAt) || 0)),
    lastCommunityCareAt: Math.max(0, Math.floor(Number(value.lastCommunityCareAt) || 0)),
    lastResolvedAbsoluteMinute: Math.max(0, Math.floor(Number(value.lastResolvedAbsoluteMinute) || 0)),
    eventSerial: Math.max(1, Math.floor(Number(value.eventSerial) || 1)),
  };
}

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
    autonomy: createFreshCustomResidentAutonomy(),
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
    autonomy: normalizeCustomResidentAutonomy(value.autonomy),
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
  const autonomy = normalizeCustomResidentAutonomy(value.autonomy);
  if (JSON.stringify(autonomy) !== JSON.stringify(value.autonomy)) errors.push("Custom-resident autonomy state is invalid.");
  if (autonomy.relationships && Object.keys(autonomy.relationships).length !== NPC_IDS.length) errors.push("Custom-resident relationships are incomplete.");
  if (autonomy.phase === "working" && autonomy.targetNodeId !== CUSTOM_RESIDENT_AUTONOMY.workNodeId) errors.push("Custom-resident work destination is invalid.");
  return { ok: errors.length === 0, errors };
}
