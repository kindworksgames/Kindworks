import { ANIMAL_BY_ID, ANIMAL_SPECIES, SOUTH_MEADOW } from "../data/animals.js";
import { ITEM_CATALOG } from "../data/items.js";
import {
  PAWS_WONDERS,
  PAWS_WONDERS_CATALOG,
  PAWS_WONDERS_DINO_REQUIRED_MILESTONES,
  PAWS_WONDERS_ITEM_IDS,
  restorationMilestoneCount,
  validatePawsWonders,
} from "../data/pawsWonders.js";
import { COIN_LEDGER_LIMIT } from "../state/economyState.js";

export class PawsWondersService {
  constructor(gameState, repository, { now = () => Date.now() } = {}) {
    this.gameState = gameState;
    this.repository = repository;
    this.now = now;
    this.listeners = new Set();
  }

  subscribe(listener) {
    if (typeof listener !== "function") return () => {};
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(result) {
    for (const listener of this.listeners) listener(result);
  }

  getProduct(itemId, stateOverride = null) {
    const item = PAWS_WONDERS_CATALOG[itemId];
    if (!item) return { ok: false, code: "unknown-companion", message: "That companion is not available at Paws & Wonders." };
    const state = stateOverride || this.gameState.getSnapshot();
    const resident = state.animals.residents[item.animalId];
    const milestones = restorationMilestoneCount(state);
    const locked = item.milestonesRequired > milestones;
    const shortfall = Math.max(0, item.price - state.economy.coins);
    return {
      ok: true, item, animal: ANIMAL_BY_ID[item.animalId], resident,
      adopted: Boolean(resident?.adopted), balance: state.economy.coins,
      affordable: shortfall === 0, shortfall, milestones,
      requiredMilestones: item.milestonesRequired,
      unlocked: !locked,
      canAdopt: Boolean(resident && !resident.adopted && !locked && shortfall === 0),
      location: resident?.adopted ? (state.animals.activeAnimalId === item.animalId ? "following" : SOUTH_MEADOW.id) : PAWS_WONDERS.id,
    };
  }

  getCatalogue() {
    const state = this.gameState.getSnapshot();
    return { ok: true, shop: PAWS_WONDERS, balance: state.economy.coins, products: PAWS_WONDERS_ITEM_IDS.map((id) => this.getProduct(id, state)), dinosaur: { milestones: restorationMilestoneCount(state), required: PAWS_WONDERS_DINO_REQUIRED_MILESTONES } };
  }

  commit(mutator) {
    const checkpoint = this.gameState.getSnapshot();
    const working = structuredClone(checkpoint);
    const mutation = mutator(working);
    if (!mutation.ok) return mutation;
    working.updatedAt = new Date(this.now()).toISOString();
    const replaced = this.gameState.replace(working);
    if (!replaced.ok) return { ok: false, code: "state-validation", errors: replaced.errors };
    const saved = this.repository.save(working, { now: this.now() });
    if (!saved.ok) {
      const rollback = this.gameState.replace(checkpoint);
      return { ok: false, code: "persistence-failed", message: "The adoption could not be saved, so the coins were restored.", save: saved, rollbackOk: rollback.ok };
    }
    const result = { ...mutation, state: this.gameState.getSnapshot(), save: saved };
    this.emit(result);
    return result;
  }

  adopt(itemId) {
    const initial = this.getProduct(itemId);
    if (!initial.ok) return initial;
    if (initial.adopted) return { ok: false, code: "already-adopted", message: `${initial.resident.name} has already been adopted.` };
    if (!initial.unlocked) {
      const remaining = initial.requiredMilestones - initial.milestones;
      return { ok: false, code: "milestone-locked", message: `Restore ${remaining} more part${remaining === 1 ? "" : "s"} of town to wake the mystery egg.`, milestones: initial.milestones, required: initial.requiredMilestones };
    }
    if (!initial.affordable) return { ok: false, code: "insufficient-funds", message: `You need ${initial.shortfall.toLocaleString()} more coins to adopt ${initial.item.name}.`, required: initial.item.price, available: initial.balance };
    return this.commit((state) => {
      const product = this.getProduct(itemId, state);
      if (product.adopted) return { ok: false, code: "already-adopted", message: `${product.resident.name} has already been adopted.` };
      if (!product.unlocked) return { ok: false, code: "milestone-locked", message: "The mystery egg is still sleeping." };
      if (!product.affordable) return { ok: false, code: "insufficient-funds", message: "There are not enough coins for this adoption." };
      const resident = state.animals.residents[product.item.animalId];
      const activeAnimalId = state.animals.activeAnimalId;
      const before = state.economy.coins;
      state.economy.coins -= product.item.price;
      state.economy.lifetimeCoinsSpent += product.item.price;
      const serial = state.economy.nextTransactionId;
      const ledger = {
        id: `coin-${String(serial).padStart(6, "0")}`,
        amount: -product.item.price,
        kind: "paws-wonders-adoption",
        reason: `Adopted ${product.item.name} from ${PAWS_WONDERS.name}`,
        itemId, quantity: 1, shopId: PAWS_WONDERS.id,
        animalId: product.item.animalId, breed: product.item.breed,
        balance: state.economy.coins, occurredAt: new Date(this.now()).toISOString(),
      };
      state.economy.nextTransactionId += 1;
      state.economy.ledger.push(ledger);
      state.economy.ledger = state.economy.ledger.slice(-COIN_LEDGER_LIMIT);
      resident.adopted = true;
      resident.active = false;
      resident.trust = 100;
      resident.purchasedDay = state.world.day;
      resident.lastRequestDay = state.world.day;
      resident.lastFriendlinessDecayDay = state.world.day;
      resident.lastCompanionCareDay = state.world.day;
      resident.failedRequests = 0;
      resident.rareReplayStartAbsoluteMinute = null;
      resident.eventCount += 1;
      state.animals.activeAnimalId = activeAnimalId;
      for (const [animalId, other] of Object.entries(state.animals.residents)) other.active = Boolean(activeAnimalId && animalId === activeAnimalId);
      state.animals.eventSerial += 1;
      return { ok: true, code: "paws-wonders-adopted", itemId, animalId: product.item.animalId, name: resident.name, cost: product.item.price, before, after: state.economy.coins, activeAnimalId, location: SOUTH_MEADOW.id, permanent: true, ledger };
    });
  }

  getDiagnostics() {
    const validation = validatePawsWonders();
    const catalogue = this.getCatalogue();
    return {
      version: "1.0.0-milestone-36", valid: validation.ok, errors: validation.errors,
      total: validation.total, dogs: validation.dogs, exotics: validation.exotics, featured: validation.featured,
      adopted: catalogue.products.filter((product) => product.adopted).length,
      dinosaur: catalogue.dinosaur,
      stableMapNodeId: PAWS_WONDERS.legacyNodeId, stableShopId: PAWS_WONDERS.legacyShopId,
      topDown: true, physicalEnclosures: true, coinAdoption: true, oneTimeAdoptions: true,
      permanentShopPets: true, activeFollowerPreserved: true, restingZone: SOUTH_MEADOW.id,
      unlimitedCompanions: true, atomicPersistence: true,
      careFoodsValid: catalogue.products.every(({ item, animal }) => item.foodIds.every((id) => ITEM_CATALOG[id] && ANIMAL_SPECIES[animal.species].accepted.includes(id))),
    };
  }
}
