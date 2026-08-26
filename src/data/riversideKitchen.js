// Exact Riverside Kitchen catalogue and deterministic campaign extracted from the protected HTML reference.
export const RIVERSIDE_KITCHEN_STATE_SCHEMA_VERSION = 1;

export const RIVERSIDE_KITCHEN_CONFIG = Object.freeze({
  levelCount: 150,
  trayCount: 3,
  maxCustomers: 3,
  graceSeconds: 3,
  firstClearBaseCoins: 35,
  firstClearLevelCoins: 1,
  starCoins: 15,
  firstClearMaxCoins: 170,
});

export const RIVERSIDE_KITCHEN_INGREDIENTS = Object.freeze({
  plate: Object.freeze({ name: "Dinner plate", icon: "🍽️" }),
  bowl: Object.freeze({ name: "Soup bowl", icon: "🥣" }),
  bunBottom: Object.freeze({ name: "Bottom bun", icon: "🍞" }),
  bunTop: Object.freeze({ name: "Top bun", icon: "🍞" }),
  beefPatty: Object.freeze({ name: "Beef patty", icon: "🥩" }),
  cheese: Object.freeze({ name: "Cheese", icon: "🧀" }),
  lettuce: Object.freeze({ name: "Lettuce", icon: "🥬" }),
  tomato: Object.freeze({ name: "Tomato", icon: "🍅" }),
  onion: Object.freeze({ name: "Onion", icon: "🧅" }),
  pickle: Object.freeze({ name: "Pickles", icon: "🥒" }),
  ketchup: Object.freeze({ name: "Ketchup", icon: "🥫" }),
  spaghetti: Object.freeze({ name: "Spaghetti", icon: "🍝" }),
  tomatoSauce: Object.freeze({ name: "Tomato sauce", icon: "🍅" }),
  meatballs: Object.freeze({ name: "Meatballs", icon: "🧆" }),
  parmesan: Object.freeze({ name: "Parmesan", icon: "🧀" }),
  saladLeaves: Object.freeze({ name: "Salad leaves", icon: "🥗" }),
  cucumber: Object.freeze({ name: "Cucumber", icon: "🥒" }),
  carrot: Object.freeze({ name: "Carrot", icon: "🥕" }),
  dressing: Object.freeze({ name: "Salad dressing", icon: "🫗" }),
  croutons: Object.freeze({ name: "Croutons", icon: "🍞" }),
  stock: Object.freeze({ name: "Soup stock", icon: "🍲" }),
  soupVegetables: Object.freeze({ name: "Soup vegetables", icon: "🥕" }),
  cream: Object.freeze({ name: "Cream", icon: "🥛" }),
  fishFillet: Object.freeze({ name: "Fish fillet", icon: "🐟" }),
  lemon: Object.freeze({ name: "Lemon", icon: "🍋" }),
  butter: Object.freeze({ name: "Butter", icon: "🧈" }),
  steak: Object.freeze({ name: "Steak", icon: "🥩" }),
  potatoes: Object.freeze({ name: "Potatoes", icon: "🥔" }),
  greenVegetables: Object.freeze({ name: "Green vegetables", icon: "🥦" }),
  roastChicken: Object.freeze({ name: "Roast chicken", icon: "🍗" }),
  peas: Object.freeze({ name: "Peas", icon: "🟢" }),
  gravy: Object.freeze({ name: "Gravy", icon: "🫕" }),
  seasoning: Object.freeze({ name: "Seasoning", icon: "🧂" }),
  bacon: Object.freeze({ name: "Bacon", icon: "🥓" }),
  bbqSauce: Object.freeze({ name: "BBQ sauce", icon: "🥫" }),
  mushrooms: Object.freeze({ name: "Mushrooms", icon: "🍄" }),
  friedEgg: Object.freeze({ name: "Egg", icon: "🥚" }),
  jalapeno: Object.freeze({ name: "Jalapeño", icon: "🌶️" }),
  garlic: Object.freeze({ name: "Garlic", icon: "🧄" }),
  herbs: Object.freeze({ name: "Fresh herbs", icon: "🌿" }),
  chilli: Object.freeze({ name: "Chilli", icon: "🌶️" }),
  pesto: Object.freeze({ name: "Pesto", icon: "🌿" }),
  olives: Object.freeze({ name: "Olives", icon: "🫒" }),
  feta: Object.freeze({ name: "Feta", icon: "🧀" }),
  chickenBreast: Object.freeze({ name: "Chicken breast", icon: "🍗" }),
  caesarDressing: Object.freeze({ name: "Caesar dressing", icon: "🫗" }),
  tomatoSoupBase: Object.freeze({ name: "Tomato soup base", icon: "🍅" }),
  mushroomSoupBase: Object.freeze({ name: "Mushroom soup base", icon: "🍄" }),
  pumpkinSoupBase: Object.freeze({ name: "Pumpkin soup base", icon: "🎃" }),
  dill: Object.freeze({ name: "Dill", icon: "🌿" }),
  breadcrumbs: Object.freeze({ name: "Breadcrumbs", icon: "🍞" }),
  peppercornSauce: Object.freeze({ name: "Peppercorn sauce", icon: "🫕" }),
  redWineSauce: Object.freeze({ name: "Red wine sauce", icon: "🍷" }),
  roastBeef: Object.freeze({ name: "Roast beef", icon: "🥩" }),
  yorkshirePudding: Object.freeze({ name: "Yorkshire pudding", icon: "🥮" }),
  stuffing: Object.freeze({ name: "Stuffing", icon: "🍞" }),
  cranberrySauce: Object.freeze({ name: "Cranberry sauce", icon: "🔴" }),
  cauliflower: Object.freeze({ name: "Cauliflower", icon: "🥦" }),
});

export const RIVERSIDE_KITCHEN_APPLIANCES = Object.freeze({
  prepBoard: Object.freeze({ name: "Preparation board", icon: "🔪", seconds: 1.8, burnWindow: 20 }),
  panLow: Object.freeze({ name: "Frying pan · LOW", icon: "🍳¹", seconds: 2.4, burnWindow: 10 }),
  panMedium: Object.freeze({ name: "Frying pan · MEDIUM", icon: "🍳²", seconds: 2.8, burnWindow: 8 }),
  panHigh: Object.freeze({ name: "Frying pan · HIGH", icon: "🍳³", seconds: 2.5, burnWindow: 6 }),
  potSimmer: Object.freeze({ name: "Stock pot · SIMMER", icon: "🥘¹", seconds: 3, burnWindow: 10 }),
  potBoil: Object.freeze({ name: "Stock pot · BOIL", icon: "🥘³", seconds: 2.8, burnWindow: 7 }),
  grillMedium: Object.freeze({ name: "Grill · MEDIUM", icon: "♨️²", seconds: 3, burnWindow: 8 }),
  grillHigh: Object.freeze({ name: "Grill · HIGH", icon: "♨️³", seconds: 2.7, burnWindow: 6 }),
  ovenRoast: Object.freeze({ name: "Oven · ROAST", icon: "🔥", seconds: 3.3, burnWindow: 9 }),
});

const meal = (name, icon, steps) => Object.freeze({ name, icon, steps: Object.freeze(steps) });

export const RIVERSIDE_KITCHEN_RECIPES = Object.freeze({
  burger: meal("Burger", "🍔", ["plate", "bunBottom", "beefPatty", "panMedium", "lettuce", "tomato", "ketchup", "bunTop"]),
  cheeseburger: meal("Cheeseburger", "🍔🧀", ["plate", "bunBottom", "beefPatty", "panMedium", "cheese", "lettuce", "tomato", "pickle", "ketchup", "bunTop"]),
  spaghettiMeatballs: meal("Spaghetti and meatballs", "🍝", ["plate", "spaghetti", "potBoil", "tomatoSauce", "potSimmer", "meatballs", "panMedium", "parmesan"]),
  salad: meal("Garden salad", "🥗", ["bowl", "saladLeaves", "cucumber", "prepBoard", "tomato", "carrot", "dressing", "croutons"]),
  soup: meal("Vegetable soup", "🍲", ["bowl", "onion", "panLow", "stock", "soupVegetables", "prepBoard", "potSimmer", "cream", "seasoning"]),
  grilledFish: meal("Grilled fish", "🐟🍋", ["plate", "fishFillet", "seasoning", "grillMedium", "lemon", "butter", "saladLeaves"]),
  steakVegetables: meal("Steak and vegetables", "🥩🥦", ["plate", "steak", "seasoning", "grillHigh", "potatoes", "potBoil", "greenVegetables", "panHigh", "butter"]),
  roastDinner: meal("Roast dinner", "🍗🥔", ["plate", "roastChicken", "seasoning", "ovenRoast", "potatoes", "ovenRoast", "carrot", "peas", "potBoil", "gravy", "potSimmer"]),
  baconBurger: meal("Bacon burger", "🍔🥓", ["plate", "bunBottom", "beefPatty", "panMedium", "bacon", "panHigh", "lettuce", "tomato", "bbqSauce", "bunTop"]),
  bbqOnionBurger: meal("BBQ onion burger", "🍔🧅", ["plate", "bunBottom", "onion", "panLow", "beefPatty", "panMedium", "lettuce", "bbqSauce", "bunTop"]),
  mushroomBurger: meal("Mushroom and egg burger", "🍔🍄", ["plate", "bunBottom", "mushrooms", "panLow", "beefPatty", "panMedium", "friedEgg", "panHigh", "cheese", "lettuce", "bunTop"]),
  doubleCheeseburger: meal("Double cheeseburger", "🍔🍔", ["plate", "bunBottom", "beefPatty", "panMedium", "cheese", "beefPatty", "panMedium", "cheese", "pickle", "ketchup", "bunTop"]),
  baconCheeseburger: meal("Bacon cheeseburger", "🍔🥓", ["plate", "bunBottom", "beefPatty", "panMedium", "cheese", "bacon", "panHigh", "lettuce", "tomato", "ketchup", "bunTop"]),
  spicyCheeseburger: meal("Spicy cheeseburger", "🍔🌶️", ["plate", "bunBottom", "beefPatty", "panHigh", "cheese", "jalapeno", "onion", "ketchup", "bunTop"]),
  garlicSpaghetti: meal("Garlic pesto spaghetti", "🍝🧄", ["plate", "spaghetti", "potBoil", "garlic", "panLow", "pesto", "tomatoSauce", "potSimmer", "meatballs", "panMedium", "parmesan"]),
  spicyMeatballs: meal("Spicy spaghetti and meatballs", "🍝🌶️", ["plate", "spaghetti", "potBoil", "tomatoSauce", "chilli", "potSimmer", "meatballs", "panHigh", "parmesan"]),
  creamyMeatballs: meal("Creamy spaghetti and meatballs", "🍝🥛", ["plate", "spaghetti", "potBoil", "tomatoSauce", "cream", "potSimmer", "meatballs", "panMedium", "parmesan"]),
  greekSalad: meal("Greek salad", "🥗🫒", ["bowl", "saladLeaves", "cucumber", "prepBoard", "tomato", "olives", "feta", "dressing"]),
  chickenSalad: meal("Grilled chicken salad", "🥗🍗", ["bowl", "chickenBreast", "seasoning", "grillMedium", "saladLeaves", "cucumber", "tomato", "dressing"]),
  caesarSalad: meal("Caesar salad", "🥗🧀", ["bowl", "saladLeaves", "chickenBreast", "grillHigh", "caesarDressing", "parmesan", "croutons"]),
  tomatoSoup: meal("Tomato soup", "🍅🥣", ["bowl", "onion", "panLow", "tomatoSoupBase", "stock", "potSimmer", "cream", "herbs"]),
  mushroomSoup: meal("Mushroom soup", "🍄🥣", ["bowl", "mushrooms", "butter", "panMedium", "mushroomSoupBase", "stock", "potSimmer", "cream"]),
  pumpkinSoup: meal("Pumpkin soup", "🎃🥣", ["bowl", "pumpkinSoupBase", "stock", "soupVegetables", "prepBoard", "potSimmer", "cream", "seasoning"]),
  herbGrilledFish: meal("Herb grilled fish", "🐟🌿", ["plate", "fishFillet", "herbs", "seasoning", "grillMedium", "lemon", "greenVegetables"]),
  garlicButterFish: meal("Garlic butter fish", "🐟🧄", ["plate", "fishFillet", "garlic", "butter", "grillHigh", "dill", "saladLeaves"]),
  fishPotatoes: meal("Fish and potatoes", "🐟🥔", ["plate", "fishFillet", "breadcrumbs", "grillMedium", "potatoes", "potBoil", "butter", "peas"]),
  peppercornSteak: meal("Peppercorn steak", "🥩🫕", ["plate", "steak", "seasoning", "grillHigh", "peppercornSauce", "potSimmer", "potatoes", "potBoil", "greenVegetables"]),
  mushroomSteak: meal("Mushroom steak", "🥩🍄", ["plate", "steak", "grillMedium", "mushrooms", "butter", "panHigh", "potatoes", "potBoil", "greenVegetables"]),
  redWineSteak: meal("Red wine steak", "🥩🍷", ["plate", "steak", "seasoning", "grillHigh", "redWineSauce", "potSimmer", "potatoes", "ovenRoast", "greenVegetables"]),
  herbRoastDinner: meal("Herb chicken roast", "🍗🌿", ["plate", "roastChicken", "herbs", "stuffing", "ovenRoast", "potatoes", "ovenRoast", "carrot", "peas", "potBoil", "gravy", "potSimmer", "cranberrySauce"]),
  beefRoastDinner: meal("Roast beef dinner", "🥩🥔", ["plate", "roastBeef", "seasoning", "ovenRoast", "potatoes", "ovenRoast", "yorkshirePudding", "carrot", "peas", "potBoil", "gravy", "potSimmer"]),
  vegetableRoast: meal("Vegetable roast dinner", "🥦🥔", ["plate", "cauliflower", "greenVegetables", "seasoning", "ovenRoast", "potatoes", "ovenRoast", "peas", "potBoil", "gravy", "potSimmer"]),
});

export const RIVERSIDE_KITCHEN_CHAPTERS = Object.freeze([
  { name: "Lunch Service", recipes: ["burger", "cheeseburger", "salad", "soup", "spaghettiMeatballs"] },
  { name: "Full Dinner Service", recipes: ["burger", "cheeseburger", "spaghettiMeatballs", "salad", "soup", "grilledFish", "steakVegetables", "roastDinner"] },
  { name: "Burger Bar", recipes: ["burger", "baconBurger", "bbqOnionBurger", "mushroomBurger", "salad", "soup"] },
  { name: "Cheeseburger Grill", recipes: ["cheeseburger", "doubleCheeseburger", "baconCheeseburger", "spicyCheeseburger", "salad", "fishPotatoes"] },
  { name: "Pasta Pots", recipes: ["spaghettiMeatballs", "garlicSpaghetti", "spicyMeatballs", "creamyMeatballs", "salad", "soup"] },
  { name: "Salad Station", recipes: ["salad", "greekSalad", "chickenSalad", "caesarSalad", "grilledFish", "soup"] },
  { name: "Soup Kitchen", recipes: ["soup", "tomatoSoup", "mushroomSoup", "pumpkinSoup", "burger", "salad"] },
  { name: "Fish Grill", recipes: ["grilledFish", "herbGrilledFish", "garlicButterFish", "fishPotatoes", "greekSalad", "soup"] },
  { name: "Riverside Steakhouse", recipes: ["steakVegetables", "peppercornSteak", "mushroomSteak", "redWineSteak", "caesarSalad", "tomatoSoup"] },
  { name: "Roast Service", recipes: ["roastDinner", "herbRoastDinner", "beefRoastDinner", "vegetableRoast", "soup", "salad"] },
  { name: "Lunch Pairings", recipes: ["baconBurger", "spicyCheeseburger", "garlicSpaghetti", "chickenSalad", "tomatoSoup", "fishPotatoes"] },
  { name: "Heat Control", recipes: ["bbqOnionBurger", "doubleCheeseburger", "spicyMeatballs", "mushroomSoup", "garlicButterFish", "peppercornSteak"] },
  { name: "Riverside Specials", recipes: ["mushroomBurger", "creamyMeatballs", "greekSalad", "pumpkinSoup", "redWineSteak", "herbRoastDinner"] },
  { name: "Dinner Rush", recipes: ["baconCheeseburger", "caesarSalad", "herbGrilledFish", "mushroomSteak", "beefRoastDinner", "vegetableRoast"] },
  { name: "Kitchen Mastery", recipes: ["doubleCheeseburger", "garlicSpaghetti", "chickenSalad", "mushroomSoup", "garlicButterFish", "peppercornSteak", "beefRoastDinner", "herbRoastDinner"] },
].map((chapter) => Object.freeze({ name: chapter.name, recipes: Object.freeze(chapter.recipes) })));

const PILOT_LEVEL_PLANS = Object.freeze([
  ["First Burger", [["burger"], ["burger"], ["burger"]]], ["Add the Cheese", [["burger"], ["cheeseburger"], ["burger"]]], ["Fresh Side", [["salad"], ["burger"], ["salad"]]], ["Soup of the Day", [["soup"], ["burger"], ["soup"]]], ["Pasta Lunch", [["spaghettiMeatballs"], ["salad"], ["burger"]]],
  ["Busy Tables", [["cheeseburger"], ["soup"], ["salad"], ["burger"]]], ["Lunch Pairings", [["burger", "salad"], ["soup"], ["cheeseburger"]]], ["Counter Queue", [["spaghettiMeatballs"], ["burger", "soup"], ["salad"], ["cheeseburger"]]], ["Four-Table Rush", [["cheeseburger", "salad"], ["spaghettiMeatballs"], ["burger"], ["soup"]]], ["Lunch Service", [["burger", "salad"], ["cheeseburger", "soup"], ["spaghettiMeatballs"], ["salad"]]],
  ["Fish on the Grill", [["grilledFish"], ["salad"], ["grilledFish"]]], ["Steak Temperature", [["steakVegetables"], ["grilledFish"], ["salad"]]], ["Sunday Roast", [["roastDinner"], ["soup"], ["roastDinner"]]], ["Dinner Choice", [["grilledFish"], ["steakVegetables"], ["spaghettiMeatballs"], ["salad"]]], ["Pots and Pans", [["soup", "salad"], ["spaghettiMeatballs"], ["steakVegetables"], ["burger"]]],
  ["Grill Night", [["grilledFish", "salad"], ["steakVegetables"], ["cheeseburger"], ["soup"]]], ["Roast and Soup", [["roastDinner", "soup"], ["grilledFish"], ["salad"], ["spaghettiMeatballs"]]], ["Five Tables", [["steakVegetables"], ["roastDinner"], ["burger", "salad"], ["grilledFish"], ["soup"]]], ["Riverside Rush", [["spaghettiMeatballs", "salad"], ["steakVegetables"], ["roastDinner"], ["cheeseburger", "soup"], ["grilledFish"]]], ["Kitchen Master", [["roastDinner", "salad"], ["steakVegetables", "soup"], ["grilledFish"], ["spaghettiMeatballs"], ["cheeseburger"]]],
].map(([name, orders]) => Object.freeze({ name, orders: Object.freeze(orders.map((entry) => Object.freeze(entry))) })));

const SHIFT_NAMES = Object.freeze(["Opening Tables", "Lunch Queue", "Prep Rush", "Pan Service", "Pot Service", "Grill Orders", "Dinner Crowd", "Full House", "Chef's Test", "Chapter Challenge"]);
const order = (at, ...recipes) => Object.freeze({ at, recipes: Object.freeze(recipes) });
const planSignature = (orders) => orders.map((entry) => entry.recipes.join("+")).join("|");

function kitchenMotionServiceBudget(orders) {
  let serviceClock = 0;
  let worstWait = 0;
  for (const customerOrder of orders) {
    let prepSeconds = 0.4;
    for (const recipeId of customerOrder.recipes) {
      for (const step of RIVERSIDE_KITCHEN_RECIPES[recipeId]?.steps || []) {
        const appliance = RIVERSIDE_KITCHEN_APPLIANCES[step];
        prepSeconds += appliance ? Math.max(0.25, Number(appliance.seconds) || 0) + 1.32 : 0.78;
      }
      prepSeconds += 0.25;
    }
    const start = Math.max(serviceClock, customerOrder.at);
    worstWait = Math.max(worstWait, start - customerOrder.at + prepSeconds);
    serviceClock = start + prepSeconds;
  }
  return Object.freeze({ duration: Math.ceil(serviceClock + 8), patience: Math.ceil(worstWait + 8) });
}

function difficultyTier(level) {
  if (level <= 20) return { target: null, total: null };
  if (level <= 40) return { target: 5, total: 6 + (level % 2) };
  if (level <= 100) return { target: 6, total: 8 + (level % 3) };
  return { target: 6, total: 11 + (level % 2) };
}

function generatedOrders(level, menu, variant = 0) {
  const { target, total } = difficultyTier(level);
  const chapterIndex = Math.floor((level - 1) / 10);
  const stage = (level - 1) % 10;
  const counts = Array(target).fill(1);
  for (let extra = target; extra < total; extra += 1) counts[(extra + level + variant) % target] += 1;
  const usedOrders = new Set();
  const orders = [];
  for (let orderIndex = 0; orderIndex < target; orderIndex += 1) {
    const count = Math.min(3, counts[orderIndex]);
    const recipes = [];
    let cursor = (stage * 2 + orderIndex * 3 + chapterIndex + variant) % menu.length;
    let guard = 0;
    while (recipes.length < count && guard++ < menu.length * 3) {
      const id = menu[cursor % menu.length];
      if (!recipes.includes(id)) recipes.push(id);
      cursor += 1 + ((level + orderIndex + variant) % Math.max(1, menu.length - 1));
    }
    let signature = recipes.join("+");
    let rotate = 0;
    while (usedOrders.has(signature) && rotate++ < menu.length) {
      recipes[recipes.length - 1] = menu[(cursor + rotate) % menu.length];
      if (new Set(recipes).size < recipes.length) continue;
      signature = recipes.join("+");
    }
    usedOrders.add(signature);
    const arrivalGap = Math.max(9, 15 - Math.floor(level / 38));
    orders.push(order(orderIndex * arrivalGap, ...recipes));
  }
  return orders;
}

function buildRiversideKitchenLevels() {
  const levels = [];
  const usedPlans = new Set();
  for (let index = 0; index < PILOT_LEVEL_PLANS.length; index += 1) {
    const plan = PILOT_LEVEL_PLANS[index];
    const level = index + 1;
    const chapter = Math.floor(index / 10) + 1;
    const arrivalGap = level < 7 ? 20 : level < 14 ? 17 : 14;
    const orders = plan.orders.map((recipes, orderIndex) => order(orderIndex * arrivalGap, ...recipes));
    const workload = orders.reduce((sum, customerOrder) => sum + customerOrder.recipes.reduce((mealSum, id) => mealSum + RIVERSIDE_KITCHEN_RECIPES[id].steps.length, 0), 0);
    const motion = kitchenMotionServiceBudget(orders);
    const duration = Math.max(135, (orders.at(-1)?.at || 0) + 78 + Math.round(workload * 1.9), motion.duration);
    const menu = Object.freeze([...new Set(orders.flatMap((customerOrder) => customerOrder.recipes))]);
    usedPlans.add(planSignature(orders));
    levels.push(Object.freeze({ level, name: plan.name, chapter, duration, target: orders.length, maxMisses: 0, patience: Math.max(level < 11 ? 118 : 128, motion.patience), menu, orders: Object.freeze(orders) }));
  }
  for (let level = 21; level <= RIVERSIDE_KITCHEN_CONFIG.levelCount; level += 1) {
    const chapterIndex = Math.floor((level - 1) / 10);
    const stage = (level - 1) % 10;
    const chapter = RIVERSIDE_KITCHEN_CHAPTERS[chapterIndex];
    const menu = Object.freeze([...new Set(["burger", "salad", ...chapter.recipes])]);
    const variantBase = (level * 11) % menu.length;
    let candidate = generatedOrders(level, menu, variantBase);
    let signature = planSignature(candidate);
    let variant = 1;
    while (usedPlans.has(signature) && variant < 200) {
      candidate = generatedOrders(level, menu, variantBase + variant++);
      signature = planSignature(candidate);
    }
    usedPlans.add(signature);
    const workload = candidate.reduce((sum, customerOrder) => sum + customerOrder.recipes.reduce((mealSum, id) => mealSum + RIVERSIDE_KITCHEN_RECIPES[id].steps.length, 0), 0);
    const lastArrival = candidate.at(-1)?.at || 0;
    const motion = kitchenMotionServiceBudget(candidate);
    const duration = Math.max(150, lastArrival + 92 + Math.round(workload * 1.82), motion.duration);
    const patience = Math.max(128 + Math.floor((level - 1) / 30) * 5, motion.patience);
    levels.push(Object.freeze({ level, name: `${chapter.name} · ${SHIFT_NAMES[stage]}`, chapter: chapterIndex + 1, duration, target: candidate.length, maxMisses: 0, patience, menu, orders: Object.freeze(candidate) }));
  }
  return Object.freeze(levels);
}

export const RIVERSIDE_KITCHEN_LEVELS = buildRiversideKitchenLevels();

export function riversideKitchenStep(id) {
  const item = RIVERSIDE_KITCHEN_INGREDIENTS[id] || RIVERSIDE_KITCHEN_APPLIANCES[id];
  return item ? { id, ...item, kind: RIVERSIDE_KITCHEN_APPLIANCES[id] ? "appliance" : "ingredient" } : null;
}

export function riversideKitchenLevel(number) {
  const level = Math.max(1, Math.min(RIVERSIDE_KITCHEN_CONFIG.levelCount, Math.floor(Number(number) || 1)));
  return RIVERSIDE_KITCHEN_LEVELS[level - 1];
}

export function riversideKitchenFirstClearCoins(level, stars) {
  const safeLevel = Math.max(1, Math.min(RIVERSIDE_KITCHEN_CONFIG.levelCount, Math.floor(Number(level) || 1)));
  const safeStars = Math.max(0, Math.min(3, Math.floor(Number(stars) || 0)));
  return Math.min(RIVERSIDE_KITCHEN_CONFIG.firstClearMaxCoins, RIVERSIDE_KITCHEN_CONFIG.firstClearBaseCoins + safeLevel * RIVERSIDE_KITCHEN_CONFIG.firstClearLevelCoins + safeStars * RIVERSIDE_KITCHEN_CONFIG.starCoins);
}
