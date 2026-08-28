import Phaser from "phaser";
import {
  HARBOUR_GENERAL,
  HARBOUR_GENERAL_CATALOG,
  HARBOUR_GENERAL_CONFIG,
  HARBOUR_GENERAL_INTERIOR,
  HARBOUR_GENERAL_ITEM_IDS,
  harbourDemand,
  validateHarbourGeneralCatalogue,
} from "../data/harbourGeneral.js";
import { createPlayerAssets, PlayerCharacter } from "../entities/PlayerCharacter.js";
import { InteractionSystem } from "../systems/InteractionSystem.js";
import { MovementController } from "../systems/MovementController.js";

const PLAYER_RADIUS = 17;
const WALK_SPEED = 220;
const SPRINT_SPEED = 330;
const HARBOUR_GENERAL_REFERENCE_KEY = "legacy-harbour-general";
const HARBOUR_GENERAL_REFERENCE_PATH = "/assets/legacy-reference/harbour-general.webp";

function circleTouchesRect(x, y, radius, rect) {
  const closestX = Math.max(rect.x, Math.min(x, rect.x + rect.width));
  const closestY = Math.max(rect.y, Math.min(y, rect.y + rect.height));
  return Math.hypot(x - closestX, y - closestY) < radius;
}

function demandLabel(value) {
  if (value >= 2.2) return "Very high";
  if (value >= 1.1) return "Good";
  return "Low";
}

export class HarbourGeneralScene extends Phaser.Scene {
  constructor() {
    super("HarbourGeneralScene");
  }

  init(data = {}) {
    this.entryData = data;
    this.returnPosition = data.returnPosition || { x: HARBOUR_GENERAL.approach.x, y: HARBOUR_GENERAL.approach.y + 42 };
    this.returnFacing = data.returnFacing || "down";
    this.selectedSlot = Math.max(0, Math.min(5, Number(data.slot) || 0));
    this.selectedItemId = data.itemId || null;
  }

  preload() {
    if (!this.textures.exists(HARBOUR_GENERAL_REFERENCE_KEY)) this.load.image(HARBOUR_GENERAL_REFERENCE_KEY, HARBOUR_GENERAL_REFERENCE_PATH);
  }

  create() {
    this.gameState = this.registry.get("gameState");
    this.harbourGeneral = this.registry.get("harbourGeneral");
    this.worldSimulation = this.registry.get("worldSimulation");
    this.npcTownLife = this.registry.get("npcTownLife");
    this.transitioning = false;
    this.worldSimulation?.setPaused?.("activity", true);
    this.npcTownLife?.setPaused?.("activity", true);
    const rotation = document.querySelector("#landscape-required-message");
    if (rotation) rotation.textContent = "Harbour General is designed for landscape play. Turn your phone sideways to manage the displays and till.";
    createPlayerAssets(this);
    this.drawInterior();
    this.createPlayer();
    this.createInteractions();
    this.bindInterface();
    this.refreshFromState();
    this.setSceneInterface(true);
    this.cameras.main.fadeIn(220, 28, 64, 63);
    this.unsubscribeState = this.harbourGeneral?.subscribe?.(() => this.refreshFromState());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.shutdownScene());
  }

  drawInterior() {
    const room = HARBOUR_GENERAL_INTERIOR.room;
    this.add.rectangle(640, 360, 1280, 720, 0x18383a);
    const recoveredReference = this.textures.exists(HARBOUR_GENERAL_REFERENCE_KEY);
    if (recoveredReference) {
      this.add.image(640, 360, HARBOUR_GENERAL_REFERENCE_KEY)
        .setDisplaySize(1280, 720)
        .setDepth(1)
        .setData("spriteAiLabel", "legacy-reference.harbour-general.complete-interior");
    }
    const floor = this.add.graphics();
    floor.setDepth(2);
    floor.fillStyle(0xa8ceca, recoveredReference ? 0.08 : 1);
    floor.fillRoundedRect(room.x, room.y, room.width, room.height, 18);
    floor.lineStyle(9, 0x29243a, 1);
    floor.strokeRoundedRect(room.x, room.y, room.width, room.height, 18);
    floor.lineStyle(2, 0x5f9ca0, recoveredReference ? 0.1 : 0.34);
    for (let x = room.x + 40; x < room.x + room.width; x += 40) floor.lineBetween(x, room.y + 8, x, room.y + room.height - 8);
    for (let y = room.y + 40; y < room.y + room.height; y += 40) floor.lineBetween(room.x + 8, y, room.x + room.width - 8, y);
    if (!recoveredReference) {
      this.add.text(640, 29, "HARBOUR GENERAL", { color: "#2d3240", fontFamily: "ui-monospace, monospace", fontSize: "28px", fontStyle: "bold", backgroundColor: "#fff5cf", padding: { x: 20, y: 8 } }).setOrigin(0.5).setDepth(60);
      this.add.text(640, 68, "YOUR SHOP · WEATHER GEAR & EVERYDAY ESSENTIALS", { color: "#d6eeee", fontFamily: "system-ui", fontSize: "12px", fontStyle: "bold" }).setOrigin(0.5).setDepth(60);
    }

    this.fixtureRects = [];
    for (const fixture of HARBOUR_GENERAL_INTERIOR.fixtures) {
      floor.fillStyle(fixture.id === "weather" ? 0x627f80 : 0x7b684c, recoveredReference ? 0.16 : 1);
      floor.fillRoundedRect(fixture.x, fixture.y, fixture.width, fixture.height, 10);
      floor.lineStyle(4, 0x29243a, 1);
      floor.strokeRoundedRect(fixture.x, fixture.y, fixture.width, fixture.height, 10);
      if (!recoveredReference) this.add.text(fixture.x + fixture.width / 2, fixture.y + 12, fixture.label, { color: "#fff7dc", fontFamily: "ui-monospace, monospace", fontSize: "10px", fontStyle: "bold" }).setOrigin(0.5, 0).setDepth(15);
      this.fixtureRects.push({ ...fixture });
    }

    this.slotViews = new Map();
    for (const slot of HARBOUR_GENERAL_INTERIOR.slots) this.drawSlot(slot);

    const counter = { x: 750, y: 530, width: 140, height: 78 };
    floor.fillStyle(0x79737c, recoveredReference ? 0.14 : 1);
    floor.fillRoundedRect(counter.x, counter.y, counter.width, counter.height, 8);
    floor.lineStyle(4, 0x29243a, 1);
    floor.strokeRoundedRect(counter.x, counter.y, counter.width, counter.height, 8);
    this.fixtureRects.push({ id: "counter", ...counter });
    if (!recoveredReference) {
      this.add.text(820, 542, "AMELIA · COUNTER", { color: "#2d3240", backgroundColor: "#fff5cf", fontFamily: "ui-monospace, monospace", fontSize: "9px", fontStyle: "bold", padding: { x: 6, y: 4 } }).setOrigin(0.5).setDepth(18);
      this.add.text(820, 578, "👩‍💼", { fontSize: "32px" }).setOrigin(0.5).setDepth(19);
    }

    const exit = HARBOUR_GENERAL_INTERIOR.exit;
    const door = this.add.rectangle(exit.x, room.y + room.height - 4, 150, 21, 0xf0c85e).setStrokeStyle(4, 0x3d3428).setDepth(30);
    this.add.text(door.x, door.y - 24, "EXIT TO WILLOWMERE", { color: "#294637", fontFamily: "ui-monospace, monospace", fontSize: "11px", fontStyle: "bold" }).setOrigin(0.5).setDepth(31);
    this.drawManagementPanel();
  }

  drawSlot(slot) {
    const zone = this.add.rectangle(slot.x + slot.width / 2, slot.y + slot.height / 2, slot.width, slot.height, 0xffffff, 0.06).setStrokeStyle(2, 0xfff3c2, 0.7).setDepth(20).setInteractive({ useHandCursor: true });
    const icon = this.add.text(slot.x + 28, zone.y, "＋", { fontSize: "25px" }).setOrigin(0.5).setDepth(21);
    const name = this.add.text(slot.x + 53, slot.y + 12, "Empty display", { color: "#fff7dc", fontFamily: "system-ui", fontSize: "12px", fontStyle: "bold", wordWrap: { width: 185 } }).setDepth(21);
    const stock = this.add.text(slot.x + slot.width - 12, zone.y, "0", { color: "#2d3240", backgroundColor: "#fff5cf", fontFamily: "ui-monospace, monospace", fontSize: "14px", fontStyle: "bold", padding: { x: 7, y: 4 } }).setOrigin(1, 0.5).setDepth(22);
    zone.on("pointerdown", () => this.selectSlot(slot.slot));
    this.slotViews.set(slot.slot, { slot, zone, icon, name, stock });
  }

  makeButton(x, y, width, label, onPress, colour = 0x4d965d) {
    const background = this.add.rectangle(x, y, width, 38, colour).setStrokeStyle(2, 0x29243a).setDepth(42).setInteractive({ useHandCursor: true });
    const text = this.add.text(x, y, label, { color: "#fffbea", fontFamily: "ui-monospace, monospace", fontSize: "10px", fontStyle: "bold", align: "center", wordWrap: { width: width - 8 } }).setOrigin(0.5).setDepth(43);
    background.on("pointerdown", onPress);
    return { background, text, setEnabled(enabled) { background.disableInteractive(); if (enabled) background.setInteractive({ useHandCursor: true }); background.setAlpha(enabled ? 1 : 0.42); text.setAlpha(enabled ? 1 : 0.58); } };
  }

  drawManagementPanel() {
    this.add.rectangle(1060, 370, 330, 570, 0xfff5d9).setStrokeStyle(5, 0x29243a).setDepth(35);
    this.panelEyebrow = this.add.text(916, 96, "DISPLAY 1 · SELECTED PRODUCT", { color: "#6b5c48", fontFamily: "ui-monospace, monospace", fontSize: "9px", fontStyle: "bold" }).setDepth(36);
    this.panelIcon = this.add.text(1060, 142, "☂️", { fontSize: "42px" }).setOrigin(0.5).setDepth(36);
    this.panelName = this.add.text(916, 170, "Umbrella", { color: "#2d3240", fontSize: "18px", fontStyle: "bold", wordWrap: { width: 286 } }).setDepth(36);
    this.panelDescription = this.add.text(916, 197, "", { color: "#655e50", fontSize: "10px", lineSpacing: 3, wordWrap: { width: 286 } }).setDepth(36);
    this.panelStats = this.add.text(916, 248, "", { color: "#3f5d57", fontFamily: "ui-monospace, monospace", fontSize: "10px", lineSpacing: 4, wordWrap: { width: 286 } }).setDepth(36);
    this.messageText = this.add.text(916, 309, "Choose a display, then select stock below.", { color: "#6c614f", fontSize: "10px", wordWrap: { width: 286 } }).setDepth(36);
    this.assignButton = this.makeButton(968, 352, 94, "Place", () => this.assignSelected());
    this.restockButton = this.makeButton(1071, 352, 104, "Restock", () => this.restockSelected(), 0xd39a3c);
    this.clearButton = this.makeButton(1174, 352, 86, "Clear", () => this.clearSelected(), 0x807a72);

    this.catalogButtons = new Map();
    HARBOUR_GENERAL_ITEM_IDS.forEach((itemId, index) => {
      const item = HARBOUR_GENERAL_CATALOG[itemId];
      const column = index % 4;
      const row = Math.floor(index / 4);
      const x = 950 + column * 73;
      const y = 411 + row * 49;
      const button = this.add.rectangle(x, y, 66, 43, 0xfffaf0).setStrokeStyle(2, 0x29243a).setDepth(38).setInteractive({ useHandCursor: true });
      const icon = this.add.text(x, y - 5, item.icon, { fontSize: "19px" }).setOrigin(0.5).setDepth(39);
      const label = this.add.text(x, y + 13, item.name, { color: "#2d3240", fontSize: "6px", fontStyle: "bold", align: "center", wordWrap: { width: 60 } }).setOrigin(0.5).setDepth(39);
      button.on("pointerdown", () => this.selectItem(itemId));
      this.catalogButtons.set(itemId, { button, icon, label });
    });
    this.collectButton = this.makeButton(1060, 654, 286, "Collect till", () => this.collectTill(), 0x456f63);
  }

  createPlayer() {
    const spawn = HARBOUR_GENERAL_INTERIOR.spawn;
    this.player = new PlayerCharacter(this, spawn.x, spawn.y, { direction: spawn.facing }).setScale(1.02).setDepth(70);
    this.shadow = this.add.ellipse(spawn.x, spawn.y + 21, 36, 12, 0x24392d, 0.25).setDepth(69);
    this.movement = new MovementController(this);
  }

  createInteractions() {
    const shelves = HARBOUR_GENERAL_INTERIOR.slots.map((slot) => ({
      id: `harbour-slot-${slot.slot}`, kind: "shop-display", x: slot.x + slot.width / 2, y: slot.y + slot.height / 2,
      radius: 78, label: `Manage display ${slot.slot + 1}`, detail: "Choose stock or restock a four-item case", onActivate: () => this.selectSlot(slot.slot),
    }));
    const exit = HARBOUR_GENERAL_INTERIOR.exit;
    this.interactions = new InteractionSystem({
      interactables: [...shelves, { id: "harbour-counter", kind: "shop-counter", x: 820, y: 570, radius: 82, label: "Check the till", detail: "Collect saved in-person sales", onActivate: () => this.collectTill() }, { id: "harbour-exit", kind: "exit", x: exit.x, y: exit.y, radius: exit.radius, label: "Leave Harbour General", detail: "Return to Willowmere", onActivate: () => this.exitToTown() }],
      onChange: (current) => this.renderInteractionPrompt(current),
    });
  }

  selectSlot(slot) {
    this.selectedSlot = Math.max(0, Math.min(5, Number(slot) || 0));
    const state = this.harbourGeneral.getSnapshot();
    if (state.slots[this.selectedSlot]) this.selectedItemId = state.slots[this.selectedSlot];
    else if (!this.selectedItemId) this.selectedItemId = HARBOUR_GENERAL_ITEM_IDS[0];
    this.refreshFromState();
    return { ok: true, slot: this.selectedSlot };
  }

  selectItem(itemId) {
    if (!HARBOUR_GENERAL_CATALOG[itemId]) return { ok: false, code: "unknown-stock" };
    this.selectedItemId = itemId;
    this.refreshFromState();
    return { ok: true, itemId };
  }

  assignSelected() {
    const result = this.harbourGeneral.assignSlot(this.selectedSlot, this.selectedItemId);
    this.showMessage(result.ok ? `${HARBOUR_GENERAL_CATALOG[this.selectedItemId].name} placed on display ${this.selectedSlot + 1}.` : result.message, result.ok);
    return result;
  }

  restockSelected() {
    const itemId = this.harbourGeneral.getSnapshot().slots[this.selectedSlot] || this.selectedItemId;
    const result = this.harbourGeneral.restock(itemId);
    this.showMessage(result.ok ? `${result.quantity} ${HARBOUR_GENERAL_CATALOG[itemId].name} added immediately.` : result.message, result.ok);
    return result;
  }

  clearSelected() {
    const result = this.harbourGeneral.clearSlot(this.selectedSlot);
    this.showMessage(result.ok ? "Display cleared. Stored stock was kept." : result.message, result.ok);
    return result;
  }

  collectTill() {
    const result = this.harbourGeneral.collectTill();
    this.showMessage(result.ok ? `🪙 ${result.coins.toLocaleString()} moved to your coin balance.` : result.message, result.ok);
    return result;
  }

  showMessage(message, ok = false) {
    this.messageText.setColor(ok ? "#2f6942" : "#8b4738").setText(message || "Nothing changed.");
  }

  refreshFromState() {
    const catalogue = this.harbourGeneral.getCatalogue();
    const state = catalogue.state;
    const item = HARBOUR_GENERAL_CATALOG[this.selectedItemId] || HARBOUR_GENERAL_CATALOG[state.slots[this.selectedSlot]] || HARBOUR_GENERAL_CATALOG[HARBOUR_GENERAL_ITEM_IDS[0]];
    this.selectedItemId = item.id;
    for (const [slotIndex, view] of this.slotViews) {
      const itemId = state.slots[slotIndex];
      const product = HARBOUR_GENERAL_CATALOG[itemId];
      const stock = product ? state.stock[itemId] : 0;
      view.icon.setText(product?.icon || "＋");
      view.name.setText(product?.name || "Empty display");
      view.stock.setText(String(stock));
      view.zone.setStrokeStyle(slotIndex === this.selectedSlot ? 4 : 2, slotIndex === this.selectedSlot ? 0xffdf6b : 0xfff3c2, 0.92);
    }
    for (const [itemId, view] of this.catalogButtons) view.button.setFillStyle(itemId === item.id ? 0xffe16f : 0xfffaf0);
    const weather = catalogue.weather;
    const quantity = Math.min(HARBOUR_GENERAL_CONFIG.caseSize, HARBOUR_GENERAL_CONFIG.maxPerItem - state.stock[item.id]);
    const caseCost = quantity * item.wholesale;
    const assigned = state.slots[this.selectedSlot] === item.id;
    this.panelEyebrow.setText(`DISPLAY ${this.selectedSlot + 1} · ${item.category.toUpperCase()}`);
    this.panelIcon.setText(item.icon);
    this.panelName.setText(item.name);
    this.panelDescription.setText(item.description);
    this.panelStats.setText(`Stock ${state.stock[item.id]} / ${HARBOUR_GENERAL_CONFIG.maxPerItem} · Case ${quantity} for 🪙 ${caseCost}\nSale 🪙 ${item.price} · Margin 🪙 ${item.price - item.wholesale}\n${weather.toUpperCase()} DEMAND · ${demandLabel(harbourDemand(item, weather))}`);
    this.assignButton.text.setText(assigned ? "On display" : "Place");
    this.assignButton.setEnabled(!assigned);
    this.restockButton.setEnabled(assigned && quantity > 0 && catalogue.balance >= caseCost);
    this.clearButton.setEnabled(Boolean(state.slots[this.selectedSlot]));
    this.collectButton.text.setText(state.tillCoins ? `Collect till · 🪙 ${state.tillCoins.toLocaleString()}` : "Till empty");
    this.collectButton.setEnabled(state.tillCoins > 0);
    const hud = document.querySelector("#harbour-hud-stats");
    if (hud) hud.textContent = `🪙 ${catalogue.balance.toLocaleString()} · Till ${state.tillCoins.toLocaleString()} · ${state.lifetimeSales} sales`;
    const game = document.querySelector("#game");
    if (game) {
      game.dataset.harbourOwned = String(state.owned);
      game.dataset.harbourSlot = String(this.selectedSlot + 1);
      game.dataset.harbourItem = item.id;
      game.dataset.harbourStock = String(Object.values(state.stock).reduce((sum, count) => sum + count, 0));
      game.dataset.harbourTill = String(state.tillCoins);
      game.dataset.harbourSales = String(state.lifetimeSales);
    }
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
    this.exitButton = document.querySelector("#harbour-exit");
    this.onInteraction = () => this.interactions.activateCurrent();
    this.onExit = () => this.exitToTown();
    this.interactionButton?.addEventListener("click", this.onInteraction);
    this.exitButton?.addEventListener("click", this.onExit);
    this.escapeKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.restockKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    this.placeKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
    this.collectKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C);
    this.previousKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.OPEN_BRACKET);
    this.nextKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.CLOSED_BRACKET);
    this.numberKeys = [Phaser.Input.Keyboard.KeyCodes.ONE, Phaser.Input.Keyboard.KeyCodes.TWO, Phaser.Input.Keyboard.KeyCodes.THREE, Phaser.Input.Keyboard.KeyCodes.FOUR, Phaser.Input.Keyboard.KeyCodes.FIVE, Phaser.Input.Keyboard.KeyCodes.SIX].map((code) => this.input.keyboard.addKey(code));
  }

  isBlocked(x, y) {
    const room = HARBOUR_GENERAL_INTERIOR.room;
    if (x < room.x + PLAYER_RADIUS || x > room.x + room.width - PLAYER_RADIUS || y < room.y + PLAYER_RADIUS || y > room.y + room.height - PLAYER_RADIUS) return true;
    if (x > 890 - PLAYER_RADIUS) return true;
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

  cycleProduct(direction) {
    const current = Math.max(0, HARBOUR_GENERAL_ITEM_IDS.indexOf(this.selectedItemId));
    this.selectItem(HARBOUR_GENERAL_ITEM_IDS[(current + direction + HARBOUR_GENERAL_ITEM_IDS.length) % HARBOUR_GENERAL_ITEM_IDS.length]);
  }

  exitToTown() {
    if (this.transitioning) return { ok: false, code: "busy" };
    this.transitioning = true;
    this.movement.setEnabled(false);
    this.interactions.setEnabled(false);
    this.player.setMovement(0, 0, false);
    this.cameras.main.fadeOut(200, 28, 64, 63);
    this.time.delayedCall(220, () => this.scene.start("TownScene", { returnPosition: this.returnPosition, returnFacing: this.returnFacing, transitionCount: Number(this.entryData.transitionCount || 0) + 1 }));
    return { ok: true, targetScene: "TownScene" };
  }

  setSceneInterface(active) {
    document.body.dataset.gameScene = active ? this.scene.key : "";
    document.querySelector("#harbour-hud")?.classList.toggle("hidden", !active);
    document.querySelector("#game")?.setAttribute("data-scene", active ? this.scene.key : "");
  }

  update(_time, delta) {
    if (!this.player || this.transitioning) return;
    const { dx, dy, sprinting } = this.movement.getVector();
    const moving = this.movePlayer(dx, dy, (sprinting ? SPRINT_SPEED : WALK_SPEED) * Math.min(50, delta) / 1000);
    this.player.setMovement(dx, dy, moving);
    this.player.setDepth(70 + this.player.y / 20);
    this.shadow.setPosition(this.player.x, this.player.y + 21).setDepth(69 + this.player.y / 20);
    this.interactions.update(this.player.x, this.player.y);
    if (this.movement.consumeInteractPress()) this.interactions.activateCurrent();
    if (Phaser.Input.Keyboard.JustDown(this.escapeKey)) this.exitToTown();
    if (Phaser.Input.Keyboard.JustDown(this.restockKey)) this.restockSelected();
    if (Phaser.Input.Keyboard.JustDown(this.placeKey)) this.assignSelected();
    if (Phaser.Input.Keyboard.JustDown(this.collectKey)) this.collectTill();
    if (Phaser.Input.Keyboard.JustDown(this.previousKey)) this.cycleProduct(-1);
    if (Phaser.Input.Keyboard.JustDown(this.nextKey)) this.cycleProduct(1);
    this.numberKeys.forEach((key, index) => { if (Phaser.Input.Keyboard.JustDown(key)) this.selectSlot(index); });
  }

  getMilestoneState() {
    return { milestone: 37, scene: this.scene.key, harbourGeneral: { ...validateHarbourGeneralCatalogue(), ...this.harbourGeneral.getDiagnostics(), walkable: true, sixLiveDisplays: true, touchControls: true, keyboardControls: true, landscapeRequiredOnMobile: true } };
  }

  shutdownScene() {
    this.unsubscribeState?.();
    this.movement?.destroy();
    this.interactionButton?.removeEventListener("click", this.onInteraction);
    this.exitButton?.removeEventListener("click", this.onExit);
    this.renderInteractionPrompt(null);
    this.worldSimulation?.setPaused?.("activity", false);
    this.npcTownLife?.setPaused?.("activity", false);
    this.setSceneInterface(false);
  }
}
