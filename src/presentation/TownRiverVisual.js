import { VISUAL_ASSET_IDS } from "../visual/visualManifest.js";

const RIVER_MASK_TEXTURE_KEY = "visual.town.river.channel-mask";
const RIVER_MASK_RESOLUTION = 0.5;

function pathBounds(path, padding) {
  const xs = path.map(([x]) => x);
  const ys = path.map(([, y]) => y);
  return {
    left: Math.min(...xs) - padding,
    right: Math.max(...xs) + padding,
    top: Math.min(...ys) - padding,
    bottom: Math.max(...ys) + padding,
  };
}

/**
 * Presentation-only animated water. The supplied authored path remains the
 * single owner of river collision, navigation, wildlife and rubbish flow.
 */
export function createTownRiverWaterVisual(scene, { path, waterWidth, depth = 5.5, flowPixelsPerSecond = 18 } = {}) {
  const registry = scene.registry.get("visualRegistry");
  const textureKey = registry?.getTextureKey?.(VISUAL_ASSET_IDS.TOWN_RIVER_WATER_TILE);
  if (!textureKey || !scene.textures.exists(textureKey)) return null;

  const padding = waterWidth / 2 + 8;
  const bounds = pathBounds(path, padding);
  const width = Math.ceil(bounds.right - bounds.left);
  const height = Math.ceil(bounds.bottom - bounds.top);
  const water = scene.add.tileSprite(bounds.left, bounds.top, width, height, textureKey)
    .setOrigin(0)
    .setTileScale(0.25)
    .setDepth(depth)
    .setData({
      semanticAssetId: VISUAL_ASSET_IDS.TOWN_RIVER_WATER_TILE,
      excludeFromStaticTownBackdrop: true,
      visualOnly: true,
    });

  // Phaser 4 creates the per-object filter lists lazily. Enabling them before
  // adding the channel mask is required on a fresh page load (not only HMR).
  water.enableFilters?.();
  if (!water.filters?.internal) {
    water.destroy();
    return null;
  }

  if (scene.textures.exists(RIVER_MASK_TEXTURE_KEY)) scene.textures.remove(RIVER_MASK_TEXTURE_KEY);
  const maskTexture = scene.textures.createCanvas(
    RIVER_MASK_TEXTURE_KEY,
    Math.max(1, Math.ceil(width * RIVER_MASK_RESOLUTION)),
    Math.max(1, Math.ceil(height * RIVER_MASK_RESOLUTION)),
  );
  const context = maskTexture.context;
  context.clearRect(0, 0, maskTexture.width, maskTexture.height);
  context.strokeStyle = "#ffffff";
  context.lineWidth = waterWidth * RIVER_MASK_RESOLUTION;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.beginPath();
  path.forEach(([x, y], index) => {
    const localX = (x - bounds.left) * RIVER_MASK_RESOLUTION;
    const localY = (y - bounds.top) * RIVER_MASK_RESOLUTION;
    if (index === 0) context.moveTo(localX, localY);
    else context.lineTo(localX, localY);
  });
  context.stroke();
  maskTexture.refresh();

  // A static internal Phaser 4 mask matches this TileSprite's local bounds.
  // It avoids the unsupported Phaser 3 WebGL mask path and remains completely
  // independent of the replacement artwork's canvas dimensions.
  const mask = water.filters.internal.addMask(RIVER_MASK_TEXTURE_KEY);

  const update = (_time, delta) => {
    // Phaser samples tile textures in the opposite direction to their visual
    // travel, so decreasing tilePositionY makes the water move downstream.
    water.tilePositionY -= flowPixelsPerSecond * Math.min(delta, 50) / 1000;
  };
  scene.events.on("update", update);
  scene.events.once("shutdown", () => {
    scene.events.off("update", update);
    water.filters.internal.remove(mask, true);
    scene.textures.remove(RIVER_MASK_TEXTURE_KEY);
  });

  return water;
}
