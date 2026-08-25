import {
  NPC_INDOOR_NODE_KINDS,
  NPC_NAVIGATION_LINKS,
  NPC_NAVIGATION_NODES,
  NPC_RESIDENTS,
  NPC_TOWN_LIFE_CONFIG,
} from "../data/npcTownLife.js";
import { WEATHER_CONFIG } from "../data/worldSimulation.js";
import { normalizeNpcState, validateNpcState } from "../state/npcState.js";
import { NavigationGraph } from "./NavigationGraph.js";

const PHASES = new Set(["sleeping", "home", "commuting", "working", "leisure"]);

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
  return {
    id: resident.id,
    currentNodeId: resident.currentNodeId,
    targetNodeId: resident.targetNodeId,
    route: [...resident.route],
    routeIndex: resident.routeIndex,
    x: resident.x,
    y: resident.y,
    facingX: resident.facingX,
    facingY: resident.facingY,
    phase: resident.phase,
    activity: resident.activity,
    visible: resident.visible,
  };
}

export class NpcTownLifeService {
  constructor(gameState, repository, { now = () => Date.now() } = {}) {
    this.gameState = gameState;
    this.repository = repository;
    this.now = now;
    this.graph = new NavigationGraph(NPC_NAVIGATION_NODES, NPC_NAVIGATION_LINKS);
    this.definitions = new Map(NPC_RESIDENTS.map((definition) => [definition.id, definition]));
    const normalized = normalizeNpcState(gameState.getSnapshot().npcs);
    this.residents = new Map(normalized.residents.map((resident) => [resident.id, structuredClone(resident)]));
    this.lastPersistedAbsoluteMinute = null;
    this.lastWorldDay = null;
    this.lastWorldMinute = null;
    this.pauseReasons = new Set();
    this.lastResult = { ok: true, status: "ready" };
  }

  planResident(resident, definition, schedule) {
    if (resident.targetNodeId === schedule.targetNodeId && PHASES.has(resident.phase)) {
      resident.phase = resident.currentNodeId === schedule.targetNodeId ? schedule.phase : "commuting";
      resident.activity = resident.phase === "commuting" ? `Walking to ${this.graph.getNode(schedule.targetNodeId).label}` : schedule.activity;
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
    resident.visible = resident.phase === "commuting" || !NPC_INDOOR_NODE_KINDS.has(this.graph.getNode(schedule.targetNodeId).kind);
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
      resident.visible = !NPC_INDOOR_NODE_KINDS.has(node.kind);
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
      const schedule = getNpcSchedule(definition, day, clockMinutes);
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
    const next = this.gameState.getSnapshot();
    next.npcs = {
      schemaVersion: NPC_TOWN_LIFE_CONFIG.schemaVersion,
      residents: NPC_RESIDENTS.map((definition) => savedResident(this.residents.get(definition.id))),
    };
    next.updatedAt = new Date(this.now()).toISOString();
    const validation = validateNpcState(next.npcs);
    if (!validation.ok) return { ok: false, status: "validation-failed", errors: validation.errors };
    const replaced = this.gameState.replace(next);
    if (!replaced.ok) return { ...replaced, status: "state-rejected" };
    const saveResult = persist ? this.repository?.save?.(this.gameState.getSnapshot(), { now: this.now() }) : null;
    if (!persist || saveResult?.ok) this.lastPersistedAbsoluteMinute = this.lastWorldDay === null ? null : (this.lastWorldDay - 1) * 1440 + this.lastWorldMinute;
    return { ok: true, status: persist ? "persisted" : "synced", saveResult };
  }

  getResidents() {
    return NPC_RESIDENTS.map((definition) => ({ ...definition, ...savedResident(this.residents.get(definition.id)) }));
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
      enabled: true,
      residentCount: residents.length,
      visibleCount: residents.filter((resident) => resident.visible).length,
      walkingCount: residents.filter((resident) => resident.phase === "commuting").length,
      paused: this.pauseReasons.size > 0,
      pauseReasons: [...this.pauseReasons],
      phaseCounts: counts,
      graph: this.graph.validate(),
      allHomesReachWork: NPC_RESIDENTS.every((resident) => this.graph.findPath(resident.homeNodeId, resident.workNodeId).length > 0),
      lastResult: { ...this.lastResult },
    };
  }
}
