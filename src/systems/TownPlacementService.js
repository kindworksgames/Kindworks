import { ITEM_CATALOG, placeableFootprintFor } from "../data/items.js";
import {
  PLACEABLE_ITEM_IDS,
  RELEASED_PLACEABLE_ITEM_IDS,
  TOWN_PLACEMENT_LIMIT,
  TOWN_PLACEMENT_ROTATION_STEP,
  normalizeTownRotation,
  placementBehaviorHooks,
  townPlacementCatalogueSummary,
  validateTownPlacement,
} from "../data/townPlacement.js";
import { COIN_LEDGER_LIMIT } from "../state/economyState.js";
import { validateTownPlacementState } from "../state/townPlacementState.js";
import { InventoryService } from "./InventoryService.js";

function appendPlacementLedger(state, now, { kind, reason, itemId, objectId, x = null, y = null, rotation = null }) {
  const id = `coin-${String(state.economy.nextTransactionId).padStart(6, "0")}`;
  state.economy.nextTransactionId += 1;
  const entry = {
    id,
    amount: 0,
    kind,
    reason,
    itemId,
    quantity: 1,
    shopId: null,
    balance: state.economy.coins,
    occurredAt: new Date(now).toISOString(),
    placedObjectId: objectId,
    x,
    y,
    rotation,
  };
  state.economy.ledger.push(entry);
  state.economy.ledger = state.economy.ledger.slice(-COIN_LEDGER_LIMIT);
  return entry;
}

function absoluteGameMinute(world) {
  return (Math.max(1, Math.floor(Number(world?.day) || 1)) - 1) * 1440 + Math.max(0, Math.min(1439, Math.floor(Number(world?.clockMinutes) || 0)));
}

function collectionLocksObject(state, objectId) {
  return Boolean(state?.municipalCollection?.active
    && state.municipalCollection.stops?.some((stop) => stop.type === "placed" && stop.id === objectId));
}

export class TownPlacementService {
  constructor(gameState, repository, { now = () => Date.now(), catalog = ITEM_CATALOG } = {}) {
    this.gameState = gameState;
    this.repository = repository;
    this.now = now;
    this.catalog = catalog;
    this.inventory = new InventoryService(catalog);
    this.active = null;
    this.listeners = new Set();
    this.lastResult = { ok: true, code: "ready" };
  }

  subscribe(listener) {
    if (typeof listener !== "function") throw new TypeError("A town-placement listener must be a function.");
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(result = this.lastResult) {
    const snapshot = this.getSnapshot();
    for (const listener of this.listeners) listener(snapshot, result);
  }

  getSnapshot() {
    const state = this.gameState.getSnapshot();
    return {
      ...structuredClone(state.townPlacement),
      active: this.active ? structuredClone(this.active) : null,
      inventory: structuredClone(state.inventory.placeables),
      limit: TOWN_PLACEMENT_LIMIT,
    };
  }

  getObjects() {
    return this.getSnapshot().objects.map((object) => ({ ...object, item: structuredClone(this.catalog[object.itemId]) }));
  }

  getObject(id) {
    return this.getObjects().find((object) => object.id === id) || null;
  }

  validate(itemId, x, y, { ignoreObjectId = null, objects = null } = {}) {
    const source = objects || this.gameState.getSnapshot().townPlacement.objects;
    return validateTownPlacement(itemId, x, y, { objects: source, ignoreObjectId });
  }

  begin(itemId, { existingObjectId = null, previewX = null, previewY = null } = {}) {
    const item = this.catalog[itemId];
    if (!item || item.category !== "placeable") return { ok: false, code: "not-placeable", message: "That item cannot be placed in town." };
    const state = this.gameState.getSnapshot();
    const existing = existingObjectId ? state.townPlacement.objects.find((object) => object.id === existingObjectId) : null;
    if (existingObjectId && (!existing || existing.itemId !== itemId)) return { ok: false, code: "object-missing", message: "That placed object could not be found." };
    if (existing && collectionLocksObject(state, existing.id)) return { ok: false, code: "collection-locked", message: "Gavin has this bin on today's collection route. It can be moved after the lorry returns to the depot." };
    if (!existing && state.townPlacement.objects.length >= TOWN_PLACEMENT_LIMIT) return { ok: false, code: "placement-limit", message: `Willowmere's safe limit of ${TOWN_PLACEMENT_LIMIT} placed objects has been reached. Store one before placing another.` };
    if (!existing && this.inventory.quantity(state.inventory, itemId) < 1) return { ok: false, code: "not-owned", message: `${item.name} is not in your inventory.` };
    this.active = {
      itemId,
      existingObjectId: existing?.id || null,
      previewX: previewX !== null && previewX !== undefined && Number.isFinite(Number(previewX)) ? Number(previewX) : existing?.x ?? null,
      previewY: previewY !== null && previewY !== undefined && Number.isFinite(Number(previewY)) ? Number(previewY) : existing?.y ?? null,
      rotation: normalizeTownRotation(existing?.rotation || 0),
      startedAt: this.now(),
    };
    const result = { ok: true, code: existing ? "move-begun" : "placement-begun", item: structuredClone(item), active: structuredClone(this.active) };
    this.lastResult = result;
    this.emit(result);
    return result;
  }

  preview(x, y) {
    if (!this.active) return { ok: false, code: "no-active-placement", message: "Choose an owned town item first." };
    this.active.previewX = Number(x);
    this.active.previewY = Number(y);
    const validation = this.validate(this.active.itemId, x, y, { ignoreObjectId: this.active.existingObjectId });
    const result = { ...validation, code: validation.ok ? "preview-valid" : validation.code, active: structuredClone(this.active) };
    this.lastResult = result;
    this.emit(result);
    return result;
  }

  rotate() {
    if (!this.active) return { ok: false, code: "no-active-placement", message: "Choose an owned town item first." };
    this.active.rotation = normalizeTownRotation(this.active.rotation + TOWN_PLACEMENT_ROTATION_STEP);
    const validation = Number.isFinite(this.active.previewX) && Number.isFinite(this.active.previewY)
      ? this.validate(this.active.itemId, this.active.previewX, this.active.previewY, { ignoreObjectId: this.active.existingObjectId })
      : { ok: false, code: "preview-required", message: "Choose a town position first." };
    const result = { ...validation, code: "placement-rotated", rotation: this.active.rotation, active: structuredClone(this.active) };
    this.lastResult = result;
    this.emit(result);
    return result;
  }

  cancel() {
    if (!this.active) return { ok: false, code: "no-active-placement", message: "No town placement is active." };
    const cancelled = structuredClone(this.active);
    this.active = null;
    const result = { ok: true, code: "placement-cancelled", cancelled };
    this.lastResult = result;
    this.emit(result);
    return result;
  }

  commit(mutator) {
    const checkpoint = this.gameState.getSnapshot();
    const working = structuredClone(checkpoint);
    const mutation = mutator(working);
    if (!mutation.ok) return mutation;
    const placementValidation = validateTownPlacementState(working.townPlacement);
    if (!placementValidation.ok) return { ok: false, code: "placement-state-invalid", message: placementValidation.errors[0], errors: placementValidation.errors };
    working.updatedAt = new Date(this.now()).toISOString();
    const replaced = this.gameState.replace(working);
    if (!replaced.ok) return { ok: false, code: "state-validation", errors: replaced.errors };
    const saved = this.repository.save(working, { now: this.now() });
    if (!saved.ok) {
      const rollback = this.gameState.replace(checkpoint);
      return { ok: false, code: "persistence-failed", message: "The placement change could not be saved, so the previous town and inventory were restored.", save: saved, rollbackOk: rollback.ok };
    }
    return { ...mutation, state: this.gameState.getSnapshot(), save: saved };
  }

  confirm() {
    if (!this.active) return { ok: false, code: "no-active-placement", message: "No town placement is active." };
    const draft = structuredClone(this.active);
    if (!Number.isFinite(draft.previewX) || !Number.isFinite(draft.previewY)) return { ok: false, code: "preview-required", message: "Tap a clear place in town first." };
    const result = this.commit((state) => {
      const validation = validateTownPlacement(draft.itemId, draft.previewX, draft.previewY, { objects: state.townPlacement.objects, ignoreObjectId: draft.existingObjectId });
      if (!validation.ok) return validation;
      const item = this.catalog[draft.itemId];
      if (draft.existingObjectId) {
        const object = state.townPlacement.objects.find((entry) => entry.id === draft.existingObjectId);
        if (!object) return { ok: false, code: "object-missing", message: "That placed object could not be found." };
        const previous = { x: object.x, y: object.y, rotation: object.rotation };
        object.x = validation.x;
        object.y = validation.y;
        object.rotation = normalizeTownRotation(draft.rotation);
        object.hooks = placementBehaviorHooks(item, object);
        const ledger = appendPlacementLedger(state, this.now(), { kind: "placement-move", reason: `Moved ${item.name}`, itemId: item.id, objectId: object.id, x: object.x, y: object.y, rotation: object.rotation });
        return { ok: true, code: "object-moved", object: structuredClone(object), previous, ledger };
      }
      if (state.townPlacement.objects.length >= TOWN_PLACEMENT_LIMIT) return { ok: false, code: "placement-limit", message: `Willowmere's safe limit of ${TOWN_PLACEMENT_LIMIT} placed objects has been reached.` };
      const removed = this.inventory.remove(state.inventory, draft.itemId, 1);
      if (!removed.ok) return { ...removed, message: `${item.name} is no longer in your inventory.` };
      const object = {
        id: `placed-${state.townPlacement.nextSerial}`,
        itemId: item.id,
        type: item.placeableType,
        x: validation.x,
        y: validation.y,
        rotation: normalizeTownRotation(draft.rotation),
        placedAt: this.now(),
        placedGameMinute: absoluteGameMinute(state.world),
        binCapacity: item.effect?.npcBin ? Math.max(1, Number(item.effect.binCapacity) || 8) : 0,
        binFill: 0,
        binFullSince: 0,
        lastEmptiedDay: 0,
        collections: 0,
        tipped: false,
        tippedAt: 0,
        tippedByNpcId: null,
        spillIds: [],
        hooks: null,
      };
      object.hooks = placementBehaviorHooks(item, object);
      state.townPlacement.nextSerial += 1;
      state.townPlacement.objects.push(object);
      const ledger = appendPlacementLedger(state, this.now(), { kind: "placement", reason: `Placed ${item.name}`, itemId: item.id, objectId: object.id, x: object.x, y: object.y, rotation: object.rotation });
      return { ok: true, code: "object-placed", object: structuredClone(object), inventory: removed, ledger };
    });
    if (result.ok) this.active = null;
    this.lastResult = result;
    this.emit(result);
    return result;
  }

  move(objectId) {
    const object = this.getObject(objectId);
    if (!object) return { ok: false, code: "object-missing", message: "That placed object could not be found." };
    return this.begin(object.itemId, { existingObjectId: object.id });
  }

  store(objectId) {
    const result = this.commit((state) => {
      const index = state.townPlacement.objects.findIndex((object) => object.id === objectId);
      if (index < 0) return { ok: false, code: "object-missing", message: "That placed object could not be found." };
      const object = state.townPlacement.objects[index];
      if (collectionLocksObject(state, object.id)) return { ok: false, code: "collection-locked", message: "Gavin has this bin on today's collection route. It can be stored after the lorry returns to the depot." };
      const item = this.catalog[object.itemId];
      const returned = this.inventory.add(state.inventory, object.itemId, 1);
      if (!returned.ok) return { ...returned, message: `${item.name} cannot be returned because its inventory stack is full.` };
      state.townPlacement.objects.splice(index, 1);
      const ledger = appendPlacementLedger(state, this.now(), { kind: "placement-store", reason: `Stored ${item.name}`, itemId: item.id, objectId: object.id });
      return { ok: true, code: "object-stored", object: structuredClone(object), inventory: returned, ledger };
    });
    this.lastResult = result;
    this.emit(result);
    return result;
  }

  collisionAt(x, y, radius = 17, { ignoreObjectId = null } = {}) {
    for (const object of this.gameState.getSnapshot().townPlacement.objects) {
      if (object.id === ignoreObjectId) continue;
      const item = this.catalog[object.itemId];
      const collisionRadius = placementBehaviorHooks(item, object)?.playerCollision.radius || placeableFootprintFor(item) * 0.72;
      if (Math.hypot(object.x - x, object.y - y) < collisionRadius + radius) return { blocked: true, objectId: object.id, itemId: object.itemId };
    }
    return { blocked: false };
  }

  getBehaviorHooks() {
    return this.gameState.getSnapshot().townPlacement.objects.map((object) => structuredClone(object.hooks));
  }

  getDiagnostics() {
    const state = this.gameState.getSnapshot();
    const validation = validateTownPlacementState(state.townPlacement);
    const hooks = this.getBehaviorHooks();
    return {
      ...townPlacementCatalogueSummary(),
      valid: validation.ok,
      errors: validation.errors,
      placed: state.townPlacement.objects.length,
      remainingCapacity: TOWN_PLACEMENT_LIMIT - state.townPlacement.objects.length,
      inventoryTypes: Object.keys(state.inventory.placeables).length,
      active: Boolean(this.active),
      behaviorHooks: {
        npcDestinations: hooks.filter((hook) => hook.npcDestination).length,
        publicBins: hooks.filter((hook) => hook.npcBin).length,
        wildlifeObstacles: hooks.length,
        rubbishExclusions: hooks.length,
      },
      exactTransforms: state.townPlacement.objects.every((object) => Number.isFinite(object.x) && Number.isFinite(object.y) && Number.isFinite(object.rotation)),
      catalogueIds: [...PLACEABLE_ITEM_IDS],
      releasedCatalogueIds: [...RELEASED_PLACEABLE_ITEM_IDS],
      lastResult: { ...this.lastResult, state: undefined },
    };
  }
}
