export class LegacyCompatibility {
  constructor(manifest, assetById, animationById, { onUnknown = null } = {}) {
    this.manifest = manifest;
    this.assetById = assetById;
    this.animationById = animationById;
    this.textureByLegacyKey = new Map((manifest.legacyCompatibility?.textureKeys || []).map((entry) => [entry.legacyKey, entry.semanticId]));
    this.animationByLegacyKey = new Map((manifest.legacyCompatibility?.animationKeys || []).map((entry) => [entry.legacyKey, entry.semanticId]));
    this.onUnknown = onUnknown;
    this.unknownPassThroughs = new Map();
  }

  semanticAssetId(legacyKey) {
    return this.textureByLegacyKey.get(legacyKey) || null;
  }

  semanticAnimationId(legacyKey) {
    return this.animationByLegacyKey.get(legacyKey) || null;
  }

  resolveTextureKey(legacyKey) {
    const semanticId = this.semanticAssetId(legacyKey);
    if (!semanticId) this.#recordUnknown("texture", legacyKey);
    return semanticId ? this.assetById.get(semanticId)?.runtime?.textureKey || legacyKey : legacyKey;
  }

  resolveAnimationKey(legacyKey) {
    const semanticId = this.semanticAnimationId(legacyKey);
    if (!semanticId) this.#recordUnknown("animation", legacyKey);
    return semanticId ? this.animationById.get(semanticId)?.runtimeKey || legacyKey : legacyKey;
  }

  #recordUnknown(kind, key) {
    const id = `${kind}:${key}`;
    const count = (this.unknownPassThroughs.get(id)?.count || 0) + 1;
    const record = Object.freeze({ kind, key, count });
    this.unknownPassThroughs.set(id, record);
    if (count === 1) this.onUnknown?.(record);
  }

  getMigrationDebt() { return [...this.unknownPassThroughs.values()].map((entry) => ({ ...entry })); }
}
