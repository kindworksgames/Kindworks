import {
  HOME_FURNITURE_LIMIT,
  HOME_OBJECT_DESCRIPTIONS,
  buildHouseInteriorLayout,
  findSafeFurniturePlacement,
  houseForId,
  houseHomeNodeId,
  residentDefinitionsForHouse,
  validateFurniturePlacement,
} from "../data/homeInteriors.js";
import { ANIMAL_BY_ID } from "../data/animals.js";
import { PERSONAL_HOME_HOUSE_ID } from "../data/customResident.js";
import { ITEM_CATALOG } from "../data/items.js";
import { COIN_LEDGER_LIMIT } from "../state/economyState.js";
import { normalizeHomeInteriorState } from "../state/homeInteriorState.js";
import { aquariumFishCount, aquariumSnapshot, safelyReleaseAquariumFishInto } from "../state/aquariumState.js";

function appendFurnitureLedger(state, now, kind, placement) {
  const serial = state.economy.nextTransactionId;
  const entry = {
    id: `coin-${String(serial).padStart(6, "0")}`,
    amount: 0,
    kind,
    reason: kind === "home-furniture-place" ? `Placed ${ITEM_CATALOG[placement.itemId].name}` : kind === "home-furniture-move" ? `Moved ${ITEM_CATALOG[placement.itemId].name}` : `Stored ${ITEM_CATALOG[placement.itemId].name}`,
    itemId: placement.itemId,
    quantity: 1,
    placementId: placement.id,
    shopId: "personal-home",
    balance: state.economy.coins,
    occurredAt: new Date(now).toISOString(),
  };
  state.economy.nextTransactionId += 1;
  state.economy.ledger.push(entry);
  state.economy.ledger = state.economy.ledger.slice(-COIN_LEDGER_LIMIT);
  return entry;
}

export function reconcileHomeFurnitureInto(state) {
  state.homeInteriors = normalizeHomeInteriorState(state.homeInteriors);
  const moved = [];
  const stored = [];
  for (const placement of [...state.homeInteriors.placements]) {
    const current = validateFurniturePlacement(state, placement.itemId, placement.rx, placement.ry, { rotation: placement.rotation, ignorePlacementId: placement.id });
    if (current.ok) continue;
    const safe = findSafeFurniturePlacement(state, placement);
    if (safe) {
      const from = { rx: placement.rx, ry: placement.ry, rotation: placement.rotation };
      Object.assign(placement, { rx: safe.rx, ry: safe.ry, rotation: safe.rotation });
      moved.push({ id: placement.id, itemId: placement.itemId, from, to: { rx: safe.rx, ry: safe.ry, rotation: safe.rotation }, reason: current.reason });
      continue;
    }
    state.homeInteriors.placements = state.homeInteriors.placements.filter((entry) => entry.id !== placement.id);
    state.inventory.furniture[placement.itemId] = (state.inventory.furniture[placement.itemId] || 0) + 1;
    const aquariumRelease = ITEM_CATALOG[placement.itemId]?.aquarium && aquariumFishCount(state) > 0
      ? safelyReleaseAquariumFishInto(state, { reason: "A home redesign could not safely retain the placed fish tank" })
      : null;
    stored.push({ id: placement.id, itemId: placement.itemId, reason: current.reason, aquariumRelease });
  }
  return { ok: true, moved, stored };
}

export class HomeInteriorService {
  constructor(gameState, repository, { now = () => Date.now(), customResident = null, aquarium = null } = {}) {
    this.gameState = gameState;
    this.repository = repository;
    this.now = now;
    this.customResident = customResident;
    this.aquarium = aquarium;
    this.activePlacement = null;
    this.listeners = new Set();
    this.lastResult = { ok: true, code: "ready" };
  }

  subscribe(listener) {
    if (typeof listener !== "function") throw new TypeError("A home-interior listener must be a function.");
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(result = this.lastResult) {
    const snapshot = this.getSnapshot();
    for (const listener of this.listeners) listener(snapshot, result);
  }

  commit(mutator, failureMessage) {
    const checkpoint = this.gameState.getSnapshot();
    const working = structuredClone(checkpoint);
    working.homeInteriors = normalizeHomeInteriorState(working.homeInteriors);
    const mutation = mutator(working);
    if (!mutation.ok) return mutation;
    working.updatedAt = new Date(this.now()).toISOString();
    const replaced = this.gameState.replace(working);
    if (!replaced.ok) return { ok: false, code: "state-validation", message: "The home change was not valid.", errors: replaced.errors };
    const save = this.repository.save(working, { now: this.now() });
    if (!save.ok) {
      this.gameState.replace(checkpoint);
      return { ok: false, code: "persistence-failed", message: failureMessage, save };
    }
    return { ...mutation, save };
  }

  getSnapshot() {
    const state = this.gameState.getSnapshot();
    const home = normalizeHomeInteriorState(state.homeInteriors);
    return {
      ...structuredClone(home),
      limit: HOME_FURNITURE_LIMIT,
      inventory: structuredClone(state.inventory.furniture),
      placements: home.placements.map((placement) => ({ ...placement, item: structuredClone(ITEM_CATALOG[placement.itemId]) })),
      aquarium: aquariumSnapshot(state),
      activePlacement: this.activePlacement ? structuredClone(this.activePlacement) : null,
    };
  }

  occupantsFor(state, houseId) {
    const nodeId = houseHomeNodeId(houseId);
    const definitions = residentDefinitionsForHouse(houseId);
    const occupants = definitions.map((definition) => {
      const resident = state.npcs?.residents?.find((entry) => entry.id === definition.id);
      if (!resident || resident.currentNodeId !== nodeId || resident.visible !== false) return null;
      return { id: definition.id, name: definition.name, role: definition.role, activity: resident.activity, actionState: resident.actionState, phase: resident.phase, kind: "resident" };
    }).filter(Boolean);
    const animals = [];
    if (houseId === PERSONAL_HOME_HOUSE_ID) {
      const controlling = Boolean(this.customResident?.getSnapshot?.().controlling);
      if (state.customResident?.profile && !controlling) occupants.push({ id: state.customResident.residentId, name: state.customResident.profile.name, role: "Your resident", activity: "Spending time at home", actionState: "HOME", phase: "home", kind: "resident" });
      for (const animal of Object.values(state.animals?.residents || {}).filter((entry) => entry.adopted && entry.active && !controlling).slice(0, 1)) {
        const definition = ANIMAL_BY_ID[animal.id];
        animals.push({ id: animal.id, name: animal.name, species: definition?.species || "companion", color: definition?.color || 0x9b7d64, accent: definition?.accent || 0xe8d4b5, kind: "animal", activity: "At home with your resident", active: true });
      }
    }
    return { occupants, animals };
  }

  getInterior(houseId) {
    const state = this.gameState.getSnapshot();
    const layout = buildHouseInteriorLayout(state, houseId);
    if (!layout) return { ok: false, code: "unknown-house", message: "That Willowmere home could not be found." };
    const { occupants, animals } = this.occupantsFor(state, houseId);
    const rescue = state.houseRescue?.homes?.[houseId] || null;
    return {
      ok: true,
      houseId,
      homeNodeId: houseHomeNodeId(houseId),
      name: layout.metadata.name,
      area: layout.metadata.area,
      clean: !rescue?.dirty,
      dirty: Boolean(rescue?.dirty),
      rescueActive: state.houseRescue?.active?.houseId === houseId,
      residents: layout.residentDefinitions.map((resident) => ({ id: resident.id, name: resident.name, role: resident.role })),
      occupants,
      animalOccupants: animals,
      layout,
      visit: structuredClone(state.homeInteriors?.visits?.[houseId] || null),
      furniture: houseId === PERSONAL_HOME_HOUSE_ID ? this.getSnapshot() : null,
      aquarium: houseId === PERSONAL_HOME_HOUSE_ID ? aquariumSnapshot(state) : null,
    };
  }

  enter(houseId) {
    if (!houseForId(houseId)) return { ok: false, code: "unknown-house", message: "That Willowmere home could not be found." };
    const clean = !this.gameState.getSnapshot().houseRescue?.homes?.[houseId]?.dirty;
    const result = this.commit((state) => {
      const current = state.homeInteriors.visits[houseId] || { count: 0, inspections: 0, lastVisitedAt: 0, lastClean: clean };
      state.homeInteriors.visits[houseId] = { ...current, count: current.count + 1, lastVisitedAt: this.now(), lastClean: clean };
      return { ok: true, code: "home-entered", houseId };
    }, "The visit could not be saved, so the door stayed closed.");
    this.lastResult = result;
    if (result.ok) this.emit(result);
    return result.ok ? { ...result, interior: this.getInterior(houseId) } : result;
  }

  inspect(houseId, targetId) {
    const interior = this.getInterior(houseId);
    if (!interior.ok) return interior;
    const targets = [
      ...interior.layout.furniture,
      ...interior.occupants.map((entry) => ({ ...entry, label: entry.name, description: `${entry.activity}. ${entry.actionState === "SLEEPING" ? "They are asleep." : "They are physically at home right now."}` })),
      ...interior.animalOccupants.map((entry) => ({ ...entry, label: entry.name, description: entry.activity })),
    ];
    const target = targets.find((entry) => entry.id === targetId);
    if (!target) return { ok: false, code: "inspection-target-missing", message: "Choose something in the room to inspect." };
    const result = this.commit((state) => {
      const current = state.homeInteriors.visits[houseId] || { count: 0, inspections: 0, lastVisitedAt: 0, lastClean: interior.clean };
      state.homeInteriors.visits[houseId] = { ...current, inspections: current.inspections + 1, lastClean: interior.clean };
      return { ok: true, code: "home-object-inspected", houseId, targetId };
    }, "The inspection could not be saved.");
    if (!result.ok) return result;
    const aquarium = aquariumSnapshot(this.gameState.getSnapshot());
    const detail = target.itemId === aquarium.tankItemId
      ? aquarium.totalFish > 0
        ? `${aquarium.totalFish} ornamental fish live safely here across ${aquarium.species.length} species: ${aquarium.species.map((species) => `${species.name} × ${species.count}`).join(", ")}.`
        : "The placed ornamental fish tank is ready for Reedbank catches."
      : target.description || HOME_OBJECT_DESCRIPTIONS[target.kind] || "A familiar part of this home.";
    this.lastResult = { ...result, target: { id: target.id, label: target.label || target.name, detail, kind: target.kind, customFurniture: Boolean(target.customFurniture) } };
    this.emit(this.lastResult);
    return this.lastResult;
  }

  beginPlacement(itemId, { existingPlacementId = null } = {}) {
    const state = this.gameState.getSnapshot();
    const item = ITEM_CATALOG[itemId];
    const home = normalizeHomeInteriorState(state.homeInteriors);
    const existing = existingPlacementId ? home.placements.find((placement) => placement.id === existingPlacementId) : null;
    if (!item?.indoorSize || item.category !== "furniture") return { ok: false, code: "not-furniture", message: "That item is not home furniture." };
    if (!state.customResident?.profile) return { ok: false, code: "resident-not-created", message: "Create your personal resident and home first." };
    if (existingPlacementId && !existing) return { ok: false, code: "placement-missing", message: "That placed furniture could not be found." };
    if (!existing && !state.inventory.furniture[itemId]) return { ok: false, code: "not-owned", message: `${item.name} is not in your inventory.` };
    if (!existing && home.placements.length >= HOME_FURNITURE_LIMIT) return { ok: false, code: "limit-reached", message: `Your home has reached its ${HOME_FURNITURE_LIMIT}-item furniture limit.` };
    this.activePlacement = { itemId, existingPlacementId: existing?.id || null, rx: existing?.rx ?? null, ry: existing?.ry ?? null, rotation: existing?.rotation || 0 };
    const result = { ok: true, code: existing ? "furniture-move-started" : "furniture-placement-started", item: structuredClone(item), moving: Boolean(existing), activePlacement: structuredClone(this.activePlacement) };
    this.lastResult = result;
    this.emit(result);
    return result;
  }

  preview(rx, ry) {
    if (!this.activePlacement) return { ok: false, code: "placement-inactive", message: "Choose furniture first." };
    this.activePlacement.rx = Number(rx);
    this.activePlacement.ry = Number(ry);
    const state = this.gameState.getSnapshot();
    const result = validateFurniturePlacement(state, this.activePlacement.itemId, this.activePlacement.rx, this.activePlacement.ry, { rotation: this.activePlacement.rotation, ignorePlacementId: this.activePlacement.existingPlacementId });
    this.lastResult = result;
    this.emit(result);
    return result;
  }

  rotate() {
    if (!this.activePlacement) return { ok: false, code: "placement-inactive", message: "Choose furniture first." };
    this.activePlacement.rotation = (this.activePlacement.rotation + Math.PI / 2) % (Math.PI * 2);
    if (!Number.isFinite(this.activePlacement.rx) || !Number.isFinite(this.activePlacement.ry)) {
      const result = { ok: true, code: "furniture-rotated", rotation: this.activePlacement.rotation };
      this.lastResult = result;
      this.emit(result);
      return result;
    }
    return this.preview(this.activePlacement.rx, this.activePlacement.ry);
  }

  cancelPlacement() {
    const hadPlacement = Boolean(this.activePlacement);
    this.activePlacement = null;
    const result = { ok: true, code: hadPlacement ? "furniture-placement-cancelled" : "placement-inactive" };
    this.lastResult = result;
    this.emit(result);
    return result;
  }

  confirmPlacement() {
    if (!this.activePlacement) return { ok: false, code: "placement-inactive", message: "Choose furniture first." };
    const active = structuredClone(this.activePlacement);
    const validation = validateFurniturePlacement(this.gameState.getSnapshot(), active.itemId, active.rx, active.ry, { rotation: active.rotation, ignorePlacementId: active.existingPlacementId });
    if (!validation.ok) return { ...validation, message: validation.reason };
    const result = this.commit((state) => {
      let placement;
      let ledger;
      if (active.existingPlacementId) {
        placement = state.homeInteriors.placements.find((entry) => entry.id === active.existingPlacementId);
        if (!placement) return { ok: false, code: "placement-missing", message: "That placed furniture could not be found." };
        Object.assign(placement, { rx: validation.rx, ry: validation.ry, rotation: validation.rotation });
        ledger = appendFurnitureLedger(state, this.now(), "home-furniture-move", placement);
      } else {
        const quantity = state.inventory.furniture[active.itemId] || 0;
        if (quantity < 1) return { ok: false, code: "not-owned", message: "This furniture is no longer in your inventory." };
        if (ITEM_CATALOG[active.itemId].aquarium && state.homeInteriors.placements.some((entry) => ITEM_CATALOG[entry.itemId]?.aquarium)) return { ok: false, code: "unique-furniture", message: "Only one ornamental fish tank can be placed." };
        if (state.homeInteriors.placements.length >= HOME_FURNITURE_LIMIT) return { ok: false, code: "limit-reached", message: `Your home has reached its ${HOME_FURNITURE_LIMIT}-item furniture limit.` };
        if (quantity === 1) delete state.inventory.furniture[active.itemId];
        else state.inventory.furniture[active.itemId] = quantity - 1;
        placement = { id: `home-furniture-${state.homeInteriors.nextPlacementId++}`, itemId: active.itemId, rx: validation.rx, ry: validation.ry, rotation: validation.rotation, placedAt: this.now() };
        state.homeInteriors.placements.push(placement);
        ledger = appendFurnitureLedger(state, this.now(), "home-furniture-place", placement);
      }
      return { ok: true, code: active.existingPlacementId ? "furniture-moved" : "furniture-placed", placement: structuredClone(placement), ledger };
    }, "The furniture change could not be saved, so the room was restored.");
    this.lastResult = result;
    if (result.ok) {
      this.activePlacement = null;
      this.emit(result);
    }
    return result;
  }

  store(placementId) {
    if (this.activePlacement) return { ok: false, code: "placement-active", message: "Finish or cancel the current furniture change first." };
    const result = this.commit((state) => {
      const index = state.homeInteriors.placements.findIndex((entry) => entry.id === placementId);
      if (index < 0) return { ok: false, code: "placement-missing", message: "Choose placed furniture first." };
      const selected = state.homeInteriors.placements[index];
      if (ITEM_CATALOG[selected.itemId]?.aquarium && aquariumFishCount(state) > 0) return { ok: false, code: "aquarium-occupied", message: "The fish tank cannot be stored while ornamental fish are living in it. You can move the tank safely instead." };
      const [placement] = state.homeInteriors.placements.splice(index, 1);
      state.inventory.furniture[placement.itemId] = (state.inventory.furniture[placement.itemId] || 0) + 1;
      const ledger = appendFurnitureLedger(state, this.now(), "home-furniture-store", placement);
      return { ok: true, code: "furniture-stored", itemId: placement.itemId, placementId, ledger };
    }, "The furniture could not be stored, so it remains in the room.");
    this.lastResult = result;
    if (result.ok) this.emit(result);
    return result;
  }

  getDiagnostics() {
    const state = this.gameState.getSnapshot();
    const snapshot = this.getSnapshot();
    const interiors = state.houseRescue ? Object.keys(state.houseRescue.homes).length : 0;
    const aquarium = aquariumSnapshot(state);
    return {
      enabled: true,
      homeCount: interiors,
      personalHouseId: PERSONAL_HOME_HOUSE_ID,
      products: Object.values(ITEM_CATALOG).filter((item) => item.category === "furniture" && item.indoorSize).length,
      placementCount: snapshot.placements.length,
      placementLimit: HOME_FURNITURE_LIMIT,
      visits: Object.keys(snapshot.visits).length,
      activePlacement: snapshot.activePlacement,
      aquariumIntegrated: true,
      aquarium,
      occupiedTankStorageBlocked: true,
      lastResult: structuredClone(this.lastResult),
    };
  }
}
