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
const SHOP_WORLD_RIGHT = 936;
const SHOP_HEADER_HEIGHT = 80;

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

function labelVisual(object, label, kind = "shop-fixture") {
  object?.setData?.("assetLabel", label);
  object?.setData?.("spriteAiLabel", label);
  object?.setData?.("spriteAiKind", kind);
  return object;
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
    labelVisual(this.add.rectangle(640, 360, 1280, 720, 0x102d4b), "harbour-general.surface.full-screen", "shop-surface");
    const floor = this.add.graphics();
    floor.setDepth(2);
    floor.fillStyle(0xf5dfb7, 1);
    floor.fillRect(room.x, room.y, room.width, 160);
    floor.fillStyle(0x8fc7c8, 1);
    floor.fillRect(room.x, room.y + 160, room.width, room.height - 160);
    const tile = 46;
    for (let row = 0, y = room.y + 160; y < room.y + room.height; row += 1, y += tile) {
      for (let column = 0, x = room.x; x < room.x + room.width; column += 1, x += tile) {
        floor.fillStyle((row + column) % 2 ? 0xaed8d5 : 0x86bdc1, 1);
        floor.fillRect(x, y, Math.min(tile, room.x + room.width - x), Math.min(tile, room.y + room.height - y));
      }
    }
    floor.fillStyle(0x8c4c25, 1);
    floor.fillRect(room.x, room.y + 150, room.width, 15);
    floor.fillStyle(0x5d351f, 1);
    floor.fillRect(room.x, room.y + 160, room.width, 5);
    floor.lineStyle(7, 0x222b3e, 1);
    floor.strokeRect(room.x, room.y, room.width, room.height);
    labelVisual(floor, "harbour-general.floor.mint-checker-and-wood-wall", "shop-environment");

    this.drawHarbourWindows();
    this.drawStockroomCorner();

    this.fixtureRects = [];
    for (const fixture of HARBOUR_GENERAL_INTERIOR.fixtures) {
      this.drawFixture(fixture);
      this.fixtureRects.push({ ...fixture });
    }

    this.slotViews = new Map();
    for (const slot of HARBOUR_GENERAL_INTERIOR.slots) this.drawSlot(slot);

    const counter = HARBOUR_GENERAL_INTERIOR.counter;
    floor.fillStyle(0x8b4d27, 1);
    floor.fillRoundedRect(counter.x, counter.y, counter.width, counter.height, 7);
    floor.fillStyle(0xbe7740, 1);
    floor.fillRoundedRect(counter.x + 7, counter.y + 7, counter.width - 14, 22, 4);
    floor.fillStyle(0x173e63, 1);
    floor.fillRect(counter.x + 12, counter.y + 44, 96, 46);
    floor.lineStyle(4, 0x2e2630, 1);
    floor.strokeRoundedRect(counter.x, counter.y, counter.width, counter.height, 7);
    this.fixtureRects.push({ id: "counter", ...counter });
    labelVisual(this.add.text(counter.x + 152, counter.y - 14, "👩🏻‍💼", { fontSize: "37px" }).setOrigin(0.5, 1).setDepth(28), "harbour-general.character.amelia-shopkeeper", "shop-character");
    labelVisual(this.add.text(counter.x + 145, counter.y + 26, "▰", { color: "#20262d", fontSize: "35px" }).setOrigin(0.5).setDepth(28), "harbour-general.fixture.checkout-register", "shop-fixture");
    labelVisual(this.add.text(counter.x + 42, counter.y + 68, "⚓", { color: "#f5dfad", fontSize: "25px" }).setOrigin(0.5).setDepth(28), "harbour-general.fixture.checkout-anchor-emblem", "shop-decoration");

    labelVisual(this.add.text(245, 485, "🧑🏽", { fontSize: "35px" }).setOrigin(0.5).setDepth(27), "harbour-general.character.customer-one", "shop-character");
    labelVisual(this.add.text(370, 592, "🧑🏻", { fontSize: "37px" }).setOrigin(0.5).setDepth(27), "harbour-general.character.customer-two", "shop-character");

    const exit = HARBOUR_GENERAL_INTERIOR.exit;
    const door = labelVisual(this.add.rectangle(exit.x, room.y + room.height - 7, 160, 27, 0x2e7ca1).setStrokeStyle(4, 0x25334b).setDepth(30), "harbour-general.fixture.glass-entry-door", "shop-exit");
    labelVisual(this.add.text(door.x, door.y - 26, "HARBOUR EXIT", { color: "#f7f0d4", backgroundColor: "#173f62", fontFamily: "ui-monospace, monospace", fontSize: "10px", fontStyle: "bold", padding: { x: 9, y: 4 } }).setOrigin(0.5).setDepth(31), "harbour-general.label.harbour-exit", "shop-sign");
    this.drawManagementPanel();
  }

  drawHarbourWindows() {
    const graphics = this.add.graphics().setDepth(5);
    graphics.fillStyle(0x6b3c23, 1);
    graphics.fillRect(325, 89, 475, 92);
    graphics.fillStyle(0xbceafb, 1);
    graphics.fillRect(334, 97, 457, 73);
    for (let pane = 1; pane < 4; pane += 1) {
      graphics.fillStyle(0xe8f6e7, 0.65);
      graphics.fillRect(334 + pane * 114, 97, 5, 73);
    }
    graphics.fillStyle(0x4ca8d1, 1);
    graphics.fillRect(334, 135, 457, 35);
    graphics.fillStyle(0xeff2d7, 1);
    graphics.fillTriangle(334, 135, 430, 116, 490, 135);
    graphics.fillTriangle(580, 135, 680, 112, 790, 135);
    labelVisual(graphics, "harbour-general.fixture.harbour-view-window", "shop-window");
    labelVisual(this.add.text(560, 126, "⛵", { fontSize: "25px" }).setOrigin(0.5).setDepth(6), "harbour-general.window.sailing-boat", "shop-scenery");
    labelVisual(this.add.text(749, 125, "🏘️", { fontSize: "24px" }).setOrigin(0.5).setDepth(6), "harbour-general.window.seaside-houses", "shop-scenery");
  }

  drawStockroomCorner() {
    const graphics = this.add.graphics().setDepth(6);
    graphics.fillStyle(0x6d3d22, 1);
    graphics.fillRect(26, 100, 134, 138);
    graphics.fillStyle(0x173f62, 1);
    graphics.fillRect(47, 132, 88, 106);
    graphics.lineStyle(4, 0x2a2732, 1);
    graphics.strokeRect(47, 132, 88, 106);
    labelVisual(graphics, "harbour-general.fixture.stockroom-door", "shop-fixture");
    labelVisual(this.add.text(93, 115, "STOCKROOM", { color: "#3c2a20", backgroundColor: "#f3d58a", fontFamily: "ui-monospace, monospace", fontSize: "9px", fontStyle: "bold", padding: { x: 6, y: 3 } }).setOrigin(0.5).setDepth(7), "harbour-general.sign.stockroom", "shop-sign");
    labelVisual(this.add.text(211, 127, "🛟", { fontSize: "38px" }).setOrigin(0.5).setDepth(7), "harbour-general.decoration.life-ring", "shop-decoration");
    labelVisual(this.add.text(269, 126, "🗼", { fontSize: "34px" }).setOrigin(0.5).setDepth(7), "harbour-general.decoration.lighthouse-print", "shop-decoration");
  }

  drawFixture(fixture) {
    const graphics = this.add.graphics().setDepth(9);
    const isWall = fixture.id.includes("wall-shelf");
    graphics.fillStyle(0x8c4d25, 1);
    graphics.fillRoundedRect(fixture.x, fixture.y, fixture.width, fixture.height, 7);
    graphics.fillStyle(isWall ? 0xf0ddb0 : 0xb76d38, 1);
    graphics.fillRoundedRect(fixture.x + 7, fixture.y + 7, fixture.width - 14, fixture.height - 14, 4);
    graphics.lineStyle(4, 0x3c2a24, 1);
    graphics.strokeRoundedRect(fixture.x, fixture.y, fixture.width, fixture.height, 7);
    if (isWall) {
      const rows = fixture.id.startsWith("left") ? [["🥾", "🥾"], ["🔦", "🔦", "🔦"], ["🧴", "🧴", "🧴"]] : [["☂️", "☂️", "☂️"], ["🧥", "🧤"], ["🧢", "🧣"]];
      rows.forEach((icons, row) => {
        const rowTop = fixture.y + 18 + row * ((fixture.height - 35) / 3);
        graphics.fillStyle(0x63371f, 1);
        graphics.fillRect(fixture.x + 7, rowTop + 70, fixture.width - 14, 7);
        icons.forEach((icon, index) => labelVisual(this.add.text(fixture.x + 24 + index * 27, rowTop + 34, icon, { fontSize: "22px" }).setOrigin(0.5).setDepth(11), `harbour-general.fixture.${fixture.id}.stock-${row + 1}-${index + 1}`, "shop-stock-sprite"));
      });
    } else if (fixture.id === "towel-island") {
      ["#4b77bd", "#73a954", "#d9574a", "#efb93c", "#3e9ac2"].forEach((color, index) => {
        labelVisual(this.add.text(fixture.x + 52 + index * 79, fixture.y + 42, "▰", { color, fontSize: "54px", fontStyle: "bold" }).setOrigin(0.5).setDepth(11), `harbour-general.product-display.beach-towel-${index + 1}`, "shop-stock-sprite");
      });
    }
    labelVisual(graphics, `harbour-general.fixture.${fixture.id}`, "shop-fixture");
  }

  drawSlot(slot) {
    const zone = labelVisual(this.add.rectangle(slot.x + slot.width / 2, slot.y + slot.height / 2, slot.width, slot.height, 0xf3dfb4, 1).setStrokeStyle(3, 0x654024, 1).setDepth(20).setInteractive({ useHandCursor: true }), `harbour-general.display.slot-${slot.slot + 1}`, "interactive-shop-display");
    const copies = Array.from({ length: HARBOUR_GENERAL_CONFIG.caseSize }, (_, index) => labelVisual(this.add.text(slot.x + 29 + index * ((slot.width - 58) / 3), zone.y - 4, "＋", { fontSize: slot.fixture === "back-wall" ? "27px" : "24px" }).setOrigin(0.5).setDepth(21), `harbour-general.display.slot-${slot.slot + 1}.product-${index + 1}`, "shop-stock-sprite"));
    const stock = labelVisual(this.add.text(zone.x, slot.y + slot.height - 4, "0", { color: "#f7eecb", backgroundColor: "#173f62", fontFamily: "ui-monospace, monospace", fontSize: "11px", fontStyle: "bold", padding: { x: 8, y: 2 } }).setOrigin(0.5, 1).setDepth(22), `harbour-general.display.slot-${slot.slot + 1}.stock-count`, "shop-status-label");
    zone.on("pointerdown", () => this.selectSlot(slot.slot));
    this.slotViews.set(slot.slot, { slot, zone, copies, stock });
  }

  makeButton(x, y, width, label, onPress, colour = 0x4d965d, height = 44, assetId = null) {
    const background = labelVisual(this.add.rectangle(x, y, width, height, colour).setStrokeStyle(3, 0x20283a).setDepth(42).setInteractive({ useHandCursor: true }), assetId || `harbour-general.control.${String(label).toLowerCase().replaceAll(/[^a-z0-9]+/g, "-")}`, "shop-control");
    const text = this.add.text(x, y, label, { color: "#fffbea", fontFamily: "ui-monospace, monospace", fontSize: height >= 50 ? "18px" : "11px", fontStyle: "bold", align: "center", wordWrap: { width: width - 10 } }).setOrigin(0.5).setDepth(43);
    background.on("pointerdown", onPress);
    return { background, text, setEnabled(enabled) { background.disableInteractive(); if (enabled) background.setInteractive({ useHandCursor: true }); background.setAlpha(enabled ? 1 : 0.42); text.setAlpha(enabled ? 1 : 0.58); } };
  }

  drawManagementPanel() {
    labelVisual(this.add.rectangle(1108, 400, 336, 630, 0xfff1c8).setStrokeStyle(7, 0x172946).setDepth(35), "harbour-general.panel.selected-product", "shop-panel");
    labelVisual(this.add.rectangle(1108, 192, 282, 184, 0xfff8df).setStrokeStyle(3, 0xb99a63).setDepth(36), "harbour-general.panel.product-art-frame", "shop-product-frame");
    this.panelEyebrow = this.add.text(1108, 102, "SELECTED PRODUCT", { color: "#24304a", fontFamily: "ui-monospace, monospace", fontSize: "14px", fontStyle: "bold" }).setOrigin(0.5).setDepth(37);
    this.panelIcon = labelVisual(this.add.text(1108, 192, "☂️", { fontSize: "78px" }).setOrigin(0.5).setDepth(37), "harbour-general.selected-product.umbrella", "shop-product-sprite");
    this.previousProductButton = this.makeButton(987, 192, 44, "‹", () => this.cycleProduct(-1), 0x245f91, 52, "harbour-general.control.previous-product");
    this.nextProductButton = this.makeButton(1229, 192, 44, "›", () => this.cycleProduct(1), 0x245f91, 52, "harbour-general.control.next-product");
    this.panelName = this.add.text(1108, 301, "Umbrella", { color: "#20304b", fontFamily: "ui-monospace, monospace", fontSize: "24px", fontStyle: "bold", align: "center", wordWrap: { width: 285 } }).setOrigin(0.5).setDepth(36);
    this.panelDescription = this.add.text(1108, 331, "", { color: "#665543", fontSize: "12px", align: "center", lineSpacing: 2, wordWrap: { width: 286 } }).setOrigin(0.5, 0).setDepth(36);
    this.panelStats = this.add.text(974, 382, "", { color: "#26324a", fontFamily: "ui-monospace, monospace", fontSize: "14px", fontStyle: "bold", lineSpacing: 11 }).setDepth(36);
    this.panelValues = this.add.text(1242, 382, "", { color: "#26324a", fontFamily: "ui-monospace, monospace", fontSize: "16px", fontStyle: "bold", align: "right", lineSpacing: 9 }).setOrigin(1, 0).setDepth(36);
    this.panelDemand = this.add.text(1108, 522, "", { color: "#26324a", fontFamily: "ui-monospace, monospace", fontSize: "11px", fontStyle: "bold", align: "center" }).setOrigin(0.5).setDepth(36);
    this.restockButton = this.makeButton(1108, 563, 282, "RESTOCK", () => this.restockSelected(), 0x1979b8, 56, "harbour-general.control.restock");
    this.assignButton = this.makeButton(1108, 629, 282, "PLACE ON SHELF", () => this.assignSelected(), 0x53a842, 56, "harbour-general.control.place-on-shelf");
    this.clearButton = this.makeButton(1108, 678, 126, "Clear display", () => this.clearSelected(), 0x766f68, 34, "harbour-general.control.clear-display");
    this.messageText = this.add.text(1108, 704, "Choose a display, then browse products with the arrows.", { color: "#6c614f", fontSize: "8px", align: "center", wordWrap: { width: 292 } }).setOrigin(0.5, 1).setDepth(36);
    this.collectButton = this.makeButton(782, 633, 176, "Till empty", () => this.collectTill(), 0x245f74, 40, "harbour-general.control.collect-till");
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
    const counter = HARBOUR_GENERAL_INTERIOR.counter;
    this.interactions = new InteractionSystem({
      interactables: [...shelves, { id: "harbour-counter", kind: "shop-counter", x: counter.x + counter.width / 2, y: counter.y + counter.height / 2, radius: 86, label: "Check the till", detail: "Collect saved in-person sales", onActivate: () => this.collectTill() }, { id: "harbour-exit", kind: "exit", x: exit.x, y: exit.y, radius: exit.radius, label: "Leave Harbour General", detail: "Return to Willowmere", onActivate: () => this.exitToTown() }],
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
      view.copies.forEach((copy, index) => {
        copy.setText(product?.icon || "＋");
        copy.setVisible(Boolean(product) ? index < Math.min(HARBOUR_GENERAL_CONFIG.caseSize, stock) : index === 0);
        copy.setData("spriteAiLabel", product ? `harbour-general.display.slot-${slotIndex + 1}.${product.id}.${index + 1}` : `harbour-general.display.slot-${slotIndex + 1}.empty`);
      });
      view.stock.setText(String(stock));
      view.zone.setStrokeStyle(slotIndex === this.selectedSlot ? 4 : 2, slotIndex === this.selectedSlot ? 0xffdf6b : 0xfff3c2, 0.92);
    }
    const weather = catalogue.weather;
    const quantity = Math.min(HARBOUR_GENERAL_CONFIG.caseSize, HARBOUR_GENERAL_CONFIG.maxPerItem - state.stock[item.id]);
    const caseCost = quantity * item.wholesale;
    const assigned = state.slots[this.selectedSlot] === item.id;
    const displayedSlot = state.slots.indexOf(item.id);
    const onShelf = displayedSlot >= 0 ? Math.min(HARBOUR_GENERAL_CONFIG.caseSize, state.stock[item.id]) : 0;
    this.panelEyebrow.setText(`SELECTED PRODUCT · ${item.category.toUpperCase()}`);
    this.panelIcon.setText(item.icon);
    this.panelIcon.setData("assetLabel", `harbour-general.product.${item.id}`);
    this.panelIcon.setData("spriteAiLabel", `harbour-general.product.${item.id}`);
    this.panelName.setText(item.name);
    this.panelDescription.setText(item.description);
    this.panelStats.setText(`📦  IN STOCK\n🪵  ON SHELF\n🪙  RESTOCK ×${quantity || 0}\n🏷️  SELL PRICE`);
    this.panelValues.setText(`${state.stock[item.id]}\n${onShelf}\n${caseCost}\n${item.price}`);
    this.panelDemand.setText(`${weather.toUpperCase()} DEMAND · ${demandLabel(harbourDemand(item, weather))}`);
    this.assignButton.text.setText(assigned ? "ON THIS SHELF" : "PLACE ON SHELF");
    this.assignButton.setEnabled(!assigned);
    this.restockButton.setEnabled(assigned && quantity > 0 && catalogue.balance >= caseCost);
    this.clearButton.setEnabled(Boolean(state.slots[this.selectedSlot]));
    this.collectButton.text.setText(state.tillCoins ? `Collect till · 🪙 ${state.tillCoins.toLocaleString()}` : "Till empty");
    this.collectButton.setEnabled(state.tillCoins > 0);
    const hud = document.querySelector("#harbour-hud-stats");
    if (hud) hud.textContent = `🪙 ${catalogue.balance.toLocaleString()} · Till ${state.tillCoins.toLocaleString()} · ${state.lifetimeSales} sales`;
    const balance = document.querySelector("#harbour-balance");
    if (balance) balance.textContent = catalogue.balance.toLocaleString();
    const till = document.querySelector("#harbour-till");
    if (till) till.textContent = state.tillCoins.toLocaleString();
    const today = Number(this.gameState?.getSnapshot?.().world?.day) || 1;
    const todaySales = state.recentSales.filter((sale) => sale.day === today).reduce((sum, sale) => sum + sale.price, 0);
    const sales = document.querySelector("#harbour-today-sales");
    if (sales) sales.textContent = todaySales.toLocaleString();
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
    if (x > SHOP_WORLD_RIGHT - PLAYER_RADIUS || y < SHOP_HEADER_HEIGHT + 158 + PLAYER_RADIUS) return true;
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
