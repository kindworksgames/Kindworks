// Exact Morning Mug catalogue and deterministic campaign extracted from the protected HTML reference.
export const MORNING_MUG_STATE_SCHEMA_VERSION = 1;

export const MORNING_MUG_CONFIG = Object.freeze({
  levelCount: 150,
  trayCount: 3,
  maxCustomers: 3,
  graceSeconds: 3,
  firstClearBaseCoins: 25,
  firstClearLevelCoins: 1,
  starCoins: 12,
  firstClearMaxCoins: 170,
});

export const MORNING_MUG_INGREDIENTS = Object.freeze({
  smallCup: Object.freeze({ name: "Small cup", icon: "☕" }),
  mediumCup: Object.freeze({ name: "Medium cup", icon: "☕" }),
  largeCup: Object.freeze({ name: "Large cup", icon: "🥤" }),
  coldCup: Object.freeze({ name: "Cold cup", icon: "🥤" }),
  coffeeBeans: Object.freeze({ name: "Coffee beans", icon: "🫘" }),
  milk: Object.freeze({ name: "Milk", icon: "🥛" }),
  foam: Object.freeze({ name: "Milk foam", icon: "☁️" }),
  cocoa: Object.freeze({ name: "Cocoa", icon: "🍫" }),
  ice: Object.freeze({ name: "Ice", icon: "🧊" }),
  teaBag: Object.freeze({ name: "Tea bag", icon: "🍃" }),
  caramelSyrup: Object.freeze({ name: "Caramel syrup", icon: "🍯" }),
  vanillaSyrup: Object.freeze({ name: "Vanilla syrup", icon: "🌼" }),
  hazelnutSyrup: Object.freeze({ name: "Hazelnut syrup", icon: "🌰" }),
  peppermintSyrup: Object.freeze({ name: "Peppermint syrup", icon: "🌿" }),
  honey: Object.freeze({ name: "Honey", icon: "🍯" }),
  oatMilk: Object.freeze({ name: "Oat milk", icon: "🌾" }),
  coldWater: Object.freeze({ name: "Cold water", icon: "💧" }),
  whippedCream: Object.freeze({ name: "Whipped cream", icon: "🍦" }),
  coldFoam: Object.freeze({ name: "Cold foam", icon: "☁️" }),
  whiteChocolate: Object.freeze({ name: "White chocolate", icon: "🤍" }),
  chaiSpice: Object.freeze({ name: "Chai spice", icon: "🫚" }),
  lemon: Object.freeze({ name: "Lemon", icon: "🍋" }),
  orangeZest: Object.freeze({ name: "Orange zest", icon: "🍊" }),
  seaSalt: Object.freeze({ name: "Sea salt", icon: "🧂" }),
  chocolateDrizzle: Object.freeze({ name: "Chocolate drizzle", icon: "🍫" }),
  caramelDrizzle: Object.freeze({ name: "Caramel drizzle", icon: "🍯" }),
  chocolateShavings: Object.freeze({ name: "Chocolate shavings", icon: "🍫" }),
  cinnamon: Object.freeze({ name: "Cinnamon topping", icon: "🟤" }),
});

export const MORNING_MUG_APPLIANCES = Object.freeze({
  grinder: Object.freeze({ name: "Coffee grinder", icon: "⚙️", seconds: 2.1, burnWindow: 9 }),
  espressoMachine: Object.freeze({ name: "Espresso machine", icon: "☕", seconds: 2.7, burnWindow: 8 }),
  kettle: Object.freeze({ name: "Hot water", icon: "♨️", seconds: 2.3, burnWindow: 9 }),
  steamer: Object.freeze({ name: "Milk steamer", icon: "🫧", seconds: 2.6, burnWindow: 8 }),
  foamWhisk: Object.freeze({ name: "Foam whisk", icon: "🌀", seconds: 2.2, burnWindow: 9 }),
});

const drink = (name, icon, steps) => Object.freeze({ name, icon, steps: Object.freeze(steps) });

export const MORNING_MUG_RECIPES = Object.freeze({
  espressoSmall: drink("Small espresso", "☕", ["smallCup", "coffeeBeans", "grinder", "espressoMachine"]),
  espressoDouble: drink("Double espresso", "☕☕", ["mediumCup", "coffeeBeans", "grinder", "espressoMachine", "coffeeBeans", "grinder", "espressoMachine"]),
  americano: drink("Americano", "☕", ["mediumCup", "coffeeBeans", "grinder", "espressoMachine", "kettle"]),
  largeAmericano: drink("Large Americano", "🥤", ["largeCup", "coffeeBeans", "grinder", "espressoMachine", "coffeeBeans", "grinder", "espressoMachine", "kettle"]),
  cappuccino: drink("Cappuccino", "☕☁️", ["mediumCup", "coffeeBeans", "grinder", "espressoMachine", "milk", "steamer", "foam", "foamWhisk", "cocoa"]),
  largeCappuccino: drink("Large cappuccino", "🥤☁️", ["largeCup", "coffeeBeans", "grinder", "espressoMachine", "coffeeBeans", "grinder", "espressoMachine", "milk", "steamer", "foam", "foamWhisk", "cocoa"]),
  latte: drink("Latte", "☕🥛", ["mediumCup", "coffeeBeans", "grinder", "espressoMachine", "milk", "steamer", "foam"]),
  largeLatte: drink("Large latte", "🥤🥛", ["largeCup", "coffeeBeans", "grinder", "espressoMachine", "coffeeBeans", "grinder", "espressoMachine", "milk", "steamer", "foam"]),
  mocha: drink("Mocha", "☕🍫", ["mediumCup", "coffeeBeans", "grinder", "espressoMachine", "cocoa", "milk", "steamer", "foam", "chocolateDrizzle"]),
  icedCoffee: drink("Iced coffee", "🧊☕", ["coldCup", "ice", "coffeeBeans", "grinder", "espressoMachine", "milk"]),
  icedMocha: drink("Iced mocha", "🧊🍫", ["coldCup", "ice", "coffeeBeans", "grinder", "espressoMachine", "cocoa", "milk", "chocolateDrizzle"]),
  caramelCoffee: drink("Caramel coffee", "☕🍯", ["mediumCup", "coffeeBeans", "grinder", "espressoMachine", "caramelSyrup", "milk", "steamer", "foam", "caramelDrizzle"]),
  largeCaramel: drink("Large caramel coffee", "🥤🍯", ["largeCup", "coffeeBeans", "grinder", "espressoMachine", "coffeeBeans", "grinder", "espressoMachine", "caramelSyrup", "milk", "steamer", "foam", "caramelDrizzle"]),
  cinnamonLatte: drink("Cinnamon latte", "☕🟤", ["mediumCup", "coffeeBeans", "grinder", "espressoMachine", "milk", "steamer", "foam", "cinnamon"]),
  teaMilk: drink("Tea with milk", "🫖🥛", ["mediumCup", "teaBag", "kettle", "milk"]),
  espressoMacchiato: drink("Espresso macchiato", "☕☁️", ["smallCup", "coffeeBeans", "grinder", "espressoMachine", "foam", "foamWhisk"]),
  cortado: drink("Cortado", "☕🥛", ["smallCup", "coffeeBeans", "grinder", "espressoMachine", "milk", "steamer"]),
  espressoConPanna: drink("Espresso con panna", "☕🍦", ["smallCup", "coffeeBeans", "grinder", "espressoMachine", "whippedCream"]),
  honeyEspresso: drink("Honey espresso", "☕🍯", ["smallCup", "honey", "coffeeBeans", "grinder", "espressoMachine"]),
  longBlack: drink("Long black", "☕💧", ["mediumCup", "kettle", "coffeeBeans", "grinder", "espressoMachine"]),
  icedAmericano: drink("Iced Americano", "🧊☕", ["coldCup", "ice", "coffeeBeans", "grinder", "espressoMachine", "coldWater"]),
  honeyAmericano: drink("Honey Americano", "☕🍯", ["mediumCup", "honey", "coffeeBeans", "grinder", "espressoMachine", "kettle"]),
  vanillaAmericano: drink("Vanilla Americano", "☕🌼", ["mediumCup", "vanillaSyrup", "coffeeBeans", "grinder", "espressoMachine", "kettle"]),
  cinnamonCappuccino: drink("Cinnamon cappuccino", "☕🟤", ["mediumCup", "coffeeBeans", "grinder", "espressoMachine", "milk", "steamer", "foam", "foamWhisk", "cinnamon"]),
  chocolateCappuccino: drink("Chocolate cappuccino", "☕🍫", ["mediumCup", "cocoa", "coffeeBeans", "grinder", "espressoMachine", "milk", "steamer", "foam", "foamWhisk"]),
  oatCappuccino: drink("Oat cappuccino", "☕🌾", ["mediumCup", "coffeeBeans", "grinder", "espressoMachine", "oatMilk", "steamer", "foam", "foamWhisk"]),
  caramelCappuccino: drink("Caramel cappuccino", "☕🍯", ["mediumCup", "caramelSyrup", "coffeeBeans", "grinder", "espressoMachine", "milk", "steamer", "foam", "foamWhisk"]),
  vanillaLatte: drink("Vanilla latte", "☕🌼", ["mediumCup", "vanillaSyrup", "coffeeBeans", "grinder", "espressoMachine", "milk", "steamer", "foam"]),
  hazelnutLatte: drink("Hazelnut latte", "☕🌰", ["mediumCup", "hazelnutSyrup", "coffeeBeans", "grinder", "espressoMachine", "milk", "steamer", "foam"]),
  oatLatte: drink("Oat latte", "☕🌾", ["mediumCup", "coffeeBeans", "grinder", "espressoMachine", "oatMilk", "steamer", "foam"]),
  honeyLatte: drink("Honey latte", "☕🍯", ["mediumCup", "honey", "coffeeBeans", "grinder", "espressoMachine", "milk", "steamer", "foam"]),
  peppermintMocha: drink("Peppermint mocha", "☕🌿", ["mediumCup", "peppermintSyrup", "coffeeBeans", "grinder", "espressoMachine", "cocoa", "milk", "steamer", "foam", "chocolateDrizzle"]),
  whiteMocha: drink("White mocha", "☕🤍", ["mediumCup", "whiteChocolate", "coffeeBeans", "grinder", "espressoMachine", "milk", "steamer", "foam"]),
  mochaCream: drink("Cream-top mocha", "☕🍦", ["mediumCup", "coffeeBeans", "grinder", "espressoMachine", "cocoa", "milk", "steamer", "whippedCream", "chocolateShavings"]),
  orangeMocha: drink("Orange mocha", "☕🍊", ["mediumCup", "orangeZest", "coffeeBeans", "grinder", "espressoMachine", "cocoa", "milk", "steamer", "foam"]),
  icedLatte: drink("Iced latte", "🧊🥛", ["coldCup", "ice", "coffeeBeans", "grinder", "espressoMachine", "milk", "coldFoam"]),
  icedVanillaLatte: drink("Iced vanilla latte", "🧊🌼", ["coldCup", "ice", "vanillaSyrup", "coffeeBeans", "grinder", "espressoMachine", "milk"]),
  icedCaramel: drink("Iced caramel coffee", "🧊🍯", ["coldCup", "ice", "caramelSyrup", "coffeeBeans", "grinder", "espressoMachine", "milk", "caramelDrizzle"]),
  icedHazelnut: drink("Iced hazelnut coffee", "🧊🌰", ["coldCup", "ice", "hazelnutSyrup", "coffeeBeans", "grinder", "espressoMachine", "milk"]),
  icedOatLatte: drink("Iced oat latte", "🧊🌾", ["coldCup", "ice", "coffeeBeans", "grinder", "espressoMachine", "oatMilk"]),
  coldFoamCoffee: drink("Cold-foam coffee", "🧊☁️", ["coldCup", "ice", "coffeeBeans", "grinder", "espressoMachine", "coldWater", "coldFoam"]),
  caramelMacchiato: drink("Caramel macchiato", "☕🍯", ["mediumCup", "vanillaSyrup", "milk", "steamer", "foam", "coffeeBeans", "grinder", "espressoMachine", "caramelDrizzle"]),
  saltedCaramel: drink("Salted caramel latte", "☕🧂", ["mediumCup", "caramelSyrup", "coffeeBeans", "grinder", "espressoMachine", "milk", "steamer", "foam", "seaSalt", "caramelDrizzle"]),
  largeTeaMilk: drink("Large tea with milk", "🫖🥛", ["largeCup", "teaBag", "kettle", "milk"]),
  honeyMilkTea: drink("Honey milk tea", "🫖🍯", ["mediumCup", "teaBag", "kettle", "honey", "milk"]),
  vanillaMilkTea: drink("Vanilla milk tea", "🫖🌼", ["mediumCup", "vanillaSyrup", "teaBag", "kettle", "milk"]),
  oatMilkTea: drink("Oat milk tea", "🫖🌾", ["mediumCup", "teaBag", "kettle", "oatMilk"]),
  chaiLatte: drink("Chai latte", "🫖🫚", ["mediumCup", "chaiSpice", "teaBag", "kettle", "milk", "steamer", "foam", "cinnamon"]),
  icedChai: drink("Iced chai", "🧊🫚", ["coldCup", "ice", "chaiSpice", "teaBag", "kettle", "milk"]),
  lemonTea: drink("Lemon tea", "🫖🍋", ["mediumCup", "teaBag", "kettle", "lemon"]),
  honeyLemonTea: drink("Honey lemon tea", "🫖🍯", ["largeCup", "teaBag", "kettle", "honey", "lemon"]),
  vanillaColdFoam: drink("Vanilla cold foam", "🧊☁️", ["coldCup", "ice", "vanillaSyrup", "coffeeBeans", "grinder", "espressoMachine", "coldWater", "coldFoam"]),
  saltedColdBrew: drink("Salted cold coffee", "🧊🧂", ["coldCup", "ice", "coffeeBeans", "grinder", "espressoMachine", "coldWater", "coldFoam", "seaSalt"]),
  deluxeMocha: drink("Deluxe mocha", "☕🍫", ["largeCup", "coffeeBeans", "grinder", "espressoMachine", "coffeeBeans", "grinder", "espressoMachine", "cocoa", "milk", "steamer", "whippedCream", "chocolateDrizzle", "chocolateShavings"]),
});

export const MORNING_MUG_CHAPTERS = Object.freeze([
  { name: "Barista Foundations", recipes: ["espressoSmall", "espressoDouble", "americano", "largeAmericano", "latte", "teaMilk"] },
  { name: "Milk, Ice & Flavour", recipes: ["cappuccino", "largeCappuccino", "largeLatte", "mocha", "icedCoffee", "icedMocha", "caramelCoffee", "largeCaramel", "cinnamonLatte"] },
  { name: "Espresso Craft", recipes: ["espressoSmall", "espressoDouble", "espressoMacchiato", "cortado", "espressoConPanna", "honeyEspresso"] },
  { name: "Black Coffee Bar", recipes: ["americano", "largeAmericano", "longBlack", "icedAmericano", "honeyAmericano", "vanillaAmericano"] },
  { name: "Cappuccino Counter", recipes: ["cappuccino", "largeCappuccino", "cinnamonCappuccino", "chocolateCappuccino", "oatCappuccino", "caramelCappuccino"] },
  { name: "Latte Workshop", recipes: ["latte", "largeLatte", "cinnamonLatte", "vanillaLatte", "hazelnutLatte", "oatLatte", "honeyLatte"] },
  { name: "Mocha Studio", recipes: ["mocha", "icedMocha", "peppermintMocha", "whiteMocha", "mochaCream", "orangeMocha"] },
  { name: "Iced Coffee Bar", recipes: ["icedCoffee", "icedLatte", "icedVanillaLatte", "icedCaramel", "icedHazelnut", "icedOatLatte", "coldFoamCoffee"] },
  { name: "Caramel Counter", recipes: ["caramelCoffee", "largeCaramel", "caramelCappuccino", "icedCaramel", "caramelMacchiato", "saltedCaramel"] },
  { name: "Tea & Chai", recipes: ["teaMilk", "largeTeaMilk", "honeyMilkTea", "vanillaMilkTea", "oatMilkTea", "chaiLatte", "icedChai", "lemonTea", "honeyLemonTea"] },
  { name: "Syrup Bar", recipes: ["vanillaAmericano", "vanillaLatte", "hazelnutLatte", "peppermintMocha", "icedVanillaLatte", "icedHazelnut", "honeyLatte"] },
  { name: "Milk Choices", recipes: ["oatCappuccino", "oatLatte", "icedOatLatte", "oatMilkTea", "cortado", "whiteMocha", "honeyMilkTea"] },
  { name: "Finishing School", recipes: ["espressoConPanna", "cinnamonCappuccino", "mochaCream", "caramelMacchiato", "saltedCaramel", "deluxeMocha"] },
  { name: "Cold Counter", recipes: ["icedAmericano", "icedMocha", "icedLatte", "coldFoamCoffee", "vanillaColdFoam", "saltedColdBrew", "icedChai"] },
  { name: "Morning Mug Mastery", recipes: ["espressoMacchiato", "longBlack", "caramelMacchiato", "chaiLatte", "vanillaColdFoam", "saltedColdBrew", "deluxeMocha"] },
].map((chapter) => Object.freeze({ name: chapter.name, recipes: Object.freeze(chapter.recipes) })));

const PILOT_LEVEL_PLANS = Object.freeze([
  ["First Grind", ["espressoSmall", "espressoSmall", "espressoSmall"]], ["Water Please", ["americano", "espressoSmall", "americano"]], ["Choose the Cup", ["espressoSmall", "espressoDouble", "americano"]], ["Long Black Line", ["americano", "largeAmericano", "espressoDouble"]], ["Latte Lesson", ["latte", "americano", "latte"]],
  ["Tea Break", ["teaMilk", "latte", "americano"]], ["Morning Queue", ["espressoSmall", "espressoDouble", "latte", "teaMilk"]], ["Cup Size Check", ["largeAmericano", "latte", "espressoSmall", "americano"]], ["Double Shot", ["espressoDouble", "largeAmericano", "teaMilk", "latte"]], ["Foundation Rush", ["latte", "americano", "espressoDouble", "largeAmericano"]],
  ["Foam School", ["cappuccino", "latte", "cappuccino"]], ["Chocolate Bar", ["mocha", "cappuccino", "latte"]], ["Over Ice", ["icedCoffee", "mocha", "cappuccino", "icedCoffee"]], ["Caramel Pump", ["caramelCoffee", "icedCoffee", "mocha", "latte"]], ["Tall Orders", ["largeLatte", "largeCappuccino", "largeCaramel", "largeLatte"]],
  ["Topping Practice", ["cinnamonLatte", "caramelCoffee", "mocha", "cappuccino"]], ["Cold Counter", ["icedMocha", "icedCoffee", "largeLatte", "caramelCoffee"]], ["Mixed Bar", ["largeCappuccino", "teaMilk", "icedMocha", "cinnamonLatte", "espressoDouble"]], ["Coffee Crowd", ["largeCaramel", "mocha", "icedCoffee", "largeAmericano", "cappuccino"]], ["Morning Mug Master", ["cinnamonLatte", "largeCappuccino", "icedMocha", "largeCaramel", "teaMilk"]],
].map(([name, recipes]) => Object.freeze({ name, recipes: Object.freeze(recipes) })));

const SHIFT_NAMES = Object.freeze(["Opening Bell", "Early Queue", "Commuter Cup", "Midmorning Mix", "Milk Rush", "Syrup Run", "Counter Crowd", "Fast Pour", "Full House", "Chapter Challenge"]);
const order = (at, ...recipes) => Object.freeze({ at, recipes: Object.freeze(recipes) });
const planSignature = (orders) => orders.map((entry) => entry.recipes.join("+")).join("|");

function kitchenMotionServiceBudget(orders) {
  let serviceClock = 0;
  let worstWait = 0;
  for (const customerOrder of orders) {
    let prepSeconds = 0.4;
    for (const recipeId of customerOrder.recipes) {
      for (const step of MORNING_MUG_RECIPES[recipeId]?.steps || []) {
        const appliance = MORNING_MUG_APPLIANCES[step];
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

function buildMorningMugLevels() {
  const levels = [];
  const usedPlans = new Set();
  for (let index = 0; index < PILOT_LEVEL_PLANS.length; index += 1) {
    const plan = PILOT_LEVEL_PLANS[index];
    const level = index + 1;
    const chapter = Math.floor(index / 10) + 1;
    const arrivalGap = level < 7 ? 19 : level < 16 ? 16 : 14;
    const orders = plan.recipes.map((id, orderIndex) => order(orderIndex * arrivalGap, id));
    const workload = plan.recipes.reduce((sum, id) => sum + MORNING_MUG_RECIPES[id].steps.length, 0);
    const motion = kitchenMotionServiceBudget(orders);
    const duration = Math.max(115, (orders.at(-1)?.at || 0) + 68 + Math.round(workload * 2.15), motion.duration);
    const menu = Object.freeze([...new Set(plan.recipes)]);
    usedPlans.add(planSignature(orders));
    levels.push(Object.freeze({ level, name: plan.name, chapter, duration, target: orders.length, maxMisses: 0, patience: Math.max(level < 11 ? 105 : 112, motion.patience), menu, orders: Object.freeze(orders) }));
  }
  for (let level = 21; level <= MORNING_MUG_CONFIG.levelCount; level += 1) {
    const chapterIndex = Math.floor((level - 1) / 10);
    const stage = (level - 1) % 10;
    const chapter = MORNING_MUG_CHAPTERS[chapterIndex];
    const menu = Object.freeze([...new Set(["espressoSmall", "americano", ...chapter.recipes])]);
    const variantBase = (level * 7) % menu.length;
    let candidate = generatedOrders(level, menu, variantBase);
    let signature = planSignature(candidate);
    let variant = 1;
    while (usedPlans.has(signature) && variant < 200) {
      candidate = generatedOrders(level, menu, variantBase + variant++);
      signature = planSignature(candidate);
    }
    usedPlans.add(signature);
    const workload = candidate.reduce((sum, customerOrder) => sum + customerOrder.recipes.reduce((drinkSum, id) => drinkSum + MORNING_MUG_RECIPES[id].steps.length, 0), 0);
    const lastArrival = candidate.at(-1)?.at || 0;
    const motion = kitchenMotionServiceBudget(candidate);
    const duration = Math.max(130, lastArrival + 82 + Math.round(workload * 1.72), motion.duration);
    const patience = Math.max(112 + Math.floor((level - 1) / 30) * 4, motion.patience);
    levels.push(Object.freeze({ level, name: `${chapter.name} · ${SHIFT_NAMES[stage]}`, chapter: chapterIndex + 1, duration, target: candidate.length, maxMisses: 0, patience, menu, orders: Object.freeze(candidate) }));
  }
  return Object.freeze(levels);
}

export const MORNING_MUG_LEVELS = buildMorningMugLevels();

export function morningMugStep(id) {
  return MORNING_MUG_INGREDIENTS[id] || MORNING_MUG_APPLIANCES[id] || null;
}

export function morningMugLevel(number = 1) {
  const level = Math.max(1, Math.min(MORNING_MUG_CONFIG.levelCount, Math.floor(Number(number) || 1)));
  return MORNING_MUG_LEVELS[level - 1];
}

export function morningMugFirstClearCoins(level, stars) {
  return Math.min(
    MORNING_MUG_CONFIG.firstClearMaxCoins,
    MORNING_MUG_CONFIG.firstClearBaseCoins
      + Math.max(1, Math.min(MORNING_MUG_CONFIG.levelCount, Math.floor(Number(level) || 1))) * MORNING_MUG_CONFIG.firstClearLevelCoins
      + Math.max(0, Math.min(3, Math.floor(Number(stars) || 0))) * MORNING_MUG_CONFIG.starCoins,
  );
}
