import { HARBOUR_GENERAL_INTERIOR } from "./harbourGeneral.js";
import { PAWS_WONDERS_DISPLAYS, PAWS_WONDERS_FIXTURES, PAWS_WONDERS_INTERIOR, pawsPercentRect } from "./pawsWonders.js";
import { VILLAGE_GROCER_DISPLAYS, VILLAGE_GROCER_FIXTURES, VILLAGE_GROCER_INTERIOR, percentRect } from "./villageGrocer.js";
import { LOGICAL_GEOMETRY_SCHEMA_VERSION, logicalCircle, logicalPoint, logicalRect, validateLogicalGeometryContract } from "./logicalGeometry.js";

function rectCopy(id, rect, extra = {}) {
  return logicalRect(id, rect.x, rect.y, rect.width, rect.height, extra);
}

const STANDING_CLEARANCE = 17;
const STANDING_EDGE_GAP = STANDING_CLEARANCE + 1;

function resolveStandingPoint(desired, obstacles, bounds) {
  const withinBounds = (point) => point.x >= bounds.x + STANDING_CLEARANCE
    && point.x <= bounds.x + bounds.width - STANDING_CLEARANCE
    && point.y >= bounds.y + STANDING_CLEARANCE
    && point.y <= bounds.y + bounds.height - STANDING_CLEARANCE;
  const isClear = (point) => withinBounds(point)
    && obstacles.every((obstacle) => !(point.x >= obstacle.x - STANDING_CLEARANCE
      && point.x <= obstacle.x + obstacle.width + STANDING_CLEARANCE
      && point.y >= obstacle.y - STANDING_CLEARANCE
      && point.y <= obstacle.y + obstacle.height + STANDING_CLEARANCE));
  if (isClear(desired)) return desired;

  const candidates = [];
  for (const obstacle of obstacles) {
    const left = obstacle.x - STANDING_EDGE_GAP;
    const right = obstacle.x + obstacle.width + STANDING_EDGE_GAP;
    const top = obstacle.y - STANDING_EDGE_GAP;
    const bottom = obstacle.y + obstacle.height + STANDING_EDGE_GAP;
    candidates.push(
      { x: desired.x, y: bottom }, { x: desired.x, y: top },
      { x: left, y: desired.y }, { x: right, y: desired.y },
      { x: left, y: bottom }, { x: right, y: bottom },
      { x: left, y: top }, { x: right, y: top },
    );
  }
  const resolved = candidates
    .filter(isClear)
    .sort((left, right) => ((left.x - desired.x) ** 2 + (left.y - desired.y) ** 2)
      - ((right.x - desired.x) ** 2 + (right.y - desired.y) ** 2))[0];
  if (!resolved) throw new TypeError(`No accessible standing point near ${desired.x},${desired.y}.`);
  return resolved;
}

function displayGeometry(prefix, display, rect, obstacles, bounds) {
  const centreX = rect.x + rect.width / 2;
  const centreY = rect.y + rect.height / 2;
  const desiredStandingPoint = { x: centreX, y: Math.min(bounds.y + bounds.height - STANDING_CLEARANCE, rect.y + rect.height + 38) };
  const standingPoint = resolveStandingPoint(desiredStandingPoint, obstacles, bounds);
  return Object.freeze({
    id: `${prefix}-${display.id ?? display.slot}`,
    interaction: logicalCircle(`${prefix}-interaction-${display.id ?? display.slot}`, centreX, centreY, Math.max(62, Math.min(128, rect.width * 0.58))),
    touchTarget: rectCopy(`${prefix}-touch-${display.id ?? display.slot}`, rect, { minCssPixels: 44 }),
    standingPoint: logicalPoint(`${prefix}-standing-${display.id ?? display.slot}`, standingPoint.x, standingPoint.y, { facing: "up" }),
  });
}

function freezeContract(contract) {
  const validation = validateLogicalGeometryContract(contract);
  if (!validation.ok) throw new TypeError(`Invalid ${contract.id} logical geometry: ${validation.errors.join(" ")}`);
  return Object.freeze(contract);
}

const grocerFixtures = Object.freeze(Object.entries(VILLAGE_GROCER_FIXTURES).map(([id, fixture]) => rectCopy(`grocer-collision-${id}`, percentRect(fixture))));
const grocerDisplays = Object.freeze(Object.fromEntries(VILLAGE_GROCER_DISPLAYS.map((display) => {
  const geometry = displayGeometry("grocer", display, percentRect(display), grocerFixtures, VILLAGE_GROCER_INTERIOR.room);
  return [display.id, geometry];
})));

export const VILLAGE_GROCER_GEOMETRY = freezeContract({
  schemaVersion: LOGICAL_GEOMETRY_SCHEMA_VERSION, id: "village-grocer-interior", units: "logical-pixels",
  worldBounds: rectCopy("grocer-world", VILLAGE_GROCER_INTERIOR.room), cameraBounds: logicalRect("grocer-camera", 0, 0, 1280, 720),
  collisions: grocerFixtures, navigationObstacles: grocerFixtures,
  interactionZones: Object.freeze(Object.values(grocerDisplays).map((entry) => entry.interaction)),
  touchTargets: Object.freeze(Object.values(grocerDisplays).map((entry) => entry.touchTarget)),
  standingPoints: Object.freeze(Object.values(grocerDisplays).map((entry) => entry.standingPoint)),
  spawnPoints: Object.freeze([logicalPoint("grocer-player-spawn", VILLAGE_GROCER_INTERIOR.spawn.x, VILLAGE_GROCER_INTERIOR.spawn.y, { facing: VILLAGE_GROCER_INTERIOR.spawn.facing })]),
  triggerRegions: Object.freeze([logicalCircle("grocer-exit", VILLAGE_GROCER_INTERIOR.exit.x, VILLAGE_GROCER_INTERIOR.exit.y, VILLAGE_GROCER_INTERIOR.exit.radius)]),
  occlusionZones: Object.freeze(grocerFixtures), displays: grocerDisplays,
});

const pawsFixtures = Object.freeze(Object.entries(PAWS_WONDERS_FIXTURES).map(([id, fixture]) => rectCopy(`paws-collision-${id}`, pawsPercentRect(fixture))));
const pawsDisplays = Object.freeze(Object.fromEntries(PAWS_WONDERS_DISPLAYS.map((display) => {
  const geometry = displayGeometry("paws", display, pawsPercentRect(display), pawsFixtures, PAWS_WONDERS_INTERIOR.room);
  return [display.id, geometry];
})));

export const PAWS_WONDERS_GEOMETRY = freezeContract({
  schemaVersion: LOGICAL_GEOMETRY_SCHEMA_VERSION, id: "paws-wonders-interior", units: "logical-pixels",
  worldBounds: rectCopy("paws-world", PAWS_WONDERS_INTERIOR.room), cameraBounds: logicalRect("paws-camera", 0, 0, 1280, 720),
  collisions: pawsFixtures, navigationObstacles: pawsFixtures,
  interactionZones: Object.freeze(Object.values(pawsDisplays).map((entry) => entry.interaction)),
  touchTargets: Object.freeze(Object.values(pawsDisplays).map((entry) => entry.touchTarget)),
  standingPoints: Object.freeze(Object.values(pawsDisplays).map((entry) => entry.standingPoint)),
  spawnPoints: Object.freeze([logicalPoint("paws-player-spawn", PAWS_WONDERS_INTERIOR.spawn.x, PAWS_WONDERS_INTERIOR.spawn.y, { facing: PAWS_WONDERS_INTERIOR.spawn.facing })]),
  triggerRegions: Object.freeze([logicalCircle("paws-exit", PAWS_WONDERS_INTERIOR.exit.x, PAWS_WONDERS_INTERIOR.exit.y, PAWS_WONDERS_INTERIOR.exit.radius)]),
  occlusionZones: Object.freeze(pawsFixtures), displays: pawsDisplays,
});

const harbourCollisions = Object.freeze([
  logicalRect("harbour-collision-header-wall", HARBOUR_GENERAL_INTERIOR.room.x, HARBOUR_GENERAL_INTERIOR.room.y, HARBOUR_GENERAL_INTERIOR.room.width, 158),
  ...HARBOUR_GENERAL_INTERIOR.fixtures.map((fixture) => rectCopy(`harbour-collision-${fixture.id}`, fixture)),
  rectCopy("harbour-collision-counter", HARBOUR_GENERAL_INTERIOR.counter),
]);
const harbourDisplays = Object.freeze(Object.fromEntries(HARBOUR_GENERAL_INTERIOR.slots.map((slot) => [
  slot.slot,
  displayGeometry("harbour-slot", slot, slot, harbourCollisions, HARBOUR_GENERAL_INTERIOR.room),
])));

export const HARBOUR_GENERAL_GEOMETRY = freezeContract({
  schemaVersion: LOGICAL_GEOMETRY_SCHEMA_VERSION, id: "harbour-general-interior", units: "logical-pixels",
  worldBounds: rectCopy("harbour-world", HARBOUR_GENERAL_INTERIOR.room), cameraBounds: logicalRect("harbour-camera", 0, 0, 1280, 720),
  collisions: harbourCollisions, navigationObstacles: harbourCollisions,
  interactionZones: Object.freeze(Object.values(harbourDisplays).map((entry) => entry.interaction)),
  touchTargets: Object.freeze(Object.values(harbourDisplays).map((entry) => entry.touchTarget)),
  standingPoints: Object.freeze([
    ...Object.values(harbourDisplays).map((entry) => entry.standingPoint),
    logicalPoint("harbour-checkout-standing", HARBOUR_GENERAL_INTERIOR.counter.x + 90, HARBOUR_GENERAL_INTERIOR.counter.y + HARBOUR_GENERAL_INTERIOR.counter.height + 32, { facing: "up" }),
  ]),
  spawnPoints: Object.freeze([logicalPoint("harbour-player-spawn", HARBOUR_GENERAL_INTERIOR.spawn.x, HARBOUR_GENERAL_INTERIOR.spawn.y, { facing: HARBOUR_GENERAL_INTERIOR.spawn.facing })]),
  triggerRegions: Object.freeze([logicalCircle("harbour-exit", HARBOUR_GENERAL_INTERIOR.exit.x, HARBOUR_GENERAL_INTERIOR.exit.y, HARBOUR_GENERAL_INTERIOR.exit.radius)]),
  occlusionZones: harbourCollisions, displays: harbourDisplays,
});
