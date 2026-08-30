/**
 * Read-only metrics exposed only when VITE_KW_TEST_METRICS=1 at build time.
 * It deliberately provides no scene mutation, state, save, or debug control.
 */
export function installTestMetricsBridge(game, target = globalThis) {
  const bridge = Object.freeze({
    snapshot() {
      const active = game.scene?.getScenes?.(true) || [];
      return Object.freeze({
        fps: game.loop?.actualFps ?? null,
        textures: game.textures?.list ? Object.keys(game.textures.list).length : null,
        scenes: Object.freeze(active.map((scene) => Object.freeze({
          key: scene.scene?.key || null,
          children: scene.children?.list?.length ?? null,
          timers: scene.time?.getAllEvents?.().length ?? null,
          approvedVisuals: scene.approvedSceneVisuals?.records?.size ?? 0,
        }))),
      });
    },
  });
  Object.defineProperty(target, "__KINDWORKS_TEST_METRICS__", { configurable: true, value: bridge });
  game.events?.once?.("destroy", () => { try { delete target.__KINDWORKS_TEST_METRICS__; } catch {} });
  return bridge;
}
