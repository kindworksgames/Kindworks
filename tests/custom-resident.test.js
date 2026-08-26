import test from "node:test";
import assert from "node:assert/strict";
import {
  CUSTOM_RESIDENT_APPEARANCE,
  CUSTOM_RESIDENT_HOBBIES,
  PERSONAL_HOME_NODE_ID,
} from "../src/data/customResident.js";
import {
  createFreshCustomResidentState,
  projectLegacyCustomResident,
  validateResidentName,
} from "../src/state/customResidentState.js";
import { createFreshGameState, GameStateService, upgradeGameState, validateGameState } from "../src/state/GameState.js";
import { SaveRepository } from "../src/state/SaveRepository.js";
import { CustomResidentService } from "../src/systems/CustomResidentService.js";
import { MemoryStorage } from "./helpers/MemoryStorage.js";

function draft(overrides = {}) {
  return {
    name: "Mae O'River",
    skin: "tan",
    hair: 3,
    hairColor: "auburn",
    accessory: "badge",
    outfit: 4,
    bodyBuild: "broad",
    hobbies: ["gardening", "helping", "riverside"],
    home: { wallColor: "sage", roofStyle: "gambrel", roofColor: "forest" },
    ...overrides,
  };
}

function runtime(repository = new SaveRepository(new MemoryStorage())) {
  const gameState = new GameStateService(createFreshGameState({ now: 0 }));
  const service = new CustomResidentService(gameState, repository, { now: () => 1000 });
  return { gameState, service, repository };
}

test("pins the original creator catalogue and Meadowlight home assignment", () => {
  assert.equal(Object.keys(CUSTOM_RESIDENT_APPEARANCE.skin).length, 5);
  assert.equal(CUSTOM_RESIDENT_APPEARANCE.hairStyle.length, 4);
  assert.equal(Object.keys(CUSTOM_RESIDENT_APPEARANCE.hairColor).length, 6);
  assert.equal(Object.keys(CUSTOM_RESIDENT_APPEARANCE.accessory).length, 6);
  assert.equal(CUSTOM_RESIDENT_APPEARANCE.outfit.length, 6);
  assert.equal(Object.keys(CUSTOM_RESIDENT_APPEARANCE.bodyBuild).length, 5);
  assert.equal(Object.keys(CUSTOM_RESIDENT_HOBBIES).length, 12);
  assert.equal(createFreshCustomResidentState().home.nodeId, PERSONAL_HOME_NODE_ID);
  assert.equal(createFreshCustomResidentState().home.houseId, "house-20");
});

test("preserves the original strict resident-name rules", () => {
  assert.equal(validateResidentName("").reason, "Enter a name for your resident.");
  assert.equal(validateResidentName("<>bad").ok, false);
  assert.equal(validateResidentName("---").ok, false);
  assert.deepEqual(validateResidentName("  Zoë   O’Dell  "), { ok: true, name: "Zoë O’Dell", reason: "" });
  assert.equal(validateResidentName("12345678901234567890").name.length, 18);
});

test("creates one profile, personal home, and verified save atomically", () => {
  const { gameState, service, repository } = runtime();
  const result = service.saveProfile(draft());
  assert.equal(result.ok, true);
  assert.equal(result.code, "resident-created");
  const state = gameState.getSnapshot().customResident;
  assert.equal(state.profile.name, "Mae O'River");
  assert.deepEqual(state.profile.hobbies, ["gardening", "helping", "riverside"]);
  assert.equal(state.home.nodeId, "home20");
  assert.equal(state.home.level, 1);
  assert.equal(state.home.roofStyle, "gambrel");
  assert.deepEqual(repository.load().state.customResident, state);
});

test("edits the same resident without changing its stable identity or home", () => {
  const { service } = runtime();
  assert.equal(service.saveProfile(draft()).ok, true);
  const result = service.saveProfile(draft({ name: "Mina", hobbies: ["reading"] }));
  assert.equal(result.code, "profile-updated");
  assert.equal(result.state.residentId, "npc-kindly-member");
  assert.equal(result.state.home.nodeId, "home20");
  assert.equal(result.state.profile.name, "Mina");
});

test("rejects unknown appearance, too many hobbies, and invalid homes without mutation", () => {
  const storage = new MemoryStorage();
  const { gameState, service } = runtime(new SaveRepository(storage));
  const before = gameState.getSnapshot();
  assert.equal(service.saveProfile(draft({ skin: "neon" })).code, "invalid-appearance");
  assert.equal(service.saveProfile(draft({ hobbies: ["fishing", "reading", "nature", "walking"] })).code, "too-many-hobbies");
  assert.equal(service.saveProfile(draft({ home: { wallColor: "cream", roofStyle: "tower", roofColor: "gold" } })).code, "invalid-home");
  assert.deepEqual(gameState.getSnapshot(), before);
  assert.equal(storage.writes.length, 0);
});

test("locates the resident and hands control back to the exact player position", () => {
  const { service, repository } = runtime();
  assert.equal(service.locate().code, "resident-not-created");
  assert.equal(service.beginControl({ x: 10, y: 20, facing: "left" }).code, "resident-not-created");
  service.saveProfile(draft());
  const located = service.locate();
  assert.equal(located.ok, true);
  assert.deepEqual(located.location, { x: 3875, y: 1620 });
  const started = service.beginControl({ x: 1050, y: 1545, facing: "up" });
  assert.deepEqual(started.returnPlayer, { x: 1050, y: 1545, facing: "up" });
  assert.equal(service.setRuntimePosition({ x: 3700, y: 1575, facing: "left" }).ok, true);
  const ended = service.endControl();
  assert.equal(ended.ok, true);
  assert.deepEqual(ended.returnPlayer, { x: 1050, y: 1545, facing: "up" });
  assert.deepEqual(repository.load().state.customResident.location, { x: 3700, y: 1575, facing: "left" });
});

test("rolls a profile change back when persistence fails", () => {
  const failedRepository = { save: () => ({ ok: false, status: "write-failed" }) };
  const { gameState, service } = runtime(failedRepository);
  const before = gameState.getSnapshot();
  const result = service.saveProfile(draft());
  assert.equal(result.code, "persistence-failed");
  assert.deepEqual(gameState.getSnapshot(), before);
});

test("upgrades every schema-5 save with a safe empty custom-resident state", () => {
  const oldState = createFreshGameState({ now: 0 });
  oldState.schemaVersion = 5;
  delete oldState.customResident;
  const upgraded = upgradeGameState(oldState, { now: 1000 });
  assert.equal(upgraded.schemaVersion, 35);
  assert.equal(upgraded.customResident.profile, null);
  assert.equal(upgraded.customResident.home.nodeId, "home20");
  assert.equal(validateGameState(upgraded).ok, true);
});

test("projects an original-HTML creator profile and cottage design", () => {
  const projected = projectLegacyCustomResident({
    economy: { kindlyClub: { creatorProfile: draft() } },
    playerSetup: { home: { wallColor: "lavender", roofStyle: "hip", roofColor: "plum", level: 4 } },
  });
  assert.equal(projected.profile.name, "Mae O'River");
  assert.equal(projected.home.wallColor, "lavender");
  assert.equal(projected.home.level, 4);
  assert.equal(projected.home.nodeId, "home20");
});
