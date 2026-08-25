import Phaser from "phaser";

export class NpcCharacter extends Phaser.GameObjects.Container {
  constructor(scene, resident) {
    super(scene, resident.x, resident.y);
    this.residentId = resident.id;
    this.walkPhase = Number(resident.id.slice(-2)) * 0.73;
    this.hovered = false;

    this.shadow = scene.add.ellipse(0, 19, 29, 11, 0x1e3829, 0.26);
    this.leftLeg = scene.add.rectangle(-6, 13, 8, 15, resident.palette.pants);
    this.rightLeg = scene.add.rectangle(6, 13, 8, 15, resident.palette.pants);
    this.body = scene.add.rectangle(0, -1, 25, 27, resident.palette.shirt).setStrokeStyle(2, 0x294637, 0.55);
    this.head = scene.add.circle(0, -22, 13, resident.palette.skin).setStrokeStyle(2, 0x294637, 0.55);
    this.hair = scene.add.arc(0, -26, 13, 180, 360, false, resident.palette.hair);
    this.face = scene.add.text(0, -21, "•‿•", { color: "#3d3028", fontFamily: "system-ui", fontSize: "7px", fontStyle: "bold" }).setOrigin(0.5);
    this.label = scene.add.text(0, -49, `${resident.name}\n${resident.role}`, {
      align: "center",
      color: "#294637",
      fontFamily: "system-ui, sans-serif",
      fontSize: "10px",
      fontStyle: "bold",
      backgroundColor: "rgba(255, 253, 241, 0.94)",
      padding: { x: 6, y: 3 },
    }).setOrigin(0.5, 1).setVisible(false);

    this.add([this.shadow, this.leftLeg, this.rightLeg, this.body, this.head, this.hair, this.face, this.label]);
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
    const walking = resident.phase === "commuting";
    if (walking) this.walkPhase += Math.min(50, Math.max(0, deltaMilliseconds)) * 0.012;
    const step = walking ? Math.sin(this.walkPhase) * 3 : 0;
    this.leftLeg.y = 13 + step;
    this.rightLeg.y = 13 - step;
    this.body.y = walking ? -1 + Math.abs(Math.sin(this.walkPhase)) * -1.4 : -1;
    this.scaleX = resident.facingX < -0.15 ? -1 : 1;
    this.label.scaleX = this.scaleX;
    this.label.setText(`${resident.name}\n${resident.phase === "commuting" ? resident.activity : resident.role}`);
  }

  destroy(fromScene) {
    this.removeAllListeners();
    super.destroy(fromScene);
  }
}
