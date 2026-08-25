import {
  ALLOTMENT_CONFIG,
  FARMING_CROPS,
  FARMING_SCHEMA_VERSION,
  LAWN_PLOTS,
  ORCHARD_CONFIG,
  absoluteWorldMinute,
} from "../data/farming.js";

function bounded(value, minimum, maximum, fallback = minimum) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(minimum, Math.min(maximum, number)) : fallback;
}

function whole(value, minimum = 0, maximum = Number.MAX_SAFE_INTEGER) {
  return Math.floor(bounded(value, minimum, maximum, minimum));
}

export function createFreshFarmingState(world) {
  return {
    schemaVersion: FARMING_SCHEMA_VERSION,
    lastResolvedAbsoluteMinute: absoluteWorldMinute(world),
    allotment: {
      unlockedBeds: ALLOTMENT_CONFIG.starterUnlockedBeds,
      beds: Array.from({ length: ALLOTMENT_CONFIG.bedCount }, (_, index) => ({
        id: `allotment-bed-${index + 1}`,
        unlocked: index < ALLOTMENT_CONFIG.starterUnlockedBeds,
        cropId: null,
        status: "empty",
        growthMinutes: 0,
        harvests: 0,
        totalHarvested: 0,
      })),
    },
    orchard: {
      trees: [{
        id: "apple-tree-1",
        status: "mature",
        fruitProgressMinutes: ORCHARD_CONFIG.productionMinutes,
        availableFruit: 1,
        harvests: 0,
        totalHarvested: 0,
      }],
    },
    lawns: Object.fromEntries(LAWN_PLOTS.map((plot) => [plot.id, {
      id: plot.id,
      grassHeight: plot.initialGrass,
      weedPressure: plot.initialWeeds,
      completedJobs: 0,
      lastCompletedAt: null,
    }])),
  };
}

function normalizeBed(value, index) {
  const source = value && typeof value === "object" ? value : {};
  const cropId = FARMING_CROPS[source.cropId] ? source.cropId : null;
  const unlocked = index < ALLOTMENT_CONFIG.starterUnlockedBeds || Boolean(source.unlocked);
  const status = unlocked && cropId && ["growing", "ready"].includes(source.status) ? source.status : "empty";
  return {
    id: `allotment-bed-${index + 1}`,
    unlocked,
    cropId: status === "empty" ? null : cropId,
    status,
    growthMinutes: status === "empty" ? 0 : bounded(source.growthMinutes, 0, FARMING_CROPS[cropId].growMinutes, status === "ready" ? FARMING_CROPS[cropId].growMinutes : 0),
    harvests: whole(source.harvests),
    totalHarvested: whole(source.totalHarvested),
  };
}

export function normalizeFarmingState(value, world) {
  const fresh = createFreshFarmingState(world);
  if (!value || typeof value !== "object" || Array.isArray(value)) return fresh;
  const next = structuredClone(fresh);
  next.lastResolvedAbsoluteMinute = whole(value.lastResolvedAbsoluteMinute, 0, absoluteWorldMinute(world));
  next.allotment.beds = Array.from({ length: ALLOTMENT_CONFIG.bedCount }, (_, index) => normalizeBed(value.allotment?.beds?.[index], index));
  next.allotment.unlockedBeds = next.allotment.beds.filter((bed) => bed.unlocked).length;
  const tree = value.orchard?.trees?.[0];
  if (tree && typeof tree === "object") {
    next.orchard.trees[0] = {
      id: "apple-tree-1",
      status: "mature",
      fruitProgressMinutes: bounded(tree.fruitProgressMinutes, 0, ORCHARD_CONFIG.productionMinutes, 0),
      availableFruit: whole(tree.availableFruit, 0, ORCHARD_CONFIG.maxFruit),
      harvests: whole(tree.harvests),
      totalHarvested: whole(tree.totalHarvested),
    };
  }
  for (const plot of LAWN_PLOTS) {
    const lawn = value.lawns?.[plot.id];
    if (!lawn || typeof lawn !== "object") continue;
    next.lawns[plot.id] = {
      id: plot.id,
      grassHeight: bounded(lawn.grassHeight, 0, 100, plot.initialGrass),
      weedPressure: bounded(lawn.weedPressure, 0, 100, plot.initialWeeds),
      completedJobs: whole(lawn.completedJobs),
      lastCompletedAt: Number.isNaN(new Date(lawn.lastCompletedAt).getTime()) ? null : new Date(lawn.lastCompletedAt).toISOString(),
    };
  }
  return next;
}

export function projectLegacyFarming(legacy, world) {
  const next = createFreshFarmingState(world);
  const source = legacy?.farmingFoundation;
  if (!source || typeof source !== "object") return next;
  const normalized = normalizeFarmingState(null, world);
  const beds = Array.isArray(source.allotment?.beds) ? source.allotment.beds : [];
  normalized.allotment.beds = Array.from({ length: ALLOTMENT_CONFIG.bedCount }, (_, index) => {
    const bed = beds[index];
    if (!bed) return normalizeBed(null, index);
    const crop = FARMING_CROPS[bed.cropId];
    const status = crop && ["growing", "ready"].includes(bed.status) ? bed.status : "empty";
    const planted = Number(bed.plantedAtGameMinute);
    const ready = Number(bed.readyAtGameMinute);
    const elapsed = Number.isFinite(planted) ? Math.max(0, absoluteWorldMinute(world) - planted) : 0;
    return normalizeBed({
      ...bed,
      status,
      growthMinutes: status === "ready" ? crop?.growMinutes : Math.min(crop?.growMinutes || 0, Number.isFinite(ready) ? Math.min(elapsed, ready - planted) : elapsed),
    }, index);
  });
  normalized.allotment.unlockedBeds = normalized.allotment.beds.filter((bed) => bed.unlocked).length;
  const oldTree = source.orchard?.slots?.find((tree) => tree?.treeType === "apple") || source.orchard?.slots?.[0];
  if (oldTree) normalized.orchard.trees[0] = {
    id: "apple-tree-1",
    status: "mature",
    fruitProgressMinutes: oldTree.availableFruit > 0 ? ORCHARD_CONFIG.productionMinutes : 0,
    availableFruit: oldTree.availableFruit > 0 ? 1 : 0,
    harvests: whole(oldTree.harvests),
    totalHarvested: whole(oldTree.totalHarvested),
  };
  const lawns = legacy?.lawns;
  if (lawns && typeof lawns === "object") {
    LAWN_PLOTS.forEach((plot, index) => {
      const raw = Object.values(lawns)[index];
      if (raw) normalized.lawns[plot.id] = { ...normalized.lawns[plot.id], grassHeight: bounded(raw.grassHeight, 0, 100, plot.initialGrass), weedPressure: bounded(raw.weedPressure, 0, 100, plot.initialWeeds) };
    });
  }
  return normalized;
}

export function validateFarmingState(farming, world) {
  const errors = [];
  if (!farming || typeof farming !== "object" || Array.isArray(farming)) return { ok: false, errors: ["Farming state is missing."] };
  if (farming.schemaVersion !== FARMING_SCHEMA_VERSION) errors.push("Farming schema version is unsupported.");
  const now = absoluteWorldMinute(world);
  if (!Number.isInteger(farming.lastResolvedAbsoluteMinute) || farming.lastResolvedAbsoluteMinute < 0 || farming.lastResolvedAbsoluteMinute > now) errors.push("Farming resolution time is invalid.");
  if (!Array.isArray(farming.allotment?.beds) || farming.allotment.beds.length !== ALLOTMENT_CONFIG.bedCount) errors.push("Allotment beds are invalid.");
  else farming.allotment.beds.forEach((bed, index) => {
    if (bed.id !== `allotment-bed-${index + 1}` || typeof bed.unlocked !== "boolean" || !["empty", "growing", "ready"].includes(bed.status)) errors.push(`Allotment bed ${index + 1} is invalid.`);
    if (bed.status !== "empty" && !FARMING_CROPS[bed.cropId]) errors.push(`Allotment bed ${index + 1} has an invalid crop.`);
    if (!Number.isFinite(bed.growthMinutes) || bed.growthMinutes < 0 || (bed.cropId && bed.growthMinutes > FARMING_CROPS[bed.cropId].growMinutes)) errors.push(`Allotment bed ${index + 1} growth is invalid.`);
  });
  if (farming.allotment?.unlockedBeds !== farming.allotment?.beds?.filter((bed) => bed.unlocked).length) errors.push("Unlocked allotment bed count is invalid.");
  const tree = farming.orchard?.trees?.[0];
  if (!tree || tree.id !== "apple-tree-1" || tree.status !== "mature" || !Number.isFinite(tree.fruitProgressMinutes) || tree.fruitProgressMinutes < 0 || tree.fruitProgressMinutes > ORCHARD_CONFIG.productionMinutes || !Number.isInteger(tree.availableFruit) || tree.availableFruit < 0 || tree.availableFruit > 1) errors.push("Starter orchard tree is invalid.");
  for (const plot of LAWN_PLOTS) {
    const lawn = farming.lawns?.[plot.id];
    if (!lawn || lawn.id !== plot.id || !Number.isFinite(lawn.grassHeight) || lawn.grassHeight < 0 || lawn.grassHeight > 100 || !Number.isFinite(lawn.weedPressure) || lawn.weedPressure < 0 || lawn.weedPressure > 100 || !Number.isInteger(lawn.completedJobs) || lawn.completedJobs < 0) errors.push(`${plot.id} lawn state is invalid.`);
  }
  return { ok: errors.length === 0, errors };
}
