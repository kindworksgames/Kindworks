import { PHASE_8B_APPROVED_ASSET_INDEX } from "./generated/phase8bApprovedAssetIndex.js";

/** Adds only explicitly approved Phase 8B files to the normal semantic registry. */
export function createPhase8BApprovedManifest(baseManifest) {
  const { assets = [], prefabs = [], visualStates = [], animations = [], sceneInstances = [], scenePacks = [] } = PHASE_8B_APPROVED_ASSET_INDEX;
  if (!assets.length) return baseManifest;
  return Object.freeze({
    ...baseManifest,
    id: `${baseManifest.id}.phase-8b-approved`,
    revision: baseManifest.revision + 1,
    assets: Object.freeze([...baseManifest.assets, ...assets]),
    prefabs: Object.freeze([...baseManifest.prefabs, ...prefabs]),
    sceneInstances: Object.freeze([...baseManifest.sceneInstances, ...sceneInstances]),
    visualStates: Object.freeze([...baseManifest.visualStates, ...visualStates]),
    animations: Object.freeze([...baseManifest.animations, ...animations]),
    scenePacks: Object.freeze([...baseManifest.scenePacks, ...scenePacks]),
  });
}
