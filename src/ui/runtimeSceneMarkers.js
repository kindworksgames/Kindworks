const developmentMarkersEnabled = import.meta.env?.DEV ?? true;

export function setRuntimeSceneMarkers(documentObject, sceneKey) {
  const key = String(sceneKey || "");
  if (!key) throw new TypeError("A scene key is required.");
  if (documentObject?.body?.dataset) documentObject.body.dataset.gameScene = key;
  const game = documentObject?.querySelector?.("#game");
  if (developmentMarkersEnabled && game?.dataset) game.dataset.scene = key;
  return {
    bodyScene: documentObject?.body?.dataset?.gameScene || null,
    rootScene: game?.dataset?.scene || null,
  };
}
