import { HOUSES, SHOPS, WORLD } from "./town.js";
import { LOGICAL_GEOMETRY_SCHEMA_VERSION, logicalCircle, logicalPoint, logicalRect, validateLogicalGeometryContract } from "./logicalGeometry.js";

export const TOWN_GEOMETRY_CLEARANCE = Object.freeze({ playerRadius: 17, npcRadius: 18, animalRadius: 18, entranceRadius: 58 });

const shopId = (title) => `shop-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

export const TOWN_HOUSE_GEOMETRY = Object.freeze(Object.fromEntries(HOUSES.map((house) => {
  // Keep the protected legacy approach coordinate; gate describes the yard art,
  // not a different gameplay entrance.
  const entranceY = house.y + house.height + 44;
  return [house.id, Object.freeze({
    id: `geometry-${house.id}`,
    collision: logicalRect(`collision-${house.id}`, house.x - 8, house.y - 15, house.width + 16, house.height + 18),
    navigationObstacle: logicalRect(`navigation-${house.id}`, house.x - 8, house.y - 15, house.width + 16, house.height + 18),
    interactionZone: logicalRect(`interaction-${house.id}`, house.x, house.y, house.width, house.height),
    entrance: logicalCircle(`entrance-${house.id}`, house.x + house.width / 2, entranceY, 56),
    standingPoint: logicalPoint(`standing-${house.id}`, house.x + house.width / 2, entranceY, { facing: "up" }),
    occlusionZone: logicalRect(`occlusion-${house.id}`, house.x, house.y, house.width, house.height),
  })];
})));

export const TOWN_SHOP_GEOMETRY = Object.freeze(Object.fromEntries(SHOPS.map((shop) => {
  const id = shopId(shop.title);
  return [shop.title, Object.freeze({
    id,
    collision: logicalRect(`collision-${id}`, shop.x - 8, shop.y - 8, shop.width + 16, shop.height + 16),
    navigationObstacle: logicalRect(`navigation-${id}`, shop.x - 8, shop.y - 8, shop.width + 16, shop.height + 16),
    interactionZone: logicalRect(`interaction-${id}`, shop.x, shop.y, shop.width, shop.height),
    entrance: logicalCircle(`entrance-${id}`, shop.x + shop.width / 2, shop.y + shop.height + 34, 58),
    standingPoint: logicalPoint(`standing-${id}`, shop.x + shop.width / 2, shop.y + shop.height + 34, { facing: "up" }),
    occlusionZone: logicalRect(`occlusion-${id}`, shop.x, shop.y, shop.width, shop.height),
  })];
})));

export const TOWN_LOGICAL_GEOMETRY = Object.freeze({
  schemaVersion: LOGICAL_GEOMETRY_SCHEMA_VERSION,
  id: "town-willowmere",
  units: "logical-pixels",
  worldBounds: logicalRect("town-world-bounds", 0, 0, WORLD.width, WORLD.height),
  cameraBounds: logicalRect("town-camera-bounds", 0, 0, WORLD.width, WORLD.height),
  spawnPoints: Object.freeze([logicalPoint("town-player-spawn", 1050, 1545, { facing: "down" })]),
  collisions: Object.freeze([
    ...Object.values(TOWN_HOUSE_GEOMETRY).map((entry) => entry.collision),
    ...Object.values(TOWN_SHOP_GEOMETRY).map((entry) => entry.collision),
  ]),
  navigationObstacles: Object.freeze([
    ...Object.values(TOWN_HOUSE_GEOMETRY).map((entry) => entry.navigationObstacle),
    ...Object.values(TOWN_SHOP_GEOMETRY).map((entry) => entry.navigationObstacle),
  ]),
  interactionZones: Object.freeze([
    ...Object.values(TOWN_HOUSE_GEOMETRY).map((entry) => entry.interactionZone),
    ...Object.values(TOWN_SHOP_GEOMETRY).map((entry) => entry.interactionZone),
  ]),
  touchTargets: Object.freeze([]),
  standingPoints: Object.freeze([
    ...Object.values(TOWN_HOUSE_GEOMETRY).map((entry) => entry.standingPoint),
    ...Object.values(TOWN_SHOP_GEOMETRY).map((entry) => entry.standingPoint),
  ]),
  triggerRegions: Object.freeze([
    ...Object.values(TOWN_HOUSE_GEOMETRY).map((entry) => entry.entrance),
    ...Object.values(TOWN_SHOP_GEOMETRY).map((entry) => entry.entrance),
  ]),
  occlusionZones: Object.freeze([
    ...Object.values(TOWN_HOUSE_GEOMETRY).map((entry) => entry.occlusionZone),
    ...Object.values(TOWN_SHOP_GEOMETRY).map((entry) => entry.occlusionZone),
  ]),
});

const validation = validateLogicalGeometryContract(TOWN_LOGICAL_GEOMETRY);
if (!validation.ok) throw new TypeError(`Invalid town logical geometry: ${validation.errors.join(" ")}`);
