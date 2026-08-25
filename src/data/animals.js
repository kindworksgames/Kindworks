import { absoluteWorldMinute } from "./farming.js";

export const ANIMAL_STATE_SCHEMA_VERSION = 1;

export const COMPANION_CARE_CONFIG = Object.freeze({
  releaseThreshold: 50,
  warningThreshold: 65,
  dailyDecay: 6,
  affectionGain: 10,
  treatGain: 16,
  affectionCooldownMinutes: 120,
  offlineFloor: 50,
  offlineGraceDays: 1,
});

export const ADOPTION_RULES = Object.freeze({
  common: Object.freeze({ trustMultiplier: 0.004, failedRequestBonus: 0.08, failureTrustGain: 12, guaranteedAfterFailures: 3 }),
  rare: Object.freeze({ trustMultiplier: 0.001, failedRequestBonus: 0.03, failureTrustGain: 5, guaranteedAfterFailures: 5 }),
});

export const SOUTH_MEADOW = Object.freeze({
  id: "south-meadow",
  label: "South Meadow",
  bounds: Object.freeze({ x: 205, y: 2110, width: 690, height: 485 }),
  route: Object.freeze([[250, 2340], [430, 2170], [620, 2250], [860, 2340], [680, 2460], [600, 2580], [380, 2540], [320, 2390]].map(([x, y]) => Object.freeze({ x, y }))),
});

export const WILDLIFE_ROTATION = Object.freeze({ baseVisible: 3, maxVisible: 4, slotDurationMinutes: 240 });

const species = {
  cat: { label: "Cat", icon: "🐈", chance: 0.64, schedule: "all", habitat: "cottages, cafés and the market", accepted: ["river-minnows", "fresh-sardines", "river-trout", "prepared-meat", "chicken-pieces"], favorites: ["fresh-sardines", "prepared-meat"] },
  dog: { label: "Dog", icon: "🐕", chance: 0.68, schedule: "day", habitat: "the commons and cottage lanes", accepted: ["fresh-sardines", "river-trout", "chicken-pieces", "beef-strips", "prepared-meat"], favorites: ["chicken-pieces", "beef-strips"] },
  rabbit: { label: "Rabbit", icon: "🐇", chance: 0.48, schedule: "day", habitat: "gardens, orchard and meadows", accepted: ["allotment-carrot", "fresh-greens", "orchard-apple"], favorites: ["allotment-carrot", "fresh-greens"] },
  hedgehog: { label: "Hedgehog", icon: "🦔", chance: 0.44, schedule: "night", habitat: "gardens and allotments after dark", accepted: ["mealworms", "wild-berries"], favorites: ["mealworms"] },
  duck: { label: "Duck", icon: "🦆", chance: 0.46, schedule: "day", habitat: "the river, wetland and harbour", accepted: ["fresh-greens", "pond-pellets", "river-minnows", "mixed-seeds"], favorites: ["pond-pellets"] },
  fox: { label: "Fox", icon: "🦊", chance: 0.24, schedule: "crepuscular", habitat: "woodland edge and the far meadows", accepted: ["river-minnows", "fresh-sardines", "river-trout", "chicken-pieces", "prepared-meat"], favorites: ["river-trout", "chicken-pieces"] },
  crow: { label: "Crow", icon: "🐦‍⬛", chance: 0.30, schedule: "day", habitat: "rooftops, market and commons", accepted: ["mixed-seeds", "sunflower-seeds", "mealworms", "wild-berries"], favorites: ["mixed-seeds"] },
  wolf: { label: "Wolf", icon: "🐺", chance: 0.12, rare: true, schedule: "crepuscular", habitat: "remote woodland trails and far meadows", accepted: ["fresh-sardines", "river-trout", "chicken-pieces", "beef-strips"], favorites: ["beef-strips", "river-trout"] },
};

export const ANIMAL_SPECIES = Object.freeze(Object.fromEntries(Object.entries(species).map(([id, definition]) => [id, Object.freeze({ id, ...definition, accepted: Object.freeze(definition.accepted), favorites: Object.freeze(definition.favorites) })])));

function route(points) {
  return Object.freeze(points.map(([x, y]) => Object.freeze({ x, y })));
}

export const ANIMAL_DEFINITIONS = Object.freeze([
  Object.freeze({ id: "animal-cat-1", species: "cat", name: "Marmalade", personality: "Bold", color: 0xd68b43, accent: 0xf1c078, initialTrust: 8, route: route([[285, 575], [360, 530], [410, 590], [335, 650], [255, 625]]) }),
  Object.freeze({ id: "animal-dog-1", species: "dog", name: "Bramble", personality: "Playful", color: 0x9c6b42, accent: 0xead0a6, initialTrust: 8, route: route([[1030, 760], [1120, 735], [1190, 805], [1105, 865], [1010, 825]]) }),
  Object.freeze({ id: "animal-rabbit-1", species: "rabbit", name: "Clover", personality: "Gentle", color: 0xc8b39c, accent: 0xf0dfd2, initialTrust: 22, route: route([[1450, 2320], [1510, 2265], [1580, 2310], [1545, 2390], [1465, 2400]]) }),
  Object.freeze({ id: "animal-hedgehog-1", species: "hedgehog", name: "Button", personality: "Sleepy", color: 0x795d48, accent: 0xc79d72, initialTrust: 22, route: route([[1480, 2320], [1530, 2290], [1570, 2345], [1525, 2390], [1465, 2370]]) }),
  Object.freeze({ id: "animal-duck-1", species: "duck", name: "Puddle", personality: "Cheerful", color: 0xede7c9, accent: 0xe6a548, initialTrust: 15, water: true, route: route([[2665, 620], [2640, 690], [2670, 760], [2690, 680], [2680, 610]]) }),
  Object.freeze({ id: "animal-fox-1", species: "fox", name: "Ember", personality: "Watchful", color: 0xc96332, accent: 0xf0d0aa, initialTrust: 8, route: route([[2250, 1270], [2340, 1225], [2410, 1300], [2345, 1400], [2245, 1370]]) }),
  Object.freeze({ id: "animal-crow-1", species: "crow", name: "Inky", personality: "Clever", color: 0x252c32, accent: 0x6a7180, initialTrust: 22, aerial: true, route: route([[470, 615], [560, 560], [650, 620], [590, 700], [485, 690]]) }),
  Object.freeze({ id: "animal-wolf-1", species: "wolf", name: "Luna", personality: "Elusive", color: 0x68727a, accent: 0xd5d7d2, initialTrust: 15, rare: true, route: route([[3900, 1660], [3990, 1610], [4080, 1660], [4000, 1740], [3905, 1735]]), rareVisit: Object.freeze({ periodDays: 6, offsetDay: 2, startMinute: 360, durationMinutes: 180 }) }),
]);

export const ANIMAL_BY_ID = Object.freeze(Object.fromEntries(ANIMAL_DEFINITIONS.map((animal) => [animal.id, animal])));

export function speciesFor(animalOrId) {
  const definition = typeof animalOrId === "string" ? ANIMAL_BY_ID[animalOrId] : animalOrId;
  return definition ? ANIMAL_SPECIES[definition.species] : null;
}

export function adoptionRulesFor(animalOrId) {
  return speciesFor(animalOrId)?.rare ? ADOPTION_RULES.rare : ADOPTION_RULES.common;
}

export function adoptionChance(animalState, animalDefinition = ANIMAL_BY_ID[animalState?.id]) {
  if (!animalState || !animalDefinition) return 0;
  const speciesDefinition = speciesFor(animalDefinition);
  const rules = adoptionRulesFor(animalDefinition);
  return Math.min(0.95, speciesDefinition.chance + animalState.trust * rules.trustMultiplier + animalState.failedRequests * rules.failedRequestBonus);
}

export function animalScheduleVisible(definition, world) {
  if (!definition) return false;
  if (definition.rareVisit) {
    const visit = definition.rareVisit;
    const dayMatches = ((world.day - visit.offsetDay) % visit.periodDays + visit.periodDays) % visit.periodDays === 0;
    return dayMatches && world.clockMinutes >= visit.startMinute && world.clockMinutes < visit.startMinute + visit.durationMinutes;
  }
  const hour = world.clockMinutes / 60;
  const schedule = speciesFor(definition)?.schedule;
  if (schedule === "all") return true;
  if (schedule === "night") return hour >= 19 || hour < 6;
  if (schedule === "crepuscular") return (hour >= 5 && hour < 9) || (hour >= 17 && hour < 21);
  return hour >= 6 && hour < 19;
}

function positionOnRoute(routePoints, absoluteMinute, offset = 0) {
  const cycleMinutes = routePoints.length * 24;
  const cursor = ((absoluteMinute + offset) % cycleMinutes + cycleMinutes) % cycleMinutes / 24;
  const index = Math.floor(cursor) % routePoints.length;
  const next = (index + 1) % routePoints.length;
  const amount = cursor - Math.floor(cursor);
  return {
    x: routePoints[index].x + (routePoints[next].x - routePoints[index].x) * amount,
    y: routePoints[index].y + (routePoints[next].y - routePoints[index].y) * amount,
  };
}

export function worldAnimalPresentations(animalState, world) {
  const absolute = absoluteWorldMinute(world);
  const residents = ANIMAL_DEFINITIONS.map((definition, index) => {
    const state = animalState.residents[definition.id];
    if (state.adopted) {
      if (state.active) return { definition, state, visible: true, location: "following", position: null };
      return { definition, state, visible: true, location: SOUTH_MEADOW.id, position: positionOnRoute(SOUTH_MEADOW.route, absolute, index * 13) };
    }
    return { definition, state, visible: animalScheduleVisible(definition, world), location: "wild", position: positionOnRoute(definition.route, absolute, index * 17) };
  });
  const regular = residents.filter((entry) => !entry.state.adopted && !entry.definition.rare && entry.visible);
  const shift = Math.floor(absolute / WILDLIFE_ROTATION.slotDurationMinutes) % Math.max(1, regular.length);
  const roster = new Set(Array.from({ length: Math.min(WILDLIFE_ROTATION.baseVisible, regular.length) }, (_, index) => regular[(shift + index) % regular.length].definition.id));
  const rare = residents.find((entry) => entry.definition.rare && !entry.state.adopted && entry.visible);
  if (rare && roster.size < WILDLIFE_ROTATION.maxVisible) roster.add(rare.definition.id);
  return residents.map((entry) => ({ ...entry, visible: entry.state.adopted || roster.has(entry.definition.id) }));
}
