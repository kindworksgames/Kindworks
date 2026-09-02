import { houseExteriorDirtStage } from "../data/houseRescue.js";
import { HOUSES, PATHS, ROADS, TOWN_REFERENCE_LAYOUT, WORLD } from "../data/town.js";

const HOUSE_STATES = Object.freeze(["clean", "weathered", "job-ready", "job-ready"]);
const LAWN_STATES = Object.freeze(["fresh-cut", "growing", "long", "job-ready"]);
const LAWN_WEED_STATES = Object.freeze(["none", "light", "job-ready", "heavy"]);
export const APPROVED_WORLD_LAWN_REPEAT_MODE = "seamless-lawn-tile-clipped-to-protected-yard-mask";
const position = (x, y, extra = {}) => ({ position: { x, y }, visible: true, ...extra });
const lawnStage = (height) => height < 20 ? 0 : height < 45 ? 1 : height < 70 ? 2 : 3;
const lawnWeedStage = (pressure) => pressure < 18 ? 0 : pressure < 38 ? 1 : pressure < 55 ? 2 : 3;

function localWorldOrigin(instance) {
  const x = Number(instance.worldOrigin?.x || 0);
  const y = Number(instance.worldOrigin?.y || 0);
  return {
    x: x === 0 ? 0 : -x,
    y: y === 0 ? 0 : -y,
  };
}

function surfaceSegment(instance, a, b, width, id, frame = 0, depth = 9) {
  const origin = localWorldOrigin(instance);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = Math.hypot(dx, dy);
  const trim = Math.min(width / 2, Math.max(0, length / 2 - 1));
  const unitX = length ? dx / length : 0;
  const unitY = length ? dy / length : 0;
  const start = { x: a.x + unitX * trim, y: a.y + unitY * trim };
  const end = { x: b.x - unitX * trim, y: b.y - unitY * trim };
  return position((start.x + end.x) / 2 + origin.x, (start.y + end.y) / 2 + origin.y, {
    id,
    frame,
    tileArea: { width: Math.max(2, Math.ceil(Math.hypot(end.x - start.x, end.y - start.y))), height: width },
    origin: { x: 0.5, y: 0.5 },
    rotation: Math.atan2(dy, dx),
    depth,
  });
}

function townRoadPlacements(instance) {
  const placements = [];
  for (const road of ROADS) {
    const roadPoints = road.points.map(([x, y]) => ({ x, y }));
    // The matching rounded Graphics road beneath these strips owns joins.
    // Do not stack square/rotated texture nodes here: overlapping asphalt
    // pieces create visible star-shaped colour blocks at every control point.
    for (let index = 0; index < roadPoints.length - 1; index += 1) {
      placements.push(surfaceSegment(instance, roadPoints[index], roadPoints[index + 1], road.width, `${road.id}:road-segment-${index + 1}`, 0, 10.25));
    }
  }
  return placements;
}

function pavementArea(instance, area, frame, depth, suffix = "centre") {
  const origin = localWorldOrigin(instance);
  return position(area.x + area.width / 2 + origin.x, area.y + area.height / 2 + origin.y, {
    id: `${area.id}:${suffix}`,
    frame,
    tileArea: { width: area.width, height: area.height },
    origin: { x: 0.5, y: 0.5 },
    rotation: 0,
    depth,
  });
}

function borderedPavementArea(instance, area, depth) {
  if (area.width < 128 || area.height < 128) return [pavementArea(instance, area, 0, depth)];
  const edge = 64;
  return [
    pavementArea(instance, { ...area, x: area.x + edge, y: area.y + edge, width: area.width - edge * 2, height: area.height - edge * 2 }, 0, depth),
    pavementArea(instance, { ...area, x: area.x + edge, width: area.width - edge * 2, height: edge }, 1, depth, "north-edge"),
    pavementArea(instance, { ...area, x: area.x + area.width - edge, width: edge }, 2, depth, "east-edge"),
    pavementArea(instance, { ...area, x: area.x + edge, y: area.y + area.height - edge, width: area.width - edge * 2, height: edge }, 3, depth, "south-edge"),
    pavementArea(instance, { ...area, width: edge }, 4, depth, "west-edge"),
    pavementArea(instance, { ...area, x: area.x + area.width - edge, width: edge, height: edge }, 5, depth, "north-east-corner"),
    pavementArea(instance, { ...area, x: area.x + area.width - edge, y: area.y + area.height - edge, width: edge, height: edge }, 6, depth, "south-east-corner"),
    pavementArea(instance, { ...area, y: area.y + area.height - edge, width: edge, height: edge }, 7, depth, "south-west-corner"),
    pavementArea(instance, { ...area, width: edge, height: edge }, 8, depth, "north-west-corner"),
  ];
}

function houseWalkPlacements(instance) {
  const width = TOWN_REFERENCE_LAYOUT.pavement.houseWalkWidth;
  return HOUSES.map((house) => {
    const centreX = house.x + house.width / 2;
    const houseEdgeY = house.gate === "north" ? house.y : house.y + house.height;
    const road = ROADS
      .filter((candidate) => candidate.points.every(([, y]) => y === candidate.points[0][1]))
      .filter((candidate) => {
        const xs = candidate.points.map(([x]) => x);
        return centreX >= Math.min(...xs) && centreX <= Math.max(...xs);
      })
      .sort((left, right) => Math.abs(left.points[0][1] - houseEdgeY) - Math.abs(right.points[0][1] - houseEdgeY))[0];
    if (!road) throw new Error(`${house.id} has no horizontal street connection.`);
    const roadY = road.points[0][1];
    const streetEdgeY = roadY + (houseEdgeY < roadY ? -road.width / 2 : road.width / 2);
    return pavementArea(instance, {
      id: `${house.id}:front-walk`,
      x: centreX - width / 2,
      y: Math.min(houseEdgeY, streetEdgeY),
      width,
      height: Math.max(24, Math.abs(streetEdgeY - houseEdgeY)),
    }, 0, 22);
  });
}

function townPavementPlacements(instance) {
  const placements = [];
  for (const route of [...ROADS, ...PATHS]) {
    // Existing route coordinates remain the sole geometry owner. Pavement is
    // split into narrow repeatable presentation segments, so no display object
    // can ever cover the world, river, ponds, beach, or unrelated grass.
    const width = route.width + (ROADS.includes(route) ? 16 : 8);
    const authoredPoints = TOWN_REFERENCE_LAYOUT.pavement.visualPathOverrides[route.id] || route.points;
    const routePoints = authoredPoints.map(([x, y]) => ({ x, y }));
    for (let index = 0; index < routePoints.length - 1; index += 1) {
      placements.push(surfaceSegment(instance, routePoints[index], routePoints[index + 1], width, `${route.id}:segment-${index + 1}`));
    }
  }
  placements.push(...houseWalkPlacements(instance));
  for (const area of TOWN_REFERENCE_LAYOUT.pavement.commercialAreas) {
    placements.push(...(area.transition === "none" ? [pavementArea(instance, area, 0, 8)] : borderedPavementArea(instance, area, 8)));
  }
  return placements;
}

function repeat(instance, binding) {
  const mode = binding.repeat;
  if (mode === "cover-town-ground") {
    const origin = localWorldOrigin(instance);
    return [position(origin.x, origin.y, { tileArea: { width: WORLD.width, height: WORLD.height }, depth: 0 })];
  }
  if (mode === "surface-autotile") return townPavementPlacements(instance);
  if (mode === "road-surface-autotile") return townRoadPlacements(instance);
  if (mode === APPROVED_WORLD_LAWN_REPEAT_MODE) {
    const yard = binding.protectedWorldYard;
    if (![yard?.x, yard?.y, yard?.width, yard?.height].every(Number.isFinite) || yard.width <= 0 || yard.height <= 0) {
      throw new Error(`${instance.id} requires a valid protectedWorldYard for ${APPROVED_WORLD_LAWN_REPEAT_MODE}.`);
    }
    const origin = localWorldOrigin(instance);
    return [position(yard.x + yard.width / 2 + origin.x, yard.y + yard.height / 2 + origin.y, {
      id: `${binding.protectedWorldObjectId || instance.id}:approved-lawn-surface`,
      tileArea: { width: yard.width, height: yard.height },
      origin: { x: 0.5, y: 0.5 },
      depth: 19,
    })];
  }
  if (mode === "horizontal-strip") return Array.from({ length: 20 }, (_, index) => position(32 + index * 64, instance.position.y));
  if (mode === "vertical-banks") return Array.from({ length: 12 }, (_, index) => position(instance.position.x, 32 + index * 64, { frame: index % 2 }));
  if (mode === "yard-boundary") return [position(215, 155), position(343, 155), position(471, 155), position(215, 480), position(343, 480, { frame: 1 }), position(471, 480)];
  return null;
}

/** Town presentation bindings read live state but never own or mutate it. */
export function createTownApprovedSceneBindings(scene) {
  return {
    placementResolver(instance, binding) {
      if (binding.mode === "repeat") return repeat(instance, binding);
      if (binding.mode === "dynamic" && instance.id.endsWith(".player")) {
        const actor = scene.customResident?.getSnapshot?.().controlling ? scene.customResidentCharacter : scene.player;
        return actor ? [position(actor.x - Number(instance.worldOrigin?.x || 0), actor.y - Number(instance.worldOrigin?.y || 0), { facing: actor.direction || "down", visible: actor.visible !== false })] : [];
      }
      if (binding.npcIdentityBinding) {
        const character = scene.npcCharacters?.values?.().next?.().value;
        return character ? [position(character.x - Number(instance.worldOrigin?.x || 0), character.y - Number(instance.worldOrigin?.y || 0), { facing: character.direction || "down", visible: character.visible !== false })] : [];
      }
      if (binding.speciesBinding) {
        const character = scene.animalCharacters?.get?.(binding.speciesBinding);
        return character ? [position(character.x - Number(instance.worldOrigin?.x || 0), character.y - Number(instance.worldOrigin?.y || 0), { facing: character.direction || "down", visible: character.visible !== false })] : [];
      }
      if (binding.mode === "contextual") return [position(instance.position.x, instance.position.y, { visible: Boolean(scene.interactions?.getState?.()?.id?.includes?.("lawn")) })];
      if (binding.mode === "event") return [position(instance.position.x, instance.position.y, { visible: false })];
      return null;
    },
    stateResolver(instance, placement) {
      const binding = instance.binding || {};
      if (placement?.stateName) return placement.stateName;
      if (instance.id.endsWith("house-6")) {
        const snapshot = scene.gameState?.getSnapshot?.();
        return HOUSE_STATES[houseExteriorDirtStage(snapshot?.houseRescue?.homes?.["house-6"], snapshot?.world?.day || 1)] || "clean";
      }
      if (binding.protectedWorldObjectId && binding.visualLayerRole === "growth") {
        const lawn = scene.gameState?.getSnapshot?.()?.farming?.lawns?.[binding.protectedWorldObjectId];
        return LAWN_STATES[lawnStage(lawn?.grassHeight || 0)];
      }
      if (binding.protectedWorldObjectId && binding.visualLayerRole === "weeds") {
        const lawn = scene.gameState?.getSnapshot?.()?.farming?.lawns?.[binding.protectedWorldObjectId];
        return LAWN_WEED_STATES[lawnWeedStage(lawn?.weedPressure || 0)];
      }
      return null;
    },
  };
}
