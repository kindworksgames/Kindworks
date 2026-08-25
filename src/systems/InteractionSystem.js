export class InteractionSystem {
  constructor({ interactables = [], onChange = () => {} } = {}) {
    this.interactables = [...interactables];
    this.onChange = onChange;
    this.current = null;
    this.enabled = true;
  }

  setEnabled(enabled) {
    this.enabled = Boolean(enabled);
    if (!this.enabled) this.setCurrent(null);
  }

  setInteractables(interactables) {
    this.interactables = [...interactables];
    this.current = null;
  }

  findNearest(x, y) {
    if (!this.enabled) return null;
    let best = null;
    let bestRatio = Infinity;
    for (const interactable of this.interactables) {
      if (interactable.enabled === false) continue;
      const distance = Math.hypot(interactable.x - x, interactable.y - y);
      const radius = Math.max(1, Number(interactable.radius) || 72);
      const ratio = distance / radius;
      if (distance <= radius && ratio < bestRatio) {
        best = { ...interactable, distance };
        bestRatio = ratio;
      }
    }
    return best;
  }

  update(x, y) {
    const nearest = this.findNearest(x, y);
    this.setCurrent(nearest);
    return this.current;
  }

  setCurrent(next) {
    const previousId = this.current?.id || null;
    const nextId = next?.id || null;
    this.current = next;
    if (previousId !== nextId) this.onChange(this.current);
  }

  activateCurrent() {
    if (!this.enabled || !this.current || typeof this.current.onActivate !== "function") {
      return { ok: false, reason: "No interaction is available." };
    }
    return this.current.onActivate(this.current);
  }

  getState() {
    return this.current
      ? { id: this.current.id, kind: this.current.kind, label: this.current.label }
      : null;
  }
}
