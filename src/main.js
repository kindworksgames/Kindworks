import Phaser from "phaser";
import { installTestMetricsBridge } from "./qa/TestMetricsBridge.js";
import { renderFrameTarget } from "./visual/ResponsiveFramePolicy.js";
import "./style.css";
import "./shop-reference.css";
import { BootScene } from "./scenes/BootScene.js";
import { TownScene } from "./scenes/TownScene.js";
import { SpriteAiLabelPlugin } from "./plugins/SpriteAiLabelPlugin.js";
import { SceneLayoutPlugin } from "./plugins/SceneLayoutPlugin.js";
import { applyLayoutSurfaces } from "./visual/layouts/SceneLayoutRuntime.js";
import { GLOBAL_UI_LAYOUT, SCENE_LAYOUT_CATALOGUE_DIGEST, SCENE_LAYOUT_PRODUCTION_SIGNATURE } from "./visual/layouts/sceneLayoutCatalog.js";
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
import { PersistentActivityRecoveryService } from "./systems/PersistentActivityRecoveryService.js";
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
import { SharedOverlayController } from "./ui/SharedOverlayController.js";
import { TownMenuController } from "./ui/TownMenuController.js";
import { ensureLazyScene } from "./scenes/lazyScenes.js";
import { ITEM_IDS } from "./data/items.js";
import { PAWS_WONDERS } from "./data/pawsWonders.js";
import { findSafeFurniturePlacement } from "./data/homeInteriors.js";
import { getParityCertification } from "./data/parityCertification.js";
import { getDifferentialParityCertification } from "./data/differentialParityAudit.js";
import { getReleaseCandidateCertification } from "./data/releaseCandidate.js";
import { createFidelityStorage, getFidelityContract } from "./qa/fidelityContract.js";
import { FidelityQaHarness } from "./qa/FidelityQaHarness.js";
import {
  VISUAL_REGRESSION_FIXED_NOW,
  getVisualRegressionScenario,
  seedVisualRegressionStorage,
} from "./qa/visualRegressionFixtures.js";
import {
  VISUAL_COMPARISON_SEED,
  createSeededRandom,
  resolveVisualCaptureCase,
} from "./qa/visualComparisonContracts.js";
import { createVisualRegistry } from "./visual/VisualRegistry.js";

if (import.meta.env.DEV) installSpriteAiDomLabels(document, window);

const qaMode = new URLSearchParams(window.location.search).get("qa");
const visualRegressionQa = import.meta.env.DEV && qaMode === "visual-regression";
const referenceOverlayQa = import.meta.env.DEV && qaMode === "reference-overlay";
const scaleCalibrationQa = import.meta.env.DEV && qaMode === "scale-calibration";
const assetLabQa = import.meta.env.DEV && qaMode === "asset-lab";
const sceneVisualQa = import.meta.env.DEV && qaMode === "scene-visual";
const candidatePreviewQa = import.meta.env.DEV && qaMode === "candidate-preview";
const geometryQa = import.meta.env.DEV && qaMode === "geometry";
const fidelityQa = import.meta.env.DEV && (["fidelity", "animal-fidelity", "visual-regression", "reference-overlay", "scale-calibration", "asset-lab", "scene-visual", "candidate-preview"].includes(qaMode) || geometryQa);
if (visualRegressionQa) Math.random = createSeededRandom(VISUAL_COMPARISON_SEED);
const runtimeStorage = fidelityQa ? createFidelityStorage(window.localStorage) : window.localStorage;
if (visualRegressionQa) seedVisualRegressionStorage(runtimeStorage);
const stateRuntime = bootstrapState(runtimeStorage);
const visualRegressionClock = visualRegressionQa ? () => VISUAL_REGRESSION_FIXED_NOW : null;
const worldSimulation = new WorldSimulationService(
  stateRuntime.gameState,
  stateRuntime.repository,
  visualRegressionClock ? { now: visualRegressionClock } : undefined,
);
const customResident = new CustomResidentService(stateRuntime.gameState, stateRuntime.repository);
const farming = new FarmingService(stateRuntime.gameState, stateRuntime.repository);
const livingEnvironment = new LivingEnvironmentService(stateRuntime.gameState, stateRuntime.repository);
worldSimulation.addStateAdvancer((state) => farming.resolveInto(state));
worldSimulation.addStateAdvancer((state) => livingEnvironment.advanceInto(state));
worldSimulation.addStateAdvancer((state, before, result) => customResident.advanceInto(state, before, result));
const offlineResolution = worldSimulation.resolveOffline();
const harbourGeneral = new HarbourGeneralService(stateRuntime.gameState, stateRuntime.repository);
const npcTownLife = new NpcTownLifeService(stateRuntime.gameState, stateRuntime.repository, {
  harbourGeneral,
  ...(visualRegressionClock ? { now: visualRegressionClock } : {}),
});
const npcNarratives = new NpcNarrativeService(stateRuntime.gameState, stateRuntime.repository, { npcTownLife });
const municipalCollection = new MunicipalCollectionService(
  stateRuntime.gameState,
  stateRuntime.repository,
  visualRegressionClock ? { now: visualRegressionClock } : undefined,
);
if (visualRegressionQa || scaleCalibrationQa || assetLabQa) {
  const pauseReason = assetLabQa ? "asset-lab" : scaleCalibrationQa ? "scale-calibration" : "visual-regression";
  worldSimulation.setPaused(pauseReason, true);
  npcTownLife.setPaused(pauseReason, true);
  municipalCollection.setPaused(pauseReason, true);
}
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
  fps: {
    target: renderFrameTarget(),
    forceSetTimeOut: false,
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  plugins: {
    scene: [
      { key: "spriteAiLabels", plugin: SpriteAiLabelPlugin, mapping: "spriteAiLabels" },
      { key: "sceneLayouts", plugin: SceneLayoutPlugin, mapping: "sceneLayouts" },
    ],
  },
  scene: [BootScene, TownScene],
};

const game = new Phaser.Game(config);
if (import.meta.env.VITE_KW_TEST_METRICS === "1") installTestMetricsBridge(game, window);
if (geometryQa) {
  import("./visual/dev/GameplayGeometryDebugOverlay.js").then(({ installGameplayGeometryDebug }) => {
    game.registry.set("gameplayGeometryDebug", installGameplayGeometryDebug(game));
  });
}
applyLayoutSurfaces(GLOBAL_UI_LAYOUT);
document.body.dataset.sceneLayoutCatalogueDigest = SCENE_LAYOUT_CATALOGUE_DIGEST;
document.body.dataset.sceneLayoutProductionSignature = SCENE_LAYOUT_PRODUCTION_SIGNATURE;
if (import.meta.env.DEV) window.__KINDWORKS_PHASER_GAME__ = game;
const visualRegistry = createVisualRegistry({
  environment: import.meta.env.PROD ? "production" : "development",
  baseUrl: import.meta.env.BASE_URL,
});
game.registry.set("visualRegistry", visualRegistry);
const responsiveShell = new ResponsiveShellController(game, {
  worldSimulation,
  npcTownLife,
  municipalCollection,
}).start();
game.registry.set("responsiveShell", responsiveShell);
const interactionFeedback = new InteractionFeedbackController().start();
game.registry.set("interactionFeedback", interactionFeedback);
const sharedOverlay = new SharedOverlayController().start();
game.registry.set("sharedOverlay", sharedOverlay);
if (import.meta.env.DEV) game.registry.set("spriteAiInventory", spriteAiInventory);
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
const activityRecovery = new PersistentActivityRecoveryService(game.registry);
game.registry.set("activityRecovery", activityRecovery);
const economy = new EconomyService(stateRuntime.gameState, stateRuntime.repository);
game.registry.set("economy", economy);
const commerceQa = import.meta.env.DEV && ["commerce", "commerce-disabled"].includes(qaMode);
const readOnlyQa = import.meta.env.DEV && (
  ["parity", "differential-parity", "release-candidate", "fidelity", "animal-fidelity", "visual-regression", "reference-overlay", "scale-calibration"].includes(qaMode)
  || ["asset-lab", "scene-visual"].includes(qaMode)
  || geometryQa
);
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
if (fidelityQa) {
  const fidelityContract = getFidelityContract();
  document.body.dataset.fidelityQa = "true";
  document.body.dataset.fidelityContract = String(fidelityContract.version);
  document.body.dataset.fidelityActivities = String(fidelityContract.activities.length);
  document.body.dataset.fidelityViewports = String(fidelityContract.viewports.length);
  document.body.dataset.fidelitySource = fidelityContract.source.sha256;
  document.body.dataset.fidelityStorageIsolated = "true";
}
if (import.meta.env.DEV && ["paws", "stage7-paws"].includes(new URLSearchParams(window.location.search).get("qa"))) {
  restorationMilestones.unlockForQa("highstreet", { revealed: true });
  const balance = stateRuntime.gameState.getSnapshot().economy.coins;
  if (balance < 10_000) economy.credit(10_000 - balance, { kind: "development-fixture", reason: "Milestone 36 Paws & Wonders visual QA" });
}
if (import.meta.env.DEV && new URLSearchParams(window.location.search).get("qa") === "stage7-paws") {
  const openStage7Paws = async () => {
    const activeScene = game.scene.getScenes(true).at(-1) || game.scene.getScenes(true)[0];
    if (!activeScene || activeScene.scene.key === "BootScene") return;
    await ensureLazyScene(activeScene, "PawsWondersScene");
    if (activeScene.scene.key !== "PawsWondersScene") game.scene.stop(activeScene.scene.key);
    game.scene.start("PawsWondersScene", { focusItemId: "pet-labrador", returnPosition: PAWS_WONDERS.approach, returnFacing: "down" });
  };
  setTimeout(() => openStage7Paws(), 1600);
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
const townMenuController = new TownMenuController({
  onModalChange(open) {
    setModalOpen("town-menu", open);
  },
  canOpen() {
    return Boolean(activeTownScene()) && document.body.dataset.modalOpen !== "true";
  },
});
game.registry.set("townMenuController", townMenuController);
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
  onConversation(result) {
    if (result?.ok) onboarding.recordJourneyStep("metResident");
  },
});
game.registry.set("npcNarrativeController", npcNarrativeController);
if (import.meta.env.DEV && new URLSearchParams(window.location.search).get("qa") === "narrative") setTimeout(() => npcNarrativeController.open("npc-01"), 420);
setTimeout(() => homeownerGiftController.maybeOpen(), 520);
const saveStatus = new SaveStatusController(stateRuntime, {
  onModalChange(open) {
    setModalOpen("save", open);
  },
  onNewGame() {
    window.location.reload();
  },
});
const economyHud = new EconomyHudController(stateRuntime, {
  economy,
  aquarium,
  onModalChange(open) {
    setModalOpen("economy", open);
  },
  onUseConsumable(item) {
    if (item?.farmingKind === "sapling") return activeTownScene()?.beginAppleTreePlacement?.() || { ok: false, message: "Return to Willowmere town to plant this sapling." };
    if (item?.shopGroup === "Farming") return game.registry.get("farmingController")?.open?.("allotment") || { ok: false };
    return game.registry.get("animalFriendsController")?.open?.() || { ok: false };
  },
  onPlaceable(item) {
    if (item?.category === "furniture") return activeTownScene()?.enterHouseInterior?.("house-20", { focusFurnitureId: item.id }) || { ok: false, message: "Return to Willowmere town to furnish your home." };
    return activeTownScene()?.beginTownPlacement?.(item?.id) || { ok: false, message: "Return to Willowmere town to place this item." };
  },
});

const fidelityHarness = fidelityQa && !assetLabQa && !sceneVisualQa ? new FidelityQaHarness({
  game,
  gameState: stateRuntime.gameState,
  repository: stateRuntime.repository,
  storage: runtimeStorage,
  fishing,
}) : null;
if (fidelityHarness) {
  game.registry.set("fidelityHarness", fidelityHarness);
  if (referenceOverlayQa) {
    document.body.dataset.referenceOverlayReady = "loading";
    setTimeout(async () => {
      const result = await fidelityHarness.openActivity("fishing", 1);
      if (!result?.ok) document.body.dataset.referenceOverlayReady = "failed";
    }, 900);
  } else if (!visualRegressionQa && !scaleCalibrationQa) fidelityHarness.mountPanel();
  else if (visualRegressionQa) {
    const captureParams = new URLSearchParams(window.location.search);
    const requestedScenario = captureParams.get("scenario") || "town";
    const captureCase = resolveVisualCaptureCase({
      id: captureParams.get("capture"),
      scenario: requestedScenario,
      width: window.innerWidth,
      height: window.innerHeight,
    });
    const scenario = getVisualRegressionScenario(captureCase?.scenario || requestedScenario);
    document.body.dataset.visualRegressionQa = "true";
    document.body.dataset.visualRegressionScenario = scenario?.id || "unknown";
    document.body.dataset.visualRegressionReady = "preparing";
    if (!captureCase) {
      document.body.dataset.visualRegressionReady = "failed";
      document.body.dataset.visualCaptureStatus = "failed";
      document.body.dataset.visualCaptureDetails = JSON.stringify({
        ok: false,
        code: "unknown-capture-contract",
        message: `No approved capture contract matches scenario ${requestedScenario} at ${window.innerWidth}x${window.innerHeight}.`,
      });
    } else import("./qa/VisualCaptureRuntime.js")
      .then(({ prepareVisualCapture }) => prepareVisualCapture({
        game,
        captureId: captureCase.id,
        openActivity: (activityId, level) => fidelityHarness.openActivity(activityId, level),
      }))
      .catch((error) => {
        console.error("Visual capture preparation failed.", error);
        document.body.dataset.visualRegressionReady = "failed";
        document.body.dataset.visualCaptureStatus = "failed";
        document.body.dataset.visualCaptureDetails = JSON.stringify({ ok: false, code: "capture-runtime-error", message: error.message });
      });
  }
}
if (scaleCalibrationQa) {
  document.body.dataset.scaleCalibrationReady = "loading";
  setTimeout(async () => {
    try {
      const { ScaleCalibrationScene } = await import("./scenes/ScaleCalibrationScene.js");
      if (!game.scene.keys.ScaleCalibrationScene) game.scene.add("ScaleCalibrationScene", ScaleCalibrationScene, false);
      for (const activeScene of game.scene.getScenes(true)) game.scene.stop(activeScene.scene.key);
      game.scene.start("ScaleCalibrationScene");
    } catch (error) {
      console.error("Scale calibration scene failed to start.", error);
      document.body.dataset.scaleCalibrationReady = "failed";
    }
  }, 900);
}
if (assetLabQa) {
  document.body.dataset.assetLabReady = "loading";
  setTimeout(async () => {
    try {
      const [{ AssetLabScene }, { createPhase8AAssetLabManifest }] = await Promise.all([
        import("./visual/dev/AssetLabScene.js"),
        import("./visual/dev/phase8aAssetLabManifest.js"),
      ]);
      game.registry.set("visualRegistry", createVisualRegistry({
        manifest: createPhase8AAssetLabManifest(visualRegistry.manifest),
        environment: "development",
        baseUrl: import.meta.env.BASE_URL,
      }));
      if (!game.scene.keys.AssetLabScene) game.scene.add("AssetLabScene", AssetLabScene, false);
      for (const activeScene of game.scene.getScenes(true)) game.scene.stop(activeScene.scene.key);
      game.scene.start("AssetLabScene");
    } catch (error) {
      console.error("Asset Lab failed to start.", error);
      document.body.dataset.assetLabReady = "failed";
    }
  }, 900);
}
if (sceneVisualQa) {
  document.body.dataset.sceneQaReady = "loading";
  setTimeout(async () => {
    try {
      const { SceneQaOverlayController } = await import("./visual/dev/SceneQaOverlayController.js");
      const sceneQaOverlay = new SceneQaOverlayController(game, visualRegistry);
      game.registry.set("sceneQaOverlay", sceneQaOverlay);
    } catch (error) {
      console.error("Scene visual QA overlay failed to start.", error);
      document.body.dataset.sceneQaReady = "failed";
    }
  }, 900);
}
if (candidatePreviewQa) {
  document.body.dataset.candidatePreviewReady = "loading";
  setTimeout(async () => {
    try {
      const semanticId = new URLSearchParams(window.location.search).get("asset");
      const [{ Phase8BCandidatePreviewController }, { SceneQaOverlayController }, { PHASE_8A_VERTICAL_SLICE_PACKAGE }] = await Promise.all([
        import("./visual/dev/Phase8BCandidatePreviewController.js"),
        import("./visual/dev/SceneQaOverlayController.js"),
        import("./visual/verticalSlice/phase8aVerticalSlicePackage.js"),
      ]);
      const contract = PHASE_8A_VERTICAL_SLICE_PACKAGE.assets.find((asset) => asset.semanticId === semanticId);
      if (!contract) throw new Error(`Unknown candidate contract: ${semanticId}`);
      if (contract.intendedScenes.includes("LawnCareScene")) await fidelityHarness.openActivity("lawn", 1);
      else if (contract.intendedScenes.includes("TownScene") && !game.scene.isActive("TownScene")) {
        for (const activeScene of game.scene.getScenes(true)) game.scene.stop(activeScene.scene.key);
        game.scene.start("TownScene");
        await new Promise((resolve) => setTimeout(resolve, 350));
      }
      const controller = new Phase8BCandidatePreviewController(game, semanticId);
      await controller.mount();
      const sceneQaOverlay = new SceneQaOverlayController(game, visualRegistry);
      game.registry.set("phase8bCandidatePreview", controller);
      game.registry.set("sceneQaOverlay", sceneQaOverlay);
    } catch (error) {
      const candidateUnavailable = error?.message?.startsWith("No prepared Phase 8B candidate for ");
      if (candidateUnavailable) console.info("Candidate preview is unavailable until the selected asset is prepared.");
      else console.error("Candidate preview failed to start.", error);
      document.body.dataset.candidatePreviewReady = candidateUnavailable ? "unavailable" : "failed";
      document.body.dataset.candidatePreviewError = error.message;
    }
  }, 1100);
}
const commerceController = new CommerceController(commerce);
game.registry.set("commerceController", commerceController);
if (commerceQa) setTimeout(() => economyHud.open("commerce"), 420);
const worldHud = new WorldHudController(stateRuntime.gameState);
const shopController = new ShopController(shopService, stateRuntime, {
  onModalChange(open) {
    setModalOpen("shop", open);
  },
  onPlaceItem(item) {
    if (item?.farmingKind === "sapling") return activeTownScene()?.beginAppleTreePlacement?.() || { ok: false, message: "Return to Willowmere town to plant this sapling." };
    if (item?.category === "furniture") return activeTownScene()?.enterHouseInterior?.("house-20", { focusFurnitureId: item.id }) || { ok: false, message: "Return to Willowmere town to furnish your home." };
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
  visualRegistry,
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
  onSaveOnboardingDraft(step, draft) {
    return onboarding.saveCreatorDraft(step, draft);
  },
  onReturnToTownName() {
    return onboardingController.openTownNameEditor();
  },
  onSaved() {
    return onboardingController.notifyResidentSaved();
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
  onCreateResident(options) {
    return customResidentController.open(options);
  },
  onFindJob(gameKey) {
    return activeTownScene()?.startOnboardingJob?.(gameKey) || { ok: false, message: "Return to town to start this job." };
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
    houseRescue.refreshJobs();
  }
}
document.addEventListener("visibilitychange", handleVisibilityChange);
window.addEventListener("pagehide", () => {
  responsiveShell.update();
  customResidentController.persistOnboardingDraft();
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

if (import.meta.env.DEV) window.__KINDWORKS_PHASER__ = {
  game,
  getParityCertification,
  getDifferentialParityCertification,
  getReleaseCandidateCertification,
  getFidelityContract,
  getFidelitySnapshot(label = "checkpoint") {
    return fidelityHarness?.capture(label) || { ok: false, code: "fidelity-qa-disabled" };
  },
  qaOpenFidelityActivity(activityId, level = 1) {
    if (!fidelityHarness) return { ok: false, code: "fidelity-qa-disabled", message: "Open the development build with ?qa=fidelity." };
    return fidelityHarness.openActivity(activityId, level);
  },
  qaBeginFidelityReplay(name, metadata = {}) {
    return fidelityHarness?.beginReplay(name, metadata) || { ok: false, code: "fidelity-qa-disabled" };
  },
  qaRecordFidelityAction(type, payload = {}) {
    return fidelityHarness?.recordAction(type, payload) || { ok: false, code: "fidelity-qa-disabled" };
  },
  qaExportFidelityReplay() {
    return fidelityHarness?.exportReplay() || null;
  },
  qaResetFidelitySandbox() {
    return fidelityHarness?.resetSandbox() || { ok: false, code: "fidelity-qa-disabled" };
  },
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
