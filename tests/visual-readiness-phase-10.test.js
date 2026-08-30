import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { LAZY_SCENE_KEYS } from "../src/scenes/lazyScenes.js";
import { ANIMAL_DEFINITIONS, ANIMAL_SPECIES } from "../src/data/animals.js";
import { FARMING_CROPS } from "../src/data/farming.js";
import { HOUSE_INTERIOR_THEMES } from "../src/data/homeInteriors.js";
import { ITEM_CATALOG } from "../src/data/items.js";
import { NPC_RESIDENTS } from "../src/data/npcTownLife.js";
import { BRIDGES, DISTRICTS, HOUSES, LANDMARKS, PATHS, ROADS, SHOPS } from "../src/data/town.js";
import { PHASE_8A_ASSET_IDS } from "../src/visual/verticalSlice/phase8aVerticalSlicePackage.js";
import { validatePhase10ProductionPlan } from "../scripts/lib/phase10ProductionPlanValidation.mjs";

const root = resolve(import.meta.dirname, "..");
const productionScenes = ["BootScene", "TownScene", ...LAZY_SCENE_KEYS];
const phase8aAssetIds = Object.values(PHASE_8A_ASSET_IDS);
const loadPlan = async () => JSON.parse(await readFile(resolve(root, "artwork/production/phase-10/production-migration-plan.v1.json"), "utf8"));
const expectedCatalogue = (plan) => ({
  roads: ROADS.map(({ id }) => id), paths: PATHS.map(({ id }) => id), bridges: BRIDGES.map(({ id }) => id), districts: DISTRICTS.map(({ title }) => title),
  houses: HOUSES.map(({ id }) => id), shops: SHOPS.map(({ title }) => title), landmarks: LANDMARKS.map(({ title }) => title),
  products: Object.values(ITEM_CATALOG).filter(({ shopGroup }) => shopGroup !== "QA").map(({ id }) => id),
  residents: [...NPC_RESIDENTS.map(({ id, name }) => `${id}:${name}`), "npc-kindly-member:player-owned-resident"],
  species: Object.keys(ANIMAL_SPECIES), animals: ANIMAL_DEFINITIONS.map(({ id }) => id),
  crops: [...Object.keys(FARMING_CROPS), "orchard-apple"], homeThemes: HOUSE_INTERIOR_THEMES.map(({ name }) => name),
  minigamePacks: plan.catalogueCoverage.minigamePacks,
});

test("Phase 10 assigns every registered production scene to valid production families", async () => {
  const plan = await loadPlan();
  const result = validatePhase10ProductionPlan(plan, { productionScenes, phase8aAssetIds, expectedCatalogue: expectedCatalogue(plan) });
  assert.equal(result.ok, true, result.errors.map(({ code, message }) => `${code}: ${message}`).join("\n"));
  assert.equal(result.summary.productionScenesAssigned, productionScenes.length);
  assert.deepEqual(Object.keys(plan.sceneDependencies).sort(), [...productionScenes].sort());
});

test("the named production catalogue exactly covers current world, product, resident and animal identities", async () => {
  const plan = await loadPlan();
  const result = validatePhase10ProductionPlan(plan, { productionScenes, phase8aAssetIds, expectedCatalogue: expectedCatalogue(plan) });
  assert.equal(result.ok, true, result.errors.map(({ code, message }) => `${code}: ${message}`).join("\n"));
  assert.equal(plan.catalogueCoverage.residentIdentities.length, 36);
  assert.equal(plan.catalogueCoverage.animalSpecies.length, 37);
  assert.equal(plan.catalogueCoverage.animalIdentities.length, 56);
});

test("every Phase 8A slice contract belongs to exactly one deduplicated family", async () => {
  const plan = await loadPlan();
  const assignments = plan.assetFamilies.flatMap(({ id, phase8aAssets = [] }) => phase8aAssets.map((assetId) => ({ assetId, familyId: id })));
  for (const assetId of phase8aAssetIds) assert.equal(assignments.filter((entry) => entry.assetId === assetId).length, 1, assetId);
  assert.equal(assignments.length, phase8aAssetIds.length);
});

test("the ten production waves contain implementation, validation, review and completion gates", async () => {
  const plan = await loadPlan();
  assert.deepEqual(plan.waves.map(({ id }) => id), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  for (const wave of plan.waves) for (const field of ["generationJobs", "dependencies", "integrationOrder", "validators", "reviewRequirements", "sceneTests", "completionCriteria"]) {
    assert.ok(Array.isArray(wave[field]), `Wave ${wave.id} ${field}`);
    if (field !== "dependencies") assert.ok(wave[field].length > 0, `Wave ${wave.id} ${field}`);
  }
});

test("coherent whole illustrations are exceptional and explicitly justified", async () => {
  const plan = await loadPlan();
  for (const family of plan.assetFamilies.filter(({ strategies }) => strategies.includes("coherent-whole-illustrations"))) {
    assert.ok(family.oneOffJustification?.length > 20, family.id);
    assert.match(family.deduplicationRule, /reuse|shared|module|shell|global|board|product|scene/i, family.id);
  }
});

test("invalid scene coverage and duplicate slice assignments fail validation", async () => {
  const missingScene = await loadPlan();
  delete missingScene.sceneDependencies.FishingScene;
  let result = validatePhase10ProductionPlan(missingScene, { productionScenes, phase8aAssetIds });
  assert.ok(result.errors.some(({ code }) => code === "missing-scene-dependencies"));

  const duplicateSlice = await loadPlan();
  duplicateSlice.assetFamilies[0].phase8aAssets = [phase8aAssetIds[0]];
  result = validatePhase10ProductionPlan(duplicateSlice, { productionScenes, phase8aAssetIds });
  assert.ok(result.errors.some(({ code }) => code === "duplicate-phase8a-assignment"));
});

test("production remains blocked until the approved slice and locked art bible exist", async () => {
  const plan = await loadPlan();
  assert.equal(plan.prerequisites.phase8bApprovedVerticalSlice, false);
  assert.equal(plan.prerequisites.phase9LockedArtBible, false);
  assert.equal(plan.prerequisites.executionAllowed, false);
  assert.match(plan.prerequisites.blockingReason, /0\/22 approved runtime assets/i);
});
