import { BRIDGES, ROADS } from "./town.js";

export const MUNICIPAL_COLLECTION_SCHEMA_VERSION = 2;

export const MUNICIPAL_COLLECTION_CONFIG = Object.freeze({
  schemaVersion: MUNICIPAL_COLLECTION_SCHEMA_VERSION,
  layoutVersion: 2,
  intervalDays: 7,
  firstCollectionDay: 7,
  startMinute: 7 * 60,
  publicBinCapacity: 12,
  truckSpeed: 175,
  collectorSpeed: 118,
  nodeMergeTolerance: 24,
  roadTolerance: 8,
  allowedRoadIds: Object.freeze([
    "north-road",
    "market-loop",
    "mill-lane",
    "willow-lane",
    "high-street",
    "commercial-loop",
    "east-lower-link",
    "south-shore-road",
    "station-road",
  ]),
  allowedBridgeIds: Object.freeze(["north-bridge", "mill-bridge", "willow-bridge"]),
  phaseSeconds: Object.freeze({ dismounting: 0.55, lifting: 0.65, emptying: 1.15, placing: 0.55, boarding: 0.55 }),
});

export const MUNICIPAL_COLLECTOR = Object.freeze({
  id: "municipal-collector",
  name: "Gavin",
  role: "Bin collector",
  vehicle: "Willowmere recycling lorry",
});

export const MUNICIPAL_COLLECTION_PHASES = Object.freeze([
  "waiting",
  "driving",
  "dismounting",
  "walking-to-bin",
  "lifting",
  "walking-bin-to-truck",
  "emptying",
  "returning-bin",
  "placing",
  "walking-to-truck",
  "boarding",
  "returning-depot",
  "complete",
]);

export const MUNICIPAL_DEPOT = Object.freeze({ x: ROADS[0]?.points?.[0]?.[0] ?? 130, y: ROADS[0]?.points?.[0]?.[1] ?? 530 });

export function nextMunicipalCollectionDay(day = 1) {
  const current = Math.max(1, Math.floor(Number(day) || 1));
  return Math.max(MUNICIPAL_COLLECTION_CONFIG.firstCollectionDay, Math.ceil(current / MUNICIPAL_COLLECTION_CONFIG.intervalDays) * MUNICIPAL_COLLECTION_CONFIG.intervalDays);
}

function closestPointOnSegment(x, y, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const denominator = dx * dx + dy * dy;
  const ratio = denominator ? Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / denominator)) : 0;
  const pointX = a[0] + dx * ratio;
  const pointY = a[1] + dy * ratio;
  return { x: pointX, y: pointY, ratio, distance: Math.hypot(x - pointX, y - pointY) };
}

export function municipalVehicleSources() {
  const roads = ROADS.filter((road) => MUNICIPAL_COLLECTION_CONFIG.allowedRoadIds.includes(road.id))
    .map((road) => ({ id: road.id, kind: "street", width: road.width, points: road.points }));
  const bridges = BRIDGES.filter((bridge) => MUNICIPAL_COLLECTION_CONFIG.allowedBridgeIds.includes(bridge.id))
    .map((bridge) => ({ id: bridge.id, kind: "bridge", width: bridge.height, points: [[bridge.x, bridge.y], [bridge.x + bridge.width, bridge.y]] }));
  return [...roads, ...bridges];
}

export function municipalVehicleAllowedAt(x, y, tolerance = MUNICIPAL_COLLECTION_CONFIG.roadTolerance) {
  for (const source of municipalVehicleSources()) {
    for (let index = 1; index < source.points.length; index += 1) {
      const hit = closestPointOnSegment(x, y, source.points[index - 1], source.points[index]);
      if (hit.distance <= source.width / 2 + tolerance) return true;
    }
  }
  return false;
}

export function buildMunicipalVehicleNetwork() {
  const nodes = [];
  const edges = new Map();
  const segments = [];
  const addNode = (point, source) => {
    let node = nodes.find((candidate) => Math.hypot(candidate.x - point[0], candidate.y - point[1]) <= MUNICIPAL_COLLECTION_CONFIG.nodeMergeTolerance);
    if (!node) {
      node = { id: `municipal-road-${nodes.length}`, x: point[0], y: point[1], sources: [] };
      nodes.push(node);
      edges.set(node.id, new Map());
    }
    if (!node.sources.includes(source.id)) node.sources.push(source.id);
    return node;
  };
  const link = (a, b, source) => {
    const distance = Math.hypot(b.x - a.x, b.y - a.y);
    if (!distance) return;
    edges.get(a.id).set(b.id, Math.min(edges.get(a.id).get(b.id) ?? Infinity, distance));
    edges.get(b.id).set(a.id, Math.min(edges.get(b.id).get(a.id) ?? Infinity, distance));
    segments.push({ a: a.id, b: b.id, sourceId: source.id, kind: source.kind, width: source.width });
  };
  for (const source of municipalVehicleSources()) {
    let previous = null;
    for (const point of source.points) {
      const node = addNode(point, source);
      if (previous && previous.id !== node.id) link(previous, node, source);
      previous = node;
    }
  }
  return { nodes: new Map(nodes.map((node) => [node.id, node])), edges, segments, depotId: nodes[0]?.id ?? null };
}

export function closestMunicipalRoadNode(network, x, y) {
  let best = null;
  let distance = Infinity;
  for (const node of network.nodes.values()) {
    const candidate = Math.hypot(node.x - x, node.y - y);
    if (candidate < distance) {
      best = node;
      distance = candidate;
    }
  }
  return best ? { node: best, distance } : null;
}

export function municipalShortestPath(network, startId, endId) {
  if (!startId || !endId || !network.nodes.has(startId) || !network.nodes.has(endId)) return { ids: [], distance: Infinity };
  const distances = new Map([[startId, 0]]);
  const previous = new Map();
  const open = new Set(network.nodes.keys());
  while (open.size) {
    let current = null;
    let best = Infinity;
    for (const id of open) {
      const value = distances.get(id) ?? Infinity;
      if (value < best) { current = id; best = value; }
    }
    if (current === null || best === Infinity) break;
    open.delete(current);
    if (current === endId) break;
    for (const [next, weight] of network.edges.get(current) || []) {
      if (!open.has(next)) continue;
      const candidate = best + weight;
      if (candidate < (distances.get(next) ?? Infinity)) {
        distances.set(next, candidate);
        previous.set(next, current);
      }
    }
  }
  if (!distances.has(endId)) return { ids: [], distance: Infinity };
  const ids = [];
  for (let id = endId; id !== undefined; id = previous.get(id)) {
    ids.unshift(id);
    if (id === startId) break;
  }
  return ids[0] === startId ? { ids, distance: distances.get(endId) } : { ids: [], distance: Infinity };
}

export function planMunicipalCollectionStops(records) {
  const network = buildMunicipalVehicleNetwork();
  const remaining = records.map((record) => {
    const road = closestMunicipalRoadNode(network, record.x, record.y);
    return {
      identity: record.identity,
      type: record.type,
      id: record.id,
      nodeId: record.nodeId ?? null,
      label: record.label,
      itemId: record.itemId ?? null,
      roadNodeId: road?.node.id ?? network.depotId,
      roadX: road?.node.x ?? record.x,
      roadY: road?.node.y ?? record.y,
      originalX: record.x,
      originalY: record.y,
      originalRotation: Number(record.rotation) || 0,
      completed: false,
    };
  });
  const stops = [];
  let current = network.depotId;
  while (remaining.length) {
    let choice = 0;
    let best = Infinity;
    for (let index = 0; index < remaining.length; index += 1) {
      const route = municipalShortestPath(network, current, remaining[index].roadNodeId);
      const score = route.distance + Math.hypot(remaining[index].originalX - remaining[index].roadX, remaining[index].originalY - remaining[index].roadY) * 0.18;
      if (score < best) { best = score; choice = index; }
    }
    const [next] = remaining.splice(choice, 1);
    stops.push(next);
    current = next.roadNodeId;
  }
  return { network, stops };
}
