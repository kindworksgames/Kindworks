import { ANIMAL_BY_ID } from "./animals.js";
import {
  PERSONAL_HOME_HOUSE_ID,
  PERSONAL_HOME_LEVELS,
  PERSONAL_HOME_OPTIONS,
  personalHomeCapacity,
} from "./customResident.js";
import { ITEM_CATALOG } from "./items.js";
import { NPC_HOME_DEFINITIONS, NPC_RESIDENTS } from "./npcTownLife.js";
import { HOUSES } from "./town.js";
import { houseArchitectureKit } from "./legacyVisualStates.js";

export const HOME_INTERIOR_STATE_SCHEMA_VERSION = 1;
export const HOME_FURNITURE_LIMIT = 60;
export const HOME_INTERIOR_VIEW = Object.freeze({ width: 960, height: 640 });
export const QUARTER_TURN = Math.PI / 2;

export const HOUSE_INTERIOR_THEMES = Object.freeze([
  Object.freeze({ name: "Cosy cottage", floor: 0xd8b783, rug: 0xc87865, wall: 0xeadab7 }),
  Object.freeze({ name: "Garden home", floor: 0xc9b486, rug: 0x79a773, wall: 0xd8e3c3 }),
  Object.freeze({ name: "Family home", floor: 0xd3a979, rug: 0x668da4, wall: 0xf0d6af }),
  Object.freeze({ name: "Colourful home", floor: 0xcdb18d, rug: 0x9b79a9, wall: 0xe5cfdf }),
  Object.freeze({ name: "Traditional home", floor: 0xbfa176, rug: 0xa55f52, wall: 0xe4d2b6 }),
  Object.freeze({ name: "Sunny home", floor: 0xd8bc89, rug: 0xd3a849, wall: 0xefe2b3 }),
]);

export const HOME_OBJECT_DESCRIPTIONS = Object.freeze({
  bed: "Residents sleep and recover here.",
  table: "The household gathers here for meals and conversation.",
  kitchen: "A compact kitchen for preparing food at home.",
  wardrobe: "Clothes and household belongings are stored here.",
  sofa: "A comfortable place to relax together.",
  armchair: "A cosy seat for reading or resting.",
  "coffee-table": "A low table for books, cups and everyday things.",
  bookshelf: "Books and treasured stories fill these shelves.",
  hearth: "A warm fireplace makes the home feel welcoming.",
  rug: "A soft rug beside the front door.",
  "woven-rug": "A woven rug that can sit beneath other furniture.",
  plant: "A healthy plant brings a little nature indoors.",
  picture: "A favourite family photograph.",
  radio: "Music and local news play here.",
  "record-player": "A record player for music-filled evenings.",
  fishing: "Fishing gear is kept ready for the next river visit.",
  coffee: "A small coffee corner for a favourite daily ritual.",
  broom: "A community helper's cleaning kit.",
  petbed: "A safe, cosy bed for an adopted companion.",
  petbowls: "Food and fresh water for the companions who live here.",
  "floor-lamp": "A warm lamp brightens this corner.",
  "companion-basket": "A snug basket where a companion can rest.",
  "fish-tank": "An empty ornamental fish tank. Fish move-in arrives in Milestone 33.",
});

const HOME_METADATA = Object.freeze(Object.fromEntries(NPC_HOME_DEFINITIONS.map(([id, , , , name, area]) => [id, Object.freeze({ id, name, area })])));
const RESIDENT_DEFINITIONS = new Map(NPC_RESIDENTS.map((resident) => [resident.id, resident]));

export function houseNumber(houseOrId) {
  const id = typeof houseOrId === "string" ? houseOrId : houseOrId?.id;
  return Math.max(1, Number(String(id || "").split("-")[1]) || 1);
}

export function houseHomeNodeId(houseOrId) {
  return `home${String(houseNumber(houseOrId)).padStart(2, "0")}`;
}

export function houseInteriorMetadata(houseOrId) {
  const nodeId = houseHomeNodeId(houseOrId);
  return HOME_METADATA[nodeId] || { id: nodeId, name: `Cottage ${houseNumber(houseOrId)}`, area: "Willowmere" };
}

export function houseForId(houseId) {
  return HOUSES.find((house) => house.id === houseId) || null;
}

export function residentDefinitionsForHouse(houseOrId) {
  const nodeId = houseHomeNodeId(houseOrId);
  return NPC_RESIDENTS.filter((resident) => resident.homeNodeId === nodeId);
}

export function snapFurnitureRotation(value) {
  const full = Math.PI * 2;
  return ((Math.round((Number(value) || 0) / QUARTER_TURN) * QUARTER_TURN) % full + full) % full;
}

function personalTheme(state, base) {
  const home = state.customResident?.home || {};
  return {
    ...base,
    name: `Level ${home.level || 1} · ${PERSONAL_HOME_LEVELS[(home.level || 1) - 1]?.name || PERSONAL_HOME_LEVELS[0].name}`,
    wall: PERSONAL_HOME_OPTIONS.wallPalette[home.wallColor] || PERSONAL_HOME_OPTIONS.wallPalette.cream,
    rug: PERSONAL_HOME_OPTIONS.roofPalette[home.roofColor] || PERSONAL_HOME_OPTIONS.roofPalette.terracotta,
  };
}

export function furnitureLayoutItem(saved, shell) {
  const item = ITEM_CATALOG[saved.itemId];
  if (!item?.indoorSize) return null;
  const oddQuarter = Math.abs(Math.round(snapFurnitureRotation(saved.rotation) / QUARTER_TURN)) % 2 === 1;
  const width = shell.w * (oddQuarter ? item.indoorSize[1] : item.indoorSize[0]);
  const height = shell.h * (oddQuarter ? item.indoorSize[0] : item.indoorSize[1]);
  return {
    id: saved.id,
    kind: item.indoorKind,
    label: item.name,
    itemId: item.id,
    icon: item.icon,
    description: item.description,
    customFurniture: true,
    floorLayer: Boolean(item.floorLayer),
    rotation: snapFurnitureRotation(saved.rotation),
    x: shell.x + Number(saved.rx) * shell.w - width / 2,
    y: shell.y + Number(saved.ry) * shell.h - height / 2,
    w: width,
    h: height,
  };
}

export function rectsOverlap(a, b, pad = 5) {
  return a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;
}

export function buildHouseInteriorLayout(state, houseId) {
  const house = houseForId(houseId);
  if (!house) return null;
  const personal = house.id === PERSONAL_HOME_HOUSE_ID;
  const number = houseNumber(house);
  const architecture = houseArchitectureKit(house.architectureKit);
  const level = personal ? Math.max(1, Math.min(4, Number(state.customResident?.home?.level) || 1)) : architecture.interior.level;
  const width = personal ? [620, 700, 790, 850][level - 1] : architecture.interior.width;
  const height = personal ? [390, 430, 480, 510][level - 1] : architecture.interior.height;
  const x = (HOME_INTERIOR_VIEW.width - width) / 2;
  const y = (HOME_INTERIOR_VIEW.height - height) / 2 + 8;
  const residentDefinitions = residentDefinitionsForHouse(house);
  const bedCount = Math.max(1, Math.min(3, residentDefinitions.length || 1));
  const baseTheme = HOUSE_INTERIOR_THEMES[(number - 1) % HOUSE_INTERIOR_THEMES.length];
  const theme = personal ? personalTheme(state, baseTheme) : { ...baseTheme };
  const furniture = [];
  const partitions = [];
  const add = (id, kind, label, rx, ry, rw, rh, extra = {}) => furniture.push({
    id, kind, label, description: HOME_OBJECT_DESCRIPTIONS[kind] || "A familiar part of this home.",
    x: x + rx * width, y: y + ry * height, w: rw * width, h: rh * height, ...extra,
  });
  for (let index = 0; index < bedCount; index += 1) add(`bed-${index + 1}`, "bed", bedCount > 1 ? `Bed ${index + 1}` : "Bed", 0.055 + index * 0.19, 0.07, 0.16, 0.27, { residentId: residentDefinitions[index]?.id || null });
  if (!personal) {
    add("dining-table", "table", "Dining table", 0.42, 0.44, 0.20, 0.22, { chairs: Math.max(2, Math.min(4, residentDefinitions.length || 2)) });
    add("kitchen-counter", "kitchen", "Kitchen counter", 0.69, 0.07, 0.245, 0.14);
    add("wardrobe", "wardrobe", "Wardrobe", 0.055, 0.69, 0.13, 0.19);
    add("front-rug", "rug", "Front-door rug", 0.43, 0.84, 0.14, 0.09, { floorLayer: true });
    if (level >= 2) add("sofa", "sofa", "Cosy sofa", 0.68, 0.61, 0.22, 0.13);
    if (level >= 3) add("bookshelf", "bookshelf", "Bookshelf", 0.48, 0.68, 0.10, 0.15);
    if (level >= 4) add("hearth", "hearth", "Warm fireplace", 0.83, 0.34, 0.10, 0.18);
  }
  const decor = personal ? [] : [number % 2 ? "plant" : "picture", number % 3 === 0 ? "radio" : "plant"];
  const decorLabels = { plant: "House plant", bookshelf: "Hobby bookshelf", radio: "Record player", fishing: "Fishing gear", coffee: "Coffee corner", broom: "Community helper's cleaning kit", picture: "Family photograph" };
  decor.forEach((kind, index) => add(`decor-${index + 1}`, kind, decorLabels[kind] || "Decoration", 0.21 + index * 0.08, 0.76, 0.06, 0.10));
  const adopted = personal ? Object.values(state.animals?.residents || {}).filter((animal) => animal.adopted).slice(0, personalHomeCapacity(level)) : [];
  adopted.forEach((animal, index) => add(`pet-bed-${animal.id}`, "petbed", `${animal.name}'s bed`, 0.25 + (index % 3) * 0.12, 0.08 + Math.floor(index / 3) * 0.16, 0.095, 0.12, { animalId: animal.id }));
  if (adopted.length) add("pet-bowls", "petbowls", "Food and water bowls", 0.70, 0.28, 0.16, 0.075, { petCount: adopted.length });
  const sleepDivider = Math.min(0.64, 0.23 + (bedCount - 1) * 0.19);
  if (level >= 2) partitions.push({ x1: x + width * sleepDivider, y1: y + height * 0.03, x2: x + width * sleepDivider, y2: y + height * 0.34 });
  if (level >= 3) partitions.push({ x1: x + width * 0.64, y1: y + height * 0.56, x2: x + width * 0.64, y2: y + height * 0.97 });
  if (level >= 4) partitions.push({ x1: x + width * 0.36, y1: y + height * 0.56, x2: x + width * 0.36, y2: y + height * 0.97 });
  if (personal) {
    const shell = { x, y, w: width, h: height };
    for (const saved of state.homeInteriors?.placements || []) {
      const item = furnitureLayoutItem(saved, shell);
      if (item) furniture.push(item);
    }
  }
  return {
    house, architecture, personal, level, x, y, w: width, h: height, theme,
    metadata: houseInteriorMetadata(house), residentDefinitions,
    pets: adopted.map((animal) => ({ ...animal, definition: ANIMAL_BY_ID[animal.id] || null })),
    furniture, partitions,
    door: { x: x + width * 0.47, y: y + height * 0.94, w: width * 0.12, h: height * 0.06 },
  };
}

export function validateFurniturePlacement(state, itemId, rx, ry, { rotation = 0, ignorePlacementId = null } = {}) {
  const item = ITEM_CATALOG[itemId];
  if (!item?.indoorSize || item.category !== "furniture") return { ok: false, code: "not-furniture", reason: "Item is not home furniture." };
  if (!state.customResident?.profile) return { ok: false, code: "resident-not-created", reason: "Create your personal resident and home first." };
  if (!ignorePlacementId && (state.homeInteriors?.placements?.length || 0) >= HOME_FURNITURE_LIMIT) return { ok: false, code: "limit-reached", reason: `Your home has reached its ${HOME_FURNITURE_LIMIT}-item furniture limit.` };
  if (item.aquarium && !ignorePlacementId && state.homeInteriors?.placements?.some((placement) => ITEM_CATALOG[placement.itemId]?.aquarium)) return { ok: false, code: "unique-furniture", reason: "Only one ornamental fish tank can be placed." };
  if (!Number.isFinite(Number(rx)) || !Number.isFinite(Number(ry))) return { ok: false, code: "invalid-position", reason: "Choose a place inside the room." };
  const layout = buildHouseInteriorLayout(state, PERSONAL_HOME_HOUSE_ID);
  const rotationValue = snapFurnitureRotation(rotation);
  const candidate = furnitureLayoutItem({ id: "preview", itemId, rx: Number(rx), ry: Number(ry), rotation: rotationValue }, layout);
  const margin = 15;
  if (candidate.x < layout.x + margin || candidate.y < layout.y + margin || candidate.x + candidate.w > layout.x + layout.w - margin || candidate.y + candidate.h > layout.y + layout.h - margin) return { ok: false, code: "outside-walls", reason: "Keep the furniture inside the four walls." };
  const doorZone = { x: layout.door.x - 22, y: layout.y + layout.h - 72, w: layout.door.w + 44, h: 82 };
  if (!item.floorLayer && rectsOverlap(candidate, doorZone, 0)) return { ok: false, code: "doorway-blocked", reason: "Keep the doorway clear." };
  if (!item.floorLayer) {
    for (const partition of layout.partitions) {
      const wallRect = { x: Math.min(partition.x1, partition.x2) - 10, y: Math.min(partition.y1, partition.y2) - 10, w: Math.abs(partition.x2 - partition.x1) + 20, h: Math.abs(partition.y2 - partition.y1) + 20 };
      if (rectsOverlap(candidate, wallRect, 0)) return { ok: false, code: "partition-blocked", reason: "A room divider blocks this spot." };
    }
    for (const other of layout.furniture) {
      if (other.customFurniture && other.id === ignorePlacementId) continue;
      if (other.floorLayer) continue;
      if (rectsOverlap(candidate, other, 6)) return { ok: false, code: "furniture-overlap", reason: `Too close to ${other.label.toLowerCase()}.` };
    }
  }
  return { ok: true, code: "valid-placement", rx: Number(rx), ry: Number(ry), rotation: rotationValue, candidate };
}

export function findSafeFurniturePlacement(state, placed) {
  const rotations = [0, QUARTER_TURN, Math.PI, Math.PI * 1.5].map((amount) => snapFurnitureRotation(placed.rotation + amount));
  const points = [];
  for (let ry = 0.08; ry <= 0.921; ry += 0.04) for (let rx = 0.08; rx <= 0.921; rx += 0.04) points.push({ rx, ry, distance: Math.hypot(rx - placed.rx, ry - placed.ry) });
  points.sort((a, b) => a.distance - b.distance || a.ry - b.ry || a.rx - b.rx);
  for (const rotation of rotations) for (const point of points) {
    const result = validateFurniturePlacement(state, placed.itemId, point.rx, point.ry, { rotation, ignorePlacementId: placed.id });
    if (result.ok) return result;
  }
  return null;
}

export function residentDefinitionById(id) {
  return RESIDENT_DEFINITIONS.get(id) || null;
}
