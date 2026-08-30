import { resolveSceneLayoutDepth, resolveSceneLayoutInstance, validateSceneLayout } from "./sceneLayoutContracts.js";

const point = (value, fallback = 0) => Number.isFinite(value) ? value : fallback;

function applyIf(object, method, ...args) {
  if (typeof object?.[method] === "function") object[method](...args);
}

export class SceneLayoutRuntime {
  constructor(scene, layout) {
    const validation = validateSceneLayout(layout);
    if (!validation.ok) throw new AggregateError(validation.errors.map((entry) => new Error(`[${entry.code}] ${entry.path}: ${entry.message}`)), `Cannot bind invalid scene layout ${layout?.id}.`);
    this.scene = scene;
    this.layout = layout;
    this.records = new Map();
    this.positionOverrides = new Map();
    this.disposed = false;
  }

  register(instanceId, object, { slotId = "main", variant, state, context = {}, localOffset, localDepthOffset = 0, captureLocalOffset = false } = {}) {
    if (this.disposed) throw new Error(`[disposed-layout-runtime] ${this.layout.id}: Cannot register ${instanceId}.`);
    const resolved = resolveSceneLayoutInstance(this.layout, instanceId, { variant, state, context });
    const slots = this.records.get(instanceId) || new Map();
    const prior = slots.get(slotId);
    if (prior?.object && prior.object !== object && typeof prior.object.destroy === "function") prior.object.destroy();
    const base = this.displayPosition(resolved.visual);
    const record = {
      instanceId, slotId, object, variant, state, context,
      localOffset: localOffset || (captureLocalOffset ? { x: point(object?.x) - base.x, y: point(object?.y) - base.y } : { x: 0, y: 0 }),
      localDepthOffset: Number.isFinite(localDepthOffset) ? localDepthOffset : 0,
    };
    slots.set(slotId, record);
    this.records.set(instanceId, slots);
    object?.setData?.("sceneLayoutId", this.layout.id);
    object?.setData?.("sceneLayoutInstanceId", instanceId);
    object?.setData?.("sceneLayoutSlotId", slotId);
    this.applyRecord(record);
    return object;
  }

  displayPosition(visual) {
    const override = this.positionOverrides.get(visual.__instanceId);
    const position = override || visual.position;
    return { x: position.x + point(visual.offset?.x), y: position.y + point(visual.offset?.y) };
  }

  resolveDepth(visual, groundY) {
    if (visual.layerId) return resolveSceneLayoutDepth(this.layout, visual.layerId, groundY, point(visual.depthOffset));
    return Number.isFinite(visual.depth) ? visual.depth : null;
  }

  applyRecord(record) {
    const resolved = resolveSceneLayoutInstance(this.layout, record.instanceId, { variant: record.variant, state: record.state, context: record.context });
    const override = this.positionOverrides.get(record.instanceId);
    const logical = override || resolved.visual.position;
    const display = { x: logical.x + point(resolved.visual.offset?.x), y: logical.y + point(resolved.visual.offset?.y) };
    const object = record.object;
    applyIf(object, "setPosition", display.x + record.localOffset.x, display.y + record.localOffset.y);
    if (resolved.visual.origin) applyIf(object, "setOrigin", resolved.visual.origin.x, resolved.visual.origin.y);
    if (typeof resolved.visual.scale === "number") applyIf(object, "setScale", resolved.visual.scale);
    else if (resolved.visual.scale) applyIf(object, "setScale", resolved.visual.scale.x, resolved.visual.scale.y);
    if (Number.isFinite(resolved.visual.rotation)) applyIf(object, "setRotation", resolved.visual.rotation);
    if (typeof resolved.visual.flipX === "boolean") applyIf(object, "setFlipX", resolved.visual.flipX);
    if (typeof resolved.visual.flipY === "boolean") applyIf(object, "setFlipY", resolved.visual.flipY);
    const depth = this.resolveDepth(resolved.visual, display.y + record.localOffset.y);
    if (Number.isFinite(depth)) applyIf(object, "setDepth", depth + record.localDepthOffset);
    if (typeof resolved.visual.visible === "boolean") applyIf(object, "setVisible", resolved.visual.visible && resolved.active);
    else if (!resolved.active) applyIf(object, "setVisible", false);
    if (Number.isFinite(resolved.visual.alpha)) applyIf(object, "setAlpha", resolved.visual.alpha);
    if (Number.isInteger(resolved.visual.tint)) applyIf(object, "setTint", resolved.visual.tint);
    if (resolved.visual.animation && object?.anims?.play) object.anims.play(resolved.visual.animation, true);
    return object;
  }

  applyInstance(instanceId) {
    for (const record of this.records.get(instanceId)?.values() || []) this.applyRecord(record);
    return true;
  }

  applyVisualPosition(instanceId, position) {
    if (!Number.isFinite(position?.x) || !Number.isFinite(position?.y)) throw new TypeError(`[invalid-visual-position] ${this.layout.id}/${instanceId}: Expected finite x/y.`);
    if (!this.records.has(instanceId)) return false;
    this.positionOverrides.set(instanceId, { x: position.x, y: position.y });
    return this.applyInstance(instanceId);
  }

  clearVisualPosition(instanceId) {
    this.positionOverrides.delete(instanceId);
    return this.applyInstance(instanceId);
  }

  registeredCount(instanceId) { return this.records.get(instanceId)?.size || 0; }

  shutdown() {
    this.records.clear();
    this.positionOverrides.clear();
    this.disposed = true;
  }
}

export function applyLayoutSurfaces(layout, root = globalThis.document) {
  if (!root?.querySelectorAll) return Object.freeze({ applied: 0, missing: [] });
  let applied = 0; const missing = [];
  for (const surface of layout.surfaces || []) {
    const elements = [...root.querySelectorAll(surface.selector)];
    if (!elements.length) { if (surface.required) missing.push(surface.id); continue; }
    for (const element of elements) {
      element.dataset.sceneLayoutSurface = surface.id;
      element.style.setProperty("--kw-layout-offset-x", `${surface.visualOffset?.x || 0}px`);
      element.style.setProperty("--kw-layout-offset-y", `${surface.visualOffset?.y || 0}px`);
      element.dataset.layoutAnchor = surface.responsiveAnchor.mode;
      if (surface.responsiveAnchor.edge) element.dataset.layoutAnchorEdge = surface.responsiveAnchor.edge;
      applied += 1;
    }
  }
  return Object.freeze({ applied, missing: Object.freeze(missing) });
}
