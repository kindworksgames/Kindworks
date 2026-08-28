export function fitWasteCardLayout(tiles, world, { margin = 120, maxScale = 1.45 } = {}) {
  const active = tiles.filter((tile) => !tile.removed);
  if (!active.length) return { scale: 1, bounds: null, cards: [] };
  const minX = Math.min(...active.map((tile) => tile.x));
  const minY = Math.min(...active.map((tile) => tile.y));
  const maxX = Math.max(...active.map((tile) => tile.x + world.cardWidth));
  const maxY = Math.max(...active.map((tile) => tile.y + world.cardHeight));
  const sourceWidth = Math.max(world.cardWidth, maxX - minX);
  const sourceHeight = Math.max(world.cardHeight, maxY - minY);
  const availableWidth = Math.max(world.cardWidth, world.width - margin * 2);
  const availableHeight = Math.max(world.cardHeight, world.height - margin * 2);
  const scale = Math.min(maxScale, availableWidth / sourceWidth, availableHeight / sourceHeight);
  const renderedWidth = sourceWidth * scale;
  const renderedHeight = sourceHeight * scale;
  const offsetX = (world.width - renderedWidth) / 2;
  const offsetY = (world.height - renderedHeight) / 2;
  return {
    scale,
    bounds: { minX, minY, maxX, maxY, sourceWidth, sourceHeight },
    cards: active.map((tile) => ({
      id: tile.id,
      x: offsetX + (tile.x - minX) * scale,
      y: offsetY + (tile.y - minY) * scale,
      width: world.cardWidth * scale,
      height: world.cardHeight * scale,
    })),
  };
}
