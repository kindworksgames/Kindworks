import {
  NPC_ACTIONS,
  NPC_NAVIGATION_LINKS,
  NPC_NAVIGATION_NODES,
  NPC_PUBLIC_BINS,
  NPC_RESIDENTS,
  NPC_TOWN_LIFE_CONFIG,
} from "../data/npcTownLife.js";
import { NavigationGraph } from "../systems/NavigationGraph.js";
import { createInitialHarbourWardrobe, HARBOUR_GENERAL_CATALOG, HARBOUR_GENERAL_WARDROBE_KEYS } from "../data/harbourGeneral.js";

export const NPC_STATE_SCHEMA_VERSION = 2;
const graph = new NavigationGraph(NPC_NAVIGATION_NODES, NPC_NAVIGATION_LINKS);
const residentDefinitions = new Map(NPC_RESIDENTS.map((resident) => [resident.id, resident]));
const ACTIONS = new Set(NPC_ACTIONS);
const PHASES = new Set(["sleeping", "home", "commuting", "working", "leisure"]);
const CARRY_STAGES = new Set(["none", "full", "empty"]);

function bounded(value, minimum, maximum, fallback = minimum) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(minimum, Math.min(maximum, number)) : fallback;
}

function whole(value, minimum = 0, maximum = Number.MAX_SAFE_INTEGER, fallback = minimum) {
  return Math.floor(bounded(value, minimum, maximum, fallback));
}

function absoluteMinute(world) {
  return Math.max(0, (whole(world?.day, 1) - 1) * 1440 + whole(world?.clockMinutes, 0, 1439));
}

function initialRelationships(definition) {
  return Object.fromEntries(NPC_RESIDENTS.filter((other) => other.id !== definition.id)
    .map((other) => [other.id, definition.friendNames.includes(other.name) ? 35 : 8]));
}

function freshResident(definition, index) {
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
    actionState: "HOME",
    intent: null,
    activity: `At home in ${home.label}`,
    activityRemainingGameMinutes: 0,
    decisionCooldownGameMinutes: 2 + (index % 5),
    workStreak: 0,
    workPatrolIndex: 0,
    lastDestinationNodeId: definition.homeNodeId,
    partnerId: null,
    visible: false,
    needs: { hunger: 24 + (index * 11) % 29, social: 22 + (index * 17) % 35, recreation: 18 + (index * 13) % 32, errands: 12 + (index * 7) % 24, rest: 18 + (index * 5) % 20 },
    relationships: initialRelationships(definition),
    litterDay: 1, litterDropsToday: 0, litterDrops: 0, responsibleDisposals: 0, completedActivities: 0,
    conversations: 0, greetings: 0, communityCareEvents: 0, residentLawnCareEvents: 0,
    carryItem: null, carryLabel: null, carryStage: "none", carryOriginBusinessId: null,
    carryGameMinutes: 0, carryStageDurationGameMinutes: 0, pendingCarryLitter: false, binTarget: null,
    lastMischiefAt: 0, lastCommunityCareAt: 0, lastGreetingAt: 0, nextGreetingProbeAt: 0,
    greetingIcon: null, greetingText: null, greetingUntil: 0,
    reactionIcon: "🌱", reactionText: "Willowmere still needs care", reactionUntil: 0,
    lastActivityFloorAt: 0, activityFloorInterventions: 0,
    weatherWardrobe: createInitialHarbourWardrobe(definition.id), lastHarbourPurchaseId: null, lastHarbourPurchaseDay: 0,
  };
}

function freshPublicBin(definition) {
  return { id: definition.id, nodeId: definition.nodeId, capacity: definition.capacity, fill: definition.initialFill,
    fullSince: definition.initialFill >= definition.capacity ? 0 : null, lastEmptiedDay: 0, collections: 0,
    tipped: false, tippedAt: 0, tippedByNpcId: null, spillIds: [] };
}

export function createFreshNpcState(world = { day: 1, clockMinutes: 0 }) {
  return {
    schemaVersion: NPC_STATE_SCHEMA_VERSION,
    lastResolvedAbsoluteMinute: absoluteMinute(world),
    eventSerial: 1,
    residents: NPC_RESIDENTS.map((definition, index) => freshResident(definition, index)),
    publicBins: NPC_PUBLIC_BINS.map(freshPublicBin),
    socialRuntime: {
      lastMajorMisbehaviorAt: 0, lastCommunityCareAt: 0, binTipEvents: 0, deliberateLitterEvents: 0,
      communityCareEvents: 0, binRightingEvents: 0, conversationEvents: 0, greetingEvents: 0,
      placedBinDisposals: 0, publicBinDisposals: 0, cleanupProtectionZones: [],
    },
    conversationHistory: [],
  };
}

function normalizeNeeds(value, fresh) {
  return Object.fromEntries(Object.keys(fresh).map((key) => [key, bounded(value?.[key], 0, 100, fresh[key])]));
}

function normalizeRelationships(value, definition) {
  const fresh = initialRelationships(definition);
  return Object.fromEntries(Object.keys(fresh).map((id) => [id, bounded(value?.[id], 0, 100, fresh[id])]));
}

function normalizeBinTarget(value) {
  if (!value || typeof value !== "object" || !["public", "placed"].includes(value.type) || typeof value.id !== "string") return null;
  return { type: value.type, id: value.id.slice(0, 100), nodeId: graph.hasNode(value.nodeId) ? value.nodeId : null };
}

function normalizeResident(value, definition, index) {
  const fresh = freshResident(definition, index);
  if (!value || typeof value !== "object" || value.id !== definition.id) return fresh;
  const currentNodeId = graph.hasNode(value.currentNodeId) ? value.currentNodeId : fresh.currentNodeId;
  const targetNodeId = graph.hasNode(value.targetNodeId) ? value.targetNodeId : currentNodeId;
  const route = Array.isArray(value.route) && value.route.length && value.route.every((id) => graph.hasNode(id))
    ? value.route.slice(0, 128)
    : graph.findPath(currentNodeId, targetNodeId);
  const routeIndex = Math.max(0, Math.min(route.length - 1, Math.floor(Number(value.routeIndex) || 0)));
  const node = graph.getNode(currentNodeId);
  const carryStage = CARRY_STAGES.has(value.carryStage) ? value.carryStage : value.carryItem ? "full" : "none";
  return {
    ...fresh,
    id: definition.id,
    currentNodeId,
    targetNodeId,
    route: route.length ? route : [currentNodeId],
    routeIndex,
    x: bounded(value.x, 0, 4400, node.x),
    y: bounded(value.y, 0, 2900, node.y),
    facingX: bounded(value.facingX, -1, 1, 0),
    facingY: bounded(value.facingY, -1, 1, 1),
    phase: PHASES.has(value.phase) ? value.phase : fresh.phase,
    actionState: ACTIONS.has(value.actionState) ? value.actionState : fresh.actionState,
    intent: value.intent ? String(value.intent).slice(0, 40) : null,
    activity: String(value.activity || fresh.activity).slice(0, 120),
    activityRemainingGameMinutes: bounded(value.activityRemainingGameMinutes, 0, 1440, 0),
    decisionCooldownGameMinutes: bounded(value.decisionCooldownGameMinutes, 0, 1440, fresh.decisionCooldownGameMinutes),
    workStreak: whole(value.workStreak, 0, 100),
    workPatrolIndex: whole(value.workPatrolIndex, 0, 100),
    lastDestinationNodeId: graph.hasNode(value.lastDestinationNodeId) ? value.lastDestinationNodeId : currentNodeId,
    partnerId: residentDefinitions.has(value.partnerId) && value.partnerId !== definition.id ? value.partnerId : null,
    visible: Boolean(value.visible),
    needs: normalizeNeeds(value.needs, fresh.needs),
    relationships: normalizeRelationships(value.relationships, definition),
    litterDay: whole(value.litterDay, 1),
    litterDropsToday: whole(value.litterDropsToday, 0, 2),
    litterDrops: whole(value.litterDrops), responsibleDisposals: whole(value.responsibleDisposals),
    completedActivities: whole(value.completedActivities), conversations: whole(value.conversations), greetings: whole(value.greetings),
    communityCareEvents: whole(value.communityCareEvents), residentLawnCareEvents: whole(value.residentLawnCareEvents),
    carryItem: carryStage === "none" ? null : String(value.carryItem || "wrapper").slice(0, 30),
    carryLabel: carryStage === "none" ? null : String(value.carryLabel || "takeaway item").slice(0, 60),
    carryStage,
    carryOriginBusinessId: carryStage === "none" || !value.carryOriginBusinessId ? null : String(value.carryOriginBusinessId).slice(0, 80),
    carryGameMinutes: bounded(value.carryGameMinutes, 0, 1440, 0),
    carryStageDurationGameMinutes: bounded(value.carryStageDurationGameMinutes, 0, 1440, 0),
    pendingCarryLitter: carryStage !== "none" && Boolean(value.pendingCarryLitter),
    binTarget: normalizeBinTarget(value.binTarget),
    lastMischiefAt: bounded(value.lastMischiefAt, 0, Number.MAX_SAFE_INTEGER, 0),
    lastCommunityCareAt: bounded(value.lastCommunityCareAt, 0, Number.MAX_SAFE_INTEGER, 0),
    lastGreetingAt: bounded(value.lastGreetingAt, 0, Number.MAX_SAFE_INTEGER, 0),
    nextGreetingProbeAt: bounded(value.nextGreetingProbeAt, 0, Number.MAX_SAFE_INTEGER, 0),
    greetingIcon: value.greetingIcon ? String(value.greetingIcon).slice(0, 8) : null,
    greetingText: value.greetingText ? String(value.greetingText).slice(0, 100) : null,
    greetingUntil: bounded(value.greetingUntil, 0, Number.MAX_SAFE_INTEGER, 0),
    reactionIcon: value.reactionIcon ? String(value.reactionIcon).slice(0, 8) : fresh.reactionIcon,
    reactionText: String(value.reactionText || fresh.reactionText).slice(0, 100),
    reactionUntil: bounded(value.reactionUntil, 0, Number.MAX_SAFE_INTEGER, 0),
    lastActivityFloorAt: bounded(value.lastActivityFloorAt, 0, Number.MAX_SAFE_INTEGER, 0),
    activityFloorInterventions: whole(value.activityFloorInterventions),
    weatherWardrobe: Object.fromEntries(HARBOUR_GENERAL_WARDROBE_KEYS.map((key) => [key, Boolean(value.weatherWardrobe?.[key] ?? fresh.weatherWardrobe[key])])),
    lastHarbourPurchaseId: HARBOUR_GENERAL_CATALOG[value.lastHarbourPurchaseId] ? value.lastHarbourPurchaseId : null,
    lastHarbourPurchaseDay: whole(value.lastHarbourPurchaseDay),
  };
}

function normalizePublicBin(value, definition) {
  const fresh = freshPublicBin(definition);
  const capacity = whole(value?.capacity ?? value?.binCapacity, 1, 9999, fresh.capacity);
  const fill = whole(value?.fill ?? value?.binFill, 0, capacity, fresh.fill);
  return { ...fresh, capacity, fill,
    fullSince: fill >= capacity ? (Number.isFinite(Number(value?.fullSince ?? value?.binFullSince)) ? Math.max(0, Number(value.fullSince ?? value.binFullSince)) : 0) : null,
    lastEmptiedDay: whole(value?.lastEmptiedDay), collections: whole(value?.collections), tipped: Boolean(value?.tipped),
    tippedAt: whole(value?.tippedAt), tippedByNpcId: residentDefinitions.has(value?.tippedByNpcId) ? value.tippedByNpcId : null,
    spillIds: Array.isArray(value?.spillIds) ? [...new Set(value.spillIds.filter((id) => typeof id === "string"))].slice(0, 6) : [] };
}

export function normalizeNpcState(value, world = { day: 1, clockMinutes: 0 }) {
  const fresh = createFreshNpcState(world);
  const byId = new Map(Array.isArray(value?.residents) ? value.residents.map((resident) => [resident?.id, resident]) : []);
  const binById = new Map(Array.isArray(value?.publicBins) ? value.publicBins.map((bin) => [bin?.id, bin]) : []);
  const runtime = value?.socialRuntime && typeof value.socialRuntime === "object" ? value.socialRuntime : {};
  return {
    schemaVersion: NPC_STATE_SCHEMA_VERSION,
    lastResolvedAbsoluteMinute: whole(value?.lastResolvedAbsoluteMinute, 0, absoluteMinute(world), absoluteMinute(world)),
    eventSerial: whole(value?.eventSerial, 1, Number.MAX_SAFE_INTEGER, 1),
    residents: NPC_RESIDENTS.map((definition, index) => normalizeResident(byId.get(definition.id), definition, index)),
    publicBins: NPC_PUBLIC_BINS.map((definition) => normalizePublicBin(binById.get(definition.id), definition)),
    socialRuntime: {
      lastMajorMisbehaviorAt: whole(runtime.lastMajorMisbehaviorAt), lastCommunityCareAt: whole(runtime.lastCommunityCareAt),
      binTipEvents: whole(runtime.binTipEvents ?? runtime.npcBinTipEvents), deliberateLitterEvents: whole(runtime.deliberateLitterEvents ?? runtime.npcDeliberateLitterEvents),
      communityCareEvents: whole(runtime.communityCareEvents ?? runtime.npcCommunityCareEvents), binRightingEvents: whole(runtime.binRightingEvents ?? runtime.npcBinRightingEvents),
      conversationEvents: whole(runtime.conversationEvents), greetingEvents: whole(runtime.greetingEvents),
      placedBinDisposals: whole(runtime.placedBinDisposals), publicBinDisposals: whole(runtime.publicBinDisposals),
      cleanupProtectionZones: Array.isArray(runtime.cleanupProtectionZones) ? runtime.cleanupProtectionZones.slice(-64).map((zone) => ({
        x: bounded(zone?.x, 0, 4400, 0), y: bounded(zone?.y, 0, 2900, 0), untilGameMinute: whole(zone?.untilGameMinute ?? zone?.until, 0),
      })) : [],
    },
    conversationHistory: Array.isArray(value?.conversationHistory) ? value.conversationHistory.slice(-NPC_TOWN_LIFE_CONFIG.conversationHistoryLimit).map((entry) => ({
      id: String(entry?.id || "conversation").slice(0, 80), a: String(entry?.a || "").slice(0, 20), b: String(entry?.b || "").slice(0, 20),
      startedAt: whole(entry?.startedAt), endedAt: whole(entry?.endedAt), topic: String(entry?.topic || "Willowmere").slice(0, 80),
    })) : [],
  };
}

export function projectLegacyNpcState(legacy, world = { day: 1, clockMinutes: 0 }) {
  const fresh = createFreshNpcState(world);
  if (!legacy || typeof legacy !== "object") return fresh;
  const runtime = legacy.socialRestorationRuntime || {};
  return normalizeNpcState({
    ...fresh,
    residents: Array.isArray(legacy.npcs) ? legacy.npcs.map((resident) => ({
      ...resident,
      phase: resident.phase || (resident.actionState === "SLEEPING" ? "sleeping" : resident.actionState === "WORKING" ? "working" : resident.actionState === "WALKING" ? "commuting" : "leisure"),
      actionState: resident.actionState || resident.state,
    })) : fresh.residents,
    publicBins: Array.isArray(runtime.publicBins) ? runtime.publicBins : fresh.publicBins,
    socialRuntime: runtime,
  }, world);
}

export function validateNpcState(value, world = { day: 1, clockMinutes: 0 }) {
  const errors = [];
  if (!value || typeof value !== "object" || Array.isArray(value)) return { ok: false, errors: ["NPC town-life state must be an object."] };
  if (value.schemaVersion !== NPC_STATE_SCHEMA_VERSION) errors.push("NPC town-life schema version is invalid.");
  if (!Number.isInteger(value.lastResolvedAbsoluteMinute) || value.lastResolvedAbsoluteMinute < 0) errors.push("NPC resolution time is invalid.");
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
    if (!PHASES.has(resident.phase) || !ACTIONS.has(resident.actionState)) errors.push(`${resident.id} activity phase is invalid.`);
    if (typeof resident.visible !== "boolean" || typeof resident.activity !== "string") errors.push(`${resident.id} presentation state is invalid.`);
    if (!resident.needs || Object.values(resident.needs).some((need) => !Number.isFinite(need) || need < 0 || need > 100)) errors.push(`${resident.id} needs are invalid.`);
    if (!resident.relationships || Object.keys(resident.relationships).length !== NPC_RESIDENTS.length - 1 || Object.values(resident.relationships).some((score) => !Number.isFinite(score) || score < 0 || score > 100)) errors.push(`${resident.id} relationships are invalid.`);
    if (!CARRY_STAGES.has(resident.carryStage) || (resident.carryStage === "none" && resident.carryItem !== null)) errors.push(`${resident.id} carried item is invalid.`);
    if (!resident.weatherWardrobe || HARBOUR_GENERAL_WARDROBE_KEYS.some((key) => typeof resident.weatherWardrobe[key] !== "boolean")) errors.push(`${resident.id} weather wardrobe is invalid.`);
    if (resident.lastHarbourPurchaseId !== null && !HARBOUR_GENERAL_CATALOG[resident.lastHarbourPurchaseId]) errors.push(`${resident.id} Harbour General purchase is invalid.`);
    if (!Number.isInteger(resident.lastHarbourPurchaseDay) || resident.lastHarbourPurchaseDay < 0) errors.push(`${resident.id} Harbour General purchase day is invalid.`);
  }
  if (!Array.isArray(value.publicBins) || value.publicBins.length !== NPC_PUBLIC_BINS.length) errors.push("The five public bins are incomplete.");
  else for (const definition of NPC_PUBLIC_BINS) {
    const bin = value.publicBins.find((entry) => entry.id === definition.id);
    if (!bin || bin.nodeId !== definition.nodeId || !Number.isInteger(bin.fill) || bin.fill < 0 || bin.fill > bin.capacity || typeof bin.tipped !== "boolean" || !Array.isArray(bin.spillIds)) errors.push(`${definition.id} has invalid public-bin state.`);
  }
  if (!value.socialRuntime || typeof value.socialRuntime !== "object" || !Array.isArray(value.socialRuntime.cleanupProtectionZones) || value.socialRuntime.cleanupProtectionZones.length > 64) errors.push("NPC community runtime is invalid.");
  if (!Array.isArray(value.conversationHistory) || value.conversationHistory.length > NPC_TOWN_LIFE_CONFIG.conversationHistoryLimit) errors.push("NPC conversation history is invalid.");
  return { ok: errors.length === 0, errors };
}
