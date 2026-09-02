import { PHASE_8A_RUNTIME_DEFINITIONS } from "../generated/phase8aVerticalSliceRuntime.js";

const appendMissingById = (base = [], additions = []) => {
  const existingIds = new Set(base.map(({ id }) => id));
  return Object.freeze([...base, ...additions.filter(({ id }) => !existingIds.has(id))]);
};

const mergeScenePacks = (base = [], additions = []) => {
  const additionsById = new Map(additions.map((pack) => [pack.id, pack]));
  const merged = base.map((pack) => {
    const addition = additionsById.get(pack.id);
    if (!addition) return pack;
    additionsById.delete(pack.id);
    return Object.freeze({
      ...addition,
      ...pack,
      assetIds: Object.freeze([...new Set([...(pack.assetIds || []), ...(addition.assetIds || [])])]),
      animationIds: Object.freeze([...new Set([...(pack.animationIds || []), ...(addition.animationIds || [])])]),
    });
  });
  return Object.freeze([...merged, ...additionsById.values()]);
};

/**
 * Adds the contract-only Phase 8A placeholders to the same registry schema used
 * by the game. This module is loaded only by the development Asset Lab route.
 */
export function createPhase8AAssetLabManifest(baseManifest) {
  return Object.freeze({
    ...baseManifest,
    id: `${baseManifest.id}.phase-8a-asset-lab`,
    assets: appendMissingById(baseManifest.assets, PHASE_8A_RUNTIME_DEFINITIONS.assets),
    prefabs: appendMissingById(baseManifest.prefabs, PHASE_8A_RUNTIME_DEFINITIONS.prefabs),
    sceneInstances: appendMissingById(baseManifest.sceneInstances, PHASE_8A_RUNTIME_DEFINITIONS.sceneInstances),
    visualStates: appendMissingById(baseManifest.visualStates, PHASE_8A_RUNTIME_DEFINITIONS.visualStates),
    animations: appendMissingById(baseManifest.animations, PHASE_8A_RUNTIME_DEFINITIONS.animations),
    scenePacks: mergeScenePacks(baseManifest.scenePacks, PHASE_8A_RUNTIME_DEFINITIONS.scenePacks),
  });
}
