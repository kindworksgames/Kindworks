import Phaser from "phaser";
import {
  LAWN_WEED_TYPES,
  getLawnLevel,
  lawnTravelPlan,
  lawnCellKey,
} from "../data/lawnCare.js";

const ROOM = Object.freeze({ width: 1280, height: 720 });
const DIRECTION_KEYS = Object.freeze({ U: "up", D: "down", L: "left", R: "right" });

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.textContent = String(value);
}

function show(selector, visible) {
  document.querySelector(selector)?.classList.toggle("hidden", !visible);
}

export class LawnCareScene extends Phaser.Scene {
  constructor() {
    super("LawnCareScene");
    this.entryData = {};
  }

  init(data = {}) {
    this.entryData = data;
    this.transitioning = false;
    this.exitArmedUntil = 0;
    this.lastResultContext = null;
    this.pointerStart = null;
    this.mowerAnimating = false;
    this.queuedDirection = null;
  }

  create() {
    this.lawnCare = this.registry.get("lawnCare");
    this.onboarding = this.registry.get("onboarding");
    this.gameState = this.registry.get("gameState");
    this.worldSimulation = this.registry.get("worldSimulation");
    this.npcTownLife = this.registry.get("npcTownLife");
    this.qaMode = import.meta.env.DEV && new URLSearchParams(window.location.search).get("qa") === "lawn";
    this.worldSimulation?.setPaused("activity", true);
    this.npcTownLife?.setPaused("activity", true);
    this.drawGardenBackdrop();
    this.bindInterface();
    if (!this.lawnCare.getActiveSession()) this.startLevel(this.entryData.level || this.lawnCare.getCampaignSnapshot().nextLevel);
    this.setSceneInterface();
    this.render();
    this.cameras.main.fadeIn(220, 38, 75, 42);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.shutdownScene());
  }

  drawGardenBackdrop() {
    this.add.rectangle(ROOM.width / 2, ROOM.height / 2, ROOM.width, ROOM.height, 0x78a956);
    const art = this.add.graphics();
    art.fillStyle(0x355d39, 1);
    art.fillRoundedRect(22, 20, 1236, 680, 28);
    art.fillStyle(0x91bd61, 1);
    art.fillRoundedRect(52, 48, 1176, 624, 24);
    art.lineStyle(6, 0xa8d478, 0.5);
    for (let x = 80; x < 1230; x += 68) art.lineBetween(x, 72, x, 648);
    for (let y = 95; y < 650; y += 74) art.lineBetween(70, y, 1210, y);
    for (const [x, y, icon] of [[92, 108, "🌳"], [1190, 112, "🌳"], [105, 600, "🌼"], [1175, 600, "🌷"], [238, 95, "🐦"], [1030, 610, "🦋"]]) {
      this.add.text(x, y, icon, { fontSize: "48px" }).setOrigin(0.5).setDepth(2);
    }
  }

  bindInterface() {
    this.hud = document.querySelector("#lawn-care-hud");
    this.exitButton = document.querySelector("#lawn-care-exit");
    if (this.exitButton) {
      this.exitButton.textContent = "✕";
      this.exitButton.setAttribute("aria-label", "Exit Lawn Care safely");
      this.exitButton.classList.remove("confirming");
    }
    this.boardElement = document.querySelector("#lawn-board");
    this.buttons = {
      undo: document.querySelector("#lawn-undo"), hint: document.querySelector("#lawn-hint"),
      qa: document.querySelector("#lawn-qa-complete"),
      replay: document.querySelector("#lawn-replay"),
      return: document.querySelector("#lawn-return"),
    };
    this.onExit = () => this.requestExit();
    this.onUndo = () => this.runServiceAction(() => this.lawnCare.undo(this.lawnCare.getActiveSession()?.id));
    this.onHint = () => this.showHint();
    this.onQa = () => this.runCertifiedCompletion();
    this.onReplay = () => this.startLevel(this.lastResultContext?.level || 1);
    this.onReturn = () => this.returnToTown(true);
    this.onKeyDown = (event) => {
      if (event.key === "Escape") { this.requestExit(); return; }
      const key = event.key.toLowerCase();
      const direction = event.key === "ArrowUp" || key === "w" ? "U" : event.key === "ArrowDown" || key === "s" ? "D" : event.key === "ArrowLeft" || key === "a" ? "L" : event.key === "ArrowRight" || key === "d" ? "R" : null;
      if (direction) { event.preventDefault(); this.mow(direction); }
      else if (key === "z") { event.preventDefault(); this.onUndo(); }
      else if (key === "h") { event.preventDefault(); this.onHint(); }
      else if (key === "r") { event.preventDefault(); this.restart(); }
    };
    this.onPointerDown = (event) => { this.pointerStart = { x: event.clientX, y: event.clientY, id: event.pointerId }; };
    this.onPointerUp = (event) => {
      if (!this.pointerStart || this.pointerStart.id !== event.pointerId) return;
      const dx = event.clientX - this.pointerStart.x;
      const dy = event.clientY - this.pointerStart.y;
      this.pointerStart = null;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 28) return;
      this.mow(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "R" : "L") : (dy > 0 ? "D" : "U"));
    };

    this.exitButton?.addEventListener("click", this.onExit);
    this.buttons.undo?.addEventListener("click", this.onUndo);
    this.buttons.hint?.addEventListener("click", this.onHint);
    this.buttons.qa?.addEventListener("click", this.onQa);
    this.buttons.replay?.addEventListener("click", this.onReplay);
    this.buttons.return?.addEventListener("click", this.onReturn);
    this.boardElement?.addEventListener("pointerdown", this.onPointerDown);
    this.boardElement?.addEventListener("pointerup", this.onPointerUp);
    window.addEventListener("keydown", this.onKeyDown);
    this.buttons.qa?.classList.toggle("hidden", !this.qaMode);
    this.hud?.classList.remove("hidden");
    const session = this.lawnCare.getActiveSession();
    show("#lawn-care-gameplay", Boolean(session));
    show("#lawn-care-result", false);
    this.setMessage(session
      ? session.mode === "town-job"
        ? "Mow this lawn. Your result updates the town."
        : "Swipe to mow. Cut at least 50%."
      : "Swipe to mow.", session ? "success" : "neutral");
  }

  setSceneInterface() {
    document.body.dataset.gameScene = this.scene.key;
    const badge = document.querySelector(".milestone-badge");
    if (badge) badge.textContent = "LAWN CARE · MILESTONE 18";
    setText("#location-status", "Lawn Care");
    setText("#control-hint", "Swipe, arrows or WASD mow · Z undoes · H hints · landscape play");
    setText("#landscape-required-message", "Lawn Care is designed for landscape play. Turn your phone sideways to continue mowing.");
  }

  startLevel(levelValue) {
    const previous = this.lawnCare.getActiveSession();
    if (previous) this.lawnCare.cancel(previous.id);
    const result = this.lawnCare.beginCampaign(levelValue, {
      returnPosition: previous?.returnPosition || this.entryData.returnPosition,
      returnFacing: previous?.returnFacing || this.entryData.returnFacing || "down",
    });
    if (!result.ok) { this.setMessage(result.message, "error"); return false; }
    this.lastResultContext = null;
    show("#lawn-care-gameplay", true);
    show("#lawn-care-result", false);
    this.setMessage("Swipe to mow. Cut at least 50%.", "success");
    this.render();
    return true;
  }

  mow(direction) {
    const session = this.lawnCare.getActiveSession();
    if (!session || session.status === "failed" || this.transitioning) return false;
    if (this.mowerAnimating) { this.queuedDirection = direction; return true; }
    const before = this.lawnCare.getSessionState();
    const result = this.lawnCare.move(session.id, direction);
    if (!result.ok) { this.setMessage(result.message || "That mower move is not available.", "error"); return false; }
    this.animateMowerMove(before, result, session);
    return true;
  }

  async animateMowerMove(before, result, context) {
    this.mowerAnimating = true;
    this.boardElement?.classList.add("mower-moving");
    const level = getLawnLevel(context.assignedLevel);
    const cutCells = new Set(before.cutCells);
    const cutDirections = { ...(before.cutDirections || {}) };
    const plan = lawnTravelPlan(context.assignedLevel, result.crossed, result.direction, this.lawnCare.getMowerLoadout());
    for (const step of plan) {
      const [row, col] = step.cell.split(",").map(Number);
      cutCells.add(step.cell); cutDirections[step.cell] = step.direction;
      this.boardElement?.classList.toggle("mower-straining", step.strain);
      this.renderBoard({ ...before, row, col, facing: step.direction, cutCells: [...cutCells], cutDirections }, context.assignedLevel);
      await new Promise((resolve) => this.time.delayedCall(step.durationMs, resolve));
    }
    this.boardElement?.classList.remove("mower-moving", "mower-straining");
    this.mowerAnimating = false;
    if (result.result) this.showResult(result.result, context, Boolean(result.failed));
    else {
      if (result.endReason === "dead-end") this.setMessage("Dead end. Undo or restart this route.", "error");
      else if (result.endReason === "out-of-gas") this.setMessage("Out of moves. Restart to try another route.", "error");
      this.render();
    }
    const queued = this.queuedDirection; this.queuedDirection = null;
    if (queued && this.lawnCare.getActiveSession()?.status === "playing") this.mow(queued);
  }

  runServiceAction(action) {
    const context = this.lawnCare.getActiveSession();
    const result = action();
    if (!result.ok) this.setMessage(result.message || "That mower move is not available.", "error");
    if (result.result) this.showResult(result.result, context, Boolean(result.failed));
    else this.render();
    return result.ok;
  }

  showHint() {
    const session = this.lawnCare.getActiveSession();
    if (!session || session.status === "failed") return false;
    for (const button of Object.values(this.buttons)) button?.classList.remove("hinted");
    const result = this.lawnCare.hint(session.id);
    if (!result.ok) { this.setMessage(result.message, "error"); return false; }
    this.boardElement?.setAttribute("data-hint-direction", DIRECTION_KEYS[result.direction] || "");
    if (this.buttons.hint) {
      const arrows = { U: "↑", D: "↓", L: "←", R: "→" };
      this.buttons.hint.textContent = `${arrows[result.direction] || "💡"} Swipe`;
      this.buttons.hint.classList.add("hinted");
    }
    this.setMessage(result.message, "hint");
    return true;
  }

  restart() {
    const session = this.lawnCare.getActiveSession();
    if (!session) return false;
    const result = this.lawnCare.restart(session.id);
    if (!result.ok) { this.setMessage(result.message, "error"); return false; }
    show("#lawn-care-result", false);
    show("#lawn-care-gameplay", true);
    this.setMessage("Lawn reset. Progress is safe.", "success");
    this.render();
    return true;
  }

  runCertifiedCompletion() {
    if (!this.qaMode) return false;
    const session = this.lawnCare.getActiveSession();
    if (!session) return false;
    const result = this.lawnCare.completeCertified(session.id);
    if (!result.ok) { this.setMessage(result.message, "error"); return false; }
    this.showResult(result.result, session, false);
    return true;
  }

  renderBoard(sessionState, assignedLevel) {
    if (!this.boardElement || !sessionState) return;
    const level = getLawnLevel(assignedLevel);
    const cut = new Set(sessionState.cutCells);
    const cells = [];
    for (let row = 0; row < level.height; row += 1) {
      for (let col = 0; col < level.width; col += 1) {
        const key = lawnCellKey(row, col);
        if (level.rows[row][col] === "#") {
          cells.push('<span class="lawn-cell hedge" role="gridcell" aria-label="Hedge">▧</span>');
          continue;
        }
        const isMower = sessionState.row === row && sessionState.col === col;
        const weed = level.weeds.get(key);
        const cutDirection = sessionState.cutDirections?.[key];
        const classes = ["lawn-cell", cut.has(key) ? "cut" : "tall", cutDirection ? `cut-${["L", "R"].includes(cutDirection) ? "horizontal" : "vertical"}` : "", weed ? `weed-${weed}` : "", isMower ? `mower facing-${sessionState.facing.toLowerCase()}` : ""].filter(Boolean).join(" ");
        const icon = isMower || cut.has(key) ? "" : weed === LAWN_WEED_TYPES.woody ? "🪵" : weed === LAWN_WEED_TYPES.tough ? "🌿" : "";
        const label = isMower ? `Mower, ${cut.has(key) ? "cut grass" : "tall grass"}` : weed ? `${weed} weed, ${cut.has(key) ? "cut" : "uncut"}` : cut.has(key) ? "Cut grass" : "Tall grass";
        cells.push(`<span class="${classes}" role="gridcell" aria-label="${label}">${icon}</span>`);
      }
    }
    this.boardElement.style.setProperty("--lawn-columns", String(level.width));
    this.boardElement.style.setProperty("--lawn-rows", String(level.height));
    this.boardElement.innerHTML = cells.join("");
    this.boardElement.setAttribute("aria-label", `Lawn Care board, ${sessionState.percent}% cut, ${sessionState.movesLeft} moves left`);
  }

  render() {
    const session = this.lawnCare.getActiveSession();
    if (!session) { this.updateDomState(); return; }
    const state = this.lawnCare.getSessionState();
    if (this.buttons.hint) {
      this.buttons.hint.textContent = "💡 Hint";
      this.buttons.hint.classList.remove("hinted");
    }
    this.buttons.undo.disabled = state.ended || session.undoStack.length === 0;
    this.buttons.hint.disabled = state.ended;
    if (this.buttons.qa) this.buttons.qa.disabled = state.ended;
    this.renderBoard(state, session.assignedLevel);
    this.updateDomState();
  }

  showResult(result, session, failed) {
    this.lastResultContext = {
      level: result.level,
      mode: session?.mode || "campaign",
      returnPosition: session?.returnPosition,
      returnFacing: session?.returnFacing,
    };
    show("#lawn-care-gameplay", true);
    show("#lawn-care-result", true);
    const won = !failed && result.stars >= 1;
    if (won) this.onboarding?.recordJobCompleted?.("lawn");
    setText("#lawn-result-title", won ? "Lawn restored!" : "Keep mowing");
    setText("#lawn-result-stars", `${"★".repeat(result.stars)}${"☆".repeat(3 - result.stars)}`);
    setText("#lawn-result-message", won ? "The grass looks wonderful." : "Clear at least half, then try again.");
    setText("#lawn-result-coins", `+${result.rewardCoins || 0} coins`);
    show("#lawn-replay", !won);
    show("#lawn-return", won);
    if (this.buttons.return) this.buttons.return.textContent = "Continue";
    this.setMessage(won ? "Result saved." : "Restart to try again.", won ? "success" : "error");
    this.render();
  }

  setMessage(message, status = "neutral") {
    const element = document.querySelector("#lawn-care-status");
    if (element) { element.textContent = message || "Continue mowing."; element.dataset.status = status; }
  }

  updateDomState() {
    const game = document.querySelector("#game");
    if (!game) return;
    const session = this.lawnCare.getActiveSession();
    const engine = this.lawnCare.getSessionState();
    const diagnostics = this.lawnCare.getDiagnostics();
    game.dataset.scene = this.scene.key;
    game.dataset.lawnLevel = String(session?.assignedLevel || diagnostics.progress.nextLevel);
    game.dataset.lawnMode = session?.mode || this.lastResultContext?.mode || "picker";
    game.dataset.lawnPhase = this.lastResultContext ? "result" : session?.status || "picker";
    game.dataset.lawnPercent = String(engine?.percent || 0);
    game.dataset.lawnMoves = String(engine?.moves || 0);
    game.dataset.lawnCompleted = String(diagnostics.progress.completed);
    game.dataset.lawnCatalogue = String(diagnostics.totalLevels);
    game.dataset.lawnCatalogueValid = String(diagnostics.catalogueValid);
  }

  requestExit() {
    const session = this.lawnCare.getActiveSession();
    if (session && Date.now() > this.exitArmedUntil) {
      this.exitArmedUntil = Date.now() + 3000;
      if (this.exitButton) {
        this.exitButton.textContent = "!";
        this.exitButton.setAttribute("aria-label", "Confirm exit Lawn Care");
        this.exitButton.classList.add("confirming");
      }
      this.time.delayedCall(3000, () => {
        if (!this.exitButton || this.transitioning || Date.now() <= this.exitArmedUntil) return;
        this.exitButton.textContent = "✕";
        this.exitButton.setAttribute("aria-label", "Exit Lawn Care safely");
        this.exitButton.classList.remove("confirming");
      });
      this.setMessage("Tap the exit button again to leave this attempt.", "error");
      return false;
    }
    return this.returnToTown(false);
  }

  returnToTown(complete) {
    if (this.transitioning) return false;
    this.transitioning = true;
    const active = this.lawnCare.getActiveSession();
    const context = active || this.lastResultContext || {};
    if (active) this.lawnCare.cancel(active.id);
    const returnPosition = context.returnPosition || this.entryData.returnPosition || { x: 305, y: 530 };
    const returnFacing = context.returnFacing || this.entryData.returnFacing || "down";
    this.gameState?.updatePlayer({ scene: "TownScene", x: returnPosition.x, y: returnPosition.y, facing: returnFacing });
    document.querySelector("#game")?.setAttribute("data-transition", complete ? "lawn-care-complete" : "leaving-lawn-care");
    this.cameras.main.fadeOut(220, 38, 75, 42);
    this.time.delayedCall(240, () => this.scene.start("TownScene", { returnPosition, returnFacing, transitionCount: Number(this.entryData.transitionCount || 0) + 1 }));
    return true;
  }

  shutdownScene() {
    this.exitButton?.removeEventListener("click", this.onExit);
    this.buttons.undo?.removeEventListener("click", this.onUndo);
    this.buttons.hint?.removeEventListener("click", this.onHint);
    this.buttons.qa?.removeEventListener("click", this.onQa);
    this.buttons.replay?.removeEventListener("click", this.onReplay);
    this.buttons.return?.removeEventListener("click", this.onReturn);
    this.boardElement?.removeEventListener("pointerdown", this.onPointerDown);
    this.boardElement?.removeEventListener("pointerup", this.onPointerUp);
    window.removeEventListener("keydown", this.onKeyDown);
    if (this.exitButton) {
      this.exitButton.textContent = "✕";
      this.exitButton.setAttribute("aria-label", "Exit Lawn Care safely");
      this.exitButton.classList.remove("confirming");
    }
    this.hud?.classList.add("hidden");
    this.worldSimulation?.setPaused("activity", false);
    this.npcTownLife?.setPaused("activity", false);
  }

  getMilestoneState() {
    return {
      scene: this.scene.key,
      gameplayConnected: true,
      landscapeRequired: true,
      keyboardControls: true,
      touchSwipeControls: true,
      ...this.lawnCare.getDiagnostics(),
      session: this.lawnCare.getActiveSession(),
      legacySaveUntouched: true,
    };
  }
}
