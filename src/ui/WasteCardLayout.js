export const WASTE_BOARD_PADDING = 24;
export const WASTE_BOARD_MIN_SCALE = 0.12;
export const WASTE_BOARD_MAX_SCALE = 0.9;

export function computeWasteBoardBounds(tiles, world, { padding = WASTE_BOARD_PADDING } = {}) {
  const active = tiles.filter((tile) => !tile.removed);
  if (!active.length) return { left: 0, top: 0, width: world.width, height: world.height };
  const minX = Math.min(...active.map((tile) => tile.x));
  const minY = Math.min(...active.map((tile) => tile.y));
  const maxX = Math.max(...active.map((tile) => tile.x + world.cardWidth));
  const maxY = Math.max(...active.map((tile) => tile.y + world.cardHeight));
  const left = Math.max(0, minX - padding);
  const top = Math.max(0, minY - padding);
  const right = Math.min(world.width, maxX + padding);
  const bottom = Math.min(world.height, maxY + padding);
  return {
    left,
    top,
    width: Math.max(world.cardWidth, right - left),
    height: Math.max(world.cardHeight, bottom - top),
  };
}

// Authored HTML contract: presentation is a translated crop of the source
// coordinates. Individual cards must never be redistributed independently.
export function fitWasteCardLayout(tiles, world, options = {}) {
  const bounds = computeWasteBoardBounds(tiles, world, options);
  const cards = tiles.filter((tile) => !tile.removed).map((tile) => ({
    id: tile.id,
    x: tile.x - bounds.left,
    y: tile.y - bounds.top,
    width: world.cardWidth,
    height: world.cardHeight,
    layer: tile.layer,
    rotation: tile.rotation,
  }));
  return { scale: 1, bounds, cards };
}

export function fitWasteBoardToViewport(bounds, viewportWidth, viewportHeight, {
  minimumScale = WASTE_BOARD_MIN_SCALE,
  maximumScale = WASTE_BOARD_MAX_SCALE,
} = {}) {
  const width = Math.max(0, Number(viewportWidth) || 0);
  const height = Math.max(0, Number(viewportHeight) || 0);
  if (!width || !height || !bounds?.width || !bounds?.height) {
    return { scale: 1, width: bounds?.width || 0, height: bounds?.height || 0 };
  }
  const scale = Math.max(minimumScale, Math.min(maximumScale, width / bounds.width, height / bounds.height));
  return { scale, width: bounds.width * scale, height: bounds.height * scale };
}

export function wasteRenderedCardsOverlap(a, b, { margin = 10 } = {}) {
  return a.x + margin < b.x + b.width - margin
    && a.x + a.width - margin > b.x + margin
    && a.y + margin < b.y + b.height - margin
    && a.y + a.height - margin > b.y + margin;
}

export function wasteRenderedCardExposed(cards, card) {
  if (!card) return false;
  return !cards.some((other) => other.id !== card.id && other.layer > card.layer && wasteRenderedCardsOverlap(card, other));
}
