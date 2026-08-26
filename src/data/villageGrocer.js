import { ITEM_CATALOG } from "./items.js";

export const VILLAGE_GROCER_DISPLAY_IDS = Object.freeze([
  "carrot-seeds",
  "fresh-greens-seeds",
  "wild-berry-starters",
  "orchard-apple-sapling",
  "mixed-seeds",
  "sunflower-seeds",
  "mealworms",
  "fresh-greens",
  "wild-berries",
]);

export const VILLAGE_GROCER_FIXTURES = Object.freeze({
  shelf: Object.freeze({ x: 5, y: 14, width: 90, height: 20, label: "ALLOTMENT SEEDS" }),
  islandA: Object.freeze({ x: 5, y: 39, width: 90, height: 20, label: "APPLE SAPLINGS" }),
  islandB: Object.freeze({ x: 5, y: 64, width: 62, height: 20, label: "ANIMAL FOOD" }),
  counter: Object.freeze({ x: 73, y: 64, width: 22, height: 20, label: "CHECKOUT" }),
});

export const VILLAGE_GROCER_DISPLAYS = Object.freeze([
  Object.freeze({ id: "carrot-seeds", x: 9, y: 20, width: 24, height: 11, fixture: "shelf", displayKind: "seed", count: 4 }),
  Object.freeze({ id: "fresh-greens-seeds", x: 38, y: 20, width: 24, height: 11, fixture: "shelf", displayKind: "seed", count: 4 }),
  Object.freeze({ id: "wild-berry-starters", x: 67, y: 20, width: 24, height: 11, fixture: "shelf", displayKind: "seed", count: 4 }),
  Object.freeze({ id: "orchard-apple-sapling", x: 9, y: 45, width: 82, height: 11, fixture: "islandA", displayKind: "sapling", count: 10 }),
  Object.freeze({ id: "mixed-seeds", x: 7, y: 70, width: 11, height: 11, fixture: "islandB", displayKind: "seed", count: 2 }),
  Object.freeze({ id: "sunflower-seeds", x: 19, y: 70, width: 11, height: 11, fixture: "islandB", displayKind: "seed", count: 2 }),
  Object.freeze({ id: "mealworms", x: 31, y: 70, width: 11, height: 11, fixture: "islandB", displayKind: "pantry", count: 2 }),
  Object.freeze({ id: "fresh-greens", x: 43, y: 70, width: 11, height: 11, fixture: "islandB", displayKind: "produce", count: 2 }),
  Object.freeze({ id: "wild-berries", x: 55, y: 70, width: 11, height: 11, fixture: "islandB", displayKind: "produce", count: 2 }),
]);

export const VILLAGE_GROCER_NPCS = Object.freeze([
  Object.freeze({ name: "Mara", role: "Cashier", x: 84, y: 76, icon: "🧑🏾‍🌾" }),
  Object.freeze({ name: "Ben", role: "Customer", x: 68, y: 59, icon: "🧑🏻" }),
]);

export const VILLAGE_GROCER_INTERIOR = Object.freeze({
  id: "town-grocer",
  name: "Village Grocer",
  sign: "VILLAGE GROCER",
  subtitle: "Walk to a shelf row or tap it to inspect and buy",
  room: Object.freeze({ x: 86, y: 84, width: 1108, height: 552 }),
  spawn: Object.freeze({ x: 640, y: 594, facing: "up" }),
  exit: Object.freeze({ x: 640, y: 626, radius: 62 }),
  fixtures: VILLAGE_GROCER_FIXTURES,
  displays: VILLAGE_GROCER_DISPLAYS,
  npcs: VILLAGE_GROCER_NPCS,
});

export function percentRect(rect, room = VILLAGE_GROCER_INTERIOR.room) {
  return {
    x: room.x + room.width * rect.x / 100,
    y: room.y + room.height * rect.y / 100,
    width: room.width * rect.width / 100,
    height: room.height * rect.height / 100,
  };
}

export function validateVillageGrocerInterior() {
  const errors = [];
  const ids = VILLAGE_GROCER_DISPLAYS.map((display) => display.id);
  if (ids.length !== 9 || new Set(ids).size !== 9) errors.push("Village Grocer must contain exactly nine unique product displays.");
  if (ids.join(",") !== VILLAGE_GROCER_DISPLAY_IDS.join(",")) errors.push("Village Grocer display order differs from the original layout.");
  for (const display of VILLAGE_GROCER_DISPLAYS) {
    const item = ITEM_CATALOG[display.id];
    const fixture = VILLAGE_GROCER_FIXTURES[display.fixture];
    if (!item || item.retailer !== "town-grocer") errors.push(`${display.id} is not purchasable Village Grocer stock.`);
    if (!fixture) errors.push(`${display.id} has no containing shop fixture.`);
    else if (display.x < fixture.x || display.y < fixture.y || display.x + display.width > fixture.x + fixture.width || display.y + display.height > fixture.y + fixture.height) errors.push(`${display.id} leaves its ${display.fixture} fixture.`);
  }
  const groups = {
    allotmentSeeds: ids.filter((id) => ["carrot-seeds", "fresh-greens-seeds", "wild-berry-starters"].includes(id)),
    appleSaplings: ids.filter((id) => id === "orchard-apple-sapling"),
    animalFood: ids.filter((id) => ["mixed-seeds", "sunflower-seeds", "mealworms", "fresh-greens", "wild-berries"].includes(id)),
  };
  if (groups.allotmentSeeds.length !== 3 || groups.appleSaplings.length !== 1 || groups.animalFood.length !== 5) errors.push("Village Grocer product groups are incomplete.");
  return { ok: errors.length === 0, errors, productCount: ids.length, groups };
}
