const finite = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;

export function cardinalDirection(dx, dy, threshold = 24) {
  const horizontal = finite(dx);
  const vertical = finite(dy);
  if (Math.max(Math.abs(horizontal), Math.abs(vertical)) < Math.max(0, finite(threshold))) return null;
  if (Math.abs(horizontal) > Math.abs(vertical)) return horizontal > 0 ? "R" : "L";
  return vertical > 0 ? "D" : "U";
}

export function riverGestureAction({ dx, dy, elapsed = 0, movedHorizontal = false } = {}) {
  if (movedHorizontal || finite(elapsed) > 1200) return null;
  const horizontal = finite(dx);
  const vertical = finite(dy);
  const absX = Math.abs(horizontal);
  const absY = Math.abs(vertical);
  if (Math.max(absX, absY) < 22) return "rotate";
  if (absY > absX) {
    if (vertical > 70) return "drop";
    if (vertical > 0) return "down";
    return "rotate";
  }
  return horizontal < 0 ? "left" : "right";
}
