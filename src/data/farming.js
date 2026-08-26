export const FARMING_SCHEMA_VERSION = 2;

export const ALLOTMENT_CONFIG = Object.freeze({
  bedCount: 6,
  starterUnlockedBeds: 1,
  bedUnlockCosts: Object.freeze([0, 1000, 2500, 4500, 7000, 10000]),
  interaction: Object.freeze({ x: 1340, y: 2250, radius: 190 }),
});

export const FARMING_CROPS = Object.freeze({
  carrot: Object.freeze({ id: "carrot", label: "Carrots", seedLabel: "Carrot Seeds", icon: "🥕", seedId: "carrot-seeds", produceId: "allotment-carrot", growMinutes: 360, seedPrice: 30, harvestYield: 6 }),
  "fresh-greens": Object.freeze({ id: "fresh-greens", label: "Fresh Greens", seedLabel: "Greens Seeds", icon: "🥬", seedId: "fresh-greens-seeds", produceId: "fresh-greens", growMinutes: 420, seedPrice: 80, harvestYield: 4 }),
  "wild-berries": Object.freeze({ id: "wild-berries", label: "Wild Berries", seedLabel: "Berry Starters", icon: "🫐", seedId: "wild-berry-starters", produceId: "wild-berries", growMinutes: 540, seedPrice: 120, harvestYield: 4 }),
});

export const ORCHARD_CONFIG = Object.freeze({
  interaction: Object.freeze({ x: 3070, y: 300, radius: 190 }),
  starterPosition: Object.freeze({ x: 3020, y: 230 }),
  maxTrees: 24,
  starterTrees: 1,
  saplingPrice: 2800,
  maturityMinutes: 4320,
  productionMinutes: 720,
  harvestYield: 1,
  maxFruit: 1,
  placementItemId: "apple-tree",
});

export const LEGACY_ORCHARD_TREE_POSITIONS = Object.freeze([
  [2925, 180], [3020, 160], [3120, 190], [2965, 330], [3070, 315], [3170, 335],
].map(([x, y]) => Object.freeze({ x, y })));

export const LAWN_CONFIG = Object.freeze({
  jobGrassThreshold: 70,
  jobWeedThreshold: 38,
  freshlyCutHeight: 5,
  freshlyWeededPressure: 3,
  baseGrassPerDay: 7.7,
  baseWeedsPerDay: 3.1,
  rewardCoins: 100,
});

export const LAWN_PLOTS = Object.freeze([
  Object.freeze({ id: "lawn-house-1", title: "Rose Cottage Front Lawn", x: 305, y: 430, radius: 105, initialGrass: 82, initialWeeds: 48, growthRate: 1.08, weedRate: 1.05 }),
  Object.freeze({ id: "lawn-house-2", title: "Amber Cottage Front Lawn", x: 695, y: 430, radius: 105, initialGrass: 54, initialWeeds: 27, growthRate: 0.92, weedRate: 0.88 }),
  Object.freeze({ id: "lawn-house-3", title: "Bluebell Cottage Front Lawn", x: 1085, y: 430, radius: 105, initialGrass: 9, initialWeeds: 3, growthRate: 1.17, weedRate: 1.12 }),
]);

export function absoluteWorldMinute(world) {
  return (Math.max(1, Math.floor(Number(world?.day) || 1)) - 1) * 1440
    + Math.max(0, Math.min(1439, Math.floor(Number(world?.clockMinutes) || 0)));
}

export function lawnNeedsCare(lawn) {
  return Boolean(lawn && (lawn.grassHeight >= LAWN_CONFIG.jobGrassThreshold || lawn.weedPressure >= LAWN_CONFIG.jobWeedThreshold));
}
