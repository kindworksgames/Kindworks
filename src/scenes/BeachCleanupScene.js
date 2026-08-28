import Phaser from "phaser";
import { BEACH_TILE, BeachCleanupEngine, generateBeachLevel } from "../data/beachCleanup.js";
import { cardinalDirection } from "../input/mobileGestures.js";
import { renderBeachRakeGrooves } from "../ui/BeachRakePattern.js";

const ROOM = Object.freeze({ width: 1280, height: 720 });
const KEYS = Object.freeze({ U: "up", D: "down", L: "left", R: "right" });
const ICONS = Object.freeze({ U: "🏖️", C: "🪑", T: "💧" });
const CHALLENGE_LABELS = Object.freeze({ noUndo: "No Undo", underMoves: "Light Foot", cleanSweep: "Clean Sweep" });

function setText(selector, value) { const element = document.querySelector(selector); if (element) element.textContent = String(value); }
function show(selector, visible) { document.querySelector(selector)?.classList.toggle("hidden", !visible); }

export class BeachCleanupScene extends Phaser.Scene {
  constructor() { super("BeachCleanupScene"); this.entryData = {}; }
  init(data = {}) { this.entryData = data; this.transitioning = false; this.exitArmedUntil = 0; this.lastResultContext = null; this.pointerStart = null; this.pointerDirection = null; this.pointerHoldTimer = null; this.pointerRunSequence = 0; this.hintDirection = null; }

  create() {
    this.beachCleanup = this.registry.get("beachCleanup");
    this.gameState = this.registry.get("gameState");
    this.worldSimulation = this.registry.get("worldSimulation");
    this.npcTownLife = this.registry.get("npcTownLife");
    this.qaMode = import.meta.env.DEV && new URLSearchParams(window.location.search).get("qa") === "beach";
    this.worldSimulation?.setPaused("activity", true); this.npcTownLife?.setPaused("activity", true);
    this.drawBackdrop(); this.bindInterface(); this.setSceneInterface();
    const active = this.beachCleanup.getActiveSession();
    if (active) this.render();
    else this.startLevel(this.entryData.level || this.beachCleanup.getCampaignSnapshot().nextLevel);
    this.cameras.main.fadeIn(220, 20, 49, 70);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.shutdownScene());
  }

  drawBackdrop() {
    this.add.rectangle(ROOM.width / 2, ROOM.height / 2, ROOM.width, ROOM.height, 0x103146);
    const art = this.add.graphics();
    art.fillStyle(0x3eb4ca, 1); art.fillRect(0, 0, ROOM.width, 230);
    art.fillStyle(0xb7edf0, 0.7); for (let x = -20; x < ROOM.width; x += 68) art.fillEllipse(x, 220, 76, 24);
    art.fillStyle(0xf0c96c, 1); art.fillRect(0, 235, ROOM.width, 485);
    art.lineStyle(3, 0xd6a947, 0.32); for (let y = 275; y < 720; y += 34) art.lineBetween(0, y, ROOM.width, y + 9);
    for (const [x, y, icon] of [[90, 105, "⛵"], [1140, 120, "🐚"], [109, 580, "🏖️"], [1172, 560, "🦀"]]) this.add.text(x, y, icon, { fontSize: "50px" }).setOrigin(0.5);
    this.add.text(640, 27, "BEACH CLEANUP · SOUTH SHORE RESTORATION", { color: "#fff6d6", fontFamily: "ui-monospace, monospace", fontSize: "18px", fontStyle: "bold", stroke: "#153d54", strokeThickness: 5 }).setOrigin(0.5).setDepth(4);
  }

  bindInterface() {
    this.hud = document.querySelector("#beach-cleanup-hud"); this.board = document.querySelector("#beach-board");
    this.buttons = { exit: document.querySelector("#beach-exit"), undo: document.querySelector("#beach-undo"), hint: document.querySelector("#beach-hint"), retry: document.querySelector("#beach-retry"), qa: document.querySelector("#beach-qa-complete"), return: document.querySelector("#beach-return") };
    this.onExit = () => this.requestExit(); this.onUndo = () => { const undone = this.runAction(() => this.beachCleanup.undo(this.beachCleanup.getActiveSession()?.id)); if (undone) { this.setMessage("Run undone.", "hint"); this.render(); } return undone; };
    this.onHint = () => this.showHint(); this.onRetry = () => this.restart(); this.onQa = () => this.runCertifiedCompletion();
    this.onReturn = () => this.returnToTown(true);
    this.challengeHandlers = {};
    for (const button of document.querySelectorAll("[data-beach-challenge]")) {
      const challenge = button.dataset.beachChallenge; const handler = () => this.toggleChallenge(challenge);
      this.challengeHandlers[challenge] = handler; button.addEventListener("click", handler);
    }
    this.onKeyDown = (event) => {
      if (event.key === "Escape") return this.requestExit();
      const key = event.key.toLowerCase();
      const direction = event.key === "ArrowUp" || key === "w" ? "U" : event.key === "ArrowDown" || key === "s" ? "D" : event.key === "ArrowLeft" || key === "a" ? "L" : event.key === "ArrowRight" || key === "d" ? "R" : null;
      if (direction) { event.preventDefault(); this.walk(direction); } else if (key === "z") { event.preventDefault(); this.onUndo(); } else if (key === "h") { event.preventDefault(); this.onHint(); } else if (key === "r") { event.preventDefault(); this.onRetry(); }
    };
    this.stopPointerHold = () => { this.pointerHoldTimer?.remove?.(false); this.pointerHoldTimer = null; };
    this.startPointerHold = (direction) => {
      this.stopPointerHold();
      if (!direction || this.beachCleanup.getSessionState()?.won) return;
      this.pointerHoldTimer = this.time.addEvent({ delay: 140, loop: true, callback: () => {
        if (!this.pointerStart || this.pointerDirection !== direction || !this.walk(direction, { batchId: this.pointerStart.runId }) || this.beachCleanup.getSessionState()?.won) this.stopPointerHold();
      } });
    };
    this.onPointerDown = (event) => {
      if (!this.beachCleanup.getActiveSession() || this.transitioning) return;
      event.preventDefault();
      this.board?.setPointerCapture?.(event.pointerId);
      this.stopPointerHold();
      this.pointerDirection = null;
      this.pointerRunSequence += 1;
      this.pointerStart = { x: event.clientX, y: event.clientY, id: event.pointerId, runId: `swipe-${this.pointerRunSequence}` };
    };
    this.onPointerMove = (event) => {
      if (!this.pointerStart || this.pointerStart.id !== event.pointerId) return;
      event.preventDefault();
      const direction = cardinalDirection(event.clientX - this.pointerStart.x, event.clientY - this.pointerStart.y, 18);
      if (!direction || direction === this.pointerDirection) return;
      this.pointerStart.x = event.clientX; this.pointerStart.y = event.clientY; this.pointerDirection = direction;
      if (this.walk(direction, { batchId: this.pointerStart.runId })) this.startPointerHold(direction); else this.stopPointerHold();
    };
    this.onPointerUp = (event) => {
      if (!this.pointerStart || this.pointerStart.id !== event.pointerId) return;
      event.preventDefault();
      const direction = this.pointerDirection || cardinalDirection(event.clientX - this.pointerStart.x, event.clientY - this.pointerStart.y, 18);
      const alreadyMoved = Boolean(this.pointerDirection); const runId = this.pointerStart.runId;
      this.stopPointerHold(); this.pointerStart = null; this.pointerDirection = null;
      if (!alreadyMoved && direction) this.walk(direction, { batchId: runId });
    };
    this.onPointerCancel = (event) => {
      if (!this.pointerStart || (event?.pointerId !== undefined && this.pointerStart.id !== event.pointerId)) return;
      this.stopPointerHold(); this.pointerStart = null; this.pointerDirection = null;
    };
    this.buttons.exit?.addEventListener("click", this.onExit);
    this.buttons.undo?.addEventListener("click", this.onUndo); this.buttons.hint?.addEventListener("click", this.onHint); this.buttons.retry?.addEventListener("click", this.onRetry); this.buttons.qa?.addEventListener("click", this.onQa); this.buttons.return?.addEventListener("click", this.onReturn);
    this.board?.addEventListener("pointerdown", this.onPointerDown); this.board?.addEventListener("pointermove", this.onPointerMove); this.board?.addEventListener("pointerup", this.onPointerUp);
    this.board?.addEventListener("pointercancel", this.onPointerCancel); this.board?.addEventListener("lostpointercapture", this.onPointerCancel); window.addEventListener("blur", this.onPointerCancel); window.addEventListener("keydown", this.onKeyDown);
    this.buttons.qa?.classList.toggle("hidden", !this.qaMode); this.hud?.classList.remove("hidden");
    if (this.buttons.exit) this.buttons.exit.textContent = "Exit";
    const session = this.beachCleanup.getActiveSession(); show("#beach-gameplay", Boolean(session)); show("#beach-result", false);
    this.setMessage(session?.mode === "town-job" ? "Rake the beach and find every item." : "Swipe across the sand to rake.", session ? "success" : "neutral");
  }

  setSceneInterface() {
    document.body.dataset.gameScene = this.scene.key; setText(".milestone-badge", "BEACH CLEANUP · MILESTONE 19"); setText("#location-status", "South Shore Beach");
    setText("#control-hint", "Swipe, arrows or WASD walk · Z undoes · H hints · landscape play");
    setText("#landscape-required-message", "Beach Cleanup is designed for landscape play. Turn your phone sideways to continue raking.");
  }

  startLevel(level) {
    const previous = this.beachCleanup.getActiveSession(); if (previous) this.beachCleanup.cancel(previous.id);
    const result = this.beachCleanup.beginCampaign(level, { returnPosition: previous?.returnPosition || this.entryData.returnPosition, returnFacing: previous?.returnFacing || this.entryData.returnFacing || "down" });
    if (!result.ok) { this.setMessage(result.message, "error"); return false; }
    this.lastResultContext = null; this.hintDirection = null; show("#beach-gameplay", true); show("#beach-result", false); this.setMessage("Rake every tile. Find every item.", "success"); this.render(); return true;
  }

  walk(direction, options = {}) {
    const session = this.beachCleanup.getActiveSession(); if (!session || this.transitioning) return false;
    const before = this.beachCleanup.getSessionState(); this.hintDirection = null;
    const moved = this.runAction(() => this.beachCleanup.move(session.id, direction, options));
    const after = this.beachCleanup.getSessionState();
    if (moved && after) {
      if (after.collectedRubbish > before.collectedRubbish) this.setMessage(`Item found! ${after.totalRubbish - after.collectedRubbish} left.`, "success");
      else this.setMessage(`${after.rakedCount} / ${after.totalSand} tiles raked.`, "neutral");
      this.render();
    }
    return moved;
  }
  runAction(action) { const context = this.beachCleanup.getActiveSession(); const result = action(); if (!result.ok) this.setMessage(result.message || "That beach action is unavailable.", "error"); if (result.result) this.showResult(result.result, context); else this.render(); return result.ok; }
  toggleChallenge(challenge) {
    const session = this.beachCleanup.getActiveSession(); if (!session) return false;
    const result = this.beachCleanup.toggleChallenge(session.id, challenge);
    if (!result.ok) { this.setMessage(result.message || "That challenge is unavailable.", "error"); return false; }
    const enabled = Boolean(this.beachCleanup.getSessionState()?.challenges?.[challenge]);
    this.setMessage(`${CHALLENGE_LABELS[challenge]} ${enabled ? "on" : "off"}.`, "hint"); this.render(); return true;
  }
  showHint() { if (!this.beachCleanup.getSessionState()) return false; return this.showEngineHint(); }
  showEngineHint() {
    const session = this.beachCleanup.getActiveSession(); if (!session) return false;
    const direction = new BeachCleanupEngine(session.assignedLevel, session).hint();
    if (!direction) { this.setMessage("Take any open step to rake this tile.", "hint"); return false; }
    this.hintDirection = direction; this.setMessage(`Go ${KEYS[direction]}.`, "hint"); this.render(); return true;
  }
  restart() { const session = this.beachCleanup.getActiveSession(); if (!session) return false; const result = this.beachCleanup.restart(session.id); if (!result.ok) { this.setMessage(result.message, "error"); return false; } this.hintDirection = null; this.setMessage("Beach restarted.", "success"); this.render(); return true; }
  runCertifiedCompletion() { if (!this.qaMode) return false; const session = this.beachCleanup.getActiveSession(); if (!session) return false; const result = this.beachCleanup.completeCertified(session.id); if (!result.ok) { this.setMessage(result.message, "error"); return false; } this.showResult(result.result, session); return true; }

  render() {
    const session = this.beachCleanup.getActiveSession();
    setText("#beach-balance", `🪙 ${this.gameState.getSnapshot().economy.coins}`);
    if (!session) { this.updateDomState(); return; }
    const state = this.beachCleanup.getSessionState(); const level = generateBeachLevel(session.assignedLevel);
    setText("#beach-raked", `${state.rakedCount} / ${state.totalSand}`); setText("#beach-found", `${state.collectedRubbish} / ${state.totalRubbish}`);
    const found = document.querySelector("#beach-found-items"); if (found) found.innerHTML = state.collectedItems.length ? state.collectedItems.map((item) => `<span title="${item.name}">${item.icon}<small>+${item.coins}</small></span>`).join("") : "<em>Hidden in the sand…</em>";
    if (this.board) {
      const raked = new Set(state.rakedCells); const collected = new Set(state.collectedCells); const cells = [];
      for (let row = 0; row < level.height; row += 1) for (let col = 0; col < level.width; col += 1) {
        const tile = level.rows[row][col]; const key = `${row},${col}`; const player = state.row === row && state.col === col;
        const classes = ["beach-cell", tile === BEACH_TILE.boardwalk || tile === BEACH_TILE.player ? "boardwalk" : tile === BEACH_TILE.sand || tile === BEACH_TILE.rubbish ? raked.has(key) ? "raked" : "sand" : tile === BEACH_TILE.tide ? "tide" : "obstacle", player ? "beach-player" : ""].filter(Boolean).join(" ");
        const grooves = raked.has(key) ? renderBeachRakeGrooves(state.rakePatterns[key] || "h") : "";
        const content = player ? '<span class="beach-player-icon" aria-hidden="true">🧑‍🌾</span>' : tile === BEACH_TILE.rubbish && !collected.has(key) ? "·" : ICONS[tile] || "";
        cells.push(`<span class="${classes}" role="gridcell" data-rake-pattern="${raked.has(key) ? state.rakePatterns[key] || "h" : ""}" aria-label="${player ? "Beach raker" : raked.has(key) ? "Raked sand" : tile === BEACH_TILE.rubbish ? "Sand with hidden rubbish" : "Beach tile"}">${grooves}${content}</span>`);
      }
      this.board.style.setProperty("--beach-columns", level.width); this.board.style.setProperty("--beach-rows", level.height); this.board.innerHTML = cells.join(""); this.board.setAttribute("aria-label", `Beach Cleanup Level ${session.assignedLevel}, ${state.rakedCount} of ${state.totalSand} sand tiles raked`);
    }
    this.buttons.undo.disabled = state.won || !session.undoStack.length; this.buttons.undo.classList.toggle("hidden", !session.undoStack.length); this.buttons.retry.disabled = state.moves === 0; this.buttons.retry.classList.toggle("hidden", state.moves === 0); this.buttons.hint.disabled = state.won; if (this.buttons.qa) this.buttons.qa.disabled = state.won;
    for (const button of document.querySelectorAll("[data-beach-challenge]")) button.classList.toggle("active", Boolean(state.challenges[button.dataset.beachChallenge]));
    this.updateDomState();
  }

  showResult(result, session) {
    this.lastResultContext = { level: result.level, mode: session.mode, returnPosition: session.returnPosition, returnFacing: session.returnFacing };
    show("#beach-gameplay", false); show("#beach-result", true); setText("#beach-result-title", session.mode === "town-job" ? "South Shore is sparkling!" : "Beach cleaned!"); setText("#beach-result-message", session.mode === "town-job" ? "The shoreline is clear again." : result.firstClear ? "The cleanup is saved." : "Your best cleanup is safe.");
    setText("#beach-result-coins", `+${result.rewardCoins}`);
    this.setMessage("Beach saved.", "success"); this.render();
  }
  setMessage(message, status = "neutral") { const element = document.querySelector("#beach-status"); if (element) { element.textContent = message || "Continue cleaning."; element.dataset.status = status; } }
  updateDomState() { const game = document.querySelector("#game"); if (!game) return; const session = this.beachCleanup.getActiveSession(); const state = this.beachCleanup.getSessionState(); const diagnostics = this.beachCleanup.getDiagnostics(); game.dataset.scene = this.scene.key; game.dataset.beachLevel = String(session?.assignedLevel || diagnostics.nextLevel); game.dataset.beachMode = session?.mode || this.lastResultContext?.mode || "loading"; game.dataset.beachPhase = this.lastResultContext ? "result" : session?.status || "loading"; game.dataset.beachRaked = String(state?.rakedCount || 0); game.dataset.beachRubbish = String(state?.collectedRubbish || 0); game.dataset.beachEarned = String(state?.earnedCoins || 0); game.dataset.beachCompleted = String(diagnostics.completed); game.dataset.beachCatalogue = String(diagnostics.totalLevels); game.dataset.beachCatalogueValid = String(diagnostics.catalogueValid); }

  requestExit() { const session = this.beachCleanup.getActiveSession(); if (session && Date.now() > this.exitArmedUntil) { this.exitArmedUntil = Date.now() + 3000; if (this.buttons.exit) this.buttons.exit.textContent = "Confirm Exit"; this.setMessage("Tap Confirm Exit to leave this attempt.", "error"); return false; } return this.returnToTown(false); }
  returnToTown(complete) { if (this.transitioning) return false; this.transitioning = true; const active = this.beachCleanup.getActiveSession(); const context = active || this.lastResultContext || {}; if (active) this.beachCleanup.cancel(active.id); const position = context.returnPosition || this.entryData.returnPosition || { x: 3220, y: 2320 }; const facing = context.returnFacing || this.entryData.returnFacing || "down"; this.gameState.updatePlayer({ scene: "TownScene", x: position.x, y: position.y, facing }); document.querySelector("#game")?.setAttribute("data-transition", complete ? "beach-cleanup-complete" : "leaving-beach-cleanup"); this.cameras.main.fadeOut(220, 20, 49, 70); this.time.delayedCall(240, () => this.scene.start("TownScene", { returnPosition: position, returnFacing: facing, transitionCount: Number(this.entryData.transitionCount || 0) + 1 })); return true; }
  shutdownScene() { this.stopPointerHold?.(); this.buttons.exit?.removeEventListener("click", this.onExit); for (const button of document.querySelectorAll("[data-beach-challenge]")) button.removeEventListener("click", this.challengeHandlers[button.dataset.beachChallenge]); this.buttons.undo?.removeEventListener("click", this.onUndo); this.buttons.hint?.removeEventListener("click", this.onHint); this.buttons.retry?.removeEventListener("click", this.onRetry); this.buttons.qa?.removeEventListener("click", this.onQa); this.buttons.return?.removeEventListener("click", this.onReturn); this.board?.removeEventListener("pointerdown", this.onPointerDown); this.board?.removeEventListener("pointermove", this.onPointerMove); this.board?.removeEventListener("pointerup", this.onPointerUp); this.board?.removeEventListener("pointercancel", this.onPointerCancel); this.board?.removeEventListener("lostpointercapture", this.onPointerCancel); window.removeEventListener("blur", this.onPointerCancel); window.removeEventListener("keydown", this.onKeyDown); this.pointerStart = null; this.pointerDirection = null; this.hud?.classList.add("hidden"); this.worldSimulation?.setPaused("activity", false); this.npcTownLife?.setPaused("activity", false); }
  getMilestoneState() { return { scene: this.scene.key, gameplayConnected: true, landscapeRequired: true, keyboardControls: true, touchSwipeControls: true, continuousHeldSwipe: true, ...this.beachCleanup.getDiagnostics(), session: this.beachCleanup.getActiveSession(), legacySaveUntouched: true }; }
}
