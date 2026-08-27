import Phaser from "phaser";
import { setSpriteAiLabelHint } from "../plugins/SpriteAiLabelPlugin.js";
import { spriteAiInventory } from "../assets/spriteAiLabels.js";

const DIRECTIONS = ["down", "left", "right", "up"];
const WALK_FRAMES = 4;

function drawResidentFrame(graphics, direction, frame) {
  const stride = [0, -3, 0, 3][frame];
  const bob = frame % 2 === 1 ? 1 : 0;
  const sideFacing = direction === "left" || direction === "right";
  const facingSign = direction === "left" ? -1 : 1;

  graphics.clear();
  graphics.fillStyle(0x263f31, 0.22);
  graphics.fillEllipse(6, 47, 30, 9);

  graphics.lineStyle(6, 0x3d5360, 1);
  if (sideFacing) {
    graphics.lineBetween(17, 35 + bob, 14 - stride * 0.45, 48);
    graphics.lineBetween(22, 35 + bob, 25 + stride * 0.45, 48);
  } else {
    graphics.lineBetween(16, 35 + bob, 14 - stride, 48);
    graphics.lineBetween(24, 35 + bob, 26 + stride, 48);
  }

  graphics.fillStyle(0xc85e4f, 1);
  graphics.fillRoundedRect(8, 20 + bob, 24, 22, 7);
  graphics.lineStyle(2, 0x8d403a, 0.55);
  graphics.strokeRoundedRect(8, 20 + bob, 24, 22, 7);
  graphics.fillStyle(0xf4d06f, 1);
  graphics.fillRect(10, 27 + bob, 20, 5);

  graphics.lineStyle(5, 0xe4ab82, 1);
  if (sideFacing) {
    graphics.lineBetween(10, 26 + bob, 7 - stride * 0.25, 36);
    graphics.lineBetween(30, 26 + bob, 33 + stride * 0.25, 36);
  } else {
    graphics.lineBetween(10, 26 + bob, 7 + stride * 0.25, 36);
    graphics.lineBetween(30, 26 + bob, 33 - stride * 0.25, 36);
  }

  graphics.fillStyle(0xe4ab82, 1);
  graphics.fillCircle(20, 15 + bob, 10);
  graphics.fillStyle(0x513729, 1);
  if (direction === "up") {
    graphics.fillCircle(20, 13 + bob, 10.5);
    graphics.fillStyle(0xe4ab82, 1);
    graphics.fillRoundedRect(12, 15 + bob, 16, 8, 4);
  } else {
    graphics.fillRoundedRect(10, 4 + bob, 20, 12, 7);
    graphics.fillCircle(12, 13 + bob, 3.5);
    graphics.fillCircle(28, 13 + bob, 3.5);
  }

  if (direction !== "up") {
    graphics.fillStyle(0x294637, 1);
    if (sideFacing) {
      graphics.fillCircle(20 + facingSign * 4, 15 + bob, 1.4);
      graphics.lineStyle(1.2, 0x7b4e43, 1);
      graphics.lineBetween(20 + facingSign * 4, 19 + bob, 20 + facingSign * 7, 19 + bob);
    } else {
      graphics.fillCircle(16, 15 + bob, 1.3);
      graphics.fillCircle(24, 15 + bob, 1.3);
      graphics.lineStyle(1.2, 0x7b4e43, 1);
      graphics.beginPath();
      graphics.arc(20, 18 + bob, 3, 0.2, Math.PI - 0.2);
      graphics.strokePath();
    }
  }
}

export function createPlayerAssets(scene) {
  const graphics = scene.add.graphics();

  for (const direction of DIRECTIONS) {
    for (let frame = 0; frame < WALK_FRAMES; frame += 1) {
      const key = `resident-${direction}-${frame}`;
      spriteAiInventory.register({
        id: `texture.player.${direction}.${frame}`,
        label: `Player character — ${direction} walk frame ${frame + 1}`,
        kind: "character-frame",
        source: "generated-texture",
        scene: "BootScene",
        replacement: "sprite-ai",
      });
      if (scene.textures.exists(key)) continue;
      drawResidentFrame(graphics, direction, frame);
      graphics.generateTexture(key, 40, 54);
    }
  }
  graphics.destroy();

  for (const direction of DIRECTIONS) {
    const key = `resident-walk-${direction}`;
    if (scene.anims.exists(key)) continue;
    scene.anims.create({
      key,
      frames: Array.from({ length: WALK_FRAMES }, (_, frame) => ({
        key: `resident-${direction}-${frame}`,
      })),
      frameRate: 9,
      repeat: -1,
    });
  }
}

export class PlayerCharacter extends Phaser.GameObjects.Sprite {
  constructor(scene, x, y, { direction = "down" } = {}) {
    super(scene, x, y, `resident-${direction}-0`);
    setSpriteAiLabelHint(this, { id: "character.player.main", label: "Player character — all walk and idle directions", kind: "character-sprite" });
    scene.add.existing(this);
    this.direction = direction;
    this.moving = false;
    this.setOrigin(0.5, 0.88);
  }

  setMovement(dx, dy, moving) {
    if (moving) {
      const nextDirection = Math.abs(dx) > Math.abs(dy)
        ? (dx < 0 ? "left" : "right")
        : (dy < 0 ? "up" : "down");
      this.direction = nextDirection;
      this.moving = true;
      this.play(`resident-walk-${nextDirection}`, true);
      return;
    }

    if (this.moving || this.anims.isPlaying) {
      this.stop();
      this.setTexture(`resident-${this.direction}-0`);
    }
    this.moving = false;
  }

  getAnimationState() {
    return this.moving ? `walk-${this.direction}` : `idle-${this.direction}`;
  }
}
