import Phaser from "phaser";
import {
  exportSceneLayout,
  getSceneLayoutInstance,
  moveSceneLayoutInstance,
  validateSceneLayout,
} from "../layouts/sceneLayoutContracts.js";
import {
  REFERENCE_CONTRACTS,
  computeRgbaDifference,
  validateReferenceDescriptor,
} from "./referenceComparison.js";

const PANEL_ID = "kw-reference-overlay";
const STYLE_ID = "kw-reference-overlay-style";
const CUSTOM_TEXTURE_KEY = "kw.reference-overlay.supplied";
const COMPARISON_SURFACE_ID = "kw-reference-comparison-surface";

function element(tag, attributes = {}, text = "") {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attributes)) {
    if (key === "className") node.className = value;
    else if (key === "type") node.type = value;
    else node.setAttribute(key, value);
  }
  if (text) node.textContent = text;
  return node;
}

function geometryColour(kind) {
  return kind === "collision" ? 0xff5b5b : kind === "navigation" ? 0xffb347 : kind === "interaction" ? 0x6ee7ff : 0x8bff91;
}

function sourceRect(referenceImage) {
  const frame = referenceImage?.frame;
  return { width: frame?.realWidth || frame?.width || 1, height: frame?.realHeight || frame?.height || 1 };
}

export class ReferenceOverlayController {
  constructor(scene, { layout, referenceTextureKey, referenceContractId }) {
    if (!import.meta.env.DEV) throw new Error("Reference Overlay Mode is development-only.");
    this.scene = scene;
    this.layout = layout;
    this.draft = structuredClone(layout);
    this.referenceTextureKey = referenceTextureKey;
    this.referenceContractId = referenceContractId;
    this.referenceContract = REFERENCE_CONTRACTS[referenceContractId];
    if (!this.referenceContract) throw new Error(`Unknown reference comparison contract: ${referenceContractId}.`);
    if (this.referenceContract.scene !== scene.scene.key) throw new Error(`${referenceContractId} belongs to ${this.referenceContract.scene}, not ${scene.scene.key}.`);
    this.mode = "overlay";
    this.opacity = 0.45;
    this.selectedInstanceId = layout.instances[0]?.id || null;
    this.gridVisible = true;
    this.geometryVisible = true;
    this.boundsVisible = true;
    this.safeAreaVisible = true;
    this.editing = true;
    this.dragging = false;
    this.installStyle();
    this.createReferenceLayer();
    this.createGuides();
    this.mountPanel();
    this.bindPointerEditing();
    this.setMode("overlay");
    this.redrawGuides();
    document.body.dataset.referenceOverlayReady = "true";
    document.body.dataset.referenceOverlayLayout = layout.id;
    document.body.dataset.referenceOverlayValidation = "pass";
  }

  installStyle() {
    if (document.querySelector(`#${STYLE_ID}`)) return;
    const style = element("style", { id: STYLE_ID });
    style.textContent = `
      #${PANEL_ID}{position:fixed;z-index:100002;top:max(8px,env(safe-area-inset-top));right:max(8px,env(safe-area-inset-right));width:min(350px,calc(100vw - 16px));max-height:calc(100vh - 16px);overflow:auto;border:2px solid #8ee8ff;border-radius:10px;background:rgba(11,27,42,.96);color:#f7fbff;font:600 12px/1.35 system-ui;padding:10px;box-shadow:0 6px 24px rgba(0,0,0,.5)}
      #${PANEL_ID} *{box-sizing:border-box} #${PANEL_ID} h2{font-size:15px;margin:0 0 7px} #${PANEL_ID} p{margin:5px 0;color:#cfe8f3}
      #${PANEL_ID} .kw-overlay-row{display:flex;gap:5px;align-items:center;margin:6px 0;flex-wrap:wrap} #${PANEL_ID} .kw-overlay-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px}
      #${PANEL_ID} button,#${PANEL_ID} select,#${PANEL_ID} input{min-height:32px;border:1px solid #8bb8c9;border-radius:5px;background:#173449;color:#fff;padding:4px 7px;font:inherit}
      #${PANEL_ID} button[aria-pressed=true]{background:#17657b;border-color:#d8fbff} #${PANEL_ID} button:disabled{opacity:.42} #${PANEL_ID} select{width:100%}
      #${PANEL_ID} input[type=number]{width:78px} #${PANEL_ID} input[type=range]{flex:1} #${PANEL_ID} input[type=file]{width:100%;font-size:11px}
      #${PANEL_ID} .kw-overlay-status{display:block;border-radius:5px;background:#0c2233;padding:6px;color:#aeeebc} #${PANEL_ID} .kw-overlay-lock{color:#ffd58e}
      #${COMPARISON_SURFACE_ID}{position:fixed;z-index:100001;inset:0;background:#09131d;display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:8px;color:white;font:700 12px system-ui}
      #${COMPARISON_SURFACE_ID}[data-mode=difference]{grid-template-columns:1fr}
      #${COMPARISON_SURFACE_ID} figure{display:flex;flex-direction:column;min-width:0;min-height:0;margin:0;border:1px solid #66869a;background:#111d26}
      #${COMPARISON_SURFACE_ID} figcaption{padding:5px 8px;background:#173449}
      #${COMPARISON_SURFACE_ID} img,#${COMPARISON_SURFACE_ID} canvas{width:100%;height:100%;min-height:0;object-fit:contain;image-rendering:pixelated}
      #${COMPARISON_SURFACE_ID} output{position:absolute;left:12px;bottom:12px;padding:7px 9px;background:rgba(0,0,0,.82);border-radius:5px}
    `;
    document.head.append(style);
    this.style = style;
  }

  createReferenceLayer() {
    const { width, height } = this.layout.canonicalSize;
    if (!this.scene.textures.exists(this.referenceTextureKey)) {
      this.referenceImage = null;
      return;
    }
    this.referenceImage = this.scene.add.image(width / 2, height / 2, this.referenceTextureKey)
      .setOrigin(0.5)
      .setDisplaySize(width, height)
      .setDepth(8990)
      .setScrollFactor(0)
      .setData("developmentOnly", true);
  }

  createGuides() {
    this.guides = this.scene.add.graphics().setDepth(9000).setScrollFactor(0).setData("developmentOnly", true);
  }

  mountPanel() {
    document.querySelector(`#${PANEL_ID}`)?.remove();
    const panel = element("section", { id: PANEL_ID, "aria-label": "Reference Overlay Mode" });
    const title = element("h2", {}, `Reference Overlay Mode · ${this.referenceContract.scene}`);
    const description = element("p", {}, `${this.layout.canonicalSize.width}×${this.layout.canonicalSize.height} · schema ${this.layout.schemaVersion} · visual edits only`);
    const modeRow = element("div", { className: "kw-overlay-row", role: "group", "aria-label": "Comparison mode" });
    this.modeButtons = new Map();
    for (const [mode, label] of [["live", "Live"], ["overlay", "Overlay"], ["reference", "Reference"], ["split", "Split"], ["side-by-side", "Side by side"], ["difference", "Difference"]]) {
      const button = element("button", { type: "button", "data-overlay-mode": mode }, label);
      button.addEventListener("click", () => this.setMode(mode));
      modeRow.append(button);
      this.modeButtons.set(mode, button);
    }
    const opacityRow = element("label", { className: "kw-overlay-row" }, "Opacity");
    this.opacityInput = element("input", { type: "range", min: "0", max: "1", step: "0.05", value: String(this.opacity), "aria-label": "Reference opacity" });
    this.opacityOutput = element("output", {}, `${Math.round(this.opacity * 100)}%`);
    this.opacityInput.addEventListener("input", () => {
      this.opacity = Number(this.opacityInput.value);
      this.opacityOutput.textContent = `${Math.round(this.opacity * 100)}%`;
      this.setMode(this.mode);
    });
    opacityRow.append(this.opacityInput, this.opacityOutput);
    const fileRow = element("div", { className: "kw-overlay-row" });
    this.fileInput = element("input", { type: "file", accept: "image/png,image/jpeg,image/webp", "aria-label": "Load supplied reference image" });
    this.fileInput.addEventListener("change", () => this.loadSuppliedReference(this.fileInput.files?.[0]));
    fileRow.append(this.fileInput);

    const instanceLabel = element("label", { for: "kw-reference-instance" }, "Visual instance");
    this.instanceSelect = element("select", { id: "kw-reference-instance", "aria-label": "Visual instance" });
    for (const instance of this.layout.instances) this.instanceSelect.append(element("option", { value: instance.id }, instance.id));
    this.instanceSelect.value = this.selectedInstanceId;
    this.instanceSelect.addEventListener("change", () => {
      this.selectedInstanceId = this.instanceSelect.value;
      this.syncPositionInputs();
      this.redrawGuides();
    });
    const positionRow = element("div", { className: "kw-overlay-row" });
    this.xInput = element("input", { type: "number", step: String(this.layout.grid.size), "aria-label": "Selected visual X" });
    this.yInput = element("input", { type: "number", step: String(this.layout.grid.size), "aria-label": "Selected visual Y" });
    const apply = element("button", { type: "button" }, "Move visual");
    apply.addEventListener("click", () => this.moveSelected({ x: Number(this.xInput.value), y: Number(this.yInput.value) }));
    positionRow.append(element("span", {}, "X"), this.xInput, element("span", {}, "Y"), this.yInput, apply);
    const nudgeRow = element("div", { className: "kw-overlay-row", role: "group", "aria-label": "Grid nudge" });
    for (const [label, dx, dy] of [["←", -1, 0], ["↑", 0, -1], ["↓", 0, 1], ["→", 1, 0]]) {
      const button = element("button", { type: "button", "aria-label": `Nudge ${label}` }, label);
      button.addEventListener("click", () => this.nudgeSelected(dx, dy));
      nudgeRow.append(button);
    }
    const reset = element("button", { type: "button" }, "Reset visual");
    reset.addEventListener("click", () => this.resetSelected());
    nudgeRow.append(reset);

    const toggleGrid = element("div", { className: "kw-overlay-grid" });
    for (const [property, label] of [["gridVisible", "Grid"], ["boundsVisible", "Origins + bounds"], ["geometryVisible", "Geometry + sockets"], ["safeAreaVisible", "Safe areas"]]) {
      const control = element("label");
      const checkbox = element("input", { type: "checkbox" });
      checkbox.checked = this[property];
      checkbox.addEventListener("change", () => { this[property] = checkbox.checked; this.redrawGuides(); });
      control.append(checkbox, ` ${label}`);
      toggleGrid.append(control);
    }
    const geometryLock = element("p", { className: "kw-overlay-lock", id: "kw-reference-geometry-lock" }, "🔒 Gameplay geometry is locked. Moving artwork cannot move water, collisions, navigation, entrances, or interactions.");
    const actionRow = element("div", { className: "kw-overlay-row" });
    const exportButton = element("button", { type: "button", id: "kw-reference-export" }, "Export validated JSON");
    exportButton.addEventListener("click", () => this.downloadExport());
    const closeGuides = element("button", { type: "button" }, "Hide editor");
    closeGuides.addEventListener("click", () => { this.editing = !this.editing; closeGuides.textContent = this.editing ? "Hide editor" : "Show editor"; this.redrawGuides(); });
    actionRow.append(exportButton, closeGuides);
    this.status = element("output", { className: "kw-overlay-status", id: "kw-reference-status" }, "Layout valid · gameplay geometry locked");
    panel.append(title, description, modeRow, opacityRow, fileRow, instanceLabel, this.instanceSelect, positionRow, nudgeRow, toggleGrid, geometryLock, actionRow, this.status);
    document.body.append(panel);
    this.panel = panel;
    this.syncPositionInputs();
  }

  setMode(mode) {
    this.mode = ["live", "overlay", "reference", "split", "side-by-side", "difference"].includes(mode) ? mode : "overlay";
    this.removeComparisonSurface();
    for (const [key, button] of this.modeButtons || []) button.setAttribute("aria-pressed", String(key === this.mode));
    const image = this.referenceImage;
    if (image) {
      image.setVisible(!["live", "side-by-side", "difference"].includes(this.mode));
      image.setBlendMode(Phaser.BlendModes.NORMAL);
      image.setAlpha(this.mode === "reference" ? 1 : this.opacity);
      image.setCrop();
      if (this.mode === "split") {
        const source = sourceRect(image);
        image.setCrop(0, 0, source.width / 2, source.height);
      }
    }
    document.body.dataset.referenceOverlayMode = this.mode;
    this.redrawGuides();
    if (["side-by-side", "difference"].includes(this.mode)) this.scheduleComparisonSurface(this.mode);
    return this.mode;
  }

  removeComparisonSurface() {
    document.querySelector(`#${COMPARISON_SURFACE_ID}`)?.remove();
  }

  scheduleComparisonSurface(mode) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (this.mode === mode) this.renderComparisonSurface(mode);
    }));
  }

  referenceSource() {
    return this.referenceImage?.texture?.source?.[0]?.image || null;
  }

  renderComparisonSurface(mode) {
    this.removeComparisonSurface();
    const liveCanvas = this.scene.game.canvas;
    const reference = this.referenceSource();
    if (!liveCanvas || !reference) return this.setStatus(false, "Live scene or approved reference is unavailable.");
    const surface = element("section", { id: COMPARISON_SURFACE_ID, "data-mode": mode, "data-development-only": "true", "aria-label": `${mode} reference comparison` });
    if (mode === "side-by-side") {
      const liveFigure = element("figure");
      liveFigure.append(element("figcaption", {}, "Live scene"), element("img", { src: liveCanvas.toDataURL("image/png"), alt: "Live scene capture" }));
      const referenceFigure = element("figure");
      const referenceCanvas = document.createElement("canvas");
      referenceCanvas.width = this.layout.canonicalSize.width;
      referenceCanvas.height = this.layout.canonicalSize.height;
      referenceCanvas.getContext("2d", { alpha: false }).drawImage(reference, 0, 0, referenceCanvas.width, referenceCanvas.height);
      referenceFigure.append(element("figcaption", {}, `Reference · ${this.referenceContract.id}`), element("img", { src: referenceCanvas.toDataURL("image/png"), alt: "Approved reference" }));
      surface.append(liveFigure, referenceFigure);
    } else {
      const { width, height } = this.layout.canonicalSize;
      const live = document.createElement("canvas");
      const approved = document.createElement("canvas");
      live.width = approved.width = width;
      live.height = approved.height = height;
      const liveContext = live.getContext("2d", { willReadFrequently: true });
      const referenceContext = approved.getContext("2d", { willReadFrequently: true });
      liveContext.drawImage(liveCanvas, 0, 0, width, height);
      referenceContext.drawImage(reference, 0, 0, width, height);
      const difference = computeRgbaDifference(liveContext.getImageData(0, 0, width, height).data, referenceContext.getImageData(0, 0, width, height).data);
      const result = document.createElement("canvas");
      result.width = width;
      result.height = height;
      result.getContext("2d").putImageData(new ImageData(difference.pixels, width, height), 0, 0);
      const figure = element("figure");
      figure.append(element("figcaption", {}, "Absolute pixel difference heatmap"), result);
      const metrics = element("output", {}, `${(difference.metrics.changedPixelRatio * 100).toFixed(2)}% changed · MAE ${difference.metrics.meanAbsoluteError.toFixed(2)} · max Δ ${difference.metrics.maximumChannelDelta}`);
      surface.append(figure, metrics);
      document.body.dataset.referenceDifferenceMetrics = JSON.stringify(difference.metrics);
    }
    document.body.append(surface);
    this.comparisonSurface = surface;
    this.setStatus(true, mode === "difference" ? "Measured difference heatmap ready." : "Aligned side-by-side comparison ready.");
  }

  async loadSuppliedReference(file) {
    if (!file) return { ok: false, code: "reference-file-required" };
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) return this.setStatus(false, "Use a PNG, JPEG, or WebP reference.");
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
    return this.loadReferenceDataUrl(dataUrl, file.name);
  }

  async loadReferenceDataUrl(dataUrl, label = "supplied-reference") {
    const image = await new Promise((resolve, reject) => {
      const source = new Image();
      source.onload = () => resolve(source);
      source.onerror = reject;
      source.src = dataUrl;
    });
    const descriptor = { name: label, type: dataUrl.slice(5, dataUrl.indexOf(";")), width: image.naturalWidth || image.width, height: image.naturalHeight || image.height };
    const validation = validateReferenceDescriptor(this.referenceContract, descriptor);
    if (!validation.ok) return this.setStatus(false, validation.errors.join(" "));
    if (this.scene.textures.exists(CUSTOM_TEXTURE_KEY)) this.scene.textures.remove(CUSTOM_TEXTURE_KEY);
    this.scene.textures.addImage(CUSTOM_TEXTURE_KEY, image);
    const { width, height } = this.layout.canonicalSize;
    if (!this.referenceImage) this.referenceImage = this.scene.add.image(width / 2, height / 2, CUSTOM_TEXTURE_KEY).setDepth(8990).setScrollFactor(0);
    else this.referenceImage.setTexture(CUSTOM_TEXTURE_KEY);
    this.referenceImage.setOrigin(0.5).setDisplaySize(width, height).setData("developmentOnly", true);
    this.referenceTextureKey = CUSTOM_TEXTURE_KEY;
    this.setMode("overlay");
    this.setStatus(true, `${label} validated for ${this.referenceContract.id} and aligned to ${width}×${height}.`);
    return { ok: true, code: "reference-image-loaded", width, height, referenceId: this.referenceContract.id };
  }

  capturesGameplayPointer() { return this.editing; }

  bindPointerEditing() {
    this.onPointerDown = (pointer, _currentlyOver, event) => {
      if (!this.editing) return;
      const position = getSceneLayoutInstance(this.draft, this.selectedInstanceId).visual.position;
      if (Phaser.Math.Distance.Between(pointer.x, pointer.y, position.x, position.y) <= 36) {
        this.dragging = true;
        event?.stopPropagation?.();
      }
    };
    this.onPointerMove = (pointer) => {
      if (this.dragging) this.moveSelected({ x: pointer.x, y: pointer.y }, false);
    };
    this.onPointerUp = () => { this.dragging = false; };
    this.scene.input.on("pointerdown", this.onPointerDown);
    this.scene.input.on("pointermove", this.onPointerMove);
    this.scene.input.on("pointerup", this.onPointerUp);
  }

  nudgeSelected(dx, dy) {
    const current = getSceneLayoutInstance(this.draft, this.selectedInstanceId).visual.position;
    const size = this.layout.grid.size;
    return this.moveSelected({ x: current.x + dx * size, y: current.y + dy * size });
  }

  resetSelected() {
    const position = getSceneLayoutInstance(this.layout, this.selectedInstanceId).visual.position;
    return this.moveSelected(position);
  }

  moveSelected(position, announce = true) {
    const result = moveSceneLayoutInstance(this.draft, this.selectedInstanceId, position, { gridSize: this.layout.grid.size, layer: "visual" });
    if (!result.ok) {
      this.setStatus(false, result.errors?.[0]?.message || result.code);
      return result;
    }
    this.draft = result.layout;
    this.scene.applyLayoutVisualPosition?.(this.selectedInstanceId, result.position);
    this.syncPositionInputs();
    this.redrawGuides();
    document.body.dataset.referenceOverlayValidation = "pass";
    if (announce) this.setStatus(true, `${this.selectedInstanceId} moved visually to ${result.position.x}, ${result.position.y}; gameplay geometry unchanged.`);
    return result;
  }

  syncPositionInputs() {
    const position = getSceneLayoutInstance(this.draft, this.selectedInstanceId).visual.position;
    this.xInput.value = String(position.x);
    this.yInput.value = String(position.y);
  }

  setStatus(ok, message) {
    if (this.status) {
      this.status.textContent = message;
      this.status.style.color = ok ? "#aeeebc" : "#ffb3ad";
    }
    document.body.dataset.referenceOverlayValidation = ok ? "pass" : "fail";
    return { ok, message };
  }

  redrawGuides() {
    const graphics = this.guides;
    if (!graphics) return;
    graphics.clear();
    const comparisonSurfaceMode = ["side-by-side", "difference"].includes(this.mode);
    graphics.setVisible(this.editing && !comparisonSurfaceMode);
    if (!this.editing || comparisonSurfaceMode) return;
    const { width, height } = this.layout.canonicalSize;
    if (this.gridVisible) {
      graphics.lineStyle(1, 0x7de5ff, 0.09);
      for (let x = 0; x <= width; x += this.layout.grid.size) graphics.lineBetween(x, 0, x, height);
      for (let y = 0; y <= height; y += this.layout.grid.size) graphics.lineBetween(0, y, width, y);
    }
    if (this.safeAreaVisible) {
      graphics.lineStyle(3, 0x8bff91, 0.8);
      for (const area of this.draft.safeAreas) graphics.strokeRect(area.geometry.x, area.geometry.y, area.geometry.width, area.geometry.height);
    }
    if (this.geometryVisible) {
      for (const [kind, references] of [["collision", this.draft.collisionReferences], ["navigation", this.draft.navigationReferences], ["interaction", this.draft.interactionReferences]]) {
        graphics.lineStyle(kind === "interaction" ? 3 : 2, geometryColour(kind), kind === "interaction" ? 0.75 : 0.5);
        for (const reference of references) {
          const zone = this.draft.zones.find(({ id }) => id === reference.zoneId);
          if (zone) graphics.strokeRect(zone.geometry.x, zone.geometry.y, zone.geometry.width, zone.geometry.height);
        }
      }
      for (const socket of this.draft.sockets) {
        graphics.lineStyle(2, 0xf7ef86, 0.95);
        graphics.strokeCircle(socket.position.x, socket.position.y, 6);
        graphics.lineBetween(socket.position.x - 9, socket.position.y, socket.position.x + 9, socket.position.y);
        graphics.lineBetween(socket.position.x, socket.position.y - 9, socket.position.x, socket.position.y + 9);
      }
    }
    if (this.boundsVisible && this.selectedInstanceId) {
      const instance = getSceneLayoutInstance(this.draft, this.selectedInstanceId);
      const { position, origin, bounds } = instance.visual;
      const left = position.x - bounds.width * origin.x;
      const top = position.y - bounds.height * origin.y;
      graphics.lineStyle(4, 0xff57d8, 0.95);
      graphics.strokeRect(left, top, bounds.width, bounds.height);
      graphics.fillStyle(0xff57d8, 1).fillCircle(position.x, position.y, 5);
      const groundY = top + bounds.height;
      graphics.lineStyle(3, 0xffffff, 0.9).lineBetween(position.x - 14, groundY, position.x + 14, groundY);
    }
  }

  validatedExport() {
    const validation = validateSceneLayout(this.draft);
    if (!validation.ok) return { ok: false, code: "invalid-layout-export", errors: validation.errors };
    return exportSceneLayout(this.draft);
  }

  downloadExport() {
    const result = this.validatedExport();
    if (!result.ok) return this.setStatus(false, result.errors?.[0]?.message || result.code);
    const url = URL.createObjectURL(new Blob([result.json], { type: "application/json" }));
    const link = element("a", { href: url, download: `${this.layout.id}.v${this.layout.revision}.json` });
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    this.setStatus(true, "Validated scene-layout JSON exported.");
    return result;
  }

  destroy() {
    this.scene.input.off("pointerdown", this.onPointerDown);
    this.scene.input.off("pointermove", this.onPointerMove);
    this.scene.input.off("pointerup", this.onPointerUp);
    this.panel?.remove();
    this.removeComparisonSurface();
    this.style?.remove();
    this.referenceImage?.destroy();
    this.guides?.destroy();
    if (this.scene.textures.exists(CUSTOM_TEXTURE_KEY)) this.scene.textures.remove(CUSTOM_TEXTURE_KEY);
    delete document.body.dataset.referenceOverlayReady;
    delete document.body.dataset.referenceOverlayLayout;
    delete document.body.dataset.referenceOverlayValidation;
    delete document.body.dataset.referenceOverlayMode;
    delete document.body.dataset.referenceDifferenceMetrics;
  }
}
