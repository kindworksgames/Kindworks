import Phaser from "phaser";
import "./style.css";
import { BootScene } from "./scenes/BootScene.js";
import { BakeryScene } from "./scenes/BakeryScene.js";
import { TownScene } from "./scenes/TownScene.js";
import { WasteCollectionScene } from "./scenes/WasteCollectionScene.js";
import { bootstrapState } from "./state/bootstrapState.js";
import { GAME_STATE_SCHEMA_VERSION } from "./state/constants.js";
import { EconomyService } from "./systems/EconomyService.js";
import { ShopService } from "./systems/ShopService.js";
import { CleanupJobService } from "./systems/CleanupJobService.js";
import { EconomyHudController } from "./ui/EconomyHudController.js";
import { SaveStatusController } from "./ui/SaveStatusController.js";
import { ShopController } from "./ui/ShopController.js";

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
  scene: [BootScene, TownScene, BakeryScene, WasteCollectionScene],
};

const game = new Phaser.Game(config);
game.registry.set("gameState", stateRuntime.gameState);
game.registry.set("saveRepository", stateRuntime.repository);
const economy = new EconomyService(stateRuntime.gameState, stateRuntime.repository);
game.registry.set("economy", economy);
const cleanupService = new CleanupJobService(stateRuntime.gameState, stateRuntime.repository);
game.registry.set("cleanupService", cleanupService);
const shopService = new ShopService(economy);
const openModals = new Set();
function setModalOpen(name, open) {
  if (open) openModals.add(name);
  else openModals.delete(name);
  const anyOpen = openModals.size > 0;
  document.body.dataset.modalOpen = String(anyOpen);
  const activeScene = game.scene.getScenes(true)[0];
  activeScene?.setOverlayOpen?.(anyOpen);
}
const saveStatus = new SaveStatusController(stateRuntime, {
  onModalChange(open) {
    setModalOpen("save", open);
  },
});
const economyHud = new EconomyHudController(stateRuntime, {
  onModalChange(open) {
    setModalOpen("economy", open);
  },
});
const shopController = new ShopController(shopService, stateRuntime, {
  onModalChange(open) {
    setModalOpen("shop", open);
  },
});
game.registry.set("shopController", shopController);

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
      schemaVersion: GAME_STATE_SCHEMA_VERSION,
    };
  },
  getEconomyDiagnostics() {
    const state = stateRuntime.gameState.getSnapshot();
    return {
      balance: state.economy.coins,
      lifetimeEarned: state.economy.lifetimeCoinsEarned,
      lifetimeSpent: state.economy.lifetimeCoinsSpent,
      ledgerEntries: state.economy.ledger.length,
      ownedTypes: ["equipment", "placeables", "consumables", "furniture"]
        .reduce((count, bucket) => count + Object.keys(state.inventory[bucket]).length, 0),
      unresolvedLegacyItems: state.inventory.unresolvedLegacy.length,
      catalogueEntries: 76,
      schemaVersion: state.schemaVersion,
    };
  },
  getShopDiagnostics() {
    return shopController.getDiagnostics();
  },
  getCleanupDiagnostics() {
    return cleanupService.getDiagnostics();
  },
};
