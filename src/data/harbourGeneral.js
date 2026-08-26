export const HARBOUR_GENERAL = Object.freeze({
  id: "harbour-general",
  legacyShopId: "shop-07",
  legacyNodeId: "biz_takeaway",
  name: "Harbour General",
  icon: "🏪",
  deedPrice: 5000,
  open: 7,
  close: 21,
  door: Object.freeze({ x: 3770, y: 895 }),
  approach: Object.freeze({ x: 3770, y: 930 }),
  interactionRadius: 96,
});

export const HARBOUR_GENERAL_CONFIG = Object.freeze({
  schemaVersion: 1,
  slotCount: 6,
  caseSize: 4,
  maxPerItem: 24,
  historyLimit: 8,
  browseChance: 0.12,
  shoppingNeedThreshold: 50,
  purchaseCooldownGameMinutes: 60,
});

const products = [
  ["umbrella", "Umbrella", "☂️", "weather", 120, 190, 0.55, { rain: 6, windy: 1.25 }, "umbrella", "A sturdy harbour umbrella for rainy walks."],
  ["raincoat", "Raincoat", "🧥", "weather", 170, 275, 0.4, { rain: 4.5, windy: 1.4 }, "raincoat", "A bright waterproof coat for wet village days."],
  ["winter-jacket", "Winter jacket", "🥼", "weather", 240, 390, 0.3, { snow: 6, windy: 1.5 }, "winterJacket", "A warm jacket made for snow and cold wind."],
  ["gloves", "Warm gloves", "🧤", "weather", 55, 95, 0.45, { snow: 5, windy: 1.8 }, "gloves", "Cosy gloves for frosty mornings."],
  ["scarf", "Wool scarf", "🧣", "weather", 60, 105, 0.5, { snow: 4.5, windy: 3 }, "scarf", "A soft scarf that is useful in snow or strong wind."],
  ["wool-hat", "Wool hat", "🧢", "weather", 65, 110, 0.4, { snow: 4, windy: 2 }, "woolHat", "A snug hat for cold harbour weather."],
  ["bottled-water", "Reusable bottle", "💧", "everyday", 28, 55, 1.45, { clear: 2.1, windy: 1.1 }, null, "A reusable water bottle for villagers on the go."],
  ["snack-bar", "Snack bar", "🍫", "everyday", 20, 40, 1.35, { clear: 1.25, snow: 1.2 }, null, "A quick snack for work, walks and the train."],
  ["tissues", "Tissues", "🧻", "everyday", 16, 32, 1.1, { rain: 1.8, snow: 1.7 }, null, "A useful pocket pack for every season."],
  ["batteries", "Batteries", "🔋", "everyday", 45, 80, 0.8, { windy: 2.2, rain: 1.3 }, null, "Useful backup power for lamps and radios."],
  ["newspaper", "Newspaper", "📰", "everyday", 12, 25, 1.05, { clear: 1.1 }, null, "The latest village notices and local stories."],
  ["sunscreen", "Sunscreen", "🧴", "everyday", 60, 110, 0.55, { clear: 4 }, null, "Sun protection for bright days by the water."],
  ["rain-boots", "Rain boots", "🥾", "weather", 95, 160, 0.45, { rain: 4.2, snow: 1.3 }, null, "Waterproof boots for wet harbour paths."],
  ["torch", "Torch", "🔦", "everyday", 50, 90, 0.75, { windy: 2.1, rain: 1.35 }, null, "A dependable torch for dark evenings and power cuts."],
  ["postcards", "Postcards", "💌", "everyday", 12, 30, 1.05, { clear: 1.35 }, null, "Illustrated harbour postcards for visitors and villagers."],
  ["small-toy", "Small toy", "🧸", "everyday", 45, 85, 0.8, { clear: 1.15, rain: 1.1 }, null, "A cheerful pocket-sized souvenir toy."],
  ["beach-towel", "Beach towel", "🏖️", "everyday", 75, 135, 0.65, { clear: 3.4 }, null, "A bright striped towel for sunny beach days."],
];

export const HARBOUR_GENERAL_CATALOG = Object.freeze(Object.fromEntries(products.map(([id, name, icon, category, wholesale, price, baseDemand, weather, wardrobe, description]) => [id, Object.freeze({ id, name, icon, category, wholesale, price, baseDemand, weather: Object.freeze(weather), wardrobe, description })])));
export const HARBOUR_GENERAL_ITEM_IDS = Object.freeze(products.map(([id]) => id));
export const HARBOUR_GENERAL_STARTER_SLOTS = Object.freeze(["umbrella", "raincoat", "scarf", "bottled-water", "tissues", "newspaper"]);
export const HARBOUR_GENERAL_WARDROBE_KEYS = Object.freeze(["umbrella", "raincoat", "winterJacket", "gloves", "scarf", "woolHat"]);

function stableUnit(label) {
  let hash = 2166136261;
  for (const character of String(label)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967296;
}

export function createInitialHarbourWardrobe(residentId) {
  return {
    umbrella: stableUnit(`wardrobe-${residentId}-umbrella`) < 0.18,
    raincoat: stableUnit(`wardrobe-${residentId}-raincoat`) < 0.12,
    winterJacket: stableUnit(`wardrobe-${residentId}-jacket`) < 0.1,
    gloves: stableUnit(`wardrobe-${residentId}-gloves`) < 0.1,
    scarf: stableUnit(`wardrobe-${residentId}-scarf`) < 0.12,
    woolHat: stableUnit(`wardrobe-${residentId}-hat`) < 0.1,
  };
}

export const HARBOUR_GENERAL_INTERIOR = Object.freeze({
  room: Object.freeze({ x: 46, y: 82, width: 1188, height: 600 }),
  spawn: Object.freeze({ x: 640, y: 635, facing: "up" }),
  exit: Object.freeze({ x: 640, y: 665, radius: 64 }),
  counter: Object.freeze({ x: 932, y: 510, width: 238, height: 92, label: "AMELIA · COUNTER" }),
  fixtures: Object.freeze([
    Object.freeze({ id: "weather", x: 90, y: 150, width: 360, height: 350, label: "WEATHER READY" }),
    Object.freeze({ id: "everyday", x: 505, y: 150, width: 360, height: 350, label: "EVERYDAY ESSENTIALS" }),
  ]),
  slots: Object.freeze([
    Object.freeze({ slot: 0, fixture: "weather", x: 118, y: 210, width: 304, height: 74 }),
    Object.freeze({ slot: 1, fixture: "weather", x: 118, y: 310, width: 304, height: 74 }),
    Object.freeze({ slot: 2, fixture: "weather", x: 118, y: 410, width: 304, height: 74 }),
    Object.freeze({ slot: 3, fixture: "everyday", x: 533, y: 210, width: 304, height: 74 }),
    Object.freeze({ slot: 4, fixture: "everyday", x: 533, y: 310, width: 304, height: 74 }),
    Object.freeze({ slot: 5, fixture: "everyday", x: 533, y: 410, width: 304, height: 74 }),
  ]),
});

export function harbourDemand(itemOrId, weatherKind = "clear") {
  const item = typeof itemOrId === "string" ? HARBOUR_GENERAL_CATALOG[itemOrId] : itemOrId;
  return item ? Math.max(0.05, item.baseDemand * (item.weather[weatherKind] || 1)) : 0;
}

export function validateHarbourGeneralCatalogue() {
  const items = Object.values(HARBOUR_GENERAL_CATALOG);
  const errors = [];
  if (items.length !== 17) errors.push("Harbour General must contain exactly 17 products.");
  if (HARBOUR_GENERAL_INTERIOR.slots.length !== HARBOUR_GENERAL_CONFIG.slotCount) errors.push("Harbour General must contain exactly six display slots.");
  if (items.some((item) => !Number.isInteger(item.wholesale) || !Number.isInteger(item.price) || item.wholesale <= 0 || item.price <= item.wholesale)) errors.push("Every Harbour General product must have a positive wholesale margin.");
  if (items.filter((item) => item.wardrobe).length !== 6) errors.push("The six persistent weather-wardrobe products are incomplete.");
  if (items.some((item) => /fish|produce|apple|carrot|berry|greens/i.test(`${item.id} ${item.name}`))) errors.push("Specialist fish or produce stock leaked into Harbour General.");
  if (new Set(HARBOUR_GENERAL_STARTER_SLOTS).size !== HARBOUR_GENERAL_CONFIG.slotCount || HARBOUR_GENERAL_STARTER_SLOTS.some((id) => !HARBOUR_GENERAL_CATALOG[id])) errors.push("Starter displays are invalid.");
  return { ok: errors.length === 0, errors, products: items.length, weather: items.filter((item) => item.category === "weather").length, everyday: items.filter((item) => item.category === "everyday").length, slots: HARBOUR_GENERAL_CONFIG.slotCount };
}
