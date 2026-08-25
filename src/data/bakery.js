export const BAKERY_STATE_SCHEMA_VERSION = 1;

export const BAKERY_CONFIG = Object.freeze({
  levelCount: 150,
  levelsPerChapter: 10,
  trayCount: 3,
  maxCustomers: 3,
  graceSeconds: 3,
  firstClearBaseCoins: 35,
  firstClearCampaignCoins: 85,
  starCoins: 15,
  firstClearMaxCoins: 170,
});

const ingredientRows = [
  ["breadDough", "Bread dough", "🟤"], ["laminatedDough", "Laminated dough", "🥐"], ["vanillaBatter", "Vanilla batter", "🧁"], ["chocolateBatter", "Chocolate batter", "🍫"],
  ["shortcrust", "Shortcrust dough", "🥧"], ["sweetDough", "Sweet dough", "🍩"], ["carrotBatter", "Carrot cake batter", "🥕"], ["rollDough", "Roll dough", "🥖"],
  ["butter", "Butter", "🧈"], ["seeds", "Mixed seeds", "🌻"], ["herbs", "Garden herbs", "🌿"], ["loafTin", "Loaf tin", "▰"], ["eggWash", "Egg wash", "🥚"],
  ["triangleCutter", "Triangle cutter", "🔺"], ["chocolate", "Chocolate batons", "🍫"], ["almondFilling", "Almond filling", "🌰"], ["slicedAlmonds", "Sliced almonds", "🌰"],
  ["cupcakeCase", "Cupcake case", "🧁"], ["vanillaIcing", "Vanilla icing", "🤍"], ["chocolateIcing", "Chocolate icing", "🍫"], ["sprinkles", "Sprinkles", "✨"],
  ["berries", "Mixed berries", "🫐"], ["strawberryTopper", "Strawberry topper", "🍓"], ["tartTin", "Tart tin", "◉"], ["custard", "Custard", "🍮"],
  ["strawberries", "Strawberries", "🍓"], ["mixedFruit", "Mixed fruit", "🍓"], ["appleSlices", "Apple slices", "🍎"], ["glaze", "Fruit glaze", "✨"],
  ["doughnutCutter", "Doughnut cutter", "⭕"], ["sugar", "Sugar", "◇"], ["jamFilling", "Jam filling", "🍓"], ["pieDish", "Pie dish", "🥧"],
  ["appleFilling", "Apple filling", "🍎"], ["cinnamon", "Cinnamon", "🟤"], ["topCrust", "Top crust", "🥧"], ["latticeTop", "Lattice top", "#"], ["caramel", "Caramel", "🍯"],
  ["cakeTin", "Cake tin", "▣"], ["walnuts", "Walnuts", "🌰"], ["creamCheeseIcing", "Cream cheese icing", "🤍"], ["carrotTopper", "Carrot decoration", "🥕"],
  ["slice", "Slice the roll", "🔪"], ["cheese", "Cheese", "🧀"], ["lettuce", "Lettuce", "🥬"], ["tomato", "Tomato", "🍅"], ["ham", "Ham", "🍖"],
  ["tuna", "Tuna", "🐟"], ["cucumber", "Cucumber", "🥒"], ["box", "Bakery box", "📦"],
];

export const BAKERY_INGREDIENTS = Object.freeze(Object.fromEntries(ingredientRows.map(([id, name, icon]) => [id, Object.freeze({ id, name, icon, kind: "ingredient" })])));

const applianceRows = [
  ["mixer", "Mixer", "⚙️", 2.8, 9], ["kneader", "Kneading bench", "🤲", 2.7, 9], ["roller", "Rolling bench", "↔️", 2.6, 9],
  ["shaper", "Shaping bench", "👐", 2.5, 9], ["oven", "Bakery oven", "▣", 4.2, 7], ["fryer", "Doughnut fryer", "🔥", 3.7, 6],
  ["decorator", "Decorating bench", "🎨", 2.3, 10],
];

export const BAKERY_APPLIANCES = Object.freeze(Object.fromEntries(applianceRows.map(([id, name, icon, seconds, burnWindow]) => [id, Object.freeze({ id, name, icon, seconds, burnWindow, kind: "appliance" })])));

function recipe(name, icon, family, steps) {
  return Object.freeze({ name, icon, family, steps: Object.freeze(steps) });
}

export const BAKERY_RECIPES = Object.freeze({
  plainLoaf: recipe("Classic bread loaf", "🍞", "Bread", ["breadDough", "kneader", "loafTin", "oven"]),
  seededLoaf: recipe("Seeded bread loaf", "🍞🌻", "Bread", ["breadDough", "kneader", "seeds", "loafTin", "eggWash", "oven"]),
  herbLoaf: recipe("Herb bread loaf", "🍞🌿", "Bread", ["breadDough", "kneader", "herbs", "loafTin", "eggWash", "oven"]),
  butterCroissant: recipe("Butter croissant", "🥐", "Croissant", ["laminatedDough", "butter", "roller", "triangleCutter", "shaper", "eggWash", "oven"]),
  chocolateCroissant: recipe("Chocolate croissant", "🥐🍫", "Croissant", ["laminatedDough", "butter", "roller", "chocolate", "triangleCutter", "shaper", "eggWash", "oven"]),
  almondCroissant: recipe("Almond croissant", "🥐🌰", "Croissant", ["laminatedDough", "butter", "roller", "almondFilling", "triangleCutter", "shaper", "eggWash", "oven", "slicedAlmonds", "decorator"]),
  vanillaCupcake: recipe("Vanilla cupcake", "🧁", "Cupcake", ["vanillaBatter", "mixer", "cupcakeCase", "oven", "vanillaIcing", "decorator", "sprinkles", "box"]),
  chocolateCupcake: recipe("Chocolate cupcake", "🧁🍫", "Cupcake", ["chocolateBatter", "mixer", "cupcakeCase", "oven", "chocolateIcing", "decorator", "sprinkles", "box"]),
  berryCupcake: recipe("Berry cupcake", "🧁🫐", "Cupcake", ["vanillaBatter", "berries", "mixer", "cupcakeCase", "oven", "vanillaIcing", "decorator", "strawberryTopper", "box"]),
  strawberryTart: recipe("Strawberry fruit tart", "🥧🍓", "Fruit tart", ["shortcrust", "roller", "tartTin", "oven", "custard", "strawberries", "glaze", "decorator", "box"]),
  mixedFruitTart: recipe("Mixed fruit tart", "🥧🫐", "Fruit tart", ["shortcrust", "roller", "tartTin", "oven", "custard", "mixedFruit", "glaze", "decorator", "box"]),
  appleTart: recipe("Apple fruit tart", "🥧🍎", "Fruit tart", ["shortcrust", "roller", "tartTin", "oven", "custard", "appleSlices", "cinnamon", "glaze", "decorator", "box"]),
  sugarDoughnut: recipe("Sugar doughnut", "🍩", "Doughnut", ["sweetDough", "kneader", "doughnutCutter", "fryer", "sugar"]),
  chocolateDoughnut: recipe("Chocolate doughnut", "🍩🍫", "Doughnut", ["sweetDough", "kneader", "doughnutCutter", "fryer", "chocolateIcing", "decorator", "sprinkles"]),
  jamDoughnut: recipe("Jam doughnut", "🍩🍓", "Doughnut", ["sweetDough", "kneader", "doughnutCutter", "fryer", "jamFilling", "decorator", "sugar"]),
  classicApplePie: recipe("Classic apple pie", "🥧🍎", "Apple pie", ["shortcrust", "roller", "pieDish", "appleFilling", "cinnamon", "topCrust", "shaper", "eggWash", "oven", "box"]),
  latticeApplePie: recipe("Lattice apple pie", "🥧#", "Apple pie", ["shortcrust", "roller", "pieDish", "appleFilling", "cinnamon", "latticeTop", "shaper", "eggWash", "oven", "box"]),
  caramelApplePie: recipe("Caramel apple pie", "🥧🍯", "Apple pie", ["shortcrust", "roller", "pieDish", "appleFilling", "caramel", "topCrust", "shaper", "eggWash", "oven", "box"]),
  classicCarrotCake: recipe("Classic carrot cake", "🥕🍰", "Carrot cake", ["carrotBatter", "mixer", "cakeTin", "oven", "creamCheeseIcing", "decorator", "carrotTopper", "box"]),
  walnutCarrotCake: recipe("Walnut carrot cake", "🥕🌰", "Carrot cake", ["carrotBatter", "walnuts", "mixer", "cakeTin", "oven", "creamCheeseIcing", "decorator", "carrotTopper", "box"]),
  miniCarrotCake: recipe("Mini carrot cake", "🥕🧁", "Carrot cake", ["carrotBatter", "mixer", "cupcakeCase", "oven", "creamCheeseIcing", "decorator", "carrotTopper", "box"]),
  cheeseSaladRoll: recipe("Cheese salad roll", "🥖🧀", "Sandwich roll", ["rollDough", "kneader", "shaper", "oven", "slice", "butter", "cheese", "lettuce", "tomato"]),
  hamCheeseRoll: recipe("Ham & cheese roll", "🥖🍖", "Sandwich roll", ["rollDough", "kneader", "shaper", "oven", "slice", "butter", "ham", "cheese"]),
  tunaCucumberRoll: recipe("Tuna cucumber roll", "🥖🐟", "Sandwich roll", ["rollDough", "kneader", "shaper", "oven", "slice", "butter", "tuna", "cucumber"]),
});

export const BAKERY_STEP_CATALOG = Object.freeze({ ...BAKERY_INGREDIENTS, ...BAKERY_APPLIANCES });
export const BAKERY_RECIPE_IDS = Object.freeze(Object.keys(BAKERY_RECIPES));

export const BAKERY_FAMILY_RECIPES = Object.freeze({
  bread: Object.freeze(["plainLoaf", "seededLoaf", "herbLoaf"]),
  croissant: Object.freeze(["butterCroissant", "chocolateCroissant", "almondCroissant"]),
  cupcake: Object.freeze(["vanillaCupcake", "chocolateCupcake", "berryCupcake"]),
  tart: Object.freeze(["strawberryTart", "mixedFruitTart", "appleTart"]),
  doughnut: Object.freeze(["sugarDoughnut", "chocolateDoughnut", "jamDoughnut"]),
  pie: Object.freeze(["classicApplePie", "latticeApplePie", "caramelApplePie"]),
  carrot: Object.freeze(["classicCarrotCake", "walnutCarrotCake", "miniCarrotCake"]),
  roll: Object.freeze(["cheeseSaladRoll", "hamCheeseRoll", "tunaCucumberRoll"]),
});

function chapter(name, ...families) {
  return Object.freeze({ name, recipes: Object.freeze(families.flatMap((family) => BAKERY_FAMILY_RECIPES[family])) });
}

export const BAKERY_CHAPTERS = Object.freeze([
  chapter("Bakery Foundations", "bread", "croissant"), chapter("Tea Counter", "cupcake", "tart"), chapter("Pie & Doughnut Week", "doughnut", "pie"),
  chapter("Village Oven", "pie", "bread"), chapter("Orchard Display", "pie", "tart"), chapter("Fryer & Cake Rush", "cupcake", "doughnut"),
  chapter("Pastry Party", "croissant", "cupcake"), chapter("Morning Rush", "doughnut", "croissant"), chapter("Picnic Baskets", "roll", "doughnut"),
  chapter("Garden Counter", "tart", "carrot"), chapter("Savoury Harvest", "bread", "carrot"), chapter("Market Lunch", "tart", "roll"),
  chapter("Celebration Orders", "pie", "croissant"), chapter("Village Lunch Rush", "roll", "bread"), chapter("Master Baker", "cupcake", "carrot"),
]);

const LEVEL_COMBINATIONS = Object.freeze([[0, 1, 2, 3], [1, 2, 3, 4], [2, 3, 4, 5], [3, 4, 5, 0], [4, 5, 0, 1], [5, 0, 1, 2], [0, 1, 3, 4], [1, 2, 4, 5], [2, 3, 5, 0], [3, 4, 0, 1]].map(Object.freeze));
const SHIFT_NAMES = Object.freeze(["Opening Shift", "Morning Orders", "Counter Service", "Neighbourhood Orders", "Busy Baskets", "Market Crowd", "Tea Rush", "Weekend Queue", "Celebration Shift", "Chapter Challenge"]);

function workload(level) {
  if (level <= 5) return { customers: 3, dishes: 3 };
  if (level <= 10) return { customers: 3, dishes: 4 };
  if (level <= 15) return { customers: 4, dishes: 4 };
  if (level <= 20) return { customers: 4, dishes: 5 };
  if (level <= 30) return { customers: 5, dishes: 6 };
  if (level <= 40) return { customers: 5, dishes: 7 };
  if (level <= 60) return { customers: 6, dishes: 8 };
  if (level <= 80) return { customers: 6, dishes: 9 };
  if (level <= 100) return { customers: 6, dishes: 10 };
  if (level <= 120) return { customers: 6, dishes: 11 };
  return { customers: 6, dishes: 12 };
}

function generatedPlan(level) {
  const chapterIndex = Math.floor((level - 1) / BAKERY_CONFIG.levelsPerChapter);
  const within = (level - 1) % BAKERY_CONFIG.levelsPerChapter;
  const base = BAKERY_CHAPTERS[chapterIndex].recipes;
  const firstOffset = chapterIndex % 3;
  const secondOffset = (chapterIndex * 2 + 1) % 3;
  const pool = [0, 1, 2].map((index) => base[(index + firstOffset) % 3]).concat([0, 1, 2].map((index) => base[3 + (index + secondOffset) % 3]));
  const chosen = LEVEL_COMBINATIONS[within].map((index) => pool[index]);
  const size = workload(level);
  const pairCount = size.dishes - size.customers;
  const singleCount = size.customers - pairCount;
  const singles = chosen.map((id) => [id]);
  const pairs = [[chosen[0], chosen[1]], [chosen[0], chosen[2]], [chosen[0], chosen[3]], [chosen[1], chosen[2]], [chosen[1], chosen[3]], [chosen[2], chosen[3]]];
  const singleRotation = (within + chapterIndex) % singles.length;
  const pairRotation = (within * 2 + chapterIndex) % pairs.length;
  const plan = singles.slice(singleRotation).concat(singles.slice(0, singleRotation)).slice(0, singleCount)
    .concat(pairs.slice(pairRotation).concat(pairs.slice(0, pairRotation)).slice(0, pairCount));
  const orderRotation = (within + level) % plan.length;
  return [`${BAKERY_CHAPTERS[chapterIndex].name} · ${SHIFT_NAMES[within]}`, plan.slice(orderRotation).concat(plan.slice(0, orderRotation))];
}

function estimatedPrepSeconds(recipeIds) {
  return recipeIds.reduce((sum, id) => sum + BAKERY_RECIPES[id].steps.reduce((seconds, step) => seconds + (BAKERY_APPLIANCES[step] ? BAKERY_APPLIANCES[step].seconds + 0.45 : 0.65), 0) + 1.1, 0);
}

function arrivalGap(level) {
  if (level <= 20) return 24;
  if (level <= 40) return 22;
  if (level <= 60) return 21;
  if (level <= 80) return 20;
  if (level <= 100) return 19;
  if (level <= 120) return 18;
  if (level <= 140) return 17;
  return 16;
}

function buildLevels() {
  const levels = [];
  for (let level = 1; level <= BAKERY_CONFIG.levelCount; level += 1) {
    const [name, plan] = generatedPlan(level);
    const gap = arrivalGap(level);
    const orders = plan.map((recipes, index) => Object.freeze({ at: index * gap, recipes: Object.freeze(recipes) }));
    const target = orders.length;
    let serviceClock = 0;
    let worstWait = 0;
    for (const order of orders) {
      const prep = estimatedPrepSeconds(order.recipes);
      const start = Math.max(serviceClock, order.at);
      worstWait = Math.max(worstWait, start - order.at + prep);
      serviceClock = start + prep;
    }
    const ratio = (level - 1) / (BAKERY_CONFIG.levelCount - 1);
    const duration = Math.max(100, Math.ceil(serviceClock + Math.round(48 - ratio * 28)));
    const patience = Math.max(55, Math.ceil(worstWait + Math.round(36 - ratio * 22)));
    levels.push(Object.freeze({
      level, name, chapter: Math.floor((level - 1) / BAKERY_CONFIG.levelsPerChapter) + 1, duration, target, maxMisses: 0, patience,
      menu: Object.freeze([...new Set(orders.flatMap((order) => order.recipes))]), orders: Object.freeze(orders),
    }));
  }
  return Object.freeze(levels);
}

export const BAKERY_LEVELS = buildLevels();

export function bakeryLevel(number) {
  const level = Math.max(1, Math.min(BAKERY_CONFIG.levelCount, Math.floor(Number(number) || 1)));
  return BAKERY_LEVELS[level - 1];
}

export function bakeryFirstClearCoins(level, stars) {
  const safeLevel = Math.max(1, Math.min(BAKERY_CONFIG.levelCount, Math.floor(Number(level) || 1)));
  const progress = Math.round((safeLevel - 1) * BAKERY_CONFIG.firstClearCampaignCoins / (BAKERY_CONFIG.levelCount - 1));
  return Math.min(BAKERY_CONFIG.firstClearMaxCoins, BAKERY_CONFIG.firstClearBaseCoins + progress + Math.max(0, Math.min(3, Math.floor(Number(stars) || 0))) * BAKERY_CONFIG.starCoins);
}

export function bakeryResultForSession(session) {
  const attempts = session.served + session.missed;
  const accuracy = Math.max(0, Math.min(1, session.served / Math.max(1, attempts + session.mistakes * 0.25)));
  const happiness = session.happiness.length ? session.happiness.reduce((a, b) => a + b, 0) / session.happiness.length : 0;
  const speed = Math.max(0, Math.min(1, session.served / session.level.target));
  const wasteScore = Math.max(0, 1 - session.waste / Math.max(3, session.level.target));
  const score = Math.round(accuracy * 50 + happiness * 25 + speed * 15 + wasteScore * 10);
  const won = session.served >= session.level.target && session.missed <= session.level.maxMisses;
  const stars = !won ? 0 : score >= 90 ? 3 : score >= 75 ? 2 : 1;
  return { won, score, stars, accuracy: Math.round(accuracy * 100), happiness: Math.round(happiness * 100), served: session.served, missed: session.missed, waste: session.waste, mistakes: session.mistakes, bestStreak: session.bestStreak };
}

export function bakeryStep(stepId) {
  return BAKERY_STEP_CATALOG[stepId] || null;
}
