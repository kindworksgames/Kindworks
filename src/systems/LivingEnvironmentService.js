import {
  BUSINESS_CATALOG,
  ENVIRONMENT_LIMITS,
  LAND_LITTER_CONFIG,
  LAND_LITTER_TYPES,
  RIVER_GARBAGE_CONFIG,
  RIVER_GARBAGE_TYPES,
  RIVER_SECTIONS,
  RIVER_TYPE_FLOW_FACTOR,
  RIVER_TYPE_RELEASE_FACTOR,
  RIVER_TYPE_SNAG_FACTOR,
  RUBBISH_PRESENTATION,
  hashUnit,
  isBusinessOpen,
  riverItemPosition,
  riverSectionWorldLength,
  seededBetween,
} from "../data/livingEnvironment.js";
import { LAWN_PLOTS, absoluteWorldMinute, lawnNeedsCare } from "../data/farming.js";
import { getWeatherForDay } from "../data/worldSimulation.js";

const LAND_ZONES = ["street", "park", "beach"];

function choice(values, key) {
  if (!values.length) return null;
  return values[Math.min(values.length - 1, Math.floor(hashUnit(key) * values.length))];
}

function riverCapacity(sectionId) {
  return sectionId === "river-05" ? RIVER_GARBAGE_CONFIG.lowerRiverMaxPerSection : RIVER_GARBAGE_CONFIG.maxPerSection;
}

function riverCount(environment, sectionId) {
  return environment.river.items.filter((item) => item.sectionId === sectionId).length;
}

function nextSerial(environment) {
  const serial = environment.river.nextSerial++;
  return `river-trash-${String(serial).padStart(4, "0")}`;
}

export function spawnRiverItemInto(state, {
  sectionId = "river-01", type = null, t = null, source = "ambient-upstream", status = "floating", reason = null,
} = {}) {
  const environment = state.environment;
  if (environment.river.items.length >= RIVER_GARBAGE_CONFIG.maxTotal || riverCount(environment, sectionId) >= riverCapacity(sectionId)) return null;
  const serial = environment.eventSerial++;
  const rubbishType = RIVER_GARBAGE_TYPES.includes(type) ? type : choice(RIVER_GARBAGE_TYPES, `river-type:${serial}`);
  const item = {
    id: nextSerial(environment), sectionId, type: rubbishType,
    t: Number.isFinite(Number(t)) ? Math.max(0, Math.min(1, Number(t))) : seededBetween(`river-t:${serial}`, 0.08, 0.35),
    offset: seededBetween(`river-offset:${serial}`, -55, 55),
    flowSpeed: seededBetween(`river-speed:${serial}`, RIVER_GARBAGE_CONFIG.minFlowWorldUnitsPerGameMinute, RIVER_GARBAGE_CONFIG.maxFlowWorldUnitsPerGameMinute),
    status: status === "stuck" ? "stuck" : "floating",
    stuckReason: status === "stuck" ? String(reason || "accumulated river debris") : null,
    passedTraps: [], source, spawnedGameMinute: absoluteWorldMinute(state.world), ageGameMinutes: 0, stuckAgeGameMinutes: 0,
    releaseAfterGameMinutes: status === "stuck" ? seededBetween(`river-release:${serial}`, 220, 640) * RIVER_TYPE_RELEASE_FACTOR[rubbishType] : 0,
    bobPhase: hashUnit(`river-bob:${serial}`) * Math.PI * 2, jamCount: 0,
  };
  environment.river.items.push(item);
  environment.river.spawnEvents += 1;
  return item;
}

function nearestRiverSample(x, y) {
  let best = { distance: Infinity, sectionId: "river-01" };
  for (const section of RIVER_SECTIONS) {
    for (let index = 0; index <= 10; index += 1) {
      const point = riverItemPosition({ sectionId: section.id, t: index / 10, offset: 0 });
      const distance = Math.hypot(point.x - x, point.y - y);
      if (distance < best.distance) best = { distance, sectionId: section.id };
    }
  }
  return best;
}

function deactivateLandItem(item) {
  Object.assign(item, { active: false, x: item.homeX, y: item.homeY, ageGameMinutes: 0, nextMoveAt: 0, movedCount: 0, source: "none", sourceNpcId: null, sourceNpcName: null, cleanupGraceUntil: 0 });
}

function activateLandItem(state, item, { source = "ambient", type = null } = {}) {
  const now = absoluteWorldMinute(state.world);
  item.active = true;
  item.type = LAND_LITTER_TYPES.includes(type) ? type : item.type;
  item.spawnedGameMinute = now;
  item.ageGameMinutes = 0;
  item.nextMoveAt = now + seededBetween(`land-move:${item.id}:${state.environment.eventSerial++}`, LAND_LITTER_CONFIG.windMoveMinGameMinutes, LAND_LITTER_CONFIG.windMoveMaxGameMinutes);
  item.movedCount = 0;
  item.source = source;
  item.cleanupGraceUntil = 0;
  return item;
}

function inactiveLandCandidates(environment, zone) {
  return environment.land.items.filter((item) => !item.active && item.zone === zone);
}

function activeLandCount(environment, zone = null) {
  return environment.land.items.filter((item) => item.active && (!zone || item.zone === zone)).length;
}

function moveLandItem(state, item, now) {
  const environment = state.environment;
  const weather = getWeatherForDay(Math.floor(now / 1440) + 1);
  const angle = weather.kind === "windy" ? weather.windAngle : environment.land.windAngle;
  const nearestRiver = nearestRiverSample(item.x, item.y);
  if (nearestRiver.distance <= 150 && hashUnit(`land-river:${item.id}:${environment.eventSerial++}`) < Math.min(0.82, LAND_LITTER_CONFIG.riverTransferChance * (weather.kind === "windy" ? 1.7 : 1))) {
    const riverItem = spawnRiverItemInto(state, { sectionId: nearestRiver.sectionId, type: item.type === "spoon" ? "wrapper" : item.type, t: 0.1, source: `land-transfer:${item.id}` });
    if (riverItem) {
      deactivateLandItem(item);
      environment.land.toRiverEvents += 1;
      return true;
    }
  }
  const radius = LAND_LITTER_CONFIG.clusterRadius[item.zone] * 1.35 * (weather.kind === "windy" ? 1.35 : 1);
  const candidates = inactiveLandCandidates(environment, item.zone)
    .map((candidate) => {
      const dx = candidate.x - item.x;
      const dy = candidate.y - item.y;
      const distance = Math.hypot(dx, dy);
      const downwind = distance ? (dx * Math.cos(angle) + dy * Math.sin(angle)) / distance : -1;
      return { candidate, distance, downwind };
    })
    .filter((entry) => entry.distance <= radius && entry.downwind > -0.05)
    .sort((a, b) => b.downwind - a.downwind || a.distance - b.distance);
  const target = candidates[0]?.candidate;
  if (!target) return false;
  const carried = { type: item.type, source: item.source, age: item.ageGameMinutes, moves: item.movedCount + 1 };
  deactivateLandItem(item);
  activateLandItem(state, target, { source: carried.source, type: carried.type });
  target.ageGameMinutes = carried.age;
  target.movedCount = carried.moves;
  environment.land.moveEvents += 1;
  return true;
}

function washRiverItemAshore(state, item) {
  const beaches = inactiveLandCandidates(state.environment, "beach")
    .map((candidate) => ({ candidate, distance: Math.hypot(candidate.x - 2720, candidate.y - 2780) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 6)
    .map((entry) => entry.candidate);
  const target = choice(beaches, `shore-transfer:${item.id}:${state.environment.eventSerial++}`);
  if (!target) return false;
  activateLandItem(state, target, { source: "river-estuary", type: item.type });
  return true;
}

function processRiverStep(state, minutes, now) {
  const environment = state.environment;
  for (const item of [...environment.river.items]) {
    item.ageGameMinutes += minutes;
    if (item.status === "stuck") {
      item.stuckAgeGameMinutes += minutes;
      if (item.stuckAgeGameMinutes >= item.releaseAfterGameMinutes) {
        item.status = "floating";
        item.stuckReason = null;
        item.stuckAgeGameMinutes = 0;
        item.releaseAfterGameMinutes = 0;
        environment.river.releaseEvents += 1;
      }
      continue;
    }
    const section = RIVER_SECTIONS.find((entry) => entry.id === item.sectionId);
    const oldT = item.t;
    item.t += (item.flowSpeed * RIVER_TYPE_FLOW_FACTOR[item.type] * minutes) / riverSectionWorldLength(item.sectionId);
    for (let trapIndex = 0; trapIndex < section.snags.length; trapIndex += 1) {
      const trap = section.snags[trapIndex];
      const trapId = `${section.id}:${trapIndex}`;
      if (oldT < trap.t && item.t >= trap.t && !item.passedTraps.includes(trapId)) {
        item.passedTraps.push(trapId);
        if (hashUnit(`river-snag:${item.id}:${trapId}`) < trap.chance * RIVER_TYPE_SNAG_FACTOR[item.type]) {
          item.t = trap.t;
          item.status = "stuck";
          item.stuckReason = trap.reason;
          item.stuckAgeGameMinutes = 0;
          item.releaseAfterGameMinutes = seededBetween(`river-release:${item.id}:${trapId}`, 220, 640) * RIVER_TYPE_RELEASE_FACTOR[item.type];
          environment.river.snagEvents += 1;
          break;
        }
      }
    }
    if (item.status === "stuck" || item.t < 1) continue;
    if (section.nextId) {
      if (riverCount(environment, section.nextId) < riverCapacity(section.nextId)) {
        item.sectionId = section.nextId;
        item.t = Math.min(0.12, item.t - 1);
        item.passedTraps = [];
      } else {
        item.t = 0.98;
        item.status = "stuck";
        item.stuckReason = "a downstream debris jam";
        item.jamCount += 1;
        item.releaseAfterGameMinutes = seededBetween(`river-jam:${item.id}:${item.jamCount}`, 80, 240) * (1 + item.jamCount * 0.3);
        environment.river.snagEvents += 1;
      }
    } else {
      environment.river.items = environment.river.items.filter((entry) => entry.id !== item.id);
      if (hashUnit(`river-shore:${item.id}`) < RIVER_GARBAGE_CONFIG.washAshoreChance && washRiverItemAshore(state, item)) environment.river.washedAshore += 1;
      else environment.river.escapedToSea += 1;
    }
  }
  if (now >= environment.river.nextSpawnAt) {
    const roll = hashUnit(`river-spawn-section:${environment.eventSerial}`);
    const sectionId = roll < 0.82 ? "river-01" : roll < 0.92 ? "river-02" : "river-03";
    spawnRiverItemInto(state, { sectionId });
    environment.river.nextSpawnAt = now + seededBetween(`river-spawn-delay:${environment.eventSerial++}`, RIVER_GARBAGE_CONFIG.autoSpawnMinGameMinutes, RIVER_GARBAGE_CONFIG.autoSpawnMaxGameMinutes);
  }
}

function spawnLandLitter(state, zone, now, { source = null } = {}) {
  const environment = state.environment;
  if (activeLandCount(environment) >= LAND_LITTER_CONFIG.maxTotal || activeLandCount(environment, zone) >= LAND_LITTER_CONFIG.zoneCaps[zone]) return null;
  let candidates = inactiveLandCandidates(environment, zone);
  const active = environment.land.items.filter((item) => item.active && item.zone === zone);
  if (active.length && hashUnit(`land-cluster-bias:${environment.eventSerial}`) < LAND_LITTER_CONFIG.clusterSpawnBias) {
    const seed = choice(active, `land-cluster-seed:${environment.eventSerial}`);
    const local = candidates.filter((item) => Math.hypot(item.x - seed.x, item.y - seed.y) <= LAND_LITTER_CONFIG.clusterRadius[zone]);
    if (local.length) candidates = local;
  }
  const target = choice(candidates, `land-spawn-target:${zone}:${environment.eventSerial++}`);
  if (!target) return null;
  const weighted = zone === "beach" ? ["bottle", "wrapper", "bag", "paper", "cup", "tissue"] : zone === "park" ? ["tissue", "paper", "cup", "wrapper", "bottle", "bag"] : LAND_LITTER_TYPES;
  activateLandItem(state, target, { source: source || (zone === "beach" ? "tide" : zone === "park" ? "park-activity" : "market-activity"), type: choice(weighted, `land-spawn-type:${environment.eventSerial}`) });
  environment.land.ambientSpawns += 1;
  return target;
}

export function placeNpcLandLitterInto(state, { x, y, type = "wrapper", npcId = null, npcName = null, radius = 165 } = {}) {
  const environment = state.environment;
  if (environment.calm.untilGameMinute > absoluteWorldMinute(state.world) || activeLandCount(environment) >= LAND_LITTER_CONFIG.maxTotal) return null;
  const target = environment.land.items
    .filter((item) => !item.active && !item.dynamicSpill && activeLandCount(environment, item.zone) < LAND_LITTER_CONFIG.zoneCaps[item.zone])
    .map((item) => ({ item, distance: Math.hypot(item.x - x, item.y - y) }))
    .filter((entry) => entry.distance <= radius)
    .sort((a, b) => a.distance - b.distance || a.item.id.localeCompare(b.item.id))[0]?.item;
  if (!target) return null;
  activateLandItem(state, target, { source: `npc-litter:${npcId || "resident"}`, type });
  target.sourceNpcId = npcId;
  target.sourceNpcName = npcName;
  updateEnvironmentMetricsInto(state);
  return target;
}

export function createBinSpillInto(state, { binId, x, y, npcId = null, npcName = null, count = 3 } = {}) {
  const environment = state.environment;
  const available = Math.max(0, LAND_LITTER_CONFIG.maxTotal - activeLandCount(environment));
  const wanted = Math.min(4, Math.max(2, Math.floor(Number(count) || 3)), available);
  const created = [];
  for (let index = 0; index < wanted; index += 1) {
    if (activeLandCount(environment, "street") >= LAND_LITTER_CONFIG.zoneCaps.street) break;
    const serial = environment.eventSerial++;
    const angle = hashUnit(`bin-spill-angle:${binId}:${serial}`) * Math.PI * 2;
    const distance = seededBetween(`bin-spill-distance:${binId}:${serial}`, 24, 72);
    const item = {
      id: `spill-${String(binId || "bin").replace(/[^A-Za-z0-9_-]/g, "-")}-${serial}`,
      zone: "street", x: Math.max(0, Math.min(4200, x + Math.cos(angle) * distance)), y: Math.max(0, Math.min(2800, y + Math.sin(angle) * distance)),
      homeX: x, homeY: y, type: choice(["wrapper", "cup", "paper", "bottle"], `bin-spill-type:${serial}`),
      dynamicSpill: true, active: true, spawnedGameMinute: absoluteWorldMinute(state.world), ageGameMinutes: 0,
      nextMoveAt: absoluteWorldMinute(state.world) + seededBetween(`bin-spill-move:${serial}`, LAND_LITTER_CONFIG.windMoveMinGameMinutes, LAND_LITTER_CONFIG.windMoveMaxGameMinutes),
      movedCount: 0, source: `bin-tip:${npcId || "resident"}`, sourceNpcId: npcId, sourceNpcName: npcName,
      cleanupGraceUntil: absoluteWorldMinute(state.world) + 10,
    };
    environment.land.items.push(item);
    created.push(item);
  }
  updateEnvironmentMetricsInto(state);
  return created;
}

function caretakerWorking(state, id) {
  return state.npcs?.residents?.find((resident) => resident.id === id && resident.phase === "working") || null;
}

function caretakerSweep(state, now) {
  const environment = state.environment;
  const caretakers = [
    { id: "npc-13", zone: "park", chance: 0.72, x: 1270, y: 875, radius: LAND_LITTER_CONFIG.caretakerRadius.park },
    { id: "npc-07", zone: "street", chance: 0.42, x: 555, y: 1370, radius: LAND_LITTER_CONFIG.caretakerRadius.street },
  ];
  for (const rule of caretakers) {
    const resident = caretakerWorking(state, rule.id);
    if (!resident || hashUnit(`caretaker-roll:${rule.id}:${environment.eventSerial++}`) >= rule.chance) continue;
    const item = environment.land.items
      .filter((entry) => entry.active && entry.zone === rule.zone && Math.hypot(entry.x - (resident.x || rule.x), entry.y - (resident.y || rule.y)) <= rule.radius && entry.cleanupGraceUntil <= now)
      .sort((a, b) => b.ageGameMinutes - a.ageGameMinutes || a.id.localeCompare(b.id))[0];
    if (item) {
      deactivateLandItem(item);
      environment.land.caretakerRemovals += 1;
    }
  }
}

function businessStep(state, minutes, now) {
  const environment = state.environment;
  for (const business of BUSINESS_CATALOG) {
    const businessState = environment.businesses[business.id];
    const restored = state.restorationMilestones?.unlocked || {};
    const cinemaOpen = business.kind !== "cinema" || restored.station;
    const highStreetBoost = restored.highstreet && ["riverside-kitchen", "willow-arms", "morning-mug", "riverstone", "fresh-market", "lantern-arcade"].includes(business.id) ? 0.08 : 0;
    const shoreBoost = restored.shore && business.kind === "beach_cafe" ? 0.12 : 0;
    const festivalBoost = restored.festival && absoluteWorldMinute(state.world) < Number(state.restorationMilestones.festivalUntilGameMinute || 0) ? 0.12 : 0;
    if (cinemaOpen && isBusinessOpen(business, now)) {
      if (hashUnit(`business-visit:${business.id}:${Math.floor(now / 30)}`) < Math.min(0.96, 0.24 + business.capacity / 50 + highStreetBoost + shoreBoost + festivalBoost)) {
        businessState.customers += 1;
        businessState.lastCustomerGameMinute = now;
        businessState.waste = Math.min(140, businessState.waste + business.wasteRate * seededBetween(`business-waste:${business.id}:${businessState.customers}`, 1, 1.8));
      }
    } else if (businessState.waste > 0) businessState.waste = Math.max(0, businessState.waste - minutes * 0.012);
    const overflowReady = businessState.lastOverflowGameMinute === null || now - businessState.lastOverflowGameMinute > 120;
    if (businessState.waste >= 100 && overflowReady) {
      businessState.lastOverflowGameMinute = now;
      businessState.overflowEvents += 1;
      environment.businessOverflowEvents += 1;
      if (environment.calm.untilGameMinute > now) {
        businessState.waste = Math.max(58, businessState.waste - 28);
        continue;
      }
      const zone = business.kind === "beach_cafe" ? "beach" : "street";
      const radius = business.kind === "beach_cafe" ? 340 : 260;
      const target = inactiveLandCandidates(environment, zone)
        .map((item) => ({ item, distance: Math.hypot(item.x - business.x, item.y - business.y) }))
        .filter((entry) => entry.distance <= radius)
        .sort((a, b) => a.distance - b.distance)[0]?.item;
      if (target) {
        activateLandItem(state, target, { source: `business-overflow:${business.id}`, type: choice(business.products, `business-overflow-type:${business.id}:${businessState.overflowEvents}`) });
        environment.businessWasteEvents += 1;
        businessState.waste = Math.max(58, businessState.waste - 28);
      }
    }
  }
}

function processLandStep(state, minutes, now) {
  const environment = state.environment;
  for (const item of [...environment.land.items]) {
    if (!item.active) continue;
    item.ageGameMinutes += minutes;
    if (item.zone === "beach" && item.ageGameMinutes > 90 && hashUnit(`tide-out:${item.id}:${Math.floor(now / 60)}`) < LAND_LITTER_CONFIG.beachTideOutChance * (minutes / 60)) {
      deactivateLandItem(item);
      environment.land.tideOutEvents += 1;
      continue;
    }
    if (LAND_LITTER_CONFIG.lightTypes.includes(item.type) && now >= item.nextMoveAt && item.cleanupGraceUntil <= now) {
      if (!moveLandItem(state, item, now) && item.active) item.nextMoveAt = now + seededBetween(`land-move-delay:${item.id}:${environment.eventSerial++}`, LAND_LITTER_CONFIG.windMoveMinGameMinutes, LAND_LITTER_CONFIG.windMoveMaxGameMinutes);
    }
  }
  if (now >= environment.land.nextWindShiftAt) {
    environment.land.windAngle = -Math.PI + hashUnit(`wind-angle:${environment.eventSerial++}`) * Math.PI * 2;
    environment.land.nextWindShiftAt = now + seededBetween(`wind-delay:${environment.eventSerial}`, LAND_LITTER_CONFIG.windShiftMinGameMinutes, LAND_LITTER_CONFIG.windShiftMaxGameMinutes);
  }
  for (const zone of LAND_ZONES) if (now >= environment.land.nextSpawnAt[zone]) {
    spawnLandLitter(state, zone, now);
    environment.land.nextSpawnAt[zone] = now + seededBetween(`land-spawn-delay:${zone}:${environment.eventSerial++}`, LAND_LITTER_CONFIG.spawnMin[zone], LAND_LITTER_CONFIG.spawnMax[zone]);
  }
  if (now >= environment.land.nextCaretakerSweepAt) {
    caretakerSweep(state, now);
    environment.land.nextCaretakerSweepAt = now + seededBetween(`caretaker-delay:${environment.eventSerial++}`, LAND_LITTER_CONFIG.caretakerSweepMinGameMinutes, LAND_LITTER_CONFIG.caretakerSweepMaxGameMinutes);
  }
}

function landClusters(environment) {
  const clusters = [];
  const claimed = new Set();
  const active = environment.land.items.filter((item) => item.active).sort((a, b) => a.spawnedGameMinute - b.spawnedGameMinute || a.id.localeCompare(b.id));
  for (const seed of active) {
    if (claimed.has(seed.id)) continue;
    const items = active.filter((item) => !claimed.has(item.id) && item.zone === seed.zone && Math.hypot(item.x - seed.x, item.y - seed.y) <= LAND_LITTER_CONFIG.clusterRadius[seed.zone]);
    if (items.length < LAND_LITTER_CONFIG.cleanupThreshold[seed.zone]) continue;
    items.forEach((item) => claimed.add(item.id));
    clusters.push({ seed, items });
  }
  return clusters;
}

export function calculateEnvironmentCleanliness(state) {
  const environment = state.environment;
  const activeLand = activeLandCount(environment);
  const land = Math.max(0, 100 * (1 - activeLand / LAND_LITTER_CONFIG.maxTotal));
  const river = Math.max(0, 100 * (1 - environment.river.items.length / RIVER_GARBAGE_CONFIG.maxTotal));
  const realLawns = LAWN_PLOTS.filter((plot) => plot.active).map((plot) => state.farming.lawns[plot.id]);
  const lawns = realLawns.length ? realLawns.reduce((sum, lawn) => sum + Math.max(0, 100 - lawn.grassHeight * 0.55 - lawn.weedPressure * 0.75), 0) / realLawns.length : 100;
  const businessWaste = Object.values(environment.businesses).reduce((sum, business) => sum + business.waste, 0);
  const businesses = Math.max(0, 100 * (1 - businessWaste / (BUSINESS_CATALOG.length * 140)));
  const activeJobs = landClusters(environment).length + RIVER_SECTIONS.filter((section) => riverCount(environment, section.id) > 0).length + realLawns.filter(lawnNeedsCare).length;
  const score = Math.round((land * 0.3 + river * 0.25 + lawns * 0.3 + businesses * 0.15) * 10) / 10;
  const calmActive = environment.calm.untilGameMinute > absoluteWorldMinute(state.world);
  const band = calmActive ? "calm" : score >= 82 ? "cared-for" : score >= 55 ? "recovering" : "restoration-needed";
  return { score, band, land: Math.round(land * 10) / 10, river: Math.round(river * 10) / 10, lawns: Math.round(lawns * 10) / 10, businesses: Math.round(businesses * 10) / 10, activeJobs, updatedAtGameMinute: absoluteWorldMinute(state.world) };
}

export function updateEnvironmentMetricsInto(state) {
  state.environment.cleanliness = calculateEnvironmentCleanliness(state);
  if (state.environment.calm.untilGameMinute <= absoluteWorldMinute(state.world)) state.environment.calm.peakJobsSinceCalm = Math.max(state.environment.calm.peakJobsSinceCalm, state.environment.cleanliness.activeJobs);
  return state.environment.cleanliness;
}

export function maybeStartEnvironmentCalmInto(state) {
  const environment = state.environment;
  const now = absoluteWorldMinute(state.world);
  updateEnvironmentMetricsInto(state);
  if (environment.cleanliness.activeJobs > 0) return { started: false, reason: "jobs-remain" };
  const firstMajor = environment.calm.communitySweepEvents === 0;
  if (!firstMajor && environment.calm.peakJobsSinceCalm < ENVIRONMENT_LIMITS.majorRestorationBacklogMin) return { started: false, reason: "routine-maintenance" };
  const remainingLand = environment.land.items.filter((item) => item.active);
  const remainingRiver = environment.river.items.length;
  remainingLand.forEach(deactivateLandItem);
  environment.river.items = [];
  environment.land.caretakerRemovals += remainingLand.length;
  environment.calm.untilGameMinute = now + ENVIRONMENT_LIMITS.postRestorationCalmMinutes;
  environment.calm.lastStartedAtGameMinute = now;
  environment.calm.peakJobsSinceCalm = 0;
  environment.calm.communitySweepEvents += 1;
  for (const zone of LAND_ZONES) environment.land.nextSpawnAt[zone] = Math.max(environment.land.nextSpawnAt[zone], environment.calm.untilGameMinute);
  environment.river.nextSpawnAt = Math.max(environment.river.nextSpawnAt, environment.calm.untilGameMinute);
  updateEnvironmentMetricsInto(state);
  return { started: true, untilGameMinute: environment.calm.untilGameMinute, sweep: { land: remainingLand.length, river: remainingRiver } };
}

export function removeLandItemsInto(state, itemIds) {
  const wanted = new Set(itemIds || []);
  const removed = [];
  for (const item of state.environment.land.items) if (item.active && wanted.has(item.id)) {
    removed.push(item.id);
    deactivateLandItem(item);
  }
  updateEnvironmentMetricsInto(state);
  const calm = maybeStartEnvironmentCalmInto(state);
  return { removed, calm };
}

export function removeRiverItemsInto(state, itemIds) {
  const wanted = new Set(itemIds || []);
  const before = state.environment.river.items.length;
  state.environment.river.items = state.environment.river.items.filter((item) => !wanted.has(item.id));
  const removed = before - state.environment.river.items.length;
  updateEnvironmentMetricsInto(state);
  const calm = maybeStartEnvironmentCalmInto(state);
  return { removed, calm };
}

export function removeMagnetRiverItemInto(state, {
  sectionIds = ["river-03", "river-02"],
  graceGameMinutes = 180,
} = {}) {
  const priority = new Map(sectionIds.map((sectionId, index) => [sectionId, index]));
  const removedRiverGarbage = state.environment.river.items
    .filter((item) => priority.has(item.sectionId))
    .sort((left, right) => {
      const typeDifference = (left.type === "can" ? 0 : 1) - (right.type === "can" ? 0 : 1);
      if (typeDifference) return typeDifference;
      const sectionDifference = priority.get(left.sectionId) - priority.get(right.sectionId);
      if (sectionDifference) return sectionDifference;
      const centreDifference = Math.abs(0.5 - left.t) - Math.abs(0.5 - right.t);
      return centreDifference || left.id.localeCompare(right.id);
    })[0] || null;
  state.environment.river.nextSpawnAt = Math.max(
    Number(state.environment.river.nextSpawnAt) || 0,
    absoluteWorldMinute(state.world) + Math.max(0, Number(graceGameMinutes) || 0),
  );
  if (removedRiverGarbage) state.environment.river.items = state.environment.river.items.filter((item) => item.id !== removedRiverGarbage.id);
  updateEnvironmentMetricsInto(state);
  return { removedRiverGarbage: removedRiverGarbage ? structuredClone(removedRiverGarbage) : null };
}

export class LivingEnvironmentService {
  constructor(gameState, repository, { now = () => Date.now() } = {}) {
    this.gameState = gameState;
    this.repository = repository;
    this.now = now;
    this.listeners = new Set();
    this.lastResult = { ok: true, code: "ready" };
  }

  subscribe(listener) {
    if (typeof listener !== "function") throw new TypeError("An environment listener must be a function.");
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(result) {
    const snapshot = this.getSnapshot();
    for (const listener of this.listeners) listener(snapshot, result);
  }

  getSnapshot() { return structuredClone(this.gameState.getSnapshot().environment); }

  advanceInto(state) {
    const environment = state.environment;
    const target = absoluteWorldMinute(state.world);
    const from = environment.lastResolvedAbsoluteMinute;
    if (target <= from) {
      updateEnvironmentMetricsInto(state);
      return 0;
    }
    let cursor = Math.max(from, target - ENVIRONMENT_LIMITS.maxOfflineMinutes);
    while (cursor < target) {
      const minutes = Math.min(30, target - cursor);
      cursor += minutes;
      if (environment.calm.untilGameMinute <= cursor) {
        processRiverStep(state, minutes, cursor);
        processLandStep(state, minutes, cursor);
      }
      businessStep(state, minutes, cursor);
    }
    environment.lastResolvedAbsoluteMinute = target;
    updateEnvironmentMetricsInto(state);
    return target - from;
  }

  commit(mutator, { persist = true } = {}) {
    const checkpoint = this.gameState.getSnapshot();
    const working = structuredClone(checkpoint);
    this.advanceInto(working);
    const mutation = mutator(working);
    if (!mutation.ok) return mutation;
    working.updatedAt = new Date(this.now()).toISOString();
    const replaced = this.gameState.replace(working);
    if (!replaced.ok) return { ok: false, code: "state-validation", errors: replaced.errors };
    const saved = persist ? this.repository?.save?.(working, { now: this.now() }) : { ok: true, status: "deferred" };
    if (!saved?.ok) {
      const rollback = this.gameState.replace(checkpoint);
      return { ok: false, code: "persistence-failed", message: "The environment change could not be saved, so Willowmere was restored to its previous state.", save: saved, rollbackOk: rollback.ok };
    }
    const result = { ...mutation, state: this.gameState.getSnapshot(), save: saved };
    this.lastResult = result;
    this.emit(result);
    return result;
  }

  refresh({ persist = false } = {}) {
    const state = this.gameState.getSnapshot();
    const before = state.environment.lastResolvedAbsoluteMinute;
    if (absoluteWorldMinute(state.world) <= before) return this.commit(() => ({ ok: true, code: "environment-metrics-refreshed", advancedMinutes: 0 }), { persist });
    return this.commit((working) => ({ ok: true, code: "environment-refreshed", advancedMinutes: absoluteWorldMinute(working.world) - before }), { persist });
  }

  getLandJobs() {
    const state = this.gameState.getSnapshot();
    const environment = state.environment;
    return landClusters(environment).map(({ seed, items }) => this.makeLandJob(seed, items));
  }

  makeLandJob(seed, items) {
    return {
      id: seed.id,
      jobId: `job-waste-${seed.zone}-${seed.id}`,
      jobType: "waste",
      gameKey: "waste-collection",
      title: `${seed.zone === "park" ? "Willow Commons" : seed.zone === "beach" ? "South Shore" : "Village Street"} Rubbish Cluster`,
      icon: "♻️",
      zone: seed.zone,
      world: { x: seed.x, y: seed.y, approach: { x: seed.x, y: seed.y + 65 }, interactionRadius: 92 },
      items: items.map((item, index) => {
        const presentation = RUBBISH_PRESENTATION[item.type] || RUBBISH_PRESENTATION.wrapper;
        return { id: item.id, type: item.type, icon: presentation.icon, label: presentation.label, color: presentation.color, x: 300 + (index % 4) * 220, y: 235 + Math.floor(index / 4) * 170 };
      }),
    };
  }

  getLandJob(targetId) {
    const jobs = this.getLandJobs();
    return jobs.find((job) => job.id === targetId || job.items.some((item) => item.id === targetId)) || null;
  }

  getRiverJobs() {
    const state = this.gameState.getSnapshot();
    return RIVER_SECTIONS.map((section) => {
      const items = state.environment.river.items.filter((item) => item.sectionId === section.id).sort((a, b) => b.ageGameMinutes - a.ageGameMinutes || a.id.localeCompare(b.id));
      if (!items.length) return null;
      const selected = items[0];
      return { id: section.id, title: section.title, itemIds: [selected.id], count: items.length, position: riverItemPosition(selected), pollution: items.filter((item) => item.status === "stuck").length >= 3 || items.length >= 7 ? 3 : items.filter((item) => item.status === "stuck").length >= 2 || items.length >= 5 ? 2 : items.some((item) => item.status === "stuck") || items.length >= 3 ? 1 : 0 };
    }).filter(Boolean);
  }

  getRiverJob(sectionId) { return this.getRiverJobs().find((job) => job.id === sectionId) || null; }

  removeLandItems(itemIds) {
    return this.commit((state) => ({ ok: true, code: "land-litter-removed", ...removeLandItemsInto(state, itemIds) }));
  }

  removeRiverItems(itemIds) {
    return this.commit((state) => ({ ok: true, code: "river-rubbish-removed", ...removeRiverItemsInto(state, itemIds) }));
  }

  registerBusinessVisit(businessId, { kind = "visit", persist = false } = {}) {
    return this.commit((state) => {
      const business = BUSINESS_CATALOG.find((entry) => entry.id === businessId);
      const current = state.environment.businesses[businessId];
      if (!business || !current) return { ok: false, code: "unknown-business" };
      current.customers += 1;
      current.lastCustomerGameMinute = absoluteWorldMinute(state.world);
      const multiplier = kind === "eat" ? 1.25 : kind === "social" ? 0.8 : 1;
      current.waste = Math.min(140, current.waste + business.wasteRate * multiplier * seededBetween(`business-manual:${businessId}:${current.customers}`, 1, 1.8));
      updateEnvironmentMetricsInto(state);
      return { ok: true, code: "business-visit-registered", businessId, waste: current.waste };
    }, { persist });
  }

  getDiagnostics() {
    const state = this.gameState.getSnapshot();
    const environment = state.environment;
    const landCounts = Object.fromEntries(LAND_ZONES.map((zone) => [zone, activeLandCount(environment, zone)]));
    return {
      version: "1.0.0-milestone-27",
      persistent: true,
      lawnProfileSlots: LAWN_PLOTS.length,
      authoredLawns: LAWN_PLOTS.filter((plot) => plot.active).length,
      activeLawnJobs: LAWN_PLOTS.filter((plot) => plot.active && lawnNeedsCare(state.farming.lawns[plot.id])).length,
      land: { total: activeLandCount(environment), counts: landCounts, anchors: environment.land.items.length, jobs: landClusters(environment).length, moves: environment.land.moveEvents, riverTransfers: environment.land.toRiverEvents, tideOut: environment.land.tideOutEvents, caretakerRemovals: environment.land.caretakerRemovals },
      river: { total: environment.river.items.length, sections: this.getRiverJobs().map((job) => ({ id: job.id, count: job.count, pollution: job.pollution })), escapedToSea: environment.river.escapedToSea, washedAshore: environment.river.washedAshore, snags: environment.river.snagEvents, releases: environment.river.releaseEvents },
      businesses: { count: BUSINESS_CATALOG.length, wasteEvents: environment.businessWasteEvents, overflowEvents: environment.businessOverflowEvents, totalCustomers: Object.values(environment.businesses).reduce((sum, business) => sum + business.customers, 0) },
      cleanliness: structuredClone(environment.cleanliness),
      calm: { active: environment.calm.untilGameMinute > absoluteWorldMinute(state.world), ...structuredClone(environment.calm) },
      lastResolvedAbsoluteMinute: environment.lastResolvedAbsoluteMinute,
      legacyConversion: true,
      lastResult: this.lastResult.code,
    };
  }
}
