import Phaser from "phaser";
import { ANIMAL_BY_ID, ANIMAL_SPECIES, animalReferenceFrame } from "../data/animals.js";
import { VISUAL_ASSET_IDS } from "../visual/visualManifest.js";
import { ITEM_CATALOG } from "../data/items.js";
import {
  PAWS_WONDERS_CATALOG,
  PAWS_WONDERS_DISPLAYS,
  PAWS_WONDERS_FIXTURES,
  PAWS_WONDERS_INTERIOR,
  pawsPercentRect,
  validatePawsWonders,
} from "../data/pawsWonders.js";
import { createPlayerAssets, PlayerCharacter } from "../entities/PlayerCharacter.js";
import { InteractionSystem } from "../systems/InteractionSystem.js";
import { MovementController } from "../systems/MovementController.js";
import { PAWS_WONDERS_GEOMETRY } from "../data/interiorGeometry.js";

const PLAYER_RADIUS = 17;
const WALK_SPEED = 220;
const SPRINT_SPEED = 330;

function circleTouchesRect(x, y, radius, rect) {
  const closestX = Math.max(rect.x, Math.min(x, rect.x + rect.width));
  const closestY = Math.max(rect.y, Math.min(y, rect.y + rect.height));
  return Math.hypot(x - closestX, y - closestY) < radius;
}

function itemLabel(item) {
  return item.category === "featured" ? `${item.name} · mystery egg` : `${item.name} · ${item.breed}`;
}

export class PawsWondersScene extends Phaser.Scene {
  constructor() {
    super("PawsWondersScene");
  }

  init(data = {}) {
    this.entryData = data;
    this.returnPosition = data.returnPosition || { x: 3460, y: 1160 };
    this.returnFacing = data.returnFacing || "down";
    this.selectedItemId = data.focusItemId || "pet-labrador";
  }

  create() {
    this.gameplayGeometry = PAWS_WONDERS_GEOMETRY;
    this.gameState = this.registry.get("gameState");
    this.pawsWonders = this.registry.get("pawsWonders");
    this.worldSimulation = this.registry.get("worldSimulation");
    this.npcTownLife = this.registry.get("npcTownLife");
    this.transitioning = false;
    this.worldSimulation?.setPaused?.("activity", true);
    this.npcTownLife?.setPaused?.("activity", true);
    const landscapeMessage = document.querySelector("#landscape-required-message");
    if (landscapeMessage) landscapeMessage.textContent = "Paws & Wonders is designed for landscape play. Turn your phone sideways to meet and adopt companions.";
    createPlayerAssets(this);
    this.drawInterior();
    this.createPlayer();
    this.createInteractions();
    this.bindInterface();
    this.selectCompanion(this.selectedItemId);
    this.setSceneInterface(true);
    this.cameras.main.fadeIn(220, 35, 57, 43);
    this.unsubscribeState = this.gameState?.subscribe?.(() => this.refreshFromState());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.shutdownScene());
  }

  drawInterior() {
    const room = PAWS_WONDERS_INTERIOR.room;
    this.add.rectangle(640, 360, 1280, 720, 0x173126);
    const floor = this.add.graphics();
    floor.fillStyle(0xf6edcf, 1);
    floor.fillRoundedRect(room.x, room.y, room.width, room.height, 20);
    floor.lineStyle(10, 0x42684f, 1);
    floor.strokeRoundedRect(room.x, room.y, room.width, room.height, 20);
    floor.lineStyle(2, 0xd8d0ae, 0.52);
    for (let x = room.x + 38; x < room.x + room.width; x += 76) floor.lineBetween(x, room.y + 10, x, room.y + room.height - 10);
    for (let y = room.y + 38; y < room.y + room.height; y += 76) floor.lineBetween(room.x + 10, y, room.x + room.width - 10, y);

    this.add.text(640, 30, PAWS_WONDERS_INTERIOR.sign, { color: "#fff2bd", fontFamily: "ui-monospace, monospace", fontSize: "29px", fontStyle: "bold", backgroundColor: "#315b43", padding: { x: 18, y: 8 } }).setOrigin(0.5).setDepth(40);
    this.add.text(640, 66, PAWS_WONDERS_INTERIOR.subtitle, { color: "#d6e8d2", fontFamily: "system-ui", fontSize: "13px" }).setOrigin(0.5).setDepth(40);

    const colours = { dogs: 0xb78755, exotics: 0x7e9a61, featured: 0x887353, counter: 0x4b7259 };
    this.fixtureRects = PAWS_WONDERS_GEOMETRY.collisions.map((entry) => ({ ...entry }));
    for (const [id, fixture] of Object.entries(PAWS_WONDERS_FIXTURES)) {
      const rect = pawsPercentRect(fixture);
      floor.fillStyle(colours[id], 1);
      floor.fillRoundedRect(rect.x, rect.y, rect.width, rect.height, 10);
      floor.lineStyle(4, 0x40372d, 0.9);
      floor.strokeRoundedRect(rect.x, rect.y, rect.width, rect.height, 10);
      this.add.text(rect.x + rect.width / 2, rect.y + 6, fixture.label, { color: "#fff8dd", fontFamily: "ui-monospace, monospace", fontSize: "10px", fontStyle: "bold" }).setOrigin(0.5, 0).setDepth(12);
    }
    this.petDisplays = new Map();
    for (const display of PAWS_WONDERS_DISPLAYS) this.drawPetDisplay(display);
    for (const npc of PAWS_WONDERS_INTERIOR.npcs) this.drawNpc(npc);

    const door = this.add.rectangle(PAWS_WONDERS_INTERIOR.exit.x, room.y + room.height - 4, 150, 21, 0xf0c85e).setStrokeStyle(4, 0x3d3428, 1).setDepth(30);
    this.add.text(door.x, door.y - 24, "EXIT TO WILLOWMERE", { color: "#294637", fontFamily: "ui-monospace, monospace", fontSize: "11px", fontStyle: "bold" }).setOrigin(0.5).setDepth(30);
    this.drawDetailPanel();
  }

  drawPetDisplay(display) {
    const item = PAWS_WONDERS_CATALOG[display.id];
    const rect = pawsPercentRect(display);
    const zone = this.add.rectangle(rect.x + rect.width / 2, rect.y + rect.height / 2, rect.width, rect.height, 0xfff8dc, 0.12).setStrokeStyle(2, 0xf6e39a, 0.85).setDepth(14);
    const touch = PAWS_WONDERS_GEOMETRY.displays[item.id].touchTarget;
    const hitTarget = this.add.zone(touch.x + touch.width / 2, touch.y + touch.height / 2, touch.width, touch.height).setDepth(20).setInteractive({ useHandCursor: true });
    hitTarget.on("pointerdown", () => this.selectCompanion(item.id));
    const bed = this.add.ellipse(zone.x, rect.y + rect.height * 0.72, Math.max(36, rect.width * 0.55), Math.max(12, rect.height * 0.22), item.category === "dog" ? 0xead092 : 0xc7dba5, 0.95).setDepth(15);
    const definition = ANIMAL_BY_ID[item.animalId];
    const referenceFrame = animalReferenceFrame(definition);
    const animalTextureKey = this.registry.get("visualRegistry").getTextureKey(VISUAL_ASSET_IDS.ANIMAL_REFERENCE_SHEET);
    const icon = referenceFrame === null || !this.textures.exists(animalTextureKey)
      ? this.add.text(zone.x, rect.y + rect.height * 0.45, item.icon, { fontFamily: "Apple Color Emoji, system-ui", fontSize: item.category === "featured" ? "35px" : "28px" }).setOrigin(0.5).setDepth(17)
      : this.add.image(zone.x, rect.y + rect.height * 0.62, animalTextureKey, referenceFrame).setOrigin(0.5, 1).setScale(item.category === "featured" ? 0.68 : 0.58).setDepth(17);
    const label = this.add.text(zone.x, rect.y + rect.height - 3, item.name, { color: "#263d30", fontFamily: "system-ui", fontSize: "9px", fontStyle: "bold", backgroundColor: "rgba(255,250,225,.9)", padding: { x: 4, y: 2 } }).setOrigin(0.5, 1).setDepth(18);
    const status = this.add.text(rect.x + rect.width - 3, rect.y + 3, "", { color: "#fff", fontSize: "8px", fontStyle: "bold", backgroundColor: "#47785a", padding: { x: 4, y: 2 } }).setOrigin(1, 0).setDepth(19);
    this.petDisplays.set(item.id, { item, rect, zone, hitTarget, bed, icon, label, status });
  }

  drawNpc(npc) {
    const room = PAWS_WONDERS_INTERIOR.room;
    const x = room.x + room.width * npc.x / 100;
    const y = room.y + room.height * npc.y / 100;
    this.add.ellipse(x, y + 21, 39, 13, 0x24392d, 0.23).setDepth(22);
    this.add.text(x, y, npc.icon, { fontSize: "38px" }).setOrigin(0.5).setDepth(23);
    this.add.text(x, y + 33, `${npc.name} · ${npc.role}`, { color: "#294637", backgroundColor: "rgba(255,249,223,.94)", fontSize: "9px", fontStyle: "bold", padding: { x: 4, y: 2 } }).setOrigin(0.5).setDepth(24);
  }

  drawDetailPanel() {
    const animalTextureKey = this.registry.get("visualRegistry").getTextureKey(VISUAL_ASSET_IDS.ANIMAL_REFERENCE_SHEET);
    this.add.rectangle(1062, 360, 330, 570, 0xfffbeb, 1).setStrokeStyle(5, 0x42684f).setDepth(25);
    this.detailEyebrow = this.add.text(925, 96, "SELECTED COMPANION", { color: "#78856f", fontFamily: "ui-monospace, monospace", fontSize: "10px", fontStyle: "bold" }).setDepth(26);
    this.detailIcon = this.add.image(1062, 192, animalTextureKey, animalReferenceFrame(ANIMAL_BY_ID["pet-dog-labrador"])).setOrigin(0.5, 1).setScale(1.25).setDepth(26);
    this.detailName = this.add.text(925, 208, "Sunny · Labrador", { color: "#244c36", fontFamily: "system-ui", fontSize: "22px", fontStyle: "bold", wordWrap: { width: 275 } }).setDepth(26);
    this.detailPersonality = this.add.text(925, 244, "Warm, bouncy and people-focused", { color: "#4f6c59", fontSize: "13px", fontStyle: "bold", wordWrap: { width: 275 } }).setDepth(26);
    this.detailDescription = this.add.text(925, 284, "", { color: "#5c6c61", fontSize: "12px", lineSpacing: 4, wordWrap: { width: 275 } }).setDepth(26);
    this.detailFoods = this.add.text(925, 377, "", { color: "#48624f", fontSize: "11px", lineSpacing: 3, wordWrap: { width: 275 } }).setDepth(26);
    this.detailPrice = this.add.text(925, 445, "🪙 420", { color: "#294c37", fontSize: "20px", fontStyle: "bold" }).setDepth(26);
    this.detailStatus = this.add.text(925, 482, "Not adopted · South Meadow after adoption", { color: "#68766c", fontSize: "11px", wordWrap: { width: 275 } }).setDepth(26);
    this.adoptButton = this.add.rectangle(1062, 551, 275, 56, 0x3d7a50).setStrokeStyle(2, 0x2b5f3b).setDepth(26).setInteractive({ useHandCursor: true });
    this.adoptButtonText = this.add.text(1062, 551, "Adopt · 🪙 420", { color: "#fff", fontSize: "15px", fontStyle: "bold" }).setOrigin(0.5).setDepth(27);
    this.adoptButton.on("pointerdown", () => this.adoptSelected());
    this.messageText = this.add.text(925, 592, "Adoptions are permanent and save immediately.", { color: "#5c6f60", fontSize: "10px", wordWrap: { width: 275 } }).setDepth(26);
  }

  createPlayer() {
    const spawn = PAWS_WONDERS_GEOMETRY.spawnPoints[0];
    this.player = new PlayerCharacter(this, spawn.x, spawn.y, { direction: spawn.facing }).setScale(1.02).setDepth(50);
    this.shadow = this.add.ellipse(spawn.x, spawn.y + 21, 36, 12, 0x24392d, 0.25).setDepth(49);
    this.movement = new MovementController(this);
  }

  createInteractions() {
    const products = [...this.petDisplays.values()].map(({ item }) => {
      const interaction = PAWS_WONDERS_GEOMETRY.displays[item.id].interaction;
      return ({ id: `paws-${item.id}`, kind: "pet-habitat", x: interaction.x, y: interaction.y, radius: interaction.radius,
      label: `Meet ${item.name}`, detail: `${item.breed} · 🪙 ${item.price.toLocaleString()}`,
      onActivate: () => this.selectCompanion(item.id),
      });
    });
    const exit = PAWS_WONDERS_GEOMETRY.triggerRegions[0];
    this.interactions = new InteractionSystem({ interactables: [...products, { id: "paws-exit", kind: "exit", x: exit.x, y: exit.y, radius: exit.radius, label: "Leave Paws & Wonders", detail: "Return to Willowmere", onActivate: () => this.exitToTown() }], onChange: (current) => this.renderInteractionPrompt(current) });
  }

  selectCompanion(itemId) {
    const product = this.pawsWonders?.getProduct?.(itemId);
    if (!product?.ok) return product || { ok: false, code: "unavailable" };
    this.selectedItemId = itemId;
    this.renderProduct(product);
    return product;
  }

  renderProduct(product) {
    const { item, resident } = product;
    this.detailIcon.setFrame(animalReferenceFrame(ANIMAL_BY_ID[item.animalId]));
    this.detailName.setText(itemLabel(item));
    this.detailPersonality.setText(item.personality);
    this.detailDescription.setText(product.unlocked ? item.description : `The egg is still sleeping. Restore ${product.requiredMilestones - product.milestones} more part${product.requiredMilestones - product.milestones === 1 ? "" : "s"} of town to wake it.`);
    this.detailFoods.setText(`Favourite foods: ${item.foodIds.map((id) => ITEM_CATALOG[id]?.name || id).join(", ")}\nAdopted companions roam safely in South Meadow.`);
    this.detailPrice.setText(`🪙 ${item.price.toLocaleString()}`);
    const status = product.adopted ? (product.location === "following" ? "Adopted · following you" : "Adopted · roaming South Meadow") : product.unlocked ? "Not adopted · permanent one-time adoption" : `${product.milestones} / ${product.requiredMilestones} restorations complete`;
    this.detailStatus.setText(status);
    let label = `Adopt ${resident.name} · 🪙 ${item.price.toLocaleString()}`;
    if (product.adopted) label = "Already adopted";
    else if (!product.unlocked) label = `${product.milestones} / ${product.requiredMilestones} restorations`;
    else if (!product.affordable) label = `Need 🪙 ${product.shortfall.toLocaleString()} more`;
    this.adoptButtonText.setText(label);
    this.adoptButton.disableInteractive();
    if (product.canAdopt) this.adoptButton.setInteractive({ useHandCursor: true });
    this.adoptButton.setFillStyle(product.canAdopt ? 0x3d7a50 : 0x87948a);
    const mobileName = document.querySelector("#paws-mobile-name");
    const mobileSummary = document.querySelector("#paws-mobile-summary");
    const mobileAdopt = document.querySelector("#paws-mobile-adopt");
    if (mobileName) mobileName.textContent = itemLabel(item);
    if (mobileSummary) mobileSummary.textContent = `${status} · 🪙 ${item.price.toLocaleString()}`;
    if (mobileAdopt) {
      mobileAdopt.textContent = label;
      mobileAdopt.disabled = !product.canAdopt;
    }
    for (const [id, display] of this.petDisplays) display.zone.setStrokeStyle(id === item.id ? 4 : 2, id === item.id ? 0xffd96b : 0xf6e39a, 0.9);
  }

  cycleCompanion(direction) {
    const itemIds = Object.keys(PAWS_WONDERS_CATALOG);
    const current = Math.max(0, itemIds.indexOf(this.selectedItemId));
    return this.selectCompanion(itemIds[(current + direction + itemIds.length) % itemIds.length]);
  }

  refreshFromState() {
    for (const [id, display] of this.petDisplays) {
      const product = this.pawsWonders.getProduct(id);
      display.status.setText(product.adopted ? "ADOPTED" : !product.unlocked ? "LOCKED" : "").setVisible(product.adopted || !product.unlocked);
      display.icon.setAlpha(product.adopted ? 0.3 : 1);
      display.bed.setAlpha(product.adopted ? 0.35 : 1);
    }
    this.selectCompanion(this.selectedItemId);
    const balance = this.gameState.getSnapshot().economy.coins;
    const balanceElement = document.querySelector("#paws-balance");
    if (balanceElement) balanceElement.textContent = `🪙 ${balance.toLocaleString()}`;
  }

  adoptSelected() {
    if (this.transitioning) return { ok: false, code: "busy" };
    const result = this.pawsWonders?.adopt?.(this.selectedItemId) || { ok: false, code: "unavailable", message: "Adoptions are not ready." };
    this.messageText.setColor(result.ok ? "#28613b" : "#8a4934");
    this.messageText.setText(result.ok ? `🎉 Congratulations! ${result.name} is now roaming in South Meadow.` : result.message);
    this.refreshFromState();
    const mobileStatus = document.querySelector("#paws-mobile-status");
    if (mobileStatus) mobileStatus.textContent = result.ok ? `${result.name} adopted and saved.` : result.message;
    return result;
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
    this.exitButton = document.querySelector("#paws-exit");
    this.mobilePreviousButton = document.querySelector("#paws-mobile-previous");
    this.mobileNextButton = document.querySelector("#paws-mobile-next");
    this.mobileAdoptButton = document.querySelector("#paws-mobile-adopt");
    this.onInteraction = () => this.interactions.activateCurrent();
    this.onExit = () => this.exitToTown();
    this.onMobilePrevious = () => this.cycleCompanion(-1);
    this.onMobileNext = () => this.cycleCompanion(1);
    this.onMobileAdopt = () => this.adoptSelected();
    this.interactionButton?.addEventListener("click", this.onInteraction);
    this.exitButton?.addEventListener("click", this.onExit);
    this.mobilePreviousButton?.addEventListener("click", this.onMobilePrevious);
    this.mobileNextButton?.addEventListener("click", this.onMobileNext);
    this.mobileAdoptButton?.addEventListener("click", this.onMobileAdopt);
    this.escapeKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.adoptKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
  }

  isBlocked(x, y) {
    const room = PAWS_WONDERS_GEOMETRY.worldBounds;
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
    if (this.transitioning) return { ok: false, code: "busy" };
    this.transitioning = true;
    this.movement.setEnabled(false);
    this.interactions.setEnabled(false);
    this.player.setMovement(0, 0, false);
    this.cameras.main.fadeOut(200, 35, 57, 43);
    this.time.delayedCall(220, () => this.scene.start("TownScene", { returnPosition: this.returnPosition, returnFacing: this.returnFacing, transitionCount: Number(this.entryData.transitionCount || 0) + 1 }));
    return { ok: true, targetScene: "TownScene" };
  }

  setSceneInterface(active) {
    document.body.dataset.gameScene = active ? this.scene.key : "";
    document.querySelector("#paws-hud")?.classList.toggle("hidden", !active);
    document.querySelector("#game")?.setAttribute("data-scene", active ? this.scene.key : "");
    if (active) this.refreshFromState();
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
    if (Phaser.Input.Keyboard.JustDown(this.adoptKey)) this.adoptSelected();
    if (Phaser.Input.Keyboard.JustDown(this.escapeKey)) this.exitToTown();
  }

  getMilestoneState() {
    return { milestone: 36, scene: this.scene.key, pawsWonders: { ...validatePawsWonders(), ...this.pawsWonders?.getDiagnostics?.(), walkable: true, touchControls: true, keyboardControls: true, rightDetailPanel: true, landscapeRequiredOnMobile: true } };
  }

  shutdownScene() {
    this.unsubscribeState?.();
    this.movement?.destroy();
    this.interactionButton?.removeEventListener("click", this.onInteraction);
    this.exitButton?.removeEventListener("click", this.onExit);
    this.mobilePreviousButton?.removeEventListener("click", this.onMobilePrevious);
    this.mobileNextButton?.removeEventListener("click", this.onMobileNext);
    this.mobileAdoptButton?.removeEventListener("click", this.onMobileAdopt);
    this.renderInteractionPrompt(null);
    this.worldSimulation?.setPaused?.("activity", false);
    this.npcTownLife?.setPaused?.("activity", false);
    this.setSceneInterface(false);
  }
}
