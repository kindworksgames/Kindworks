import Phaser from "phaser";
import "./style.css";
import { BootScene } from "./scenes/BootScene.js";
import { BakeryScene } from "./scenes/BakeryScene.js";
import { TownScene } from "./scenes/TownScene.js";
import { bootstrapState } from "./state/bootstrapState.js";
import { SaveStatusController } from "./ui/SaveStatusController.js";

const stateRuntime = bootstrapState(window.localStorage);

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
game.registry.set("gameState", stateRuntime.gameState);
game.registry.set("saveRepository", stateRuntime.repository);
const saveStatus = new SaveStatusController(stateRuntime, {
  onModalChange(open) {
    document.body.dataset.modalOpen = String(open);
    const activeScene = game.scene.getScenes(true)[0];
    activeScene?.setOverlayOpen?.(open);
  },
});

window.__KINDWORKS_PHASER__ = {
  game,
  getMilestoneState() {
    const activeScene = game.scene.getScenes(true)[0];
    return activeScene?.player && typeof activeScene.getMilestoneState === "function"
      ? activeScene.getMilestoneState()
      : { scene: activeScene?.scene?.key || "loading" };
  },
  getSaveDiagnostics() {
    const status = saveStatus.getStatus();
    return {
      namespace: status.namespace,
      hasCurrent: status.hasCurrent,
      hasBackup: status.hasBackup,
      hasRecovery: status.hasRecovery,
      legacyAvailable: status.legacyAvailable,
      legacyVersion: status.legacyVersion,
      legacyUntouched: true,
      schemaVersion: 1,
    };
  },
};
