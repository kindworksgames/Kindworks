export const LAZY_SCENE_LOADERS = Object.freeze({
  HouseInteriorScene: () => import("./HouseInteriorScene.js").then((module) => module.HouseInteriorScene),
  VillageGrocerScene: () => import("./VillageGrocerScene.js").then((module) => module.VillageGrocerScene),
  PawsWondersScene: () => import("./PawsWondersScene.js").then((module) => module.PawsWondersScene),
  HarbourGeneralScene: () => import("./HarbourGeneralScene.js").then((module) => module.HarbourGeneralScene),
  BakeryScene: () => import("./BakeryScene.js").then((module) => module.BakeryScene),
  CafeScene: () => import("./CafeScene.js").then((module) => module.CafeScene),
  MorningMugScene: () => import("./MorningMugScene.js").then((module) => module.MorningMugScene),
  RiversideKitchenScene: () => import("./RiversideKitchenScene.js").then((module) => module.RiversideKitchenScene),
  SouthShoreScoopsScene: () => import("./SouthShoreScoopsScene.js").then((module) => module.SouthShoreScoopsScene),
  RiverClearoutScene: () => import("./RiverClearoutScene.js").then((module) => module.RiverClearoutScene),
  HouseRescueScene: () => import("./HouseRescueScene.js").then((module) => module.HouseRescueScene),
  WasteCollectionScene: () => import("./WasteCollectionScene.js").then((module) => module.WasteCollectionScene),
  LawnCareScene: () => import("./LawnCareScene.js").then((module) => module.LawnCareScene),
  BeachCleanupScene: () => import("./BeachCleanupScene.js").then((module) => module.BeachCleanupScene),
  PlaygroundPowerwashScene: () => import("./PlaygroundPowerwashScene.js").then((module) => module.PlaygroundPowerwashScene),
  FishingScene: () => import("./FishingScene.js").then((module) => module.FishingScene),
});

export const LAZY_SCENE_KEYS = Object.freeze(Object.keys(LAZY_SCENE_LOADERS));

export async function ensureLazyScene(scene, key) {
  const manager = scene?.scene?.manager;
  if (!manager) throw new TypeError("A running Phaser scene is required.");
  if (manager.keys?.[key]) return manager.keys[key];
  const loader = LAZY_SCENE_LOADERS[key];
  if (!loader) throw new RangeError(`Unknown lazy scene: ${key}`);
  const SceneClass = await loader();
  manager.add(key, SceneClass, false);
  return manager.keys[key];
}

export async function startLazyScene(scene, key, data) {
  const gameHost = globalThis.document?.querySelector?.("#game");
  gameHost?.setAttribute("data-loading-scene", key);
  try {
    await ensureLazyScene(scene, key);
    scene.scene.start(key, data);
    return true;
  } finally {
    gameHost?.removeAttribute("data-loading-scene");
  }
}
