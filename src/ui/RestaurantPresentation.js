const INK = 0x292238;
const PAPER = 0xfff1c9;
const WHITE = 0xfffaf0;

function assetLabel(object, id) {
  object.name = id;
  object.setData?.("assetLabel", id);
  return object;
}

const PALETTES = Object.freeze({
  bakery: Object.freeze({ wall: 0xb68b62, dining: 0x876348, counter: 0x9c6f50, kitchen: 0xc7a36c, wood: 0x9b6044, trim: 0xd9c394, accent: 0xd76d4d, uniform: 0xf2c761 }),
  cafe: Object.freeze({ wall: 0x9db7a0, dining: 0x9b6547, counter: 0x76503e, kitchen: 0x76a0a2, wood: 0x8f563f, trim: 0xe4cc9b, accent: 0x5f9b63, uniform: 0x76a0a2 }),
  mug: Object.freeze({ wall: 0x86b7b3, dining: 0x9b6547, counter: 0x76503e, kitchen: 0x76a0a2, wood: 0x76503e, trim: 0xe8d1a2, accent: 0x3f7d7c, uniform: 0x65a7a0 }),
  riverside: Object.freeze({ wall: 0xc99b69, dining: 0x9b6547, counter: 0x76503e, kitchen: 0x76a0a2, wood: 0x684338, trim: 0xf0d7ad, accent: 0xb66a46, uniform: 0xc97858 }),
});

const VENUE_COPY = Object.freeze({
  bakery: Object.freeze({ dining: "CUSTOMER QUEUE", counter: "ORDER COUNTER · THREE TICKETS", prep: "BAKERY BENCH · THREE PREP SPACES", kitchen: "BAKERY KITCHEN", stations: ["MIX", "SHAPE", "OVEN", "FINISH"] }),
  cafe: Object.freeze({ dining: "DINING ROOM", counter: "ORDER COUNTER · THREE TICKETS", prep: "PREP COUNTER · THREE TRAYS", kitchen: "CAFÉ KITCHEN", stations: ["KETTLE", "TOASTER", "HOB", "OVEN"] }),
  mug: Object.freeze({ dining: "COFFEE LOUNGE", counter: "ORDER COUNTER · THREE TICKETS", prep: "DRINK COUNTER · THREE TRAYS", kitchen: "BARISTA STATIONS", stations: ["GRINDER", "ESPRESSO", "STEAM", "COLD"] }),
  riverside: Object.freeze({ dining: "DINING ROOM", counter: "ORDER PASS · THREE TICKETS", prep: "PLATING PASS · THREE TRAYS", kitchen: "RESTAURANT KITCHEN", stations: ["PREP", "PAN", "POT", "GRILL", "OVEN"] }),
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
  label(scene, x + 10, y + 8, text, 10, "#453b36").setDepth(4);
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
  roomTag(scene, 28, 88, 474, copy.dining);
  roomTag(scene, 542, 88, 256, copy.counter);
  roomTag(scene, 542, 246, 256, copy.prep);
  roomTag(scene, 836, 88, 408, copy.kitchen);
  label(scene, 26, 23, `${venue === "bakery" ? "LITTLE BAKERY" : venue === "mug" ? "MORNING MUG COFFEE" : venue === "riverside" ? "RIVERSIDE KITCHEN" : "CORNER CAFÉ"} · WILLOWMERE`, 17).setDepth(5);
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
  seats.forEach(([x, y], index) => pixelPerson(people, x, y, index + 1, null, Boolean(orders[index]), 1.3));
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
  });
  (snapshot.trays || []).slice(0, 3).forEach((trayState, index) => {
    if (!trayState.icon) return;
    const icon = assetLabel(scene.add.text(670, 338 + index * 112, trayState.icon, { fontSize: "34px", resolution: 2 }), `KW-${presentation.venue.toUpperCase()}-TRAY-${index + 1}-FOOD`).setOrigin(0.5).setDepth(10);
    if (trayState.active) icon.setScale(1.13);
    presentation.stateObjects.push(icon);
  });
  presentation.workerTag.setText(snapshot.workerState === "ready" ? "READY · TAP" : snapshot.workerState === "working" ? "WORKING…" : snapshot.workerState === "burnt" ? "BURNT" : "READY");
  presentation.workerTag.setBackgroundColor(snapshot.workerState === "burnt" ? "#d55a4d" : snapshot.workerState === "ready" ? "#b9dc93" : snapshot.workerState === "working" ? "#f1bf67" : "#fff1c9");
  const workerAtStation = ["working", "ready", "burnt"].includes(snapshot.workerState);
  scene.tweens.killTweensOf([presentation.worker, presentation.workerTag]);
  scene.tweens.add({ targets: [presentation.worker, presentation.workerTag], x: workerAtStation ? -145 : 0, y: workerAtStation ? -175 : 0, duration: 260, ease: "Stepped", easeParams: [4] });
  if (snapshot.expectedIcon) {
    const expected = assetLabel(scene.add.text(workerAtStation ? 893 : 1038, workerAtStation ? 263 : 438, snapshot.expectedIcon, { fontSize: "22px", backgroundColor: "#fff1c9", color: "#292238", padding: { x: 5, y: 3 }, resolution: 2 }), `KW-${presentation.venue.toUpperCase()}-WORKER-PAYLOAD`).setOrigin(0.5).setDepth(10);
    presentation.stateObjects.push(expected);
  }
}

function drawScoopsCustomer(graphics, x, y, index, active) {
  pixelPerson(graphics, x, y, index, null, active);
  graphics.fillStyle(INK, 1); graphics.fillRoundedRect(x - 29, y + 33, 58, 12, 4);
  graphics.fillStyle(active ? 0xf2d787 : 0x8aa0a0, 1); graphics.fillRoundedRect(x - 25, y + 36, 50, 6, 2);
}

export function createScoopsPresentation(scene) {
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

export function updateScoopsPresentation(scene, snapshot = {}) {
  const presentation = scene.scoopsPresentation;
  if (!presentation) return;
  presentation.stateObjects.forEach((object) => object.destroy()); presentation.stateObjects.length = 0;
  const customers = snapshot.customers || [];
  const people = assetLabel(scene.add.graphics(), "KW-SCOOPS-CUSTOMER-GROUP").setDepth(8);
  [[80, 190], [235, 190], [80, 420], [235, 420]].forEach(([x, y], index) => drawScoopsCustomer(people, x, y, index + 2, Boolean(customers[index])));
  presentation.stateObjects.push(people);
  customers.slice(0, 4).forEach((customer, index) => {
    const [x, y] = [[80, 190], [235, 190], [80, 420], [235, 420]][index];
    const bubble = assetLabel(scene.add.graphics(), `KW-SCOOPS-CUSTOMER-${index + 1}-ORDER-BUBBLE`).setDepth(9); bubble.fillStyle(INK, 1); bubble.fillRoundedRect(x - 42, y - 102, 84, 58, 7); bubble.fillStyle(WHITE, 1); bubble.fillRoundedRect(x - 38, y - 98, 76, 50, 4);
    const picture = assetLabel(scene.add.graphics(), `KW-SCOOPS-CUSTOMER-${index + 1}-PRODUCT`).setDepth(10); drawScoopsProduct(picture, x, y - 72, customer.parts || [], 0.48);
    presentation.stateObjects.push(bubble, picture);
  });
  const productArt = assetLabel(scene.add.graphics(), "KW-SCOOPS-BUILD-TRAY-SELECTED-PRODUCTS").setDepth(10);
  if (snapshot.buildParts?.length) drawScoopsProduct(productArt, 582, 448, snapshot.buildParts, 1.55);
  else {
    const prompt = label(scene, 582, 452, "CHOOSE PARTS", 25, "#292238").setOrigin(0.5).setDepth(10);
    presentation.stateObjects.push(prompt);
  }
  (snapshot.trayItems || []).slice(0, 2).forEach((parts, index) => drawScoopsProduct(productArt, 831, 426 + index * 94, parts, 0.82));
  if (snapshot.selectedParts?.length) drawScoopsProduct(productArt, 1087, 447, snapshot.selectedParts, 1.35);
  presentation.stateObjects.push(productArt);
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
