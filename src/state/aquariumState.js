import { AQUARIUM_CONFIG, AQUARIUM_SPECIES, AQUARIUM_SPECIES_BY_ID, FISH_TANK_ITEM_ID } from "../data/aquarium.js";
import { ORNAMENTAL_FISH_IDS } from "../data/fishing.js";
import { COIN_LEDGER_LIMIT } from "./economyState.js";

function whole(value, maximum = Number.MAX_SAFE_INTEGER) {
  const number = Math.floor(Number(value));
  return Number.isFinite(number) ? Math.max(0, Math.min(maximum, number)) : 0;
}

export function placedFishTank(state) {
  return state?.homeInteriors?.placements?.find((placement) => placement.itemId === FISH_TANK_ITEM_ID) || null;
}

export function fishTankOwnershipCount(state) {
  return whole(state?.inventory?.furniture?.[FISH_TANK_ITEM_ID])
    + (state?.homeInteriors?.placements || []).filter((placement) => placement.itemId === FISH_TANK_ITEM_ID).length;
}

export function aquariumFishCount(state, itemId = null) {
  if (itemId) return AQUARIUM_SPECIES_BY_ID[itemId] ? whole(state?.fishing?.aquariumByItem?.[itemId], AQUARIUM_CONFIG.maxPerSpecies) : 0;
  return ORNAMENTAL_FISH_IDS.reduce((total, id) => total + aquariumFishCount(state, id), 0);
}

export function aquariumSpeciesSummary(state) {
  return AQUARIUM_SPECIES.filter((species) => aquariumFishCount(state, species.id) > 0).map((species) => ({
    ...species,
    palette: { ...species.palette },
    count: aquariumFishCount(state, species.id),
  }));
}

export function aquariumDisplayFish(state, limit = AQUARIUM_CONFIG.displayLimit) {
  const maximum = Math.max(0, Math.floor(Number(limit) || 0));
  const remaining = Object.fromEntries(ORNAMENTAL_FISH_IDS.map((id) => [id, aquariumFishCount(state, id)]));
  const display = [];
  while (display.length < maximum && ORNAMENTAL_FISH_IDS.some((id) => remaining[id] > 0)) {
    for (const id of ORNAMENTAL_FISH_IDS) {
      if (display.length >= maximum) break;
      if (remaining[id] > 0) {
        display.push(id);
        remaining[id] -= 1;
      }
    }
  }
  return display;
}

export function aquariumSnapshot(state) {
  const placement = placedFishTank(state);
  return {
    tankItemId: FISH_TANK_ITEM_ID,
    owned: fishTankOwnershipCount(state) > 0,
    placed: Boolean(placement),
    placementId: placement?.id || null,
    totalFish: aquariumFishCount(state),
    species: aquariumSpeciesSummary(state),
    displayFish: aquariumDisplayFish(state),
    released: Object.fromEntries(ORNAMENTAL_FISH_IDS.map((id) => [id, whole(state?.fishing?.releasedByItem?.[id])])),
    maxPerSpecies: AQUARIUM_CONFIG.maxPerSpecies,
    requiresPlacedTank: AQUARIUM_CONFIG.requiresPlacedTank,
  };
}

export function routeOrnamentalCatchInto(state, itemId) {
  if (!AQUARIUM_SPECIES_BY_ID[itemId]) return { ok: false, code: "not-ornamental" };
  if (!placedFishTank(state)) {
    state.fishing.releasedByItem[itemId] += 1;
    return { ok: true, disposition: "released-no-tank", speciesCount: 0 };
  }
  const count = aquariumFishCount(state, itemId);
  if (count >= AQUARIUM_CONFIG.maxPerSpecies) {
    state.fishing.releasedByItem[itemId] += 1;
    return { ok: true, disposition: "released-full", speciesCount: count };
  }
  state.fishing.aquariumByItem[itemId] = count + 1;
  return { ok: true, disposition: "aquarium", speciesCount: count + 1 };
}

function appendReleaseLedger(state, { kind, reason, quantity, releasedByItem, now }) {
  if (!quantity || !state?.economy) return null;
  const serial = Math.max(1, whole(state.economy.nextTransactionId, Number.MAX_SAFE_INTEGER));
  const entry = {
    id: `coin-${String(serial).padStart(6, "0")}`,
    amount: 0,
    kind,
    reason,
    itemId: null,
    quantity,
    releasedByItem: { ...releasedByItem },
    balance: state.economy.coins,
    occurredAt: new Date(now).toISOString(),
  };
  state.economy.nextTransactionId = serial + 1;
  state.economy.ledger.push(entry);
  state.economy.ledger = state.economy.ledger.slice(-COIN_LEDGER_LIMIT);
  return entry;
}

export function safelyReleaseAquariumFishInto(state, { reason = "Fish tank unavailable", now = Date.now() } = {}) {
  const releasedByItem = {};
  let released = 0;
  for (const id of ORNAMENTAL_FISH_IDS) {
    const count = aquariumFishCount(state, id);
    state.fishing.aquariumByItem[id] = 0;
    if (!count) continue;
    state.fishing.releasedByItem[id] += count;
    releasedByItem[id] = count;
    released += count;
  }
  const ledger = appendReleaseLedger(state, { kind: "aquarium-safe-release", reason, quantity: released, releasedByItem, now });
  return { ok: true, released, releasedByItem, ledger };
}

export function migrateLegacyOrnamentalInventoryInto(state, { now = Date.now() } = {}) {
  const releasedByItem = {};
  let released = 0;
  for (const bucket of ["equipment", "placeables", "consumables", "furniture"]) {
    for (const id of ORNAMENTAL_FISH_IDS) {
      const count = whole(state?.inventory?.[bucket]?.[id]);
      if (!count) continue;
      delete state.inventory[bucket][id];
      state.fishing.releasedByItem[id] += count;
      releasedByItem[id] = (releasedByItem[id] || 0) + count;
      released += count;
    }
  }
  if (Array.isArray(state?.inventory?.unresolvedLegacy)) {
    state.inventory.unresolvedLegacy = state.inventory.unresolvedLegacy.filter((entry) => {
      if (!ORNAMENTAL_FISH_IDS.includes(entry?.id)) return true;
      const count = whole(entry.quantity);
      state.fishing.releasedByItem[entry.id] += count;
      releasedByItem[entry.id] = (releasedByItem[entry.id] || 0) + count;
      released += count;
      return false;
    });
  }
  const ledger = appendReleaseLedger(state, {
    kind: "legacy-ornamental-fish-release",
    reason: "Safely released ornamental fish imported from the old consumable inventory",
    quantity: released,
    releasedByItem,
    now,
  });
  return { ok: true, released, releasedByItem, ledger };
}

export function reconcileAquariumHousingInto(state, { reason = "Fish tank unavailable after save restoration", now = Date.now() } = {}) {
  const legacyInventory = migrateLegacyOrnamentalInventoryInto(state, { now });
  const housing = placedFishTank(state)
    ? { ok: true, released: 0, releasedByItem: {}, ledger: null }
    : safelyReleaseAquariumFishInto(state, { reason, now });
  return { ok: true, released: legacyInventory.released + housing.released, legacyInventory, housing };
}

export function validateAquariumHousing(state) {
  const errors = [];
  const placed = Boolean(placedFishTank(state));
  if (aquariumFishCount(state) > 0 && !placed) errors.push("Aquarium fish require a placed ornamental fish tank.");
  for (const id of ORNAMENTAL_FISH_IDS) {
    const count = state?.fishing?.aquariumByItem?.[id];
    if (!Number.isInteger(count) || count < 0 || count > AQUARIUM_CONFIG.maxPerSpecies) errors.push(`${id} aquarium count is invalid.`);
    for (const bucket of ["equipment", "placeables", "consumables", "furniture"]) if (state?.inventory?.[bucket]?.[id]) errors.push(`${id} must not appear in ordinary inventory.`);
  }
  return { ok: errors.length === 0, errors };
}
