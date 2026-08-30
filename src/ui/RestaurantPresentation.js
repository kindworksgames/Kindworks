import { spriteAiInventory } from "../assets/spriteAiLabels.js";
import {
  registerSouthShoreScoopsAssetManifest,
  southShoreScoopsAsset,
} from "../assets/southShoreScoopsAssetManifest.js";

const INK = 0x292238;
const PAPER = 0xfff1c9;
const WHITE = 0xfffaf0;

function assetLabel(object, id) {
  const descriptor = southShoreScoopsAsset(id);
  object.name = id;
  object.setData?.("assetLabel", id);
  object.spriteAiAssetId = id;
  object.spriteAiAssetLabel = descriptor?.label || id;
  object.spriteAiAssetKind = descriptor?.kind || object.spriteAiAssetKind || "visual";
  return object;
}

const PALETTES = Object.freeze({
  bakery: Object.freeze({ wall: 0xb68b62, dining: 0x876348, counter: 0x9c6f50, kitchen: 0xc7a36c, wood: 0x9b6044, trim: 0xd9c394, accent: 0xd76d4d, uniform: 0xf2c761 }),
  cafe: Object.freeze({ wall: 0x9db7a0, dining: 0x9b6547, counter: 0x76503e, kitchen: 0x76a0a2, wood: 0x8f563f, trim: 0xe4cc9b, accent: 0x5f9b63, uniform: 0x76a0a2 }),
  mug: Object.freeze({ wall: 0x86b7b3, dining: 0x9b6547, counter: 0x76503e, kitchen: 0x76a0a2, wood: 0x76503e, trim: 0xe8d1a2, accent: 0x3f7d7c, uniform: 0x65a7a0 }),
  riverside: Object.freeze({ wall: 0xc99b69, dining: 0x9b6547, counter: 0x76503e, kitchen: 0x76a0a2, wood: 0x684338, trim: 0xf0d7ad, accent: 0xb66a46, uniform: 0xc97858 }),
});

const VENUE_COPY = Object.freeze({
  bakery: Object.freeze({ dining: "CUSTOMERS", counter: "ORDER COUNTER", prep: "PREP BENCH", kitchen: "BAKERY KITCHEN", stations: ["MIX", "SHAPE", "OVEN", "FINISH"] }),
  cafe: Object.freeze({ dining: "DINING ROOM", counter: "ORDER COUNTER", prep: "PREP COUNTER", kitchen: "CAFÉ KITCHEN", stations: ["KETTLE", "TOASTER", "HOB", "OVEN"] }),
  mug: Object.freeze({ dining: "COFFEE LOUNGE", counter: "ORDER COUNTER", prep: "DRINK COUNTER", kitchen: "BARISTA KITCHEN", stations: ["GRINDER", "ESPRESSO", "STEAM", "COLD"] }),
  riverside: Object.freeze({ dining: "DINING ROOM", counter: "ORDER PASS", prep: "PLATING PASS", kitchen: "RESTAURANT KITCHEN", stations: ["PREP", "PAN", "POT", "GRILL", "OVEN"] }),
});

function label(scene, x, y, value, size = 13, color = "#fff1c9") {
  return scene.add.text(x, y, value, {
    color,
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
    fontSize: `${size}px`,
    fontStyle: "bold",
    resolution: 2,
  }).setDepth(4);
}

function pixelPerson(graphics, x, y, index, uniform, active = true, scale = 1) {
  const skin = [0xf1bd92, 0xb97856, 0xe4a879, 0x8c5b46, 0xf0c7a4, 0xc88962][index % 6];
  const hair = [0x3a2b2a, 0x6c432d, 0x2c272b, 0xd4a65f, 0x8a4b38, 0x292238][index % 6];
  const shirt = active ? [0xd86d58, 0x5f8fb8, 0x78a65a, 0xd39a4b, 0x8c70ad, 0x4f9b92][index % 6] : 0x777777;
  graphics.fillStyle(INK, 0.22); graphics.fillRect(x - 17 * scale, y + 23 * scale, 38 * scale, 10 * scale);
  graphics.fillStyle(shirt, active ? 1 : 0.35); graphics.fillRoundedRect(x - 16 * scale, y + 6 * scale, 32 * scale, 28 * scale, 4 * scale);
  graphics.lineStyle(6 * scale, INK, active ? 1 : 0.35); graphics.lineBetween(x - 14 * scale, y + 13 * scale, x - 27 * scale, y + 27 * scale); graphics.lineBetween(x + 14 * scale, y + 13 * scale, x + 27 * scale, y + 27 * scale);
  graphics.fillStyle(skin, active ? 1 : 0.35); graphics.fillCircle(x - 29 * scale, y + 29 * scale, 5 * scale); graphics.fillCircle(x + 29 * scale, y + 29 * scale, 5 * scale);
  graphics.fillStyle(INK, active ? 1 : 0.35); graphics.fillRect(x - 14 * scale, y + 32 * scale, 11 * scale, 17 * scale); graphics.fillRect(x + 3 * scale, y + 32 * scale, 11 * scale, 17 * scale);
  graphics.fillStyle(0x34303b, active ? 1 : 0.35); graphics.fillRect(x - 17 * scale, y + 47 * scale, 14 * scale, 6 * scale); graphics.fillRect(x + 3 * scale, y + 47 * scale, 14 * scale, 6 * scale);
  graphics.fillStyle(skin, active ? 1 : 0.35); graphics.fillRect(x - 12 * scale, y - 18 * scale, 24 * scale, 25 * scale);
  graphics.fillStyle(hair, active ? 1 : 0.35); graphics.fillRect(x - 14 * scale, y - 22 * scale, 28 * scale, 9 * scale); graphics.fillRect(x - 14 * scale, y - 15 * scale, 5 * scale, 14 * scale);
  graphics.fillStyle(INK, active ? 1 : 0.35); graphics.fillRect(x - 7 * scale, y - 7 * scale, 3 * scale, 3 * scale); graphics.fillRect(x + 5 * scale, y - 7 * scale, 3 * scale, 3 * scale);
  if (uniform) {
    graphics.fillStyle(uniform, 1); graphics.fillRoundedRect(x - 18 * scale, y + 5 * scale, 36 * scale, 34 * scale, 4 * scale);
    graphics.fillStyle(WHITE, 1); graphics.fillRect(x - 11 * scale, y - 24 * scale, 22 * scale, 6 * scale); graphics.fillRect(x - 15 * scale, y - 18 * scale, 30 * scale, 5 * scale);
  }
}

function roomTag(scene, x, y, width, text) {
  const g = scene.add.graphics().setDepth(3);
  g.fillStyle(INK, 1); g.fillRoundedRect(x, y, width, 30, 4);
  g.fillStyle(PAPER, 1); g.fillRoundedRect(x + 3, y + 3, width - 6, 24, 3);
  label(scene, x + width / 2, y + 8, text, 10, "#453b36").setOrigin(0.5, 0).setDepth(4);
}

function semanticSlot(scene, id, x, y, width, height) {
  return assetLabel(scene.add.zone(x, y, width, height), id).setDepth(2);
}

function checkerFloor(graphics, x, y, width, height, base, light, size = 32) {
  graphics.fillStyle(base, 1); graphics.fillRect(x, y, width, height);
  graphics.fillStyle(light, 0.18);
  for (let yy = y; yy < y + height; yy += size) {
    for (let xx = x; xx < x + width; xx += size) {
      if (((xx - x) / size + (yy - y) / size) % 2 === 0) graphics.fillRect(xx, yy, size, size);
    }
  }
}

function tableSet(graphics, x, y, wood, index) {
  graphics.fillStyle(INK, 0.28); graphics.fillRoundedRect(x - 47, y - 25, 102, 62, 8);
  graphics.fillStyle(INK, 1); graphics.fillRoundedRect(x - 50, y - 34, 100, 68, 9);
  graphics.fillStyle(wood, 1); graphics.fillRoundedRect(x - 45, y - 29, 90, 58, 6);
  graphics.fillStyle(0xb77850, 1); graphics.fillRoundedRect(x - 38, y - 22, 76, 44, 4);
  graphics.fillStyle(PAPER, 1); graphics.fillCircle(x, y, 11);
  graphics.fillStyle(INK, 1); graphics.fillCircle(x, y, 11); graphics.fillStyle(PAPER, 1); graphics.fillCircle(x, y, 7);
  const chair = index % 2 ? 0xd18a54 : 0x6f8fa7;
  graphics.fillStyle(INK, 1); graphics.fillRoundedRect(x - 19, y - 50, 38, 18, 5); graphics.fillRoundedRect(x - 19, y + 32, 38, 18, 5);
  graphics.fillStyle(chair, 1); graphics.fillRoundedRect(x - 15, y - 46, 30, 10, 3); graphics.fillRoundedRect(x - 15, y + 36, 30, 10, 3);
}

function appliance(graphics, x, y, width, height, accent, index) {
  graphics.fillStyle(INK, 0.3); graphics.fillRoundedRect(x + 5, y + 7, width, height, 7);
  graphics.fillStyle(INK, 1); graphics.fillRoundedRect(x, y, width, height, 7);
  graphics.fillStyle(index % 2 ? 0xa9b8b7 : 0xc8d0cb, 1); graphics.fillRoundedRect(x + 4, y + 4, width - 8, height - 8, 4);
  graphics.fillStyle(0x344247, 1); graphics.fillRoundedRect(x + 10, y + 17, width - 20, height - 29, 4);
  graphics.fillStyle(accent, 1); graphics.fillRect(x + 11, y + 8, width - 22, 6);
  graphics.fillStyle(index % 3 ? 0xf1bf67 : 0x83c56a, 1); graphics.fillCircle(x + width - 12, y + 11, 3);
}

function ticket(graphics, x, y, active, width = 108, height = 63) {
  graphics.fillStyle(INK, 1); graphics.fillRoundedRect(x, y, width, height, 5);
  graphics.fillStyle(active ? 0xffe28a : WHITE, 1); graphics.fillRoundedRect(x + 4, y + 4, width - 8, height - 8, 3);
  graphics.fillStyle(0xc8b68e, 1); graphics.fillRect(x + 10, y + 14, width * 0.55, 4); graphics.fillRect(x + 10, y + 25, width - 20, 4); graphics.fillRect(x + 10, y + 36, width * 0.66, 4);
  graphics.fillStyle(active ? 0xd66d4d : 0x9ed36a, 1); graphics.fillRect(x + 10, y + height - 14, width * 0.34, 7);
}

function tray(graphics, x, y, active, width = 108, height = 90) {
  graphics.fillStyle(active ? 0xffd85f : INK, 1); graphics.fillRoundedRect(x, y, width, height, 8);
  graphics.fillStyle(0xd7c49b, 1); graphics.fillRoundedRect(x + 5, y + 5, width - 10, height - 10, 5);
  for (let stripe = x + 7; stripe < x + width - 7; stripe += 20) { graphics.fillStyle(0xcbb488, 0.7); graphics.fillRect(stripe, y + 7, 9, height - 14); }
  graphics.fillStyle(WHITE, 1); graphics.fillCircle(x + width / 2, y + height / 2, 25); graphics.lineStyle(3, INK, 1); graphics.strokeCircle(x + width / 2, y + height / 2, 25);
}

export function createRestaurantPresentation(scene, venue) {
  const palette = PALETTES[venue] || PALETTES.cafe;
  const copy = VENUE_COPY[venue] || VENUE_COPY.cafe;
  scene.add.rectangle(640, 360, 1280, 720, palette.wall).setDepth(0);
  const room = assetLabel(scene.add.graphics(), `KW-${venue.toUpperCase()}-ROOM-PROCEDURAL-V1`).setDepth(1);
  room.fillStyle(INK, 1); room.fillRoundedRect(10, 72, 1260, 636, 10);
  checkerFloor(room, 18, 80, 500, 620, palette.dining, 0xffffff, 28);
  checkerFloor(room, 528, 80, 284, 620, palette.counter, 0xffffff, 34);
  checkerFloor(room, 822, 80, 440, 620, palette.kitchen, 0xffffff, 32);
  room.fillStyle(INK, 1); room.fillRect(518, 80, 10, 620); room.fillRect(812, 80, 10, 620);
  room.fillStyle(INK, 1); room.fillRect(0, 0, 1280, 68);
  room.fillStyle(0x78a6b8, 1); room.fillRect(205, 675, 90, 25); room.fillStyle(0xc9e6e7, 1); room.fillRect(218, 681, 64, 5);
  for (const y of [150, 390]) { room.fillStyle(INK, 1); room.fillRect(18, y, 19, 105); room.fillStyle(0x8bc6d5, 1); room.fillRect(23, y + 5, 9, 95); }
  [[205, 215], [430, 215], [205, 405], [430, 405], [205, 585], [430, 585]].forEach(([x, y], index) => tableSet(room, x, y, palette.wood, index));
  room.fillStyle(INK, 1); room.fillRoundedRect(540, 124, 260, 115, 9); room.fillStyle(palette.wood, 1); room.fillRoundedRect(546, 130, 248, 103, 5);
  room.fillStyle(INK, 1); room.fillRoundedRect(540, 270, 260, 372, 9); room.fillStyle(palette.trim, 1); room.fillRoundedRect(546, 276, 248, 360, 5);
  [548, 631, 714].forEach((x, index) => ticket(room, x, 158, index === 0, 78, 65));
  [288, 400, 512].forEach((y, index) => tray(room, 558, y, index === 0, 224, 101));
  room.fillStyle(INK, 1); room.fillRoundedRect(834, 118, 412, 139, 10); room.fillStyle(0x6d7777, 1); room.fillRoundedRect(840, 124, 400, 127, 6);
  const stationWidth = copy.stations.length === 5 ? 69 : 88;
  copy.stations.forEach((name, index) => {
    const x = 846 + index * (stationWidth + 9);
    appliance(room, x, 154, stationWidth, 88, palette.accent, index);
    label(scene, x + stationWidth / 2, 246, name, 7, "#fff1c9").setOrigin(0.5).setDepth(4);
  });
  room.fillStyle(INK, 1); room.fillRoundedRect(834, 285, 108, 92, 7); room.fillStyle(0xc8d0cb, 1); room.fillRoundedRect(840, 291, 96, 80, 4); room.fillStyle(0x76503e, 1); room.fillRect(869, 309, 39, 43); room.fillStyle(PAPER, 1); room.fillEllipse(888, 356, 78, 17);
  room.fillStyle(INK, 1); room.fillRoundedRect(1122, 275, 116, 170, 7); room.fillStyle(0xc8d0cb, 1); room.fillRoundedRect(1128, 281, 104, 158, 4); room.fillStyle(0x8fc4d5, 1); room.fillRect(1143, 301, 74, 34); room.fillStyle(WHITE, 1); room.fillRoundedRect(1154, 350, 52, 70, 4);
  room.fillStyle(INK, 1); room.fillRoundedRect(834, 486, 170, 128, 7); room.fillStyle(0x6a7072, 1); room.fillRoundedRect(840, 492, 158, 116, 4); room.fillStyle(0x292238, 1); room.fillCircle(884, 530, 31); room.fillCircle(952, 530, 31); room.fillStyle(0xe9c75f, 1); room.fillRect(852, 575, 134, 18);
  room.fillStyle(INK, 1); room.fillRoundedRect(1016, 486, 105, 128, 7); room.fillStyle(palette.wood, 1); room.fillRoundedRect(1022, 492, 93, 116, 4); room.fillStyle(PAPER, 1); room.fillRect(1036, 511, 65, 50);
  room.fillStyle(INK, 1); room.fillRoundedRect(1132, 486, 106, 128, 7); room.fillStyle(palette.wood, 1); room.fillRoundedRect(1138, 492, 94, 116, 4); room.fillStyle(0x435844, 1); room.fillRect(1151, 511, 68, 50);
  roomTag(scene, 166, 88, 202, copy.dining);
  roomTag(scene, 570, 88, 200, copy.counter);
  roomTag(scene, 570, 246, 200, copy.prep);
  roomTag(scene, 952, 88, 176, copy.kitchen);
  const venueId = venue.toUpperCase();
  semanticSlot(scene, `KW-${venueId}-DINING-ZONE`, 268, 390, 500, 620);
  semanticSlot(scene, `KW-${venueId}-ORDER-COUNTER-ZONE`, 670, 180, 260, 115);
  semanticSlot(scene, `KW-${venueId}-PREP-COUNTER-ZONE`, 670, 456, 260, 372);
  semanticSlot(scene, `KW-${venueId}-KITCHEN-ZONE`, 1042, 390, 440, 620);
  [[205, 215], [430, 215], [205, 405], [430, 405], [205, 585], [430, 585]].forEach(([x, y], index) => semanticSlot(scene, `KW-${venueId}-DINING-TABLE-${index + 1}`, x, y, 100, 100));
  [587, 670, 753].forEach((x, index) => semanticSlot(scene, `KW-${venueId}-ORDER-TICKET-${index + 1}`, x, 190, 78, 65));
  [338, 450, 562].forEach((y, index) => semanticSlot(scene, `KW-${venueId}-PREP-TRAY-${index + 1}`, 670, y, 224, 101));
  copy.stations.forEach((station, index) => semanticSlot(scene, `KW-${venueId}-KITCHEN-STATION-${station}`, 846 + index * (stationWidth + 9) + stationWidth / 2, 198, stationWidth, 88));
  semanticSlot(scene, `KW-${venueId}-KITCHEN-SINK`, 888, 331, 108, 92);
  semanticSlot(scene, `KW-${venueId}-KITCHEN-FRIDGE`, 1180, 360, 116, 170);
  semanticSlot(scene, `KW-${venueId}-KITCHEN-HOB`, 919, 550, 170, 128);
  semanticSlot(scene, `KW-${venueId}-KITCHEN-CUTTING-BOARD`, 1069, 550, 105, 128);
  semanticSlot(scene, `KW-${venueId}-KITCHEN-INGREDIENTS`, 1185, 550, 106, 128);
  label(scene, 140, 23, `${venue === "bakery" ? "LITTLE BAKERY" : venue === "mug" ? "MORNING MUG COFFEE" : venue === "riverside" ? "RIVERSIDE KITCHEN" : "CORNER CAFÉ"} · WILLOWMERE`, 17).setDepth(5);
  const dynamic = assetLabel(scene.add.container(0, 0), `KW-${venue.toUpperCase()}-DYNAMIC-PRESENTATION`).setDepth(8);
  const worker = assetLabel(scene.add.graphics(), `KW-${venue.toUpperCase()}-WORKER-PIXEL`); pixelPerson(worker, 1080, 437, 0, palette.uniform, true, 1.35); dynamic.add(worker);
  const workerTag = assetLabel(label(scene, 1080, 488, "READY", 8, "#292238"), `KW-${venue.toUpperCase()}-WORKER-STATE`).setOrigin(0.5).setDepth(9); workerTag.setBackgroundColor("#fff1c9").setPadding(5, 3); dynamic.add(workerTag);
  const presentation = { venue, palette, copy, dynamic, worker, workerTag, stateObjects: [] };
  scene.restaurantPresentation = presentation;
  return presentation;
}

function clearStateObjects(presentation) {
  presentation.stateObjects.forEach((object) => object.destroy());
  presentation.stateObjects.length = 0;
}

export function updateRestaurantPresentation(scene, snapshot = {}) {
  const presentation = scene.restaurantPresentation;
  if (!presentation) return;
  clearStateObjects(presentation);
  const orders = snapshot.orders || [];
  const seats = [[95, 210], [320, 210], [95, 400], [320, 400], [95, 580], [320, 580]];
  const people = assetLabel(scene.add.graphics(), `KW-${presentation.venue.toUpperCase()}-CUSTOMER-GROUP`).setDepth(8);
  seats.forEach(([x, y], index) => { if (orders[index]) pixelPerson(people, x, y, index + 1, null, true, 1.3); });
  presentation.stateObjects.push(people);
  orders.slice(0, 6).forEach((order, index) => {
    const [x, y] = seats[index];
    const bubble = assetLabel(scene.add.graphics(), `KW-${presentation.venue.toUpperCase()}-CUSTOMER-${index + 1}-ORDER-BUBBLE`).setDepth(9);
    bubble.fillStyle(INK, 1); bubble.fillRoundedRect(x + 15, y - 91, 112, 62, 8); bubble.fillTriangle(x + 29, y - 30, x + 43, y - 30, x + 34, y - 15);
    bubble.fillStyle(WHITE, 1); bubble.fillRoundedRect(x + 19, y - 87, 104, 54, 5);
    const icon = assetLabel(scene.add.text(x + 71, y - 60, order.icons || "…", { fontSize: "20px", resolution: 2 }), `KW-${presentation.venue.toUpperCase()}-CUSTOMER-${index + 1}-ORDER-ART`).setOrigin(0.5).setDepth(10);
    const patience = Math.max(0, Math.min(1, Number(order.patience ?? 1)));
    bubble.fillStyle(0xe2d5b8, 1); bubble.fillRect(x + 29, y - 40, 84, 6); bubble.fillStyle(patience < 0.3 ? 0xd55a4d : patience < 0.6 ? 0xe0a43e : 0x66aa55, 1); bubble.fillRect(x + 29, y - 40, Math.round(84 * patience), 6);
    presentation.stateObjects.push(bubble, icon);
    if (index < 3) {
      const ticketIcon = assetLabel(scene.add.text(587 + index * 83, 183, order.icons || "…", { fontSize: "18px", resolution: 2 }), `KW-${presentation.venue.toUpperCase()}-ORDER-TICKET-${index + 1}-ART`).setOrigin(0.5).setDepth(10);
      presentation.stateObjects.push(ticketIcon);
    }
  });
  (snapshot.trays || []).slice(0, 3).forEach((trayState, index) => {
    if (!trayState.icon) return;
    const icon = assetLabel(scene.add.text(670, 338 + index * 112, trayState.icon, { fontSize: "34px", resolution: 2 }), `KW-${presentation.venue.toUpperCase()}-TRAY-${index + 1}-FOOD`).setOrigin(0.5).setDepth(10);
    if (trayState.active) icon.setScale(1.13);
    presentation.stateObjects.push(icon);
  });
  const workerWorking = ["working", "cooking"].includes(snapshot.workerState);
  presentation.workerTag.setText(snapshot.workerState === "ready" ? "READY · TAP" : workerWorking ? "WORKING…" : snapshot.workerState === "burnt" ? "BURNT" : "READY");
  presentation.workerTag.setBackgroundColor(snapshot.workerState === "burnt" ? "#d55a4d" : snapshot.workerState === "ready" ? "#b9dc93" : workerWorking ? "#f1bf67" : "#fff1c9");
  const workerAtStation = workerWorking || ["ready", "burnt"].includes(snapshot.workerState);
  scene.tweens.killTweensOf([presentation.worker, presentation.workerTag]);
  scene.tweens.add({ targets: [presentation.worker, presentation.workerTag], x: workerAtStation ? -145 : 0, y: workerAtStation ? -175 : 0, duration: 260, ease: "Stepped", easeParams: [4] });
  if (snapshot.expectedIcon) {
    const expected = assetLabel(scene.add.text(workerAtStation ? 893 : 1038, workerAtStation ? 263 : 438, snapshot.expectedIcon, { fontSize: "22px", backgroundColor: "#fff1c9", color: "#292238", padding: { x: 5, y: 3 }, resolution: 2 }), `KW-${presentation.venue.toUpperCase()}-WORKER-PAYLOAD`).setOrigin(0.5).setDepth(10);
    presentation.stateObjects.push(expected);
  }
  (snapshot.appliances || []).slice(0, 5).forEach((appliance, index) => {
    const stateColour = appliance.status === "burnt" ? 0xd55a4d : appliance.status === "ready" ? 0x83c56a : 0xf1bf67;
    const chip = assetLabel(scene.add.graphics(), `KW-${presentation.venue.toUpperCase()}-APPLIANCE-${String(appliance.id).toUpperCase()}-${String(appliance.status).toUpperCase()}`).setDepth(11);
    const x = 842 + index * 80;
    chip.fillStyle(INK, 1); chip.fillRoundedRect(x, 262, 74, 44, 5);
    chip.fillStyle(stateColour, 1); chip.fillRoundedRect(x + 3, 265, 68, 38, 3);
    const text = assetLabel(scene.add.text(x + 37, 284, `${appliance.icon || "♨"} ${appliance.status === "cooking" ? "COOK" : String(appliance.status).toUpperCase()}\nT${Number(appliance.trayIndex) + 1}`, {
      color: "#292238", fontFamily: "ui-monospace, monospace", fontSize: "8px", fontStyle: "bold", align: "center", resolution: 2,
    }), `KW-${presentation.venue.toUpperCase()}-APPLIANCE-${String(appliance.id).toUpperCase()}-LABEL`).setOrigin(0.5).setDepth(12);
    presentation.stateObjects.push(chip, text);
  });
}

function drawScoopsCustomer(graphics, x, y, index, active) {
  pixelPerson(graphics, x, y, index, null, active, 1.42);
  graphics.fillStyle(INK, 1); graphics.fillRoundedRect(x - 42, y + 45, 84, 15, 4);
  graphics.fillStyle(active ? 0xf2d787 : 0x8aa0a0, 1); graphics.fillRoundedRect(x - 37, y + 49, 74, 7, 2);
}

function createLegacyScoopsPresentation(scene) {
  scene.add.rectangle(640, 360, 1280, 720, 0x79c8d0).setDepth(0);
  const art = assetLabel(scene.add.graphics(), "KW-SCOOPS-COUNTER-PROCEDURAL-V1").setDepth(1);
  art.fillStyle(0x79c8d0, 1); art.fillRect(0, 0, 1280, 212);
  art.fillStyle(0x69aebe, 1); art.fillRect(0, 190, 1280, 72);
  art.fillStyle(0xf7f1d0, 1); art.fillRect(0, 250, 1280, 18);
  art.fillStyle(0xf2d787, 1); art.fillRect(0, 268, 1280, 452);
  for (let x = 16; x < 1280; x += 46) { art.fillStyle(x % 92 ? 0xe9ce8c : 0xf8e7ad, 1); art.fillRect(x, 290 + (x % 4) * 7, 8, 5); }
  art.fillStyle(INK, 1); art.fillRoundedRect(355, 78, 900, 574, 15);
  art.fillStyle(0xfff1c9, 1); art.fillRoundedRect(363, 86, 884, 558, 9);
  art.fillStyle(0xd75f63, 1); art.fillRect(363, 86, 884, 50);
  art.fillStyle(0xfff7d7, 1); art.fillRoundedRect(385, 153, 840, 140, 8);
  ["1 · CONTAINERS", "2 · FLAVOURS", "3 · FINISHES", "4 · EXTRAS"].forEach((text, index) => {
    const x = 400 + index * 204;
    art.fillStyle(INK, 1); art.fillRoundedRect(x, 165, 190, 114, 7);
    art.fillStyle([0xf4d28b, 0xe99baa, 0x8bd0a5, 0x8fc4d5][index], 1); art.fillRoundedRect(x + 4, 169, 182, 106, 4);
    label(scene, x + 12, 180, text, 9, "#292238").setDepth(4);
    for (let part = 0; part < 4; part += 1) { art.fillStyle(WHITE, 1); art.fillCircle(x + 29 + part * 42, 235, 15); art.lineStyle(3, INK, 1); art.strokeCircle(x + 29 + part * 42, 235, 15); }
    if (index === 0) {
      art.fillStyle(0xc98b55, 1); art.fillTriangle(x + 22, 230, x + 36, 230, x + 29, 249);
      art.fillStyle(0xd75f63, 1); art.fillRoundedRect(x + 58, 229, 14, 17, 3);
      art.fillStyle(0xf1bf67, 1); art.fillTriangle(x + 104, 228, x + 120, 228, x + 112, 246);
      art.fillStyle(0x8fc4d5, 1); art.fillRoundedRect(x + 142, 228, 17, 18, 3);
    } else if (index === 1) {
      [0xee9aa8, 0x8c5a43, 0xf6edc9, 0x8bd0a5].forEach((color, part) => { art.fillStyle(color, 1); art.fillCircle(x + 29 + part * 42, 235, 11); });
    } else if (index === 2) {
      [0xd75f63, 0x8c5a43, 0xd69a55, 0xffffff].forEach((color, part) => { const px = x + 29 + part * 42; art.fillStyle(color, 1); art.fillCircle(px, 235, 9); art.fillStyle(INK, 1); art.fillCircle(px - 4, 233, 2); art.fillCircle(px + 4, 237, 2); });
    } else {
      art.fillStyle(0xee9aa8, 1); art.fillRoundedRect(x + 21, 226, 16, 20, 4); art.fillStyle(0xf3d979, 1); art.fillRoundedRect(x + 63, 226, 16, 20, 4);
      art.fillStyle(0x8fc4d5, 1); art.fillRoundedRect(x + 104, 223, 14, 24, 3); art.fillStyle(0xd75f63, 1); art.fillRoundedRect(x + 146, 225, 10, 22, 5);
    }
  });
  art.fillStyle(INK, 1); art.fillRoundedRect(390, 315, 535, 278, 10); art.fillStyle(0x8e6549, 1); art.fillRoundedRect(396, 321, 523, 266, 6);
  art.fillStyle(PAPER, 1); art.fillRoundedRect(418, 354, 326, 200, 7); art.lineStyle(5, 0xd75f63, 1); art.strokeRoundedRect(418, 354, 326, 200, 7);
  art.fillStyle(0xd7c49b, 1); art.fillRoundedRect(766, 354, 131, 200, 7); art.lineStyle(5, INK, 1); art.strokeRoundedRect(766, 354, 131, 200, 7);
  art.fillStyle(INK, 1); art.fillRoundedRect(949, 315, 276, 278, 10); art.fillStyle(0xfff7d7, 1); art.fillRoundedRect(955, 321, 264, 266, 6);
  roomTag(scene, 18, 82, 315, "CUSTOMERS · PICTURE ORDERS");
  label(scene, 382, 101, "SOUTH SHORE SCOOPS · PICTURE COUNTER", 17).setDepth(5);
  label(scene, 438, 331, "BUILD BOARD", 10, "#292238").setDepth(5);
  label(scene, 785, 331, "TRAY", 10, "#292238").setDepth(5);
  label(scene, 974, 334, "SELECTED ORDER", 10, "#292238").setDepth(5);
  const presentation = { dynamic: assetLabel(scene.add.container(0, 0), "KW-SCOOPS-DYNAMIC-PRESENTATION").setDepth(8), stateObjects: [] };
  scene.scoopsPresentation = presentation;
  return presentation;
}

export function createScoopsPresentation(scene) {
  registerSouthShoreScoopsAssetManifest(spriteAiInventory);
  scene.add.rectangle(640, 360, 1280, 720, 0xedd6a6).setDepth(0);
  const art = assetLabel(scene.add.graphics(), "KW-SCOOPS-SEASIDE-COUNTER-PROCEDURAL-V2").setDepth(1);
  art.fillStyle(0xf7dfac, 1); art.fillRect(0, 0, 1280, 720);
  art.fillStyle(0x173b6b, 1); art.fillRect(0, 0, 1280, 69);
  for (let x = 0; x < 1280; x += 100) { art.fillStyle((x / 100) % 2 ? 0xffefd0 : 0x245fa8, 1); art.fillRect(x, 0, 100, 69); }
  art.fillStyle(INK, 1); art.fillRoundedRect(190, 11, 900, 74, 14);
  art.fillStyle(0xa96838, 1); art.fillRoundedRect(197, 18, 886, 60, 9);
  for (let y = 29; y < 73; y += 13) { art.fillStyle(0x7d4c2d, 0.55); art.fillRect(214, y, 850, 3); }
  art.fillStyle(0xf1b34f, 1); art.fillCircle(232, 47, 17); art.fillCircle(1048, 47, 17);
  art.fillStyle(0x173b6b, 1); art.fillRect(229, 30, 6, 34); art.fillRect(1045, 30, 6, 34); art.fillCircle(232, 47, 10); art.fillCircle(1048, 47, 10);
  art.fillStyle(0xef876f, 1); art.fillCircle(1008, 58, 8); art.fillCircle(1008, 58, 3);

  art.fillStyle(0x173b6b, 1); art.fillRoundedRect(216, 92, 848, 225, 8);
  art.fillStyle(0x8bd5e8, 1); art.fillRect(222, 98, 836, 104);
  art.fillStyle(0x4fa9d1, 1); art.fillRect(222, 202, 836, 109);
  art.fillStyle(0xf5d483, 1); art.fillTriangle(222, 238, 460, 195, 460, 311); art.fillTriangle(1058, 238, 820, 195, 820, 311);
  for (let x = 250; x < 1040; x += 76) { art.fillStyle(0xd9f2f5, 0.72); art.fillRect(x, 219 + (x % 3) * 9, 45, 4); }
  art.fillStyle(0x684338, 1); art.fillRect(204, 300, 872, 22); art.fillStyle(0x2f6091, 1); art.fillRect(204, 306, 872, 12);

  art.fillStyle(INK, 1); art.fillRoundedRect(42, 118, 128, 164, 7); art.fillStyle(0x24384b, 1); art.fillRoundedRect(48, 124, 116, 152, 4);
  art.lineStyle(3, 0xf5d483, 0.8); art.strokeCircle(106, 170, 29); art.lineBetween(76, 225, 136, 225); art.lineBetween(82, 240, 130, 240);
  art.fillStyle(0xf1b34f, 1); art.fillTriangle(91, 181, 121, 181, 106, 224); art.fillStyle(0xee9aa8, 1); art.fillCircle(106, 174, 18);
  art.fillStyle(INK, 1); art.fillRoundedRect(1110, 123, 82, 105, 5); art.fillStyle(0xa96838, 1); art.fillRoundedRect(1116, 129, 70, 93, 3);
  art.fillStyle(0x173b6b, 1); art.fillCircle(1151, 170, 23); art.lineStyle(5, 0xf1b34f, 1); art.strokeCircle(1151, 170, 16); art.lineBetween(1151, 148, 1151, 193);
  [[106, 290], [1150, 290]].forEach(([x, y], index) => { art.fillStyle(INK, 1); art.fillRoundedRect(x - 37, y - 26, 74, 55, 9); art.fillStyle(index ? 0x4f8b78 : 0x3268a0, 1); art.fillRoundedRect(x - 32, y - 21, 64, 45, 7); [0xf6edc9, 0xee9aa8, 0xf1bf67, 0x8bd0a5].forEach((colour, flower) => { art.fillStyle(colour, 1); art.fillCircle(x - 24 + flower * 16, y - 22 - (flower % 2) * 8, 8); }); });

  art.fillStyle(INK, 1); art.fillRoundedRect(12, 327, 1256, 382, 10);
  art.fillStyle(0xa96838, 1); art.fillRoundedRect(20, 335, 1240, 366, 6);
  art.fillStyle(0x704123, 1); art.fillRect(20, 612, 1240, 89);
  const panel = (x, y, width, height, colour = PAPER) => { art.fillStyle(INK, 1); art.fillRoundedRect(x, y, width, height, 8); art.fillStyle(colour, 1); art.fillRoundedRect(x + 5, y + 5, width - 10, height - 10, 4); };
  panel(34, 350, 250, 118, 0xe3c18a); panel(34, 479, 250, 118, 0xd5d9d1);
  panel(300, 350, 392, 230, 0xd7c49b); panel(706, 350, 258, 230, 0xe4bd84); panel(978, 350, 270, 345, 0xfff1c9);
  [[78, 408], [157, 408], [236, 408]].forEach(([x, y], index) => { art.fillStyle(index === 0 ? 0xc98b55 : index === 1 ? 0xe3aa62 : 0xead09a, 1); art.fillTriangle(x - 23, y - 18, x + 23, y - 18, x, y + 35); art.lineStyle(3, INK, 1); art.strokeTriangle(x - 23, y - 18, x + 23, y - 18, x, y + 35); });
  [[78, 538], [157, 538], [236, 538]].forEach(([x, y], index) => { art.fillStyle([0x8fc4d5, 0xc8d0cb, 0xa9b8b7][index], 1); art.fillRoundedRect(x - 26, y - 28, 52, 62, 9); art.lineStyle(3, INK, 1); art.strokeRoundedRect(x - 26, y - 28, 52, 62, 9); });
  [[48, 493, 101, 96, 0xe98fa5], [163, 493, 101, 96, 0xf0c94f]].forEach(([x, y, width, height, colour], index) => {
    art.fillStyle(INK, 1); art.fillRoundedRect(x, y, width, height, 8); art.fillStyle(colour, 1); art.fillRoundedRect(x + 5, y + 5, width - 10, height - 10, 5);
    art.fillStyle(WHITE, 0.8); art.fillRoundedRect(x + 21, y + 18, width - 42, 34, 6); art.fillStyle(0xa9b8b7, 1); art.fillRoundedRect(x + 33, y + 57, width - 66, 28, 6);
    art.fillStyle(INK, 1); art.fillRect(x + width / 2 - 4, y + 44, 8, 23); art.fillStyle(index ? 0xf3d979 : 0xee9aa8, 1); art.fillRect(x + 39, y + 66, width - 78, 13);
  });
  [0xee9aa8, 0x8c5a43, 0xf6edc9, 0x8bd0a5, 0xaa78bd, 0x7687c5].forEach((colour, index) => { const x = 318 + (index % 3) * 122; const y = 382 + Math.floor(index / 3) * 89; art.fillStyle(INK, 1); art.fillRoundedRect(x, y, 108, 72, 7); art.fillStyle(colour, 1); art.fillRoundedRect(x + 5, y + 5, 98, 62, 5); art.fillStyle(0xffffff, 0.18); art.fillCircle(x + 35, y + 24, 11); });
  [0xd75f63, 0x6c432d, 0xd69a55].forEach((colour, index) => { const x = 730 + index * 72; art.fillStyle(INK, 1); art.fillRoundedRect(x, 371, 52, 98, 8); art.fillStyle(colour, 1); art.fillRoundedRect(x + 5, 376, 42, 88, 5); art.fillStyle(PAPER, 1); art.fillRect(x + 15, 399, 22, 25); });
  for (let index = 0; index < 6; index += 1) { const x = 730 + (index % 3) * 72; const y = 492 + Math.floor(index / 3) * 47; art.fillStyle(INK, 1); art.fillRoundedRect(x, y, 52, 38, 5); art.fillStyle([0xf1bf67, 0x6c432d, 0xe99baa, 0xd75f63, 0x8bd0a5, 0xe3aa62][index], 1); art.fillRoundedRect(x + 4, y + 4, 44, 30, 3); }
  art.lineStyle(4, 0xd09f65, 1); art.strokeRoundedRect(1000, 377, 226, 198, 6);
  [1018, 1084, 1150].forEach((x) => { art.fillStyle(0xd7c49b, 1); art.fillRoundedRect(x, 521, 54, 42, 5); });
  art.fillStyle(0x2f7f3d, 1); art.fillRoundedRect(1005, 607, 216, 66, 9); art.lineStyle(4, INK, 1); art.strokeRoundedRect(1005, 607, 216, 66, 9);
  panel(315, 590, 380, 105, 0xffe8b7); panel(714, 590, 244, 105, 0xc5d2dc);

  label(scene, 640, 36, "⚓  SOUTH SHORE SCOOPS  ⚓", 24).setOrigin(0.5).setDepth(5);
  label(scene, 49, 362, "CONTAINERS", 9, "#292238").setDepth(5); label(scene, 49, 491, "CUPS & DRINKS", 9, "#292238").setDepth(5);
  label(scene, 316, 362, "FLAVOURS", 9, "#292238").setDepth(5); label(scene, 722, 362, "SAUCES & EXTRAS", 9, "#292238").setDepth(5);
  label(scene, 995, 362, "CURRENT ORDER", 9, "#292238").setDepth(5); label(scene, 331, 606, "BUILD MAT", 9, "#292238").setDepth(5); label(scene, 731, 606, "SERVING TRAY", 9, "#292238").setDepth(5); label(scene, 1113, 632, "SERVE", 16, "#fffaf0").setOrigin(0.5).setDepth(5);
  [
    ["SCENE-BACKDROP", 640, 360, 1280, 720], ["SHOP-WALLS", 640, 514, 1280, 412], ["AWNING", 640, 34, 1280, 69],
    ["TITLE-SIGN", 640, 48, 900, 74], ["TITLE-ANCHOR-LEFT", 230, 48, 44, 44], ["TITLE-ANCHOR-RIGHT", 1050, 48, 44, 44], ["TITLE-STARFISH", 1005, 55, 34, 34],
    ["SEASIDE-SKY", 640, 150, 836, 104], ["SEASIDE-WATER", 640, 256, 836, 109], ["SEASIDE-BEACH", 640, 254, 836, 116],
    ["SEASIDE-DISTANT-LAND", 890, 196, 260, 92], ["SEASIDE-SAILBOAT", 640, 217, 64, 45],
    ["CUSTOMER-WINDOW", 640, 205, 848, 225], ["CONTAINER-AREA", 159, 409, 250, 118], ["DRINK-AREA", 159, 538, 250, 118],
    ["SERVICE-LEDGE", 640, 311, 872, 22], ["MENU-BOARD", 105, 206, 142, 174], ["HANGING-ANCHOR-SIGN", 1142, 194, 78, 112],
    ["PLANTER-LEFT", 126, 290, 88, 90], ["PLANTER-RIGHT", 1152, 292, 88, 90], ["COUNTER-FRAME", 640, 518, 1256, 382],
    ["MILKSHAKE-MACHINE", 92, 539, 94, 104], ["LEMONADE-MACHINE", 222, 539, 94, 104],
    ["FLAVOUR-TUBS", 496, 474, 392, 247], ["SAUCES-EXTRAS", 835, 474, 258, 247], ["ORDER-CARD", 1113, 474, 270, 247],
    ["FLAVOUR-TUB-STRAWBERRY", 372, 418, 108, 72], ["FLAVOUR-TUB-CHOCOLATE", 494, 418, 108, 72], ["FLAVOUR-TUB-VANILLA", 616, 418, 108, 72],
    ["FLAVOUR-TUB-MINT", 372, 507, 108, 72], ["FLAVOUR-TUB-GRAPE", 494, 507, 108, 72], ["FLAVOUR-TUB-BLUEBERRY", 616, 507, 108, 72],
    ["SAUCE-BOTTLE-STRAWBERRY", 756, 420, 52, 98], ["SAUCE-BOTTLE-CHOCOLATE", 828, 420, 52, 98], ["SAUCE-BOTTLE-CARAMEL", 900, 420, 52, 98],
    ["TOPPING-BIN-SPRINKLES", 756, 511, 52, 38], ["TOPPING-BIN-CHOCOLATE-BITS", 828, 511, 52, 38], ["TOPPING-BIN-WAFFLE-PIECES", 900, 511, 52, 38],
    ["TOPPING-BIN-CHERRIES", 756, 558, 52, 38], ["TOPPING-BIN-MARSHMALLOWS", 828, 558, 52, 38], ["TOPPING-BIN-WAFER-STICKS", 900, 558, 52, 38],
    ["ORDER-CARD-PRODUCT", 1113, 448, 150, 140], ["ORDER-SLOT-1", 1045, 542, 54, 42], ["ORDER-SLOT-2", 1111, 542, 54, 42], ["ORDER-SLOT-3", 1177, 542, 54, 42],
    ["BUILD-MAT", 505, 642, 380, 105], ["SERVING-TRAY", 836, 642, 244, 105], ["SERVE-BUTTON", 1113, 640, 216, 66],
  ].forEach(([id, x, y, width, height]) => semanticSlot(scene, `KW-SCOOPS-${id}`, x, y, width, height));
  const presentation = { dynamic: assetLabel(scene.add.container(0, 0), "KW-SCOOPS-DYNAMIC-PRESENTATION").setDepth(8), stateObjects: [] };
  scene.scoopsPresentation = presentation;
  return presentation;
}

export function updateScoopsPresentation(scene, snapshot = {}) {
  const presentation = scene.scoopsPresentation;
  if (!presentation) return;
  presentation.stateObjects.forEach((object) => object.destroy()); presentation.stateObjects.length = 0;
  const customers = snapshot.customers || [];
  presentation.customerTargets = [];
  const customerSeats = [[390, 252], [640, 252], [890, 252]];
  customerSeats.forEach(([x, y], index) => {
    if (!customers[index]) return;
    const person = assetLabel(scene.add.graphics(), `KW-SCOOPS-CUSTOMER-${index + 1}-PIXEL`).setDepth(8);
    drawScoopsCustomer(person, x, y, index + 2, true);
    presentation.stateObjects.push(person);
    presentation.customerTargets[index] = [person];
  });
  customers.slice(0, 3).forEach((customer, index) => {
    const [x, y] = customerSeats[index];
    const bubble = assetLabel(scene.add.graphics(), `KW-SCOOPS-CUSTOMER-${index + 1}-ORDER-BUBBLE`).setDepth(9); bubble.fillStyle(INK, 1); bubble.fillRoundedRect(x - 79, y - 168, 158, 118, 11); bubble.fillTriangle(x - 14, y - 52, x + 14, y - 52, x, y - 32); bubble.fillStyle(WHITE, 1); bubble.fillRoundedRect(x - 73, y - 162, 146, 106, 7);
    const picture = assetLabel(scene.add.graphics(), `KW-SCOOPS-CUSTOMER-${index + 1}-PRODUCT`).setDepth(10); drawScoopsProduct(picture, x, y - 108, customer.parts || [], 0.82);
    presentation.stateObjects.push(bubble, picture);
    presentation.customerTargets[index].push(bubble, picture);
  });
  const productArt = assetLabel(scene.add.graphics(), "KW-SCOOPS-BUILD-TRAY-SELECTED-PRODUCTS").setDepth(10);
  if (snapshot.buildParts?.length) drawScoopsProduct(productArt, 505, 645, snapshot.buildParts, 0.84);
  else {
    const prompt = label(scene, 505, 648, "BUILD HERE", 13, "#7d6546").setOrigin(0.5).setDepth(10);
    presentation.stateObjects.push(prompt);
  }
  (snapshot.trayItems || []).slice(0, 3).forEach((parts, index) => drawScoopsProduct(productArt, 780 + index * 56, 645, parts, 0.56));
  if (snapshot.selectedParts?.length) drawScoopsProduct(productArt, 1113, 452, snapshot.selectedParts, 1.18);
  presentation.stateObjects.push(productArt);
}

export function animateScoopsDeparture(scene, index = 0) {
  const targets = scene.scoopsPresentation?.customerTargets?.[index] || [];
  if (!targets.length) return false;
  scene.tweens.add({ targets, x: -20, alpha: 0, duration: 280, ease: "Sine.easeIn" });
  return true;
}

const SCOOP_COLOURS = Object.freeze({
  strawberry: 0xee9aa8, chocolate: 0x8c5a43, vanilla: 0xf6edc9, mint: 0x8bd0a5,
  grape: 0xaa78bd, blueberry: 0x7687c5, shavedIce: 0xcbeaf0, fruitSyrup: 0xd75f63,
});

function drawScoopsProduct(graphics, x, y, parts, scale = 1) {
  const ids = Array.isArray(parts) ? parts : [];
  const flavourIds = ids.filter((id) => SCOOP_COLOURS[id] && !["shavedIce", "fruitSyrup"].includes(id));
  const container = ids.find((id) => ["cone", "waffle", "shavedCup", "sundaeCup", "cup", "drinkCup"].includes(id));
  const isDrink = ids.some((id) => ["milkshake", "lemonade"].includes(id));
  const isLolly = ids.includes("lolly");
  graphics.lineStyle(Math.max(2, 3 * scale), INK, 1);
  if (isLolly) {
    graphics.fillStyle(0xc98b55, 1); graphics.fillRect(x - 2 * scale, y + 18 * scale, 4 * scale, 24 * scale);
    graphics.fillStyle(SCOOP_COLOURS[ids.find((id) => SCOOP_COLOURS[id])] || 0xd75f63, 1); graphics.fillRoundedRect(x - 16 * scale, y - 24 * scale, 32 * scale, 48 * scale, 12 * scale); graphics.strokeRoundedRect(x - 16 * scale, y - 24 * scale, 32 * scale, 48 * scale, 12 * scale);
    return;
  }
  if (isDrink || container === "drinkCup") {
    graphics.fillStyle(isDrink && ids.includes("lemonade") ? 0xf3d979 : 0xee9aa8, 1); graphics.fillRoundedRect(x - 22 * scale, y - 25 * scale, 44 * scale, 56 * scale, 7 * scale); graphics.strokeRoundedRect(x - 22 * scale, y - 25 * scale, 44 * scale, 56 * scale, 7 * scale);
    graphics.lineStyle(Math.max(2, 4 * scale), 0xd75f63, 1); graphics.lineBetween(x + 8 * scale, y - 23 * scale, x + 19 * scale, y - 48 * scale);
  } else if (container === "cone" || container === "waffle") {
    graphics.fillStyle(container === "waffle" ? 0xe3aa62 : 0xc98b55, 1); graphics.fillTriangle(x - 24 * scale, y + 8 * scale, x + 24 * scale, y + 8 * scale, x, y + 58 * scale); graphics.strokeTriangle(x - 24 * scale, y + 8 * scale, x + 24 * scale, y + 8 * scale, x, y + 58 * scale);
    graphics.lineStyle(Math.max(1, 2 * scale), 0x8c5a43, 0.7); graphics.lineBetween(x - 13 * scale, y + 15 * scale, x + 8 * scale, y + 44 * scale); graphics.lineBetween(x + 13 * scale, y + 15 * scale, x - 8 * scale, y + 44 * scale);
  } else {
    graphics.fillStyle(container === "sundaeCup" ? 0x8fc4d5 : 0xf1c6a0, 1); graphics.fillRoundedRect(x - 28 * scale, y + 5 * scale, 56 * scale, 42 * scale, 8 * scale); graphics.strokeRoundedRect(x - 28 * scale, y + 5 * scale, 56 * scale, 42 * scale, 8 * scale);
    graphics.fillStyle(WHITE, 0.45); graphics.fillRect(x - 17 * scale, y + 10 * scale, 7 * scale, 28 * scale);
  }
  const scoops = flavourIds.length ? flavourIds : ids.includes("shavedIce") ? ["shavedIce"] : [];
  scoops.slice(0, 3).forEach((id, index) => {
    const offsets = scoops.length === 1 ? [0] : scoops.length === 2 ? [-14, 14] : [-21, 0, 21];
    graphics.fillStyle(SCOOP_COLOURS[id], 1); graphics.fillCircle(x + offsets[index] * scale, y - (scoops.length === 3 && index === 1 ? 18 : 7) * scale, 20 * scale); graphics.strokeCircle(x + offsets[index] * scale, y - (scoops.length === 3 && index === 1 ? 18 : 7) * scale, 20 * scale);
  });
  if (ids.some((id) => id.endsWith("Sauce") || id === "fruitSyrup")) { graphics.lineStyle(Math.max(2, 4 * scale), ids.includes("chocolateSauce") ? 0x6c432d : ids.includes("caramelSauce") ? 0xd69a55 : 0xd75f63, 1); graphics.lineBetween(x - 20 * scale, y - 25 * scale, x + 20 * scale, y - 4 * scale); }
  if (ids.includes("sprinkles") || ids.includes("chocBits") || ids.includes("marshmallows")) {
    [0xd75f63, 0xf3d979, 0x5f8fb8, 0x8bd0a5].forEach((color, index) => { graphics.fillStyle(ids.includes("chocBits") ? 0x6c432d : color, 1); graphics.fillCircle(x + (-15 + index * 10) * scale, y - 20 * scale, 3 * scale); });
  }
  if (ids.includes("cherry")) { graphics.fillStyle(0xd75f63, 1); graphics.fillCircle(x, y - 38 * scale, 7 * scale); graphics.lineStyle(Math.max(1, 2 * scale), 0x5f8f55, 1); graphics.lineBetween(x, y - 43 * scale, x + 5 * scale, y - 53 * scale); }
}
