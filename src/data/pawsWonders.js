import { ANIMAL_BY_ID, ANIMAL_SPECIES, SHOP_PET_DEFINITIONS } from "./animals.js";
import { ITEM_CATALOG } from "./items.js";
import { NPC_NAVIGATION_NODES, NPC_RESIDENTS } from "./npcTownLife.js";
import { RESTORATION_MILESTONE_ORDER } from "./restorationMilestones.js";
import { SHOPS } from "./town.js";

export const PAWS_WONDERS_DINO_REQUIRED_MILESTONES = 3;

export const PAWS_WONDERS = Object.freeze({
  id: "paws-wonders",
  legacyShopId: "shop-11",
  legacyNodeId: "biz_arcade",
  name: "Paws & Wonders",
  icon: "🐾",
  description: "Evie's permanent adoption shop for dogs, unusual companions and one mysterious egg.",
  door: Object.freeze({ x: 3460, y: 1095 }),
  approach: Object.freeze({ x: 3460, y: 1132 }),
  interactionRadius: 96,
});

const companion = (id, animalId, name, breed, category, icon, price, personality, description, foodIds, milestonesRequired = 0) => Object.freeze({
  id, animalId, name, breed, category, icon, price, personality, description,
  foodIds: Object.freeze(foodIds), milestonesRequired,
});

export const PAWS_WONDERS_CATALOG = Object.freeze({
  "pet-labrador": companion("pet-labrador", "pet-dog-labrador", "Sunny", "Labrador", "dog", "🐕", 420, "Warm, bouncy and people-focused", "A cheerful Labrador who loves long walks and meeting everyone in town.", ["chicken-pieces", "beef-strips"]),
  "pet-spaniel": companion("pet-spaniel", "pet-dog-spaniel", "Poppy", "Cocker Spaniel", "dog", "🐕", 440, "Affectionate and inquisitive", "A soft-eared spaniel who follows interesting scents and settles close to friends.", ["chicken-pieces", "prepared-meat"]),
  "pet-dachshund": companion("pet-dachshund", "pet-dog-dachshund", "Pretzel", "Dachshund", "dog", "🐕", 390, "Brave, funny and determined", "A small, long-bodied explorer with a very serious opinion about every hedge.", ["beef-strips", "prepared-meat"]),
  "pet-corgi": companion("pet-corgi", "pet-dog-corgi", "Biscuit", "Corgi", "dog", "🐕", 450, "Bright and sociable", "A quick little herder with upright ears, short legs and an enormous grin.", ["chicken-pieces", "beef-strips"]),
  "pet-border-collie": companion("pet-border-collie", "pet-dog-border-collie", "Scout", "Border Collie", "dog", "🐕", 480, "Focused and energetic", "A clever companion who watches movement closely and thrives on busy days.", ["prepared-meat", "beef-strips"]),
  "pet-husky": companion("pet-husky", "pet-dog-husky", "Nova", "Husky", "dog", "🐕", 520, "Expressive and adventurous", "A silver-coated husky with a curled tail and enough stories for the whole meadow.", ["fresh-sardines", "chicken-pieces"]),
  "pet-chinchilla": companion("pet-chinchilla", "pet-chinchilla", "Dusty", "Chinchilla", "exotic", "🐭", 560, "Gentle and observant", "A soft, quiet companion who prefers calm introductions and cool shady places.", ["fresh-greens", "orchard-apple"]),
  "pet-meerkat": companion("pet-meerkat", "pet-meerkat", "Tango", "Meerkat", "exotic", "🦦", 620, "Alert and endlessly curious", "A vigilant little lookout who checks every new sound before relaxing.", ["mealworms", "wild-berries"]),
  "pet-fennec": companion("pet-fennec", "pet-fennec", "Sahara", "Fennec Fox", "exotic", "🦊", 680, "Quick, shy and playful", "A light-footed desert fox whose huge ears turn toward every rustle.", ["prepared-meat", "wild-berries"]),
  "pet-macaw": companion("pet-macaw", "pet-macaw", "Rio", "Blue-and-gold Macaw", "exotic", "🦜", 720, "Clever, colourful and talkative", "A bright macaw who learns routines quickly and makes South Meadow sound lively.", ["sunflower-seeds", "wild-berries"]),
  "pet-baby-triceratops": companion("pet-baby-triceratops", "pet-baby-triceratops", "Sprout", "Baby Triceratops", "featured", "🥚", 1200, "Ancient, sturdy and surprisingly cuddly", "A patterned mystery egg that hatches after Willowmere reaches three restoration milestones.", ["fresh-greens", "orchard-apple", "allotment-carrot"], PAWS_WONDERS_DINO_REQUIRED_MILESTONES),
});

export const PAWS_WONDERS_ITEM_IDS = Object.freeze(Object.keys(PAWS_WONDERS_CATALOG));

export const PAWS_WONDERS_FIXTURES = Object.freeze({
  dogs: Object.freeze({ x: 4, y: 14, width: 92, height: 29, label: "DOG LOUNGES" }),
  exotics: Object.freeze({ x: 5, y: 49, width: 59, height: 29, label: "SPECIALIST HABITATS" }),
  featured: Object.freeze({ x: 67, y: 49, width: 27, height: 29, label: "MYSTERY NEST" }),
  counter: Object.freeze({ x: 69, y: 80, width: 26, height: 13, label: "EVIE'S DESK" }),
});

const display = (id, x, y, width, height, fixture) => Object.freeze({ id, x, y, width, height, fixture, displayKind: "pet" });
export const PAWS_WONDERS_DISPLAYS = Object.freeze([
  display("pet-labrador", 9, 18, 18, 10, "dogs"), display("pet-spaniel", 32, 18, 18, 10, "dogs"), display("pet-dachshund", 55, 18, 18, 10, "dogs"),
  display("pet-corgi", 18, 31, 18, 10, "dogs"), display("pet-border-collie", 41, 31, 18, 10, "dogs"), display("pet-husky", 64, 31, 18, 10, "dogs"),
  display("pet-chinchilla", 9, 55, 17, 10, "exotics"), display("pet-meerkat", 39, 55, 17, 10, "exotics"),
  display("pet-fennec", 9, 67, 17, 10, "exotics"), display("pet-macaw", 39, 67, 17, 10, "exotics"),
  display("pet-baby-triceratops", 71, 57, 18, 17, "featured"),
]);

export const PAWS_WONDERS_INTERIOR = Object.freeze({
  id: PAWS_WONDERS.id,
  sign: "PAWS & WONDERS",
  subtitle: "Walk to a habitat or tap an animal — adoption details appear on the right",
  room: Object.freeze({ x: 50, y: 78, width: 825, height: 570 }),
  spawn: Object.freeze({ x: 610, y: 610, facing: "up" }),
  exit: Object.freeze({ x: 610, y: 638, radius: 58 }),
  fixtures: PAWS_WONDERS_FIXTURES,
  displays: PAWS_WONDERS_DISPLAYS,
  npcs: Object.freeze([
    Object.freeze({ name: "Evie", role: "Pet shop keeper", x: 83, y: 86, icon: "🧑🏻‍🌾" }),
    Object.freeze({ name: "Noah", role: "Visitor", x: 61, y: 86, icon: "🧑🏼" }),
  ]),
});

export function pawsPercentRect(rect, room = PAWS_WONDERS_INTERIOR.room) {
  return { x: room.x + room.width * rect.x / 100, y: room.y + room.height * rect.y / 100, width: room.width * rect.width / 100, height: room.height * rect.height / 100 };
}

export function restorationMilestoneCount(state) {
  return RESTORATION_MILESTONE_ORDER.filter((id) => Boolean(state?.restorationMilestones?.unlocked?.[id])).length;
}

export function validatePawsWonders() {
  const errors = [];
  const items = Object.values(PAWS_WONDERS_CATALOG);
  const dogs = items.filter((item) => item.category === "dog");
  const exotics = items.filter((item) => item.category === "exotic");
  const featured = items.filter((item) => item.category === "featured");
  if (items.length !== 11 || new Set(items.map((item) => item.id)).size !== 11) errors.push("Paws & Wonders must have eleven unique companions.");
  if (dogs.length !== 6 || new Set(dogs.map((item) => item.breed)).size !== 6) errors.push("Paws & Wonders must have six distinct dog breeds.");
  if (exotics.length !== 4) errors.push("Paws & Wonders must have four unusual companions.");
  if (featured.length !== 1 || featured[0].animalId !== "pet-baby-triceratops" || featured[0].milestonesRequired !== 3) errors.push("The three-milestone Baby Triceratops egg is missing.");
  if (SHOP_PET_DEFINITIONS.length !== items.length) errors.push("Permanent pet identities and catalogue stock differ.");
  for (const item of items) {
    const animal = ANIMAL_BY_ID[item.animalId];
    const entry = PAWS_WONDERS_DISPLAYS.find((candidate) => candidate.id === item.id);
    const fixture = PAWS_WONDERS_FIXTURES[entry?.fixture];
    if (!animal?.shopPet || animal.petShopSku !== item.id) errors.push(`${item.id} has no matching permanent animal identity.`);
    if (!Number.isSafeInteger(item.price) || item.price < 1) errors.push(`${item.id} has an invalid price.`);
    if (!item.foodIds.every((foodId) => ITEM_CATALOG[foodId] && ANIMAL_SPECIES[animal?.species]?.accepted.includes(foodId))) errors.push(`${item.id} has invalid care foods.`);
    if (!entry || !fixture || entry.x < fixture.x || entry.y < fixture.y || entry.x + entry.width > fixture.x + fixture.width || entry.y + entry.height > fixture.y + fixture.height) errors.push(`${item.id} leaves its physical enclosure.`);
  }
  const shop = SHOPS.find((entry) => entry.title === PAWS_WONDERS.name);
  const node = NPC_NAVIGATION_NODES.find((entry) => entry.id === PAWS_WONDERS.legacyNodeId);
  const evie = NPC_RESIDENTS.find((entry) => entry.name === "Evie");
  if (!shop || shop.x !== 3345 || shop.y !== 905) errors.push("The original shop-11 map location changed.");
  if (node?.label !== PAWS_WONDERS.name || evie?.role !== "Pet shop keeper" || evie?.workNodeId !== PAWS_WONDERS.legacyNodeId) errors.push("Paws & Wonders navigation or Evie's assignment changed.");
  return { ok: errors.length === 0, errors, total: items.length, dogs: dogs.length, exotics: exotics.length, featured: featured.length, topDown: true, physicalEnclosures: true, permanentAdoptions: true, unlimitedCompanions: true };
}
