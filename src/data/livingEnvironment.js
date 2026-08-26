import { RIVER_PATH } from "./town.js";

export const LIVING_ENVIRONMENT_SCHEMA_VERSION = 1;

export const ENVIRONMENT_LIMITS = Object.freeze({
  maxOfflineMinutes: 3 * 1440,
  postRestorationCalmMinutes: 3 * 1440,
  majorRestorationBacklogMin: 7,
});

export const LAND_LITTER_CONFIG = Object.freeze({
  maxTotal: 60,
  zoneCaps: Object.freeze({ street: 28, park: 12, beach: 24 }),
  cleanupThreshold: Object.freeze({ street: 3, park: 2, beach: 1 }),
  clusterRadius: Object.freeze({ street: 300, park: 230, beach: 300 }),
  clusterSpawnBias: 0.58,
  caretakerRadius: Object.freeze({ street: 430, park: 390 }),
  lightTypes: Object.freeze(["paper", "tissue", "bag", "wrapper", "cup"]),
  windMoveMinGameMinutes: 28,
  windMoveMaxGameMinutes: 72,
  windShiftMinGameMinutes: 180,
  windShiftMaxGameMinutes: 360,
  riverTransferChance: 0.16,
  beachTideOutChance: 0.04,
  caretakerSweepMinGameMinutes: 95,
  caretakerSweepMaxGameMinutes: 180,
  spawnMin: Object.freeze({ street: 280, park: 340, beach: 65 }),
  spawnMax: Object.freeze({ street: 450, park: 550, beach: 125 }),
});

export const LAND_LITTER_TYPES = Object.freeze(["bottle", "can", "cup", "wrapper", "tissue", "bag", "paper", "spoon"]);

const anchors = [
  ["01", "street", 205, 1015, "cup"], ["02", "street", 325, 1040, "wrapper"], ["03", "street", 470, 1025, "can"], ["04", "street", 650, 1045, "bottle"], ["05", "street", 850, 1030, "tissue"],
  ["06", "street", 1900, 720, "can"], ["07", "street", 2160, 760, "bag"], ["08", "street", 2350, 875, "spoon"],
  ["09", "park", 1175, 1185, "tissue"], ["10", "park", 1215, 1340, "bottle"], ["11", "park", 1515, 1345, "cup"], ["12", "park", 1880, 1370, "can"], ["13", "park", 1220, 840, "wrapper"], ["14", "park", 2050, 850, "bag"],
  ["15", "street", 980, 1500, "bottle"], ["16", "street", 1570, 1500, "cup"], ["17", "street", 1910, 1510, "spoon"], ["18", "street", 650, 1500, "tissue"], ["19", "street", 560, 1015, "paper"], ["20", "street", 2240, 790, "wrapper"],
  ["21", "park", 1710, 820, "paper"], ["22", "park", 2210, 1230, "tissue"], ["23", "park", 1185, 1270, "bottle"], ["24", "park", 1240, 820, "wrapper"], ["25", "park", 1510, 790, "can"], ["26", "park", 1740, 780, "bag"], ["27", "park", 2200, 930, "paper"], ["28", "park", 2160, 1280, "tissue"], ["29", "park", 1280, 1300, "bottle"], ["30", "park", 1160, 1240, "cup"],
  ["31", "street", 2820, 850, "cup"], ["32", "street", 2910, 855, "wrapper"], ["33", "street", 3090, 850, "bottle"], ["34", "street", 3210, 855, "tissue"], ["35", "street", 3370, 850, "cup"], ["36", "street", 3500, 855, "wrapper"], ["37", "street", 3680, 850, "can"], ["38", "street", 2860, 1060, "paper"], ["39", "street", 3180, 1060, "cup"], ["40", "street", 3480, 1070, "bag"], ["41", "street", 3870, 430, "paper"], ["42", "street", 3980, 470, "cup"],
  ["43", "beach", 3460, 2420, "bottle"], ["44", "beach", 3560, 2500, "wrapper"], ["45", "beach", 3660, 2580, "can"], ["46", "beach", 3770, 2660, "bag"], ["47", "beach", 3890, 2520, "paper"], ["48", "beach", 4000, 2650, "cup"], ["49", "beach", 3810, 2430, "tissue"], ["50", "beach", 4070, 2490, "bottle"],
  ["51", "park", 1450, 1430, "paper"], ["52", "park", 1660, 1420, "cup"],
  ["53", "street", 2490, 650, "wrapper"], ["54", "street", 2780, 820, "paper"], ["55", "street", 2500, 1080, "bag"], ["56", "street", 2790, 1120, "cup"], ["57", "street", 2530, 1540, "tissue"], ["58", "street", 2790, 1540, "wrapper"], ["59", "street", 2540, 1880, "paper"], ["60", "street", 2760, 2160, "bag"], ["61", "street", 815, 1900, "wrapper"], ["62", "street", 760, 2110, "bottle"], ["63", "street", 650, 2250, "tissue"], ["64", "street", 1420, 2050, "cup"], ["65", "street", 1510, 2380, "paper"], ["66", "street", 1740, 2450, "can"],
];

export const LAND_LITTER_ANCHORS = Object.freeze(anchors.map(([suffix, zone, x, y, type]) => Object.freeze({ id: `litter-${suffix}`, zone, x, y, type })));

export const RIVER_GARBAGE_CONFIG = Object.freeze({
  maxTotal: 24,
  maxPerSection: 7,
  lowerRiverMaxPerSection: 9,
  autoSpawnMinGameMinutes: 280,
  autoSpawnMaxGameMinutes: 420,
  minFlowWorldUnitsPerGameMinute: 2.6,
  maxFlowWorldUnitsPerGameMinute: 4.8,
  initialVisibleItems: 5,
  cleanupThreshold: 3,
  washAshoreChance: 0.28,
});

export const RIVER_GARBAGE_TYPES = Object.freeze(["bottle", "can", "cup", "wrapper", "tissue", "bag", "paper"]);
export const RIVER_TYPE_FLOW_FACTOR = Object.freeze({ bottle: 0.94, can: 0.82, cup: 1, wrapper: 1.05, tissue: 1.1, bag: 1.14, paper: 1.1 });
export const RIVER_TYPE_SNAG_FACTOR = Object.freeze({ bottle: 0.9, can: 0.72, cup: 1, wrapper: 1.15, tissue: 1.35, bag: 1.48, paper: 1.3 });
export const RIVER_TYPE_RELEASE_FACTOR = Object.freeze({ bottle: 1, can: 0.88, cup: 1, wrapper: 1.1, tissue: 1.18, bag: 1.28, paper: 1.16 });

export const RIVER_SECTIONS = Object.freeze([
  { id: "river-01", title: "Upper Willow River", t0: 0, t1: 0.2, nextId: "river-02", snags: [{ t: 0.82, chance: 0.23, reason: "the High Street Bridge pilings" }] },
  { id: "river-02", title: "High Street Reach", t0: 0.2, t1: 0.4, nextId: "river-03", snags: [{ t: 0.74, chance: 0.25, reason: "the Riverside Bridge stones" }] },
  { id: "river-03", title: "Mill Reach", t0: 0.4, t1: 0.6, nextId: "river-04", snags: [{ t: 0.56, chance: 0.28, reason: "the Willow Bridge pilings" }] },
  { id: "river-04", title: "Lower Reach", t0: 0.6, t1: 0.8, nextId: "river-05", snags: [{ t: 0.42, chance: 0.25, reason: "reeds on the meadow bank" }] },
  { id: "river-05", title: "South Estuary", t0: 0.8, t1: 1, nextId: null, snags: [{ t: 0.3, chance: 0.27, reason: "the estuary reed beds" }, { t: 0.68, chance: 0.21, reason: "the lower river bend" }] },
].map((entry) => Object.freeze({ ...entry, snags: Object.freeze(entry.snags.map(Object.freeze)) })));

export const BUSINESS_CATALOG = Object.freeze([
  ["corner-cafe", "Corner Café", "cafe", 7, 18, 10, ["cup"], 0.9, 305, 1120],
  ["village-grocer", "Village Grocer", "shop", 8, 20, 14, ["bag", "bottle", "paper"], 0.55, 555, 1120],
  ["little-bakery", "Little Bakery", "bakery", 6, 16, 9, ["wrapper", "bag"], 0.8, 805, 1120],
  ["riverside-kitchen", "Riverside Kitchen", "restaurant", 11.5, 22, 20, ["tissue", "wrapper"], 1.35, 2900, 790],
  ["willow-arms", "The Willow Arms", "pub", 15, 23.5, 24, ["bottle", "cup", "tissue"], 1.4, 3180, 790],
  ["morning-mug", "Morning Mug Coffee", "cafe", 6.5, 19, 13, ["cup", "tissue"], 1, 3460, 790],
  ["harbour-general", "Harbour General", "shop", 7, 21, 12, ["bag", "bottle", "paper"], 0.6, 3770, 920],
  ["willow-news", "KindWorks Cinema", "cinema", 9.5, 23, 28, ["cup", "wrapper", "tissue"], 0.85, 4010, 450],
  ["riverstone", "Riverstone Restaurant", "restaurant", 11.5, 22.5, 22, ["tissue", "wrapper"], 1.25, 2900, 1125],
  ["fresh-market", "Fresh Market", "market", 8, 19, 18, ["bag", "paper"], 1, 3180, 1125],
  ["lantern-arcade", "Paws & Wonders", "shop", 9, 19, 14, ["bag", "wrapper"], 0.55, 3460, 1125],
  ["south-shore-cafe", "South Shore Café", "beach_cafe", 8, 20.5, 16, ["cup", "wrapper", "spoon"], 1.15, 3710, 2140],
].map(([id, name, kind, open, close, capacity, products, wasteRate, x, y]) => Object.freeze({ id, name, kind, open, close, capacity, products: Object.freeze(products), wasteRate, x, y })));

export const RUBBISH_PRESENTATION = Object.freeze({
  bottle: { icon: "🧴", label: "Plastic bottle", color: 0x6aa9d6 }, can: { icon: "🥫", label: "Empty can", color: 0xb8b9ae },
  cup: { icon: "🥤", label: "Takeaway cup", color: 0xdba765 }, wrapper: { icon: "🍬", label: "Food wrapper", color: 0xd76e6e },
  tissue: { icon: "🧻", label: "Dirty tissue", color: 0xe7e2d5 }, bag: { icon: "🛍️", label: "Plastic bag", color: 0xa98aca },
  paper: { icon: "📰", label: "Wet newspaper", color: 0xcfc6a9 }, spoon: { icon: "🥄", label: "Plastic spoon", color: 0xc9d6df },
});

export function hashUnit(text) {
  let hash = 2166136261 >>> 0;
  for (let index = 0; index < String(text).length; index += 1) {
    hash ^= String(text).charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

export function seededBetween(key, minimum, maximum) {
  return minimum + hashUnit(key) * (maximum - minimum);
}

export function isBusinessOpen(business, absoluteMinute) {
  const hour = ((Number(absoluteMinute) || 0) % 1440) / 60;
  return business.open <= business.close ? hour >= business.open && hour < business.close : hour >= business.open || hour < business.close;
}

function polylinePoint(progress) {
  const points = RIVER_PATH.map(([x, y]) => ({ x, y }));
  const segments = [];
  let total = 0;
  for (let index = 1; index < points.length; index += 1) {
    const length = Math.hypot(points[index].x - points[index - 1].x, points[index].y - points[index - 1].y);
    segments.push({ a: points[index - 1], b: points[index], length });
    total += length;
  }
  let target = Math.max(0, Math.min(1, Number(progress) || 0)) * total;
  for (const segment of segments) {
    if (target <= segment.length) {
      const ratio = segment.length ? target / segment.length : 0;
      return { x: segment.a.x + (segment.b.x - segment.a.x) * ratio, y: segment.a.y + (segment.b.y - segment.a.y) * ratio };
    }
    target -= segment.length;
  }
  return points.at(-1);
}

export function riverItemPosition(item) {
  const section = RIVER_SECTIONS.find((entry) => entry.id === item?.sectionId) || RIVER_SECTIONS[0];
  const progress = section.t0 + (section.t1 - section.t0) * Math.max(0, Math.min(1, Number(item?.t) || 0));
  const point = polylinePoint(progress);
  const ahead = polylinePoint(Math.min(1, progress + 0.003));
  const angle = Math.atan2(ahead.y - point.y, ahead.x - point.x) + Math.PI / 2;
  const offset = Number(item?.offset) || 0;
  return { x: point.x + Math.cos(angle) * offset, y: point.y + Math.sin(angle) * offset };
}

export function riverSectionWorldLength(sectionId) {
  const section = RIVER_SECTIONS.find((entry) => entry.id === sectionId) || RIVER_SECTIONS[0];
  const samples = 30;
  let length = 0;
  let previous = polylinePoint(section.t0);
  for (let index = 1; index <= samples; index += 1) {
    const next = polylinePoint(section.t0 + (section.t1 - section.t0) * (index / samples));
    length += Math.hypot(next.x - previous.x, next.y - previous.y);
    previous = next;
  }
  return length;
}
