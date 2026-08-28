export const PERSISTENT_ACTIVITY_DEFINITIONS = Object.freeze([
  Object.freeze({ id: "powerwash", label: "Playground Power Wash", registryKey: "playgroundPowerwash", sceneKey: "PlaygroundPowerwashScene", priority: 110 }),
  Object.freeze({ id: "beach", label: "Beach Cleanup", registryKey: "beachCleanup", sceneKey: "BeachCleanupScene", priority: 100 }),
  Object.freeze({ id: "lawn", label: "Lawn Care", registryKey: "lawnCare", sceneKey: "LawnCareScene", priority: 90 }),
  Object.freeze({ id: "waste", label: "Waste Collection", registryKey: "cleanupService", sceneKey: "WasteCollectionScene", priority: 80 }),
  Object.freeze({ id: "house-rescue", label: "House Rescue", registryKey: "houseRescue", sceneKey: "HouseRescueScene", priority: 70 }),
  Object.freeze({ id: "river", label: "River Clear-Out", registryKey: "river", sceneKey: "RiverClearoutScene", priority: 60 }),
  Object.freeze({ id: "bakery", label: "Little Bakery", registryKey: "bakery", sceneKey: "BakeryScene", priority: 50 }),
  Object.freeze({ id: "cafe", label: "Corner Café", registryKey: "cafe", sceneKey: "CafeScene", priority: 40 }),
  Object.freeze({ id: "morning-mug", label: "Morning Mug", registryKey: "morningMug", sceneKey: "MorningMugScene", priority: 30 }),
  Object.freeze({ id: "riverside-kitchen", label: "Riverside Kitchen", registryKey: "riversideKitchen", sceneKey: "RiversideKitchenScene", priority: 20 }),
  Object.freeze({ id: "south-shore-scoops", label: "South Shore Scoops", registryKey: "southShoreScoops", sceneKey: "SouthShoreScoopsScene", priority: 10 }),
]);

function sessionTimestamp(session) {
  for (const value of [session?.updatedAt, session?.startedAt, session?.createdAt]) {
    const number = typeof value === "number" ? value : Date.parse(value);
    if (Number.isFinite(number)) return number;
  }
  return 0;
}

function activeSession(service) {
  const session = service?.getActiveSession?.() || null;
  return session && !session.finished ? session : null;
}

export class PersistentActivityRecoveryService {
  constructor(registry, definitions = PERSISTENT_ACTIVITY_DEFINITIONS) {
    this.registry = registry;
    this.definitions = definitions;
    this.lastResolution = { ok: true, status: "not-run", candidates: [], selected: null };
  }

  getService(key) {
    return typeof this.registry?.get === "function" ? this.registry.get(key) : this.registry?.[key];
  }

  candidates() {
    return this.definitions
      .map((definition) => {
        const session = activeSession(this.getService(definition.registryKey));
        return session ? { ...definition, session: structuredClone(session), timestamp: sessionTimestamp(session) } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.timestamp - a.timestamp || b.priority - a.priority || a.id.localeCompare(b.id));
  }

  resolve() {
    const candidates = this.candidates();
    const selected = candidates[0] || null;
    this.lastResolution = {
      ok: true,
      status: !selected ? "none" : candidates.length > 1 ? "conflict-resolved" : "resume",
      selected,
      candidates,
      conflictCount: Math.max(0, candidates.length - 1),
    };
    return structuredClone(this.lastResolution);
  }

  getDiagnostics() {
    return structuredClone(this.lastResolution);
  }
}
