import Phaser from "phaser";
import { createPlayerAssets } from "../entities/PlayerCharacter.js";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  create() {
    createPlayerAssets(this);
    this.scene.start("TownScene");
  }
}
