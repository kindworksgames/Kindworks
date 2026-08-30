import Phaser from "phaser";
import { NpcCharacter } from "../../entities/NpcCharacter.js";
import { LIGHTING_CONFIG, getLightingForMinutes } from "../../data/worldSimulation.js";
import { VISUAL_ASSET_KINDS, VISUAL_RENDER_TARGETS } from "../contracts.js";
import { CANONICAL_LANDSCAPE, HUD_SAFE_AREA, SUPPORTED_LANDSCAPE_VIEWPORTS, resolveHudSafeArea, resolvePrefabDisplayMetrics } from "../scale/scaleSystem.js";
import { ASSET_LAB_PRODUCTION_INDEX } from "../generated/assetLabProductionIndex.js";
import { ASSET_LAB_CANDIDATE_INDEX } from "../generated/assetLabCandidateIndex.js";
import { assetLabCoverage, assetLabFacets, createAssetLabCatalog, filterAssetLabCatalog } from "./assetLabCatalog.js";

const PANEL_ID = "kw-asset-lab";
const STYLE_ID = "kw-asset-lab-style";
const LAB_KEY_PREFIX = "kw.asset-lab.";
const LIST_PAGE_SIZE = 160;
const CONTACT_SHEET_PAGE_SIZE = 40;
const BACKGROUNDS = Object.freeze({
  neutral: 0x596168, grass: 0x76a85e, road: 0x596066, interior: 0xcfae7a,
  water: 0x3c91b8, light: 0xf4efdf, dark: 0x17232a,
});
const LIGHTING_TIMES = Object.freeze({ day: 12 * 60, dusk: 19 * 60, night: 0 });

function el(tag, attrs = {}, text = "") {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === "className") node.className = value;
    else if (key === "checked") node.checked = value;
    else if (key === "value") node.value = value;
    else node.setAttribute(key, value);
  }
  if (text) node.textContent = text;
  return node;
}

function options(select, values, label = "All") {
  select.replaceChildren(el("option", { value: "all" }, label), ...values.map((value) => el("option", { value }, value)));
}

function geometryItems(value, label) {
  if (!value) return [];
  if (value.kind) return [{ ...value, label }];
  return Object.entries(value).flatMap(([key, geometry]) => geometry?.kind ? [{ ...geometry, label: `${label}.${key}` }] : []);
}

function downloadBlob(blob, name) {
  const anchor = document.createElement("a");
  anchor.href = URL.createObjectURL(blob);
  anchor.download = name;
  anchor.hidden = true;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  document.body.dataset.assetLabLastExport = `${name}:${blob.size}`;
  setTimeout(() => URL.revokeObjectURL(anchor.href), 1000);
}

function calibrationResident() {
  return {
    id: "npc-asset-lab-calibration", name: "Calibration NPC", role: "54-unit resident reference",
    x: 0, y: 0, visible: true, palette: { skin: 0xe6b88b, hair: 0x3f2c24, shirt: 0x638f5f, pants: 0x5a5978 },
    bodyScale: 1, hairStyle: 1, accessoryStyle: "none", facingX: 1, phase: "idle", activity: "idle",
    actionState: "IDLE", carryItem: null, greetingIcon: "", reactionIcon: "",
  };
}

export class AssetLabScene extends Phaser.Scene {
  constructor() { super("AssetLabScene"); }

  preload() {
    this.visualRegistry = this.registry.get("visualRegistry");
    this.catalog = createAssetLabCatalog(this.visualRegistry.manifest, {
      productionIndex: ASSET_LAB_PRODUCTION_INDEX,
      candidateIndex: ASSET_LAB_CANDIDATE_INDEX,
    });
    this.labWarnings = [];
    this.load.on("loaderror", (file) => this.labWarnings.push({ code: "asset-lab-load-failed", file: file?.src || file?.url || file?.key }));
  }

  create() {
    if (!import.meta.env.DEV) throw new Error("Asset Lab is development-only.");
    this.selected = this.catalog[0] || null;
    this.backgroundName = "neutral";
    this.sizeMode = "intended";
    this.facing = "down";
    this.playbackSpeed = 1;
    this.previewZoom = 1;
    this.animationPaused = false;
    this.shadowVisible = true;
    this.loadingAssets = new Set();
    this.failedAssets = new Map();
    this.listPage = 0;
    this.lightingPhase = "day";
    this.overlayFlags = { canvas: true, frame: true, opaque: true, origin: true, ground: true, sockets: true, standing: true, bounds: true, collision: true, navigation: true, interaction: true, touch: true };
    this.background = this.add.rectangle(640, 360, 1280, 720, BACKGROUNDS.neutral).setDepth(-1000);
    this.lightingOverlay = this.add.rectangle(640, 360, 1280, 720, LIGHTING_CONFIG.overlayRgb.reduce((value, part) => (value << 8) + part, 0), 0).setDepth(650);
    this.viewportGraphics = this.add.graphics().setDepth(800);
    this.previewContainer = this.add.container(790, 345).setDepth(100);
    this.overlayGraphics = this.add.graphics().setDepth(700);
    this.title = this.add.text(790, 38, "Asset Lab", { color: "#fff7dc", fontFamily: "ui-monospace,monospace", fontSize: "18px", fontStyle: "bold", backgroundColor: "rgba(10,20,24,.72)", padding: { x: 8, y: 5 } }).setOrigin(0.5).setDepth(900);
    this.ruler = this.add.graphics().setDepth(200);
    this.#drawRuler();
    this.calibrationNpc = new NpcCharacter(this, calibrationResident(), { x: 1100, y: 620 });
    this.calibrationNpc.disableInteractive().setDepth(210);
    this.add.text(1100, 660, "Calibration NPC · 54 units", { color: "#fff", fontFamily: "ui-monospace,monospace", fontSize: "10px", backgroundColor: "rgba(0,0,0,.62)", padding: { x: 4, y: 2 } }).setOrigin(0.5).setDepth(220);
    this.#installPanel();
    this.#applyLighting();
    this.#drawViewportFrames();
    this.#renderSelected();
    document.body.dataset.gameScene = this.scene.key;
    document.body.dataset.assetLabReady = "true";
    document.body.dataset.assetLabAssetCount = String(this.catalog.length);
    document.body.dataset.assetLabCoverage = JSON.stringify(assetLabCoverage(this.catalog));
    document.body.dataset.assetLabValidationSummary = JSON.stringify(this.#validationSummary());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.#destroyLab());
  }

  update() {
    if (!this.previewSprite?.anims?.currentAnim || !this.frameScrubber) return;
    const frames = this.previewSprite.anims.currentAnim.frames || [];
    const index = Math.max(0, frames.indexOf(this.previewSprite.anims.currentFrame));
    this.frameScrubber.max = String(Math.max(0, frames.length - 1));
    if (!this.frameScrubber.matches(":active")) this.frameScrubber.value = String(index);
    if (this.frameReadout) this.frameReadout.textContent = `Frame ${index + 1}/${Math.max(1, frames.length)}`;
  }

  #drawRuler() {
    this.ruler.clear().lineStyle(2, 0xffffff, 0.8).lineBetween(930, 620, 1030, 620);
    for (let x = 930; x <= 1030; x += 10) this.ruler.lineBetween(x, 615, x, x % 50 === 30 ? 628 : 624);
    this.add.text(980, 631, "100 world units", { color: "#fff", fontFamily: "ui-monospace,monospace", fontSize: "10px", backgroundColor: "rgba(0,0,0,.62)", padding: { x: 3, y: 2 } }).setOrigin(0.5).setDepth(220);
  }

  #installPanel() {
    document.querySelector(`#${PANEL_ID}`)?.remove();
    if (!document.querySelector(`#${STYLE_ID}`)) {
      const style = el("style", { id: STYLE_ID });
      style.textContent = `body[data-game-scene="AssetLabScene"] .game-shell>:not(#game){display:none!important}body[data-game-scene="AssetLabScene"] #game{inset:0!important;width:100vw!important;height:100dvh!important}#${PANEL_ID}{position:fixed;z-index:100006;inset:max(6px,env(safe-area-inset-top)) auto max(6px,env(safe-area-inset-bottom)) max(6px,env(safe-area-inset-left));width:min(390px,48vw);overflow:auto;border:2px solid #8ee8ff;border-radius:10px;background:rgba(9,24,35,.97);color:#f5fbff;font:600 11px/1.3 system-ui;padding:9px;box-shadow:0 8px 30px #0009}#${PANEL_ID} *{box-sizing:border-box}#${PANEL_ID} h1{font-size:16px;margin:0 0 4px}#${PANEL_ID} p{margin:4px 0;color:#cce3ed}#${PANEL_ID} .grid{display:grid;grid-template-columns:1fr 1fr;gap:5px}#${PANEL_ID} .row{display:flex;gap:5px;align-items:center;flex-wrap:wrap;margin:5px 0}#${PANEL_ID} input,#${PANEL_ID} select,#${PANEL_ID} button{min-height:32px;min-width:0;border:1px solid #83adbd;border-radius:5px;background:#17394b;color:#fff;padding:5px 7px;font:inherit}#${PANEL_ID} input[type=search],#${PANEL_ID} select{width:100%}#${PANEL_ID} input[type=range]{flex:1;min-width:110px}#${PANEL_ID} button[aria-pressed=true]{background:#17728b;border-color:#d9fbff}#${PANEL_ID} fieldset{border:1px solid #496d79;border-radius:6px;margin:6px 0;padding:5px}#${PANEL_ID} legend{color:#aeefff}#${PANEL_ID} .asset-list{width:100%;height:136px}#${PANEL_ID} .warnings{display:block;white-space:pre-wrap;background:#102631;border-radius:5px;padding:7px;color:#ffd797}#${PANEL_ID} .good{color:#a9edb4}#${PANEL_ID} .invalid{color:#ff9a9a;border:1px solid #ff6767}#${PANEL_ID} .placeholder{color:#ffd077;border:1px solid #d99a31}#${PANEL_ID} details{margin-top:6px;border:1px solid #496d79;border-radius:6px;padding:5px}#${PANEL_ID} pre{white-space:pre-wrap;overflow-wrap:anywhere;font:10px/1.35 ui-monospace,monospace;color:#cce3ed}#${PANEL_ID} .page{margin-left:auto;color:#cce3ed}#kw-asset-lab-toggle{position:fixed;z-index:100007;top:max(6px,env(safe-area-inset-top));right:max(6px,env(safe-area-inset-right));min-width:44px;min-height:44px;border:2px solid #8ee8ff;border-radius:8px;background:#102b3a;color:white;font-weight:800}#${PANEL_ID}[data-collapsed=true]{display:none}@media (pointer:coarse),(max-width:700px){#${PANEL_ID}{width:min(340px,82vw)}#${PANEL_ID} input,#${PANEL_ID} select,#${PANEL_ID} button{min-height:${HUD_SAFE_AREA.minimumTouchTargetCssPixels}px}#${PANEL_ID} input[type=checkbox]{min-width:${HUD_SAFE_AREA.minimumTouchTargetCssPixels}px;width:${HUD_SAFE_AREA.minimumTouchTargetCssPixels}px}#${PANEL_ID} .asset-list{height:150px}}`;
      document.head.append(style);
    }
    const panel = el("section", { id: PANEL_ID, "aria-label": "KindWorks development Asset Lab" });
    const coverage = assetLabCoverage(this.catalog);
    panel.append(el("h1", {}, "KindWorks Asset Lab"), el("p", {}, `${coverage.assets} runtime assets · ${coverage.productionFamilies} production families · ${coverage.categories} categories · development only`));
    const toggle = el("button", { id: "kw-asset-lab-toggle", type: "button", "aria-label": "Show or hide Asset Lab controls", "aria-expanded": "true" }, "Lab");
    toggle.addEventListener("click", () => { const collapsed = panel.dataset.collapsed !== "true"; panel.dataset.collapsed = String(collapsed); toggle.setAttribute("aria-expanded", String(!collapsed)); toggle.textContent = collapsed ? "Lab ▸" : "Lab ◂"; });
    document.body.append(toggle); this.panelToggle = toggle;
    const search = el("input", { type: "search", placeholder: "Semantic ID or filename", "aria-label": "Search assets" });
    panel.append(search);
    const facets = assetLabFacets(this.catalog);
    const filterGrid = el("div", { className: "grid" });
    const filterDefs = [["category", facets.categories], ["scene", facets.scenes], ["status", facets.statuses], ["family", facets.families], ["state", facets.states], ["direction", facets.directions], ["animation", facets.animations], ["approval", facets.approvals], ["validation", facets.validations], ["tag", facets.tags]];
    this.filters = { query: "" };
    this.filterInputs = {};
    for (const [key, list] of filterDefs) {
      const select = el("select", { "aria-label": `Filter by ${key}` }); options(select, list, `All ${key}`);
      select.addEventListener("change", () => { this.filters[key] = select.value; this.listPage = 0; this.#refreshList(); });
      this.filterInputs[key] = select; filterGrid.append(select);
    }
    panel.append(filterGrid);
    search.addEventListener("input", () => { this.filters.query = search.value; this.listPage = 0; this.#refreshList(); });
    this.assetSelect = el("select", { className: "asset-list", size: "8", "aria-label": "Manifest and production inventory" });
    this.assetSelect.addEventListener("change", () => { this.selected = this.catalog.find(({ id }) => id === this.assetSelect.value) || this.selected; this.#syncSelectors(); this.#renderSelected(); });
    panel.append(this.assetSelect);
    const pageRow = el("div", { className: "row" });
    this.pageBack = el("button", { type: "button", "aria-label": "Previous asset page" }, "◀ Page");
    this.pageNext = el("button", { type: "button", "aria-label": "Next asset page" }, "Page ▶");
    this.pageLabel = el("span", { className: "page" }, "Page 1/1");
    this.pageBack.addEventListener("click", () => { this.listPage = Math.max(0, this.listPage - 1); this.#renderListPage(); });
    this.pageNext.addEventListener("click", () => { this.listPage = Math.min(this.pageCount - 1, this.listPage + 1); this.#renderListPage(); });
    pageRow.append(this.pageBack, this.pageNext, this.pageLabel); panel.append(pageRow);
    const selectionGrid = el("div", { className: "grid" });
    this.stateSelect = el("select", { "aria-label": "Visual state" });
    this.variantSelect = el("select", { "aria-label": "Visual variant" });
    this.animationSelect = el("select", { "aria-label": "Animation" });
    this.facingSelect = el("select", { "aria-label": "Facing" });
    this.frameSelect = el("select", { "aria-label": "Static or atlas frame" });
    for (const select of [this.stateSelect, this.variantSelect, this.animationSelect, this.facingSelect, this.frameSelect]) select.addEventListener("change", () => this.#renderSelected());
    selectionGrid.append(this.stateSelect, this.variantSelect, this.animationSelect, this.facingSelect, this.frameSelect);
    panel.append(selectionGrid);
    const displayRow = el("div", { className: "row" });
    this.backgroundSelect = el("select", { "aria-label": "Preview background" }); options(this.backgroundSelect, Object.keys(BACKGROUNDS), "Background"); this.backgroundSelect.value = this.backgroundName;
    this.backgroundSelect.addEventListener("change", () => { this.backgroundName = this.backgroundSelect.value === "all" ? "neutral" : this.backgroundSelect.value; this.background.setFillStyle(BACKGROUNDS[this.backgroundName]); });
    for (const [mode, label] of [["native", "Actual/native"], ["intended", "Gameplay size"]]) {
      const button = el("button", { type: "button", "data-size-mode": mode }, label); button.setAttribute("aria-pressed", String(this.sizeMode === mode));
      button.addEventListener("click", () => { this.sizeMode = mode; panel.querySelectorAll("[data-size-mode]").forEach((item) => item.setAttribute("aria-pressed", String(item.dataset.sizeMode === mode))); this.#renderSelected(); });
      displayRow.append(button);
    }
    displayRow.append(this.backgroundSelect);
    this.zoomSelect = el("select", { "aria-label": "Preview zoom" });
    for (const value of [0.25, 0.5, 1, 2, 4, 8]) this.zoomSelect.append(el("option", { value }, `${value}× zoom`));
    this.zoomSelect.value = "1"; this.zoomSelect.addEventListener("change", () => { this.previewZoom = Number(this.zoomSelect.value); this.#renderSelected(); });
    displayRow.append(this.zoomSelect); panel.append(displayRow);
    const environmentRow = el("div", { className: "grid" });
    this.lightingSelect = el("select", { "aria-label": "World lighting preview" });
    for (const phase of Object.keys(LIGHTING_TIMES)) this.lightingSelect.append(el("option", { value: phase }, `${phase} lighting`));
    this.lightingSelect.value = this.lightingPhase; this.lightingSelect.addEventListener("change", () => { this.lightingPhase = this.lightingSelect.value; this.#applyLighting(); });
    environmentRow.append(this.lightingSelect); panel.append(environmentRow);
    const animationRow = el("div", { className: "row" });
    const pause = el("button", { type: "button" }, "Pause"); pause.addEventListener("click", () => { this.animationPaused = !this.animationPaused; pause.textContent = this.animationPaused ? "Play" : "Pause"; this.#applyPlayback(); });
    const restart = el("button", { type: "button" }, "Restart"); restart.addEventListener("click", () => { this.previewSprite?.anims?.restart?.(); this.previewSprite?.anims?.pause?.(); this.animationPaused = true; pause.textContent = "Play"; this.#syncFrameScrubber(); });
    const stepBack = el("button", { type: "button" }, "◀ Frame"); stepBack.addEventListener("click", () => this.previewSprite?.anims?.previousFrame?.());
    const step = el("button", { type: "button" }, "Frame ▶"); step.addEventListener("click", () => this.previewSprite?.anims?.nextFrame?.());
    const speed = el("select", { "aria-label": "Playback speed" }); for (const value of [0.25, 0.5, 1, 2]) speed.append(el("option", { value }, `${value}×`)); speed.value = "1"; speed.addEventListener("change", () => { this.playbackSpeed = Number(speed.value); this.#applyPlayback(); });
    animationRow.append(pause, restart, stepBack, step, speed); panel.append(animationRow);
    const scrubRow = el("div", { className: "row" });
    this.frameScrubber = el("input", { type: "range", min: "0", max: "0", step: "1", value: "0", "aria-label": "Animation frame scrubber" });
    this.frameReadout = el("span", {}, "Frame 1/1");
    this.frameScrubber.addEventListener("input", () => this.#scrubAnimation(Number(this.frameScrubber.value)));
    scrubRow.append(this.frameScrubber, this.frameReadout); panel.append(scrubRow);
    const layerField = el("fieldset"); layerField.append(el("legend", {}, "Layers and shadows"));
    this.layerSelect = el("select", { "aria-label": "Layer isolation" }); this.layerSelect.addEventListener("change", () => this.#applyLayerIsolation());
    const shadow = el("label"); const shadowInput = el("input", { type: "checkbox", checked: true }); shadowInput.addEventListener("change", () => { this.shadowVisible = shadowInput.checked; this.#applyLayerIsolation(); }); shadow.append(shadowInput, " Shadows");
    layerField.append(this.layerSelect, shadow); panel.append(layerField);
    const overlayField = el("fieldset"); overlayField.append(el("legend", {}, "Geometry overlays")); const overlayGrid = el("div", { className: "grid" });
    for (const key of Object.keys(this.overlayFlags)) { const label = el("label"); const input = el("input", { type: "checkbox", checked: true }); input.addEventListener("change", () => { this.overlayFlags[key] = input.checked; this.#drawOverlays(); }); label.append(input, ` ${key}`); overlayGrid.append(label); }
    overlayField.append(overlayGrid); panel.append(overlayField);
    const comparison = el("div", { className: "row" });
    this.compareButton = el("button", { type: "button" }, "Previous ↔ current"); this.compareButton.addEventListener("click", () => { this.comparisonVisible = !this.comparisonVisible; this.#renderSelected(); });
    const viewport = el("select", { "aria-label": "Viewport frame" }); options(viewport, SUPPORTED_LANDSCAPE_VIEWPORTS.map(({ id }) => id), "No viewport frame"); viewport.addEventListener("change", () => { this.viewportProfile = viewport.value; this.#drawViewportFrames(); });
    comparison.append(this.compareButton, viewport); panel.append(comparison);
    const maintenanceRow = el("div", { className: "row" });
    const reload = el("button", { type: "button" }, "Reload selected"); reload.addEventListener("click", () => this.#reloadSelected());
    const diagnostics = el("button", { type: "button" }, "Show all issues"); diagnostics.addEventListener("click", () => { this.filters.validation = "all"; Object.values(this.filterInputs).forEach((input) => { if (input.getAttribute("aria-label") === "Filter by validation") input.value = "all"; }); this.filters.query = ""; search.value = ""; this.#refreshList(); this.#showGlobalDiagnostics(); });
    maintenanceRow.append(reload, diagnostics); panel.append(maintenanceRow);
    const exportRow = el("div", { className: "row" });
    const screenshot = el("button", { type: "button" }, "Export screenshot"); screenshot.addEventListener("click", () => this.#exportScreenshot());
    const contact = el("button", { type: "button" }, "Export contact sheet"); contact.addEventListener("click", () => this.#exportContactSheet());
    exportRow.append(screenshot, contact); panel.append(exportRow);
    this.details = el("output", { className: "warnings", "aria-live": "polite" }); panel.append(this.details);
    const metadata = el("details"); metadata.append(el("summary", {}, "Manifest, contract, usage and validation metadata"));
    this.metadata = el("pre"); metadata.append(this.metadata); panel.append(metadata);
    document.body.append(panel); this.panel = panel; this.#refreshList();
  }

  #refreshList() {
    this.filteredCatalog = filterAssetLabCatalog(this.catalog, this.filters);
    this.pageCount = Math.max(1, Math.ceil(this.filteredCatalog.length / LIST_PAGE_SIZE));
    this.listPage = Math.min(this.listPage, this.pageCount - 1);
    if (!this.filteredCatalog.some(({ id }) => id === this.selected?.id)) this.selected = this.filteredCatalog[0] || null;
    if (this.selected) this.listPage = Math.floor(Math.max(0, this.filteredCatalog.findIndex(({ id }) => id === this.selected.id)) / LIST_PAGE_SIZE);
    this.#renderListPage();
    this.#syncSelectors(); this.#renderSelected();
  }

  #renderListPage() {
    const page = (this.filteredCatalog || []).slice(this.listPage * LIST_PAGE_SIZE, (this.listPage + 1) * LIST_PAGE_SIZE);
    this.assetSelect.replaceChildren(...page.map((entry) => el("option", { value: entry.id }, `${entry.id} · ${entry.filename || entry.kind} · ${entry.validationStatus}`)));
    this.assetSelect.value = this.selected?.id || "";
    this.pageLabel.textContent = `${this.filteredCatalog?.length || 0} records · page ${this.listPage + 1}/${this.pageCount}`;
    this.pageBack.disabled = this.listPage === 0; this.pageNext.disabled = this.listPage >= this.pageCount - 1;
  }

  #syncSelectors() {
    const entry = this.selected; if (!entry) return;
    options(this.stateSelect, entry.stateNames, "Default state");
    options(this.variantSelect, entry.variants, "Default variant");
    options(this.animationSelect, entry.animations.map(({ id }) => id), "No animation");
    options(this.facingSelect, entry.directions, "Default facing");
    const frameCount = entry.kind === VISUAL_ASSET_KINDS.SPRITESHEET ? Math.max(0, Math.floor((entry.asset?.technical?.width || 0) / (entry.asset?.technical?.frameWidth || 1)) * Math.floor((entry.asset?.technical?.height || 0) / (entry.asset?.technical?.frameHeight || 1))) : 0;
    options(this.frameSelect, entry.frameNames.length ? entry.frameNames : Array.from({ length: frameCount }, (_, index) => String(index)), "Default frame");
    options(this.layerSelect, [...new Set(entry.layers.map(({ id }) => id))], "All layers");
    this.compareButton.disabled = !entry.comparison?.previousSource;
  }

  #renderSelected() {
    this.previewContainer.removeAll(true); this.previewContainer.setScale(this.previewZoom); this.overlayGraphics.clear(); this.previewSprite = null; this.layerObjects = []; this.opaqueBounds = null; this.canvasBounds = null;
    const entry = this.selected;
    if (!entry) { this.details.textContent = "No manifest or production records match these filters."; this.metadata.textContent = ""; return; }
    const prefab = entry.prefabs.find(({ variant }) => this.variantSelect.value === variant) || entry.prefabs[0] || null;
    const stateName = this.stateSelect.value === "all" ? null : this.stateSelect.value;
    if (entry.recordType !== "runtime-asset") {
      this.#renderContractCard(entry);
      this.#finishSelectedDetails(entry, prefab, []);
      return;
    }
    const textureKey = this.#textureKey(entry);
    if (entry.asset?.source?.kind === "file" && !this.#hasPreviewTexture(entry, textureKey)) {
      this.#renderLoadingCard(entry, this.failedAssets.has(entry.id) ? "Load failed" : "Loading registered artwork…");
      this.#finishSelectedDetails(entry, prefab, this.failedAssets.has(entry.id) ? [{ code: "asset-lab-preview-load-failed", message: this.failedAssets.get(entry.id) }] : []);
      if (!this.failedAssets.has(entry.id)) this.#ensureSelectedLoaded(entry);
      return;
    }
    let object;
    if (entry.kind === VISUAL_ASSET_KINDS.PROCEDURAL && prefab?.proceduralRecipe) object = this.#renderProcedural(prefab, stateName);
    else if (entry.kind === VISUAL_ASSET_KINDS.GENERATED_TEXTURE_FAMILY) object = this.#renderResident(entry);
    else {
      const resolvedKey = textureKey || this.visualRegistry.ensureFallbackTexture(this);
      if (!this.textures.exists(resolvedKey)) this.visualRegistry.ensureFallbackTexture(this, undefined, resolvedKey);
      const selectedFrame = this.#selectedFrame(entry, stateName);
      object = [VISUAL_ASSET_KINDS.SPRITESHEET, VISUAL_ASSET_KINDS.ATLAS].includes(entry.kind) ? this.add.sprite(0, 0, resolvedKey, selectedFrame) : this.add.image(0, 0, resolvedKey);
      object.setOrigin(prefab?.origin?.x ?? prefab?.anchor?.originX ?? 0.5, prefab?.origin?.y ?? prefab?.anchor?.originY ?? 0.5);
      if (this.sizeMode === "intended" && prefab?.geometry?.visual) { const metrics = resolvePrefabDisplayMetrics(prefab, entry.asset); object.setDisplaySize(metrics.width, metrics.height); }
      object.setData("assetLabLayer", "main"); this.layerObjects.push(object); this.previewContainer.add(object);
      this.previewSprite = object.type === "Sprite" ? object : null;
      this.#playSelectedAnimation(entry, object);
      this.canvasBounds = this.#canvasBoundsFor(object);
      this.opaqueBounds = this.#inspectOpaqueBounds(object);
    }
    if (object && !object.parentContainer) this.previewContainer.add(object);
    if (this.comparisonVisible && entry.comparison?.previousSource && !this.textures.exists(`${LAB_KEY_PREFIX}previous.${entry.id}`)) this.#ensureComparisonLoaded(entry);
    if (this.comparisonVisible && entry.comparison?.previousSource && this.textures.exists(`${LAB_KEY_PREFIX}previous.${entry.id}`)) {
      const previous = this.add.image(-190, 0, `${LAB_KEY_PREFIX}previous.${entry.id}`).setOrigin(0.5).setData("assetLabLayer", "previous");
      const current = this.layerObjects.find((item) => item.texture);
      const sourceWidth = current?.frame?.realWidth || current?.displayWidth || entry.asset.technical?.width || 1;
      const sourceHeight = current?.frame?.realHeight || current?.displayHeight || entry.asset.technical?.height || 1;
      const comparisonWidth = 340;
      const comparisonHeight = comparisonWidth * sourceHeight / sourceWidth;
      current?.setDisplaySize?.(comparisonWidth, comparisonHeight); current?.setX?.(190);
      previous.setDisplaySize(comparisonWidth, comparisonHeight);
      this.previewContainer.x = 790; this.previewContainer.add(previous); this.title.setText(`${entry.id}\nprevious ◀  ▶ current`);
    } else { this.previewContainer.x = 790; this.title.setText(entry.id); }
    this.#applyLayerIsolation(); this.#applyPlayback(); this.#drawOverlays(prefab); this.#syncFrameScrubber();
    const failures = this.visualRegistry.getFailures().filter(({ assetId }) => !assetId || assetId === entry.id);
    const runtimeFindings = [
      ...this.labWarnings.filter(({ file }) => !file || String(file).includes(entry.filename) || String(file).includes(entry.id)).map(({ code, file }) => ({ code, message: String(file) })),
      ...failures.map(({ code, message, expected, actual }) => ({ code, message, expected, actual })),
    ];
    this.#finishSelectedDetails(entry, prefab, runtimeFindings);
  }

  #textureKey(entry) {
    if (!entry?.asset) return null;
    if (entry.asset.runtime?.renderTarget === VISUAL_RENDER_TARGETS.CANVAS) return `${LAB_KEY_PREFIX}asset.${entry.id}`;
    return entry.asset.runtime?.textureKey || entry.asset.runtime?.atlasKey || `${LAB_KEY_PREFIX}asset.${entry.id}`;
  }

  #hasPreviewTexture(entry, key) {
    if (entry.kind === VISUAL_ASSET_KINDS.AUDIO) return this.cache.audio.exists(key);
    return Boolean(key && this.textures.exists(key));
  }

  #ensureSelectedLoaded(entry, { force = false } = {}) {
    if (!entry?.asset || entry.asset.source?.kind !== "file" || this.loadingAssets.has(entry.id)) return;
    const key = this.#textureKey(entry), token = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    if (force) { if (entry.kind === VISUAL_ASSET_KINDS.AUDIO) this.cache.audio.remove(key); else if (this.textures.exists(key)) this.textures.remove(key); }
    this.loadingAssets.add(entry.id); this.failedAssets.delete(entry.id); document.body.dataset.assetLabLoading = entry.id;
    const version = (url) => `${url}${url.includes("?") ? "&" : "?"}assetLabReload=${token}`;
    const sourceUrl = version(entry.candidate?.sourceUrl || this.visualRegistry.assetUrl(entry.id));
    const complete = () => { this.loadingAssets.delete(entry.id); delete document.body.dataset.assetLabLoading; if (this.selected?.id === entry.id) this.#renderSelected(); };
    const failed = (file) => { if (file?.key !== key) return; this.failedAssets.set(entry.id, `Unable to load ${entry.filename || entry.id}.`); };
    this.load.once(Phaser.Loader.Events.COMPLETE, complete); this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, failed);
    this.load.once(Phaser.Loader.Events.COMPLETE, () => this.load.off(Phaser.Loader.Events.FILE_LOAD_ERROR, failed));
    if (entry.kind === VISUAL_ASSET_KINDS.SPRITESHEET) this.load.spritesheet(key, sourceUrl, { frameWidth: entry.asset.technical.frameWidth, frameHeight: entry.asset.technical.frameHeight });
    else if (entry.kind === VISUAL_ASSET_KINDS.ATLAS) this.load.atlas(key, sourceUrl, version(entry.asset.source.atlasFile));
    else if (entry.kind === VISUAL_ASSET_KINDS.AUDIO) this.load.audio(key, sourceUrl);
    else this.load.image(key, sourceUrl);
    if (entry.comparison?.previousSource && !this.textures.exists(`${LAB_KEY_PREFIX}previous.${entry.id}`)) this.load.image(`${LAB_KEY_PREFIX}previous.${entry.id}`, version(entry.comparison.previousSource));
    this.load.start();
  }

  #ensureComparisonLoaded(entry) {
    const key = `${LAB_KEY_PREFIX}previous.${entry.id}`;
    if (!entry.comparison?.previousSource || this.textures.exists(key) || this.loadingAssets.has(`${entry.id}:comparison`)) return;
    this.loadingAssets.add(`${entry.id}:comparison`);
    this.load.image(key, `${entry.comparison.previousSource}${entry.comparison.previousSource.includes("?") ? "&" : "?"}assetLabComparison=1`);
    this.load.once(Phaser.Loader.Events.COMPLETE, () => { this.loadingAssets.delete(`${entry.id}:comparison`); if (this.selected?.id === entry.id && this.comparisonVisible) this.#renderSelected(); });
    this.load.start();
  }

  #reloadSelected() {
    const entry = this.selected;
    if (!entry || entry.recordType !== "runtime-asset" || entry.asset?.source?.kind !== "file") {
      this.#renderLoadingCard(entry, "Nothing to reload: this is generated, procedural, or contract-only."); return;
    }
    this.previewContainer.removeAll(true); this.#renderLoadingCard(entry, "Reloading changed artwork…");
    this.#ensureSelectedLoaded(entry, { force: true });
  }

  #selectedFrame(entry, stateName) {
    if (this.frameSelect?.value && this.frameSelect.value !== "all") return entry.kind === VISUAL_ASSET_KINDS.SPRITESHEET ? Number(this.frameSelect.value) : this.frameSelect.value;
    const state = entry.states.find(({ name }) => name === stateName);
    return state?.modifier?.frame ?? (entry.frameNames[0] || 0);
  }

  #playSelectedAnimation(entry, object) {
    const animationId = this.animationSelect.value !== "all" ? this.animationSelect.value : null;
    const definition = entry.animations.find(({ id }) => id === animationId);
    const frameCount = entry.kind === VISUAL_ASSET_KINDS.SPRITESHEET
      ? Math.floor((entry.asset?.technical?.width || 0) / (entry.asset?.technical?.frameWidth || 1))
        * Math.floor((entry.asset?.technical?.height || 0) / (entry.asset?.technical?.frameHeight || 1))
      : 1;
    const frames = definition?.frames || [];
    const missingFrames = frames.filter((frame) => Number(frame.frameName ?? frame.frame ?? 0) >= frameCount);
    if (definition && missingFrames.length) {
      this.labWarnings.push({ code: "asset-lab-animation-frame-unavailable", file: entry.id, message: `${definition.id} requires frames outside the ${frameCount}-frame candidate.` });
      return;
    }
    if (definition && !this.anims.exists(definition.runtimeKey)) this.anims.create({
      key: definition.runtimeKey,
      frames: definition.frames.map((frame) => ({ key: this.#textureKey(entry), frame: frame.frameName ?? frame.frame ?? 0 })),
      frameRate: definition.frameRate,
      repeat: definition.repeat,
    });
    if (definition && this.anims.exists(definition.runtimeKey) && object?.play) object.play(definition.runtimeKey);
  }

  #renderLoadingCard(entry, message) {
    const graphics = this.add.graphics().fillStyle(0x102b3a, 0.96).fillRoundedRect(-220, -105, 440, 210, 12).lineStyle(2, 0x8ee8ff, 1).strokeRoundedRect(-220, -105, 440, 210, 12);
    const label = this.add.text(0, -20, message, { color: "#f5fbff", fontFamily: "ui-monospace,monospace", fontSize: "16px", align: "center", wordWrap: { width: 390 } }).setOrigin(0.5);
    const id = this.add.text(0, 35, entry?.id || "No selection", { color: "#aeefff", fontFamily: "ui-monospace,monospace", fontSize: "12px", wordWrap: { width: 390 }, align: "center" }).setOrigin(0.5);
    this.previewContainer.add([graphics, label, id]);
  }

  #renderContractCard(entry) {
    const graphics = this.add.graphics().fillStyle(0x102b3a, 0.97).fillRoundedRect(-250, -150, 500, 300, 12).lineStyle(3, 0xffd077, 1).strokeRoundedRect(-250, -150, 500, 300, 12);
    const heading = this.add.text(0, -105, "PRODUCTION CONTRACT", { color: "#ffd077", fontFamily: "ui-monospace,monospace", fontSize: "20px", fontStyle: "bold" }).setOrigin(0.5);
    const body = this.add.text(0, 5, `${entry.id}\n${entry.categoryContractId}\nWave ${entry.productionFamily?.wave ?? "unassigned"}\n${entry.approvalStatus}\n\nNo runtime artwork is registered yet.`, { color: "#f5fbff", fontFamily: "ui-monospace,monospace", fontSize: "13px", align: "center", wordWrap: { width: 450 } }).setOrigin(0.5);
    this.previewContainer.add([graphics, heading, body]); this.title.setText(entry.id);
  }

  #finishSelectedDetails(entry, prefab, runtimeFindings) {
    const findings = [...(entry.validationFindings || []), ...runtimeFindings];
    const fallbackActive = entry.validationStatus === "placeholder" || findings.some(({ code }) => /fallback|load-failed|missing/.test(code));
    const effectiveValidation = entry.validationStatus === "placeholder" ? "placeholder" : runtimeFindings.length ? "invalid" : entry.validationStatus;
    const effectiveApproval = effectiveValidation === "invalid" ? "blocked" : entry.approvalStatus;
    const status = effectiveValidation === "valid" && !findings.length ? "VALID" : effectiveValidation.toUpperCase();
    const lines = [
      `${status} · ${effectiveApproval} · ${entry.kind}`,
      entry.filename || entry.asset?.source?.owner || entry.productionFamily?.scope || "No runtime file",
      `Scenes: ${entry.sceneIds.join(", ") || "none registered"}`,
      fallbackActive ? "FALLBACK/PLACEHOLDER ACTIVE — not eligible for artwork approval" : null,
      ...findings.map(({ severity = "warning", code, message, expected, actual }) => `${severity.toUpperCase()} ${code}: ${message}${expected != null ? `\n  expected=${JSON.stringify(expected)}` : ""}${actual != null ? `\n  actual=${JSON.stringify(actual)}` : ""}`),
    ].filter(Boolean);
    this.details.className = `warnings ${effectiveValidation === "invalid" ? "invalid" : fallbackActive || findings.length ? "placeholder" : "good"}`;
    this.details.textContent = lines.join("\n");
    const metadata = {
      semanticId: entry.id, recordType: entry.recordType, category: entry.categoryContractId || entry.category,
      status: entry.status, approvalStatus: effectiveApproval, validationStatus: effectiveValidation,
      source: entry.asset?.source || null, technical: entry.asset?.technical || null, runtime: entry.asset?.runtime || null,
      contract: entry.assetContract || entry.categoryContract || null, productionFamily: entry.productionFamily || null,
      candidate: entry.candidate || null,
      prefab: prefab ? { id: prefab.id, family: prefab.family, variant: prefab.variant, origin: prefab.origin || prefab.anchor, geometry: prefab.geometry, sockets: prefab.sockets } : null,
      usage: entry.usages, validationFindings: findings,
    };
    this.metadata.textContent = JSON.stringify(metadata, null, 2);
    document.body.dataset.assetLabSelected = entry.id;
    document.body.dataset.assetLabWarnings = String(findings.length || (fallbackActive ? 1 : 0));
    document.body.dataset.assetLabValidation = effectiveValidation;
    document.body.dataset.assetLabApproval = effectiveApproval;
  }

  #validationSummary() {
    const global = ASSET_LAB_PRODUCTION_INDEX.validation;
    return {
      runtimeRecords: this.catalog.filter(({ recordType }) => recordType === "runtime-asset").length,
      productionFamilies: this.catalog.filter(({ recordType }) => recordType === "production-family").length,
      placeholders: this.catalog.filter(({ validationStatus }) => validationStatus === "placeholder").length,
      invalid: this.catalog.filter(({ validationStatus }) => validationStatus === "invalid").length,
      orphanedFiles: global.orphanedFiles.length, duplicateContent: global.duplicateContent.length, unusedEntries: global.unusedEntries.length,
    };
  }

  #showGlobalDiagnostics() {
    const summary = this.#validationSummary(), findings = ASSET_LAB_PRODUCTION_INDEX.validation.findings;
    this.details.className = `warnings ${summary.invalid || summary.orphanedFiles ? "invalid" : summary.placeholders ? "placeholder" : "good"}`;
    this.details.textContent = `PROJECT ASSET DIAGNOSTICS\n${JSON.stringify(summary, null, 2)}\n${findings.length ? findings.map(({ severity, code, message }) => `${severity.toUpperCase()} ${code}: ${message}`).join("\n") : "No deep manifest/file findings."}`;
  }

  #canvasBoundsFor(object) {
    const width = object?.displayWidth || object?.width || 0, height = object?.displayHeight || object?.height || 0;
    return { kind: "rectangle", x: -(object?.originX ?? 0.5) * width, y: -(object?.originY ?? 0.5) * height, width, height };
  }

  #inspectOpaqueBounds(object) {
    if (!object?.texture || !object?.frame) return null;
    const image = object.texture.getSourceImage?.(object.frame.sourceIndex ?? 0); if (!image) return null;
    const frame = object.frame, width = frame.cutWidth || frame.width, height = frame.cutHeight || frame.height;
    if (!(width > 0 && height > 0)) return null;
    try {
      const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height;
      const context = canvas.getContext("2d", { willReadFrequently: true }); context.drawImage(image, frame.cutX || 0, frame.cutY || 0, width, height, 0, 0, width, height);
      const data = context.getImageData(0, 0, width, height).data; let minX = width, minY = height, maxX = -1, maxY = -1;
      for (let y = 0; y < height; y += 1) for (let x = 0; x < width; x += 1) if (data[(y * width + x) * 4 + 3] > 0) { minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); }
      if (maxX < minX) return null;
      const scaleX = object.displayWidth / width, scaleY = object.displayHeight / height;
      return { kind: "rectangle", x: (minX - (object.originX ?? 0.5) * width) * scaleX, y: (minY - (object.originY ?? 0.5) * height) * scaleY, width: (maxX - minX + 1) * scaleX, height: (maxY - minY + 1) * scaleY };
    } catch (error) {
      this.labWarnings.push({ code: "opaque-bounds-inspection-failed", file: this.selected?.id, message: error.message }); return null;
    }
  }

  #syncFrameScrubber() {
    const frames = this.previewSprite?.anims?.currentAnim?.frames || [];
    this.frameScrubber.max = String(Math.max(0, frames.length - 1)); this.frameScrubber.value = "0";
    this.frameReadout.textContent = `Frame 1/${Math.max(1, frames.length)}`; this.frameScrubber.disabled = frames.length < 2;
  }

  #scrubAnimation(index) {
    const animation = this.previewSprite?.anims?.currentAnim, frames = animation?.frames || []; if (!frames[index]) return;
    this.animationPaused = true; this.previewSprite.anims.pause(frames[index]); this.frameReadout.textContent = `Frame ${index + 1}/${frames.length}`;
    this.opaqueBounds = this.#inspectOpaqueBounds(this.previewSprite); this.#drawOverlays();
  }

  #applyLighting() {
    const lighting = getLightingForMinutes(LIGHTING_TIMES[this.lightingPhase] ?? LIGHTING_TIMES.day);
    this.lightingOverlay.setAlpha(lighting.overlayAlpha);
    document.body.dataset.assetLabLighting = lighting.phase;
  }

  #renderResident(entry) {
    const facing = this.facingSelect.value === "all" ? "down" : this.facingSelect.value;
    const sprite = this.add.sprite(0, 0, `resident-${facing}-0`).setOrigin(0.5, 0.88).setData("assetLabLayer", "body");
    this.previewSprite = sprite; this.layerObjects.push(sprite); this.previewContainer.add(sprite);
    const animationId = this.animationSelect.value !== "all" ? this.animationSelect.value : entry.animations.find(({ id }) => id.endsWith(`.${facing}`))?.id;
    const definition = entry.animations.find(({ id }) => id === animationId) || entry.animations.find(({ id }) => id.endsWith(`.${facing}`));
    if (definition && this.anims.exists(definition.runtimeKey)) sprite.play(definition.runtimeKey);
    this.canvasBounds = this.#canvasBoundsFor(sprite); this.opaqueBounds = this.#inspectOpaqueBounds(sprite);
    return sprite;
  }

  #renderProcedural(prefab, stateName) {
    const recipe = prefab.proceduralRecipe.placed || prefab.proceduralRecipe.public || prefab.proceduralRecipe.collection;
    const modifier = this.selected.states.find(({ name, prefabId }) => name === stateName && prefabId === prefab.id)?.modifier || {};
    const container = this.add.container(0, 0); this.previewContainer.add(container);
    const shadow = this.add.ellipse(recipe.shadow?.x || 0, recipe.shadow?.y || 17, recipe.shadow?.width || 38, recipe.shadow?.height || 13, recipe.shadow?.color || 0x20382c, recipe.shadow?.alpha ?? 0.25).setData("assetLabLayer", "shadow").setData("assetLabShadow", true);
    container.add(shadow); this.layerObjects.push(shadow);
    const graphics = this.add.graphics().setData("assetLabLayer", "body");
    if (recipe.lid) graphics.fillStyle(recipe.lid.color, 1).fillRoundedRect(recipe.lid.x, recipe.lid.y, recipe.lid.width, recipe.lid.height, recipe.lid.radius || 2);
    if (recipe.body?.radius != null) graphics.fillStyle(recipe.body.color, 1).fillRoundedRect(recipe.body.x, recipe.body.y, recipe.body.width, recipe.body.height, recipe.body.radius);
    else if (recipe.body) graphics.fillStyle(modifier.tipped ? recipe.body.tippedColor : recipe.body.color, 1).fillRect(-recipe.body.width / 2, -recipe.body.height / 2, recipe.body.width, recipe.body.height);
    if (modifier.tipped) graphics.setRotation(recipe.tippedRotation || Math.PI / 2.5);
    container.add(graphics); this.layerObjects.push(graphics);
    const mark = this.add.graphics().setData("assetLabLayer", "mark");
    if (recipe.recyclingMark) mark.lineStyle(recipe.recyclingMark.width, recipe.recyclingMark.color, 1).strokeCircle(recipe.recyclingMark.x, recipe.recyclingMark.y, recipe.recyclingMark.radius);
    if (recipe.mark) mark.lineStyle(2, recipe.mark.color, 1).strokeCircle(recipe.mark.x, recipe.mark.y, recipe.mark.radius);
    container.add(mark); this.layerObjects.push(mark);
    const status = this.add.text(0, -38, modifier.full ? "FULL" : modifier.carried ? "CARRIED" : modifier.tipped ? "TIPPED" : "", { color: "#fff", fontSize: "10px", backgroundColor: "#294637", padding: { x: 3, y: 2 } }).setOrigin(0.5).setData("assetLabLayer", "status");
    container.add(status); this.layerObjects.push(status); return container;
  }

  #applyPlayback() {
    if (!this.previewSprite?.anims) return;
    this.previewSprite.anims.timeScale = this.playbackSpeed;
    if (this.animationPaused) this.previewSprite.anims.pause(); else this.previewSprite.anims.resume();
  }

  #applyLayerIsolation() {
    const isolated = this.layerSelect?.value || "all";
    for (const object of this.layerObjects || []) {
      const layer = object.getData?.("assetLabLayer") || "main";
      const shadow = object.getData?.("assetLabShadow") || layer === "shadow";
      object.setVisible?.((isolated === "all" || layer === isolated) && (!shadow || this.shadowVisible));
    }
  }

  #drawOverlays(prefab = this.selected?.prefabs?.[0] || null) {
    const graphics = this.overlayGraphics; graphics.clear();
    if (this.comparisonVisible && this.selected?.comparison?.previousSource) return;
    const ox = this.previewContainer.x, oy = this.previewContainer.y, zoom = this.previewZoom;
    const scaled = (value) => value * zoom;
    const draw = (geometry, color) => {
      if (geometry.kind === "circle") graphics.lineStyle(2, color, 0.9).strokeCircle(ox + scaled(geometry.x), oy + scaled(geometry.y), scaled(geometry.radius));
      else if (geometry.kind === "rectangle") graphics.lineStyle(2, color, 0.9).strokeRect(ox + scaled(geometry.x), oy + scaled(geometry.y), scaled(geometry.width), scaled(geometry.height));
      else if (geometry.kind === "polygon" && geometry.points?.length) graphics.lineStyle(2, color, 0.9).strokePoints(geometry.points.map(({ x, y }) => ({ x: ox + scaled(x), y: oy + scaled(y) })), true);
    };
    const nativeWidth = this.selected?.asset?.technical?.frameWidth || this.selected?.asset?.technical?.width || 64;
    const nativeHeight = this.selected?.asset?.technical?.frameHeight || this.selected?.asset?.technical?.height || 64;
    const visual = prefab?.geometry?.visual || { kind: "rectangle", x: -nativeWidth / 2, y: -nativeHeight / 2, width: nativeWidth, height: nativeHeight };
    if (this.overlayFlags.canvas && this.canvasBounds) draw(this.canvasBounds, 0xffffff);
    if (this.overlayFlags.frame && this.canvasBounds && [VISUAL_ASSET_KINDS.SPRITESHEET, VISUAL_ASSET_KINDS.ATLAS].includes(this.selected?.kind)) draw(this.canvasBounds, 0xff72dc);
    if (this.overlayFlags.opaque && this.opaqueBounds) draw(this.opaqueBounds, 0x63ff81);
    if (this.overlayFlags.bounds) draw(visual, 0x58b9ff);
    if (this.overlayFlags.origin) graphics.fillStyle(0xffffff, 1).fillCircle(ox, oy, 4);
    const ground = prefab?.groundContactAnchor || { x: 0, y: visual.y + visual.height };
    if (this.overlayFlags.ground) graphics.lineStyle(3, 0xffea73, 1).lineBetween(ox + scaled(ground.x) - 14, oy + scaled(ground.y), ox + scaled(ground.x) + 14, oy + scaled(ground.y));
    const groups = [["collision", 0xff5c5c], ["navigation", 0xa878ff], ["interaction", 0xffbd4a], ["touch", 0x47e3e8]];
    for (const [key, color] of groups) if (this.overlayFlags[key]) for (const item of geometryItems(prefab?.geometry?.[key], key)) draw(item, color);
    if (this.overlayFlags.sockets) for (const socket of Object.values(prefab?.sockets || {})) { graphics.lineStyle(2, 0x8dff8a, 1).strokeCircle(ox + scaled(socket.x), oy + scaled(socket.y), 5).lineBetween(ox + scaled(socket.x) - 8, oy + scaled(socket.y), ox + scaled(socket.x) + 8, oy + scaled(socket.y)); }
    if (this.overlayFlags.standing) for (const [name, socket] of Object.entries(prefab?.sockets || {}).filter(([name]) => /approach|standing|station|seat|use|door|gate|entry/i.test(name))) {
      graphics.lineStyle(3, 0x00ffbf, 1).strokeCircle(ox + scaled(socket.x), oy + scaled(socket.y), 9);
    }
  }

  #drawViewportFrames() {
    this.viewportGraphics.clear();
    const selected = this.viewportProfile && this.viewportProfile !== "all" ? SUPPORTED_LANDSCAPE_VIEWPORTS.filter(({ id }) => id === this.viewportProfile) : [];
    selected.forEach((profile, index) => {
      const scale = Math.min(440 / profile.width, 210 / profile.height);
      const width = profile.width * scale, height = profile.height * scale;
      const x = 1030 - width / 2, y = 345 - height / 2, color = [0x7de5ff, 0xffc970, 0x8eff99, 0xff8fdd, 0xffffff][index % 5];
      this.viewportGraphics.lineStyle(2, color, 0.75).strokeRect(x, y, width, height);
      const safe = resolveHudSafeArea(profile), safeScaleX = width / profile.width, safeScaleY = height / profile.height;
      this.viewportGraphics.lineStyle(1, 0x8eff99, 0.8).strokeRect(x + safe.x * safeScaleX, y + safe.y * safeScaleY, safe.width * safeScaleX, safe.height * safeScaleY);
    });
    const profile = selected[0];
    if (profile) document.body.dataset.assetLabViewport = `${profile.id}:${profile.width}x${profile.height}:safe:${HUD_SAFE_AREA.minimumCssInset}:touch:${HUD_SAFE_AREA.minimumTouchTargetCssPixels}`;
    else delete document.body.dataset.assetLabViewport;
  }

  #exportScreenshot() { this.game.canvas.toBlob((blob) => blob && downloadBlob(blob, `kindworks-asset-lab-${this.selected?.id || "asset"}.png`), "image/png"); }

  #exportContactSheet() {
    const source = this.filteredCatalog || this.catalog, pageCount = Math.max(1, Math.ceil(source.length / CONTACT_SHEET_PAGE_SIZE));
    const page = Math.min(this.listPage, pageCount - 1), entries = source.slice(page * CONTACT_SHEET_PAGE_SIZE, (page + 1) * CONTACT_SHEET_PAGE_SIZE);
    const canvas = document.createElement("canvas"); canvas.width = 960; canvas.height = Math.max(240, Math.ceil(entries.length / 4) * 220);
    const context = canvas.getContext("2d"); context.imageSmoothingEnabled = false; context.fillStyle = "#14242b"; context.fillRect(0, 0, canvas.width, canvas.height); context.font = "12px ui-monospace,monospace"; context.fillStyle = "#fff";
    entries.forEach((entry, index) => { const x = (index % 4) * 240, y = Math.floor(index / 4) * 220; context.strokeStyle = "#5e8390"; context.strokeRect(x + 6, y + 6, 228, 208); context.fillStyle = "#fff"; context.fillText(entry.id.slice(0, 31), x + 12, y + 24); const key = entry.asset && this.#textureKey(entry); const image = key && this.textures.exists(key) ? this.textures.get(key).getSourceImage() : null; if (image) { const scale = Math.min(190 / image.width, 145 / image.height, 1); context.drawImage(image, x + 120 - image.width * scale / 2, y + 42, image.width * scale, image.height * scale); } else { context.fillStyle = entry.validationStatus === "placeholder" ? "#d99a31" : "#29485a"; context.fillRect(x + 90, y + 80, 60, 60); context.fillStyle = "#fff"; context.fillText(entry.kind, x + 12, y + 198); } });
    canvas.toBlob((blob) => blob && downloadBlob(blob, `kindworks-asset-lab-contact-sheet-page-${page + 1}-of-${pageCount}.png`));
  }

  #destroyLab() {
    this.panel?.remove(); this.panelToggle?.remove(); document.querySelector(`#${STYLE_ID}`)?.remove();
    for (const key of ["assetLabReady", "assetLabAssetCount", "assetLabCoverage", "assetLabSelected", "assetLabWarnings", "assetLabLastExport", "assetLabValidationSummary", "assetLabValidation", "assetLabApproval", "assetLabLoading", "assetLabLighting", "assetLabViewport"]) delete document.body.dataset[key];
  }
}
