import test from "node:test";
import assert from "node:assert/strict";
import {
  PERSISTENT_ACTIVITY_DEFINITIONS,
  PersistentActivityRecoveryService,
} from "../src/systems/PersistentActivityRecoveryService.js";

function registry(services = {}) {
  return { get: (key) => services[key] };
}

function service(session) {
  return { getActiveSession: () => session ? structuredClone(session) : null };
}

test("owns every migrated activity that can expose an interrupted session", () => {
  assert.deepEqual(PERSISTENT_ACTIVITY_DEFINITIONS.map((entry) => entry.id), [
    "powerwash", "beach", "lawn", "waste", "house-rescue", "river", "bakery", "cafe",
    "morning-mug", "riverside-kitchen", "south-shore-scoops",
  ]);
  assert.equal(new Set(PERSISTENT_ACTIVITY_DEFINITIONS.map((entry) => entry.sceneKey)).size, PERSISTENT_ACTIVITY_DEFINITIONS.length);
});

test("returns Town when no activity is interrupted", () => {
  const recovery = new PersistentActivityRecoveryService(registry());
  assert.deepEqual(recovery.resolve(), {
    ok: true,
    status: "none",
    selected: null,
    candidates: [],
    conflictCount: 0,
  });
});

test("resumes House Rescue, restaurants and River through the same boot contract", () => {
  for (const [registryKey, sceneKey] of [
    ["houseRescue", "HouseRescueScene"],
    ["river", "RiverClearoutScene"],
    ["morningMug", "MorningMugScene"],
    ["riversideKitchen", "RiversideKitchenScene"],
    ["southShoreScoops", "SouthShoreScoopsScene"],
  ]) {
    const recovery = new PersistentActivityRecoveryService(registry({ [registryKey]: service({ id: `${registryKey}-1`, startedAt: 100 }) }));
    const result = recovery.resolve();
    assert.equal(result.status, "resume");
    assert.equal(result.selected.sceneKey, sceneKey);
  }
});

test("ignores completed sessions and deterministically preserves conflict visibility", () => {
  const recovery = new PersistentActivityRecoveryService(registry({
    lawnCare: service({ id: "lawn-old", startedAt: 100 }),
    houseRescue: service({ id: "house-new", startedAt: 200 }),
    river: service({ id: "river-finished", startedAt: 300, finished: true }),
  }));
  const result = recovery.resolve();
  assert.equal(result.status, "conflict-resolved");
  assert.equal(result.selected.id, "house-rescue");
  assert.equal(result.conflictCount, 1);
  assert.deepEqual(result.candidates.map((entry) => entry.id), ["house-rescue", "lawn"]);
});
