import Phaser from "phaser";
import { ITEM_CATALOG, placeableFootprintFor } from "../data/items.js";

function treePalette(style) {
  if (style === "cherry") return [0x8b6546, 0xf09ab4, 0xf6bed0];
  if (style === "magnolia") return [0x806044, 0xeaa8c3, 0xf4cfdd];
  if (style === "birch") return [0xe8e4d7, 0x71a85b, 0x9ac779];
  if (style === "willow") return [0x71513b, 0x5d9f58, 0x82bd67];
  if (style === "pine") return [0x765238, 0x34704a, 0x4b8a58];
  if (style === "apple") return [0x765238, 0x57944e, 0x7db563];
  if (style === "grand-oak") return [0x67462f, 0x3f7c43, 0x65a24e];
  return [0x765238, 0x4e9148, 0x79b85d];
}

function drawTree(graphics, item, footprint) {
  const style = item.effect?.treeStyle || "maple";
  const [trunk, leaf, highlight] = treePalette(style);
  const scale = footprint / 50;
  graphics.fillStyle(0x294637, 0.16).fillEllipse(-28 * scale, 20 * scale, 56 * scale, 18 * scale);
  graphics.fillStyle(trunk, 1).fillRoundedRect(-7 * scale, -4 * scale, 14 * scale, 34 * scale, 4 * scale);
  if (style === "pine") {
    graphics.fillStyle(leaf, 1).fillTriangle(0, -52 * scale, -34 * scale, 16 * scale, 34 * scale, 16 * scale);
    graphics.fillStyle(highlight, 0.85).fillTriangle(-4 * scale, -41 * scale, -26 * scale, 5 * scale, 6 * scale, 5 * scale);
  } else {
    graphics.fillStyle(leaf, 1).fillCircle(-18 * scale, -22 * scale, 24 * scale).fillCircle(14 * scale, -25 * scale, 27 * scale).fillCircle(0, -45 * scale, 28 * scale);
    graphics.fillStyle(highlight, 0.84).fillCircle(-9 * scale, -48 * scale, 15 * scale).fillCircle(22 * scale, -33 * scale, 12 * scale);
  }
  if (style === "apple") graphics.fillStyle(0xc64f43, 1).fillCircle(-18 * scale, -30 * scale, 4).fillCircle(12 * scale, -45 * scale, 4).fillCircle(22 * scale, -16 * scale, 4);
}

function drawBench(graphics, item) {
  const picnic = item.id === "picnic-table";
  const iron = item.effect?.benchStyle === "iron";
  const green = item.effect?.benchStyle === "green";
  const colour = iron ? 0x4e5556 : green ? 0x477d50 : 0x986b43;
  graphics.fillStyle(0x294637, 0.16).fillEllipse(-40, 15, 80, 18);
  graphics.fillStyle(colour, 1).fillRoundedRect(-34, picnic ? -10 : -4, 68, 13, 4);
  graphics.fillStyle(iron ? 0x2f3838 : 0x765238, 1).fillRect(-29, 7, 7, 18).fillRect(22, 7, 7, 18);
  if (picnic) graphics.fillRect(-42, 10, 84, 8).fillRect(-31, -20, 7, 50).fillRect(24, -20, 7, 50);
  else graphics.fillStyle(colour, 1).fillRoundedRect(-34, -25, 68, 15, 4);
}

function drawBin(graphics, item) {
  const colour = item.id === "recycling-bin" ? 0x428667 : item.id === "commercial-bin" ? 0x59615d : 0x315c43;
  const width = item.id === "commercial-bin" ? 42 : 29;
  graphics.fillStyle(0x294637, 0.2).fillEllipse(-width / 2 - 6, 17, width + 12, 14);
  graphics.fillStyle(0x273a31, 1).fillRoundedRect(-width / 2 - 3, -23, width + 6, 9, 3);
  graphics.fillStyle(colour, 1).fillRoundedRect(-width / 2, -16, width, 39, 5);
  if (item.id === "recycling-bin") graphics.lineStyle(3, 0xf5f1dc, 1).strokeCircle(0, 1, 8);
}

function drawDecoration(graphics, item) {
  const type = item.placeableType;
  if (type === "planter") {
    graphics.fillStyle(item.effect?.planterStyle === "kindly-heart" ? 0x4e805e : 0xa86848, 1).fillRoundedRect(-22, 2, 44, 24, 6);
    graphics.fillStyle(item.effect?.planterStyle === "flower" ? 0xe7a151 : 0x57944e, 1);
    for (const x of [-15, -5, 6, 16]) graphics.fillCircle(x, -2 - Math.abs(x % 5), 8);
  } else if (type === "lamp") {
    graphics.fillStyle(0x4d5550, 1).fillRect(-4, -30, 8, 59).fillRoundedRect(-12, -39, 24, 18, 5);
    graphics.fillStyle(0xffe08a, 1).fillCircle(0, -30, 8);
  } else if (type === "birdbath") {
    graphics.fillStyle(0x839795, 1).fillEllipse(-22, -10, 44, 15).fillRect(-4, -7, 8, 31).fillRoundedRect(-13, 20, 26, 8, 4);
    graphics.fillStyle(0x74bfd1, 1).fillEllipse(-17, -12, 34, 8);
  } else if (type === "sign") {
    graphics.fillStyle(0x765238, 1).fillRect(-4, -4, 8, 32).fillRoundedRect(-25, -28, 50, 26, 4);
  } else if (type === "hedge") {
    graphics.fillStyle(0x467d47, 1).fillCircle(-18, 0, 20).fillCircle(0, -7, 23).fillCircle(19, 0, 20);
    graphics.fillStyle(0x6aa357, 0.8).fillCircle(-7, -14, 11).fillCircle(20, -7, 9);
  } else if (type === "rock") {
    graphics.fillStyle(0x788783, 1).fillPoints([{ x: -25, y: 19 }, { x: -17, y: -10 }, { x: 2, y: -24 }, { x: 27, y: 8 }, { x: 13, y: 23 }], true);
    graphics.fillStyle(0xa8b0a7, 0.8).fillTriangle(-13, -8, 2, -18, 8, 2);
  } else if (type === "fountain") {
    const large = item.id === "grand-fountain";
    const scale = large ? 1.35 : 1;
    graphics.fillStyle(0xaabbb7, 1).fillEllipse(-30 * scale, 10, 60 * scale, 24 * scale);
    graphics.fillStyle(0x68b8ce, 1).fillEllipse(-24 * scale, 7, 48 * scale, 16 * scale);
    graphics.lineStyle(5, 0x78c7dc, 1).lineBetween(0, 5, 0, -34 * scale).strokeCircle(0, -25 * scale, 10 * scale);
  } else if (type === "clock") {
    graphics.fillStyle(0x4d5550, 1).fillRect(-4, -20, 8, 52).fillRoundedRect(-14, 27, 28, 7, 3);
    graphics.fillStyle(0xf4ecd7, 1).fillCircle(0, -29, 18);
    graphics.lineStyle(3, 0x4d5550, 1).strokeCircle(0, -29, 18).lineBetween(0, -29, 0, -40).lineBetween(0, -29, 8, -24);
  } else if (type === "picnic") {
    const premium = item.id === "premium-picnic-area";
    graphics.fillStyle(0xd78372, 1).fillRoundedRect(premium ? -43 : -29, premium ? -31 : -23, premium ? 86 : 58, premium ? 62 : 46, 7);
    graphics.lineStyle(5, 0xf7dfc7, 0.9).lineBetween(premium ? -37 : -24, 0, premium ? 37 : 24, 0).lineBetween(0, premium ? -27 : -19, 0, premium ? 27 : 19);
  } else if (type === "gazebo") {
    graphics.fillStyle(0xf2e8cc, 1).fillTriangle(0, -48, -48, -12, 48, -12);
    graphics.fillStyle(0x765f48, 1).fillRect(-39, -10, 7, 49).fillRect(32, -10, 7, 49).fillRect(-46, 34, 92, 8);
  } else if (type === "monument") {
    graphics.fillStyle(0xa9a79d, 1).fillRoundedRect(-32, 14, 64, 22, 5).fillRoundedRect(-19, -34, 38, 50, 4);
    graphics.fillStyle(0xd3a93f, 1).fillPoints(
      Array.from({ length: 10 }, (_, index) => {
        const angle = -Math.PI / 2 + (index * Math.PI) / 5;
        const radius = index % 2 === 0 ? 14 : 7;
        return new Phaser.Geom.Point(Math.cos(angle) * radius, -12 + Math.sin(angle) * radius);
      }),
      true,
    );
  }
}

export function createTownPlacedObject(scene, object, { preview = false, valid = true, onSelect = null } = {}) {
  const item = ITEM_CATALOG[object.itemId];
  if (!item) return null;
  const footprint = placeableFootprintFor(item);
  const container = scene.add.container(object.x, object.y);
  const graphics = scene.add.graphics();
  if (item.placeableType === "tree") drawTree(graphics, item, footprint);
  else if (item.placeableType === "bench") drawBench(graphics, item);
  else if (item.placeableType === "bin") drawBin(graphics, item);
  else drawDecoration(graphics, item);
  container.add(graphics);
  if (preview) {
    const outline = scene.add.graphics();
    outline.lineStyle(5, valid ? 0x2f7d48 : 0xb44f45, 0.95).strokeCircle(0, 0, footprint);
    outline.lineStyle(2, 0xffffff, 0.8).strokeCircle(0, 0, Math.max(8, footprint - 6));
    container.addAt(outline, 0);
    container.setAlpha(0.7);
  }
  container.setRotation(Number(object.rotation) || 0);
  container.setDepth((preview ? 520 : 112) + object.y / 10);
  container.setSize(footprint * 2, footprint * 2);
  if (!preview && typeof onSelect === "function") {
    container.setInteractive();
    container.input.cursor = "pointer";
    container.on("pointerdown", (pointer) => {
      pointer.event?.stopPropagation?.();
      onSelect(object.id);
    });
  }
  container.setData("placedObjectId", object.id || "preview");
  container.setData("itemId", item.id);
  container.setData("footprint", footprint);
  return container;
}
