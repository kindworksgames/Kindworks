import Phaser from "phaser";
import {
  POWERWASH_CANVAS,
  POWERWASH_GRID,
  POWERWASH_NOZZLES,
} from "../data/playgroundPowerwash.js";
import { LegacyPowerwashRenderer } from "../rendering/LegacyPowerwashRenderer.js";

const ROOM = Object.freeze({ width: 1280, height: 720 });

function setText(selector, value) { const element = document.querySelector(selector); if (element) element.textContent = String(value); }
function show(selector, visible) { document.querySelector(selector)?.classList.toggle("hidden", !visible); }

export class PlaygroundPowerwashScene extends Phaser.Scene {
  constructor() { super("PlaygroundPowerwashScene"); this.entryData = {}; }
  init(data = {}) { this.entryData = data; this.transitioning = false; this.exitArmedUntil = 0; this.lastResultContext = null; this.spraying = false; this.sprayClock = 0; this.recoveryClock = 0; this.visualPercentClock = 0; this.lastAppliedCell = null; this.lastAppliedPoint = null; this.pointerCell = null; this.pointerCanvas = null; this.visualRenderer = null; }

  create() {
    this.powerwash = this.registry.get("playgroundPowerwash");
    this.gameState = this.registry.get("gameState");
    this.worldSimulation = this.registry.get("worldSimulation");
    this.npcTownLife = this.registry.get("npcTownLife");
    this.qaMode = import.meta.env.DEV && ["powerwash", "fidelity"].includes(new URLSearchParams(window.location.search).get("qa"));
    this.worldSimulation?.setPaused("activity", true);
    this.npcTownLife?.setPaused("activity", true);
    this.drawBackdrop();
    this.bindInterface();
    this.setSceneInterface();
    this.prepareApprovedArtwork();
    const active = this.powerwash.getActiveSession();
    if (active) this.render();
    else this.startLevel(this.entryData.requestedLevel || this.entryData.level || this.powerwash.getCampaignSnapshot().nextLevel);
    this.cameras.main.fadeIn(220, 7, 20, 43);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.shutdownScene());
  }

  prepareApprovedArtwork() {
    const load = (path) => new Promise((resolve, reject) => {
      const image = new Image();
      image.decoding = "async";
      image.addEventListener("load", () => resolve(image), { once: true });
      image.addEventListener("error", () => reject(new Error(`Power Washing artwork failed to load: ${path}`)), { once: true });
      image.src = `${import.meta.env.BASE_URL}assets/powerwash/${path}`;
    });
    this.artworkReady = false;
    Promise.all([load("playground-master.png"), load("playground-reference-dirt.png"), load("tool-precision.png"), load("tool-standard.png"), load("tool-wide.png")]).then(([master, dirt, precision, standard, wide]) => {
      if (!this.scene?.isActive?.()) return;
      this.masterArtwork = master;
      this.referenceDirtArtwork = dirt;
      this.toolArtwork = { precision, standard, wide };
      this.artworkReady = true;
      this.buildVisualRenderer();
      this.render();
    }).catch((error) => {
      this.artworkError = error.message;
      this.setMessage("The approved playground artwork could not be loaded.", "error");
      this.drawBoard();
    });
  }

  drawBackdrop() {
    this.add.rectangle(ROOM.width / 2, ROOM.height / 2, ROOM.width, ROOM.height, 0x07142b);
    const art = this.add.graphics();
    art.fillStyle(0x739040, 1); art.fillRect(0, 0, ROOM.width, ROOM.height);
    art.fillStyle(0x8ca64b, 0.75); for (let x = 0; x < ROOM.width; x += 42) for (let y = 0; y < ROOM.height; y += 38) art.fillRect(x + ((y / 38) % 2) * 10, y, 5, 3);
    art.fillStyle(0x102745, 0.96); art.fillRect(0, 0, ROOM.width, 56); art.fillRect(0, ROOM.height - 64, ROOM.width, 64);
    this.add.text(640, 28, "PLAYGROUND POWER WASH · WILLOW COMMONS", { color: "#fff1bc", fontFamily: "ui-monospace, monospace", fontSize: "18px", fontStyle: "bold", stroke: "#020611", strokeThickness: 5 }).setOrigin(0.5).setDepth(4);
  }

  bindInterface() {
    this.hud = document.querySelector("#powerwash-hud");
    this.canvas = document.querySelector("#powerwash-board");
    this.context = this.canvas?.getContext("2d");
    this.buttons = {
      exit: document.querySelector("#powerwash-exit"),
      soap: document.querySelector("#powerwash-soap-tool"), precision: document.querySelector("#powerwash-precision"),
      standard: document.querySelector("#powerwash-standard"), wide: document.querySelector("#powerwash-wide"),
      retry: document.querySelector("#powerwash-retry"), qa: document.querySelector("#powerwash-qa-complete"), return: document.querySelector("#powerwash-return"),
    };
    this.onExit = () => this.requestExit();
    this.onRetry = () => this.restart();
    this.onQa = () => this.runCertifiedCompletion();
    this.onReturn = () => this.returnToTown(true);
    this.toolHandlers = {
      soap: () => this.selectTool("soap"),
      precision: () => this.selectTool("water", "precision"),
      standard: () => this.selectTool("water", "standard"),
      wide: () => this.selectTool("water", "wide"),
    };
    this.onPointerDown = (event) => { this.updatePointerCell(event); if (!this.pointerCell) return; this.spraying = true; this.sprayClock = 0; this.lastAppliedCell = { ...this.pointerCell }; this.lastAppliedPoint = { ...this.pointerCanvas }; this.canvas?.setPointerCapture?.(event.pointerId); this.applySpray(55); };
    this.onPointerMove = (event) => { this.updatePointerCell(event); if (!this.spraying) this.drawBoard(); };
    this.onPointerUp = () => { this.spraying = false; this.sprayClock = 0; this.lastAppliedCell = null; this.lastAppliedPoint = null; this.drawBoard(); };
    this.onKeyDown = (event) => {
      if (event.key === "Escape") return this.requestExit();
      if (event.key === "1") this.selectTool("soap");
      if (event.key === "2") this.selectTool("water", "precision");
      if (event.key === "3") this.selectTool("water", "standard");
      if (event.key === "4") this.selectTool("water", "wide");
      if (event.key.toLowerCase() === "r") this.restart();
      if (this.qaMode && event.key.toLowerCase() === "q") this.runCertifiedCompletion();
    };
    this.buttons.exit?.addEventListener("click", this.onExit);
    for (const [key, handler] of Object.entries(this.toolHandlers)) this.buttons[key]?.addEventListener("click", handler);
    this.buttons.retry?.addEventListener("click", this.onRetry); this.buttons.qa?.addEventListener("click", this.onQa); this.buttons.return?.addEventListener("click", this.onReturn);
    this.canvas?.addEventListener("pointerdown", this.onPointerDown); this.canvas?.addEventListener("pointermove", this.onPointerMove); this.canvas?.addEventListener("pointerup", this.onPointerUp); this.canvas?.addEventListener("pointercancel", this.onPointerUp); this.canvas?.addEventListener("pointerleave", this.onPointerUp); window.addEventListener("keydown", this.onKeyDown);
    this.buttons.qa?.classList.toggle("hidden", !this.qaMode); this.hud?.classList.remove("hidden");
    if (this.buttons.exit) { this.buttons.exit.textContent = "✕"; this.buttons.exit.setAttribute("aria-label", "Exit Playground Power Wash safely"); }
    const session = this.powerwash.getActiveSession(); show("#powerwash-gameplay", Boolean(session)); show("#powerwash-result", false);
    this.setMessage(session?.mode === "town-job" ? "Wash at least 97% clean." : "Drag to wash. Soap dark stains first.", session ? "success" : "neutral");
  }

  setSceneInterface() {
    document.body.dataset.gameScene = this.scene.key;
    setText(".milestone-badge", "PLAYGROUND POWER WASH");
    setText("#location-status", "Commons Playground");
    setText("#control-hint", "Hold or drag to spray.");
    setText("#landscape-required-message", "Turn your device sideways to play.");
  }

  startLevel(level) {
    const previous = this.powerwash.getActiveSession();
    if (previous) this.powerwash.cancel(previous.id);
    const result = this.powerwash.beginCampaign(level, { returnPosition: previous?.returnPosition || this.entryData.returnPosition, returnFacing: previous?.returnFacing || this.entryData.returnFacing || "up" });
    if (!result.ok) { this.setMessage(result.message, "error"); return false; }
    this.lastResultContext = null; this.pointerCell = null;
    show("#powerwash-gameplay", true); show("#powerwash-result", false);
    this.setMessage("Drag to wash. Soap dark stains first.", "success");
    this.buildVisualRenderer(true);
    this.render(); return true;
  }

  selectTool(tool, nozzle = "precision") {
    const session = this.powerwash.getActiveSession(); if (!session) return false;
    const result = this.powerwash.selectTool(session.id, tool, nozzle);
    if (!result.ok) { this.setMessage(result.message, "error"); return false; }
    this.setMessage(tool === "soap" ? "Soap selected. Cover dark stains." : `${POWERWASH_NOZZLES[nozzle].label} nozzle selected.`, "hint");
    this.render(); return true;
  }

  updatePointerCell(event) {
    if (!this.canvas) return null;
    const rect = this.canvas.getBoundingClientRect();
    const canvasX = ((event.clientX - rect.left) / Math.max(1, rect.width)) * POWERWASH_CANVAS.width;
    const canvasY = ((event.clientY - rect.top) / Math.max(1, rect.height)) * POWERWASH_CANVAS.height;
    this.pointerCanvas = { x: canvasX, y: canvasY };
    if (this.visualRenderer) this.visualRenderer.pointer = { ...this.pointerCanvas };
    const wash = POWERWASH_CANVAS.wash;
    if (canvasX < wash.x || canvasX > wash.x + wash.width || canvasY < wash.y || canvasY > wash.y + wash.height) {
      this.pointerCell = null;
      return null;
    }
    this.pointerCell = {
      row: Math.max(0, Math.min(POWERWASH_GRID.rows - 1, Math.floor(((canvasY - wash.y) / wash.height) * POWERWASH_GRID.rows))),
      col: Math.max(0, Math.min(POWERWASH_GRID.columns - 1, Math.floor(((canvasX - wash.x) / wash.width) * POWERWASH_GRID.columns))),
    };
    return this.pointerCell;
  }

  applySpray(elapsedMs) {
    const session = this.powerwash.getActiveSession(); const cell = this.pointerCell; const point = this.pointerCanvas; if (!session || !cell || !point || this.transitioning) return false;
    const visualState = this.powerwash.getSessionState();
    const from = this.lastAppliedCell || cell;
    const visualFrom = this.lastAppliedPoint || point;
    const result = this.powerwash.sprayPath(session.id, from, cell, elapsedMs, { autoComplete: false, visualSegment: { from: visualFrom, to: point } });
    if (result.ok) this.visualRenderer?.applySegment(this.lastAppliedPoint || point, point, visualState);
    this.lastAppliedCell = { ...cell };
    this.lastAppliedPoint = { ...point };
    if (!result.ok) this.setMessage(result.message || "The washer is recovering.", "error");
    else if (result.result) this.showResult(result.result, session);
    else {
      if (result.code === "soap-first") this.setMessage("Use soap on dark stains first.", "hint");
      this.render();
    }
    return result.ok;
  }

  update(_time, delta) {
    const session = this.powerwash?.getActiveSession?.();
    if (!session || this.transitioning || this.lastResultContext) return;
    const visualState = this.powerwash.getSessionState();
    this.visualRenderer?.tick(delta);
    this.visualPercentClock += Math.min(100, Number(delta) || 0);
    if (this.visualRenderer && this.visualPercentClock >= 200) {
      this.visualPercentClock = 0;
      const visualPercent = this.visualRenderer.calculatePercent();
      document.querySelector("#game")?.setAttribute("data-powerwash-clean", String(visualPercent));
      if (visualPercent >= 97) {
        const completed = this.powerwash.completeVisual(session.id, visualPercent);
        if (!completed.ok) this.setMessage(completed.message, "error");
        else this.showResult(completed.result, session);
        return;
      }
    }
    this.visualRenderer?.draw(visualState, this.spraying && Boolean(this.pointerCell) && (visualState.toolMode === "soap" ? visualState.soap : visualState.water) > 2);
    if (this.spraying && this.pointerCell) {
      this.recoveryClock = 0;
      this.sprayClock += Math.min(100, Number(delta) || 0);
      if (this.sprayClock >= 50) {
        const elapsed = this.sprayClock;
        this.sprayClock = 0;
        this.applySpray(elapsed);
      }
      return;
    }
    this.sprayClock = 0;
    this.recoveryClock += Math.min(250, Number(delta) || 0);
    if (this.recoveryClock < 250) return;
    const elapsed = this.recoveryClock;
    this.recoveryClock = 0;
    const recovered = this.powerwash.recoverSupplies(session.id, elapsed);
    if (recovered.ok && recovered.changed) this.render();
  }

  restart() {
    const session = this.powerwash.getActiveSession(); if (!session) return false;
    const result = this.powerwash.restart(session.id); if (!result.ok) { this.setMessage(result.message, "error"); return false; }
    this.pointerCell = null; this.pointerCanvas = null; this.buildVisualRenderer(true); this.setMessage("Playground restarted.", "success"); this.render(); return true;
  }

  runCertifiedCompletion() {
    if (!this.qaMode) return false;
    const session = this.powerwash.getActiveSession(); if (!session) return false;
    const result = this.powerwash.completeCertified(session.id); if (!result.ok) { this.setMessage(result.message, "error"); return false; }
    this.showResult(result.result, session); return true;
  }

  render() {
    const session = this.powerwash.getActiveSession();
    if (!session) { this.updateDomState(); return; }
    const state = this.powerwash.getSessionState();
    for (const key of ["soap", "precision", "standard", "wide"]) {
      const selected = key === "soap" ? state.toolMode === "soap" : state.toolMode === "water" && state.nozzle === key;
      this.buttons[key]?.classList.toggle("active", selected); this.buttons[key]?.setAttribute("aria-pressed", String(selected));
    }
    if (this.buttons.retry) { this.buttons.retry.disabled = state.strokes === 0; this.buttons.retry.classList.toggle("hidden", state.strokes === 0); }
    this.drawBoard(); this.updateDomState();
  }

  drawBoard() {
    const state = this.powerwash.getSessionState(); if (!state || !this.context || !this.canvas) return;
    const context = this.context; const width = this.canvas.width; const height = this.canvas.height;
    context.imageSmoothingEnabled = false; context.clearRect(0, 0, width, height);
    if (!this.artworkReady || !this.masterArtwork || !this.referenceDirtArtwork) {
      context.fillStyle = "#07142b"; context.fillRect(0, 0, width, height);
      context.fillStyle = "#fff1bc"; context.font = "900 34px ui-monospace, monospace"; context.textAlign = "center";
      context.fillText(this.artworkError ? "ARTWORK LOAD ERROR" : "LOADING APPROVED PLAYGROUND…", width / 2, height / 2);
      return;
    }
    if (!this.visualRenderer || this.visualRenderer.level !== state.level) this.buildVisualRenderer(true);
    this.visualRenderer?.draw(state, this.spraying && Boolean(this.pointerCell));
    this.canvas.setAttribute("aria-label", "Playground Power Wash surface using the approved legacy artwork");
  }

  buildVisualRenderer(force = false) {
    const state = this.powerwash?.getSessionState?.();
    if (!state || !this.canvas || !this.artworkReady || !this.masterArtwork || !this.referenceDirtArtwork) return null;
    if (!force && this.visualRenderer?.level === state.level) return this.visualRenderer;
    const session = this.powerwash.getActiveSession();
    this.visualRenderer = new LegacyPowerwashRenderer({ canvas: this.canvas, masterArtwork: this.masterArtwork, referenceDirtArtwork: this.referenceDirtArtwork, toolArtwork: this.toolArtwork, level: state.level, state: { ...state, visualCheckpoint: session?.visualCheckpoint } });
    if (this.pointerCanvas) this.visualRenderer.pointer = { ...this.pointerCanvas };
    return this.visualRenderer;
  }

  showResult(result, session) {
    this.spraying = false;
    this.lastResultContext = { level: result.level, mode: session.mode, returnPosition: session.returnPosition, returnFacing: session.returnFacing };
    show("#powerwash-gameplay", false); show("#powerwash-result", true);
    setText("#powerwash-result-title", session.mode === "town-job" ? "Commons Playground restored!" : "Playground restored!");
    setText("#powerwash-result-message", session.mode === "town-job" ? "The playground is sparkling again." : result.firstClear ? "Cleanup saved." : "Best cleanup saved.");
    setText("#powerwash-result-coins", `+${result.rewardCoins} 🪙`);
    this.setMessage("Playground saved.", "success"); this.render();
  }

  setMessage(message, status = "neutral") { const element = document.querySelector("#powerwash-status"); if (element) { element.textContent = message || "Continue power washing."; element.dataset.status = status; } }
  updateDomState() { const game = document.querySelector("#game"); if (!game) return; const session = this.powerwash.getActiveSession(); const state = this.powerwash.getSessionState(); const diagnostics = this.powerwash.getDiagnostics(); game.dataset.scene = this.scene.key; game.dataset.powerwashLevel = String(session?.assignedLevel || diagnostics.nextLevel); game.dataset.powerwashMode = session?.mode || this.lastResultContext?.mode || "starting"; game.dataset.powerwashPhase = this.lastResultContext ? "result" : session?.status || "starting"; game.dataset.powerwashClean = String(this.visualRenderer?.lastPercent ?? state?.percent ?? 0); game.dataset.powerwashTool = state?.toolMode || "none"; game.dataset.powerwashNozzle = state?.nozzle || "none"; game.dataset.powerwashCompleted = String(diagnostics.completed); game.dataset.powerwashCatalogue = String(diagnostics.totalLevels); game.dataset.powerwashCatalogueValid = String(diagnostics.catalogueValid); }

  requestExit() { const session = this.powerwash.getActiveSession(); if (session && Date.now() > this.exitArmedUntil) { this.exitArmedUntil = Date.now() + 3000; if (this.buttons.exit) { this.buttons.exit.textContent = "✓"; this.buttons.exit.setAttribute("aria-label", "Confirm exit"); } this.time.delayedCall(3000, () => { if (!this.transitioning && this.buttons.exit) { this.buttons.exit.textContent = "✕"; this.buttons.exit.setAttribute("aria-label", "Exit Playground Power Wash safely"); } }); this.setMessage("Tap Confirm Exit to leave this attempt.", "error"); return false; } return this.returnToTown(false); }
  returnToTown(complete) { if (this.transitioning) return false; this.transitioning = true; const active = this.powerwash.getActiveSession(); const context = active || this.lastResultContext || {}; if (active) this.powerwash.cancel(active.id); const position = context.returnPosition || this.entryData.returnPosition || { x: 1940, y: 1180 }; const facing = context.returnFacing || this.entryData.returnFacing || "up"; this.gameState.updatePlayer({ scene: "TownScene", x: position.x, y: position.y, facing }); document.querySelector("#game")?.setAttribute("data-transition", complete ? "powerwash-complete" : "leaving-powerwash"); this.cameras.main.fadeOut(220, 7, 20, 43); this.time.delayedCall(240, () => this.scene.start("TownScene", { returnPosition: position, returnFacing: facing, transitionCount: Number(this.entryData.transitionCount || 0) + 1 })); return true; }

  shutdownScene() {
    this.buttons.exit?.removeEventListener("click", this.onExit);
    for (const [key, handler] of Object.entries(this.toolHandlers || {})) this.buttons[key]?.removeEventListener("click", handler);
    this.buttons.retry?.removeEventListener("click", this.onRetry); this.buttons.qa?.removeEventListener("click", this.onQa); this.buttons.return?.removeEventListener("click", this.onReturn);
    this.canvas?.removeEventListener("pointerdown", this.onPointerDown); this.canvas?.removeEventListener("pointermove", this.onPointerMove); this.canvas?.removeEventListener("pointerup", this.onPointerUp); this.canvas?.removeEventListener("pointercancel", this.onPointerUp); this.canvas?.removeEventListener("pointerleave", this.onPointerUp); window.removeEventListener("keydown", this.onKeyDown);
    this.hud?.classList.add("hidden"); this.worldSimulation?.setPaused("activity", false); this.npcTownLife?.setPaused("activity", false);
  }

  getMilestoneState() { return { scene: this.scene.key, gameplayConnected: true, landscapeRequired: true, pointerControls: true, keyboardToolControls: true, soapThenWaterRequired: true, completionTolerance: 97, ...this.powerwash.getDiagnostics(), session: this.powerwash.getActiveSession(), legacySaveUntouched: true }; }
}
