const COLOURS = Object.freeze({
  collisions: 0xff4f5f, navigationObstacles: 0x8b5cf6, interactionZones: 0xffd84d,
  touchTargets: 0x41d9ff, triggerRegions: 0xff8a3d, occlusionZones: 0x3df28b,
  spawnPoints: 0xffffff, standingPoints: 0x47ff6b,
});

function drawEntry(graphics, entry, colour) {
  graphics.lineStyle(2, colour, 0.92);
  if (entry.kind === "rect") graphics.strokeRect(entry.x, entry.y, entry.width, entry.height);
  else if (entry.kind === "circle") graphics.strokeCircle(entry.x, entry.y, entry.radius);
  else {
    graphics.lineBetween(entry.x - 8, entry.y, entry.x + 8, entry.y);
    graphics.lineBetween(entry.x, entry.y - 8, entry.x, entry.y + 8);
  }
}

function renderScene(scene) {
  const contract = scene?.gameplayGeometry;
  if (!contract || scene.__gameplayGeometryOverlay) return;
  const graphics = scene.add.graphics().setDepth(999999).setScrollFactor(1);
  graphics.setData("developmentOnly", true);
  for (const [group, colour] of Object.entries(COLOURS)) {
    for (const entry of contract[group] || []) drawEntry(graphics, entry, colour);
  }
  if (contract.worldBounds) drawEntry(graphics, contract.worldBounds, 0xffffff);
  scene.__gameplayGeometryOverlay = graphics;
  scene.events.once("shutdown", () => {
    graphics.destroy();
    scene.__gameplayGeometryOverlay = null;
  });
}

export function installGameplayGeometryDebug(game) {
  let visible = true;
  const refresh = () => {
    for (const scene of game.scene.getScenes(true)) {
      renderScene(scene);
      scene.__gameplayGeometryOverlay?.setVisible(visible);
    }
  };
  game.events.on("poststep", refresh);
  window.addEventListener("keydown", (event) => {
    if (event.key.toLowerCase() !== "g") return;
    visible = !visible;
    refresh();
  });
  document.body.dataset.geometryDebug = "true";
  return Object.freeze({ refresh, get visible() { return visible; } });
}

