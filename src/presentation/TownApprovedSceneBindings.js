import { houseExteriorDirtStage } from "../data/houseRescue.js";
import { WORLD } from "../data/town.js";

const HOUSE_STATES = Object.freeze(["clean", "weathered", "job-ready", "job-ready"]);
const LAWN_STATES = Object.freeze(["fresh-cut", "growing", "long", "job-ready"]);
const position = (x, y, extra = {}) => ({ position: { x, y }, visible: true, ...extra });
const lawnStage = (height) => height < 20 ? 0 : height < 45 ? 1 : height < 70 ? 2 : 3;

function repeat(instance, mode) {
  if (mode === "cover-town-ground") return [position(0, 0, { tileArea: { width: WORLD.width, height: WORLD.height }, depth: 0 })];
  if (mode === "horizontal-strip") return Array.from({ length: 20 }, (_, index) => position(32 + index * 64, instance.position.y));
  if (mode === "vertical-banks") return Array.from({ length: 12 }, (_, index) => position(instance.position.x, 32 + index * 64, { frame: index % 2 }));
  if (mode === "yard-boundary") return [position(215, 155), position(343, 155), position(471, 155), position(215, 480), position(343, 480, { frame: 1 }), position(471, 480)];
  return null;
}

/** Town presentation bindings read live state but never own or mutate it. */
export function createTownApprovedSceneBindings(scene) {
  return {
    placementResolver(instance, binding) {
      if (binding.mode === "repeat") return repeat(instance, binding.repeat);
      if (binding.mode === "dynamic" && instance.id.endsWith(".player")) {
        const actor = scene.customResident?.getSnapshot?.().controlling ? scene.customResidentCharacter : scene.player;
        return actor ? [position(actor.x - Number(instance.worldOrigin?.x || 0), actor.y - Number(instance.worldOrigin?.y || 0), { facing: actor.direction || "down", visible: actor.visible !== false })] : [];
      }
      if (binding.npcIdentityBinding) {
        const character = scene.npcCharacters?.values?.().next?.().value;
        return character ? [position(character.x - Number(instance.worldOrigin?.x || 0), character.y - Number(instance.worldOrigin?.y || 0), { facing: character.direction || "down", visible: character.visible !== false })] : [];
      }
      if (binding.speciesBinding) {
        const character = scene.animalCharacters?.get?.(binding.speciesBinding);
        return character ? [position(character.x - Number(instance.worldOrigin?.x || 0), character.y - Number(instance.worldOrigin?.y || 0), { facing: character.direction || "down", visible: character.visible !== false })] : [];
      }
      if (binding.mode === "contextual") return [position(instance.position.x, instance.position.y, { visible: Boolean(scene.interactions?.getState?.()?.id?.includes?.("lawn")) })];
      if (binding.mode === "event") return [position(instance.position.x, instance.position.y, { visible: false })];
      return null;
    },
    stateResolver(instance, placement) {
      if (placement?.stateName) return placement.stateName;
      if (instance.id.endsWith("house-6")) {
        const snapshot = scene.gameState?.getSnapshot?.();
        return HOUSE_STATES[houseExteriorDirtStage(snapshot?.houseRescue?.homes?.["house-6"], snapshot?.world?.day || 1)] || "clean";
      }
      if (instance.id.endsWith("lawn-house-6")) {
        const lawn = scene.gameState?.getSnapshot?.()?.farming?.lawns?.["lawn-house-6"];
        return LAWN_STATES[lawnStage(lawn?.grassHeight || 0)];
      }
      return null;
    },
  };
}
