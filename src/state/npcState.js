import {
  NPC_NAVIGATION_LINKS,
  NPC_NAVIGATION_NODES,
  NPC_RESIDENTS,
  NPC_TOWN_LIFE_CONFIG,
} from "../data/npcTownLife.js";
import { NavigationGraph } from "../systems/NavigationGraph.js";

export const NPC_STATE_SCHEMA_VERSION = 1;
const graph = new NavigationGraph(NPC_NAVIGATION_NODES, NPC_NAVIGATION_LINKS);
const residentDefinitions = new Map(NPC_RESIDENTS.map((resident) => [resident.id, resident]));

function freshResident(definition) {
  const home = graph.getNode(definition.homeNodeId);
  return {
    id: definition.id,
    currentNodeId: definition.homeNodeId,
    targetNodeId: definition.homeNodeId,
    route: [definition.homeNodeId],
    routeIndex: 0,
    x: home.x,
    y: home.y,
    facingX: 0,
    facingY: 1,
    phase: "home",
    activity: `At home in ${home.label}`,
    visible: false,
  };
}

export function createFreshNpcState() {
  return {
    schemaVersion: NPC_STATE_SCHEMA_VERSION,
    residents: NPC_RESIDENTS.map((definition) => freshResident(definition)),
  };
}

function normalizeResident(value, definition) {
  const fresh = freshResident(definition);
  if (!value || typeof value !== "object" || value.id !== definition.id) return fresh;
  const currentNodeId = graph.hasNode(value.currentNodeId) ? value.currentNodeId : fresh.currentNodeId;
  const targetNodeId = graph.hasNode(value.targetNodeId) ? value.targetNodeId : currentNodeId;
  const route = Array.isArray(value.route) && value.route.length && value.route.every((id) => graph.hasNode(id))
    ? value.route.slice(0, 128)
    : graph.findPath(currentNodeId, targetNodeId);
  const routeIndex = Math.max(0, Math.min(route.length - 1, Math.floor(Number(value.routeIndex) || 0)));
  const node = graph.getNode(currentNodeId);
  const x = Number.isFinite(value.x) ? Math.max(0, Math.min(4400, Number(value.x))) : node.x;
  const y = Number.isFinite(value.y) ? Math.max(0, Math.min(2900, Number(value.y))) : node.y;
  const phase = ["sleeping", "home", "commuting", "working", "leisure"].includes(value.phase) ? value.phase : "home";
  return {
    id: definition.id,
    currentNodeId,
    targetNodeId,
    route: route.length ? route : [currentNodeId],
    routeIndex,
    x,
    y,
    facingX: Number.isFinite(value.facingX) ? Math.max(-1, Math.min(1, Number(value.facingX))) : 0,
    facingY: Number.isFinite(value.facingY) ? Math.max(-1, Math.min(1, Number(value.facingY))) : 1,
    phase,
    activity: String(value.activity || fresh.activity).slice(0, 120),
    visible: Boolean(value.visible),
  };
}

export function normalizeNpcState(value) {
  const byId = new Map(Array.isArray(value?.residents) ? value.residents.map((resident) => [resident?.id, resident]) : []);
  return {
    schemaVersion: NPC_STATE_SCHEMA_VERSION,
    residents: NPC_RESIDENTS.map((definition) => normalizeResident(byId.get(definition.id), definition)),
  };
}

export function validateNpcState(value) {
  const errors = [];
  if (!value || typeof value !== "object" || Array.isArray(value)) return { ok: false, errors: ["NPC town-life state must be an object."] };
  if (value.schemaVersion !== NPC_STATE_SCHEMA_VERSION) errors.push("NPC town-life schema version is invalid.");
  if (!Array.isArray(value.residents) || value.residents.length !== NPC_TOWN_LIFE_CONFIG.residentCount) {
    errors.push(`NPC town life must contain exactly ${NPC_TOWN_LIFE_CONFIG.residentCount} residents.`);
    return { ok: false, errors };
  }
  const seen = new Set();
  for (const resident of value.residents) {
    const definition = residentDefinitions.get(resident?.id);
    if (!definition || seen.has(resident.id)) {
      errors.push(`NPC resident identity is invalid: ${resident?.id || "missing"}.`);
      continue;
    }
    seen.add(resident.id);
    if (!graph.hasNode(resident.currentNodeId) || !graph.hasNode(resident.targetNodeId)) errors.push(`${resident.id} has an unknown location.`);
    if (!Array.isArray(resident.route) || !resident.route.length || resident.route.some((id) => !graph.hasNode(id))) errors.push(`${resident.id} has an invalid route.`);
    else for (let index = 1; index < resident.route.length; index += 1) if (!graph.areLinked(resident.route[index - 1], resident.route[index])) errors.push(`${resident.id} route leaves the navigation graph.`);
    if (!Number.isInteger(resident.routeIndex) || resident.routeIndex < 0 || resident.routeIndex >= resident.route.length) errors.push(`${resident.id} route index is invalid.`);
    if (!Number.isFinite(resident.x) || !Number.isFinite(resident.y) || resident.x < 0 || resident.x > 4400 || resident.y < 0 || resident.y > 2900) errors.push(`${resident.id} position is invalid.`);
    if (!["sleeping", "home", "commuting", "working", "leisure"].includes(resident.phase)) errors.push(`${resident.id} phase is invalid.`);
    if (typeof resident.visible !== "boolean" || typeof resident.activity !== "string") errors.push(`${resident.id} presentation state is invalid.`);
  }
  return { ok: errors.length === 0, errors };
}
