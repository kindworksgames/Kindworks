import {
  NPC_INDOOR_NODE_KINDS,
  NPC_NAVIGATION_LINKS,
  NPC_NAVIGATION_NODES,
  NPC_NEEDS_CONFIG,
  NPC_PUBLIC_BINS,
  NPC_RESIDENTS,
  NPC_SOCIAL_CONFIG,
  NPC_TOWN_LIFE_CONFIG,
} from "../data/npcTownLife.js";
import { hashUnit, seededBetween } from "../data/livingEnvironment.js";
import { WEATHER_CONFIG } from "../data/worldSimulation.js";
import { normalizeNpcState, validateNpcState } from "../state/npcState.js";
import { createBinSpillInto, placeNpcLandLitterInto, removeLandItemsInto, updateEnvironmentMetricsInto } from "./LivingEnvironmentService.js";
import { NavigationGraph } from "./NavigationGraph.js";

const PHASES = new Set(["sleeping", "home", "commuting", "working", "leisure"]);
const TAKEAWAY_BY_KIND = Object.freeze({
  cafe: ["cup", "takeaway cup"], bakery: ["wrapper", "bakery wrapper"], pub: ["bottle", "empty bottle"],
  restaurant: ["wrapper", "takeaway wrapper"], shop: ["bag", "shopping bag"], market: ["paper", "market paper bag"],
  cinema: ["wrapper", "cinema wrapper"], beach_cafe: ["cup", "takeaway cup"],
});

function absoluteMinute(world) { return Math.max(0, (Number(world?.day || 1) - 1) * 1440 + Number(world?.clockMinutes || 0)); }
function clamp(value, minimum = 0, maximum = 100) { return Math.max(minimum, Math.min(maximum, Number(value) || 0)); }
function isPublicBinNode(nodeId) { return NPC_PUBLIC_BINS.some((bin) => bin.nodeId === nodeId); }
function collectionBinUnavailable(state, type, id) {
  const collection = state?.municipalCollection;
  const current = collection?.stops?.[collection.stopIndex];
  return Boolean(collection?.active && current?.identity === `${type}:${id}` && collection.phase !== "driving");
}

function reactionFor(state) {
  const band = state.environment?.cleanliness?.band || "restoration-needed";
  if (band === "calm") return { phase: "restored", icon: "🌟", text: "Willowmere feels beautifully restored" };
  if (band === "cared-for") return { phase: "cared", icon: "🌼", text: "The town feels cared for" };
  if (band === "recovering") return { phase: "improving", icon: "🌱", text: "The town is getting brighter" };
  return { phase: "neglected", icon: "🧹", text: "There is still work to do" };
}

function isHourBetween(hour, start, end) {
  return start <= end ? hour >= start && hour < end : hour >= start || hour < end;
}

function hoursUntil(hour, target) {
  return ((target - hour) % 24 + 24) % 24;
}

export function getNpcSchedule(definition, day, clockMinutes) {
  const hour = clockMinutes / 60;
  if (isHourBetween(hour, definition.sleep, definition.wake)) {
    return { phase: "sleeping", targetNodeId: definition.homeNodeId, activity: "Sleeping at home" };
  }
  if (isHourBetween(hour, definition.workStart, definition.workEnd)) {
    return { phase: "working", targetNodeId: definition.workNodeId, activity: `Working as ${definition.role.toLowerCase()}` };
  }
  const afterWork = isHourBetween(hour, definition.workEnd, definition.sleep);
  if (afterWork && hoursUntil(hour, definition.sleep) > 1.25) {
    const targetNodeId = definition.preferred[(Math.max(1, day) + Number(definition.id.slice(-2))) % definition.preferred.length];
    return { phase: "leisure", targetNodeId, activity: "Enjoying some free time" };
  }
  return { phase: "home", targetNodeId: definition.homeNodeId, activity: "Spending time at home" };
}

function savedResident(resident) {
  return structuredClone(resident);
}

export class NpcTownLifeService {
  constructor(gameState, repository, { now = () => Date.now() } = {}) {
    this.gameState = gameState;
    this.repository = repository;
    this.now = now;
    this.graph = new NavigationGraph(NPC_NAVIGATION_NODES, NPC_NAVIGATION_LINKS);
    this.definitions = new Map(NPC_RESIDENTS.map((definition) => [definition.id, definition]));
    const snapshot = gameState.getSnapshot();
    const normalized = normalizeNpcState(snapshot.npcs, snapshot.world);
    this.npcState = structuredClone(normalized);
    this.residents = new Map(normalized.residents.map((resident) => [resident.id, structuredClone(resident)]));
    this.lastPersistedAbsoluteMinute = null;
    this.lastWorldDay = null;
    this.lastWorldMinute = null;
    this.pauseReasons = new Set();
    this.lastResult = { ok: true, status: "ready" };
  }

  nearestNode(x, y) {
    return NPC_NAVIGATION_NODES
      .filter((node) => !NPC_INDOOR_NODE_KINDS.has(node.kind))
      .map((node) => ({ node, distance: Math.hypot(node.x - x, node.y - y) }))
      .sort((a, b) => a.distance - b.distance || a.node.id.localeCompare(b.node.id))[0]?.node || null;
  }

  availableBins(state, resident) {
    const publicBins = state.npcs.publicBins.map((bin) => {
      const definition = NPC_PUBLIC_BINS.find((entry) => entry.id === bin.id);
      return { type: "public", id: bin.id, nodeId: bin.nodeId, x: definition.x, y: definition.y, capacity: bin.capacity, fill: bin.fill, tipped: bin.tipped, source: bin };
    });
    const placedBins = (state.townPlacement?.objects || []).filter((object) => object.hooks?.npcBin).map((object) => {
      const node = this.nearestNode(object.x, object.y);
      return { type: "placed", id: object.id, nodeId: node?.id || resident.currentNodeId, x: object.x, y: object.y, capacity: object.binCapacity, fill: object.binFill, tipped: object.tipped, source: object };
    });
    return [...publicBins, ...placedBins]
      .filter((bin) => !bin.tipped && bin.fill < bin.capacity && !collectionBinUnavailable(state, bin.type, bin.id))
      .sort((a, b) => Math.hypot(a.x - resident.x, a.y - resident.y) - Math.hypot(b.x - resident.x, b.y - resident.y));
  }

  clearCarry(resident) {
    Object.assign(resident, { carryItem: null, carryLabel: null, carryStage: "none", carryOriginBusinessId: null,
      carryGameMinutes: 0, carryStageDurationGameMinutes: 0, pendingCarryLitter: false, binTarget: null, intent: null });
  }

  routeResident(resident, targetNodeId, intent, activity) {
    const start = this.graph.hasNode(resident.currentNodeId) ? resident.currentNodeId : this.definitions.get(resident.id).homeNodeId;
    resident.targetNodeId = targetNodeId;
    resident.route = this.graph.findPath(start, targetNodeId);
    resident.routeIndex = resident.route.length > 1 ? 1 : 0;
    resident.intent = intent;
    resident.phase = resident.route.length > 1 ? "commuting" : "leisure";
    resident.actionState = intent === "dispose" ? "DISPOSING" : "WALKING";
    resident.activity = activity;
    resident.visible = true;
  }

  startCarry(resident, node, now) {
    const item = TAKEAWAY_BY_KIND[node.kind];
    if (!item) return false;
    resident.carryItem = item[0];
    resident.carryLabel = item[1];
    resident.carryStage = "full";
    resident.carryOriginBusinessId = node.id;
    resident.carryGameMinutes = 0;
    resident.carryStageDurationGameMinutes = seededBetween(`carry-full:${resident.id}:${now}`, NPC_SOCIAL_CONFIG.carryFullMinGameMinutes, NPC_SOCIAL_CONFIG.carryFullMaxGameMinutes);
    resident.lastActivityFloorAt = now;
    resident.activity = `Carrying a ${item[1]}`;
    return true;
  }

  finishConversation(state, resident, now) {
    const partner = state.npcs.residents.find((entry) => entry.id === resident.partnerId);
    if (!partner || partner.partnerId !== resident.id) { resident.partnerId = null; return; }
    if (resident.id > partner.id) return;
    resident.needs.social = clamp(resident.needs.social - 72);
    partner.needs.social = clamp(partner.needs.social - 72);
    resident.relationships[partner.id] = clamp(resident.relationships[partner.id] + 2.5);
    partner.relationships[resident.id] = clamp(partner.relationships[resident.id] + 2.5);
    resident.conversations += 1; partner.conversations += 1;
    resident.completedActivities += 1; partner.completedActivities += 1;
    const id = `conversation-${state.npcs.eventSerial++}`;
    state.npcs.conversationHistory.push({ id, a: resident.id, b: partner.id, startedAt: Math.max(0, now - 12), endedAt: now, topic: reactionFor(state).phase === "restored" ? "the restored town" : "life in Willowmere" });
    state.npcs.conversationHistory = state.npcs.conversationHistory.slice(-NPC_TOWN_LIFE_CONFIG.conversationHistoryLimit);
    state.npcs.socialRuntime.conversationEvents += 1;
    for (const entry of [resident, partner]) {
      entry.partnerId = null; entry.activityRemainingGameMinutes = 0; entry.intent = null; entry.greetingIcon = "😊";
      entry.greetingText = `Lovely chat with ${entry.id === resident.id ? this.definitions.get(partner.id).name : this.definitions.get(resident.id).name}`;
      entry.greetingUntil = now + 3;
    }
  }

  completeDisposal(state, resident, now) {
    if (!resident.binTarget || resident.currentNodeId !== resident.binTarget.nodeId) return false;
    const bin = resident.binTarget.type === "public"
      ? state.npcs.publicBins.find((entry) => entry.id === resident.binTarget.id)
      : state.townPlacement?.objects?.find((entry) => entry.id === resident.binTarget.id && entry.hooks?.npcBin);
    const fillKey = resident.binTarget.type === "public" ? "fill" : "binFill";
    const capacityKey = resident.binTarget.type === "public" ? "capacity" : "binCapacity";
    if (!bin || bin.tipped || bin[fillKey] >= bin[capacityKey]) { resident.binTarget = null; resident.intent = null; return false; }
    bin[fillKey] += 1;
    if (resident.binTarget.type === "public") {
      if (bin.fill >= bin.capacity) bin.fullSince = now;
      state.npcs.socialRuntime.publicBinDisposals += 1;
    } else {
      if (bin.binFill >= bin.binCapacity) bin.binFullSince = now;
      state.npcs.socialRuntime.placedBinDisposals += 1;
    }
    resident.responsibleDisposals += 1;
    resident.completedActivities += 1;
    resident.activity = `Put ${resident.carryLabel} in the bin`;
    resident.greetingIcon = "♻️"; resident.greetingText = "Tidied up responsibly"; resident.greetingUntil = now + 4;
    this.clearCarry(resident);
    return true;
  }

  maybeResolveCarry(state, resident, definition, minutes, now) {
    if (!resident.carryItem) return;
    resident.carryGameMinutes += minutes;
    if (resident.carryStage === "full" && resident.carryGameMinutes >= resident.carryStageDurationGameMinutes) {
      resident.carryStage = "empty";
      resident.carryGameMinutes = 0;
      resident.carryStageDurationGameMinutes = seededBetween(`carry-empty:${resident.id}:${now}`, NPC_SOCIAL_CONFIG.carryEmptyMinGameMinutes, NPC_SOCIAL_CONFIG.carryEmptyMaxGameMinutes);
      resident.activity = `Finished ${resident.carryLabel}`;
      return;
    }
    if (resident.carryStage !== "empty" || resident.carryGameMinutes < resident.carryStageDurationGameMinutes || resident.intent === "dispose") return;
    const reaction = reactionFor(state);
    const multiplier = reaction.phase === "restored" ? NPC_SOCIAL_CONFIG.cleanLitterMultiplier
      : reaction.phase === "cared" ? NPC_SOCIAL_CONFIG.caredLitterMultiplier
        : reaction.phase === "improving" ? NPC_SOCIAL_CONFIG.improvingLitterMultiplier : NPC_SOCIAL_CONFIG.neglectedLitterMultiplier;
    const chance = Math.max(0.002, (1 - definition.tidiness) * 0.72) * multiplier;
    const protectedArea = state.npcs.socialRuntime.cleanupProtectionZones.some((zone) => zone.untilGameMinute > now && Math.hypot(zone.x - resident.x, zone.y - resident.y) <= NPC_SOCIAL_CONFIG.protectedCleanupRadius);
    const deliberate = !protectedArea && state.environment?.calm?.untilGameMinute <= now
      && resident.litterDropsToday < NPC_SOCIAL_CONFIG.maxDropsPerNpcPerDay
      && hashUnit(`npc-litter:${resident.id}:${state.npcs.eventSerial++}`) < chance;
    if (deliberate) {
      const dropped = placeNpcLandLitterInto(state, { x: resident.x, y: resident.y, type: resident.carryItem, npcId: resident.id, npcName: definition.name, radius: NPC_SOCIAL_CONFIG.normalDropRadius });
      if (dropped) {
        resident.litterDrops += 1; resident.litterDropsToday += 1; resident.lastMischiefAt = now;
        resident.activity = `Dropped ${resident.carryLabel}`; resident.reactionIcon = "😬"; resident.reactionText = "That was not very tidy"; resident.reactionUntil = now + 5;
        state.npcs.socialRuntime.deliberateLitterEvents += 1;
        this.clearCarry(resident);
        return;
      }
      resident.pendingCarryLitter = true;
    }
    const bin = this.availableBins(state, resident)[0];
    if (bin) {
      resident.binTarget = { type: bin.type, id: bin.id, nodeId: bin.nodeId };
      this.routeResident(resident, bin.nodeId, "dispose", `Taking ${resident.carryLabel} to ${bin.type === "placed" ? "a neighbour's bin" : "the public bin"}`);
    }
  }

  maybeCommunityCare(state, resident, definition, now) {
    const reaction = reactionFor(state);
    if (!["cared", "restored"].includes(reaction.phase) || definition.tidiness < 0.97) return false;
    const runtime = state.npcs.socialRuntime;
    if (now - runtime.lastCommunityCareAt < NPC_SOCIAL_CONFIG.communityCareCooldownGameMinutes || now - resident.lastCommunityCareAt < NPC_SOCIAL_CONFIG.perNpcCareCooldownGameMinutes) return false;
    if (hashUnit(`npc-care:${resident.id}:${Math.floor(now / 15)}`) >= 0.14) return false;
    const publicBins = state.npcs.publicBins.map((bin) => ({ bin, definition: NPC_PUBLIC_BINS.find((entry) => entry.id === bin.id) }));
    const placedBins = (state.townPlacement?.objects || []).filter((object) => object.hooks?.npcBin).map((bin) => ({ bin, definition: { x: bin.x, y: bin.y } }));
    const tipped = [...publicBins, ...placedBins].filter((entry) => entry.bin.tipped && Math.hypot(entry.definition.x - resident.x, entry.definition.y - resident.y) <= 105)
      .sort((a, b) => Math.hypot(a.definition.x - resident.x, a.definition.y - resident.y) - Math.hypot(b.definition.x - resident.x, b.definition.y - resident.y))[0];
    if (tipped && !(tipped.bin.spillIds || []).some((id) => state.environment.land.items.some((item) => item.id === id && item.active))) {
      tipped.bin.tipped = false; tipped.bin.tippedAt = 0; tipped.bin.tippedByNpcId = null; tipped.bin.spillIds = [];
      runtime.binRightingEvents += 1;
      resident.activity = "Righted a tipped public bin";
    } else {
      const litter = state.environment.land.items.filter((item) => item.active && Math.hypot(item.x - resident.x, item.y - resident.y) <= 85)
        .sort((a, b) => Math.hypot(a.x - resident.x, a.y - resident.y) - Math.hypot(b.x - resident.x, b.y - resident.y))[0];
      if (!litter) return false;
      removeLandItemsInto(state, [litter.id]);
      runtime.cleanupProtectionZones.push({ x: litter.x, y: litter.y, untilGameMinute: now + NPC_SOCIAL_CONFIG.protectedCleanupGameMinutes });
      runtime.cleanupProtectionZones = runtime.cleanupProtectionZones.slice(-64);
      resident.activity = `Picked up a ${litter.type}`;
    }
    resident.communityCareEvents += 1; resident.lastCommunityCareAt = now; resident.actionState = "HELPING";
    resident.reactionIcon = "💚"; resident.reactionText = "Helping keep Willowmere lovely"; resident.reactionUntil = now + 6;
    runtime.communityCareEvents += 1; runtime.lastCommunityCareAt = now;
    return true;
  }

  maybeTipBin(state, resident, definition, now) {
    const runtime = state.npcs.socialRuntime;
    if (reactionFor(state).phase !== "neglected" || definition.tidiness >= 0.94) return false;
    if (now - runtime.lastMajorMisbehaviorAt < NPC_SOCIAL_CONFIG.majorMischiefCooldownGameMinutes || now - resident.lastMischiefAt < NPC_SOCIAL_CONFIG.perNpcMischiefCooldownGameMinutes) return false;
    const publicBins = state.npcs.publicBins.map((bin) => ({ type: "public", bin, definition: NPC_PUBLIC_BINS.find((entry) => entry.id === bin.id) }));
    const placedBins = (state.townPlacement?.objects || []).filter((bin) => bin.hooks?.npcBin).map((bin) => ({ type: "placed", bin, definition: { x: bin.x, y: bin.y } }));
    if ([...publicBins, ...placedBins].filter((entry) => entry.bin.tipped).length >= NPC_SOCIAL_CONFIG.maxTippedBins) return false;
    const target = [...publicBins, ...placedBins].filter((entry) => !entry.bin.tipped && !collectionBinUnavailable(state, entry.type, entry.bin.id) && Math.hypot(entry.definition.x - resident.x, entry.definition.y - resident.y) <= 105)[0];
    if (!target || hashUnit(`npc-tip:${resident.id}:${Math.floor(now / 30)}`) >= NPC_SOCIAL_CONFIG.binTipBaseChance * (1 - definition.tidiness + 0.1)) return false;
    target.bin.tipped = true; target.bin.tippedAt = now; target.bin.tippedByNpcId = resident.id;
    const spills = createBinSpillInto(state, { binId: target.bin.id, x: target.definition.x, y: target.definition.y, npcId: resident.id, npcName: definition.name, count: 2 + Math.floor(hashUnit(`npc-tip-count:${resident.id}:${now}`) * 3) });
    target.bin.spillIds = spills.map((item) => item.id);
    resident.lastMischiefAt = now; resident.activity = "Knocked over a bin"; resident.actionState = "MISCHIEF";
    resident.reactionIcon = "🙈"; resident.reactionText = "That made quite a mess"; resident.reactionUntil = now + 6;
    runtime.binTipEvents += 1; runtime.lastMajorMisbehaviorAt = now;
    return true;
  }

  maybeStartConversations(state, now) {
    const candidates = state.npcs.residents.filter((resident) => resident.visible && !resident.partnerId && !resident.intent && resident.needs.social >= 46);
    for (const resident of candidates) {
      if (resident.partnerId) continue;
      const definition = this.definitions.get(resident.id);
      const partner = candidates.filter((other) => other.id !== resident.id && !other.partnerId && other.currentNodeId === resident.currentNodeId)
        .sort((a, b) => (resident.relationships[b.id] || 0) - (resident.relationships[a.id] || 0))[0];
      if (!partner) continue;
      const friendship = resident.relationships[partner.id] || 0;
      const chance = 0.08 + definition.sociability * 0.18 + friendship / 500;
      if (hashUnit(`npc-chat:${resident.id}:${partner.id}:${Math.floor(now / 10)}`) >= chance) continue;
      const duration = seededBetween(`npc-chat-duration:${resident.id}:${partner.id}:${now}`, 10, 24);
      resident.partnerId = partner.id; partner.partnerId = resident.id;
      resident.intent = "conversation"; partner.intent = "conversation";
      resident.activityRemainingGameMinutes = duration; partner.activityRemainingGameMinutes = duration;
      resident.actionState = "SOCIALISING"; partner.actionState = "SOCIALISING";
      resident.activity = `Chatting with ${this.definitions.get(partner.id).name}`;
      partner.activity = `Chatting with ${definition.name}`;
      resident.greetingIcon = "💬"; partner.greetingIcon = "💬";
    }
  }

  advanceBehaviorInto(state) {
    const target = absoluteMinute(state.world);
    const from = state.npcs.lastResolvedAbsoluteMinute;
    if (target <= from) { updateEnvironmentMetricsInto(state); return 0; }
    const cursor = Math.max(from, target - NPC_TOWN_LIFE_CONFIG.maxOfflineGameMinutes);
    const minutes = target - cursor;
    const day = Math.floor(target / 1440) + 1;
    const reaction = reactionFor(state);
    state.npcs.socialRuntime.cleanupProtectionZones = state.npcs.socialRuntime.cleanupProtectionZones.filter((zone) => zone.untilGameMinute > target).slice(-64);
    for (const [index, resident] of state.npcs.residents.entries()) {
      const definition = NPC_RESIDENTS[index];
      if (resident.litterDay !== day) { resident.litterDay = day; resident.litterDropsToday = 0; }
      const rates = resident.phase === "sleeping" ? NPC_NEEDS_CONFIG.asleep : NPC_NEEDS_CONFIG.awake;
      for (const key of Object.keys(resident.needs)) resident.needs[key] = clamp(resident.needs[key] + rates[key] * minutes);
      resident.decisionCooldownGameMinutes = Math.max(0, resident.decisionCooldownGameMinutes - minutes);
      resident.activityRemainingGameMinutes = Math.max(0, resident.activityRemainingGameMinutes - minutes);
      resident.reactionIcon = reaction.icon; resident.reactionText = reaction.text;
      if (resident.partnerId && resident.activityRemainingGameMinutes <= 0) this.finishConversation(state, resident, target);
      if (resident.intent === "dispose") this.completeDisposal(state, resident, target);
      this.maybeResolveCarry(state, resident, definition, minutes, target);
      const node = this.graph.getNode(resident.currentNodeId);
      if (!resident.carryItem && node && TAKEAWAY_BY_KIND[node.kind] && target - resident.lastActivityFloorAt >= 60
        && hashUnit(`npc-carry:${resident.id}:${Math.floor(target / 60)}`) < 0.34) this.startCarry(resident, node, target);
      this.maybeCommunityCare(state, resident, definition, target);
      this.maybeTipBin(state, resident, definition, target);
    }
    this.maybeStartConversations(state, target);
    state.npcs.lastResolvedAbsoluteMinute = target;
    updateEnvironmentMetricsInto(state);
    return target - from;
  }

  effectiveSchedule(resident, regular) {
    if (resident.intent === "dispose" && resident.binTarget?.nodeId) return { phase: "leisure", targetNodeId: resident.binTarget.nodeId, activity: `Taking ${resident.carryLabel || "rubbish"} to a bin`, actionState: "DISPOSING", forceVisible: true };
    if (resident.intent === "conversation" && resident.partnerId) return { phase: "leisure", targetNodeId: resident.currentNodeId, activity: resident.activity, actionState: "SOCIALISING", forceVisible: true };
    return regular;
  }

  planResident(resident, definition, schedule) {
    if (resident.targetNodeId === schedule.targetNodeId && PHASES.has(resident.phase)) {
      resident.phase = resident.currentNodeId === schedule.targetNodeId ? schedule.phase : "commuting";
      resident.activity = resident.phase === "commuting" ? `Walking to ${this.graph.getNode(schedule.targetNodeId).label}` : schedule.activity;
      resident.actionState = resident.phase === "commuting" ? "WALKING" : schedule.actionState || (schedule.phase === "sleeping" ? "SLEEPING" : schedule.phase === "working" ? "WORKING" : schedule.phase === "home" ? "HOME" : "RELAXING");
      if (schedule.forceVisible) resident.visible = true;
      return;
    }
    const current = this.graph.getNode(resident.currentNodeId) || this.graph.getNode(definition.homeNodeId);
    resident.x = current.x;
    resident.y = current.y;
    resident.targetNodeId = schedule.targetNodeId;
    resident.route = this.graph.findPath(current.id, schedule.targetNodeId);
    resident.routeIndex = resident.route.length > 1 ? 1 : 0;
    resident.phase = resident.route.length > 1 ? "commuting" : schedule.phase;
    resident.activity = resident.phase === "commuting" ? `Walking to ${this.graph.getNode(schedule.targetNodeId).label}` : schedule.activity;
    resident.actionState = resident.phase === "commuting" ? "WALKING" : schedule.actionState || "RELAXING";
    resident.visible = Boolean(schedule.forceVisible) || resident.phase === "commuting" || !NPC_INDOOR_NODE_KINDS.has(this.graph.getNode(schedule.targetNodeId).kind);
  }

  moveResident(resident, definition, schedule, distanceBudget) {
    let remaining = Math.max(0, distanceBudget);
    while (remaining > 0 && resident.routeIndex < resident.route.length) {
      const targetId = resident.route[resident.routeIndex];
      const target = this.graph.getNode(targetId);
      const dx = target.x - resident.x;
      const dy = target.y - resident.y;
      const distance = Math.hypot(dx, dy);
      if (distance > 0.001) {
        resident.facingX = dx / distance;
        resident.facingY = dy / distance;
      }
      if (distance > remaining) {
        resident.x += (dx / distance) * remaining;
        resident.y += (dy / distance) * remaining;
        remaining = 0;
        resident.visible = true;
        resident.phase = "commuting";
        break;
      }
      resident.x = target.x;
      resident.y = target.y;
      resident.currentNodeId = targetId;
      resident.routeIndex += 1;
      remaining -= distance;
    }
    if (resident.currentNodeId === schedule.targetNodeId && resident.routeIndex >= resident.route.length) {
      const node = this.graph.getNode(schedule.targetNodeId);
      resident.phase = schedule.phase;
      resident.activity = schedule.activity;
      resident.actionState = schedule.actionState || (schedule.phase === "sleeping" ? "SLEEPING" : schedule.phase === "working" ? "WORKING" : schedule.phase === "home" ? "HOME" : "RELAXING");
      resident.visible = Boolean(schedule.forceVisible) || !NPC_INDOOR_NODE_KINDS.has(node.kind);
      resident.route = [resident.currentNodeId];
      resident.routeIndex = 0;
    }
  }

  update(deltaMilliseconds, world) {
    if (!world) return { ok: false, status: "world-missing" };
    if (this.pauseReasons.size) return { ok: true, status: "paused", reasons: [...this.pauseReasons] };
    const day = world.day;
    const clockMinutes = world.clockMinutes;
    const elapsedSeconds = Math.max(0, Math.min(1, Number(deltaMilliseconds) / 1000 || 0));
    const weatherSpeed = WEATHER_CONFIG.npcSpeed?.[world.weather?.current?.kind] || 1;
    for (const definition of NPC_RESIDENTS) {
      const resident = this.residents.get(definition.id);
      const schedule = this.effectiveSchedule(resident, getNpcSchedule(definition, day, clockMinutes));
      this.planResident(resident, definition, schedule);
      if (elapsedSeconds > 0 && resident.phase === "commuting") this.moveResident(resident, definition, schedule, definition.speed * weatherSpeed * elapsedSeconds);
    }
    const absoluteMinute = (day - 1) * 1440 + clockMinutes;
    const shouldPersist = this.lastPersistedAbsoluteMinute === null
      || absoluteMinute - this.lastPersistedAbsoluteMinute >= NPC_TOWN_LIFE_CONFIG.persistEveryGameMinutes
      || day !== this.lastWorldDay;
    this.lastWorldDay = day;
    this.lastWorldMinute = clockMinutes;
    if (shouldPersist) this.syncState({ persist: true });
    this.lastResult = { ok: true, status: "updated", day, clockMinutes };
    return this.lastResult;
  }

  syncState({ persist = false } = {}) {
    const checkpoint = this.gameState.getSnapshot();
    const next = structuredClone(checkpoint);
    const externalResidents = new Map((next.npcs?.residents || []).map((resident) => [resident.id, resident]));
    this.npcState.residents = NPC_RESIDENTS.map((definition) => {
      const resident = savedResident(this.residents.get(definition.id));
      resident.residentLawnCareEvents = Math.max(resident.residentLawnCareEvents || 0, externalResidents.get(definition.id)?.residentLawnCareEvents || 0);
      return resident;
    });
    this.npcState.publicBins = structuredClone(next.npcs.publicBins);
    next.npcs = normalizeNpcState(this.npcState, next.world);
    this.advanceBehaviorInto(next);
    next.updatedAt = new Date(this.now()).toISOString();
    const validation = validateNpcState(next.npcs, next.world);
    if (!validation.ok) return { ok: false, status: "validation-failed", errors: validation.errors };
    const replaced = this.gameState.replace(next);
    if (!replaced.ok) return { ...replaced, status: "state-rejected" };
    const saveResult = persist ? this.repository?.save?.(next, { now: this.now() }) : { ok: true, status: "deferred" };
    if (!saveResult?.ok) {
      const rollback = this.gameState.replace(checkpoint);
      const restored = normalizeNpcState(checkpoint.npcs, checkpoint.world);
      this.npcState = structuredClone(restored);
      this.residents = new Map(restored.residents.map((resident) => [resident.id, structuredClone(resident)]));
      return { ok: false, status: "persistence-failed", code: "persistence-failed", saveResult, rollbackOk: rollback.ok };
    }
    this.npcState = structuredClone(next.npcs);
    this.residents = new Map(next.npcs.residents.map((resident) => [resident.id, structuredClone(resident)]));
    this.lastPersistedAbsoluteMinute = next.npcs.lastResolvedAbsoluteMinute;
    const result = { ok: true, status: persist ? "persisted" : "synced", saveResult };
    this.lastResult = result;
    return result;
  }

  getResidents() {
    return NPC_RESIDENTS.map((definition) => ({ ...definition, ...savedResident(this.residents.get(definition.id)) }));
  }

  getPublicBins() {
    return NPC_PUBLIC_BINS.map((definition) => ({ ...definition, ...structuredClone(this.npcState.publicBins.find((bin) => bin.id === definition.id)) }));
  }

  refreshPublicBins() {
    const snapshot = this.gameState.getSnapshot();
    this.npcState.publicBins = structuredClone(normalizeNpcState(snapshot.npcs, snapshot.world).publicBins);
    return this.getPublicBins();
  }

  updatePlayerProximity(x, y, world) {
    if (!Number.isFinite(x) || !Number.isFinite(y) || !world || this.pauseReasons.size) return 0;
    const now = absoluteMinute(world);
    const townReaction = reactionFor(this.gameState.getSnapshot());
    let greetings = 0;
    for (const definition of NPC_RESIDENTS) {
      const resident = this.residents.get(definition.id);
      if (!resident.visible || now < resident.nextGreetingProbeAt || Math.hypot(resident.x - x, resident.y - y) > NPC_SOCIAL_CONFIG.greetingDistance) continue;
      resident.nextGreetingProbeAt = now + seededBetween(`greeting-probe:${resident.id}:${now}`, NPC_SOCIAL_CONFIG.greetingProbeMinGameMinutes, NPC_SOCIAL_CONFIG.greetingProbeMaxGameMinutes);
      if (now - resident.lastGreetingAt < NPC_SOCIAL_CONFIG.greetingCooldownMinGameMinutes || hashUnit(`greeting:${resident.id}:${now}`) > definition.sociability) continue;
      const greeting = resident.actionState === "HELPING" ? ["💚", "Keeping Willowmere lovely!"]
        : resident.carryItem ? ["👋", `Hello! I'm taking care of this ${resident.carryLabel}.`]
          : townReaction.phase === "restored" ? ["🌟", "Isn't Willowmere looking wonderful?"]
            : townReaction.phase === "neglected" ? ["🧹", "Hello—there is plenty we can improve together."]
              : ["👋", `Hello from ${definition.name}!`];
      resident.greetingIcon = greeting[0]; resident.greetingText = greeting[1]; resident.greetingUntil = now + 3;
      resident.lastGreetingAt = now; resident.greetings += 1; greetings += 1;
      this.npcState.socialRuntime.greetingEvents += 1;
    }
    return greetings;
  }

  setPaused(reason, paused) {
    if (!reason) return { ok: false, status: "missing-reason" };
    if (paused) this.pauseReasons.add(reason);
    else this.pauseReasons.delete(reason);
    return { ok: true, status: this.pauseReasons.size ? "paused" : "running", reasons: [...this.pauseReasons] };
  }

  getDiagnostics() {
    const residents = this.getResidents();
    const counts = residents.reduce((out, resident) => {
      out[resident.phase] = (out[resident.phase] || 0) + 1;
      return out;
    }, {});
    return {
      version: "2.0.0-milestone-28",
      enabled: true,
      residentCount: residents.length,
      visibleCount: residents.filter((resident) => resident.visible).length,
      walkingCount: residents.filter((resident) => resident.phase === "commuting").length,
      paused: this.pauseReasons.size > 0,
      pauseReasons: [...this.pauseReasons],
      phaseCounts: counts,
      graph: this.graph.validate(),
      allHomesReachWork: NPC_RESIDENTS.every((resident) => this.graph.findPath(resident.homeNodeId, resident.workNodeId).length > 0),
      needsAndRelationships: residents.every((resident) => resident.needs && Object.keys(resident.relationships || {}).length === 34),
      conversations: this.npcState.socialRuntime.conversationEvents,
      greetings: this.npcState.socialRuntime.greetingEvents,
      carryingCount: residents.filter((resident) => resident.carryItem).length,
      publicBins: this.getPublicBins().map((bin) => ({ id: bin.id, fill: bin.fill, capacity: bin.capacity, tipped: bin.tipped })),
      playerPlacedBins: (this.gameState.getSnapshot().townPlacement?.objects || []).filter((object) => object.hooks?.npcBin).length,
      deliberateLitterEvents: this.npcState.socialRuntime.deliberateLitterEvents,
      communityCareEvents: this.npcState.socialRuntime.communityCareEvents,
      residentLawnCareEvents: residents.reduce((sum, resident) => sum + resident.residentLawnCareEvents, 0),
      lastResult: { ...this.lastResult },
    };
  }
}
