import Phaser from "phaser";
import { setSpriteAiLabelHint } from "../plugins/SpriteAiLabelPlugin.js";

export class NpcCharacter extends Phaser.GameObjects.Container {
  constructor(scene, resident) {
    super(scene, resident.x, resident.y);
    this.residentId = resident.id;
    setSpriteAiLabelHint(this, { id: `character.npc.${resident.id}`, label: `${resident.name} — ${resident.role}`, kind: "character-sprite" });
    this.walkPhase = (Number(resident.id.slice(-2)) || 1) * 0.73;
    this.hovered = false;
    this.controlMoving = false;

    this.shadow = scene.add.ellipse(0, 19, 29, 11, 0x1e3829, 0.26);
    this.leftLeg = scene.add.rectangle(-6, 13, 8, 15, resident.palette.pants);
    this.rightLeg = scene.add.rectangle(6, 13, 8, 15, resident.palette.pants);
    this.body = scene.add.rectangle(0, -1, 25, 27, resident.palette.shirt).setStrokeStyle(2, 0x294637, 0.55);
    this.head = scene.add.circle(0, -22, 13, resident.palette.skin).setStrokeStyle(2, 0x294637, 0.55);
    this.hair = scene.add.graphics();
    this.accessory = scene.add.text(0, -29, "", { fontFamily: "system-ui", fontSize: "14px" }).setOrigin(0.5);
    this.face = scene.add.text(0, -21, "•‿•", { color: "#3d3028", fontFamily: "system-ui", fontSize: "7px", fontStyle: "bold" }).setOrigin(0.5);
    this.carry = scene.add.text(17, 4, "", { fontFamily: "system-ui", fontSize: "15px" }).setOrigin(0.5);
    this.reaction = scene.add.text(0, -58, "", { fontFamily: "system-ui", fontSize: "18px", backgroundColor: "rgba(255,253,241,.9)", padding: { x: 3, y: 2 } }).setOrigin(0.5, 1);
    this.label = scene.add.text(0, -49, `${resident.name}\n${resident.role}`, {
      align: "center",
      color: "#294637",
      fontFamily: "system-ui, sans-serif",
      fontSize: "10px",
      fontStyle: "bold",
      backgroundColor: "rgba(255, 253, 241, 0.94)",
      padding: { x: 6, y: 3 },
    }).setOrigin(0.5, 1).setVisible(false);

    this.add([this.shadow, this.leftLeg, this.rightLeg, this.body, this.head, this.hair, this.face, this.accessory, this.carry, this.reaction, this.label]);
    this.setSize(42, 66).setInteractive({ useHandCursor: true });
    this.on("pointerover", () => { this.hovered = true; this.label.setVisible(true); });
    this.on("pointerout", () => { this.hovered = false; this.label.setVisible(false); });
    scene.add.existing(this);
    this.applyResident(resident, 0, false);
  }

  applyResident(resident, deltaMilliseconds, playerNearby) {
    this.setPosition(resident.x, resident.y);
    this.setVisible(resident.visible);
    this.setDepth(185 + resident.y / 10);
    this.label.setVisible(resident.visible && (this.hovered || playerNearby));
    this.drawAppearance(resident);
    const walking = resident.phase === "commuting" || (resident.phase === "controlled" && this.controlMoving);
    if (walking) this.walkPhase += Math.min(50, Math.max(0, deltaMilliseconds)) * 0.012;
    const step = walking ? Math.sin(this.walkPhase) * 3 : 0;
    this.leftLeg.y = 13 + step;
    this.rightLeg.y = 13 - step;
    this.body.y = walking ? -1 + Math.abs(Math.sin(this.walkPhase)) * -1.4 : -1;
    this.scaleX = resident.facingX < -0.15 ? -1 : 1;
    this.label.scaleX = this.scaleX;
    this.accessory.scaleX = this.scaleX;
    this.carry.scaleX = this.scaleX;
    const carryIcons = { cup: "🥤", wrapper: "🍬", bottle: "🧴", bag: "🛍️", paper: "📰" };
    this.carry.setText(resident.carryItem ? carryIcons[resident.carryItem] || "📦" : "");
    this.reaction.setText(resident.greetingIcon || (resident.actionState === "HELPING" ? resident.reactionIcon : ""));
    this.reaction.setVisible(resident.visible && Boolean(this.reaction.text));
    this.label.setText(`${resident.name}\n${resident.activity || resident.role}`);
  }

  drawAppearance(resident) {
    const bodyScale = Number(resident.bodyScale) || 1;
    const signature = `${resident.palette.hair}:${resident.hairStyle || 0}:${resident.accessoryStyle || "none"}:${bodyScale}`;
    if (signature === this.appearanceSignature) return;
    this.appearanceSignature = signature;
    this.body.scaleX = bodyScale;
    this.leftLeg.x = -6 * bodyScale;
    this.rightLeg.x = 6 * bodyScale;
    this.hair.clear();
    this.hair.fillStyle(resident.palette.hair, 1);
    const style = Number(resident.hairStyle) || 0;
    if (style === 1) {
      this.hair.fillEllipse(0, -31, 25, 12);
      this.hair.fillCircle(-12, -29, 6);
    } else if (style === 2) {
      this.hair.fillEllipse(0, -31, 26, 12);
      this.hair.fillTriangle(-13, -31, 12, -35, 11, -25);
    } else if (style === 3) {
      for (const [x, y] of [[-9, -31], [0, -34], [9, -31], [-12, -27], [12, -27]]) this.hair.fillCircle(x, y, 5);
    } else {
      this.hair.fillEllipse(0, -31, 26, 12);
      this.hair.fillRect(-13, -31, 26, 5);
    }
    const accessories = { none: "", glasses: "👓", cap: "🧢", sunhat: "👒", satchel: "👜", badge: "💚" };
    const accessory = resident.accessoryStyle || "none";
    this.accessory.setText(accessories[accessory] || "");
    this.accessory.setPosition(accessory === "satchel" ? 13 : accessory === "badge" ? 7 : 0, accessory === "satchel" ? 3 : accessory === "badge" ? -2 : -29);
    this.accessory.setFontSize(accessory === "glasses" ? 15 : accessory === "badge" ? 8 : 14);
  }

  setControlMovement(dx, dy, moving) {
    this.controlMoving = Boolean(moving);
    if (Math.abs(dx) > Math.abs(dy) && dx) this.scaleX = dx < 0 ? -1 : 1;
  }

  destroy(fromScene) {
    this.removeAllListeners();
    super.destroy(fromScene);
  }
}
