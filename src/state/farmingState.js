import {
  ALLOTMENT_CONFIG,
  FARMING_CROPS,
  FARMING_SCHEMA_VERSION,
  LAWN_PLOTS,
  LEGACY_ORCHARD_TREE_POSITIONS,
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

function treeSerial(id) {
  const match = String(id || "").match(/(\d+)$/);
  return match ? whole(match[1]) : 0;
}

function starterTree() {
  return {
    id: "apple-tree-1",
    x: ORCHARD_CONFIG.starterPosition.x,
    y: ORCHARD_CONFIG.starterPosition.y,
    status: "mature",
    growthMinutes: ORCHARD_CONFIG.maturityMinutes,
    fruitProgressMinutes: ORCHARD_CONFIG.productionMinutes,
    availableFruit: 1,
    harvests: 0,
    totalHarvested: 0,
    plantedAtGameMinute: null,
  };
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
      nextTreeSerial: 2,
      purchasedSaplings: 0,
      trees: [starterTree()],
    },
    lawns: Object.fromEntries(LAWN_PLOTS.map((plot) => [plot.id, {
      id: plot.id,
      grassHeight: plot.initialGrass,
      weedPressure: plot.initialWeeds,
      moisture: plot.initialMoisture,
      soilHealth: plot.soilHealth,
      growthRate: plot.growthRate,
      weedSusceptibility: plot.weedRate,
      maintenanceCadence: plot.maintenanceCadence,
      shade: plot.shade,
      householdCare: plot.householdCare,
      ecologyAgeGameMinutes: 0,
      lastResidentCareDay: 0,
      lastMowedDay: 0,
      lastMowedGameMinute: 0,
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

function normalizeTree(value, index, world, { legacyFoundation = false } = {}) {
  const source = value && typeof value === "object" ? value : {};
  const fallback = LEGACY_ORCHARD_TREE_POSITIONS[index] || {
    x: ORCHARD_CONFIG.starterPosition.x + (index % 4) * 72,
    y: ORCHARD_CONFIG.starterPosition.y + Math.floor(index / 4) * 72,
  };
  const rawStatus = source.status === "planted" ? "growing" : source.status;
  const status = ["growing", "mature"].includes(rawStatus) ? rawStatus : index === 0 ? "mature" : "growing";
  const now = absoluteWorldMinute(world);
  let growthMinutes = Number(source.growthMinutes);
  if (!Number.isFinite(growthMinutes) && status === "growing") {
    const plantedAt = Number(source.plantedAtGameMinute);
    const maturesAt = Number(source.maturesAtGameMinute);
    if (Number.isFinite(plantedAt)) growthMinutes = now - plantedAt;
    else if (Number.isFinite(maturesAt)) growthMinutes = ORCHARD_CONFIG.maturityMinutes - Math.max(0, maturesAt - now);
  }
  growthMinutes = status === "mature"
    ? ORCHARD_CONFIG.maturityMinutes
    : bounded(growthMinutes, 0, ORCHARD_CONFIG.maturityMinutes, 0);
  const availableFruit = status === "mature"
    ? whole(source.availableFruit ?? (source.fruitReady ? 1 : 0), 0, ORCHARD_CONFIG.maxFruit)
    : 0;
  let fruitProgressMinutes = Number(source.fruitProgressMinutes);
  if (!Number.isFinite(fruitProgressMinutes) && status === "mature" && !availableFruit) {
    const nextFruitAt = Number(source.nextFruitAtGameMinute);
    if (Number.isFinite(nextFruitAt)) fruitProgressMinutes = ORCHARD_CONFIG.productionMinutes - Math.max(0, nextFruitAt - now);
  }
  fruitProgressMinutes = availableFruit
    ? ORCHARD_CONFIG.productionMinutes
    : bounded(fruitProgressMinutes, 0, ORCHARD_CONFIG.productionMinutes, 0);
  const serial = legacyFoundation ? index + 1 : treeSerial(source.id) || index + 1;
  return {
    id: `apple-tree-${serial}`,
    x: bounded(source.x, 0, 3600, fallback.x),
    y: bounded(source.y, 0, 2800, fallback.y),
    status,
    growthMinutes,
    fruitProgressMinutes,
    availableFruit,
    harvests: whole(source.harvests),
    totalHarvested: whole(source.totalHarvested),
    plantedAtGameMinute: Number.isFinite(Number(source.plantedAtGameMinute)) ? Math.max(0, Number(source.plantedAtGameMinute)) : null,
  };
}

function normalizeTrees(rawTrees, world, options = {}) {
  const incoming = Array.isArray(rawTrees) ? rawTrees : [];
  const trees = incoming
    .filter((tree) => tree && (tree.treeType === undefined || tree.treeType === "apple"))
    .slice(0, ORCHARD_CONFIG.maxTrees)
    .map((tree, index) => normalizeTree(tree, index, world, options));
  if (!trees.length) trees.push(starterTree());
  const seen = new Set();
  let nextAvailable = 1;
  for (const tree of trees) {
    let serial = treeSerial(tree.id);
    while (!serial || seen.has(serial)) {
      while (seen.has(nextAvailable)) nextAvailable += 1;
      serial = nextAvailable;
    }
    tree.id = `apple-tree-${serial}`;
    seen.add(serial);
  }
  return trees;
}

export function normalizeFarmingState(value, world) {
  const fresh = createFreshFarmingState(world);
  if (!value || typeof value !== "object" || Array.isArray(value)) return fresh;
  const next = structuredClone(fresh);
  next.lastResolvedAbsoluteMinute = whole(value.lastResolvedAbsoluteMinute, 0, absoluteWorldMinute(world));
  next.allotment.beds = Array.from({ length: ALLOTMENT_CONFIG.bedCount }, (_, index) => normalizeBed(value.allotment?.beds?.[index], index));
  next.allotment.unlockedBeds = next.allotment.beds.filter((bed) => bed.unlocked).length;
  next.orchard.trees = normalizeTrees(value.orchard?.trees, world);
  const largestSerial = next.orchard.trees.reduce((largest, tree) => Math.max(largest, treeSerial(tree.id)), 0);
  next.orchard.nextTreeSerial = Math.max(largestSerial + 1, whole(value.orchard?.nextTreeSerial, 1));
  next.orchard.purchasedSaplings = whole(value.orchard?.purchasedSaplings, 0, ORCHARD_CONFIG.maxTrees - next.orchard.trees.length);
  for (const plot of LAWN_PLOTS) {
    const lawn = value.lawns?.[plot.id] ?? value.lawns?.[plot.legacyId];
    if (!lawn || typeof lawn !== "object") continue;
    next.lawns[plot.id] = {
      id: plot.id,
      grassHeight: bounded(lawn.grassHeight, 0, 100, plot.initialGrass),
      weedPressure: bounded(lawn.weedPressure, 0, 100, plot.initialWeeds),
      moisture: bounded(lawn.moisture, 4, 100, plot.initialMoisture),
      soilHealth: bounded(lawn.soilHealth, 55, 100, plot.soilHealth),
      growthRate: bounded(lawn.growthRate, 0.65, 1.25, plot.growthRate),
      weedSusceptibility: bounded(lawn.weedSusceptibility, 0.55, 1.45, plot.weedRate),
      maintenanceCadence: bounded(lawn.maintenanceCadence, 0.45, 1.95, plot.maintenanceCadence),
      shade: bounded(lawn.shade, 0, 0.65, plot.shade),
      householdCare: bounded(lawn.householdCare, 0.65, 1, plot.householdCare),
      ecologyAgeGameMinutes: bounded(lawn.ecologyAgeGameMinutes, 0, Number.MAX_SAFE_INTEGER, 0),
      lastResidentCareDay: whole(lawn.lastResidentCareDay),
      lastMowedDay: whole(lawn.lastMowedDay),
      lastMowedGameMinute: bounded(lawn.lastMowedGameMinute, 0, Number.MAX_SAFE_INTEGER, 0),
      completedJobs: whole(lawn.completedJobs),
      lastCompletedAt: Number.isNaN(new Date(lawn.lastCompletedAt).getTime()) ? null : new Date(lawn.lastCompletedAt).toISOString(),
    };
  }
  return next;
}

export function projectLegacyFarming(legacy, world) {
  const source = legacy?.farmingFoundation;
  const beds = Array.isArray(source?.allotment?.beds) ? source.allotment.beds : [];
  const oldAllotment = legacy?.allotment;
  const sourceBeds = beds.length ? beds : oldAllotment?.stage && oldAllotment.stage !== "empty"
    ? [{ ...oldAllotment, unlocked: true, cropId: "carrot", status: oldAllotment.stage }]
    : [];
  const projectedBeds = Array.from({ length: ALLOTMENT_CONFIG.bedCount }, (_, index) => {
    const bed = sourceBeds[index];
    const crop = FARMING_CROPS[bed?.cropId];
    if (!bed || !crop || !["growing", "ready"].includes(bed.status)) return { ...bed, unlocked: index === 0 || Boolean(bed?.unlocked) };
    const planted = Number(bed.plantedAtGameMinute);
    const ready = Number(bed.readyAtGameMinute);
    const now = absoluteWorldMinute(world);
    const growthMinutes = bed.status === "ready"
      ? crop.growMinutes
      : Number.isFinite(Number(bed.growthMinutes))
        ? Number(bed.growthMinutes)
        : Number.isFinite(planted)
          ? Math.max(0, now - planted)
          : Number.isFinite(ready)
            ? crop.growMinutes - Math.max(0, ready - now)
            : 0;
    return { ...bed, growthMinutes };
  });
  const slots = Array.isArray(source?.orchard?.slots) ? source.orchard.slots : [];
  const treeSources = slots.filter((slot) => slot?.treeType === "apple");
  if (!treeSources.length) {
    const oldOrchard = legacy?.orchard;
    treeSources.push({
      id: "apple-tree-1",
      ...ORCHARD_CONFIG.starterPosition,
      treeType: "apple",
      status: "mature",
      availableFruit: Number(oldOrchard?.lastHarvestDay || 0) < Number(world?.day || 1) ? 1 : 0,
      harvests: oldOrchard?.harvests,
      totalHarvested: oldOrchard?.totalHarvested,
    });
  }
  const normalized = normalizeFarmingState({
    lastResolvedAbsoluteMinute: absoluteWorldMinute(world),
    allotment: { beds: projectedBeds },
    orchard: {
      trees: normalizeTrees(treeSources, world, { legacyFoundation: Number(source?.schemaVersion) < 3 }),
      purchasedSaplings: source?.orchard?.purchasedSaplings,
      nextTreeSerial: source?.orchard?.treeSerial,
    },
    lawns: legacy?.lawns,
  }, world);
  const lawns = legacy?.lawns;
  if (lawns && typeof lawns === "object") {
    LAWN_PLOTS.forEach((plot, index) => {
      const raw = lawns[plot.id] ?? lawns[plot.legacyId] ?? Object.values(lawns)[index];
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
  const trees = farming.orchard?.trees;
  if (!Array.isArray(trees) || trees.length < 1 || trees.length > ORCHARD_CONFIG.maxTrees) errors.push("Orchard tree count is invalid.");
  else {
    const ids = new Set();
    for (const tree of trees) {
      if (!/^apple-tree-\d+$/.test(tree?.id || "") || ids.has(tree.id)) errors.push("Apple tree identities are missing or duplicated.");
      ids.add(tree?.id);
      if (!Number.isFinite(tree?.x) || !Number.isFinite(tree?.y) || !["growing", "mature"].includes(tree?.status)) errors.push(`${tree?.id || "Apple tree"} has invalid placement or status.`);
      if (!Number.isFinite(tree?.growthMinutes) || tree.growthMinutes < 0 || tree.growthMinutes > ORCHARD_CONFIG.maturityMinutes) errors.push(`${tree?.id || "Apple tree"} has invalid growth.`);
      if (!Number.isFinite(tree?.fruitProgressMinutes) || tree.fruitProgressMinutes < 0 || tree.fruitProgressMinutes > ORCHARD_CONFIG.productionMinutes) errors.push(`${tree?.id || "Apple tree"} has invalid fruit progress.`);
      if (!Number.isInteger(tree?.availableFruit) || tree.availableFruit < 0 || tree.availableFruit > ORCHARD_CONFIG.maxFruit || (tree.status !== "mature" && tree.availableFruit)) errors.push(`${tree?.id || "Apple tree"} has invalid fruit.`);
    }
  }
  if (!Number.isSafeInteger(farming.orchard?.nextTreeSerial) || farming.orchard.nextTreeSerial < 1) errors.push("Orchard tree serial is invalid.");
  if (!Number.isInteger(farming.orchard?.purchasedSaplings) || farming.orchard.purchasedSaplings < 0 || farming.orchard.purchasedSaplings + (trees?.length || 0) > ORCHARD_CONFIG.maxTrees) errors.push("Owned orchard saplings exceed the safe tree limit.");
  for (const plot of LAWN_PLOTS) {
    const lawn = farming.lawns?.[plot.id];
    if (!lawn || lawn.id !== plot.id || !Number.isFinite(lawn.grassHeight) || lawn.grassHeight < 0 || lawn.grassHeight > 100 || !Number.isFinite(lawn.weedPressure) || lawn.weedPressure < 0 || lawn.weedPressure > 100 || !Number.isInteger(lawn.completedJobs) || lawn.completedJobs < 0) errors.push(`${plot.id} lawn state is invalid.`);
    else if (![lawn.moisture, lawn.soilHealth, lawn.growthRate, lawn.weedSusceptibility, lawn.maintenanceCadence, lawn.shade, lawn.householdCare, lawn.ecologyAgeGameMinutes, lawn.lastMowedGameMinute].every(Number.isFinite)) errors.push(`${plot.id} lawn ecology is invalid.`);
  }
  return { ok: errors.length === 0, errors };
}
