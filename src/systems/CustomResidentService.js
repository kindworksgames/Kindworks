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
  customResidentPalette,
  customResidentPreferredNodes,
  personalHomeCapacity,
  personalHomeLevel,
  personalHomeRedesignQuote,
} from "../data/customResident.js";
import { NPC_INDOOR_NODE_KINDS, NPC_NAVIGATION_LINKS, NPC_NAVIGATION_NODES } from "../data/npcTownLife.js";
import { COIN_LEDGER_LIMIT } from "../state/economyState.js";
import {
  normalizeCustomResidentProfile,
  normalizeCustomResidentState,
  normalizePersonalHome,
  validateResidentName,
} from "../state/customResidentState.js";
import { reconcileHomeFurnitureInto } from "./HomeInteriorService.js";
import { NavigationGraph } from "./NavigationGraph.js";

const DIRECTIONS = new Set(["up", "down", "left", "right"]);

function absoluteMinute(world) {
  return Math.max(0, (Math.max(1, Math.floor(Number(world?.day) || 1)) - 1) * 1440 + Math.max(0, Math.floor(Number(world?.clockMinutes) || 0)));
}

function hourInRange(hour, [start, end] = [0, 24]) {
  return start <= end ? hour >= start && hour < end : hour >= start || hour < end;
}

function autonomySchedule(profile, world) {
  const hour = Math.max(0, Math.min(23.999, Number(world?.clockMinutes || 0) / 60));
  if (hour >= CUSTOM_RESIDENT_AUTONOMY.sleepHour || hour < CUSTOM_RESIDENT_AUTONOMY.wakeHour) {
    return { phase: "sleeping", targetNodeId: PERSONAL_HOME_NODE_ID, activity: "Sleeping at home", hobby: null };
  }
  if (hour < CUSTOM_RESIDENT_AUTONOMY.workStartHour) {
    return { phase: "home", targetNodeId: PERSONAL_HOME_NODE_ID, activity: `Starting the day at ${PERSONAL_HOME_NAME}`, hobby: null };
  }
  if (hour < CUSTOM_RESIDENT_AUTONOMY.workEndHour) {
    return { phase: "working", targetNodeId: CUSTOM_RESIDENT_AUTONOMY.workNodeId, activity: "Helping around Willowmere", hobby: null };
  }
  const eligible = (profile?.hobbies || [])
    .map((id) => ({ id, ...CUSTOM_RESIDENT_HOBBIES[id] }))
    .filter((hobby) => hobby.nodes?.length && (!hobby.hours || hourInRange(hour, hobby.hours)));
  const day = Math.max(1, Math.floor(Number(world?.day) || 1));
  const slot = Math.floor(hour * 2);
  const hobby = eligible[(day + slot) % Math.max(1, eligible.length)] || null;
  const preferred = hobby?.nodes?.length ? hobby.nodes : customResidentPreferredNodes(profile);
  const targetNodeId = preferred[(day + slot) % preferred.length] || "square";
  return {
    phase: "leisure",
    targetNodeId,
    activity: hobby ? `Enjoying ${hobby.label.toLowerCase()}` : "Enjoying some free time",
    hobby,
  };
}

function choiceExists(catalogue, value) {
  return Object.prototype.hasOwnProperty.call(catalogue, value);
}

function appendHomeLedger(state, now, details) {
  const serial = state.economy.nextTransactionId;
  const entry = {
    id: `coin-${String(serial).padStart(6, "0")}`,
    itemId: null,
    quantity: null,
    shopId: "personal-home",
    balance: state.economy.coins,
    occurredAt: new Date(now()).toISOString(),
    ...details,
  };
  state.economy.nextTransactionId += 1;
  state.economy.ledger.push(entry);
  state.economy.ledger = state.economy.ledger.slice(-COIN_LEDGER_LIMIT);
  return entry;
}

export class CustomResidentService {
  constructor(gameState, repository, { now = () => Date.now() } = {}) {
    this.gameState = gameState;
    this.repository = repository;
    this.now = now;
    this.listeners = new Set();
    this.graph = new NavigationGraph(NPC_NAVIGATION_NODES, NPC_NAVIGATION_LINKS);
    this.control = { active: false, returnPlayer: null };
    this.runtimeLocation = { ...normalizeCustomResidentState(gameState.getSnapshot().customResident).location };
    this.locationDirty = false;
    this.lastResult = { ok: true, code: "ready" };
  }

  subscribe(listener) {
    if (typeof listener !== "function") throw new TypeError("A custom-resident listener must be a function.");
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit() {
    const snapshot = this.getSnapshot();
    for (const listener of this.listeners) listener(snapshot);
  }

  getSnapshot() {
    const state = normalizeCustomResidentState(this.gameState.getSnapshot().customResident);
    state.location = { ...this.runtimeLocation };
    return {
      ...structuredClone(state),
      created: Boolean(state.profile),
      controlling: this.control.active,
    };
  }

  getResident() {
    const state = this.getSnapshot();
    if (!state.profile) return null;
    return {
      id: CUSTOM_RESIDENT_ID,
      name: state.profile.name,
      role: "Your resident",
      x: state.location.x,
      y: state.location.y,
      facingX: state.location.facing === "left" ? -1 : state.location.facing === "right" ? 1 : 0,
      facingY: state.location.facing === "up" ? -1 : state.location.facing === "down" ? 1 : 0,
      phase: this.control.active ? "controlled" : state.autonomy.phase,
      activity: this.control.active ? "Exploring town with you" : state.autonomy.activity,
      visible: this.control.active || state.autonomy.visible,
      palette: customResidentPalette(state.profile),
      hairStyle: state.profile.hair,
      accessoryStyle: state.profile.accessory,
      bodyScale: CUSTOM_RESIDENT_APPEARANCE.bodyBuild[state.profile.bodyBuild],
      hobbies: [...state.profile.hobbies],
      needs: structuredClone(state.autonomy.needs),
      relationships: structuredClone(state.autonomy.relationships),
      conversations: state.autonomy.conversations,
      shoppingVisits: state.autonomy.shoppingVisits,
      communityCareEvents: state.autonomy.communityCareEvents,
      responsibleDisposals: state.autonomy.responsibleDisposals,
    };
  }

  nearestNode(x, y) {
    return NPC_NAVIGATION_NODES
      .map((node) => ({ node, distance: Math.hypot(node.x - x, node.y - y) }))
      .sort((a, b) => a.distance - b.distance || a.node.id.localeCompare(b.node.id))[0]?.node || null;
  }

  advanceInto(state, _before, result = {}) {
    const resident = normalizeCustomResidentState(state.customResident);
    const minutes = Math.max(0, Math.floor(Number(result.advancedGameMinutes) || 0));
    if (!resident.profile || !minutes || this.control.active) {
      state.customResident = resident;
      return { advanced: 0, controlled: this.control.active };
    }
    const autonomy = resident.autonomy;
    const now = absoluteMinute(state.world);
    const schedule = autonomySchedule(resident.profile, state.world);
    if (autonomy.targetNodeId !== schedule.targetNodeId || autonomy.route.at(-1) !== schedule.targetNodeId) {
      autonomy.targetNodeId = schedule.targetNodeId;
      autonomy.route = this.graph.findPath(autonomy.currentNodeId, schedule.targetNodeId);
      if (!autonomy.route.length) autonomy.route = [autonomy.currentNodeId];
      autonomy.routeIndex = autonomy.route.length > 1 ? 1 : 0;
      if (schedule.hobby?.kind === "shop") autonomy.shoppingVisits += 1;
    }

    let remaining = minutes * CUSTOM_RESIDENT_AUTONOMY.speedWorldUnitsPerGameMinute;
    while (remaining > 0 && autonomy.routeIndex < autonomy.route.length) {
      const target = this.graph.getNode(autonomy.route[autonomy.routeIndex]);
      const dx = target.x - resident.location.x;
      const dy = target.y - resident.location.y;
      const distance = Math.hypot(dx, dy);
      if (distance > remaining && distance > 0) {
        resident.location.x += (dx / distance) * remaining;
        resident.location.y += (dy / distance) * remaining;
        resident.location.facing = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? "left" : "right") : (dy < 0 ? "up" : "down");
        remaining = 0;
        break;
      }
      resident.location.x = target.x;
      resident.location.y = target.y;
      autonomy.currentNodeId = target.id;
      autonomy.routeIndex += 1;
      remaining -= distance;
    }

    const arrived = autonomy.currentNodeId === schedule.targetNodeId && autonomy.routeIndex >= autonomy.route.length;
    autonomy.phase = arrived ? schedule.phase : "commuting";
    autonomy.activity = arrived ? schedule.activity : `Walking to ${this.graph.getNode(schedule.targetNodeId)?.label || "another part of Willowmere"}`;
    autonomy.visible = !arrived || !NPC_INDOOR_NODE_KINDS.has(this.graph.getNode(schedule.targetNodeId)?.kind);

    const needs = autonomy.needs;
    needs.hunger = Math.min(100, needs.hunger + minutes * 0.035);
    needs.social = Math.min(100, needs.social + minutes * 0.03);
    needs.recreation = Math.min(100, needs.recreation + minutes * 0.028);
    needs.errands = Math.min(100, needs.errands + minutes * 0.018);
    needs.rest = Math.min(100, needs.rest + minutes * 0.025);
    if (arrived && schedule.phase === "sleeping") needs.rest = Math.max(0, needs.rest - minutes * 0.2);
    if (arrived && schedule.hobby?.kind === "eat") needs.hunger = Math.max(0, needs.hunger - minutes * 0.18);
    if (arrived && schedule.hobby?.kind === "shop") needs.errands = Math.max(0, needs.errands - minutes * 0.16);
    if (arrived && schedule.phase === "leisure") needs.recreation = Math.max(0, needs.recreation - minutes * 0.12);

    const candidates = (state.npcs?.residents || []).filter((entry) => entry.visible && entry.id && entry.id !== resident.residentId);
    if (arrived && schedule.phase === "leisure" && candidates.length && now - autonomy.lastConversationAt >= CUSTOM_RESIDENT_AUTONOMY.conversationCooldownGameMinutes) {
      const partner = candidates[autonomy.eventSerial % candidates.length];
      autonomy.eventSerial += 1;
      autonomy.lastConversationAt = now;
      autonomy.conversations += 1;
      autonomy.completedActivities += 1;
      autonomy.needs.social = Math.max(0, autonomy.needs.social - 72);
      autonomy.relationships[partner.id] = Math.min(100, (autonomy.relationships[partner.id] || 12) + 2.5);
      partner.relationships = partner.relationships || {};
      partner.relationships[resident.residentId] = Math.min(100, (partner.relationships[resident.residentId] || 12) + 2.5);
      partner.conversations = Math.max(0, Number(partner.conversations) || 0) + 1;
      partner.completedActivities = Math.max(0, Number(partner.completedActivities) || 0) + 1;
      state.npcs.socialRuntime.conversationEvents += 1;
      state.npcs.conversationHistory.push({ id: `conversation-custom-${autonomy.eventSerial}`, a: resident.residentId, b: partner.id, startedAt: Math.max(0, now - 12), endedAt: now, topic: "life in Willowmere" });
      state.npcs.conversationHistory = state.npcs.conversationHistory.slice(-100);
      autonomy.activity = `Lovely chat with ${partner.id}`;
    }

    if (arrived && resident.profile.hobbies.includes("helping")
      && ["square", "cnw", "garden"].includes(autonomy.currentNodeId)
      && now - autonomy.lastCommunityCareAt >= CUSTOM_RESIDENT_AUTONOMY.communityCareCooldownGameMinutes) {
      autonomy.lastCommunityCareAt = now;
      autonomy.communityCareEvents += 1;
      autonomy.completedActivities += 1;
      autonomy.responsibleDisposals += 1;
      autonomy.activity = "Helping keep Willowmere tidy";
    }

    autonomy.lastResolvedAbsoluteMinute = now;
    resident.autonomy = autonomy;
    state.customResident = resident;
    this.runtimeLocation = { ...resident.location };
    return { advanced: minutes, phase: autonomy.phase, activity: autonomy.activity };
  }

  validateDraft(raw = {}) {
    const checkedName = validateResidentName(raw.name);
    if (!checkedName.ok) return { ok: false, code: "invalid-name", field: "name", message: checkedName.reason };
    const hair = Number(raw.hair);
    const outfit = Number(raw.outfit);
    if (!choiceExists(CUSTOM_RESIDENT_APPEARANCE.skin, raw.skin)) return { ok: false, code: "invalid-appearance", field: "skin", message: "Choose a valid skin tone." };
    if (!Number.isInteger(hair) || hair < 0 || hair > 3) return { ok: false, code: "invalid-appearance", field: "hair", message: "Choose a valid hair style." };
    if (!choiceExists(CUSTOM_RESIDENT_APPEARANCE.hairColor, raw.hairColor)) return { ok: false, code: "invalid-appearance", field: "hairColor", message: "Choose a valid hair colour." };
    if (!choiceExists(CUSTOM_RESIDENT_APPEARANCE.accessory, raw.accessory)) return { ok: false, code: "invalid-appearance", field: "accessory", message: "Choose a valid accessory." };
    if (!Number.isInteger(outfit) || outfit < 0 || outfit > 5) return { ok: false, code: "invalid-appearance", field: "outfit", message: "Choose a valid outfit colour." };
    if (!choiceExists(CUSTOM_RESIDENT_APPEARANCE.bodyBuild, raw.bodyBuild)) return { ok: false, code: "invalid-appearance", field: "bodyBuild", message: "Choose a valid body build." };
    const hobbies = [...new Set(Array.isArray(raw.hobbies) ? raw.hobbies : [])];
    if (hobbies.length > 3) return { ok: false, code: "too-many-hobbies", field: "hobbies", message: "Choose up to three hobbies." };
    if (hobbies.some((id) => !choiceExists(CUSTOM_RESIDENT_HOBBIES, id))) return { ok: false, code: "invalid-hobby", field: "hobbies", message: "Choose only the available hobbies." };
    for (const field of ["wallColor", "roofStyle", "roofColor"]) {
      if (!choiceExists(PERSONAL_HOME_OPTIONS[field], raw.home?.[field])) return { ok: false, code: "invalid-home", field, message: "Choose a valid starter-home design." };
    }
    return {
      ok: true,
      profile: normalizeCustomResidentProfile({ ...raw, name: checkedName.name, hair, outfit, hobbies }),
      home: normalizePersonalHome(raw.home),
    };
  }

  commit(mutator, { failureMessage = "Your resident was not changed because the new profile could not be saved." } = {}) {
    const checkpoint = this.gameState.getSnapshot();
    const working = structuredClone(checkpoint);
    const mutation = mutator(working);
    if (!mutation.ok) return mutation;
    working.updatedAt = new Date(this.now()).toISOString();
    const replaced = this.gameState.replace(working);
    if (!replaced.ok) return { ok: false, code: "state-validation", errors: replaced.errors };
    const save = this.repository.save(working, { now: this.now() });
    if (!save.ok) {
      this.gameState.replace(checkpoint);
      return { ok: false, code: "persistence-failed", message: failureMessage, save };
    }
    return { ...mutation, state: this.getSnapshot(), save };
  }

  saveProfile(raw) {
    const validation = this.validateDraft(raw);
    if (!validation.ok) return validation;
    const wasCreated = Boolean(this.gameState.getSnapshot().customResident?.profile);
    const result = this.commit((state) => {
      const current = normalizeCustomResidentState(state.customResident);
      current.profile = validation.profile;
      // The first design is included with creation. Once the home exists, profile
      // edits cannot bypass Milestone 31's paid redesign and upgrade paths.
      if (!wasCreated) current.home = validation.home;
      current.location = { ...this.runtimeLocation };
      state.customResident = current;
      return { ok: true, code: wasCreated ? "profile-updated" : "resident-created" };
    });
    this.lastResult = result;
    if (result.ok) {
      this.locationDirty = false;
      this.emit();
    }
    return result;
  }

  getHomeProgression(rawDesign = null) {
    const state = this.gameState.getSnapshot();
    const resident = normalizeCustomResidentState(state.customResident);
    const home = resident.home;
    const definition = personalHomeLevel(home.level);
    const next = PERSONAL_HOME_LEVELS[definition.level] || null;
    const target = normalizePersonalHome({ ...home, ...(rawDesign || {}), level: home.level });
    const redesign = personalHomeRedesignQuote(home, target, state.economy.coins);
    return {
      created: Boolean(resident.profile),
      nodeId: PERSONAL_HOME_NODE_ID,
      houseId: PERSONAL_HOME_HOUSE_ID,
      home: structuredClone(home),
      name: definition.name,
      capacity: definition.capacity,
      scale: definition.scale,
      coins: state.economy.coins,
      levels: PERSONAL_HOME_LEVELS.map((level) => ({
        ...level,
        current: level.level === definition.level,
        complete: level.level < definition.level,
        locked: level.level > definition.level + 1,
      })),
      nextUpgrade: next ? { ...next, affordable: state.economy.coins >= next.cost, shortfall: Math.max(0, next.cost - state.economy.coins) } : null,
      redesign: {
        ...redesign,
        changes: redesign.changes.map((change) => ({ ...change })),
        from: structuredClone(home),
        to: structuredClone(target),
      },
    };
  }

  quoteHomeRedesign(rawDesign) {
    return this.getHomeProgression(rawDesign).redesign;
  }

  redesignHome(rawDesign) {
    if (!this.getSnapshot().profile) return { ok: false, code: "resident-not-created", message: "Create your resident first." };
    const preview = this.quoteHomeRedesign(rawDesign);
    if (!preview.cost) return { ok: true, code: "design-unchanged", unchanged: true, cost: 0, home: this.getHomeProgression().home };
    if (!preview.affordable) return { ok: false, code: "insufficient-funds", message: `You need ${preview.shortfall.toLocaleString()} more coins for this redesign.`, required: preview.cost, available: preview.balance };
    const result = this.commit((state) => {
      const resident = normalizeCustomResidentState(state.customResident);
      if (!resident.profile) return { ok: false, code: "resident-not-created", message: "Create your resident first." };
      const target = normalizePersonalHome({ ...resident.home, ...(rawDesign || {}), level: resident.home.level });
      const quote = personalHomeRedesignQuote(resident.home, target, state.economy.coins);
      if (!quote.cost) return { ok: true, code: "design-unchanged", unchanged: true, cost: 0, home: resident.home };
      if (!quote.affordable) return { ok: false, code: "insufficient-funds", message: "Not enough KindlyCoins.", required: quote.cost, available: state.economy.coins };
      const before = structuredClone(resident.home);
      state.economy.coins -= quote.cost;
      state.economy.lifetimeCoinsSpent += quote.cost;
      resident.home = target;
      state.customResident = resident;
      const ledger = appendHomeLedger(state, this.now, {
        amount: -quote.cost,
        kind: "personal-home-redesign",
        reason: `Redesigned ${PERSONAL_HOME_NAME}`,
        level: before.level,
        from: before,
        to: structuredClone(target),
        changes: quote.changes.map(({ key, label, cost }) => ({ key, label, cost })),
      });
      return { ok: true, code: "home-redesigned", cost: quote.cost, changes: quote.changes.map((change) => ({ ...change })), home: structuredClone(target), ledger };
    }, { failureMessage: "The home redesign could not be saved, so the coins and previous design were restored." });
    this.lastResult = result;
    if (result.ok) this.emit();
    return result;
  }

  upgradeHome(rawDesign = null) {
    if (!this.getSnapshot().profile) return { ok: false, code: "resident-not-created", message: "Create your resident first." };
    const preview = this.getHomeProgression(rawDesign);
    if (!preview.nextUpgrade) return { ok: false, code: "fully-upgraded", message: "Your resident's home is already fully upgraded." };
    if (!preview.nextUpgrade.affordable) return { ok: false, code: "insufficient-funds", message: `You need ${preview.nextUpgrade.shortfall.toLocaleString()} more coins for this upgrade.`, required: preview.nextUpgrade.cost, available: preview.coins };
    const result = this.commit((state) => {
      const resident = normalizeCustomResidentState(state.customResident);
      if (!resident.profile) return { ok: false, code: "resident-not-created", message: "Create your resident first." };
      const current = personalHomeLevel(resident.home.level);
      const next = PERSONAL_HOME_LEVELS[current.level] || null;
      if (!next) return { ok: false, code: "fully-upgraded", message: "Your resident's home is already fully upgraded." };
      if (state.economy.coins < next.cost) return { ok: false, code: "insufficient-funds", message: "Not enough KindlyCoins.", required: next.cost, available: state.economy.coins };
      const before = structuredClone(resident.home);
      const target = normalizePersonalHome({ ...resident.home, ...(rawDesign || {}), level: next.level });
      state.economy.coins -= next.cost;
      state.economy.lifetimeCoinsSpent += next.cost;
      resident.home = target;
      state.customResident = resident;
      const furnitureReconciliation = reconcileHomeFurnitureInto(state);
      const ledger = appendHomeLedger(state, this.now, {
        amount: -next.cost,
        kind: "personal-home-upgrade",
        reason: `Upgraded ${PERSONAL_HOME_NAME} to Level ${next.level}`,
        fromLevel: current.level,
        toLevel: next.level,
        homeName: next.name,
        fromCapacity: personalHomeCapacity(current.level),
        toCapacity: personalHomeCapacity(next.level),
        from: before,
        to: structuredClone(target),
      });
      return { ok: true, code: "home-upgraded", cost: next.cost, fromLevel: current.level, toLevel: next.level, capacity: next.capacity, home: structuredClone(target), furnitureReconciliation, ledger };
    }, { failureMessage: "The home upgrade could not be saved, so the coins and previous home were restored." });
    this.lastResult = result;
    if (result.ok) this.emit();
    return result;
  }

  locate() {
    const resident = this.getResident();
    if (!resident) return { ok: false, code: "resident-not-created", message: "Create your resident first." };
    return { ok: true, code: "located", resident, location: { x: resident.x, y: resident.y }, home: this.getSnapshot().home };
  }

  beginControl(player) {
    if (!this.getResident()) return { ok: false, code: "resident-not-created", message: "Create your resident first." };
    if (this.control.active) return { ok: false, code: "already-controlling", message: "You are already controlling your resident." };
    this.control = {
      active: true,
      returnPlayer: {
        x: Number(player?.x) || 0,
        y: Number(player?.y) || 0,
        facing: DIRECTIONS.has(player?.facing) ? player.facing : "down",
      },
    };
    this.emit();
    return { ok: true, code: "control-started", resident: this.getResident(), returnPlayer: { ...this.control.returnPlayer } };
  }

  setRuntimePosition({ x, y, facing }) {
    if (!this.control.active) return { ok: false, code: "not-controlling" };
    if (Number.isFinite(x)) this.runtimeLocation.x = Math.max(0, Math.min(4400, Number(x)));
    if (Number.isFinite(y)) this.runtimeLocation.y = Math.max(0, Math.min(2900, Number(y)));
    if (DIRECTIONS.has(facing)) this.runtimeLocation.facing = facing;
    this.locationDirty = true;
    return { ok: true, location: { ...this.runtimeLocation } };
  }

  persistLocation() {
    if (!this.locationDirty) return { ok: true, code: "unchanged" };
    const result = this.commit((state) => {
      const customResident = normalizeCustomResidentState(state.customResident);
      customResident.location = { ...this.runtimeLocation };
      const nearest = this.nearestNode(this.runtimeLocation.x, this.runtimeLocation.y);
      if (nearest) {
        customResident.autonomy.currentNodeId = nearest.id;
        customResident.autonomy.targetNodeId = nearest.id;
        customResident.autonomy.route = [nearest.id];
        customResident.autonomy.routeIndex = 0;
        customResident.autonomy.phase = "leisure";
        customResident.autonomy.activity = "Choosing what to do next";
        customResident.autonomy.visible = true;
      }
      state.customResident = customResident;
      return { ok: true, code: "location-saved" };
    });
    if (result.ok) this.locationDirty = false;
    this.lastResult = result;
    return result;
  }

  endControl() {
    if (!this.control.active) return { ok: false, code: "not-controlling", message: "Your resident is not being controlled." };
    const returnPlayer = { ...this.control.returnPlayer };
    this.control = { active: false, returnPlayer: null };
    const save = this.persistLocation();
    this.emit();
    return { ok: save.ok, code: save.ok ? "control-ended" : save.code, returnPlayer, save, resident: this.getResident() };
  }

  getDiagnostics() {
    const state = this.getSnapshot();
    return {
      enabled: true,
      created: state.created,
      residentId: state.residentId,
      residentName: state.profile?.name || null,
      homeNodeId: state.home.nodeId,
      homeName: state.home.name,
      homeLevel: state.home.level,
      homeHouseId: state.home.houseId,
      homeCapacity: personalHomeCapacity(state.home.level),
      nextHomeUpgrade: this.getHomeProgression().nextUpgrade,
      hobbyCount: state.profile?.hobbies.length || 0,
      controlling: state.controlling,
      location: { ...state.location },
      locationDirty: this.locationDirty,
      autonomy: {
        phase: state.autonomy.phase,
        activity: state.autonomy.activity,
        currentNodeId: state.autonomy.currentNodeId,
        targetNodeId: state.autonomy.targetNodeId,
        conversations: state.autonomy.conversations,
        shoppingVisits: state.autonomy.shoppingVisits,
        communityCareEvents: state.autonomy.communityCareEvents,
        responsibleDisposals: state.autonomy.responsibleDisposals,
      },
      lastResult: { ...this.lastResult },
    };
  }
}
