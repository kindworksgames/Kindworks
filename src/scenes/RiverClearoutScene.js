import Phaser from "phaser";
import { getRiverRubbish } from "../data/riverClearout.js";
import { riverGestureAction } from "../input/mobileGestures.js";

const ROOM = Object.freeze({ width: 1280, height: 720 });

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.textContent = String(value);
}

export class RiverClearoutScene extends Phaser.Scene {
  constructor() { super("RiverClearoutScene"); this.entryData = {}; }

  init(data = {}) {
    this.entryData = data;
    this.transitioning = false;
    this.exitArmedUntil = 0;
    this.renderElapsed = 0;
    this.solving = false;
    this.pointerGesture = null;
  }

  create() {
    this.river = this.registry.get("river");
    this.onboarding = this.registry.get("onboarding");
    this.gameState = this.registry.get("gameState");
    this.worldSimulation = this.registry.get("worldSimulation");
    this.npcTownLife = this.registry.get("npcTownLife");
    this.qaMode = import.meta.env.DEV && new URLSearchParams(window.location.search).get("qa") === "river";
    this.worldSimulation?.setPaused("activity", true);
    this.npcTownLife?.setPaused("activity", true);
    this.drawRiverBackdrop();
    this.bindInterface();
    if (!this.river.getActiveSession()) this.startLevel(this.entryData.level || this.river.getSnapshot().nextLevel);
    this.setSceneInterface();
    this.render();
    this.cameras.main.fadeIn(220, 24, 55, 66);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.shutdownScene());
  }

  drawRiverBackdrop() {
    this.add.rectangle(ROOM.width / 2, ROOM.height / 2, ROOM.width, ROOM.height, 0x7fc16d);
    const art = this.add.graphics();
    art.fillStyle(0x4b8f57, 0.45); art.fillRoundedRect(20, 20, 350, 680, 70); art.fillRoundedRect(910, 20, 350, 680, 70);
    art.fillStyle(0x3f91af, 1); art.fillRoundedRect(355, -40, 570, 800, 150);
    art.fillStyle(0x66bed0, 1); art.fillRoundedRect(400, -40, 480, 800, 130);
    art.fillStyle(0x9bdbe1, 0.48);
    for (let y = 45; y < 720; y += 74) {
      art.fillRoundedRect(450 + (y % 148 ? 30 : 0), y, 280, 13, 7);
      art.fillRoundedRect(690, y + 30, 130, 9, 5);
    }
    for (const [x, y, icon] of [[140, 120, "🌳"], [1060, 140, "🌿"], [180, 520, "🌾"], [1110, 535, "🌳"], [1010, 345, "🦆"], [260, 320, "🪨"]]) {
      this.add.text(x, y, icon, { fontSize: "54px" }).setOrigin(0.5).setDepth(2);
    }
    this.add.text(640, 26, "RIVER CLEAR-OUT · WILLOWMERE RESTORATION TEAM", { color: "#e9ffff", fontFamily: "ui-monospace, monospace", fontSize: "17px", fontStyle: "bold", stroke: "#1f5266", strokeThickness: 5 }).setOrigin(0.5).setDepth(4);
  }

  bindInterface() {
    this.hud = document.querySelector("#river-hud");
    this.exitButton = document.querySelector("#river-exit");
    this.boardElement = document.querySelector("#river-board");
    this.buttons = {
      undo: document.querySelector("#river-undo"),
      hint: document.querySelector("#river-hint"), qa: document.querySelector("#river-qa-solve"),
      resultUndo: document.querySelector("#river-result-undo"),
      replay: document.querySelector("#river-replay"),
      return: document.querySelector("#river-return"),
    };
    document.querySelector("#river-gameplay")?.classList.add("hidden");
    document.querySelector("#river-result")?.classList.add("hidden");
    this.buttons.qa?.classList.toggle("hidden", !this.qaMode);
    if (this.exitButton) this.exitButton.textContent = "Exit";
    this.setMessage("Clear rows. Restore at least 50%.", "neutral");
    this.onExit = () => this.requestExit();
    this.onLeft = () => this.runAction(() => this.river.moveHorizontal(-1));
    this.onRight = () => this.runAction(() => this.river.moveHorizontal(1));
    this.onRotate = () => this.runAction(() => this.river.rotate());
    this.onDown = () => this.runAction(() => this.river.softDrop());
    this.onDrop = () => this.runAction(() => this.river.hardDrop());
    this.onUndo = () => this.runAction(() => this.river.undo());
    this.onResultUndo = () => {
      const result = this.river.undo();
      if (!result.ok) { this.setMessage(result.message || "That result cannot be reopened.", "error"); return false; }
      document.querySelector("#river-result")?.classList.add("hidden");
      document.querySelector("#river-gameplay")?.classList.remove("hidden");
      this.setMessage("Last placement undone. Keep restoring the river.", "success");
      this.render();
      return true;
    };
    this.onHint = () => this.showHint();
    this.onQa = () => this.runCertifiedDemo();
    this.onReplay = () => this.startLevel(this.river.getActiveSession()?.level.id || 1);
    this.onReturn = () => this.returnToTown(true);
    this.onKeyDown = (event) => {
      if (event.key === "Escape") { this.requestExit(); return; }
      if (!this.river.getActiveSession() || this.river.getActiveSession().finished || this.solving) return;
      const action = event.key === "ArrowLeft" ? this.onLeft : event.key === "ArrowRight" ? this.onRight : event.key === "ArrowDown" ? this.onDown : event.key === "ArrowUp" ? this.onRotate : event.code === "Space" ? this.onDrop : event.key.toLowerCase() === "z" ? this.onUndo : event.key.toLowerCase() === "h" ? this.onHint : null;
      if (action) { event.preventDefault(); action(); }
    };
    this.onBoardPointerDown = (event) => {
      const session = this.river.getActiveSession();
      if (!session || session.finished || this.solving) return;
      event.preventDefault();
      this.boardElement?.setPointerCapture?.(event.pointerId);
      this.pointerGesture = {
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        lastX: event.clientX,
        dragX: 0,
        startedAt: performance.now(),
        movedHorizontal: false,
      };
    };
    this.onBoardPointerMove = (event) => {
      const gesture = this.pointerGesture;
      if (!gesture || gesture.pointerId !== event.pointerId) return;
      event.preventDefault();
      const step = Math.max(18, (this.boardElement?.clientWidth || 0) / 13);
      gesture.dragX += event.clientX - gesture.lastX;
      gesture.lastX = event.clientX;
      while (Math.abs(gesture.dragX) >= step) {
        const moved = gesture.dragX < 0 ? this.onLeft() : this.onRight();
        gesture.movedHorizontal = true;
        gesture.dragX += gesture.dragX < 0 ? step : -step;
        if (!moved || this.river.getActiveSession()?.finished) break;
      }
    };
    this.onBoardPointerUp = (event) => {
      const gesture = this.pointerGesture;
      if (!gesture || gesture.pointerId !== event.pointerId) return;
      event.preventDefault();
      this.pointerGesture = null;
      const action = riverGestureAction({
        dx: event.clientX - gesture.x,
        dy: event.clientY - gesture.y,
        elapsed: performance.now() - gesture.startedAt,
        movedHorizontal: gesture.movedHorizontal,
      });
      ({ left: this.onLeft, right: this.onRight, down: this.onDown, rotate: this.onRotate, drop: this.onDrop })[action]?.();
    };
    this.onBoardPointerCancel = (event) => {
      if (!this.pointerGesture || (event?.pointerId !== undefined && this.pointerGesture.pointerId !== event.pointerId)) return;
      this.pointerGesture = null;
    };
    this.exitButton?.addEventListener("click", this.onExit);
    this.buttons.undo?.addEventListener("click", this.onUndo);
    this.buttons.hint?.addEventListener("click", this.onHint); this.buttons.qa?.addEventListener("click", this.onQa); this.buttons.replay?.addEventListener("click", this.onReplay);
    this.buttons.resultUndo?.addEventListener("click", this.onResultUndo);
    this.buttons.return?.addEventListener("click", this.onReturn);
    this.boardElement?.addEventListener("pointerdown", this.onBoardPointerDown); this.boardElement?.addEventListener("pointermove", this.onBoardPointerMove);
    this.boardElement?.addEventListener("pointerup", this.onBoardPointerUp); this.boardElement?.addEventListener("pointercancel", this.onBoardPointerCancel);
    this.boardElement?.addEventListener("lostpointercapture", this.onBoardPointerCancel); window.addEventListener("keydown", this.onKeyDown);
    this.hud?.classList.remove("hidden");
  }

  setSceneInterface() {
    document.body.dataset.gameScene = this.scene.key;
    const badge = document.querySelector(".milestone-badge"); if (badge) badge.textContent = "RIVER CLEAR-OUT";
    setText("#location-status", "River Clear-Out");
    setText("#control-hint", "Swipe left/right/down · tap or swipe up to rotate · long down drops · portrait play");
  }

  startLevel(level) {
    if (this.river.getActiveSession()) this.river.cancel();
    const result = this.river.startLevel(level, { returnPosition: this.entryData.returnPosition, returnFacing: this.entryData.returnFacing || "down", autoFall: !this.qaMode, environmentTargetId: this.entryData.environmentTargetId || null });
    if (!result.ok) { this.setMessage(result.message, "error"); return false; }
    document.querySelector("#river-gameplay")?.classList.remove("hidden");
    document.querySelector("#river-result")?.classList.add("hidden");
    this.setMessage("Clear rows. Recover at least 50%.", "success");
    this.render();
    return true;
  }

  runAction(action) {
    if (this.solving) return false;
    const result = action();
    if (!result.ok) this.setMessage(result.message || "That move is not available.", "error");
    if (result.result) this.showResult(result.result);
    else this.render();
    return result.ok;
  }

  showHint() {
    const result = this.river.hint();
    if (!result.ok) { this.setMessage("No placement hint is available for this piece.", "error"); return; }
    this.lastHint = result.hint;
    const side = result.hint.x < 3 ? "left side" : result.hint.x > 5 ? "right side" : "centre";
    const turns = result.hint.rotation === 0 ? "without rotating" : `after ${result.hint.rotation} clockwise turn${result.hint.rotation === 1 ? "" : "s"}`;
    const message = result.hint.tier === 1
      ? `Hint 1 · Try the ${side}. Three stars remain possible.`
      : result.hint.tier === 2
        ? `Hint 2 · Aim for column ${result.hint.x + 1}. Star cap: 2.`
        : `Hint 3 · Column ${result.hint.x + 1}, ${turns}. Star cap: 1.`;
    this.setMessage(message, "hint");
    this.render();
  }

  async runCertifiedDemo() {
    if (!this.qaMode || this.solving) return false;
    this.solving = true;
    this.setMessage("Running the original certified level solver…", "hint");
    this.render();
    const path = await this.river.certifiedPath({ threeStars: true, beamWidth: 250 });
    if (!path.ok) {
      this.solving = false;
      this.setMessage("The QA solver did not find a path within its bounded search.", "error");
      this.render();
      return false;
    }
    const result = this.river.playPath(path.path);
    this.solving = false;
    if (result.result) this.showResult(result.result);
    else this.render();
    return result.ok;
  }

  renderBoard(session) {
    if (!this.boardElement || !session) return;
    const overlays = new Map();
    if (session.current) {
      for (const [dx, dy] of session.current.shape) {
        overlays.set(`${session.current.x + dx},${session.ghostY + dy}`, { kind: "ghost", icon: session.current.icon });
        overlays.set(`${session.current.x + dx},${session.current.y + dy}`, { kind: "current", icon: session.current.icon });
      }
    }
    if (this.lastHint?.tier >= 3) for (const [dx, dy] of this.lastHint.shape) overlays.set(`${this.lastHint.x + dx},${this.lastHint.y + dy}`, { kind: "hint", icon: session.current?.icon || "" });
    const cells = [];
    for (let row = 0; row < session.level.height; row += 1) {
      for (let column = 0; column < session.level.width; column += 1) {
        const cell = session.board[row][column];
        const overlay = overlays.get(`${column},${row}`);
        let kind = "empty"; let icon = "";
        if (cell?.rock) { kind = "rock"; icon = "🪨"; }
        else if (cell?.original) { kind = cell.hp > 1 ? "heavy" : "rubbish"; icon = getRiverRubbish(cell.icon).icon; }
        else if (cell) { kind = "placed"; icon = getRiverRubbish(cell.icon).icon; }
        else if (overlay) { kind = overlay.kind; icon = getRiverRubbish(overlay.icon).icon; }
        cells.push(`<span class="river-cell ${kind}" aria-hidden="true">${icon}</span>`);
      }
    }
    this.boardElement.innerHTML = cells.join("");
    this.boardElement.setAttribute("aria-label", `River board, ${session.percent}% restored, ${session.remaining} original rubbish remaining`);
  }

  render() {
    const session = this.river.getActiveSession();
    setText("#river-balance", `🪙 ${this.gameState.getSnapshot().economy.coins}`);
    if (!session) { this.updateDomState(); return; }
    setText("#river-level-name", "CURRENT CLEANUP");
    setText("#river-band", session.level.mechanics.includes("heavy") ? "Clear rows and recover the heavy rubbish" : "Clear rows to restore the river");
    setText("#river-percent", `${session.percent}%`); setText("#river-pieces", `${session.piecesPlaced} / ${session.level.queue.length}`);
    const preview = document.querySelector("#river-preview");
    if (preview) preview.innerHTML = session.preview.map((piece) => `<span>${piece.type || "—"}<small>${piece.type ? getRiverRubbish(piece.icon).icon : ""}</small></span>`).join("");
    if (this.buttons.undo) this.buttons.undo.disabled = session.finished || session.undosRemaining === session.level.maxUndos;
    if (this.buttons.resultUndo) this.buttons.resultUndo.disabled = !session.finished || !session.canUndo;
    if (this.buttons.hint) this.buttons.hint.disabled = session.finished || this.solving;
    if (this.buttons.qa) this.buttons.qa.disabled = session.finished || this.solving;
    this.renderBoard(session);
    this.updateDomState();
  }

  showResult(result) {
    if (result.won) this.onboarding?.recordJobCompleted?.("river");
    document.querySelector("#river-gameplay")?.classList.add("hidden");
    document.querySelector("#river-result")?.classList.remove("hidden");
    setText("#river-result-title", result.won ? "River stretch restored!" : "River stretch needs another try");
    setText("#river-result-stars", `${"★".repeat(result.stars)}${"☆".repeat(3 - result.stars)}`);
    setText("#river-result-message", result.won ? "The water is flowing clearly again." : "Restore at least half, then try again.");
    setText("#river-result-coins", `+${result.coins} coins`);
    if (this.buttons.resultUndo) this.buttons.resultUndo.disabled = !this.river.getActiveSession()?.canUndo;
    this.buttons.resultUndo?.classList.toggle("hidden", result.won || !this.river.getActiveSession()?.canUndo);
    this.buttons.replay?.classList.toggle("hidden", result.won || Boolean(this.river.getActiveSession()?.canUndo));
    this.buttons.return?.classList.toggle("hidden", !result.won);
    this.setMessage(result.won ? "River saved." : "Try another placement.", result.won ? "success" : "error");
    this.render();
  }

  setMessage(message, status = "neutral") {
    const element = document.querySelector("#river-status");
    if (element) { element.textContent = message || "Continue restoring the river."; element.dataset.status = status; }
  }

  updateDomState() {
    if (!import.meta.env.DEV) return;
    const game = document.querySelector("#game"); if (!game) return;
    const session = this.river.getActiveSession(); const diagnostics = this.river.getDiagnostics();
    game.dataset.scene = this.scene.key; game.dataset.riverLevel = String(session?.level.id || diagnostics.nextLevel);
    game.dataset.riverPhase = session?.finished ? "result" : session ? "playing" : "picker"; game.dataset.riverPercent = String(session?.percent || 0);
    game.dataset.riverPieces = String(session?.piecesPlaced || 0); game.dataset.riverCompleted = String(diagnostics.completed); game.dataset.riverCatalogue = String(diagnostics.totalLevels);
  }

  update(_time, delta) {
    const session = this.river.getActiveSession();
    if (!session || session.finished || this.transitioning || this.solving) return;
    const result = this.river.tick(delta / 1000);
    if (result?.result) { this.showResult(result.result); return; }
    this.renderElapsed += delta;
    if (this.renderElapsed >= 80) { this.renderElapsed = 0; this.render(); }
  }

  requestExit() {
    const session = this.river.getActiveSession();
    if (session && !session.finished && Date.now() > this.exitArmedUntil) {
      this.exitArmedUntil = Date.now() + 3000;
      if (this.exitButton) this.exitButton.textContent = "Confirm Exit";
      this.setMessage("Tap Confirm exit to leave this attempt.", "error");
      return false;
    }
    return this.returnToTown(false);
  }

  returnToTown(complete) {
    if (this.transitioning) return false;
    this.transitioning = true;
    const session = this.river.getActiveSession(); if (session) this.river.cancel();
    const returnPosition = session?.returnPosition || this.entryData.returnPosition || { x: 2370, y: 1190 };
    const returnFacing = session?.returnFacing || this.entryData.returnFacing || "down";
    this.gameState?.updatePlayer({ scene: "TownScene", x: returnPosition.x, y: returnPosition.y, facing: returnFacing });
    document.querySelector("#game")?.setAttribute("data-transition", complete ? "river-complete" : "leaving-river");
    this.cameras.main.fadeOut(220, 24, 55, 66);
    this.time.delayedCall(240, () => this.scene.start("TownScene", { returnPosition, returnFacing, transitionCount: Number(this.entryData.transitionCount || 0) + 1 }));
    return true;
  }

  shutdownScene() {
    this.exitButton?.removeEventListener("click", this.onExit);
    this.buttons.undo?.removeEventListener("click", this.onUndo);
    this.buttons.hint?.removeEventListener("click", this.onHint); this.buttons.qa?.removeEventListener("click", this.onQa); this.buttons.replay?.removeEventListener("click", this.onReplay);
    this.buttons.resultUndo?.removeEventListener("click", this.onResultUndo);
    this.buttons.return?.removeEventListener("click", this.onReturn);
    this.boardElement?.removeEventListener("pointerdown", this.onBoardPointerDown); this.boardElement?.removeEventListener("pointermove", this.onBoardPointerMove);
    this.boardElement?.removeEventListener("pointerup", this.onBoardPointerUp); this.boardElement?.removeEventListener("pointercancel", this.onBoardPointerCancel);
    this.boardElement?.removeEventListener("lostpointercapture", this.onBoardPointerCancel); window.removeEventListener("keydown", this.onKeyDown);
    this.pointerGesture = null;
    this.hud?.classList.add("hidden"); this.river?.cancel?.(); this.worldSimulation?.setPaused("activity", false); this.npcTownLife?.setPaused("activity", false);
  }

  getMilestoneState() { return { scene: this.scene.key, gameplayConnected: true, portraitSupported: true, touchSwipeControls: true, tapToRotate: true, ...this.river.getDiagnostics(), session: this.river.getActiveSession(), legacySaveUntouched: true }; }
}
