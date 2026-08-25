import {
  ANIMAL_BY_ID,
  ANIMAL_DEFINITIONS,
  COMPANION_CARE_CONFIG,
  adoptionChance,
  adoptionRulesFor,
  speciesFor,
  worldAnimalPresentations,
} from "../data/animals.js";
import { absoluteWorldMinute } from "../data/farming.js";
import { ITEM_CATALOG } from "../data/items.js";
import { InventoryService } from "./InventoryService.js";

function trustGain(resident, amount) {
  const before = resident.trust;
  resident.trust = Math.min(100, resident.trust + amount);
  resident.eventCount += 1;
  return resident.trust - before;
}

export class AnimalService {
  constructor(gameState, repository, { now = () => Date.now(), random = Math.random } = {}) {
    this.gameState = gameState;
    this.repository = repository;
    this.now = now;
    this.random = random;
    this.inventory = new InventoryService();
    this.listeners = new Set();
  }

  subscribe(listener) {
    if (typeof listener !== "function") throw new TypeError("An animal listener must be a function.");
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(result) {
    const snapshot = this.getSnapshot();
    for (const listener of this.listeners) listener(snapshot, result);
  }

  getSnapshot() {
    return structuredClone(this.gameState.getSnapshot().animals);
  }

  getResidents() {
    const state = this.gameState.getSnapshot();
    return ANIMAL_DEFINITIONS.map((definition) => ({
      definition,
      species: speciesFor(definition),
      state: structuredClone(state.animals.residents[definition.id]),
    }));
  }

  getWorldPresentations() {
    const state = this.gameState.getSnapshot();
    return worldAnimalPresentations(state.animals, state.world);
  }

  resolveCareInto(state, { offline = false } = {}) {
    const animals = state.animals;
    const fromDay = animals.lastResolvedDay;
    const toDay = state.world.day;
    if (toDay <= fromDay) return { resolvedDays: 0, departures: [] };
    const departures = [];
    for (let day = fromDay + 1; day <= toDay; day += 1) {
      const grace = offline && day <= fromDay + COMPANION_CARE_CONFIG.offlineGraceDays;
      for (const definition of ANIMAL_DEFINITIONS) {
        const resident = animals.residents[definition.id];
        if (!resident.adopted) continue;
        const protectedByCare = resident.lastCompanionCareDay >= day - 1;
        if (!grace && !protectedByCare) resident.trust = Math.max(0, resident.trust - COMPANION_CARE_CONFIG.dailyDecay);
        if (offline) resident.trust = Math.max(COMPANION_CARE_CONFIG.offlineFloor, resident.trust);
        resident.lastFriendlinessDecayDay = day;
        if (!offline && resident.trust < COMPANION_CARE_CONFIG.releaseThreshold) {
          resident.adopted = false;
          resident.active = false;
          resident.failedRequests = 0;
          resident.trust = Math.max(0, resident.trust);
          animals.departureEvents += 1;
          departures.push(definition.id);
          if (animals.activeAnimalId === definition.id) animals.activeAnimalId = null;
        }
      }
    }
    animals.lastResolvedDay = toDay;
    return { resolvedDays: toDay - fromDay, departures };
  }

  commit(mutator, { persist = true, offline = false } = {}) {
    const checkpoint = this.gameState.getSnapshot();
    const working = structuredClone(checkpoint);
    const care = this.resolveCareInto(working, { offline });
    const mutation = mutator(working, care);
    if (!mutation.ok) return mutation;
    working.updatedAt = new Date(this.now()).toISOString();
    const replaced = this.gameState.replace(working);
    if (!replaced.ok) return { ok: false, code: "state-validation", errors: replaced.errors };
    const saved = persist ? this.repository.save(working, { now: this.now() }) : { ok: true, status: "deferred" };
    if (!saved.ok) {
      const rollback = this.gameState.replace(checkpoint);
      return { ok: false, code: "persistence-failed", message: "The animal-care change could not be saved, so the previous state was restored.", save: saved, rollbackOk: rollback.ok };
    }
    const result = { ...mutation, care, state: this.gameState.getSnapshot(), save: saved };
    this.emit(result);
    return result;
  }

  refresh({ persist = false, offline = false } = {}) {
    const current = this.gameState.getSnapshot();
    if (current.animals.lastResolvedDay >= current.world.day) return { ok: true, code: "already-current", resolvedDays: 0, departures: [] };
    return this.commit((_state, care) => ({ ok: true, code: "animal-care-refreshed", ...care }), { persist, offline });
  }

  availableIn(state, animalId) {
    return worldAnimalPresentations(state.animals, state.world).find((entry) => entry.definition.id === animalId)?.visible || false;
  }

  greet(animalId) {
    const definition = ANIMAL_BY_ID[animalId];
    if (!definition) return { ok: false, code: "unknown-animal", message: "That animal does not live in Willowmere." };
    return this.commit((state) => {
      const resident = state.animals.residents[animalId];
      if (!resident.adopted && !this.availableIn(state, animalId)) return { ok: false, code: "animal-away", message: `${resident.name} is exploring elsewhere right now.` };
      const absolute = absoluteWorldMinute(state.world);
      if (resident.lastGreetAbsoluteMinute !== null && absolute - resident.lastGreetAbsoluteMinute < COMPANION_CARE_CONFIG.affectionCooldownMinutes) {
        const remaining = COMPANION_CARE_CONFIG.affectionCooldownMinutes - (absolute - resident.lastGreetAbsoluteMinute);
        return { ok: false, code: "greeting-cooldown", message: `${resident.name} needs a little space for ${remaining} more game minutes.`, remainingMinutes: remaining };
      }
      resident.lastGreetAbsoluteMinute = absolute;
      resident.lastCompanionCareDay = state.world.day;
      const requested = resident.adopted ? COMPANION_CARE_CONFIG.affectionGain : 7;
      const gainedTrust = trustGain(resident, requested);
      return { ok: true, code: "animal-greeted", animalId, gainedTrust, trust: resident.trust };
    });
  }

  feed(animalId, itemId) {
    const definition = ANIMAL_BY_ID[animalId];
    const species = speciesFor(definition);
    if (!definition) return { ok: false, code: "unknown-animal", message: "That animal does not live in Willowmere." };
    if (!species.accepted.includes(itemId)) return { ok: false, code: "incompatible-food", message: `${species.label}s cannot safely eat that. Nothing was used.` };
    return this.commit((state) => {
      const resident = state.animals.residents[animalId];
      if (!resident.adopted && !this.availableIn(state, animalId)) return { ok: false, code: "animal-away", message: `${resident.name} is exploring elsewhere right now.` };
      if (resident.lastTreatDay === state.world.day) return { ok: false, code: "already-fed", message: `${resident.name} has already had a treat today.` };
      const removed = this.inventory.remove(state.inventory, itemId, 1);
      if (!removed.ok) return { ...removed, message: `You do not have any ${ITEM_CATALOG[itemId]?.name || "that food"}.` };
      resident.lastTreatDay = state.world.day;
      resident.lastCompanionCareDay = state.world.day;
      const favorite = species.favorites.includes(itemId);
      const requested = (resident.adopted ? COMPANION_CARE_CONFIG.treatGain : 14) + (favorite ? 5 : 0);
      const gainedTrust = trustGain(resident, requested);
      return { ok: true, code: "animal-fed", animalId, itemId, favorite, gainedTrust, trust: resident.trust };
    });
  }

  requestAdoption(animalId, { roll = this.random() } = {}) {
    const definition = ANIMAL_BY_ID[animalId];
    if (!definition) return { ok: false, code: "unknown-animal", message: "That animal does not live in Willowmere." };
    return this.commit((state) => {
      const resident = state.animals.residents[animalId];
      if (!state.customResident?.profile) return { ok: false, code: "resident-required", message: "Create your Willowmere resident before adopting an animal." };
      if (resident.adopted) return { ok: false, code: "already-adopted", message: `${resident.name} is already part of your animal family.` };
      if (!this.availableIn(state, animalId)) return { ok: false, code: "animal-away", message: `${resident.name} is exploring elsewhere right now.` };
      if (resident.lastRequestDay === state.world.day) return { ok: false, code: "request-used", message: `You can ask ${resident.name} again tomorrow.` };
      const rules = adoptionRulesFor(definition);
      const chance = adoptionChance(resident, definition);
      const guaranteed = resident.failedRequests >= rules.guaranteedAfterFailures;
      resident.lastRequestDay = state.world.day;
      resident.eventCount += 1;
      if (!guaranteed && Number(roll) >= chance) {
        resident.failedRequests = Math.min(99, resident.failedRequests + 1);
        resident.trust = Math.min(100, resident.trust + rules.failureTrustGain);
        return { ok: true, code: "adoption-not-yet", adopted: false, animalId, chance, guaranteed: false, trust: resident.trust, failedRequests: resident.failedRequests };
      }
      resident.adopted = true;
      resident.trust = Math.max(COMPANION_CARE_CONFIG.releaseThreshold, resident.trust);
      resident.failedRequests = 0;
      resident.lastCompanionCareDay = state.world.day;
      if (!state.animals.activeAnimalId) {
        state.animals.activeAnimalId = animalId;
        resident.active = true;
      }
      return { ok: true, code: "animal-adopted", adopted: true, animalId, chance, guaranteed, active: resident.active };
    });
  }

  setActive(animalId) {
    if (!ANIMAL_BY_ID[animalId]) return { ok: false, code: "unknown-animal", message: "That animal does not live in Willowmere." };
    return this.commit((state) => {
      const resident = state.animals.residents[animalId];
      if (!resident.adopted) return { ok: false, code: "not-adopted", message: `Adopt ${resident.name} before asking them to follow you.` };
      for (const entry of Object.values(state.animals.residents)) entry.active = false;
      resident.active = true;
      state.animals.activeAnimalId = animalId;
      return { ok: true, code: "companion-following", animalId };
    });
  }

  clearActive() {
    return this.commit((state) => {
      if (!state.animals.activeAnimalId) return { ok: false, code: "no-active-companion", message: "No animal is following you right now." };
      const animalId = state.animals.activeAnimalId;
      state.animals.residents[animalId].active = false;
      state.animals.activeAnimalId = null;
      return { ok: true, code: "companion-roaming", animalId };
    });
  }

  rename(animalId, requestedName) {
    return this.commit((state) => {
      const resident = state.animals.residents[animalId];
      if (!resident?.adopted) return { ok: false, code: "not-adopted", message: "Only adopted companions can be renamed." };
      const name = String(requestedName || "").replace(/[^\p{L}\p{N} '’\-]/gu, "").replace(/\s+/g, " ").trim().slice(0, 24);
      if (!name) return { ok: false, code: "invalid-name", message: "Choose a name with letters or numbers." };
      resident.name = name;
      return { ok: true, code: "animal-renamed", animalId, name };
    });
  }

  getDiagnostics() {
    const state = this.gameState.getSnapshot();
    const presentations = worldAnimalPresentations(state.animals, state.world);
    return {
      totalAnimals: ANIMAL_DEFINITIONS.length,
      visibleWildAnimals: presentations.filter((entry) => entry.visible && !entry.state.adopted).length,
      adoptedAnimals: Object.values(state.animals.residents).filter((entry) => entry.adopted).length,
      activeAnimalId: state.animals.activeAnimalId,
      southMeadowResidents: presentations.filter((entry) => entry.location === "south-meadow").length,
      departureEvents: state.animals.departureEvents,
      lastResolvedDay: state.animals.lastResolvedDay,
    };
  }
}
