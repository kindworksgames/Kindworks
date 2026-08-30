export const LOGICAL_GEOMETRY_SCHEMA_VERSION = 1;

export function logicalPoint(id, x, y, extra = {}) {
  return Object.freeze({ id, kind: "point", x: Number(x), y: Number(y), ...extra });
}

export function logicalRect(id, x, y, width, height, extra = {}) {
  return Object.freeze({ id, kind: "rect", x: Number(x), y: Number(y), width: Number(width), height: Number(height), ...extra });
}

export function logicalCircle(id, x, y, radius, extra = {}) {
  return Object.freeze({ id, kind: "circle", x: Number(x), y: Number(y), radius: Number(radius), ...extra });
}

export function pointInLogicalRect(point, rect, margin = 0) {
  return point.x >= rect.x - margin && point.x <= rect.x + rect.width + margin
    && point.y >= rect.y - margin && point.y <= rect.y + rect.height + margin;
}

export function circleTouchesLogicalRect(x, y, radius, rect) {
  const closestX = Math.max(rect.x, Math.min(x, rect.x + rect.width));
  const closestY = Math.max(rect.y, Math.min(y, rect.y + rect.height));
  return Math.hypot(x - closestX, y - closestY) < radius;
}

export function distanceToLogicalSegment(point, start, end) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  const amount = lengthSquared ? Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared)) : 0;
  return Math.hypot(point.x - (start.x + dx * amount), point.y - (start.y + dy * amount));
}

export function segmentTouchesLogicalCircle(start, end, circle, margin = 0) {
  return distanceToLogicalSegment(circle, start, end) < circle.radius + margin;
}

export function validateLogicalGeometryContract(contract) {
  const errors = [];
  if (contract?.schemaVersion !== LOGICAL_GEOMETRY_SCHEMA_VERSION) errors.push("Unsupported logical-geometry schema version.");
  if (!contract?.id) errors.push("Logical-geometry contract requires a stable id.");
  if (contract?.units !== "logical-pixels") errors.push(`${contract?.id || "contract"} must use logical-pixels.`);
  const entries = [
    ...(contract?.collisions || []), ...(contract?.navigationObstacles || []), ...(contract?.interactionZones || []),
    ...(contract?.touchTargets || []), ...(contract?.occlusionZones || []), ...(contract?.spawnPoints || []),
    ...(contract?.standingPoints || []), ...(contract?.triggerRegions || []),
  ];
  const ids = new Map();
  for (const entry of entries) {
    if (!entry?.id) errors.push(`${contract?.id || "contract"} contains geometry without an id.`);
    else if (ids.has(entry.id) && ids.get(entry.id) !== entry) errors.push(`${contract.id} contains duplicate geometry id ${entry.id}.`);
    else ids.set(entry.id, entry);
    if (!Number.isFinite(entry?.x) || !Number.isFinite(entry?.y)) errors.push(`${entry?.id || "entry"} has an invalid position.`);
    if (entry?.kind === "rect" && (!(entry.width > 0) || !(entry.height > 0))) errors.push(`${entry.id} has an invalid rectangle.`);
    if (entry?.kind === "circle" && !(entry.radius > 0)) errors.push(`${entry.id} has an invalid radius.`);
  }
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors) });
}
