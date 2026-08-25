import Phaser from "phaser";
import {
  BRIDGES,
  COLLISION_RECTS,
  COLORS,
  DISTRICTS,
  HOUSES,
  LANDMARKS,
  PATHS,
  PLAYER_START,
  RIVER_PATH,
  ROADS,
  SHOPS,
  WORLD,
} from "../data/town.js";

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
    this.touchDirections = new Set();
    this.buildingCollisions = [];
    this.facing = "down";
  }

  create() {
    this.cameras.main.setBounds(0, 0, WORLD.width, WORLD.height);
    this.drawTown();

    this.shadow = this.add.ellipse(PLAYER_START.x, PLAYER_START.y + 20, 31, 14, 0x24442f, 0.28).setDepth(190);
    this.player = this.add.sprite(PLAYER_START.x, PLAYER_START.y, "player-down").setDepth(200);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      sprint: Phaser.Input.Keyboard.KeyCodes.SHIFT,
    });

    const preferredZoom = window.matchMedia("(max-width: 720px)").matches ? 0.72 : 0.88;
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setZoom(preferredZoom);

    this.input.on("wheel", (_pointer, _objects, _dx, dy) => {
      this.setZoom(this.cameras.main.zoom * (dy > 0 ? 0.9 : 1.1));
    });

    this.bindInterface();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.unbindInterface());
    this.updateStatus("Willow Lane");
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
    const layer = this.add.graphics().setDepth(60 + house.y / 100);
    layer.fillStyle(0x5c864e, 0.5);
    layer.fillRoundedRect(house.x - 36, house.y - 38, house.width + 72, house.height + 78, 18);
    layer.fillStyle(COLORS.wall, 1);
    layer.fillRoundedRect(house.x, house.y + 32, house.width, house.height - 32, 10);
    layer.fillStyle(house.roof, 1);
    layer.fillTriangle(house.x - 12, house.y + 47, house.x + house.width / 2, house.y - 12, house.x + house.width + 12, house.y + 47);
    layer.fillRect(house.x + 13, house.y + 38, house.width - 26, 28);
    layer.fillStyle(0x6f4c35, 1);
    layer.fillRect(house.x + house.width / 2 - 16, house.y + house.height - 54, 32, 54);
    layer.fillStyle(0x8ac5d5, 1);
    layer.fillRect(house.x + 28, house.y + 82, 34, 30);
    layer.fillRect(house.x + house.width - 62, house.y + 82, 34, 30);
    this.buildingCollisions.push({ x: house.x - 8, y: house.y - 15, width: house.width + 16, height: house.height + 18 });
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

  bindInterface() {
    this.controlButtons = [...document.querySelectorAll("[data-move]")];
    this.onControlDown = (event) => {
      event.preventDefault();
      event.currentTarget.setPointerCapture?.(event.pointerId);
      this.touchDirections.add(event.currentTarget.dataset.move);
      event.currentTarget.classList.add("is-active");
    };
    this.onControlUp = (event) => {
      this.touchDirections.delete(event.currentTarget.dataset.move);
      event.currentTarget.classList.remove("is-active");
    };
    this.onControlClick = (event) => {
      const direction = event.currentTarget.dataset.move;
      const vectors = {
        up: [0, -1],
        left: [-1, 0],
        down: [0, 1],
        right: [1, 0],
      };
      const [dx, dy] = vectors[direction] || [0, 0];
      this.movePlayer(dx, dy, 38);
    };
    this.controlButtons.forEach((button) => {
      button.addEventListener("pointerdown", this.onControlDown);
      button.addEventListener("pointerup", this.onControlUp);
      button.addEventListener("pointercancel", this.onControlUp);
      button.addEventListener("lostpointercapture", this.onControlUp);
      button.addEventListener("click", this.onControlClick);
    });

    this.zoomIn = document.querySelector("#zoom-in");
    this.zoomOut = document.querySelector("#zoom-out");
    this.onZoomIn = () => this.setZoom(this.cameras.main.zoom * 1.12);
    this.onZoomOut = () => this.setZoom(this.cameras.main.zoom / 1.12);
    this.zoomIn?.addEventListener("click", this.onZoomIn);
    this.zoomOut?.addEventListener("click", this.onZoomOut);
  }

  unbindInterface() {
    this.controlButtons?.forEach((button) => {
      button.removeEventListener("pointerdown", this.onControlDown);
      button.removeEventListener("pointerup", this.onControlUp);
      button.removeEventListener("pointercancel", this.onControlUp);
      button.removeEventListener("lostpointercapture", this.onControlUp);
      button.removeEventListener("click", this.onControlClick);
    });
    this.zoomIn?.removeEventListener("click", this.onZoomIn);
    this.zoomOut?.removeEventListener("click", this.onZoomOut);
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

  movePlayer(dx, dy, distance) {
    if (!dx && !dy) return false;
    const magnitude = Math.hypot(dx, dy) || 1;
    const stepX = (dx / magnitude) * distance;
    const stepY = (dy / magnitude) * distance;
    const nextX = this.player.x + stepX;
    const nextY = this.player.y + stepY;

    if (!this.isBlocked(nextX, this.player.y)) this.player.x = nextX;
    if (!this.isBlocked(this.player.x, nextY)) this.player.y = nextY;
    return true;
  }

  updateStatus() {
    const status = document.querySelector("#location-status");
    if (!status) return;
    let label = "Willowmere";
    for (const district of DISTRICTS) {
      if (containsWithRadius(district, this.player.x, this.player.y, 0)) label = district.title;
    }
    status.textContent = `${label} · ${Math.round(this.player.x)}, ${Math.round(this.player.y)}`;
  }

  update(_time, delta) {
    let dx = 0;
    let dy = 0;
    if (this.cursors.left.isDown || this.keys.left.isDown || this.touchDirections.has("left")) dx -= 1;
    if (this.cursors.right.isDown || this.keys.right.isDown || this.touchDirections.has("right")) dx += 1;
    if (this.cursors.up.isDown || this.keys.up.isDown || this.touchDirections.has("up")) dy -= 1;
    if (this.cursors.down.isDown || this.keys.down.isDown || this.touchDirections.has("down")) dy += 1;

    const speed = this.keys.sprint.isDown ? SPRINT_SPEED : WALK_SPEED;
    const moving = this.movePlayer(dx, dy, speed * Math.min(delta, 50) / 1000);

    if (moving) {
      const facing = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? "left" : "right") : (dy < 0 ? "up" : "down");
      if (facing !== this.facing) {
        this.facing = facing;
        this.player.setTexture(`player-${facing}`);
      }
      this.player.y += Math.sin(this.time.now / 80) * 0.16;
    }

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
    }
  }

  getMilestoneState() {
    return {
      scene: this.scene.key,
      world: { ...WORLD },
      player: { x: Math.round(this.player.x), y: Math.round(this.player.y), facing: this.facing },
      camera: { zoom: Number(this.cameras.main.zoom.toFixed(2)), followingPlayer: true },
      controls: { keyboard: true, touch: true, wheelZoom: true },
      migratedSystems: [],
    };
  }
}
