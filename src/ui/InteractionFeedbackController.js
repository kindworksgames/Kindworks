export const CONTROL_STATES = Object.freeze({
  normal: "normal",
  pressed: "pressed",
  disabled: "disabled",
  selected: "selected",
});

export function resolveControlState(control, { pressed = false } = {}) {
  if (!control) return CONTROL_STATES.normal;
  if (control.disabled || control.getAttribute?.("aria-disabled") === "true") return CONTROL_STATES.disabled;
  if (pressed) return CONTROL_STATES.pressed;
  if (
    control.getAttribute?.("aria-selected") === "true"
    || control.getAttribute?.("aria-pressed") === "true"
    || control.classList?.contains?.("selected")
    || control.classList?.contains?.("active")
  ) return CONTROL_STATES.selected;
  return CONTROL_STATES.normal;
}

function isIconOnly(control) {
  const text = String(control?.textContent || "").trim();
  return Boolean(control?.getAttribute?.("aria-label")) && text.length > 0 && [...text].length <= 2;
}

export class InteractionFeedbackController {
  constructor({ documentObject = document } = {}) {
    this.document = documentObject;
    this.pressedControls = new Set();
    this.observer = null;
    this.started = false;
    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handlePointerEnd = this.handlePointerEnd.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.handleMutations = this.handleMutations.bind(this);
  }

  start() {
    if (this.started || !this.document) return this;
    this.started = true;
    this.enhance(this.document);
    this.document.addEventListener("pointerdown", this.handlePointerDown, true);
    this.document.addEventListener("pointerup", this.handlePointerEnd, true);
    this.document.addEventListener("pointercancel", this.handlePointerEnd, true);
    this.document.addEventListener("keydown", this.handleKeyDown, true);
    this.document.addEventListener("keyup", this.handleKeyUp, true);
    this.document.addEventListener("click", this.handleClick, true);
    if (typeof MutationObserver === "function" && this.document.body) {
      this.observer = new MutationObserver(this.handleMutations);
      this.observer.observe(this.document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["disabled", "aria-disabled", "aria-selected", "aria-pressed"],
      });
    }
    return this;
  }

  destroy() {
    if (!this.started) return;
    this.document.removeEventListener("pointerdown", this.handlePointerDown, true);
    this.document.removeEventListener("pointerup", this.handlePointerEnd, true);
    this.document.removeEventListener("pointercancel", this.handlePointerEnd, true);
    this.document.removeEventListener("keydown", this.handleKeyDown, true);
    this.document.removeEventListener("keyup", this.handleKeyUp, true);
    this.document.removeEventListener("click", this.handleClick, true);
    this.observer?.disconnect();
    this.observer = null;
    this.pressedControls.clear();
    this.started = false;
  }

  enhance(root) {
    const controls = [];
    if (root?.matches?.("button")) controls.push(root);
    controls.push(...(root?.querySelectorAll?.("button") || []));
    for (const control of controls) {
      if (!control.classList.contains("kw-control")) control.classList.add("kw-control");
      const iconOnly = isIconOnly(control);
      if (control.classList.contains("kw-icon-control") !== iconOnly) control.classList.toggle("kw-icon-control", iconOnly);
      this.sync(control);
    }
    return controls.length;
  }

  sync(control) {
    if (!control?.matches?.("button")) return;
    const pressed = this.pressedControls.has(control);
    const state = resolveControlState(control, { pressed });
    control.dataset.uiState = state;
    control.setAttribute("data-ui-control", "button");
  }

  controlFromEvent(event) {
    return event?.target?.closest?.("button.kw-control") || null;
  }

  handlePointerDown(event) {
    const control = this.controlFromEvent(event);
    if (!control || resolveControlState(control) === CONTROL_STATES.disabled) return;
    this.pressedControls.add(control);
    this.sync(control);
  }

  handlePointerEnd(event) {
    const control = this.controlFromEvent(event);
    const ending = control ? [control] : [...this.pressedControls];
    for (const pressed of ending) {
      this.pressedControls.delete(pressed);
      this.sync(pressed);
    }
    for (const pressed of [...this.pressedControls]) if (!pressed.isConnected) this.pressedControls.delete(pressed);
  }

  handleKeyDown(event) {
    if (!['Enter', ' '].includes(event.key) || event.repeat) return;
    this.handlePointerDown(event);
  }

  handleKeyUp(event) {
    if (!['Enter', ' '].includes(event.key)) return;
    this.handlePointerEnd(event);
  }

  handleClick(event) {
    const control = this.controlFromEvent(event);
    if (!control) return;
    queueMicrotask(() => {
      this.sync(control);
      for (const sibling of control.parentElement?.querySelectorAll?.("button.kw-control") || []) this.sync(sibling);
    });
  }

  handleMutations(mutations) {
    for (const mutation of mutations) {
      if (mutation.type === "childList") {
        for (const node of mutation.addedNodes) this.enhance(node);
      } else if (mutation.target?.matches?.("button")) {
        this.enhance(mutation.target);
      }
    }
  }

  getDiagnostics() {
    const controls = [...(this.document?.querySelectorAll?.("button.kw-control") || [])];
    return {
      total: controls.length,
      iconOnly: controls.filter((control) => control.classList.contains("kw-icon-control")).length,
      states: Object.fromEntries(Object.values(CONTROL_STATES).map((state) => [state, controls.filter((control) => control.dataset.uiState === state).length])),
    };
  }
}
