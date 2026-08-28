import Phaser from "phaser";
import { ANIMAL_BY_ID, ANIMAL_REFERENCE_TEXTURE_KEY, animalReferenceFrame } from "../data/animals.js";
import { ITEM_CATALOG } from "../data/items.js";
import { PERSONAL_HOME_HOUSE_ID } from "../data/customResident.js";
import { HOME_INTERIOR_VIEW, validateFurniturePlacement } from "../data/homeInteriors.js";
import { AQUARIUM_SPECIES_BY_ID } from "../data/aquarium.js";
import { startLazyScene } from "./lazyScenes.js";

// Presentation transform only: enlarge the interactive room while preserving
// the authored interior coordinates and the exact inverse pointer mapping.
const VIEW = Object.freeze({ x: -175, y: 0, scale: 1.3 });
const OBJECT_ICONS = Object.freeze({
  bed: "🛏️", table: "🍽️", kitchen: "🍳", wardrobe: "👕", rug: "🧶", sofa: "🛋️", armchair: "🪑",
  "coffee-table": "🟫", bookshelf: "📚", hearth: "🔥", plant: "🪴", picture: "🖼️", radio: "📻",
  "record-player": "🎶", fishing: "🎣", coffee: "☕", broom: "🧹", petbed: "🐾", petbowls: "🥣",
  "floor-lamp": "💡", "woven-rug": "🧶", "companion-basket": "🐾", "fish-tank": "🐠",
});

function text(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.textContent = String(value);
}

export class HouseInteriorScene extends Phaser.Scene {
  constructor() { super("HouseInteriorScene"); }

  init(data = {}) {
    this.entryData = data;
    this.houseId = data.houseId || PERSONAL_HOME_HOUSE_ID;
    this.selectedId = null;
    this.keyboardIndex = -1;
    this.transitioning = false;
    this.lastValidation = null;
    this.visuals = [];
    this.hitAreas = [];
  }

  create() {
    this.homeInteriors = this.registry.get("homeInteriors");
    this.aquarium = this.registry.get("aquarium");
    this.gameState = this.registry.get("gameState");
    this.houseRescue = this.registry.get("houseRescue");
    this.worldSimulation = this.registry.get("worldSimulation");
    this.npcTownLife = this.registry.get("npcTownLife");
    this.npcNarrativeController = this.registry.get("npcNarrativeController");
    this.worldSimulation?.setPaused("activity", true);
    this.npcTownLife?.setPaused("activity", true);
    const entered = this.homeInteriors.enter(this.houseId);
    if (!entered.ok) {
      this.scene.start("TownScene", { returnPosition: this.entryData.returnPosition, returnFacing: this.entryData.returnFacing || "down" });
      return;
    }
    this.bindInterface();
    this.setSceneInterface();
    this.unsubscribe = this.homeInteriors.subscribe(() => this.render());
    this.input.on("pointerdown", this.onPointerDown, this);
    this.input.keyboard.on("keydown", this.onKeyDown, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.shutdownScene());
    this.render();
    if (this.entryData.focusFurnitureId) {
      const result = this.homeInteriors.beginPlacement(this.entryData.focusFurnitureId);
      this.setStatus(result.ok ? `Tap a clear place for ${ITEM_CATALOG[this.entryData.focusFurnitureId].name}.` : result.message, result.ok ? "success" : "error");
      this.render();
    }
    this.cameras.main.fadeIn(220, 51, 39, 31);
  }

  bindInterface() {
    this.hud = document.querySelector("#home-interior-hud");
    this.exitButton = document.querySelector("#home-interior-exit");
    this.cleanButton = document.querySelector("#home-interior-clean");
    this.furnishButton = document.querySelector("#home-interior-furnish");
    this.moveButton = document.querySelector("#home-interior-move");
    this.storeButton = document.querySelector("#home-interior-store");
    this.rotateButton = document.querySelector("#home-interior-rotate");
    this.confirmButton = document.querySelector("#home-interior-confirm");
    this.cancelButton = document.querySelector("#home-interior-cancel");
    this.tray = document.querySelector("#home-furniture-tray");
    this.onExit = () => this.returnToTown();
    this.onClean = () => this.startHouseRescue();
    this.onFurnish = () => this.toggleTray();
    this.onMove = () => this.moveSelected();
    this.onStore = () => this.storeSelected();
    this.onRotate = () => { const result = this.homeInteriors.rotate(); this.setStatus(result.reason || "Furniture rotated by 90°.", result.ok ? "success" : "error"); this.render(); };
    this.onConfirm = () => { const result = this.homeInteriors.confirmPlacement(); this.setStatus(result.ok ? `${ITEM_CATALOG[result.placement.itemId].name} saved in your home.` : result.message || result.reason, result.ok ? "success" : "error"); this.render(); };
    this.onCancel = () => { this.homeInteriors.cancelPlacement(); this.setStatus("Furniture change cancelled. Your room is unchanged."); this.render(); };
    this.onTrayClick = (event) => {
      const button = event.target.closest("[data-home-furniture-item]");
      if (!button) return;
      const result = this.homeInteriors.beginPlacement(button.dataset.homeFurnitureItem);
      this.setStatus(result.ok ? `Tap a clear place for ${result.item.name}.` : result.message, result.ok ? "success" : "error");
      this.render();
    };
    this.exitButton?.addEventListener("click", this.onExit);
    this.cleanButton?.addEventListener("click", this.onClean);
    this.furnishButton?.addEventListener("click", this.onFurnish);
    this.moveButton?.addEventListener("click", this.onMove);
    this.storeButton?.addEventListener("click", this.onStore);
    this.rotateButton?.addEventListener("click", this.onRotate);
    this.confirmButton?.addEventListener("click", this.onConfirm);
    this.cancelButton?.addEventListener("click", this.onCancel);
    this.tray?.addEventListener("click", this.onTrayClick);
    this.hud?.classList.remove("hidden");
  }

  setSceneInterface() {
    document.body.dataset.gameScene = this.scene.key;
    const badge = document.querySelector(".milestone-badge");
    if (badge) badge.textContent = "HOME AQUARIUM · MILESTONE 33";
    text("#location-status", "Inside a Willowmere home");
    text("#control-hint", "Tap to inspect · arrows browse/move · R rotates · Enter confirms");
  }

  interior() { return this.homeInteriors.getInterior(this.houseId); }

  mapRect(item) {
    return { x: VIEW.x + item.x * VIEW.scale, y: VIEW.y + item.y * VIEW.scale, w: item.w * VIEW.scale, h: item.h * VIEW.scale };
  }

  unmapPoint(pointer) {
    return { x: (pointer.x - VIEW.x) / VIEW.scale, y: (pointer.y - VIEW.y) / VIEW.scale };
  }

  clearVisuals() {
    for (const visual of this.visuals) {
      this.tweens?.killTweensOf?.(visual);
      visual?.destroy?.();
    }
    this.visuals = [];
    this.hitAreas = [];
  }

  drawRoom(interior) {
    this.clearVisuals();
    const { layout } = interior;
    this.visuals.push(this.add.rectangle(640, 360, 1280, 720, 0x233e31).setDepth(-20));
    const graphics = this.add.graphics().setDepth(1);
    this.visuals.push(graphics);
    const room = this.mapRect(layout);
    graphics.fillStyle(0x6c5038, 1); graphics.fillRoundedRect(room.x - 12, room.y - 12, room.w + 24, room.h + 24, 15);
    graphics.fillStyle(layout.theme.wall, 1); graphics.fillRoundedRect(room.x - 6, room.y - 6, room.w + 12, room.h + 12, 11);
    graphics.fillStyle(layout.theme.floor, 1); graphics.fillRect(room.x, room.y, room.w, room.h);
    graphics.lineStyle(2, 0x9a7d5a, 0.28);
    for (let x = room.x + 18; x < room.x + room.w; x += 38) graphics.lineBetween(x, room.y, x, room.y + room.h);
    const floorItems = layout.furniture.filter((item) => item.floorLayer);
    const solidItems = layout.furniture.filter((item) => !item.floorLayer);
    for (const item of floorItems) this.drawFurniture(item, graphics, layout);
    graphics.lineStyle(8, 0x6d513b, 1);
    for (const partition of layout.partitions) graphics.lineBetween(VIEW.x + partition.x1 * VIEW.scale, VIEW.y + partition.y1 * VIEW.scale, VIEW.x + partition.x2 * VIEW.scale, VIEW.y + partition.y2 * VIEW.scale);
    const door = this.mapRect(layout.door);
    graphics.fillStyle(0xb98654, 1); graphics.fillRect(door.x, door.y - 3, door.w, door.h + 7);
    for (const item of solidItems) this.drawFurniture(item, graphics, layout);
    if (interior.dirty) {
      graphics.fillStyle(0x594733, 0.28);
      for (const [rx, ry, radius] of [[0.32, 0.41, 22], [0.58, 0.24, 15], [0.75, 0.78, 25], [0.20, 0.66, 18]]) graphics.fillCircle(room.x + room.w * rx, room.y + room.h * ry, radius);
    }
    this.drawOccupants(interior, graphics, layout);
    const active = this.homeInteriors.getSnapshot().activePlacement;
    if (active && Number.isFinite(active.rx) && Number.isFinite(active.ry)) {
      const state = this.gameState.getSnapshot();
      const validation = validateFurniturePlacement(state, active.itemId, active.rx, active.ry, { rotation: active.rotation, ignorePlacementId: active.existingPlacementId });
      this.lastValidation = validation;
      if (validation.candidate) this.drawPreview(validation.candidate, validation.ok, graphics);
    } else this.lastValidation = null;
  }

  drawFurniture(item, graphics) {
    const rect = this.mapRect(item);
    const selected = this.selectedId === item.id;
    if (item.kind === "fish-tank" && item.customFurniture) {
      this.drawFishTank(item, rect, selected, graphics);
      return;
    }
    const palette = item.floorLayer ? 0xa76665 : item.customFurniture ? 0x5b826c : ({ bed: 0x8f6c78, table: 0x8a6545, kitchen: 0x59766e, wardrobe: 0x775644, sofa: 0x668b78, bookshelf: 0x6d4d39, hearth: 0x925a3f }[item.kind] || 0x78906b);
    graphics.fillStyle(palette, item.floorLayer ? 0.68 : 1); graphics.fillRoundedRect(rect.x, rect.y, rect.w, rect.h, Math.min(10, rect.h / 4));
    graphics.lineStyle(selected ? 5 : 2, selected ? 0xffed75 : 0x3e3b2f, selected ? 1 : 0.55); graphics.strokeRoundedRect(rect.x, rect.y, rect.w, rect.h, Math.min(10, rect.h / 4));
    const icon = this.add.text(rect.x + rect.w / 2, rect.y + rect.h / 2, item.icon || OBJECT_ICONS[item.kind] || "🏠", { fontSize: `${Math.max(15, Math.min(31, rect.h * 0.54))}px`, fontFamily: "Apple Color Emoji, system-ui" }).setOrigin(0.5).setDepth(4);
    this.visuals.push(icon);
    this.hitAreas.push({ id: item.id, kind: item.kind, customFurniture: Boolean(item.customFurniture), x: rect.x, y: rect.y, w: rect.w, h: rect.h });
  }

  drawFishTank(item, rect, selected, graphics) {
    const inset = Math.max(4, Math.min(8, rect.h * 0.12));
    graphics.fillStyle(0x283b42, 1); graphics.fillRoundedRect(rect.x, rect.y, rect.w, rect.h, 7);
    graphics.fillStyle(0x56b9c8, 0.92); graphics.fillRoundedRect(rect.x + inset, rect.y + inset, rect.w - inset * 2, rect.h - inset * 1.65, 4);
    graphics.fillStyle(0xd7b873, 0.9); graphics.fillRect(rect.x + inset, rect.y + rect.h - inset * 1.45, rect.w - inset * 2, inset * 0.7);
    graphics.lineStyle(Math.max(1.2, rect.h * 0.035), 0x397f5b, 0.9);
    for (const fraction of [0.16, 0.82]) {
      const plantX = rect.x + inset + (rect.w - inset * 2) * fraction;
      const sandY = rect.y + rect.h - inset * 1.15;
      graphics.lineBetween(plantX, sandY, plantX - inset * 0.35, sandY - inset * 1.8);
      graphics.lineBetween(plantX, sandY, plantX + inset * 0.45, sandY - inset * 2.25);
    }
    graphics.lineStyle(selected ? 5 : 2, selected ? 0xffed75 : 0xb8e7e9, selected ? 1 : 0.8); graphics.strokeRoundedRect(rect.x, rect.y, rect.w, rect.h, 7);
    const displayFish = this.aquarium?.getSnapshot?.().displayFish || [];
    const columns = Math.max(1, Math.min(4, Math.ceil(displayFish.length / 2)));
    displayFish.forEach((id, index) => {
      const species = AQUARIUM_SPECIES_BY_ID[id];
      if (!species) return;
      const column = index % columns;
      const row = Math.floor(index / columns);
      const x = rect.x + inset + (column + 0.5) * ((rect.w - inset * 2) / columns);
      const y = rect.y + inset + (row + 0.62) * ((rect.h - inset * 2.25) / Math.max(1, Math.ceil(displayFish.length / columns)));
      const fish = this.add.graphics().setPosition(x, y).setDepth(5);
      const scale = Math.max(0.55, Math.min(1, rect.h / 58));
      fish.fillStyle(species.palette.fin, 1); fish.fillTriangle(-9 * scale, 0, -17 * scale, -6 * scale, -17 * scale, 6 * scale);
      if (species.art === "angelfish") {
        fish.fillTriangle(-3 * scale, -2 * scale, 2 * scale, -12 * scale, 7 * scale, -2 * scale);
        fish.fillTriangle(-3 * scale, 2 * scale, 2 * scale, 12 * scale, 7 * scale, 2 * scale);
      }
      fish.fillStyle(species.palette.body, 1); fish.fillEllipse(0, 0, 22 * scale, (species.art === "angelfish" ? 17 : 13) * scale);
      fish.fillStyle(species.palette.light, 0.95); fish.fillEllipse(2 * scale, 2 * scale, 11 * scale, 5 * scale);
      if (species.art === "koi") {
        fish.fillStyle(0xd9553f, 1); fish.fillCircle(-2 * scale, -2 * scale, 2.6 * scale); fish.fillCircle(5 * scale, 2 * scale, 2 * scale);
      } else if (species.art === "angelfish") {
        fish.fillStyle(0x5b5a61, 0.9); fish.fillRect(-4 * scale, -7 * scale, 2 * scale, 14 * scale); fish.fillRect(2 * scale, -7 * scale, 2 * scale, 14 * scale);
      } else if (species.art === "oranda") {
        fish.fillStyle(0xd94d3f, 1); fish.fillCircle(7 * scale, -5 * scale, 3.5 * scale); fish.fillCircle(4 * scale, -6 * scale, 3 * scale);
      }
      fish.fillStyle(0x15252b, 1); fish.fillCircle(7 * scale, -2 * scale, 1.25 * scale);
      this.visuals.push(fish);
      this.tweens.add({ targets: fish, x: x + (index % 2 ? -6 : 6), y: y + (index % 3 - 1) * 2, duration: 1450 + index * 140, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    });
    for (let index = 0; index < Math.min(5, Math.max(2, displayFish.length)); index += 1) {
      const bubble = this.add.circle(rect.x + inset * 1.5 + ((index + 1) / 6) * (rect.w - inset * 3), rect.y + rect.h * (0.38 + (index % 2) * 0.22), 1.5 + (index % 2), 0xd9fbff, 0.78).setDepth(4);
      this.visuals.push(bubble);
      this.tweens.add({ targets: bubble, y: rect.y + inset, alpha: 0.12, duration: 1200 + index * 180, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    }
    if (!displayFish.length) {
      const empty = this.add.text(rect.x + rect.w / 2, rect.y + rect.h / 2, "Ready for Reedbank fish", { color: "#e8ffff", fontFamily: "system-ui", fontSize: `${Math.max(7, Math.min(10, rect.h * 0.18))}px`, fontStyle: "bold" }).setOrigin(0.5).setDepth(5);
      this.visuals.push(empty);
    }
    this.hitAreas.push({ id: item.id, kind: item.kind, customFurniture: true, x: rect.x, y: rect.y, w: rect.w, h: rect.h });
  }

  drawPreview(candidate, valid, graphics) {
    const rect = this.mapRect(candidate);
    graphics.fillStyle(valid ? 0x87d388 : 0xe36b63, 0.55); graphics.fillRoundedRect(rect.x, rect.y, rect.w, rect.h, 8);
    graphics.lineStyle(5, valid ? 0xc8ffc9 : 0xffc0ba, 1); graphics.strokeRoundedRect(rect.x, rect.y, rect.w, rect.h, 8);
    const label = this.add.text(rect.x + rect.w / 2, rect.y + rect.h / 2, candidate.icon || "🛋️", { fontSize: "28px" }).setOrigin(0.5).setDepth(7);
    this.visuals.push(label);
  }

  drawOccupants(interior, graphics, layout) {
    const all = [...interior.occupants, ...interior.animalOccupants];
    all.forEach((occupant, index) => {
      const x = layout.x + layout.w * (0.43 + (index % 4) * 0.09);
      const y = layout.y + layout.h * (0.50 + Math.floor(index / 4) * 0.12);
      const mapped = { x: VIEW.x + x * VIEW.scale, y: VIEW.y + y * VIEW.scale };
      graphics.fillStyle(0x294637, 0.2); graphics.fillEllipse(mapped.x, mapped.y + 14, 36, 12);
      let icon = null;
      if (occupant.kind === "animal") icon = this.drawAnimalOccupant(graphics, occupant, mapped.x, mapped.y);
      else icon = this.add.text(mapped.x, mapped.y, "🧑", { fontSize: "30px" }).setOrigin(0.5).setDepth(8);
      const label = this.add.text(mapped.x, mapped.y - 27, occupant.name, { color: "#294637", backgroundColor: "rgba(255,253,235,.9)", fontSize: "10px", fontStyle: "bold", padding: { x: 4, y: 2 } }).setOrigin(0.5).setDepth(9);
      this.visuals.push(...(icon ? [icon] : []), label);
      this.hitAreas.push({ id: occupant.id, kind: occupant.kind, x: mapped.x - 24, y: mapped.y - 34, w: 48, h: 58 });
    });
  }

  drawAnimalOccupant(graphics, occupant, x, y) {
    const frame = animalReferenceFrame(ANIMAL_BY_ID[occupant.id]);
    if (frame !== null && this.textures.exists(ANIMAL_REFERENCE_TEXTURE_KEY)) {
      return this.add.image(x, y + 18, ANIMAL_REFERENCE_TEXTURE_KEY, frame).setOrigin(0.5, 1).setScale(0.78).setDepth(8);
    }
    const body = Number(occupant.color) || 0x9b7d64;
    const accent = Number(occupant.accent) || 0xe8d4b5;
    const longEars = ["rabbit"].includes(occupant.species);
    const pointedEars = ["cat", "dog", "fox", "fennec_fox", "wolf"].includes(occupant.species);
    const bird = ["duck", "crow", "songbird", "chicken", "goose", "owl", "pigeon", "macaw"].includes(occupant.species);
    graphics.fillStyle(body, 1); graphics.fillEllipse(x - 3, y + 1, 31, 20); graphics.fillCircle(x + 10, y - 9, 10);
    if (longEars) { graphics.fillEllipse(x + 5, y - 22, 5, 18); graphics.fillEllipse(x + 14, y - 22, 5, 18); }
    else if (pointedEars) { graphics.fillTriangle(x + 2, y - 14, x + 5, y - 26, x + 10, y - 15); graphics.fillTriangle(x + 10, y - 16, x + 17, y - 25, x + 19, y - 11); }
    if (bird) { graphics.fillStyle(accent, 1); graphics.fillEllipse(x - 6, y, 16, 11); graphics.fillTriangle(x + 18, y - 10, x + 28, y - 6, x + 18, y - 3); }
    else { graphics.fillStyle(accent, 0.92); graphics.fillEllipse(x + 14, y - 5, 10, 7); }
    graphics.fillStyle(0x22312a, 1); graphics.fillCircle(x + 13, y - 12, 1.5);
    graphics.lineStyle(3, body, 1); graphics.lineBetween(x - 10, y + 8, x - 12, y + 17); graphics.lineBetween(x + 4, y + 8, x + 6, y + 17);
    return null;
  }

  renderInterface(interior) {
    const activeRescue = this.houseRescue?.getActiveSession?.();
    const rescueWaitingElsewhere = Boolean(activeRescue && activeRescue.houseId !== this.houseId);
    const waitingHome = rescueWaitingElsewhere ? this.homeInteriors.getInterior(activeRescue.houseId) : null;
    const waitingName = waitingHome?.ok ? waitingHome.name : activeRescue?.houseId?.replace("house-", "Cottage ");
    const bedCount = Math.max(1, Math.min(3, interior.residents.length || 1));
    text("#home-interior-title", interior.name);
    text("#home-interior-subtitle", `${interior.area} · ${interior.layout.theme.name}`);
    const people = interior.residents.map((resident) => resident.name).join(" & ") || (interior.layout.personal ? "Your resident" : "No resident yet");
    const badges = document.querySelector("#home-interior-badges");
    if (badges) badges.innerHTML = [
      `📍 ${interior.area}`,
      interior.dirty ? "🧹 House Rescue job" : "✨ Clean home",
      `🛏️ ${bedCount} bed${bedCount === 1 ? "" : "s"}`,
      `👥 ${people}`,
      interior.occupants.length + interior.animalOccupants.length ? `💚 ${interior.occupants.length + interior.animalOccupants.length} home now` : "🚪 Nobody home",
      interior.layout.personal ? `🛋️ ${interior.furniture.placements.length} / ${interior.furniture.limit} placed` : null,
      interior.aquarium?.placed ? `🐠 ${interior.aquarium.totalFish} fish · ${interior.aquarium.species.length} species` : null,
    ].filter(Boolean).map((label) => `<span>${label}</span>`).join("");
    if (!this.selectedId) {
      const names = [...interior.occupants, ...interior.animalOccupants].map((entry) => entry.name);
      text("#home-interior-readout-title", rescueWaitingElsewhere ? "A rescue is already in progress" : interior.dirty ? "This home needs a helping hand" : names.length ? `${names.join(" & ")} ${names.length === 1 ? "is" : "are"} home` : "Nobody is home right now");
      text("#home-interior-readout-detail", rescueWaitingElsewhere ? `Resume at ${waitingName} first.` : interior.dirty ? "Sort the rubbish, then clean 95% of the floor." : names.length ? "The household is spending time safely indoors." : "You can still look around and inspect the furniture.");
    }
    const personal = interior.layout.personal;
    const active = interior.furniture?.activePlacement;
    const selectedCustom = personal && interior.layout.furniture.find((item) => item.id === this.selectedId)?.customFurniture;
    this.furnishButton?.classList.toggle("hidden", !personal || !this.gameState.getSnapshot().customResident?.profile || Boolean(active));
    this.moveButton?.classList.toggle("hidden", !selectedCustom || Boolean(active));
    this.storeButton?.classList.toggle("hidden", !selectedCustom || Boolean(active));
    this.cleanButton?.classList.toggle("hidden", !interior.dirty || Boolean(active));
    if (this.cleanButton) {
      this.cleanButton.disabled = rescueWaitingElsewhere;
      this.cleanButton.textContent = rescueWaitingElsewhere ? "Rescue saved elsewhere" : activeRescue?.houseId === this.houseId ? "Resume House Rescue" : "Start House Rescue";
    }
    document.querySelector("#home-furniture-placement")?.classList.toggle("hidden", !active);
    if (this.confirmButton) this.confirmButton.disabled = !this.lastValidation?.ok;
    text("#home-furniture-placement-hint", !active ? "" : !this.lastValidation ? `Tap a clear place for ${ITEM_CATALOG[active.itemId].name}.` : this.lastValidation.ok ? `${ITEM_CATALOG[active.itemId].name} fits here — confirm or rotate it.` : `Can't place here: ${this.lastValidation.reason}`);
    this.renderTray(interior);
  }

  renderTray(interior) {
    if (!this.tray) return;
    const inventory = interior.furniture?.inventory || {};
    const rows = Object.entries(inventory).filter(([id, quantity]) => quantity > 0 && ITEM_CATALOG[id]?.indoorSize);
    this.tray.innerHTML = rows.length ? rows.map(([id, quantity]) => {
      const item = ITEM_CATALOG[id];
      return `<button type="button" data-home-furniture-item="${id}"><span>${item.icon}</span><strong>${item.name}</strong><small>${quantity} owned · tap to place</small></button>`;
    }).join("") : `<p><strong>No furniture waiting</strong><small>Buy furniture from the shop, then return here.</small></p>`;
  }

  render() {
    const interior = this.interior();
    if (!interior.ok) return;
    this.drawRoom(interior);
    this.renderInterface(this.interior());
    const game = document.querySelector("#game");
    if (game) {
      game.dataset.homeInteriorHouse = this.houseId;
      game.dataset.homeInteriorClean = String(interior.clean);
      game.dataset.homeFurnitureCount = String(interior.furniture?.placements.length || 0);
      game.dataset.homeFurnitureActive = String(Boolean(interior.furniture?.activePlacement));
    }
  }

  setStatus(message, status = "neutral") {
    const element = document.querySelector("#home-interior-status");
    if (element) { element.textContent = message || "Tap something in the room to inspect it."; element.dataset.status = status; }
  }

  inspect(id) {
    const result = this.homeInteriors.inspect(this.houseId, id);
    if (!result.ok) { this.setStatus(result.message, "error"); return result; }
    this.selectedId = id;
    text("#home-interior-readout-title", result.target.label);
    text("#home-interior-readout-detail", result.target.detail);
    this.setStatus(`${result.target.label} inspected and saved.`, "success");
    this.render();
    if (result.target.kind === "resident") this.npcNarrativeController?.open?.(result.target.id, { selectThought: true });
    return result;
  }

  onPointerDown(pointer) {
    if (this.transitioning) return;
    const active = this.homeInteriors.getSnapshot().activePlacement;
    if (active) {
      const point = this.unmapPoint(pointer);
      const layout = this.interior().layout;
      const result = this.homeInteriors.preview((point.x - layout.x) / layout.w, (point.y - layout.y) / layout.h);
      this.setStatus(result.ok ? `${ITEM_CATALOG[active.itemId].name} fits here.` : result.reason, result.ok ? "success" : "error");
      this.render();
      return;
    }
    const hit = [...this.hitAreas].reverse().find((area) => pointer.x >= area.x && pointer.x <= area.x + area.w && pointer.y >= area.y && pointer.y <= area.y + area.h);
    if (hit) this.inspect(hit.id);
  }

  onKeyDown(event) {
    if (this.transitioning) return;
    const active = this.homeInteriors.getSnapshot().activePlacement;
    if (active) {
      if (event.key === "Escape") { event.preventDefault(); this.onCancel(); return; }
      if (event.key.toLowerCase() === "r") { event.preventDefault(); this.onRotate(); return; }
      if (event.key === "Enter" || event.key === " ") { event.preventDefault(); this.onConfirm(); return; }
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
        event.preventDefault();
        const rx = Number.isFinite(active.rx) ? active.rx : 0.5;
        const ry = Number.isFinite(active.ry) ? active.ry : 0.5;
        const step = event.shiftKey ? 0.04 : 0.018;
        const result = this.homeInteriors.preview(rx + (event.key === "ArrowLeft" ? -step : event.key === "ArrowRight" ? step : 0), ry + (event.key === "ArrowUp" ? -step : event.key === "ArrowDown" ? step : 0));
        this.setStatus(result.ok ? "Furniture position is clear." : result.reason, result.ok ? "success" : "error");
        this.render();
      }
      return;
    }
    if (event.key === "Escape") { event.preventDefault(); this.returnToTown(); return; }
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "Enter", " "].includes(event.key)) return;
    event.preventDefault();
    if (event.key === "Enter" || event.key === " ") {
      if (this.keyboardIndex >= 0) this.inspect(this.hitAreas[this.keyboardIndex]?.id);
      return;
    }
    const delta = ["ArrowLeft", "ArrowUp"].includes(event.key) ? -1 : 1;
    if (event.key === "Home") this.keyboardIndex = 0;
    else if (event.key === "End") this.keyboardIndex = Math.max(0, this.hitAreas.length - 1);
    else this.keyboardIndex = (this.keyboardIndex + delta + this.hitAreas.length) % Math.max(1, this.hitAreas.length);
    const target = this.hitAreas[this.keyboardIndex];
    if (target) this.inspect(target.id);
  }

  toggleTray() {
    this.tray?.classList.toggle("open");
    this.setStatus(this.tray?.classList.contains("open") ? "Choose owned furniture to place." : "Furniture tray closed.");
  }

  moveSelected() {
    const interior = this.interior();
    const placed = interior.furniture?.placements.find((entry) => entry.id === this.selectedId);
    const result = placed ? this.homeInteriors.beginPlacement(placed.itemId, { existingPlacementId: placed.id }) : { ok: false, message: "Choose placed furniture first." };
    this.setStatus(result.ok ? `Tap a new position for ${placed.item.name}.` : result.message, result.ok ? "success" : "error");
    this.render();
  }

  storeSelected() {
    const result = this.homeInteriors.store(this.selectedId);
    if (result.ok) this.selectedId = null;
    this.setStatus(result.ok ? `${ITEM_CATALOG[result.itemId].name} returned to inventory.` : result.message, result.ok ? "success" : "error");
    this.render();
  }

  startHouseRescue() {
    const interior = this.interior();
    if (!interior.dirty || this.transitioning) return false;
    const activeRescue = this.houseRescue?.getActiveSession?.();
    if (activeRescue && activeRescue.houseId !== this.houseId) {
      const waitingHome = this.homeInteriors.getInterior(activeRescue.houseId);
      const waitingName = waitingHome?.ok ? waitingHome.name : activeRescue.houseId.replace("house-", "Cottage ");
      this.setStatus(`Resume at ${waitingName} first.`, "error");
      return false;
    }
    this.transitioning = true;
    this.homeInteriors.cancelPlacement();
    this.cameras.main.fadeOut(180, 53, 42, 35);
    this.time.delayedCall(200, () => startLazyScene(this, "HouseRescueScene", {
      houseId: this.houseId,
      returnPosition: this.entryData.returnPosition,
      returnFacing: this.entryData.returnFacing || "down",
      returnScene: "HouseInteriorScene",
      returnHouseId: this.houseId,
      transitionCount: Number(this.entryData.transitionCount || 0) + 1,
    }).catch((error) => {
      console.error("Unable to load House Rescue.", error);
      this.transitioning = false;
      this.cameras.main.fadeIn(160, 53, 42, 35);
    }));
    return true;
  }

  returnToTown() {
    if (this.transitioning) return false;
    this.transitioning = true;
    this.homeInteriors.cancelPlacement();
    this.cameras.main.fadeOut(180, 46, 39, 31);
    this.time.delayedCall(200, () => this.scene.start("TownScene", { returnPosition: this.entryData.returnPosition, returnFacing: this.entryData.returnFacing || "down", transitionCount: Number(this.entryData.transitionCount || 0) + 1 }));
    return true;
  }

  getMilestoneState() {
    const interior = this.interior();
    return { scene: this.scene.key, milestone: 33, houseId: this.houseId, clean: interior.clean, occupants: interior.occupants.length, animalOccupants: interior.animalOccupants.length, furniture: interior.furniture?.placements.length || 0, aquarium: interior.aquarium, activePlacement: Boolean(interior.furniture?.activePlacement) };
  }

  shutdownScene() {
    this.worldSimulation?.setPaused("activity", false);
    this.npcTownLife?.setPaused("activity", false);
    this.unsubscribe?.();
    this.input.off("pointerdown", this.onPointerDown, this);
    this.input.keyboard.off("keydown", this.onKeyDown, this);
    this.hud?.classList.add("hidden");
    this.tray?.classList.remove("open");
    this.exitButton?.removeEventListener("click", this.onExit);
    this.cleanButton?.removeEventListener("click", this.onClean);
    this.furnishButton?.removeEventListener("click", this.onFurnish);
    this.moveButton?.removeEventListener("click", this.onMove);
    this.storeButton?.removeEventListener("click", this.onStore);
    this.rotateButton?.removeEventListener("click", this.onRotate);
    this.confirmButton?.removeEventListener("click", this.onConfirm);
    this.cancelButton?.removeEventListener("click", this.onCancel);
    this.tray?.removeEventListener("click", this.onTrayClick);
  }
}
