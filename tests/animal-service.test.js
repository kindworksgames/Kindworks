import test from "node:test";
import assert from "node:assert/strict";
import { ANIMAL_DEFINITIONS, ANIMAL_SPECIES, SOUTH_MEADOW, worldAnimalPresentations } from "../src/data/animals.js";
import { createFreshGameState, GameStateService, upgradeGameState, validateGameState } from "../src/state/GameState.js";
import { projectLegacyAnimals } from "../src/state/animalState.js";
import { normalizeWorldState } from "../src/state/worldState.js";
import { SaveRepository } from "../src/state/SaveRepository.js";
import { AnimalService } from "../src/systems/AnimalService.js";
import { MemoryStorage } from "./helpers/MemoryStorage.js";

const DOG = "animal-dog-1";
const RABBIT = "animal-rabbit-1";
const WOLF = "animal-wolf-1";

function residentProfile() {
  return { name: "Mae", skin: "warm", hair: 0, hairColor: "dark-brown", accessory: "none", outfit: 0, bodyBuild: "average", hobbies: ["nature"] };
}

function runtime({ state = createFreshGameState({ now: 0 }), repository = new SaveRepository(new MemoryStorage()), random = () => 0.99 } = {}) {
  const gameState = new GameStateService(state);
  const animals = new AnimalService(gameState, repository, { now: () => 1000, random });
  return { gameState, animals, repository };
}

function setDay(gameState, day, clockMinutes = 420) {
  const state = gameState.getSnapshot();
  state.world = normalizeWorldState({ ...state.world, day, clockMinutes }, { now: day * 1000 });
  assert.equal(gameState.replace(state).ok, true);
}

function createResident(gameState) {
  const state = gameState.getSnapshot();
  state.customResident.profile = residentProfile();
  assert.equal(gameState.replace(state).ok, true);
}

function makeAvailable(gameState, animalId, minimumDay = gameState.getSnapshot().world.day) {
  const probe = gameState.getSnapshot();
  for (let day = minimumDay; day <= minimumDay + 60; day += 1) {
    for (let clockMinutes = 0; clockMinutes < 1440; clockMinutes += 80) {
      probe.world.day = day;
      probe.world.clockMinutes = clockMinutes;
      if (worldAnimalPresentations(probe.animals, probe.world).some((entry) => entry.definition.id === animalId && entry.visible)) {
        setDay(gameState, day, clockMinutes);
        return;
      }
    }
  }
  assert.fail(`${animalId} never entered the rotating wildlife roster.`);
}

test("fresh Milestone 35 state contains all original wildlife and at most four rotating wild visitors", () => {
  const state = createFreshGameState({ now: 0 });
  assert.equal(validateGameState(state).ok, true);
  assert.equal(Object.keys(state.animals.residents).length, 56);
  assert.equal(Object.keys(ANIMAL_SPECIES).length, 37);
  assert.ok(["Marmalade", "Bramble", "Clover", "Button", "Puddle", "Ember", "Inky", "Luna"].every((name) => ANIMAL_DEFINITIONS.some((entry) => entry.name === name)));
  const visible = worldAnimalPresentations(state.animals, state.world).filter((entry) => entry.visible);
  assert.equal(visible.length, 3);
  assert.ok(visible.every((entry) => Number.isFinite(entry.position.x) && Number.isFinite(entry.position.y)));
});

test("incompatible food is safe and consumes nothing", () => {
  const state = createFreshGameState({ now: 0 });
  state.inventory.consumables["chicken-pieces"] = 1;
  const { gameState, animals } = runtime({ state });
  const result = animals.feed(RABBIT, "chicken-pieces");
  assert.equal(result.code, "incompatible-food");
  assert.equal(gameState.getSnapshot().inventory.consumables["chicken-pieces"], 1);
  assert.equal(gameState.getSnapshot().animals.residents[RABBIT].trust, 22);
});

test("a favourite treat is consumed exactly once and grants the original wild-animal gain", () => {
  const state = createFreshGameState({ now: 0 });
  state.inventory.consumables["allotment-carrot"] = 2;
  const { gameState, animals, repository } = runtime({ state });
  makeAvailable(gameState, RABBIT);
  const result = animals.feed(RABBIT, "allotment-carrot");
  assert.equal(result.ok, true);
  assert.equal(result.favorite, true);
  assert.equal(result.gainedTrust, 19);
  assert.equal(result.ledger.kind, "consume");
  assert.equal(result.ledger.amount, 0);
  assert.equal(result.ledger.itemId, "allotment-carrot");
  assert.equal(result.ledger.balance, 100);
  assert.equal(gameState.getSnapshot().inventory.consumables["allotment-carrot"], 1);
  assert.equal(animals.feed(RABBIT, "allotment-carrot").code, "already-fed");
  assert.equal(repository.load().state.animals.residents[RABBIT].trust, 41);
  assert.equal(repository.load().state.economy.ledger.at(-1).reason, "Fed Clover Allotment Carrot");
});

test("gentle greetings obey the 120-game-minute cooldown", () => {
  const { gameState, animals } = runtime();
  makeAvailable(gameState, DOG);
  const first = animals.greet(DOG);
  assert.equal(first.ok, true);
  assert.equal(first.gainedTrust, 7);
  const second = animals.greet(DOG);
  assert.equal(second.code, "greeting-cooldown");
  assert.equal(second.remainingMinutes, 120);
});

test("adoption requires a created resident and common animals are guaranteed on the fourth request", () => {
  const { gameState, animals } = runtime();
  assert.equal(animals.requestAdoption(RABBIT, { roll: 0 }).code, "resident-required");
  createResident(gameState);
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    makeAvailable(gameState, RABBIT, gameState.getSnapshot().world.day + 1);
    const result = animals.requestAdoption(RABBIT, { roll: 1 });
    assert.equal(result.code, "adoption-not-yet");
    assert.equal(result.failedRequests, attempt);
  }
  makeAvailable(gameState, RABBIT, gameState.getSnapshot().world.day + 1);
  const adopted = animals.requestAdoption(RABBIT, { roll: 1 });
  assert.equal(adopted.code, "animal-adopted");
  assert.equal(adopted.guaranteed, true);
  assert.equal(gameState.getSnapshot().animals.activeAnimalId, RABBIT);
});

test("rare Luna is guaranteed on the sixth valid visit request", () => {
  const { gameState, animals } = runtime();
  createResident(gameState);
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    setDay(gameState, 2 + (attempt - 1) * 6, 360);
    const result = animals.requestAdoption(WOLF, { roll: 1 });
    assert.equal(result.code, "adoption-not-yet");
  }
  setDay(gameState, 32, 360);
  const adopted = animals.requestAdoption(WOLF, { roll: 1 });
  assert.equal(adopted.code, "animal-adopted");
  assert.equal(adopted.guaranteed, true);
});

test("only one adopted companion follows while the others roam the exact South Meadow route", () => {
  const { gameState, animals } = runtime();
  createResident(gameState);
  makeAvailable(gameState, DOG);
  assert.equal(animals.requestAdoption(DOG, { roll: 0 }).code, "animal-adopted");
  makeAvailable(gameState, RABBIT, gameState.getSnapshot().world.day + 1);
  assert.equal(animals.requestAdoption(RABBIT, { roll: 0 }).code, "animal-adopted");
  assert.equal(gameState.getSnapshot().animals.activeAnimalId, DOG);
  let rabbit = animals.getWorldPresentations().find((entry) => entry.definition.id === RABBIT);
  assert.equal(rabbit.location, SOUTH_MEADOW.id);
  assert.ok(rabbit.position.x >= SOUTH_MEADOW.bounds.x && rabbit.position.x <= SOUTH_MEADOW.bounds.x + SOUTH_MEADOW.bounds.width);
  assert.equal(animals.setActive(RABBIT).ok, true);
  assert.equal(gameState.getSnapshot().animals.residents[DOG].active, false);
  assert.equal(animals.clearActive().ok, true);
  assert.equal(animals.getDiagnostics().southMeadowResidents, 2);
});

test("daily companion care protects trust; missed online care can release a companion", () => {
  const state = createFreshGameState({ now: 0 });
  Object.assign(state.animals.residents[DOG], { adopted: true, active: true, trust: 62, lastCompanionCareDay: 1 });
  state.animals.activeAnimalId = DOG;
  const { gameState, animals } = runtime({ state });
  setDay(gameState, 2);
  animals.refresh({ persist: false });
  assert.equal(gameState.getSnapshot().animals.residents[DOG].trust, 62);
  setDay(gameState, 3);
  animals.refresh({ persist: false });
  assert.equal(gameState.getSnapshot().animals.residents[DOG].trust, 56);
  setDay(gameState, 5);
  animals.refresh({ persist: false });
  assert.equal(gameState.getSnapshot().animals.residents[DOG].adopted, false);
  assert.equal(gameState.getSnapshot().animals.departureEvents, 1);
});

test("offline care has one grace day and never pushes an adopted companion below 50 trust", () => {
  const state = createFreshGameState({ now: 0 });
  Object.assign(state.animals.residents[DOG], { adopted: true, active: true, trust: 52 });
  state.animals.activeAnimalId = DOG;
  const { gameState, animals } = runtime({ state });
  setDay(gameState, 4);
  animals.refresh({ persist: false, offline: true });
  assert.equal(gameState.getSnapshot().animals.residents[DOG].trust, 50);
  assert.equal(gameState.getSnapshot().animals.residents[DOG].adopted, true);
});

test("animal transactions roll back completely when saving fails", () => {
  const state = createFreshGameState({ now: 0 });
  state.inventory.consumables["allotment-carrot"] = 1;
  const { gameState, animals } = runtime({ state, repository: { save: () => ({ ok: false, status: "write-failed" }) } });
  makeAvailable(gameState, RABBIT);
  const before = gameState.getSnapshot();
  const result = animals.feed(RABBIT, "allotment-carrot");
  assert.equal(result.code, "persistence-failed");
  assert.equal(result.rollbackOk, true);
  assert.deepEqual(gameState.getSnapshot(), before);
});

test("original HTML animal records project into the bounded Phaser roster", () => {
  const world = createFreshGameState({ now: 0 }).world;
  const projected = projectLegacyAnimals({
    activeAnimalId: RABBIT,
    animals: [{ id: RABBIT, name: "Carrots", trust: 81, adopted: true, active: true, failedRequests: 2, lastTreatDay: 1 }],
  }, world);
  assert.equal(projected.residents[RABBIT].name, "Carrots");
  assert.equal(projected.residents[RABBIT].trust, 81);
  assert.equal(projected.activeAnimalId, RABBIT);
  assert.equal(projected.residents[DOG].name, "Bramble");
});

test("schema 7 saves gain animal friends without losing prior milestones", () => {
  const old = createFreshGameState({ now: 0 });
  delete old.animals;
  old.schemaVersion = 7;
  old.identity.townName = "Friendship Bay";
  const upgraded = upgradeGameState(old, { now: 1000 });
  assert.equal(upgraded.schemaVersion, 32);
  assert.equal(upgraded.identity.townName, "Friendship Bay");
  assert.equal(Object.keys(upgraded.animals.residents).length, 56);
  assert.equal(validateGameState(upgraded).ok, true);
});
