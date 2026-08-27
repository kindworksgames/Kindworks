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
  Object.freeze({ id: "willow-gable", roof: "gable", detail: "brick-chimney", assetId: "building.house.kit.willow-gable" }),
  Object.freeze({ id: "market-hip", roof: "hip", detail: "flower-box", assetId: "building.house.kit.market-hip" }),
  Object.freeze({ id: "reedbank-cottage", roof: "thatch", detail: "round-window", assetId: "building.house.kit.reedbank-cottage" }),
  Object.freeze({ id: "east-bay", roof: "bay", detail: "awning", assetId: "building.house.kit.east-bay" }),
  Object.freeze({ id: "shore-gambrel", roof: "gambrel", detail: "porch", assetId: "building.house.kit.shore-gambrel" }),
]);

export const FURNITURE_VISUAL_CATALOG = Object.freeze(["bed", "table", "chair", "sofa", "shelf", "hearth", "lamp", "plant", "record-player", "pet-bed", "aquarium", "wardrobe"].map((id) => Object.freeze({ id, assetId: `interior.furniture.${id}` })));

export const SHOP_VISUAL_STATES = Object.freeze({
  "Corner Café": Object.freeze({ fixture: "café-counter", merchandise: ["☕", "🥪"], assetId: "shop.corner-cafe.exterior" }),
  "Village Grocer": Object.freeze({ fixture: "produce-crates", merchandise: ["🥕", "🥬", "🍎"], assetId: "shop.village-grocer.exterior" }),
  "Little Bakery": Object.freeze({ fixture: "bread-window", merchandise: ["🥖", "🥐", "🧁"], assetId: "shop.little-bakery.exterior" }),
  "Riverside Kitchen": Object.freeze({ fixture: "restaurant-awning", merchandise: ["🍽️", "🥘"], assetId: "shop.riverside-kitchen.exterior" }),
  "Morning Mug Coffee": Object.freeze({ fixture: "coffee-window", merchandise: ["☕", "🧋"], assetId: "shop.morning-mug.exterior" }),
  "Harbour General": Object.freeze({ fixture: "general-store-crates", merchandise: ["🧺", "🧴", "📰"], assetId: "shop.harbour-general.exterior" }),
  "Paws & Wonders": Object.freeze({ fixture: "pet-window", merchandise: ["🐾", "🦴"], assetId: "shop.paws-wonders.exterior" }),
  "South Shore Café": Object.freeze({ fixture: "shore-counter", merchandise: ["🍦", "🍧"], assetId: "shop.south-shore.exterior" }),
});

export const WORLD_VISUAL_ASSETS = Object.freeze(["mill-walk", "selection-highlight", "pond-duck", "duck-wake", "window-night-glow", "rain-splash", "snow-cap", "ground-stain", "river-pollution", "restoration-sweep", "restoration-check", "coin-flight"].map((id) => Object.freeze({ id, assetId: `world.${id}` })));
