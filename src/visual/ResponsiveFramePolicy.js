export const DEFAULT_RENDER_FPS = 60;
export const DENSE_TOUCH_RENDER_FPS = 30;

export function renderFrameTarget({
  touchPoints = globalThis.navigator?.maxTouchPoints || 0,
  devicePixelRatio = globalThis.devicePixelRatio || 1,
} = {}) {
  // Dense touch displays shade substantially more physical pixels than the
  // logical Phaser canvas. A stable 30 Hz render cadence avoids an overloaded
  // 60 Hz loop oscillating between missed frames. Gameplay still advances from
  // elapsed milliseconds, so simulation speed and completion rules do not vary.
  return touchPoints > 0 && devicePixelRatio > 1
    ? DENSE_TOUCH_RENDER_FPS
    : DEFAULT_RENDER_FPS;
}

