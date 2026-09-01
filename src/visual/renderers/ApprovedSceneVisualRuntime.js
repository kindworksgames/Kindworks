import { PhaserPrefabRenderer } from "./PhaserPrefabRenderer.js";

const sceneIdOf = (scene) => scene?.scene?.key || null;
const point = (value) => ({ x: Number(value?.x || 0), y: Number(value?.y || 0) });

/**
 * Production runtime for human-approved semantic scene instances.
 * It owns presentation only: gameplay geometry and persistent state are never
 * created, moved, or written here.
 */
export class ApprovedSceneVisualRuntime {
  constructor(scene, { registry = scene?.registry?.get?.("visualRegistry"), bindings = {}, instanceFilter = null } = {}) {
    if (!registry) throw new Error("ApprovedSceneVisualRuntime requires the visual registry.");
    this.scene = scene;
    this.registry = registry;
    this.bindings = bindings;
    this.instanceFilter = instanceFilter;
    this.renderer = new PhaserPrefabRenderer(scene, registry);
    this.records = new Map();
    this.disposed = false;
  }

  static preload(scene) {
    return scene?.registry?.get?.("visualRegistry")?.queueScenePacks?.(scene) || [];
  }

  mount() {
    const sceneId = sceneIdOf(this.scene);
    this.registry.createSceneAnimations(this.scene, sceneId);
    for (const instance of this.registry.getSceneInstancesByScene(sceneId)) {
      if (instance.activation !== "phase-8b-approved") continue;
      if (this.instanceFilter && !this.instanceFilter(instance)) continue;
      try {
        const placements = this.resolvePlacements(instance);
        if (!placements?.length) continue;
        placements.forEach((placement, index) => this.create(instance, placement, index));
      } catch (error) {
        this.registry.recordFailure("scene-instance-create-failed", `${instance.id} could not be created: ${error.message}`, {
          sceneId, expected: "validated semantic scene instance", actual: error.message,
          manifestEntry: `sceneInstances.${instance.id}`,
        });
      }
    }
    this.scene.events?.once?.("shutdown", () => this.shutdown());
    return this;
  }

  resolvePlacements(instance) {
    const binding = instance.binding || { mode: "static" };
    const resolver = this.bindings.placementResolver;
    if (typeof resolver === "function") {
      const result = resolver(instance, binding);
      if (Array.isArray(result)) return result;
      if (result) return [result];
    }
    if (binding.mode !== "static") {
      this.registry.recordFailure("scene-instance-binding-required", `${instance.id} requires a ${binding.mode} presentation binding.`, {
        sceneId: sceneIdOf(this.scene), expected: `placementResolver for ${binding.mode}`, actual: "unbound", manifestEntry: `sceneInstances.${instance.id}`,
      });
      return [];
    }
    return [{ position: instance.position, visible: true }];
  }

  resolveState(instance, placement) {
    const requested = this.bindings.stateResolver?.(instance, placement);
    return requested || this.registry.getVisualState(instance.stateId)?.defaultState || null;
  }

  create(instance, placement, index) {
    const stateName = this.resolveState(instance, placement);
    const resolved = this.renderer.resolve(instance.prefabId, instance.stateId, stateName);
    const origin = point(instance.worldOrigin), visualOffset = point(instance.visualOffset), local = point(placement.position || instance.position);
    const position = { x: origin.x + local.x + visualOffset.x, y: origin.y + local.y + visualOffset.y };
    const objects = [];
    for (const layer of resolved.layers) {
      const frame = placement.frame ?? resolved.state?.modifier?.frame ?? null;
      const object = this.renderer.createDisplayLayer(resolved, layer, { frame, tileArea: placement.tileArea || null });
      if (!object) continue;
      if (placement.origin) object.setOrigin?.(placement.origin.x, placement.origin.y);
      if (placement.displaySize) object.setDisplaySize?.(placement.displaySize.width, placement.displaySize.height);
      object.setPosition(position.x, position.y);
      if (Number.isFinite(placement.rotation)) object.setRotation?.(placement.rotation);
      const depth = Number.isFinite(placement.depth)
        ? placement.depth
        : this.renderer.depthFor(resolved, layer.role, position.y) + Number(layer.order || 0);
      object.setDepth(depth);
      object.setVisible(placement.visible !== false);
      object.disableInteractive?.();
      object.setData?.({
        semanticAssetId: layer.asset.id,
        visualInstanceId: instance.id,
        visualPrefabId: instance.prefabId,
        gameplayGeometryLocked: instance.gameplayGeometryLocked === true,
        approvedRuntimeVisual: true,
        approvedLayerRole: layer.role,
      });
      this.registry.tagSceneInstance(object, instance.id);
      const animation = this.registry.getAnimationsByAsset?.(layer.asset.id)
        ?.find(({ id }) => placement.facing && id.endsWith(`-${placement.facing}`));
      if (animation && object.play) object.play(animation.runtimeKey, true);
      objects.push(object);
    }
    if (objects.length) this.records.set(`${instance.id}:${index}`, { instance, placement, index, stateName, objects });
    return objects;
  }

  refresh() {
    for (const record of this.records.values()) {
      const latest = this.resolvePlacements(record.instance)?.[record.index];
      if (latest) {
        record.placement = latest;
        const origin = point(record.instance.worldOrigin), offset = point(record.instance.visualOffset), local = point(latest.position || record.instance.position);
        const x = origin.x + local.x + offset.x, y = origin.y + local.y + offset.y;
        for (const object of record.objects) {
          object.setPosition?.(x, y);
          object.setVisible?.(latest.visible !== false);
        }
      }
      const stateName = this.resolveState(record.instance, record.placement);
      if (stateName === record.stateName) continue;
      const resolved = this.renderer.resolve(record.instance.prefabId, record.instance.stateId, stateName);
      const frame = resolved.state?.modifier?.frame;
      if (Number.isInteger(frame)) for (const object of record.objects) object.setFrame?.(frame);
      for (const object of record.objects) {
        const assetId = object.getData?.("semanticAssetId");
        const animation = this.registry.getAnimationsByAsset?.(assetId)
          ?.find(({ id }) => record.placement?.facing && id.endsWith(`-${record.placement.facing}`));
        if (animation && object.anims?.currentAnim?.key !== animation.runtimeKey) object.play?.(animation.runtimeKey, true);
      }
      record.stateName = stateName;
    }
  }

  shutdown() {
    if (this.disposed) return;
    for (const record of this.records.values()) {
      for (const object of record.objects) object.destroy?.();
    }
    this.records.clear();
    this.disposed = true;
  }
}

export function preloadApprovedSceneVisuals(scene) { return ApprovedSceneVisualRuntime.preload(scene); }
export function mountApprovedSceneVisuals(scene, options) { return new ApprovedSceneVisualRuntime(scene, options).mount(); }

export function hasApprovedSceneBinding(scene, predicate) {
  const registry = scene?.registry?.get?.("visualRegistry");
  const sceneId = sceneIdOf(scene);
  if (!registry || !sceneId || typeof predicate !== "function") return false;
  return registry.getSceneInstancesByScene(sceneId)
    .some((instance) => instance.activation === "phase-8b-approved" && predicate(instance.binding || {}, instance));
}
