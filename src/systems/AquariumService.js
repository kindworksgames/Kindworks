import { AQUARIUM_CONFIG, AQUARIUM_SPECIES } from "../data/aquarium.js";
import { aquariumSnapshot, fishTankOwnershipCount, placedFishTank } from "../state/aquariumState.js";

export class AquariumService {
  constructor(gameState, repository, { now = () => Date.now() } = {}) {
    this.gameState = gameState;
    this.repository = repository;
    this.now = now;
  }

  getSnapshot() {
    return aquariumSnapshot(this.gameState.getSnapshot());
  }

  stockForQa(counts = { "pond-goldfish": 3, "reedbank-koi": 2, "pond-angelfish": 2, "oranda-goldfish": 1 }) {
    const checkpoint = this.gameState.getSnapshot();
    if (!placedFishTank(checkpoint)) return { ok: false, code: "tank-not-placed", message: "Place the ornamental fish tank before adding fish." };
    const working = structuredClone(checkpoint);
    for (const species of AQUARIUM_SPECIES) working.fishing.aquariumByItem[species.id] = Math.max(0, Math.min(AQUARIUM_CONFIG.maxPerSpecies, Math.floor(Number(counts[species.id]) || 0)));
    working.updatedAt = new Date(this.now()).toISOString();
    const replaced = this.gameState.replace(working);
    if (!replaced.ok) return { ok: false, code: "state-validation", errors: replaced.errors };
    const save = this.repository.save(working, { now: this.now() });
    if (!save.ok) {
      this.gameState.replace(checkpoint);
      return { ok: false, code: "persistence-failed", message: "The aquarium fixture could not be saved, so the tank was restored.", save };
    }
    return { ok: true, code: "aquarium-stocked", aquarium: this.getSnapshot(), save };
  }

  getDiagnostics() {
    const state = this.gameState.getSnapshot();
    const aquarium = aquariumSnapshot(state);
    return {
      enabled: true,
      integrated: true,
      tankItemId: aquarium.tankItemId,
      tankOwned: aquarium.owned,
      tankPlaced: aquarium.placed,
      tankOwnershipCount: fishTankOwnershipCount(state),
      totalFish: aquarium.totalFish,
      speciesCount: aquarium.species.length,
      species: aquarium.species,
      maxPerSpecies: AQUARIUM_CONFIG.maxPerSpecies,
      displayLimit: AQUARIUM_CONFIG.displayLimit,
      safeReleaseWithoutTank: true,
      consumableInventoryLeak: AQUARIUM_SPECIES.some((species) => Boolean(state.inventory.consumables?.[species.id])),
    };
  }
}
