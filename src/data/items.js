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
  ["river-minnows", "River Minnows", "🐟", "consumable", 140, "Animal Treats", { retailer: "fresh-market", description: "Small whole fish from Fresh Market or caught at Willowmere's fishing spots." }],
  ["fresh-sardines", "Fresh Sardines", "🐟", "consumable", 220, "Animal Treats", { retailer: "fresh-market", description: "Fresh oily fish for cats and water-loving predators." }],
  ["river-trout", "River Trout", "🐟", "consumable", 360, "Animal Treats", { retailer: "fresh-market", description: "A premium whole fish and favourite of larger fish-eaters." }],
  ["pond-pellets", "Pond Pellets", "🫧", "consumable", 80, "Animal Treats", { retailer: "fresh-market", description: "Balanced floating food for fish, ducks and turtles." }],
  ["chicken-pieces", "Chicken Pieces", "🍗", "consumable", 180, "Animal Treats", { retailer: "fresh-market", description: "Plain fresh chicken portions for dogs, foxes and other suitable carnivores." }],
  ["beef-strips", "Beef Strips", "🥩", "consumable", 260, "Animal Treats", { retailer: "fresh-market", description: "Fresh beef strips for larger meat-eating companions." }],
  ["prepared-meat", "Prepared Meat Bites", "🍖", "consumable", 210, "Animal Treats", { retailer: "fresh-market", description: "Small plain meat bites prepared safely for cats and dogs." }],
  ["reedbank-roach", "Reedbank Roach", "🐟", "consumable", 0, "Fishing Finds", { fishingOnly: true }],
  ["lily-perch", "Lily Perch", "🐠", "consumable", 0, "Fishing Finds", { fishingOnly: true }],
  ["golden-tench", "Golden Tench", "🐟", "consumable", 0, "Fishing Finds", { fishingOnly: true }],
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

export const ITEM_CATALOG = Object.freeze(Object.fromEntries(itemRows.map((row) => {
  const [id, name, icon, category, price, shopGroup, flags = {}] = row;
  return [id, Object.freeze({ id, name, icon, category, price, shopGroup, ...flags })];
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

export function validateItemCatalog(catalog = ITEM_CATALOG) {
  const errors = [];
  const ids = Object.keys(catalog);
  if (ids.length !== CATALOGUE_SIZE || ids.length < LEGACY_CATALOGUE_SIZE) errors.push(`Expected ${CATALOGUE_SIZE} current catalogue entries, found ${ids.length}.`);
  for (const [key, item] of Object.entries(catalog)) {
    if (item.id !== key) errors.push(`${key} has a mismatched item id.`);
    if (!item.name || !item.icon || !item.shopGroup) errors.push(`${key} is missing display metadata.`);
    if (!Number.isInteger(item.price) || item.price < 0) errors.push(`${key} has an invalid price.`);
    if (!["equipment", "placeable", "consumable", "furniture", "collectible"].includes(item.category)) errors.push(`${key} has an invalid category.`);
  }
  for (const id of ["starter-mower", "starter-vacuum"]) if (!catalog[id]?.ownedByDefault) errors.push(`${id} must remain a default item.`);
  return { ok: errors.length === 0, errors };
}
