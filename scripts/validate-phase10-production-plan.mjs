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
import { validatePhase10ProductionPlan } from "./lib/phase10ProductionPlanValidation.mjs";
import { renderAssetContractCatalog, validateAssetCategoryCatalog } from "./lib/assetContractCatalog.mjs";

const root = resolve(import.meta.dirname, "..");
const planPath = resolve(root, "artwork/production/phase-10/production-migration-plan.v1.json");
const plan = JSON.parse(await readFile(planPath, "utf8"));
const contractCatalogPath = resolve(root, "artwork/contracts/asset-category-contracts.v2.json");
const contractCatalogText = await readFile(contractCatalogPath, "utf8");
const contractCatalog = JSON.parse(contractCatalogText);
const productionScenes = ["BootScene", "TownScene", ...LAZY_SCENE_KEYS];
const phase8aAssetIds = Object.values(PHASE_8A_ASSET_IDS);
const expectedCatalogue = {
  roads: ROADS.map(({ id }) => id),
  paths: PATHS.map(({ id }) => id),
  bridges: BRIDGES.map(({ id }) => id),
  districts: DISTRICTS.map(({ title }) => title),
  houses: HOUSES.map(({ id }) => id),
  shops: SHOPS.map(({ title }) => title),
  landmarks: LANDMARKS.map(({ title }) => title),
  products: Object.values(ITEM_CATALOG).filter(({ shopGroup }) => shopGroup !== "QA").map(({ id }) => id),
  residents: [...NPC_RESIDENTS.map(({ id, name }) => `${id}:${name}`), "npc-kindly-member:player-owned-resident"],
  species: Object.keys(ANIMAL_SPECIES),
  animals: ANIMAL_DEFINITIONS.map(({ id }) => id),
  crops: [...Object.keys(FARMING_CROPS), "orchard-apple"],
  homeThemes: HOUSE_INTERIOR_THEMES.map(({ name }) => name),
  minigamePacks: plan.catalogueCoverage.minigamePacks,
};
const result = validatePhase10ProductionPlan(plan, { productionScenes, phase8aAssetIds, expectedCatalogue });
const contractResult = validateAssetCategoryCatalog({ categoryContracts: contractCatalog.categoryContracts, familyAssignments: contractCatalog.familyAssignments, phase10Plan: plan });
const contractErrors = [...contractResult.errors];
if (contractCatalogText !== renderAssetContractCatalog(plan)) contractErrors.push({ code: "stale-contract-catalog", message: "The Phase 10 family-contract catalog is stale.", path: "artwork/contracts/asset-category-contracts.v2.json" });
result.errors.push(...contractErrors);
result.ok = result.errors.length === 0;

if (!result.ok) {
  for (const error of result.errors) console.error(`${error.code}: ${error.message}${error.path ? ` [${error.path}]` : ""}`);
  process.exitCode = 1;
} else {
  const summary = result.summary;
  console.log(`Phase 10 structural plan: PASS — ${summary.waves} waves, ${summary.assetFamilies} deduplicated families, ${summary.productionScenesAssigned}/${summary.productionScenesExpected} production scenes assigned, ${summary.phase8aAssetsAssignedOnce}/${summary.phase8aAssetsExpected} Phase 8A contracts assigned exactly once, ${summary.catalogueIdentities} named product/resident/animal identities covered, ${contractCatalog.familyAssignments.length}/${summary.assetFamilies} families assigned to ${contractCatalog.categoryContracts.length} machine-readable category contracts.`);
  if (!summary.executionAllowed) console.log(`Phase 10 production execution: BLOCKED — ${plan.prerequisites.blockingReason}`);
}
