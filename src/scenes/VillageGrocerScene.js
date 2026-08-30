import Phaser from "phaser";
import { ITEM_CATALOG } from "../data/items.js";
import {
  VILLAGE_GROCER_DISPLAYS,
  VILLAGE_GROCER_FIXTURES,
  VILLAGE_GROCER_INTERIOR,
  VILLAGE_GROCER_NPCS,
  percentRect,
  validateVillageGrocerInterior,
} from "../data/villageGrocer.js";
import { createPlayerAssets, PlayerCharacter } from "../entities/PlayerCharacter.js";
import { InteractionSystem } from "../systems/InteractionSystem.js";
import { MovementController } from "../systems/MovementController.js";
import { VILLAGE_GROCER_GEOMETRY } from "../data/interiorGeometry.js";

const PLAYER_RADIUS = 18;
const WALK_SPEED = 220;
const SPRINT_SPEED = 330;

function circleTouchesRect(x, y, radius, rect) {
  const closestX = Math.max(rect.x, Math.min(x, rect.x + rect.width));
  const closestY = Math.max(rect.y, Math.min(y, rect.y + rect.height));
  return Math.hypot(x - closestX, y - closestY) < radius;
}

export class VillageGrocerScene extends Phaser.Scene {
  constructor() {
    super("VillageGrocerScene");
  }

  init(data = {}) {
    this.entryData = data;
    this.returnPosition = data.returnPosition || { x: 555, y: 1170 };
    this.returnFacing = data.returnFacing || "down";
    this.focusItemId = data.focusItemId || null;
  }

  create() {
    this.gameplayGeometry = VILLAGE_GROCER_GEOMETRY;
    this.gameState = this.registry.get("gameState");
    this.shopController = this.registry.get("shopController");
    this.worldSimulation = this.registry.get("worldSimulation");
    this.npcTownLife = this.registry.get("npcTownLife");
    this.transitioning = false;
    this.overlayOpen = false;
    this.worldSimulation?.setPaused?.("activity", true);
    this.npcTownLife?.setPaused?.("activity", true);
    createPlayerAssets(this);
    this.drawInterior();
    this.createPlayer();
    this.createInteractions();
    this.bindInterface();
    this.setSceneInterface(true);
    this.cameras.main.fadeIn(220, 29, 54, 36);
    const initialItemId = ITEM_CATALOG[this.focusItemId]?.retailer === "town-grocer" ? this.focusItemId : "carrot-seeds";
    this.time.delayedCall(260, () => this.openProduct(initialItemId));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.shutdownScene());
  }

  drawInterior() {
    const room = VILLAGE_GROCER_INTERIOR.room;
    this.add.rectangle(640, 360, 1280, 720, 0x193527);
    const floor = this.add.graphics();
    floor.fillStyle(0xf3edc9, 1);
    floor.fillRoundedRect(room.x, room.y, room.width, room.height, 20);
    floor.lineStyle(12, 0x304f3c, 1);
    floor.strokeRoundedRect(room.x, room.y, room.width, room.height, 20);
    floor.lineStyle(2, 0xd5d9b3, 0.58);
    for (let x = room.x + 42; x < room.x + room.width; x += 84) floor.lineBetween(x, room.y + 10, x, room.y + room.height - 10);
    for (let y = room.y + 42; y < room.y + room.height; y += 84) floor.lineBetween(room.x + 10, y, room.x + room.width - 10, y);

    this.add.text(640, 35, VILLAGE_GROCER_INTERIOR.sign, {
      color: "#fff2bf", fontFamily: "ui-monospace, monospace", fontSize: "30px", fontStyle: "bold",
      backgroundColor: "#284d38", padding: { x: 18, y: 9 },
    }).setOrigin(0.5).setDepth(30);
    this.add.text(640, 72, VILLAGE_GROCER_INTERIOR.subtitle, { color: "#d7e8cf", fontFamily: "system-ui", fontSize: "14px" }).setOrigin(0.5).setDepth(30);

    const fixtureColours = { shelf: 0x9c713e, islandA: 0x77955a, islandB: 0xb58955, counter: 0x496c58 };
    this.fixtureRects = VILLAGE_GROCER_GEOMETRY.collisions.map((entry) => ({ ...entry }));
    Object.entries(VILLAGE_GROCER_FIXTURES).forEach(([id, fixture]) => {
      const rect = percentRect(fixture);
      floor.fillStyle(fixtureColours[id], 1);
      floor.fillRoundedRect(rect.x, rect.y, rect.width, rect.height, 10);
      floor.lineStyle(4, 0x3d3428, 0.9);
      floor.strokeRoundedRect(rect.x, rect.y, rect.width, rect.height, 10);
      this.add.text(rect.x + rect.width / 2, rect.y + 8, fixture.label, {
        color: "#fff8da", fontFamily: "ui-monospace, monospace", fontSize: "11px", fontStyle: "bold",
      }).setOrigin(0.5, 0).setDepth(12);
    });

    this.productZones = [];
    for (const display of VILLAGE_GROCER_DISPLAYS) this.drawProductDisplay(display);
    for (const npc of VILLAGE_GROCER_NPCS) this.drawNpc(npc);

    const door = this.add.rectangle(VILLAGE_GROCER_INTERIOR.exit.x, room.y + room.height - 4, 150, 22, 0xf0c85e).setStrokeStyle(4, 0x3d3428, 1).setDepth(20);
    this.add.text(door.x, door.y - 28, "EXIT TO WILLOWMERE", { color: "#294637", fontFamily: "ui-monospace, monospace", fontSize: "12px", fontStyle: "bold" }).setOrigin(0.5).setDepth(20);
  }

  drawProductDisplay(display) {
    const item = ITEM_CATALOG[display.id];
    const rect = percentRect(display);
    const zone = this.add.rectangle(rect.x + rect.width / 2, rect.y + rect.height / 2, rect.width, rect.height, 0xfff6cf, 0.08)
      .setStrokeStyle(2, 0xffef9c, 0.7)
      .setDepth(14);
    const touch = VILLAGE_GROCER_GEOMETRY.displays[display.id].touchTarget;
    const hitTarget = this.add.zone(touch.x + touch.width / 2, touch.y + touch.height / 2, touch.width, touch.height)
      .setDepth(17).setInteractive({ useHandCursor: true });
    hitTarget.on("pointerdown", () => this.openProduct(display.id));
    const copies = Math.max(2, Math.min(10, display.count));
    for (let index = 0; index < copies; index += 1) {
      const x = rect.x + rect.width * (index + 0.5) / copies;
      this.add.text(x, rect.y + rect.height * 0.48, item.icon, { fontSize: display.displayKind === "sapling" ? "25px" : "20px" }).setOrigin(0.5).setDepth(15);
    }
    this.add.text(rect.x + rect.width / 2, rect.y + rect.height - 5, item.name, {
      color: "#263d30", fontFamily: "system-ui", fontSize: display.width < 15 ? "9px" : "11px", fontStyle: "bold",
      backgroundColor: "rgba(255,250,220,.86)", padding: { x: 4, y: 2 },
    }).setOrigin(0.5, 1).setDepth(16);
    this.productZones.push({ display, item, rect, zone, hitTarget });
  }

  drawNpc(npc) {
    const room = VILLAGE_GROCER_INTERIOR.room;
    const x = room.x + room.width * npc.x / 100;
    const y = room.y + room.height * npc.y / 100;
    this.add.ellipse(x, y + 23, 42, 14, 0x24392d, 0.22).setDepth(17);
    this.add.text(x, y, npc.icon, { fontSize: "42px" }).setOrigin(0.5).setDepth(18);
    this.add.text(x, y + 36, `${npc.name} · ${npc.role}`, { color: "#294637", backgroundColor: "rgba(255,249,223,.92)", fontSize: "10px", fontStyle: "bold", padding: { x: 5, y: 2 } }).setOrigin(0.5).setDepth(19);
  }

  createPlayer() {
    const spawn = VILLAGE_GROCER_GEOMETRY.spawnPoints[0];
    this.player = new PlayerCharacter(this, spawn.x, spawn.y, { direction: spawn.facing }).setScale(1.06).setDepth(50);
    this.shadow = this.add.ellipse(spawn.x, spawn.y + 21, 38, 13, 0x24392d, 0.25).setDepth(49);
    this.movement = new MovementController(this);
  }

  createInteractions() {
    const products = this.productZones.map(({ display, item }) => {
      const interaction = VILLAGE_GROCER_GEOMETRY.displays[display.id].interaction;
      return ({
      id: `grocer-${display.id}`,
      kind: "grocer-product",
      x: interaction.x, y: interaction.y, radius: interaction.radius,
      label: `Inspect ${item.name}`,
      detail: `🪙 ${item.price.toLocaleString()} · ${display.fixture === "islandB" ? "animal food" : "farming stock"}`,
      onActivate: () => this.openProduct(item.id),
      });
    });
    const exit = VILLAGE_GROCER_GEOMETRY.triggerRegions[0];
    this.interactions = new InteractionSystem({
      interactables: [...products, {
        id: "grocer-exit", kind: "exit", x: exit.x, y: exit.y, radius: exit.radius,
        label: "Leave Village Grocer", detail: "Return to Willowmere", onActivate: () => this.exitToTown(),
      }],
      onChange: (current) => this.renderInteractionPrompt(current),
    });
  }

  openProduct(itemId) {
    if (this.transitioning || this.overlayOpen) return { ok: false, code: "busy" };
    const item = ITEM_CATALOG[itemId];
    return this.shopController?.open?.("town-grocer", { group: item?.shopGroup, itemId }) || { ok: false, message: "The shop counter is not ready." };
  }

  renderInteractionPrompt(current) {
    const prompt = document.querySelector("#interaction-prompt");
    const action = document.querySelector("#interaction-action");
    const detail = document.querySelector("#interaction-detail");
    if (!prompt) return;
    prompt.classList.toggle("hidden", !current);
    prompt.setAttribute("aria-hidden", current ? "false" : "true");
    if (action && current) action.textContent = current.label;
    if (detail && current) detail.textContent = `${current.detail} · E or Space`;
  }

  bindInterface() {
    this.interactionButton = document.querySelector("#interaction-action");
    this.exitButton = document.querySelector("#grocer-exit");
    this.onInteraction = () => this.interactions.activateCurrent();
    this.onExit = () => this.exitToTown();
    this.interactionButton?.addEventListener("click", this.onInteraction);
    this.exitButton?.addEventListener("click", this.onExit);
    this.escapeKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
  }

  setOverlayOpen(open) {
    this.overlayOpen = Boolean(open);
    this.movement?.setEnabled(!open && !this.transitioning);
    this.interactions?.setEnabled(!open && !this.transitioning);
    if (open) this.player?.setMovement(0, 0, false);
  }

  isBlocked(x, y) {
    const room = VILLAGE_GROCER_GEOMETRY.worldBounds;
    if (x < room.x + PLAYER_RADIUS || x > room.x + room.width - PLAYER_RADIUS || y < room.y + PLAYER_RADIUS || y > room.y + room.height - PLAYER_RADIUS) return true;
    return this.fixtureRects.some((rect) => circleTouchesRect(x, y, PLAYER_RADIUS, rect));
  }

  movePlayer(dx, dy, distance) {
    const magnitude = Math.hypot(dx, dy) || 1;
    const stepX = dx / magnitude * distance;
    const stepY = dy / magnitude * distance;
    const before = { x: this.player.x, y: this.player.y };
    if (!this.isBlocked(this.player.x + stepX, this.player.y)) this.player.x += stepX;
    if (!this.isBlocked(this.player.x, this.player.y + stepY)) this.player.y += stepY;
    return Math.hypot(this.player.x - before.x, this.player.y - before.y) > 0.01;
  }

  exitToTown() {
    if (this.transitioning || this.overlayOpen) return { ok: false, code: "busy" };
    this.transitioning = true;
    this.movement.setEnabled(false);
    this.interactions.setEnabled(false);
    this.player.setMovement(0, 0, false);
    this.cameras.main.fadeOut(200, 29, 54, 36);
    this.time.delayedCall(220, () => this.scene.start("TownScene", { returnPosition: this.returnPosition, returnFacing: this.returnFacing, transitionCount: Number(this.entryData.transitionCount || 0) + 1 }));
    return { ok: true, targetScene: "TownScene" };
  }

  setSceneInterface(active) {
    document.body.dataset.gameScene = active ? this.scene.key : "";
    document.querySelector("#grocer-hud")?.classList.toggle("hidden", !active);
    document.querySelector("#game")?.setAttribute("data-scene", active ? this.scene.key : "");
    if (active) {
      const balance = this.gameState?.getSnapshot?.().economy.coins || 0;
      const balanceElement = document.querySelector("#grocer-balance");
      if (balanceElement) balanceElement.textContent = `🪙 ${balance.toLocaleString()}`;
    }
  }

  update(_time, delta) {
    if (!this.player || this.transitioning) return;
    const { dx, dy, sprinting } = this.movement.getVector();
    const moving = this.movePlayer(dx, dy, (sprinting ? SPRINT_SPEED : WALK_SPEED) * Math.min(50, delta) / 1000);
    this.player.setMovement(dx, dy, moving);
    this.player.setDepth(50 + this.player.y / 20);
    this.shadow.setPosition(this.player.x, this.player.y + 21).setDepth(49 + this.player.y / 20);
    this.interactions.update(this.player.x, this.player.y);
    if (this.movement.consumeInteractPress()) this.interactions.activateCurrent();
    if (Phaser.Input.Keyboard.JustDown(this.escapeKey) && !this.overlayOpen) this.exitToTown();
    const balance = document.querySelector("#grocer-balance");
    if (balance) balance.textContent = `🪙 ${(this.gameState?.getSnapshot?.().economy.coins || 0).toLocaleString()}`;
  }

  getMilestoneState() {
    const validation = validateVillageGrocerInterior();
    return {
      milestone: 26,
      scene: this.scene.key,
      villageGrocer: { ...validation, topDown: true, walkable: true, touchControls: true, keyboardControls: true },
      farming: this.registry.get("farming")?.getDiagnostics?.(),
    };
  }

  shutdownScene() {
    this.shopController?.isOpen?.() && this.shopController.close();
    this.movement?.destroy();
    this.interactionButton?.removeEventListener("click", this.onInteraction);
    this.exitButton?.removeEventListener("click", this.onExit);
    this.renderInteractionPrompt(null);
    this.worldSimulation?.setPaused?.("activity", false);
    this.npcTownLife?.setPaused?.("activity", false);
    this.setSceneInterface(false);
  }
}
