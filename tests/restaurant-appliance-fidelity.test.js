import test from "node:test";
import assert from "node:assert/strict";
import { CAFE_APPLIANCES } from "../src/data/cafe.js";
import { MORNING_MUG_APPLIANCES } from "../src/data/morningMug.js";
import { RIVERSIDE_KITCHEN_APPLIANCES } from "../src/data/riversideKitchen.js";
import { createFreshGameState, GameStateService, validateGameState } from "../src/state/GameState.js";
import { normalizeMorningMugActiveShift } from "../src/state/morningMugState.js";
import { normalizeRiversideKitchenActiveShift } from "../src/state/riversideKitchenState.js";
import { SaveRepository } from "../src/state/SaveRepository.js";
import { CafeService } from "../src/systems/CafeService.js";
import { MorningMugService } from "../src/systems/MorningMugService.js";
import { RiversideKitchenService } from "../src/systems/RiversideKitchenService.js";
import { MemoryStorage } from "./helpers/MemoryStorage.js";

function runtime(Service, key, { state = createFreshGameState({ now: 0 }), repository = new SaveRepository(new MemoryStorage()) } = {}) {
  const gameState = new GameStateService(state);
  const service = new Service(gameState, repository, { now: () => 1000 });
  return { gameState, repository, service, [key]: service };
}

function advanceToStation(service, trayIndex, definitions) {
  assert.equal(service.selectTray(trayIndex).ok, true);
  while (service.expectedStep() && !definitions[service.expectedStep()]) assert.equal(service.applyStep(service.expectedStep()).ok, true);
  return service.expectedStep();
}

test("Corner Café owns independent stations for different preparation trays", () => {
  const { service: cafe } = runtime(CafeService, "cafe");
  cafe.startLevel(1, { instantOrders: true });
  assert.equal(advanceToStation(cafe, 0, CAFE_APPLIANCES), "kettle");
  assert.equal(cafe.useAppliance("kettle").code, "appliance-started");
  assert.equal(advanceToStation(cafe, 2, CAFE_APPLIANCES), "toaster");
  assert.equal(cafe.useAppliance("toaster").code, "appliance-started");
  const cooking = Object.values(cafe.getActiveSession().appliances).filter((appliance) => appliance.status === "cooking");
  assert.deepEqual(cooking.map((appliance) => [appliance.id, appliance.trayIndex]).sort(), [["kettle", 0], ["toaster", 2]]);
  for (let second = 0; second < 4; second += 1) cafe.tick(1);
  assert.equal(cafe.appliance("kettle").status, "ready");
  assert.equal(cafe.appliance("toaster").status, "ready");
  assert.equal(cafe.useAppliance("kettle", 0).code, "appliance-collected");
  assert.equal(cafe.useAppliance("toaster", 2).code, "appliance-collected");
  assert.equal(cafe.appliance("kettle").status, "idle");
  assert.equal(cafe.appliance("toaster").status, "idle");
});

test("Morning Mug persists a running station, restores it exactly, and exposes its burnt state", () => {
  const storage = new MemoryStorage();
  const repository = new SaveRepository(storage);
  const first = runtime(MorningMugService, "morningMug", { repository });
  first.service.startLevel(1, { instantOrders: true });
  assert.equal(advanceToStation(first.service, 0, MORNING_MUG_APPLIANCES), "grinder");
  assert.equal(first.service.useAppliance("grinder").code, "appliance-started");
  first.service.tick(1);
  const before = first.service.appliance("grinder");
  assert.equal(before.status, "cooking");
  assert.equal(first.service.suspend().ok, true);

  const second = runtime(MorningMugService, "morningMug", { state: repository.load().state, repository });
  assert.equal(second.service.restorePersistedSession().ok, true);
  assert.deepEqual(second.service.appliance("grinder"), before);
  for (let elapsed = 0; elapsed < 11; elapsed += 1) second.service.tick(1);
  assert.equal(second.service.appliance("grinder").status, "burnt");
  const cleared = second.service.useAppliance("grinder", 0);
  assert.equal(cleared.code, "station-burnt");
  assert.equal(second.service.appliance("grinder").status, "idle");
  assert.equal(second.service.expectedStep(), "grinder");
  assert.equal(second.service.getActiveSession().waste, 1);
});

test("Riverside Kitchen reloads the exact heat station and collects it onto its owning tray", () => {
  const storage = new MemoryStorage();
  const repository = new SaveRepository(storage);
  const first = runtime(RiversideKitchenService, "riversideKitchen", { repository });
  first.service.startLevel(1, { instantOrders: true });
  assert.equal(advanceToStation(first.service, 0, RIVERSIDE_KITCHEN_APPLIANCES), "panMedium");
  assert.equal(first.service.useAppliance("panMedium").code, "appliance-started");
  first.service.tick(1);
  const before = first.service.appliance("panMedium");
  assert.equal(first.service.suspend().ok, true);

  const second = runtime(RiversideKitchenService, "riversideKitchen", { state: repository.load().state, repository });
  assert.equal(second.service.restorePersistedSession().ok, true);
  assert.deepEqual(second.service.appliance("panMedium"), before);
  for (let step = 0; step < 2; step += 1) second.service.tick(1);
  assert.equal(second.service.appliance("panMedium").status, "ready");
  assert.equal(second.service.useAppliance("panMedium", 0).code, "appliance-collected");
  assert.equal(second.service.expectedStep(), "lettuce");
  assert.equal(second.service.appliance("panMedium").status, "idle");
  assert.equal(validateGameState(second.gameState.getSnapshot()).ok, true);
});

test("pre-recovery resumable shifts gain safe idle appliance maps without losing tray progress", () => {
  const morning = runtime(MorningMugService, "morningMug").service;
  morning.startLevel(1, { instantOrders: true });
  morning.applyStep("smallCup");
  const oldMorning = morning.getActiveSession();
  delete oldMorning.appliances;
  const normalizedMorning = normalizeMorningMugActiveShift(oldMorning);
  assert.equal(normalizedMorning.trays[0].stepIndex, 1);
  assert.equal(Object.keys(normalizedMorning.appliances).length, Object.keys(MORNING_MUG_APPLIANCES).length);
  assert.ok(Object.values(normalizedMorning.appliances).every((appliance) => appliance.status === "idle"));

  const riverside = runtime(RiversideKitchenService, "riversideKitchen").service;
  riverside.startLevel(1, { instantOrders: true });
  riverside.applyStep("plate");
  const oldRiverside = riverside.getActiveSession();
  delete oldRiverside.appliances;
  const normalizedRiverside = normalizeRiversideKitchenActiveShift(oldRiverside);
  assert.equal(normalizedRiverside.trays[0].stepIndex, 1);
  assert.equal(Object.keys(normalizedRiverside.appliances).length, Object.keys(RIVERSIDE_KITCHEN_APPLIANCES).length);
  assert.ok(Object.values(normalizedRiverside.appliances).every((appliance) => appliance.status === "idle"));
});
