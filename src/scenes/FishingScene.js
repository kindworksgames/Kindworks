import Phaser from "phaser";
import {
  FISHING_CONFIG,
  FISHING_SPOT_BY_ID,
  MAGNET_FISHING_CONFIG,
  MAGNET_FISHING_SPOT,
  TARGETING_CONFIG,
  fishingItem,
  pointInWater,
  pointInMagnetWater,
} from "../data/fishing.js";
import {
  VISUAL_ASSET_IDS,
  VISUAL_SCENE_INSTANCE_IDS,
} from "../visual/visualManifest.js";
import {
  FISHING_LAYOUT_INSTANCE_IDS,
  FISHING_LAYOUT_SOCKET_IDS,
  FISHING_LAYOUT_ZONE_IDS,
  FISHING_SCENE_LAYOUT,
  fishingDefaultTargetSocketId,
  fishingWaterZoneId,
} from "../visual/layouts/fishingSceneLayout.js";
import {
  getSceneLayoutInstance,
  getSceneLayoutSocket,
  getSceneLayoutZone,
} from "../visual/layouts/sceneLayoutContracts.js";

const FISHING_REFERENCE_LEGACY_KEY = "legacy-fishing";

function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, value)); }
function lerp(from, to, progress) { return from + (to - from) * progress; }
function ease(progress) {
  const safe = clamp(progress, 0, 1);
  return safe * safe * (3 - 2 * safe);
}

export class FishingScene extends Phaser.Scene {
  constructor() {
    super("FishingScene");
  }

  preload() {
    this.visualRegistry = this.registry.get("visualRegistry");
    this.visualRegistry?.queueScenePacks(this, this.scene.key);
    this.fishingReferenceKey = this.visualRegistry?.getTextureKey(VISUAL_ASSET_IDS.FISHING_REEDBANK_BACKGROUND)
      || FISHING_REFERENCE_LEGACY_KEY;
  }

  create() {
    this.fishing = this.registry.get("fishing");
    this.worldSimulation = this.registry.get("worldSimulation");
    this.npcTownLife = this.registry.get("npcTownLife");
    this.session = this.fishing?.getActiveSession?.();
    if (!this.session) {
      this.scene.start("TownScene");
      return;
    }
    this.mode = this.session.mode;
    this.spot = this.mode === "magnet" ? MAGNET_FISHING_SPOT : FISHING_SPOT_BY_ID[this.session.spotId];
    this.phase = "idle";
    this.transitioning = false;
    this.confirmingExit = false;
    this.biteStartedAt = 0;
    this.pendingTimers = [];
    this.sceneLayout = this.sceneLayouts?.layout || FISHING_SCENE_LAYOUT;
    this.qaMode = import.meta.env.DEV ? new URLSearchParams(window.location.search).get("qa") : null;
    this.timingScale = this.qaMode === "fishing" || this.qaMode === "magnet" ? 0.28 : 1;
    const firstZone = this.session.hiddenZones[0];
    const defaultTarget = this.layoutSocket(fishingDefaultTargetSocketId(this.mode)).position;
    this.target = this.qaMode && firstZone
      ? { x: firstZone.x, y: firstZone.y }
      : { ...defaultTarget };

    this.worldSimulation?.setPaused("activity", true);
    this.npcTownLife?.setPaused("activity", true);
    this.drawScene();
    this.bindInterface();
    this.setSceneInterface();
    this.refreshInterface(this.mode === "magnet" ? "Tap water to place the magnet." : "Tap water to cast.");
    this.installReferenceOverlay();
    this.cameras.main.fadeIn(220, 12, 35, 42);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.shutdownScene());
  }

  drawScene() {
    const magnet = this.mode === "magnet";
    const reedbank = this.spot.id === "fishing-reedbank";
    const harbour = this.spot.id === "fishing-harbour";
    const room = this.sceneLayout.canonicalSize;
    const waterArea = this.layoutZone(fishingWaterZoneId(this.mode)).geometry;
    const backgroundLayout = this.layoutInstance(FISHING_LAYOUT_INSTANCE_IDS.BACKGROUND);
    this.add.rectangle(room.width / 2, room.height / 2, room.width, room.height, magnet ? 0x173e48 : 0x4f8450);
    const fishingReferenceKey = this.fishingReferenceKey
      || this.visualRegistry?.resolveLegacyTextureKey(FISHING_REFERENCE_LEGACY_KEY)
      || FISHING_REFERENCE_LEGACY_KEY;
    const recoveredReference = !magnet && reedbank && this.textures.exists(fishingReferenceKey);
    if (recoveredReference) {
      const background = this.add.image(backgroundLayout.visual.position.x, backgroundLayout.visual.position.y, fishingReferenceKey)
        .setOrigin(backgroundLayout.visual.origin.x, backgroundLayout.visual.origin.y)
        .setDisplaySize(backgroundLayout.visual.bounds.width, backgroundLayout.visual.bounds.height)
        .setDepth(backgroundLayout.visual.depth)
        .setData("spriteAiLabel", "legacy-reference.fishing.environment");
      this.visualRegistry?.tagSceneInstance(background, VISUAL_SCENE_INSTANCE_IDS.FISHING_REEDBANK_BACKGROUND);
      this.registerLayoutVisual(FISHING_LAYOUT_INSTANCE_IDS.BACKGROUND, background);
    }
    const art = this.registerLayoutVisual(FISHING_LAYOUT_INSTANCE_IDS.ENVIRONMENT, this.add.graphics())
      .setData("spriteAiLabel", magnet ? "minigame.magnet-fishing.live-environment" : `minigame.fishing.${this.spot.id}.live-environment`);
    if (!recoveredReference) {
      art.fillStyle(magnet ? 0x233c3f : harbour ? 0xc5a96f : 0x72a957, 1);
      art.fillRect(0, 0, room.width, this.sceneLayout.presentation.topBandHeight);
      art.fillStyle(magnet ? 0x237e91 : harbour ? 0x1687a5 : reedbank ? 0x1687a5 : 0x3a98ad, 1);
      art.fillRoundedRect(waterArea.x, waterArea.y, waterArea.width, waterArea.height, 26);
      art.lineStyle(7, 0x172638, 0.95);
      art.strokeRoundedRect(waterArea.x, waterArea.y, waterArea.width, waterArea.height, 26);
      art.lineStyle(3, 0x8ed9dc, 0.38);
      const wave = this.sceneLayout.presentation.wave;
      for (let row = 0; row < this.sceneLayout.presentation.waveRows; row += 1) {
        art.lineBetween(wave.startX + (row % 2) * wave.alternateOffsetX, wave.startY + row * wave.rowGap, wave.endX - (row % 3) * wave.thirdOffsetX, wave.startY + row * wave.rowGap);
      }
      if (magnet) this.drawBridge(art);
      else this.drawFishingBank(art, reedbank, harbour);
      const titleLayout = this.layoutInstance(FISHING_LAYOUT_INSTANCE_IDS.TITLE);
      const title = this.add.text(titleLayout.visual.position.x, titleLayout.visual.position.y, `${this.spot.icon} ${this.spot.shortTitle.toUpperCase()}`, {
        color: "#fff1c8", fontFamily: "ui-monospace, monospace", fontSize: "25px", fontStyle: "bold",
        backgroundColor: "#172638", padding: { x: 13, y: 8 },
      }).setOrigin(titleLayout.visual.origin.x, titleLayout.visual.origin.y).setDepth(titleLayout.visual.depth);
      this.registerLayoutVisual(FISHING_LAYOUT_INSTANCE_IDS.TITLE, title);
      const labelLayout = this.layoutInstance(FISHING_LAYOUT_INSTANCE_IDS.WATER_BODY);
      const label = this.add.text(labelLayout.visual.position.x, labelLayout.visual.position.y, this.spot.waterBody, { color: "#fff6d8", fontFamily: "system-ui", fontSize: "15px", fontStyle: "bold" })
        .setOrigin(labelLayout.visual.origin.x, labelLayout.visual.origin.y).setDepth(labelLayout.visual.depth);
      this.registerLayoutVisual(FISHING_LAYOUT_INSTANCE_IDS.WATER_BODY, label);
    }

    const aimLayout = this.layoutInstance(FISHING_LAYOUT_INSTANCE_IDS.AIM);
    this.aim = this.registerLayoutVisual(FISHING_LAYOUT_INSTANCE_IDS.AIM, this.add.circle(this.target.x, this.target.y, 24, 0xfff0a0, 0.18), { slotId: "outer", captureLocalOffset: true }).setStrokeStyle(4, 0xfff0a0, 0.92).setDepth(aimLayout.visual.depth);
    this.aimInner = this.registerLayoutVisual(FISHING_LAYOUT_INSTANCE_IDS.AIM, this.add.circle(this.target.x, this.target.y, 5, 0xfff0a0, 1), { slotId: "inner", captureLocalOffset: true, localDepthOffset: 1 }).setDepth(aimLayout.visual.depth + 1);
    const rigLayout = this.layoutInstance(FISHING_LAYOUT_INSTANCE_IDS.LIVE_RIG);
    this.line = this.registerLayoutVisual(FISHING_LAYOUT_INSTANCE_IDS.LIVE_RIG, this.add.graphics(), { slotId: "line", captureLocalOffset: true }).setDepth(rigLayout.visual.depth).setData("spriteAiLabel", magnet ? "minigame.magnet-fishing.live-rope" : "minigame.fishing.live-line");
    this.rod = this.registerLayoutVisual(FISHING_LAYOUT_INSTANCE_IDS.LIVE_RIG, this.add.graphics(), { slotId: "rod", captureLocalOffset: true, localDepthOffset: -1 }).setDepth(rigLayout.visual.depth - 1).setData("spriteAiLabel", "minigame.fishing.live-rod-reel");
    const bobberLayout = this.layoutInstance(FISHING_LAYOUT_INSTANCE_IDS.BOBBER);
    this.floatMarker = this.registerLayoutVisual(FISHING_LAYOUT_INSTANCE_IDS.BOBBER, this.add.container(this.target.x, this.target.y), { captureLocalOffset: true }).setVisible(false).setDepth(bobberLayout.visual.depth);
    const floatArt = this.add.graphics();
    floatArt.lineStyle(3, 0x172638, 1); floatArt.fillStyle(0xfff7dc, 1); floatArt.fillCircle(0, 0, 9); floatArt.strokeCircle(0, 0, 9);
    floatArt.fillStyle(0xe7564d, 1); floatArt.fillRect(-8, -8, 16, 8); floatArt.lineStyle(3, 0x172638, 1); floatArt.lineBetween(0, -19, 0, -8);
    this.floatMarker.add(floatArt);
    const resultLayout = this.layoutInstance(FISHING_LAYOUT_INSTANCE_IDS.RESULT);
    this.resultIcon = this.registerLayoutVisual(FISHING_LAYOUT_INSTANCE_IDS.RESULT, this.add.text(this.target.x, this.target.y + this.sceneLayout.presentation.resultOffsetY, magnet ? "🧲" : "🎣", { fontSize: "45px" }), { captureLocalOffset: true })
      .setOrigin(resultLayout.visual.origin.x, resultLayout.visual.origin.y).setVisible(magnet).setDepth(resultLayout.visual.depth)
      .setData("spriteAiLabel", magnet ? "minigame.magnet-fishing.live-magnet-and-find" : "minigame.fishing.live-catch");
    this.phaseStartedAt = performance.now();
    this.drawActiveRig(this.phaseStartedAt);
    this.input.on("pointerdown", (pointer) => this.handlePrimaryAction(pointer));
  }

  drawFishingBank(art, reedbank, harbour) {
    const shore = this.layoutZone(FISHING_LAYOUT_ZONE_IDS.SHORE).geometry;
    const dock = this.layoutZone(FISHING_LAYOUT_ZONE_IDS.DOCK).geometry;
    const dockBoards = this.sceneLayout.presentation.dock;
    art.fillStyle(harbour ? 0xd0b072 : 0x6fa050, 1);
    art.fillRect(shore.x, shore.y, shore.width, shore.height);
    art.fillStyle(0x6d432c, 1);
    art.fillRect(dock.x, dock.y, dock.width, dock.height);
    art.fillStyle(0xb97b43, 1);
    for (let y = dockBoards.boardStartY; y < dockBoards.endY; y += dockBoards.boardGapY) art.fillRect(dockBoards.boardStartX, y, dockBoards.boardWidth, dockBoards.boardHeight);
    if (reedbank) {
      for (const { x, y } of this.sceneLayout.presentation.reeds) {
        art.fillStyle(0x4d8939, 1); art.fillEllipse(x, y, 64, 28); art.fillStyle(0xf2a5b8, 1); art.fillCircle(x + 8, y - 5, 7);
      }
    }
    const playerLayout = this.layoutInstance(FISHING_LAYOUT_INSTANCE_IDS.FISH_PLAYER);
    const player = this.add.text(playerLayout.visual.position.x, playerLayout.visual.position.y, "🧍", { fontSize: "70px" })
      .setOrigin(playerLayout.visual.origin.x, playerLayout.visual.origin.y).setDepth(playerLayout.visual.depth);
    this.registerLayoutVisual(FISHING_LAYOUT_INSTANCE_IDS.FISH_PLAYER, player);
    const toolLayout = this.layoutInstance(FISHING_LAYOUT_INSTANCE_IDS.FISH_TOOL);
    const tool = this.add.text(toolLayout.visual.position.x, toolLayout.visual.position.y, "🎣", { fontSize: "60px" })
      .setOrigin(toolLayout.visual.origin.x, toolLayout.visual.origin.y).setRotation(toolLayout.visual.rotation).setDepth(toolLayout.visual.depth);
    this.registerLayoutVisual(FISHING_LAYOUT_INSTANCE_IDS.FISH_TOOL, tool);
  }

  drawBridge(art) {
    const room = this.sceneLayout.canonicalSize;
    const bridge = this.layoutZone(FISHING_LAYOUT_ZONE_IDS.BRIDGE).geometry;
    const bridgeBoards = this.sceneLayout.presentation.bridge;
    art.fillStyle(0x523b31, 1);
    art.fillRect(bridge.x, bridge.y, bridge.width, bridge.height);
    art.fillStyle(0xb77b42, 1);
    for (let x = 0; x < room.width; x += bridgeBoards.boardGapX) art.fillRect(x + bridgeBoards.boardStartX, bridgeBoards.boardStartY, bridgeBoards.boardWidth, bridgeBoards.boardHeight);
    art.fillStyle(0x172638, 1);
    art.fillRect(0, bridgeBoards.railY, room.width, bridgeBoards.railHeight);
    const playerLayout = this.layoutInstance(FISHING_LAYOUT_INSTANCE_IDS.MAGNET_PLAYER);
    const player = this.add.text(playerLayout.visual.position.x, playerLayout.visual.position.y, "🧍", { fontSize: "70px" })
      .setOrigin(playerLayout.visual.origin.x, playerLayout.visual.origin.y).setDepth(playerLayout.visual.depth);
    this.registerLayoutVisual(FISHING_LAYOUT_INSTANCE_IDS.MAGNET_PLAYER, player);
    const toolLayout = this.layoutInstance(FISHING_LAYOUT_INSTANCE_IDS.MAGNET_TOOL);
    const tool = this.add.text(toolLayout.visual.position.x, toolLayout.visual.position.y, "🪢", { fontSize: "37px" })
      .setOrigin(toolLayout.visual.origin.x, toolLayout.visual.origin.y).setDepth(toolLayout.visual.depth);
    this.registerLayoutVisual(FISHING_LAYOUT_INSTANCE_IDS.MAGNET_TOOL, tool);
  }

  layoutInstance(id) { return getSceneLayoutInstance(this.sceneLayout, id); }
  layoutZone(id) { return getSceneLayoutZone(this.sceneLayout, id); }
  layoutSocket(id) { return getSceneLayoutSocket(this.sceneLayout, id); }

  registerLayoutVisual(instanceId, displayObject, options) {
    return this.sceneLayouts?.register(instanceId, displayObject, options) || displayObject;
  }

  applyLayoutVisualPosition(instanceId, position) {
    return this.sceneLayouts?.applyVisualPosition(instanceId, position) || false;
  }

  installReferenceOverlay() {
    if (!import.meta.env.DEV || this.qaMode !== "reference-overlay") return;
    import("../visual/dev/ReferenceOverlayController.js").then(({ ReferenceOverlayController }) => {
      if (!this.scene.isActive() || this.transitioning) return;
      this.referenceOverlay = new ReferenceOverlayController(this, {
        layout: this.sceneLayout,
        referenceTextureKey: this.fishingReferenceKey,
        referenceContractId: "reference.fishing.reedbank",
      });
    }).catch((failure) => console.error("Reference overlay could not start.", failure));
  }

  setTarget(x, y) {
    const inWater = this.mode === "magnet" ? pointInMagnetWater({ x, y }) : pointInWater({ x, y });
    if (!inWater || !["idle", "success", "miss"].includes(this.phase)) return false;
    this.target = { x, y };
    this.aim.setPosition(x, y);
    this.aimInner.setPosition(x, y);
    return true;
  }

  handlePrimaryAction(pointer = null) {
    if (this.referenceOverlay?.capturesGameplayPointer?.(pointer)) return false;
    if (this.transitioning) return false;
    if (["bite", "ready"].includes(this.phase)) return this.reel();
    if (this.phase === "waiting" && this.mode === "fish") return this.reelEarly();
    if (["casting", "reeling"].includes(this.phase)) {
      this.refreshInterface("Wait for the cast to finish.", "error");
      return false;
    }
    const inWater = pointer && (this.mode === "magnet" ? pointInMagnetWater(pointer) : pointInWater(pointer));
    if (!inWater) {
      this.refreshInterface(this.mode === "magnet" ? "Tap inside the river." : "Tap inside the water.", "error");
      return false;
    }
    this.setTarget(pointer.x, pointer.y);
    return this.cast();
  }

  cast() {
    if (!this.session || !["idle", "success", "miss"].includes(this.phase)) return false;
    this.clearExitConfirmation();
    const result = this.fishing.cast(this.target);
    if (!result.ok) {
      this.refreshInterface(result.message || "That cast is not available.", "error");
      return false;
    }
    this.phase = "casting";
    this.phaseStartedAt = performance.now();
    this.castStartedAt = this.phaseStartedAt;
    this.resultIcon.setText(this.mode === "magnet" ? "🧲" : "").setVisible(this.mode === "magnet").setAlpha(1).setScale(1);
    this.floatMarker.setVisible(this.mode === "fish");
    this.aim.setVisible(false);
    this.aimInner.setVisible(false);
    this.drawActiveRig(this.phaseStartedAt);
    this.refreshInterface(this.mode === "magnet" ? "Waiting for the riverbed…" : "Watch for a bite.");
    const wait = this.mode === "magnet"
      ? MAGNET_FISHING_CONFIG.castAnimationMs + MAGNET_FISHING_CONFIG.sinkAnimationMs + MAGNET_FISHING_CONFIG.settleAnimationMs
      : FISHING_CONFIG.castAnimationMs + (result.potentialCatch
        ? this.randomDelay(FISHING_CONFIG.biteDelayMinMs, FISHING_CONFIG.biteDelayMaxMs)
        : this.randomDelay(TARGETING_CONFIG.emptyWaitMinMs, TARGETING_CONFIG.emptyWaitMaxMs));
    if (this.mode === "fish") {
      this.later(FISHING_CONFIG.castAnimationMs, () => {
        if (this.transitioning || this.phase !== "casting") return;
        this.phase = "waiting";
        this.phaseStartedAt = performance.now();
        this.spawnRipple(this.target.x, this.target.y);
        this.refreshInterface("Float settled. Wait for a bite.");
      });
    }
    if (this.mode === "magnet") {
      this.later(MAGNET_FISHING_CONFIG.castAnimationMs, () => {
        if (this.phase !== "casting") return;
        this.phase = "sinking";
        this.phaseStartedAt = performance.now();
        this.spawnRipple(this.target.x, this.target.y);
        this.refreshInterface("Magnet sinking…");
      });
      this.later(MAGNET_FISHING_CONFIG.castAnimationMs + MAGNET_FISHING_CONFIG.sinkAnimationMs, () => {
        if (this.phase !== "sinking") return;
        this.phase = "settling";
        this.phaseStartedAt = performance.now();
        this.refreshInterface("Magnet settling on the riverbed…");
        this.spawnRipple(this.target.x, this.target.y, 0x9ce7ef);
      });
    }
    this.later(wait, () => this.readyCast());
    return true;
  }

  readyCast() {
    if (this.transitioning || !["casting", "waiting", "sinking", "settling"].includes(this.phase)) return;
    const result = this.fishing.signalReady();
    if (this.mode === "magnet" && result.ok) {
      this.phase = "ready";
      this.phaseStartedAt = performance.now();
      this.resultIcon.setText("🧲");
      this.refreshInterface("Riverbed contact! Pull now.", "bite");
      return;
    }
    if (result.code === "fish-bite") {
      this.phase = "bite";
      this.phaseStartedAt = performance.now();
      this.biteStartedAt = performance.now();
      this.resultIcon.setText("❗").setPosition(this.target.x, this.target.y - 24).setVisible(true);
      this.floatMarker.setY(this.target.y + 8);
      this.spawnRipple(this.target.x, this.target.y, 0xffef91);
      this.refreshInterface("Bite! Reel now.", "bite");
      this.vibrate([45, 35, 70]);
      this.later(FISHING_CONFIG.biteWindowMs, () => {
        if (this.phase !== "bite") return;
        const missed = this.fishing.miss("late");
        this.phase = "miss";
        this.phaseStartedAt = performance.now();
        this.showResult("💦");
        this.refreshInterface(missed.ok ? "The fish escaped. Cast again." : missed.message, "error");
      });
    } else {
      this.phase = "miss";
      this.phaseStartedAt = performance.now();
      this.showResult("💦");
      this.refreshInterface("Quiet water. Try another spot.", "error");
    }
  }

  reelEarly() {
    if (this.mode !== "fish" || this.phase !== "waiting") return false;
    const missed = this.fishing.miss("early");
    if (!missed.ok) {
      this.refreshInterface(missed.message || "Wait for a bite.", "error");
      return false;
    }
    this.phase = "miss";
    this.phaseStartedAt = performance.now();
    this.showResult("💦");
    this.refreshInterface("Too early. Wait for a bite next time.", "error");
    return true;
  }

  reel() {
    if (this.phase !== "bite" && this.phase !== "ready") {
      this.refreshInterface(this.mode === "magnet" ? "Wait for the magnet to settle." : "Wait for a bite.", "error");
      return false;
    }
    this.clearExitConfirmation();
    const quality = this.phase === "bite" ? Math.max(0, 1 - (performance.now() - this.biteStartedAt) / this.duration(FISHING_CONFIG.biteWindowMs)) : 1;
    this.phase = "reeling";
    this.phaseStartedAt = performance.now();
    this.reelStartedAt = this.phaseStartedAt;
    if (this.mode === "fish") this.resultIcon.setVisible(false);
    this.refreshInterface(this.mode === "magnet" ? "Pulling it in…" : "Reeling it in…", "bite");
    this.later(this.mode === "magnet" ? MAGNET_FISHING_CONFIG.reelAnimationMs : FISHING_CONFIG.reelAnimationMs, () => {
      if (this.transitioning || this.phase !== "reeling") return;
      const result = this.mode === "magnet"
        ? this.fishing.retrieveMagnet({ forcedRecoveryId: this.qaMode === "magnet" ? "sealed-coin-tin" : null })
        : this.fishing.reelFish({ quality, forcedItemId: this.qaMode === "fishing" ? this.spot.catchTable[0].itemId : null });
      if (!result.ok) {
        this.phase = "miss";
        this.phaseStartedAt = performance.now();
        this.refreshInterface(result.message || "The reward could not be saved.", "error");
        return;
      }
      this.phase = result.empty ? "miss" : "success";
      this.phaseStartedAt = performance.now();
      if (result.empty) {
        this.showResult("🧲");
        this.refreshInterface("Nothing here. Try another spot.", "error");
      } else if (this.mode === "magnet") {
        this.showResult(result.recovery.icon);
        this.refreshInterface(`${result.recovery.name} · +${result.rewardCoins} coins!`, "success", result);
        this.vibrate([28, 34, 52]);
      } else {
        this.showResult(result.item.icon);
        const message = result.disposition === "aquarium"
          ? `${result.item.name} joined your aquarium.`
          : result.disposition === "released-no-tank"
            ? `${result.item.name} released. Place a tank to keep one.`
            : result.disposition === "released-full"
              ? `${result.item.name} released. That tank section is full.`
              : `${result.item.name} added to your inventory.`;
        this.refreshInterface(message, "success", result);
        this.vibrate(result.disposition.startsWith("released") ? [24, 35, 24] : [28, 34, 52]);
      }
    });
    return true;
  }

  showResult(icon) {
    this.floatMarker.setVisible(false);
    const fishPose = this.fishingPose(this.target);
    const resultPosition = this.mode === "magnet"
      ? this.layoutSocket(FISHING_LAYOUT_SOCKET_IDS.MAGNET_REST).position
      : { x: fishPose.liftTip.x, y: fishPose.liftTip.y + this.sceneLayout.presentation.resultLiftOffsetY };
    this.resultIcon.setText(icon).setVisible(true).setAlpha(1).setScale(1.2).setPosition(resultPosition.x, resultPosition.y);
    this.aim.setVisible(true).setPosition(this.target.x, this.target.y);
    this.aimInner.setVisible(true).setPosition(this.target.x, this.target.y);
    this.tweens.add({ targets: this.resultIcon, y: this.resultIcon.y - this.sceneLayout.presentation.resultBounceY, duration: 380, yoyo: true, ease: "Sine.easeOut" });
  }

  fishingPose(target = this.target) {
    const base = this.layoutSocket(FISHING_LAYOUT_SOCKET_IDS.FISH_ROD_GRIP).position;
    const idleTip = this.layoutSocket(FISHING_LAYOUT_SOCKET_IDS.FISH_ROD_IDLE_TIP).position;
    const rules = this.sceneLayout.rig.fish;
    const waterTip = {
      x: clamp(base.x + (target.x - base.x) * rules.castBlend, rules.waterTipBounds.minX, rules.waterTipBounds.maxX),
      y: clamp(target.y + rules.targetOffsetY, rules.waterTipBounds.minY, rules.waterTipBounds.maxY),
    };
    return {
      base,
      idleTip,
      waterTip,
      liftTip: {
        x: clamp(waterTip.x + (base.x - waterTip.x) * rules.liftBlend, rules.liftTipBounds.minX, rules.liftTipBounds.maxX),
        y: clamp(waterTip.y + rules.liftOffsetY, rules.liftTipBounds.minY, rules.liftTipBounds.maxY),
      },
    };
  }

  drawRod(base, tip) {
    const dx = tip.x - base.x;
    const dy = tip.y - base.y;
    const length = Math.hypot(dx, dy) || 1;
    const normalX = -dy / length;
    const normalY = dx / length;
    const gripEnd = { x: base.x + dx * 0.17, y: base.y + dy * 0.17 };
    this.rod.clear();
    this.rod.lineStyle(12, 0x172638, 1).lineBetween(base.x, base.y, tip.x, tip.y);
    this.rod.lineStyle(7, 0x8b542d, 1).lineBetween(base.x, base.y, tip.x, tip.y);
    this.rod.lineStyle(3, 0xd08a45, 1).lineBetween(gripEnd.x, gripEnd.y, tip.x, tip.y);
    this.rod.lineStyle(10, 0x432d26, 1).lineBetween(base.x, base.y, gripEnd.x, gripEnd.y);
    this.rod.fillStyle(0xf4d17e, 1).fillCircle(base.x + dx * 0.12 + normalX * 12, base.y + dy * 0.12 + normalY * 12, 9);
    this.rod.lineStyle(3, 0x172638, 1).strokeCircle(base.x + dx * 0.12 + normalX * 12, base.y + dy * 0.12 + normalY * 12, 9);
    this.rod.fillStyle(0xf4deb0, 1).fillCircle(tip.x, tip.y, 5);
  }

  drawCurvedLine(fromX, fromY, toX, toY, { arc = 0, sag = 0 } = {}) {
    this.line.clear();
    this.line.lineStyle(3, 0xfff4cf, 0.9);
    const controlX = (fromX + toX) / 2;
    const controlY = (fromY + toY) / 2 - arc + sag;
    this.line.beginPath(); this.line.moveTo(fromX, fromY);
    for (let step = 1; step <= 18; step += 1) {
      const t = step / 18;
      const inverse = 1 - t;
      this.line.lineTo(
        inverse * inverse * fromX + 2 * inverse * t * controlX + t * t * toX,
        inverse * inverse * fromY + 2 * inverse * t * controlY + t * t * toY,
      );
    }
    this.line.strokePath();
  }

  drawActiveRig(now = performance.now()) {
    if (this.mode === "magnet") {
      const rest = this.layoutSocket(FISHING_LAYOUT_SOCKET_IDS.MAGNET_REST).position;
      const ropeStart = this.layoutSocket(FISHING_LAYOUT_SOCKET_IDS.MAGNET_ROPE_START).position;
      const rules = this.sceneLayout.rig.magnet;
      this.rod.clear();
      let magnet = { ...rest };
      if (this.phase === "casting") {
        const progress = ease((now - this.castStartedAt) / this.duration(MAGNET_FISHING_CONFIG.castAnimationMs));
        magnet = {
          x: lerp(rest.x, this.target.x, progress),
          y: lerp(rest.y, this.target.y, progress) - Math.sin(Math.PI * progress) * rules.castArc,
        };
      } else if (this.phase === "sinking") {
        const progress = ease((now - this.phaseStartedAt) / this.duration(MAGNET_FISHING_CONFIG.sinkAnimationMs));
        magnet = { x: this.target.x, y: lerp(this.target.y, this.target.y + rules.bedOffset, progress) };
      } else if (["settling", "ready"].includes(this.phase)) {
        magnet = { x: this.target.x, y: this.target.y + rules.bedOffset + Math.sin(now / 230) * 2 };
      } else if (this.phase === "reeling") {
        const progress = ease((now - this.reelStartedAt) / this.duration(MAGNET_FISHING_CONFIG.reelAnimationMs));
        magnet = {
          x: lerp(this.target.x, rest.x, progress),
          y: lerp(this.target.y + rules.bedOffset, rest.y, progress) - Math.sin(Math.PI * progress) * rules.reelArc,
        };
      }
      if (!["success", "miss"].includes(this.phase)) this.resultIcon.setText("🧲").setVisible(true).setPosition(magnet.x, magnet.y);
      this.drawCurvedLine(ropeStart.x, ropeStart.y, magnet.x - 20, magnet.y + 14, { sag: 34 });
      return;
    }

    const pose = this.fishingPose(this.target);
    let tip = { ...pose.idleTip };
    let hook = null;
    let lineArc = 0;
    if (this.phase === "casting") {
      const progress = ease((now - this.castStartedAt) / this.duration(FISHING_CONFIG.castAnimationMs));
      tip = { x: lerp(pose.idleTip.x, pose.waterTip.x, progress), y: lerp(pose.idleTip.y, pose.waterTip.y, progress) };
      hook = {
        x: lerp(pose.idleTip.x, this.target.x, progress),
        y: lerp(pose.idleTip.y, this.target.y, progress) - Math.sin(Math.PI * progress) * 146,
      };
      lineArc = 34;
    } else if (["waiting", "bite"].includes(this.phase)) {
      tip = { ...pose.waterTip };
      hook = { x: this.target.x, y: this.target.y + (this.phase === "bite" ? 9 + Math.sin(now / 35) * 9 : Math.sin(now / 350) * 3) };
    } else if (this.phase === "reeling") {
      const progress = ease((now - this.reelStartedAt) / this.duration(FISHING_CONFIG.reelAnimationMs));
      tip = { x: lerp(pose.waterTip.x, pose.liftTip.x, progress), y: lerp(pose.waterTip.y, pose.liftTip.y, progress) };
      hook = {
        x: lerp(this.target.x, pose.liftTip.x, progress),
        y: lerp(this.target.y, pose.liftTip.y + this.sceneLayout.presentation.resultLiftOffsetY, progress) - Math.sin(Math.PI * progress) * 50,
      };
    } else if (["success", "miss"].includes(this.phase)) {
      tip = { ...pose.liftTip };
      hook = { x: pose.liftTip.x, y: pose.liftTip.y + this.sceneLayout.presentation.resultLiftOffsetY };
    }
    this.drawRod(pose.base, tip);
    if (!hook) {
      this.line.clear();
      this.floatMarker.setVisible(false);
      return;
    }
    this.drawCurvedLine(tip.x, tip.y, hook.x, hook.y, { arc: lineArc });
    if (["casting", "waiting", "bite"].includes(this.phase)) this.floatMarker.setVisible(true).setPosition(hook.x, hook.y);
  }

  spawnRipple(x, y, colour = 0xbceff4) {
    for (let index = 0; index < 3; index += 1) {
      const ring = this.add.ellipse(x, y + 7, 32, 12).setStrokeStyle(3, colour, 0.75).setDepth(22).setScale(0.35);
      this.tweens.add({ targets: ring, scaleX: 1.7 + index * 0.35, scaleY: 1.7 + index * 0.35, alpha: 0, delay: index * 90, duration: 650, onComplete: () => ring.destroy() });
    }
  }

  update() {
    this.drawActiveRig(performance.now());
  }

  duration(milliseconds) {
    return Math.max(70, Math.round(milliseconds * this.timingScale));
  }

  randomDelay(minimum, maximum) {
    if (this.qaMode === "fishing" || this.qaMode === "magnet") return minimum;
    return Phaser.Math.Between(minimum, maximum);
  }

  vibrate(pattern) {
    try {
      return typeof navigator !== "undefined" && typeof navigator.vibrate === "function"
        ? navigator.vibrate(pattern)
        : false;
    } catch {
      return false;
    }
  }

  later(milliseconds, callback) {
    const timer = this.time.delayedCall(this.duration(milliseconds), callback);
    this.pendingTimers.push(timer);
    return timer;
  }

  bindInterface() {
    this.hud = document.querySelector("#fishing-hud");
    this.status = document.querySelector("#fishing-status");
    this.castButton = document.querySelector("#fishing-cast");
    this.reelButton = document.querySelector("#fishing-reel");
    this.actions = document.querySelector(".fishing-actions");
    this.exitButton = document.querySelector("#fishing-exit");
    this.onCast = () => this.cast();
    this.onReel = () => this.reel();
    this.onExit = () => this.requestExit();
    this.castButton?.addEventListener("click", this.onCast);
    this.reelButton?.addEventListener("click", this.onReel);
    this.exitButton?.addEventListener("click", this.onExit);
    this.onKeyDown = (event) => {
      if (event.key === "Escape") { event.preventDefault(); this.requestExit(); return; }
      if (["Enter", " "].includes(event.key)) {
        event.preventDefault();
        if (this.phase === "waiting" && this.mode === "fish") this.reelEarly();
        else if (["bite", "ready"].includes(this.phase)) this.reel();
        else if (["idle", "success", "miss"].includes(this.phase)) this.cast();
        return;
      }
      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key) || !["idle", "success", "miss"].includes(this.phase)) return;
      event.preventDefault();
      const dx = event.key === "ArrowLeft" ? -34 : event.key === "ArrowRight" ? 34 : 0;
      const dy = event.key === "ArrowUp" ? -28 : event.key === "ArrowDown" ? 28 : 0;
      const area = this.layoutZone(fishingWaterZoneId(this.mode)).geometry;
      this.setTarget(Phaser.Math.Clamp(this.target.x + dx, area.x, area.x + area.width), Phaser.Math.Clamp(this.target.y + dy, area.y, area.y + area.height));
    };
    window.addEventListener("keydown", this.onKeyDown);
  }

  setSceneInterface() {
    document.body.dataset.gameScene = this.scene.key;
    const badge = document.querySelector(".milestone-badge");
    const location = document.querySelector("#location-status");
    const hint = document.querySelector("#control-hint");
    if (badge) badge.textContent = this.mode === "magnet" ? "MAGNET FISHING" : this.spot.id === "fishing-reedbank" ? "FISHING + HOME AQUARIUM" : "FISHING";
    if (location) location.textContent = this.spot.title;
    if (hint) hint.textContent = "Tap water or use arrows to aim · Enter/Space casts or reels · Escape exits safely";
    const landscapeMessage = document.querySelector("#landscape-required-message");
    if (landscapeMessage) landscapeMessage.textContent = "Turn your device sideways to play.";
    document.querySelector("#fishing-mode-label").textContent = this.mode === "magnet" ? "MAGNET FISHING" : "FISHING";
    document.querySelector("#fishing-title").textContent = `${this.spot.icon} ${this.spot.shortTitle}`;
    if (this.exitButton) {
      this.exitButton.textContent = "Exit";
      this.exitButton.setAttribute("aria-label", `Exit ${this.mode === "magnet" ? "Magnet Fishing" : "Fishing"} safely`);
    }
    const lastResult = document.querySelector("#fishing-last-result");
    if (lastResult) { lastResult.textContent = ""; lastResult.classList.add("hidden"); }
    const aquarium = this.fishing.getSnapshot().aquarium;
    const aquariumHelp = this.spot.id !== "fishing-reedbank" ? "" : aquarium.placed
      ? ` ${aquarium.totalFish} ornamental fish currently live in your placed home tank.`
      : " No tank is placed, so ornamental catches will be safely released.";
    document.querySelector("#fishing-description").textContent = `${this.spot.description}${aquariumHelp}`;
    this.hud?.classList.remove("hidden");
  }

  refreshInterface(message, status = "neutral", result = null) {
    const progress = this.fishing.getSnapshot();
    const castsLeft = this.fishing.castsLeft(this.mode);
    if (this.status) { this.status.textContent = message; this.status.dataset.status = status; }
    document.querySelector("#fishing-casts").textContent = `${castsLeft} / 5`;
    document.querySelector("#fishing-total").textContent = String(this.mode === "magnet" ? progress.magnet.totalPulls : progress.totalCaught);
    document.querySelector("#fishing-streak").textContent = String(this.mode === "magnet" ? progress.magnet.currentPullStreak : progress.currentStreak);
    const catchList = document.querySelector("#fishing-catch-list");
    if (catchList) catchList.textContent = this.mode === "magnet"
      ? "8 named finds · common to legendary"
      : this.spot.catchTable.map((entry) => fishingItem(entry.itemId)?.name).filter(Boolean).join(" · ");
    if (this.castButton) {
      this.castButton.disabled = !["idle", "success", "miss"].includes(this.phase) || castsLeft < 1;
      this.castButton.classList.toggle("hidden", !["idle", "success", "miss"].includes(this.phase));
      this.castButton.textContent = castsLeft < 1 ? "Done today" : `${this.mode === "magnet" ? "🧲" : "🎣"} Cast`;
    }
    if (this.reelButton) {
      this.reelButton.disabled = !["bite", "ready"].includes(this.phase);
      this.reelButton.classList.toggle("hidden", !["bite", "ready"].includes(this.phase));
      this.reelButton.classList.toggle("bite", ["bite", "ready"].includes(this.phase));
      this.reelButton.textContent = this.mode === "magnet" ? "🪢 Pull" : "⚡ Reel";
    }
    this.actions?.classList.toggle("hidden", !["idle", "success", "miss", "bite", "ready"].includes(this.phase));
    if (result) {
      const lastResult = document.querySelector("#fishing-last-result");
      if (lastResult) {
        lastResult.textContent = this.mode === "magnet"
          ? `${result.recovery.icon} ${result.recovery.name} · +${result.rewardCoins}`
          : `${result.item.icon} ${result.item.name} · ${result.disposition === "inventory" ? "Inventory" : result.disposition === "aquarium" ? "Aquarium" : "Released"}`;
        lastResult.classList.remove("hidden");
      }
    }
    this.updateDomState();
  }

  clearExitConfirmation() {
    this.confirmingExit = false;
    if (this.exitButton) {
      this.exitButton.textContent = "Exit";
      this.exitButton.dataset.confirming = "false";
    }
  }

  requestExit() {
    if (this.transitioning) return false;
    const castInProgress = ["casting", "waiting", "bite", "ready", "reeling"].includes(this.phase);
    if (!castInProgress || this.confirmingExit) return this.returnToTown();
    this.confirmingExit = true;
    if (this.exitButton) {
      this.exitButton.textContent = "Confirm Exit";
      this.exitButton.dataset.confirming = "true";
    }
    this.refreshInterface("Leave this cast? Tap Confirm Exit.", "error");
    return false;
  }

  updateDomState() {
    if (!import.meta.env.DEV) return;
    const game = document.querySelector("#game");
    if (!game) return;
    game.dataset.scene = this.scene.key;
    game.dataset.fishingMode = this.mode;
    game.dataset.fishingPhase = this.phase;
    game.dataset.fishingCastsLeft = String(this.fishing.castsLeft(this.mode));
    game.dataset.fishingTarget = `${Math.round(this.target.x)},${Math.round(this.target.y)}`;
  }

  returnToTown() {
    if (this.transitioning) return false;
    this.transitioning = true;
    const session = this.fishing.getActiveSession();
    this.fishing.cancel();
    this.cameras.main.fadeOut(220, 12, 35, 42);
    this.time.delayedCall(240, () => this.scene.start("TownScene", { returnPosition: session?.returnPosition, returnFacing: session?.returnFacing || "down" }));
    return true;
  }

  shutdownScene() {
    this.referenceOverlay?.destroy?.();
    this.referenceOverlay = null;
    for (const timer of this.pendingTimers) timer.remove(false);
    this.castButton?.removeEventListener("click", this.onCast);
    this.reelButton?.removeEventListener("click", this.onReel);
    this.exitButton?.removeEventListener("click", this.onExit);
    window.removeEventListener("keydown", this.onKeyDown);
    this.hud?.classList.add("hidden");
    this.fishing?.cancel?.();
    this.worldSimulation?.setPaused("activity", false);
    this.npcTownLife?.setPaused("activity", false);
  }

  getMilestoneState() {
    return { scene: this.scene.key, mode: this.mode, spotId: this.spot.id, phase: this.phase, castsLeft: this.fishing.castsLeft(this.mode), persistent: true, inventoryRewards: true, landscapeRequired: true, aquarium: this.fishing.getSnapshot().aquarium };
  }
}
