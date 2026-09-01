import { VISUAL_ASSET_KINDS } from "../contracts.js";
import { groundContactWorldPosition, resolveGroundDepth, resolvePrefabDisplayMetrics } from "../scale/scaleSystem.js";

/** Resolves shared contracts. Family factories own family-specific rendering. */
export class PhaserPrefabRenderer {
  constructor(scene, registry = scene?.registry?.get?.("visualRegistry")) {
    if (!registry) throw new Error("PhaserPrefabRenderer requires the visual registry");
    this.scene = scene;
    this.registry = registry;
  }

  resolve(prefabId, stateMapId = null, stateName = null) {
    const prefab = this.registry.getPrefab(prefabId);
    if (!prefab) throw new Error(`Unknown visual prefab: ${prefabId}`);
    const stateMap = stateMapId ? this.registry.getVisualState(stateMapId) : null;
    if (stateMapId && !stateMap) throw new Error(`Unknown visual state mapping: ${stateMapId}`);
    const selectedStateName = stateName || stateMap?.defaultState || null;
    const state = selectedStateName ? stateMap?.states?.[selectedStateName] : null;
    if (selectedStateName && !state) throw new Error(`Unknown visual state ${stateMapId}.${selectedStateName}`);
    if (state && state.prefabId !== prefabId) throw new Error(`Visual state ${stateMapId}.${selectedStateName} does not belong to ${prefabId}`);
    const layers = (prefab.layers || []).map((layer) => {
      const asset = this.registry.getAsset(layer.assetId);
      if (!asset) throw new Error(`Unknown visual asset: ${layer.assetId}`);
      return { ...layer, asset };
    });
    return {
      prefab,
      stateMap,
      stateName: selectedStateName,
      state,
      layers,
      variant: prefab.variant,
      scalePolicy: prefab.scalePolicy,
      groundContactAnchor: prefab.groundContactAnchor,
      origin: prefab.origin || { x: prefab.anchor?.originX ?? 0.5, y: prefab.anchor?.originY ?? 0.5 },
      depthPolicy: prefab.depthPolicy,
      shadowPolicy: prefab.shadowPolicy,
      animation: state?.animation || prefab.animation || null,
      foregroundLayers: layers.filter((layer) => layer.role === "foreground"),
      backgroundLayers: layers.filter((layer) => layer.role === "background"),
      collisionFootprint: prefab.geometry?.collision || null,
      navigationFootprint: prefab.geometry?.navigation || null,
      interactionZone: prefab.geometry?.interaction || null,
      mobileTouchTarget: prefab.geometry?.touch || null,
      attachmentSockets: prefab.sockets || {},
    };
  }

  preload(prefabIds) {
    const queued = new Set();
    prefabIds.forEach((prefabId) => {
      this.resolve(prefabId).layers.forEach(({ asset }) => {
        if (queued.has(asset.id)) return;
        if ([VISUAL_ASSET_KINDS.IMAGE, VISUAL_ASSET_KINDS.SPRITESHEET].includes(asset.kind)) {
          this.registry.queuePhaserAsset(this.scene, asset.id);
          queued.add(asset.id);
        }
      });
    });
  }

  depthFor(resolved, role, y = 0) {
    const base = Number(resolved.depthPolicy?.bases?.[role] ?? resolved.depthPolicy?.base ?? 0);
    const divisor = Number(resolved.depthPolicy?.divisor || 0);
    const layerId = resolved.depthPolicy?.layers?.[role] || resolved.depthPolicy?.layerId;
    const groundY = groundContactWorldPosition({ x: 0, y }, resolved.groundContactAnchor).y;
    if (layerId) return resolveGroundDepth(layerId, groundY, { base, divisor });
    return base + (divisor ? groundY / divisor : 0);
  }

  createImageLayer(resolved, role = "main") {
    const layer = resolved.layers.find((candidate) => candidate.role === role);
    return this.createDisplayLayer(resolved, layer);
  }

  createDisplayLayer(resolved, layer, { frame = null, tileArea = null } = {}) {
    if (!layer || ![VISUAL_ASSET_KINDS.IMAGE, VISUAL_ASSET_KINDS.SPRITESHEET, VISUAL_ASSET_KINDS.ATLAS].includes(layer.asset.kind)) return null;
    const key = layer.asset.runtime.textureKey || layer.asset.runtime.atlasKey;
    const image = tileArea
      ? this.scene.add.tileSprite(0, resolved.groundContactAnchor?.y || 0, tileArea.width, tileArea.height, key, frame ?? 0)
      : layer.asset.kind === VISUAL_ASSET_KINDS.IMAGE
      ? this.scene.add.image(0, resolved.groundContactAnchor?.y || 0, key)
      : this.scene.add.sprite(0, resolved.groundContactAnchor?.y || 0, key, frame ?? 0);
    image.setOrigin(resolved.origin.x, resolved.origin.y);
    const metrics = resolvePrefabDisplayMetrics(resolved.prefab, layer.asset);
    if (!tileArea) image.setDisplaySize(metrics.width, metrics.height);
    image.setData?.("logicalDisplayWidth", tileArea?.width ?? metrics.width);
    image.setData?.("logicalDisplayHeight", tileArea?.height ?? metrics.height);
    image.setData?.("nativePixelsPerLogicalUnit", metrics.nativePixelsPerLogicalUnit);
    image.setData?.("semanticTileArea", tileArea ? { width: tileArea.width, height: tileArea.height } : null);
    return image;
  }
}
