import Phaser from "phaser";
import {
  LAWN_TOTAL_LEVELS,
  LAWN_WEED_TYPES,
  getLawnLevel,
  lawnCellKey,
  lawnLevelSummary,
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
  }

  create() {
    this.lawnCare = this.registry.get("lawnCare");
    this.gameState = this.registry.get("gameState");
    this.worldSimulation = this.registry.get("worldSimulation");
    this.npcTownLife = this.registry.get("npcTownLife");
    this.qaMode = import.meta.env.DEV && new URLSearchParams(window.location.search).get("qa") === "lawn";
    this.worldSimulation?.setPaused("activity", true);
    this.npcTownLife?.setPaused("activity", true);
    this.drawGardenBackdrop();
    this.bindInterface();
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
    this.add.text(640, 27, "LAWN CARE · WILLOWMERE GARDEN TEAM", {
      color: "#f4ffcf", fontFamily: "ui-monospace, monospace", fontSize: "18px", fontStyle: "bold", stroke: "#27472e", strokeThickness: 5,
    }).setOrigin(0.5).setDepth(4);
  }

  bindInterface() {
    this.hud = document.querySelector("#lawn-care-hud");
    this.levelSelect = document.querySelector("#lawn-level-select");
    this.startButton = document.querySelector("#lawn-level-start");
    this.exitButton = document.querySelector("#lawn-care-exit");
    this.boardElement = document.querySelector("#lawn-board");
    this.buttons = {
      U: document.querySelector("#lawn-up"), D: document.querySelector("#lawn-down"),
      L: document.querySelector("#lawn-left"), R: document.querySelector("#lawn-right"),
      undo: document.querySelector("#lawn-undo"), hint: document.querySelector("#lawn-hint"),
      retry: document.querySelector("#lawn-retry"), qa: document.querySelector("#lawn-qa-complete"),
      replay: document.querySelector("#lawn-replay"), next: document.querySelector("#lawn-next"),
      return: document.querySelector("#lawn-return"),
    };
    this.onStart = () => this.startLevel(Number(this.levelSelect?.value || 1));
    this.onLevelChange = () => { if (this.startButton) this.startButton.textContent = `Start Level ${Number(this.levelSelect?.value || 1)}`; };
    this.onExit = () => this.requestExit();
    this.onUndo = () => this.runServiceAction(() => this.lawnCare.undo(this.lawnCare.getActiveSession()?.id));
    this.onHint = () => this.showHint();
    this.onRetry = () => this.restart();
    this.onQa = () => this.runCertifiedCompletion();
    this.onReplay = () => this.startLevel(this.lastResultContext?.level || 1);
    this.onNext = () => this.startLevel(this.lawnCare.getCampaignSnapshot().nextLevel);
    this.onReturn = () => this.returnToTown(true);
    this.directionHandlers = Object.fromEntries(Object.keys(DIRECTION_KEYS).map((direction) => [direction, () => this.mow(direction)]));
    this.onKeyDown = (event) => {
      if (event.key === "Escape") { this.requestExit(); return; }
      const key = event.key.toLowerCase();
      const direction = event.key === "ArrowUp" || key === "w" ? "U" : event.key === "ArrowDown" || key === "s" ? "D" : event.key === "ArrowLeft" || key === "a" ? "L" : event.key === "ArrowRight" || key === "d" ? "R" : null;
      if (direction) { event.preventDefault(); this.mow(direction); }
      else if (key === "z") { event.preventDefault(); this.onUndo(); }
      else if (key === "h") { event.preventDefault(); this.onHint(); }
      else if (key === "r") { event.preventDefault(); this.onRetry(); }
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

    this.startButton?.addEventListener("click", this.onStart);
    this.levelSelect?.addEventListener("change", this.onLevelChange);
    this.exitButton?.addEventListener("click", this.onExit);
    for (const direction of Object.keys(DIRECTION_KEYS)) this.buttons[direction]?.addEventListener("click", this.directionHandlers[direction]);
    this.buttons.undo?.addEventListener("click", this.onUndo);
    this.buttons.hint?.addEventListener("click", this.onHint);
    this.buttons.retry?.addEventListener("click", this.onRetry);
    this.buttons.qa?.addEventListener("click", this.onQa);
    this.buttons.replay?.addEventListener("click", this.onReplay);
    this.buttons.next?.addEventListener("click", this.onNext);
    this.buttons.return?.addEventListener("click", this.onReturn);
    this.boardElement?.addEventListener("pointerdown", this.onPointerDown);
    this.boardElement?.addEventListener("pointerup", this.onPointerUp);
    window.addEventListener("keydown", this.onKeyDown);
    this.buttons.qa?.classList.toggle("hidden", !this.qaMode);
    this.hud?.classList.remove("hidden");
    const session = this.lawnCare.getActiveSession();
    show("#lawn-care-picker", !session);
    show("#lawn-care-gameplay", Boolean(session));
    show("#lawn-care-result", false);
    this.setMessage(session
      ? session.mode === "town-job"
        ? "Mow this lawn. Your result updates the town."
        : "Swipe to mow. Cut at least 50%."
      : "Choose a lawn to begin.", session ? "success" : "neutral");
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
    show("#lawn-care-picker", false);
    show("#lawn-care-gameplay", true);
    show("#lawn-care-result", false);
    this.setMessage("Swipe to mow. Cut at least 50%.", "success");
    this.render();
    return true;
  }

  mow(direction) {
    const session = this.lawnCare.getActiveSession();
    if (!session || session.status === "failed" || this.transitioning) return false;
    return this.runServiceAction(() => this.lawnCare.move(session.id, direction));
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
    this.buttons[result.direction]?.classList.add("hinted");
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
        const classes = ["lawn-cell", cut.has(key) ? "cut" : "tall", weed ? `weed-${weed}` : "", isMower ? `mower facing-${sessionState.facing.toLowerCase()}` : ""].filter(Boolean).join(" ");
        const icon = isMower || cut.has(key) ? "" : weed === LAWN_WEED_TYPES.woody ? "🪵" : weed === LAWN_WEED_TYPES.tough ? "🌿" : "";
        const label = isMower ? `Mower, ${cut.has(key) ? "cut grass" : "tall grass"}` : weed ? `${weed} weed, ${cut.has(key) ? "cut" : "uncut"}` : cut.has(key) ? "Cut grass" : "Tall grass";
        cells.push(`<span class="${classes}" role="gridcell" aria-label="${label}">${icon}</span>`);
      }
    }
    this.boardElement.style.setProperty("--lawn-columns", String(level.width));
    this.boardElement.style.setProperty("--lawn-rows", String(level.height));
    this.boardElement.innerHTML = cells.join("");
    this.boardElement.setAttribute("aria-label", `Lawn Care Level ${assignedLevel}, ${sessionState.percent}% cut, ${sessionState.movesLeft} moves left`);
  }

  render() {
    const campaign = this.lawnCare.getCampaignSnapshot();
    const session = this.lawnCare.getActiveSession();
    if (this.levelSelect) {
      const selected = Number(this.levelSelect.value || campaign.nextLevel);
      if (this.levelSelect.options.length !== LAWN_TOTAL_LEVELS) {
        const options = [];
        for (let level = 1; level <= LAWN_TOTAL_LEVELS; level += 1) {
          const summary = lawnLevelSummary(level);
          options.push(`<option value="${level}">Level ${level} · ${summary.optimalMoves} par${summary.woodyWeeds ? " · woody weeds" : summary.toughWeeds ? " · tough weeds" : ""}</option>`);
        }
        this.levelSelect.innerHTML = options.join("");
      }
      this.levelSelect.value = String(Math.max(1, Math.min(LAWN_TOTAL_LEVELS, selected)));
      if (this.startButton) this.startButton.textContent = `Start Level ${this.levelSelect.value}`;
    }
    setText("#lawn-care-summary", `${campaign.completed} lawns cleared · ${campaign.totalStars} stars · Level ${campaign.nextLevel} next`);
    setText("#lawn-care-balance", `🪙 ${this.gameState.getSnapshot().economy.coins}`);
    if (!session) { this.updateDomState(); return; }
    const state = this.lawnCare.getSessionState();
    const summary = lawnLevelSummary(session.assignedLevel);
    const mower = this.lawnCare.getMowerLoadout();
    setText("#lawn-level-name", `${session.mode === "town-job" ? "Town job" : `Level ${session.assignedLevel} of ${LAWN_TOTAL_LEVELS}`} · ${summary.name}`);
    setText("#lawn-level-band", summary.woodyWeeds ? `${summary.toughWeeds} tough · ${summary.woodyWeeds} woody weeds` : summary.toughWeeds ? `${summary.toughWeeds} tough weeds` : "Fresh starter grass");
    setText("#lawn-progress", `${state.percent}%`);
    setText("#lawn-moves", `${state.moves} / ${state.moveLimit}`);
    setText("#lawn-optimal", state.moves <= summary.optimalMoves ? summary.optimalMoves : `${summary.optimalMoves} par`);
    setText("#lawn-live-stars", `${"★".repeat(state.stars)}${"☆".repeat(3 - state.stars)}`);
    setText("#lawn-mower", mower.label);
    for (const direction of Object.keys(DIRECTION_KEYS)) this.buttons[direction].disabled = state.ended;
    this.buttons.undo.disabled = state.ended || session.undoStack.length === 0;
    this.buttons.hint.disabled = state.ended;
    this.buttons.retry.disabled = state.moves === 0 && session.status !== "failed";
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
    show("#lawn-care-gameplay", false);
    show("#lawn-care-result", true);
    const won = !failed && result.stars >= 1;
    setText("#lawn-result-title", won ? session?.mode === "town-job" ? "Neighbourhood lawn restored!" : "Lawn challenge complete!" : "This lawn needs another pass");
    setText("#lawn-result-stars", `${"★".repeat(result.stars)}${"☆".repeat(3 - result.stars)}`);
    setText("#lawn-result-message", won ? result.firstClear ? "Progress saved and the first-clear coins were added." : session?.mode === "town-job" ? "The lawn has been improved and your job coins were added." : "Your best result is saved. Replays do not award the first-clear coins again." : "Cut at least half of the grass before the move limit. Restart to try a new route.");
    setText("#lawn-result-percent", `${result.percent}%`);
    setText("#lawn-result-moves", result.moves);
    setText("#lawn-result-par", result.optimalMoves);
    setText("#lawn-result-coins", `+${result.rewardCoins || 0}`);
    show("#lawn-replay", session?.mode !== "town-job");
    show("#lawn-next", won && session?.mode !== "town-job");
    if (this.buttons.return) this.buttons.return.textContent = "Return to Willowmere";
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
      if (this.exitButton) this.exitButton.textContent = "Confirm exit level";
      this.setMessage("Tap Confirm exit to leave this attempt.", "error");
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
    this.startButton?.removeEventListener("click", this.onStart);
    this.levelSelect?.removeEventListener("change", this.onLevelChange);
    this.exitButton?.removeEventListener("click", this.onExit);
    for (const direction of Object.keys(DIRECTION_KEYS)) this.buttons[direction]?.removeEventListener("click", this.directionHandlers[direction]);
    this.buttons.undo?.removeEventListener("click", this.onUndo);
    this.buttons.hint?.removeEventListener("click", this.onHint);
    this.buttons.retry?.removeEventListener("click", this.onRetry);
    this.buttons.qa?.removeEventListener("click", this.onQa);
    this.buttons.replay?.removeEventListener("click", this.onReplay);
    this.buttons.next?.removeEventListener("click", this.onNext);
    this.buttons.return?.removeEventListener("click", this.onReturn);
    this.boardElement?.removeEventListener("pointerdown", this.onPointerDown);
    this.boardElement?.removeEventListener("pointerup", this.onPointerUp);
    window.removeEventListener("keydown", this.onKeyDown);
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
