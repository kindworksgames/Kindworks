const APPLIANCE_STATUSES = new Set(["idle", "cooking", "ready", "burnt"]);

function seconds(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number) : Math.max(0, Number(fallback) || 0);
}

function trayIndex(value, trayCount) {
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 && number < trayCount ? number : null;
}

export function createRestaurantAppliances(definitions, source = null, trayCount = 3) {
  const saved = source && typeof source === "object" && !Array.isArray(source) ? source : {};
  return Object.fromEntries(Object.entries(definitions).map(([id, definition]) => {
    const candidate = saved[id] && typeof saved[id] === "object" ? saved[id] : {};
    const status = APPLIANCE_STATUSES.has(candidate.status) ? candidate.status : "idle";
    const owner = status === "idle" ? null : trayIndex(candidate.trayIndex, trayCount);
    if (status !== "idle" && owner === null) return [id, { id, status: "idle", trayIndex: null, readyIn: 0, burnIn: 0 }];
    const readyIn = status === "cooking" ? seconds(candidate.readyIn, definition.seconds) : 0;
    const burnIn = status === "cooking"
      ? Math.max(readyIn, seconds(candidate.burnIn, readyIn + definition.burnWindow))
      : status === "ready" ? seconds(candidate.burnIn, definition.burnWindow) : 0;
    return [id, { id, status, trayIndex: owner, readyIn, burnIn }];
  }));
}

export function applianceFor(session, id) {
  return session?.appliances?.[id] || null;
}

export function activeApplianceForTray(session, index) {
  return Object.values(session?.appliances || {}).find((appliance) => appliance.status !== "idle" && appliance.trayIndex === Number(index)) || null;
}

export function startRestaurantAppliance(session, definitions, id, index, durationScale = 1) {
  const appliance = applianceFor(session, id);
  const definition = definitions[id];
  if (!appliance || !definition || appliance.status !== "idle") return false;
  const scale = Math.max(0.01, Number(durationScale) || 1);
  const readyIn = Math.max(0.09, seconds(definition.seconds) * scale);
  Object.assign(appliance, {
    status: "cooking",
    trayIndex: Number(index),
    readyIn,
    burnIn: readyIn + Math.max(0.09, seconds(definition.burnWindow) * scale),
  });
  return true;
}

export function clearRestaurantAppliance(appliance) {
  if (!appliance) return false;
  Object.assign(appliance, { status: "idle", trayIndex: null, readyIn: 0, burnIn: 0 });
  return true;
}

export function cancelRestaurantTrayAppliances(session, index) {
  let cancelled = 0;
  for (const appliance of Object.values(session?.appliances || {})) {
    if (appliance.status === "idle" || appliance.trayIndex !== Number(index)) continue;
    clearRestaurantAppliance(appliance);
    cancelled += 1;
  }
  return cancelled;
}

export function advanceRestaurantAppliances(session, elapsedSeconds) {
  const delta = Math.max(0, Math.min(1, Number(elapsedSeconds) || 0));
  if (!delta) return [];
  const changes = [];
  for (const appliance of Object.values(session?.appliances || {})) {
    if (appliance.status === "cooking") {
      appliance.readyIn = Math.max(0, appliance.readyIn - delta);
      appliance.burnIn = Math.max(0, appliance.burnIn - delta);
      if (appliance.readyIn <= 0) {
        appliance.status = "ready";
        changes.push({ id: appliance.id, status: "ready", trayIndex: appliance.trayIndex });
      }
    } else if (appliance.status === "ready") {
      appliance.burnIn = Math.max(0, appliance.burnIn - delta);
    }
    if (appliance.status === "ready" && appliance.burnIn <= 0) {
      appliance.status = "burnt";
      changes.push({ id: appliance.id, status: "burnt", trayIndex: appliance.trayIndex });
    }
  }
  return changes;
}
