import Phaser from "phaser";
import { cardinalDirection } from "../input/mobileGestures.js";

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
    this.bindSwipeControls();
  }

  bindSwipeControls() {
    this.swipeTarget = this.scene.game.canvas;
    this.swipeStart = null;
    this.swipePulse = null;
    this.onSwipePointerDown = (event) => {
      if (!this.enabled || event.button !== 0 || this.swipeStart) return;
      this.swipeStart = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
    };
    this.onSwipePointerUp = (event) => {
      const start = this.swipeStart;
      if (!start || start.pointerId !== event.pointerId) return;
      this.swipeStart = null;
      if (!this.enabled) return;
      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
      const direction = { U: "up", D: "down", L: "left", R: "right" }[cardinalDirection(dx, dy, 24)];
      if (!direction) return;
      const [stepX, stepY] = DIRECTION_VECTORS[direction];
      if (this.onTouchStep) this.onTouchStep(stepX, stepY);
      else this.swipePulse = { direction, until: performance.now() + 220 };
    };
    this.onSwipePointerCancel = (event) => {
      if (!this.swipeStart || (event?.pointerId !== undefined && this.swipeStart.pointerId !== event.pointerId)) return;
      this.swipeStart = null;
    };
    this.swipeTarget?.addEventListener("pointerdown", this.onSwipePointerDown);
    this.swipeTarget?.addEventListener("pointerup", this.onSwipePointerUp);
    this.swipeTarget?.addEventListener("pointercancel", this.onSwipePointerCancel);
    this.swipeTarget?.addEventListener("lostpointercapture", this.onSwipePointerCancel);
  }

  setEnabled(enabled) {
    this.enabled = Boolean(enabled);
    if (!this.enabled) {
      this.swipeStart = null;
      this.swipePulse = null;
    }
  }

  getVector() {
    if (!this.enabled) return { dx: 0, dy: 0, sprinting: false };
    let dx = 0;
    let dy = 0;
    const swipeDirection = this.swipePulse && performance.now() <= this.swipePulse.until ? this.swipePulse.direction : null;
    if (this.swipePulse && !swipeDirection) this.swipePulse = null;
    if (this.cursors.left.isDown || this.keys.left.isDown || swipeDirection === "left") dx -= 1;
    if (this.cursors.right.isDown || this.keys.right.isDown || swipeDirection === "right") dx += 1;
    if (this.cursors.up.isDown || this.keys.up.isDown || swipeDirection === "up") dy -= 1;
    if (this.cursors.down.isDown || this.keys.down.isDown || swipeDirection === "down") dy += 1;
    return { dx, dy, sprinting: this.keys.sprint.isDown };
  }

  consumeInteractPress() {
    if (!this.enabled) return false;
    return Phaser.Input.Keyboard.JustDown(this.keys.interact)
      || Phaser.Input.Keyboard.JustDown(this.keys.interactAlt);
  }

  destroy() {
    this.swipeTarget?.removeEventListener("pointerdown", this.onSwipePointerDown);
    this.swipeTarget?.removeEventListener("pointerup", this.onSwipePointerUp);
    this.swipeTarget?.removeEventListener("pointercancel", this.onSwipePointerCancel);
    this.swipeTarget?.removeEventListener("lostpointercapture", this.onSwipePointerCancel);
    this.swipeStart = null;
    this.swipePulse = null;
  }
}
