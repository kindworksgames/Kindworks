import { LAWN_PLOTS } from "./farming.js";
import { ITEM_CATALOG, placeableFootprintFor } from "./items.js";
import { NPC_NAVIGATION_LINKS, NPC_NAVIGATION_NODES } from "./npcTownLife.js";
import { COLLISION_RECTS, HOUSES, LANDMARKS, RIVER_PATH, ROADS, SHOPS, WORLD } from "./town.js";
import { TOWN_HOUSE_GEOMETRY, TOWN_SHOP_GEOMETRY } from "./townGeometry.js";

export const TOWN_PLACEMENT_SCHEMA_VERSION = 1;
export const TOWN_PLACEMENT_LIMIT = 500;
export const TOWN_PLACEMENT_ROTATION_STEP = Math.PI / 2;
export const PLACEABLE_ITEM_IDS = Object.freeze(Object.values(ITEM_CATALOG).filter((item) => item.category === "placeable").map((item) => item.id));
export const RELEASED_PLACEABLE_ITEM_IDS = Object.freeze(Object.values(ITEM_CATALOG).filter((item) => item.category === "placeable" && !item.qaOnly && !item.subscriptionOnly).map((item) => item.id));
export const NPC_NAVIGATION_CORRIDOR_CLEARANCE = 22;

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

const WATER_AREAS = Object.freeze([
  Object.freeze({ kind: "ellipse", x: 1430, y: 1075, radiusX: 205, radiusY: 135, label: "Willow Commons pond" }),
  Object.freeze({ kind: "ellipse", x: 2005, y: 2335, radiusX: 220, radiusY: 150, label: "Reedbank wetland" }),
  Object.freeze({ kind: "rect", x: 3060, y: 2510, width: 1050, height: 290, label: "South Harbour water" }),
]);

export const TOWN_ENTRANCES = Object.freeze([
  ...HOUSES.map((house) => TOWN_HOUSE_GEOMETRY[house.id].entrance),
  ...SHOPS.map((shop) => TOWN_SHOP_GEOMETRY[shop.title].entrance),
]);

export function normalizeTownRotation(value) {
  const rotation = Number(value);
  if (!Number.isFinite(rotation)) return 0;
  return ((rotation % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
}

function distanceToSegment(x, y, [ax, ay], [bx, by]) {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSquared = dx * dx + dy * dy;
  if (!lengthSquared) return Math.hypot(x - ax, y - ay);
  const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / lengthSquared));
  return Math.hypot(x - (ax + dx * t), y - (ay + dy * t));
}

const navigationNodeById = new Map(NPC_NAVIGATION_NODES.map((node) => [node.id, node]));

export function distanceToNpcNavigation(x, y) {
  return NPC_NAVIGATION_LINKS.reduce((best, [fromId, toId]) => {
    const from = navigationNodeById.get(fromId);
    const to = navigationNodeById.get(toId);
    if (!from || !to) return best;
    return Math.min(best, distanceToSegment(x, y, [from.x, from.y], [to.x, to.y]));
  }, Infinity);
}

export function npcNavigationEdgeBlockedByPlacements(from, to, objects = []) {
  return (objects || []).some((object) => {
    if (!object || !Number.isFinite(Number(object.x)) || !Number.isFinite(Number(object.y))) return false;
    const item = ITEM_CATALOG[object.itemId];
    const radius = Math.max(18, Number(object.hooks?.playerCollision?.radius) || (item ? placeableFootprintFor(item) : 18));
    return distanceToSegment(Number(object.x), Number(object.y), [from.x, from.y], [to.x, to.y]) < radius + NPC_NAVIGATION_CORRIDOR_CLEARANCE;
  });
}

export function npcNavigationDetour(from, to, objects = [], seed = "resident") {
  const blockers = (objects || []).flatMap((object) => {
    const item = ITEM_CATALOG[object?.itemId];
    if (!object || !item || !Number.isFinite(Number(object.x)) || !Number.isFinite(Number(object.y))) return [];
    const radius = Math.max(18, Number(object.hooks?.playerCollision?.radius) || placeableFootprintFor(item)) + NPC_NAVIGATION_CORRIDOR_CLEARANCE + 10;
    const distance = distanceToSegment(Number(object.x), Number(object.y), [from.x, from.y], [to.x, to.y]);
    return distance < radius ? [{ object, radius, distanceFromStart: Math.hypot(Number(object.x) - from.x, Number(object.y) - from.y) }] : [];
  }).sort((left, right) => left.distanceFromStart - right.distanceFromStart);
  const blocker = blockers[0];
  if (!blocker) return Object.freeze([]);
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy) || 1;
  const ux = dx / length;
  const uy = dy / length;
  const hash = [...String(seed)].reduce((value, character) => Math.imul(value ^ character.charCodeAt(0), 16777619), 2166136261) >>> 0;
  const side = hash % 2 ? 1 : -1;
  const px = -uy * side;
  const py = ux * side;
  const centreX = Number(blocker.object.x);
  const centreY = Number(blocker.object.y);
  const radius = blocker.radius;
  return Object.freeze([
    Object.freeze({ x: clamp(centreX - ux * radius + px * radius, 18, WORLD.width - 18), y: clamp(centreY - uy * radius + py * radius, 18, WORLD.height - 18) }),
    Object.freeze({ x: clamp(centreX + ux * radius + px * radius, 18, WORLD.width - 18), y: clamp(centreY + uy * radius + py * radius, 18, WORLD.height - 18) }),
  ]);
}

export function distanceToPolyline(x, y, polyline) {
  let best = Infinity;
  for (let index = 1; index < polyline.length; index += 1) best = Math.min(best, distanceToSegment(x, y, polyline[index - 1], polyline[index]));
  return best;
}

function circleTouchesRect(x, y, radius, rect) {
  const closestX = Math.max(rect.x, Math.min(x, rect.x + rect.width));
  const closestY = Math.max(rect.y, Math.min(y, rect.y + rect.height));
  return Math.hypot(x - closestX, y - closestY) < radius;
}

function circleTouchesEllipse(x, y, radius, ellipse) {
  const radiusX = ellipse.radiusX + radius;
  const radiusY = ellipse.radiusY + radius;
  return ((x - ellipse.x) ** 2) / (radiusX ** 2) + ((y - ellipse.y) ** 2) / (radiusY ** 2) < 1;
}

function distanceToRoads(x, y) {
  return ROADS.reduce((best, road) => Math.min(best, distanceToPolyline(x, y, road.points) - road.width / 2), Infinity);
}

function nearestReachablePathDistance(x, y) {
  return NPC_NAVIGATION_NODES.reduce((best, node) => {
    if (["home", "cafe", "shop", "bakery", "restaurant", "pub", "market", "cinema"].includes(node.kind)) return best;
    return Math.min(best, Math.hypot(node.x - x, node.y - y));
  }, Infinity);
}

export function placementBehaviorHooks(item, object = null) {
  if (!item || item.category !== "placeable") return null;
  const footprint = placeableFootprintFor(item);
  return {
    objectId: object?.id || null,
    itemId: item.id,
    npcDestination: Boolean(item.effect?.npcDestination),
    npcBin: Boolean(item.effect?.npcBin),
    interactionKind: item.effect?.interactionKind || item.placeableType || "decoration",
    capacity: Math.max(1, Number(item.effect?.capacity || item.effect?.binCapacity) || 1),
    wildlifeObstacle: { radius: footprint + 14 },
    rubbishExclusion: { radius: footprint + 18 },
    playerCollision: { radius: Math.max(16, footprint * 0.72) },
    nightGlow: Boolean(item.effect?.nightGlow),
  };
}

export function validateTownPlacement(itemId, xValue, yValue, { objects = [], ignoreObjectId = null, allowNavigationCorridor = false } = {}) {
  const item = ITEM_CATALOG[itemId];
  const x = Number(xValue);
  const y = Number(yValue);
  if (!item || item.category !== "placeable") return { ok: false, code: "not-placeable", message: "That item cannot be placed in town." };
  const footprint = placeableFootprintFor(item);
  if (!Number.isFinite(x) || !Number.isFinite(y) || x < footprint || y < footprint || x > WORLD.width - footprint || y > WORLD.height - footprint) {
    return { ok: false, code: "outside-town", message: "Placement is outside Willowmere.", footprint };
  }
  const minimumRiverDistance = Math.max(item.placementRules?.minRiverDistance ?? 125, footprint + 52);
  if (distanceToPolyline(x, y, RIVER_PATH) < minimumRiverDistance) return { ok: false, code: "water", message: "Keep this item clear of the river.", footprint };
  if (WATER_AREAS.some((area) => area.kind === "ellipse" ? circleTouchesEllipse(x, y, footprint, area) : circleTouchesRect(x, y, footprint, area))) {
    return { ok: false, code: "water", message: "This item cannot be placed in water.", footprint };
  }
  const roadClearance = (item.placementRules?.minRoadClearance ?? 12) + Math.min(18, footprint * 0.2);
  if (distanceToRoads(x, y) < roadClearance) return { ok: false, code: "road", message: "Keep this item clear of the road.", footprint };
  if (!allowNavigationCorridor && distanceToNpcNavigation(x, y) < footprint + NPC_NAVIGATION_CORRIDOR_CLEARANCE) {
    return { ok: false, code: "navigation-corridor", message: "Keep resident walking routes clear.", footprint };
  }
  for (const house of HOUSES) {
    if (circleTouchesRect(x, y, footprint, TOWN_HOUSE_GEOMETRY[house.id].collision)) return { ok: false, code: "building", message: "A cottage occupies this space.", footprint };
  }
  for (const shop of SHOPS) {
    if (circleTouchesRect(x, y, footprint, TOWN_SHOP_GEOMETRY[shop.title].collision)) return { ok: false, code: "building", message: "A business occupies this space.", footprint };
  }
  if (TOWN_ENTRANCES.some((entrance) => Math.hypot(entrance.x - x, entrance.y - y) < entrance.radius + footprint)) {
    return { ok: false, code: "entrance", message: "Keep building entrances and their approaches clear.", footprint };
  }
  if (LAWN_PLOTS.some((lawn) => Math.hypot(lawn.x - x, lawn.y - y) < lawn.radius + footprint * 0.35)) {
    return { ok: false, code: "lawn", message: "Keep residential lawns clear for Lawn Care.", footprint };
  }
  if (LANDMARKS.some((landmark) => Math.hypot(landmark.x - x, landmark.y - y) < 42 + footprint)) {
    return { ok: false, code: "fixture", message: "A permanent town feature already occupies this space.", footprint };
  }
  if (COLLISION_RECTS.slice(4).some((rect) => circleTouchesRect(x, y, footprint, rect))) {
    return { ok: false, code: "collision", message: "This part of town is not safe for a placed object.", footprint };
  }
  if ((item.effect?.npcBin || item.effect?.npcDestination) && nearestReachablePathDistance(x, y) > 280) {
    return { ok: false, code: "unreachable", message: "Place this closer to a public path so residents can reach it.", footprint };
  }
  for (const object of objects || []) {
    if (!object || object.id === ignoreObjectId) continue;
    const other = ITEM_CATALOG[object.itemId];
    if (!other || other.category !== "placeable") continue;
    if (Math.hypot(Number(object.x) - x, Number(object.y) - y) < footprint + placeableFootprintFor(other) + 8) {
      return { ok: false, code: "object-overlap", message: "Another placed item is too close.", footprint };
    }
  }
  return { ok: true, code: "valid", x, y, footprint, hooks: placementBehaviorHooks(item) };
}

export function townPlacementCatalogueSummary() {
  const types = Object.fromEntries(PLACEABLE_ITEM_IDS.map((id) => ITEM_CATALOG[id].placeableType).reduce((map, type) => map.set(type, (map.get(type) || 0) + 1), new Map()));
  return {
    schemaVersion: TOWN_PLACEMENT_SCHEMA_VERSION,
    limit: TOWN_PLACEMENT_LIMIT,
    totalDefinitions: PLACEABLE_ITEM_IDS.length,
    releasedDefinitions: RELEASED_PLACEABLE_ITEM_IDS.length,
    types,
  };
}
