import Phaser from "phaser";
import {
  POWERWASH_GRID,
  POWERWASH_NOZZLES,
  POWERWASH_TOTAL_LEVELS,
  PlaygroundPowerwashEngine,
  powerwashLevelSummary,
} from "../data/playgroundPowerwash.js";
import { calculatePowerwashCampaignReward } from "../systems/PlaygroundPowerwashService.js";

const ROOM = Object.freeze({ width: 1280, height: 720 });

function setText(selector, value) { const element = document.querySelector(selector); if (element) element.textContent = String(value); }
function show(selector, visible) { document.querySelector(selector)?.classList.toggle("hidden", !visible); }

export class PlaygroundPowerwashScene extends Phaser.Scene {
  constructor() { super("PlaygroundPowerwashScene"); this.entryData = {}; }
  init(data = {}) { this.entryData = data; this.transitioning = false; this.exitArmedUntil = 0; this.lastResultContext = null; this.spraying = false; this.lastSprayAt = 0; this.lastSprayCell = null; this.pointerCell = null; }

  create() {
    this.powerwash = this.registry.get("playgroundPowerwash");
    this.gameState = this.registry.get("gameState");
    this.worldSimulation = this.registry.get("worldSimulation");
    this.npcTownLife = this.registry.get("npcTownLife");
    this.qaMode = import.meta.env.DEV && new URLSearchParams(window.location.search).get("qa") === "powerwash";
    this.worldSimulation?.setPaused("activity", true);
    this.npcTownLife?.setPaused("activity", true);
    this.drawBackdrop();
    this.bindInterface();
    this.setSceneInterface();
    this.render();
    this.cameras.main.fadeIn(220, 7, 20, 43);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.shutdownScene());
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
    this.levelSelect = document.querySelector("#powerwash-level-select");
    this.canvas = document.querySelector("#powerwash-board");
    this.context = this.canvas?.getContext("2d");
    this.buttons = {
      start: document.querySelector("#powerwash-level-start"), exit: document.querySelector("#powerwash-exit"),
      soap: document.querySelector("#powerwash-soap-tool"), precision: document.querySelector("#powerwash-precision"),
      standard: document.querySelector("#powerwash-standard"), wide: document.querySelector("#powerwash-wide"),
      retry: document.querySelector("#powerwash-retry"), qa: document.querySelector("#powerwash-qa-complete"),
      replay: document.querySelector("#powerwash-replay"), next: document.querySelector("#powerwash-next"), return: document.querySelector("#powerwash-return"),
    };
    this.onStart = () => this.startLevel(Number(this.levelSelect?.value || 1));
    this.onLevelChange = () => { if (this.buttons.start) this.buttons.start.textContent = `Start Level ${this.levelSelect.value}`; };
    this.onExit = () => this.requestExit();
    this.onRetry = () => this.restart();
    this.onQa = () => this.runCertifiedCompletion();
    this.onReplay = () => this.startLevel(this.lastResultContext?.level || 1);
    this.onNext = () => this.startLevel(this.powerwash.getCampaignSnapshot().nextLevel);
    this.onReturn = () => this.returnToTown(true);
    this.toolHandlers = {
      soap: () => this.selectTool("soap"),
      precision: () => this.selectTool("water", "precision"),
      standard: () => this.selectTool("water", "standard"),
      wide: () => this.selectTool("water", "wide"),
    };
    this.onPointerDown = (event) => { this.spraying = true; this.canvas?.setPointerCapture?.(event.pointerId); this.sprayPointer(event, true); };
    this.onPointerMove = (event) => { this.updatePointerCell(event); if (this.spraying) this.sprayPointer(event); else this.drawBoard(); };
    this.onPointerUp = () => { this.spraying = false; this.lastSprayCell = null; };
    this.onKeyDown = (event) => {
      if (event.key === "Escape") return this.requestExit();
      if (event.key === "1") this.selectTool("soap");
      if (event.key === "2") this.selectTool("water", "precision");
      if (event.key === "3") this.selectTool("water", "standard");
      if (event.key === "4") this.selectTool("water", "wide");
      if (event.key.toLowerCase() === "r") this.restart();
    };
    this.buttons.start?.addEventListener("click", this.onStart); this.levelSelect?.addEventListener("change", this.onLevelChange); this.buttons.exit?.addEventListener("click", this.onExit);
    for (const [key, handler] of Object.entries(this.toolHandlers)) this.buttons[key]?.addEventListener("click", handler);
    this.buttons.retry?.addEventListener("click", this.onRetry); this.buttons.qa?.addEventListener("click", this.onQa); this.buttons.replay?.addEventListener("click", this.onReplay); this.buttons.next?.addEventListener("click", this.onNext); this.buttons.return?.addEventListener("click", this.onReturn);
    this.canvas?.addEventListener("pointerdown", this.onPointerDown); this.canvas?.addEventListener("pointermove", this.onPointerMove); this.canvas?.addEventListener("pointerup", this.onPointerUp); this.canvas?.addEventListener("pointercancel", this.onPointerUp); this.canvas?.addEventListener("pointerleave", this.onPointerUp); window.addEventListener("keydown", this.onKeyDown);
    this.buttons.qa?.classList.toggle("hidden", !this.qaMode); this.hud?.classList.remove("hidden");
    const session = this.powerwash.getActiveSession(); show("#powerwash-picker", !session); show("#powerwash-gameplay", Boolean(session)); show("#powerwash-result", false);
    this.setMessage(session?.mode === "town-job" ? "Power wash at least 97% of the Commons Playground." : session ? "Hold or drag across the grime. Dark stains need soap before water." : "Choose any of the 750 original Playground Power Wash levels.", session ? "success" : "neutral");
  }

  setSceneInterface() {
    document.body.dataset.gameScene = this.scene.key;
    setText(".milestone-badge", "PLAYGROUND POWER WASH · MILESTONE 20");
    setText("#location-status", "Commons Playground");
    setText("#control-hint", "Hold or drag to spray · keys 1–4 change tools · landscape play");
    setText("#landscape-required-message", "Playground Power Wash is designed for landscape play. Turn your phone sideways to continue spraying.");
  }

  startLevel(level) {
    const previous = this.powerwash.getActiveSession();
    if (previous) this.powerwash.cancel(previous.id);
    const result = this.powerwash.beginCampaign(level, { returnPosition: previous?.returnPosition || this.entryData.returnPosition, returnFacing: previous?.returnFacing || this.entryData.returnFacing || "up" });
    if (!result.ok) { this.setMessage(result.message, "error"); return false; }
    this.lastResultContext = null; this.pointerCell = null;
    show("#powerwash-picker", false); show("#powerwash-gameplay", true); show("#powerwash-result", false);
    this.setMessage("Hold or drag to spray. Apply soap to dark green stains, then rinse them with water.", "success");
    this.render(); return true;
  }

  selectTool(tool, nozzle = "precision") {
    const session = this.powerwash.getActiveSession(); if (!session) return false;
    const result = this.powerwash.selectTool(session.id, tool, nozzle);
    if (!result.ok) { this.setMessage(result.message, "error"); return false; }
    this.setMessage(tool === "soap" ? "Soap selected. Cover dark green stains before rinsing." : `${POWERWASH_NOZZLES[nozzle].label} nozzle selected. Hold or drag to spray.`, "hint");
    this.render(); return true;
  }

  updatePointerCell(event) {
    if (!this.canvas) return null;
    const rect = this.canvas.getBoundingClientRect();
    this.pointerCell = {
      row: Math.max(0, Math.min(POWERWASH_GRID.rows - 1, Math.floor(((event.clientY - rect.top) / Math.max(1, rect.height)) * POWERWASH_GRID.rows))),
      col: Math.max(0, Math.min(POWERWASH_GRID.columns - 1, Math.floor(((event.clientX - rect.left) / Math.max(1, rect.width)) * POWERWASH_GRID.columns))),
    };
    return this.pointerCell;
  }

  sprayPointer(event, force = false) {
    const session = this.powerwash.getActiveSession(); const cell = this.updatePointerCell(event); if (!session || !cell || this.transitioning) return false;
    const now = performance.now(); const key = `${cell.row},${cell.col}`;
    if (!force && (now - this.lastSprayAt < 55 || key === this.lastSprayCell)) return false;
    this.lastSprayAt = now; this.lastSprayCell = key;
    const result = this.powerwash.spray(session.id, cell.row, cell.col);
    if (!result.ok) this.setMessage(result.message || "The washer is recovering.", "error");
    else if (result.result) this.showResult(result.result, session);
    else {
      if (result.code === "soap-first") this.setMessage("SOAP FIRST · dark green stains resist plain water.", "hint");
      this.render();
    }
    return result.ok;
  }

  restart() {
    const session = this.powerwash.getActiveSession(); if (!session) return false;
    const result = this.powerwash.restart(session.id); if (!result.ok) { this.setMessage(result.message, "error"); return false; }
    this.pointerCell = null; this.setMessage("This playground has been reset. Saved campaign progress is safe.", "success"); this.render(); return true;
  }

  runCertifiedCompletion() {
    if (!this.qaMode) return false;
    const session = this.powerwash.getActiveSession(); if (!session) return false;
    const result = this.powerwash.completeCertified(session.id); if (!result.ok) { this.setMessage(result.message, "error"); return false; }
    this.showResult(result.result, session); return true;
  }

  render() {
    const campaign = this.powerwash.getCampaignSnapshot(); const session = this.powerwash.getActiveSession();
    if (this.levelSelect && this.levelSelect.options.length !== POWERWASH_TOTAL_LEVELS) this.levelSelect.innerHTML = Array.from({ length: POWERWASH_TOTAL_LEVELS }, (_value, index) => { const summary = powerwashLevelSummary(index + 1); return `<option value="${index + 1}">Level ${index + 1} · ${summary.resistantStains} soap stains · +${calculatePowerwashCampaignReward(index + 1)} first clear</option>`; }).join("");
    if (this.levelSelect) { this.levelSelect.value = String(session?.assignedLevel || campaign.nextLevel); if (this.buttons.start) this.buttons.start.textContent = `Start Level ${this.levelSelect.value}`; }
    setText("#powerwash-summary", `${campaign.completed} playgrounds restored · ${campaign.totalStars} stars · Level ${campaign.nextLevel} next`);
    setText("#powerwash-balance", `🪙 ${this.gameState.getSnapshot().economy.coins}`);
    if (!session) { this.updateDomState(); return; }
    const state = this.powerwash.getSessionState(); const summary = powerwashLevelSummary(session.assignedLevel);
    setText("#powerwash-level-name", session.mode === "town-job" ? `Commons Playground job · Level ${session.assignedLevel}` : `Level ${session.assignedLevel} of ${POWERWASH_TOTAL_LEVELS}`);
    setText("#powerwash-level-band", `${summary.resistantStains} soap stains · ${summary.cleanStrength.toFixed(2)} rinse strength`);
    setText("#powerwash-clean", `${state.percent}%`); setText("#powerwash-water", `${Math.round(state.water)}%`); setText("#powerwash-soap", `${Math.round(state.soap)}%`); setText("#powerwash-reward", `+${state.projectedReward}`);
    const waterFill = document.querySelector("#powerwash-water-fill"); if (waterFill) waterFill.style.width = `${state.water}%`;
    const soapFill = document.querySelector("#powerwash-soap-fill"); if (soapFill) soapFill.style.width = `${state.soap}%`;
    for (const key of ["soap", "precision", "standard", "wide"]) this.buttons[key]?.classList.toggle("active", key === "soap" ? state.toolMode === "soap" : state.toolMode === "water" && state.nozzle === key);
    if (this.buttons.retry) this.buttons.retry.disabled = state.strokes === 0;
    this.drawBoard(); this.updateDomState();
  }

  drawBoard() {
    const state = this.powerwash.getSessionState(); if (!state || !this.context || !this.canvas) return;
    const context = this.context; const width = this.canvas.width; const height = this.canvas.height; const cellWidth = width / POWERWASH_GRID.columns; const cellHeight = height / POWERWASH_GRID.rows;
    context.imageSmoothingEnabled = false; context.clearRect(0, 0, width, height);
    context.fillStyle = "#789747"; context.fillRect(0, 0, width, height);
    context.fillStyle = "#b0a184"; context.fillRect(width * 0.43, 0, width * 0.14, height); context.fillRect(0, height * 0.42, width, height * 0.16);
    context.fillStyle = "#d7aa31"; context.fillRect(width * 0.18, height * 0.13, width * 0.13, height * 0.38); context.fillStyle = "#bd4231"; context.fillRect(width * 0.17, height * 0.1, width * 0.15, height * 0.1);
    context.strokeStyle = "#176fae"; context.lineWidth = 8; context.strokeRect(width * 0.68, height * 0.11, width * 0.18, height * 0.32); context.beginPath(); context.moveTo(width * 0.71, height * 0.12); context.lineTo(width * 0.71, height * 0.34); context.moveTo(width * 0.82, height * 0.12); context.lineTo(width * 0.82, height * 0.34); context.stroke();
    context.fillStyle = "#dca82a"; context.beginPath(); context.arc(width * 0.52, height * 0.68, height * 0.12, 0, Math.PI * 2); context.fill(); context.strokeStyle = "#26313a"; context.lineWidth = 5; context.stroke();
    context.fillStyle = "#8b572f"; context.fillRect(width * 0.08, height * 0.77, width * 0.18, height * 0.05); context.fillRect(width * 0.75, height * 0.72, width * 0.17, height * 0.05);
    const normal = new Map(state.normal); const resistant = new Set(state.resistant); const soaped = new Set(state.soaped);
    for (let row = 0; row < POWERWASH_GRID.rows; row += 1) for (let col = 0; col < POWERWASH_GRID.columns; col += 1) {
      const index = row * POWERWASH_GRID.columns + col; const x = col * cellWidth; const y = row * cellHeight;
      if (normal.has(index)) { const strength = normal.get(index); context.fillStyle = `rgba(92,61,31,${Math.min(0.76, 0.28 + strength * 0.26)})`; context.fillRect(x, y, Math.ceil(cellWidth) + 1, Math.ceil(cellHeight) + 1); }
      if (resistant.has(index)) { context.fillStyle = soaped.has(index) ? "rgba(205,250,220,.78)" : "rgba(35,70,42,.88)"; context.fillRect(x, y, Math.ceil(cellWidth) + 1, Math.ceil(cellHeight) + 1); if (soaped.has(index)) { context.fillStyle = "rgba(255,255,255,.8)"; context.fillRect(x + cellWidth * 0.2, y + cellHeight * 0.2, 3, 3); } }
    }
    if (this.pointerCell) {
      const engine = new PlaygroundPowerwashEngine(state.level, state); const cells = engine.affectedCells(this.pointerCell.row, this.pointerCell.col); context.fillStyle = state.toolMode === "soap" ? "rgba(174,246,210,.28)" : "rgba(104,218,250,.3)";
      for (const index of cells) { const row = Math.floor(index / POWERWASH_GRID.columns); const col = index % POWERWASH_GRID.columns; context.fillRect(col * cellWidth, row * cellHeight, Math.ceil(cellWidth) + 1, Math.ceil(cellHeight) + 1); }
    }
    this.canvas.setAttribute("aria-label", `Playground Power Wash Level ${state.level}, ${state.percent}% clean, ${state.resistantRemaining} soap-required samples remain`);
  }

  showResult(result, session) {
    this.spraying = false;
    this.lastResultContext = { level: result.level, mode: session.mode, returnPosition: session.returnPosition, returnFacing: session.returnFacing };
    show("#powerwash-gameplay", false); show("#powerwash-result", true);
    setText("#powerwash-result-title", session.mode === "town-job" ? "Commons Playground restored!" : "Playground restored!");
    setText("#powerwash-result-message", session.mode === "town-job" ? "The grime is gone and the playground will stay clean for two or three game days." : result.firstClear ? "The first clear is saved and its KindlyCoins were awarded once." : "Your best result remains saved. Campaign replays do not pay again.");
    setText("#powerwash-result-clean", "100%"); setText("#powerwash-result-tolerance", `${result.rawPercent}%`); setText("#powerwash-result-strokes", result.strokes); setText("#powerwash-result-coins", `+${result.rewardCoins}`);
    show("#powerwash-replay", session.mode !== "town-job"); show("#powerwash-next", session.mode !== "town-job");
    this.setMessage("Playground Power Wash result saved safely.", "success"); this.render();
  }

  setMessage(message, status = "neutral") { const element = document.querySelector("#powerwash-status"); if (element) { element.textContent = message || "Continue power washing."; element.dataset.status = status; } }
  updateDomState() { const game = document.querySelector("#game"); if (!game) return; const session = this.powerwash.getActiveSession(); const state = this.powerwash.getSessionState(); const diagnostics = this.powerwash.getDiagnostics(); game.dataset.scene = this.scene.key; game.dataset.powerwashLevel = String(session?.assignedLevel || diagnostics.nextLevel); game.dataset.powerwashMode = session?.mode || this.lastResultContext?.mode || "picker"; game.dataset.powerwashPhase = this.lastResultContext ? "result" : session?.status || "picker"; game.dataset.powerwashClean = String(state?.percent || 0); game.dataset.powerwashTool = state?.toolMode || "none"; game.dataset.powerwashNozzle = state?.nozzle || "none"; game.dataset.powerwashCompleted = String(diagnostics.completed); game.dataset.powerwashCatalogue = String(diagnostics.totalLevels); game.dataset.powerwashCatalogueValid = String(diagnostics.catalogueValid); }

  requestExit() { const session = this.powerwash.getActiveSession(); if (session && Date.now() > this.exitArmedUntil) { this.exitArmedUntil = Date.now() + 3000; if (this.buttons.exit) this.buttons.exit.textContent = "Confirm exit level"; this.setMessage("Press Confirm exit level within three seconds to abandon only this attempt.", "error"); return false; } return this.returnToTown(false); }
  returnToTown(complete) { if (this.transitioning) return false; this.transitioning = true; const active = this.powerwash.getActiveSession(); const context = active || this.lastResultContext || {}; if (active) this.powerwash.cancel(active.id); const position = context.returnPosition || this.entryData.returnPosition || { x: 1940, y: 1180 }; const facing = context.returnFacing || this.entryData.returnFacing || "up"; this.gameState.updatePlayer({ scene: "TownScene", x: position.x, y: position.y, facing }); document.querySelector("#game")?.setAttribute("data-transition", complete ? "powerwash-complete" : "leaving-powerwash"); this.cameras.main.fadeOut(220, 7, 20, 43); this.time.delayedCall(240, () => this.scene.start("TownScene", { returnPosition: position, returnFacing: facing, transitionCount: Number(this.entryData.transitionCount || 0) + 1 })); return true; }

  shutdownScene() {
    this.buttons.start?.removeEventListener("click", this.onStart); this.levelSelect?.removeEventListener("change", this.onLevelChange); this.buttons.exit?.removeEventListener("click", this.onExit);
    for (const [key, handler] of Object.entries(this.toolHandlers || {})) this.buttons[key]?.removeEventListener("click", handler);
    this.buttons.retry?.removeEventListener("click", this.onRetry); this.buttons.qa?.removeEventListener("click", this.onQa); this.buttons.replay?.removeEventListener("click", this.onReplay); this.buttons.next?.removeEventListener("click", this.onNext); this.buttons.return?.removeEventListener("click", this.onReturn);
    this.canvas?.removeEventListener("pointerdown", this.onPointerDown); this.canvas?.removeEventListener("pointermove", this.onPointerMove); this.canvas?.removeEventListener("pointerup", this.onPointerUp); this.canvas?.removeEventListener("pointercancel", this.onPointerUp); this.canvas?.removeEventListener("pointerleave", this.onPointerUp); window.removeEventListener("keydown", this.onKeyDown);
    this.hud?.classList.add("hidden"); this.worldSimulation?.setPaused("activity", false); this.npcTownLife?.setPaused("activity", false);
  }

  getMilestoneState() { return { scene: this.scene.key, gameplayConnected: true, landscapeRequired: true, pointerControls: true, keyboardToolControls: true, soapThenWaterRequired: true, completionTolerance: 97, ...this.powerwash.getDiagnostics(), session: this.powerwash.getActiveSession(), legacySaveUntouched: true }; }
}
