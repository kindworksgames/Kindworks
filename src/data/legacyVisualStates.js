export const NPC_ACTIVITY_VISUALS = Object.freeze([
  Object.freeze({ id: "fishing", match: /fish|angler/i, prop: "🎣", pose: "lean", assetId: "npc.activity.fishing-rod" }),
  Object.freeze({ id: "watering", match: /water|garden|allotment/i, prop: "🪣", pose: "lean", assetId: "npc.activity.watering-can" }),
  Object.freeze({ id: "disposal", match: /bin|rubbish|recycl|dispose/i, prop: "♻️", pose: "carry", assetId: "npc.activity.waste-bag" }),
  Object.freeze({ id: "eating", match: /eat|lunch|dinner|breakfast|café|coffee/i, prop: "🥪", pose: "seated", assetId: "npc.activity.food" }),
  Object.freeze({ id: "helping", match: /help|volunteer|repair|clean/i, prop: "🧰", pose: "work", assetId: "npc.activity.toolbox" }),
  Object.freeze({ id: "social", match: /chat|visit|social|friend|play/i, prop: "💬", pose: "wave", assetId: "npc.activity.conversation" }),
]);

export function npcActivityVisual(activity, actionState = "") {
  if (String(actionState).toUpperCase() === "HELPING") return NPC_ACTIVITY_VISUALS.find(({ id }) => id === "helping");
  return NPC_ACTIVITY_VISUALS.find(({ match }) => match.test(String(activity || ""))) || Object.freeze({ id: "idle", prop: "", pose: "stand", assetId: "npc.activity.idle" });
}

export const ANIMAL_ANATOMY_VISUALS = Object.freeze({
  feline: Object.freeze({ ears: "triangle", tail: "curl", muzzle: "short", assetId: "animal.anatomy.feline" }),
  canine: Object.freeze({ ears: "point", tail: "sweep", muzzle: "long", assetId: "animal.anatomy.canine" }),
  hopper: Object.freeze({ ears: "long", tail: "puff", muzzle: "short", assetId: "animal.anatomy.rabbit" }),
  waterBird: Object.freeze({ beak: "broad", tail: "fan", feet: "webbed", assetId: "animal.anatomy.water-bird" }),
  bird: Object.freeze({ beak: "point", wings: "folded", tail: "fan", assetId: "animal.anatomy.bird" }),
  equine: Object.freeze({ ears: "upright", mane: true, tail: "long", assetId: "animal.anatomy.equine" }),
  stocky: Object.freeze({ ears: "round", tail: "short", muzzle: "broad", assetId: "animal.anatomy.stocky" }),
  fish: Object.freeze({ fins: true, tail: "fin", assetId: "animal.anatomy.fish" }),
  flutter: Object.freeze({ wings: "open", antennae: true, assetId: "animal.anatomy.insect" }),
  frog: Object.freeze({ eyes: "raised", legs: "spring", assetId: "animal.anatomy.frog" }),
  turtle: Object.freeze({ shell: true, feet: "paddle", assetId: "animal.anatomy.turtle" }),
  snail: Object.freeze({ shell: true, antennae: true, assetId: "animal.anatomy.snail" }),
  dino: Object.freeze({ horns: 3, frill: true, tail: "long", assetId: "animal.anatomy.triceratops" }),
  "small-mammal": Object.freeze({ ears: "round", tail: "long", assetId: "animal.anatomy.small-mammal" }),
  "river-mammal": Object.freeze({ ears: "round", tail: "paddle", assetId: "animal.anatomy.river-mammal" }),
  farm: Object.freeze({ ears: "upright", tail: "short", assetId: "animal.anatomy.farm" }),
});

export const CROP_STAGE_VISUALS = Object.freeze([
  Object.freeze({ id: "seed", progress: 0, assetId: "farm.crop.stage.seed" }),
  Object.freeze({ id: "sprout", progress: 0.18, assetId: "farm.crop.stage.sprout" }),
  Object.freeze({ id: "growing", progress: 0.48, assetId: "farm.crop.stage.growing" }),
  Object.freeze({ id: "flowering", progress: 0.78, assetId: "farm.crop.stage.flowering" }),
  Object.freeze({ id: "ready", progress: 1, assetId: "farm.crop.stage.ready" }),
]);

export const ORCHARD_STAGE_VISUALS = Object.freeze(["sapling", "young", "mature", "fruiting", "picked"].map((id) => Object.freeze({ id, assetId: `farm.orchard.stage.${id}` })));

export const HOUSE_ARCHITECTURE_KITS = Object.freeze([
  Object.freeze({ id: "starter-cottage", label: "Starter Cottage", roof: "gable", feature: "compact", body: Object.freeze({ x: -72, y: -5, w: 144, h: 55 }), roofShape: Object.freeze({ left: -82, right: 82, eaveY: -4, topY: -52 }), windows: Object.freeze([{ x: -46, y: 17 }, { x: 46, y: 17 }]), chimneyX: 43, interior: Object.freeze({ level: 1, width: 720, height: 440 }), assetId: "building.house.kit.starter-cottage" }),
  Object.freeze({ id: "bay-cottage", label: "Bay Cottage", roof: "hip", feature: "bay", body: Object.freeze({ x: -86, y: -4, w: 172, h: 54 }), roofShape: Object.freeze({ left: -96, right: 96, eaveY: -3, topY: -49 }), windows: Object.freeze([{ x: -53, y: 17 }, { x: 51, y: 19, bay: true }]), chimneyX: -55, interior: Object.freeze({ level: 2, width: 755, height: 455 }), assetId: "building.house.kit.bay-cottage" }),
  Object.freeze({ id: "cross-gable", label: "Cross-Gable Home", roof: "gable", feature: "cross-gable", body: Object.freeze({ x: -88, y: -2, w: 176, h: 52 }), roofShape: Object.freeze({ left: -98, right: 98, eaveY: -1, topY: -48 }), windows: Object.freeze([{ x: -54, y: 18 }, { x: 53, y: 18 }]), chimneyX: -57, interior: Object.freeze({ level: 2, width: 780, height: 470 }), assetId: "building.house.kit.cross-gable" }),
  Object.freeze({ id: "two-storey", label: "Two-Storey Home", roof: "gable", feature: "two-storey", body: Object.freeze({ x: -76, y: -35, w: 152, h: 85 }), roofShape: Object.freeze({ left: -86, right: 86, eaveY: -34, topY: -72 }), windows: Object.freeze([{ x: -43, y: -19 }, { x: 43, y: -19 }, { x: -47, y: 20 }, { x: 47, y: 20 }]), chimneyX: 47, interior: Object.freeze({ level: 3, width: 805, height: 495 }), assetId: "building.house.kit.two-storey" }),
  Object.freeze({ id: "grand-veranda", label: "Grand Veranda Home", roof: "hip", feature: "veranda", body: Object.freeze({ x: -90, y: -7, w: 180, h: 57 }), roofShape: Object.freeze({ left: -101, right: 101, eaveY: -6, topY: -55 }), windows: Object.freeze([{ x: -57, y: 16 }, { x: 57, y: 16 }]), chimneyX: -62, interior: Object.freeze({ level: 3, width: 835, height: 510 }), assetId: "building.house.kit.grand-veranda" }),
]);

export const PERSONAL_HOME_ARCHITECTURE_KITS = Object.freeze(["starter-cottage", "bay-cottage", "two-storey", "grand-veranda"]);

export function houseArchitectureKit(id) {
  return HOUSE_ARCHITECTURE_KITS.find((kit) => kit.id === id) || HOUSE_ARCHITECTURE_KITS[0];
}

export const FURNITURE_VISUAL_CATALOG = Object.freeze(["bed", "table", "chair", "sofa", "shelf", "hearth", "lamp", "plant", "record-player", "pet-bed", "aquarium", "wardrobe"].map((id) => Object.freeze({ id, assetId: `interior.furniture.${id}` })));

export const SHOP_VISUAL_STATES = Object.freeze({
  "Corner Café": Object.freeze({ kind: "cafe", sign: "CORNER CAFE", wall: 0xe7c994, roof: 0xc97a45, width: 220, height: 92, fixture: "café-window", merchandise: ["☕", "🥪"], assetId: "shop.corner-cafe.exterior" }),
  "Village Grocer": Object.freeze({ kind: "grocer", sign: "GROCER", wall: 0xd7d49a, roof: 0x6f9258, width: 230, height: 94, fixture: "produce-crates", merchandise: ["🥕", "🍎"], assetId: "shop.village-grocer.exterior" }),
  "Little Bakery": Object.freeze({ kind: "bakery", sign: "BAKERY", wall: 0xefc7a7, roof: 0xcb715e, width: 210, height: 92, fixture: "bread-window", merchandise: ["🥖", "🥐"], assetId: "shop.little-bakery.exterior" }),
  "Riverside Kitchen": Object.freeze({ kind: "restaurant", sign: "RIVERSIDE KITCHEN", wall: 0xdec6a0, roof: 0xb75e48, width: 198, height: 88, fixture: "restaurant-terrace", merchandise: ["🍽️", "🥘"], assetId: "shop.riverside-kitchen.exterior" }),
  "The Willow Arms": Object.freeze({ kind: "pub", sign: "WILLOW ARMS", wall: 0xc6bd92, roof: 0x65704f, width: 190, height: 90, fixture: "hanging-pub-sign", merchandise: ["🍺", "🍲"], assetId: "shop.willow-arms.exterior" }),
  "Morning Mug Coffee": Object.freeze({ kind: "coffee", sign: "MORNING MUG", wall: 0xc4d8cf, roof: 0x4f9295, width: 190, height: 86, fixture: "coffee-window", merchandise: ["☕", "🧋"], assetId: "shop.morning-mug.exterior" }),
  "Harbour General": Object.freeze({ kind: "general", sign: "HARBOUR GENERAL", wall: 0xc1ddd7, roof: 0x4f9b91, width: 190, height: 88, fixture: "general-store-display", merchandise: ["🧺", "📰"], assetId: "shop.harbour-general.exterior" }),
  "Riverstone Restaurant": Object.freeze({ kind: "restaurant", sign: "RIVERSTONE", wall: 0xd0bca7, roof: 0x816554, width: 214, height: 92, fixture: "restaurant-terrace", merchandise: ["🍽️", "🍷"], assetId: "shop.riverstone.exterior" }),
  "Fresh Market": Object.freeze({ kind: "market", sign: "FRESH MARKET", wall: 0xd9d6a6, roof: 0x628e50, width: 220, height: 90, fixture: "market-crates", merchandise: ["🥕", "🍎"], assetId: "shop.fresh-market.exterior" }),
  "Paws & Wonders": Object.freeze({ kind: "pet-shop", sign: "PAWS & WONDERS", wall: 0xc7dfc4, roof: 0x52775d, width: 196, height: 86, fixture: "pet-window", merchandise: ["🐾", "🦴"], assetId: "shop.paws-wonders.exterior" }),
  "South Shore Café": Object.freeze({ kind: "beach-cafe", sign: "SOUTH SHORE CAFE", wall: 0xe8ddbb, roof: 0x4e939a, width: 232, height: 102, fixture: "shore-counter", merchandise: ["🍦", "🍧"], assetId: "shop.south-shore.exterior" }),
  "KindWorks Cinema": Object.freeze({ kind: "cinema", sign: "KINDWORKS CINEMA", wall: 0x93515e, roof: 0x493852, width: 225, height: 154, fixture: "cinema-marquee", merchandise: ["🎬", "🍿"], assetId: "shop.kindworks-cinema.exterior" }),
});

export const WORLD_VISUAL_ASSETS = Object.freeze(["mill-walk", "selection-highlight", "pond-duck", "duck-wake", "window-night-glow", "rain-splash", "snow-cap", "ground-stain", "river-pollution", "restoration-sweep", "restoration-check", "coin-flight"].map((id) => Object.freeze({ id, assetId: `world.${id}` })));
