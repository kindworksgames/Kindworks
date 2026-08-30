import Phaser from "phaser";
import { createPlayerAssets } from "../entities/PlayerCharacter.js";
import { startLazyScene } from "./lazyScenes.js";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload() {
    this.registry.get("visualRegistry")?.queueScenePacks(this, this.scene.key);
  }

  create() {
    createPlayerAssets(this);
    const recovery = this.registry.get("activityRecovery")?.resolve?.();
    const target = recovery?.selected?.sceneKey || "TownScene";
    if (recovery?.status === "conflict-resolved") {
      console.warn(`Multiple interrupted activities were found. Resuming ${recovery.selected.label}; ${recovery.conflictCount} older checkpoint(s) remain preserved.`);
    }
    if (target === "TownScene") this.scene.start(target);
    else startLazyScene(this, target).catch((error) => {
      console.error(`Unable to resume ${target}. Returning safely to Willowmere.`, error);
      this.scene.start("TownScene");
    });
  }
}
