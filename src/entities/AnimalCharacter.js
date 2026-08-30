import Phaser from "phaser";
import { ANIMAL_RELOCATION_CONFIG, WILDLIFE_ROTATION, animalReferenceFrame, speciesFor } from "../data/animals.js";
import { ANIMAL_ANATOMY_VISUALS } from "../data/legacyVisualStates.js";
import { setSpriteAiLabelHint } from "../plugins/SpriteAiLabelPlugin.js";
import { VISUAL_ASSET_IDS } from "../visual/visualManifest.js";
import { resolveTownSceneDepth, TOWN_DEPTH_POLICY_IDS } from "../visual/layouts/sceneLayoutCatalog.js";

export class AnimalCharacter extends Phaser.GameObjects.Container {
  constructor(scene, definition) {
    super(scene, definition.route[0].x, definition.route[0].y);
    this.animalId = definition.id;
    setSpriteAiLabelHint(this, { id: `character.animal.${definition.id}`, label: `${definition.name} — ${speciesFor(definition).label}`, kind: "animal-sprite" });
    this.definition = definition;
    this.phase = definition.initialTrust * 0.37;
    this.hovered = false;
    this.presentationAlpha = 0;
    this.relocationAlpha = 1;
    this.relocation = null;
    this.lastPresentationVisible = false;
    this.ripple = scene.add.ellipse(0, 13, 43, 13, 0x9ad7df, 0.2).setStrokeStyle(1, 0xffffff, 0.42).setVisible(false);
    this.shadow = scene.add.ellipse(0, 14, 31, 11, 0x173425, 0.24);
    this.body = scene.add.ellipse(0, 0, 35, 29, definition.color).setStrokeStyle(2, 0x294637, 0.5);
    this.accent = scene.add.ellipse(8, 2, 10, 8, definition.accent, 0.9);
    this.anatomy = scene.add.graphics();
    this.drawAnatomy();
    const referenceFrame = animalReferenceFrame(definition);
    const referenceTextureKey = scene.registry.get("visualRegistry").getTextureKey(VISUAL_ASSET_IDS.ANIMAL_REFERENCE_SHEET);
    this.referenceSprite = referenceFrame === null || !scene.textures.exists(referenceTextureKey)
      ? null
      : scene.add.image(0, 15, referenceTextureKey, referenceFrame).setOrigin(0.5, 1);
    if (this.referenceSprite) {
      this.body.setVisible(false);
      this.accent.setVisible(false);
      this.anatomy.setVisible(false);
      setSpriteAiLabelHint(this.referenceSprite, { id: `character.animal.reference.${definition.id}`, label: `${definition.name} exact legacy v44 reference sprite`, kind: "animal-reference-sprite" });
    }
    this.heart = scene.add.text(17, -25, "💚", { fontFamily: "Apple Color Emoji, system-ui", fontSize: "13px" }).setOrigin(0.5).setVisible(false);
    this.label = scene.add.text(0, -37, definition.name, {
      color: "#294637",
      fontFamily: "system-ui, sans-serif",
      fontSize: "11px",
      fontStyle: "bold",
      backgroundColor: "rgba(255, 253, 241, 0.94)",
      padding: { x: 6, y: 3 },
    }).setOrigin(0.5, 1).setVisible(false);
    this.add([this.ripple, this.shadow, this.body, this.accent, this.anatomy, this.referenceSprite, this.heart, this.label].filter(Boolean));
    this.setVisible(false);
    this.setSize(52, 54).setInteractive({ useHandCursor: true });
    this.on("pointerover", () => { this.hovered = true; this.label.setVisible(true); });
    this.on("pointerout", () => { this.hovered = false; });
    scene.add.existing(this);
  }

  applyPresentation(presentation, deltaMilliseconds, playerPosition) {
    const delta = Math.min(50, Math.max(0, Number(deltaMilliseconds) || 0));
    if (!presentation?.visible) {
      if (!this.lastPresentationVisible && this.presentationAlpha <= 0) {
        this.setVisible(false);
        return;
      }
      this.presentationAlpha = Math.max(0, this.presentationAlpha - delta / (WILDLIFE_ROTATION.transitionSeconds * 1000));
      this.setAlpha(this.presentationAlpha * this.relocationAlpha);
      if (this.presentationAlpha <= 0) {
        this.setVisible(false);
        this.lastPresentationVisible = false;
      }
      return;
    }
    if (!this.lastPresentationVisible) this.presentationAlpha = 0;
    this.lastPresentationVisible = true;
    this.setVisible(true);
    this.presentationAlpha = Math.min(1, this.presentationAlpha + delta / (WILDLIFE_ROTATION.transitionSeconds * 1000));
    const following = presentation.location === "following";
    const target = following
      ? { x: playerPosition.x - 45, y: playerPosition.y + 42 }
      : presentation.position;
    if (!target) {
      this.setVisible(false);
      return;
    }
    const distance = Math.hypot(target.x - this.x, target.y - this.y);
    if (!this.relocation && distance > ANIMAL_RELOCATION_CONFIG.triggerDistance) this.relocation = { stage: "fade-out", elapsed: 0, target: { ...target } };
    if (this.relocation) {
      this.relocation.target = { ...target };
      this.relocation.elapsed += delta / 1000;
      if (this.relocation.stage === "fade-out") {
        this.relocationAlpha = Math.max(0, 1 - this.relocation.elapsed / ANIMAL_RELOCATION_CONFIG.fadeOutSeconds);
        if (this.relocation.elapsed >= ANIMAL_RELOCATION_CONFIG.fadeOutSeconds) {
          this.setPosition(this.relocation.target.x, this.relocation.target.y);
          this.relocation.stage = "fade-in";
          this.relocation.elapsed = 0;
          this.relocationAlpha = 0;
        }
      } else {
        this.setPosition(this.relocation.target.x, this.relocation.target.y);
        this.relocationAlpha = Math.min(1, this.relocation.elapsed / ANIMAL_RELOCATION_CONFIG.fadeInSeconds);
        if (this.relocation.elapsed >= ANIMAL_RELOCATION_CONFIG.fadeInSeconds) {
          this.relocation = null;
          this.relocationAlpha = 1;
        }
      }
    } else {
      this.relocationAlpha = 1;
      const amount = following ? Math.min(1, Math.max(0.08, delta / 220)) : Math.min(1, delta / 420);
      this.x = Phaser.Math.Linear(this.x, target.x, amount);
      this.y = Phaser.Math.Linear(this.y, target.y, amount);
    }
    const animation = presentation.animation || { family: "small-mammal", size: 1, motion: "walk", cadence: 1, facing: "right", elevation: 0, water: false, aerial: false };
    this.phase += delta * 0.006 * animation.cadence * (following ? 1.35 : 1);
    const hop = ["hop","bound","scurry"].includes(animation.motion) ? Math.abs(Math.sin(this.phase)) * 4.2 : 0;
    const bob = Math.sin(this.phase) * (animation.water ? 1.2 : following ? 2.8 : 1.5) - hop;
    const visualY = -animation.elevation + bob;
    const size = Phaser.Math.Clamp(animation.size, .62, 1.55);
    if (this.referenceSprite) {
      const targetPixels = animation.size >= 1.2 ? 68 : animation.size <= .75 ? 46 : 58;
      const spriteScale = targetPixels / 64;
      this.referenceSprite.setPosition(0, 16 + visualY).setScale((animation.facing === "left" ? -1 : 1) * spriteScale, spriteScale);
      this.heart.setPosition(targetPixels * .28, -targetPixels * .72 + visualY);
      this.label.y = -targetPixels * .79 + visualY;
    } else {
      this.body.setScale((animation.facing === "left" ? -1 : 1) * size,size);
      this.body.y = visualY * .35;
      this.accent.setPosition((animation.facing === "left" ? -8 : 8) * size,2 + visualY * .35).setScale(size);
      this.anatomy.setPosition(0, visualY * .35).setScale((animation.facing === "left" ? -1 : 1) * size, size);
    }
    this.shadow.setPosition(0,14).setScale(Math.max(.55,size - animation.elevation / 100),Math.max(.45,size - animation.elevation / 130)).setAlpha(animation.aerial ? .12 : .24);
    this.ripple.setVisible(animation.water).setScale(size * (1 + Math.sin(this.phase) * .08),size).setAlpha(.14 + (Math.sin(this.phase) + 1) * .05);
    this.heart.setVisible(presentation.state.adopted);
    const labelText = `${presentation.state.name}\n${presentation.state.trust}% trust`;
    if (this.label.text !== labelText) this.label.setText(labelText);
    this.label.setVisible(this.hovered || (!following && Math.hypot(this.x - playerPosition.x, this.y - playerPosition.y) < 100));
    this.setAlpha(this.presentationAlpha * this.relocationAlpha);
    this.setDepth(following ? resolveTownSceneDepth(TOWN_DEPTH_POLICY_IDS.ANIMAL_FOLLOWER, this.y) : presentation.depth);
  }

  drawAnatomy() {
    const species = speciesFor(this.definition);
    const anatomy = ANIMAL_ANATOMY_VISUALS[species?.family] || ANIMAL_ANATOMY_VISUALS["small-mammal"];
    setSpriteAiLabelHint(this.anatomy, { id: anatomy.assetId, label: `${species?.label || "Animal"} anatomy overlay`, kind: "animal-anatomy" });
    const body = this.definition.color;
    const accent = this.definition.accent;
    const ink = 0x294637;
    this.anatomy.clear().fillStyle(body, 1).lineStyle(2, ink, 0.62);
    const limbed = !["fish", "flutter", "snail"].includes(species?.family);
    if (limbed) {
      const stride = ["hopper", "frog"].includes(species?.family) ? 7 : 2;
      this.anatomy.fillRoundedRect(-11 - stride, 7, 6, 13, 2).fillRoundedRect(7 + stride, 7, 6, 13, 2);
      this.anatomy.fillStyle(ink, 0.75).fillRect(-14 - stride, 18, 10, 3).fillRect(6 + stride, 18, 10, 3).fillStyle(body, 1);
    }
    this.anatomy.fillCircle(12, -10, species?.sizeClass === "large" ? 13 : 11);
    if (["triangle", "point", "upright"].includes(anatomy.ears)) {
      this.anatomy.fillTriangle(-11, -10, -7, -24, -2, -10);
      this.anatomy.fillTriangle(7, -15, 12, -29, 17, -15);
    } else if (anatomy.ears === "long") {
      this.anatomy.fillEllipse(6, -27, 7, 28);
      this.anatomy.fillEllipse(16, -27, 7, 28);
    } else if (anatomy.ears === "round") {
      this.anatomy.fillCircle(5, -19, 5).fillCircle(18, -19, 5);
    }
    if (anatomy.beak) this.anatomy.fillStyle(accent, 1).fillTriangle(20, -12, 32, -8, 20, -4);
    if (anatomy.wings) this.anatomy.fillStyle(accent, 0.9).fillEllipse(-5, 1, 21, 14);
    if (anatomy.shell) this.anatomy.fillStyle(accent, 0.9).fillEllipse(-3, 0, 29, 24).lineStyle(1, ink, 0.45).strokeEllipse(-3, 0, 24, 19);
    if (anatomy.fins) this.anatomy.fillStyle(accent, 1).fillTriangle(0, -8, 8, -19, 13, -7).fillTriangle(0, 7, 7, 18, 12, 7);
    if (anatomy.tail === "puff") this.anatomy.fillStyle(accent, 1).fillCircle(-19, 3, 7);
    else if (anatomy.tail === "fan" || anatomy.tail === "fin") this.anatomy.fillStyle(accent, 1).fillTriangle(-15, -3, -31, -13, -29, 11);
    else if (anatomy.tail === "paddle") this.anatomy.fillStyle(accent, 1).fillEllipse(-28, 5, 19, 9);
    else if (anatomy.tail) this.anatomy.lineStyle(5, body, 1).beginPath().moveTo(-15, 4).lineTo(-27, 1).lineTo(-31, -7).strokePath();
    if (anatomy.mane) this.anatomy.fillStyle(accent, 0.9).fillTriangle(2, -18, -2, 5, 9, -9);
    if (anatomy.frill) this.anatomy.fillStyle(accent, 0.92).fillTriangle(0, -19, -7, -5, 4, 0).fillTriangle(4, -23, 3, -4, 13, -10);
    if (anatomy.horns) this.anatomy.fillStyle(0xefe2bd, 1).fillTriangle(8, -18, 10, -31, 14, -18).fillTriangle(17, -17, 24, -27, 22, -13).fillTriangle(20, -8, 31, -8, 21, -3);
    if (anatomy.antennae) {
      this.anatomy.lineStyle(2, ink, 0.8).lineBetween(8, -17, 3, -29).lineBetween(15, -17, 21, -29).fillStyle(ink, 1).fillCircle(3, -29, 2).fillCircle(21, -29, 2);
    }
    if (anatomy.muzzle && !anatomy.beak) this.anatomy.fillStyle(accent, 1).fillEllipse(19, -6, anatomy.muzzle === "long" ? 15 : 11, 8);
    this.anatomy.fillStyle(0xffffff, 0.95).fillCircle(15, -12, 3).fillStyle(ink, 1).fillCircle(16, -12, 1.5);
    if (!anatomy.beak) this.anatomy.fillCircle(anatomy.muzzle === "long" ? 26 : 22, -7, 2);
  }

  destroy(fromScene) {
    this.removeAllListeners();
    super.destroy(fromScene);
  }
}
