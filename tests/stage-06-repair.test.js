import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  RARE_ANIMAL_ENCOUNTERS,
  WILDLIFE_DEFINITIONS,
  activeRareVisitor,
  rareVisitState,
  speciesFor,
  worldAnimalPresentations,
} from "../src/data/animals.js";
import { createFreshGameState, GameStateService, validateGameState } from "../src/state/GameState.js";
import { normalizeWorldState } from "../src/state/worldState.js";
import {
  NPC_PRESENTATION_SEPARATION,
  npcPresentationPositions,
} from "../src/systems/NpcTownLifeService.js";
import { AnimalService } from "../src/systems/AnimalService.js";
import { SaveRepository } from "../src/state/SaveRepository.js";
import { MemoryStorage } from "./helpers/MemoryStorage.js";

test("Stage 6 repair separates crowded NPC presentation and tap positions without mutating saved coordinates", async () => {
  const residents = Array.from({ length: 14 }, (_, index) => ({
    id: `npc-${String(index + 1).padStart(2, "0")}`,
    x: 900,
    y: 700,
    visible: true,
  }));
  const checkpoint = structuredClone(residents);
  const first = npcPresentationPositions(residents);
  const second = npcPresentationPositions(residents);
  const positions = residents.map(({ id }) => first.get(id));

  assert.deepEqual(residents, checkpoint, "presentation spacing must not alter authoritative resident state");
  assert.deepEqual([...first], [...second], "presentation slots must be deterministic");
  assert.equal(new Set(positions.map(({ x, y }) => `${x}:${y}`)).size, residents.length);
  for (let left = 0; left < positions.length; left += 1) {
    for (let right = left + 1; right < positions.length; right += 1) {
      assert.ok(Math.hypot(positions[left].x - positions[right].x, positions[left].y - positions[right].y) >= 19);
    }
  }
  assert.deepEqual(NPC_PRESENTATION_SEPARATION, {
    slotsPerRing: 6,
    firstRingRadius: 24,
    ringStep: 22,
    coordinatePrecision: 2,
  });

  const [town, character] = await Promise.all([
    readFile(new URL("../src/scenes/TownScene.js", import.meta.url), "utf8"),
    readFile(new URL("../src/entities/NpcCharacter.js", import.meta.url), "utf8"),
  ]);
  assert.match(town, /this\.npcPresentationPositions = npcPresentationPositions\(residents\)/);
  assert.match(town, /interaction\.x = position\.x;[\s\S]*interaction\.y = position\.y/);
  assert.match(town, /const simulationDelta = this\.npcSimulationElapsed/);
  assert.match(town, /refreshTownCharacterPresentations\(presentationDelta, controlling, activePosition\)/);
  assert.match(town, /applyResident\(resident, delta, nearby, position\)/);
  assert.match(character, /const position = presentationPosition \|\| resident;[\s\S]*this\.setPosition\(position\.x, position\.y\)/);
});

test("Stage 6 repair arbitrates one deterministic rare visitor across the complete schedule horizon", () => {
  const state = createFreshGameState({ now: 0 });
  const rareDefinitions = WILDLIFE_DEFINITIONS.filter((definition) => speciesFor(definition)?.rare);
  const observed = new Set();
  let rawOverlapSamples = 0;
  let maximumRawConcurrency = 0;

  for (let day = 1; day <= 840; day += 1) {
    for (let clockMinutes = 0; clockMinutes < 1440; clockMinutes += 5) {
      const world = normalizeWorldState({ ...state.world, day, clockMinutes }, { now: day * 1440 + clockMinutes });
      const rawActive = rareDefinitions.filter((definition) => {
        const resident = state.animals.residents[definition.id];
        return !resident.adopted && rareVisitState(definition, world, resident).active;
      });
      maximumRawConcurrency = Math.max(maximumRawConcurrency, rawActive.length);
      if (rawActive.length > 1) rawOverlapSamples += 1;
      const selected = activeRareVisitor(state.animals, world, state.environment);
      assert.ok(rawActive.length === 0 ? !selected : selected);
      if (selected) observed.add(selected.definition.species);
    }
  }

  assert.equal(maximumRawConcurrency, 3, "the audit fixture must still reproduce the original overlapping schedules");
  assert.ok(rawOverlapSamples > 0);
  assert.deepEqual([...observed].sort(), Object.keys(RARE_ANIMAL_ENCOUNTERS).sort());

  const overlapWorld = normalizeWorldState({ ...state.world, day: 2, clockMinutes: 510 }, { now: 1 });
  const selected = activeRareVisitor(state.animals, overlapWorld, state.environment);
  assert.equal(selected.definition.species, "wolf", "the earlier active visit wins deterministically");
  const visibleRare = worldAnimalPresentations(state.animals, overlapWorld, state)
    .filter((entry) => entry.visible && speciesFor(entry.definition)?.rare && !entry.resident.adopted);
  assert.deepEqual(visibleRare.map((entry) => entry.definition.species), ["wolf"]);

  const handoffWorld = normalizeWorldState({ ...state.world, day: 2, clockMinutes: 540 }, { now: 2 });
  assert.equal(activeRareVisitor(state.animals, handoffWorld, state.environment).definition.species, "beaver");
});

test("Stage 6 repair sends one rare notice at a time and hands the exclusive slot to the next visit", () => {
  const state = createFreshGameState({ now: 0 });
  state.world = normalizeWorldState({ ...state.world, day: 2, clockMinutes: 510 }, { now: 1 });
  const originalResidentKeys = Object.keys(state.animals.residents).sort();
  const gameState = new GameStateService(state);
  const animals = new AnimalService(gameState, new SaveRepository(new MemoryStorage()), { now: () => 2_000 });

  const wolf = animals.refreshRareVisits({ persist: false });
  assert.deepEqual(wolf.notices.map((notice) => notice.species), ["wolf"]);
  assert.equal(animals.refreshRareVisits({ persist: false }).notices.length, 0);

  const handoff = gameState.getSnapshot();
  handoff.world = normalizeWorldState({ ...handoff.world, day: 2, clockMinutes: 540 }, { now: 2 });
  assert.equal(gameState.replace(handoff).ok, true);
  const beaver = animals.refreshRareVisits({ persist: false });
  assert.deepEqual(beaver.notices.map((notice) => notice.species), ["beaver"]);

  const repaired = gameState.getSnapshot();
  assert.deepEqual(Object.keys(repaired.animals.residents).sort(), originalResidentKeys);
  assert.equal(repaired.animals.residents["animal-wolf-1"].rareVisitCount, 1);
  assert.equal(repaired.animals.residents["animal-beaver-1"].rareVisitCount, 1);
  assert.equal(validateGameState(repaired).ok, true);
});
