import Phaser from "phaser";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  create() {
    const palettes = {
      down: { body: 0xc85e4f, accent: 0xf4d06f },
      up: { body: 0xb84f47, accent: 0xf4d06f },
      left: { body: 0xc85e4f, accent: 0xe9c45e },
      right: { body: 0xc85e4f, accent: 0xe9c45e },
    };

    for (const [direction, palette] of Object.entries(palettes)) {
      const graphics = this.add.graphics();
      graphics.fillStyle(0x513729, 1);
      graphics.fillRoundedRect(7, 1, 22, 18, 7);
      graphics.fillStyle(0xe4ab82, 1);
      graphics.fillRoundedRect(8, 8, 20, 16, 6);
      graphics.fillStyle(palette.body, 1);
      graphics.fillRoundedRect(5, 22, 26, 22, 7);
      graphics.fillStyle(palette.accent, 1);
      graphics.fillRect(7, 26, 22, 5);
      graphics.fillStyle(0x3d5360, 1);
      graphics.fillRect(8, 42, 8, 6);
      graphics.fillRect(20, 42, 8, 6);
      if (direction === "left" || direction === "right") {
        graphics.fillStyle(0x294637, 1);
        graphics.fillCircle(direction === "left" ? 11 : 25, 15, 1.5);
      } else if (direction === "down") {
        graphics.fillStyle(0x294637, 1);
        graphics.fillCircle(14, 15, 1.5);
        graphics.fillCircle(22, 15, 1.5);
      }
      graphics.generateTexture(`player-${direction}`, 36, 48);
      graphics.destroy();
    }

    this.scene.start("TownScene");
  }
}
