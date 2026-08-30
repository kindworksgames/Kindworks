import { LegacyCompatibility } from "./LegacyCompatibility.js";
import { VISUAL_ASSET_KINDS, VISUAL_ASSET_REQUIREDNESS, VISUAL_CACHE_SCOPES } from "./contracts.js";
import { KINDWORKS_VISUAL_MANIFEST } from "./visualManifest.js";
import { validateVisualManifestRuntime } from "./validateVisualManifestRuntime.js";

const joinBase = (baseUrl, path) => `${String(baseUrl || "/").replace(/\/$/, "")}/${String(path || "").replace(/^\//, "")}`;
const versionedUrl = (baseUrl, path, version) => {
  const url = joinBase(baseUrl, path);
  return version ? `${url}?v=${encodeURIComponent(version)}` : url;
};
const sceneIdOf = (scene) => scene?.scene?.key || null;
const fingerprint = (asset) => asset?.cache?.contentSha256 || asset?.cache?.version || `manifest-${asset?.id}`;

export class VisualRegistry {
  constructor({ manifest = KINDWORKS_VISUAL_MANIFEST, environment = "development", baseUrl = "/", reporter = console } = {}) {
    const validation = validateVisualManifestRuntime(manifest);
    if (!validation.ok) throw new AggregateError(validation.errors.map((entry) => new Error(`[${entry.code}] ${entry.message} expected=${JSON.stringify(entry.expected)} actual=${JSON.stringify(entry.actual)} scenes=${entry.affectedScenes.join(",")}`)), "Invalid KindWorks visual manifest");
    this.manifest = manifest;
    this.environment = environment === "production" ? "production" : "development";
    this.baseUrl = baseUrl;
    this.reporter = reporter;
    this.failures = [];
    this.assetById = validation.indexes.assets;
    this.prefabById = validation.indexes.prefabs;
    this.instanceById = validation.indexes.instances;
    this.stateById = validation.indexes.states;
    this.animationById = validation.indexes.animations;
    this.scenePackById = validation.indexes.scenePacks;
    this.legacy = new LegacyCompatibility(manifest, this.assetById, this.animationById, {
      onUnknown: ({ kind, key }) => {
        if (this.environment !== "development") return;
        this.recordFailure("unknown-legacy-pass-through", `Unregistered legacy ${kind} key ${key} was passed through.`, {
          expected: "an explicit legacyCompatibility mapping or semantic ID", actual: key,
          manifestEntry: `legacyCompatibility.${kind}Keys`, severity: "warning",
        });
      },
    });
    this.cacheOwners = new Map();
    this.nativeImages = new Map();
    this.sceneRetains = new WeakMap();
    this.sceneCleanupInstalled = new WeakSet();
  }

  getAsset(id) { return this.assetById.get(id) || null; }
  getPrefab(id) { return this.prefabById.get(id) || null; }
  getVisualState(id) { return this.stateById.get(id) || null; }
  getSceneInstance(id) { return this.instanceById.get(id) || null; }
  getSceneInstancesByScene(sceneId) { return [...this.instanceById.values()].filter((instance) => instance.sceneId === sceneId); }
  getAnimation(id) { return this.animationById.get(id) || null; }
  getScenePacksByScene(sceneId) { return [...this.scenePackById.values()].filter((pack) => pack.sceneId === sceneId); }
  getScenePackByScene(sceneId) { return this.getScenePacksByScene(sceneId)[0] || null; }
  resolveLegacyTextureKey(key) { return this.legacy.resolveTextureKey(key); }
  resolveLegacyAnimationKey(key) { return this.legacy.resolveAnimationKey(key); }
  getLegacyMigrationDebt() { return this.legacy.getMigrationDebt(); }
  getFailures() { return this.failures.map((failure) => ({ ...failure })); }

  assetUrl(id) {
    const asset = this.getAsset(id);
    if (!asset?.source?.file) return null;
    const version = asset.cache?.version || asset.cache?.contentSha256?.slice(0, 12) || this.manifest.revision;
    return versionedUrl(this.baseUrl, asset.source.file, version);
  }

  getTextureKey(id) {
    const asset = this.getAsset(id);
    return asset?.runtime?.textureKey || asset?.runtime?.atlasKey || asset?.runtime?.audioKey || null;
  }

  getGeneratedTextureKey(id, { direction = "", frame = 0 } = {}) {
    const pattern = this.getAsset(id)?.runtime?.textureKeyPattern;
    return pattern ? pattern.replace("{direction}", direction).replace("{frame}", String(frame)) : null;
  }

  getAnimationKey(id) { return this.getAnimation(id)?.runtimeKey || null; }
  getAnimationsByAsset(assetId) { return this.manifest.animations.filter((animation) => animation.assetId === assetId); }

  recordFailure(code, message, context = {}) {
    const asset = context.assetId ? this.getAsset(context.assetId) : null;
    const failure = Object.freeze({
      code, message, assetId: context.assetId || null,
      manifestEntry: context.manifestEntry || (context.assetId ? `assets.${context.assetId}` : null),
      expected: context.expected ?? null, actual: context.actual ?? null,
      sceneId: context.sceneId || null, requiredness: context.requiredness || asset?.requiredness || null,
      ...context,
    });
    this.failures.push(failure);
    this.reporter?.error?.(`[KindWorks visual registry:${code}] ${message}`, failure);
    return failure;
  }

  fallbackAsset() { return this.getAsset(this.manifest.fallbacks[this.environment].assetId); }

  ensureFallbackTexture(scene, asset = this.fallbackAsset(), targetKey = asset?.runtime?.textureKey) {
    if (!scene?.textures || !targetKey || scene.textures.exists(targetKey)) return targetKey;
    const development = this.environment === "development";
    const size = development ? 64 : 32;
    const texture = scene.textures.createCanvas(targetKey, size, size);
    const context = texture?.context;
    if (context) {
      context.fillStyle = development ? "#ff00c8" : "#5b6470"; context.fillRect(0, 0, size, size);
      context.fillStyle = development ? "#141414" : "#cfd4d8";
      context.fillRect(0, 0, size / 2, size / 2); context.fillRect(size / 2, size / 2, size / 2, size / 2);
      context.strokeStyle = "#ffffff"; context.lineWidth = Math.max(2, size / 12);
      context.beginPath(); context.moveTo(size / 8, size / 8); context.lineTo(size * 7 / 8, size * 7 / 8); context.moveTo(size * 7 / 8, size / 8); context.lineTo(size / 8, size * 7 / 8); context.stroke();
    }
    texture?.refresh?.();
    return targetKey;
  }

  claimCacheKey(asset, key, scene) {
    const current = this.cacheOwners.get(key);
    const next = { assetId: asset.id, fingerprint: fingerprint(asset), scope: asset.lifecycle.scope, refs: (current?.refs || 0) + 1 };
    if (current && (current.assetId !== asset.id || current.fingerprint !== next.fingerprint)) {
      this.recordFailure("runtime-cache-key-collision", `Cache key ${key} is already owned by ${current.assetId}.`, { assetId: asset.id, sceneId: sceneIdOf(scene), expected: `${asset.id}@${next.fingerprint}`, actual: `${current.assetId}@${current.fingerprint}` });
      return false;
    }
    this.cacheOwners.set(key, next);
    return true;
  }

  retainForScene(scene, asset, key) {
    if (!scene || !key) return;
    const retained = this.sceneRetains.get(scene) || new Map();
    if (retained.has(asset.id)) return;
    retained.set(asset.id, key);
    this.sceneRetains.set(scene, retained);
    if (!this.sceneCleanupInstalled.has(scene)) {
      scene.events?.once?.("shutdown", () => this.releaseScene(scene));
      this.sceneCleanupInstalled.add(scene);
    }
  }

  releaseScene(scene) {
    const retained = this.sceneRetains.get(scene);
    if (!retained) return;
    for (const [assetId, key] of retained) {
      const asset = this.getAsset(assetId), owner = this.cacheOwners.get(key);
      if (!owner) continue;
      owner.refs = Math.max(0, owner.refs - 1);
      if (owner.refs === 0 && asset?.lifecycle?.scope === VISUAL_CACHE_SCOPES.SCENE) {
        if (asset.kind === VISUAL_ASSET_KINDS.AUDIO) scene.cache?.audio?.remove?.(key);
        else scene.textures?.remove?.(key);
        this.nativeImages.delete(assetId);
        this.cacheOwners.delete(key);
      }
    }
    this.sceneRetains.delete(scene);
    this.sceneCleanupInstalled.delete(scene);
  }

  queuePhaserAsset(scene, id) {
    const asset = this.getAsset(id), sceneId = sceneIdOf(scene);
    if (!asset) {
      this.recordFailure("unknown-asset", `Unknown semantic asset ${id}.`, { assetId: id, sceneId, expected: "registered semantic id", actual: id });
      return this.ensureFallbackTexture(scene);
    }
    const key = asset.runtime?.textureKey || asset.runtime?.atlasKey || asset.runtime?.audioKey;
    if (!key || ![VISUAL_ASSET_KINDS.IMAGE, VISUAL_ASSET_KINDS.SPRITESHEET, VISUAL_ASSET_KINDS.ATLAS, VISUAL_ASSET_KINDS.AUDIO].includes(asset.kind)) {
      this.recordFailure("unsupported-phaser-load", `${id} cannot be queued as a Phaser file asset.`, { assetId: id, sceneId, expected: "image, spritesheet, atlas, or audio", actual: asset.kind });
      return this.ensureFallbackTexture(scene);
    }
    const alreadyRetained = this.sceneRetains.get(scene)?.has(asset.id);
    if (!alreadyRetained && !this.claimCacheKey(asset, key, scene)) return this.ensureFallbackTexture(scene);
    if (!alreadyRetained) this.retainForScene(scene, asset, key);
    const cacheExists = asset.kind === VISUAL_ASSET_KINDS.AUDIO ? scene.cache?.audio?.exists?.(key) : scene.textures?.exists?.(key);
    if (cacheExists) return key;
    const onLoadError = (file) => {
      if (file?.key !== key) return;
      scene.load.off?.("loaderror", onLoadError);
      this.recordFailure("runtime-load-failed", `${id} failed to load from ${asset.source.file}.`, { assetId: id, sceneId, expected: `${asset.source.format} ${asset.technical?.width || ""}x${asset.technical?.height || ""}`.trim(), actual: "loaderror", file: asset.source.file });
      if (asset.kind !== VISUAL_ASSET_KINDS.AUDIO) this.ensureFallbackTexture(scene, this.fallbackAsset(), key);
    };
    scene.load.on?.("loaderror", onLoadError);
    scene.events?.once?.("shutdown", () => scene.load.off?.("loaderror", onLoadError));
    const url = this.assetUrl(id);
    if (asset.kind === VISUAL_ASSET_KINDS.SPRITESHEET) scene.load.spritesheet(key, url, { frameWidth: asset.technical.frameWidth, frameHeight: asset.technical.frameHeight });
    else if (asset.kind === VISUAL_ASSET_KINDS.ATLAS) scene.load.atlas(key, url, versionedUrl(this.baseUrl, asset.source.atlasFile, asset.source.atlasSha256?.slice(0, 12) || this.manifest.revision));
    else if (asset.kind === VISUAL_ASSET_KINDS.AUDIO) scene.load.audio(key, url);
    else scene.load.image(key, url);
    return key;
  }

  queueScenePacks(scene, sceneId = sceneIdOf(scene)) {
    const packs = this.getScenePacksByScene(sceneId);
    for (const pack of packs) for (const assetId of pack.assetIds || []) {
      const asset = this.getAsset(assetId);
      if (asset?.source?.kind === "file" && asset.runtime?.renderTarget === "phaser") this.queuePhaserAsset(scene, assetId);
    }
    return packs;
  }

  createSceneAnimations(scene, sceneId = sceneIdOf(scene)) {
    for (const pack of this.getScenePacksByScene(sceneId)) for (const animationId of pack.animationIds || []) {
      const animation = this.getAnimation(animationId);
      if (!animation || scene.anims?.exists?.(animation.runtimeKey)) continue;
      scene.anims?.create?.({ key: animation.runtimeKey, frames: animation.frames.map((frame) => ({ key: frame.textureKey || this.getTextureKey(animation.assetId), frame: frame.frameName ?? frame.frame })), frameRate: animation.frameRate, repeat: animation.repeat });
    }
  }

  async loadNativeAsset(id, { sceneId = null, ImageCtor = globalThis.Image } = {}) {
    const asset = this.getAsset(id);
    if (!asset || asset.source?.kind !== "file" || asset.runtime?.renderTarget !== "canvas") throw new Error(`Asset ${id} is not a registered Canvas file asset.`);
    const cached = this.nativeImages.get(id);
    if (cached?.fingerprint === fingerprint(asset)) return cached.image;
    if (typeof ImageCtor !== "function") throw new Error(`No Image constructor is available for ${id}.`);
    const image = await new Promise((resolve, reject) => {
      const next = new ImageCtor();
      next.decoding = "async";
      next.addEventListener("load", () => resolve(next), { once: true });
      next.addEventListener("error", () => reject(new Error(`${id} failed to load from ${asset.source.file}`)), { once: true });
      next.src = this.assetUrl(id);
    });
    const actual = `${image.naturalWidth || image.width}x${image.naturalHeight || image.height}`;
    const expected = `${asset.technical.width}x${asset.technical.height}`;
    if (actual !== expected) {
      this.recordFailure("runtime-dimension-mismatch", `${id} loaded with incompatible dimensions.`, { assetId: id, sceneId, expected, actual });
      throw new Error(`${id} expected ${expected}; received ${actual}`);
    }
    this.nativeImages.set(id, { fingerprint: fingerprint(asset), image });
    return image;
  }

  async loadNativeScenePacks(sceneId, options = {}) {
    const result = new Map();
    for (const pack of this.getScenePacksByScene(sceneId)) for (const assetId of pack.assetIds || []) {
      const asset = this.getAsset(assetId);
      if (asset?.runtime?.renderTarget !== "canvas") continue;
      try { result.set(assetId, await this.loadNativeAsset(assetId, { ...options, sceneId })); }
      catch (error) {
        this.recordFailure("runtime-native-load-failed", error.message, { assetId, sceneId, expected: asset.source.file, actual: "loaderror" });
        if (asset.requiredness === VISUAL_ASSET_REQUIREDNESS.GAMEPLAY_CRITICAL) error.gameplayCritical = true;
        throw error;
      }
    }
    return result;
  }

  tagSceneInstance(displayObject, instanceId) {
    const instance = this.getSceneInstance(instanceId);
    if (!instance) {
      this.recordFailure("unknown-scene-instance", `Unknown scene-instance id ${instanceId}.`, { actual: instanceId });
      return displayObject;
    }
    displayObject?.setData?.("visualInstanceId", instance.id);
    displayObject?.setData?.("visualPrefabId", instance.prefabId);
    return displayObject;
  }
}

export function createVisualRegistry(options = {}) { return new VisualRegistry(options); }
