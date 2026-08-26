import { ITEM_CATALOG } from "./items.js";
import { FISH_RARITY, ORNAMENTAL_FISH_IDS } from "./fishing.js";

export const FISH_TANK_ITEM_ID = "ornamental-fish-tank";

export const AQUARIUM_CONFIG = Object.freeze({
  maxPerSpecies: 99,
  displayLimit: 8,
  requiresPlacedTank: true,
});

const speciesRows = [
  ["pond-goldfish", "goldfish", 0xed8a32, 0xffd07a, 0xd95c31],
  ["reedbank-koi", "koi", 0xf3ead1, 0xfff8df, 0xd9553f],
  ["pond-angelfish", "angelfish", 0xe8d6a7, 0xfff0c9, 0x5d6d77],
  ["oranda-goldfish", "oranda", 0xf0a33f, 0xffd98a, 0xdf7437],
];

export const AQUARIUM_SPECIES = Object.freeze(speciesRows.map(([id, art, body, light, fin]) => Object.freeze({
  id,
  name: ITEM_CATALOG[id].name,
  icon: ITEM_CATALOG[id].icon,
  rarity: FISH_RARITY[id],
  art,
  palette: Object.freeze({ body, light, fin }),
})));

export const AQUARIUM_SPECIES_BY_ID = Object.freeze(Object.fromEntries(AQUARIUM_SPECIES.map((species) => [species.id, species])));

if (AQUARIUM_SPECIES.length !== ORNAMENTAL_FISH_IDS.length || AQUARIUM_SPECIES.some((species, index) => species.id !== ORNAMENTAL_FISH_IDS[index])) {
  throw new Error("Aquarium species must stay aligned with the ornamental Reedbank catch list.");
}
