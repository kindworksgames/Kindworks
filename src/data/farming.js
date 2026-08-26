export const FARMING_SCHEMA_VERSION = 3;

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
  residentCareHour: 18,
  residentCareWeedReductionMin: 3,
  residentCareWeedReductionMax: 9,
  rewardCoins: 100,
});

function hashUnit(text) {
  let hash = 2166136261 >>> 0;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

function trait(id, name, minimum, maximum) {
  return minimum + hashUnit(`${id}:${name}`) * (maximum - minimum);
}

const lawnLocations = [
  [1, 305, 415, "south"], [2, 695, 415, "south"], [3, 1085, 415, "south"], [4, 1475, 415, "south"], [5, 1865, 415, "south"], [6, 2255, 415, "south"],
  [7, 305, 1638, "north"], [8, 695, 1638, "north"], [9, 1865, 1638, "north"], [10, 2885, 1638, "north"], [11, 1085, 1638, "north"], [12, 1475, 1638, "north"],
  [13, 2885, 1470, "south"], [14, 3215, 1470, "south"], [15, 3545, 1470, "south"], [16, 3875, 1470, "south"],
  [17, 3215, 1638, "north"], [18, 3545, 1638, "north"],
  // The legacy game reserves lawn/house 19 but never authored a physical house.
  [19, 3875, 1638, "north", false], [20, 3875, 1638, "north"],
];

export const LAWN_PLOTS = Object.freeze(lawnLocations.map(([number, x, y, gate, active = true], index) => {
  const id = `lawn-house-${number}`;
  const initial = index === 0 ? [82, 48] : index === 1 ? [54, 27] : index === 2 ? [9, 3] : [trait(id, "grass", 4, 11), trait(id, "weeds", 0, 7)];
  return Object.freeze({
    id,
    legacyId: `lawn-${String(number).padStart(2, "0")}`,
    houseSourceId: `house-${String(number).padStart(2, "0")}`,
    homeNodeId: `home${String(number).padStart(2, "0")}`,
    title: `House ${number} Front Lawn`,
    x, y, radius: 105, gate, active,
    initialGrass: initial[0], initialWeeds: initial[1], initialMoisture: trait(id, "moisture", 42, 70),
    soilHealth: trait(id, "soil", 72, 94),
    growthRate: trait(id, "growth", 0.78, 1.18),
    weedRate: trait(id, "weed", 0.8, 1.2),
    maintenanceCadence: trait(id, "cadence", 0.45, 1.95),
    shade: trait(id, "shade", 0.08, 0.38),
    householdCare: trait(id, "care", 0.72, 1),
  });
}));

export function absoluteWorldMinute(world) {
  return (Math.max(1, Math.floor(Number(world?.day) || 1)) - 1) * 1440
    + Math.max(0, Math.min(1439, Math.floor(Number(world?.clockMinutes) || 0)));
}

export function lawnNeedsCare(lawn) {
  return Boolean(lawn && (lawn.grassHeight >= LAWN_CONFIG.jobGrassThreshold || lawn.weedPressure >= LAWN_CONFIG.jobWeedThreshold));
}
