import Phaser from "phaser";
import "./style.css";
import { BootScene } from "./scenes/BootScene.js";
import { BakeryScene } from "./scenes/BakeryScene.js";
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
  scene: [BootScene, TownScene, BakeryScene],
};

const game = new Phaser.Game(config);

window.__KINDWORKS_PHASER__ = {
  game,
  getMilestoneState() {
    const activeScene = game.scene.getScenes(true)[0];
    return activeScene?.player && typeof activeScene.getMilestoneState === "function"
      ? activeScene.getMilestoneState()
      : { scene: activeScene?.scene?.key || "loading" };
  },
};
