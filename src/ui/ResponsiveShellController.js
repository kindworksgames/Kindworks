export const LANDSCAPE_MESSAGE = "Turn your device sideways to play.";
export const PORTRAIT_MESSAGE = "Turn your device upright to play.";
export const PORTRAIT_ONLY_SCENES = new Set(["RiverClearoutScene"]);
export const PORTRAIT_SUPPORTED_SCENES = PORTRAIT_ONLY_SCENES;

export function shouldPauseForOrientation({ width, height, sceneKey } = {}) {
  const measuredWidth = Number(width) || 0;
  const measuredHeight = Number(height) || 0;
  if (!sceneKey || sceneKey === "BootScene") return false;
  if (PORTRAIT_ONLY_SCENES.has(sceneKey)) return measuredWidth > measuredHeight;
  return measuredHeight > measuredWidth;
}

export const shouldPauseForPortrait = shouldPauseForOrientation;

function viewportSize(windowObject, documentObject) {
  const root = documentObject?.documentElement;
  return {
    width: Math.max(0, Number(windowObject?.innerWidth) || Number(root?.clientWidth) || 0),
    height: Math.max(0, Number(windowObject?.innerHeight) || Number(root?.clientHeight) || 0),
  };
}

export class ResponsiveShellController {
  constructor(game, {
    windowObject = window,
    documentObject = document,
    worldSimulation = null,
    npcTownLife = null,
    municipalCollection = null,
  } = {}) {
    this.game = game;
    this.window = windowObject;
    this.document = documentObject;
    this.worldSimulation = worldSimulation;
    this.npcTownLife = npcTownLife;
    this.municipalCollection = municipalCollection;
    this.blocked = false;
    this.started = false;
    this.observer = null;
    this.update = this.update.bind(this);
  }

  start() {
    if (this.started) return this;
    this.started = true;
    this.window.addEventListener("resize", this.update, { passive: true });
    this.window.addEventListener("orientationchange", this.update, { passive: true });
    if (typeof MutationObserver === "function" && this.document?.body) {
      this.observer = new MutationObserver(this.update);
      this.observer.observe(this.document.body, { attributes: true, attributeFilter: ["data-game-scene"] });
    }
    this.update();
    return this;
  }

  destroy() {
    if (!this.started) return;
    this.window.removeEventListener("resize", this.update);
    this.window.removeEventListener("orientationchange", this.update);
    this.observer?.disconnect();
    this.observer = null;
    if (this.blocked) this.applyBlocked(false);
    this.started = false;
  }

  activeSceneKey() {
    const bodyScene = this.document?.body?.dataset?.gameScene;
    if (bodyScene) return bodyScene;
    return this.game?.scene?.getScenes?.(true)?.[0]?.scene?.key || "";
  }

  update() {
    const sceneKey = this.activeSceneKey();
    const size = viewportSize(this.window, this.document);
    const blocked = shouldPauseForOrientation({ ...size, sceneKey });
    const portraitOnly = PORTRAIT_ONLY_SCENES.has(sceneKey);
    const message = this.document?.querySelector?.("#landscape-required-message");
    if (message) message.textContent = portraitOnly ? PORTRAIT_MESSAGE : LANDSCAPE_MESSAGE;
    if (this.document?.body) {
      this.document.body.dataset.orientationMode = blocked ? "rotate-device" : "play";
      this.document.body.dataset.orientationScene = sceneKey || "loading";
      this.document.body.dataset.orientationExpected = portraitOnly ? "portrait" : "landscape";
    }
    if (blocked !== this.blocked) this.applyBlocked(blocked);
    return { blocked, sceneKey, ...size };
  }

  applyBlocked(blocked) {
    this.blocked = blocked;
    if (this.document?.body) this.document.body.dataset.orientationBlocked = String(blocked);
    this.worldSimulation?.setPaused?.("orientation", blocked, { persist: blocked, resolveOffline: false });
    this.npcTownLife?.setPaused?.("orientation", blocked);
    this.municipalCollection?.setPaused?.("orientation", blocked);

    if (blocked) {
      const activeElement = this.document?.activeElement;
      if (activeElement && activeElement !== this.document.body) activeElement.blur?.();
      this.game?.loop?.sleep?.();
      return;
    }

    this.game?.loop?.wake?.();
    this.game?.scale?.refresh?.();
  }
}
