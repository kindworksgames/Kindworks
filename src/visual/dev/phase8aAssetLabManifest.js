import { PHASE_8A_RUNTIME_DEFINITIONS } from "../generated/phase8aVerticalSliceRuntime.js";

/**
 * Adds the contract-only Phase 8A placeholders to the same registry schema used
 * by the game. This module is loaded only by the development Asset Lab route.
 */
export function createPhase8AAssetLabManifest(baseManifest) {
  return Object.freeze({
    ...baseManifest,
    id: `${baseManifest.id}.phase-8a-asset-lab`,
    assets: Object.freeze([...baseManifest.assets, ...PHASE_8A_RUNTIME_DEFINITIONS.assets]),
    prefabs: Object.freeze([...baseManifest.prefabs, ...PHASE_8A_RUNTIME_DEFINITIONS.prefabs]),
    sceneInstances: Object.freeze([...baseManifest.sceneInstances, ...PHASE_8A_RUNTIME_DEFINITIONS.sceneInstances]),
    visualStates: Object.freeze([...baseManifest.visualStates, ...PHASE_8A_RUNTIME_DEFINITIONS.visualStates]),
    animations: Object.freeze([...baseManifest.animations, ...PHASE_8A_RUNTIME_DEFINITIONS.animations]),
    scenePacks: Object.freeze([...baseManifest.scenePacks, ...PHASE_8A_RUNTIME_DEFINITIONS.scenePacks]),
  });
}

