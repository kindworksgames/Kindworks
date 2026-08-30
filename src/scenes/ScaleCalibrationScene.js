import Phaser from "phaser";
import { ITEM_CATALOG } from "../data/items.js";
import { PlayerCharacter } from "../entities/PlayerCharacter.js";
import { NpcCharacter } from "../entities/NpcCharacter.js";
import { getTownBinVisualFactory } from "../visual/renderers/TownBinVisualFactory.js";
import { SCALE_CALIBRATION_OBJECTS } from "../visual/scale/calibrationFixtures.js";
import {
  CANONICAL_LANDSCAPE,
  DEPTH_LAYER_IDS,
  HUD_SAFE_AREA,
  LOGICAL_WORLD,
  MEASURED_WORLD_REFERENCES,
  RESIDENT_MEASURING_REFERENCE,
  SUPPORTED_LANDSCAPE_VIEWPORTS,
  compareGroundOrder,
  groundContactWorldPosition,
  resolveDisplayMetrics,
  resolveGroundDepth,
} from "../visual/scale/scaleSystem.js";

const COLORS = Object.freeze({
  background: 0x172a24,
  panel: 0xf7f0d8,
  ink: 0x203b31,
  grid: 0x365448,
  majorGrid: 0x6c8f74,
  visual: 0x4d9de0,
  collision: 0xe45756,
  navigation: 0x7b61ff,
  interaction: 0xf2b134,
  touch: 0x23b5d3,
  ground: 0xf6e58d,
});

function calibrationResident() {
  return {
    id: "npc-calibration-01",
    name: "Willow",
    role: "Resident reference",
    x: 0,
    y: 0,
    visible: true,
    palette: { skin: 0xe6b88b, hair: 0x3f2c24, shirt: 0x638f5f, pants: 0x5a5978 },
    bodyScale: 1,
    hairStyle: 1,
    accessoryStyle: "none",
    facingX: 1,
    phase: "idle",
    activity: "idle",
    actionState: "IDLE",
    carryItem: null,
    greetingIcon: "",
    reactionIcon: "",
  };
}

function addLabel(scene, x, y, text, { size = 12, originX = 0.5, originY = 0, color = "#203b31", background = "rgba(255,250,226,.94)" } = {}) {
  return scene.add.text(x, y, text, {
    color,
    backgroundColor: background,
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    fontSize: `${size}px`,
    fontStyle: "bold",
    padding: { x: 5, y: 3 },
  }).setOrigin(originX, originY).setDepth(1002);
}

export class ScaleCalibrationScene extends Phaser.Scene {
  constructor() {
    super("ScaleCalibrationScene");
  }

  create() {
    this.geometryVisible = true;
    this.geometryGuides = this.add.container(0, 0).setDepth(910);
    this.movementBounds = new Phaser.Geom.Rectangle(30, 410, 900, 270);
    this.cameras.main.setBounds(0, 0, CANONICAL_LANDSCAPE.width, CANONICAL_LANDSCAPE.height);
    this.cameras.main.setZoom(1).centerOn(CANONICAL_LANDSCAPE.width / 2, CANONICAL_LANDSCAPE.height / 2);
    this.#installDevelopmentSurface();
    this.#drawBackgroundAndRuler();
    this.#drawMeasuredWorldSurfaces();
    this.#drawObjectReferences();
    this.#drawViewportFrames();
    this.#createResidents();
    this.#bindControls();
    this.#syncRuntimeEvidence();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.#cleanupDevelopmentSurface());
  }

  #installDevelopmentSurface() {
    document.body.dataset.gameScene = this.scene.key;
    document.body.dataset.scaleCalibrationReady = "false";
    const gameElement = document.querySelector("#game");
    if (gameElement) gameElement.dataset.scene = this.scene.key;
    const style = document.createElement("style");
    style.id = "kw-scale-calibration-style";
    style.textContent = 'body[data-game-scene="ScaleCalibrationScene"] .game-shell > :not(#game){display:none!important}body[data-game-scene="ScaleCalibrationScene"] #game{inset:0!important;width:100vw!important;height:100dvh!important}';
    document.head.append(style);
    this.calibrationStyle = style;
  }

  #cleanupDevelopmentSurface() {
    this.calibrationStyle?.remove();
    delete document.body.dataset.scaleCalibrationReady;
    delete document.body.dataset.scaleGeometryVisible;
    delete document.body.dataset.scaleSortRelation;
  }

  #drawBackgroundAndRuler() {
    this.add.rectangle(640, 360, 1280, 720, COLORS.background).setDepth(0);
    const grid = this.add.graphics().setDepth(1);
    for (let x = 0; x <= CANONICAL_LANDSCAPE.width; x += LOGICAL_WORLD.fineGrid) {
      const major = x % LOGICAL_WORLD.layoutModule === 0;
      grid.lineStyle(major ? 1.2 : 0.5, major ? COLORS.majorGrid : COLORS.grid, major ? 0.28 : 0.12).lineBetween(x, 0, x, CANONICAL_LANDSCAPE.height);
    }
    for (let y = 0; y <= CANONICAL_LANDSCAPE.height; y += LOGICAL_WORLD.fineGrid) {
      const major = y % LOGICAL_WORLD.layoutModule === 0;
      grid.lineStyle(major ? 1.2 : 0.5, major ? COLORS.majorGrid : COLORS.grid, major ? 0.28 : 0.12).lineBetween(0, y, CANONICAL_LANDSCAPE.width, y);
    }
    for (let x = 0; x <= CANONICAL_LANDSCAPE.width; x += 160) addLabel(this, x + 3, 2, `${x}`, { size: 9, originX: 0, color: "#d7efd9", background: "rgba(23,42,36,.8)" });
    for (let y = 160; y <= CANONICAL_LANDSCAPE.height; y += 160) addLabel(this, 3, y, `${y}`, { size: 9, originX: 0, color: "#d7efd9", background: "rgba(23,42,36,.8)" });
    addLabel(this, 18, 18, "KINDWORKS SCALE CALIBRATION · 1280×720 · 1 world unit = 1 canonical pixel", { size: 14, originX: 0 });
    addLabel(this, 18, 52, "8-unit snap · 32-unit module · G geometry · arrows/tap move player", { size: 10, originX: 0 });
  }

  #drawMeasuredWorldSurfaces() {
    const graphics = this.add.graphics().setDepth(10);
    const road = MEASURED_WORLD_REFERENCES.roadWidths.maximum;
    graphics.fillStyle(0xcfd2c9, 1).fillRect(20, 92, 870, road + MEASURED_WORLD_REFERENCES.roadWidths.edgeAddition);
    graphics.fillStyle(0x8a8d8b, 1).fillRect(20, 100, 870, road);
    graphics.lineStyle(2, 0xf4f0ce, 0.85).lineBetween(20, 138, 890, 138);
    graphics.fillStyle(0xd9c29a, 1).fillRect(20, 184, 870, MEASURED_WORLD_REFERENCES.pathWidths.maximum);
    graphics.fillStyle(0x91c96f, 1).fillRoundedRect(560, 228, 310, 150, 15);
    graphics.lineStyle(3, 0x6a9a55, 0.8).strokeRoundedRect(560, 228, 310, 150, 15);
    addLabel(this, 35, 105, `Road ${road} + ${MEASURED_WORLD_REFERENCES.roadWidths.edgeAddition} edge`, { size: 10, originX: 0 });
    addLabel(this, 35, 184, `Pavement/path ${MEASURED_WORLD_REFERENCES.pathWidths.maximum}`, { size: 10, originX: 0 });
    addLabel(this, 715, 236, "Lawn sample · 310 wide", { size: 10 });

    const riverCenter = 1070;
    const bankWidth = MEASURED_WORLD_REFERENCES.river.bankWidth;
    const waterWidth = MEASURED_WORLD_REFERENCES.river.waterWidth;
    graphics.fillStyle(0x9a8b68, 1).fillRect(riverCenter - bankWidth / 2, 84, bankWidth, 615);
    graphics.fillStyle(0x4a9db7, 1).fillRect(riverCenter - (waterWidth + 22) / 2, 84, waterWidth + 22, 615);
    graphics.fillStyle(0x65b9ce, 1).fillRect(riverCenter - waterWidth / 2, 84, waterWidth, 615);
    graphics.lineStyle(3, 0x8bd0df, 0.7).lineBetween(riverCenter, 84, riverCenter, 699);
    addLabel(this, riverCenter, 92, `River ${waterWidth} water / ${bankWidth} bank`, { size: 10 });
  }

  #drawObjectReferences() {
    this.houseObjects = [
      this.#drawHouseReference(125, 380, SCALE_CALIBRATION_OBJECTS.compactHouse, 0xd78363),
      this.#drawHouseReference(360, 380, SCALE_CALIBRATION_OBJECTS.oversizedReplacementHouse, 0x6f91aa),
    ];
    this.tree = this.#drawTreeReference(610, 370, SCALE_CALIBRATION_OBJECTS.tree);
    this.bench = this.#drawBenchReference(760, 370, SCALE_CALIBRATION_OBJECTS.bench);
    this.#drawDoorReference(895, 370, SCALE_CALIBRATION_OBJECTS.door);
    this.#drawFenceReference(965, 675, SCALE_CALIBRATION_OBJECTS.fence);

    const binObject = { id: "scale-calibration-bin", itemId: "small-town-bin", x: 660, y: 535, rotation: 0 };
    this.bin = getTownBinVisualFactory(this).createPlacedObject(binObject, { onSelect: () => { this.selectedObject = "bin"; } });
    this.#drawGeometryGuide(SCALE_CALIBRATION_OBJECTS.bin, binObject.x, binObject.y);
    addLabel(this, binObject.x, binObject.y + 48, SCALE_CALIBRATION_OBJECTS.bin.label, { size: 9 });
  }

  #drawHouseReference(x, groundY, fixture, roofColor) {
    const metrics = resolveDisplayMetrics({ logicalBounds: fixture.visual, technical: fixture.technical });
    const container = this.add.container(x, groundY).setDepth(resolveGroundDepth(DEPTH_LAYER_IDS.GROUND_SORTED, groundY));
    const graphics = this.add.graphics();
    graphics.fillStyle(0x203b31, 0.22).fillEllipse(-metrics.width * 0.44, -4, metrics.width * 0.88, 18);
    graphics.fillStyle(0xf2dfbd, 1).fillRoundedRect(-metrics.width / 2, -metrics.height * 0.72, metrics.width, metrics.height * 0.72, 7);
    graphics.fillStyle(roofColor, 1).fillTriangle(-metrics.width / 2 - 5, -metrics.height * 0.66, 0, -metrics.height, metrics.width / 2 + 5, -metrics.height * 0.66);
    graphics.lineStyle(3, 0x294637, 0.9).strokeTriangle(-metrics.width / 2 - 5, -metrics.height * 0.66, 0, -metrics.height, metrics.width / 2 + 5, -metrics.height * 0.66);
    graphics.fillStyle(0x3e6f76, 1).fillRect(-17, -61, 34, 61);
    for (const windowX of [-62, 62]) graphics.fillStyle(0x8ac5d5, 1).fillRect(windowX - 16, -70, 32, 26);
    container.add(graphics);
    this.#drawGeometryGuide(fixture, x, groundY);
    addLabel(this, x, groundY + 12, fixture.label, { size: 9 });
    return container;
  }

  #drawTreeReference(x, groundY, fixture) {
    const metrics = resolveDisplayMetrics({ logicalBounds: fixture.visual, technical: fixture.technical });
    const contact = groundContactWorldPosition({ x, y: groundY }, fixture.groundContact);
    const container = this.add.container(x, groundY).setDepth(resolveGroundDepth(DEPTH_LAYER_IDS.GROUND_SORTED, contact.y));
    const graphics = this.add.graphics();
    graphics.fillStyle(0x294637, 0.18).fillEllipse(-34, 20, 68, 22);
    graphics.fillStyle(0x765238, 1).fillRect(-6, -2, 12, 35);
    graphics.fillStyle(0x285f34, 1).fillCircle(-18, -10, 25).fillCircle(16, -17, 28).fillCircle(0, -35, 27);
    graphics.fillStyle(0x79bb4d, 0.82).fillCircle(-16, -42, 8).fillCircle(6, -50, 9);
    container.add(graphics);
    container.setData("logicalDisplayWidth", metrics.width).setData("logicalDisplayHeight", metrics.height).setData("nativeWidth", metrics.nativeWidth).setData("nativeHeight", metrics.nativeHeight);
    this.#drawGeometryGuide(fixture, x, groundY);
    addLabel(this, x, groundY + 42, fixture.label, { size: 9 });
    return container;
  }

  #drawBenchReference(x, groundY, fixture) {
    const container = this.add.container(x, groundY).setDepth(resolveGroundDepth(DEPTH_LAYER_IDS.GROUND_SORTED, groundY + fixture.groundContact.y));
    const graphics = this.add.graphics();
    graphics.fillStyle(0x294637, 0.16).fillEllipse(-40, 15, 80, 18);
    graphics.fillStyle(0x986b43, 1).fillRoundedRect(-34, -25, 68, 15, 4).fillRoundedRect(-34, -4, 68, 13, 4);
    graphics.fillStyle(0x765238, 1).fillRect(-29, 7, 7, 18).fillRect(22, 7, 7, 18);
    container.add(graphics);
    this.#drawGeometryGuide(fixture, x, groundY);
    addLabel(this, x, groundY + 42, fixture.label, { size: 9 });
    return container;
  }

  #drawDoorReference(x, groundY, fixture) {
    const graphics = this.add.graphics().setDepth(resolveGroundDepth(DEPTH_LAYER_IDS.GROUND_SORTED, groundY));
    graphics.fillStyle(0x294637, 1).fillRect(x - 19, groundY - 63, 38, 63);
    graphics.fillStyle(0x3e6f76, 1).fillRect(x - 17, groundY - 61, 34, 61);
    graphics.fillStyle(0x8ac5d5, 1).fillRect(x - 9, groundY - 52, 18, 14);
    this.#drawGeometryGuide(fixture, x, groundY);
    addLabel(this, x, groundY + 12, fixture.label, { size: 9 });
  }

  #drawFenceReference(x, groundY, fixture) {
    const graphics = this.add.graphics().setDepth(resolveGroundDepth(DEPTH_LAYER_IDS.GROUND_SORTED, groundY));
    graphics.fillStyle(0xf1e3b5, 1).fillRect(x - 48, groundY - 24, 96, 7).fillRect(x - 48, groundY - 10, 96, 7);
    for (let postX = x - 48; postX <= x + 48; postX += 16) graphics.fillRect(postX - 3, groundY - 32, 6, 32);
    this.#drawGeometryGuide(fixture, x, groundY);
    addLabel(this, x, groundY - 54, fixture.label, { size: 8 });
  }

  #drawGeometryGuide(fixture, x, y) {
    const graphics = this.add.graphics();
    const draw = (geometry, color, alpha = 0.8) => {
      if (!geometry) return;
      graphics.lineStyle(2, color, alpha);
      if (geometry.kind === "circle") graphics.strokeCircle(x + geometry.x, y + geometry.y, geometry.radius);
      else graphics.strokeRect(x + geometry.x, y + geometry.y, geometry.width, geometry.height);
    };
    draw(fixture.visual, COLORS.visual, 0.95);
    draw(fixture.collision, COLORS.collision);
    draw(fixture.navigation, COLORS.navigation, 0.68);
    draw(fixture.interaction, COLORS.interaction, 0.68);
    draw(fixture.touch, COLORS.touch, 0.68);
    graphics.lineStyle(2, COLORS.ground, 1).lineBetween(x - 8, y + fixture.groundContact.y, x + 8, y + fixture.groundContact.y).lineBetween(x, y + fixture.groundContact.y - 8, x, y + fixture.groundContact.y + 8);
    this.geometryGuides.add(graphics);
  }

  #drawViewportFrames() {
    const panel = this.add.graphics().setDepth(900);
    panel.fillStyle(COLORS.panel, 0.96).fillRoundedRect(930, 390, 320, 250, 12);
    panel.lineStyle(3, COLORS.ink, 0.9).strokeRoundedRect(930, 390, 320, 250, 12);
    addLabel(this, 1090, 400, "SUPPORTED VIEWPORT FRAMES", { size: 10 });
    const frameOrigin = { x: 960, y: 438 };
    const maxWidth = 250;
    const maxHeight = 145;
    for (const [index, profile] of SUPPORTED_LANDSCAPE_VIEWPORTS.entries()) {
      const scale = Math.min(maxWidth / profile.width, maxHeight / profile.height);
      const width = profile.width * scale;
      const height = profile.height * scale;
      panel.lineStyle(2, [0xe45756, 0x23b5d3, 0x7b61ff, 0xf2b134, 0x4d9de0][index], 0.8).strokeRect(frameOrigin.x + (maxWidth - width) / 2, frameOrigin.y + (maxHeight - height) / 2, width, height);
    }
    addLabel(this, 1090, 592, "568×320 · 844×390 · 1024×768\n1280×720 · 1366×768", { size: 9 });
    addLabel(this, 1090, 625, `HUD safe ${HUD_SAFE_AREA.canonicalInset} · touch ≥ ${HUD_SAFE_AREA.minimumTouchTargetCssPixels}px`, { size: 9 });
  }

  #createResidents() {
    this.playerShadow = this.add.ellipse(500, 548, RESIDENT_MEASURING_REFERENCE.shadow.width, RESIDENT_MEASURING_REFERENCE.shadow.height, 0x1e3829, 0.26);
    this.player = new PlayerCharacter(this, 500, 530, { direction: "down" });
    this.npc = new NpcCharacter(this, calibrationResident(), { x: 820, y: 530 });
    this.player.setDepth(resolveGroundDepth(DEPTH_LAYER_IDS.GROUND_SORTED, this.player.y));
    this.playerShadow.setDepth(this.player.depth - 0.1);
    this.npc.setDepth(resolveGroundDepth(DEPTH_LAYER_IDS.GROUND_SORTED, this.npc.y));
    this.#drawGeometryGuide(SCALE_CALIBRATION_OBJECTS.player, this.player.x, this.player.y);
    this.#drawGeometryGuide(SCALE_CALIBRATION_OBJECTS.npc, this.npc.x, this.npc.y);
    addLabel(this, 500, 590, SCALE_CALIBRATION_OBJECTS.player.label, { size: 9 });
    addLabel(this, 820, 590, SCALE_CALIBRATION_OBJECTS.npc.label, { size: 9 });
    this.sortStatus = addLabel(this, 500, 648, "", { size: 10 });
  }

  #bindControls() {
    this.cursorKeys = this.input.keyboard.createCursorKeys();
    this.geometryKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.G);
    this.input.on("pointerdown", (pointer) => {
      if (!this.movementBounds.contains(pointer.worldX, pointer.worldY)) return;
      this.player.setPosition(Math.round(pointer.worldX), Math.round(pointer.worldY));
      this.player.setMovement(0, 0, false);
      this.#updateResidentDepths();
    });
  }

  #updateResidentDepths() {
    this.playerShadow.setPosition(this.player.x, this.player.y + RESIDENT_MEASURING_REFERENCE.shadow.offsetY);
    this.player.setDepth(resolveGroundDepth(DEPTH_LAYER_IDS.GROUND_SORTED, this.player.y));
    this.playerShadow.setDepth(this.player.depth - 0.1);
    const binGround = groundContactWorldPosition({ x: this.bin.x, y: this.bin.y }, SCALE_CALIBRATION_OBJECTS.bin.groundContact);
    const relation = compareGroundOrder(this.player.y, binGround.y);
    this.sortStatus.setText(`Player ${relation} bin · player ground ${Math.round(this.player.y)} / bin ground ${Math.round(binGround.y)}`);
    this.#syncRuntimeEvidence(relation, binGround.y);
  }

  #syncRuntimeEvidence(relation = null, binGroundY = null) {
    const gameElement = document.querySelector("#game");
    const binGround = binGroundY ?? groundContactWorldPosition({ x: this.bin.x, y: this.bin.y }, SCALE_CALIBRATION_OBJECTS.bin.groundContact).y;
    const currentRelation = relation || compareGroundOrder(this.player.y, binGround);
    const values = {
      scaleCalibrationReady: "true",
      scaleCanonical: `${CANONICAL_LANDSCAPE.width}x${CANONICAL_LANDSCAPE.height}`,
      scaleGeometryVisible: String(this.geometryVisible),
      scalePlayerGroundY: String(Math.round(this.player.y)),
      scaleBinGroundY: String(Math.round(binGround)),
      scalePlayerDepth: this.player.depth.toFixed(2),
      scaleBinDepth: this.bin.depth.toFixed(2),
      scaleSortRelation: currentRelation,
      scaleTreeNative: `${this.tree.getData("nativeWidth")}x${this.tree.getData("nativeHeight")}`,
      scaleTreeLogical: `${this.tree.getData("logicalDisplayWidth")}x${this.tree.getData("logicalDisplayHeight")}`,
      scaleFiltering: this.game.config.pixelArt && this.game.config.roundPixels ? "nearest-rounded" : "unexpected",
    };
    for (const [key, value] of Object.entries(values)) {
      document.body.dataset[key] = value;
      if (gameElement) gameElement.dataset[key] = value;
    }
  }

  update(_time, delta) {
    const speed = 180 * Math.min(delta, 50) / 1000;
    let dx = 0;
    let dy = 0;
    if (this.cursorKeys.left.isDown) dx -= 1;
    if (this.cursorKeys.right.isDown) dx += 1;
    if (this.cursorKeys.up.isDown) dy -= 1;
    if (this.cursorKeys.down.isDown) dy += 1;
    if (dx || dy) {
      const length = Math.hypot(dx, dy) || 1;
      this.player.x = Phaser.Math.Clamp(this.player.x + dx / length * speed, this.movementBounds.left, this.movementBounds.right);
      this.player.y = Phaser.Math.Clamp(this.player.y + dy / length * speed, this.movementBounds.top, this.movementBounds.bottom);
      this.player.setMovement(dx, dy, true);
      this.#updateResidentDepths();
    } else this.player.setMovement(0, 0, false);
    if (Phaser.Input.Keyboard.JustDown(this.geometryKey)) {
      this.geometryVisible = !this.geometryVisible;
      this.geometryGuides.setVisible(this.geometryVisible);
      this.#syncRuntimeEvidence();
    }
  }
}

if (!ITEM_CATALOG["small-town-bin"]) throw new Error("Scale calibration requires the town-bin pilot definition.");
