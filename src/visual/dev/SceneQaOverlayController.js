import { SUPPORTED_LANDSCAPE_VIEWPORTS, resolveHudSafeArea } from "../scale/scaleSystem.js";

const PANEL_ID = "kw-scene-qa";
const STYLE_ID = "kw-scene-qa-style";
const COLORS = Object.freeze({ collision: 0xff5a5a, navigation: 0xa96cff, interaction: 0xffc34d, touch: 0x44e3ea });

function el(tag, attrs = {}, text = "") {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) key === "checked" ? node.checked = value : node.setAttribute(key, value);
  if (text) node.textContent = text;
  return node;
}

function descendants(object, result = []) {
  if (!object) return result;
  result.push(object);
  for (const child of object.list || []) descendants(child, result);
  return result;
}

function activeGameplayScene(game) {
  return game.scene.getScenes(true).find((scene) => !["BootScene", "AssetLabScene", "ScaleCalibrationScene"].includes(scene.scene.key)) || null;
}

function geometryEntries(value) {
  if (!value) return [];
  if (value.kind) return [value];
  return Object.values(value).filter((entry) => entry?.kind);
}

function closestProfile(width, height) {
  return SUPPORTED_LANDSCAPE_VIEWPORTS.reduce((best, profile) => {
    const score = Math.abs(profile.width - width) + Math.abs(profile.height - height);
    return !best || score < best.score ? { profile, score } : best;
  }, null)?.profile;
}

export class SceneQaOverlayController {
  constructor(game, registry) {
    if (!import.meta.env.DEV) throw new Error("Scene QA overlays are development-only.");
    this.game = game;
    this.registry = registry;
    this.flags = {
      identities: true, depth: true, interaction: true, collision: true, navigation: true,
      npcPaths: true, safeAreas: true, cameraBounds: true, fallbacks: true, referenceOverlay: false,
    };
    this.#installPanel();
    this.timer = window.setInterval(() => this.redraw(), 250);
    this.redraw();
    document.body.dataset.sceneQaReady = "true";
  }

  #installPanel() {
    if (!document.querySelector(`#${STYLE_ID}`)) {
      const style = el("style", { id: STYLE_ID });
      style.textContent = `#${PANEL_ID}{position:fixed;z-index:100007;right:max(6px,env(safe-area-inset-right));top:max(6px,env(safe-area-inset-top));width:min(310px,42vw);max-height:calc(100dvh - 12px);overflow:auto;border:2px solid #9feeff;border-radius:9px;background:rgba(8,24,34,.96);color:#f5fbff;font:600 11px/1.3 system-ui;padding:8px;box-shadow:0 7px 26px #0009}#${PANEL_ID} h2{font-size:14px;margin:0 0 4px}#${PANEL_ID} .grid{display:grid;grid-template-columns:1fr 1fr;gap:4px}#${PANEL_ID} label{min-height:27px;display:flex;align-items:center;gap:4px;border:1px solid #446a79;border-radius:4px;padding:3px}#${PANEL_ID} output{display:block;margin-top:6px;white-space:pre-wrap;color:#bfeaf4}`;
      document.head.append(style);
    }
    const panel = el("aside", { id: PANEL_ID, "aria-label": "Development scene QA overlays" });
    panel.append(el("h2", {}, "Scene visual QA")); const grid = el("div", { class: "grid" });
    const labels = {
      identities: "Instance + prefab IDs", depth: "Depth + Y-sort", interaction: "Interaction + touch",
      collision: "Collision", navigation: "Navigation", npcPaths: "NPC paths + stations",
      safeAreas: "Safe areas + profile", cameraBounds: "Camera bounds", fallbacks: "Missing fallbacks", referenceOverlay: "Reference overlay",
    };
    for (const [key, label] of Object.entries(labels)) {
      const wrapper = el("label"); const input = el("input", { type: "checkbox", checked: this.flags[key] });
      input.addEventListener("change", () => { this.flags[key] = input.checked; this.redraw(); }); wrapper.append(input, label); grid.append(wrapper);
    }
    panel.append(grid); this.status = el("output", { "aria-live": "polite" }); panel.append(this.status); document.body.append(panel); this.panel = panel;
  }

  redraw() {
    const scene = activeGameplayScene(this.game);
    if (!scene) return;
    if (scene !== this.scene) {
      this.graphics?.destroy(); this.labels?.forEach((label) => label.destroy());
      this.scene = scene; this.graphics = scene.add.graphics().setDepth(9998).setScrollFactor(1).setData("developmentOnly", true); this.labels = [];
    }
    const graphics = this.graphics; graphics.clear(); this.labels.forEach((label) => label.destroy()); this.labels = [];
    const objects = scene.children.list.flatMap((object) => descendants(object, [])).filter((object, index, all) => all.indexOf(object) === index);
    const tagged = objects.filter((object) => object.getData?.("visualPrefabId") || object.getData?.("visualInstanceId") || object.getData?.("semanticAssetId"));
    for (const object of tagged) this.#drawSemanticObject(object);
    if (this.flags.interaction) for (const object of objects.filter((candidate) => candidate.input?.hitArea)) this.#drawInput(object);
    if (this.flags.collision) for (const object of objects.filter((candidate) => candidate.body)) this.#drawBody(object);
    if (this.flags.npcPaths) this.#drawNpcPaths(objects);
    if (this.flags.safeAreas) this.#drawSafeArea(scene);
    if (this.flags.cameraBounds) this.#drawCameraBounds(scene);
    if (scene.referenceOverlay?.setMode) scene.referenceOverlay.setMode(this.flags.referenceOverlay ? "overlay" : "live");
    const profile = closestProfile(window.innerWidth, window.innerHeight);
    const fallbackCount = tagged.filter((object) => String(object.texture?.key || "").includes("fallback")).length + this.registry.getFailures().length;
    if (this.flags.fallbacks && fallbackCount) for (const object of tagged.filter((candidate) => String(candidate.texture?.key || "").includes("fallback"))) graphics.lineStyle(4, 0xff36dc, 1).strokeRect(object.x - 35, object.y - 35, 70, 70);
    document.body.dataset.sceneQaScene = scene.scene.key; document.body.dataset.sceneQaProfile = profile?.id || "custom"; document.body.dataset.sceneQaTagged = String(tagged.length); document.body.dataset.sceneQaFallbacks = String(fallbackCount);
    this.status.textContent = `${scene.scene.key}\n${profile?.id || "custom"} · ${window.innerWidth}×${window.innerHeight}\n${tagged.length} semantic objects · ${fallbackCount} fallback warning(s)`;
  }

  #drawSemanticObject(object) {
    const prefabId = object.getData?.("visualPrefabId"); const instanceId = object.getData?.("visualInstanceId");
    const contract = object.getData?.("candidateContract");
    const prefab = (prefabId ? this.registry.getPrefab(prefabId) : null) || (contract ? {
      geometry: contract.geometry,
      sockets: Object.fromEntries((contract.sockets || []).map((socket) => [socket.id || socket.name, socket])),
      groundContactAnchor: contract.anchor?.groundContact || { x: 0, y: 0 },
    } : null);
    const x = object.x || 0, y = object.y || 0;
    if (this.flags.identities) {
      const text = this.scene.add.text(x, y - 52, `${instanceId || object.getData?.("semanticAssetId") || "semantic"}\n${prefabId || "no-prefab"}`, { color: "#effcff", fontFamily: "ui-monospace,monospace", fontSize: "8px", backgroundColor: "rgba(8,28,40,.88)", padding: { x: 3, y: 2 } }).setOrigin(0.5, 1).setDepth(9999);
      this.labels.push(text);
    }
    if (this.flags.depth) { const groundY = y + Number(prefab?.groundContactAnchor?.y || 0); this.graphics.lineStyle(2, 0xffef75, 0.9).lineBetween(x - 12, groundY, x + 12, groundY); }
    for (const [kind, enabled] of [["collision", this.flags.collision], ["navigation", this.flags.navigation], ["interaction", this.flags.interaction], ["touch", this.flags.interaction]]) {
      if (!enabled) continue; for (const geometry of geometryEntries(prefab?.geometry?.[kind])) this.#drawGeometry(geometry, x, y, COLORS[kind] || COLORS.interaction);
    }
    if (this.flags.npcPaths) for (const socket of Object.values(prefab?.sockets || {})) this.graphics.lineStyle(2, 0x8dff8a, 0.9).strokeCircle(x + socket.x, y + socket.y, 5);
  }

  #drawGeometry(geometry, x, y, color) {
    if (geometry.kind === "circle") this.graphics.lineStyle(2, color, 0.75).strokeCircle(x + geometry.x, y + geometry.y, geometry.radius);
    else if (geometry.kind === "rectangle") this.graphics.lineStyle(2, color, 0.75).strokeRect(x + geometry.x, y + geometry.y, geometry.width, geometry.height);
  }

  #drawInput(object) {
    const bounds = object.getBounds?.(); if (!bounds) return;
    this.graphics.lineStyle(1.5, COLORS.touch, 0.35).strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
  }

  #drawBody(object) {
    const body = object.body; if (!body) return;
    this.graphics.lineStyle(1.5, COLORS.collision, 0.45).strokeRect(body.x || object.x, body.y || object.y, body.width || 1, body.height || 1);
  }

  #drawNpcPaths(objects) {
    for (const object of objects.filter((candidate) => candidate.residentId || candidate.getData?.("npcId"))) {
      const path = object.getData?.("npcPath") || object.route || [];
      if (Array.isArray(path) && path.length > 1) this.graphics.lineStyle(2, 0x7cffbd, 0.65).strokePoints(path, false);
      const target = object.getData?.("stationTarget") || object.stationTarget;
      if (target?.x != null) this.graphics.lineStyle(2, 0x7cffbd, 0.9).lineBetween(object.x, object.y, target.x, target.y).strokeCircle(target.x, target.y, 6);
    }
  }

  #drawSafeArea(scene) {
    const safe = resolveHudSafeArea({ width: scene.scale.width, height: scene.scale.height });
    this.graphics.lineStyle(2, 0x6dff83, 0.8).strokeRect(safe.x, safe.y, safe.width, safe.height);
  }

  #drawCameraBounds(scene) {
    const camera = scene.cameras.main; const bounds = camera.getBounds?.() || camera._bounds;
    if (bounds?.width) this.graphics.lineStyle(3, 0x77b9ff, 0.7).strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
  }

  destroy() {
    window.clearInterval(this.timer); this.graphics?.destroy(); this.labels?.forEach((label) => label.destroy()); this.panel?.remove(); document.querySelector(`#${STYLE_ID}`)?.remove();
    for (const key of ["sceneQaReady", "sceneQaScene", "sceneQaProfile", "sceneQaTagged", "sceneQaFallbacks"]) delete document.body.dataset[key];
  }
}
