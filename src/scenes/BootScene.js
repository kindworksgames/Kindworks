import Phaser from "phaser";
import { createPlayerAssets } from "../entities/PlayerCharacter.js";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  create() {
    createPlayerAssets(this);
    const activeCleanup = this.registry.get("cleanupService")?.getActiveSession();
    this.scene.start(activeCleanup ? "WasteCollectionScene" : "TownScene");
  }
}
