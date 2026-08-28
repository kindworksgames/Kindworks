import Phaser from "phaser";
import { ANIMAL_REFERENCE_SHEET_PATH, ANIMAL_REFERENCE_TEXTURE_KEY } from "../data/animals.js";
import { createPlayerAssets } from "../entities/PlayerCharacter.js";
import { startLazyScene } from "./lazyScenes.js";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload() {
    if (!this.textures.exists(ANIMAL_REFERENCE_TEXTURE_KEY)) {
      this.load.spritesheet(ANIMAL_REFERENCE_TEXTURE_KEY, ANIMAL_REFERENCE_SHEET_PATH, { frameWidth: 64, frameHeight: 64 });
    }
  }

  create() {
    createPlayerAssets(this);
    const activePowerwash = this.registry.get("playgroundPowerwash")?.getActiveSession();
    const activeLawnCare = this.registry.get("lawnCare")?.getActiveSession();
    const activeBeachCleanup = this.registry.get("beachCleanup")?.getActiveSession();
    const activeCleanup = this.registry.get("cleanupService")?.getActiveSession();
    const target = activePowerwash ? "PlaygroundPowerwashScene" : activeBeachCleanup ? "BeachCleanupScene" : activeLawnCare ? "LawnCareScene" : activeCleanup ? "WasteCollectionScene" : "TownScene";
    if (target === "TownScene") this.scene.start(target);
    else startLazyScene(this, target).catch((error) => {
      console.error(`Unable to resume ${target}. Returning safely to Willowmere.`, error);
      this.scene.start("TownScene");
    });
  }
}
