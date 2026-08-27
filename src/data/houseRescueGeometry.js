import { buildHouseInteriorLayout } from "./homeInteriors.js";

export const HOUSE_RESCUE_GEOMETRY_RULES = Object.freeze({
  vacuumCollisionRadius: 2,
  vacuumPathStep: 0.75,
  reachabilityStep: 1.5,
});

function normalizeRect(item, layout) {
  return {
    ...item,
    x: (item.x - layout.x) / layout.w * 100,
    y: (item.y - layout.y) / layout.h * 100,
    w: item.w / layout.w * 100,
    h: item.h / layout.h * 100,
  };
}

export function buildHouseRescueGeometry(houseId) {
  const layout = buildHouseInteriorLayout({}, houseId);
  if (!layout) return null;
  const point = (x, y) => ({ x: (x - layout.x) / layout.w * 100, y: (y - layout.y) / layout.h * 100 });
  return {
    houseId,
    level: layout.level,
    theme: { ...layout.theme },
    floorZones: [{ x: 2.5, y: 3.5, w: 95, h: 90 }],
    spawnZones: [
      { x: 4, y: 16, w: 27, h: 28 },
      { x: 36, y: 16, w: 27, h: 28 },
      { x: 68, y: 16, w: 27, h: 28 },
      { x: 8, y: 50, w: 35, h: 35 },
      { x: 53, y: 50, w: 35, h: 35 },
    ],
    furniture: layout.furniture.map((item) => normalizeRect(item, layout)),
    partitions: layout.partitions.map((partition) => ({
      ...point(partition.x1, partition.y1),
      x2: point(partition.x2, partition.y2).x,
      y2: point(partition.x2, partition.y2).y,
    })),
    door: normalizeRect(layout.door, layout),
  };
}

export function distancePointToSegment(x, y, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSquared = dx * dx + dy * dy;
  if (!lengthSquared) return Math.hypot(x - x1, y - y1);
  const amount = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / lengthSquared));
  return Math.hypot(x - (x1 + amount * dx), y - (y1 + amount * dy));
}

export function houseRescuePointInZones(x, y, zones = [], radius = 0) {
  return !zones.length || zones.some((zone) => x >= zone.x + radius && x <= zone.x + zone.w - radius && y >= zone.y + radius && y <= zone.y + zone.h - radius);
}

export function houseRescueGeometryBlocked(geometry, x, y, radius = HOUSE_RESCUE_GEOMETRY_RULES.vacuumCollisionRadius) {
  if (!geometry || !houseRescuePointInZones(x, y, geometry.floorZones, radius * 0.15)) return true;
  if (geometry.furniture.some((item) => !item.floorLayer && x > item.x - radius && x < item.x + item.w + radius && y > item.y - radius && y < item.y + item.h + radius)) return true;
  return geometry.partitions.some((partition) => distancePointToSegment(x, y, partition.x, partition.y, partition.x2, partition.y2) <= radius + 1);
}

export function houseRescueGeometryPathClear(geometry, from, to, radius = HOUSE_RESCUE_GEOMETRY_RULES.vacuumCollisionRadius) {
  const distance = Math.hypot(to.x - from.x, to.y - from.y);
  const steps = Math.max(1, Math.ceil(distance / HOUSE_RESCUE_GEOMETRY_RULES.vacuumPathStep));
  for (let index = 1; index <= steps; index += 1) {
    const progress = index / steps;
    if (houseRescueGeometryBlocked(geometry, from.x + (to.x - from.x) * progress, from.y + (to.y - from.y) * progress, radius)) return false;
  }
  return true;
}

export function houseRescueReachablePoints(geometry, start, radius = HOUSE_RESCUE_GEOMETRY_RULES.vacuumCollisionRadius) {
  if (!geometry) return [];
  const step = HOUSE_RESCUE_GEOMETRY_RULES.reachabilityStep;
  const nodes = [];
  const byGrid = new Map();
  for (let row = 0, y = radius; y <= 100 - radius + 0.001; row += 1, y = radius + row * step) {
    for (let column = 0, x = radius; x <= 100 - radius + 0.001; column += 1, x = radius + column * step) {
      if (houseRescueGeometryBlocked(geometry, x, y, radius)) continue;
      const node = { x, y, row, column };
      nodes.push(node);
      byGrid.set(`${column}:${row}`, node);
    }
  }
  if (!nodes.length) return [];
  const desired = start || { x: geometry.door.x + geometry.door.w / 2, y: 90 };
  const ordered = [...nodes].sort((left, right) => Math.hypot(left.x - desired.x, left.y - desired.y) - Math.hypot(right.x - desired.x, right.y - desired.y));
  const first = ordered.find((node) => houseRescueGeometryPathClear(geometry, desired, node, radius)) || ordered[0];
  const directions = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];
  const queue = [first];
  const visited = new Set([`${first.column}:${first.row}`]);
  const reachable = [];
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const node = queue[cursor];
    reachable.push({ x: node.x, y: node.y });
    for (const [dc, dr] of directions) {
      const next = byGrid.get(`${node.column + dc}:${node.row + dr}`);
      const key = next && `${next.column}:${next.row}`;
      if (!next || visited.has(key) || !houseRescueGeometryPathClear(geometry, node, next, radius)) continue;
      visited.add(key);
      queue.push(next);
    }
  }
  return reachable;
}

export function houseRescueVacuumStart(geometry) {
  const desired = { x: geometry.door.x + geometry.door.w / 2, y: 90 };
  return houseRescueReachablePoints(geometry, desired)[0] || desired;
}

export function constrainHouseRescueVacuum(geometry, from, target, radius = HOUSE_RESCUE_GEOMETRY_RULES.vacuumCollisionRadius) {
  const px = Math.max(radius, Math.min(100 - radius, Number(target?.x) || from.x));
  const py = Math.max(radius, Math.min(100 - radius, Number(target?.y) || from.y));
  const distance = Math.hypot(px - from.x, py - from.y);
  const steps = Math.max(1, Math.ceil(distance / HOUSE_RESCUE_GEOMETRY_RULES.vacuumPathStep));
  const dx = (px - from.x) / steps;
  const dy = (py - from.y) / steps;
  let current = { ...from };
  for (let index = 0; index < steps; index += 1) {
    const desired = { x: current.x + dx, y: current.y + dy };
    const axisX = { x: desired.x, y: current.y };
    const axisY = { x: current.x, y: desired.y };
    const candidates = Math.abs(dx) >= Math.abs(dy) ? [desired, axisX, axisY] : [desired, axisY, axisX];
    const next = candidates.find((candidate) => !houseRescueGeometryBlocked(geometry, candidate.x, candidate.y, radius) && houseRescueGeometryPathClear(geometry, current, candidate, radius));
    if (!next) break;
    current = next;
  }
  return current;
}
