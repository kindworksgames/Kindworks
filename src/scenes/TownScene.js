import Phaser from "phaser";
import {
  BEACH_CLEANUP,
  BRIDGES,
  COLLISION_RECTS,
  COLORS,
  CORNER_CAFE,
  DISTRICTS,
  HOUSES,
  LANDMARKS,
  KINDWORKS_CINEMA,
  LITTLE_BAKERY,
  MORNING_MUG,
  PATHS,
  PLAYGROUND_POWERWASH,
  PLAYER_START,
  RIVERSIDE_KITCHEN,
  SOUTH_SHORE_SCOOPS,
  RIVER_CLEAROUT,
  RIVER_PATH,
  ROADS,
  SHOPS,
  WORLD,
} from "../data/town.js";
import { PlayerCharacter } from "../entities/PlayerCharacter.js";
import { COMMONS_RUBBISH_JOB } from "../data/cleanupJobs.js";
import { FRESH_MARKET, VILLAGE_GROCER } from "../data/shops.js";
import { PAWS_WONDERS } from "../data/pawsWonders.js";
import { HARBOUR_GENERAL } from "../data/harbourGeneral.js";
import { InteractionSystem } from "../systems/InteractionSystem.js";
import { MovementController } from "../systems/MovementController.js";
import { TownCameraController } from "../systems/TownCameraController.js";
import { NpcCharacter } from "../entities/NpcCharacter.js";
import { AnimalCharacter } from "../entities/AnimalCharacter.js";
import {
  PERSONAL_HOME_LEVELS,
  PERSONAL_HOME_RENDER_HOUSE_ID,
  PERSONAL_HOME_OPTIONS,
} from "../data/customResident.js";
import {
  ALLOTMENT_CONFIG,
  FARMING_CROPS,
  LAWN_PLOTS,
  ORCHARD_CONFIG,
  lawnNeedsCare,
} from "../data/farming.js";
import { ANIMAL_DEFINITIONS, SOUTH_MEADOW } from "../data/animals.js";
import { FISHING_SPOTS, MAGNET_FISHING_SPOT } from "../data/fishing.js";
import { ITEM_CATALOG, placeableFootprintFor } from "../data/items.js";
import { createTownPlacedObject } from "../entities/TownPlacedObject.js";
import { createMunicipalCollectionVehicle } from "../entities/MunicipalCollectionVehicle.js";
import { RESTORATION_MILESTONE_ORDER } from "../data/restorationMilestones.js";
import { cinemaAccess } from "../data/impactProjects.js";
import { RUBBISH_PRESENTATION, riverItemPosition } from "../data/livingEnvironment.js";
import {
  CROP_STAGE_VISUALS,
  ORCHARD_STAGE_VISUALS,
  PERSONAL_HOME_ARCHITECTURE_KITS,
  SHOP_VISUAL_STATES,
  houseArchitectureKit,
} from "../data/legacyVisualStates.js";
import { houseExteriorDirtStage } from "../data/houseRescue.js";
import { setSpriteAiLabelHint } from "../plugins/SpriteAiLabelPlugin.js";
import { startLazyScene } from "./lazyScenes.js";

const PLAYER_RADIUS = 17;
const WALK_SPEED = 270;
const SPRINT_SPEED = 390;
const MIN_ZOOM = 0.28;
const MAX_ZOOM = 1.3;

const SHOP_INTERACTION_IDS = Object.freeze({
  "Corner Café": "corner-cafe-door",
  "Village Grocer": "village-grocer-door",
  "Little Bakery": "little-bakery-door",
  "Riverside Kitchen": "riverside-kitchen-door",
  "Morning Mug Coffee": "morning-mug-door",
  "Harbour General": "harbour-general-door",
  "Fresh Market": "fresh-market-door",
  "Paws & Wonders": "paws-wonders-door",
  "South Shore Café": "south-shore-scoops-door",
  "KindWorks Cinema": "kindworks-cinema-door",
});

function points(values) {
  return values.map(([x, y]) => ({ x, y }));
}

function containsWithRadius(rect, x, y, radius = PLAYER_RADIUS) {
  return (
    x + radius > rect.x &&
    x - radius < rect.x + rect.width &&
    y + radius > rect.y &&
    y - radius < rect.y + rect.height
  );
}

function deterministicUnit(text, index = 0) {
  let hash = 2166136261;
  for (const character of `${text}:${index}`) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967296;
}

function lawnVisualStage(height) {
  return height < 20 ? 0 : height < 45 ? 1 : height < 70 ? 2 : 3;
}

function shadeColor(color, factor) {
  const red = Math.max(0, Math.min(255, Math.round(((color >> 16) & 255) * factor)));
  const green = Math.max(0, Math.min(255, Math.round(((color >> 8) & 255) * factor)));
  const blue = Math.max(0, Math.min(255, Math.round((color & 255) * factor)));
  return (red << 16) | (green << 8) | blue;
}

export class TownScene extends Phaser.Scene {
  constructor() {
    super("TownScene");
    this.buildingCollisions = [];
    this.entryData = {};
    this.transitioning = false;
  }

  init(data = {}) {
    this.entryData = data;
    this.buildingCollisions = [];
    this.transitioning = false;
    this.personalHomeGraphics = null;
    this.personalHomeLabel = null;
    this.personalHomeSignature = null;
    this.placedObjectVisuals = new Map();
    this.placementPreviewVisual = null;
    this.selectedPlacedObjectId = null;
    this.placementModeActive = false;
    this.baseInteractables = [];
    this.environmentVisuals = [];
    this.environmentSignature = null;
    this.environmentBadge = null;
    this.publicBinVisuals = [];
    this.publicBinSignature = null;
    this.municipalCollectionVisual = null;
    this.restorationVisuals = [];
    this.restorationSignature = null;
    this.restorationCameraFocus = false;
    this.townWindowLights = [];
    this.ambientPondDucks = [];
    this.interactionHighlight = null;
    this.houseRescueVisuals = [];
    this.lawnVisuals = null;
    this.townBrowseMode = true;
  }

  create() {
    this.gameState = this.registry.get("gameState");
    this.shopController = this.registry.get("shopController");
    this.cleanupService = this.registry.get("cleanupService");
    this.lawnCare = this.registry.get("lawnCare");
    this.beachCleanup = this.registry.get("beachCleanup");
    this.beachCleanup?.refresh?.();
    this.playgroundPowerwash = this.registry.get("playgroundPowerwash");
    this.playgroundPowerwash?.refresh?.();
    this.worldSimulation = this.registry.get("worldSimulation");
    this.npcTownLife = this.registry.get("npcTownLife");
    this.npcNarrativeController = this.registry.get("npcNarrativeController");
    this.municipalCollection = this.registry.get("municipalCollection");
    this.restorationMilestones = this.registry.get("restorationMilestones");
    this.onboarding = this.registry.get("onboarding");
    this.impactController = this.registry.get("impactController");
    this.pawsWonders = this.registry.get("pawsWonders");
    this.harbourGeneral = this.registry.get("harbourGeneral");
    this.restorationMilestoneController = this.registry.get("restorationMilestoneController");
    this.customResident = this.registry.get("customResident");
    this.homeInteriors = this.registry.get("homeInteriors");
    this.customResidentController = this.registry.get("customResidentController");
    this.farming = this.registry.get("farming");
    this.livingEnvironment = this.registry.get("livingEnvironment");
    this.farmingController = this.registry.get("farmingController");
    this.animals = this.registry.get("animals");
    this.animalFriendsController = this.registry.get("animalFriendsController");
    this.sharedOverlay = this.registry.get("sharedOverlay");
    this.fishing = this.registry.get("fishing");
    this.bakery = this.registry.get("bakery");
    this.cafe = this.registry.get("cafe");
    this.morningMug = this.registry.get("morningMug");
    this.riversideKitchen = this.registry.get("riversideKitchen");
    this.southShoreScoops = this.registry.get("southShoreScoops");
    this.river = this.registry.get("river");
    this.houseRescue = this.registry.get("houseRescue");
    this.townPlacement = this.registry.get("townPlacement");
    this.houseRescue?.refreshJobs?.();
    this.worldSimulation?.setPaused("activity", false);
    const savedState = this.gameState?.getSnapshot();
    this.cameras.main.setBounds(0, 0, WORLD.width, WORLD.height);
    this.drawTown();
    this.updateWorldObjectLighting(savedState?.world);
    this.renderLivingEnvironment();
    this.renderTownPlacements();
    this.renderNpcPublicBins();
    this.municipalCollectionVisual = createMunicipalCollectionVehicle(this);
    this.refreshMunicipalCollectionPresentation();

    const qaParams = import.meta.env.DEV ? new URLSearchParams(window.location.search) : null;
    const qaTarget = qaParams?.get("qa") || null;
    const animalQa = ["animals", "animal-fidelity"].includes(qaTarget);
    const animalQaArea = animalQa ? qaParams?.get("area") : null;
    const qaHouseNumber = Math.max(1, Math.min(20, Math.floor(Number(qaParams?.get("house") || 1))));
    const qaHouse = HOUSES.find((house) => Number(house.id.split("-")[1]) === qaHouseNumber) || HOUSES[0];
    const animalQaPresentation = animalQa
      ? this.animals?.getWorldPresentations?.().find((entry) => entry.visible && !entry.definition.rare)
      : null;
    const environmentQaJob = qaTarget === "environment"
      ? this.livingEnvironment?.getLandJobs?.()[0]
      : null;
    const qaSpawn = animalQaArea === "paws"
      ? PAWS_WONDERS.approach
      : animalQaArea === "home"
        ? { x: 3875, y: 1880 }
      : qaTarget === "collection"
      ? { x: 970, y: 1260 }
      : qaTarget === "home" || qaTarget === "interior"
        ? { x: 3875, y: 1880 }
      : qaTarget === "powerwash"
      ? PLAYGROUND_POWERWASH.approach
      : qaTarget === "advanced-npc"
        ? { x: 970, y: 1260 }
      : qaTarget === "placement"
        ? { x: 100, y: 200 }
      : qaTarget === "environment" && environmentQaJob
        ? environmentQaJob.world.approach
      : qaTarget === "beach"
      ? BEACH_CLEANUP.approach
      : qaTarget === "house-rescue"
        ? { x: qaHouse.x + qaHouse.width / 2, y: qaHouse.y + qaHouse.height + 54 }
      : qaTarget === "river"
      ? RIVER_CLEAROUT.approach
      : qaTarget === "cafe"
        ? CORNER_CAFE.approach
      : qaTarget === "morning-mug"
        ? MORNING_MUG.approach
      : qaTarget === "riverside-kitchen"
        ? RIVERSIDE_KITCHEN.approach
      : qaTarget === "scoops"
        ? SOUTH_SHORE_SCOOPS.approach
      : qaTarget === "bakery"
        ? LITTLE_BAKERY.approach
        : qaTarget === "paws"
        ? PAWS_WONDERS.approach
      : qaTarget === "harbour-general"
        ? HARBOUR_GENERAL.approach
        : qaTarget === "impact" || qaTarget === "impact-locked"
        ? KINDWORKS_CINEMA.approach
        : qaTarget === "fresh-market"
        ? FRESH_MARKET.approach
        : qaTarget === "village-grocer"
          ? VILLAGE_GROCER.approach
          : qaTarget === "waste"
            ? COMMONS_RUBBISH_JOB.world.approach
            : qaTarget === "farming"
              ? ALLOTMENT_CONFIG.interaction
              : qaTarget === "orchard"
                ? ORCHARD_CONFIG.interaction
                : qaTarget === "lawn"
                ? { x: LAWN_PLOTS[0].x, y: LAWN_PLOTS[0].y + 85 }
                : animalQa && animalQaPresentation?.position
                  ? { x: animalQaPresentation.position.x, y: animalQaPresentation.position.y + 72 }
                  : qaTarget === "fishing"
                    ? { x: FISHING_SPOTS[0].world.x, y: FISHING_SPOTS[0].world.y + 85 }
                    : qaTarget === "magnet"
                      ? { x: MAGNET_FISHING_SPOT.world.x, y: MAGNET_FISHING_SPOT.world.y + 82 }
          : null;
    const savedTownPosition = savedState?.player?.scene === "TownScene" ? savedState.player : null;
    const spawn = this.entryData.returnPosition
      || qaSpawn
      || savedTownPosition
      || PLAYER_START;
    const direction = this.entryData.returnFacing || (qaTarget ? "up" : "down");
    this.shadow = this.add.ellipse(spawn.x, spawn.y + 18, 31, 12, 0x24442f, 0.28).setDepth(190);
    this.player = new PlayerCharacter(this, spawn.x, spawn.y, { direction }).setDepth(200);
    this.player.setVisible(false);
    this.shadow.setVisible(false);
    this.onboardingJourneyOrigin = { x: spawn.x, y: spawn.y };
    this.onboardingMovementRecorded = Boolean(this.onboarding?.getSnapshot?.().journey?.moved);
    this.npcCharacters = new Map();
    for (const resident of this.npcTownLife?.getResidents?.() || []) {
      this.npcCharacters.set(resident.id, new NpcCharacter(this, resident));
    }
    this.animalCharacters = new Map(ANIMAL_DEFINITIONS.map((definition) => [definition.id, new AnimalCharacter(this, definition)]));
    this.customResidentCharacter = null;
    this.refreshCustomResident();
    this.unsubscribeCustomResident = this.customResident?.subscribe?.(() => this.refreshCustomResident());
    this.movement = new MovementController(this, {
      onTouchStep: (dx, dy) => this.moveActiveCharacter(dx, dy, 38),
    });
    this.movement.setEnabled(false);
    const interactables = [
        {
          id: RIVER_CLEAROUT.id,
          kind: "river-campaign",
          x: RIVER_CLEAROUT.marker.x,
          y: RIVER_CLEAROUT.marker.y,
          radius: RIVER_CLEAROUT.interactionRadius,
          icon: "🌊",
          label: "Start River Clear-Out",
          detail: "Restore 750 authored river challenges",
          onActivate: () => this.enterRiverClearout(),
        },
        {
          id: "corner-cafe-door",
          kind: "door",
          x: CORNER_CAFE.door.x,
          y: CORNER_CAFE.door.y,
          radius: CORNER_CAFE.interactionRadius,
          icon: "☕",
          label: "Enter Corner Café",
          detail: "Friendly food, fast service",
          onActivate: () => this.enterCafe(),
        },
        {
          id: "little-bakery-door",
          kind: "door",
          x: LITTLE_BAKERY.door.x,
          y: LITTLE_BAKERY.door.y,
          radius: LITTLE_BAKERY.interactionRadius,
          icon: "🥐",
          label: "Enter Little Bakery",
          detail: "Freshly baked, made to order",
          onActivate: () => this.enterBakery(),
        },
        {
          id: "morning-mug-door",
          kind: "door",
          x: MORNING_MUG.door.x,
          y: MORNING_MUG.door.y,
          radius: MORNING_MUG.interactionRadius,
          icon: "☕",
          label: "Enter Morning Mug Coffee",
          detail: "150 specialist coffee shifts",
          onActivate: () => this.enterMorningMug(),
        },
        {
          id: "riverside-kitchen-door",
          kind: "door",
          x: RIVERSIDE_KITCHEN.door.x,
          y: RIVERSIDE_KITCHEN.door.y,
          radius: RIVERSIDE_KITCHEN.interactionRadius,
          icon: "🍽️",
          label: "Enter Riverside Kitchen",
          detail: "150 restaurant shifts · preparation and heat control",
          onActivate: () => this.enterRiversideKitchen(),
        },
        {
          id: "south-shore-scoops-door",
          kind: "door",
          x: SOUTH_SHORE_SCOOPS.door.x,
          y: SOUTH_SHORE_SCOOPS.door.y,
          radius: SOUTH_SHORE_SCOOPS.interactionRadius,
          icon: "🍦",
          label: "Enter South Shore Scoops",
          detail: "750 picture-order shifts · 60% accurate service passes",
          onActivate: () => this.enterSouthShoreScoops(),
        },
        {
          id: "village-grocer-door",
          kind: "shop",
          x: VILLAGE_GROCER.door.x,
          y: VILLAGE_GROCER.door.y,
          radius: VILLAGE_GROCER.interactionRadius,
          icon: VILLAGE_GROCER.icon,
          label: `Enter ${VILLAGE_GROCER.name}`,
          detail: "Walkable top-down shop · nine original product displays",
          onActivate: () => this.enterVillageGrocer(),
        },
        {
          id: "fresh-market-door",
          kind: "shop",
          x: FRESH_MARKET.door.x,
          y: FRESH_MARKET.door.y,
          radius: FRESH_MARKET.interactionRadius,
          icon: FRESH_MARKET.icon,
          label: `Enter ${FRESH_MARKET.name}`,
          detail: "Fresh fish, meat and pond food",
          onActivate: () => this.openShop(FRESH_MARKET.id),
        },
        {
          id: "paws-wonders-door",
          kind: "shop",
          x: PAWS_WONDERS.door.x,
          y: PAWS_WONDERS.door.y,
          radius: PAWS_WONDERS.interactionRadius,
          icon: PAWS_WONDERS.icon,
          label: `Enter ${PAWS_WONDERS.name}`,
          detail: "Walkable adoption room · eleven permanent companions",
          onActivate: () => this.enterPawsWonders(),
        },
        {
          id: "harbour-general-door",
          kind: "shop",
          x: HARBOUR_GENERAL.door.x,
          y: HARBOUR_GENERAL.door.y,
          radius: HARBOUR_GENERAL.interactionRadius,
          icon: HARBOUR_GENERAL.icon,
          label: this.harbourGeneral?.getSnapshot?.().owned ? `Enter ${HARBOUR_GENERAL.name}` : `Buy ${HARBOUR_GENERAL.name} · 🪙 ${HARBOUR_GENERAL.deedPrice.toLocaleString()}`,
          detail: this.harbourGeneral?.getSnapshot?.().owned ? "Manage six displays, stock and saved till sales" : "Player-owned convenience shop · includes six starter cases",
          onActivate: () => this.enterHarbourGeneral(),
        },
        {
          id: "kindworks-cinema-door",
          kind: "cinema",
          x: KINDWORKS_CINEMA.door.x,
          y: KINDWORKS_CINEMA.door.y,
          radius: KINDWORKS_CINEMA.interactionRadius,
          icon: "🎬",
          label: cinemaAccess(this.restorationMilestones?.getSnapshot?.()).open ? "Enter KindWorks Cinema" : "KindWorks Cinema · closed",
          detail: cinemaAccess(this.restorationMilestones?.getSnapshot?.()).open ? "Real restoration films and verified impact stories" : "Complete the Station restoration milestone to reopen it",
          onActivate: () => this.openCinema(),
        },
        {
          id: "willow-allotments",
          kind: "farming",
          ...ALLOTMENT_CONFIG.interaction,
          icon: "🌱",
          label: "Open Willow Allotments",
          detail: "Plant, grow and harvest six persistent beds",
          onActivate: () => this.openFarming("allotment"),
        },
        {
          id: "community-orchard",
          kind: "farming",
          ...ORCHARD_CONFIG.interaction,
          icon: "🍎",
          label: "Visit Community Orchard",
          detail: "Harvest one apple at a time",
          onActivate: () => this.openFarming("orchard"),
        },
    ];
    this.npcInteractables = new Map();
    for (const resident of this.npcTownLife?.getResidents?.() || []) {
      const interaction = {
        id: `story-${resident.id}`,
        kind: "npc-story",
        x: resident.x,
        y: resident.y,
        radius: 78,
        enabled: resident.visible,
        icon: "💬",
        label: `Talk with ${resident.name}`,
        detail: `${resident.role} · hear a saved contextual thought`,
        onActivate: () => this.npcNarrativeController?.open?.(resident.id, { selectThought: true }),
      };
      this.npcInteractables.set(resident.id, interaction);
      interactables.push(interaction);
    }
    for (const house of HOUSES) {
      const interior = this.homeInteriors?.getInterior?.(house.id);
      interactables.push({
        id: `home-interior-${house.id}`,
        kind: "home-interior",
        x: house.x + house.width / 2,
        y: house.y + house.height + 42,
        radius: 86,
        icon: interior?.dirty ? "🧹" : house.id === PERSONAL_HOME_RENDER_HOUSE_ID ? "💚" : "🏡",
        label: house.id === PERSONAL_HOME_RENDER_HOUSE_ID ? "Enter Meadowlight House" : `Visit ${interior?.name || house.id.replace("house-", "Cottage ")}`,
        detail: interior?.dirty ? "This home needs House Rescue · enter to inspect or help" : `${interior?.occupants?.length || 0} resident${interior?.occupants?.length === 1 ? "" : "s"} home now · clean interior`,
        onActivate: () => this.enterHouseInterior(house.id),
      });
    }
    for (const plot of LAWN_PLOTS) {
      if (!plot.active) continue;
      interactables.push({
        id: plot.id,
        kind: "lawn-job",
        x: plot.x,
        y: plot.y,
        radius: plot.radius,
        icon: "🌾",
        label: `Check ${plot.title}`,
        detail: "Weather-aware lawn care job",
        onActivate: () => this.openFarming("lawns", plot.id),
      });
    }
    this.animalInteractables = new Map();
    for (const definition of ANIMAL_DEFINITIONS) {
      const interaction = {
        id: `friend-${definition.id}`,
        kind: "animal-friend",
        x: definition.route[0].x,
        y: definition.route[0].y,
        radius: 82,
        enabled: false,
        icon: "🐾",
        label: `Meet ${definition.name}`,
        detail: "Greet, feed, build trust or adopt",
        onActivate: () => this.openAnimalFriends(definition.id),
      };
      this.animalInteractables.set(definition.id, interaction);
      interactables.push(interaction);
    }
    for (const spot of FISHING_SPOTS) {
      interactables.push({
        id: spot.id,
        kind: "fishing",
        x: spot.world.x,
        y: spot.world.y,
        radius: spot.world.radius,
        icon: spot.icon,
        label: `Fish at ${spot.shortTitle}`,
        detail: `${this.fishing?.castsLeft?.("fish") ?? 5} of 5 fishing casts remain today`,
        onActivate: () => this.startFishing("fish", spot.id),
      });
    }
    interactables.push({
      id: MAGNET_FISHING_SPOT.id,
      kind: "magnet-fishing",
      x: MAGNET_FISHING_SPOT.world.x,
      y: MAGNET_FISHING_SPOT.world.y,
      radius: MAGNET_FISHING_SPOT.world.radius,
      icon: MAGNET_FISHING_SPOT.icon,
      label: "Magnet fish from Mill Bridge",
      detail: `${this.fishing?.castsLeft?.("magnet") ?? 5} of 5 magnet casts remain today`,
      onActivate: () => this.startFishing("magnet", MAGNET_FISHING_SPOT.id),
    });
    const firstWasteJobAvailable = this.cleanupService?.isAvailable(COMMONS_RUBBISH_JOB.id);
    interactables.push({
      id: COMMONS_RUBBISH_JOB.id,
      kind: firstWasteJobAvailable ? "cleanup-job" : "waste-campaign",
      x: COMMONS_RUBBISH_JOB.world.x,
      y: COMMONS_RUBBISH_JOB.world.y,
      radius: COMMONS_RUBBISH_JOB.world.interactionRadius,
      icon: COMMONS_RUBBISH_JOB.icon,
      label: firstWasteJobAvailable ? "Start Waste Collection" : "Open Waste Collection Campaign",
      detail: firstWasteJobAvailable ? "Clear 6 pieces from Willow Commons" : "Play all 750 authored matching challenges",
      onActivate: () => this.startWasteCollection(),
    });
    const beachDirty = this.beachCleanup?.isTownJobAvailable?.();
    interactables.push({
      id: BEACH_CLEANUP.id,
      kind: beachDirty ? "beach-cleanup-job" : "beach-cleanup-campaign",
      x: BEACH_CLEANUP.marker.x,
      y: BEACH_CLEANUP.marker.y,
      radius: BEACH_CLEANUP.interactionRadius,
      icon: "🏖️",
      label: beachDirty ? "Clean South Shore Beach" : "Open Beach Cleanup Campaign",
      detail: beachDirty ? `${this.beachCleanup.getSouthShoreSnapshot().litterCount} pieces of shoreline litter` : "Play all 750 original rake puzzles",
      onActivate: () => this.startBeachCleanup(),
    });
    const playgroundDirty = this.playgroundPowerwash?.isTownJobAvailable?.();
    interactables.push({
      id: PLAYGROUND_POWERWASH.id,
      kind: playgroundDirty ? "playground-powerwash-job" : "playground-powerwash-campaign",
      x: PLAYGROUND_POWERWASH.marker.x,
      y: PLAYGROUND_POWERWASH.marker.y,
      radius: PLAYGROUND_POWERWASH.interactionRadius,
      icon: "💦",
      label: playgroundDirty ? "Power Wash Commons Playground" : "Open Playground Power Wash Campaign",
      detail: playgroundDirty ? "Remove at least 97% of the grime" : "Play all 750 original power-washing challenges",
      onActivate: () => this.startPlaygroundPowerwash(),
    });
    this.baseInteractables = interactables;
    this.interactions = new InteractionSystem({
      interactables: [...this.baseInteractables, ...this.environmentInteractables(), ...this.placementInteractables()],
      onChange: (interaction) => this.renderInteractionPrompt(interaction),
    });
    this.interactions.setEnabled(false);
    this.townCamera = new TownCameraController(this, {
      minimumZoom: MIN_ZOOM,
      maximumZoom: MAX_ZOOM,
      isControlMode: () => Boolean(this.customResident?.getSnapshot?.().controlling),
      isBlocked: () => this.transitioning || this.placementModeActive || Boolean(this.selectedPlacedObjectId) || document.body.dataset.modalOpen === "true",
      onBrowseTap: (x, y) => this.browseSelectAt(x, y),
      onBrowseMove: () => {
        if (this.onboardingMovementRecorded || !this.onboarding?.getSnapshot?.().complete) return;
        const recorded = this.onboarding.recordJourneyStep?.("moved");
        this.onboardingMovementRecorded = Boolean(recorded?.ok);
      },
      onPinchStart: () => this.movement?.setEnabled(false),
      onPinchEnd: () => this.movement?.setEnabled(Boolean(this.customResident?.getSnapshot?.().controlling) && document.body.dataset.modalOpen !== "true"),
      onZoom: (zoom) => document.querySelector("#game")?.setAttribute("data-camera-zoom", Number(zoom).toFixed(2)),
    });
    this.stateSyncElapsed = 0;
    this.farmingSyncElapsed = 0;
    this.unsubscribeFarming = this.farming?.subscribe?.((snapshot, result) => this.handleFarmingChange(snapshot, result));
    this.unsubscribeHouseRescue = this.houseRescue?.subscribe?.(() => this.drawHouseRescueMarkers());
    this.unsubscribeAnimals = this.animals?.subscribe?.(() => this.refreshAnimalPresentations(0));
    this.unsubscribeTownPlacement = this.townPlacement?.subscribe?.((snapshot, result) => this.handleTownPlacementChange(snapshot, result));
    this.unsubscribeLivingEnvironment = this.livingEnvironment?.subscribe?.(() => this.refreshLivingEnvironment(true));
    this.refreshAnimalPresentations(0);

    const preferredZoom = window.matchMedia("(max-width: 720px)").matches ? 0.3 : 0.39;
    this.cameras.main.setZoom(preferredZoom);
    const initialFocus = qaTarget || this.entryData.returnPosition
      ? spawn
      : { x: WORLD.width / 2, y: WORLD.height / 2 };
    this.cameras.main.centerOn(initialFocus.x, initialFocus.y);

    this.input.on("wheel", (pointer, _objects, _dx, dy) => {
      this.townCamera?.setZoomAt(this.cameras.main.zoom * (dy > 0 ? 0.9 : 1.1), pointer.x, pointer.y);
    });

    this.bindInterface();
    this.setSceneInterface();
    this.cameras.main.fadeIn(220, 23, 43, 31);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.unbindInterface());
    this.updateStatus();
    this.time.delayedCall(420, () => this.restorationMilestoneController?.maybeOpen?.());
  }

  drawTown() {
    this.add.rectangle(WORLD.width / 2, WORLD.height / 2, WORLD.width, WORLD.height, COLORS.grass).setDepth(0);

    const terrain = this.add.graphics().setDepth(1);
    terrain.fillStyle(COLORS.grassLight, 0.28);
    for (const district of DISTRICTS) {
      terrain.fillRoundedRect(district.x, district.y, district.width, district.height, 30);
    }

    const random = new Phaser.Math.RandomDataGenerator(["willowmere-town"]);
    for (let index = 0; index < 260; index += 1) {
      terrain.fillStyle(index % 3 === 0 ? COLORS.grassDark : COLORS.grassLight, 0.18);
      terrain.fillCircle(random.between(30, WORLD.width - 30), random.between(30, WORLD.height - 30), random.between(2, 6));
    }

    const water = this.add.graphics().setDepth(5);
    water.lineStyle(220, COLORS.waterDark, 1);
    water.strokePoints(points(RIVER_PATH), false, false);
    water.lineStyle(188, COLORS.water, 1);
    water.strokePoints(points(RIVER_PATH), false, false);
    water.lineStyle(18, COLORS.waterLight, 0.42);
    water.strokePoints(points(RIVER_PATH), false, false);
    water.fillStyle(COLORS.waterDark, 1);
    water.fillRoundedRect(3050, 2490, 1070, 330, 70);
    water.fillStyle(COLORS.water, 1);
    water.fillRoundedRect(3070, 2510, 1030, 310, 58);
    water.fillStyle(0xe8d29f, 1);
    water.fillRoundedRect(3060, 2220, 1050, 310, 70);

    const roadLayer = this.add.graphics().setDepth(10);
    for (const road of ROADS) {
      roadLayer.lineStyle(road.width + 16, COLORS.roadEdge, 1);
      roadLayer.strokePoints(points(road.points), false, false);
      roadLayer.lineStyle(road.width, COLORS.road, 1);
      roadLayer.strokePoints(points(road.points), false, false);
    }
    for (const path of PATHS) {
      roadLayer.lineStyle(path.width + 8, 0xbca57b, 0.55);
      roadLayer.strokePoints(points(path.points), false, false);
      roadLayer.lineStyle(path.width, COLORS.path, 1);
      roadLayer.strokePoints(points(path.points), false, false);
    }

    const pond = this.add.graphics().setDepth(12);
    pond.fillStyle(0xbca57b, 0.8);
    pond.fillEllipse(1430, 1075, 450, 310);
    pond.fillStyle(COLORS.water, 1);
    pond.fillEllipse(1430, 1075, 410, 270);
    pond.fillStyle(COLORS.waterLight, 0.45);
    pond.fillEllipse(1390, 1035, 190, 56);
    pond.fillStyle(COLORS.water, 1);
    pond.fillEllipse(2005, 2335, 440, 300);
    this.drawAmbientPondDucks();

    this.drawBridges();
    this.drawParkDetails();
    HOUSES.forEach((house) => this.drawHouse(house));
    this.drawHouseRescueMarkers();
    SHOPS.forEach((shop) => this.drawShop(shop));
    this.drawSouthShoreScoopsRestoration();
    this.drawLandmarks();
    this.drawFarmingAreas();
    this.drawSouthMeadow();
    this.drawFishingSpots();
    this.drawRiverCampaignMarker();
    this.drawCleanupTarget();
    this.drawBeachCleanupTarget();
    this.drawPlaygroundPowerwashTarget();
    this.drawLabels();
    this.drawRestorationChanges();

    this.interactionHighlight = this.add.ellipse(0, 0, 86, 42, 0xfff2a3, 0.12)
      .setStrokeStyle(6, 0xffef93, 0.95)
      .setDepth(475)
      .setVisible(false);
    setSpriteAiLabelHint(this.interactionHighlight, { id: "world.selection-highlight", label: "Current town interaction highlight", kind: "selection-highlight" });
    this.tweens.add({ targets: this.interactionHighlight, scale: 1.15, alpha: 0.03, duration: 650, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });

    this.add.rectangle(WORLD.width / 2, WORLD.height / 2, WORLD.width - 24, WORLD.height - 24)
      .setStrokeStyle(24, 0x315e3f, 1)
      .setDepth(300);
  }

  drawAmbientPondDucks() {
    const positions = [
      [1340, 1040, false], [1415, 1115, true], [1480, 1018, false], [1530, 1125, true], [1380, 1160, false],
      [1890, 2300, false], [1960, 2370, true], [2040, 2275, false], [2110, 2350, false], [2025, 2430, true],
    ];
    positions.forEach(([x, y, resting], index) => {
      const duck = this.add.container(x, y).setDepth(43 + y / 100);
      const wake = this.add.ellipse(-16, 8, resting ? 34 : 55, 13, 0xd9fbff, resting ? 0.16 : 0.28).setStrokeStyle(2, 0xffffff, 0.35);
      const body = this.add.ellipse(0, 0, resting ? 27 : 35, resting ? 18 : 22, 0xe8bc4e, 1).setStrokeStyle(2, 0x315e3f, 0.6);
      const head = this.add.circle(13, -9, resting ? 7 : 9, 0x4f8355, 1).setStrokeStyle(1, 0x315e3f, 0.7);
      const beak = this.add.triangle(24, -8, 0, 0, 10, 4, 0, 8, 0xf09a45, 1);
      duck.add([wake, body, head, beak]);
      setSpriteAiLabelHint(duck, { id: `world.wildlife.pond-duck-${index + 1}`, label: `${resting ? "Resting" : "Swimming"} pond duck ${index + 1}`, kind: "ambient-wildlife" });
      setSpriteAiLabelHint(wake, { id: `world.wildlife.duck-wake-${index + 1}`, label: `Pond duck wake ${index + 1}`, kind: "water-effect" });
      if (!resting) this.tweens.add({ targets: duck, x: x + (index % 2 ? -38 : 38), duration: 4200 + index * 170, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
      this.ambientPondDucks.push(duck);
    });
  }

  drawBridges() {
    const graphics = this.add.graphics().setDepth(30);
    for (const bridge of BRIDGES) {
      graphics.fillStyle(0x69503b, 1);
      graphics.fillRoundedRect(bridge.x, bridge.y - bridge.height / 2, bridge.width, bridge.height, 10);
      graphics.fillStyle(0xcaa36d, 1);
      graphics.fillRoundedRect(bridge.x + 7, bridge.y - bridge.height / 2 + 8, bridge.width - 14, bridge.height - 16, 7);
      graphics.lineStyle(3, 0x9a754f, 0.8);
      for (let x = bridge.x + 20; x < bridge.x + bridge.width; x += 28) {
        graphics.lineBetween(x, bridge.y - bridge.height / 2 + 9, x, bridge.y + bridge.height / 2 - 9);
      }
    }
  }

  drawParkDetails() {
    const graphics = this.add.graphics().setDepth(20);
    graphics.fillStyle(0xb7d98a, 0.7);
    graphics.fillRoundedRect(1130, 745, 1220, 690, 80);
    graphics.fillStyle(0xd6bd83, 1);
    graphics.fillRoundedRect(1060, 2130, 560, 420, 25);
    graphics.lineStyle(5, 0x9b7d52, 0.8);
    for (let x = 1110; x <= 1550; x += 110) graphics.strokeRoundedRect(x, 2190, 80, 250, 12);

    const trees = [
      [1180, 780], [1320, 760], [1510, 770], [1700, 800], [2210, 820], [2260, 1260],
      [1120, 1360], [1330, 1380], [1570, 1385], [2300, 1930], [280, 2200], [500, 2270],
      [720, 2180], [2920, 250], [3070, 220], [3190, 310], [2950, 395], [3110, 420],
    ];
    for (const [x, y] of trees) {
      graphics.fillStyle(COLORS.trunk, 1);
      graphics.fillRect(x - 8, y, 16, 30);
      graphics.fillStyle(COLORS.tree, 1);
      graphics.fillCircle(x, y - 9, 33);
      graphics.fillStyle(COLORS.grassLight, 0.65);
      graphics.fillCircle(x - 10, y - 19, 14);
    }
  }

  drawHouse(house) {
    const personalHome = house.id === PERSONAL_HOME_RENDER_HOUSE_ID ? this.customResident?.getSnapshot?.().home : null;
    if (personalHome) {
      this.personalHomeGraphics?.destroy();
      this.personalHomeLabel?.destroy();
    }
    const level = personalHome ? PERSONAL_HOME_LEVELS[personalHome.level - 1] || PERSONAL_HOME_LEVELS[0] : null;
    const scale = level?.scale || 1;
    const width = house.width * scale;
    const height = house.height * scale;
    const x = house.x + (house.width - width) / 2;
    const y = house.y + house.height - height;
    const wallColor = personalHome ? PERSONAL_HOME_OPTIONS.wallPalette[personalHome.wallColor] : COLORS.wall;
    const roofColor = personalHome ? PERSONAL_HOME_OPTIONS.roofPalette[personalHome.roofColor] : house.roof;
    const architecture = personalHome
      ? houseArchitectureKit(PERSONAL_HOME_ARCHITECTURE_KITS[Math.max(0, Math.min(PERSONAL_HOME_ARCHITECTURE_KITS.length - 1, (personalHome.level || 1) - 1))])
      : houseArchitectureKit(house.architectureKit);
    const roofStyle = personalHome?.roofStyle || architecture.roof;
    const layer = this.add.graphics().setDepth(60 + house.y / 100);
    if (personalHome) this.personalHomeGraphics = layer;
    const scaleX = width / 198;
    const scaleY = height / 116;
    const centerX = house.x + house.width / 2;
    const centerY = house.y + house.height - 50 * scaleY;
    const px = (value) => centerX + value * scaleX;
    const py = (value) => centerY + value * scaleY;
    const rect = (localX, localY, localWidth, localHeight, color, alpha = 1) => {
      layer.fillStyle(color, alpha);
      layer.fillRect(px(localX), py(localY), localWidth * scaleX, localHeight * scaleY);
    };
    const polygon = (values, color, outline = 0x294637) => {
      const mapped = values.map(([localX, localY]) => ({ x: px(localX), y: py(localY) }));
      layer.fillStyle(color, 1);
      layer.fillPoints(mapped, true);
      layer.lineStyle(Math.max(2, 5 * Math.min(scaleX, scaleY)), outline, 0.92);
      layer.strokePoints(mapped, true);
    };
    layer.fillStyle(0x5c864e, 0.5);
    layer.fillRoundedRect(house.x - 36, house.y - 38, house.width + 72, house.height + 78, 18);
    const body = architecture.body;
    rect(body.x - 4, body.y - 4, body.w + 8, body.h + 8, COLORS.ink);
    rect(body.x, body.y, body.w, body.h, wallColor);
    rect(body.x, 36, body.w, 14, shadeColor(wallColor, 0.78));
    rect(body.x - 4, 47, body.w + 8, 7, 0x765238);
    const roof = architecture.roofShape;
    let roofPoints;
    if (roofStyle === "hip") roofPoints = [[roof.left, roof.eaveY], [roof.left + 29, roof.topY + 6], [roof.right - 29, roof.topY + 6], [roof.right, roof.eaveY], [roof.right - 7, roof.eaveY + 6], [roof.left + 7, roof.eaveY + 6]];
    else if (roofStyle === "gambrel") {
      const span = roof.right - roof.left;
      roofPoints = [[roof.left, roof.eaveY], [roof.left + span * 0.12, roof.topY + (roof.eaveY - roof.topY) * 0.46], [roof.left + span * 0.31, roof.topY], [roof.right - span * 0.31, roof.topY], [roof.right - span * 0.12, roof.topY + (roof.eaveY - roof.topY) * 0.46], [roof.right, roof.eaveY], [roof.right - 7, roof.eaveY + 6], [roof.left + 7, roof.eaveY + 6]];
    } else roofPoints = [[roof.left, roof.eaveY], [0, roof.topY], [roof.right, roof.eaveY], [roof.right - 7, roof.eaveY + 6], [roof.left + 7, roof.eaveY + 6]];
    polygon(roofPoints, roofColor);
    layer.lineStyle(Math.max(1.5, 3 * Math.min(scaleX, scaleY)), shadeColor(roofColor, 1.22), 0.95);
    layer.lineBetween(px(roof.left + 15), py(roof.eaveY - 5), px(0), py(roof.topY + 8));
    layer.lineBetween(px(0), py(roof.topY + 8), px(roof.right - 15), py(roof.eaveY - 5));
    rect(architecture.chimneyX - 10, roof.topY + 4, 20, 32, COLORS.ink);
    rect(architecture.chimneyX - 6, roof.topY + 7, 12, 27, 0x9a5c48);
    if (architecture.feature === "cross-gable") {
      polygon([[17, -5], [52, -43], [89, -5], [84, 1], [22, 1]], shadeColor(roofColor, 0.68));
      layer.fillStyle(0xa9d6df, 1).fillCircle(px(53), py(-17), 10 * Math.min(scaleX, scaleY));
      layer.lineStyle(3, COLORS.ink, 0.9).strokeCircle(px(53), py(-17), 10 * Math.min(scaleX, scaleY));
    }
    const drawWindow = (windowPoint) => {
      const windowWidth = windowPoint.bay ? 46 : 32;
      const windowHeight = windowPoint.bay ? 30 : 26;
      rect(windowPoint.x - windowWidth / 2 - 4, windowPoint.y - windowHeight / 2 - 4, windowWidth + 8, windowHeight + 8, COLORS.ink);
      rect(windowPoint.x - windowWidth / 2, windowPoint.y - windowHeight / 2, windowWidth, windowHeight, 0xf5e8bd);
      rect(windowPoint.x - windowWidth / 2 + 3, windowPoint.y - windowHeight / 2 + 3, windowWidth - 6, windowHeight - 6, 0x8ac5d5);
      rect(windowPoint.x - 2, windowPoint.y - windowHeight / 2 + 2, 4, windowHeight - 4, COLORS.ink);
      rect(windowPoint.x - windowWidth / 2 + 2, windowPoint.y - 2, windowWidth - 4, 4, COLORS.ink);
    };
    for (const windowPoint of architecture.windows) drawWindow(windowPoint);
    rect(-17, 3, 34, 49, COLORS.ink);
    rect(-13, 7, 26, 43, 0x3e6f76);
    rect(-9, 11, 18, 13, 0x8ac5d5);
    rect(8, 33, 4, 4, 0xe7bd4e);
    if (architecture.feature === "bay") {
      rect(24, 34, 56, 12, shadeColor(wallColor, 0.78));
      rect(20, 45, 64, 6, 0x765238);
    } else if (architecture.feature === "two-storey") {
      rect(body.x + 5, 0, body.w - 10, 4, shadeColor(roofColor, 0.68));
    } else if (architecture.feature === "veranda") {
      rect(-94, 22, 188, 8, COLORS.ink);
      rect(-89, 24, 178, 4, shadeColor(roofColor, 0.68));
      for (const columnX of [-78, -29, 29, 78]) {
        rect(columnX - 3, 26, 7, 27, COLORS.ink);
        rect(columnX - 1, 29, 3, 22, 0xf5e8bd);
      }
      rect(-98, 49, 196, 7, COLORS.ink);
    } else if (architecture.feature === "compact") {
      rect(-28, 45, 56, 5, 0xf5e8bd);
      rect(-25, 45, 4, 12, 0x765238);
      rect(21, 45, 4, 12, 0x765238);
    }
    const lightDepth = 61 + house.y / 100;
    architecture.windows.forEach((windowPoint, index) => {
      const glow = this.add.rectangle(px(windowPoint.x), py(windowPoint.y), (windowPoint.bay ? 42 : 28) * scaleX, 24 * scaleY, 0xffe79a, 1).setDepth(lightDepth).setAlpha(0.08);
      setSpriteAiLabelHint(glow, { id: `building.${house.id}.window-${index + 1}-night-glow`, label: `${house.id} window ${index + 1} night glow`, kind: "window-light" });
      this.townWindowLights.push(glow);
    });
    setSpriteAiLabelHint(layer, { id: architecture.assetId, label: `${house.id} ${architecture.label}`, kind: "house-exterior" });
    if (personalHome && this.customResident?.getSnapshot?.().created) {
      this.personalHomeLabel = this.add.text(house.x + house.width / 2, py(roof.topY) - 25, `💚 Meadowlight House · Level ${personalHome.level}`, {
        color: "#294637", fontFamily: "system-ui, sans-serif", fontSize: "11px", fontStyle: "bold",
        backgroundColor: "rgba(255, 253, 241, 0.94)", padding: { x: 6, y: 3 },
      }).setOrigin(0.5).setDepth(90 + house.y / 100);
    }
    const collision = { id: `building-${house.id}`, x: x - 8, y: y - 15, width: width + 16, height: height + 18 };
    const collisionIndex = this.buildingCollisions.findIndex((entry) => entry.id === collision.id);
    if (collisionIndex >= 0) this.buildingCollisions[collisionIndex] = collision;
    else this.buildingCollisions.push(collision);
  }

  drawHouseRescueMarkers() {
    for (const visual of this.houseRescueVisuals || []) visual.destroy?.();
    this.houseRescueVisuals = [];
    const state = this.gameState?.getSnapshot?.();
    const homes = state?.houseRescue?.homes || {};
    const worldDay = state?.world?.day || 1;
    for (const house of HOUSES) {
      const home = homes[house.id];
      const stage = houseExteriorDirtStage(home, worldDay);
      const interaction = this.baseInteractables?.find?.(({ id }) => id === `home-interior-${house.id}`);
      if (interaction) {
        interaction.icon = home?.dirty ? "🧹" : house.id === PERSONAL_HOME_RENDER_HOUSE_ID ? "💚" : "🏡";
        interaction.detail = home?.dirty ? "This home needs House Rescue · enter to inspect or help" : "Clean interior · visit this household";
      }
      if (!stage) continue;
      const graphics = this.add.graphics().setDepth(128 + house.y / 100);
      const scaleX = house.width / 198;
      const scaleY = house.height / 116;
      const centerX = house.x + house.width / 2;
      const centerY = house.y + house.height / 2;
      const x = (value) => centerX + value * scaleX;
      const y = (value) => centerY + value * scaleY;
      const alpha = stage === 1 ? 0.22 : stage === 2 ? 0.38 : 0.58;
      graphics.fillStyle(0x514334, alpha);
      graphics.fillRect(x(-82), y(34), 164 * scaleX, 12 * scaleY);
      graphics.fillRect(x(-76), y(27), 28 * scaleX, 7 * scaleY);
      graphics.fillRect(x(42), y(29), 33 * scaleX, 6 * scaleY);
      if (stage >= 2) {
        graphics.fillStyle(0x525b4f, stage === 2 ? 0.25 : 0.38);
        graphics.fillRect(x(-64), y(12), 22 * scaleX, 15 * scaleY);
        graphics.fillRect(x(39), y(8), 23 * scaleX, 17 * scaleY);
        for (let index = 0; index < 5; index += 1) {
          const seed = Number(house.id.split("-")[1]) || 1;
          const markX = -74 + ((seed * 31 + index * 37) % 142);
          const markY = 30 + ((seed + index * 11) % 10);
          graphics.fillStyle(0x493d30, stage === 2 ? 0.28 : 0.48);
          graphics.fillRect(x(markX), y(markY), (9 + (index % 2) * 5) * scaleX, 4 * scaleY);
        }
      }
      if (stage >= 3) {
        graphics.lineStyle(Math.max(1.5, 2 * scaleX), 0xeee8cc, 0.76);
        graphics.lineBetween(x(-70), y(5), x(-55), y(18));
        graphics.lineBetween(x(-70), y(5), x(-48), y(8));
        graphics.lineBetween(x(-70), y(5), x(-66), y(24));
        graphics.lineBetween(x(-64), y(11), x(-53), y(12));
        graphics.fillStyle(0x3f352d, 0.9);
        graphics.fillRect(x(62), y(45), 22 * scaleX, 5 * scaleY);
      }
      graphics.setData("houseDirtStage", stage);
      setSpriteAiLabelHint(graphics, { id: `building.${house.id}.dirt-stage-${stage}`, label: `${house.id} exterior dirt stage ${stage}`, kind: "house-dirt" });
      this.houseRescueVisuals.push(graphics);
    }
  }

  drawShop(shop) {
    const visual = SHOP_VISUAL_STATES[shop.title] || {
      kind: "shop", sign: shop.title.toUpperCase(), wall: shop.color, roof: shadeColor(shop.color, 0.76),
      width: Math.min(220, shop.width - 10), height: 90, fixture: "shop-window",
      merchandise: [shop.icon, shop.icon], assetId: `shop.${shop.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.exterior`,
    };
    const layer = this.add.graphics().setDepth(70 + shop.y / 100);
    const cx = shop.x + shop.width / 2;
    const baseY = shop.y + shop.height - 1;
    const width = visual.width;
    const height = visual.height;
    const left = cx - width / 2;
    const ink = 0x222238;
    const cream = 0xfff0c8;
    const blue = 0x57929a;
    const blueLight = 0xa9dae2;
    const wood = 0x79513e;
    const woodDark = 0x5a3d32;
    const pixel = (x, y, w, h, color, alpha = 1) => {
      layer.fillStyle(color, alpha);
      layer.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    };
    const window = (x, y, w = 52, h = 33, tint = blue) => {
      pixel(x - 3, y - 3, w + 6, h + 6, ink);
      pixel(x, y, w, h, tint);
      pixel(x + 4, y + 4, Math.max(8, w * 0.32), 6, blueLight);
      pixel(x + w * 0.52, y + 2, 3, h - 4, ink);
      pixel(x + 2, y + h * 0.56, w - 4, 3, ink);
    };
    const door = (x, y, h = 46, color = wood) => {
      pixel(x - 3, y - 3, 31, h + 6, ink);
      pixel(x, y, 25, h, color);
      pixel(x + 5, y + 5, 15, 13, blueLight);
      pixel(x + 19, y + h * 0.64, 3, 3, 0xe8c35d);
    };
    const crate = (x, y, fruit = false) => {
      pixel(x - 3, y - 3, 37, 23, ink);
      pixel(x, y, 31, 17, 0x9a6b42);
      pixel(x, y + 7, 31, 3, woodDark);
      for (let index = 0; index < 4; index += 1) {
        pixel(x + 4 + index * 7, y + 3, fruit ? 6 : 4, fruit ? 6 : 8, fruit ? (index % 2 ? 0xb95746 : 0xe8c35d) : 0xe7833f);
        if (!fruit) pixel(x + 4 + index * 7, y, 4, 4, 0x52775d);
      }
    };

    pixel(left - 8, baseY + 2, width + 16, 11, 0x222238, 0.28);
    pixel(left, baseY - height, width, height + 5, ink);
    pixel(left + 6, baseY - height + 5, width - 12, height - 7, visual.wall);
    pixel(left + 6, baseY - 13, width - 12, 12, shadeColor(visual.wall, 0.76));
    for (let y = baseY - height + 14, row = 0; y < baseY - 23; y += 13, row += 1) {
      for (let x = left + 10 + (row % 2 ? 9 : 0); x < left + width - 10; x += 36) pixel(x, y, 18, 3, shadeColor(visual.wall, 0.84));
    }
    layer.fillStyle(ink, 1);
    layer.fillTriangle(left - 5, baseY - height + 1, cx, baseY - height - 43, left + width + 5, baseY - height + 1);
    layer.fillStyle(visual.roof, 1);
    layer.fillTriangle(left + 2, baseY - height - 2, cx, baseY - height - 37, left + width - 2, baseY - height - 2);

    pixel(left + 7, baseY - 67, width - 14, 17, ink);
    for (let index = 0; index < 9; index += 1) {
      const stripeWidth = (width - 20) / 9;
      pixel(left + 10 + index * stripeWidth, baseY - 64, stripeWidth + 1, 11, index % 2 ? cream : shadeColor(visual.roof, 1.08));
    }

    if (visual.kind === "restaurant") {
      window(left + 14, baseY - 45, 54, 34);
      window(left + width - 68, baseY - 45, 54, 34);
      door(cx - 13, baseY - 47, 46);
      for (const x of [left + 41, left + width - 41]) {
        pixel(x - 14, baseY - 22, 28, 4, cream);
        pixel(x - 2, baseY - 20, 4, 12, woodDark);
        pixel(x - 9, baseY - 25, 18, 3, 0xffffff);
      }
    } else if (visual.kind === "pub") {
      window(left + 16, baseY - 43, 50, 31, 0x668078);
      door(left + width - 48, baseY - 48, 47, 0x59433a);
      pixel(left + 9, baseY - height + 31, width - 18, 5, woodDark);
      pixel(left + width + 8, baseY - 65, 8, 42, ink);
      pixel(left + width + 14, baseY - 64, 38, 29, ink);
      pixel(left + width + 18, baseY - 60, 30, 21, 0xd3b477);
    } else if (visual.kind === "cafe" || visual.kind === "coffee") {
      window(left + 15, baseY - 45, 72, 34);
      door(left + width - 50, baseY - 48, 47, 0x6c4c3c);
      pixel(left + 22, baseY - 21, 58, 5, woodDark);
      pixel(left + 43, baseY - 34, 18, 4, 0xffffff);
      pixel(left + 47, baseY - 30, 11, 9, cream);
    } else if (visual.kind === "grocer") {
      window(left + 18, baseY - 47, 72, 35, 0x5c8e88);
      door(left + width - 51, baseY - 49, 48, 0x6b503c);
      crate(left + 16, baseY - 19);
      crate(left + 58, baseY - 19, true);
    } else if (visual.kind === "bakery") {
      window(left + 18, baseY - 47, 79, 36, 0x628e92);
      door(left + width - 49, baseY - 49, 48, 0x724a3a);
      for (const x of [left + 31, left + 56, left + 81]) {
        pixel(x, baseY - 24, 20, 9, ink);
        pixel(x + 3, baseY - 22, 14, 5, 0xdeb266);
        pixel(x + 7, baseY - 24, 7, 3, cream);
      }
    } else if (visual.kind === "general") {
      window(left + 14, baseY - 48, 82, 36, 0x5c9491);
      door(left + width - 48, baseY - 49, 48, 0x604b42);
      for (const [x, color] of [[left + 23, 0x5d7596], [left + 43, 0xd4a14b], [left + 63, 0xa95c66]]) {
        pixel(x, baseY - 28, 14, 13, ink);
        pixel(x + 3, baseY - 25, 8, 7, color);
      }
    } else if (visual.kind === "market") {
      window(left + 10, baseY - 54, width - 20, 42, 0x6a9790);
      crate(left + 18, baseY - 18);
      crate(cx - 18, baseY - 18, true);
      crate(left + width - 52, baseY - 18);
    } else if (visual.kind === "pet-shop") {
      window(left + 15, baseY - 48, 76, 36, 0x79a7a0);
      door(left + width - 49, baseY - 49, 48, 0x52775d);
      pixel(left + 102, baseY - 40, 34, 24, 0xe5efd2);
      for (const [x, y] of [[left + 106, -36], [left + 116, -39], [left + 126, -36], [left + 111, -29], [left + 123, -29]]) pixel(x, baseY + y, 5, 5, 0x6f9b79);
    } else if (visual.kind === "beach-cafe") {
      window(left + 16, baseY - 51, 78, 37);
      window(left + width - 92, baseY - 51, 52, 37);
      door(cx - 14, baseY - 51, 50);
    } else if (visual.kind === "cinema") {
      window(left + 14, baseY - 87, 48, 70, 0x446c7c);
      window(left + 69, baseY - 87, 48, 70, 0x6f517d);
      door(left + 130, baseY - 92, 86, 88, 0x3d5870);
      pixel(left + 122, baseY - 106, 102, 18, ink);
      pixel(left + 128, baseY - 100, 90, 8, 0xf0c65d);
    } else {
      window(left + 12, baseY - 40, 58, 29, 0x668c99);
      door(left + width - 45, baseY - 43, 42, 0x684b3d);
    }

    const signWidth = Math.min(width - 18, Math.max(78, visual.sign.length * 7 + 18));
    const signY = baseY - height - 70;
    pixel(cx - signWidth / 2 - 3, signY - 3, signWidth + 6, 24, ink);
    pixel(cx - signWidth / 2, signY, signWidth, 18, cream);
    const sign = this.add.text(cx, signY + 9, visual.sign, {
      color: "#222238",
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
      fontSize: visual.sign.length > 16 ? "9px" : "10px",
      fontStyle: "bold",
    }).setOrigin(0.5).setDepth(95 + shop.y / 100);
    setSpriteAiLabelHint(layer, { id: visual.assetId, label: `${shop.title} ${visual.fixture} exterior`, kind: "shop-exterior" });
    setSpriteAiLabelHint(sign, { id: `${visual.assetId}.sign`, label: `${shop.title} exterior sign`, kind: "shop-sign" });
    this.buildingCollisions.push({ x: shop.x - 8, y: shop.y - 8, width: shop.width + 16, height: shop.height + 16 });
  }

  drawSouthShoreScoopsRestoration() {
    const tier = this.southShoreScoops?.getDiagnostics?.().restorationTier || 0;
    if (!tier) return;
    const x = 3560;
    const layer = this.add.graphics().setDepth(95);
    layer.lineStyle(5, tier >= 10 ? 0xffd34d : 0xfff1b0, 1);
    layer.lineBetween(3448, 2060, 3672, 2060);
    const decorations = ["🌸", "🏖️", "🌺", "✨", "🍦"];
    for (let index = 0; index < Math.min(5, Math.ceil(tier / 2)); index += 1) {
      this.add.text(3452 + index * 54, 2048, decorations[index], { fontSize: "20px" }).setOrigin(0.5).setDepth(100);
    }
    this.add.text(x, 2025, tier >= 10 ? "✨ SOUTH SHORE FULLY RESTORED ✨" : `🍦 SOUTH SHORE RESTORATION · TIER ${tier}`, {
      color: tier >= 10 ? "#6c431d" : "#294637",
      backgroundColor: tier >= 10 ? "rgba(255,222,91,.96)" : "rgba(255,249,223,.94)",
      fontFamily: "system-ui, sans-serif",
      fontSize: "11px",
      fontStyle: "bold",
      padding: { x: 7, y: 4 },
    }).setOrigin(0.5).setDepth(101);
  }

  drawRestorationChanges() {
    for (const visual of this.restorationVisuals || []) visual.destroy?.();
    this.restorationVisuals = [];
    const snapshot = this.restorationMilestones?.getSnapshot?.();
    if (!snapshot) return;
    const unlocked = snapshot.unlocked;
    const add = (...objects) => this.restorationVisuals.push(...objects.filter(Boolean));
    if (unlocked.wake) {
      const fountain = this.add.container(555, 1365).setDepth(122);
      const basin = this.add.ellipse(0, 10, 92, 34, 0x8b8064, 1).setStrokeStyle(5, 0xe7d7a3, 1);
      const water = this.add.ellipse(0, 7, 70, 21, 0x78c9dd, 0.92);
      const stone = this.add.rectangle(0, -8, 18, 37, 0xb8aa86).setStrokeStyle(3, 0x756d58, 0.8);
      const spray = this.add.text(0, -37, "💦", { fontSize: "31px" }).setOrigin(0.5);
      fountain.add([basin, water, stone, spray]);
      this.tweens.add({ targets: spray, y: -43, scale: 1.08, duration: 850, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
      add(fountain);
    }
    if (unlocked.commons) {
      const graphics = this.add.graphics().setDepth(121);
      graphics.fillStyle(0x527154, 1);
      for (const [x, y] of [[1280, 1215], [1540, 1300], [1870, 1235]]) {
        graphics.fillRoundedRect(x - 35, y - 8, 70, 16, 5);
        graphics.fillRect(x - 27, y + 7, 7, 18);
        graphics.fillRect(x + 20, y + 7, 7, 18);
      }
      const open = this.add.text(1940, 1015, "✨ PLAYGROUND OPEN", { color: "#fff9df", backgroundColor: "#4f7d54", fontFamily: "system-ui", fontSize: "12px", fontStyle: "bold", padding: { x: 8, y: 4 } }).setOrigin(0.5).setDepth(124);
      add(graphics, open);
    }
    if (unlocked.highstreet) {
      const graphics = this.add.graphics().setDepth(121);
      for (const [x, y, color] of [[2985, 835, 0xc96558], [3230, 850, 0xe0b84d], [3490, 835, 0x6b9dc4]]) {
        graphics.fillStyle(0x795a40, 1);
        graphics.fillEllipse(x, y, 48, 19);
        graphics.fillRect(x - 3, y, 6, 25);
        graphics.fillStyle(color, 1);
        graphics.fillCircle(x - 29, y - 3, 9);
        graphics.fillCircle(x + 29, y - 3, 9);
      }
      for (const [x, y] of [[3090, 575], [3380, 575], [3650, 685]]) {
        graphics.fillStyle(0xffdc67, 0.94);
        graphics.fillRoundedRect(x - 27, y - 8, 54, 16, 5);
      }
      add(graphics);
    }
    if (unlocked.river) {
      const fish = [[2528, 730], [2555, 1165], [2537, 1700], [2570, 2160]].map(([x, y], index) => {
        const visual = this.add.text(x, y, index % 2 ? "🐠" : "🐟", { fontSize: "18px" }).setOrigin(0.5).setAlpha(0.82).setDepth(44 + y / 100);
        this.tweens.add({ targets: visual, x: x + (index % 2 ? -24 : 24), duration: 1800 + index * 170, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
        return visual;
      });
      const duck = this.add.text(2585, 1890, "🦆", { fontSize: "26px" }).setOrigin(0.5).setDepth(47);
      this.tweens.add({ targets: duck, y: 1935, duration: 2500, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
      add(...fish, duck);
    }
    if (unlocked.station) {
      const marquee = this.add.text(3965, 222, "🎬 NOW SHOWING · KINDWORKS CINEMA OPEN", { color: "#fff1aa", backgroundColor: "rgba(65,43,75,.96)", fontFamily: "system-ui", fontSize: "12px", fontStyle: "bold", padding: { x: 8, y: 5 } }).setOrigin(0.5).setDepth(124);
      const crowd = ["🧍", "🧑", "👩"].map((icon, index) => this.add.text(3880 + index * 65, 475, icon, { fontSize: "24px" }).setOrigin(0.5).setDepth(126));
      add(marquee, ...crowd);
    }
    if (unlocked.shore) {
      const umbrellas = [[3485, 2395, "🔴"], [3710, 2450, "🟡"], [3940, 2390, "🔵"]].map(([x, y, icon]) => this.add.text(x, y, `${icon}\n│`, { align: "center", color: "#795d45", fontFamily: "system-ui", fontSize: "25px", fontStyle: "bold" }).setOrigin(0.5).setDepth(122));
      const table = this.add.text(3610, 2380, "🧺", { fontSize: "28px" }).setOrigin(0.5).setDepth(123);
      const boat = this.add.text(4005, 2630, "⛵", { fontSize: "35px" }).setOrigin(0.5).setDepth(48);
      this.tweens.add({ targets: boat, y: 2640, angle: 3, duration: 1800, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
      add(...umbrellas, table, boat);
    }
    if (unlocked.green) {
      add(...[[1230, 1070, "🐿️"], [1900, 1385, "🐇"], [1160, 1015, "🐦"], [2010, 1220, "🐦"]].map(([x, y, icon]) => this.add.text(x, y, icon, { fontSize: "18px" }).setOrigin(0.5).setDepth(128 + y / 100)));
    }
    if (unlocked.festival) {
      const plaque = this.add.text(555, 1415, "🏆 WILLOWMERE RESTORATION FESTIVAL", { color: "#fff3b4", backgroundColor: "rgba(99,72,45,.96)", fontFamily: "system-ui", fontSize: "11px", fontStyle: "bold", padding: { x: 8, y: 5 } }).setOrigin(0.5).setDepth(125);
      add(plaque);
      if (snapshot.festivalActive) {
        const bunting = this.add.graphics().setDepth(130);
        for (const [a, b] of [[[175, 815], [890, 815]], [[2850, 515], [3700, 535]], [[1160, 1015], [1970, 1040]]]) {
          bunting.lineStyle(3, 0xd9b05a, 1);
          bunting.lineBetween(a[0], a[1], b[0], b[1]);
          for (let index = 1; index < 9; index += 1) {
            const ratio = index / 9;
            const x = a[0] + (b[0] - a[0]) * ratio;
            const y = a[1] + (b[1] - a[1]) * ratio;
            bunting.fillStyle([0xd9685e, 0xf0c85b, 0x6a9dc1][index % 3], 1);
            bunting.fillTriangle(x - 7, y, x + 7, y, x, y + 15);
          }
        }
        const festivalCrowd = [[480, 1460], [620, 1450], [1260, 1060], [1440, 1080], [1650, 1070], [3100, 575], [3440, 580]].map(([x, y], index) => this.add.text(x, y, index % 3 === 0 ? "🎉" : index % 3 === 1 ? "🧑" : "👩", { fontSize: "22px" }).setOrigin(0.5).setDepth(132));
        add(bunting, ...festivalCrowd);
      }
    }
  }

  refreshRestorationPresentation(force = false) {
    const snapshot = this.restorationMilestones?.getSnapshot?.();
    if (!snapshot) return;
    const cinema = this.baseInteractables?.find?.(({ id }) => id === "kindworks-cinema-door");
    if (cinema) {
      const access = cinemaAccess(snapshot);
      cinema.label = access.open ? "Enter KindWorks Cinema" : "KindWorks Cinema · closed";
      cinema.detail = access.open ? "Real restoration films and verified impact stories" : "Complete the Station restoration milestone to reopen it";
    }
    const signature = `${RESTORATION_MILESTONE_ORDER.map((id) => Number(Boolean(snapshot.unlocked[id]))).join("")}:${Number(snapshot.festivalActive)}`;
    if (!force && signature === this.restorationSignature) return;
    this.restorationSignature = signature;
    this.drawRestorationChanges();
  }

  drawLandmarks() {
    for (const landmark of LANDMARKS) {
      this.add.text(landmark.x, landmark.y, landmark.icon, {
        fontFamily: "Apple Color Emoji, system-ui",
        fontSize: "38px",
      }).setOrigin(0.5).setDepth(110);
      this.add.text(landmark.x, landmark.y + 40, landmark.title, {
        color: "#294637",
        fontFamily: "system-ui, sans-serif",
        fontSize: "16px",
        fontStyle: "bold",
        backgroundColor: "rgba(255, 249, 223, 0.78)",
        padding: { x: 7, y: 3 },
      }).setOrigin(0.5).setDepth(110);
    }
  }

  drawFarmingAreas() {
    this.farmingVisuals?.destroy();
    this.lawnVisuals?.destroy();
    this.farmingLabels?.forEach((label) => label.destroy());
    this.farmingLabels = [];
    const state = this.farming?.getSnapshot?.();
    if (!state) return;
    const graphics = this.add.graphics().setDepth(116);
    const lawnGraphics = this.add.graphics().setDepth(20);
    this.farmingVisuals = graphics;
    this.lawnVisuals = lawnGraphics;

    state.allotment.beds.forEach((bed, index) => {
      const x = 1090 + (index % 2) * 260;
      const y = 2170 + Math.floor(index / 2) * 116;
      graphics.fillStyle(bed.unlocked ? 0x765638 : 0x77756b, 1);
      graphics.fillRoundedRect(x, y, 225, 82, 11);
      graphics.lineStyle(4, bed.status === "ready" ? 0xe7bd4e : 0xd0b37a, 0.9);
      graphics.strokeRoundedRect(x, y, 225, 82, 11);
      if (bed.cropId) {
        const crop = FARMING_CROPS[bed.cropId];
        const progress = bed.status === "ready" ? 1 : Phaser.Math.Clamp(bed.growthMinutes / crop.growMinutes, 0, 0.99);
        const stage = [...CROP_STAGE_VISUALS].reverse().find((entry) => progress >= entry.progress) || CROP_STAGE_VISUALS[0];
        const count = stage.id === "ready" ? 6 : stage.id === "seed" ? 4 : stage.id === "sprout" ? 3 : 5;
        for (let plant = 0; plant < count; plant += 1) {
          const plantIcon = stage.id === "seed" ? "•" : stage.id === "sprout" ? "🌱" : stage.id === "flowering" ? `🌼${crop.icon}` : crop.icon;
          const label = this.add.text(x + 28 + plant * 32, y + 41 + (plant % 2) * 6, plantIcon, { fontSize: stage.id === "ready" ? "24px" : stage.id === "seed" ? "20px" : "18px" }).setOrigin(0.5).setDepth(118);
          label.setData("cropStage", stage.id);
          setSpriteAiLabelHint(label, { id: `${stage.assetId}.${crop.id}`, label: `${crop.label} ${stage.id} stage`, kind: "crop-stage" });
          this.farmingLabels.push(label);
        }
      } else if (!bed.unlocked) {
        this.farmingLabels.push(this.add.text(x + 112, y + 41, "🔒", { fontSize: "24px" }).setOrigin(0.5).setDepth(118));
      }
    });

    for (const tree of state.orchard.trees) {
      const progress = tree.status === "growing" ? tree.growthMinutes / ORCHARD_CONFIG.maturityMinutes : 1;
      const stageId = tree.status === "growing" ? progress < 0.35 ? "sapling" : progress < 0.72 ? "young" : "mature" : tree.availableFruit ? "fruiting" : "picked";
      const stage = ORCHARD_STAGE_VISUALS.find(({ id }) => id === stageId);
      const icon = stageId === "sapling" ? "🌱" : stageId === "young" ? "🌿" : stageId === "fruiting" ? "🌳🍎" : "🌳";
      const label = this.add.text(tree.x, tree.y, icon, { fontSize: tree.status === "growing" ? `${Math.round(30 + progress * 22)}px` : "58px" }).setOrigin(0.5).setDepth(118 + tree.y / 100);
      label.setData("orchardTreeId", tree.id);
      label.setData("orchardStage", stageId);
      setSpriteAiLabelHint(label, { id: stage.assetId, label: `Apple tree ${stageId} stage`, kind: "orchard-stage" });
      this.farmingLabels.push(label);
    }
    for (const plot of LAWN_PLOTS) {
      if (!plot.active) continue;
      const lawn = state.lawns[plot.id];
      const stage = lawnVisualStage(lawn.grassHeight);
      const yard = plot.yard || { x: plot.x - 92, y: plot.y - 52, width: 184, height: 104 };
      const colors = [0x96cf78, 0x82bf66, 0x70ab58, 0x5f964d];
      lawnGraphics.fillStyle(colors[stage], 0.92);
      lawnGraphics.fillRoundedRect(yard.x + 7, yard.y + 7, yard.width - 14, yard.height - 14, 18);
      if (lawn.grassHeight > 12) {
        const tuftCount = Math.min(130, Math.round(10 + lawn.grassHeight * 1.15));
        lawnGraphics.lineStyle(2.2, lawn.grassHeight >= 70 ? 0x265626 : 0x356f2e, 0.82);
        for (let index = 0; index < tuftCount; index += 1) {
          const tx = yard.x + 18 + deterministicUnit(plot.id, index * 2) * (yard.width - 36);
          const ty = yard.y + 20 + deterministicUnit(plot.id, index * 2 + 1) * (yard.height - 40);
          const length = 4 + lawn.grassHeight * 0.19 + deterministicUnit(plot.id, index + 200) * 5;
          const lean = -3 + deterministicUnit(plot.id, index + 400) * 6;
          lawnGraphics.lineBetween(tx, ty, tx + lean, ty - length);
        }
      }
      if (lawn.weedPressure >= 18) {
        const patches = Math.min(28, Math.round(3 + lawn.weedPressure * 0.24));
        for (let index = 0; index < patches; index += 1) {
          const wx = yard.x + 20 + deterministicUnit(`${plot.id}:weed`, index * 2) * (yard.width - 40);
          const wy = yard.y + 22 + deterministicUnit(`${plot.id}:weed`, index * 2 + 1) * (yard.height - 44);
          const radius = 2.5 + lawn.weedPressure * 0.035;
          lawnGraphics.fillStyle(lawn.weedPressure >= 55 ? 0x55783f : 0x6eaa55, 0.62);
          lawnGraphics.fillCircle(wx, wy, radius);
          if (lawn.weedPressure >= 38 && index % 4 === 0) {
            lawnGraphics.fillStyle(0xe4d269, 0.88);
            lawnGraphics.fillCircle(wx + 2, wy - radius, 2.2);
          }
        }
      }
      lawnGraphics.setData(`lawnStage:${plot.id}`, stage);
      const semanticLawn = this.add.zone(plot.x, plot.y, yard.width, yard.height).setDepth(21);
      semanticLawn.setData("lawnId", plot.id);
      semanticLawn.setData("lawnStage", stage);
      semanticLawn.setData("grassHeight", lawn.grassHeight);
      semanticLawn.setData("weedPressure", lawn.weedPressure);
      setSpriteAiLabelHint(semanticLawn, { id: `world.${plot.id}.stage-${stage}`, label: `${plot.title} growth stage ${stage}`, kind: "lawn" });
      this.farmingLabels.push(semanticLawn);
      if (lawnNeedsCare(lawn)) this.farmingLabels.push(this.add.text(plot.x, plot.y - 58, "🌾 JOB", { color: "#294637", backgroundColor: "rgba(255,249,223,.9)", fontSize: "12px", fontStyle: "bold", padding: { x: 6, y: 3 } }).setOrigin(0.5).setDepth(119));
    }
  }

  drawSouthMeadow() {
    const { bounds } = SOUTH_MEADOW;
    const meadow = this.add.graphics().setDepth(14);
    meadow.fillStyle(0x9dce73, 0.5);
    meadow.fillRoundedRect(bounds.x, bounds.y, bounds.width, bounds.height, 34);
    meadow.lineStyle(7, 0xf1e3b5, 0.92);
    meadow.strokeRoundedRect(bounds.x, bounds.y, bounds.width, bounds.height, 34);
    meadow.lineStyle(3, 0x6d9256, 0.82);
    meadow.strokeRoundedRect(bounds.x + 9, bounds.y + 9, bounds.width - 18, bounds.height - 18, 26);
    const flowers = [[270, 2190], [470, 2260], [760, 2185], [805, 2470], [530, 2510], [330, 2450]];
    for (const [x, y] of flowers) this.add.text(x, y, "🌼", { fontSize: "20px" }).setOrigin(0.5).setDepth(15);
    this.add.text(bounds.x + bounds.width / 2, bounds.y + 30, "🌿 SOUTH MEADOW · ADOPTED COMPANIONS", {
      color: "#315e3f", fontFamily: "system-ui, sans-serif", fontSize: "15px", fontStyle: "bold",
      backgroundColor: "rgba(255,249,223,.88)", padding: { x: 9, y: 5 },
    }).setOrigin(0.5).setDepth(46);
  }

  drawFishingSpots() {
    for (const spot of [...FISHING_SPOTS, MAGNET_FISHING_SPOT]) {
      const marker = this.add.container(spot.world.x, spot.world.y).setDepth(124);
      const pulse = this.add.circle(0, 0, 32, 0xffef93, 0.16).setStrokeStyle(5, 0xffef93, 0.78);
      const post = this.add.rectangle(0, 15, 10, 46, 0x765238).setStrokeStyle(2, 0x294637, 0.7);
      const sign = this.add.rectangle(0, -16, 59, 45, 0xfff1bd).setStrokeStyle(4, 0x294637, 0.9);
      const icon = this.add.text(0, -17, spot.icon, { fontFamily: "Apple Color Emoji, system-ui", fontSize: "25px" }).setOrigin(0.5);
      marker.add([pulse, post, sign, icon]);
      this.tweens.add({ targets: pulse, scale: 1.25, alpha: 0.05, duration: 1000, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    }
  }

  drawRiverCampaignMarker() {
    const { x, y } = RIVER_CLEAROUT.marker;
    const marker = this.add.container(x, y).setDepth(126);
    const pulse = this.add.circle(0, 0, 43, 0x8fe6d1, 0.2).setStrokeStyle(6, 0xd9fff4, 0.88);
    const sign = this.add.rectangle(0, -2, 72, 54, 0xeefbf5).setStrokeStyle(4, 0x173f50, 0.95);
    const icon = this.add.text(0, -4, "🌊♻️", { fontFamily: "Apple Color Emoji, system-ui", fontSize: "24px" }).setOrigin(0.5);
    const label = this.add.text(0, -50, "RIVER CLEAR-OUT", {
      color: "#173f50", backgroundColor: "rgba(238,251,245,.94)", fontFamily: "system-ui, sans-serif",
      fontSize: "11px", fontStyle: "bold", padding: { x: 7, y: 4 },
    }).setOrigin(0.5);
    marker.add([pulse, sign, icon, label]);
    this.tweens.add({ targets: pulse, scale: 1.24, alpha: 0.04, duration: 1050, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
  }

  drawCleanupTarget() {
    const firstJobAvailable = this.cleanupService?.isAvailable(COMMONS_RUBBISH_JOB.id);
    const { x, y } = COMMONS_RUBBISH_JOB.world;
    const layer = this.add.graphics().setDepth(118);
    const pieces = firstJobAvailable ? [
      [-34, -12, 0x75b8c5], [4, -22, 0xa6acb0], [37, -4, 0xc99167],
      [-23, 22, 0xd66b70], [14, 19, 0xd6d1bd], [42, 28, 0xe9e4d6],
    ] : [[-25, -4, 0xe9d8a9], [0, -12, 0xe9d8a9], [25, -4, 0xe9d8a9]];
    for (const [dx, dy, color] of pieces) {
      layer.fillStyle(0x294637, 0.2);
      layer.fillEllipse(x + dx, y + dy + 7, 25, 10);
      layer.fillStyle(color, 1);
      layer.fillRoundedRect(x + dx - 9, y + dy - 7, 18, 15, 3);
      layer.lineStyle(2, 0x294637, 0.65);
      layer.strokeRoundedRect(x + dx - 9, y + dy - 7, 18, 15, 3);
    }
    this.add.text(x, y - 57, firstJobAvailable ? "🧹 CLEANUP" : "🧹 750 LEVELS", {
      color: "#294637",
      fontFamily: "system-ui, sans-serif",
      fontSize: "13px",
      fontStyle: "bold",
      backgroundColor: "rgba(255, 249, 223, 0.9)",
      padding: { x: 7, y: 4 },
    }).setOrigin(0.5).setDepth(119);
  }

  drawBeachCleanupTarget() {
    const dirty = this.beachCleanup?.isTownJobAvailable?.();
    const { x, y } = BEACH_CLEANUP.marker;
    const marker = this.add.container(x, y).setDepth(128);
    const pulse = this.add.circle(0, 0, 42, dirty ? 0xffd05e : 0x9fe7db, 0.2).setStrokeStyle(5, dirty ? 0xffed9e : 0xe8fff9, 0.9);
    const sign = this.add.rectangle(0, -2, 78, 56, 0xfff1bd).setStrokeStyle(4, 0x5b472b, 0.95);
    const icon = this.add.text(0, -4, dirty ? "🏖️🧹" : "🏖️✨", { fontFamily: "Apple Color Emoji, system-ui", fontSize: "23px" }).setOrigin(0.5);
    const label = this.add.text(0, -53, dirty ? "BEACH CLEANUP" : "750 BEACHES", { color: "#5b472b", backgroundColor: "rgba(255,249,223,.94)", fontFamily: "system-ui, sans-serif", fontSize: "11px", fontStyle: "bold", padding: { x: 7, y: 4 } }).setOrigin(0.5);
    marker.add([pulse, sign, icon, label]);
    this.tweens.add({ targets: pulse, scale: 1.24, alpha: 0.04, duration: 1080, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    if (dirty) {
      for (const [dx, dy, piece] of [[-92, 23, "🥤"], [-55, 48, "🧴"], [72, 35, "🧦"], [105, 5, "📦"]]) {
        this.add.text(x + dx, y + dy, piece, { fontFamily: "Apple Color Emoji, system-ui", fontSize: "20px" }).setOrigin(0.5).setDepth(116);
      }
    }
  }

  drawPlaygroundPowerwashTarget() {
    const dirty = this.playgroundPowerwash?.isTownJobAvailable?.();
    const { x, y } = PLAYGROUND_POWERWASH.marker;
    const marker = this.add.container(x, y).setDepth(131);
    const pulse = this.add.circle(0, 0, 45, dirty ? 0x7eb244 : 0x66d5eb, 0.2).setStrokeStyle(5, dirty ? 0xb7d66e : 0xd8fbff, 0.9);
    const sign = this.add.rectangle(0, -3, 82, 58, 0xffedb8).setStrokeStyle(4, 0x3d4b2d, 0.95);
    const icon = this.add.text(0, -5, dirty ? "🛝💦" : "🛝✨", { fontFamily: "Apple Color Emoji, system-ui", fontSize: "23px" }).setOrigin(0.5);
    const label = this.add.text(0, -56, dirty ? "POWER WASH" : "750 WASHES", { color: "#314326", backgroundColor: "rgba(255,249,223,.94)", fontFamily: "system-ui, sans-serif", fontSize: "11px", fontStyle: "bold", padding: { x: 7, y: 4 } }).setOrigin(0.5);
    marker.add([pulse, sign, icon, label]);
    this.tweens.add({ targets: pulse, scale: 1.24, alpha: 0.04, duration: 1080, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    if (dirty) {
      const grime = this.add.graphics().setDepth(117);
      grime.fillStyle(0x3d542b, 0.72);
      for (const [dx, dy, radius] of [[-82, 15, 19], [-45, 43, 15], [54, 35, 21], [92, 5, 14], [15, 54, 12]]) grime.fillCircle(x + dx, y + dy, radius);
    }
  }

  drawLabels() {
    for (const district of DISTRICTS) {
      this.add.text(district.x + 12, district.y + 10, district.title, {
        color: "#315e3f",
        fontFamily: "system-ui, sans-serif",
        fontSize: "15px",
        fontStyle: "bold",
        letterSpacing: 1.5,
      }).setAlpha(0.78).setDepth(45);
    }
    this.add.text(2560, 70, "WILLOW RIVER", {
      color: "#e9fbff",
      fontFamily: "system-ui, sans-serif",
      fontSize: "18px",
      fontStyle: "bold",
      letterSpacing: 2,
      stroke: "#3a879d",
      strokeThickness: 5,
    }).setOrigin(0.5).setAngle(90).setDepth(40);
  }

  refreshCustomResident() {
    const state = this.customResident?.getSnapshot?.();
    const resident = this.customResident?.getResident?.();
    const homeSignature = state?.home ? `${state.home.level}:${state.home.wallColor}:${state.home.roofStyle}:${state.home.roofColor}:${state.created}` : null;
    if (homeSignature && homeSignature !== this.personalHomeSignature) {
      this.personalHomeSignature = homeSignature;
      const house = HOUSES.find((entry) => entry.id === PERSONAL_HOME_RENDER_HOUSE_ID);
      if (house) this.drawHouse(house);
    }
    if (!resident) {
      this.customResidentCharacter?.destroy();
      this.customResidentCharacter = null;
      return;
    }
    if (!this.customResidentCharacter) this.customResidentCharacter = new NpcCharacter(this, resident);
    this.customResidentCharacter.applyResident(resident, 0, true);
  }

  locateCustomResident() {
    const result = this.customResident?.locate?.();
    if (!result?.ok) return result || { ok: false, message: "Your resident is not ready." };
    this.cameras.main.stopFollow();
    this.cameras.main.pan(result.location.x, result.location.y, 520, "Cubic.easeOut");
    this.setZoom(Math.max(this.cameras.main.zoom, 0.9));
    this.locatorBeacon?.destroy();
    this.locatorBeacon = this.add.circle(result.location.x, result.location.y - 8, 34, 0xffef83, 0.16)
      .setStrokeStyle(6, 0xfff4a6, 0.95)
      .setDepth(500);
    this.tweens.add({ targets: this.locatorBeacon, scale: 1.75, alpha: 0, duration: 1400, ease: "Cubic.easeOut", onComplete: () => this.locatorBeacon?.destroy() });
    const gameElement = document.querySelector("#game");
    if (gameElement) gameElement.dataset.residentLocated = "true";
    return { ...result, cameraRecentred: true };
  }

  startCustomResidentControl() {
    const result = this.customResident?.beginControl?.({ x: this.player.x, y: this.player.y, facing: this.player.direction });
    if (!result?.ok) return result || { ok: false, message: "Your resident is not ready." };
    this.refreshCustomResident();
    this.player.setMovement(0, 0, false);
    this.player.setVisible(false);
    this.shadow.setVisible(false);
    this.customResidentCharacter?.setVisible(true);
    this.cameras.main.startFollow(this.customResidentCharacter, true, 0.12, 0.12);
    this.movement?.setEnabled(true);
    this.interactions?.setEnabled(true);
    this.townBrowseMode = false;
    document.body.dataset.residentControl = "true";
    this.updateStatus();
    return { ...result, directControl: true };
  }

  endCustomResidentControl() {
    const result = this.customResident?.endControl?.();
    if (!result?.returnPlayer) return result || { ok: false, message: "Resident control is not active." };
    this.player.setPosition(result.returnPlayer.x, result.returnPlayer.y);
    this.player.direction = result.returnPlayer.facing;
    this.player.setVisible(false);
    this.shadow.setVisible(false);
    this.customResidentCharacter?.setControlMovement(0, 0, false);
    this.cameras.main.stopFollow();
    this.cameras.main.centerOn(this.customResidentCharacter?.x || result.returnPlayer.x, this.customResidentCharacter?.y || result.returnPlayer.y);
    this.movement?.setEnabled(false);
    this.interactions?.setEnabled(false);
    this.townBrowseMode = true;
    document.body.dataset.residentControl = "false";
    this.updateStatus();
    return { ...result, playerRestored: true };
  }

  activeCharacter() {
    return this.customResident?.getSnapshot?.().controlling && this.customResidentCharacter
      ? this.customResidentCharacter
      : this.player;
  }

  activePosition() {
    const actor = this.activeCharacter();
    return { x: actor.x, y: actor.y };
  }

  observerPosition() {
    if (this.customResident?.getSnapshot?.().controlling) return this.activePosition();
    if (this.customResidentCharacter?.visible) return { x: this.customResidentCharacter.x, y: this.customResidentCharacter.y };
    return { x: this.player.x, y: this.player.y };
  }

  renderTownPlacements() {
    for (const visual of this.placedObjectVisuals?.values?.() || []) visual.destroy();
    this.placedObjectVisuals = new Map();
    for (const object of this.townPlacement?.getObjects?.() || []) {
      const visual = createTownPlacedObject(this, object, {
        onSelect: (objectId) => this.openPlacedObjectManager(objectId),
      });
      if (visual) this.placedObjectVisuals.set(object.id, visual);
    }
    this.renderPlacementPreview();
  }

  renderPlacementPreview() {
    this.placementPreviewVisual?.destroy();
    this.placementPreviewVisual = null;
    const active = this.townPlacement?.getSnapshot?.().active;
    const orchardPlacement = this.farming?.getPlacementSnapshot?.();
    const orchardActive = orchardPlacement?.active;
    const draft = active || (orchardActive ? { ...orchardActive, itemId: ORCHARD_CONFIG.placementItemId, rotation: 0 } : null);
    if (!draft || !Number.isFinite(draft.previewX) || !Number.isFinite(draft.previewY)) return;
    const validation = active
      ? this.townPlacement.validate(active.itemId, active.previewX, active.previewY, { ignoreObjectId: active.existingObjectId })
      : this.farming.validateAppleTreePlacement(draft.previewX, draft.previewY);
    this.placementPreviewVisual = createTownPlacedObject(this, {
      id: "placement-preview",
      itemId: draft.itemId,
      x: draft.previewX,
      y: draft.previewY,
      rotation: draft.rotation,
    }, { preview: true, valid: validation.ok });
  }

  placementInteractables() {
    const publicBins = (this.npcTownLife?.getPublicBins?.() || []).map((bin) => ({
      id: `public-bin-${bin.id}`,
      kind: "public-bin",
      x: bin.x,
      y: bin.y,
      radius: 72,
      icon: bin.tipped ? "⚠️" : bin.fill >= bin.capacity ? "🚮" : "🗑️",
      label: bin.tipped ? `Tipped bin at ${bin.district}` : `${bin.district} public bin`,
      detail: bin.tipped ? `${bin.spillIds.length} spilled item${bin.spillIds.length === 1 ? "" : "s"} · residents cannot use it` : `${bin.fill}/${bin.capacity} full · residents use this bin`,
      onActivate: () => this.renderInteractionPrompt({ icon: "🗑️", label: bin.label, detail: bin.tipped ? "Residents may help right it after the spill is cleaned." : `${bin.fill} of ${bin.capacity} spaces are filled.` }),
    }));
    const placed = (this.townPlacement?.getObjects?.() || []).map((object) => ({
      id: `manage-${object.id}`,
      kind: "placed-object",
      x: object.x,
      y: object.y,
      radius: Math.max(76, placeableFootprintFor(object.item) + 30),
      icon: object.item.icon || "✨",
      label: `Manage ${object.item.name}`,
      detail: "Move, rotate or return this item to inventory",
      onActivate: () => this.openPlacedObjectManager(object.id),
    }));
    const trees = (this.farming?.getSnapshot?.().orchard?.trees || []).map((tree, index) => ({
      id: `orchard-${tree.id}`,
      kind: "apple-tree",
      x: tree.x,
      y: tree.y,
      radius: 78,
      icon: tree.status === "growing" ? "🌱" : tree.availableFruit ? "🍎" : "🌳",
      label: tree.availableFruit ? `Harvest Apple Tree ${index + 1}` : `Check Apple Tree ${index + 1}`,
      detail: tree.status === "growing" ? "This sapling is still growing" : tree.availableFruit ? "One apple is ready" : "Producing its next apple",
      onActivate: () => this.openFarming("orchard", tree.id),
    }));
    return [...publicBins, ...placed, ...trees];
  }

  renderNpcPublicBins() {
    const bins = this.npcTownLife?.getPublicBins?.() || [];
    const signature = bins.map((bin) => `${bin.id}:${bin.fill}:${bin.tipped}:${bin.spillIds.length}`).join("|");
    if (signature === this.publicBinSignature) return;
    this.publicBinSignature = signature;
    this.publicBinVisuals.forEach((visual) => visual.destroy());
    this.publicBinVisuals = bins.map((bin) => {
      const container = this.add.container(bin.x, bin.y).setDepth(176 + bin.y / 10);
      container.setData("collectionIdentity", `public:${bin.id}`);
      const shadow = this.add.ellipse(0, 14, 34, 13, 0x20382c, 0.25);
      const body = this.add.rectangle(bin.tipped ? 8 : 0, bin.tipped ? 9 : 0, 25, 33, bin.tipped ? 0x8b6f54 : 0x426b58).setStrokeStyle(3, 0x294637, 0.9);
      if (bin.tipped) body.setRotation(Math.PI / 2.5);
      const lid = this.add.rectangle(bin.tipped ? -3 : 0, bin.tipped ? 0 : -18, 31, 7, 0x294637);
      if (bin.tipped) lid.setRotation(Math.PI / 2.5);
      const fill = this.add.text(0, -36, `${bin.fill}/${bin.capacity}`, { color: "#294637", fontFamily: "system-ui", fontSize: "10px", fontStyle: "bold", backgroundColor: "rgba(255,253,241,.92)", padding: { x: 4, y: 2 } }).setOrigin(0.5);
      const warning = this.add.text(18, -23, bin.tipped ? "⚠️" : bin.fill >= bin.capacity ? "🚫" : "", { fontSize: "14px" }).setOrigin(0.5);
      container.add([shadow, body, lid, fill, warning]);
      return container;
    });
  }

  refreshMunicipalCollectionPresentation() {
    const presentation = this.municipalCollection?.getPresentation?.() || { active: false, hiddenIdentity: null };
    this.municipalCollectionVisual?.apply?.(presentation);
    for (const visual of this.publicBinVisuals || []) {
      visual.setVisible(visual.getData("collectionIdentity") !== presentation.hiddenIdentity);
    }
    for (const [objectId, visual] of this.placedObjectVisuals || []) {
      visual.setVisible(`placed:${objectId}` !== presentation.hiddenIdentity);
    }
    return presentation;
  }

  refreshPlacementInteractables() {
    this.interactions?.setInteractables([...this.baseInteractables, ...this.environmentInteractables(), ...this.placementInteractables()]);
  }

  environmentInteractables() {
    const land = (this.livingEnvironment?.getLandJobs?.() || []).map((job) => ({
      id: `environment-${job.id}`,
      kind: "environment-waste-job",
      x: job.world.x,
      y: job.world.y,
      radius: job.world.interactionRadius,
      icon: "♻️",
      label: `Collect ${job.items.length} pieces of rubbish`,
      detail: `${job.title} · persistent until cleaned`,
      onActivate: () => this.startWasteCollection(job.id),
    }));
    const river = (this.livingEnvironment?.getRiverJobs?.() || []).map((job) => ({
      id: `environment-${job.id}`,
      kind: "environment-river-job",
      x: job.position.x,
      y: job.position.y,
      radius: 94,
      icon: "🌊",
      label: `Clear ${job.title}`,
      detail: `${job.count} persistent river item${job.count === 1 ? "" : "s"} · pollution ${job.pollution}/3`,
      onActivate: () => this.enterRiverClearout(job.id),
    }));
    return [...land, ...river];
  }

  renderLivingEnvironment() {
    for (const visual of this.environmentVisuals || []) visual.destroy();
    this.environmentVisuals = [];
    const state = this.livingEnvironment?.getSnapshot?.();
    if (!state) return;
    for (const item of state.land.items.filter((entry) => entry.active)) {
      const presentation = RUBBISH_PRESENTATION[item.type] || RUBBISH_PRESENTATION.wrapper;
      const stain = this.add.ellipse(item.x, item.y + 6, 38, 18, 0x765c42, 0.2).setStrokeStyle(2, 0x5b4633, 0.18).setDepth(119 + item.y / 100);
      const shadow = this.add.ellipse(item.x, item.y + 9, 28, 10, 0x263d2d, 0.24).setDepth(120 + item.y / 100);
      const icon = this.add.text(item.x, item.y, presentation.icon, { fontFamily: "Apple Color Emoji, system-ui", fontSize: "18px" }).setOrigin(0.5).setDepth(121 + item.y / 100);
      setSpriteAiLabelHint(stain, { id: `world.ground-stain.${item.id}`, label: `${item.type} ground stain`, kind: "environment-effect" });
      setSpriteAiLabelHint(icon, { id: `world.rubbish.${item.type}.${item.id}`, label: `${item.type} town rubbish`, kind: "environment-rubbish" });
      this.environmentVisuals.push(stain, shadow, icon);
    }
    for (const item of state.river.items) {
      const position = riverItemPosition(item);
      const presentation = RUBBISH_PRESENTATION[item.type] || RUBBISH_PRESENTATION.wrapper;
      const pollution = this.add.ellipse(position.x, position.y + 5, item.status === "stuck" ? 52 : 43, item.status === "stuck" ? 21 : 17, item.status === "stuck" ? 0x805d36 : 0x7aaab0, item.status === "stuck" ? 0.31 : 0.18).setDepth(41 + position.y / 100);
      const ring = this.add.ellipse(position.x, position.y + 5, 34, 14, item.status === "stuck" ? 0x805d36 : 0xd9fbff, 0.38).setDepth(42 + position.y / 100);
      const icon = this.add.text(position.x, position.y, presentation.icon, { fontFamily: "Apple Color Emoji, system-ui", fontSize: "17px" }).setOrigin(0.5).setDepth(43 + position.y / 100);
      setSpriteAiLabelHint(pollution, { id: `world.river-pollution.${item.id}`, label: `${item.type} river pollution`, kind: "water-effect" });
      setSpriteAiLabelHint(icon, { id: `world.river-rubbish.${item.type}.${item.id}`, label: `${item.type} river rubbish`, kind: "environment-rubbish" });
      this.environmentVisuals.push(pollution, ring, icon);
    }
    const clean = state.cleanliness;
    if (!this.environmentBadge) this.environmentBadge = this.add.text(18, 64, "", { color: "#294637", backgroundColor: "rgba(255,249,223,.94)", fontFamily: "system-ui, sans-serif", fontSize: "13px", fontStyle: "bold", padding: { x: 9, y: 6 } }).setScrollFactor(0).setDepth(1200);
    this.environmentBadge.setText(`${clean.band === "calm" ? "✨" : "🌿"} Town care ${Math.round(clean.score)}% · ${clean.activeJobs} jobs`);
  }

  refreshLivingEnvironment(force = false) {
    const snapshot = this.livingEnvironment?.getSnapshot?.();
    if (!snapshot) return;
    const signature = JSON.stringify({ land: snapshot.land.items.filter((item) => item.active).map((item) => [item.id, Math.round(item.x), Math.round(item.y)]), river: snapshot.river.items.map((item) => [item.id, item.sectionId, Math.round(item.t * 100), item.status]), clean: Math.round(snapshot.cleanliness.score), jobs: snapshot.cleanliness.activeJobs });
    if (!force && signature === this.environmentSignature) return;
    this.environmentSignature = signature;
    this.renderLivingEnvironment();
    this.refreshPlacementInteractables();
  }

  setPlacementModeActive(active) {
    this.placementModeActive = Boolean(active);
    document.body.dataset.townPlacement = String(this.placementModeActive);
    this.worldSimulation?.setPaused?.("placement", this.placementModeActive);
    this.npcTownLife?.setPaused?.("placement", this.placementModeActive);
    const anotherOverlayOpen = document.body.dataset.modalOpen === "true" || Boolean(this.selectedPlacedObjectId);
    const controlsEnabled = !this.placementModeActive && !anotherOverlayOpen && !this.transitioning;
    this.movement?.setEnabled(controlsEnabled);
    this.interactions?.setEnabled(controlsEnabled);
    if (this.placementModeActive) {
      this.player?.setMovement(0, 0, false);
      this.customResidentCharacter?.setControlMovement(0, 0, false);
      this.renderInteractionPrompt(null);
    }
  }

  updatePlacementInterface(snapshot = this.townPlacement?.getSnapshot?.(), result = null) {
    const banner = document.querySelector("#town-placement-banner");
    if (!banner || !snapshot) return;
    const orchardPlacement = this.farming?.getPlacementSnapshot?.();
    const orchardActive = orchardPlacement?.active;
    const active = snapshot.active || (orchardActive ? { ...orchardActive, itemId: ORCHARD_CONFIG.placementItemId, rotation: 0, orchard: true } : null);
    banner.classList.toggle("hidden", !active);
    banner.setAttribute("aria-hidden", active ? "false" : "true");
    const count = document.querySelector("#town-placement-count");
    if (count) count.textContent = active?.orchard ? `${orchardPlacement.treeCount} / ${orchardPlacement.limit} apple trees` : `${snapshot.objects.length} / ${snapshot.limit} placed`;
    if (!active) {
      const rotate = document.querySelector("#town-placement-rotate");
      if (rotate) {
        rotate.disabled = false;
        rotate.classList.remove("hidden");
      }
      return;
    }
    const item = ITEM_CATALOG[active.itemId];
    const icon = document.querySelector("#town-placement-icon");
    const title = document.querySelector("#town-placement-title");
    const status = document.querySelector("#town-placement-status");
    const confirm = document.querySelector("#town-placement-confirm");
    const validation = Number.isFinite(active.previewX) && Number.isFinite(active.previewY)
      ? active.orchard
        ? this.farming.validateAppleTreePlacement(active.previewX, active.previewY)
        : this.townPlacement.validate(active.itemId, active.previewX, active.previewY, { ignoreObjectId: active.existingObjectId })
      : { ok: false, message: "Tap a clear position in town to preview it." };
    if (icon) icon.textContent = item?.icon || "✨";
    if (title) title.textContent = active.orchard ? "Plant Apple Sapling" : `${active.existingObjectId ? "Move" : "Place"} ${item?.name || "town item"}`;
    if (status) {
      status.textContent = result?.message || (validation.ok
        ? active.orchard ? "Clear open ground · this exact position will be saved" : `Clear position · ${Math.round((active.rotation * 180) / Math.PI)}° rotation`
        : validation.message);
      status.dataset.status = validation.ok ? "valid" : "invalid";
    }
    if (confirm) {
      confirm.disabled = !validation.ok;
      confirm.textContent = active.orchard ? "Plant sapling" : active.existingObjectId ? "Save move" : "Place";
    }
    const rotate = document.querySelector("#town-placement-rotate");
    if (rotate) {
      rotate.disabled = Boolean(active.orchard);
      rotate.classList.toggle("hidden", Boolean(active.orchard));
    }
  }

  handleTownPlacementChange(snapshot, result) {
    this.renderTownPlacements();
    this.refreshPlacementInteractables();
    this.setPlacementModeActive(Boolean(snapshot.active || this.farming?.getPlacementSnapshot?.().active));
    this.updatePlacementInterface(snapshot, result);
    this.refreshRestorationPresentation();
    if (result?.ok && ["object-placed", "object-moved", "object-stored"].includes(result.code)) this.closePlacedObjectManager();
  }

  handleFarmingChange(_snapshot, result) {
    this.drawFarmingAreas();
    this.renderPlacementPreview();
    this.refreshPlacementInteractables();
    const orchardActive = Boolean(this.farming?.getPlacementSnapshot?.().active);
    this.setPlacementModeActive(Boolean(this.townPlacement?.getSnapshot?.().active || orchardActive));
    this.updatePlacementInterface(this.townPlacement?.getSnapshot?.(), result);
  }

  beginTownPlacement(itemId, { existingObjectId = null } = {}) {
    if (this.transitioning) return { ok: false, message: "Wait for the town transition to finish." };
    if (this.farming?.getPlacementSnapshot?.().active) return { ok: false, message: "Finish planting the current apple sapling first." };
    if (this.customResident?.getSnapshot?.().controlling) return { ok: false, message: "Return to map view before placing town items." };
    this.closePlacedObjectManager();
    const { x, y } = this.activePosition();
    const facing = this.activeCharacter()?.direction || "down";
    const offsets = { up: [0, -115], down: [0, 115], left: [-115, 0], right: [115, 0] };
    const [offsetX, offsetY] = offsets[facing] || offsets.down;
    const started = this.townPlacement?.begin?.(itemId, {
      existingObjectId,
      previewX: existingObjectId ? null : x + offsetX,
      previewY: existingObjectId ? null : y + offsetY,
    }) || { ok: false, message: "Town placement is not ready." };
    if (!started.ok) return started;
    const active = this.townPlacement.getSnapshot().active;
    return this.townPlacement.preview(active.previewX, active.previewY);
  }

  previewTownPlacement(x, y) {
    if (!this.townPlacement?.getSnapshot?.().active) return { ok: false, message: "No placement is active." };
    return this.townPlacement.preview(
      Phaser.Math.Clamp(x, 0, WORLD.width),
      Phaser.Math.Clamp(y, 0, WORLD.height),
    );
  }

  nudgeTownPlacement(dx, dy) {
    const active = this.townPlacement?.getSnapshot?.().active;
    if (!active) return { ok: false, message: "No placement is active." };
    return this.previewTownPlacement((active.previewX || this.player.x) + dx, (active.previewY || this.player.y) + dy);
  }

  beginAppleTreePlacement() {
    if (this.transitioning) return { ok: false, message: "Wait for the town transition to finish." };
    if (this.townPlacement?.getSnapshot?.().active) return { ok: false, message: "Finish the current town placement first." };
    if (this.customResident?.getSnapshot?.().controlling) return { ok: false, message: "Return to map view before planting apple trees." };
    this.closePlacedObjectManager();
    const { x, y } = this.activePosition();
    const facing = this.activeCharacter()?.direction || "down";
    const offsets = { up: [0, -115], down: [0, 115], left: [-115, 0], right: [115, 0] };
    const [offsetX, offsetY] = offsets[facing] || offsets.down;
    const started = this.farming?.beginAppleTreePlacement?.({ previewX: x + offsetX, previewY: y + offsetY }) || { ok: false, message: "Apple-tree placement is not ready." };
    if (!started.ok) return started;
    return this.farming.previewAppleTreePlacement(x + offsetX, y + offsetY);
  }

  previewAppleTreePlacement(x, y) {
    if (!this.farming?.getPlacementSnapshot?.().active) return { ok: false, message: "No apple sapling placement is active." };
    return this.farming.previewAppleTreePlacement(Phaser.Math.Clamp(x, 0, WORLD.width), Phaser.Math.Clamp(y, 0, WORLD.height));
  }

  nudgeAppleTreePlacement(dx, dy) {
    const active = this.farming?.getPlacementSnapshot?.().active;
    if (!active) return { ok: false, message: "No apple sapling placement is active." };
    return this.previewAppleTreePlacement((active.previewX || this.player.x) + dx, (active.previewY || this.player.y) + dy);
  }

  openPlacedObjectManager(objectId) {
    if (this.placementModeActive || this.transitioning) return { ok: false, message: "Finish the current placement first." };
    const object = this.townPlacement?.getObject?.(objectId);
    if (!object) return { ok: false, message: "That town item could not be found." };
    this.selectedPlacedObjectId = objectId;
    const panel = document.querySelector("#placed-object-panel");
    panel?.classList.remove("hidden");
    panel?.setAttribute("aria-hidden", "false");
    const icon = document.querySelector("#placed-object-icon");
    const name = document.querySelector("#placed-object-name");
    const detail = document.querySelector("#placed-object-detail");
    if (icon) icon.textContent = object.item.icon || "✨";
    if (name) name.textContent = object.item.name;
    if (detail) detail.textContent = `${Math.round(object.x)}, ${Math.round(object.y)} · ${Math.round((object.rotation * 180) / Math.PI)}° · saved in Willowmere`;
    this.movement?.setEnabled(false);
    this.interactions?.setEnabled(false);
    this.player?.setMovement(0, 0, false);
    document.querySelector("#placed-object-move")?.focus();
    return { ok: true, object };
  }

  closePlacedObjectManager() {
    this.selectedPlacedObjectId = null;
    const panel = document.querySelector("#placed-object-panel");
    panel?.classList.add("hidden");
    panel?.setAttribute("aria-hidden", "true");
    this.setPlacementModeActive(Boolean(this.townPlacement?.getSnapshot?.().active));
  }

  moveSelectedPlacedObject() {
    const objectId = this.selectedPlacedObjectId;
    if (!objectId) return { ok: false, message: "Choose a placed item first." };
    const object = this.townPlacement.getObject(objectId);
    this.closePlacedObjectManager();
    return object ? this.beginTownPlacement(object.itemId, { existingObjectId: object.id }) : { ok: false, message: "That item no longer exists." };
  }

  storeSelectedPlacedObject() {
    const objectId = this.selectedPlacedObjectId;
    if (!objectId) return { ok: false, message: "Choose a placed item first." };
    const result = this.townPlacement.store(objectId);
    if (result.ok) this.closePlacedObjectManager();
    else {
      const detail = document.querySelector("#placed-object-detail");
      if (detail) detail.textContent = result.message || "The item could not be stored.";
    }
    return result;
  }

  bindInterface() {
    this.interactionButton = document.querySelector("#interaction-action");
    this.placementRotateButton = document.querySelector("#town-placement-rotate");
    this.placementConfirmButton = document.querySelector("#town-placement-confirm");
    this.placementCancelButton = document.querySelector("#town-placement-cancel");
    this.placedObjectMoveButton = document.querySelector("#placed-object-move");
    this.placedObjectStoreButton = document.querySelector("#placed-object-store");
    this.placedObjectCloseButton = document.querySelector("#placed-object-close");
    this.onInteraction = () => this.interactions.activateCurrent();
    this.onPlacementRotate = () => this.townPlacement?.getSnapshot?.().active ? this.townPlacement.rotate() : { ok: false };
    this.onPlacementConfirm = () => this.farming?.getPlacementSnapshot?.().active ? this.farming.confirmAppleTreePlacement() : this.townPlacement?.confirm?.();
    this.onPlacementCancel = () => this.farming?.getPlacementSnapshot?.().active ? this.farming.cancelAppleTreePlacement() : this.townPlacement?.cancel?.();
    this.onPlacedObjectMove = () => this.moveSelectedPlacedObject();
    this.onPlacedObjectStore = () => this.storeSelectedPlacedObject();
    this.onPlacedObjectClose = () => this.closePlacedObjectManager();
    this.onPlacementPointerDown = (pointer) => {
      if (!this.placementModeActive) return;
      if (this.farming?.getPlacementSnapshot?.().active) this.previewAppleTreePlacement(pointer.worldX, pointer.worldY);
      else this.previewTownPlacement(pointer.worldX, pointer.worldY);
    };
    this.onPlacementPointerMove = (pointer) => {
      if (!this.placementModeActive || !pointer.isDown) return;
      if (this.farming?.getPlacementSnapshot?.().active) this.previewAppleTreePlacement(pointer.worldX, pointer.worldY);
      else this.previewTownPlacement(pointer.worldX, pointer.worldY);
    };
    this.onPlacementKeyDown = (event) => {
      if (!this.placementModeActive) {
        if (event.key === "Escape" && this.selectedPlacedObjectId) this.closePlacedObjectManager();
        return;
      }
      const key = event.key.toLowerCase();
      const orchardActive = Boolean(this.farming?.getPlacementSnapshot?.().active);
      let handled = true;
      if (key === "r" && !orchardActive) this.townPlacement.rotate();
      else if (event.key === "Enter") orchardActive ? this.farming.confirmAppleTreePlacement() : this.townPlacement.confirm();
      else if (event.key === "Escape") orchardActive ? this.farming.cancelAppleTreePlacement() : this.townPlacement.cancel();
      else if (event.key === "ArrowUp") orchardActive ? this.nudgeAppleTreePlacement(0, -18) : this.nudgeTownPlacement(0, -18);
      else if (event.key === "ArrowDown") orchardActive ? this.nudgeAppleTreePlacement(0, 18) : this.nudgeTownPlacement(0, 18);
      else if (event.key === "ArrowLeft") orchardActive ? this.nudgeAppleTreePlacement(-18, 0) : this.nudgeTownPlacement(-18, 0);
      else if (event.key === "ArrowRight") orchardActive ? this.nudgeAppleTreePlacement(18, 0) : this.nudgeTownPlacement(18, 0);
      else handled = false;
      if (handled) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    this.interactionButton?.addEventListener("click", this.onInteraction);
    this.placementRotateButton?.addEventListener("click", this.onPlacementRotate);
    this.placementConfirmButton?.addEventListener("click", this.onPlacementConfirm);
    this.placementCancelButton?.addEventListener("click", this.onPlacementCancel);
    this.placedObjectMoveButton?.addEventListener("click", this.onPlacedObjectMove);
    this.placedObjectStoreButton?.addEventListener("click", this.onPlacedObjectStore);
    this.placedObjectCloseButton?.addEventListener("click", this.onPlacedObjectClose);
    this.input.on("pointerdown", this.onPlacementPointerDown);
    this.input.on("pointermove", this.onPlacementPointerMove);
    document.addEventListener("keydown", this.onPlacementKeyDown, true);
    this.updatePlacementInterface();
  }

  unbindInterface() {
    this.movement?.destroy();
    this.townCamera?.destroy();
    this.unsubscribeCustomResident?.();
    this.unsubscribeFarming?.();
    this.unsubscribeHouseRescue?.();
    this.unsubscribeAnimals?.();
    this.unsubscribeTownPlacement?.();
    this.unsubscribeLivingEnvironment?.();
    if (this.townPlacement?.getSnapshot?.().active) this.townPlacement.cancel();
    if (this.farming?.getPlacementSnapshot?.().active) this.farming.cancelAppleTreePlacement();
    this.interactionButton?.removeEventListener("click", this.onInteraction);
    this.placementRotateButton?.removeEventListener("click", this.onPlacementRotate);
    this.placementConfirmButton?.removeEventListener("click", this.onPlacementConfirm);
    this.placementCancelButton?.removeEventListener("click", this.onPlacementCancel);
    this.placedObjectMoveButton?.removeEventListener("click", this.onPlacedObjectMove);
    this.placedObjectStoreButton?.removeEventListener("click", this.onPlacedObjectStore);
    this.placedObjectCloseButton?.removeEventListener("click", this.onPlacedObjectClose);
    this.input.off("pointerdown", this.onPlacementPointerDown);
    this.input.off("pointermove", this.onPlacementPointerMove);
    document.removeEventListener("keydown", this.onPlacementKeyDown, true);
    this.placementPreviewVisual?.destroy();
    for (const visual of this.placedObjectVisuals?.values?.() || []) visual.destroy();
    for (const visual of this.environmentVisuals || []) visual.destroy();
    for (const visual of this.houseRescueVisuals || []) visual.destroy?.();
    this.lawnVisuals?.destroy?.();
    this.environmentBadge?.destroy();
    this.municipalCollectionVisual?.destroy?.();
    this.municipalCollectionVisual = null;
    document.body.dataset.townPlacement = "false";
    document.querySelector("#town-placement-banner")?.classList.add("hidden");
    document.querySelector("#town-placement-rotate")?.classList.remove("hidden");
    document.querySelector("#placed-object-panel")?.classList.add("hidden");
    this.worldSimulation?.setPaused?.("placement", false);
    this.npcTownLife?.setPaused?.("placement", false);
    this.renderInteractionPrompt(null);
    if (this.customResident?.getSnapshot?.().controlling) this.endCustomResidentControl();
  }

  setSceneInterface() {
    document.body.dataset.gameScene = this.scene.key;
    const badge = document.querySelector(".milestone-badge");
    const hint = document.querySelector("#control-hint");
    if (badge) badge.textContent = "OPTIONAL COMMERCE · MILESTONE 41";
    if (hint) hint.textContent = "Drag to explore · Pinch to zoom · Tap a place or resident";
  }

  startActivityScene(key, data) {
    return startLazyScene(this, key, data).catch((error) => {
      console.error(`Unable to load ${key}.`, error);
      this.transitioning = false;
      this.gameState?.updatePlayer?.({ scene: "TownScene", x: this.player.x, y: this.player.y, facing: this.player.direction });
      const controlling = Boolean(this.customResident?.getSnapshot?.().controlling);
      this.movement?.setEnabled?.(controlling);
      this.interactions?.setEnabled?.(controlling);
      this.cameras.main.fadeIn(160, 23, 43, 31);
      document.querySelector("#game")?.setAttribute("data-transition", "scene-load-recovered");
      return false;
    });
  }

  renderInteractionPrompt(interaction) {
    const prompt = document.querySelector("#interaction-prompt");
    const button = document.querySelector("#interaction-action");
    const detail = document.querySelector("#interaction-detail");
    if (!prompt || !button) return;
    prompt.classList.toggle("hidden", !interaction);
    prompt.setAttribute("aria-hidden", interaction ? "false" : "true");
    this.interactionHighlight?.setVisible(Boolean(interaction));
    if (interaction) {
      const diameter = Phaser.Math.Clamp((Number(interaction.radius) || 76) * 1.05, 58, 140);
      this.interactionHighlight?.setPosition(interaction.x, interaction.y).setDisplaySize(diameter, diameter * 0.48);
      button.textContent = `${interaction.icon || "✨"} ${interaction.label}`;
      if (detail) detail.textContent = interaction.detail || "Press E or Space";
    }
  }

  updateWorldObjectLighting(world) {
    const minutes = Number(world?.clockMinutes ?? 720);
    const night = minutes < 360 || minutes >= 1140;
    const weather = String(world?.weather?.current?.kind || "clear");
    const glow = night ? 0.9 : ["rain", "storm", "snow"].includes(weather) ? 0.32 : 0.08;
    for (const windowLight of this.townWindowLights || []) windowLight.setAlpha(glow);
    document.querySelector("#game")?.setAttribute("data-town-window-light", night ? "night" : weather === "clear" ? "day" : "weather-dim");
  }

  enterBakery() {
    if (this.transitioning) return { ok: false, reason: "A scene transition is already running." };
    if (this.customResident?.getSnapshot?.().controlling) return { ok: false, reason: "Return to map view before entering a building." };
    this.transitioning = true;
    this.movement.setEnabled(false);
    this.interactions.setEnabled(false);
    this.player.setMovement(0, 0, false);
    this.gameState?.updatePlayer({ scene: "BakeryScene", x: 640, y: 610, facing: "up" });
    document.querySelector("#game")?.setAttribute("data-transition", "entering-bakery");
    this.cameras.main.fadeOut(220, 23, 43, 31);
    this.time.delayedCall(240, () => {
      this.startActivityScene("BakeryScene", {
        returnPosition: { ...LITTLE_BAKERY.approach },
        returnFacing: "down",
        transitionCount: Number(this.entryData.transitionCount || 0) + 1,
      });
    });
    return { ok: true, targetScene: "BakeryScene" };
  }

  enterCafe() {
    if (this.transitioning) return { ok: false, reason: "A scene transition is already running." };
    if (this.customResident?.getSnapshot?.().controlling) return { ok: false, reason: "Return to map view before entering a building." };
    this.transitioning = true;
    this.movement.setEnabled(false);
    this.interactions.setEnabled(false);
    this.player.setMovement(0, 0, false);
    this.gameState?.updatePlayer({ scene: "CafeScene", x: 640, y: 610, facing: "up" });
    document.querySelector("#game")?.setAttribute("data-transition", "entering-cafe");
    this.cameras.main.fadeOut(220, 31, 29, 24);
    this.time.delayedCall(240, () => {
      this.startActivityScene("CafeScene", {
        returnPosition: { ...CORNER_CAFE.approach },
        returnFacing: "down",
        transitionCount: Number(this.entryData.transitionCount || 0) + 1,
      });
    });
    return { ok: true, targetScene: "CafeScene" };
  }

  enterMorningMug() {
    if (this.transitioning) return { ok: false, reason: "A scene transition is already running." };
    if (this.customResident?.getSnapshot?.().controlling) return { ok: false, reason: "Return to map view before entering a building." };
    this.transitioning = true;
    this.movement.setEnabled(false);
    this.interactions.setEnabled(false);
    this.player.setMovement(0, 0, false);
    this.gameState?.updatePlayer({ scene: "MorningMugScene", x: 640, y: 610, facing: "up" });
    document.querySelector("#game")?.setAttribute("data-transition", "entering-morning-mug");
    this.cameras.main.fadeOut(220, 30, 52, 53);
    this.time.delayedCall(240, () => {
      this.startActivityScene("MorningMugScene", {
        returnPosition: { ...MORNING_MUG.approach },
        returnFacing: "down",
        transitionCount: Number(this.entryData.transitionCount || 0) + 1,
      });
    });
    return { ok: true, targetScene: "MorningMugScene" };
  }

  enterRiversideKitchen() {
    if (this.transitioning) return { ok: false, reason: "A scene transition is already running." };
    if (this.customResident?.getSnapshot?.().controlling) return { ok: false, reason: "Return to map view before entering a building." };
    this.transitioning = true;
    this.movement.setEnabled(false);
    this.interactions.setEnabled(false);
    this.player.setMovement(0, 0, false);
    this.gameState?.updatePlayer({ scene: "RiversideKitchenScene", x: 640, y: 610, facing: "up" });
    document.querySelector("#game")?.setAttribute("data-transition", "entering-riverside-kitchen");
    this.cameras.main.fadeOut(220, 58, 35, 28);
    this.time.delayedCall(240, () => {
      this.startActivityScene("RiversideKitchenScene", {
        returnPosition: { ...RIVERSIDE_KITCHEN.approach },
        returnFacing: "down",
        transitionCount: Number(this.entryData.transitionCount || 0) + 1,
      });
    });
    return { ok: true, targetScene: "RiversideKitchenScene" };
  }

  enterSouthShoreScoops() {
    if (this.transitioning) return { ok: false, reason: "A scene transition is already running." };
    if (this.customResident?.getSnapshot?.().controlling) return { ok: false, reason: "Return to map view before entering a building." };
    this.transitioning = true;
    this.movement.setEnabled(false);
    this.interactions.setEnabled(false);
    this.player.setMovement(0, 0, false);
    this.gameState?.updatePlayer({ scene: "SouthShoreScoopsScene", x: 640, y: 610, facing: "up" });
    document.querySelector("#game")?.setAttribute("data-transition", "entering-south-shore-scoops");
    this.cameras.main.fadeOut(220, 40, 91, 103);
    this.time.delayedCall(240, () => {
      this.startActivityScene("SouthShoreScoopsScene", {
        returnPosition: { ...SOUTH_SHORE_SCOOPS.approach },
        returnFacing: "down",
        transitionCount: Number(this.entryData.transitionCount || 0) + 1,
      });
    });
    return { ok: true, targetScene: "SouthShoreScoopsScene" };
  }

  enterRiverClearout(environmentTargetId = null) {
    if (this.transitioning) return { ok: false, reason: "A scene transition is already running." };
    if (this.customResident?.getSnapshot?.().controlling) return { ok: false, reason: "Return to map view before starting River Clear-Out." };
    this.onboarding?.recordTutorial?.("river");
    this.transitioning = true;
    this.movement.setEnabled(false);
    this.interactions.setEnabled(false);
    this.player.setMovement(0, 0, false);
    this.gameState?.updatePlayer({ scene: "RiverClearoutScene", x: 640, y: 610, facing: "up" });
    document.querySelector("#game")?.setAttribute("data-transition", "entering-river-clearout");
    this.cameras.main.fadeOut(220, 24, 55, 66);
    this.time.delayedCall(240, () => {
      this.startActivityScene("RiverClearoutScene", {
        returnPosition: { ...RIVER_CLEAROUT.approach },
        returnFacing: "down",
        environmentTargetId,
        transitionCount: Number(this.entryData.transitionCount || 0) + 1,
      });
    });
    return { ok: true, targetScene: "RiverClearoutScene" };
  }

  enterHouseRescue(houseId) {
    if (this.transitioning) return { ok: false, reason: "A scene transition is already running." };
    if (this.customResident?.getSnapshot?.().controlling) return { ok: false, reason: "Return to map view before starting House Rescue." };
    const home = this.houseRescue?.getSnapshot?.().homes?.[houseId];
    if (!home?.dirty) return { ok: false, reason: "This home is already clean." };
    const active = this.houseRescue?.getActiveSession?.();
    if (active && active.houseId !== houseId) return { ok: false, reason: `Your saved House Rescue is waiting at ${active.houseId.replace("house-", "Cottage ")}.` };
    const returnPosition = { x: this.player.x, y: this.player.y };
    this.transitioning = true;
    this.movement.setEnabled(false);
    this.interactions.setEnabled(false);
    this.player.setMovement(0, 0, false);
    this.gameState?.updatePlayer({ scene: "HouseRescueScene", x: 640, y: 610, facing: "up" });
    document.querySelector("#game")?.setAttribute("data-transition", "entering-house-rescue");
    this.cameras.main.fadeOut(220, 53, 42, 35);
    this.time.delayedCall(240, () => {
      this.startActivityScene("HouseRescueScene", {
        houseId,
        returnPosition,
        returnFacing: this.player.direction,
        transitionCount: Number(this.entryData.transitionCount || 0) + 1,
      });
    });
    return { ok: true, targetScene: "HouseRescueScene", houseId };
  }

  enterHouseInterior(houseId, { focusFurnitureId = null } = {}) {
    if (this.transitioning) return { ok: false, reason: "A scene transition is already running." };
    if (this.customResident?.getSnapshot?.().controlling) return { ok: false, reason: "Return to map view before entering a home." };
    this.houseRescue?.ensureFirstVisit?.(houseId);
    const interior = this.homeInteriors?.getInterior?.(houseId);
    if (!interior?.ok) return interior || { ok: false, reason: "That home could not be opened." };
    if (focusFurnitureId && houseId !== PERSONAL_HOME_RENDER_HOUSE_ID) return { ok: false, reason: "Custom furniture belongs in Meadowlight House." };
    const returnPosition = { x: this.player.x, y: this.player.y };
    const returnFacing = this.player.direction;
    this.transitioning = true;
    this.movement.setEnabled(false);
    this.interactions.setEnabled(false);
    this.player.setMovement(0, 0, false);
    this.gameState?.updatePlayer({ scene: "HouseInteriorScene", x: returnPosition.x, y: returnPosition.y, facing: returnFacing });
    document.querySelector("#game")?.setAttribute("data-transition", "entering-home-interior");
    this.cameras.main.fadeOut(220, 46, 39, 31);
    this.time.delayedCall(240, () => this.startActivityScene("HouseInteriorScene", {
      houseId,
      focusFurnitureId,
      returnPosition,
      returnFacing,
      transitionCount: Number(this.entryData.transitionCount || 0) + 1,
    }));
    return { ok: true, targetScene: "HouseInteriorScene", houseId, focusFurnitureId };
  }

  openShop(shopId) {
    if (this.transitioning) return { ok: false, reason: "A scene transition is already running." };
    if (this.customResident?.getSnapshot?.().controlling) return { ok: false, reason: "Return to map view before shopping." };
    if (!this.shopController) return { ok: false, reason: "The shop interface is not ready." };
    return this.shopController.open(shopId);
  }

  enterVillageGrocer({ focusItemId = null } = {}) {
    if (this.transitioning) return { ok: false, reason: "A scene transition is already running." };
    if (this.customResident?.getSnapshot?.().controlling) return { ok: false, reason: "Return to map view before entering Village Grocer." };
    this.transitioning = true;
    this.movement.setEnabled(false);
    this.interactions.setEnabled(false);
    this.player.setMovement(0, 0, false);
    const returnPosition = this.activePosition();
    const returnFacing = this.player.direction;
    this.gameState?.updatePlayer({ scene: "VillageGrocerScene", x: returnPosition.x, y: returnPosition.y, facing: returnFacing });
    document.querySelector("#game")?.setAttribute("data-transition", "entering-village-grocer");
    this.cameras.main.fadeOut(220, 29, 54, 36);
    this.time.delayedCall(240, () => this.startActivityScene("VillageGrocerScene", {
      returnPosition,
      returnFacing,
      focusItemId,
      transitionCount: Number(this.entryData.transitionCount || 0) + 1,
    }));
    return { ok: true, targetScene: "VillageGrocerScene", focusItemId };
  }

  openFreshMarket() {
    return this.openShop(FRESH_MARKET.id);
  }

  enterPawsWonders({ focusItemId = null } = {}) {
    if (this.transitioning) return { ok: false, reason: "A scene transition is already running." };
    if (this.customResident?.getSnapshot?.().controlling) return { ok: false, reason: "Return to map view before entering Paws & Wonders." };
    this.transitioning = true;
    this.movement.setEnabled(false);
    this.interactions.setEnabled(false);
    this.player.setMovement(0, 0, false);
    const returnPosition = this.activePosition();
    const returnFacing = this.player.direction;
    this.gameState?.updatePlayer({ scene: "PawsWondersScene", x: returnPosition.x, y: returnPosition.y, facing: returnFacing });
    document.querySelector("#game")?.setAttribute("data-transition", "entering-paws-wonders");
    this.cameras.main.fadeOut(220, 35, 57, 43);
    this.time.delayedCall(240, () => this.startActivityScene("PawsWondersScene", { returnPosition, returnFacing, focusItemId, transitionCount: Number(this.entryData.transitionCount || 0) + 1 }));
    return { ok: true, targetScene: "PawsWondersScene", focusItemId };
  }

  enterHarbourGeneral({ slot = 0, itemId = null } = {}) {
    if (this.transitioning) return { ok: false, reason: "A scene transition is already running." };
    if (this.customResident?.getSnapshot?.().controlling) return { ok: false, reason: "Return to map view before entering Harbour General." };
    let purchasedDeed = false;
    if (!this.harbourGeneral?.getSnapshot?.().owned) {
      const purchased = this.harbourGeneral?.purchaseDeed?.() || { ok: false, message: "Harbour General is not ready." };
      if (!purchased.ok) return { ...purchased, reason: purchased.message };
      purchasedDeed = true;
      this.interactions.current = null;
    }
    this.transitioning = true;
    this.movement.setEnabled(false);
    this.interactions.setEnabled(false);
    this.player.setMovement(0, 0, false);
    const returnPosition = this.activePosition();
    const returnFacing = this.player.direction;
    this.gameState?.updatePlayer({ scene: "HarbourGeneralScene", x: returnPosition.x, y: returnPosition.y, facing: returnFacing });
    document.querySelector("#game")?.setAttribute("data-transition", "entering-harbour-general");
    this.cameras.main.fadeOut(220, 28, 64, 63);
    this.time.delayedCall(240, () => this.startActivityScene("HarbourGeneralScene", { returnPosition, returnFacing, slot, itemId, transitionCount: Number(this.entryData.transitionCount || 0) + 1 }));
    return { ok: true, targetScene: "HarbourGeneralScene", purchased: purchasedDeed };
  }

  openCinema() {
    if (this.transitioning) return { ok: false, code: "transition-active", message: "Wait for the town transition to finish." };
    if (this.customResident?.getSnapshot?.().controlling) return { ok: false, code: "resident-control-active", message: "Return to map view before entering the cinema." };
    const access = cinemaAccess(this.restorationMilestones?.getSnapshot?.());
    if (!access.open) return access;
    return this.impactController?.open?.({ mode: "cinema" }) || { ok: false, code: "cinema-interface-unavailable", message: "The cinema programme is not ready." };
  }

  openFarming(tab, targetId = null) {
    if (this.transitioning) return { ok: false, reason: "A scene transition is already running." };
    if (this.customResident?.getSnapshot?.().controlling) return { ok: false, reason: "Return to map view before starting this activity." };
    if (!this.farmingController) return { ok: false, reason: "The farming interface is not ready." };
    return this.farmingController.open(tab, targetId);
  }

  openAnimalFriends(animalId = null) {
    if (this.transitioning) return { ok: false, reason: "A scene transition is already running." };
    if (!this.animalFriendsController) return { ok: false, reason: "The Animal Friends interface is not ready." };
    return this.animalFriendsController.open(animalId);
  }

  startFishing(mode, spotId) {
    if (this.transitioning) return { ok: false, reason: "A scene transition is already running." };
    if (this.customResident?.getSnapshot?.().controlling) return { ok: false, reason: "Return to map view before fishing." };
    const result = this.fishing?.begin?.(mode, spotId, { returnPosition: this.activePosition(), returnFacing: this.player.direction });
    if (!result?.ok) return result || { ok: false, reason: "Fishing is not ready." };
    this.transitioning = true;
    this.movement.setEnabled(false);
    this.interactions.setEnabled(false);
    this.player.setMovement(0, 0, false);
    this.cameras.main.fadeOut(220, 12, 35, 42);
    this.time.delayedCall(240, () => this.startActivityScene("FishingScene"));
    return { ok: true, targetScene: "FishingScene", mode, spotId };
  }

  startWasteCollection(targetId = COMMONS_RUBBISH_JOB.id) {
    if (this.transitioning) return { ok: false, reason: "A scene transition is already running." };
    if (this.customResident?.getSnapshot?.().controlling) return { ok: false, reason: "Return to map view before starting a job." };
    if (!this.cleanupService) return { ok: false, reason: "The cleanup system is not ready." };
    const returnPosition = { x: this.player.x, y: this.player.y };
    const returnFacing = this.player.direction;
    const firstJobAvailable = this.cleanupService.isAvailable(targetId);
    const result = firstJobAvailable ? this.cleanupService.begin(targetId, { returnPosition, returnFacing }) : { ok: true, session: null };
    if (!result.ok) return result;
    this.onboarding?.recordTutorial?.("waste");
    if (!firstJobAvailable) this.gameState?.updatePlayer({ scene: "WasteCollectionScene", x: returnPosition.x, y: returnPosition.y, facing: returnFacing });
    this.transitioning = true;
    this.movement.setEnabled(false);
    this.interactions.setEnabled(false);
    this.player.setMovement(0, 0, false);
    document.querySelector("#game")?.setAttribute("data-transition", "entering-waste-collection");
    this.cameras.main.fadeOut(220, 23, 43, 31);
    this.time.delayedCall(240, () => this.startActivityScene("WasteCollectionScene", { returnPosition, returnFacing }));
    return { ok: true, targetScene: "WasteCollectionScene", session: result.session };
  }

  startLawnCare({ mode = "campaign", targetId = null } = {}) {
    if (this.transitioning) return { ok: false, reason: "A scene transition is already running." };
    if (this.customResident?.getSnapshot?.().controlling) return { ok: false, reason: "Return to map view before starting Lawn Care." };
    if (!this.lawnCare) return { ok: false, reason: "The Lawn Care system is not ready." };
    const returnPosition = { x: this.player.x, y: this.player.y };
    const returnFacing = this.player.direction;
    const result = mode === "town-job"
      ? this.lawnCare.beginTownJob(targetId, { returnPosition, returnFacing })
      : this.lawnCare.beginCampaign(this.lawnCare.getCampaignSnapshot().nextLevel, { returnPosition, returnFacing });
    if (!result.ok) return result;
    this.onboarding?.recordTutorial?.("lawn");
    this.transitioning = true;
    this.movement.setEnabled(false);
    this.interactions.setEnabled(false);
    this.player.setMovement(0, 0, false);
    document.querySelector("#game")?.setAttribute("data-transition", "entering-lawn-care");
    this.cameras.main.fadeOut(220, 38, 75, 42);
    this.time.delayedCall(240, () => this.startActivityScene("LawnCareScene", { returnPosition, returnFacing }));
    return { ok: true, targetScene: "LawnCareScene", session: result.session };
  }

  startOnboardingJob(gameKey) {
    if (gameKey === "resident") {
      const active = this.activePosition();
      const resident = (this.npcTownLife?.getResidents?.() || [])
        .filter((entry) => entry.visible)
        .sort((left, right) => Math.hypot(left.x - active.x, left.y - active.y) - Math.hypot(right.x - active.x, right.y - active.y))[0];
      return resident ? this.npcNarrativeController?.open?.(resident.id, { selectThought: true }) : { ok: false, reason: "No neighbour is nearby yet." };
    }
    if (gameKey === "lawn") return this.startLawnCare({ mode: "campaign" });
    if (gameKey === "waste") return this.startWasteCollection();
    if (gameKey === "river") return this.enterRiverClearout();
    return { ok: false, reason: "That first job is not available." };
  }

  startBeachCleanup() {
    if (this.transitioning) return { ok: false, reason: "A scene transition is already running." };
    if (this.customResident?.getSnapshot?.().controlling) return { ok: false, reason: "Return to map view before starting Beach Cleanup." };
    if (!this.beachCleanup) return { ok: false, reason: "The Beach Cleanup system is not ready." };
    const returnPosition = { x: this.player.x, y: this.player.y };
    const returnFacing = this.player.direction;
    const townJobAvailable = this.beachCleanup.isTownJobAvailable();
    const result = townJobAvailable
      ? this.beachCleanup.beginTownJob({ returnPosition, returnFacing })
      : { ok: true, session: null };
    if (!result.ok) return result;
    if (!townJobAvailable) this.gameState.updatePlayer({ scene: "BeachCleanupScene", x: returnPosition.x, y: returnPosition.y, facing: returnFacing });
    this.transitioning = true;
    this.movement.setEnabled(false);
    this.interactions.setEnabled(false);
    this.player.setMovement(0, 0, false);
    document.querySelector("#game")?.setAttribute("data-transition", "entering-beach-cleanup");
    this.cameras.main.fadeOut(220, 20, 49, 70);
    this.time.delayedCall(240, () => this.startActivityScene("BeachCleanupScene", { returnPosition, returnFacing }));
    return { ok: true, targetScene: "BeachCleanupScene", session: result.session };
  }

  startPlaygroundPowerwash() {
    if (this.transitioning) return { ok: false, reason: "A scene transition is already running." };
    if (this.customResident?.getSnapshot?.().controlling) return { ok: false, reason: "Return to map view before starting Playground Power Wash." };
    if (!this.playgroundPowerwash) return { ok: false, reason: "The Playground Power Wash system is not ready." };
    const returnPosition = { x: this.player.x, y: this.player.y };
    const returnFacing = this.player.direction;
    const townJobAvailable = this.playgroundPowerwash.isTownJobAvailable();
    const result = townJobAvailable
      ? this.playgroundPowerwash.beginTownJob({ returnPosition, returnFacing })
      : { ok: true, session: null };
    if (!result.ok) return result;
    if (!townJobAvailable) this.gameState.updatePlayer({ scene: "PlaygroundPowerwashScene", x: returnPosition.x, y: returnPosition.y, facing: returnFacing });
    this.transitioning = true;
    this.movement.setEnabled(false);
    this.interactions.setEnabled(false);
    this.player.setMovement(0, 0, false);
    document.querySelector("#game")?.setAttribute("data-transition", "entering-playground-powerwash");
    this.cameras.main.fadeOut(220, 7, 20, 43);
    this.time.delayedCall(240, () => this.startActivityScene("PlaygroundPowerwashScene", { returnPosition, returnFacing }));
    return { ok: true, targetScene: "PlaygroundPowerwashScene", session: result.session };
  }

  setOverlayOpen(open) {
    if (this.transitioning) return;
    const townControlsBlocked = this.placementModeActive || Boolean(this.selectedPlacedObjectId);
    const controlling = Boolean(this.customResident?.getSnapshot?.().controlling);
    this.movement?.setEnabled(controlling && !open && !townControlsBlocked);
    this.interactions?.setEnabled(controlling && !open && !townControlsBlocked);
    if (open) {
      this.player?.setMovement(0, 0, false);
      this.customResidentCharacter?.setControlMovement(0, 0, false);
    } else if (this.restorationCameraFocus) {
      this.restorationCameraFocus = false;
      if (controlling) this.cameras.main.startFollow(this.activeCharacter(), true, 0.12, 0.12);
    }
  }

  browseSelectAt(x, y) {
    if (this.transitioning || this.placementModeActive || this.selectedPlacedObjectId || this.customResident?.getSnapshot?.().controlling) {
      return { ok: false, reason: "Town browsing is unavailable right now." };
    }
    const zoom = Math.max(MIN_ZOOM, this.cameras.main.zoom);
    const screenTapRadius = 38 / zoom;
    const personalResident = this.customResident?.getResident?.();
    if (personalResident && this.customResidentCharacter?.visible) {
      const distance = Math.hypot(this.customResidentCharacter.x - x, this.customResidentCharacter.y - y);
      if (distance <= screenTapRadius) {
        document.querySelector("#game")?.setAttribute("data-browse-selection", `resident-${personalResident.id || "personal"}`);
        return this.customResidentController?.open?.() || { ok: false, reason: "The resident profile is unavailable." };
      }
    }

    const resident = (this.npcTownLife?.getResidents?.() || [])
      .filter((entry) => entry.visible)
      .map((entry) => ({ entry, distance: Math.hypot(entry.x - x, entry.y - y) }))
      .filter(({ distance }) => distance <= screenTapRadius)
      .sort((left, right) => left.distance - right.distance)[0]?.entry;
    if (resident) {
      document.querySelector("#game")?.setAttribute("data-browse-selection", `resident-${resident.id}`);
      return this.npcNarrativeController?.open?.(resident.id, { selectThought: true }) || { ok: false, reason: "That resident is unavailable." };
    }

    const shop = SHOPS.find((entry) => containsWithRadius(entry, x, y, 0));
    const shopInteractionId = shop && SHOP_INTERACTION_IDS[shop.title];
    if (shopInteractionId) {
      const interaction = this.interactions?.interactables?.find((entry) => entry.id === shopInteractionId && entry.enabled !== false);
      if (interaction?.onActivate) {
        document.querySelector("#game")?.setAttribute("data-browse-selection", shopInteractionId);
        return interaction.onActivate(interaction);
      }
    }

    const candidate = (this.interactions?.interactables || [])
      .filter((entry) => entry.enabled !== false && entry.kind !== "npc-story" && typeof entry.onActivate === "function")
      .map((entry) => {
        const distance = Math.hypot(entry.x - x, entry.y - y);
        const radius = Math.max(Number(entry.radius) || 72, screenTapRadius);
        return { entry, distance, ratio: distance / radius };
      })
      .filter(({ ratio }) => ratio <= 1)
      .sort((left, right) => left.ratio - right.ratio || left.distance - right.distance)[0]?.entry;
    if (!candidate) {
      document.querySelector("#game")?.setAttribute("data-browse-selection", "none");
      return { ok: false, reason: "Nothing selectable is here." };
    }
    document.querySelector("#game")?.setAttribute("data-browse-selection", candidate.id);
    return candidate.onActivate(candidate);
  }

  focusRestorationMilestone(focus, id) {
    if (!focus || !Number.isFinite(focus.x) || !Number.isFinite(focus.y)) return false;
    this.restorationCameraFocus = true;
    this.cameras.main.stopFollow();
    this.setZoom(focus.zoom || 0.75);
    this.cameras.main.pan(focus.x, focus.y, 520, "Sine.easeInOut", true);
    document.querySelector("#game")?.setAttribute("data-restoration-focus", id || "unknown");
    return true;
  }

  setZoom(value) {
    this.cameras.main.setZoom(Phaser.Math.Clamp(value, MIN_ZOOM, MAX_ZOOM));
    document.querySelector("#game")?.setAttribute("data-camera-zoom", this.cameras.main.zoom.toFixed(2));
  }

  isBlocked(x, y) {
    const edge = 34;
    if (x < edge || y < edge || x > WORLD.width - edge || y > WORLD.height - edge) return true;
    if ([...COLLISION_RECTS, ...this.buildingCollisions].some((rect) => containsWithRadius(rect, x, y))) return true;
    if (this.farming?.treeCollisionAt?.(x, y, PLAYER_RADIUS)?.blocked) return true;
    if (this.municipalCollection?.collisionAt?.(x, y, PLAYER_RADIUS)?.blocked) return true;
    return Boolean(this.townPlacement?.collisionAt?.(x, y, PLAYER_RADIUS)?.blocked);
  }

  moveActiveCharacter(dx, dy, distance) {
    if (!dx && !dy) return false;
    const actor = this.activeCharacter();
    const startX = actor.x;
    const startY = actor.y;
    const magnitude = Math.hypot(dx, dy) || 1;
    const stepX = (dx / magnitude) * distance;
    const stepY = (dy / magnitude) * distance;
    const nextX = actor.x + stepX;
    const nextY = actor.y + stepY;

    if (!this.isBlocked(nextX, actor.y)) actor.x = nextX;
    if (!this.isBlocked(actor.x, nextY)) actor.y = nextY;
    const moved = Math.hypot(actor.x - startX, actor.y - startY) > 0.01;
    if (moved && !this.onboardingMovementRecorded && this.onboardingJourneyOrigin) {
      const journeyDistance = Math.hypot(actor.x - this.onboardingJourneyOrigin.x, actor.y - this.onboardingJourneyOrigin.y);
      if (journeyDistance >= 32 && this.onboarding?.getSnapshot?.().complete) {
        const recorded = this.onboarding.recordJourneyStep?.("moved");
        this.onboardingMovementRecorded = Boolean(recorded?.ok);
      }
    }
    return moved;
  }

  updateStatus() {
    const status = document.querySelector("#location-status");
    if (!status) return;
    const controlling = Boolean(this.customResident?.getSnapshot?.().controlling);
    const position = controlling
      ? this.activePosition()
      : { x: this.cameras.main.midPoint.x, y: this.cameras.main.midPoint.y };
    let label = "Willowmere";
    for (const district of DISTRICTS) {
      if (containsWithRadius(district, position.x, position.y, 0)) label = district.title;
    }
    const prefix = controlling ? `${this.customResident.getSnapshot().profile.name} · ` : "";
    status.textContent = `${prefix}${label} · ${Math.round(position.x)}, ${Math.round(position.y)}`;
  }

  refreshAnimalPresentations(delta = 0) {
    if (!this.animalCharacters || !this.player) return;
    const playerPosition = this.observerPosition();
    for (const presentation of this.animals?.getWorldPresentations?.() || []) {
      const character = this.animalCharacters.get(presentation.definition.id);
      character?.applyPresentation(presentation, delta, playerPosition);
      const interaction = this.animalInteractables?.get(presentation.definition.id);
      if (!interaction || !character) continue;
      interaction.enabled = presentation.visible && character.alpha > 0.55 && presentation.location !== "following";
      interaction.x = character.x;
      interaction.y = character.y;
      interaction.label = presentation.state.adopted ? `Visit ${presentation.state.name}` : `Meet ${presentation.state.name}`;
      interaction.detail = presentation.state.adopted ? `Roaming safely in ${SOUTH_MEADOW.label}` : "Greet, feed, build trust or adopt";
    }
  }

  update(_time, delta) {
    this.worldSimulation?.tick(delta);
    const controlling = Boolean(this.customResident?.getSnapshot?.().controlling);
    const activePosition = this.activePosition();
    const currentWorld = this.gameState?.getSnapshot().world;
    if (controlling) this.npcTownLife?.updatePlayerProximity?.(activePosition.x, activePosition.y, currentWorld);
    this.npcTownLife?.update(delta, currentWorld);
    this.municipalCollection?.update?.(delta, currentWorld);
    this.npcTownLife?.refreshPublicBins?.();
    this.renderNpcPublicBins();
    const collectionPresentation = this.refreshMunicipalCollectionPresentation();
    const residents = this.npcTownLife?.getResidents?.() || [];
    for (const resident of residents) {
      const nearby = controlling && Math.hypot(resident.x - activePosition.x, resident.y - activePosition.y) <= 92;
      this.npcCharacters.get(resident.id)?.applyResident(resident, delta, nearby);
      const interaction = this.npcInteractables?.get(resident.id);
      if (interaction) {
        interaction.x = resident.x;
        interaction.y = resident.y;
        interaction.enabled = resident.visible;
        interaction.detail = `${resident.role} · ${resident.activity}`;
      }
    }
    const { dx, dy, sprinting } = controlling ? this.movement.getVector() : { dx: 0, dy: 0, sprinting: false };
    const speed = sprinting ? SPRINT_SPEED : WALK_SPEED;
    const moving = controlling && this.moveActiveCharacter(dx, dy, speed * Math.min(delta, 50) / 1000);
    if (controlling) {
      const facing = Math.abs(dx) > Math.abs(dy) && dx ? (dx < 0 ? "left" : "right") : dy ? (dy < 0 ? "up" : "down") : this.customResident.getSnapshot().location.facing;
      this.customResidentCharacter?.setControlMovement(dx, dy, moving);
      this.customResident?.setRuntimePosition?.({ x: this.customResidentCharacter.x, y: this.customResidentCharacter.y, facing });
      const personal = this.customResident.getResident();
      if (personal) this.customResidentCharacter?.applyResident(personal, delta, true);
    } else {
      this.player.setMovement(0, 0, false);
      const personal = this.customResident?.getResident?.();
      if (personal) this.customResidentCharacter?.applyResident(personal, delta, false);
    }
    this.refreshAnimalPresentations(delta);
    this.stateSyncElapsed += delta;
    this.farmingSyncElapsed += delta;
    if (this.farmingSyncElapsed >= 5000) {
      this.farmingSyncElapsed = 0;
      this.farming?.refresh?.({ persist: true });
      this.drawFarmingAreas();
      const houseRefresh = this.houseRescue?.refreshJobs?.();
      if (!houseRefresh?.changed) this.drawHouseRescueMarkers();
      this.livingEnvironment?.refresh?.({ persist: true });
      const rareVisits = this.animals?.refreshRareVisits?.({ persist: true });
      for (const notice of rareVisits?.notices || []) this.sharedOverlay?.showToast?.(notice.message, { tone: "success", duration: 5200 });
      this.refreshLivingEnvironment();
      this.refreshAnimalPresentations(0);
      this.renderNpcPublicBins();
      this.refreshPlacementInteractables();
      this.refreshRestorationPresentation();
    }
    if (this.stateSyncElapsed >= 250) {
      this.stateSyncElapsed = 0;
      this.updateWorldObjectLighting(currentWorld);
    }
    if (controlling) {
      const currentPosition = this.activePosition();
      this.interactions.update(currentPosition.x, currentPosition.y);
      if (this.movement.consumeInteractPress()) this.interactions.activateCurrent();
    }

    this.shadow.setPosition(this.player.x, this.player.y + 20);
    this.player.setDepth(200 + this.player.y / 10);
    this.shadow.setDepth(190 + this.player.y / 10);
    this.updateStatus();
    const gameElement = document.querySelector("#game");
    if (gameElement) {
      gameElement.dataset.scene = this.scene.key;
      gameElement.dataset.playerX = Math.round(this.player.x);
      gameElement.dataset.playerY = Math.round(this.player.y);
      gameElement.dataset.cameraZoom = this.cameras.main.zoom.toFixed(2);
      gameElement.dataset.cameraX = String(Math.round(this.cameras.main.midPoint.x));
      gameElement.dataset.cameraY = String(Math.round(this.cameras.main.midPoint.y));
      gameElement.dataset.townMode = controlling ? "resident-control" : "browse";
      gameElement.dataset.animation = this.player.getAnimationState();
      gameElement.dataset.interaction = this.interactions.getState()?.id || "none";
      gameElement.dataset.transitionCount = String(Number(this.entryData.transitionCount || 0));
      gameElement.dataset.transition = this.transitioning ? "active" : "idle";
      const diagnostics = this.npcTownLife?.getDiagnostics?.();
      gameElement.dataset.npcResidents = String(diagnostics?.residentCount || 0);
      gameElement.dataset.npcVisible = String(diagnostics?.visibleCount || 0);
      gameElement.dataset.npcWalking = String(diagnostics?.walkingCount || 0);
      gameElement.dataset.npcPaused = String(Boolean(diagnostics?.paused));
      gameElement.dataset.npcConversations = String(diagnostics?.conversations || 0);
      gameElement.dataset.npcCarrying = String(diagnostics?.carryingCount || 0);
      gameElement.dataset.npcPublicBins = String(diagnostics?.publicBins?.length || 0);
      gameElement.dataset.npcCommunityCare = String(diagnostics?.communityCareEvents || 0);
      gameElement.dataset.municipalCollectionActive = String(Boolean(collectionPresentation?.active));
      gameElement.dataset.municipalCollectionPhase = collectionPresentation?.phase || "waiting";
      gameElement.dataset.municipalCollectionProgress = collectionPresentation?.active
        ? `${collectionPresentation.stopIndex + 1}/${collectionPresentation.totalBins}`
        : "idle";
      gameElement.dataset.municipalCollectionBinsEmptied = String(collectionPresentation?.binsEmptied || 0);
      const restoration = this.restorationMilestones?.getDiagnostics?.();
      gameElement.dataset.restorationUnlocked = String(restoration?.unlocked?.length || 0);
      gameElement.dataset.restorationPending = restoration?.pending?.[0] || "none";
      gameElement.dataset.restorationFestival = String(Boolean(restoration?.festivalActive));
      gameElement.dataset.restorationGift = String(Boolean(restoration?.firstRestorationGift?.granted));
      const sampleResident = residents[0];
      gameElement.dataset.npcSample = sampleResident
        ? `${sampleResident.id}:${Math.round(sampleResident.x)},${Math.round(sampleResident.y)}:${sampleResident.phase}`
        : "none";
      const customDiagnostics = this.customResident?.getDiagnostics?.();
      gameElement.dataset.customResidentCreated = String(Boolean(customDiagnostics?.created));
      gameElement.dataset.customResidentControl = String(Boolean(customDiagnostics?.controlling));
      gameElement.dataset.customResidentName = customDiagnostics?.residentName || "none";
      gameElement.dataset.customResidentHome = customDiagnostics?.homeNodeId || "none";
      const diagnosticPosition = controlling ? activePosition : this.observerPosition();
      gameElement.dataset.controlledX = Math.round(diagnosticPosition.x);
      gameElement.dataset.controlledY = Math.round(diagnosticPosition.y);
      const farming = this.farming?.getDiagnostics?.();
      gameElement.dataset.farmingReadyBeds = String(farming?.readyBeds || 0);
      gameElement.dataset.farmingGrowingBeds = String(farming?.growingBeds || 0);
      gameElement.dataset.farmingApplesReady = String(farming?.applesReady || 0);
      gameElement.dataset.farmingOrchardTrees = String(farming?.orchardTrees || 0);
      gameElement.dataset.farmingGrowingTrees = String(farming?.growingTrees || 0);
      gameElement.dataset.farmingSaplingsOwned = String(farming?.purchasedSaplings || 0);
      gameElement.dataset.farmingLawnJobs = String(farming?.activeLawnJobs || 0);
      const environment = this.livingEnvironment?.getDiagnostics?.();
      gameElement.dataset.environmentCleanliness = String(environment?.cleanliness?.score || 0);
      gameElement.dataset.environmentJobs = String(environment?.cleanliness?.activeJobs || 0);
      gameElement.dataset.environmentLandLitter = String(environment?.land?.total || 0);
      gameElement.dataset.environmentRiverRubbish = String(environment?.river?.total || 0);
      gameElement.dataset.environmentCalm = String(Boolean(environment?.calm?.active));
      const animals = this.animals?.getDiagnostics?.();
      gameElement.dataset.animalVisible = String(animals?.visibleWildAnimals || 0);
      gameElement.dataset.animalAdopted = String(animals?.adoptedAnimals || 0);
      gameElement.dataset.animalActive = animals?.activeAnimalId || "none";
      gameElement.dataset.animalMeadow = String(animals?.southMeadowResidents || 0);
      const fishing = this.fishing?.getDiagnostics?.();
      gameElement.dataset.fishingCastsLeft = String(fishing?.fishCastsLeft ?? 5);
      gameElement.dataset.magnetCastsLeft = String(fishing?.magnetCastsLeft ?? 5);
      gameElement.dataset.fishCaught = String(fishing?.totalFishCaught || 0);
      gameElement.dataset.magnetPulls = String(fishing?.totalMagnetPulls || 0);
      const bakery = this.bakery?.getDiagnostics?.();
      gameElement.dataset.bakeryUnlocked = String(bakery?.unlockedLevel || 1);
      gameElement.dataset.bakeryCompleted = String(bakery?.completedLevels || 0);
      gameElement.dataset.bakeryStars = String(bakery?.totalStars || 0);
      const cafe = this.cafe?.getDiagnostics?.();
      gameElement.dataset.cafeUnlocked = String(cafe?.unlockedLevel || 1);
      gameElement.dataset.cafeCompleted = String(cafe?.completedLevels || 0);
      gameElement.dataset.cafeStars = String(cafe?.totalStars || 0);
      const morningMug = this.morningMug?.getDiagnostics?.();
      gameElement.dataset.morningMugUnlocked = String(morningMug?.unlockedLevel || 1);
      gameElement.dataset.morningMugCompleted = String(morningMug?.completedLevels || 0);
      gameElement.dataset.morningMugStars = String(morningMug?.totalStars || 0);
      gameElement.dataset.morningMugResumable = String(Boolean(morningMug?.resumableSession));
      const riversideKitchen = this.riversideKitchen?.getDiagnostics?.();
      gameElement.dataset.riversideKitchenUnlocked = String(riversideKitchen?.unlockedLevel || 1);
      gameElement.dataset.riversideKitchenCompleted = String(riversideKitchen?.completedLevels || 0);
      gameElement.dataset.riversideKitchenStars = String(riversideKitchen?.totalStars || 0);
      gameElement.dataset.riversideKitchenResumable = String(Boolean(riversideKitchen?.resumableSession));
      const scoops = this.southShoreScoops?.getDiagnostics?.();
      gameElement.dataset.scoopsUnlocked = String(scoops?.unlockedLevel || 1);
      gameElement.dataset.scoopsCompleted = String(scoops?.completedLevels || 0);
      gameElement.dataset.scoopsStars = String(scoops?.totalStars || 0);
      gameElement.dataset.scoopsRestorationTier = String(scoops?.restorationTier || 0);
      gameElement.dataset.scoopsResumable = String(Boolean(scoops?.resumableSession));
      const river = this.river?.getDiagnostics?.();
      gameElement.dataset.riverLevels = String(river?.totalLevels || 0);
      gameElement.dataset.riverCompleted = String(river?.completed || 0);
      gameElement.dataset.riverCatalogueValid = String(Boolean(river?.catalogueValid));
      const houseRescue = this.houseRescue?.getDiagnostics?.();
      gameElement.dataset.houseRescueLevels = String(houseRescue?.totalLevels || 0);
      gameElement.dataset.houseRescueDirtyHomes = String(houseRescue?.dirtyHomes?.length || 0);
      gameElement.dataset.houseRescueCatalogueValid = String(Boolean(houseRescue?.catalogueValid));
      const waste = this.cleanupService?.getDiagnostics?.();
      gameElement.dataset.wasteLevels = String(waste?.totalLevels || 0);
      gameElement.dataset.wasteCompleted = String(waste?.wasteProgress?.completed || 0);
      gameElement.dataset.wasteCatalogueValid = String(Boolean(waste?.catalogueValid));
      const lawnCare = this.lawnCare?.getDiagnostics?.();
      gameElement.dataset.lawnCareLevels = String(lawnCare?.totalLevels || 0);
      gameElement.dataset.lawnCareCompleted = String(lawnCare?.progress?.completed || 0);
      gameElement.dataset.lawnCareCatalogueValid = String(Boolean(lawnCare?.catalogueValid));
      const beach = this.beachCleanup?.getDiagnostics?.();
      gameElement.dataset.beachLevels = String(beach?.totalLevels || 0);
      gameElement.dataset.beachCompleted = String(beach?.completed || 0);
      gameElement.dataset.beachCatalogueValid = String(Boolean(beach?.catalogueValid));
      gameElement.dataset.southShoreDirty = String(Boolean(beach?.southShoreDirty));
      const powerwash = this.playgroundPowerwash?.getDiagnostics?.();
      gameElement.dataset.powerwashLevels = String(powerwash?.totalLevels || 0);
      gameElement.dataset.powerwashCompleted = String(powerwash?.completed || 0);
      gameElement.dataset.powerwashCatalogueValid = String(Boolean(powerwash?.catalogueValid));
      gameElement.dataset.commonsPlaygroundDirty = String(Boolean(powerwash?.playgroundDirty));
      const placement = this.townPlacement?.getDiagnostics?.();
      gameElement.dataset.townPlacementDefinitions = String(placement?.totalDefinitions || 0);
      gameElement.dataset.townPlacementReleased = String(placement?.releasedDefinitions || 0);
      gameElement.dataset.townPlacementCount = String(placement?.placed || 0);
      gameElement.dataset.townPlacementActive = String(Boolean(placement?.active));
      gameElement.dataset.townPlacementValid = String(Boolean(placement?.valid));
      const harbour = this.harbourGeneral?.getDiagnostics?.();
      gameElement.dataset.harbourOwned = String(Boolean(harbour?.owned));
      gameElement.dataset.harbourTill = String(harbour?.tillCoins || 0);
      gameElement.dataset.harbourSales = String(harbour?.lifetimeSales || 0);
    }
  }

  getMilestoneState() {
    return {
      scene: this.scene.key,
      world: { ...WORLD },
      player: { x: Math.round(this.player.x), y: Math.round(this.player.y), facing: this.player.direction },
      camera: { zoom: Number(this.cameras.main.zoom.toFixed(2)), followingResident: Boolean(this.customResident?.getSnapshot?.().controlling) },
      controls: { keyboardCamera: true, touchDrag: true, pinchZoom: true, wheelZoom: true, explicitResidentControl: true },
      interaction: this.interactions.getState(),
      milestone29Systems: ["seven-day-07:00-service", "gavin-municipal-collector", "street-and-bridge-only-lorry-network", "all-public-and-player-bin-route", "collector-off-road-walking", "individual-dismount-lift-empty-return-animation", "tipped-bin-righting", "exact-bin-transform-return", "mid-route-save-resume", "collection-locked-player-bins", "automatic-next-service-day"],
      milestone30Systems: ["eight-sequential-permanent-restorations", "exact-cleanup-and-placement-gates", "permanent-town-transformations", "resident-and-business-responses", "animated-accessible-reveals", "restoration-chime-and-haptics", "first-town-planter-gift", "atomic-unlock-persistence", "duplicate-event-protection", "legacy-milestone-import", "one-day-festival-celebration", "permanent-festival-memory"],
      milestone27Systems: ["20-lawn-profile-slots", "19-authored-living-lawns", "soil-moisture-shade-and-resident-care", "persistent-land-litter", "five-section-persistent-river-rubbish", "wind-river-flow-snags-and-tide", "business-waste", "caretaker-sweeping", "exact-authored-cleanup-effects", "cleanliness-and-three-day-calm", "offline-environment-progression", "legacy-environment-import"],
      milestone26Systems: ["walkable-village-grocer", "nine-original-product-displays", "six-persistent-beds", "three-original-crops", "paid-saplings", "24-positioned-apple-trees", "weather-aware-growth-and-harvests", "offline-farm-progression", "legacy-crop-and-orchard-import"],
      milestone25Systems: ["35-placeable-catalogue", "purchase-and-inventory-placement", "tap-and-keyboard-preview", "quarter-turn-rotation", "atomic-place-move-store", "road-water-building-entrance-and-lawn-restrictions", "500-object-safety-limit", "player-collision", "npc-wildlife-and-rubbish-hooks", "exact-transform-persistence", "legacy-placement-import"],
      milestone28Systems: ["35-resident-needs", "symmetric-relationships", "resident-conversations", "business-takeaway-carrying", "public-and-player-bin-decisions", "causal-persistent-littering", "bounded-bin-tipping", "community-cleanup", "resident-lawn-care", "contextual-greetings", "restoration-reactions", "five-original-public-bins", "legacy-advanced-npc-import"],
      milestone23Systems: ["south-shore-scoops-scene-transition", "750-deterministic-shifts", "sequential-picture-orders", "60-percent-pass-rule", "ingredient-and-product-unlocks", "first-clear-rewards", "south-shore-restoration", "exact-save-resume", "legacy-progress-import", "landscape-controls"],
      milestone36Systems: ["stable-shop-11-identity", "walkable-top-down-adoption-room", "eleven-physical-enclosures", "six-distinct-dog-breeds", "four-unusual-companions", "three-restoration-mystery-egg", "one-time-permanent-coin-adoptions", "active-follower-preservation", "south-meadow-resting", "unlimited-companion-family", "atomic-adoption-save"],
      milestone37Systems: ["5000-coin-player-owned-business", "walkable-harbour-general", "six-unique-display-slots", "four-item-immediate-cases", "24-per-product-stock-cap", "17-original-products", "weather-dependent-demand", "persistent-npc-weather-wardrobes", "in-person-npc-sales", "till-and-lifetime-statistics", "atomic-deed-restock-and-till-save", "legacy-business-import"],
      migratedSystems: ["character-animation", "proximity-interactions", "bakery-scene-transition", "cafe-scene-transition", "morning-mug-scene-transition", "riverside-kitchen-scene-transition", "river-clearout-scene-transition", "house-rescue-scene-transition", "shared-game-state", "safe-save-foundation", "shared-economy", "fresh-market-shop", "waste-collection-job", "weekly-municipal-bin-collection", "world-time-weather-lighting", "basic-npc-town-life", "advanced-npc-social-life", "resident-public-bin-behaviour", "custom-resident-profile-home-control", "personal-home-four-level-progression", "personal-home-paid-redesign", "personal-home-stable-house-20-identity", "weather-aware-farming", "orchard-harvest", "persistent-lawn-jobs", "animal-habitat-routes", "animal-friendship-feeding", "animal-adoption", "active-companion-following", "south-meadow", "three-fishing-spots", "hidden-zone-fishing", "timed-reeling", "magnet-fishing", "fishing-inventory-rewards", "magnet-coin-rewards", "bakery-recipes", "bakery-customer-service", "bakery-first-clear-rewards", "bakery-level-unlocks", "shared-recipe-order-engine", "corner-cafe-recipes", "cafe-three-tray-service", "cafe-first-clear-rewards", "cafe-level-unlocks", "morning-mug-54-recipes", "morning-mug-150-levels", "morning-mug-first-clear-rewards", "morning-mug-save-resume", "morning-mug-landscape-controls", "riverside-kitchen-32-recipes", "riverside-kitchen-150-levels", "riverside-kitchen-preparation-heat-plating", "riverside-kitchen-first-clear-rewards", "riverside-kitchen-save-resume", "riverside-kitchen-landscape-controls", "river-750-level-catalogue", "river-falling-piece-engine", "river-first-clear-rewards", "river-portrait-controls", "house-rescue-750-level-catalogue", "house-rescue-sort-and-vacuum", "house-rescue-persistent-home-jobs", "house-rescue-landscape-controls", "waste-750-authored-boards", "waste-five-slot-triple-matching", "waste-certified-solutions", "waste-first-clear-rewards", "waste-landscape-controls", "lawn-750-authored-levels", "lawn-slide-mower-engine", "lawn-persistent-campaign", "lawn-town-job-effects", "lawn-first-clear-rewards", "lawn-landscape-controls", "beach-750-deterministic-levels", "beach-rake-and-rubbish-engine", "beach-native-town-rewards", "beach-first-clear-rewards", "south-shore-litter-restoration", "beach-landscape-controls", "powerwash-750-deterministic-levels", "powerwash-soap-resistant-stains", "powerwash-three-nozzles", "powerwash-97-percent-tolerance", "powerwash-native-town-rewards", "powerwash-first-clear-rewards", "commons-playground-restoration", "powerwash-landscape-controls"],
      npcTownLife: this.npcTownLife?.getDiagnostics?.(),
      municipalCollection: this.municipalCollection?.getDiagnostics?.(),
      restorationMilestones: this.restorationMilestones?.getDiagnostics?.(),
      pawsWonders: this.pawsWonders?.getDiagnostics?.(),
      harbourGeneral: this.harbourGeneral?.getDiagnostics?.(),
      customResident: this.customResident?.getDiagnostics?.(),
      farming: this.farming?.getDiagnostics?.(),
      livingEnvironment: this.livingEnvironment?.getDiagnostics?.(),
      animals: this.animals?.getDiagnostics?.(),
      fishing: this.fishing?.getDiagnostics?.(),
      bakery: this.bakery?.getDiagnostics?.(),
      cafe: this.cafe?.getDiagnostics?.(),
      morningMug: this.morningMug?.getDiagnostics?.(),
      riversideKitchen: this.riversideKitchen?.getDiagnostics?.(),
      southShoreScoops: this.southShoreScoops?.getDiagnostics?.(),
      river: this.river?.getDiagnostics?.(),
      houseRescue: this.houseRescue?.getDiagnostics?.(),
      wasteCollection: this.cleanupService?.getDiagnostics?.(),
      lawnCare: this.lawnCare?.getDiagnostics?.(),
      beachCleanup: this.beachCleanup?.getDiagnostics?.(),
      playgroundPowerwash: this.playgroundPowerwash?.getDiagnostics?.(),
      townPlacement: this.townPlacement?.getDiagnostics?.(),
      sharedState: {
        schemaVersion: this.gameState?.getSnapshot().schemaVersion || null,
        source: this.gameState?.getSnapshot().source.kind || null,
        legacySaveUntouched: true,
      },
    };
  }
}
