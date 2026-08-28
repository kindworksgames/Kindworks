import Phaser from "phaser";

const DRAG_THRESHOLD = 6;
const KEYBOARD_PAN_PIXELS = 92;

function localPoint(target, event) {
  const bounds = target.getBoundingClientRect();
  const scaleX = bounds.width ? target.width / bounds.width : 1;
  const scaleY = bounds.height ? target.height / bounds.height : 1;
  return {
    x: (event.clientX - bounds.left) * scaleX,
    y: (event.clientY - bounds.top) * scaleY,
  };
}

export class TownCameraController {
  constructor(scene, {
    minimumZoom = 0.28,
    maximumZoom = 1.35,
    isControlMode = () => false,
    isBlocked = () => false,
    onBrowseTap = () => {},
    onBrowseMove = () => {},
    onPinchStart = () => {},
    onPinchEnd = () => {},
    onZoom = () => {},
  } = {}) {
    this.scene = scene;
    this.camera = scene.cameras.main;
    this.target = scene.game.canvas;
    this.minimumZoom = minimumZoom;
    this.maximumZoom = maximumZoom;
    this.isControlMode = isControlMode;
    this.isBlocked = isBlocked;
    this.onBrowseTap = onBrowseTap;
    this.onBrowseMove = onBrowseMove;
    this.onPinchStart = onPinchStart;
    this.onPinchEnd = onPinchEnd;
    this.onZoom = onZoom;
    this.pointers = new Map();
    this.drag = null;
    this.pinch = null;
    this.bind();
  }

  bind() {
    this.onPointerDown = (event) => {
      if (event.button !== 0 || this.isBlocked()) return;
      const point = localPoint(this.target, event);
      this.target.setPointerCapture?.(event.pointerId);
      this.pointers.set(event.pointerId, point);
      if (this.pointers.size === 1) {
        this.drag = {
          pointerId: event.pointerId,
          startX: point.x,
          startY: point.y,
          scrollX: this.camera.scrollX,
          scrollY: this.camera.scrollY,
          moved: false,
          pinched: false,
        };
      } else if (this.pointers.size === 2) {
        const [a, b] = [...this.pointers.values()];
        const midX = (a.x + b.x) / 2;
        const midY = (a.y + b.y) / 2;
        this.pinch = {
          distance: Math.max(1, Math.hypot(b.x - a.x, b.y - a.y)),
          zoom: this.camera.zoom,
          worldX: this.camera.scrollX + midX / this.camera.zoom,
          worldY: this.camera.scrollY + midY / this.camera.zoom,
        };
        if (this.drag) this.drag.pinched = true;
        this.onPinchStart();
      }
      event.preventDefault();
    };
    this.onPointerMove = (event) => {
      if (!this.pointers.has(event.pointerId) || this.isBlocked()) return;
      const point = localPoint(this.target, event);
      this.pointers.set(event.pointerId, point);
      if (this.pointers.size === 2 && this.pinch) {
        const [a, b] = [...this.pointers.values()];
        const distance = Math.max(1, Math.hypot(b.x - a.x, b.y - a.y));
        const midX = (a.x + b.x) / 2;
        const midY = (a.y + b.y) / 2;
        const zoom = Phaser.Math.Clamp(this.pinch.zoom * (distance / this.pinch.distance), this.minimumZoom, this.maximumZoom);
        this.camera.setZoom(zoom);
        this.camera.setScroll(this.pinch.worldX - midX / zoom, this.pinch.worldY - midY / zoom);
        this.onZoom(zoom);
        event.preventDefault();
        return;
      }
      if (!this.drag || this.drag.pointerId !== event.pointerId || this.isControlMode()) return;
      const dx = point.x - this.drag.startX;
      const dy = point.y - this.drag.startY;
      if (Math.hypot(dx, dy) >= DRAG_THRESHOLD && !this.drag.moved) {
        this.drag.moved = true;
        this.onBrowseMove();
      }
      this.camera.setScroll(this.drag.scrollX - dx / this.camera.zoom, this.drag.scrollY - dy / this.camera.zoom);
      event.preventDefault();
    };
    this.finishPointer = (event, cancelled = false) => {
      const point = this.pointers.get(event.pointerId) || localPoint(this.target, event);
      const drag = this.drag;
      this.pointers.delete(event.pointerId);
      if (this.pointers.size < 2 && this.pinch) {
        this.pinch = null;
        this.onPinchEnd();
      }
      if (!this.pointers.size) {
        if (!cancelled && drag && !drag.moved && !drag.pinched && !this.isControlMode() && !this.isBlocked()) {
          const world = this.camera.getWorldPoint(point.x, point.y);
          this.onBrowseTap(world.x, world.y);
        }
        this.drag = null;
      }
    };
    this.onPointerUp = (event) => this.finishPointer(event, false);
    this.onPointerCancel = (event) => this.finishPointer(event, true);
    this.onKeyDown = (event) => {
      if (this.isControlMode() || this.isBlocked() || event.metaKey || event.ctrlKey || event.altKey) return;
      const active = document.activeElement;
      if (active && /^(INPUT|SELECT|TEXTAREA)$/.test(active.tagName)) return;
      const key = event.key.toLowerCase();
      const amount = KEYBOARD_PAN_PIXELS / this.camera.zoom;
      let dx = 0;
      let dy = 0;
      if (key === "arrowleft" || key === "a") dx = -amount;
      else if (key === "arrowright" || key === "d") dx = amount;
      else if (key === "arrowup" || key === "w") dy = -amount;
      else if (key === "arrowdown" || key === "s") dy = amount;
      else return;
      event.preventDefault();
      this.camera.setScroll(this.camera.scrollX + dx, this.camera.scrollY + dy);
    };
    this.target?.addEventListener("pointerdown", this.onPointerDown, { passive: false });
    this.target?.addEventListener("pointermove", this.onPointerMove, { passive: false });
    this.target?.addEventListener("pointerup", this.onPointerUp);
    this.target?.addEventListener("pointercancel", this.onPointerCancel);
    this.target?.addEventListener("lostpointercapture", this.onPointerCancel);
    document.addEventListener("keydown", this.onKeyDown);
  }

  setZoomAt(value, focusX = this.camera.width / 2, focusY = this.camera.height / 2) {
    const zoom = Phaser.Math.Clamp(value, this.minimumZoom, this.maximumZoom);
    const worldX = this.camera.scrollX + focusX / this.camera.zoom;
    const worldY = this.camera.scrollY + focusY / this.camera.zoom;
    this.camera.setZoom(zoom);
    this.camera.setScroll(worldX - focusX / zoom, worldY - focusY / zoom);
    this.onZoom(zoom);
    return zoom;
  }

  destroy() {
    this.target?.removeEventListener("pointerdown", this.onPointerDown);
    this.target?.removeEventListener("pointermove", this.onPointerMove);
    this.target?.removeEventListener("pointerup", this.onPointerUp);
    this.target?.removeEventListener("pointercancel", this.onPointerCancel);
    this.target?.removeEventListener("lostpointercapture", this.onPointerCancel);
    document.removeEventListener("keydown", this.onKeyDown);
    this.pointers.clear();
    this.drag = null;
    this.pinch = null;
  }
}
