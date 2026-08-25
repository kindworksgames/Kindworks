import Phaser from "phaser";
import { PlayerCharacter } from "../entities/PlayerCharacter.js";
import { InteractionSystem } from "../systems/InteractionSystem.js";
import { MovementController } from "../systems/MovementController.js";

const ROOM = Object.freeze({ width: 1280, height: 720 });
const PLAYER_RADIUS = 17;
const WALK_SPEED = 255;
const SPRINT_SPEED = 360;
const PLAYER_START = Object.freeze({ x: 640, y: 610 });
const EXIT = Object.freeze({ x: 640, y: 660, radius: 92 });

function containsWithRadius(rect, x, y, radius = PLAYER_RADIUS) {
  return (
    x + radius > rect.x
    && x - radius < rect.x + rect.width
    && y + radius > rect.y
    && y - radius < rect.y + rect.height
  );
}

export class BakeryScene extends Phaser.Scene {
  constructor() {
    super("BakeryScene");
    this.entryData = {};
    this.transitioning = false;
    this.collisions = [];
  }

  init(data = {}) {
    this.entryData = data;
    this.transitioning = false;
    this.collisions = [];
  }

  create() {
    this.drawInterior();
    this.shadow = this.add.ellipse(PLAYER_START.x, PLAYER_START.y + 18, 31, 12, 0x33271e, 0.24).setDepth(190);
    this.player = new PlayerCharacter(this, PLAYER_START.x, PLAYER_START.y, { direction: "up" }).setDepth(200);
    this.movement = new MovementController(this, {
      onTouchStep: (dx, dy) => this.movePlayer(dx, dy, 34),
    });
    this.interactions = new InteractionSystem({
      interactables: [{
        id: "little-bakery-exit",
        kind: "door",
        x: EXIT.x,
        y: EXIT.y,
        radius: EXIT.radius,
        icon: "🚪",
        label: "Return to Willowmere",
        detail: "Leave through the bakery door",
        onActivate: () => this.returnToTown(),
      }],
      onChange: (interaction) => this.renderInteractionPrompt(interaction),
    });

    this.interactionButton = document.querySelector("#interaction-action");
    this.onInteraction = () => this.interactions.activateCurrent();
    this.interactionButton?.addEventListener("click", this.onInteraction);
    this.setSceneInterface();
    this.cameras.main.fadeIn(220, 58, 35, 25);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.shutdownScene());
    this.updateDomState();
  }

  drawInterior() {
    this.add.rectangle(ROOM.width / 2, ROOM.height / 2, ROOM.width, ROOM.height, 0xead9b8).setDepth(0);
    const graphics = this.add.graphics().setDepth(5);

    graphics.fillStyle(0x8f4f3f, 1);
    graphics.fillRect(0, 0, ROOM.width, 76);
    graphics.fillRect(0, 0, 56, ROOM.height);
    graphics.fillRect(ROOM.width - 56, 0, 56, ROOM.height);
    graphics.fillStyle(0xf1dfbd, 1);
    graphics.fillRect(56, 76, ROOM.width - 112, ROOM.height - 132);

    graphics.fillStyle(0xd2b17b, 1);
    for (let y = 92; y < ROOM.height - 56; y += 32) {
      graphics.fillRect(56, y, ROOM.width - 112, 3);
    }
    graphics.lineStyle(2, 0xb78e5f, 0.38);
    for (let x = 80; x < ROOM.width - 60; x += 80) graphics.lineBetween(x, 76, x, ROOM.height - 56);

    this.drawCounter(graphics, 130, 150, 360, 116, "FRESH BREAD & PASTRIES", 0xc7765b);
    this.drawCounter(graphics, 790, 150, 360, 116, "ORDERS", 0x789c72);
    this.drawCounter(graphics, 120, 375, 300, 100, "MIXING BENCH", 0xb2845a);
    this.drawCounter(graphics, 860, 375, 300, 100, "PREP BENCH", 0xb2845a);

    this.drawOven(graphics, 500, 112);
    this.drawOven(graphics, 640, 112);
    this.drawOven(graphics, 780, 112);

    graphics.fillStyle(0x744f38, 1);
    graphics.fillRect(566, 602, 148, 62);
    graphics.fillStyle(0xd3a66f, 1);
    graphics.fillRect(574, 608, 132, 50);
    graphics.fillStyle(0x9bd0d5, 1);
    graphics.fillRect(594, 614, 92, 25);
    graphics.fillStyle(0xf4d06f, 1);
    graphics.fillCircle(691, 646, 3);

    this.add.text(ROOM.width / 2, 39, "LITTLE BAKERY", {
      color: "#fff3d6",
      fontFamily: "system-ui, sans-serif",
      fontSize: "29px",
      fontStyle: "bold",
      letterSpacing: 3,
      stroke: "#5c3429",
      strokeThickness: 5,
    }).setOrigin(0.5).setDepth(20);

    this.add.text(ROOM.width / 2, 330, "The bakery interior is ready for its future gameplay loop", {
      color: "#694936",
      fontFamily: "system-ui, sans-serif",
      fontSize: "19px",
      fontStyle: "bold",
      backgroundColor: "rgba(255, 247, 226, 0.82)",
      padding: { x: 14, y: 8 },
    }).setOrigin(0.5).setDepth(30);
    this.add.text(ROOM.width / 2, 370, "Economy, recipes, levels and rewards are intentionally not connected yet.", {
      color: "#82644e",
      fontFamily: "system-ui, sans-serif",
      fontSize: "15px",
    }).setOrigin(0.5).setDepth(30);

    this.collisions.push(
      { x: 120, y: 138, width: 380, height: 142 },
      { x: 780, y: 138, width: 380, height: 142 },
      { x: 108, y: 364, width: 324, height: 124 },
      { x: 848, y: 364, width: 324, height: 124 },
      { x: 488, y: 96, width: 432, height: 128 },
    );
  }

  drawCounter(graphics, x, y, width, height, label, accent) {
    graphics.fillStyle(0x5c3e2c, 1);
    graphics.fillRoundedRect(x - 8, y - 8, width + 16, height + 16, 12);
    graphics.fillStyle(0xc89c65, 1);
    graphics.fillRoundedRect(x, y, width, height, 8);
    graphics.fillStyle(accent, 1);
    graphics.fillRect(x + 10, y + 12, width - 20, 15);
    graphics.fillStyle(0xf4e2b8, 1);
    graphics.fillRect(x + 18, y + 39, width - 36, height - 54);
    this.add.text(x + width / 2, y + 19, label, {
      color: "#fff9df",
      fontFamily: "system-ui, sans-serif",
      fontSize: "13px",
      fontStyle: "bold",
      letterSpacing: 1,
    }).setOrigin(0.5).setDepth(15);
  }

  drawOven(graphics, x, y) {
    graphics.fillStyle(0x4f4944, 1);
    graphics.fillRoundedRect(x, y, 112, 100, 9);
    graphics.fillStyle(0x262d2d, 1);
    graphics.fillRoundedRect(x + 13, y + 30, 86, 54, 6);
    graphics.fillStyle(0xd27948, 0.7);
    graphics.fillRoundedRect(x + 20, y + 38, 72, 39, 4);
    graphics.fillStyle(0xd9d0bc, 1);
    graphics.fillCircle(x + 25, y + 17, 5);
    graphics.fillCircle(x + 48, y + 17, 5);
  }

  setSceneInterface() {
    document.body.dataset.gameScene = this.scene.key;
    const badge = document.querySelector(".milestone-badge");
    const status = document.querySelector("#location-status");
    const hint = document.querySelector("#control-hint");
    if (badge) badge.textContent = "LITTLE BAKERY · INTERIOR SHELL";
    if (status) status.textContent = "Inside Little Bakery";
    if (hint) hint.textContent = "Walk with arrows or WASD · E or Space to leave";
  }

  renderInteractionPrompt(interaction) {
    const prompt = document.querySelector("#interaction-prompt");
    const button = document.querySelector("#interaction-action");
    const detail = document.querySelector("#interaction-detail");
    if (!prompt || !button) return;
    prompt.classList.toggle("hidden", !interaction);
    prompt.setAttribute("aria-hidden", interaction ? "false" : "true");
    if (interaction) {
      button.textContent = `${interaction.icon || "✨"} ${interaction.label}`;
      if (detail) detail.textContent = interaction.detail || "Press E or Space";
    }
  }

  isBlocked(x, y) {
    const edgeX = 78;
    const top = 98;
    const bottom = 676;
    if (x < edgeX || x > ROOM.width - edgeX || y < top || y > bottom) return true;
    return this.collisions.some((rect) => containsWithRadius(rect, x, y));
  }

  movePlayer(dx, dy, distance) {
    if (!dx && !dy) return false;
    const startX = this.player.x;
    const startY = this.player.y;
    const magnitude = Math.hypot(dx, dy) || 1;
    const stepX = (dx / magnitude) * distance;
    const stepY = (dy / magnitude) * distance;
    const nextX = this.player.x + stepX;
    const nextY = this.player.y + stepY;
    if (!this.isBlocked(nextX, this.player.y)) this.player.x = nextX;
    if (!this.isBlocked(this.player.x, nextY)) this.player.y = nextY;
    return Math.hypot(this.player.x - startX, this.player.y - startY) > 0.01;
  }

  returnToTown() {
    if (this.transitioning) return { ok: false, reason: "A scene transition is already running." };
    this.transitioning = true;
    this.movement.setEnabled(false);
    this.interactions.setEnabled(false);
    this.player.setMovement(0, 0, false);
    document.querySelector("#game")?.setAttribute("data-transition", "leaving-bakery");
    this.cameras.main.fadeOut(220, 58, 35, 25);
    this.time.delayedCall(240, () => {
      this.scene.start("TownScene", {
        returnPosition: this.entryData.returnPosition,
        returnFacing: this.entryData.returnFacing || "down",
        transitionCount: Number(this.entryData.transitionCount || 0) + 1,
      });
    });
    return { ok: true, targetScene: "TownScene" };
  }

  shutdownScene() {
    this.movement?.destroy();
    this.interactionButton?.removeEventListener("click", this.onInteraction);
    this.renderInteractionPrompt(null);
  }

  updateDomState() {
    const gameElement = document.querySelector("#game");
    if (!gameElement) return;
    gameElement.dataset.scene = this.scene.key;
    gameElement.dataset.playerX = Math.round(this.player.x);
    gameElement.dataset.playerY = Math.round(this.player.y);
    gameElement.dataset.cameraZoom = this.cameras.main.zoom.toFixed(2);
    gameElement.dataset.animation = this.player.getAnimationState();
    gameElement.dataset.interaction = this.interactions.getState()?.id || "none";
    gameElement.dataset.transitionCount = String(Number(this.entryData.transitionCount || 0));
    gameElement.dataset.transition = this.transitioning ? "active" : "idle";
  }

  update(_time, delta) {
    const { dx, dy, sprinting } = this.movement.getVector();
    const speed = sprinting ? SPRINT_SPEED : WALK_SPEED;
    const moving = this.movePlayer(dx, dy, speed * Math.min(delta, 50) / 1000);
    this.player.setMovement(dx, dy, moving);
    this.interactions.update(this.player.x, this.player.y);
    if (this.movement.consumeInteractPress()) this.interactions.activateCurrent();
    this.shadow.setPosition(this.player.x, this.player.y + 18);
    this.player.setDepth(200 + this.player.y / 10);
    this.shadow.setDepth(190 + this.player.y / 10);
    this.updateDomState();
  }

  getMilestoneState() {
    return {
      scene: this.scene.key,
      player: {
        x: Math.round(this.player.x),
        y: Math.round(this.player.y),
        facing: this.player.direction,
        animation: this.player.getAnimationState(),
      },
      interaction: this.interactions.getState(),
      returnPosition: this.entryData.returnPosition,
      transitionCount: Number(this.entryData.transitionCount || 0),
      gameplayConnected: false,
    };
  }
}
