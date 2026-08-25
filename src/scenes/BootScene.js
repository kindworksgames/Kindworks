import Phaser from "phaser";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  create() {
    const { width, height } = this.scale;

    this.add
      .rectangle(width / 2, height / 2, width, height, 0x20382c)
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 - 54, "KINDWORKS", {
        color: "#fff9df",
        fontFamily: "system-ui, sans-serif",
        fontSize: "54px",
        fontStyle: "bold",
        letterSpacing: 4,
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 + 18, "Phaser 4 shell is running", {
        color: "#cce3c2",
        fontFamily: "system-ui, sans-serif",
        fontSize: "24px",
      })
      .setOrigin(0.5);

    this.add
      .text(
        width / 2,
        height / 2 + 62,
        "The original HTML game is preserved and no gameplay has been migrated yet.",
        {
          align: "center",
          color: "#92b89a",
          fontFamily: "system-ui, sans-serif",
          fontSize: "16px",
          wordWrap: { width: 720 },
        },
      )
      .setOrigin(0.5);
  }
}

