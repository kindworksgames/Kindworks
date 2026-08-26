const itemRows = [
  ["carrot-seeds", "Carrot Seeds", "🥕", "consumable", 30, "Farming", { retailer: "town-grocer", inventoryLimit: 99 }],
  ["fresh-greens-seeds", "Greens Seeds", "🥬", "consumable", 80, "Farming", { retailer: "town-grocer", inventoryLimit: 99 }],
  ["wild-berry-starters", "Berry Starters", "🫐", "consumable", 120, "Farming", { retailer: "town-grocer", inventoryLimit: 99 }],
  ["allotment-carrot", "Allotment Carrot", "🥕", "consumable", 0, "Farm Harvests", { farmingOnly: true, inventoryLimit: 99 }],
  ["orchard-apple", "Orchard Apple", "🍎", "consumable", 0, "Farm Harvests", { farmingOnly: true, inventoryLimit: 99 }],
  ["mixed-seeds", "Mixed Bird Seed", "🌾", "consumable", 60, "Animal Treats", { retailer: "town-grocer" }],
  ["sunflower-seeds", "Sunflower Seeds", "🌻", "consumable", 90, "Animal Treats", { retailer: "town-grocer" }],
  ["fresh-greens", "Fresh Greens", "🥬", "consumable", 70, "Animal Treats", { retailer: "town-grocer" }],
  ["wild-berries", "Wild Berries", "🫐", "consumable", 100, "Animal Treats", { retailer: "town-grocer" }],
  ["mealworms", "Mealworms", "🪱", "consumable", 120, "Animal Treats", { retailer: "town-grocer" }],
  ["river-minnows", "River Minnows", "🐟", "consumable", 140, "Animal Treats", { retailer: "fresh-market", inventoryLimit: 99, description: "Small whole fish from Fresh Market or caught at Willowmere's fishing spots." }],
  ["fresh-sardines", "Fresh Sardines", "🐟", "consumable", 220, "Animal Treats", { retailer: "fresh-market", inventoryLimit: 99, description: "Fresh oily fish for cats and water-loving predators." }],
  ["river-trout", "River Trout", "🐟", "consumable", 360, "Animal Treats", { retailer: "fresh-market", inventoryLimit: 99, description: "A premium whole fish and favourite of larger fish-eaters." }],
  ["pond-pellets", "Pond Pellets", "🫧", "consumable", 80, "Animal Treats", { retailer: "fresh-market", description: "Balanced floating food for fish, ducks and turtles." }],
  ["chicken-pieces", "Chicken Pieces", "🍗", "consumable", 180, "Animal Treats", { retailer: "fresh-market", description: "Plain fresh chicken portions for dogs, foxes and other suitable carnivores." }],
  ["beef-strips", "Beef Strips", "🥩", "consumable", 260, "Animal Treats", { retailer: "fresh-market", description: "Fresh beef strips for larger meat-eating companions." }],
  ["prepared-meat", "Prepared Meat Bites", "🍖", "consumable", 210, "Animal Treats", { retailer: "fresh-market", description: "Small plain meat bites prepared safely for cats and dogs." }],
  ["reedbank-roach", "Reedbank Roach", "🐟", "consumable", 0, "Fishing Finds", { fishingOnly: true, inventoryLimit: 99 }],
  ["lily-perch", "Lily Perch", "🐠", "consumable", 0, "Fishing Finds", { fishingOnly: true, inventoryLimit: 99 }],
  ["golden-tench", "Golden Tench", "🐟", "consumable", 0, "Fishing Finds", { fishingOnly: true, inventoryLimit: 99 }],
  ["pond-goldfish", "Goldfish", "🐠", "collectible", 0, "Fishing Finds", { fishingOnly: true, aquariumFish: true }],
  ["reedbank-koi", "Koi", "🎏", "collectible", 0, "Fishing Finds", { fishingOnly: true, aquariumFish: true }],
  ["pond-angelfish", "Angelfish", "🐠", "collectible", 0, "Fishing Finds", { fishingOnly: true, aquariumFish: true }],
  ["oranda-goldfish", "Oranda Goldfish", "🐡", "collectible", 0, "Fishing Finds", { fishingOnly: true, aquariumFish: true }],
  ["cosy-sofa", "Cosy Sofa", "🛋️", "furniture", 2400, "Furniture"],
  ["reading-armchair", "Reading Armchair", "🪑", "furniture", 1600, "Furniture"],
  ["oak-coffee-table", "Oak Coffee Table", "🟫", "furniture", 1300, "Furniture"],
  ["tall-bookshelf", "Tall Bookshelf", "📚", "furniture", 2100, "Furniture"],
  ["glow-floor-lamp", "Glow Floor Lamp", "💡", "furniture", 1100, "Furniture"],
  ["leafy-house-plant", "Leafy House Plant", "🪴", "furniture", 850, "Furniture"],
  ["woven-home-rug", "Woven Home Rug", "🧶", "furniture", 1400, "Furniture"],
  ["record-player", "Record Player", "🎶", "furniture", 2800, "Furniture"],
  ["companion-basket", "Companion Basket", "🐾", "furniture", 1800, "Furniture"],
  ["ornamental-fish-tank", "Ornamental Fish Tank", "🐠", "furniture", 6500, "Furniture", { unique: true }],
  ["starter-vacuum", "Starter Vacuum", "🧹", "equipment", 0, "Vacuums", { ownedByDefault: true, slot: "vacuum" }],
  ["swift-sweep-vacuum", "Swift Sweep", "🌀", "equipment", 5000, "Vacuums", { slot: "vacuum" }],
  ["cyclone-pro-vacuum", "Cyclone Pro", "🌪️", "equipment", 15000, "Vacuums", { slot: "vacuum" }],
  ["deep-clean-vacuum", "Deep Clean 4000", "✨", "equipment", 35000, "Vacuums", { slot: "vacuum" }],
  ["kindworks-turbo-vacuum", "KindWorks Turbo", "⚡", "equipment", 70000, "Vacuums", { slot: "vacuum" }],
  ["starter-mower", "Old Green Mower", "🚜", "equipment", 0, "Mowers", { ownedByDefault: true, slot: "mower" }],
  ["cherry-compact-mower", "Cherry Red Compact", "🔴", "equipment", 2000, "Mowers", { slot: "mower" }],
  ["classic-yellow-mower", "Classic Yellow", "🟡", "equipment", 7500, "Mowers", { slot: "mower" }],
  ["swiftcut-mower", "SwiftCut", "🏎️", "equipment", 12000, "Mowers", { slot: "mower" }],
  ["meadow-pro-mower", "Meadow Pro", "⚡", "equipment", 20000, "Mowers", { slot: "mower" }],
  ["vintage-special-mower", "Vintage Special", "✨", "equipment", 30000, "Mowers", { slot: "mower" }],
  ["young-maple", "Young Maple", "🌳", "placeable", 1500, "Trees"],
  ["oak-tree", "Oak Tree", "🌳", "placeable", 2500, "Trees"],
  ["silver-birch", "Silver Birch", "🌲", "placeable", 1800, "Trees"],
  ["willow-tree", "Willow Tree", "🌿", "placeable", 3000, "Trees"],
  ["flowering-cherry", "Flowering Cherry", "🌸", "placeable", 3500, "Trees"],
  ["pine-tree", "Pine Tree", "🌲", "placeable", 1500, "Trees"],
  ["apple-tree", "Apple Tree", "🍎", "placeable", 2800, "Trees"],
  ["flowering-tree", "Magnolia Tree", "🌺", "placeable", 4000, "Trees"],
  ["grand-oak", "Grand Oak", "🌳", "placeable", 7500, "Trees"],
  ["wooden-bench", "Wooden Bench", "🪑", "placeable", 2000, "Seating"],
  ["green-bench", "Painted Green Bench", "🪑", "placeable", 2500, "Seating"],
  ["iron-bench", "Iron Town Bench", "🪑", "placeable", 3500, "Seating"],
  ["riverside-bench", "Riverside Bench", "🪑", "placeable", 3000, "Seating"],
  ["picnic-table", "Picnic Table", "🧺", "placeable", 5000, "Seating"],
  ["small-town-bin", "Small Town Bin", "🗑️", "placeable", 2500, "Bins"],
  ["park-bin", "Park Rubbish Bin", "🗑️", "placeable", 3500, "Bins"],
  ["recycling-bin", "Recycling Bin", "♻️", "placeable", 4500, "Bins"],
  ["commercial-bin", "Large Commercial Bin", "🗑️", "placeable", 6000, "Bins"],
  ["town-planter", "Town Planter", "🌿", "placeable", 800, "Decorations"],
  ["flower-barrel", "Flower Barrel", "🌼", "placeable", 1000, "Decorations"],
  ["lamp-post", "Lamp Post", "💡", "placeable", 1500, "Decorations"],
  ["bird-bath", "Bird Bath", "🐦", "placeable", 1800, "Decorations"],
  ["wooden-sign", "Wooden Sign", "🪧", "placeable", 900, "Decorations"],
  ["hedge-clump", "Hedge Clump", "🌿", "placeable", 800, "Decorations"],
  ["decorative-rock", "Decorative Rock", "🪨", "placeable", 800, "Decorations"],
  ["small-fountain", "Small Fountain", "⛲", "placeable", 8000, "Decorations"],
  ["town-clock", "Willowmere Town Clock", "🕰️", "placeable", 15000, "Decorations"],
  ["picnic-blanket", "Picnic Blanket", "🧺", "placeable", 1500, "Decorations"],
  ["kindly-heart-planter", "Kindly Heart Planter", "💚", "placeable", 0, "Decorations", { subscriptionOnly: true }],
  ["__qa-fast-mower", "QA Swift Mower", "🚜", "equipment", 1500, "QA", { qaOnly: true, slot: "mower" }],
  ["__qa-young-tree", "QA Young Tree", "🌳", "placeable", 250, "QA", { qaOnly: true }],
  ["__qa-town-bin", "QA Town Bin", "🗑️", "placeable", 500, "QA", { qaOnly: true }],
  ["premium-picnic-area", "Premium Picnic Area", "🧺", "placeable", 10000, "Seating"],
  ["grand-fountain", "Grand Willowmere Fountain", "⛲", "placeable", 25000, "Decorations"],
  ["willowmere-gazebo", "Willowmere Gazebo", "🏛️", "placeable", 40000, "Decorations"],
  ["town-centre-monument", "Town Centre Monument", "🏆", "placeable", 75000, "Decorations"],
];

export const SHOP_GROUPS = Object.freeze(["Mowers", "Vacuums", "Trees", "Seating", "Bins", "Decorations", "Furniture", "Animal Treats", "Farming"]);
export const EQUIPMENT_UPGRADE_ORDERS = Object.freeze({
  mower: Object.freeze(["starter-mower", "cherry-compact-mower", "classic-yellow-mower", "swiftcut-mower", "meadow-pro-mower", "vintage-special-mower"]),
  vacuum: Object.freeze(["starter-vacuum", "swift-sweep-vacuum", "cyclone-pro-vacuum", "deep-clean-vacuum", "kindworks-turbo-vacuum"]),
});

const LEGACY_ITEM_METADATA = Object.freeze({
  "starter-mower": { description: "The dependable starter mower. Standard mowing speed.", effect: { mowerSpeedMultiplier: 1, bonusGas: 0, mowerColor: "#246b3a", mowerIcon: "🚜" } },
  "cherry-compact-mower": { description: "A nimble red mower with a small speed boost.", unlock: { game: "lawn", perfects: 3 }, effect: { mowerSpeedMultiplier: 1.05, bonusGas: 0, mowerColor: "#b94e45", mowerIcon: "🚜" } },
  "classic-yellow-mower": { description: "A cheerful classic with a useful speed boost.", unlock: { game: "lawn", perfects: 8 }, effect: { mowerSpeedMultiplier: 1.1, bonusGas: 0, mowerColor: "#d4a832", mowerIcon: "🚜" } },
  "swiftcut-mower": { description: "Fast movement for tougher lawns.", unlock: { game: "lawn", perfects: 15 }, effect: { mowerSpeedMultiplier: 1.25, bonusGas: 0, mowerColor: "#3f7f98", mowerIcon: "🏎️" } },
  "meadow-pro-mower": { description: "A premium mower with much faster movement.", unlock: { game: "lawn", perfects: 30 }, effect: { mowerSpeedMultiplier: 1.45, bonusGas: 0, mowerColor: "#684f93", mowerIcon: "⚡" } },
  "vintage-special-mower": { description: "A prestige vintage mower with top-tier mowing speed.", unlock: { game: "lawn", perfects: 50 }, effect: { mowerSpeedMultiplier: 1.65, bonusGas: 0, mowerColor: "#a8673e", mowerIcon: "🚜" } },
  "starter-vacuum": { description: "A reliable first vacuum with standard cleaning power and reach.", effect: { vacuumPower: 1, vacuumRadius: 36, vacuumSpeedMultiplier: 1, vacuumColor: "#d56155" } },
  "swift-sweep-vacuum": { description: "A stronger vacuum that removes two layers of grime per pass.", effect: { vacuumPower: 2, vacuumRadius: 40, vacuumSpeedMultiplier: 1.08, vacuumColor: "#4e91b8" } },
  "cyclone-pro-vacuum": { description: "Wide cleaning reach and three layers of stain removal per pass.", effect: { vacuumPower: 3, vacuumRadius: 44, vacuumSpeedMultiplier: 1.16, vacuumColor: "#6f68a8" } },
  "deep-clean-vacuum": { description: "A premium cleaner that cuts through four layers of stubborn grime.", effect: { vacuumPower: 4, vacuumRadius: 48, vacuumSpeedMultiplier: 1.25, vacuumColor: "#2e8a73" } },
  "kindworks-turbo-vacuum": { description: "The ultimate wide-head vacuum. Even five-layer stains clear in one pass.", effect: { vacuumPower: 5, vacuumRadius: 52, vacuumSpeedMultiplier: 1.35, vacuumColor: "#b47a2e" } },
  "willow-tree": { unlock: { game: "river", perfects: 1 } },
  "flowering-cherry": { unlock: { game: "lawn", perfects: 5 } },
  "apple-tree": { unlock: { game: "waste", perfects: 2 } },
  "flowering-tree": { unlock: { game: "lawn", perfects: 10 } },
  "grand-oak": { unlock: { game: "lawn", perfects: 20 } },
  "iron-bench": { unlock: { game: "waste", perfects: 3 } },
  "riverside-bench": { unlock: { game: "river", perfects: 2 } },
  "picnic-table": { unlock: { game: "waste", perfects: 4 } },
  "recycling-bin": { unlock: { game: "waste", perfects: 5 } },
  "commercial-bin": { unlock: { game: "waste", perfects: 10 } },
  "small-fountain": { unlock: { game: "river", perfects: 5 } },
  "town-clock": { unlock: { game: "waste", perfects: 15 } },
  "premium-picnic-area": { unlock: { game: "waste", perfects: 10 } },
  "grand-fountain": { unlock: { game: "river", perfects: 12 } },
  "willowmere-gazebo": { unlock: { game: "lawn", perfects: 40 } },
  "town-centre-monument": { unlock: { game: "waste", perfects: 30 } },
});

const placeableMetadata = (placeableType, minRiverDistance, minRoadClearance, description, effect = {}) => ({
  description,
  placeableType,
  placementRules: { minRiverDistance, minRoadClearance },
  effect,
});

const LEGACY_PLACEABLE_METADATA = Object.freeze({
  "young-maple": placeableMetadata("tree", 125, 20, "A young maple that grows into a leafy shade tree.", { npcReaction: "💚", npcDestination: true, interactionKind: "tree", treeStyle: "maple" }),
  "oak-tree": placeableMetadata("tree", 125, 20, "A broad, sturdy oak for parks and neighbourhood greens.", { npcReaction: "🌿", npcDestination: true, interactionKind: "tree", treeStyle: "oak" }),
  "silver-birch": placeableMetadata("tree", 125, 20, "A light, slender birch that grows quickly.", { npcReaction: "🌿", npcDestination: true, interactionKind: "tree", treeStyle: "birch" }),
  "willow-tree": placeableMetadata("tree", 110, 18, "A graceful willow suited to riverside greens.", { npcReaction: "💚", npcDestination: true, interactionKind: "tree", treeStyle: "willow" }),
  "flowering-cherry": placeableMetadata("tree", 125, 20, "Pink blossoms make this a cheerful neighbourhood tree.", { npcReaction: "🌿", npcDestination: true, interactionKind: "tree", treeStyle: "cherry" }),
  "pine-tree": placeableMetadata("tree", 125, 20, "An evergreen pine for woodland-style corners.", { npcReaction: "🌿", npcDestination: true, interactionKind: "tree", treeStyle: "pine" }),
  "apple-tree": placeableMetadata("tree", 125, 20, "A fruit tree residents occasionally stop to admire.", { npcReaction: "🌿", npcDestination: true, interactionKind: "tree", treeStyle: "apple" }),
  "flowering-tree": placeableMetadata("tree", 125, 20, "A premium flowering tree for a special corner of town.", { npcReaction: "🌿", npcDestination: true, interactionKind: "tree", treeStyle: "magnolia" }),
  "grand-oak": placeableMetadata("tree", 135, 25, "A large aspirational tree that becomes a local gathering point.", { npcReaction: "💚", npcDestination: true, interactionKind: "tree", treeStyle: "grand-oak" }),
  "wooden-bench": placeableMetadata("bench", 112, 8, "A simple two-person bench residents can actually use.", { npcReaction: "💬", npcDestination: true, interactionKind: "bench", capacity: 2 }),
  "green-bench": placeableMetadata("bench", 112, 8, "A classic painted bench for parks and residential streets.", { npcReaction: "💬", npcDestination: true, interactionKind: "bench", capacity: 2, benchStyle: "green" }),
  "iron-bench": placeableMetadata("bench", 112, 8, "A sturdier town-centre bench with a darker finish.", { npcReaction: "💬", npcDestination: true, interactionKind: "bench", capacity: 2, benchStyle: "iron" }),
  "riverside-bench": placeableMetadata("bench", 104, 8, "Designed for river paths and quiet views.", { npcReaction: "💬", npcDestination: true, interactionKind: "bench", capacity: 2, benchStyle: "riverside" }),
  "picnic-table": placeableMetadata("bench", 112, 12, "A larger social spot where residents can gather.", { npcReaction: "🧺", npcDestination: true, interactionKind: "picnic", capacity: 4, benchStyle: "picnic" }),
  "small-town-bin": placeableMetadata("bin", 110, 7, "A compact functional bin residents can walk to and use.", { npcReaction: "🗑️", npcBin: true, binCapacity: 8 }),
  "park-bin": placeableMetadata("bin", 110, 7, "A larger public bin that residents physically walk to and use.", { npcReaction: "🗑️", npcBin: true, binCapacity: 12 }),
  "recycling-bin": placeableMetadata("bin", 110, 7, "A high-capacity recycling point unlocked through Waste Collection.", { npcReaction: "♻️", npcBin: true, binCapacity: 16 }),
  "commercial-bin": placeableMetadata("bin", 110, 7, "A large bin for busy commercial streets and café areas.", { npcReaction: "🗑️", npcBin: true, binCapacity: 25 }),
  "town-planter": placeableMetadata("planter", 115, 8, "A simple leafy planter for paths and squares.", { npcReaction: "🌿" }),
  "flower-barrel": placeableMetadata("planter", 115, 8, "A cheerful barrel of flowers.", { npcReaction: "🌼", planterStyle: "flower" }),
  "lamp-post": placeableMetadata("lamp", 115, 8, "A street lamp that automatically glows after dark.", { npcReaction: "💡", nightGlow: true }),
  "bird-bath": placeableMetadata("birdbath", 115, 8, "A small garden feature residents may stop to visit.", { npcReaction: "🐦", npcDestination: true, interactionKind: "birdbath" }),
  "wooden-sign": placeableMetadata("sign", 115, 8, "A rustic sign for paths and neighbourhood corners.", { npcReaction: "🪧" }),
  "hedge-clump": placeableMetadata("hedge", 115, 8, "A rounded hedge for shaping little garden spaces.", { npcReaction: "🌿" }),
  "decorative-rock": placeableMetadata("rock", 115, 8, "A simple natural accent for gardens and riverbanks.", { npcReaction: "✨" }),
  "small-fountain": placeableMetadata("fountain", 125, 18, "An aspirational fountain that becomes a resident destination.", { npcReaction: "⛲", npcDestination: true, interactionKind: "fountain" }),
  "town-clock": placeableMetadata("clock", 125, 14, "A landmark clock for a fully restored town centre.", { npcReaction: "🕰️", npcDestination: true, interactionKind: "landmark" }),
  "picnic-blanket": placeableMetadata("picnic", 115, 14, "A cosy recreation spot residents can visit.", { npcReaction: "🧺", npcDestination: true, interactionKind: "picnic" }),
  "kindly-heart-planter": placeableMetadata("planter", 115, 8, "A KindlyClub Champion keepsake for the town.", { npcReaction: "💚", planterStyle: "kindly-heart" }),
  "__qa-young-tree": placeableMetadata("tree", 145, 22, "Hidden placement test tree.", { npcDestination: true, interactionKind: "tree" }),
  "__qa-town-bin": placeableMetadata("bin", 125, 8, "Hidden placement test bin.", { npcBin: true, binCapacity: 8 }),
  "premium-picnic-area": placeableMetadata("picnic", 120, 18, "A large social picnic setup for a busy park or riverside green.", { npcReaction: "🧺", npcDestination: true, interactionKind: "picnic", capacity: 6 }),
  "grand-fountain": placeableMetadata("fountain", 145, 28, "A large landmark fountain for a major public square.", { npcReaction: "⛲", npcDestination: true, interactionKind: "fountain", capacity: 6 }),
  "willowmere-gazebo": placeableMetadata("gazebo", 150, 30, "A prestige gathering place for parks and large open greens.", { npcReaction: "🎉", npcDestination: true, interactionKind: "gazebo", capacity: 6 }),
  "town-centre-monument": placeableMetadata("monument", 145, 24, "A long-term prestige landmark celebrating Willowmere's restoration.", { npcReaction: "✨", npcDestination: true, interactionKind: "landmark", capacity: 5 }),
});

function freezeMetadata(value) {
  if (!value || typeof value !== "object") return value;
  for (const child of Object.values(value)) if (child && typeof child === "object" && !Object.isFrozen(child)) freezeMetadata(child);
  return Object.freeze(value);
}

export const ITEM_CATALOG = Object.freeze(Object.fromEntries(itemRows.map((row) => {
  const [id, name, icon, category, price, shopGroup, flags = {}] = row;
  const metadata = structuredClone({ ...(LEGACY_ITEM_METADATA[id] || {}), ...(LEGACY_PLACEABLE_METADATA[id] || {}) });
  return [id, freezeMetadata({ id, name, icon, category, price, shopGroup, ...metadata, ...flags })];
})));

export const ITEM_IDS = Object.freeze(Object.keys(ITEM_CATALOG));
export const INVENTORY_BUCKETS = Object.freeze(["equipment", "placeables", "consumables", "furniture"]);
export const INVENTORY_STACK_LIMIT = 9999;
export const LEGACY_CATALOGUE_SIZE = 76;
export const CATALOGUE_SIZE = itemRows.length;

export function inventoryBucketFor(item) {
  if (item?.category === "equipment") return "equipment";
  if (item?.category === "placeable") return "placeables";
  if (item?.category === "consumable") return "consumables";
  if (item?.category === "furniture") return "furniture";
  return null;
}

export function inventoryLimitFor(item) {
  return item?.category === "equipment" || item?.unique ? 1 : item?.inventoryLimit || INVENTORY_STACK_LIMIT;
}

export function placeableFootprintFor(item) {
  if (!item) return 30;
  if (["grand-oak", "grand-fountain"].includes(item.id)) return 72;
  if (item.id === "willowmere-gazebo") return 78;
  if (item.id === "town-centre-monument") return 58;
  if (item.id === "premium-picnic-area") return 60;
  if (item.placeableType === "tree") return 50;
  if (item.id === "picnic-table") return 52;
  if (item.placeableType === "bench") return 42;
  if (item.placeableType === "fountain") return 50;
  if (item.placeableType === "clock") return 42;
  if (item.placeableType === "hedge") return 38;
  if (item.placeableType === "picnic") return 42;
  if (item.placeableType === "bin") return 28;
  if (["planter", "birdbath", "lamp", "sign", "rock"].includes(item.placeableType)) return 30;
  return 32;
}

export function validateItemCatalog(catalog = ITEM_CATALOG) {
  const errors = [];
  const ids = Object.keys(catalog);
  if (ids.length !== CATALOGUE_SIZE || ids.length < LEGACY_CATALOGUE_SIZE) errors.push(`Expected ${CATALOGUE_SIZE} current catalogue entries, found ${ids.length}.`);
  for (const [key, item] of Object.entries(catalog)) {
    if (item.id !== key) errors.push(`${key} has a mismatched item id.`);
    if (!item.name || !item.icon || !item.shopGroup) errors.push(`${key} is missing display metadata.`);
    if (!Number.isInteger(item.price) || item.price < 0) errors.push(`${key} has an invalid price.`);
    if (!["equipment", "placeable", "consumable", "furniture", "collectible"].includes(item.category)) errors.push(`${key} has an invalid category.`);
    if (item.unlock && (!['lawn', 'river', 'waste'].includes(item.unlock.game) || !Number.isInteger(item.unlock.perfects) || item.unlock.perfects < 1)) errors.push(`${key} has an invalid unlock condition.`);
  }
  for (const [slot, order] of Object.entries(EQUIPMENT_UPGRADE_ORDERS)) {
    order.forEach((id, index) => {
      const item = catalog[id];
      if (!item || item.slot !== slot) errors.push(`${id} is missing from the ${slot} upgrade line.`);
      if (slot === "vacuum" && item?.effect?.vacuumPower !== index + 1) errors.push(`${id} has the wrong vacuum power.`);
    });
  }
  for (const id of ["starter-mower", "starter-vacuum"]) if (!catalog[id]?.ownedByDefault) errors.push(`${id} must remain a default item.`);
  return { ok: errors.length === 0, errors };
}
