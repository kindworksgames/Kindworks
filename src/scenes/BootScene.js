import Phaser from "phaser";
import { createPlayerAssets } from "../entities/PlayerCharacter.js";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  create() {
    createPlayerAssets(this);
    const activeLawnCare = this.registry.get("lawnCare")?.getActiveSession();
    const activeBeachCleanup = this.registry.get("beachCleanup")?.getActiveSession();
    const activeCleanup = this.registry.get("cleanupService")?.getActiveSession();
    this.scene.start(activeBeachCleanup ? "BeachCleanupScene" : activeLawnCare ? "LawnCareScene" : activeCleanup ? "WasteCollectionScene" : "TownScene");
  }
}
