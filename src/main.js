import Phaser from "phaser";
import "./style.css";
import { BootScene } from "./scenes/BootScene.js";
import { TownScene } from "./scenes/TownScene.js";
import { SpriteAiLabelPlugin } from "./plugins/SpriteAiLabelPlugin.js";
import { installSpriteAiDomLabels, spriteAiInventory } from "./assets/spriteAiLabels.js";
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
import { AquariumService } from "./systems/AquariumService.js";
import { BakeryService } from "./systems/BakeryService.js";
import { CafeService } from "./systems/CafeService.js";
import { MorningMugService } from "./systems/MorningMugService.js";
import { RiversideKitchenService } from "./systems/RiversideKitchenService.js";
import { SouthShoreScoopsService } from "./systems/SouthShoreScoopsService.js";
import { RiverClearoutService } from "./systems/RiverClearoutService.js";
import { HouseRescueService } from "./systems/HouseRescueService.js";
import { HomeInteriorService } from "./systems/HomeInteriorService.js";
import { LawnCareService } from "./systems/LawnCareService.js";
import { BeachCleanupService } from "./systems/BeachCleanupService.js";
import { PlaygroundPowerwashService } from "./systems/PlaygroundPowerwashService.js";
import { TownPlacementService } from "./systems/TownPlacementService.js";
import { RestorationMilestoneService } from "./systems/RestorationMilestoneService.js";
import { HomeownerGiftService } from "./systems/HomeownerGiftService.js";
import { PawsWondersService } from "./systems/PawsWondersService.js";
import { HarbourGeneralService } from "./systems/HarbourGeneralService.js";
import { ImpactProjectService } from "./systems/ImpactProjectService.js";
import { NpcNarrativeService } from "./systems/NpcNarrativeService.js";
import { OnboardingService } from "./systems/OnboardingService.js";
import { CommerceService } from "./systems/CommerceService.js";
import { createDevelopmentBillingBridge, verifyDevelopmentReceipt } from "./systems/DevelopmentBillingBridge.js";
import { EconomyHudController } from "./ui/EconomyHudController.js";
import { SaveStatusController } from "./ui/SaveStatusController.js";
import { ShopController } from "./ui/ShopController.js";
import { WorldHudController } from "./ui/WorldHudController.js";
import { CustomResidentController } from "./ui/CustomResidentController.js";
import { FarmingController } from "./ui/FarmingController.js";
import { AnimalFriendsController } from "./ui/AnimalFriendsController.js";
import { RestorationMilestoneController } from "./ui/RestorationMilestoneController.js";
import { HomeownerGiftController } from "./ui/HomeownerGiftController.js";
import { ImpactController } from "./ui/ImpactController.js";
import { NpcNarrativeController } from "./ui/NpcNarrativeController.js";
import { OnboardingController } from "./ui/OnboardingController.js";
import { CommerceController } from "./ui/CommerceController.js";
import { ResponsiveShellController } from "./ui/ResponsiveShellController.js";
import { InteractionFeedbackController } from "./ui/InteractionFeedbackController.js";
import { ITEM_IDS } from "./data/items.js";
import { findSafeFurniturePlacement } from "./data/homeInteriors.js";
import { getParityCertification } from "./data/parityCertification.js";
import { getDifferentialParityCertification } from "./data/differentialParityAudit.js";
import { getReleaseCandidateCertification } from "./data/releaseCandidate.js";

installSpriteAiDomLabels(document, window);

const stateRuntime = bootstrapState(window.localStorage);
const worldSimulation = new WorldSimulationService(stateRuntime.gameState, stateRuntime.repository);
const farming = new FarmingService(stateRuntime.gameState, stateRuntime.repository);
const livingEnvironment = new LivingEnvironmentService(stateRuntime.gameState, stateRuntime.repository);
worldSimulation.addStateAdvancer((state) => farming.resolveInto(state));
worldSimulation.addStateAdvancer((state) => livingEnvironment.advanceInto(state));
const offlineResolution = worldSimulation.resolveOffline();
const harbourGeneral = new HarbourGeneralService(stateRuntime.gameState, stateRuntime.repository);
const npcTownLife = new NpcTownLifeService(stateRuntime.gameState, stateRuntime.repository, { harbourGeneral });
const npcNarratives = new NpcNarrativeService(stateRuntime.gameState, stateRuntime.repository, { npcTownLife });
const municipalCollection = new MunicipalCollectionService(stateRuntime.gameState, stateRuntime.repository);
const customResident = new CustomResidentService(stateRuntime.gameState, stateRuntime.repository);
const aquarium = new AquariumService(stateRuntime.gameState, stateRuntime.repository);
const homeInteriors = new HomeInteriorService(stateRuntime.gameState, stateRuntime.repository, { customResident, aquarium });
farming.refresh({ persist: true });
livingEnvironment.refresh({ persist: true });
const animals = new AnimalService(stateRuntime.gameState, stateRuntime.repository);
animals.refresh({ persist: true, offline: offlineResolution?.advancedGameMinutes > 0 });
const fishing = new FishingService(stateRuntime.gameState, stateRuntime.repository, { aquarium });
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
const homeownerGifts = new HomeownerGiftService(stateRuntime.gameState, stateRuntime.repository);
const pawsWonders = new PawsWondersService(stateRuntime.gameState, stateRuntime.repository);
const impactProjects = new ImpactProjectService();

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
  plugins: {
    scene: [{ key: "spriteAiLabels", plugin: SpriteAiLabelPlugin, mapping: "spriteAiLabels" }],
  },
  scene: [BootScene, TownScene],
};

const game = new Phaser.Game(config);
window.__KINDWORKS_PHASER_GAME__ = game;
const responsiveShell = new ResponsiveShellController(game, {
  worldSimulation,
  npcTownLife,
  municipalCollection,
}).start();
game.registry.set("responsiveShell", responsiveShell);
const interactionFeedback = new InteractionFeedbackController().start();
game.registry.set("interactionFeedback", interactionFeedback);
game.registry.set("spriteAiInventory", spriteAiInventory);
game.registry.set("gameState", stateRuntime.gameState);
game.registry.set("saveRepository", stateRuntime.repository);
game.registry.set("worldSimulation", worldSimulation);
game.registry.set("npcTownLife", npcTownLife);
game.registry.set("npcNarratives", npcNarratives);
game.registry.set("municipalCollection", municipalCollection);
game.registry.set("customResident", customResident);
game.registry.set("homeInteriors", homeInteriors);
game.registry.set("aquarium", aquarium);
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
game.registry.set("pawsWonders", pawsWonders);
game.registry.set("harbourGeneral", harbourGeneral);
game.registry.set("homeownerGifts", homeownerGifts);
game.registry.set("impactProjects", impactProjects);
const economy = new EconomyService(stateRuntime.gameState, stateRuntime.repository);
game.registry.set("economy", economy);
const qaMode = new URLSearchParams(window.location.search).get("qa");
const commerceQa = import.meta.env.DEV && ["commerce", "commerce-disabled"].includes(qaMode);
const readOnlyQa = import.meta.env.DEV && ["parity", "differential-parity", "release-candidate"].includes(qaMode);
const developmentCommerce = import.meta.env.DEV && qaMode === "commerce";
const billingBridge = developmentCommerce
  ? createDevelopmentBillingBridge(stateRuntime.gameState)
  : window.KindWorksBilling || null;
const commerce = new CommerceService(stateRuntime.gameState, stateRuntime.repository, {
  economy,
  billing: billingBridge,
  verifyReceipt: developmentCommerce ? verifyDevelopmentReceipt : undefined,
  environment: developmentCommerce ? "development-sandbox" : import.meta.env.PROD ? "production" : "development",
});
game.registry.set("commerce", commerce);
const onboarding = new OnboardingService(stateRuntime.gameState, stateRuntime.repository, {
  economy,
  requireTrustedTime: import.meta.env.PROD,
  trustedTimeProvider: typeof billingBridge?.getTrustedTimeReceipt === "function"
    ? () => billingBridge.getTrustedTimeReceipt()
    : null,
});
game.registry.set("onboarding", onboarding);
if (import.meta.env.DEV && qaMode === "parity") {
  const parityCertification = getParityCertification();
  document.body.dataset.parityQa = "true";
  document.body.dataset.parityCertified = String(parityCertification.ok);
  document.body.dataset.parityCampaignLevels = String(parityCertification.counts.campaignLevels);
  document.body.dataset.parityActivities = String(parityCertification.activities.length);
  document.body.dataset.paritySource = parityCertification.source.sha256;
}
if (import.meta.env.DEV && qaMode === "differential-parity") {
  const differentialParity = getDifferentialParityCertification();
  document.body.dataset.differentialParityQa = "true";
  document.body.dataset.differentialParityReady = String(differentialParity.ok);
  document.body.dataset.differentialParityActivities = String(differentialParity.scope.activities);
  document.body.dataset.differentialParitySharedDomains = String(differentialParity.scope.sharedDomains);
  document.body.dataset.differentialParityRuleProbes = String(differentialParity.scope.exactRuleProbes);
  document.body.dataset.differentialParitySource = differentialParity.source.sha256;
}
if (import.meta.env.DEV && qaMode === "release-candidate") {
  const releaseCandidate = getReleaseCandidateCertification();
  document.body.dataset.releaseCandidateQa = "true";
  document.body.dataset.releaseCandidateReady = String(releaseCandidate.ok);
  document.body.dataset.releaseCandidateJourneys = String(releaseCandidate.journeyCount);
  document.body.dataset.releaseCandidateCheckpoints = String(releaseCandidate.activityCheckpointCount);
  document.body.dataset.releaseCandidateSchema = String(releaseCandidate.schemaVersion);
  document.body.dataset.releaseCandidateSource = releaseCandidate.sourceSha256;
}
if (import.meta.env.DEV && new URLSearchParams(window.location.search).get("qa") === "paws") {
  restorationMilestones.unlockForQa("highstreet", { revealed: true });
  const balance = stateRuntime.gameState.getSnapshot().economy.coins;
  if (balance < 10_000) economy.credit(10_000 - balance, { kind: "development-fixture", reason: "Milestone 36 Paws & Wonders visual QA" });
}
if (import.meta.env.DEV && new URLSearchParams(window.location.search).get("qa") === "harbour-general") {
  const state = stateRuntime.gameState.getSnapshot();
  if (state.economy.coins < 20_000) economy.credit(20_000 - state.economy.coins, { kind: "development-fixture", reason: "Milestone 37 Harbour General visual QA" });
}
if (import.meta.env.DEV && new URLSearchParams(window.location.search).get("qa") === "impact") restorationMilestones.unlockForQa("station", { revealed: true });
if (import.meta.env.DEV && new URLSearchParams(window.location.search).get("qa") === "aquarium") {
  if (!customResident.getSnapshot().created) {
    customResident.saveProfile({
      name: "Meadow", skin: "warm", hair: 1, hairColor: "dark-brown", accessory: "badge", outfit: 1, bodyBuild: "average",
      hobbies: ["gardening", "nature", "helping"], home: { wallColor: "sage", roofStyle: "gable", roofColor: "terracotta" },
    });
  }
  let state = stateRuntime.gameState.getSnapshot();
  if (!state.homeInteriors.placements.some((placement) => placement.itemId === "ornamental-fish-tank")) {
    if (!state.inventory.furniture["ornamental-fish-tank"]) economy.grantItem("ornamental-fish-tank", 1, { reason: "Milestone 33 aquarium visual QA" });
    state = stateRuntime.gameState.getSnapshot();
    const safe = findSafeFurniturePlacement(state, { id: "aquarium-preview", itemId: "ornamental-fish-tank", rx: 0.76, ry: 0.72, rotation: 0 });
    if (safe && homeInteriors.beginPlacement("ornamental-fish-tank").ok) {
      homeInteriors.preview(safe.rx, safe.ry);
      homeInteriors.confirmPlacement();
    }
  }
  if (aquarium.getSnapshot().placed) aquarium.stockForQa();
}
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
if (import.meta.env.DEV && new URLSearchParams(window.location.search).get("qa") === "homeowner-gift" && !homeownerGifts.getNext()) homeownerGifts.queueForQa();
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
if (import.meta.env.DEV && new URLSearchParams(window.location.search).get("qa") === "interior") {
  if (!customResident.getSnapshot().created) {
    customResident.saveProfile({
      name: "Meadow", skin: "warm", hair: 1, hairColor: "dark-brown", accessory: "badge", outfit: 1, bodyBuild: "average",
      hobbies: ["gardening", "reading", "helping"], home: { wallColor: "sage", roofStyle: "gable", roofColor: "terracotta" },
    });
  }
  for (const itemId of ["cosy-sofa", "reading-armchair", "woven-home-rug", "leafy-house-plant", "ornamental-fish-tank"]) {
    const state = stateRuntime.gameState.getSnapshot();
    const ownedOrPlaced = Number(state.inventory.furniture[itemId] || 0) + state.homeInteriors.placements.filter((placement) => placement.itemId === itemId).length;
    if (!ownedOrPlaced) economy?.grantItem?.(itemId, 1, { reason: "Milestone 32 home-interior visual QA" });
  }
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
const homeownerGiftController = new HomeownerGiftController(homeownerGifts, {
  onModalChange(open) {
    setModalOpen("homeowner-gift", open);
  },
  canOpen() {
    return Boolean(activeTownScene()) && document.body.dataset.modalOpen !== "true";
  },
  onUseItem(item) {
    if (item?.category === "equipment") return economy.equip(item.id, { reason: `Equipped neighbour gift: ${item.name}` });
    if (item?.category === "furniture") return activeTownScene()?.enterHouseInterior?.("house-20", { focusFurnitureId: item.id }) || { ok: false, message: "Return to Willowmere town to furnish your home." };
    return activeTownScene()?.beginTownPlacement?.(item?.id) || { ok: false, message: "Return to Willowmere town to place this item." };
  },
});
game.registry.set("homeownerGiftController", homeownerGiftController);
const impactController = new ImpactController(impactProjects, {
  onModalChange(open) {
    setModalOpen("impact", open);
  },
});
game.registry.set("impactController", impactController);
const npcNarrativeController = new NpcNarrativeController(npcNarratives, {
  onModalChange(open) {
    setModalOpen("npc-stories", open);
  },
});
game.registry.set("npcNarrativeController", npcNarrativeController);
if (import.meta.env.DEV && new URLSearchParams(window.location.search).get("qa") === "narrative") setTimeout(() => npcNarrativeController.open("npc-01"), 420);
setTimeout(() => homeownerGiftController.maybeOpen(), 520);
const saveStatus = new SaveStatusController(stateRuntime, {
  onModalChange(open) {
    setModalOpen("save", open);
  },
});
const economyHud = new EconomyHudController(stateRuntime, {
  economy,
  aquarium,
  onModalChange(open) {
    setModalOpen("economy", open);
  },
  onUseConsumable(item) {
    if (item?.shopGroup === "Farming") return game.registry.get("farmingController")?.open?.("allotment") || { ok: false };
    return game.registry.get("animalFriendsController")?.open?.() || { ok: false };
  },
  onPlaceable(item) {
    if (item?.category === "furniture") return activeTownScene()?.enterHouseInterior?.("house-20", { focusFurnitureId: item.id }) || { ok: false, message: "Return to Willowmere town to furnish your home." };
    return activeTownScene()?.beginTownPlacement?.(item?.id) || { ok: false, message: "Return to Willowmere town to place this item." };
  },
});
const commerceController = new CommerceController(commerce);
game.registry.set("commerceController", commerceController);
if (commerceQa) setTimeout(() => economyHud.open("commerce"), 420);
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
  onSaved() {
    onboardingController.notifyResidentSaved();
  },
});
game.registry.set("customResidentController", customResidentController);
const onboardingController = new OnboardingController(onboarding, {
  onModalChange(open) {
    setModalOpen("onboarding", open);
  },
  canOpen() {
    return Boolean(activeTownScene()) && document.body.dataset.modalOpen !== "true";
  },
  onCreateResident() {
    return customResidentController.open();
  },
  onFindJob(gameKey) {
    return activeTownScene()?.focusOnboardingJob?.(gameKey) || { ok: false, message: "Return to town to find this job." };
  },
});
game.registry.set("onboardingController", onboardingController);
if (!commerceQa && !readOnlyQa) setTimeout(() => onboardingController.startFirstRun(), 260);
if (!readOnlyQa) onboardingController.processLogin();

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
  responsiveShell.update();
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
  getParityCertification,
  getDifferentialParityCertification,
  getReleaseCandidateCertification,
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
  getCommerceDiagnostics() {
    return commerce.getDiagnostics();
  },
  getCommerceState() {
    return commerce.getSnapshot();
  },
  getOnboardingDiagnostics() {
    return onboardingController.getDiagnostics();
  },
  getOnboardingState() {
    return onboarding.getSnapshot();
  },
  getShopDiagnostics() {
    return shopController.getDiagnostics();
  },
  getPawsWondersDiagnostics() {
    return pawsWonders.getDiagnostics();
  },
  getPawsWondersState() {
    return pawsWonders.getCatalogue();
  },
  getHarbourGeneralDiagnostics() {
    return harbourGeneral.getDiagnostics();
  },
  getImpactDiagnostics() {
    return { ...impactProjects.getDiagnostics(), interface: impactController.getDiagnostics() };
  },
  getImpactState(category = "all") {
    return impactProjects.getSnapshot(category);
  },
  openImpact() {
    return impactController.open({ mode: "impact" });
  },
  qaOpenCinema() {
    if (!import.meta.env.DEV) return { ok: false, message: "Visual QA helpers are available only in development." };
    return activeTownScene()?.openCinema?.() || { ok: false, message: "Willowmere town is not active." };
  },
  getHarbourGeneralState() {
    return harbourGeneral.getCatalogue();
  },
  qaPurchaseHarbourGeneral() {
    if (!import.meta.env.DEV) return { ok: false, message: "Visual QA helpers are available only in development." };
    return harbourGeneral.purchaseDeed();
  },
  qaHarbourNpcPurchase(npcId = "npc-01") {
    if (!import.meta.env.DEV) return { ok: false, message: "Visual QA helpers are available only in development." };
    const state = stateRuntime.gameState.getSnapshot();
    const resident = state.npcs.residents.find((entry) => entry.id === npcId) || state.npcs.residents[0];
    resident.name = npcTownLife.getResidents().find((entry) => entry.id === resident.id)?.name || resident.id;
    const result = harbourGeneral.resolveNpcPurchaseInto(state, resident, { random: () => 0 });
    delete resident.name;
    if (!result.ok) return result;
    state.updatedAt = new Date().toISOString();
    const replaced = stateRuntime.gameState.replace(state);
    if (!replaced.ok) return replaced;
    const saved = stateRuntime.repository.save(state);
    return saved.ok ? result : saved;
  },
  qaAdoptPawsCompanion(itemId = "pet-labrador") {
    if (!import.meta.env.DEV) return { ok: false, message: "Visual QA helpers are available only in development." };
    return pawsWonders.adopt(itemId);
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
    return { ...npcTownLife.getDiagnostics(), narratives: npcNarratives.getDiagnostics(), storyInterface: npcNarrativeController.getDiagnostics() };
  },
  getNpcStory(id = "npc-01") {
    return npcNarratives.getStory(id);
  },
  getNpcNarrativeDiagnostics() {
    return { ...npcNarratives.getDiagnostics(), interface: npcNarrativeController.getDiagnostics() };
  },
  openNpcStory(id = "npc-01") {
    return npcNarrativeController.open(id);
  },
  qaSelectNpcThought(id = "npc-01") {
    if (!import.meta.env.DEV) return { ok: false, message: "Visual QA helpers are available only in development." };
    return npcNarratives.selectThought(id, { source: "qa" });
  },
  getMunicipalCollectionDiagnostics() {
    return municipalCollection.getDiagnostics();
  },
  getRestorationMilestoneDiagnostics() {
    return { ...restorationMilestones.getDiagnostics(), interface: restorationMilestoneController.getDiagnostics() };
  },
  getHomeownerGiftState() {
    return homeownerGifts.getSnapshot();
  },
  getHomeownerGiftDiagnostics() {
    return { ...homeownerGifts.getDiagnostics(), interface: homeownerGiftController.getDiagnostics() };
  },
  qaQueueHomeownerGift(options = {}) {
    if (!import.meta.env.DEV) return { ok: false, message: "Visual QA helpers are available only in development." };
    const result = homeownerGifts.queueForQa(options);
    if (result.ok) setTimeout(() => homeownerGiftController.maybeOpen(), 80);
    return result;
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
  getAquariumState() {
    return aquarium.getSnapshot();
  },
  getAquariumDiagnostics() {
    return aquarium.getDiagnostics();
  },
  qaStockAquarium(counts) {
    if (!import.meta.env.DEV) return { ok: false, message: "Visual QA helpers are available only in development." };
    return aquarium.stockForQa(counts);
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
  getHomeInteriorDiagnostics() {
    return homeInteriors.getDiagnostics();
  },
  qaEnterHomeInterior(houseId = "house-20") {
    if (!import.meta.env.DEV) return { ok: false, message: "Visual QA helpers are available only in development." };
    return activeTownScene()?.enterHouseInterior?.(houseId) || { ok: false, message: "Willowmere town is not active." };
  },
  qaGrantHomeFurniture(itemId = "cosy-sofa") {
    if (!import.meta.env.DEV) return { ok: false, message: "Visual QA helpers are available only in development." };
    return economy.grantItem(itemId, 1, { reason: "Milestone 32 home-interior visual QA" });
  },
};
