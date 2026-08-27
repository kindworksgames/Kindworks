import Phaser from "phaser";
import { speciesFor } from "../data/animals.js";
import { setSpriteAiLabelHint } from "../plugins/SpriteAiLabelPlugin.js";

export class AnimalCharacter extends Phaser.GameObjects.Container {
  constructor(scene, definition) {
    super(scene, definition.route[0].x, definition.route[0].y);
    this.animalId = definition.id;
    setSpriteAiLabelHint(this, { id: `character.animal.${definition.id}`, label: `${definition.name} — ${speciesFor(definition).label}`, kind: "animal-sprite" });
    this.definition = definition;
    this.phase = definition.initialTrust * 0.37;
    this.hovered = false;
    this.ripple = scene.add.ellipse(0, 13, 43, 13, 0x9ad7df, 0.2).setStrokeStyle(1, 0xffffff, 0.42).setVisible(false);
    this.shadow = scene.add.ellipse(0, 14, 31, 11, 0x173425, 0.24);
    this.body = scene.add.ellipse(0, 0, 35, 29, definition.color).setStrokeStyle(2, 0x294637, 0.5);
    this.accent = scene.add.ellipse(8, 2, 10, 8, definition.accent, 0.9);
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
    this.add([this.ripple, this.shadow, this.body, this.accent, this.icon, this.heart, this.label]);
    this.setVisible(false);
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
    if (!target) {
      this.setVisible(false);
      return;
    }
    const distance = Math.hypot(target.x - this.x, target.y - this.y);
    if (distance > 520) this.setPosition(target.x, target.y);
    else {
      const amount = following ? Math.min(1, Math.max(0.08, deltaMilliseconds / 220)) : Math.min(1, deltaMilliseconds / 420);
      this.x = Phaser.Math.Linear(this.x, target.x, amount);
      this.y = Phaser.Math.Linear(this.y, target.y, amount);
    }
    const animation = presentation.animation || { family: "small-mammal", size: 1, motion: "walk", cadence: 1, facing: "right", elevation: 0, water: false, aerial: false };
    this.phase += Math.min(50, Math.max(0, deltaMilliseconds)) * 0.006 * animation.cadence * (following ? 1.35 : 1);
    const hop = ["hop","bound","scurry"].includes(animation.motion) ? Math.abs(Math.sin(this.phase)) * 4.2 : 0;
    const bob = Math.sin(this.phase) * (animation.water ? 1.2 : following ? 2.8 : 1.5) - hop;
    const visualY = -animation.elevation + bob;
    const size = Phaser.Math.Clamp(animation.size, .62, 1.55);
    this.body.setScale((animation.facing === "left" ? -1 : 1) * size,size);
    this.body.y = visualY * .35;
    this.accent.setPosition((animation.facing === "left" ? -8 : 8) * size,2 + visualY * .35).setScale(size);
    this.icon.setPosition(0,-6 + visualY).setScale(size);
    this.icon.angle = animation.aerial ? Math.sin(this.phase * 1.8) * 5 : animation.motion === "waddle" ? Math.sin(this.phase) * 3 : 0;
    this.shadow.setPosition(0,14).setScale(Math.max(.55,size - animation.elevation / 100),Math.max(.45,size - animation.elevation / 130)).setAlpha(animation.aerial ? .12 : .24);
    this.ripple.setVisible(animation.water).setScale(size * (1 + Math.sin(this.phase) * .08),size).setAlpha(.14 + (Math.sin(this.phase) + 1) * .05);
    this.heart.setVisible(presentation.state.adopted);
    this.label.setText(`${presentation.state.name}\n${presentation.state.trust}% trust`);
    this.label.setVisible(this.hovered || (!following && Math.hypot(this.x - playerPosition.x, this.y - playerPosition.y) < 100));
    this.setDepth(following ? 300 + this.y / 10 : presentation.depth);
  }

  destroy(fromScene) {
    this.removeAllListeners();
    super.destroy(fromScene);
  }
}
