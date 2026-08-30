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

// Reference-led presentation layout for the park board. This changes only the
// rendered positions: tile ids, layers, exposure rules and engine coordinates
// remain owned by WasteCollectionEngine.
export function scatterWasteCardLayout(tiles, world, { marginX = 44, marginY = 34, cardScale = 1.18 } = {}) {
  const active = tiles.filter((tile) => !tile.removed);
  const width = world.cardWidth * cardScale;
  const height = world.cardHeight * cardScale;
  const availableWidth = Math.max(width, world.width - marginX * 2 - width);
  const availableHeight = Math.max(height, world.height - marginY * 2 - height);
  const fraction = (value) => value - Math.floor(value);
  return {
    scale: cardScale,
    bounds: { minX: marginX, minY: marginY, maxX: world.width - marginX, maxY: world.height - marginY },
    cards: active.map((tile) => {
      const sourceX = Number(tile.x) / world.width;
      const sourceY = Number(tile.y) / world.height;
      const xPhase = fraction((tile.id + 1) * 0.61803398875 + tile.layer * 0.127 + tile.typeId * 0.037 + sourceX * 0.19);
      const yPhase = fraction((tile.id + 1) * 0.41421356237 + tile.layer * 0.173 + tile.typeId * 0.053 + sourceY * 0.23);
      return {
        id: tile.id,
        x: marginX + xPhase * availableWidth,
        y: marginY + yPhase * availableHeight,
        width,
        height,
      };
    }),
  };
}
