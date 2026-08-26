import { ITEM_CATALOG } from "../data/items.js";
import {
  MUNICIPAL_COLLECTION_CONFIG,
  MUNICIPAL_COLLECTION_PHASES,
  MUNICIPAL_COLLECTOR,
  MUNICIPAL_DEPOT,
  buildMunicipalVehicleNetwork,
  closestMunicipalRoadNode,
  municipalShortestPath,
  municipalVehicleAllowedAt,
  planMunicipalCollectionStops,
} from "../data/municipalCollection.js";
import { NPC_PUBLIC_BINS } from "../data/npcTownLife.js";
import {
  createFreshMunicipalCollectionState,
  normalizeMunicipalCollectionState,
  validateMunicipalCollectionState,
} from "../state/municipalCollectionState.js";
import { removeLandItemsInto, updateEnvironmentMetricsInto } from "./LivingEnvironmentService.js";

const LIFTED_PHASES = new Set(["lifting", "walking-bin-to-truck", "emptying", "returning-bin", "placing"]);

function absoluteGameMinute(world) {
  return (Math.max(1, Math.floor(Number(world?.day) || 1)) - 1) * 1440 + Math.max(0, Math.min(1439, Math.floor(Number(world?.clockMinutes) || 0)));
}

function identity(type, id) { return `${type}:${id}`; }

function binRecords(state) {
  const publicRecords = NPC_PUBLIC_BINS.map((definition) => {
    const bin = state.npcs?.publicBins?.find((entry) => entry.id === definition.id);
    return bin ? {
      identity: identity("public", bin.id), type: "public", id: bin.id, nodeId: bin.nodeId,
      x: definition.x, y: definition.y, rotation: 0, label: `${definition.district} bin`, itemId: null, state: bin,
    } : null;
  }).filter(Boolean);
  const placedRecords = (state.townPlacement?.objects || []).filter((object) => object.hooks?.npcBin).map((object) => ({
    identity: identity("placed", object.id), type: "placed", id: object.id, nodeId: null,
    x: object.x, y: object.y, rotation: Number(object.rotation) || 0,
    label: ITEM_CATALOG[object.itemId]?.name || "Placed bin", itemId: object.itemId, state: object,
  }));
  return [...publicRecords, ...placedRecords];
}

function binRecord(state, targetIdentity) {
  return binRecords(state).find((record) => record.identity === targetIdentity) || null;
}

function moveEntity(entity, target, speed, seconds) {
  const dx = target.x - entity.x;
  const dy = target.y - entity.y;
  const distance = Math.hypot(dx, dy);
  if (distance < 0.01) {
    entity.x = target.x; entity.y = target.y;
    return { arrived: true, remaining: seconds };
  }
  const travelSeconds = distance / Math.max(1, speed);
  if (seconds >= travelSeconds) {
    entity.x = target.x; entity.y = target.y;
    return { arrived: true, remaining: seconds - travelSeconds };
  }
  const ratio = seconds / travelSeconds;
  entity.x += dx * ratio; entity.y += dy * ratio;
  return { arrived: false, remaining: 0 };
}

export class MunicipalCollectionService {
  constructor(gameState, repository, { now = () => Date.now() } = {}) {
    this.gameState = gameState;
    this.repository = repository;
    this.now = now;
    this.pauseReasons = new Set();
    this.pendingBinChanges = new Map();
    this.checkpointNeeded = false;
    this.checkpointElapsedMilliseconds = 0;
    this.lastResult = { ok: true, status: "ready" };
    const snapshot = gameState.getSnapshot();
    this.state = normalizeMunicipalCollectionState(snapshot.municipalCollection, snapshot.world);
    this.restoreAgainstTown(snapshot);
  }

  restoreAgainstTown(snapshot = this.gameState.getSnapshot()) {
    if (!this.state.active) return this.state;
    const available = new Map(binRecords(snapshot).map((record) => [record.identity, record]));
    this.state.stops = this.state.stops.map((stop) => {
      const record = available.get(stop.identity);
      return record ? { ...stop, nodeId: record.nodeId, label: record.label, itemId: record.itemId,
        originalX: record.x, originalY: record.y, originalRotation: record.rotation } : null;
    }).filter(Boolean);
    if (!this.state.stops.length) {
      this.state = createFreshMunicipalCollectionState(snapshot.world);
      return this.state;
    }
    this.state.stopIndex = Math.max(0, Math.min(this.state.stopIndex, this.state.stops.length - 1));
    this.state.totalBins = this.state.stops.length;
    const current = this.currentStop();
    if (this.state.activeBin?.identity !== current.identity) this.state.activeBin = null;
    if (LIFTED_PHASES.has(this.state.phase) && !this.state.activeBin) this.setPhase("walking-to-bin", 0, "Resuming the current bin safely");
    if (["driving", "returning-depot"].includes(this.state.phase)
      && (!this.state.drivePath.length || this.state.drivePathIndex >= this.state.drivePath.length)) {
      if (this.state.phase === "returning-depot") this.prepareDriveTo(MUNICIPAL_DEPOT.x, MUNICIPAL_DEPOT.y, "returning-depot");
      else this.prepareCurrentStopDrive();
    }
    return this.state;
  }

  currentStop() { return this.state.stops[this.state.stopIndex] || null; }

  truckRearPoint(side = 0) {
    const truck = this.state.truck;
    const headingX = Number(truck.headingX) || 1;
    const headingY = Number(truck.headingY) || 0;
    const perpendicularX = -headingY;
    const perpendicularY = headingX;
    return { x: truck.x - headingX * 43 + perpendicularX * side, y: truck.y - headingY * 43 + perpendicularY * side };
  }

  setPhase(phase, timer = 0, event = null) {
    if (!MUNICIPAL_COLLECTION_PHASES.includes(phase)) throw new TypeError(`Unknown municipal collection phase: ${phase}`);
    this.state.phase = phase;
    this.state.phaseTimer = Math.max(0, Number(timer) || 0);
    if (event) this.state.lastEvent = event;
    this.checkpointNeeded = true;
  }

  prepareDriveTo(x, y, phase = "driving") {
    const network = buildMunicipalVehicleNetwork();
    const start = closestMunicipalRoadNode(network, this.state.truck.x, this.state.truck.y);
    const end = closestMunicipalRoadNode(network, x, y);
    const route = municipalShortestPath(network, start?.node.id, end?.node.id);
    const path = [
      { x: this.state.truck.x, y: this.state.truck.y },
      ...route.ids.map((id) => ({ x: network.nodes.get(id).x, y: network.nodes.get(id).y })),
    ].filter((point, index, values) => !index || Math.hypot(point.x - values[index - 1].x, point.y - values[index - 1].y) > 0.5);
    this.state.drivePath = path;
    this.state.drivePathIndex = Math.min(1, Math.max(0, path.length - 1));
    this.setPhase(phase, 0, phase === "returning-depot" ? "Returning to the depot" : "Driving to the next bin");
    return route.ids.length > 0;
  }

  prepareCurrentStopDrive() {
    const stop = this.currentStop();
    return stop ? this.prepareDriveTo(stop.roadX, stop.roadY, "driving") : false;
  }

  queueBinChange(targetIdentity, change, spillIds = []) {
    const previous = this.pendingBinChanges.get(targetIdentity) || { change: {}, spillIds: [] };
    this.pendingBinChanges.set(targetIdentity, {
      change: { ...previous.change, ...change },
      spillIds: [...new Set([...previous.spillIds, ...spillIds])],
    });
  }

  applyPendingChanges(state) {
    for (const [targetIdentity, pending] of this.pendingBinChanges) {
      const record = binRecord(state, targetIdentity);
      if (!record) continue;
      Object.assign(record.state, pending.change);
      if (pending.spillIds.length) removeLandItemsInto(state, pending.spillIds);
    }
    if (this.pendingBinChanges.size) updateEnvironmentMetricsInto(state);
  }

  syncState({ persist = false } = {}) {
    const checkpoint = this.gameState.getSnapshot();
    const next = structuredClone(checkpoint);
    this.applyPendingChanges(next);
    next.municipalCollection = normalizeMunicipalCollectionState(this.state, next.world);
    next.updatedAt = new Date(this.now()).toISOString();
    const validation = validateMunicipalCollectionState(next.municipalCollection);
    if (!validation.ok) return { ok: false, status: "validation-failed", errors: validation.errors };
    const replaced = this.gameState.replace(next);
    if (!replaced.ok) return { ...replaced, status: "state-rejected" };
    const saveResult = persist ? this.repository?.save?.(next, { now: this.now() }) : { ok: true, status: "deferred" };
    if (!saveResult?.ok) {
      const rollback = this.gameState.replace(checkpoint);
      const result = { ok: false, status: "persistence-failed", saveResult, rollbackOk: rollback.ok };
      this.lastResult = result;
      return result;
    }
    this.pendingBinChanges.clear();
    this.state = structuredClone(next.municipalCollection);
    this.checkpointNeeded = false;
    this.checkpointElapsedMilliseconds = 0;
    const result = { ok: true, status: persist ? "persisted" : "synced", saveResult };
    this.lastResult = result;
    return result;
  }

  start({ force = false, persist = true } = {}) {
    if (this.state.active) return { ok: false, status: "already-active", reason: "The weekly collection is already in progress." };
    const snapshot = this.gameState.getSnapshot();
    const world = snapshot.world;
    if (!force && (world.day < this.state.nextServiceDay || world.clockMinutes < MUNICIPAL_COLLECTION_CONFIG.startMinute)) {
      return { ok: false, status: "not-due", reason: `Next collection is Day ${this.state.nextServiceDay} at 07:00.` };
    }
    const previous = structuredClone(this.state);
    const plan = planMunicipalCollectionStops(binRecords(snapshot));
    const fresh = createFreshMunicipalCollectionState(world);
    this.state = {
      ...fresh,
      active: true,
      phase: "driving",
      nextServiceDay: Math.max(previous.nextServiceDay, MUNICIPAL_COLLECTION_CONFIG.firstCollectionDay),
      lastCompletedDay: previous.lastCompletedDay,
      collectionsCompleted: previous.collectionsCompleted,
      startedDay: world.day,
      startedMinute: world.clockMinutes,
      stops: plan.stops,
      totalBins: plan.stops.length,
      lastEvent: "Weekly rubbish collection began",
    };
    this.prepareCurrentStopDrive();
    const synced = this.syncState({ persist });
    if (!synced.ok) {
      this.state = previous;
      this.pendingBinChanges.clear();
      return synced;
    }
    const result = { ok: true, status: "started", stops: plan.stops.length, state: this.getSnapshot() };
    this.lastResult = result;
    return result;
  }

  advanceTruck(seconds) {
    let remaining = seconds;
    let guard = 0;
    while (remaining > 0 && guard++ < 80) {
      const target = this.state.drivePath[this.state.drivePathIndex];
      if (!target) return { arrived: true, remaining };
      const dx = target.x - this.state.truck.x;
      const dy = target.y - this.state.truck.y;
      const distance = Math.hypot(dx, dy);
      if (distance > 0.01) { this.state.truck.headingX = dx / distance; this.state.truck.headingY = dy / distance; }
      const moved = moveEntity(this.state.truck, target, MUNICIPAL_COLLECTION_CONFIG.truckSpeed, remaining);
      remaining = moved.remaining;
      if (!moved.arrived) return { arrived: false, remaining: 0 };
      this.state.drivePathIndex += 1;
      if (this.state.drivePathIndex >= this.state.drivePath.length) return { arrived: true, remaining };
    }
    return { arrived: false, remaining };
  }

  consumePhaseTimer(seconds) {
    const used = Math.min(seconds, this.state.phaseTimer);
    this.state.phaseTimer = Math.max(0, this.state.phaseTimer - used);
    return { done: this.state.phaseTimer <= 0.0001, remaining: seconds - used };
  }

  rightCurrentBin(record) {
    if (!record?.state?.tipped) return false;
    this.queueBinChange(record.identity, { tipped: false, tippedAt: 0, tippedByNpcId: null, spillIds: [] }, record.state.spillIds || []);
    return true;
  }

  emptyActiveBin(record, world) {
    const bin = this.state.activeBin;
    if (!bin || bin.emptied || !record) return false;
    const fill = record.type === "public" ? Math.max(0, Number(record.state.fill) || 0) : Math.max(0, Number(record.state.binFill) || 0);
    const collections = Math.max(0, Number(record.state.collections) || 0) + 1;
    const change = record.type === "public"
      ? { fill: 0, fullSince: null, lastEmptiedDay: world.day, collections }
      : { binFill: 0, binFullSince: 0, lastEmptiedDay: world.day, collections };
    this.queueBinChange(record.identity, change);
    bin.emptied = true;
    this.state.load += fill;
    this.state.binsEmptied += 1;
    this.checkpointNeeded = true;
    return true;
  }

  finishCurrentStop() {
    const stop = this.currentStop();
    if (stop) {
      stop.completed = true;
      if (!this.state.completedIdentities.includes(stop.identity)) this.state.completedIdentities.push(stop.identity);
    }
    this.state.activeBin = null;
    this.state.collector.visible = false;
    this.state.collector.onTruck = true;
    this.state.stopIndex += 1;
    if (this.state.stopIndex < this.state.stops.length) this.prepareCurrentStopDrive();
    else this.prepareDriveTo(MUNICIPAL_DEPOT.x, MUNICIPAL_DEPOT.y, "returning-depot");
  }

  complete(world) {
    this.state.active = false;
    this.state.phase = "complete";
    this.state.phaseTimer = 0;
    this.state.lastCompletedDay = world.day;
    this.state.collectionsCompleted += 1;
    this.state.completedAtGameMinute = absoluteGameMinute(world);
    this.state.collector.visible = false;
    this.state.collector.onTruck = true;
    this.state.activeBin = null;
    do this.state.nextServiceDay += MUNICIPAL_COLLECTION_CONFIG.intervalDays;
    while (this.state.nextServiceDay <= world.day);
    this.state.lastEvent = `Collection complete: ${this.state.binsEmptied} bins emptied`;
    this.checkpointNeeded = true;
    return { ok: true, binsEmptied: this.state.binsEmptied, load: this.state.load, nextServiceDay: this.state.nextServiceDay };
  }

  update(deltaMilliseconds, world = this.gameState.getSnapshot().world) {
    if (!world) return { ok: false, status: "world-missing" };
    if (this.pauseReasons.size) return { ok: true, status: "paused", reasons: [...this.pauseReasons] };
    if (!this.state.active) {
      if (world.day >= this.state.nextServiceDay && world.clockMinutes >= MUNICIPAL_COLLECTION_CONFIG.startMinute) return this.start({ persist: true });
      return { ok: true, status: "waiting", nextServiceDay: this.state.nextServiceDay };
    }
    const boundedMilliseconds = Math.max(0, Math.min(10000, Number(deltaMilliseconds) || 0));
    this.checkpointElapsedMilliseconds += boundedMilliseconds;
    let remaining = boundedMilliseconds / 1000;
    let guard = 0;
    while (remaining > 0 && this.state.active && guard++ < 160) {
      const phase = this.state.phase;
      const stop = this.currentStop();
      const record = stop ? binRecord(this.gameState.getSnapshot(), stop.identity) : null;
      if (stop && !record) {
        this.state.stopIndex += 1;
        if (this.state.stopIndex < this.state.stops.length) this.prepareCurrentStopDrive();
        else this.prepareDriveTo(MUNICIPAL_DEPOT.x, MUNICIPAL_DEPOT.y, "returning-depot");
        continue;
      }
      if (phase === "driving" || phase === "returning-depot") {
        const moved = this.advanceTruck(remaining);
        remaining = moved.remaining;
        if (!moved.arrived) break;
        if (phase === "returning-depot") { this.complete(world); continue; }
        const rear = this.truckRearPoint(19);
        Object.assign(this.state.collector, { x: rear.x, y: rear.y, visible: true, onTruck: false });
        this.setPhase("dismounting", MUNICIPAL_COLLECTION_CONFIG.phaseSeconds.dismounting, `Gavin is getting out at ${record?.label || "the bin"}`);
        continue;
      }
      if (phase === "dismounting") {
        const result = this.consumePhaseTimer(remaining); remaining = result.remaining;
        if (!result.done) break;
        this.setPhase("walking-to-bin", 0, `Walking to ${record.label}`); continue;
      }
      if (phase === "walking-to-bin") {
        this.state.collector.walkPhase += remaining * 8;
        const moved = moveEntity(this.state.collector, { x: stop.originalX, y: stop.originalY }, MUNICIPAL_COLLECTION_CONFIG.collectorSpeed, remaining);
        remaining = moved.remaining;
        if (!moved.arrived) break;
        this.rightCurrentBin(record);
        this.state.activeBin = { identity: stop.identity, type: stop.type, id: stop.id, itemId: stop.itemId,
          originalX: stop.originalX, originalY: stop.originalY, originalRotation: stop.originalRotation,
          x: stop.originalX, y: stop.originalY, rotation: stop.originalRotation,
          emittedFill: record.type === "public" ? record.state.fill : record.state.binFill, emptied: false };
        this.setPhase("lifting", MUNICIPAL_COLLECTION_CONFIG.phaseSeconds.lifting, `Lifting ${record.label}`); continue;
      }
      if (phase === "lifting") {
        const result = this.consumePhaseTimer(remaining);
        const progress = 1 - this.state.phaseTimer / MUNICIPAL_COLLECTION_CONFIG.phaseSeconds.lifting;
        remaining = result.remaining;
        if (this.state.activeBin) this.state.activeBin.y = stop.originalY - Math.max(0, progress) * 12;
        if (!result.done) break;
        this.setPhase("walking-bin-to-truck", 0, `Rolling ${record.label} to the lorry`); continue;
      }
      if (phase === "walking-bin-to-truck") {
        const rear = this.truckRearPoint(0);
        this.state.collector.walkPhase += remaining * 8;
        const moved = moveEntity(this.state.collector, rear, MUNICIPAL_COLLECTION_CONFIG.collectorSpeed * 0.82, remaining);
        remaining = moved.remaining;
        if (this.state.activeBin) Object.assign(this.state.activeBin, { x: this.state.collector.x, y: this.state.collector.y - 10, rotation: stop.originalRotation });
        if (!moved.arrived) break;
        this.setPhase("emptying", MUNICIPAL_COLLECTION_CONFIG.phaseSeconds.emptying, `Emptying ${record.label} into the lorry`); continue;
      }
      if (phase === "emptying") {
        const result = this.consumePhaseTimer(remaining);
        const progress = 1 - this.state.phaseTimer / MUNICIPAL_COLLECTION_CONFIG.phaseSeconds.emptying;
        remaining = result.remaining;
        if (this.state.activeBin) {
          const rear = this.truckRearPoint(0);
          Object.assign(this.state.activeBin, { x: rear.x, y: rear.y - 12, rotation: stop.originalRotation - Math.min(1, progress * 1.6) * 1.8 });
          if (progress >= 0.48) this.emptyActiveBin(record, world);
        }
        if (!result.done) break;
        this.setPhase("returning-bin", 0, `Returning ${record.label} to its exact place`); continue;
      }
      if (phase === "returning-bin") {
        this.state.collector.walkPhase += remaining * 8;
        const moved = moveEntity(this.state.collector, { x: stop.originalX, y: stop.originalY }, MUNICIPAL_COLLECTION_CONFIG.collectorSpeed * 0.82, remaining);
        remaining = moved.remaining;
        if (this.state.activeBin) Object.assign(this.state.activeBin, { x: this.state.collector.x, y: this.state.collector.y - 10, rotation: stop.originalRotation });
        if (!moved.arrived) break;
        if (this.state.activeBin) Object.assign(this.state.activeBin, { x: stop.originalX, y: stop.originalY, rotation: stop.originalRotation });
        this.setPhase("placing", MUNICIPAL_COLLECTION_CONFIG.phaseSeconds.placing, `Placing ${record.label} back exactly`); continue;
      }
      if (phase === "placing") {
        const result = this.consumePhaseTimer(remaining); remaining = result.remaining;
        if (!result.done) break;
        if (this.state.activeBin) Object.assign(this.state.activeBin, { x: stop.originalX, y: stop.originalY, rotation: stop.originalRotation });
        this.state.activeBin = null;
        this.setPhase("walking-to-truck", 0, "Walking back to the lorry"); continue;
      }
      if (phase === "walking-to-truck") {
        const rear = this.truckRearPoint(19);
        this.state.collector.walkPhase += remaining * 8;
        const moved = moveEntity(this.state.collector, rear, MUNICIPAL_COLLECTION_CONFIG.collectorSpeed, remaining);
        remaining = moved.remaining;
        if (!moved.arrived) break;
        this.setPhase("boarding", MUNICIPAL_COLLECTION_CONFIG.phaseSeconds.boarding, "Gavin is getting back into the lorry"); continue;
      }
      if (phase === "boarding") {
        const result = this.consumePhaseTimer(remaining); remaining = result.remaining;
        if (!result.done) break;
        this.finishCurrentStop(); continue;
      }
      break;
    }
    if (this.checkpointNeeded || this.pendingBinChanges.size > 0 || this.checkpointElapsedMilliseconds >= 5000) {
      const synced = this.syncState({ persist: true });
      if (!synced.ok) return synced;
    }
    return { ok: true, status: this.state.active ? "active" : "complete", phase: this.state.phase };
  }

  runToCompletion({ secondsPerStep = 0.25, maxSteps = 30000, force = true } = {}) {
    if (!this.state.active) {
      const started = this.start({ force, persist: true });
      if (!started.ok) return started;
    }
    let steps = 0;
    while (this.state.active && steps++ < Math.max(1, Math.floor(maxSteps))) this.update(Math.max(20, Math.min(10000, secondsPerStep * 1000)));
    return { ok: !this.state.active, steps, state: this.getSnapshot() };
  }

  isBinUnavailable(targetIdentity) {
    const current = this.currentStop();
    return Boolean(this.state.active && current?.identity === targetIdentity && this.state.phase !== "driving");
  }

  isBinHidden(targetIdentity) { return Boolean(this.state.activeBin?.identity === targetIdentity); }

  isPlacedObjectLocked(objectId) {
    return Boolean(this.state.active && this.state.stops.some((stop) => stop.type === "placed" && stop.id === objectId));
  }

  collisionAt(x, y, radius = 17) {
    return { blocked: Boolean(this.state.active && Math.hypot(this.state.truck.x - x, this.state.truck.y - y) < 58 + radius) };
  }

  getSnapshot() { return structuredClone(this.state); }

  getPresentation() {
    return {
      active: this.state.active,
      phase: this.state.phase,
      lastEvent: this.state.lastEvent,
      stopIndex: this.state.stopIndex,
      totalBins: this.state.totalBins,
      binsEmptied: this.state.binsEmptied,
      truck: structuredClone(this.state.truck),
      collector: structuredClone(this.state.collector),
      activeBin: structuredClone(this.state.activeBin),
      hiddenIdentity: this.state.activeBin?.identity || null,
      highlightedIdentity: this.state.active && ["dismounting", "walking-to-bin", "lifting"].includes(this.state.phase) ? this.currentStop()?.identity || null : null,
    };
  }

  setPaused(reason, paused) {
    if (!reason) return { ok: false, status: "missing-reason" };
    if (paused) this.pauseReasons.add(reason); else this.pauseReasons.delete(reason);
    return { ok: true, status: this.pauseReasons.size ? "paused" : "running", reasons: [...this.pauseReasons] };
  }

  getDiagnostics() {
    const snapshot = this.gameState.getSnapshot();
    const records = binRecords(snapshot);
    const plan = planMunicipalCollectionStops(records);
    const routeValid = plan.stops.every((stop) => municipalShortestPath(plan.network, plan.network.depotId, stop.roadNodeId).ids.length > 0);
    return {
      version: "2.0.0-milestone-29",
      enabled: true,
      schemaVersion: MUNICIPAL_COLLECTION_CONFIG.schemaVersion,
      intervalDays: MUNICIPAL_COLLECTION_CONFIG.intervalDays,
      startTime: "07:00",
      nextServiceDay: this.state.nextServiceDay,
      active: this.state.active,
      phase: this.state.phase,
      collector: structuredClone(MUNICIPAL_COLLECTOR),
      publicBins: NPC_PUBLIC_BINS.length,
      placedBins: records.filter((record) => record.type === "placed").length,
      plannedStops: plan.stops.length,
      allowedRoadIds: [...MUNICIPAL_COLLECTION_CONFIG.allowedRoadIds],
      allowedBridgeIds: [...MUNICIPAL_COLLECTION_CONFIG.allowedBridgeIds],
      streetOnlyVehicleGraph: plan.network.segments.every((segment) => [...MUNICIPAL_COLLECTION_CONFIG.allowedRoadIds, ...MUNICIPAL_COLLECTION_CONFIG.allowedBridgeIds].includes(segment.sourceId)),
      vehicleCurrentlyOnRoad: municipalVehicleAllowedAt(this.state.truck.x, this.state.truck.y),
      everyBinReachable: routeValid,
      collectorMayLeaveRoad: true,
      exactBinTransformPreserved: true,
      individualLiftEmptyReturnAnimation: true,
      persistentMidRouteState: true,
      paused: this.pauseReasons.size > 0,
      lastResult: { ...this.lastResult },
    };
  }
}
