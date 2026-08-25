import Phaser from "phaser";
import "./style.css";
import { BootScene } from "./scenes/BootScene.js";
import { BakeryScene } from "./scenes/BakeryScene.js";
import { TownScene } from "./scenes/TownScene.js";
import { WasteCollectionScene } from "./scenes/WasteCollectionScene.js";
import { FishingScene } from "./scenes/FishingScene.js";
import { bootstrapState } from "./state/bootstrapState.js";
import { GAME_STATE_SCHEMA_VERSION } from "./state/constants.js";
import { EconomyService } from "./systems/EconomyService.js";
import { ShopService } from "./systems/ShopService.js";
import { CleanupJobService } from "./systems/CleanupJobService.js";
import { WorldSimulationService } from "./systems/WorldSimulationService.js";
import { NpcTownLifeService } from "./systems/NpcTownLifeService.js";
import { CustomResidentService } from "./systems/CustomResidentService.js";
import { FarmingService } from "./systems/FarmingService.js";
import { AnimalService } from "./systems/AnimalService.js";
import { FishingService } from "./systems/FishingService.js";
import { EconomyHudController } from "./ui/EconomyHudController.js";
import { SaveStatusController } from "./ui/SaveStatusController.js";
import { ShopController } from "./ui/ShopController.js";
import { WorldHudController } from "./ui/WorldHudController.js";
import { CustomResidentController } from "./ui/CustomResidentController.js";
import { FarmingController } from "./ui/FarmingController.js";
import { AnimalFriendsController } from "./ui/AnimalFriendsController.js";
import { ITEM_IDS } from "./data/items.js";

const stateRuntime = bootstrapState(window.localStorage);
const worldSimulation = new WorldSimulationService(stateRuntime.gameState, stateRuntime.repository);
const offlineResolution = worldSimulation.resolveOffline();
const npcTownLife = new NpcTownLifeService(stateRuntime.gameState, stateRuntime.repository);
const customResident = new CustomResidentService(stateRuntime.gameState, stateRuntime.repository);
const farming = new FarmingService(stateRuntime.gameState, stateRuntime.repository);
farming.refresh({ persist: true });
const animals = new AnimalService(stateRuntime.gameState, stateRuntime.repository);
animals.refresh({ persist: true, offline: offlineResolution?.advancedGameMinutes > 0 });
const fishing = new FishingService(stateRuntime.gameState, stateRuntime.repository);
fishing.refresh({ persist: true });

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
  scene: [BootScene, TownScene, BakeryScene, WasteCollectionScene, FishingScene],
};

const game = new Phaser.Game(config);
game.registry.set("gameState", stateRuntime.gameState);
game.registry.set("saveRepository", stateRuntime.repository);
game.registry.set("worldSimulation", worldSimulation);
game.registry.set("npcTownLife", npcTownLife);
game.registry.set("customResident", customResident);
game.registry.set("farming", farming);
game.registry.set("animals", animals);
game.registry.set("fishing", fishing);
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
  worldSimulation.setPaused("modal", anyOpen);
  npcTownLife.setPaused("modal", anyOpen);
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
const worldHud = new WorldHudController(stateRuntime.gameState);
const shopController = new ShopController(shopService, stateRuntime, {
  onModalChange(open) {
    setModalOpen("shop", open);
  },
});
game.registry.set("shopController", shopController);
const farmingController = new FarmingController(farming, {
  onModalChange(open) {
    setModalOpen("farming", open);
  },
});
game.registry.set("farmingController", farmingController);
const animalFriendsController = new AnimalFriendsController(animals, {
  onModalChange(open) {
    setModalOpen("animal-friends", open);
  },
});
game.registry.set("animalFriendsController", animalFriendsController);
const activeTownScene = () => game.scene.getScene("TownScene")?.scene?.isActive?.()
  ? game.scene.getScene("TownScene")
  : null;
const customResidentController = new CustomResidentController(customResident, {
  onModalChange(open) {
    setModalOpen("custom-resident", open);
  },
  onLocate() {
    return activeTownScene()?.locateCustomResident?.() || { ok: false, message: "Return to town to locate your resident." };
  },
  onStartControl() {
    return activeTownScene()?.startCustomResidentControl?.() || { ok: false, message: "Return to town to walk as your resident." };
  },
  onEndControl() {
    return activeTownScene()?.endCustomResidentControl?.() || { ok: false, message: "The control handoff is not active in town." };
  },
});
game.registry.set("customResidentController", customResidentController);

function handleVisibilityChange() {
  npcTownLife.setPaused("background", document.hidden);
  if (document.hidden) worldSimulation.pause("background", { persist: true });
  else {
    const result = worldSimulation.resume("background", { resolveOffline: true });
    animals.refresh({ persist: true, offline: (result?.advancedGameMinutes || 0) > 0 });
  }
}
document.addEventListener("visibilitychange", handleVisibilityChange);
window.addEventListener("pagehide", () => {
  customResident.persistLocation();
  farming.refresh({ persist: true });
  animals.refresh({ persist: true });
  worldSimulation.persist();
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
      catalogueEntries: ITEM_IDS.length,
      schemaVersion: state.schemaVersion,
    };
  },
  getShopDiagnostics() {
    return shopController.getDiagnostics();
  },
  getCleanupDiagnostics() {
    return cleanupService.getDiagnostics();
  },
  getWorldDiagnostics() {
    return {
      ...worldSimulation.getDiagnostics(),
      presentation: worldHud.getDiagnostics(),
      initialOfflineResolution: offlineResolution,
    };
  },
  getNpcDiagnostics() {
    return npcTownLife.getDiagnostics();
  },
  getCustomResidentDiagnostics() {
    return customResidentController.getDiagnostics();
  },
  getFarmingDiagnostics() {
    return { ...farming.getDiagnostics(), interface: farmingController.getDiagnostics() };
  },
  getAnimalDiagnostics() {
    return { ...animals.getDiagnostics(), interface: animalFriendsController.getDiagnostics() };
  },
  getFishingDiagnostics() {
    return fishing.getDiagnostics();
  },
};
