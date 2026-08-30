const REQUIRED_WAVES = Object.freeze([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
const REQUIRED_WAVE_FIELDS = Object.freeze([
  "generationJobs",
  "dependencies",
  "integrationOrder",
  "validators",
  "reviewRequirements",
  "sceneTests",
  "completionCriteria",
]);

const VALID_STRATEGIES = new Set([
  "reused-directly",
  "palette-state-variants",
  "modular-components",
  "layered-assets",
  "coherent-whole-illustrations",
  "sprite-sheets",
  "atlas",
  "tileset",
  "ui-nine-slices",
]);

const push = (errors, code, message, path = null) => errors.push({ code, message, path });

function validateDependencyGraph(families, familyById, errors) {
  const visiting = new Set();
  const visited = new Set();

  function visit(id, trail = []) {
    if (visiting.has(id)) {
      push(errors, "cyclic-family-dependency", `Asset-family dependency cycle: ${[...trail, id].join(" -> ")}.`, `assetFamilies.${id}.dependencies`);
      return;
    }
    if (visited.has(id)) return;
    visiting.add(id);
    const family = familyById.get(id);
    for (const dependency of family?.dependencies || []) visit(dependency, [...trail, id]);
    visiting.delete(id);
    visited.add(id);
  }

  for (const family of families) visit(family.id);
}

const sorted = (values) => [...values].sort();

function validateCatalogueCoverage(catalogueCoverage, expectedCatalogue, errors) {
  if (!expectedCatalogue) return;
  const actual = {
    roads: catalogueCoverage?.terrain?.roads || [],
    paths: catalogueCoverage?.terrain?.paths || [],
    bridges: catalogueCoverage?.terrain?.bridges || [],
    districts: catalogueCoverage?.terrain?.districts || [],
    houses: Object.values(catalogueCoverage?.housesByArchitectureKit || {}).flat(),
    shops: catalogueCoverage?.shopExteriors || [],
    landmarks: catalogueCoverage?.landmarks || [],
    products: Object.values(catalogueCoverage?.releasedProductsByFamily || {}).flat(),
    residents: catalogueCoverage?.residentIdentities || [],
    species: catalogueCoverage?.animalSpecies || [],
    animals: catalogueCoverage?.animalIdentities || [],
    crops: catalogueCoverage?.cropIdentities || [],
    homeThemes: catalogueCoverage?.homeThemes || [],
    minigamePacks: catalogueCoverage?.minigamePacks || [],
  };
  for (const [key, expected] of Object.entries(expectedCatalogue)) {
    const values = actual[key] || [];
    if (new Set(values).size !== values.length) push(errors, "duplicate-catalogue-identity", `Catalogue ${key} contains duplicate identities.`, `catalogueCoverage.${key}`);
    if (JSON.stringify(sorted(values)) !== JSON.stringify(sorted(expected))) {
      push(errors, "incomplete-catalogue-coverage", `Catalogue ${key} does not exactly match the audited repository (${values.length}/${expected.length}).`, `catalogueCoverage.${key}`);
    }
  }
}

export function validatePhase10ProductionPlan(plan, { productionScenes = [], phase8aAssetIds = [], expectedCatalogue = null } = {}) {
  const errors = [];
  if (!plan || typeof plan !== "object") {
    return { ok: false, errors: [{ code: "invalid-plan", message: "Plan must be an object.", path: null }], summary: {} };
  }

  if (plan.schemaVersion !== 1) push(errors, "unsupported-schema", "Phase 10 plan schemaVersion must be 1.", "schemaVersion");
  if (plan.id !== "kindworks.artwork-production-plan.phase-10") push(errors, "invalid-plan-id", "Unexpected Phase 10 plan ID.", "id");

  const waves = Array.isArray(plan.waves) ? plan.waves : [];
  const waveIds = waves.map(({ id }) => id);
  if (JSON.stringify(waveIds) !== JSON.stringify(REQUIRED_WAVES)) {
    push(errors, "invalid-wave-order", "The production plan must contain waves 1 through 10 in dependency order.", "waves");
  }
  for (const [index, wave] of waves.entries()) {
    for (const field of REQUIRED_WAVE_FIELDS) {
      if (!Array.isArray(wave[field]) || (field !== "dependencies" && wave[field].length === 0)) push(errors, "incomplete-wave", `Wave ${wave.id ?? index + 1} requires ${field}${field === "dependencies" ? " to be an array" : " to be non-empty"}.`, `waves.${index}.${field}`);
    }
  }

  const families = Array.isArray(plan.assetFamilies) ? plan.assetFamilies : [];
  const familyById = new Map();
  for (const [index, family] of families.entries()) {
    const path = `assetFamilies.${index}`;
    if (!family?.id) push(errors, "missing-family-id", "Every asset family requires an ID.", `${path}.id`);
    else if (familyById.has(family.id)) push(errors, "duplicate-family-id", `Duplicate asset-family ID: ${family.id}.`, `${path}.id`);
    else familyById.set(family.id, family);
    if (!REQUIRED_WAVES.includes(family?.wave)) push(errors, "invalid-family-wave", `${family?.id || path} has an invalid wave.`, `${path}.wave`);
    if (!Array.isArray(family?.strategies) || family.strategies.length === 0) push(errors, "missing-family-strategy", `${family?.id || path} requires at least one production strategy.`, `${path}.strategies`);
    for (const strategy of family?.strategies || []) if (!VALID_STRATEGIES.has(strategy)) push(errors, "invalid-family-strategy", `${family.id} uses unknown strategy ${strategy}.`, `${path}.strategies`);
    if (!family?.scope) push(errors, "missing-family-scope", `${family?.id || path} requires a scope.`, `${path}.scope`);
    if (!family?.deduplicationRule) push(errors, "missing-deduplication-rule", `${family?.id || path} requires a deduplication rule.`, `${path}.deduplicationRule`);
    if (!Array.isArray(family?.scenes) || family.scenes.length === 0) push(errors, "missing-family-scenes", `${family?.id || path} must identify its consumers.`, `${path}.scenes`);
    if (family?.strategies?.includes("coherent-whole-illustrations") && !family.oneOffJustification) {
      push(errors, "unjustified-coherent-whole", `${family.id} uses a coherent whole illustration without justification.`, `${path}.oneOffJustification`);
    }
  }

  for (const [index, family] of families.entries()) {
    for (const dependency of family.dependencies || []) {
      const resolved = familyById.get(dependency);
      if (!resolved) push(errors, "missing-family-dependency", `${family.id} references missing dependency ${dependency}.`, `assetFamilies.${index}.dependencies`);
      else if (resolved.wave > family.wave) push(errors, "future-wave-dependency", `${family.id} in wave ${family.wave} depends on ${dependency} in later wave ${resolved.wave}.`, `assetFamilies.${index}.dependencies`);
    }
  }
  validateDependencyGraph(families, familyById, errors);

  const sceneDependencies = plan.sceneDependencies && typeof plan.sceneDependencies === "object" ? plan.sceneDependencies : {};
  const expectedScenes = [...new Set(productionScenes)].sort();
  const actualScenes = Object.keys(sceneDependencies).sort();
  for (const scene of expectedScenes) {
    if (!Array.isArray(sceneDependencies[scene]) || sceneDependencies[scene].length === 0) push(errors, "missing-scene-dependencies", `${scene} has no assigned production families.`, `sceneDependencies.${scene}`);
  }
  for (const scene of actualScenes) if (!expectedScenes.includes(scene)) push(errors, "unknown-production-scene", `${scene} is not a registered production scene.`, `sceneDependencies.${scene}`);
  for (const scene of expectedScenes) {
    const dependencies = sceneDependencies[scene] || [];
    if (new Set(dependencies).size !== dependencies.length) push(errors, "duplicate-scene-family", `${scene} lists a family more than once.`, `sceneDependencies.${scene}`);
    for (const familyId of dependencies) if (!familyById.has(familyId)) push(errors, "missing-scene-family", `${scene} references missing family ${familyId}.`, `sceneDependencies.${scene}`);
  }

  const assignedSliceAssets = new Map();
  for (const family of families) for (const assetId of family.phase8aAssets || []) {
    assignedSliceAssets.set(assetId, [...(assignedSliceAssets.get(assetId) || []), family.id]);
  }
  for (const assetId of phase8aAssetIds) {
    const owners = assignedSliceAssets.get(assetId) || [];
    if (owners.length === 0) push(errors, "unassigned-phase8a-asset", `${assetId} is not assigned to a production family.`, "assetFamilies.phase8aAssets");
    if (owners.length > 1) push(errors, "duplicate-phase8a-assignment", `${assetId} is assigned to ${owners.join(", ")}.`, "assetFamilies.phase8aAssets");
  }
  for (const assetId of assignedSliceAssets.keys()) if (!phase8aAssetIds.includes(assetId)) push(errors, "unknown-phase8a-asset", `${assetId} is not in the Phase 8A contract.`, "assetFamilies.phase8aAssets");

  const prerequisites = plan.prerequisites || {};
  if ((!prerequisites.phase8bApprovedVerticalSlice || !prerequisites.phase9LockedArtBible) && prerequisites.executionAllowed !== false) {
    push(errors, "unsafe-execution-gate", "Production execution must remain blocked until Phase 8B and Phase 9 pass.", "prerequisites.executionAllowed");
  }
  validateCatalogueCoverage(plan.catalogueCoverage, expectedCatalogue, errors);

  return {
    ok: errors.length === 0,
    errors,
    summary: {
      waves: waves.length,
      assetFamilies: families.length,
      productionScenesExpected: expectedScenes.length,
      productionScenesAssigned: expectedScenes.filter((scene) => (sceneDependencies[scene] || []).length > 0).length,
      phase8aAssetsExpected: phase8aAssetIds.length,
      phase8aAssetsAssignedOnce: phase8aAssetIds.filter((id) => (assignedSliceAssets.get(id) || []).length === 1).length,
      catalogueIdentities: plan.catalogueCoverage ? Object.values(plan.catalogueCoverage.releasedProductsByFamily || {}).flat().length + (plan.catalogueCoverage.residentIdentities || []).length + (plan.catalogueCoverage.animalIdentities || []).length : 0,
      executionAllowed: prerequisites.executionAllowed === true,
    },
  };
}

export const PHASE_10_VALID_STRATEGIES = Object.freeze([...VALID_STRATEGIES]);
