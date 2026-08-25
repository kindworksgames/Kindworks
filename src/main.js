import Phaser from "phaser";
import "./style.css";
import { BootScene } from "./scenes/BootScene.js";
import { TownScene } from "./scenes/TownScene.js";

const config = {
  type: Phaser.AUTO,
  parent: "game",
  width: 1280,
  height: 720,
  backgroundColor: "#20382c",
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, TownScene],
};

const game = new Phaser.Game(config);

window.__KINDWORKS_PHASER__ = {
  game,
  getMilestoneState() {
    const scene = game.scene.getScene("TownScene");
    return scene?.player ? scene.getMilestoneState() : { scene: "loading" };
  },
};
