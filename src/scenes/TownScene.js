import Phaser from "phaser";
import {
  BRIDGES,
  COLLISION_RECTS,
  COLORS,
  DISTRICTS,
  HOUSES,
  LANDMARKS,
  LITTLE_BAKERY,
  PATHS,
  PLAYER_START,
  RIVER_PATH,
  ROADS,
  SHOPS,
  WORLD,
} from "../data/town.js";
import { PlayerCharacter } from "../entities/PlayerCharacter.js";
import { COMMONS_RUBBISH_JOB } from "../data/cleanupJobs.js";
import { FRESH_MARKET } from "../data/shops.js";
import { InteractionSystem } from "../systems/InteractionSystem.js";
import { MovementController } from "../systems/MovementController.js";
import { NpcCharacter } from "../entities/NpcCharacter.js";
import {
  PERSONAL_HOME_RENDER_HOUSE_ID,
  PERSONAL_HOME_OPTIONS,
} from "../data/customResident.js";

const PLAYER_RADIUS = 17;
const WALK_SPEED = 270;
const SPRINT_SPEED = 390;
const MIN_ZOOM = 0.56;
const MAX_ZOOM = 1.3;

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
    this.personalHomeCollisionAdded = false;
    this.personalHomeSignature = null;
  }

  create() {
    this.gameState = this.registry.get("gameState");
    this.shopController = this.registry.get("shopController");
    this.cleanupService = this.registry.get("cleanupService");
    this.worldSimulation = this.registry.get("worldSimulation");
    this.npcTownLife = this.registry.get("npcTownLife");
    this.customResident = this.registry.get("customResident");
    this.customResidentController = this.registry.get("customResidentController");
    this.worldSimulation?.setPaused("activity", false);
    const savedState = this.gameState?.getSnapshot();
    this.cameras.main.setBounds(0, 0, WORLD.width, WORLD.height);
    this.drawTown();

    const qaTarget = import.meta.env.DEV
      ? new URLSearchParams(window.location.search).get("qa")
      : null;
    const qaSpawn = qaTarget === "bakery"
      ? LITTLE_BAKERY.approach
      : qaTarget === "fresh-market"
        ? FRESH_MARKET.approach
        : qaTarget === "waste"
          ? COMMONS_RUBBISH_JOB.world.approach
          : null;
    const savedTownPosition = savedState?.player?.scene === "TownScene" ? savedState.player : null;
    const spawn = this.entryData.returnPosition
      || qaSpawn
      || savedTownPosition
      || PLAYER_START;
    const direction = this.entryData.returnFacing || (qaTarget ? "up" : "down");
    this.shadow = this.add.ellipse(spawn.x, spawn.y + 18, 31, 12, 0x24442f, 0.28).setDepth(190);
    this.player = new PlayerCharacter(this, spawn.x, spawn.y, { direction }).setDepth(200);
    this.npcCharacters = new Map();
    for (const resident of this.npcTownLife?.getResidents?.() || []) {
      this.npcCharacters.set(resident.id, new NpcCharacter(this, resident));
    }
    this.customResidentCharacter = null;
    this.refreshCustomResident();
    this.unsubscribeCustomResident = this.customResident?.subscribe?.(() => this.refreshCustomResident());
    this.movement = new MovementController(this, {
      onTouchStep: (dx, dy) => this.moveActiveCharacter(dx, dy, 38),
    });
    const interactables = [
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
          id: "fresh-market-door",
          kind: "shop",
          x: FRESH_MARKET.door.x,
          y: FRESH_MARKET.door.y,
          radius: FRESH_MARKET.interactionRadius,
          icon: FRESH_MARKET.icon,
          label: `Enter ${FRESH_MARKET.name}`,
          detail: "Fresh fish, meat and pond food",
          onActivate: () => this.openFreshMarket(),
        },
    ];
    if (this.cleanupService?.isAvailable(COMMONS_RUBBISH_JOB.id)) {
      interactables.push({
        id: COMMONS_RUBBISH_JOB.id,
        kind: "cleanup-job",
        x: COMMONS_RUBBISH_JOB.world.x,
        y: COMMONS_RUBBISH_JOB.world.y,
        radius: COMMONS_RUBBISH_JOB.world.interactionRadius,
        icon: COMMONS_RUBBISH_JOB.icon,
        label: "Start Waste Collection",
        detail: "Clear 6 pieces from Willow Commons",
        onActivate: () => this.startWasteCollection(),
      });
    }
    this.interactions = new InteractionSystem({
      interactables,
      onChange: (interaction) => this.renderInteractionPrompt(interaction),
    });
    this.stateSyncElapsed = 0;

    const preferredZoom = window.matchMedia("(max-width: 720px)").matches ? 0.72 : 0.88;
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setZoom(preferredZoom);

    this.input.on("wheel", (_pointer, _objects, _dx, dy) => {
      this.setZoom(this.cameras.main.zoom * (dy > 0 ? 0.9 : 1.1));
    });

    this.bindInterface();
    this.setSceneInterface();
    this.cameras.main.fadeIn(220, 23, 43, 31);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.unbindInterface());
    this.updateStatus();
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

    this.drawBridges();
    this.drawParkDetails();
    HOUSES.forEach((house) => this.drawHouse(house));
    SHOPS.forEach((shop) => this.drawShop(shop));
    this.drawLandmarks();
    this.drawCleanupTarget();
    this.drawLabels();

    this.add.rectangle(WORLD.width / 2, WORLD.height / 2, WORLD.width - 24, WORLD.height - 24)
      .setStrokeStyle(24, 0x315e3f, 1)
      .setDepth(300);
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
    const wallColor = personalHome ? PERSONAL_HOME_OPTIONS.wallPalette[personalHome.wallColor] : COLORS.wall;
    const roofColor = personalHome ? PERSONAL_HOME_OPTIONS.roofPalette[personalHome.roofColor] : house.roof;
    const layer = this.add.graphics().setDepth(60 + house.y / 100);
    if (personalHome) this.personalHomeGraphics = layer;
    layer.fillStyle(0x5c864e, 0.5);
    layer.fillRoundedRect(house.x - 36, house.y - 38, house.width + 72, house.height + 78, 18);
    layer.fillStyle(wallColor, 1);
    layer.fillRoundedRect(house.x, house.y + 32, house.width, house.height - 32, 10);
    layer.fillStyle(roofColor, 1);
    if (personalHome?.roofStyle === "hip") {
      layer.fillPoints([
        { x: house.x + house.width * 0.28, y: house.y - 7 },
        { x: house.x + house.width * 0.72, y: house.y - 7 },
        { x: house.x + house.width + 12, y: house.y + 47 },
        { x: house.x - 12, y: house.y + 47 },
      ], true);
    } else if (personalHome?.roofStyle === "gambrel") {
      layer.fillPoints([
        { x: house.x + house.width * 0.37, y: house.y - 12 },
        { x: house.x + house.width * 0.63, y: house.y - 12 },
        { x: house.x + house.width * 0.84, y: house.y + 14 },
        { x: house.x + house.width + 12, y: house.y + 47 },
        { x: house.x - 12, y: house.y + 47 },
        { x: house.x + house.width * 0.16, y: house.y + 14 },
      ], true);
    } else {
      layer.fillTriangle(house.x - 12, house.y + 47, house.x + house.width / 2, house.y - 12, house.x + house.width + 12, house.y + 47);
    }
    layer.fillRect(house.x + 13, house.y + 38, house.width - 26, 28);
    layer.fillStyle(0x6f4c35, 1);
    layer.fillRect(house.x + house.width / 2 - 16, house.y + house.height - 54, 32, 54);
    layer.fillStyle(0x8ac5d5, 1);
    layer.fillRect(house.x + 28, house.y + 82, 34, 30);
    layer.fillRect(house.x + house.width - 62, house.y + 82, 34, 30);
    if (personalHome && this.customResident?.getSnapshot?.().created) {
      this.personalHomeLabel = this.add.text(house.x + house.width / 2, house.y - 33, "💚 Meadowlight House", {
        color: "#294637", fontFamily: "system-ui, sans-serif", fontSize: "11px", fontStyle: "bold",
        backgroundColor: "rgba(255, 253, 241, 0.94)", padding: { x: 6, y: 3 },
      }).setOrigin(0.5).setDepth(90 + house.y / 100);
    }
    if (!personalHome || !this.personalHomeCollisionAdded) {
      this.buildingCollisions.push({ x: house.x - 8, y: house.y - 15, width: house.width + 16, height: house.height + 18 });
      if (personalHome) this.personalHomeCollisionAdded = true;
    }
  }

  drawShop(shop) {
    const layer = this.add.graphics().setDepth(70 + shop.y / 100);
    layer.fillStyle(0x526e48, 0.42);
    layer.fillRoundedRect(shop.x - 18, shop.y - 16, shop.width + 36, shop.height + 34, 14);
    layer.fillStyle(shop.color, 1);
    layer.fillRoundedRect(shop.x, shop.y, shop.width, shop.height, 12);
    layer.fillStyle(0xf4e6c6, 1);
    layer.fillRect(shop.x + 10, shop.y + 66, shop.width - 20, shop.height - 76);
    layer.fillStyle(0x465c53, 1);
    layer.fillRect(shop.x + shop.width / 2 - 22, shop.y + shop.height - 70, 44, 70);
    layer.fillStyle(0xa9dae2, 1);
    layer.fillRect(shop.x + 26, shop.y + 92, 46, 43);
    layer.fillRect(shop.x + shop.width - 72, shop.y + 92, 46, 43);
    this.add.text(shop.x + shop.width / 2, shop.y + 30, `${shop.icon} ${shop.title}`, {
      color: "#fff9df",
      fontFamily: "system-ui, sans-serif",
      fontSize: "17px",
      fontStyle: "bold",
      stroke: "#294637",
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(95 + shop.y / 100);
    this.buildingCollisions.push({ x: shop.x - 8, y: shop.y - 8, width: shop.width + 16, height: shop.height + 16 });
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

  drawCleanupTarget() {
    if (!this.cleanupService?.isAvailable(COMMONS_RUBBISH_JOB.id)) return;
    const { x, y } = COMMONS_RUBBISH_JOB.world;
    const layer = this.add.graphics().setDepth(118);
    const pieces = [
      [-34, -12, 0x75b8c5], [4, -22, 0xa6acb0], [37, -4, 0xc99167],
      [-23, 22, 0xd66b70], [14, 19, 0xd6d1bd], [42, 28, 0xe9e4d6],
    ];
    for (const [dx, dy, color] of pieces) {
      layer.fillStyle(0x294637, 0.2);
      layer.fillEllipse(x + dx, y + dy + 7, 25, 10);
      layer.fillStyle(color, 1);
      layer.fillRoundedRect(x + dx - 9, y + dy - 7, 18, 15, 3);
      layer.lineStyle(2, 0x294637, 0.65);
      layer.strokeRoundedRect(x + dx - 9, y + dy - 7, 18, 15, 3);
    }
    this.add.text(x, y - 57, "🧹 CLEANUP", {
      color: "#294637",
      fontFamily: "system-ui, sans-serif",
      fontSize: "13px",
      fontStyle: "bold",
      backgroundColor: "rgba(255, 249, 223, 0.9)",
      padding: { x: 7, y: 4 },
    }).setOrigin(0.5).setDepth(119);
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
    const homeSignature = state?.home ? `${state.home.wallColor}:${state.home.roofStyle}:${state.home.roofColor}:${state.created}` : null;
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
    this.time.delayedCall(1450, () => this.cameras.main.startFollow(this.activeCharacter(), true, 0.12, 0.12));
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
    document.body.dataset.residentControl = "true";
    this.updateStatus();
    return { ...result, directControl: true };
  }

  endCustomResidentControl() {
    const result = this.customResident?.endControl?.();
    if (!result?.returnPlayer) return result || { ok: false, message: "Resident control is not active." };
    this.player.setPosition(result.returnPlayer.x, result.returnPlayer.y);
    this.player.direction = result.returnPlayer.facing;
    this.player.setVisible(true);
    this.shadow.setVisible(true);
    this.customResidentCharacter?.setControlMovement(0, 0, false);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
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

  bindInterface() {
    this.zoomIn = document.querySelector("#zoom-in");
    this.zoomOut = document.querySelector("#zoom-out");
    this.interactionButton = document.querySelector("#interaction-action");
    this.onZoomIn = () => this.setZoom(this.cameras.main.zoom * 1.12);
    this.onZoomOut = () => this.setZoom(this.cameras.main.zoom / 1.12);
    this.onInteraction = () => this.interactions.activateCurrent();
    this.zoomIn?.addEventListener("click", this.onZoomIn);
    this.zoomOut?.addEventListener("click", this.onZoomOut);
    this.interactionButton?.addEventListener("click", this.onInteraction);
  }

  unbindInterface() {
    this.movement?.destroy();
    this.unsubscribeCustomResident?.();
    this.zoomIn?.removeEventListener("click", this.onZoomIn);
    this.zoomOut?.removeEventListener("click", this.onZoomOut);
    this.interactionButton?.removeEventListener("click", this.onInteraction);
    this.renderInteractionPrompt(null);
    if (this.customResident?.getSnapshot?.().controlling) this.endCustomResidentControl();
  }

  setSceneInterface() {
    document.body.dataset.gameScene = this.scene.key;
    const badge = document.querySelector(".milestone-badge");
    const hint = document.querySelector("#control-hint");
    if (badge) badge.textContent = "PHASER TOWN · MILESTONE 9";
    if (hint) hint.textContent = "Arrow keys or WASD to walk · E or Space to interact · Shift to run";
  }

  renderInteractionPrompt(interaction) {
    const prompt = document.querySelector("#interaction-prompt");
    const button = document.querySelector("#interaction-action");
    const detail = document.querySelector("#interaction-detail");
    if (!prompt || !button) return;
    prompt.classList.toggle("hidden", !interaction);
    prompt.setAttribute("aria-hidden", interaction ? "false" : "true");
    if (interaction) {
      button.textContent = `${interaction.icon || "✨"} ${interaction.label}`;
      if (detail) detail.textContent = interaction.detail || "Press E or Space";
    }
  }

  enterBakery() {
    if (this.transitioning) return { ok: false, reason: "A scene transition is already running." };
    if (this.customResident?.getSnapshot?.().controlling) return { ok: false, reason: "Return to your character before entering a building." };
    this.transitioning = true;
    this.movement.setEnabled(false);
    this.interactions.setEnabled(false);
    this.player.setMovement(0, 0, false);
    this.gameState?.updatePlayer({ scene: "BakeryScene", x: 640, y: 610, facing: "up" });
    document.querySelector("#game")?.setAttribute("data-transition", "entering-bakery");
    this.cameras.main.fadeOut(220, 23, 43, 31);
    this.time.delayedCall(240, () => {
      this.scene.start("BakeryScene", {
        returnPosition: { ...LITTLE_BAKERY.approach },
        returnFacing: "down",
        transitionCount: Number(this.entryData.transitionCount || 0) + 1,
      });
    });
    return { ok: true, targetScene: "BakeryScene" };
  }

  openFreshMarket() {
    if (this.transitioning) return { ok: false, reason: "A scene transition is already running." };
    if (this.customResident?.getSnapshot?.().controlling) return { ok: false, reason: "Return to your character before shopping." };
    if (!this.shopController) return { ok: false, reason: "The shop interface is not ready." };
    return this.shopController.open(FRESH_MARKET.id);
  }

  startWasteCollection() {
    if (this.transitioning) return { ok: false, reason: "A scene transition is already running." };
    if (this.customResident?.getSnapshot?.().controlling) return { ok: false, reason: "Return to your character before starting a job." };
    if (!this.cleanupService) return { ok: false, reason: "The cleanup system is not ready." };
    const result = this.cleanupService.begin(COMMONS_RUBBISH_JOB.id, {
      returnPosition: { x: this.player.x, y: this.player.y },
      returnFacing: this.player.direction,
    });
    if (!result.ok) return result;
    this.transitioning = true;
    this.movement.setEnabled(false);
    this.interactions.setEnabled(false);
    this.player.setMovement(0, 0, false);
    document.querySelector("#game")?.setAttribute("data-transition", "entering-waste-collection");
    this.cameras.main.fadeOut(220, 23, 43, 31);
    this.time.delayedCall(240, () => this.scene.start("WasteCollectionScene"));
    return { ok: true, targetScene: "WasteCollectionScene", session: result.session };
  }

  setOverlayOpen(open) {
    if (this.transitioning) return;
    this.movement?.setEnabled(!open);
    this.interactions?.setEnabled(!open);
    if (open) {
      this.player?.setMovement(0, 0, false);
      this.customResidentCharacter?.setControlMovement(0, 0, false);
    }
  }

  setZoom(value) {
    this.cameras.main.setZoom(Phaser.Math.Clamp(value, MIN_ZOOM, MAX_ZOOM));
    document.querySelector("#game")?.setAttribute("data-camera-zoom", this.cameras.main.zoom.toFixed(2));
  }

  isBlocked(x, y) {
    const edge = 34;
    if (x < edge || y < edge || x > WORLD.width - edge || y > WORLD.height - edge) return true;
    return [...COLLISION_RECTS, ...this.buildingCollisions].some((rect) => containsWithRadius(rect, x, y));
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
    return Math.hypot(actor.x - startX, actor.y - startY) > 0.01;
  }

  updateStatus() {
    const status = document.querySelector("#location-status");
    if (!status) return;
    const position = this.activePosition();
    let label = "Willowmere";
    for (const district of DISTRICTS) {
      if (containsWithRadius(district, position.x, position.y, 0)) label = district.title;
    }
    const prefix = this.customResident?.getSnapshot?.().controlling ? `${this.customResident.getSnapshot().profile.name} · ` : "";
    status.textContent = `${prefix}${label} · ${Math.round(position.x)}, ${Math.round(position.y)}`;
  }

  update(_time, delta) {
    this.worldSimulation?.tick(delta);
    this.npcTownLife?.update(delta, this.gameState?.getSnapshot().world);
    const residents = this.npcTownLife?.getResidents?.() || [];
    const activePosition = this.activePosition();
    for (const resident of residents) {
      const nearby = Math.hypot(resident.x - activePosition.x, resident.y - activePosition.y) <= 92;
      this.npcCharacters.get(resident.id)?.applyResident(resident, delta, nearby);
    }
    const { dx, dy, sprinting } = this.movement.getVector();
    const speed = sprinting ? SPRINT_SPEED : WALK_SPEED;
    const moving = this.moveActiveCharacter(dx, dy, speed * Math.min(delta, 50) / 1000);
    const controlling = this.customResident?.getSnapshot?.().controlling;
    if (controlling) {
      const facing = Math.abs(dx) > Math.abs(dy) && dx ? (dx < 0 ? "left" : "right") : dy ? (dy < 0 ? "up" : "down") : this.customResident.getSnapshot().location.facing;
      this.customResidentCharacter?.setControlMovement(dx, dy, moving);
      this.customResident?.setRuntimePosition?.({ x: this.customResidentCharacter.x, y: this.customResidentCharacter.y, facing });
      const personal = this.customResident.getResident();
      if (personal) this.customResidentCharacter?.applyResident(personal, delta, true);
    } else {
      this.player.setMovement(dx, dy, moving);
    }
    this.stateSyncElapsed += delta;
    if (this.stateSyncElapsed >= 250) {
      this.stateSyncElapsed = 0;
      if (!controlling) {
        this.gameState?.updatePlayer({
          scene: this.scene.key,
          x: this.player.x,
          y: this.player.y,
          facing: this.player.direction,
        });
      }
    }
    const currentPosition = this.activePosition();
    this.interactions.update(currentPosition.x, currentPosition.y);
    if (this.movement.consumeInteractPress()) this.interactions.activateCurrent();

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
      gameElement.dataset.animation = this.player.getAnimationState();
      gameElement.dataset.interaction = this.interactions.getState()?.id || "none";
      gameElement.dataset.transitionCount = String(Number(this.entryData.transitionCount || 0));
      gameElement.dataset.transition = this.transitioning ? "active" : "idle";
      const diagnostics = this.npcTownLife?.getDiagnostics?.();
      gameElement.dataset.npcResidents = String(diagnostics?.residentCount || 0);
      gameElement.dataset.npcVisible = String(diagnostics?.visibleCount || 0);
      gameElement.dataset.npcWalking = String(diagnostics?.walkingCount || 0);
      gameElement.dataset.npcPaused = String(Boolean(diagnostics?.paused));
      const sampleResident = residents[0];
      gameElement.dataset.npcSample = sampleResident
        ? `${sampleResident.id}:${Math.round(sampleResident.x)},${Math.round(sampleResident.y)}:${sampleResident.phase}`
        : "none";
      const customDiagnostics = this.customResident?.getDiagnostics?.();
      gameElement.dataset.customResidentCreated = String(Boolean(customDiagnostics?.created));
      gameElement.dataset.customResidentControl = String(Boolean(customDiagnostics?.controlling));
      gameElement.dataset.customResidentName = customDiagnostics?.residentName || "none";
      gameElement.dataset.customResidentHome = customDiagnostics?.homeNodeId || "none";
      gameElement.dataset.controlledX = Math.round(currentPosition.x);
      gameElement.dataset.controlledY = Math.round(currentPosition.y);
    }
  }

  getMilestoneState() {
    return {
      scene: this.scene.key,
      world: { ...WORLD },
      player: { x: Math.round(this.player.x), y: Math.round(this.player.y), facing: this.player.direction },
      camera: { zoom: Number(this.cameras.main.zoom.toFixed(2)), followingPlayer: !this.customResident?.getSnapshot?.().controlling },
      controls: { keyboard: true, touch: true, wheelZoom: true },
      interaction: this.interactions.getState(),
      migratedSystems: ["character-animation", "proximity-interactions", "bakery-scene-transition", "shared-game-state", "safe-save-foundation", "shared-economy", "fresh-market-shop", "waste-collection-job", "world-time-weather-lighting", "basic-npc-town-life", "custom-resident-profile-home-control"],
      npcTownLife: this.npcTownLife?.getDiagnostics?.(),
      customResident: this.customResident?.getDiagnostics?.(),
      sharedState: {
        schemaVersion: this.gameState?.getSnapshot().schemaVersion || null,
        source: this.gameState?.getSnapshot().source.kind || null,
        legacySaveUntouched: true,
      },
    };
  }
}
