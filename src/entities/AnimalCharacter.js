import Phaser from "phaser";
import { speciesFor } from "../data/animals.js";

export class AnimalCharacter extends Phaser.GameObjects.Container {
  constructor(scene, definition) {
    super(scene, definition.route[0].x, definition.route[0].y);
    this.animalId = definition.id;
    this.phase = definition.initialTrust * 0.37;
    this.hovered = false;
    this.shadow = scene.add.ellipse(0, 14, 31, 11, 0x173425, 0.24);
    this.body = scene.add.ellipse(0, 0, 35, 29, definition.color).setStrokeStyle(2, 0x294637, 0.5);
    this.icon = scene.add.text(0, -6, speciesFor(definition).icon, { fontFamily: "Apple Color Emoji, system-ui", fontSize: "29px" }).setOrigin(0.5);
    this.heart = scene.add.text(17, -25, "💚", { fontFamily: "Apple Color Emoji, system-ui", fontSize: "13px" }).setOrigin(0.5).setVisible(false);
    this.label = scene.add.text(0, -37, definition.name, {
      color: "#294637",
      fontFamily: "system-ui, sans-serif",
      fontSize: "11px",
      fontStyle: "bold",
      backgroundColor: "rgba(255, 253, 241, 0.94)",
      padding: { x: 6, y: 3 },
    }).setOrigin(0.5, 1).setVisible(false);
    this.add([this.shadow, this.body, this.icon, this.heart, this.label]);
    this.setSize(52, 54).setInteractive({ useHandCursor: true });
    this.on("pointerover", () => { this.hovered = true; this.label.setVisible(true); });
    this.on("pointerout", () => { this.hovered = false; });
    scene.add.existing(this);
  }

  applyPresentation(presentation, deltaMilliseconds, playerPosition) {
    if (!presentation?.visible) {
      this.setVisible(false);
      return;
    }
    this.setVisible(true);
    const following = presentation.location === "following";
    const target = following
      ? { x: playerPosition.x - 45, y: playerPosition.y + 42 }
      : presentation.position;
    const distance = Math.hypot(target.x - this.x, target.y - this.y);
    if (distance > 520) this.setPosition(target.x, target.y);
    else {
      const amount = following ? Math.min(1, Math.max(0.08, deltaMilliseconds / 220)) : Math.min(1, deltaMilliseconds / 420);
      this.x = Phaser.Math.Linear(this.x, target.x, amount);
      this.y = Phaser.Math.Linear(this.y, target.y, amount);
    }
    this.phase += Math.min(50, Math.max(0, deltaMilliseconds)) * (following ? 0.011 : 0.006);
    const bob = Math.sin(this.phase) * (following ? 2.8 : 1.5);
    this.icon.y = -6 + bob;
    this.body.y = bob * 0.35;
    this.heart.setVisible(presentation.state.adopted);
    this.label.setText(`${presentation.state.name}\n${presentation.state.trust}% trust`);
    this.label.setVisible(this.hovered || (!following && Math.hypot(this.x - playerPosition.x, this.y - playerPosition.y) < 100));
    this.setDepth(180 + this.y / 10);
  }

  destroy(fromScene) {
    this.removeAllListeners();
    super.destroy(fromScene);
  }
}
