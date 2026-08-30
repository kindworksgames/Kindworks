import { getLawnLevel, lawnCellKey } from "../data/lawnCare.js";

const position = (x, y, extra = {}) => ({ position: { x, y }, visible: true, ...extra });

function boardMetrics(level) {
  const cell = Math.max(28, Math.min(64, Math.floor(860 / level.width), Math.floor(540 / level.height)));
  const width = cell * level.width, height = cell * level.height;
  return { cell, left: (1280 - width) / 2, top: (720 - height) / 2 };
}

/** Lawn presentation bindings derive cells from the engine without changing it. */
export function createLawnApprovedSceneBindings(scene) {
  return {
    placementResolver(instance, binding) {
      const session = scene.lawnCare?.getActiveSession?.();
      if (!session) return [];
      const state = scene.lawnCare?.getSessionState?.();
      const level = getLawnLevel(session.assignedLevel);
      const metrics = boardMetrics(level);
      const centre = (row, col, extra = {}) => position(metrics.left + (col + 0.5) * metrics.cell, metrics.top + (row + 0.5) * metrics.cell, { displaySize: { width: metrics.cell, height: metrics.cell }, ...extra });
      if (binding.repeat === "existing-level-grid") {
        const cut = new Set(state?.cutCells || []);
        return level.rows.flatMap((rowValue, row) => [...rowValue].map((cell, col) => {
          const key = lawnCellKey(row, col);
          const stateName = cell === "#" ? "hedge" : cut.has(key) ? (["L", "R"].includes(state?.cutDirections?.[key]) ? "cut-horizontal" : "cut-vertical") : "tall";
          return centre(row, col, { stateName });
        }));
      }
      if (binding.repeat === "level-weed-cells") {
        const cut = new Set(state?.cutCells || []);
        return [...level.weeds.entries()].map(([key, weed]) => {
          const [row, col] = key.split(",").map(Number);
          return centre(row, col, { stateName: weed, visible: !cut.has(key) });
        });
      }
      if (binding.dynamicPosition) {
        const facing = ({ D: "down", L: "left", R: "right", U: "up" })[String(state.facing || "D").toUpperCase()] || "down";
        return [centre(state.row, state.col, { stateName: facing, facing })];
      }
      if (binding.mode === "responsive") return [position(1215, 48, { frame: 0 }), position(580, 676, { frame: 1 }), position(700, 676, { frame: 2 })];
      if (binding.mode === "presentation-only") return [position(instance.position.x, instance.position.y)];
      if (binding.mode === "event") return [position(instance.position.x, instance.position.y, { visible: false })];
      return null;
    },
    stateResolver(_instance, placement) { return placement?.stateName || null; },
  };
}
