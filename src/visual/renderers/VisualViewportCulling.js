// Presentation-only bounds. These values are intentionally kept outside
// gameplay scenes so artwork dimensions can never become collision,
// navigation, interaction, trigger, or save geometry.
export function snapshotVisualBounds(object) {
  if (!object?.visible || typeof object.getBounds !== "function") return null;
  const bounds = object.getBounds();
  if (![bounds.x, bounds.y, bounds.width, bounds.height].every(Number.isFinite)) return null;
  return Object.freeze({
    object,
    left: bounds.x,
    top: bounds.y,
    right: bounds.x + bounds.width,
    bottom: bounds.y + bounds.height,
  });
}

export function isWithinCameraMargin(position, view, margin = 180) {
  return !view || (
    position.x >= view.x - margin && position.x <= view.right + margin
    && position.y >= view.y - margin && position.y <= view.bottom + margin
  );
}
