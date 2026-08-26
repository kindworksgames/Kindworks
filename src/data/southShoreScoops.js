export const SOUTH_SHORE_SCOOPS_STATE_SCHEMA_VERSION = 1;

export const SOUTH_SHORE_SCOOPS_CONFIG = Object.freeze({
  schemaVersion: 3,
  levelCount: 750,
  levelsPerChapter: 10,
  maxCustomers: 3,
  passingAccuracy: 60,
  sequentialService: true,
  maxVisibleQueue: 3,
  maxBuildParts: 9,
});

export const SOUTH_SHORE_SCOOPS_REWARD_CONFIG = Object.freeze({
  minimum: 18,
  maximum: 45,
  accuracyStep: 0.3,
  levelStepEvery: 100,
  levelStepCoins: 3,
  maxLevelBonus: 15,
});

export const SOUTH_SHORE_SCOOPS_RESTORATION_MILESTONES = Object.freeze([10, 35, 75, 120, 200, 300, 425, 550, 650, 750]);

export const SOUTH_SHORE_SCOOPS_PARTS = Object.freeze({
  cone: Object.freeze({ name: "Cone", icon: "🔻", category: "container" }),
  cup: Object.freeze({ name: "Paper cup", icon: "🥣", category: "container" }),
  sundaeCup: Object.freeze({ name: "Sundae glass", icon: "🍨", category: "container" }),
  shavedCup: Object.freeze({ name: "Shaved ice cup", icon: "🥡", category: "container" }),
  drinkCup: Object.freeze({ name: "Drink cup", icon: "🥤", category: "container" }),
  waffle: Object.freeze({ name: "Seaside waffle", icon: "🧇", category: "container" }),
  vanilla: Object.freeze({ name: "Vanilla", icon: "●", category: "flavour", color: "#f6edc9" }),
  strawberry: Object.freeze({ name: "Strawberry", icon: "●", category: "flavour", color: "#ee9aa8" }),
  chocolate: Object.freeze({ name: "Chocolate", icon: "●", category: "flavour", color: "#8c5a43" }),
  mint: Object.freeze({ name: "Mint", icon: "●", category: "flavour", color: "#8bd0a5" }),
  blueberry: Object.freeze({ name: "Blueberry", icon: "●", category: "flavour", color: "#7687c5" }),
  grape: Object.freeze({ name: "Grape", icon: "●", category: "flavour", color: "#aa78bd" }),
  strawberrySauce: Object.freeze({ name: "Strawberry sauce", icon: "🍓", category: "finish" }),
  chocolateSauce: Object.freeze({ name: "Chocolate sauce", icon: "🍫", category: "finish" }),
  caramelSauce: Object.freeze({ name: "Caramel sauce", icon: "🍯", category: "finish" }),
  sprinkles: Object.freeze({ name: "Sprinkles", icon: "✨", category: "finish" }),
  chocBits: Object.freeze({ name: "Chocolate bits", icon: "▪️", category: "finish" }),
  marshmallows: Object.freeze({ name: "Marshmallows", icon: "☁️", category: "finish" }),
  cherry: Object.freeze({ name: "Cherry", icon: "🍒", category: "finish" }),
  shavedIce: Object.freeze({ name: "Shaved ice", icon: "🧊", category: "extra" }),
  fruitSyrup: Object.freeze({ name: "Fruit syrup", icon: "🌈", category: "extra" }),
  lolly: Object.freeze({ name: "Ice lolly", icon: "🍡", category: "extra" }),
  milkshake: Object.freeze({ name: "Blend milkshake", icon: "🥛", category: "extra" }),
  lemonade: Object.freeze({ name: "Lemonade", icon: "🍋", category: "extra" }),
});

export const SOUTH_SHORE_SCOOPS_FLAVOURS = Object.freeze(["vanilla", "strawberry", "chocolate", "mint", "blueberry", "grape"]);
export const SOUTH_SHORE_SCOOPS_SAUCES = Object.freeze(["strawberrySauce", "chocolateSauce", "caramelSauce"]);
export const SOUTH_SHORE_SCOOPS_TOPPINGS = Object.freeze(["sprinkles", "chocBits", "marshmallows", "cherry"]);
export const SOUTH_SHORE_SCOOPS_ALL_FAMILIES = Object.freeze(["singleCone", "doubleCone", "cup", "tripleCone", "sauceCone", "toppedCup", "waffle", "sundae", "marshmallowSundae", "shavedIce", "lolly", "milkshake", "lemonade", "deluxeCone", "loadedCup", "waffleDeluxe", "megaSundae", "festivalSundae", "grandFinale"]);
export const SOUTH_SHORE_SCOOPS_CHAPTER_THEMES = Object.freeze(["Beach Counter Basics", "Waffles & Sundaes", "Frozen Drinks & Treats", "Deluxe Desserts", "Festival Favourites", "Cups & Cones", "Sauce Swirls", "Topping Time", "Seaside Waffles", "Sundae Bar", "Frozen Favourites", "Cool Drinks", "Two-item Trays", "Busy Boardwalk", "Grand Finale"]);
export const SOUTH_SHORE_SCOOPS_THEME_FAMILIES = Object.freeze([
  Object.freeze(["singleCone", "cup", "doubleCone", "tripleCone", "sauceCone", "toppedCup"]),
  Object.freeze(["waffle", "sundae", "marshmallowSundae"]),
  Object.freeze(["shavedIce", "lolly", "milkshake", "lemonade"]),
  Object.freeze(["deluxeCone", "loadedCup", "waffleDeluxe"]),
  Object.freeze(["megaSundae", "festivalSundae", "grandFinale"]),
  Object.freeze(["singleCone", "doubleCone", "cup", "tripleCone"]),
  Object.freeze(["sauceCone", "toppedCup", "deluxeCone"]),
  Object.freeze(["toppedCup", "loadedCup", "festivalSundae"]),
  Object.freeze(["waffle", "waffleDeluxe"]),
  Object.freeze(["sundae", "marshmallowSundae", "megaSundae"]),
  Object.freeze(["shavedIce", "lolly"]),
  Object.freeze(["milkshake", "lemonade"]),
  Object.freeze(["deluxeCone", "loadedCup", "waffleDeluxe"]),
  Object.freeze(["megaSundae", "festivalSundae"]),
  Object.freeze(["megaSundae", "festivalSundae", "grandFinale"]),
]);
export const SOUTH_SHORE_SCOOPS_TOUR_NAMES = Object.freeze(["Boardwalk Beginnings", "Harbour Holidays", "Festival Season", "Sunset Service", "Master Counter"]);
export const SOUTH_SHORE_SCOOPS_CHAPTERS = Object.freeze(Array.from(
  { length: SOUTH_SHORE_SCOOPS_CONFIG.levelCount / SOUTH_SHORE_SCOOPS_CONFIG.levelsPerChapter },
  (_, index) => `${SOUTH_SHORE_SCOOPS_TOUR_NAMES[Math.floor(index / SOUTH_SHORE_SCOOPS_CHAPTER_THEMES.length)]} · ${SOUTH_SHORE_SCOOPS_CHAPTER_THEMES[index % SOUTH_SHORE_SCOOPS_CHAPTER_THEMES.length]}`,
));

export const SOUTH_SHORE_SCOOPS_FAMILY_RANK = Object.freeze({ singleCone: 0, doubleCone: 1, cup: 0, tripleCone: 2, sauceCone: 3, toppedCup: 4, waffle: 4, sundae: 5, marshmallowSundae: 5, shavedIce: 4, lolly: 2, milkshake: 4, lemonade: 3, deluxeCone: 6, loadedCup: 7, waffleDeluxe: 7, megaSundae: 8, festivalSundae: 9, grandFinale: 10 });
export const SOUTH_SHORE_SCOOPS_FAMILY_UNLOCK = Object.freeze({ singleCone: 1, cup: 1, doubleCone: 2, tripleCone: 3, sauceCone: 4, toppedCup: 5, waffle: 7, sundae: 9, marshmallowSundae: 10, milkshake: 11, shavedIce: 12, lolly: 13, lemonade: 14, deluxeCone: 16, loadedCup: 20, waffleDeluxe: 24, megaSundae: 30, festivalSundae: 38, grandFinale: 45 });

function scoopsHash(...values) {
  let hash = 2166136261;
  for (const value of values) {
    const source = String(value);
    for (let index = 0; index < source.length; index += 1) {
      hash ^= source.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    hash ^= hash >>> 13;
    hash = Math.imul(hash, 2246822519);
  }
  return hash >>> 0;
}

const scoopsPick = (list, level, index, salt = 0, variant = 0) => list[scoopsHash(level, index, salt, variant) % list.length];

export function southShoreScoopsUnlockedFamilies(level) {
  return SOUTH_SHORE_SCOOPS_ALL_FAMILIES.filter((family) => level >= (SOUTH_SHORE_SCOOPS_FAMILY_UNLOCK[family] || 1));
}

export function southShoreScoopsComplexityRank(level) {
  const value = Math.max(1, Math.floor(Number(level) || 1));
  return [2, 3, 4, 5, 9, 16, 20, 30, 38, 45].reduce((rank, threshold) => rank + (value >= threshold ? 1 : 0), 0);
}

function familyCandidates(level, themeIndex) {
  const unlocked = southShoreScoopsUnlockedFamilies(level);
  const rank = southShoreScoopsComplexityRank(level);
  const accessible = unlocked.filter((family) => (SOUTH_SHORE_SCOOPS_FAMILY_RANK[family] || 0) <= rank);
  const pool = accessible.length ? accessible : unlocked;
  const themed = (SOUTH_SHORE_SCOOPS_THEME_FAMILIES[themeIndex] || []).filter((family) => pool.includes(family));
  return { themed: themed.length ? themed : pool, advanced: pool };
}

function buildItem(level, orderIndex, itemIndex = 0, variant = 0, forcedFamily = null) {
  const key = orderIndex * 11 + itemIndex;
  const flavours = SOUTH_SHORE_SCOOPS_FLAVOURS.slice(0, level <= 6 ? 4 : level <= 12 ? 5 : 6);
  const usedFlavours = [];
  const usedToppings = [];
  const uniquePick = (list, used, salt) => {
    const available = list.filter((id) => !used.includes(id));
    const value = scoopsPick(available.length ? available : list, level, key, salt, variant);
    used.push(value);
    return value;
  };
  const flavour = (salt) => uniquePick(flavours, usedFlavours, salt);
  const sauce = (salt) => scoopsPick(SOUTH_SHORE_SCOOPS_SAUCES, level, key, salt, variant);
  const topping = (salt) => uniquePick(SOUTH_SHORE_SCOOPS_TOPPINGS, usedToppings, salt);
  const themeIndex = Math.floor((level - 1) / SOUTH_SHORE_SCOOPS_CONFIG.levelsPerChapter) % SOUTH_SHORE_SCOOPS_CHAPTER_THEMES.length;
  const candidates = familyCandidates(level, themeIndex);
  const preferTheme = (orderIndex + itemIndex + variant) % 3 !== 1;
  const availableFamilies = preferTheme ? candidates.themed : candidates.advanced;
  const allFamilies = [...new Set([...candidates.themed, ...candidates.advanced])];
  const family = forcedFamily && allFamilies.includes(forcedFamily) ? forcedFamily : scoopsPick(availableFamilies, level, key, 41, variant);
  if (family === "singleCone") return { family, name: "Single cone", parts: ["cone", flavour(1)] };
  if (family === "doubleCone") return { family, name: "Double cone", parts: ["cone", flavour(1), flavour(2)] };
  if (family === "tripleCone") return { family, name: "Triple cone", parts: ["cone", flavour(1), flavour(2), flavour(3)] };
  if (family === "cup") return { family, name: "Scoop cup", parts: ["cup", flavour(1), flavour(2)] };
  if (family === "sauceCone") return { family, name: "Sauce cone", parts: ["cone", flavour(1), flavour(2), sauce(1)] };
  if (family === "toppedCup") return { family, name: "Topped cup", parts: ["cup", flavour(1), flavour(2), sauce(1), topping(1)] };
  if (family === "sundae") return { family, name: "Sundae", parts: ["sundaeCup", flavour(1), flavour(2), sauce(1), topping(1)] };
  if (family === "marshmallowSundae") return { family, name: "Marshmallow sundae", parts: ["sundaeCup", flavour(1), flavour(2), sauce(1), "marshmallows"] };
  if (family === "shavedIce") return { family, name: "Shaved ice", parts: ["shavedCup", "shavedIce", "fruitSyrup"] };
  if (family === "lolly") return { family, name: "Ice lolly", parts: ["lolly"] };
  if (family === "milkshake") return { family, name: "Milkshake", parts: ["drinkCup", flavour(1), "milkshake"] };
  if (family === "lemonade") return { family, name: "Lemonade", parts: ["drinkCup", "lemonade"] };
  if (family === "deluxeCone") return { family, name: "Deluxe triple cone", parts: ["cone", flavour(1), flavour(2), flavour(3), sauce(1), topping(1)] };
  if (family === "loadedCup") return { family, name: "Loaded scoop cup", parts: ["cup", flavour(1), flavour(2), flavour(3), sauce(1), topping(1), topping(2)] };
  if (family === "waffleDeluxe") return { family, name: "Loaded seaside waffle", parts: ["waffle", flavour(1), flavour(2), sauce(1), topping(1), topping(2)] };
  if (family === "megaSundae") return { family, name: "Mega sundae", parts: ["sundaeCup", flavour(1), flavour(2), flavour(3), sauce(1), uniquePick(SOUTH_SHORE_SCOOPS_TOPPINGS.filter((id) => id !== "cherry"), usedToppings, 1), uniquePick(SOUTH_SHORE_SCOOPS_TOPPINGS.filter((id) => id !== "cherry"), usedToppings, 2), "cherry"] };
  if (family === "festivalSundae") return { family, name: "Festival sundae", parts: ["sundaeCup", flavour(1), flavour(2), flavour(3), sauce(1), "sprinkles", "chocBits", "marshmallows"] };
  if (family === "grandFinale") return { family, name: "Grand finale sundae", parts: ["sundaeCup", flavour(1), flavour(2), flavour(3), sauce(1), "sprinkles", "chocBits", "marshmallows", "cherry"] };
  return { family: "waffle", name: "Seaside waffle", parts: ["waffle", flavour(1), ...(level > 115 ? [flavour(2)] : []), sauce(1)] };
}

export function southShoreScoopsLevelTarget(level) {
  if (level <= 25) return 4;
  if (level <= 75) return 5;
  if (level <= 150) return 6;
  if (level <= 250) return 7;
  if (level <= 375) return 8;
  if (level <= 500) return 9;
  if (level <= 620) return 10;
  if (level <= 700) return 11;
  return 12;
}

export function southShoreScoopsLevelPatience(level) {
  return Math.max(26, 50 - ((Math.max(1, level) - 1) * 24 / 749));
}

export function southShoreScoopsTwoItemQuota(level, target = southShoreScoopsLevelTarget(level)) {
  if (level < 8) return 0;
  const share = Math.min(0.62, 0.18 + (level - 8) / 704);
  return Math.min(target - 1, Math.max(1, Math.floor(target * share)));
}

export const SOUTH_SHORE_SCOOPS_CUSTOMER_NAMES = Object.freeze(["Mia", "Leo", "Poppy", "Noah", "Ruby", "Finn", "Ava", "Kai", "Nell", "Otis", "Ivy", "Max", "Millie", "George", "Willow", "Hazel", "Theo", "Luna", "Archie", "Freya", "Jude", "Esme", "Rowan", "Ada", "Robin", "Sunny", "Pip", "Mabel", "Hugo", "Cleo", "Kit", "Olive", "Sophie", "Ben", "Mae", "Oscar", "Nina", "Eli", "Zara", "Sam", "Tilly", "Louie", "Amara", "Felix", "Evie", "Jamie", "Cora", "Toby"]);

function customerProfile(level, index, variant = 0) {
  const start = scoopsHash(level, variant, 811) % SOUTH_SHORE_SCOOPS_CUSTOMER_NAMES.length;
  const profileIndex = (start + index * 11) % SOUTH_SHORE_SCOOPS_CUSTOMER_NAMES.length;
  return { customerName: SOUTH_SHORE_SCOOPS_CUSTOMER_NAMES[profileIndex], avatar: profileIndex };
}

function levelOrders(level, variant = 0) {
  const target = southShoreScoopsLevelTarget(level);
  const quota = southShoreScoopsTwoItemQuota(level, target);
  const themeIndex = Math.floor((level - 1) / SOUTH_SHORE_SCOOPS_CONFIG.levelsPerChapter) % SOUTH_SHORE_SCOOPS_CHAPTER_THEMES.length;
  const candidates = familyCandidates(level, themeIndex);
  const familyPool = [...new Set([...candidates.themed, ...candidates.advanced])];
  const firstFamily = scoopsPick(familyPool, level, variant, 701);
  const secondPool = familyPool.filter((family) => family !== firstFamily);
  const secondFamily = secondPool.length ? scoopsPick(secondPool, level, variant, 709) : firstFamily;
  const seenOrders = new Set();
  return Array.from({ length: target }, (_, index) => {
    const twoItems = quota > 0 && ((index + ((level + variant) % target)) % target) < quota;
    const forcedFamily = index === 0 ? firstFamily : index === 1 ? secondFamily : null;
    let items;
    let signature;
    let attempt = 0;
    do {
      const itemVariant = variant + attempt * 97;
      items = Array.from({ length: twoItems ? 2 : 1 }, (__, itemIndex) => buildItem(level, index, itemIndex, itemVariant, itemIndex === 0 ? forcedFamily : null));
      signature = items.map((item) => item.parts.join(">")).join("+");
      attempt += 1;
    } while (seenOrders.has(signature) && attempt < 256);
    seenOrders.add(signature);
    return { id: `scoops-${level}-${index + 1}`, number: index + 1, ...customerProfile(level, index, variant), items };
  });
}

function levelDifficulty(level) {
  const target = southShoreScoopsLevelTarget(level);
  const patience = southShoreScoopsLevelPatience(level);
  return { score: level, recipeRank: southShoreScoopsComplexityRank(level), target, patience: Number(patience.toFixed(2)), twoItemQuota: southShoreScoopsTwoItemQuota(level, target), sequential: true };
}

function buildLevels() {
  const plans = new Set();
  const levels = [];
  for (let index = 0; index < SOUTH_SHORE_SCOOPS_CONFIG.levelCount; index += 1) {
    const level = index + 1;
    const chapter = Math.floor(index / SOUTH_SHORE_SCOOPS_CONFIG.levelsPerChapter) + 1;
    const target = southShoreScoopsLevelTarget(level);
    const patience = southShoreScoopsLevelPatience(level);
    let variant = 0;
    let orders;
    let signature;
    do {
      orders = levelOrders(level, variant);
      variant += 1;
      signature = orders.map((order) => order.items.map((item) => item.parts.join(">")).join("+")).join("|");
    } while (plans.has(signature) && variant < 10000);
    if (plans.has(signature)) throw new Error(`Unable to create a unique South Shore Scoops plan for level ${level}`);
    plans.add(signature);
    levels.push(Object.freeze({
      level,
      chapter,
      name: `${SOUTH_SHORE_SCOOPS_CHAPTERS[chapter - 1]} ${String(index % SOUTH_SHORE_SCOOPS_CONFIG.levelsPerChapter + 1).padStart(2, "0")}`,
      queueCap: 1,
      target,
      patience,
      difficulty: Object.freeze(levelDifficulty(level)),
      orders: Object.freeze(orders.map((order) => Object.freeze({ ...order, items: Object.freeze(order.items.map((item) => Object.freeze({ ...item, parts: Object.freeze(item.parts) }))) }))),
    }));
  }
  return Object.freeze(levels);
}

export const SOUTH_SHORE_SCOOPS_LEVELS = buildLevels();

export function southShoreScoopsPart(id) {
  const part = SOUTH_SHORE_SCOOPS_PARTS[id];
  return part ? { id, ...part } : null;
}

export function southShoreScoopsLevel(number) {
  const level = Math.max(1, Math.min(SOUTH_SHORE_SCOOPS_CONFIG.levelCount, Math.floor(Number(number) || 1)));
  return SOUTH_SHORE_SCOOPS_LEVELS[level - 1];
}

export function southShoreScoopsAvailableParts(level) {
  return [...new Set(southShoreScoopsLevel(level).orders.flatMap((order) => order.items).flatMap((item) => item.parts))];
}

export const SOUTH_SHORE_SCOOPS_PART_UNLOCKS = Object.freeze(Object.keys(SOUTH_SHORE_SCOOPS_PARTS).reduce((unlocks, id) => {
  const index = SOUTH_SHORE_SCOOPS_LEVELS.findIndex((level) => level.orders.some((order) => order.items.some((item) => item.parts.includes(id))));
  unlocks[id] = index + 1;
  return unlocks;
}, {}));

export function southShoreScoopsItemText(item) {
  return `${item.name}: ${item.parts.map((id) => SOUTH_SHORE_SCOOPS_PARTS[id]?.name || id).join(", ")}`;
}

export function southShoreScoopsOrderText(order) {
  return `${order.customerName}'s order: ${order.items.map(southShoreScoopsItemText).join("; then ")}`;
}

export function southShoreScoopsFirstClearCoins(accuracy, level) {
  const value = Math.max(0, Math.min(100, Number(accuracy) || 0));
  if (value < SOUTH_SHORE_SCOOPS_CONFIG.passingAccuracy) return 0;
  const base = SOUTH_SHORE_SCOOPS_REWARD_CONFIG.minimum + Math.round((value - SOUTH_SHORE_SCOOPS_CONFIG.passingAccuracy) * SOUTH_SHORE_SCOOPS_REWARD_CONFIG.accuracyStep);
  const levelBonus = Math.min(SOUTH_SHORE_SCOOPS_REWARD_CONFIG.maxLevelBonus, Math.floor((Math.max(1, Number(level) || 1) - 1) / SOUTH_SHORE_SCOOPS_REWARD_CONFIG.levelStepEvery) * SOUTH_SHORE_SCOOPS_REWARD_CONFIG.levelStepCoins);
  return Math.min(SOUTH_SHORE_SCOOPS_REWARD_CONFIG.maximum, base + levelBonus);
}

export function southShoreScoopsResult(session) {
  const attempts = Math.max(1, session.served + session.missed + session.mistakes);
  const accuracy = Math.max(0, Math.min(100, Math.round(session.served / attempts * 100)));
  const happiness = Math.max(0, Math.min(100, Math.round(session.happiness.length ? session.happiness.reduce((sum, value) => sum + value, 0) / session.happiness.length : accuracy)));
  const won = accuracy >= SOUTH_SHORE_SCOOPS_CONFIG.passingAccuracy && session.served >= Math.ceil(session.level.target * 0.6);
  const stars = !won ? 0 : accuracy >= 95 && session.waste === 0 ? 3 : accuracy >= 78 ? 2 : 1;
  return { won, accuracy, happiness, stars, served: session.served, missed: session.missed, waste: session.waste, score: session.score };
}
