import Phaser from "phaser";

const DIRECTION_VECTORS = Object.freeze({
  up: [0, -1],
  left: [-1, 0],
  down: [0, 1],
  right: [1, 0],
});

export class MovementController {
  constructor(scene, { onTouchStep = null } = {}) {
    this.scene = scene;
    this.onTouchStep = onTouchStep;
    this.enabled = true;
    this.touchDirections = new Set();
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.keys = scene.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      sprint: Phaser.Input.Keyboard.KeyCodes.SHIFT,
      interact: Phaser.Input.Keyboard.KeyCodes.E,
      interactAlt: Phaser.Input.Keyboard.KeyCodes.SPACE,
    });
    this.bindTouchControls();
  }

  bindTouchControls() {
    this.buttons = [...document.querySelectorAll("[data-move]")];
    this.onPointerDown = (event) => {
      if (!this.enabled) return;
      event.preventDefault();
      event.currentTarget.setPointerCapture?.(event.pointerId);
      this.touchDirections.add(event.currentTarget.dataset.move);
      event.currentTarget.classList.add("is-active");
    };
    this.onPointerUp = (event) => {
      this.touchDirections.delete(event.currentTarget.dataset.move);
      event.currentTarget.classList.remove("is-active");
    };
    this.onClick = (event) => {
      if (!this.enabled || !this.onTouchStep) return;
      const [dx, dy] = DIRECTION_VECTORS[event.currentTarget.dataset.move] || [0, 0];
      this.onTouchStep(dx, dy);
    };

    for (const button of this.buttons) {
      button.addEventListener("pointerdown", this.onPointerDown);
      button.addEventListener("pointerup", this.onPointerUp);
      button.addEventListener("pointercancel", this.onPointerUp);
      button.addEventListener("lostpointercapture", this.onPointerUp);
      button.addEventListener("click", this.onClick);
    }
  }

  setEnabled(enabled) {
    this.enabled = Boolean(enabled);
    if (!this.enabled) {
      this.touchDirections.clear();
      this.buttons?.forEach((button) => button.classList.remove("is-active"));
    }
  }

  getVector() {
    if (!this.enabled) return { dx: 0, dy: 0, sprinting: false };
    let dx = 0;
    let dy = 0;
    if (this.cursors.left.isDown || this.keys.left.isDown || this.touchDirections.has("left")) dx -= 1;
    if (this.cursors.right.isDown || this.keys.right.isDown || this.touchDirections.has("right")) dx += 1;
    if (this.cursors.up.isDown || this.keys.up.isDown || this.touchDirections.has("up")) dy -= 1;
    if (this.cursors.down.isDown || this.keys.down.isDown || this.touchDirections.has("down")) dy += 1;
    return { dx, dy, sprinting: this.keys.sprint.isDown };
  }

  consumeInteractPress() {
    if (!this.enabled) return false;
    return Phaser.Input.Keyboard.JustDown(this.keys.interact)
      || Phaser.Input.Keyboard.JustDown(this.keys.interactAlt);
  }

  destroy() {
    for (const button of this.buttons || []) {
      button.removeEventListener("pointerdown", this.onPointerDown);
      button.removeEventListener("pointerup", this.onPointerUp);
      button.removeEventListener("pointercancel", this.onPointerUp);
      button.removeEventListener("lostpointercapture", this.onPointerUp);
      button.removeEventListener("click", this.onClick);
    }
    this.touchDirections.clear();
  }
}
