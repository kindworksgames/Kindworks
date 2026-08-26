import Phaser from "phaser";
import "./style.css";
import { BootScene } from "./scenes/BootScene.js";
import { BakeryScene } from "./scenes/BakeryScene.js";
import { CafeScene } from "./scenes/CafeScene.js";
import { MorningMugScene } from "./scenes/MorningMugScene.js";
import { RiversideKitchenScene } from "./scenes/RiversideKitchenScene.js";
import { SouthShoreScoopsScene } from "./scenes/SouthShoreScoopsScene.js";
import { RiverClearoutScene } from "./scenes/RiverClearoutScene.js";
import { HouseRescueScene } from "./scenes/HouseRescueScene.js";
import { TownScene } from "./scenes/TownScene.js";
import { WasteCollectionScene } from "./scenes/WasteCollectionScene.js";
import { LawnCareScene } from "./scenes/LawnCareScene.js";
import { BeachCleanupScene } from "./scenes/BeachCleanupScene.js";
import { PlaygroundPowerwashScene } from "./scenes/PlaygroundPowerwashScene.js";
import { FishingScene } from "./scenes/FishingScene.js";
import { VillageGrocerScene } from "./scenes/VillageGrocerScene.js";
import { bootstrapState } from "./state/bootstrapState.js";
import { GAME_STATE_SCHEMA_VERSION } from "./state/constants.js";
import { EconomyService } from "./systems/EconomyService.js";
import { ShopService } from "./systems/ShopService.js";
import { CleanupJobService } from "./systems/CleanupJobService.js";
import { WorldSimulationService } from "./systems/WorldSimulationService.js";
import { LivingEnvironmentService } from "./systems/LivingEnvironmentService.js";
import { NpcTownLifeService } from "./systems/NpcTownLifeService.js";
import { MunicipalCollectionService } from "./systems/MunicipalCollectionService.js";
import { CustomResidentService } from "./systems/CustomResidentService.js";
import { FarmingService } from "./systems/FarmingService.js";
import { AnimalService } from "./systems/AnimalService.js";
import { FishingService } from "./systems/FishingService.js";
import { BakeryService } from "./systems/BakeryService.js";
import { CafeService } from "./systems/CafeService.js";
import { MorningMugService } from "./systems/MorningMugService.js";
import { RiversideKitchenService } from "./systems/RiversideKitchenService.js";
import { SouthShoreScoopsService } from "./systems/SouthShoreScoopsService.js";
import { RiverClearoutService } from "./systems/RiverClearoutService.js";
import { HouseRescueService } from "./systems/HouseRescueService.js";
import { LawnCareService } from "./systems/LawnCareService.js";
import { BeachCleanupService } from "./systems/BeachCleanupService.js";
import { PlaygroundPowerwashService } from "./systems/PlaygroundPowerwashService.js";
import { TownPlacementService } from "./systems/TownPlacementService.js";
import { RestorationMilestoneService } from "./systems/RestorationMilestoneService.js";
import { EconomyHudController } from "./ui/EconomyHudController.js";
import { SaveStatusController } from "./ui/SaveStatusController.js";
import { ShopController } from "./ui/ShopController.js";
import { WorldHudController } from "./ui/WorldHudController.js";
import { CustomResidentController } from "./ui/CustomResidentController.js";
import { FarmingController } from "./ui/FarmingController.js";
import { AnimalFriendsController } from "./ui/AnimalFriendsController.js";
import { RestorationMilestoneController } from "./ui/RestorationMilestoneController.js";
import { ITEM_IDS } from "./data/items.js";

const stateRuntime = bootstrapState(window.localStorage);
const worldSimulation = new WorldSimulationService(stateRuntime.gameState, stateRuntime.repository);
const farming = new FarmingService(stateRuntime.gameState, stateRuntime.repository);
const livingEnvironment = new LivingEnvironmentService(stateRuntime.gameState, stateRuntime.repository);
worldSimulation.addStateAdvancer((state) => farming.resolveInto(state));
worldSimulation.addStateAdvancer((state) => livingEnvironment.advanceInto(state));
const offlineResolution = worldSimulation.resolveOffline();
const npcTownLife = new NpcTownLifeService(stateRuntime.gameState, stateRuntime.repository);
const municipalCollection = new MunicipalCollectionService(stateRuntime.gameState, stateRuntime.repository);
const customResident = new CustomResidentService(stateRuntime.gameState, stateRuntime.repository);
farming.refresh({ persist: true });
livingEnvironment.refresh({ persist: true });
const animals = new AnimalService(stateRuntime.gameState, stateRuntime.repository);
animals.refresh({ persist: true, offline: offlineResolution?.advancedGameMinutes > 0 });
const fishing = new FishingService(stateRuntime.gameState, stateRuntime.repository);
fishing.refresh({ persist: true });
const bakery = new BakeryService(stateRuntime.gameState, stateRuntime.repository);
const cafe = new CafeService(stateRuntime.gameState, stateRuntime.repository);
const morningMug = new MorningMugService(stateRuntime.gameState, stateRuntime.repository);
const riversideKitchen = new RiversideKitchenService(stateRuntime.gameState, stateRuntime.repository);
const southShoreScoops = new SouthShoreScoopsService(stateRuntime.gameState, stateRuntime.repository);
const river = new RiverClearoutService(stateRuntime.gameState, stateRuntime.repository, { environment: livingEnvironment });
const houseRescue = new HouseRescueService(stateRuntime.gameState, stateRuntime.repository);
const lawnCare = new LawnCareService(stateRuntime.gameState, stateRuntime.repository);
const beachCleanup = new BeachCleanupService(stateRuntime.gameState, stateRuntime.repository);
beachCleanup.refresh();
const playgroundPowerwash = new PlaygroundPowerwashService(stateRuntime.gameState, stateRuntime.repository);
playgroundPowerwash.refresh();
const townPlacement = new TownPlacementService(stateRuntime.gameState, stateRuntime.repository);
const restorationMilestones = new RestorationMilestoneService(stateRuntime.gameState, stateRuntime.repository);

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
  scene: [BootScene, TownScene, VillageGrocerScene, BakeryScene, CafeScene, MorningMugScene, RiversideKitchenScene, SouthShoreScoopsScene, RiverClearoutScene, HouseRescueScene, WasteCollectionScene, LawnCareScene, BeachCleanupScene, PlaygroundPowerwashScene, FishingScene],
};

const game = new Phaser.Game(config);
game.registry.set("gameState", stateRuntime.gameState);
game.registry.set("saveRepository", stateRuntime.repository);
game.registry.set("worldSimulation", worldSimulation);
game.registry.set("npcTownLife", npcTownLife);
game.registry.set("municipalCollection", municipalCollection);
game.registry.set("customResident", customResident);
game.registry.set("farming", farming);
game.registry.set("livingEnvironment", livingEnvironment);
game.registry.set("animals", animals);
game.registry.set("fishing", fishing);
game.registry.set("bakery", bakery);
game.registry.set("cafe", cafe);
game.registry.set("morningMug", morningMug);
game.registry.set("riversideKitchen", riversideKitchen);
game.registry.set("southShoreScoops", southShoreScoops);
game.registry.set("river", river);
game.registry.set("houseRescue", houseRescue);
game.registry.set("lawnCare", lawnCare);
game.registry.set("beachCleanup", beachCleanup);
game.registry.set("playgroundPowerwash", playgroundPowerwash);
game.registry.set("townPlacement", townPlacement);
game.registry.set("restorationMilestones", restorationMilestones);
const economy = new EconomyService(stateRuntime.gameState, stateRuntime.repository);
game.registry.set("economy", economy);
if (import.meta.env.DEV && new URLSearchParams(window.location.search).get("qa") === "placement") {
  const snapshot = townPlacement.getSnapshot();
  const planterOwnedOrPlaced = Number(snapshot.inventory["town-planter"] || 0)
    + snapshot.objects.filter((object) => object.itemId === "town-planter").length;
  if (planterOwnedOrPlaced < 1) economy.grantItem("town-planter", 1, { reason: "Milestone 25 visual QA fixture" });
}
if (import.meta.env.DEV && new URLSearchParams(window.location.search).get("qa") === "village-grocer") {
  const balance = stateRuntime.gameState.getSnapshot().economy.coins;
  if (balance < 3000) economy.credit(3000 - balance, { kind: "development-fixture", reason: "Milestone 26 Village Grocer visual QA" });
}
if (import.meta.env.DEV && new URLSearchParams(window.location.search).get("qa") === "collection") municipalCollection.start({ force: true, persist: true });
if (import.meta.env.DEV && new URLSearchParams(window.location.search).get("qa") === "restoration") restorationMilestones.unlockForQa("festival", { revealed: false });
if (import.meta.env.DEV && new URLSearchParams(window.location.search).get("qa") === "home") {
  if (!customResident.getSnapshot().created) {
    customResident.saveProfile({
      name: "Meadow",
      skin: "warm",
      hair: 1,
      hairColor: "dark-brown",
      accessory: "badge",
      outfit: 1,
      bodyBuild: "average",
      hobbies: ["gardening", "nature", "helping"],
      home: { wallColor: "cream", roofStyle: "gable", roofColor: "terracotta" },
    });
  }
  const balance = stateRuntime.gameState.getSnapshot().economy.coins;
  if (balance < 200_000) economy.credit(200_000 - balance, { kind: "development-fixture", reason: "Milestone 31 personal-home visual QA" });
}
const cleanupService = new CleanupJobService(stateRuntime.gameState, stateRuntime.repository, { environment: livingEnvironment });
game.registry.set("cleanupService", cleanupService);
const shopService = new ShopService(economy, { farming });
function activeTownScene() {
  return game.scene.getScene("TownScene")?.scene?.isActive?.() ? game.scene.getScene("TownScene") : null;
}
const openModals = new Set();
function setModalOpen(name, open) {
  if (open) openModals.add(name);
  else openModals.delete(name);
  const anyOpen = openModals.size > 0;
  worldSimulation.setPaused("modal", anyOpen);
  npcTownLife.setPaused("modal", anyOpen);
  municipalCollection.setPaused("modal", anyOpen);
  document.body.dataset.modalOpen = String(anyOpen);
  const activeScene = game.scene.getScenes(true)[0];
  activeScene?.setOverlayOpen?.(anyOpen);
}
const restorationMilestoneController = new RestorationMilestoneController(restorationMilestones, {
  onModalChange(open) {
    setModalOpen("restoration-milestone", open);
  },
  canOpen() {
    return Boolean(activeTownScene()) && document.body.dataset.modalOpen !== "true";
  },
  onFocus(focus, id) {
    activeTownScene()?.focusRestorationMilestone?.(focus, id);
  },
  onReaction(id, focus) {
    npcTownLife.showRestorationReaction?.(id, focus);
  },
});
game.registry.set("restorationMilestoneController", restorationMilestoneController);
setTimeout(() => restorationMilestoneController.maybeOpen(), 450);
const saveStatus = new SaveStatusController(stateRuntime, {
  onModalChange(open) {
    setModalOpen("save", open);
  },
});
const economyHud = new EconomyHudController(stateRuntime, {
  economy,
  onModalChange(open) {
    setModalOpen("economy", open);
  },
  onUseConsumable(item) {
    if (item?.shopGroup === "Farming") return game.registry.get("farmingController")?.open?.("allotment") || { ok: false };
    return game.registry.get("animalFriendsController")?.open?.() || { ok: false };
  },
  onPlaceable(item) {
    return activeTownScene()?.beginTownPlacement?.(item?.id) || { ok: false, message: "Return to Willowmere town to place this item." };
  },
});
const worldHud = new WorldHudController(stateRuntime.gameState);
const shopController = new ShopController(shopService, stateRuntime, {
  onModalChange(open) {
    setModalOpen("shop", open);
  },
  onPlaceItem(item) {
    return activeTownScene()?.beginTownPlacement?.(item?.id) || { ok: false, message: "Return to Willowmere town to place this item." };
  },
});
game.registry.set("shopController", shopController);
const farmingController = new FarmingController(farming, {
  onModalChange(open) {
    setModalOpen("farming", open);
  },
  onStartLawnJob(targetId) {
    return activeTownScene()?.startLawnCare({ mode: "town-job", targetId }) || { ok: false, message: "Return to town to start Lawn Care." };
  },
  onStartLawnCampaign() {
    return activeTownScene()?.startLawnCare({ mode: "campaign" }) || { ok: false, message: "Return to town to start the Lawn Care campaign." };
  },
  onOpenSeedShop(itemId) {
    return activeTownScene()?.enterVillageGrocer?.({ focusItemId: itemId }) || shopController.open("town-grocer", { group: "Farming", itemId });
  },
  onPlaceSapling() {
    return activeTownScene()?.beginAppleTreePlacement?.() || { ok: false, message: "Return to Willowmere town to place this sapling." };
  },
});
game.registry.set("farmingController", farmingController);
const animalFriendsController = new AnimalFriendsController(animals, {
  onModalChange(open) {
    setModalOpen("animal-friends", open);
  },
});
game.registry.set("animalFriendsController", animalFriendsController);
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
  municipalCollection.setPaused("background", document.hidden);
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
  livingEnvironment.refresh({ persist: true });
  animals.refresh({ persist: true });
  municipalCollection.syncState({ persist: true });
  worldSimulation.persist();
  if (morningMug.getActiveSession() && !morningMug.getActiveSession().finished) morningMug.persistActiveSession();
  if (riversideKitchen.getActiveSession() && !riversideKitchen.getActiveSession().finished) riversideKitchen.persistActiveSession();
  if (southShoreScoops.getActiveSession() && !southShoreScoops.getActiveSession().finished) southShoreScoops.persistActiveSession();
});

window.__KINDWORKS_PHASER__ = {
  game,
  getMilestoneState() {
    const activeScene = game.scene.getScenes(true)[0];
    return typeof activeScene?.getMilestoneState === "function"
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
  getTownPlacementDiagnostics() {
    return townPlacement.getDiagnostics();
  },
  qaGrantTownPlacementItem(itemId = "town-planter") {
    if (!import.meta.env.DEV) return { ok: false, message: "Visual QA helpers are available only in development." };
    return economy.grantItem(itemId, 1, { reason: "Milestone 25 visual QA fixture" });
  },
  qaBeginTownPlacement(itemId = "town-planter") {
    if (!import.meta.env.DEV) return { ok: false, message: "Visual QA helpers are available only in development." };
    return activeTownScene()?.beginTownPlacement?.(itemId) || { ok: false, message: "Willowmere town is not active." };
  },
  qaPreviewTownPlacement(x, y) {
    if (!import.meta.env.DEV) return { ok: false, message: "Visual QA helpers are available only in development." };
    return activeTownScene()?.previewTownPlacement?.(x, y) || { ok: false, message: "Willowmere town is not active." };
  },
  qaConfirmTownPlacement() {
    if (!import.meta.env.DEV) return { ok: false, message: "Visual QA helpers are available only in development." };
    return townPlacement.confirm();
  },
  qaGrantFarmingCoins(amount = 3000) {
    if (!import.meta.env.DEV) return { ok: false, message: "Visual QA helpers are available only in development." };
    return economy.credit(Math.max(1, Math.floor(Number(amount) || 3000)), { kind: "development-fixture", reason: "Milestone 26 farming visual QA" });
  },
  qaBeginAppleTreePlacement() {
    if (!import.meta.env.DEV) return { ok: false, message: "Visual QA helpers are available only in development." };
    return activeTownScene()?.beginAppleTreePlacement?.() || { ok: false, message: "Willowmere town is not active." };
  },
  qaPreviewAppleTreePlacement(x, y) {
    if (!import.meta.env.DEV) return { ok: false, message: "Visual QA helpers are available only in development." };
    return activeTownScene()?.previewAppleTreePlacement?.(x, y) || { ok: false, message: "Willowmere town is not active." };
  },
  qaConfirmAppleTreePlacement() {
    if (!import.meta.env.DEV) return { ok: false, message: "Visual QA helpers are available only in development." };
    return farming.confirmAppleTreePlacement();
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
  getMunicipalCollectionDiagnostics() {
    return municipalCollection.getDiagnostics();
  },
  getRestorationMilestoneDiagnostics() {
    return { ...restorationMilestones.getDiagnostics(), interface: restorationMilestoneController.getDiagnostics() };
  },
  qaUnlockRestorationMilestone(id = "festival", { reveal = true } = {}) {
    if (!import.meta.env.DEV) return { ok: false, message: "Visual QA helpers are available only in development." };
    const result = restorationMilestones.unlockForQa(id, { revealed: !reveal });
    if (result.ok && reveal) setTimeout(() => restorationMilestoneController.maybeOpen(), 80);
    return result;
  },
  qaStartMunicipalCollection() {
    if (!import.meta.env.DEV) return { ok: false, message: "Visual QA helpers are available only in development." };
    return municipalCollection.start({ force: true, persist: true });
  },
  qaRunMunicipalCollection() {
    if (!import.meta.env.DEV) return { ok: false, message: "Visual QA helpers are available only in development." };
    return municipalCollection.runToCompletion();
  },
  getCustomResidentDiagnostics() {
    return customResidentController.getDiagnostics();
  },
  getFarmingDiagnostics() {
    return { ...farming.getDiagnostics(), interface: farmingController.getDiagnostics() };
  },
  getLivingEnvironmentDiagnostics() {
    return livingEnvironment.getDiagnostics();
  },
  getAnimalDiagnostics() {
    return { ...animals.getDiagnostics(), interface: animalFriendsController.getDiagnostics() };
  },
  getFishingDiagnostics() {
    return fishing.getDiagnostics();
  },
  getBakeryDiagnostics() {
    return bakery.getDiagnostics();
  },
  getCafeDiagnostics() {
    return cafe.getDiagnostics();
  },
  getMorningMugDiagnostics() {
    return morningMug.getDiagnostics();
  },
  getRiversideKitchenDiagnostics() {
    return riversideKitchen.getDiagnostics();
  },
  getSouthShoreScoopsDiagnostics() {
    return southShoreScoops.getDiagnostics();
  },
  getRiverDiagnostics() {
    return river.getDiagnostics();
  },
  getHouseRescueDiagnostics() {
    return houseRescue.getDiagnostics();
  },
};
